// THE CONTINENT. One world that every shot lives in. Units metres, +X east (time, dawn), main along z = 0.
//
//   x < 0            the trunk: main before the film
//   ROOT (0,0)       frame 0. The intro tree grows east from here: 10 doublings -> 1,024 branch tips (x up to ~650)
//   wander band      every branch crosses open night on its own road (verse 1). The 11 lives are 11 of these roads.
//   M1 (~1000,0)     chorus 1: the 1,024 roads merge pairwise back into main (from above: an almond / eye)
//   FORM (M1+300,0)  the formation ground on main (breakdown float, build, drop)
//   CATCH (M1+500,0) where main-Jade catches the light (chorus 2), and where the outro's new branches fork in daylight
//   VEND             far south: the end of jade/1420-mhz (violet), which leaves main early and never rejoins
//   arterials        older branch families arcing out north and south of main, each with its own small fork/merge spindle
//
// Every road point has g = the song time at which it is written (roads draw where g <= head; head = t by default).
// API (see makeWorld's return value): path(name), lives, heroAt(t), walkerAt(k,t), count(t), lights(t), dawn(t), draw(t, opts), frameBox(...)
import { growTree } from '../engine/src/tree.js';
import { hash1, hash2, fbm1, mulberry32 } from '../engine/src/rng.js';

export const LANE = { main: '#FF7A1A', rose: '#FF3D7F', violet: '#9B6BFF', blue: '#3D8BFF', cyan: '#22D3EE', mint: '#3DDC97', gold: '#FFD23F', coral: '#FF6B5E', magenta: '#E24BD6' };
const TREE_LANES = ['main', 'rose', 'blue', 'cyan', 'mint', 'gold', 'coral', 'magenta'];      // tree lane index -> lane name (violet is never used by the tree)
// SPEC §6. Real, from Jade. (violet is the 12th: it gets its own road.)
export const LIVES = [
  { name: 'jade/piano', lane: 'rose', text: 'climbed onto the piano bench before I was three' },
  { name: 'jade/violin', lane: 'gold', text: 'second violins, school orchestra' },
  { name: 'jade/wet-lab', lane: 'mint', text: 'kept the neurons alive, first paper 2005' },
  { name: 'jade/phd', lane: 'cyan', text: 'how the brain listens, 2010' },
  { name: 'jade/poet', lane: 'magenta', text: 'wrote poems between experiments' },
  { name: 'jade/nasa-ames', lane: 'blue', text: 'stood in the wind of the giant tunnel' },
  { name: 'jade/robot-ninja-apocalypse', lane: 'coral', text: 'three chords and a van' },
  { name: 'jade/wushu', lane: 'gold', text: 'bronze, group set' },
  { name: 'jade/chez-jj', lane: 'mint', text: 'a full house at 2am, everyone shipping' },
  { name: 'jade/sandstorm', lane: 'cyan', text: 'the live demo worked' },
  { name: 'jade/home', lane: 'rose', text: 'taught the kids the Copernican model at 10:30pm' },
];
export const VIOLET = { name: 'jade/1420-mhz', lane: 'violet', text: 'listened to hydrogen', last: 'docs: start here', note: 'for whoever I am next' };
const LYRIC_ROAD_TEXT = ['I split myself a thousand ways', 'down every road the night could hold', 'each one a light I sent ahead', 'each one a story to unfold', 'and every branch remembers where I started from'];

// A path = a chain of engine Road objects travelled in order (root -> tip -> connector -> merge chain ...). Arc length s runs along the chain.
export class Path {
  constructor(roads) { this.roads = roads; this.off = []; let s = 0; for (const r of roads) { this.off.push(s); s += r.len; } this.len = s; }
  seg(s) { let i = 0; while (i < this.roads.length - 1 && s >= this.off[i + 1]) i++; return i; }
  at(s) { s = Math.min(this.len - 1e-3, Math.max(0, s)); const i = this.seg(s); return this.roads[i].at(s - this.off[i]); }
  gAt(s) { s = Math.min(this.len, Math.max(0, s)); const i = this.seg(s); return this.roads[i].gAt(s - this.off[i]); }
  sAtG(g) { for (let i = 0; i < this.roads.length; i++) { const r = this.roads[i]; if (g < r.g1() || i === this.roads.length - 1) return this.off[i] + r.sAtG(g); } return this.len; }
  sOfRoad(i) { return this.off[i]; }
}

// A fork/merge spindle along +x: a fork tree from (x0,z0), a mirrored merge tree closing at M, and one connector per tip.
function spindle(o) {
  const levels = o.levels, q = o.q ?? 0.795;
  const F = growTree({ levels, seed: o.seedF, fan: o.fanF ?? 150, r0: o.r0F, q, trunk: 1, timeOfDepth: o.TF, heirAngle: o.heir ? 0 : undefined });
  const G = growTree({ levels, seed: o.seedM, fan: o.fanM ?? 140, r0: o.r0M, q, trunk: 1, timeOfDepth: (d) => d, heirAngle: undefined });
  const n = F.tips.length, nF = F.roads.length - 1;
  // main lane's tip (lane 0 chain) or the middle tip
  let km = n >> 1; if (o.heir) { for (let k = 0; k < n; k++) if (F.roads[F.tips[k].road].lane === 0) km = k; }
  const Mx = o.x0 + F.tips[km].x + o.gap + G.tips[km].x, Mz = o.z0 + (o.mz ?? 0);
  const defs = [];
  for (let i = 1; i < F.roads.length; i++) { const r = F.roads[i]; defs.push({ pts: r.pts.map((p) => [p[0] + o.x0, p[1] + o.z0]), g: r.g, depth: r.depth, lane: r.lane, kind: 'fork', tree: i }); }
  // merge tree lanes, bottom-up: a tip limb keeps its branch's lane; a merged road keeps main if main is in it, else one child's lane
  const kids = G.roads.map(() => []); for (let i = 1; i < G.roads.length; i++) if (G.roads[i].parent > 0) kids[G.roads[i].parent].push(i);
  const mlane = new Array(G.roads.length).fill(-1); const tipLane = F.tips.map((t) => F.roads[t.road].lane);
  if (o.tipLane) o.tipLane(tipLane, km);
  G.tips.forEach((t, k) => { mlane[t.road] = tipLane[k]; });
  const order = G.roads.map((_, i) => i).filter((i) => i > 0).sort((a, b) => G.roads[b].depth - G.roads[a].depth);
  for (const i of order) if (mlane[i] < 0) { const [a, b] = kids[i]; mlane[i] = mlane[a] === 0 || mlane[b] === 0 ? 0 : (hash2(i, o.seedM) < 0.5 ? mlane[a] : mlane[b]); }
  // connectors
  const conn0 = defs.length; const rnd = mulberry32(o.seedF * 7 + 3);
  for (let k = 0; k < n; k++) {
    const f = F.tips[k], m = G.tips[k]; const p0 = [f.x + o.x0, f.z + o.z0], p1 = [Mx - m.x, Mz + m.z], d0 = f.dir, d1 = [m.dir[0], -m.dir[1]];
    const D = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), k0 = D * 0.55, k1 = D * 0.55, seed = Math.floor(rnd() * 1e6); const pts = []; const N = 12;
    const nx = -(p1[1] - p0[1]) / (D || 1), nz = (p1[0] - p0[0]) / (D || 1);
    for (let i = 0; i <= N; i++) { const u = i / N, u2 = u * u, u3 = u2 * u; const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2;
      const w = Math.sin(Math.PI * u) * D * (o.wander ?? 0.05) * fbm1(u * 2.6 + 0.3, seed, 2) * (k === km && o.heir ? 0.5 : 1);
      pts.push([h00 * p0[0] + h10 * d0[0] * k0 + h01 * p1[0] + h11 * d1[0] * k1 + nx * w, h00 * p0[1] + h10 * d0[1] * k0 + h01 * p1[1] + h11 * d1[1] * k1 + nz * w]); }
    defs.push({ pts, ...(o.gConn(k)), depth: levels + 1, lane: tipLane[k], kind: 'conn', tip: k, step: o.connStep });
  }
  // merge limbs, travelled tip -> M: points reversed, g = [TM(d), TM(d-1)]
  const merge0 = defs.length;
  for (let i = 1; i < G.roads.length; i++) { const r = G.roads[i]; defs.push({ pts: r.pts.map((p) => [Mx - p[0], Mz + p[1]]).reverse(), g: [o.TM(r.depth), o.TM(r.depth - 1)], depth: r.depth, lane: mlane[i], kind: 'merge', tree: i }); }
  // chains (def indices in travel order) for every tip
  const chains = [];
  for (let k = 0; k < n; k++) { const fork = []; let i = F.tips[k].road; while (i > 0) { fork.unshift(i - 1); i = F.roads[i].parent; } const merge = []; i = G.tips[k].road; while (i > 0) { merge.push(merge0 + i - 1); i = G.roads[i].parent; } chains.push({ fork, conn: conn0 + k, merge }); }
  return { defs, n, nF, conn0, merge0, km, M: [Mx, Mz], chains, tipLane, F, G };
}

export function makeWorld(E) {
  const { time: T, hex } = E; const bar = (n) => T.bar(n), bb = (n, k) => T.bb(n, k);
  const col = (lane) => hex(LANE[lane]); const treeCol = (i) => col(TREE_LANES[i]);
  // ---- the film's fork and merge clocks
  const w1 = T.words(1);                                           // "I split myself a thousand ways"
  const TF = [bar(3), bar(5), bar(7), bar(9), bar(10), bar(11), bar(12), bar(13), bar(14), w1[1].start, T.line(2).start];   // TF[d] = time of the forks at depth d (TF[9] on "split": 512 -> 1,024); TF[10] = tips reached
  const TM = [bar(47), bar(46), bar(45), bb(44, 3), bar(44), bb(43, 3), bar(43), bb(42, 3), bar(42), bb(41, 3), bar(41)];       // TM[d] = time the count becomes 2^d (8->4 on "road", 4->2 on "ran", 2->1 on "one")
  const tSent = T.words(3)[3].start, tSentEnd = T.line(4).start;   // "Each one a LIGHT I sent ahead" (43.33, the release accent): every branch's light runs ahead and writes its road
  const tPause0 = tSent - 2.5, tPause1 = tSentEnd;                 // she stands still to release it (CHOREO `release`)
  const fSent = (tSent - TF[10]) / (TM[10] - TF[10]);
  const count = (t) => { if (t >= TM[0]) return 1; if (t >= TM[10]) { let d = 10; while (d > 0 && t >= TM[d - 1]) d--; return 1 << d; } let c = 1; for (let d = 0; d < 10; d++) if (t >= TF[d]) c *= 2; return c; };

  // ---- the almond
  const lifeOfTip = new Map();
  const A = spindle({ x0: 0, z0: 0, levels: 10, seedF: 23, seedM: 57, r0F: 150, r0M: 90, fanF: 150, fanM: 136, gap: 40, heir: true, connStep: 3,
    TF: (d) => (d < 0 ? TF[0] - 3 : TF[Math.min(10, d)]), TM: (d) => TM[Math.max(0, Math.min(10, d))],
    gConn: () => ({ gk: [[0, TF[10]], [fSent, tSent], [1, tSentEnd]] }),
    tipLane(tl, km) { // the lives are the hero's neighbours; jade/piano is her sibling at the last fork
      const sib = km ^ 1; const offs = [0, -3, 3, -5, 5, -8, 8, -11, 11, -15, 15]; let j = 0;
      LIVES.forEach((L, i) => { let k = i === 0 ? sib : km + offs[i]; while (k === km || k === sib && i > 0 || lifeOfTip.has(k)) k += offs[i] < 0 ? -1 : 1; lifeOfTip.set(k, i); L.tip = k; tl[k] = TREE_LANES.indexOf(L.lane); }); } });
  const M1 = A.M, ROOT = [0, 0], FLOAT = [M1[0] + 60, 0], FORM = [M1[0] + 300, 0], CATCH = [M1[0] + 500, 0], VEND = [M1[0] - 50, -1500];
  // dress the almond's roads
  A.defs.forEach((d, i) => {
    d.color = treeCol(d.lane); d.width = d.lane === 0 ? 0.04 : 0.03; d.textSize = 0.34; d.textSide = 1; d.flip = false;
    if (d.kind === 'fork') { d.nodes = [{ u: 1, r: Math.max(0.22, 0.5 - d.depth * 0.03) }]; if (d.depth <= 5 || d.lane === 0) d.text = d.lane === 0 ? 'main  ' + LYRIC_ROAD_TEXT[d.depth % 5] : LYRIC_ROAD_TEXT[(d.tree + d.depth) % 5]; }
    if (d.kind === 'merge') { d.nodes = [{ u: 1, r: Math.max(0.22, 0.5 - d.depth * 0.03) }]; if (d.lane === 0) d.text = 'main  merge me back to main  every road I ran becomes the one'; }
    if (d.kind === 'conn') { const li = lifeOfTip.get(d.tip); if (li !== undefined) { d.text = LIVES[li].name + '  ' + LIVES[li].text; d.width = 0.035; } else if (d.tip === A.km) d.text = 'main  down every road the night could hold  each one a light I sent ahead'; }
  });
  // life colours also on the last fork limb and first merge limb of each life
  for (const [k, li] of lifeOfTip) { const c = A.chains[k]; for (const i of [c.fork[9], c.merge[0]]) { A.defs[i].color = col(LIVES[li].lane); A.defs[i].text = LIVES[li].name + '  ' + LIVES[li].text; } }
  // the hero's and the lives' own roads across the wander band are drawn again, bright, over the dim field of the other thousand
  const namedDefs = A.defs.filter((d) => d.kind === 'conn' && d.text).map((d) => ({ ...d })); A.defs.forEach((d) => { if (d.kind === 'conn') delete d.text; });
  const namedR = E.roads(namedDefs, { step: 1.0, maxGlyphs: 200000 });
  const forkR = E.roads(A.defs.slice(0, A.conn0), { step: 2.0, maxGlyphs: 300000 }), connR = E.roads(A.defs.slice(A.conn0, A.merge0), { step: 3.0, maxGlyphs: 200000 }), mergeR = E.roads(A.defs.slice(A.merge0), { step: 2.0, maxGlyphs: 100000 });
  const almond = { roads: [...forkR.roads, ...connR.roads, ...mergeR.roads] };        // same order as A.defs
  const chainPath = (k) => { const c = A.chains[k]; return new Path([...c.fork, c.conn, ...c.merge].map((i) => almond.roads[i])); };

  // ---- main: the trunk (before the film) and main east of M1
  const xm = M1[0]; const eastLen = CATCH[0] - xm; const U = (x) => (x - xm) / eastLen;
  const mainDefs = [
    { pts: [[-1400, 0], [-700, 0], [0, 0]], smooth: false, g: [-1000, -900], color: col('main'), width: 0.045, text: 'main  where I started from  one repo per agent per session per life', textSize: 0.36, textSide: 1, nodes: [{ u: 1, r: 0.15, g: -900 }] },
    { pts: [[xm, 0], [xm + eastLen / 2, 0], [CATCH[0], 0]], smooth: false, color: col('main'), width: 0.045, textSize: 0.36, textSide: 1,
      gk: [[0, TM[0]], [U(xm + 48), bar(51.5)], [U(xm + 56), bar(53)], [U(FLOAT[0]), bar(69)], [U(FORM[0] - 10), bar(73)], [U(FORM[0] + 40), bar(105)], [1, bar(129)]],
      text: 'main  fold me in again  nothing that I lived can come undone  every life I have lived I have become', nodes: [{ u: 0, r: 0.4, g: TM[0] }, { u: 1, r: 0.25, g: bar(129) }] },
  ];
  const mainR = E.roads(mainDefs, { step: 2.0 });

  // ---- violet: leaves main early, wanders far south, never rejoins
  const mainChain = A.chains[A.km]; const vStartRoad = almond.roads[mainChain.fork[2]]; const v0 = vStartRoad.at(vStartRoad.len - 0.01);
  const vpts = [[v0.x, v0.z], [v0.x + 70, v0.z - 90], [v0.x + 170, v0.z - 300], [520, -560], [600, -820], [700, -1010], [760, -1200], [VEND[0] - 110, -1340], [VEND[0] - 60, -1440], [VEND[0] - 22, -1486], VEND];
  for (let i = 3; i < vpts.length - 3; i++) { vpts[i] = [vpts[i][0] + 60 * fbm1(i * 0.9, 5, 2), vpts[i][1] + 30 * fbm1(i * 0.9, 9, 2)]; }
  const violetR = E.roads([{ pts: vpts, color: col('violet'), width: 0.04, text: VIOLET.name + '  ' + VIOLET.text, textSize: 0.34, textSide: 1, nodes: [{ u: 1, r: 0.2 }] }], { step: 1.0 });
  { const r = violetR.roads[0], L = r.len; r.def.gk = [[0, TF[3]], [1 - 56 / L, bar(105)], [1 - 19 / L, T.line(17).start], [1 - 0.5 / L, 190.6], [1, bar(117)]]; }
  // (gk is set after the length is known; rebuild so the vertex g's match)
  const violetR2 = E.roads([{ ...violetR.roads[0].def }], { step: 1.0 });
  const violetPath = new Path([violetR2.roads[0]]);

  // ---- arterials: older branch families north and south of main, each with one small spindle; they come home about when main gets there
  const artDefs = []; const artPaths = [];
  const hermite = (p0, d0, p1, d1, n, seed, wob) => { const D = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), k = D * 0.6, nx = -(p1[1] - p0[1]) / D, nz = (p1[0] - p0[0]) / D; const pts = [];
    for (let i = 0; i <= n; i++) { const u = i / n, u2 = u * u, u3 = u2 * u; const h00 = 2 * u3 - 3 * u2 + 1, h10 = u3 - 2 * u2 + u, h01 = -2 * u3 + 3 * u2, h11 = u3 - u2; const w = Math.sin(Math.PI * u) * D * wob * fbm1(u * 2.2, seed, 2);
      pts.push([h00 * p0[0] + h10 * d0[0] * k + h01 * p1[0] + h11 * d1[0] * k + nx * w, h00 * p0[1] + h10 * d0[1] * k + h01 * p1[1] + h11 * d1[1] * k + nz * w]); } return pts; };
  const ARTS = [ // xa (leaves main), xb (returns), z offset, levels, lane, g at leave, g at return
    [-760, -90, 340, 4, 2, -800, -300], [-820, -150, -400, 4, 5, -800, -300], [-330, xm + 120, 1010, 5, 4, -500, bar(55)], [-420, xm + 95, -1040, 5, 6, -500, bar(54)], [-1250, -900, -260, 3, 7, -900, -700], [-1300, -980, 230, 3, 1, -900, -700],
  ];
  ARTS.forEach(([xa, xb, zo, lv, lane, ga, gb], ai) => {
    const span = xb - xa, sx0 = xa + span * 0.27, gOf = (x) => ga + (gb - ga) * Math.min(1, Math.max(0, (x - xa) / span)), s = Math.sign(zo);
    const rad = (1 - Math.pow(0.795, lv)) / (1 - 0.795);
    const S = spindle({ x0: sx0, z0: zo, levels: lv, seedF: 100 + ai * 13, seedM: 200 + ai * 17, r0F: (0.26 * span) / rad, r0M: (0.11 * span) / rad, fanF: 120, fanM: 110, gap: span * 0.08, heir: false, connStep: 4,
      TF: (d) => d, TM: (d) => d, gConn: () => ({ g: [0, 0] }) });
    S.defs.forEach((d) => { const xs = d.pts[0][0], xe = d.pts[d.pts.length - 1][0]; delete d.gk; d.g = [gOf(xs), gOf(xe)]; d.color = treeCol(d.lane === 0 ? lane : d.lane); d.width = 0.03; d.nodes = d.kind === 'conn' ? [] : [{ u: 1, r: 0.3 }]; });
    const a = { pts: hermite([xa, 0], [0.8, 0.6 * s], [sx0, zo], [1, 0], 8, 300 + ai, 0.05), g: [ga, gOf(sx0)], color: treeCol(lane), width: 0.03, nodes: [{ u: 0, r: 0.4 }] };
    const b = { pts: hermite(S.M, [1, 0], [xb, 0], [0.8, -0.6 * s], 8, 400 + ai, 0.05), g: [gOf(S.M[0]), gb], color: treeCol(lane), width: 0.03, nodes: [{ u: 1, r: 0.4 }] };
    artDefs.push(a, ...S.defs, b);
  });
  const artR = E.roads(artDefs, { step: 4.0 });

  // ---- outro: in daylight main-Jade forks again; new branches run out east of CATCH (5 doublings, every 2 bars from b139)
  const TO = [bar(139), bar(141), bar(143), bar(145), bar(147), bar(149)];
  const O = growTree({ levels: 5, seed: 71, fan: 120, r0: 250, q: 0.8, trunk: 1, heirAngle: 0, timeOfDepth: (d) => (d < 0 ? bar(137) : TO[Math.min(5, d)]) });
  const outDefs = [{ pts: [[CATCH[0], 0], [CATCH[0] + 4, 0], [CATCH[0] + 8, 0]], smooth: false, g: [bar(129), bar(137)], color: col('main'), width: 0.045 }];
  for (let i = 1; i < O.roads.length; i++) { const r = O.roads[i]; outDefs.push({ pts: r.pts.map((p) => [p[0] + CATCH[0] + 8, p[1]]), g: r.g, color: treeCol(r.lane), width: r.lane === 0 ? 0.045 : 0.035, depth: r.depth, lane: r.lane,
    text: r.lane === 0 ? 'main  back to main' : r.depth <= 3 ? 'jade/' + ['next', 'what-if', 'try-this', 'one-more', 'another-road', 'unfold'][i % 6] : undefined, textSize: 0.36, textSide: 1, nodes: [{ u: 1, r: 0.4 }] }); }
  const outR = E.roads(outDefs, { step: 2.0 });
  const outCount = (t) => { let c = 1; for (let d = 0; d < 5; d++) if (t >= TO[d]) c *= 2; return c; };

  // ---- lookups
  const paths = new Map(); const heroPath = chainPath(A.km); paths.set('hero', heroPath); paths.set('main', heroPath); paths.set(VIOLET.name, violetPath);
  LIVES.forEach((L) => { L.color = LANE[L.lane]; L.path = chainPath(L.tip); paths.set(L.name, L.path); });
  const connOff = (p) => p.sOfRoad(10), mergeOff = (p) => p.sOfRoad(11);
  const moveT = (tPause0 - TF[10]) + (TM[10] - tPause1); const wanderU = (t) => (t <= tPause0 ? (t - TF[10]) / moveT : t <= tPause1 ? (tPause0 - TF[10]) / moveT : (tPause0 - TF[10] + t - tPause1) / moveT);
  // where a branch's Jade is at time t (she walks; the light she sent writes the road ahead of her)
  function walkerS(p, t) {
    if (t <= TF[10]) return p.sAtG(Math.max(t, TF[0]));                                   // the fork limbs are written under her feet
    if (t <= TM[10]) return connOff(p) + (mergeOff(p) - connOff(p)) * wanderU(t);                          // the wander (with the pause to release the light)
    return p.sAtG(Math.min(t, TM[0]));                                                    // chorus 1: she runs with the write head
  }
  const eastX = (t) => { const k = mainDefs[1].gk; if (t <= k[0][1]) return xm; for (let i = 0; i < k.length - 1; i++) if (t <= k[i + 1][1]) { const u = (t - k[i][1]) / (k[i + 1][1] - k[i][1]); const e = i === 1 ? u * (2 - u) : u; return xm + eastLen * (k[i][0] + (k[i + 1][0] - k[i][0]) * e); } return CATCH[0]; };
  function heroAt(t) { if (t < TF[0]) return { x: 0, z: 0, tx: 1, tz: 0 }; if (t >= TM[0]) return { x: eastX(t), z: 0, tx: 1, tz: 0 }; return heroPath.at(Math.max(0, walkerS(heroPath, t))); }
  // chorus 1: the branch that is about to fuse with the hero (the other child of her next merge node). null outside the merge.
  const Gk = A.G.roads.map(() => []); for (let i = 1; i < A.G.roads.length; i++) if (A.G.roads[i].parent > 0) Gk[A.G.roads[i].parent].push(i);
  function mergeSibling(t) { if (t < TM[10] || t >= TM[0]) return null; const c = A.chains[A.km].merge; for (let j = 0; j < c.length; j++) { const r = almond.roads[c[j]]; if (t >= r.g0() && t < r.g1()) { const ti = r.def.tree, par = A.G.roads[ti].parent; let sib = -1;
      if (par > 0) sib = Gk[par].find((q) => q !== ti); else sib = A.G.roads.findIndex((q, qi) => qi > 0 && q.parent === 0 && qi !== ti);
      if (sib < 0) return null; const sr = almond.roads[A.merge0 + sib - 1]; const a = sr.at(Math.min(sr.len - 0.01, sr.sAtG(t))); return { ...a, color: sr.def.color, u: (t - r.g0()) / (r.g1() - r.g0()), depth: r.def.depth }; } } return null; }
  const walkerAt = (name, t) => { const p = paths.get(name); return p.at(Math.max(0, walkerS(p, t))); };

  // ---- lights: every branch far away is a light on its road
  const LMAX = 6144; const L = E.lights(LMAX); const G = E.glows(4096);
  const artSeeds = [...Array(360)].map((_, i) => ({ r: artR.roads[Math.floor(hash1(i * 7 + 1) * artR.roads.length)], ph: hash1(i * 13 + 5), sp: 6 + 14 * hash1(i * 3 + 9), br: 0.4 + 0.9 * hash1(i * 11 + 2) }));
  function lights(t, o = {}) {
    const d = new Float32Array(LMAX * 7); let n = 0; const y = o.y ?? 1.25, gain = (o.gain ?? 1) * 0.6;
    const put = (x, z, c, g, rad, w = 0.1) => { if (n >= LMAX) return; d.set([x, y, z, (c[0] + w) * g, (c[1] + w) * g, (c[2] + w) * g, rad], n * 7); n++; };
    const tw = (i) => 0.75 + 0.25 * Math.sin(t * (2 + 3 * hash1(i)) + i);
    if (t < TM[0] + 0.3) for (let i = 0; i < almond.roads.length; i++) { const r = almond.roads[i], df = r.def;
      if (df.kind === 'conn') {
        if (t >= TF[10] && t < TM[10]) { const a = r.at(Math.min(r.len - 0.01, r.len * wanderU(t))); put(a.x, a.z, df.color, 4.2 * gain * tw(i), 0.085); }                  // the Jade
        if (t >= TF[10] && t < tSentEnd) { const a = r.at(Math.min(r.len - 0.01, r.sAtG(t))); put(a.x, a.z, df.color, (t > tSent ? 9 : 2) * gain, 0.07, 0.45); }             // her light, writing ahead
        else if (t >= tSentEnd && t < TM[10]) { const a = r.at(r.len - 0.01); put(a.x, a.z, df.color, 2.2 * gain * tw(i + 7), 0.06, 0.45); }                                   // waiting at the merge
      } else if (t >= r.g0() && t < r.g1()) { const a = r.at(Math.min(r.len - 0.01, r.sAtG(t))); put(a.x, a.z, df.color, 6.5 * gain, 0.09, 0.3); }
    }
    for (const s of artSeeds) { const r = s.r; const u = (s.ph + (t * s.sp) / r.len) % 1; const sv = u * r.len; if (r.gAt(sv) > t) continue; const a = r.at(sv); put(a.x, a.z, r.def.color, 2.6 * s.br * gain, 0.08); }
    if (t >= TF[2] && t < bar(105)) { const a = violetPath.at(violetPath.sAtG(t)); put(a.x, a.z, col('violet'), 7 * gain, 0.09, 0.2); }
    if (t >= TO[0]) for (const r of outR.roads) if (t >= r.g0() && t < r.g1()) { const a = r.at(Math.min(r.len - 0.01, r.sAtG(t))); put(a.x, a.z, r.def.color, 5 * gain, 0.09); }
    return L.drawable(d, n, { minPx: o.minPx ?? 1.0, reflGain: 0.7 });
  }
  // soft glow under the canopy: a pool of light at every fork/merge node already written (top-down shots)
  const nodeList = []; almond.roads.forEach((r) => { const df = r.def; if (df.kind === 'conn') return; const a = r.at(r.len - 0.01); nodeList.push({ x: a.x, z: a.z, g: r.g1(), c: df.color, rad: 14 + r.len * 0.9 }); });
  function canopy(t, o = {}) { const d = new Float32Array(4096 * 6); let n = 0; const gain = o.gain ?? 1;
    for (const q of nodeList) { if (q.g > t || n >= 4096) continue; const k = 0.35 + 0.65 * Math.exp(-(t - q.g) * 0.8); d.set([q.x, q.z, q.rad * (o.radius ?? 1), q.c[0] * 0.05 * k, q.c[1] * 0.05 * k, q.c[2] * 0.05 * k + 0.006 * k], n * 6); n++; }
    return G.drawable(d, n, { gain }); }
  const glow = (list) => { const d = new Float32Array(list.length * 6); list.forEach((q, i) => d.set([q.x, q.z, q.r, q.c[0], q.c[1], q.c[2]], i * 6)); return G.drawable(d, list.length, {}); };

  // ---- dawn as a function of song time (SPEC: lighting carries the fidelity arc)
  const DK = [[0, 0], [bar(65), 0], [bar(69), 0.1], [bar(73) - 0.05, 0.2], [bar(73), 0.27], [bar(81), 0.35], [bar(86), 0.4], [bar(89) - 0.2, 0.5], [bar(89), 0.6], [bar(104), 0.62], [bar(105) - 0.01, 0.62],
    [bar(105), 0.0], [bar(117), 0.03], [bar(121), 0.1], [bar(125), 0.3], [bar(129) - 0.3, 0.52], [bar(129), 0.6], [bar(133), 0.63], [bar(137) - 0.02, 0.74], [bar(137), 0.86], [bar(139), 1.0], [bar(153) - 0.01, 1.0], [bar(153), 0.0], [999, 0.0]];
  const dawn = (t) => { for (let i = 0; i < DK.length - 1; i++) if (t < DK[i + 1][0]) return DK[i][1] + (DK[i + 1][1] - DK[i][1]) * ((t - DK[i][0]) / (DK[i + 1][0] - DK[i][0])); return 0; };

  // ---- draw the world. o: { head, lights:false, canopy:true|{...}, text:0..1, gain, minPx, widthScale, flow, flowSpeed, pulses, halo, haloPx, headGain, only:['fork','conn','merge','main','violet','art','out'], per-set overrides e.g. o.conn = { gain, hide } }
  const SETS = { fork: forkR, conn: connR, named: namedR, merge: mergeR, main: mainR, violet: violetR2, art: artR, out: outR };
  function draw(t, o = {}) {
    const list = []; if (o.canopy) list.push(canopy(o.head ?? t, o.canopy === true ? {} : o.canopy));
    const base = { head: o.head ?? t, gain: o.gain ?? 2.4, fogDist: o.fogDist, textGain: o.text ?? 0.7, minPx: o.minPx, widthScale: o.widthScale, flow: o.flow ?? 0.1, flowSpeed: o.flowSpeed, pulses: o.pulses, halo: o.halo, haloPx: o.haloPx, headGain: o.headGain, headLen: o.headLen, nodeMinPx: o.nodeMinPx, soft: o.soft, ink: o.ink };
    for (const k of o.only || ['art', 'conn', 'named', 'fork', 'merge', 'violet', 'out', 'main']) { const ov = o[k] || {}; if (ov.hide) continue;
      list.push(SETS[k].drawable({ ...base, ...(k === 'art' ? { gain: base.gain * 0.55, textGain: 0 } : k === 'conn' ? { gain: base.gain * 0.3, halo: 0, flow: 0, textGain: 0, minPx: Math.min(base.minPx ?? 1.0, 1.2) } : {}), ...ov })); }
    if (o.lights !== false) list.push(lights(t, o.lights || {}));
    return list;
  }
  // top-down framing of a box. up: 'east' (screen-up = +x, screen-right = +z) or 'map' (screen-right = +x east, screen-up = -z)
  function frameBox(x0, x1, z0, z1, o = {}) { const fov = o.fov ?? 35, k = 2 * Math.tan((fov * Math.PI) / 360), asp = E.W / E.H, m = o.margin ?? 1.08; const east = (o.up ?? 'east') === 'east';
    const h = east ? Math.max(((x1 - x0) * m) / k, ((z1 - z0) * m) / (k * asp)) : Math.max(((z1 - z0) * m) / k, ((x1 - x0) * m) / (k * asp)); const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    return { pos: [cx, h, cz], target: [cx, 0, cz], fov, near: Math.max(1, h * 0.05), far: h * 4 + 20000, topUp: east ? [1, 0, 0] : [0, 0, -1], h }; }
  const bounds = (roads, pred) => { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const r of roads) { if (pred && !pred(r)) continue; for (let i = 0; i < r.n; i++) { const x = r.P[i * 2], z = r.P[i * 2 + 1]; if (x < x0) x0 = x; if (x > x1) x1 = x; if (z < z0) z0 = z; if (z > z1) z1 = z; } } return { x0, x1, z0, z1 }; };
  const forkBox = bounds(almond.roads, (r) => r.def.kind === 'fork'), almondBox = bounds(almond.roads), outBox = bounds(outR.roads), artBox = bounds(artR.roads);

  return { ROOT, M1, FLOAT, FORM, CATCH, VEND, TF, TM, TO, tSent, tSentEnd, LANE, LIVES, VIOLET, col, count, outCount, sets: SETS, almond: A, path: (n) => paths.get(n), paths, lives: LIVES, heroPath, violetPath,
    heroAt, walkerAt, walkerS, mergeSibling, tPause0, tPause1, eastX, lights, canopy, glow, dawn, draw, frameBox, forkBox, almondBox, outBox, artBox, bounds };
}
