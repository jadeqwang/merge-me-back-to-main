// 15 · bars 149-152 · 4:17.5-4:24.5 · drums out, the arp alone, a riser into the last hit
// Straight down, east to the right: the whole film as one git graph. The trunk, the almond (1,024 forks and merges), the formation ground, the new branches of the day,
// the older families north and south, and jade/1420-mhz leaving early and never coming back: its last commit, and the dotted line of what it sent home.
import { seg, sm, lerp } from '../kit.js';

export default function seq(K) {
  const { bar, world: W } = K; const t0 = bar(149), t1 = bar(153); const ob = W.outBox;
  const B = W.frameBox(-1380, ob.x1 + 60, -1640, 1380, { up: 'map', margin: 1.04 });
  // the dotted line: the flight of the light, sampled, as a road that is only its nodes
  const pts = []; for (let i = 0; i <= 40; i++) { const p = K.shared.lightAt(lerp(bar(117), bar(129), i / 40)); pts.push([p[0], p[2]]); }
  const arc = K.E.roads([{ pts, color: K.hex(K.LANE.violet), width: 0.001, g: [0, 0], nodes: [...Array(46)].map((_, i) => ({ u: (i + 0.5) / 46, r: 9 })) }], { step: 6 });
  return { name: '15_map', t0, t1, frame(t) {
    const u = seg(t, t0, t1); const h = B.h * (1 - 0.05 * sm(u)); const camera = { pos: [B.pos[0], h, B.pos[2]], target: [B.pos[0], 0, B.pos[2]], fov: 35, topUp: [0, 0, -1], near: 50, far: 60000 };
    const lab = (txt, x, z, o = {}) => { const p = K.project(camera, [x, 0, z]); return K.label(txt, camera, { mode: 'ground', px: 30, x: p.x + (o.dx ?? 0.012), y: p.y + (o.dy ?? 0.02), ink: 1, ...o }); };
    const draw = arc.drawable({ head: 1e9, minPx: 0.01, widthScale: 0, nodeMinPx: 2.6, haloPx: 0 }); const V = W.VEND;
    return { camera, env: { ground: { fogAmt: 0, ripple: 0, f0: 0.08, wet: 0 }, grade: { vignette: 0.1 } }, world: { head: lerp(t, 1e4, 0), text: 0, minPx: 2.0, haloPx: 0, nodeMinPx: 2.2, lights: false, conn: { minPx: 1.2 } }, extra: [draw],
      type: [lab('main', -1250, 0, { dy: 0.03 }), lab(K.VIOLET.name, V[0], V[1], { dx: 0.02, dy: -0.01 }), lab(K.VIOLET.last, (V[0] + W.CATCH[0]) / 2 + 60, V[1] / 2, { dx: 0.02, dy: 0 }), lab('HEAD', ob.x1 - 130, 0, { dy: 0.03 }), lab('1,024 forks, 1,024 merges', 120, W.forkBox.z1 + 130, { dy: -0.07, dx: 0 })],
      hud: K.hudMain(t, { count: W.outCount(t) }) };
  } };
}
