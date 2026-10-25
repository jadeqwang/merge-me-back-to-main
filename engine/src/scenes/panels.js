// Panels: several lattice-rendered clips, each into its own target, placed as quads in a 3D space.
// shot: { panels: [{ plate, s0, clip?(t) -> clip time in s (overrides s0: slow motion / time remap), look?, cellFig?, cellWorld?, fid?, w, h,
//                    xf(t)->{x,y,z,rx,ry,rz,s,a}, frame?: '#hex', label?, ledFig? }],
//         back?: { plate, s0, look?, cam? }  (a full-frame lattice behind the panels)
//         cam?(t)->{fov, z}, text?(ty,t,u) }
// Pane figures are built from glyphs like the lattice scene's (look.figGlyph; Jade's 2026-10-24 decision 9); ?figlook=led or ledFig: true
// restore the LED emitters.
import * as THREE from 'three';
import { LatticeLayer, LatticeView } from '../lattice.js';
import { PlateSeq } from '../plateseq.js';
import { LOOKS, atlasFor, FigGroup, flat, withGain } from './lattice.js';

class Pane {
  constructor(ctx, p) { this.ctx = ctx; this.p = p; }
  async setup() {
    const { ctx, p } = this;
    this.W = p.rw || 960; this.H = p.rh || 540;
    this.seq = await PlateSeq.open(p.plate);
    this.view = new LatticeView(ctx.renderer, this.W, this.H);
    const look = LOOKS[p.look || ctx.P.get('look') || 'ascii2'];
    const atlas = atlasFor(ctx, look);
    const mk = (o, region, cell, k = 0) => new LatticeLayer({ plate: this.seq, cell: (cell ?? o.cell) * (p.cellScale ?? 1), W: this.W, region, atlas, opts: { ...o, seed: 3 + region + k * 31 } });
    this.layers = [];
    if (look.under) this.layers.push(mk(look.under, 0));
    const ws = [].concat(look.world), wScale = p.cellWorld ? p.cellWorld / ws[Math.floor(ws.length / 2)].cell : 1;
    ws.forEach((o, k) => this.layers.push(mk(o, 0, o.cell * wScale, k)));
    // her figure: glyph-built when the look has figGlyph (cells scaled by cellFig / 3, as in scenes/lattice.js), else the LED emitters
    const glyphFig = look.figGlyph && ctx.P.get('figlook') !== 'led' && !p.ledFig;
    this.fig = glyphFig ? new FigGroup(look.figGlyph.map((o, k) => withGain(mk(o, 1, o.cell * (p.cellFig ? p.cellFig / 3 : 1), 10 + k))))
      : mk(look.fig, 1, p.cellFig);
    this.layers.push(...flat(this.fig));
    if (p.lane) { this.fig.set('uTint', p.lane); this.fig.set('uTintAmt', p.laneAmt ?? .12); }
    this.rt = new THREE.WebGLRenderTarget(this.W, this.H, { type: THREE.HalfFloatType });
  }
  async render(t) {
    const { p } = this;
    if (p.clip) await this.seq.seek(p.clip(t) * this.seq.meta.fps); else await this.seq.at(t, p.s0 ?? 0);
    const mvp = this.view.frame(this.seq.aspect, p.cam ? p.cam(t) : {});
    if (p.fid) this.fig.set('uDensity', p.fid(t));
    this.view.render(this.layers, mvp, t);
    // light accumulation is directly displayable (rgb = light)
    return this.view.acc.texture;
  }
}

export default class Panels {
  constructor(ctx, shot) { this.ctx = ctx; this.shot = shot; }
  async setup() {
    const { ctx, shot } = this;
    this.panes = [];
    for (const p of shot.panels) { const pn = new Pane(ctx, p); await pn.setup(); this.panes.push(pn); }
    if (shot.back) { this.back = new Pane(ctx, { ...shot.back, rw: ctx.W, rh: ctx.H }); await this.back.setup(); }
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(30, ctx.W / ctx.H, .01, 100);
    this.quads = this.panes.map((pn) => {
      const m = new THREE.ShaderMaterial({
        uniforms: { tex: { value: null }, a: { value: 1 }, frame: { value: new THREE.Color(pn.p.frame || '#000000') }, fw: { value: pn.p.frame ? .006 : 0 }, gain: { value: 1 } },
        transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
        vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`,
        fragmentShader: `uniform sampler2D tex; uniform float a, fw, gain; uniform vec3 frame; varying vec2 vUv;
          void main(){ vec3 c = texture2D(tex, vUv).rgb * gain;
            vec2 e = min(vUv, 1. - vUv); float edge = 1. - step(fw, min(e.x, e.y * 1.777));
            c = mix(c, frame * 2., edge * step(.0001, fw));
            gl_FragColor = vec4(c * a, a); }`,
      });
      const q = new THREE.Mesh(new THREE.PlaneGeometry(pn.W / pn.H, 1), m); q.frustumCulled = false; this.scene.add(q); return q;
    });
    if (this.back) {
      this.backQ = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ transparent: true, depthTest: false, blending: THREE.AdditiveBlending }));
      this.backScene = new THREE.Scene(); this.backScene.add(this.backQ);
    }
    this.acc = new THREE.WebGLRenderTarget(ctx.W, ctx.H, { type: THREE.HalfFloatType, depthBuffer: false });
  }
  async render(t, u) {
    const { ctx, shot } = this, r = ctx.renderer;
    const texs = [];
    for (let i = 0; i < this.panes.length; i++) {
      const xf = this.panes[i].p.xf(t, u);
      const q = this.quads[i];
      if (!xf || xf.a <= .001) { q.visible = false; texs.push(null); continue; }
      q.visible = true;
      texs.push(await this.panes[i].render(t));
      q.position.set(xf.x || 0, xf.y || 0, xf.z || 0);
      q.rotation.set(xf.rx || 0, xf.ry || 0, xf.rz || 0);
      q.scale.setScalar(xf.s ?? 1);
      q.material.uniforms.tex.value = texs[i]; q.material.uniforms.a.value = xf.a ?? 1; q.material.uniforms.gain.value = xf.gain ?? 1;
    }
    const backTex = this.back ? await this.back.render(t) : null;
    const c = shot.cam ? shot.cam(t, u) : {};
    const fov = c.fov ?? 30; this.cam.fov = fov; this.cam.updateProjectionMatrix();
    // z such that a plane of height 1 at z=0 fills the frame
    const z = c.z ?? .5 / Math.tan(THREE.MathUtils.degToRad(fov / 2));
    this.cam.position.set(c.x || 0, c.y || 0, z); this.cam.lookAt(c.x || 0, c.y || 0, 0); this.cam.updateMatrixWorld();
    r.setRenderTarget(this.acc); r.setClearColor(0, 1); r.clear(); const ac = r.autoClear; r.autoClear = false;
    if (backTex) {
      const oc = new THREE.OrthographicCamera(-.5, .5, .5, -.5, -1, 1);
      this.backQ.material.map = backTex; this.backQ.material.opacity = c.backA ?? 1; this.backQ.material.needsUpdate = true;
      r.render(this.backScene, oc);
    }
    r.render(this.scene, this.cam);
    r.autoClear = ac; r.setRenderTarget(null);
    let typeTex = null;
    if (shot.text) { ctx.type.begin(); shot.text(ctx.type, t, u); ctx.type.end(); typeTex = ctx.type.tex; }
    ctx.post.render(this.acc.texture, t, typeTex);
  }
  dispose() { this.acc.dispose(); for (const p of this.panes) { p.rt.dispose(); p.view.acc.dispose(); p.view.accP.dispose(); } }
}
