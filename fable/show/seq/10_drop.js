// 10 · bars 89-104 · 2:33.2-3:01.0 · THE DROP (153.17). Sunrise: silhouettes against a huge sun on a gold mirror. Wordless "ooh" from 173.08.
// A  b89   low and wide in the clearing: her butterfly kick peaks ON the downbeat as the sun breaks; b90-92 the unison phrase, the thousand behind her
// B  b93   the camera lifts off, circling, as they travel into new places (canon), and is straight overhead by b97 ...
// C  b97   ... when all 1,024 fall flat on the downbeat and lie still: from above the bodies spell MAIN. b98 they push up.
// D  b99   ground level, long line against the sun: standing by b99.1; b100.1 arms straight out, held (the "ooh" comes in)
// E  b101  behind her: last phrase, the jump on b103.1; they turn to the sun; b104.1 bao quan salute, held to the bar line
import { seg, ss, sm, lerp } from '../kit.js';

export default function seq(K) {
  const { bar, bb, world: W } = K; const t0 = bar(89), t1 = bar(105); let lift = null;
  K.shared.dropCam = (t) => { const F = K.shared.F, hx = F.hero10[0], hz = F.hero10[1]; const u = seg(t, t0, bar(93)); return { pos: [hx - 6.6 + 0.5 * u, 0.5 + 0.1 * u, hz + 1.05], target: [hx + 2, 1.55, hz - 0.2], fov: 38 }; };
  return { name: '10_drop', t0, t1, frame(t) {
    const F = K.shared.F, hx = F.hero10[0], hz = F.hero10[1], mb = F.mainBox, L = K.shared.layout(t); const mcx = (mb.x0 + mb.x1) / 2 + 0.4, mcz = (mb.z0 + mb.z1) / 2;
    const top = W.frameBox(mb.x0 - 5, mb.x1 + 5, mb.z0 - 5, mb.z1 + 5, { margin: 1.1 });
    if (!lift) lift = K.camPath([{ t: bar(93), pos: [hx - 26, 4.5, hz + 16], target: [hx + 6, 1.2, hz], fov: 36 }, { t: bar(94.5), pos: [mcx - 78, 34, mcz + 38], target: [mcx, 0, mcz], fov: 36 }, { t: bar(96), pos: [mcx - 40, top.h * 0.9, mcz + 8], target: [mcx + 2, 0, mcz], fov: 35 }, { t: bb(96, 4), pos: [mcx, top.h, mcz], target: [mcx + 0.02 * top.h, 0, mcz], fov: 35 }]);
    const sunrise = { grade: { exposure: 1.02 } };
    return K.cut(t, [
      { t0, f: () => { const n = K.shared.thousand(t); const camera = { ...K.shared.dropCam(t), far: 30000 }; const imp = Math.exp(-(t - t0) * 3);
        return { camera, env: sunrise, world: { text: 0.5, flow: 0.1, lights: { gain: 0.5 } }, hud: K.hudMain(t, { count: n }), flash: 0.6 * imp }; } },
      { t0: bar(93), f: () => { const n = K.shared.thousand(t, { canon: 0.012, cel: lerp(0, 0.9, ss(t, bar(95), bar(96.5))) }); const c = lift(Math.min(t, bb(96, 4))); const up = ss(t, bar(95), bb(96, 4));
        return { camera: { ...c, far: 30000, topUp: [1, 0, 0] }, env: { ground: { base: [lerp(0.02, 0.62, up), lerp(0.02, 0.26, up), lerp(0.08, 0.2, up)], f0: lerp(0.5, 0.1, up), baseCut: lerp(0.5, 0.2, up) }, grade: { exposure: 1.02 } }, world: { text: 0.3, flow: 0.1, lights: { gain: 0.4 } }, hud: K.hudMain(t, { count: n }) }; } },
      { t0: bar(97), f: (tt, u) => { const n = K.shared.thousand(t, { cel: 0.9 }); const h = top.h * (1 - 0.05 * u);
        return { camera: { pos: [mcx, h, mcz], target: [mcx + 0.02 * h, 0, mcz], fov: 35, topUp: [1, 0, 0], near: 2, far: 30000 }, env: { ground: { base: [0.62, 0.26, 0.2], f0: 0.1, baseCut: 0.2, ripple: 0.02 }, grade: { exposure: 1.02, vignette: 0.34 } }, world: { text: 0, flow: 0.1, lights: false }, hud: K.hudMain(t, { count: n }) }; } },
      { t0: bar(99), f: (tt, u) => { const n = K.shared.thousand(t); const camera = { pos: [L[0] - 6.4 + 0.7 * u, 0.5, L[1] + 1.2], target: [L[0] + 6, 2.0, L[1] - 0.4], fov: 44, far: 30000 };
        return { camera, env: sunrise, world: { text: 0.3, flow: 0.1, lights: { gain: 0.4 } }, hud: K.hudMain(t, { count: n }) }; } },
      { t0: bar(101), f: (tt, u) => { const n = K.shared.thousand(t); const x = L[0], z = L[1]; const camera = { pos: [x - 7.4 + 0.8 * u, 1.0 + 0.55 * sm(u), z + 1.7], target: [x + 5, 1.6, z - 0.5], fov: 37, far: 30000 };
        return { camera, env: sunrise, world: { text: 0.4, flow: 0.1, lights: { gain: 0.4 } }, hud: K.hudMain(t, { count: n }) }; } },
    ], t1);
  } };
}
