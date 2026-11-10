// 8 · bars 73-85 · 2:05.3-2:27.9 · the build: biggest impact of the song on b73, four on the floor. Blue hour.
// She lands on the impact and forks on every bar line into formation: 2, 4, 8 ... 1,024 by b83 (stage k on bar 73 + k).
// A  b73   frontal, symmetric: basics on the beat, the wedge doubles each bar (1 -> 8)
// B  b77   side truck down the rows: kicks in canon (16 -> 128)
// C  b81   straight down: 256 -> 1,024; the grid opens into rings round her (b84-85)
// Also defines K.shared.thousand(t, o): the whole formation's state for bars 73-104 (seqs 8, 9, 10 all use it).
import { seg, lerp, sm } from '../kit.js';
import { makeFormation, N } from '../formation.js';

export default function seq(K) {
  const { bar, bb, world: W, cast, T } = K; const t0 = bar(73), t1 = bar(86); const F = (K.shared.F = makeFormation(K, W.FORM)); const tmp = new Float32Array(N * 2);
  const WEST = -Math.PI / 2, EAST = Math.PI / 2; const hx = F.hero10[0], hz = F.hero10[1];
  const mainStand = new Float32Array(N * 2); for (let i = 0; i < N; i++) { mainStand[i * 2] = F.MAIN[i * 2] + 0.82; mainStand[i * 2 + 1] = F.MAIN[i * 2 + 1]; }
  K.shared.mainStand = mainStand;
  // layout at time t
  function layout(t) { if (t < bar(84)) return F.buildPos(t); if (t < bar(86)) return F.lerpL(F.grids[10], F.rings, sm(seg(t, bar(84), bar(86))), tmp); if (t < bar(93)) return F.rings;
    if (t < bb(96, 3)) return F.lerpL(F.rings, mainStand, sm(seg(t, bar(93), bb(96, 3))), tmp); return mainStand; }
  // One performer's choreography = the baked tracks (CHOREO B), the same for the hero and every copy. tt = this copy's (possibly delayed) song time.
  //   `land` to its impact on b73 (125.343), `build` (song_t0 = b73) to the coil, `drop` (song_t0 151.669) from the still coil on b88.3: the two tracks are identical there.
  // They face WEST (the camera, the way they came); in the air of the last jump (b103) they turn to the sun, so the bao quan salute on b104 is to the east.
  const tBuild = cast.songT0('build') || bar(73), tDrop = cast.songT0('drop') || bar(89) - 1.5, tLand = cast.songT0('land') || bar(73) - 0.495, tCoil = bb(88, 3);
  const acc = (cast.meta('drop').accents || []).filter((q) => q.song > bar(102)), tUp = (acc.find((q) => q.name === 'takeoff') || { song: 177.147 }).song, tDown = (acc.find((q) => q.name === 'land') || { song: 177.664 }).song;
  const cen = cast.meta('drop').center || [0, 0], cW = cast.rot(WEST, cen[0], cen[1]);            // `drop` is performed around meta.center (where the butterfly lands), not its origin
  const perf = (tt) => (tt < tBuild ? { track: 'land', time: tt - tLand } : tt < tCoil ? { track: 'build', time: tt - tBuild } : { track: 'drop', time: tt - tDrop });
  const yawAt = (tt) => WEST + Math.PI * sm(seg(tt, tUp, tDown));
  // fill the crowd. o: { canon: seconds of delay per metre from the hero (0 = unison; each copy still varies by up to 25 ms through its seed) }
  // Until b93 a copy's track origin is her slot. From b93 the slot is where her CENTRE stands (rings -> the cells of MAIN), so the b97 dive lays her body on its cell.
  function thousand(t, o = {}) { const L = layout(t); const cr = cast.crowd('thousand', N); const k = F.stageAt(t), n = t < bar(73) ? 0 : 1 << k; const canon = o.canon ?? 0; const lanes = K.LANES8;
    const forkAge = t - K.bar(F.forkBar(k)), u = sm(seg(t, bar(93), bb(96, 3)));
    for (let i = 0; i < n; i++) { const hero = i === 0; let tt = t; if (canon && !hero) tt = t - canon * Math.hypot(L[i * 2] - L[0], L[i * 2 + 1] - L[1]);
      const p = perf(tt), yaw = yawAt(tt); const fresh = k > 0 && i >= n / 2 && forkAge < 0.5;      // a copy that has just stepped out glows for a moment
      let x = L[i * 2], z = L[i * 2 + 1];
      if (p.track === 'drop') { const rx = F.rings[i * 2] + cW[0], rz = F.rings[i * 2 + 1] + cW[1], c = cast.rot(yaw, cen[0], cen[1]); x = lerp(rx, mainStand[i * 2], u) - c[0]; z = lerp(rz, mainStand[i * 2 + 1], u) - c[1]; }
      cr.put(i, { pos: [x, 0, z], yaw, track: p.track, time: p.time, lane: hero ? 'main' : lanes[i % 7], seed: hero ? 0 : i + 1, gain: fresh ? 1.6 : 1 }); }
    return n; }
  K.LANES8 = ['rose', 'gold', 'mint', 'cyan', 'magenta', 'blue', 'coral'];
  K.shared.thousand = thousand; K.shared.layout = layout;
  const boxA = W.frameBox(W.FORM[0] - 2, W.FORM[0] + 40, -20, 20, { margin: 1.03 }), boxB = W.frameBox(W.FORM[0] - 2, W.FORM[0] + 80, -37, 37, { margin: 1.03 }), boxR = W.frameBox(hx - 40, hx + 40, hz - 40, hz + 40, { margin: 1.03 });
  const lerpCam = (a, b, u) => ({ pos: [lerp(a.pos[0], b.pos[0], u), lerp(a.h, b.h, u), lerp(a.pos[2], b.pos[2], u)], target: [lerp(a.pos[0], b.pos[0], u) + 0.02 * lerp(a.h, b.h, u), 0, lerp(a.pos[2], b.pos[2], u)], fov: 35, topUp: [1, 0, 0], near: 1, far: 30000 });
  return { name: '08_build', t0, t1, frame(t) {
    const hud = (n) => K.hudMain(t, { count: n });
    return K.cut(t, [
      { t0, f: (tt, u) => { const n = thousand(t);
        const camera = { pos: [W.FORM[0] - 5.2 - 6.5 * sm(u), 1.2 + 0.5 * u, 0.2], target: [W.FORM[0] + 6, 1.1, 0], fov: 35, focusDist: 6 + 6 * u, aperture: 0.03 };
        const imp = Math.exp(-(t - t0) * 2.5);
        return { camera, world: { text: 0.7, flow: 0.1 }, extra: [W.glow([{ x: hx, z: hz, r: 3 + 10 * (1 - imp), c: [1.5 * imp, 0.8 * imp, 0.5 * imp] }])], hud: hud(n), flash: 0.5 * Math.exp(-(t - t0) * 6) }; } },
      { t0: bar(77), f: (tt, u) => { const n = thousand(t, { canon: 0.02 }); const k = F.stageAt(t); const half = lerp(4.4, 17.6, sm(seg(t, bar(77), bar(80.3)))) + 1;
        const camera = { pos: [W.FORM[0] - 5 + 13 * u, 1.55, half + 6.5], target: [W.FORM[0] + 1 + 13 * u, 1.0, -12], fov: 35, focusDist: 9, aperture: 0.03 };
        return { camera, world: { text: 0.7, flow: 0.1 }, hud: hud(n) }; } },
      { t0: bar(81), f: (tt, u) => { const n = thousand(t); const c1 = lerpCam(boxA, boxB, sm(seg(t, bar(81.6), bar(83.4)))); const c2 = lerpCam(boxB, boxR, sm(seg(t, bar(84), bar(86)))); const camera = t < bar(84) ? c1 : c2;
        return { camera, env: { ground: { fogAmt: 0, ripple: 0.006, base: K.hex('#1B1F78'), f0: 0.14 }, grade: { vignette: 0.4, bloom: 0.5 } }, world: { text: 0, flow: 0.1, minPx: 1.6, lights: false }, extra: [W.glow([{ x: camera.pos[0], z: camera.pos[2], r: camera.pos[1] * 0.42, c: [0.10, 0.05, 0.16] }])], hud: hud(n) }; } },
    ], t1);
  } };
}
