// Jade's body as a particle template, shaped in the rest pose from lofted elliptical cross-sections.
// Every particle: two bones + blend weight, local position in each, local normal, part id, glyph row/col, seed,
// a lag weight (trouser hems / jacket hem follow simulated nodes), a variant mask and a kind:
//   kind 0 = fill surfel (closes the surface; faint dust in light mode)
//   kind 1 = glyph (rows of text wrapped round the cloth)
//   kind 2 = decal (RARE EARTH, the pale-blue dots, the 1420 MHz patch)   kind 3 = eye mark
import { add, sub, mul, dot, cross, norm, len, lerp, lerp3, clamp, smooth, rng, DEG } from './m.js';
import { J, REST_POS, REST_Q, toLocal, dirToLocal } from './skeleton.js';

export const PART = { SKIN: 0, HAIR: 1, JACKET: 2, STRIPE: 3, TOP: 4, TROUSER: 5, STRAP: 6, SHOE: 7, PHONE: 8, PATCH: 9, DOT: 10, TEXT: 11, PENCIL: 12, BUN: 13, BELT: 14, SOLE: 15, EYE: 16, POCKET: 17, PHONEBLK: 18, ERASER: 19, LEAD: 20, PTEXT: 21 };
export const HAIR = { G_LONG: 60, G_SHORT: 4, NODES: 14 };

// ---------------------------------------------------------------------------------------------
class Loft {
  // rings: [{c:[x,y,z], rx, rz}] ; X, Z: unit cross-section axes (constant along the loft)
  constructor(rings, X = [1, 0, 0], Z = [0, 0, 1]) {
    this.r = rings; this.n = rings.length; this.X = X; this.Z = Z;
    this.up = norm(sub(rings[this.n - 1].c, rings[0].c));
    // reading direction: text should run left-to-right for a viewer outside, with `textUp` up
    const N = 48 * (this.n - 1); this.sv = [0]; let acc = 0, prev = null;
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
  vAtS(s) { // arc length -> v
    let lo = 0, hi = this.N; while (hi - lo > 1) { const m = (lo + hi) >> 1; if (this.sv[m] < s) lo = m; else hi = m; }
    const t = (s - this.sv[lo]) / Math.max(1e-9, this.sv[hi] - this.sv[lo]); return ((lo + clamp(t, 0, 1)) / this.N) * (this.n - 1);
  }
  vAt(fn, target) { // monotone scalar of the ring centre (e.g. height) -> v
    let lo = 0, hi = this.n - 1; const inc = fn(this.ring(hi)) > fn(this.ring(lo));
    for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if ((fn(this.ring(m)) < target) === inc) lo = m; else hi = m; } return (lo + hi) / 2;
  }
}

// ---------------------------------------------------------------------------------------------
function rasterText(draw, w, h) {
  const c = (typeof OffscreenCanvas !== 'undefined') ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h });
  const g = c.getContext('2d', { willReadFrequently: true }); g.clearRect(0, 0, w, h); draw(g, w, h);
  const d = g.getImageData(0, 0, w, h).data;
  return (x, y) => { const i = clamp(Math.floor(x * w), 0, w - 1), j = clamp(Math.floor(y * h), 0, h - 1); return d[(j * w + i) * 4 + 3] / 255; };
}

export function buildBody(opts = {}) {
  const R = rng(opts.seed || 20261110);
  const out = [[], [], [], []]; // particles by kind
  let rowCounter = 0, curRegion = 0;
  const GP_U = opts.glyphPitchU || 0.0128, GP_V = opts.glyphPitchV || 0.0205;
  const FILL = opts.fillDensity || 42000; // points per m^2

  function emit(kind, P, N, bones, part, extra = {}) {
    const a = bones.a, b = bones.b === undefined ? bones.a : bones.b, w = bones.w || 0;
    out[kind].push({
      la: toLocal(a, P), lb: toLocal(b, P), n: dirToLocal(a, N), a, b, w, part,
      grow: extra.grow || 0, gcol: extra.gcol || 0, seed: R(), lagW: extra.lagW || 0, lagNode: extra.lagNode || 0,
      variant: extra.variant || 0, kind, rad: extra.rad || 0.0062, region: extra.region ?? curRegion,
    });
  }
  // Sample a loft: fill + (optionally) glyph rows. cfg.part(u,v,P,N,g) -> part id | -1 ; cfg.bones(P,v) -> {a,b,w}
  function sample(L, cfg) {
    const fillD = (cfg.fill === undefined ? 1 : cfg.fill) * FILL, rad = cfg.rad || Math.sqrt(4.2 / (Math.PI * fillD));
    const push = cfg.push || (() => 0); if (cfg.region !== undefined) curRegion = cfg.region;
    if (fillD > 0) {
      const steps = Math.max(8, Math.ceil(L.length / 0.004));
      for (let i = 0; i < steps; i++) {
        const s0 = (i / steps) * L.length, ds = L.length / steps, v = L.vAtS(s0 + ds / 2), n = L.circ(v) * ds * fillD;
        const cnt = Math.floor(n) + (R() < n - Math.floor(n) ? 1 : 0);
        for (let k = 0; k < cnt; k++) {
          const u = R() * Math.PI * 2, vv = L.vAtS(s0 + R() * ds); const { P, N, g } = L.pn(u, vv);
          const part = cfg.part(u, vv, P, N, g); if (part < 0) continue;
          const o = push(part, P, N, u, vv); const PP = o ? add(P, mul(N, o)) : P;
          emit(0, PP, N, cfg.bones(PP, vv), part, { rad, ...(cfg.extra ? cfg.extra(PP, vv, part) : {}) });
        }
      }
    }
    if (cfg.glyph) {
      // text rows: `sgn` picks the direction of u that reads left-to-right from outside
      const up = cfg.glyph.up || [0, 1, 0], sgn = dot(cross(L.X, L.Z), up) < 0 ? -1 : 1, flip = dot(L.up, up) < 0;
      const rows = Math.floor(L.length / GP_V);
      for (let r = 0; r < rows; r++) {
        const s = (r + 0.5) * GP_V, v = L.vAtS(flip ? s : L.length - s), n = Math.max(3, Math.round(L.circ(v) / GP_U)), u0 = cfg.glyph.seam === undefined ? -Math.PI / 2 : cfg.glyph.seam;
        const rowId = (rowCounter++ * 53) % 4096;
        for (let k = 0; k < n; k++) {
          const u = u0 + sgn * (k + 0.5) / n * Math.PI * 2; const { P, N, g } = L.pn(u, v);
          const part = cfg.part(u, v, P, N, g); if (part < 0) continue;
          if (cfg.glyph.skip && cfg.glyph.skip(P, N, part)) continue;
          const o = push(part, P, N, u, v) + 0.003; const PP = add(P, mul(N, o));
          emit(1, PP, N, cfg.bones(PP, v), part, { grow: rowId, gcol: k, rad: GP_V * 0.5, ...(cfg.extra ? cfg.extra(PP, v, part) : {}) });
        }
      }
    }
  }
  const one = (j) => () => ({ a: j });
  // blend helper along a scalar (e.g. height): returns bones for a 2-bone chain crossing at x0 with half width hw
  const two = (ja, jb, x0, hw) => (x) => { const w = smooth(x0 - hw, x0 + hw, x); return w <= 0 ? { a: ja } : w >= 1 ? { a: jb } : { a: ja, b: jb, w }; };

  // ---------------- torso (midriff skin + black crop top), neck, head ----------------
  const torso = new Loft([
    { c: [0, 0.965, 0.002], rx: 0.128, rz: 0.094 }, { c: [0, 1.02, 0.002], rx: 0.116, rz: 0.086 }, { c: [0, 1.07, 0.003], rx: 0.109, rz: 0.082 },
    { c: [0, 1.14, 0.006], rx: 0.119, rz: 0.089 }, { c: [0, 1.215, 0.012], rx: 0.129, rz: 0.100 }, { c: [0, 1.275, 0.016], rx: 0.134, rz: 0.108 },
    { c: [0, 1.335, 0.006], rx: 0.140, rz: 0.090 }, { c: [0, 1.378, 0.0], rx: 0.112, rz: 0.070 }, { c: [0, 1.40, 0.0], rx: 0.06, rz: 0.052 },
  ]);
  const torsoBones = (P) => { const y = P[1]; if (y < 1.035) return two(J.hips, J.spine, 1.02, 0.035)(y); return two(J.spine, J.chest, 1.15, 0.055)(y); };
  sample(torso, { region: 0, part: (u, v, P) => (P[1] < 1.196 ? PART.SKIN : PART.TOP), bones: torsoBones, glyph: { skip: (P, N, part) => part === PART.SKIN } });
  const neck = new Loft([{ c: [0, 1.36, -0.004], rx: 0.052, rz: 0.05 }, { c: [0, 1.40, 0.0], rx: 0.047, rz: 0.046 }, { c: [0, 1.44, 0.006], rx: 0.044, rz: 0.044 }, { c: [0, 1.485, 0.01], rx: 0.046, rz: 0.046 }]);
  sample(neck, { region: 5, part: (u, v, P) => (P[1] < 1.425 ? PART.TOP : PART.SKIN), bones: (P) => (P[1] < 1.40 ? two(J.chest, J.neck, 1.385, 0.02)(P[1]) : two(J.neck, J.head, 1.455, 0.02)(P[1])), fill: 1.6 });

  // head: small and neat, tall forehead; hair cap = the same loft pushed out a little
  const head = new Loft([
    { c: [0, 1.418, 0.036], rx: 0.016, rz: 0.018 }, { c: [0, 1.432, 0.030], rx: 0.036, rz: 0.042 }, { c: [0, 1.458, 0.020], rx: 0.055, rz: 0.066 },
    { c: [0, 1.495, 0.012], rx: 0.066, rz: 0.082 }, { c: [0, 1.540, 0.006], rx: 0.072, rz: 0.092 }, { c: [0, 1.585, 0.002], rx: 0.073, rz: 0.093 },
    { c: [0, 1.622, -0.002], rx: 0.062, rz: 0.080 }, { c: [0, 1.644, -0.004], rx: 0.040, rz: 0.052 }, { c: [0, 1.652, -0.005], rx: 0.008, rz: 0.010 },
  ]);
  const isHair = (P, N) => {
    const x = Math.abs(P[0]), y = P[1], z = P[2];
    if (z < -0.012) return true;                              // back of the head
    const hairline = 1.612 - 5.5 * x * x - 0.35 * Math.max(0, x - 0.035); // tall open forehead, curtains at the sides
    if (y > hairline) return true;
    if (x > 0.058 + 0.10 * Math.max(0, 1.50 - y) && y > 1.455) return true;   // sides, in front of the ears
    return false;
  };
  const hairRootsCand = [];
  sample(head, {
    region: 5, fill: 2.4, part: (u, v, P, N) => (isHair(P, N) ? PART.HAIR : PART.SKIN), bones: one(J.head),
    push: (part, P, N) => { if (part === PART.HAIR) { if (P[1] > 1.50) hairRootsCand.push({ P: add(P, mul(N, 0.006)), N }); return 0.008; } return 0; },
  });
  // eyes: two calm marks (soft tall almonds). Shown only when the head is large on screen.
  const facePoint = (x, y) => { const v = head.vAt((g) => g.c[1], y), g = head.ring(v); const u = Math.acos(clamp((x - g.c[0]) / g.rx, -1, 1)); return head.pn(u, v); };
  for (const sx of [-1, 1]) {
    const cx = sx * 0.0300, cy = 1.5290, sp = 0.0010;
    // open: a calm tall oval under a soft lash line (variant 4)
    const ew = 0.0084, eh = 0.0128;
    for (let ey = -eh; ey <= eh + 0.004; ey += sp) for (let ex = -0.014; ex <= 0.014; ex += sp) {
      const oval = (ex * ex) / (ew * ew) + (ey * ey) / (eh * eh) <= 1;
      const lx = ex * sx, lash = Math.abs(ey - (eh * 0.86 - 9.0 * (lx - 0.002) * (lx - 0.002) - (lx > 0 ? 22 * lx * lx : 0))) < 0.0013 && lx > -0.0105 && lx < 0.0128;
      if (!oval && !lash) continue;
      const { P, N } = facePoint(cx + ex, cy + ey); emit(3, add(P, mul(N, 0.0015)), N, { a: J.head }, PART.EYE, { rad: sp * 0.95, region: 20, variant: 4 });
    }
    // closed: one gentle downward arc, like sleep (variant 3)
    for (let ex = -0.0112; ex <= 0.0112; ex += sp * 0.8) for (let k = -1; k <= 1; k++) {
      const t = ex / 0.0112, ey = -0.0035 + 0.0042 * t * t + k * 0.0009 * (1 - 0.5 * t * t);
      const { P, N } = facePoint(cx + ex, cy + ey - 0.002); emit(3, add(P, mul(N, 0.0015)), N, { a: J.head }, PART.EYE, { rad: sp * 1.05, region: 20, variant: 3 });
    }
  }

  // ---------------- jacket: cropped puffy bomber ----------------
  const jacket = new Loft([
    { c: [0, 1.146, 0.008], rx: 0.150, rz: 0.114 }, { c: [0, 1.158, 0.009], rx: 0.166, rz: 0.128 }, { c: [0, 1.19, 0.011], rx: 0.184, rz: 0.144 },
    { c: [0, 1.25, 0.012], rx: 0.191, rz: 0.150 }, { c: [0, 1.31, 0.008], rx: 0.185, rz: 0.138 }, { c: [0, 1.358, 0.002], rx: 0.165, rz: 0.106 },
    { c: [0, 1.39, 0.0], rx: 0.098, rz: 0.078 }, { c: [0, 1.412, 0.002], rx: 0.071, rz: 0.068 }, { c: [0, 1.436, 0.004], rx: 0.067, rz: 0.066 },
  ]);
  const STRIPE_Y0 = 1.258, STRIPE_Y1 = 1.300;
  const BACK = { dot: [0.0, 1.296, 0.066], text: { y: 1.203, h: 0.027, w: 0.215 } };
  const gap = (y) => 0.024 + 0.022 * clamp((1.40 - y) / 0.25, 0, 1);
  const jacketPart = (u, v, P, N) => {
    const x = P[0], y = P[1];
    if (N[2] > 0 && Math.abs(x) < gap(y) && y < 1.418) return -1;                 // worn open
    if (y > STRIPE_Y0 && y < STRIPE_Y1 && !(N[2] < -0.15 && Math.abs(x) < 0.150)) return PART.STRIPE;
    return PART.JACKET;
  };
  const inBackArt = (P, N, m) => N[2] < 0 && (Math.hypot(P[0] - BACK.dot[0], P[1] - BACK.dot[1]) < BACK.dot[2] + m || (Math.abs(P[0]) < BACK.text.w / 2 + m && Math.abs(P[1] - BACK.text.y) < BACK.text.h / 2 + m));
  const CHEST_DOT = [0.092, 1.338, 0.021];
  const jacketBones = (P) => { const y = P[1]; const b = two(J.spine, J.chest, 1.17, 0.03)(y); return b; };
  const jLag = (P) => ({ lagW: smooth(1.27, 1.15, P[1]) * 0.6, lagNode: 2 });
  sample(jacket, {
    region: 0, part: jacketPart, bones: jacketBones, extra: jLag,
    glyph: { skip: (P, N, part) => part === PART.STRIPE || inBackArt(P, N, 0.012) || (N[2] > 0 && Math.hypot(P[0] - CHEST_DOT[0], P[1] - CHEST_DOT[1]) < CHEST_DOT[2] + 0.008) },
  });
  // decals on the jacket: back disc, RARE EARTH, small chest dot
  const backPoint = (x, y) => { const v = jacket.vAt((g) => g.c[1], y), g = jacket.ring(v); const u = -Math.acos(clamp((x - g.c[0]) / g.rx, -1, 1)); return jacket.pn(u, v); };
  const frontPoint = (x, y) => { const v = jacket.vAt((g) => g.c[1], y), g = jacket.ring(v); const u = Math.acos(clamp((x - g.c[0]) / g.rx, -1, 1)); return jacket.pn(u, v); };
  {
    const sp = 0.0024, r = BACK.dot[2];
    for (let y = -r; y <= r; y += sp) for (let x = -r; x <= r; x += sp) {
      const xx = x + (R() - 0.5) * sp * 0.6, yy = y + (R() - 0.5) * sp * 0.6; if (xx * xx + yy * yy > r * r) continue;
      const { P, N } = backPoint(BACK.dot[0] + xx, BACK.dot[1] + yy); emit(2, add(P, mul(N, 0.003)), N, jacketBones(P), PART.DOT, { rad: sp * 0.85, ...jLag(P) });
    }
    const cr = CHEST_DOT[2];
    for (let y = -cr; y <= cr; y += sp) for (let x = -cr; x <= cr; x += sp) {
      if (x * x + y * y > cr * cr) continue; const { P, N } = frontPoint(CHEST_DOT[0] + x, CHEST_DOT[1] + y); emit(2, add(P, mul(N, 0.003)), N, jacketBones(P), PART.DOT, { rad: sp * 0.85 });
    }
    const T = BACK.text, W = 1024, H = 128;
    const cov = rasterText((g, w, h) => {
      g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
      try { g.fontStretch = 'expanded'; g.letterSpacing = '10px'; } catch (e) { /* older canvas */ }
      g.font = `800 ${Math.round(h * 0.86)}px "Archivo", "Arial Black", sans-serif`;
      let m = g.measureText('RARE EARTH'); const sc = Math.min(1, (w * 0.97) / m.width); g.font = `800 ${Math.round(h * 0.86 * sc)}px "Archivo", "Arial Black", sans-serif`;
      g.fillText('RARE EARTH', w / 2 + 5, h / 2 + 2);
    }, W, H);
    const tsp = 0.00125;
    for (let y = -T.h / 2; y <= T.h / 2; y += tsp) for (let x = -T.w / 2; x <= T.w / 2; x += tsp) {
      // seen from behind, her left (+X) is on the viewer's left: text runs from +X to -X
      if (cov(0.5 - x / T.w, 0.5 - y / T.h) < 0.5) continue;
      const { P, N } = backPoint(x, T.y + y); emit(2, add(P, mul(N, 0.003)), N, jacketBones(P), PART.TEXT, { rad: tsp * 0.9, ...jLag(P) });
    }
  }

  // sleeves (puffy, gathered at the cuff), built along the rest arm; the right one is mirrored
  for (const side of [1, -1]) {
    const up = side > 0 ? J.upArmL : J.upArmR, fo = side > 0 ? J.foreArmL : J.foreArmR, ha = side > 0 ? J.handL : J.handR;
    const sh = REST_POS[up], dir = norm(sub(REST_POS[fo], sh)), Z = [0, 0, 1], X = norm(cross(dir, Z));
    const at = (d, off = 0) => add(sh, add(mul(dir, d), [0, 0, off]));
    const sleeve = new Loft([
      { c: at(-0.045), rx: 0.052, rz: 0.062 }, { c: at(0.02), rx: 0.067, rz: 0.072 }, { c: at(0.12), rx: 0.069, rz: 0.074 }, { c: at(0.262), rx: 0.065, rz: 0.070 },
      { c: at(0.37, 0.004), rx: 0.073, rz: 0.078 }, { c: at(0.445, 0.006), rx: 0.067, rz: 0.071 }, { c: at(0.482, 0.006), rx: 0.040, rz: 0.042 }, { c: at(0.50, 0.006), rx: 0.034, rz: 0.036 },
    ], X, Z);
    const dOf = (P) => dot(sub(P, sh), dir);
    const PATCH = { d: 0.212, r: 0.033 };
    const outward = (N) => dot(N, [side * 0.75, 0.55, 0.36]); // patch sits on the outer-front of the sleeve
    const patchUV = (P) => { const d = dOf(P) - PATCH.d; const q = sub(sub(P, sh), mul(dir, dOf(P))); return [dot(q, [0, 0, 1]) - 0.03, -d]; }; // x toward front, y up the arm
    const sleeveBones = (P) => {
      const d = dOf(P);
      if (d < 0.07) { const w = smooth(0.075, -0.045, d) * 0.62; return w > 0 ? { a: up, b: J.chest, w } : { a: up }; }
      if (d < 0.40) return two(up, fo, 0.262, 0.055)(d);
      return two(fo, ha, 0.50, 0.012)(d);
    };
    const nearPatch = (P, N, m) => side > 0 && outward(N) > 0.2 && Math.hypot(...patchUV(P)) < PATCH.r + m;
    sample(sleeve, {
      region: side > 0 ? 1 : 2, part: (u, v, P, N) => { if (dOf(P) < 0.0 && Math.abs(P[0]) < 0.150) return -1; const d = dOf(P); return (d > 0.088 && d < 0.130) ? PART.STRIPE : PART.JACKET; },
      bones: sleeveBones, glyph: { up: mul(dir, -1), seam: Math.PI, skip: (P, N, part) => part === PART.STRIPE || nearPatch(P, N, 0.01) },
    });
    if (side > 0) { // the 1420 MHz patch: white disc, black ring, two lines of text
      const W = 256, cov = rasterText((g, w, h) => {
        g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
        g.lineWidth = w * 0.045; g.strokeStyle = '#fff'; g.beginPath(); g.arc(w / 2, h / 2, w * 0.455, 0, 7); g.stroke();
        g.font = `800 ${Math.round(h * 0.27)}px "Archivo", "Arial Black", sans-serif`; g.fillText('1420', w / 2, h * 0.375);
        g.font = `800 ${Math.round(h * 0.24)}px "Archivo", "Arial Black", sans-serif`; g.fillText('MHz', w / 2, h * 0.645);
      }, W, W);
      const sp = 0.00115;
      for (let v = 0; v < sleeve.n - 1; v += 0.004) {
        const g = sleeve.ring(v), n = Math.round(sleeve.circ(v) / sp);
        for (let k = 0; k < n; k++) {
          const u = (k / n) * Math.PI * 2; const { P, N } = sleeve.pn(u, v); if (outward(N) < 0.2) continue;
          const q = patchUV(P), rr = Math.hypot(q[0], q[1]); if (rr > PATCH.r) continue;
          if (R() > 0.35) continue; // v step is finer than sp: thin to an even density
          const dark = cov(0.5 + q[0] / (2 * PATCH.r), 0.5 - q[1] / (2 * PATCH.r)) > 0.5;
          emit(2, add(P, mul(N, 0.003)), N, sleeveBones(P), dark ? PART.PTEXT : PART.PATCH, { rad: sp * 1.25 });
        }
      }
    }
    // hand: palm + fingers (mitten)
    const hq = REST_Q[ha], hp = REST_POS[ha];
    const hX = norm(cross(dir, Z)), hand = new Loft([
      { c: add(hp, mul(dir, -0.012)), rx: 0.021, rz: 0.027 }, { c: add(hp, mul(dir, 0.03)), rx: 0.020, rz: 0.040 }, { c: add(hp, mul(dir, 0.078)), rx: 0.019, rz: 0.046 },
      { c: add(hp, mul(dir, 0.125)), rx: 0.016, rz: 0.041 }, { c: add(hp, mul(dir, 0.165)), rx: 0.012, rz: 0.030 }, { c: add(hp, mul(dir, 0.182)), rx: 0.004, rz: 0.010 },
    ], hX, Z);
    sample(hand, { region: side > 0 ? 10 : 11, fill: 2.2, part: () => PART.SKIN, bones: one(ha) });
  }

  // ---------------- trousers: very wide navy cargo ----------------
  const pelvis = new Loft([
    { c: [0, 0.79, 0.004], rx: 0.224, rz: 0.138 }, { c: [0, 0.85, 0.004], rx: 0.206, rz: 0.136 }, { c: [0, 0.915, 0.003], rx: 0.176, rz: 0.124 },
    { c: [0, 0.965, 0.002], rx: 0.150, rz: 0.109 }, { c: [0, 0.985, 0.002], rx: 0.141, rz: 0.104 }, { c: [0, 1.012, 0.002], rx: 0.137, rz: 0.101 },
  ]);
  const pelvisBones = (P) => { const w = smooth(0.90, 0.79, P[1]) * 0.62; return w > 0 ? { a: J.hips, b: P[0] > 0 ? J.thighL : J.thighR, w } : { a: J.hips }; };
  sample(pelvis, { region: 6, part: (u, v, P) => (P[1] > 0.972 ? PART.BELT : PART.TROUSER), bones: pelvisBones, glyph: { skip: (P, N, part) => part === PART.BELT } });
  for (const side of [1, -1]) {
    const th = side > 0 ? J.thighL : J.thighR, sn = side > 0 ? J.shinL : J.shinR;
    const leg = new Loft([
      { c: [side * 0.140, 0.040, 0.014], rx: 0.116, rz: 0.146 }, { c: [side * 0.141, 0.085, 0.013], rx: 0.126, rz: 0.156 }, { c: [side * 0.136, 0.27, 0.008], rx: 0.124, rz: 0.150 },
      { c: [side * 0.127, 0.487, 0.006], rx: 0.119, rz: 0.141 }, { c: [side * 0.117, 0.70, 0.004], rx: 0.113, rz: 0.134 }, { c: [side * 0.108, 0.87, 0.004], rx: 0.112, rz: 0.127 },
    ]);
    const pocket = (P, N) => { const o = N[0] * side; const y = P[1]; if (o > 0.52 && y > 0.555 && y < 0.745 && Math.abs(P[2] - 0.005) < 0.085) return 1; if (o > 0.60 && y > 0.25 && y < 0.40 && Math.abs(P[2] - 0.01) < 0.075) return 2; return 0; };
    sample(leg, {
      region: side > 0 ? 3 : 4, part: (u, v, P, N) => (P[1] > 0.80 && Math.abs(P[0]) < 0.11 ? -1 : pocket(P, N) ? PART.POCKET : PART.TROUSER),
      push: (part, P, N) => { const k = pocket(P, N); return k === 1 ? 0.022 : k === 2 ? 0.017 : 0; },
      bones: (P) => { const y = P[1]; if (y > 0.76) { const w = smooth(0.78, 0.90, y) * 0.5; return w > 0 ? { a: th, b: J.hips, w } : { a: th }; } return two(sn, th, 0.487, 0.09)(y); },
      extra: (P) => ({ lagW: Math.pow(smooth(0.56, 0.05, P[1]), 1.25), lagNode: side > 0 ? 0 : 1 }),
      glyph: {},
    });
    // inner leg (dark), so an open hem is not hollow
    const core = new Loft([{ c: REST_POS[side > 0 ? J.footL : J.footR], rx: 0.036, rz: 0.040 }, { c: lerp3(REST_POS[sn], REST_POS[side > 0 ? J.footL : J.footR], 0.5), rx: 0.05, rz: 0.055 }, { c: REST_POS[sn], rx: 0.055, rz: 0.06 }]);
    sample(core, { region: side > 0 ? 3 : 4, fill: 0.6, part: () => PART.TOP, bones: one(sn) });

    // chunky trainer: upper + thick sole. Built along +Z from heel to toe.
    const an = REST_POS[side > 0 ? J.footL : J.footR], fx = an[0] + side * 0.004, ft = side > 0 ? J.footL : J.footR, toe = side > 0 ? J.toeL : J.toeR;
    const shoe = new Loft([
      { c: [fx, 0.050, an[2] - 0.082], rx: 0.012, rz: 0.020 }, { c: [fx, 0.062, an[2] - 0.066], rx: 0.045, rz: 0.062 }, { c: [fx, 0.066, an[2] - 0.01], rx: 0.055, rz: 0.066 },
      { c: [fx, 0.058, an[2] + 0.07], rx: 0.059, rz: 0.058 }, { c: [fx, 0.046, an[2] + 0.145], rx: 0.059, rz: 0.046 }, { c: [fx, 0.038, an[2] + 0.198], rx: 0.045, rz: 0.038 }, { c: [fx, 0.034, an[2] + 0.218], rx: 0.010, rz: 0.012 },
    ], [1, 0, 0], [0, 1, 0]);
    const shoeBones = (P) => two(ft, toe, an[2] + 0.125, 0.03)(P[2]);
    sample(shoe, { region: side > 0 ? 7 : 8, fill: 1.5, part: (u, v, P) => (P[1] < 0.002 ? -1 : P[1] < 0.036 ? PART.SOLE : PART.SHOE), bones: shoeBones });
  }

  // ---------------- headphones round the neck ----------------
  for (const side of [1, -1]) {
    const c = [side * 0.079, 1.388, 0.050], ax = norm([side * 0.80, 0.22, 0.56]), t1 = norm(cross(ax, [0, 1, 0])), t2 = cross(ax, t1);
    const hb = { a: J.chest, b: J.neck, w: 0.35 };
    for (let i = 0; i < 2600; i++) {
      const a = R() * Math.PI * 2, face = R() < 0.42, rr = face ? Math.sqrt(R()) * 0.043 : 0.043, h = face ? 0.019 : (R() - 0.35) * 0.03;
      const P = add(c, add(mul(ax, h), add(mul(t1, Math.cos(a) * rr), mul(t2, Math.sin(a) * rr))));
      const N = face ? ax : norm(add(mul(t1, Math.cos(a)), mul(t2, Math.sin(a))));
      emit(0, P, N, hb, face && rr < 0.034 ? PART.PHONE : (face ? PART.PHONEBLK : (h > 0.004 ? PART.PHONE : PART.PHONEBLK)), { rad: 0.0036 });
    }
  }
  for (let i = 0; i < 2600; i++) { // band behind the neck
    const a = Math.PI * (0.02 + 0.96 * R()), b = R() * Math.PI * 2, rr = 0.011;
    const cen = [Math.cos(a) * 0.082, 1.398 + 0.012 * Math.sin(a), 0.035 - Math.sin(a) * 0.105], out3 = norm([Math.cos(a), 0, -Math.sin(a)]);
    const N = norm(add(mul(out3, Math.cos(b)), mul([0, 1, 0], Math.sin(b))));
    emit(0, add(cen, mul(N, rr)), N, { a: J.chest, b: J.neck, w: 0.35 }, PART.PHONE, { rad: 0.0034 });
  }

  // ---------------- the violet branch: a bun and two crossed pencils (variant 2) ----------------
  const BUN = [0, 1.668, -0.052], BR = 0.050;
  for (let i = 0; i < 5200; i++) {
    const z = 2 * R() - 1, a = R() * Math.PI * 2, s = Math.sqrt(1 - z * z), N = [s * Math.cos(a), z, s * Math.sin(a)];
    emit(0, add(BUN, [N[0] * BR, N[1] * BR * 0.86, N[2] * BR]), N, { a: J.head }, PART.BUN, { variant: 2, rad: 0.0042 });
  }
  for (const side of [1, -1]) {
    const ax = norm([side * 0.80, 0.52, -0.30]), t1 = norm(cross(ax, [0, 0, 1])), t2 = cross(ax, t1), L = 0.21, c0 = add(BUN, mul(ax, -0.085));
    for (let i = 0; i < 2400; i++) {
      const h = R() * L, a = R() * Math.PI * 2, tip = h > L - 0.022, ras = h < 0.02, rr = tip ? 0.0048 * (L - h) / 0.022 : 0.0048;
      const N = norm(add(mul(t1, Math.cos(a)), mul(t2, Math.sin(a))));
      emit(0, add(c0, add(mul(ax, h), mul(N, rr))), N, { a: J.head }, tip ? (h > L - 0.008 ? PART.LEAD : PART.SKIN) : ras ? PART.ERASER : PART.PENCIL, { variant: 2, rad: 0.0024 });
    }
  }

  // ---------------- hair roots / guides ----------------
  // candidates were collected on the hair cap above y = 1.50. Guides: farthest-point sampled on her left, mirrored.
  const left = hairRootsCand.filter((c) => c.P[0] > 0.003), guides = [];
  const pick = (pool, n, first) => { const sel = [first]; const d = pool.map((c) => len(sub(c.P, first.P))); for (let k = 1; k < n; k++) { let bi = 0, bd = -1; for (let i = 0; i < pool.length; i++) if (d[i] > bd) { bd = d[i]; bi = i; } sel.push(pool[bi]); for (let i = 0; i < pool.length; i++) d[i] = Math.min(d[i], len(sub(pool[i].P, pool[bi].P))); } return sel; };
  const crown = left.reduce((a, b) => (b.P[1] > a.P[1] ? b : a));
  // Hair is combed: each guide first runs over the scalp (pinned to the head), sideways from the centre part and
  // down behind the temple, and only then hangs free. So the face stays open and the hair frames it.
  const onScalp = (Q, off) => { const y = clamp(Q[1], 1.44, 1.648), v = head.vAt((g) => g.c[1], y), g = head.ring(v); const u = Math.atan2((Q[2] - g.c[2]) / g.rz, (Q[0] - g.c[0]) / g.rx); const q = head.pn(u, v); return add(q.P, mul(q.N, off)); };
  const scalpPath = (root, seg, off) => {
    const pins = [root]; let P = root; const sx = root[0] >= 0 ? 1 : -1, isFront = root[2] > 0.050;
    for (let k = 0; k < HAIR.NODES - 6; k++) {
      const ax = Math.abs(P[0]), front = smooth(-0.03, 0.03, P[2]), lat = 1 - smooth(0.050, 0.072, ax);
      if (P[1] < 1.512 && lat < 0.5) break;
      if (P[1] < 1.47) break;
      const d = norm([sx * (0.10 + 0.95 * lat), -(1.0 - 0.80 * lat * front), isFront ? (-0.30 * lat + 0.10 * (1 - lat)) : (-0.42 - 0.2 * lat)]);
      P = onScalp(add(P, mul(d, seg)), off); pins.push(P);
    }
    return pins;
  };
  for (const g of pick(left, HAIR.G_LONG / 2, crown)) {
    const off = 0.006 + 0.004 * R(), free = 0.50 + 0.035 * R() - (g.P[2] > 0.02 ? 0.03 : 0); let seg = 0.056, pins;
    for (let it = 0; it < 3; it++) { pins = scalpPath(g.P, seg, off); seg = ((pins.length - 1) * seg + free) / (HAIR.NODES - 1); }
    for (const s of [1, -1]) guides.push({ root: [g.P[0] * s, g.P[1], g.P[2]], n: [g.N[0] * s, g.N[1], g.N[2]], length: seg * (HAIR.NODES - 1), pins: pins.map((q) => [q[0] * s, q[1], q[2]]), short: false });
  }
  for (const s of [1, -1]) for (const dz of [0.058, 0.03]) { // loose temple strands (bun variant)
    const v = head.vAt((g) => g.c[1], 1.588), g = head.ring(v), u = Math.atan2(dz / g.rz, s * 0.80); const { P, N } = head.pn(u, v);
    const root = add(P, mul(N, 0.006)); guides.push({ root, n: N, length: 0.17 + 0.05 * R(), pins: [root], short: true });
  }
  // render strands: root + up to 3 nearest guides on the same side
  const strands = [], NS = opts.strands || 900;
  const weight = (c) => 0.35 + smooth(1.50, 1.62, c.P[1]);
  for (let i = 0; i < NS * 40 && strands.length < NS; i++) {
    const c = hairRootsCand[Math.floor(R() * hairRootsCand.length)]; if (R() > weight(c) / 1.35) continue;
    const near = guides.map((g, gi) => ({ gi, d: len(sub(g.root, c.P)) + (g.short ? 9 : 0) + (g.root[0] * c.P[0] < 0 && Math.abs(c.P[0]) > 0.006 ? 9 : 0) })).sort((a, b) => a.d - b.d).slice(0, 3);
    let w = near.map((n) => 1 / (1e-4 + n.d * n.d)); const ws = w[0] + w[1] + w[2]; w = w.map((x) => x / ws);
    strands.push({ root: c.P, g: near.map((n) => n.gi), w, seed: R(), short: false });
  }
  for (let k = 0; k < 4; k++) for (let i = 0; i < 9; i++) { const g = guides[HAIR.G_LONG + k]; strands.push({ root: add(g.root, [(R() - 0.5) * 0.012, (R() - 0.5) * 0.008, (R() - 0.5) * 0.012]), g: [HAIR.G_LONG + k, HAIR.G_LONG + k, HAIR.G_LONG + k], w: [1, 0, 0], seed: R(), short: true }); }

  // ---------------- straps (simulated chains; rendered as ribbons) ----------------
  const straps = [
    { bone: J.hips, root: [0.058, 0.975, 0.108], length: 0.43, width: 0.030 },
    { bone: J.thighL, root: [0.246, 0.725, 0.012], length: 0.47, width: 0.030 },
    { bone: J.thighR, root: [-0.246, 0.725, 0.012], length: 0.47, width: 0.030 },
  ].map((s) => ({ ...s, local: toLocal(s.bone, s.root) }));

  // ---------------- pack ----------------
  const pack = (list) => {
    // stable shuffle so that any prefix is an even subset (LOD)
    const idx = list.map((_, i) => i); const r2 = rng(777 + list.length); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(r2() * (i + 1)); const t = idx[i]; idx[i] = idx[j]; idx[j] = t; }
    return idx.map((i) => list[i]);
  };
  const all = [...pack(out[0]), ...pack(out[1]), ...pack(out[2]), ...pack(out[3])];
  const n = all.length, A = { la: new Float32Array(n * 4), lb: new Float32Array(n * 4), nn: new Float32Array(n * 4), bn: new Float32Array(n * 4), fx: new Float32Array(n * 4), sz: new Float32Array(n * 2) };
  all.forEach((p, i) => {
    A.la.set([p.la[0], p.la[1], p.la[2], p.part], i * 4); A.lb.set([p.lb[0], p.lb[1], p.lb[2], p.w], i * 4); A.nn.set([p.n[0], p.n[1], p.n[2], p.seed], i * 4);
    A.bn.set([p.a, p.b, p.grow, p.gcol], i * 4); A.fx.set([p.lagW, p.lagNode, p.variant, p.kind], i * 4); A.sz[i * 2] = p.rad; A.sz[i * 2 + 1] = p.region;
  });
  const ranges = { fill: [0, out[0].length], glyph: [out[0].length, out[1].length], decal: [out[0].length + out[1].length, out[2].length], eye: [out[0].length + out[1].length + out[2].length, out[3].length] };
  return { count: n, attrs: A, ranges, guides, strands, straps, headLocal: (P) => toLocal(J.head, P) };
}
