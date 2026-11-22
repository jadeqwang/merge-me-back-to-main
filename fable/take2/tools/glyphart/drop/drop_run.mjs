#!/usr/bin/env node
// Drop (dr* v7 shots) in glyph marks: v7 raw frames through slashpaper.js (paper.js with keyboard stroke glyphs), headless Chrome.
//   node fable/take2/tools/glyphart/drop/drop_run.mjs --out DIR --frames K0:K1 [--shots shots.json] [--workers 3] [--which slash|paper]
//   node fable/take2/tools/glyphart/drop/drop_run.mjs --still T --out file.jpg [--which ...]
// Frame k = song time k/30 (v7 numbering); seed = 1000 + shot index (as film.js does for the shot that plays at k/30), t = k/30.
// Writes DIR/f_%05d.jpg and DIR/meta.json (v7 layout, film.js loadV7). Frames that fall in no v7 shot are still rendered (seed of the
// shot at that time) so the folder is contiguous.
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '..', '..', '..', '..', '..');
const require = createRequire(path.join(ROOT, 'engine', 'node_modules', 'x.js')); const puppeteer = require('puppeteer-core');
const argv = process.argv.slice(2), A = {}; for (let i = 0; i < argv.length; i++) if (argv[i].startsWith('--')) { const v = argv[i + 1]; if (v === undefined || v.startsWith('--')) A[argv[i].slice(2)] = true; else { A[argv[i].slice(2)] = v; i++; } }
const MIME = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.html': 'text/html', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); fs.readFile(f, (e, d) => { if (e) { r.writeHead(404); r.end(); return; } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); r.end(d); }); });
await new Promise((r) => srv.listen(0, '127.0.0.1', r)); const PORT = srv.address().port;
const { resolveShots } = await import(path.join(ROOT, 'fable/take2/shots.js')); const { timingFrom } = await import(path.join(ROOT, 'fable/take2/src/timing.js'));
const tf = path.join(ROOT, 'analysis_v3/timing.json'); const SH = resolveShots(timingFrom(JSON.parse(fs.readFileSync(tf, 'utf8')), tf));
const shotAt = (t) => SH.find((s) => t >= s.t0 && t < s.t1) || SH[SH.length - 1];
const v7 = (k) => `/work_fable/take2/v7/full/f_${String(k).padStart(5, '0')}.jpg`;
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', protocolTimeout: 900000, args: ['--no-sandbox', '--font-render-hinting=none', '--disable-gpu'] });
async function page() { const p = await browser.newPage(); await p.setViewport({ width: 1920, height: 1080 }); p.on('console', (m) => console.log('[page]', m.text())); p.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await p.goto(`http://127.0.0.1:${PORT}/fable/take2/tools/glyphart/drop/drop.html`); await p.waitForFunction('window.READY === true', { timeout: 60000 }); return p; }
const which = A.which || 'slash', extra = A.extra ? JSON.parse(A.extra) : null;
async function one(p, k, out) { const t = k / 30, s = shotAt(t); const b64 = await p.evaluate((u, t, seed, w, x) => window.renderFrame(u, t, seed, w, x), v7(k), t, 1000 + s.i, which, extra); fs.writeFileSync(out, Buffer.from(b64, 'base64')); return s.id; }
if (A.chart) { const p = await page(); const [b, info] = await p.evaluate(() => window.testChart()); fs.writeFileSync(A.chart, Buffer.from(b, 'base64')); console.log(info); }
else if (A.still) { const p = await page(); const k = Math.round(+A.still * 30); console.log(A.out, await one(p, k, A.out)); }
else {
  const [k0, k1] = A.frames.split(':').map(Number); fs.mkdirSync(A.out, { recursive: true }); const W = Math.min(4, +(A.workers || 3));
  const ks = []; for (let k = k0; k <= k1; k++) ks.push(k); let next = 0, done = 0; const t0 = Date.now();
  await Promise.all(Array.from({ length: W }, async () => { const p = await page(); while (next < ks.length) { const k = ks[next++]; const f = path.join(A.out, `f_${String(k).padStart(5, '0')}.jpg`); if (!A.force && fs.existsSync(f)) { done++; continue; } await one(p, k, f); if (++done % 50 === 0) console.log(done, '/', ks.length, ((Date.now() - t0) / done).toFixed(0), 'ms/frame'); } }));
  fs.writeFileSync(path.join(A.out, 'meta.json'), JSON.stringify({ fps: 30, n: k1 - k0 + 1, t0: k0 / 30, first: k0, w: 1920, h: 1080, note: `drop in glyph marks (tools/glyphart/drop/slashpaper.js, which=${which}); paper pass already applied: set opt.paper 0`, extra }));
  console.log('done', ks.length, 'frames', ((Date.now() - t0) / 1000).toFixed(0), 's');
}
await browser.close(); srv.close();
