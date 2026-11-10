// 14 · bars 137-148 · 3:56.6-4:17.5 · the outro drop, full drums; "Back to main" 235.75 (pickup) and 249.44; vocalise 238.66-248.97
// DAY. For the first time you see her, in full colour, and she dances (`free`). Her dance is main: the road is written under her feet from the spot where
// she caught the light. From b141 she forks on every bar line, and every new branch forks too (2, 4 ... 64 by b146): they run out into the morning on
// ink roads. On b147 each sends her light ahead. The people, the roads and the lift are built in actE_morning.js.
//   A  b137-b139  the axis of 13_catch's last shot, lower and closer: she faces us (west), the sun leaves the top of frame behind her and the sky turns
//                 from rose to blue while she stands in the new light, skips (b138) and comes at us
//   B  b139-b142  low wide from the south-east: the whirl, the run, the leap (apex b141 = the first fork: a new branch runs out of her, past the lens), the landing
//   C  b142-b144  travelling in front of the new branch: she becomes two in step (b142, on the cut), four (b143); main-Jade cartwheels behind them
//   D  b144-b149  behind her shoulder as she stops and turns east ("Back to main" 249.44), then up and back: 16, 32, 64 roads fanning east with their
//                 runners; BACK TO MAIN stands on the horizon; b147 the lights go ahead; the camera keeps lifting (no cut into 15)
import { seg, ss, sm, lerp, clamp01 } from '../kit.js';
import { morning, makeLift, curve } from './actE_morning.js';

export default function seq(K) {
  const { bar, bb, world: W, cast } = K; const t0 = bar(137), t1 = bar(149), A = morning(K), L = (K.shared.actE.L = makeLift(K)), C = A.C, H = A.HUB;
  const tB = bar(139), tB2 = bar(140), tC = bar(142), tD = bar(144);
  // her light is the day key from the first frame (13_catch ends on it); the sky finishes turning blue during shot A
  const DAY = { ambient: [0.70, 0.73, 0.88], rimCol: [0, 0, 0], rimBoth: 0, sunAmt: 1, under: 0, emissive: 0, fibres: 0, trans: 0 };
  const grad = (t) => lerp(1, 1.55, ss(t, t0, bar(139)));                                  // the blue comes down toward the horizon as the day settles
  const env = (t, o = {}) => ({ figLight: DAY, outline: { strength: 1, width: 1.3 }, sun: { grad: grad(t) }, ground: { ripple: 0.016, reflGain: 0.8 }, ...o });
  const world = (o = {}) => ({ out: { hide: true }, lights: false, text: 0.9, minPx: 2.2, haloPx: 0, halo: 0, ...o });
  const hud = (t) => K.hudMain(t, { count: A.count(t) }), pop = (t) => { let f = 0; for (const tk of A.TK) if (t >= tk) f += 0.1 * Math.exp(-(t - tk) * 9); return f; };
  // B: keyed by hand round the leap. pos is absolute (relative to CATCH), the target rides on her (softened) with an offset
  const camB = curve([
    [tB,        2.5,  0.5,  2.1,   -0.1, 1.05, 0.2],
    [bar(140),  2.9,  0.5,  2.9,   0.0, 1.05, 0.3],
    [bar(141),  3.5,  0.36, 6.1,   0.4, 1.42, 0.4],
    [bar(141.5), 3.6, 0.42, 6.9,   0.5, 1.2, 0.5],
    [tC,        3.5,  0.5,  8.2,   0.3, 1.15, 0.4]]), WH = A.jointAt(tB);                      // the camera's place is relative to where she whirls
  // B2 (r2): on b140 the cut goes round to her front quarter, low, in her path (south-south-west of her), backing away as she comes: the gather before the leap is seen
  // from the front, where the legs separate (from the side it was a ball of trouser), she leaps at the lens, and the first new branch runs away east behind her.
  //            t          z south of CATCH   camera y   target y   target dx
  const camB2 = curve([
    [tB2,       3.6,  0.40, 1.02, -0.1],
    [242.6,     4.6,  0.40, 0.98, -0.15],
    [bar(141),  7.2,  0.36, 1.26, 0.1],
    [244.2,     8.0,  0.42, 1.12, 0.25],
    [tC,        9.2,  0.5,  1.1,  0.25]]);
  // C: the first new branch and everyone who comes from her: where they are (centroid) and the way they are going
  const c1 = A.J[1], fam = A.J.filter((j) => j.top === c1), grp = (t) => { let x = 0, z = 0, n = 0; for (const j of fam) if (t >= j.tb) { const a = A.runnerAt(j, t); x += a.x; z += a.z; n++; } return { x: x / n, z: z / n }; };
  const GD = (() => { const a = grp(tC + 0.05), b = grp(tD), l = Math.hypot(b.x - a.x, b.z - a.z); return [(b.x - a.x) / l, (b.z - a.z) / l]; })();
  return { name: '14_day', t0, t1, frame(t) {
    A.people(t); const c = A.soft(t, 0.5), extra = (o) => A.roads(t, o);
    return K.cut(t, [
      // A (r2): the cut from 13 lands on her feet and the first written metre of main (her arms come down out of frame: `catch` ends with them wide, `free` begins with
      // them at her sides), and the camera rises to her and backs away in the first bar, in time for the skip on b138.
      { t0, f: (tt, u) => { const e = sm(u), r = sm(seg(t, t0 + 0.12, t0 + 1.5)), camera = { pos: [c.x - lerp(1.15, 3.3 + 0.4 * e, r), lerp(0.22, 0.42 + 0.16 * e, r), c.z + lerp(0.3, 0.8, r)], target: [c.x + 0.1 * r, lerp(0.2, 1.02 + 0.04 * e, r), c.z - lerp(0.04, 0.6, r)], fov: 38, far: 40000 };
        return { camera, env: env(t), world: world(), extra: extra(), type: [K.lyric(24, camera, { font: 'hook', x: -0.93, y: 0.08, rows: [1, 2], px: 70, dist: 34, out: bar(138.7), fade: 0.3, ink: 1, reflect: false })], hud: hud(t), flash: 0.45 * Math.exp(-(t - t0) * 4.5) }; } },
      { t0: tB, f: () => { const k = camB(t), s = A.soft(t, 0.35), camera = { pos: [WH[0] + k[0], k[1], WH[2] + k[2]], target: [s.x + k[3], k[4], s.z + k[5]], fov: 38, far: 40000 };
        return { camera, env: env(t), world: world(), extra: extra(), hud: hud(t), flash: pop(t) }; } },
      { t0: tB2, f: () => { const k = camB2(t), s = A.soft(t, 0.35), camera = { pos: [C[0] - 4.7, k[1], C[1] + k[0]], target: [s.x + k[3], k[2], s.z], fov: 38, far: 40000 };
        return { camera, env: env(t), world: world(), extra: extra(), hud: hud(t), flash: pop(t) }; } },
      { t0: tC, f: (tt, u) => { const G = grp(t), a = A.runnerAt(c1, t), g = { x: lerp(a.x, G.x, 0.3), z: lerp(a.z, G.z, 0.3) }, e = sm(u), d = 4.3 + 1.5 * e, camera = { pos: [g.x + GD[0] * d + GD[1] * 1.2, 0.75 + 0.85 * e, g.z + GD[1] * d - GD[0] * 1.2], target: [g.x - GD[0] * 0.8, 0.98 - 0.06 * e, g.z - GD[1] * 0.8], fov: 40, far: 40000 };
        return { camera, env: env(t), world: world(), extra: extra(), hud: hud(t), flash: pop(t) }; } },
      { t0: tD, f: () => { const camera = L.lift(t);
        return { camera, env: env(t), world: world({ minPx: 2.0 }), extra: extra(),
          type: [K.lyric(25, camera, { font: 'hook', x: 0.93, y: Math.max(0.5, camera.horizon + 0.07), align: 'right', px: 78, dist: 60, out: L.tMain + 0.35, fade: 0.5, ink: 1, reflect: false })], hud: hud(t), flash: pop(t) }; } },
    ], t1);
  } };
}
