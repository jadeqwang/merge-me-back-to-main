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
  // her hips over the ground: the track's own steps, each turned by the yaw she has at that moment (so the extra half turn never moves her), tabulated once at 120 Hz
  const HN = Math.ceil(DUR * 120), HT = new Float32Array((HN + 1) * 2); { HT[0] = C[0]; HT[1] = C[1]; let p = cast.root(FREE, 0);
    for (let i = 0; i < HN; i++) { const q = cast.root(FREE, (i + 1) / 120), o = cast.rot(yawAt(tFr + (i + 0.5) / 120), q[0] - p[0], q[2] - p[2]); HT[i * 2 + 2] = HT[i * 2] + o[0]; HT[i * 2 + 3] = HT[i * 2 + 1] + o[1]; p = q; } }
  const hipsXZ = (t) => { const f = Math.min(HN - 1e-4, Math.max(0, (t - tFr) * 120)), i = Math.floor(f), u = f - i; return [HT[i * 2] + (HT[i * 2 + 2] - HT[i * 2]) * u, HT[i * 2 + 1] + (HT[i * 2 + 3] - HT[i * 2 + 1]) * u]; };
  const placeAt = (t) => { const yaw = yawAt(t), h = hipsXZ(t), r = cast.root(FREE, t - tFr), o = cast.rot(yaw, r[0], r[2]); return { pos: [h[0] - o[0], 0, h[1] - o[1]], yaw }; };   // -> cast.actor('hero').set
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
  function make(parent, kb, side, iv, start, ph0, track, fromHero) {
    const id = J.length, tb = TK[kb], rate = 0.93 + 0.14 * hash1(id * 17 + 3), speed = cast.speed(track) * rate, j = { id, parent, kb, tb, side, track, rate, speed, ph0, fromHero, y0: start.y || 0, name: 'jade/' + NAMES[(id - 1) % NAMES.length] };
    j.top = parent.hero ? j : parent.top; j.lane = LN[(parent.hero ? id - 1 : LN.indexOf(parent.lane) + 1 + (id % 5)) % LN.length]; J.push(j);
    // her place in the fan, halved at every later fork; who keeps which half is seeded
    const ivs = []; let cur = iv; const kids = []; for (let k = kb; k < TK.length; k++) { if (k > kb && cur[1] - cur[0] >= 2) { const m = (cur[0] + cur[1]) >> 1, a = [cur[0], m], b = [m, cur[1]], keepA = hash1(id * 31 + k * 7) < 0.5; kids.push({ k, iv: keepA ? b : a }); cur = keepA ? a : b; } ivs[k] = cur; }
    const Ln = speed * (T_NEAR - tb), ds = 0.2, pts = [[start.x, start.z]], hs = []; let x = start.x, z = start.z, h = start.h;
    for (let s = 0; s < Ln; s += ds) { const t = tb + s / speed; let k = kb; while (k < TK.length - 1 && t >= TK[k + 1]) k++; const th = ctr(side, ivs[k]);
      const rho = Math.hypot(x - HUB.x, z - HUB.z), La = 7, hd = Math.atan2(HUB.z + (rho + La) * Math.sin(th) - z, HUB.x + (rho + La) * Math.cos(th) - x);
      if (start.h === undefined && s === 0) h = hd;
      const mx = ds / 3.2; h += Math.min(mx, Math.max(-mx, wrap(hd - h))); hs.push(h); x += Math.cos(h) * ds; z += Math.sin(h) * ds; pts.push([x, z]); }
    const sA = speed * (tAhead - tb), thT = ctr(side, ivs[TK.length - 1]), Lfar = 620 * (0.7 + 0.5 * hash1(id * 53 + 11)), tot = Ln - sA + Lfar;
    const gs = []; for (let i = 0; i <= 160; i++) { const s = (Ln * i) / 160; gs.push(s <= sA ? tb + s / speed : gAhead(s - sA, tot)); }
    nearDefs.push({ pts, gs, color: K.hex(K.LANE[j.lane]), width: 0.035, text: j.name, textSize: 0.46, textSide: -1, textStart: 2.2, textGap: 9, nodes: [{ s: 0, r: fromHero ? 0.2 : 0.22, g: tb }], step: 0.2 });
    const fp = [[x, z]], fg = [gAhead(Ln - sA, tot)], dF = 6; for (let s = dF; s <= Lfar; s += dF) { const rho = Math.hypot(x - HUB.x, z - HUB.z), ht = thT + 0.2 * fbm1(rho / 260, 7, 2) * Math.min(1, Math.abs(thT) / 0.45) + 0.05 * fbm1(rho / 90, 40 + id, 2);
      h += Math.min(dF / 70, Math.max(-dF / 70, wrap(ht - h))); x += Math.cos(h) * dF; z += Math.sin(h) * dF; fp.push([x, z]); fg.push(gAhead(Ln - sA + s, tot)); }
    farDefs.push({ pts: fp, gs: fg, color: K.hex(K.LANE[j.lane]), width: 0.035 });
    Object.assign(j, { Ln, pts, hs, ds, end: [x, z], kids });
    j.at = (s) => { const f = Math.min(pts.length - 1.001, Math.max(0, s / ds)), i = Math.floor(f), u = f - i; return { x: pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, z: pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u, h: hs[Math.min(hs.length - 1, i)] }; };
    for (const q of kids) { const s = speed * (TK[q.k] - tb), a = j.at(s); make(j, q.k, side, q.iv, { x: a.x, z: a.z, h: a.h }, ph0 + rate * (TK[q.k] - tb), track, false); }
    return j;
  }
  const HC = [[-1, [10, 42], 'sprint_loop'], [1, [0, 16], 'sprint_loop'], [-1, [2, 10], 'run_loop'], [1, [16, 20], 'sprint_loop'], [-1, [0, 2], 'run_loop'], [1, [20, 21], 'sprint_loop']];
  HC.forEach(([side, iv, track], k) => { const p = jointAt(TK[k]); make(J[0], k, side, iv, { x: p[0], z: p[2], y: Math.max(0, p[1] - 0.99) }, cast.dur(track) * hash1(k * 5 + 1), cast.has(track) ? track : 'sprint_loop', true); });
  const nearR = E.roads(nearDefs, { step: 0.2, maxGlyphs: 60000 }), farR = E.roads(farDefs, { step: 6 });
  J.forEach((j, i) => { j.near = nearR.roads[i]; j.far = farR.roads[i]; });
  let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const d of farDefs) for (const p of d.pts) { x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }

  // ---- the people at song time t
  function people(t, o = {}) {
    if (o.hero !== false) cast.actor('hero').set({ ...placeAt(t), track: FREE, time: t - tFr });
    const cr = cast.crowd('morning', 64); let n = 0; const list = [];
    for (const j of J) { if (j.hero || t < j.tb) continue; const s = j.speed * (t - j.tb); if (s > j.Ln - 1) continue; const a = j.near.at(s); let alpha = 1, y = 0;
      if (j.fromHero) y = j.y0 * (1 - sm(seg(t, j.tb, j.tb + 0.3)));                    // she is there on the bar line, whole (a fork is instant); out of a leap she comes down running
      else { const b = j.parent.near.at(j.parent.speed * (t - j.parent.tb)); if (Math.hypot(a.x - b.x, a.z - b.z) < 0.05) continue; }           // she is still inside her twin
      list.push({ j, x: a.x, z: a.z, tx: a.tx, tz: a.tz });
      cr.put(n++, { pos: [a.x, y, a.z], yaw: Math.atan2(a.tx, a.tz), track: j.track, time: j.ph0 + j.rate * (t - j.tb), lane: j.lane, alpha, vary: 0, seed: j.id + 2 }); }
    cr.n = n; return list;
  }
  // where a branch's runner is (for cameras): { x, z, tx, tz }
  const runnerAt = (j, t) => j.near.at(Math.min(j.Ln - 1, Math.max(0, j.speed * (t - j.tb))));
  // the roads of the morning: near (human scale, with names) and far (after b147)
  const roads = (t, o = {}) => [nearR.drawable({ head: t, gain: 2.4, textGain: 0.9, minPx: 2.0, haloPx: 0, halo: 0, nodeMinPx: 2.0, ...o, ...(o.near || {}) }), farR.drawable({ head: t, gain: 2.4, textGain: 0, minPx: 2.0, haloPx: 0, halo: 0, ...o, ...(o.far || {}) })];
  const A = { C, EAST, FREE, tFr, placeAt, yawAt, jointAt, soft, HUB, TK, tAhead, count, J, people, runnerAt, roads, box: { x0, x1, z0, z1 }, nearR, farR, curve };
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
  //            t         Gx            Gy    Gz            ln R          pitch  az   fov
  const LK = curve([
    [bar(144),    H.x + 0.9,    1.22, H.z + 1.0,    ln(4.5),      2.5,   -14, 42],
    [bar(145),    H.x + 3.5,    1.15, H.z + 0.9,    ln(8.5),      7,     -11, 42],
    [bar(146),    H.x + 16,     0.9,  H.z + 0.2,    ln(27),       9.5,   -7,  42],
    [bar(147),    H.x + 48,     0.5,  H.z - 1.5,    ln(78),       10.5,  -3,  42],
    [tMain,       H.x + 105,    0,    H.z - 4,      ln(185),      11,    0,   42],
    [bar(149),    H.x + 150,    0,    H.z - 30,     ln(640),      38,    -24, 40],
    [bar(149.6),  lerp(H.x + 150, mc[0], 0.75), 0, lerp(H.z, mc[1], 0.75), ln(B.h * 0.55), 76, -68, 36],
    [tMap,        mc[0],        0,    mc[1],        ln(B.h),      90,    -90, 35],
    [tRiser,      mc[0],        0,    mc[1],        ln(B.h * 0.955), 90, -90, 35],
  ]);
  const DIVE = [lerp(mc[0], 0, 0.86), lerp(mc[1], 0, 0.86)];
  function lift(t) { let [gx, gy, gz, lr, p, a, fov] = LK(t);
    if (t > tRiser) { const e = Math.pow(seg(t, tRiser, tHit), 2.4); gx = lerp(gx, DIVE[0], e); gz = lerp(gz, DIVE[1], e); lr = lerp(lr, ln(B.h / 7), e); }
    const R = Math.exp(lr), cp = Math.cos(p * rad), sp = Math.sin(p * rad), ca = Math.cos(a * rad), sa = Math.sin(a * rad), f = [cp * ca, -sp, cp * sa];
    return { pos: [gx - f[0] * R, gy - f[1] * R, gz - f[2] * R], target: [gx, gy, gz], up: [sp * ca, cp, sp * sa], fov, near: Math.max(0.1, R * 0.03), far: R * 8 + 40000, R, pitch: p, horizon: Math.tan(p * rad) / Math.tan((fov * rad) / 2) }; }   // horizon: its NDC y
  return { lift, B, mc, tMain, tMap, tRiser, tHit, X0, X1, Z0, Z1 };
}
