// 12 · bars 121-128 · 3:28.8-3:42.7 · chorus 2, pads only (no kick, no bass)
// (D) to 210.96   "Merge ..."                        still on her (11_violet's last shot): the camera lifts away, she is a small steady light at the end of her road
// F1  210.96 "me" "... me back to main"              cut on "me": the light, high over the dark continent, heading south-west for the roads. Vast, slow, one comet
// F2  214.97      "Every road I ran becomes the one" it comes down over the merge of the thousand roads and banks east onto main: the roads become one under it
//                                                    and the dawn swings in ahead. The same shot runs on down main toward the people standing there ("one", 219.37)
// F3  b128        (220.99)                           main-Jade, frontal, the thousand behind her, the sun about to break behind them. It arrives over our shoulder
// The thousand at the catch, and how they fold home (13_catch), are built here: K.shared.actD.crowd.
import { seg, ss, sm, lerp, clamp01 } from '../kit.js';
import { N } from '../formation.js';

export default function seq(K) {
  const { bar, bb, world: W, cast, T, E } = K; const t0 = bar(121), t1 = bar(129), tHit = t1, tF2 = T.line(21).start, tF3 = bar(128), C = W.CATCH, D = K.shared.actD, tF1 = D.tEnd;
  const WEST = -Math.PI / 2, LN = ['rose', 'blue', 'cyan', 'mint', 'gold', 'coral', 'magenta', 'main'], h1 = K.rng.hash1;

  // ---- the thousand: arcs behind her (east of her), facing west as she does; an aisle is left along main so she stands clear against the sun
  const S = []; for (let j = 0; S.length < N - 1 && j < 200; j++) { const r = 5 + 1.9 * j, n = Math.floor((r * 2.8) / 1.7); for (let q = 0; q < n && S.length < N - 1; q++) { const a = ((q + 0.5) / n - 0.5) * 2.8, x = C[0] + r * Math.cos(a) + 0.5 * (h1(S.length * 3 + 1) - 0.5), z = r * Math.sin(a) + 0.5 * (h1(S.length * 7 + 2) - 0.5);
    if (Math.abs(z) < 1.5) continue; S.push({ x, z, d: Math.hypot(x - C[0], z), i: S.length }); } }
  // they fold home nearest first: 1, 2, 4 ... 512 of them on ten successive beats (b130.1 .. b132.2), the doubling run backwards. Each runs for home (sprint_loop at a
  // legal pace), and half a second before her beat she lets go of her body and is a light that reaches main-Jade exactly on the beat.
  const V_RUN = 5.6, G = K.gait ? K.gait(V_RUN) : { track: 'sprint_loop', rate: 1.13, speed: V_RUN }, T_LIGHT = 0.5, T_RUN = 2.6;
  S.slice().sort((a, b) => a.d - b.d).forEach((s, rank) => { const k = Math.floor(Math.log2(rank + 1)); s.k = k; s.tb = bb(130 + (k >> 2), 1 + (k & 3)); s.ts = s.tb - Math.min(T_RUN, s.d / G.speed); s.tr = tHit + s.d / 30;
    s.ux = (C[0] - s.x) / s.d; s.uz = -s.z / s.d; s.lane = LN[s.i % 8]; s.ph = 7 * h1(s.i * 13 + 5); });
  const beats = [...Array(10)].map((_, k) => bb(130 + (k >> 2), 1 + (k & 3)));
  const LC = E.lights(4096), VC = K.hex(K.LANE.violet), laneLin = Object.fromEntries(LN.map((n) => [n, K.hex(K.LANE[n])]));
  // crowd(t, { fold }) -> { n: branches left, lights: drawable | null, pulse: 0..: how hard the last arrivals landed }
  function crowd(t, o = {}) { const cr = cast.crowd('thousand', N), fold = !!o.fold, L = new Float32Array(4096 * 7), tgt = D.held(Math.max(t, tHit)); let n = 0, nl = 0, left = 1;
    for (const s of S) { let x = s.x, z = s.z, track = 'idle', time = t + s.ph, yaw = WEST, lane = s.lane, gain = 1, alpha = 1;
      if (fold) { const q = t - s.tr; if (q > 0 && q < 0.9) { const w = 1 - q / 0.9; lane = 'violet'; gain = 1 + 2.2 * w; if (nl < 4096 && t < s.ts + 0.2) { L.set([x - 0.16, 1.22, z, (VC[0] + 0.25) * 9 * w * w, (VC[1] + 0.25) * 9 * w * w, (VC[2] + 0.3) * 9 * w * w, 0.07], nl * 7); nl++; } }                                // the violet ripple
        if (t >= s.tb) continue; left++;
        if (t > s.ts) { const run = Math.min(s.d - 0.4, G.speed * (t - s.ts) * Math.min(1, (t - s.ts) / 0.35 * 0.5 + 0.5)); x += s.ux * run; z += s.uz * run; yaw = Math.atan2(s.ux, s.uz); track = G.track; time = (t - s.ts) * G.rate + s.ph;
          const u = (t - (s.tb - T_LIGHT)) / T_LIGHT; if (u > 0) { alpha = 1 - clamp01(u / 0.6); const c = laneLin[s.lane];
            for (let j = 0; j < 3 && nl < 4096; j++) { const uj = Math.max(0, u - j * 0.07), e = uj * uj * (1.6 - 0.6 * uj), g = (j ? 0.35 / j : 1) * 5 * Math.min(1, u * 4); L.set([x + (tgt[0] - x) * e, 1.2 + (tgt[1] - 1.2) * e, z + (tgt[2] - z) * e, (c[0] + 0.35) * g, (c[1] + 0.35) * g, (c[2] + 0.35) * g, 0.05 - 0.012 * j], nl * 7); nl++; } } } }
      else left++;
      if (alpha > 0.02) cr.put(n++, { pos: [x, 0, z], yaw, track, time, lane, gain, alpha, seed: s.i + 2 }); }
    cr.n = n; let pulse = 0; if (fold) beats.forEach((tb, k) => { if (t >= tb) pulse += Math.exp(-(t - tb) * 5) * (0.25 + 0.085 * k); });
    return { n: left, lights: nl ? LC.drawable(L, nl, { minPx: 1.4 }) : null, pulse }; }
  // main-Jade: `idle`, then `catch` (song_t0 220.0: the light lands in her hands on b129, her head lifts on "life", her arms are open on "become")
  const tC = cast.songT0('catch') || 220.0, hero = (t, o = {}) => cast.actor('hero').set({ pos: [C[0], 0, 0], yaw: WEST, track: t < tC ? 'idle' : 'catch', time: t - tC, ...o });
  // the frontal camera of the catch (F3, and 13's first shot): low, on main, the sun dead behind her
  const front = (t) => { const u = sm(seg(t, tF3, tHit + 2.6)); return { pos: [C[0] - 7.4 + 1.5 * u, 1.12 + 0.08 * u, 0.42], target: [C[0] + 4, 1.34, -0.1], fov: 35, focusDist: 6.6 - 1.4 * u, aperture: 0.015, far: 30000 }; };
  const dawnAt = (t) => (t < tF2 ? lerp(D.dawnAt(tF1), 0.2, seg(t, tF1, tF2)) : t < tF3 ? lerp(0.2, 0.42, sm(seg(t, tF2, tF3))) : lerp(0.42, 0.5, seg(t, tF3, tHit)));
  Object.assign(D, { crowd, hero, front, tHit, C });

  // ---- the flight camera: behind and above where the light was a moment ago, looking where it will be. It banks with the turn.
  const hdg = (t) => { const a = D.lightAt(t - 0.25), b = D.lightAt(t + 0.25); return Math.atan2(b[0] - a[0], b[2] - a[2]); };
  const chase = (t, o) => { const L = D.lightAt(t), Lb = D.lightAt(t - o.back), La = D.lightAt(t + o.lead); let dh = hdg(t + 0.4) - hdg(t - 0.4); dh = Math.atan2(Math.sin(dh), Math.cos(dh));
    const side = o.side || 0, hx = La[0] - Lb[0], hz = La[2] - Lb[2], hl = Math.hypot(hx, hz) || 1;
    return { pos: [Lb[0] - (hz / hl) * side, Math.max(1.5, Lb[1] + o.up), Lb[2] + (hx / hl) * side], target: [La[0], La[1] - o.down, La[2]], fov: o.fov, roll: -(o.bank ?? 14) * Math.max(-1, Math.min(1, dh / 0.8)), near: 0.5, far: 40000, mote: Math.hypot(L[0] - Lb[0], L[1] - Lb[1] - o.up, L[2] - Lb[2]) }; };
  const flightWorld = (k) => ({ text: 0.3, flow: 0.2, flowSpeed: 9, minPx: 1.3, nodeMinPx: 0.7, gain: 1.3, fogDist: 900, lights: { gain: 0.22, minPx: 1.0 }, conn: { gain: 0.4, halo: 0 }, merge: { gain: 1.6 + 1.8 * k, minPx: 1.3 + 0.7 * k }, main: { gain: 2 + 2.5 * k, minPx: 1.4 + 1.2 * k }, violet: D.violetWorld });
  // frame-locked type has to roll with a banking camera (K.lyric places it for a level one)
  const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const rolled = (d, cam) => { const ro = ((cam.roll || 0) * Math.PI) / 180; if (!ro) return d; const b = K.basis(cam), c = Math.cos(ro), s = Math.sin(ro), r2 = b.r.map((v, i) => v * c - b.u[i] * s), u2 = b.u.map((v, i) => v * c + b.r[i] * s);
    const tf = (v) => { const x = dot(v, b.r), y = dot(v, b.u), z = dot(v, b.f); return [0, 1, 2].map((i) => x * r2[i] + y * u2[i] + z * b.f[i]); };
    return { ...d, pos: tf(d.pos.map((v, i) => v - cam.pos[i])).map((v, i) => v + cam.pos[i]), right: tf(d.right), up: tf(d.up) }; };

  return { name: '12_flight', t0, t1, frame(t) {
    if (t < tF1) return D.shotD(t);
    if (t < tF3) { const k = sm(seg(t, tF2, 218.2)), hi = sm(seg(t, tF2 - 0.6, tF2 + 1.6)), lo = sm(seg(t, 218.0, 220.3));
      const camera = chase(t, { back: lerp(0.5, 0.3, lo), up: lerp(lerp(30, 36, hi), 4.5, lo), lead: lerp(1.1, 0.8, lo), down: lerp(lerp(24, 46, hi), 3, lo), fov: lerp(46, 40, lo), side: lerp(22, 0, hi), bank: 9 });
      const type = (t < tF2 - 0.15 ? [K.lyric(20, camera, { font: 'hook', px: 104, x: -0.92, y: 0.36, rows: [2, 3], dist: 80, out: tF2 - 0.15, fade: 0.3, reflect: false })] : [K.lyric(21, camera, { font: 'hook', px: 80, x: -0.92, y: 0.2, rows: [2, 3, 2], dist: 80, out: tF3, fade: 0.01, reflect: false })]).map((d) => rolled(d, camera));
      return { camera, env: { dawn: dawnAt(t), grade: { exposure: 1.5, bloom: 0.6 } }, world: flightWorld(k), extra: [D.roadDraw(t, { textGain: 0 }), D.lightDraw(t, { size: 0.012 * camera.mote, gain: 0.9, tail: 0.7, minPx: 2.2 })], type, hud: D.hudViolet(t) }; }
    // F3: she is waiting. The light's own glow runs up the road ahead of it.
    const camera = front(t), L = D.lightAt(t), cw = crowd(t), near = ss(t, tF3, tHit);
    hero(t);
    return { camera, env: { dawn: dawnAt(t) }, world: { text: 0.5, flow: 0.1, lights: { gain: 0.4 }, violet: D.violetWorld },
      extra: [W.glow([{ x: L[0], z: L[2], r: 5 + 0.25 * Math.abs(C[0] - L[0]), c: [0.5, 0.36, 0.95].map((q) => q * (0.25 + 0.9 * near)) }]), D.lightDraw(t, { size: 0.035, gain: 1.2, tail: 0.3, minPx: 2 })],
      type: [K.lyric(21, camera, { font: 'hook', px: 70, x: -0.93, y: 0.3, rows: [2, 3, 2], dist: 34, out: 221.6, fade: 0.4, reflect: false }), K.lyric(22, camera, { font: 'hook', px: 96, x: -0.93, y: 0.36, rows: [1, 3], dist: 34, reflect: false })], hud: K.hudMain(t, { count: cw.n }) };
  } };
}
