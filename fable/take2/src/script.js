// MERGE take two: hand-written single-stroke script (verse 2, b114-117: "docs: start here" written in the air in violet light).
// Each letter is one pen path (hand-placed points in an em box: baseline y 0, x-height 1, ascender 1.9, y up), joined letter to letter
// as cursive; smoothed with Catmull-Rom. The text is a list of strokes (pen down .. pen up): the letters of a word run into one stroke;
// the colon's dots and the t's cross bars are separate strokes, drawn after their word as a hand does.
//   const P = scriptPaths('docs: start here', { x, y, size, slant })   -> { strokes: [[{x,y}..]..], len, box }
//   drawScript(g, P, { upto, color, width, glow, alpha })            -> draws the first `upto` px of ink (arc length over all strokes),
//                                                                       returns the pen point {x, y} (null when done)
const L = {
  d: { w: 0.86, p: [[0, 0.2], [0.3, 0.7], [0.55, 0.95], [0.3, 1.02], [0.08, 0.8], [0.05, 0.3], [0.22, 0.0], [0.48, 0.2], [0.56, 0.6], [0.6, 1.9], [0.56, 1.1], [0.55, 0.35], [0.66, 0.0], [0.86, 0.15]] },
  o: { w: 0.8, p: [[0, 0.15], [0.3, 0.75], [0.35, 0.98], [0.12, 0.9], [0.02, 0.45], [0.22, 0.0], [0.48, 0.3], [0.42, 0.95], [0.32, 0.88], [0.55, 0.82], [0.8, 0.85]] },
  c: { w: 0.62, p: [[0, 0.85], [0.42, 0.88], [0.38, 1.0], [0.12, 0.85], [0.04, 0.35], [0.24, 0.0], [0.62, 0.15]] },
  s: { w: 0.62, p: [[0, 0.1], [0.3, 0.8], [0.36, 1.02], [0.46, 0.55], [0.5, 0.2], [0.32, 0.0], [0.12, 0.08], [0.36, 0.06], [0.62, 0.18]] },
  t: { w: 0.72, p: [[0, 0.1], [0.28, 0.6], [0.38, 1.65], [0.32, 0.6], [0.33, 0.15], [0.52, 0.0], [0.72, 0.15]], bar: [[0.08, 1.05], [0.72, 1.12]] },
  a: { w: 0.85, p: [[0, 0.15], [0.32, 0.8], [0.5, 0.95], [0.26, 1.0], [0.04, 0.72], [0.06, 0.22], [0.26, 0.0], [0.52, 0.32], [0.6, 0.97], [0.56, 0.4], [0.62, 0.04], [0.85, 0.15]] },
  r: { w: 0.75, p: [[0, 0.1], [0.18, 0.75], [0.22, 1.02], [0.32, 0.82], [0.48, 0.95], [0.5, 0.6], [0.46, 0.12], [0.58, 0.0], [0.75, 0.15]] },
  h: { w: 0.88, p: [[0, 0.1], [0.28, 1.2], [0.32, 1.9], [0.14, 1.6], [0.14, 0.0], [0.2, 0.62], [0.44, 0.95], [0.6, 0.62], [0.6, 0.12], [0.7, 0.0], [0.88, 0.15]] },
  e: { w: 0.62, p: [[0, 0.2], [0.48, 0.58], [0.4, 0.96], [0.15, 0.82], [0.04, 0.35], [0.24, 0.0], [0.62, 0.15]] },
};
function catmull(P, n = 6) {
  if (P.length < 3) return P;
  const out = []; for (let i = 0; i < P.length - 1; i++) { const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
    for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t;
      out.push({ x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * t + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * t + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3) }); } }
  out.push(P[P.length - 1]); return out;
}
// a little irregularity, fixed per letter (a hand never repeats a letter exactly)
const jit = (i, k) => { const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453; return (v - Math.floor(v) - 0.5) * 0.05; };
export function scriptPaths(text, o) {
  const sz = o.size, sl = o.slant ?? 0.22, X = (x, y) => o.x + (x + sl * y) * sz, Y = (y) => o.y - y * sz;
  const strokes = []; let pen = 0, cur = null, later = [], li = 0;
  const flush = () => { if (cur && cur.length) strokes.push(catmull(cur)); cur = null; for (const s of later) strokes.push(s); later = []; };
  for (const ch of text) {
    li++;
    if (ch === ' ') { flush(); pen += 0.55; continue; }
    if (ch === ':') { flush(); for (const yy of [0.78, 0.12]) { const c = []; for (let k = 0; k <= 8; k++) { const a = (k / 8) * 6.283; c.push({ x: X(pen + 0.15 + 0.06 * Math.cos(a), yy + 0.06 * Math.sin(a)), y: Y(yy + 0.06 * Math.sin(a)) }); } strokes.push(c); } pen += 0.45; continue; }
    const G = L[ch]; if (!G) { pen += 0.6; continue; }
    const pts = G.p.map(([x, y], k) => ({ x: X(pen + x + jit(li, k), y + jit(li, k + 9)), y: Y(y + jit(li, k + 9)) }));
    if (cur) { cur.push(...pts.slice(1)); } else cur = pts;
    if (G.bar) later.push(G.bar.map(([x, y]) => ({ x: X(pen + x, y), y: Y(y) })));
    pen += G.w;
  }
  flush();
  let len = 0; const seg = strokes.map((s) => { let l = 0; for (let i = 1; i < s.length; i++) l += Math.hypot(s[i].x - s[i - 1].x, s[i].y - s[i - 1].y); len += l; return l; });
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const s of strokes) for (const p of s) { x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y); x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y); }
  return { strokes, seg, len, box: { x: x0, y: y0, w: x1 - x0, h: y1 - y0 } };
}
export function drawScript(g, P, o) {
  const upto = o.upto ?? P.len, col = o.color || '#9B6BFF', w = o.width || 4;
  g.save(); g.globalAlpha = o.alpha ?? 1; g.lineCap = 'round'; g.lineJoin = 'round';
  let left = upto, pen = null;
  const path = () => { g.beginPath(); let rem = upto; P.strokes.forEach((s, i) => { if (rem <= 0) return; g.moveTo(s[0].x, s[0].y); let acc = 0;
    for (let k = 1; k < s.length; k++) { const l = Math.hypot(s[k].x - s[k - 1].x, s[k].y - s[k - 1].y); if (acc + l > rem) { const u = (rem - acc) / l; g.lineTo(s[k - 1].x + (s[k].x - s[k - 1].x) * u, s[k - 1].y + (s[k].y - s[k - 1].y) * u); acc = rem; break; } acc += l; g.lineTo(s[k].x, s[k].y); }
    rem -= P.seg[i]; }); };
  path(); g.shadowColor = col; g.shadowBlur = (o.glow ?? 18); g.strokeStyle = col; g.lineWidth = w * 2.2; g.globalAlpha = (o.alpha ?? 1) * 0.55; g.stroke();
  g.shadowBlur = 0; g.globalAlpha = o.alpha ?? 1; g.strokeStyle = o.core || '#EDE4FF'; g.lineWidth = w * 0.8; g.stroke();
  // the pen point: where the ink ends
  for (let i = 0; i < P.strokes.length; i++) { if (left <= P.seg[i]) { const s = P.strokes[i]; let acc = 0; for (let k = 1; k < s.length; k++) { const l = Math.hypot(s[k].x - s[k - 1].x, s[k].y - s[k - 1].y); if (acc + l >= left) { const u = (left - acc) / (l || 1); pen = { x: s[k - 1].x + (s[k].x - s[k - 1].x) * u, y: s[k - 1].y + (s[k].y - s[k - 1].y) * u }; break; } acc += l; } break; } left -= P.seg[i]; }
  g.restore(); return upto >= P.len ? null : pen;
}
