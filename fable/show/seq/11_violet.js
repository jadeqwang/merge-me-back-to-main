// 11 · bars 105-120 · 3:01.0-3:28.8 (its last shot runs on to 210.96, "me", inside 12_flight) · verse 2 over full drums; drums and bass cut on b117 (201.86)
// Deep night, far out. The violet branch, alone: hair up in a bun, two pencils through it. HUD jade/1420-mhz, ctx 97% -> 100%.
// A  b105    "This branch may never find the way"   side truck: she runs, left to right, large in frame
// B  b109    "Back to the place where I began"      she slows, stops at the end of her road and looks east: a faint warm band on the horizon, a few far lights
// C  b113    "And maybe something that I learned"   over her right shoulder: she draws a pencil and writes. The ribbon of light leaves the pencil's lead and settles into
//                                                    her handwriting: docs: start here. b117 (201.86), drums out: the line lets go of its place and gathers into one mote in her hands
// D  b118    "(home) to who I'll be again"          from her right: the mote leaves east; she lowers herself, hugs her knees, looks up. ctx 100%. Her body dims to its accents;
//                                                    the camera lifts away; she stays, a small steady light at the end of her road. ("Merge", 208.13, is sung over her.)
// Everything the act shares (her light's path, the hand, the road's end) is built here and handed on in K.shared.actD.
import { seg, ss, sm, lerp, clamp01 } from '../kit.js';
import { write } from './actd_hand.js';

export default function seq(K) {
  const { bar, world: W, cast, T, VIOLET, E } = K; const t0 = bar(105), t1 = bar(121), tGo = bar(117), D2R = Math.PI / 180;
  const VT = 'violet', tV = cast.songT0(VT) || t0, ev = (n, d) => tV + (cast.event(VT, n) ?? d);
  const tPencil = ev('pencil', 14.985) + 0.45, tW0 = ev('write_start', 15.405), tW1 = ev('write_end', 19.905), tSeated = ev('seated', 25.905);
  const tC = bar(113), tD = bar(118), tEnd = T.words(20)[1].start;      // D ends on "me" (210.96): "Merge" belongs to her, "me back to main" to the light

  // ---- the end of her road. The take (`violet`) looks to her LEFT at the far glow, lets the light go to her left and, seated, looks up to her right. On the world's
  // violet road (which ends heading north-east) those are the empty north, and nowhere. So this act draws its own last 500 m: the road keeps bending right and comes
  // into the same end point (VEND) heading 19 degrees east of due south, straight at CATCH, 1.6 km away. Then her left is east (the dawn), ahead is main, and
  // up-right is the sky over the root. (To make the map agree, see fable/notes/actD.md.)
  const WP = W.violetPath, V = W.VEND, TH = 19 * D2R, hE = [Math.sin(TH), Math.cos(TH)], RAD = 46, LAST = 14, rt = (th) => [-Math.cos(th), Math.sin(th)];
  const A1 = [V[0] - LAST * hE[0], V[1] - LAST * hE[1]], CC = [A1[0] + RAD * rt(TH)[0], A1[1] + RAD * rt(TH)[1]], onC = (th) => [CC[0] - RAD * rt(th)[0], CC[1] - RAD * rt(th)[1]];
  const sJ = WP.len - 440, J = WP.at(sJ); let thJ = Math.atan2(J.tx, J.tz); for (let i = 0; i < 40; i++) { const S = onC(thJ); thJ = Math.atan2(S[0] - J.x, S[1] - J.z); }
  const pts = [-120, -80, -40, 0].map((d) => { const p = WP.at(sJ + d); return [p.x, p.z]; });
  { const S = onC(thJ), n = Math.max(2, Math.round(Math.hypot(S[0] - J.x, S[1] - J.z) / 45)); for (let i = 1; i < n; i++) pts.push([J.x + (S[0] - J.x) * i / n, J.z + (S[1] - J.z) * i / n]);
    const na = Math.ceil((thJ - TH) / (9 * D2R)); for (let i = 0; i <= na; i++) pts.push(onC(thJ + (TH - thJ) * i / na)); pts.push([V[0] - LAST * 0.5 * hE[0], V[1] - LAST * 0.5 * hE[1]], [V[0], V[1]]); }
  const gJ = WP.gAt(sJ - 120), rdef = { pts, color: W.col('violet'), width: 0.04, text: VIOLET.name + '  ' + VIOLET.text, textSize: 0.34, textSide: 1, flip: true, nodes: [{ u: 1, r: 0.12 }], g: [0, 0] };
  { const L = E.roads([rdef], { step: 1.0 }).roads[0].len; rdef.gk = [[0, gJ], [1 - 56 / L, bar(105)], [1 - 19 / L, T.line(17).start], [1 - 0.5 / L, 190.6], [1, tGo]]; delete rdef.g; }
  const LR = E.roads([rdef], { step: 1.0 }), P = LR.roads[0];
  // world options for every shot of the act that can see her road: the world's own violet road stops where this one takes over
  const roadDraw = (t, o = {}) => LR.drawable({ head: o.head ?? t, gain: 2.4, textGain: 0.85, flow: 0.12, ...o });
  const violetWorld = { head: gJ };

  // ---- she rides it. `violet` is one 30 s take with its own root motion: her hips are where the track's forward travel puts her, counted back from where she stands.
  const TR = cast.tracks[VT] || cast.tracks.idle, zStand = cast.root(VT, 12)[2];
  const sAt = (t) => Math.min(P.len - 0.05, Math.max(0, P.len - 0.3 - (zStand - cast.root(VT, t - tV)[2]))), posAt = (t) => P.at(sAt(t));
  const headAt = (t) => Math.max(t, P.gAt(Math.min(P.len, sAt(t) + 0.25)));          // her road is written under her feet
  const place = (t) => K.ride(VT, t - tV, posAt(t));
  const qrot = (q, v) => { const x = q[0], y = q[1], z = q[2], w = q[3], cx = y * v[2] - z * v[1] + w * v[0], cy = z * v[0] - x * v[2] + w * v[1], cz = x * v[1] - y * v[0] + w * v[2];
    return [v[0] + 2 * (y * cz - z * cy), v[1] + 2 * (z * cx - x * cz), v[2] + 2 * (x * cy - y * cx)]; };
  // world position of a point given in a joint's own frame, at song time t (the track's joint transforms, placed where she rides)
  const jw = (t, j, v = [0, 0, 0]) => { const D = TR.data, tk = Math.min((TR.frames - 1) / TR.fps, Math.max(0, t - tV)) * TR.fps, f0 = Math.min(TR.frames - 2, Math.floor(tk)), u = tk - f0, a = f0 * 147 + j * 7, b = a + 147;
    let dq = 0; for (let i = 0; i < 4; i++) dq += D[a + 3 + i] * D[b + 3 + i]; const sg = dq < 0 ? -1 : 1;
    const q = [0, 1, 2, 3].map((i) => D[a + 3 + i] + (sg * D[b + 3 + i] - D[a + 3 + i]) * u), l = Math.hypot(...q) || 1, r = qrot(q.map((c) => c / l), v);
    const p = [0, 1, 2].map((i) => D[a + i] + (D[b + i] - D[a + i]) * u + r[i]), pl = place(t), o = cast.rot(pl.yaw, p[0], p[2]); return [pl.pos[0] + o[0], p[1], pl.pos[2] + o[1]]; };
  const JC = 2, JH = 4, JL = 8, JR = 12, TIP = (cast.fig && cast.fig.body && cast.fig.body.pencilTip) || [-0.0481, 0.2, 0.0591];
  const tipAt = (t) => jw(t, JR, TIP);
  const S0 = P.at(P.len - 0.3), fr = { x: S0.x, z: S0.z, tx: hE[0], tz: hE[1] }, EAST = [1, 0, 0];     // where she stands, facing the way her road ends

  // ---- the writing. The pencil's lead travels 0.93 m, her left to her right, between tW0 and tW1. The words are laid along that travel in her hand; every point of
  // ink is born at the lead at the moment the hand is over its letter (letters in order, strokes in order) and settles into the letter over a few tenths of a second.
  const HW = write(VIOLET.last, { seed: 7 }), NS = 541, tipS = [], prog = new Float32Array(NS); for (let k = 0; k < NS; k++) tipS.push(tipAt(tW0 + (tW1 - tW0) * k / (NS - 1)));
  const A = tipS[0], Z = tipS[NS - 1], wl = Math.hypot(Z[0] - A[0], Z[2] - A[2]) || 1, wd = [(Z[0] - A[0]) / wl, 0, (Z[2] - A[2]) / wl];
  for (let k = 1; k < NS; k++) prog[k] = Math.max(prog[k - 1], (tipS[k][0] - A[0]) * wd[0] + (tipS[k][2] - A[2]) * wd[2]);
  const Pm = prog[NS - 1], xh = Pm / HW.width, mean = (a, b) => { let s = 0; for (let k = a; k < b; k++) s += tipS[k][1]; return s / (b - a); }, yA = mean(0, 60), yZ = mean(NS - 60, NS);
  const tOfProg = (p) => { if (p <= 0) return tW0; let k = 1; while (k < NS - 1 && prog[k] < p) k++; const a = prog[k - 1], b = prog[k]; return tW0 + (tW1 - tW0) * (k - 1 + (b > a ? Math.min(1, (p - a) / (b - a)) : 1)) / (NS - 1); };
  const tipI = (t) => { const x = Math.min(NS - 1.001, Math.max(0, (t - tW0) / (tW1 - tW0) * (NS - 1))), i = Math.floor(x), u = x - i; return [0, 1, 2].map((j) => tipS[i][j] + (tipS[i + 1][j] - tipS[i][j]) * u); };
  const NI = HW.pts.length, ink = new Float32Array(NI * 8);                      // final xyz, born-at xyz, birth time, pressure
  HW.pts.forEach((p, i) => { const ta = tOfProg(p.gx0 * xh), tb = tOfProg(Math.min(Pm, p.gx1 * xh)), ti = ta + (tb - ta) * p.u, b = tipI(ti), x = p.x * xh;
    ink.set([A[0] + wd[0] * x, yA + (yZ - yA) * (p.x / HW.width) - 0.5 * xh + p.y * xh, A[2] + wd[2] * x, b[0], b[1], b[2], ti, p.k], i * 8); });
  const lineMid = [A[0] + wd[0] * Pm * 0.5, (yA + yZ) / 2, A[2] + wd[2] * Pm * 0.5];

  // ---- her light. It gathers in her open hands (tGo .. tL), lifts out of them and leaves east, slowly, then not slowly; it bends south toward main, crosses the merge
  // of the thousand roads and comes in along main to CATCH, into main-Jade's chest on b129. One path, a function of song time.
  const tL = tGo + 1.0, tK = 207.6, M = W.M1, C = W.CATCH;
  const hold = (t) => { const a = jw(t, JR, [0, 0.14, 0.04]), b = jw(t, JL, [0, 0.14, 0.04]); return [(a[0] + b[0]) / 2, Math.max(a[1], b[1]) + 0.06, (a[2] + b[2]) / 2]; };
  const H0 = hold(tL), early = (t) => { const u = t - tL, s = 0.6 * u * u + 0.02 * u ** 5; return [H0[0] + s, H0[1] + 0.3 * (1 - Math.exp(-u / 0.7)) + 0.07 * s, H0[2] + 0.02 * s]; };
  // main-Jade stands at CATCH facing west and plays `catch` (song_t0 220.0): the light lands between her hands, at her chest, on b129
  const tCa = cast.songT0('catch') || 220.0, cj = (t, j) => { const r = cast.root('catch', t - tCa, j), o = cast.rot(-Math.PI / 2, r[0], r[2]); return [C[0] + o[0], r[1], o[1]]; };
  const held = (t) => { const a = cj(t, JL), b = cj(t, JR), c = cj(t, JC), k = ss(t, 228.6, 230.2); return [lerp((a[0] + b[0]) / 2 - 0.05, c[0] - 0.13, k), lerp((a[1] + b[1]) / 2 + 0.02, c[1] + 0.04, k), lerp((a[2] + b[2]) / 2, c[2], k)]; };
  const chest = held(bar(129));
  const fly = K.camPath([[tK - 0.4, early(tK - 0.4)], [tK, early(tK)], [208.8, [V[0] + 150, 28, V[1] + 14]], [210.0, [V[0] + 290, 52, V[1] + 120]], [tEnd, [V[0] + 310, 68, V[1] + 290]], [212.3, [V[0] + 200, 80, V[1] + 520]],
    [213.6, [V[0] + 30, 84, V[1] + 760]], [T.line(21).start, [V[0] - 130, 80, V[1] + 1010]], [216.2, [M[0] - 190, 66, -270]], [217.2, [M[0] - 130, 50, -110]], [218.2, [M[0] - 10, 36, -22]], [bar(127), [M[0] + 170, 24, 0]],
    [220.5, [C[0] - 150, 10, 0]], [221.8, [C[0] - 40, 3.2, 0]], [222.4, [C[0] - 8, 1.8, 0]], [bar(129), chest]].map(([t, pos]) => ({ t, pos, target: [0, 0, 0] })));
  const lightAt = (t) => (t <= tL ? hold(Math.max(tGo, t)) : t < tK ? early(t) : t < bar(129) ? fly(t).pos : held(t));
  // the mote: a hot violet-white head, a halo, and a tail of where it has just been (long when it is fast). o: { gain, size (head radius, m), tail (s), minPx }
  const LL = E.lights(160), VC = K.hex(K.LANE.violet);
  const lightDraw = (t, o = {}) => { const d = new Float32Array(160 * 7), g = (o.gain ?? 1) * 20, sz = o.size ?? 0.012, tail = o.tail ?? 0.5, N = 120; let n = 0; const p = lightAt(t);
    const put = (q, k, w, r) => { d.set([q[0], q[1], q[2], (VC[0] + w) * g * k, (VC[1] + w) * g * k, (VC[2] + w * 1.1) * g * k, r], n * 7); n++; };
    put(p, 2.4, 1.4, sz); put(p, 0.1, 0.5, sz * 2.3);
    for (let j = 1; j <= N; j++) { const u = j / N, tj = t - tail * u * u; if (tj < tL) break; put(lightAt(tj), 0.5 * (1 - u) * (1 - u) * Math.min(1, j / 3), 0.25, sz * (0.7 - 0.45 * u)); }
    return LL.drawable(d, n, { minPx: o.minPx ?? 1.5, reflGain: 0.8 }); };

  // ---- the ribbon: the ink as beads of light, close enough to be a line. After tGo each bead lets go of its place and is drawn into the mote.
  const LI = E.lights(NI + 8), h1 = K.rng.hash1; let far = 1e-6; for (let i = 0; i < NI; i++) far = Math.max(far, Math.hypot(ink[i * 8] - H0[0], ink[i * 8 + 2] - H0[2]));
  const ribbon = (t, o = {}) => { const d = new Float32Array((NI + 8) * 7), g = o.gain ?? 1, mo = t > tGo ? lightAt(t) : null, loose = ss(t, tGo, tGo + 0.4); let n = 0, got = 0;
    for (let i = 0; i < NI; i++) { const k = i * 8, ti = ink[k + 6]; if (t < ti) break; const a = t - ti, r = Math.exp(-a / 0.17), fresh = Math.exp(-a / 0.35), pr = ink[k + 7];
      let x = ink[k] + (ink[k + 3] - ink[k]) * r, y = ink[k + 1] + (ink[k + 4] - ink[k + 1]) * r, z = ink[k + 2] + (ink[k + 5] - ink[k + 2]) * r, br = (0.5 + 0.5 * pr) * (1 + 2.6 * fresh), rad = (0.0021 + 0.0020 * pr) * (1 + 0.5 * fresh);
      y += 0.0016 * Math.sin(t * 1.7 + ink[k] * 9);                                                                     // it floats: never a frozen frame
      if (mo) { const dd = Math.hypot(ink[k] - H0[0], ink[k + 2] - H0[2]) / far, e = sm(seg(t, tGo + 0.12 + 0.36 * dd, tGo + 0.5 + 0.42 * dd)), e2 = e * e * (3 - 2 * e);
        y += 0.02 * loose * (1 - e) + 0.05 * Math.sin(Math.PI * e) * (h1(i * 3 + 1) - 0.3); x += 0.006 * loose * (h1(i * 5 + 2) - 0.5) * (1 - e); z += 0.006 * loose * (h1(i * 7 + 3) - 0.5) * (1 - e);
        x += (mo[0] - x) * e2; y += (mo[1] - y) * e2; z += (mo[2] - z) * e2; br *= (1 - e) * (1 + 1.5 * e); rad *= 1 - 0.5 * e; got += e; if (e >= 1) continue; }
      d.set([x, y, z, (VC[0] + 0.55) * 0.34 * br * g, (VC[1] + 0.55) * 0.34 * br * g, (VC[2] + 0.6) * 0.34 * br * g, rad], n * 7); n++; }
    if (t >= tW0 - 0.05 && t < tW1 + 0.25) { const p = tipAt(t), k = ss(t, tW0 - 0.05, tW0 + 0.1) * (1 - ss(t, tW1, tW1 + 0.25)); d.set([p[0], p[1], p[2], 9 * k * g, 8 * k * g, 11 * k * g, 0.006], n * 7); n++; }   // the lead, alight
    return { draw: LI.drawable(d, n, { minPx: 1.0, reflGain: 0.75 }), got: got / NI }; };
  // "for whoever I am next": small, mono, under the line, for a moment (it goes with the line)
  const noteLine = (t) => ({ text: VIOLET.note, raw: true, font: 'mono', size: 0.03, pos: [A[0] + wd[0] * 0.17, Math.min(yA, yZ) - 0.5 * xh - 0.085, A[2] + wd[2] * 0.17], right: wd, up: [0, 1, 0], align: 'left', color: '#D8C8FF', gain: 1.5,
    t0: 199.72, wipe: true, wipeDur: 0.3, stagger: 0.2, t1: tGo + 0.05, fade: 0.5, reflGain: 0.4 });

  // ---- HUD: her context fills; it is full as she comes to rest. Her last commit is the note: the hash does not change after it.
  const ctxAt = (t) => (t < tC ? lerp(0.97, 0.982, seg(t, t0, tC)) : t < tGo ? lerp(0.982, 0.992, seg(t, tC, tGo)) : t < tSeated ? lerp(0.992, 0.994, seg(t, tGo, tSeated)) : 1);     // 99% until she has come to rest; then it is full
  const hud = (t) => ({ branch: VIOLET.name, color: K.LANE.violet, ctx: ctxAt(t), ...(t >= tGo ? { hash: E.hashAt(tGo + 0.05) } : {}) });
  // ---- night light. `dim` 0..1: her body goes down to its accents (band, straps, the pencil left in her bun)
  const dawnAt = (t) => lerp(0.03, 0.12, ss(t, t0 + 3, 191)) + 0.02 * seg(t, 191, tEnd);
  const figLight = (dim = 0) => ({ under: 0.4 * (1 - dim), fibres: 0.8 * (1 - dim), ambient: [0.105 * (1 - 0.9 * dim), 0.118 * (1 - 0.9 * dim), 0.27 * (1 - 0.88 * dim)], rimBoth: 0.5 * (1 - dim), emissive: 2.0 + 0.5 * dim });
  const env = (t, dim = 0, o = {}) => ({ dawn: dawnAt(t), figLight: figLight(dim), grade: { exposure: 1.6, bloom: 0.62, ...o } });
  const world = (t, o = {}) => ({ text: 0.85, flow: 0.12, lights: { gain: 0.5 }, violet: violetWorld, ...o });
  // far lights on the eastern horizon: where main's morning is (a handful, small, warm)
  const LF = E.lights(16), farLights = (t) => { const d = new Float32Array(16 * 7), c = K.hex(K.LANE.main); let n = 0; for (let i = 0; i < 9; i++) { const a = (h1(i * 17 + 3) - 0.5) * 0.3, r = 700 + 500 * h1(i * 5 + 1), tw = 0.8 + 0.2 * Math.sin(t * (1.3 + h1(i)) + i * 2.1), k = 40 * (0.35 + h1(i * 7)) * tw;
    d.set([V[0] + r * Math.cos(a), 2.5, V[1] + r * Math.sin(a), (c[0] + 0.25) * k, (c[1] + 0.2) * k, (c[2] + 0.12) * k, 1.1], n * 7); n++; } return LF.drawable(d, n, { minPx: 1.2 }); };
  const eastGlow = (t) => W.glow([{ x: V[0] + 2400, z: V[1], r: 1500, c: [0.5, 0.2, 0.1].map((q) => q * (0.5 + 5 * dawnAt(t))) }]);
  // her body: the pencil is in her bun, then in her hand (from tPencil), then it is the light (from tGo)
  const who = (t, o = {}) => cast.actor('violet', { lane: 'violet', variant: 'violet' }).set({ ...place(t), track: VT, time: t - tV, vary: 0, pencil: t >= tGo ? 'gone' : t >= tPencil ? 'hand' : undefined, ...o });
  const selfLight = (t, k, sz = 1) => { const c = jw(t, JC, [0, 0.05, 0.12]), d = new Float32Array(14); d.set([c[0], c[1], c[2], (VC[0] + 0.5) * 16 * k, (VC[1] + 0.5) * 16 * k, (VC[2] + 0.5) * 16 * k, 0.035 * sz, c[0], c[1], c[2], VC[0] * 1.2 * k, VC[1] * 1.2 * k, VC[2] * 1.2 * k, 0.1 * sz]); return LS.drawable(d, 2, { minPx: 2.2 }); };
  const LS = E.lights(4);

  // ---- D, the sit (203.60 - 210.96). One shot: medium from her right while she lowers herself and looks up; then the camera lifts away.
  const tLift = T.words(20)[0].start;                                           // "Merge" (208.13): the camera begins to leave
  const shotD = (t) => { const lift = sm(seg(t, tLift, tEnd + 0.35)), l2 = lift * lift, dim = ss(t, tLift - 0.3, tLift + 2.3), u = ss(t, tD + 0.3, tSeated), dr = seg(t, tD, tLift);
    const camera = { pos: K.rel(fr, 0.8 + 0.1 * u - 4.9 * l2, 3.45 - 0.45 * u - 0.12 * dr + 4 * lift + 23 * l2, 0.92 - 0.27 * u + 1.2 * lift + 5.2 * l2), target: K.rel(fr, 0.8 + 0.1 * u - 0.55 * lift, -0.75 - 8 * lift, 0.9 - 0.3 * u + 1.85 * lift), fov: 35, aperture: 0.008 * (1 - lift) };
    camera.focusDist = Math.hypot(camera.pos[0] - fr.x, camera.pos[1] - 0.8, camera.pos[2] - fr.z);
    who(t);
    const type = [K.lyric(19, camera, { x: 0.12, y: 0.4, rows: [3, 4], dist: 30, px: 80, out: 207.45, fade: 0.5, reflGain: 0.1 })];
    if (t > tLift - 0.1) type.push(K.lyric(20, camera, { font: 'hook', px: 120, x: 0, y: 0.52, align: 'center', dist: 200, words: T.words(20).slice(0, 1), out: tEnd + 1, reflGain: 0 }));
    return { camera, env: env(t, dim, { exposure: 1.6 + 0.15 * dim }), world: world(t, { violet: violetWorld, text: 0.85 + 0.4 * lift, minPx: 1.3 + 0.9 * lift }), extra: [roadDraw(t, { head: headAt(t), textGain: 0.85 + 0.3 * lift, minPx: 1.3 + 0.5 * lift, gain: 2.4 - 0.9 * lift }), lightDraw(t, { size: 0.012 + 0.0022 * Math.hypot(lightAt(t)[0] - fr.x, lightAt(t)[2] - fr.z), gain: 1 - 0.8 * ss(t, 206.5, 209.5), tail: 0.35 }), farLights(t), eastGlow(t), selfLight(t, dim * (0.3 + 0.7 * lift), 1 + 1.4 * l2)], type, hud: hud(t) }; };

  K.shared.actD = { held, lightAt, lightDraw, roadDraw, violetWorld, shotD, tEnd, hudViolet: hud, P, fr, dawnAt }; K.shared.lightAt = lightAt;                    // (15_map draws the flight from K.shared.lightAt)
  return { name: '11_violet', t0, t1, frame(t) {
    const a = posAt(t);
    return K.cut(t, [
      // A · the run. From her right: she crosses left to right and the lens stays with her.
      { t0, f: (tt, u) => { const camera = { pos: K.rel(a, 1.7 - 1.5 * sm(u), 4.3, 1.15), target: K.rel(a, 0.75 - 0.5 * sm(u), 0, 0.98), fov: 35, focusDist: 4.4, aperture: 0.04 };
        who(t);
        return { camera, env: env(t), world: world(t), extra: [roadDraw(t, { head: headAt(t) })], type: [K.lyric(16, camera, { x: 0.2, y: 0.3, rows: [2, 2, 3], dist: 40 })], hud: hud(t) }; } },
      // B · she walks into the frame, stops, and looks east.
      { t0: bar(109), f: (tt, u) => { const k = 1 - ss(t, bar(109), 191), cam0 = K.rel(a, -3.42 - 0.5 * k, 3.08, 1.38), camera = { pos: [cam0[0] + 0.3 * u * EAST[0], cam0[1], cam0[2]], target: K.rel(a, 1.88, -5.4, 1.22), fov: 36, focusDist: 4.6, aperture: 0.04 };
        who(t);
        return { camera, env: env(t), world: world(t), extra: [roadDraw(t, { head: headAt(t) }), farLights(t), eastGlow(t)], type: [K.lyric(17, camera, { x: -0.92, y: 0.36, rows: [4, 3], dist: 30 })], hud: hud(t) }; } },
      // C · the writing, and the letting go (no cut on the drum-out: the picture holds its breath with the music).
      { t0: tC, f: () => { const push = sm(seg(t, tC, 197.4)), rise = ss(t, tGo + 0.5, tD + 0.3), camera = { pos: K.rel(fr, -2.0 + 1.2 * push - 0.1 * rise, 2.2 - 0.75 * push + 0.05 * rise, 1.5 + 0.12 * push - 0.06 * rise),
          target: [lineMid[0] + 0.22 * rise * EAST[0], lineMid[1] - 0.03 + 0.08 * (1 - push) + 0.2 * rise, lineMid[2]], fov: 35 - 5 * push, aperture: 0.02 };
        camera.focusDist = Math.hypot(camera.pos[0] - lineMid[0], camera.pos[1] - lineMid[1], camera.pos[2] - lineMid[2]);
        who(t); const rb = ribbon(t), type = [K.lyric(18, camera, { x: 0.0, y: 0.5, rows: [3, 3], dist: 30, out: 200.9, fade: 0.35, px: 74, reflect: false })];
        if (t > 199.6 && t < tGo + 0.6) type.push(noteLine(t));
        if (t >= 200.85) type.push(K.lyric(19, camera, { x: 0.0, y: 0.5, rows: [3, 4], dist: 30, px: 74, reflect: false }));
        const extra = [roadDraw(t, { head: headAt(t) }), farLights(t), eastGlow(t), rb.draw]; if (t > tGo) extra.push(lightDraw(t, { gain: 0.2 + 0.8 * rb.got, size: 0.005 + 0.007 * rb.got, tail: 0.3 }));
        return { camera, env: env(t), world: world(t), extra, type, hud: hud(t) }; } },
      { t0: tD, f: () => shotD(t) },
    ], t1);
  } };
}
