// ACT C (seqs 08-10, bars 73-104): the thousand. One performer copied 1,024 times; index 0 is the hero. Everything here is a pure function of song time.
//
// THE GROUND PLAN (metres, relative to H = the hero's spot on main, the road under her feet; east = +x = the sun)
//   rings     1,023 slots on concentric half-arcs round her (first ring 7 m, 2.2 m apart), with an aisle along main to the west and to the east.
//             The slots never move. A slot is FILLED when its copy is born: stage k (2^k dancers) on the downbeat of bar 73 + k.
//               stage 1-8  a quarter fan toward the sun (|bearing| < 45 deg) growing outward: the wedge
//               stage 9    the fan opens to a half circle (b82), stage 10 it closes into full rings behind her (b83)
//             A new copy leaves its parent as a streak (a road written on the mirror in its lane colour, 0.3 s) and locks into its slot.
//   MAIN      the word (Archivo 900 condensed), in body-sized cells (0.8 x 2.05 m), centred on her rings and on main.
//             The hero's own place is the HEAD of main, 6.5 m east of the top of the letters.
// THE PERFORMANCE (CHOREO B; the baked tracks, the same for the hero and every copy)
//   b73      `land` (impact frame 125.343, 0.2 s) -> `build` (song_t0 = b73). They face WEST, the camera, the way they came.
//   b82      the 360 spin is given another 195 degrees: from b82.7 everyone faces the sun (the butterfly's meta.best_yaw 165), for the rest of the act.
//   b88.3    `build` -> `drop` on the still coil (identical poses).
//   b89      the hero's butterfly is a SOLO. The copies hold the coil; her landing (153.42) sends a ripple outward (11 ms per metre) on which each copy
//            drops to the landing crouch (hips kept in place), and from b89.5 all 1,024 are in unison (gongbu punch on b90.1).
//   b93      on the downbeat everyone breaks and RUNS to her letter cell (sprint_loop / run_loop at 0.85-1.15 of the loop's own speed, feet on the beat
//            where the distance allows), straight lines, nobody slides. On arrival she is back in `drop`, facing the sun. All are in by b96.2.
//            The hero runs east along main (sprint_loop, then sprint_stop_look's real brake) and stands at the head.
//   b97      the fall. Hero flat on 167.082; the others hold the standing `set` pose a moment longer: a ripple outward from her, last body 0.4 s later.
//   b98-104  rise, arms wide, last phrase, jump kick, bao quan: unison, facing the sun (no procedural turn).
import { setFont } from '../../engine/src/type.js';
import { hash1, mulberry32 } from '../../engine/src/rng.js';

export const N = 1024;
const sm = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const easeOut = (u) => 1 - Math.pow(1 - Math.min(1, Math.max(0, u)), 3);

export function makeActC(K) {
  const { bar, bb, world: W, cast, E } = K; const hx = W.FORM[0], hz = W.FORM[1];
  const WEST = -Math.PI / 2, EAST = Math.PI / 2, YD = WEST - (195 * Math.PI) / 180;          // YD = 75 deg (mod 360): toward the sun, 15 deg open to the lens
  const LANES = (K.LANES8 = ['rose', 'gold', 'mint', 'cyan', 'magenta', 'blue', 'coral']);
  const laneOf = (i) => (i === 0 ? 'main' : LANES[i % 7]);
  const TP = 0.30;                                                                             // a peel-out lasts this long

  // ---------------------------------------------------------------- rings
  const R0 = 7, DR = 2.2, DS = 2.2, AISLE = 1.6;
  const slots = [];                                                                            // { r, a (bearing from east, signed, + = south/+z), j }
  for (let j = 0; slots.length < N - 1; j++) { const r = R0 + DR * j, a0 = Math.asin(AISLE / r), span = Math.PI - 2 * a0, m = Math.floor((r * span) / DS);
    const ph = j % 2 ? 0.08 : 0.5;                                                             // odd rings start at the aisle: from the front the second arc stands in the gaps of the first
    for (let q = 0; q < m; q++) for (const s of [1, -1]) slots.push({ r, a: s * (a0 + ((q + ph) * span) / m), j }); }
  // keep exactly 1,023: drop the surplus from the last ring, from its west end (nearest the aisle behind her)
  { const last = slots[slots.length - 1].j, extra = slots.length - (N - 1); const outer = slots.filter((s) => s.j === last).sort((p, q) => Math.abs(q.a) - Math.abs(p.a)); const kill = new Set(outer.slice(0, extra)); for (let i = slots.length - 1; i >= 0; i--) if (kill.has(slots[i])) slots.splice(i, 1); }
  // birth order: by |bearing| into quarter (255), half (511), full (1,023); inside the quarter by radius (the wedge grows outward)
  slots.sort((p, q) => Math.abs(p.a) - Math.abs(q.a) || p.r - q.r);
  const quarter = slots.slice(0, 255).sort((p, q) => p.r - q.r || Math.abs(p.a) - Math.abs(q.a) || p.a - q.a), wing = slots.slice(255, 511), back = slots.slice(511);
  const order = [...quarter, ...wing, ...back];
  const stageOf = (i) => (i === 0 ? 0 : 32 - Math.clz32(i));                                    // copy i is born at stage k: 2^(k-1) <= i < 2^k
  const S = order.map((s, q) => ({ ...s, i: q + 1, k: stageOf(q + 1), x: hx + s.r * Math.cos(s.a), z: hz + s.r * Math.sin(s.a) }));
  S.unshift({ r: 0, a: 0, j: -1, i: 0, k: 0, x: hx, z: hz });
  // parents: every dancer on stage sends out one copy. Stages 1-8: matched by bearing on each side (streaks run outward); 9, 10: ring by ring (the arcs are drawn round her)
  const zip = (ps, cs, key) => { ps.sort(key); cs.sort(key); const n = Math.min(ps.length, cs.length); for (let q = 0; q < n; q++) cs[q].par = ps[q]; return [ps.slice(n), cs.slice(n)]; };
  for (let k = 1; k <= 10; k++) { const kids = S.filter((s) => s.k === k), pars = S.filter((s) => s.k < k && s.i > 0); let lp = [], lc = [];
    if (k >= 9) { const rings = new Set(kids.map((s) => s.j)); for (const j of rings) for (const sd of [1, -1]) { const [a, b] = zip(pars.filter((s) => s.j === j && Math.sign(s.a) === sd), kids.filter((s) => s.j === j && Math.sign(s.a) === sd), (p, q) => p.a - q.a); lp.push(...a); lc.push(...b); }
      for (const p of pars) if (!rings.has(p.j)) lp.push(p); }
    else for (const sd of [1, -1]) { const [a, b] = zip(pars.filter((s) => Math.sign(s.a) === sd), kids.filter((s) => Math.sign(s.a) === sd), (p, q) => Math.abs(p.a) - Math.abs(q.a) || p.r - q.r); lp.push(...a); lc.push(...b); }
    lp.unshift(S[0]); zip(lp, lc, (p, q) => p.r - q.r || p.a - q.a); }
  // the peel-out path of copy i: polar about the hero (from her own centre the first copies fly straight out)
  const dAng = (s) => { let d = s.a - s.par.a; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI; return d; };
  const peelAt = (s, u) => { const p = s.par, r = p.r + (s.r - p.r) * u, a = p.i === 0 ? s.a : p.a + dAng(s) * u; return [hx + r * Math.cos(a), hz + r * Math.sin(a)]; };
  const tBorn = (k) => bar(73 + k);
  const stageAt = (t) => { let k = 0; while (k < 10 && t >= tBorn(k + 1)) k++; return k; };
  // the peel-outs as roads, one set per stage (g = 0..1 along the flight)
  const streaks = []; for (let k = 1; k <= 10; k++) { const defs = S.filter((s) => s.k === k).map((s) => { const len = Math.hypot(s.x - (hx + s.par.r * Math.cos(s.par.a)), s.z - (hz + s.par.r * Math.sin(s.par.a))) + (s.par.i === 0 ? 0 : Math.abs(dAng(s))) * s.r, n = Math.max(3, Math.min(40, Math.ceil(len / 2.5))); const pts = [];
      for (let q = 0; q <= n; q++) pts.push(peelAt(s, q / n)); return { pts, g: [0, 1], color: K.hex(K.LANE[laneOf(s.i)]), width: 0.028 }; });
    streaks.push(E.roads(defs, { step: k >= 9 ? 1.0 : 0.5 })); }
  // drawables for the streaks at time t. o: { rest: residual gain once written (default 0.22; older stages fade further), gain }
  function streakDraw(t, o = {}) { const out = [], rest0 = o.rest ?? 0.22, now = stageAt(t);
    for (let k = 1; k <= 10; k++) { const age = t - tBorn(k); if (age < 0) break; const u = easeOut(age / TP), hot = Math.exp(-Math.max(0, age - TP * 0.6) / 0.45), rest = rest0 * Math.pow(0.6, Math.max(0, now - k - 1)); const g = (o.gain ?? 1) * (rest + (2.6 - rest) * hot); if (g < 0.01) continue;
      out.push(streaks[k - 1].drawable({ head: u * 1.001, gain: g, textGain: 0, minPx: 0.9 + 1.1 * hot, halo: 0.1 + 0.25 * hot, haloPx: 4, headGain: age < TP ? 3 : 0, headLen: 0.12, soft: 0.02, flow: 0 })); }
    return out; }

  // ---------------------------------------------------------------- MAIN, made of bodies
  // Reading direction = +z (screen-right in the east-up top-down view); letters stand up toward +x (the sun). A body lies along x, feet west, head east.
  const CW = 0.8, CL = 2.05, GAP = 6.5; const cells = []; let box = null, zShift = 0;
  { const c = document.createElement('canvas'); c.width = 1800; c.height = 420; const g = c.getContext('2d'); setFont(g, 'hookc', 300); g.font = '900 300px Archivo'; try { g.fontStretch = 'condensed'; } catch (e) {} g.fillStyle = '#fff'; g.textBaseline = 'alphabetic'; try { g.letterSpacing = '20px'; } catch (e) {}
    const m = g.measureText('MAIN'), tw = m.width, cap = m.actualBoundingBoxAscent, X0 = (1800 - tw) / 2; g.fillText('MAIN', X0, 360); const img = g.getImageData(0, 0, 1800, 420).data;
    const cov = (u, v) => { const x = Math.round(X0 + u * tw), y = Math.round(360 - v * cap); if (x < 0 || x >= 1800 || y < 0 || y >= 420) return 0; return img[(y * 1800 + x) * 4 + 3] / 255; };
    // the empty columns between the letters: the 2nd one (A|I) goes on main
    const gaps = []; { let run = null, ink = false; for (let x = Math.round(X0) - 4; x < X0 + tw + 4; x++) { let any = 0; for (let y = 360 - Math.round(cap); y <= 360; y += 3) any += img[(y * 1800 + x) * 4 + 3]; if (!any) { if (ink) { if (!run) run = [x, x]; run[1] = x; } } else { ink = true; if (run) { gaps.push(run); run = null; } } } }
    const uGap = 0.5;   // the word is centred on main (the road runs under the A)
    const make = (Hm) => { const Wm = (Hm * tw) / cap, out = [], nz = Math.round(Wm / CW), nx = Math.round(Hm / CL); for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) { const u = (b + 0.5) / nz, v = (a + 0.5) / nx; let cv = 0; for (const dv of [-0.3, 0, 0.3]) for (const du of [-0.25, 0.25]) cv += cov(u + du / nz, v + dv / nx); cv /= 6;
        if (cv > 0.5) out.push({ x: (a + 0.5) * CL, z: (u - uGap) * Wm, cv: cv + 1e-4 * hash1(a * 131 + b) }); } return { out, Wm, Hm: nx * CL }; };
    let lo = 10, hi = 90; for (let it = 0; it < 40; it++) { const mid = (lo + hi) / 2; if (make(mid).out.length >= N - 1) hi = mid; else lo = mid; }
    const C = make(hi), list = C.out.sort((p, q) => q.cv - p.cv).slice(0, N - 1); const xb = hx - C.Hm / 2;                 // the word is centred on her rings
    for (const q of list) cells.push({ x: xb + q.x, z: hz + q.z }); box = { x0: xb, x1: xb + C.Hm, z0: hz - uGap * C.Wm, z1: hz + (1 - uGap) * C.Wm }; }
  const head = [box.x1 + GAP, hz];                                                               // the hero's feet at the head of main
  const view = { x0: box.x0, x1: head[0] + 2.2, z0: box.z0, z1: box.z1 };                        // what the top-down shot must hold

  // ---------------------------------------------------------------- the tracks
  const tBuild = cast.songT0('build') || bar(73), tDrop = cast.songT0('drop') || bar(89) - 1.5, tLand = cast.songT0('land') || bar(73) - 0.495, tCoil = bb(88, 3);
  const tLandEnd = bar(73) + 0.2, tSpin0 = 141.04, tSpin1 = 142.24, tHold = 152.6, tHeroLands = 153.423, tLow = 154.2, tRun = bar(93), tSet = 166.42, tFall = bar(97), tUnison = 167.9;
  const cen = cast.meta('drop').center || [0.994, 0.975];
  const rootXZ = (track, time) => { const r = cast.root(track, time); return [r[0], r[2]]; };
  const dLand = (() => { const a = rootXZ('land', tLandEnd - tLand), b = rootXZ('build', tLandEnd - tBuild); return [b[0] - a[0], b[1] - a[1]]; })();   // `land`'s crouch laid on `build`'s
  const coil = rootXZ('drop', tHold - tDrop), low = rootXZ('drop', tLow - tDrop), at93 = rootXZ('drop', tRun - tDrop);
  const yawBuild = (tt) => WEST - ((195 * Math.PI) / 180) * sm(seg(tt, tSpin0, tSpin1));
  // per copy: where its `drop` origin sits from the ripple on (hips kept where the coil had them), where it starts running, where it stands in MAIN
  const P = S.map((s) => { const d = cast.rot(YD, coil[0] - low[0], coil[1] - low[1]), o2 = s.i === 0 ? [s.x, s.z] : [s.x + d[0], s.z + d[1]], h = cast.rot(YD, at93[0], at93[1]);
    return { o2, A: [o2[0] + h[0], o2[1] + h[1]], tSw: s.i === 0 ? -1 : tHeroLands + 0.011 * s.r }; });
  // ring people -> letter cells: split both sets at the median along the longer side, recursively (neighbours stay neighbours, few crossings)
  { const ai = []; for (let i = 1; i < N; i++) ai.push(i); const bi = cells.map((_, q) => q);
    const rec = (a, b) => { if (a.length === 1) { P[a[0]].cell = cells[b[0]]; return; } let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const q of b) { const c = cells[q]; x0 = Math.min(x0, c.x); x1 = Math.max(x1, c.x); z0 = Math.min(z0, c.z); z1 = Math.max(z1, c.z); }
      const ax = x1 - x0 > z1 - z0 ? 0 : 1; a.sort((p, q) => P[p].A[ax] - P[q].A[ax]); b.sort((p, q) => (ax ? cells[p].z - cells[q].z : cells[p].x - cells[q].x)); const h = a.length >> 1; rec(a.slice(0, h), b.slice(0, h)); rec(a.slice(h), b.slice(h)); };
    rec(ai, bi);
    // then relax: swap the cells of two dancers whenever that shortens the sum of squared runs (seeded; pulls in the longest runs)
    const rnd = mulberry32(97), d2 = (i, c) => (c.x - CL / 2 + 0.12 - P[i].A[0]) ** 2 + (c.z - P[i].A[1]) ** 2;
    for (let it = 0; it < 600000; it++) { const i = 1 + Math.floor(rnd() * (N - 1)), j = 1 + Math.floor(rnd() * (N - 1)); if (i === j) continue; const ci = P[i].cell, cj = P[j].cell;
      if (d2(i, cj) + d2(j, ci) < d2(i, ci) + d2(j, cj)) { P[i].cell = cj; P[j].cell = ci; } } }
  const oc = cast.rot(EAST, cen[0], cen[1]); const T96 = bar(96) - tRun; let dMax = 0, dSum = 0, late = 0; const sprint = cast.speed('sprint_loop') || 4.926, run = cast.speed('run_loop') || 3.418;
  for (let i = 1; i < N; i++) { const p = P[i], B = [p.cell.x - CL / 2 + 0.12, p.cell.z]; p.B = B; p.oF = [B[0] - oc[0], B[1] - oc[1]]; const dx = B[0] - p.A[0], dz = B[1] - p.A[1], d = Math.hypot(dx, dz); p.d = d; p.dir = d > 1e-3 ? [dx / d, dz / d] : [1, 0]; p.yaw = Math.atan2(p.dir[0], p.dir[1]);
    if (d < 0.5) { p.v = 1; p.tArr = tRun; p.loop = 'run_loop'; p.rate = 1; } else if (d < 8) { p.loop = 'run_loop'; p.rate = 0.88; p.v = run * p.rate; p.tArr = tRun + d / p.v; }
    else { p.loop = 'sprint_loop'; p.rate = Math.min(1.15, Math.max(0.85, d / T96 / sprint)); p.v = sprint * p.rate; p.tArr = tRun + d / p.v; }
    p.ph = hash1(i * 17 + 3) < 0.5 ? 0 : 0.5 * cast.dur(p.loop); dMax = Math.max(dMax, d); dSum += d; if (p.tArr > bar(96)) late = Math.max(late, p.tArr); }
  // the hero: sprint_loop from where the phrase left her, then sprint_stop_look from its frame 0 (its own root motion: 2 s of sprint and the brake) to the head of main
  const SSL = 'sprint_stop_look', sEnd = rootXZ(SSL, 5.0); { const p = P[0]; p.B = head; p.oF = [head[0] - oc[0], head[1] - oc[1]]; const dx = head[0] - p.A[0], dz = head[1] - p.A[1], d = Math.hypot(dx, dz); p.d = d; p.dir = [dx / d, dz / d]; p.yaw = Math.atan2(dx, dz);
    const e = cast.rot(p.yaw, sEnd[0], sEnd[1]); p.oS = [head[0] - e[0], head[1] - e[1]]; p.rate = 1.1; p.v = sprint * p.rate; p.dLoop = Math.max(0, Math.hypot(p.oS[0] - p.A[0], p.oS[1] - p.A[1])); p.tSSL = tRun + p.dLoop / p.v; p.tArr = p.tSSL + 3.7; p.tJoin = tSet - 0.02; }
  // the fall: a ripple outward from the hero, last body 0.4 s after her
  { let m = 0; for (let i = 1; i < N; i++) { P[i].rf = Math.hypot(P[i].B[0] - head[0], P[i].B[1] - head[1]); m = Math.max(m, P[i].rf); } for (let i = 1; i < N; i++) P[i].tau = (0.4 * P[i].rf) / m; P[0].tau = 0; P[0].rf = 0; }
  console.log(`actC: rings ${slots.length} (outer r ${S[N - 1].r.toFixed(1)} m), MAIN ${cells.length} cells ${(box.z1 - box.z0).toFixed(0)} x ${(box.x1 - box.x0).toFixed(0)} m (z ${box.z0.toFixed(0)}..${box.z1.toFixed(0)}), run mean ${(dSum / (N - 1)).toFixed(1)} m max ${dMax.toFixed(1)} m, last in ${late ? late.toFixed(2) : 'by b96'}; hero runs ${P[0].d.toFixed(1)} m, stops ${P[0].tArr.toFixed(2)}`);

  // ---------------------------------------------------------------- one dancer at song time t
  // returns { pos, yaw, track, time, lane, seed, gain, alpha } ; o: { canon: s per metre from the hero (the side truck) }
  function dancer(i, t, o) { const s = S[i], p = P[i], hero = i === 0, out = { lane: laneOf(i), seed: hero ? 0 : i + 1, gain: 1, alpha: 1 };
    if (t < tRun) {
      let tt = t; if (o.canon && !hero && t < tCoil) tt = t - o.canon * s.r;
      if (tt < tCoil) { out.track = 'build'; out.time = tt - tBuild; out.yaw = yawBuild(tt); out.pos = [s.x, 0, s.z];
        if (hero && t < tLandEnd) { const d = cast.rot(WEST, dLand[0], dLand[1]); out.track = 'land'; out.time = t - tLand; out.pos = [s.x + d[0], 0, s.z + d[1]]; }
        if (!hero) { const age = t - tBorn(s.k); if (age < TP) { const q = peelAt(s, easeOut(age / TP)); out.pos = [q[0], 0, q[1]]; out.alpha = 0.35 + 0.65 * sm(age / TP); } if (age < 0.9) out.gain = 1 + 1.6 * Math.exp(-age / 0.25); } }
      else { out.track = 'drop'; out.yaw = YD;
        if (hero || t >= tLow) { out.time = t - tDrop; out.pos = [p.o2[0], 0, p.o2[1]]; if (hero && t < tLow) out.pos = [s.x, 0, s.z]; }
        else if (t < p.tSw) { out.time = Math.min(t, tHold) - tDrop; out.pos = [s.x, 0, s.z]; }
        else { out.time = tLow - tDrop; out.pos = [p.o2[0], 0, p.o2[1]]; } }
      return out; }
    if (hero) {
      if (t < p.tSSL) { out.track = 'sprint_loop'; out.time = (t - p.tSSL) * p.rate; out.yaw = p.yaw; const q = (t - tRun) * p.v; out.pos = [p.A[0] + p.dir[0] * q, 0, p.A[1] + p.dir[1] * q]; return out; }
      if (t < p.tJoin) { out.track = SSL; out.time = t - p.tSSL; out.yaw = p.yaw; out.pos = [p.oS[0], 0, p.oS[1]]; return out; }
    } else if (t < p.tArr) { out.track = p.loop; out.time = (t - tRun) * p.rate + p.ph; out.yaw = p.yaw; const q = (t - tRun) * p.v; out.pos = [p.A[0] + p.dir[0] * q, 0, p.A[1] + p.dir[1] * q]; return out; }
    let tt = t; if (t >= tSet && t < tUnison) tt = Math.max(tSet, t - p.tau);
    out.track = 'drop'; out.time = tt - tDrop; out.yaw = EAST; out.pos = [p.oF[0], 0, p.oF[1]];
    return out; }
  // fill the crowd; returns how many are on stage
  function thousand(t, o = {}) { const cr = cast.crowd('thousand', N), n = t < bar(73) ? 0 : 1 << stageAt(t); for (let i = 0; i < n; i++) { const d = dancer(i, t, o); if (o.each) o.each(i, d); cr.put(i, d); } return n; }
  // where the hero's hips are (world), for cameras and for main's write head
  const heroHips = (t) => { const d = dancer(0, t, {}); return cast.hips(d.track, d.time, d.pos, d.yaw); };
  // main is written under her feet: the g of main at world x
  const headAt = (x) => { let a = bar(60), b = bar(120); if (W.eastX(b) <= x) return 1e9; for (let q = 0; q < 40; q++) { const m = (a + b) / 2; if (W.eastX(m) < x) a = m; else b = m; } return b; };
  const mainHead = (t) => headAt(heroHips(t)[0] - 0.1);
  // pools of light under the fallen bodies (the letters glow as they are laid down), and the same list for any other moment
  function fallGlow(t, o = {}) { const list = [], c0 = o.color || [1.0, 0.55, 0.22];
    for (let i = 0; i < N; i++) { const p = P[i], age = t - (tFall + p.tau); if (age < 0) continue; const hit = Math.exp(-age / 0.35), up = 1 - 0.4 * sm(seg(t, bar(98.2), bar(99.2))), k = (0.20 + 0.45 * hit) * up * (o.gain ?? 1); if (k < 0.004) continue;
      const c = i === 0 ? [1.6, 0.62, 0.16] : c0; list.push({ x: p.B[0] + 0.95, z: p.B[1], r: 1.7 + 0.5 * hit, c: [c[0] * k, c[1] * k, c[2] * k] }); }
    return list.length ? [W.glow(list)] : []; }

  return { N, S, P, hx, hz, box, head, view, cells, CW, CL, WEST, EAST, YD, TP, tBorn, stageAt, peelAt, streakDraw, dancer, thousand, heroHips, mainHead, headAt, fallGlow, laneOf,
    times: { tBuild, tDrop, tLand, tCoil, tHeroLands, tLow, tRun, tSet, tFall, tUnison } };
}
