// Written lanes (PLAN "The look" item 3, section 5 item 7). A lane is a line of set text in its colour: JetBrains Mono, the life's
// commit messages. Far off (small type) it reads as a thin bright line; up close the words are readable; as the merge parameter goes
// 0 -> 1 the text goes sparse -> dense (more rows) -> solid colour. Works on any polyline: straight lanes, perspective lanes (type size
// varying along the path) and curves (the bar 38 merge S-curves). Canvas 2D, synchronous, deterministic.
//
//   import { drawWrittenLane, laneString, measureMono } from './lanes.js';
//   measureMono(g)  once, after the fonts are loaded (cap height and advance per px of font size)
//   drawWrittenLane(g, pts, {
//     text,            the string to repeat along the lane (laneString(msgs) joins commit messages with ' · ')
//     color,           lane colour '#RRGGBB'
//     merge = 0,       0 sparse (one row, long gaps), 0.35 one dense row, 0.7 three dense rows, 1 a solid band in the lane colour
//     cap = 22,        cap height in px, or a function cap(u) of the arc fraction u in 0..1 (perspective: small far, large near)
//     scroll = 0,      text offset along the lane, in characters (scroll = t * speed: text runs along the lane)
//     upto,            draw only up to this arc length in px (a lane that is still being written); default the whole path
//     from = 0,        draw only from this arc length on (a lane written from its far end, e.g. node -> junction on a reversed path)
//     alpha = 1, under = 0.35 (dark soft band under the text, for legibility over plates; 0 = none)
//   })
// The thin line: a hairline core (lighter lane colour) is always drawn along the path; it is all you see where the type is under
// about 6 px cap, and fades to a fine rule under the text where the type is readable.
const SEP = '  ·  ';
export function laneString(msgs, upper = false) { const s = msgs.join(SEP) + SEP; return upper ? s.toUpperCase() : s; }

let CAPR = 0.73, ADVR = 0.6;   // cap height and advance per px of font size (measured by measureMono)
export function measureMono(g) {
  g.save(); g.font = '600 100px "JetBrains Mono"'; CAPR = g.measureText('H').actualBoundingBoxAscent / 100; ADVR = g.measureText('MMMMMMMMMM').width / 1000; g.restore();
  return { capRatio: CAPR, advRatio: ADVR };
}

const clamp01 = (x) => Math.min(1, Math.max(0, x));
const sstep = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
const hexRGB = (h) => { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
const mixc = (a, b, u) => a.map((v, i) => Math.round(v + (b[i] - v) * u));

// arc-length table of a polyline
function arc(pts) { const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i].x - pts[i - 1].x, pts[i].y - pts[i - 1].y)); return L; }
// point, unit tangent at arc length s
function at(pts, L, s, hint) {
  let i = hint.i; const n = pts.length;
  if (s <= 0) i = 0; else { while (i < n - 2 && L[i + 1] < s) i++; while (i > 0 && L[i] > s) i--; }
  hint.i = i; const a = pts[i], b = pts[Math.min(n - 1, i + 1)], l = (L[i + 1] - L[i]) || 1, u = (s - L[i]) / l;
  const tx = (b.x - a.x) / l, ty = (b.y - a.y) / l; return { x: a.x + (b.x - a.x) * u, y: a.y + (b.y - a.y) * u, tx, ty };
}

export function drawWrittenLane(g, pts, o) {
  if (pts.length < 2) return;
  const L = arc(pts), len = Math.min(L[L.length - 1], o.upto === undefined ? 1e9 : o.upto); if (len <= 0) return;
  const total = L[L.length - 1], s0 = Math.max(0, o.from || 0); if (s0 >= len) return;
  const m = clamp01(o.merge || 0), col = hexRGB(o.color), light = mixc(col, [255, 255, 255], 0.55), dark = [5, 6, 26];
  const capAt = typeof o.cap === 'function' ? (s) => o.cap(s / total) : (() => { const c = o.cap || 22; return () => c; })();
  const alpha = o.alpha === undefined ? 1 : o.alpha, under = o.under === undefined ? 0.35 : o.under;
  // density: gap between messages shrinks (sparse -> dense), rows grow 1 -> 3, then the band fills
  const gapScale = 1 - sstep(0, 0.35, m);                    // 1 = each separator widened by many spaces
  const rowsF = 1 + 2 * sstep(0.35, 0.7, m);                 // 1..3 (fractional: the outer rows fade in)
  const fill = sstep(0.7, 1, m);                             // band fill 0..1
  const text = o.text || '';
  // the sparse pattern: the text with each separator widened
  const pat = gapScale > 0.01 ? text.split(SEP).filter(Boolean).join(SEP.replace('·', ' '.repeat(1 + Math.round(18 * gapScale)) + '·' + ' '.repeat(1 + Math.round(18 * gapScale)))) + SEP : text;
  const N = pat.length;
  g.save(); g.globalAlpha = alpha;
  // sample the path once (every ~3 px) for the band, the under-band and the hairline
  const samp = []; { const h = { i: 0 }; const step = 3; for (let s = s0; s <= len; s += step) { const p = at(pts, L, s, h); samp.push({ ...p, c: capAt(s) }); } const p = at(pts, L, len, h); samp.push({ ...p, c: capAt(len) }); }
  const halfW = (c, rows) => c * (0.5 + 0.62 * (rows - 1) + 0.35);       // half-width of the written band at cap c
  const band = (wf, style) => { g.fillStyle = style; g.beginPath();
    samp.forEach((p, i) => { const w = wf(p.c); const x = p.x - p.ty * w, y = p.y + p.tx * w; if (i === 0) g.moveTo(x, y); else g.lineTo(x, y); });
    for (let i = samp.length - 1; i >= 0; i--) { const p = samp[i], w = wf(p.c); g.lineTo(p.x + p.ty * w, p.y - p.tx * w); } g.closePath(); g.fill(); };
  const vis = (c) => sstep(5, 11, c);                         // how readable the type is at cap c (0 = a line)
  if (under > 0) band((c) => halfW(c, rowsF) * 1.25 * vis(c) + 1, rgba(dark, under));
  if (fill > 0) band((c) => Math.max(1.2, halfW(c, 3) * vis(c) + 1.5 * (1 - vis(c))), rgba(col, fill));
  // hairline: bright where the type is too small to read, a fine rule under readable type
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (let i = 1; i < samp.length; i++) { const a = samp[i - 1], b = samp[i], v = vis(b.c), w = Math.max(1, (1 - v) * Math.max(1.5, b.c * 0.35) + v * 1.2);
    g.strokeStyle = rgba(v > 0.5 ? col : light, (1 - 0.55 * v) * (1 - fill)); g.lineWidth = w; g.beginPath(); g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke(); }
  // glyphs, row by row; each row starts at a different place in the text so stacked rows do not repeat in step
  // rows at fixed offsets: the main row on the path, then one above (fades in from merge 0.35) and one below (from about 0.52)
  const txtCol = mixc(col, dark, 0.85 * fill), txtA = 1 - 0.7 * fill;
  g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  const ROWS = [[0, 1, 0], [-1.24, clamp01(rowsF - 1) * 2, 1], [1.24, clamp01(rowsF - 2) * 2, 2]];
  for (const [off, ra, pv] of ROWS) {
    const a0 = Math.min(1, ra) * txtA; if (a0 <= 0.01) continue;
    let k = Math.floor((o.scroll || 0) + pv * 37), s = -((o.scroll || 0) % 1) * ADVR * capAt(0) / CAPR; const h = { i: 0 }; let curPx = -1;
    while (s < len) {
      const c = capAt(Math.max(0, s)), px = c / CAPR, adv = ADVR * px, v = vis(c);
      const ch = pat[((k % N) + N) % N]; k++;
      if (v > 0.02 && ch !== ' ' && s >= s0 - 0.5 && s + adv <= len + 0.5) {
        const p = at(pts, L, s + adv / 2, h), q = Math.round(px * 2) / 2;
        if (q !== curPx) { g.font = `600 ${q}px "JetBrains Mono"`; curPx = q; }
        const nx = -p.ty, ny = p.tx, d = off * c;
        g.setTransform(p.tx, p.ty, -p.ty, p.tx, p.x + nx * d, p.y + ny * d);
        g.globalAlpha = alpha * a0 * v; g.fillStyle = rgba(txtCol, 1); g.fillText(ch, -adv / 2, c / 2);
      }
      s += adv;
    }
    g.setTransform(1, 0, 0, 1, 0, 0);
  }
  g.restore();
}
