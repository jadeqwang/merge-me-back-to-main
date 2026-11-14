#!/usr/bin/env node
// Apply the take-two paper or glyph pass to a still or a frames folder, in headless Chrome (fable/take2/fx_test.html).
//   node fable/take2/tools/fx/fx.mjs --pass paper --in a.png --out a_paper.png --opts '[{"paper":"black"},{"paper":"white"}]' --side
//   node fable/take2/tools/fx/fx.mjs --pass paper --in frames_dir --out clip.mp4 --opts '{"paper":"black"}' --fps 30 --srcfps 30 --dur 3
//   node fable/take2/tools/fx/fx.mjs --pass glyph --in still.jpg --mask keep.png --out g.png --opts @opts.json
// --in    a still (png/jpg) or a folder of frames (sorted by name). A still with --dur gives a clip of the boil alone.
// --out   .png (one frame; with a folder input, --at s picks the frame), .mp4, or a folder (png per frame)
// --opts  JSON (or @file.json): one options object, or an array (one panel each); --side puts the source first
// --mask  keep mask (still or folder matched by frame index; white = source kept untouched; glyph pass only)
// --res   panel size (default 1920x1080)  --fps 30 (output)  --srcfps (input frame rate; default = fps)  --t0 song time of frame 0 (default 0)
// --dur   seconds (default: the whole folder, or 3 for a still)  --workers (default 2, at most 4)  --crf 16  --scale-out 0.5 (mp4/png downscale)
// --time  print per-frame pass timing (the first frame warms caches and is reported separately)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..', '..', '..', '..');
const require = createRequire(path.join(ROOT, 'engine', 'node_modules', 'x.js'));
const puppeteer = require('puppeteer-core');
const { WebSocketServer } = require('ws');
const FF = process.env.FFMPEG || '/usr/bin/ffmpeg';
const TMPD = '/tmp/mfb'; fs.mkdirSync(TMPD, { recursive: true }); process.env.TMPDIR = TMPD;
const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.ttf': 'font/ttf' };

const argv = process.argv.slice(2), args = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) { const k = argv[i].slice(2), v = argv[i + 1]; if (v === undefined || v.startsWith('--')) args[k] = true; else { args[k] = v; i++; } }
const [W, H] = String(args.res || '1920x1080').split('x').map(Number);
const FPS = +(args.fps || 30), SRCFPS = +(args.srcfps || FPS), T0 = +(args.t0 || 0);
let OPTS = args.opts || '{}'; if (OPTS.startsWith('@')) OPTS = fs.readFileSync(OPTS.slice(1), 'utf8'); OPTS = JSON.parse(OPTS);
const NP = (Array.isArray(OPTS) ? OPTS.length : 1) + (args.side ? 1 : 0), OW = W * NP;
const SO = +(args['scale-out'] || 1), EW = Math.round(OW * SO / 2) * 2, EH = Math.round(H * SO / 2) * 2;

const rel = (p) => '/' + path.relative(ROOT, path.resolve(p)).split(path.sep).join('/');
function listing(p) { if (!p) return null; const a = path.resolve(p); if (fs.statSync(a).isDirectory()) return fs.readdirSync(a).filter((f) => /\.(png|jpe?g)$/i.test(f)).sort().map((f) => rel(path.join(a, f))); return [rel(a)]; }
const IN = listing(args.in), MASK = listing(args.mask);
if (!IN) { console.log('need --in'); process.exit(1); }
for (const u of [...IN, ...(MASK || [])]) if (u.startsWith('/..')) { console.log('inputs must be inside the repo:', u); process.exit(1); }

const frames = new Map();
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const [u] = req.url.split('?'); const f = path.join(ROOT, decodeURIComponent(u));
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' }); fs.createReadStream(f).pipe(res);
    });
    const wss = new WebSocketServer({ server: srv, path: '/__ws', maxPayload: 1 << 30, perMessageDeflate: false });
    wss.on('connection', (ws) => { let key = null; ws.on('message', (data, isBinary) => { if (!isBinary) { key = data.toString(); return; } frames.set(key, data); ws.send('ok'); }); });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}
async function openPage(port, wid) {
  const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', args: ['--no-sandbox', '--font-render-hinting=none', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-gpu'] });
  const page = await browser.newPage(); await page.setViewport({ width: 800, height: 450, deviceScaleFactor: 1 });
  page.on('console', (m) => { const t = m.text(); if (!/favicon|404/.test(t)) console.log(`[page${wid}]`, t); });
  page.on('pageerror', (e) => console.log(`[pageerror${wid}]`, e.message));
  await page.goto(`http://127.0.0.1:${port}/fable/take2/fx_test.html?driven=1`, { waitUntil: 'load' });
  await page.waitForFunction('window.FX && (window.FX.ready || window.FX.error)', { timeout: 60000 });
  const err = await page.evaluate(() => window.FX.error); if (err) throw new Error(err);
  return { browser, page };
}
// output frame k -> song time and source frame
const pick = (k) => { const t = T0 + k / FPS; const i = IN.length === 1 ? 0 : Math.min(IN.length - 1, Math.floor((k / FPS) * SRCFPS + 1e-6)); return { t, src: IN[i], mask: MASK ? MASK[Math.min(MASK.length - 1, MASK.length === 1 ? 0 : i)] : null }; };
async function render(page, k, wid, key) {
  const j = pick(k); const r = await page.evaluate((job) => window.FX.run(job), { pass: args.pass || 'paper', src: j.src, mask: j.mask, opts: OPTS, side: !!args.side, w: W, h: H, t: j.t, key, prof: !!args.prof });
  const b = frames.get(key); frames.delete(key);
  if (!b || b.length !== OW * H * 4) throw new Error(`frame ${k}: bad readback`);
  return { buf: b, ms: r.ms };
}
const scaleVF = SO !== 1 ? `scale=${EW}:${EH}:flags=lanczos,` : '';
function png(buf, out) { const r = spawnSync(FF, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${OW}x${H}`, '-i', 'pipe:0', '-frames:v', '1', ...(SO !== 1 ? ['-vf', `scale=${EW}:${EH}:flags=lanczos`] : []), '-pix_fmt', 'rgb24', out], { input: buf, maxBuffer: 1 << 30 }); if (r.status !== 0) throw new Error('ffmpeg: ' + r.stderr); }

async function main() {
  const srv = await serve(), port = srv.address().port, tS = Date.now();
  const out = path.resolve(args.out); fs.mkdirSync(path.extname(out) ? path.dirname(out) : out, { recursive: true });
  const timing = [];
  if (out.endsWith('.png') || out.endsWith('.jpg')) {
    const k = Math.round((+(args.at || 0)) * FPS);
    const { browser, page } = await openPage(port, 0);
    let r = await render(page, k, 0, 'f0'); timing.push(...r.ms.map((m) => ({ m, first: true })));
    if (args.time) for (let q = 1; q < (args.time === true ? 4 : +args.time); q++) { r = await render(page, k, 0, 'f' + q); timing.push(...r.ms.map((m) => ({ m, first: false }))); }
    png(r.buf, out); await browser.close(); console.log('->', out);
  } else {
    const n = Math.round((args.dur ? +args.dur : IN.length === 1 ? 3 : IN.length / SRCFPS) * FPS);
    const NW = Math.max(1, Math.min(4, +(args.workers || 2), n)), per = Math.ceil(n / NW);
    const mp4 = out.endsWith('.mp4'), dir = mp4 ? fs.mkdtempSync(path.join(TMPD, 'fx-')) : out;
    const jobs = [...Array(NW)].map(async (_, w) => {
      const a = w * per, b = Math.min(n, a + per); if (a >= b) return null;
      const { browser, page } = await openPage(port, w); const seg = path.join(dir, `seg_${w}.mp4`);
      const ff = mp4 ? spawn(FF, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${OW}x${H}`, '-r', String(FPS), '-i', 'pipe:0', '-vf', `${scaleVF}scale=out_color_matrix=bt709:out_range=tv,format=yuv420p`, '-c:v', 'libx264', '-preset', 'medium', '-crf', String(args.crf || 16), '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', seg], { stdio: ['pipe', 'inherit', 'inherit'] }) : null;
      for (let k = a; k < b; k++) {
        const r = await render(page, k, w, `${w}:${k}`); timing.push(...r.ms.map((m, i) => ({ k, m, first: k === a })));
        if (ff) { if (!ff.stdin.write(r.buf)) await new Promise((res) => ff.stdin.once('drain', res)); } else png(r.buf, path.join(dir, `f_${String(k + 1).padStart(4, '0')}.png`));
      }
      if (ff) { ff.stdin.end(); await new Promise((res) => ff.on('close', res)); }
      await browser.close(); return seg;
    });
    const segs = (await Promise.all(jobs)).filter(Boolean);
    if (mp4) {
      const list = path.join(dir, 'list.txt'); fs.writeFileSync(list, segs.map((s) => `file '${s}'`).join('\n'));
      const r = spawnSync(FF, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c:v', 'copy', '-movflags', '+faststart', out]); if (r.status !== 0) throw new Error(String(r.stderr));
      fs.rmSync(dir, { recursive: true });
    }
    console.log(`-> ${out} (${n} frames)`);
  }
  const warm = timing.filter((x) => !x.first).map((x) => x.m), cold = timing.filter((x) => x.first).map((x) => x.m);
  if (warm.length) { const s = warm.slice().sort((a, b) => a - b); console.log(`pass ms per panel (warm): median ${s[s.length >> 1].toFixed(1)}, max ${s[s.length - 1].toFixed(1)}, n ${s.length}; first calls ${cold.map((m) => m.toFixed(0)).join(',')}`); }
  srv.close(); console.log(`total ${((Date.now() - tS) / 1000).toFixed(1)} s`);
}
main().catch((e) => { console.error(e); process.exit(1); });
