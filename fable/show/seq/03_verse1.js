// 3 · bars 17-32 · 0:27.9-0:55.8 · verse 1
// A  b17    "I split myself a thousand ways"       behind her, no cut from the swoop. ON "split" (28.62) jade/violin steps out of her (512); ON "thousand" (30.29)
//                                                  jade/piano steps out of her and jade/poet out of violin (1,024): four abreast, the counter lands on 1,024.
//                                                  On "road" (34.70) they reach their tips; the roads of the whole plain bend south and the camera banks with them.
// B  b22    "... the night could hold"             side truck from her left: she runs, brakes (sprint_stop_look) and stands; other branches run on their own roads
// C  b25    "Each one a light I sent ahead"        from behind: the light gathers in her cupped hands, leaves ON "light" (43.33) and runs ahead writing her road
// D  b27    (a thousand do)                        the camera flies with the comets: an orderly fan of lit road heads racing for the horizon
// E  b28-32 "Each one a story to unfold"           the lives, one bar each, each with ONE prop in light lines: piano, violin, poet, nasa; b32 band ("And every branch")
//
// The world does the staging (world.js `reshape`, `connRun`): every Jade runs her last limbs at one steady speed, sprints on from her tip, brakes with
// sprint_stop_look's own travel and stands 22.5 m along her connector. So the hero and the lives are simply played ON their roads at the world's clock;
// nobody is slid, and the road is written under their feet (head = t everywhere).
import { seg, ss, sm, lerp, clamp01 } from '../kit.js';
import { makeProps } from '../props.js';

// The lives' vignettes (also used by seq 4). face: degrees she is turned from her road toward the camera; start: track time at the cut (own clock).
export const LIFE = {
  'jade/piano': { track: 'life_piano', prop: 'piano', dist: 4.5, camY: 1.0, tgtY: 0.76, face: 42, ts: 0.17, start: 0.45 },
  'jade/violin': { track: 'life_violin', prop: 'violin', dist: 5.3, camY: 1.2, tgtY: 0.98, face: 48, ts: 0.19, start: 0.1 },
  'jade/poet': { track: 'life_poet', prop: 'notebook', dist: 3.3, camY: 0.62, tgtY: 0.46, face: 50, ts: 0.13, start: 1.7 },
  'jade/nasa-ames': { track: 'life_nasa', prop: 'wind', dist: 5.5, camY: 1.15, tgtY: 0.98, face: 8, ts: 0.19, start: 0.6 },
  'jade/robot-ninja-apocalypse': { track: 'life_band', prop: 'guitar', dist: 5.2, camY: 1.15, tgtY: 0.98, face: 62, ts: 0.19, start: 0 },
  'jade/wushu': { track: 'life_wushu', prop: null, dist: 5.4, camY: 1.15, tgtY: 0.95, face: 40, ts: 0.19, start: 0 },
  'jade/sandstorm': { track: 'life_stage', prop: 'stage', dist: 5.6, camY: 1.15, tgtY: 1.0, face: 55, ts: 0.19, start: 0 },
  'jade/home': { track: 'life_home', prop: 'orrery', dist: 4.5, camY: 0.8, tgtY: 1.02, face: 35, ts: 0.14, start: 0 },
};

export default function seq(K) {
  const { bar, world: W, cast, T, E } = K; const t0 = bar(17), t1 = bar(33);
  const H = W.hero, TF = W.TF, SSL = 'sprint_stop_look', tSplit = TF[8], tThou = TF[9], tTips = TF[10], tSw = H.tSw, tP0 = W.tPause0, tSent = W.tSent;
  const tB = bar(22), tC = bar(25), tD = bar(27), tE = bar(28);
  const props = (K.shared.props = K.shared.props || makeProps(K));
  // ---- a branch's Jade, on her road, from the swoop to the release: sprint_loop (phase locked to the ground she covers), sprint_stop_look ridden along the
  // road with its own travel, then `release` where she stands (accent track t = 2.5 = "light")
  const z0 = cast.root(SSL, 0)[2];
  const branch = (path) => { const sTip = path.sOfRoad(10), s1 = H.sprint * (tSw - tTips);
    const s = (t) => (t <= tTips ? path.sAtG(Math.max(t, TF[7])) : t <= tSw ? sTip + H.sprint * (t - tTips) : sTip + s1 + cast.root(SSL, Math.min(t - tSw, H.brakeDur))[2] - z0);
    const at = (t) => path.at(s(t)), clock = K.loopClock(at, bar(15), tSw, 'sprint_loop', { anchor: [tSw, 0] });
    const perf = (t) => { const a = at(t); return t < tSw ? { pos: [a.x, 0, a.z], yaw: K.yawOf(a), track: 'sprint_loop', time: clock(t) } : t < tP0 ? { ...K.ride(SSL, t - tSw, a), track: SSL, time: t - tSw } : { pos: [a.x, 0, a.z], yaw: K.yawOf(a), track: 'release', time: t - tP0 }; };
    return { s, at, perf, clock, path }; };
  const hero = branch(W.heroPath), lives = W.lives.map((L) => branch(L.path)); const PIANO = 0, VIOLIN = 1, POET = 4;
  K.shared.heroRun = (t) => ({ track: 'sprint_loop', time: hero.clock(t) });
  const sep = (p, q, t) => { const a = p.at(t), b = q.at(t); return Math.hypot(a.x - b.x, a.z - b.z); };
  // who is a body at time t: the new branch appears as she steps out of the one she was
  const present = (i, t) => (i === VIOLIN ? t >= tSplit && sep(lives[VIOLIN], hero, t) > 0.03 : i === POET ? t >= tThou && sep(lives[POET], lives[VIOLIN], t) > 0.03 : i === PIANO ? t >= tThou && sep(lives[PIANO], hero, t) > 0.03 : t >= tB && sep(lives[i], hero, t) > 7);    // (a branch that runs within arm's reach of her stays a light)
  // draw the hero and the lives near her; returns the list of spots where a figure stands (no bokeh light there)
  const bodies = (t, cam, range = 60) => { const h = hero.perf(t); cast.actor('hero').set({ ...h, vary: 0 }); const clr = [[h.pos[0], h.pos[2], 16]];
    W.lives.forEach((L, i) => { if (!present(i, t)) return; const p = lives[i].perf(t); if (Math.hypot(p.pos[0] - cam.pos[0], p.pos[2] - cam.pos[2]) > range) return; cast.actor(L.name, { lane: L.lane }).set({ ...p, vary: 0 }); clr.push([p.pos[0], p.pos[2], 2.2]); });
    return clr; };
  const node = (path, i) => path.at(path.sOfRoad(i)); const N9 = node(W.heroPath, 8), N10 = node(W.heroPath, 9), N10c = node(W.lives[VIOLIN].path, 9);
  const POPS = [{ ...N9, t: tSplit, c: K.hex(K.LANE.gold) }, { ...N10, t: tThou, c: K.hex(K.LANE.rose) }, { ...N10c, t: tThou, c: K.hex(K.LANE.magenta) }];
  const pops = (t) => POPS.filter((n) => t >= n.t && t < n.t + 2).map((n) => { const p = Math.exp(-(t - n.t) * 2.2); return { x: n.x, z: n.z, r: 1.0 + 1.6 * (1 - p), c: [n.c[0] * p + 0.3 * p, n.c[1] * p + 0.25 * p, n.c[2] * p + 0.2 * p] }; });

  // ---- A: the camera behind her, in her road's frame: [metres ahead, height, metres to her right]
  const hf = (t) => K.frameOf(hero.at, t, 1.2);
  const camA = K.camPath([{ t: t0, pos: [-4.6, 1.55, -1.3], target: [5, 0.61, 0.5] }, { t: tSplit + 0.4, pos: [-4.9, 1.7, -1.3], target: [5, 0.55, 0.1] },
    { t: tThou, pos: [-6.2, 2.9, -1.6], target: [6, -0.6, -1.0] }, { t: tThou + 1.0, pos: [-6.5, 3.05, -1.7], target: [6, -0.7, -1.3] }, { t: tThou + 2.4, pos: [-7.0, 3.3, -0.1], target: [6, -0.7, 0.3] },
    { t: tTips, pos: [-7.6, 3.5, 0.2], target: [6, -0.5, 0.4] }, { t: tB, pos: [-8.2, 3.7, 0.3], target: [6, -0.5, 0.6] }]);
  const followA = (t) => { const a = hf(t), c = camA(t); return { pos: K.rel(a, c.pos[0], c.pos[2], c.pos[1]), target: K.rel(a, c.target[0], c.target[2], c.target[1]), fov: 35, focusDist: Math.hypot(c.pos[0], c.pos[1] - 1, c.pos[2]), aperture: 0.03 }; };
  K.shared.followA = followA;

  // ---- C: the light. It gathers between her hands, leaves them on "light" and becomes the head of her road (the world's own clock: conn.sAtG(t))
  const BL = E.lights(64), conn = W.heroPath.roads[10], mainC = K.hex(K.LANE.main);
  const handsW = (t) => { const p = hero.perf(Math.max(t, tP0)), tt = Math.min(Math.max(t - tP0, 0), 2.55), l = cast.root('release', tt, 8), r = cast.root('release', tt, 12), o = cast.rot(p.yaw, (l[0] + r[0]) / 2, (l[2] + r[2]) / 2 + 0.06); return [p.pos[0] + o[0], (l[1] + r[1]) / 2 + 0.05, p.pos[2] + o[1]]; };
  const orbAt = (t) => { const h = handsW(t); if (t <= tSent) return h; const a = conn.at(Math.min(conn.len - 0.01, conn.sAtG(t))), k = sm((t - tSent) / 0.32); return [lerp(h[0], a.x, k), lerp(h[1], 1.25, k), lerp(h[2], a.z, k)]; };
  const orb = (t) => { const d = new Float32Array(64 * 7); let n = 0; const grow = t < tSent ? sm(seg(t, tP0 + 1.0, tSent)) : 1, col = [mainC[0] * 0.6 + 0.5, mainC[1] * 0.6 + 0.45, mainC[2] * 0.6 + 0.35];
    if (grow <= 0) return null; const N = t < tSent ? 1 : 22;
    for (let j = 0; j < N; j++) { const p = orbAt(t - j * 0.008), g = (j === 0 ? 34 : 9 * Math.exp(-j * 0.2)) * grow * (t < tSent ? 0.3 + 0.7 * grow : 1); d.set([p[0], p[1], p[2], col[0] * g, col[1] * g, col[2] * g, j === 0 ? 0.075 * (0.4 + 0.6 * grow) : 0.05], n * 7); n++; }
    return BL.drawable(d, n, { minPx: 2.2, air: 2500 }); };

  // ---- E: a life, in her life. Her own road is drawn alone and bright, its message set beside her feet on the camera's side; the thousand others are dimmed
  const lifeRoads = W.lives.map((L) => { const cfg = LIFE[L.name] || { ts: 0.19, dist: 5 }, r = L.path.roads[10], d = r.def, sV = H.sStop + 9, shift = 0.14 * cfg.dist;
    const txt = L.name + '  ' + L.text, adv = cfg.ts * 0.62, gap = 10, tot = (txt.length + gap) * adv, mid = (L.name.length + 2 + L.text.length / 2) * adv;
    const R = E.roads([{ pts: d.pts, gk: d.gk, color: d.color, width: 0.03, text: txt, textSize: cfg.ts, textSide: -1, textOff: -(cfg.dist < 4.4 && cfg.prop !== 'piano' ? 0.62 : 0.05 + cfg.ts * 0.62), textGap: gap, textStart: (((sV - shift - mid) % tot) + tot) % tot, step: 1.0 }], { step: 1.0 });
    return { R, sV, a: R.roads[0].at(sV), shift }; });
  const tLook = T.words(5)[3].start, lifeClock = (t) => (t <= tLook ? t - tLook + 4.5 : 4.5 + (t - tLook) * 0.8);       // the shared clock: every life's look-back (track 4.5) begins on "remembers"
  // lifeShot(i, t, opts): opts.time (track time), opts.u (0..1 through the shot), opts.head (roll call: anchor the frame on her head)
  function lifeShot(i, t, o = {}) { const L = W.lives[i], cfg = LIFE[L.name], lr = lifeRoads[i], a = lr.a, time = o.time, yaw = K.yawOf(a) - (cfg.face * Math.PI) / 180, pos = [a.x, 0, a.z], u = o.u ?? 0;
    let camera;
    if (o.head) { const h = cast.root(cfg.track, 5.6, 4), w = cast.rot(yaw, h[0], h[2]), hx = a.x + w[0], hz = a.z + w[1], f = { ...a, x: hx, z: hz };
      camera = { pos: K.rel(f, 0.15, 4.1 - 0.12 * u, h[1] + 0.02), target: K.rel(f, -0.85, 0, h[1] - 0.2), fov: 35, focusDist: 4.2, aperture: 0.018 }; }
    else camera = { pos: K.rel(a, 0.75 - lr.shift, cfg.dist * (1 - 0.035 * u), cfg.camY), target: K.rel(a, -lr.shift, 0, cfg.tgtY), fov: 35, focusDist: cfg.dist, aperture: 0.018 };
    cast.actor(L.name, { lane: L.lane }).set({ pos, yaw, track: cfg.track, time, vary: 0 });
    const col = K.hex(L.color), b = props.begin(); if (cfg.prop) props[cfg.prop](b, { pos, yaw, color: col, track: cfg.track, time, clock: t });
    return { camera, env: { grade: { exposure: 1.6, vignette: 0.42 }, ground: { fogAmt: 0.6 } },
      world: { named: { hide: true }, conn: { gain: 0.16 }, fork: { gain: 0.4 }, merge: { gain: 0.4 }, text: 0, flow: 0.08, lights: { gain: 0.55, minPx: 1.3, clear: [[a.x, a.z, 24]], clearHeads: [[a.x, a.z, 24]] } },
      extra: [W.glow([{ x: a.x, z: a.z, r: 3.2, c: [col[0] * 0.1, col[1] * 0.1, col[2] * 0.1] }]), lr.R.drawable({ head: t, gain: 2.6, textGain: 1.15, widthScale: 1.2, halo: 0.3, haloPx: 5, flow: 0.18, flowSpeed: 3, minPx: 1.6 }), props.drawable(b, { gain: 1 })],
      hud: { branch: L.name, color: L.color, ctx: 0.3 + 0.05 * i + 0.002 * (t - 47) } }; }
  K.shared.lifeShot = lifeShot; K.shared.lifeClock = lifeClock;
  const LY = { x: -0.9, y: 0.3, dist: 26 };
  const beat = 60 / 138;

  return { name: '03_verse1', t0, t1, frame(t) {
    if (t < tB) { // A
      const camera = followA(t), clr = bodies(t, camera, 40), ca = 1 - seg(t, tThou + 1.7, tThou + 2.3);
      return { camera, world: { text: 0.85, flow: 0.12, lights: { gain: 0.6, clear: clr }, conn: { gain: 0.8 }, named: { widthScale: 1.3 } }, extra: [W.glow(pops(t))],
        type: [K.lyric(1, camera, { ...LY, y: 0.6, dist: 24, reflGain: 0 }), K.lyric(2, camera, { ...LY, y: 0.6, dist: 24, reflGain: 0 })], hud: K.hudMain(t, ca > 0 ? {} : { count: 1024 }), overlay: K.shared.counter(t, ca) }; }
    if (t < tC) { // B: side truck from her left; the camera eases as she brakes, then leans in while she gathers herself
      const sc = (hero.s(t - 0.45) + hero.s(t - 0.15) + hero.s(t + 0.15) + hero.s(t + 0.45)) / 4, p = W.heroPath.at(sc), q0 = W.heroPath.at(sc - 2.5), q1 = W.heroPath.at(sc + 2.5), l = Math.hypot(q1.x - q0.x, q1.z - q0.z) || 1, a = { x: p.x, z: p.z, tx: (q1.x - q0.x) / l, tz: (q1.z - q0.z) / l };
      const u = ss(t, tP0 - 0.6, tC); const camera = { pos: K.rel(a, 2.5 - 0.5 * u, -5.4 + 0.9 * u, 1.08), target: K.rel(a, 1.55 - 0.5 * u, 0, 0.98), fov: 35, focusDist: 5.4 - 0.9 * u, aperture: 0.045 };
      const clr = bodies(t, camera, 55);
      return { camera, world: { text: 0.85, flow: 0.12, lights: { gain: 0.3, clear: clr }, conn: { gain: 0.35 }, named: { widthScale: 1.5, gain: 2.6, textGain: 0.3 } },
        type: [K.lyric(2, camera, { ...LY, rows: [3, 4], dist: 40, reflGain: 0.1 })], hud: K.hudMain(t, { count: 1024 }) }; }
    if (t < tD) { // C: the release, from behind her
      const a = K.frameOf(hero.at, tP0 + 1, 0.5), u = seg(t, tC, tD); const camera = { pos: K.rel(a, -3.7 + 0.4 * sm(u), 1.6, 1.3), target: K.rel(a, 8, -1.35, 0.55), fov: 40, focusDist: 4.0, aperture: 0.03 };
      const clr = bodies(t, camera, 60), o = orb(t), sent = t >= tSent, pop = sent ? Math.exp(-(t - tSent) * 2.4) : 0, hp = handsW(t);
      return { camera, world: { text: 0.9, flow: 0.1, headGain: sent ? 5 : 0, headLen: 0.4, lights: { gain: 0.6, clear: clr, clearHeads: [[hp[0], hp[2], 5]] }, conn: { gain: 0.4 }, named: { widthScale: 1.3, gain: 1.7 } },
        extra: [...(o ? [o] : []), ...(pop > 0.01 ? [W.glow([{ x: hp[0], z: hp[2], r: 1.5 + 4 * (1 - pop), c: [1.3 * pop, 0.7 * pop, 0.35 * pop] }])] : [])],
        type: [K.lyric(3, camera, { x: -0.2, y: 0.3, rows: [4, 3], dist: 24, reflGain: 0 })], hud: K.hudMain(t, { count: 1024 }) }; }
    if (t < tE) { // D: with the comets
      const fr = (tt) => { const sc = Math.max(8, conn.sAtG(tt) - 44), p = conn.at(sc), q0 = conn.at(Math.max(0, sc - 12)), q1 = conn.at(Math.min(conn.len - 0.1, sc + 50)), l = Math.hypot(q1.x - q0.x, q1.z - q0.z); return { x: p.x, z: p.z, tx: (q1.x - q0.x) / l, tz: (q1.z - q0.z) / l }; };
      const a = fr(t), u = seg(t, tD, tE); const camera = { pos: K.rel(a, 0, 0, 13 - 2 * u), target: K.rel(a, 70, 0, 2), fov: 35, far: 30000 };
      bodies(t, camera, 0);
      return { camera, world: { text: 0.25, flow: 0, minPx: 1.3, headGain: 40, headLen: 0.22, halo: 0.2, lights: { gain: 1.6, minPx: 2.0, air: 2500 }, conn: { gain: 0.11, minPx: 1.4, halo: 0.25, headGain: 55 }, named: { gain: 0.3, widthScale: 1.2 } },
        type: [K.lyric(3, camera, { x: -0.9, y: 0.3, rows: [4, 3], dist: 60, reflGain: 0 })], hud: K.hudMain(t, { count: 1024 }) }; }
    // E: the lives, one bar each
    const ORDER = [0, 1, 4, 5, 6], k = Math.min(4, Math.floor(T.barAt(t)) - 28), i = ORDER[k], c0 = bar(28 + k), cfg = LIFE[W.lives[i].name];
    const time = k === 4 ? t - c0 + 2 * beat : t - c0 + cfg.start;                   // the band strums on the song's beat
    const F = lifeShot(i, t, { time, u: seg(t, c0, c0 + 4 * beat) });
    F.type = [K.lyric(4, F.camera, { ...LY, rows: [3, 3], out: 54.25, fade: 0.3, reflGain: 0 }), K.lyric(5, F.camera, { ...LY, rows: [2, 2], reflGain: 0 })];
    return F;
  } };
}
