// ACT E helper (seq 14, 15, 16): the morning. Built once, shared as K.shared.actE.
//
// The hero dances `free` (song_t0 236.648) from the very spot where she caught the light (CATCH), facing WEST as 13_catch leaves her (the sun behind her).
// `free` ends facing the way it began, and it must end facing east: the half turn is given to her whirl (track 3.45-5.55 s, where she is spinning anyway),
// about her own centre (yawAt / placeAt below; the track itself is not touched). Her dance IS main: the road is written under her feet as a loose orange
// line: 3 m back west along main, the whirl, then ten metres south through the leap, the joy and the cartwheel to where she stops and turns east for the
// second "Back to main" (HUB). From b141 she forks on every bar line, and so does every new branch:
//   b141 2 · b142 4 · b143 8 · b144 16 · b145 32 · b146 64.
// A hero child steps out of her already running (sprint_loop / run_loop at their own speed x 0.93..1.07: no skating); a runner's child leaves her in
// step, same stride, and their roads part. Every branch has a place in a fan about east seen from HUB (north of main: 42 tips, south: 21; the
// b142 child crosses in front of her to the south side). Roads are written under the feet until b147; on b147 every branch sends its light ahead
// ("each one a light I sent ahead") and its road races out to ~1 km: that fan is what the map (seq 15) sees as the new morning branches.
import { seg, ss, sm, lerp, clamp01 } from '../kit.js';

// monotone cubic through keys [[t, v0, v1, ...], ...] -> f(t) = [v0, v1, ...] (clamped outside)
export function curve(keys) {
  const ts = keys.map((k) => k[0]), n = ts.length, nc = keys[0].length - 1, M = [];
  for (let c = 0; c < nc; c++) { const y = keys.map((k) => k[c + 1]), d = [], m = new Array(n);
    for (let i = 0; i < n - 1; i++) d[i] = (y[i + 1] - y[i]) / (ts[i + 1] - ts[i]);
    for (let i = 1; i < n - 1; i++) { if (d[i - 1] * d[i] <= 0) m[i] = 0; else { const h0 = ts[i] - ts[i - 1], h1 = ts[i + 1] - ts[i], w1 = 2 * h1 + h0, w2 = h1 + 2 * h0; m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]); } }
    m[0] = 0; m[n - 1] = 0; M.push({ y, m }); }
  return (t) => { const tc = Math.min(ts[n - 1], Math.max(ts[0], t)); let i = 0; while (i < n - 2 && ts[i + 1] <= tc) i++; const h = ts[i + 1] - ts[i], u = (tc - ts[i]) / h, u2 = u * u, u3 = u2 * u;
    return M.map(({ y, m }) => (2 * u3 - 3 * u2 + 1) * y[i] + (u3 - 2 * u2 + u) * h * m[i] + (-2 * u3 + 3 * u2) * y[i + 1] + (u3 - u2) * h * m[i + 1]); };
}

// dev (r3): --q "zf=1" magnifies the film's own lens on her head (same camera position, aimed at the head, 0.7 m of frame height; lyrics off), so a strip
// of any shot shows the face as the film lights and poses it:  node fable/tools/render.mjs --show /fable/show/main.js --q "zf=1" --sheet 229:236.5:0.25:faces.jpg:8
export function zoomOn(K, F, head) {
  if (!+K.E.Q.get('zf') || !F || !F.camera || !head) return F;
  const c = F.camera, d = Math.hypot(head[0] - c.pos[0], head[1] - c.pos[1], head[2] - c.pos[2]);
  return { ...F, camera: { ...c, target: head, fov: Math.min(c.fov || 35, (2 * Math.atan(0.35 / d) * 180) / Math.PI), roll: 0, aperture: 0 }, type: [] };
}

const NAMES = ['next', 'what-if', 'try-this', 'one-more', 'another-road', 'unfold', 'tomorrow', 'again', 'begin', 'wander', 'listen', 'learn', 'build', 'play', 'sing', 'write', 'teach', 'dance', 'garden', 'orbit', 'signal',
  'hydrogen', 'sunrise', 'morning', 'open', 'yes', 'and-then', 'maybe', 'almost', 'further', 'home', 'away', 'north', 'east', 'river', 'tide', 'kite', 'seed', 'spark', 'thread', 'braid', 'echo', 'chorus', 'verse', 'bridge',
  'key-change', 'coda', 'da-capo', 'rehearse', 'improvise', 'refactor', 'rebase', 'cherry-pick', 'stash-pop', 'hotfix', 'release', 'v2', 'draft', 'sketch', 'prototype', 'demo', 'ship-it', 'hello-world', 'start-here'];
const LN = ['rose', 'cyan', 'gold', 'mint', 'blue', 'coral', 'magenta'];

export function morning(K) {
  if (K.shared.actE) return K.shared.actE;
  const { bar, world: W, cast, E } = K, { hash1, fbm1 } = K.rng;
  const C = W.CATCH, EAST = Math.PI / 2, WEST = -Math.PI / 2, FREE = 'free', tFr = cast.songT0(FREE) || bar(137), DUR = cast.dur(FREE);
  const tWh = cast.event(FREE, 'whirl') ?? 3.478, yawAt = (t) => WEST + Math.PI * ss(t - tFr, tWh - 0.03, tWh + 2.07);
  // The extra half turn pivots on the foot she is standing on (r2: it used to turn about her hips, which swept the planted foot over the ground at up to 0.5 m/s;
  // now 0.1 m/s, the track's own). The track's origin is tabulated once at 120 Hz: at every step the added yaw turns it about the supporting foot (the foot that is
  // down and still in the track; between two, their weighted mean; in the air, her hips), so that foot stays where it is in the world.
  // r3: `free` is placed so that its first frame's LEFT foot (the front, supporting one) stands where `catch` leaves hers (ST = the shift in track space, about 1 x 5 cm;
  // without `catch` it is 0): the handover (below) then only has to bring the back foot up.
  const D13 = K.shared.actD || {}, CA = 'catch', tCa = cast.songT0(CA) || 220, hasHO = cast.has(CA) && cast.has(FREE) && !!D13.cT, ST = [0, 0];
  if (hasHO) { const a = cast.root(CA, cast.dur(CA) - 0.02, 15), b = cast.root(FREE, 0, 15), r = cast.root(FREE, 0); ST[0] = a[0] - (b[0] - r[0]); ST[1] = a[2] - (b[2] - r[2]); }
  const HN = Math.ceil(DUR * 120), OT = new Float64Array((HN + 1) * 2); { const r0 = cast.root(FREE, 0), o0 = cast.rot(yawAt(tFr), r0[0] - ST[0], r0[2] - ST[1]); OT[0] = C[0] - o0[0]; OT[1] = C[1] - o0[1];
    for (let i = 0; i < HN; i++) { const ta = i / 120, tb = (i + 1) / 120, ya = yawAt(tFr + ta), yb = yawAt(tFr + tb); OT[i * 2 + 2] = OT[i * 2]; OT[i * 2 + 3] = OT[i * 2 + 1]; if (ya === yb) continue;
      const h = cast.root(FREE, (ta + tb) / 2); let wx = 0.02 * h[0], wz = 0.02 * h[2], ws = 0.02;
      for (const j of [15, 19]) { const a = cast.root(FREE, ta, j), b = cast.root(FREE, tb, j), v = Math.hypot(b[0] - a[0], b[2] - a[2]) * 120, w = Math.exp(-((v / 0.2) ** 2)) * sm((0.2 - (a[1] + b[1]) / 2) / 0.08); wx += w * (a[0] + b[0]) / 2; wz += w * (a[2] + b[2]) / 2; ws += w; }
      const p = cast.rot(ya, wx / ws, wz / ws), q = cast.rot(yb, wx / ws, wz / ws); OT[i * 2 + 2] += p[0] - q[0]; OT[i * 2 + 3] += p[1] - q[1]; } }
  const placeAt = (t) => { const f = Math.min(HN - 1e-4, Math.max(0, (t - tFr) * 120)), i = Math.floor(f), u = f - i; return { pos: [OT[i * 2] + (OT[i * 2 + 2] - OT[i * 2]) * u, 0, OT[i * 2 + 1] + (OT[i * 2 + 3] - OT[i * 2 + 1]) * u], yaw: yawAt(t) }; };   // -> cast.actor('hero').set
  // the way she faces (radians from east, toward the south), from her hips
  const faceAt = (t) => { const l = cast.root(FREE, t - tFr, 13), r = cast.root(FREE, t - tFr, 17), o = cast.rot(yawAt(t), -(l[2] - r[2]), l[0] - r[0]); return Math.atan2(o[1], o[0]); };
  // r2: a branch that leaves her while she is standing (b144, b145, b146) starts from a stand: `run_from_stand` (idle at frame 0, three accelerating strides, run_loop from
  // 1.5 s on a known phase). Without the track (dev track lists) they start at full stride as before.
  const RFS = 'run_from_stand', RF = cast.has(RFS) && cast.meta(RFS).run_from ? cast.meta(RFS) : null;
  // a joint of the hero in the world at song time t (0 = hips, 4 = head)
  const jointAt = (t, j = 0) => { const pl = placeAt(t), r = cast.root(FREE, t - tFr, j), o = cast.rot(pl.yaw, r[0], r[2]); return [pl.pos[0] + o[0], r[1], pl.pos[2] + o[1]]; };
  const soft = (t, w = 0.3) => { let x = 0, z = 0; for (let j = -4; j <= 4; j++) { const p = jointAt(t + (j / 4) * w); x += p[0]; z += p[2]; } return { x: x / 9, z: z / 9 }; };
  // ---- r3: THE HANDOVER (3:56.6). `catch` ends with her arms wide and her right foot a step back; `free` begins standing square, arms down. The cut used to hide
  // the pop on her feet. Now there is no pop: a third performance, `handover`, is made here from the two (235.9 .. 238.0, 60 fps): the pose of `catch` (on its slowed
  // clock, 12_flight cT) blended into the pose of `free` (from its frame 0 at b137) joint by joint in the skeleton's own rotations (parent-relative quaternions
  // slerped, bone offsets kept, positions rebuilt from the hips: no limb changes length). Arms, spine and head go over 236.20 -> 237.35 (she lets her arms come down
  // through the cut); hips and legs over 236.55 -> 237.05 (the back foot comes up beside the front one, which stays where it is). Both 13_catch and 14_day play it
  // (HO.set), so the cut on b137 is a cut on one continuous action, and she is seen whole.
  let HO = null;
  if (hasHO) { const PAR = [-1, 0, 1, 2, 3, 2, 5, 6, 7, 2, 9, 10, 11, 0, 13, 14, 15, 0, 17, 18, 19], NJ = 21, fps = 60, tH0 = 235.9, tH1 = 238.3, NF = Math.round((tH1 - tH0) * fps) + 1, data = new Float32Array(NF * 147);
    const qmul = (a, b) => [a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1], a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0], a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3], a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2]];
    const qcon = (q) => [-q[0], -q[1], -q[2], q[3]], qrot = (q, v) => { const x = q[0], y = q[1], z = q[2], w = q[3], cx = y * v[2] - z * v[1] + w * v[0], cy = z * v[0] - x * v[2] + w * v[1], cz = x * v[1] - y * v[0] + w * v[2]; return [v[0] + 2 * (y * cz - z * cy), v[1] + 2 * (z * cx - x * cz), v[2] + 2 * (x * cy - y * cx)]; };
    const qnorm = (q) => { const l = Math.hypot(q[0], q[1], q[2], q[3]) || 1; return [q[0] / l, q[1] / l, q[2] / l, q[3] / l]; };
    const slerp = (a, b, u) => { let d = a[0] * b[0] + a[1] * b[1] + a[2] * b[2] + a[3] * b[3], s = 1; if (d < 0) { d = -d; s = -1; } let ka = 1 - u, kb = u; if (d < 0.9995) { const th = Math.acos(d), sn = Math.sin(th); ka = Math.sin((1 - u) * th) / sn; kb = Math.sin(u * th) / sn; } return qnorm([0, 1, 2, 3].map((i) => ka * a[i] + s * kb * b[i])); };
    // a pose of a track at track time tt: world (track-space) position and orientation per joint, then parent-relative
    const pose = (name, tt, sh) => { const tr = cast.tracks[name], D = tr.data, f = Math.min(tr.frames - 1.001, Math.max(0, tt * tr.fps)), i = Math.floor(f), u = f - i, P = [], Q = [];
      for (let j = 0; j < NJ; j++) { const a = i * 147 + j * 7, b = a + 147; P.push([D[a] + (D[b] - D[a]) * u + sh[0], D[a + 1] + (D[b + 1] - D[a + 1]) * u, D[a + 2] + (D[b + 2] - D[a + 2]) * u + sh[1]]); Q.push(slerp([D[a + 3], D[a + 4], D[a + 5], D[a + 6]], [D[b + 3], D[b + 4], D[b + 5], D[b + 6]], u)); }
      const lq = [Q[0]], lo = [P[0]]; for (let j = 1; j < NJ; j++) { const c = qcon(Q[PAR[j]]); lq.push(qmul(c, Q[j])); lo.push(qrot(c, [P[j][0] - P[PAR[j]][0], P[j][1] - P[PAR[j]][1], P[j][2] - P[PAR[j]][2]])); } return { lq, lo, P, Q }; };
    const r0 = cast.root(FREE, 0), shF = [ST[0] - r0[0], ST[1] - r0[2]], mix3 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
    // r4: (a) the back foot STEPS up (it slid 30 cm along the ground: the legs were only blended). Both ankles are now driven in the world and the legs re-solved (two-bone
    // IK about the blended knee direction): the left foot stays where both takes have it, the right lifts 7 cm and is set down beside it (236.62 -> 237.12), toe and heel
    // turning from one take's foot to the other's; the hips stay over the standing leg until it lands (236.85 -> 237.35). (b) the arms no longer come down, wait, and go
    // up again: they come down ONCE, slowly, out through the sides, over the whole of the step and the gathering dip of the skip (236.45 -> 237.95), and arrive at her
    // sides at the bottom of that dip, exactly as the skip throws them up: one swing. Spine and head go over first (236.3 -> 237.2).
    const vsub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], vdot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], vlen = (a) => Math.hypot(a[0], a[1], a[2]), vunit = (a) => { const l = vlen(a) || 1; return [a[0] / l, a[1] / l, a[2] / l]; };
    const vcross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const qarc = (u, v) => { const d = vdot(u, v); if (d < -0.99999) return [1, 0, 0, 0]; const c = vcross(u, v); return qnorm([c[0], c[1], c[2], 1 + d]); };     // the shortest turn that takes u to v (unit vectors)
    const legIK = (P, Q, th, T, Qf, Qt, loToe) => { const sh = th + 1, ft = th + 2, H = P[th], K = P[sh], E = P[ft], a = vlen(vsub(K, H)), b = vlen(vsub(E, K)), d = vsub(T, H), dl = vlen(d), dc = Math.min(a + b - 1e-4, Math.max(Math.abs(a - b) + 1e-4, dl)), n = [d[0] / dl, d[1] / dl, d[2] / dl];
      const x = (a * a - b * b + dc * dc) / (2 * dc), h = Math.sqrt(Math.max(0, a * a - x * x)), fr = qrot(Q[th], [0, 0, 1]); let pv = vsub(K, H); pv = [pv[0] + 0.25 * fr[0], pv[1] + 0.25 * fr[1], pv[2] + 0.25 * fr[2]];      /* the knee bends the way the thigh faces (a nearly straight leg says nothing reliable about it) */ const pn = vdot(pv, n); pv = vunit([pv[0] - pn * n[0], pv[1] - pn * n[1], pv[2] - pn * n[2]]);
      const Kn = [H[0] + n[0] * x + pv[0] * h, H[1] + n[1] * x + pv[1] * h, H[2] + n[2] * x + pv[2] * h], Tn = [H[0] + n[0] * dc, H[1] + n[1] * dc, H[2] + n[2] * dc];
      Q[th] = qnorm(qmul(qarc(vunit(vsub(K, H)), vunit(vsub(Kn, H))), Q[th])); Q[sh] = qnorm(qmul(qarc(vunit(vsub(E, K)), vunit(vsub(Tn, Kn))), Q[sh])); P[sh] = Kn; P[ft] = Tn; Q[ft] = Qf; Q[ft + 1] = Qt; const o = qrot(Qf, loToe); P[ft + 1] = [Tn[0] + o[0], Tn[1] + o[1], Tn[2] + o[2]]; };
    for (let k = 0; k < NF; k++) { const t = tH0 + k / fps, wa = ss(t, 236.45, 237.95), wsp = ss(t, 236.30, 237.20), wh = ss(t, 236.85, 237.35), wst = ss(t, 236.62, 237.12), A = pose(CA, Math.min(cast.dur(CA) - 0.02, D13.cT(t)), [0, 0]), B = pose(FREE, Math.max(0, t - tFr), shF), P = [], Q = [];
      for (let j = 0; j < NJ; j++) { const w = j === 0 || j >= 13 ? wh : j <= 4 ? wsp : wa, q = slerp(A.lq[j], B.lq[j], w), o = mix3(A.lo[j], B.lo[j], w);
        if (j === 0) { P.push(o); Q.push(q); } else { const pq = Q[PAR[j]], r = qrot(pq, o); P.push([P[PAR[j]][0] + r[0], P[PAR[j]][1] + r[1], P[PAR[j]][2] + r[2]]); Q.push(qnorm(qmul(pq, q))); } }
      for (const [th, w] of [[13, wh], [17, wst]]) { const ft = th + 2, T = mix3(A.P[ft], B.P[ft], w); if (th === 17) T[1] += 0.075 * Math.sin(Math.PI * w); legIK(P, Q, th, T, slerp(A.Q[ft], B.Q[ft], w), slerp(A.Q[ft + 1], B.Q[ft + 1], w), mix3(A.lo[ft + 1], B.lo[ft + 1], w)); }
      for (let j = 0; j < NJ; j++) data.set([P[j][0], P[j][1], P[j][2], Q[j][0], Q[j][1], Q[j][2], Q[j][3]], k * 147 + j * 7); }
    const src = cast.tracks[FREE], track = { name: 'handover', fps, frames: NF, loop: false, events: [], boneLengths: src.boneLengths, data, simOpts: {}, meta: { song_t0: tH0, made_by: 'actE_morning.js (catch -> free)' } };
    cast.tracks.handover = track; if (cast.fig) cast.fig.addTrack(track);
    if (+K.E.Q.get('hodump')) for (let k = 0; k < NF; k += 8) console.log('HODUMP ' + (k + ' ' + NF + ' ' + Array.from(data.subarray(k * 147, Math.min(NF, k + 8) * 147), (v) => v.toFixed(5)).join(' ')).replace(/\d/g, (c) => 'abcdefghij'[c]));      // dev: --q "hodump=1" prints the made track (from 235.9, 60 fps) in pieces of 8 frames, digits as letters a-j (the harness drops any console line with "404" in it): it is checked by numbers (feet, bone lengths, speeds)
    const tIn = tH0 + 0.25, tOut = 238.1;                                     // played from 236.15 (still `catch`'s own pose) to 238.1 (`free`'s own motion, 1.45 s in: the skip is leaving the ground)
    HO = { t0: tH0, tIn, tOut, on: (t) => t >= tIn && t < tOut, set: (t) => { const w = ss(t, 236.45, 237.95); return { pos: [C[0], 0, C[1]], yaw: WEST, track: 'handover', time: t - tH0, face: { expr: 'joy', amt: 0.9 - 0.25 * w }, hand: -0.6 + 0.35 * w }; } }; }
  const TK = [141, 142, 143, 144, 145, 146].map(bar), tAhead = bar(147), tSpan = bar(152.5) - tAhead, TAU = 4.5, T_NEAR = bar(149) + 4;
  const count = (t) => { let c = 1; for (const tk of TK) if (t >= tk) c *= 2; return c; };
  const HUB = soft(bar(145), 0.2);
  // ---- the fan: tip i of a side (0 = next to main) -> bearing from HUB (radians from east; north is negative)
  const NN = 42, NS = 21, A0 = (3.5 * Math.PI) / 180, AN = (60 * Math.PI) / 180, AS = (46 * Math.PI) / 180;
  const tipAng = (side, i) => side * (A0 + (i + 0.5) * ((side < 0 ? AN : AS) - A0) / (side < 0 ? NN : NS));
  const ctr = (side, iv) => (tipAng(side, iv[0]) + tipAng(side, iv[1] - 1)) / 2;
  const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
  // the write head after b147: metres beyond where her feet were, as a function of time (and its inverse), reaching `tot` at b152.5
  const kEnd = 1 - Math.exp(-tSpan / TAU), gAhead = (d, tot) => tAhead - TAU * Math.log(Math.max(1e-6, 1 - (Math.min(d, tot * 0.9999) / tot) * kEnd));

  const J = [], nearDefs = [], farDefs = [];
  // ---- main: the dance, then straight east
  { const pts = [], tm = []; let last = null; for (let t = tFr; t <= tAhead + 1e-6; t += 0.04) { const p = soft(t, 0.25); if (!last || Math.hypot(p.x - last.x, p.z - last.z) > 0.05) { pts.push([p.x, p.z]); tm.push(t); last = p; } }
    pts[0] = [C[0], C[1]]; const nd = pts.length, e = pts[nd - 1], NEAR = 90, FAR = 800; for (let d = 0.5; d <= NEAR; d += 0.5) pts.push([e[0] + d, e[1]]);
    const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); const L = cum[cum.length - 1], Ld = cum[nd - 1];
    const gk = []; for (let i = 0; i < nd; i++) gk.push([cum[i] / L, tm[i]]); for (let d = 2; d <= NEAR; d += 2) gk.push([(Ld + d) / L, gAhead(d, NEAR + FAR)]);
    const nodes = TK.map((tk) => { let i = 0; while (i < nd - 1 && tm[i + 1] <= tk) i++; return { s: cum[i], r: 0.24, g: tk }; });
    nearDefs.push({ pts, gk, color: K.hex(K.LANE.main), width: 0.045, text: 'main  back to main', textSize: 0.5, textSide: 1, flip: true, textStart: 4.2, textGap: 6, nodes, step: 0.2 });     // reads from the east / north side: shot B's side of her dance
    const fp = [], fg = []; for (let d = NEAR; d <= NEAR + FAR; d += 10) { fp.push([e[0] + d, e[1]]); fg.push(gAhead(d, NEAR + FAR)); }
    farDefs.push({ pts: fp, gs: fg, color: K.hex(K.LANE.main), width: 0.045, smooth: false });
    J.push({ id: 0, hero: true, lane: 'main', mainLen: Ld, end: [e[0] + NEAR + FAR, e[1]] }); }

  // ---- the branches
  function make(parent, kb, side, iv, start, ph0, track, fromHero, rfs = false) {
    const id = J.length, tb = TK[kb], rate = 0.93 + 0.14 * hash1(id * 17 + 3), speed = cast.speed(track) * rate;
    // metres run at song time t, and its inverse. From a stand: the track's own travel for 1.5 s, then the loop (as if she had left d0 seconds late at full speed)
    const d0 = rfs ? RF.run_from - RF.run_z0 / speed : 0; if (rfs) ph0 = RF.loop_phase_t - rate * RF.run_from;
    const sOf = (t) => (rfs && t - tb < RF.run_from ? Math.max(0, cast.root(RFS, t - tb)[2]) : speed * (t - tb - d0));
    const tOf = (s) => { if (!rfs || s >= RF.run_z0) return tb + d0 + s / speed; let a = 0, b = RF.run_from; for (let i = 0; i < 22; i++) { const m = (a + b) / 2; if (cast.root(RFS, m)[2] < s) a = m; else b = m; } return tb + (a + b) / 2; };
    const j = { id, parent, kb, tb, side, track, rate, speed, ph0, fromHero, rfs, sOf, y0: start.y || 0, name: 'jade/' + NAMES[(id - 1) % NAMES.length] };
    j.top = parent.hero ? j : parent.top; j.lane = LN[(parent.hero ? id - 1 : LN.indexOf(parent.lane) + 1 + (id % 5)) % LN.length]; J.push(j);
    // her place in the fan, halved at every later fork; who keeps which half is seeded
    const ivs = []; let cur = iv; const kids = []; for (let k = kb; k < TK.length; k++) { if (k > kb && cur[1] - cur[0] >= 2) { const m = (cur[0] + cur[1]) >> 1, a = [cur[0], m], b = [m, cur[1]], keepA = hash1(id * 31 + k * 7) < 0.5; kids.push({ k, iv: keepA ? b : a }); cur = keepA ? a : b; } ivs[k] = cur; }
    const Ln = sOf(T_NEAR), ds = 0.2, pts = [[start.x, start.z]], hs = []; let x = start.x, z = start.z, h = start.h;
    for (let s = 0; s < Ln; s += ds) { const t = tOf(s); let k = kb; while (k < TK.length - 1 && t >= TK[k + 1]) k++; const th = ctr(side, ivs[k]);
      const rho = Math.hypot(x - HUB.x, z - HUB.z), La = 7, hd = Math.atan2(HUB.z + (rho + La) * Math.sin(th) - z, HUB.x + (rho + La) * Math.cos(th) - x);
      if (start.h === undefined && s === 0) h = hd;
      const mx = ds / 3.2; h += Math.min(mx, Math.max(-mx, wrap(hd - h))); hs.push(h); x += Math.cos(h) * ds; z += Math.sin(h) * ds; pts.push([x, z]); }
    const sA = sOf(tAhead), thT = ctr(side, ivs[TK.length - 1]), Lfar = 620 * (0.7 + 0.5 * hash1(id * 53 + 11)), tot = Ln - sA + Lfar;
    const gs = []; for (let i = 0; i <= 160; i++) { const s = (Ln * i) / 160; gs.push(s <= sA ? tOf(s) : gAhead(s - sA, tot)); }
    nearDefs.push({ pts, gs, color: K.hex(K.LANE[j.lane]), width: 0.035, text: j.name, textSize: 0.46, textSide: -1, textStart: 2.2, textGap: 9, nodes: [{ s: 0, r: fromHero ? 0.2 : 0.22, g: tb }], step: 0.2 });
    const fp = [[x, z]], fg = [gAhead(Ln - sA, tot)], dF = 6; for (let s = dF; s <= Lfar; s += dF) { const rho = Math.hypot(x - HUB.x, z - HUB.z), ht = thT + 0.2 * fbm1(rho / 260, 7, 2) * Math.min(1, Math.abs(thT) / 0.45) + 0.05 * fbm1(rho / 90, 40 + id, 2);
      h += Math.min(dF / 70, Math.max(-dF / 70, wrap(ht - h))); x += Math.cos(h) * dF; z += Math.sin(h) * dF; fp.push([x, z]); fg.push(gAhead(Ln - sA + s, tot)); }
    farDefs.push({ pts: fp, gs: fg, color: K.hex(K.LANE[j.lane]), width: 0.035 });
    Object.assign(j, { Ln, pts, hs, ds, end: [x, z], kids });
    j.at = (s) => { const f = Math.min(pts.length - 1.001, Math.max(0, s / ds)), i = Math.floor(f), u = f - i; return { x: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, z: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u, h: hs[Math.min(hs.length - 1, i)] }; };
    for (const q of kids) { const s = sOf(TK[q.k]), a = j.at(s); make(j, q.k, side, q.iv, { x: a.x, z: a.z, h: a.h }, ph0 + rate * (TK[q.k] - tb), track, false); }
    return j;
  }
  const HC = [[-1, [10, 42], 'sprint_loop'], [1, [0, 16], 'sprint_loop'], [-1, [2, 10], 'run_loop'], [1, [16, 20], 'sprint_loop'], [-1, [0, 2], 'run_loop'], [1, [20, 21], 'sprint_loop']];
  HC.forEach(([side, iv, track], k) => { const p = jointAt(TK[k]), rfs = !!RF && k >= 3;                 // b144, b145, b146: she is standing: they step out of her and accelerate, facing the way she faces
    if (rfs) make(J[0], k, side, iv, { x: p[0], z: p[2], h: faceAt(TK[k]) }, 0, 'run_loop', true, true);
    else make(J[0], k, side, iv, { x: p[0], z: p[2], y: Math.max(0, p[1] - 0.99) }, cast.dur(track) * hash1(k * 5 + 1), cast.has(track) ? track : 'sprint_loop', true); });
  const nearR = E.roads(nearDefs, { step: 0.2, maxGlyphs: 60000 }), farR = E.roads(farDefs, { step: 6 });
  J.forEach((j, i) => { j.near = nearR.roads[i]; j.far = farR.roads[i]; });
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const d of farDefs) for (const p of d.pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }

  // ---- the people at song time t
  function people(t, o = {}) {
    if (o.hero !== false) cast.actor('hero').set(HO && HO.on(t) ? HO.set(t) : { ...placeAt(t), track: FREE, time: t - tFr });
    const cr = cast.crowd('morning', 64); let n = 0; const list = [];
    for (const j of J) { if (j.hero || t < j.tb) continue; const s = j.sOf(t); if (s > j.Ln - 1) continue; const a = j.near.at(s); let alpha = 1, y = 0;
      if (j.rfs && t - j.tb < RF.run_from) { list.push({ j, x: a.x, z: a.z, tx: a.tx, tz: a.tz }); cr.put(n++, { ...K.ride(RFS, t - j.tb, a), track: RFS, time: t - j.tb, lane: j.lane, alpha, vary: 0, seed: j.id + 2 }); continue; }
      if (j.fromHero) y = j.y0 * (1 - sm(seg(t, j.tb, j.tb + 0.3)));                    // she is there on the bar line, whole (a fork is instant); out of a leap she comes down running
      else if (!j.fromHero) { const b = j.parent.near.at(j.parent.sOf(t)); if (Math.hypot(a.x - b.x, a.z - b.z) < 0.05) continue; }           // she is still inside her twin
      list.push({ j, x: a.x, z: a.z, tx: a.tx, tz: a.tz });
      cr.put(n++, { pos: [a.x, y, a.z], yaw: Math.atan2(a.tx, a.tz), track: j.track, time: j.ph0 + j.rate * (t - j.tb), lane: j.lane, alpha, vary: 0, seed: j.id + 2 }); }
    cr.n = n; return list;
  }
  // where a branch's runner is (for cameras): { x, z, tx, tz }
  const runnerAt = (j, t) => j.near.at(Math.min(j.Ln - 1, Math.max(0, j.sOf(t))));
  // the roads of the morning: near (human scale, with names) and far (after b147)
  const roads = (t, o = {}) => [nearR.drawable({ head: t, gain: 2.4, textGain: 0.9, minPx: 2.0, haloPx: 0, halo: 0, nodeMinPx: 2.0, ...o, ...(o.near || {}) }), farR.drawable({ head: t, gain: 2.4, textGain: 0, minPx: 2.0, haloPx: 0, halo: 0, ...o, ...(o.far || {}) })];
  const headAt = (t) => { if (HO && HO.on(t)) { const r = cast.root('handover', t - HO.t0, 4), o = cast.rot(WEST, r[0], r[2]); return [C[0] + o[0], r[1] + 0.06, C[1] + o[1]]; } const p = jointAt(t, 4); return [p[0], p[1] + 0.06, p[2]]; };
  const A = { HO, headAt, C, EAST, FREE, tFr, DUR, placeAt, yawAt, faceAt, jointAt, soft, HUB, TK, tAhead, count, J, people, runnerAt, roads, box: { x0, x1, z0, z1 }, nearR, farR, curve };
  K.shared.actE = A; return A;
}

// ---- the lift (seq 14 D and all of seq 15): one camera from behind her shoulder to the whole film from above, and down again toward the root.
// A camera on a stick: it looks at a ground point G from distance R, pitched down by p, on azimuth a (0 = looking east, -90 = looking north; at p = 90 this
// is the map: east to the right, north up). No cut between b144 and the last hit.
export function makeLift(K) {
  const A = morning(K), { bar, bb, world: W } = K, H = A.HUB, ln = Math.log, rad = Math.PI / 180;
  const X0 = -1700, X1 = A.J[0].end[0] + 900;                // room for the two tags on main: `main` at its west end, `(HEAD -> main)` at its east end
  const Z0 = Math.min(-1640, A.box.z0 - 80), Z1 = Math.max(1380, A.box.z1 + 80);
  const B = W.frameBox(X0, X1, Z0, Z1, { up: 'map', margin: 1.05, fov: 35 }), mc = [B.pos[0], B.pos[2]];
  const tMain = K.T.words(25)[2].end, tMap = bar(150), tRiser = bb(152, 2), tHit = bar(153);
  // r2: lower and closer for longer. To the end of "Back to main" (tMain, 255.885) the stick stays on HER (a point a little ahead of her on main, following her softened):
  // 4.5 m behind her shoulder on b144, 14 m by tMain, so she and the nearest branches are people for the whole line. Then one continuous pull-up, two bars, to the map:
  // the ground point stays on main all the way up (main's orange under the centre): first it runs out east ahead of her with the distance (0.22 R, so the fan, not
  // its apex, fills the frame while nothing else is in sight), and from 600 m it slides back west along main to the map's centre as the rest of the film comes in.
  // r3: (a) the lens swings 12 degrees further to her south side for b145-b147 (az -24 .. -26, was -12): the branch that leaves her on b145 runs east along main, which
  // was the lens's own axis, so she hid it for a second; now it is clear of her in under half a second. (b) the pull-up waits for b149 (the drums go out there): to the
  // end of the bar after "Back to main" the stick stays low (14 -> 24 m, she is still 13 % of the frame and the nearest runners are bodies), and the whole climb to the
  // map is ONE bar, b149 -> b150, starting from a frame that still has people in it (it was 2.9 s of specks on white).
  //            t         lead  Gy    side  ln R             pitch  az   fov
  const LK = curve([
    [bar(144),    0.9,  1.22, 1.0,  ln(4.5),         2.5,   -14, 42],
    [bar(145),    1.5,  1.16, 0.8,  ln(5.6),         5,     -24, 42],
    [bar(146),    2.3,  1.08, 0.5,  ln(7.2),         7.5,   -26, 42],
    [bar(147),    3.2,  0.98, 0.2,  ln(9.5),         10,    -24, 42],
    [tMain,       4.5,  0.8,  0,    ln(14),          12.5,  -22, 42],
    [bar(149),    10,   0.5,  0,    ln(24),          22,    -25, 42],
    [tMap,        4.5,  0,    0,    ln(B.h),         90,    -90, 35],
    [tRiser,      4.5,  0,    0,    ln(B.h * 0.955), 90,    -90, 35],
  ]);
  const R1 = 14, DIVE = [lerp(mc[0], 0, 0.86), lerp(mc[1], 0, 0.86)];
  function lift(t) { let [lead, gy, side, lr, p, a, fov] = LK(t); const h = A.soft(Math.min(t, A.tFr + A.DUR - 0.7), 0.6), w = sm((lr - ln(600)) / (ln(B.h * 0.955) - ln(600)));
    let gx = lerp(h.x + lead + 0.22 * Math.max(0, Math.min(Math.exp(lr), 600) - R1), mc[0], w), gz = lerp(h.z + side, mc[1], w);
    if (t > tRiser) { const e = Math.pow(seg(t, tRiser, tHit), 2.4); gx = lerp(gx, DIVE[0], e); gz = lerp(gz, DIVE[1], e); lr = lerp(lr, ln(B.h / 7), e); }
    const R = Math.exp(lr), cp = Math.cos(p * rad), sp = Math.sin(p * rad), ca = Math.cos(a * rad), sa = Math.sin(a * rad), f = [cp * ca, -sp, cp * sa];
    return { pos: [gx - f[0] * R, gy - f[1] * R, gz - f[2] * R], target: [gx, gy, gz], up: [sp * ca, cp, sp * sa], fov, near: Math.max(0.1, R * 0.03), far: R * 8 + 40000, R, pitch: p, horizon: Math.tan(p * rad) / Math.tan((fov * rad) / 2) }; }   // horizon: its NDC y
  return { lift, B, mc, tMain, tMap, tRiser, tHit, X0, X1, Z0, Z1 };
}
