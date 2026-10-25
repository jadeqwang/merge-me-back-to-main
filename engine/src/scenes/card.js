// Type-only scene over black (placeholders, title cards). shot: { text(ty,t,u), bg? }
import * as THREE from 'three';
export default class Card {
  constructor(ctx, shot) { this.ctx = ctx; this.shot = shot; }
  async setup() { this.acc = new THREE.WebGLRenderTarget(this.ctx.W, this.ctx.H, { type: THREE.HalfFloatType, depthBuffer: false }); }
  async render(t, u) {
    const { ctx, shot } = this, r = ctx.renderer;
    r.setRenderTarget(this.acc); r.setClearColor(new THREE.Color(shot.bg || '#000000'), 1); r.clear(); r.setRenderTarget(null);
    ctx.type.begin(); shot.text?.(ctx.type, t, u); ctx.type.end();
    ctx.post.render(this.acc.texture, t, ctx.type.tex);
  }
  dispose() { this.acc.dispose(); }
}
