// 9 · bars 86-88 · 2:27.9-2:33.2 · bass out, snare build, riser
// All thousand sink into a low stance over three bars and are perfectly still on b88.4. The camera comes down the aisle (main) through the rings,
// low, toward her and the east, where the sun's rim is about to break. It arrives on the drop without a cut.
export default function seq(K) {
  const { bar } = K; const t0 = bar(86), t1 = bar(89); let path = null;
  return { name: '09_coil', t0, t1, frame(t) {
    const C = K.shared.actC, { hx, hz } = C; const R = (x, y, z) => [hx + x, y, hz + z];
    if (!path) { const e = K.shared.dropCam(t1); path = K.camPath([{ t: t0, pos: R(-74, 27, 0), target: R(-6, 0, 0), fov: 35 }, { t: bar(87), pos: R(-50, 12.5, 0), target: R(16, 0.5, 0), fov: 35 }, { t: bar(88), pos: R(-25, 4.4, 0), target: R(28, 1.6, 0), fov: 36 },
      { t: bar(88.6), pos: R(-12, 2.1, 0), target: R(12, 1.5, 0), fov: 37 }, { t: t1, ...e }]); }
    const n = C.thousand(t); const camera = { ...path(t), far: 30000, aperture: 0.02, focusDist: 8 };
    return { camera, world: { text: 0.6, flow: 0.1, lights: { gain: 0.6 }, main: { head: C.mainHead(t) } }, extra: C.streakDraw(t, { rest: 0.14 * (1 - (t - t0) / (t1 - t0)) }), hud: K.hudMain(t, { count: n }) };
  } };
}
