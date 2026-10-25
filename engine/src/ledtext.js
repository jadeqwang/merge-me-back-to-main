// LED typography: hook lyrics rendered as emitters of the same lattice as Jade. Words assemble from flying cells at their sung start.
// The text raster encodes per pixel: R = coverage*255, G = coverage*lane*32, B = coverage*timeByte (word start relative to a base).
// Ratios G/R and B/R recover lane and start time even on anti-aliased edges.
import * as THREE from 'three';

const SPAN = 8;   // seconds encoded in the time byte (31 ms resolution)

export class LedText {
  constructor(renderer, W, H, { pitch = 4 } = {}) {
    this.r = renderer; this.W = W; this.H = H; this.pitch = pitch;
    this.cv = document.createElement('canvas'); this.cv.width = Math.round(W / 2); this.cv.height = Math.round(H / 2);
    this.g = this.cv.getContext('2d', { willReadFrequently: false });
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.NoColorSpace; this.tex.minFilter = this.tex.magFilter = THREE.LinearFilter; this.tex.generateMipmaps = false;
    const cols = Math.ceil(W / pitch), rows = Math.ceil(H / pitch), n = cols * rows;
    const home = new Float32Array(n * 2), rnd = new Float32Array(n * 2);
    let s = 9; const rand = () => (s = (s * 16807) % 2147483647) / 2147483647;
    for (let y = 0, k = 0; y < rows; y++) for (let x = 0; x < cols; x++, k++) { home[k * 2] = (x + .5) / cols; home[k * 2 + 1] = 1 - (y + .5) / rows; rnd[k * 2] = rand(); rnd[k * 2 + 1] = rand(); }
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-.5, -.5, 0, .5, -.5, 0, .5, .5, 0, -.5, .5, 0]), 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.setAttribute('home', new THREE.InstancedBufferAttribute(home, 2));
    geo.setAttribute('rnd', new THREE.InstancedBufferAttribute(rnd, 2));
    geo.instanceCount = n;
    this.u = { uTex: { value: this.tex }, uT: { value: 0 }, uBase: { value: 0 }, uCell: { value: new THREE.Vector2(2 / cols, 2 / rows) }, uOut: { value: 0 },
      uCols: { value: [0xFFF1DC, 0xFF7A1A, 0xFF5FA2, 0x6FB6FF, 0x4FE3B0, 0xFFD23F, 0xA57BFF, 0xF4F4F8].map((c) => new THREE.Color(c)) }, uGain: { value: 1.4 }, uAspect: { value: W / H } };
    this.mat = new THREE.ShaderMaterial({
      uniforms: this.u, transparent: true, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending,
      vertexShader: `attribute vec2 home; attribute vec2 rnd; uniform sampler2D uTex; uniform float uT, uBase, uOut, uAspect; uniform vec2 uCell;
        varying vec2 vQ; varying vec3 vC; varying float vA; uniform vec3 uCols[8];
        void main(){
          vec4 s = texture2D(uTex, home);
          if (s.r < .35) { gl_Position = vec4(2., 2., 2., 1.); return; }
          float lane = floor(s.g / s.r * 255. / 32. + .5), st = uBase + s.b / s.r * ${SPAN.toFixed(1)};
          float k = clamp((uT - st + .04 + rnd.x * .06) / (.22 + rnd.y * .18), 0., 1.);
          float e = 1. - pow(1. - k, 3.);
          if (k <= 0.) { gl_Position = vec4(2., 2., 2., 1.); return; }
          vec2 p = home * 2. - 1.;
          float ang = rnd.x * 6.2832; vec2 dir = vec2(cos(ang), sin(ang) * uAspect);
          p += dir * (1. - e) * (.05 + .25 * rnd.y) * vec2(1., 1. / uAspect);
          // out: cells drift up and away
          p += vec2((rnd.x - .5) * .3, .25 + .2 * rnd.y) * uOut * uOut;
          p += position.xy * uCell * (.92 + .3 * (1. - e));
          gl_Position = vec4(p, 0., 1.);
          vQ = position.xy; vC = uCols[int(lane)]; vA = e * (1. - uOut) * smoothstep(.35, .6, s.r);
        }`,
      fragmentShader: `uniform float uGain; varying vec2 vQ; varying vec3 vC; varying float vA;
        void main(){ vec2 a = abs(vQ) * 2.; float e = (1. - smoothstep(.8, .96, max(a.x, a.y))) * (1. - .12 * length(vQ)); gl_FragColor = vec4(vC * e * vA * uGain, e * vA); }`,
    });
    this.mesh = new THREE.Mesh(geo, this.mat); this.mesh.frustumCulled = false;
    this.scene = new THREE.Scene(); this.scene.add(this.mesh); this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);
    this.rt = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false });
    this.dirty = false; this.base = 0; this.out = 0;
  }
  begin() { this.g.setTransform(1, 0, 0, 1, 0, 0); this.g.fillStyle = '#000'; this.g.fillRect(0, 0, this.cv.width, this.cv.height); this.g.setTransform(this.cv.width / 1920, 0, 0, this.cv.width / 1920, 0, 0); this.dirty = false; this.out = 0; }
  // words [{w,start}] laid out greedily; lane per word (0 = cream). Base = first start - .5
  hook(words, t, { x = 110, y = 300, size = 170, lead = .92, font = 'ARCH', wght = 900, maxW = 900, align = 'left', lane = 0, out = null, stretch = 'expanded' } = {}) {
    if (!words.length) return;
    const g = this.g; if (!this.dirty) this.base = t - 6; this.dirty = true;
    if (out !== null) this.out = Math.max(this.out, Math.max(0, Math.min(1, (t - out) / .5)));
    g.font = `${wght} ${size}px ${font}`; g.fontStretch = stretch; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    const sp = g.measureText(' ').width; const lines = []; let cur = [], cw = 0;
    for (const w of words) { const ww = g.measureText(w.w.toUpperCase()).width; if (cur.length && cw + sp + ww > maxW) { lines.push(cur); cur = []; cw = 0; } cur.push({ ...w, ww }); cw += (cur.length > 1 ? sp : 0) + ww; }
    if (cur.length) lines.push(cur);
    lines.forEach((line, li) => {
      const lw = line.reduce((a, w, i) => a + w.ww + (i ? sp : 0), 0); let xx = align === 'center' ? x - lw / 2 : x;
      for (const w of line) {
        const tb = Math.max(0, Math.min(255, Math.round((w.start - this.base) / SPAN * 255)));
        const ln = w.lane ?? lane;
        g.fillStyle = `rgb(255,${ln * 32},${tb})`; g.fillText(w.w.toUpperCase(), xx, y + li * size * lead); xx += w.ww + sp;
      }
    });
  }
  render(t) {
    if (!this.dirty) return null;
    this.tex.needsUpdate = true; this.u.uT.value = t; this.u.uBase.value = this.base; this.u.uOut.value = this.out;
    this.r.setRenderTarget(this.rt); this.r.setClearColor(0, 0); this.r.clear(); this.r.render(this.scene, this.cam); this.r.setRenderTarget(null);
    return this.rt.texture;
  }
}
