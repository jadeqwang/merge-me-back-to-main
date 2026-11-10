// Sky dome. One scalar, `dawn` in [0,1], drives the whole sky (SPEC §3):
//   0 night · 0.35 blue hour (magenta-gold band in the east) · 0.6 sunrise (huge sun on the horizon) · 1.0 day.
// The GLSL chunk SKY_GLSL is shared with the ground (the mirror reflects the same sky).
import { Program, VS_TRI, FS_HEAD, drawTri, hex } from './glx.js';

// palette keys in sRGB hex -> linear. Z zenith, M mid (about 15 deg up), H horizon away from the sun, HE horizon toward the sun,
// B1 thin low band in the east, B2 wide band in the east, AG airglow (thin band all round the horizon at night)
const KEYS = [
  { d: 0.00, Z: '#04051A', M: '#0B1040', H: '#141E66', HE: '#1A2880', B1: '#16286E', B2: '#0C1448', AG: '#1E7C86', ag: 0.5, star: 1.0, w1: 0.055, w2: 0.20, hg: 1.0 },
  { d: 0.35, Z: '#040722', M: '#0D1668', H: '#1A2488', HE: '#2A2E9E', B1: '#FF9E4A', B2: '#8E2C86', AG: '#2A6C9A', ag: 0.12, star: 0.4, w1: 0.026, w2: 0.065, hg: 1.0 },
  { d: 0.60, Z: '#0F0D45', M: '#43218A', H: '#7E2686', HE: '#C22F6E', B1: '#FF8A2A', B2: '#E8325A', AG: '#000000', ag: 0.0, star: 0.08, w1: 0.05, w2: 0.16, hg: 1.0 },
  { d: 1.00, Z: '#4F93FF', M: '#9CC8FF', H: '#FFF6E6', HE: '#FFF8EA', B1: '#FFF1D4', B2: '#FFDDB0', AG: '#000000', ag: 0.0, star: 0.0, w1: 0.05, w2: 0.16, hg: 1.35 },
];
const KL = KEYS.map((k) => ({ ...k, Z: hex(k.Z), M: hex(k.M), H: hex(k.H), HE: hex(k.HE), B1: hex(k.B1), B2: hex(k.B2), AG: hex(k.AG) }));
const sm = (u) => u * u * (3 - 2 * u);

// everything the sky shader needs for a given dawn + optional overrides: env.sun = {az deg (0 = +X east, toward +Z), elev rad, radius rad, gain}
export function skyParams(dawn, sun = {}, t = 0, pxAngle = 0.001) {
  dawn = Math.min(1, Math.max(0, dawn));
  let i = 0; while (i < KL.length - 2 && KL[i + 1].d <= dawn) i++;
  const a = KL[i], b = KL[i + 1], u = sm(Math.min(1, Math.max(0, (dawn - a.d) / (b.d - a.d))));
  const mix3 = (f) => [0, 1, 2].map((j) => a[f][j] + (b[f][j] - a[f][j]) * u);
  const hgain = a.hg + (b.hg - a.hg) * u;
  const mix1 = (f) => a[f] + (b[f] - a[f]) * u;
  // default sun track: below the horizon in the night, breaking at ~0.5, half-risen at 0.6, high and smaller by day
  const k = (x0, x1) => sm(Math.min(1, Math.max(0, (dawn - x0) / (x1 - x0))));
  const radius = sun.radius ?? (0.17 - 0.115 * k(0.7, 1.0));
  const elev = sun.elev ?? (-0.30 + 0.30 * k(0.3, 0.52) + radius * 0.75 * k(0.5, 0.62) + 0.62 * k(0.66, 1.0));
  const az = ((sun.az ?? 0) * Math.PI) / 180;
  const dir = [Math.cos(elev) * Math.cos(az), Math.sin(elev), Math.cos(elev) * Math.sin(az)];
  const gain = sun.gain ?? k(0.36, 0.56);
  return { uZ: mix3('Z'), uM: mix3('M'), uH: mix3('H').map((c) => c * hgain), uHE: mix3('HE').map((c) => c * hgain), uB1: mix3('B1'), uB2: mix3('B2'), uAG: mix3('AG').map((c) => c * mix1('ag')),
    uStarGain: mix1('star'), uW1: mix1('w1'), uW2: mix1('w2'), uSunDir: dir, uSunRad: radius, uSunGain: gain, uSunBands: sun.bands ?? 0, uDawn: dawn, uTime: t, uPxAngle: pxAngle, uSkyK: sun.grad ?? 1 };   // sun.grad > 1 brings the zenith colour down toward the horizon (actE: a bluer day; default 1 = unchanged)
}

export const SKY_GLSL = `
uniform vec3 uZ, uM, uH, uHE, uB1, uB2, uAG, uSunDir;
uniform float uW1, uW2, uStarGain, uSunRad, uSunGain, uSunBands, uDawn, uTime, uPxAngle, uSkyK;
float h31(vec3 p){ p = fract(p*vec3(.1031,.1030,.0973)); p += dot(p, p.yxz+33.33); return fract((p.x+p.y)*p.z); }
vec3 h33(vec3 p){ p = fract(p*vec3(.1031,.1030,.0973)); p += dot(p, p.yxz+33.33); return fract((p.xxy+p.yxx)*p.zyx); }
float vnoise3(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f);
  return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x), mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x), f.y),
             mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x), mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x), f.y), f.z); }
vec3 starLayer(vec3 d, float N, float thresh, float size){
  vec3 q = d*N, c = floor(q); vec3 r = h33(c);
  if (r.x < thresh) return vec3(0.);
  vec3 sp = c + 0.2 + 0.6*h33(c+17.3);
  float dist = length(q - sp);
  float rad = max(uPxAngle*N*size, 0.02);
  float m = exp(-dist*dist/(rad*rad));
  float b = pow((r.x - thresh)/(1.-thresh), 3.0);
  float tw = 0.82 + 0.18*sin(uTime*(1.5+4.*r.y) + r.z*40.);
  vec3 tint = mix(vec3(0.72,0.82,1.0), vec3(1.0,0.86,0.72), r.y);
  return tint * m * (0.25 + 2.6*b) * tw;
}
// d: normalised view direction (y up). Returns linear HDR radiance. skyBase = gradient, bands, airglow, sun; skyStars = the night's stars and milky river.
vec3 skyBase(vec3 d){
  float e = clamp(d.y, 0., 1.);
  vec2 hz = normalize(d.xz + 1e-6), sz = normalize(uSunDir.xz + 1e-6);
  float ef = max(dot(hz, sz), 0.);                       // 1 toward the sun's azimuth
  vec3 hor = mix(uH, uHE, ef*ef);
  float eg = clamp(e*uSkyK, 0., 1.);
  vec3 col = mix(hor, uM, smoothstep(0.0, 0.30, pow(eg, 0.8)));
  col = mix(col, uZ, smoothstep(0.12, 0.80, pow(eg, 0.75)));
  // the eastern bands: a wide soft one and a thin bright one hugging the horizon
  col += uB2 * exp(-e/uW2) * pow(ef, 2.5) * 0.85;
  col += uB1 * exp(-e/uW1) * pow(ef, 5.0) * 1.2;
  // airglow: a thin lifted band just above the horizon, all the way round (night only)
  float agq = (e-0.07)/0.06; float ag = exp(-agq*agq);
  col += uAG * ag * (0.55 + 0.45*vnoise3(d*vec3(6.,1.,6.)+vec3(0.,uTime*0.01,0.)));
  // sun: a clean huge disc, hot at the top, rose at the foot, with a wide breath of glow
  if (uSunGain > 0.001) {
    float ang = acos(clamp(dot(d, uSunDir), -1., 1.));
    float disc = smoothstep(uSunRad + uPxAngle, uSunRad - uPxAngle, ang);
    float v = clamp((d.y - uSunDir.y)/uSunRad, -1., 1.);
    vec3 dc = mix(vec3(1.0, 0.07, 0.05), vec3(1.0, 0.25, 0.04), smoothstep(-1.0, -0.3, v));
    dc = mix(dc, vec3(1.0, 0.50, 0.11), smoothstep(-0.4, 0.8, v));
    float hot = mix(1.3, 2.3, smoothstep(-0.9, 1.0, v)) * mix(1.0, 4.5, smoothstep(0.66, 1.0, uDawn));
    if (uSunBands > 0.) { float y = (v+1.)*0.5; float slit = smoothstep(0.42, 0.5, abs(fract(y*11. - 0.3*y*y*11.) - 0.5)*2.*(0.35+y)); disc *= mix(1., slit, uSunBands*smoothstep(0.62, 0.2, y)); }
    vec3 glow = vec3(1.0, 0.42, 0.10) * exp(-max(ang-uSunRad,0.)/(0.06)) * 0.7 + vec3(1.0, 0.16, 0.28) * exp(-ang/0.42) * 0.22;
    glow *= mix(1.0, 0.45, smoothstep(0.7, 1.0, uDawn));
    col = mix(col + glow*uSunGain, dc*hot, disc*uSunGain);
  }
  return col;
}
vec3 skyStars(vec3 d){
  vec3 col = vec3(0.); float e = clamp(d.y, 0., 1.);
  if (uStarGain > 0.001) {
    vec3 ax = normalize(vec3(0.35, 0.55, -0.76));
    float bq = dot(d, ax)/0.30; float band = exp(-bq*bq);
    float n = vnoise3(d*3.1) * 0.6 + vnoise3(d*7.3+4.) * 0.3 + vnoise3(d*17.+9.)*0.1;
    col += vec3(0.20, 0.16, 0.55) * band * smoothstep(0.15, 1.0, n) * 0.07 * uStarGain * smoothstep(0.05, 0.45, e);
    float ext = smoothstep(0.01, 0.22, e);
    vec3 st = starLayer(d, 140., 0.90, 1.1) + starLayer(d.zxy, 60., 0.93, 1.5) * 1.8 + starLayer(d.yzx, 260., 0.86, 0.9) * 0.6;
    col += st * uStarGain * ext * (0.6 + 0.4*band);
  }
  return col;
}
vec3 skyColor(vec3 d){ return skyBase(d) + skyStars(d); }
`;

export const RAY_GLSL = `
uniform mat4 uInvVP; uniform vec3 uCam;
vec3 rayDir(vec2 uv){ vec4 p = uInvVP * vec4(uv*2.-1., 1., 1.); return normalize(p.xyz/p.w - uCam); }
`;

export class Sky {
  constructor(gl) {
    this.gl = gl;
    this.prog = new Program(gl, VS_TRI, FS_HEAD + RAY_GLSL + SKY_GLSL + `
in vec2 vUv; layout(location=0) out vec4 o0; layout(location=1) out vec4 o1;
void main(){ vec3 d = rayDir(vUv); o0 = vec4(skyColor(d), 1.); o1 = vec4(0.); }`, 'sky');
  }
  draw(cam, sp) { const gl = this.gl; this.prog.use().set({ uInvVP: cam.invViewProj, uCam: cam.pos, ...sp }); drawTri(gl); }
}
