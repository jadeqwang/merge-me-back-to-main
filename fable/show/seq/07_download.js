// 7 · bars 65-72 · 1:51.4-2:05.3 · "Ahh" twice; hats; snare crescendo from 116.64; the F#5 leap on b69 (118.387); 32nd roll 123.49
// A  b65   the download: the same shot keeps rising; what every branch lived streams in along every strand as text; she grows denser
// B  b69   on the leap she is upright, lifted out of the water, arms flung wide (the accent); first band of dawn behind her; she settles
//          roll: every strand fires inward, faster and faster; white on the b73 impact
import { seg, ss, lerp, sm, easeIn } from '../kit.js';

export default function seq(K) {
  const { bar, world: W, cast } = K; const t0 = bar(65), t1 = bar(73), tB = bar(69), fx = W.FLOAT[0];
  return { name: '07_download', t0, t1, frame(t) {
    const u = seg(t, t0, tB); const inflow = { flow: 0.25 + 0.45 * u, flowSpeed: -(5 + 9 * u) };
    if (t < tB) { const camera = K.shared.floatCam(t);
      K.shared.floatBody(t, { density: lerp(0.7, 1.0, u) });                                 // from 116.0 the body plays `rise`: she sits up out of the water
      return { camera, env: { ground: { ripple: 0.02, fogAmt: 0.2, base: K.hex('#081038'), f0: 0.2 }, grade: { exposure: 1.5 + 0.2 * u, vignette: 0.42, bloom: 0.65 + 0.2 * u } },
        world: { text: 0.5, flow: 0.3, flowSpeed: 6, lights: { gain: 0.6 }, minPx: 1.4 }, extra: [K.shared.hairDraw(t, { ...inflow, textGain: 0.45 + 0.35 * u, gain: 1.5 + 0.5 * u, halo: 0.12 }), W.glow([{ x: fx, z: 0, r: 2.5 + 2 * u, c: [0.5 * u, 0.3 * u, 0.2 * u] }])], hud: K.hudMain(t, { count: 1 }) }; }
    const v = seg(t, tB, t1); const roll = seg(t, 123.49, t1); const flash = easeIn(seg(t, t1 - 0.5, t1));
    const camera = { pos: [fx - 1.5 + 0.3 * v, 0.75, 3.9 - 0.4 * v], target: [fx + 2.0, 1.45, -2], fov: 35, focusDist: 4.2, aperture: 0.04 };
    cast.actor('hero').set({ pos: [fx, 0, 0], yaw: 0.35, track: 'rise', time: t - K.shared.tRise });      // the accent (lifted, arms wide) is this cut: b69, 118.387; she is down by 124.9
    const pulses = roll > 0 ? [0, 1, 2].map((j) => ({ g: lerp(108.9, 102.4, ((roll * (2 + 5 * roll) + j / 3) % 1)), width: 0.6, gain: 8 })) : [{ g: lerp(108.9, 102.4, (v * 4) % 1), width: 0.5, gain: 5 }];
    return { camera, world: { text: 0.6, flow: 0.3, flowSpeed: 6, lights: { gain: 1 } }, extra: [K.shared.hairDraw(t, { flow: 0.4, flowSpeed: -14, pulses, gain: 0.7, textGain: 0.2, halo: 0.05 }), W.glow([{ x: fx, z: 0, r: 3 + 5 * roll, c: [0.6 + 2 * roll, 0.35 + 1.2 * roll, 0.25 + 0.8 * roll] }])],
      hud: K.hudMain(t, { count: 1 }), flash };
  } };
}
