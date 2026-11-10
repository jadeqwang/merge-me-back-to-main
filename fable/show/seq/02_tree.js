// 2 · bars 9-16 · 0:14.0-0:27.9 · kick + rolling bass on b9, pads from b13
// b9 hit: straight down. The title. The graph doubles on every bar line: 16, 32, 64, 128, 256 (b13). A large live counter (lower right) says so.
// The last two doublings wait for the verse: 512 on "split", 1,024 on "thousand" (seq 3 keeps the counter up until then).
// b15-16: the camera swoops from top-down to ground level behind one branch, and carries on into verse 1 without a cut.
import { seg, ss, lerp, sm } from '../kit.js';

export default function seq(K) {
  const { bar, world: W } = K; const t0 = bar(9), t1 = bar(17); const fb = W.forkBox;
  const A = W.frameBox(-70, 400, -330, 330), B = W.frameBox(fb.x0 - 110, fb.x1 + 30, fb.z0 - 30, fb.z1 + 30);
  const top = (t) => { const u = sm(seg(t, bar(9), bar(14.5))); return { pos: [lerp(A.pos[0], B.pos[0], u), lerp(A.h, B.h, u), lerp(A.pos[2], B.pos[2], u)], target: [lerp(A.pos[0], B.pos[0], u), 0, lerp(A.pos[2], B.pos[2], u)], fov: 35 }; };
  let swoop = null;
  // The live counter: JetBrains Mono, cap height 70 px at 1080p, lower right. It changes exactly when the tree's tips double (W.TF), with a small roll and flash.
  K.shared.counter = (t, alpha = 1) => (g, Wd, Hd) => { if (alpha <= 0.01) return; const s = Hd / 1080, n = W.count(t); let tc = -1e9; for (const q of W.TF) if (q <= t && q > tc) tc = q;
    const dt = t - tc, roll = 1 - Math.min(1, dt / 0.16), fl = Math.exp(-Math.max(0, dt) * 4), x = Wd - 70 * s, y0 = Hd - 62 * s;
    g.save(); g.textAlign = 'right'; g.textBaseline = 'alphabetic'; g.shadowColor = 'rgba(5,6,26,0.75)'; g.shadowBlur = 16 * s;
    g.font = `500 ${34 * s}px "JetBrains Mono"`; g.fillStyle = `rgba(255,241,214,${0.62 * alpha})`; g.fillText('branches', x, y0);
    g.font = `600 ${96 * s}px "JetBrains Mono"`; g.fillStyle = `rgba(255,${Math.round(241 - 30 * fl)},${Math.round(214 - 90 * fl)},${0.95 * (1 - 0.6 * roll) * alpha})`; g.fillText(n.toLocaleString('en-US'), x + 4 * s, y0 - 50 * s + roll * roll * 22 * s); g.restore(); };
  return { name: '02_tree', t0, t1, frame(t) {
    if (!swoop) { const e = K.shared.followA(t1), h = W.heroAt(t1); const s = top(bar(15));
      swoop = K.camPath([{ t: bar(15), pos: s.pos, target: [s.target[0] + 0.02 * B.h, 0, s.target[2]], fov: 35 }, { t: bar(15.55), pos: [lerp(s.pos[0], h.x, 0.25), B.h * 0.8, lerp(s.pos[2], h.z, 0.3)], target: [lerp(s.target[0], h.x, 0.5) + 0.12 * B.h, 0, lerp(s.target[2], h.z, 0.5)], fov: 35 },
        { t: bar(16.25), pos: [h.x - 175, 92, h.z - 26], target: [h.x - 48, 0, h.z - 2], fov: 35 }, { t: bar(16.7), pos: [h.x - 19, 7, h.z - 4], target: [h.x + 2, 1, h.z], fov: 35 }, { t: t1, ...e }]); }
    const sw = t >= bar(15); const c = sw ? swoop(t) : top(t); const camera = { ...c, far: 40000, near: sw ? 0.2 : 20, aperture: 0, topUp: [1, 0, 0] };
    const low = ss(t, bar(16.05), bar(16.85));                                     // 0 top-down .. 1 ground level
    const hero = W.heroAt(t); if (low > 0.002) K.cast.actor('hero').set({ pos: [hero.x, 0, hero.z], yaw: K.yawOf(hero), ...K.shared.heroRun(t), alpha: low, vary: 0 });
    const type = t < bar(15) ? [K.label('MERGE', top(t), { font: 'hook', mode: 'ground', px: 150, x: -0.93, y: -0.84, gain: 1.5, t0: bar(9), wipe: true, wipeDur: 0.5, stagger: 0, t1: bar(14.5), fade: 0.8 })] : [];
    return { camera, env: { ground: { fogAmt: low, ripple: 0.011 * low, base: K.hex('#0A0F46').map((v, i) => lerp(v, K.hex('#060926')[i], low)), f0: lerp(0.12, 0.55, low) }, grade: { bloom: lerp(0.8, 0.6, low), bloomThreshold: lerp(0.8, 1.0, low), streak: 0.22 * low, vignette: lerp(0.46, 0.36, low), exposure: lerp(1.35, 1.5, low) } },
      world: { text: 0.7 * low, flow: 0.12, minPx: lerp(2.3, 1.3, low), haloPx: lerp(4, 5, low), halo: lerp(0.32, 0.22, low), headGain: 3 * (1 - low), headLen: 0.15, nodeMinPx: lerp(1.8, 1.4, low), canopy: { gain: 1.2 * (1 - low) }, lights: { gain: lerp(0.8, 0.7, low), minPx: lerp(1.6, 1, low), clear: low > 0.3 ? [[hero.x, hero.z, 14]] : [] }, art: { gain: 1.2 } },
      type, hud: K.hudMain(t), overlay: K.shared.counter(t) };
  } };
}
