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
import { resolveShots, SECTIONS, FLOAT, PLATE_ALIAS, PROOF_A, LIFE_SWAP, HERO_NEXT, PROOF_STAY } from '../shots.js';
import { LIVES, MAIN, byId, hashOf } from '../../proof/lives.js';
import { drawWrittenLane, laneString, measureMono } from './lanes.js';
import { makeKit } from './kit.js';
import { scriptPaths, drawScript, penAt } from './script.js';
import { makeOutro } from './outro.js';
import { makeMapfold } from './mapfold.js';
import { makeProof } from './proofscene.js';

const Q = new URLSearchParams(location.search);
const W = +(Q.get('w') || 1920), H = +(Q.get('h') || 1080), FPS = +(Q.get('fps') || 30);
const S = H / 1080, HF = 0.5 / FPS;
const TIMING = Q.get('timing') || '/analysis_v3/timing.json';
const PLATE_DIRS = (Q.get('plates') || '/work_fable/take2/plates,/work_fable/proof/plates').split(',');
const PROOF_PLATES = '/work_fable/proof/plates';
const V7DIR = Q.get('v7dir') || '/work_fable/take2/v7/full';
const HUD = Q.get('hud') !== '0', USE_V7 = Q.get('v7') !== '0', USE_PAPER = Q.get('paper') !== '0', ALLCARDS = Q.get('cards') === '1', LANES = Q.get('lanes') !== '0';
const PROOFBUG = Q.get('proofbug') === '1', LIKENESS = Q.get('likeness') !== '0';
// film v3 (Jade on v2: "go back to the hatched 3D"): the orchestra bars are the revision-3 3D through the solid paper look by default;
// ?orch=plates brings back film v2's route (the cel plates orch_1..8 and shot 1's dissolve into orch_1)
const ORCH_V7 = Q.get('orch') !== 'plates';
let OUTRO = null, MAPF = null;
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
async function firstPlate(ids) { for (const id of [].concat(ids)) if (await findPlate(id)) return id; return null; }
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
  if (s.kind === 'plate') return PLATE[s.src] && !(s.code === 'L' && !LIKENESS) ? 'plate' : 'card';   // likeness shots: ?likeness=0 forces the card
  if (s.kind === 'v7') return USE_V7 && v7Of(s) ? 'v7' : 'card';
  if (s.kind === 'kit') return KITX && !s.opt.kit.off && KITX.ok(s) ? 'kit' : 'card';
  if (s.kind === 'code') { if (s.opt.code === 'tiles') return s.opt.lives.some((id) => PLATE['det_' + id]) ? 'code' : 'card'; if (s.opt.code === 'gitlog') return 'code'; if (s.opt.code === 'mapfold') return MAPF && MAPF.ok(s) ? 'code' : 'card'; return OUTRO && OUTRO.ok(s) ? 'code' : 'card'; }
  return 'card';
}

// ---------------------------------------------------------------- lyrics (every sung line, word by word on the word times)
const CHORUS_IDS = new Set([7, 8, 9, 10, 20, 21, 22, 23, 24, 25]);
// film v2 (Jade: "don't need 'Ahh' lyrics on the screen"): on-screen lyrics are for words; a line made only of vocables (line 13
// "Ahh... ahh...") is not drawn, and neither is the wordless "ooh" adlib (b100; it was an overlay, removed from shots.js)
const VOCABLE = /^(a+h+|o+h*|o+o+h*|m+|hm+|la+|na+)$/i;
function buildLyrics() {
  const L = T.raw.lyrics.lines.map((l) => ({ id: l.id, text: l.text, slab: CHORUS_IDS.has(+l.id),
    words: l.words.map((w) => ({ w: w.w.replace(/[^A-Za-z0-9'’]/g, ''), start: w.start, end: w.end })).filter((w) => w.w) }))
    .filter((l) => l.words.length && !l.words.every((w) => VOCABLE.test(w.w)));
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
  const skip = s && s.opt && s.opt.lane && s.opt.lane.lyric !== undefined && eff === 'plate' ? String(s.opt.lane.lyric) : null;   // b26: the lane carries it
  for (const l of LYR) {
    if (!on(t, l.t0) || t > l.out || String(l.id) === skip) continue;
    const la = 1 - clamp01((t - l.out + 0.2) / 0.2), place = eff === 'card' ? 'strip' : 'low', Lx = layoutLine(l, place, s && s.opt && s.opt.lyr, s && s.t1);
    if (place === 'low' && Lx.region) { const B = Lx.box, p = 50 * S; g.save(); g.filter = `blur(${Math.round(36 * S)}px)`; g.fillStyle = `rgba(5,6,26,${(s.opt.lyr.cloud || 0.42) * la})`; g.fillRect(B.x - p, B.y - p, B.w + 2 * p, B.h + 2 * p); g.restore(); }   // a soft dark cloud behind the words only
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
// film v4: opt.lag (s), or the query value opt.lagQ (ms, e.g. ?lagface=340) which wins, so Jade's pick can be tried without an edit
function lagOf(o) { const q = o.lagQ && Q.get(o.lagQ); return q !== null && q !== undefined && q !== '' && isFinite(+q) ? +q / 1000 : o.lag || 0; }
function clipMap(s) {
  const o = s.opt || {}, D = s.t1 - s.t0;
  if (o.songLock && PLATE[s.src] && PLATE[s.src].meta.t0_song !== undefined) return { c0: s.t0 - PLATE[s.src].meta.t0_song + lagOf(o), sp: 1 };   // likeness: locked to song time
  // film v4: a sung shot's lip-sync lag L (s; + = the sound plays later than the picture, notes/plates_v4.md): clip = song - t0_song + L
  if (o.cross) { const x = o.cross, ta = x.at * D, sp = Math.max(1, Math.min(x.maxSpeed || 1.5, x.reach / ta)); return { c0: Math.max(0, x.reach - sp * ta), sp }; }
  if (o.clipFrom) { const tf = T.beat(o.clipFrom[0], o.clipFrom[1]); return { c0: (o.clip0 || 0) + (s.t0 - tf) * (o.speed || 1), sp: o.speed || 1 }; }   // film v6: a split shot continues its clip from clipFrom
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
  if (sc.eff === 'v7') { const k = v7Index(t, s); if (k < 0) sc.eff = 'card'; else { sc.imgs.push({ url: v7Url(k, s), v7: true }); if (s.opt.windows) sc.wins = windowUrls(s, t); } }
  // film v2: a v7 shot that dissolves into a plate (opt.tail {id, at (song s), clip0, frames}): orchestra shot 1, the 3D arrival into orch_1
  const tl = s.opt && s.opt.tail; if (sc.eff === 'v7' && tl && !ORCH_V7 && PLATE[tl.id] && on(t, tl.at)) { sc.tail = []; plateDraw({ t0: tl.at, t1: s.t1, opt: { clip0: tl.clip0, push: 0 } }, t, tl.id, sc.tail);
    const a = clamp01((fr(t, tl.at) + 1) / tl.frames); sc.tail.forEach((im) => (im.alpha = (im.alpha === undefined ? 1 : im.alpha) * a)); }
  if (sc.eff === 'plate') plateDraw(s, t, s.src, sc.imgs);
  if (sc.eff === 'kit') for (const u of KITX.need(s, t)) sc.imgs.push({ url: u });
  if (sc.eff === 'code' && s.opt.code === 'mapfold') for (const u of MAPF.need(s, t)) sc.imgs.push({ url: u });
  if (sc.eff === 'code' && OUTRO && !['tiles', 'gitlog', 'mapfold'].includes(s.opt.code)) for (const u of OUTRO.need(s, t)) sc.imgs.push({ url: u });
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
  if (L.lyric !== undefined) { lyricLane(t, sc, pts, from, len); return; }
  drawWrittenLane(g, pts, { text: laneText(L.text), color: L.color || MAIN, cap: (L.cap || 22) * S, scroll: (L.scroll || 0) * (t - sc.s.t0), merge: L.merge || 0, under: L.under === undefined ? 0.35 : L.under, upto, from });
}
// film v3, b45 (Jade's easter egg from Rewind, where Banach-Tarski is a running idea): ONE extra written lane joining the braid, its text
// `banach–tarski` repeated as the real lanes repeat their commit messages, in a quiet gold, no chip, no label, no figure. v7's braid
// cannot be tracked through the paper pass, so it is a drawn cubic (opt.egg.pts, frame fractions) from the junction on main's band out to
// the frame edge (path from the junction so the type reads left to right); it is written outward from the junction over the first part
// of the shot (grow), and its text closes up toward main (merge rises) as the shot goes on.
function egg(t, sc) { const o = sc.s.opt.egg, u = seg(t, sc.s.t0, sc.s.t1), [a, b, c, d] = o.pts.map(([x, y]) => ({ x: x * W, y: y * H }));
  const pts = []; for (let i = 0; i <= 48; i++) { const k = i / 48, A = (1 - k) ** 3, B = 3 * k * (1 - k) ** 2, C = 3 * k * k * (1 - k), D = k ** 3; pts.push({ x: A * a.x + B * b.x + C * c.x + D * d.x, y: A * a.y + B * b.y + C * c.y + D * d.y }); }
  let len = 0; for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y);
  const gr = ease.out(clamp01(u / (o.grow || 0.45)));
  g.save(); g.globalAlpha = o.alpha || 0.7;
  drawWrittenLane(g, pts, { text: laneString([o.text], false), color: o.color, cap: (o.cap || 26) * S, merge: lerp(o.merge[0], o.merge[1], ease.io(u)), under: 0.18, scroll: (o.scroll || 0) * (t - sc.s.t0), upto: len * gr });
  g.restore(); }

// film v6 A1: the violet lane that leaves the MERGE tree alone (shots.js VLANE). A pure function of song time across the v7 shots:
// from the canopy's right tip (anchor, interpolated per song time) a curve out past the frame edge; written out with a light at its
// head over grow[0..1], then a quiet violet line with a slow pulse running outward. No label.
function vlane(t, V) { if (t < V.grow[0]) return; const A = V.anchor; let i = 0; while (i < A.length - 2 && t > A[i + 1][0]) i++;
  const u0 = clamp01((t - A[i][0]) / (A[i + 1][0] - A[i][0])), a = { x: lerp(A[i][1], A[i + 1][1], u0) * W, y: lerp(A[i][2], A[i + 1][2], u0) * H }, b = { x: V.out[0] * W, y: V.out[1] * H };
  const c1 = { x: a.x + 0.06 * W, y: a.y - 0.01 * H }, c2 = { x: b.x - 0.08 * W, y: b.y + 0.1 * H };
  const P = (k) => { const A0 = (1 - k) ** 3, B = 3 * k * (1 - k) ** 2, C = 3 * k * k * (1 - k), D = k ** 3; return { x: A0 * a.x + B * c1.x + C * c2.x + D * b.x, y: A0 * a.y + B * c1.y + C * c2.y + D * b.y }; };
  const p = ease.io(clamp01((t - V.grow[0]) / (V.grow[1] - V.grow[0])));
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (const [w, al] of [[9, 0.18], [4, 0.45], [1.6, 0.95]]) { g.strokeStyle = al > 0.9 ? '#D9CBFF' : hexA('#9B6BFF', al); g.lineWidth = w * S; g.beginPath(); for (let k = 0; k <= 60; k++) { const q = P(p * k / 60); if (k) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); } g.stroke(); }
  if (p < 1) { const h = P(p); glowAt(h.x, h.y, 26 * S, '#9B6BFF', 0.95); glowAt(h.x, h.y, 6 * S, '#FFFFFF', 0.9); }
  else { const k = ((t - V.grow[1]) * 0.45) % 1, h = P(k); glowAt(h.x, h.y, 14 * S, '#9B6BFF', 0.6 * Math.sin(k * Math.PI)); }
  g.restore(); }

// film v6 A5: the strokes under her pencil (pencil_lead, pencil_draw). opt.pencil.track = [[clip s, x, y], ...] the pencil tip in plate
// fractions (measured on the plate's frames); the gold line it leaves is drawn in code from the track's start to now, with fine hatch
// ticks across it every few samples (her shading), a glow at the tip. No track: nothing is drawn (the plate's own strokes, if any, stay).
function pencilStrokes(t, sc) { const o = sc.s.opt.pencil, K = o.track, cm = clipMap(sc.s), c = cm.c0 + (t - sc.s.t0) * cm.sp, im = sc.imgs[0]; if (!im || c < K[0][0]) return;
  const pts = []; for (let cc = K[0][0]; cc <= c + 1e-6; cc += 1 / 48) { const q = trackAt(K, cc); pts.push(plateToScreen(im, q[0], q[1])); }
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [w, col] of [[7, 'rgba(255,176,32,0.25)'], [2.6, 'rgba(255,194,58,0.95)']]) { g.strokeStyle = col; g.lineWidth = w * S; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke(); }
  g.strokeStyle = 'rgba(255,194,58,0.7)'; g.lineWidth = 1.4 * S;
  for (let i = 3; i < pts.length; i += 3) { const a = pts[i - 1], b = pts[i], dx = b.x - a.x, dy = b.y - a.y, l = Math.hypot(dx, dy) || 1, nx = -dy / l * 9 * S, ny = dx / l * 9 * S; g.beginPath(); g.moveTo(b.x - nx + dx * 0.4, b.y - ny + dy * 0.4); g.lineTo(b.x + nx - dx * 0.4, b.y + ny - dy * 0.4); g.stroke(); }
  const h = pts[pts.length - 1]; glowAt(h.x, h.y, 22 * S, '#FFC23A', 0.9); glowAt(h.x, h.y, 5 * S, '#FFFFFF', 0.9); g.restore(); }
// film v6 A7: a page-light flying from `from` to `to` (frame fractions) over the shot (or arriving at fraction `arrive`), a slight arc, a
// faint trail; then held, opening over `open` [u0, u1] (fractions of the shot)
function pageFly(t, s) { const o = s.opt.pageFly, u = seg(t, s.t0, s.t1), ar = o.arrive || 1, k = clamp01(u / ar), e = o.ease === 'out' ? ease.out(k) : ease.io(k);
  const P = (q) => ({ x: lerp(o.from[0], o.to[0], q) * W, y: lerp(o.from[1], o.to[1], q) * H - Math.sin(q * Math.PI) * (o.arc || 0) * H });
  g.save(); g.globalCompositeOperation = 'lighter'; if (k < 1) for (let j = 7; j >= 1; j--) { const q = P(Math.max(0, e - 0.03 * j)); glowAt(q.x, q.y, (8 + 3 * (7 - j)) * S, VIO_GLOW, 0.2 * (1 - j / 8)); } g.restore();
  const p = P(e), op = o.open ? seg(u, o.open[0], o.open[1]) : 0; pageLight(p.x, p.y + Math.sin(t * 3) * 3 * S * (k >= 1 ? 1 : 0), (o.h || 30) * S, 0.95, k < 1 ? 0.2 * Math.sin(k * 7) : 0, op); }
// film v6 A2, b26: the violet light leaves her hands after the rose one and goes furthest (out of frame); cubic path, eased, a trail
function vioMote(t, s) { const o = s.opt.vioMote, ta = s.t0 + o.at[0], tb = s.t0 + o.at[1]; if (t < ta) return;
  const P0 = { x: o.from[0] * W, y: o.from[1] * H }, [K1, K2] = o.ctrl.map(([x, y]) => ({ x: x * W, y: y * H })), P3 = { x: o.to[0] * W, y: o.to[1] * H };
  const P = (k) => { const a = (1 - k) ** 3, b = 3 * k * (1 - k) ** 2, c = 3 * k * k * (1 - k), d = k ** 3; return { x: a * P0.x + b * K1.x + c * K2.x + d * P3.x, y: a * P0.y + b * K1.y + c * K2.y + d * P3.y }; };
  const u = clamp01((t - ta) / (tb - ta)); if (u >= 1) return; const e = u * u * (2.2 - 1.2 * u), grow = clamp01((t - ta) / 0.2);
  g.save(); g.globalCompositeOperation = 'lighter'; for (let j = 8; j >= 1; j--) { const q = P(Math.max(0, e - 0.025 * j)); glowAt(q.x, q.y, (8 + 3 * (8 - j)) * S, '#9B6BFF', 0.22 * (1 - j / 9) * grow); }
  const q = P(e); glowAt(q.x, q.y, 34 * S * grow, '#9B6BFF', 0.95); glowAt(q.x, q.y, 8 * S * grow, '#FFFFFF', 0.95); g.restore(); }

// film v3, b26 (Jade: "maybe the words she sends out is the lyric"): the lane written behind the light carries the lyric line L.lyric
// itself, once, in the lyric's serif (cream, cap L.cap px at 1080p), laid on the lane so it ends L.endX (frame fraction) short of her
// hands. Words sung before the shot are sent out along the lane from her hands over the shot's first 8 frames (ahead of the light: "each
// one a light I sent ahead"); later words appear on their word times with the lyric's own 3-frame fade and rise. The lane itself is a rose hairline with a
// soft glow from the light to her hand, under the words. The separate lyric is not drawn on this shot (lyrics() skips L.lyric).
function lyricLane(t, sc, pts, from, len) {
  const L = sc.s.opt.lane, line = LYR.find((l) => String(l.id) === String(L.lyric)); if (!line) return;
  const f = capFont('serif', (L.cap || 46) * S); setFont(f);
  const words = line.words.map((w) => ({ ...w, wd: g.measureText(w.w).width })), sp = g.measureText(' ').width, tot = words.reduce((a, w) => a + w.wd, 0) + sp * (words.length - 1);
  const acc = [0]; for (let i = 1; i < pts.length; i++) acc.push(acc[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y));
  const at = (a) => { let i = 1; while (i < pts.length - 1 && acc[i] < a) i++; const p = pts[i - 1], q = pts[i], u = (a - acc[i - 1]) / ((acc[i] - acc[i - 1]) || 1); return { x: lerp(p.x, q.x, u), y: lerp(p.y, q.y, u), ang: Math.atan2(q.y - p.y, q.x - p.x) }; };
  let aEnd = len; if (L.endX !== undefined) { const X = L.endX * W; for (let i = 1; i < pts.length; i++) if (pts[i].x >= X) { aEnd = acc[i - 1] + (acc[i] - acc[i - 1]) * clamp01((X - pts[i - 1].x) / ((pts[i].x - pts[i - 1].x) || 1)); break; } }
  const a0 = aEnd - tot, col = L.color || MAIN, lift = (L.lift || 10) * S;
  // the lane: a hairline with a glow, from the light to the hand
  g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = hexA(col, 0.55); g.shadowColor = col; g.shadowBlur = 10 * S; g.lineWidth = 2.2 * S; g.lineCap = 'round';
  g.beginPath(); let first = true; for (let a = Math.max(0, from); a <= len; a += 6 * S) { const p = at(a); if (first) { g.moveTo(p.x, p.y); first = false; } else g.lineTo(p.x, p.y); } g.stroke(); g.restore();
  // the words, glyph by glyph along the lane (sitting just above it). Words sung before the shot are sent out ahead of the light over its
  // first L.wipe s (default 8 frames), from her hands outward; later words appear on their word times
  const wipe = L.wipe || 8 / FPS, rv = Math.min(from, aEnd - (aEnd - a0 + 60 * S) * ease.out(clamp01((t - sc.s.t0 + HF) / wipe)));
  setFont(f); let a = a0;
  words.forEach((w, wi) => {
    const sung = on(t, w.start), ff = fr(t, w.start), wa = sung ? clamp01((ff + 1) / 3) : 0, rise = (1 - clamp01((ff + 1) / 4)) * 8 * S;
    for (const ch of w.w) { const cw = g.measureText(ch).width, mid = a + cw / 2;
      if (wa > 0 && mid >= rv) { const p = at(mid), nx = Math.sin(p.ang), ny = -Math.cos(p.ang), passed = clamp01((mid - rv) / (60 * S));
        g.save(); g.translate(p.x + nx * (lift + rise), p.y + ny * (lift + rise)); g.rotate(p.ang); g.globalAlpha = wa * (w.start < sc.s.t0 ? passed : 1);
        textShadow(0.85, 12); g.fillStyle = CREAM; g.fillText(ch, -cw / 2, 0); noShadow(); g.restore(); }
      a += cw; }
    a += sp; });
}

// film v3, b105-106 (vio_wide): the violet lane is written only as far as she has got ("This branch may never find the way").
// opt.road = { track: [[clip s, lead foot x, foot y, road a, road b, rear foot x], ...] (plate fractions, tools/track_road.py; the plate's
// own violet road is y = a + b x), text, cap, color, fade }. mask(): ahead of her lead foot the plate's road is painted out (the ground
// is pure black there), fading into her foot over `fade`; lane(): behind her rear foot the road is written with the branch's commit
// message, the glyphs fixed on the ground (no scroll), so new text appears at its near end as she walks on; a faint pen point of
// violet light glows on the road just under her lead foot: the branch is being written as she goes, and nothing exists ahead.
function roadAt(sc, t) { const R = sc.s.opt.road, K = R.track, cm = clipMap(sc.s), c = cm.c0 + (t - sc.s.t0) * cm.sp; let i = 0;
  while (i < K.length - 2 && c > K[i + 1][0]) i++; const a = K[i], b = K[i + 1], u = clamp01((c - a[0]) / (b[0] - a[0])), q = a.map((v, k) => lerp(v, b[k], u));
  const im = sc.imgs[0], P = (x) => plateToScreen(im, x, q[3] + q[4] * x), left = K[K.length - 1][1] < K[0][1];
  return { lead: q[1], rear: q[5], P, left }; }
function roadMask(t, sc) { const R = sc.s.opt.road; if (!R.track) return; const r = roadAt(sc, t), fade = R.fade || 0.018, w = (R.mask || 0.026) * H;
  const far = r.left ? -0.05 : 1.05, sg = r.left ? 1 : -1, a = r.P(far), f0 = r.P(r.lead + sg * 0.004), b = r.P(r.lead + sg * (0.004 + fade));   // opaque to just under her toe, fading out under the shoe (nothing of the road shows ahead of her)
  g.save(); const gr = g.createLinearGradient(f0.x, f0.y, b.x, b.y); gr.addColorStop(0, 'rgba(0,0,0,1)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
  g.strokeStyle = gr; g.lineWidth = w; g.lineCap = 'butt'; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); g.restore(); }
function roadLane(t, sc) { const R = sc.s.opt.road; if (!R.track) return; const r = roadAt(sc, t), x0 = r.left ? -0.05 : 1.05, x1 = r.left ? 1.05 : -0.05;
  const p0 = r.P(Math.min(x0, x1)), p1 = r.P(Math.max(x0, x1)), len = Math.hypot(p1.x - p0.x, p1.y - p0.y), st = r.P(r.rear + (r.left ? 0.008 : -0.008));
  const at = Math.hypot(st.x - p0.x, st.y - p0.y);
  drawWrittenLane(g, [p0, p1], { text: laneText(R.text), color: R.color || MAIN, cap: (R.cap || 20) * S, scroll: 0, merge: 0, under: R.under === undefined ? 0.2 : R.under, ...(r.left ? { from: at } : { upto: at }) });
  const pen = r.P(r.lead), br = 0.75 + 0.25 * Math.sin(t * 9); g.save(); g.globalCompositeOperation = 'lighter'; glowAt(pen.x, pen.y, 22 * S, R.color || MAIN, 0.6 * br); glowAt(pen.x, pen.y, 6 * S, '#FFFFFF', 0.7 * br); g.restore(); void len; }

// b51-52: the fan of twelve afterimages (shots.js opt.fan): copies of her own cut-out (matte of the plate, same frame), each tinted in a
// life's lane colour, rotated about a pivot low on her body; the fan is open from the first frame (v4; v3 opened it over the first beat), then one folds into her every half beat
// from beat 1.5 (twelve folds by beat 7), each with a short flash of its colour on her outline. She is redrawn on top: her face stays clear.
let FANC = null;
function fan(t, sc) {
  const s = sc.s, F = s.opt.fan, im = sc.imgs[0], m = READY.get(sc.fan); if (!KITX) return;
  if (!FANC) { FANC = document.createElement('canvas'); FANC.width = W; FANC.height = H; }
  const fc = FANC.getContext('2d'), cr = cover(m.width, m.height, W, H, im.zoom || 1, im.fo[0], im.fo[1]);
  // film v4 (Jade: "start with all the shadow Jades already fanned out and being folded in"): fully open on the shot's first frame (the b51
  // downbeat), held through the first beat, then the folds as before; no outward motion (F.open: the beats it takes to open, 0 = none)
  const piv = plateToScreen(im, F.pivot[0], F.pivot[1]), b0 = Math.round(KITX.bpos(s.t0)), u = KITX.bpos(t) - b0, open = F.open ? ease.out(clamp01(u / F.open)) : 1;
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
// film v6 A1 (opt.vioTip {i, slot, hold, drift, to}): the violet light takes slot `slot` in the order (the others keep theirs, shifted),
// glows `hold` beats, then drifts (eased, a slight rise and sway, a short trail) to the pane's edge and out of frame over `drift` beats
function tips(t, sc) { const s = sc.s, b0 = Math.round(bposT(s.t0)), u = bposT(t) - b0, V = s.opt.vioTip;
  const order = s.opt.tips.map((_, i) => i); if (V) { order.splice(order.indexOf(V.i), 1); order.splice(V.slot, 0, V.i); }
  s.opt.tips.forEach(([x, y], i) => { const k = 1 + 0.5 * order.indexOf(i), f = u - k; if (f < 0) return; const p = plateToScreen(sc.imgs[0], x, y), col = LIVES[i].color, pop = Math.max(0, 1 - f / 0.5);
    if (V && i === V.i && f > V.hold) { const d = clamp01((f - V.hold) / V.drift), e = ease.in(d) * 0.55 + ease.io(d) * 0.45, to = { x: V.to[0] * W, y: V.to[1] * H };
      const P = (q) => ({ x: lerp(p.x, to.x, q), y: lerp(p.y, to.y, q) - Math.sin(q * Math.PI) * 0.05 * H + Math.sin(q * 9) * 4 * S });
      g.save(); g.globalCompositeOperation = 'lighter'; for (let j = 6; j >= 1; j--) { const q = P(Math.max(0, e - 0.03 * j)); glowAt(q.x, q.y, (10 + 3 * (6 - j)) * S, col, 0.18 * (1 - j / 7)); }
      const q = P(e); glowAt(q.x, q.y, 30 * S, col, 0.85); glowAt(q.x, q.y, 7 * S, '#FFFFFF', 0.8); g.restore(); return; }
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
// master: rows at 31 px (was 34) so the longest row, jade/phd-neuroscience's new message (97 mono chars), ends inside the frame
function gitlog(t, s) {
  g.fillStyle = '#07070C'; g.fillRect(0, 0, W, H);
  const o = s.opt, prev = [0, 1, 2, 3].slice(0, o.bar).reduce((a, k) => a + 3 * 2 ** (k + 1), 0), b0 = bposT(s.t0), u = Math.max(0, bposT(t) - b0);
  const n = 18 + prev + Math.floor(u * o.rate), fpx = 31 * S, lh = 50 * S, rows = Math.ceil(H / lh) + 1, cw = fpx * 0.6;
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
// film v2, b114-117: set type instead of handwriting (Jade: the wiggling cursive was goofy). opt.type = { lines, at [x, y] (frame
// fractions: left edge, top of the first line), px (font px at 1080p), lead (x px), beats [beat from the shot start per line], dur (beats
// to type a line), cloud (alpha of the dark cloud behind the block) }. Write shot: each line types on its beat (a character every
// dur/len, the first on the beat), a block cursor at the end of the newest line. Release shot (type.release {to [x, y], top, arrive bar,
// close beats}): the finished block is on screen from the cut, closes to one line of light over `close` beats, which then travels up
// and over to `to` (the sunrise), shrinking, with a trail, arriving on the downbeat of bar `arrive` with a flash.
// Mono, violet light: a violet glow under a pale violet core; integer pixel positions (steady, nothing wobbles).
const VIO_CORE = '#EEE6FF', VIO_GLOW = '#9B6BFF';
function typeBox(o) { const f = `600 ${o.px * S}px "JetBrains Mono"`; g.save(); g.font = f; const w = Math.max(...o.lines.map((l) => g.measureText(l).width)); g.restore();
  const lead = (o.lead || o.px * 1.45) * S, x = Math.round(o.at[0] * W), y = Math.round(o.at[1] * H); return { f, x, y, w, lead, cap: o.px * 0.73 * S, h: (o.lines.length - 1) * lead + o.px * 0.73 * S }; }
function vioText(txt, x, y, a, glow = 1) { g.save(); g.globalAlpha = a; g.shadowColor = VIO_GLOW; g.shadowBlur = 16 * S * glow; g.fillStyle = '#B79BFF'; g.fillText(txt, x, y); g.fillText(txt, x, y);
  g.shadowBlur = 0; g.fillStyle = VIO_CORE; g.fillText(txt, x, y); g.restore(); }
function typed(t, sc) {
  const s = sc.s, o = s.opt.type, B = typeBox(o), ub = bposT(t) - Math.round(bposT(s.t0)), R = o.release;
  const cloud = (a) => { if (a <= 0) return; const p = 46 * S; g.save(); g.filter = `blur(${Math.round(30 * S)}px)`; g.fillStyle = `rgba(5,6,26,${(o.cloud ?? 0.55) * a})`; g.fillRect(B.x - p, B.y - p, B.w + 2 * p, B.h + 2 * p); g.restore(); };
  g.save(); g.font = B.f; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  if (!R) {
    const shown = o.lines.map((l, k) => { const d = (o.dur || 0.6) / Math.max(1, l.length), f = ub - o.beats[k]; return f < 0 ? -1 : Math.min(l.length, Math.floor(f / d + 1e-6) + 1); });
    cloud(clamp01((ub - o.beats[0] + 0.55) / 0.4));
    g.font = B.f;
    // a mote of violet light leaves her pencil (o.from, frame fractions) half a beat before each line and lands where it starts typing
    if (o.from) { const P0 = { x: o.from[0] * W, y: o.from[1] * H };
      o.beats.forEach((b, k) => { const m = (ub - (b - 0.5)) / 0.5; if (m <= 0 || m > 1.15) return; const P2 = { x: B.x - 6 * S, y: B.y + B.cap / 2 + k * B.lead }, P1 = { x: (P0.x + P2.x) / 2, y: Math.min(P0.y, P2.y) - 0.12 * H };
        const Q = (v) => ({ x: (1 - v) * (1 - v) * P0.x + 2 * v * (1 - v) * P1.x + v * v * P2.x, y: (1 - v) * (1 - v) * P0.y + 2 * v * (1 - v) * P1.y + v * v * P2.y });
        g.save(); g.globalCompositeOperation = 'lighter';
        if (m <= 1) { const e = ease.io(m); for (let j = 6; j >= 0; j--) { const q = Q(Math.max(0, e - 0.045 * j)); glowAt(q.x, q.y, (6 + 14 * (1 - j / 6)) * S, VIO_GLOW, 0.95 * (1 - j / 7)); } const q0 = Q(e); glowAt(q0.x, q0.y, 5 * S, '#FFFFFF', 0.9); }
        else { const f = (m - 1) / 0.15; glowAt(P2.x, P2.y, (18 + 20 * f) * S, VIO_GLOW, 0.8 * (1 - f)); }
        g.restore(); }); }
    let cur = -1; shown.forEach((n, k) => { if (n < 0) return; cur = k; const y = B.y + B.cap + k * B.lead;
      // the newest characters flare as they land
      vioText(o.lines[k].slice(0, n), B.x, y, 1, n < o.lines[k].length ? 1.5 : 1); });
    if (cur >= 0) { const n = shown[cur], cx = B.x + Math.round(g.measureText(o.lines[cur].slice(0, n)).width) + 4 * S, y = B.y + B.cap + cur * B.lead;
      if (n < o.lines[cur].length || Math.floor(t * 2.5) % 2 === 0) { g.save(); g.shadowColor = VIO_GLOW; g.shadowBlur = 14 * S; g.fillStyle = 'rgba(222,208,255,0.9)'; g.fillRect(cx, y - B.cap, Math.round(o.px * 0.55 * S), Math.round(B.cap * 1.15)); g.restore(); } }
    g.restore(); return; }
  if (R.palm) { palmRelease(t, sc, B, cloud); g.restore(); return; }
  // release: close (lines converge on the block's middle and thin to one bright line), then the line of light leaves east
  const ta = T.bar(R.arrive), close = R.close || 1.25, kc = ease.io(clamp01(ub / close)), mid = B.y + B.h / 2;
  if (kc < 1) { cloud(1 - kc);
    o.lines.forEach((l, k) => { const y0 = B.y + B.cap + k * B.lead - B.cap / 2, y = lerp(y0, mid, kc); g.save(); g.translate(0, Math.round(y)); g.scale(1, Math.max(0.02, 1 - kc)); vioText(l, B.x, Math.round(B.cap / 2), 1 - 0.6 * kc); g.restore(); });
    if (kc > 0.3) { const a = clamp01((kc - 0.3) / 0.5); g.save(); g.globalCompositeOperation = 'lighter'; g.shadowColor = VIO_GLOW; g.shadowBlur = 24 * S; g.fillStyle = `rgba(230,220,255,${a})`; g.fillRect(B.x, Math.round(mid - 2 * S), B.w, Math.round(4 * S)); g.restore(); }
    g.restore(); return; }
  // the line of light travels a quadratic arc up and over to R.to, shrinking, arriving on the downbeat of bar R.arrive
  const t1 = T.beatT(Math.round(bposT(s.t0)) + close), u = clamp01((t - t1) / (ta - t1)), e = ease.io(u);
  // R.ctrl [[x, y], [x, y]] (frame fractions): a cubic path (e.g. up over the top of the frame and down to the sunrise clear of her);
  // else a quadratic up and over through R.top
  const c0 = { x: B.x + B.w / 2, y: mid }, c2 = { x: R.to[0] * W, y: R.to[1] * H }, c1 = { x: (c0.x + c2.x) / 2, y: R.top * H };
  const K = R.ctrl ? R.ctrl.map(([x, y]) => ({ x: x * W, y: y * H })) : null;
  const q = K ? (k) => { const a = (1 - k) ** 3, b = 3 * k * (1 - k) ** 2, c = 3 * k * k * (1 - k), d = k ** 3; return { x: a * c0.x + b * K[0].x + c * K[1].x + d * c2.x, y: a * c0.y + b * K[0].y + c * K[1].y + d * c2.y }; }
    : (k) => ({ x: (1 - k) * (1 - k) * c0.x + 2 * k * (1 - k) * c1.x + k * k * c2.x, y: (1 - k) * (1 - k) * c0.y + 2 * k * (1 - k) * c1.y + k * k * c2.y });
  g.restore();
  if (on(t, ta)) { const f = fr(t, ta); if (f <= 1) { g.fillStyle = `rgba(235,225,255,${f === 0 ? 0.8 : 0.4})`; g.fillRect(0, 0, W, H); }   // the hit
    g.save(); g.globalCompositeOperation = 'lighter'; glowAt(c2.x, c2.y, (30 + 60 * Math.max(0, 1 - f / 20)) * S, VIO_GLOW, 0.5 + 0.5 * Math.max(0, 1 - f / 20)); g.restore(); return; }
  const p = q(e), p2 = q(Math.min(1, e + 0.01)), ang = Math.atan2(p2.y - p.y, p2.x - p.x), len = B.w * (1 - 0.9 * e);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let j = 1; j <= 6; j++) { const pj = q(Math.max(0, e - 0.03 * j)); glowAt(pj.x, pj.y, (10 + 5 * (6 - j)) * S * (1 - 0.6 * e), VIO_GLOW, 0.22 * (1 - j / 7)); }
  g.translate(p.x, p.y); g.rotate(ang); g.shadowColor = VIO_GLOW; g.shadowBlur = 26 * S; g.fillStyle = 'rgba(232,222,255,0.95)'; g.fillRect(-len / 2, -2 * S, len, 4 * S); g.restore();
}

// film v3, b116-117 (vio_release2; Jade: "it would be cool if the violet light emerged from her hand"). type.release.palm mode:
//   gather [c0, dur, stagger] (clip s): as she shuts the notebook, each typed line flows down along a curve into it (R.book: the
//     notebook per clip time, plate fractions), shrinking, with a short trail; each lands with a small flare, the cloud goes with them;
//   then a faint violet glow breathes at the notebook while her hand leaves it;
//   emerge [c0, c1]: the light grows in her open palm (R.palm: the palm per clip time, measured on the plate's own frames) and rises
//     a little above it (R.hover, fraction of H) until lift (clip s); then it leaves: up over the top of the frame and down to the
//     sunrise (R.to, cubic through R.ctrl, frame fractions), accelerating, arriving on the downbeat of bar R.arrive with the flash and
//     horizon glow as before.
function trackAt(K, c) { let i = 0; while (i < K.length - 2 && c > K[i + 1][0]) i++; const a = K[i], b = K[i + 1], u = clamp01((c - a[0]) / (b[0] - a[0])); return [lerp(a[1], b[1], u), lerp(a[2], b[2], u)]; }
function palmRelease(t, sc, B, cloud) {
  const s = sc.s, o = s.opt.type, R = o.release, cm = clipMap(s), c = cm.c0 + (t - s.t0) * cm.sp, im = sc.imgs[0];
  const PT = (K, cc) => { const q = trackAt(K, cc); return plateToScreen(im, q[0], q[1]); };
  const [g0, gd, gs] = R.gather, nb = PT(R.book, c), n = o.lines.length, gEnd = g0 + (n - 1) * gs + gd;
  const ta = T.bar(R.arrive), tAt = (cc) => s.t0 + (cc - cm.c0) / cm.sp;
  // 1. the lines flow down into the notebook
  if (c < gEnd + 0.25) {
    cloud(1 - clamp01((c - g0) / (gEnd - g0)));
    g.save(); g.font = B.f; g.textBaseline = 'alphabetic';
    o.lines.forEach((l, k) => { const p = clamp01((c - g0 - k * gs) / gd), wl = g.measureText(l).width;
      const sx = B.x + wl / 2, sy = B.y + B.cap / 2 + k * B.lead, cx = lerp(sx, nb.x, 0.75), cy = sy - 0.02 * H;
      const Q = (e) => ({ x: (1 - e) * (1 - e) * sx + 2 * e * (1 - e) * cx + e * e * nb.x, y: (1 - e) * (1 - e) * sy + 2 * e * (1 - e) * cy + e * e * nb.y });
      if (p >= 1) { const f = (c - g0 - k * gs - gd) / 0.25; if (f < 1) { g.save(); g.globalCompositeOperation = 'lighter'; glowAt(nb.x, nb.y, (14 + 22 * (1 - f)) * S, VIO_GLOW, 0.8 * (1 - f)); g.restore(); } return; }
      const e = ease.in(p);
      if (p > 0) for (let j = 4; j >= 1; j--) { const ej = Math.max(0, e - 0.07 * j), q = Q(ej); g.save(); g.globalCompositeOperation = 'lighter'; glowAt(q.x, q.y, (8 + 10 * (1 - ej)) * S, VIO_GLOW, 0.35 * (1 - j / 5)); g.restore(); }
      const q = Q(e), sz = lerp(1, 0.05, e); g.save(); g.translate(Math.round(q.x), Math.round(q.y)); g.scale(sz, sz); vioText(l, -wl / 2, B.cap / 2, 1 - 0.3 * e, 1 + e); g.restore(); });
    g.restore(); }
  // 2. the glow in the shut notebook, breathing, handing over to her palm
  const [e0, e1] = R.emerge, lift = R.lift;
  if (c >= gEnd && c < e1) { const a = clamp01((c - gEnd) / 0.2) * (1 - clamp01((c - e0) / (e1 - e0))) * (0.75 + 0.25 * Math.sin(t * 7));
    g.save(); g.globalCompositeOperation = 'lighter'; glowAt(nb.x, nb.y, 26 * S, VIO_GLOW, 0.55 * a); g.restore(); }
  // 3. the light comes out of her palm, rises a little, then leaves east
  if (c < e0) return;
  const tl = tAt(lift), up = (R.hover || 0.04) * H;
  if (t < tl) { const a = ease.out(clamp01((c - e0) / (e1 - e0))), pa = PT(R.palm, c), h = up * ease.io(clamp01((c - e0) / (lift - e0)));
    const x = pa.x, y = pa.y - h, br = 0.9 + 0.1 * Math.sin(t * 11);
    g.save(); g.globalCompositeOperation = 'lighter';
    glowAt(pa.x, pa.y, 34 * S * a, VIO_GLOW, 0.35 * a);                    // the light on her palm
    glowAt(x, y, (14 + 46 * a) * S, VIO_GLOW, 0.75 * a * br); g.restore(); pageLight(x, y, 34 * a * S, 0.95 * a, 0); return; }   // film v6 A6: it grows in her palm as a page
  if (R.float) { floatUp(t, sc, R, PT, c, tl, ta, up); return; }
  const p0 = PT(R.palm, lift), c0 = { x: p0.x, y: p0.y - up }, c2 = { x: R.to[0] * W, y: R.to[1] * H }, K = R.ctrl.map(([x, y]) => ({ x: x * W, y: y * H }));
  const q = (k) => { const a = (1 - k) ** 3, b = 3 * k * (1 - k) ** 2, cc = 3 * k * k * (1 - k), d = k ** 3; return { x: a * c0.x + b * K[0].x + cc * K[1].x + d * c2.x, y: a * c0.y + b * K[0].y + cc * K[1].y + d * c2.y }; };
  if (on(t, ta)) { const f = fr(t, ta); if (f <= 1) { g.fillStyle = `rgba(235,225,255,${f === 0 ? 0.8 : 0.4})`; g.fillRect(0, 0, W, H); }   // the hit
    g.save(); g.globalCompositeOperation = 'lighter'; glowAt(c2.x, c2.y, (30 + 60 * Math.max(0, 1 - f / 20)) * S, VIO_GLOW, 0.5 + 0.5 * Math.max(0, 1 - f / 20)); g.restore(); return; }
  const u = clamp01((t - tl) / (ta - tl)), e = u * u * (1.6 - 0.6 * u);   // leaves gently, arrives fast (on the downbeat)
  g.save(); g.globalCompositeOperation = 'lighter';
  if (u < 0.25) { const pa = PT(R.palm, c); glowAt(pa.x, pa.y, 34 * S, VIO_GLOW, 0.35 * (1 - u / 0.25)); }   // the palm's after-glow
  for (let j = 10; j >= 1; j--) { const qj = q(Math.max(0, e - 0.022 * j)); glowAt(qj.x, qj.y, (8 + 3 * (10 - j)) * S * (1 - 0.4 * e), VIO_GLOW, 0.3 * (1 - j / 11)); }
  const p = q(e); glowAt(p.x, p.y, (44 - 14 * e) * S, VIO_GLOW, 0.9); glowAt(p.x, p.y, 10 * S, '#FFFFFF', 0.95); g.restore();
}

// film v4 item 3 (Jade: the light's speed is "very fast for the mood"): after its breath on the palm the light rises like a lantern let go:
// from rest it eases (R.float.ease s) into one steady speed (vx, vy: frame fractions per second), no acceleration after that, a slight sway
// (sway: amplitude W, period s), shrinking a little with distance (shrink); it stays in frame and is still rising at the cut. No white flash
// on the b117 downbeat: the light itself swells softly there (swell: [gain, s before, s after]).
const hump = (t, a, m, b) => (t <= a || t >= b ? 0 : t < m ? ease.io((t - a) / (m - a)) : 1 - ease.io((t - m) / (b - m)));
function floatUp(t, sc, R, PT, c, tl, ta, up) {
  const F = R.float, p0 = PT(R.palm, R.lift), x0 = p0.x, y0 = p0.y - up, e = F.ease || 0.5;
  const pos = (tau) => { tau = Math.max(0, tau); const d = tau < e ? (tau * tau) / (2 * e) : tau - e / 2;
    return { x: x0 + F.vx * W * d + F.sway[0] * W * Math.sin((2 * Math.PI * tau) / F.sway[1]) * clamp01(tau / 0.6), y: y0 + F.vy * H * d }; };
  const tau = t - tl, k = 1 - (F.shrink || 0) * clamp01(tau / (sc.s.t1 - tl)), sw = 1 + F.swell[0] * hump(t, ta - F.swell[1], ta, ta + F.swell[2]);
  const br = 0.92 + 0.08 * Math.sin(t * 5);
  g.save(); g.globalCompositeOperation = 'lighter';
  if (tau < 0.6) { const pa = PT(R.palm, c); glowAt(pa.x, pa.y, 34 * S, VIO_GLOW, 0.35 * (1 - tau / 0.6)); }   // the palm's after-glow
  for (let j = 5; j >= 1; j--) { const q = pos(tau - 0.06 * j); glowAt(q.x, q.y, 22 * k * S, VIO_GLOW, 0.07 * (1 - j / 6)); }   // a faint wake
  const p = pos(tau); glowAt(p.x, p.y, 60 * k * sw * S, VIO_GLOW, Math.min(1, 0.7 * br * (0.85 + 0.15 * sw)));
  g.restore(); pageLight(p.x, p.y, 34 * k * (0.9 + 0.1 * sw) * S, 0.95, 0.12 * Math.sin(tau * 1.7)); g.save();   // film v6 A6: the light that rises is the page
  g.restore();
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
  g.restore(); skyGlints(t, sc);
}
// the sky keeps twinkling: glints on the plate's brightest cells above the horizon, outside her
function skyGlints(t, sc) {
  const im = sc.imgs[0], gw = 240, gh = 135, step = Math.floor(t * 12 + 1e-6); if (!SETC) { SETC = document.createElement('canvas'); SETC.width = gw; SETC.height = gh; }
  const x = SETC.getContext('2d', { willReadFrequently: true }); g.save(); g.globalCompositeOperation = 'lighter';
  const pb = READY.get(im.url); x.clearRect(0, 0, gw, gh); x.drawImage(pb, 0, 0, gw, gh); const P = x.getImageData(0, 0, gw, gh).data;
  for (let j = 1; j < gh * 0.45; j++) for (let i = 1; i < gw - 1; i++) { const o = (j * gw + i) * 4; if (P[o] < 150) continue;
    const r0 = mulberry32(i * 3301 + j * 7919)(); if (r0 > 0.25) continue; const tw = Math.max(0, Math.sin(step * 0.7 + r0 * 60)); if (tw < 0.3) continue;
    const px = (i + 0.5) * W / gw, py = (j + 0.5) * H / gh, rr = (2 + 5 * tw) * S;
    g.strokeStyle = `rgba(240,236,255,${0.6 * tw})`; g.lineWidth = 1.2 * S; g.beginPath(); g.moveTo(px - rr * 1.6, py); g.lineTo(px + rr * 1.6, py); g.moveTo(px, py - rr * 1.6); g.lineTo(px, py + rr * 1.6); g.stroke(); glowAt(px, py, rr, '#EDE6FF', 0.5 * tw); }
  g.restore();
}

// film v3, b118-120 (vio_still; Jade: "it would be interesting to see if we can have her fully atomize here"): she atomizes completely.
// Data from tools/atomize.py (kit/vio_still/atom/, all in plate-frame-1 pixels): track.json (the clip dollies back: A_k maps frame-1
// coords to frame k), release.png (her release time tau per pixel: outline first, inward by depth with a ragged front, the pale-blue
// circle on her back last; a halo round her outline at tau 0), particles.json (her points every 3 px with tau and her own colour).
// Release u runs 0..1 from the shot start + lead to the shot end - tail (linear). Per frame:
//   - the clean plate (vio_empty when it lands: still.jpg, matching plate frame meta.frame, default 1; else the stand-in) is warped to
//     the frame (A_k inv(A_ref)) and shown through a mask that opens pixel by pixel as u passes each pixel's tau (soft, 0.06 wide), so no
//     part of her pops and no outline is left (the halo goes first);
//   - each of her points is born at its tau where the plate pixel fades, first as a square of her own colour (source-over, so it
//     replaces the pixel), then it shrinks to a point of light (white for light pixels, violet for violet/navy/dark ones), drifts out
//     from her centre and up (a little east), easing to rest; one in six stays as a star and twinkles to the end, the rest fade;
//   - the circle's points do not stay: they rise as one faint violet mote that drifts east and leaves the frame at the cut (b121, the
//     violet light streaking east, is where she went).
const ATOM = {};
async function loadAtom(o) { const d = o.dir; if (d in ATOM) return ATOM[d]; ATOM[d] = null;
  const tr = await json(`${d}/track.json`), pj = await json(`${d}/particles.json`); if (!tr || !pj) return null;
  const rr = await fetch(`${d}/release.png`).catch(() => null); if (!rr || !rr.ok) return null; const rel = await createImageBitmap(await rr.blob(), { premultiplyAlpha: 'none' });   // own bitmap (the LRU cache closes evicted ones)
  const ep = await findPlate(o.empty); const mf = ep && String(ep.meta.matches || '').match(/f_(\d+)/), emptyUrl = ep ? `${ep.dir}/still.jpg` : o.standin, ref = ep ? ep.meta.frame || (mf ? +mf[1] : 1) : 1;   // vio_empty meta: "matches": "vio_still f_0121"
  const cp = pj.pts.filter((p) => p[2] >= 0.82), cc = cp.length ? [cp.reduce((a, p) => a + p[0], 0) / cp.length, cp.reduce((a, p) => a + p[1], 0) / cp.length] : pj.centre;
  ATOM[d] = { tr, pts: pj.pts, centre: pj.centre, circle: cc, step: pj.step, rel, emptyUrl, ref, real: !!ep }; return ATOM[d]; }
const aff = (A, x, y) => [A[0] * x + A[1] * y + A[2], A[3] * x + A[4] * y + A[5]];
const affMul = (A, B) => [A[0] * B[0] + A[1] * B[3], A[0] * B[1] + A[1] * B[4], A[0] * B[2] + A[1] * B[5] + A[2], A[3] * B[0] + A[4] * B[3], A[3] * B[1] + A[4] * B[4], A[3] * B[2] + A[4] * B[5] + A[5]];
const affInv = (A) => { const det = A[0] * A[4] - A[1] * A[3], a = A[4] / det, b = -A[1] / det, d = -A[3] / det, e = A[0] / det; return [a, b, -(a * A[2] + b * A[5]), d, e, -(d * A[2] + e * A[5])]; };
let ATC = null, ATE = null;
function atomize(t, sc) {
  const s = sc.s, o = s.opt.atom, D = ATOM[o.dir], im = sc.imgs[0], pb = READY.get(im.url), eb = READY.get(D.emptyUrl); if (!pb || !eb) return;
  const k = +(im.url.match(/f_(\d{4})\.jpg$/) || [0, 1])[1], Ak = D.tr.A[String(k)] || D.tr.A['1'];
  const cr = cover(pb.width, pb.height, W, H, im.zoom || 1, im.fo[0], im.fo[1]), C = [W / cr.sw, 0, -cr.sx * W / cr.sw, 0, H / cr.sh, -cr.sy * H / cr.sh];
  const M = affMul(C, Ak);                                                   // frame-1 plate px -> screen
  const ta = s.t0 + (o.lead || 0.1), tb = s.t1 - (o.tail || 0.45), u = clamp01((t - ta) / (tb - ta)), tOf = (tau) => ta + tau * (tb - ta), wd = o.soft || 0.06;
  // 1. the mask: released fraction per pixel, at 1/4 resolution
  const mw = W / 4 | 0, mh = H / 4 | 0; if (!ATC) { ATC = document.createElement('canvas'); ATC.width = mw; ATC.height = mh; ATE = document.createElement('canvas'); ATE.width = W; ATE.height = H; }
  const mx = ATC.getContext('2d', { willReadFrequently: true }); mx.setTransform(1, 0, 0, 1, 0, 0); mx.clearRect(0, 0, mw, mh);
  mx.setTransform(M[0] / 4, M[3] / 4, M[1] / 4, M[4] / 4, M[2] / 4, M[5] / 4); mx.imageSmoothingEnabled = true; mx.drawImage(D.rel, 0, 0); mx.setTransform(1, 0, 0, 1, 0, 0);
  const id = mx.getImageData(0, 0, mw, mh), q = id.data;
  for (let i = 0; i < q.length; i += 4) { const a = q[i + 3]; if (!a) continue; const tau = Math.max(0, q[i] - 1) / 254;
    const r = clamp01((u - tau) / wd + 0.5), v = r * r * (3 - 2 * r); q[i] = q[i + 1] = q[i + 2] = 255; q[i + 3] = Math.round(a * v); }
  mx.putImageData(id, 0, 0);
  // 2. the clean plate through it
  const ex = ATE.getContext('2d'); ex.setTransform(1, 0, 0, 1, 0, 0); ex.globalCompositeOperation = 'source-over'; ex.clearRect(0, 0, W, H);
  const Ae = affMul(M, affInv(D.tr.A[String(D.ref)] || D.tr.A['1'])), sx = pb.width / eb.width;   // empty still px -> screen (stills at the plate's size, else scaled)
  ex.setTransform(Ae[0] * sx, Ae[3] * sx, Ae[1] * sx, Ae[4] * sx, Ae[2], Ae[5]); ex.imageSmoothingQuality = 'high'; ex.drawImage(eb, 0, 0); ex.setTransform(1, 0, 0, 1, 0, 0);
  ex.globalCompositeOperation = 'destination-in'; ex.imageSmoothingEnabled = true; ex.drawImage(ATC, 0, 0, W, H); g.drawImage(ATE, 0, 0);
  // 3. her points
  const sc1 = Math.hypot(M[0], M[3]), cell = D.step * sc1, [cx, cy] = D.centre, step12 = Math.floor(t * 12 + 1e-6);
  const young = [], light = [];
  for (const P of D.pts) { const [x0, y0, tau, r0, g0, b0, sd] = P, tb0 = tOf(tau); if (t < tb0 - 0.12) continue; const age = t - tb0;
    const circ = tau >= 0.82, lum = (0.3 * r0 + 0.59 * g0 + 0.11 * b0) / 255, vio = (b0 > g0 + 25 && r0 > g0) || lum < 0.35;
    // drift in plate-frame-1 px: out from her centre, up, a little east; eases to rest over 1.8 s
    let dx = x0 - cx, dy = y0 - cy; const l = Math.hypot(dx, dy) || 1; dx /= l; dy /= l;
    const rr = mulberry32(Math.floor(sd * 1e6)), star = sd < 0.1 && !circ, r1 = rr(), r2 = rr(), r3 = rr();
    // a star rises to a place in the sky (above y 0.08-0.5 of the frame-1 plate, always at least 60 px up); the others drift and fade
    const sky = Math.min(y0 - 60 - 120 * r1, (0.08 + 0.42 * r2) * D.tr.h), rise = star ? y0 - sky : circ ? 120 : 40 + 110 * r1;
    const dist = (circ ? 40 : 30 + 150 * r1) * ease.out(clamp01(age / 1.8)), up = rise * ease.out(clamp01(age / (circ ? 1.2 : star ? 2.6 : 2.2)));
    const wx = x0 + dx * dist * 0.6 + 0.25 * up + (r3 - 0.5) * 30 * clamp01(age), wy = y0 + dy * dist * 0.6 - up;
    const [X, Y] = aff(M, wx, wy);
    const born = clamp01((age + 0.12) / 0.24);                              // matches the mask's soft edge
    if (age < 0.45) young.push([X, Y, r0, g0, b0, born * (1 - clamp01(age / 0.45)), cell * lerp(1.1, 0.5, clamp01(age / 0.45))]);
    const glow = born * (star ? 1 : 1 - clamp01((age - 0.5) / (0.6 + 0.8 * rr()))); if (glow <= 0.01) continue;
    const tw = star && age > 1.2 ? 0.55 + 0.45 * Math.sin(step12 * (0.6 + rr()) + sd * 90) : 1;
    light.push([X, Y, vio ? (circ ? '#B9A6FF' : '#9B6BFF') : '#F1ECFF', glow * tw * (star ? 0.9 : 0.7) * (0.5 + 0.5 * Math.max(lum, vio ? 0.6 : 0)), (star ? 1.6 + 1.6 * rr() : 1.2 + 0.8 * rr()) * S, star && age > 1.2]);
  }
  g.save(); for (const [X, Y, r0, g0, b0, a, z] of young) { g.globalAlpha = a; g.fillStyle = `rgb(${r0},${g0},${b0})`; g.fillRect(X - z / 2, Y - z / 2, z, z); } g.restore();
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const [X, Y, col, a, z, big] of light) { g.globalAlpha = Math.min(1, a); g.fillStyle = col; g.fillRect(X - z / 2, Y - z / 2, z, z); if (big && a > 0.6) { g.globalAlpha = 1; glowAt(X, Y, z * 3, col, 0.35 * a); } }
  g.globalAlpha = 1;
  // the circle's light leaves east: once the circle has gone (u past 1), one violet mote from where its points rose drifts east and out
  const te = tOf(0.98) + 0.25, me = clamp01((t - te) / (s.t1 - te));
  if (t >= te) { const [fx, fy] = aff(M, D.circle[0] + 30, D.circle[1] - 115);   // where the circle's points rose to
    const e = me * me, X = lerp(fx, W * 1.06, e), Y = lerp(fy, fy - 0.12 * H, Math.sin(me * Math.PI / 2));
    for (let j = 6; j >= 1; j--) { const e2 = Math.max(0, me - 0.03 * j) ** 2; glowAt(lerp(fx, W * 1.06, e2), lerp(fy, fy - 0.12 * H, Math.sin(Math.max(0, me - 0.03 * j) * Math.PI / 2)), (6 + 2 * (6 - j)) * S, '#9B6BFF', 0.25 * (1 - j / 7)); }
    glowAt(X, Y, 26 * S, '#9B6BFF', 0.85); glowAt(X, Y, 6 * S, '#FFFFFF', 0.9); }
  g.restore();
  skyGlints(t, sc);
}

// c2_lookup: the arriving violet light (the plate's comet is cropped away): from `from` toward `to` (frame fractions), arriving on the shot's
// end (the b123 downbeat), a point with a short trail
function comet(t, sc) { const o = sc.s.opt.comet, u = seg(t, sc.s.t0, sc.s.t1), e = ease.in(u);
  const P = (k) => ({ x: lerp(o.from[0], o.to[0], k) * W, y: lerp(o.from[1], o.to[1], k) * H - Math.sin(k * Math.PI) * 0.04 * H });
  g.save(); g.globalCompositeOperation = 'lighter'; for (let j = 8; j >= 1; j--) { const p = P(Math.max(0, e - 0.025 * j)); glowAt(p.x, p.y, (6 + 14 * (1 - j / 8) + 18 * e) * S, '#9B6BFF', (1 - j / 9) * 0.6); } g.restore();
  const p = P(e); pageLight(p.x, p.y, (20 + 22 * e) * S, 0.95, -0.3 + 0.3 * e); }   // film v6 A7: the page-light arriving
// film v6 A6-A8: the page-light. One small notebook page made of violet light: a soft violet halo, a pale page (portrait, w = 0.74 h) with
// four ruled lines and a margin rule, at (x, y), height h px, rotation rot; open 0..1 parts it into two facing pages (a book opening), the
// light between them brightening. Used for the light that leaves her palm (b116-117), the crossing (b121-123), the landing in main's hands
// (b128), the night road and the window (the end).
function pageLight(x, y, h, a, rot = 0, open = 0) { if (h <= 0.5 || a <= 0) return; const w = 0.74 * h;
  g.save(); g.globalCompositeOperation = 'lighter'; glowAt(x, y, h * (1.9 + 1.2 * open), VIO_GLOW, 0.55 * a); g.restore();
  g.save(); g.translate(x, y); g.rotate(rot); g.globalAlpha = a; g.shadowColor = VIO_GLOW; g.shadowBlur = h * 0.6;
  const page = (cx, sx) => { g.save(); g.translate(cx, 0); g.scale(sx, 1); g.fillStyle = 'rgba(240,234,255,0.92)'; g.fillRect(-w / 2, -h / 2, w, h); g.shadowBlur = 0;
    g.strokeStyle = 'rgba(155,107,255,0.85)'; g.lineWidth = Math.max(1, h * 0.035); g.beginPath();
    for (let k = 1; k <= 4; k++) { const yy = -h / 2 + h * (0.2 + 0.17 * k); g.moveTo(-w / 2 + w * 0.12, yy); g.lineTo(w / 2 - w * 0.1, yy); }
    g.moveTo(-w / 2 + w * 0.22, -h / 2 + h * 0.08); g.lineTo(-w / 2 + w * 0.22, h / 2 - h * 0.06); g.stroke(); g.restore(); };
  if (open <= 0) page(0, 1); else { const e = ease.io(clamp01(open)); page(-w / 2 * e, 1 - 0.15 * e); page(w / 2 * e, -(1 - 0.15 * e));
    g.globalCompositeOperation = 'lighter'; g.shadowBlur = 0; g.globalAlpha = 1; glowAt(0, 0, h * (0.4 + 0.9 * e), '#FFFFFF', 0.7 * a * e); }
  g.restore(); }

// b54-55 (film v2): the twelve worlds as small lit windows on the night world's horizon, and a commit node locking on under each one.
// The v7 roads cannot be tracked through the paper pass, so the windows sit on a FIXED HORIZON BAND: the horizon row measured on the
// raw v7 frames (o.horizon [[song s, y], ...], linear between), windows at o.xs (frame fractions, life order), bottom on the horizon,
// each playing its life plate (cropped on her, plate meta focus) from clip 0.6 s. Each waits dark and lights when its commit node
// locks on (o.locks[k] beats from the shot start): a ring closes onto the horizon under the window over the quarter beat before, a
// lane-colour flash, the window flares on, then a steady node and a short light stem window->node. A dim reflection under each window (the ground is water).
function horizonAt(o, t) { const K = o.horizon; let i = 0; while (i < K.length - 2 && t > K[i + 1][0]) i++; const a = K[i], b = K[i + 1]; return lerp(a[1], b[1], clamp01((t - a[0]) / (b[0] - a[0]))); }
function windowUrls(s, t) { const o = s.opt.windows; return o.lives.map((id) => { const p = PLATE[id]; if (!p) return null;
  const c = 0.6 + (t - s.t0) * 0.8, k = Math.min(p.meta.n - 1, Math.round(c * p.meta.fps)); return { url: plateUrl(p, k), life: id, fo: p.meta.focus || [0.5, 0.4] }; }).filter(Boolean); }
function windows(t, sc) {
  const s = sc.s, o = s.opt.windows, hy = horizonAt(o, t) * H, ub = bposT(t) - Math.round(bposT(s.t0)), wh = o.h * H, ww = wh * 16 / 9;
  sc.wins.forEach((im, k) => { const b = READY.get(im.url); if (!b) return; const L = byId[im.life], cx = o.xs[k] * W, x = cx - ww / 2, y = hy - wh - 3 * S;
    // every window waits dark (a faint shape on the horizon) and lights on its own lock: the continent lights up life by life on the beats
    const lk = o.locks[k], dl = ub - lk, locked = dl >= 0, flare = locked && dl < 0.6 ? 1 - dl / 0.6 : 0;
    const a = (locked ? 1 : 0.16) * (0.94 + 0.06 * Math.sin(t * 3 + k));
    const cr = cover(b.width, b.height, ww, wh, o.zoom || 1.6, im.fo[0], im.fo[1]);
    g.save(); g.globalAlpha = a; g.shadowColor = L.color; g.shadowBlur = (14 + 30 * flare) * S; g.fillStyle = L.color; g.fillRect(x - 2 * S, y - 2 * S, ww + 4 * S, wh + 4 * S); g.shadowBlur = 0;
    g.drawImage(b, cr.sx, cr.sy, cr.sw, cr.sh, x, y, ww, wh);
    if (flare > 0) { g.globalCompositeOperation = 'lighter'; g.fillStyle = hexA(L.color, 0.5 * flare); g.fillRect(x, y, ww, wh); g.globalCompositeOperation = 'source-over'; }
    // reflection on the water: flipped, squashed, dim, broken into a few horizontal strips that drift
    g.globalAlpha = a * 0.22; for (let j = 0; j < 4; j++) { const sy = cr.sy + cr.sh * (1 - (j + 1) / 4), dy = hy + 4 * S + j * wh * 0.16, dx = Math.sin(t * 2.2 + j * 1.7 + k) * 3 * S;
      g.save(); g.translate(0, dy + wh * 0.16); g.scale(1, -1); g.drawImage(b, cr.sx, sy, cr.sw, cr.sh / 4, x + dx, 0, ww, wh * 0.16); g.restore(); }
    g.restore();
    // the commit node: a ring closing in over the quarter beat before the lock, a flash on it, then a steady node with a light stem
    const ny = hy + 1.5 * S, pre = clamp01((ub - (lk - 0.25)) / 0.25);
    if (pre > 0 && !locked) { g.save(); g.strokeStyle = hexA(L.color, 0.4 + 0.6 * pre); g.lineWidth = 3 * S; g.beginPath(); g.arc(cx, ny, lerp(46, 10, ease.in(pre)) * S, 0, 6.2832); g.stroke(); g.restore(); }
    if (locked) { g.save(); g.globalCompositeOperation = 'lighter'; if (flare > 0) glowAt(cx, ny, (20 + 50 * flare) * S, L.color, flare);
      g.strokeStyle = hexA(L.color, 0.55); g.lineWidth = 2 * S; g.beginPath(); g.moveTo(cx, y + wh + 2 * S); g.lineTo(cx, ny - 8 * S); g.stroke(); g.restore();
      g.save(); g.fillStyle = '#05061A'; g.strokeStyle = L.color; g.lineWidth = 3.5 * S; g.beginPath(); g.arc(cx, ny, 8 * S, 0, 6.2832); g.fill(); g.stroke();
      g.fillStyle = L.color; g.beginPath(); g.arc(cx, ny, 3.5 * S, 0, 6.2832); g.fill(); g.restore(); }
  });
}

// ---------------------------------------------------------------- film v6 A5: the pencil-hatch wipe
// opt.hatch = { frames, seed, pen, angle }: over the shot's first `frames` frames the picture (whatever the source drew) is revealed through
// broad diagonal hatch strokes laid one after another across the frame (a sweep with jitter, each stroke growing from one end), on black
// paper; each growing stroke has a fine gold edge, and with `pen` a gold-white pencil point glows at the head of the newest stroke. After
// the wipe the picture is untouched. Deterministic per seed (a pure function of song time).
let HC = null, HM = null;
const HATCHS = new Map();
function hatchStrokes(seed, ang) { const k = seed + ':' + ang; if (HATCHS.has(k)) return HATCHS.get(k);
  const r = mulberry32(7000 + seed * 131), d = [Math.cos(ang), Math.sin(ang)], nrm = [-d[1], d[0]], span = Math.abs(W * nrm[0]) + Math.abs(H * nrm[1]), sp = 17 * S, n = Math.ceil(span / sp) + 2, L = Math.hypot(W, H) * 1.05;
  const out = []; for (let i = 0; i < n; i++) { const o = (i - n / 2) * sp + (r() - 0.5) * 8 * S, c = { x: W / 2 + nrm[0] * o, y: H / 2 + nrm[1] * o };
    const j = (r() - 0.5) * 0.08, dj = [Math.cos(ang + j), Math.sin(ang + j)], fl = r() < 0.5 ? -1 : 1;   // a hand's hatching: each stroke a little off the angle
    const a = { x: c.x - dj[0] * L / 2 * fl, y: c.y - dj[1] * L / 2 * fl }, b = { x: c.x + dj[0] * L / 2 * fl, y: c.y + dj[1] * L / 2 * fl };
    const sweep = clamp01(i / (n - 1)), start = 0.62 * sweep + 0.12 * r(); out.push({ a, b, start, w: (24 + 14 * r()) * S }); }
  HATCHS.set(k, out); return out; }
function hatchIn(t, s) {
  const o = s.opt.hatch, n = o.frames || 6, f = fr(t, s.t0); if (f >= n || f < 0) return;
  const p = (f + 1) / (n + 0.6), st = hatchStrokes(o.seed || 0, o.angle !== undefined ? o.angle : -1.05);
  if (!HC) { HC = document.createElement('canvas'); HC.width = W; HC.height = H; HM = document.createElement('canvas'); HM.width = W; HM.height = H; }
  const hc = HC.getContext('2d'); hc.globalCompositeOperation = 'source-over'; hc.clearRect(0, 0, W, H); hc.drawImage(canvas, 0, 0);
  const hm = HM.getContext('2d'); hm.clearRect(0, 0, W, H); hm.lineCap = 'round'; hm.strokeStyle = '#fff';
  const grow = (q) => clamp01((p - q.start) / 0.26), at = (q, u) => ({ x: lerp(q.a.x, q.b.x, u), y: lerp(q.a.y, q.b.y, u) });
  for (const q of st) { const u = ease.out(grow(q)); if (u <= 0) continue; const e = at(q, u); hm.lineWidth = q.w; hm.beginPath(); hm.moveTo(q.a.x, q.a.y); hm.lineTo(e.x, e.y); hm.stroke(); }
  hc.globalCompositeOperation = 'destination-in'; hc.drawImage(HM, 0, 0);
  g.fillStyle = '#0B0A0C'; g.fillRect(0, 0, W, H); g.drawImage(HC, 0, 0);
  // gold edges on the strokes still growing, and the pen point
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; let head = null, hs = -1;
  for (const q of st) { const gq = grow(q); if (gq <= 0 || gq >= 1) continue; const u = ease.out(gq), e = at(q, u), nx = -(q.b.y - q.a.y), ny = q.b.x - q.a.x, nl = Math.hypot(nx, ny) || 1, ox = nx / nl * q.w / 2, oy = ny / nl * q.w / 2;
    g.strokeStyle = `rgba(255,194,58,${0.75 * (1 - gq)})`; g.lineWidth = 2.2 * S;
    for (const sg of [-1, 1]) { g.beginPath(); g.moveTo(q.a.x + sg * ox, q.a.y + sg * oy); g.lineTo(e.x + sg * ox, e.y + sg * oy); g.stroke(); }
    if (q.start > hs && e.x > -50 && e.x < W + 50 && e.y > -50 && e.y < H + 50) { hs = q.start; head = e; } }
  if (o.pen && head) { glowAt(head.x, head.y, 30 * S, '#FFC23A', 0.95); glowAt(head.x, head.y, 7 * S, '#FFFFFF', 0.95); }
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
    drawImgs(sc.imgs); if (s.opt.road && LANES) roadMask(t, sc); if (sc.cross) crossing(sc); if (sc.fan && READY.get(sc.fan)) fan(t, sc);
    if (st && STRANDS) strands(t, sc);
    if (rot) g.restore();
    if (s.opt.tips) tips(t, sc);
    if (s.opt.caption) caption(t, sc);
    if (s.opt.hand) hand(t, sc);
    if (s.opt.type) typed(t, sc);
    if (s.opt.forks && OUTRO) OUTRO.forks(t, s, sc.imgs[0]);
    if (s.opt.comet) comet(t, sc);
    if (s.opt.vioMote) vioMote(t, s);
    if (s.opt.pageFly) pageFly(t, s);
    if (s.opt.arrive) arrive(t, s);
    if (s.opt.pencil && s.opt.pencil.track) pencilStrokes(t, sc);
    if (s.opt.atom && ATOM[s.opt.atom.dir]) atomize(t, sc);
    else if (s.opt.settle && sc.settle) settle(t, sc);
  }
  else if (sc.eff === 'code') { try { if (s.opt.code === 'gitlog') gitlog(t, s); else if (s.opt.code === 'tiles') tiles(t, sc); else if (s.opt.code === 'mapfold') MAPF.draw(s, t); else OUTRO.draw(s, t, sc); } catch (e) { console.log('ERROR code ' + e.stack); } }
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
      g.save(); paperPass(g, b, rect, { paper: sec.paper || 'black', ...(sec.stroke ? { stroke: sec.stroke } : {}), ink: [...(sec.ink || INKS), ...(extraInk || [])], seed: 1000 + (s.opt && s.opt.seedPrev ? s.i - 1 : s.i), t, ...lk }); g.restore(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over'; }
    else g.drawImage(b, 0, 0, W, H);
    if (sc.wins) windows(t, sc);
    if (s.opt && s.opt.egg && LANES) egg(t, sc);
    if (s.opt && s.opt.vlane) vlane(t, s.opt.vlane);
    if (s.opt && s.opt.pageFly) pageFly(t, s);
    if (sc.tail) drawImgs(sc.tail);
  } else if (sc.eff === 'kit') KITX.draw(s, t);
  else card(t, s);
  if (s.opt && s.opt.hatch && (sc.eff === 'plate' || sc.eff === 'v7')) hatchIn(t, s);
  if (s.opt && s.opt.white && sc.eff === 'plate') { const f = fr(t, s.t0); if (f <= 1) { g.fillStyle = `rgba(255,250,240,${f === 0 ? 0.85 : 0.4})`; g.fillRect(0, 0, W, H); } }   // 2-frame white flash (impact, snare)
  grain(t); vignette();
  if (sc.eff === 'plate' && LANES && s.opt && s.opt.lane && !(sc.cross && sc.cross.u >= 1)) lane(t, sc);
  if (sc.eff === 'plate' && LANES && s.opt && s.opt.road) roadLane(t, sc);
  overlays(t, sc);
  lyrics(t, sc.eff, s);
  if (s.opt && s.opt.carType && sc.eff !== 'card') carType(t, s);
}
// film v6 A8: the car's two lines (shots.js CAR_TYPE): lyric serif at verse size, cream with a soft shadow, each line WHOLE (no word by
// word), wrapped inside its box [x0, x1] (frame fractions) around y (the block's centre), on screen over at [a, b] s from the shot start
// with 0.3 s fades. No punctuation is added.
function carType(t, s) { const f = capFont('serif', SZ.verse * S), lead = SZ.verse * S * 1.5;
  for (const L of s.opt.carType.lines) { const ta = s.t0 + L.at[0], tb = s.t0 + L.at[1]; if (t < ta - HF || t > tb) continue;
    const a = Math.min(clamp01((t - ta + HF) / 0.3), clamp01((tb - t) / 0.3)); if (a <= 0) continue;
    const rows = wrap(L.text, f, (L.box[1] - L.box[0]) * W); setFont(f); const y0 = L.y * H - ((rows.length - 1) * lead) / 2 + SZ.verse * S / 2;
    g.save(); g.globalAlpha = a; textShadow(0.85, 14); g.fillStyle = CREAM;
    rows.forEach((r, i) => { const w = g.measureText(r).width, x = L.align === 'center' ? (L.box[0] + L.box[1]) / 2 * W - w / 2 : L.align === 'right' ? L.box[1] * W - w : L.box[0] * W; g.fillText(r, x, y0 + i * lead); });
    noShadow(); g.restore(); } }
// film v6 A8: the window: the road's page-light (OUTRO.roadPage at the moment the road ended) glides into the frost light at the child's
// palm (opt.arrive.to, frame fractions, measured on root_light) over dur s, shrinking from a page to a point of light, and is gone into
// the plate's own light
function arrive(t, s) { const o = s.opt.arrive, u = clamp01((t - s.t0) / o.dur); if (u >= 1 || !OUTRO || !OUTRO.roadPage) return;
  const P0 = OUTRO.roadPage(s.t0 - T.beat(156, 1)), e = ease.io(u), x = lerp(P0.x, o.to[0] * W, e), y = lerp(P0.y, o.to[1] * H, e) - Math.sin(u * Math.PI) * 0.05 * H;
  pageLight(x, y, lerp(P0.h, 8 * S, e), 1 - ease.in(u), 0.15 * (1 - u));
  g.save(); g.globalCompositeOperation = 'lighter'; glowAt(x, y, lerp(20, 40, e) * S, VIO_GLOW, 0.6 * Math.sin(u * Math.PI)); g.restore(); }
let LOCK = Promise.resolve();
function render(t) { const p = LOCK.then(() => render1(t)); LOCK = p.catch(() => {}); return p; }
async function render1(t) {
  const s = shotAt(t);
  if (s.kind === 'proof' && !ALLCARDS) { await PROOF.render(t); const sc = { t, s, eff: 'proof' }; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; noShadow(); if (HUD) hud(t, sc); return sc; }
  const sc = scene(t); READY.clear();
  await Promise.all([...sc.imgs, ...(sc.flash || []), ...(sc.cross ? sc.cross.life : []), ...(sc.fan ? [{ url: sc.fan }] : []), ...(sc.settle ? [{ url: sc.settle }] : []), ...(s.opt && s.opt.atom && ATOM[s.opt.atom.dir] ? [{ url: ATOM[s.opt.atom.dir].emptyUrl }] : []), ...(sc.win || []), ...(sc.wins || []), ...(sc.tail || [])].map(async (im) => READY.set(im.url, await bitmap(im.url))));
  draw(t, sc);
  const z = s.opt && s.opt.toFrame0; if (z) { const t0 = T.duration - z; if (t > t0) {   // the end: cross to the film's own frame 0 (the last frame equals it)
    if (!F0) { const c = document.createElement('canvas'); c.width = W; c.height = H; const keep = g.getImageData(0, 0, W, H); const s0 = scene(0); READY.clear();
      await Promise.all([...s0.imgs].map(async (im) => READY.set(im.url, await bitmap(im.url)))); draw(0, s0); c.getContext('2d').drawImage(canvas, 0, 0); F0 = c; g.putImageData(keep, 0, 0); }
    const a = clamp01((t - t0) / (z - 1 / FPS)); g.save(); g.globalAlpha = a; g.drawImage(F0, 0, 0); g.restore(); } }
  if (HUD) hud(t, sc); return sc;
}
let F0 = null;

// ---------------------------------------------------------------- boot and harness interface
async function boot() {
  await Promise.all(FONTS.map(async ([name, u, desc]) => { const f = new FontFace(name, `url("${encodeURI(u)}")`, desc); await f.load(); document.fonts.add(f); }));
  await document.fonts.ready;
  for (const [face, wt] of [['mono', 600], ['mono', 500], ['serif'], ['slab'], ['sans', 500]]) { setFont(face === 'mono' || face === 'sans' ? FACE[face](100, wt) : FACE[face](100)); CAP[face + (wt || '')] = g.measureText('H').actualBoundingBoxAscent / 100; }
  measureMono(g);
  T = await loadTiming(TIMING);
  SH = resolveShots(T);
  for (const s of SH) { if (s.kind === 'plate') await findPlate(s.src); if (s.opt && s.opt.strands && s.opt.strands.window) await findPlate(s.opt.strands.window); if (s.kind === 'code' && s.opt.lives) for (const id of s.opt.lives) await findPlate('det_' + id); if (s.opt && s.opt.flash) await findPlate(s.opt.flash.id); if (s.opt && s.opt.cross) await findPlate(s.opt.cross.life); if (s.opt && s.opt.base) { await findPlate(s.opt.base); await findPlate(s.opt.top); } if (s.opt && s.opt.windows) for (const id of s.opt.windows.lives) await findPlate(id); if (s.opt && s.opt.code === 'mapfold') { for (const id of s.opt.lives) await findPlate(id); await findPlate(s.opt.her); } }
  // film v2: a shot whose opt.next = { id, opt } switches to plate `id` (with `opt` merged over its own) when that plate has landed
  // next.kind: the shot's kind changes too (an orchestra v7 shot becomes a plate); next.flag 'orch': not with ?orch=v7
  // film v3: next.id (and PLATE_ALIAS / PROOF_A ids) may be a list, newest first: the first plate that exists wins (wushu_v3, wushu_v2)
  // ... or next itself a list of { id, opt, kind } (per-take timings): the first whose plate exists wins
  for (const s of SH) if (s.opt && s.opt.next && Array.isArray(s.opt.next)) { for (const nx of s.opt.next) if (await firstPlate(nx.id)) { s.opt = { ...s.opt, next: nx }; break; } if (Array.isArray(s.opt.next)) s.opt = { ...s.opt, next: null }; }
  for (const s of SH) if (s.opt && s.opt.next && !(s.opt.next.flag === 'orch' && ORCH_V7)) { const id = await firstPlate(s.opt.next.id); if (!id) continue; s.src = id; if (s.opt.next.kind) s.kind = s.opt.next.kind; s.opt = { ...s.opt, ...(s.opt.next.opt || {}) }; s.swapped = true; }
  for (const s of SH) if (s.opt && s.opt.tail && !ORCH_V7) await findPlate(s.opt.tail.id);
  // film v2: plates replaced by id everywhere the film uses them (shots.js PLATE_ALIAS), when the new plate exists
  for (const [k, a] of Object.entries(PLATE_ALIAS || {})) { const p = await findPlate(await firstPlate(a.id)); if (p) PLATE[k] = { ...p, id: k, meta: { ...p.meta, focus: a.focus || p.meta.focus } }; }
  const vm = await json(`${V7DIR}/meta.json`);
  if (vm && vm.n) { V7 = { fps: vm.fps || 30, n: vm.n, t0: vm.t0 || 0, first: vm.first !== undefined ? vm.first : Math.round((vm.t0 || 0) * (vm.fps || 30)), w: vm.w, h: vm.h };
    if (!(await exists(v7Url(V7.first)))) { console.log(`v7: ${v7Url(V7.first)} not found; v7 shots fall back to cards`); V7 = null; } }
  for (const s of SH) if (s.opt && s.opt.v7dir && !(s.opt.v7dir in V7S)) V7S[s.opt.v7dir] = await loadV7(s.opt.v7dir);
  try { ({ paperPass } = await import('./paper.js')); } catch (e) { console.log('paper.js not loaded (' + String(e).slice(0, 80) + '); v7 shots are raw'); }
  try { ({ glyphPass } = await import('./glyph.js')); } catch (e) { console.log('glyph.js not loaded'); }
  { const KJ = await json('/fable/take2/kit.json'); if (KJ) KITX = makeKit({ g, W, H, S, T, KJ, READY, drawWrittenLane, laneString, glyphPass, byId, MAIN, clamp01, lerp, ease }); }
  // take-two changes inside the proof range (all off with proofbug=1): the black-paper hero (hero_paper, nearest frame; hero=old for the
  // first one), written lanes on the ten lives (prooflanes=0 off), bar 38 panel afterimages (trail=0 off)
  // film v3: hero_paper_v2 (she sings "Merge me back to main" as she runs) replaces hero_paper when it lands, song-locked to its meta t0_song
  const heroV2 = !PROOFBUG && Q.get('hero') !== 'old' && HERO_NEXT && (await findPlate(HERO_NEXT.id));
  const heroNew = heroV2 || (!PROOFBUG && Q.get('hero') !== 'old' && (await findPlate('hero_paper')));
  // film v2: a life's A shot in bars 28-32 from a new plate (shots.js PROOF_A): clip0 puts its `land` moment on beat `landBeat` of the shot
  const dirs = heroNew ? { hero: heroNew.dir } : {}, aPlates = {}; const turnOv = {};
  // film v3: a life plate swapped everywhere, the proof's grid and bar-37 turn included (shots.js LIFE_SWAP; band_v2): the proof reads it
  // through dirs[id], the film through PLATE[id]; side/tone in lives.js are overridden from the wiring row when given
  if (!PROOFBUG) for (const [k, a] of Object.entries(LIFE_SWAP || {})) { const p = await findPlate(await firstPlate(a.id)); if (!p) continue;   // a.id may be a list, newest first (master: home_v3, home_v2)
    dirs[k] = p.dir; PLATE[k] = { ...p, id: k, meta: { ...p.meta, focus: a.focus || p.meta.focus } }; if (a.side) byId[k].side = a.side; if (a.tone) byId[k].tone = a.tone; if (a.turn != null) turnOv[k] = a.turn; }
  if (!PROOFBUG) for (const [k, a0] of Object.entries(PROOF_A || {})) { let a = a0; if (Array.isArray(a0)) { a = null; for (const x of a0) if (await findPlate(x.id)) { a = x; break; } if (!a) continue; }
    const p = await findPlate(await firstPlate(a.id)), s = SH.find((q) => q.kind === 'proof' && q.src === 'A:' + k); if (!p || !s) continue;
    const tb = T.beatT(Math.round(bposT(s.t0)) + a.landBeat); aPlates[k] = { key: k + '_A', clip0: a.land - (tb - s.t0), side: a.side }; dirs[k + '_A'] = p.dir; }
  // film v6: the tile that stays (shots.js PROOF_STAY): its own plate in the proof when it lands (dirs; focus via the meta copy below)
  const stay = {}; if (!PROOFBUG) for (const [k, a] of Object.entries(PROOF_STAY || {})) { stay[k] = true; const p = await findPlate(await firstPlate(a.id)); if (p) { dirs[k] = p.dir; if (a.focus) p.meta.focus = a.focus; } }
  PROOF = await makeProof(g, { W, H, FPS, T, plates: PROOF_PLATES, twos: false, fixStrip: !PROOFBUG, stay,
    dirs, aPlates, heroBlend: !heroNew, turn: turnOv,
    // hero_paper has her in the centre: crop so she sits right of centre, the slab stacks one word per row on the left (rule 5: clear of
    // her face and hands), and the written lane passes behind her legs
    hero: heroNew ? { zoom: 1.25, fx: 0, fy: 0.05, rows: [[0], [1], [2], [3], [4]], gap: [0.5, 0.77], ...(heroV2 ? { ...(HERO_NEXT.opt || {}), c0: heroV2.meta.t0_song !== undefined ? T.bar(41) - heroV2.meta.t0_song + lagOf({ lag: HERO_NEXT.lag, lagQ: 'laghero' }) : 0 } : {}) } : null, writtenLanes: !PROOFBUG && Q.get('prooflanes') !== '0' ? { drawWrittenLane, laneString } : null,
    trail: !PROOFBUG && Q.get('trail') !== '0' });
  // the proof range must be exactly the proof shots of the list
  const pr = SH.filter((s) => s.kind === 'proof'); if (Math.abs(pr[0].t0 - PROOF.t0) > 0.002 || Math.abs(pr[pr.length - 1].t1 - PROOF.tEnd) > 0.002) throw new Error('proof range does not match the shot list');
  LYR = buildLyrics(); buildGrain(); STRANDS = FLOAT || null;
  OUTRO = makeOutro({ g, W, H, S, T, READY, LIVES, byId, MAIN, hashOf, drawWrittenLane, laneString, clamp01, lerp, ease, plateToScreen, cover, bposT, glowAt, hexA, json, PLATE, pageLight });
  await OUTRO.load(SH.filter((s) => s.kind === 'code'));
  MAPF = makeMapfold({ g, W, H, S, READY, PLATE, byId, clamp01, lerp, ease, cover, bposT, hexA, hashOf });
  for (const s of SH) if (s.opt && s.opt.atom) await loadAtom(s.opt.atom);
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
