// Standalone harness for src/car3d.js (film v8 car shot): exposes window.FILM like film.js, so tools/car3d_render.mjs (a copy of
// tools/render.mjs with the GPU on) renders stills and mp4s at song time. ?box=0 hides the preview of the JRPG box (film.js carBox, copied
// here for layout checks only; the film draws the real one over the plate).
import * as THREE from 'three';
import { timingFrom } from './timing.js';
import { makeCar3D } from './car3d.js';
window.FILM = {};
const Q = new URLSearchParams(location.search), W = +(Q.get('w') || 1920), H = +(Q.get('h') || 1080), FPS = +(Q.get('fps') || 30), S = H / 1080;
const cv = document.getElementById('c'); cv.width = W; cv.height = H; const g = cv.getContext('2d', { willReadFrequently: true });
const BOX = { text: 'You could tell me anything\nand I would find it strangely plausible', name: 'YOU', at: [0.35, 6.55], cps: 26, box: [0.07, 0.75, 0.93, 0.93], px: 46 };
const clamp01 = (x) => Math.min(1, Math.max(0, x));
function wrap(text, maxW) { const ws = text.split(' '), rows = []; let r = ''; for (const w of ws) { const t = r ? r + ' ' + w : w; if (g.measureText(t).width > maxW && r) { rows.push(r); r = w; } else r = t; } if (r) rows.push(r); return rows; }
function carBox(t, t0) { const o = BOX, ta = t0 + o.at[0], tb = t0 + o.at[1]; if (t < ta || t > tb) return; const open = 1 - Math.pow(1 - clamp01((t - ta) / 0.22), 3), a = Math.min(1, clamp01((tb - t) / 0.35));
  const [bx0, by0, bx1, by1] = o.box, x = bx0 * W, w = (bx1 - bx0) * W, hF = (by1 - by0) * H, cy = (by0 + by1) / 2 * H, h = hF * (0.35 + 0.65 * open), y = cy - h / 2, r = 14 * S, px = o.px * S, pad = 46 * S, lead = px * 1.5;
  g.save(); g.globalAlpha = a * open; g.fillStyle = 'rgba(8,10,34,0.80)'; g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); g.strokeStyle = 'rgba(255,241,214,0.95)'; g.lineWidth = 3 * S; g.beginPath(); g.roundRect(x, y, w, h, r); g.stroke();
  if (open >= 1) { g.font = `700 ${34 * S}px "JetBrains Mono"`; const nw = g.measureText(o.name).width + 40 * S, nh = 54 * S, nx = x + 34 * S, ny = y - nh * 0.62; g.fillStyle = 'rgba(8,10,34,0.94)'; g.beginPath(); g.roundRect(nx, ny, nw, nh, 9 * S); g.fill(); g.stroke(); g.fillStyle = '#FFF1D6'; g.fillText(o.name, nx + 20 * S, ny + nh / 2 + 12 * S);
    g.font = `500 ${px}px "JetBrains Mono"`; const rows = o.text.split('\n').flatMap((ln) => wrap(ln, w - 2 * pad)); let k = Math.floor(Math.max(0, t - ta - 0.3) * o.cps); rows.forEach((row, i) => { if (k <= 0) return; g.fillText(row.slice(0, k), x + pad, y + pad + px * 0.72 + i * lead); k -= row.length + 1; }); }
  g.restore(); }
async function main() {
  try { const f = new FontFace('JetBrains Mono', 'url(/engine/fonts/JetBrainsMono[wght].ttf)', { weight: '100 800' }); document.fonts.add(await f.load()); } catch (e) { console.log('font', e.message); }
  const T = timingFrom(await (await fetch(Q.get('timing') || '/analysis_v3/timing.json')).json());
  const car = makeCar3D(THREE, { W, H, T, Q }); await car.load();
  const showBox = Q.get('box') !== '0', hud = Q.get('hud') === '1';
  async function render(t) { const c = await car.render(t); g.drawImage(c, 0, 0, W, H); if (showBox) carBox(t, car.TM.t0);
    if (hud) { g.font = `600 ${26 * S}px "JetBrains Mono"`; g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(W - 330 * S, H - 46 * S, 330 * S, 46 * S); g.fillStyle = '#9fe3b0'; g.fillText(`car3d ${t.toFixed(2)}s`, W - 315 * S, H - 14 * S); } }
  let ws = null, ack = null;
  async function post(i) { if (!ws) { ws = new WebSocket(`ws://${location.host}/__ws`); ws.binaryType = 'arraybuffer'; await new Promise((r) => (ws.onopen = r)); ws.onmessage = () => ack && ack(); }
    const px = g.getImageData(0, 0, W, H).data; const p = new Promise((r) => (ack = r)); ws.send((Q.get('wid') || 0) + ':' + i); ws.send(px.buffer); await p; }
  await render(car.TM.t0 + 0.5);
  Object.assign(window.FILM, { ready: true, W, H, FPS, t0: 0, tStop: T.duration, n: Math.ceil(T.duration * FPS - 1e-6), car: car.info(), render, async renderAndPost(t, i) { await render(t); await post(i); } });
}
main().catch((e) => { window.FILM.error = String(e && e.stack || e); });
