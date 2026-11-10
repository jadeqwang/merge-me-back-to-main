// Figure lab: a minimal standalone renderer (own camera, HDR target, mirror reflection, bloom, outline, tonemap)
// used to look-dev the figure before / outside the real engine. The figure only ever sees the Drawable ctx.
import { Figure, LANES } from '../engine/src/figure/figure.js';
import { testTrack, loadTrack } from '../engine/src/figure/skeleton.js';
import { perspective, lookAt, mat4mul } from '../engine/src/figure/m.js';

const W = 1920, H = 1080;
const canvas = document.getElementById('c'); canvas.width = W; canvas.height = H;
const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
gl.getExtension('EXT_color_buffer_float'); gl.getExtension('OES_texture_float_linear');

function prog(vs, fs) {
  const mk = (t, s) => { const sh = gl.createShader(t); gl.shaderSource(sh, s); gl.compileShader(sh); if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(sh) + '\n' + s); return sh; };
  const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
  const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const a = gl.getActiveUniform(p, i); u[a.name] = gl.getUniformLocation(p, a.name); } return { p, u };
}
function tex(w, h, internal = gl.RGBA16F, filter = gl.LINEAR) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texStorage2D(gl.TEXTURE_2D, 1, internal, w, h);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); return t;
}
function fbo(w, h, nColor = 1, depth = true) {
  const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); const c = [];
  for (let i = 0; i < nColor; i++) { const t = tex(w, h); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, t, 0); c.push(t); }
  if (depth) { const d = gl.createRenderbuffer(); gl.bindRenderbuffer(gl.RENDERBUFFER, d); gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT24, w, h); gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, d); }
  gl.drawBuffers(c.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
  if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) throw new Error('fbo incomplete');
  return { f, c, w, h };
}
const FSQ = `#version 300 es
out vec2 v; void main(){ v = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2); gl_Position = vec4(v * 2.0 - 1.0, 0.0, 1.0); }`;
const SKY = prog(FSQ, `#version 300 es
precision highp float; in vec2 v; layout(location=0) out vec4 o; layout(location=1) out vec4 o1;
uniform mat4 u_inv; uniform vec3 u_cam; uniform float u_dawn, u_ground; uniform sampler2D u_refl; uniform vec2 u_res;
float h21(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec3 sky(vec3 d){
  float y = max(d.y, 0.0), k = pow(1.0 - y, 5.0);
  vec3 night = mix(vec3(0.012, 0.014, 0.060), vec3(0.030, 0.050, 0.200), k) + vec3(0.0, 0.05, 0.06) * pow(1.0 - y, 16.0);
  vec3 sunD = normalize(vec3(1.0, 0.045, 0.0)); float sd = dot(d, sunD);
  vec3 rise = mix(vec3(0.30, 0.22, 0.52), vec3(1.0, 0.50, 0.36), pow(1.0 - y, 2.2)) + vec3(1.0, 0.62, 0.22) * (pow(max(sd, 0.0), 6.0) * 0.45 + pow(1.0 - y, 10.0) * 0.35);
  rise += vec3(1.0, 0.72, 0.36) * 1.5 * smoothstep(0.9930, 0.9940, sd);
  vec3 day = mix(vec3(0.55, 0.72, 0.98), vec3(1.0, 0.93, 0.80), pow(1.0 - y, 2.5));
  float a = smoothstep(0.15, 0.6, u_dawn), b = smoothstep(0.62, 0.95, u_dawn);
  vec3 c = mix(mix(night, rise, a), day, b);
  vec2 sp = vec2(atan(d.z, d.x), asin(clamp(d.y, -1.0, 1.0))) * 180.0; vec2 id = floor(sp);
  float st = step(0.993, h21(id)) * smoothstep(0.35, 0.0, length(fract(sp) - 0.5)) * (1.0 - a);
  return c + st * vec3(0.7, 0.8, 1.0) * 0.8;
}
void main(){
  vec4 p = u_inv * vec4(v * 2.0 - 1.0, 1.0, 1.0); vec3 d = normalize(p.xyz / p.w - u_cam);
  o1 = vec4(0.0);
  if (d.y >= 0.0 || u_ground < 0.5) { o = vec4(sky(d), 1.0); return; }
  // mirror ground: blurred reflection of the mirrored render, fresnel-weighted
  float t = -u_cam.y / d.y; vec3 hit = u_cam + d * t; float fres = 0.62 + 0.38 * pow(1.0 - abs(d.y), 4.0);
  vec2 uv = gl_FragCoord.xy / u_res; vec3 r = vec3(0.0); float ws = 0.0;
  float rip = sin(hit.x * 9.0 + sin(hit.z * 7.0)) * 0.0009 + sin(hit.z * 23.0) * 0.0004;
  for (int i = -3; i <= 3; i++) { float w = 1.0 - abs(float(i)) / 4.0; r += texture(u_refl, uv + vec2(rip, float(i) * 0.0016)).rgb * w; ws += w; }
  r /= ws; float b = smoothstep(0.62, 0.95, u_dawn);
  vec3 base = mix(vec3(0.003, 0.004, 0.010), vec3(0.80, 0.78, 0.74), b);
  o = vec4(base + r * fres * mix(0.72, 0.55, b), 1.0);
}`);
const DOWN = prog(FSQ, `#version 300 es
precision highp float; in vec2 v; out vec4 o; uniform sampler2D u_t; uniform vec2 u_px; uniform float u_thr;
void main(){ vec3 c = vec3(0.0); for (int i = 0; i < 4; i++) { vec2 d = vec2(float(i & 1) * 2.0 - 1.0, float(i >> 1) * 2.0 - 1.0) * u_px; c += texture(u_t, v + d).rgb; }
  c *= 0.25; if (u_thr > 0.0) { float l = max(c.r, max(c.g, c.b)); c *= smoothstep(u_thr * 0.5, u_thr * 2.0, l); } o = vec4(c, 1.0); }`);
const UP = prog(FSQ, `#version 300 es
precision highp float; in vec2 v; out vec4 o; uniform sampler2D u_t; uniform vec2 u_px;
void main(){ vec3 c = vec3(0.0); float ws = 0.0; for (int y = -1; y <= 1; y++) for (int x = -1; x <= 1; x++) { float w = (2.0 - abs(float(x))) * (2.0 - abs(float(y))); c += texture(u_t, v + vec2(x, y) * u_px).rgb * w; ws += w; } o = vec4(c / ws, 1.0); }`);
const POST = prog(FSQ, `#version 300 es
precision highp float; in vec2 v; out vec4 o; uniform sampler2D u_c, u_aux, u_b; uniform vec2 u_px; uniform float u_bloom, u_exp;
vec3 aces(vec3 x){ return clamp((x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14), 0.0, 1.0); }
void main(){
  vec3 c = texture(u_c, v).rgb; vec4 a = texture(u_aux, v);
  // ink outline where the flat part colour changes (cel only: weighted by aux alpha)
  float e = 0.0, am = a.a; for (int i = 0; i < 4; i++) { vec2 d = vec2(i == 0 ? 1.0 : i == 1 ? -1.0 : 0.0, i == 2 ? 1.0 : i == 3 ? -1.0 : 0.0) * u_px * 1.25; vec4 n = texture(u_aux, v + d); e = max(e, length(n.rgb * n.a - a.rgb * a.a)); am = max(am, n.a); }
  c = mix(c, vec3(0.045, 0.035, 0.07), smoothstep(0.10, 0.22, e) * am * 0.92);
  c += texture(u_b, v).rgb * u_bloom;
  c *= u_exp; float m = max(c.r, max(c.g, c.b)) + 1e-5; c = mix(c * (aces(vec3(m)).r / m), aces(c), 0.35); c = pow(c, vec3(1.0 / 2.2));
  float vg = smoothstep(1.25, 0.35, length((v - 0.5) * vec2(1.6, 1.0))); c *= mix(0.80, 1.0, vg);
  o = vec4(c, 1.0);
}`);

const scene = fbo(W, H, 2, true), refl = fbo(W, H, 2, true);
const mips = []; for (let i = 1; i <= 6; i++) mips.push(fbo(W >> i, H >> i, 1, false));
const mips2 = mips.map((m) => fbo(m.w, m.h, 1, false));
const quad = () => gl.drawArrays(gl.TRIANGLES, 0, 3);
const bindTex = (unit, t, loc) => { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(loc, unit); };
function inv4(m) { // general 4x4 inverse
  const a = m, o = new Float32Array(16), b = new Float32Array(12);
  b[0] = a[0] * a[5] - a[1] * a[4]; b[1] = a[0] * a[6] - a[2] * a[4]; b[2] = a[0] * a[7] - a[3] * a[4]; b[3] = a[1] * a[6] - a[2] * a[5]; b[4] = a[1] * a[7] - a[3] * a[5]; b[5] = a[2] * a[7] - a[3] * a[6];
  b[6] = a[8] * a[13] - a[9] * a[12]; b[7] = a[8] * a[14] - a[10] * a[12]; b[8] = a[8] * a[15] - a[11] * a[12]; b[9] = a[9] * a[14] - a[10] * a[13]; b[10] = a[9] * a[15] - a[11] * a[13]; b[11] = a[10] * a[15] - a[11] * a[14];
  const det = 1 / (b[0] * b[11] - b[1] * b[10] + b[2] * b[9] + b[3] * b[8] - b[4] * b[7] + b[5] * b[6]);
  o[0] = (a[5] * b[11] - a[6] * b[10] + a[7] * b[9]) * det; o[1] = (a[2] * b[10] - a[1] * b[11] - a[3] * b[9]) * det; o[2] = (a[13] * b[5] - a[14] * b[4] + a[15] * b[3]) * det; o[3] = (a[10] * b[4] - a[9] * b[5] - a[11] * b[3]) * det;
  o[4] = (a[6] * b[8] - a[4] * b[11] - a[7] * b[7]) * det; o[5] = (a[0] * b[11] - a[2] * b[8] + a[3] * b[7]) * det; o[6] = (a[14] * b[2] - a[12] * b[5] - a[15] * b[1]) * det; o[7] = (a[8] * b[5] - a[10] * b[2] + a[11] * b[1]) * det;
  o[8] = (a[4] * b[10] - a[5] * b[8] + a[7] * b[6]) * det; o[9] = (a[1] * b[8] - a[0] * b[10] - a[3] * b[6]) * det; o[10] = (a[12] * b[4] - a[13] * b[2] + a[15] * b[0]) * det; o[11] = (a[9] * b[2] - a[8] * b[4] - a[11] * b[0]) * det;
  o[12] = (a[5] * b[7] - a[4] * b[9] - a[6] * b[6]) * det; o[13] = (a[0] * b[9] - a[1] * b[7] + a[2] * b[6]) * det; o[14] = (a[13] * b[1] - a[12] * b[3] - a[14] * b[0]) * det; o[15] = (a[8] * b[3] - a[9] * b[1] + a[10] * b[0]) * det;
  return o;
}

// ---------------------------------------------------------------------------------------------
const fig = new Figure(gl);
function camera(c) {
  const el = c.el || 0, az = c.az || 0, d = c.dist || 4, t = c.target || [0, 0.9, 0];
  const eye = [t[0] + d * Math.sin(az) * Math.cos(el), t[1] + d * Math.sin(el), t[2] + d * Math.cos(az) * Math.cos(el)];
  const fovY = (c.fov || 32) * Math.PI / 180, view = lookAt(eye, t), proj = perspective(fovY, W / H, 0.05, 2000);
  return { eye, view, proj, fovY, focus: c.focus || d, aperture: c.aperture || 0 };
}
function renderFrame(shot, time = 0) {
  const cam = camera(shot.cam), dawn = shot.dawn || 0;
  fig.begin(); for (const o of shot.inst(time)) fig.add(o);
  const pass = (target, view, reflect) => {
    const vp = mat4mul(cam.proj, view);
    const v = view, camPos = [-(v[0] * v[12] + v[1] * v[13] + v[2] * v[14]), -(v[4] * v[12] + v[5] * v[13] + v[6] * v[14]), -(v[8] * v[12] + v[9] * v[13] + v[10] * v[14])];
    gl.bindFramebuffer(gl.FRAMEBUFFER, target.f); gl.viewport(0, 0, W, H); gl.depthMask(true); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.useProgram(SKY.p);
    gl.uniformMatrix4fv(SKY.u.u_inv, false, inv4(vp)); gl.uniform3fv(SKY.u.u_cam, camPos); gl.uniform1f(SKY.u.u_dawn, dawn); gl.uniform1f(SKY.u.u_ground, reflect ? 0 : 1); gl.uniform2f(SKY.u.u_res, W, H);
    bindTex(0, reflect ? mips[5].c[0] : refl.c[0], SKY.u.u_refl); quad();
    const ctx = { gl, W, H, reflect, view, proj: cam.proj, viewProj: vp, camPos, fovY: cam.fovY, focusDist: cam.focus, aperture: cam.aperture, dawn, t: time, sunDir: [0.999, 0.045, 0] };
    fig.draw({ ...ctx, pass: 'opaque' }); fig.draw({ ...ctx, pass: 'add' });
  };
  const mv = new Float32Array(cam.view); mv[4] = -mv[4]; mv[5] = -mv[5]; mv[6] = -mv[6]; mv[7] = -mv[7];
  pass(refl, mv, true); pass(scene, cam.view, false);
  // bloom
  gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND);
  let src = scene.c[0], sw = W, sh = H;
  gl.useProgram(DOWN.p);
  mips.forEach((m, i) => { gl.bindFramebuffer(gl.FRAMEBUFFER, m.f); gl.viewport(0, 0, m.w, m.h); bindTex(0, src, DOWN.u.u_t); gl.uniform2f(DOWN.u.u_px, 0.5 / sw, 0.5 / sh); gl.uniform1f(DOWN.u.u_thr, i === 0 ? (shot.bloomThr ?? (dawn > 0.3 ? 1.6 : 0.9)) : 0); quad(); src = m.c[0]; sw = m.w; sh = m.h; });
  gl.useProgram(UP.p); gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
  for (let i = mips.length - 1; i > 0; i--) { const dst = mips[i - 1]; gl.bindFramebuffer(gl.FRAMEBUFFER, dst.f); gl.viewport(0, 0, dst.w, dst.h); bindTex(0, mips[i].c[0], UP.u.u_t); gl.uniform2f(UP.u.u_px, 1 / mips[i].w, 1 / mips[i].h); quad(); }
  gl.disable(gl.BLEND);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, H); gl.useProgram(POST.p);
  bindTex(0, scene.c[0], POST.u.u_c); bindTex(1, scene.c[1], POST.u.u_aux); bindTex(2, mips[0].c[0], POST.u.u_b);
  gl.uniform2f(POST.u.u_px, 1 / W, 1 / H); gl.uniform1f(POST.u.u_bloom, shot.bloom ?? (dawn > 0.3 ? 0.07 : 0.14)); gl.uniform1f(POST.u.u_exp, shot.exp ?? 1.0); quad();
}

// ---------------------------------------------------------------------------------------------
const PI = Math.PI;
const one = (o) => () => [o];
const full = { target: [0, 0.86, 0], dist: 5.4, fov: 24 }, close = { target: [0, 1.40, 0], dist: 2.0, fov: 24 };
const sunCam = (o = {}) => ({ target: [0, 1.0, 0], dist: 6.2, fov: 22, az: -PI / 2, el: 0.012, ...o });
const grid = (n, sp, fn) => { const a = []; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) a.push(fn(i, j, (i - (n - 1) / 2) * sp, (j - (n - 1) / 2) * sp)); return a; };
const laneList = ['main', 'rose', 'blue', 'cyan', 'mint', 'gold', 'coral', 'magenta'];
const crowd = (n, sp, o) => grid(n, sp, (i, j, x, z) => { const k = i * n + j + 1, r = (q) => { const s = Math.sin(k * q) * 43758.5453; return s - Math.floor(s); }; return { pos: [x + (r(12.9) - 0.5) * 0.5, 0, z + (r(78.2) - 0.5) * 0.5], seed: k, lane: LANES[laneList[Math.floor(r(3.3) * laneList.length)]], story: 1 + (k % 11), ...o(i, j, r) }; });
const SHOTS = {
  // light (night)
  light_start_34back: { cam: { ...full, az: PI - 0.62, el: 0.05 }, inst: one({ track: 'idle', time: 3.0, lane: LANES.main }) },
  light_front_full: { cam: { ...full, az: 0.30, el: 0.04 }, inst: one({ track: 'idle', time: 3.0, lane: LANES.main }) },
  light_side_full: { cam: { ...full, az: PI / 2, el: 0.03 }, inst: one({ track: 'idle', time: 3.0, lane: LANES.main }) },
  light_front_close: { cam: { ...close, az: 0.35, el: 0.02 }, inst: one({ track: 'idle', time: 3.0, lane: LANES.main }) },
  light_back_close: { cam: { ...close, target: [0, 1.30, 0], az: PI - 0.25, el: 0.03 }, inst: one({ track: 'idle', time: 3.0, lane: LANES.main }) },
  light_density: { cam: { target: [0, 0.86, 0], dist: 7.2, fov: 24, az: 0.22, el: 0.04 }, inst: () => [0.15, 0.5, 1.0].map((d, i) => ({ pos: [(i - 1) * 1.45, 0, 0], track: 'idle', time: 3.0 + i * 1.1, lane: LANES.cyan, density: d })) },
  light_lanes: { cam: { target: [0, 0.86, 0], dist: 9.5, fov: 24, az: 0.0, el: 0.05 }, inst: () => ['rose', 'gold', 'mint', 'main', 'blue', 'magenta', 'coral'].map((l, i) => ({ pos: [(i - 3) * 1.15, 0, 0], yaw: (i - 3) * -0.12, track: 'walk_loop', time: i * 0.137, lane: LANES[l], story: i + 1 })) },
  light_run_behind: { cam: { target: [0, 1.0, 0], dist: 4.6, fov: 26, az: PI - 0.35, el: 0.06 }, inst: one({ track: 'run_loop', time: 2.2, lane: LANES.main }) },
  light_run_side: { cam: { target: [0, 0.95, 0], dist: 5.4, fov: 24, az: PI / 2 - 0.25, el: 0.03 }, inst: one({ track: 'sprint_loop', time: 2.1, lane: LANES.main }) },
  light_butterfly_trail: { cam: { target: [0, 1.0, 0], dist: 6.4, fov: 24, az: 1.0, el: 0.03 }, inst: one({ track: 'butterfly', time: 1.26, lane: LANES.main, trail: { len: 0.5, gain: 1.4, mask: ['handL', 'handR', 'toeL', 'toeR', 'hemL', 'hemR'], width: 0.035 } }) },
  light_sidekick: { cam: { target: [0, 1.0, 0], dist: 6.0, fov: 24, az: 0.9, el: 0.03 }, inst: one({ track: 'sidekick', time: 1.2, lane: LANES.rose }) },
  bun_violet_back: { cam: { ...full, az: PI - 0.6, el: 0.06 }, inst: one({ track: 'idle', time: 5.0, lane: LANES.violet, variant: 'bun', story: 12 }) },
  bun_violet_close: { cam: { ...close, target: [0, 1.48, 0], dist: 1.8, az: 0.75, el: 0.05 }, inst: one({ track: 'idle', time: 5.0, lane: LANES.violet, variant: 'bun', story: 12 }) },
  // silhouette (sunrise)
  sil_butterfly: { dawn: 0.6, cam: sunCam({ target: [0, 1.15, 0] }), inst: one({ track: 'butterfly', time: 1.24, solid: 1, yaw: 0.9 }) },
  sil_sidekick: { dawn: 0.6, cam: sunCam(), inst: one({ track: 'sidekick', time: 1.2, solid: 1, yaw: PI / 2 }) },
  sil_sidekick_b: { dawn: 0.6, cam: sunCam(), inst: one({ track: 'sidekick', time: 1.2, solid: 1, yaw: -PI / 2 }) },
  sil_butterfly_b: { dawn: 0.6, cam: sunCam({ target: [0, 1.15, 0] }), inst: one({ track: 'butterfly', time: 1.24, solid: 1, yaw: -0.7 }) },
  sil_butterfly_c: { dawn: 0.6, cam: sunCam({ target: [0, 1.15, 0] }), inst: one({ track: 'butterfly', time: 1.12, solid: 1, yaw: 2.4 }) },
  sil_run: { dawn: 0.6, cam: sunCam({ target: [0, 0.95, 0] }), inst: one({ track: 'sprint_loop', time: 2.1, solid: 1 }) },
  sil_idle_34: { dawn: 0.6, cam: sunCam({ target: [0, 0.9, 0], az: -PI / 2 - 0.5, dist: 5.6, el: 0.02 }), inst: one({ track: 'idle', time: 3.0, solid: 1, yaw: 0.5 }) },
  sil_half: { dawn: 0.5, cam: sunCam(), inst: one({ track: 'sidekick', time: 1.0, solid: 0.5, lane: LANES.main }) },
  // cel (day)
  cel_front: { dawn: 1, bloom: 0.05, cam: { ...full, az: 0.45, el: 0.05 }, inst: one({ track: 'idle', time: 3.0, solid: 1 }) },
  cel_34back: { dawn: 1, bloom: 0.05, cam: { ...full, az: PI - 0.62, el: 0.05 }, inst: one({ track: 'idle', time: 3.0, solid: 1 }) },
  cel_close: { dawn: 1, bloom: 0.05, cam: { ...close, az: 0.4, el: 0.02 }, inst: one({ track: 'idle', time: 3.0, solid: 1 }) },
  cel_close_open: { dawn: 1, bloom: 0.05, cam: { ...close, az: -0.3, el: 0.02 }, inst: one({ track: 'idle', time: 3.0, solid: 1, eyes: 1 }) },
  cel_sidekick: { dawn: 1, bloom: 0.05, cam: { target: [0, 1.0, 0], dist: 5.8, fov: 24, az: 0.9, el: 0.03 }, inst: one({ track: 'sidekick', time: 1.2, solid: 1 }) },
  cel_run: { dawn: 1, bloom: 0.05, cam: { target: [0, 0.95, 0], dist: 5.4, fov: 24, az: PI / 2 - 0.4, el: 0.03 }, inst: one({ track: 'sprint_loop', time: 2.1, solid: 1 }) },
  cel_bun: { dawn: 1, bloom: 0.05, cam: { ...full, az: PI - 0.7, el: 0.05 }, inst: one({ track: 'idle', time: 5.0, solid: 1, variant: 'bun' }) },
  // crowds
  formation_light: { cam: { target: [0, 0.6, 0], dist: 34, fov: 26, az: 0.25, el: 0.20 }, inst: () => crowd(32, 1.9, (i, j, r) => ({ track: 'idle', time: 2 + 14 * r(5.1), yaw: (r(9.7) - 0.5) * 0.5 })) },
  formation_sil: { dawn: 0.6, cam: { target: [6, 0.8, 0], dist: 30, fov: 26, az: -PI / 2, el: 0.075 }, inst: () => crowd(32, 1.9, (i, j, r) => ({ yaw: -PI / 2 + PI, track: 'sidekick', time: 0.55 + 0.016 * (31 - i), solid: 1 })) },
  formation_mid: { cam: { target: [0, 0.9, 2], dist: 9, fov: 30, az: 0.5, el: 0.10, aperture: 0.02, focus: 8 }, inst: () => crowd(32, 1.9, (i, j, r) => ({ track: 'walk_loop', time: 3 * r(5.1), yaw: (r(9.7) - 0.5) * 0.3 })) },
};
const TRACKS = (new URLSearchParams(location.search).get('tracks') || 'idle,butterfly,sidekick,run_loop,sprint_loop,walk_loop,lookback,turn_around').split(',');
async function setup() {
  await fig.init();
  for (const n of TRACKS) { try { fig.addTrack(await loadTrack('/work_fable/tracks/' + n, n)); } catch (e) { console.warn('track ' + n + ': ' + e.message); } }
  for (const k of ['idle', 'kick']) { const t = testTrack(k); t.name = 't_' + k; fig.addTrack(t); }
}
window.LAB = {
  ready: setup(), fig, gl, SHOTS, LANES,
  shots: () => Object.keys(SHOTS),
  render(name, over) { const s = typeof name === 'string' ? SHOTS[name] : name; if (!s) throw new Error('no shot ' + name); renderFrame({ ...s, ...(over || {}) }, (over && over.t) || 0.0); return true; },
  custom(def) { // def: { cam, dawn, exp, bloom, inst:[...] }
    renderFrame({ ...def, inst: () => def.inst }, def.t || 0); return true;
  },
  perf(name, n = 30) { const s = SHOTS[name]; const px = new Uint8Array(4); renderFrame(s, 0); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); const t0 = performance.now(); for (let i = 0; i < n; i++) { renderFrame(s, i / 30); } gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); return (performance.now() - t0) / n; },
  info() { return { stats: fig.stats, tracks: fig.tracks.map((t) => ({ name: t.track.name, frames: t.frames, simMs: Math.round(t.simMs) })), maxPS: fig.maxPS }; },
};
