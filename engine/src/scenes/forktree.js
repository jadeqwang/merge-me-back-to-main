// INTRO: one Jade on a black star-mirror, seen from above, Banach–Tarski-splitting on each bar (1 → 1,024).
// Copies = LED sprites of a top-down clip (lane recoloured); trails = lane-coloured comet paths of an analytic binary tree;
// floor = token text that lights up where the trails pass (trail map). Everything is a pure function of song time t.
// shot: { plate (clip, prepped), s0, splitBar0 = 3, splits = 10, titleBar = 9, tiltBar = 15, text(ty, t, st) }
import * as THREE from 'three';
import { PlateSeq } from '../plateseq.js';

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
    // ---------------------------------------------------------------- copies (LED sprites)
    this.seqs = [];
    for (let k = 0; k < 4; k++) this.seqs.push(await PlateSeq.open(shot.plate));
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
    this.copies = new THREE.Mesh(cgeo, copyMat); this.copies.frustumCulled = false;
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
    for (let k = 0; k < 4; k++) await this.seqs[k].at(tt + k * 1.7, shot.s0 ?? shot.t0);
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
