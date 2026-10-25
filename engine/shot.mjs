// Screenshot a page from the project-root static server: node engine/shot.mjs URLPATH OUT.png [W H]
import puppeteer from 'puppeteer-core';
const [, , path, out, W = 1920, H = 1080] = process.argv;
const browser = await puppeteer.launch({
  executablePath: '/usr/bin/google-chrome', headless: 'new',
  args: ['--use-angle=vulkan', '--enable-gpu', '--ignore-gpu-blocklist', '--enable-unsafe-webgpu', '--no-sandbox', '--font-render-hinting=none'],
});
const page = await browser.newPage();
await page.setViewport({ width: +W, height: +H, deviceScaleFactor: 1 });
page.on('console', m => console.log('[page]', m.text()));
page.on('pageerror', e => console.log('[pageerror]', e.message));
await page.goto(`http://localhost:8790${path}`, { waitUntil: 'load' });
await page.waitForFunction('window.READY === true', { timeout: 60000 });
const info = await page.evaluate(() => { const gl = document.querySelector('canvas').getContext('webgl2'); const e = gl.getExtension('WEBGL_debug_renderer_info'); return e ? gl.getParameter(e.UNMASKED_RENDERER_WEBGL) : '?'; });
console.log('renderer:', info);
await page.screenshot({ path: out });
await browser.close();
