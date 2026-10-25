// A plate reconstructed as the light lattice.
// world = tokens over dim underpaint ('dawn') or luminous painted splats ('paint'); figure = LED emitters.
// shot: { plate, s0, look?, cellFig?, cellWorld?, fid?(u,t)->density 1/64..1 for the figure, worldFid?(u,t),
//         cam?(u,t)->{orbit,dolly,pan,over}, lane?, laneAmt?, copies?: [{dt, off:[x,y], scale, lane, at, dens}],
//         scatter?(u,t)->{k, dir:[x,y,z]}, text?(type,t,u), update?(scene,u,t), fade?(u,t) }
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
  },
  // the drop: the world becomes painted light (normalized splats), the figure stays LED
  paint: {
    world: { cell: 4, shape: [0, 0, 0, 1], sizeMin: 2.3, sizeMax: 2.6, aniso: 1.4, gain: .78, sat: 1.22, paint: true },
    fig: { cell: 2.5, shape: [0, 1, 0, 0], sizeMin: .7, sizeMax: .95, gain: 1.55, gamma: .72 },
  },
};

// looks with atlas: 2 use the structural glyph atlas (built once per page, cached on ctx)
export function atlasFor(ctx, look) {
  if (look.atlas !== 2) return ctx.atlas;
  return ctx.atlas2 || (ctx.atlas2 = glyphAtlas2(ctx.atlas.text || DEFAULT_TEXT));
}
const withGain = (L) => { L.g0 = L.u.uGain.value; return L; };

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
    if (look.under) this.world.push(mk(look.under, 0));
    const ws = [].concat(look.world), wScale = shot.cellWorld ? shot.cellWorld / ws[Math.floor(ws.length / 2)].cell : 1;
    ws.forEach((o, k) => this.world.push(mk(o, 0, this.seq, { cell: o.cell * wScale, k })));
    this.fig = mk(look.fig, 1, this.seq, shot.cellFig ? { cell: shot.cellFig } : {});
    this.figTexts = look.figText && shot.written ? [].concat(look.figText).map((o, k) => mk(o, 1, this.seq, { k })) : [];
    this.figText = this.figTexts[0] || null;
    for (const f of [this.fig, ...this.figTexts]) if (f && shot.lane) { f.set('uTint', shot.lane); f.set('uTintAmt', shot.laneAmt ?? .1); }
    // fork copies: each its own plate clock (dt) so they move independently
    this.copies = [];
    for (const c of shot.copies || []) {
      const seq = c.dt ? await PlateSeq.open(shot.plate) : this.seq;
      const L = mk(look.fig, 1, seq, shot.cellFig ? { cell: shot.cellFig } : {});
      if (c.lane) { L.set('uTint', c.lane); L.set('uTintAmt', c.laneAmt ?? .22); }
      this.copies.push({ c, seq, L });
    }
  }
  async render(t, u) {
    const { ctx, shot } = this;
    const s0 = shot.s0 ?? shot.t0;
    await this.seq.at(t, s0);
    for (const { c, seq } of this.copies) if (seq !== this.seq) await seq.at(t + c.dt, s0);
    const cam = shot.cam ? shot.cam(u, t) : {};
    const mvp = this.view.frame(this.seq.aspect, cam);
    const fid = shot.fid ? shot.fid(u, t) : 1;
    const layers = [...this.world];
    if (this.figText) {
      // fid < 1: the written (ASCII) figure carries her, the LED emitters arrive as she merges
      const k = Math.max(0, Math.min(1, (fid - .55) / .4)), led = k * k * (3 - 2 * k);
      this.fig.set('uDensity', 1); this.fig.set('uGain', this.fig.g0 * led);
      for (const f of this.figTexts) f.set('uGain', f.g0 * (1 - led));
      if (led > .001) layers.push(this.fig);
      if (led < .999) layers.push(...this.figTexts);
    } else { this.fig.set('uDensity', fid); layers.push(this.fig); }
    if (shot.worldFid) for (const w of this.world) w.set('uDensity', shot.worldFid(u, t));
    for (const { c, L } of this.copies) {
      const k = c.at === undefined ? 1 : Math.max(0, Math.min(1, (t - c.at) / (c.dur ?? .6)));
      if (k <= 0) continue;
      const e = 1 - Math.pow(1 - k, 3);
      const off = typeof c.off === 'function' ? c.off(t, k) : [c.off[0] * e, c.off[1] * e];
      L.set('uOffset', off); L.u.uOffset.value.set(off[0], off[1]);
      L.set('uScale', 1 + ((c.scale ?? 1) - 1) * e);
      L.set('uDensity', (c.dens ?? fid) * (c.share ? (k < 1 ? .5 + .5 * k * k : 1) : 1));
      layers.push(L);
    }
    if (shot.scatter) { const sc = shot.scatter(u, t); for (const l of [this.fig, ...this.figTexts, ...this.copies.map((x) => x.L)]) { l.set('uScatter', sc.k); l.u.uScatterDir.value.set(...sc.dir); } }
    if (shot.update) shot.update(this, u, t);
    this.view.render(layers, mvp, t);
    let typeTex = null;
    if (shot.text) { ctx.type.begin(); shot.text(ctx.type, t, u); ctx.type.end(); typeTex = ctx.type.tex; }
    ctx.post.resolve.uniforms.uFade.value = shot.fade ? shot.fade(u, t) : 1;
    ctx.post.render(this.view.light, t, typeTex, this.view.paintTex);
  }
  dispose() { for (const l of [...this.world, this.fig, ...this.figTexts, ...this.copies.map((c) => c.L)]) { l.mesh.geometry.dispose(); l.mesh.material.dispose(); } this.view.acc.dispose(); this.view.accP.dispose(); }
}
