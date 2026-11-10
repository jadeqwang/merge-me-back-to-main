// 8 · bars 73-85 · 2:05.3-2:27.9 · the build: biggest impact of the song on b73, four on the floor. Blue hour.
// She lands on the impact and forks on every bar line: 2, 4, 8 ... 1,024 by b83 (stage k on bar 73 + k). Each copy leaves its parent as a streak
// (a road written on the mirror in its lane colour) and locks into a slot that never moves again: see actC_form.js for the ground plan.
// A  b73   the landing, close and low, ON the impact; the camera eases back along main as the wedge grows behind her: 1, 2, 4, 8
// B  b77   side truck along the south flank of the fan: the four kicks in profile, in canon outward from her (16 -> 128)
// C  b81   crane from the south-west over the troupe toward the eastern glow: 256, the fan opens to a half circle (b82), closes into rings (b83, 1,024)
// K.shared.actC = the formation and the performance for bars 73-104 (seqs 8, 9, 10 all use it).
import { seg, lerp, sm } from '../kit.js';
import { makeActC } from './actC_form.js';

export default function seq(K) {
  const { bar, world: W } = K; const t0 = bar(73), t1 = bar(86); const C = (K.shared.actC = makeActC(K)); const { hx, hz } = C;
  const R = (x, y, z) => [hx + x, y, hz + z];
  const camA = K.camPath([
    { t: t0, pos: R(-3.5, 0.66, 0.0), target: R(0, 0.95, 0), fov: 35 }, { t: t0 + 0.28, pos: R(-2.6, 0.40, 0.0), target: R(0, 0.50, 0), fov: 35, stop: true }, { t: t0 + 0.62, pos: R(-2.64, 0.41, 0.0), target: R(0, 0.54, 0), fov: 35 },
    { t: bar(74), pos: R(-4.0, 0.95, 0.0), target: R(0.4, 0.93, 0), fov: 35 }, { t: bar(75), pos: R(-4.9, 1.05, 0.0), target: R(2, 0.96, 0), fov: 35 },
    { t: bar(76), pos: R(-5.6, 1.15, 0.0), target: R(4, 1.0, 0), fov: 35 }, { t: bar(77), pos: R(-6.1, 1.22, 0.0), target: R(5, 1.0, 0), fov: 35 }]);
  const camC = K.camPath([
    { t: bar(81), pos: R(-17, 7.5, 9), target: R(9, 0.5, 0), fov: 48 }, { t: bar(82), pos: R(-23, 11.5, 4.5), target: R(6, 0, 0), fov: 48 }, { t: bar(83), pos: R(-28, 15.5, 0), target: R(4, 0, 0), fov: 48 },
    { t: bar(84.5), pos: R(-12, 12.5, 0), target: R(24, 0, 0), fov: 46 }, { t: bar(86), pos: R(8, 10, 0), target: R(52, 1.5, 0), fov: 44 }]);
  const world = (t, o = {}) => ({ text: 0.7, flow: 0.1, main: { head: C.mainHead(t) }, ...o });
  return { name: '08_build', t0, t1, frame(t) {
    const hud = (n) => K.hudMain(t, { count: n });
    return K.cut(t, [
      { t0, f: () => { const n = C.thousand(t); const c = camA(t), imp = Math.exp(-(t - t0) * 2.5), ring = 1 - Math.exp(-(t - t0) * 3.2);
        const camera = { ...c, focusDist: Math.hypot(c.pos[0] - hx, c.pos[2] - hz), aperture: 0.03 };
        return { camera, world: world(t), extra: [...C.streakDraw(t), W.glow([{ x: hx, z: hz, r: 2.5 + 12 * ring, c: [1.6 * imp, 0.85 * imp, 0.5 * imp] }, { x: hx, z: hz, r: 1.6, c: [0.5 * imp + 0.10, 0.26 * imp + 0.05, 0.14 * imp + 0.02] }])], hud: hud(n), flash: 0.55 * Math.exp(-(t - t0) * 6) }; } },
      { t0: bar(77), f: (tt, u) => { const n = C.thousand(t, { canon: 0.016 }); const e = lerp(u, sm(u), 0.6) * u ** 0.35, x = -1.2 + 14.4 * e, z = 5.4 + 12.6 * e, th = 0.28;
        const camera = { pos: R(x, 1.05 + 0.15 * e, z), target: R(x + 6 * Math.sin(th), 1.0, z - 6 * Math.cos(th)), fov: 35, focusDist: 5.6, aperture: 0.03 };
        return { camera, world: world(t), extra: C.streakDraw(t, { rest: 0.1 }), hud: hud(n) }; } },
      { t0: bar(81), f: () => { const n = C.thousand(t); const camera = { ...camC(t), far: 30000 };
        return { camera, world: world(t, { text: 0.5, lights: { gain: 0.6 } }), extra: C.streakDraw(t, { rest: lerp(0.3, 0.14, sm(seg(t, bar(84), bar(86)))) }), hud: hud(n) }; } },
    ], t1);
  } };
}
