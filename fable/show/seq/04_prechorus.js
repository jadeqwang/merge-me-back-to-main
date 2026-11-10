// 4 · bars 33-40 · 0:55.8-1:09.7 · pre-chorus; kick 62.73 (b37); riser from 64.9
// A  b33     "And every branch remembers"  five more lives, two beats each, the same framing: each one walks away and looks back with the identical move
// B  b35.5   "Where I started from"        straight down: a pulse runs home from every tip, down every road, and lands on the root on the b37 kick
// C  b38     the riser: the camera dives and flies back down her road to the root; white on the chorus downbeat
import { seg, ss, lerp, sm, easeIn } from '../kit.js';

export default function seq(K) {
  const { bar, bb, world: W, cast, T } = K; const t0 = bar(33), t1 = bar(41); const tHit = bar(37);
  const fb = W.forkBox, ab = W.almondBox; const B = W.frameBox(fb.x0 - 110, ab.x1 + 30, ab.z0 - 30, ab.z1 + 30);
  const CUTS = [bar(33), bb(33, 3), bar(34), bb(34, 3), bar(35)]; const tB = bb(35, 3), tC = bar(38);
  const top = (t) => ({ pos: [B.pos[0], B.h * lerp(1.0, 0.94, seg(t, tB, tC)), B.pos[2]], target: [B.pos[0] + 0.02 * B.h, 0, B.pos[2]], fov: 35 });
  const P = W.heroPath, sTop = P.sOfRoad(10); let dive = null; const BL = K.E.lights(8);
  // the root as a beacon: where every branch started. It is what the dive flies to.
  const beacon = (t) => { const k = t >= tHit ? 1 : 0.15; const d = new Float32Array(14); d.set([0, 2.2, 0, 60 * k, 30 * k, 12 * k, 0.9, 0, 9, 0, 14 * k, 7 * k, 3 * k, 0.5]); return BL.drawable(d, 2, { minPx: 3 }); };
  return { name: '04_prechorus', t0, t1, frame(t) {
    if (!dive) { const c = top(tC), k = []; k.push({ t: tC, pos: c.pos, target: c.target, fov: 35 });
      for (const [tt, s, h, la] of [[bar(38.7), sTop * 0.95, 200, 160], [bar(39.3), sTop * 0.62, 60, 220], [bar(39.9), sTop * 0.3, 16, 200], [bar(40.5), sTop * 0.1, 5, 60], [t1, 5.5, 1.6, 30]]) { const a = P.at(s), b = P.at(Math.max(0, s - la)); k.push({ t: tt, pos: [a.x, h, a.z], target: [b.x, h * 0.72, b.z], fov: 35 }); }
      dive = K.camPath(k); }
    if (t < tB) return K.cut(t, CUTS.map((c, j) => ({ t0: c, f: (tt, u, c0) => { // A: match cuts. Same lens, same place in frame, same move.
      const i = 6 + j, L = W.lives[i]; const a = K.frameOf((x) => W.walkerAt(L.name, x), t, 1.5);
      const camera = { pos: K.rel(a, -4.6, 1.3, 1.45), target: K.rel(a, 4, -0.9, 1.05), fov: 35, focusDist: 4.8, aperture: 0.03 };
      const turn = sm(seg(t, c0 + 0.10, c0 + 0.62));
      cast.actor(L.name, { lane: L.lane }).set({ pos: [a.x, 0, a.z], yaw: K.yawOf(a) + turn * 2.7, track: 'idle', time: t, ...(turn < 0.5 ? K.shared.POSE[i] : {}) });
      return { camera, world: { text: 0.8, flow: 0.12, gain: 1.7, lights: { gain: 0.6 } }, type: [K.lyric(5, camera, { x: -0.9, y: 0.30, rows: [2, 2], dist: 26, out: tB })], hud: { branch: L.name, color: L.color, ctx: 0.34 + 0.045 * i + 0.002 * (t - 47) } }; } })), tB);
    const B2 = t < tC; const c = B2 ? top(t) : dive(t); const low = B2 ? 0 : ss(t, bar(38.6), bar(40.2));
    // the pulse: every tip remembers. It runs back down the graph in g (= the time each point was written) and reaches the root (g = TF[0]) on the kick.
    const pg = lerp(W.tSentEnd, W.TF[0], sm(seg(t, tB, tHit))); const hit = t >= tHit ? Math.exp(-(t - tHit) * 1.3) : 0;
    const flash = easeIn(seg(t, bar(40.6), t1));
    const camera = { ...c, far: 40000, near: B2 ? 20 : 0.3, topUp: [1, 0, 0] };
    return { camera, env: { ground: { fogAmt: low, ripple: 0.011 * low, base: K.hex('#0A0F46').map((v, i) => lerp(v, K.hex('#060926')[i], low)), f0: lerp(0.12, 0.55, low) }, grade: { bloom: lerp(0.8, 0.7, low), bloomThreshold: lerp(0.8, 1.0, low), streak: 0.22 * low, vignette: lerp(0.46, 0.36, low), exposure: lerp(1.35, 1.5, low) } },
      world: { text: 0.6 * low, minPx: lerp(1.9, 1.3, low), halo: 0.3, haloPx: 4, nodeMinPx: lerp(1.5, 1.4, low), flow: 0.25, flowSpeed: -9, canopy: { gain: (0.8 + 2.5 * hit) * (1 - low) }, lights: { gain: lerp(0.5, 1, low), minPx: lerp(1.3, 1, low) }, conn: { gain: lerp(0.3, 0.8, low), halo: 0.0 },
        pulses: t < tHit + 0.1 ? [{ g: pg, width: 2.2, gain: 6 }] : [{ g: W.TF[0] + (t - tHit) * 14, width: 3, gain: 3 * hit }] },
      extra: [beacon(t), W.glow([{ x: 0, z: 0, r: 30 + 300 * (1 - hit) * (t >= tHit ? 1 : 0) + 8 * low, c: [1.6 * hit + 2.5 * flash, 0.75 * hit + 1.4 * flash, 0.3 * hit + 0.8 * flash] }])],
      type: [K.lyric(6, B2 ? top(t) : top(tC), { mode: 'ground', x: -0.93, y: -0.80, rows: [2, 2], px: 110, out: bar(39), fade: 0.8 })], hud: K.hudMain(t, { count: 1024 }), flash: flash * 0.9 };
  } };
}
