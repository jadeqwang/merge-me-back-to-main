// Test 7 of PLAN section 9: the written lane. index.html?mode=lanetest, rendered by tools/render.mjs (window.FILM interface).
//   0-6 s   over a full-frame plate (the chorus hero): main written under her feet across the frame (cap 22) and a perspective lane
//           receding to the horizon (cap 2 px far to 40 px near); merge 0 -> 1 over 0.5-5.5 s (sparse, dense, solid)
//   6-12 s  the bar 38 merge curves (the proof's geometry): each life's lane written in its colour along its S-curve into main;
//           main's density follows how many have merged; at the end the branches go solid too
//   12-14 s a ladder: merge 0, 0.25, 0.5, 0.75, 1, straight, cap 22
import { drawWrittenLane, laneString, measureMono } from './lanes.js';
import { LIVES, MAIN } from '../../proof/lives.js';

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const io = (u) => u * u * (3 - 2 * u);

export async function boot(g, { W, H, FPS, FONTS }) {
  const Q = new URLSearchParams(location.search);
  await Promise.all(FONTS.map(async ([name, u, desc]) => { const f = new FontFace(name, `url("${encodeURI(u)}")`, desc); await f.load(); document.fonts.add(f); }));
  await document.fonts.ready; const MM = measureMono(g);
  const S = H / 1080, YM = 0.82 * H, DUR = 14;
  const MAIN_TXT = laneString(['merge me back to main', ...LIVES.map((l) => l.msg)], true);
  // the hero plate (proof plate), nearest frame, 24 fps
  const meta = await (await fetch('/work_fable/proof/plates/hero/meta.json')).json();
  const CACHE = new Map(); const bmp = (i) => { const u = `/work_fable/proof/plates/hero/frames/f_${String(i + 1).padStart(4, '0')}.jpg`; if (!CACHE.has(u)) CACHE.set(u, fetch(u).then((r) => r.blob()).then((b) => createImageBitmap(b))); return CACHE.get(u); };
  // the proof's bar 38 geometry (grid cells, nodes, S-curves into main at YM)
  const G = 10 * S, CW = 470 * S, CH = CW * 9 / 16, GX0 = (W - (4 * CW + 3 * G)) / 2, GY0 = 14 * S;
  const CURVES = LIVES.map((L, i) => { const col = i % 4, row = Math.floor(i / 4), c = { x: GX0 + col * (CW + G), y: GY0 + row * (CH + G), w: CW, h: CH };
    const n = { x: c.x + 0.88 * c.w, y: c.y + c.h - 2 * S }, D = (70 + 0.38 * (YM - n.y) / S) * S, j = { x: n.x - D, y: YM }; const pts = [];
    for (let k = 0; k <= 60; k++) { const u = k / 60, a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, d = 3 * u * u * (1 - u), e = u ** 3;   // junction -> node (text reads left to right)
      pts.push({ x: a * j.x + b * (j.x + 0.55 * D) + d * (n.x - 0.55 * D) + e * n.x, y: a * YM + b * YM + d * n.y + e * n.y }); }
    return { L, col, pts, len: pts.reduce((s, p, k) => (k ? s + Math.hypot(p.x - pts[k - 1].x, p.y - pts[k - 1].y) : 0), 0), j, n }; });

  function label(txt, x, y, col = '#FFF1D6') { g.font = '600 24px "JetBrains Mono"'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; const w = g.measureText(txt).width;
    g.fillStyle = 'rgba(5,6,26,0.78)'; g.fillRect(x - 10, y - 26, w + 20, 36); g.fillStyle = col; g.fillText(txt, x, y); }
  async function render(t) {
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.fillStyle = '#05061A'; g.fillRect(0, 0, W, H);
    if (t < 6) {
      const i = Math.min(meta.n - 1, Math.round(Math.min(t, 4.8) * meta.fps)); const b = await bmp(i);
      const sw = b.width, sh = sw * H / W; g.drawImage(b, 0, (b.height - sh) / 2, sw, sh, 0, 0, W, H);
      const m = io(seg(t, 0.5, 5.5));
      // perspective lane: from the horizon (far, tiny type) to the bottom left (near, large type)
      const vp = { x: 0.62 * W, y: 0.47 * H }, nearP = { x: 0.08 * W, y: 1.02 * H }, P = []; for (let k = 0; k <= 80; k++) { const u = k / 80; P.push({ x: nearP.x + (vp.x - nearP.x) * u, y: nearP.y + (vp.y - nearP.y) * u }); }
      // near end first: the type shrinks toward the horizon (cap ~ 1/distance)
      drawWrittenLane(g, P, { text: MAIN_TXT, color: MAIN, merge: m, cap: (u) => 40 * S / (1 + 18 * u * u), scroll: t * 4 });
      drawWrittenLane(g, [{ x: 0, y: YM }, { x: W, y: YM }], { text: MAIN_TXT, color: MAIN, merge: m, cap: 22 * S, scroll: t * 3.5 });
      label(`test 7: written lane over a plate   merge ${m.toFixed(2)}`, 40 * S, 60 * S);
    } else if (t < 12) {
      const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#05061A'); gr.addColorStop(1, '#0B1240'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
      const tt = t - 6; let merged = 0; const solid = io(seg(tt, 4.4, 5.6));
      for (const C of CURVES) { const t0 = 0.3 + 0.8 * C.col, u = io(seg(tt, t0, t0 + 1.4)); if (u <= 0) continue; if (u >= 1) merged++;
        drawWrittenLane(g, C.pts, { text: laneString([C.L.branch, C.L.msg]), color: C.L.color, merge: 0.3 + 0.7 * solid, cap: 13 * S, scroll: tt * 3, from: (1 - u) * C.len, under: 0 });
        g.fillStyle = C.L.color; g.beginPath(); g.arc(C.n.x, C.n.y, 7 * S, 0, 6.2832); g.fill(); }
      drawWrittenLane(g, [{ x: -10, y: YM }, { x: W + 10, y: YM }], { text: MAIN_TXT, color: MAIN, merge: Math.min(1, merged / 12 + 0.12), cap: 18 * S, scroll: tt * 3, under: 0 });
      label(`test 7: the bar 38 merge curves, written   merged ${merged}/12, main merge ${Math.min(1, merged / 12 + 0.12).toFixed(2)}`, 40 * S, 60 * S);
    } else {
      g.fillStyle = '#0E0D18'; g.fillRect(0, 0, W, H);
      [0, 0.25, 0.5, 0.75, 1].forEach((m, k) => { const y = (180 + 190 * k) * S; drawWrittenLane(g, [{ x: 330 * S, y }, { x: W - 60 * S, y }], { text: MAIN_TXT, color: MAIN, merge: m, cap: 22 * S, scroll: (t - 12) * 3, under: 0 }); label(`merge ${m.toFixed(2)}`, 60 * S, y + 10 * S); });
      label('test 7: density ladder, cap 22 px', 40 * S, 60 * S);
    }
  }
  let LOCK = Promise.resolve(); const R = (t) => { const p = LOCK.then(() => render(t)); LOCK = p.catch(() => {}); return p; };
  let ws = null, ack = null;
  async function post(i) {
    if (!ws) { ws = new WebSocket(`ws://${location.host}/__ws`); ws.binaryType = 'arraybuffer'; await new Promise((r) => (ws.onopen = r)); ws.onmessage = () => ack && ack(); }
    const px = g.getImageData(0, 0, W, H).data; const p = new Promise((r) => (ack = r)); ws.send((Q.get('wid') || 0) + ':' + i); ws.send(px.buffer); await p;
  }
  await R(0);
  Object.assign(window.FILM, { ready: true, W, H, FPS, t0: 0, tStop: DUR, n: Math.round(DUR * FPS), mono: MM, render: R, async renderAndPost(t, i) { await R(t); await post(i); } });
}
