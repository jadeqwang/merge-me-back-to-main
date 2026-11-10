// Post: ink outline (from aux/depth), sub-frame accumulation, bloom pyramid, anamorphic streak, filmic tonemap + grade, vignette, grain, CA, HUD.
import { Program, VS_TRI, FS_HEAD, drawTri, tex, fbo, hex } from './glx.js';

export class Post {
  constructor(gl, W, H) {
    this.gl = gl; this.W = W; this.H = H;
    const F = FS_HEAD + 'in vec2 vUv; out vec4 o;\n';
    this.pOutline = new Program(gl, VS_TRI, F + `
uniform sampler2D uAux, uDepth; uniform vec2 uPx; uniform float uWidth, uNear, uFar, uStrength; uniform vec3 uInk;
float lin(float z){ return uNear*uFar/(uFar - z*(uFar-uNear)); }
void main(){
  vec4 c = texture(uAux, vUv); float zc = lin(texture(uDepth, vUv).r);
  float e = 0., any = c.a;
  for (int i=0;i<8;i++){ float a = float(i)*0.7853982; vec2 q = vUv + vec2(cos(a), sin(a))*uPx*uWidth;
    vec4 s = texture(uAux, q); float z = lin(texture(uDepth, q).r);
    any = max(any, s.a);
    e = max(e, step(0.06, length(s.rgb - c.rgb) + abs(s.a - c.a)));
    e = max(e, step(0.10, abs(z - zc)/min(z, zc)) * min(s.a, c.a)); }
  float a = e * step(0.5, any) * uStrength;
  o = vec4(uInk*a, a);
}`, 'outline');
    this.pCopy = new Program(gl, VS_TRI, F + `uniform sampler2D uT; void main(){ o = vec4(texture(uT, vUv).rgb, 1.); }`, 'copy');
    this.pPre = new Program(gl, VS_TRI, F + `
uniform sampler2D uT; uniform vec2 uPx; uniform float uThr, uKnee;
vec3 s(vec2 d){ return min(texture(uT, vUv + d*uPx).rgb, vec3(48.)); }
void main(){
  vec3 c = (s(vec2(-1,-1)) + s(vec2(1,-1)) + s(vec2(-1,1)) + s(vec2(1,1)))*0.25;
  float br = max(c.r, max(c.g, c.b));
  float soft = clamp(br - uThr + uKnee, 0., 2.*uKnee); soft = soft*soft/(4.*uKnee + 1e-4);
  float k = max(soft, br - uThr)/max(br, 1e-4);
  o = vec4(c*k, 1.);
}`, 'bloompre');
    this.pDown = new Program(gl, VS_TRI, F + `
uniform sampler2D uT; uniform vec2 uPx;
void main(){ vec3 c = texture(uT, vUv).rgb*4.;
  c += texture(uT, vUv + vec2(-1,-1)*uPx).rgb + texture(uT, vUv + vec2(1,-1)*uPx).rgb + texture(uT, vUv + vec2(-1,1)*uPx).rgb + texture(uT, vUv + vec2(1,1)*uPx).rgb;
  o = vec4(c/8., 1.); }`, 'down');
    this.pUp = new Program(gl, VS_TRI, F + `
uniform sampler2D uT; uniform vec2 uPx; uniform float uW;
void main(){ vec3 c = texture(uT, vUv).rgb*4.;
  c += (texture(uT, vUv + vec2(-1,0)*uPx).rgb + texture(uT, vUv + vec2(1,0)*uPx).rgb + texture(uT, vUv + vec2(0,-1)*uPx).rgb + texture(uT, vUv + vec2(0,1)*uPx).rgb)*2.;
  c += texture(uT, vUv + vec2(-1,-1)*uPx).rgb + texture(uT, vUv + vec2(1,-1)*uPx).rgb + texture(uT, vUv + vec2(-1,1)*uPx).rgb + texture(uT, vUv + vec2(1,1)*uPx).rgb;
  o = vec4(c/16.*uW, 1.); }`, 'up');
    this.pStreak = new Program(gl, VS_TRI, F + `
uniform sampler2D uT; uniform vec2 uStep; uniform float uThr;
void main(){ vec3 c = vec3(0.); float ws = 0.;
  for (int i=-6;i<=6;i++){ float w = exp(-float(i*i)/14.); vec3 s = texture(uT, vUv + uStep*float(i)).rgb; if (uThr > 0.) s = max(s - uThr, 0.); c += s*w; ws += w; }
  o = vec4(c/ws, 1.); }`, 'streak');
    this.pFinal = new Program(gl, VS_TRI, F + `
uniform sampler2D uScene, uBloom, uStreak, uHud; uniform vec2 uRes;
uniform float uBloomG, uStreakG, uExposure, uContrast, uSat, uVig, uGrain, uCA, uSeed, uHudOn;
uniform vec3 uLift, uGain, uStreakTint;
vec3 hdr(vec2 uv){ return texture(uScene, uv).rgb + texture(uBloom, uv).rgb*uBloomG + texture(uStreak, uv).rgb*uStreakTint*uStreakG; }
vec3 aces(vec3 x){ return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0., 1.); }
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
void main(){
  vec2 c = vUv - 0.5; float r2 = dot(c, c);
  vec2 sh = c * (uCA * 2.4 / uRes.x) * (0.3 + r2*2.4);
  vec3 x = vec3(hdr(vUv + sh).r, hdr(vUv).g, hdr(vUv - sh).b);
  x *= uExposure;
  // filmic: ACES-fit per channel blended with a hue-keeping version, so neon cores go white-hot but colours do not all bleach
  float pk = max(x.r, max(x.g, x.b));
  x *= 0.6; pk *= 0.6;
  vec3 a1 = aces(x); vec3 a2 = x / max(pk, 1e-5) * aces(vec3(pk)).r;
  vec3 y = mix(a2, a1, 0.62);
  float l = dot(y, vec3(0.2126, 0.7152, 0.0722));
  y = mix(vec3(l), y, uSat);
  y = clamp((y - 0.18)*uContrast + 0.18, 0., 1.);
  y = y*uGain + uLift*(1. - y);
  // vignette (in linear), then display encode
  float vig = 1. - uVig * smoothstep(0.18, 0.95, r2*1.7);
  y *= vig;
  y = pow(clamp(y, 0., 1.), vec3(1./2.2));
  // fine grain, luminance-shaped, and a half-LSB dither
  float g = h12(gl_FragCoord.xy + uSeed*vec2(37.1, 91.7)) + h12(gl_FragCoord.yx*1.3 + uSeed*vec2(11.3, 5.9)) - 1.;
  float lum = dot(y, vec3(0.3, 0.59, 0.11));
  y += g * uGrain * (0.35 + 0.65*sqrt(clamp(1.-abs(lum-0.4)*1.6, 0., 1.)));
  if (uHudOn > 0.5) { vec4 h = texture(uHud, vUv); y = y*(1. - h.a) + h.rgb; }
  y += (h12(gl_FragCoord.xy*0.731 + 7.) - 0.5)/255.;
  o = vec4(y, 1.);
}`, 'final');

    const hdrTex = (w, h) => tex(gl, { w, h, internal: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT });
    this.accT = hdrTex(W, H); this.accF = fbo(gl, [this.accT]);
    this.levels = [];
    let w = W, h = H;
    for (let i = 0; i < 7; i++) { w = Math.max(2, w >> 1); h = Math.max(2, h >> 1); const t = hdrTex(w, h); this.levels.push({ t, f: fbo(gl, [t]), w, h }); }
    const sw = W >> 2, shh = H >> 2;
    this.sA = hdrTex(sw, shh); this.sAF = fbo(gl, [this.sA]); this.sB = hdrTex(sw, shh); this.sBF = fbo(gl, [this.sB]); this.sw = sw; this.sh = shh;
    this.hudTex = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.hudTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.ink = hex('#14122B');
  }
  // ink outline blended into the scene colour (bound FBO must be colour-only: we sample aux + depth)
  outline(aux, depth, cam, o = {}) {
    const gl = this.gl; if ((o.strength ?? 1) <= 0) return;
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); gl.disable(gl.DEPTH_TEST);
    this.pOutline.use().set({ uAux: aux, uDepth: depth, uPx: [1 / this.W, 1 / this.H], uWidth: o.width ?? 1.4, uNear: cam.near, uFar: cam.far, uStrength: o.strength ?? 1, uInk: o.color || this.ink });
    drawTri(gl); gl.disable(gl.BLEND);
  }
  beginAccum() { const gl = this.gl; gl.bindFramebuffer(gl.FRAMEBUFFER, this.accF); gl.viewport(0, 0, this.W, this.H); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT); }
  accumulate(sceneTex, weight) {
    const gl = this.gl; gl.bindFramebuffer(gl.FRAMEBUFFER, this.accF); gl.viewport(0, 0, this.W, this.H);
    gl.disable(gl.DEPTH_TEST); gl.enable(gl.BLEND); gl.blendColor(0, 0, 0, weight); gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE);
    this.pCopy.use().set({ uT: sceneTex }); drawTri(gl); gl.disable(gl.BLEND);
  }
  // g = env.grade (all optional)
  finish(g = {}, hudCanvas = null, seed = 0) {
    const gl = this.gl, L = this.levels;
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
    // bloom: prefilter -> down chain
    gl.bindFramebuffer(gl.FRAMEBUFFER, L[0].f); gl.viewport(0, 0, L[0].w, L[0].h);
    this.pPre.use().set({ uT: this.accT, uPx: [0.5 / this.W * 2, 0.5 / this.H * 2].map((v) => v * 0.5), uThr: g.bloomThreshold ?? 1.0, uKnee: g.bloomKnee ?? 0.5 }); drawTri(gl);
    for (let i = 1; i < L.length; i++) { gl.bindFramebuffer(gl.FRAMEBUFFER, L[i].f); gl.viewport(0, 0, L[i].w, L[i].h); this.pDown.use().set({ uT: L[i - 1].t, uPx: [1 / L[i - 1].w, 1 / L[i - 1].h] }); drawTri(gl); }
    // streak from the quarter-res level (before the up-chain adds into it)
    const sg = g.streak ?? 0.22;
    if (sg > 0) {
      let src = L[1].t, thr = g.streakThreshold ?? 1.2; const steps = [1.5, 4.5, 13.5];
      for (let k = 0; k < steps.length; k++) { const dstF = k % 2 === 0 ? this.sAF : this.sBF; gl.bindFramebuffer(gl.FRAMEBUFFER, dstF); gl.viewport(0, 0, this.sw, this.sh);
        this.pStreak.use().set({ uT: src, uStep: [steps[k] / this.sw, 0], uThr: k === 0 ? thr : 0 }); drawTri(gl); src = k % 2 === 0 ? this.sA : this.sB; }
      this.streakTex = src;
    }
    // up chain: add each coarser level into the finer one
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    const spread = g.bloomSpread ?? 0.72;
    for (let i = L.length - 1; i > 0; i--) { gl.bindFramebuffer(gl.FRAMEBUFFER, L[i - 1].f); gl.viewport(0, 0, L[i - 1].w, L[i - 1].h); this.pUp.use().set({ uT: L[i].t, uPx: [1 / L[i].w, 1 / L[i].h], uW: spread }); drawTri(gl); }
    gl.disable(gl.BLEND);
    // HUD
    let hudOn = 0;
    if (hudCanvas) { gl.bindTexture(gl.TEXTURE_2D, this.hudTex); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, hudCanvas); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false); hudOn = 1; }
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, this.W, this.H);
    this.pFinal.use().set({ uScene: this.accT, uBloom: L[0].t, uStreak: sg > 0 ? this.streakTex : L[0].t, uHud: this.hudTex, uRes: [this.W, this.H],
      uBloomG: (g.bloom ?? 0.5) * 0.28, uStreakG: sg, uStreakTint: g.streakTint || [0.75, 0.85, 1.0], uExposure: g.exposure ?? 1, uContrast: g.contrast ?? 1.04, uSat: g.saturation ?? 1.08,
      uVig: g.vignette ?? 0.32, uGrain: g.grain ?? 0.028, uCA: g.ca ?? 1, uSeed: seed, uHudOn: hudOn, uLift: g.lift || [0, 0, 0], uGain: g.gain || [1, 1, 1] });
    drawTri(gl);
  }
}
