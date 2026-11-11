// ANIME look-dev copy of ../figure/body.js (see fable/notes/anime_lookdev.md). Differences: an anime head (larger cranium, small chin,
// nose/lips pushed out of the loft; hairline evaluated analytically, the same maths in the shader), hair as ~20 chunky clump tubes
// on the same guide sim, hands that curl (flat mitten + thumb, bent in the vertex shader), consistent triangle winding (inverted hull).
// Jade's body: a skinned triangle mesh lofted from elliptical cross-sections in the rest pose (three LODs), a part-id
// atlas (so the orange band, openings and skin/cloth borders are crisp), the fibres her clothes are woven from (light
// mode), decal points (back disc, RARE EARTH, chest dot, 1420 MHz patch), hair guides + strands, straps, trouser chains.
//
// Vertex layout (20 floats), shared by mesh, decal points and (as a prefix) fibres:
//   la   xyz local position in bone A | chain verts: (ring x, chain param 0..1, ring z);  w = part (points only)
//   lb   xyz local position in bone B, w = blend weight toward B
//   n    xyz local normal (bone A frame | ring frame), w = seed
//   bn   bone A, bone B, chain id (-1 = bone-skinned, 0 = left leg, 1 = right leg), lag weight (jacket hem)
//   uv   atlas u, atlas v, variant (2 = bun/pencils only), region id   | points: uv.x = radius
// Fibres add: bin xyz (local binormal) + side, and fib = (metres along, seed, half width, 0).
import { add, sub, mul, dot, cross, norm, len, lerp, lerp3, clamp, smooth, rng, DEG } from './m.js';
import { J, REST_POS, toLocal, dirToLocal } from './skeleton.js';

export const PART = { SKIN: 0, HAIR: 1, JACKET: 2, STRIPE: 3, TOP: 4, TROUSER: 5, STRAP: 6, SHOE: 7, PHONE: 8, PATCH: 9, DOT: 10, TEXT: 11, PENCIL: 12, BUN: 13, BELT: 14, SOLE: 15, EYE: 16, POCKET: 17, PHONEBLK: 18, ERASER: 19, LEAD: 20, PTEXT: 21 };
export const HAIR = { COLS: 14, LAYERS: 4, G_BACK: 56, G_LOCK: 4, G_SHORT: 4, G: 64, NODES: 14 };
export const LEG = { NODES: 8, K: [1, 0.8, 0.5, 0.3, 0.1, 0.03, 0.008, 0.004] };
export const VSTRIDE = 20, FSTRIDE = 28, TILE = 512;
// The face, in the head joint's local frame (metres; x = her left, y up from the joint at 1.505, z front). Shared with the shader.
// LIKENESS pass (2026-11-10, from Jade's own photo and the character sheet): a round-oval face (full cheeks, soft short chin), a high open forehead with a
// centre parting, long almond eyes set a little wide with the outer corners up, straight full brows, very dark brown irises, a soft short nose, full lips.
// POLISH pass: the eyes are a fifth larger (EW 0.0262 -> 0.0312, their height by ES in the shader), a little wider apart, the brows higher to clear them.
export const FACE = { PARTX: 0.003, EX: 0.0420, EY: 0.0275, EW: 0.0312, ES: 1.17, BY: 0.0318, NY: -0.0150, MY: -0.0365, TILT: 0.0040, K1: 0.082, K2: 0.122 };
const fract = (x) => x - Math.floor(x);
// THE HANDS (polish pass). A palm, four fingers and a thumb as separate tapered forms, rigid to the hand joint and POSED in the vertex shader from a small
// table of authored shapes (HAND.pose), blended per instance by `hand`. Canonical hand frame (metres): x = out of the palm, y = wrist -> fingertips,
// z = toward the thumb; the hand joint's local frame is (side * x, y, z). Digits 0..3 = index, middle, ring, little; 4 = thumb; 5 = the far mitten (LOD).
//   B  base pivot (knuckle; the thumb's saddle joint)    az  rest direction in the palm plane, degrees toward the thumb (fingers)    d  rest direction (thumb)
//   L  three segment lengths                            r   radius at the base (half width; fingers are a little flatter than wide)
// A pose row = [spread, a1, a2, a3] in degrees per digit. Fingers: spread about the palm normal (+ = toward the thumb), then knuckle, middle and end joint
// (+ = curl toward the palm). Thumb: swing in the palm plane (+ = away from the index), opposition (+ = out of the palm plane, toward the palm side), then its
// two joints (+ = curl across the palm), and a fifth number: the turn of the whole thumb about its own length (what lets its pad face the fingers).
export const HAND = {
  dig: [
    { B: [0.0000, 0.0885, 0.0272], az: 3.5, L: [0.0345, 0.0225, 0.0195], r: 0.0087 },
    { B: [0.0000, 0.0915, 0.0088], az: 0.5, L: [0.0375, 0.0250, 0.0205], r: 0.0089 },
    { B: [0.0000, 0.0875, -0.0092], az: -3.0, L: [0.0350, 0.0235, 0.0200], r: 0.0085 },
    { B: [0.0000, 0.0790, -0.0262], az: -7.0, L: [0.0275, 0.0175, 0.0180], r: 0.0076 },
    { B: [0.0050, 0.0240, 0.0215], d: [0.20, 0.74, 0.64], twist: 38, L: [0.0400, 0.0300, 0.0255], r: 0.0118 },
    { B: [0.0000, 0.0870, 0.0000], az: 0, L: [0.0340, 0.0225, 0.0195], r: 0.0340 },
  ],
  //            index             middle            ring              little            thumb
  pose: {
    splay: [[8, -5, 3, 0], [2, -6, 3, 0], [-5, -5, 3, 0], [-13, -4, 4, 0], [8, -7, 0, 9, 5]],              // -1: flat, fingers fanned, thumb out
    relax: [[2, 14, 24, 12], [0, 20, 32, 16], [-1, 27, 38, 20], [-4, 33, 42, 22], [11, 5, 48, 15, 43]],       //  0: the natural curl, more toward the little finger
    fist: [[-3, 86, 102, 72], [0, 88, 104, 74], [3, 90, 104, 74], [7, 92, 100, 72], [-7, 30, 35, 67, 35]],    // +1: thumb across the index and middle fingers
    grip: [[0, 20, 6, 4], [9, 10, 95, 57], [3, 62, 96, 60], [7, 72, 98, 64], [4, 14, 50, 27, 46]],            // the pencil of bun_write: index along the shaft, thumb pad on it, the others hooked round it (solved against the pencil's own line: fable/notes/polish.md)
    blade: [[-3, -3, 2, 0], [0, -4, 2, 0], [3, -3, 2, 0], [7, -1, 4, 2], [-3, -2, 33, 34, 40]],               // a flat palm, fingers together, thumb tucked (the salute's left hand, palm strikes)
  },
};
for (const D of HAND.dig) {
  if (D.d) { D.d = norm(D.d); D.f1 = norm(cross(D.d, [1, 0, 0])); const t = D.twist * DEG; D.f2 = norm(add(mul([-1, 0, 0], Math.cos(t)), mul(D.f1, Math.sin(t)))); }
  else { const a = D.az * DEG; D.d = [0, Math.cos(a), Math.sin(a)]; D.f1 = D.f2 = [0, Math.sin(a), -Math.cos(a)]; }
  D.len = D.L[0] + D.L[1] + D.L[2];
}
const rodr = (p, c, ax, a) => { const q = sub(p, c), cs = Math.cos(a), sn = Math.sin(a); return add(c, add(add(mul(q, cs), mul(cross(ax, q), sn)), mul(ax, dot(ax, q) * (1 - cs)))); };
// the same chain as the vertex shader (shade.js handPose), without the soft joints: a point of digit k given in the REST hand (canonical frame), posed by row a
export const handFK = (k, a, p) => {
  const D = HAND.dig[k], s = dot(sub(p, D.B), D.d), j1 = add(D.B, mul(D.d, D.L[0])), j2 = add(D.B, mul(D.d, D.L[0] + D.L[1]));
  if (s > D.L[0] + D.L[1]) p = rodr(p, j2, D.f2, a[3] * DEG);
  if (s > D.L[0]) p = rodr(p, j1, D.f2, a[2] * DEG);
  if (s > 0) { if (a[4]) p = rodr(p, D.B, D.d, a[4] * DEG); p = rodr(p, D.B, D.f1, a[1] * DEG); p = rodr(p, D.B, [1, 0, 0], a[0] * DEG); }
  return p;
};
// > 0 = hair. Curtain bangs from an off-centre parting, sweeping out and down to the temples, then the side hair in front of the ears.
export const hairD = (x, y, z) => {
  const ax = Math.abs(x), apx = Math.abs(x - FACE.PARTX);
  const tip = (c, wi, wo, hgt) => hgt * Math.pow(Math.max(0, 1 - (apx < c ? (c - apx) / wi : (apx - c) / wo)), 1.5);   // a swept strand tip: long inner slope, steep outer side
  const yh = 0.1195 - 0.038 * Math.pow(apx / 0.072, 2.0) + 0.0080 * Math.max(0, 1 - apx / 0.0050) - tip(0.047, 0.0070, 0.0026, 0.0090) - tip(0.058, 0.0080, 0.0028, 0.0150) - tip(0.0665, 0.0060, 0.0024, 0.0100);   // high and open: the hair is drawn back from a centre parting
  const xs = 0.0840 - 0.0100 * smooth(0.030, 0.090, y);
  const zb = -0.045 + 0.050 * smooth(-0.075, 0.070, y);          // side view: the hair comes forward to the temple, runs behind the cheek, back to the nape
  const a = y - yh, b = y > -0.06 ? ax - xs : -1, k = 0.012, hh = clamp(0.5 + 0.5 * (a - b) / k, 0, 1);      // a rounded corner at the temple
  return Math.max(b + (a - b) * hh + k * hh * (1 - hh), zb - z);
};
const gau = (v, s) => Math.exp(-(v * v) / (2 * s * s));
// the profile: nose (long bridge, sharp underneath), lips, the dip under them, chin. Head-local, pushed along the normal.
const faceBump = (x, y, z) => {
  if (z < 0.03) return 0;
  const ny = y - (-0.0125);
  return 0.0165 * gau(x, 0.0090) * (ny > 0 ? gau(ny, 0.021) : gau(ny, 0.0050)) + 0.0030 * gau(x, 0.045) * gau(y - 0.088, 0.030) - 0.0045 * gau(x, 0.020) * gau(y - 0.034, 0.011)
    + 0.0050 * gau(x, 0.014) * gau(y + 0.0365, 0.0052) - 0.0028 * gau(x, 0.018) * gau(y + 0.0475, 0.0042) + 0.0058 * gau(x, 0.016) * gau(y + 0.0585, 0.0065);
};

class Loft {
  constructor(rings, X = [1, 0, 0], Z = [0, 0, 1]) {
    this.r = rings; this.n = rings.length; this.X = X; this.Z = Z;
    const N = 40 * (this.n - 1); this.sv = [0]; let acc = 0, prev = null;
    for (let i = 0; i <= N; i++) {
      const v = (i / N) * (this.n - 1); const q = [0, 1, 2, 3].map((k) => this.p(k * Math.PI / 2, v));
      if (prev) { acc += (len(sub(q[0], prev[0])) + len(sub(q[1], prev[1])) + len(sub(q[2], prev[2])) + len(sub(q[3], prev[3]))) / 4; this.sv.push(acc); }
      prev = q;
    }
    this.N = N; this.length = acc;
  }
  ring(v) {
    v = clamp(v, 0, this.n - 1); const i = Math.min(this.n - 2, Math.floor(v)), t = v - i, r = this.r;
    const a = r[Math.max(0, i - 1)], b = r[i], c = r[i + 1], d = r[Math.min(this.n - 1, i + 2)];
    const cr = (p0, p1, p2, p3) => 0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
    return { c: [cr(a.c[0], b.c[0], c.c[0], d.c[0]), cr(a.c[1], b.c[1], c.c[1], d.c[1]), cr(a.c[2], b.c[2], c.c[2], d.c[2])], rx: Math.max(1e-4, cr(a.rx, b.rx, c.rx, d.rx)), rz: Math.max(1e-4, cr(a.rz, b.rz, c.rz, d.rz)) };
  }
  p(u, v) { const g = this.ring(v), cu = Math.cos(u), su = Math.sin(u); return [g.c[0] + this.X[0] * g.rx * cu + this.Z[0] * g.rz * su, g.c[1] + this.X[1] * g.rx * cu + this.Z[1] * g.rz * su, g.c[2] + this.X[2] * g.rx * cu + this.Z[2] * g.rz * su]; }
  pn(u, v) {
    const P = this.p(u, v), e = 1e-3, g = this.ring(v);
    const du = sub(this.p(u + e, v), this.p(u - e, v)), dv = sub(this.p(u, Math.min(this.n - 1, v + e)), this.p(u, Math.max(0, v - e)));
    let N = norm(cross(du, dv)); if (dot(N, sub(P, g.c)) < 0) N = mul(N, -1);
    return { P, N, g };
  }
  circ(v) { const g = this.ring(v), a = g.rx, b = g.rz, h = ((a - b) * (a - b)) / ((a + b) * (a + b)); return Math.PI * (a + b) * (1 + 3 * h / (10 + Math.sqrt(4 - 3 * h))); }
  vAtS(s) {
    let lo = 0, hi = this.N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (this.sv[m] < s) lo = m; else hi = m; }
    const t = (s - this.sv[lo]) / Math.max(1e-9, this.sv[hi] - this.sv[lo]); return ((lo + clamp(t, 0, 1)) / this.N) * (this.n - 1);
  }
  sAtV(v) { const f = clamp(v / (this.n - 1), 0, 1) * this.N, i = Math.min(this.N - 1, Math.floor(f)); return lerp(this.sv[i], this.sv[i + 1], f - i); }
  vAt(fn, target) {
    let lo = 0, hi = this.n - 1; const inc = fn(this.ring(hi)) > fn(this.ring(lo));
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if ((fn(this.ring(m)) < target) === inc) lo = m; else hi = m; } return (lo + hi) / 2;
  }
}
const R3 = (y, rx, rz, z = 0, x = 0) => ({ c: [x, y, z], rx, rz });

function rasterText(draw, w, h) {
  const c = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
  const g = c.getContext('2d', { willReadFrequently: true }); g.clearRect(0, 0, w, h); draw(g, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  return (x, y) => { const i = clamp(Math.floor(x * w), 0, w - 1), j = clamp(Math.floor(y * h), 0, h - 1); return d[(j * w + i) * 4 + 3] / 255; };
}

export function buildBody(opts = {}) {
  const R = rng(opts.seed || 20261110);
  const LODS = opts.lods || [1, 0.5, 0.26];
  const meshes = LODS.map(() => ({ v: [], i: [] })), points = [], fib = { v: [], i: [], n: 0, per: 0 };
  const defs = [];                                   // every loft with its config, in tile order
  const one = (j) => () => ({ a: j });
  const two = (ja, jb, x0, hw) => (x) => { const w = smooth(x0 - hw, x0 + hw, x); return w <= 0 ? { a: ja } : w >= 1 ? { a: jb } : { a: ja, b: jb, w }; };
  const skinOf = (P, N, bones, lagW = 0) => { const a = bones.a, b = bones.b === undefined ? bones.a : bones.b; return { la: toLocal(a, P), lb: toLocal(b, P), w: bones.w || 0, n: dirToLocal(a, N), a, b, chain: -1, lagW, frame: (d) => dirToLocal(a, d) }; };
  const tileOf = {}; let nTiles = 0;                 // lofts of one flat colour may share an atlas tile (cfg.tileKey): the hands are 16 lofts
  const loft = (L, cfg) => { let tile; if (cfg.tileKey) { if (tileOf[cfg.tileKey] === undefined) tileOf[cfg.tileKey] = nTiles++; tile = tileOf[cfg.tileKey]; } else tile = nTiles++; defs.push({ L, cfg, tile }); return L; };
  const vOf = (L, cfg, f) => (cfg.vParam ? f * (L.n - 1) : L.vAtS(L.length * f));

  // ================= forms (rest pose: hips 1.005, chest 1.225, neck 1.415, head joint 1.505, crown 1.655) =================
  const torso = loft(new Loft([R3(1.05, 0.125, 0.092), R3(1.10, 0.112, 0.084), R3(1.15, 0.108, 0.082), R3(1.21, 0.117, 0.090, 0.004), R3(1.27, 0.126, 0.101, 0.010), R3(1.32, 0.130, 0.098, 0.008), R3(1.365, 0.124, 0.080, 0.002), R3(1.40, 0.082, 0.060), R3(1.42, 0.048, 0.046)]),
    { nu: 36, nv: 20, region: 0, tileSize: 256, part: (u, v, P) => (P[1] < 1.205 || P[1] > 1.406 - (P[2] > 0 ? 0.030 * gau(P[0], 0.036) : 0) ? PART.SKIN : PART.TOP),      /* r3: a neckline (a shallow scoop at the front): the neck is skin down to it */ bones: (P) => (P[1] < 1.16 ? two(J.hips, J.spine, 1.095, 0.04)(P[1]) : two(J.spine, J.chest, 1.225, 0.05)(P[1])) });
  loft(new Loft([R3(1.38, 0.050, 0.050, -0.004), R3(1.41, 0.044, 0.045), R3(1.45, 0.041, 0.042, 0.004), R3(1.495, 0.043, 0.044, 0.008)]),
    { nu: 20, nv: 8, region: 14, tileSize: 128, part: (u, v, P) => (P[1] < 1.404 ? PART.TOP : PART.SKIN), bones: (P) => (P[1] < 1.45 ? two(J.chest, J.neck, 1.415, 0.02)(P[1]) : two(J.neck, J.head, 1.50, 0.02)(P[1])) });

  // head: anime proportions (about 6.8 heads with the hair). Full at eye level, a small soft-pointed chin under the lips.
  const PARTX = FACE.PARTX, HY = REST_POS[J.head][1];
  const hl = (P) => [P[0], P[1] - HY, P[2]];
  const isHair = (P) => hairD(P[0], P[1] - HY, P[2]) > 0;
  const head = loft(new Loft([R3(1.4398, 0.0012, 0.0010, 0.0635), R3(1.441, 0.0170, 0.012, 0.064),      /* r3: the first ring closes the chin (the loft was open underneath: from below, head tipped back, a black hole under the chin: 55.8-57.5) */
    R3(1.4475, 0.0315, 0.030, 0.052), R3(1.464, 0.0495, 0.055, 0.034), R3(1.489, 0.0685, 0.078, 0.018), R3(1.520, 0.0840, 0.091, 0.008), R3(1.555, 0.089, 0.098, 0.003), R3(1.600, 0.090, 0.102, -0.002), R3(1.640, 0.082, 0.095, -0.005), R3(1.664, 0.060, 0.070, -0.007), R3(1.676, 0.028, 0.034, -0.008), R3(1.679, 0.005, 0.006, -0.008)]),
    { nu: 88, nv: 68, region: 5, tileSize: 64, warp: (P, g) => (P[2] > g.c[2] ? [P[0], P[1], g.c[2] + (P[2] - g.c[2]) * 0.86] : P),   // a flatter face plane: both eyes hold in three-quarter view
      part: (u, v, P) => (isHair(P) ? PART.HAIR : PART.SKIN), bones: one(J.head),
      push: (part, P) => { const h = hl(P), hd = smooth(-0.004, 0.020, hairD(h[0], h[1], h[2])); return (0.006 + 0.020 * smooth(0.03, 0.13, h[1]) - 0.0085 * gau(h[0] - PARTX, 0.0075) * smooth(0.10, 0.14, h[1]) * smooth(-0.075, -0.035, h[2])) * hd + faceBump(h[0], h[1], h[2]); } });

  // jacket: cropped under the ribs, drop shoulders, soft boxy body, stand collar, worn open
  const STRIPE = [1.272, 1.314];
  const BACK = { dot: [0, 1.322, 0.056], text: { y: 1.214, h: 0.025, w: 0.196 } }, CHEST_DOT = [0.082, 1.348, 0.019];
  const gap = (y) => 0.020 + 0.030 * clamp((1.40 - y) / 0.22, 0, 1) + 0.022 * smooth(1.388, 1.426, y);      // r3: the stand collar is open at the throat (it used to close under the chin, and its outline merged with the jaw's)
  const jacketBones = (P) => two(J.spine, J.chest, 1.20, 0.04)(P[1]);
  const jLag = (P) => smooth(1.28, 1.17, P[1]) * 0.6;
  const jacket = loft(new Loft([R3(1.165, 0.146, 0.116, 0.008), R3(1.178, 0.160, 0.128, 0.009), R3(1.215, 0.174, 0.139, 0.010), R3(1.275, 0.177, 0.140, 0.010), R3(1.328, 0.171, 0.128, 0.006), R3(1.365, 0.150, 0.100, 0.002), R3(1.395, 0.086, 0.074), R3(1.414, 0.068, 0.067, 0.002), R3(1.430, 0.064, 0.064, 0.003)]),      /* r3: collar 1.6 cm lower (it stood above the chin's underside) */
    { nu: 64, nv: 26, region: 15, tileSize: TILE, bones: jacketBones, lag: jLag, fibres: 0.0033,
      part: (u, v, P, N) => { const x = P[0], y = P[1]; if (N[2] > 0 && Math.abs(x) < gap(y)) return -1; if (y > STRIPE[0] && y < STRIPE[1] && !(N[2] < -0.15 && Math.abs(x) < 0.125)) return PART.STRIPE; return PART.JACKET; } });
  const sleeves = [];
  for (const side of [1, -1]) {
    const up = side > 0 ? J.upArmL : J.upArmR, fo = side > 0 ? J.foreArmL : J.foreArmR, ha = side > 0 ? J.handL : J.handR;
    const sh = REST_POS[up], dir = norm(sub(REST_POS[fo], sh)), Z = [0, 0, 1], X = norm(cross(dir, Z));
    const at = (d, off = 0) => add(sh, add(mul(dir, d), [0, 0, off])), dOf = (P) => dot(sub(P, sh), dir);
    const S = (d, rx, rz, off = 0) => ({ c: at(d, off), rx, rz });
    const sleeveBones = (P) => { const d = dOf(P); if (d < 0.06) { const w = smooth(0.06, -0.035, d) * 0.6; return w > 0 ? { a: up, b: J.chest, w } : { a: up }; } return d < 0.40 ? two(up, fo, 0.27, 0.05)(d) : two(fo, ha, 0.505, 0.012)(d); };
    const sl = loft(new Loft([S(-0.035, 0.046, 0.056), S(0.03, 0.056, 0.062), S(0.12, 0.060, 0.064), S(0.27, 0.064, 0.068), S(0.38, 0.076, 0.081, 0.004), S(0.445, 0.081, 0.085, 0.006), S(0.475, 0.062, 0.066, 0.006), S(0.492, 0.037, 0.039, 0.005), S(0.508, 0.033, 0.035, 0.005)], X, Z),
      { nu: 32, nv: 26, region: side > 0 ? 1 : 2, tileSize: TILE, bones: sleeveBones, fibres: 0.0033, fibreUp: mul(dir, -1),
        part: (u, v, P) => { const d = dOf(P); if (d < 0.0 && Math.abs(P[0]) < 0.14) return -1; return (d > 0.085 && d < 0.128) ? PART.STRIPE : PART.JACKET; } });
    sleeves.push({ sl, side, sh, dir, dOf, sleeveBones });
    // HANDS (polish pass): palm + four fingers + thumb, see HAND at the top. Vertices carry lb = (side, digit id, 0) and lb.w = -1: the vertex shader poses
    // them (handPose). Far LOD: the palm, the thumb and ONE mitten that takes the mean of the four fingers' angles, so the hand keeps its shape when it changes.
    const hp = REST_POS[ha], bodyward = [-side, 0, 0], palm = norm(sub(bodyward, mul(dir, dot(bodyward, dir))));
    const vecC = (c) => add(add(mul(palm, c[0]), mul(dir, c[1])), [0, 0, c[2]]), fromC = (c) => add(hp, vecC(c)), toC = (P) => { const q = sub(P, hp); return [dot(q, palm), dot(q, dir), q[2]]; };
    const reg = side > 0 ? 10 : 11, hcfg = (digit, o) => ({ region: reg, partConst: PART.SKIN, bones: one(ha), mark: -1, side, digit, tileKey: 'hand', ...o });
    // the cuff closes on the wrist (it was an open tube: one looked into the sleeve), and the wrist runs up inside it
    loft(new Loft([S(0.5070, 0.0335, 0.0355, 0.005), S(0.5100, 0.0310, 0.0330, 0.0045), S(0.5128, 0.0215, 0.0260, 0.003), S(0.5150, 0.0105, 0.0160, 0.0005)], X, Z), { nu: 20, nv: 4, region: side > 0 ? 1 : 2, partConst: PART.JACKET, bones: one(ha), tileKey: 'cuff', noHull: true });
    // palm: a slab with rounded edges, narrow at the wrist, widest at the knuckles; the knuckle line slopes back toward the little finger
    const PALM = [[-0.042, 0.0128, 0.0185, 0], [-0.012, 0.0128, 0.0190, 0], [0.008, 0.0130, 0.0208, 0.0004], [0.030, 0.0136, 0.0282, 0.0012], [0.054, 0.0128, 0.0342, 0.0010], [0.074, 0.0114, 0.0370, 0.0006], [0.088, 0.0098, 0.0366, 0.0004], [0.0965, 0.0064, 0.0330, 0], [0.0995, 0.0012, 0.0200, 0]];
    loft(new Loft(PALM.map(([y, rx, rz, z]) => ({ c: fromC([0, y, z]), rx, rz })), palm, Z), hcfg(6, { nu: 18, nv: 18,
      warp: (P, g) => { const c = toC(P), u = clamp(c[0] / g.rx, -1, 1), k = smooth(0.040, 0.094, c[1]); c[0] = g.rx * Math.sign(u) * Math.pow(Math.abs(u), 0.72);
        c[1] -= k * (0.0100 * Math.pow(clamp(-c[2] / 0.036, 0, 1), 1.4) + 0.0030 * Math.pow(clamp(c[2] / 0.036, 0, 1), 1.6)); return fromC(c); } }));
    const tipR = (rr, sLen) => [[sLen - 0.0120, 1], [sLen - 0.0052, 0.93], [sLen - 0.0016, 0.64], [sLen, 0.12]].map(([q, m]) => [q, rr(q) * m]);
    for (let k = 0; k < 4; k++) {                    // fingers: tapered, a little flatter than wide, a round tip
      const D = HAND.dig[k], rr = (q) => D.r * (1 - 0.20 * Math.max(0, q) / D.len) * (q < 0 ? 0.92 : 1), acr = vecC([0, -D.d[2], D.d[1]]);
      const RS = [[-0.011, rr(-1)], [-0.004, rr(-1)], [0.006, rr(0.006)], [D.L[0] * 0.5, rr(D.L[0] * 0.5) * 0.97], [D.L[0], rr(D.L[0]) * 1.03], [D.L[0] + D.L[1] * 0.5, rr(D.L[0] + D.L[1] * 0.5) * 0.97], [D.L[0] + D.L[1], rr(D.L[0] + D.L[1]) * 1.02], ...tipR(rr, D.len)];
      loft(new Loft(RS.map(([q, r]) => ({ c: fromC(add(D.B, mul(D.d, q))), rx: r * 0.84, rz: r })), palm, acr), hcfg(k, { nu: 10, nv: 14, lods: [0, 1] }));
    }
    { const D = HAND.dig[4], e1 = cross(D.d, D.f1), rr = (q) => (q < 0.008 ? D.r : q < D.L[0] ? lerp(D.r, 0.0090, smooth(0.008, D.L[0], q)) : lerp(0.0090, 0.0077, (q - D.L[0]) / (D.len - D.L[0])));      // thumb: a full base (the ball of the thumb), two joints
      const RS = [[-0.013, D.r * 0.9], [-0.004, D.r], [0.008, rr(0.008)], [0.022, rr(0.022)], [D.L[0], rr(D.L[0])], [D.L[0] + D.L[1] * 0.5, rr(D.L[0] + D.L[1] * 0.5) * 0.96], [D.L[0] + D.L[1], rr(D.L[0] + D.L[1]) * 1.02], ...tipR(rr, D.len)];
      loft(new Loft(RS.map(([q, r]) => ({ c: fromC(add(D.B, mul(D.d, q))), rx: r * 0.90, rz: r })), vecC(e1), vecC(D.f1)), hcfg(4, { nu: 10, nv: 13 })); }
    { const D = HAND.dig[5], RS = [[-0.008, 0.0330, 0.0072], [0.004, 0.0346, 0.0074], [0.030, 0.0340, 0.0070], [0.055, 0.0312, 0.0064], [0.070, 0.0262, 0.0058], [0.079, 0.0170, 0.0046], [0.0825, 0.0040, 0.0016]];      // the far mitten
      loft(new Loft(RS.map(([q, rz, rx]) => ({ c: fromC(add(D.B, mul(D.d, q))), rx, rz })), palm, Z), hcfg(5, { nu: 14, nv: 16, lods: [2] })); }
  }

  // trousers: fitted at the high waist, then a long bell to the floor. The legs are chains of simulated ring centres.
  loft(new Loft([R3(0.86, 0.194, 0.130, 0.004), R3(0.92, 0.184, 0.130, 0.004), R3(0.98, 0.166, 0.122, 0.003), R3(1.03, 0.148, 0.110, 0.002), R3(1.06, 0.132, 0.098, 0.002), R3(1.092, 0.126, 0.094, 0.002)]),
    { nu: 44, nv: 10, region: 6, fibres: 0.0036, part: (u, v, P) => (P[1] > 1.058 ? PART.BELT : PART.TROUSER),
      bones: (P) => { const w = smooth(0.95, 0.86, P[1]) * 0.55; return w > 0 ? { a: J.hips, b: P[0] > 0 ? J.thighL : J.thighR, w } : { a: J.hips }; } });
  const LEGR = [[0.95, 0.092, 0.095, 0.118], [0.82, 0.100, 0.103, 0.122], [0.69, 0.106, 0.104, 0.120], [0.56, 0.112, 0.104, 0.120], [0.43, 0.122, 0.110, 0.130], [0.30, 0.140, 0.130, 0.162], [0.165, 0.164, 0.160, 0.208], [0.03, 0.188, 0.192, 0.252]];   // fitted-baggy through thigh and knee (stances must read), then a bell: hem 0.38 wide x 0.50 deep at full flare
  const legs = [];
  for (const side of [1, -1]) {
    const c = side > 0 ? 0 : 1, th = side > 0 ? J.thighL : J.thighR, sn = side > 0 ? J.shinL : J.shinR, ft = side > 0 ? J.footL : J.footR, toe = side > 0 ? J.toeL : J.toeR;
    const pocket = (P, N) => { const o = N[0] * side, y = P[1]; if (o > 0.5 && y > 0.60 && y < 0.78 && Math.abs(P[2] - 0.005) < 0.088) return 1; if (o > 0.6 && y > 0.27 && y < 0.41 && Math.abs(P[2] - 0.01) < 0.078) return 2; return 0; };
    loft(new Loft(LEGR.map((r) => R3(r[0], r[2], r[3], 0.006, side * r[1]))),
      { nu: 44, nv: 28, vParam: true, region: side > 0 ? 3 : 4, fibres: 0.0040, part: (u, v, P, N) => (pocket(P, N) ? PART.POCKET : PART.TROUSER), push: (part, P, N) => { const k = pocket(P, N); return k === 1 ? 0.020 : k === 2 ? 0.016 : 0; },
        skin: (u, v, P, N, g) => ({ la: [P[0] - g.c[0], v / (LEG.NODES - 1), P[2] - g.c[2]], lb: [0, 0, 0], w: 0, n: N, a: th, b: th, chain: c, lagW: 0, frame: (d) => d }) });
    legs.push({
      nodes: LEGR.map((r, k) => ({ bone: k <= 3 ? th : sn, local: toLocal(k <= 3 ? th : sn, [side * r[1], r[0], 0.006]), axis: toLocal(k <= 3 ? th : sn, [side * 0.085, r[0], 0]), lim: (r[2] + r[3]) / 2 * (1 - 0.3 * (k / 7) * (k / 7)) - 0.055 })),
      seg: LEGR.slice(1).map((r, k) => Math.hypot(r[0] - LEGR[k][0], r[1] - LEGR[k][1])), hipLocal: toLocal(J.hips, [side * LEGR[0][1], LEGR[0][0], 0.006]),
    });
    const an = REST_POS[ft];
    loft(new Loft([{ c: an, rx: 0.036, rz: 0.040 }, { c: lerp3(an, REST_POS[sn], 0.5), rx: 0.044, rz: 0.048 }, { c: REST_POS[sn], rx: 0.050, rz: 0.054 }]), { nu: 10, nv: 4, region: side > 0 ? 3 : 4, partConst: PART.TOP, bones: one(sn) });
    const fx = an[0] + side * 0.004, az = an[2], Sh = (dz, cy, rx, rz) => ({ c: [fx, cy, az + dz], rx, rz });
    loft(new Loft([Sh(-0.078, 0.050, 0.010, 0.016), Sh(-0.062, 0.060, 0.043, 0.058), Sh(-0.01, 0.064, 0.052, 0.063), Sh(0.07, 0.056, 0.056, 0.055), Sh(0.142, 0.046, 0.056, 0.045), Sh(0.192, 0.038, 0.043, 0.037), Sh(0.212, 0.034, 0.009, 0.011)], [1, 0, 0], [0, 1, 0]),
      { nu: 18, nv: 12, region: side > 0 ? 7 : 8, part: (u, v, P) => (P[1] < 0.034 ? PART.SOLE : PART.SHOE), bones: (P) => two(ft, toe, az + 0.121, 0.03)(P[2]) });
  }

  // headphones round the neck: two cups and a band (readable in profile)
  const HB = { a: J.chest, b: J.neck, w: 0.35 };
  for (const side of [1, -1]) {
    const c = [side * 0.083, 1.392, 0.048], ax = norm([side * 0.78, 0.26, 0.56]), t1 = norm(cross(ax, [0, 1, 0])), t2 = cross(ax, t1), C = (h, r) => ({ c: add(c, mul(ax, h)), rx: r, rz: r });
    loft(new Loft([C(-0.014, 0.004), C(-0.012, 0.040), C(0.0, 0.046), C(0.014, 0.045), C(0.021, 0.036), C(0.022, 0.004)], t1, t2), { nu: 20, nv: 10, region: 9, part: (u, v) => (v < 1.6 ? PART.PHONEBLK : PART.PHONE), vParam: true, bones: () => HB });
  }
  { const band = []; for (let k = 0; k <= 10; k++) { const x = lerp(0.086, -0.086, k / 10), q = Math.sqrt(Math.max(0, 1 - (x / 0.088) * (x / 0.088))); band.push({ c: [x, 1.402 + 0.010 * q, 0.036 - 0.104 * q], rx: 0.011, rz: 0.013 }); }
    loft(new Loft(band, [0, 1, 0], [0, 0, 1]), { nu: 8, nv: 20, region: 9, partConst: PART.PHONE, bones: () => HB }); }

  // the violet branch: a bun and two crossed pencils (variant 2)
  const BUN = [0, 1.716, -0.060];
  loft(new Loft([R3(BUN[1] - 0.050, 0.004, 0.004, BUN[2]), R3(BUN[1] - 0.040, 0.034, 0.034, BUN[2]), R3(BUN[1] - 0.012, 0.054, 0.054, BUN[2]), R3(BUN[1] + 0.014, 0.053, 0.053, BUN[2]), R3(BUN[1] + 0.038, 0.034, 0.034, BUN[2]), R3(BUN[1] + 0.046, 0.004, 0.004, BUN[2])]), { nu: 30, nv: 14, region: 12, variant: 2, partConst: PART.BUN, bones: one(J.head) });      /* r3: rounder (it was a 16-gon in the film's closest shot) */
  const pencilPart = (u, v) => (v < 2 ? PART.ERASER : v < 4 ? PART.PENCIL : v < 5 ? PART.SKIN : PART.LEAD);
  for (const side of [1, -1]) {
    const ax = norm([side * 0.80, 0.52, -0.30]), t1 = norm(cross(ax, [0, 0, 1])), t2 = cross(ax, t1), c0 = add(BUN, mul(ax, -0.105)), C = (h, r) => ({ c: add(c0, mul(ax, h)), rx: r, rz: r });
    // variant codes: 2 = bun + the pencil that stays; 3 = the pencil she draws (her right side; hidden once drawn); 4 = that pencil in her right hand
    loft(new Loft([C(0, 0.001), C(0.002, 0.0052), C(0.02, 0.0052), C(0.10, 0.0052), C(0.188, 0.0052), C(0.204, 0.0022), C(0.212, 0.0004)], t1, t2), { nu: 6, nv: 12, vParam: true, region: 13, variant: side > 0 ? 2 : 3, part: pencilPart, bones: one(J.head) });
  }
  let pencilTip;
  { // the drawn pencil, held in the right hand like a pen: through the mitten, the lead beyond the fingertips
    const up = J.upArmR, fo = J.foreArmR, ha = J.handR, sh = REST_POS[up], dir = norm(sub(REST_POS[fo], sh)), hp = REST_POS[ha], bodyward = [1, 0, 0], palm = norm(sub(bodyward, mul(dir, dot(bodyward, dir))));
    const ax = norm(add(mul(dir, 0.88), add([0, 0, 0.36], mul(palm, 0.20)))), t1 = norm(cross(ax, palm)), t2 = cross(ax, t1), c0 = add(hp, add(mul(dir, 0.085), add([0, 0, 0.012], mul(palm, 0.022)))), C = (h, r) => ({ c: add(c0, mul(ax, h - 0.085)), rx: r, rz: r });
    loft(new Loft([C(0.050, 0.001), C(0.052, 0.0058), C(0.064, 0.0058), C(0.10, 0.0058), C(0.188, 0.0058), C(0.204, 0.0024), C(0.212, 0.0004)], t1, t2), { nu: 8, nv: 12, vParam: true, region: 13, variant: 4,      /* polish: the held pencil starts inside the closed hand (it used to come out through the heel of the palm); its line and its tip are unchanged */ part: pencilPart, bones: one(ha) });
    pencilTip = toLocal(ha, add(c0, mul(ax, 0.212 - 0.085)));
  }

  // ================= atlas + meshes + fibres =================
  const T = Math.ceil(Math.sqrt(nTiles)), ASIZE = T * TILE, atlas = new Uint8Array(ASIZE * ASIZE).fill(255);
  for (const d of defs) {
    const { L, cfg } = d, tx = (d.tile % T) * TILE, ty = Math.floor(d.tile / T) * TILE; d.org = [tx, ty];
    const res = cfg.tileSize || 64, sc = TILE / res;
    for (let j = 0; j < res; j++) {
      const v = vOf(L, cfg, (j + 0.5) / res), g = L.ring(v);
      for (let i = 0; i < res; i++) {
        let part = cfg.partConst;
        if (part === undefined) { const u = (i + 0.5) / res * Math.PI * 2; let P = L.p(u, v); if (cfg.warp) P = cfg.warp(P, g); part = cfg.part(u, v, P, norm(sub(P, g.c)), g); }
        const val = part < 0 ? 255 : part;
        for (let b = 0; b < sc; b++) for (let a = 0; a < sc; a++) atlas[(ty + j * sc + b) * ASIZE + tx + i * sc + a] = val;
      }
    }
    const uvOf = (fu, fv) => [(tx + clamp(fu, 0.004, 0.996) * TILE) / ASIZE, (ty + clamp(fv, 0.004, 0.996) * TILE) / ASIZE];
    const vert = (u, v, fu, fv, lift = 0) => {
      const q = L.pn(u, v); if (cfg.warp) q.P = cfg.warp(q.P, q.g); const part = cfg.partConst !== undefined ? cfg.partConst : cfg.part(u, v, q.P, q.N, q.g);
      const P = add(q.P, mul(q.N, (cfg.push ? cfg.push(part, q.P, q.N) : 0) + lift));
      const s = cfg.skin ? cfg.skin(u, v, P, q.N, q.g) : skinOf(P, q.N, cfg.bones(P, v), cfg.lag ? cfg.lag(P) : 0);
      return { s, uv: uvOf(fu, fv), N: q.N, P };
    };
    const put = (arr, o, seed) => arr.push(o.s.la[0], o.s.la[1], o.s.la[2], 0, cfg.mark ? cfg.side : o.s.lb[0], cfg.mark ? cfg.digit : o.s.lb[1], cfg.mark ? 0 : o.s.lb[2], cfg.mark || o.s.w, o.s.n[0], o.s.n[1], o.s.n[2], seed, o.s.a, o.s.b, o.s.chain, o.s.lagW, o.uv[0], o.uv[1], cfg.variant || 0, cfg.region || 0);
    LODS.forEach((q, li) => {
      if (cfg.lods && !cfg.lods.includes(li)) return;      // (fingers: near LODs only; the mitten: the far one)
      const M = meshes[li], nu = Math.max(6, Math.round(cfg.nu * q)), nv = Math.max(3, Math.round(cfg.nv * q)), base = M.v.length / VSTRIDE;
      const row = []; for (let i = 0; i <= nv; i++) for (let j = 0; j <= nu; j++) { const o = vert(j / nu * Math.PI * 2, vOf(L, cfg, i / nv), j / nu, i / nv); row.push(o); put(M.v, o, cfg.noHull ? -1 : 0); }      // (n.w = -1: no ink hull on this form)
      // consistent winding (counter-clockwise seen from outside), so the inverted-hull outline can cull front faces
      let flip = false; { const i = nv >> 1, j = nu >> 2, A = row[i * (nu + 1) + j], B = row[i * (nu + 1) + j + 1], C = row[(i + 1) * (nu + 1) + j]; flip = dot(cross(sub(B.P, A.P), sub(C.P, A.P)), A.N) < 0; }
      for (let i = 0; i < nv; i++) for (let j = 0; j < nu; j++) { const a = base + i * (nu + 1) + j, b = a + 1, c = a + nu + 1, e = c + 1; if (flip) M.i.push(a, c, b, b, c, e); else M.i.push(a, b, c, b, e, c); }
    });
    if (cfg.fibres) {                                  // threads running along the cloth, top to bottom
      const flip = L.ring(0).c[1] < L.ring(L.n - 1).c[1] && !cfg.fibreUp ? true : (cfg.fibreUp ? dot(sub(L.ring(L.n - 1).c, L.ring(0).c), cfg.fibreUp) > 0 : false);
      const nF = Math.round(L.circ((L.n - 1) / 2) / cfg.fibres), SEG = 22;
      for (let k = 0; k < nF; k++) {
        const u = (k + 0.15 + 0.7 * R()) / nF * Math.PI * 2, seed = R(), base = fib.v.length / FSTRIDE; let along = 0, prev = null;
        for (let i = 0; i <= SEG; i++) {
          const f = flip ? 1 - i / SEG : i / SEG, v = vOf(L, cfg, f), o = vert(u, v, u / (Math.PI * 2), f, 0.004);
          const e = 0.02 * (flip ? -1 : 1), Tn = norm(sub(L.p(u, vOf(L, cfg, clamp(f + e, 0, 1))), L.p(u, vOf(L, cfg, clamp(f - e, 0, 1))))), B = o.s.frame(norm(cross(o.N, Tn)));
          if (prev) along += len(sub(o.P, prev)); prev = o.P;
          for (const sd of [-1, 1]) { put(fib.v, o, seed); fib.v.push(B[0], B[1], B[2], sd, along, seed, 0.0016, 0); }
        }
        for (let i = 0; i < SEG; i++) { const a = base + i * 2; fib.i.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
        fib.n++; fib.per = SEG * 6;
      }
    }
  }
  // fibres: shuffle whole fibres so that any prefix is an even subset (LOD)
  { const order = Array.from({ length: fib.n }, (_, i) => i), r2 = rng(4242); for (let i = order.length - 1; i > 0; i--) { const j = Math.floor(r2() * (i + 1)); [order[i], order[j]] = [order[j], order[i]]; }
    const ni = new Uint32Array(fib.i.length); order.forEach((src, dst) => { for (let k = 0; k < fib.per; k++) ni[dst * fib.per + k] = fib.i[src * fib.per + k]; }); fib.i = ni; }

  // ================= decal points =================
  const pt = (P, N, bones, part, rad, lagW = 0) => { const s = skinOf(add(P, mul(N, 0.0035)), N, bones, lagW); points.push([s.la[0], s.la[1], s.la[2], part, s.lb[0], s.lb[1], s.lb[2], s.w, s.n[0], s.n[1], s.n[2], R(), s.a, s.b, -1, s.lagW, rad, 0, 0, 0]); };
  const onJacket = (x, y, back) => { const v = jacket.vAt((g) => g.c[1], y), g = jacket.ring(v), u = (back ? -1 : 1) * Math.acos(clamp((x - g.c[0]) / g.rx, -1, 1)); return jacket.pn(u, v); };
  {
    const sp = 0.0022, r = BACK.dot[2];
    for (let y = -r; y <= r; y += sp) for (let x = -r; x <= r; x += sp) { if (x * x + y * y > r * r) continue; const q = onJacket(BACK.dot[0] + x, BACK.dot[1] + y, true); pt(q.P, q.N, jacketBones(q.P), PART.DOT, sp * 0.95, jLag(q.P)); }
    const cr = CHEST_DOT[2];
    for (let y = -cr; y <= cr; y += sp) for (let x = -cr; x <= cr; x += sp) { if (x * x + y * y > cr * cr) continue; const q = onJacket(CHEST_DOT[0] + x, CHEST_DOT[1] + y, false); pt(q.P, q.N, jacketBones(q.P), PART.DOT, sp * 0.95); }
    const Tx = BACK.text, cov = rasterText((g, w, h) => {
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; try { g.fontStretch = 'expanded'; g.letterSpacing = '10px'; } catch (e) { /* older canvas */ }
      g.font = `800 ${Math.round(h * 0.86)}px "Archivo", "Arial Black", sans-serif`; const sc = Math.min(1, (w * 0.97) / g.measureText('RARE EARTH').width);
      g.font = `800 ${Math.round(h * 0.86 * sc)}px "Archivo", "Arial Black", sans-serif`; g.fillText('RARE EARTH', w / 2 + 5, h / 2 + 2);
    }, 1024, 128), tsp = 0.00115;
    for (let y = -Tx.h / 2; y <= Tx.h / 2; y += tsp) for (let x = -Tx.w / 2; x <= Tx.w / 2; x += tsp) { if (cov(0.5 - x / Tx.w, 0.5 - y / Tx.h) < 0.5) continue; const q = onJacket(x, Tx.y + y, true); pt(q.P, q.N, jacketBones(q.P), PART.TEXT, tsp * 0.95, jLag(q.P)); }
    // the 1420 MHz patch on the left sleeve: white disc, dark ring and two lines of text
    const { sl, sh, dir, dOf, sleeveBones } = sleeves[0], PR = 0.031, PD = 0.215, sp2 = 0.00115;
    const cov2 = rasterText((g, w, h) => { g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = w * 0.045; g.strokeStyle = '#fff'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.455, 0, 7); g.stroke();
      g.font = `800 ${Math.round(h * 0.27)}px "Archivo", "Arial Black", sans-serif`; g.fillText('1420', w / 2, h * 0.375); g.font = `800 ${Math.round(h * 0.24)}px "Archivo", "Arial Black", sans-serif`; g.fillText('MHz', w / 2, h * 0.645); }, 256, 256);
    for (let v = 0; v < sl.n - 1; v += 0.004) {
      const n = Math.round(sl.circ(v) / sp2);
      for (let k = 0; k < n; k++) {
        const q = sl.pn((k / n) * Math.PI * 2, v); if (dot(q.N, [0.75, 0.55, 0.36]) < 0.2 || R() > 0.36) continue;
        const d = dOf(q.P) - PD, w = sub(sub(q.P, sh), mul(dir, dOf(q.P))), px = w[2] - 0.028, rr = Math.hypot(px, d); if (rr > PR) continue;
        pt(q.P, q.N, sleeveBones(q.P), cov2(0.5 - px / (2 * PR), 0.5 + d / (2 * PR)) > 0.5 ? PART.PTEXT : PART.PATCH, sp2 * 1.3);
      }
    }
  }
  { const r2 = rng(99); for (let i = points.length - 1; i > 0; i--) { const j = Math.floor(r2() * (i + 1)); [points[i], points[j]] = [points[j], points[i]]; } }

  // ================= hair =================
  // Guides: a grid of 14 columns (where the hair leaves the head, ear to ear round the back) x 4 layers (root height).
  // Each guide first runs over the scalp (pinned), then hangs free to the waist. Plus two slim front locks per side.
  const scalp = (az, y, off) => { const v = head.vAt((g) => g.c[1], clamp(y, 1.440, 1.676)), g = head.ring(v), u = Math.atan2(-Math.cos(az) / g.rz, Math.sin(az) / g.rx), q = head.pn(u, v); return add(q.P, mul(q.N, off)); };
  const onScalp = (Q, off) => { const y = clamp(Q[1], 1.440, 1.676), v = head.vAt((g) => g.c[1], y), g = head.ring(v), u = Math.atan2((Q[2] - g.c[2]) / g.rz, (Q[0] - g.c[0]) / g.rx), q = head.pn(u, v); return add(q.P, mul(q.N, off)); };
  const guides = [], NN = HAIR.NODES;
  const finish = (path, free, extra) => { // path: dense polyline on the scalp
    let Ls = 0; const cum = [0]; for (let i = 1; i < path.length; i++) { Ls += len(sub(path[i], path[i - 1])); cum.push(Ls); }
    const seg = (Ls + free) / (NN - 1), pn = clamp(Math.floor(Ls / seg) + 1, 2, 9), pins = [];
    for (let k = 0; k < pn; k++) { const s = Math.min(Ls, k * seg); let i = 1; while (i < path.length - 1 && cum[i] < s) i++; pins.push(lerp3(path[i - 1], path[i], clamp((s - cum[i - 1]) / Math.max(1e-6, cum[i] - cum[i - 1]), 0, 1))); }
    guides.push({ pins, seg, length: Ls + free, ...extra });
  };
  for (let c = 0; c < HAIR.COLS; c++) for (let l = 0; l < HAIR.LAYERS; l++) {
    const azD = lerp(-84, 84, c / (HAIR.COLS - 1)) * DEG, azR = azD * [1.0, 1.06, 1.16, 1.3][l], yR = [1.600, 1.632, 1.656, 1.672][l], yD = 1.502 - 0.032 * Math.max(0, Math.cos(azD)), off = 0.012 + 0.003 * l, path = [];
    for (let k = 0; k <= 24; k++) { const t = k / 24; path.push(scalp(lerp(azR, azD, smooth(0, 1, t)), lerp(yR, yD, t), off)); }
    finish(path, yD - (1.005 - 0.02 * l) + 0.035 + 0.02 * R(), { kind: 0, fan: Math.sin(azD), col: c, layer: l });
  }
  for (const s of [1, -1]) for (let i = 0; i < 2; i++) {   // the side locks that frame the face: from the temple, in front of the ear, to the chest
    const pts = [[s * 0.078, 1.590, 0.026], [s * 0.086, 1.566, 0.016], [s * 0.090, 1.536, 0.006 + 0.012 * i], [s * 0.090, 1.506, 0.000 + 0.014 * i]], path = [];
    for (let k = 0; k < pts.length - 1; k++) for (let j = 0; j < 6; j++) path.push(onScalp(lerp3(pts[k], pts[k + 1], j / 6), 0.012)); path.push(onScalp(pts[pts.length - 1], 0.012));
    finish(path, 0.215 + 0.035 * i, { kind: 2, fan: 0 });
  }
  for (const s of [1, -1]) for (let i = 0; i < 2; i++) { const root = onScalp([s * 0.080, 1.565, 0.012 + 0.022 * i], 0.014); finish([root, add(root, [0, -0.012, 0])], 0.085 + 0.035 * i, { kind: 1, fan: 0 }); }
  // CLUMPS: each one is a flattened, tapered tube round a curve interpolated between two neighbouring guides (g, a); its width lies along the
  // line between the two guides (so the back clumps tile into one mass at the top and separate into points at the tips).
  // type 0 = the long back hair (hidden with the bun), 1 = short temple wisps (bun only), 2 = side locks (always).
  const clumps = [], gi = (c, l) => c * HAIR.LAYERS + l;
  const back = (cf, l, o) => { const c0 = Math.min(HAIR.COLS - 2, Math.floor(cf)); clumps.push({ g: [gi(c0, l), gi(c0 + 1, l)], a: cf - c0, type: 0, seed: R(), fan: Math.sin(lerp(-84, 84, cf / (HAIR.COLS - 1)) * DEG), ...o }); };
  [1.0, 2.1, 3.2, 4.4, 5.6, 7.4, 8.6, 9.8, 10.9, 12.0].forEach((cf) => back(cf, 3, { w: 0.029, th: 0.012, len: 0.93 + 0.07 * R() }));
  [1.6, 2.7, 3.8, 5.0, 8.0, 9.2, 10.3, 11.4].forEach((cf) => back(cf, 1, { w: 0.026, th: 0.011, len: 0.80 + 0.10 * R() }));
  for (let k = 0; k < 2; k++) { const g0 = HAIR.G_BACK + k * 2; clumps.push({ g: [g0, g0 + 1], a: 0.35, type: 2, seed: R(), fan: 0, w: 0.017, th: 0.011, len: 1 }, { g: [g0, g0 + 1], a: 1.0, type: 2, seed: R(), fan: 0, w: 0.009, th: 0.007, len: 0.86 }); }
  for (let k = 0; k < 2; k++) { const g0 = HAIR.G_BACK + k * 2; clumps.push({ g: [g0, g0 + 1], a: 1.0, type: 2, seed: R(), fan: 0.011, w: 0.0050, th: 0.0036, len: 0.56 - 0.09 * k }); }      // r3: one per side, close to the lock (the second, 2.7 cm forward, crossed the cheek in profile like a scratch: 125.3-127)   // (fan of a side lock = metres forward of the lock: a loose strand that hangs with it, never across the face)
  for (let k = 0; k < 2; k++) { const g0 = HAIR.G_BACK + HAIR.G_LOCK + k * 2; clumps.push({ g: [g0, g0 + 1], a: 0.5, type: 1, seed: R(), fan: 0, w: 0.008, th: 0.006, len: 1 }); }
  // STRANDS: the fine hair of the classic figure, on the same guides. Drawn instead of the back clumps for instances with hair: 'strands'
  // (the float shot: her hair fans on the water and its strands become the roads). Generated after everything else, so nothing above changes.
  const strands = [], NS = opts.strands || 1000;
  for (let i = 0; i < NS; i++) {
    const fc = R() * (HAIR.COLS - 1), fl = R() * (HAIR.LAYERS - 1), c0 = Math.min(HAIR.COLS - 2, Math.floor(fc)), l0 = Math.min(HAIR.LAYERS - 2, Math.floor(fl)), a = fc - c0, b = fl - l0;
    const tri = a + b < 1 ? { g: [gi(c0, l0), gi(c0 + 1, l0), gi(c0, l0 + 1)], w: [1 - a - b, a, b] } : { g: [gi(c0 + 1, l0 + 1), gi(c0, l0 + 1), gi(c0 + 1, l0)], w: [a + b - 1, 1 - a, 1 - b] };
    strands.push({ ...tri, seed: R(), type: 0, fan: Math.sin(lerp(-84, 84, fc / (HAIR.COLS - 1)) * DEG), spread: 0.012 });
  }

  const straps = [
    { bone: J.hips, root: [0.055, 1.050, 0.103], length: 0.42, width: 0.030 },
    { bone: J.thighL, root: [0.238, 0.765, 0.012], length: 0.46, width: 0.030 },
    { bone: J.thighR, root: [-0.238, 0.765, 0.012], length: 0.46, width: 0.030 },
  ].map((s) => ({ ...s, local: toLocal(s.bone, s.root) }));

  return {
    meshes: meshes.map((m) => ({ v: new Float32Array(m.v), i: new Uint32Array(m.i) })), atlas: { data: atlas, size: ASIZE },
    fibres: { v: new Float32Array(fib.v), i: fib.i, count: fib.n, per: fib.per }, points: new Float32Array(points.flat()), nPoints: points.length,
    guides, strands, clumps, straps, legs, pencilTip, tiles: T,   // pencilTip: the lead of the held pencil in the handR joint's local frame (the line of light starts here)
  };
}
