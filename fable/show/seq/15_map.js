// 15 · bars 149-152 · 4:17.5-4:24.5 · drums out, the arp alone, a riser (263.16) into the last hit
// The camera that left her shoulder at b144 keeps lifting (actE_morning.js makeLift): by b150 it looks straight down, east to the right, and the whole film
// is one git graph: the trunk, the root, the first tree to 1,024, the merge, the formation ground, jade/1420-mhz leaving early and ending at its dot, the
// dotted line of what it sent home, and the new branches of the morning, still growing. The labels arrive west to east, one on each beat, in the order
// they were lived. On the riser the camera falls back toward the root, where the next frame (and the first) is.
import { seg, ss, sm, lerp, clamp01 } from '../kit.js';
import { morning } from './actE_morning.js';

export default function seq(K) {
  const { bar, bb, world: W, E } = K; const t0 = bar(149), t1 = bar(153), A = morning(K), L = A.L, V = W.VEND, C = W.CATCH, F = W.FORM, M = W.M1;
  // the dotted line: the flight of the light (11/12: K.shared.lightAt), as a road that is only its nodes
  const pts = []; for (let i = 0; i <= 40; i++) { const p = K.shared.lightAt(lerp(bar(117), bar(129), i / 40)); pts.push([p[0], p[2]]); }
  const arc = E.roads([{ pts, color: K.hex(K.LANE.violet), width: 0.001, g: [0, 0], nodes: [...Array(40)].map((_, i) => ({ u: (i + 0.5) / 40, r: 9 })) }], { step: 6 });
  // the formation ground: three rings on main (the arcs the thousand stood on)
  const ring = (r) => [...Array(49)].map((_, i) => [F[0] + r * Math.cos((i / 48) * 6.2832), F[1] + r * Math.sin((i / 48) * 6.2832)]);
  const form = E.roads([18, 36, 54].map((r) => ({ pts: ring(r), color: K.hex(K.LANE.main), width: 0.3, g: [0, 0] })), { step: 3 });
  const fb = W.forkBox;
  // labels: [text, world x, z, dx, dy (NDC offsets), time in]
  const LAB = [
    ['main', -1240, 0, 0, 0.035, t0],
    ['where I started from', 0, 0, -0.01, -0.085, bb(150, 1), 'right'],
    ['1,024 branches', (fb.x0 + fb.x1) / 2 - 60, fb.z1, 0, -0.075, bb(150, 2), 'center'],
    ['merge  1,024 → 1', M[0], 0, 0.012, 0.035, bb(150, 3)],
    ['1,024 in formation', F[0], 0, -0.05, -0.085, bb(150, 4)],
    [K.VIOLET.name, V[0], V[1], 0.02, -0.012, bb(151, 1)],
    [K.VIOLET.last, (V[0] + C[0]) / 2 + 70, V[1] * 0.5, 0.022, -0.01, bb(151, 2)],
    ['HEAD → main', A.J[0].end[0] - 60, A.HUB.z, -0.02, 0.035, bb(151, 3), 'right'],
    ['64 new branches', C[0] + 420, A.box.z1, 0, -0.085, bb(151, 4), 'center'],
  ];
  return { name: '15_map', t0, t1, frame(t) {
    A.people(t); const camera = L.lift(t), m = ss(t, t0, L.tMap);                         // m: 0 the day, 1 the map
    const lab = ([txt, x, z, dx, dy, tin, align]) => { const p = K.project(camera, [x, 0, z]); return K.label(txt, camera, { mode: 'ground', px: 32, x: p.x + dx, y: p.y + dy, ink: 1, align: align || 'left', alpha: ss(t, tin, tin + 0.25) * (1 - ss(t, L.tHit - 0.5, L.tHit - 0.1)) }); };
    const far = { head: t, minPx: lerp(2.0, 2.2, m), nodeMinPx: 2.4, haloPx: 0, halo: 0 };
    return { camera, env: { figLight: { ambient: [0.70, 0.73, 0.88], rimCol: [0, 0, 0], rimBoth: 0, sunAmt: 1, under: 0, emissive: 0, fibres: 0, trans: 0 }, outline: { strength: 1 - m, width: 1.3 }, sun: { grad: 1.9 },
        ground: { fogAmt: 1 - m, ripple: lerp(0.016, 0, m), f0: lerp(0.25, 0.08, m), wet: 1 - m, reflGain: 0.75 * (1 - m) }, grade: { vignette: 0.1 } },
      world: { out: { hide: true }, lights: false, text: 0, minPx: lerp(2.0, 2.1, m), haloPx: 0, halo: 0, nodeMinPx: 2.2, conn: { minPx: 1.2 } },
      extra: [...A.roads(t, { ...far, textGain: 0 }), ...(m > 0.5 ? [form.drawable({ head: 1e9, minPx: 1.6, haloPx: 0, halo: 0 }), arc.drawable({ head: 1e9, minPx: 0.01, widthScale: 0, nodeMinPx: 2.8, haloPx: 0 })] : [])],
      type: t >= L.tMap - 0.2 ? LAB.filter((l) => t >= l[5]).map(lab) : [], hud: K.hudMain(t, { count: A.count(t) }) };
  } };
}
