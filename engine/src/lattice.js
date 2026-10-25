// The light lattice: reconstructs a plate (rgb + depth + matte) as instanced cells that can be
// dots, LED pixels, glyphs (tokens) or soft splats, accumulated as weighted light and resolved.
// One layer = one cell grid over the plate, restricted to figure (matte) or world (1 - matte).
import * as THREE from 'three';

const QUAD = new Float32Array([-.5, -.5, 0, .5, -.5, 0, .5, .5, 0, -.5, .5, 0]);

export const DEFAULT_TEXT = ('merge me back to main every road i ran becomes the one fold me in again nothing that i lived is ever gone ' +
  'i split myself a thousand ways down every road the night could hold each one a light i sent ahead each one a story to unfold ' +
  'and every branch remembers where i started from ').toUpperCase();

// brightness ramp for the ASCII world (index 0 is blank), stored after the lyric chars
export const RAMP = ['', '.', ':', '-', '~', '=', '+', '*', 'o', 'x', '%', '#', '@'];

export function glyphAtlas(text, font = '700 112px JBM', n = 8, cell = 128) {
  const chars = [...new Set(text)];
  const cv = document.createElement('canvas'); cv.width = cv.height = n * cell;
  const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = font;
  chars.forEach((c, i) => g.fillText(c === ' ' ? '·' : c, (i % n + .5) * cell, (Math.floor(i / n) + .53) * cell));
  const rampOff = chars.length;
  RAMP.forEach((c, i) => { const k = rampOff + i; g.fillText(c, (k % n + .5) * cell, (Math.floor(k / n) + .53) * cell); });
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.NoColorSpace;
  return { tex, chars, n, text, rampOff, rampN: RAMP.length };
}

// 'build' ASCII (look ascii2): characters that construct the image, MMORPG-style.
// Brightness tiers (sparse -> heavy, 8 variants each, drawn at rising weight) and edge glyphs in 4 orientation bins
// (tangent 0, 45, 90, 135 deg; 4 variants each). Layout: lyric chars | RAMP | tiers | edges.
export const TIERS = [
  ['.', ',', '`', "'", '.', '·', ',', '.'],
  [':', ';', "'", '"', '^', ':', '~', ';'],
  ['+', '=', '*', '^', 'c', 'v', 'i', '+'],
  ['o', 'x', '*', 'z', 's', '+', 'e', 'a'],
  ['%', '&', '$', '8', '0', 'X', 'k', 'O'],
  ['#', '@', 'W', 'M', 'B', 'N', 'Q', 'H'],
];
export const TIER_WGHT = [500, 600, 650, 700, 760, 820];
export const EDGES = [['-', '_', '=', '~'], ['/', '/', '7', '/'], ['|', '!', '(', ')'], ['\\', '\\', '`', '\\']];
export function glyphAtlas2(text, n = 16, cell = 96) {
  const chars = [...new Set(text)];
  const cv = document.createElement('canvas'); cv.width = cv.height = n * cell;
  const g = cv.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height);
  g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
  let k = 0;
  const put = (c, w = 700) => { g.font = `${w} ${Math.round(cell * .875)}px JBM`; g.fillText(c, (k % n + .5) * cell, (Math.floor(k / n) + .53) * cell); k++; };
  chars.forEach((c) => put(c === ' ' ? '·' : c));
  const rampOff = k; RAMP.forEach((c) => put(c));
  const tierOff = k; TIERS.forEach((row, i) => row.forEach((c) => put(c, TIER_WGHT[i])));
  const edgeOff = k; EDGES.forEach((row) => row.forEach((c) => put(c, 700)));
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.NoColorSpace; tex.anisotropy = 4;
  return { tex, chars, n, text, rampOff, rampN: RAMP.length, tierOff, tierN: TIERS.length, edgeOff };
}

// luminance percentiles of a texture's image, for auto-levels
export function levels(img, lo = 0.02, hi = 0.985, matteImg = null, inside = true) {
  const cv = document.createElement('canvas'); cv.width = 160; cv.height = Math.round(160 * img.height / img.width);
  const g = cv.getContext('2d'); g.drawImage(img, 0, 0, cv.width, cv.height);
  const d = g.getImageData(0, 0, cv.width, cv.height).data, L = [];
  let M = null;
  if (matteImg) { g.drawImage(matteImg, 0, 0, cv.width, cv.height); M = g.getImageData(0, 0, cv.width, cv.height).data; }
  for (let i = 0; i < d.length; i += 4) if (!M || (M[i] > 128) === inside) L.push((.299 * d[i] + .587 * d[i + 1] + .114 * d[i + 2]) / 255);
  if (L.length < 20) return [0, 1];
  L.sort((a, b) => a - b);
  return [L[Math.floor(lo * L.length)], L[Math.floor(hi * L.length)]];
}

const VS = /* glsl */`
precision highp float;
in vec3 position; in vec2 home; in float gid; in float rnd; in vec2 cxy;
uniform sampler2D uRgb, uDepth, uMatte;
uniform vec2 uCellUv; uniform float uAspect, uRegion, uDepthAmt, uTime;
uniform vec2 uLevels; uniform float uSizeMin, uSizeMax, uGamma, uAniso;
uniform float uDrift, uScatter; uniform vec3 uScatterDir; uniform vec2 uOffset;
uniform mat4 uMVP; uniform float uCamD; uniform float uDensity, uScale; uniform vec2 uCellUvF;
uniform float uRamp, uRampOff, uRampN, uWords;
uniform vec4 uCov; uniform vec2 uEdgeK; uniform vec3 uJit; uniform float uTierBias, uEdgeRot, uFlick, uTierOff, uTierN, uEdgeOff, uEdgeB; uniform vec4 uClust;
out vec2 vUv; out vec3 vCol; out float vW, vGid, vB;
float L(vec2 p){ return dot(texture(uRgb,p).rgb, vec3(.299,.587,.114)); }
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(h21(i), h21(i + vec2(1., 0.)), f.x), mix(h21(i + vec2(0., 1.)), h21(i + vec2(1., 1.)), f.x), f.y); }
float hsh(float k){ return fract(sin(rnd * (91.7 + k * 13.13) + k * 7.31) * 43758.5453); }
float bayer8(ivec2 c){ int x = c.x & 7, y = c.y & 7, b = 0;
  for (int i = 0; i < 3; i++) { int bx = (x >> i) & 1, by = (y >> i) & 1; b |= ((bx ^ by) << (5 - 2 * i)) | (by << (4 - 2 * i)); }
  return (float(b) + .5) / 64.; }
void main(){
  // density: Bayer-ordered subsets coarsen the lattice into exact larger grids
  float rank = bayer8(ivec2(cxy));
  float dens = max(uDensity, 1. / 64.);
  float vis = clamp((dens - rank) * 64. + .5, 0., 1.);
  float grow = 1. / sqrt(dens);
  vec2 h = home + vec2(.5, -.5) * (grow - 1.) * uCellUv * step(dens, .999);
  vec3 c = texture(uRgb, h).rgb;
  float m = texture(uMatte, h).r;
  float d = texture(uDepth, h).r;
  float keep = (uRegion > 1.5 ? 1.0 : (uRegion > .5 ? smoothstep(.45,.7,m) : 1.0 - smoothstep(.25,.5,m))) * vis;
  float lum = dot(c, vec3(.299,.587,.114));
  float b = pow(clamp((lum - uLevels.x) / max(uLevels.y - uLevels.x, 1e-3), 0., 1.), uGamma);
  vec2 q = position.xy;
  if (uAniso > 0.) {
    vec2 e = uCellUv * .6;
    float gx = L(h+vec2(e.x,0.)) - L(h-vec2(e.x,0.)), gy = L(h+vec2(0.,e.y)) - L(h-vec2(0.,e.y));
    float gm = length(vec2(gx,gy));
    vec2 dir = gm > 1e-4 ? normalize(vec2(-gy, gx)) : vec2(1.,0.);
    float a = 1. + uAniso * smoothstep(.02,.15,gm);
    q = mat2(dir.x, dir.y, -dir.y, dir.x) * vec2(q.x*a, q.y/sqrt(a));
  }
  float sz = mix(uSizeMin, uSizeMax, sqrt(b));
  float g = gid, bOut = b;
  if (uRamp > 1.5) {
    // BUILD: characters construct the image. Sobel in brightness space at cell scale picks edge-oriented glyphs,
    // brightness picks sparse..heavy tiers, coverage is partial (detail + light), cells jitter and tilt.
    vec2 e = uCellUv * .55; float lr = max(uLevels.y - uLevels.x, 1e-3);
    #define B_(o) pow(clamp((L(h + (o) * e) - uLevels.x) / lr, 0., 1.), uGamma)
    float tl = B_(vec2(-1., 1.)), tc = B_(vec2(0., 1.)), tr = B_(vec2(1., 1.));
    float ml = B_(vec2(-1., 0.)), mr = B_(vec2(1., 0.));
    float bl = B_(vec2(-1., -1.)), bc = B_(vec2(0., -1.)), br = B_(vec2(1., -1.));
    float gx = ((tr + 2. * mr + br) - (tl + 2. * ml + bl)) * .25, gy = ((tl + 2. * tc + tr) - (bl + 2. * bc + br)) * .25;
    float gm = length(vec2(gx, gy));
    float ed = smoothstep(uEdgeK.x, uEdgeK.y, gm);
    float pk = max(b, max(max(tl, tr), max(bl, br)) * .85);        // light nearby: edges of bright things show
    float p = clamp(uCov.x + uCov.y * pk + uCov.z * ed, 0., 1.) * (1. - uCov.w * smoothstep(.6, 1., b));   // w: thin out solid highlights
    // coverage + glyph variant are spatially coherent (clusters, patches of one character), not per-cell noise
    vec2 hp = h * vec2(uAspect, 1.);
    float cl = vnoise(hp * uClust.x + vec2(uTime * .04, uClust.w));
    if (mix(hsh(1.), cl, uClust.y) > p) keep = 0.;
    float v = floor(vnoise(hp * uClust.z + vec2(31.7 + uClust.w, uTime * uFlick)) * 16. + hsh(3.) * 1.5);
    bool edge = ed > .15 + .7 * hsh(2.);
    if (edge) {
      float th = atan(gy, gx) + 1.5707963;                                   // tangent
      th = mod(th + .3926991, 3.1415927);
      float bin = floor(th / .7853982);
      float res = th - (bin + .5) * .7853982;
      g = uEdgeOff + bin * 4. + mod(v, 4.);
      float ang = res * uEdgeRot;
      q = mat2(cos(ang), sin(ang), -sin(ang), cos(ang)) * q;
      bOut = clamp(max(b, pk * .8) * uEdgeB, 0., 1.);
    } else {
      float ti = clamp(floor((pow(b, .8) + (hsh(5.) - .5) * .12) * uTierN + uTierBias), 0., uTierN - 1.);
      g = uTierOff + ti * 8. + mod(v, 8.);
    }
    float wl = smoothstep(uWords - .06, uWords + .06, b + .08 * sin(cxy.y * .7 + uTime * .9 + rnd * 2.));
    if (wl > .5 && !edge) g = gid;
    float ang2 = (hsh(6.) - .5) * 2. * uJit.y;
    q = mat2(cos(ang2), sin(ang2), -sin(ang2), cos(ang2)) * q;
    sz = mix(uSizeMin, uSizeMax, b) * (1. + (hsh(7.) - .5) * 2. * uJit.z);
    h += (vec2(hsh(8.), hsh(9.)) - .5) * uJit.x * uCellUv * grow;
  }
  vec3 p0 = vec3((h.x-.5)*uAspect, h.y-.5, 0.);
  float kz = clamp((d-.5)*uDepthAmt / uCamD, -.9, .9);
  vec3 p = mix(p0, vec3(0., 0., uCamD), kz);
  // drift: loose cells breathe; scatter: cells peel off along a direction with per-cell delay
  p.xy += uDrift * .003 * vec2(sin(uTime*1.3+rnd*40.), cos(uTime*1.1+rnd*37.));
  float s = clamp(uScatter * 1.6 - rnd * .6, 0., 1.);
  p += uScatterDir * s * s * (0.4 + rnd) + vec3(0., 0., s * (rnd - .5) * .3);
  p.xy = p.xy * uScale + uOffset;
  p.xy += q * uCellUv * vec2(uAspect, 1.) * sz * grow * uScale * (1. - kz);
  gl_Position = uMVP * vec4(p, 1.);
  if (uRamp > .5 && uRamp < 1.5) {
    // ASCII world: structure from a brightness ramp; the song's words take over the highlights
    float bi = clamp(pow(b, .7) * 1.05 + .07, 0., 1.);
    g = uRampOff + min(uRampN - 1., floor(bi * (uRampN - .01)));
    float wl = smoothstep(uWords - .06, uWords + .06, b + .08 * sin(cxy.y * .7 + uTime * .9 + rnd * 2.));
    if (wl > .5) g = gid;
  }
  if (keep < .01) gl_Position = vec4(2., 2., 2., 1.);           // culled cell: no raster cost
  vUv = position.xy + .5; vCol = c; vW = keep; vGid = g; vB = bOut;
}`;

const FS = /* glsl */`
precision highp float;
uniform sampler2D uAtlas; uniform float uAtlasN;
uniform vec4 uShape;        // weights: dot, led, glyph, splat
uniform float uGain, uSat, uFloor, uNorm, uCrisp; uniform vec3 uTint; uniform float uTintAmt;
in vec2 vUv; in vec3 vCol; in float vW, vGid, vB;
out vec4 o;
void main(){
  if (vW < .01) discard;
  vec2 p = vUv - .5; float r = length(p) * 2.;
  float dot_ = 1. - smoothstep(.78, 1., r);
  vec2 ap = abs(p) * 2.; float led = (1. - smoothstep(.72, .9, max(ap.x, ap.y))) * (1. - .25 * r);
  int gi = int(vGid + .5), an = int(uAtlasN + .5);
  vec2 cell = vec2(float(gi % an), float(gi / an));
  vec2 auv = (cell + vec2(vUv.x, 1. - vUv.y)) / uAtlasN; auv.y = 1. - auv.y;
  float gl = texture(uAtlas, auv, -uCrisp).r;
  gl = mix(gl, smoothstep(.18, .62, gl), min(uCrisp, 1.));       // crisp glyph edges (build looks)
  float sp = exp(-r * r * 2.5);
  float w = dot(uShape, vec4(dot_, led, gl, sp));
  vec3 col = vCol;
  float l = dot(col, vec3(.299,.587,.114));
  col = max(mix(vec3(l), col, uSat), 0.);
  // chroma-normalize: dark areas keep their hue at a readable level (glyph shape carries the brightness)
  col = mix(col, col / max(max(col.r, max(col.g, col.b)), .03) * (.18 + .82 * vB), uNorm);
  col = mix(col, uTint * (.35 + l), uTintAmt);
  float bright = mix(uFloor, 1., vB);
  o = vec4(col * w * vW * uGain * bright, w * vW);
}`;

export class LatticeLayer {
  constructor({ plate, cell, W, region = 2, atlas, opts = {} }) {
    const aspect = plate.aspect;
    const cols = Math.ceil(W / cell * 1.12), rows = Math.ceil(cols / aspect);
    const n = cols * rows;
    const home = new Float32Array(n * 2), gid = new Float32Array(n), rnd = new Float32Array(n), cxy = new Float32Array(n * 2);
    const text = opts.text || DEFAULT_TEXT;
    let seed = opts.seed || 1;
    const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let y = 0, k = 0; y < rows; y++) for (let x = 0; x < cols; x++, k++) {
      home[k * 2] = (x + .5) / cols; home[k * 2 + 1] = 1 - (y + .5) / rows; cxy[k * 2] = x; cxy[k * 2 + 1] = y;
      gid[k] = Math.max(0, atlas.chars.indexOf(text[(y * cols + x) % text.length]));
      rnd[k] = rand();
    }
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(QUAD, 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    geo.setAttribute('home', new THREE.InstancedBufferAttribute(home, 2));
    geo.setAttribute('gid', new THREE.InstancedBufferAttribute(gid, 1));
    geo.setAttribute('rnd', new THREE.InstancedBufferAttribute(rnd, 1));
    geo.setAttribute('cxy', new THREE.InstancedBufferAttribute(cxy, 2));
    geo.instanceCount = n;
    const o = Object.assign({
      shape: [1, 0, 0, 0], sizeMin: .25, sizeMax: 1.0, gamma: 1.0, gain: 1.4, sat: 1.15, floor: .0,
      depthAmt: .25, aniso: 0, tint: '#ff7a1a', tintAmt: 0, drift: 0,
    }, opts);
    this.u = {
      uRgb: { value: plate.rgb }, uDepth: { value: plate.depth }, uMatte: { value: plate.matte },
      uAtlas: { value: atlas.tex }, uAtlasN: { value: atlas.n },
      uCellUv: { value: new THREE.Vector2(1 / cols, 1 / rows) }, uAspect: { value: aspect }, uRegion: { value: region },
      uDepthAmt: { value: o.depthAmt }, uTime: { value: 0 }, uLevels: { value: new THREE.Vector2(...(region === 1 ? plate.figLevels : plate.levels)) },
      uSizeMin: { value: o.sizeMin }, uSizeMax: { value: o.sizeMax }, uGamma: { value: o.gamma }, uAniso: { value: o.aniso },
      uDrift: { value: o.drift }, uScatter: { value: 0 }, uScatterDir: { value: new THREE.Vector3(0, 0, 0) },
      uOffset: { value: new THREE.Vector2(0, 0) }, uMVP: { value: new THREE.Matrix4() }, uCamD: { value: 2 }, uDensity: { value: o.density ?? 1 }, uScale: { value: 1 }, uCellUvF: { value: new THREE.Vector2() },
      uShape: { value: new THREE.Vector4(...o.shape) }, uGain: { value: o.gain }, uSat: { value: o.sat }, uFloor: { value: o.floor }, uNorm: { value: o.norm ?? 0 },
      uTint: { value: new THREE.Color(o.tint) }, uTintAmt: { value: o.tintAmt },
      uRamp: { value: o.build ? 2 : (o.ramp ? 1 : 0) }, uRampOff: { value: atlas.rampOff }, uRampN: { value: atlas.rampN }, uWords: { value: o.words ?? .62 },
      // build mode (o.build): coverage [base, light, edge], edge thresholds, jitter [pos, rot, size], tier bias, edge tilt, glyph flicker
      uCov: { value: new THREE.Vector4(...[...(o.cov || [1, 0, 0]), 0, 0].slice(0, 4)) }, uEdgeK: { value: new THREE.Vector2(...(o.edgeK || [.06, .22])) },
      uJit: { value: new THREE.Vector3(...(o.jit || [0, 0, 0])) }, uTierBias: { value: o.tierBias ?? 0 }, uEdgeRot: { value: o.edgeRot ?? .6 },
      uFlick: { value: o.flick ?? 0 }, uEdgeB: { value: o.edgeB ?? 1 }, uCrisp: { value: o.crisp ?? 0 },
      uClust: { value: new THREE.Vector4(...(o.clust || [12, 0, 18]).slice(0, 3), (o.seed || 1) * 1.37) },
      uTierOff: { value: atlas.tierOff ?? 0 }, uTierN: { value: atlas.tierN ?? 1 }, uEdgeOff: { value: atlas.edgeOff ?? 0 },
    };
    const mat = new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VS, fragmentShader: FS, uniforms: this.u,
      transparent: true, depthTest: false, depthWrite: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    });
    this.mesh = new THREE.Mesh(geo, mat); this.mesh.frustumCulled = false;
    this.paint = !!o.paint;
  }
  set(k, v) { const u = this.u[k]; if (u.value?.set && Array.isArray(v)) u.value.set(...v); else if (u.value?.set && typeof v === 'string') u.value.set(v); else u.value = v; }
}

// Accumulate light layers into a float target, then resolve.
// mode 'light': sum of light on black.  mode 'paint': normalized colour * coverage.
export class LatticeView {
  constructor(renderer, W, H) {
    this.r = renderer; this.W = W; this.H = H;
    this.acc = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false });
    this.accP = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType, depthBuffer: false });
    this.scene = new THREE.Scene(); this.sceneP = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(30, W / H, .01, 100);
  }
  // camera that makes a plate of height 1 and width `aspect` cover the frame with `over` overscan
  frame(aspect, { over = 1.06, orbit = 0, dolly = 1, pan = [0, 0], roll = 0 } = {}) {
    const A = this.W / this.H, visH = (aspect >= A ? 1 : aspect / A) / over;
    const dist = visH / 2 / Math.tan(THREE.MathUtils.degToRad(15)) * dolly;
    this.cam.position.set(pan[0] + Math.sin(orbit) * dist, pan[1], Math.cos(orbit) * dist);
    this.restD = visH / 2 / Math.tan(THREE.MathUtils.degToRad(15));
    this.cam.up.set(Math.sin(roll), Math.cos(roll), 0);
    this.cam.lookAt(pan[0], pan[1], 0); this.cam.updateMatrixWorld();
    return new THREE.Matrix4().multiplyMatrices(this.cam.projectionMatrix, this.cam.matrixWorldInverse);
  }
  // returns {light, paint|null}; layers with paint:true go to the paint target (normalized at resolve)
  render(layers, mvp, t) {
    this.scene.children.length = 0; this.sceneP.children.length = 0;
    for (const l of layers) { if (l.mvp) l.u.uMVP.value.copy(l.mvp); else l.u.uMVP.value.copy(mvp); l.u.uCamD.value = this.restD; l.u.uTime.value = t; (l.paint ? this.sceneP : this.scene).add(l.mesh); }
    this.r.setClearColor(0x000000, 0);
    this.r.setRenderTarget(this.acc); this.r.clear(); this.r.render(this.scene, this.cam);
    const hasP = this.sceneP.children.length > 0;
    if (hasP) { this.r.setRenderTarget(this.accP); this.r.clear(); this.r.render(this.sceneP, this.cam); }
    this.r.setRenderTarget(null);
    this.light = this.acc.texture; this.paintTex = hasP ? this.accP.texture : null;
    return this.acc.texture;
  }
}

export async function loadPlate(base, frame = 0) {
  const tl = new THREE.TextureLoader();
  const f = String(frame).padStart(6, '0');
  const ld = (u, srgb) => new Promise((res, rej) => tl.load(u, t => {
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.minFilter = THREE.LinearFilter; t.generateMipmaps = false; res(t);
  }, undefined, rej));
  const meta = await (await fetch(`${base}/meta.json`)).json();
  const [rgb, depth, matte] = await Promise.all([ld(`${base}/rgb/${f}.jpg`, true), ld(`${base}/depth/${f}.png`), ld(`${base}/matte/${f}.png`)]);
  return { meta, rgb, depth, matte, aspect: meta.w / meta.h, levels: levels(rgb.image, .02, .985, matte.image, false).map(v => Math.pow(v, 2.2)),
    figLevels: levels(rgb.image, .02, .995, matte.image, true).map(v => Math.pow(v, 2.2)) };
}
