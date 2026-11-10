// 12 · bars 121-128 · 3:28.8-3:42.7 · chorus 2, pads only (no kick, no bass)
// A  b121  "Merge me back to main"             the light's flight: north-east over the night continent, the camera close behind it
//          "Every road I ran becomes the one"  the roads of the almond converge under it toward M1; dawn grows ahead
// B  b127  main-Jade, facing where it comes from, the thousand standing behind her, the sun about to break; the light arrives over our shoulder
import { seg, ss, sm, lerp } from '../kit.js';
import { N } from '../formation.js';

export default function seq(K) {
  const { bar, world: W, cast } = K; const t0 = bar(121), t1 = bar(129), tB = bar(127), C = W.CATCH;
  // the thousand at the catch: rows behind her (east), facing west with her
  const slots = new Float32Array(N * 2); { let n = 1; slots[0] = C[0]; slots[1] = 0; for (let r = 0; n < N; r++) { const cols = 16 + r * 2, x = C[0] + 5 + r * 2.4; for (let c = 0; c < cols && n < N; c++, n++) { slots[n * 2] = x + ((c * 7) % 3) * 0.3; slots[n * 2 + 1] = (c - (cols - 1) / 2) * 2.3; } } }
  K.shared.catchSlots = slots;
  K.shared.catchCrowd = (t, o = {}) => { const cr = cast.crowd('thousand', N); const lk = K.look(W.dawn(t)); const fold = o.fold; let n = 0;
    for (let i = 1; i < N; i++) { let x = slots[i * 2], z = slots[i * 2 + 1], lane = K.LANES8[i % 7], dens = lk.density, sol = lk.solid, track = 'idle';
      if (fold) { const d = Math.hypot(x - C[0], z); const tv = fold.t0 + d / 34; if (t > tv) lane = 'violet';                       // the violet ripple runs out through them
        const tg = fold.go(i, d); if (t > tg) { const u = Math.min(1, (t - tg) / 0.9); const e = u * u * u; if (u >= 1) continue; x = lerp(x, C[0], e); z = lerp(z, 0, e); track = 'run'; } }
      cr.put(n++, { pos: [x, 0, z], yaw: -Math.PI / 2, track, time: t + i, lane, density: dens, solid: sol, cel: o.cel ?? -1 }); }
    cr.n = n; return n + 1; };
  return { name: '12_flight', t0, t1, frame(t) {
    if (t < tB) { const L = K.shared.lightAt(t), Lb = K.shared.lightAt(t - 0.22), La = K.shared.lightAt(t + 0.7);
      const camera = { pos: [Lb[0], Lb[1] + 5, Lb[2]], target: [La[0], La[1] - 10, La[2]], fov: 40, far: 40000 };
      return { camera, env: { grade: { exposure: 1.5 } }, world: { text: 0.3, flow: 0.25, flowSpeed: 9, minPx: 1.5, lights: { gain: 0.9, minPx: 1.2 }, conn: { gain: 0.9, halo: 0 } }, extra: [K.shared.lightDraw(t, 0.5)],
        type: [K.lyric(20, camera, { font: 'hook', x: -0.92, y: 0.36, rows: [2, 3], dist: 60 }), K.lyric(21, camera, { font: 'hook', x: -0.92, y: 0.20, rows: [2, 2, 3], dist: 60 })],
        hud: { branch: K.VIOLET.name, color: K.LANE.violet, ctx: 1 } }; }
    const u = seg(t, tB, t1); const camera = { pos: [C[0] - 6.4 + 0.6 * u, 1.2, 1.3], target: [C[0] + 3, 1.45, -0.4], fov: 37, focusDist: 6.5, aperture: 0.02, far: 30000 };
    const lk = K.look(W.dawn(t)); cast.actor('hero').set({ pos: [C[0], 0, 0], yaw: -Math.PI / 2, track: 'idle', time: t, density: lk.density, solid: lk.solid });
    const n = K.shared.catchCrowd(t);
    return { camera, world: { text: 0.5, flow: 0.1, lights: { gain: 0.5 } }, extra: [K.shared.lightDraw(t, 0.6)], type: [K.lyric(22, camera, { font: 'hook', x: -0.92, y: 0.36, rows: [2, 2], dist: 34 })], hud: K.hudMain(t, { count: n }) };
  } };
}
