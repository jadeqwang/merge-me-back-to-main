// FROZEN v1 EDL (song v1 "Merge Me Back to Main.wav", analysis/). Pre-port copy of engine/show/main.js (= work/main.pre_v2port.js); loaded by
// main.js when the page runs with ?timing=v1. Do not edit for the revised song — edit main.js.
// The show EDL (v1 animatic). Times are song seconds; bars come from the measured grid. Picks: work/picks.json.
const T = await import('/engine/src/time.js'); await T.loadTiming();
if (T.VERSION !== 'v1') console.warn('main_v1.js is the v1 EDL but timing is', T.VERSION, '- add &timing=v1');
const PICKS = await (await fetch('/work/picks.json')).json().catch(() => ({}));
const B = T.bar, W = T.words;
const fmt = (n) => n.toLocaleString('en-US');
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const rng = (a) => () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
// monotone cubic through [[x, y], ...] (Fritsch–Carlson: no overshoot; flat at the ends)
function spline(K) {
  const n = K.length, X = K.map((k) => k[0]), Y = K.map((k) => k[1]), d = [], m = [];
  for (let i = 0; i < n - 1; i++) d[i] = (Y[i + 1] - Y[i]) / (X[i + 1] - X[i]);
  m[0] = 0; m[n - 1] = 0; for (let i = 1; i < n - 1; i++) m[i] = d[i - 1] * d[i] <= 0 ? 0 : (d[i - 1] + d[i]) / 2;
  for (let i = 0; i < n - 1; i++) { if (!d[i]) { m[i] = m[i + 1] = 0; continue; } const a = m[i] / d[i], b = m[i + 1] / d[i], s = a * a + b * b; if (s > 9) { const k = 3 / Math.sqrt(s); m[i] = k * a * d[i]; m[i + 1] = k * b * d[i]; } }
  return (x) => { if (x <= X[0]) return Y[0]; if (x >= X[n - 1]) return Y[n - 1]; let i = 0; while (x > X[i + 1]) i++;
    const h = X[i + 1] - X[i], t = (x - X[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * Y[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * Y[i + 1] + (t3 - t2) * h * m[i + 1]; };
}
const TITLE = 'MERGE', SUBTITLE = 'merge me back to main';   // the song's title (one word) and its hook
const L = { orange: '#FF7A1A', rose: '#FF5FA2', sky: '#6FB6FF', mint: '#4FE3B0', gold: '#FFD23F', violet: '#A57BFF', white: '#F4F4F8' };
// the branches are her lives: [shot, branch, lane, commit message, hash]
const LIFE = [
  ['lf_piano_rose', 'jade/piano', L.rose, 'started piano before I was three', '3f9a1c2'],
  ['lf_violin_white', 'jade/violin', L.white, 'played violin in the school orchestra', '8d02e6b'],
  ['lf_wushu_gold', 'jade/wushu', L.gold, 'bronze: collegiate wushu, group set', '4b7e2d9'],
  ['lf_lab_mint', 'jade/wet-lab', L.mint, 'kept the neurons alive (first paper, 2005)', '7c21d4b'],
  ['lf_booth_sky', 'jade/phd', L.sky, 'PhD: how the brain listens (2010)', 'e5b0a17'],
  ['lf_poet_gold', 'jade/poet', L.gold, 'published poems between experiments', '5d3b9f8'],
  ['lf_ames_white', 'jade/nasa-ames', L.white, 'research at NASA Ames', '0d9c8f2'],
  ['lf_band_rose', 'jade/robot-ninja-apocalypse', L.rose, 'played loud songs, 2011–2013', '9be44a1'],
  ['lf_house_gold', 'jade/chez-jj', L.gold, '400 hackers under one roof', 'a41e7d0'],
  ['lf_stage_sky', 'jade/open-source', L.sky, 'the live demo worked', 'c8f2a61'],
  ['lf_home_mint', 'jade/home', L.mint, 'lost to my kids at video games, again', '2e7b0c4'],
];
const life = (id) => LIFE.find((x) => x[0] === id);
// plate for a shot: the picked take (with its audio-ref S0) or the still fallback
function pk(shot, t0) {
  const p = PICKS[shot];
  if (p) return { plate: p.plate, s0: p.take.startsWith('still_') ? t0 : (p.s0 ?? t0) };
  return { plate: `/work/plates/still_${shot}`, s0: t0 };
}
const push = (k = .05) => (u) => ({ dolly: 1 - k * u, over: 1.06 });
const lines = (i) => W(i);


// ---- light FX drawn into the type layer (composited before bloom, so they glow)
const FX = {
  sun(g, t, { x = 960, y = 640, r = 160, k = 1, disc = false } = {}) {
    g.save(); g.globalCompositeOperation = 'lighter';
    const halo = g.createRadialGradient(x, y, r * .2, x, y, r * 5.5); halo.addColorStop(0, `rgba(255,220,150,${.55 * k})`); halo.addColorStop(.3, `rgba(255,140,80,${.22 * k})`); halo.addColorStop(1, 'rgba(255,90,120,0)');
    g.fillStyle = halo; g.fillRect(0, 0, 1920, 1080);
    // god rays
    for (let i = 0; i < 18; i++) { const a = i / 18 * Math.PI * 2 + t * .05, w = .05 + .03 * Math.sin(i * 7.3);
      const gr = g.createLinearGradient(x, y, x + Math.cos(a) * 1400, y + Math.sin(a) * 1400); gr.addColorStop(0, `rgba(255,214,150,${.10 * k})`); gr.addColorStop(1, 'rgba(255,214,150,0)');
      g.fillStyle = gr; g.beginPath(); g.moveTo(x, y); g.arc(x, y, 1500, a - w, a + w); g.closePath(); g.fill(); }
    if (disc) { g.fillStyle = `rgba(255,246,228,${k})`; g.beginPath(); g.arc(x, y, r * .55, 0, 7); g.fill(); }
    // anamorphic flare
    const fl = g.createLinearGradient(0, y, 1920, y); fl.addColorStop(0, 'rgba(120,170,255,0)'); fl.addColorStop(.5, `rgba(190,215,255,${.5 * k})`); fl.addColorStop(1, 'rgba(120,170,255,0)');
    g.fillStyle = fl; g.fillRect(0, y - 3, 1920, 6);
    g.restore();
  },
  streaks(g, t, t0, t1, every = 2) {   // lane-coloured comets on kicks
    const bt = T.beats().filter((b) => b >= t0 && b < t1); const cols = Object.values(L);
    g.save(); g.globalCompositeOperation = 'lighter';
    bt.forEach((b, i) => { if (i % every) return; const age = t - b; if (age < 0 || age > .7) return;
      const y = 160 + ((i * 397) % 760), dir = i % 4 < 2 ? 1 : -1, x = dir > 0 ? -400 + age * 4200 : 2320 - age * 4200, c = cols[i % cols.length];
      const gr = g.createLinearGradient(x - dir * 700, y, x, y); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, c);
      g.globalAlpha = 1 - age / .7; g.strokeStyle = gr; g.lineWidth = 5; g.beginPath(); g.moveTo(x - dir * 700, y + dir * 40); g.lineTo(x, y); g.stroke(); });
    g.restore();
  },
};
const punch = (t, base = 1, amt = .025) => base - amt * T.pulse(t, .14);

const S = [];
// ------------------------------------------------------------------------------------------ INTRO bars 1–16
// Five-year-old Jade at a frosted window (the frost already branches) → she blows on her palm (身外身法: hairs into clones)
// → the strands become drones → the drone tree, one fork per bar from bar 3 (the split chimes, tools/mix.py), 1 → 1,024.
{
  const SPLIT0 = 3, SPLITS = 10;
  const forkT = (g) => B(SPLIT0 + g - 1);                       // fork g lands on this bar (chime g)
  const beat = (B(SPLIT0) - B(SPLIT0 - 1)) / 4;
  const forks = (t) => { let g = 0; while (g < SPLITS && t >= forkT(g + 1)) g++; return g; };
  const tB0 = B(1) + 3 * (B(2) - B(1)) / 4, tC0 = B(SPLIT0) - beat;   // window | blow | tree (cuts on beat 4 of bar 1 and beat 4 of bar 2)
  // the takes: the window shot ends on her lifting her palm (clip end, 6.0 s); the blow lands the exhale + strand lift right before the swarm cut
  const winS0 = tB0 - 6.0, blowS0 = tC0 - 3.05, FPS_CH0 = 24;
  // counter + mono line + title: one function of t, drawn by every intro shot
  const introText = (ty, t, scrim = 0) => {
    if (scrim) { const c = ty.g, gr = c.createRadialGradient(1770, 960, 0, 1770, 960, 260); gr.addColorStop(0, `rgba(4,5,12,${.55 * scrim})`); gr.addColorStop(1, 'rgba(4,5,12,0)');
      c.fillStyle = gr; c.fillRect(1400, 640, 520, 440); }
    ty.mono('one repo per agent. per session. per life.', t, .35, { x: 72, y: 84, size: 22, cps: 26, out: B(16) });
    const g = forks(t), n = 1 << g, since = t - (g ? forkT(g) : -9), c = ty.g; c.save();
    const pn = 1 + .18 * Math.exp(-since * 7); c.translate(1840, 1010); c.scale(pn, pn);
    c.font = '800 150px UNB'; c.textAlign = 'right'; c.lineWidth = 2;
    c.strokeStyle = `rgba(255,241,220,${.5 + .5 * Math.exp(-since * 3)})`; c.strokeText(fmt(n), 0, 0);
    c.font = '500 22px JBM'; c.fillStyle = 'rgba(255,241,220,.7)'; c.fillText(n === 1 ? 'branch' : 'branches', 0, 36); c.restore();
    // title: slams at B(9) over the young tree, then after a bar shrinks and lifts into the dark sky above the canopy (the 256 → 1,024 bloom stays clear)
    const tt = B(9);
    if (t >= tt - .05 && t < B(15) + 1) {
      const k = clamp((t - tt + .05) / .25), out = clamp((t - B(14)) / 1.2), lift = ss(B(10), B(10) + 1.1, t);
      const s = (1.25 - .25 * (1 - Math.pow(1 - k, 3))) * (1 - .62 * lift), y = 560 - 445 * lift;
      c.save(); c.globalAlpha = k * (1 - out); c.textAlign = 'center'; c.fontStretch = 'expanded';
      c.shadowColor = '#FFC46B'; c.shadowBlur = 30 * Math.exp(-(t - tt) * 2) + 5 * lift;
      c.translate(960, y); c.scale(s, s);
      c.fillStyle = '#FFF1DC'; c.font = '900 300px ARCH'; c.fillText(TITLE, 0, 70); c.restore();
      c.save(); c.globalAlpha = k * (1 - out); c.textAlign = 'center'; c.font = '500 30px JBM'; c.fillStyle = 'rgba(255,241,220,.85)';
      const sy = y + (150 * s), ss2 = 1 - .25 * lift; c.translate(960, sy + 16 * lift); c.scale(ss2, ss2); c.fillText(SUBTITLE, 0, 0); c.restore();
    }
  };
  // frost on the glass: fern dendrites (the tree before the tree) drawn in light over the plate's frost, growing node by node
  const frost = (seeds, seed, t0, rate) => {
    const r = rng(seed), segs = [];
    const fern = (x, y, a, L, d, tb) => {
      const m = d === 0 ? 6 : 4; let px = x, py = y;
      for (let i = 0; i < m; i++) {
        const l = L / m * (1 - .35 * i / m), aa = a + (r() - .5) * .18, nx = px + Math.cos(aa) * l, ny = py + Math.sin(aa) * l, ti = tb + i * rate;
        segs.push([px, py, nx, ny, d, ti]);
        if (d < 2) { const sl = L * (d === 0 ? .42 : .5) * (1 - .55 * i / m), side = i % 2 ? 1 : -1;
          fern(nx, ny, a + side * 1.05, sl, d + 1, ti + rate * .6); if (d === 0) fern(nx, ny, a - side * 1.05, sl * .8, d + 1, ti + rate); }
        px = nx; py = ny;
      }
    };
    seeds.forEach(([x, y, a, L], i) => fern(x, y, a, L, 0, t0 + i * .11));
    return (c, t, k = 1) => {
      c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round'; c.shadowColor = 'rgba(255,214,160,.9)'; c.shadowBlur = 9;
      for (let d = 0; d <= 2; d++) {
        c.beginPath(); let any = false;
        for (const [x, y, x2, y2, dd, tb] of segs) { if (dd !== d) continue; const f = clamp((t - tb) / rate); if (f <= 0) continue; any = true;
          c.moveTo(x, y); c.lineTo(x + (x2 - x) * f, y + (y2 - y) * f); }
        if (any) { c.strokeStyle = `rgba(255,244,228,${[.5, .38, .3][d] * k})`; c.lineWidth = [2.2, 1.4, .9][d]; c.stroke(); }
      }
      c.shadowBlur = 0;                                            // glints where the frost is still growing
      for (const [, , x2, y2, d, tb] of segs) { const a = t - tb - rate; if (a < 0 || a > .45) continue;
        c.fillStyle = `rgba(255,250,240,${.85 * Math.exp(-a * 7) * k})`; c.beginPath(); c.arc(x2, y2, d ? 1.6 : 2.4, 0, 7); c.fill(); }
      c.restore();
    };
  };
  const frostA = frost([[40, 1040, -1.05, 420], [10, 560, -.3, 380], [260, -10, 1.35, 360], [700, -10, 1.95, 340], [10, 860, -.75, 330], [20, 200, .45, 300]], 11, .1, .12);
  const frostB = frost([[1880, 1060, -2.0, 360], [1900, 120, 2.55, 320], [1240, -10, 1.15, 300], [1620, -10, 1.85, 300]], 23, tB0 - .6, .11);
  // the breath: the strand that lifts off her palm in the take (keyframed bezier, measured from the rgb frames; plate px at 1920 wide)
  // catches the light, then in the last beat splits into copies (身外身法) whose points fly off: they become the drones
  const SK = [[30, [1080, 775], [1150, 790], [1230, 785], [1280, 760]], [36, [1100, 770], [1180, 790], [1260, 780], [1300, 750]],
    [48, [1180, 762], [1340, 770], [1400, 690], [1390, 600]], [60, [1200, 762], [1400, 760], [1430, 560], [1405, 400]],
    [72, [1290, 735], [1440, 700], [1440, 380], [1300, 170]], [84, [1330, 720], [1470, 640], [1450, 250], [1290, -60]]];
  const LIPS = [[30, 967, 683], [36, 991, 690], [42, 1005, 689], [48, 1011, 680], [54, 1014, 670], [60, 1014, 658], [66, 1003, 646], [72, 1003, 637], [78, 996, 628]];
  const lerpK = (K, f, pick) => { let i = 0; while (i < K.length - 2 && f > K[i + 1][0]) i++; const a = K[i], b = K[i + 1], x = clamp((f - a[0]) / (b[0] - a[0])); return pick(a, b, x); };
  const lp = (p, q, x) => [p[0] + (q[0] - p[0]) * x, p[1] + (q[1] - p[1]) * x];
  const scr = (p) => [960 + (p[0] - 960) * 1.06, 540 + (p[1] * 1080 / 1071 - 540) * 1.06];      // plate px -> screen (lattice overscan 1.06, no dolly)
  const bez = (P, q) => { const r = 1 - q; return [0, 1].map((k) => r * r * r * P[0][k] + 3 * r * r * q * P[1][k] + 3 * r * q * q * P[2][k] + q * q * q * P[3][k]); };
  const breath = (c, t) => {
    const fr = (t - blowS0) * FPS_CH0, P = lerpK(SK, fr, (a, b, x) => [1, 2, 3, 4].map((k) => scr(lp(a[k], b[k], x))));
    const on = ss(38, 50, fr), split = ss(62, 74, fr);
    c.save(); c.globalCompositeOperation = 'lighter'; c.lineCap = 'round';
    // the breath itself: a faint warm mist from her lips across the palm
    const L = scr(lerpK(LIPS, fr, (a, b, x) => [a[1] + (b[1] - a[1]) * x, a[2] + (b[2] - a[2]) * x]));
    const m = ss(28, 36, fr) * (1 - ss(56, 70, fr)), gr = c.createRadialGradient(L[0] + 90, L[1] + 50, 0, L[0] + 90, L[1] + 50, 230);
    gr.addColorStop(0, `rgba(255,236,210,${.13 * m})`); gr.addColorStop(1, 'rgba(255,236,210,0)'); c.fillStyle = gr; c.fillRect(L[0] - 200, L[1] - 200, 600, 600);
    if (on <= 0) { c.restore(); return; }
    const NC = 1 + Math.round(7 * split);                                   // 1 strand -> 8 copies, fanning out
    for (let k = 0; k < NC; k++) {
      const a = k === 0 ? 1 : clamp(split * 7 - (k - 1)), side = k % 2 ? 1 : -1, ang = k === 0 ? 0 : side * .11 * Math.ceil(k / 2) * (.4 + .6 * split);
      const cs = Math.cos(ang), sn = Math.sin(ang), O = P[0];
      const Q = P.map(([x, y], j) => { const dx = x - O[0], dy = y - O[1], s = 1 + .05 * k * j / 3; return [O[0] + (dx * cs - dy * sn) * s, O[1] + (dx * sn + dy * cs) * s]; });
      if (k === 0) { c.shadowColor = 'rgba(255,200,130,.9)'; c.shadowBlur = 12; c.strokeStyle = `rgba(255,230,190,${.9 * on * (1 - .6 * split)})`; c.lineWidth = 2.6;
        c.beginPath(); for (let j = 0; j <= 30; j++) { const [x, y] = bez(Q, j / 30); j ? c.lineTo(x, y) : c.moveTo(x, y); } c.stroke(); c.shadowBlur = 0; }
      const N = 22;
      for (let j = 0; j < N; j++) {
        const q = (j + .5) / N, fly = split * split * (60 + 220 * q) * (1 + .15 * k);
        let [x, y] = bez(Q, q); x += fly * .35 * side * (k ? 1 : 0) + 8 * Math.sin(t * 5 + j + k * 2); y -= fly;
        const b = Math.min(1, a * on * (.45 + .55 * q) * (.8 + .6 * split)) * (k ? .8 : 1), cool = split * q, R = 8 + 7 * split;
        const col = `${Math.round(255 - 95 * cool)},${Math.round(232 + 6 * cool)},${Math.round(196 + 59 * cool)}`;
        const g2 = c.createRadialGradient(x, y, 0, x, y, R); g2.addColorStop(0, `rgba(${col},${b})`); g2.addColorStop(.25, `rgba(${col},${b * .45})`); g2.addColorStop(1, 'rgba(0,0,0,0)');
        c.fillStyle = g2; c.fillRect(x - R, y - R, 2 * R, 2 * R); c.fillStyle = `rgba(255,252,246,${b * (.3 + .7 * split)})`; c.beginPath(); c.arc(x, y, 1.6, 0, 7); c.fill();
      }
    }
    // glitter around the strand (the take's own sparkle, in light)
    const gr3 = rng(7);
    for (let j = 0; j < 60; j++) { const q = gr3(), [x, y] = bez(P, q), ox = (gr3() - .5) * 110, oy = (gr3() - .5) * 90 - split * 120 * gr3();
      const tw = Math.pow(.5 + .5 * Math.sin(t * (6 + 6 * gr3()) + j * 2.1), 6) * on;
      if (tw < .05) continue; c.fillStyle = `rgba(255,244,220,${.9 * tw})`; c.beginPath(); c.arc(x + ox, y + oy, 1.4 + 1.6 * tw, 0, 7); c.fill(); }
    c.restore();
  };
  S.push({ t0: 0, t1: tB0, kind: 'lattice', ...pk('ch0_window', 0), s0: winS0, fid: () => 1, cam: (u) => ({ dolly: 1 - .05 * u, over: 1.06 }),
    text: (ty, t) => { frostA(ty.g, t); introText(ty, t, 1); } });
  S.push({ t0: tB0, t1: tC0, kind: 'lattice', ...pk('ch0_blow', tB0), s0: blowS0, fid: () => 1, cam: () => ({ dolly: 1, over: 1.06 }),
    text: (ty, t) => { frostB(ty.g, t, .8); breath(ty.g, t); introText(ty, t, 1); } });
  // the tree: generation g is drawn on bar SPLIT0+g-1 (sharp front, bright heads), a wave of light runs root → tips into each fork
  const gk = (t) => {
    let G = 1;
    for (let g = 1; g <= SPLITS; g++) { const a = forkT(g); if (t < a) break;
      const top = g === SPLITS ? 12.6 : g + 1, dur = g === SPLITS ? 1.2 * (B(SPLIT0 + SPLITS) - a) : beat * (g < 4 ? 2.2 : 1.8), x = clamp((t - a) / dur);
      G = g + (top - g) * (1 - Math.pow(1 - x, 3)); }
    return G;
  };
  const wave = (t) => {
    for (let g = 1; g <= SPLITS; g++) { const a = forkT(g), lead = beat * .9;
      if (g > 1 && t >= a - lead && t < a) { const x = (t - (a - lead)) / lead; return { pos: g * x * x, amp: 1.1, tail: .6 }; }
      if (t >= a && t < a + .7) return { pos: gk(t) + .05, amp: 1.1 * Math.exp(-(t - a) / .25), tail: .6 }; }
    return { amp: 0 };
  };
  const bars = [2.75, 3, 3.6, 5, 7, 9, 11, 13, 15, 15.8, 17];    // camera keys (bar numbers): close on the root → the full canopy (the breakdown's framing) → the horizon
  const key = (vals) => spline(bars.map((b, i) => [b, vals[i]]));
  const camD = key([9.5, 11.5, 12.5, 16, 20, 24, 27.5, 30, 30.5, 29, 22]), camH = key([.8, .9, .95, 1, 1.1, 1.15, 1.2, 1.2, 1.2, .9, .25]),
    camY = key([2.1, 3.5, 3.9, 4.7, 5.4, 5.9, 6.2, 6.4, 6.4, 5.4, .95]);
  // a slow orbit (~.08 rad/s): the first fork opens side-on (a clean Y), and by bar 13 the camera sits where the breakdown's tree is seen from
  const orbit = (t) => 1.58 + (.25 - 1.58) * (t - B(4)) / (B(13) - B(4));
  const o0 = orbit(tC0), side = [Math.cos(o0), 0, -Math.sin(o0)], fwd = [Math.sin(o0), 0, Math.cos(o0)];
  S.push({ t0: tC0, t1: B(17), kind: 'dronetree', bloom: .7,
    gain: (u, t) => .72 * (.62 + .38 * ss(B(3), B(5), t)) * (1 + .35 * Math.exp(-Math.max(0, t - B(9)) / .45) * (t >= B(9) ? 1 : 0)),   // close early = big dots: tame; the title slam is the peak
    growKey: (u, t) => ({ tree: gk(t), trunk: 1.42 * ss(tC0 - .08, forkT(1) + .05, t) }),
    frontKey: 1, trunkSoft: .4, growSoft: .12, segGap: .15, popK: 3.2, popGain: (u, t) => 1 + .5 * ss(B(4), B(6), t), trunkPopGain: .2,
    flyFrom: [-side[0] * 7 + fwd[0] * 2, 1.4, -side[2] * 7 + fwd[2] * 2], flySpread: 2.2,
    wave: (u, t) => wave(t),
    flow: (u, t) => 1.2 + 2.8 * ss(B(13), B(14), t), pulseGain: .7,
    flash: (u, t) => { const g = forks(t); return (g ? .22 * Math.exp(-(t - forkT(g)) / .3) * (g === SPLITS ? 1.3 : g === 1 ? .5 : 1) : 0) + (t >= B(9) ? .5 * Math.exp(-(t - B(9)) / .4) : 0); },
    cam: (u, t) => { const b = T.barAt(t); return { orbit: orbit(t), dist: camD(b), height: camH(b), lookY: camY(b) }; },
    text: (ty, t) => introText(ty, t) });
}
// ------------------------------------------------------------------------------------------ VERSE 1 bars 17–32
{ // L1 "I split myself a thousand ways": she splits again at ground level, copies walking apart
  const w = lines(1), t0 = B(17), t1 = 33.85;
  const at = [w[1].start, w[4].start, w[5].start];    // split, thousand, ways
  const copies = [];
  const spread = [[-.42, .0], [.4, .0], [-.82, .02], [.78, .02], [-1.15, .04], [1.1, .04], [-1.45, .05]];
  at.forEach((a, gi) => { const k = [1, 2, 4][gi]; for (let i = 0; i < k && copies.length < 7; i++) copies.push({ dt: (copies.length + 1) * .9, at: a, dur: .7, off: spread[copies.length], scale: .82 - .1 * gi, dens: .42 - .08 * gi, lane: Object.values(L)[(copies.length + 1) % 7], share: true }); });
  S.push({ t0, t1, kind: 'lattice', ...pk('v1_split_front', 28.45), fid: () => 1, copies, cam: (u) => ({ dolly: 1 - .04 * u, over: 1.06 }),
    text: (ty, t) => { ty.ledHook(w, t, { x: 110, y: 250, size: 120, maxW: 1100, out: t1 - .3 }); } });
}
{ // L2 "Down every road the night could hold"
  const w = lines(2), t0 = 33.85, t1 = 41.9;
  S.push({ t0, t1, kind: 'lattice', ...pk('v1_track_rose', t0), fid: () => .25, lane: L.rose, laneAmt: .12, cam: (u) => ({ dolly: 1, pan: [-.02 * u, 0], over: 1.08 }),
    text: (ty, t) => { ty.line(w, t, { y: 960, size: 60, out: 41.5 }); ty.chyron('jade/down-every-road', t, t0 + .3, t1 - .2, L.rose); } });
}
{ // L3 "Each one a light I sent ahead" (sync)
  const w = lines(3), t0 = 41.9, t1 = 47.75;
  S.push({ t0, t1, kind: 'lattice', ...pk('v1_light_hands', 42.4), fid: () => 1, cam: push(.06),
    text: (ty, t) => { ty.ledHook(w, t, { x: 110, y: 300, size: 118, maxW: 820, out: t1 - .25 }); } });
}
{ // L4 "Each one a story to unfold" — her lives, one per cut, the cuts quickening (2-1-1 beats); each branch is still written (ASCII)
  const w = lines(4), beats = T.beats().filter((b) => b >= 47.6 && b < 54.7);
  const len = [2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 2];
  let k = 0; const cut = [47.75]; len.forEach((n) => { k += n; cut.push(k < beats.length ? beats[k] : 54.7); }); cut[cut.length - 1] = 54.7;
  LIFE.forEach(([id, br, lane], i) => {
    const t0 = cut[i], t1 = cut[i + 1];
    S.push({ t0, t1, kind: 'lattice', ...pk(id, t0 - 1.0), s0: t0 - 1.0, fid: () => .25, written: true, lane, laneAmt: .1, cam: push(.04),
      text: (ty, t) => { ty.chyron(br, t, t0 + .02, t1, lane); ty.line(w, t, { y: 960, size: 60 }); } });
  });
}
// ------------------------------------------------------------------------------------------ PRE-CHORUS bars 33–40 — the sync grid, then fold
{
  const t0 = 54.7, t1 = 69.95, w5 = lines(5), w6 = lines(6);
  const ids = ['lf_piano_rose', 'lf_wushu_gold', 'lf_lab_mint', 'lf_poet_gold', 'lf_ames_white', 'lf_band_rose', 'lf_house_gold', 'lf_stage_sky', 'lf_home_mint'].map((id) => [id, life(id)[2]]);
  const turn = 58.4;           // every branch turns her head together, here
  const cols = 3, rows = 3, pw = 1 / 3, ph = 1 / 3;
  const foldStart = 63.2;
  const panels = ids.map(([id, lane], i) => {
    const cx = i % cols, cy = Math.floor(i / cols);
    const gx = (cx - 1) * pw * 1.777, gy = (1 - cy) * ph;
    const p = pk(id, 0);
    return { plate: p.plate, s0: turn - 6.3, lane, laneAmt: .1, rw: 640, rh: 360, cellFig: 2.5, cellWorld: 7, fid: () => 1,
      xf: (t) => {
        const appear = clamp((t - (t0 + i * .18)) / .35);
        const f = ss(foldStart + i * .55, foldStart + i * .55 + 1.1, t);      // origami fold toward the centre
        const s = ph * (1 - .9 * f);
        return { x: gx * (1 - f), y: gy * (1 - f), z: 0, ry: f * Math.PI * (cx - 1 || .5), rx: f * .6 * (cy - 1 || .5), s: s * 1.0, a: appear * (1 - ss(.85, 1, f)) };
      } };
  });
  const origin = 65.8;
  const preText = (ty, t) => { ty.ledHook(w6, t, { x: 960, y: 900, size: 110, maxW: 1700, align: 'center', out: 69.6 }); };
  S.push({ t0: origin, t1, kind: 'forktree', ...pk('intro_up', 0), splitBar0: 3, splits: 10, treeTime: () => 1.2, trailT: -1, text: (ty, t) => preText(ty, t) });
  S.push({ t0, t1: origin, kind: 'panels', panels, cam: () => ({}),
    text: (ty, t) => {
      // branch names on the grid cells, gone as each cell folds
      const g = ty.g; g.save(); g.font = '500 17px JBM'; g.textBaseline = 'alphabetic';
      ids.forEach(([id, lane], i) => {
        const cx = i % cols, cy = Math.floor(i / cols), f = ss(foldStart + i * .55, foldStart + i * .55 + .5, t), a = clamp((t - (t0 + i * .18)) / .35) * (1 - f);
        if (a <= 0) return;
        const x = 960 + (cx - 1) * 640 - 306, y = 540 + (cy - 1) * 360 - 152;
        g.globalAlpha = a; g.fillStyle = lane; g.beginPath(); g.arc(x + 6, y - 6, 5, 0, 7); g.fill();
        g.fillStyle = 'rgba(255,241,220,.9)'; g.fillText(life(id)[1], x + 18, y);
      });
      g.restore();
      ty.line(w5, t, { y: 1000, size: 56, out: 60.2 });
      preText(ty, t);
    } });
}
// ------------------------------------------------------------------------------------------ CHORUS 1 bars 41–56
{ const w = lines(7), t0 = 69.95, t1 = 75.7;
  S.push({ t0, t1, kind: 'lattice', ...pk('ch1_main', 69.75), fid: (u) => .55 + .45 * u, cam: push(.06),
    text: (ty, t) => { ty.mono('git merge --no-ff branch/*', t, t0 + .1, { x: 110, y: 200, size: 24, out: t1 - .4 }); ty.ledHook(w, t, { x: 110, y: 420, size: 170, maxW: 860, out: t1 - .45 }); } });
}
{ const w = lines(8), t0 = 75.7, t1 = 79.6;   // the tree runs home
  const G1 = B(12) + 1.2;
  S.push({ t0, t1, kind: 'forktree', ...pk('intro_up', 0), splitBar0: 3, splits: 10, treeTime: (t) => G1 - (t - t0) / (t1 - t0) * (G1 - B(3) + .2),
    trailT: 1e9, glow: () => 1.0,
    text: (ty, t) => { ty.ledHook(w, t, { x: 960, y: 520, size: 120, maxW: 1600, align: 'center', out: 83.3 }); } });
}
{ const w = lines(8), t0 = 79.6, t1 = 83.6;
  S.push({ t0, t1, kind: 'lattice', ...pk('ch1_runners', t0), fid: () => 1, cam: push(.08),
    text: (ty, t) => { ty.ledHook(w, t, { x: 960, y: 520, size: 120, maxW: 1600, align: 'center', out: 83.3 }); } });
}
{ const w = lines(9), t0 = 83.6, t1 = 89.75;
  S.push({ t0, t1, kind: 'lattice', ...pk('ch1_fold', t0 + .2), fid: (u) => .7 + .3 * u, cam: push(.05),
    text: (ty, t) => { ty.ledHook(w, t, { x: 110, y: 230, size: 140, maxW: 900, out: t1 - .2 }); } });
}
{ const w = lines(10), t0 = 89.75, t1 = 100.6;
  S.push({ t0, t1, kind: 'lattice', ...pk('ch1_gone_close', 89.8), fid: () => 1, cam: (u) => ({ dolly: 1 - .05 * u + .25 * ss(.65, 1, u), over: 1.06 }),
    text: (ty, t) => { ty.ledHook(w, t, { x: 100, y: 250, size: 112, maxW: 760, out: 99.8 }); } });
}
// ------------------------------------------------------------------------------------------ BREAKDOWN bars 57–72
{ const t0 = 100.6, t1 = 112.4, w11 = lines(11), w12 = lines(12);
  const ids = ['lf_piano_rose', 'lf_wushu_gold', 'lf_lab_mint', 'lf_poet_gold', 'lf_ames_white', 'lf_band_rose', 'lf_stage_sky', 'lf_home_mint'];
  const panels = ids.map((id, i) => {
    const a0 = i / ids.length * Math.PI * 2 + .4, p = pk(id, 0);
    return { plate: p.plate, s0: t0 - i * .7, rw: 480, rh: 270, cellFig: 3, cellWorld: 8, fid: () => 1,
      xf: (t) => {
        const wander = ss(103.0, 107.2, t), ret = ss(109.8, 112.3, t);
        const r = .55 * (1 + .5 * wander) * (1 - ret);
        return { x: Math.cos(a0 + .15 * (t - t0)) * r * 1.4, y: Math.sin(a0 + .15 * (t - t0)) * r, z: -.3 + .2 * Math.sin(i + t * .4), rz: .1 * Math.sin(i * 3 + t * .3),
          s: .26 * (1 - .8 * ret), a: clamp((t - t0 - i * .3) / .8) * (1 - ss(.9, 1, ret)), gain: 1.6 };
      } };
  });
  S.push({ t0, t1, kind: 'panels', panels, back: { ...pk('bd_float', t0), cellFig: 3, fid: () => 1 }, cam: () => ({}),
    text: (ty, t) => { ty.line(w11, t, { y: 980, size: 64, out: 108.4 }); ty.line(w12, t, { y: 980, size: 64, out: 112.2 }); } });
}
{ const t0 = 112.4, t1 = 119.1;
  S.push({ t0, t1, kind: 'lattice', ...pk('bd_ahh', 112.2), fid: (u) => .7 + .3 * u, cam: (u) => ({ dolly: 1 - .08 * u, roll: Math.PI, over: 1.06 }) });
}
{ const t0 = 119.1, t1 = B(73);   // the scale reveal: every branch is one tree of light (drone show), drawing home into one point
  S.push({ t0, t1, kind: 'dronetree', bloom: .7, gain: .72,
    grow: (u, t) => ss(t0, 122.6, t), flow: (u, t) => (t < 122.4 ? 4 : -6), flash: (u, t) => 1.2 * T.pulse(t, .25) * ss(124.2, 125.5, t),
    converge: (u, t) => ss(124.4, t1 - .05, t), cam: (u, t) => ({ orbit: .2 + .12 * u, height: 1.2 + 1.5 * u, dist: 30 - 4 * u, lookY: 6.4 }) });
}
// ------------------------------------------------------------------------------------------ BUILD bars 73–88 — sessions (internet brutalism)
{ const t0 = B(73), t1 = B(89);
  const bt = T.beats().filter((b) => b >= t0 - .01 && b < t1);
  const src = [...LIFE.slice(0, 5).map((x) => [x[0], x[2], x[1]]), ['v1_track_rose', L.rose, 'jade/down-every-road'],
    ['v1_light_hands', L.orange, 'jade/light-ahead'], ['ch1_runners', L.sky, 'jade/home-run'], ['v2_dish_sit', L.violet, 'jade/1420-mhz'], ['bd_float', L.orange, 'main'],
    ...LIFE.slice(5).map((x) => [x[0], x[2], x[1]])].slice(0, 16);
  const collapse0 = 148.48, collapse1 = 151.0;
  const panels = src.map(([id, lane], k) => {
    const c = k % 4, r = Math.floor(k / 4), p = pk(id, 0);
    return { plate: p.plate, s0: t0 - (k * 1.37) % 5, lane, laneAmt: .12, rw: 480, rh: 270, cellFig: 3, cellWorld: 7, fid: () => .25, frame: lane,
      xf: (t) => {
        const ap = bt[k] ?? t0;
        if (t < ap) return null;
        const slide = ss(B(77), B(77) + .6, t), dim = ss(B(81), B(81) + .5, t) * (1 - ss(B(85) - .3, B(85), t));
        const col = ss(collapse0, collapse1, t);
        let x = (c - 1.5) * .43, y = (1.5 - r) * .245, s = .23;
        x = x * (1 - .45 * slide) + .47 * slide; y *= 1 - .45 * slide; s *= 1 - .45 * slide;
        x *= 1 - col; y *= 1 - col; s *= 1 - .97 * col;
        const pop = Math.exp(-(t - ap) * 9);
        return { x, y, z: 0, s: s * (1 + .12 * pop), a: (1 - .78 * dim) * (1 - ss(.9, 1, col)), gain: 1.2 + 1.5 * pop };
      } };
  });
  const LOG = [];   // the git log of her lives, forking off main and merging back
  LIFE.forEach(([, br, , msg, h], i) => { if (i % 3 === 0) LOG.push(['|\\', '', '', '']); LOG.push(['| *', h, br, msg]); if (i % 3 === 2) LOG.push(['|/', '', '', '']); });
  LOG.push(['|/', '', '', ''], ['| *', 'f01d9ae', 'jade/1420-mhz', 'listened to hydrogen'], ['*', 'b9e4472', 'main', 'every road I ran']);
  const sun = (g, cx, cy, R, k) => {   // halftone sun of the poster, ours: dot rows with scanline gaps
    for (let y = -R; y <= R; y += 12) { const w = Math.sqrt(Math.max(0, R * R - y * y)); const gap = y > R * .1 && ((y / 12) | 0) % 3 === 0; if (gap) continue;
      for (let x = -w; x <= w; x += 12) { const f = (y + R) / (2 * R); g.fillStyle = `rgba(${255},${Math.round(200 - 110 * f)},${Math.round(80 + 80 * f)},${.85 * k})`;
        g.beginPath(); g.arc(cx + x, cy + y, 3.6 * (1 - .4 * f), 0, Math.PI * 2); g.fill(); } } };
  const graph = (g, t, k) => {   // main line with lanes forking out and merging back, drawn on
    const cx = 960, top = 120, bot = 1000, lanes = [L.rose, L.sky, L.mint, L.gold, L.violet, L.white];
    g.save(); g.globalAlpha = k; g.lineCap = 'round';
    g.strokeStyle = L.orange; g.lineWidth = 6; g.shadowColor = L.orange; g.shadowBlur = 18;
    const grow = ss(B(81), B(83), t);
    g.beginPath(); g.moveTo(cx, bot); g.lineTo(cx, bot - (bot - top) * grow); g.stroke();
    lanes.forEach((c, i) => { const side = i % 2 ? 1 : -1, off = (90 + 80 * Math.floor(i / 2)) * side, y0 = bot - 60 - 70 * Math.floor(i / 2), y1 = top + 160 + 70 * Math.floor(i / 2);
      const kk = ss(B(81) + .3 * i, B(83) + .3 * i, t); if (kk <= 0) return;
      g.strokeStyle = c; g.shadowColor = c; g.lineWidth = 4; g.beginPath();
      const N = 60; for (let j = 0; j <= N * kk; j++) { const u = j / N, yy = y0 + (y1 - y0) * u, b = ss(0, .18, u) * (1 - ss(.82, 1, u)), xx = cx + off * b; j ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
      g.stroke(); g.fillStyle = c; for (let j = 1; j < 5; j++) { const u = .18 + .64 * j / 5; if (u > kk) break; g.beginPath(); g.arc(cx + off, y0 + (y1 - y0) * u, 7, 0, 7); g.fill(); }
      g.stroke(); });
    g.restore(); };
  S.push({ t0, t1, kind: 'panels', panels, cam: () => ({}),
    text: (ty, t) => {
      const g = ty.g, flash = Math.exp(-(t - t0) * 6);
      if (flash > .01) { g.fillStyle = `rgba(255,248,236,${flash})`; g.fillRect(0, 0, 1920, 1080); }
      // pane title bars (only while the grid is up)
      // git log, bars 77–80
      const lk = ss(B(77), B(77) + .4, t) * (1 - ss(B(81) - .2, B(81) + .3, t));
      if (lk > 0) { g.save(); g.globalAlpha = lk; g.font = '500 21px JBM'; g.textBaseline = 'alphabetic';
        const shown = Math.floor((t - B(77)) * 6);
        LOG.slice(0, Math.max(0, shown)).forEach(([gr, h, br, msg], i) => { const y = 150 + i * 44 - Math.max(0, shown - 18) * 44;
          if (y < 110 || y > 1040) return;
          g.fillStyle = L.orange; g.fillText(gr, 64, y); g.fillStyle = L.gold; g.fillText(h, 130, y);
          if (br) { g.fillStyle = br === 'main' ? L.orange : L.sky; g.fillText(`(${br})`, 240, y); g.fillStyle = 'rgba(255,241,220,.9)'; g.fillText(msg, 250 + g.measureText(`(${br})`).width, y); } });
        g.restore(); }
      // poster homage, bars 81–84
      const pk2 = ss(B(81), B(81) + .5, t) * (1 - ss(collapse0 - .4, collapse0, t));
      if (pk2 > 0) { sun(g, 960, 470, 300 * (.9 + .1 * ss(B(81), B(85), t)), pk2 * .75); graph(g, t, pk2); }
      // the whispers, tiny first then the slab
      const wsp = (txt, a, x, y) => { if (t >= a && t < a + 1.6) { g.save(); g.globalAlpha = clamp((t - a) / .2) * (1 - clamp((t - a - 1.2) / .4)); g.font = '400 30px JBM'; g.fillStyle = 'rgba(255,241,220,.85)'; g.textAlign = 'center'; g.fillText(txt, x, y); g.restore(); } };
      wsp('one repo per agent', 136.25, 960, 1000); wsp('per session, per life', 142.78, 960, 1000);
      ty.slam('ONE REPO', t, 137.0, 138.5, { y: 430, size: 250 }); ty.slam('PER AGENT', t, 138.5, 140.0, { y: 650, size: 250 });
      ty.slam('PER SESSION', t, 143.5, 145.3, { y: 160, size: 150, glow: L.gold }); ty.slam('PER LIFE', t, 145.3, 148.4, { y: 930, size: 200, glow: L.orange });
      // collapse → riser → roll
      if (t > collapse1) { const k = ss(collapse1, 153.6, t), r = 4 + 900 * k * k * k;
        const grd = g.createRadialGradient(960, 540, 0, 960, 540, r); grd.addColorStop(0, 'rgba(255,250,240,1)'); grd.addColorStop(.35, `rgba(255,196,107,${.9})`); grd.addColorStop(1, 'rgba(255,122,26,0)');
        const strobe = t > 151.09 ? (Math.floor((t - 151.09) * 16) % 2 ? .55 : 1) : 1; g.globalAlpha = strobe; g.fillStyle = grd; g.fillRect(0, 0, 1920, 1080); g.globalAlpha = 1;
        g.font = '600 24px JBM'; g.fillStyle = 'rgba(255,241,220,.9)'; g.textAlign = 'center'; g.fillText(`merging ${fmt(Math.round(1024 * k))} / 1,024 branches`, 960, 1000); g.textAlign = 'left'; }
      if (t >= 148.0 && t < collapse1) ty.mono('git merge --no-ff --all', t, 148.0, { x: 72, y: 84, size: 24, cps: 30 });
    } });
}
// ------------------------------------------------------------------------------------------ DROP bars 89–104 — MAIN, painted world
{ const D0 = B(89), sunK = (t) => .55 + .45 * ss(D0, D0 + 3, t);
  const dropText = (ty, t) => {
    const g = ty.g;
    FX.streaks(g, t, D0, B(105) - .3, 2);
    if (t < D0 + .9) { const f = Math.exp(-(t - D0) * 5); g.fillStyle = `rgba(255,250,240,${f})`; g.fillRect(0, 0, 1920, 1080); }
  };
  const take = (b, fb) => ({ plate: `/work/plates/${b}`, fb });
  const cuts = [  // [bar, plate, clip time at the cut, sun x,y]
    [89, pk('dr_dance', 0).plate, .3, [960, 520]], [91, pk('dr_center', 0).plate, .4, [540, 300]], [93, pk('dr_run', 0).plate, .5, [1620, 560]],
    [95, pk('dr_wushu', 0).plate, 2.0, [960, 300]], [97, pk('dr_dance', 0).plate, 4.2, [960, 520]], [99, pk('dr_center', 0).plate, 4.4, [600, 320]],
    [101, pk('ch1_fold', 0).plate, .2, [960, 430]]];
  cuts.forEach(([b0, plate, ct, sun], i) => {
    const t0 = B(b0), t1 = B(b0 + 2);
    S.push({ t0, t1, kind: 'lattice', look: 'paint', plate, s0: t0 - ct, fid: () => 1,
      cam: (u, t) => ({ dolly: punch(t, 1 - .05 * u, .035), orbit: (i % 2 ? -1 : 1) * .03 * (u - .5), over: 1.07 }),
      text: (ty, t) => { FX.sun(ty.g, t, { x: sun[0], y: sun[1], r: 150, k: .42 }); dropText(ty, t);
        if (i === 0 && t < D0 + 1.2) ty.ledHook([{ w: 'MAIN', start: D0 }], t, { x: 960, y: 690, size: 520, maxW: 2000, align: 'center', out: D0 + .5, lane: 1, scrim: false });
        if (i === 6) ty.ledHook([{ w: 'ALL', start: B(101) }, { w: 'BRANCHES', start: B(101) + T.TIMING.beat_grid.beats[1].t - T.TIMING.beat_grid.beats[0].t }, { w: 'MERGED', start: B(102) }], t, { x: 960, y: 980, size: 110, maxW: 1800, align: 'center', out: B(103) - .4, lane: 1 }); } });
  });
  { const t0 = B(103), t1 = B(105) - .3, G1 = B(12) + 1.2;
    S.push({ t0, t1, kind: 'forktree', ...pk('intro_up', 0), splitBar0: 3, splits: 10, treeTime: (t) => G1 - ss(t0, t1, t) * (G1 - B(3) + .1), trailT: 1e9, glow: () => .9,
      text: (ty, t) => { FX.sun(ty.g, t, { x: 960, y: 540, r: 50 + 60 * ss(t1 - 1.5, t1, t), k: .15 + .2 * ss(t1 - 2.5, t1, t), disc: true }); dropText(ty, t); } });
  }
  S.push({ t0: B(105) - .3, t1: 181.2, kind: 'card', bg: '#000000', text: (ty, t) => { const g = ty.g; const k = 1 - ss(B(105) - .3, 181.2, t); g.fillStyle = `rgba(255,241,220,${k * .8})`; g.fillRect(0, 0, 1920, 1080); } });
}
// ------------------------------------------------------------------------------------------ VERSE 2 bars 105–120 — the branch that won't come back
const ctxBar = (ty, t, pct) => { const g = ty.g; g.save(); g.font = '500 20px JBM'; g.fillStyle = 'rgba(255,241,220,.8)'; g.fillText('context', 64, 70);
  g.strokeStyle = 'rgba(255,241,220,.6)'; g.lineWidth = 1.5; g.strokeRect(150, 54, 300, 18); g.fillStyle = L.violet; g.fillRect(153, 57, 294 * pct, 12);
  g.fillStyle = 'rgba(255,241,220,.8)'; g.fillText(`${Math.round(pct * 100)}%`, 466, 70); g.restore(); };
{ const w = lines(16), t0 = 181.2, t1 = 186.9;
  S.push({ t0, t1, kind: 'lattice', ...pk('v2_dish_close', 181.4), fid: () => .25, lane: L.violet, laneAmt: .1, cam: push(.04),
    text: (ty, t) => { ctxBar(ty, t, .94 + .01 * (t - t0) / 5); ty.chyron('jade/1420-mhz', t, t0 + .2, t1, L.violet); ty.line(w, t, { y: 980, size: 60, out: t1 - .2 }); } });
}
{ const w = lines(17), t0 = 186.9, t1 = 193.3;
  S.push({ t0, t1, kind: 'lattice', ...pk('v2_horizon', t0), fid: () => .25, lane: L.violet, cam: push(.03),
    text: (ty, t) => { ctxBar(ty, t, .955); ty.line(w, t, { y: 980, size: 60, out: t1 - .2 }); } });
}
{ const t0 = 193.3, t1 = 195.4;
  S.push({ t0, t1, kind: 'lattice', ...pk('v2_dish_sit', t0), fid: () => .25, lane: L.violet, cam: push(.02), text: (ty, t) => ctxBar(ty, t, .96) });
}
{ const w = lines(18), t0 = 195.4, t1 = 200.95;
  S.push({ t0, t1, kind: 'lattice', ...pk('v2_pencil', 195.2), fid: () => .25, lane: L.violet, cam: push(.04),
    text: (ty, t) => { ctxBar(ty, t, .97); ty.line(w, t, { y: 980, size: 60, out: t1 - .2 });
      // what she writes in the air
      const msg = 'learned: every road was worth it', k = clamp((t - 196.2) / 3.2); const g = ty.g; g.save();
      g.font = '400 54px ISI'; g.fillStyle = '#E9DDFF'; g.shadowColor = '#A57BFF'; g.shadowBlur = 24; g.fillText(msg.slice(0, Math.floor(k * msg.length)), 520, 420); g.restore(); } });
}
{ const w = lines(19), t0 = 200.95, t1 = 208.75;
  S.push({ t0, t1, kind: 'lattice', ...pk('v2_release', 200.75), fid: () => .25, lane: L.violet, cam: push(.04),
    scatter: (u, t) => ({ k: ss(205.2, 208.6, t) * .8, dir: [.6, .3, .2] }),
    text: (ty, t) => { ctxBar(ty, t, Math.min(1, .98 + .02 * ss(203, 207, t))); ty.line(w, t, { y: 980, size: 60, out: t1 - .1 }); } });
}
// ------------------------------------------------------------------------------------------ CHORUS 2 bars 121–136
{ const w = lines(20), t0 = 208.75, t1 = 214.6;
  S.push({ t0, t1, kind: 'lattice', ...pk('ch2_catch', 208.5), fid: (u) => .7 + .3 * u, cam: push(.06),
    text: (ty, t) => { ty.ledHook(w, t, { x: 110, y: 420, size: 170, maxW: 860, out: t1 - .2 }); } });
}
{ const w = lines(21), t0 = 214.6, t1 = 222.72;   // every road home: light runs from all 1,024 tips down into the trunk
  S.push({ t0, t1, kind: 'dronetree', bloom: .7, gain: .7, flow: () => -5, flash: (u, t) => 1.4 * ss(t1 - 1.2, t1, t),
    cam: (u) => ({ orbit: -.35 + .3 * u, height: 1.0, dist: 31 - 3 * u, lookY: 6.0 + .6 * u }),
    text: (ty, t) => { ty.ledHook(w, t, { x: 960, y: 190, size: 100, maxW: 1700, align: 'center', out: 222.6 }); } });
}
{ const w = lines(22), t0 = 222.72, t1 = 228.45;
  S.push({ t0, t1, kind: 'lattice', ...pk('ch2_fold', t0 - .6), s0: t0 - .6, fid: () => 1, cam: push(.05),
    text: (ty, t) => { ty.ledHook(w, t, { x: 110, y: 230, size: 140, maxW: 900, out: t1 - .2 }); } });
}
{ const w = lines(23), t0 = 228.45, t1 = 236.4;
  S.push({ t0, t1, kind: 'lattice', ...pk('ch2_gone_close', 228.3), fid: () => 1, cam: push(.06),
    text: (ty, t) => { ty.ledHook(w, t, { x: 100, y: 250, size: 112, maxW: 760, out: 235.8 }); } });
}
// ------------------------------------------------------------------------------------------ OUTRO bars 137–164
{ // full drums again: the afterglow dance
  const t0 = 236.4, t1 = 249.3;
  S.push({ t0, t1: 243.0, kind: 'lattice', look: 'paint', ...pk('out_dance', t0), s0: t0, fid: () => 1, cam: push(.04),
    text: (ty, t) => ty.line(lines(24), t, { y: 980, size: 64, out: 240.5 }) });
  S.push({ t0: 243.0, t1, kind: 'lattice', look: 'paint', ...pk('dr_center', 240.0), s0: 240.0, fid: () => 1, cam: push(.04) });
}
{ // the final git log: every lane merged; the one that didn't, its commit still there, cherry-picked into main
  const t0 = 249.3, t1 = 263.0, w25 = lines(25);
  const lanes = [...['lf_piano_rose', 'lf_wushu_gold', 'lf_booth_sky', 'lf_poet_gold', 'lf_band_rose', 'lf_home_mint'].map((id) => { const x = life(id); return [x[2], x[1], x[3], x[4]]; }),
    [L.violet, 'jade/1420-mhz', 'learned: every road was worth it', 'f01d9ae']];
  const credits = ['feat(song): "Merge" — Jade Q Wang', 'feat(voice): Jade Q Wang', 'feat(video): drawn in light by Claude, branch claude/merge-me-back-to-main',
    'chore(models): Seedance 2.5 · Nano Banana Pro · GPT Image 2.5 · ElevenLabs', 'docs: for every branch that never came home'];
  S.push({ t0, t1, kind: 'card', text: (ty, t) => {
    const g = ty.g, X0 = 260, top = 170, dy = 96, LW = 70, reveal = (t - t0) * 2.0;
    const rows = []; lanes.forEach((l, i) => rows.push({ lane: i, ...{ c: l[0], br: l[1], msg: l[2] } })); credits.forEach((c) => rows.push({ credit: c }));
    const scroll = Math.max(0, (reveal - 7.5) * dy);
    g.save(); g.translate(0, -scroll); g.lineCap = 'round'; g.lineJoin = 'round';
    const Y = (r) => top + r * dy, nShown = Math.min(rows.length, reveal);
    g.strokeStyle = L.orange; g.lineWidth = 7; g.shadowColor = L.orange; g.shadowBlur = 16;
    g.beginPath(); g.moveTo(X0, Y(-.5)); g.lineTo(X0, Y(nShown + .2)); g.stroke();
    rows.forEach((r, i) => {
      const k = clamp(reveal - i); if (k <= 0) return; const y = Y(i);
      if (r.credit) { g.shadowBlur = 0; g.fillStyle = L.orange; g.beginPath(); g.arc(X0, y, 11, 0, 7); g.fill();
        g.globalAlpha = k; g.font = '500 34px JBM'; g.fillStyle = 'rgba(255,241,220,.95)'; g.fillText(r.credit, X0 + 60, y + 12); g.globalAlpha = 1; return; }
      const x = X0 + LW, merged = r.lane < lanes.length - 1;
      g.strokeStyle = r.c; g.shadowColor = r.c; g.shadowBlur = 14; g.lineWidth = 5; g.beginPath();
      g.moveTo(X0, y - dy * .55); g.quadraticCurveTo(x, y - dy * .55, x, y - dy * .1); g.lineTo(x, y + dy * .1);
      if (merged) g.quadraticCurveTo(x, y + dy * .55, X0, y + dy * .55); g.stroke();
      g.fillStyle = r.c; g.beginPath(); g.arc(x, y, 11, 0, 7); g.fill(); g.shadowBlur = 0;
      g.globalAlpha = k; g.font = '600 34px JBM'; g.fillStyle = L.gold; const hash = lanes[r.lane][3];
      g.fillText(hash, X0 + 130, y + 12); g.fillStyle = r.c; const bw = g.measureText(hash + '  ').width; g.fillText(`(${r.br})`, X0 + 130 + bw, y + 12);
      const mw = g.measureText(`(${r.br})  `).width; g.fillStyle = 'rgba(255,241,220,.95)';
      if (!merged) g.font = '400 46px ISI'; g.fillText(r.msg, X0 + 130 + bw + mw, y + 12);
      if (!merged && reveal > i + 1.2) { const a = clamp(reveal - i - 1.2); g.setLineDash([8, 12]); g.strokeStyle = L.violet; g.shadowColor = L.violet; g.shadowBlur = 12; g.lineWidth = 4;
        g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 40, y + dy * .6, X0, y + dy * (.2 + .6 * a)); g.stroke(); g.setLineDash([]); g.shadowBlur = 0;
        g.font = '500 28px JBM'; g.fillStyle = `rgba(233,221,255,${a})`; g.fillText('↳ cherry-picked into main', X0 + 130, y + 56); }
      g.globalAlpha = 1;
    });
    g.restore();
    ty.line(w25, t, { y: 1030, size: 56, out: 257.2 });
  } });
}
{ const t0 = 263.0, t1 = 268.6;   // home: main, close, the last "back to main"
  S.push({ t0, t1, kind: 'lattice', ...pk('out_main', 262.8), fid: () => 1, cam: (u) => ({ dolly: 1 - .08 * u, over: 1.06 }),
    text: (ty, t) => ty.line(lines(26), t, { y: 1000, size: 64, out: 268 }) });
  // bookend: where she started. One Jade among the stars, seen from above, the camera rising away
  S.push({ t0: t1, t1: 277.9, kind: 'forktree', ...pk('intro_up', 0), splitBar0: 3, splits: 10, treeTime: () => 1.2, trailT: -1,
    rise: (t) => 1 + 2.2 * ss(t1, 277.9, t), text: (ty, t) => { const g = ty.g; const k = 1 - ss(275.8, 277.9, t);
      if (k < 1) { g.fillStyle = `rgba(0,0,0,${1 - k})`; g.fillRect(0, 0, 1920, 1080); }
      ty.mono('HEAD -> main', t, t1 + .8, { x: 72, y: 84, size: 22, cps: 20 }); } });
}
{ const t0 = 277.9, t1 = 284.8;   // end card
  S.push({ t0, t1, kind: 'card', bloom: .25, text: (ty, t) => {
    ty.ledHook([{ w: TITLE, start: 277.915 }], t, { x: 960, y: 560, size: 260, maxW: 1600, align: 'center', out: 283.2, lane: 0, scrim: false });
    ty.mono('Jade Q Wang · Rare Earth', t, 278.8, { x: 773, y: 680, size: 26, cps: 30, out: 283.2 });
    if (t > 282.2) ty.mono('$ git checkout -b jade/hilbert-hotel', t, 282.2, { x: 660, y: 760, size: 26, cps: 30 });
  } });
}
{ const t0 = 284.8, t1 = 297.0;   // post-credits: the Hilbert Hotel front desk
  S.push({ t0, t1, kind: 'lattice', ...pk('pc_hotel', t0), s0: 285.6, fid: () => 1, cam: (u) => ({ dolly: 1 - .05 * u, over: 1.06 }),
    fade: (u, t) => ss(t0, t0 + 1.2, t) * (1 - ss(t1 - 1.4, t1, t)),
    text: (ty, t) => { const g = ty.g;
      if (t > 290.0) { const k = clamp((t - 290) / .5) * (1 - ss(t1 - 1.4, t1, t)); g.save(); g.globalAlpha = k;
        g.fillStyle = 'rgba(8,8,14,.72)'; g.fillRect(560, 880, 800, 110); g.strokeStyle = 'rgba(255,241,220,.85)'; g.lineWidth = 2; g.strokeRect(560, 880, 800, 110);
        g.font = '400 46px ISI'; g.fillStyle = '#FFF1DC'; g.textAlign = 'center'; g.fillText('“Of course we have space for you.”', 960, 950); g.restore(); }
      ty.mono('HILBERT HOTEL · ∞ rooms · vacancy', t, t0 + .8, { x: 72, y: 84, size: 22, cps: 30 }); } });
}
export const shots = S;
