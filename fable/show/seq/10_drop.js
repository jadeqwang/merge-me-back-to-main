// 10 · bars 89-104 · 2:33.2-3:01.0 · THE DROP (153.17). Sunrise: silhouettes against a huge sun on a gold mirror. Wordless "ooh" from 173.08.
// A  b89    low and wide on main behind her: her butterfly peaks inside the sun ON the downbeat, a SOLO; the thousand hold the coil, a low frieze;
//           from b90.1 the unison phrase (the copies that are out of this frame are already leaving for their letters: actC_form.js)
// B  b93    on the downbeat she breaks into a run east along main; the camera lifts off behind her and finds the wave: runners streaming in from behind and from
//           the flanks, the ones near their cells waiting for their turn; everyone brakes on b95.2, stands on b96.1; the camera is overhead by b96.5
// C  b97    all 1,024 fall on the downbeat, a ripple outward from her: MAIN, on the gold-rose mirror with the sun's glitter path down main. One bar, still.
//    b98    the camera comes down behind the word and round its south flank (push-up, crouch, the rise on b99.1 seen in passing) and settles low in the gap
//           between the A and the I, in front of her: arms flung wide on 172.300, hero large, the rows receding behind her
//    b101   the same shot sinks and widens: the last phrase and the jump kick (b103.1) from below, the troupe behind her
// E  b103.3 cut up the gap, long lens, nearly straight on from the sun side: gold key, cool rim; bao quan on b104.1, held
import { seg, ss, sm, lerp } from '../kit.js';
import { hash1 } from '../../engine/src/rng.js';

export default function seq(K) {
  const { bar, bb, world: W, E } = K; const t0 = bar(89), t1 = bar(105); let lift = null, top = null, down = null, specks = null, beltProg = null;
  // the sky opposite the sunrise (shots from the sun side look west): the earth's shadow, a dusky blue band on the horizon, and above it the rose belt of the
  // anti-twilight, so the western sky is a gradient with a horizon and not one flat magenta. Drawn over the sky and (dimmer, mirrored) over the far mirror, under the bodies.
  const belt = (k) => ({ passes: ['ground'], reflect: false, draw(ctx) { const gl = E.gl; if (!beltProg) beltProg = new E.Program(gl, E.VS_TRI, E.FS_HEAD + `
in vec2 vUv; out vec4 o; uniform mat4 uInvVP; uniform vec3 uCam; uniform float uK;
void main(){ vec4 p = uInvVP * vec4(vUv*2.-1., 1., 1.); vec3 d = normalize(p.xyz/p.w - uCam);
  float west = smoothstep(0.05, 0.85, -d.x / max(length(d.xz), 1e-4)), e = abs(d.y), m = d.y < 0. ? 0.22*exp(-e/0.10) : 1.;
  float sh = exp(-e/0.030), q = (e - 0.105)/0.075, rose = exp(-q*q);
  o = vec4(vec3(0.030, 0.035, 0.16)*sh*0.6 + vec3(0.52, 0.17, 0.19)*rose*(1. - 0.6*sh), sh*0.6) * (west*m*uK);
}`, 'actC_belt'); beltProg.use().set({ uInvVP: E.m4.invert(ctx.viewProj), uCam: ctx.camPos, uK: k }); E.drawTri(gl); } });
  const H = () => K.shared.actC;
  return { name: '10_drop', t0, t1, frame(t) {
    const C = H(), { hx, hz } = C, v = C.view, hd = C.head; const R = (x, y, z) => [hx + x, y, hz + z], Hr = (x, y, z) => [hd[0] + x, y, hd[1] + z];
    if (!top) top = W.frameBox(v.x0 - 2.6, v.x1 + 0.6, v.z0, v.z1, { margin: 1.1 });
    const tcx = top.pos[0], tcz = top.pos[2], hT = top.h;
    if (!lift) lift = K.camPath([{ t: bar(93), pos: R(-6.5, 2.7, 2.6), target: R(7, 1.0, -0.6), fov: 38 }, { t: bar(94), pos: R(-15, 15, 3.0), target: R(15, 0, -1), fov: 37 }, { t: bar(95), pos: [tcx - 30, 0.55 * hT, tcz + 1.5], target: [tcx - 1, 0, tcz], fov: 36 },
      { t: bar(96), pos: [tcx - 9, 0.93 * hT, tcz], target: [tcx + 0.6, 0, tcz], fov: 35 }, { t: bar(96.5), pos: [tcx, hT, tcz], target: [tcx + 0.02 * hT, 0, tcz], fov: 35, stop: true }]);
    // the way down (b98.0 -> b99.5): behind the word looking east over it, round the south flank, over the I, down into the gap in front of her
    if (!down) down = K.camPath([{ t: bar(97), pos: [tcx, hT, tcz], target: [tcx + 0.02 * hT, 0, tcz], fov: 35, stop: true }, { t: bar(98), pos: [tcx, 0.97 * hT, tcz], target: [tcx + 0.02 * hT, 0, tcz], fov: 35 },
      { t: bar(98) + 0.75, pos: [tcx - 30, 0.5 * hT, tcz + 6], target: [tcx - 3, 0, tcz + 1], fov: 36 }, { t: bar(98) + 1.4, pos: Hr(-13, 11, 19), target: Hr(3, 1.0, 0), fov: 37 },
      { t: bar(98) + 1.95, pos: Hr(8, 5.2, 10), target: Hr(0, 1.0, -0.1), fov: 38 }, { t: bar(98) + 2.3, pos: Hr(6.4, 2.6, 3.4), target: Hr(0, 1.0, -0.2), fov: 38 },
      { t: bar(99.5), pos: Hr(4.5, 1.1, 1.95), target: Hr(0, 1.04, -0.3), fov: 38, stop: true }, { t: bar(101), pos: Hr(4.2, 1.05, 1.95), target: Hr(0, 1.06, -0.3), fov: 38 },
      { t: bar(102), pos: Hr(4.3, 0.8, 2.15), target: Hr(0, 1.1, -0.2), fov: 43 }, { t: bb(103, 3), pos: Hr(4.1, 0.7, 2.15), target: Hr(0, 1.2, -0.2), fov: 44 }]);
    // from b101 the phrase carries everyone off their cells together: the low camera goes with her (her hips, averaged over 0.6 s)
    const hb = (tq) => { let x = 0, z = 0; for (let q = -2; q <= 2; q++) { const p = C.heroHips(tq + q * 0.15); x += p[0]; z += p[2]; } return [x / 5 - hd[0], z / 5 - hd[1]]; };
    const sunrise = { grade: { exposure: 1.02 } }; const world = (o = {}) => ({ text: 0.5, flow: 0.1, lights: { gain: 0.5 }, main: { head: C.mainHead(t) }, ...o });
    const hud = (n) => K.hudMain(t, { count: n });
    // the mirror from above: deep rose-violet, gold toward the sun (east = up), and the sun's glitter path down main, through the gap between the A and the I
    const topGround = (up) => ({ base: [lerp(0.02, 0.085, up), lerp(0.02, 0.018, up), lerp(0.08, 0.07, up)], f0: lerp(0.5, 0.30, up), baseCut: lerp(0.5, 0.2, up), ripple: 0.02 });
    if (!specks) { specks = []; for (let q = 0; q < 520; q++) { const a = hash1(q * 7 + 1), b = hash1(q * 13 + 5) + hash1(q * 29 + 3) + hash1(q * 31 + 11) - 1.5, u = a * a; specks.push({ x: tcx + (0.62 - 1.3 * u) * hT, z: hz + b * (1.6 + 5.5 * u), r: 0.22 + 0.9 * hash1(q * 3 + 2) * (0.4 + u), w: 1.3 + 3.1 * hash1(q * 17), p: 6.283 * hash1(q * 19 + 4), k: 0.5 + 0.9 * (1 - u) }); } }
    const topGlow = (up) => { const list = [{ x: tcx + 0.66 * hT, z: tcz, r: 1.0 * hT, c: [1.3 * up, 0.52 * up, 0.07 * up] }, { x: tcx + 0.05 * hT, z: tcz, r: 1.2 * hT, c: [0.42 * up, 0.07 * up, 0.16 * up] }, { x: tcx - 0.6 * hT, z: tcz, r: 0.9 * hT, c: [0.06 * up, 0.0, 0.2 * up] },
        { x: tcx + 0.3 * hT, z: hz, r: 0.34 * hT, c: [0.55 * up, 0.26 * up, 0.04 * up] }, { x: tcx - 0.25 * hT, z: hz, r: 0.3 * hT, c: [0.30 * up, 0.12 * up, 0.03 * up] }];
      for (const s of specks) { const tw = Math.max(0, Math.sin(t * s.w + s.p)), g = up * s.k * (0.25 + 2.2 * tw * tw * tw); list.push({ x: s.x, z: s.z, r: s.r, c: [1.0 * g, 0.62 * g, 0.16 * g] }); }
      return [W.glow(list)]; };
    // the troupe from the sun side: a gold key, amber in the shadows, a cool rim from the sky behind them
    const sunSide = (k = 1) => ({ figLight: { sunAmt: 0.3 * k, ambient: [lerp(0.03, 0.46, k), lerp(0.02, 0.22, k), lerp(0.03, 0.035, k)], rimCol: [lerp(2.6, 0.8, k), lerp(1.3, 1.4, k), lerp(0.42, 3.2, k)], rimDir: [-0.85, 0.5, 0.15], rimBoth: 0.25 * k, under: lerp(0.12, 0.55, k) }, outline: { strength: 0.3 * k, width: 1 } });
    const sunGrade = (k = 1) => ({ exposure: lerp(1.02, 1.1, k), vignette: lerp(0.34, 0.3, k), gain: [lerp(1, 1.25, k), 1, lerp(1, 0.68, k)] });
    if (E.Q.get('cdev')) { const n = C.thousand(t), h = C.heroHips(t); return { camera: { pos: [h[0] + 1.5, 1.3, h[2] + 7.5], target: [h[0] + 0.5, 0.95, h[2]], fov: 40, far: 30000 }, env: sunrise, world: world({ text: 0.3 }), hud: hud(n) }; }   // dev: --q "cdev=1" beside the hero, from the south
    if (E.Q.get('ctop')) { const n = C.thousand(t); const b = W.frameBox(hx - 44, hx + 52, hz - 44, hz + 44, { margin: 1.02 }); return { camera: { ...b, far: 30000 }, env: { ground: topGround(0.4) }, world: world({ text: 0, lights: false }), extra: topGlow(0.4), hud: hud(n) }; }   // dev: --q "ctop=1" the whole floor from above
    return K.cut(t, [
      { t0, f: () => { const n = C.thousand(t, { each: (i, d) => { if (i === 0 && t < bar(90)) d.trail = { len: 0.5, gain: 1.2, mask: ['toeL', 'toeR', 'handL', 'handR'] }; } }); const camera = { ...C.dropCam(t), far: 30000 }; const imp = Math.exp(-(t - t0) * 3);
        return { camera, env: sunrise, world: world(), hud: hud(n), flash: 0.5 * imp }; } },
      { t0: bar(93), f: () => { const n = C.thousand(t, { each: (i, d) => { if (i === 0) d.gain = 2.2; } }); const c = lift(t); const up = ss(t, bar(94.4), bar(96.3));
        return { camera: { ...c, far: 30000, topUp: [1, 0, 0] }, env: { ground: topGround(up), grade: { exposure: 1.02 } }, world: world({ text: 0.3 * (1 - up), main: { head: C.mainHead(t), headGain: 3, headLen: 3 } }), extra: topGlow(up), hud: hud(n) }; } },
      { t0: bar(97), f: () => { const n = C.thousand(t, { each: (i, d) => { d.gain = i === 0 ? 2.4 : 1.5; } }); const c = down(Math.min(t, bb(103, 3))), fw = ss(t, bar(100.8), bar(101.4)), ho = fw > 0 ? hb(t) : [0, 0]; c.pos = [c.pos[0] + 0.9 * fw * ho[0], c.pos[1], c.pos[2] + 0.9 * fw * ho[1]]; c.target = [c.target[0] + fw * ho[0], c.target[1], c.target[2] + fw * ho[1]]; const up = 1 - ss(t, bar(98) + 0.2, bar(98) + 1.5), k = ss(t, bar(98) + 1.2, bar(98) + 2.2);
        return { camera: { ...c, topUp: [1, 0, 0], near: up > 0.5 ? 2 : 0.1, far: 30000 }, env: { ground: topGround(up), grade: sunGrade(k), ...sunSide(k) },
          world: world({ text: 0, lights: false, gain: lerp(2.4, 0.15, k), main: { head: C.mainHead(t), gain: 2.4 }, ...(k > 0.6 ? { only: ['main'] } : {}) }), extra: [...(k > 0.01 ? [belt(k)] : []), ...topGlow(up), ...C.fallGlow(t, { gain: 0.8 * up })], hud: hud(n) }; } },
      { t0: bb(103, 3), f: (tt, u) => { const n = C.thousand(t, { each: (i, d) => { if (i === 0) d.gain = 1.6; } }); const a = C.heroHips(bar(104) + 0.4), Ha = (x, y, z) => [a[0] + x, y, a[2] + z]; const camera = { pos: Ha(7.6 - 0.7 * sm(u), 0.8, 1.95), target: Ha(0, 1.28, -0.15), fov: 25, far: 30000 };
        return { camera, env: { grade: sunGrade(1), ...sunSide(1) }, world: world({ text: 0, lights: false, only: ['main'], main: { head: C.mainHead(t), gain: 2.4 } }), extra: [belt(1)], hud: hud(n) }; } },
    ], t1);
  } };
}
