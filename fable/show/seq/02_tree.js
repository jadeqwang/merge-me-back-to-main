// 2 · bars 9-16 · 0:14.0-0:27.9 · kick + rolling bass on b9, pads from b13
// b9 hit: straight down. The title. The graph doubles on every bar line: 16, 32, 64, 128, 256 (b13). A large live counter (lower right) says so.
// The last two doublings wait for the verse: 512 on "split", 1,024 on "thousand" (seq 3 keeps the counter up until then).
// b15-16: the camera swoops from top-down to ground level behind one branch, and carries on into verse 1 without a cut.
import { seg, ss, lerp, sm } from '../kit.js';

export default function seq(K) {
  const { bar, world: W } = K; const t0 = bar(9), t1 = bar(17); const fb = W.forkBox;
  const A = W.frameBox(-70, 400, -330, 330), B = W.frameBox(fb.x0 - 110, fb.x1 + 30, fb.z0 - 30, fb.z1 + 30);
  const top = (t) => { const u = sm(seg(t, bar(9), bar(14.5))); return { pos: [lerp(A.pos[0], B.pos[0], u), lerp(A.h, B.h, u), lerp(A.pos[2], B.pos[2], u)], target: [lerp(A.pos[0], B.pos[0], u), 0, lerp(A.pos[2], B.pos[2], u)], fov: 35 }; };
  // The live counter: JetBrains Mono, cap height 70 px at 1080p, lower right. It changes exactly when the tree's tips double (W.TF), with a small roll and flash.
  // o.top = 1: upper right, in the sky, the number on the baseline of a lyric row at NDC y 0.6 (seq 3: the lower right is road and runners there)
  K.shared.counter = (t, alpha = 1, o = {}) => (g, Wd, Hd) => { if (alpha <= 0.01) return; const s = Hd / 1080, n = W.count(t); let tc = -1e9; for (const q of W.TF) if (q <= t && q > tc) tc = q;
    const dt = t - tc, roll = 1 - Math.min(1, dt / 0.16), fl = Math.exp(-Math.max(0, dt) * 4), x = Wd - 70 * s, y0 = o.top ? 266 * s : Hd - 62 * s;
    g.save(); g.textAlign = 'right'; g.textBaseline = 'alphabetic'; g.shadowColor = 'rgba(5,6,26,0.75)'; g.shadowBlur = 16 * s;
    g.font = `500 ${34 * s}px "JetBrains Mono"`; g.fillStyle = `rgba(255,241,214,${0.62 * alpha})`; g.fillText('branches', x, y0);
    g.font = `600 ${96 * s}px "JetBrains Mono"`; g.fillStyle = `rgba(255,${Math.round(241 - 30 * fl)},${Math.round(214 - 90 * fl)},${0.95 * (1 - 0.6 * roll) * alpha})`; g.fillText(n.toLocaleString('en-US'), x + 4 * s, y0 - 50 * s + roll * roll * 22 * s); g.restore(); };
  const FALL = [K.bb(15, 4), K.bb(16, 1), K.bb(16, 2), K.bb(16, 3)];                 // the beats of the fall (25.778, 26.213, 26.648, 27.083)
  return { name: '02_tree', t0, t1, frame(t) {
    // r2 (NOTES_v2): the fall is ONE move with her tip held in the middle of the frame: the gaze slides from the tree to her tip, the distance to it falls
    // log-uniformly (1,540 m -> 10 m: a power of ten every 1.4 s), the view tilts from straight down to seq 3's low camera behind her. At the end it IS that
    // camera (K.shared.followA(t)), so there is no cut and no jump. A pool of her lane's light of constant screen size marks the tip until she is a body.
    const sw = t >= bar(15), s0 = top(t), u = seg(t, bar(15), 27.5), w = sm(u);              // down by 27.5: she is a body from 26.8, the camera is seq 3's for the last half second
    let c = s0, dCam = 1e4;
    if (sw) { const e = K.shared.followA(t), o1 = [0, 1, 2].map((i) => e.pos[i] - e.target[i]), d1 = Math.hypot(...o1), n1 = o1.map((v) => v / d1), d0 = s0.pos[1];
      const wT = sm(seg(u, 0, 0.42)), tg = [0, 1, 2].map((i) => lerp(s0.target[i], e.target[i], wT)), d = Math.exp(lerp(Math.log(d0), Math.log(d1), w));
      const th = Math.acos(Math.min(1, n1[1])) * sm(seg(u, 0.04, 0.86)), hl = Math.hypot(n1[0], n1[2]) || 1, n = [(n1[0] / hl) * Math.sin(th), Math.cos(th), (n1[2] / hl) * Math.sin(th)];       // from straight up, tilting back toward where seq 3's camera sits
      c = { pos: [0, 1, 2].map((i) => tg[i] + n[i] * d), target: tg, fov: 35, focusDist: e.focusDist, aperture: e.aperture * seg(u, 0.85, 1) }; dCam = d; }
    const camera = { ...c, far: 40000, near: sw ? Math.max(0.2, Math.min(20, dCam * 0.02)) : 20, topUp: [1, 0, 0] };
    const low = sm(seg(w, 0.45, 0.93));                                            // 0 top-down .. 1 ground level
    const hero = W.heroAt(t), body = sm(seg(w, 0.4, 0.62)); if (body > 0.002) K.cast.actor('hero').set({ pos: [hero.x, 0, hero.z], yaw: K.yawOf(hero), ...K.shared.heroRun(t), alpha: body, vary: 0 });
    // r3 (NOTES_v3, 26.0-26.6 was her marker and one road on dark mirror): light comes up the road she is about to land on. A pulse runs up her road and
    // reaches her tip on each of the four beats of the fall (b15.4, b16.1, b16.2, b16.3); her tip's light takes each one and grows (1.9 x on screen by 26.6).
    const mc0 = K.hex(K.LANE.main), kick = FALL.reduce((k, a) => k + (t >= a ? Math.exp(-(t - a) * 5) : 0), 0), grow = ss(t, 25.6, 26.6) * (1 - ss(t, 26.8, 27.5));      // back to a pool of r2's size once she is a body
    const pulses = sw ? FALL.filter((a) => t > a - 0.55 && t <= a).map((a) => ({ g: a - 10 * (a - t), width: Math.max(0.3, dCam * 0.011), gain: 7 * seg(t, a - 0.55, a - 0.4) })) : [];       // a comet of constant length on screen (her road is 5.2 m per second of g here)
    // each pulse is also a small comet of her lane's light on the mirror (the point of her road written at time g is where she was at g: W.heroAt(g))
    const comet = pulses.flatMap((q) => [0, 1, 2].map((k) => { const p = W.heroAt(q.g - k * Math.max(0.12, dCam * 0.005)), f = (q.gain / 7) * (1 - 0.3 * k); return { x: p.x, z: p.z, r: Math.max(0.5, dCam * 0.018) * (1 - 0.22 * k), c: mc0.map((v, i) => (v * 1.6 + [0.45, 0.32, 0.15][i]) * f) }; }));
    const mk = sw ? sm(seg(u, 0.08, 0.3)) * (1 - 0.8 * low) * (1 + 1.1 * kick) : 0, mr = Math.max(0.9, dCam * 0.016) * (1 + 0.9 * grow + 0.45 * kick), mc = K.hex(K.LANE.main);                // the tip's marker, then a pool under her feet
    const ca = 1 - seg(t, bar(15), bar(15) + 0.5);                                 // the counter leaves as the fall begins; seq 3 brings it back in the sky
    const type = t < bar(15) ? [K.label('MERGE', top(t), { font: 'hook', mode: 'ground', px: 150, x: -0.93, y: -0.84, gain: 1.5, t0: bar(9), wipe: true, wipeDur: 0.5, stagger: 0, t1: bar(14.5), fade: 0.8 })] : [];
    return { camera, env: { ground: { fogAmt: low, ripple: 0.011 * low, base: K.hex('#0A0F46').map((v, i) => lerp(v, K.hex('#060926')[i], low)), f0: lerp(0.12, 0.55, low) }, grade: { bloom: lerp(0.8, 0.6, low), bloomThreshold: lerp(0.8, 1.0, low), streak: 0.22 * low, vignette: lerp(0.46, 0.36, low), exposure: lerp(1.35, 1.5, low) } },
      world: { pulses, text: 0.7 * low, flow: 0.12, minPx: lerp(2.3, 1.3, low), haloPx: lerp(4, 5, low), halo: lerp(0.32, 0.22, low), headGain: 3 * (1 - low), headLen: 0.15, nodeMinPx: lerp(1.8, 1.4, low), canopy: { gain: 1.2 * (1 - low) }, lights: { gain: lerp(0.8, 0.7, low), minPx: lerp(1.6, 1, low), clear: low > 0.3 ? [[hero.x, hero.z, 14]] : [] }, art: { gain: 1.2 } },
      extra: mk > 0.01 ? [W.glow([{ x: hero.x, z: hero.z, r: mr, c: mc.map((v, i) => (v * 1.5 + [0.3, 0.2, 0.1][i]) * mk) }, { x: hero.x, z: hero.z, r: mr * 3.2, c: mc.map((v) => v * 0.35 * mk) }, ...comet])] : [],
      type, hud: K.hudMain(t, ca < 1 ? { count: W.count(t) } : {}), overlay: K.shared.counter(t, ca) };
  } };
}
