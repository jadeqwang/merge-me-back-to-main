// 9 · bars 86-88 · 2:27.9-2:33.2 · bass out, snare build, riser
// All thousand sink into a low stance over three bars and are perfectly still on b88.4. The camera comes down the aisle (main) through the rings,
// low, toward her and the east, where the sun's rim is about to break. It arrives on the drop without a cut.
// (The camera path lives in actC_form.js, `coilCam`: the run plan needs it to know who is in shot. Copies the camera has passed may already leave for their letters.)
export default function seq(K) {
  const { bar } = K; const t0 = bar(86), t1 = bar(89);
  return { name: '09_coil', t0, t1, frame(t) {
    const C = K.shared.actC; const n = C.thousand(t); const camera = { ...C.coilCam(t), far: 30000, aperture: 0.02, focusDist: 8 };
    return { camera, world: { text: 0.6, flow: 0.1, lights: { gain: 0.6 }, main: { head: C.mainHead(t) } }, extra: C.streakDraw(t, { rest: 0.07 * (1 - (t - t0) / (t1 - t0)) }), hud: K.hudMain(t, { count: n }) };
  } };
}
