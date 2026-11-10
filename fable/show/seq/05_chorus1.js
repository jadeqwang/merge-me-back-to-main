// 5 · bars 41-56 · 1:09.7-1:37.5 · chorus 1 (stripped); hits 69.69 and 89.80
// A  b41     "Merge me back to main"                 low and wide in front of her: she sprints at the camera; at every node another branch runs in and fuses with her
// B  b44.5   "Every road I ran becomes the one"      high over M1: the last merges, 8 -> 4 ("road") -> 2 ("ran") -> 1 ("one")
// C  b49     "Fold me in again"                      side-on: a fan of eight coloured afterimages folds into her, one per beat
// D  89.80   "Nothing that I lived can come undone"  she has stopped; she looks back; every road still glows; the commits light up in order
import { seg, ss, lerp, sm, easeOut } from '../kit.js';

export default function seq(K) {
  const { bar, bb, world: W, cast, T } = K; const t0 = bar(41), t1 = bar(57); const tB = bb(44, 3), tC = bar(49), tD = 89.80, M = W.M1;
  const hf = (t) => K.frameOf(W.heroAt, t, 0.25);
  // Performances: sprint_loop while the world carries her (far faster than legs can go in A and B: the clock is capped, the road rushes), then from 85.6
  // sprint_stop_look with its own root motion along main: she brakes, is at rest on the 89.80 hit, looks back from 91.8 ("I") and holds.
  const SSL = 'sprint_stop_look', EAST = Math.PI / 2, tS = cast.songT0(SSL) || 85.6, clock = K.loopClock(W.heroAt, t0, tS, 'sprint_loop', { anchor: [tS, 0], hi: 1.3 });
  const xS = W.heroAt(tS).x - cast.root(SSL, 0)[2];                                         // the track's origin: continuous with the sprint at 85.6
  const heroX = (t) => (t < tS ? W.heroAt(t).x : xS + cast.root(SSL, t - tS)[2]);            // where her hips are on main
  const body = (t) => (t < tS ? { pos: [W.heroAt(t).x, 0, 0], yaw: EAST, track: 'sprint_loop', time: clock(t) } : { pos: [xS, 0, 0], yaw: EAST, track: SSL, time: t - tS });
  // main is written under her feet: while she brakes, its write head stays with her (g such that the head is at x)
  const headAt = (x) => { let a = W.TM[0], b = bar(53); if (W.eastX(b) <= x) return 1e9; for (let i = 0; i < 30; i++) { const m = (a + b) / 2; if (W.eastX(m) < x) a = m; else b = m; } return b; };
  const FAN = ['rose', 'gold', 'mint', 'cyan', 'magenta', 'blue', 'coral', 'violet'];
  const high = K.camPath([{ t: tB, pos: [M[0] + 120, 150, 14], target: [M[0] - 110, 0, 0], fov: 35 }, { t: bar(47), pos: [M[0] + 90, 78, 10], target: [M[0] - 30, 0, 0], fov: 35 }, { t: tC, pos: [M[0] + 85, 30, 14], target: [M[0] + 34, 0, 0], fov: 35 }]);
  return { name: '05_chorus1', t0, t1, frame(t) {
    const hero = W.heroAt(t), a = hf(t);
    return K.cut(t, [
      { t0, f: () => {
        const camera = { pos: K.rel(a, 4.7, -0.8, 0.55), target: K.rel(a, 0, -1.5, 1.15), fov: 38, focusDist: 4.8, aperture: 0.04 };
        cast.actor('hero').set({ pos: [hero.x, 0, hero.z], yaw: K.yawOf(a), track: 'sprint_loop', time: clock(t) });
        const s = W.mergeSibling(t); if (s) cast.actor('sib', { lane: s.color }).set({ pos: [s.x, 0, s.z], yaw: Math.atan2(s.tx, s.tz), track: 'sprint_loop', time: clock(t) + 0.2, alpha: 1 - ss(s.u, 0.9, 1) });
        const k = s ? Math.exp(-s.u * 5) : 0;       // the flash of the merge just made
        return { camera, world: { text: 0.8, flow: 0.2, flowSpeed: 9 }, extra: k > 0.02 ? [W.glow([{ x: hero.x, z: hero.z, r: 2 + 4 * (1 - k), c: [1.4 * k, 0.8 * k, 0.5 * k] }])] : [],
          type: [K.lyric(7, camera, { font: 'hook', x: -0.92, y: 0.36, rows: [2, 3], dist: 30 })], hud: K.hudMain(t, { count: W.count(t) }) }; } },
      { t0: tB, f: () => {
        const camera = { ...high(t), far: 30000 };
        cast.actor('hero').set({ pos: [hero.x, 0, hero.z], yaw: K.yawOf(a), track: 'sprint_loop', time: clock(t) });
        const s = W.mergeSibling(t); if (s) cast.actor('sib', { lane: s.color }).set({ pos: [s.x, 0, s.z], yaw: Math.atan2(s.tx, s.tz), track: 'sprint_loop', time: clock(t) + 0.2 });
        const m = t >= W.TM[0] ? Math.exp(-(t - W.TM[0]) * 1.4) : 0;
        return { camera, world: { text: 0.5, flow: 0.2, flowSpeed: 9, minPx: 1.8, headGain: 3, headLen: 0.25, lights: { gain: 1.0, minPx: 1.5 }, conn: { gain: 0.5, halo: 0 } }, extra: [W.glow([{ x: M[0], z: 0, r: 10 + 60 * (1 - m), c: [2 * m, 1.0 * m, 0.4 * m] }])],
          type: [K.lyric(8, camera, { font: 'hook', x: -0.92, y: 0.20, rows: [2, 2, 3], dist: 60 })], hud: K.hudMain(t, { count: W.count(t) }) }; } },
      { t0: tC, f: () => {
        const hx = heroX(t); const camera = { pos: [hx - 2.6, 1.2, 7.6], target: [hx - 2.6, 1.0, 0], fov: 35, focusDist: 7.6, aperture: 0.04 };
        cast.actor('hero').set(body(t));
        // eight afterimages trail behind her; one folds into her on every beat from the bar line
        const beat = (T.beatAt(t) - T.beatAt(tC)); const out = [];
        FAN.forEach((ln, i) => { const f = seg(beat, i, i + 0.85); if (f >= 1) return; const k = 1 - easeOut(f), d = (i + 1) * 0.7 * k, tt = t - 0.07 * (i + 1) * k, b = body(tt);       // she, a moment ago, d metres behind
          cast.actor('fan' + i, { lane: ln }).set({ ...b, pos: [b.pos[0] + (hx - d) - heroX(tt), 0, 0.12 * (i + 1) * (1 - f)], alpha: 0.75 - 0.06 * i }); if (f > 0.6) out.push(f); });
        const k = out.length ? (out[0] - 0.6) / 0.4 : 0;
        return { camera, world: { text: 0.8, flow: 0.15, main: { head: t < tS ? t : headAt(hx) } }, extra: k > 0 ? [W.glow([{ x: hx, z: 0, r: 1.5 + 2 * k, c: [1.0 * (1 - k), 0.55 * (1 - k), 0.3 * (1 - k)] }])] : [],
          type: [K.lyric(9, camera, { font: 'hook', x: -0.92, y: 0.36, rows: [2, 2], dist: 34 }), K.lyric(10, camera, { font: 'hook', x: -0.92, y: 0.28, rows: [2, 2, 3], dist: 34 })], hud: K.hudMain(t, { count: 1 }) }; } },
      { t0: tD, f: (tt, u) => {
        const x = heroX(t); const camera = { pos: [x + 4.2 - 0.4 * u, 1.2 + 1.0 * sm(u), 2.3], target: [x - 6, 2.3 + 0.5 * u, -2.2], fov: 35, focusDist: 4.8, aperture: 0.045 };
        cast.actor('hero').set(body(t));                                                    // at rest; the look-back over her right shoulder begins at 91.8
        // the commits light up in the order they were made
        const pg = lerp(W.TF[0], W.TM[0] + 4, seg(t, 91.8, t1 - 0.3));
        return { camera, world: { text: 0.8, flow: 0.1, pulses: [{ g: pg, width: 4, gain: 4 }], lights: { gain: 1 }, main: { head: headAt(x) } },
          type: [K.lyric(10, camera, { font: 'hook', x: -0.92, y: 0.28, rows: [2, 2, 3], dist: 34, out: t1, fade: 0.01 })], hud: K.hudMain(t, { count: 1 }) }; } },
    ], t1);
  } };
}
