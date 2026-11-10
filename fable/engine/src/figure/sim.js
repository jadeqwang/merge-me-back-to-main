// Secondary motion, simulated once over a whole track (deterministic): hair guides, strap chains, the jacket-hem lag
// and the two trouser legs ("cloth-lite": a chain of ring centres per leg). One row of SIM.W texels (xyz) per frame.
//   hair, strap and leg nodes are stored relative to the hips joint of that frame; the lag node is an offset vector.
import { J, NJ, STRIDE, REST_POS, toLocal } from './skeleton.js';
import { HAIR, LEG } from './body.js';

export const STRAP_N = 8, N_STRAPS = 3;
export const SIM = (() => { const hair = 0, strap = HAIR.G * HAIR.NODES, lag = strap + N_STRAPS * STRAP_N, leg = lag + 4; return { G: HAIR.G, hair, strap, lag, leg, W: leg + 2 * LEG.NODES }; })();

const cap = (bone, a, b, r) => ({ bone, a: toLocal(bone, a), b: toLocal(bone, b), r });
const P = REST_POS;
const HAIR_COL = [
  cap(J.head, [0, 1.512, 0.006], [0, 1.598, 0.0], 0.090), cap(J.neck, [0, 1.40, 0.0], [0, 1.47, 0.005], 0.050),
  cap(J.chest, [-0.150, 1.352, 0], [0.150, 1.352, 0], 0.078), cap(J.chest, [-0.068, 1.275, 0.010], [0.068, 1.275, 0.010], 0.142), cap(J.chest, [-0.062, 1.205, 0.010], [0.062, 1.205, 0.010], 0.132),
  cap(J.upArmL, P[J.upArmL], P[J.foreArmL], 0.072), cap(J.upArmR, P[J.upArmR], P[J.foreArmR], 0.072), cap(J.foreArmL, P[J.foreArmL], P[J.handL], 0.080), cap(J.foreArmR, P[J.foreArmR], P[J.handR], 0.080),
  cap(J.spine, [0, 1.08, 0], [0, 1.14, 0.004], 0.104), cap(J.hips, [-0.075, 0.97, 0], [0.075, 0.97, 0], 0.142),
];
const STRAP_COL = [
  cap(J.hips, [-0.075, 0.97, 0], [0.075, 0.97, 0], 0.140),
  cap(J.thighL, [0.105, 0.90, 0.004], [0.140, 0.52, 0.006], 0.125), cap(J.thighR, [-0.105, 0.90, 0.004], [-0.140, 0.52, 0.006], 0.125),
  cap(J.shinL, [0.145, 0.48, 0.006], [0.185, 0.08, 0.010], 0.160), cap(J.shinR, [-0.145, 0.48, 0.006], [-0.185, 0.08, 0.010], 0.160),
];

export function simulate(track, body, opts = {}) {
  const o = { wind: [-0.18, 0, 0.04], gust: 0.6, gravity: 9.8, substeps: 3, iters: 5, drag: 0.035, vmax: 7, preroll: 150, ...(track.simOpts || {}), ...opts };
  const F = track.frames, D = track.data, G = SIM.G, N = HAIR.NODES, W = SIM.W, LN = LEG.NODES;
  const out = new Float32Array(F * W * 4), guides = body.guides, straps = body.straps, legs = body.legs;
  const loopD = track.loop ? (track.loopDelta || [0, 0]) : [0, 0];
  const jp = new Float64Array(NJ * 3), jq = new Float64Array(NJ * 4);
  function pose(ff) {
    let lap = 0, f = ff;
    if (track.loop) { lap = Math.floor(f / F); f -= lap * F; } else f = Math.min(Math.max(f, 0), F - 1);
    let f0 = Math.floor(f), f1 = f0 + 1, t = f - f0, lap1 = 0;
    if (f1 >= F) { if (track.loop) { f1 = 0; lap1 = 1; } else f1 = F - 1; }
    const a = f0 * STRIDE, b = f1 * STRIDE;
    for (let j = 0; j < NJ; j++) {
      const ia = a + j * 7, ib = b + j * 7;
      jp[j * 3] = D[ia] + (D[ib] + lap1 * loopD[0] - D[ia]) * t + lap * loopD[0]; jp[j * 3 + 1] = D[ia + 1] + (D[ib + 1] - D[ia + 1]) * t; jp[j * 3 + 2] = D[ia + 2] + (D[ib + 2] + lap1 * loopD[1] - D[ia + 2]) * t + lap * loopD[1];
      let x0 = D[ia + 3], y0 = D[ia + 4], z0 = D[ia + 5], w0 = D[ia + 6], x1 = D[ib + 3], y1 = D[ib + 4], z1 = D[ib + 5], w1 = D[ib + 6];
      if (x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1 < 0) { x1 = -x1; y1 = -y1; z1 = -z1; w1 = -w1; }
      const x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t, z = z0 + (z1 - z0) * t, w = w0 + (w1 - w0) * t, l = Math.hypot(x, y, z, w) || 1;
      jq[j * 4] = x / l; jq[j * 4 + 1] = y / l; jq[j * 4 + 2] = z / l; jq[j * 4 + 3] = w / l;
    }
  }
  function world(j, v, dst, di) {
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
      if (d2 < r * r) { const d = Math.sqrt(d2) || 1e-6, k = (r - d) / d; x[i] += dx * k; x[i + 1] += dy * k; x[i + 2] += dz * k; xp[i] += (x[i] - xp[i]) * fric; xp[i + 1] += (x[i + 1] - xp[i + 1]) * fric; xp[i + 2] += (x[i + 2] - xp[i + 2]) * fric; }
    }
  }
  const sub = o.substeps, dt = 1 / (track.fps * sub), dt2 = dt * dt, maxStep = o.vmax * dt;
  // in-place loops (run, walk): the air moves past her instead, so hair and cloth still stream
  const airZ = -(o.airSpeed ?? ((track.loop && track.meta && track.meta.speed > 0.5) ? track.meta.speed * 0.5 : 0)) * dt;
  // verlet step for one node with drag and a speed limit
  function integ(x, xp, i, ax, ay, az, drag) {
    let vx = (x[i] - xp[i]) * (1 - drag), vy = (x[i + 1] - xp[i + 1]) * (1 - drag), vz = airZ + (x[i + 2] - xp[i + 2] - airZ) * (1 - drag); const v = Math.hypot(vx, vy, vz);
    if (v > maxStep) { const k = maxStep / v; vx *= k; vy *= k; vz *= k; }
    xp[i] = x[i]; xp[i + 1] = x[i + 1]; xp[i + 2] = x[i + 2]; x[i] += vx + ax * dt2; x[i + 1] += vy + ay * dt2; x[i + 2] += vz + az * dt2;
  }
  function link(x, i, j, L, wi, wj) { const dx = x[i] - x[j], dy = x[i + 1] - x[j + 1], dz = x[i + 2] - x[j + 2], d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-9, k = (d - L) / d; x[i] -= dx * k * wi; x[i + 1] -= dy * k * wi; x[i + 2] -= dz * k * wi; x[j] += dx * k * wj; x[j + 1] += dy * k * wj; x[j + 2] += dz * k * wj; }

  // ---- state ----
  const hx = new Float64Array(G * N * 3), hp = new Float64Array(G * N * 3);
  const pinL = guides.map((g) => g.pins.map((q) => toLocal(J.head, q))), pinN = pinL.map((p) => p.length), seg = guides.map((g) => g.seg);
  const sx = new Float64Array(N_STRAPS * STRAP_N * 3), sp = new Float64Array(N_STRAPS * STRAP_N * 3);
  const lx = new Float64Array(2 * LN * 3), lp = new Float64Array(2 * LN * 3), lt = new Float64Array(3), la = new Float64Array(3);
  const lagX = new Float64Array(3), lagV = new Float64Array(3), lagT = new Float64Array(3);
  pose(0);
  for (let g = 0; g < G; g++) {
    for (let n = 0; n < pinN[g]; n++) world(J.head, pinL[g][n], hx, (g * N + n) * 3);
    for (let n = pinN[g]; n < N; n++) { const i = (g * N + n) * 3; hx[i] = hx[i - 3]; hx[i + 1] = hx[i - 2] - seg[g]; hx[i + 2] = hx[i - 1]; }
  }
  hp.set(hx);
  // cohesion: a back-hair guide may not drift further from its grid neighbours than at rest (plus slack)
  const nb = [];
  for (let c = 0; c < HAIR.COLS; c++) for (let l = 0; l < HAIR.LAYERS; l++) { const g = c * HAIR.LAYERS + l; if (c + 1 < HAIR.COLS) nb.push([g, g + HAIR.LAYERS]); if (l + 1 < HAIR.LAYERS) nb.push([g, g + 1]); }
  const nbRest = nb.map(([a, b]) => { const r = new Float64Array(N); for (let n = 0; n < N; n++) { const i = (a * N + n) * 3, j = (b * N + n) * 3; r[n] = Math.hypot(hx[i] - hx[j], hx[i + 1] - hx[j + 1], hx[i + 2] - hx[j + 2]) * 1.2 + 0.012; } return r; });
  for (let s = 0; s < N_STRAPS; s++) { world(straps[s].bone, straps[s].local, sx, s * STRAP_N * 3); for (let n = 1; n < STRAP_N; n++) { const i = (s * STRAP_N + n) * 3; sx[i] = sx[i - 3]; sx[i + 1] = sx[i - 2] - straps[s].length / (STRAP_N - 1); sx[i + 2] = sx[i - 1]; } }
  sp.set(sx);
  for (let c = 0; c < 2; c++) for (let k = 0; k < LN; k++) world(legs[c].nodes[k].bone, legs[c].nodes[k].local, lx, (c * LN + k) * 3);
  lp.set(lx);
  const lagTarget = () => { lagT[0] = jp[J.chest * 3]; lagT[1] = jp[J.chest * 3 + 1]; lagT[2] = jp[J.chest * 3 + 2]; };
  lagTarget(); lagX.set(lagT);
  const water = !!(o.water ?? (track.meta && track.meta.water));
  const gseed = guides.map((g, i) => (i * 12.9898) % 6.283), frontG = guides.map((g) => (g.kind === 0 ? -1 : 0));   // back hair is nudged behind the shoulders; locks and wisps just hang

  function step(ff, time) {
    pose(ff); updCol(HC); updCol(SC);
    const cq = J.chest * 4, cy = jp[J.chest * 3 + 1], qx = jq[cq], qy = jq[cq + 1], qz = jq[cq + 2], qw = jq[cq + 3];
    const fwx = 2 * (qx * qz + qw * qy), fwy = 2 * (qy * qz - qw * qx), fwz = 1 - 2 * (qx * qx + qy * qy);
    // ---- hair ----
    for (let g = 0; g < G; g++) {
      const gust = 1 + o.gust * (0.6 * Math.sin(time * 1.7 + gseed[g] * 0.2) + 0.4 * Math.sin(time * 4.3 + gseed[g] * 0.5));
      const ax = o.wind[0] * gust, ay = -o.gravity + o.wind[1] * gust, az = o.wind[2] * gust, b = g * N * 3, pn = pinN[g], bias = 4.0 * frontG[g];
      if (water) { // floating: strands rise to the surface and fan out from the head
        const hxc = jp[J.head * 3], hzc = jp[J.head * 3 + 2];
        for (let n = pn; n < N; n++) { const i = b + n * 3, rx = hx[i] - hxc, rz = hx[i + 2] - hzc, rl = Math.hypot(rx, rz) || 1; integ(hx, hp, i, 1.6 * rx / rl, Math.max(-6, Math.min(6, (0.10 + 0.004 * (g % 5) - hx[i + 1]) * 80)), 1.6 * rz / rl, 0.10); }
      } else for (let n = pn; n < N; n++) { const i = b + n * 3, sh = hx[i + 1] > cy + 0.07 ? bias : 0; integ(hx, hp, i, ax + fwx * sh, ay + fwy * sh, az + fwz * sh, o.drag); }
      for (let n = 0; n < pn; n++) world(J.head, pinL[g][n], hx, b + n * 3);
    }
    for (let it = 0; it < o.iters; it++) {
      for (let g = 0; g < G; g++) {
        const b = g * N * 3, pn = pinN[g];
        for (let n = pn; n < N; n++) { const i = b + n * 3; if (n === pn) link(hx, i, i - 3, seg[g], 1, 0); else link(hx, i, i - 3, seg[g], 0.5, 0.5); }
        for (let n = pn + 1; n < N; n++) { // bending resistance: sleek, straight hair
          const i = b + n * 3, j = i - 6, dx = hx[i] - hx[j], dy = hx[i + 1] - hx[j + 1], dz = hx[i + 2] - hx[j + 2], d = Math.sqrt(dx * dx + dy * dy + dz * dz) || 1e-9, r = 1.96 * seg[g];
          if (d < r) { const k = ((d - r) / d) * 0.12; hx[i] -= dx * k; hx[i + 1] -= dy * k; hx[i + 2] -= dz * k; if (n > pn + 1) { hx[j] += dx * k; hx[j + 1] += dy * k; hx[j + 2] += dz * k; } }
        }
      }
      for (let q = 0; q < nb.length; q++) {
        const a = nb[q][0], b2 = nb[q][1], r = nbRest[q];
        for (let n = Math.max(pinN[a], pinN[b2]); n < N; n++) { const i = (a * N + n) * 3, j = (b2 * N + n) * 3, dx = hx[i] - hx[j], dy = hx[i + 1] - hx[j + 1], dz = hx[i + 2] - hx[j + 2], d = Math.sqrt(dx * dx + dy * dy + dz * dz); if (d > r[n]) { const k = (d - r[n]) / d * 0.25; hx[i] -= dx * k; hx[i + 1] -= dy * k; hx[i + 2] -= dz * k; hx[j] += dx * k; hx[j + 1] += dy * k; hx[j + 2] += dz * k; } }
      }
      for (let g = 0; g < G; g++) { const b = g * N * 3, pad = 0.004 + 0.005 * (guides[g].layer || 0); for (let n = pinN[g]; n < N; n++) collide(HC, hx, hp, b + n * 3, pad, 0.2); }
    }
    // ---- straps ----
    for (let s = 0; s < N_STRAPS; s++) {
      const b = s * STRAP_N * 3, L = straps[s].length / (STRAP_N - 1);
      for (let n = 1; n < STRAP_N; n++) integ(sx, sp, b + n * 3, o.wind[0] * 0.3, -o.gravity, o.wind[2] * 0.3, 0.02);
      world(straps[s].bone, straps[s].local, sx, b);
      for (let it = 0; it < 6; it++) {
        for (let n = 1; n < STRAP_N; n++) link(sx, b + n * 3, b + n * 3 - 3, L, n === 1 ? 1 : 0.5, n === 1 ? 0 : 0.5);
        for (let n = 1; n < STRAP_N; n++) { collide(SC, sx, sp, b + n * 3, 0.006, 0.25); if (sx[b + n * 3 + 1] < 0.012) sx[b + n * 3 + 1] = 0.012; }
      }
    }
    // ---- trouser legs: stiff at the hip, free at the hem; the leg itself has to stay inside every ring ----
    for (let c = 0; c < 2; c++) {
      const b = c * LN * 3, lg = legs[c];
      for (let k = 1; k < LN; k++) {
        const i = b + k * 3; integ(lx, lp, i, o.wind[0] * 0.15, -o.gravity, o.wind[2] * 0.15, 0.03);
        world(lg.nodes[k].bone, lg.nodes[k].local, lt, 0); const K = LEG.K[k]; lx[i] += (lt[0] - lx[i]) * K; lx[i + 1] += (lt[1] - lx[i + 1]) * K; lx[i + 2] += (lt[2] - lx[i + 2]) * K;
      }
      world(lg.nodes[0].bone, lg.nodes[0].local, lx, b); world(J.hips, lg.hipLocal, lt, 0); lx[b] = (lx[b] + lt[0]) / 2; lx[b + 1] = (lx[b + 1] + lt[1]) / 2; lx[b + 2] = (lx[b + 2] + lt[2]) / 2;
      for (let it = 0; it < 6; it++) {
        for (let k = 1; k < LN; k++) link(lx, b + k * 3, b + k * 3 - 3, lg.seg[k - 1], k === 1 ? 1 : 0.7, k === 1 ? 0 : 0.3);
        for (let k = 1; k < LN; k++) {
          const i = b + k * 3; world(lg.nodes[k].bone, lg.nodes[k].axis, la, 0);
          const dx = lx[i] - la[0], dy = lx[i + 1] - la[1], dz = lx[i + 2] - la[2], d = Math.sqrt(dx * dx + dy * dy + dz * dz), lim = lg.nodes[k].lim;
          if (d > lim) { const q = lim / d; lx[i] = la[0] + dx * q; lx[i + 1] = la[1] + dy * q; lx[i + 2] = la[2] + dz * q; }
          if (lx[i + 1] < 0.03) lx[i + 1] = 0.03;
        }
      }
    }
    // ---- jacket hem: an under-damped spring chasing the chest ----
    lagTarget(); { const w = 2 * Math.PI * 3.2, z = 0.42; for (let c = 0; c < 3; c++) { const acc = w * w * (lagT[c] - lagX[c]) - 2 * z * w * lagV[c]; lagV[c] += acc * dt; lagX[c] += lagV[c] * dt; } }
  }
  function write(f) {
    const hxr = jp[0], hyr = jp[1], hzr = jp[2], o4 = f * W * 4;
    const put = (src, n, off) => { for (let i = 0; i < n; i++) { const q = o4 + (off + i) * 4; out[q] = src[i * 3] - hxr; out[q + 1] = src[i * 3 + 1] - hyr; out[q + 2] = src[i * 3 + 2] - hzr; } };
    put(hx, G * N, SIM.hair); put(sx, N_STRAPS * STRAP_N, SIM.strap); put(lx, 2 * LN, SIM.leg);
    let dx = lagX[0] - lagT[0], dy = lagX[1] - lagT[1], dz = lagX[2] - lagT[2]; const d = Math.hypot(dx, dy, dz), m = 0.045; if (d > m) { dx *= m / d; dy *= m / d; dz *= m / d; }
    const q = o4 + (SIM.lag + 2) * 4; out[q] = dx; out[q + 1] = dy; out[q + 2] = dz;
    for (let c = 0; c < 2; c++) { // how much the hem flares: 0 at rest (two narrow legs), 1 in motion (the full sail)
      const i = (c * LN + LN - 1) * 3, sp = Math.hypot(lx[i] - lprev[c * 3], lx[i + 1] - lprev[c * 3 + 1], lx[i + 2] - lprev[c * 3 + 2]) * track.fps + Math.abs(airZ) / dt;
      lprev[c * 3] = lx[i]; lprev[c * 3 + 1] = lx[i + 1]; lprev[c * 3 + 2] = lx[i + 2];
      const tgt = Math.min(1, Math.max(0, (sp - 0.35) / 1.8)); flare[c] += (tgt - flare[c]) * (tgt > flare[c] ? 0.25 : 0.035); out[o4 + (SIM.lag + c) * 4] = flare[c];
    }
  }
  const lprev = new Float64Array(6), flare = [0, 0]; for (let c = 0; c < 2; c++) for (let k = 0; k < 3; k++) lprev[c * 3 + k] = lx[(c * LN + LN - 1) * 3 + k];
  let time = 0;
  for (let i = 0; i < o.preroll * sub; i++) { step(0, time); time += dt; }
  const laps = track.loop ? 2 : 1;
  for (let lap = 0; lap < laps; lap++) for (let f = 0; f < F; f++) {
    for (let s = 1; s <= sub; s++) { step(lap * F + f - 1 + s / sub, time); time += dt; }
    pose(lap * F + f); if (lap === laps - 1) write(f);
  }
  return out;
}
