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
  // where the dotted line comes down past z = -800 (for its label)
  let id = 0; for (let i = 1; i < pts.length; i++) if (Math.abs(pts[i][1] + 800) < Math.abs(pts[id][1] + 800)) id = i;
  // the formation ground (three rings on main: the arcs the thousand stood on) and a ring round the root
  const ring = (c, r) => [...Array(49)].map((_, i) => [c[0] + r * Math.cos((i / 48) * 6.2832), c[1] + r * Math.sin((i / 48) * 6.2832)]);
  const marks = E.roads([...[18, 36, 54].map((r) => ({ pts: ring(F, r), color: K.hex(K.LANE.main), width: 0.3, g: [0, 0] })), { pts: ring([0, 0], 30), color: K.hex(K.LANE.main), width: 0.3, g: [0, 0] }], { step: 3 });
  // labels: [text, world x, z of the baseline's start (or centre / end), align, time in, on a line (centred on it)?, rows]
  const LAB = [
    ['main', -1440, 0, 'right', bb(150, 1), 1],
    ['1,024 branches', (fb.x0 + fb.x1) / 2 - 45, fb.z1 + 125, 'center', bb(150, 2)],
    ['merge 1,024 → 1', M[0] + 75, 400, 'left', bb(150, 3), 0, [1, 3]],
    ['formation', M[0] + 60, -240, 'left', bb(150, 4)],
    [K.VIOLET.name, V[0] + 60, V[1], 'left', bb(151, 1), 1],
    [K.VIOLET.last, pts[id][0] + 90, pts[id][1] + 35, 'left', bb(151, 2)],
    ['64 new branches', C[0] + 430, A.box.z1 + 130, 'center', bb(151, 3)],
    ['(HEAD -> main)', A.J[0].end[0] + 50, A.HUB.z, 'left', bb(151, 4), 1],
  ];
  const DAY = { ambient: [0.70, 0.73, 0.88], rimCol: [0, 0, 0], rimBoth: 0, sunAmt: 1, under: 0, emissive: 0, fibres: 0, trans: 0 }, PX = 25;
  return { name: '15_map', t0, t1, frame(t) {
    A.people(t); const camera = L.lift(t), m = ss(t, t0, L.tMap);                         // m: 0 the day, 1 the map
    const capM = (PX / 1080) * 2 * camera.R * Math.tan((camera.fov * Math.PI) / 360);     // a label's cap height in metres on the ground
    const lab = ([txt, x, z, align, tin, on, rows]) => { const p = K.project(camera, [x, 0, z + (on ? capM / 2 : 0)]); return K.label(txt, camera, { mode: 'ground', px: PX, x: p.x, y: p.y, ink: 1, align, rows, alpha: ss(t, tin, tin + 0.25) * (1 - ss(t, L.tHit - 0.55, L.tHit - 0.15)) }); };
    const far = { head: t, minPx: lerp(2.0, 2.2, m), nodeMinPx: 2.4, haloPx: 0, halo: 0 };
    return { camera, env: { figLight: DAY, outline: { strength: 1 - m, width: 1.3 }, sun: { grad: 1.55 },
        ground: { fogAmt: 1 - m, ripple: lerp(0.016, 0, m), f0: lerp(0.25, 0.08, m), wet: 1 - m, reflGain: 0.75 * (1 - m) }, grade: { vignette: 0.1 } },
      world: { out: { hide: true }, lights: false, text: 0, minPx: lerp(2.0, 2.1, m), haloPx: 0, halo: 0, nodeMinPx: 2.2, conn: { minPx: 1.2 } },
      extra: [...A.roads(t, { ...far, textGain: 0 }), ...(m > 0.5 ? [marks.drawable({ head: 1e9, minPx: 1.6, haloPx: 0, halo: 0 }), arc.drawable({ head: 1e9, minPx: 0.01, widthScale: 0, nodeMinPx: 2.8, haloPx: 0 })] : [])],
      type: t >= L.tMap - 0.2 ? LAB.filter((l) => t >= l[4]).map(lab) : [], hud: K.hudMain(t, { count: A.count(t) }) };
  } };
}
