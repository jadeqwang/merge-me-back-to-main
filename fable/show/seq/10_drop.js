// 10 · bars 89-104 · 2:33.2-3:01.0 · THE DROP (153.17). Sunrise: silhouettes against a huge sun on a gold mirror. Wordless "ooh" from 173.08.
// A  b89    low and wide on main behind her: her butterfly peaks inside the sun ON the downbeat, a SOLO; the thousand hold the coil, a low frieze;
//           from b90.1 the unison phrase (the copies that are out of this frame are already leaving for their letters: actC_form.js)
// B  b93    on the downbeat she breaks into a run east along main; the camera lifts off above and behind her (6 m up: no runner near the lens) and finds the wave:
//           runners streaming in from behind and from the flanks, the ones near their cells waiting for their turn; everyone brakes on b95.2, stands on b96.1.
//           From b95 it is a high oblique from the west that holds the WHOLE word (standing bodies read as people, not as dashes); on b96.4 it swings up and is
//           straight overhead exactly on b97
// C  b97    the fall: the wave runs in from the far ends of the word and ends on her ON the downbeat, so MAIN is complete and whole in frame from 167.082,
//           on the gold-rose mirror with the sun's glitter path down main. One bar, still.
//    b98    the camera comes down behind the word and round its south flank, crosses the I high (push-up, crouch, the rise on b99.1 seen in passing), drops into
//           the gap between the A and the I and settles in front of her by b99.75: arms flung wide on 172.300, hero on the left third, her rank filling the right
//    b101   the same shot sinks and widens, and from b101.85 comes round to her south (78 degrees off east), closer and level: the double palm toward the lens,
//           the jump kick (b103.1) in profile against the rose belt, the rank an echo behind her. The light turns gold over these two bars.
// E  b103.3 cut up the gap, long lens, nearly straight on from the sun side: gold key, cool rim; bao quan on b104.1, held
import { seg, ss, sm, lerp } from '../kit.js';
import { hash1 } from '../../engine/src/rng.js';

export default function seq(K) {
  const { bar, bb, world: W, E } = K; const t0 = bar(89), t1 = bar(105); let lift = null, top = null, down = null, specks = null, beltProg = null;
  // the sky opposite the sunrise (shots from the sun side look west): the earth's shadow, a dusky blue band on the horizon, and above it the rose belt of the
  // anti-twilight, so the western sky is a gradient with a horizon and not one flat magenta. It arcs round to the north-west and south-west (the kick is shot looking
  // north-west: the black hair and trousers of the jump need the rose behind them). Drawn over the sky and (dimmer, mirrored) over the far mirror, under the bodies.
  const belt = (k) => ({ passes: ['ground'], reflect: false, draw(ctx) { const gl = E.gl; if (!beltProg) beltProg = new E.Program(gl, E.VS_TRI, E.FS_HEAD + `
in vec2 vUv; out vec4 o; uniform mat4 uInvVP; uniform vec3 uCam; uniform float uK;
void main(){ vec4 p = uInvVP * vec4(vUv*2.-1., 1., 1.); vec3 d = normalize(p.xyz/p.w - uCam);
  float west = smoothstep(-0.9, 0.2, -d.x / max(length(d.xz), 1e-4)), e = abs(d.y), m = d.y < 0. ? 0.22*exp(-e/0.10) : 1.;
  float sh = exp(-e/0.030), q = (e - 0.105)/0.075, rose = exp(-q*q);
  o = vec4(vec3(0.030, 0.035, 0.16)*sh*0.6 + vec3(0.52, 0.17, 0.19)*rose*(1. - 0.6*sh), sh*0.6) * (west*m*uK);
}`, 'actC_belt'); beltProg.use().set({ uInvVP: E.m4.invert(ctx.viewProj), uCam: ctx.camPos, uK: k }); E.drawTri(gl); } });
  const H = () => K.shared.actC;
  return { name: '10_drop', t0, t1, frame(t) {
    const C = H(), { hx, hz } = C, v = C.view, hd = C.head; const R = (x, y, z) => [hx + x, y, hz + z], Hr = (x, y, z) => [hd[0] + x, y, hd[1] + z];
    if (!top) top = W.frameBox(v.x0 - 2.6, v.x1 + 0.6, v.z0, v.z1, { margin: 1.2 });        // air round the word: the HUD line clears the M
    const tcx = top.pos[0], tcz = top.pos[2], hT = top.h;
    // the lift: above and behind her at the cut, back and up to a high oblique from the west that holds the whole word while they arrive, overhead exactly on b97
    if (!lift) lift = K.camPath([{ t: bar(93), pos: R(-10.5, 7.2, 2.4), target: R(8, 0.6, -0.6), fov: 38 }, { t: bar(94), pos: R(-17, 17, 3.0), target: R(15, 0, -1), fov: 38 }, { t: bar(95), pos: [v.x0 - 44, 44, tcz + 2.5], target: [tcx - 6, 0, tcz], fov: 38 },
      { t: bar(96.4), pos: [v.x0 - 38, 50, tcz], target: [tcx - 4.5, 0, tcz], fov: 38 }, { t: bar(97), pos: [tcx, hT, tcz], target: [tcx + 0.02 * hT, 0, tcz], fov: 35, stop: true }]);
    // from b101 the phrase carries everyone off their cells together: the low camera goes with her (her hips, averaged over 0.6 s)
    const hb = (tq) => { let x = 0, z = 0; for (let q = -2; q <= 2; q++) { const p = C.heroHips(tq + q * 0.15); x += p[0]; z += p[2]; } return [x / 5 - hd[0], z / 5 - hd[1]]; };
    // the low camera of b99.75-b103.3, polar round her: bearing `be` from east toward the south, the frame's centre `s` metres to her right (her rank's side), so she
    // sits on the left third. Arms wide: 23 degrees off her front. b100.8 sinks and widens. b101.85-b102.85 round to 78 degrees (nearly due south of her), closer
    // (3 m) and level (1.15 m): the double palm comes toward the lens, and at the kick's apex she faces west (the spin), i.e. she is in profile, the nearest and
    // largest body, head and kicking foot against the rose belt, her rank a close echo behind her; from the east she had her back to the lens.
    const tS = bar(99.75), orbit = (tq) => { const e = (a, b) => sm(seg(tq, a, b)), fw = ss(tq, bar(100.8), bar(101.4)), ho = fw > 0 ? hb(tq) : [0, 0];
      const u0 = seg(tq, tS, bar(100.8)), u1 = e(bar(100.8), bar(101.6)), u2 = e(bar(101.85), bar(102.85)), u3 = seg(tq, bar(102.85), bb(103, 3));
      const be = ((23.4 + 2.5 * u0 + 52 * u2 + 4 * u3) * Math.PI) / 180, r = 4.9 - 0.25 * u0 - 0.25 * u1 - 1.4 * u2, y = 1.1 - 0.35 * u1 + 0.4 * u2, ty = 1.04 + 0.06 * u1 + 0.12 * u2, s = 1.1 - 0.2 * u1 - 1.25 * u2, fov = 38 + 5 * u1 + 5 * u2;
      const cx = hd[0] + fw * ho[0], cz = hd[1] + fw * ho[1], cb = Math.cos(be), sb = Math.sin(be); return { pos: [cx + r * cb, y, cz + r * sb], target: [cx + s * sb, ty, cz - s * cb], fov }; };
    // the way down (b98.0 -> b99.75): behind the word looking east over it, round the south flank, over the N and the I at 10 m and more, to a point 8 m above
    // the gap in front of her (the bodies the bottom edge cuts are 8-10 m away and small), down the gap on a longer lens (the frame's foot stays inside the 4 m
    // corridor), then a low glide in to her, widening
    if (!down) down = K.camPath([{ t: bar(97), pos: [tcx, hT, tcz], target: [tcx + 0.02 * hT, 0, tcz], fov: 35, stop: true }, { t: bar(98), pos: [tcx, 0.97 * hT, tcz], target: [tcx + 0.02 * hT, 0, tcz], fov: 35 },
      { t: bar(98) + 0.75, pos: [tcx - 30, 0.5 * hT, tcz + 6], target: [tcx - 3, 0, tcz + 1], fov: 36 }, { t: bar(98) + 1.45, pos: Hr(-10, 15, 16), target: Hr(3, 1.0, 0), fov: 37 },
      { t: bar(98) + 2.1, pos: Hr(11, 8, 3.0), target: Hr(0, 1.0, -0.4), fov: 34 }, { t: bar(98) + 2.6, pos: Hr(8.2, 2.6, 2.4), target: Hr(0, 1.0, -0.7), fov: 31 }, { t: tS, ...orbit(tS), stop: true }]);
    const sunrise = { grade: { exposure: 1.02 } }; const world = (o = {}) => ({ text: 0.5, flow: 0.1, lights: { gain: 0.5 }, main: { head: C.mainHead(t) }, ...o });
    const hud = (n) => K.hudMain(t, { count: n }), PG = +(E.Q.get('ypg') || 0.6), PU = +(E.Q.get('ypu') || 4);
    // the mirror from above: deep rose-violet, gold toward the sun (east = up), and the sun's glitter path down main, through the gap between the A and the I
    const topGround = (up) => ({ base: [lerp(0.02, 0.085, up), lerp(0.02, 0.018, up), lerp(0.08, 0.07, up)], f0: lerp(0.5, 0.30, up), baseCut: lerp(0.5, 0.2, up), ripple: 0.02 });
    if (!specks) { specks = []; for (let q = 0; q < 520; q++) { const a = hash1(q * 7 + 1), b = hash1(q * 13 + 5) + hash1(q * 29 + 3) + hash1(q * 31 + 11) - 1.5, u = a * a; specks.push({ x: tcx + (0.62 - 1.3 * u) * hT, z: hz + b * (1.6 + 5.5 * u), r: 0.22 + 0.9 * hash1(q * 3 + 2) * (0.4 + u), w: 1.3 + 3.1 * hash1(q * 17), p: 6.283 * hash1(q * 19 + 4), k: 0.5 + 0.9 * (1 - u) }); } }
    const topGlow = (up) => { const list = [{ x: tcx + 0.66 * hT, z: tcz, r: 1.0 * hT, c: [1.3 * up, 0.52 * up, 0.07 * up] }, { x: tcx + 0.05 * hT, z: tcz, r: 1.2 * hT, c: [0.42 * up, 0.07 * up, 0.16 * up] }, { x: tcx - 0.6 * hT, z: tcz, r: 0.9 * hT, c: [0.06 * up, 0.0, 0.2 * up] },
        { x: tcx + 0.3 * hT, z: hz, r: 0.34 * hT, c: [0.55 * up, 0.26 * up, 0.04 * up] }, { x: tcx - 0.25 * hT, z: hz, r: 0.3 * hT, c: [0.30 * up, 0.12 * up, 0.03 * up] }];
      for (const s of specks) { const tw = Math.max(0, Math.sin(t * s.w + s.p)), g = up * s.k * (0.25 + 2.2 * tw * tw * tw); list.push({ x: s.x, z: s.z, r: s.r, c: [1.0 * g, 0.62 * g, 0.16 * g] }); }
      return [W.glow(list)]; };
    // the troupe from the sun side: a gold key, amber in the shadows, a cool rim from the sky behind them
    // g = gold (the last phrase and the salute). Tested on the salute at 1080p: the jacket takes its colour from the AMBIENT term far more than from the key (a
    // key colour of [1, 0.6, 0.22] at sunAmt 0.5 left it cream), so: amber ambient up, the white key down to 0.1, the key itself warm (`keyCol`, r3 figure), the ink
    // kept where it was, and the grade a step warmer. Jackets go from cream to gold-tan; skin goes golden with them.
    const GA = 0.62, GS = 0.1, KC = [1.0, 0.8, 0.5];
    const sunSide = (k = 1, g = 0) => ({ figLight: { sunAmt: lerp(0.3, GS, g) * k, ink: 0.3 * k, keyCol: [lerp(1, KC[0], g * k), lerp(1, KC[1], g * k), lerp(1, KC[2], g * k)], ambient: [lerp(0.03, lerp(0.46, GA, g), k), lerp(0.02, lerp(0.22, 0.47 * GA, g), k), lerp(0.03, 0.035, k)], rimCol: [lerp(2.6, 0.8, k), lerp(1.3, 1.4, k), lerp(0.42, 3.2, k)], rimDir: [-0.85, 0.5, 0.15], rimBoth: 0.25 * k, under: lerp(0.12, 0.55, k) }, outline: { strength: 0.3 * k, width: 1 } });
    const sunGrade = (k = 1, g = 0) => ({ exposure: lerp(1.02, 1.1, k), vignette: lerp(0.34, 0.3, k), gain: [lerp(1, 1.25, k) + 0.07 * g, 1, lerp(1, 0.68, k) - 0.1 * g] });
    if (E.Q.get('cdev')) { const n = C.thousand(t), h = C.heroHips(t); return { camera: { pos: [h[0] + 1.5, 1.3, h[2] + 7.5], target: [h[0] + 0.5, 0.95, h[2]], fov: 40, far: 30000 }, env: sunrise, world: world({ text: 0.3 }), hud: hud(n) }; }   // dev: --q "cdev=1" beside the hero, from the south
    if (E.Q.get('ctop')) { const n = C.thousand(t); const b = W.frameBox(hx - 44, hx + 52, hz - 44, hz + 44, { margin: 1.02 }); return { camera: { ...b, far: 30000 }, env: { ground: topGround(0.4) }, world: world({ text: 0, lights: false }), extra: topGlow(0.4), hud: hud(n) }; }   // dev: --q "ctop=1" the whole floor from above
    return K.cut(t, [
      { t0, f: () => { const n = C.thousand(t, { each: (i, d) => { if (i === 0 && t < bar(90)) d.trail = { len: 0.5, gain: 1.2, mask: ['toeL', 'toeR', 'handL', 'handR'] }; } }); const camera = { ...C.dropCam(t), far: 30000 }; const imp = Math.exp(-(t - t0) * 3);
        return { camera, env: sunrise, world: world(), hud: hud(n), flash: 0.5 * imp }; } },
      { t0: bar(93), f: () => { const n = C.thousand(t, { each: (i, d) => { if (i === 0) d.gain = 2.2; } }); const c = lift(t); const up = ss(t, bar(94.4), bar(96.4));
        return { camera: { ...c, far: 30000, topUp: [1, 0, 0] }, env: { ground: topGround(up), grade: { exposure: 1.02 } }, world: world({ text: 0.3 * (1 - up), main: { head: C.mainHead(t), headGain: 3, headLen: 3 } }), extra: [...topGlow(up), C.heroPool(t, c, { gain: PG * (1 + PU * up) })], hud: hud(n) }; } },
      { t0: bar(97), f: () => { const n = C.thousand(t, { each: (i, d) => { d.gain = i === 0 ? 2.4 : 1.5; } }); const c = t < tS ? down(t) : orbit(t); const up = 1 - ss(t, bar(98) + 0.2, bar(98) + 1.5), k = ss(t, bar(98) + 1.3, bar(98) + 2.4), g = ss(t, bar(101), bar(103));
        return { camera: { ...c, topUp: [1, 0, 0], near: up > 0.5 ? 2 : 0.1, far: 30000 }, env: { ground: topGround(up), grade: sunGrade(k, g), ...sunSide(k, g) },
          world: world({ text: 0, lights: false, gain: lerp(2.4, 0.15, k), main: { head: C.mainHead(t), gain: 2.4 }, ...(k > 0.6 ? { only: ['main'] } : {}) }), extra: [...(k > 0.01 ? [belt(k)] : []), ...topGlow(up), ...C.fallGlow(t, { gain: 0.8 * up }), C.heroPool(t, c, { gain: PG * (1 + PU * up) })], hud: hud(n) }; } },
      { t0: bb(103, 3), f: (tt, u) => { const n = C.thousand(t, { each: (i, d) => { if (i === 0) d.gain = 1.6; } }); const a = C.heroHips(bar(104) + 0.4), Ha = (x, y, z) => [a[0] + x, y, a[2] + z];
        // r4 Y (NOTES_v4 Y5): the cut finds them in the kick's low landing (her hips 0.34 m up, 0.7 m north of where she will salute) and the frame was aimed at
        // the salute: a strip of bodies low and right under an empty sky until 178.9. The aim now starts on the low pose and rises with her (her hips, averaged
        // over 0.3 s) into the same held frame; it is home on b104 (179.25), before the fist meets the palm.
        let hy = 0, hzz = 0; for (let q = -2; q <= 2; q++) { const p = C.heroHips(Math.max(t + q * 0.075, bb(103, 3) + 0.02)); hy += p[1] / 5; hzz += p[2] / 5; } const rise = sm(seg(hy, 0.34, 1.0));
        const camera = { pos: Ha(7.6 - 0.7 * sm(u), 0.8, 1.95), target: Ha(0, lerp(0.70, 1.28, rise), hzz - a[2] - 0.15), fov: 25, far: 30000 };
        return { camera, env: { grade: sunGrade(1, 1), ...sunSide(1, 1) }, world: world({ text: 0, lights: false, only: ['main'], main: { head: C.mainHead(t), gain: 2.4 } }), extra: [belt(1), C.heroPool(t, camera, { gain: PG })], hud: hud(n) }; } },
    ], t1);
  } };
}
