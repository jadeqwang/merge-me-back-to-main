// Secondary motion, simulated once over a whole track (deterministic): hair guide strands, strap chains,
// trouser-hem and jacket-hem lag. Output: one row of SIMW texels (xyz) per frame.
//   hair + strap nodes are stored relative to the hips joint of that frame (half-float friendly);
//   lag nodes are plain offset vectors in track space.
import { J, NJ, STRIDE, REST_POS, toLocal, BONE_LEN } from './skeleton.js';
import { HAIR } from './body.js';

export const STRAP_N = 8, N_STRAPS = 3;
export const SIM = (() => {
  const G = HAIR.G_LONG + HAIR.G_SHORT, hair = 0, strap = G * HAIR.NODES, lag = strap + N_STRAPS * STRAP_N;
  return { G, hair, strap, lag, W: lag + 4 };
})();

const cap = (bone, a, b, r) => ({ bone, a: toLocal(bone, a), b: toLocal(bone, b), r });
const HAIR_COL = [
  cap(J.head, [0, 1.498, 0.012], [0, 1.578, 0.0], 0.0875),
  cap(J.neck, [0, 1.38, 0.0], [0, 1.46, 0.008], 0.056),
  cap(J.chest, [-0.165, 1.338, 0], [0.165, 1.338, 0], 0.080),
  cap(J.chest, [-0.072, 1.262, 0.010], [0.072, 1.262, 0.010], 0.146),
  cap(J.chest, [-0.066, 1.195, 0.010], [0.066, 1.195, 0.010], 0.138),
  cap(J.upArmL, REST_POS[J.upArmL], REST_POS[J.foreArmL], 0.090), cap(J.upArmR, REST_POS[J.upArmR], REST_POS[J.foreArmR], 0.090),
  cap(J.foreArmL, REST_POS[J.foreArmL], REST_POS[J.handL], 0.086), cap(J.foreArmR, REST_POS[J.foreArmR], REST_POS[J.handR], 0.086),
  cap(J.spine, [0, 1.06, 0], [0, 1.12, 0.004], 0.108),
  cap(J.hips, [-0.075, 0.93, 0], [0.075, 0.93, 0], 0.142),
];
const STRAP_COL = [
  cap(J.hips, [-0.075, 0.93, 0], [0.075, 0.93, 0], 0.140),
  cap(J.thighL, [0.108, 0.87, 0.004], [0.120, 0.49, 0.006], 0.128), cap(J.thighR, [-0.108, 0.87, 0.004], [-0.120, 0.49, 0.006], 0.128),
  cap(J.shinL, [0.120, 0.49, 0.006], [0.128, 0.07, 0.012], 0.150), cap(J.shinR, [-0.120, 0.49, 0.006], [-0.128, 0.07, 0.012], 0.150),
];

export function simulate(track, body, opts = {}) {
  const o = { wind: [-0.22, 0, 0.05], gust: 0.6, gravity: 9.8, substeps: 3, iters: 5, drag: 0.02, preroll: 150, ...(track.simOpts || {}), ...opts };
  const F = track.frames, D = track.data, G = SIM.G, N = HAIR.NODES, W = SIM.W;
  const out = new Float32Array(F * W * 4);
  const guides = body.guides, straps = body.straps;
  const loopD = track.loop ? (track.loopDelta || [0, 0]) : [0, 0];

  // joint transform at a (fractional, possibly wrapped) frame -> scratch arrays
  const jp = new Float64Array(NJ * 3), jq = new Float64Array(NJ * 4);
  function pose(ff) {
    let lap = 0, f = ff;
    if (track.loop) { lap = Math.floor(f / F); f -= lap * F; } else f = Math.min(Math.max(f, 0), F - 1);
    let f0 = Math.floor(f), f1 = f0 + 1, t = f - f0, lap1 = 0;
    if (f1 >= F) { if (track.loop) { f1 = 0; lap1 = 1; } else f1 = F - 1; }
    const a = f0 * STRIDE, b = f1 * STRIDE;
    for (let j = 0; j < NJ; j++) {
      const ia = a + j * 7, ib = b + j * 7;
      jp[j * 3] = D[ia] + (D[ib] + lap1 * loopD[0] - D[ia]) * t + lap * loopD[0];
      jp[j * 3 + 1] = D[ia + 1] + (D[ib + 1] - D[ia + 1]) * t;
      jp[j * 3 + 2] = D[ia + 2] + (D[ib + 2] + lap1 * loopD[1] - D[ia + 2]) * t + lap * loopD[1];
      let x0 = D[ia + 3], y0 = D[ia + 4], z0 = D[ia + 5], w0 = D[ia + 6], x1 = D[ib + 3], y1 = D[ib + 4], z1 = D[ib + 5], w1 = D[ib + 6];
      if (x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1 < 0) { x1 = -x1; y1 = -y1; z1 = -z1; w1 = -w1; }
      let x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, z = z0 + (z1 - z0) * t, w = w0 + (w1 - w0) * t; const l = Math.hypot(x, y, z, w) || 1;
      jq[j * 4] = x / l; jq[j * 4 + 1] = y / l; jq[j * 4 + 2] = z / l; jq[j * 4 + 3] = w / l;
    }
  }
  const tmp = [0, 0, 0];
  function world(j, v, dst, di) { // dst[di..] = pos_j + q_j * v
    const x = jq[j * 4], y = jq[j * 4 + 1], z = jq[j * 4 + 2], w = jq[j * 4 + 3];
    const tx = 2 * (y * v[2] - z * v[1]), ty = 2 * (z * v[0] - x * v[2]), tz = 2 * (x * v[1] - y * v[0]);
    dst[di] = jp[j * 3] + v[0] + w * tx + (y * tz - z * ty); dst[di + 1] = jp[j * 3 + 1] + v[1] + w * ty + (z * tx - x * tz); dst[di + 2] = jp[j * 3 + 2] + v[2] + w * tz + (x * ty - y * tx);
  }
  const colW = (list) => ({ list, a: new Float64Array(list.length * 3), b: new Float64Array(list.length * 3) });
  const HC = colW(HAIR_COL), SC = colW(STRAP_COL);
  const updCol = (C) => { C.list.forEach((c, i) => { world(c.bone, c.a, C.a, i * 3); world(c.bone, c.b, C.b, i * 3); }); };
  function collide(C, x, xp, i, pad, fric) {
    for (let c = 0; c < C.list.length; c++) {
      const ax = C.a[c * 3], ay = C.a[c * 3 + 1], az = C.a[c * 3 + 2], bx = C.b[c * 3] - ax, by = C.b[c * 3 + 1] - ay, bz = C.b[c * 3 + 2] - az;
      const px = x[i] - ax, py = x[i + 1] - ay, pz = x[i + 2] - az, bb = bx * bx + by * by + bz * bz;
      let t = bb > 1e-9 ? (px * bx + py * by + pz * bz) / bb : 0; t = t < 0 ? 0 : t > 1 ? 1 : t;
      const dx = px - bx * t, dy = py - by * t, dz = pz - bz * t, d2 = dx * dx + dy * dy + dz * dz, r = C.list[c].r + pad;
      if (d2 < r * r) {
        const d = Math.sqrt(d2) || 1e-6, k = (r - d) / d; x[i] += dx * k; x[i + 1] += dy * k; x[i + 2] += dz * k;
        xp[i] += (x[i] - xp[i]) * fric; xp[i + 1] += (x[i + 1] - xp[i + 1]) * fric; xp[i + 2] += (x[i + 2] - xp[i + 2]) * fric;
      }
    }
  }

  // --- state ---
  const hx = new Float64Array(G * N * 3), hp = new Float64Array(G * N * 3), seg = new Float64Array(G);
  const sx = new Float64Array(N_STRAPS * STRAP_N * 3), sp = new Float64Array(N_STRAPS * STRAP_N * 3);
  const lagX = new Float64Array(9), lagV = new Float64Array(9), lagT = new Float64Array(9);
  const pinL = guides.map((g) => (g.pins || [g.root]).map((q) => toLocal(J.head, q))), pinN = pinL.map((p) => p.length);
  pose(0);
  for (let g = 0; g < G; g++) {
    seg[g] = guides[g].length / (N - 1);
    for (let n = 0; n < pinN[g]; n++) world(J.head, pinL[g][n], hx, (g * N + n) * 3);
    for (let n = pinN[g]; n < N; n++) { const i = (g * N + n) * 3; hx[i] = hx[i - 3] + guides[g].n[0] * 0.004; hx[i + 1] = hx[i - 2] - seg[g]; hx[i + 2] = hx[i - 1] + guides[g].n[2] * 0.004; }
  }
  hp.set(hx);
  for (let s = 0; s < N_STRAPS; s++) { world(straps[s].bone, straps[s].local, sx, s * STRAP_N * 3); for (let n = 1; n < STRAP_N; n++) { const i = (s * STRAP_N + n) * 3; sx[i] = sx[i - 3]; sx[i + 1] = sx[i - 2] - straps[s].length / (STRAP_N - 1); sx[i + 2] = sx[i - 1]; } }
  sp.set(sx);
  const lagTargets = () => { for (const [k, j] of [[0, J.footL], [1, J.footR], [2, J.chest]]) { lagT[k * 3] = jp[j * 3]; lagT[k * 3 + 1] = jp[j * 3 + 1]; lagT[k * 3 + 2] = jp[j * 3 + 2]; } };
  lagTargets(); lagX.set(lagT);

  const frontG = guides.map((g) => (g.short ? 1 : -1));   // long hair falls behind the shoulders; motion brings it forward
  const sub = o.substeps, dt = 1 / (track.fps * sub), dt2 = dt * dt;
  const gseed = guides.map((g, i) => (i * 12.9898) % 6.283);
  function step(ff, time) {
    pose(ff); updCol(HC); updCol(SC);
    // hair
    for (let g = 0; g < G; g++) {
      const gust = 1 + o.gust * (0.6 * Math.sin(time * 1.7 + gseed[g]) + 0.4 * Math.sin(time * 4.3 + gseed[g] * 2.1));
      const ax = o.wind[0] * gust, ay = -o.gravity + o.wind[1] * gust, az = o.wind[2] * gust + 0.25 * Math.sin(time * 2.9 + gseed[g] * 1.3) * o.gust;
      const b = g * N * 3;
      const pn = pinN[g];
      const cq = J.chest * 4, cy = jp[J.chest * 3 + 1], qx = jq[cq], qy = jq[cq + 1], qz = jq[cq + 2], qw = jq[cq + 3];
      const fwx = 2 * (qx * qz + qw * qy), fwy = 2 * (qy * qz - qw * qx), fwz = 1 - 2 * (qx * qx + qy * qy), bias = 4.5 * frontG[g];
      for (let n = pn; n < N; n++) {
        const i = b + n * 3, k = 1 - o.drag;
        const vx = (hx[i] - hp[i]) * k, vy = (hx[i + 1] - hp[i + 1]) * k, vz = (hx[i + 2] - hp[i + 2]) * k;
        hp[i] = hx[i]; hp[i + 1] = hx[i + 1]; hp[i + 2] = hx[i + 2];
        const sh = hx[i + 1] > cy + 0.06 ? bias : 0;   // only while passing the shoulders
        hx[i] += vx + (ax + fwx * sh) * dt2; hx[i + 1] += vy + (ay + fwy * sh) * dt2; hx[i + 2] += vz + (az + fwz * sh) * dt2;
      }
      for (let n = 0; n < pn; n++) world(J.head, pinL[g][n], hx, b + n * 3);
      for (let it = 0; it < o.iters; it++) {
        for (let n = pn; n < N; n++) {
          const i = b + n * 3, j = i - 3; let dx = hx[i] - hx[j], dy = hx[i + 1] - hx[j + 1], dz = hx[i + 2] - hx[j + 2]; const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-9, k = (d - seg[g]) / d;
          if (n === pn) { hx[i] -= dx * k; hx[i + 1] -= dy * k; hx[i + 2] -= dz * k; }
          else { hx[i] -= dx * k * 0.5; hx[i + 1] -= dy * k * 0.5; hx[i + 2] -= dz * k * 0.5; hx[j] += dx * k * 0.5; hx[j + 1] += dy * k * 0.5; hx[j + 2] += dz * k * 0.5; }
        }
        for (let n = pn + 1; n < N; n++) { // gentle bending resistance: keeps the hair straight and sleek
          const i = b + n * 3, j = i - 6; let dx = hx[i] - hx[j], dy = hx[i + 1] - hx[j + 1], dz = hx[i + 2] - hx[j + 2]; const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-9, r = 1.96 * seg[g];
          if (d < r) { const k = ((d - r) / d) * 0.10; hx[i] -= dx * k; hx[i + 1] -= dy * k; hx[i + 2] -= dz * k; if (n > pn + 1) { hx[j] += dx * k; hx[j + 1] += dy * k; hx[j + 2] += dz * k; } }
        }
        for (let n = pn; n < N; n++) collide(HC, hx, hp, b + n * 3, 0.004 + 0.004 * (g % 3), 0.18);
      }
    }
    // straps
    for (let s = 0; s < N_STRAPS; s++) {
      const b = s * STRAP_N * 3, L = straps[s].length / (STRAP_N - 1);
      for (let n = 1; n < STRAP_N; n++) {
        const i = b + n * 3, k = 0.985; const vx = (sx[i] - sp[i]) * k, vy = (sx[i + 1] - sp[i + 1]) * k, vz = (sx[i + 2] - sp[i + 2]) * k;
        sp[i] = sx[i]; sp[i + 1] = sx[i + 1]; sp[i + 2] = sx[i + 2]; sx[i] += vx + o.wind[0] * 0.3 * dt2; sx[i + 1] += vy - o.gravity * dt2; sx[i + 2] += vz + o.wind[2] * 0.3 * dt2;
      }
      world(straps[s].bone, straps[s].local, sx, b);
      for (let it = 0; it < 6; it++) {
        for (let n = 1; n < STRAP_N; n++) { const i = b + n * 3, j = i - 3; let dx = sx[i] - sx[j], dy = sx[i + 1] - sx[j + 1], dz = sx[i + 2] - sx[j + 2]; const d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-9, k = (d - L) / d * (n === 1 ? 1 : 0.5); sx[i] -= dx * k; sx[i + 1] -= dy * k; sx[i + 2] -= dz * k; if (n > 1) { sx[j] += dx * k; sx[j + 1] += dy * k; sx[j + 2] += dz * k; } }
        for (let n = 1; n < STRAP_N; n++) { collide(SC, sx, sp, b + n * 3, 0.006, 0.25); if (sx[b + n * 3 + 1] < 0.01) sx[b + n * 3 + 1] = 0.01; }
      }
    }
    // lag nodes: under-damped springs chasing the ankles (wide hems swing and flare) and the chest (jacket hem)
    lagTargets();
    for (let k = 0; k < 3; k++) {
      const w = 2 * Math.PI * (k < 2 ? 2.1 : 3.2), z = k < 2 ? 0.30 : 0.42;
      for (let c = 0; c < 3; c++) { const i = k * 3 + c; const acc = w * w * (lagT[i] - lagX[i]) - 2 * z * w * lagV[i]; lagV[i] += acc * dt; lagX[i] += lagV[i] * dt; }
    }
  }
  function write(f) {
    const hxr = jp[0], hyr = jp[1], hzr = jp[2], o4 = f * W * 4;
    for (let i = 0; i < G * N; i++) { out[o4 + i * 4] = hx[i * 3] - hxr; out[o4 + i * 4 + 1] = hx[i * 3 + 1] - hyr; out[o4 + i * 4 + 2] = hx[i * 3 + 2] - hzr; }
    for (let i = 0; i < N_STRAPS * STRAP_N; i++) { const q = o4 + (SIM.strap + i) * 4; out[q] = sx[i * 3] - hxr; out[q + 1] = sx[i * 3 + 1] - hyr; out[q + 2] = sx[i * 3 + 2] - hzr; }
    for (let k = 0; k < 3; k++) {
      let dx = lagX[k * 3] - lagT[k * 3], dy = lagX[k * 3 + 1] - lagT[k * 3 + 1], dz = lagX[k * 3 + 2] - lagT[k * 3 + 2]; const m = k < 2 ? 0.20 : 0.045, d = Math.hypot(dx, dy, dz);
      if (d > m) { dx *= m / d; dy *= m / d; dz *= m / d; }
      const q = o4 + (SIM.lag + k) * 4; out[q] = dx; out[q + 1] = dy * (k < 2 ? 0.35 : 1); out[q + 2] = dz;
    }
  }
  let time = 0;
  for (let i = 0; i < o.preroll * sub; i++) { step(0, time); time += dt; }
  const laps = track.loop ? 2 : 1;
  for (let lap = 0; lap < laps; lap++) for (let f = 0; f < F; f++) {
    for (let s = 1; s <= sub; s++) { step(lap * F + f - 1 + s / sub, time); time += dt; }
    pose(lap * F + f); if (lap === laps - 1) write(f);
  }
  return out;
}
