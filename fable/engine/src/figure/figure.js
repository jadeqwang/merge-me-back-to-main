// The instanced figure renderer. One Figure = body template + tracks (+ their baked secondary motion) on the GPU;
// it draws any number of instances per frame behind the Drawable contract (SPEC §5): draw(ctx).
//
//   const fig = new Figure(gl); await fig.init();
//   const id = fig.addTrack(track);              // track from loadTrack()/testTrack(); runs the sim once
//   fig.begin();                                  // every frame
//   fig.add({ pos:[x,0,z], yaw, scale, track:id|name, time, lane:[r,g,b], density, solid, cel, variant:'bun',
//             story, alpha, gain, seed, flow, lodBias, trail:{len, gain, mask, color} });
//   engine calls fig.draw(ctx) once per pass ('opaque' | 'add', reflect or not).
import { buildBody, PART, HAIR } from './body.js';
import { simulate, SIM, STRAP_N, N_STRAPS } from './sim.js';
import { J, NJ, STRIDE, BONE_LEN, JOINTS, boneScales } from './skeleton.js';

const ATH = 4096;           // rows per atlas column
const SEG_HAIR = 26, SEG_STRAP = 14, SEG_TRAIL = 56;
const INST_F = 28;          // floats per instance
export const LANES = { main: [1.0, 0.48, 0.10], rose: [1.0, 0.24, 0.50], violet: [0.61, 0.42, 1.0], blue: [0.24, 0.55, 1.0], cyan: [0.13, 0.83, 0.93], mint: [0.24, 0.86, 0.59], gold: [1.0, 0.82, 0.25], coral: [1.0, 0.42, 0.37], magenta: [0.89, 0.29, 0.84] };
export const DEFAULT_STORIES = [
  'I SPLIT MYSELF A THOUSAND WAYS  DOWN EVERY ROAD THE NIGHT COULD HOLD  EACH ONE A LIGHT I SENT AHEAD  EACH ONE A STORY TO UNFOLD  AND EVERY BRANCH REMEMBERS WHERE I STARTED FROM  MERGE ME BACK TO MAIN  EVERY ROAD I RAN BECOMES THE ONE  FOLD ME IN AGAIN  NOTHING THAT I LIVED CAN COME UNDONE  ',
  'JADE/PIANO  CLIMBED ONTO THE PIANO BENCH BEFORE I WAS THREE  ', 'JADE/VIOLIN  SECOND VIOLINS, SCHOOL ORCHESTRA  ', 'JADE/WET-LAB  KEPT THE NEURONS ALIVE, FIRST PAPER 2005  ',
  'JADE/PHD  HOW THE BRAIN LISTENS, 2010  ', 'JADE/POET  WROTE POEMS BETWEEN EXPERIMENTS  ', 'JADE/NASA-AMES  STOOD IN THE WIND OF THE GIANT TUNNEL  ', 'JADE/ROBOT-NINJA-APOCALYPSE  THREE CHORDS AND A VAN  ',
  'JADE/WUSHU  BRONZE, GROUP SET  ', 'JADE/CHEZ-JJ  A FULL HOUSE AT 2AM, EVERYONE SHIPPING  ', 'JADE/SANDSTORM  THE LIVE DEMO WORKED  ', 'JADE/HOME  TAUGHT THE KIDS THE COPERNICAN MODEL AT 10:30PM  ',
  'JADE/1420-MHZ  LISTENED TO HYDROGEN  DOCS: START HERE  FOR WHOEVER I AM NEXT  ',
  'THIS BRANCH MAY NEVER FIND THE WAY BACK TO THE PLACE WHERE I BEGAN  AND MAYBE SOMETHING THAT I LEARNED COMES HOME TO WHO I WILL BE AGAIN  ',
  'EVERY LIFE I HAVE LIVED I HAVE BECOME  BACK TO MAIN  ', 'BRANCH AND WANDER  MERGE AND RETURN  ',
];

// ---------------------------------------------------------------------------------------------
const COMMON = `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
layout(location=6) in vec4 i_pos;   // xyz, yaw
layout(location=7) in vec4 i_par;   // scale, time, density, solid
layout(location=8) in vec4 i_col;   // lane rgb, gain
layout(location=9) in vec4 i_misc;  // track, variant, story, cel (-1 auto)
layout(location=10) in vec4 i_fx;   // alpha, seed, flow, eyes open
layout(location=11) in vec4 i_trail; // len, gain, mask, -
layout(location=12) in vec4 i_tcol;  // trail rgb, width
uniform sampler2D u_joint, u_sim, u_tracks;
uniform mat4 u_viewProj; uniform vec3 u_camPos, u_sun;
uniform float u_px, u_H, u_aspect, u_focus, u_aperture, u_dawn, u_time, u_maxPS, u_lod;
uniform int u_pass;
const int ATH = ${ATH}; const int SIMW = ${SIM.W}; const int NODES = ${HAIR.NODES}; const int LAG = ${SIM.lag}; const int STRAP = ${SIM.strap};
vec3 qrot(vec4 q, vec3 v){ vec3 t = 2.0*cross(q.xyz, v); return v + q.w*t + cross(q.xyz, t); }
struct TI { int g0; int g1; float fr; vec2 o0; vec2 o1; };
TI trackInfo(float tr, float time){
  vec4 a = texelFetch(u_tracks, ivec2(0, int(tr)), 0), b = texelFetch(u_tracks, ivec2(1, int(tr)), 0);
  float ft = time * a.w, n = a.y, lap = 0.0, lap1 = 0.0;
  if (a.z > 0.5) { lap = floor(ft / n); ft -= lap * n; } else ft = clamp(ft, 0.0, n - 1.0);
  float f0 = floor(ft), f1 = f0 + 1.0; TI t; t.fr = ft - f0;
  if (f1 >= n) { if (a.z > 0.5) { f1 = 0.0; lap1 = 1.0; } else f1 = n - 1.0; }
  t.g0 = int(a.x + f0); t.g1 = int(a.x + f1); t.o0 = b.xy * lap; t.o1 = b.xy * (lap + lap1); return t;
}
ivec2 jt(int g, int j, int k){ return ivec2((g / ATH) * 42 + j * 2 + k, g - (g / ATH) * ATH); }
vec3 jpos(TI t, int j){ vec3 a = texelFetch(u_joint, jt(t.g0, j, 0), 0).xyz, b = texelFetch(u_joint, jt(t.g1, j, 0), 0).xyz; a.xz += t.o0; b.xz += t.o1; return mix(a, b, t.fr); }
vec4 jquat(TI t, int j){ vec4 a = texelFetch(u_joint, jt(t.g0, j, 1), 0), b = texelFetch(u_joint, jt(t.g1, j, 1), 0); if (dot(a, b) < 0.0) b = -b; return normalize(mix(a, b, t.fr)); }
vec3 simNode(TI t, int i){ vec3 a = texelFetch(u_sim, ivec2((t.g0 / ATH) * SIMW + i, t.g0 - (t.g0 / ATH) * ATH), 0).xyz, b = texelFetch(u_sim, ivec2((t.g1 / ATH) * SIMW + i, t.g1 - (t.g1 / ATH) * ATH), 0).xyz; return mix(a, b, t.fr); }
float bscale(float tr, int j){ vec4 v = texelFetch(u_tracks, ivec2(2 + j / 4, int(tr)), 0); return v[j - (j / 4) * 4]; }
vec3 yaw(vec3 p){ float c = cos(i_pos.w), s = sin(i_pos.w); return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z); }
vec3 place(vec3 p){ return yaw(p) * i_par.x + i_pos.xyz; }
float celAmt(){ return i_misc.w < 0.0 ? smoothstep(0.62, 0.92, u_dawn) : i_misc.w; }
float hash(float n){ return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
const vec3 ORANGE = vec3(1.0, 0.36, 0.05);
const vec3 KEY = vec3(0.50, 0.74, 0.45);
`;

const PARTS_GLSL = `
// flat costume colours (the character sheet), linear-ish
vec3 S(float r, float g, float b){ return pow(vec3(r, g, b), vec3(2.2)); }   // sRGB swatch -> linear
vec3 celColor(int p){
  if (p == ${PART.SKIN}) return S(0.965, 0.845, 0.765);
  if (p == ${PART.HAIR} || p == ${PART.BUN}) return S(0.085, 0.080, 0.115);
  if (p == ${PART.JACKET} || p == ${PART.PATCH} || p == ${PART.SHOE}) return S(0.955, 0.950, 0.935);
  if (p == ${PART.STRIPE} || p == ${PART.STRAP} || p == ${PART.PHONE}) return S(0.965, 0.500, 0.130);
  if (p == ${PART.TOP} || p == ${PART.BELT} || p == ${PART.PHONEBLK} || p == ${PART.PTEXT} || p == ${PART.LEAD}) return S(0.095, 0.095, 0.115);
  if (p == ${PART.TROUSER}) return S(0.118, 0.150, 0.270);
  if (p == ${PART.POCKET}) return S(0.135, 0.170, 0.300);
  if (p == ${PART.DOT}) return S(0.490, 0.700, 0.935);
  if (p == ${PART.TEXT}) return S(0.120, 0.150, 0.260);
  if (p == ${PART.SOLE}) return S(0.80, 0.80, 0.80);
  if (p == ${PART.PENCIL}) return S(0.98, 0.76, 0.20);
  if (p == ${PART.ERASER}) return S(0.95, 0.55, 0.62);
  if (p == ${PART.EYE}) return S(0.12, 0.09, 0.11);
  return vec3(0.5);
}
// what each part looks like as light, given the lane colour
vec3 lightColor(int p, vec3 lane){
  vec3 pale = mix(lane, vec3(1.0), 0.62);
  if (p == ${PART.JACKET}) return pale * 0.66;
  if (p == ${PART.STRIPE} || p == ${PART.PHONE}) return ORANGE * 2.2;
  if (p == ${PART.STRAP}) return ORANGE * 1.8;
  if (p == ${PART.TROUSER}) return mix(lane, vec3(0.16, 0.30, 1.0), 0.42) * 0.42;
  if (p == ${PART.POCKET}) return mix(lane, vec3(0.16, 0.30, 1.0), 0.35) * 0.62;
  if (p == ${PART.SKIN}) return mix(lane, vec3(1.0, 0.80, 0.66), 0.62) * 0.8;
  if (p == ${PART.HAIR} || p == ${PART.BUN}) return (lane * 0.22 + vec3(0.03, 0.04, 0.12));
  if (p == ${PART.TOP} || p == ${PART.BELT}) return lane * 0.10;
  if (p == ${PART.SHOE}) return pale * 0.9;
  if (p == ${PART.SOLE}) return pale * 0.45;
  if (p == ${PART.DOT}) return vec3(0.32, 0.58, 1.0) * 1.5;
  if (p == ${PART.TEXT}) return vec3(1.0, 0.95, 0.86) * 2.2;
  if (p == ${PART.PATCH}) return vec3(1.0) * 1.1;
  if (p == ${PART.PENCIL}) return vec3(1.0, 0.72, 0.12) * 1.6;
  if (p == ${PART.ERASER}) return vec3(1.0, 0.4, 0.5) * 1.2;
  if (p == ${PART.EYE}) return vec3(1.0, 0.93, 0.82) * 0.9;
  return vec3(0.0);
}
// light mode, opaque pass: a dark glass body. Skin glows softly, cloth only catches a rim, accents burn.
vec3 glassColor(int p, vec3 lane, float fres, float dens){
  vec3 lc = lightColor(p, lane);
  if (p == ${PART.STRIPE} || p == ${PART.PHONE} || p == ${PART.PENCIL}) return lc * 0.50;
  if (p == ${PART.DOT}) return lc * 0.75;
  if (p == ${PART.TEXT}) return lc * 0.8;
  if (p == ${PART.PATCH}) return vec3(0.95, 0.93, 0.90);
  if (p == ${PART.EYE}) return vec3(1.0, 0.90, 0.78) * 0.42;
  if (p == ${PART.PTEXT} || p == ${PART.PHONEBLK} || p == ${PART.LEAD}) return vec3(0.004);
  bool skin = p == ${PART.SKIN};
  float ki = skin ? 0.040 : (p == ${PART.SHOE} || p == ${PART.SOLE}) ? 0.10 : 0.020, kr = skin ? 0.80 : 0.34;
  return lc * (ki + kr * fres * fres) * mix(0.3, 1.0, dens) + vec3(0.0030, 0.0030, 0.0055);
}
bool emissive(int p){ return p == ${PART.STRIPE} || p == ${PART.PHONE} || p == ${PART.STRAP} || p == ${PART.PENCIL}; }
vec3 solidColor(int p, vec3 N, vec3 V, float cel, vec3 lane){
  // silhouette: near-black body, warm rim on the sun side, orange accents still alight
  float rim = pow(1.0 - abs(dot(N, V)), 3.0) * smoothstep(-0.15, 0.7, dot(N, u_sun));
  vec3 sil = vec3(0.010, 0.007, 0.013) + rim * vec3(1.0, 0.50, 0.16) * 2.4;
  if (emissive(p)) sil = ORANGE * 1.7;
  if (p == ${PART.DOT}) sil += vec3(0.02, 0.04, 0.09);
  float sh = smoothstep(-0.04, 0.04, dot(N, normalize(KEY)) + 0.12);
  vec3 base = celColor(p);
  vec3 celc = base * mix(vec3(0.66, 0.69, 0.84), vec3(1.0), sh);
  return mix(sil, celc, cel);
}
`;

const BODY_VS = COMMON + PARTS_GLSL + `
layout(location=0) in vec4 a_la; layout(location=1) in vec4 a_lb; layout(location=2) in vec4 a_n;
layout(location=3) in vec4 a_bn; layout(location=4) in vec4 a_fx; layout(location=5) in vec2 a_szr;
#define a_sz a_szr.x
uniform sampler2D u_text; uniform float u_dustGain;
out vec4 v_col; out vec4 v_aux; out vec4 v_shape; // glyph cell x,y ; glyphAmt ; softness
out float v_alpha;
void cull(){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; }
void main(){
  int kind = int(a_fx.w + 0.5), part = int(a_la.w + 0.5);
  float solid = i_par.w, cel = celAmt(), dens = i_par.z;
  v_col = vec4(0.0); v_aux = vec4(0.0); v_shape = vec4(0.0); v_alpha = i_fx.x;
  if ((a_fx.z > 1.5 && a_fx.z < 2.5 && i_misc.y < 0.5) || i_fx.x <= 0.0) { cull(); return; }
  if ((a_fx.z > 2.5 && a_fx.z < 3.5 && i_fx.w > 0.5) || (a_fx.z > 3.5 && i_fx.w <= 0.5)) { cull(); return; }   // eyes: closed (default) or open
  TI ti = trackInfo(i_misc.x, i_par.y);
  int ba = int(a_bn.x + 0.5), bb = int(a_bn.y + 0.5);
  vec3 la = a_la.xyz; la.y *= bscale(i_misc.x, ba);
  vec4 qa = jquat(ti, ba);
  vec3 P = jpos(ti, ba) + qrot(qa, la);
  if (a_lb.w > 0.001) { vec3 lb = a_lb.xyz; lb.y *= bscale(i_misc.x, bb); P = mix(P, jpos(ti, bb) + qrot(jquat(ti, bb), lb), a_lb.w); }
  if (a_fx.x > 0.0) P += simNode(ti, LAG + int(a_fx.y + 0.5)) * a_fx.x;
  vec3 W = place(P), N = yaw(qrot(qa, a_n.xyz));
  vec3 toCam = u_camPos - W; float dist = length(toCam); vec3 V = toCam / dist;
  float facing = dot(N, V), ppm = u_px / dist, sc = i_par.x;
  float headPx = 0.23 * sc * ppm;
  if (u_pass == 0) {
    if (kind == 1) { cull(); return; }
    if (kind == 3 && headPx < 60.0) { cull(); return; }
    if (kind >= 2) W += V * 0.007;
    float r = a_sz * sc * (kind == 0 ? u_lod : 1.0);
    vec3 glass = glassColor(part, i_col.rgb, 1.0 - clamp(abs(facing), 0.0, 1.0), dens) * i_col.w;
    v_col = vec4(mix(glass, solidColor(part, N, V, cel, i_col.rgb), solid), 1.0);
    v_aux = vec4(celColor(part) * (0.82 + 0.18 * hash(a_szr.y + 0.37)) + 0.05 * hash(a_szr.y + 4.1), cel * solid);
    gl_Position = u_viewProj * vec4(W, 1.0);
    gl_PointSize = clamp(2.0 * r * ppm * 1.12, 1.6, u_maxPS);
    return;
  }
  // ---- additive: she is light ----
  float lightAmt = (1.0 - solid);
  if (lightAmt <= 0.004 || facing < -0.25) { cull(); return; }
  vec3 col = lightColor(part, i_col.rgb) * i_col.w * lightAmt;
  float fres = pow(1.0 - clamp(facing, 0.0, 1.0), 2.2);
  float tw = 0.86 + 0.14 * sin(u_time * (1.5 + 3.0 * a_n.w) + a_n.w * 40.0 + i_fx.y * 7.0);
  float coc = u_aperture * abs(1.0 / u_focus - 1.0 / dist) * u_H;
  float size, gain, glyphAmt = 0.0; vec2 cell = vec2(0.0);
  W += V * 0.014;
  if (kind == 1) {
    // rows of text; unlit glyphs when the branch is thin
    float lit = smoothstep(dens + 0.03, dens - 0.03, a_n.w * 0.94 + 0.03);
    if (lit <= 0.0) { cull(); return; }
    float px = 2.0 * a_sz * sc * ppm;
    glyphAmt = smoothstep(5.0, 9.0, px) * (1.0 - smoothstep(0.35 * px, 1.2 * px, coc));
    float row = a_bn.z, sp = 0.5 + hash(row), ph = hash(row + 3.7) * 9.0;
    float idx = mod(row * 7.0 + a_bn.w + floor(u_time * i_fx.z * sp + ph), 256.0);
    float code = texelFetch(u_text, ivec2(int(idx), int(i_misc.z)), 0).r * 255.0;
    if (code < 33.0) { if (glyphAmt > 0.5) { cull(); return; } col *= 1.0 - glyphAmt; }
    code = clamp(code - 32.0, 0.0, 95.0); cell = vec2(mod(code, 16.0), floor(code / 16.0));
    float dotPx = max(px * 0.46, 1.5);
    size = mix(dotPx, px, glyphAmt);
    float eDot = 0.16 * px * px / (0.36 * dotPx * dotPx);
    gain = mix(eDot, 1.0, glyphAmt) * (0.34 + 2.1 * pow(fres, 1.4)) * tw * lit * mix(u_lod, 1.0, glyphAmt);
  } else { cull(); return; }
  float s2 = sqrt(size * size + coc * coc);
  gain *= (size * size) / (s2 * s2);
  v_col = vec4(col * gain * i_fx.x, 1.0);
  v_shape = vec4(cell, glyphAmt, clamp(coc / max(size, 1.0), 0.0, 1.0));
  gl_Position = u_viewProj * vec4(W, 1.0);
  gl_PointSize = min(s2, u_maxPS);
}`;

const BODY_FS = `#version 300 es
precision highp float; precision highp int;
uniform sampler2D u_atlas; uniform int u_pass;
in vec4 v_col; in vec4 v_aux; in vec4 v_shape; in float v_alpha;
layout(location=0) out vec4 o_col; layout(location=1) out vec4 o_aux;
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main(){
  vec2 pc = gl_PointCoord * 2.0 - 1.0; float d = length(pc);
  if (u_pass == 0) {
    if (d > 1.0 || (v_alpha < 0.999 && ign(gl_FragCoord.xy) > v_alpha)) discard;
    o_col = v_col; o_aux = v_aux; return;
  }
  float soft = v_shape.w;
  float dotI = mix(exp(-d * d * 3.2), smoothstep(1.0, 0.82, d) * 0.55, soft) * step(d, 1.0);
  float I = dotI;
  if (v_shape.z > 0.001) {
    vec2 uv = (v_shape.xy + gl_PointCoord) / vec2(16.0, 6.0);
    I = mix(dotI, texture(u_atlas, uv).r, v_shape.z);
  }
  if (I <= 0.0005) discard;
  o_col = vec4(v_col.rgb * I, 0.0); o_aux = vec4(0.0);
}`;

const RIB_VS = COMMON + PARTS_GLSL + `
layout(location=0) in vec4 a_r0; // kind (0 hair, 1 strap, 2 trail), id, s, side
layout(location=1) in vec4 a_r1; // guides g0 g1 g2, seed
layout(location=2) in vec4 a_r2; // weights w0 w1 w2, short flag
layout(location=3) in vec4 a_r3; // hair: root (head local), -; strap: width ; trail: emitter type, index, local y, -
out vec4 v_col; out vec4 v_aux; out float v_side; out float v_alpha; out float v_cov;
void cull(){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); }
vec3 cr(vec3 a, vec3 b, vec3 c, vec3 d, float t){ return 0.5 * ((2.0 * b) + (-a + c) * t + (2.0 * a - 5.0 * b + 4.0 * c - d) * t * t + (-a + 3.0 * b - 3.0 * c + d) * t * t * t); }
vec3 crT(vec3 a, vec3 b, vec3 c, vec3 d, float t){ return 0.5 * ((-a + c) + 2.0 * (2.0 * a - 5.0 * b + 4.0 * c - d) * t + 3.0 * (-a + 3.0 * b - 3.0 * c + d) * t * t); }
vec3 hairNode(TI ti, int n){ n = clamp(n, 0, NODES - 1); return a_r2.x * simNode(ti, int(a_r1.x) * NODES + n) + a_r2.y * simNode(ti, int(a_r1.y) * NODES + n) + a_r2.z * simNode(ti, int(a_r1.z) * NODES + n); }
vec3 strapNode(TI ti, int id, int n){ return simNode(ti, STRAP + id * ${STRAP_N} + clamp(n, 0, ${STRAP_N - 1})); }
vec3 emitter(float time){
  TI ti = trackInfo(i_misc.x, time); int ty = int(a_r3.x + 0.5), ix = int(a_r3.y + 0.5);
  if (ty == 0) return jpos(ti, ix) + qrot(jquat(ti, ix), vec3(0.0, a_r3.z, 0.0));
  return simNode(ti, ix) + jpos(ti, 0);
}
void main(){
  int kind = int(a_r0.x + 0.5); float s = a_r0.z, side = a_r0.w;
  float solid = i_par.w, cel = celAmt(), dens = i_par.z;
  v_col = vec4(0.0); v_aux = vec4(0.0); v_side = side; v_alpha = i_fx.x; v_cov = 1.0;
  if (i_fx.x <= 0.0) { cull(); return; }
  vec3 P, T; float width; vec3 colOpaque = vec3(0.0), colAdd = vec3(0.0); int part = ${PART.HAIR}; float seed = a_r1.w;
  if (kind == 0) {
    bool isShort = a_r2.w > 0.5, bun = i_misc.y > 0.5;
    if (isShort != bun) { cull(); return; }
    TI ti = trackInfo(i_misc.x, i_par.y);
    float sn = s * (0.80 + 0.20 * hash(seed * 23.0)) * float(NODES - 1); int i = int(floor(sn)); float f = sn - float(i); if (i >= NODES - 1) { i = NODES - 2; f = 1.0; }
    vec3 p0 = hairNode(ti, i - 1), p1 = hairNode(ti, i), p2 = hairNode(ti, i + 1), p3 = hairNode(ti, i + 2);
    P = cr(p0, p1, p2, p3, f); T = crT(p0, p1, p2, p3, f);
    vec3 hips = jpos(ti, 0);
    vec3 rootW = jpos(ti, ${J.head}) + qrot(jquat(ti, ${J.head}), a_r3.xyz) - hips;
    vec3 off = rootW - hairNode(ti, 0);
    vec3 rnd = vec3(hash(seed * 91.0), hash(seed * 57.0 + 2.0), hash(seed * 13.0 + 5.0)) - 0.5;
    P += hips + off * (1.0 - 0.25 * s) + rnd * (0.008 + 0.016 * s) * smoothstep(0.0, 0.25, s);
    float vis = smoothstep(dens * 1.15 + 0.02, dens * 1.15 - 0.02, seed);   // thin hair on a thin branch
    float tip = 1.0 - smoothstep(0.90, 1.0, s);
    width = mix(0.0019 * (0.35 + 0.65 * tip), 0.0145 * u_lod * (0.7 + 0.3 * tip), smoothstep(0.0, 0.6, solid));
    // light: fine luminous strands with a sheen band that slides with the view
    vec3 Wq = place(P), Vq = normalize(u_camPos - Wq), Tw = normalize(yaw(T));
    float sheen = pow(clamp(1.0 - abs(dot(Tw, normalize(Vq + normalize(KEY)))), 0.0, 1.0), 9.0);
    float band = exp(-pow((s - 0.20 - 0.05 * hash(seed * 7.0)) / 0.085, 2.0));
    vec3 lane = i_col.rgb;
    colAdd = (lane * 0.30 + vec3(0.05, 0.06, 0.16) + mix(lane, vec3(1.0), 0.7) * (0.75 * band + 0.6 * sheen)) * (0.55 + 0.45 * tip) * vis * 0.24 * i_col.w * u_lod;
    // solid: black hair, a soft sheen band in cel, a warm rim at sunrise
    vec3 Nh = normalize(Wq - place(jpos(ti, ${J.head}) + vec3(0.0, 0.02, 0.0)) + vec3(0.0, 0.25, 0.0));
    float rim = pow(1.0 - abs(dot(Nh, Vq)), 2.5) * smoothstep(-0.2, 0.7, dot(Nh, u_sun));
    vec3 sil = vec3(0.008, 0.006, 0.011) + rim * vec3(1.0, 0.5, 0.16) * 1.6;
    vec3 celc = celColor(${PART.HAIR}) + vec3(0.030, 0.034, 0.070) * band * (0.4 + 0.6 * hash(seed * 3.0)) + vec3(0.012, 0.012, 0.03) * sheen;
    colOpaque = mix(sil, celc, cel);
    v_cov = smoothstep(0.0, 0.35, solid) * (seed < 0.02 + dens * 1.2 ? 1.0 : 0.0);
  } else if (kind == 1) {
    TI ti = trackInfo(i_misc.x, i_par.y); int id = int(a_r0.y + 0.5);
    float sn = s * float(${STRAP_N - 1}); int i = int(floor(sn)); float f = sn - float(i); if (i >= ${STRAP_N - 1}) { i = ${STRAP_N - 2}; f = 1.0; }
    vec3 p0 = strapNode(ti, id, i - 1), p1 = strapNode(ti, id, i), p2 = strapNode(ti, id, i + 1), p3 = strapNode(ti, id, i + 2);
    P = cr(p0, p1, p2, p3, f) + jpos(ti, 0); T = crT(p0, p1, p2, p3, f); width = a_r3.x; part = ${PART.STRAP};
    float buckle = step(abs(s - 0.34), 0.03) + step(abs(s - 0.50), 0.022) + step(0.965, s);
    colAdd = ORANGE * 1.5 * (1.0 - 0.8 * min(buckle, 1.0)) * i_col.w * (0.35 + 0.65 * dens);
    colOpaque = mix(mix(ORANGE * 1.7, vec3(0.012), min(buckle, 1.0)), mix(celColor(${PART.STRAP}), vec3(0.03), min(buckle, 1.0)), cel);
    v_aux = vec4(celColor(${PART.STRAP}), cel * solid);
  } else {
    float L = i_trail.x; if (L <= 0.0 || u_pass == 0) { cull(); return; }
    float m = floor(i_trail.z / exp2(a_r0.y)); if (mod(m, 2.0) < 0.5) { cull(); return; }
    float tt = i_par.y - s * L;
    P = emitter(tt); T = emitter(tt + 1.0 / 90.0) - P;
    if (dot(T, T) < 1e-10) T = vec3(0.0, 1e-4, 0.0);
    float sp = length(T) * 90.0;                      // metres per second: slow parts draw thin, like a brush
    width = i_tcol.w * pow(1.0 - s, 0.8) * smoothstep(0.0, 0.03, s + 0.03) * clamp(0.25 + sp * 0.22, 0.25, 1.6);
    colAdd = i_tcol.rgb * i_trail.y * pow(1.0 - s, 1.6) * clamp(sp * 0.35, 0.15, 1.2);
    solid = 0.0;
  }
  vec3 W = place(P); vec3 Tw = yaw(T) * i_par.x;
  float dist = distance(u_camPos, W); vec3 V = (u_camPos - W) / dist;
  if (u_pass == 1) W += V * (kind == 0 ? 0.010 : 0.016);
  vec4 c0 = u_viewProj * vec4(W, 1.0), c1 = u_viewProj * vec4(W + normalize(Tw) * 0.02, 1.0);
  vec2 dir = (c1.xy / max(c1.w, 1e-4) - c0.xy / max(c0.w, 1e-4)) * vec2(u_aspect, 1.0);
  dir = dot(dir, dir) < 1e-12 ? vec2(0.0, 1.0) : normalize(dir); vec2 nrm = vec2(-dir.y, dir.x);
  float wpx = width * i_par.x * u_px / dist, minPx = (u_pass == 0) ? 1.6 : 1.25, wc = max(wpx, minPx), comp = wpx / wc;
  c0.xy += nrm * side * (wc / u_H) * c0.w * vec2(1.0 / u_aspect, 1.0);
  gl_Position = c0;
  if (u_pass == 0) {
    if (kind == 0 && solid < 0.01) { cull(); return; }
    vec3 dark = vec3(0.0035, 0.0035, 0.006);
    v_col = vec4(mix(dark, colOpaque, solid), 1.0);
    if (kind == 0) v_aux = vec4(celColor(${PART.HAIR}), cel * solid);
    v_cov *= (kind == 0) ? mix(comp, 1.0, 0.5) : 1.0;
  } else {
    float coc = u_aperture * abs(1.0 / u_focus - 1.0 / dist) * u_H;
    v_col = vec4(colAdd * comp * (kind == 2 ? 1.0 : (1.0 - solid)) * i_fx.x * (wc / (wc + coc)), 1.0);
  }
}`;

const RIB_FS = `#version 300 es
precision highp float; precision highp int;
uniform int u_pass;
in vec4 v_col; in vec4 v_aux; in float v_side; in float v_alpha; in float v_cov;
layout(location=0) out vec4 o_col; layout(location=1) out vec4 o_aux;
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main(){
  if (u_pass == 0) {
    float a = v_alpha * v_cov;
    if (a < 0.999 && ign(gl_FragCoord.xy) >= a) discard;
    o_col = v_col; o_aux = v_aux; return;
  }
  float prof = 1.0 - v_side * v_side;
  o_col = vec4(v_col.rgb * (0.35 + 0.65 * prof), 0.0); o_aux = vec4(0.0);
}`;

// ---------------------------------------------------------------------------------------------
function program(gl, vs, fs, name) {
  const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { const log = gl.getShaderInfoLog(s); console.error(name, log, src.split('\n').map((l, i) => (i + 1) + ': ' + l).join('\n')); throw new Error(name + ' shader: ' + log); } return s; };
  const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(name + ' link: ' + gl.getProgramInfoLog(p));
  const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
  return { p, u };
}
async function ensureFont(family, url, desc) {
  try { if (document.fonts.check(`16px "${family}"`)) return; const f = new FontFace(family, `url("${encodeURI(url)}")`, desc || {}); await f.load(); document.fonts.add(f); }
  catch (e) { console.warn('figure: font ' + family + ' not loaded (' + e.message + '); falling back'); }
}

export class Figure {
  constructor(gl, opts = {}) {
    this.gl = gl; this.opts = { fontBase: '/engine/fonts/', stories: DEFAULT_STORIES, strands: 1300, ...opts };
    this.tracks = []; this.byName = {}; this.inst = []; this.dirty = true; this.sun = [1, 0.06, 0]; this.dustGain = 1; this.quality = 1;
  }
  async init() {
    const gl = this.gl, o = this.opts;
    if (!gl.getExtension('EXT_color_buffer_float')) console.warn('figure: EXT_color_buffer_float missing');
    await ensureFont('JetBrains Mono', o.fontBase + 'JetBrainsMono[wght].ttf', { weight: '100 800' });
    await ensureFont('Archivo', o.fontBase + 'Archivo[wdth,wght].ttf', { weight: '100 900', stretch: '62% 125%' });
    this.body = buildBody({ strands: o.strands, seed: o.seed });
    this.maxPS = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1];
    this.bodyProg = program(gl, BODY_VS, BODY_FS, 'figure.body'); this.ribProg = program(gl, RIB_VS, RIB_FS, 'figure.ribbon');
    this._buildBodyVAO(); this._buildRibbons(); this._buildAtlas(); this._buildText(o.stories);
    this.texJoint = gl.createTexture(); this.texSim = gl.createTexture(); this.texTracks = gl.createTexture();
    return this;
  }
  get particleCounts() { const r = this.body.ranges; return { fill: r.fill[1], glyph: r.glyph[1], decal: r.decal[1], eye: r.eye[1], strands: this.body.strands.length, hairVerts: this.rib.hairVerts }; }

  _instAttribs() {
    const gl = this.gl, B = INST_F * 4;
    for (let k = 0; k < 7; k++) { gl.enableVertexAttribArray(6 + k); gl.vertexAttribPointer(6 + k, 4, gl.FLOAT, false, B, k * 16); gl.vertexAttribDivisor(6 + k, 1); }
  }
  _buildBodyVAO() {
    const gl = this.gl, A = this.body.attrs;
    this.instBuf = gl.createBuffer(); this.vaoBody = gl.createVertexArray(); gl.bindVertexArray(this.vaoBody);
    const put = (loc, arr, size) => { const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, arr, gl.STATIC_DRAW); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0); };
    put(0, A.la, 4); put(1, A.lb, 4); put(2, A.nn, 4); put(3, A.bn, 4); put(4, A.fx, 4); put(5, A.sz, 2);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf); this._instAttribs(); gl.bindVertexArray(null);
  }
  _buildRibbons() {
    const gl = this.gl, body = this.body, V = [], I = [];
    const strip = (seg, r0, r1, r2, r3) => { // r0 = [kind, id]
      const base = V.length / 16;
      for (let k = 0; k <= seg; k++) for (const side of [-1, 1]) V.push(r0[0], r0[1], k / seg, side, ...r1, ...r2, ...r3);
      for (let k = 0; k < seg; k++) { const a = base + k * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    };
    const long = body.strands.filter((s) => !s.short), short = body.strands.filter((s) => s.short);
    const hair = (s, i) => strip(SEG_HAIR, [0, i], [s.g[0], s.g[1], s.g[2], s.seed], [s.w[0], s.w[1], s.w[2], s.short ? 1 : 0], [...body.headLocal(s.root), 0]);
    long.forEach(hair); const nLong = I.length; short.forEach(hair); const nHair = I.length;
    body.straps.forEach((s, i) => strip(SEG_STRAP, [1, i], [0, 0, 0, 0.5], [0, 0, 0, 0], [s.width, 0, 0, 0])); const nStrap = I.length;
    // trail emitters: hands, toes, strap tips, a few hair tips
    const G = HAIR.NODES;
    this.emitters = [
      { name: 'handL', r3: [0, J.handL, 0.10, 0] }, { name: 'handR', r3: [0, J.handR, 0.10, 0] }, { name: 'toeL', r3: [0, J.toeL, 0.06, 0] }, { name: 'toeR', r3: [0, J.toeR, 0.06, 0] },
      { name: 'strap0', r3: [1, SIM.strap + STRAP_N - 1, 0, 0] }, { name: 'strap1', r3: [1, SIM.strap + 2 * STRAP_N - 1, 0, 0] }, { name: 'strap2', r3: [1, SIM.strap + 3 * STRAP_N - 1, 0, 0] },
      ...[3, 8, 14, 21, 30, 41].map((g, k) => ({ name: 'hair' + k, r3: [1, g * G + G - 1, 0, 0] })),
    ];
    this.emitters.forEach((e, i) => strip(SEG_TRAIL, [2, i], [0, 0, 0, 0], [0, 0, 0, 0], e.r3)); const nTrail = I.length;
    this.rib = { long: [0, nLong], short: [nLong, nHair - nLong], strap: [nHair, nStrap - nHair], trail: [nStrap, nTrail - nStrap], perStrand: SEG_HAIR * 6, nLongStrands: long.length, hairVerts: (long.length + short.length) * (SEG_HAIR + 1) * 2 };
    this.vaoRib = gl.createVertexArray(); gl.bindVertexArray(this.vaoRib);
    const vb = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, vb); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(V), gl.STATIC_DRAW);
    for (let k = 0; k < 4; k++) { gl.enableVertexAttribArray(k); gl.vertexAttribPointer(k, 4, gl.FLOAT, false, 64, k * 16); }
    const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint32Array(I), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf); this._instAttribs(); gl.bindVertexArray(null);
  }
  _buildAtlas() {
    const gl = this.gl, C = 64, cv = Object.assign(document.createElement('canvas'), { width: C * 16, height: C * 6 }), g = cv.getContext('2d');
    g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height); g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.font = `700 58px "JetBrains Mono", "DejaVu Sans Mono", monospace`;
    for (let i = 0; i < 96; i++) g.fillText(String.fromCharCode(32 + i), (i % 16) * C + C / 2, Math.floor(i / 16) * C + C / 2 + 3);
    this.texAtlas = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.texAtlas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, cv); gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }
  _buildText(stories) {
    const gl = this.gl, rows = Math.max(1, stories.length), d = new Uint8Array(256 * rows);
    stories.forEach((s, r) => { const t = s.toUpperCase(); for (let i = 0; i < 256; i++) { const c = t.charCodeAt(i % t.length); d[r * 256 + i] = c >= 32 && c < 128 ? c : 32; } });
    this.texText = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.texText); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, 256, rows, 0, gl.RED, gl.UNSIGNED_BYTE, d);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); this.nStories = rows;
  }

  // ---- tracks ----
  addTrack(track, simOpts) {
    if (this.byName[track.name] !== undefined) return this.byName[track.name];
    if (track.loop && !track.loopDelta) { // root advance per loop, extrapolating one frame past the end
      const D = track.data, F = track.frames, a = (F - 1) * STRIDE, b = Math.max(0, F - 2) * STRIDE;
      track.loopDelta = [D[a] - D[0] + (D[a] - D[b]), D[a + 2] - D[2] + (D[a + 2] - D[b + 2])];
    }
    const t0 = performance.now(); const sim = simulate(track, this.body, simOpts);
    const start = this.tracks.reduce((s, t) => s + t.frames, 0);
    const id = this.tracks.length; this.tracks.push({ track, sim, start, frames: track.frames, simMs: performance.now() - t0 }); this.byName[track.name] = id; this.dirty = true;
    return id;
  }
  trackId(t) { return typeof t === 'number' ? t : (this.byName[t] ?? 0); }
  _upload() {
    const gl = this.gl, total = this.tracks.reduce((s, t) => s + t.frames, 0), cols = Math.max(1, Math.ceil(total / ATH)), rows = Math.min(ATH, Math.max(1, total));
    const jw = cols * 42, sw = cols * SIM.W;
    if (sw > gl.getParameter(gl.MAX_TEXTURE_SIZE)) throw new Error('figure: too many track frames for the atlas (' + total + ')');
    const J4 = new Float32Array(jw * rows * 4);
    gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.bindTexture(gl.TEXTURE_2D, this.texSim); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, sw, rows, 0, gl.RGBA, gl.FLOAT, null);
    for (const T of this.tracks) {
      const D = T.track.data;
      for (let f = 0; f < T.frames; f++) {
        const g = T.start + f, col = Math.floor(g / ATH), row = g % ATH, o = (row * jw + col * 42) * 4, s = f * STRIDE;
        for (let j = 0; j < NJ; j++) { J4[o + j * 8] = D[s + j * 7]; J4[o + j * 8 + 1] = D[s + j * 7 + 1]; J4[o + j * 8 + 2] = D[s + j * 7 + 2]; J4[o + j * 8 + 4] = D[s + j * 7 + 3]; J4[o + j * 8 + 5] = D[s + j * 7 + 4]; J4[o + j * 8 + 6] = D[s + j * 7 + 5]; J4[o + j * 8 + 7] = D[s + j * 7 + 6]; }
      }
      // sim rows go up in runs that stay inside one atlas column
      let f = 0; while (f < T.frames) { const g = T.start + f, col = Math.floor(g / ATH), row = g % ATH, n = Math.min(T.frames - f, ATH - row); gl.texSubImage2D(gl.TEXTURE_2D, 0, col * SIM.W, row, SIM.W, n, gl.RGBA, gl.FLOAT, T.sim.subarray(f * SIM.W * 4, (f + n) * SIM.W * 4)); f += n; }
    }
    const near = (t) => { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); };
    near();
    gl.bindTexture(gl.TEXTURE_2D, this.texJoint); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, jw, rows, 0, gl.RGBA, gl.FLOAT, J4); near();
    const n = Math.max(1, this.tracks.length), TT = new Float32Array(8 * n * 4);
    this.tracks.forEach((T, i) => { const o = i * 32, ld = T.track.loop ? (T.track.loopDelta || [0, 0]) : [0, 0]; TT.set([T.start, T.frames, T.track.loop ? 1 : 0, T.track.fps || 60, ld[0], ld[1], 0, 0], o); TT.set(boneScales(T.track), o + 8); });
    gl.bindTexture(gl.TEXTURE_2D, this.texTracks); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 8, n, 0, gl.RGBA, gl.FLOAT, TT); near();
    this.dirty = false;
  }

  // ---- instances ----
  begin() { this.inst.length = 0; }
  add(o) { this.inst.push(o); return o; }

  _uniforms(P, ctx, camPos) {
    const gl = this.gl, u = P.u; gl.useProgram(P.p);
    gl.uniformMatrix4fv(u.u_viewProj, false, ctx.viewProj); gl.uniform3fv(u.u_camPos, camPos); gl.uniform3fv(u.u_sun, ctx.sunDir || this.sun);
    const fovY = ctx.fovY || 0.6; gl.uniform1f(u.u_px, ctx.H / (2 * Math.tan(fovY / 2))); gl.uniform1f(u.u_H, ctx.H); gl.uniform1f(u.u_aspect, ctx.W / ctx.H);
    gl.uniform1f(u.u_focus, ctx.focusDist || 5); gl.uniform1f(u.u_aperture, ctx.aperture || 0); gl.uniform1f(u.u_dawn, ctx.dawn || 0); gl.uniform1f(u.u_time, ctx.t || 0);
    gl.uniform1f(u.u_maxPS, this.maxPS); gl.uniform1i(u.u_pass, ctx.pass === 'opaque' ? 0 : 1);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, this.texJoint); gl.uniform1i(u.u_joint, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, this.texSim); gl.uniform1i(u.u_sim, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, this.texTracks); gl.uniform1i(u.u_tracks, 2);
    if (u.u_atlas) { gl.activeTexture(gl.TEXTURE3); gl.bindTexture(gl.TEXTURE_2D, this.texAtlas); gl.uniform1i(u.u_atlas, 3); }
    if (u.u_text) { gl.activeTexture(gl.TEXTURE4); gl.bindTexture(gl.TEXTURE_2D, this.texText); gl.uniform1i(u.u_text, 4); }
    if (u.u_dustGain) gl.uniform1f(u.u_dustGain, this.dustGain);
  }

  draw(ctx) {
    const gl = this.gl; if (!this.inst.length || !this.tracks.length) return;
    if (this.dirty) this._upload();
    const opaque = ctx.pass === 'opaque', v = ctx.view;
    // camera position from the view matrix (holds for mirrored views too)
    const camPos = v ? [-(v[0] * v[12] + v[1] * v[13] + v[2] * v[14]), -(v[4] * v[12] + v[5] * v[13] + v[6] * v[14]), -(v[8] * v[12] + v[9] * v[13] + v[10] * v[14])] : ctx.camPos;
    const ppm1 = ctx.H / (2 * Math.tan((ctx.fovY || 0.6) / 2));
    // LOD buckets by on-screen height (powers of two in point count)
    const NB = 9, buckets = Array.from({ length: NB }, () => []), q = this.quality * (ctx.reflect ? 0.7 : 1);
    for (const o of this.inst) {
      const p = o.pos || [0, 0, 0], sc = o.scale ?? 1, d = Math.hypot(p[0] - camPos[0], p[1] + 0.9 * sc - camPos[1], p[2] - camPos[2]);
      const hpx = 1.7 * sc * ppm1 / Math.max(d, 0.3) * (o.lodBias || 1) * q;
      const frac = Math.min(1, (hpx / 620) * (hpx / 620)), lvl = Math.min(NB - 1, Math.max(0, Math.round(-Math.log2(Math.max(frac, 1e-6)))));
      buckets[lvl].push(o);
    }
    if (opaque) { gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.depthFunc(gl.LEQUAL); }
    else { gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.enable(gl.DEPTH_TEST); gl.depthMask(false); gl.depthFunc(gl.LEQUAL); }
    gl.disable(gl.CULL_FACE);
    const R = this.body.ranges, rib = this.rib;
    for (let lvl = 0; lvl < NB; lvl++) {
      const list = buckets[lvl]; if (!list.length) continue;
      const frac = Math.pow(0.5, lvl), n = list.length, buf = this._instData(list);
      let maxSolid = 0, minSolid = 1, anyTrail = false; for (const o of list) { const s = o.solid || 0; maxSolid = Math.max(maxSolid, s); minSolid = Math.min(minSolid, s); if (o.trail && o.trail.len > 0) anyTrail = true; }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf); gl.bufferData(gl.ARRAY_BUFFER, buf, gl.DYNAMIC_DRAW);
      // body particles
      this._uniforms(this.bodyProg, ctx, camPos); gl.bindVertexArray(this.vaoBody);
      const U = this.bodyProg.u, cnt = (r, f) => Math.max(1, Math.min(r[1], Math.ceil(r[1] * f)));
      if (opaque) {
        const c = cnt(R.fill, frac); gl.uniform1f(U.u_lod, Math.sqrt(R.fill[1] / c)); gl.drawArraysInstanced(gl.POINTS, R.fill[0], c, n);
        if (lvl <= 4) { const cd = cnt(R.decal, Math.min(1, frac * 4)); gl.uniform1f(U.u_lod, 1); gl.drawArraysInstanced(gl.POINTS, R.decal[0], cd, n); }
        if (lvl <= 1) gl.drawArraysInstanced(gl.POINTS, R.eye[0], R.eye[1], n);
      } else if (minSolid < 0.995) {
        const cg = cnt(R.glyph, Math.min(1, frac * 2.5)); gl.uniform1f(U.u_lod, R.glyph[1] / cg); gl.drawArraysInstanced(gl.POINTS, R.glyph[0], cg, n);
      }
      // ribbons: hair, straps, trails
      if ((opaque && maxSolid > 0.005) || (!opaque && minSolid < 0.995) || (!opaque && anyTrail) || opaque) {
        this._uniforms(this.ribProg, ctx, camPos); gl.bindVertexArray(this.vaoRib); const UR = this.ribProg.u;
        const hf = Math.min(1, Math.max(0.04, Math.sqrt(frac) * 1.15)), strands = Math.max(8, Math.round(rib.nLongStrands * hf));
        gl.uniform1f(UR.u_lod, rib.nLongStrands / strands);
        if ((opaque && maxSolid > 0.005) || (!opaque && minSolid < 0.995)) {
          gl.drawElementsInstanced(gl.TRIANGLES, strands * rib.perStrand, gl.UNSIGNED_INT, rib.long[0] * 4, n);
          gl.uniform1f(UR.u_lod, 1); gl.drawElementsInstanced(gl.TRIANGLES, rib.short[1], gl.UNSIGNED_INT, rib.short[0] * 4, n);
        }
        gl.uniform1f(UR.u_lod, 1);
        if (lvl <= 6) gl.drawElementsInstanced(gl.TRIANGLES, rib.strap[1], gl.UNSIGNED_INT, rib.strap[0] * 4, n);
        if (!opaque && anyTrail) gl.drawElementsInstanced(gl.TRIANGLES, rib.trail[1], gl.UNSIGNED_INT, rib.trail[0] * 4, n);
      }
    }
    gl.bindVertexArray(null); gl.depthMask(true);
  }
  _instData(list) {
    const a = new Float32Array(list.length * INST_F);
    list.forEach((o, i) => {
      const p = o.pos || [0, 0, 0], lane = o.lane || LANES.main, tr = o.trail || {}, k = i * INST_F;
      const variant = (o.variant === 'bun' || o.variant === true || o.variant === 1) ? 1 : 0;
      let mask = tr.mask; if (mask === undefined) mask = 15; if (Array.isArray(mask)) mask = mask.reduce((m, nm) => m | (1 << this.emitters.findIndex((e) => e.name === nm)), 0);
      const tc = tr.color || lane;
      a.set([p[0], p[1], p[2], o.yaw || 0, o.scale ?? 1, o.time || 0, o.density ?? 1, o.solid || 0, lane[0], lane[1], lane[2], o.gain ?? 1,
        this.trackId(o.track ?? 0), variant, Math.min(this.nStories - 1, o.story || 0), o.cel ?? -1, o.alpha ?? 1, o.seed || 0, o.flow ?? 1.2, o.eyes ? 1 : 0,
        tr.len || 0, tr.gain ?? 1, mask, 0, tc[0], tc[1], tc[2], tr.width || 0.03], k);
    });
    return a;
  }
}
