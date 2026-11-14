#!/usr/bin/env python3
# Regenerate fable/take2/src/proofscene.js from fable/proof/src/proof.js (run from fable/take2/src: cd fable/take2/src && python3 ../tools/port_proof.py)
src=open('../../proof/src/proof.js').read().split('\n')
head = src[:7]
imports = ["import { clamp01, lerp, seg, ease } from './timing.js';",
           "import { LIVES, byId, hashOf, MAIN, PLATE_IDS } from '../../proof/lives.js';"]
assert src[7].startswith('import') and src[8].startswith('import')
body = src[20:445]
assert body[0].startswith('const BG'), body[0]
render = src[445:453]
assert render[0].startswith('let LOCK') and render[-1] == '}'
pre = '''// MERGE take two: the proof edit (bars 28-43) as a module the film calls for that range.
// A mechanical port of fable/proof/src/proof.js (which is unchanged and still renders on its own; regenerate this file with
// fable/take2/tools/port_proof.py if the proof changes): the file body is wrapped in makeProof(g, opts) so it draws on the film's
// canvas with the film's size, timing and plate folder. Drawing code is identical except: no page/query handling, no window.PROOF,
// fonts are loaded by the film, and opts.fixStrip restores three assignments that a comment swallowed in the proof's buildTimeline
// (proof.js line 93): without them the strip lyrics "And every branch remembers" and "Where I started from" get NaN alpha and are
// never drawn in the proof. With fixStrip off, frames equal the proof's (checked by pixel diff, see notes/compositor.md).
//   const P = await makeProof(g, { W, H, FPS, T, plates, twos, fixStrip }); P.t0 (bar 28), P.tEnd (bar 43); await P.render(t)
'''
out = [pre] + head + imports + ['', 'export async function makeProof(g, o) {',
 'const W = o.W, H = o.H, FPS = o.FPS;',
 'const S = H / 1080, HF = 0.5 / FPS;',
 'const TWOS = !!o.twos;',
 "const PLATES = o.plates || '/work_fable/proof/plates';",
 ''] + body + render
txt = '\n'.join(out)
old = "  TL.L4.out = Math.min(outOf(TL.L4, TL.L5), TL.L4.words[TL.L4.words.length - 1].end + 0.3);   // short hold so it is gone before the next cut TL.L5.out = outOf(TL.L5, TL.L6); TL.L6.out = outOf(TL.L6, null); TL.L7.out = TL.tEnd;"
assert old in txt
txt = txt.replace(old, old + "\n  if (o.fixStrip) { TL.L5.out = outOf(TL.L5, TL.L6); TL.L6.out = outOf(TL.L6, null); TL.L7.out = TL.tEnd; }   // take two: the proof's lost line")
# ---- take-two changes (Step 2), each behind an option so proofbug=1 (all off) still gives the proof's own frames
def patch(a, b):
    global txt
    assert txt.count(a) == 1, a[:70]; txt = txt.replace(a, b)
# plate folders per id (o.dirs: the black-paper hero lives in work_fable/take2/plates/hero_paper)
patch("const url = (id, i) => `${PLATES}/${id}/frames/f_${String(i + 1).padStart(4, '0')}.jpg`;",
      "const pdir = (id) => (o.dirs && o.dirs[id]) || `${PLATES}/${id}`;   // take two: o.dirs overrides a plate's folder\nconst url = (id, i) => `${pdir(id)}/frames/f_${String(i + 1).padStart(4, '0')}.jpg`;")
# hero: nearest frame when it is not slowed (o.heroBlend false), as every take-two plate
patch("rect: full, zoom: (1 + 0.04 * seg(t, TL.t41, TL.tEnd)) * punch, blend: true }); sc.phase = 'E'; return sc; }",
      "rect: full, zoom: (o.hero ? o.hero.zoom : 1) * (1 + 0.04 * seg(t, TL.t41, TL.tEnd)) * punch, fx: o.hero ? o.hero.fx : 0.5, fy: o.hero ? o.hero.fy : 0.5, blend: o.heroBlend !== false }); sc.phase = 'E'; return sc; }")
# the hero's slab rows and the written lane's gap where her legs cross it (o.hero = { zoom, fx, fy, rows, gap: [x0, x1] })
patch("const SLAB_ROWS = [[0], [1, 2], [3, 4]], SLAB_X = 100 * S, SLAB_TRACK = -0.01;",
      "const SLAB_ROWS = (o.hero && o.hero.rows) || [[0], [1, 2], [3, 4]], SLAB_X = 100 * S, SLAB_TRACK = -0.01;   // take two: o.hero.rows")
patch("  g.save(); g.beginPath(); g.rect(0, 0, gapL, H); g.rect(gapR, 0, W - gapR, H); g.clip();",
      "  g.save(); g.beginPath(); if (o.hero && o.hero.gap) { const a = o.hero.gap[0] * W, b = o.hero.gap[1] * W; g.rect(0, 0, gapL, H); g.rect(gapR, 0, a - gapR, H); g.rect(b, 0, W - b, H); }   // take two: her legs pass in front of the lane\n  else { g.rect(0, 0, gapL, H); g.rect(gapR, 0, W - gapR, H); } g.clip();")
# bar 38: each panel's last frame trails behind it as it shrinks into its node (fills the empty top half); o.trail
patch("""  for (const C of GS.cells) if (C.sigma > 0.004 && C.rect.w > 1) { const fo = META[C.L.id].focus || [0.5, 0.5];""",
"""  if (o.trail && on(t, TL.t38)) for (const C of GS.cells) {   // take two: afterimages of the panel's last frame, from its place toward its node
    const m = C.m, c0 = CELL[C.i]; if (!on(t, TL.col[m.col]) || C.sigma > 0.98) continue;
    const cLast = gridClip(C.i, TL.shrunk[m.col]), fade = 1 - ease.io(seg(t, TL.shrunk[m.col], TL.t39 + 0.3)), fo = META[C.L.id].focus || [0.5, 0.5];
    for (let k = 0; k < 5; k++) { const sg = 1 - k * 0.19; if (C.sigma > sg - 0.03) continue;
      const wr = { x: m.n.x + (c0.x - m.n.x) * sg, y: m.n.y + (c0.y - m.n.y) * sg, w: c0.w * sg, h: c0.h * sg };
      const a = toScr(GS.cam, { x: wr.x, y: wr.y }), b = toScr(GS.cam, { x: wr.x + wr.w, y: wr.y + wr.h });
      P.push({ id: C.L.id, c: cLast, rect: { x: a.x, y: a.y, w: b.x - a.x, h: b.y - a.y }, alpha: fade * (0.55 - 0.08 * k), ghost: C.L.color, fx: fo[0], fy: fo[1] }); } }
  for (const C of GS.cells) if (C.sigma > 0.004 && C.rect.w > 1) { const fo = META[C.L.id].focus || [0.5, 0.5];""")
patch("""    else if (P.cell) { g.save(); g.beginPath(); g.rect(P.rect.x, P.rect.y, P.rect.w, P.rect.h); g.clip(); drawPlate(P); g.restore(); }""",
"""    else if (P.cell) { g.save(); g.beginPath(); g.rect(P.rect.x, P.rect.y, P.rect.w, P.rect.h); g.clip(); drawPlate(P); g.restore(); }
    else if (P.ghost) { g.save(); g.beginPath(); g.rect(P.rect.x, P.rect.y, P.rect.w, P.rect.h); g.clip(); drawPlate(P);   // take two: bar 38 afterimage, tinted
      g.globalAlpha = P.alpha; g.fillStyle = hexA(P.ghost, 0.22); g.fillRect(P.rect.x, P.rect.y, P.rect.w, P.rect.h); g.strokeStyle = hexA(P.ghost, 0.8); g.lineWidth = 2 * S; g.strokeRect(P.rect.x + S, P.rect.y + S, P.rect.w - 2 * S, P.rect.h - 2 * S); g.restore(); }""")
# the ten lives: the lane line is written (o.writtenLanes = { drawWrittenLane, laneString } from src/lanes.js); the colour wipe is kept
patch("""  line(0, YM, W, YM, prev, 6 * S);
  line(Math.max(0, nx - r), YM, Math.min(W, nx + r), YM, L.color, 6 * S, false);""",
"""  if (o.writtenLanes) { const WL = o.writtenLanes, pts = [{ x: 0, y: YM }, { x: W, y: YM }], a = Math.max(0, nx - r), b = Math.min(W, nx + r), sc = (t - s.t0) * 7;   // take two
    if (s.i > 0 && (a > 0 || b < W)) line(0, YM, W, YM, prev, 4 * S);
    WL.drawWrittenLane(g, pts, { text: WL.laneString([L.msg], true), color: L.color, cap: 24 * S, scroll: sc, from: a, upto: b, under: 0.45 }); }
  else {
  line(0, YM, W, YM, prev, 6 * S);
  line(Math.max(0, nx - r), YM, Math.min(W, nx + r), YM, L.color, 6 * S, false); }""")
txt += '''

// ---------------------------------------------------------------- init (from the proof's boot(), minus fonts, page and harness)
for (const [face, wt] of [['mono', 600], ['mono', 500], ['serif'], ['slab']]) { setFont(face === 'mono' ? FACE.mono(100, wt) : FACE[face](100)); CAP[face + (wt || '')] = g.measureText('H').actualBoundingBoxAscent / 100; }
T = o.T;
for (const id of PLATE_IDS) { const r = await fetch(`${pdir(id)}/meta.json`); if (!r.ok) throw new Error(`plate ${id}: no meta.json in ${pdir(id)}`); META[id] = await r.json(); const b = await bitmap(id, 0); DIM[id] = { w: b.width, h: b.height }; }
buildTimeline(); TL.c0.sandstorm = clipA(TL.shots[9], TL.grid);
{ const c = cam(TL.t39); XROOT = ZAX + (NX - ZAX) / c.s; }
buildGrain(); SLAB = slabLayout();
const sizes = {};
const meas = (k, f) => { setFont(f); sizes[k] = { font: f.font, capPx: +g.measureText('H').actualBoundingBoxAscent.toFixed(1) }; };
meas('proof_chyron_branch', FACE.mono(pxFor('mono', SZ.chyron * S, 600), 600)); meas('proof_chyron_commit', FACE.mono(pxFor('mono', SZ.commit * S, 500), 500));
meas('proof_cell_label', FACE.mono(SZ.cellLabelPx * S, 600));
meas('proof_lyric_upperleft', FACE.serif(pxFor('serif', SZ.lyricUL * S))); meas('proof_lyric_strip', FACE.serif(pxFor('serif', SZ.lyricStrip * S))); meas('proof_slab', SLAB.f);
return { render, t0: TL.t0, tEnd: TL.tEnd, TL, sizes, meta: META };
}
'''
open('proofscene.js','w').write(txt)
