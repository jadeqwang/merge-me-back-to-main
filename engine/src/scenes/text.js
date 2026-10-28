// v6 text scene: the whole frame is drawn from TextGrid layers (engine/src/textlook.js), back to front, on black.
// shot: { layers: [{ density: d | (t, u) -> d (0 sparse .. 1 near-solid), or cell: px | (t, u) -> px (1920-reference cell width), hold: h | (t) -> h (drawing frames per glyph refresh),
//                     on?: (t) -> bool, fade?: (t) -> 0..1, knock?: bool (written cells hide the layers under them), setup?: async (ctx) -> void,
//                     draw: async (grid, k) -> void | { raw: { src, rect } } }] }
// k = { t, u, tq, df, W, H, ctx }: tq/df are the drawing clock (content time quantised to the refresh, boil seed). A layer returns { raw } only
// for the switch (TextPass shows the raw source in cells whose raw byte is set).
import { TextGrid, TextPass, drawClock } from '../textlook.js';

const val = (v, ...a) => (typeof v === 'function' ? v(...a) : v);

export default class TextScene {
  constructor(ctx, shot) { this.ctx = ctx; this.shot = shot; }
  async setup() {
    const { ctx, shot } = this;
    ctx.textPass ??= new TextPass(ctx.renderer, ctx.W, ctx.H);
    this.grids = shot.layers.map(() => new TextGrid(ctx.W, ctx.H));
    for (const l of shot.layers) await l.setup?.(ctx);
  }
  async render(t, u) {
    const { ctx, shot } = this, pass = ctx.textPass;
    pass.begin();
    for (let i = 0; i < shot.layers.length; i++) {
      const l = shot.layers[i]; if (l.on && !l.on(t)) continue;
      const fade = l.fade ? l.fade(t) : 1; if (fade <= 0) continue;
      const g = this.grids[i]; (l.cell ? g.setCell(val(l.cell, t, u) * ctx.W / 1920) : g.setDensity(val(l.density ?? .5, t, u))).clear();
      const { df, tq } = drawClock(t, val(l.hold ?? 2, t));
      const out = await l.draw(g, { t, u, tq, df, W: ctx.W, H: ctx.H, ctx });
      pass.draw(g, { fade, raw: out?.raw, knock: !!l.knock });
    }
    pass.end();
  }
  dispose() { for (const g of this.grids || []) g.tex.dispose(); }
}
