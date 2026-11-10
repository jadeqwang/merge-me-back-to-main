// 3 · bars 17-32 · 0:27.9-0:55.8 · verse 1
// A  b17      "I split myself a thousand ways"       medium, behind her: she forks in close shot (512 -> 1,024 on "split")
// B  b20      "Down every road the night could hold" wide truck beside her; hundreds of lights on their roads
// C  b25      "Each one a light I sent ahead"        she releases a light (accent on "light"); it runs ahead and writes the road; b27 wide: a thousand do
// D  b28.2    "Each one a story to unfold"           six lives, three beats each (the other five turn up in the pre-chorus)
import { seg, ss, lerp, easeOut } from '../kit.js';

// Performances: she runs (the world moves her at 4.7-5.6 m/s here: sprint_loop, the ACCAD run, phase locked to the ground she covers); the last fork is the two
// roads parting under two runners in step; she brakes (sprint_stop_look, with its real root motion, so she comes to rest 7 m short of the world's pause
// point and the camera rides HER) and plays `release` with its accent on "light"; the lives play their life_* tracks standing where their shot finds them.
export default function seq(K) {
  const { bar, bb, world: W, cast, T } = K; const t0 = bar(17), t1 = bar(33); const tFork = W.TF[9];
  const CUTS = [bb(28, 2), bar(29), bb(29, 4), bb(30, 3), bb(31, 2), bar(32)];          // six life shots: 3,3,3,3,3,4 beats
  // ---- the hero's body through the verse. tSw: sprint_loop hands over to sprint_stop_look's frame 0 (the same pose); she is at rest at tPause0 and `release` begins.
  const SSL = 'sprint_stop_look', dStop = cast.event(SSL, 'stop') ?? 4.2, tSw = W.tPause0 - dStop, sW = (t) => Math.max(0, W.walkerS(W.heroPath, t)), z0 = cast.root(SSL, 0)[2];
  const heroS = (t) => (t < tSw || t >= CUTS[0] ? sW(t) : sW(tSw) + cast.root(SSL, Math.min(t - tSw, dStop))[2] - z0);      // arc length of her hips along her road
  const heroFig = (t) => W.heroPath.at(heroS(t));
  const clock = K.loopClock(W.heroAt, bar(15), tSw, 'sprint_loop', { anchor: [tSw, 0] });
  K.shared.heroRun = (t) => ({ track: 'sprint_loop', time: clock(t) });
  const heroPerf = (t, a) => (t < tSw ? { pos: [a.x, 0, a.z], yaw: K.yawOf(a), ...K.shared.heroRun(t) } : t < W.tPause0 ? { ...K.ride(SSL, t - tSw, a), track: SSL, time: t - tSw }
    : { pos: [a.x, 0, a.z], yaw: K.yawOf(a), track: 'release', time: t - W.tPause0 });                                    // release accent (track t = 2.5) = W.tSent, "light"
  const hf = (t) => K.frameOf(heroFig, t, 2.0);
  const followA = (t) => { const a = hf(t); return { pos: K.rel(a, -5.2, 1.9, 1.55), target: K.rel(a, 5, -0.8, 1.05), fov: 35, focusDist: 5.6, aperture: 0.05 }; };
  K.shared.followA = followA;
  const sibAt = (t) => W.walkerAt('jade/piano', t);
  // ---- the lives. One track per life (W.lives order). jade/phd and jade/chez-jj have no track of their own yet: phd listens (idle), chez-jj writes on the floor (life_poet).
  // Every life track looks back over the right shoulder from its t = 4.5: that moment is "remembers" (57.03) for all of them. Shots that come before that clock
  // starts (verse 1) show the activity from their own cut instead.
  const LIFE = ['life_piano', 'life_violin', 'life_wetlab', 'idle', 'life_poet', 'life_nasa', 'life_band', 'life_wushu', 'life_poet', 'life_stage', 'life_home'];
  const tLook = T.words(5)[3].start, tLife0 = tLook - 4.5;
  const lifePerf = (i, t, c0) => ({ track: LIFE[i], time: LIFE[i] === 'idle' ? t : c0 >= tLife0 ? t - tLife0 : t - c0 + 0.5 });
  // she stays where her shot finds her (a seated pianist does not glide down the road): the road frame at the cut
  const lifeFrame = (i, c0) => K.frameOf((x) => W.walkerAt(W.lives[i].name, x), c0, 1.5);
  const lifeCam = (i, a, u) => { const v = i % 3; const d = 0.25 * u;
    if (v === 0) return { pos: K.rel(a, 3.4 - d, -2.6, 1.15), target: K.rel(a, -1.5, 0.9, 1.1), fov: 35, focusDist: 4.2, aperture: 0.03 };          // front-left, looking back at her
    if (v === 1) return { pos: K.rel(a, 0.6, 4.6 - d, 1.3), target: K.rel(a, 1.2, -6, 1.05), fov: 35, focusDist: 4.6, aperture: 0.03 };               // from her right side
    return { pos: K.rel(a, -3.9 + d, -1.9, 1.7), target: K.rel(a, 4, 0.2, 0.9), fov: 35, focusDist: 4.3, aperture: 0.03 }; };                          // behind-left
  const lifeShot = (i, t, u, c0, lineId, extraType = []) => { const L = W.lives[i]; const a = lifeFrame(i, c0); const camera = lifeCam(i, a, u);
    cast.actor(L.name, { lane: L.lane }).set({ pos: [a.x, 0, a.z], yaw: K.yawOf(a), ...lifePerf(i, t, c0) });
    return { camera, world: { text: 0.8, flow: 0.12, gain: 1.7, lights: { gain: 0.6 } }, type: [K.lyric(lineId, camera, { x: -0.9, y: 0.30, rows: lineId === 4 ? [3, 3] : [2, 2], dist: 26 }), ...extraType.map((f) => f(camera))],
      hud: { branch: L.name, color: L.color, ctx: 0.34 + 0.045 * i + 0.002 * (t - 47) } }; };
  K.shared.lifeShot = lifeShot; K.shared.lifeCam = lifeCam; K.shared.lifePerf = lifePerf; K.shared.lifeFrame = lifeFrame;

  return { name: '03_verse1', t0, t1, frame(t) {
    const hero = heroFig(t), a = hf(t);
    return K.cut(t, [
      { t0, f: () => { // A: the last fork, in close shot
        const camera = followA(t); const st = easeOut(seg(t, tFork - 0.35, tFork)) * 0.45 * (1 - ss(t, tFork + 1, tFork + 4)); const s = sibAt(t); const side = (s.x - hero.x) * -a.tz + (s.z - hero.z) * a.tx > 0 ? 1 : -1;
        cast.actor('hero').set({ ...heroPerf(t, a), pos: K.rel(a, 0, -side * st, 0) });
        if (t > tFork - 0.35) { const sa = K.frameOf(sibAt, t, 1.0); cast.actor('jade/piano', { lane: 'rose' }).set({ pos: [s.x + (-a.tz) * side * st, 0, s.z + a.tx * side * st], yaw: K.yawOf(sa), ...K.shared.heroRun(t), vary: 0 }); }
        const pop = t >= tFork ? Math.exp(-(t - tFork) * 1.8) : 0; const n = W.heroPath.at(W.heroPath.sOfRoad(9));
        return { camera, world: { text: 0.8, flow: 0.12 }, extra: pop > 0.01 ? [W.glow([{ x: n.x, z: n.z, r: 2 + 3 * (1 - pop), c: [1.3 * pop, 0.6 * pop, 0.3 * pop] }])] : [],
          type: [K.lyric(1, camera, { x: -0.9, y: 0.30, rows: [3, 3], dist: 24 })], hud: K.hudMain(t, { count: W.count(t) }) }; } },
      { t0: bar(20), f: (tt, u) => { // B: wide truck
        const camera = { pos: K.rel(a, 1.5, -6.4, 1.35), target: K.rel(a, 2.3, 40, 1.0), fov: 35, focusDist: 6.6, aperture: 0.07 };
        cast.actor('hero').set(heroPerf(t, a));
        return { camera, world: { text: 0.8, flow: 0.12, lights: { gain: 0.55 } }, type: [K.lyric(2, camera, { x: -0.9, y: 0.30, rows: [3, 4], dist: 40 })], hud: K.hudMain(t, { count: 1024 }) }; } },
      { t0: bar(25), f: () => { // C: the release
        const camera = { pos: K.rel(a, -3.4, -1.6, 1.4), target: K.rel(a, 14, 1.0, 0.9), fov: 35, focusDist: 3.7, aperture: 0.05 };
        const acc = W.tSent; const pop = t >= acc ? Math.exp(-(t - acc) * 2.2) : 0;
        cast.actor('hero').set(heroPerf(t, a));
        const hp = K.rel(a, 0.6, 0, 0);
        return { camera, world: { text: 0.8, flow: 0.12 }, extra: pop > 0.01 ? [W.glow([{ x: hp[0], z: hp[2], r: 1.5 + 5 * (1 - pop), c: [1.6 * pop, 0.9 * pop, 0.5 * pop] }])] : [],
          type: [K.lyric(3, camera, { x: -0.9, y: 0.30, rows: [4, 3], dist: 24 })], hud: K.hudMain(t, { count: 1024 }) }; } },
      { t0: bar(27), f: (tt, u) => { // C wide: a thousand lights run ahead
        const camera = { pos: K.rel(a, -90 + 12 * u, 6, 62 + 6 * u), target: K.rel(a, 130, 0, 0), fov: 35 };
        cast.actor('hero').set(heroPerf(t, a));
        return { camera, world: { text: 0.5, flow: 0.12, minPx: 1.4, lights: { gain: 0.7, minPx: 1.2 }, conn: { gain: 0.9 } }, type: [K.lyric(3, camera, { x: -0.9, y: 0.30, rows: [4, 3], dist: 60 })], hud: K.hudMain(t, { count: 1024 }) }; } },
      ...CUTS.map((c, i) => ({ t0: c, f: (tt, u, c0) => lifeShot(i, t, u, c0, 4, i === 5 ? [(cam) => K.lyric(5, cam, { x: -0.9, y: 0.30, rows: [2, 2], dist: 26 })] : []) })),
    ], t1);
  } };
}
