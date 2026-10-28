// v6 layer factories for engine/src/scenes/text.js: footage slots (Jade's shot IDs), labels, lyric lines and hooks. Every one of them only
// writes characters into a TextGrid, so the text rules (textlook.js) hold for her footage exactly as for the stand-ins.
import { bigType, cover, hash, RAMP } from '../textlook.js';
import { openSlot } from './seq.js';

const val = (v, ...a) => (typeof v === 'function' ? v(...a) : v);
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
export const LABELS = new URLSearchParams(location.search).get('labels') !== '0';   // ?labels=0 hides the animatic's slot labels

// A footage slot. id = shot ID (A1 … H2, W for the girl at the frost window). o:
//   t0, t1     the slot's song window (stand-ins without a sync point play from t0, slowed to fit, never looped)
//   clip(t)    clip-time override (s); default: footage / synced stand-ins c = t - s0
//   lane       palette lane; copies: [{ dt, lane, x, y, s, flipX }] (each a fn of t or a number): ONE take, offset in time and tinted
//   zoom, cx, cy (cover framing), gain, gamma, thresh, fill, text (letters for the highlights), density, hold, fade, on
//   desc       what Jade does (the card text when no source is on hand)
export function slot(id, o = {}) {
  const S = { id, src: null };
  const layer = {
    density: o.density ?? .5, hold: o.hold ?? 2, on: o.on, fade: o.fade,
    async setup() { if (!S.src) S.src = await openSlot(id); },
    async draw(g, k) {
      const src = S.src, t = k.tq, box = o.box ? val(o.box, k.t) : null;
      const bx = box ? [box[0] * g.W, box[1] * g.H, box[2] * g.W, box[3] * g.H] : [0, 0, g.W, g.H];
      if (!src.seq) return box ? drawCardBox(g, id, o, bx) : drawCard(g, id, o, k);
      const seq = src.seq, c0 = clock(src, o, t);
      const copies = o.copies ? val(o.copies, t) : [{ dt: 0, lane: o.lane ?? 'orange' }];
      const zoom = val(o.zoom ?? 1, t), place = (fr) => { const r = cover(fr.width, fr.height, bx[2], bx[3], zoom, o.cx ?? .5, o.cy ?? .5); return [r[0] + bx[0], r[1] + bx[1], r[2], r[3]]; };
      for (const cp of copies) {
        const fr = await seq.at(c0 - val(cp.dt ?? 0, t)), r = place(fr), s = val(cp.s ?? 1, t), mx = bx[0] + bx[2] / 2, my = bx[1] + bx[3] / 2;
        const rect = [mx + (r[0] - mx) * s + val(cp.x ?? 0, t) * g.W, my + (r[1] - my) * s + val(cp.y ?? 0, t) * g.H, r[2] * s, r[3] * s];
        g.shape((gg) => {
          gg.save(); if (box) { gg.beginPath(); gg.rect(bx[0], bx[1], bx[2], bx[3]); gg.clip(); }
          if (cp.flipX) { gg.translate(rect[0] * 2 + rect[2], 0); gg.scale(-1, 1); }
          const cr = cp.crop ?? o.crop;   // [x0, x1]: only this horizontal band of the source (a centred figure out of a wide stand-in)
          if (cr) gg.drawImage(fr, cr[0] * fr.width, 0, (cr[1] - cr[0]) * fr.width, fr.height, rect[0] + cr[0] * rect[2], rect[1], (cr[1] - cr[0]) * rect[2], rect[3]);
          else gg.drawImage(fr, rect[0], rect[1], rect[2], rect[3]);
          gg.restore();
        }, { lane: cp.lane ?? o.lane ?? 'orange', gain: val(o.gain ?? 1.15, k.t) * val(cp.gain ?? 1, t), gamma: o.gamma ?? 1, thresh: o.thresh ?? .09,
          fill: val(o.fill ?? 1, k.t), seed: 7 + (cp.seed ?? 0), df: k.df, boil: o.boil ?? .15, text: o.text ?? null, hi: o.hi ?? .82,
          levels: o.levels ?? null, key: src.kind === 'standin' ? o.key ?? 'diff' : o.footKey ?? 'luma' });   // generated stand-ins have lit backgrounds: keyed by difference from the row's background
      }
      if (o.scatter) g.scatter(val(o.scatter, k.t), 5);
      // the switch: raw(t, c, r, grid) -> 0..1 per cell; the raw frame is the take's own, unscaled in colour, placed like the text
      if (o.raw) { const fr = await seq.at(c0); if (g.rawMask((c, r) => o.raw(k.t, c, r, g))) return { raw: { src: fr, rect: place(fr) } }; }
    },
  };
  layer.source = S;
  return layer;
}
// clip time for a slot: an explicit clip(t); else footage and synced stand-ins run on song time (t - s0) when that lands inside the take
// during the slot; otherwise the take starts on t0 and is slowed (never sped up) so its last frame lands on t1
function clock(src, o, t) {
  if (o.clip) return o.clip(t);
  const dur = src.seq.dur, t0 = o.t0 ?? 0, t1 = o.t1 ?? t0 + dur;
  if (src.s0 != null && (src.kind === 'footage' || (t0 - src.s0 > -.5 && t1 - src.s0 < dur + .5))) return t - src.s0;
  return (t - t0) * Math.min(1, dur / Math.max(1e-3, t1 - t0)) + (o.c0 ?? 0);
}
// the labelled card for a slot with nothing on hand: a dotted frame, the shot ID in big type, the action in small text
function drawCard(g, id, o, k) {
  const ln = o.lane ?? 'white', b = .55;
  const c0 = 2, r0 = 1, c1 = g.cols - 3, r1 = g.rows - 2;
  for (let c = c0; c <= c1; c++) { if (c % 2 === 0) { g.put(c, r0, '·', ln, b * .7); g.put(c, r1, '·', ln, b * .7); } }
  for (let r = r0; r <= r1; r++) { g.put(c0, r, '·', ln, b * .7); g.put(c1, r, '·', ln, b * .7); }
  bigType(g, id, { size: g.H * .2, y: g.H * .42, lane: ln, gain: .8, df: k.df, fill: .9 });
  const lines = wrap(o.desc || '', Math.max(10, g.cols - 10));
  lines.slice(0, 3).forEach((s, i) => g.text(g.cols / 2, Math.round(g.rows * .7) + i, s, ln, .8, { align: 'center' }));
}
function drawCardBox(g, id, o, bx) {
  const ln = o.lane ?? 'white', c0 = g.col(bx[0]) + 1, r0 = g.row(bx[1]) + 1, c1 = g.col(bx[0] + bx[2]) - 1, r1 = g.row(bx[1] + bx[3]) - 1;
  for (let c = c0; c <= c1; c += 2) { g.put(c, r0, '·', ln, .45); g.put(c, r1, '·', ln, .45); }
  for (let r = r0; r <= r1; r++) { g.put(c0, r, '·', ln, .45); g.put(c1, r, '·', ln, .45); }
  const cc = Math.round((c0 + c1) / 2), rc = Math.round((r0 + r1) / 2);
  g.text(cc, rc - 1, id, ln, 1, { align: 'center' });
  if (o.boxText) g.text(cc, rc + 1, o.boxText.slice(0, c1 - c0 - 2), ln, .7, { align: 'center' });
}
export function wrap(s, w) { const out = []; let cur = ''; for (const word of s.split(/\s+/)) { if (cur && (cur + ' ' + word).length > w) { out.push(cur); cur = word; } else cur = cur ? cur + ' ' + word : word; } if (cur) out.push(cur); return out; }

// the slot's label (animatic only; ?labels=0 hides it): "A1 · stand-in ch1_main_t61 · close-up, sing to lens" in small dim white text
export function label(slotLayer, o = {}) {
  return {
    density: .62, hold: 4, knock: true, on: o.on, fade: () => (LABELS ? 1 : 0),
    draw(g) {
      const s = slotLayer.source.src; if (!s) return;
      const what = s.kind === 'footage' ? `FOOTAGE ${s.take}` : s.kind === 'standin' ? `stand-in ${s.take}` : 'no footage yet';
      const txt = `[${slotLayer.source.id}] ${what}${o.desc ? ' · ' + o.desc : ''}`;
      g.text(2, o.top ? 1 : g.rows - 2, txt.slice(0, g.cols - 4), s.kind === 'footage' ? 'mint' : 'white', .5);
    },
  };
}
// a slot plus its label
export const slotL = (id, o = {}) => { const s = slot(id, o); return [s, label(s, { desc: o.short ?? o.desc, on: o.on, top: o.labelTop })]; };

// a sung line, small: the words type on at their sung starts (fixed small text, a readable density); words = [{ w, start, end }]
export function lyric(words, o = {}) {
  return {
    density: o.density ?? .6, hold: 1, knock: true, on: o.on, fade: o.fade,
    draw(g, k) {
      const t = k.t, s = words.map((w) => w.w).join(' '), row = Math.round(g.rows * (o.y ?? .86));
      if (t > (o.out ?? Infinity) + .3) return;
      let n = 0; for (const w of words) if (t >= w.start - .05) n += (n ? 1 : 0) + w.w.length; else break;
      const dim = o.out != null ? 1 - clamp((t - o.out) / .3) : 1;
      g.text(Math.round(g.cols * (o.x ?? .5)), row, o.upper ? s.toUpperCase() : s, o.lane ?? 'white', (o.b ?? .9) * dim, { align: o.align ?? 'center', n });
    },
  };
}
// a hook: big type made of its own letters, each word slams in on its sung start (only on the hooks)
export function hook(words, o = {}) {
  return {
    density: o.density ?? .72, hold: 1, on: o.on, fade: o.fade,
    draw(g, k) {
      const t = k.t; if (t > (o.out ?? Infinity) + .25) return;
      const shown = words.filter((w) => t >= w.start - .04); if (!shown.length) return;
      const lines = o.lines || [words.map((w) => w.w)];
      const size = (o.size ?? 170) * g.W / 1920, y0 = (o.y ?? .5) * g.H - (lines.length - 1) * size * .5;
      let wi = 0;
      lines.forEach((ln, li) => {
        const n = ln.filter((_, j) => words[wi + j] && t >= words[wi + j].start - .04).length;
        if (n) {
          const last = words[wi + n - 1], kick = Math.exp(-Math.max(0, t - last.start) / .12);
          bigType(g, ln.slice(0, n).join(' ').toUpperCase(), { y: y0 + li * size * 1.0, size, lane: o.lane ?? 'orange', gain: 1, df: k.df, seed: 3 + li,
            scale: 1 + .06 * kick, x: (o.x ?? .5) * g.W });
        }
        wi += ln.length;
      });
    },
  };
}
// a black frame of stars: '.' and '·' (sparse; the night)
export function stars(o = {}) {
  return {
    density: o.density ?? .45, hold: o.hold ?? 3, on: o.on, fade: o.fade,
    draw(g, k) {
      for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) {
        const h = hash(c, r, 99); if (h > (o.amount ?? .012)) continue;
        const tw = .35 + .4 * hash(c, r, k.df); g.put(c, r, h < .003 ? '+' : h < .006 ? '·' : '.', o.lane ?? 'white', tw * (o.b ?? .7));
      }
    },
  };
}
export { RAMP };
