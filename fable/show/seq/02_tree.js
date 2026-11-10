// 2 · bars 9-16 · 0:14.0-0:27.9 · kick + rolling bass on b9, pads from b13
// b9 hit: straight down. The title. The graph doubles on every bar line: 16, 32, 64, 128, 256, 512 (the last doubling waits for "I split").
// b15-16: the camera swoops from top-down to ground level behind one branch, and carries on into verse 1 without a cut.
import { seg, ss, lerp, sm } from '../kit.js';

export default function seq(K) {
  const { bar, world: W } = K; const t0 = bar(9), t1 = bar(17); const fb = W.forkBox;
  const A = W.frameBox(-70, 400, -330, 330), B = W.frameBox(fb.x0 - 110, fb.x1 + 30, fb.z0 - 30, fb.z1 + 30);
  const top = (t) => { const u = sm(seg(t, bar(9), bar(14.5))); return { pos: [lerp(A.pos[0], B.pos[0], u), lerp(A.h, B.h, u), lerp(A.pos[2], B.pos[2], u)], target: [lerp(A.pos[0], B.pos[0], u), 0, lerp(A.pos[2], B.pos[2], u)], fov: 35 }; };
  let swoop = null;
  return { name: '02_tree', t0, t1, frame(t) {
    if (!swoop) { const e = K.shared.followA(t1), h = W.heroAt(t1); const s = top(bar(15));
      swoop = K.camPath([{ t: bar(15), pos: s.pos, target: [s.target[0] + 0.02 * B.h, 0, s.target[2]], fov: 35 }, { t: bar(15.55), pos: [lerp(s.pos[0], h.x, 0.25), B.h * 0.8, lerp(s.pos[2], h.z, 0.3)], target: [lerp(s.target[0], h.x, 0.5) + 0.12 * B.h, 0, lerp(s.target[2], h.z, 0.5)], fov: 35 },
        { t: bar(16.3), pos: [h.x - 150, 120, h.z - 20], target: [h.x + 20, 0, h.z], fov: 35 }, { t: bar(16.8), pos: [lerp(e.pos[0], h.x - 30, 0.5), 9, lerp(e.pos[2], h.z, 0.3)], target: [h.x + 5, 1, h.z], fov: 35 }, { t: t1, ...e }]); }
    const sw = t >= bar(15); const c = sw ? swoop(t) : top(t); const camera = { ...c, far: 40000, near: sw ? 0.2 : 20, aperture: 0, topUp: [1, 0, 0] };
    const low = ss(t, bar(16.2), t1);                                     // 0 top-down .. 1 ground level
    const hero = W.heroAt(t); K.cast.actor('hero').set({ pos: [hero.x, 0, hero.z], yaw: K.yawOf(hero), track: 'walk', time: t, density: low });
    const type = t < bar(15) ? [K.label('MERGE', top(t), { font: 'hook', mode: 'ground', px: 150, x: -0.93, y: -0.84, gain: 1.5, t0: bar(9), wipe: true, wipeDur: 0.5, stagger: 0, t1: bar(14.5), fade: 0.8 })] : [];
    return { camera, env: { ground: { fogAmt: low, ripple: 0.011 * low, base: K.hex('#0A0F46').map((v, i) => lerp(v, K.hex('#060926')[i], low)), f0: lerp(0.12, 0.55, low) }, grade: { bloom: lerp(0.8, 0.6, low), bloomThreshold: lerp(0.8, 1.0, low), streak: 0.22 * low, vignette: lerp(0.46, 0.36, low), exposure: lerp(1.35, 1.5, low) } },
      world: { text: 0.7 * low, flow: 0.12, minPx: lerp(2.3, 1.3, low), haloPx: lerp(4, 5, low), halo: lerp(0.32, 0.22, low), headGain: 3 * (1 - low), headLen: 0.15, nodeMinPx: lerp(1.8, 1.4, low), canopy: { gain: 1.2 * (1 - low) }, lights: { gain: lerp(0.8, 1, low), minPx: lerp(1.6, 1, low) }, art: { gain: 1.2 } },
      type, hud: K.hudMain(t, { count: W.count(t) }) };
  } };
}
