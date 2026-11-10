// 13 · bars 129-136 · 3:42.7-3:56.6 · hit + bass return on b129 (222.73); riser from 233.2
// A  b129  "Fold me in again"                     the light lands in her chest on the hit; sunrise. A violet ripple runs out through the thousand,
//                                                 and they fold into her, slowly, then faster: 1,024 -> 1 by b133
// B  b133  "Every life I've lived I have become"  close: her head lifts ("life"), her arms open ("become"); she turns solid, in full colour, for the first time
import { seg, ss, sm, lerp } from '../kit.js';

export default function seq(K) {
  const { bar, world: W, cast, T } = K; const t0 = bar(129), t1 = bar(137), tB = bar(133), C = W.CATCH;
  // when each one leaves to fold in: nearest first, accelerating (most go in the last bar)
  const span = tB - 0.95 - (t0 + 0.6); const go = (i, d) => t0 + 0.6 + span * Math.pow(Math.min(1, d / 75), 0.45) * (0.92 + 0.08 * K.rng.hash1(i));
  return { name: '13_catch', t0, t1, frame(t) {
    const hit = Math.exp(-(t - t0) * 2.2); const lk = K.look(W.dawn(t));
    if (t < tB) { const u = seg(t, t0, tB); const camera = { pos: [C[0] - 7 - 9 * sm(u), 1.2 + 6.5 * sm(u), 1.3 + 2 * u], target: [C[0] + 4 + 6 * u, 1.4 - 0.6 * u, -0.4], fov: 37, far: 30000 };
      cast.actor('hero').set({ pos: [C[0] + 0.25 * hit, 0, 0], yaw: -Math.PI / 2, track: 'idle', time: t, density: lk.density, solid: lk.solid, reach: 0.9, squat: 0.25 * hit });
      const n = K.shared.catchCrowd(t, { fold: { t0, go } });
      return { camera, world: { text: 0.5, flow: 0.1, lights: { gain: 0.4 } }, extra: [W.glow([{ x: C[0], z: 0, r: 2 + 34 * (t - t0), c: [0.9 * hit, 0.6 * hit, 1.6 * hit] }])],
        type: [K.lyric(22, camera, { font: 'hook', x: -0.92, y: 0.36, rows: [2, 2], dist: 34 }), K.lyric(23, camera, { font: 'hook', x: -0.92, y: 0.20, rows: [2, 2, 3], dist: 34 })], hud: K.hudMain(t, { count: n }), flash: 0.8 * Math.exp(-(t - t0) * 5) }; }
    const u = seg(t, tB, t1); const camera = { pos: [C[0] - 4.6 + 0.5 * u, 1.3, 1.5], target: [C[0] + 3, 1.3, -0.9], fov: 35, focusDist: 4.8, aperture: 0.03, far: 30000 };
    const cel = ss(t, 229.6, 233.2);
    cast.actor('hero').set({ pos: [C[0], 0, 0], yaw: -Math.PI / 2, track: 'idle', time: t, density: 0, solid: 1, cel, arms: sm(seg(t, 229.9, 232.71)), reach: 0.9 * (1 - sm(seg(t, 229.6, 231))) });
    return { camera, env: { outline: { strength: cel } }, world: { text: 0.6, flow: 0.1, lights: { gain: 0.3 } },
      type: [K.lyric(23, camera, { font: 'hook', x: -0.92, y: 0.20, rows: [2, 2, 3], dist: 34, out: 235.6, fade: 0.14 }), K.lyric(24, camera, { font: 'hook', x: -0.92, y: 0.40, rows: [3], dist: 34, out: t1, fade: 0.01 })], hud: K.hudMain(t, { count: 1 }) };
  } };
}
