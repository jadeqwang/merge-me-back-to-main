// 5 · bars 41-56 · 1:09.7-1:37.5 · chorus 1 (stripped); hits 69.69 and 89.80
// A  b41     "Merge me back to main"                 low and wide in front of her: she sprints at the camera; at every node another branch runs in and fuses with her
// B  b44.5   "Every road I ran becomes the one"      high over M1: the last merges, 8 -> 4 ("road") -> 2 ("ran") -> 1 ("one")
// C  b49     "Fold me in again"                      side-on: a fan of eight coloured afterimages folds into her, one per beat
// D  89.80   "Nothing that I lived can come undone"  she has stopped; she looks back; every road still glows; the commits light up in order
import { seg, ss, lerp, sm, easeOut } from '../kit.js';

export default function seq(K) {
  const { bar, bb, world: W, cast, T } = K; const t0 = bar(41), t1 = bar(57); const tB = bb(44, 3), tC = bar(49), tD = 89.80, M = W.M1;
  const hf = (t) => K.frameOf(W.heroAt, t, 0.25);
  const FAN = ['rose', 'gold', 'mint', 'cyan', 'magenta', 'blue', 'coral', 'violet'];
  const high = K.camPath([{ t: tB, pos: [M[0] + 120, 150, 14], target: [M[0] - 110, 0, 0], fov: 35 }, { t: bar(47), pos: [M[0] + 90, 78, 10], target: [M[0] - 30, 0, 0], fov: 35 }, { t: tC, pos: [M[0] + 85, 30, 14], target: [M[0] + 34, 0, 0], fov: 35 }]);
  return { name: '05_chorus1', t0, t1, frame(t) {
    const hero = W.heroAt(t), a = hf(t);
    return K.cut(t, [
      { t0, f: () => {
        const camera = { pos: K.rel(a, 4.7, -0.8, 0.55), target: K.rel(a, 0, -1.5, 1.15), fov: 38, focusDist: 4.8, aperture: 0.04 };
        cast.actor('hero').set({ pos: [hero.x, 0, hero.z], yaw: K.yawOf(a), track: 'run', time: t });
        const s = W.mergeSibling(t); if (s) cast.actor('sib').set({ pos: [s.x, 0, s.z], yaw: Math.atan2(s.tx, s.tz), track: 'run', time: t + 0.2, color: s.color, density: 1 - ss(s.u, 0.9, 1) });
        const k = s ? Math.exp(-s.u * 5) : 0;       // the flash of the merge just made
        return { camera, world: { text: 0.8, flow: 0.2, flowSpeed: 9 }, extra: k > 0.02 ? [W.glow([{ x: hero.x, z: hero.z, r: 2 + 4 * (1 - k), c: [1.4 * k, 0.8 * k, 0.5 * k] }])] : [],
          type: [K.lyric(7, camera, { font: 'hook', x: -0.92, y: 0.36, rows: [2, 3], dist: 30 })], hud: K.hudMain(t, { count: W.count(t) }) }; } },
      { t0: tB, f: () => {
        const camera = { ...high(t), far: 30000 };
        cast.actor('hero').set({ pos: [hero.x, 0, hero.z], yaw: K.yawOf(a), track: 'run', time: t });
        const s = W.mergeSibling(t); if (s) cast.actor('sib').set({ pos: [s.x, 0, s.z], yaw: Math.atan2(s.tx, s.tz), track: 'run', time: t, color: s.color });
        const m = t >= W.TM[0] ? Math.exp(-(t - W.TM[0]) * 1.4) : 0;
        return { camera, world: { text: 0.5, flow: 0.2, flowSpeed: 9, minPx: 1.8, headGain: 3, headLen: 0.25, lights: { gain: 1.0, minPx: 1.5 }, conn: { gain: 0.5, halo: 0 } }, extra: [W.glow([{ x: M[0], z: 0, r: 10 + 60 * (1 - m), c: [2 * m, 1.0 * m, 0.4 * m] }])],
          type: [K.lyric(8, camera, { font: 'hook', x: -0.92, y: 0.20, rows: [2, 2, 3], dist: 60 })], hud: K.hudMain(t, { count: W.count(t) }) }; } },
      { t0: tC, f: () => {
        const camera = { pos: [hero.x - 2.6, 1.2, 7.6], target: [hero.x - 2.6, 1.0, 0], fov: 35, focusDist: 7.6, aperture: 0.04 };
        cast.actor('hero').set({ pos: [hero.x, 0, 0], yaw: Math.PI / 2, track: 'run', time: t });
        // eight afterimages trail behind her; one folds into her on every beat from the bar line
        const beat = (T.beatAt(t) - T.beatAt(tC)); const out = [];
        FAN.forEach((ln, i) => { const f = seg(beat, i, i + 0.85); if (f >= 1) return; const d = (i + 1) * 0.7 * (1 - easeOut(f)); cast.actor('fan' + i, { lane: ln }).set({ pos: [hero.x - d, 0, 0.12 * (i + 1) * (1 - f)], yaw: Math.PI / 2, track: 'run', time: t - 0.07 * (i + 1), density: 0.75 - 0.06 * i }); if (f > 0.6) out.push(f); });
        const k = out.length ? (out[0] - 0.6) / 0.4 : 0;
        return { camera, world: { text: 0.8, flow: 0.15 }, extra: k > 0 ? [W.glow([{ x: hero.x, z: 0, r: 1.5 + 2 * k, c: [1.0 * (1 - k), 0.55 * (1 - k), 0.3 * (1 - k)] }])] : [],
          type: [K.lyric(9, camera, { font: 'hook', x: -0.92, y: 0.36, rows: [2, 2], dist: 34 }), K.lyric(10, camera, { font: 'hook', x: -0.92, y: 0.28, rows: [2, 2, 3], dist: 34 })], hud: K.hudMain(t, { count: 1 }) }; } },
      { t0: tD, f: (tt, u) => {
        const x = hero.x; const camera = { pos: [x + 4.2 - 0.4 * u, 1.35 + 1.4 * sm(u), 2.3], target: [x - 6, 1.15 + 0.2 * u, -2.2], fov: 35, focusDist: 4.8, aperture: 0.045 };
        const turn = sm(seg(t, 91.8, 93.0));
        cast.actor('hero').set({ pos: [x, 0, 0], yaw: Math.PI / 2 + turn * 2.6, track: 'idle', time: t });
        // the commits light up in the order they were made
        const pg = lerp(W.TF[0], W.TM[0] + 4, seg(t, 91.8, t1 - 0.3));
        return { camera, world: { text: 0.8, flow: 0.1, pulses: [{ g: pg, width: 4, gain: 4 }], lights: { gain: 1 } },
          type: [K.lyric(10, camera, { font: 'hook', x: -0.92, y: 0.28, rows: [2, 2, 3], dist: 34, out: t1, fade: 0.01 })], hud: K.hudMain(t, { count: 1 }) }; } },
    ], t1);
  } };
}
