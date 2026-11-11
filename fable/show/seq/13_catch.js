// 13 · bars 129-136 · 3:42.7-3:56.6 · hit + bass return on b129 (222.73); riser from 233.2
// C1  b129    "Fold ..."                             the same frontal shot: the light lands between her hands, at her chest, on the hit, and the sun breaks behind her.
//                                                    Half a step back; her head bows over it. A violet ripple goes out through the thousand. On b130.1 and b130.2 the
//                                                    first one, then two, run up behind her and are light, and are her
// C2  b130.3  "... me in again"                      high and wide: they fold home, 4, 8, 16 ... 512, a group on every beat, each a runner and then a light, until she
//                                                    stands alone on b132.2 (228.38). 1,024 branches -> 1
// C3  b133    "Every life I've lived I have become"  frontal, she is half the frame: her head lifts ("life", 229.6), her arms open ("become", 232.71), and for the first
//                                                    time she is in full colour; the day comes up behind her
import { seg, ss, sm, lerp, clamp01 } from '../kit.js';
import { zoomOn } from './actE_morning.js';

export default function seq(K) {
  const { bar, bb, world: W, cast, T, E } = K; const t0 = bar(129), t1 = bar(137), tC2 = bb(130, 3), tC3 = bb(132, 2), tDay = bar(133), D = K.shared.actD, C = D.C;      // (r2) C3 begins on b132.2, the beat the last of them come home
  const tLife = T.words(23)[1].start, tBecome = T.words(23)[6].start, VC = K.hex(K.LANE.violet), LH = E.lights(8);
  // the note, held: a small violet-white light between her hands, then in her chest; it goes out into her as her own colour comes
  const heldLight = (t, k = 1) => { const p = D.held(t), d = new Float32Array(14), g = k * (1 - ss(t, tLife, tBecome)) * (1 + 2.5 * Math.exp(-(t - t0) * 3));
    d.set([p[0], p[1], p[2], (VC[0] + 0.7) * 14 * g, (VC[1] + 0.7) * 14 * g, (VC[2] + 0.7) * 14 * g, 0.022, p[0], p[1], p[2], (VC[0] + 0.2) * 1.4 * g, (VC[1] + 0.2) * 1.4 * g, (VC[2] + 0.2) * 1.4 * g, 0.06]); return LH.drawable(d, 2, { minPx: 1.6 }); };
  const dawnAt = (t) => (t < tDay ? lerp(0.5, 0.6, ss(t, t0 - 0.05, t0 + 0.5)) + 0.03 * seg(t, t0 + 0.5, tDay) : lerp(0.63, W.dawn(t1 + 0.001), sm(seg(t, tDay, t1))));
  // r2 · the sun breaks ON the hit: it was held under the horizon (12_flight sunHeld); its rim is over the line within two frames and it climbs to its place in a second and a half
  const sunAt = (t) => { const d = dawnAt(t), e = 1 - Math.exp(-(t - t0) / 0.45); return { elev: lerp(D.SUN_HELD, D.sunElev(d), e), gain: lerp(D.sunHeld(d).gain, sm(Math.min(1, Math.max(0, (d - 0.36) / 0.2))), e) }; };
  // r2 · C3 is one shot from b132.2: waist-up on her as the last lights land and the violet note goes from her hands into her chest; it eases back to the medium as her head
  // lifts and her arms open. (It replaces a bar of near-empty wide, 228.4-229.7, and the cut on b133.)
  // r4: through the hold of "become" (232.4 -> b137) it keeps coming in, 0.6 m: the frame is never still while she stands in the pose, and it is on its way to 14's closer axis
  const camC3 = (t) => { const e = sm(seg(t, tC3 + 0.9, 232.4)), u = seg(t, tC3, t1), px = lerp(-1.95, -5.0 + 0.35 * sm(u) + 0.6 * sm(seg(t, 232.4, t1)), e), pz = lerp(0.2, 0.55, e), y = lerp(1.3, 1.25, e);
    return { pos: [C[0] + px, y, pz], target: [C[0] + px + 8, lerp(1.22, 1.3, e) - 0.4 * sm(seg(t, 232.4, t1)), pz - 2.55], fov: 35, focusDist: -px - 0.1, aperture: 0.02, far: 30000 }; };
  // her light, key by key: silhouette (dawn 0.6) -> day, complete on "become"
  const mix3 = (a, b, u) => a.map((v, i) => v + (b[i] - v) * u);
  const figLight = (w) => ({ ambient: mix3([0.03, 0.02, 0.03], [0.70, 0.73, 0.88], w), rimCol: mix3([2.4, 1.25, 0.5], [0, 0, 0], w), rimBoth: 0, sunAmt: w, under: 0.12 * (1 - w), emissive: 1.5 * (1 - w), fibres: 0.1 * (1 - w), trans: 1 - w });
  return { name: '13_catch', t0, t1, frame(t) {
    const hit = Math.exp(-(t - t0) * 2.2);
    if (t < tC3) { const cw = D.crowd(t, { fold: true }), hi = t >= tC2, u = seg(t, tC2, tC3);
      const camera = hi ? { pos: [C[0] - 10 - 2.5 * sm(u), 5.5 + 1.6 * sm(u), 4.5 - 1.2 * u], target: [C[0] + 12 + 3 * u, 0.4 + 1.1 * sm(u), -0.6], fov: 45, far: 30000 } : D.front(t);
      D.hero(t, { gain: 1 + 1.2 * cw.pulse + 1.5 * hit });
      const glow = [{ x: C[0], z: 0, r: 2 + 30 * (t - t0), c: [0.9 * hit, 0.6 * hit, 1.6 * hit] }, { x: C[0], z: 0, r: 3.5 + 2 * cw.pulse, c: [1.2, 0.8, 0.5].map((q) => q * (0.15 + 0.9 * cw.pulse)) }];
      const extra = [W.glow(glow), heldLight(t, hi ? 0.6 : 1)]; if (cw.lights) extra.push(cw.lights);
      const type = hi ? [K.lyric(22, camera, { font: 'hook', px: 100, x: -0.93, y: 0.6, rows: [4], dist: 60, reflect: false, out: 228.75, fade: 0.2 }), K.lyric(23, camera, { font: 'hook', px: 100, x: -0.93, y: 0.6, rows: [2, 2, 2, 1], anchor: 'first', dist: 60, reflect: false })]
        : [K.lyric(22, camera, { font: 'hook', px: 96, x: -0.93, y: 0.36, rows: [1, 3], dist: 34, reflect: false })];
      return zoomOn(K, { camera, env: { dawn: dawnAt(t), sun: sunAt(t), figLight: D.SIL }, world: { text: 0.5, flow: 0.1, lights: { gain: 0.35 } }, extra, type, hud: K.hudMain(t, { count: cw.n }), flash: 0.7 * Math.exp(-(t - t0) * 5) + (hi ? 0.05 * cw.pulse : 0.03 * cw.pulse) }, D.headOf(t)); }
    const w = ss(t, tLife, tBecome), camera = camC3(t), cw = D.crowd(t, { fold: true });
    D.hero(t, { gain: 1 + 1.2 * cw.pulse });
    return zoomOn(K, { camera, env: { dawn: dawnAt(t), figLight: figLight(w), outline: { strength: w, width: 1.3 } }, world: { text: 0.6, flow: 0.1, lights: { gain: 0.3 } }, extra: [W.glow([{ x: C[0], z: 0, r: 3.5 + 2 * cw.pulse, c: [1.2, 0.8, 0.5].map((q) => q * 0.9 * cw.pulse) }]), heldLight(t), ...(cw.lights ? [cw.lights] : [])], flash: 0.05 * cw.pulse,
      type: [K.lyric(23, camera, { font: 'hook', px: 70, x: -0.93, y: 0.08, rows: [2, 2, 2, 1], dist: 34, out: 235.6, fade: 0.14, reflect: false, ink: ss(t, 234.0, 234.7) }), K.lyric(24, camera, { font: 'hook', px: 70, x: -0.93, y: 0.08, rows: [1, 2], dist: 34, out: t1 + 1, fade: 0.01, reflect: false, ink: 1 })], hud: K.hudMain(t, { count: 1 }) }, D.headOf(t));
  } };
}
