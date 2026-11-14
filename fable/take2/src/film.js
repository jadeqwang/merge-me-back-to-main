// MERGE take two: the whole-film compositor. render(t) is a pure function of song time t (seconds in the new audio), driven by the
// shot list (fable/take2/shots.js) resolved against analysis_v3/timing.json. See fable/take2/notes/compositor.md.
//   page: /fable/take2/index.html?timing=/analysis_v3/timing.json&w=1920&h=1080&fps=30
//   query flags: hud=0 (no bar/beat/section/shot overlay), v7=0 (v7 shots as cards), paper=0 (v7 raw even if paper.js exists),
//     proofbug=1 (the proof range exactly as the proof renders it, without the strip-lyric fix), plates=/a,/b (plate folders, first
//     wins), v7dir=/work_fable/take2/v7/full, cards=1 (every non-proof shot as a card), mode=lanetest (written-lane test 7),
//     hero=old (bars 41-42: the proof's first hero plate instead of hero_paper), prooflanes=0 (bars 28-32: the proof's solid lane
//     line instead of the written lane), trail=0 (bar 38 without the panel afterimages), lanes=0 (no written lanes on plates)
//     proofbug=1 also switches every take-two change inside bars 28-43 off (the proof exactly as it renders on its own)
// Layers: source (proof | plate | v7 [paper pass] | card) -> grain + vignette -> overlays (chip, counter, title) -> lyrics -> HUD.
// Source kinds: see shots.js. A missing plate, or a v7 time outside the delivered sequence, draws as a labelled card.
import { loadTiming, clamp01, lerp, seg, ease } from './timing.js';
import { resolveShots, SECTIONS, FLOAT } from '../shots.js';
import { LIVES, MAIN, byId, hashOf } from '../../proof/lives.js';
import { drawWrittenLane, laneString, measureMono } from './lanes.js';
import { makeKit } from './kit.js';
import { scriptPaths, drawScript, penAt } from './script.js';
import { makeProof } from './proofscene.js';

const Q = new URLSearchParams(location.search);
const W = +(Q.get('w') || 1920), H = +(Q.get('h') || 1080), FPS = +(Q.get('fps') || 30);
const S = H / 1080, HF = 0.5 / FPS;
const TIMING = Q.get('timing') || '/analysis_v3/timing.json';
const PLATE_DIRS = (Q.get('plates') || '/work_fable/take2/plates,/work_fable/proof/plates').split(',');
const PROOF_PLATES = '/work_fable/proof/plates';
const V7DIR = Q.get('v7dir') || '/work_fable/take2/v7/full';
const HUD = Q.get('hud') !== '0', USE_V7 = Q.get('v7') !== '0', USE_PAPER = Q.get('paper') !== '0', ALLCARDS = Q.get('cards') === '1', LANES = Q.get('lanes') !== '0';
const PROOFBUG = Q.get('proofbug') === '1';
const canvas = document.getElementById('c'); canvas.width = W; canvas.height = H;
const g = canvas.getContext('2d', { willReadFrequently: true, alpha: false });
window.FILM = { ready: false, error: null };

const BG = '#05061A', CREAM = '#FFF1D6', INK = '#14122B';
const INKS = [...new Set([MAIN, ...LIVES.map((l) => l.color)])];   // paper pass: lane hues kept from the v7 source
const fr = (t, e) => Math.round((t - e) * FPS);
const on = (t, e) => t >= e - HF;
const hexA = (h, a) => { const n = parseInt(h.slice(1), 16); return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`; };
const mix = (h1, h2, u) => { const a = parseInt(h1.slice(1), 16), b = parseInt(h2.slice(1), 16); const c = [16, 8, 0].map((s) => Math.round(lerp((a >> s) & 255, (b >> s) & 255, u))); return `rgb(${c[0]},${c[1]},${c[2]})`; };
const softcap = (c, L, m = 0.3) => (c <= L - m ? c : L - m * Math.exp(-(c - (L - m)) / m));

// ---------------------------------------------------------------- fonts and type
const FONTS = [
  ['Archivo', '/engine/fonts/Archivo[wdth,wght].ttf', { weight: '100 900', stretch: '62% 125%' }],
  ['Instrument Serif', '/engine/fonts/InstrumentSerif-Italic.ttf', { style: 'italic' }],
  ['JetBrains Mono', '/engine/fonts/JetBrainsMono[wght].ttf', { weight: '100 800' }],
];
const FACE = {
  mono: (px, wt = 600) => ({ font: `${wt} ${px}px "JetBrains Mono"`, stretch: 'normal' }),
  serif: (px) => ({ font: `italic 400 ${px}px "Instrument Serif"`, stretch: 'normal' }),
  slab: (px) => ({ font: `800 ${px}px Archivo`, stretch: 'expanded' }),
  sans: (px, wt = 500) => ({ font: `${wt} ${px}px Archivo`, stretch: 'normal' }),
};
function setFont(f) { g.font = f.font; g.fontStretch = f.stretch; g.textBaseline = 'alphabetic'; g.textAlign = 'left'; }
const CAP = {};
const capFont = (face, cap, wt) => FACE[face](cap / CAP[face + (wt || '')], wt);
// sizes at 1080p: cap heights in px for lyrics, slab, title, counter; font px for the mono labels
const SZ = { verse: 66, slab: 104, title: 190, counter: 44, cardPic: 50, cardMeta: 30, cardId: 44, chip: 30, hud: 24 };
function textShadow(a = 0.75, blur = 10, col = '5,6,26') { g.shadowColor = `rgba(${col},${a})`; g.shadowBlur = blur * S; g.shadowOffsetX = 0; g.shadowOffsetY = 2 * S; }
function noShadow() { g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetY = 0; }

// ---------------------------------------------------------------- images (LRU of decoded bitmaps; frames are fetched from the harness's server)
const CACHE = new Map(), CMAX = 120;
function bitmap(u) {
  let p = CACHE.get(u);
  if (p) { CACHE.delete(u); CACHE.set(u, p); return p; }
  p = fetch(u).then((r) => { if (!r.ok) throw new Error('missing image ' + u); return r.blob(); }).then((b) => createImageBitmap(b));
  CACHE.set(u, p); while (CACHE.size > CMAX) { const [k0, p0] = CACHE.entries().next().value; CACHE.delete(k0); p0.then((b) => b.close && b.close()).catch(() => {}); }
  return p;
}
const READY = new Map();
async function exists(u) { try { const r = await fetch(u, { method: 'HEAD' }); return r.ok; } catch { return false; } }
async function json(u) { try { const r = await fetch(u); return r.ok ? await r.json() : null; } catch { return null; } }

// plates: { dir, meta, w, h }
const PLATE = {};
async function findPlate(id) {
  if (id in PLATE) return PLATE[id];
  PLATE[id] = null;
  // complete = meta.json (not a placeholder) and its last frame, or the intake's REAL marker (intake writes frames, meta, REAL in that order)
  for (const d of PLATE_DIRS) { const m = await json(`${d}/${id}/meta.json`); if (!m || m.placeholder) continue;
    if (m.still) {   // still-only plate (meta {"still": true} + still.jpg): drawn from still.jpg with a push (rule 10: moves from frame 1)
      if (!(await exists(`${d}/${id}/still.jpg`))) continue; const b = await bitmap(`${d}/${id}/still.jpg`);
      PLATE[id] = { id, dir: `${d}/${id}`, meta: { ...m, n: 1, fps: 24 }, still: true, stillOnly: true, w: b.width, h: b.height }; break; }
    if (!m.n) continue;
    if (!(await exists(`${d}/${id}/REAL`)) && !(await exists(`${d}/${id}/frames/f_${String(m.n).padStart(4, '0')}.jpg`))) continue;
    const p = { id, dir: `${d}/${id}`, meta: m, still: await exists(`${d}/${id}/still.jpg`) };
    const b = await bitmap(`${p.dir}/frames/f_0001.jpg`); p.w = b.width; p.h = b.height; PLATE[id] = p; break; }
  return PLATE[id];
}
// runner kit (shots.js kind 'kit', src/kit.js): KITX = makeKit(...) at boot when fable/take2/kit.json loads
let KITX = null;
const plateUrl = (p, i) => `${p.dir}/frames/f_${String(i + 1).padStart(4, '0')}.jpg`;
function cover(iw, ih, w, h, zoom = 1, fx = 0.5, fy = 0.5) {
  const da = w / h, pa = iw / ih; let sw, sh;
  if (da > pa) { sw = iw; sh = iw / da; } else { sh = ih; sw = ih * da; }
  sw /= zoom; sh /= zoom; return { sx: (iw - sw) * fx, sy: (ih - sh) * fy, sw, sh };
}

// v7: the old code-drawn film re-timed to the new audio, an image sequence; file f_%05d.jpg is new song time index/fps
// per-shot folders (shots.js opt.v7dir, e.g. the orchestra) load their own meta.json into V7S; the global one is V7
let V7 = null; const V7S = {};
const v7Of = (s) => (s && s.opt && s.opt.v7dir ? V7S[s.opt.v7dir] : V7);
function v7Index(t, s) { const V = v7Of(s); if (!V) return -1; const k = Math.round(t * V.fps); return k >= V.first && k < V.first + V.n ? k : -1; }
const v7Url = (k, s) => `${s && s.opt && s.opt.v7dir && V7S[s.opt.v7dir] ? s.opt.v7dir : V7DIR}/f_${String(k).padStart(5, '0')}.jpg`;
async function loadV7(dir) { const vm = await json(`${dir}/meta.json`); if (!vm || !vm.n) return null;
  const V = { fps: vm.fps || 30, n: vm.n, t0: vm.t0 || 0, first: vm.first !== undefined ? vm.first : Math.round((vm.t0 || 0) * (vm.fps || 30)), w: vm.w, h: vm.h };
  return (await exists(`${dir}/f_${String(V.first).padStart(5, '0')}.jpg`)) ? V : null; }
// paper looks per shot (opt.paperLook): 'orch' = the orchestra's look, chosen by ?orchpaper= (default 'solid'):
//   solid: white jackets as solid light shapes, two hatch layers for mid tones, the pale-blue disc kept as an ink (low inkSat)
//   light: the raw render with the paper's contour drawn over it (no hatching), then the film's grain
const ORCH_BLUE = '#9FC3EA';
const ORCHPAPER = Q.get('orchpaper') || 'solid';
const PAPER_LOOKS = { orch: { solid: { levels: [0.2, 0.62], gamma: 1, solid: 0.6, layers: 2, hatch: 12, thresholds: [0.2, 0.45, 0.7], inkSat: 0.12, extraInk: [ORCH_BLUE] }, light: { light: true } } };

// effect modules written by another agent: guarded, the film renders without them
let paperPass = null, glyphPass = null;

// ---------------------------------------------------------------- timeline
let T, SH, PROOF, LYR;
function shotAt(t) { let lo = 0, hi = SH.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (on(t, SH[m].t0)) lo = m; else hi = m - 1; } return SH[lo]; }
// bar and beat at t (from the measured beat list)
function barBeat(t) { const b = T.beats; let i = 0; while (i + 1 < b.length && b[i + 1] <= t + 1e-9) i++; const f = t < b[0] ? 0 : clamp01((t - b[i]) / ((b[i + 1] || b[i] + 0.43) - b[i])); return { bar: Math.floor(i / 4) + 1, beat: (i % 4) + 1, frac: f, i }; }
// the doubling counter: 1 in bars 1-2, doubles every bar from bar 3 (2) to bar 12 (1,024), then holds
const counterAt = (bar) => (bar < 3 ? 1 : Math.min(1024, 2 ** (bar - 2)));

// effective source of a shot (decided once at boot, except v7 coverage which is per frame)
function effKind(s) {
  if (s.kind === 'proof') return 'proof';
  if (ALLCARDS) return 'card';
  if (s.kind === 'plate') return PLATE[s.src] ? 'plate' : 'card';
  if (s.kind === 'v7') return USE_V7 && v7Of(s) ? 'v7' : 'card';
  if (s.kind === 'kit') return KITX && !s.opt.kit.off && KITX.ok(s) ? 'kit' : 'card';
  if (s.kind === 'code') return s.opt.code === 'tiles' ? (s.opt.lives.some((id) => PLATE['det_' + id]) ? 'code' : 'card') : 'code';
  return 'card';
}

// ---------------------------------------------------------------- lyrics (every sung line, word by word on the word times)
const CHORUS_IDS = new Set([7, 8, 9, 10, 20, 21, 22, 23, 24, 25]);
function buildLyrics() {
  const L = T.raw.lyrics.lines.map((l) => ({ id: l.id, text: l.text, slab: CHORUS_IDS.has(+l.id),
    words: l.words.map((w) => ({ w: w.w.replace(/[^A-Za-z0-9'’]/g, ''), start: w.start, end: w.end })).filter((w) => w.w) }));
  L.sort((a, b) => a.words[0].start - b.words[0].start);
  L.forEach((l, i) => { const last = l.words[l.words.length - 1], next = L[i + 1];
    l.t0 = l.words[0].start; l.out = Math.max(last.start + 0.8, Math.min(last.end + 0.5, next ? next.words[0].start - 0.1 : 1e9)); });   // out: opaque at least 0.6 s, then a 0.2 s fade
  return L;
}
// a line belongs to the proof if it starts inside the proof range (the proof draws it there; the film draws it after bar 43)
const proofOwns = (t) => PROOF && t >= PROOF.t0 - HF && t < PROOF.tEnd - HF;
const LAYOUT = new Map();
// rows of words that fit maxW; returns [{x,y,w,txt,wi}] for placement 'strip' (cards) or 'low' (full-frame sources)
// lyr (shot opt): {x0, x1, y: 'bottom'|'top', align: 'left'|'center'|'right'} region in frame fractions (full-frame sources only)
// with a region, only the words sung before the shot ends (tEnd) are laid out, so a line that runs on into the next shot does not
// reserve rows for words this shot never shows
function layoutLine(l, place, lyr, tEnd) {
  const key = l.id + ':' + place + ':' + (lyr ? JSON.stringify(lyr) + tEnd : ''); if (LAYOUT.has(key)) return LAYOUT.get(key);
  const f = l.slab ? capFont('slab', SZ.slab * S) : capFont('serif', SZ.verse * S); setFont(f);
  if (l.slab) g.letterSpacing = `${-0.01 * parseFloat(f.font.split(' ')[1])}px`;
  const R = lyr && place !== 'strip' ? { x0: (lyr.x0 === undefined ? 0 : lyr.x0) * W, x1: (lyr.x1 === undefined ? 1 : lyr.x1) * W, y: lyr.y || 'bottom', align: lyr.align || 'center' } : null;
  const cap = (l.slab ? SZ.slab : SZ.verse) * S, lead = cap * (l.slab ? 1.3 : 1.5), maxW = R ? Math.min(R.x1 - R.x0, W - 200 * S) : W - 200 * S;
  const txt = (w) => (l.slab ? w.w.toUpperCase() : w.w), sp = g.measureText(' ').width * (l.slab ? 0.8 : 1);
  const rows = [[]]; let x = 0;
  l.words.forEach((w, wi) => { if (R && tEnd !== undefined && !(w.start < tEnd - HF)) return; if (R && lyr.tail && wi < l.words.length - lyr.tail) return; /* every word sung inside the shot, on its word time; tail: only the last N words (a held note) */ const ww = g.measureText(txt(w)).width; if (x > 0 && x + sp + ww > maxW) { rows.push([]); x = 0; } if (x > 0) x += sp; rows[rows.length - 1].push({ wi, txt: txt(w), x, w: ww }); x += ww; });
  g.letterSpacing = '0px';
  const top = CARD_H, n = rows.length; let y0;
  if (place === 'strip') y0 = top + (H - top) / 2 - ((n - 1) * lead) / 2 + cap / 2;          // centred in the strip under the card
  else if (R && R.y === 'top') y0 = (lyr.top !== undefined ? lyr.top * H : 70 * S) + cap;                                                // a shot's region: top
  else y0 = H - (l.slab ? 96 : 84) * S - (n - 1) * lead;                                      // full-frame: bottom, rising with rows
  const out = []; rows.forEach((r, ri) => { const rw = r.length ? r[r.length - 1].x + r[r.length - 1].w : 0;
    const x0 = R ? (R.align === 'left' ? R.x0 : R.align === 'right' ? R.x1 - rw : (R.x0 + R.x1 - rw) / 2) : l.slab && place !== 'strip' ? 100 * S : (W - rw) / 2;
    for (const q of r) out.push({ ...q, x: x0 + q.x, y: y0 + ri * lead }); });
  const bx0 = Math.min(...out.map((q) => q.x)), bx1 = Math.max(...out.map((q) => q.x + q.w));
  const res = { f, words: out, slab: l.slab, top: y0 - cap - 30 * S, region: R, box: { x: bx0, y: y0 - cap, w: bx1 - bx0, h: (n - 1) * lead + cap * 1.3 } }; LAYOUT.set(key, res); return res;
}
function lyrics(t, eff, s) {
  if (proofOwns(t)) return;
  for (const l of LYR) {
    if (!on(t, l.t0) || t > l.out) continue;
    const la = 1 - clamp01((t - l.out + 0.2) / 0.2), place = eff === 'card' ? 'strip' : 'low', Lx = layoutLine(l, place, s && s.opt && s.opt.lyr, s && s.t1);
    if (place === 'low' && Lx.region) { const B = Lx.box, p = 50 * S; g.save(); g.filter = `blur(${Math.round(36 * S)}px)`; g.fillStyle = `rgba(5,6,26,${0.42 * la})`; g.fillRect(B.x - p, B.y - p, B.w + 2 * p, B.h + 2 * p); g.restore(); }   // a soft dark cloud behind the words only
    else if (place === 'low') { const gr = g.createLinearGradient(0, Lx.top - 60 * S, 0, H); gr.addColorStop(0, 'rgba(5,6,26,0)'); gr.addColorStop(1, `rgba(5,6,26,${0.5 * la})`); g.fillStyle = gr; g.fillRect(0, Lx.top - 60 * S, W, H - Lx.top + 60 * S); }
    setFont(Lx.f); if (Lx.slab) g.letterSpacing = `${-0.01 * parseFloat(Lx.f.font.split(' ')[1])}px`;
    for (const q of Lx.words) { const w = l.words[q.wi]; if (!on(t, w.start)) continue;
      const ff = fr(t, w.start), a = clamp01((ff + 1) / 3) * la; if (a <= 0) continue;
      g.save(); g.globalAlpha = a;
      if (Lx.slab) { const u = ease.out(clamp01((ff + 1) / 5)), s = lerp(1.08, 1, u); g.translate(q.x, q.y); g.scale(s, s); textShadow(0.6, 12); g.fillStyle = CREAM; g.fillText(q.txt, 0, 0); }
      else { const rise = (1 - clamp01((ff + 1) / 4)) * 8 * S; textShadow(0.75, 10); g.fillStyle = CREAM; g.fillText(q.txt, q.x, q.y + rise); }
      noShadow(); g.restore(); }
    g.letterSpacing = '0px';
  }
}

// ---------------------------------------------------------------- grain and vignette (as the proof)
const GRAIN = []; const GT = 512;
function mulberry32(a) { return () => { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function buildGrain() {
  for (let k = 0; k < 6; k++) {
    const rnd = mulberry32(1000 + k * 7919); const c = document.createElement('canvas'); c.width = c.height = GT; const x = c.getContext('2d'); const im = x.createImageData(GT, GT);
    const coarse = new Float32Array((GT / 4) * (GT / 4)); for (let i = 0; i < coarse.length; i++) coarse[i] = rnd();
    for (let y = 0; y < GT; y++) for (let xx = 0; xx < GT; xx++) {
      const fine = rnd(), cc = coarse[(y >> 2) * (GT / 4) + (xx >> 2)], fib = rnd() < 0.004 ? 0.5 : 0;
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

// ---------------------------------------------------------------- sources
// plate: clip time from the shot start; nearest frame unless the clip is slowed (then a frame blend), twos = 12 fps, still = still.jpg
// clip map of a shot: { c0, sp } with clip time = c0 + (t - t0) * sp (see shots.js opt: clip0/clip1/speed, cross)
function clipMap(s) {
  const o = s.opt || {}, D = s.t1 - s.t0;
  if (o.cross) { const x = o.cross, ta = x.at * D, sp = Math.max(1, Math.min(x.maxSpeed || 1.5, x.reach / ta)); return { c0: Math.max(0, x.reach - sp * ta), sp }; }
  if (o.clip1 !== undefined) return { c0: o.clip0 || 0, sp: (o.clip1 - (o.clip0 || 0)) / D };
  return { c0: o.clip0 || 0, sp: o.speed || 1 };
}
function plateDraw(s, t, id, out) {
  const p = PLATE[id], m = p.meta, o = s.opt || {}, last = (m.n - 1) / m.fps, cm = clipMap(s), blend = o.blend !== undefined ? o.blend : cm.sp < 0.999;
  let c = softcap(Math.max(0, cm.c0 + (t - s.t0) * cm.sp), last);
  if (o.twos) c = Math.floor(c * 12 + 1e-6) / 12;
  const f = c * m.fps, i0 = Math.min(m.n - 1, blend ? Math.floor(f) : Math.round(f)), i1 = Math.min(m.n - 1, i0 + 1), fb = blend ? f - i0 : 0;
  const u = seg(t, s.t0, s.t1), zoom = (o.zoom0 || 1) + (o.push === undefined ? 0.03 : o.push) * ease.io(u);
  let fo = o.fx !== undefined ? [o.fx, o.fy] : [0.5, 0.45], zz = zoom;
  if (o.crop) { const C = CROPS[o.crop] || CROPS.b, j = (s.i || 0) % C.f.length; zz = zoom * C.z; fo = C.f[j]; }   // b70-71: new crops of the details
  if (p.stillOnly || (o.still && p.still)) out.push({ url: `${p.dir}/still.jpg`, zoom: zz, fo });
  else { out.push({ url: plateUrl(p, i0), zoom: zz, fo }); if (fb > 0.02) out.push({ url: plateUrl(p, i1), zoom: zz, fo, alpha: fb }); }
}
// new crops for the second pass of the details: zoom and a focus that changes shot to shot
const CROPS = { b: { z: 1.55, f: [[0.3, 0.35], [0.7, 0.6], [0.55, 0.3], [0.35, 0.65]] }, c: { z: 2.1, f: [[0.6, 0.45], [0.4, 0.5], [0.5, 0.6], [0.45, 0.35]] } };
function scene(t) {
  const s = shotAt(t); const sc = { t, s, eff: effKind(s), imgs: [] };
  if (sc.eff === 'v7') { const k = v7Index(t, s); if (k < 0) sc.eff = 'card'; else sc.imgs.push({ url: v7Url(k, s), v7: true }); }
  if (sc.eff === 'plate') plateDraw(s, t, s.src, sc.imgs);
  if (sc.eff === 'kit') for (const u of KITX.need(s, t)) sc.imgs.push({ url: u });
  if (sc.eff === 'code' && s.opt.code === 'tiles') for (const id of s.opt.lives) if (PLATE['det_' + id]) sc.imgs.push({ url: `${PLATE['det_' + id].dir}/still.jpg`, life: id });
  if (sc.eff === 'plate' && s.opt && s.opt.strands && s.opt.strands.window && PLATE[s.opt.strands.window]) {   // the life window (b61-62)
    sc.win = []; plateDraw({ t0: s.t0, t1: s.t1, opt: { clip0: 1.0, push: 0 } }, t, s.opt.strands.window, sc.win); }
  if (sc.eff === 'plate' && s.opt && s.opt.settle && sc.imgs[0]) { const m = sc.imgs[0].url.match(/f_(\d{4})\.jpg$/); if (m && SETTLE_OK[s.opt.settle.matte]) sc.settle = `${s.opt.settle.matte}/rgba/f_${m[1]}.png`; }
  if (sc.eff === 'plate' && s.opt && s.opt.fan && sc.imgs[0]) { const m = sc.imgs[0].url.match(/f_(\d{4})\.jpg$/); if (m) sc.fan = `${s.opt.fan.matte}/rgba/f_${m[1]}.png`; }
  const x = s.opt && s.opt.cross;   // the crossing: from `at` the doorway grows into the life plate
  if (sc.eff === 'plate' && x && PLATE[x.life] && !ALLCARDS) { const D = s.t1 - s.t0, ta = s.t0 + x.at * D, te = s.t0 + x.end * D;
    if (on(t, ta)) { sc.cross = { u: t >= te - HF ? 1 : seg(t, ta - HF, te - HF), life: [], door: x.door, col: (byId[x.life] || {}).color || MAIN };
      plateDraw({ t0: ta, t1: s.t1 + 1, opt: { clip0: x.life0 || 0, push: 0.04 } }, t, x.life, sc.cross.life);
      if (sc.cross.u >= 1) sc.imgs = []; } }
  const fl = s.opt && s.opt.flash;   // a few frames of a life plate at the head of the shot
  if (fl && fr(t, s.t0) < fl.frames && PLATE[fl.id] && !ALLCARDS) { sc.flash = []; plateDraw({ ...s, opt: { clip0: 1.5, push: 0 } }, t, fl.id, sc.flash); }
  return sc;
}

// ---------------------------------------------------------------- cards (missing shots)
const CARD_H = 640 * S;                // card area; the lyric strip is CARD_H..H
const fmtBB = (v) => (v === 'end' ? 'end' : `${v[0]}.${Number.isInteger(v[1]) ? v[1] : v[1].toFixed(1)}`);
const WRAP = new Map();
function wrap(text, f, maxW) { const k = text + f.font + maxW; if (WRAP.has(k)) return WRAP.get(k); setFont(f); const out = [], ws = text.split(' '); let line = '';
  for (const w of ws) { const tr = line ? line + ' ' + w : w; if (line && g.measureText(tr).width > maxW) { out.push(line); line = w; } else line = tr; } if (line) out.push(line); WRAP.set(k, out); return out; }
function card(t, s) {
  const sec = SECTIONS[s.sec], col = sec.color, f = fr(t, s.t0), u = seg(t, s.t0, s.t1);
  const tone = s.i % 2 ? 0.30 : 0.17;                                    // alternate tone, so every new shot is visibly a new card
  g.fillStyle = mix('#0A0912', col, tone); g.fillRect(0, 0, W, CARD_H);
  g.fillStyle = '#07060D'; g.fillRect(0, CARD_H, W, H - CARD_H);
  // paper: soft lane-colour fibres drifting slowly (seeded per shot, moves from the first frame)
  const r = mulberry32(9001 + s.i * 31); g.lineWidth = 1.2 * S;
  for (let k = 0; k < 26; k++) { const x0 = r() * W, y0 = r() * CARD_H, len = (40 + 160 * r()) * S, a = r() * 6.283, dx = (t - s.t0) * (6 + 10 * r()) * S;
    g.strokeStyle = hexA(col, 0.08 + 0.08 * r()); g.beginPath(); g.moveTo(x0 + dx, y0); g.quadraticCurveTo(x0 + dx + len * 0.5 * Math.cos(a + 0.6), y0 + len * 0.5 * Math.sin(a + 0.6), x0 + dx + len * Math.cos(a), y0 + len * Math.sin(a)); g.stroke(); }
  // slide in: the content enters from the right over 5 frames; a lane-colour edge flashes on the cut
  const slide = (1 - ease.out(clamp01((f + 1) / 5))) * 90 * S;
  if (f < 3) { g.fillStyle = hexA(col, f === 0 ? 0.9 : f === 1 ? 0.55 : 0.25); g.fillRect(0, 0, 14 * S, CARD_H); g.fillRect(0, CARD_H - 4 * S, W, 4 * S); }
  g.save(); g.translate(slide, 0);
  const X = 80 * S; let y = 96 * S;
  setFont(FACE.mono(SZ.cardId * S, 700)); g.fillStyle = col; g.fillText(s.id, X, y); const wid = g.measureText(s.id).width;
  setFont(FACE.mono(SZ.cardMeta * S, 500)); g.fillStyle = 'rgba(255,241,214,0.85)';
  g.fillText(`bars ${fmtBB(s.from)}–${fmtBB(s.to)}   ${s.t0.toFixed(2)}–${s.t1.toFixed(2)} s   ${(s.t1 - s.t0).toFixed(2)} s`, X + wid + 30 * S, y);
  y += 58 * S; setFont(FACE.mono(SZ.cardMeta * S, 700)); const tag = `${s.code}  ${s.src}`; g.fillStyle = CREAM; g.fillText(tag, X, y);
  const why = s.kind === 'v7' ? (V7 && USE_V7 ? 'v7 not rendered here' : 'v7 sequence not delivered yet') : s.kind === 'plate' ? 'missing' : 'to draw in code';
  const tw = g.measureText(tag).width; setFont(FACE.mono(SZ.cardMeta * S, 500)); g.fillStyle = hexA(col, 0.95); g.fillText(`(${why})`, X + tw + 24 * S, y);
  y += 30 * S;
  const pf = FACE.sans(SZ.cardPic * S, 500);
  const lines = wrap(s.pic, pf, W - 2 * X - 40 * S); setFont(pf); g.fillStyle = CREAM; const lead = parseFloat(pf.font.split(' ')[1]) * 1.22;
  lines.slice(0, 6).forEach((ln, i) => g.fillText(ln, X, y + lead * (i + 1)));
  const ov = s.ov.filter((o) => !/^(chip|counter|title|flash):?/.test(o)); if (ov.length) { setFont(FACE.mono(26 * S, 500)); g.fillStyle = 'rgba(255,241,214,0.6)'; g.fillText('to do in code: ' + ov.join(' · '), X, CARD_H - 92 * S); }
  g.restore();
  // progress line across the shot and a tick per beat (the current beat pops on its beat time)
  const py = CARD_H - 44 * S, x0 = X, x1 = W - X; g.strokeStyle = hexA(col, 0.35); g.lineWidth = 3 * S; g.beginPath(); g.moveTo(x0, py); g.lineTo(x1, py); g.stroke();
  g.strokeStyle = col; g.lineWidth = 5 * S; g.beginPath(); g.moveTo(x0, py); g.lineTo(lerp(x0, x1, u), py); g.stroke();
  for (const b of T.beats) { if (b < s.t0 - 1e-6 || b >= s.t1 - 1e-6) continue; const bx = lerp(x0, x1, seg(b, s.t0, s.t1)), past = on(t, b), fb = fr(t, b);
    const pop = past && fb < 6 ? 1 - fb / 6 : 0; g.fillStyle = past ? col : hexA(col, 0.4); g.beginPath(); g.arc(bx, py, (6 + 10 * pop) * S, 0, 6.2832); g.fill();
    if (pop > 0) { g.fillStyle = `rgba(255,255,255,${0.8 * pop})`; g.beginPath(); g.arc(bx, py, 5 * S, 0, 6.2832); g.fill(); } }
  g.fillStyle = CREAM; g.beginPath(); g.arc(lerp(x0, x1, u), py, 7 * S, 0, 6.2832); g.fill();
}

// ---------------------------------------------------------------- overlays (machine layer drawn in code)
function chip(text, col) {
  const f = FACE.mono(SZ.chip * S, 600); setFont(f); const tw = g.measureText(text).width, pad = 16 * S, h = 54 * S, x = 60 * S, y = 50 * S;
  g.fillStyle = 'rgba(5,6,26,0.82)'; g.beginPath(); g.roundRect(x, y, tw + 2 * pad, h, 4 * S); g.fill();
  g.fillStyle = col; g.fillText(text, x + pad, y + h / 2 + SZ.chip * 0.36 * S);
}
function overlays(t, sc) {
  const s = sc.s, col = SECTIONS[s.sec].color, card = sc.eff === 'card';
  for (const o of s.ov) {
    if (o.startsWith('chip:') && !card) chip(o.slice(5), col === MAIN ? MAIN : col);
    if (o.startsWith('adlib:') && !card) { const [, w, ts] = o.split(':'), t0 = +ts; if (on(t, t0)) {   // a wordless adlib on its time: verse serif, cream
      const f = capFont('serif', SZ.verse * S); setFont(f); const tw = g.measureText(w).width, at = (s.opt && s.opt.adlibAt) || [0.5, 0.86], a = clamp01((fr(t, t0) + 1) / 3);
      g.save(); g.globalAlpha = a; textShadow(0.8, 14); g.fillStyle = CREAM; g.fillText(w, at[0] * W - tw / 2, at[1] * H); noShadow(); g.restore(); } }
    if (o === 'counter') {
      const { bar } = barBeat(t), v = counterAt(bar), cf = capFont('mono', SZ.counter * S, 600), b0 = T.bar(bar), pop = on(t, b0) && fr(t, b0) < 6 ? 1 - fr(t, b0) / 6 : 0;
      setFont(cf); const txt = v.toLocaleString('en-US'); const tw = g.measureText(txt).width, left = s.opt && s.opt.counterSide === 'left', x = left ? 80 * S : W - 80 * S - tw, y = (card ? CARD_H - 90 * S : 130 * S);
      g.save(); g.translate(x + tw, y); g.scale(1 + 0.12 * pop, 1 + 0.12 * pop); textShadow(0.7, 10); g.fillStyle = pop > 0.5 ? '#FFFFFF' : CREAM; g.fillText(txt, -tw, 0); noShadow(); g.restore();
      setFont(FACE.mono(24 * S, 500)); g.fillStyle = hexA(MAIN, 0.95); const lb = v === 1 ? 'branch' : 'branches'; g.fillText(lb, left ? 80 * S : W - 80 * S - g.measureText(lb).width, y + 36 * S);
    }
    if (o.startsWith('title:')) {
      const txt = o.slice(6), f = fr(t, s.t0), a = clamp01((f + 1) / 4), cf = capFont('slab', SZ.title * S); setFont(cf); g.letterSpacing = `${0.04 * parseFloat(cf.font.split(' ')[1])}px`;
      const tw = g.measureText(txt).width, sc2 = lerp(1.06, 1, ease.out(clamp01((f + 1) / 8))), y = card ? CARD_H * 0.62 : H * 0.5 + SZ.title * S / 2;
      g.save(); g.globalAlpha = a; g.translate(W / 2, y); g.scale(sc2, sc2); textShadow(0.6, 24); g.fillStyle = CREAM; g.fillText(txt, -tw / 2, 0); noShadow(); g.restore(); g.letterSpacing = '0px';
    }
  }
}
// debug: bar.beat, section and shot, small in the bottom-right corner (hud=0 switches it off)
function hud(t, sc) {
  const { bar, beat } = barBeat(t), s = sc.s, f = FACE.mono(SZ.hud * S, 600); setFont(f);
  const txt = `${String(bar).padStart(3, ' ')}.${beat}  ${SECTIONS[s.sec].name}  ${s.id} ${sc.eff}  ${t.toFixed(2)}s`;
  const tw = g.measureText(txt).width, x = W - tw - 26 * S, y = H - 22 * S;
  g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillRect(x - 10 * S, y - 26 * S, tw + 20 * S, 34 * S); g.fillStyle = '#9EF0B0'; g.fillText(txt, x, y);
}

// ---------------------------------------------------------------- crossing wipe and written lanes (Step 2)
let CROPC = null, LIGHTC = null;
// plate fraction (px, py) -> screen, through the first image's cover crop (zoom and focus): overlays stay on the drawn plate
function plateToScreen(im, px, py) { const b = READY.get(im.url), cr = cover(b.width, b.height, W, H, im.zoom || 1, (im.fo || [0.5, 0.5])[0], (im.fo || [0.5, 0.5])[1]);
  return { x: ((px * b.width - cr.sx) / cr.sw) * W, y: ((py * b.height - cr.sy) / cr.sh) * H }; }
function crossing(sc) {
  const c = sc.cross; if (c.u >= 1) { drawImgs(c.life); return; }
  const a = plateToScreen(sc.imgs[0], c.door[0], c.door[1]), b = plateToScreen(sc.imgs[0], c.door[2], c.door[3]);
  const e = ease.io3(c.u), m = 6 * S;   // grows past the frame edge by m, so no edge pixel of the old picture survives the last wipe frame
  const r = { x: lerp(a.x, -m, e), y: lerp(a.y, -m, e), w: lerp(b.x - a.x, W + 2 * m, e), h: lerp(b.y - a.y, H + 2 * m, e) };
  g.save(); g.beginPath(); g.rect(r.x, r.y, r.w, r.h); g.clip();
  for (const im of c.life) { const bb = READY.get(im.url), cr = cover(bb.width, bb.height, r.w, r.h, im.zoom || 1, 0.5, 0.5);
    g.globalAlpha = im.alpha === undefined ? 1 : im.alpha; g.imageSmoothingQuality = 'high'; g.drawImage(bb, cr.sx, cr.sy, cr.sw, cr.sh, r.x, r.y, r.w, r.h); }
  g.restore();
  // the doorway's light edge, in the life's lane colour, fading as it opens
  const ea = 1 - clamp01(e * 1.3); if (ea > 0.01) { g.save(); g.globalAlpha = ea; g.shadowColor = c.col; g.shadowBlur = 24 * S; g.strokeStyle = c.col; g.lineWidth = 5 * S; g.strokeRect(r.x, r.y, r.w, r.h);
    g.shadowBlur = 0; g.strokeStyle = '#FFF6E8'; g.lineWidth = 1.5 * S; g.strokeRect(r.x, r.y, r.w, r.h); g.restore(); }
}
const MAIN_LANE = laneString(['merge me back to main', ...LIVES.map((l) => l.msg)], true);
const laneText = (k) => (k === 'main' ? MAIN_LANE : laneString([byId[k].msg], true));
function lane(t, sc) {
  const L = sc.s.opt.lane, im = sc.imgs[0]; if (!im) return;
  const pts = L.pts.map(([x, y]) => plateToScreen(im, x, y));
  let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  // grow [a, b]: the lane is written out over that part of the shot, from its first point, or from its last with growEnd (paths run
  // left to right so the type is upright; a lane leaving her hand on the right is written from its end)
  // track [[clip s, x], ...]: the lane is written from x (where the light is, measured on the clip) to its last point
  const u = seg(t, sc.s.t0, sc.s.t1), p = L.grow ? ease.out(seg(u, L.grow[0], L.grow[1])) : 1;
  let upto = L.grow && !L.growEnd ? len * p : undefined, from = L.grow && L.growEnd ? len * (1 - p) : 0;
  if (L.track) { const cm = clipMap(sc.s), c = cm.c0 + (t - sc.s.t0) * cm.sp, k = L.track; let x = k[k.length - 1][1];
    for (let i = 1; i < k.length; i++) if (c < k[i][0]) { x = lerp(k[i - 1][1], k[i][1], clamp01((c - k[i - 1][0]) / (k[i][0] - k[i - 1][0]))); break; }
    const X = plateToScreen(im, x, 0).x; let acc = 0; from = len;
    for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i], l = Math.hypot(b.x - a.x, b.y - a.y); if (b.x >= X) { from = acc + l * clamp01((X - a.x) / ((b.x - a.x) || 1)); break; } acc += l; } }
  drawWrittenLane(g, pts, { text: laneText(L.text), color: L.color || MAIN, cap: (L.cap || 22) * S, scroll: (L.scroll || 0) * (t - sc.s.t0), merge: L.merge || 0, under: L.under === undefined ? 0.35 : L.under, upto, from });
}

// b51-52: the fan of twelve afterimages (shots.js opt.fan): copies of her own cut-out (matte of the plate, same frame), each tinted in a
// life's lane colour, rotated about a pivot low on her body; the fan opens over the first beat, then one folds into her every half beat
// from beat 1.5 (twelve folds by beat 7), each with a short flash of its colour on her outline. She is redrawn on top: her face stays clear.
let FANC = null;
function fan(t, sc) {
  const s = sc.s, F = s.opt.fan, im = sc.imgs[0], m = READY.get(sc.fan); if (!KITX) return;
  if (!FANC) { FANC = document.createElement('canvas'); FANC.width = W; FANC.height = H; }
  const fc = FANC.getContext('2d'), cr = cover(m.width, m.height, W, H, im.zoom || 1, im.fo[0], im.fo[1]);
  const piv = plateToScreen(im, F.pivot[0], F.pivot[1]), b0 = Math.round(KITX.bpos(s.t0)), u = KITX.bpos(t) - b0, open = ease.out(clamp01(u));
  const ids = F.lives, n = ids.length;
  const herOnly = () => { fc.setTransform(1, 0, 0, 1, 0, 0); fc.globalCompositeOperation = 'source-over'; fc.globalAlpha = 1; fc.clearRect(0, 0, W, H); fc.drawImage(m, cr.sx, cr.sy, cr.sw, cr.sh, 0, 0, W, H); };
  let flash = null;
  for (let j = n - 1; j >= 0; j--) {
    const fj = 1.5 + 0.5 * j, k = clamp01((u - (fj - 0.5)) / 0.5); if (u >= fj) { if (u < fj + 0.35) flash = { col: byId[ids[j]].color, a: 1 - (u - fj) / 0.35 }; continue; }
    const side = j % 2 ? 1 : -1, ang = side * (10 + 4.5 * (n - 1 - j)) * Math.PI / 180 * open * (1 - ease.io(k));
    herOnly(); fc.globalCompositeOperation = 'source-atop'; fc.fillStyle = hexA(byId[ids[j]].color, 0.62); fc.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = 0.55 * open; g.translate(piv.x, piv.y); g.rotate(ang); g.translate(-piv.x, -piv.y); g.drawImage(FANC, 0, 0); g.restore();
  }
  // the fold flash is a rim pulse AROUND her: her silhouette in the colour, glowing, drawn BEHIND her; then she is drawn on top in
  // her own colours, so her face and hands are never tinted
  if (flash) { herOnly(); fc.globalCompositeOperation = 'source-in'; fc.fillStyle = flash.col; fc.fillRect(0, 0, W, H);
    g.save(); g.globalAlpha = flash.a; g.shadowColor = flash.col; g.shadowBlur = 40 * S;
    for (const [dx, dy] of [[-6, 0], [6, 0], [0, -6], [0, 6]]) g.drawImage(FANC, dx * S, dy * S); g.restore(); }
  herOnly(); g.drawImage(FANC, 0, 0);
}

// ---------------------------------------------------------------- Step 3: frost tips, captions, strands, git log, tiles
const bposT = (t) => { const B = T.beats; let lo = 0, hi = B.length - 1; if (t <= B[0]) return 0; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (B[m] <= t) lo = m; else hi = m - 1; } return lo + (lo + 1 < B.length ? (t - B[lo]) / (B[lo + 1] - B[lo]) : 0); };
function glowAt(x, y, r, col, a) { const gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.22, hexA(col, 0.85 * a)); gr.addColorStop(1, hexA(col, 0)); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 6.2832); g.fill(); }
// b7-8: the frost tips take the lane colours, one per half beat from beat 2 (a pop, then a steady glow that breathes)
function tips(t, sc) { const s = sc.s, b0 = Math.round(bposT(s.t0)), u = bposT(t) - b0;
  s.opt.tips.forEach(([x, y], i) => { const k = 1 + 0.5 * i, f = u - k; if (f < 0) return; const p = plateToScreen(sc.imgs[0], x, y), col = LIVES[i].color, pop = Math.max(0, 1 - f / 0.5);
    g.save(); g.globalCompositeOperation = 'lighter'; glowAt(p.x, p.y, (26 + 40 * pop) * S, col, 0.55 + 0.45 * pop + 0.08 * Math.sin(t * 5 + i)); g.restore(); }); }
// a life's commit message as a short written line under its detail (b65-68, b70-71)
function caption(t, sc) { const L = byId[sc.s.opt.caption]; if (!L) return; const cap = 28 * S, px = cap / 0.73; g.save(); g.font = `600 ${px}px "JetBrains Mono"`; const w = g.measureText(L.msg).width; g.restore();
  const y = H - 70 * S, x0 = (W - w) / 2, u = clamp01((t - sc.s.t0) / 0.12);
  drawWrittenLane(g, [{ x: x0, y }, { x: x0 + w + 2, y }], { text: L.msg + ' ', color: L.color, cap, merge: 0.4, under: 0.6, upto: (w + 2) * ease.out(u) }); }
// b57-64 strands. STRANDS = the float_top geometry (shots.js export, measured on the clip): centre (her head) and twelve hair ends
let STRANDS = null;
// a strand starts at the measured hair end and runs straight out to the frame edge
// (+ margin); De = its length to the edge
// the clip turns and pulls back: STRANDS.track = [[clip s, head, left foot], ...] (plate fractions); the hair ends measured at clip time
// STRANDS.at follow the similarity (rotation, scale, shift) that takes head and foot there to head and foot now
function strandFrame(c) { const K = STRANDS.track; let i = 0; while (i < K.length - 2 && c > K[i + 1][0]) i++; const a = K[i], b = K[i + 1], u = clamp01((c - a[0]) / (b[0] - a[0]));
  return { h: [lerp(a[1][0], b[1][0], u), lerp(a[1][1], b[1][1], u)], f: [lerp(a[2][0], b[2][0], u), lerp(a[2][1], b[2][1], u)] }; }
function strandPaths(sc) { const im = sc.imgs[0], cm = clipMap(sc.s), cc = cm.c0 + (sc.t - sc.s.t0) * cm.sp;
  const A = strandFrame(STRANDS.at), Bf = strandFrame(cc), PX = (p) => plateToScreen(im, p[0], p[1]);
  const h0 = PX(A.h), f0 = PX(A.f), h1 = PX(Bf.h), f1 = PX(Bf.f), v0 = [f0.x - h0.x, f0.y - h0.y], v1 = [f1.x - h1.x, f1.y - h1.y];
  const sc2 = Math.hypot(...v1) / Math.hypot(...v0), rot = Math.atan2(v1[1], v1[0]) - Math.atan2(v0[1], v0[0]), cs = Math.cos(rot) * sc2, sn = Math.sin(rot) * sc2;
  const map = (p) => { const q = PX(p), dx = q.x - h0.x, dy = q.y - h0.y; return { x: h1.x + cs * dx - sn * dy, y: h1.y + sn * dx + cs * dy }; };
  const c = map(STRANDS.center);
  return STRANDS.ends.map(([x, y], i) => { const e0 = map([x, y]); let dx = e0.x - c.x, dy = e0.y - c.y; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const e = { x: c.x + (e0.x - c.x) * 1.0, y: c.y + (e0.y - c.y) * 1.0 };   // from the hair end itself (section 3 v2: clear of her hair)
    const tx = dx > 0 ? (W - e.x) / dx : dx < 0 ? -e.x / dx : 1e9, ty = dy > 0 ? (H - e.y) / dy : dy < 0 ? -e.y / dy : 1e9;
    return { e, d: [dx, dy], De: Math.max(60 * S, Math.min(tx, ty)) + 40 * S, L: LIVES[i] }; }); }
const ray = (p, d, len) => ({ x: p.x + d[0] * len, y: p.y + d[1] * len });
function writeRay(pts, L, cap, prog, t, alpha = 1) {   // text upright: paths run left to right; prog grows from the hair end
  let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const rev = pts[pts.length - 1].x < pts[0].x, P = rev ? [...pts].reverse() : pts;
  // sparse: the branch name only, once per strand with long gaps (merge 0 widens the gaps), the hairline carries the rest
  drawWrittenLane(g, P, { text: laneString([L.branch], true), color: L.color, cap: (u) => cap * (rev ? 1.3 - 0.4 * u : 0.9 + 0.4 * u), merge: 0, under: 0.35, alpha,
    scroll: (rev ? 1 : -1) * t * 3, from: rev ? len * (1 - prog) : 0, upto: rev ? undefined : len * prog }); }
function strands(t, sc) {
  const s = sc.s, st = s.opt.strands, u = seg(t, s.t0, s.t1), b0 = Math.round(bposT(s.t0)), ub = bposT(t) - b0, paths = strandPaths(sc);
  const cap = 22 * S;
  paths.forEach((q, i) => {
    if (st.mode === 'double') { const m = ray(q.e, q.d, 0.4 * q.De), grow = ease.out(clamp01(ub / 2));
      writeRay([q.e, m], q.L, cap, 1, t);
      for (const sg of [-1, 1]) { const a = sg * 0.2 * grow, d = [q.d[0] * Math.cos(a) - q.d[1] * Math.sin(a), q.d[0] * Math.sin(a) + q.d[1] * Math.cos(a)];
        writeRay([m, ray(m, d, q.De)], q.L, cap * 1.05, grow, t + sg); } }
    else writeRay([q.e, ray(q.e, q.d, q.De)], q.L, cap, st.mode === 'grow' ? ease.out(clamp01(ub / 3)) : 1, t);
    if (st.mode === 'pulses') { const k = i / 4, f = (ub - k) / 1.5; if (f > 0 && f < 1.25) { const fp = Math.min(1, f), p = ray(q.e, q.d, q.De * (1 - ease.io(fp))), arr = f > 1 ? 1 - (f - 1) / 0.25 : 0;
      g.save(); g.globalCompositeOperation = 'lighter'; glowAt(p.x, p.y, (34 + 50 * arr) * S, q.L.color, f > 1 ? arr : 1); g.restore(); } }
  });
  if (st.mode === 'rotate' && sc.win && sc.win.length) {   // a life window glides inward along one strand
    const q = paths[st.on || 0], p = ray(q.e, q.d, q.De * (0.85 - 0.6 * ease.io(u))), w = 320 * S, h = w * 9 / 16, b = READY.get(sc.win[0].url);
    if (b) { const cr = cover(b.width, b.height, w, h); g.save(); g.shadowColor = q.L.color; g.shadowBlur = 24 * S; g.fillStyle = q.L.color; g.fillRect(p.x - w / 2 - 3 * S, p.y - h / 2 - 3 * S, w + 6 * S, h + 6 * S); g.shadowBlur = 0;
      g.drawImage(b, cr.sx, cr.sy, cr.sw, cr.sh, p.x - w / 2, p.y - h / 2, w, h); g.restore(); } }
}
// b73-76: git log --graph racing on the beat; real commit messages (proof/lives.js), hashes from hashOf; rows per beat 2, 4, 8, 16.
// Rows scroll up from the bottom; the newest row is bright, older rows dim. Mono 34 px (cap 25).
const GL = (() => { const out = []; const ids = [...LIVES.map((l) => l.id), 'main'];
  for (let n = 0; n < 400; n++) { const id = ids[(n * 7) % ids.length], L = id === 'main' ? { branch: 'main', msg: 'merge me back to main', color: MAIN } : byId[id];
    out.push({ col: (n * 5) % 6, id, L, hash: hashOf(id + '#' + n) }); } return out; })();
function gitlog(t, s) {
  g.fillStyle = '#07070C'; g.fillRect(0, 0, W, H);
  const o = s.opt, prev = [0, 1, 2, 3].slice(0, o.bar).reduce((a, k) => a + 3 * 2 ** (k + 1), 0), b0 = bposT(s.t0), u = Math.max(0, bposT(t) - b0);
  const n = 18 + prev + Math.floor(u * o.rate), fpx = 34 * S, lh = 50 * S, rows = Math.ceil(H / lh) + 1, cw = fpx * 0.6;
  g.save(); g.font = `600 ${fpx}px "JetBrains Mono"`; g.textBaseline = 'alphabetic';
  const beatPop = 1 - clamp01((u % 1) / 0.25);
  for (let r = 0; r < rows; r++) { const k = n - 1 - r; if (k < 0) break; const R = GL[k % GL.length], y = H - 40 * S - r * lh, a = r === 0 ? 1 : Math.max(0.28, 0.85 - r * 0.035);
    let x = 70 * S; g.globalAlpha = a;
    for (let c = 0; c < 6; c++) { const ch = c === R.col ? '*' : (k + c) % 9 === 0 ? '/' : (k + c) % 11 === 0 ? '\\' : '|'; const cc = c === R.col ? R.L.color : LIVES[(c * 3) % 12].color; g.fillStyle = cc; g.fillText(ch, x, y); x += cw * 2; }
    x += cw; g.fillStyle = hexA('#FFD23F', 0.8); g.fillText(R.hash, x, y); x += cw * 8;
    g.fillStyle = R.L.color; const br = `(${R.L.branch})`; g.fillText(br, x, y); x += g.measureText(br).width + cw;
    g.fillStyle = r === 0 ? '#FFFFFF' : CREAM; g.fillText(R.L.msg, x, y); }
  g.restore();
  if (beatPop > 0) { g.fillStyle = `rgba(255,255,255,${0.10 * beatPop})`; g.fillRect(0, 0, W, H); }
}
// b72: the twelve details tile in on sixteenths (4 x 3), hold, and on the last sixteenth snap to one point: a 2-frame white flash and a
// bright point that dies away (the roll ending)
function tiles(t, sc) {
  g.fillStyle = '#05050A'; g.fillRect(0, 0, W, H);
  const s = sc.s, b0 = Math.round(bposT(s.t0)), u = (bposT(t) - b0) * 4, gx = 4, gy = 3, tw = W / gx, th = H / gy, snap = T.beatT(b0 + 3.75);
  if (on(t, snap)) { const f = fr(t, snap); if (f <= 1) { g.fillStyle = `rgba(255,250,240,${f === 0 ? 1 : 0.55})`; g.fillRect(0, 0, W, H); }
    g.save(); g.globalCompositeOperation = 'lighter'; const k = Math.max(0, 1 - f / 9); glowAt(W / 2, H / 2, (14 + 70 * k) * S, MAIN, 0.4 + 0.6 * k); g.restore(); return; }
  sc.imgs.forEach((im, i) => { if (u < i) return; const b = READY.get(im.url); if (!b) return; const pop = clamp01((u - i) / 0.6), cx = (i % gx + 0.5) * tw, cy = (Math.floor(i / gx) + 0.5) * th;
    const sz = 0.8 + 0.2 * ease.outBack(pop) + 0.015 * Math.max(0, u - 12), w = tw * sz, h = th * sz;
    const cr = cover(b.width, b.height, w, h); g.save(); g.globalAlpha = clamp01(pop * 2); g.drawImage(b, cr.sx, cr.sy, cr.sw, cr.sh, cx - w / 2, cy - h / 2, w, h);
    g.strokeStyle = byId[im.life].color; g.lineWidth = 3 * S; g.strokeRect(cx - w / 2, cy - h / 2, w, h); g.restore(); });
}

// ---------------------------------------------------------------- Step 4: the handwriting and the settle into stars (verse 2)
const SETTLE_OK = {};
function handPaths(sc) { const H0 = sc.s.opt.hand, a = plateToScreen(sc.imgs[0], H0.at[0], H0.at[1]); return scriptPaths(H0.text, { x: a.x, y: a.y, size: H0.size * H }); }
// the pencil tip in vio_write (o.track [[clip s, x, y], ..], plate fractions, measured per frame): the pen point of the ink sits on it
function tipAt(sc, o, c) { const K = o.track; let i = 0; while (i < K.length - 2 && c > K[i + 1][0]) i++; const a = K[i], b = K[i + 1], u = clamp01((c - a[0]) / (b[0] - a[0]));
  return plateToScreen(sc.imgs[0], lerp(a[1], b[1], u), lerp(a[2], b[2], u)); }
function hand(t, sc) {
  const s = sc.s, o = s.opt.hand, P0 = handPaths(sc), VIOC = '#9B6BFF', wd = 4.5 * S;
  let P = P0;
  const shift = (Q, dx, dy) => ({ ...Q, strokes: Q.strokes.map((st) => st.map((p) => ({ x: p.x + dx, y: p.y + dy }))), box: { ...Q.box, x: Q.box.x + dx, y: Q.box.y + dy } });
  if (o.track) { const cm = clipMap(s), c = o.release ? (o.release.trackAt ?? o.track[o.track.length - 1][0]) : cm.c0 + (t - s.t0) * cm.sp;
    const u = o.release ? 1 : clamp01((seg(t, s.t0, s.t1) - o.write[0]) / (o.write[1] - o.write[0])), pp = penAt(P0, P0.len * u), tip = tipAt(sc, o, c); P = shift(P0, tip.x - pp.x, tip.y - pp.y); }
  if (!o.release) { const u = clamp01((seg(t, s.t0, s.t1) - o.write[0]) / (o.write[1] - o.write[0]));
    if (u <= 0) return; const pen = drawScript(g, P, { upto: P.len * u, color: VIOC, width: wd, glow: 22 * S });
    if (pen) { g.save(); g.globalCompositeOperation = 'lighter'; glowAt(pen.x, pen.y, 26 * S, VIOC, 0.9); g.restore(); } return; }
  // release: the finished line lifts off and travels up and over to the sunrise, arriving on the downbeat of bar R.arrive
  const R = o.release, ta = T.bar(R.arrive), u = clamp01((t - s.t0) / (ta - s.t0)), e = ease.io(u), b = P.box;
  const c0 = { x: b.x + b.w / 2, y: b.y + b.h / 2 }, c2 = { x: R.to[0] * W, y: R.to[1] * H }, c1 = { x: (c0.x + c2.x) / 2, y: R.top * H };
  const q = (k) => ({ x: (1 - k) * (1 - k) * c0.x + 2 * k * (1 - k) * c1.x + k * k * c2.x, y: (1 - k) * (1 - k) * c0.y + 2 * k * (1 - k) * c1.y + k * k * c2.y });
  if (u < 1) { const p = q(e), sz = 1 - 0.9 * e;
    for (let j = 1; j <= 5; j++) { const pj = q(Math.max(0, e - 0.035 * j)); g.save(); g.globalCompositeOperation = 'lighter'; glowAt(pj.x, pj.y, (10 + 6 * (5 - j)) * S * (1 - 0.6 * e), VIOC, 0.25 * (1 - j / 6) * (u > 0.02 ? 1 : 0)); g.restore(); }
    g.save(); g.translate(p.x, p.y); g.rotate(-0.15 * Math.sin(e * Math.PI)); g.scale(sz, sz); g.translate(-c0.x, -c0.y); drawScript(g, P, { color: VIOC, width: wd / Math.max(0.35, sz), glow: 22 * S }); g.restore(); }
  else { const f = fr(t, ta); if (f <= 1) { g.fillStyle = `rgba(235,225,255,${f === 0 ? 0.8 : 0.4})`; g.fillRect(0, 0, W, H); }   // the hit
    g.save(); g.globalCompositeOperation = 'lighter'; glowAt(c2.x, c2.y, (30 + 60 * Math.max(0, 1 - f / 20)) * S, VIOC, 0.5 + 0.5 * Math.max(0, 1 - f / 20)); g.restore(); }
}
// vio_still: she becomes stars. Her figure stays at full brightness; along her outline star points break away (each edge cell gets its own
// moment through the three bars), drift outward from her centre and settle among the sky's stars, twinkling (12 fps steps). The matte
// also took the dish and its ring, so only the part inside settle.poly (plate fractions, set by hand on the clip) counts as her.
// The sky's brightest star cells twinkle too.
let SETC = null;
function settle(t, sc) {
  const m = READY.get(sc.settle); if (!m) return; const u = seg(t, sc.s.t0, sc.s.t1), im = sc.imgs[0], cr = cover(m.width, m.height, W, H, im.zoom || 1, im.fo[0], im.fo[1]);
  const gw = 240, gh = 135; if (!SETC) { SETC = document.createElement('canvas'); SETC.width = gw; SETC.height = gh; }
  const x = SETC.getContext('2d', { willReadFrequently: true }); x.save(); x.clearRect(0, 0, gw, gh);
  const poly = sc.s.opt.settle.poly; if (poly) { x.beginPath(); poly.forEach(([px, py], k) => { const q = plateToScreen(im, px, py); const X = q.x * gw / W, Y = q.y * gh / H; if (k) x.lineTo(X, Y); else x.moveTo(X, Y); }); x.closePath(); x.clip(); }
  x.drawImage(m, cr.sx, cr.sy, cr.sw, cr.sh, 0, 0, gw, gh); x.restore();
  const A = x.getImageData(0, 0, gw, gh).data, al = (i, j) => (i < 0 || j < 0 || i >= gw || j >= gh ? 0 : A[(j * gw + i) * 4 + 3]);
  let cx = 0, cy = 0, nn = 0; for (let j = 0; j < gh; j += 2) for (let i = 0; i < gw; i += 2) if (al(i, j) >= 128) { cx += i; cy += j; nn++; } if (!nn) return; cx /= nn; cy /= nn;
  const step = Math.floor(t * 12 + 1e-6); g.save(); g.globalCompositeOperation = 'lighter';
  for (let j = 1; j < gh - 1; j++) for (let i = 1; i < gw - 1; i++) { if (al(i, j) < 128) continue;
    if (al(i - 1, j) >= 128 && al(i + 1, j) >= 128 && al(i, j - 1) >= 128 && al(i, j + 1) >= 128) continue;   // edge cells only
    const r = mulberry32(i * 7349 + j * 9157), h = r(), born = 0.05 + 0.75 * h, k = clamp01((u - born) / 0.35); if (k <= 0) continue;
    let dx = i - cx, dy = j - cy; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l; const drift = (25 + 70 * r()) * S * ease.out(k);
    const tw = 0.55 + 0.45 * Math.sin(step * 0.9 + h * 40), px = (i + 0.5) * W / gw + dx * drift, py = (j + 0.5) * H / gh + dy * drift;
    const rad = (2.5 + 4 * r()) * S * (0.8 + 0.4 * tw), a = (k < 0.15 ? k / 0.15 : 1) * 0.8 * tw;
    glowAt(px, py, rad, h < 0.25 ? '#9B6BFF' : '#EDE6FF', a); }
  // the sky keeps twinkling: glints on the plate's brightest cells above the horizon, outside her
  const pb = READY.get(im.url); x.clearRect(0, 0, gw, gh); x.drawImage(pb, 0, 0, gw, gh); const P = x.getImageData(0, 0, gw, gh).data;
  for (let j = 1; j < gh * 0.45; j++) for (let i = 1; i < gw - 1; i++) { const o = (j * gw + i) * 4; if (P[o] < 150) continue;
    const r0 = mulberry32(i * 3301 + j * 7919)(); if (r0 > 0.25) continue; const tw = Math.max(0, Math.sin(step * 0.7 + r0 * 60)); if (tw < 0.3) continue;
    const px = (i + 0.5) * W / gw, py = (j + 0.5) * H / gh, rr = (2 + 5 * tw) * S;
    g.strokeStyle = `rgba(240,236,255,${0.6 * tw})`; g.lineWidth = 1.2 * S; g.beginPath(); g.moveTo(px - rr * 1.6, py); g.lineTo(px + rr * 1.6, py); g.moveTo(px, py - rr * 1.6); g.lineTo(px, py + rr * 1.6); g.stroke(); glowAt(px, py, rr, '#EDE6FF', 0.5 * tw); }
  g.restore();
}

// ---------------------------------------------------------------- the frame
function drawImgs(list) {
  for (const im of list) { const b = READY.get(im.url); const cr = cover(b.width, b.height, W, H, im.zoom || 1, (im.fo || [0.5, 0.5])[0], (im.fo || [0.5, 0.5])[1]);
    g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; g.globalAlpha = im.alpha === undefined ? 1 : im.alpha; g.drawImage(b, cr.sx, cr.sy, cr.sw, cr.sh, 0, 0, W, H); g.restore(); }
}
function draw(t, sc) {
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; noShadow();
  g.fillStyle = BG; g.fillRect(0, 0, W, H);
  const s = sc.s, sec = SECTIONS[s.sec];
  if (sc.flash) drawImgs(sc.flash);
  else if (sc.eff === 'plate') {
    const st = s.opt && s.opt.strands, rot = st && st.mode === 'rotate';
    if (rot) { const u = seg(t, s.t0, s.t1), a = (-7 * ease.io(u)) * Math.PI / 180, z = 1 - 0.2 * ease.io(u); g.save(); g.translate(W / 2, H / 2); g.rotate(a); g.scale(z, z); g.translate(-W / 2, -H / 2); }
    drawImgs(sc.imgs); if (sc.cross) crossing(sc); if (sc.fan && READY.get(sc.fan)) fan(t, sc);
    if (st && STRANDS) strands(t, sc);
    if (rot) g.restore();
    if (s.opt.tips) tips(t, sc);
    if (s.opt.caption) caption(t, sc);
    if (s.opt.hand) hand(t, sc);
    if (s.opt.settle && sc.settle) settle(t, sc);
  }
  else if (sc.eff === 'code') { try { if (s.opt.code === 'gitlog') gitlog(t, s); else tiles(t, sc); } catch (e) { console.log('ERROR code ' + e.stack); } }
  else if (sc.eff === 'v7') {
    let b = READY.get(sc.imgs[0].url); const rect = { x: 0, y: 0, w: W, h: H }, vc = s.opt && s.opt.v7crop;
    if (vc) { if (!CROPC) { CROPC = document.createElement('canvas'); CROPC.width = W; CROPC.height = H; } const x = CROPC.getContext('2d'); x.imageSmoothingQuality = 'high';
      x.drawImage(b, vc[0] * b.width, vc[1] * b.height, vc[2] * b.width, vc[3] * b.height, 0, 0, W, H); b = CROPC; }
    const look = s.opt && s.opt.paperLook && PAPER_LOOKS[s.opt.paperLook] ? PAPER_LOOKS[s.opt.paperLook][ORCHPAPER] : null;
    if (paperPass && USE_PAPER && look && look.light) {   // raw frame, the paper pass's contour (no tone) added over it
      g.drawImage(b, 0, 0, W, H);
      if (!LIGHTC) { LIGHTC = document.createElement('canvas'); LIGHTC.width = W; LIGHTC.height = H; }
      const lc = LIGHTC.getContext('2d'); paperPass(lc, b, rect, { paper: 'black', ink: sec.ink || INKS, seed: 1000 + s.i, t, skip: 'h' });
      g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.6; g.drawImage(LIGHTC, 0, 0); g.restore(); }
    else if (paperPass && USE_PAPER) { const { extraInk, ...lk } = look || {};
      g.save(); paperPass(g, b, rect, { paper: sec.paper || 'black', ...(sec.stroke ? { stroke: sec.stroke } : {}), ink: [...(sec.ink || INKS), ...(extraInk || [])], seed: 1000 + s.i, t, ...lk }); g.restore(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    else g.drawImage(b, 0, 0, W, H);
  } else if (sc.eff === 'kit') KITX.draw(s, t);
  else card(t, s);
  if (s.opt && s.opt.white && sc.eff === 'plate') { const f = fr(t, s.t0); if (f <= 1) { g.fillStyle = `rgba(255,250,240,${f === 0 ? 0.85 : 0.4})`; g.fillRect(0, 0, W, H); } }   // 2-frame white flash (impact, snare)
  grain(t); vignette();
  if (sc.eff === 'plate' && LANES && s.opt && s.opt.lane && !(sc.cross && sc.cross.u >= 1)) lane(t, sc);
  overlays(t, sc);
  lyrics(t, sc.eff, s);
}
let LOCK = Promise.resolve();
function render(t) { const p = LOCK.then(() => render1(t)); LOCK = p.catch(() => {}); return p; }
async function render1(t) {
  const s = shotAt(t);
  if (s.kind === 'proof' && !ALLCARDS) { await PROOF.render(t); const sc = { t, s, eff: 'proof' }; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; noShadow(); if (HUD) hud(t, sc); return sc; }
  const sc = scene(t); READY.clear();
  await Promise.all([...sc.imgs, ...(sc.flash || []), ...(sc.cross ? sc.cross.life : []), ...(sc.fan ? [{ url: sc.fan }] : []), ...(sc.settle ? [{ url: sc.settle }] : []), ...(sc.win || [])].map(async (im) => READY.set(im.url, await bitmap(im.url))));
  draw(t, sc); if (HUD) hud(t, sc); return sc;
}

// ---------------------------------------------------------------- boot and harness interface
async function boot() {
  await Promise.all(FONTS.map(async ([name, u, desc]) => { const f = new FontFace(name, `url("${encodeURI(u)}")`, desc); await f.load(); document.fonts.add(f); }));
  await document.fonts.ready;
  for (const [face, wt] of [['mono', 600], ['mono', 500], ['serif'], ['slab'], ['sans', 500]]) { setFont(face === 'mono' || face === 'sans' ? FACE[face](100, wt) : FACE[face](100)); CAP[face + (wt || '')] = g.measureText('H').actualBoundingBoxAscent / 100; }
  measureMono(g);
  T = await loadTiming(TIMING);
  SH = resolveShots(T);
  for (const s of SH) { if (s.kind === 'plate') await findPlate(s.src); if (s.opt && s.opt.strands && s.opt.strands.window) await findPlate(s.opt.strands.window); if (s.kind === 'code' && s.opt.lives) for (const id of s.opt.lives) await findPlate('det_' + id); if (s.opt && s.opt.flash) await findPlate(s.opt.flash.id); if (s.opt && s.opt.cross) await findPlate(s.opt.cross.life); }
  const vm = await json(`${V7DIR}/meta.json`);
  if (vm && vm.n) { V7 = { fps: vm.fps || 30, n: vm.n, t0: vm.t0 || 0, first: vm.first !== undefined ? vm.first : Math.round((vm.t0 || 0) * (vm.fps || 30)), w: vm.w, h: vm.h };
    if (!(await exists(v7Url(V7.first)))) { console.log(`v7: ${v7Url(V7.first)} not found; v7 shots fall back to cards`); V7 = null; } }
  for (const s of SH) if (s.opt && s.opt.v7dir && !(s.opt.v7dir in V7S)) V7S[s.opt.v7dir] = await loadV7(s.opt.v7dir);
  try { ({ paperPass } = await import('./paper.js')); } catch (e) { console.log('paper.js not loaded (' + String(e).slice(0, 80) + '); v7 shots are raw'); }
  try { ({ glyphPass } = await import('./glyph.js')); } catch (e) { console.log('glyph.js not loaded'); }
  { const KJ = await json('/fable/take2/kit.json'); if (KJ) KITX = makeKit({ g, W, H, S, T, KJ, READY, drawWrittenLane, laneString, glyphPass, byId, MAIN, clamp01, lerp, ease }); }
  // take-two changes inside the proof range (all off with proofbug=1): the black-paper hero (hero_paper, nearest frame; hero=old for the
  // first one), written lanes on the ten lives (prooflanes=0 off), bar 38 panel afterimages (trail=0 off)
  const heroNew = !PROOFBUG && Q.get('hero') !== 'old' && (await findPlate('hero_paper'));
  PROOF = await makeProof(g, { W, H, FPS, T, plates: PROOF_PLATES, twos: false, fixStrip: !PROOFBUG,
    dirs: heroNew ? { hero: heroNew.dir } : {}, heroBlend: !heroNew,
    // hero_paper has her in the centre: crop so she sits right of centre, the slab stacks one word per row on the left (rule 5: clear of
    // her face and hands), and the written lane passes behind her legs
    hero: heroNew ? { zoom: 1.25, fx: 0, fy: 0.05, rows: [[0], [1], [2], [3], [4]], gap: [0.5, 0.77] } : null, writtenLanes: !PROOFBUG && Q.get('prooflanes') !== '0' ? { drawWrittenLane, laneString } : null,
    trail: !PROOFBUG && Q.get('trail') !== '0' });
  // the proof range must be exactly the proof shots of the list
  const pr = SH.filter((s) => s.kind === 'proof'); if (Math.abs(pr[0].t0 - PROOF.t0) > 0.002 || Math.abs(pr[pr.length - 1].t1 - PROOF.tEnd) > 0.002) throw new Error('proof range does not match the shot list');
  LYR = buildLyrics(); buildGrain(); STRANDS = FLOAT || null;
  for (const s of SH) if (s.opt && s.opt.settle) { const d = s.opt.settle.matte; if (!(d in SETTLE_OK)) { const mm = await json(`${d}/meta.json`); SETTLE_OK[d] = !!(mm && mm.n); } }
  const N = Math.ceil(T.duration * FPS - 1e-6);
  const sizes = {}; const meas = (k, f) => { setFont(f); sizes[k] = { font: f.font, capPx: +g.measureText('H').actualBoundingBoxAscent.toFixed(1) }; };
  meas('lyric_verse', capFont('serif', SZ.verse * S)); meas('lyric_slab', capFont('slab', SZ.slab * S)); meas('title', capFont('slab', SZ.title * S)); meas('counter', capFont('mono', SZ.counter * S, 600));
  meas('card_picture', FACE.sans(SZ.cardPic * S, 500)); meas('card_meta', FACE.mono(SZ.cardMeta * S, 500)); meas('card_id', FACE.mono(SZ.cardId * S, 700));
  meas('chip', FACE.mono(SZ.chip * S, 600)); meas('counter_label', FACE.mono(24 * S, 500)); meas('card_todo', FACE.mono(26 * S, 500)); meas('hud_debug', FACE.mono(SZ.hud * S, 600));
  Object.assign(sizes, PROOF.sizes);
  // font px of each mono label too (the 24 px rule for chips and labels is a font-size rule)
  for (const k of Object.keys(sizes)) sizes[k].fontPx = parseFloat(sizes[k].font.match(/(\d+(\.\d+)?)px/)[1]);
  const shots = SH.map((s) => ({ id: s.id, sec: s.sec, from: s.from, to: s.to, t0: s.t0, t1: s.t1, code: s.code, kind: s.kind, src: s.src, status: s.status, eff: effKind(s), found: s.kind === 'plate' ? !!PLATE[s.src] : null, flash: s.opt && s.opt.flash ? s.opt.flash : null, pic: s.pic }));
  let ws = null, ack = null;
  async function post(i) {
    if (!ws) { ws = new WebSocket(`ws://${location.host}/__ws`); ws.binaryType = 'arraybuffer'; await new Promise((r) => (ws.onopen = r)); ws.onmessage = () => ack && ack(); }
    const px = g.getImageData(0, 0, W, H).data; const p = new Promise((r) => (ack = r)); ws.send((Q.get('wid') || 0) + ':' + i); ws.send(px.buffer); await p;
  }
  await render(+(Q.get('t') || 0));
  Object.assign(window.FILM, { ready: true, W, H, FPS, t0: 0, tStop: T.duration, n: N, timing: TIMING, barBeatWorst: T.barBeatWorst, sizes, shots,
    proof: { t0: PROOF.t0, tEnd: PROOF.tEnd, hero: heroNew ? heroNew.dir : 'proof hero' }, v7: V7, paper: !!paperPass, glyph: !!glyphPass, plates: Object.fromEntries(Object.entries(PLATE).map(([k, p]) => [k, p ? p.dir : null])),
    lyrics: LYR.map((l) => ({ id: l.id, slab: l.slab, t0: l.t0, out: l.out, words: l.words })), render, async renderAndPost(t, i) { await render(t); await post(i); } });
}
async function main() {
  if (Q.get('mode') === 'lanetest') { const m = await import('./lanetest.js'); return m.boot(g, { W, H, FPS, FONTS }); }
  return boot();
}
main().catch((e) => { console.error('BOOT ERROR', e && e.stack ? e.stack : e); window.FILM.error = String(e && e.stack ? e.stack : e); });
