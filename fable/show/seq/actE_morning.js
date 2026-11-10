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
  const HN = Math.ceil(DUR * 120), OT = new Float64Array((HN + 1) * 2); { const r0 = cast.root(FREE, 0), o0 = cast.rot(yawAt(tFr), r0[0], r0[2]); OT[0] = C[0] - o0[0]; OT[1] = C[1] - o0[1];
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
    if (o.hero !== false) cast.actor('hero').set({ ...placeAt(t), track: FREE, time: t - tFr });
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
  const A = { C, EAST, FREE, tFr, DUR, placeAt, yawAt, faceAt, jointAt, soft, HUB, TK, tAhead, count, J, people, runnerAt, roads, box: { x0, x1, z0, z1 }, nearR, farR, curve };
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
  // the ground point slides along main from her to the map's centre in proportion to the distance, so main's orange stays under the centre all the way up.
  //            t         lead  Gy    side  ln R             pitch  az   fov
  const LK = curve([
    [bar(144),    0.9,  1.22, 1.0,  ln(4.5),         2.5,   -14, 42],
    [bar(145),    1.5,  1.16, 0.8,  ln(5.6),         5,     -12, 42],
    [bar(146),    2.3,  1.08, 0.5,  ln(7.2),         7.5,   -12, 42],
    [bar(147),    3.2,  0.98, 0.2,  ln(9.5),         10,    -15, 42],
    [tMain,       4.5,  0.8,  0,    ln(14),          14.5,  -21, 42],
    [bar(149),    4.5,  0,    0,    ln(300),         55,    -56, 39],
    [tMap,        4.5,  0,    0,    ln(B.h),         90,    -90, 35],
    [tRiser,      4.5,  0,    0,    ln(B.h * 0.955), 90,    -90, 35],
  ]);
  const R1 = 14, DIVE = [lerp(mc[0], 0, 0.86), lerp(mc[1], 0, 0.86)];
  function lift(t) { let [lead, gy, side, lr, p, a, fov] = LK(t); const h = A.soft(Math.min(t, A.tFr + A.DUR - 0.7), 0.6), w = clamp01((Math.exp(lr) - R1) / (B.h * 0.955 - R1));
    let gx = lerp(h.x + lead, mc[0], w), gz = lerp(h.z + side, mc[1], w);
    if (t > tRiser) { const e = Math.pow(seg(t, tRiser, tHit), 2.4); gx = lerp(gx, DIVE[0], e); gz = lerp(gz, DIVE[1], e); lr = lerp(lr, ln(B.h / 7), e); }
    const R = Math.exp(lr), cp = Math.cos(p * rad), sp = Math.sin(p * rad), ca = Math.cos(a * rad), sa = Math.sin(a * rad), f = [cp * ca, -sp, cp * sa];
    return { pos: [gx - f[0] * R, gy - f[1] * R, gz - f[2] * R], target: [gx, gy, gz], up: [sp * ca, cp, sp * sa], fov, near: Math.max(0.1, R * 0.03), far: R * 8 + 40000, R, pitch: p, horizon: Math.tan(p * rad) / Math.tan((fov * rad) / 2) }; }   // horizon: its NDC y
  return { lift, B, mc, tMain, tMap, tRiser, tHit, X0, X1, Z0, Z1 };
}
