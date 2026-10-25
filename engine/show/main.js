// The show EDL for the revised song "Merge" (timing v2 = analysis_v2/, inputs/Merge.wav, 282.5 s). Times are song seconds, written as
// bars (B(n), bb(n, beats)) or sung words (ws(id, k) / we(id, k), line ids = v1 numbering) so edits carry over. Picks: work/picks.json.
// ?timing=v1 renders the frozen v1 EDL (engine/show/main_v1.js, the pre-port show for "Merge Me Back to Main.wav") instead.
const T = await import('/engine/src/time.js'); await T.loadTiming();
const PICKS = await (await fetch('/work/picks.json')).json().catch(() => ({}));
const B = T.bar, W = T.words, bb = T.bb;
const ws = (id, k = 0) => W(id)[k < 0 ? W(id).length + k : k].start, we = (id, k = -1) => W(id)[k < 0 ? W(id).length + k : k].end;   // word start / end
const SONG_END = T.songEnd();
const PC_LEN = 14.5;   // post-credits length after the song (tools/mix.py PC)
const PC_TOUCH = 6.4;   // post-credits: the light touches the glass this long after the song end (tools/mix.py PC_TOUCH: the first chime)
// the fold's last gesture (Jade 2026-10-25 picked one hand): ?fold=reach (one hand reaching out, default) | palms (open palms toward camera)
const FOLD = new URLSearchParams(location.search).get('fold') || 'reach';
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
const TITLE = 'MERGE';   // the song's title (one word); no subtitle (Jade 2026-10-25; v1 had the hook "merge me back to main" under it)
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
  ['lf_home_mint', 'jade/home', L.mint, 'taught kids the Copernican model at 10:30pm', '2e7b0c4'],
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
// the shot's picked take is still this one: interim EDL fixes for a flawed take switch themselves off once a re-take is picked
const isTake = (shot, take) => PICKS[shot]?.take === take;
// a real take is picked for the shot (tools/sd/picks.py also lists every unpicked shot as a still_ fallback, which doesn't count)
const has = (shot) => !!PICKS[shot] && !(PICKS[shot].take || 'still_').startsWith('still_');
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
  // post-credits: the idea adult-Jade sends arrives as a shape in the frost (Jade: no equations, no title, "only a shape, an idea"): the logistic
  // map's bifurcation tree (period doubling into chaos) crystallising left to right as cold light, from the point where the light touched (the
  // period-1 branch at r0, i.e. (x, y + h / r0)). front: 0..1 = how far the shape has grown (column fraction). The chaotic band is drawn as a fine
  // mist (alpha ~ 4 / points in the column; v4 drew it as a solid glassy sheet) so the forks stay the bright lines; r1 = 3.86 ends just past the
  // period-3 window.
  frost(g, t, front, { x = 1060, y = 220, w = 720, h = 520, k = 1, r0 = 2.9, r1 = 3.86 } = {}) {
    const key = `${r0},${r1}`, cache = (FX._bif ||= {});
    const P = cache[key] || (cache[key] = (() => { const pts = []; let s = 7;
      for (let c = 0; c < 900; c++) { const r = r0 + (r1 - r0) * c / 899; let v = .5;
        for (let i = 0; i < 400; i++) v = r * v * (1 - v);
        const col = new Set();                                 // one point per pixel row, so the stable branches don't over-brighten
        for (let i = 0; i < 90; i++) { v = r * v * (1 - v); col.add(Math.round(v * 700)); }
        const wgt = Math.min(1, 4 / col.size);                  // 1, 2, 4 points: full; the 90-point chaotic columns: a fine mist
        for (const q of col) { s = (s * 16807) % 2147483647; pts.push([c / 899, q / 700, s / 2147483647, wgt]); } }
      return pts; })());
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [cx, v, rnd, wgt] of P) {
      const a = clamp((front - cx) / .04);                     // each column freezes in just behind the front
      if (a <= 0) continue;
      const tw = .75 + .25 * Math.sin(t * 2.3 + rnd * 40);    // frost glints
      g.globalAlpha = k * a * tw * (.5 + .45 * rnd) * wgt;
      g.fillStyle = rnd > .93 ? '#FFFFFF' : '#CFE6FF';
      const sz = rnd > .985 ? 3.4 : 2.0;
      g.fillRect(x + cx * w, y + (1 - v) * h, sz, sz);
    }
    // the front: a soft breath of light parked on the next fork, moving on with each chime group
    if (front < 1) { const fx = x + front * w, gr = g.createRadialGradient(fx, y + h * .45, 0, fx, y + h * .45, h * .35);
      gr.addColorStop(0, `rgba(210,232,255,${.07 * k})`); gr.addColorStop(1, 'rgba(210,232,255,0)'); g.globalAlpha = 1; g.fillStyle = gr;
      g.fillRect(fx - h * .6, y - h * .15, h * 1.2, h * 1.2); }
    g.restore();
  },
  // post-credits: the light itself, a warm point with a short tail on a slight arc from `from` to `to` (t0..t1), radius r[0] -> r[1]
  // (growing = arriving, shrinking = flying away); flare: one soft bloom where it lands, at t1.
  mote(g, t, { from, to, t0, t1, r = [4, 14], flare = true, k = 1 } = {}) {
    if (t < t0 || t > t1 + (flare ? .9 : 0)) return;
    const at = (q) => { const e = q * q * (3 - 2 * q); return [from[0] + (to[0] - from[0]) * e, from[1] + (to[1] - from[1]) * e - 60 * Math.sin(Math.PI * e)]; };
    g.save(); g.globalCompositeOperation = 'lighter';
    if (t <= t1) { const q = (t - t0) / (t1 - t0);
      for (let j = 12; j >= 0; j--) { const qq = Math.max(0, q - j * .012), [px, py] = at(qq), R = (r[0] + (r[1] - r[0]) * qq) * (1 - j / 14), a = k * (j ? .25 * (1 - j / 13) : 1);
        const gr = g.createRadialGradient(px, py, 0, px, py, R * 3); gr.addColorStop(0, `rgba(255,244,222,${a})`); gr.addColorStop(.3, `rgba(255,200,130,${a * .5})`); gr.addColorStop(1, 'rgba(255,160,90,0)');
        g.fillStyle = gr; g.fillRect(px - R * 3, py - R * 3, R * 6, R * 6); } }
    const f = flare && t >= t1 ? Math.exp(-(t - t1) / .25) : 0;
    if (f > .01) { const [px, py] = to, R = 90 * (1 + (t - t1)), gr = g.createRadialGradient(px, py, 0, px, py, R);
      gr.addColorStop(0, `rgba(255,248,235,${.8 * f * k})`); gr.addColorStop(1, 'rgba(255,200,140,0)'); g.fillStyle = gr; g.fillRect(px - R, py - R, 2 * R, 2 * R); }
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
  // the opening lines, from her poem "Wednesday morning interlude" (Spaces Left Blank): small, top-left, all three on screen from frame 0 (Jade
  // 2026-10-25: typed in, reading fought the girl's action for eyeballs; no fade-in, the plate starts hard too), gone before the title slam
  const POEM = ["The little girl's resting oblivious face", 'studies the delicate fractal crystals', 'forming on the window.'];
  const poem = (g, t) => {
    const out = B(8) + beat, k = 1 - clamp((t - out) / .8); if (k <= 0) return;
    g.save(); g.globalAlpha = k; g.font = '400 34px ISI'; g.textAlign = 'left'; g.textBaseline = 'alphabetic';
    g.shadowColor = 'rgba(4,5,12,.9)'; g.shadowBlur = 10; g.fillStyle = 'rgba(255,241,220,.92)';
    POEM.forEach((ln, i) => g.fillText(ln, 72, 90 + i * 44));
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
      c.fillStyle = '#FFF1DC'; c.font = '900 300px ARCH'; c.fillText(TITLE, 0, 70); c.restore();   // just MERGE (Jade 2026-10-25: no old-title subtitle)
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
  // her earlier films (Jade 2026-10-25 picked screens): ?pv=screens (default) = the four as a 2x2 wall of glowing screens behind her in the
  // open-source live-demo branch; ?pv=flash = a half-beat flash of each at the end of four 2-beat cuts; ?pv=off = neither.
  const PV = new URLSearchParams(location.search).get('pv') || 'screens';
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
  // the origin: one Jade among the stars before the first split. intro_up isn't sung (its picks s0 is null), so pk's second argument is its clip
  // clock: clip 2.5 s on the cut = her breath, a slow blink, the smile arriving. (v4 passed 0, so every forktree use showed the take's last frame,
  // frozen: Jade's 1:07 note.) A slow push-in keeps the hold alive.
  S.push({ t0: origin, t1, kind: 'forktree', ...pk('intro_up', origin - 2.5), splitBar0: 3, splits: 10, treeTime: () => 1.2, trailT: -1,
    rise: (t) => 1 - .1 * ss(origin, t1, t), text: (ty, t) => preText(ty, t) });
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
  // intro_up's clip clock starts on the cut (forktree runs four plate clocks at +0, 1.7, 3.4, 5.1 s, so this keeps most copies inside the 8 s take)
  S.push({ t0, t1, kind: 'forktree', ...pk('intro_up', t0), splitBar0: 3, splits: 10, treeTime: (t) => G1 - (t - t0) / (t1 - t0) * (G1 - B(3) + .2),
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
  // the poster's git graph: main up the middle, six lanes fork off it and merge back. Lane i: even = left of main; commit dots j = 1..4 (1 = lowest).
  const GLANES = [L.rose, L.sky, L.mint, L.gold, L.violet, L.white], GTOP = 120, GBOT = 1000;
  const laneGeo = (i) => { const r = Math.floor(i / 2); return { off: (90 + 80 * r) * (i % 2 ? 1 : -1), y0: GBOT - 60 - 70 * r, y1: GTOP + 160 + 70 * r }; };
  const lanePt = (i, u) => { const { off, y0, y1 } = laneGeo(i); return [960 + off * ss(0, .18, u) * (1 - ss(.82, 1, u)), y0 + (y1 - y0) * u]; };
  const dotU = (j) => .18 + .64 * j / 5;
  const laneK = (i, t) => ss(B(81) + .3 * i, B(83) + .3 * i, t);   // how much of lane i is drawn (bars 81–83, staggered)
  const graph = (g, t, k) => {   // main line with lanes forking out and merging back, drawn on
    g.save(); g.globalAlpha = k; g.lineCap = 'round';
    g.strokeStyle = L.orange; g.lineWidth = 6; g.shadowColor = L.orange; g.shadowBlur = 18;
    const grow = ss(B(81), B(83), t);
    g.beginPath(); g.moveTo(960, GBOT); g.lineTo(960, GBOT - (GBOT - GTOP) * grow); g.stroke();
    GLANES.forEach((c, i) => { const kk = laneK(i, t); if (kk <= 0) return;
      g.strokeStyle = c; g.shadowColor = c; g.lineWidth = 4; g.beginPath();
      const N = 60; for (let j = 0; j <= N * kk; j++) { const [xx, yy] = lanePt(i, j / N); j ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }
      g.stroke(); g.fillStyle = c; for (let j = 1; j < 5; j++) { const u = dotU(j); if (u > kk) break; const [xx, yy] = lanePt(i, u); g.beginPath(); g.arc(xx, yy, 7, 0, 7); g.fill(); }
      g.stroke(); });
    g.restore(); };
  // her poem "Privilege Escalation" (Spaces Left Blank), first stanza: "Every victory · chess move · miscalculation · analysis mode", set as
  // notation on the graph (Jade 2026-10-25: it was four full-frame slabs, too big). The moves land on the kicks, each on its own branch, in two
  // columns either side of the sun like a scoresheet; the win and the misstep are on different lives, on opposite sides of main. Her words in
  // ISI (the voice and size of the next stanza), marks in JBM in the branch's colour ("!!" brilliant, "?!" interesting; never "??").
  // "analysis mode" is not a move but the state they're played in (Jade): the graph calculates from the moment it starts drawing (a candidate
  // line runs up every lane, small evals flicker at the commits it passes, an engine header counts depth over six lines), and the words type
  // into that header on the fourth kick, keeping the poem's order and naming what has been running all along.
  const A0 = B(81), AN = bb(84, 2), BT = T.beatLen(81), RUN = 4 * BT;   // a candidate line runs a lane in one bar
  const MOVES = [['every victory', '!!', 4, 4, B(83)], ['chess move', '', 5, 3, bb(83, 2)], ['miscalculation', '?!', 3, 1, B(84)]];   // [words, mark, lane, dot, at]
  const EVALS = ['+0.4', '+0.2', '=', '+0.9', '+0.3', '+1.1', '+0.6', '=', '−0.2', '+0.7', '+1.4', '+0.5'];   // mostly good lines; one small minus
  const marked = (i, j) => MOVES.some((m) => m[2] === i && m[3] === j);
  const stanza = (g, t, k) => {
    if (t < A0) return;
    const on = clamp((t - A0) / .4) * k, hit = t >= AN ? Math.exp(-(t - AN) * 4) : 0;
    g.save(); g.lineCap = 'round';
    // analysis: one candidate line per lane (head + short tail, on the drawn part); the last commit it passed flashes and shows its eval
    // (one eval per lane at a time, so at most six small numbers)
    GLANES.forEach((c, i) => {
      const kk = laneK(i, t); if (kk <= 0) return;
      const ph = (t - A0) / RUN + i * .37, uh = ph % 1;
      if (uh <= kk) {
        g.fillStyle = c; g.shadowColor = c;
        for (let s = 5; s >= 0; s--) { const u = uh - s * .014; if (u < 0) continue; const [x, y] = lanePt(i, u);
          g.globalAlpha = on * (s ? .35 * (1 - s / 6) : .95); g.shadowBlur = s ? 0 : 14 + 10 * hit; g.beginPath(); g.arc(x, y, s ? 2.4 : 4 + 2.5 * hit, 0, 7); g.fill(); }
      }
      let j = 4; while (j > 0 && dotU(j) > uh) j--;
      const lap = Math.floor(ph) - (j ? 0 : 1); if (!j) j = 4;                 // before the first dot: the previous lap's top commit
      const u = dotU(j), since = (ph - lap - u) * RUN;
      if (lap < 0 || u > kk || marked(i, j) || since > .8) return;
      const a = on * (1 - since / .8), [x, y] = lanePt(i, u);
      g.shadowBlur = 0; g.globalAlpha = a * .5; g.fillStyle = '#FFF1DC'; g.beginPath(); g.arc(x, y, 3 + 9 * (1 - since / .8), 0, 7); g.fill();   // the commit flashes
      g.font = '600 17px JBM'; g.textBaseline = 'middle'; g.textAlign = i % 2 ? 'right' : 'left';
      g.shadowColor = 'rgba(4,5,12,.95)'; g.shadowBlur = 6; g.globalAlpha = a * .85; g.fillStyle = c;   // its eval, on the side toward main
      g.fillText(EVALS[(i * 5 + j * 3 + lap) % EVALS.length], x + (i % 2 ? -14 : 14), y);
    });
    // the engine header over the graph: › prompt and cursor, depth ticking up on the beats over six lines (one per branch); the name types in on AN
    const HX0 = 660, HX1 = 1260, HY = 86;
    g.globalAlpha = on; g.shadowBlur = 0; g.textBaseline = 'alphabetic';
    g.strokeStyle = 'rgba(255,241,220,.28)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(HX0, HY + 16); g.lineTo(HX1, HY + 16); g.stroke();
    g.font = '600 26px JBM'; g.textAlign = 'left'; g.fillStyle = L.orange; g.fillText('›', HX0, HY);
    const name = 'analysis mode', typed = t >= AN ? name.slice(0, Math.ceil(clamp((t - AN) * 28 / name.length) * name.length)) : '';
    g.fillStyle = 'rgba(255,241,220,.94)'; g.fillText(typed + (Math.floor(t * 2) % 2 ? '' : '▍'), HX0 + 26, HY);
    g.font = '500 18px JBM'; g.textAlign = 'right'; g.fillStyle = 'rgba(255,241,220,.55)'; g.fillText(`depth ${8 + Math.floor((t - A0) / BT)} · 6 lines`, HX1, HY);
    // the moves: the commit rings on the kick, a short leader out to its column, her words
    MOVES.forEach(([w, mark, i, j, at]) => {
      const a = clamp((t - at + .02) / .12) * k; if (a <= 0) return;
      const [nx, ny] = lanePt(i, dotU(j)), left = i % 2 === 0, sd = left ? -1 : 1, c = GLANES[i], pop = Math.exp(-(t - at) * 7);
      const col = left ? 674 : 1246;   // the scoresheet columns, just outside the outer lanes
      g.save();
      if (!left) { const gr = g.createRadialGradient(col + 200, ny, 0, col + 200, ny, 280);   // right-hand words sit over the dimmed panes
        gr.addColorStop(0, `rgba(4,5,12,${.6 * a})`); gr.addColorStop(1, 'rgba(4,5,12,0)'); g.fillStyle = gr; g.fillRect(col - 60, ny - 150, 600, 300); }
      g.globalAlpha = a; g.strokeStyle = c; g.shadowColor = c; g.shadowBlur = 12 + 18 * pop; g.lineWidth = 2.5;
      g.beginPath(); g.arc(nx, ny, 15 + 12 * pop, 0, 7); g.stroke();
      g.shadowBlur = 0; g.lineWidth = 2; g.globalAlpha = a * .7; g.beginPath(); g.moveTo(nx + 17 * sd, ny); g.lineTo(col, ny); g.stroke();
      g.globalAlpha = a; g.textBaseline = 'middle'; g.textAlign = left ? 'right' : 'left';
      let x = col + 12 * sd;
      if (left && mark) { g.font = '700 30px JBM'; g.fillStyle = c; g.fillText(mark, x, ny - 6); x -= g.measureText(mark).width + 10; }
      g.font = '400 54px ISI'; g.fillStyle = '#FFF1DC'; g.shadowColor = 'rgba(4,5,12,.95)'; g.shadowBlur = 14; g.fillText(w, x, ny + 2);
      if (!left && mark) { const mw = g.measureText(w).width; g.shadowBlur = 0; g.font = '700 30px JBM'; g.fillStyle = c; g.fillText(mark, x + mw + 10, ny - 6); }
      g.restore();
    });
    g.restore();
  };
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
      // her poem's first stanza as notation on the graph, in analysis mode (stanza(), above); it fades with the poster into the collapse
      if (pk2 > 0) stanza(g, t, pk2);
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
    S.push({ t0, t1, kind: 'forktree', ...pk('intro_up', t0), splitBar0: 3, splits: 10, treeTime: (t) => G1 - ss(t0, t1, t) * (G1 - B(3) + .1), trailT: 1e9, glow: (t) => .9 + .3 * ooh(t),
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
// 3:30 (Jade 2026-10-25: "ends way too smiley; it should end contemplative, closing the eyes is fine"). Interim, while ch2_catch_t11 is picked:
// that take sings with closed eyes, then opens them at 212.2 (raw-take landmarks: blink .81 -> .09 over 212.17-212.26), smiles, and runs out at
// 213.59 (a frozen frame to the old 214.70 cut). Cut on the onset of "main" instead, eyes still closed; the hook carries on unchanged over the
// drone tree, so MAIN lands on the tree (main = its trunk). The 8 s re-take (tools/sd/shots_v5.py) covers the whole line: picking it restores
// the full shot.
const CATCH_CUT = isTake('ch2_catch', 'ch2_catch_t11_03c5dd87e5') ? ws(20, 4) - .03 : ws(21) - .27;
const HOOK20 = { x: 110, y: 420, size: 170, maxW: 860, out: ws(21) - .47 };
{ const w = lines(20), t0 = ws(20) - .03, t1 = CATCH_CUT;
  S.push({ t0, t1, kind: 'lattice', ...pk('ch2_catch', ws(20) - .28), fid: (u) => .7 + .3 * u, cam: push(.06),
    text: (ty, t) => { ty.ledHook(w, t, HOOK20); } });
}
{ const w = lines(21), t0 = CATCH_CUT, t1 = B(129);   // every road home: light runs from all 1,024 tips down into the trunk
  S.push({ t0, t1, kind: 'dronetree', bloom: .7, gain: .7, flow: () => -5, flash: (u, t) => 1.4 * ss(B(128), t1, t),
    cam: (u) => ({ orbit: -.35 + .3 * u, height: 1.0, dist: 31 - 3 * u, lookY: 6.0 + .6 * u }),
    text: (ty, t) => {
      if (t < ws(21) - .05) ty.ledHook(lines(20), t, HOOK20);   // line 20's hook, carried over the cut (stops before line 21: the LED layer shares one fade)
      ty.ledHook(w, t, { x: 960, y: 190, size: 100, maxW: 1700, align: 'center', out: t1 - .13 }); } });
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
// 4:12 home (Jade 2026-10-25: too smiley at the end). Interim, while out_main_t12 is picked: it grins with teeth from 252.25 to the cut, so the
// shot ends there and what follows starts earlier (the end card keeps its bar-153 hit). A re-take (tools/sd/shots_v5.py) gets the full shot.
const OUT_MAIN_END = isTake('out_main', 'out_main_t12_d9d33a9749') ? ws(25, 2) + 1.95 : B(149) - 3.0;
{ // home: she sings the last "Back to main…" at sunrise (out_main, v2 line 25; Jade 2026-10-24), the held note carries into the living graph
  const t0 = ws(25) - .08, t1 = OUT_MAIN_END;
  S.push({ t0, t1, kind: 'lattice', ...pk('out_main', t0), fid: () => 1, cam: push(.05),
    text: (ty, t) => { ty.ledHook(lines(25), t, { x: 110, y: 300, size: 120, maxW: 900, out: t1 - .3 }); } });
}
{ // 4:15–4:24, the held "main" + the arp alone (bars 149–152): "a bit of everything" (Jade 2026-10-25 on the git-log card: "a bit boring, could
  // be a good opportunity to show us a bit of everything"; she OK'd losing the readable card). Replaces the text-only git-log card AND the
  // lone-Jade bookend with one shot: her git log as a living graph seen from above. Main is a point of light in the centre; her lives fork out of
  // it in doublings on the bar (the intro's 1 -> 2 -> 4 -> 8): generation 1 on the cut (the girl at the window, then piano), 4 on bar 148, 8 on
  // the drums-out bar 149, each a pane playing that life in its lane colour, joined by dotted drone-light strands (the drone tree, from above).
  // Bars 149–151 read the log one commit per beat (the pane flashes, its line types in at the bottom). Bar 152 (the riser) merges every lane home
  // into the point, the violet 1420 MHz lane last and straight in (the cherry-pick); the point flares into the bar-153 hit and the MERGE end card.
  // It starts where the home shot ends (OUT_MAIN_END: 252.25 while out_main_t12 is trimmed, else B(149) - 3), so the end card keeps its timing.
  // No new takes: every plate is already picked (the orchestra pane switches to orch_wide once that is picked).
  const t0 = OUT_MAIN_END, t1 = B(153), w25 = lines(25), BAR = B(150) - B(149), A = 480 / 270, S0 = .16;
  const G = [t0 + .05, B(148), B(149)];                                                              // pop time of generation 1, 2, 3
  const M = { 3: [bb(152, 0), bb(152, 1.6)], 2: [bb(152, 1), bb(152, 2.6)], 1: [bb(152, 2), bb(152, 3.4)], cherry: [bb(152, 2.4), bb(152, 3.5)] };
  const lf = (id) => { const x = life(id); return [id, x[2], x[1], x[4], x[3]]; };   // [plate, lane, branch, hash, message]
  // generation 1 pops on the cut; when the cut comes early (the trimmed home shot) its second node waits for bar 147, so main forks 1 -> 2 on bars
  const popT = (i) => (N[i][5] > 1 ? G[N[i][5] - 1] : i === 0 ? G[0] : Math.max(G[0], B(147)));
  // a life's clip clock: its take (c0..c1 s) spans the pane's whole life, pop to merged home, so nothing holds a frame (the merge lands on bars)
  const clock = (i, c0, c1) => (t) => c0 + (c1 - c0) * clamp((t - popT(i)) / (M[N[i][5]][1] - popT(i)));
  const ORCH_PANE = has('orch_wide') ? ['orch_wide', B(149) - 3 * BAR] : ['out_orch', B(149) - 2 * BAR];   // bar-aligned windows: whole bars keep the beat
  // [plate, lane, label, hash, message, gen, parent (-1 = main's point), home x, home y (frame units: 1 = frame height, +y up), s0 or clip(t)]
  const N = [
    ['ch0_window', L.orange, 'main · age 5', '', '', 1, -1, -.31, 0, clock(0, 0, 6.0)],           // the girl at the window: where main starts
    [...lf('lf_piano_rose'), 1, -1, .31, 0, clock(1, .2, 7.8)],
    [...lf('lf_violin_white'), 2, 0, -.31, .31, clock(2, .3, 7.9)],
    ['dr_set', ...lf('lf_wushu_gold').slice(1), 2, 0, -.31, -.31, B(148) - BAR],             // her wushu life = the drop's group set (bar-aligned take)
    [...lf('lf_lab_mint'), 2, 1, .31, .31, clock(4, .3, 7.9)],
    [...lf('lf_booth_sky'), 2, 1, .31, -.31, clock(5, .3, 7.9)],
    [...lf('lf_poet_gold'), 3, 2, -.64, .38, G[2] - .5], [...lf('lf_ames_white'), 3, 2, -.64, .13, G[2] - .5],
    [...lf('lf_band_rose'), 3, 3, -.64, -.13, G[2] - .5], [...lf('lf_house_gold'), 3, 3, -.64, -.38, G[2] - .5],
    [...lf('lf_stage_sky'), 3, 4, .64, .38, G[2] - .5], [...lf('lf_home_mint'), 3, 4, .64, .13, G[2] - .5],
    ['v2_dish_sit', L.violet, 'jade/1420-mhz', 'f01d9ae', 'learned: every road was worth it', 3, 5, .64, -.13, G[2] - 1],
    [ORCH_PANE[0], L.orange, 'main · now', '', '', 3, 5, .64, -.38, ORCH_PANE[1]],          // every life playing together
  ];
  const CHERRY = 12, READ = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];                     // commits read on the beats of bars 149–151, oldest first
  const Z = spline([[t0, 1.55], [G[1] - .1, 1.5], [G[1] + .5, 1.2], [G[2] - .1, 1.17], [G[2] + .6, 1], [B(152), .96]]);   // the camera rising a step per fork
  const node = (i, t) => {   // where node i is at t: {x, y (frame units), s (pane height), a}; -1 = main's point (centre)
    if (i < 0) return { x: 0, y: 0, s: 0, a: 1 };
    const n = N[i], z = Z(t), par = node(n[6], t), pop = ss(popT(i), popT(i) + .45, t);
    const [m0, m1] = i === CHERRY ? M.cherry : M[n[5]], m = ss(m0, m1, t), to = i === CHERRY ? node(-1, t) : par;   // merge home: into the parent (violet: straight into main)
    const x = par.x + (n[7] * z - par.x) * pop, y = par.y + (n[8] * z - par.y) * pop;
    return { x: x + (to.x - x) * m, y: y + (to.y - y) * m, s: S0 * z * (.2 + .8 * pop) * (1 - .88 * m), a: pop * (1 - ss(.8, 1, m)) };
  };
  const readAt = (i) => { const c = READ.indexOf(i); return c < 0 ? -1 : bb(149, c); };
  const panels = N.map((n, i) => ({ plate: pk(n[0], 0).plate, ...(typeof n[9] === 'function' ? { clip: n[9] } : { s0: n[9] }),
    lane: n[1], laneAmt: .1, frame: n[1], rw: 480, rh: 270, cellFig: 3, cellWorld: 7, fid: () => 1,
    xf: (t) => { const p = node(i, t); if (p.a <= .001) return null; const tc = readAt(i), hit = tc >= 0 && t >= tc ? Math.exp(-(t - tc) * 5) : 0;
      return { x: p.x, y: p.y, z: 0, s: p.s * (1 + .08 * hit), a: p.a, gain: 1.15 + 1.3 * hit + .9 * Math.exp(-Math.max(0, t - popT(i)) * 6) }; } }));
  const px = (p) => [960 + p.x * 1080, 540 - p.y * 1080];
  const edge = (a, b) => {   // the point on a's pane border (main: a 14 px dot) on the way to b
    const [ax, ay] = px(a), [bx, by] = px(b), dx = bx - ax, dy = by - ay, hw = a.s ? a.s * 540 * A : 14, hh = a.s ? a.s * 540 : 14;
    const k = Math.min(1, hw / Math.max(1e-6, Math.abs(dx)), hh / Math.max(1e-6, Math.abs(dy))); return [ax + dx * k, ay + dy * k]; };
  const strand = (g, a, b, col, t, born) => {   // a lane: dotted drone light; a comet draws it out on the fork, then a pulse runs out on every beat (home in bar 152)
    const [x0, y0] = edge(a, b), [x1, y1] = edge(b, a), len = Math.hypot(x1 - x0, y1 - y0); if (len < 6) return;
    const n = Math.max(1, Math.floor(len / 12)), drawn = clamp((t - born) / .35), ph = ((t - B(149)) / T.beatLen(149)) % 1, home = t >= B(152);
    g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 8;
    for (let j = 0; j <= n; j++) { const f = j / n; if (f > drawn) break; const q = home ? 1 - f : f, pu = t >= B(149) ? Math.exp(-Math.pow((q - ph) * 6, 2)) : 0;
      g.globalAlpha = (.45 + .55 * pu) * Math.min(a.a, b.a); g.beginPath(); g.arc(x0 + (x1 - x0) * f, y0 + (y1 - y0) * f, 2.2 + 1.2 * pu, 0, 7); g.fill(); }
    g.globalAlpha = 1; g.shadowBlur = 0; };
  S.push({ t0, t1, kind: 'panels', panels, cam: () => ({}),
    text: (ty, t) => {
      const g = ty.g, P = N.map((_, i) => node(i, t)), C = node(-1, t);
      g.save(); g.lineCap = 'round'; g.textBaseline = 'alphabetic';
      N.forEach((n, i) => { if (P[i].a > .01) strand(g, n[6] < 0 ? C : P[n[6]], P[i], n[1], t, popT(i)); });
      if (t >= M.cherry[0] - .6 && P[CHERRY].a > .01) {   // the violet lane goes home its own way: dashed, straight into main
        const [x0, y0] = edge(P[CHERRY], C), k = clamp((t - (M.cherry[0] - .6)) / .5); g.setLineDash([8, 12]); g.strokeStyle = L.violet; g.shadowColor = L.violet; g.shadowBlur = 12; g.lineWidth = 4;
        g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + (960 - x0) * k, y0 + (540 - y0) * k); g.stroke(); g.setLineDash([]); g.shadowBlur = 0;
        g.globalAlpha = k * P[CHERRY].a; g.font = '500 24px JBM'; g.fillStyle = '#E9DDFF'; g.fillText('↳ cherry-picked into main', x0 - 120, y0 + 130); g.globalAlpha = 1; }
      // main: a point of light that everything merges into; it flares over the riser into the bar-153 hit
      const fl = ss(bb(152, 2.6), t1 - .03, t), r = 10 + 5 * T.pulse(t, .2) + 230 * fl * fl, gr = g.createRadialGradient(960, 540, 0, 960, 540, r * 3);
      gr.addColorStop(0, 'rgba(255,250,240,1)'); gr.addColorStop(.2, 'rgba(255,196,107,.9)'); gr.addColorStop(1, 'rgba(255,122,26,0)'); g.fillStyle = gr; g.fillRect(960 - r * 3, 540 - r * 3, r * 6, r * 6);
      // branch label (lane dot + name) over each pane
      N.forEach((n, i) => { const p = P[i]; if (p.a < .05 || p.s < .06) return; const [x, y] = px(p), hw = p.s * 540 * A, hh = p.s * 540;
        g.globalAlpha = p.a * .9; g.fillStyle = n[1]; g.beginPath(); g.arc(x - hw + 6, y - hh - 12, 5, 0, 7); g.fill();
        g.font = '500 17px JBM'; g.fillStyle = 'rgba(255,241,220,.9)'; g.fillText(n[2], x - hw + 18, y - hh - 6); });
      g.globalAlpha = 1;
      // the log itself, bottom centre: the last three commits read (one per beat, newest at the bottom, typed in)
      const c = Math.floor((t - B(149)) / T.beatLen(149) + 1e-6);
      if (c >= 0 && t < B(152) + .3) { const k0 = 1 - clamp((t - B(152)) / .3);
        for (let j = Math.max(0, c - 2); j <= Math.min(c, READ.length - 1); j++) { const n = N[READ[j]], tc = bb(149, j), age = c - j, y = 1052 - 34 * age;
          const msg = n[4].slice(0, Math.ceil(clamp((t - tc) / .3) * n[4].length)); g.globalAlpha = k0 * [1, .55, .3][age];
          g.font = '600 26px JBM'; const wh = g.measureText(n[3] + '  ').width; g.font = '400 34px ISI'; const wm = g.measureText(n[4]).width, x = 960 - (wh + wm) / 2;
          g.font = '600 26px JBM'; g.fillStyle = n[1]; g.fillText(n[3], x, y); g.font = '400 34px ISI'; g.fillStyle = '#FFF1DC'; g.fillText(msg, x + wh, y); } }
      g.restore();
      ty.mono('$ git log --graph --all', t, t0 + .1, { x: 802, y: 84, size: 22, cps: 30, out: B(152) });   // top centre, over main (the corners hold panes)
      ty.mono('HEAD -> main', t, bb(152, 2.4), { x: 881, y: 84, size: 22, cps: 30 });
      ty.line(w25, t, { y: 1030, size: 56, out: B(149) - .35 });   // the held "main" (as on the old card)
    } });
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
{ // post-credits (Jade 2026-10-25: "they shouldn't directly interact. The adult just sends the light to the window and the girl sees it, and it
  // should just simply play once, not twice"; her pick: the sender is the violet branch, from takes we already have). Two places, one pass, one
  // sound event. The violet 1420 MHz branch at the dish (v2_horizon, back to us, facing the dawn glow on the horizon: the branch that never came
  // home) sends the light off toward the horizon (FX.mote); cut to the window of the very first shot: the girl alone, studying the frost
  // (ch0_window_t2 clip 0-4.57, the part the intro doesn't use, slowed to fill the shot so her palm lift isn't replayed and nothing holds a
  // frame). The light arrives from outside, touches the glass once, and the idea grows there as a shape: the logistic map's period doubling
  // (FX.frost), one fork per chime group (tools/mix.py: 1, 2, 4, 8 from PC_TOUCH). No equations, no title. (v4's pc_kneel + pc_beam each played
  // the whole palm-to-palm hand-off and the light entering the frost, so it ran twice; those takes are no longer used.)
  const P0 = SONG_END, CUT = P0 + 4.6, P2 = P0 + PC_LEN, TOUCH = P0 + PC_TOUCH;
  const WIN_USED = 6.0 - (B(1) + 3 * (B(2) - B(1)) / 4);   // the intro shows ch0_window from this clip time (its cut at bar 1 beat 4) to the end
  // fit on the box to the window still (stills at P0 + 5, 6.4, 7.6, 8.6, 9.6, 11, 13): the glass region (1080p px) where the shape grows, its stem
  // at the left edge where the light touches ((FR.x, FR.y + FR.h / 2.9)), the chaos fanning out short of her face
  const FR = { x: 150, y: 150, w: 860, h: 560 }, R = [2.9, 3.86], cx = (r) => (r - R[0]) / (R[1] - R[0]);
  // the front parks on each fork and moves on with the chime group that opens it: 1 (the stem), 2, 4, 8 (into chaos)
  const front = spline([[TOUCH, 0], [TOUCH + .4, cx(3)], [TOUCH + 1, cx(3)], [TOUCH + 1.5, cx(3.449)], [TOUCH + 2, cx(3.449)], [TOUCH + 2.3, cx(3.544)],
    [TOUCH + 3, cx(3.544)], [TOUCH + 4.3, 1]]);
  const out = (t) => 1 - ss(P2 - 1.4, P2, t), touchXY = [FR.x, FR.y + FR.h / R[0]];
  S.push({ t0: P0, t1: CUT, kind: 'lattice', look: 'paint', ...pk('v2_horizon', P0), s0: P0 - .5, lane: L.violet, laneAmt: .1, fid: () => 1,
    cam: (u) => ({ dolly: 1 - .03 * u, over: 1.06 }), fade: (u, t) => ss(P0, P0 + 1.0, t),
    text: (ty, t) => FX.mote(ty.g, t, { from: [560, 470], to: [1240, 500], t0: P0 + 1.6, t1: CUT - .2, r: [14, 2], flare: false }) });   // it leaves her toward the horizon glow
  S.push({ t0: CUT, t1: P2, kind: 'lattice', look: 'paint', ...pk('ch0_window', CUT), clip: (u) => WIN_USED * u, fid: () => 1,
    cam: () => ({ dolly: 1, over: 1.06 }), fade: (u, t) => out(t),   // still camera: the shape is screen-locked
    text: (ty, t) => {
      FX.mote(ty.g, t, { from: [-40, 40], to: touchXY, t0: CUT + .3, t1: TOUCH, k: out(t) });   // it arrives from outside and touches the glass once
      if (t >= TOUCH - .05) FX.frost(ty.g, t, front(t), { ...FR, r0: R[0], r1: R[1], k: out(t) }); } });
}
export const FILM_END = SONG_END + PC_LEN;
if (T.VERSION !== 'v1') console.log('[show] timing', T.VERSION, 'resync', JSON.stringify(RESYNC));
// ?timing=v1: the frozen v1 EDL (pre-port), so the v1 render stays reproducible.
export const shots = T.VERSION === 'v1' ? (await import('/engine/show/main_v1.js')).shots : S;
