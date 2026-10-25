// INTRO: one Jade on a black star-mirror, seen from above, Banach–Tarski-splitting on each bar (1 → 1,024).
// Copies = sprites of a top-down clip (lane recoloured), built from glyphs like every other figure (Jade's 2026-10-24 decision 9: the soft
// underpaint + three glyph tiers of LOOKS.ascii2.figGlyph, drawn per screen cell so a copy of any size reads); ?figlook=led or shot.ledFig: true
// restore v4's LED emitters. Trails = lane-coloured comet paths of an analytic binary tree; floor = token text that lights up where the trails
// pass (trail map). Everything is a pure function of song time t.
// shot: { plate (clip, prepped), s0, splitBar0 = 3, splits = 10, titleBar = 9, tiltBar = 15, text(ty, t, st), figGain? }
// The copies play four clocks of the take (k = 0..3, `step` s apart): spread as far as the take allows over the shot (at most 1.7 s), so no clock
// runs past the take's last frame (src/clip.js spread / fit).
import * as THREE from 'three';
import { PlateSeq } from '../plateseq.js';
import { spread } from '../clip.js';
import { LOOKS, atlasFor } from './lattice.js';

export const LANES = ['#FF7A1A', '#FF5FA2', '#6FB6FF', '#4FE3B0', '#FFD23F', '#A57BFF', '#F4F4F8', '#FF8F6B'];
const TAU = Math.PI * 2, TH0 = -Math.PI / 2;
const easeOut = (x) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);

export default class ForkTree {
  constructor(ctx, shot) { this.ctx = ctx; this.shot = shot; }

  async setup() {
    const { ctx, shot } = this, T = ctx.T;
    this.G = shot.splits ?? 10;
    this.S = []; for (let g = 1; g <= this.G; g++) this.S[g] = T.bar((shot.splitBar0 ?? 3) + g - 1);
    this.S[0] = -1e9; this.S[this.G + 1] = 1e9;
    this.tEnd = shot.t1;
    // radius of the tips: grows from the first split; ~doubles its pace every few bars
    const s1 = this.S[1];
    this.R = (t) => t <= s1 ? 0 : 0.55 * Math.pow(Math.max(0, t - s1), 1.35);
    // ---------------------------------------------------------------- trails (precomputed sampled paths)
    const pts = [];
    for (let g = 0; g <= this.G; g++) {
      const n = 1 << g, t0 = this.S[g] < 0 ? s1 : this.S[g], t1 = Math.min(this.S[g + 1], this.tEnd);
      if (t1 <= t0) continue;
      for (let i = 0; i < n; i++) {
        const lane = g < 3 ? 0 : (i >> (g - 3)) % 7 + 1 - 1;   // lane from the generation-3 ancestor
        const per = g < 4 ? 140 : g < 7 ? 80 : 40;
        for (let k = 0; k <= per; k++) {
          const t = t0 + (t1 - t0) * k / per;
          const p = this.pos(g, i, t);
          pts.push(p[0], p[1], t, lane, g);
        }
      }
    }
    const arr = new Float32Array(pts);
    const tgeo = new THREE.InstancedBufferGeometry();
    tgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-.5, -.5, 0, .5, -.5, 0, .5, .5, 0, -.5, .5, 0]), 3));
    tgeo.setIndex([0, 1, 2, 0, 2, 3]);
    const ib = new THREE.InstancedInterleavedBuffer(arr, 5);
    tgeo.setAttribute('pxy', new THREE.InterleavedBufferAttribute(ib, 2, 0));
    tgeo.setAttribute('pt', new THREE.InterleavedBufferAttribute(ib, 1, 2));
    tgeo.setAttribute('plane', new THREE.InterleavedBufferAttribute(ib, 1, 3));
    tgeo.setAttribute('pg', new THREE.InterleavedBufferAttribute(ib, 1, 4));
    tgeo.instanceCount = arr.length / 5;
    const laneCols = LANES.map((c) => new THREE.Color(c));
    this.trailU = { uT: { value: 0 }, uHead: { value: 0 }, uPx: { value: 1 }, uLanes: { value: laneCols }, uMap: { value: 0 }, uGlow: { value: 1 } };
    const trailMat = new THREE.ShaderMaterial({
      uniforms: this.trailU, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec2 pxy; attribute float pt, plane, pg; uniform float uT, uHead, uPx, uMap, uGlow; varying vec2 vQ; varying float vA, vLane;
        void main(){
          if (pt > uT) { gl_Position = vec4(2.,2.,2.,1.); return; }
          float head = exp(-abs(uHead - pt) * 2.2);
          vA = (0.22 * uGlow + 0.9 * head);
          vLane = plane;
          vec4 c = modelViewMatrix * vec4(pxy, 0., 1.);
          float s = uPx * (uMap > .5 ? 6. : (1.6 + 2.4 * head));   // world size of one px * px
          c.xy += position.xy * s;
          gl_Position = projectionMatrix * c; vQ = position.xy;
        }`,
      fragmentShader: `uniform vec3 uLanes[8]; varying vec2 vQ; varying float vA, vLane;
        void main(){ float r = length(vQ) * 2.; float a = exp(-r * r * 3.5) * vA;
          vec3 c = uLanes[int(vLane + .5)]; gl_FragColor = vec4(c * a * 1.2, a); }`,
    });
    this.trails = new THREE.Mesh(tgeo, trailMat); this.trails.frustumCulled = false;
    // ---------------------------------------------------------------- copies (glyph-built sprites; LED with ?figlook=led)
    this.seqs = [];
    for (let k = 0; k < 4; k++) this.seqs.push(await PlateSeq.open(shot.plate));
    const s0 = shot.s0 ?? shot.t0;
    this.clk = { s0, step: spread(this.seqs[0].last, shot.t0 - s0, shot.t1 - shot.t0), fit: { from: shot.t0, to: shot.t1 } };
    this.glyph = ctx.P.get('figlook') !== 'led' && !shot.ledFig;
    const nmax = 1 << this.G;
    const cgeo = new THREE.InstancedBufferGeometry();
    cgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-.5, -.5, 0, .5, -.5, 0, .5, .5, 0, -.5, .5, 0]), 3));
    cgeo.setAttribute('uv', new THREE.BufferAttribute(new Float32Array([0, 0, 1, 0, 1, 1, 0, 1]), 2));
    cgeo.setIndex([0, 1, 2, 0, 2, 3]);
    this.cPos = new THREE.InstancedBufferAttribute(new Float32Array(nmax * 4), 4);   // x, y, lane, variant
    this.cAux = new THREE.InstancedBufferAttribute(new Float32Array(nmax * 2), 2);   // split progress k, parity
    cgeo.setAttribute('cpos', this.cPos); cgeo.setAttribute('caux', this.cAux);
    this.cU = {
      uTex: { value: this.seqs.map((s) => s.rgb) }, uMat: { value: this.seqs.map((s) => s.matte) },
      uSize: { value: new THREE.Vector2(1, 1) }, uPitch: { value: 3 }, uLanes: { value: laneCols }, uPxW: { value: 1 }, uGain: { value: 1.1 },
    };
    const copyMat = new THREE.ShaderMaterial({
      uniforms: this.cU, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec4 cpos; attribute vec2 caux; uniform vec2 uSize; varying vec2 vUv; varying float vLane, vVar, vK, vPar;
        void main(){ vec4 c = modelViewMatrix * vec4(cpos.xy, 0., 1.); c.xy += position.xy * uSize; gl_Position = projectionMatrix * c;
          vUv = uv; vLane = cpos.z; vVar = cpos.w; vK = caux.x; vPar = caux.y; }`,
      fragmentShader: `uniform sampler2D uTex[4]; uniform sampler2D uMat[4]; uniform float uPitch, uGain; uniform vec3 uLanes[8];
        varying vec2 vUv; varying float vLane, vVar, vK, vPar;
        vec3 rgb2hsv(vec3 c){ vec4 K=vec4(0.,-1./3.,2./3.,-1.); vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g)); vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r)); float d=q.x-min(q.w,q.y); float e=1e-10; return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x); }
        vec3 hsv2rgb(vec3 c){ vec3 p=abs(fract(c.xxx+vec3(0.,2./3.,1./3.))*6.-3.); return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y); }
        vec4 S(int k, vec2 uv){ vec3 c; float m;
          if (k == 0) { c = texture2D(uTex[0], uv).rgb; m = texture2D(uMat[0], uv).r; }
          else if (k == 1) { c = texture2D(uTex[1], uv).rgb; m = texture2D(uMat[1], uv).r; }
          else if (k == 2) { c = texture2D(uTex[2], uv).rgb; m = texture2D(uMat[2], uv).r; }
          else { c = texture2D(uTex[3], uv).rgb; m = texture2D(uMat[3], uv).r; }
          return vec4(c, m); }
        void main(){
          vec2 cell = floor(gl_FragCoord.xy / uPitch); vec2 cc = (cell + .5) * uPitch;
          vec2 uvc = vUv + dFdx(vUv) * (cc.x - gl_FragCoord.x) + dFdy(vUv) * (cc.y - gl_FragCoord.y);
          if (uvc.x < 0. || uvc.y < 0. || uvc.x > 1. || uvc.y > 1.) discard;
          vec4 s = S(int(vVar + .5), uvc);
          if (s.a < .3) discard;
          // lane recolour: orange bands / cups -> lane colour
          vec3 hsv = rgb2hsv(s.rgb);
          int li = int(vLane + .5);
          if (li > 0 && hsv.x > .02 && hsv.x < .12 && hsv.y > .45 && hsv.z > .25) {
            vec3 lh = rgb2hsv(uLanes[li]);
            hsv = vec3(lh.x, lh.y < .1 ? .03 : max(hsv.y, lh.y * .9), hsv.z * (lh.y < .1 ? 1.25 : 1.));
            s.rgb = hsv2rgb(hsv);
          }
          // Banach–Tarski: while splitting, each child owns every other emitter, then becomes whole
          float par = mod(cell.x + cell.y, 2.);
          float own = vK >= 1. ? 1. : (abs(par - vPar) < .5 ? 1. : vK * vK);
          vec2 l = fract(gl_FragCoord.xy / uPitch) - .5;
          float e = (1. - smoothstep(.36, .46, max(abs(l.x), abs(l.y))));
          float a = e * own * smoothstep(.3, .6, s.a);
          gl_FragColor = vec4(s.rgb * a * uGain, a);
        }`,
    });
    this.copies = new THREE.Mesh(cgeo, this.glyph ? this.glyphMat() : copyMat); this.copies.frustumCulled = false;
    // ---------------------------------------------------------------- floor: token octaves lit by the trail map, plus stars
    this.mapRT = new THREE.WebGLRenderTarget(1536, 1536, { type: THREE.HalfFloatType });
    this.mapCam = new THREE.OrthographicCamera(-1, 1, 1, -1, -10, 10);
    this.mapScene = new THREE.Scene(); this.mapScene.add(this.trails.clone());
    this.mapScene.children[0].material = trailMat.clone(); this.mapU = this.mapScene.children[0].material.uniforms;
    this.mapU.uLanes.value = laneCols;
    this.floorU = { uMap: { value: this.mapRT.texture }, uMapR: { value: 1 }, uAtlas: { value: ctx.atlas.tex }, uText: { value: this.textTex() }, uTL: { value: 1 }, uN: { value: ctx.atlas.n },
      uNch: { value: ctx.atlas.chars.length }, uCam: { value: new THREE.Vector3() }, uScale: { value: 1 }, uT: { value: 0 }, uStars: { value: 1 }, uFloorK: { value: 1 } };
    const floorMat = new THREE.ShaderMaterial({
      uniforms: this.floorU, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `varying vec2 vW; void main(){ vec4 w = modelMatrix * vec4(position, 1.); vW = w.xy; gl_Position = projectionMatrix * viewMatrix * w; }`,
      fragmentShader: `uniform sampler2D uMap, uAtlas, uText; uniform float uMapR, uN, uNch, uScale, uT, uStars, uTL, uFloorK; varying vec2 vW;
        float h21(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
        float glyph(vec2 w, float sc){ vec2 g = w / sc; vec2 c = floor(g); vec2 f = fract(g);
          float k = mod(c.x + c.y * 97. + 50000., uTL); float id = texture2D(uText, vec2((k + .5) / uTL, .5)).r * 255.; int gi = int(id + .5), an = int(uN + .5);
          vec2 cell = vec2(float(gi % an), float(gi / an)); vec2 auv = (cell + vec2(f.x, 1. - f.y)) / uN; auv.y = 1. - auv.y;
          return texture2D(uAtlas, auv).r; }
        void main(){
          vec2 m = vW / uMapR * .5 + .5;
          vec3 lit = (m.x > 0. && m.y > 0. && m.x < 1. && m.y < 1.) ? texture2D(uMap, m).rgb : vec3(0.);
          // two octaves of tokens, crossfaded by camera scale so the floor never aliases
          float l2 = log2(uScale); float o = floor(l2); float fr = l2 - o;
          float s0 = exp2(o) * .022, s1 = s0 * 2.;
          float gsum = mix(glyph(vW, s0), glyph(vW, s1), fr);
          lit *= uFloorK; vec3 c = lit * gsum * (.55 + .7 * smoothstep(1., 6., uScale)) + lit * .05;
          // star reflections
          vec2 sg = vW / (uScale * .015); vec2 sc = floor(sg); float st = h21(sc); vec2 sf = fract(sg) - .5;
          float star = step(.985, st) * exp(-dot(sf, sf) * 60.) * (.4 + .6 * sin(uT * 2. + st * 90.));
          c += vec3(.75, .8, 1.) * star * .35 * uStars;
          gl_FragColor = vec4(c, 1.);
        }`,
    });
    this.floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400), floorMat); this.floor.frustumCulled = false;
    // ---------------------------------------------------------------- split flashes
    this.floorU.uTL.value = this._tl;
    this.scene = new THREE.Scene(); this.scene.add(this.floor, this.trails, this.copies);
    this.cam = new THREE.PerspectiveCamera(36, ctx.W / ctx.H, .001, 5000);
    this.acc = new THREE.WebGLRenderTarget(ctx.W, ctx.H, { type: THREE.HalfFloatType, depthBuffer: false });
  }

  // the copies built from glyphs: per screen cell (as the LED emitters were) the cell's colour, brightness and Sobel edge pick a character of
  // the structural atlas (atlas 2: brightness tiers, edge strokes along her contours), in three tiers over a soft underpaint, with the
  // figGlyph values of scenes/lattice.js. uCell = tier-1 cell (px), from the copy's size on screen (5 px for a big copy, down to 2.5 px).
  glyphMat() {
    const { ctx } = this, atlas = atlasFor(ctx, LOOKS.ascii2), lv = this.seqs[0].figLevels;
    Object.assign(this.cU, { uAtlas: { value: atlas.tex }, uAtlasN: { value: atlas.n }, uTierOff: { value: atlas.tierOff }, uTierN: { value: atlas.tierN },
      uEdgeOff: { value: atlas.edgeOff }, uLevels: { value: new THREE.Vector2(lv[0], lv[1]) }, uCell: { value: 5 }, uT: { value: 0 } });
    this.cU.uGain.value = this.shot.figGain ?? 1.2;   // about the LED copies' light (SwiftShader still of a test plate: figure mean 38 vs 38)
    const [under, a, b, c] = LOOKS.ascii2.figGlyph, f = (x) => Number(x).toFixed(3), v2 = (x) => `vec2(${f(x[0])}, ${f(x[1])})`;
    const tier = (o, seed) => `tier(k, li, dx, dy, uCell * ${f(o.cell / a.cell)}, vec3(${o.cov.map(f).join(', ')}), ${v2(o.edgeK)}, ${f(o.tierBias)}, ` +
      `${v2([o.sizeMin, o.sizeMax])}, vec4(${f(o.gain)}, ${f(o.gamma)}, ${f(o.floor)}, ${f(o.crisp)}), vec3(${f(o.sat)}, ${f(o.norm)}, ${f(o.flick)}), ${f(seed)})`;
    return new THREE.ShaderMaterial({
      uniforms: this.cU, transparent: true, depthTest: false, depthWrite: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
      vertexShader: `attribute vec4 cpos; attribute vec2 caux; uniform vec2 uSize; varying vec2 vUv; varying float vLane, vVar, vK, vPar;
        void main(){ vec4 c = modelViewMatrix * vec4(cpos.xy, 0., 1.); c.xy += position.xy * uSize; gl_Position = projectionMatrix * c;
          vUv = uv; vLane = cpos.z; vVar = cpos.w; vK = caux.x; vPar = caux.y; }`,
      fragmentShader: `uniform sampler2D uTex[4]; uniform sampler2D uMat[4]; uniform sampler2D uAtlas; uniform vec3 uLanes[8];
        uniform float uGain, uAtlasN, uTierOff, uTierN, uEdgeOff, uCell, uT; uniform vec2 uLevels;
        varying vec2 vUv; varying float vLane, vVar, vK, vPar;
        vec3 rgb2hsv(vec3 c){ vec4 K=vec4(0.,-1./3.,2./3.,-1.); vec4 p=mix(vec4(c.bg,K.wz),vec4(c.gb,K.xy),step(c.b,c.g)); vec4 q=mix(vec4(p.xyw,c.r),vec4(c.r,p.yzx),step(p.x,c.r)); float d=q.x-min(q.w,q.y); float e=1e-10; return vec3(abs(q.z+(q.w-q.y)/(6.*d+e)),d/(q.x+e),q.x); }
        vec3 hsv2rgb(vec3 c){ vec3 p=abs(fract(c.xxx+vec3(0.,2./3.,1./3.))*6.-3.); return c.z*mix(vec3(1.),clamp(p-1.,0.,1.),c.y); }
        vec3 C(int k, vec2 uv){ if (k == 0) return texture2D(uTex[0], uv).rgb; if (k == 1) return texture2D(uTex[1], uv).rgb; if (k == 2) return texture2D(uTex[2], uv).rgb; return texture2D(uTex[3], uv).rgb; }
        float M(int k, vec2 uv){ if (k == 0) return texture2D(uMat[0], uv).r; if (k == 1) return texture2D(uMat[1], uv).r; if (k == 2) return texture2D(uMat[2], uv).r; return texture2D(uMat[3], uv).r; }
        float lum(vec3 c){ return dot(c, vec3(.299, .587, .114)); }
        float bri(vec3 c, float gm){ return pow(clamp((lum(c) - uLevels.x) / max(uLevels.y - uLevels.x, 1e-3), 0., 1.), gm); }
        float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        // lane recolour: orange bands / cups -> lane colour
        vec3 lane(vec3 c, int li){ vec3 hsv = rgb2hsv(c);
          if (li > 0 && hsv.x > .02 && hsv.x < .12 && hsv.y > .45 && hsv.z > .25) { vec3 lh = rgb2hsv(uLanes[li]);
            c = hsv2rgb(vec3(lh.x, lh.y < .1 ? .03 : max(hsv.y, lh.y * .9), hsv.z * (lh.y < .1 ? 1.25 : 1.))); }
          return c; }
        // Banach–Tarski: while splitting, each child owns every other cell, then becomes whole
        float own(vec2 cell){ return vK >= 1. ? 1. : (abs(mod(cell.x + cell.y, 2.) - vPar) < .5 ? 1. : vK * vK); }
        // light colour as the lattice FS: saturation, chroma-normalise (glyph shape carries the brightness), brightness floor
        vec3 shade(vec3 c, float b, float sat, float norm){ c = max(mix(vec3(lum(c)), c, sat), 0.);
          return mix(c, c / max(max(c.r, max(c.g, c.b)), .03) * (.18 + .82 * b), norm); }
        // the soft underpaint: her image blurred over ~2 cells of P px at low gain, so the face reads as one continuous image
        vec3 under(int k, int li, vec2 dx, vec2 dy, float P, float gain, float gm, float sat){
          vec2 o1 = (dx + dy) * P * .6, o2 = (dx - dy) * P * .6;
          vec3 c = .25 * (C(k, vUv + o1) + C(k, vUv - o1) + C(k, vUv + o2) + C(k, vUv - o2));
          float m = .25 * (M(k, vUv + o1) + M(k, vUv - o1) + M(k, vUv + o2) + M(k, vUv - o2));
          float b = bri(c, gm);
          return shade(lane(c, li), b, sat, 0.) * smoothstep(.3, .6, m) * own(floor(gl_FragCoord.xy / P)) * gain * b; }
        // one glyph tier: cells of P screen px; cov = coverage [base, light, edge], ek = edge thresholds, tb = tier bias, sz = glyph size (cells),
        // g = [gain, gamma, floor, crisp], q = [sat, norm, flicker]
        vec3 tier(int k, int li, vec2 dx, vec2 dy, float P, vec3 cov, vec2 ek, float tb, vec2 sz, vec4 g, vec3 q, float seed){
          vec2 cell = floor(gl_FragCoord.xy / P), cc = (cell + .5) * P;
          vec2 uvc = vUv + dx * (cc.x - gl_FragCoord.x) + dy * (cc.y - gl_FragCoord.y);
          if (uvc.x < 0. || uvc.y < 0. || uvc.x > 1. || uvc.y > 1.) return vec3(0.);
          float keep = smoothstep(.45, .7, M(k, uvc)); if (keep < .01) return vec3(0.);
          vec3 c = C(k, uvc); float b = bri(c, g.y);
          vec2 ex = dx * P * .55, ey = dy * P * .55;
          float tl = bri(C(k, uvc - ex + ey), g.y), tc = bri(C(k, uvc + ey), g.y), tr = bri(C(k, uvc + ex + ey), g.y);
          float ml = bri(C(k, uvc - ex), g.y), mr = bri(C(k, uvc + ex), g.y);
          float bl = bri(C(k, uvc - ex - ey), g.y), bc = bri(C(k, uvc - ey), g.y), br = bri(C(k, uvc + ex - ey), g.y);
          float gx = ((tr + 2. * mr + br) - (tl + 2. * ml + bl)) * .25, gy = ((tl + 2. * tc + tr) - (bl + 2. * bc + br)) * .25;
          float ed = smoothstep(ek.x, ek.y, length(vec2(gx, gy))), pk = max(b, max(max(tl, tr), max(bl, br)) * .85);
          float r1 = h21(cell + seed), r2 = h21(cell + seed + 17.3), r3 = h21(cell + seed + 41.9);
          if (r1 > clamp(cov.x + cov.y * pk + cov.z * ed, 0., 1.)) return vec3(0.);
          float v = floor(h21(cell + seed + 7.7 + floor(uT * q.z * 8. + r3 * 9.)) * 16.), gi;
          if (ed > .15 + .7 * r2) gi = uEdgeOff + floor(mod(atan(gy, gx) + 1.9634954, 3.1415927) / .7853982) * 4. + mod(v, 4.);   // stroke along the contour
          else gi = uTierOff + clamp(floor((pow(b, .8) + (r2 - .5) * .12) * uTierN + tb), 0., uTierN - 1.) * 8. + mod(v, 8.);       // brightness tier
          float s = mix(sz.x, sz.y, b); vec2 l = (gl_FragCoord.xy - cc) / (P * s) + .5;
          if (l.x < 0. || l.y < 0. || l.x > 1. || l.y > 1.) return vec3(0.);
          int ig = int(gi + .5), an = int(uAtlasN + .5);
          vec2 auv = (vec2(float(ig % an), float(ig / an)) + vec2(l.x, 1. - l.y)) / uAtlasN; auv.y = 1. - auv.y;
          float a = textureLod(uAtlas, auv, max(0., log2(96. / (P * s)) - g.w)).r; a = mix(a, smoothstep(.18, .62, a), min(g.w, 1.));
          return shade(lane(c, li), b, q.x, q.y) * a * keep * own(cell) * g.x * mix(g.z, 1., b); }
        void main(){
          vec2 dx = dFdx(vUv), dy = dFdy(vUv); int k = int(vVar + .5), li = int(vLane + .5);
          vec3 c = under(k, li, dx, dy, uCell * ${f(under.cell / a.cell)}, ${f(under.gain)}, ${f(under.gamma)}, ${f(under.sat)})
            + ${tier(a, 3)}
            + ${tier(b, 11)}
            + ${tier(c, 23)};
          c *= uGain; if (max(c.r, max(c.g, c.b)) <= 0.) discard;
          gl_FragColor = vec4(c, 1.);
        }`,
    });
  }

  textTex() {
    const txt = this.ctx.atlas.text || '', ch = this.ctx.atlas.chars;
    const src = (txt.length ? txt : ch.join('')).split('').map((c) => Math.max(0, ch.indexOf(c)));
    const data = new Uint8Array(src.length * 4); src.forEach((v, i) => { data[i * 4] = v; });
    const tx = new THREE.DataTexture(data, src.length, 1, THREE.RGBAFormat); tx.needsUpdate = true;
    tx.minFilter = tx.magFilter = THREE.NearestFilter; this._tl = src.length; return tx;
  }
  gen(t) { let g = 0; while (g < this.G && t >= this.S[g + 1]) g++; return g; }
  center(g, i) { return TH0 + TAU * (i + .5) / (1 << g); }
  // position of node (g,i) at time t (valid while it is alive)
  pos(g, i, t) {
    if (g === 0) return [0, 0];
    const tb = this.S[g], k = easeOut((t - tb) / 1.1);
    const pa = this.center(g - 1, i >> 1), ca = this.center(g, i);
    // the parent's own easing at its birth so the curve is continuous
    const a = g === 1 ? ca : pa + (ca - pa) * k;
    let r = this.R(t);
    if (g === 1) { const p = easeOut((t - tb) / 1.4); return [Math.cos(a) * (.42 * p + r), Math.sin(a) * (.42 * p + r)]; }
    r += .42;
    return [Math.cos(a) * r, Math.sin(a) * r];
  }

  async render(tt) {
    const { ctx, shot } = this, r = ctx.renderer;
    const t = shot.treeTime ? shot.treeTime(tt) : tt;           // tree time (may run backwards)
    const trailT = shot.treeTime ? (shot.trailT ?? 1e9) : t;
    for (let k = 0; k < 4; k++) await this.seqs[k].at(tt + k * this.clk.step, this.clk.s0, this.clk.fit);
    const g = this.gen(t), n = 1 << g;
    // camera: frame the tips; then a final tilt to the horizon
    const Rtip = this.R(t) + .42;
    const rise = shot.rise ? shot.rise(tt) : 1;
    let Rv = Math.max(.78, g < 3 ? Rtip * 1.12 + .3 : Rtip * 1.28);
    if (g === 0 && !shot.treeTime) { const k = Math.min(1, Math.max(0, tt / this.S[1])); const e = k * k * (3 - 2 * k); Rv = .3 + (.78 - .3) * e; this.camY = (1 - e) * .26; } else this.camY = 0;
    let h = Rv / Math.tan(THREE.MathUtils.degToRad(18)) * rise;
    const tiltT = shot.tiltBar ? ctx.T.bar(shot.tiltBar) : 1e9;
    const d = shot.tiltBar ? Math.min(1, Math.max(0, (tt - tiltT) / (shot.t1 - tiltT))) : 0;
    const dv = d * d * (3 - 2 * d);
    // dive: toward one tip (the rose lane), descending and pitching toward the horizon
    const tip = this.pos(this.G, this.diveI ?? (this.diveI = (1 << this.G) * 5 / 16 | 0), t);
    const tx = tip[0] * dv, ty = tip[1] * dv + (this.camY || 0);
    const hh = Math.exp(Math.log(h) * (1 - dv) + Math.log(.3) * dv);
    const pitch = dv * 1.2;                            // radians away from straight down
    const dir = Math.atan2(tip[1], tip[0]);
    this.cam.position.set(tx - Math.cos(dir) * Math.sin(pitch) * hh * 1.8, ty - Math.sin(dir) * Math.sin(pitch) * hh * 1.8, hh);
    this.cam.up.set(Math.cos(dir) * dv, (1 - dv) + Math.sin(dir) * dv, 0).normalize();
    this.cam.lookAt(tx + Math.cos(dir) * Math.sin(pitch) * .6, ty + Math.sin(dir) * Math.sin(pitch) * .6, 0);
    this.cam.updateMatrixWorld();
    h = this.cam.position.z / Math.max(.2, Math.cos(pitch));
    const pxW = (2 * h * Math.tan(THREE.MathUtils.degToRad(18))) / ctx.H;   // world units per screen px at the floor
    // copies
    const spacing = g === 0 ? 10 : TAU * (this.R(t) + .42) / n;
    const fig = Math.min(.95, Math.max(pxW * 6, spacing * .7));
    this.cU.uSize.value.set(fig * this.seqs[0].aspect, fig);
    this.cU.uPitch.value = Math.max(2.5, Math.min(4, 3));
    if (this.glyph) { this.cU.uCell.value = 5 * Math.max(.5, Math.min(1, fig / pxW / 360)); this.cU.uT.value = tt; }   // glyph cells: copy height / 72, 2.5..5 px
    const P = this.cPos.array, A = this.cAux.array;
    for (let i = 0; i < n; i++) {
      const p = this.pos(g, i, t);
      const lane = g < 3 ? 0 : ((i >> (g - 3)) % 7);
      P[i * 4] = p[0]; P[i * 4 + 1] = p[1]; P[i * 4 + 2] = lane; P[i * 4 + 3] = (i * 7 + g) % 4;
      A[i * 2] = g === 0 ? 1 : Math.min(1, (t - this.S[g]) / .45); A[i * 2 + 1] = i & 1;
    }
    this.cPos.needsUpdate = this.cAux.needsUpdate = true;
    this.copies.geometry.instanceCount = n;
    // trail map (world ortho), then floor + trails + copies into the light accumulation
    const mapR = Math.max(2, (this.R(this.tEnd) + .42) * 1.1);
    this.mapCam.left = -mapR; this.mapCam.right = mapR; this.mapCam.top = mapR; this.mapCam.bottom = -mapR; this.mapCam.updateProjectionMatrix();
    this.mapU.uT.value = trailT; this.mapU.uHead.value = t; this.mapU.uPx.value = mapR * 2 / 1536; this.mapU.uMap.value = 1;
    r.setRenderTarget(this.mapRT); r.setClearColor(0, 0); r.clear(); r.render(this.mapScene, this.mapCam);
    this.trailU.uT.value = trailT; this.trailU.uHead.value = t; this.trailU.uPx.value = pxW; this.trailU.uGlow.value = (shot.glow ? shot.glow(tt) : 1) * (1 + .9 * ctx.T.pulse(tt, .18) * (g >= 6 ? 1 : 0));
    Object.assign(this.floorU.uMapR, { value: mapR }); this.floorU.uScale.value = Math.max(1, h * .9); this.floorU.uT.value = t; this.floorU.uFloorK.value = shot.floorK ?? (shot.treeTime ? .07 : 1);
    r.setRenderTarget(this.acc); r.setClearColor(0, 1); r.clear(); r.render(this.scene, this.cam); r.setRenderTarget(null);
    let typeTex = null;
    if (shot.text) { ctx.type.begin(); shot.text(ctx.type, tt, { g, n, S: this.S, tau: t }); ctx.type.end(); typeTex = ctx.type.tex; }
    ctx.post.render(this.acc.texture, tt, typeTex);
  }
  dispose() { this.acc.dispose(); this.mapRT.dispose(); }
}
