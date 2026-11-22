// film v8 (Jade on v7, 0:16.78: "the purple line feels disjointed from the other lines ... draw, frame by frame, and we don't show
// the generated footage underneath"): the MERGE tree of Intro B (b9-15, ib01-ib10) drawn in code, every frame, with no v7 frame under it.
//
// Geometry and clock are the three.js world's own (fable/show/world.js, built here on the CPU with a stub engine: no GL), seen with
// seq 02's own top-down camera (fable/show/seq/02_tree.js `top`), so the cut into ib11 (v7's swoop down the trunk) still matches.
// Each frame: every fork limb is drawn up to its written point (head = song time, eased inside each beat so the growth surges on the
// beat), as thin glowing lane-coloured lines on navy with a bright head and white nodes, the soft canopy pools, and the violet branch
// (a world-space road off the canopy's right edge, out of frame) in the SAME canvas. film.js then runs the same paper pass as on the
// v7 shots over this canvas, so every branch, the violet one included, comes out in one hatched multicolour stroke.
//   const TR = await makeTree({ W, H, timingUrl }); TR.frame(t, VL) -> canvas (VL = shots.js TREE_VIOLET)
import { makeWorld } from '../../show/world.js';
import { loadTiming } from '../../engine/src/time.js';

const lin = (h) => { const n = parseInt(h.replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.pow(c / 255, 2.2)); };
const srgb = (c, k = 1) => c.map((v) => Math.round(255 * Math.min(1, Math.pow(Math.max(0, v), 1 / 2.2) * k)));
const clamp01 = (x) => Math.min(1, Math.max(0, x)), seg = (t, a, b) => clamp01((t - a) / (b - a)), sm = (u) => { u = clamp01(u); return u * u * (3 - 2 * u); };
const lerp = (a, b, u) => a + (b - a) * u;

// CPU copy of the engine's Road (fable/engine/src/roads.js: resample + Road), enough for at/gAt/sAtG/P/n/len
function resample(pts, step, smooth) {
  let dense = [];
  if (smooth === false || pts.length < 3) dense = pts.map((p) => [p[0], p[1]]);
  else { const n = pts.length, P = (i) => pts[Math.min(n - 1, Math.max(0, i))];
    for (let i = 0; i < n - 1; i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2), segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), sub = Math.max(2, Math.ceil(segLen / Math.max(step * 0.5, 1e-3)));
      for (let k = 0; k < sub; k++) { const u = k / sub, u2 = u * u, u3 = u2 * u; dense.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3))); } }
    dense.push([pts[n - 1][0], pts[n - 1][1]]); }
  const cum = [0]; for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const len = cum[cum.length - 1], n = Math.max(2, Math.ceil(len / step) + 1), out = new Float32Array(n * 2); let j = 0;
  for (let i = 0; i < n; i++) { const s = (i / (n - 1)) * len; while (j < cum.length - 2 && cum[j + 1] < s) j++; const u = cum[j + 1] > cum[j] ? (s - cum[j]) / (cum[j + 1] - cum[j]) : 0;
    out[i * 2] = dense[j][0] + (dense[j + 1][0] - dense[j][0]) * u; out[i * 2 + 1] = dense[j][1] + (dense[j + 1][1] - dense[j][1]) * u; }
  return { P: out, n, len, ds: len / (n - 1) };
}
class Road {
  constructor(def, step) { this.def = def; Object.assign(this, resample(def.pts, def.step || step, def.smooth)); this.gs = def.gs || (def.g ? def.g : [0, 0]); }
  at(s) { const f = Math.min(this.n - 1.0001, Math.max(0, s / this.ds)), i = Math.floor(f), u = f - i, P = this.P; const x = P[i * 2] + (P[i * 2 + 2] - P[i * 2]) * u, z = P[i * 2 + 1] + (P[i * 2 + 3] - P[i * 2 + 1]) * u;
    let tx = P[i * 2 + 2] - P[i * 2], tz = P[i * 2 + 3] - P[i * 2 + 1]; const l = Math.hypot(tx, tz) || 1; return { x, z, tx: tx / l, tz: tz / l }; }
  gAt(s) { const u = Math.min(1, Math.max(0, s / this.len)), k = this.def.gk;
    if (k) { if (u <= k[0][0]) return k[0][1]; for (let i = 0; i < k.length - 1; i++) if (u <= k[i + 1][0]) return k[i][1] + (k[i + 1][1] - k[i][1]) * ((u - k[i][0]) / Math.max(1e-9, k[i + 1][0] - k[i][0])); return k[k.length - 1][1]; }
    const gs = this.gs, m = gs.length - 1, f = u * m, i = Math.min(m - 1, Math.floor(f)); return gs[i] + (gs[i + 1] - gs[i]) * (f - i); }
  sAtG(g) { const k = this.def.gk;
    if (k) { if (g <= k[0][1]) return k[0][0] * this.len; for (let i = 0; i < k.length - 1; i++) if (g <= k[i + 1][1]) return (k[i][0] + (k[i + 1][0] - k[i][0]) * ((g - k[i][1]) / Math.max(1e-9, k[i + 1][1] - k[i][1]))) * this.len; return k[k.length - 1][0] * this.len; }
    const gs = this.gs, m = gs.length - 1; if (g <= gs[0]) return 0; if (g >= gs[m]) return this.len; for (let i = 0; i < m; i++) if (g <= gs[i + 1]) return ((i + (g - gs[i]) / Math.max(1e-9, gs[i + 1] - gs[i])) / m) * this.len; return this.len; }
  g0() { return this.gAt(0); } g1() { return this.gAt(this.len); }
}

export async function makeTree({ W, H, timingUrl = '/analysis_v3/timing.json' }) {
  const time = await loadTiming(timingUrl);
  const stubDraw = { drawable: () => null };
  const E = { time, hex: lin, W, H, roads: (defs, o = {}) => ({ roads: defs.map((d) => new Road(d, o.step || 1.0)), drawable: () => null }), lights: () => stubDraw, glows: () => stubDraw };
  const Wd = makeWorld(E), bar = (n) => time.bar(n);
  // seq 02's camera, top-down (screen-up = +x east, screen-right = +z)
  const fb = Wd.forkBox, A = Wd.frameBox(-70, 400, -330, 330), B = Wd.frameBox(fb.x0 - 110, fb.x1 + 30, fb.z0 - 30, fb.z1 + 30);
  const cam = (t) => { const u = sm(seg(t, bar(9), bar(14.5))); return { cx: lerp(A.pos[0], B.pos[0], u), cz: lerp(A.pos[2], B.pos[2], u), h: lerp(A.h, B.h, u) }; };
  const K = Math.tan((35 * Math.PI) / 360);
  const proj = (c) => { const sc = H / 2 / (c.h * K); return (x, z) => [W / 2 + (z - c.cz) * sc, H / 2 - (x - c.cx) * sc]; };
  // the roads drawn: the fork limbs and the trunk (main west of the root); nothing else of the world (the arterials and v7's violet road
  // to the south are not in this picture)
  const roads = [...Wd.sets.fork.roads, Wd.sets.main.roads[0]].map((r) => ({ r, col: srgb(r.def.color), g0: r.g0(), g1: r.g1(), depth: r.def.depth ?? 0, lane: r.def.lane ?? 0 }));
  // the canopy pools: one per written fork node (world.js canopy: radius 14 + 0.9 x limb length)
  const nodes = Wd.sets.fork.roads.map((r) => { const a = r.at(r.len - 0.01); return { x: a.x, z: a.z, g: r.g1(), col: srgb(r.def.color), rad: 14 + r.len * 0.9, depth: r.def.depth }; });
  // beat easing: inside each beat the written head runs fast then settles (ease-out), so every beat lands a surge of growth
  const BT = []; for (let b = 8; b <= 17; b++) for (let k = 1; k <= 4; k++) BT.push(time.bb(b, k));
  const headAt = (t, amt) => { let i = 0; while (i < BT.length - 2 && t >= BT[i + 1]) i++; const a = BT[i], b = BT[i + 1]; if (t < a || t > b) return t; const u = (t - a) / (b - a); return a + (b - a) * lerp(u, 1 - (1 - u) ** 2.2, amt); };

  // the violet branch: a road of the world leaving the canopy's right-most fork node (the largest z among the depth `d` nodes), curving up
  // and right out of frame; written from grow[0] to grow[1] with a light at its head, then a slow light running outward
  let VR = null;
  const violet = (VL) => { if (VR && VR.key === VL) return VR;
    let best = null; for (const q of nodes) if (q.depth === VL.depth && (!best || q.z > best.z)) best = q;
    const hB = B.h * K, ex = best.x + VL.out[1] * hB, ez = B.pos[2] + VL.out[0] * hB * (W / H);           // out: [screen-x beyond the right edge (x half-widths), rise (y half-heights)] at camera B
    const L = Math.hypot(ex - best.x, ez - best.z), p0 = [best.x, best.z], c1 = [best.x + 0.16 * L, best.z + 0.34 * L], c2 = [ex - 0.42 * L, ez - 0.12 * L], pts = [];
    for (let i = 0; i <= 24; i++) { const u = i / 24, m = 1 - u; pts.push([0, 1].map((j) => m * m * m * p0[j] + 3 * m * m * u * c1[j] + 3 * m * u * u * c2[j] + u * u * u * [ex, ez][j])); }
    VR = { key: VL, r: new Road({ pts, smooth: false }, 1.0), col: srgb(lin('#9B6BFF')), node: best }; return VR; };

  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  const S = H / 1080;
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  function strokeRoad(P, r, s1, col, wCore, aGlow) {
    if (s1 <= 0) return; const step = Math.max(1.5, r.len / 60); g.beginPath(); let k = 0;
    for (let s = 0; ; s += step) { const ss = Math.min(s, s1), a = r.at(ss), [X, Y] = P(a.x, a.z); if (k++) g.lineTo(X, Y); else g.moveTo(X, Y); if (ss >= s1) break; }
    g.strokeStyle = rgba(col, aGlow); g.lineWidth = wCore * 3.2; g.stroke();
    g.strokeStyle = rgba(col, 0.95); g.lineWidth = wCore; g.stroke(); }

  function frame(t, VL, o = {}) {
    const c = cam(t), P = proj(c), sc = H / 2 / (c.h * K), head = headAt(t, o.beatEase ?? 0.8);
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    const bg = g.createLinearGradient(0, 0, 0, H); bg.addColorStop(0, '#070A33'); bg.addColorStop(1, '#0A0E40'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
    // canopy pools (soft, small: they read as hatched tone after the paper pass, so kept quiet)
    g.globalCompositeOperation = 'lighter';
    for (const q of nodes) { if (q.g > head) continue; const k = (0.35 + 0.65 * Math.exp(-(head - q.g) * 0.8)) * (o.pool ?? 0.10), [X, Y] = P(q.x, q.z), R = q.rad * sc;
      if (X < -R || X > W + R || Y < -R || Y > H + R) continue; const gr = g.createRadialGradient(X, Y, 0, X, Y, R); gr.addColorStop(0, rgba(q.col, k)); gr.addColorStop(1, rgba(q.col, 0)); g.fillStyle = gr; g.fillRect(X - R, Y - R, 2 * R, 2 * R); }
    g.globalCompositeOperation = 'source-over'; g.lineCap = 'round'; g.lineJoin = 'round';
    const wCore = (o.core ?? 2.4) * S;
    for (const q of roads) { if (q.g0 > head && q.depth > 0) continue; const r = q.r, s1 = q.depth === 0 ? r.len : r.sAtG(head); strokeRoad(P, r, s1, q.col, wCore * (q.lane === 0 ? 1.15 : 1), 0.22); }
    // nodes (written forks) and heads (the points being written)
    for (const q of roads) { if (q.depth === 0) continue; const r = q.r;
      if (head >= q.g1) { const a = r.at(r.len - 0.01), [X, Y] = P(a.x, a.z); g.fillStyle = 'rgba(255,250,240,0.9)'; g.beginPath(); g.arc(X, Y, 1.9 * S, 0, 7); g.fill(); }
      else if (head > q.g0) { const a = r.at(r.sAtG(head)), [X, Y] = P(a.x, a.z); g.fillStyle = rgba(q.col.map((v) => Math.min(255, v + 120)), 0.95); g.beginPath(); g.arc(X, Y, 2.6 * S, 0, 7); g.fill(); } }
    // the violet branch, same medium
    if (VL && t >= VL.grow[0]) { const V = violet(VL), r = V.r, p = sm(seg(t, VL.grow[0], VL.grow[1])), s1 = r.len * p;
      if (head >= V.node.g) { strokeRoad(P, r, s1, V.col.map((v) => Math.min(255, v + 25)), wCore * 1.5, 0.35);
        const hl = p < 1 ? s1 : r.len * (((t - VL.grow[1]) * 0.45) % 1), a = r.at(hl), [X, Y] = P(a.x, a.z), al = p < 1 ? 1 : Math.sin((hl / r.len) * Math.PI) * 0.8;
        g.globalCompositeOperation = 'lighter'; const R = 22 * S, gr = g.createRadialGradient(X, Y, 0, X, Y, R); gr.addColorStop(0, rgba([235, 225, 255], al)); gr.addColorStop(0.25, rgba(V.col, 0.7 * al)); gr.addColorStop(1, rgba(V.col, 0));
        g.fillStyle = gr; g.fillRect(X - R, Y - R, 2 * R, 2 * R); g.globalCompositeOperation = 'source-over'; } }
    return cv; }
  return { frame, cam, world: Wd };
}
