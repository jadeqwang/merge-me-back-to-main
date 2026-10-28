// v6 animatic: "Merge" written in text (docs/treatment_v6.md). The whole song on v2 timing (analysis_v2/timing.json), every shot a TextScene
// (engine/src/scenes/text.js) of layers. Footage slots carry Jade's shot IDs (A1 … H2, W = the girl at the frost window, R = the 2004 set)
// and show, in order of preference: her footage (work/footage/, tools/footage/), a stand-in take (work/standin/, tools/footage/standins.py),
// or a labelled card. Labels: ?labels=0 hides them.
//   node engine/render.mjs --q "show=/engine/show/v6.js" --from 0 --to 28 --res 1280x720 --audio --mp4 out/x.mp4
// Times are bars (B(n), bb(n, beats)) or sung words (ws(id, k)); the section map is in the treatment.
const T = await import('/engine/src/time.js'); await T.loadTiming();
const { hash } = await import('/engine/src/textlook.js');
const { slot, slotL, lyric, hook, stars } = await import('/engine/src/v6/layers.js');
const { frost } = await import('/engine/src/v6/frost.js');
const { buildLog, gitGraph, endCard } = await import('/engine/src/v6/gitlog.js');
const FX = await import('/engine/src/v6/fx.js');
const { LIFE } = await import('/engine/show/life_v6.js');
const SLOTS = await (await fetch('/engine/show/v6_slots.json')).json();

const B = T.bar, bb = T.bb, BEAT = T.beatLen(1), END = T.songEnd();
const ws = (id, k = 0) => { const w = T.words(id); return w[k < 0 ? w.length + k : k].start; };
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const lerp = (a, b, x) => a + (b - a) * x;
const ramp = (t0, t1, a, b) => (t) => lerp(a, b, ss(t0, t1, t));
const desc = (id) => SLOTS[id]?.desc || '';
const S = [];
const shot = (t0, t1, ...layers) => S.push({ t0, t1, kind: 'text', layers: layers.flat() });
// a footage slot + its label; o.t0/o.t1 default to the shot's window
const F = (id, t0, t1, o = {}) => slotL(id, { t0, t1, lane: SLOTS[id]?.lane, desc: desc(id), short: o.short, ...o });
const sung = (id, o = {}) => lyric(T.words(id), { out: T.line(id).end + .4, ...o });

// ---- Intro 0-27.95 (bars 1-16): the frost window; the frost is the tree, 1 -> 1,024; MERGE on the bar-9 hit (14.04) ----------------------
const FORK0 = 3;   // generation g >= 1 forks on bar FORK0 + g - 1 (bars 3-12), as the v5 tree did
const introFrost = frost({
  start: (g) => (g === 0 ? .3 : B(FORK0 + g - 1)), dur: (g) => (g === 0 ? B(FORK0) - .3 : BEAT * (g < 4 ? 2.2 : 1.8)),
  hold: (t) => (t < B(9) ? 3 : 2), gain: (t) => 1 + (t >= B(9) ? .45 * Math.exp(-(t - B(9)) / .5) : 0),
});
shot(0, B(17),
  F('W', 0, B(5), { on: (t) => t < B(5), density: .3, hold: 3, fade: () => .6, short: 'the girl at the frost window' }),
  F('W2', B(5), B(9), { on: (t) => t >= B(5) && t < B(9), density: .3, hold: 3, fade: () => .6, short: 'she blows on her palm' }),
  introFrost,
  FX.counter((t) => introFrost.count(t), { since: (t) => (introFrost.gen(t) ? B(FORK0 + introFrost.gen(t) - 1) : 0), on: (t) => t >= .3, fade: (t) => 1 - ss(B(16), B(17) - .1, t) }),
  FX.counterLabel((t) => introFrost.count(t), { on: (t) => t >= .3, fade: (t) => 1 - ss(B(16), B(17) - .1, t) }),
  { density: .74, hold: 2, on: (t) => t >= B(9) - .02 && t < B(15),   // MERGE slams on the bar-9 hit, holds, dissolves into the frost by bar 15
    draw(g, k) { const kick = Math.exp(-(k.t - B(9)) / .14); FX.bigTitle(g, k, kick, 1 - ss(B(13), B(15), k.t)); } },
);

// ---- Verse 1 27.95-55.77 (bars 17-32): sparse text ---------------------------------------------------------------------------------------
{
  const t1 = ws(1, 1) - .05;                                   // "split"
  shot(B(17), t1, F('B1', B(17), t1, { density: .26, hold: 3, short: 'blow across the palm' }), sung(1));
  // "I split myself a thousand ways": the copies fork (1, 2, 4, 8 on the beats) and drift apart, each in a branch lane
  const t2 = ws(2, 0) - .1, LN = ['orange', 'rose', 'sky', 'mint', 'gold', 'violet', 'white', 'rose'];
  const fork = (t) => { const n = Math.min(8, Math.pow(2, Math.floor((t - t1) / BEAT))), out = [];
    for (let i = 0; i < n; i++) { const born = t1 + Math.floor(Math.log2(Math.max(1, i)) + (i ? 1 : 0)) * BEAT, a = clamp((t - born) / 2.5);
      out.push({ dt: i * .17, lane: LN[i], crop: [.36, .64], x: (i % 2 ? 1 : -1) * Math.ceil(i / 2) * .11 * (.4 + a), y: -.02 * Math.ceil(i / 2), s: .8 - .03 * Math.ceil(i / 2) }); }
    return out; };
  shot(t1, t2, F('A3', t1, t2, { density: ramp(t1, t2, .26, .4), hold: 2, copies: fork, short: 'one take, copied: the fork' }), sung(1));
  const t3 = B(24);
  shot(t2, t3, F('A4', t2, t3, { density: .28, hold: 3, copies: (t) => [-1, 0, 1].map((s, i) => ({ dt: .4 * i, lane: ['sky', 'orange', 'rose'][i], x: s * .14 * ss(t2, t3, t), s: 1 - .1 * Math.abs(s) })), short: 'down every road' }), sung(2));
  const t4 = ws(3, 0) - .2;
  shot(t3, t4, F('A2', t3, t4, { density: .3, hold: 2 }), sung(2));
  const t5 = bb(28, 1);                                         // "Each one a story" lands on the beat
  shot(t4, t5, F('B2', t4, t5, { density: .32, hold: 2, short: 'the light I sent ahead' }), sung(3));
  // "Each one a story to unfold": the lives, one per two beats, each in its lane, with its branch name
  const LIVES = ['C1', 'C2', 'C7', 'C8', 'C4', 'C3', 'C5', 'C6', 'C9'];
  LIVES.forEach((id, i) => {
    const a = bb(28, 1 + 2 * i), b = i === LIVES.length - 1 ? B(33) : bb(28, 3 + 2 * i), lf = LIFE.find((l) => l[0] === id);
    shot(a, b, F(id, a, b, { density: .34, hold: 2, lane: lf ? lf[2] : SLOTS[id].lane }),
      { density: .6, hold: 4, draw: (g) => g.text(Math.round(g.cols / 2), Math.round(g.rows * .1), lf ? lf[1] : 'jade/' + id, lf ? lf[2] : 'white', .9, { align: 'center' }) },
      sung(4));
  });
}

// ---- Pre-chorus 55.77-69.69 (bars 33-40): the 3x3 grid of lives; every head turns on bar 37; the cells fold back into the frost window -----
{
  const t0 = B(33), t1 = ws(7, 0) - .03, FOLD0 = 64.9, GRID = ['C1', 'C2', 'C3', 'C4', 'C9', 'C5', 'C6', 'C7', 'C8'];
  const fold = (t) => 1 - Math.pow(ss(FOLD0, t1 - .2, t), 1.4);   // cells shrink into the centre
  const cells = GRID.map((id, i) => {
    const cx = (i % 3) / 3, cy = Math.floor(i / 3) / 3, lf = LIFE.find((l) => l[0] === id);
    const box = (t) => { const f = fold(t), w = (1 / 3 - .01) * f, h = (1 / 3 - .015) * f; return [.5 + (cx + 1 / 6 - .5) * f - w / 2, .5 + (cy + 1 / 6 - .5) * f - h / 2, w, h]; };
    return slot(id, { t0, t1, box, lane: lf ? lf[2] : SLOTS[id].lane, desc: desc(id), boxText: lf ? lf[1] : '', density: .52, hold: 2, thresh: .1 });
  });
  const back = frost({ start: () => FOLD0 - 2, dur: () => .01, density: .5, hold: 3, gain: (t) => .7 * ss(FOLD0, t1, t), accrete: .3 });
  shot(t0, t1, back, { density: .52, hold: 2, async setup() { for (const c of cells) await c.setup(); },
    async draw(g, k) { for (const c of cells) await c.draw(g, k); } },
  { density: .62, hold: 4, knock: true, fade: () => (new URLSearchParams(location.search).get('labels') !== '0' ? 1 : 0),
    draw: (g) => g.text(2, g.rows - 2, '[B3 x C1-C9] the 3x3 grid of lives: every head turns on bar 37 (62.72); cells fold into the frost window', 'white', .5) },
  sung(5), sung(6));
}

// ---- Chorus 1 69.69-97.51 (bars 41-56): the copies stream in, density rises -------------------------------------------------------------
{
  const t0 = ws(7, 0) - .03, t1 = ws(8, 0) - .1, LN = ['rose', 'sky', 'mint', 'gold', 'violet', 'white'];
  const stream = (t) => [{ dt: 0, lane: 'orange' }, ...LN.map((ln, i) => {   // copies fly in from the sides and merge into her
    const a = clamp((t - t0 - i * .55) / 1.6), side = i % 2 ? 1 : -1;
    return a >= 1 ? null : { dt: .25 * (i + 1), lane: ln, x: side * (.55 - .55 * ss(0, 1, a)), s: 1, gain: 1 - .5 * a };
  }).filter(Boolean)];
  shot(t0, t1, F('A2', t0, t1, { density: ramp(t0, t1, .45, .62), hold: 2, copies: stream, short: 'the copies stream in' }),
    hook(T.words(7), { lines: [['Merge', 'me'], ['back', 'to', 'main']], y: .44, size: 190, out: T.line(7).end }));
  const t2 = ws(9, 0) - .1;
  const crowd = (t) => { const k = ss(t1, t2, t); return [-3, -2, -1, 1, 2, 3, 0].map((p, i) => ({ crop: [.36, .64], dt: .12 * Math.abs(p), lane: p ? LN[(i + 6) % 6] : 'orange', x: p * .12 * (1 - k), s: .9 })); };
  shot(t1, t2, F('A3', t1, t2, { density: ramp(t1, t2, .55, .7), hold: 2, copies: crowd, short: 'every road becomes the one' }), sung(8));
  const t3 = ws(10, 0) - .1;
  shot(t2, t3, F('B4', t2, t3, { density: .68, hold: 2, short: 'the fold' }), sung(9));
  shot(t3, B(57), F('A1', t3, B(57), { density: ramp(t3, B(57), .78, .86), hold: 3, short: 'eyes to lens, the long "undone"' }), sung(10, { out: T.line(10).end }));
}

// ---- Breakdown 97.51-125.34 (bars 57-72): commit messages gather into a frost branch; the "Ahh" ----------------------------------------
shot(B(57), B(65), FX.messages({ t0: B(57) + .2, g0: ws(12, 0) - .4, g1: B(65) - .3 }), sung(11, { y: .93 }), sung(12, { y: .93 }));
shot(B(65), B(73), F('A5', B(65), B(73), { density: (t) => lerp(.5, .9, ss(116.64, 125.2, t)), hold: (t) => (t < 116.64 ? 3 : t < 123.49 ? 2 : 1),
  gain: (t) => 1.1 + .6 * ss(116.64, 125.3, t), short: 'eyes closed, the Ahh' }));

// ---- Build 125.34-153.17 (bars 73-88): graphics only, git log racing on the beat, drawn inward into the drop -----------------------------
shot(B(73), B(89), buildLog(T));

// ---- Drop 153.17-180.99 (bars 89-104): her real 2004 group set (box: ?drop=real); stand-in = one solo take copied into the formations ----
{
  const TEAM = ['rose', 'sky', 'gold', 'mint', 'violet', 'white'];
  const form = (pos, ripple = 0) => () => pos.map(([x, y, s], i) => ({ dt: ripple * i * BEAT / 8, lane: TEAM[i], x, y, s, crop: [.3, .7] }));
  const rows2 = form([[-.3, -.08, .55], [0, -.08, .55], [.3, -.08, .55], [-.3, .12, .65], [0, .12, .65], [.3, .12, .65]]);
  const line6 = form([-.4, -.24, -.08, .08, .24, .4].map((x) => [x, .05, .55]));
  const wedge = form([[0, -.1, .5], [-.15, 0, .55], [.15, 0, .55], [-.3, .1, .6], [.3, .1, .6], [0, .14, .62]], 1);
  const D = { density: .8, hold: 1, gain: 1.25, short: 'STAND-IN: one solo take copied; final = the 2004 set traced (box ?drop=real)' };
  shot(B(89), B(93), F('R1', B(89), B(93), { ...D, copies: rows2 }));
  shot(B(93), B(97), F('R2', B(93), B(97), { ...D, copies: line6 }));
  shot(B(97), B(100), F('R4', B(97), B(100), { ...D, copies: wedge }));
  // the final line: position 3 (from the left) is her 2004 self; on the "ooh" (173.08) present-day Jade (main, orange) steps into it
  const OOH = 173.08, X = [-.4, -.24, -.08, .08, .24, .4];
  const team = () => X.map((x, i) => (i === 2 ? null : { dt: 0, lane: TEAM[i], x, y: .05, s: .55, crop: [.36, .64] })).filter(Boolean);
  shot(B(100), B(105),
    F('A3', B(100), B(105), { ...D, copies: team, short: 'the team holds the final pose (2004, traced)' }),
    F('B9', B(100), B(105), { density: .8, hold: 1, gain: 1.3, lane: 'orange', copies: (t) => [{ dt: 0, lane: 'orange', crop: [.36, .64], x: X[2] + .7 * (1 - ss(OOH - .2, OOH + 1.1, t)), y: .05, s: .55 }],
      labelTop: true, short: 'present-day Jade steps into position 3 on the "ooh"' }));
}

// ---- Verse 2 180.99-208.82 (bars 105-120): the violet branch at the dish -----------------------------------------------------------------
{
  const V = { lane: 'violet' }, ctx = (t) => lerp(95, 100, ss(B(105), 201.86, t));
  const t1 = ws(17, 0) - .1;
  shot(B(105), t1, FX.dish({ label: true, on: () => true }), F('B7', B(105), t1, { ...V, density: .32, hold: 3, crop: [0, .55], short: 'at the dish rim' }), FX.meter(ctx), sung(16));
  const t2 = ws(18, 0) - .1;
  shot(t1, t2, F('A4', t1, t2, { ...V, density: .28, hold: 3, short: 'back to the place where I began' }), FX.meter(ctx), sung(17));
  const t3 = ws(19, 0) - .1;
  shot(t2, t3, F('B6', t2, t3, { ...V, density: .34, hold: 2, short: 'writes in the air' }),
    FX.airwrite('learned: every road was worth it', { t0: t2 + 1.2, t1: t3 - .6, x: .08, y: .22 }), FX.meter(ctx), sung(18));
  // "Comes home to who I'll be again": she lets the light go; on the drums-out (201.86) she comes apart into text as it leaves
  const CUT = 201.86, t4 = ws(20, 0) - .05;
  shot(t3, t4, F('B8', t3, t4, { ...V, density: .34, hold: (t) => (t < CUT ? 2 : 3), scatter: (t) => ss(CUT, t4 - .5, t), short: 'she sends the light' }),
    FX.comet({ from: [.5, .55], to: [.95, .05], t0: CUT, t1: CUT + 4.5, lane: 'violet', bend: .05 }), FX.meter(ctx, { fade: (t) => 1 - ss(CUT, CUT + 1, t) }), sung(19));
}

// ---- Chorus 2 208.82-236.64 (bars 121-136): the light crosses the night, touches the frost window on 222.73, the frost blooms -------------
{
  const t0 = ws(20, 0) - .05, t1 = ws(21, 0) - .1, HIT = B(129);
  shot(t0, t1, F('B5', t0, t1, { density: ramp(t0, t1, .5, .6), hold: 2, short: 'the catch' }),
    hook(T.words(20), { lines: [['Merge', 'me'], ['back', 'to', 'main']], y: .44, size: 190, out: T.line(20).end }));
  const ROOT = [.5, .99];
  const bloom = frost({ start: (g) => (g === 0 ? HIT - .25 : HIT + (g - 1) * BEAT * .5), dur: (g) => (g === 0 ? .25 : BEAT * .7), density: (t) => .42 + .045 * bloom.gen(t),
    hold: 1, gain: (t) => 1 + .8 * Math.exp(-Math.max(0, t - HIT) / .6), front: .6 });
  const residue = frost({ start: (g) => (g <= 3 ? 0 : 1e9), dur: () => .01, density: .45, hold: 3, gain: () => .45, accrete: .2, on: (t) => t < HIT });
  shot(t1, ws(23, 0) - .1,
    F('W', t1, ws(23, 0) - .1, { density: .3, hold: 3, fade: (t) => .45 + .4 * ss(HIT, HIT + 2, t), short: 'the girl sees it' }),
    stars({ fade: (t) => 1 - ss(HIT, HIT + 1, t) }), residue,
    FX.comet({ from: [.05, .08], to: ROOT, t0: t1 + .3, t1: HIT, lane: 'violet', bend: -.25 }),
    bloom, sung(21), sung(22));
  // "Every life I've lived, I have become": close-up, the text nearly solid; the riser (233.16-236.64) closes it up into the switch
  const t3 = ws(23, 0) - .1, SW = B(137) - 2 * BEAT;
  shot(t3, SW, F('A1', t3, SW, { density: (t) => lerp(.86, .97, ss(t3, SW, t)), hold: (t) => (t < 233.16 ? 2 : 1), gain: ramp(233.16, SW, 1.15, 1.5) }), sung(23));
}

// ---- Outro A 236.64-257.51 (bars 137-148): THE SWITCH -- the text fuses into real, unprocessed footage of her (H1) ----------------------
// From two beats before bar 137 the cells close up from her face outward until, on the bar line, every cell shows the raw frame (TextPass
// samples it with no colour transform). Held through both "Back to main"s; from 255.9 the text re-forms from the edges in, her face last.
// The same function applies to Jade's H1 unchanged (it only reads the slot's frame).
{
  const SW = B(137) - 2 * BEAT, IN = B(137), OUT0 = 255.9, OUT1 = B(149), FACE = [.5, .42];
  const dist = (c, r, g) => Math.hypot((c + .5) / g.cols - FACE[0], ((r + .5) / g.rows - FACE[1]) * g.H / g.W);
  const MAXD = Math.hypot(.5, .58 * 9 / 16) + .02;
  // per cell: raw or text, never a blend (a ragged front of whole cells, jittered per cell, so it fuses cell by cell)
  const raw = (t, c, r, g) => {
    const d = dist(c, r, g) / MAXD + .07 * hash(c, r, 137);
    if (t < IN) return d < ss(SW, IN, t) * 1.08 ? 1 : 0;               // raw spreads from the face out
    if (t < OUT0) return 1;
    return d < (1 - ss(OUT0, OUT1 - .1, t)) * 1.08 ? 1 : 0;            // text returns from the edges in, the face last
  };
  shot(SW, OUT1, F('H1', SW, OUT1, { density: (t) => (t < IN ? lerp(.97, 1, ss(SW, IN, t)) : lerp(1, .6, ss(OUT0, OUT1, t))), hold: 1, raw, gain: 1.25, key: 'luma',
    short: 'THE SWITCH: H1 shown unprocessed (the only raw image). Until Jade films H1 the stand-in is a GENERATED take, raw here only to show the transition', fade: () => 1 }));
}

// ---- Outro B 257.51-264.47 (bars 149-152): git log --graph of every life, merged; violet cherry-picked last ------------------------------
shot(B(149), B(153), gitGraph(T));

// ---- Outro C 264.47-end: the end card ---------------------------------------------------------------------------------------------------
shot(B(153), END, endCard(T));

export const shots = S;
if (new URLSearchParams(location.search).has('dumpedl')) console.log('[edl] ' + JSON.stringify(S.map((x) => ({ t0: +x.t0.toFixed(3), t1: +x.t1.toFixed(3),
  slots: x.layers.filter((l) => l.source).map((l) => l.source.id) }))));
