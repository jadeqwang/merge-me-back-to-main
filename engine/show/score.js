// Engraved music notation drawn in light: the outro orchestra's score (engine/show/main.js FX.score, Jade 2026-10-26: "make sure the musical
// notation correctly corresponds to the music for which ever instrument is being transcribed, and that the notation is being read left to
// right the way you normally expect"). The notes are engine/show/score_orch.json, a transcription of bars 137-144 measured on the song
// (docs/orchestra_transcription.md; tools/orch_tx/build_score.py writes it). Glyph outlines: engine/fonts/bravura_glyphs.json (Bravura, SMuFL,
// SIL OFL 1.1; tools/orch_tx/make_glyphs.py).
//
// What a view draws (all of it engraved from the JSON, nothing decorative):
// - five-line staves with the clef (treble; the guitar's treble clef with an 8 below), the key signature (two sharps) and 4/4, labelled left;
// - bar lines and bar numbers on the real bars, noteheads on their line or space, ledger lines, stems by voice / by position, beams per beat
//   (16th secondary beams and partial beams), flags, dots, ties, rests, grace notes, accidentals (none are needed here: every pitch is in the
//   key), chord symbols over the keys, the lead's lyrics under the voice;
// - time runs left to right at a constant scale (proportional spacing, px16 pixels per 16th). A cursor (the playhead) moves left to right
//   with the music; once it reaches `park` of the staff's width the staff scrolls so it stays there;
// - the composer's pencil writes every glyph `lead` seconds before it sounds (a violet ink flash at the write head, and when her pencil tip is
//   in frame the glyph flies from the tip into its place on the staff); when a note sounds it lights in its player's lane colour and a
//   copy flies from the staff to the player (view.to[part]), where a ring bursts and the player glows (env()).
export const B0 = 137;
const WARM = '#FFF1DC';
const rgba = (h, a) => `rgba(${[1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16)).join(',')},${a})`;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };

// ---------------------------------------------------------------------------------------------------------------- data
export function prep(json, font) {
  const bars = {}; for (const [k, v] of Object.entries(json.bars)) bars[+k] = v;
  const bk = Object.keys(bars).map(Number).sort((a, b) => a - b), bLo = bk[0], bHi = bk[bk.length - 1];
  const p = (t) => {   // song time -> 16ths since the downbeat of bar 137 (linear inside each bar, like the engine's bb())
    let b = bLo; while (b < bHi && t >= bars[b].end) b++;
    const r = bars[b]; return 16 * (b - B0) + 16 * (t - r.start) / (r.end - r.start);
  };
  const tOf = (q) => { const b = clamp(B0 + Math.floor(q / 16), bLo, bHi), r = bars[b]; return r.start + (r.end - r.start) * (q - 16 * (b - B0)) / 16; };
  const parts = {};
  for (const part of json.parts) {
    const items = [], beams = {}, sound = [];
    for (const L of part.layers) {
      const li = L.items.filter((it) => it.bar >= B0).map((it) => ({ ...it, layer: L.id, q: 16 * (it.bar - B0) + it.pos }));
      li.forEach((it, i) => {
        if (it.kind === 'note' && (it.tie === 'start' || it.tie === 'continue')) { it.next = li.slice(i + 1).find((x) => x.kind === 'note' && x.midi === it.midi); if (it.next) it.next.prev = it; }
        if (it.beam) (beams[`${L.id}:${it.beam}`] ||= []).push(it);
      });
      // sounding notes (a tie chain is one sound): onset, end, pitch
      for (const it of li) if (it.kind === 'note' && it.sounds) { let e = it; while (e.next) e = e.next; sound.push({ it, t: it.t, t1: e.t_end, midi: it.midi }); }
      items.push(...li);
    }
    for (const g of Object.values(beams)) g.sort((a, b) => a.q - b.q);
    parts[part.id] = { ...part, items: items.sort((a, b) => a.q - b.q), beams: Object.values(beams), sound: sound.sort((a, b) => a.t - b.t) };
  }
  const glyphs = {};
  const P2 = typeof Path2D !== 'undefined' ? (d) => new Path2D(d) : () => null;   // node (tools/edl_check.mjs): no Path2D, the math still runs
  for (const [k, v] of Object.entries(font.glyphs)) glyphs[k] = { ...v, path: P2(v.d) };
  return { json, bars, p, tOf, parts, glyphs, ups: font.unitsPerSpace || 250 };
}

// how strongly a part is playing at t (0..~1.5): a flash on every onset plus a hold while long notes sound; drives the players' light
export function env(SC, part, t, { flash = .22, hold = .35 } = {}) {
  const P = SC.parts[part]; if (!P) return 0; let a = 0;
  for (const s of P.sound) {
    if (s.t > t + .05) break;
    if (t >= s.t) a += Math.exp(-(t - s.t) / flash) + (t < s.t1 && s.t1 - s.t > .6 ? hold : 0);
    else a += ss(s.t - .05, s.t, t) * .6;
  }
  return Math.min(1.5, a);
}

// ---------------------------------------------------------------------------------------------------------------- drawing
// view: { staves: [{ part, y }], x0, x1, gap, px16, from (16ths since bar 137 at the left of the note area), park = .62, lead = .55,
//         k (alpha), tip: [x, y] | (t) => [x, y], to: { part: [x, y] | (note) => [x, y] }, fly: { part: t } (no flights before t),
//         open: t (the staves unroll), merge: (t) => 0..1 (the five lines fold into one orange line), colors: { part: '#rrggbb' },
//         ink: '#rrggbb', glowR, lyrics = true, chords = true }
export function draw(g, t, V, SC, env0 = {}) {
  const gap = V.gap, k = V.k ?? 1, mg = V.merge ? V.merge(t) : 0, lead = V.lead ?? .55, ink = V.ink || '#A57BFF';
  const sp = gap / SC.ups;                                         // font units -> px
  const hdr = 8.6 * gap, nx0 = V.x0 + hdr, nx1 = V.x1 - .6 * gap, px16 = V.px16, span = (nx1 - nx0) / px16;
  const pc = SC.p(t), ws = V.static ? V.from : Math.max(V.from, pc - (V.park ?? .62) * span);
  const X = (q) => nx0 + .9 * gap + (q - ws) * px16;               // notehead centre of 16th position q
  const open = V.open == null ? 1 : ss(V.open, V.open + .45, t);
  const edge = (x) => clamp((x - nx0 - .2 * gap) / (1.6 * gap)) * clamp((nx1 - x) / (1.2 * gap));
  const col = (part) => (V.colors && V.colors[part]) || WARM;
  const tipAt = typeof V.tip === 'function' ? V.tip(t) : V.tip;
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
  const glyph = (name, x, y, a, c, scale = 1) => {
    const G = SC.glyphs[name]; if (!G || a <= .003) return;
    g.save(); g.globalAlpha = a; g.fillStyle = c; g.shadowColor = c; g.shadowBlur = .28 * gap; g.translate(x, y); g.scale(sp * scale, -sp * scale);
    if (G.path) g.fill(G.path); g.restore();
  };
  const line = (x0, y0, x1, y1, w, a, c) => { if (a <= .003) return; g.globalAlpha = a; g.strokeStyle = c; g.shadowColor = c; g.shadowBlur = .25 * gap; g.lineWidth = w; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); };
  const rect = (x0, y0, x1, y1, a, c) => { if (a <= .003) return; g.globalAlpha = a; g.fillStyle = c; g.shadowColor = c; g.shadowBlur = .25 * gap; g.fillRect(x0, Math.min(y0, y1), x1 - x0, Math.abs(y1 - y0)); };
  const text = (s, x, y, size, font, a, c, align = 'left') => { if (a <= .003) return; g.globalAlpha = a; g.fillStyle = c; g.shadowColor = c; g.shadowBlur = .2 * gap; g.font = `${size}px ${font}`; g.textAlign = align; g.textBaseline = 'alphabetic'; g.fillText(s, x, y); };
  // when is a glyph written / sounded: written `lead` s before its onset; with the pencil tip in frame it first flies from the tip (inkFly)
  const inkFly = tipAt ? .3 : 0;
  const wrote = V.static ? () => 1 : (tt) => clamp((t - (tt - lead) - inkFly) / .08);   // static: the whole score, engraved (reference check)
  const inkA = V.static ? () => 0 : (tt) => { const d = t - (tt - lead) - inkFly; return d >= 0 ? Math.exp(-d / .16) : 0; };
  const sys = V.staves.map((s) => s.y), yTop = Math.min(...sys), yBot = Math.max(...sys) + 4 * gap;
  const writeHead = X(SC.p(t + lead));
  // ---------------------------------------------------------------- each staff
  for (const S of V.staves) {
    const P = SC.parts[S.part]; if (!P) continue;
    const y0 = S.y, Y = (st) => y0 + (8 - st) * gap / 2, c = col(S.part), A = k * (1 - mg);
    // staff lines (unroll from the left on `open`; fold into one orange line on merge)
    const ax1 = V.x0 + (V.x1 - V.x0) * open;
    for (let i = 0; i < 5; i++) {
      const yy = y0 + i * gap + (y0 + 2 * gap - y0 - i * gap) * ss(0, .7, mg), cc = mg > .35 ? '#FF7A1A' : WARM;
      const ext = mg * 2400;
      line(Math.max(V.mergeL ?? -1e9, V.x0 - ext), yy, ax1 + ext, yy, Math.max(1, .1 * gap) + 5 * mg, k * (i === 2 ? 1 : 1 - mg) * (.55 + .45 * mg), cc);
    }
    if (A <= .01) continue;
    // label (left of the staff), clef, key signature, time signature
    const lab = { voice: ['Voice', 'violin doubles it'], keys: ['Synth keys', 'piano plays it'], guitar: ['E. Guitar', 'doubles the bass synth'] }[S.part] || [P.short, ''];
    if (V.labelPos === 'above') {   // no room on the left: the name over the clef, what it doubles after it
      const ly = y0 - (S.part === 'voice' ? 5.4 : 3.2) * gap;   // over the voice's A5 stems
      text(lab[0], V.x0, ly, 1.55 * gap, 'ISI', A * open * .95, c); g.font = `${1.55 * gap}px ISI`;
      text(lab[1], V.x0 + g.measureText(lab[0]).width + .8 * gap, ly, .85 * gap, 'JBM', A * open * .7, c);
    } else {
      text(lab[0], V.x0 - .7 * gap, y0 + 2.1 * gap, 1.55 * gap, 'ISI', A * open * .95, c, 'right');
      text(lab[1], V.x0 - .7 * gap, y0 + 3.5 * gap, .85 * gap, 'JBM', A * open * .7, c, 'right');
    }
    const hA = A * open * .95;
    glyph(P.clef === 'treble_8vb' ? 'gClef8vb' : 'gClef', V.x0 + .5 * gap, Y(2), hA, WARM);
    for (const [i, st] of [8, 5].entries()) glyph('accidentalSharp', V.x0 + (3.25 + i * 1.1) * gap, Y(st), hA, WARM);   // F#, C# (two sharps)
    glyph('timeSig4', V.x0 + 6.0 * gap, Y(6), hA, WARM); glyph('timeSig4', V.x0 + 6.0 * gap, Y(2), hA, WARM);
    // bar lines + bar numbers (written as the write head passes them)
    for (let b = B0; b <= B0 + 8; b++) {
      const q = 16 * (b - B0), tt = SC.tOf(q), downGrace = P.items.some((it) => it.q === q && it.grace);
      const x = X(q) - (downGrace ? 2.5 : 1.15) * gap, a = A * edge(x) * wrote(tt);
      if (a <= .01) continue;
      line(x, y0, x, y0 + 4 * gap, Math.max(1.2, .16 * gap), a * (1 + 1.2 * inkA(tt)), WARM);
      text(String(b), x - .2 * gap, y0 - 1.3 * gap, .8 * gap, 'JBM', a * .75, WARM, 'right');   // bar number over the bar line's left
    }
    // chord symbols (keys) and lyrics (voice)
    if (P.chords && V.chords !== false) for (const ch of P.chords) {
      const q = 16 * (ch.bar - B0) + ch.pos, x = X(q) - .5 * gap, a = A * edge(x) * wrote(ch.t);
      const [root, ext] = ch.symbol === 'Gadd9' ? ['G', 'add9'] : ch.symbol === 'Bm7' ? ['Bm', '7'] : [ch.symbol, ''];
      text(root, x, y0 - 2.2 * gap, 1.5 * gap, 'ISR', a, WARM); g.font = `${1.5 * gap}px ISR`;
      text(ext, x + g.measureText(root).width + .1 * gap, y0 - 2.8 * gap, .95 * gap, 'ISR', a, WARM);
    }
    // ---- notes and rests
    const its = P.items.filter((it) => { const x = X(it.q); return x > nx0 - 3 * gap && x < nx1 + 3 * gap; });
    const stemOf = (it) => (it.stem === 'up' ? 1 : -1);
    const nhW = 1.18 * gap;
    const headX = (it) => X(it.q) - nhW / 2;
    const lit = (it) => (!V.static && it.kind === 'note' && t >= it.t ? (t < it.t_end ? 1 : Math.exp(-(t - it.t_end) / .25)) : 0);   // sounding now
    const colOf = (it, a) => { const l = lit(it); return l > .05 ? c : WARM; };
    const stemEnd = {};   // stem tip y per note (for beams / flags)
    const tieSide = (it, su) => (it.poly ? (it.stem === 'up' ? -1 : 1) : (su > 0 ? 1 : -1));   // +1 = below the notehead
    for (const it of its) {
      const x = X(it.q), a0 = A * edge(x) * wrote(it.t); if (a0 <= .01) continue;
      const fl = inkA(it.t), on = lit(it), cc = on > .05 ? c : WARM, a = Math.min(1, a0 * (.82 + .5 * on + .6 * fl));
      if (fl > .02) { g.save(); g.globalAlpha = A * fl * .55; g.fillStyle = ink; g.shadowColor = ink; g.shadowBlur = gap; g.beginPath(); g.arc(x, it.kind === 'note' ? Y(it.step) : Y(4), .7 * gap, 0, 7); g.fill(); g.restore(); }
      if (it.kind === 'rest') {
        const off = it.poly ? (it.stem === 'up' ? 4 : it.stem === 'down' ? -4 : 0) : 0;   // two voices in this bar: rests move up / down
        const R = { whole: ['restWhole', 6], half: ['restHalf', 4], quarter: ['restQuarter', 4], eighth: ['rest8th', 4], '16th': ['rest16th', 4] }[it.value];
        let rx = x - .55 * gap;
        if (it.value === 'whole' && it.dur16 === 16) rx = X(it.q + 7.5) - .56 * gap;   // a whole-bar rest sits in the middle of the bar
        glyph(R[0], rx, Y(R[1] + off), a * .9, WARM);
        continue;
      }
      const hx = headX(it), yh = Y(it.step), su = stemOf(it);
      // ledger lines
      for (let st = -2; st >= it.step; st -= 2) line(hx - .35 * gap, Y(st), hx + nhW + .35 * gap, Y(st), Math.max(1, .13 * gap), a * .85, WARM);
      for (let st = 10; st <= it.step; st += 2) line(hx - .35 * gap, Y(st), hx + nhW + .35 * gap, Y(st), Math.max(1, .13 * gap), a * .85, WARM);
      // accidental
      if (it.accidental) glyph({ sharp: 'accidentalSharp', flat: 'accidentalFlat', natural: 'accidentalNatural' }[it.accidental], hx - 1.3 * gap, yh, a, cc);
      // grace note (an on-beat scoop): a small slashed 8th just left of the note, on its own line/space
      if (it.grace) {
        const gs = .62, gst = it.step - ({ C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }[it.pitch[0]] - { C: 0, D: 1, E: 2, F: 3, G: 4, A: 5, B: 6 }[it.grace[0]]);
        const gx = hx - 1.55 * gap, gy = Y(gst), sx = su > 0 ? gx + 1.18 * gap * gs : gx, sy = gy - su * 2.6 * gap;
        glyph('noteheadBlack', gx, gy, a, cc, gs);
        line(sx, gy - su * .15 * gap, sx, sy, Math.max(1, .1 * gap), a, cc);
        glyph(su > 0 ? 'flag8thUp' : 'flag8thDown', sx - .05 * gap, sy, a, cc, gs);
        line(sx - .55 * gap, sy + su * 1.3 * gap, sx + .65 * gap, sy + su * .55 * gap, Math.max(1, .09 * gap), a, cc);   // the slash
        for (let st = -2; st >= gst; st -= 2) line(gx - .2 * gap, Y(st), gx + .9 * gap, Y(st), Math.max(1, .1 * gap), a * .8, WARM);
        for (let st = 10; st <= gst; st += 2) line(gx - .2 * gap, Y(st), gx + .9 * gap, Y(st), Math.max(1, .1 * gap), a * .8, WARM);
      }
      // notehead
      glyph(it.value === 'whole' ? 'noteheadWhole' : it.value === 'half' ? 'noteheadHalf' : 'noteheadBlack', it.value === 'whole' ? hx - .2 * gap : hx, yh, a, cc);
      // augmentation dot: in the space (a note on a line puts its dot in the space above)
      if (it.dots) glyph('augmentationDot', hx + nhW + .4 * gap, Y(it.step % 2 === 0 ? it.step + 1 : it.step), a, cc);
      // stem (not for whole notes): 3.5 spaces, reaching at least the middle line
      if (it.value !== 'whole') {
        const sx = su > 0 ? hx + nhW - .06 * gap : hx + .06 * gap;
        let end = yh - su * 3.5 * gap; if (su > 0) end = Math.min(end, Y(4)); else end = Math.max(end, Y(4));
        stemEnd[it.q + it.layer] = { sx, end, y: yh, su, it, a, cc };
        if (!it.beam) {
          line(sx, yh - su * .17 * gap, sx, end, Math.max(1, .11 * gap), a, cc);
          if (it.value === 'eighth' || it.value === '16th') glyph(`flag${it.value === '16th' ? '16th' : '8th'}${su > 0 ? 'Up' : 'Down'}`, sx - .05 * gap, end, a, cc);
        }
      }
      // a tie coming in from a note already scrolled out on the left (or before this view): an arc from the start of the staff
      if (it.prev && headX(it.prev) + nhW < nx0 + .5 * gap) {
        const side = tieSide(it, su), ty = yh + side * .5 * gap, xb = hx + .28 * nhW, xa = Math.max(nx0 + .2 * gap, xb - 2.4 * gap);
        if (xb - xa > .6 * gap) { const h = Math.min(.8 * gap, .16 * (xb - xa) + .25 * gap);
          g.globalAlpha = a; g.strokeStyle = cc; g.shadowColor = cc; g.shadowBlur = .25 * gap; g.lineWidth = Math.max(1.2, .16 * gap);
          g.beginPath(); g.moveTo(xa, ty + side * .6 * h); g.bezierCurveTo(xa + .4 * (xb - xa), ty + side * h, xb - .25 * (xb - xa), ty + side * h, xb, ty); g.stroke(); }
      }
      // tie to the next note of the chain (drawn once that note is written): an arc between the two noteheads, on the side away from the stem
      // (in a two-voice bar: voice 1 above, voice 2 below); with no next note in the score (bar 144 -> 145) a short hanging tie
      if (it.tie === 'start' || it.tie === 'continue') {
        const side = tieSide(it, su), ty = yh + side * .5 * gap, xa = hx + .72 * nhW;
        const xb = it.next ? Math.min(headX(it.next) + .28 * nhW, nx1 + 2 * gap) : xa + 1.8 * gap, a1 = it.next ? a * wrote(it.next.t) : a;
        if (xb > xa + .3 * gap && a1 > .01) { const h = Math.min(.8 * gap, .16 * (xb - xa) + .25 * gap);
          g.globalAlpha = a1; g.strokeStyle = cc; g.shadowColor = cc; g.shadowBlur = .25 * gap; g.lineWidth = Math.max(1.2, .16 * gap);
          g.beginPath(); g.moveTo(xa, ty); g.bezierCurveTo(xa + .25 * (xb - xa), ty + side * h, xb - .25 * (xb - xa), ty + side * h, xb, ty); g.stroke(); }
      }
    }
    // beams: one straight beam per group at the furthest stem tip; 16th secondary beams between 16ths, partial beams on lone 16ths
    for (const grp of P.beams) {
      const m = grp.map((it) => stemEnd[it.q + it.layer]).filter(Boolean); if (m.length < 2) continue;
      const su = m[0].su, yb = su > 0 ? Math.min(...m.map((s) => s.end)) : Math.max(...m.map((s) => s.end)), bw = .5 * gap, a = Math.min(...m.map((s) => s.a)), cc = m.some((s) => s.cc !== WARM) ? c : WARM;
      for (const s of m) line(s.sx, s.y - su * .17 * gap, s.sx, yb, Math.max(1, .11 * gap), s.a, s.cc);
      rect(m[0].sx - .05 * gap, yb, m[m.length - 1].sx + .05 * gap, yb + su * bw, a, cc);
      const y2 = yb + su * .75 * gap;
      for (let i = 0; i < m.length; i++) {
        if (m[i].it.value !== '16th') continue;
        const nxt = m[i + 1], prv = m[i - 1];
        if (nxt && nxt.it.value === '16th') rect(m[i].sx - .05 * gap, y2, nxt.sx + .05 * gap, y2 + su * bw, a, cc);
        else if (!(prv && prv.it.value === '16th')) {   // a lone 16th: partial beam toward the dotted note it shares the beat with
          const dir = nxt && !prv ? 1 : -1;
          rect(Math.min(m[i].sx, m[i].sx + dir * 1.1 * gap), y2, Math.max(m[i].sx, m[i].sx + dir * 1.1 * gap), y2 + su * bw, a, cc);
        }
      }
    }
    // lyrics (the lead's syllables) under the voice staff
    if (V.lyrics ?? V.staves.length === 1) for (const it of its) if (it.lyric) {   // the lead's syllables (single-staff views)
      const x = X(it.q), a = A * edge(x) * wrote(it.t) * .85;
      text(it.lyric, x, y0 + (it.poly || its.some((o) => o.poly && Math.abs(o.q - it.q) < 16) ? 10.4 : 7.6) * gap, 1.25 * gap, 'ISI', a, WARM, 'center');
    }
  }
  // ---------------------------------------------------------------- cursor (playhead) across the system, write head, pencil
  if (k * (1 - mg) > .01 && !V.static) {
    const xc = X(pc), a = k * (1 - mg) * open * edge(xc + gap);
    g.save(); const gr = g.createLinearGradient(xc - 1.4 * gap, 0, xc + 1.4 * gap, 0); gr.addColorStop(0, rgba('#FFC46B', 0)); gr.addColorStop(.5, rgba('#FFC46B', .22 * a)); gr.addColorStop(1, rgba('#FFC46B', 0));
    g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(xc - 1.4 * gap, yTop - 2.2 * gap, 2.8 * gap, yBot - yTop + 4.4 * gap); g.restore();
    line(xc, yTop - 2 * gap, xc, yBot + 2 * gap, Math.max(1.5, .14 * gap), a * .9, '#FFE2B0');
    const wa = k * (1 - mg) * open * edge(writeHead) * .9;
    g.save(); g.globalAlpha = wa; g.fillStyle = '#E9DDFF'; g.shadowColor = ink; g.shadowBlur = 1.4 * gap;
    for (const y of sys) { g.beginPath(); g.arc(writeHead, y + 2 * gap, .32 * gap, 0, 7); g.fill(); }
    g.restore();
    if (tipAt) {
      const ty = sys[Math.floor(sys.length / 2)] + 2 * gap;
      line(tipAt[0], tipAt[1], writeHead, ty, 1.6, k * (1 - mg) * .35, ink);
      g.save(); g.globalAlpha = k * (1 - mg); g.fillStyle = '#F3ECFF'; g.shadowColor = ink; g.shadowBlur = 22; g.beginPath(); g.arc(tipAt[0], tipAt[1], 5, 0, 7); g.fill(); g.restore();
    }
  }
  // ---------------------------------------------------------------- flights: pencil -> staff (as written), staff -> player (as it sounds)
  const comet = (x0, y0, x1, y1, u, c, r0 = 8, lift = 140) => {
    const mx = (x0 + x1) / 2, my = Math.min(y0, y1) - lift;
    g.fillStyle = c; g.shadowColor = c; g.shadowBlur = 18;
    for (let j = 0; j < 8; j++) { const w = Math.max(0, u - j * .04), r = 1 - w;
      g.globalAlpha = k * (1 - j / 8) * (1 - mg); g.beginPath(); g.arc(r * r * x0 + 2 * r * w * mx + w * w * x1, r * r * y0 + 2 * r * w * my + w * w * y1, r0 * (1 - j / 11), 0, 7); g.fill(); }
  };
  for (const S of V.staves) {
    if (V.static) break;
    const P = SC.parts[S.part]; if (!P) continue; const c = col(S.part), y0 = S.y, Y = (st) => y0 + (8 - st) * gap / 2;
    if (tipAt) for (const it of P.items) {   // the pencil writes: each glyph flies from the tip into its place
      const d = t - (it.t - lead); if (d < 0 || d > inkFly) continue;
      const x = X(it.q); if (x < nx0 || x > nx1) continue;
      comet(tipAt[0], tipAt[1], x, it.kind === 'note' ? Y(it.step) : Y(4), ss(0, inkFly, d), ink, 6, 40);
    }
    const tg = V.to && V.to[S.part]; if (!tg || mg > .5) continue;
    for (const s of P.sound) {
      if (V.fly && V.fly[S.part] != null && s.t < V.fly[S.part]) continue;
      const d = t - s.t; if (d < 0 || d > .85) continue;
      const q = typeof tg === 'function' ? tg(s.it) : tg, x = X(s.it.q), y = Y(s.it.step), FL = .26;
      if (x < nx0 - gap || x > nx1 + gap) continue;
      if (d < FL) comet(x, y, q[0], q[1], ss(0, FL, d), c, 7, 120);
      else { const w = (d - FL) / .6; if (w < 1) { g.globalAlpha = k * (1 - w) * .85 * (1 - mg); g.strokeStyle = c; g.shadowColor = c; g.shadowBlur = 16; g.lineWidth = 5 * (1 - w) + 1; g.beginPath(); g.arc(q[0], q[1], 16 + 110 * Math.sqrt(w), 0, 7); g.stroke(); } }
    }
    // the player glows in her lane colour while her part plays
    const q0 = typeof tg === 'function' ? tg(P.sound.find((s) => s.t <= t) || P.sound[0]) : tg;
    const late = V.fly && V.fly[S.part] != null && t < V.fly[S.part];   // the player only lights once she plays the part
    const amp = late ? 0 : (env0[S.part] ? env0[S.part](t) : env(SC, S.part, t)) * k * (1 - mg), R = V.glowR ?? 150;
    if (amp > .01 && q0) { const gr = g.createRadialGradient(q0[0], q0[1], 0, q0[0], q0[1], R); gr.addColorStop(0, rgba(c, .16 * Math.min(1.5, amp))); gr.addColorStop(1, rgba(c, 0));
      g.globalAlpha = 1; g.fillStyle = gr; g.fillRect(q0[0] - R, q0[1] - R, 2 * R, 2 * R); }
  }
  g.restore();
}
