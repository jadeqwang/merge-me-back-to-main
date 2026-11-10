#!/usr/bin/env node
// Figure-lab still capture.
//   node fable/tools/figlab.mjs                      all shots -> work_fable/stills/f3/<shot>.jpg
//   node fable/tools/figlab.mjs light_back_full sil_kick
//   node fable/tools/figlab.mjs --perf formation_light light_front_full
//   node fable/tools/figlab.mjs --tracks idle,walk   also load baked tracks from work_fable/tracks/
//   node fable/tools/figlab.mjs --custom '<json shot def>' --out name
import http from 'node:http'; import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os'; import { fileURLToPath } from 'node:url'; import { createRequire } from 'node:module';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const require = createRequire(path.join(ROOT, 'engine/package.json'));
const puppeteer = require('puppeteer-core');
const args = process.argv.slice(2); const opt = { perf: false, tracks: '', custom: null, out: null, dir: path.join(ROOT, 'work_fable/stills/f3') }; const names = [];
for (let i = 0; i < args.length; i++) { const a = args[i]; if (a === '--perf') opt.perf = true; else if (a === '--tracks') opt.tracks = args[++i]; else if (a === '--custom') opt.custom = args[++i]; else if (a === '--out') opt.out = args[++i]; else if (a === '--dir') opt.dir = path.resolve(args[++i]); else names.push(a); }
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.ttf': 'font/ttf', '.bin': 'application/octet-stream', '.png': 'image/png', '.jpg': 'image/jpeg' };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split('?')[0])); if (!p.startsWith(ROOT)) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (e, d) => { if (e) { res.writeHead(404); return res.end('nf'); } res.writeHead(200, { 'Content-Type': MIME[path.extname(p)] || 'application/octet-stream', 'Cache-Control': 'no-store' }); res.end(d); });
});
await new Promise((r) => server.listen(0, '127.0.0.1', r)); const port = server.address().port;
const tmp = fs.mkdtempSync(path.join(os.tmpdir().length < 20 ? os.tmpdir() : '/tmp', 'fl-')); process.env.TMPDIR = tmp;
const browser = await puppeteer.launch({ executablePath: '/usr/bin/google-chrome', headless: 'new', userDataDir: path.join(tmp, 'p'),
  args: ['--no-sandbox', '--disable-gpu-watchdog', '--font-render-hinting=none', '--use-angle=vulkan', '--ignore-gpu-blocklist', '--enable-gpu', '--window-size=1920,1080'] });
let code = 0;
try {
  const page = await browser.newPage(); await page.setViewport({ width: 1920, height: 1080 });
  page.on('console', (m) => { const t = m.text(); if (m.type() === 'error' || m.type() === 'warning') console.log('[page ' + m.type() + ']', t.slice(0, 3000)); });
  page.on('pageerror', (e) => console.log('[pageerror]', e.message));
  await page.goto(`http://127.0.0.1:${port}/fable/engine/figlab.html${opt.tracks ? '?tracks=' + opt.tracks : ''}`);
  await page.waitForFunction('window.LAB !== undefined', { timeout: 60000 });
  const t0 = Date.now(); await page.evaluate('window.LAB.ready'); console.log('ready in', Date.now() - t0, 'ms', JSON.stringify(await page.evaluate('window.LAB.info()')));
  fs.mkdirSync(opt.dir, { recursive: true });
  const save = async (name) => { const d = await page.evaluate(() => document.getElementById('c').toDataURL('image/jpeg', 0.92)); const f = path.join(opt.dir, name + '.jpg'); fs.writeFileSync(f, Buffer.from(d.split(',')[1], 'base64')); console.log('wrote', f); };
  if (opt.custom) { await page.evaluate((d) => window.LAB.custom(JSON.parse(d)), opt.custom); await save(opt.out || 'custom'); }
  else {
    const list = names.length ? names : await page.evaluate('window.LAB.shots()');
    for (const n of list) {
      if (opt.perf) console.log('perf', n, (await page.evaluate((n) => window.LAB.perf(n), n)).toFixed(2), 'ms/frame');
      else { await page.evaluate((n) => window.LAB.render(n), n); await save(n); }
    }
  }
} catch (e) { console.error('FAILED', e.message); code = 1; }
await browser.close(); server.close(); fs.rmSync(tmp, { recursive: true, force: true }); process.exit(code);
