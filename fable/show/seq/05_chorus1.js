// 5 · bars 41-56 · 1:09.7-1:37.5 · chorus 1 (stripped); hits 69.69 and 89.80.  Notes: fable/notes/actB.md
// A  b41     "Merge me back to main"                 low, wide, in front of her: she sprints at the lens on her own merge limbs; her siblings run in from the
//                                                    sides and fuse with her at each node (8 -> 4 -> 2 around her, on b42, b43.2 and the cut)
// B  b44.3   "Every road I ran becomes the one"      high over M1: the delta of roads braids into main, 8 -> 4 ("road") -> 2 ("ran") -> 1 ("one"); the one light runs out east
// C  b49     "Fold me in again"                      side-on: her eleven lives as afterimages in their lane colours, one folds into her on every beat
// D  89.46   "Nothing that I lived can come undone"  she stops on the 89.80 hit and looks back down her road; its commits lock on, oldest first, through "undone"
import { seg, ss, lerp, sm, clamp01 } from '../kit.js';
import { hash1 } from '../../engine/src/rng.js';
import { actBGeo } from './actB_geo.js';

export default function seq(K) {
  const { bar, world: W, cast, T, E } = K; const G = actBGeo(K), A = W.almond, M = W.M1, HP = W.heroPath, MR = W.sets.merge.roads;
  const { t0, tB, tC, tD, t1, tHit, tOne, SP } = G; const white = [1, 0.93, 0.82], mixc = (a, b, u) => [0, 1, 2].map((i) => a[i] + (b[i] - a[i]) * u), mul = (c, k) => [c[0] * k, c[1] * k, c[2] * k];

  // ================= A: the runners round her. Every one is a real branch on its own merge limbs, at a legal sprint (0.92..1.12 x sprint_loop), timed
  // backwards from the node where it meets its partner; partners arrive in step (same weights, same stride).
  const GT = A.G, kids = GT.roads.map(() => []); for (let i = 1; i < GT.roads.length; i++) if (GT.roads[i].parent > 0) kids[GT.roads[i].parent].push(i);
  const tipOf = new Map(); GT.tips.forEach((tp, k) => tipOf.set(tp.road, k));
  const laneOf = (ti) => A.defs[A.merge0 + ti - 1].lane, sibOf = (ti) => { const p = GT.roads[ti].parent; return p > 0 ? kids[p].find((q) => q !== ti) : GT.roads.findIndex((q, qi) => qi > 0 && q.parent === 0 && qi !== ti); };
  const runners = [];
  function addRunner(ti, tEnd, into, key) {   // into = the runner it merges into (null: her). It is a little faster than its partner, so it comes up from behind
    const c = [ti]; let i = ti; while (kids[i].length) { const [a, b] = kids[i]; const h = laneOf(b) === laneOf(i) && laneOf(a) !== laneOf(i) ? b : a; c.unshift(h); i = h; }
    const P = new G.Path([W.sets.conn.roads[tipOf.get(c[0])], ...c.map((q) => MR[q - 1])]), v = SP * (into ? 1.15 : 1.11 + 0.03 * hash1(key * 3.7 + 1));
    const R = { P, tEnd, v, into, color: MR[c[0] - 1].def.color, id: 'runA' + runners.length };
    R.clock = (t) => (into ? into.clock(tEnd) : G.clockA(tEnd)) + ((t - tEnd) * v) / SP; runners.push(R);
    for (let k = 1; k < c.length; k++) addRunner(sibOf(c[k - 1]), tEnd - (P.len - P.off[k + 1]) / v, R, key * 2 + k);
    return R;
  }
  const hc = A.chains[A.km].merge.map((i) => i - A.merge0 + 1);                   // her merge limbs (tree indices), tip -> M1
  for (let j = 0; j < 3; j++) addRunner(sibOf(hc[j]), G.NT[j + 1], null, 7 + j * 31);
  const FL = { ambient: [0.05, 0.06, 0.16] };                                     // night: a darker body, so the band, the straps and the rim carry her
  const far = (fog, air) => { const o = { fogDist: fog, nodeAir: air }; return { fork: o, merge: o, conn: o, named: o, art: o, violet: o }; };   // night air for everything far away (lines and commit nodes): a calm horizon
  const frA = (t) => K.frameOf((q) => HP.at(G.sA(q)), t, 0.7);

  // ================= B: the delta from above. The last six levels of the merge tree drawn again as rivers: a limb's width is what it carries.
  const braid = E.roads(MR.filter((r) => r.def.depth <= 6).map((r) => ({ pts: r.def.pts, g: r.def.g, color: r.def.color, width: 1.0 * Math.pow(0.74, r.def.depth - 1), nodes: [{ u: 1, r: 2.4 * Math.pow(0.8, r.def.depth - 1) }] })), { step: 2.0 });
  // main east of M1, written by the one light (B) and then by her feet (C, D)
  const gkE = []; { let pu = -1; for (let t = tOne; t <= tHit + 0.31; t += 0.1) { const u = Math.max(pu + 1e-5, Math.min(1, (G.mainX(t) - M[0]) / (G.stopX - M[0]))); gkE.push([u, t]); pu = u; } gkE[gkE.length - 1][0] = 1; }
  const east = E.roads([{ pts: [[M[0], 0], [(M[0] + G.stopX) / 2, 0], [G.stopX, 0]], smooth: false, gk: gkE, color: W.col('main'), width: 1.25 }], { step: 1.0 });
  const LB = E.lights(64);
  const flashes = []; for (const [d, big] of [[3, 0.55], [2, 0.75], [1, 1], [0, 1.7]]) for (const r of MR) if (r.def.depth === d + 1) { const e = r.at(r.len - 0.01); if (!flashes.some((f) => f.t === W.TM[d] && Math.hypot(f.x - e.x, f.z - e.z) < 1)) flashes.push({ t: W.TM[d], x: e.x, z: e.z, c: r.def.color, big }); }
  const camB = K.camPath([{ t: tB, pos: [M[0] + 120, 150, 50], target: [M[0] - 150, 0, 34], fov: 35 }, { t: tOne, pos: [M[0] + 196, 150, 46], target: [M[0] - 56, 0, 26], fov: 35 }, { t: tC, pos: [M[0] + 182, 135, 42], target: [M[0] - 34, 0, 22], fov: 35 }]);

  // ================= C: the fan. Copy i is her, a moment ago (the same footprints), in the lane colour of life i; on beat i+1 it has caught her up.
  const beatC = T.beatAt(tC), DT = 0.108, lives = W.lives, NF = lives.length;
  const foldQ = (t) => { const b = T.beatAt(t) - beatC; if (b <= 0) return 0; const k = Math.floor(b), f = b - k; return Math.min(NF, k + Math.pow(sm(seg(f, 0.3, 1)), 1.6)); };
  // commits on main east of M1: one per bar line she ran (the HUD's hash ticks on the bar line), written as she passes
  const barX = [48, 49, 50, 51].map((b) => ({ x: G.mainX(bar(b)), g: bar(b) }));
  const dot = (x, z, g, r) => ({ pts: [[x - 0.4, z], [x + 0.4, z]], smooth: false, gs: [1e9, 1e9], color: W.col('main'), width: 0.01, nodes: [{ u: 0.5, r, g }] });
  const commits = E.roads(barX.map((q) => dot(q.x, 0, q.g, 0.22)), { step: 1 });

  // ================= D: her road's commits, oldest first: the root, her ten merges, the bar lines on main, HEAD under her feet. They lock on eighth notes,
  // the last one on b56.4 (97.08), one beat before the crash.
  const locks = [{ x: 0, z: 0 }, ...hc.map((ti) => { const r = MR[ti - 1], e = r.at(r.len - 0.01); return { x: e.x, z: e.z }; }), ...barX.map((q) => ({ x: q.x, z: 0 })), { x: G.stopX, z: 0 }];
  const bLast = Math.round(T.beatAt(bar(56))) + 3; locks.forEach((q, i) => { q.t = T.beatTime(bLast - (locks.length - 1 - i) * 0.5); q.g = i === 0 ? W.TF[0] : i <= 10 ? W.TM[10 - i] : G.headAtX(q.x); });
  const lockR = E.roads(locks.map((q) => dot(q.x, q.z, q.t, 0.3)), { step: 1 });
  const lockG = (t) => { if (t <= locks[0].t) return -1e3; for (let i = 0; i < locks.length - 1; i++) if (t <= locks[i + 1].t) return lerp(locks[i].g, locks[i + 1].g, (t - locks[i].t) / (locks[i + 1].t - locks[i].t)); return 1e3; };
  const gazeG = (t) => { const k = [[92.0, G.headAtX(G.stopX)], [92.25, 90.5], [92.9, tOne], [93.3, t0], [93.75, 20]]; if (t <= k[0][0] || t >= k[4][0]) return -1e3; let i = 0; while (t > k[i + 1][0]) i++; return lerp(k[i][1], k[i + 1][1], (t - k[i][0]) / (k[i + 1][0] - k[i][0])); };
  const sx = G.stopX;
  const camD = K.camPath([{ t: tD, pos: [sx + 5.7, 1.25, 1.7], target: [sx - 30, 0.3, -2.4], fov: 35 }, { t: 93.6, pos: [sx + 5.0, 1.45, 2.0], target: [sx - 30, 0.0, -2.1], fov: 35 }, { t: t1, pos: [sx + 4.4, 1.75, 2.35], target: [sx - 30, -0.6, -1.8], fov: 35 }]);

  return { name: '05_chorus1', t0, t1, frame(t) {
    return K.cut(t, [
      { t0, f: () => {
        const a = HP.at(G.sA(t)), f = frA(t), u = seg(t, t0, tB), tau = G.tauA(t), d = lerp(3.1, 2.35, sm(u));
        const camera = { pos: K.rel(f, d, 0.05, 0.28), target: K.rel(f, 0, 0.72, 1.04), fov: 48, focusDist: d, aperture: 0.035 };
        let flash = 0; const glows = [], clear = [[a.x, a.z, 2.5]];
        for (const R of runners) { const dt = t - R.tEnd;
          if (dt > 0) { if (dt < 1.5) { const k = Math.exp(-dt * 4), e = R.P.at(R.P.len - 0.01); glows.push({ x: e.x, z: e.z, r: 1.2 + 3.5 * (1 - k), c: mul(mixc(R.color, white, 0.4), 1.6 * k) }); if (!R.into) flash += k; } continue; }
          const s = R.P.len + R.v * dt; if (s < 0) continue; const q = R.P.at(s);
          cast.actor(R.id, { lane: R.color }).set({ pos: [q.x, 0, q.z], yaw: Math.atan2(q.tx, q.tz), track: 'sprint_loop', time: R.clock(t), alpha: 1 - ss(t, R.tEnd - 0.2, R.tEnd + 0.02), gain: 0.8 }); clear.push([q.x, q.z, 2.5]); }
        cast.actor('hero').set({ pos: [a.x, 0, a.z], yaw: K.yawOf(a), track: 'sprint_loop', time: G.clockA(t), gain: 1 + 1.3 * flash });
        return { camera, env: { figLight: FL }, world: false, extra: [...W.draw(tau, { text: 0.8, flow: 0.2, flowSpeed: 9, ...far(80, 70), lights: { clear, gain: 0.4, air: 160 }, merge: { headGain: 2, headLen: 0.12, fogDist: 80, nodeAir: 70 } }), W.glow(glows)],
          type: [K.lyric(7, camera, { font: 'hook', x: -0.93, y: 0.40, rows: [2, 3], dist: 30, px: 72, reflGain: 0.04 })], hud: K.hudMain(t, { count: W.count(tau) }) }; } },
      { t0: tB, f: () => {
        const camera = { ...camB(t), far: 30000 }, one = t >= tOne, hx = G.mainX(t);
        const d = new Float32Array(64 * 7); let n = 0; const put = (x, z, c, g, rad) => { d.set([x, 0.6, z, c[0] * g, c[1] * g, c[2] * g, rad], n * 7); n++; };
        for (const r of MR) if (r.def.depth <= 3 && t >= r.g0() && t < r.g1()) { const q = r.at(Math.min(r.len - 0.01, r.sAtG(t))); put(q.x, q.z, mixc(r.def.color, white, 0.35), 7, 1.5 - 0.2 * r.def.depth); }
        if (one) put(hx, 0, mixc(W.col('main'), white, 0.45), 9, 1.5);
        const glows = flashes.filter((f) => t >= f.t && t < f.t + 2.5).map((f) => { const k = Math.exp(-(t - f.t) * 2.0); return { x: f.x, z: f.z, r: (14 + 38 * (1 - k)) * f.big, c: mul(mixc(f.c, white, 0.35), 1.5 * k) }; });
        const grow = one ? 1 : 0.0;
        return { camera, env: { ground: { base: K.hex('#070B34'), fogAmt: 0.1 } },
          world: { text: 0.45, flow: 0.3, flowSpeed: 12, minPx: 1.7, halo: 0.3, haloPx: 5, headGain: 2.5, headLen: 0.25, canopy: { gain: 2.4 }, lights: { gain: 0.3, minPx: 1.3 }, nodeMinPx: 1.2, conn: { gain: 0.2, halo: 0 }, art: { hide: true }, main: { head: G.headAtX(hx), gain: 0.01, textGain: 0 } },
          extra: [W.glow(glows), braid.drawable({ head: t, gain: 1.9, minPx: 1.4, halo: 0.45, haloPx: 9, headGain: 3.5, headLen: 0.22, flow: 0.45, flowSpeed: 10, nodeMinPx: 2.5 }),
            east.drawable({ head: t, gain: 2.3 * grow, minPx: 2, halo: 0.5, haloPx: 12, headGain: 4, headLen: 0.35, flow: 0.4, flowSpeed: 10 }), LB.drawable(d, n, { minPx: 2.5 })],
          type: [K.lyric(8, camera, { font: 'hook', mode: 'ground', x: -0.9, y: -0.86, rows: [2, 2, 3], px: 72 })], hud: K.hudMain(t, { count: W.count(t) }), flash: one ? 0.22 * Math.exp(-(t - tOne) * 5) : 0 }; } },
      { t0: tC, f: () => {
        const hx = G.heroX(t), u = seg(t, tC, tD), q = foldQ(t), bt = T.beatAt(t) - beatC;
        const pu = sm(seg(t, tC + 0.4, tD)), camera = { pos: [hx + 1.7 - 0.9 * pu, 1.0 - 0.1 * pu, 5.5 - 1.9 * pu], target: [hx - 1.3 + 0.75 * pu, 1.22 - 0.14 * pu, 0], fov: 35, aperture: 0.03 };   // the fan shortens as it folds: the camera closes in on her
        const glows = []; let flash = 0, last = -1;
        for (let i = 0; i < NF; i++) { const s = i + 1 - q, ln = lives[i].lane, c = W.col(ln);
          if (s <= 0) { const k = Math.exp(-(bt - (i + 1)) * 2.6); if (k > 0.02) { glows.push({ x: hx, z: 0, r: 1.3 + 2.2 * (1 - k), c: mul(c, 1.3 * k) }); flash += k; } last = i; continue; }
          const tt = t - s * DT, b = G.body(tt);
          cast.actor('fan' + i, { lane: ln }).set({ ...b, pos: [b.pos[0], 0, -0.16 * s], alpha: 0.9 * Math.min(1, s * 1.6) - 0.03 * s, gain: 1.4, trail: { len: 0.22, gain: 1.6, width: 0.02, color: c, mask: ['handL', 'handR', 'hemL', 'hemR'] } });
          glows.push({ x: G.heroX(tt), z: -0.16 * s, r: 0.9, c: mul(c, 0.5) }); }
        cast.actor('hero').set({ ...G.body(t), gain: 1 + 0.9 * Math.min(1.5, flash) });
        const just = last >= 0 && bt - (last + 1) < 1 && last < NF ? lives[last].name : null;
        return { camera, env: { figLight: FL }, world: { text: 0.8, flow: 0.15, ...far(40, 40), main: { head: G.headAtX(hx), fogDist: 260 }, lights: { clear: [[hx, 0, 6]], gain: 0.35, air: 120 } }, extra: [W.glow(glows), commits.drawable({ head: t, gain: 1.3 })],
          type: [K.lyric(9, camera, { font: 'hook', x: -0.93, y: 0.44, rows: [1, 3], dist: 34 })], hud: K.hudMain(t, { count: 1, branch: just ? 'main ← ' + just : 'main' }) }; } },
      { t0: tD, f: () => {
        const camera = camD(t), hx = G.heroX(t);
        cast.actor('hero').set(G.body(t));                                                  // at rest on the hit; the look-back over her right shoulder begins at 91.8
        const glows = []; for (const q of locks) if (t >= q.t) { const k = Math.exp(-(t - q.t) * 3.5), dist = Math.hypot(q.x - camera.pos[0], q.z - camera.pos[2]); glows.push({ x: q.x, z: q.z, r: Math.max(0.8, dist * 0.022) * (1 + 0.6 * k), c: mul([1.0, 0.5, 0.16], 0.5 + 1.6 * k) }); }
        const hit = Math.exp(-Math.max(0, t - tHit) * 3.5) * (t >= tHit ? 1 : 0);
        if (hit > 0.02) glows.push({ x: hx, z: 0, r: 1 + 5 * (1 - hit), c: mul([1.0, 0.55, 0.25], 1.2 * hit) });
        return { camera, env: { figLight: FL }, world: { text: 0.8, flow: 0.1, ...far(90, 80), pulses: [{ g: gazeG(t), width: 0.7, gain: 3 }, { g: lockG(t), width: 0.5, gain: 3.5 }], lights: { gain: 0.4, air: 160, clear: [[hx, 0, 6]] }, main: { head: G.headAtX(hx), fogDist: 260 } },
          extra: [W.glow(glows), commits.drawable({ head: t, gain: 1.2 }), lockR.drawable({ head: t, gain: 3.2, nodeMinPx: 2.2 })],
          type: [K.lyric(10, camera, { font: 'hook', x: -0.93, y: 0.30, rows: [2, 2, 3], dist: 34, px: 70, out: t1, fade: 0.01, reflGain: 0.03 })], hud: K.hudMain(t, { count: 1 }) }; } },
    ], t1);
  } };
}
