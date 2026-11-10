// 8 · bars 73-85 · 2:05.3-2:27.9 · the build: biggest impact of the song on b73, four on the floor. Blue hour.
// She lands on the impact and forks on every bar line into formation: 2, 4, 8 ... 1,024 by b83 (stage k on bar 73 + k).
// A  b73   frontal, symmetric: basics on the beat, the wedge doubles each bar (1 -> 8)
// B  b77   side truck down the rows: kicks in canon (16 -> 128)
// C  b81   straight down: 256 -> 1,024; the grid opens into rings round her (b84-85)
// Also defines K.shared.thousand(t, o): the whole formation's state for bars 73-104 (seqs 8, 9, 10 all use it).
import { seg, ss, lerp, sm, easeOut } from '../kit.js';
import { makeFormation, N } from '../formation.js';

export default function seq(K) {
  const { bar, bb, world: W, cast, T } = K; const t0 = bar(73), t1 = bar(86); const F = (K.shared.F = makeFormation(K, W.FORM)); const tmp = new Float32Array(N * 2);
  const WEST = -Math.PI / 2, EAST = Math.PI / 2; const hx = F.hero10[0], hz = F.hero10[1];
  const beatIn = (t) => { const b = T.barAt(t); const bi = Math.floor(b), f = (b - bi) * 4; return { bar: bi, beat: f }; };       // beat 0..4 inside the bar
  const hit = (t, tb, w = 0.12) => (t < tb ? 0 : Math.exp(-(t - tb) / w));                                                    // a sharp accent that decays
  const bell = (t, tb, w) => { const x = (t - tb) / w; return Math.abs(x) < 1 ? 1 - x * x : 0; };                              // a jump: parabola, apex at tb, half-width w
  const mainStand = new Float32Array(N * 2); for (let i = 0; i < N; i++) { mainStand[i * 2] = F.MAIN[i * 2] + 0.82; mainStand[i * 2 + 1] = F.MAIN[i * 2 + 1]; }
  K.shared.mainStand = mainStand;
  // layout at time t
  function layout(t) { if (t < bar(84)) return F.buildPos(t); if (t < bar(86)) return F.lerpL(F.grids[10], F.rings, sm(seg(t, bar(84), bar(86))), tmp); if (t < bar(93)) return F.rings;
    if (t < bb(96, 3)) return F.lerpL(F.rings, mainStand, sm(seg(t, bar(93), bb(96, 3))), tmp); return mainStand; }
  // one performer's choreography (stand-in), as offsets from standing: {y, squat, tilt, arms, reach, yaw}. tt = this copy's (possibly delayed) song time
  function perf(tt, hero) { const o = { y: 0, squat: 0, tilt: 0, arms: 0, reach: 0, yaw: WEST }; const { bar: b, beat } = beatIn(tt); const tb = (n, k = 1) => bb(n, k);
    if (tt < bar(73)) return o;
    if (b < 77) { o.squat = hit(tt, bar(73), 0.5) * (hero ? 1 : 0); const k = Math.floor(beat / 2) * 2; o.reach = hit(tt, tb(b, k + 1), 0.16); o.y = 0.05 * hit(tt, tb(b, k + 1), 0.1); if (b === 76 && beat < 2) { o.y = 0.12 * bell(tt, tb(76, 1), 0.3); o.reach = 0; } }
    else if (b < 81) { o.y = 0.22 * bell(tt, tb(b, 1), 0.34); o.tilt = 0.5 * bell(tt, tb(b, 1), 0.34); o.reach = 0.6 * bell(tt, tb(b, 1), 0.3); }                    // high kicks, apex on the downbeat
    else if (b < 85) { o.arms = b === 81 ? 0.5 + 0.5 * Math.sin(beat * 1.57) : b === 82 ? 1 : b === 83 ? Math.min(1, 0.3 + hit(tt, tb(83, 1), 2)) : 1 - sm(beat / 4); if (b === 82) o.yaw = WEST + sm(beat / 4) * Math.PI * 2; if (b === 83) o.squat = 0.5 * hit(tt, tb(83, 1), 1.5); }
    else if (b < 86) { o.reach = Math.max(hit(tt, tb(85, 1), 0.16), hit(tt, tb(85, 3), 0.16)); }
    else if (b < 89) { o.squat = sm(seg(tt, bar(86), tb(88, 4))); }                                                                                              // the coil: three bars down into a low stance
    else if (b < 90) { o.squat = hero ? 0.9 * sm(seg(tt, tb(89, 2), tb(89, 3))) : 1 - 0.0 * beat; if (hero) { o.y = 1.0 * bell(tt, bar(89), 0.42); o.tilt = -1.25 * bell(tt, bar(89), 0.42); } }   // butterfly kick apex ON the drop
    else if (b < 93) { o.reach = Math.max(hit(tt, tb(90, 1), 0.2), hit(tt, tb(91, 1), 0.2)); o.squat = Math.max(0.9 * bell(tt, tb(90, 3) + 0.2, 0.45), 0.25 * hit(tt, tb(90, 1), 0.3)); o.arms = tt >= tb(91, 3) && tt < bar(92) ? 1 : 0; o.y = 0.3 * bell(tt, tb(92, 3), 0.3); }
    else if (b < 97) { o.reach = Math.max(hit(tt, tb(93, 1), 0.16), hit(tt, tb(93, 3), 0.16)); o.y = 0.45 * bell(tt, tb(94, 1), 0.33) + 0.15 * (bell(tt, tb(95, 1), 0.2) + bell(tt, tb(95, 3), 0.2) + bell(tt, tb(96, 1), 0.2)); o.squat = 0.8 * bell(tt, tb(94, 3) + 0.15, 0.4);
      o.tilt = -(Math.PI / 2) * easeOut(seg(tt, bar(97) - 0.30, bar(97))); }                                                                                     // the dive starts just before b97 ...
    else if (b < 98) { o.tilt = -Math.PI / 2; o.arms = 0.3; }                                                                                                     // ... flat ON the downbeat, still through the bar
    else if (b < 100) { const up = sm(seg(tt, bar(98), tb(99, 1))); o.tilt = -(Math.PI / 2) * (1 - up); o.squat = 0.9 * bell(tt, tb(98, 3) + 0.15, 0.6); o.arms = 0.3 * (1 - up); }
    else if (b < 101) { o.arms = Math.min(1, 1 - hit(tt, bar(100), 0.07) + 0.0) * (tt >= bar(100) ? 1 : 0); o.arms = tt >= bar(100) ? 1 - Math.exp(-(tt - bar(100)) / 0.05) : 0; }       // arms straight out, held through the bar
    else if (b < 103) { o.squat = 0.45; o.reach = Math.max(hit(tt, tb(101, 1), 0.16), hit(tt, tb(101, 3), 0.16), hit(tt, tb(102, 1), 0.16), hit(tt, tb(102, 3), 0.25)); }
    else if (b < 104) { o.y = 1.0 * bell(tt, bar(103), 0.40); o.yaw = WEST + sm(seg(tt, bar(103) - 0.35, bar(103) + 0.35)) * Math.PI * 2; o.squat = 0.9 * bell(tt, tb(103, 3) + 0.1, 0.4); if (beat >= 2.5) o.yaw = WEST + Math.PI * sm(seg(tt, tb(103, 3) + 0.25, bar(104) - 0.08)); }
    else { o.yaw = EAST; o.reach = 1 - Math.exp(-Math.max(0, tt - bar(104)) / 0.05); }                                                                           // bao quan to the sun, held
    return o; }
  // fill the crowd. o: { cel, canon: seconds of delay per metre from the hero (0 = unison), solo: only the hero moves before b90 }
  function thousand(t, o = {}) { const L = layout(t); const cr = cast.crowd('thousand', N); const k = F.stageAt(t), n = t < bar(73) ? 0 : 1 << k; const lk = K.look(W.dawn(t)); const canon = o.canon ?? 0; const lanes = K.LANES8;
    const forkAge = t - K.bar(F.forkBar(k));
    for (let i = 0; i < n; i++) { const hero = i === 0; let tt = t; if (canon && !hero) tt = t - canon * Math.hypot(L[i * 2] - L[0], L[i * 2 + 1] - L[1]);
      const p = perf(tt, hero); const fresh = k > 0 && i >= n / 2 && forkAge < 0.5;      // a copy that has just stepped out glows for a moment
      const land = hero && t < bar(73) + 0.01 ? 0 : 0;
      cr.put(i, { pos: [L[i * 2], p.y + land, L[i * 2 + 1]], yaw: p.yaw, tilt: p.tilt, squat: p.squat, arms: p.arms, reach: p.reach, track: 'idle', time: t + i * 0.37, lane: hero ? 'main' : lanes[i % 7], density: lk.density * (fresh ? 1.6 : 1), solid: lk.solid, cel: o.cel ?? -1 }); }
    return n; }
  K.LANES8 = ['rose', 'gold', 'mint', 'cyan', 'magenta', 'blue', 'coral'];
  K.shared.thousand = thousand; K.shared.layout = layout;
  const boxA = W.frameBox(W.FORM[0] - 2, W.FORM[0] + 40, -20, 20, { margin: 1.03 }), boxB = W.frameBox(W.FORM[0] - 2, W.FORM[0] + 80, -37, 37, { margin: 1.03 }), boxR = W.frameBox(hx - 40, hx + 40, hz - 40, hz + 40, { margin: 1.03 });
  const lerpCam = (a, b, u) => ({ pos: [lerp(a.pos[0], b.pos[0], u), lerp(a.h, b.h, u), lerp(a.pos[2], b.pos[2], u)], target: [lerp(a.pos[0], b.pos[0], u) + 0.02 * lerp(a.h, b.h, u), 0, lerp(a.pos[2], b.pos[2], u)], fov: 35, topUp: [1, 0, 0], near: 1, far: 30000 });
  return { name: '08_build', t0, t1, frame(t) {
    const hud = (n) => K.hudMain(t, { count: n });
    return K.cut(t, [
      { t0, f: (tt, u) => { const n = thousand(t); const drop = 1.2 * (1 - easeOut(seg(t, t0 - 0.3, t0)));
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
