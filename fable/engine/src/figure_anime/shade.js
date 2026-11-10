// ANIME look-dev: the shaders that differ from ../figure/figure.js. See fable/notes/anime_lookdev.md.
//   mesh   two-tone cel with a hard, anti-aliased terminator and per-material shadow tints, a hard rim band, drawn folds (shadow shapes
//          in loft space), the FACE (analytic shapes in the head joint's frame: lids, lash, iris, pupil, catchlights, brow, nose, mouth,
//          blush; every edge filtered by its own pixel footprint, so it thins and fades with distance instead of popping),
//          the hairline (same maths as body.js hairD), and the inverted-hull outline pass (u_hull > 0).
//   clump  the hair: flattened tapered tubes on the guide sim, flat two-tone with an "angel ring" in head space.
import { PART, HAIR, FACE } from './body.js';
import { J } from './skeleton.js';

const f = (x) => { const s = String(x); return /[.e]/.test(s) ? s : s + '.0'; };
const FACE_GLSL = Object.entries(FACE).map(([k, v]) => `const float F_${k} = ${f(v)};`).join(' ');

// the hand: bent at two knuckle lines in the hand joint's frame (y = wrist -> fingertips, x*side = palm). Lives in the shared SKIN chunk.
export const HAND_GLSL = `
${FACE_GLSL}
void handPose(inout vec3 p, inout vec3 n){
  float sd = a_lb.x, pk = i_trail.w, hv = (sd > 0.0 ? mod(pk, 64.0) : floor(pk / 64.0)) / 31.5 - 1.0;   // -1 splayed .. 0 relaxed .. 1 fist
  float fi = max(hv, 0.0), op = max(-hv, 0.0);
  if (a_lb.w > -1.5) {
    float a2 = mix(0.35, 1.75, fi) * (1.0 - op) * smoothstep(F_K2 - 0.012, F_K2 + 0.012, p.y), a1 = mix(0.30, 1.50, fi) * (1.0 - op) * smoothstep(F_K1 - 0.012, F_K1 + 0.012, p.y);
    p.z *= 1.0 + 0.38 * op * smoothstep(0.05, 0.15, p.y);
    vec2 d = p.xy - vec2(0.0, F_K2); float c = cos(a2), s = sin(a2) * sd; p.xy = vec2(0.0, F_K2) + vec2(d.x * c + d.y * s, -d.x * s + d.y * c); n.xy = vec2(n.x * c + n.y * s, -n.x * s + n.y * c);
    d = p.xy - vec2(0.0, F_K1); c = cos(a1); s = sin(a1) * sd; p.xy = vec2(0.0, F_K1) + vec2(d.x * c + d.y * s, -d.x * s + d.y * c); n.xy = vec2(n.x * c + n.y * s, -n.x * s + n.y * c);
  } else {
    float a = 1.25 * fi - 0.45 * op; vec2 b = vec2(0.0, 0.026), d = p.xz - b; float c = cos(a), s = sin(a) * sd;
    p.xz = b + vec2(d.x * c + d.y * s, -d.x * s + d.y * c); n.xz = vec2(n.x * c + n.z * s, -n.x * s + n.z * c); p.x += sd * 0.010 * fi;
  }
}`;

// ---------------------------------------------------------------------------------------------------------------------
export const meshVS = (COMMON, SKIN) => COMMON + SKIN + `
uniform int u_points; uniform float u_hull;
out vec3 v_n; out vec3 v_w; out vec2 v_uv; out vec3 v_la; out vec4 v_flags;   // region, thin, point part (-1 = mesh), height above her feet (m)
flat out vec4 v_inst; flat out vec4 v_lane; flat out vec4 v_fa; flat out vec4 v_fb; flat out vec3 v_hv; flat out vec3 v_hl;
void cull(){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; }
vec3 unyaw(vec3 p){ float c = cos(i_pos.w), s = sin(i_pos.w); return vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z); }
// expressions. a: eye open, brow tilt (+ = inner ends down), brow lift, smile ; b: mouth open, joy (closed eyes arc upward)
void expr(float id, out vec4 a, out vec2 b){
  if (id < 0.5) { a = vec4(1.0, 0.0, 0.0, 0.35); b = vec2(0.0); }                    // neutral: calm, the hint of a smile
  else if (id < 1.5) { a = vec4(0.80, 1.5, -1.2, -0.25); b = vec2(0.0); }            // determined
  else if (id < 2.5) { a = vec4(0.96, -0.35, 0.9, 1.0); b = vec2(0.8, 0.0); }        // joy: eyes open (the lower lids rise with the smile), open smile
  else if (id < 3.5) { a = vec4(0.94, -0.55, 0.35, 0.60); b = vec2(0.0); }           // looking back: soft
  else if (id < 4.5) { a = vec4(0.0, -0.2, 0.0, 0.35); b = vec2(0.0); }              // calm: eyes closed
  else { a = vec4(0.0, -0.3, 0.8, 1.0); b = vec2(1.0, 1.0); }                        // laugh: eyes closed in upward arcs, open smile
}
void main(){
  v_inst = vec4(i_par.w, celAmt(), i_par.z, i_fx.x); v_lane = i_col; v_fa = vec4(0.0); v_fb = vec4(0.0); v_hv = vec3(0.0, 0.0, 1.0); v_hl = vec3(0.0, 1.0, 0.0);
  if (i_fx.x <= 0.0) { cull(); return; }
  if (u_points == 0 && a_uv.z > 1.5) {       // variant geometry: 2 bun + one pencil | 3 the second pencil in the bun | 4 that pencil in her right hand
    float vz = a_uv.z, m = i_misc.y; bool show = m > 0.5 && (vz < 2.5 || (vz < 3.5 && m < 1.5) || (vz > 3.5 && m > 1.5 && m < 2.5));
    if (!show) { cull(); return; }
  }
  if (u_hull > 0.0 && u_points == 1) { cull(); return; }
  TI ti = trackInfo(i_misc.x, i_par.y); vec3 P, N, B;
  if (u_hull > 0.0 && u_hull * i_par.x * u_px / distance(u_camPos, place(jpos(ti, 0))) < 0.30) { cull(); return; } skin(ti, a_n.xyz, vec3(1.0, 0.0, 0.0), P, N, B);
  vec3 W = place(P), Nw = normalize(yaw(N)); float reg = floor(a_uv.w + 0.5);
  v_n = Nw; v_la = a_la.xyz; v_uv = a_uv.xy;
  if (u_points == 0 && (reg == 5.0 || reg == 12.0)) {     // the head: clean spherical normals, and the view / key directions in head space
    vec4 hq = jquat(ti, ${J.head}), hc = vec4(-hq.xyz, hq.w); vec3 hp = place(jpos(ti, ${J.head}) + qrot(hq, vec3(0.0, 0.07, 0.0)));
    v_hv = qrot(hc, unyaw(normalize(u_camPos - hp))); v_hl = qrot(hc, unyaw(u_key));
    if (reg == 5.0) v_n = yaw(qrot(hq, normalize(vec3(a_la.x / 0.090, (a_la.y - 0.060) / 0.190, (a_la.z + 0.002) / 0.094))));
    float eid = floor(i_face.x + 1e-4), amt = clamp(fract(i_face.x + 1e-4) / 0.99, 0.0, 1.0);
    vec4 ea, na; vec2 eb, nb; expr(eid, ea, eb); expr(0.0, na, nb); ea = mix(na, ea, amt); eb = mix(nb, eb, amt);
    float blink = i_face.y;
    if (blink < 0.0) { float per = 3.3 + 2.4 * hash(i_fx.y * 5.1 + 0.3), x = fract(u_time / per + hash(i_fx.y * 9.7 + 0.7)) * per / 0.17; blink = x < 1.0 ? pow(sin(3.14159 * x), 0.7) : 0.0; }
    ea.x *= 1.0 - blink; v_fa = ea; v_fb = vec4(eb, i_face.zw);
  }
  v_flags = vec4(a_uv.w, a_bn.z > -0.5 ? smoothstep(0.5, 1.0, a_la.y) : 0.0, -1.0, 0.0);
  if (u_points == 1) {
    vec3 V = normalize(u_camPos - W); W += V * 0.005; v_flags.z = a_la.w;
    gl_PointSize = clamp(2.0 * a_uv.x * i_par.x * u_px / distance(u_camPos, W) * 1.15, 1.5, u_maxPS);
  }
  if (u_hull > 0.0) {                        // inverted hull: the ink line. Heavier on big forms and on the shadow side, never more than ~3 px
    float dist = distance(u_camPos, W), wt = (reg == 5.0 || reg == 10.0 || reg == 11.0 || reg == 14.0) ? 0.55 : (reg == 13.0 ? 0.3 : (reg == 9.0 ? 0.6 : 1.0));
    wt *= 1.0 - 0.45 * dot(Nw, u_key);
    W += Nw * min(u_hull * i_par.x * wt, 3.2 * wt * dist / u_px);
  }
  v_w = W; v_flags.w = (W.y - i_pos.y) / i_par.x; gl_Position = u_viewProj * vec4(W, 1.0);
}`;

// shared by the mesh (hair cap, bun) and the clumps
const HAIR_FN = `
float tri(float x){ return abs(fract(x) - 0.5) * 2.0; }
// black hair: two flat tones, a hard rim, and the highlight ring round the crown (a zig-zag band in head space that slides with the camera)
vec3 hairLit(vec3 h, vec3 N, vec3 Nt, vec3 Nm, float wet, vec3 V, vec3 hv, vec3 hl, vec3 lane, float onHead, out vec3 glow){   // N: shading normal (two tones); Nt: the clump's own surface; Nm: the whole mass
  vec3 base = celColor(${PART.HAIR});
  float ndl = dot(N, u_key) - 0.05, aw = fwidth(ndl) * 0.8 + 0.004, sh = smoothstep(-aw, aw, ndl);
  vec3 lightc = mix(mix(u_amb, vec3(0.60, 0.60, 0.80), u_sunAmt), vec3(1.9, 1.9, 2.7), u_sunAmt * sh);
  vec3 c0 = vec3(0.0, 0.066, -0.004), d = normalize(h - c0); float az = atan(d.x, d.z) / 6.2832, teeth = tri(az * 22.0 + 0.3), t2 = tri(az * 9.0 + 0.1);
  float ta = az * 15.0 + 0.3, id = floor(ta), sp = 1.0 - abs(fract(ta) - 0.5) * 2.0;                       // a few spikes of uneven height, up and down
  float y0 = 0.52 + 0.20 * hv.y + 0.03 * t2, dy = d.y - y0, ay = fwidth(d.y) + 0.003, hu = fract(sin(id * 12.99) * 43758.5), hd2 = fract(sin(id * 78.23) * 43758.5);
  float wu = 0.004 + 0.085 * sp * hu * hu, wl = 0.004 + 0.060 * sp * hd2;
  float band = smoothstep(-wl - ay, -wl + ay, dy) * (1.0 - smoothstep(wu - ay, wu + ay, dy)) * step(0.22, max(hu, hd2));
  vec2 hd = normalize(hv.xz + 0.45 * hl.xz + vec2(1e-4)), dd = normalize(d.xz + vec2(1e-4));
  float ring = band * smoothstep(0.45, 0.85, dot(dd, hd)) * onHead * smoothstep(0.165, 0.140, length(h - c0));
  float fres = 1.0 - abs(dot(Nt, V)), fm = 1.0 - abs(dot(Nm, V)), dirM = smoothstep(-0.2, 0.6, dot(Nm, u_rimDir)), ar = fwidth(fres) * 0.8 + 0.01;   // a thin edge, and only where the whole mass turns away
  vec3 rim = mix(u_rimCol, lane * dot(u_rimCol, vec3(0.45)), 0.35) * (0.26 * smoothstep(0.80 - ar, 0.80 + ar, fres) * max(smoothstep(0.50, 0.72, fm), wet) * (u_rimBoth + (1.0 - u_rimBoth) * dirM));
  glow = rim + ring * (vec3(0.060, 0.068, 0.135) * u_sunAmt + u_rimCol * 0.045 * (1.0 - u_sunAmt));
  return base * lightc;
}`;

export const meshFS = (PARTS) => `#version 300 es
precision highp float; precision highp int;
uniform sampler2D u_parts; uniform vec3 u_camPos, u_sun; uniform int u_points; uniform float u_psize, u_tiles, u_hull;
uniform vec3 u_amb, u_rimCol, u_rimDir, u_key; uniform float u_rimBoth, u_sunAmt, u_under, u_emis, u_trans, u_faceG;
in vec3 v_n; in vec3 v_w; in vec2 v_uv; in vec3 v_la; in vec4 v_flags;
flat in vec4 v_inst; flat in vec4 v_lane; flat in vec4 v_fa; flat in vec4 v_fb; flat in vec3 v_hv; flat in vec3 v_hl;
layout(location=0) out vec4 o_col; layout(location=1) out vec4 o_aux;
${PARTS}
${FACE_GLSL}
${HAIR_FN}
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
float hash(float n){ return fract(sin(n * 127.1 + 311.7) * 43758.5453); }
// designed shadow tints (what the dark tone of each material is by day)
vec3 shadeTint(int p){
  if (p == ${PART.SKIN}) return vec3(0.90, 0.69, 0.71);
  if (p == ${PART.JACKET} || p == ${PART.PATCH} || p == ${PART.SHOE} || p == ${PART.SOLE}) return vec3(0.66, 0.73, 0.95);
  if (p == ${PART.STRIPE} || p == ${PART.STRAP} || p == ${PART.PHONE} || p == ${PART.PENCIL}) return vec3(0.84, 0.56, 0.62);
  if (p == ${PART.TROUSER} || p == ${PART.POCKET}) return vec3(0.50, 0.52, 0.78);
  return vec3(0.62, 0.64, 0.84);
}
float tipA(float apx, float c, float wi, float wo, float hgt){ return hgt * pow(max(0.0, 1.0 - (apx < c ? (c - apx) / wi : (apx - c) / wo)), 1.5); }
// > 0 = hair (head joint frame). Keep in step with body.js hairD.
float hairD(vec3 h){
  float ax = abs(h.x), apx = abs(h.x - F_PARTX);
  float yh = 0.1195 - 0.038 * pow(apx / 0.072, 2.0) - tipA(apx, 0.046, 0.026, 0.012, 0.0030);
  float xs = 0.0840 - 0.0100 * smoothstep(0.030, 0.090, h.y);
  float zb = -0.045 + 0.050 * smoothstep(-0.075, 0.070, h.y);
  float a = h.y - yh, b = h.y > -0.06 ? ax - xs : -1.0, k = 0.012, hh = clamp(0.5 + 0.5 * (a - b) / k, 0.0, 1.0);
  return max(b + (a - b) * hh + k * hh * (1.0 - hh), zb - h.z);
}
float aa(float d, float px){ return smoothstep(-0.7 * px, 0.7 * px, d); }
// a stroke of thickness t at distance d from its centre line: below one pixel it holds ~1 px (up to 3x its size), then fades
float line(float d, float t, float px){ float te = max(t, min(0.9 * px, 3.0 * t)); return (1.0 - smoothstep(0.5 * te - 0.5 * px, 0.5 * te + 0.5 * px, d)) * min(1.0, 3.0 * t / (0.9 * px)); }
// upper lid: (y, dy/dx) in eye space at u = x / half-width. The outer end runs on as the lash flick.
vec2 lidUp(float u, float open, float joy){
  float uc = clamp(u, -1.0, 1.0), q = 1.0 - uc * uc, kc = mix(-0.0052, 0.0072, joy);
  float yC = kc * q + mix(-0.0014, -0.0040, joy), yU = 0.0170 * (1.0 - pow(abs(uc), 2.6)) * (1.0 - 0.10 * uc);
  float dC = kc * -2.0 * uc, dU = -0.0170 * 2.6 * pow(abs(uc), 1.6) * sign(uc) * (1.0 - 0.10 * uc) - 0.00170 * (1.0 - pow(abs(uc), 2.6));
  float y = mix(yC, yU, open) + F_TILT * u, dy = (mix(dC, dU, open) + F_TILT) / F_EW;
  if (u > 1.0) { float sl = mix(0.10, 0.02, open); y += (u - 1.0) * F_EW * sl; dy = sl; }
  if (u < -1.0) dy = F_TILT / F_EW;
  return vec2(y, dy);
}
// bold drawn folds: shadow shapes in loft space (t.x round the form, t.y along it), per region
float folds(float region, vec2 t, vec3 la){
  float fo = 0.0;
  if (region == 3.0 || region == 4.0) {            // trouser leg: la = (ring x, 0 hip .. 1 hem, ring z)
    float a = atan(la.z, la.x) / 6.2832 + 0.5, p = la.y;
    fo = step(tri(a * 5.0 + 0.10 * sin(p * 9.0 + region * 2.0) + 0.2), 0.40 * smoothstep(0.52, 1.0, p));        // tall wedges rising from the hem
    fo = max(fo, step(abs(p - 0.47 - 0.045 * sin(a * 12.566 + 1.0)), 0.010) * step(0.62, tri(a * 2.0 + 0.2)));     // creases at the knee
  } else if (region == 15.0) {                     // jacket: gathers above the elastic hem (t.y 0 = hem)
    fo = step(tri(t.x * 13.0), 0.50 * smoothstep(0.17, 0.03, t.y)) * step(0.012, t.y);
  } else if (region == 1.0 || region == 2.0) {     // sleeves: gathers at the cuff, a wedge inside the elbow
    fo = step(tri(t.x * 9.0), 0.55 * smoothstep(0.70, 0.85, t.y)) * step(t.y, 0.868);
    fo = max(fo, step(abs(t.y - 0.50 - 0.05 * tri(t.x * 2.0 + 0.25)), 0.011) * step(tri(t.x + 0.25), 0.42));
  }
  return fo;
}
void main(){
  int part; float region = floor(v_flags.x + 0.5); bool head = (u_points == 0 && region == 5.0);
  if (u_points == 1) { if (length(gl_PointCoord * 2.0 - 1.0) > 1.0) discard; part = int(v_flags.z + 0.5); }
  else { part = int(texelFetch(u_parts, ivec2(v_uv * u_psize), 0).r * 255.0 + 0.5); if (part == 255) discard; }
  float solid = v_inst.x, alpha = v_inst.w; vec3 lane = v_lane.rgb;
  if (alpha < 0.999 && ign(gl_FragCoord.xy) > alpha) discard;
  float hairM = 0.0, dH = -1.0;
  if (head) { dH = hairD(v_la); float aw = fwidth(dH) * 0.7 + 1e-5; hairM = smoothstep(-aw, aw, dH); part = dH > 0.0 ? ${PART.HAIR} : ${PART.SKIN}; }
  vec3 auxc = celColor(part) * 0.7 + 0.3 * vec3(hash(region + 0.37), hash(region + 1.7), hash(region + 4.1));
  if (u_hull > 0.0) {                          // the ink line: brown round skin, blue-black elsewhere
    vec3 ink = (part == ${PART.SKIN}) ? vec3(0.150, 0.042, 0.040) : vec3(0.010, 0.009, 0.026);
    o_col = vec4(ink * mix(u_amb, vec3(1.0), u_sunAmt) * solid, 1.0); o_aux = vec4(auxc, u_sunAmt * solid); return;
  }
  vec3 V = normalize(u_camPos - v_w), N = normalize(v_n); float inside = 0.0; if (dot(N, V) < 0.0 && !head) { N = -N; inside = 1.0; }
  float thin = v_flags.y * v_flags.y * (1.0 - inside);
  float facing = dot(N, V), fres = 1.0 - max(facing, 0.0);
  bool skin = head || part == 0; vec3 base = head ? celColor(0) : celColor(part); float forceSh = 0.0, catchA = 0.0, irisGlow = 0.0;
  if (head && hairM < 1.0 && v_la.z > 0.015) {
    vec3 h = v_la; float px = max(length(dFdx(h.xy)), length(dFdy(h.xy))) + 1e-6;         // metres of face per pixel
    float vis = 1.0 - smoothstep(0.0050, 0.0105, px), visD = 1.0 - smoothstep(0.0030, 0.0062, px);   // face LOD without a switch: first the details go (mouth, brows, blush), then the eyes; at crowd distance nothing
    float sx = h.x < 0.0 ? -1.0 : 1.0, ex = abs(h.x) - F_EX, u = ex / F_EW, ey = h.y - F_EY, open = v_fa.x, joy = v_fb.y, smile = v_fa.w;
    float uc = clamp(u, -1.0, 1.0), q = 1.0 - uc * uc;
    vec2 lu = lidUp(u, open, joy); float yC = mix(-0.0052, 0.0072, joy) * q + mix(-0.0014, -0.0040, joy) + F_TILT * u, squint = clamp((smile - 0.45) / 0.55, 0.0, 1.0);
    float lo = mix(yC, -0.0114 * (1.0 - 0.34 * squint) * q * (1.0 - 0.10 * uc) + F_TILT * u, open);
    float inEye = aa(min(lu.x - ey, ey - lo) - 0.0002, px) * step(abs(u), 1.0) * smoothstep(0.0, 0.15, open);
    // blush, nose, mouth
    vec2 bq = vec2((abs(h.x) - 0.047) / 0.017, (h.y + 0.006) / 0.0085);
    base = mix(base, S(0.965, 0.640, 0.640), (0.20 + 0.22 * joy) * exp(-dot(bq, bq)) * visD);
    vec3 lineC = S(0.52, 0.25, 0.25), darkC = S(0.105, 0.085, 0.115);
    vec2 nq = vec2((h.x - 0.0006) / 0.0048, (h.y - F_NY) / 0.0016); base = mix(base, S(0.84, 0.56, 0.54), aa((1.0 - length(nq)) * 0.0015, px) * 0.85 * vis * (1.0 - smoothstep(0.0012, 0.0030, px)));
    float mw = 0.0112 + 0.0038 * max(smile, 0.0), mx = h.x / mw, mq = max(0.0, 1.0 - mx * mx), ym = F_MY + smile * 0.0040 * (mx * mx - 0.45), ms = smile * 0.0080 * mx / mw;
    float mo = v_fb.x, inM = step(abs(mx), 1.0), lipV = 1.0 - smoothstep(0.0016, 0.0036, px);
    { float yl0 = ym - mo * 0.0090 * mq; vec2 lq = vec2(h.x / (mw * 0.70), (h.y - (yl0 - 0.0034)) / 0.0036), uq = vec2(h.x / (mw * 0.62), (h.y - (ym + 0.0016)) / 0.0022);
      base = mix(base, S(0.905, 0.560, 0.545), 0.62 * aa((1.0 - length(lq)) * 0.0036, px) * step(h.y, yl0) * vis * lipV);                     // lower lip
      base = mix(base, S(0.880, 0.540, 0.530), 0.40 * aa((1.0 - length(uq)) * 0.0022, px) * step(ym, h.y) * (1.0 - mo) * vis * lipV); }             // upper lip
    if (mo > 0.01) { float yl = ym - mo * 0.0090 * mq; base = mix(base, mix(S(0.86, 0.47, 0.47), S(0.50, 0.17, 0.20), smoothstep(yl + 0.002, yl + 0.006, h.y)), aa(min(ym - h.y, h.y - yl), px) * inM * visD); }
    base = mix(base, lineC, line(abs(h.y - ym) / sqrt(1.0 + ms * ms), 0.00110 * (0.30 + 0.70 * mq), px) * inM * visD);
    // eye: white (shaded under the lid), iris, pupil
    float sclA = inEye * vis * (1.0 - 0.75 * smoothstep(0.0022, 0.0045, px));
    base = mix(base, mix(S(0.970, 0.965, 0.985), S(0.70, 0.69, 0.84), smoothstep(0.0055, 0.0020, lu.x - ey)), sclA);
    float qx = h.x - sx * F_EX; vec2 ic = vec2(v_fb.z * 0.0068 - sx * 0.0006, 0.0020 + v_fb.w * 0.0036), e = vec2((qx - ic.x) / 0.0136, (ey - ic.y) / 0.0152); float r = length(e);
    float iris = aa((1.0 - r) * 0.0124, px) * inEye * vis, pup = aa((0.43 - length(e - vec2(0.0, 0.05))) * 0.0124, px);
    vec3 icol = mix(S(0.43, 0.235, 0.150), S(0.150, 0.082, 0.072), smoothstep(-0.85, 0.15, e.y));
    icol = mix(icol, S(0.105, 0.058, 0.062), smoothstep(0.76, 0.92, r)); icol = mix(icol, S(0.06, 0.04, 0.05), pup); icol *= 1.0 - 0.40 * smoothstep(0.20, 0.90, e.y);
    base = mix(base, icol, iris); irisGlow = iris * (1.0 - pup) * smoothstep(0.0, -0.75, e.y) * smoothstep(0.55, 1.0, r + 0.25);
    catchA = max(aa((1.0 - length((e - vec2(-0.36, 0.38)) / vec2(0.30, 0.25))) * 0.0030, px), 0.9 * aa((1.0 - length((e - vec2(0.38, -0.50)) / 0.14)) * 0.0015, px)) * iris * smoothstep(0.25, 0.6, open);
    // lower lid, lash, brow
    base = mix(base, lineC, line(abs(ey - lo), 0.0007, px) * smoothstep(0.05, 0.45, u) * step(u, 1.0) * open * 0.6 * visD);
    float tl = mix(0.0030, 0.0054, smoothstep(-0.9, 0.9, u)) * smoothstep(-1.10, -0.82, u) * smoothstep(1.32, 1.0, u) * (1.0 + 0.2 * (1.0 - open));
    base = mix(base, darkC, line(abs(ey - lu.x - 0.0004) / sqrt(1.0 + lu.y * lu.y), tl, px) * vis);
    float ub = u - 0.05, tb = max(u - 0.45, 0.0), yb = F_BY + 0.0017 * u + 0.0019 * (1.0 - ub * ub) - 0.0070 * tb * tb + v_fa.y * 0.0042 * u + v_fa.z * 0.0030, sb = (0.0017 - 0.0038 * ub - 0.0140 * tb + v_fa.y * 0.0042) / F_EW;
    base = mix(base, darkC, 0.95 * line(abs(ey - yb) / sqrt(1.0 + sb * sb), mix(0.0047, 0.0017, smoothstep(-0.6, 1.05, u)), px) * smoothstep(-1.00, -0.84, u) * smoothstep(1.12, 0.92, u) * visD);
    forceSh = smoothstep(-0.0078, -0.0064, dH) * vis;                                        // the shadow the hair lays on the forehead
  }
  if (u_points == 0 && (region == 10.0 || region == 11.0)) {       // the mitten reads as fingers: three drawn lines from the knuckles to the tips
    float fz = abs(fract(v_la.z / 0.021 + 0.5) - 0.5) * 0.021;
    base = mix(base, S(0.60, 0.31, 0.29), 0.9 * line(fz, 0.0011, fwidth(v_la.z) + 1e-6) * smoothstep(0.084, 0.096, v_la.y) * step(abs(v_la.z), 0.031) * (1.0 - smoothstep(0.150, 0.162, v_la.y)));
  }
  // ONE shading model: two flat tones with a hard edge; only the world's light changes (night -> sunrise -> day).
  vec3 diff, glow;
  if (!head && (part == ${PART.HAIR} || part == ${PART.BUN})) diff = hairLit(v_la, N, N, N, 0.0, V, v_hv, v_hl, lane, 0.0, glow);
  else {
    float fold = (u_points == 0) ? folds(region, fract(v_uv * u_tiles), v_la) : 0.0;
    float ndl = dot(N, u_key) + (skin ? 0.30 : 0.08), aw = fwidth(ndl) * 0.8 + 0.004;
    float sh = smoothstep(-aw, aw, ndl) * (1.0 - fold) * (1.0 - forceSh); if (region == 14.0) sh = 0.0;      // the neck sits in the jaw's shadow
    vec3 nightAmb = u_amb * (skin ? 1.6 : 1.0) * (1.0 - 0.30 * fold);       // skin holds a little more of the night's light: a face in shadow tones, not a hole
    vec3 lightc = mix(mix(nightAmb, shadeTint(skin ? ${PART.SKIN} : part), u_sunAmt), vec3(1.0), u_sunAmt * sh);
    diff = base * lightc * (1.0 - 0.55 * inside * step(2.5, region) * step(region, 4.5));
    float dirM = smoothstep(-0.2, 0.6, dot(N, u_rimDir)), thr = head ? mix(0.92, 0.84, dirM) : (skin ? mix(0.86, 0.72, dirM) : mix(0.80, 0.60, dirM)), ar = fwidth(fres) * 0.8 + 0.01;
    glow = mix(u_rimCol, lane * dot(u_rimCol, vec3(0.45)), 0.35) * ((head ? 0.30 : 0.50) * smoothstep(thr - ar, thr + ar, fres) * (u_rimBoth + (1.0 - u_rimBoth) * dirM));
    if (hairM > 0.0) { vec3 g2, hc = hairLit(v_la, N, N, N, 0.0, V, v_hv, v_hl, lane, 1.0, g2); diff = mix(diff, hc, hairM); glow = mix(glow, g2, hairM); }
  }
  // underlight from her road, in her lane colour: shoes and hems, gone by the hip
  float hf = smoothstep(1.05, 0.0, v_flags.w);
  vec3 under = lane * (u_under * 1.3 * hf * hf * (0.40 + 0.60 * clamp(0.3 - N.y * 1.4, 0.0, 1.0))) * (base * 0.55 + 0.20);
  // accents are light sources at night and plain colour by day
  vec3 em = vec3(0.0);
  if (emissive(part)) em = ORANGE * 1.15; else if (part == ${PART.DOT}) em = vec3(0.32, 0.58, 1.0) * 0.95; else if (part == ${PART.TEXT}) em = vec3(1.0, 0.95, 0.86) * 1.7; else if (part == ${PART.PATCH}) em = vec3(0.55, 0.54, 0.52);
  float back = smoothstep(0.1, 0.9, dot(-V, u_sun));
  vec3 tr = vec3(1.0, 0.42, 0.10) * (back * thin * thin * 0.09 * u_trans);
  vec3 col = (diff + under + tr) * solid + glow * (0.45 + 0.55 * solid) + em * (u_emis * v_lane.a);
  // the eyes keep their light: white catchlights by day; at night the horizon in them, and her road's colour low in the iris
  vec3 catchC = mix((u_rimCol * 0.22 + lane * 0.10 + 0.05) * u_faceG, vec3(1.0), u_sunAmt);
  col = mix(col, catchC, catchA * mix(u_faceG, 1.0, u_sunAmt) * solid) + lane * (0.07 * u_faceG * (1.0 - u_sunAmt) * irisGlow * solid);
  o_col = vec4(col, 1.0); o_aux = vec4(auxc, u_sunAmt * solid);
}`;

// ---------------------------------------------------------------------------------------------------------------------
export const clumpVS = (COMMON, PARTS) => COMMON + PARTS + `
layout(location=0) in vec4 a_c0; // guide L, guide R, mix, type (0 back, 1 bun wisps, 2 side locks)
layout(location=1) in vec4 a_c1; // s along, angle round, seed, fan
layout(location=2) in vec4 a_c2; // half width, half thickness, length, -
out vec3 v_n; out vec3 v_nm; out vec3 v_nt; out vec3 v_w; out vec3 v_h; out vec2 v_s;
flat out vec4 v_inst; flat out vec4 v_lane; flat out vec3 v_hv; flat out vec3 v_hl;
void cull(){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); }
vec3 unyaw(vec3 p){ float c = cos(i_pos.w), s = sin(i_pos.w); return vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z); }
vec3 gnode(TI ti, int g, int n){ return simNode(ti, g * NODES + clamp(n, 0, NODES - 1)); }
void main(){
  int ty = int(a_c0.w + 0.5); bool bun = i_misc.y > 0.5;
  v_inst = vec4(i_par.w, 0.0, i_par.z, i_fx.x); v_lane = i_col;
  if (i_fx.x <= 0.0 || (ty == 0 && (bun || i_fx.w > 0.5)) || (ty == 1 && !bun)) { cull(); return; }
  TI ti = trackInfo(i_misc.x, i_par.y); float s = a_c1.x, seed = a_c1.z;
  float sl = s * a_c2.z * (ty == 0 ? 1.0 - 0.08 * hash(i_fx.y * 3.3 + 1.0) : (bun && ty == 2 ? 0.62 : 1.0));
  float sn = sl * float(NODES - 1); int i = int(floor(sn)); float fr = sn - float(i); if (i >= NODES - 1) { i = NODES - 2; fr = 1.0; }
  int gL = int(a_c0.x + 0.5), gR = int(a_c0.y + 0.5);
  vec3 l0 = gnode(ti, gL, i - 1), l1 = gnode(ti, gL, i), l2 = gnode(ti, gL, i + 1), l3 = gnode(ti, gL, i + 2);
  vec3 r0 = gnode(ti, gR, i - 1), r1 = gnode(ti, gR, i), r2 = gnode(ti, gR, i + 1), r3 = gnode(ti, gR, i + 2);
  vec3 CL = cr(l0, l1, l2, l3, fr), CR = cr(r0, r1, r2, r3, fr), C = mix(CL, CR, a_c0.z);
  vec3 T = mix(crT(l0, l1, l2, l3, fr), crT(r0, r1, r2, r3, fr), a_c0.z); T = dot(T, T) > 1e-10 ? normalize(T) : vec3(0.0, -1.0, 0.0);
  vec3 A = CR - CL; A -= T * dot(A, T); float al = length(A); A = al > 1e-4 ? A / al : normalize(cross(T, vec3(0.31, 0.12, 0.94)));
  vec3 Nn = cross(A, T);
  // the back mass parts down the middle, so the disc and RARE EARTH stay readable between two curtains (closes when it floats)
  vec3 cx = qrot(jquat(ti, ${J.chest}), vec3(1.0, 0.0, 0.0)); float fan = a_c1.w;
  if (ty == 0) { float sg = fan >= 0.0 ? 1.0 : -1.0; C += cx * ((sg * (0.100 - 0.050 * abs(fan)) * smoothstep(0.37, 0.58, sl) - (fan - sg * 0.55) * 0.030 * smoothstep(0.50, 1.0, sl)) * (1.0 - simNode(ti, LAG).y)); }   // straight down behind the shoulders first; the parting opens only below the shoulder line, behind the jacket   // ... and each curtain gathers toward its tips
  float prof = pow(smoothstep(0.0, 0.05, s), 0.6) * (1.0 - pow(smoothstep(0.48, 1.0, s), 1.5));
  float root = smoothstep(ty == 0 ? 0.16 : 0.10, ty == 0 ? 0.34 : 0.30, sl);                 // over the scalp the clumps lie flat under the cap; they take their body where the hair leaves the head
  float w = a_c2.x * prof * (0.86 + 0.28 * hash(seed * 17.0)) * (ty == 0 ? (0.55 + 0.45 * root) * (1.0 + 1.6 * simNode(ti, LAG).y) : 0.25 + 0.75 * root), th = a_c2.y * (0.35 + 0.65 * prof) * (0.20 + 0.80 * root), cs = cos(a_c1.y), sn2 = sin(a_c1.y);
  if (s > 0.999) th = 0.0;
  vec3 P = C + jpos(ti, 0) + A * (w * cs) + Nn * (th * sn2), N = normalize(A * (cs * th) + Nn * (sn2 * w) + T * 1e-4);
  vec4 hq = jquat(ti, ${J.head}), hc = vec4(-hq.xyz, hq.w); vec3 hj = jpos(ti, ${J.head});
  v_h = qrot(hc, P - hj); vec3 hp = place(hj + qrot(hq, vec3(0.0, 0.07, 0.0)));
  v_hv = qrot(hc, unyaw(normalize(u_camPos - hp))); v_hl = qrot(hc, unyaw(u_key));
  vec3 hn = qrot(hq, normalize(v_h - vec3(0.0, 0.066, -0.004))), ax = mix(jpos(ti, ${J.chest}), hj + qrot(hq, vec3(0.0, 0.066, 0.0)), clamp(1.0 - sl * 1.6, 0.0, 1.0));
  v_nm = yaw(normalize((P - ax) * vec3(1.0, 0.2, 1.0) + vec3(0.0, 0.1 * (1.0 - sl), 0.0)));                  // the mass: round the head, then round the spine
  vec3 W = place(P); v_w = W; v_n = yaw(normalize(mix(hn, N, smoothstep(0.22, 0.50, sl)))); v_nt = yaw(N); v_s = vec2(s, ty == 0 ? simNode(ti, LAG).y : 0.0); gl_Position = u_viewProj * vec4(W, 1.0);
}`;
export const clumpFS = (PARTS) => `#version 300 es
precision highp float; precision highp int;
uniform vec3 u_camPos, u_sun; uniform vec3 u_amb, u_rimCol, u_rimDir, u_key; uniform float u_rimBoth, u_sunAmt, u_trans;
in vec3 v_n; in vec3 v_nm; in vec3 v_nt; in vec3 v_w; in vec3 v_h; in vec2 v_s;
flat in vec4 v_inst; flat in vec4 v_lane; flat in vec3 v_hv; flat in vec3 v_hl;
layout(location=0) out vec4 o_col; layout(location=1) out vec4 o_aux;
${PARTS}
${HAIR_FN}
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main(){
  float solid = v_inst.x, alpha = v_inst.w; if (alpha < 0.999 && ign(gl_FragCoord.xy) > alpha) discard;
  vec3 V = normalize(u_camPos - v_w), N = normalize(v_n); if (dot(N, V) < 0.0) N = -N;
  vec3 glow, c = hairLit(v_h, N, normalize(v_nt), normalize(v_nm), v_s.y, V, v_hv, v_hl, v_lane.rgb, 1.0, glow);
  float back = smoothstep(0.1, 0.9, dot(-V, u_sun));
  vec3 tr = vec3(1.0, 0.40, 0.09) * (back * 0.05 * smoothstep(0.75, 1.0, v_s.x) * u_trans);        // the sun through the tips
  o_col = vec4((c + tr) * solid + glow * (0.45 + 0.55 * solid), 1.0); o_aux = vec4(celColor(${PART.HAIR}), u_sunAmt * solid);
}`;
