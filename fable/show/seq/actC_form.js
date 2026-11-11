// ACT C (seqs 08-10, bars 73-104): the thousand. One performer copied 1,024 times; index 0 is the hero. Everything here is a pure function of song time.
//
// THE GROUND PLAN (metres, relative to H = the hero's spot on main, the road under her feet; east = +x = the sun)
//   rings     1,023 slots on concentric half-arcs round her (first ring 7 m, 2.2 m apart), with an aisle along main to the west and to the east.
//             The slots never move. A slot is FILLED when its copy is born: stage k (2^k dancers) on the downbeat of bar 73 + k.
//               stage 1-8  a quarter fan toward the sun (|bearing| < 45 deg) growing outward: the wedge
//               stage 9    the fan opens to a half circle (b82), stage 10 it closes into full rings behind her (b83)
//             A new copy leaves its parent as a streak (a road written on the mirror in its lane colour, 0.3 s) and locks into its slot.
//   MAIN      the word (Archivo 900 condensed, drawn tall: 0.45 of its width), in body-sized cells (0.8 x 2.05 m): 1,024 cells, 69 x 41 m, lying over the EAST half of the
//             rings (x +7..+48), so that everyone runs toward the sun or across it and nobody has to run back west. The hero is one of the cells: the outer edge of the
//             A's right leg, on main, with the open gap between the A and the I in front of her (east): she is marked only by her main-orange accents.
// THE PERFORMANCE (CHOREO B; the baked tracks, the same for the hero and every copy)
//   b73      `land` (impact frame 125.343, 0.2 s) -> `build` (song_t0 = b73). They face WEST, the camera, the way they came.
//   b82      the 360 spin is given another 195 degrees: from b82.7 everyone faces the sun (the butterfly's meta.best_yaw 165), for the rest of the act.
//   b88.3    `build` -> `drop` on the still coil (identical poses).
//   b89      the hero's butterfly is a SOLO. The copies hold the coil, breathing (`drop_join`); on b89.3 they sink, leap the butterfly's travel (1.5 m)
//            into the bow stance and punch with her on b90.1: all 1,024 in unison from there (`drop_join` is `drop` from 154.77).
//   b93      THE RUNS (actC_runs.js): stand -> run -> stand on `run_from_stand` / `run_loop` / `run_to_stand`, each on a path of a whole number of strides that ends facing
//            east on her cell. Everyone brakes together on b95.2 and stands by b96.1, so the far ones leave first: a wave. The hero and the copies that are in shot
//            until the b93 cut leave on or after the cut (they stand, `idle`, until their turn); copies that are out of every frame leave earlier (from b87.7,
//            behind the camera) and stay out of frame until the cut. b96.3 fists to the waist: `actC_set`, a track made here (run_to_stand, then 0.2 s of
//            FK blend into `drop`'s set pose, arriving on the beat).
//   b97      the fall. Everyone is flat BY 167.082: the wave runs inward, the far ends of the word go down first (up to 0.35 s early), the hero last, on the downbeat
//            (each copy's clock runs ahead of the song by its lead from the braking to the floor, and comes back to it while it lies still).
//   b98-104  rise, arms wide, last phrase, jump kick, bao quan: unison, facing the sun (no procedural turn).
import { setFont } from '../../engine/src/type.js';
import { hash1 } from '../../engine/src/rng.js';
import { planRuns } from './actC_runs.js';

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
  // The glyphs are drawn SQ times as wide as they are tall in the font (tall poster letters): the word is then 16:9 like the frame, and short enough in z to sit inside the rings.
  const CW = 0.8, CL = 2.05, SQ = 0.45, HERO_ROW = 3; const cells = []; let box = null, heroCell = -1, wordInfo = '';
  const tDrop = cast.songT0('drop') || bar(89) - 1.5, tRun = bar(93), T2 = bb(95, 2), YDc = WEST - (195 * Math.PI) / 180;
  const rootXZ = (track, time) => { const r = cast.root(track, time); return [r[0], r[2]]; };
  const at93 = rootXZ('drop', tRun - tDrop), cen = cast.meta('drop').center || [0.994, 0.975];
  const MF = cast.meta('run_from_stand'), MS = cast.meta('run_to_stand'), per = cast.dur('run_loop'), vRun = cast.speed('run_loop') || 3.418, FZ = MF.run_z0 ?? 3.1604, SZ = (MS.stand_xz || [0.037, 2.4454])[1], SX = (MS.stand_xz || [0.037, 2.4454])[0], PH0 = MF.loop_phase_t ?? 0.54, TACC = MF.run_from ?? 1.5;
  const lcK = (k) => per - PH0 + k * per, LkK = (k) => FZ + vRun * lcK(k) + SZ;
  { const c = document.createElement('canvas'); c.width = 1800; c.height = 420; const g = c.getContext('2d'); setFont(g, 'hookc', 300); g.font = '900 300px Archivo'; try { g.fontStretch = 'condensed'; } catch (e) {} g.fillStyle = '#fff'; g.textBaseline = 'alphabetic'; try { g.letterSpacing = '20px'; } catch (e) {}
    const m = g.measureText('MAIN'), tw = m.width, cap = m.actualBoundingBoxAscent, X0 = (1800 - tw) / 2; g.fillText('MAIN', X0, 360); const img = g.getImageData(0, 0, 1800, 420).data;
    const cov = (u, v) => { const x = Math.round(X0 + u * tw), y = Math.round(360 - v * cap); if (x < 0 || x >= 1800 || y < 0 || y >= 420) return 0; return img[(y * 1800 + x) * 4 + 3] / 255; };
    // the letters' extents in u (columns with ink): [M, A, I, N]
    const letters = []; { let st = -1; for (let x = Math.round(X0) - 4; x <= X0 + tw + 4; x++) { let any = 0; for (let y = 360 - Math.round(cap); y <= 360; y += 3) any += img[(y * 1800 + x) * 4 + 3]; if (any && st < 0) st = x; if (!any && st >= 0) { letters.push([(st - X0) / tw, (x - X0) / tw]); st = -1; } } }
    const make = (Hm) => { const Wm = (SQ * Hm * tw) / cap, out = [], nz = Math.round(Wm / CW), nx = Math.round(Hm / CL); for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) { const u = (b + 0.5) / nz, v = (a + 0.5) / nx; let cv = 0; for (const dv of [-0.3, 0, 0.3]) for (const du of [-0.25, 0.25]) cv += cov(u + du / nz, v + dv / nx); cv /= 6;
        if (cv > 0.5) out.push({ a, b, u, cv: cv + 1e-4 * hash1(a * 131 + b) }); } return { out, Wm, Hm: nx * CL, nx, nz }; };
    // the hero's cell: the outer (I-side) edge of the A's right leg on row HERO_ROW. The cells above it in its column and the two nearest cells of the next two rows
    // (a bite of about five bodies out of the leg's edge) are left out of the word: nobody stands between her and the sun, the gap between the A and the I opens
    // in front of her, and from the gap she is the nearest body to the lens
    const build = (Hm) => { const C = make(Hm), row = C.out.filter((q) => q.a === HERO_ROW && q.u > letters[1][0] && q.u < letters[1][1] + 0.004).sort((p, q) => q.u - p.u), hc = row[0] || C.out[0]; C.out = C.out.filter((q) => !(q.a > hc.a && (q.b === hc.b || (q.a <= hc.a + 2 && q.b < hc.b && q.b >= hc.b - 2)))); C.hc = hc; return C; };
    let lo = 10, hi = 90; for (let it = 0; it < 40; it++) { const mid = (lo + hi) / 2; if (build(mid).out.length >= N) hi = mid; else lo = mid; }
    const C = build(hi); let hc = C.hc;
    if (!hc) hc = C.out[0]; hc.cv = 9; const list = C.out.sort((p, q) => q.cv - p.cv).slice(0, N);
    // she runs LkK(3) = 14.24 m from where the phrase leaves her at b93 (1 m north-east of H) to her cell on main: 9.5 degrees off east, one arc, then straight along the road
    const a0 = cast.rot(YDc, at93[0], at93[1]), ph = (9.5 * Math.PI) / 180, s1 = (Math.abs(SX - a0[1]) - 3.2 * (1 - Math.cos(ph))) / Math.sin(ph), s2 = LkK(3) - s1 - 3.2 * ph, xH = hx + a0[0] + s1 * Math.cos(ph) + 3.2 * Math.sin(ph) + s2;
    const xb = xH - hc.a * CL - 0.12;
    for (const q of list) cells.push({ x: xb + (q.a + 0.5) * CL, z: hz + (q.u - hc.u) * C.Wm, a: q.a, b: q.b }); heroCell = list.indexOf(hc);
    box = { x0: xb, x1: xb + C.Hm, z0: hz - hc.u * C.Wm, z1: hz + (1 - hc.u) * C.Wm, zI: hz + (letters[2][0] - hc.u) * C.Wm, zA: hz + ((letters[1][0] + letters[1][1]) / 2 - hc.u) * C.Wm };
    wordInfo = `MAIN ${cells.length} cells ${C.Wm.toFixed(0)} x ${C.Hm.toFixed(0)} m (x +${(xb - hx).toFixed(1)}..+${(xb + C.Hm - hx).toFixed(1)}, z ${(box.z0 - hz).toFixed(0)}..${(box.z1 - hz).toFixed(0)}), hero cell row ${hc.a} of ${C.nx}`; }
  const standOf = (c) => [c.x - CL / 2 + 0.12, c.z];                                             // where a body stands in its cell (its feet at the west end: it falls forward, east, into the cell)
  const head = standOf(cells[heroCell]);                                                         // the hero's feet in the word
  const view = { x0: box.x0, x1: box.x1, z0: box.z0, z1: box.z1 };
  if (E.Q.get('cgeo')) console.log('actC geo: head', head.map((v) => v.toFixed(2)).join(','), 'box', JSON.stringify(box), 'near cells (dx,dz rel. to her feet): ' + cells.map((c) => standOf(c)).filter((b) => Math.abs(b[0] - head[0]) < 9 && Math.abs(b[1] - head[1]) < 9).map((b) => `${(b[0] - head[0]).toFixed(1)},${(b[1] - head[1]).toFixed(1)}`).join(' '));   // dev: --q "cgeo=1"                               // what the top-down shot must hold

  // ---------------------------------------------------------------- the tracks
  const tBuild = cast.songT0('build') || bar(73), tLand = cast.songT0('land') || bar(73) - 0.495, tCoil = bb(88, 3);
  const tLandEnd = bar(73) + 0.2, tSpin0 = 141.04, tSpin1 = 142.24, tHeroLands = 153.423, tLow = 154.2, tJoin = 166.30, tSet = 166.42, tFall = bar(97), tUnison = 167.9, tEarly = bar(86.5);
  const dLand = (() => { const a = rootXZ('land', tLandEnd - tLand), b = rootXZ('build', tLandEnd - tBuild); return [b[0] - a[0], b[1] - a[1]]; })();   // `land`'s crouch laid on `build`'s
  const JOIN = cast.has('drop_join') ? 'drop_join' : 'drop';     // drop_join (M3): the coil held through b89, then a leap into b90.1; same clock and place as `drop`
  const yawBuild = (tt) => WEST - ((195 * Math.PI) / 180) * sm(seg(tt, tSpin0, tSpin1));
  // per copy: where its `drop` origin sits (its slot: the copies leap the butterfly's travel with `drop_join`, so the formation keeps its shape round her)
  const P = S.map((s) => ({ o2: [s.x, s.z] }));
  // the earlier performance (build, then the drop phrase) of copy i at song time t: what it plays, and where its hips are on the ground
  const before = (i, t) => (t < tCoil ? { track: 'build', time: t - tBuild, yaw: yawBuild(t) } : { track: i === 0 ? 'drop' : JOIN, time: t - tDrop, yaw: YD });
  const startOf = (i, t) => { const b = before(i, t), r = rootXZ(b.track, b.time), o = cast.rot(b.yaw, r[0], r[1]); return [P[i].o2[0] + o[0], P[i].o2[1] + o[1]]; };

  // ---------------------------------------------------------------- the set (b96.3): `run_to_stand` leaves her standing with her arms down, `drop`'s set pose has the fists
  // at the waist (0.29 m apart in the forearm). `actC_set` = run_to_stand's first 121 frames as they are, then 12 frames (0.2 s) easing into `drop` at the same song time:
  // world orientations nlerp'd joint by joint, positions rebuilt down the skeleton (bone offsets in the parent's frame), so no bone changes length. Its last frame IS
  // `drop`'s pose at tSet2 (laid on run_to_stand's hips), and `drop` takes over there. Made once, at start-up; deterministic.
  const SETN = 'actC_set', NB0 = 121, NB1 = 133, tSet2 = T2 + NB1 / 60, LEAD = 0.35, tFS = tDrop + (cast.event('drop', 'fall_start') ?? 14.913);
  const setOK = (() => { const A = cast.tracks && cast.tracks.run_to_stand, B = cast.tracks && cast.tracks.drop; if (E.Q.get('cnoset') || !A || !B || A.frames <= NB1 + 1 || A.fps !== 60 || B.fps !== 60) return false; if (cast.tracks[SETN]) return true;
    const PAR = [-1, 0, 1, 2, 3, 2, 5, 6, 7, 2, 9, 10, 11, 0, 13, 14, 15, 0, 17, 18, 19];
    const nl = (a, ao, b, bo, w, o, oo) => { let d = 0, n = 0; for (let c = 0; c < 4; c++) d += a[ao + c] * b[bo + c]; const sg = d < 0 ? -1 : 1; for (let c = 0; c < 4; c++) { o[oo + c] = a[ao + c] + (sg * b[bo + c] - a[ao + c]) * w; n += o[oo + c] * o[oo + c]; } n = Math.sqrt(n) || 1; for (let c = 0; c < 4; c++) o[oo + c] /= n; };
    const smp = (T, time) => { const ft = Math.min(T.frames - 1, Math.max(0, time * 60)), f0 = Math.min(T.frames - 2, Math.floor(ft)), u = ft - f0, D = T.data, o = new Float32Array(147);
      for (let j = 0; j < 21; j++) { const a = f0 * 147 + j * 7; for (let c = 0; c < 3; c++) o[j * 7 + c] = D[a + c] + (D[a + 147 + c] - D[a + c]) * u; nl(D, a + 3, D, a + 150, u, o, j * 7 + 3); } return o; };
    const qr = (q, o, v, inv) => { const k = inv ? -1 : 1, x = k * q[o], y = k * q[o + 1], z = k * q[o + 2], w = q[o + 3], tx = 2 * (y * v[2] - z * v[1]), ty = 2 * (z * v[0] - x * v[2]), tz = 2 * (x * v[1] - y * v[0]); return [v[0] + w * tx + (y * tz - z * ty), v[1] + w * ty + (z * tx - x * tz), v[2] + w * tz + (x * ty - y * tx)]; };
    const data = new Float32Array((NB1 + 1) * 147); data.set(A.data.subarray(0, NB0 * 147));
    const hJ = smp(A, tJoin - T2), dJ = smp(B, tJoin - tDrop), off = [hJ[0] - dJ[0], 0, hJ[2] - dJ[2]];                                  // `drop` laid on run_to_stand's hips, exactly as oF does it in the world
    for (let k = NB0; k <= NB1; k++) { const w = sm((k - NB0) / (NB1 - NB0)), a = smp(A, k / 60), b = smp(B, T2 + k / 60 - tDrop), o = k * 147;
      for (let j = 0; j < 21; j++) nl(a, j * 7 + 3, b, j * 7 + 3, w, data, o + j * 7 + 3);
      for (let j = 0; j < 21; j++) { const p = PAR[j]; if (p < 0) { for (let c = 0; c < 3; c++) data[o + c] = a[c] + (b[c] + off[c] - a[c]) * w; continue; }
        const la = qr(a, p * 7 + 3, [a[j * 7] - a[p * 7], a[j * 7 + 1] - a[p * 7 + 1], a[j * 7 + 2] - a[p * 7 + 2]], true), lb = qr(b, p * 7 + 3, [b[j * 7] - b[p * 7], b[j * 7 + 1] - b[p * 7 + 1], b[j * 7 + 2] - b[p * 7 + 2]], true);
        const r = qr(data, o + p * 7 + 3, [la[0] + (lb[0] - la[0]) * w, la[1] + (lb[1] - la[1]) * w, la[2] + (lb[2] - la[2]) * w]); for (let c = 0; c < 3; c++) data[o + j * 7 + c] = data[o + p * 7 + c] + r[c]; } }
    const tr = { name: SETN, fps: 60, frames: NB1 + 1, loop: false, events: [], boneLengths: A.boneLengths || null, data, simOpts: A.simOpts || {}, meta: { made: 'actC_form.js: run_to_stand -> drop set pose' } };
    cast.tracks[SETN] = tr; if (cast.fig && cast.fig.addTrack) cast.fig.addTrack(tr); return true; })();
  const tJ = setOK ? tSet2 : tJoin, BRAKE = setOK ? SETN : 'run_to_stand';
  // a copy's own clock from the braking to the floor: ahead of the song by its lead (0 for the hero, LEAD at the far ends of the word), back on it by 167.85 while it lies still
  const clock = (p, t) => (p.lead ? t + p.lead * sm(seg(t, T2 + 0.1, 165.9)) * (1 - sm(seg(t, 167.2, 167.85))) : t);

  // ---------------------------------------------------------------- the cameras of bars 86-92 (seq 9 and shot 10A use them; the run plan needs them to know who is in shot)
  // 10A stays on main behind her; it leans a little after her as the phrase carries her off the axis (her hips, averaged over a second)
  const dropCam = (t) => { const u = sm(seg(t, bar(90), bar(92.8))); let dz = 0; if (t > bar(89)) { for (let q = -2; q <= 2; q++) dz += heroHips(Math.min(t + q * 0.25, tRun - 1e-3))[2] - hz; dz *= 0.2 * 0.55 * sm(seg(t, bar(89), bar(90))); }
    return { pos: [hx - 4.1 + 0.2 * u, 0.9, hz + 0.25 * dz], target: [hx + 2, 1.5, hz + dz], fov: 38 }; };
  let coilPath = null; const Rr = (x, y, z) => [hx + x, y, hz + z];
  const coilCam = (t) => { if (!coilPath) coilPath = K.camPath([{ t: bar(86), pos: Rr(-74, 27, 0), target: Rr(-6, 0, 0), fov: 35 }, { t: bar(87), pos: Rr(-50, 12.5, 0), target: Rr(16, 0.5, 0), fov: 35 }, { t: bar(88), pos: Rr(-25, 4.4, 0), target: Rr(28, 1.6, 0), fov: 36 },
      { t: bar(88.6), pos: Rr(-12, 2.1, 0), target: Rr(12, 1.5, 0), fov: 37 }, { t: bar(89), ...dropCam(bar(89)) }]); return coilPath(t); };

  // ---------------------------------------------------------------- the run plan (computed once, the first time a frame at or after b86.5 is asked for: about 5 s)
  let plan = null;
  function ensure() { if (plan) return plan; const t00 = performance.now();
    // who is in shot: every 0.05 s from b86.5 to the b93 cut, the camera's frame (a body = three heights incl. its reflection, 1.1 m of margin sideways)
    const DT = 0.05, nT = Math.ceil((tRun - tEarly) / DT) + 1, CB = []; for (let q = 0; q < nT; q++) { const t = Math.min(tRun - 1e-3, tEarly + q * DT), c = t < bar(89) ? coilCam(t) : dropCam(t), b = K.basis(c); CB.push({ p: c.pos, f: b.f, r: b.r, u: b.u, tx: b.tan * b.asp, ty: b.tan }); }
    const seenAt = (t, x, z) => { const c = CB[Math.max(0, Math.min(nT - 1, Math.round((t - tEarly) / DT)))], vx = x - c.p[0], vz = z - c.p[2]; if (c.p[1] < 4 && vx * vx + vz * vz < 9) return true;      // nobody within 3 m of a low lens, in frame or not
      for (const y of [-1.7, 0.2, 1.7]) { const vy = y - c.p[1], d = vx * c.f[0] + vy * c.f[1] + vz * c.f[2]; if (d < 0.1) continue;
        if (Math.abs(vx * c.r[0] + vy * c.r[1] + vz * c.r[2]) - 1.1 < d * c.tx * 1.02 && Math.abs(vx * c.u[0] + vy * c.u[1] + vz * c.u[2]) - 0.3 < d * c.ty * 1.05) return true; } return false; };
    const tHid = new Float64Array(N); tHid[0] = tRun; for (let i = 1; i < N; i++) { let th = tRun; for (let t = tRun - DT; t >= tEarly; t -= DT) { const p = startOf(i, t); if (seenAt(t, p[0], p[1])) break; th = t; } tHid[i] = th; }
    const R = planRuns({ n: N, start: startOf, tHid, seenAt, cells: cells.map((c) => { const b = standOf(c); return [b[0], b[1] + SX]; }), tRun, T2, FZ, SZ, tAcc: TACC, accZ: (t) => cast.root('run_from_stand', t)[2], per, v: vRun, ph0: PH0, beat: bb(1, 2) - bar(1), tol: 0.015, rMax: 1.15, fixed: { 0: heroCell } });
    const oc = cast.rot(EAST, cen[0], cen[1]), hJ = rootXZ('run_to_stand', tJoin - T2), dJ = rootXZ('drop', tJoin - tDrop), eJ = cast.rot(EAST, hJ[0], hJ[1]), fJ = cast.rot(EAST, dJ[0], dJ[1]); let slid = 0;
    for (let i = 0; i < N; i++) { const p = P[i], c = cells[R.cellOf[i]], B = standOf(c); let q = R.runs[i]; p.cell = c; p.B = B;
      if (!q) { slid++; const A = startOf(i, tRun), dE = B[0] - A[0], dL = B[1] + SX - A[1], L = Math.hypot(dE, dL); q = { k: 3, L, phi: 0, s1: L - SZ - 0.05, s2: SZ + 0.05, sc: L / LkK(3), R: 3.2, dz: dL, r: 1.15, tDep: T2 - TACC - lcK(3) / 1.15, A, B: [B[0], B[1] + SX], slide: true }; }   // no legal path (should not happen): a stretched straight run, reported below
      p.run = q; q.yaw0 = Math.PI / 2 - q.phi; q.dir0 = [Math.cos(q.phi), Math.sin(q.phi)]; q.t1 = q.tDep + TACC; q.O2 = [q.B[0] - SZ * q.sc, q.B[1]];
      // `drop` takes over on the set pose with its hips where `run_to_stand` has them
      p.oF = [q.O2[0] + eJ[0] + (q.sc - 1) * hJ[1] - fJ[0], q.O2[1] + eJ[1] - fJ[1]]; }
    // the fall: a wave that runs INWARD and ends on her, on the downbeat: the farthest body is down LEAD s before her (see `clock`)
    { let m = 0; for (let i = 1; i < N; i++) { P[i].rf = Math.hypot(P[i].B[0] - head[0], P[i].B[1] - head[1]); m = Math.max(m, P[i].rf); } for (let i = 1; i < N; i++) P[i].lead = (LEAD * P[i].rf) / m; P[0].lead = 0; P[0].rf = 0; }
    const st = R.stats, nVis = [...tHid].filter((t) => t >= tRun - 1e-6).length;
    console.log(`actC runs: ${N - st.failed}/${N} on legal paths (${st.relaxed} of them with the looser stride, ${slid} without a path), mean ${st.meanL.toFixed(1)} m max ${st.maxL.toFixed(1)} m, strides k ${JSON.stringify(st.kHist)}; leave ${st.minDep.toFixed(2)}..${st.maxDep.toFixed(2)} (${st.early} before the b93 cut, all out of frame; ${nVis} in shot wait for the cut), brake ${T2.toFixed(3)}; loop rate <= ${st.maxRate.toFixed(3)} (${st.onBeat} on the beat at ${R.rBeat.toFixed(3)}), speed <= ${st.maxSpeed.toFixed(2)} m/s, stride stretch <= ${(100 * st.maxStretch).toFixed(1)} %, hooks ${st.hooks}; hero ${R.runs[0] ? R.runs[0].L.toFixed(2) : '?'} m; ${(performance.now() - t00).toFixed(0)} ms`);
    plan = R; if (E.Q.get('ccheck')) selfCheck(); return plan; }
  console.log(`actC: rings ${slots.length} (outer r ${S[N - 1].r.toFixed(1)} m), ${wordInfo}`);

  // ---------------------------------------------------------------- one dancer at song time t
  // returns { pos, yaw, track, time, lane, seed, gain, alpha } ; o: { canon: s per metre from the hero (the side truck) }
  function dancer(i, t, o) { const s = S[i], p = P[i], hero = i === 0, out = { lane: laneOf(i), seed: hero ? 0 : i + 1, gain: 1, alpha: 1 };
    const q = t >= tEarly && !(hero && t < tRun) ? (ensure(), p.run) : null;                        // (the hero leaves on the cut: before it she needs no plan, and the plan needs her)
    if (t < tRun && (!q || t < q.tDep)) {
      let tt = t; if (o.canon && !hero && t < tCoil) tt = t - o.canon * s.r;
      if (tt < tCoil) { out.track = 'build'; out.time = tt - tBuild; out.yaw = yawBuild(tt); out.pos = [s.x, 0, s.z];
        if (hero && t < tLandEnd) { const d = cast.rot(WEST, dLand[0], dLand[1]); out.track = 'land'; out.time = t - tLand; out.pos = [s.x + d[0], 0, s.z + d[1]]; }
        if (!hero) { const age = t - tBorn(s.k); if (age < TP) { const w = peelAt(s, easeOut(age / TP)); out.pos = [w[0], 0, w[1]]; out.alpha = 0.35 + 0.65 * sm(age / TP); } if (age < 0.9) out.gain = 1 + 1.6 * Math.exp(-age / 0.25); } }
      else { out.track = hero ? 'drop' : JOIN; out.yaw = YD; out.time = t - tDrop; out.pos = [p.o2[0], 0, p.o2[1]]; }      // the copies: coil (breathing) to b89.3, load, leap, punch on b90.1; from 154.77 `drop_join` IS `drop`
      return out; }
    const tc = q ? clock(p, t) : t;
    if (tc < tJ) {                                                                               // the run: wait (standing) -> run_from_stand -> run_loop along the path -> run_to_stand (-> the set)
      if (t < q.tDep) { out.track = 'idle'; out.time = t - q.tDep; out.yaw = q.yaw0; out.pos = [q.A[0], 0, q.A[1]]; }
      else if (t < q.t1) { const z = (q.sc - 1) * cast.root('run_from_stand', t - q.tDep)[2]; out.track = 'run_from_stand'; out.time = t - q.tDep; out.yaw = q.yaw0; out.pos = [q.A[0] + q.dir0[0] * z, 0, q.A[1] + q.dir0[1] * z]; }
      else if (t < T2) { const w = plan.along(q, (FZ + vRun * q.r * (t - q.t1)) * q.sc); out.track = 'run_loop'; out.time = PH0 + (t - q.t1) * q.r; out.yaw = Math.PI / 2 - w.h; out.pos = [w.x, 0, w.z]; }
      else { const z = (q.sc - 1) * cast.root('run_to_stand', Math.min(tc, tJoin) - T2)[2], w = sm(seg(tc, tSet2 - 0.2, tSet2)); out.track = BRAKE; out.time = tc - T2; out.yaw = EAST; out.pos = [q.O2[0] + z, 0, q.O2[1]];
        if (setOK) { out.hand = 0.4 + 0.6 * w; out.face = { expr: 'determined', amt: 0.5 + 0.35 * w }; } }                                  // the made track has no name the film defaults know: a runner's face and hands, closing to fists
      return out; }
    out.track = 'drop'; out.time = tc - tDrop; out.yaw = EAST; out.pos = [p.oF[0], 0, p.oF[1]];
    if (tc < tFall + 1.0) out.hand = (1 - 1.3 * sm(seg(tc, tFS, tFS + 0.25))) * (1 - sm(seg(tc, tFall + 0.4, tFall + 1.0)));               // fists at the waist in the set, open hands to break the fall
    else acting(i, t, out);
    return out; }
  // faces the choreography asks for where the film default (determined) is not it. Arms wide (172.300, held; the "ooh" enters 173.08): joy with open eyes, for the hero
  // only; the copies close theirs (arms open to the sun: and at 5-8 m an open eye is a dark oval without a white, a doll's). The salute: composed, eyes forward
  // and still (no saccades), all 1,024.
  function acting(i, t, out) {
    { const w = sm(seg(t, 171.9, 172.3)) * (1 - sm(seg(t, 173.3, 173.75))); if (w > 0) out.face = w < 0.5 ? { expr: 'determined', amt: 0.85 * (1 - 2 * w) } : { expr: i === 0 ? 'joy' : 'calm', amt: 2 * w - 1 }; }
    const s = sm(seg(t, 178.7, 179.2)); if (s > 0) out.face = s < 0.5 ? { expr: 'determined', amt: 0.85 * (1 - 2 * s), gaze: [0, 0] } : { ...SALUTE, amt: SALUTE.amt * (2 * s - 1), gaze: [0, 0] }; }
  const SALUTE = { expr: 'calm', amt: 0.3 };      // lowered lids, eyes open and forward (checked against neutral: wide dark ovals, startled; and calm 0.5: sleepy)
  // dev: --q "ccheck=1" measures the runs on the tracks themselves (60 Hz, every copy, from its departure to the set pose): the largest jump of the hips between two
  // samples, the largest turn, and how fast a foot that is on the ground moves over the ground (0 = no slide)
  function selfCheck() { const dt = 1 / 60, J = [15, 19], wj = (d, j) => { const r = cast.root(d.track, d.time, j), o = cast.rot(d.yaw, r[0], r[2]); return [d.pos[0] + o[0], r[1], d.pos[2] + o[1]]; };
    let maxHip = 0, atHip = '', maxYaw = 0, atYaw = '', nPl = 0, sumPl = 0, maxPl = 0, atPl = ''; const hist = [0, 0, 0, 0, 0], maxJoin = [0, ''], byTrack = {};
    for (let i = 0; i < N; i++) { const q = P[i].run; let pd = null, ph = null, pf = null;
      for (let t = Math.max(tEarly, q.tDep - 0.2); t < tSet; t += dt) { const d = dancer(i, t, {}), h = wj(d, 0), f = J.map((j) => wj(d, j));
        if (pd) { const st = Math.hypot(h[0] - ph[0], h[2] - ph[2]), seenPop = !(t - dt < q.tDep && t >= q.tDep && q.tDep < tRun) && !(t - dt < tRun && t >= tRun);      // the departure of an unseen copy and the b93 cut are pose changes by design
            if (seenPop && st > maxHip) { maxHip = st; atHip = `copy ${i} t ${t.toFixed(3)} ${pd.track}->${d.track}`; } let dy = Math.abs(d.yaw - pd.yaw); if (dy > Math.PI) dy = 2 * Math.PI - dy; if (seenPop && dy > maxYaw) { maxYaw = dy; atYaw = `copy ${i} t ${t.toFixed(3)} ${pd.track}->${d.track}`; }
            if (t - dt < tJoin && t >= tJoin && st > maxJoin[0]) { maxJoin[0] = st; maxJoin[1] = `copy ${i}`; }
            if (seenPop && t > q.tDep + dt) for (let k = 0; k < 2; k++) if (f[k][1] < 0.105 && pf[k][1] < 0.105) { const sl = Math.hypot(f[k][0] - pf[k][0], f[k][2] - pf[k][2]) / dt; nPl++; sumPl += sl; const bt = (byTrack[d.track + (i === 0 ? ' (hero)' : '')] = byTrack[d.track + (i === 0 ? ' (hero)' : '')] || [0, 0]); bt[0]++; bt[1] += sl; hist[sl < 0.15 ? 0 : sl < 0.3 ? 1 : sl < 0.6 ? 2 : sl < 1.2 ? 3 : 4]++; if (sl > maxPl) { maxPl = sl; atPl = `copy ${i} t ${t.toFixed(3)} ${d.track} sc ${q.sc.toFixed(3)} R ${q.R}`; } } }
        pd = d; ph = h; pf = f; } }
    console.log(`actC check: hips step max ${(maxHip * 100).toFixed(1)} cm per 1/60 s (${atHip}); at the set pose join ${(maxJoin[0] * 100).toFixed(1)} cm; yaw step max ${((maxYaw * 180) / Math.PI).toFixed(2)} deg (${atYaw}); planted feet: ${nPl} samples, mean ${(sumPl / nPl).toFixed(3)} m/s, share < 0.15 / 0.3 / 0.6 / 1.2 / more m/s: ${hist.map((h) => ((100 * h) / nPl).toFixed(1)).join(' / ')} %, max ${maxPl.toFixed(2)} m/s (${atPl}); mean by track: ${Object.keys(byTrack).sort().map((k) => `${k} ${(byTrack[k][1] / byTrack[k][0]).toFixed(3)}`).join(', ')}`); }
  // final pass: the salute's troupe (10 E, 178.4-181), seen from the front on her axis: a wedge behind her, she alone in the front row. Row k stands k * 1.7 m behind
  // her, k + 1 bodies 1.9 m apart, centred on her axis, each row in the gaps of the one before. Offsets [east, south] from HER instance origin (every copy is on
  // the same take at the same time there, so the wedge moves as one). The copies nearest to her in the word take the rows nearest to her.
  let wedge = null;
  function troupeSlot(i) { if (!wedge) { ensure(); const RS = 1.7, LS = 1.9, slots = []; for (let k = 1; slots.length < N - 1; k++) for (let j = 0; j <= k; j++) slots.push([-k * RS, (j - k / 2) * LS]);
      const order = []; for (let q = 1; q < N; q++) order.push(q); order.sort((x, y) => (P[x].rf || 0) - (P[y].rf || 0) || x - y); wedge = new Array(N).fill(null); order.forEach((q, n2) => { wedge[q] = slots[n2]; }); wedge[0] = [0, 0]; }
    return wedge[i]; }
  // fill the crowd; returns how many are on stage
  function thousand(t, o = {}) { const cr = cast.crowd('thousand', N), n = t < bar(73) ? 0 : 1 << stageAt(t); for (let i = 0; i < n; i++) { const d = dancer(i, t, o); if (o.each) o.each(i, d); cr.put(i, d); } return n; }
  // where the hero's hips are (world), for cameras and for main's write head
  const heroHips = (t) => { const d = dancer(0, t, {}); return cast.hips(d.track, d.time, d.pos, d.yaw); };
  // main is written under her feet: the g of main at world x
  const headAt = (x) => { let a = bar(60), b = bar(120); if (W.eastX(b) <= x) return 1e9; for (let q = 0; q < 40; q++) { const m = (a + b) / 2; if (W.eastX(m) < x) a = m; else b = m; } return b; };
  const mainHead = (t) => headAt(heroHips(t)[0] - 0.1);
  // pools of light under the fallen bodies (the letters glow as they are laid down), and the same list for any other moment
  function fallGlow(t, o = {}) { const list = [], c0 = o.color || [1.0, 0.55, 0.22];
    ensure(); for (let i = 0; i < N; i++) { const p = P[i], age = t - (tFall - (p.lead || 0)); if (age < 0) continue; const hit = Math.exp(-age / 0.35), up = 1 - 0.4 * sm(seg(t, bar(98.2), bar(99.2))), k = (0.20 + 0.45 * hit) * up * (o.gain ?? 1); if (k < 0.004) continue;
      const c = i === 0 ? [1.6, 0.62, 0.16] : c0; list.push({ x: p.B[0] + 0.95, z: p.B[1], r: 1.7 + 0.5 * hit, c: [c[0] * k, c[1] * k, c[2] * k] }); }
    return list.length ? [W.glow(list)] : []; }

  // r4 Y (NOTES_v4 Y4): she must be findable among her copies in the wide shots: a soft pool of main-orange on the mirror under her (it stays on the ground when
  // she jumps), on her road. Its radius grows with the camera's distance (3.5 %: about the same size on screen from 40 m up as from 6 m away), never under `r`.
  function heroPool(t, cam, o = {}) { const h = heroHips(t), d = cam ? Math.hypot(cam.pos[0] - h[0], cam.pos[1], cam.pos[2] - h[2]) : 0, r = Math.max(o.r ?? 1.3, 0.035 * d), g = o.gain ?? 1, c = o.color || [1.0, 0.40, 0.09];
    return W.glow([{ x: h[0], z: h[2], r, c: c.map((v) => v * g) }, { x: h[0], z: h[2], r: 0.45 * r, c: c.map((v) => v * g * 0.9) }]); }
  K.shared.dropCam = dropCam;
  return { N, S, P, hx, hz, box, head, view, cells, heroCell, CW, CL, WEST, EAST, YD, TP, tBorn, stageAt, peelAt, streakDraw, dancer, thousand, heroHips, mainHead, headAt, fallGlow, heroPool, troupeSlot, laneOf, dropCam, coilCam, ensure,
    times: { tBuild, tDrop, tLand, tCoil, tHeroLands, tLow, tRun, T2, tJoin: tJ, tSet, tFall, tUnison, tEarly } };
}
