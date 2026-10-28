#!/usr/bin/env node
// Deterministic headless renderer. Every frame is ENGINE.render(t), a pure function of song time t.
//   node engine/render.mjs --from 68 --to 76 --res 960x540 --mp4 out/x.mp4 --audio [--workers 3]
//   node engine/render.mjs --stills 70.2:a.png,72:b.png [--res 1920x1080]
//   node engine/render.mjs --sheet out/s.jpg --from 0 --to 30 --every 0.5     (contact sheet)
// Song timing: page default v2 (inputs/Merge.wav); --q "timing=v1&..." renders the v1 song/EDL.
// Options: --page /engine/web/index.html (default) --q key=val&... extra page query, --fps 30, --crf 16, --preset medium
// Serves the project root on a private port. TMPDIR is forced onto disk (out/tmp).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import puppeteer from 'puppeteer-core';

const ENGINE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(ENGINE, '..');
// box defaults (GPU Chrome + the moongazing ffmpeg); anywhere else (a cloud container) falls back to the pre-installed Chromium with
// SwiftShader (software WebGL2, ~10x slower) and the system ffmpeg. Override with CHROME=… / FFMPEG=….
const BOX_FF = '/home/jade/Documents/1-music-shipped/moongazing/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2';
const FF = process.env.FFMPEG || (fs.existsSync(BOX_FF) ? BOX_FF : 'ffmpeg');
const CHROME = process.env.CHROME || ['/usr/bin/google-chrome', '/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'].find((f) => fs.existsSync(f));
const GPU = process.env.SOFTGL ? false : CHROME === '/usr/bin/google-chrome';
const GL_ARGS = GPU ? ['--use-angle=vulkan', '--ignore-gpu-blocklist', '--enable-gpu'] : ['--use-angle=swiftshader', '--enable-unsafe-swiftshader'];
// default soundtrack follows the page's timing (engine/src/time.js: v2 = revised song unless --q has timing=v1); --audiofile overrides
const SONG = args_audiofile() || path.join(ROOT, 'inputs', /(^|&)timing=v1(&|$)/.test(process.argv[process.argv.indexOf('--q') + 1] || '') ? 'Merge Me Back to Main.wav' : 'Merge.wav');
function args_audiofile() { const i = process.argv.indexOf('--audiofile'); return i > 0 ? path.resolve(process.argv[i + 1]) : null; }
const TMP = path.join(ROOT, 'out', 'tmp'); fs.mkdirSync(TMP, { recursive: true }); process.env.TMPDIR = TMP;

const argv = process.argv.slice(2), args = {};
for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) { const k = argv[i].slice(2); const v = argv[i + 1]; if (v === undefined || v.startsWith('--')) args[k] = true; else { args[k] = v; i++; } }
let [W, H] = String(args.res || '1920x1080').split('x').map(Number);
const FPS = +(args.fps || 30);
const PAGE = args.page || '/engine/web/index.html';

const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png',
  '.jpg': 'image/jpeg', '.ttf': 'font/ttf', '.otf': 'font/otf', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.webp': 'image/webp', '.bin': 'application/octet-stream' };
function serve() {
  return new Promise((resolve) => {
    const srv = http.createServer((req, res) => {
      const u = decodeURIComponent(req.url.split('?')[0]);
      const f = path.join(ROOT, u);
      if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); res.end(); return; }
      res.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream', 'Cache-Control': 'max-age=3600' });
      fs.createReadStream(f).pipe(res);
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

async function browserPage(port) {
  const browser = await puppeteer.launch({
    executablePath: CHROME, headless: 'new', protocolTimeout: 600000,
    args: ['--no-sandbox', '--disable-gpu-watchdog', '--font-render-hinting=none', ...GL_ARGS],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
  page.on('console', (m) => { const t = m.text(); if (!t.includes('404')) console.log('[page]', t); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  const q = `w=${W}&h=${H}${args.q ? '&' + args.q : ''}`;
  await page.goto(`http://127.0.0.1:${port}${PAGE}?${q}`, { waitUntil: 'load' });
  await page.waitForFunction('window.ENGINE && window.ENGINE.ready === true', { timeout: 180000 });
  return { browser, page };
}

async function grab(page) {
  const b64 = await page.evaluate(() => window.ENGINE.readPixels());
  return Buffer.from(b64, 'base64');
}

async function renderRange(port, f0, f1, out) {
  const { browser, page } = await browserPage(port);
  const ff = spawn(FF, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-r', String(FPS), '-i', 'pipe:0',
    '-vf', 'vflip', '-c:v', 'libx264', '-preset', args.preset || 'medium', '-crf', String(args.crf || 16), '-pix_fmt', 'yuv420p',
    '-r', String(FPS), out], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = f0; f < f1; f++) {
    await page.evaluate((t) => window.ENGINE.render(t), f / FPS);
    const buf = await grab(page);
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if ((f - f0) % 60 === 0) process.stdout.write(`  [${path.basename(out)}] ${f - f0}/${f1 - f0} ${((f - f0 + 1) / ((Date.now() - t0) / 1000)).toFixed(1)} fps\n`);
  }
  ff.stdin.end(); await new Promise((r) => ff.on('close', r));
  await browser.close();
}

async function main() {
  const srv = await serve(); const port = srv.address().port;
  if (args.stills) {
    const { browser, page } = await browserPage(port);
    for (const spec of String(args.stills).split(',')) {
      const [t, file] = spec.split(':');
      await page.evaluate((tt) => window.ENGINE.render(tt), +t);
      const raw = await grab(page);
      const ff = spawnSync(FF, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-i', 'pipe:0', '-vf', 'vflip', '-frames:v', '1', file], { input: raw });
      if (ff.status !== 0) console.log(ff.stderr.toString());
      console.log('still', t, '->', file);
    }
    await browser.close(); srv.close(); return;
  }
  const from = +(args.from || 0), to = +(args.to || 5);
  const F0 = Math.round(from * FPS), F1 = Math.round(to * FPS);
  if (args.sheet) {
    const every = +(args.every || 1), cols = +(args.cols || 6);
    const { browser, page } = await browserPage(port);
    const tiles = []; const tw = 480, th = Math.round(480 * H / W);
    for (let t = from; t < to - 1e-6; t += every) {
      await page.evaluate((tt) => window.ENGINE.render(tt), t);
      const raw = await grab(page);
      const f = path.join(TMP, `sheet_${tiles.length}.png`);
      spawnSync(FF, ['-y', '-v', 'error', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', `${W}x${H}`, '-i', 'pipe:0', '-vf', `vflip,scale=${tw}:${th},drawbox=x=0:y=0:w=0:h=0`, '-frames:v', '1', f], { input: raw });
      tiles.push(f);
    }
    await browser.close();
    const rows = Math.ceil(tiles.length / cols);
    const inputs = tiles.flatMap((f) => ['-i', f]);
    const layout = tiles.map((_, i) => `${(i % cols) * tw}_${Math.floor(i / cols) * th}`).join('|');
    const r = spawnSync(FF, ['-y', '-v', 'error', ...inputs, '-filter_complex', `xstack=inputs=${tiles.length}:layout=${layout}:fill=black`, '-frames:v', '1', '-q:v', '3', args.sheet]);
    if (r.status !== 0) console.log(r.stderr.toString());
    console.log('sheet', args.sheet, `${tiles.length} tiles ${cols}x${rows}`); srv.close(); return;
  }
  const out = path.resolve(args.mp4 || path.join(ROOT, 'out', 'render.mp4'));
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const N = Math.max(1, +(args.workers || 1));
  const chunk = Math.ceil((F1 - F0) / N), parts = [];
  const jobs = [];
  for (let i = 0; i < N; i++) {
    const a = F0 + i * chunk, b = Math.min(F1, a + chunk); if (a >= b) break;
    const p = path.join(TMP, `part_${process.pid}_${i}.mp4`); parts.push(p);
    jobs.push(renderRange(port, a, b, p));
  }
  const t0 = Date.now(); await Promise.all(jobs);
  const list = path.join(TMP, `parts_${process.pid}.txt`); fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n'));
  const video = args.audio ? path.join(TMP, `v_${process.pid}.mp4`) : out;
  spawnSync(FF, ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', video], { stdio: 'inherit' });
  if (args.audio) {
    spawnSync(FF, ['-y', '-v', 'error', '-i', video, '-ss', String(F0 / FPS), '-t', String((F1 - F0) / FPS), '-i', SONG,
      '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-shortest', out], { stdio: 'inherit' });
  }
  for (const p of parts) fs.rmSync(p, { force: true });
  console.log(`done ${out} ${F1 - F0} frames in ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  srv.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
