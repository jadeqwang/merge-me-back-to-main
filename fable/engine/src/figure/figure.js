// The instanced figure renderer. One Figure = body (mesh LODs, fibres, decals, hair) + tracks with their baked secondary
// motion on the GPU; it draws any number of instances per frame behind the Drawable contract (SPEC §5): draw(ctx).
//
//   const fig = new Figure(gl); await fig.init();
//   const id = fig.addTrack(track);              // from loadTrack()/testTrack(); runs the sim once
//   fig.begin();                                  // every frame
//   fig.add({ pos:[x,0,z], yaw, scale, track:id|name, time, lane:[r,g,b], density, solid, cel, variant:'bun', story,
//             alpha, gain, seed, flow, eyes, lodBias, trail:{len, gain, mask, color, width} });
//   engine calls fig.draw(ctx) once per pass ('opaque' | 'add', reflect or not).
//
// Modes: light (solid 0): a near-black body that only occludes, clothes drawn as luminous fibres, skin a soft lantern;
// silhouette (solid 1, dawn ~0.6): black mesh, warm rim, translucent hems; cel (solid 1, dawn 1 or cel:1): flat colours.
import { buildBody, PART, HAIR, VSTRIDE, FSTRIDE } from './body.js';
import { simulate, SIM, STRAP_N } from './sim.js';
import { J, NJ, STRIDE, boneScales } from './skeleton.js';

const ATH = 4096, SEG_HAIR = 26, SEG_STRAP = 14, SEG_TRAIL = 56, INST_F = 28;
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

const COMMON = `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
layout(location=8) in vec4 i_pos;    // xyz, yaw
layout(location=9) in vec4 i_par;    // scale, time, density, solid
layout(location=10) in vec4 i_col;   // lane rgb, gain
layout(location=11) in vec4 i_misc;  // track, variant, story, cel (-1 auto)
layout(location=12) in vec4 i_fx;    // alpha, seed, flow, eyes open
layout(location=13) in vec4 i_trail; // len, gain, mask, -
layout(location=14) in vec4 i_tcol;  // trail rgb, width
uniform sampler2D u_joint, u_sim, u_tracks;
uniform mat4 u_viewProj; uniform vec3 u_camPos, u_sun;
uniform float u_px, u_H, u_aspect, u_focus, u_aperture, u_dawn, u_time, u_maxPS, u_lod;
uniform int u_pass;
const int ATH = ${ATH}; const int SIMW = ${SIM.W}; const int NODES = ${HAIR.NODES}; const int LAG = ${SIM.lag}; const int STRAP = ${SIM.strap}; const int LEGS = ${SIM.leg};
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
vec3 cr(vec3 a, vec3 b, vec3 c, vec3 d, float t){ return 0.5 * ((2.0 * b) + (-a + c) * t + (2.0 * a - 5.0 * b + 4.0 * c - d) * t * t + (-a + 3.0 * b - 3.0 * c + d) * t * t * t); }
vec3 crT(vec3 a, vec3 b, vec3 c, vec3 d, float t){ return 0.5 * ((-a + c) + 2.0 * (2.0 * a - 5.0 * b + 4.0 * c - d) * t + 3.0 * (-a + 3.0 * b - 3.0 * c + d) * t * t); }
`;
const SKIN = `
layout(location=0) in vec4 a_la; layout(location=1) in vec4 a_lb; layout(location=2) in vec4 a_n; layout(location=3) in vec4 a_bn; layout(location=4) in vec4 a_uv;
vec3 legNode(TI ti, int c, int n){ return simNode(ti, LEGS + c * 8 + clamp(n, 0, 7)); }
void skin(TI ti, vec3 nloc, vec3 bloc, out vec3 P, out vec3 N, out vec3 B){
  int ba = int(a_bn.x + 0.5);
  if (a_bn.z > -0.5) {                      // trouser leg: a ring round the simulated chain
    int c = int(a_bn.z + 0.5); float sn = a_la.y * 7.0; int i = int(floor(sn)); float f = sn - float(i); if (i >= 7) { i = 6; f = 1.0; }
    vec3 p0 = legNode(ti, c, i - 1), p1 = legNode(ti, c, i), p2 = legNode(ti, c, i + 1), p3 = legNode(ti, c, i + 2);
    vec3 C = cr(p0, p1, p2, p3, f) + jpos(ti, 0), T = normalize(crT(p0, p1, p2, p3, f));
    vec3 Xr = normalize(mix(qrot(jquat(ti, ba), vec3(-1.0, 0.0, 0.0)), qrot(jquat(ti, ba + 1), vec3(-1.0, 0.0, 0.0)), smoothstep(0.35, 0.65, a_la.y)));
    vec3 Z = normalize(cross(T, Xr)), X = cross(Z, T);
    P = C + X * a_la.x + Z * a_la.z; N = X * nloc.x - T * nloc.y + Z * nloc.z; B = X * bloc.x - T * bloc.y + Z * bloc.z;
  } else {
    int bb = int(a_bn.y + 0.5); vec4 qa = jquat(ti, ba); vec3 la = a_la.xyz; la.y *= bscale(i_misc.x, ba);
    P = jpos(ti, ba) + qrot(qa, la);
    if (a_lb.w > 0.001) { vec3 lb = a_lb.xyz; lb.y *= bscale(i_misc.x, bb); P = mix(P, jpos(ti, bb) + qrot(jquat(ti, bb), lb), a_lb.w); }
    if (a_bn.w > 0.0) P += simNode(ti, LAG + 2) * a_bn.w;
    N = qrot(qa, nloc); B = qrot(qa, bloc);
  }
}`;
const PARTS = `
const vec3 ORANGE = vec3(1.0, 0.36, 0.05);
const vec3 KEY = vec3(0.45, 0.78, 0.44);
vec3 S(float r, float g, float b){ return pow(vec3(r, g, b), vec3(2.2)); }
vec3 celColor(int p){
  if (p == ${PART.SKIN}) return S(0.972, 0.858, 0.782);
  if (p == ${PART.HAIR} || p == ${PART.BUN}) return S(0.085, 0.080, 0.115);
  if (p == ${PART.JACKET} || p == ${PART.PATCH} || p == ${PART.SHOE}) return S(0.960, 0.955, 0.940);
  if (p == ${PART.STRIPE} || p == ${PART.STRAP} || p == ${PART.PHONE}) return S(0.970, 0.505, 0.130);
  if (p == ${PART.TOP} || p == ${PART.BELT} || p == ${PART.PHONEBLK} || p == ${PART.PTEXT} || p == ${PART.LEAD}) return S(0.105, 0.105, 0.128);
  if (p == ${PART.TROUSER}) return S(0.130, 0.165, 0.300);
  if (p == ${PART.POCKET}) return S(0.148, 0.186, 0.330);
  if (p == ${PART.DOT}) return S(0.490, 0.700, 0.935);
  if (p == ${PART.TEXT}) return S(0.130, 0.165, 0.300);
  if (p == ${PART.SOLE}) return S(0.82, 0.82, 0.82);
  if (p == ${PART.PENCIL}) return S(0.98, 0.76, 0.20);
  if (p == ${PART.ERASER}) return S(0.95, 0.55, 0.62);
  return vec3(0.5);
}
bool emissive(int p){ return p == ${PART.STRIPE} || p == ${PART.PHONE} || p == ${PART.STRAP} || p == ${PART.PENCIL}; }
`;

const MESH_VS = COMMON + SKIN + `
uniform int u_points;
out vec3 v_n; out vec3 v_w; out vec2 v_uv; out vec3 v_la; out vec4 v_flags;   // region, thin, point part (-1 = mesh), -
flat out vec4 v_inst; flat out vec4 v_lane; flat out float v_eyes;
void cull(){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; }
void main(){
  v_inst = vec4(i_par.w, celAmt(), i_par.z, i_fx.x); v_lane = i_col; v_eyes = i_fx.w;
  if (i_fx.x <= 0.0 || (u_points == 0 && a_uv.z > 1.5 && i_misc.y < 0.5)) { cull(); return; }
  TI ti = trackInfo(i_misc.x, i_par.y); vec3 P, N, B; skin(ti, a_n.xyz, vec3(1.0, 0.0, 0.0), P, N, B);
  vec3 W = place(P); v_n = yaw(N); v_la = a_la.xyz; v_uv = a_uv.xy;
  v_flags = vec4(a_uv.w, a_bn.z > -0.5 ? smoothstep(0.5, 1.0, a_la.y) : 0.0, -1.0, 0.0);
  if (u_points == 1) {
    vec3 V = normalize(u_camPos - W); W += V * 0.005; v_flags.z = a_la.w;
    gl_PointSize = clamp(2.0 * a_uv.x * i_par.x * u_px / distance(u_camPos, W) * 1.15, 1.5, u_maxPS);
  }
  v_w = W; gl_Position = u_viewProj * vec4(W, 1.0);
}`;
const MESH_FS = `#version 300 es
precision highp float; precision highp int;
uniform sampler2D u_parts; uniform vec3 u_camPos, u_sun; uniform int u_points; uniform float u_psize;
in vec3 v_n; in vec3 v_w; in vec2 v_uv; in vec3 v_la; in vec4 v_flags;
flat in vec4 v_inst; flat in vec4 v_lane; flat in float v_eyes;
layout(location=0) out vec4 o_col; layout(location=1) out vec4 o_aux;
${PARTS}
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float hash(float n){ return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
void main(){
  int part;
  if (u_points == 1) { if (length(gl_PointCoord * 2.0 - 1.0) > 1.0) discard; part = int(v_flags.z + 0.5); }
  else { part = int(texelFetch(u_parts, ivec2(v_uv * u_psize), 0).r * 255.0 + 0.5); if (part == 255) discard; }
  float solid = v_inst.x, cel = v_inst.y, alpha = v_inst.w; vec3 lane = v_lane.rgb;
  if (alpha < 0.999 && ign(gl_FragCoord.xy) > alpha) discard;
  vec3 V = normalize(u_camPos - v_w), N = normalize(v_n); float inside = 0.0; if (dot(N, V) < 0.0) { N = -N; inside = 1.0; }
  float region = floor(v_flags.x + 0.5), thin = v_flags.y * v_flags.y * (1.0 - inside);
  float facing = dot(N, V), fres = 1.0 - facing;
  // face: closed-eye arcs (or open ovals), a brow hint, a blush. Drawn in head space, so they never swim.
  float eye = 0.0, brow = 0.0, blush = 0.0;
  if (part == ${PART.SKIN} && region == 5.0 && v_la.z > 0.03) {
    float sx = v_la.x < 0.0 ? -1.0 : 1.0, lx = abs(v_la.x) - 0.0315, ly = v_la.y - 0.034, t = lx / 0.0135;
    if (v_eyes > 0.5) { eye = smoothstep(1.06, 0.94, (lx * lx) / (0.0082 * 0.0082) + (ly * ly) / (0.0122 * 0.0122)); eye = max(eye, smoothstep(0.0016, 0.0009, abs(ly - (0.0118 - 12.0 * lx * lx))) * step(abs(t), 1.0)); }
    else eye = smoothstep(0.0017, 0.0010, abs(ly - (-0.0040 + 0.0046 * t * t)) / (1.0 - 0.45 * t * t)) * step(abs(t), 1.0);
    brow = smoothstep(0.0013, 0.0007, abs(ly - (0.0245 + 0.0022 * (1.0 - t * t) - 0.001 * t))) * step(abs(t - 0.05), 0.82);
    vec2 b = vec2((abs(v_la.x) - 0.045) / 0.017, (ly + 0.026) / 0.009); blush = exp(-dot(b, b) * 1.4);
  }
  // ---- light: the body only occludes; skin is a paper lantern; accents and decals are solid light ----
  vec3 lit = vec3(0.0030, 0.0030, 0.0055) + lane * (0.26 * pow(fres, 3.5)) * v_lane.a;
  if (part == ${PART.SKIN}) lit = mix(vec3(1.0, 0.86, 0.72), lane, 0.22) * (0.010 + 0.30 * pow(facing, 2.2)) * (1.0 - 0.62 * eye) * v_lane.a;
  else if (emissive(part)) lit = ORANGE * 1.15 * v_lane.a;
  else if (part == ${PART.DOT}) lit = vec3(0.32, 0.58, 1.0) * 0.95 * v_lane.a;
  else if (part == ${PART.TEXT}) lit = vec3(1.0, 0.95, 0.86) * 1.7 * v_lane.a;
  else if (part == ${PART.PATCH}) lit = vec3(0.95, 0.93, 0.90) * v_lane.a;
  else if (part == ${PART.SHOE} || part == ${PART.SOLE}) lit += mix(lane, vec3(1.0), 0.6) * (0.012 + 0.10 * fres * fres) * v_lane.a;
  // ---- silhouette: black against the sun, a warm rim, thin cloth lets a little sun through ----
  float rim = pow(fres, 2.6) * smoothstep(-0.2, 0.6, dot(N, u_sun)), back = smoothstep(0.1, 0.9, dot(-V, u_sun));
  vec3 sil = vec3(0.010, 0.007, 0.013) + rim * vec3(1.0, 0.50, 0.16) * 2.6 + vec3(1.0, 0.42, 0.10) * back * thin * thin * 0.09;
  if (emissive(part)) sil = ORANGE * 1.7; else if (part == ${PART.DOT}) sil += vec3(0.02, 0.04, 0.09);
  // ---- cel: the character sheet ----
  vec3 base = celColor(part);
  if (part == ${PART.SKIN}) { base = mix(base, S(0.96, 0.66, 0.64), 0.34 * blush); base = mix(base, S(0.20, 0.15, 0.17), max(eye, 0.4 * brow)); }
  float sh = smoothstep(-0.07, 0.07, dot(N, normalize(KEY)) + 0.10);
  vec3 celc = base * mix(vec3(0.70, 0.73, 0.88), vec3(1.0), sh) * (1.0 - 0.55 * inside * step(2.5, region) * step(region, 4.5));
  o_col = vec4(mix(lit, mix(sil, celc, cel), solid), 1.0);
  o_aux = vec4(celColor(part) * 0.7 + 0.3 * vec3(hash(region + 0.37), hash(region + 1.7), hash(region + 4.1)), cel * solid);
}`;

const FIB_VS = COMMON + SKIN + `
layout(location=5) in vec4 a_bin; layout(location=6) in vec4 a_fib;   // local binormal + side ; along (m), seed, half width
out vec3 v_f; out vec2 v_uv; out float v_gain; out float v_glyph; flat out vec4 v_lane; flat out vec3 v_id;
void cull(){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); }
void main(){
  float solid = i_par.w, dens = i_par.z, seed = a_fib.y; v_lane = i_col; v_id = vec3(seed, i_misc.z, i_fx.z);
  float vis = smoothstep(dens + 0.02, dens - 0.02, hash(seed * 7.3) * 0.96 + 0.02);
  if (solid > 0.995 || i_fx.x <= 0.0 || vis <= 0.0) { cull(); return; }
  TI ti = trackInfo(i_misc.x, i_par.y); vec3 P, N, B; skin(ti, a_n.xyz, a_bin.xyz, P, N, B);
  vec3 W = place(P), Nw = yaw(N), Bw = normalize(yaw(B));
  float dist = distance(u_camPos, W); vec3 V = (u_camPos - W) / dist; float facing = dot(Nw, V);
  W += V * 0.012;
  float sc = i_par.x, wpx = 2.0 * a_fib.z * sc * u_px / dist, glyph = smoothstep(6.5, 10.5, wpx);
  float halfW = a_fib.z * sc * mix(0.34, 1.0, glyph) * (1.0 + 2.5 * solid);
  vec4 c0 = u_viewProj * vec4(W, 1.0), c1 = u_viewProj * vec4(W + Bw * halfW, 1.0);
  float dpx = length((c1.xy / c1.w - c0.xy / c0.w) * vec2(u_aspect, 1.0)) * 0.5 * u_H, minHalf = 0.62;
  float k = dpx < minHalf ? min(minHalf / max(dpx, 1e-3), 8.0) : 1.0;
  gl_Position = u_viewProj * vec4(W + Bw * (halfW * k * a_bin.w), 1.0);
  float bright = mix(0.16, 1.5, pow(hash(seed * 3.1), 2.2));
  float coc = u_aperture * abs(1.0 / u_focus - 1.0 / dist) * u_H;
  v_gain = smoothstep(-0.15, 0.02, facing) * bright * (0.42 + 1.5 * pow(1.0 - max(facing, 0.0), 1.6)) * vis * (1.0 - solid) * i_fx.x * i_col.w * min(dpx / minHalf, 1.0) * min(u_lod, 8.0) * (max(dpx, minHalf) / (max(dpx, minHalf) + 0.5 * coc));
  v_glyph = glyph * (1.0 - smoothstep(0.3 * wpx, wpx, coc)); v_f = vec3(a_bin.w, a_fib.x, a_fib.z * 2.0); v_uv = a_uv.xy;
}`;
const FIB_FS = `#version 300 es
precision highp float; precision highp int;
uniform sampler2D u_parts, u_atlas, u_text; uniform float u_psize, u_time;
in vec3 v_f; in vec2 v_uv; in float v_gain; in float v_glyph; flat in vec4 v_lane; flat in vec3 v_id;
layout(location=0) out vec4 o_col; layout(location=1) out vec4 o_aux;
void main(){
  int part = int(texelFetch(u_parts, ivec2(v_uv * u_psize), 0).r * 255.0 + 0.5); vec3 lane = v_lane.rgb, col;
  if (part == ${PART.JACKET}) col = mix(lane, vec3(1.0, 0.95, 0.86), 0.80) * 0.80;
  else if (part == ${PART.TROUSER}) col = lane * 0.95 + vec3(0.02, 0.03, 0.08);
  else if (part == ${PART.POCKET}) col = lane * 1.25 + vec3(0.03, 0.04, 0.10);
  else discard;
  float across = v_f.x, I = exp(-across * across * 2.6);
  if (v_glyph > 0.001) {
    float adv = v_f.z * 0.6, cf = v_f.y / adv + floor(u_time * v_id.z), cell = floor(cf);
    float code = texelFetch(u_text, ivec2(int(mod(floor(v_id.x * 251.0) * 7.0 + cell, 256.0)), int(v_id.y)), 0).r * 255.0;
    float g = 0.0;
    if (code > 32.5) { code = clamp(code - 32.0, 0.0, 95.0); vec2 c = vec2(mod(code, 16.0), floor(code / 16.0)); g = texture(u_atlas, (c + vec2(0.19 + 0.62 * fract(cf), 0.5 - 0.5 * across)) / vec2(16.0, 6.0)).r; }
    I = mix(I, g * 1.15, v_glyph);
  }
  float word = floor(v_f.y / (v_f.z * 2.6) + v_id.x * 31.0), wh = fract(sin(word * 91.7 + v_id.x * 517.0) * 43758.5453);
  I *= mix(1.0, wh < 0.30 ? 0.10 : 0.55 + 0.75 * wh, 1.0 - v_glyph);                 // far away the text reads as dashes of light: words
  I *= 0.74 + 0.26 * sin(v_f.y * 13.0 - u_time * 2.1 + v_id.x * 40.0);
  if (I * v_gain < 0.0004) discard;
  o_col = vec4(col * I * v_gain, 0.0); o_aux = vec4(0.0);
}`;

const RIB_VS = COMMON + PARTS + `
layout(location=0) in vec4 a_r0; // kind (0 hair, 1 strap, 2 trail), id, s, side
layout(location=1) in vec4 a_r1; // guides g0 g1 g2, seed
layout(location=2) in vec4 a_r2; // weights w0 w1 w2, hair type (0 back, 1 bun wisps, 2 front locks)
layout(location=3) in vec4 a_r3; // hair: fan, spread ; strap: width ; trail: emitter type, index, local y
out vec4 v_col; out vec4 v_aux; out float v_side; out float v_alpha; out float v_cov;
void cull(){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); }
vec3 hairNode(TI ti, int n){ n = clamp(n, 0, NODES - 1); return a_r2.x * simNode(ti, int(a_r1.x) * NODES + n) + a_r2.y * simNode(ti, int(a_r1.y) * NODES + n) + a_r2.z * simNode(ti, int(a_r1.z) * NODES + n); }
vec3 strapNode(TI ti, int id, int n){ return simNode(ti, STRAP + id * ${STRAP_N} + clamp(n, 0, ${STRAP_N - 1})); }
vec3 emitter(float time){
  TI ti = trackInfo(i_misc.x, time); int ty = int(a_r3.x + 0.5), ix = int(a_r3.y + 0.5);
  if (ty == 0) return jpos(ti, ix) + qrot(jquat(ti, ix), vec3(0.0, a_r3.z, 0.0));
  return simNode(ti, ix) + jpos(ti, 0);
}
void main(){
  int kind = int(a_r0.x + 0.5); float s = a_r0.z, side = a_r0.w, solid = i_par.w, cel = celAmt(), dens = i_par.z;
  v_col = vec4(0.0); v_aux = vec4(0.0); v_side = side; v_alpha = i_fx.x; v_cov = 1.0;
  if (i_fx.x <= 0.0) { cull(); return; }
  vec3 P, T; float width; vec3 colOpaque = vec3(0.0), colAdd = vec3(0.0); float seed = a_r1.w;
  if (kind == 0) {
    int ty = int(a_r2.w + 0.5); bool bun = i_misc.y > 0.5;
    if ((ty == 1) != bun) { cull(); return; }
    TI ti = trackInfo(i_misc.x, i_par.y);
    float sl = s * (0.86 + 0.14 * hash(seed * 23.0)) * (ty == 0 ? 1.0 - 0.08 * hash(i_fx.y * 3.3 + 1.0) : 1.0);
    float sn = sl * float(NODES - 1); int i = int(floor(sn)); float f = sn - float(i); if (i >= NODES - 1) { i = NODES - 2; f = 1.0; }
    vec3 p0 = hairNode(ti, i - 1), p1 = hairNode(ti, i), p2 = hairNode(ti, i + 1), p3 = hairNode(ti, i + 2);
    P = cr(p0, p1, p2, p3, f); T = crT(p0, p1, p2, p3, f);
    vec3 rnd = vec3(hash(seed * 91.0), hash(seed * 57.0 + 2.0), hash(seed * 13.0 + 5.0)) - 0.5;
    vec3 cx = qrot(jquat(ti, ${J.chest}), vec3(1.0, 0.0, 0.0));
    P += jpos(ti, 0) + rnd * a_r3.y * (0.3 + 1.5 * sl) * smoothstep(0.0, 0.15, sl) + cx * (a_r3.x * 0.055 * smoothstep(0.22, 0.8, sl));
    float vis = smoothstep(dens * 1.15 + 0.02, dens * 1.15 - 0.02, seed), tip = 1.0 - smoothstep(0.86, 1.0, s);
    float wide = (ty == 0 ? 0.017 : 0.0075) * u_lod * (0.45 + 0.55 * tip) * smoothstep(0.0, 0.06, s + 0.02);
    width = mix(0.0016 * (0.4 + 0.6 * tip), wide, smoothstep(0.0, 0.5, solid));
    vec3 Wq = place(P), Vq = normalize(u_camPos - Wq), Tw = normalize(yaw(T)), lane = i_col.rgb;
    float sheen = pow(clamp(1.0 - abs(dot(Tw, normalize(Vq + normalize(KEY)))), 0.0, 1.0), 9.0);
    float band = exp(-pow((s - 0.21 - 0.04 * hash(seed * 7.0)) / 0.075, 2.0));
    float strandB = 0.25 + 1.3 * pow(hash(seed * 4.7), 2.0);
    colAdd = (lane * 0.50 + vec3(0.04, 0.05, 0.14) + mix(lane, vec3(1.0), 0.5) * (0.45 * band + 0.4 * sheen)) * strandB * (0.25 + 0.75 * tip) * vis * 0.080 * i_col.w * u_lod;
    vec3 Nh = normalize(Wq - place(jpos(ti, ${J.head}) + vec3(0.0, 0.02, 0.0)) + vec3(0.0, 0.25, 0.0));
    float rim = pow(1.0 - abs(dot(Nh, Vq)), 2.5) * smoothstep(-0.2, 0.7, dot(Nh, u_sun)), back = smoothstep(0.1, 0.9, dot(-Vq, u_sun));
    vec3 sil = vec3(0.008, 0.006, 0.011) + rim * vec3(1.0, 0.5, 0.16) * 0.35 + vec3(1.0, 0.40, 0.09) * back * step(0.7, hash(seed * 5.0)) * 0.10 * smoothstep(0.7, 1.0, s);
    vec3 celc = celColor(${PART.HAIR}) * (0.85 + 0.3 * hash(seed * 3.0)) + vec3(0.034, 0.038, 0.078) * band + vec3(0.012, 0.012, 0.03) * sheen;
    colOpaque = mix(sil, celc, cel);
    v_cov = smoothstep(0.0, 0.35, solid) * (seed < 0.02 + dens * 1.2 ? 1.0 : 0.0);
    v_aux = vec4(celColor(${PART.HAIR}), cel * solid);
  } else if (kind == 1) {
    TI ti = trackInfo(i_misc.x, i_par.y); int id = int(a_r0.y + 0.5);
    float sn = s * float(${STRAP_N - 1}); int i = int(floor(sn)); float f = sn - float(i); if (i >= ${STRAP_N - 1}) { i = ${STRAP_N - 2}; f = 1.0; }
    vec3 p0 = strapNode(ti, id, i - 1), p1 = strapNode(ti, id, i), p2 = strapNode(ti, id, i + 1), p3 = strapNode(ti, id, i + 2);
    P = cr(p0, p1, p2, p3, f) + jpos(ti, 0); T = crT(p0, p1, p2, p3, f); width = a_r3.x;
    float buckle = min(1.0, step(abs(s - 0.34), 0.03) + step(abs(s - 0.50), 0.022) + step(0.965, s));
    vec3 lit = mix(ORANGE * 1.15 * i_col.w, vec3(0.004), buckle);
    colOpaque = mix(lit, mix(mix(ORANGE * 1.7, vec3(0.012), buckle), mix(celColor(${PART.STRAP}), vec3(0.03), buckle), cel), solid);
    v_aux = vec4(celColor(${PART.STRAP}), cel * solid); solid = 1.0;
  } else {
    float L = i_trail.x; if (L <= 0.0 || u_pass == 0) { cull(); return; }
    float m = floor(i_trail.z / exp2(a_r0.y)); if (mod(m, 2.0) < 0.5) { cull(); return; }
    float tt = i_par.y - s * L; P = emitter(tt); T = emitter(tt + 1.0 / 90.0) - P;
    if (dot(T, T) < 1e-10) T = vec3(0.0, 1e-4, 0.0);
    float sp = length(T) * 90.0;                      // slow parts draw thin, like a brush
    width = i_tcol.w * pow(1.0 - s, 0.8) * smoothstep(0.0, 0.03, s + 0.03) * clamp(0.25 + sp * 0.22, 0.25, 1.6);
    colAdd = i_tcol.rgb * i_trail.y * pow(1.0 - s, 1.6) * clamp(sp * 0.35, 0.15, 1.2); solid = 0.0;
  }
  vec3 W = place(P), Tw = yaw(T) * i_par.x; float dist = distance(u_camPos, W); vec3 V = (u_camPos - W) / dist;
  if (u_pass == 1) W += V * 0.012;
  vec4 c0 = u_viewProj * vec4(W, 1.0), c1 = u_viewProj * vec4(W + normalize(Tw) * 0.02, 1.0);
  vec2 dir = (c1.xy / max(c1.w, 1e-4) - c0.xy / max(c0.w, 1e-4)) * vec2(u_aspect, 1.0);
  dir = dot(dir, dir) < 1e-12 ? vec2(0.0, 1.0) : normalize(dir); vec2 nrm = vec2(-dir.y, dir.x);
  float wpx = width * i_par.x * u_px / dist, minPx = (u_pass == 0) ? 1.6 : 1.1, wc = max(wpx, minPx), comp = wpx / wc;
  c0.xy += nrm * side * (wc / u_H) * c0.w * vec2(1.0 / u_aspect, 1.0); gl_Position = c0;
  if (u_pass == 0) {
    if (kind == 2 || (kind == 0 && solid < 0.01)) { cull(); return; }
    v_col = vec4(mix(vec3(0.0035, 0.0035, 0.006), colOpaque, kind == 1 ? 1.0 : solid), 1.0);
    v_cov *= (kind == 0) ? mix(comp, 1.0, 0.5) : 1.0;
  } else {
    if (kind == 1) { cull(); return; }
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
  if (u_pass == 0) { float a = v_alpha * v_cov; if (a < 0.999 && ign(gl_FragCoord.xy) >= a) discard; o_col = v_col; o_aux = v_aux; return; }
  o_col = vec4(v_col.rgb * (0.35 + 0.65 * (1.0 - v_side * v_side)), 0.0); o_aux = vec4(0.0);
}`;

function program(gl, vs, fs, name) {
  const mk = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { const log = gl.getShaderInfoLog(s); console.error(name, log); throw new Error(name + ' shader: ' + log); } return s; };
  const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, vs)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, fs)); gl.linkProgram(p);
  if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(name + ' link: ' + gl.getProgramInfoLog(p));
  const u = {}; const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (let i = 0; i < n; i++) { const info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
  return { p, u };
}
async function ensureFont(family, url, desc) {
  try { if (document.fonts.check(`16px "${family}"`)) return; const f = new FontFace(family, `url("${encodeURI(url)}")`, desc || {}); await f.load(); document.fonts.add(f); }
  catch (e) { console.warn('figure: font ' + family + ' not loaded (' + e.message + '); falling back'); }
}
const h1 = (n) => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

export class Figure {
  constructor(gl, opts = {}) {
    this.gl = gl; this.opts = { fontBase: '/engine/fonts/', stories: DEFAULT_STORIES, strands: 1000, ...opts };
    this.tracks = []; this.byName = {}; this.inst = []; this.dirty = true; this.sun = [1, 0.06, 0]; this.quality = 1;
  }
  async init() {
    const gl = this.gl, o = this.opts;
    if (!gl.getExtension('EXT_color_buffer_float')) console.warn('figure: EXT_color_buffer_float missing');
    await ensureFont('JetBrains Mono', o.fontBase + 'JetBrainsMono[wght].ttf', { weight: '100 800' });
    await ensureFont('Archivo', o.fontBase + 'Archivo[wdth,wght].ttf', { weight: '100 900', stretch: '62% 125%' });
    const body = this.body = buildBody({ strands: o.strands, seed: o.seed });
    this.maxPS = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE)[1];
    this.meshProg = program(gl, MESH_VS, MESH_FS, 'figure.mesh'); this.fibProg = program(gl, FIB_VS, FIB_FS, 'figure.fibre'); this.ribProg = program(gl, RIB_VS, RIB_FS, 'figure.ribbon');
    this.instBuf = gl.createBuffer();
    const vao = (verts, stride, nAttr, idx) => {
      const v = gl.createVertexArray(); gl.bindVertexArray(v); const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, verts, gl.STATIC_DRAW);
      for (let k = 0; k < nAttr; k++) { gl.enableVertexAttribArray(k); gl.vertexAttribPointer(k, 4, gl.FLOAT, false, stride * 4, k * 16); }
      if (idx) { const ib = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW); }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf); for (let k = 0; k < 7; k++) { gl.enableVertexAttribArray(8 + k); gl.vertexAttribPointer(8 + k, 4, gl.FLOAT, false, INST_F * 4, k * 16); gl.vertexAttribDivisor(8 + k, 1); }
      gl.bindVertexArray(null); return v;
    };
    this.meshes = body.meshes.map((m) => ({ vao: vao(m.v, VSTRIDE, 5, m.i), n: m.i.length }));
    this.vaoPts = vao(body.points, VSTRIDE, 5, null); this.vaoFib = vao(body.fibres.v, FSTRIDE, 7, body.fibres.i);
    this._buildRibbons(vao); this._buildAtlas(); this._buildText(o.stories);
    this.texParts = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, this.texParts); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, body.atlas.size, body.atlas.size, 0, gl.RED, gl.UNSIGNED_BYTE, body.atlas.data);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    this.texJoint = gl.createTexture(); this.texSim = gl.createTexture(); this.texTracks = gl.createTexture();
    return this;
  }
  get stats() { const b = this.body; return { tris: b.meshes.map((m) => m.i.length / 3), fibres: b.fibres.count, points: b.nPoints, strands: b.strands.length }; }

  _buildRibbons(vao) {
    const body = this.body, V = [], I = [];
    const strip = (seg, r0, r1, r2, r3) => { const base = V.length / 16; for (let k = 0; k <= seg; k++) for (const side of [-1, 1]) V.push(r0[0], r0[1], k / seg, side, ...r1, ...r2, ...r3); for (let k = 0; k < seg; k++) { const a = base + k * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } };
    const hair = (s, i) => strip(SEG_HAIR, [0, i], [s.g[0], s.g[1], s.g[2], s.seed], [s.w[0], s.w[1], s.w[2], s.type], [s.fan, s.spread, 0, 0]);
    const back = body.strands.filter((s) => s.type === 0), rest = body.strands.filter((s) => s.type !== 0);
    back.forEach(hair); const nBack = I.length; rest.forEach(hair); const nHair = I.length;
    body.straps.forEach((s, i) => strip(SEG_STRAP, [1, i], [0, 0, 0, 0.5], [0, 0, 0, 0], [s.width, 0, 0, 0])); const nStrap = I.length;
    const G = HAIR.NODES;
    this.emitters = [
      { name: 'handL', r3: [0, J.handL, 0.10, 0] }, { name: 'handR', r3: [0, J.handR, 0.10, 0] }, { name: 'toeL', r3: [0, J.toeL, 0.06, 0] }, { name: 'toeR', r3: [0, J.toeR, 0.06, 0] },
      { name: 'strap0', r3: [1, SIM.strap + STRAP_N - 1, 0, 0] }, { name: 'strap1', r3: [1, SIM.strap + 2 * STRAP_N - 1, 0, 0] }, { name: 'strap2', r3: [1, SIM.strap + 3 * STRAP_N - 1, 0, 0] },
      ...[2, 14, 26, 30, 42, 54].map((g, k) => ({ name: 'hair' + k, r3: [1, g * G + G - 1, 0, 0] })),
      { name: 'hemL', r3: [1, SIM.leg + 7, 0, 0] }, { name: 'hemR', r3: [1, SIM.leg + 15, 0, 0] },
    ];
    this.emitters.forEach((e, i) => strip(SEG_TRAIL, [2, i], [0, 0, 0, 0], [0, 0, 0, 0], e.r3)); const nTrail = I.length;
    this.rib = { back: [0, nBack], rest: [nBack, nHair - nBack], strap: [nHair, nStrap - nHair], trail: [nStrap, nTrail - nStrap], perStrand: SEG_HAIR * 6, nBack: back.length };
    this.vaoRib = vao(new Float32Array(V), 16, 4, new Uint32Array(I));
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
    if (track.loop && !track.loopDelta) { const D = track.data, F = track.frames, a = (F - 1) * STRIDE, b = Math.max(0, F - 2) * STRIDE; track.loopDelta = [D[a] - D[0] + (D[a] - D[b]), D[a + 2] - D[2] + (D[a + 2] - D[b + 2])]; }
    const t0 = performance.now(), sim = simulate(track, this.body, simOpts), start = this.tracks.reduce((s, t) => s + t.frames, 0), id = this.tracks.length;
    this.tracks.push({ track, sim, start, frames: track.frames, simMs: performance.now() - t0 }); this.byName[track.name] = id; this.dirty = true; return id;
  }
  trackId(t) { return typeof t === 'number' ? t : (this.byName[t] ?? 0); }
  _upload() {
    const gl = this.gl, total = this.tracks.reduce((s, t) => s + t.frames, 0), cols = Math.max(1, Math.ceil(total / ATH)), rows = Math.min(ATH, Math.max(1, total)), jw = cols * 42, sw = cols * SIM.W;
    if (sw > gl.getParameter(gl.MAX_TEXTURE_SIZE)) throw new Error('figure: too many track frames for the atlas (' + total + ')');
    const J4 = new Float32Array(jw * rows * 4); gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
    const near = () => { gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); };
    gl.bindTexture(gl.TEXTURE_2D, this.texSim); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, sw, rows, 0, gl.RGBA, gl.FLOAT, null);
    for (const T of this.tracks) {
      const D = T.track.data;
      for (let f = 0; f < T.frames; f++) { const g = T.start + f, o = ((g % ATH) * jw + Math.floor(g / ATH) * 42) * 4, s = f * STRIDE; for (let j = 0; j < NJ; j++) { J4[o + j * 8] = D[s + j * 7]; J4[o + j * 8 + 1] = D[s + j * 7 + 1]; J4[o + j * 8 + 2] = D[s + j * 7 + 2]; J4[o + j * 8 + 4] = D[s + j * 7 + 3]; J4[o + j * 8 + 5] = D[s + j * 7 + 4]; J4[o + j * 8 + 6] = D[s + j * 7 + 5]; J4[o + j * 8 + 7] = D[s + j * 7 + 6]; } }
      let f = 0; while (f < T.frames) { const g = T.start + f, row = g % ATH, n = Math.min(T.frames - f, ATH - row); gl.texSubImage2D(gl.TEXTURE_2D, 0, Math.floor(g / ATH) * SIM.W, row, SIM.W, n, gl.RGBA, gl.FLOAT, T.sim.subarray(f * SIM.W * 4, (f + n) * SIM.W * 4)); f += n; }
    }
    near(); gl.bindTexture(gl.TEXTURE_2D, this.texJoint); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, jw, rows, 0, gl.RGBA, gl.FLOAT, J4); near();
    const n = Math.max(1, this.tracks.length), TT = new Float32Array(8 * n * 4);
    this.tracks.forEach((T, i) => { const o = i * 32, ld = T.track.loop ? (T.track.loopDelta || [0, 0]) : [0, 0]; TT.set([T.start, T.frames, T.track.loop ? 1 : 0, T.track.fps || 60, ld[0], ld[1], 0, 0], o); TT.set(boneScales(T.track), o + 8); });
    gl.bindTexture(gl.TEXTURE_2D, this.texTracks); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA32F, 8, n, 0, gl.RGBA, gl.FLOAT, TT); near(); this.dirty = false;
  }

  // ---- instances ----
  begin() { this.inst.length = 0; }
  add(o) { this.inst.push(o); return o; }
  _uniforms(P, ctx, camPos) {
    const gl = this.gl, u = P.u; gl.useProgram(P.p);
    gl.uniformMatrix4fv(u.u_viewProj, false, ctx.viewProj); gl.uniform3fv(u.u_camPos, camPos); if (u.u_sun) gl.uniform3fv(u.u_sun, ctx.sunDir || this.sun);
    const fovY = ctx.fovY || 0.6; gl.uniform1f(u.u_px, ctx.H / (2 * Math.tan(fovY / 2))); gl.uniform1f(u.u_H, ctx.H); gl.uniform1f(u.u_aspect, ctx.W / ctx.H);
    gl.uniform1f(u.u_focus, ctx.focusDist || 5); gl.uniform1f(u.u_aperture, ctx.aperture || 0); gl.uniform1f(u.u_dawn, ctx.dawn || 0); gl.uniform1f(u.u_time, ctx.t || 0);
    gl.uniform1f(u.u_maxPS, this.maxPS); gl.uniform1i(u.u_pass, ctx.pass === 'opaque' ? 0 : 1);
    const tex = (unit, t, loc) => { if (loc) { gl.activeTexture(gl.TEXTURE0 + unit); gl.bindTexture(gl.TEXTURE_2D, t); gl.uniform1i(loc, unit); } };
    tex(0, this.texJoint, u.u_joint); tex(1, this.texSim, u.u_sim); tex(2, this.texTracks, u.u_tracks); tex(3, this.texAtlas, u.u_atlas); tex(4, this.texText, u.u_text); tex(5, this.texParts, u.u_parts);
    if (u.u_psize) gl.uniform1f(u.u_psize, this.body.atlas.size);
  }
  draw(ctx) {
    const gl = this.gl; if (!this.inst.length || !this.tracks.length) return;
    if (this.dirty) this._upload();
    const opaque = ctx.pass === 'opaque', v = ctx.view;
    const camPos = v ? [-(v[0] * v[12] + v[1] * v[13] + v[2] * v[14]), -(v[4] * v[12] + v[5] * v[13] + v[6] * v[14]), -(v[8] * v[12] + v[9] * v[13] + v[10] * v[14])] : ctx.camPos;
    const ppm1 = ctx.H / (2 * Math.tan((ctx.fovY || 0.6) / 2));
    const NB = 9, buckets = Array.from({ length: NB }, () => []), q = this.quality * (ctx.reflect ? 0.7 : 1);
    for (const o of this.inst) {
      const p = o.pos || [0, 0, 0], sc = o.scale ?? 1, d = Math.hypot(p[0] - camPos[0], p[1] + 0.9 * sc - camPos[1], p[2] - camPos[2]);
      const hpx = 1.7 * sc * ppm1 / Math.max(d, 0.3) * (o.lodBias || 1) * q, frac = Math.min(1, (hpx / 620) * (hpx / 620));
      buckets[Math.min(NB - 1, Math.max(0, Math.round(-Math.log2(Math.max(frac, 1e-6)))))].push(o);
    }
    if (opaque) { gl.disable(gl.BLEND); gl.enable(gl.DEPTH_TEST); gl.depthMask(true); gl.depthFunc(gl.LEQUAL); }
    else { gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE); gl.enable(gl.DEPTH_TEST); gl.depthMask(false); gl.depthFunc(gl.LEQUAL); }
    gl.disable(gl.CULL_FACE);
    const rib = this.rib, body = this.body;
    for (let lvl = 0; lvl < NB; lvl++) {
      const list = buckets[lvl]; if (!list.length) continue;
      const frac = Math.pow(0.5, lvl), n = list.length;
      let maxSolid = 0, minSolid = 1, anyTrail = false; for (const o of list) { const s = o.solid || 0; maxSolid = Math.max(maxSolid, s); minSolid = Math.min(minSolid, s); if (o.trail && o.trail.len > 0) anyTrail = true; }
      gl.bindBuffer(gl.ARRAY_BUFFER, this.instBuf); gl.bufferData(gl.ARRAY_BUFFER, this._instData(list), gl.DYNAMIC_DRAW);
      const hf = Math.min(1, Math.max(0.05, Math.sqrt(frac) * 1.15)), strands = Math.max(10, Math.round(rib.nBack * hf));
      if (opaque) {
        this._uniforms(this.meshProg, ctx, camPos); const U = this.meshProg.u, M = this.meshes[lvl <= 1 ? 0 : lvl <= 3 ? 1 : 2];
        gl.uniform1i(U.u_points, 0); gl.bindVertexArray(M.vao); gl.drawElementsInstanced(gl.TRIANGLES, M.n, gl.UNSIGNED_INT, 0, n);
        if (lvl <= 5) { gl.uniform1i(U.u_points, 1); gl.bindVertexArray(this.vaoPts); gl.drawArraysInstanced(gl.POINTS, 0, Math.max(1, Math.ceil(body.nPoints * Math.min(1, frac * 4))), n); }
        this._uniforms(this.ribProg, ctx, camPos); gl.bindVertexArray(this.vaoRib); const UR = this.ribProg.u;
        if (maxSolid > 0.005) { gl.uniform1f(UR.u_lod, Math.sqrt(rib.nBack / strands)); gl.drawElementsInstanced(gl.TRIANGLES, strands * rib.perStrand, gl.UNSIGNED_INT, 0, n); gl.uniform1f(UR.u_lod, 1); gl.drawElementsInstanced(gl.TRIANGLES, rib.rest[1], gl.UNSIGNED_INT, rib.rest[0] * 4, n); }
        if (lvl <= 6) { gl.uniform1f(UR.u_lod, 1); gl.drawElementsInstanced(gl.TRIANGLES, rib.strap[1], gl.UNSIGNED_INT, rib.strap[0] * 4, n); }
      } else {
        if (minSolid < 0.995) {
          this._uniforms(this.fibProg, ctx, camPos); gl.bindVertexArray(this.vaoFib); const nf = Math.max(24, Math.min(body.fibres.count, Math.ceil(body.fibres.count * Math.min(1, frac * 3))));
          gl.uniform1f(this.fibProg.u.u_lod, body.fibres.count / nf); gl.drawElementsInstanced(gl.TRIANGLES, nf * body.fibres.per, gl.UNSIGNED_INT, 0, n);
        }
        this._uniforms(this.ribProg, ctx, camPos); gl.bindVertexArray(this.vaoRib); const UR = this.ribProg.u;
        if (minSolid < 0.995) { gl.uniform1f(UR.u_lod, rib.nBack / strands); gl.drawElementsInstanced(gl.TRIANGLES, strands * rib.perStrand, gl.UNSIGNED_INT, 0, n); gl.uniform1f(UR.u_lod, 1); gl.drawElementsInstanced(gl.TRIANGLES, rib.rest[1], gl.UNSIGNED_INT, rib.rest[0] * 4, n); }
        if (anyTrail) { gl.uniform1f(UR.u_lod, 1); gl.drawElementsInstanced(gl.TRIANGLES, rib.trail[1], gl.UNSIGNED_INT, rib.trail[0] * 4, n); }
      }
    }
    gl.bindVertexArray(null); gl.depthMask(true);
  }
  _instData(list) {
    const a = new Float32Array(list.length * INST_F);
    list.forEach((o, i) => {
      const p = o.pos || [0, 0, 0], lane = o.lane || LANES.main, tr = o.trail || {}, k = i * INST_F, seed = o.seed || 0, vary = seed ? (o.vary ?? 1) : 0;
      const variant = (o.variant === 'bun' || o.variant === true || o.variant === 1) ? 1 : 0;
      let mask = tr.mask; if (mask === undefined) mask = 15; if (Array.isArray(mask)) mask = mask.reduce((m, nm) => m | (1 << this.emitters.findIndex((e) => e.name === nm)), 0);
      const tc = tr.color || lane;
      // seeded per-instance variation: a few hundredths of a second, a little height (so a crowd reads as people)
      a.set([p[0], p[1], p[2], o.yaw || 0, (o.scale ?? 1) * (1 + vary * (h1(seed * 1.7) - 0.5) * 0.05), (o.time || 0) + vary * (h1(seed * 2.9) - 0.5) * 0.05, o.density ?? 1, o.solid || 0, lane[0], lane[1], lane[2], o.gain ?? 1,
        this.trackId(o.track ?? 0), variant, Math.min(this.nStories - 1, o.story || 0), o.cel ?? -1, o.alpha ?? 1, seed, o.flow ?? 0, o.eyes ? 1 : 0,
        tr.len || 0, tr.gain ?? 1, mask, 0, tc[0], tc[1], tc[2], tr.width || 0.03], k);
    });
    return a;
  }
}
