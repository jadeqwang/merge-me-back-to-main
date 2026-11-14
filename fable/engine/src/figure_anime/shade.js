// ANIME look-dev: the shaders that differ from ../figure/figure.js. See fable/notes/anime_lookdev.md.
// POLISH pass (fable/notes/polish.md): the hands (handPose), the larger eyes and the designed daylight face (faceD), ink weight, sleeve folds that follow the elbow.
//   mesh   two-tone cel with a hard, anti-aliased terminator and per-material shadow tints, a hard rim band, drawn folds (shadow shapes
//          in loft space), the FACE (analytic shapes in the head joint's frame: lids, lash, iris, pupil, catchlights, brow, nose, mouth,
//          blush; every edge filtered by its own pixel footprint, so it thins and fades with distance instead of popping),
//          the hairline (same maths as body.js hairD), and the inverted-hull outline pass (u_hull > 0).
//   clump  the hair: flattened tapered tubes on the guide sim, flat two-tone with an "angel ring" in head space.
import { PART, HAIR, FACE, HAND } from './body.js';
import { J } from './skeleton.js';

const f = (x) => { const s = String(x); return /[.e]/.test(s) ? s : s + '.0'; };
const FACE_GLSL = Object.entries(FACE).map(([k, v]) => `const float F_${k} = ${f(v)};`).join(' ');

// the hand (polish pass): every digit is posed in the hand joint's frame from the table of authored shapes in body.js HAND (the canonical hand frame is
// (side * x, y, z): x out of the palm, y wrist -> fingertips, z toward the thumb). Joints bend over a short soft band; the far mitten (digit 5) takes the mean
// of the four fingers. The per-hand code in i_trail.w: shape value 0..62 (-1 splayed .. 0 relaxed .. +1 fist) + 64 * special (1 pencil grip, 2 flat blade)
// + 256 * its amount (0..15). Lives in the shared SKIN chunk. Keep in step with body.js handFK.
const DEGR = Math.PI / 180, v3 = (a) => `vec3(${a.map(f).join(', ')})`, POSES = ['splay', 'relax', 'fist', 'grip', 'blade'];
const HROWS = POSES.flatMap((n) => { const r = HAND.pose[n], m = [0, 1, 2, 3].map((i) => (i === 0 ? 0 : (r[0][i] + r[1][i] + r[2][i] + r[3][i]) / 4)); return [...r.map((x) => x.slice(0, 4)), m]; });
// The tables are UNIFORMS (figure.js sets them from HAND_U), not const arrays: a const array indexed by a variable is copied onto the stack by some drivers on
// every call of the function that holds it, and this chunk is compiled into the mesh, decal-point and fibre vertex shaders of 1,024 bodies.
//   u_hgeo[k], [6 + k], [12 + k], [18 + k] = base pivot (w: first joint, metres along), rest direction (w: second joint), first axis, joint axis
//   u_hpose[pose * 6 + k] = spread, a1, a2, a3 (radians; k = 5: the mean of the fingers); u_htw[pose] = the thumb's turn about its own length
export const HAND_U = {
  geo: new Float32Array([...HAND.dig.flatMap((D) => [...D.B, D.L[0]]), ...HAND.dig.flatMap((D) => [...D.d, D.L[0] + D.L[1]]), ...HAND.dig.flatMap((D) => [...D.f1, 0]), ...HAND.dig.flatMap((D) => [...D.f2, 0])]),
  pose: new Float32Array(HROWS.flatMap((r) => r.map((x) => x * DEGR))), tw: new Float32Array(POSES.map((n) => (HAND.pose[n][4][4] || 0) * DEGR)),
};
export const HAND_GLSL = `
${FACE_GLSL}
uniform vec4 u_hgeo[24]; uniform vec4 u_hpose[30]; uniform float u_htw[5];
void hrot(inout vec3 p, inout vec3 n, vec3 c, vec3 ax, float a){ float cs = cos(a), sn = sin(a); vec3 q = p - c; p = c + q * cs + cross(ax, q) * sn + ax * (dot(ax, q) * (1.0 - cs)); n = n * cs + cross(ax, n) * sn + ax * (dot(ax, n) * (1.0 - cs)); }
float handS(){ int k = int(a_lb.y + 0.5); if (k > 5) return 0.0; return dot(vec3(a_la.x * a_lb.x, a_la.y, a_la.z) - u_hgeo[k].xyz, u_hgeo[6 + k].xyz); }      // metres along the digit from its knuckle (rest pose)
// fpx: the width of a finger in pixels. Under about 6 px the engine's outline (1.4 px each side of every edge) eats separate fingers and they turn black, so
// as the hand gets small the fingers close ranks into one shape and the thumb tucks in beside the palm: continuous, nothing pops.
float handPx(vec3 wrist){ return 0.017 * i_par.x * u_px / max(distance(u_camPos, wrist), 1e-3); }
void handPose(inout vec3 p, inout vec3 n, float fpx){
  int k = int(a_lb.y + 0.5); if (k > 5) return;                                              // 6 = the palm: rigid
  float ck = 1.0 - smoothstep(4.2, 6.2, fpx);
  float sd = a_lb.x, pk = i_trail.w, code = sd > 0.0 ? mod(pk, 4096.0) : floor(pk / 4096.0);
  float hv = mod(code, 64.0) / 31.0 - 1.0, shp = mod(floor(code / 64.0), 4.0), amt = floor(code / 256.0) / 15.0, w = min(abs(hv), 1.0);
  vec4 a = mix(u_hpose[6 + k], u_hpose[(hv < 0.0 ? 0 : 12) + k], w); float tw = mix(u_htw[1], u_htw[hv < 0.0 ? 0 : 2], w);
  if (shp > 0.5) { int sp = shp < 1.5 ? 3 : 4; a = mix(a, u_hpose[sp * 6 + k], amt); tw = mix(tw, u_htw[sp], amt); }
  vec4 gB = u_hgeo[k], gD = u_hgeo[6 + k]; vec3 c = vec3(p.x * sd, p.y, p.z), m = vec3(n.x * sd, n.y, n.z), B = gB.xyz, d = gD.xyz, F1 = u_hgeo[12 + k].xyz, F2 = u_hgeo[18 + k].xyz; float s = dot(c - B, d);
  if (k < 4) { a.x = mix(a.x, -atan(d.z, d.y), ck); c += ((c - B) - d * s) * (0.14 * ck); } else if (k == 4) { a = mix(a, u_hpose[28], ck); tw = mix(tw, u_htw[4], ck); }
  if (k == 5) c.z *= 1.0 + 0.30 * max(-hv, 0.0) * (1.0 - min(shp, 1.0) * amt) * (1.0 - ck) * smoothstep(0.0, 0.05, s);      // the mitten: as wide as the closed fingers (it would widen as they fan, but at its size they never do)
  hrot(c, m, B + d * gD.w, F2, a.w * smoothstep(-0.0060, 0.0060, s - gD.w));
  hrot(c, m, B + d * gB.w, F2, a.z * smoothstep(-0.0065, 0.0065, s - gB.w));
  float w0 = smoothstep(-0.0085, 0.0055, s);
  if (k == 4) hrot(c, m, B, d, tw * w0);
  hrot(c, m, B, F1, a.y * w0); hrot(c, m, B, vec3(1.0, 0.0, 0.0), a.x * w0);
  if (k == 4 && ck > 0.0) { c.z = mix(c.z, min(c.z, 0.030), ck); c.x = mix(c.x, clamp(c.x, -0.010, 0.010), ck); }      // ... and at that size the thumb sinks into the palm's own outline (a 4 px thumb beside the hand was a black nub)
  p = vec3(c.x * sd, c.y, c.z); n = vec3(m.x * sd, m.y, m.z);
}`;

// ---------------------------------------------------------------------------------------------------------------------
export const meshVS = (COMMON, SKIN) => COMMON + SKIN + `
uniform int u_points; uniform float u_hull, u_tiles;
out vec3 v_n; out vec3 v_w; out vec2 v_uv; out vec3 v_la; out vec4 v_flags;   // region, thin (trouser legs), point part (-1 = mesh), height above her feet (m)
// Polish pass: NO new varyings (seven more floats cost 6 % of the frame with 1,024 bodies: every small triangle and decal point sets them up). The mesh's spare
// slots of v_flags carry them instead: head: y = the loft's own smooth normal's y (under-jaw shadow) | hands: y = digit id + 0.2 + 4 * metres along the digit,
// z = a finger's width in pixels | sleeves: y = where round the sleeve the inside of the elbow is (turns), z = floor(bend * 255) + 0.01 + 0.97 * how much of the folds is drawn.
flat out vec4 v_inst; flat out vec4 v_lane; flat out vec4 v_fa; flat out vec4 v_fb; flat out vec3 v_hv; flat out vec3 v_hl; flat out float v_fpx;   // v_fpx: metres of face per pixel at the head (one number for the whole face: both eyes leave together)
void cull(){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); gl_PointSize = 0.0; }
vec3 unyaw(vec3 p){ float c = cos(i_pos.w), s = sin(i_pos.w); return vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z); }
// expressions. a: eye open, brow tilt (+ = inner ends down), brow lift, smile ; b: mouth open, joy (closed eyes arc upward)
void expr(float id, out vec4 a, out vec2 b){
  if (id < 0.5) { a = vec4(1.0, 0.0, 0.0, 0.35); b = vec2(0.0); }                    // neutral: calm, the hint of a smile
  else if (id < 1.5) { a = vec4(0.80, 1.5, -1.2, -0.25); b = vec2(0.0); }            // determined
  else if (id < 2.5) { a = vec4(0.96, -0.06, 0.75, 1.0); b = vec2(0.30, 0.0); }       // joy: eyes open (the lower lids rise with the smile), a relaxed smile, the lips just parted (polish: it was an open D that read as a dot)
  else if (id < 3.5) { a = vec4(0.94, -0.22, 0.35, 0.60); b = vec2(0.0); }           // looking back: soft
  else if (id < 4.5) { a = vec4(0.0, -0.2, 0.0, 0.35); b = vec2(0.0); }              // calm: eyes closed
  else { a = vec4(0.0, -0.3, 0.8, 1.0); b = vec2(1.0, 1.0); }                        // laugh: eyes closed in upward arcs, open smile
}
void main(){
  v_inst = vec4(i_par.w, i_misc.y > 0.5 ? 1.0 : 0.0, i_par.z, i_fx.x); v_lane = i_col; v_fa = vec4(0.0); v_fb = vec4(0.0); v_hv = vec3(0.0, 0.0, 1.0); v_hl = vec3(0.0, 1.0, 0.0); v_fpx = 0.0; vec3 arm = vec3(0.0, 0.25, 0.0);
  if (i_fx.x <= 0.0) { cull(); return; }
  if (u_points == 0 && a_uv.z > 1.5) {       // variant geometry: 2 bun + one pencil | 3 the second pencil in the bun | 4 that pencil in her right hand
    float vz = a_uv.z, m = i_misc.y; bool show = m > 0.5 && (vz < 2.5 || (vz < 3.5 && m < 1.5) || (vz > 3.5 && m > 1.5 && m < 2.5));
    if (!show) { cull(); return; }
  }
  if (u_hull > 0.0 && (u_points == 1 || a_n.w < -0.5)) { cull(); return; }
  TI ti = trackInfo(i_misc.x, i_par.y); vec3 P, N, B;
  if (u_hull > 0.0 && u_hull * i_par.x * u_px / distance(u_camPos, place(jpos(ti, 0))) < 0.30) { cull(); return; } skin(ti, a_n.xyz, vec3(1.0, 0.0, 0.0), P, N, B);
  vec3 W = place(P), Nw = normalize(yaw(N)); float reg = floor(a_uv.w + 0.5);
  v_n = Nw; v_la = a_la.xyz; v_uv = a_uv.xy; vec3 dig = vec3(-1.0, 0.0, 0.0); if (u_points == 0 && a_lb.w < -0.5) dig = vec3(a_lb.y, handS(), handPx(W));      // (a real branch: a select would run this for every vertex and every decal point of 1,024 bodies)
  if (u_points == 0 && (reg == 5.0 || reg == 12.0)) {     // the head: clean spherical normals, and the view / key directions in head space
    vec4 hq = jquat(ti, ${J.head}), hc = vec4(-hq.xyz, hq.w); vec3 hp = place(jpos(ti, ${J.head}) + qrot(hq, vec3(0.0, 0.07, 0.0)));
    v_hv = qrot(hc, unyaw(normalize(u_camPos - hp))); v_hl = qrot(hc, unyaw(u_key)); v_fpx = distance(u_camPos, hp) / (u_px * i_par.x);
    if (reg == 5.0) v_n = yaw(qrot(hq, normalize(vec3(a_la.x / 0.090, (a_la.y - 0.060) / 0.190, (a_la.z + 0.002) / 0.094))));
    float eid = floor(i_face.x + 1e-4), amt = clamp(fract(i_face.x + 1e-4) / 0.99, 0.0, 1.0);
    vec4 ea, na; vec2 eb, nb; expr(eid, ea, eb); expr(0.0, na, nb); ea = mix(na, ea, amt); eb = mix(nb, eb, amt);
    float blink = i_face.y;
    if (blink < 0.0) { float per = 3.3 + 2.4 * hash(i_fx.y * 5.1 + 0.3), x = fract(u_time / per + hash(i_fx.y * 9.7 + 0.7)) * per / 0.17; blink = x < 1.0 ? pow(sin(3.14159 * x), 0.7) : 0.0; }
    ea.x *= 1.0 - blink; v_fa = ea; v_fb = vec4(eb, i_face.zw);
  }
  if (u_points == 0 && (reg == 14.0 || reg == 0.0)) { vec4 hq = jquat(ti, ${J.head}); v_la = qrot(vec4(-hq.xyz, hq.w), P - jpos(ti, ${J.head})); }      // neck and torso: where they are in the HEAD's frame (the jaw's shadow falls on them)
  float ppmS = 0.0; if (u_points == 0 && u_hull <= 0.0 && (reg == 1.0 || reg == 2.0)) ppmS = i_par.x * u_px / max(distance(u_camPos, W), 1e-3);
  if (ppmS > 140.0) {      // sleeves: the drawn folds follow the elbow (polish). Only for a body taller than about 240 px (they fade in up to 390 px): further away they are a pixel wide, and the elbow's two joints are not looked up (that lookup was 7 % of the frame at 142 with 1,024 bodies)
    int uj = reg == 1.0 ? ${J.upArmL} : ${J.upArmR}; vec4 qu = jquat(ti, uj); vec3 fl = qrot(vec4(-qu.xyz, qu.w), qrot(jquat(ti, uj + 1), vec3(0.0, 1.0, 0.0)));
    float hl2 = length(fl.xz); vec2 dv = normalize(mix(vec2(0.0, 1.0), fl.xz / max(hl2, 1e-4), smoothstep(0.04, 0.30, hl2)) + vec2(1e-5, 0.0));
    arm = vec3(clamp((1.0 - fl.y) / 1.3, 0.0, 1.0), atan(dv.y, dv.x) / 6.2832, smoothstep(140.0, 230.0, ppmS));
  }
  v_flags = vec4(a_uv.w, a_bn.z > -0.5 ? smoothstep(0.5, 1.0, a_la.y) : 0.0, -1.0, 0.0);
  if (u_points == 0) {
    if (reg == 5.0) v_flags.y = a_n.y;
    else if (reg == 10.0 || reg == 11.0) { v_flags.y = dig.x + 0.2 + 4.0 * clamp(dig.y, -0.04, 0.15); v_flags.z = dig.z; }
    else if (reg == 1.0 || reg == 2.0) { v_flags.y = arm.y; v_flags.z = floor(arm.x * 255.0) + 0.01 + 0.97 * arm.z; }
  }
  if (u_points == 1) {
    vec3 V = normalize(u_camPos - W); W += V * 0.005; v_flags.z = a_la.w;
    gl_PointSize = clamp(2.0 * a_uv.x * i_par.x * u_px / distance(u_camPos, W) * 1.15, 1.5, u_maxPS);
  }
  if (u_hull > 0.0) {                        // inverted hull: the ink line. Heavier on big forms and on the shadow side, never more than ~3 px
    float dist = distance(u_camPos, W), wt = (reg == 10.0 || reg == 11.0) ? (a_lb.y < 5.5 ? (a_lb.y < 3.5 ? 0.30 : 0.42) * smoothstep(4.2, 6.2, dig.z) * (a_lb.y > 3.5 ? smoothstep(0.022, 0.052, dig.y) : smoothstep(0.008, 0.032, dig.y)) : 0.42) :      /* (no hull where a digit is rooted in the palm) */ (reg == 5.0 || reg == 14.0) ? 0.55 : (reg == 13.0 ? 0.3 : (reg == 9.0 ? 0.6 : 1.0));
    wt *= 1.0 - ((reg == 10.0 || reg == 11.0) ? 0.25 : 0.66) * dot(Nw, normalize(u_key + vec3(0.0, 0.35, 0.0))); if (reg == 5.0)      /* polish: the line has weight: heavy under a form and on its shadow side, thin toward the sun (fingers stay fine) */ wt *= smoothstep(-0.0650, -0.0630, a_la.y);
    if (reg == 1.0 || reg == 2.0) wt *= 1.0 - smoothstep(0.968, 0.994, fract(a_uv.y * u_tiles));      // no hull at the cuff's open end: seen from the hand's side its inner wall was a black notch on the wrist      // (no hull at the closed tip of the chin)
    W += Nw * min(u_hull * i_par.x * wt, 3.2 * wt * dist / u_px);
  }
  v_w = W; v_flags.w = (W.y - i_pos.y) / i_par.x; gl_Position = u_viewProj * vec4(W, 1.0);
}`;

// shared by the mesh (hair cap, bun) and the clumps
const HAIR_FN = `
float tri(float x){ return abs(fract(x) - 0.5) * 2.0; }
float hline(float d, float t, float px){ float te = max(t, min(0.9 * px, 3.0 * t)); return (1.0 - smoothstep(0.5 * te - 0.5 * px, 0.5 * te + 0.5 * px, d)) * min(1.0, 3.0 * t / (0.9 * px)); }
// strand lines (r3): a few thin lighter lines along the flow of the hair, each with its own length. On the head they are meridians: from the crown when the hair
// hangs, from the bun when it is tied up (the hair is pulled toward it). Round the bun itself they are the winds of the coil. kind: 1 the cap, 2 the bun.
float strandLines(vec3 h, float kind, float bun, float px){
  if (kind > 1.5) {
    vec3 q = h - vec3(0.0, 0.211, -0.060); float a = atan(q.x, q.z) / 6.2832, f = q.y / 0.019 + a + 0.25 * sin(a * 12.566 + 1.0), id = floor(f), hs = fract(sin(id * 12.99 + 3.1) * 43758.5);
    return hline(abs(fract(f) - 0.5) * 0.019, 0.0015, px) * smoothstep(0.05, 0.30, tri(a * (1.0 + floor(hs * 1.99)) + hs)) * smoothstep(0.014, 0.028, length(q.xz));
  }
  vec3 c0 = vec3(0.0, 0.066, -0.004), d = normalize(h - c0), pole = bun > 0.5 ? vec3(0.0, 0.8805, -0.4741) : vec3(0.0, 1.0, 0.0), e2 = normalize(cross(pole, vec3(1.0, 0.0, 0.0)));
  float th = acos(clamp(dot(d, pole), -1.0, 1.0)), n = 30.0, a = atan(d.x, dot(d, e2)) / 6.2832 * n + 0.22 * sin(th * 6.0 + 1.3), id = floor(a);
  float hs = fract(sin(id * 12.99 + 3.1) * 43758.5), h2 = fract(sin(id * 78.23 + 1.7) * 43758.5), t0 = mix(0.42, 1.25, h2), t1 = t0 + mix(0.30, 0.85, hs);
  float dm = abs(fract(a) - 0.5) * sin(th) * 6.2832 / n * length(h - c0);
  return hline(dm, 0.0019, px) * smoothstep(t0, t0 + 0.14, th) * (1.0 - smoothstep(t1 - 0.22, t1, th)) * step(0.45, hs) * smoothstep(0.055, 0.015, h.z);      // not over the forehead: the parting and the hairline are drawn there
}
// black hair: two flat tones, a hard rim, and the highlight ring round the crown (a zig-zag band in head space that slides with the camera)
// kind: 0 the clumps, 1 the cap (head mesh), 2 the bun. r3: the cap and the bun read as FORM from behind and at night: a wider rim band, a second hard tone on the
// side of the horizon's light, strand lines, a stronger ring at night; and everything but the rim goes when she is a silhouette against the sun (u_sil).
vec3 hairLit(vec3 h, vec3 N, vec3 Nt, vec3 Nm, float wet, vec3 V, vec3 hv, vec3 hl, vec3 lane, float onHead, float kind, out vec3 glow){   // N: shading normal (two tones); Nt: the clump's own surface; Nm: the whole mass
  vec3 base = celColor(${PART.HAIR});
  float capK = step(0.5, kind), nightK = (1.0 - u_sunAmt) * min(1.0, 2.0 * u_rimBoth), silh = u_sil * smoothstep(0.25, 0.80, dot(-V, normalize(u_sun)));
  float ndl = dot(N, u_key) - 0.05, aw = fwidth(ndl) * 0.8 + 0.004, sh = smoothstep(-aw, aw, ndl);
  vec3 lightc = mix(mix(u_amb, vec3(0.60, 0.60, 0.80), u_sunAmt), vec3(1.9, 1.9, 2.7) * u_keyCol, u_sunAmt * sh);
  vec3 c0 = vec3(0.0, 0.066, -0.004), d = normalize(h - c0); float az = atan(d.x, d.z) / 6.2832, teeth = tri(az * 22.0 + 0.3), t2 = tri(az * 9.0 + 0.1);
  float ta = az * 15.0 + 0.3, id = floor(ta), sp = 1.0 - abs(fract(ta) - 0.5) * 2.0;                       // a few spikes of uneven height, up and down
  float apx = abs(h.x - F_PARTX), y0 = 0.52 + 0.20 * hv.y + 0.03 * t2 + 0.11 * exp(-apx * apx / (0.026 * 0.026)) * step(-0.02, h.z), dy = d.y - y0, ay = fwidth(d.y) + 0.003, hu = fract(sin(id * 12.99) * 43758.5), hd2 = fract(sin(id * 78.23) * 43758.5);
  float wu = 0.004 + 0.085 * sp * hu * hu, wl = 0.004 + 0.060 * sp * hd2;
  float band = smoothstep(-wl - ay, -wl + ay, dy) * (1.0 - smoothstep(wu - ay, wu + ay, dy)) * step(0.22, max(hu, hd2));
  vec2 hd = normalize(hv.xz + 0.45 * hl.xz + vec2(1e-4)), dd = normalize(d.xz + vec2(1e-4));
  float ring = band * smoothstep(0.45, 0.85, dot(dd, hd)) * onHead * smoothstep(0.165, 0.140, length(h - c0)) * (h.z > -0.02 ? smoothstep(0.0025, 0.0090, apx) : 1.0) * (1.0 - silh);
  float fres = 1.0 - abs(dot(Nt, V)), fm = 1.0 - abs(dot(Nm, V)), dirM = smoothstep(-0.2, 0.6, dot(Nm, u_rimDir)), ar = fwidth(fres) * 0.8 + 0.01, thr = mix(0.80, 0.69, capK * (kind > 1.5 ? 1.0 : smoothstep(0.030, -0.010, h.z)));   // a thin edge, and only where the whole mass turns away (the bun and the BACK of the cap: a band; in front of the ears it stays thin, or from below the whole fringe was rim)
  vec3 rim = mix(u_rimCol, lane * dot(u_rimCol, vec3(0.45)), 0.35) * (mix(0.26, 0.32, capK) * smoothstep(thr - ar, thr + ar, fres) * max(smoothstep(0.50, 0.72, fm), wet) * (u_rimBoth + (1.0 - u_rimBoth) * dirM));
  if (kind > 0.5 && kind < 1.5) { vec3 ng = normalize(cross(dFdx(h), dFdy(h)) + vec3(0.0, 0.0, 1e-12)); rim *= smoothstep(0.30, 0.55, 1.0 - abs(dot(ng, normalize(hv)))); }      // the cap's rim needs the REAL surface to turn away too (its shading normals are a sphere's: seen from below, the whole underside of the fringe was rim)
  glow = rim + ring * (vec3(0.060, 0.068, 0.135) * u_sunAmt + u_rimCol * mix(0.045, 0.105, capK * nightK) * (1.0 - u_sunAmt));
  if (kind > 0.5) {
    float ndn = dot(Nm, normalize(u_rimDir + vec3(0.0, 0.7, 0.0))) - 0.30, an = fwidth(ndn) * 0.8 + 0.004, px = max(length(dFdx(h)), length(dFdy(h))) + 1e-6;
    glow += u_rimCol * (0.028 * smoothstep(-an, an, ndn) * nightK);                                          // night: the side toward the horizon's glow is a second, hard tone
    glow += strandLines(h, kind, v_inst.y, px) * (1.0 - silh) * (vec3(0.050, 0.056, 0.110) * u_sunAmt * (0.45 + 0.55 * sh) + u_rimCol * 0.070 * nightK);
  }
  return base * lightc * (1.0 - 0.92 * silh);
}`;

export const meshFS = (PARTS) => `#version 300 es
precision highp float; precision highp int;
uniform sampler2D u_parts; uniform vec3 u_camPos, u_sun; uniform int u_points; uniform float u_psize, u_tiles, u_hull;
uniform vec3 u_amb, u_rimCol, u_rimDir, u_key, u_keyCol; uniform float u_rimBoth, u_sunAmt, u_under, u_emis, u_trans, u_faceG, u_sil;
uniform float u_nbb;      // take two (orchestra, bars 81-84): 1 = no band across the jacket's BACK (PLAN rule 8); 0 everywhere else (the figure as it was)
in vec3 v_n; in vec3 v_w; in vec2 v_uv; in vec3 v_la; in vec4 v_flags;
flat in vec4 v_inst; flat in vec4 v_lane; flat in vec4 v_fa; flat in vec4 v_fb; flat in vec3 v_hv; flat in vec3 v_hl; flat in float v_fpx;
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
  float yh = 0.1195 - 0.038 * pow(apx / 0.072, 2.0) + 0.0080 * max(0.0, 1.0 - apx / 0.0050) - tipA(apx, 0.047, 0.0070, 0.0026, 0.0090) - tipA(apx, 0.058, 0.0080, 0.0028, 0.0150) - tipA(apx, 0.0665, 0.0060, 0.0024, 0.0100);
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
  float uc = clamp(u, -1.0, 1.0), q = 1.0 - uc * uc, kc = mix(-0.0052, 0.0072, joy) * F_ES, hu = 0.0170 * F_ES;
  float yC = kc * q + mix(-0.0014, -0.0040, joy) * F_ES, yU = hu * (1.0 - pow(abs(uc), 2.6)) * (1.0 - 0.10 * uc);
  float dC = kc * -2.0 * uc, dU = -hu * 2.6 * pow(abs(uc), 1.6) * sign(uc) * (1.0 - 0.10 * uc) - 0.10 * hu * (1.0 - pow(abs(uc), 2.6));
  float y = mix(yC, yU, open) + F_TILT * u, dy = (mix(dC, dU, open) + F_TILT) / F_EW;
  if (u > 1.0) { float sl = mix(0.10, 0.02, open); y += (u - 1.0) * F_EW * sl; dy = sl; }
  if (u < -1.0) dy = F_TILT / F_EW;
  return vec2(y, dy);
}
// bold drawn folds: shadow shapes in loft space (t.x round the form, t.y along it), per region
float fa(float f, float w){ return smoothstep(0.0, 2.0 * w + 1e-5, f); }      // an implicit shape (f > 0 inside) with a filtered edge, w = the width of a pixel in f's units (strictly inside: where a shape's function is exactly 0 along a line, nothing is drawn). No derivative is taken in here or in folds()
// FINAL pass (fable/notes/final_fixes.md): the sleeve's folds are CURVED shapes. They were a diamond (a wedge with a corner at its thickest point) and straight-sided
// triangles: seen large at night (195-202) they read as the facets of a low-poly sleeve. Now:
// a crescent lying round the sleeve: one edge is the crease (the curve y0, given by the caller), the other bulges th * 2 away from it (sg: which way); its
// thickness runs out smoothly (no corner anywhere) to a fine point wp turns one way and wn the other. y of the result: the profile (for the crease's ink)
vec2 cres(float a, float y, float y0, float th, float wp, float wn, float sg){ float u = clamp(a > 0.0 ? a / wp : -a / wn, 0.0, 1.0), k = 1.0 - u * u, pr = k * sqrt(k); return vec2(th * pr - abs(y - y0 - sg * th * pr), pr); }
// a gather rising from the cuff: a thorn (concave sides, a fine point), its base (half width w, turns) on the line y1, its point len further up the arm, leaning lean turns over its length
float gather(float tx, float y, float c, float w, float len, float y1, float lean){ float s = clamp((y - (y1 - len)) / len, 0.0, 1.0), q = 1.0 - s, a = abs(fract(tx - c - lean * q * q + 0.5) - 0.5); return min(w * s * sqrt(s) - a, (y1 - y) * 0.5); }
vec2 folds(float region, vec2 t, vec3 la, vec3 arm, vec2 dt, float soft){      // dt: the width of a pixel in t (taken once, outside); soft: 0 a drawn edge (day) .. 1 a soft one (night)      // x: the fold's shadow shape, y: its drawn line (sleeves)
  float fo = 0.0, ln = 0.0;
  if (region == 3.0 || region == 4.0) {            // trouser leg: la = (ring x, 0 hip .. 1 hem, ring z)
    float a = atan(la.z, la.x) / 6.2832 + 0.5, p = la.y;
    fo = step(tri(a * 5.0 + 0.10 * sin(p * 9.0 + region * 2.0) + 0.2), 0.40 * smoothstep(0.52, 1.0, p));        // tall wedges rising from the hem
    fo = max(fo, step(abs(p - 0.47 - 0.045 * sin(a * 12.566 + 1.0)), 0.010) * step(0.62, tri(a * 2.0 + 0.2)));     // creases at the knee
  } else if (region == 15.0) {                     // jacket: gathers above the elastic hem (t.y 0 = hem)
    float id = floor(t.x * 13.0), hh = fract(sin(id * 12.99 + 3.1) * 43758.5); fo = fa(min((0.22 + 0.34 * hh) * smoothstep(0.10 + 0.12 * hh, 0.03, t.y) - tri(t.x * 13.0), (t.y - 0.012) * 6.0), 20.0 * dt.x + 3.0 * dt.y + 0.09 * soft);      // (polish: of uneven height, filtered edges)
  } else if (region == 1.0 || region == 2.0) {     // sleeves (polish): t.y 0 shoulder .. 0.54 elbow .. 0.85 the widest ring .. 0.93 gathered into the cuff .. 1
    // DRAWN, like the character sheet: inside the elbow a crescent of shadow with an inked crease (it deepens as the arm bends; the forearm's and the upper arm's
    // creases come with the bend), a long soft pull on the upper arm, and where the sleeve gathers into the cuff six thorns of different sizes (a band of tone
    // under the puff was tried: seen along the forearm it drew a target round the cuff). By day in a tone deeper than the form's shadow, at night one soft step (see main).
    if (arm.z <= 0.0) return vec2(0.0);                                                                     // a far body (the vertex shader did not look the elbow up): no sleeve folds, they would be under a pixel
    float a = fract(t.x - arm.y + 0.5) - 0.5, y = t.y, b = arm.x, mir = region == 1.0 ? 1.0 : -1.0, tx = region == 1.0 ? t.x : 1.0 - t.x, f = -1.0, g = -1.0; a *= mir;
    float wy = 0.75 * dt.y + 0.20 * dt.x + mix(0.0015, 0.0085, soft), wx = 0.75 * dt.x + 0.20 * dt.y + mix(0.0012, 0.0080, soft);      // a pixel in the units of a crescent (along the sleeve) and of a gather (round it), plus the edge's own softness: 1.5 mm by day, 8 mm at night
    if (y > 0.33 && y < 0.78) {
      float a1 = a + 0.02, a2 = 0.11 - a, a3 = a + 0.12, th1 = 0.013 + 0.019 * b, y1 = 0.538 - 0.05 * a1 + 0.26 * a1 * a1, th2 = 0.015 * smoothstep(0.08, 0.50, b), y2 = 0.655 + 0.02 * b - 0.07 * a2 - 0.30 * a2 * a2, th3 = 0.012 * smoothstep(0.25, 0.75, b), y3 = 0.452 - 0.02 * b - 0.05 * a3 - 0.24 * a3 * a3;
      vec2 c1 = cres(a1, y, y1, th1, 0.30, 0.15, 1.0);
      f = max(c1.x, max(cres(a2, y, y2, th2, 0.20, 0.09, 1.0).x, cres(a3, y, y3, th3, 0.17, 0.08, -1.0).x));      // (staggered round the arm: stacked on one line they drew a target on a bent elbow)
      g = gather(a, 1.0 - y, -0.170, 0.040, 0.185, 1.0 - 0.340, 0.020);                                    // the pull on the upper arm: its point toward the elbow
      ln = fa(0.0026 * sqrt(c1.y) * step(0.02, c1.y) * (1.0 - 0.7 * smoothstep(0.35, 0.8, b)) - abs(y - y1), 0.75 * dt.y + 0.20 * dt.x);     // the inked crease of the elbow's crescent
    }
    if (y > 0.62) {
      g = max(g, gather(tx, y, 0.040, 0.042, 0.260, 0.932, 0.016)); g = max(g, gather(tx, y, 0.210, 0.030, 0.170, 0.932, -0.010)); g = max(g, gather(tx, y, 0.380, 0.050, 0.300, 0.932, -0.022));
      g = max(g, gather(tx, y, 0.550, 0.028, 0.150, 0.932, 0.008)); g = max(g, gather(tx, y, 0.710, 0.044, 0.240, 0.932, 0.018)); g = max(g, gather(tx, y, 0.880, 0.032, 0.190, 0.932, -0.012));
    }
    fo = max(fa(f, wy), fa(g, wx)) * arm.z; ln *= arm.z;
  }
  return vec2(fo, ln);
}
void main(){
  int part; float region = floor(v_flags.x + 0.5); bool head = (u_points == 0 && region == 5.0);
  if (u_points == 1) { if (length(gl_PointCoord * 2.0 - 1.0) > 1.0) discard; part = int(v_flags.z + 0.5); }
  else { part = int(texelFetch(u_parts, ivec2(v_uv * u_psize), 0).r * 255.0 + 0.5); if (part == 255) discard; }
  if (u_nbb > 0.5 && u_points == 0 && region == 15.0 && part == ${PART.STRIPE} && v_la.z < 0.0) part = ${PART.JACKET};      // the chest band stops at the side seams: the back is plain white (disc + RARE EARTH only)
  float solid = v_inst.x, alpha = v_inst.w; vec3 lane = v_lane.rgb;
  if (alpha < 0.999 && ign(gl_FragCoord.xy) > alpha) discard;
  float hairM = 0.0, dH = -1.0;
  if (head) { dH = hairD(v_la); float aw = fwidth(dH) * 0.7 + 1e-5; hairM = smoothstep(-aw, aw, dH); part = dH > 0.0 ? ${PART.HAIR} : ${PART.SKIN}; }
  float regA = (u_points == 0 && part == ${PART.SKIN} && (region == 14.0 || (region == 0.0 && v_la.y > -0.2))) ? 5.0 : region;      // face, neck and the skin of the neckline are ONE area for the post outline: under the chin the line is the hull's brown jaw line alone (the two together were a dark mark at 236.6-240)
  vec3 auxc = celColor(part) * 0.7 + 0.3 * vec3(hash(regA + 0.37), hash(regA + 1.7), hash(regA + 4.1));
  if (u_points == 0 && (region == 10.0 || region == 11.0) && v_flags.y < 5.0) { float dgi = floor(v_flags.y), dgs = (v_flags.y - dgi - 0.2) * 0.25, rd = regA + 0.13 * (dgi + 1.0); auxc = mix(auxc, celColor(part) * 0.7 + 0.3 * vec3(hash(rd + 0.37), hash(rd + 1.7), hash(rd + 4.1)), smoothstep(0.004, 0.020, dgs) * smoothstep(4.2, 6.2, v_flags.z)); }      // each finger is its own area for the post outline (a thin line where two touch), fading into the palm at the knuckle: no line across the hand
  if (u_hull > 0.0) {                          // the ink line: brown round skin, blue-black elsewhere
    if (region == 0.0 && v_la.y > -0.150) discard;      // (not where the neck leaves the torso: it drew a line across the throat)
    vec3 ink = (part == ${PART.SKIN}) ? vec3(0.150, 0.042, 0.040) : vec3(0.010, 0.009, 0.026);
    o_col = vec4(ink * mix(u_amb, vec3(1.0), u_sunAmt) * solid, 1.0); o_aux = vec4(auxc, u_sunAmt * solid); return;
  }
  vec3 V = normalize(u_camPos - v_w), N = normalize(v_n); float inside = 0.0; if (dot(N, V) < 0.0 && !head) { N = -N; inside = 1.0; }
  float thin = (region == 3.0 || region == 4.0) ? v_flags.y * v_flags.y * (1.0 - inside) : 0.0;      // (v_flags.y means other things on the head, the hands and the sleeves)
  float facing = dot(N, V), fres = 1.0 - max(facing, 0.0);
  bool skin = head || part == 0; vec3 base = head ? celColor(0) : celColor(part); float forceSh = 0.0, catchA = 0.0, irisGlow = 0.0; vec2 faceD = vec2(0.0);      // faceD: the designed daylight shadow on the face, and how much of it replaces the form shading
  float pxF = 1e-6; if (head) pxF += max(length(dFdx(v_la.xy)), length(dFdy(v_la.xy)));      // metres of face per pixel
  vec2 tfo = fract(v_uv * u_tiles), dtf = vec2(0.0); if (region == 1.0 || region == 2.0 || region == 15.0) dtf = vec2(min(fwidth(tfo.x), fwidth(fract(tfo.x + 0.5))), fwidth(tfo.y));      // loft coordinates and a pixel's width in them (for the jacket's folds; no derivative is taken inside folds())
  if (head && hairM < 1.0 && v_la.z > 0.015 && v_fpx < 0.0105) {      // (beyond 1 cm of face per pixel nothing of the face is drawn: skip all of it)
    vec3 h = v_la; float px = pxF;         // metres of face per pixel
    float vis = 1.0 - smoothstep(0.0068, 0.0105, v_fpx), farE = smoothstep(0.0028, 0.0058, v_fpx), visD = 1.0 - smoothstep(0.0030, 0.0062, v_fpx);   // face LOD without a switch: first the details go (mouth, brows, blush), then the eyes (r3: WITH their whites to the end and a smaller iris far away: small proper eyes, never dark ovals); at crowd distance nothing
    float sx = h.x < 0.0 ? -1.0 : 1.0, ex = abs(h.x) - F_EX, u = ex / F_EW, ey = h.y - F_EY, open = v_fa.x, joy = v_fb.y, smile = v_fa.w;
    float uc = clamp(u, -1.0, 1.0), q = 1.0 - uc * uc;
    vec2 lu = lidUp(u, open, joy); float yC = (mix(-0.0052, 0.0072, joy) * q + mix(-0.0014, -0.0040, joy)) * F_ES + F_TILT * u, squint = clamp((smile - 0.45) / 0.55, 0.0, 1.0);
    float lo = mix(yC, -0.0114 * F_ES * (1.0 - 0.34 * squint) * q * (1.0 - 0.10 * uc) + F_TILT * u, open);
    float inEye = aa(min(lu.x - ey, ey - lo) - 0.0002, px) * step(abs(u), 1.0) * smoothstep(0.0, 0.15, open);
    // blush (warm, under the outer half of the eye), nose, mouth
    vec2 bq = vec2((abs(h.x) - 0.0500) / 0.0200, (h.y + 0.0085) / 0.0098);
    base = mix(base, S(0.985, 0.655, 0.600), (0.25 + 0.20 * joy + 0.10 * squint) * exp(-dot(bq, bq)) * visD);
    vec3 lineC = S(0.52, 0.25, 0.25), darkC = S(0.105, 0.085, 0.115);
    vec2 nq = vec2((h.x - 0.0006) / 0.0048, (h.y - F_NY) / 0.0016); base = mix(base, S(0.84, 0.56, 0.54), aa((1.0 - length(nq)) * 0.0015, px) * 0.85 * vis * (1.0 - smoothstep(0.0012, 0.0030, v_fpx)));
    // mouth (polish): a relaxed smile is a LINE that widens and turns up at its corners, the lips just parted; only the laugh opens it
    float sm = max(smile, 0.0), mw = 0.0124 + 0.0078 * sm, mwl = 0.0124 + 0.0034 * sm, mx = h.x / mw, mq = max(0.0, 1.0 - mx * mx), ym = F_MY + smile * 0.0056 * (mx * mx - 0.40), ms = smile * 0.0112 * mx / mw;
    float mo = v_fb.x, inM = step(abs(mx), 1.0), lipV = 1.0 - smoothstep(0.0016, 0.0036, v_fpx);
    { float yl0 = ym - mo * 0.0100 * mq; vec2 lq = vec2(h.x / (mwl * 0.72), (h.y - (yl0 - 0.0034)) / 0.0036), uq = vec2(h.x / (mwl * 0.62), (h.y - (ym + 0.0016)) / 0.0022);
      base = mix(base, S(0.915, 0.585, 0.560), 0.50 * aa((1.0 - length(lq)) * 0.0036, px) * step(h.y, yl0) * vis * lipV);                     // lower lip
      base = mix(base, S(0.880, 0.540, 0.530), 0.34 * aa((1.0 - length(uq)) * 0.0022, px) * step(ym, h.y) * (1.0 - mo) * vis * lipV); }             // upper lip
    if (mo > 0.01) { float yl = ym - mo * 0.0100 * mq; base = mix(base, mix(S(0.84, 0.45, 0.45), S(0.52, 0.18, 0.21), smoothstep(yl + 0.0012, yl + 0.0048, h.y)), aa(min(ym - h.y, h.y - yl), px) * inM * visD); }
    base = mix(base, lineC, line(abs(h.y - ym) / sqrt(1.0 + ms * ms), 0.00135 * (0.22 + 0.78 * mq), px) * inM * visD);
    // eye: white (shaded under the lid), iris (a designed gradient: near black under the lid, warm brown low, a lighter crescent at the bottom), pupil, ONE catchlight
    float sclA = inEye * vis;
    base = mix(base, mix(S(0.970, 0.965, 0.985), S(0.70, 0.69, 0.84), smoothstep(0.0066, 0.0024, lu.x - ey)), sclA);
    float qx = h.x - sx * F_EX; vec2 ic = vec2(v_fb.z * 0.0080 - sx * 0.0007, 0.0034 + v_fb.w * 0.0040), e = vec2((qx - ic.x) / 0.0150, (ey - ic.y) / 0.0170) * (1.0 + 0.30 * farE); float r = length(e);
    float iris = aa((1.0 - r) * 0.0158, px) * inEye * vis, pup = aa((0.40 - length(e - vec2(0.0, 0.04))) * 0.0158, px);
    vec3 icol = mix(S(0.360, 0.200, 0.120), S(0.100, 0.058, 0.058), smoothstep(-0.66, 0.16, e.y));
    icol = mix(icol, S(0.520, 0.305, 0.175), aa((length(e - vec2(0.0, 0.34)) - 1.06) * 0.0158, px) * 0.85);       // the lighter crescent low in the iris
    icol = mix(icol, S(0.090, 0.050, 0.056), smoothstep(0.80, 0.94, r)); icol = mix(icol, S(0.045, 0.030, 0.040), pup); icol *= 1.0 - 0.35 * smoothstep(0.30, 0.95, e.y);
    base = mix(base, icol, iris); irisGlow = iris * (1.0 - pup) * smoothstep(0.0, -0.75, e.y) * smoothstep(0.55, 1.0, r + 0.25);
    catchA = aa((1.0 - length((e - vec2(-0.33, 0.36)) / vec2(0.36, 0.32))) * 0.0054, px) * iris * smoothstep(0.25, 0.6, open);
    // lower lid, lash (a line with weight: it thickens outward into the flick), brow (straight and full)
    base = mix(base, lineC, line(abs(ey - lo), 0.0008, px) * smoothstep(0.05, 0.45, u) * step(u, 1.0) * open * 0.6 * visD);
    float tl = mix(0.0036, 0.0068, smoothstep(-0.9, 0.9, u)) * smoothstep(-1.10, -0.82, u) * smoothstep(1.30, 1.0, u) * (1.0 + 0.2 * (1.0 - open));
    base = mix(base, darkC, line(abs(ey - lu.x - 0.0010) / sqrt(1.0 + lu.y * lu.y), tl, px) * vis);
    float ub = u - 0.05, tb = max(u - 0.50, 0.0), yb = F_BY + 0.0030 * u + 0.0008 * (1.0 - ub * ub) - 0.0030 * tb * tb + v_fa.y * 0.0046 * u + v_fa.z * 0.0032, sb = (0.0030 - 0.0016 * ub - 0.0060 * tb + v_fa.y * 0.0046) / F_EW;      /* (rising a little outward, a short tail that barely drops: a drooping tail read as worry) */
    base = mix(base, darkC, 0.97 * line(abs(ey - yb) / sqrt(1.0 + sb * sb), mix(0.0058, 0.0030, smoothstep(-0.5, 1.05, u)), px) * smoothstep(-1.00, -0.86, u) * smoothstep(1.10, 0.94, u) * visD);
    forceSh = smoothstep(-0.0078, -0.0064, dH) * vis;                                        // the shadow the hair lays on the forehead
    // polish: by DAY the face is shaded by design, not by the mesh. She is always lit from the front; the shapes are: the hair's shadow falling away from the
    // light (under the fringe, beside the temple on the sun's side), a small shadow under the nose tip, and ONE crescent of tone along the cheek away from the sun
    // (it hugs the contour and never crosses the face; none when the sun is in front of her or straight behind). A white key takes this from the first daylight
    // (the catch's own sunrise, 229.6-231); a coloured key (Act C's low gold sun) keeps the form shading until full day.
    float kTf = max(max(u_keyCol.r, u_keyCol.g), u_keyCol.b) - min(min(u_keyCol.r, u_keyCol.g), u_keyCol.b), dayF = mix(smoothstep(0.02, 0.25, u_sunAmt), smoothstep(0.35, 0.75, u_sunAmt), min(1.0, 4.0 * kTf));
    if (dayF > 0.0) {
      vec3 L = normalize(v_hl); float az = atan(L.x, L.z), sd = az >= 0.0 ? 1.0 : -1.0, aaz = abs(az), sw = max(1.2 * px, 0.0011);
      float fr = smoothstep(-sw, sw, hairD(h + vec3(clamp(L.x, -0.6, 0.6), max(L.y, 0.35), 0.0) * 0.0105) + 0.0006);
      float cont = 0.086 + 0.62 * min(0.0, h.y - 0.015), wC = 0.021 * smoothstep(0.45, 1.20, aaz) * (1.0 - smoothstep(2.35, 2.95, aaz)) * smoothstep(0.085, 0.020, h.y);
      float cheek = smoothstep(-sw, sw, -sd * h.x - (cont - wC)) * step(0.0005, wC);
      vec2 nsq = vec2((h.x + sd * 0.0030 * min(1.0, aaz * 1.6)) / 0.0068, (h.y - (F_NY - 0.0046)) / 0.0027); float nsh = aa((1.0 - length(nsq)) * 0.0027, px) * (1.0 - smoothstep(0.0016, 0.0036, v_fpx));
      faceD = vec2(max(max(fr, cheek), nsh) * vis, dayF);
    }
  }
  // ONE shading model: two flat tones with a hard edge; only the world's light changes (night -> sunrise -> day).
  // r3: the silhouette rule. Against the sun (the lens looks toward it, u_sil > 0 round sunrise) every surface, the face included, goes to black; rim and accents stay.
  vec3 diff, glow; float silh = u_sil * smoothstep(0.25, 0.80, dot(-V, normalize(u_sun)));
  if (!head && (part == ${PART.HAIR} || part == ${PART.BUN})) diff = hairLit(v_la, N, N, N, 0.0, V, v_hv, v_hl, lane, 0.0, 2.0, glow);
  else {
    float kT = max(max(u_keyCol.r, u_keyCol.g), u_keyCol.b) - min(min(u_keyCol.r, u_keyCol.g), u_keyCol.b), kW = max(u_sunAmt, min(0.85, 2.0 * kT));      // r3: a COLOURED key (keyCol) counts by its own saturation, not only by sunAmt (at sunAmt 0.1-0.3 it barely tinted the jacket); white: as before. Skin takes half the tint
    // FINAL pass: nite = 1 on the jacket and its sleeves while the key is weak (night, the violet hour), 0 from sunrise on. There a fold is ONE soft tone step (foldN) and the
    // form's own terminator is a soft gradient: both were hard edges that followed the mesh, i.e. facets, on the film's closest shot (195-202). Day and sunrise: as before.
    float nite = (u_points == 0 && (region == 1.0 || region == 2.0 || region == 15.0)) ? 1.0 - smoothstep(0.12, 0.30, kW) : 0.0;
    vec2 fold2 = vec2(0.0); if (u_points == 0) fold2 = folds(region, tfo, v_la, (region == 1.0 || region == 2.0) ? vec3(floor(v_flags.z) / 255.0, v_flags.y, clamp((fract(v_flags.z) - 0.01) / 0.97, 0.0, 1.0)) : vec3(0.0, 0.25, 0.0), dtf, nite); float foldN = fold2.x * nite, fold = fold2.x - foldN;
    float ndl = dot(N, u_key) + (skin ? 0.30 : 0.08), aw = fwidth(ndl) * 0.8 + 0.004 + 0.45 * nite;
    float sh = mix(smoothstep(-aw, aw, ndl) * (1.0 - forceSh), 1.0 - faceD.x, (head && hairM < 1.0 && v_la.z > 0.015) ? faceD.y : 0.0) * (1.0 - fold), jaw = 0.0;
    if (u_points == 0 && (region == 14.0 || region == 0.0)) { float e = v_la.y + 0.110 - 0.30 * v_la.x, ae = fwidth(e) * 0.8 + 0.0008; jaw = smoothstep(-ae, ae, e) * (1.0 - smoothstep(0.062, 0.090, v_la.z)); sh *= 1.0 - jaw; }
    if (head) { float ajw = fwidth(v_flags.y) * 0.8 + 0.02; jaw = smoothstep(0.60 - ajw, 0.60 + ajw, -v_flags.y) * smoothstep(-0.030, -0.040, v_la.y) * (1.0 - hairM); sh *= 1.0 - jaw; }      /* polish: from the loft's smooth normal (the screen-space one drew the mesh's facets as stray triangles on the jaw) */      // ... and the underside of the jaw is in it too (seen from below the face was one pale shape); it leaves the neck when her head tips back (the neck is then in front of the jaw, in the light)      // r3: the jaw's shadow is a SHAPE in the head's frame (it turns with her head; deeper on the side away from the key): the neck sits in it, the collarbone below is lit, so chin, neck and collar separate
    vec3 nightAmb = u_amb * (skin ? 1.6 : 1.0) * (1.0 - 0.30 * fold) * (1.0 - 0.38 * jaw);       // skin holds a little more of the night's light: a face in shadow tones, not a hole
    vec3 lightc = mix(mix(nightAmb, shadeTint(skin ? ${PART.SKIN} : part) * mix(vec3(1.0), vec3(0.86, 0.75, 0.80), jaw), u_sunAmt), skin ? mix(vec3(1.0), u_keyCol, 0.5) : u_keyCol, kW * sh);
    if (region == 1.0 || region == 2.0 || region == 15.0) lightc *= mix(vec3(1.0), mix(vec3(1.0), vec3(0.44, 0.48, 0.66), u_sunAmt), fold) * (1.0 - 0.17 * foldN);      // sleeves: a fold is a tone deeper than the form's shadow, so it still reads on the shaded side
    diff = base * lightc * (1.0 - 0.55 * inside * step(2.5, region) * step(region, 4.5)) * (1.0 - 0.92 * silh);
    diff = mix(diff, vec3(0.030, 0.032, 0.075) * mix(u_amb, vec3(1.0), u_sunAmt), 0.86 * fold2.y * smoothstep(0.3, 0.8, u_sunAmt) * (1.0 - silh));      // the folds' ink strokes (daylight only, like the outline)
    if (u_points == 0 && skin && (region == 10.0 || region == 11.0)) diff *= 1.0 - 0.36 * (1.0 - smoothstep(0.12, 0.30, kW)) * smoothstep(4.2, 6.2, v_flags.z) * (1.0 - smoothstep(0.48, 0.70, facing));      // FINAL pass: at night there is no ink, and a hand was one flat tone (the pencil hand of 195-202: a block). Each finger and the palm's edge turn a tone darker where they turn away from the lens: the fingers separate. Only while the fingers are open (their width in pixels), and gone by sunrise
    float dirM = smoothstep(-0.2, 0.6, dot(N, u_rimDir)), thr = head ? mix(0.92, 0.84, dirM) : (skin ? mix(0.86, 0.72, dirM) : mix(0.80, 0.60, dirM)), ar = fwidth(fres) * 0.8 + 0.01 + 0.07 * nite;      // (FINAL pass: on the night jacket the rim's inner edge is soft: hard, it drew the facets of a bent elbow)
    glow = mix(u_rimCol, lane * dot(u_rimCol, vec3(0.45)), 0.35) * ((head ? 0.30 : 0.50) * smoothstep(thr - ar, thr + ar, fres) * (u_rimBoth + (1.0 - u_rimBoth) * dirM));
    if (hairM > 0.0) { vec3 g2, hc = hairLit(v_la, N, N, N, 0.0, V, v_hv, v_hl, lane, 1.0, 1.0, g2);
      float pxh = max(length(dFdx(v_la.xz)), length(dFdy(v_la.xz))) + 1e-6, pl = line(abs(v_la.x - F_PARTX - 0.0012 * sin(v_la.z * 75.0)), 0.0017, pxh) * smoothstep(-0.060, -0.030, v_la.z) * step(0.09, v_la.y) * (1.0 - smoothstep(0.0035, 0.0075, pxh));
      hc = mix(hc, S(0.50, 0.40, 0.44) * lightc, 0.75 * pl); diff = mix(diff, hc, hairM); glow = mix(glow, g2, hairM); }
  }
  // underlight from her road, in her lane colour: shoes and hems, gone by the hip
  float hf = smoothstep(1.05, 0.0, v_flags.w);
  vec3 under = lane * (u_under * 1.3 * hf * hf * (0.40 + 0.60 * clamp(0.3 - N.y * 1.4, 0.0, 1.0))) * (base * 0.55 + 0.20);
  under *= 1.0 - (head ? hairM : ((part == ${PART.HAIR} || part == ${PART.BUN}) ? 1.0 : 0.0));       // black hair takes no underlight (lying on the water it turned ginger)
  // accents are light sources at night and plain colour by day
  vec3 em = vec3(0.0);
  if (emissive(part)) em = ORANGE * 1.15; else if (part == ${PART.DOT}) em = vec3(0.32, 0.58, 1.0) * 0.95; else if (part == ${PART.TEXT}) em = vec3(1.0, 0.95, 0.86) * 1.7; else if (part == ${PART.PATCH}) em = vec3(0.55, 0.54, 0.52);
  float back = smoothstep(0.1, 0.9, dot(-V, u_sun));
  vec3 tr = vec3(1.0, 0.42, 0.10) * (back * thin * thin * 0.09 * u_trans);
  vec3 col = (diff + under + tr) * solid + glow * (0.45 + 0.55 * solid) + em * (u_emis * v_lane.a);
  // the eyes keep their light: white catchlights by day; at night the horizon in them, and her road's colour low in the iris
  vec3 catchC = mix((u_rimCol * 0.22 + lane * 0.10 + 0.05) * u_faceG, vec3(1.0), min(1.0, u_sunAmt * 2.0));
  col = mix(col, catchC, catchA * max(u_faceG, min(1.0, u_sunAmt * 3.0)) * solid * (1.0 - silh)) + lane * (0.04 * u_faceG * (1.0 - u_sunAmt) * irisGlow * solid);
  o_col = vec4(col, 1.0); o_aux = vec4(auxc, u_sunAmt * solid);
}`;

// ---------------------------------------------------------------------------------------------------------------------
export const clumpVS = (COMMON, PARTS) => COMMON + PARTS + `
layout(location=0) in vec4 a_c0; // guide L, guide R, mix, type (0 back, 1 bun wisps, 2 side locks)
layout(location=1) in vec4 a_c1; // s along, angle round, seed, fan
layout(location=2) in vec4 a_c2; // half width, half thickness, length, -
out vec3 v_n; out vec3 v_nm; out vec3 v_nt; out vec3 v_w; out vec3 v_h; out vec2 v_s; out float v_fly;
flat out vec4 v_inst; flat out vec4 v_lane; flat out vec3 v_hv; flat out vec3 v_hl;
void cull(){ gl_Position = vec4(2.0, 2.0, 2.0, 1.0); }
vec3 unyaw(vec3 p){ float c = cos(i_pos.w), s = sin(i_pos.w); return vec3(c * p.x - s * p.z, p.y, s * p.x + c * p.z); }
vec3 gnode(TI ti, int g, int n){ return simNode(ti, g * NODES + clamp(n, 0, NODES - 1)); }
void main(){
  int ty = int(a_c0.w + 0.5); bool bun = i_misc.y > 0.5;
  v_inst = vec4(i_par.w, bun ? 1.0 : 0.0, i_par.z, i_fx.x); v_lane = i_col;
  if (i_fx.x <= 0.0 || (ty == 0 && (bun || i_fx.w > 0.5)) || (ty == 1 && !bun) || (ty == 2 && a_c1.w != 0.0 && i_fx.w > 0.5)) { cull(); return; }      // (r3: with hair 'strands' (the float, the rise) the loose strands by the ears are not drawn: lying on the water they were two dark hooks)
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
  if (ty == 0) { float sg = fan >= 0.0 ? 1.0 : -1.0; float ko = smoothstep(0.45, 0.78, abs(fan)); C += cx * ((sg * (0.100 - 0.050 * abs(fan)) * smoothstep(mix(0.30, 0.37, ko), mix(0.45, 0.58, ko), sl) - (fan - sg * 0.55) * 0.030 * smoothstep(0.50, 1.0, sl)) * (1.0 - simNode(ti, LAG).y)); }   // straight down behind the shoulders first; the parting opens only below the shoulder line, behind the jacket   // ... and each curtain gathers toward its tips
  if (ty == 2 && fan != 0.0) C += qrot(jquat(ti, ${J.head}), vec3(0.0, 0.0, 1.0)) * (fan * smoothstep(0.10, 0.32, sl));        // loose strands in front of the ears
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
  v_fly = ty == 0 ? smoothstep(0.30, 0.50, length((P - jpos(ti, ${J.chest})).xz)) * smoothstep(0.35, 0.55, sl) : 0.0;      // r3: back hair flung far out from her spine (a spin, a kick) loses its rim: on a whipping clump it drew a grey loop (177.4)
}`;
export const clumpFS = (PARTS) => `#version 300 es
precision highp float; precision highp int;
uniform vec3 u_camPos, u_sun; uniform vec3 u_amb, u_rimCol, u_rimDir, u_key, u_keyCol; uniform float u_rimBoth, u_sunAmt, u_trans, u_sil;
in vec3 v_n; in vec3 v_nm; in vec3 v_nt; in vec3 v_w; in vec3 v_h; in vec2 v_s; in float v_fly;
flat in vec4 v_inst; flat in vec4 v_lane; flat in vec3 v_hv; flat in vec3 v_hl;
layout(location=0) out vec4 o_col; layout(location=1) out vec4 o_aux;
${PARTS}
${FACE_GLSL}
${HAIR_FN}
float ign(vec2 p){ return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715)))); }
void main(){
  float solid = v_inst.x, alpha = v_inst.w; if (alpha < 0.999 && ign(gl_FragCoord.xy) > alpha) discard;
  vec3 V = normalize(u_camPos - v_w), N = normalize(v_n); if (dot(N, V) < 0.0) N = -N;
  vec3 glow, c = hairLit(v_h, N, normalize(v_nt), normalize(v_nm), v_s.y, V, v_hv, v_hl, v_lane.rgb, 1.0 - smoothstep(0.30, 0.42, v_s.x), 0.0, glow);      // (r3: the ring only on the part of a clump that lies on the head: a clump whipping past the head in a spin drew a grey loop, 177.4)
  float back = smoothstep(0.1, 0.9, dot(-V, u_sun));
  vec3 tr = vec3(1.0, 0.40, 0.09) * (back * 0.05 * smoothstep(0.75, 1.0, v_s.x) * u_trans);        // the sun through the tips
  o_col = vec4((c + tr) * solid + glow * (1.0 - 0.9 * v_fly) * (0.45 + 0.55 * solid), 1.0); o_aux = vec4(celColor(${PART.HAIR}), u_sunAmt * solid);
}`;
