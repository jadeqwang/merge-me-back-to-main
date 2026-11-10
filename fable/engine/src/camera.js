// mat4 (column-major Float32Array) + camera. Units metres, Y up, +X east.
export const m4 = {
  ident() { const m = new Float32Array(16); m[0] = m[5] = m[10] = m[15] = 1; return m; },
  mul(a, b) { const o = new Float32Array(16); for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) { let s = 0; for (let k = 0; k < 4; k++) s += a[k * 4 + r] * b[c * 4 + k]; o[c * 4 + r] = s; } return o; },
  perspective(fovY, aspect, near, far, jx = 0, jy = 0) {
    const f = 1 / Math.tan(fovY / 2), o = new Float32Array(16);
    o[0] = f / aspect; o[5] = f; o[10] = (far + near) / (near - far); o[11] = -1; o[14] = (2 * far * near) / (near - far);
    o[8] = jx; o[9] = jy; // sub-pixel jitter in NDC (for accumulation AA)
    return o;
  },
  lookAt(e, c, up) {
    let zx = e[0] - c[0], zy = e[1] - c[1], zz = e[2] - c[2]; let l = Math.hypot(zx, zy, zz) || 1; zx /= l; zy /= l; zz /= l;
    let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx; l = Math.hypot(xx, xy, xz) || 1; xx /= l; xy /= l; xz /= l;
    const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
    const o = new Float32Array(16);
    o[0] = xx; o[1] = yx; o[2] = zx; o[4] = xy; o[5] = yy; o[6] = zy; o[8] = xz; o[9] = yz; o[10] = zz;
    o[12] = -(xx * e[0] + xy * e[1] + xz * e[2]); o[13] = -(yx * e[0] + yy * e[1] + yz * e[2]); o[14] = -(zx * e[0] + zy * e[1] + zz * e[2]); o[15] = 1;
    return o;
  },
  scale(x, y, z) { const m = m4.ident(); m[0] = x; m[5] = y; m[10] = z; return m; },
  invert(m) {
    const o = new Float32Array(16);
    const a00 = m[0], a01 = m[1], a02 = m[2], a03 = m[3], a10 = m[4], a11 = m[5], a12 = m[6], a13 = m[7], a20 = m[8], a21 = m[9], a22 = m[10], a23 = m[11], a30 = m[12], a31 = m[13], a32 = m[14], a33 = m[15];
    const b00 = a00 * a11 - a01 * a10, b01 = a00 * a12 - a02 * a10, b02 = a00 * a13 - a03 * a10, b03 = a01 * a12 - a02 * a11, b04 = a01 * a13 - a03 * a11, b05 = a02 * a13 - a03 * a12;
    const b06 = a20 * a31 - a21 * a30, b07 = a20 * a32 - a22 * a30, b08 = a20 * a33 - a23 * a30, b09 = a21 * a32 - a22 * a31, b10 = a21 * a33 - a23 * a31, b11 = a22 * a33 - a23 * a32;
    let det = b00 * b11 - b01 * b10 + b02 * b09 + b03 * b08 - b04 * b07 + b05 * b06; det = 1 / det;
    o[0] = (a11 * b11 - a12 * b10 + a13 * b09) * det; o[1] = (a02 * b10 - a01 * b11 - a03 * b09) * det; o[2] = (a31 * b05 - a32 * b04 + a33 * b03) * det; o[3] = (a22 * b04 - a21 * b05 - a23 * b03) * det;
    o[4] = (a12 * b08 - a10 * b11 - a13 * b07) * det; o[5] = (a00 * b11 - a02 * b08 + a03 * b07) * det; o[6] = (a32 * b02 - a30 * b05 - a33 * b01) * det; o[7] = (a20 * b05 - a22 * b02 + a23 * b01) * det;
    o[8] = (a10 * b10 - a11 * b08 + a13 * b06) * det; o[9] = (a01 * b08 - a00 * b10 - a03 * b06) * det; o[10] = (a30 * b04 - a31 * b02 + a33 * b00) * det; o[11] = (a21 * b02 - a20 * b04 - a23 * b00) * det;
    o[12] = (a11 * b07 - a10 * b09 - a12 * b06) * det; o[13] = (a00 * b09 - a01 * b07 + a02 * b06) * det; o[14] = (a31 * b01 - a30 * b03 - a32 * b00) * det; o[15] = (a20 * b03 - a21 * b01 + a22 * b00) * det;
    return o;
  },
};
export const v3 = {
  add: (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub: (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul: (a, s) => [a[0] * s, a[1] * s, a[2] * s],
  dot: (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross: (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]],
  len: (a) => Math.hypot(a[0], a[1], a[2]), norm: (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; },
  lerp: (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u],
};

// Camera description (what a show returns from frame(t)):
//   { pos:[x,y,z], target:[x,y,z], up?:[0,1,0], fov?:deg vertical (35), roll?:deg, near?:0.1, far?:30000,
//     focusDist?:metres (default |target-pos|), aperture?:0 (DoF strength; coc_px = aperture*|1/focus-1/dist|*H) }
export function buildCamera(c, W, H, jx = 0, jy = 0) {
  const pos = c.pos, target = c.target; let up = c.up || [0, 1, 0];
  const fwd = v3.norm(v3.sub(target, pos));
  // near vertical the up vector blends to topUp (default east = screen-up), so a crane from top-down into a level shot never snaps
  { const d = Math.abs(v3.dot(fwd, up)); if (d > 0.96) { const w = Math.min(1, (d - 0.96) / 0.035), tu = c.topUp || [1, 0, 0]; const ww = w * w * (3 - 2 * w); up = v3.norm([up[0] * (1 - ww) + tu[0] * ww, up[1] * (1 - ww) + tu[1] * ww, up[2] * (1 - ww) + tu[2] * ww]); } }
  if (c.roll) { const r = (c.roll * Math.PI) / 180; const right = v3.norm(v3.cross(fwd, up)); const u2 = v3.cross(right, fwd); up = v3.add(v3.mul(u2, Math.cos(r)), v3.mul(right, Math.sin(r))); }
  const fovY = ((c.fov || 35) * Math.PI) / 180, near = c.near || 0.1, far = c.far || 30000;
  const view = m4.lookAt(pos, target, up);
  const proj = m4.perspective(fovY, W / H, near, far, (2 * jx) / W, (2 * jy) / H);
  const viewProj = m4.mul(proj, view);
  const mirror = m4.scale(1, -1, 1);
  const viewR = m4.mul(view, mirror), viewProjR = m4.mul(proj, viewR);
  return { pos, target, up, fovY, near, far, view, proj, viewProj, invViewProj: m4.invert(viewProj), viewR, viewProjR,
    focusDist: c.focusDist || v3.len(v3.sub(target, pos)), aperture: c.aperture || 0 };
}

// Smooth camera path: keys [{t, pos, target, fov?, roll?, focusDist?, aperture?, stop?}].
// Monotone cubic (Fritsch-Carlson) per component in time: passes through every key, never overshoots between keys, no shake.
// The camera is moving at the first and last key (so a cut lands on motion); give a key `stop:true` to arrive/leave at rest there.
function pchip(ts, ys, stops) {
  const n = ts.length, d = new Array(n - 1), m = new Array(n);
  for (let i = 0; i < n - 1; i++) d[i] = (ys[i + 1] - ys[i]) / (ts[i + 1] - ts[i]);
  if (n === 2) { m[0] = m[1] = d[0]; }
  else {
    for (let i = 1; i < n - 1; i++) { if (d[i - 1] * d[i] <= 0) m[i] = 0; else { const h0 = ts[i] - ts[i - 1], h1 = ts[i + 1] - ts[i]; const w1 = 2 * h1 + h0, w2 = h1 + 2 * h0; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); } }
    m[0] = d[0]; m[n - 1] = d[n - 2];
  }
  for (let i = 0; i < n; i++) if (stops[i]) m[i] = 0;
  return (t, i) => { const h = ts[i + 1] - ts[i], u = (t - ts[i]) / h, u2 = u * u, u3 = u2 * u; return (2 * u3 - 3 * u2 + 1) * ys[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * ys[i + 1] + (u3 - u2) * h * m[i + 1]; };
}
export function camPath(keys) {
  const K = keys.slice().sort((a, b) => a.t - b.t), ts = K.map((k) => k.t), stops = K.map((k) => !!k.stop);
  const num = (k, f, d) => (k[f] === undefined ? d : k[f]);
  const dist = (k) => v3.len(v3.sub(k.target, k.pos));
  const ch = {}; const add = (name, get) => { ch[name] = pchip(ts, K.map(get), stops); };
  for (let j = 0; j < 3; j++) { add('p' + j, (k) => k.pos[j]); add('q' + j, (k) => k.target[j]); }
  add('fov', (k) => num(k, 'fov', 35)); add('roll', (k) => num(k, 'roll', 0)); add('ap', (k) => num(k, 'aperture', 0)); add('fd', (k) => num(k, 'focusDist', dist(k)));
  const hasFocus = K.some((k) => k.focusDist !== undefined);
  return function (t) {
    if (K.length === 1) return { ...K[0] };
    const tc = Math.min(ts[ts.length - 1], Math.max(ts[0], t)); let i = 0; while (i < K.length - 2 && ts[i + 1] <= tc) i++;
    const o = { pos: [ch.p0(tc, i), ch.p1(tc, i), ch.p2(tc, i)], target: [ch.q0(tc, i), ch.q1(tc, i), ch.q2(tc, i)], fov: ch.fov(tc, i), roll: ch.roll(tc, i), aperture: Math.max(0, ch.ap(tc, i)) };
    if (hasFocus) o.focusDist = Math.max(0.05, ch.fd(tc, i));
    return o;
  };
}
