// 4 · bars 33-40 · 0:55.8-1:09.7 · pre-chorus; kick 62.73 (b37); riser from 64.9
// A  b33     "And every branch remembers"  jade/home, one bar: she traces the earth's orbit for the kids, and ON "remembers" (57.03) begins to look back.
//    b34.1   the roll call, one beat each, the frame anchored on her head, the SAME look-back continuing through every cut (one shared clock):
//            sandstorm, wushu, nasa, poet, violin, piano: back through her lives to the piano bench, then to the root
// B  b35.3   "Where I started from"        straight down: a pulse runs home from every tip, down every road, and lands on the root on the b37 kick
// C  b38     the riser: the camera dives and flies back down her road to the root, which answers: rings spread from it on every beat, its light grows; white on b41
import { seg, ss, lerp, sm, easeIn } from '../kit.js';

export default function seq(K) {
  const { bar, bb, world: W, cast, T, E } = K; const t0 = bar(33), t1 = bar(41); const tHit = bar(37);
  const fb = W.forkBox, ab = W.almondBox; const B = W.frameBox(fb.x0 - 110, ab.x1 + 30, ab.z0 - 30, ab.z1 + 30);
  const tR = bar(34), tB = bb(35, 3), tC = bar(38), beat = 60 / 138, ROLL = [9, 7, 5, 4, 1, 0];          // sandstorm, wushu, nasa, poet, violin, piano
  const top = (t) => ({ pos: [B.pos[0], B.h * lerp(1.0, 0.94, seg(t, tB, tC)), B.pos[2]], target: [B.pos[0] + 0.02 * B.h, 0, B.pos[2]], fov: 35 });
  const P = W.heroPath, sTop = P.sOfRoad(10); let dive = null; const BL = E.lights(8), props = K.shared.props;
  // the root: where every branch started, and what the dive flies to. A light that grows through the riser, and rings that leave it on every beat.
  const beacon = (t) => { const k = t >= tHit ? 1 + 2.2 * easeIn(seg(t, tC, t1)) : 0.15; const d = new Float32Array(14); d.set([0, 2.2, 0, 60 * k, 30 * k, 12 * k, 0.9 + 0.5 * (k - 1), 0, 9, 0, 14 * k, 7 * k, 3 * k, 0.5]); return BL.drawable(d, 2, { minPx: 3, air: 1e6 }); };
  const rings = (t) => { const b = props.begin(), c = [1, 0.62, 0.3]; if (t < tHit) return null; const n0 = Math.floor((t - tHit) / beat);
    for (let k = Math.max(0, n0 - 9); k <= n0; k++) { const age = t - (tHit + k * beat), r = 3 + 62 * age + 9 * age * age, g = Math.exp(-age * 0.55) * (k === 0 ? 2.2 : 0.5 + 1.2 * seg(t, tC, t1)); const pts = [], N = 96; for (let i = 0; i < N; i++) { const a = (i / N) * 6.2832; pts.push([r * Math.cos(a), 0.03, r * Math.sin(a)]); }
      props.poly(b, pts, c, 0.05 + 0.004 * r, g, true); }
    return props.drawable(b, { gain: 1.4, minPx: 1.6, haloPx: 6, halo: 0.3, reflect: false }); };
  const LY = { x: -0.9, y: 0.3, dist: 26 };
  return { name: '04_prechorus', t0, t1, frame(t) {
    if (!dive) { const c = top(tC), k = []; k.push({ t: tC, pos: c.pos, target: c.target, fov: 35 });
      for (const [tt, s, h] of [[bar(38.7), sTop * 0.95, 210], [bar(39.4), sTop * 0.66, 120], [bar(40.0), sTop * 0.36, 50], [bar(40.6), sTop * 0.1, 10], [t1, 5.5, 1.6]]) { const a = P.at(s); k.push({ t: tt, pos: [a.x, h, a.z], target: [0, 2 + h * 0.05, 0], fov: 35 }); }       // always looking at the root
      dive = K.camPath(k); }
    if (t < tB) { // A: home, then the roll call. One clock for all of them: the look-back (life_* t = 4.5) begins on "remembers".
      const time = K.shared.lifeClock(t); let F;
      if (t < tR) F = K.shared.lifeShot(10, t, { time, u: seg(t, t0, tR) });
      else { const k = Math.min(ROLL.length - 1, Math.floor((t - tR) / beat + 1e-6)); F = K.shared.lifeShot(ROLL[k], t, { time, head: true, u: seg(t, tR, tB) }); }
      F.type = [K.lyric(5, F.camera, { ...LY, rows: [2, 2], reflGain: 0 }), K.lyric(6, F.camera, { ...LY, rows: [2, 2], reflGain: 0 })];
      return F; }
    const B2 = t < tC; const c = B2 ? top(t) : dive(t); const low = B2 ? 0 : ss(t, bar(39.6), bar(40.8));
    // the pulse: every tip remembers. It runs back down the graph in g (= the time each point was written) and reaches the root (g = TF[0]) on the kick.
    const pg = lerp(W.tSentEnd, W.TF[0], sm(seg(t, tB, tHit))); const hit = t >= tHit ? Math.exp(-(t - tHit) * 1.3) : 0;
    const flash = easeIn(seg(t, bar(40.6), t1)), grow = easeIn(seg(t, tC, t1));
    const camera = { ...c, far: 40000, near: B2 ? 20 : 0.3, topUp: [1, 0, 0] }; const rg = rings(t);
    return { camera, env: { ground: { fogAmt: low, ripple: 0.011 * low, base: K.hex('#0A0F46').map((v, i) => lerp(v, K.hex('#060926')[i], low)), f0: lerp(0.12, 0.55, low) }, grade: { bloom: lerp(0.8, 0.7, low), bloomThreshold: lerp(0.8, 1.0, low), streak: 0.22 * low, vignette: lerp(0.46, 0.36, low), exposure: lerp(1.35, 1.5, low) } },
      world: { text: 0.6 * low, minPx: lerp(1.9, 1.3, low), halo: 0.3, haloPx: 4, nodeMinPx: lerp(1.5, 1.4, low), flow: 0.25, flowSpeed: -9, canopy: { gain: (0.8 + 2.5 * hit) * (1 - 0.6 * low) }, lights: { gain: lerp(0.5, 1, low), minPx: lerp(1.3, 1, low) }, conn: { gain: lerp(0.3, 0.8, low), halo: 0.0 },
        pulses: t < tHit + 0.1 ? [{ g: pg, width: 2.2, gain: 6 }] : [{ g: W.TF[0] + (t - tHit) * 14, width: 3, gain: 3 * hit }] },
      extra: [beacon(t), ...(rg ? [rg] : []), W.glow([{ x: 0, z: 0, r: 30 + 300 * (1 - hit) * (t >= tHit ? 1 : 0) + 8 * low + 40 * grow, c: [1.6 * hit + 0.5 * grow + 2.5 * flash, 0.75 * hit + 0.26 * grow + 1.4 * flash, 0.3 * hit + 0.1 * grow + 0.8 * flash] }])],
      type: [K.lyric(6, B2 ? top(t) : top(tC), { mode: 'ground', x: -0.93, y: -0.80, rows: [2, 2], px: 110, out: bar(39), fade: 0.8 })], hud: K.hudMain(t, { count: 1024 }), flash: flash * 0.9 };
  } };
}
