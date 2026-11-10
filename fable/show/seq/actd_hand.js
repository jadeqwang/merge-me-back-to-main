// ACT D helper: her handwriting. A single-stroke hand for the violet branch's last commit, `docs: start here`.
// Each glyph is a few pen strokes through hand-placed points (x right, y up, x-height = 1, baseline y = 0), in the order a hand makes them.
// write(text, seed) -> { pts: [{x, y, u, pen, k}], width }   x, y in x-heights (slanted, a little uneven, like a hand), u = ink order 0..1 inside its glyph,
//   g = glyph index, gx0/gx1 = the glyph's left/right edge (the hand is somewhere over the glyph while it is being written), pen = 1 at the first point of a stroke,
//   k = pressure 0..1 (thin on the way up and on joins, full on the way down).
// No engine imports: node can run this file to preview the hand (see fable/notes/actD.md).
const G = {
  d: { w: 1.22, s: [[[0.84, 0.72], [0.62, 0.98], [0.36, 0.96], [0.12, 0.66], [0.10, 0.30], [0.30, 0.03], [0.56, 0.08], [0.80, 0.42], [0.90, 1.05], [0.95, 2.02], [0.93, 1.30], [0.88, 0.40], [0.94, 0.08], [1.10, 0.02], [1.24, 0.16]]] },
  o: { w: 1.08, s: [[[0.56, 0.98], [0.30, 0.94], [0.10, 0.62], [0.12, 0.26], [0.34, 0.02], [0.62, 0.06], [0.84, 0.36], [0.84, 0.70], [0.62, 0.97], [0.50, 0.99], [0.74, 0.86], [1.02, 0.90]]] },
  c: { w: 0.98, s: [[[0.84, 0.74], [0.68, 0.96], [0.42, 0.98], [0.16, 0.72], [0.10, 0.36], [0.28, 0.06], [0.56, 0.02], [0.84, 0.20], [0.98, 0.38]]] },
  s: { w: 0.92, s: [[[0.78, 0.80], [0.60, 0.98], [0.34, 0.96], [0.20, 0.76], [0.38, 0.56], [0.64, 0.42], [0.74, 0.20], [0.56, 0.03], [0.28, 0.02], [0.08, 0.20]]] },
  ':': { w: 0.62, s: [[[0.26, 0.80], [0.33, 0.74], [0.27, 0.69]], [[0.24, 0.14], [0.31, 0.08], [0.25, 0.03]]] },
  ' ': { w: 0.56, s: [] },
  t: { w: 0.92, s: [[[0.40, 1.72], [0.40, 1.10], [0.40, 0.34], [0.48, 0.08], [0.68, 0.02], [0.90, 0.20]], [[0.06, 1.02], [0.44, 1.04], [0.84, 1.08]]] },
  a: { w: 1.20, s: [[[0.84, 0.74], [0.62, 0.98], [0.36, 0.96], [0.12, 0.66], [0.10, 0.30], [0.30, 0.03], [0.56, 0.08], [0.80, 0.42], [0.88, 1.00], [0.88, 0.62], [0.88, 0.32], [0.95, 0.08], [1.10, 0.02], [1.24, 0.16]]] },
  r: { w: 0.90, s: [[[0.16, 1.00], [0.17, 0.52], [0.18, 0.02], [0.18, 0.44], [0.24, 0.72], [0.42, 0.94], [0.64, 1.00], [0.84, 0.86]]] },
  h: { w: 1.16, s: [[[0.14, 2.02], [0.15, 1.10], [0.17, 0.02], [0.18, 0.46], [0.30, 0.80], [0.52, 0.99], [0.74, 0.90], [0.82, 0.58], [0.82, 0.30], [0.90, 0.07], [1.04, 0.02], [1.18, 0.14]]] },
  e: { w: 1.04, s: [[[0.14, 0.46], [0.50, 0.52], [0.84, 0.66], [0.80, 0.90], [0.56, 1.00], [0.28, 0.90], [0.10, 0.56], [0.14, 0.22], [0.36, 0.03], [0.62, 0.03], [0.88, 0.22], [1.02, 0.40]]] },
};
const h1 = (n) => { const x = Math.sin(n * 127.1 + 11.7) * 43758.5453; return x - Math.floor(x); };
// Catmull-Rom through the points, sampled so that consecutive samples are at most `ds` apart
function smooth(P, ds) { const n = P.length, q = (i) => P[Math.min(n - 1, Math.max(0, i))], out = [];
  for (let i = 0; i < n - 1; i++) { const p0 = q(i - 1), p1 = q(i), p2 = q(i + 1), p3 = q(i + 2), L = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), m = Math.max(2, Math.ceil(L / ds * 1.15));
    for (let k = 0; k < m; k++) { const u = k / m, u2 = u * u, u3 = u2 * u; out.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3))); } }
  out.push([P[n - 1][0], P[n - 1][1]]); return out; }
export function write(text, o = {}) { const seed = o.seed ?? 7, ds = o.ds ?? 0.03, slant = o.slant ?? 0.2, track = o.track ?? 0.03; const pts = []; let x = 0, gi = 0;
  for (const ch of text) { const g = G[ch] || G[' ']; const r = (k) => h1(seed * 13.1 + gi * 7.3 + k) - 0.5;
    const sc = 1 + 0.07 * r(1), sy = 1 + 0.08 * r(2), dy = 0.05 * r(3), rot = 0.05 * r(4), sl = slant + 0.05 * r(5), x0 = x, w = g.w * sc;
    // ink length of the glyph incl. the pen's travel in the air between strokes (the air counts for time, not for ink)
    const S = g.s.map((s) => smooth(s, ds)); let len = 0, prev = null; const cum = [];
    for (const s of S) { for (let i = 0; i < s.length; i++) { const p = s[i]; if (prev) len += Math.hypot(p[0] - prev[0], p[1] - prev[1]) * (i === 0 ? 0.6 : 1); cum.push(len); prev = p; } }
    let c = 0;
    for (const s of S) for (let i = 0; i < s.length; i++) { const p = s[i], q = s[Math.min(s.length - 1, i + 1)], b = s[Math.max(0, i - 1)]; const vy = (q[1] - b[1]) / (Math.hypot(q[0] - b[0], q[1] - b[1]) || 1);
      let px = p[0] * sc, py = p[1] * sy; const cx = 0.5 * w, cy = 0.5; const rx = cx + (px - cx) * Math.cos(rot) - (py - cy) * Math.sin(rot), ry = cy + (px - cx) * Math.sin(rot) + (py - cy) * Math.cos(rot);
      pts.push({ x: x0 + rx + ry * sl, y: ry + dy, u: len > 0 ? cum[c] / len : 0, g: gi, gx0: x0, gx1: x0 + w, pen: i === 0 ? 1 : 0, k: Math.min(1, Math.max(0.35, 0.72 - 0.45 * vy)) }); c++; }
    x += w + track; gi++; }
  return { pts, width: x - track, glyphs: gi };
}
