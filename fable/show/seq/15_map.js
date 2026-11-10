// 15 · bars 149-152 · 4:17.5-4:24.5 · drums out, the arp alone, a riser (263.16) into the last hit
// The camera that left her shoulder at b144 keeps lifting (actE_morning.js makeLift): by b150 it looks straight down, east to the right, and the whole film
// is one git graph: the trunk, the root (ringed), the first tree to 1,024, the merge, the formation ground (three rings on main), jade/1420-mhz leaving
// early and ending at its dot, the dotted line of what it sent home, and the new branches of the morning, still growing. Eight labels arrive west to east,
// one on each beat of b150-b151, in the order they were lived; the two on main are set as git sets them: `main` ... `(HEAD -> main)`.
// On the riser the camera falls back toward the root, where the next frame (and the first) is.
import { seg, ss, sm, lerp, clamp01 } from '../kit.js';
import { morning } from './actE_morning.js';

export default function seq(K) {
  const { bar, bb, world: W, E } = K; const t0 = bar(149), t1 = bar(153), A = morning(K), L = A.L, V = W.VEND, C = W.CATCH, F = W.FORM, M = W.M1, fb = W.forkBox;
  // the dotted line: the flight of the light (11/12: K.shared.lightAt), as a road that is only its nodes; and the dot where her road ends
  const pts = []; for (let i = 0; i <= 40; i++) { const p = K.shared.lightAt(lerp(bar(117), bar(129), i / 40)); pts.push([p[0], p[2]]); }
  const arc = E.roads([{ pts, color: K.hex(K.LANE.violet), width: 0.001, g: [0, 0], nodes: [...Array(40)].map((_, i) => ({ u: (i + 0.5) / 40, r: 9 })) },
    { pts: [[V[0], V[1]], [V[0] + 1, V[1]]], smooth: false, color: K.hex(K.LANE.violet), width: 0.001, g: [0, 0], nodes: [{ u: 0, r: 13 }] }], { step: 6 });
  // where the dotted line comes down past z = -900 (for its label)
  let id = 0; for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i][1] + 900) < Math.abs(pts[id][1] + 900)) id = i;
  // the formation ground (three rings on main: the arcs the thousand stood on) and a ring round the root
  const ring = (c, r) => [...Array(49)].map((_, i) => [c[0] + r * Math.cos((i / 48) * 6.2832), c[1] + r * Math.sin((i / 48) * 6.2832)]);
  const marks = E.roads([...[18, 36, 54].map((r) => ({ pts: ring(F, r), color: K.hex(K.LANE.main), width: 0.3, g: [0, 0] })), { pts: ring([0, 0], 30), color: K.hex(K.LANE.main), width: 0.3, g: [0, 0] }], { step: 3 });
  const leader = E.roads([{ pts: [[F[0], -70], [F[0], -200], [F[0], -330]], smooth: false, color: K.hex('#3A3550'), width: 0.2, g: [bb(150, 4), bb(150, 4) + 0.3] }], { step: 3 });     // (r2) a leader from the rings to their label, drawn as the label arrives
  // labels: [text, world x, z of the baseline's start (or centre / end), align, time in, on a line (centred on it)?, rows]
  // r2: every label is 33 px cap height at 1080p (45 px mono) and sits in clear ground: none is crossed by a road at any time of the hold (the camera
  // pushes in 4.5 %, the labels keep their pixel size). Positions were read off a 1080p still (work_fable/stills/r2_DE/map*.png).
  const LAB = [
    ['main', -1440, 0, 'right', bb(150, 1), 1],
    ['1,024 branches', -244, 857, 'right', bb(150, 2)],                       // south-west of the first tree, left of the southern arterial
    ['merge 1,024 → 1', M[0] + 95, 507, 'left', bb(150, 3), 0, [1, 3]],       // in the gap south of main between the arterial's return and the morning's fan
    ['formation', F[0], -370, 'center', bb(150, 4)],                          // north of the rings (a leader joins them), between the northern arterial and the fan. r3: 100 m (36 px) nearer its rings: the lowest place where the word still clears the arterial (left) and the fan's first ray (right) by 16-19 px
    [K.VIOLET.name, V[0] + 413, V[1] + 303, 'left', bb(151, 1)],              // right of her road's end and of the dotted line's first bend
    [K.VIOLET.last, pts[id][0] + 90, pts[id][1] + 35, 'left', bb(151, 2)],
    ['64 new branches', C[0] + 455, 753, 'center', bb(151, 3)],               // under the fan
    ['(HEAD -> main)', A.J[0].end[0] - 75, A.HUB.z - 85, 'left', bb(151, 4)], // over main's east end, as git sets it
  ];
  const DAY = { ambient: [0.70, 0.73, 0.88], rimCol: [0, 0, 0], rimBoth: 0, sunAmt: 1, under: 0, emissive: 0, fibres: 0, trans: 0 }, PX = 33;
  return { name: '15_map', t0, t1, frame(t) {
    A.people(t); const camera = L.lift(t), m = ss(t, t0, L.tMap);                         // m: 0 the day, 1 the map
    const capM = (PX / 1080) * 2 * camera.R * Math.tan((camera.fov * Math.PI) / 360);     // a label's cap height in metres on the ground
    const lab = ([txt, x, z, align, tin, on, rows]) => { const p = K.project(camera, [x, 0, z + (on ? capM / 2 : 0)]); return K.label(txt, camera, { mode: 'ground', px: PX, x: p.x, y: p.y, ink: 1, align, rows, alpha: ss(t, tin, tin + 0.25) * (1 - ss(t, L.tHit - 0.55, L.tHit - 0.15)) }); };
    const mg = ss(m, 0.6, 1), glowO = { ink: 1, haloPx: 0, halo: 0 }, far = { head: t, minPx: lerp(2.0, 2.2, m), nodeMinPx: 2.4, ...glowO };
    // r2: the map is not a flat card. Ground glows only draw below full day, so the map sits at dawn 0.88 (the roads are still drawn as ink, the grade is the day's):
    // a wide warm pool under the whole graph, a soft orange aura along main, and the pools of the fork nodes; the mirror keeps a little sky and its slow variation.
    const mc = K.hex(K.LANE.main), pools = [{ x: 760, z: -60, r: 2300, c: [0.62, 0.5, 0.34].map((q) => q * mg) }];
    for (let x = -1300; x <= A.J[0].end[0]; x += 110) pools.push({ x, z: x > C[0] ? A.HUB.z : 0, r: 150, c: mc.map((q) => q * 0.9 * mg) });
    return { camera, env: { dawn: 1 - 0.12 * mg, figLight: DAY, outline: { strength: 1 - m, width: 1.3 }, sun: { grad: 1.55, gain: 0.3 },
        ground: { base: K.hex('#FBF1DC').map((q, i) => q * (1 - [0.1, 0.13, 0.2][i] * mg)), fogAmt: 1 - m, ripple: lerp(0.016, 0, m), f0: lerp(0.25, 0.1, m), wet: lerp(1, 0.3, m), reflGain: 0.75 * (1 - m) }, grade: { ...K.grade(1), vignette: lerp(0.1, 0.24, m) } },   // r2: the map keeps the mirror (sky in it, slow variation, warmer toward the sun)
      world: { out: { hide: true }, lights: false, text: 0, minPx: lerp(2.0, 2.1, m), ...glowO, nodeMinPx: 2.2, conn: { minPx: 1.2 }, canopy: mg > 0 ? { gain: 5 * mg } : false },
      extra: [...(mg > 0 ? [W.glow(pools)] : []), ...A.roads(t, { ...far, textGain: 0 }), ...(m > 0.5 ? [marks.drawable({ head: 1e9, minPx: 1.6, haloPx: 0, halo: 0, ink: 1 }), arc.drawable({ head: 1e9, minPx: 0.01, widthScale: 0, nodeMinPx: 2.8, haloPx: 0, ink: 1 }), ...(t < L.tHit - 0.35 ? [leader.drawable({ head: t, minPx: 1.4, haloPx: 0, halo: 0, ink: 1 })] : [])] : [])],
      type: t >= L.tMap - 0.2 ? LAB.filter((l) => t >= l[4]).map(lab) : [], hud: K.hudMain(t, { count: A.count(t) }) };
  } };
}
