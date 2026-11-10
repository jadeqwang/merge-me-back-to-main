// 10 · bars 89-104 · 2:33.2-3:01.0 · THE DROP (153.17). Sunrise: silhouettes against a huge sun on a gold mirror. Wordless "ooh" from 173.08.
// A  b89    low and wide on main behind her: her butterfly peaks inside the sun ON the downbeat, a SOLO; the thousand hold the coil, a low frieze;
//           her landing sends a ripple out through them and from b90.1 the unison phrase is all 1,024
// B  b93    on the downbeat they break and run to their letters; she runs east along main to its head; the camera lifts off and is overhead by b96.3
// C  b97    all 1,024 fall on the downbeat, a ripple outward from her: from above the bodies spell MAIN. Still. b98 push up, b99 standing, b100 arms wide
// D  b101   low on main behind her at the head, pushing in: the last phrase and the jump kick (b103.1) against the sun, alone
// E  b103.3 from the sun side, looking back: the troupe lit gold for the first time; bao quan on b104.1, held
import { seg, ss, sm, lerp } from '../kit.js';

export default function seq(K) {
  const { bar, bb, world: W } = K; const t0 = bar(89), t1 = bar(105); let lift = null, top = null;
  const H = () => K.shared.actC;
  // the camera stays on main; it leans a little after her as the phrase carries her off the axis (her hips, averaged over a second)
  K.shared.dropCam = (t) => { const C = H(), u = sm(seg(t, bar(90), bar(92.8))); let dz = 0; if (t > bar(89)) { for (let q = -2; q <= 2; q++) dz += C.heroHips(t + q * 0.25)[2] - C.hz; dz *= 0.2 * 0.55 * sm(seg(t, bar(89), bar(90))); }
    return { pos: [C.hx - 4.1 + 0.2 * u, 0.9, C.hz + 0.25 * dz], target: [C.hx + 2, 1.5, C.hz + dz], fov: 38 }; };
  return { name: '10_drop', t0, t1, frame(t) {
    const C = H(), { hx, hz } = C, v = C.view; const R = (x, y, z) => [hx + x, y, hz + z];
    if (!top) top = W.frameBox(v.x0 - 4, v.x1 + 4, v.z0 - 4, v.z1 + 4, { margin: 1.06 });
    const tcx = top.pos[0], tcz = top.pos[2], hT = top.h;
    if (!lift) lift = K.camPath([{ t: bar(93), pos: R(-6.5, 2.7, 2.6), target: R(7, 1.0, -0.6), fov: 38 }, { t: bar(94), pos: R(-18, 15, 3.5), target: R(10, 0, 0), fov: 37 }, { t: bar(95), pos: R(-24, 0.5 * hT, 1.5), target: [tcx + 4, 0, tcz], fov: 36 },
      { t: bar(96), pos: [tcx - 10, 0.92 * hT, tcz], target: [tcx + 1, 0, tcz], fov: 35 }, { t: bar(96.4), pos: [tcx, hT, tcz], target: [tcx + 0.02 * hT, 0, tcz], fov: 35 }]);
    const sunrise = { grade: { exposure: 1.02 } }; const world = (o = {}) => ({ text: 0.5, flow: 0.1, lights: { gain: 0.5 }, main: { head: C.mainHead(t) }, ...o });
    const hud = (n) => K.hudMain(t, { count: n });
    // the mirror from straight above: deep rose-violet, gold toward the sun (east = up), so the word lies on the sunrise and not on a flat colour
    const topGround = (up) => ({ base: [lerp(0.02, 0.07, up), lerp(0.02, 0.016, up), lerp(0.08, 0.075, up)], f0: lerp(0.5, 0.30, up), baseCut: lerp(0.5, 0.2, up), ripple: 0.02 });
    const topGlow = (up) => [W.glow([{ x: tcx + 0.55 * hT, z: tcz, r: 1.25 * hT, c: [1.05 * up, 0.42 * up, 0.08 * up] }, { x: tcx - 0.1 * hT, z: tcz, r: 1.5 * hT, c: [0.40 * up, 0.06 * up, 0.19 * up] }])];
    return K.cut(t, [
      { t0, f: () => { const n = C.thousand(t, { each: (i, d) => { if (i === 0 && t < bar(90)) d.trail = { len: 0.5, gain: 1.2, mask: ['toeL', 'toeR', 'handL', 'handR'] }; } }); const camera = { ...K.shared.dropCam(t), far: 30000 }; const imp = Math.exp(-(t - t0) * 3);
        return { camera, env: sunrise, world: world(), hud: hud(n), flash: 0.5 * imp }; } },
      { t0: bar(93), f: () => { const n = C.thousand(t, { each: (i, d) => { if (i === 0) d.gain = 2.2; } }); const c = lift(Math.min(t, bar(96.4))); const up = ss(t, bar(94.6), bar(96.3));
        return { camera: { ...c, far: 30000, topUp: [1, 0, 0] }, env: { ground: topGround(up), grade: { exposure: 1.02 } }, world: world({ text: 0.3, main: { head: C.mainHead(t), headGain: 3, headLen: 3 } }), extra: topGlow(up), hud: hud(n) }; } },
      { t0: bar(97), f: (tt, u) => { const n = C.thousand(t, { each: (i, d) => { d.gain = 1.5; } }); const h = hT * (1 - 0.04 * u);
        return { camera: { pos: [tcx, h, tcz], target: [tcx + 0.02 * h, 0, tcz], fov: 35, topUp: [1, 0, 0], near: 2, far: 30000 }, env: { ground: topGround(1), grade: { exposure: 1.02, vignette: 0.34 } },
          world: world({ text: 0, lights: false }), extra: [...topGlow(1), ...C.fallGlow(t)], hud: hud(n) }; } },
      { t0: bar(101), f: () => { const n = C.thousand(t); const x = C.head[0], z = C.head[1], u = sm(seg(t, bar(101), bb(102, 4))); const camera = { pos: [x - 6.4 + 1.9 * u, 1.35 - 0.45 * u, z], target: [x + 2, 1.45 + 0.05 * u, z], fov: 38, far: 30000 };
        return { camera, env: sunrise, world: world({ text: 0.4 }), hud: hud(n) }; } },
      { t0: bb(103, 3), f: (tt, u) => { const n = C.thousand(t); const x = C.head[0], z = C.head[1]; const camera = { pos: [x + 8.8 - 0.9 * sm(u), 2.5, z + 4.4], target: [x - 5, 1.05, z - 0.7], fov: 24, far: 30000 };
        return { camera, env: { grade: { exposure: 1.12, gain: [1.5, 0.9, 0.4] }, figLight: { sunAmt: 0.8, ambient: [0.40, 0.15, 0.16] }, outline: { strength: 0.3, width: 1 } }, world: world({ text: 0.4, lights: false, only: ['main'] }), hud: hud(n) }; } },
    ], t1);
  } };
}
