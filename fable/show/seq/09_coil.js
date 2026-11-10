// 9 · bars 86-88 · 2:27.9-2:33.2 · bass out, snare build, riser
// All thousand sink into a low stance over three bars and are perfectly still on b88.4. The camera comes down the aisle through the rings,
// low, toward her and the east, where the sun's rim is about to break. It arrives on the drop without a cut.
import { seg, sm, lerp } from '../kit.js';

export default function seq(K) {
  const { bar, world: W } = K; const t0 = bar(86), t1 = bar(89); let path = null;
  return { name: '09_coil', t0, t1, frame(t) {
    const F = K.shared.F, hx = F.hero10[0], hz = F.hero10[1];
    if (!path) { const e = K.shared.dropCam(t1); path = K.camPath([{ t: t0, pos: [hx - 70, 26, hz + 1.0], target: [hx - 5, 0, hz + 1.0], fov: 35 }, { t: bar(87), pos: [hx - 48, 12, hz + 1.0], target: [hx + 20, 0.5, hz + 0.6], fov: 35 }, { t: bar(88), pos: [hx - 24, 4.2, hz + 1.0], target: [hx + 30, 1.6, hz + 0.2], fov: 36 }, { t: bar(88.6), pos: [hx - 12, 2.2, hz + 1.05], target: [hx + 12, 1.5, hz - 0.1], fov: 37 }, { t: t1, ...e }]); }
    const n = K.shared.thousand(t); const camera = { ...path(t), far: 30000, aperture: 0.02, focusDist: 8 };
    return { camera, world: { text: 0.6, flow: 0.1, lights: { gain: 0.6 } }, hud: K.hudMain(t, { count: n }) };
  } };
}
