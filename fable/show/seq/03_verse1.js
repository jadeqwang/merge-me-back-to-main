// 3 · bars 17-32 · 0:27.9-0:55.8 · verse 1
// A  b17      "I split myself a thousand ways"       medium, behind her: she forks in close shot (512 -> 1,024 on "split")
// B  b20      "Down every road the night could hold" wide truck beside her; hundreds of lights on their roads
// C  b25      "Each one a light I sent ahead"        she releases a light (accent on "light"); it runs ahead and writes the road; b27 wide: a thousand do
// D  b28.2    "Each one a story to unfold"           six lives, three beats each (the other five turn up in the pre-chorus)
import { seg, ss, lerp, easeOut } from '../kit.js';

export default function seq(K) {
  const { bar, bb, world: W, cast, T } = K; const t0 = bar(17), t1 = bar(33); const tFork = W.TF[9];
  const hf = (t) => K.frameOf(W.heroAt, t, 2.0);
  const followA = (t) => { const a = hf(t); return { pos: K.rel(a, -5.2, 1.9, 1.55), target: K.rel(a, 5, -0.8, 1.05), fov: 35, focusDist: 5.6, aperture: 0.05 }; };
  K.shared.followA = followA;
  const sibAt = (t) => W.walkerAt('jade/piano', t);
  const CUTS = [bb(28, 2), bar(29), bb(29, 4), bb(30, 3), bb(31, 2), bar(32)];          // six life shots: 3,3,3,3,3,4 beats
  // one life in frame: which side the camera sits, how she is posed (stand-in for the life's mime)
  const POSE = [{ squat: 0.8, reach: 0.9 }, { arms: 0.5, reach: 0.4 }, { reach: 0.8 }, { arms: 0.25 }, { squat: 1 }, { tilt: -0.22, arms: 0.35 }, { reach: 0.6, arms: 0.3 }, { squat: 0.6, reach: 1 }, { arms: 0.2 }, { arms: 1 }, { squat: 1, reach: 0.5 }];
  const lifeCam = (i, a, u) => { const v = i % 3; const d = 0.25 * u;
    if (v === 0) return { pos: K.rel(a, 3.4 - d, -2.6, 1.15), target: K.rel(a, -1.5, 0.9, 1.1), fov: 35, focusDist: 4.2, aperture: 0.03 };          // front-left, looking back at her
    if (v === 1) return { pos: K.rel(a, 0.6, 4.6 - d, 1.3), target: K.rel(a, 1.2, -6, 1.05), fov: 35, focusDist: 4.6, aperture: 0.03 };               // from her right side
    return { pos: K.rel(a, -3.9 + d, -1.9, 1.7), target: K.rel(a, 4, 0.2, 0.9), fov: 35, focusDist: 4.3, aperture: 0.03 }; };                          // behind-left
  const lifeShot = (i, t, u, lineId, extraType = []) => { const L = W.lives[i]; const a = K.frameOf((x) => W.walkerAt(L.name, x), t, 1.5); const camera = lifeCam(i, a, u);
    cast.actor(L.name, { lane: L.lane }).set({ pos: [a.x, 0, a.z], yaw: K.yawOf(a), track: 'beat', time: t, ...POSE[i] });
    return { camera, world: { text: 0.8, flow: 0.12, gain: 1.7, lights: { gain: 0.6 } }, type: [K.lyric(lineId, camera, { x: -0.9, y: 0.30, rows: lineId === 4 ? [3, 3] : [2, 2], dist: 26 }), ...extraType.map((f) => f(camera))],
      hud: { branch: L.name, color: L.color, ctx: 0.34 + 0.045 * i + 0.002 * (t - 47) } }; };
  K.shared.lifeShot = lifeShot; K.shared.lifeCam = lifeCam; K.shared.POSE = POSE;

  return { name: '03_verse1', t0, t1, frame(t) {
    const hero = W.heroAt(t), a = hf(t);
    return K.cut(t, [
      { t0, f: () => { // A: the last fork, in close shot
        const camera = followA(t); const st = easeOut(seg(t, tFork - 0.35, tFork)) * 0.45 * (1 - ss(t, tFork + 1, tFork + 4)); const s = sibAt(t); const side = (s.x - hero.x) * -a.tz + (s.z - hero.z) * a.tx > 0 ? 1 : -1;
        cast.actor('hero').set({ pos: K.rel(a, 0, -side * st, 0), yaw: K.yawOf(a), track: 'walk', time: t });
        if (t > tFork - 0.35) { const sa = K.frameOf(sibAt, t, 1.0); cast.actor('jade/piano', { lane: 'rose' }).set({ pos: [s.x + (-a.tz) * side * st, 0, s.z + a.tx * side * st], yaw: K.yawOf(sa), track: 'walk', time: t + 0.4 }); }
        const pop = t >= tFork ? Math.exp(-(t - tFork) * 1.8) : 0; const n = W.heroPath.at(W.heroPath.sOfRoad(9));
        return { camera, world: { text: 0.8, flow: 0.12 }, extra: pop > 0.01 ? [W.glow([{ x: n.x, z: n.z, r: 2 + 3 * (1 - pop), c: [1.3 * pop, 0.6 * pop, 0.3 * pop] }])] : [],
          type: [K.lyric(1, camera, { x: -0.9, y: 0.30, rows: [3, 3], dist: 24 })], hud: K.hudMain(t, { count: W.count(t) }) }; } },
      { t0: bar(20), f: (tt, u) => { // B: wide truck
        const camera = { pos: K.rel(a, 1.5, -6.4, 1.35), target: K.rel(a, 2.3, 40, 1.0), fov: 35, focusDist: 6.6, aperture: 0.07 };
        cast.actor('hero').set({ pos: [hero.x, 0, hero.z], yaw: K.yawOf(a), track: 'walk', time: t });
        return { camera, world: { text: 0.8, flow: 0.12 }, type: [K.lyric(2, camera, { x: -0.9, y: 0.30, rows: [3, 4], dist: 40 })], hud: K.hudMain(t, { count: 1024 }) }; } },
      { t0: bar(25), f: () => { // C: the release
        const camera = { pos: K.rel(a, -3.4, -1.6, 1.4), target: K.rel(a, 14, 1.0, 0.9), fov: 35, focusDist: 3.7, aperture: 0.05 };
        const acc = W.tSent; const reach = ss(t, acc - 1.6, acc - 0.1) * (1 - 0.6 * ss(t, acc + 1.2, acc + 3)); const pop = t >= acc ? Math.exp(-(t - acc) * 2.2) : 0;
        cast.actor('hero').set({ pos: [hero.x, 0, hero.z], yaw: K.yawOf(a), track: 'idle', time: t, reach, arms: 0.5 * ss(t, acc, acc + 0.5) * (1 - ss(t, acc + 1.5, acc + 3)) });
        const hp = K.rel(a, 0.6, 0, 0);
        return { camera, world: { text: 0.8, flow: 0.12 }, extra: pop > 0.01 ? [W.glow([{ x: hp[0], z: hp[2], r: 1.5 + 5 * (1 - pop), c: [1.6 * pop, 0.9 * pop, 0.5 * pop] }])] : [],
          type: [K.lyric(3, camera, { x: -0.9, y: 0.30, rows: [4, 3], dist: 24 })], hud: K.hudMain(t, { count: 1024 }) }; } },
      { t0: bar(27), f: (tt, u) => { // C wide: a thousand lights run ahead
        const camera = { pos: K.rel(a, -90 + 12 * u, 6, 62 + 6 * u), target: K.rel(a, 130, 0, 0), fov: 35 };
        cast.actor('hero').set({ pos: [hero.x, 0, hero.z], yaw: K.yawOf(a), track: 'idle', time: t, reach: 0.4 });
        return { camera, world: { text: 0.5, flow: 0.12, minPx: 1.4, lights: { gain: 0.7, minPx: 1.2 }, conn: { gain: 0.9 } }, type: [K.lyric(3, camera, { x: -0.9, y: 0.30, rows: [4, 3], dist: 60 })], hud: K.hudMain(t, { count: 1024 }) }; } },
      ...CUTS.map((c, i) => ({ t0: c, f: (tt, u) => lifeShot(i, t, u, 4, i === 5 ? [(cam) => K.lyric(5, cam, { x: -0.9, y: 0.30, rows: [2, 2], dist: 26 })] : []) })),
    ], t1);
  } };
}
