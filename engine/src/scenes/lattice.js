// A plate reconstructed as the light lattice.
// world = tokens over dim underpaint ('dawn') or luminous painted splats ('paint'); figure = LED emitters, or (looks with figGlyph,
// the default since Jade's 2026-10-24 call) the figure is BUILT from fine overlapping glyphs too; ?figlook=led restores the emitters.
// shot: { plate, s0, look?, cellFig?, cellWorld?, fid?(u,t)->density 1/64..1 for the figure, worldFid?(u,t),
//         cam?(u,t)->{orbit,dolly,pan,over}, lane?, laneAmt?, copies?: [{dt, off:[x,y], scale, lane, at, dens, plate?, gain?}] (plate: another
//         plate on the shot's own clock, e.g. one performer's matte of the same footage, tools/prep/lanes.py; gain: x the layers' gain),
//         figOff?: true = don't draw the main plate's figure (its world only; the copies carry the figures),
//         bg?: {plate, s0, fit?} = the world (region 0) from another plate (the empty set behind a solo plate, ?drop=sync), so the solo
//         plate's figure hole never shows; a copy's dt may be a function of song time (a canon ripple that eases in after a unison hit),
//         scatter?(u,t)->{k, dir:[x,y,z]}, text?(type,t,u), update?(scene,u,t), fade?(u,t), clip?(u,t)->clip time in s (overrides s0 for the
//         main plate: slow motion / time remap), fit?: true | {from?, to?} (the main plate never runs off its take: from `from` (default t0)
//         it slows just enough that the last frame lands on `to` (default t1); src/clip.js),
//         screens?: [{plate, s0?, off:[x,y], scale, at?, dur?, gain?}] — other plates drawn small in the frame as glowing glyph screens }
import * as THREE from 'three';
import { LatticeLayer, LatticeView, glyphAtlas2, DEFAULT_TEXT } from '../lattice.js';
import { PlateSeq } from '../plateseq.js';

export const LOOKS = {
  dawn: {
    under: { cell: 10, shape: [0, 0, 0, 1], sizeMin: 2.4, sizeMax: 2.4, gain: .2, sat: 1.4 },
    world: { cell: 13, shape: [0, 0, 1, 0], sizeMin: .45, sizeMax: 1.0, gain: 1.0, gamma: 1.5, floor: .08, sat: 1.6 },
    fig: { cell: 3, shape: [0, 1, 0, 0], sizeMin: .72, sizeMax: .96, gain: 1.95, gamma: .78 },
  },
  // the world as coloured ASCII (a brightness ramp of characters; the lyrics take over the highlights)
  ascii: {
    under: { cell: 10, shape: [0, 0, 0, 1], sizeMin: 2.4, sizeMax: 2.4, gain: .1, sat: 1.3 },
    world: { cell: 11, shape: [0, 0, 1, 0], sizeMin: 1, sizeMax: 1, gain: 1.15, gamma: .9, floor: .35, sat: 1.5, ramp: true, norm: .65, words: .6 },
    fig: { cell: 3, shape: [0, 1, 0, 0], sizeMin: .72, sizeMax: .96, gain: 1.95, gamma: .78 },
    // an unmerged branch is still written: her figure as ASCII, crossfading to LED as fidelity rises
    figText: { cell: 6, shape: [0, 0, 1, 0], sizeMin: 1, sizeMax: 1, gain: 4.4, gamma: .7, floor: .45, sat: 1.2, ramp: true, norm: .2, words: 2 },
  },
  // the world BUILT from characters (after the ASCII-MMORPG reference): three overlapping glyph lattices at 17/11/7 px,
  // each drawn only partially (coverage follows light + local detail), glyphs chosen by structure: edge-oriented
  // strokes along contours, sparse punctuation in shadow, heavy glyphs in solid light, the lyric in the highlights.
  ascii2: {
    atlas: 2,
    under: { cell: 10, shape: [0, 0, 0, 1], sizeMin: 2.4, sizeMax: 2.4, gain: .08, sat: 1.3 },
    world: [
      { cell: 17, shape: [0, 0, 1, 0], build: true, sizeMin: 1.0, sizeMax: 1.45, gain: .5, gamma: .9, floor: .18, sat: 1.5, norm: .6, words: 2, crisp: 1,
        cov: [-.15, .9, .45, .75], edgeK: [.08, .3], jit: [.5, .14, .18], tierBias: .5, edgeRot: .6, flick: .12, clust: [7, .6, 10] },
      { cell: 11, shape: [0, 0, 1, 0], build: true, sizeMin: 1.0, sizeMax: 1.25, gain: .85, gamma: .9, floor: .2, sat: 1.5, norm: .6, words: .6, crisp: 1,
        cov: [0, 1.7, .8, .35], edgeK: [.07, .26], jit: [.35, .1, .12], tierBias: 0, edgeRot: .6, flick: .15, clust: [12, .45, 14] },
      { cell: 7, shape: [0, 0, 1, 0], build: true, sizeMin: 1.0, sizeMax: 1.2, gain: .55, gamma: .9, floor: .2, sat: 1.5, norm: .6, words: 2, crisp: 1,
        cov: [-.1, .15, 1.0, .5], edgeK: [.06, .2], jit: [.3, .1, .1], tierBias: -.5, edgeRot: .6, flick: .2, clust: [18, .3, 20] },
    ],
    fig: { cell: 3, shape: [0, 1, 0, 0], sizeMin: .72, sizeMax: .96, gain: 1.95, gamma: .78 },
    figText: [
      { cell: 6, shape: [0, 0, 1, 0], build: true, sizeMin: 1.0, sizeMax: 1.15, gain: 3.0, gamma: .7, floor: .4, sat: 1.2, norm: .2, words: 2, crisp: .7,
        cov: [1, 0, 0], edgeK: [.08, .28], jit: [.32, .07, .1], tierBias: .6, edgeRot: .6, flick: .15, clust: [20, 0, 26] },
      { cell: 4.5, shape: [0, 0, 1, 0], build: true, sizeMin: 1.0, sizeMax: 1.15, gain: .8, gamma: .7, floor: .3, sat: 1.2, norm: .2, words: 2, crisp: .7,
        cov: [-.2, 0, 1.2], edgeK: [.06, .2], jit: [.2, .06, .08], tierBias: 0, edgeRot: .6, flick: .2, clust: [30, .3, 30] },
      { cell: 11, shape: [0, 0, 1, 0], build: true, sizeMin: 1.0, sizeMax: 1.4, gain: .8, gamma: .7, floor: .25, sat: 1.2, norm: .2, words: 2, crisp: 1,
        cov: [-.35, .55, .2], edgeK: [.08, .3], jit: [.45, .12, .15], tierBias: .6, edgeRot: .6, flick: .12, clust: [10, .6, 12] },
    ],
    // the merged figure in glyphs (Jade 2026-10-24: no cross-hatched LED grid on figures): finer than figText so faces stay readable,
    // dense in light, edge strokes along her contours; the written (unmerged) figText is coarser and sparser, so merging still reads.
    figGlyph: [
      // soft overlapping underpaint of her (no grid: splats ~2.3 cells wide) so the face reads as one continuous image
      { cell: 3, shape: [0, 0, 0, 1], sizeMin: 2.3, sizeMax: 2.3, gain: .34, gamma: .82, sat: 1.1 },
      { cell: 5, shape: [0, 0, 1, 0], build: true, sizeMin: 1.0, sizeMax: 1.15, gain: 2.3, gamma: .74, floor: .3, sat: 1.15, norm: .2, words: 2, crisp: .9,
        cov: [1.1, 0, .2], edgeK: [.07, .24], jit: [.25, .06, .08], tierBias: .4, edgeRot: .6, flick: .08, clust: [30, 0, 30] },
      { cell: 7.5, shape: [0, 0, 1, 0], build: true, sizeMin: 1.0, sizeMax: 1.2, gain: 1.05, gamma: .74, floor: .25, sat: 1.15, norm: .2, words: 2, crisp: 1,
        cov: [-.1, .2, 1.0], edgeK: [.06, .2], jit: [.3, .08, .1], tierBias: 0, edgeRot: .6, flick: .12, clust: [24, .3, 26] },
      { cell: 11, shape: [0, 0, 1, 0], build: true, sizeMin: 1.0, sizeMax: 1.35, gain: .65, gamma: .74, floor: .25, sat: 1.15, norm: .2, words: 2, crisp: 1,
        cov: [-.35, .5, .2], edgeK: [.08, .3], jit: [.4, .1, .14], tierBias: .6, edgeRot: .6, flick: .1, clust: [12, .6, 14] },
    ],
  },
  // the drop: the world becomes painted light (normalized splats), the figure stays LED
  paint: {
    world: { cell: 4, shape: [0, 0, 0, 1], sizeMin: 2.3, sizeMax: 2.6, aniso: 1.4, gain: .78, sat: 1.22, paint: true },
    fig: { cell: 2.5, shape: [0, 1, 0, 0], sizeMin: .7, sizeMax: .95, gain: 1.55, gamma: .72 },
  },
};

// the drop's painted world keeps its splats; its figures are glyph-built too (atlas 2 only affects glyph layers)
LOOKS.paint.atlas = 2; LOOKS.paint.figGlyph = LOOKS.ascii2.figGlyph;

// looks with atlas: 2 use the structural glyph atlas (built once per page, cached on ctx)
export function atlasFor(ctx, look) {
  if (look.atlas !== 2) return ctx.atlas;
  return ctx.atlas2 || (ctx.atlas2 = glyphAtlas2(ctx.atlas.text || DEFAULT_TEXT));
}
export const withGain = (L) => { L.g0 = L.u.uGain.value; return L; };
// a screen = soft underpaint + two glyph tiers (the whole plate, region 2), so a small inset still reads as a picture
const SCREEN = [
  { cell: 2.5, shape: [0, 0, 0, 1], sizeMin: 2.3, sizeMax: 2.3, gain: .32, gamma: .85, sat: 1.15 },
  { cell: 4, shape: [0, 0, 1, 0], build: true, sizeMin: 1.0, sizeMax: 1.15, gain: 1.6, gamma: .8, floor: .2, sat: 1.2, norm: .3, words: 2, crisp: .9,
    cov: [1.0, .2, .3], edgeK: [.07, .24], jit: [.2, .05, .07], tierBias: .3, edgeRot: .6, flick: .1, clust: [30, 0, 30] },
  { cell: 7, shape: [0, 0, 1, 0], build: true, sizeMin: 1.0, sizeMax: 1.25, gain: .6, gamma: .8, floor: .2, sat: 1.2, norm: .3, words: 2, crisp: 1,
    cov: [-.2, .5, .6], edgeK: [.08, .3], jit: [.35, .1, .12], tierBias: .5, edgeRot: .6, flick: .12, clust: [14, .5, 16] },
];
// several glyph layers acting as one figure layer: set() fans out (uGain is a multiplier on each layer's own g0), u.<name>.value.set() too
export class FigGroup {
  constructor(ls) { this.ls = ls; this.g0 = 1;
    this.u = new Proxy({}, { get: (_, k) => ({ value: { set: (...a) => ls.forEach((l) => l.u[k].value.set(...a)) } }) }); }
  set(k, v) { for (const l of this.ls) l.set(k, k === 'uGain' ? l.g0 * v : v); }
}
export const flat = (L) => (L instanceof FigGroup ? L.ls : [L]);

export default class LatticeScene {
  constructor(ctx, shot) { this.ctx = ctx; this.shot = shot; }
  async setup() {
    const { ctx, shot } = this;
    this.seq = await PlateSeq.open(shot.plate);
    this.view = new LatticeView(ctx.renderer, ctx.W, ctx.H);
    const lookName = shot.look || ctx.P.get('look') || 'ascii2';
    const look = LOOKS[lookName]; this.look = look;
    const atlas = atlasFor(ctx, look);
    const mk = (o, region, seq = this.seq, extra = {}) => withGain(new LatticeLayer({ plate: seq, cell: extra.cell ?? o.cell, W: ctx.W, region, atlas,
      opts: { ...o, ...extra, seed: 7 + region + (extra.k || 0) * 31, text: shot.tokens } }));
    this.world = [];
    this.bgSeq = shot.bg ? await PlateSeq.open(shot.bg.plate) : this.seq;
    if (look.under) this.world.push(mk(look.under, 0, this.bgSeq));
    const ws = [].concat(look.world), wScale = shot.cellWorld ? shot.cellWorld / ws[Math.floor(ws.length / 2)].cell : 1;
    ws.forEach((o, k) => this.world.push(mk(o, 0, this.bgSeq, { cell: o.cell * wScale, k })));
    const glyphFig = look.figGlyph && ctx.P.get('figlook') !== 'led' && !shot.ledFig;
    const mkFig = (seq) => (glyphFig ? new FigGroup(look.figGlyph.map((o, k) => withGain(mk(o, 1, seq, { k: 10 + k, cell: o.cell * (shot.cellFig ? shot.cellFig / 3 : 1) }))))
      : mk(look.fig, 1, seq, shot.cellFig ? { cell: shot.cellFig } : {}));
    this.fig = mkFig(this.seq);
    this.figTexts = look.figText && shot.written ? [].concat(look.figText).map((o, k) => mk(o, 1, this.seq, { k })) : [];
    this.figText = this.figTexts[0] || null;
    // screens: another plate (e.g. a clip of her earlier films) built small into the frame from the same glyphs
    this.screens = [];
    for (const sc of shot.screens || []) {
      const seq = await PlateSeq.open(sc.plate);
      const ls = SCREEN.map((o, k) => mk(o, 2, seq, { k: 20 + k + this.screens.length * 3, depthAmt: 0 }));   // flat: a screen, not a scene
      for (const l of ls) { l.set('uScale', sc.scale); l.u.uOffset.value.set(sc.off[0], sc.off[1]); }
      this.screens.push({ sc, seq, ls });
    }
    for (const f of [this.fig, ...this.figTexts]) if (f && shot.lane) { f.set('uTint', shot.lane); f.set('uTintAmt', shot.laneAmt ?? .1); }
    // fork copies: each its own plate clock (dt) so they move independently
    this.copies = [];
    for (const c of shot.copies || []) {
      const seq = c.plate ? await PlateSeq.open(c.plate) : c.dt ? await PlateSeq.open(shot.plate) : this.seq;
      const L = mkFig(seq);
      if (c.lane) { L.set('uTint', c.lane); L.set('uTintAmt', c.laneAmt ?? .22); }
      if (c.gain) L.set('uGain', L instanceof FigGroup ? c.gain : L.g0 * c.gain);
      this.copies.push({ c, seq, L });
    }
  }
  async render(t, u) {
    const { ctx, shot } = this;
    const s0 = shot.s0 ?? shot.t0;
    const clk = shot.clip && ((x) => shot.clip((x - shot.t0) / (shot.t1 - shot.t0), x)), fit = shot.fit && { from: shot.t0, to: shot.t1, ...(shot.fit === true ? {} : shot.fit) };
    if (clk) await this.seq.clock(clk, t);   // (u, t) as main.js passes them; slowed: frame blend
    else await this.seq.at(t, s0, fit);
    for (const { c, seq } of this.copies) if (seq !== this.seq) {
      if (c.plate) await (clk ? seq.clock(clk, t) : seq.at(t + (c.dt || 0), s0, fit));   // its own plate on the shot's clock
      else await seq.at(t + (typeof c.dt === 'function' ? c.dt(t) : c.dt), s0); }
    if (shot.bg) await this.bgSeq.at(t, shot.bg.s0, shot.bg.fit);
    for (const { sc, seq } of this.screens) await seq.at(t, sc.s0 ?? s0);
    const cam = shot.cam ? shot.cam(u, t) : {};
    const mvp = this.view.frame(this.seq.aspect, cam);
    const fid = shot.fid ? shot.fid(u, t) : 1;
    const layers = [...this.world];
    if (this.figText) {
      // fid < 1: the written (ASCII) figure carries her, the LED emitters arrive as she merges
      const k = Math.max(0, Math.min(1, (fid - .55) / .4)), led = k * k * (3 - 2 * k);
      this.fig.set('uDensity', 1); this.fig.set('uGain', this.fig.g0 * led);
      for (const f of this.figTexts) f.set('uGain', f.g0 * (1 - led));
      if (led > .001) layers.push(...flat(this.fig));
      if (led < .999) layers.push(...this.figTexts);
    } else { this.fig.set('uDensity', fid); if (!shot.figOff) layers.push(...flat(this.fig)); }
    if (shot.worldFid) for (const w of this.world) w.set('uDensity', shot.worldFid(u, t));
    for (const { c, L } of this.copies) {
      const k = c.at === undefined ? 1 : Math.max(0, Math.min(1, (t - c.at) / (c.dur ?? .6)));
      if (k <= 0) continue;
      const e = 1 - Math.pow(1 - k, 3);
      const off = typeof c.off === 'function' ? c.off(t, k) : [c.off[0] * e, c.off[1] * e];
      L.set('uOffset', off); L.u.uOffset.value.set(off[0], off[1]);
      L.set('uScale', 1 + ((c.scale ?? 1) - 1) * e);
      L.set('uDensity', (c.dens ?? fid) * (c.share ? (k < 1 ? .5 + .5 * k * k : 1) : 1));
      layers.push(...flat(L));
    }
    for (const { sc, ls } of this.screens) {
      const k = sc.at === undefined ? 1 : Math.max(0, Math.min(1, (t - sc.at) / (sc.dur ?? .25)));
      if (k <= 0) continue;
      for (const l of ls) { l.set('uGain', l.g0 * k * (sc.gain ?? 1)); layers.push(l); }
    }
    if (shot.scatter) { const sc = shot.scatter(u, t); for (const l of [this.fig, ...this.figTexts, ...this.copies.map((x) => x.L)]) { l.set('uScatter', sc.k); l.u.uScatterDir.value.set(...sc.dir); } }
    if (shot.update) shot.update(this, u, t);
    this.view.render(layers, mvp, t);
    let typeTex = null;
    if (shot.text) { ctx.type.begin(); shot.text(ctx.type, t, u); ctx.type.end(); typeTex = ctx.type.tex; }
    ctx.post.resolve.uniforms.uFade.value = shot.fade ? shot.fade(u, t) : 1;
    ctx.post.render(this.view.light, t, typeTex, this.view.paintTex);
  }
  dispose() { for (const l of [...this.world, ...flat(this.fig), ...this.figTexts, ...this.copies.flatMap((c) => flat(c.L)), ...this.screens.flatMap((s) => s.ls)]) { l.mesh.geometry.dispose(); l.mesh.material.dispose(); } this.view.acc.dispose(); this.view.accP.dispose(); }
}
