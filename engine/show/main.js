// The show EDL for the revised song "Merge" (timing v2 = analysis_v2/, inputs/Merge.wav, 282.5 s). Times are song seconds, written as
// bars (B(n), bb(n, beats)) or sung words (ws(id, k) / we(id, k), line ids = v1 numbering) so edits carry over. Picks: work/picks.json.
// ?timing=v1 renders the frozen v1 EDL (engine/show/main_v1.js, the pre-port show for "Merge Me Back to Main.wav") instead.
const T = await import('/engine/src/time.js'); await T.loadTiming();
const PICKS = await (await fetch('/work/picks.json')).json().catch(() => ({}));
// the outro orchestra's score: a transcription of bars 137-144 (tools/orch_tx/build_score.py) + the notation renderer and its glyphs (Bravura)
const NOTATION = await import('/engine/show/score.js');
const SC = NOTATION.prep(await (await fetch('/engine/show/score_orch.json')).json(), await (await fetch('/engine/fonts/bravura_glyphs.json')).json());
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
// Held frames (Jade 2026-10-25: a take that runs out before its shot ends must not freeze; never loop or ping-pong). Lip-synced takes keep their
// timing: when one starts after its cut or ends before it, the cut moves to the take's first / last frame and the neighbour fills the gap.
// Other takes slow down just enough (`fit`, engine/src/clip.js) or start earlier. A take's length (clip time of its last frame): `len` in
// picks.json (tools/sd/picks.py, from the prepped plate), else the measured length of the takes picked on 2026-10-24 (review/cloud/takes).
const LEN = { v1_split_front_t11_be8b364663: 6, v1_light_hands_t12_7418e105bc: 6, ch1_main_t11_647f537e3a: 6, ch1_gone_close_t12_872aeaaac5: 11,
  bd_ahh_t12_d2cff0c504: 7, v2_dish_close_t11_d6fceda232: 6, v2_pencil_t11_28b3018d96: 6, v2_release_t12_1bf7fde028: 8, ch2_catch_t11_03c5dd87e5: 6,
  ch2_gone_close_t12_b30af2db05: 8, out_main_t12_d9d33a9749: 8 };
const lenOf = (shot) => PICKS[shot]?.len ?? LEN[PICKS[shot]?.take];
const synced = (shot) => has(shot) && PICKS[shot].s0 != null;                                     // a take with an audio window (s0)
const head = (shot, t0) => (synced(shot) ? Math.max(t0, pk(shot, t0).s0) : t0);                   // cut no earlier than the take's frame 0
const tail = (shot, t1) => (synced(shot) && lenOf(shot) != null ? Math.min(t1, pk(shot, t1).s0 + lenOf(shot)) : t1);   // ...nor after its last
// a cut that starts before its take's frame 0 (s0 > t0, a bar-aligned take): ease in from frame 0 so it rejoins real time `k` s after s0
const easeIn = (t0, s0, k) => (u, t) => (t >= s0 + k ? t - s0 : k * (t - t0) / (s0 + k - t0));
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
  // outro orchestra (bars 137-144): the composer's score, engraved from the transcription of what actually plays (engine/show/score_orch.json,
  // docs/orchestra_transcription.md) and drawn in light by engine/show/score.js: staves with clef, key, 4/4 and bar lines, notes on their
  // lines and spaces, read left to right under a moving cursor; she writes each note just before it sounds, and as it sounds it flies to
  // the player whose part it is. v: the view (staves, position, scale, pencil tip, players); see score.js draw().
  score(g, t, v, env) { NOTATION.draw(g, t, v, SC, env); },
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
    // a soft dark scrim behind the block, the hooks' style (type.js ledHook), stretched to the three lines: over the frost glyphs of the window
    // and blow plates the italic was hard to read (v5a QA 0:00-0:02)
    const w = Math.max(...POEM.map((ln) => g.measureText(ln).width)), cx = 72 + w / 2, cy = 120, rx = w * .72 + 80, ry = 150;
    g.save(); g.translate(cx, cy); g.scale(1, ry / rx); const sc = g.createRadialGradient(0, 0, 0, 0, 0, rx);
    sc.addColorStop(0, 'rgba(4,5,12,.8)'); sc.addColorStop(.6, 'rgba(4,5,12,.55)'); sc.addColorStop(1, 'rgba(4,5,12,0)');
    g.fillStyle = sc; g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore();
    g.shadowColor = 'rgba(4,5,12,.95)'; g.shadowBlur = 14; g.fillStyle = 'rgba(255,241,220,.95)';
    for (let pass = 0; pass < 2; pass++) POEM.forEach((ln, i) => g.fillText(ln, 72, 90 + i * 44));   // two passes: a denser shadow
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
const L2_T0 = tail('v1_split_front', ws(2) - .08);   // cut just before "Down" (or on L1's last frame: with v4's lag 1.208 it ended 0.4 s early)
{ // L1 "I split myself a thousand ways": she splits again at ground level, copies walking apart
  const w = lines(1), t0 = B(17), t1 = L2_T0;
  const at = [w[1].start, w[4].start, w[5].start];    // split, thousand, ways
  const copies = [], p = pk('v1_split_front', ws(1) - .32);
  const spread = [[-.42, .0], [.4, .0], [-.82, .02], [.78, .02], [-1.15, .04], [1.1, .04], [-1.45, .05]];
  // each copy runs its own clock a moment BEHIND hers (an echo of the line), inside the part of the take she has already sung when it splits
  // off: v4's copies ran 0.9-6.3 s ahead and held the 6 s take's last frame for up to 3 s
  at.forEach((a, gi) => { const k = [1, 2, 4][gi]; for (let i = 0; i < k && copies.length < 7; i++) copies.push({ dt: -(a - p.s0) * (i + 1) / (k + 1), at: a, dur: .7, off: spread[copies.length], scale: .82 - .1 * gi, dens: .42 - .08 * gi, lane: Object.values(L)[(copies.length + 1) % 7], share: true }); });
  S.push({ t0, t1, kind: 'lattice', ...p, fid: () => 1, copies, cam: (u) => ({ dolly: 1 - .04 * u, over: 1.06 }),
    text: (ty, t) => { ty.ledHook(w, t, { x: 110, y: 250, size: 120, maxW: 1100, out: t1 - .3 }); } });
}
const L3_T0 = head('v1_light_hands', bb(24, 3));   // 0:41: the L3 take's first frame comes 0.7 s after bar 24 beat 3 (lag -0.15); cut there
{ // L2 "Down every road the night could hold" (runs on to L3's cut, slowed to fit its 8 s take)
  const w = lines(2), t0 = L2_T0, t1 = L3_T0;
  S.push({ t0, t1, kind: 'lattice', ...pk('v1_track_rose', t0), fit: true, fid: () => .25, lane: L.rose, laneAmt: .12, cam: (u) => ({ dolly: 1, pan: [-.02 * u, 0], over: 1.08 }),
    text: (ty, t) => { ty.line(w, t, { y: 960, size: 60, out: t1 - .4 }); ty.chyron('jade/down-every-road', t, t0 + .3, t1 - .2, L.rose); } });
}
{ // L3 "Each one a light I sent ahead" (sync)
  const w = lines(3), t0 = L3_T0, t1 = ws(4) - .18;
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
  const origin = bb(38, 1.69);      // cut to the origin (forktree)
  const panels = ids.map(([id, lane], i) => {
    const cx = i % cols, cy = Math.floor(i / cols);
    const gx = (cx - 1) * pw * 1.777, gy = (1 - cy) * ph;
    const p = pk(id, 0);
    // the turn is in each take's last 2 s (clip 6.3 on `turn`); after it the take slows (~0.23x) so she turns and grows still through the
    // fold instead of holding the last frame for 4-6 s
    return { plate: p.plate, s0: turn - 6.3, fit: { from: turn, to: origin }, lane, laneAmt: .1, rw: 640, rh: 360, cellFig: 2.5, cellWorld: 7, fid: () => 1,
      xf: (t) => {
        const appear = clamp((t - (t0 + i * .18)) / .35);
        const f = ss(foldStart + i * .55, foldStart + i * .55 + 1.1, t);      // origami fold toward the centre
        const s = ph * (1 - .9 * f);
        return { x: gx * (1 - f), y: gy * (1 - f), z: 0, ry: f * Math.PI * (cx - 1 || .5), rx: f * .6 * (cy - 1 || .5), s: s * 1.0, a: appear * (1 - ss(.85, 1, f)) };
      } };
  });
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
// 1:14: cut as the held "main" ends, or on the take's last frame if it ends first (ch1_main_t11 is 6 s: 0.3 s early; the 7 s re-take reaches it)
const CH1_MAIN_END = tail('ch1_main', bb(44, .38));
{ const w = lines(7), t0 = ws(7) - .1, t1 = CH1_MAIN_END;
  S.push({ t0, t1, kind: 'lattice', ...pk('ch1_main', ws(7) - .3), fid: (u) => .55 + .45 * u, cam: push(.06),
    text: (ty, t) => { ty.mono('git merge --no-ff branch/*', t, t0 + .1, { x: 110, y: 200, size: 24, out: t1 - .4 }); ty.ledHook(w, t, { x: 110, y: 420, size: 170, maxW: 860, out: t1 - .45 }); } });
}
{ const w = lines(8), t0 = CH1_MAIN_END, t1 = ws(8, 4) + .2;   // the tree runs home; cut on "becomes"
  const G1 = B(12) + 1.2;
  // intro_up's clip clock starts on the cut (the forktree spaces its four copy clocks so the last one ends on the take's last frame)
  S.push({ t0, t1, kind: 'forktree', ...pk('intro_up', t0), splitBar0: 3, splits: 10, treeTime: (t) => G1 - (t - t0) / (t1 - t0) * (G1 - B(3) + .2),
    trailT: 1e9, glow: () => 1.0,
    text: (ty, t) => { ty.ledHook(w, t, { x: 960, y: 520, size: 120, maxW: 1600, align: 'center', out: ws(9) - .9 }); } });
}
{ const w = lines(8), t0 = ws(8, 4) + .2, t1 = ws(9) - .6;
  S.push({ t0, t1, kind: 'lattice', ...pk('ch1_runners', t0), fid: () => 1, cam: push(.08),
    text: (ty, t) => { ty.ledHook(w, t, { x: 960, y: 520, size: 120, maxW: 1600, align: 'center', out: ws(9) - .9 }); } });
}
{ const w = lines(9), t0 = ws(9) - .6, t1 = ws(10) - .35;
  S.push({ t0, t1, kind: 'lattice', ...pk(`ch1_fold_${FOLD}`, t0), fit: true, fid: (u) => .7 + .3 * u, cam: push(.05),   // from frame 0 on the cut (v4: 0.2 s
    // late, its first frame held), 0.97x so the 6 s take spans the shot
    text: (ty, t) => { ty.ledHook(w, t, { x: 110, y: 230, size: 140, maxW: 900, out: t1 - .2 }); } });
}
{ const w = lines(10), t0 = ws(10) - .35, t1 = bb(58, 1.64);   // "Nothing that I lived can come undone"; the bar-52 kick lands on "Nothing"
  const hit = (t) => (t >= HIT52 ? Math.exp(-(t - HIT52) / .3) : 0);
  S.push({ t0, t1, kind: 'lattice', ...pk('ch1_gone_close', ws(10) - .3), fid: () => 1, cam: (u, t) => ({ dolly: 1 - .05 * u + .25 * ss(.65, 1, u) - .03 * hit(t), over: 1.06 }),
    text: (ty, t) => { ty.ledHook(w, t, { x: 100, y: 250, size: 112, maxW: 760, out: we(10) - .6 });
      const k = .22 * hit(t); if (k > .01) { ty.g.fillStyle = `rgba(255,246,232,${k})`; ty.g.fillRect(0, 0, 1920, 1080); } } });
}
// ------------------------------------------------------------------------------------------ BREAKDOWN bars 57–72
// 1:51: bd_ahh's first frame (its lag) can come after the "Ahh" cut; the breakdown runs on to it
const AHH_T0 = head('bd_ahh', ws(13) - .1);
{ const t0 = bb(58, 1.64), t1 = ws(13) - .1, w11 = lines(11), w12 = lines(12);
  const ids = ['lf_piano_rose', 'lf_wushu_gold', 'lf_lab_mint', 'lf_poet_gold', 'lf_ames_white', 'lf_band_rose', 'lf_stage_sky', 'lf_home_mint'];
  const wa0 = ws(11) - .27, wa1 = bb(62, .84), re0 = ws(12) - .25, re1 = t1 - .1;   // wander out on "Branch... and wander", return on "Merge... and return"
  const panels = ids.map((id, i) => {
    const a0 = i / ids.length * Math.PI * 2 + .4, p = pk(id, 0);
    // each pane starts near its take's head (clip 0.2 i on its fade-in) and slows (~0.7x) so the 8 s take lasts until it is home (v4 started
    // pane i at clip i and held the last frame for 3.7-8.5 s)
    return { plate: p.plate, s0: t0 + .1 * i, fit: { from: t0 + .3 * i, to: re1 }, rw: 480, rh: 270, cellFig: 3, cellWorld: 8, fid: () => 1,
      xf: (t) => {
        const wander = ss(wa0, wa1, t), ret = ss(re0, re1, t);
        const r = .55 * (1 + .5 * wander) * (1 - ret);
        return { x: Math.cos(a0 + .15 * (t - t0)) * r * 1.4, y: Math.sin(a0 + .15 * (t - t0)) * r, z: -.3 + .2 * Math.sin(i + t * .4), rz: .1 * Math.sin(i * 3 + t * .3),
          s: .26 * (1 - .8 * ret), a: clamp((t - t0 - i * .3) / .8) * (1 - ss(.9, 1, ret)), gain: 1.6 };
      } };
  });
  // back: the 10 s take at ~0.84x. Its glyph figure at .33 gain: the back is added rgb x coverage alpha (panels.js), and the glyph figure's four
  // layers carry ~2.5x the LED figure's coverage, so at gain 1 her jacket and face clipped to white (v5a QA 1:40-1:47). .3 = v4's LED light
  // (SwiftShader stills of a test plate at 1:41.5 and 1:44: figure mean 64 vs 54, clipped 3.6% vs 3.8%; ?figlook=led ignores it)
  S.push({ t0, t1: AHH_T0, kind: 'panels', panels, back: { ...pk('bd_float', t0), fit: { from: t0, to: AHH_T0 }, cellFig: 3, fid: () => 1, figGain: .3 }, cam: () => ({}),
    text: (ty, t) => { ty.line(w11, t, { y: 980, size: 64, out: ws(12) - 1.65 }); ty.line(w12, t, { y: 980, size: 64, out: t1 - .2 }); } });
}
{ const t0 = AHH_T0, t1 = B(69);   // "Ahh"; cut on bar 69 = the leap to the second "ahh" + the kick pulse
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
    const c = k % 4, r = Math.floor(k / 4), p = pk(id, 0), ap0 = bt[k] ?? t0, c0 = (k * .37) % 1.1;
    // each pane's take spans its whole life, pop to collapse (~23 s at 0.25-0.45x; v4 played them at 1x and held the last frame 17-22 s)
    return { plate: p.plate, s0: ap0 - c0, fit: { from: ap0, to: collapse1 }, lane, laneAmt: .12, rw: 480, rh: 270, cellFig: 3, cellWorld: 7, fid: () => .25, frame: lane,
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
      if (!left) {   // right-hand words sit over the panes: dimmed, then back at full light from bar 85 (v5a QA 2:26: "chess move" was lost on them).
        // A soft dark ellipse fitted to the words (and mark), firmer as the panes return
        g.font = '400 54px ISI'; const ww = g.measureText(w).width + (mark ? 56 : 0), back = ss(B(85) - .6, B(85), t);
        const ex = col + 12 + ww / 2, rx = ww / 2 + 120, ry = 78;
        g.save(); g.translate(ex, ny); g.scale(1, ry / rx); const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx);
        gr.addColorStop(0, `rgba(4,5,12,${(.62 + .3 * back) * a})`); gr.addColorStop(.65, `rgba(4,5,12,${(.45 + .35 * back) * a})`); gr.addColorStop(1, 'rgba(4,5,12,0)');
        g.fillStyle = gr; g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore(); }
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
  // ?drop=v4 | v5 (see the cut list below): v5 by default only once every new drop shot has a picked take
  const NEW_DROP = ['dr_dl_wide', 'dr_dl_close', 'dr_gs_ranks', 'dr_gs_tornado', 'dr_gs_ring', 'dr_gs_salute'];
  const DROP = new URLSearchParams(location.search).get('drop') || (NEW_DROP.every(has) ? 'v5' : 'v4');
  const dropText = (ty, t) => {
    const g = ty.g;
    FX.streaks(g, t, D0, B(105) - .3, 2);
    if (t < D0 + .9) { const f = Math.exp(-(t - D0) * 5); g.fillStyle = `rgba(255,250,240,${f})`; g.fillRect(0, 0, 1920, 1080); }
    if (DROP === 'v5') for (const [hb, k] of [[93, .3], [97, .5]]) { const a = t - B(hb);   // v5: the group set's unison hits (the burst, the fall)
      if (a >= 0 && a < .6) { g.fillStyle = `rgba(255,250,240,${k * Math.exp(-a * 7)})`; g.fillRect(0, 0, 1920, 1080); } }
  };
  // Jade 2026-10-24: wushu, not K-pop. v4: her collegiate team's changquan group set (bar 89), a half-vs-half duilian exchange, her jian solo
  // (bar 95), the duilian closing into the salute line, then the fold. The wushu takes were made against this drop's own instrumental
  // (tools/sd/shots_drop.py, v2 windows), so a cut's clip time = its bar offset from the take's window: whole-bar shifts stay on the beat.
  // v5.1 (Jade 2026-10-25: duilian first, then a group set "at least as good as the one I won a medal for"; docs/wushu_v5_design.md sections
  // 9-10, rebuilt from her real routine): duilian 89-92 (three pairs), then the group set 93-100 by six branch copies: unison burst into bow
  // stance on 93, her jian solo on 95, THE GROUP FALL (lands flat on 97.1, bar 97 held still, they rise as one on 98.1), the halves trading a
  // phrase from 98.3 then the cross pairs on 99.3, the arms-out horse stance on 100.1 and main stepping into the V's point for the salute on the
  // "ooh" (100.3), match cut on the V of seven into the fold. Takes: tools/sd/shots_wushu.py, one bar of pre-roll (at(shot, 1)); keys keep the
  // draft names (dr_gs_tornado = the fall, dr_gs_ring = the halves + pairs). ?drop=v4 | v5 forces a version; default v5 only once every new
  // drop shot has a picked take, else v4 unchanged. Forced v5 shows, for any new shot not yet picked, the v4 take that covered that bar on v4's
  // clip clock.
  // Cut positions are bar positions: 98.5 = bar 98 beat 3 (BT). at(shot, bars): the take's window starts `bars` bars before its cut.
  const BAR = B(90) - B(89), BEAT = BAR / 4, BT = (b) => bb(Math.floor(b), (b - Math.floor(b)) * 4);
  const at = (shot, bars) => ({ plate: pk(shot, 0).plate, s0: (b0) => BT(b0) - bars * BAR });
  // keyed(shot, [[bar position, clip time], ...]): the take's key frames land on those bar positions. The clip runs at real speed before the
  // first key and after the last, and linearly between keys, so a short or long held pose still fills its bar (keep each stretch 0.6-1.5x).
  const keyed = (shot, K) => { const k = K.map(([b, c]) => [BT(b), c]);
    return { plate: pk(shot, 0).plate, s0: () => k[0][0] - k[0][1], clip: (u, t) => {
      let j = 0; while (j < k.length - 1 && t > k[j + 1][0]) j++;
      if (j === k.length - 1 || t < k[0][0]) return k[j][1] + t - k[j][0];
      return k[j][1] + (t - k[j][0]) * (k[j + 1][1] - k[j][1]) / (k[j + 1][0] - k[j][0]); } }; };
  const v4at = (shot, bars, b0) => ({ plate: pk(shot, 0).plate, s0: () => B(b0) - bars * BAR });   // a v4 cut's clip clock (its own bar b0)
  // box, after intake: each take's key-frame clip times, read off its strip (planned values below; keep each within ±0.15 s of the plan)
  const KEY = {
    dr_gs_ranks: [[93, BAR]],                                // the burst into bow stance + punch on 93.1
    dr_gs_tornado: [[97, 2 * BAR], [98, 3 * BAR]],           // the six hit the water on 97.1; they start to push up on 98.1 (bar 97 = the held still)
    dr_gs_salute: [[100, BAR], [100.5, BAR + 2 * BEAT]] };   // the horse stance on 100.1; fist meets palm on 100.3 (the "ooh")
  const FOLDCUT = [101, { plate: pk(`ch1_fold_${FOLD}`, 0).plate, s0: (b0) => B(b0) - .2 }, [960, 430]];
  const v5 = (b0, shot, cut, sun, v4cut, v4sun) => (has(shot) ? [b0, cut, sun] : [b0, v4cut, v4sun]);
  const cuts = DROP === 'v5' ? [  // [bar position, plate, s0(b0) = song time of the clip's frame 0, sun x,y]; each cut runs to the next cut
    v5(89, 'dr_dl_wide', at('dr_dl_wide', 1), [960, 160], v4at('dr_set', 0, 89), [700, 230]),                         // duilian: three pairs clash on the drop
    v5(91, 'dr_dl_close', at('dr_dl_close', 1), [960, 330], v4at('dr_set', 2, 91), [700, 230]),                       // the front pair: sweep, leap, flying kick, freeze
    v5(93, 'dr_gs_ranks', keyed('dr_gs_ranks', KEY.dr_gs_ranks), [960, 330], v4at('dr_duilian_mid', 2, 93), [960, 160]),     // group set: unison burst, pubu, pose
    [95, at('dr_jian', 0), [1500, 470]],                                                                              // her jian solo, 1 bar
    v5(96, 'dr_gs_tornado', keyed('dr_gs_tornado', KEY.dr_gs_tornado), [960, 330], v4at('dr_jian', 0, 95), [1500, 470]),     // the fall on 97, held, rise on 98.1
    v5(98.5, 'dr_gs_ring', at('dr_gs_ring', 1), [960, 330], v4at('dr_duilian', 1, 97), [960, 160]),                  // halves trade (98.3, 99.1), cross pairs (99.3)
    v5(100, 'dr_gs_salute', keyed('dr_gs_salute', KEY.dr_gs_salute), [960, 430], v4at('dr_duilian', 3, 99), [960, 160]),     // horse stance; main steps in; salute
    FOLDCUT]
    : [[89, at('dr_set', 0), [700, 230]], [91, at('dr_set', 2), [700, 230]], [93, at('dr_duilian_mid', 2), [960, 160]],
      [95, at('dr_jian', 0), [1500, 470]], [97, at('dr_duilian', 1), [960, 160]], [99, at('dr_duilian', 3), [960, 160]], FOLDCUT];
  const FOLD_I = cuts.length - 1;
  cuts.forEach(([b0, { plate, s0, clip }, sun], i) => {
    const t0 = BT(b0), t1 = BT(i < FOLD_I ? cuts[i + 1][0] : b0 + 2);
    S.push({ t0, t1, kind: 'lattice', look: 'paint', plate, s0: s0(b0), ...(clip ? { clip } : {}), fid: () => 1,
      cam: (u, t) => ({ dolly: punch(t, 1 - .05 * u, .035), orbit: (i % 2 ? -1 : 1) * .03 * (u - .5), over: 1.07 }),
      text: (ty, t) => { FX.sun(ty.g, t, { x: sun[0], y: sun[1], r: 150 + 40 * ooh(t), k: .42 + .3 * ooh(t) }); dropText(ty, t);
        if (i === 0 && t < D0 + 1.2) ty.ledHook([{ w: 'MAIN', start: D0 }], t, { x: 960, y: 690, size: 520, maxW: 2000, align: 'center', out: D0 + .5, lane: 1, scrim: false });
        if (i === FOLD_I) ty.ledHook([{ w: 'ALL', start: B(101) }, { w: 'BRANCHES', start: B(101) + T.beatLen(101) }, { w: 'MERGED', start: B(102) }], t, { x: 960, y: 980, size: 110, maxW: 1800, align: 'center', out: B(103) - .4, lane: 1 }); } });
  });
  { const t0 = B(103), t1 = B(105) - .3, G1 = B(12) + 1.2;
    S.push({ t0, t1, kind: 'forktree', ...pk('intro_up', t0), splitBar0: 3, splits: 10, treeTime: (t) => G1 - ss(t0, t1, t) * (G1 - B(3) + .1), trailT: 1e9, glow: (t) => .9 + .3 * ooh(t),
      text: (ty, t) => { FX.sun(ty.g, t, { x: 960, y: 540, r: 50 + 60 * ss(t1 - 1.5, t1, t), k: .15 + .2 * ss(t1 - 2.5, t1, t) + .15 * ooh(t), disc: true }); dropText(ty, t); } });
  }
  // the flash fades to 30% here and the verse's first shot carries its tail to 0 (tailFlash, verse 2): v5a faded it to black, a dark frame before 3:00.8
  S.push({ t0: B(105) - .3, t1: B(105) - .18, kind: 'card', bg: '#000000', text: (ty, t) => { const g = ty.g; const k = 1 - ss(B(105) - .3, B(105) - .18, t); g.fillStyle = `rgba(255,241,220,${.3 + k * .5})`; g.fillRect(0, 0, 1920, 1080); } });
}
// ------------------------------------------------------------------------------------------ VERSE 2 bars 105–120 — the branch that won't come back
// (v2 re-phrases this verse: line 17 comes 1.4 s later, "again" ends 1.2 s before the chorus pickup — cuts follow the words)
const ctxBar = (ty, t, pct) => { const g = ty.g; g.save(); g.font = '500 20px JBM'; g.fillStyle = 'rgba(255,241,220,.8)'; g.fillText('context', 64, 70);
  g.strokeStyle = 'rgba(255,241,220,.6)'; g.lineWidth = 1.5; g.strokeRect(150, 54, 300, 18); g.fillStyle = L.violet; g.fillRect(153, 57, 294 * pct, 12);
  g.fillStyle = 'rgba(255,241,220,.8)'; g.fillText(`${Math.round(pct * 100)}%`, 466, 70); g.restore(); };
{ const w = lines(16), T0 = B(105) - .18, t1 = we(16) + .2;   // out after the held "way" (the take runs out ~0.5 s later)
  // 3:01: v2_dish_close_t11's first frame is 0.86 s after the downbeat cut (its audio window starts at 181.67). Until the close-up starts, the
  // wide of her alone at the dish (v2_dish_sit, a part of the take the verse doesn't use) carries the downbeat; context bar and chyron run on.
  // The insert starts at clip 3.35 (v5a: 3.0): the take's dish highlight flickers over clip 3.0-3.3 (QA 3:00.8-3:01.1: luma 111/92/138 frame to
  // frame, then a steady 93). It opens on the tail of the drop's white flash (the card before it fades to 30%, not to black), so the
  // flash -> black -> dish pop is one decay.
  const t0 = head('v2_dish_close', T0), text = (ty, t) => { ctxBar(ty, t, .94 + .01 * (t - T0) / 5); ty.chyron('jade/1420-mhz', t, T0 + .2, t1, L.violet); };
  const tailFlash = (ty, t) => { const f = .3 * Math.exp(-(t - T0) / .07); if (f > .01) { ty.g.fillStyle = `rgba(255,241,220,${f})`; ty.g.fillRect(0, 0, 1920, 1080); } };
  if (t0 > T0 + 1 / 24) S.push({ t0: T0, t1: t0, kind: 'lattice', ...pk('v2_dish_sit', T0), s0: T0 - 3.35, fid: () => .25, lane: L.violet, laneAmt: .1, cam: push(.02),
    text: (ty, t) => { text(ty, t); tailFlash(ty, t); } });
  S.push({ t0, t1, kind: 'lattice', ...pk('v2_dish_close', ws(16) - .33), fid: () => .25, lane: L.violet, laneAmt: .1, cam: push(.04),
    text: (ty, t) => { text(ty, t); tailFlash(ty, t); ty.line(w, t, { y: 980, size: 60, out: t1 - .2 }); } });   // (the tail: when no insert)
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
  S.push({ t0, t1, kind: 'lattice', ...pk(`ch2_fold_${FOLD}`, t0 - .6), s0: t0 - .6, fit: true, fid: () => 1,   // 0.9x: the 6 s take spans the shot
    cam: (u, t) => ({ dolly: punch(t, 1 - .05 * u, .03), over: 1.06 }),
    text: (ty, t) => { ty.ledHook(w, t, { x: 110, y: 230, size: 140, maxW: 900, out: t1 - .2 });   // flash after the hook so its scrim doesn't cut the flash
      const f = Math.exp(-(t - t0) * 5); if (f > .01) { ty.g.fillStyle = `rgba(255,250,240,${f})`; ty.g.fillRect(0, 0, 1920, 1080); } } });
}
// 3:56: the orchestra comes in just before the bar-137 impact, or on ch2_gone_close's last frame if that take ends first (lag 0.3: 0.2 s early)
const ORCH_T0 = tail('ch2_gone_close', bb(136, 3.74));
{ const w = lines(23), t0 = ws(23) - .12, t1 = ORCH_T0;   // "Every life I've lived, I have become"
  S.push({ t0, t1, kind: 'lattice', ...pk('ch2_gone_close', ws(23) - .27), fid: () => 1, cam: push(.06),
    text: (ty, t) => { ty.ledHook(w, t, { x: 100, y: 250, size: 112, maxW: 760, out: we(23) + .15 }); } });
}
// ------------------------------------------------------------------------------------------ OUTRO bars 137–163
// v2: two "Back to main" (237, 249); drums out bar 149 (arp alone); last hit bar 153, then pads + bass to the fade (song ends SONG_END).
const ORCH = new URLSearchParams(location.search).get('orch') || 'v5';   // ?orch=v4: the conductor version (two shots), for A/B
if (ORCH === 'v4') { // full drums again: the orchestra of Jades (Jade 2026-10-24: piano, violin, electric guitar, main-Jade conducting every branch). Both takes
  // were made on the v2 instrumental from a bar line (tools/sd/shots_outro.py), so their s0 (picks) keeps the playing on the beat.
  const t0 = ORCH_T0, t1 = ws(25) - .08, tc = B(141), p = pk('out_orch', t0);
  S.push({ t0, t1: tc, kind: 'lattice', look: 'paint', ...p, ...(p.s0 > t0 ? { clip: easeIn(t0, p.s0, 2 * T.beatLen(137)) } : {}), fid: () => 1, cam: push(.04),
    text: (ty, t) => ty.line(lines(24), t, { y: 980, size: 64, out: bb(139, 1.29) }) });
  S.push({ t0: tc, t1, kind: 'lattice', look: 'paint', ...pk('out_orch_close', tc), fid: () => 1, cam: push(.05) });
} else { // v5 (Jade 2026-10-25: the playing should match what's in the music; the conductor becomes a composer writing it in real time with a pencil).
  // The composer is the violet branch herself (Jade's pick, 2026-10-25): the 1420 MHz Jade, bun with two pencils, violet bands, writing in violet
  // light, while the main-world band (rose piano, white violin, rose guitar) plays what she writes. The branch that went off on her own writes the
  // music the others play; seconds later the living graph cherry-picks her commit into main (as the post-credits, she is the one who sends).
  // v5b (Jade 2026-10-26: "make sure the musical notation correctly corresponds to the music ... read left to right ... It should not be
  // arbitrary"; "I'd almost rather her be still, holding a pencil and drawing notes that fly into the staff while the others play").
  // What plays, transcribed and verified by resynthesis (docs/orchestra_transcription.md -> engine/show/score_orch.json), 4/4, B minor/D major:
  // - Voice: "main" held (E4-D4-B3 melisma, B3 from beat 2 of 137), then the wordless line in two layers an octave apart: C#5/C#4 (138),
  //   D5/D4 (139), a scoop G->A on the downbeat of 140 to A5/A4, the upper layer E5 on beat 3 over the held A4, then F#5/F#4 from the "and" of
  //   4 into 141, held to beat 2 (F#4) / the "and" of 3 (F#5) of 143; "Back to main" #2 from the "and" of 2 of 144. The violin doubles it.
  // - Synth keys: a dotted-8th line (16ths 0,3,6,9,12 of each bar) on A4 (137-141, 143) and C#5 (142, 144) over the pad (Gadd9 -> Bm7 at 141).
  //   The 16th inner arpeggiation of the chord is audible but its note order can't be recovered under the drop, so it is not notated.
  // - Bass synth: G (137-140) -> B (141-144), gated off on every beat: offbeat 8ths. There is no guitar in the mix; the guitar doubles it.
  // Each cut features the player whose part is the event of that bar (wide 137 | voice 138 | keys 139 | composer + voice 140 | guitar 141 |
  // wide 142-143 | composer 143.75-144); the staff on screen is that player's part, read left to right under a moving cursor; the composer's
  // pencil writes each note 0.55 s before it sounds and, as it sounds, it flies to its player.
  // The composer is STILL (Jade 2026-10-26): her close-ups use orch_pencil_t52's quiet writing stretch (clip 3.0-4.8 and 5.2-6.2: body still,
  // pencil hand drawing at chest height, eyes on the pencil), shifted by whole beats; the second wide uses orch_wide_t52 clip 3.0-6.1 (she
  // holds the pencil up and writes small strokes, body still) instead of 9.6-12.6, where she waves it like a baton. Any other orch_pencil pick (t51 conducts with a raised arm)
  // and the v4 stand-ins (the dancing conductor) get no composer close-up: those two cuts stay on the band. Re-take spec: tools/sd/shots_outro.py
  // orch_compose (+ orch_wide_still).
  // Takes: tools/sd/shots_outro.py orch_* (v2 instrumental windows from a beat, so whole-beat s0 shifts keep the playing on the beat). Until a
  // take is picked, its cut renders a reframe of the v4 takes (stand-in) so the timing can be reviewed now.
  const t0 = ORCH_T0, t1 = ws(25) - .08, BT = T.beatLen(137);
  const LANE = { voice: L.white, keys: L.rose, guitar: L.rose };
  const FLY = { voice: B(138) - .02 };   // the violin doubles the voice from bar 138 (bar 137 is the lead's "main")
  const ENV = { voice: (t) => NOTATION.env(SC, 'voice', t), keys: (t) => NOTATION.env(SC, 'keys', t), guitar: (t) => NOTATION.env(SC, 'guitar', t) };
  const STILL_PENCIL = 'orch_pencil_t52_f2ca5088fd', still = isTake('orch_pencil', STILL_PENCIL);
  // the pencil tip in a take, keyframed by eye on 1920x1080 frames: [clip s, x, y] -> (t) => [x, y] for a cut whose clip time is t - s0
  const tipK = (K, s0) => (t) => { const c = t - s0; let i = 0; while (i < K.length - 2 && c > K[i + 1][0]) i++;
    const [a, b] = [K[i], K[i + 1]], u = clamp((c - a[0]) / (b[0] - a[0])); return [a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u]; };
  const PENCIL_TIP = [[3.0, 1285, 624], [3.9, 1181, 653], [4.8, 1062, 666], [5.2, 980, 685], [5.65, 912, 707], [6.2, 835, 712]];   // orch_pencil_t52
  const LINE_TIP = [[0, 1030, 220], [.6, 1060, 220], [1.2, 1060, 290], [1.74, 1060, 320]];                                         // orch_line_t51
  const COMPOSE_TIP = {};   // orch_compose re-take (tools/sd/shots_outro.py): { take: [[clip, x, y], ...] }, keyframed by eye like PENCIL_TIP
  // views (1920-space, set on frames of the picked takes at each cut: orch_wide t52 1.7 / 11.1 s, orch_line t51 0.9, orch_keys t51 1.7,
  // orch_pencil t52 3.9 / 5.7, orch_guitar t53 1.7): the score stays in open sky, clear of faces; `to` = the instrument of the player
  const sys3 = (gap) => [{ part: 'voice', y: 26 }, { part: 'keys', y: 26 + 8.4 * gap }, { part: 'guitar', y: 26 + 16.8 * gap }];
  const base = { lead: .55, colors: LANE, fly: FLY };
  const WIDE1 = { ...base, staves: sys3(9), x0: 1110, x1: 1895, gap: 9, px16: 17, from: -2, to: { voice: [1390, 395], keys: [300, 600], guitar: [1650, 585] } };
  const WIDE2 = { ...WIDE1, from: 78, to: { voice: [1470, 410], keys: [260, 600], guitar: [1690, 600] } };   // set on orch_wide_t52 at clip 4.5
  const LINE = { ...base, staves: [{ part: 'voice', y: 40 }], x0: 720, x1: 1890, gap: 19, px16: 30, from: 14, to: { voice: [1525, 350] }, feature: 'voice' };
  const KEYS = { ...base, staves: [{ part: 'keys', y: 64 }], x0: 430, x1: 1580, gap: 22, px16: 34, from: 30, to: { keys: [990, 515] }, glowR: 120, feature: 'keys' };
  const PENCIL = { ...base, staves: [{ part: 'voice', y: 124 }], x0: 1300, x1: 1900, gap: 16, px16: 24, from: 46, to: { voice: [1445, 480] }, labelPos: 'above' };
  const GUITAR = { ...base, staves: [{ part: 'guitar', y: 140 }], x0: 150, x1: 890, gap: 20, px16: 26, from: 62, to: { guitar: [1020, 565] }, feature: 'guitar', labelPos: 'above' };
  const MERGE = (t) => ss(t1 - .45, t1 - .03, t);
  // stand-ins: 2D crops of the v4 wide (LatticeView zoom: no parallax, kept inside the plate) with a +-1% push around the cut's midpoint, so the
  // midpoint framing is the one the score positions were set on (v5a: dolly .42-.52 tore the players). The v4 conductor dances, so no stand-in
  // shows her close: the composer cuts stay on the band. keys: the piano sits at the plate's left edge, so its pan is clamped.
  const crop = (zoom, pan) => (u) => ({ zoom: zoom * (1 + .02 * (u - .5)), pan, over: 1.06 });
  const SI = {
    wide: { ...WIDE1, to: { voice: [1462, 330], keys: [272, 572], guitar: [1705, 572] } },
    violin: { ...LINE, x0: 170, x1: 690, staves: [{ part: 'voice', y: 50 }], gap: 13, px16: 22, to: { voice: [1090, 335] } },   // staff left of her head (QA 3:58.5)
    keys: { ...KEYS, x0: 430, x1: 1500, staves: [{ part: 'keys', y: 40 }], gap: 15, px16: 26, to: { keys: [800, 560] } },
    guitar: { ...GUITAR, x0: 200, x1: 900, staves: [{ part: 'guitar', y: 120 }], gap: 16, px16: 28, to: { guitar: [1380, 690] } },
  };
  const violinCrop = crop(1 / .52, [.36, .1]);
  const CUTS = [ // [t0, t1, v5 shot, view, v5 cam, clip shift (whole beats later into the take; {take: beats} for one take), stand-in [v4 shot, s0, cam, view]]
    [t0, B(138), 'orch_wide', WIDE1, push(.03), 0, ['out_orch', B(137), push(.04), SI.wide]],
    [B(138), B(139), 'orch_line', { ...LINE, tip: tipK(LINE_TIP, B(138)) }, (u) => ({ dolly: 1 - .03 * u, pan: [.02 * u, 0], over: 1.06 }), 0,
      ['out_orch', B(137), violinCrop, SI.violin]],
    [B(139), B(140), 'orch_keys', KEYS, (u) => ({ dolly: 1 - .03 * u, pan: [.03 * u, 0], over: 1.06 }), 0, ['out_orch', B(137), crop(1 / .42, [-.537, .025]), SI.keys]],
    [B(140), B(141), 'orch_pencil', PENCIL, push(.02), 6, ['out_orch', B(137), violinCrop, { ...SI.violin, from: 46 }]],   // the leap: on the violin
    [B(141), B(142), 'orch_guitar', GUITAR, push(.04), 0, ['out_orch', B(137), crop(2, [.47, .04]), SI.guitar]],
    [B(142), bb(143, 3), 'orch_wide', WIDE2, (u) => ({ dolly: .96 + .08 * u, over: 1.06 }), { orch_wide_t52_b4a325427b: -15 }, ['out_orch', B(139), (u) => ({ dolly: 1.02 - .06 * u, over: 1.06 }), { ...SI.wide, from: 78 }]],
    [bb(143, 3), t1, 'orch_pencil', { ...PENCIL, from: 100, merge: MERGE, mergeL: 1240 }, push(.02), -4, ['out_orch', B(139), (u) => ({ dolly: .96 - .02 * u, over: 1.06 }), { ...SI.wide, from: 100, merge: MERGE }]],
  ];
  // the composer's two cuts without the still take: stay on the band (the leap on the violin from behind her, still; the fold on the wide)
  const NOCOMPOSER = { [B(140)]: ['orch_line', (p) => ({ ...p, s0: B(139) }), { ...LINE, from: 46 }],                        // orch_line clip 1.74-3.48
    [bb(143, 3)]: ['orch_wide', (p) => ({ ...p, s0: p.s0 + 15 * BT }), { ...WIDE2, from: 100, merge: MERGE }] };   // clip 6.1-7.1
  CUTS.forEach(([a, b, shot0, view0, cam, shift, [alt, altS0, altCam, altView]]) => {
    // each cut switches to its new take once one is picked (has(): a real take, not picks.py's still_ placeholder); until then the stand-in.
    // The composer's close-ups only with the still take (see above); her pencil tip is keyframed on that take.
    let shot = shot0, view = view0, fix = null;
    if (shot0 === 'orch_pencil' && has('orch_compose')) [shot, fix] = ['orch_compose', (p) => ({ ...p, s0: a - (a === B(140) ? .5 : 4) })];   // the re-take: clip .5-2.2 / 4-5
    else if (shot0 === 'orch_pencil' && !still && NOCOMPOSER[a] && has(NOCOMPOSER[a][0])) [shot, fix, view] = NOCOMPOSER[a];
    const composer = shot === 'orch_pencil' || shot === 'orch_compose', v5 = has(shot) && (shot !== 'orch_pencil' || still);
    let p = v5 ? pk(shot, a) : { plate: pk(alt, 0).plate, s0: altS0 };
    const sh = typeof shift === 'object' ? shift[PICKS[shot]?.take] || 0 : shift;   // a shift can be for one take only
    if (v5 && fix) p = fix(p); else if (v5 && sh) p.s0 -= sh * BT;                // whole beats: the reference-audio playing stays on the beat
    const tipKeys = shot === 'orch_compose' ? COMPOSE_TIP[PICKS.orch_compose?.take] : PENCIL_TIP;   // a re-take needs its tip keyframed (else no tip)
    const v = v5 ? (composer && tipKeys ? { ...view, tip: tipK(tipKeys, p.s0) } : view) : altView;
    const tint = v.feature && LANE[v.feature];
    S.push({ t0: a, t1: b, kind: 'lattice', look: 'paint', ...p, ...(p.s0 > a ? { clip: easeIn(a, p.s0, 2 * BT) } : {}), fid: () => 1, cam: v5 ? cam : altCam,
      ...(composer && v5 ? { lane: L.violet, laneAmt: .1 } : {}),   // her close-ups carry the violet lane, like every 1420 MHz shot
      update: tint ? (sc, u, t) => { sc.fig.set('uTint', tint); sc.fig.set('uTintAmt', .04 + .18 * Math.min(1, ENV[v.feature](t))); } : undefined,   // the featured player lights up
      text: (ty, t) => { FX.score(ty.g, t, v, ENV); if (t < B(139)) ty.line(lines(24), t, { y: 980, size: 64, out: we(24) + .25 }); } });
  });
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
      // the log itself, bottom centre: the last three commits read (one per beat, newest at the bottom, typed in). One hash column for every line
      // (the block centred on the longest message), and the oldest line's top (~982) below the lowest bottom-row pane edges (gen 2: ~968 with the
      // read pulse): v5a centred each line and set them 34 px apart from 1052, so a popped pane clipped the oldest hash (QA 4:18.4)
      const c = Math.floor((t - B(149)) / T.beatLen(149) + 1e-6);
      if (c >= 0 && t < B(152) + .3) { const k0 = 1 - clamp((t - B(152)) / .3);
        g.font = '600 24px JBM'; const wh = g.measureText('0000000  ').width; g.font = '400 30px ISI';
        const x = 960 - (wh + Math.max(...READ.map((r) => g.measureText(N[r][4]).width))) / 2;
        for (let j = Math.max(0, c - 2); j <= Math.min(c, READ.length - 1); j++) { const n = N[READ[j]], tc = bb(149, j), age = c - j, y = 1060 - 28 * age;
          const msg = n[4].slice(0, Math.ceil(clamp((t - tc) / .3) * n[4].length)); g.globalAlpha = k0 * [1, .55, .3][age];
          g.font = '600 24px JBM'; g.fillStyle = n[1]; g.fillText(n[3], x, y); g.font = '400 30px ISI'; g.fillStyle = '#FFF1DC'; g.fillText(msg, x + wh, y); } }
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
// ?dumpedl=1: print the edit list (tools/cloud_pack.py builds review/cloud/manifest.md from it)
if (new URLSearchParams(location.search).has('dumpedl')) console.log('[edl] ' + JSON.stringify(S.map((x) => ({ t0: +x.t0.toFixed(3), t1: +x.t1.toFixed(3), kind: x.kind, look: x.look, plate: x.plate, s0: x.s0 != null ? +x.s0.toFixed(3) : null, screens: x.screens && x.screens.map((c) => c.plate), panels: x.panels && x.panels.map((p) => [p.plate, p.s0 != null ? +p.s0.toFixed(3) : null]), back: x.back && x.back.plate }))));
// ?timing=v1: the frozen v1 EDL (pre-port), so the v1 render stays reproducible.
export const shots = T.VERSION === 'v1' ? (await import('/engine/show/main_v1.js')).shots : S;
