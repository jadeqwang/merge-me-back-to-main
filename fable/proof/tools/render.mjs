#!/usr/bin/env node
// Render harness for the proof (a small copy of fable/tools/render.mjs, driving fable/proof/index.html instead of the engine).
// Frame k of the proof is song time t = t0 + k/fps, t0 = bar 28 downbeat read from the timing file; every frame is PROOF.render(t).
//   node fable/proof/tools/render.mjs --timing /analysis_v2/timing.json --mp4 out.mp4 [--audio inputs/Merge.wav] [--workers 4] [--keep 10,300,600 --keepdir dir]
//   node fable/proof/tools/render.mjs --timing ... --frames 10:a.png,300:b.png [--fresh]   (frame index k; --fresh = new browser per frame)
//   node fable/proof/tools/render.mjs --timing ... --stills 62.73:a.png                     (song time)
//   node fable/proof/tools/render.mjs --timing ... --info out.json                          (segment, events, measured type sizes)
//   node fable/proof/tools/render.mjs --timing ... --probe 1860:1890 out.json               (turn-patch positions for frames k0..k1)
// Options: --res 1920x1080 --fps 30 --crf 16 --preset slow --plates /work_fable/proof/plates
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..');
const require = createRequire(path.join(ROOT, 'engine', 'node_modules', 'x.js'));
const puppeteer = require('puppeteer-core');
const { WebSocketServer } = require('ws');
const FF = process.env.FFMPEG || '/usr/bin/ffmpeg';
const TMPD = '/tmp/mfb'; fs.mkdirSync(TMPD, { recursive: true }); process.env.TMPDIR = TMPD;
const WORK = path.join(ROOT, 'work_fable', 'proof', 'tmp'); fs.mkdirSync(WORK, { recursive: true });

const argv = process.argv.slice(2), args = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) { const k = argv[i].slice(2), v = argv[i + 1]; if (v === undefined || v.startsWith('--')) args[k] = true; else { args[k] = v; i++; } }
const [W, H] = String(args.res || '1920x1080').split('x').map(Number);
const FPS = +(args.fps || 30);
const TIMING = args.timing || '/analysis_v2/timing.json';
const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.ttf': 'font/ttf' };

const frames = new Map();
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const [u] = req.url.split('?'); const f = path.join(ROOT, decodeURIComponent(u));
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(res);
    });
    const wss = new WebSocketServer({ server: srv, path: '/__ws', maxPayload: 1 << 30, perMessageDeflate: false });
    wss.on('connection', (ws) => { let key = null; ws.on('message', (data, isBinary) => { if (!isBinary) { key = data.toString(); return; } frames.set(key, data); ws.send('ok'); }); });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}
async function openPage(port, wid = 0) {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--font-render-hinting=none', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-gpu'] });
  const page = await browser.newPage(); await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  page.on('console', (m) => { const t = m.text(); if (!/favicon|404/.test(t)) console.log(`[page${wid}]`, t); });
  page.on('pageerror', (e) => console.log(`[pageerror${wid}]`, e.message));
  const q = `timing=${encodeURIComponent(TIMING)}&w=${W}&h=${H}&fps=${FPS}&wid=${wid}${args.plates ? '&plates=' + encodeURIComponent(args.plates) : ''}`;
  await page.goto(`http://127.0.0.1:${port}/fable/proof/index.html?${q}`, { waitUntil: 'load' });
  await page.waitForFunction('window.PROOF && (window.PROOF.ready === true || window.PROOF.error)', { timeout: 240000 });
  const err = await page.evaluate(() => window.PROOF.error); if (err) { await browser.close(); throw new Error('proof: ' + err); }
  const info = await page.evaluate(() => ({ t0: PROOF.t0, n: PROOF.n, tStop: PROOF.tStop }));
  return { browser, page, info };
}
async function frame(page, t, i, wid) {
  await page.evaluate((t, i) => window.PROOF.renderAndPost(t, i), t, i);
  const k = `${wid}:${i}`, b = frames.get(k); frames.delete(k);
  if (!b || b.length !== W * H * 4) throw new Error(`frame ${i}: bad readback (${b ? b.length : 'none'})`);
  return b;
}
const VF = 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p';
const TAGS = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv'];
function png(buf, out) { const r = spawnSync(FF, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-i', 'pipe:0', '-frames:v', '1', '-pix_fmt', 'rgb24', out], { input: buf, maxBuffer: 1 << 28 }); if (r.status !== 0) throw new Error('ffmpeg: ' + r.stderr); }

async function main() {
  const srv = await serve(); const port = srv.address().port; const t00 = Date.now();
  if (args.info) {
    const { browser, page } = await openPage(port);
    const info = await page.evaluate(() => ({ t0: PROOF.t0, tStop: PROOF.tStop, n: PROOF.n, fps: PROOF.FPS, timing: PROOF.timing, barBeatWorst: PROOF.barBeatWorst, sizes: PROOF.sizes, events: PROOF.events, meta: PROOF.meta }));
    fs.writeFileSync(path.resolve(args.info), JSON.stringify(info, null, 1)); console.log('info ->', args.info); await browser.close();
  } else if (args.probe) {
    const [a, b] = String(args.probe).split(':').map(Number); const out = argv[argv.indexOf('--probe') + 2];
    const { browser, page, info } = await openPage(port); const res = [];
    for (let k = a; k <= b; k++) res.push({ k, ...(await page.evaluate((t) => PROOF.probe(t), info.t0 + k / FPS)) });
    fs.writeFileSync(path.resolve(out), JSON.stringify(res)); console.log('probe ->', out); await browser.close();
  } else if (args.frames || args.stills) {
    const items = String(args.frames || args.stills).split(',').map((s) => { const j = s.indexOf(':'); return [+s.slice(0, j), path.resolve(s.slice(j + 1))]; });
    let P = null;
    for (const [idx, [x, out]] of items.entries()) {
      if (!P || args.fresh) { if (P) await P.browser.close(); P = await openPage(port); }
      const t = args.frames ? P.info.t0 + x / FPS : x; fs.mkdirSync(path.dirname(out), { recursive: true });
      const s = Date.now(); png(await frame(P.page, t, idx, 0), out); console.log(`frame t=${t.toFixed(4)} -> ${out} (${Date.now() - s} ms)`);
    }
    await P.browser.close();
  } else if (args.mp4) {
    const out = path.resolve(args.mp4); fs.mkdirSync(path.dirname(out), { recursive: true });
    const probe = await openPage(port); const { t0, n } = probe.info; await probe.browser.close();
    const N = Math.max(1, +(args.workers || 1)), per = Math.ceil(n / N); const keep = new Set(String(args.keep || '').split(',').filter(Boolean).map(Number));
    const kdir = path.resolve(args.keepdir || path.join(path.dirname(out), 'keep')); if (keep.size) fs.mkdirSync(kdir, { recursive: true });
    const dir = fs.mkdtempSync(path.join(WORK, 'seg-')); let done = 0; const tS = Date.now();
    const jobs = [...Array(N)].map(async (_, w) => {
      const a = w * per, b = Math.min(n, a + per); if (a >= b) return null; const seg = path.join(dir, `seg_${String(w).padStart(3, '0')}.mp4`);
      const { browser, page } = await openPage(port, w);
      const ff = spawn(FF, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', 'pipe:0', '-vf', VF, '-c:v', 'libx264', '-preset', args.preset || 'slow', '-crf', String(args.crf || 16), ...TAGS, '-r', String(FPS), seg], { stdio: ['pipe', 'inherit', 'inherit'] });
      for (let k = a; k < b; k++) { const buf = await frame(page, t0 + k / FPS, k, w); if (keep.has(k)) png(buf, path.join(kdir, `seq_${String(k).padStart(4, '0')}.png`));
        if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r)); done++;
        if (w === 0 && (k - a) % 60 === 0) console.log(`  ${done}/${n} frames, ${(done / ((Date.now() - tS) / 1000)).toFixed(1)} fps`); }
      ff.stdin.end(); await new Promise((r) => ff.on('close', r)); await browser.close(); return seg;
    });
    const segs = (await Promise.all(jobs)).filter(Boolean); const list = path.join(dir, 'list.txt'); fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
    const a = ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list];
    if (args.audio) a.push('-ss', t0.toFixed(6), '-t', (n / FPS).toFixed(6), '-i', path.resolve(ROOT, args.audio), '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '256k');
    a.push('-c:v', 'copy', ...TAGS, '-movflags', '+faststart', out);
    const r = spawnSync(FF, a); if (r.status !== 0) throw new Error(String(r.stderr)); fs.rmSync(dir, { recursive: true });
    fs.writeFileSync(out.replace(/\.mp4$/, '.json'), JSON.stringify({ t0, n, fps: FPS, timing: TIMING, audio: args.audio || null }));
    console.log(`mp4 ${n} frames (t0 ${t0.toFixed(4)} s) in ${((Date.now() - tS) / 1000).toFixed(1)} s -> ${out}`);
  } else console.log('nothing to do: --mp4, --frames, --stills, --info or --probe');
  srv.close(); console.log(`total ${((Date.now() - t00) / 1000).toFixed(1)} s`);
}
main().catch((e) => { console.error(e); process.exit(1); });
