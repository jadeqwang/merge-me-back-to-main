// MERGE take two: the proof edit (bars 28-43) as a module the film calls for that range.
// A mechanical port of fable/proof/src/proof.js (which is unchanged and still renders on its own; regenerate this file with
// fable/take2/tools/port_proof.py if the proof changes): the file body is wrapped in makeProof(g, opts) so it draws on the film's
// canvas with the film's size, timing and plate folder. Drawing code is identical except: no page/query handling, no window.PROOF,
// fonts are loaded by the film, and opts.fixStrip restores three assignments that a comment swallowed in the proof's buildTimeline
// (proof.js line 93): without them the strip lyrics "And every branch remembers" and "Where I started from" get NaN alpha and are
// never drawn in the proof. With fixStrip off, frames equal the proof's (checked by pixel diff, see notes/compositor.md).
//   const P = await makeProof(g, { W, H, FPS, T, plates, twos, fixStrip }); P.t0 (bar 28), P.tEnd (bar 43); await P.render(t)

// MERGE proof segment, bar 28 downbeat to bar 43 downbeat. Canvas2D compositor: render(t) is a pure function of song time t.
//   page: /fable/proof/index.html?timing=/analysis_v2/timing.json&w=1920&h=1080&fps=30[&plates=/work_fable/proof/plates]
//   driven by fable/proof/tools/render.mjs (headless Chrome); see fable/proof/NOTES.md.
// Layers, bottom to top: background (near-black; night gradient + stars in bar 38) -> plates (A full-frame shots, B-C grid, D iris
// into root, E hero) -> paper grain (multiply) -> vignette -> lines and nodes (lanes, merge graph, main) -> flashes -> type.
// Every event time comes from the timing file by bar/beat index or lyric word time (timing.js). Cut decisions are made on the
// frame nearest the event (t >= event - half a frame), so a cut lands on the frame closest to its beat.
import { clamp01, lerp, seg, ease } from './timing.js';
import { LIVES, byId, hashOf, MAIN, PLATE_IDS } from '../../proof/lives.js';

export async function makeProof(g, o) {
const W = o.W, H = o.H, FPS = o.FPS;
const S = H / 1080, HF = 0.5 / FPS;
const TWOS = !!o.twos;
const PLATES = o.plates || '/work_fable/proof/plates';

const BG = '#05061A', CREAM = '#FFF1D6';
const G = 10 * S;                  // grid gutter
const YM = 0.82 * H;               // the lane / main line height
const NX = 0.12 * W;               // the commit node x in full-frame shots (and the root node's final x)
const fr = (t, e) => Math.round((t - e) * FPS);          // whole frames since event e (0 = the frame nearest e)
const on = (t, e) => t >= e - HF;                         // event e has happened (on the nearest frame)
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const mix = (h1, h2, u) => { const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16); const c = [16, 8, 0].map((s) => Math.round(lerp((a >> s) & 255, (b >> s) & 255, u))); return `rgb(${c[0]},${c[1]},${c[2]})`; };
const softcap = (c, L, m = 0.3) => (c <= L - m ? c : L - m * Math.exp(-(c - (L - m)) / m));   // keeps advancing, never reaches L

// ---------------------------------------------------------------- fonts and type metrics
const FONTS = [
  ['Archivo', '/engine/fonts/Archivo[wdth,wght].ttf', { weight: '100 900', stretch: '62% 125%' }],
  ['Instrument Serif', '/engine/fonts/InstrumentSerif-Italic.ttf', { style: 'italic' }],
  ['JetBrains Mono', '/engine/fonts/JetBrainsMono[wght].ttf', { weight: '100 800' }],
];
const FACE = {
  mono: (px, wt = 600) => ({ font: `${wt} ${px}px "JetBrains Mono"`, stretch: 'normal' }),
  serif: (px) => ({ font: `italic 400 ${px}px "Instrument Serif"`, stretch: 'normal' }),
  slab: (px) => ({ font: `800 ${px}px Archivo`, stretch: 'expanded' }),
};
function setFont(f) { g.font = f.font; g.fontStretch = f.stretch; g.textBaseline = 'alphabetic'; g.textAlign = 'left'; }
const CAP = {};    // cap height per px of font size, measured
function pxFor(face, cap, wt) { return cap / CAP[face + (wt || '')]; }
// sizes at 1080p (cap heights in px; the mono labels are font sizes, as the SPEC's HUD rule)
const SZ = { chyron: 36, commit: 26, lyricUL: 68, lyricStrip: 70, slab: 106, cellLabelPx: 26 };

// ---------------------------------------------------------------- plates
const META = {}, DIM = {}, CACHE = new Map(); const CMAX = 160;
const pdir = (id) => (o.dirs && o.dirs[id]) || `${PLATES}/${id}`;   // take two: o.dirs overrides a plate's folder
const url = (id, i) => `${pdir(id)}/frames/f_${String(i + 1).padStart(4, '0')}.jpg`;
async function bitmap(id, i) {
  const k = url(id, i); let p = CACHE.get(k);
  if (p) { CACHE.delete(k); CACHE.set(k, p); return p; }
  p = fetch(k).then((r) => { if (!r.ok) throw new Error('missing plate frame ' + k); return r.blob(); }).then((b) => createImageBitmap(b));
  CACHE.set(k, p); while (CACHE.size > CMAX) { const [k0, p0] = CACHE.entries().next().value; CACHE.delete(k0); p0.then((b) => b.close && b.close()).catch(() => {}); }
  return p;
}
const READY = new Map();   // url -> ImageBitmap for the current frame
// frame indices a plate draw needs (clip time c). With P.blend the two neighbouring source frames are cross-faded by the fractional
// position (full-frame plates always, 24 -> 30 fps with no repeated frames; grid cells when slowed). Grid cells at natural speed show
// floor(c*fps) so the head turn lands crisply on the frame nearest the bar 37 downbeat.
// twos: plate time quantised to 1/12 s on a grid that has a step boundary at the plate's turn_t, so the turn still lands on its frame
function twos(id, c) { const tt = META[id].turn_t || 0; return tt + Math.floor((c - tt) * 12 + 1e-6) / 12; }
function frameIdx(id, c) { const m = META[id]; if (TWOS) c = twos(id, c); const f = Math.max(0, c) * m.fps + (TWOS ? 1e-6 : 0); const i0 = Math.min(m.n - 1, Math.floor(f)); return { i0, i1: Math.min(m.n - 1, i0 + 1), fr: i0 >= m.n - 1 ? 0 : f - i0 }; }
// source crop for a plate drawn "cover" into rect (w,h) with zoom about focus (fx,fy)
function crop(id, w, h, zoom = 1, fx = 0.5, fy = 0.5) {
  const { w: iw, h: ih } = DIM[id]; const da = w / h, pa = iw / ih; let sw, sh;
  if (da > pa) { sw = iw; sh = iw / da; } else { sh = ih; sw = ih * da; }
  sw /= zoom; sh /= zoom; return { sx: (iw - sw) * fx, sy: (ih - sh) * fy, sw, sh };
}
function drawPlate(P) {
  const { id, c, rect: r, zoom = 1, alpha = 1 } = P; const { i0, i1, fr: f } = frameIdx(id, c); const cr = crop(id, r.w, r.h, zoom, P.fx, P.fy);
  g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.globalAlpha = alpha; g.drawImage(READY.get(url(id, i0)), cr.sx, cr.sy, cr.sw, cr.sh, r.x, r.y, r.w, r.h);
  if (P.blend && !TWOS && f > 0.02) { g.globalAlpha = alpha * f; g.drawImage(READY.get(url(id, i1)), cr.sx, cr.sy, cr.sw, cr.sh, r.x, r.y, r.w, r.h); }   // frame blend: no stepping when slowed
  g.restore();
}

// ---------------------------------------------------------------- timeline (all from the timing file)
let T, TL;
function buildTimeline() {
  TL = { t0: T.bar(28), tEnd: T.bar(43) }; TL.tStop = TL.tEnd + 0.5;
  const b28 = T.barBeatIndex(28), DUR = [4, 4, 2, 2, 2, 2, 1, 1, 1, 1]; let acc = 0;
  TL.shots = LIVES.slice(0, 10).map((L, i) => { const s = { id: L.id, i, t0: T.beatT(b28 + acc), t1: T.beatT(b28 + acc + DUR[i]), beats: DUR[i], push: DUR[i] >= 4 ? 0.03 : DUR[i] >= 2 ? 0.022 : 0.01 }; acc += DUR[i]; return s; });
  TL.grid = T.bar(33);
  if (Math.abs(TL.shots[9].t1 - TL.grid) > 0.02) console.log(`WARN shots end ${TL.shots[9].t1} != bar 33 ${TL.grid}`);
  const b33 = T.barBeatIndex(33); TL.start = {}; TL.c0 = {};
  let j = 0; for (const L of LIVES) { if (L.id === 'sandstorm') { TL.start[L.id] = TL.grid; continue; } j++; TL.start[L.id] = T.beatT(b33 + 0.5 * j); }
  TL.hit = T.bar(37); TL.pulse = T.beat(37, 3); TL.gather = T.beat(37, 4); TL.t38 = T.bar(38); TL.t39 = T.bar(39); TL.irisEnd = T.beat(39, 3); TL.t41 = T.bar(41);
  TL.col = [0, 1, 2, 3].map((c) => T.beat(38, c + 1)); TL.shrunk = [0, 1, 2, 3].map((c) => T.beat(38, c + 1.5)); TL.arr = [0, 1, 2, 3].map((c) => T.beat(38, c + 1.9));
  TL.L4 = T.line('Each one a story to unfold'); TL.L5 = T.line('And every branch remembers'); TL.L6 = T.line('Where I started from'); TL.L7 = T.line('Merge me back to main');
  const outOf = (L, next) => Math.min(L.words[L.words.length - 1].end + 0.5, next ? next.words[0].start - 0.1 : 1e9);
  TL.L4.out = Math.min(outOf(TL.L4, TL.L5), TL.L4.words[TL.L4.words.length - 1].end + 0.3);   // short hold so it is gone before the next cut TL.L5.out = outOf(TL.L5, TL.L6); TL.L6.out = outOf(TL.L6, null); TL.L7.out = TL.tEnd;
  if (o.fixStrip) { TL.L5.out = outOf(TL.L5, TL.L6); TL.L6.out = outOf(TL.L6, null); TL.L7.out = TL.tEnd; }   // take two: the proof's lost line
}

// ---------------------------------------------------------------- A: the lives, one at a time
// section A: the lyric, chip and node go to the side away from her (lives.js side = her side)
const awayRight = (id) => byId[id].side === 'left';
const nodeX = (id) => (awayRight(id) ? W - NX : NX);
function shotAt(t) { let s = null; for (const q of TL.shots) if (on(t, q.t0)) s = q; return s; }
function clipA(s, t) { const m = META[s.id]; const last = (m.n - 1) / m.fps; const lim = m.turn_t != null ? m.turn_t - 0.4 : last; return softcap(Math.max(0, t - s.t0), Math.min(lim, last)); }

// ---------------------------------------------------------------- B-C: the grid (twelve 16:9 cells in the top of the frame, a lyric strip below)
const NCELL = 12, CW = 470 * S, CH = CW * 9 / 16, GX0 = (W - (4 * CW + 3 * G)) / 2, GY0 = 14 * S, GB = GY0 + 3 * CH + 2 * G;
const CELL = [...Array(NCELL)].map((_, i) => { const col = i % 4, row = Math.floor(i / 4); return { x: GX0 + col * (CW + G), y: GY0 + row * (CH + G), w: CW, h: CH, col, row }; });
const GCX = W / 2, GCY = (GY0 + GB) / 2;                 // grid centre (the hit punch scales about it)
const NODE_U = 0.88;                                     // grid cells: the node sits at the right end of the lane (A: 0.12)
const STRIP_BASE = 1000 * S;                             // baseline of the strip lyric (strip = GB..H)

// clip time of grid cell i: slowed pre-turn action, the turn on the bar 37 downbeat at natural speed, then an easing hold
function preMap(t, ta, tP, c0, P) {
  const span = tP - ta, D = P - c0, u = clamp01((t - ta) / span);
  const pw = (R) => { const a = Math.min(0.9, 0.4 * R), k = (R - a) / (1 - a); return a * u + (1 - a) * Math.pow(u, k); };
  if (D <= 0.05 || span <= 0.05) return P - (tP - t);
  const R = span / D;
  if (R <= 1) return c0 + D * u;
  if (R <= 4) return c0 + D * pw(R);
  // too little pre-turn action for the time: ping-pong it (fold a path of span/3 seconds over the last Dm seconds before P)
  const Lp = span / 3, s = Lp * pw(3), Dm = Math.max(0.3, Math.min(P, 1.5)); const r = (Lp - s) % (2 * Dm); const tri = r <= Dm ? r : 2 * Dm - r; return P - tri;
}
function turnOf(id) { const m = META[id], last = (m.n - 1) / m.fps; return m.turn_t != null ? m.turn_t : Math.min(2.5, last * 0.5); }
function gridClip(i, t) {
  const id = LIVES[i].id, m = META[id], last = (m.n - 1) / m.fps; const turn = turnOf(id);
  const hit = TL.hit - HF;          // half a frame early, so the turn is on screen from the frame nearest the downbeat
  const P = turn - 0.35, tP = hit - 0.35; let c;
  if (t >= tP) { const x = t - hit, nat = Math.min(1.2, 0.5 * (last - turn)); if (x <= nat) c = turn + x;
    else {   // ease toward the last frame, arriving when the cell has shrunk into its node (bar 38), never stopping before that
      const span = Math.max(0.1, TL.shrunk[CELL[i].col] + 0.1 - hit - nat), D = Math.max(0.05, last - 0.06 - (turn + nat)), u = clamp01((x - nat) / span), R = span / D;
      if (R <= 1) c = turn + nat + D * u; else { const a = 0.25, p = (R - a) / (1 - a); c = turn + nat + D * (a * u + (1 - a) * (1 - Math.pow(1 - u, p))); }
      if (x > nat + span) c += (x - nat - span) * 0.05; } }
  else c = preMap(t, TL.start[id], tP, TL.c0[id] || 0, P);
  return softcap(Math.max(0, c), last);
}

// ---------------------------------------------------------------- D (bar 38): camera and merge geometry. World = grid screen coords at bar 38.
// The camera travels left along main (the graph scrolls right, accelerating) and pulls back about the frame centre; main stays at YM.
const ZOOM_END = 0.8, ZAX = 1880 * S;
function cam(t) { const u = seg(t, TL.t38, TL.t39); return { L: 0, s: 1 - (1 - ZOOM_END) * u * u }; }
const toScr = (c, p) => ({ x: ZAX + (p.x - ZAX) * c.s, y: YM + (p.y - YM) * c.s });
let XROOT;   // world x of the root node: lands on NX at bar 39 (set in boot)
function mergeOf(i) { const c = CELL[i]; const n = { x: c.x + NODE_U * c.w, y: c.y + c.h - 2 * S }; const D = (70 + 0.38 * (YM - n.y) / S) * S; return { n, j: { x: n.x - D, y: YM }, D, col: c.col, row: c.row }; }
// the S-curve from node to junction: leaves the node heading left, arrives on main heading left (horizontal tangents at both ends)
function sCurve(c, m, N = 40) { const pts = []; for (let k = 0; k <= N; k++) { const u = k / N, a = (1 - u) ** 3, b = 3 * u * (1 - u) ** 2, d = 3 * u * u * (1 - u), e = u ** 3;
    const x = a * m.n.x + b * (m.n.x - 0.55 * m.D) + d * (m.j.x + 0.55 * m.D) + e * m.j.x, y = a * m.n.y + b * m.n.y + d * YM + e * YM; pts.push(toScr(c, { x, y })); } return pts; }

// state of every cell at t (screen coords)
function gridState(t) {
  const fh = fr(t, TL.hit), punch = on(t, TL.hit) && fh <= 6 ? 1 + 0.03 * Math.pow(1 - fh / 6, 2) : 1;
  const C = cam(t), cells = [];
  for (let i = 0; i < NCELL; i++) {
    const L = LIVES[i], c0 = CELL[i], ta = TL.start[L.id]; if (!on(t, ta)) continue;
    let r = { x: GCX + (c0.x - GCX) * punch, y: GCY + (c0.y - GCY) * punch, w: c0.w * punch, h: c0.h * punch };
    let lineRel = 1, nodeU = NODE_U, pop = 1, lineW = 5 * S, from = null, alpha = 1; const f = fr(t, ta);
    if (L.id === 'sandstorm') {            // the full-frame plate scales down into its cell over 8 frames
      const u = ease.out(clamp01((f + 1) / 8)); from = u;
      r = { x: lerp(0, r.x, u), y: lerp(0, r.y, u), w: lerp(W, r.w, u), h: lerp(H, r.h, u) }; lineRel = lerp(0.82, 1, u); nodeU = lerp(nodeX('sandstorm') / W, NODE_U, u); lineW = lerp(6, 5, u) * S;
    } else { pop = clamp01((f + 1) / 4); const s = 0.55 + 0.45 * ease.outBack(pop); alpha = clamp01(pop * 2); const ccx = r.x + r.w / 2, ccy = r.y + r.h / 2; r = { x: ccx - r.w * s / 2, y: ccy - r.h * s / 2, w: r.w * s, h: r.h * s }; }
    let ly = r.y + r.h * lineRel - 2 * S * (from === null ? 1 : from);
    let node = { x: r.x + nodeU * r.w, y: ly }, sigma = 1; const m = mergeOf(i);
    if (on(t, TL.t38)) {     // bar 38: the cell (in world coords) shrinks into its node in the first half of its column's beat
      sigma = 1 - ease.io(seg(t, TL.col[m.col], TL.shrunk[m.col]));
      const wr = { x: m.n.x + (c0.x - m.n.x) * sigma, y: m.n.y + (c0.y + 2 * S - m.n.y) * sigma - 2 * S * sigma, w: c0.w * sigma, h: c0.h * sigma };
      const a = toScr(C, { x: wr.x, y: wr.y }), b = toScr(C, { x: wr.x + wr.w, y: wr.y + wr.h }); r = { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y };
      node = toScr(C, m.n); ly = node.y;
    }
    cells.push({ i, L, rect: r, node, ly, lineW, pop, alpha, sigma, from, m, c: gridClip(i, t), ta });
  }
  return { cells, punch, cam: C };
}

// ---------------------------------------------------------------- scene: which plates are drawn where (so frames can be preloaded)
function scene(t) {
  const P = []; const sc = { plates: P, t };
  if (t >= TL.tEnd - HF) { sc.black = true; return sc; }
  const full = { x: 0, y: 0, w: W, h: H };
  if (on(t, TL.t41)) { const f = fr(t, TL.t41), punch = f <= 8 ? 1 + 0.04 * Math.pow(1 - f / 8, 2) : 1;
    P.push({ id: 'hero', c: softcap(t - TL.t41, (META.hero.n - 1) / META.hero.fps), rect: full, zoom: (o.hero ? o.hero.zoom : 1) * (1 + 0.04 * seg(t, TL.t41, TL.tEnd)) * punch, fx: o.hero ? o.hero.fx : 0.5, fy: o.hero ? o.hero.fy : 0.5, blend: o.heroBlend !== false }); sc.phase = 'E'; return sc; }
  if (!on(t, TL.grid)) { const s = shotAt(t) || TL.shots[0]; sc.shot = s; sc.phase = 'A'; P.push({ id: s.id, c: clipA(s, t), rect: full, zoom: 1 + s.push * seg(t, s.t0, s.t1), fy: clamp01(0.45 + (byId[s.id].yshift || 0)), blend: true }); return sc; }
  sc.phase = t < TL.t38 - HF ? 'B' : 'D';
  const GS = gridState(t); sc.grid = GS;
  if (o.trail && on(t, TL.t38)) for (const C of GS.cells) {   // take two: afterimages of the panel's last frame, from its place toward its node
    const m = C.m, c0 = CELL[C.i]; if (!on(t, TL.col[m.col]) || C.sigma > 0.98) continue;
    const cLast = gridClip(C.i, TL.shrunk[m.col]), fade = 1 - ease.io(seg(t, TL.shrunk[m.col], TL.t39 + 0.3)), fo = META[C.L.id].focus || [0.5, 0.5];
    for (let k = 0; k < 5; k++) { const sg = 1 - k * 0.19; if (C.sigma > sg - 0.03) continue;
      const wr = { x: m.n.x + (c0.x - m.n.x) * sg, y: m.n.y + (c0.y - m.n.y) * sg, w: c0.w * sg, h: c0.h * sg };
      const a = toScr(GS.cam, { x: wr.x, y: wr.y }), b = toScr(GS.cam, { x: wr.x + wr.w, y: wr.y + wr.h });
      P.push({ id: C.L.id, c: cLast, rect: { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y }, alpha: fade * (0.55 - 0.08 * k), ghost: C.L.color, fx: fo[0], fy: fo[1] }); } }
  for (const C of GS.cells) if (C.sigma > 0.004 && C.rect.w > 1) { const fo = META[C.L.id].focus || [0.5, 0.5];
    P.push({ id: C.L.id, c: C.c, rect: C.rect, alpha: C.alpha, cell: C, fx: fo[0], fy: fo[1], blend: (gridClip(C.i, t + 0.02) - C.c) / 0.02 < 0.85 }); }
  if (on(t, TL.t39)) {
    const node = toScr(GS.cam, { x: XROOT, y: YM }); const u = ease.io(seg(t, TL.t39, TL.irisEnd));
    const R = Math.hypot(Math.max(node.x, W - node.x), Math.max(node.y, H - node.y)) * 1.02;
    sc.iris = { node, r: Math.max(26 * S, u * R), done: on(t, TL.irisEnd), u };
    const rootLast = (META.root.n - 1) / META.root.fps;
    P.push({ id: 'root', c: softcap(Math.max(0, t - TL.t39), rootLast), rect: full, zoom: 1 + 0.12 * Math.pow(seg(t, TL.t39, TL.t41), 2.4), iris: sc.iris, blend: true });
  }
  return sc;
}

// ---------------------------------------------------------------- grain, vignette, night
const GRAIN = []; const GT = 512;
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function buildGrain() {
  for (let k = 0; k < 6; k++) {
    const rnd = mulberry32(1000 + k * 7919); const c = document.createElement('canvas'); c.width = c.height = GT; const x = c.getContext('2d'); const im = x.createImageData(GT, GT);
    const coarse = new Float32Array((GT / 4) * (GT / 4)); for (let i = 0; i < coarse.length; i++) coarse[i] = rnd();
    for (let y = 0; y < GT; y++) for (let xx = 0; xx < GT; xx++) {
      const fine = rnd(), cc = coarse[(y >> 2) * (GT / 4) + (xx >> 2)], fib = rnd() < 0.004 ? 0.5 : 0;   // fine tooth, soft clumps, rare fibre flecks
      const v = 1 - (0.075 * fine * fine + 0.035 * cc + 0.06 * fib); const b = Math.round(255 * v); const o = (y * GT + xx) * 4;
      im.data[o] = b; im.data[o + 1] = Math.round(b * 0.995); im.data[o + 2] = Math.round(b * 0.985); im.data[o + 3] = 255;
    }
    x.putImageData(im, 0, 0); GRAIN.push(c);
  }
}
function grain(t) {
  const n = Math.floor(t * 12 + 1e-6); const r = mulberry32(n * 2654435761); const tile = GRAIN[Math.floor(r() * GRAIN.length)];
  const pat = g.createPattern(tile, 'repeat'); pat.setTransform(new DOMMatrix().translate(-Math.floor(r() * GT), -Math.floor(r() * GT)));
  g.save(); g.globalCompositeOperation = 'multiply'; g.fillStyle = pat; g.fillRect(0, 0, W, H); g.restore();
}
function vignette() {
  const gr = g.createRadialGradient(W / 2, H / 2, H * 0.45, W / 2, H / 2, Math.hypot(W, H) * 0.56);
  gr.addColorStop(0, 'rgba(5,6,26,0)'); gr.addColorStop(1, 'rgba(5,6,26,0.24)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
}
const STARS = (() => { const r = mulberry32(4242); return [...Array(90)].map(() => ({ x: (r() * 2.2 - 0.6) * W, y: r() * 0.75 * H, s: 0.8 + 1.8 * r() * r(), ph: r() * 6.283, a: 0.35 + 0.6 * r() })); })();
function night(t, C) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#05061A'); gr.addColorStop(1, '#0B1240'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  for (const s of STARS) { const x = ZAX + (s.x - ZAX) * (1 - 0.35 * (1 - C.s)), y = s.y; if (x < -4 || x > W + 4) continue; g.globalAlpha = s.a * (0.75 + 0.25 * Math.sin(s.ph + t * 3)); g.fillStyle = '#FFF1D6'; g.beginPath(); g.arc(x, y, s.s * S, 0, 6.2832); g.fill(); }
  g.globalAlpha = 1;
}

// ---------------------------------------------------------------- lines and nodes
function line(x0, y0, x1, y1, col, w, under = true) {
  g.lineCap = 'butt';
  if (under) { g.strokeStyle = 'rgba(5,6,26,0.45)'; g.lineWidth = w + 4 * S; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
}
function ring(x, y, r, col, w = 5 * S, fill = BG) {
  g.beginPath(); g.arc(x, y, r + w / 2 + 2 * S, 0, 6.2832); g.fillStyle = 'rgba(5,6,26,0.45)'; g.fill();
  g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fillStyle = fill; g.fill(); g.lineWidth = w; g.strokeStyle = col; g.stroke();
}
function glow(x, y, r, col, a = 1) {
  const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.25, hexA(col, 0.8 * a)); gr.addColorStop(1, hexA(col, 0));
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill();
}
// a thick lane stroke: soft edge, lane-colour body, bright core, round caps; drawn up to arc length `upto`; returns the head point
function stroke(pts, col, w, upto = 1e9) {
  let acc = 0, head = pts[0]; const path = [pts[0]];
  for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], l = Math.hypot(b.x - a.x, b.y - a.y); if (acc + l >= upto) { const u = (upto - acc) / (l || 1); head = { x: lerp(a.x, b.x, u), y: lerp(a.y, b.y, u) }; path.push(head); break; } acc += l; path.push(b); head = b; }
  g.lineJoin = 'round'; g.lineCap = 'round';
  for (const [c, ww] of [[hexA(col, 0.22), w * 2.4], [hexA(col, 0.45), w * 1.5], [col, w], [mix(col, '#FFFFFF', 0.65), w * 0.38]]) {
    g.strokeStyle = c; g.lineWidth = ww; g.beginPath(); g.moveTo(path[0].x, path[0].y); for (const p of path.slice(1)) g.lineTo(p.x, p.y); g.stroke(); }
  return head;
}
const plen = (pts) => { let l = 0; for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y); return l; };

function linesA(t, s) {
  const L = byId[s.id], prev = s.i > 0 ? byId[TL.shots[s.i - 1].id].color : MAIN, f = fr(t, s.t0), nx = nodeX(s.id);
  const maxD = Math.max(nx, W - nx), r = f >= 2 ? 1e9 : ((f + 1) / 3) * maxD;     // the new colour wipes out from wherever the node now is
  if (o.writtenLanes) { const WL = o.writtenLanes, pts = [{ x: 0, y: YM }, { x: W, y: YM }], a = Math.max(0, nx - r), b = Math.min(W, nx + r), sc = (t - s.t0) * 7;   // take two
    if (s.i > 0 && (a > 0 || b < W)) line(0, YM, W, YM, prev, 4 * S);
    WL.drawWrittenLane(g, pts, { text: WL.laneString([L.msg], true), color: L.color, cap: 24 * S, scroll: sc, from: a, upto: b, under: 0.45 }); }
  else {
  line(0, YM, W, YM, prev, 6 * S);
  line(Math.max(0, nx - r), YM, Math.min(W, nx + r), YM, L.color, 6 * S, false); }
  if (f < 2) for (const x of [nx - r, nx + r]) if (x > 0 && x < W) glow(x, YM, 18 * S, L.color, 0.9);
  ring(nx, YM, 13 * S + (f < 4 ? 5 * S * (1 - f / 4) : 0), L.color);
}
// bars 33-37: each cell's lane along its bottom edge, the node at its right end; bar 37 beat 3 a pulse runs left to right, beat 4 the
// lit lane gathers into the node
function linesCells(t, sc) {
  for (const C of sc.grid.cells) {
    if (C.sigma < 0.02) continue; const col = C.L.color, r = C.rect, y = C.ly, x0 = r.x, x1 = r.x + r.w, nx = C.node.x;
    const span = C.pop < 1 ? ease.out(C.pop) : 1;
    g.save(); g.globalAlpha = clamp01((C.sigma - 0.05) / 0.3);
    line(lerp(nx, x0, span), y, lerp(nx, x1, span), y, col, C.lineW);
    if (on(t, TL.pulse) && t < TL.gather - HF) { const u = ease.io(seg(t, TL.pulse, TL.gather)), hx = lerp(x0, x1, u);
      line(Math.max(x0, hx - 140 * S), y, hx, y, '#FFFFFF', C.lineW * 0.9, false); glow(hx, y, 26 * S, col, 1); }
    else if (on(t, TL.gather) && t < TL.t38 + 0.05) { const u = ease.in(seg(t, TL.gather, TL.t38)), lx = lerp(x0, nx, u), rx = lerp(x1, nx, u);
      line(lx, y, rx, y, mix(col, '#FFFFFF', 0.6), C.lineW * 1.2, false); glow(nx, y, (16 + 26 * u) * S, col, 0.6 + 0.4 * u); }
    const fl = C.pop < 1 ? 1 - C.pop : 0; ring(nx, y, (9 + 6 * fl) * S, col, 4 * S);
    if (C.pop < 1) glow(nx, y, 30 * S, col, 1 - C.pop);
    g.restore();
  }
}
// bar 38: column by column (left first, one per beat) each node throws its lane down-left into main; main thickens with every merge
function mergedFrac(t) { let m = 0; for (let c = 0; c < 4; c++) m += 3 * clamp01((fr(t, TL.arr[c]) + 1) / 4); return m / 12; }
function linesMerge(t, sc) {
  const C = sc.grid.cam, m = mergedFrac(t), iris = sc.iris;
  const root = toScr(C, { x: XROOT, y: YM });
  // strokes and strands (kept off the root plate: clipped to outside the iris)
  g.save(); if (iris) { g.beginPath(); g.rect(0, 0, W, H); g.arc(iris.node.x, iris.node.y, iris.r, 0, 6.2832, true); g.clip('evenodd'); }
  const ga = iris ? 1 - clamp01(iris.u * 1.4) : 1; g.globalAlpha = ga;
  for (const c of sc.grid.cells) {
    if (!on(t, TL.col[c.m.col] + 0.25 * (TL.shrunk[c.m.col] - TL.col[c.m.col]))) continue;
    const col = c.L.color, pts = sCurve(C, c.m), Lp = plen(pts), u = ease.io(seg(t, TL.col[c.m.col] + 0.25 * (TL.shrunk[c.m.col] - TL.col[c.m.col]), TL.arr[c.m.col]));
    const head = stroke(pts, col, 12 * S, u * Lp);
    if (u < 1) glow(head.x, head.y, 34 * S, col, 1);
    else {   // merged: a strand runs on alongside main for a short way, then joins it
      const j = pts[pts.length - 1], len = 230 * C.s, off = (5 + 3 * c.m.row) * S + 9 * S * m;
      const gr = g.createLinearGradient(j.x, 0, j.x - len, 0); gr.addColorStop(0, hexA(col, 0.95)); gr.addColorStop(1, hexA(col, 0));
      g.strokeStyle = gr; g.lineCap = 'round'; g.lineWidth = 5 * S; g.beginPath(); g.moveTo(j.x, YM - off * 0.2); g.bezierCurveTo(j.x - len * 0.3, YM - off, j.x - len * 0.7, YM - off, j.x - len, YM - off * 0.6); g.stroke();
      const f = fr(t, TL.arr[c.m.col]); if (f < 12) { const v = f / 12; g.beginPath(); g.arc(j.x, YM, (16 + 46 * v) * S, 0, 6.2832); g.lineWidth = 5 * S * (1 - v) + 1; g.strokeStyle = f < 2 ? '#FFFFFF' : hexA(col, 1 - v); g.stroke(); glow(j.x, YM, (60 - 30 * v) * S, f < 2 ? '#FFFFFF' : col, 1 - v); }
      ring(j.x, YM, 8 * S, col, 4 * S, MAIN);
    }
    if (c.sigma < 0.6) ring(c.node.x, c.node.y, 10 * S, col, 5 * S);
  }
  g.restore();
  // main: root to the right edge, 3x wider and brighter by the last merge
  const a = clamp01((fr(t, TL.t38) + 1) / 4), wM = (6 + 12 * m) * S, x0 = Math.max(-20, root.x);
  g.globalAlpha = a; g.lineCap = 'butt';
  g.strokeStyle = hexA(MAIN, 0.25 * (0.4 + m)); g.lineWidth = wM * 2.6; g.beginPath(); g.moveTo(x0, YM); g.lineTo(W + 20, YM); g.stroke();
  line(x0, YM, W + 20, YM, mix(MAIN, '#FFC27A', 0.5 * m), wM);
  g.strokeStyle = hexA('#FFF1D6', 0.35 + 0.4 * m); g.lineWidth = wM * 0.3; g.beginPath(); g.moveTo(x0, YM); g.lineTo(W + 20, YM); g.stroke();
  g.globalAlpha = 1;
  if (root.x > -60) ringRoot(t, root.x);
}
function ringRoot(t, x) {
  const k = seg(t, TL.t39, TL.t41); glow(x, YM, (60 + 110 * k * k) * S, MAIN, 0.45 + 0.55 * k);
  ring(x, YM, 24 * S, MAIN, 8 * S, mix(BG, '#FFD9A8', 0.15 + 0.75 * k * k));
}
function linesRoot(t, sc) {
  // over the root plate the only overlay is main, ending in the root node; light pulses rush along it into the node, faster into bar 41
  const D = TL.t41 - TL.t39, u = seg(t, TL.t39, TL.t41), s = 600 * S * (t - TL.t39) + 2600 * S * D * Math.pow(u, 3) / 3;
  const wM = lerp(18, 12, ease.io(seg(t, TL.t39, TL.irisEnd))) * S;
  line(NX, YM, W + 10, YM, mix(MAIN, '#FFC27A', 0.4), wM);
  const span = W - NX, gap = 380 * S;
  for (let j = 0; j * gap < span + gap; j++) { const x = W - ((s + j * gap) % (span + gap)); if (x > NX + 30 * S && x < W) { line(x, YM, Math.min(W, x + (40 + 120 * u) * S), YM, '#FFE2B8', wM * 0.4, false); glow(x, YM, 16 * S, MAIN, 0.7); } }
  ringRoot(t, NX);
}
// chorus test: main written as a line of text (mono caps, lane orange, ~22 px cap) scrolling slowly left, on a thin solid rule
let LANE_TXT = null;
function linesHero(t) {
  const cap = 22 * S, f = FACE.mono(pxFor('mono', cap, 600), 600); setFont(f);
  if (!LANE_TXT) { const str = ['merge me back to main', ...LIVES.map((l) => l.msg)].join(' \u00b7 ').toUpperCase() + ' \u00b7 '; LANE_TXT = { str, w: g.measureText(str).width }; }
  const yb = YM + cap / 2, off = ((t - TL.t41) * 46 * S) % LANE_TXT.w, gapL = NX - 34 * S, gapR = NX + 34 * S;
  g.save(); g.beginPath(); if (o.hero && o.hero.gap) { const a = o.hero.gap[0] * W, b = o.hero.gap[1] * W; g.rect(0, 0, gapL, H); g.rect(gapR, 0, a - gapR, H); g.rect(b, 0, W - b, H); }   // take two: her legs pass in front of the lane
  else { g.rect(0, 0, gapL, H); g.rect(gapR, 0, W - gapR, H); } g.clip();
  textShadow(0.55, 6); g.fillStyle = MAIN; for (let x = -off; x < W; x += LANE_TXT.w) g.fillText(LANE_TXT.str, x, yb); noShadow();
  line(0, yb + 7 * S, W, yb + 7 * S, MAIN, 2.5 * S); g.restore();
  line(gapL, yb + 7 * S, gapR, yb + 7 * S, MAIN, 2.5 * S);
  ring(NX, YM + 2 * S, 13 * S, MAIN, 6 * S);
}

// ---------------------------------------------------------------- type
function textShadow(a = 0.75, blur = 10, col = '5,6,26') { g.shadowColor = `rgba(${col},${a})`; g.shadowBlur = blur * S; g.shadowOffsetX = 0; g.shadowOffsetY = 2 * S; }
function noShadow() { g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0; }
function chipRect(x, y, w, h) { g.fillStyle = 'rgba(5,6,26,0.82)'; g.beginPath(); g.roundRect(x, y, w, h, 4 * S); g.fill(); }
// A: the chip. Line 1: dot, branch, dim hash. Line 2: commit message. Its outer edge sits on the node's outer edge (left or right
// side, away from her); bottom above the lane.
function chyron(t, s, alpha = 1) {
  const L = byId[s.id]; if (!L.branch) return; g.save(); g.globalAlpha = alpha;
  const f1 = FACE.mono(pxFor('mono', SZ.chyron * S, 600), 600), f2 = FACE.mono(pxFor('mono', SZ.commit * S, 500), 500); const hash = hashOf(s.id);
  const padX = 16 * S, padT = 12 * S, padB = 14 * S, gapL = 16 * S, dotR = 9 * S;
  setFont(f1); const wb = g.measureText(L.branch).width, wh = g.measureText(hash).width, gap = g.measureText(' ').width * 1.5;
  setFont(f2); const wm = g.measureText(L.msg).width;
  const right = awayRight(s.id), nx = nodeX(s.id), bottom = YM - 26 * S, h = padT + SZ.chyron * S + gapL + SZ.commit * S + padB + 7 * S, by = bottom - h;
  const w = Math.max(padX + 2 * dotR + 12 * S + wb + gap + wh, padX + wm) + padX;
  const bx = right ? nx + 14 * S - w : nx - 14 * S, tx = bx + padX + 2 * dotR + 12 * S;
  chipRect(bx, by, w, h);
  const y1 = by + padT + SZ.chyron * S, y2 = y1 + gapL + SZ.commit * S;
  g.fillStyle = L.color; g.beginPath(); g.arc(bx + padX + dotR, y1 - SZ.chyron * S / 2, dotR, 0, 6.2832); g.fill();
  setFont(f1); g.fillStyle = L.color; g.fillText(L.branch, tx, y1); g.fillStyle = hexA(L.color, 0.5); g.fillText(hash, tx + wb + gap, y1);
  setFont(f2); g.fillStyle = 'rgba(255,241,214,0.94)'; g.fillText(L.msg, bx + padX, y2); g.restore();
}
// grid: the same chip, smaller: dot + branch, bottom-left of the cell above its lane
function cellLabels(t, sc) {
  const f = FACE.mono(SZ.cellLabelPx * S, 600);
  for (const C of sc.grid.cells) {
    const r = C.rect; const a = clamp01(C.from === null ? C.pop : (C.from - 0.6) / 0.4) * (on(t, TL.t38) ? 1 - clamp01((fr(t, TL.t38) + 1) / 4) : 1); if (a <= 0.01) continue;   // no labels in bar 38
    setFont(f); const w = g.measureText(C.L.branch).width, cap = SZ.cellLabelPx * 0.73 * S, dotR = 6 * S, pad = 9 * S;
    const h = cap + 2 * pad + 4 * S, bx = r.x + 10 * S, by = C.ly - 12 * S - h;
    g.save(); g.globalAlpha = a; chipRect(bx, by, pad + 2 * dotR + 9 * S + w + pad, h);
    g.fillStyle = C.L.color; g.beginPath(); g.arc(bx + pad + dotR, by + h / 2, dotR, 0, 6.2832); g.fill(); g.fillText(C.L.branch, bx + pad + 2 * dotR + 9 * S, by + pad + cap + 1 * S); g.restore();
  }
}
// lyric line: words on their sung times; all stay until the line ends
function wordAlpha(t, w) { if (!on(t, w.start)) return 0; return clamp01((fr(t, w.start) + 1) / 3); }
function lineAlpha(L, t, fade = 0.3) { return 1 - clamp01((t - L.out) / fade); }
// A: "Each one a story / to unfold", upper left, ink on light plates and cream on dark ones (switches on the cut), thin opposite shadow
const UL_ROWS = [4, 2];
function lyricUL(t, L, shot) {
  const la = lineAlpha(L, t, 0.2); if (la <= 0 || !on(t, L.words[0].start)) return;
  const light = shot && byId[shot.id].tone === 'light'; const ink = light ? '#14122B' : CREAM, sh = light ? '255,241,214' : '20,18,43';
  const f = FACE.serif(pxFor('serif', SZ.lyricUL * S)); setFont(f); const sp = g.measureText(' ').width, lead = SZ.lyricUL * S * 1.32;
  let wi = 0;
  const right = shot && awayRight(shot.id); let wj = 0;
  UL_ROWS.forEach((n, ri) => { const rw = L.words.slice(wj, wj + n).map((w) => g.measureText(w.w).width); wj += n; const tot = rw.reduce((a, b) => a + b, 0) + sp * (rw.length - 1);
    let x = right ? W - 110 * S - tot : 110 * S; const y = 40 * S + SZ.lyricUL * S + ri * lead;
    for (let k = 0; k < n && wi < L.words.length; k++, wi++) { const w = L.words[wi], a = wordAlpha(t, w) * la, ww = g.measureText(w.w).width;
      if (a > 0) { const rise = (1 - clamp01((fr(t, w.start) + 1) / 4)) * 8 * S; g.save(); g.globalAlpha = a; textShadow(light ? 0.55 : 0.6, 5, sh); g.shadowOffsetY = 1.5 * S; g.fillStyle = ink; g.fillText(w.w, x, y + rise); noShadow(); g.restore(); }
      x += ww + sp; } });
}
// the strip lyric ("And every branch remembers", "Where I started from"): centred in the strip under the grid, same place over the
// last full-frame plates and over the bar 38 graph; cream, soft shadow, no box
function lyricStrip(t) {
  const cap = SZ.lyricStrip * S, f = FACE.serif(pxFor('serif', cap)); setFont(f); const sp = g.measureText(' ').width;
  for (const L of [TL.L5, TL.L6]) { const la = lineAlpha(L, t); if (la <= 0 || !on(t, L.words[0].start)) continue;
    const ws = L.words.map((w) => g.measureText(w.w).width), tot = ws.reduce((a, b) => a + b, 0) + sp * (ws.length - 1); let x = (W - tot) / 2;
    L.words.forEach((w, i) => { const a = wordAlpha(t, w) * la; if (a > 0) { const rise = (1 - clamp01((fr(t, w.start) + 1) / 4)) * 8 * S; g.save(); g.globalAlpha = a; textShadow(0.8, 14); g.fillStyle = CREAM; g.fillText(w.w, x, STRIP_BASE + rise); noShadow(); g.restore(); } x += ws[i] + sp; });
  }
}
const SLAB_ROWS = (o.hero && o.hero.rows) || [[0], [1, 2], [3, 4]], SLAB_X = 100 * S, SLAB_TRACK = -0.01;   // take two: o.hero.rows
function slabLayout() {
  const cap = SZ.slab * S, f = FACE.slab(pxFor('slab', cap)); setFont(f); g.letterSpacing = `${SLAB_TRACK * pxFor('slab', cap)}px`;
  const sp = g.measureText(' ').width * 0.8, lead = cap * 1.34, yLast = YM - 130 * S, words = [];
  SLAB_ROWS.forEach((row, ri) => { let x = SLAB_X; const y = yLast - (SLAB_ROWS.length - 1 - ri) * lead;
    for (const wi of row) { const txt = TL.L7.words[wi].w.toUpperCase(), ww = g.measureText(txt).width; words.push({ wi, txt, x, y, w: ww }); x += ww + sp; } });
  g.letterSpacing = '0px'; return { f, words };
}
let SLAB;
function slab(t) {
  const L = TL.L7; if (!on(t, L.words[0].start) || t >= TL.tEnd - HF) return;
  setFont(SLAB.f); g.letterSpacing = `${SLAB_TRACK * pxFor('slab', SZ.slab * S)}px`;
  for (const q of SLAB.words) { const w = L.words[q.wi]; if (!on(t, w.start)) continue;
    const ff = fr(t, w.start), u = ease.out(clamp01((ff + 1) / 5)), s = lerp(1.08, 1, u), a = clamp01((ff + 1) / 2);
    g.save(); g.globalAlpha = a; g.translate(q.x, q.y); g.scale(s, s); g.fillStyle = CREAM; g.shadowColor = 'rgba(5,6,26,0.5)'; g.shadowBlur = 36 * S; g.fillText(q.txt, 0, 0); textShadow(0.6, 10); g.fillText(q.txt, 0, 0); noShadow(); g.restore(); }
  g.letterSpacing = '0px';
}

// ---------------------------------------------------------------- the frame
function draw(t, sc) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; noShadow();
  g.fillStyle = sc.black ? '#000' : BG; g.fillRect(0, 0, W, H); if (sc.black) return;
  // ---- background and plates
  const hf = fr(t, TL.hit);
  if (sc.phase === 'D') night(t, sc.grid.cam);
  if (sc.phase === 'B') {
    if (on(t, TL.hit) && hf === 0) { g.fillStyle = '#FFF6E8'; g.fillRect(0, 0, W, GB + G); }                  // the hit: gutters white...
    for (let i = 0; i < NCELL; i++) { const L = LIVES[i]; if (on(t, TL.start[L.id])) continue;      // slots waiting for their pop: a dim tint of the lane colour
      const c = CELL[i], a = 0.24 * clamp01((fr(t, TL.grid) + 1) / 6); g.fillStyle = hexA(L.color, a); g.fillRect(c.x, c.y, c.w, c.h); g.strokeStyle = hexA(L.color, 2 * a); g.lineWidth = 2 * S; g.strokeRect(c.x + S, c.y + S, c.w - 2 * S, c.h - 2 * S); }
    for (const P of sc.plates) if (P.cell && on(t, TL.hit) && hf === 1) { const r = P.rect; g.fillStyle = P.cell.L.color; g.fillRect(r.x - G, r.y - G, r.w + 2 * G, r.h + 2 * G); }   // ...then lane colour
  }
  for (const P of sc.plates) {
    if (P.iris && !P.iris.done) { g.save(); g.beginPath(); g.arc(P.iris.node.x, P.iris.node.y, P.iris.r, 0, 6.2832); g.clip(); drawPlate(P); g.restore(); }
    else if (P.cell) { g.save(); g.beginPath(); g.rect(P.rect.x, P.rect.y, P.rect.w, P.rect.h); g.clip(); drawPlate(P); g.restore(); }
    else if (P.ghost) { g.save(); g.beginPath(); g.rect(P.rect.x, P.rect.y, P.rect.w, P.rect.h); g.clip(); drawPlate(P);   // take two: bar 38 afterimage, tinted
      g.globalAlpha = P.alpha; g.fillStyle = hexA(P.ghost, 0.22); g.fillRect(P.rect.x, P.rect.y, P.rect.w, P.rect.h); g.strokeStyle = hexA(P.ghost, 0.8); g.lineWidth = 2 * S; g.strokeRect(P.rect.x + S, P.rect.y + S, P.rect.w - 2 * S, P.rect.h - 2 * S); g.restore(); }
    else drawPlate(P);
  }
  // ---- finish: grain over the plates, vignette
  grain(t); vignette();
  // ---- lines
  if (sc.phase === 'A') linesA(t, sc.shot);
  else if (sc.phase === 'B') linesCells(t, sc);
  else if (sc.phase === 'D') {
    if (sc.iris && sc.iris.done) linesRoot(t, sc);
    else { if (sc.iris) { g.beginPath(); g.arc(sc.iris.node.x, sc.iris.node.y, sc.iris.r, 0, 6.2832); g.lineWidth = 6 * S; g.strokeStyle = hexA(MAIN, 1 - sc.iris.u); g.stroke(); }
      linesCells(t, sc); linesMerge(t, sc); }
  }
  else if (sc.phase === 'E') linesHero(t);
  // ---- flashes
  if (sc.phase === 'E') { const f = fr(t, TL.t41); if (f <= 1) { g.fillStyle = `rgba(255,248,236,${f === 0 ? 0.85 : 0.4})`; g.fillRect(0, 0, W, H); } }
  // ---- type
  if (sc.phase === 'A') chyron(t, sc.shot);
  if (sc.phase === 'B' && fr(t, TL.grid) < 4) chyron(t, TL.shots[9], 1 - (fr(t, TL.grid) + 1) / 4);
  if (sc.grid) cellLabels(t, sc);
  lyricUL(t, TL.L4, sc.shot || TL.shots[9]); lyricStrip(t); slab(t);
}

let LOCK = Promise.resolve();
function render(t) { const p = LOCK.then(() => render1(t)); LOCK = p.catch(() => {}); return p; }     // one frame at a time
async function render1(t) {
  const sc = scene(t); READY.clear();
  const need = []; for (const P of sc.plates) { const { i0, i1 } = frameIdx(P.id, P.c); need.push([P.id, i0], [P.id, i1]); }
  await Promise.all(need.map(async ([id, i]) => READY.set(url(id, i), await bitmap(id, i))));
  draw(t, sc); return sc;
}

// ---------------------------------------------------------------- init (from the proof's boot(), minus fonts, page and harness)
for (const [face, wt] of [['mono', 600], ['mono', 500], ['serif'], ['slab']]) { setFont(face === 'mono' ? FACE.mono(100, wt) : FACE[face](100)); CAP[face + (wt || '')] = g.measureText('H').actualBoundingBoxAscent / 100; }
T = o.T;
for (const id of PLATE_IDS) { const r = await fetch(`${pdir(id)}/meta.json`); if (!r.ok) throw new Error(`plate ${id}: no meta.json in ${pdir(id)}`); META[id] = await r.json(); const b = await bitmap(id, 0); DIM[id] = { w: b.width, h: b.height }; }
buildTimeline(); TL.c0.sandstorm = clipA(TL.shots[9], TL.grid);
{ const c = cam(TL.t39); XROOT = ZAX + (NX - ZAX) / c.s; }
buildGrain(); SLAB = slabLayout();
const sizes = {};
const meas = (k, f) => { setFont(f); sizes[k] = { font: f.font, capPx: +g.measureText('H').actualBoundingBoxAscent.toFixed(1) }; };
meas('proof_chyron_branch', FACE.mono(pxFor('mono', SZ.chyron * S, 600), 600)); meas('proof_chyron_commit', FACE.mono(pxFor('mono', SZ.commit * S, 500), 500));
meas('proof_cell_label', FACE.mono(SZ.cellLabelPx * S, 600));
meas('proof_lyric_upperleft', FACE.serif(pxFor('serif', SZ.lyricUL * S))); meas('proof_lyric_strip', FACE.serif(pxFor('serif', SZ.lyricStrip * S))); meas('proof_slab', SLAB.f);
return { render, t0: TL.t0, tEnd: TL.tEnd, TL, sizes, meta: META };
}
