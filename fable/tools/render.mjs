#!/usr/bin/env node
// MERGE render harness. Every frame is ENGINE.render(t): a pure function of song time, so any frame can be rendered alone.
//   node fable/tools/render.mjs --show /fable/show/lookdev_world.js --stills 12.5:a.png,69.7:b.png [--q "shot=2"] [--mb 8]
//   node fable/tools/render.mjs --show ... --sheet 0:30:2:out.jpg[:cols]            (timestamped contact sheet)
//   node fable/tools/render.mjs --show ... --from 0 --to 28 --mp4 out.mp4 [--workers 3] [--audio] [--mb 4]
// Options: --res 1920x1080  --fps 30  --mb N (motion-blur/AA sub-samples; default 1 for stills and sheets, 4 for mp4)  --shutter 0.5
//          --warp analysis_v3/warp_v2_to_v3.json  time map: --from/--to/--stills/--sheet times are NEW song time; the show renders at the OLD time (beats table inverted,
//                      piecewise linear by beat index, end slopes extrapolated; motion-blur sub-samples are spread in new time then mapped); --audio then muxes the NEW audio
//          --frames DIR  (with --from/--to) write f_%05d.jpg (frame k = from*fps + k, numbered from 0 at new time 0) plus meta.json instead of an mp4; --jpgq 2 (ffmpeg qscale, lower = better)
//          plate flags (page query, any show): --q "notype=1&nohud=1" switch off the show's own lyric type / HUD + overlay
//          --q "k=v&k=v" (page query)  --crf 14  --preset slow  --verify (render the first frame twice and compare hashes)
// Frames travel page -> harness as raw RGBA in one binary WebSocket message (no base64, no PNG encode in the page).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..');
const require = createRequire(path.join(ROOT, 'engine', 'node_modules', 'x.js'));
const puppeteer = require('puppeteer-core');
const { WebSocketServer } = require('ws');
const FF = process.env.FFMPEG || '/usr/bin/ffmpeg';
const FONT = path.join(ROOT, 'engine', 'fonts', 'JetBrainsMono[wght].ttf');
const TMPD = '/tmp/mfb'; fs.mkdirSync(TMPD, { recursive: true }); process.env.TMPDIR = TMPD;       // Chrome needs a short TMPDIR
const WORK = path.join(ROOT, 'work_fable', 'tmp'); fs.mkdirSync(WORK, { recursive: true });

const argv = process.argv.slice(2), args = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) { const k = argv[i].slice(2), v = argv[i + 1]; if (v === undefined || v.startsWith('--')) args[k] = true; else { args[k] = v; i++; } }
const [W, H] = String(args.res || '1920x1080').split('x').map(Number);
const FPS = +(args.fps || 30);
const SHOW = args.show || '/fable/show/lookdev_world.js';
const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.bin': 'application/octet-stream' };

const WARP = args.warp ? JSON.parse(fs.readFileSync(path.resolve(ROOT, args.warp), 'utf8')).beats.map((b) => [b.new, b.old]) : null;   // [[new, old], ...] monotone
const AUDIO = WARP ? path.join(ROOT, 'inputs', 'Merge (keychange down).wav') : path.join(ROOT, 'inputs', 'Merge.mp3');
const frames = new Map();   // "wid:i" -> Buffer
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const [u, qs] = req.url.split('?');
      if (req.method === 'POST' && u === '/__frame') {
        const q = new URLSearchParams(qs); const chunks = [];
        req.on('data', (c) => chunks.push(c)); req.on('end', () => { frames.set(`${q.get('wid')}:${q.get('i')}`, Buffer.concat(chunks)); res.writeHead(200); res.end('ok'); });
        return;
      }
      const f = path.join(ROOT, decodeURIComponent(u));
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      fs.createReadStream(f).pipe(res);
    });
    // frames arrive as one binary WebSocket message each (several times faster than an HTTP POST of 8 MB from Chrome)
    const wss = new WebSocketServer({ server: srv, path: '/__ws', maxPayload: 1 << 30, perMessageDeflate: false });
    wss.on('connection', (ws) => { let key = null; ws.on('message', (data, isBinary) => { if (!isBinary) { key = data.toString(); return; } frames.set(key, data); ws.send('ok'); }); });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function openPage(port, wid = 0) {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new',
    args: ['--no-sandbox', '--disable-gpu-watchdog', '--font-render-hinting=none', '--use-angle=vulkan', '--ignore-gpu-blocklist', '--enable-gpu', '--disable-background-timer-throttling', '--disable-renderer-backgrounding'] });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  page.on('console', (m) => { const t = m.text(); if (!/favicon|404/.test(t)) console.log(`[page${wid}]`, t); });
  page.on('pageerror', (e) => console.log(`[pageerror${wid}]`, e.message));
  const q = `show=${encodeURIComponent(SHOW)}&w=${W}&h=${H}&fps=${FPS}&wid=${wid}${args.q ? '&' + args.q : ''}`;
  await page.goto(`http://127.0.0.1:${port}/fable/engine/index.html?${q}`, { waitUntil: 'load' });
  await page.waitForFunction('window.ENGINE && (window.ENGINE.ready === true || window.ENGINE.error)', { timeout: 240000 });
  if (WARP) await page.evaluate((B) => { const n = B.length;       // new time -> old time; outside the table, extrapolate with the end slopes (the show clamps at the old film's end)
    window.ENGINE.warp = (x) => { let i; if (x <= B[0][0]) i = 0; else if (x >= B[n - 1][0]) i = n - 2; else { let lo = 0, hi = n - 1; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (B[m][0] <= x) lo = m; else hi = m; } i = lo; }
      return B[i][1] + (x - B[i][0]) * (B[i + 1][1] - B[i][1]) / (B[i + 1][0] - B[i][0]); }; }, WARP);
  const err = await page.evaluate(() => window.ENGINE.error); if (err) { await browser.close(); throw new Error('engine: ' + err); }
  return { browser, page };
}
async function frame(page, t, i, wid, mb) {
  await page.evaluate((t, i, o) => window.ENGINE.renderAndPost(t, i, o), t, i, { mb, shutter: +(args.shutter || 0.5) });
  const k = `${wid}:${i}`, b = frames.get(k); frames.delete(k);
  if (!b || b.length !== W * H * 4) throw new Error(`frame ${i}: bad readback (${b ? b.length : 'none'})`);
  return b;
}
const VF = 'vflip,scale=out_color_matrix=bt709:out_range=tv,format=yuv420p';
const TAGS = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
function rawTo(buf, vf, out, extra = []) {
  const r = spawnSync(FF, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-i', 'pipe:0', '-vf', vf, '-frames:v', '1', ...extra, out], { input: buf, maxBuffer: 1 << 28 });
  if (r.status !== 0) throw new Error('ffmpeg: ' + r.stderr);
}
const mmss = (t) => `${String(Math.floor(t / 60)).padStart(2, '0')}\\:${(t % 60).toFixed(t % 1 ? 1 : 0).padStart(t % 1 ? 4 : 2, '0')}`;

async function main() {
  const srv = await serve(); const port = srv.address().port;
  const t00 = Date.now();
  if (args.bench !== undefined) {
    // --bench <t>: time ENGINE.render at song time t (ms per sub-sample render incl. gl.finish, and ms for readback+POST)
    const { browser, page } = await openPage(port); const t = +args.bench || 0, mb = +(args.mb || 1);
    const r = await page.evaluate(async (t, mb) => { const E = window.ENGINE, gl = E.engine.gl, W = E.engine.W, H = E.engine.H; const one = new Uint8Array(4), full = new Uint8Array(W * H * 4);
      const sync = () => { gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, one); };
      E.render(t, { mb }); sync(); let a = performance.now(); const n = 12; for (let i = 0; i < n; i++) { E.render(t + i / 30, { mb }); sync(); } const rms = (performance.now() - a) / n;
      a = performance.now(); for (let i = 0; i < 5; i++) gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, full); const rd = (performance.now() - a) / 5;
      a = performance.now(); for (let i = 0; i < 5; i++) await E.post(i); const po = (performance.now() - a) / 5 - rd; return { rms, rd, po }; }, t, mb);
    frames.clear(); console.log(`bench t=${t} mb=${mb}: render ${r.rms.toFixed(1)} ms/frame (${(r.rms / mb).toFixed(1)} ms/sub-sample), readPixels ${r.rd.toFixed(1)} ms, transfer ${r.po.toFixed(1)} ms`);
    await browser.close();
  } else if (args.stills) {
    const { browser, page } = await openPage(port); const mb = +(args.mb || 1);
    for (const [k, item] of String(args.stills).split(',').entries()) {
      const j = item.indexOf(':'); const t = +item.slice(0, j), out = path.resolve(item.slice(j + 1)); fs.mkdirSync(path.dirname(out), { recursive: true });
      const s = Date.now(); const b = await frame(page, t, k, 0, mb);
      if (args.verify) { const b2 = await frame(page, t, k, 0, mb); console.log(`verify t=${t}: ${crypto.createHash('md5').update(b).digest('hex') === crypto.createHash('md5').update(b2).digest('hex') ? 'IDENTICAL' : 'DIFFERENT'}`); }
      rawTo(b, 'vflip', out); console.log(`still ${t} -> ${out} (${Date.now() - s} ms)`);
    }
    await browser.close();
  } else if (args.sheet) {
    const p = String(args.sheet).split(':'); const from = +p[0], to = +p[1], step = +p[2], out = path.resolve(p[3]), cols = +(p[4] || 5); const mb = +(args.mb || 1);
    const { browser, page } = await openPage(port); const dir = fs.mkdtempSync(path.join(WORK, 'sheet-')); let n = 0;
    for (let t = from; t <= to + 1e-6; t += step, n++) { const b = await frame(page, t, n, 0, mb);
      rawTo(b, `vflip,scale=480:-2,drawtext=fontfile='${FONT.replace(/[\[\],:]/g, '\\$&')}':text='${mmss(t)}':x=10:y=8:fontsize=24:fontcolor=white:box=1:boxcolor=black@0.6:boxborderw=6`, path.join(dir, `t_${String(n).padStart(4, '0')}.png`)); }
    await browser.close(); fs.mkdirSync(path.dirname(out), { recursive: true });
    const rows = Math.ceil(n / cols);
    const r = spawnSync(FF, ['-y', '-v', 'error', '-framerate', '1', '-i', path.join(dir, 't_%04d.png'), '-vf', `tile=${cols}x${rows}:padding=4:margin=4`, '-frames:v', '1', '-q:v', '2', out]); if (r.status !== 0) throw new Error(String(r.stderr));
    fs.rmSync(dir, { recursive: true }); console.log(`sheet ${n} frames -> ${out}`);
  } else if (args.mp4 || args.frames) {
    const FR = args.frames ? path.resolve(args.frames) : null; const out = FR || path.resolve(args.mp4); fs.mkdirSync(FR || path.dirname(out), { recursive: true });
    const f0 = Math.round(+(args.from || 0) * FPS), f1 = Math.round(+(args.to || 10) * FPS), N = Math.max(1, Math.min(+(args.workers || 1), f1 - f0)); const mb = +(args.mb || 4);
    let tEval = 0, tPipe = 0; const dir = fs.mkdtempSync(path.join(WORK, 'seg-')); const per = Math.ceil((f1 - f0) / N); let done = 0; const tStart = Date.now();
    const jobs = [...Array(N)].map(async (_, w) => {
      const a = f0 + w * per, b = Math.min(f1, a + per); if (a >= b) return null; const seg = path.join(dir, `seg_${String(w).padStart(3, '0')}.mp4`);
      const { browser, page } = await openPage(port, w);
      const ff = FR ? spawn(FF, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', 'pipe:0', '-vf', 'vflip,scale=out_color_matrix=bt709:out_range=pc,format=yuvj420p', '-c:v', 'mjpeg', '-q:v', String(args.jpgq || 2), '-start_number', String(a), path.join(FR, 'f_%05d.jpg')], { stdio: ['pipe', 'inherit', 'inherit'] })
        : spawn(FF, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', 'pipe:0', '-vf', VF, '-c:v', 'libx264', '-preset', args.preset || 'slow', '-crf', String(args.crf || 14), ...TAGS, '-r', String(FPS), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
      for (let f = a; f < b; f++) { const s = Date.now(); const buf = await frame(page, f / FPS, f, w, mb); const s2 = Date.now(); if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r)); done++; tEval += s2 - s; tPipe += Date.now() - s2;
        if (w === 0 && (f - a) % 30 === 0) process.stdout.write(`  ${done}/${f1 - f0} frames  ${(done / ((Date.now() - tStart) / 1000)).toFixed(2)} fps total  (last frame ${Date.now() - s} ms)\n`); }
      ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await browser.close(); return seg;
    });
    const segs = (await Promise.all(jobs)).filter(Boolean);
    if (FR) { fs.rmSync(dir, { recursive: true }); const sec = (Date.now() - tStart) / 1000; console.log(`frames ${f1 - f0} (${f0}..${f1 - 1}) in ${sec.toFixed(1)} s = ${((f1 - f0) / sec).toFixed(2)} fps (${N} workers, mb ${mb}) -> ${FR}`); srv.close(); return; }
    const list = path.join(dir, 'list.txt'); fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
    const a = ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list];
    if (args.audio) a.push('-ss', String(f0 / FPS), '-t', String((f1 - f0) / FPS), '-i', AUDIO, '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '320k');
    a.push('-c:v', 'copy', ...TAGS, '-movflags', '+faststart', out);
    const r = spawnSync(FF, a); if (r.status !== 0) throw new Error(String(r.stderr));
    fs.rmSync(dir, { recursive: true });
    const sec = (Date.now() - tStart) / 1000; console.log(`mp4 ${f1 - f0} frames in ${sec.toFixed(1)} s = ${((f1 - f0) / sec).toFixed(2)} fps (${N} workers, mb ${mb}; per frame: render+readback ${(tEval / (f1 - f0)).toFixed(0)} ms, encode pipe ${(tPipe / (f1 - f0)).toFixed(0)} ms) -> ${out}`);
  } else console.log('nothing to do: pass --stills, --sheet or --mp4');
  srv.close(); console.log(`total ${((Date.now() - t00) / 1000).toFixed(1)} s`);
}
main().catch((e) => { console.error(e); process.exit(1); });
