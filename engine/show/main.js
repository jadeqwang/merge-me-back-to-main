// The show EDL for the revised song "Merge" (timing v2 = analysis_v2/, inputs/Merge.wav, 282.5 s). Times are song seconds, written as
// bars (B(n), bb(n, beats)) or sung words (ws(id, k) / we(id, k), line ids = v1 numbering) so edits carry over. Picks: work/picks.json.
// ?timing=v1 renders the frozen v1 EDL (engine/show/main_v1.js, the pre-port show for "Merge Me Back to Main.wav") instead.
const T = await import('/engine/src/time.js'); await T.loadTiming();
const PICKS = await (await fetch('/work/picks.json')).json().catch(() => ({}));
const B = T.bar, W = T.words, bb = T.bb;
const ws = (id, k = 0) => W(id)[k < 0 ? W(id).length + k : k].start, we = (id, k = -1) => W(id)[k < 0 ? W(id).length + k : k].end;   // word start / end
const SONG_END = T.songEnd();
const PC_LEN = 14.5;   // post-credits length after the song (tools/mix.py PC)
// the fold's last gesture (Jade 2026-10-24: try both): ?fold=palms (open palms toward camera, default) | reach (one hand reaching out)
const FOLD = new URLSearchParams(location.search).get('fold') || 'palms';
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
  ['lf_piano_rose', 'jade/piano', L.rose, 'climbed onto the piano bench before I was three', '3f9a1c2'],
  ['lf_violin_white', 'jade/violin', L.white, 'thin red tape on the fingerboard', '8d02e6b'],
  ['lf_wushu_gold', 'jade/wushu', L.gold, 'listened to the footsteps like a drum rhythm', '4b7e2d9'],
  ['lf_lab_mint', 'jade/wet-lab', L.mint, 'watched a neuron light up under the scope', '7c21d4b'],
  ['lf_booth_sky', 'jade/phd', L.sky, 'heard the brain echo the sound back', 'e5b0a17'],
  ['lf_poet_gold', 'jade/poet', L.gold, 'wrote poems between experiments', '5d3b9f8'],
  ['lf_ames_white', 'jade/nasa-ames', L.white, 'stood in the wind of the giant tunnel', '0d9c8f2'],
  ['lf_band_rose', 'jade/robot-ninja-apocalypse', L.rose, 'turned the amp up', '9be44a1'],
  ['lf_house_gold', 'jade/chez-jj', L.gold, 'a full house at 2am, everyone shipping', 'a41e7d0'],
  ['lf_stage_sky', 'jade/open-source', L.sky, 'the live demo worked', 'c8f2a61'],
  ['lf_home_mint', 'jade/home', L.mint, 'finished the Copernican model at 10:30pm', '2e7b0c4'],
];
const life = (id) => LIFE.find((x) => x[0] === id);
// Lip-synced takes (sung to a vocal audio ref; tools/sd/batch.py SINGERS) -> the lyric line ids they sing.
const SUNG = { v1_split_front: [1], v1_light_hands: [3], ch1_main: [7], ch1_gone_close: [10], bd_ahh: [13], v2_dish_close: [16], v2_pencil: [18],
  v2_release: [19], ch2_catch: [20], ch2_gone_close: [23], out_main: [26] };
// A take's picks.json s0 is in the song time it was made against (p.timing, default 'v1'). Under another timing, shift s0 so the take's
// sung words land on the same words: median offset of the line's words inside the clip that match by text (outliers dropped); when the
// words changed (fewer than 2 matches) pair the words by position if the counts agree, else use the line-start offset.
const V1 = T.VERSION === 'v1' ? T.TIMING : await T.loadTimingVersion('v1');
const norm = (s) => s.toLowerCase().replace(/[^a-z']/g, '');
const med = (a) => { const b = [...a].sort((x, y) => x - y), n = b.length; return n % 2 ? b[(n - 1) / 2] : (b[n / 2 - 1] + b[n / 2]) / 2; };
export const RESYNC = {};
function resync(shot, s0, ids, win = 12) {
  const d = [], pos = [], ls = [];
  for (const id of ids) {
    const a = V1.lyrics.lines.find((l) => l.id === id); if (!a || !T.hasLine(id)) continue;
    const b = T.line(id), l0 = b.start - a.start; ls.push(l0);
    a.words.forEach((w, i) => {
      if (w.start < s0 - .05 || w.start > s0 + win) return;
      if (a.words.length === b.words.length) pos.push(b.words[i].start - w.start);
      const c = b.words.filter((x) => norm(x.w) === norm(w.w)); if (!c.length) return;
      const x = c.reduce((p, q) => (Math.abs(q.start - w.start - l0) < Math.abs(p.start - w.start - l0) ? q : p));
      if (Math.abs(x.start - w.start - l0) < .7) d.push(x.start - w.start);
    });
  }
  let sh = 0, how = 'none (line not sung in this song)';
  if (d.length >= 2) { const m = med(d); sh = med(d.filter((x) => Math.abs(x - m) < .35)); how = `${d.length} matched words`; }
  else if (pos.length) { sh = med(pos); how = `${pos.length} words paired by position (lyric changed)`; }
  else if (ls.length) { sh = ls[0]; how = 'line start'; }
  RESYNC[shot] = { s0: s0, s0_new: +(s0 + sh).toFixed(3), shift: +sh.toFixed(3), how };
  return s0 + sh;
}
// plate for a shot: the picked take (with its audio-ref S0, re-synced to this song's words when sung) or the still fallback
function pk(shot, t0) {
  const p = PICKS[shot];
  if (p) {
    if (p.take.startsWith('still_') || p.s0 == null) return { plate: p.plate, s0: t0 };
    const s0 = SUNG[shot] && (p.timing || 'v1') !== T.VERSION ? resync(shot, p.s0, SUNG[shot]) : p.s0;
    return { plate: p.plate, s0 };
  }
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
  // post-credits: the idea adult-Jade sends arrives as a shape in the frost (Jade: no equations, no title, "only a shape, an idea"):
  // the logistic map's bifurcation tree (period doubling into chaos) crystallising left to right as cold light. u: 0..1 reveal.
  frost(g, t, u, { x = 1060, y = 220, w = 720, h = 520, k = 1 } = {}) {
    const P = FX._bif || (FX._bif = (() => { const pts = []; let s = 7;
      for (let c = 0; c < 900; c++) { const r = 2.85 + 1.15 * c / 899; let v = .5;
        for (let i = 0; i < 400; i++) v = r * v * (1 - v);
        const seen = new Set();                                 // one point per pixel row, so the stable branches don't over-brighten
        for (let i = 0; i < 90; i++) { v = r * v * (1 - v); const q = Math.round(v * 700); if (seen.has(q)) continue; seen.add(q);
          s = (s * 16807) % 2147483647; pts.push([c / 899, v, s / 2147483647]); } }
      return pts; })());
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [cx, v, rnd] of P) {
      const a = clamp((u * 1.15 - cx) / .15);                 // each column freezes in just behind the reveal front
      if (a <= 0) continue;
      const tw = .75 + .25 * Math.sin(t * 2.3 + rnd * 40);    // frost glints
      g.globalAlpha = k * a * tw * (.5 + .45 * rnd);
      g.fillStyle = rnd > .93 ? '#FFFFFF' : '#CFE6FF';
      const sz = rnd > .985 ? 3.4 : 2.0;
      g.fillRect(x + cx * w, y + (1 - v) * h, sz, sz);
    }
    // the reveal front: a soft breath of light moving through the frost
    if (u < 1) { const fx = x + Math.min(1, u * 1.15) * w, gr = g.createRadialGradient(fx, y + h * .45, 0, fx, y + h * .45, h * .35);
      gr.addColorStop(0, `rgba(210,232,255,${.07 * k})`); gr.addColorStop(1, 'rgba(210,232,255,0)'); g.globalAlpha = 1; g.fillStyle = gr;
      g.fillRect(fx - h * .6, y - h * .15, h * 1.2, h * 1.2); }
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
  // the opening lines, from her poem "Wednesday morning interlude" (Spaces Left Blank): typed small, top-left, gone before the title slam
  const POEM = ["The little girl's resting oblivious face", 'studies the delicate fractal crystals', 'forming on the window.'];
  const poem = (g, t) => {
    const t0 = .35, cps = 22, out = B(8) + beat, k = 1 - clamp((t - out) / .8); if (k <= 0 || t < t0) return;
    let left = (t - t0) * cps; g.save(); g.globalAlpha = k; g.font = '400 34px ISI'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.shadowColor = 'rgba(4,5,12,.9)'; g.shadowBlur = 10; g.fillStyle = 'rgba(255,241,220,.92)';
    POEM.forEach((ln, i) => { if (left <= 0) return; g.fillText(ln.slice(0, Math.floor(left)), 72, 90 + i * 44); left -= ln.length + 6; });
    g.restore();
  };
  // counter + poem + title: one function of t, drawn by every intro shot
  const introText = (ty, t, scrim = 0) => {
    if (scrim) { const c = ty.g, gr = c.createRadialGradient(1770, 960, 0, 1770, 960, 260); gr.addColorStop(0, `rgba(4,5,12,${.55 * scrim})`); gr.addColorStop(1, 'rgba(4,5,12,0)');
      c.fillStyle = gr; c.fillRect(1400, 640, 520, 440); }
    poem(ty.g, t);
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
  const w = lines(1), t0 = B(17), t1 = ws(2) - .08;   // cut just before "Down"
  const at = [w[1].start, w[4].start, w[5].start];    // split, thousand, ways
  const copies = [];
  const spread = [[-.42, .0], [.4, .0], [-.82, .02], [.78, .02], [-1.15, .04], [1.1, .04], [-1.45, .05]];
  at.forEach((a, gi) => { const k = [1, 2, 4][gi]; for (let i = 0; i < k && copies.length < 7; i++) copies.push({ dt: (copies.length + 1) * .9, at: a, dur: .7, off: spread[copies.length], scale: .82 - .1 * gi, dens: .42 - .08 * gi, lane: Object.values(L)[(copies.length + 1) % 7], share: true }); });
  S.push({ t0, t1, kind: 'lattice', ...pk('v1_split_front', ws(1) - .32), fid: () => 1, copies, cam: (u) => ({ dolly: 1 - .04 * u, over: 1.06 }),
    text: (ty, t) => { ty.ledHook(w, t, { x: 110, y: 250, size: 120, maxW: 1100, out: t1 - .3 }); } });
}
{ // L2 "Down every road the night could hold"
  const w = lines(2), t0 = ws(2) - .08, t1 = bb(24, 3);
  S.push({ t0, t1, kind: 'lattice', ...pk('v1_track_rose', t0), fid: () => .25, lane: L.rose, laneAmt: .12, cam: (u) => ({ dolly: 1, pan: [-.02 * u, 0], over: 1.08 }),
    text: (ty, t) => { ty.line(w, t, { y: 960, size: 60, out: t1 - .4 }); ty.chyron('jade/down-every-road', t, t0 + .3, t1 - .2, L.rose); } });
}
{ // L3 "Each one a light I sent ahead" (sync)
  const w = lines(3), t0 = bb(24, 3), t1 = ws(4) - .18;
  S.push({ t0, t1, kind: 'lattice', ...pk('v1_light_hands', ws(3) - .34), fid: () => 1, cam: push(.06),
    text: (ty, t) => { ty.ledHook(w, t, { x: 110, y: 300, size: 118, maxW: 820, out: t1 - .25 }); } });
}
// L4 "Each one a story to unfold" — her lives, one per cut, the cuts quickening (2-1-1 beats) from bar 28; each branch is still written (ASCII)
const MONTAGE0 = ws(4) - .18, MONTAGE1 = ws(5) - .51;   // first cut (just before "Each") .. the pre-chorus pickup "And every"
{
  const w = lines(4), beats = T.beats().filter((b) => b >= B(28) - .02 && b < MONTAGE1);
  const len = [2, 1, 1, 2, 1, 1, 2, 1, 1, 2, 2];
  let k = 0; const cut = [MONTAGE0]; len.forEach((n) => { k += n; cut.push(k < beats.length ? beats[k] : MONTAGE1); }); cut[cut.length - 1] = MONTAGE1;
  // her earlier films (Jade 2026-10-24: see both ways, then decide): ?pv=flash = a half-beat flash of each at the end of four 2-beat cuts;
  // ?pv=screens = the four as a 2x2 wall of glowing screens behind her in the live-demo branch. Default: neither.
  const PV = new URLSearchParams(location.search).get('pv') || 'off';
  const FLASH = { 0: ['pv_moongazing', 'jade/moongazing'], 3: ['pv_orbital', 'jade/orbital-sunrise'], 6: ['pv_rareearth', 'jade/rare-earth'], 10: ['pv_rewind', 'jade/rewind'] };
  const SCREENS = ['pv_moongazing', 'pv_orbital', 'pv_rareearth', 'pv_rewind'];
  LIFE.forEach(([id, br, lane], i) => {
    const t0 = cut[i], t1 = cut[i + 1], fl = PV === 'flash' && FLASH[i], tf = fl ? t1 - (t1 - t0) / 4 : t1;
    const screens = PV === 'screens' && id === 'lf_stage_sky' ? SCREENS.map((p, k) => ({ plate: `/work/plates/${p}`, s0: t0 - .1 * k, scale: .19,
      off: [[-.6, .2], [-.25, .2], [-.6, .0], [-.25, .0]][k], at: t0 + .06 * k, dur: .2, gain: .9 })) : undefined;
    S.push({ t0, t1: tf, kind: 'lattice', ...pk(id, t0 - 1.0), s0: t0 - 1.0, fid: () => .25, written: true, lane, laneAmt: .1, cam: push(.04), screens,
      text: (ty, t) => { ty.chyron(br, t, t0 + .02, tf, lane); ty.line(w, t, { y: 960, size: 60 }); } });
    if (fl) S.push({ t0: tf, t1, kind: 'lattice', plate: `/work/plates/${fl[0]}`, s0: tf - .35, fid: () => 1, cam: push(.03),
      text: (ty, t) => { ty.chyron(fl[1], t, tf + .01, t1, lane); ty.line(w, t, { y: 960, size: 60 }); } });
  });
}
// ------------------------------------------------------------------------------------------ PRE-CHORUS bars 33–40 — the sync grid, then fold
{
  const t0 = MONTAGE1, t1 = ws(7) - .1, w5 = lines(5), w6 = lines(6);
  const ids = ['lf_piano_rose', 'lf_wushu_gold', 'lf_lab_mint', 'lf_poet_gold', 'lf_ames_white', 'lf_band_rose', 'lf_house_gold', 'lf_stage_sky', 'lf_home_mint'].map((id) => [id, life(id)[2]]);
  const turn = bb(34, .73);    // every branch turns her head together, here
  const cols = 3, rows = 3, pw = 1 / 3, ph = 1 / 3;
  const foldStart = bb(36, 3.73);   // just before the bar-37 kick under the held "from"
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
  const origin = bb(38, 1.69);
  const preText = (ty, t) => { ty.ledHook(w6, t, { x: 960, y: 900, size: 110, maxW: 1700, align: 'center', out: ws(7) - .45 }); };
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
      ty.line(w5, t, { y: 1000, size: 56, out: ws(6) - .38 });
      preText(ty, t);
    } });
}
// ------------------------------------------------------------------------------------------ CHORUS 1 bars 41–56
// (stripped chorus: hits on bar 41 and under "Nothing" in bar 52 only — HIT52)
const HIT52 = bb(52, 2.26);
{ const w = lines(7), t0 = ws(7) - .1, t1 = bb(44, .38);   // cut as the held "main" ends
  S.push({ t0, t1, kind: 'lattice', ...pk('ch1_main', ws(7) - .3), fid: (u) => .55 + .45 * u, cam: push(.06),
    text: (ty, t) => { ty.mono('git merge --no-ff branch/*', t, t0 + .1, { x: 110, y: 200, size: 24, out: t1 - .4 }); ty.ledHook(w, t, { x: 110, y: 420, size: 170, maxW: 860, out: t1 - .45 }); } });
}
{ const w = lines(8), t0 = bb(44, .38), t1 = ws(8, 4) + .2;   // the tree runs home; cut on "becomes"
  const G1 = B(12) + 1.2;
  S.push({ t0, t1, kind: 'forktree', ...pk('intro_up', 0), splitBar0: 3, splits: 10, treeTime: (t) => G1 - (t - t0) / (t1 - t0) * (G1 - B(3) + .2),
    trailT: 1e9, glow: () => 1.0,
    text: (ty, t) => { ty.ledHook(w, t, { x: 960, y: 520, size: 120, maxW: 1600, align: 'center', out: ws(9) - .9 }); } });
}
{ const w = lines(8), t0 = ws(8, 4) + .2, t1 = ws(9) - .6;
  S.push({ t0, t1, kind: 'lattice', ...pk('ch1_runners', t0), fid: () => 1, cam: push(.08),
    text: (ty, t) => { ty.ledHook(w, t, { x: 960, y: 520, size: 120, maxW: 1600, align: 'center', out: ws(9) - .9 }); } });
}
{ const w = lines(9), t0 = ws(9) - .6, t1 = ws(10) - .35;
  S.push({ t0, t1, kind: 'lattice', ...pk(`ch1_fold_${FOLD}`, t0 + .2), fid: (u) => .7 + .3 * u, cam: push(.05),
    text: (ty, t) => { ty.ledHook(w, t, { x: 110, y: 230, size: 140, maxW: 900, out: t1 - .2 }); } });
}
{ const w = lines(10), t0 = ws(10) - .35, t1 = bb(58, 1.64);   // "Nothing that I lived can come undone"; the bar-52 kick lands on "Nothing"
  const hit = (t) => (t >= HIT52 ? Math.exp(-(t - HIT52) / .3) : 0);
  S.push({ t0, t1, kind: 'lattice', ...pk('ch1_gone_close', ws(10) - .3), fid: () => 1, cam: (u, t) => ({ dolly: 1 - .05 * u + .25 * ss(.65, 1, u) - .03 * hit(t), over: 1.06 }),
    text: (ty, t) => { ty.ledHook(w, t, { x: 100, y: 250, size: 112, maxW: 760, out: we(10) - .6 });
      const k = .22 * hit(t); if (k > .01) { ty.g.fillStyle = `rgba(255,246,232,${k})`; ty.g.fillRect(0, 0, 1920, 1080); } } });
}
// ------------------------------------------------------------------------------------------ BREAKDOWN bars 57–72
{ const t0 = bb(58, 1.64), t1 = ws(13) - .1, w11 = lines(11), w12 = lines(12);
  const ids = ['lf_piano_rose', 'lf_wushu_gold', 'lf_lab_mint', 'lf_poet_gold', 'lf_ames_white', 'lf_band_rose', 'lf_stage_sky', 'lf_home_mint'];
  const wa0 = ws(11) - .27, wa1 = bb(62, .84), re0 = ws(12) - .25, re1 = t1 - .1;   // wander out on "Branch... and wander", return on "Merge... and return"
  const panels = ids.map((id, i) => {
    const a0 = i / ids.length * Math.PI * 2 + .4, p = pk(id, 0);
    return { plate: p.plate, s0: t0 - i * .7, rw: 480, rh: 270, cellFig: 3, cellWorld: 8, fid: () => 1,
      xf: (t) => {
        const wander = ss(wa0, wa1, t), ret = ss(re0, re1, t);
        const r = .55 * (1 + .5 * wander) * (1 - ret);
        return { x: Math.cos(a0 + .15 * (t - t0)) * r * 1.4, y: Math.sin(a0 + .15 * (t - t0)) * r, z: -.3 + .2 * Math.sin(i + t * .4), rz: .1 * Math.sin(i * 3 + t * .3),
          s: .26 * (1 - .8 * ret), a: clamp((t - t0 - i * .3) / .8) * (1 - ss(.9, 1, ret)), gain: 1.6 };
      } };
  });
  S.push({ t0, t1, kind: 'panels', panels, back: { ...pk('bd_float', t0), cellFig: 3, fid: () => 1 }, cam: () => ({}),
    text: (ty, t) => { ty.line(w11, t, { y: 980, size: 64, out: ws(12) - 1.65 }); ty.line(w12, t, { y: 980, size: 64, out: t1 - .2 }); } });
}
{ const t0 = ws(13) - .1, t1 = B(69);   // "Ahh"; cut on bar 69 = the leap to the second "ahh" + the kick pulse
  S.push({ t0, t1, kind: 'lattice', ...pk('bd_ahh', ws(13) - .3), fid: (u) => .7 + .3 * u, cam: (u) => ({ dolly: 1 - .08 * u, roll: Math.PI, over: 1.06 }) });
}
{ const t0 = B(69), t1 = B(73);   // the scale reveal: every branch is one tree of light (drone show), drawing home into one point
  S.push({ t0, t1, kind: 'dronetree', bloom: .7, gain: .72,
    grow: (u, t) => ss(t0, bb(71, .31), t), flow: (u, t) => (t < bb(70, 3.85) ? 4 : -6), flash: (u, t) => 1.2 * T.pulse(t, .25) * ss(B(72), bb(72, 3), t),
    converge: (u, t) => ss(bb(72, .46), t1 - .05, t), cam: (u, t) => ({ orbit: .2 + .12 * u, height: 1.2 + 1.5 * u, dist: 30 - 4 * u, lookY: 6.4 }) });
}
// ------------------------------------------------------------------------------------------ BUILD bars 73–88 — sessions (internet brutalism)
// v2 build: no vocal, four-on-the-floor to bar 85; bar 86 = bass out / kick fading (the collapse), snare build from bar 87 beat 4½, drop bar 89.
{ const t0 = B(73), t1 = B(89);
  const bt = T.beats().filter((b) => b >= t0 - .01 && b < t1);
  const src = [...LIFE.slice(0, 5).map((x) => [x[0], x[2], x[1]]), ['v1_track_rose', L.rose, 'jade/down-every-road'],
    ['v1_light_hands', L.orange, 'jade/light-ahead'], ['ch1_runners', L.sky, 'jade/home-run'], ['v2_dish_sit', L.violet, 'jade/1420-mhz'], ['bd_float', L.orange, 'main'],
    ...LIFE.slice(5).map((x) => [x[0], x[2], x[1]])].slice(0, 16);
  const collapse0 = B(86), collapse1 = bb(87, 1.8), strobe0 = bb(87, 3.5), riser1 = B(89) - .08;
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
      // git log, bars 77–80
      const lk = ss(B(77), B(77) + .4, t) * (1 - ss(B(81) - .2, B(81) + .3, t));
      if (lk > 0) { g.save(); g.globalAlpha = lk; g.font = '500 21px JBM'; g.textBaseline = 'alphabetic';
        const shown = Math.floor((t - B(77)) * 6);
        LOG.slice(0, Math.max(0, shown)).forEach(([gr, h, br, msg], i) => { const y = 150 + i * 44 - Math.max(0, shown - 18) * 44;
          if (y < 110 || y > 1040) return;
          g.fillStyle = L.orange; g.fillText(gr, 64, y); g.fillStyle = L.gold; g.fillText(h, 130, y);
          if (br) { g.fillStyle = br === 'main' ? L.orange : L.sky; g.fillText(`(${br})`, 240, y); g.fillStyle = 'rgba(255,241,220,.9)'; g.fillText(msg, 250 + g.measureText(`(${br})`).width, y); } });
        g.restore(); }
      // poster homage, bars 81–85
      const pk2 = ss(B(81), B(81) + .5, t) * (1 - ss(collapse0 - .4, collapse0, t));
      if (pk2 > 0) { sun(g, 960, 470, 300 * (.9 + .1 * ss(B(81), B(85), t)), pk2 * .75); graph(g, t, pk2); }
      // the slab, on the kicks — from her poem "Privilege Escalation" (Spaces Left Blank): "Every victory · chess move · miscalculation · analysis mode"
      ty.slam('EVERY VICTORY', t, B(79), B(80), { y: 430, size: 150 }); ty.slam('CHESS MOVE', t, B(80), B(81) - .1, { y: 650, size: 210 });
      ty.slam('MISCALCULATION', t, B(83), B(84), { y: 160, size: 150, glow: L.gold }); ty.slam('ANALYSIS MODE', t, B(84), collapse0 - .1, { y: 930, size: 170, glow: L.orange });
      // …and the poem's next stanza, laid out in her own two-row grid, one life per two beats while every pane collapses into the point
      if (t >= collapse0 && t < strobe0 + .3) {
        const k = clamp((t - collapse0) / .3) * (1 - clamp((t - strobe0) / .3)), cols = [[620, 'musician', 'founder'], [960, 'scientist', 'investor'], [1300, 'poet', 'parent']];
        g.save(); g.globalAlpha = k; g.font = '400 54px ISI'; g.textBaseline = 'alphabetic'; g.shadowColor = 'rgba(4,5,12,.95)'; g.shadowBlur = 14; g.fillStyle = '#FFF1DC';
        g.textAlign = 'right'; g.fillText('Her life as', 470, 840);
        g.textAlign = 'left'; cols.forEach(([x, a, b], i) => [a, b].forEach((wd, j) => { const at = collapse0 + (2 * (i * 2 + j) + 1) * (B(87) - B(86)) / 4 * .5;
          const kk = clamp((t - at) / .18); if (kk > 0) { g.globalAlpha = k * kk; g.fillText(wd, x - 80, 840 + j * 70); } }));
        g.restore(); }
      // collapse (bar 86: bass out) → riser → strobe on the snare build → roll into the drop
      if (t > collapse1) { const k = ss(collapse1, riser1, t), r = 4 + 900 * k * k * k;
        const grd = g.createRadialGradient(960, 540, 0, 960, 540, r); grd.addColorStop(0, 'rgba(255,250,240,1)'); grd.addColorStop(.35, `rgba(255,196,107,${.9})`); grd.addColorStop(1, 'rgba(255,122,26,0)');
        const strobe = t > strobe0 ? (Math.floor((t - strobe0) * 16) % 2 ? .55 : 1) : 1; g.globalAlpha = strobe; g.fillStyle = grd; g.fillRect(0, 0, 1920, 1080); g.globalAlpha = 1;
        g.font = '600 24px JBM'; g.fillStyle = 'rgba(255,241,220,.9)'; g.textAlign = 'center'; g.fillText(`merging ${fmt(Math.round(1024 * k))} / 1,024 branches`, 960, 1000); g.textAlign = 'left'; }
      if (t >= bb(85, 2.88) && t < collapse1) ty.mono('git merge --no-ff --all', t, bb(85, 2.88), { x: 72, y: 84, size: 24, cps: 30 });
    } });
}
// ------------------------------------------------------------------------------------------ DROP bars 89–104 — MAIN, painted world
// v2: a wordless "ooh" layer sings over bars 100–104 (adlib, not lip-synced) — the sun swells with it.
{ const D0 = B(89);
  const OOH = (T.TIMING.lyrics.adlibs || []).find((a) => a.start > D0 && a.end <= B(105) + .5);
  const ooh = (t) => (OOH ? ss(OOH.start - .2, OOH.start + 1.2, t) * (1 - ss(OOH.end - 1.2, OOH.end, t)) : 0);
  const dropText = (ty, t) => {
    const g = ty.g;
    FX.streaks(g, t, D0, B(105) - .3, 2);
    if (t < D0 + .9) { const f = Math.exp(-(t - D0) * 5); g.fillStyle = `rgba(255,250,240,${f})`; g.fillRect(0, 0, 1920, 1080); }
  };
  // Jade 2026-10-24: wushu, not K-pop. Her collegiate team's changquan group set (bar 89), a half-vs-half duilian exchange, her jian solo
  // (bar 95), the duilian closing into the salute line, then the fold. The wushu takes were made against this drop's own instrumental
  // (tools/sd/shots_drop.py, v2 windows), so a cut's clip time = its bar offset from the take's window: whole-bar shifts stay on the beat.
  const BAR = B(90) - B(89), at = (shot, bars) => ({ plate: pk(shot, 0).plate, s0: (b0) => B(b0) - bars * BAR });
  const cuts = [  // [bar, plate, s0(b0) = song time of the clip's frame 0, sun x,y]
    [89, at('dr_set', 0), [700, 230]], [91, at('dr_set', 2), [700, 230]], [93, at('dr_duilian_mid', 2), [960, 160]],
    [95, at('dr_jian', 0), [1500, 470]], [97, at('dr_duilian', 1), [960, 160]], [99, at('dr_duilian', 3), [960, 160]],
    [101, { plate: pk(`ch1_fold_${FOLD}`, 0).plate, s0: (b0) => B(b0) - .2 }, [960, 430]]];
  cuts.forEach(([b0, { plate, s0 }, sun], i) => {
    const t0 = B(b0), t1 = B(b0 + 2);
    S.push({ t0, t1, kind: 'lattice', look: 'paint', plate, s0: s0(b0), fid: () => 1,
      cam: (u, t) => ({ dolly: punch(t, 1 - .05 * u, .035), orbit: (i % 2 ? -1 : 1) * .03 * (u - .5), over: 1.07 }),
      text: (ty, t) => { FX.sun(ty.g, t, { x: sun[0], y: sun[1], r: 150 + 40 * ooh(t), k: .42 + .3 * ooh(t) }); dropText(ty, t);
        if (i === 0 && t < D0 + 1.2) ty.ledHook([{ w: 'MAIN', start: D0 }], t, { x: 960, y: 690, size: 520, maxW: 2000, align: 'center', out: D0 + .5, lane: 1, scrim: false });
        if (i === 6) ty.ledHook([{ w: 'ALL', start: B(101) }, { w: 'BRANCHES', start: B(101) + T.beatLen(101) }, { w: 'MERGED', start: B(102) }], t, { x: 960, y: 980, size: 110, maxW: 1800, align: 'center', out: B(103) - .4, lane: 1 }); } });
  });
  { const t0 = B(103), t1 = B(105) - .3, G1 = B(12) + 1.2;
    S.push({ t0, t1, kind: 'forktree', ...pk('intro_up', 0), splitBar0: 3, splits: 10, treeTime: (t) => G1 - ss(t0, t1, t) * (G1 - B(3) + .1), trailT: 1e9, glow: (t) => .9 + .3 * ooh(t),
      text: (ty, t) => { FX.sun(ty.g, t, { x: 960, y: 540, r: 50 + 60 * ss(t1 - 1.5, t1, t), k: .15 + .2 * ss(t1 - 2.5, t1, t) + .15 * ooh(t), disc: true }); dropText(ty, t); } });
  }
  S.push({ t0: B(105) - .3, t1: B(105) - .18, kind: 'card', bg: '#000000', text: (ty, t) => { const g = ty.g; const k = 1 - ss(B(105) - .3, B(105) - .18, t); g.fillStyle = `rgba(255,241,220,${k * .8})`; g.fillRect(0, 0, 1920, 1080); } });
}
// ------------------------------------------------------------------------------------------ VERSE 2 bars 105–120 — the branch that won't come back
// (v2 re-phrases this verse: line 17 comes 1.4 s later, "again" ends 1.2 s before the chorus pickup — cuts follow the words)
const ctxBar = (ty, t, pct) => { const g = ty.g; g.save(); g.font = '500 20px JBM'; g.fillStyle = 'rgba(255,241,220,.8)'; g.fillText('context', 64, 70);
  g.strokeStyle = 'rgba(255,241,220,.6)'; g.lineWidth = 1.5; g.strokeRect(150, 54, 300, 18); g.fillStyle = L.violet; g.fillRect(153, 57, 294 * pct, 12);
  g.fillStyle = 'rgba(255,241,220,.8)'; g.fillText(`${Math.round(pct * 100)}%`, 466, 70); g.restore(); };
{ const w = lines(16), t0 = B(105) - .18, t1 = we(16) + .2;   // out after the held "way" (the take runs out ~0.5 s later)
  S.push({ t0, t1, kind: 'lattice', ...pk('v2_dish_close', ws(16) - .33), fid: () => .25, lane: L.violet, laneAmt: .1, cam: push(.04),
    text: (ty, t) => { ctxBar(ty, t, .94 + .01 * (t - t0) / 5); ty.chyron('jade/1420-mhz', t, t0 + .2, t1, L.violet); ty.line(w, t, { y: 980, size: 60, out: t1 - .2 }); } });
}
{ const w = lines(17), t0 = we(16) + .2, t1 = we(17);
  S.push({ t0, t1, kind: 'lattice', ...pk('v2_horizon', t0), fid: () => .25, lane: L.violet, cam: push(.03),
    text: (ty, t) => { ctxBar(ty, t, .955); ty.line(w, t, { y: 980, size: 60, out: t1 - .2 }); } });
}
{ const t0 = we(17), t1 = ws(18) - .12;
  S.push({ t0, t1, kind: 'lattice', ...pk('v2_dish_sit', t0), fid: () => .25, lane: L.violet, cam: push(.02), text: (ty, t) => ctxBar(ty, t, .96) });
}
{ const w = lines(18), t0 = ws(18) - .12, t1 = ws(19) - .1;
  S.push({ t0, t1, kind: 'lattice', ...pk('v2_pencil', ws(18) - .32), fid: () => .25, lane: L.violet, cam: push(.04),
    text: (ty, t) => { ctxBar(ty, t, .97); ty.line(w, t, { y: 980, size: 60, out: t1 - .2 });
      // what she writes in the air
      const msg = 'learned: every road was worth it', k = clamp((t - (ws(18, 1) + .18)) / 3.2); const g = ty.g; g.save();
      g.font = '400 54px ISI'; g.fillStyle = '#E9DDFF'; g.shadowColor = '#A57BFF'; g.shadowBlur = 24; g.fillText(msg.slice(0, Math.floor(k * msg.length)), 520, 420); g.restore(); } });
}
{ const w = lines(19), t0 = ws(19) - .1, t1 = ws(20) - .03;
  S.push({ t0, t1, kind: 'lattice', ...pk('v2_release', ws(19) - .3), fid: () => .25, lane: L.violet, cam: push(.04),
    scatter: (u, t) => ({ k: ss(ws(19, -1) + .07, t1 - .15, t) * .8, dir: [.6, .3, .2] }),
    text: (ty, t) => { ctxBar(ty, t, Math.min(1, .98 + .02 * ss(ws(19, 2) - .25, ws(19, -1) + 1.9, t))); ty.line(w, t, { y: 980, size: 60, out: t1 - .1 }); } });
}
// ------------------------------------------------------------------------------------------ CHORUS 2 bars 121–136
// v2: opens on pads only (no hit) until bar 129 — the full-merge flash lands on the bar-129 hit (riser from bar 128).
{ const w = lines(20), t0 = ws(20) - .03, t1 = ws(21) - .27;
  S.push({ t0, t1, kind: 'lattice', ...pk('ch2_catch', ws(20) - .28), fid: (u) => .7 + .3 * u, cam: push(.06),
    text: (ty, t) => { ty.ledHook(w, t, { x: 110, y: 420, size: 170, maxW: 860, out: t1 - .2 }); } });
}
{ const w = lines(21), t0 = ws(21) - .27, t1 = B(129);   // every road home: light runs from all 1,024 tips down into the trunk
  S.push({ t0, t1, kind: 'dronetree', bloom: .7, gain: .7, flow: () => -5, flash: (u, t) => 1.4 * ss(B(128), t1, t),
    cam: (u) => ({ orbit: -.35 + .3 * u, height: 1.0, dist: 31 - 3 * u, lookY: 6.0 + .6 * u }),
    text: (ty, t) => { ty.ledHook(w, t, { x: 960, y: 190, size: 100, maxW: 1700, align: 'center', out: t1 - .13 }); } });
}
{ const w = lines(22), t0 = B(129), t1 = ws(23) - .12;
  S.push({ t0, t1, kind: 'lattice', ...pk(`ch2_fold_${FOLD}`, t0 - .6), s0: t0 - .6, fid: () => 1, cam: (u, t) => ({ dolly: punch(t, 1 - .05 * u, .03), over: 1.06 }),
    text: (ty, t) => { ty.ledHook(w, t, { x: 110, y: 230, size: 140, maxW: 900, out: t1 - .2 });   // flash after the hook so its scrim doesn't cut the flash
      const f = Math.exp(-(t - t0) * 5); if (f > .01) { ty.g.fillStyle = `rgba(255,250,240,${f})`; ty.g.fillRect(0, 0, 1920, 1080); } } });
}
{ const w = lines(23), t0 = ws(23) - .12, t1 = bb(136, 3.74);   // "Every life I've lived, I have become"
  S.push({ t0, t1, kind: 'lattice', ...pk('ch2_gone_close', ws(23) - .27), fid: () => 1, cam: push(.06),
    text: (ty, t) => { ty.ledHook(w, t, { x: 100, y: 250, size: 112, maxW: 760, out: we(23) + .15 }); } });
}
// ------------------------------------------------------------------------------------------ OUTRO bars 137–163
// v2: two "Back to main" (237, 249); drums out bar 149 (arp alone); last hit bar 153, then pads + bass to the fade (song ends SONG_END).
{ // full drums again: the orchestra of Jades (Jade 2026-10-24: piano, violin, electric guitar, main-Jade conducting every branch). Both takes
  // were made on the v2 instrumental from a bar line (tools/sd/shots_outro.py), so their s0 (picks) keeps the playing on the beat.
  const t0 = bb(136, 3.74), t1 = ws(25) - .08, tc = B(141);
  S.push({ t0, t1: tc, kind: 'lattice', look: 'paint', ...pk('out_orch', t0), fid: () => 1, cam: push(.04),
    text: (ty, t) => ty.line(lines(24), t, { y: 980, size: 64, out: bb(139, 1.29) }) });
  S.push({ t0: tc, t1, kind: 'lattice', look: 'paint', ...pk('out_orch_close', tc), fid: () => 1, cam: push(.05) });
}
{ // home: she sings the last "Back to main…" at sunrise (out_main, v2 line 25; Jade 2026-10-24), the held note carries into the git log
  const t0 = ws(25) - .08, t1 = B(149) - 3.0;
  S.push({ t0, t1, kind: 'lattice', ...pk('out_main', t0), fid: () => 1, cam: push(.05),
    text: (ty, t) => { ty.ledHook(lines(25), t, { x: 110, y: 300, size: 120, maxW: 900, out: t1 - .3 }); } });
}
{ // the final git log: every lane merged; the one that didn't, its commit still there, cherry-picked into main. On the held "main" to the drums-out.
  const t0 = B(149) - 3.0, t1 = B(149), w25 = lines(25);
  const lanes = [...['lf_piano_rose', 'lf_wushu_gold', 'lf_booth_sky', 'lf_poet_gold', 'lf_band_rose', 'lf_home_mint'].map((id) => { const x = life(id); return [x[2], x[1], x[3], x[4]]; }),
    [L.violet, 'jade/1420-mhz', 'learned: every road was worth it', 'f01d9ae']];
  const credits = ['docs: for every branch that never came home'];   // the real credits are on the end card; this log is her lives merging home
  S.push({ t0, t1, kind: 'card', text: (ty, t) => {
    const g = ty.g, X0 = 260, top = 170, dy = 96, LW = 70, reveal = (t - t0) * 3.2;
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
    ty.line(w25, t, { y: 1030, size: 56, out: t1 - .35 });
  } });
}
{ // bookend on the arp alone (bars 149–152, the intro's arp): where she started. One Jade among the stars, seen from above, the camera rising away;
  // to black over the riser into the last hit. (v1's "home" shot out_main sang the third "Back to main", which this song no longer has.)
  const t0 = B(149), t1 = B(153), f0 = bb(152, 1);
  S.push({ t0, t1, kind: 'forktree', ...pk('intro_up', 0), splitBar0: 3, splits: 10, treeTime: () => 1.2, trailT: -1,
    rise: (t) => 1 + 2.2 * ss(t0, t1, t), text: (ty, t) => { const g = ty.g; const k = 1 - ss(f0, t1 - .05, t);
      if (k < 1) { g.fillStyle = `rgba(0,0,0,${1 - k})`; g.fillRect(0, 0, 1920, 1080); }
      ty.mono('HEAD -> main', t, t0 + .8, { x: 72, y: 84, size: 22, cps: 20 }); } });
}
{ const t0 = B(153), t1 = SONG_END;   // end card on the last hit (bar 153); pads + bass sustain to the fade
  S.push({ t0, t1, kind: 'card', bloom: .25, text: (ty, t) => {
    ty.ledHook([{ w: TITLE, start: t0 }], t, { x: 960, y: 560, size: 260, maxW: 1600, align: 'center', out: t1 - 1.6, lane: 0, scrim: false });
    ty.mono('Jade Q Wang · Rare Earth', t, t0 + .9, { x: 773, y: 680, size: 26, cps: 30, out: t0 + 3.6 });
    // credits, typed in a few seconds after the title, while the pads fade
    const CR = [['words', 'Jade Q Wang & Claude Opus 5.5'], ['music', 'Suno v6 Pro · Suno v6 Wild'], ['direction', 'Jade Q Wang'],
      ['poems', 'Jade Q Wang — Spaces Left Blank · Variations and Metamorphosis'], ['drawn in light by', 'Claude, and a dozen robot friends'], ['motion', 'Seedance 2.5'],
      ['stills', 'Nano Banana Pro · GPT Image 2.5 · Seedream 5 Pro'], ['sound design', 'ElevenLabs'], ['depth & mattes', 'Depth Anything V2 · BiRefNet'],
      ['engine', 'three.js · one RTX 3090']];
    const c0 = t0 + 4.2, out = clamp((t - (t1 - 1.6)) / 1.2), g = ty.g;
    if (t > c0 - .2) { g.save(); g.textBaseline = 'alphabetic';
      CR.forEach(([role, who], i) => { const k = clamp((t - c0 - i * .55) / .35) * (1 - out); if (k <= 0) return; const y = 760 + i * 30;
        g.globalAlpha = k; g.font = '500 20px JBM'; g.textAlign = 'right'; g.fillStyle = 'rgba(255,241,220,.55)'; g.fillText(role, 930, y);
        g.font = '400 24px ISR'; g.textAlign = 'left'; g.fillStyle = 'rgba(255,241,220,.95)'; g.fillText(who, 960, y); });
      g.restore(); }
  } });
}
{ // post-credits (Jade 2026-10-24): the window from the intro. Adult Jade kneels beside her five-year-old self and, palm to palm, tries to send
  // her an idea; she can only send a shape, and the light shows up in the frost: the logistic map's bifurcation (FX.frost). No equations, no title.
  // Sound (tools/mix.py v2): one chime as the light passes, then 1-2-4-8 chimes as the shape blooms.
  const P0 = SONG_END, P1 = P0 + 6.0, P2 = P0 + PC_LEN, F0 = P0 + 9.4, F1 = P0 + 13.0;
  S.push({ t0: P0, t1: P1, kind: 'lattice', look: 'paint', ...pk('pc_kneel', P0), s0: P0 - .3, fid: () => 1, cam: (u) => ({ dolly: 1 - .04 * u, over: 1.06 }),
    fade: (u, t) => ss(P0, P0 + 1.2, t) });
  S.push({ t0: P1, t1: P2, kind: 'lattice', look: 'paint', ...pk('pc_beam', P1), s0: P1 - .2, fid: () => 1, cam: (u) => ({ dolly: 1 - .05 * u, over: 1.06 }),
    fade: (u, t) => 1 - ss(P2 - 1.4, P2, t),
    text: (ty, t) => { if (t > F0 - .2) FX.frost(ty.g, t, clamp((t - F0) / (F1 - F0)), { x: 110, y: 90, w: 940, h: 620, k: 1 - ss(P2 - 1.4, P2, t) }); } });
}
export const FILM_END = SONG_END + PC_LEN;
if (T.VERSION !== 'v1') console.log('[show] timing', T.VERSION, 'resync', JSON.stringify(RESYNC));
// ?dumpedl=1: print the edit list (tools/cloud_pack.py builds review/cloud/manifest.md from it)
if (new URLSearchParams(location.search).has('dumpedl')) console.log('[edl] ' + JSON.stringify(S.map((x) => ({ t0: +x.t0.toFixed(3), t1: +x.t1.toFixed(3), kind: x.kind, look: x.look, plate: x.plate, s0: x.s0 != null ? +x.s0.toFixed(3) : null, screens: x.screens && x.screens.map((c) => c.plate), panels: x.panels && x.panels.map((p) => [p.plate, p.s0 != null ? +p.s0.toFixed(3) : null]), back: x.back && x.back.plate }))));
// ?timing=v1: the frozen v1 EDL (pre-port), so the v1 render stays reproducible.
export const shots = T.VERSION === 'v1' ? (await import('/engine/show/main_v1.js')).shots : S;
