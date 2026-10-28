// v6 git graphics, all typed in characters from the LIFE table (engine/show/life_v6.js):
//   buildLog   the Build (125.34-153.17, bars 73-88): `git log --graph` racing on the beat, a pane opening per kick, everything drawing inward
//              on the riser (bar 86 on) into one point on the drop
//   gitGraph   Outro B (257.51-264.47, bars 149-152): `git log --graph --all` of every life, revealed a life per beat on the arp, all merged,
//              violet cherry-picked last, the lanes sliding home into main on the riser
//   endCard    Outro C (264.47-): MERGE, Jade Q Wang · Rare Earth, credits as commits, fade
import { bigType, hash } from '../textlook.js';
import { LIFE, VIOLET, mergeHash } from '/engine/show/life_v6.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };

// one log row: spans [[text, lane, b]], written left to right
function rowsForLife([, br, ln, msg, h]) {
  return [
    [['*   ', 'orange', 1], [mergeHash(br), 'gold', .9], [` Merge branch '${br}' into main`, 'white', .8]],
    [['|\\', 'orange', 1, [0, 0, 1]]],
    [['| ', 'orange', 1], ['* ', ln, 1], [h, 'gold', .9], [' (', 'white', .6], [br, ln, 1], [') ', 'white', .6], [msg, 'white', .95]],
    [['|/', 'orange', 1, [0, 0, 1]]],
  ].map((spans) => spans.map(([s, l, b, lanes]) => ({ s, l, b, lanes })));
}
// row spans -> cells; laneFix: the '\' and '/' of a fork are the branch's colour
function putRow(put, c0, r, spans, branchLane, n = Infinity) {
  let c = c0, k = 0;
  for (const sp of spans) for (let i = 0; i < sp.s.length; i++, c++, k++) {
    if (k >= n) return; const ch = sp.s[i]; if (ch === ' ') continue;
    const ln = sp.lanes && sp.lanes[i] ? branchLane : sp.l; put(c, r, ch, ln, sp.b);
  }
}
const rowLen = (spans) => spans.reduce((a, s) => a + s.s.length, 0);

// ---- Build ------------------------------------------------------------------------------------------------------------------------------
// T = engine/src/time.js. Rows printed per beat double every 4 bars (2, 4, 8, 16), 32 on the riser; a pane per kick (bars 73-85).
export function buildLog(T, o = {}) {
  const B = T.bar, t0 = B(73), tR = B(86), tD = B(89);
  const LOG = []; for (let k = 0; k < 40; k++) for (const lf of [...LIFE].reverse()) for (const r of rowsForLife(lf)) LOG.push({ spans: r, lane: lf[2], life: lf });
  const perBeat = (bar) => (bar < 77 ? 2 : bar < 81 ? 4 : bar < 85 ? 8 : bar < 86 ? 16 : 32);
  const beatsUpTo = (t) => { const out = []; for (let b = 73; b <= 88; b++) for (let j = 0; j < 4; j++) { const x = T.bb(b, j); if (x <= t) out.push([b, j, x]); } return out; };
  // `git log` fills the page at once on the slam (60 rows), then races
  const head = (t) => (t >= t0 ? 60 : 0) + beatsUpTo(t).reduce((a, [b]) => a + perBeat(b), 0) + (t >= tR ? Math.floor((t - tR) / (T.beatLen(86) / 4)) * 8 : 0);
  // zoom (cells shrink, content tiles outward) from the riser; collapse into the centre in the last beat
  const zoom = (t) => 1 - .82 * Math.pow(ss(tR, tD - .05, t), 1.6);
  const collapse = (t) => 1 - ss(T.bb(88, 2.5), tD - .02, t);
  const BASE = 15;   // 1920-reference cell px for the log at full size
  return {
    cell: (t) => BASE * zoom(t), hold: (t) => (t < B(81) ? 2 : 1), on: o.on, fade: o.fade,
    draw(g, k) {
      const t = k.t, z = zoom(t), q = collapse(t);
      // the virtual page is the grid at zoom 1 (VC x VR cells); at zoom z the screen holds 1/z pages, tiled around the centre page
      const VC = Math.ceil(g.W / (BASE * g.W / 1920)), VR = Math.ceil(g.H / Math.round(BASE * g.W / 1920 * 1.6));
      const cx = g.cols / 2, cy = g.rows / 2, sx = 1, tiles = Math.ceil(.5 / z + .5);   // one virtual cell = one (shrunk) screen cell
      const glow = 1 + .5 * ss(tR, tD, t);
      const put = (vc, vr, ch, ln, b, tx = 0, ty = 0) => {
        const c = cx + ((vc + tx * VC) - VC / 2) * sx * q, r = cy + ((vr + ty * VR) - VR / 2) * sx * q;
        g.put(Math.floor(c), Math.floor(r), ch, ln, clamp(b * glow), { max: true });
      };
      const hd = head(t), logRows = VR - 3, top = 2;
      for (let ty = -tiles; ty <= tiles; ty++) for (let tx = -tiles; tx <= tiles; tx++) {
        const centre = !tx && !ty, off = centre ? 0 : Math.floor(hash(tx + 9, ty + 9, 4) * 300), dim = centre ? 1 : .55;
        if (centre) { const n = Math.floor(clamp((t - t0) / .35) * 30); putRow((c, r, ch, l, b) => put(c, r, ch, l, b), 2, 0, [{ s: '$ git log --graph --all', l: 'white', b: .9 }], 'white', n); }
        for (let i = 0; i < logRows; i++) {
          const idx = hd + off - logRows + i; if (idx < 0) continue;
          const row = LOG[idx % LOG.length], fresh = idx >= hd - perBeat(Math.min(88, Math.floor(T.barAt(t)))) ? 1 : .55;
          putRow((c, r, ch, l, b) => put(c, r, ch, l, b * fresh * dim * .8, tx, ty), 2, top + i, row.spans, row.lane);
        }
      }
      // panes: one opens on every kick (each beat, bars 73-85), showing the commit that just printed; bigger on the downbeats
      if (t < tR) for (const [bar, j, tb] of beatsUpTo(t).slice(-2)) {
        const age = (t - tb) / T.beatLen(bar); if (age > 1.6) continue;
        const lf = LIFE[(bar * 4 + j) % LIFE.length], big = j === 0, w = big ? 54 : 40, h = big ? 7 : 6;
        const px = Math.floor(hash(bar, j, 1) * (VC - w - 6)) + 3, py = Math.floor(hash(bar, j, 2) * (VR - h - 6)) + 3;
        const open = clamp(age / .12), shut = 1 - ss(1.3, 1.6, age), hh = Math.max(1, Math.round(h * open * shut));
        const r0 = py + Math.floor((h - hh) / 2), r1 = r0 + hh, b = 1;
        for (let r = r0; r <= r1; r++) for (let c = px; c <= px + w; c++) {   // clear the pane (black cells hide the log under it)
          const cc = cx + (c - VC / 2) * sx * q, rr = cy + (r - VR / 2) * sx * q; const ci = Math.floor(cc), ri = Math.floor(rr);
          if (ci >= 0 && ri >= 0 && ci < g.cols && ri < g.rows) g.data.fill(0, (ri * g.cols + ci) * 4, (ri * g.cols + ci) * 4 + 4);
        }
        const P = (c, r, ch) => put(c, r, ch, lf[2], b);
        for (let c = px + 1; c < px + w; c++) { P(c, r0, '─'); P(c, r1, '─'); }
        for (let r = r0 + 1; r < r1; r++) { P(px, r, '│'); P(px + w, r, '│'); }
        P(px, r0, '┌'); P(px + w, r0, '┐'); P(px, r1, '└'); P(px + w, r1, '┘');
        if (hh >= h - 1) {
          const L = [[`commit ${lf[4]}`, 'gold'], [`Author: Jade Q Wang`, 'white'], [`Branch: ${lf[1]}`, lf[2]], ['', 'white'], [`    ${lf[3]}`, 'white']];
          L.slice(0, h - 1).forEach(([s, l], i) => { const n = Math.floor(clamp((age - .12) / .3) * 60); for (let x = 0; x < Math.min(n, s.length, w - 3); x++) if (s[x] !== ' ') put(px + 2 + x, r0 + 1 + i, s[x], l, .95); });
        }
      }
      // the drop point: everything has gone into one bright mark
      if (q < .25) g.put(Math.floor(cx), Math.floor(cy), '@', 'orange', 1);
    },
  };
}

// ---- Outro B: the graph of every life ---------------------------------------------------------------------------------------------------
export function gitGraph(T, o = {}) {
  const B = T.bar, t0 = o.t0 ?? B(149), beat = T.beatLen(149);
  // newest at the top: the cherry-picked violet commit, then each life's merge (newest life first), the first commit at the bottom
  const rows = [];
  rows.push({ spans: [{ s: '* ', l: 'violet', b: 1 }, { s: mergeHash('cherry-pick ' + VIOLET[4]), l: 'gold', b: .9 }, { s: ' (', l: 'white', b: .6 }, { s: 'HEAD -> main', l: 'orange', b: 1 },
    { s: ') ', l: 'white', b: .6 }, { s: VIOLET[3], l: 'violet', b: 1 }, { s: `  (cherry picked from commit ${VIOLET[4]})`, l: 'violet', b: .6 }], lane: 'violet', at: T.bb(152, 0), cherry: true });
  LIFE.slice().reverse().forEach((lf, i) => { const at = t0 + (LIFE.length - 1 - i) * beat; rowsForLife(lf).forEach((r) => rows.push({ spans: r, lane: lf[2], at, life: lf })); });
  rows.push({ spans: [{ s: '* ', l: 'orange', b: 1 }, { s: '0a11ce5', l: 'gold', b: .9 }, { s: ' first frost on the window', l: 'white', b: .9 }], lane: 'orange', at: t0 - .02 });
  const home = (t) => ss(T.bb(152, 1), T.bb(152, 3.6), t);   // the branch columns slide into main's
  return {
    density: o.density ?? .64, hold: 2, on: o.on, fade: o.fade,
    draw(g, k) {
      const t = k.t, H = rows.length, top = Math.max(2, Math.floor((g.rows - H) / 2)), w = Math.max(...rows.map((r) => rowLen(r.spans)));
      const c0 = Math.max(2, Math.floor((g.cols - Math.min(w, g.cols - 4)) / 2)), m = home(t);
      g.text(c0, top - 2, '$ git log --graph --all', 'white', .85, { n: Math.floor(clamp((t - t0 + .3) / .5) * 30) });
      rows.forEach((row, i) => {
        if (t < row.at) return;
        const typed = Math.floor(clamp((t - row.at) / .25) * 90), age = t - row.at, flash = Math.exp(-age / .2);
        // merging home: a branch row's graph part (the "| " gutter) closes up, so its '*' moves into main's column
        const shift = row.life ? Math.round(m * 2) : 0;
        putRow((c, r, ch, l, b) => { if (row.life && c - c0 < 2 && shift && ch === '|') return; g.put(c - (c - c0 >= 2 ? shift : 0), r, ch, l, clamp(b * (.85 + .4 * flash) * (row.life ? 1 - .35 * m : 1))); },
          c0, top + i, row.spans, row.lane, typed);
      });
    },
  };
}

// ---- Outro C: end card ------------------------------------------------------------------------------------------------------------------
export const CREDITS = [   // credits as commits (wording is Jade's open question; docs/treatment_v6.md)
  ['words', 'Jade Q Wang & Claude', 'orange'],
  ['music', 'Suno v6 Pro · Suno v6 Wild', 'rose'],
  ['direction', 'Jade Q Wang', 'sky'],
  ['performance', 'Jade Q Wang, filmed on a phone', 'mint'],
  ['the drop', 'her 2004 collegiate group set (bronze)', 'gold'],
  ['drawn in text by', 'Claude', 'violet'],
  ['engine', 'three.js', 'white'],
];
export function endCard(T, o = {}) {
  const t0 = o.t0 ?? T.bar(153), t1 = o.t1 ?? T.songEnd();
  const fadeOut = (t) => 1 - ss(t1 - 2.2, t1 - .2, t);
  return [
    { density: .78, hold: 3, fade: fadeOut, draw(g, k) {   // the title, made of its own letters
      const kick = Math.exp(-Math.max(0, k.t - t0) / .15);
      bigType(g, 'MERGE', { size: 300 * g.W / 1920, y: g.H * .36, lane: 'orange', df: k.df, scale: 1 + .07 * kick, fill: .55 + .45 * clamp((k.t - t0) / .2) });
    } },
    { density: .6, hold: 1, fade: fadeOut, draw(g, k) {
      const t = k.t, c = Math.floor(g.cols / 2), r0 = Math.floor(g.rows * .55);
      g.text(c, r0, 'Jade Q Wang · Rare Earth', 'white', .95, { align: 'center', n: (t - t0 - .9) * 30 });
      const c0 = t0 + 4.2, lines = CREDITS.map(([role, who, ln], i) => [mergeHash(role + who), `${role}: ${who}`, ln, i]);
      const w = Math.max(...lines.map((l) => l[1].length)) + 10, x = c - Math.floor(w / 2);
      for (const [h, s, ln, i] of lines) {
        const at = c0 + i * .55; if (t < at) continue; const n = (t - at) * 45, r = r0 + 3 + i;
        g.put(x, r, '*', ln, 1); g.text(x + 2, r, h, 'gold', .8, { n }); g.text(x + 10, r, s, 'white', .85, { n: n - 7 });
        if (i === 0) g.text(x + 10 + s.length + 1, r, '(HEAD -> main)', 'orange', .7, { n: n - 7 - s.length });
      }
    } },
  ];
}
