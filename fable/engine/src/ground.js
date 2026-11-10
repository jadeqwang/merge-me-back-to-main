// The mirror. y = 0, infinite. Night: a black mirror that reflects the sky's horizon glow and every light above it.
// Day: a pale mirror. Reflection of drawables comes from the planar-reflection buffer (same screen uv), softened and rippled.
import { Program, VS_TRI, FS_HEAD, drawTri, hex } from './glx.js';
import { SKY_GLSL, RAY_GLSL } from './sky.js';

export class Ground {
  constructor(gl) {
    this.gl = gl;
    this.prog = new Program(gl, VS_TRI, FS_HEAD + RAY_GLSL + SKY_GLSL + `
in vec2 vUv; layout(location=0) out vec4 o0; layout(location=1) out vec4 o1;
uniform sampler2D uRefl, uReflAux; uniform vec2 uRes;
uniform vec3 uBase; uniform float uBaseCut, uF0, uRipple, uFogDist, uFogAmt, uReflGain, uReflBlur, uRough;
float gn(vec2 p){ vec2 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); float a=h31(vec3(i,1.)), b=h31(vec3(i+vec2(1,0),1.)), c=h31(vec3(i+vec2(0,1),1.)), d=h31(vec3(i+vec2(1,1),1.)); return mix(mix(a,b,f.x), mix(c,d,f.x), f.y); }
void main(){
  vec3 d = rayDir(vUv);
  float a = smoothstep(0.0, 1.5*uPxAngle, -d.y);
  if (a <= 0.) discard;
  float dist = uCam.y / max(-d.y, 1e-5);
  vec3 p = uCam + d*dist;
  // ripple: a few crossing swells (band-limited sines; each fades once a pixel covers more than a fraction of its wavelength,
  // so far water is a clean mirror and nothing shimmers)
  float fp = dist*dist*uPxAngle/max(uCam.y, 0.05);
  vec2 g = vec2(0.);
  for (int i=0;i<7;i++){ float fi = float(i); float an = fi*2.39996 + 0.5; vec2 dir = vec2(cos(an), sin(an)); float fr = 0.42*pow(1.41, fi);
    float k = 1. - smoothstep(0.12, 0.5, fp*fr/6.2832);
    g += dir * cos(dot(dir, p.xz)*fr + uTime*(0.55 + 0.21*fi) + fi*1.7) * k / (1. + fi*0.3); }
  { vec2 fh = normalize(d.xz + 1e-6), lat = vec2(-fh.y, fh.x); g = fh*dot(g, fh) + lat*dot(g, lat)*0.3; }   // sideways wobble is mostly invisible at a grazing eye; keep it gentle
  g *= 0.35 + 1.3*gn(p.xz*0.05 + vec2(uTime*0.02, 7.));           // swells come in patches, never as regular stripes
  vec3 n = normalize(vec3(g.x*uRipple, 1., g.y*uRipple));
  vec3 r = reflect(d, n); r.y = abs(r.y); r = normalize(r);
  float cosv = max(dot(-d, n), 0.);
  float fres = pow(1. - cosv, 5.);
  float kS = mix(uF0, 1., fres);
  // the sky in the mirror: stars sharp, the rest smeared along the line of sight (a low sun becomes a pillar of light, not a wobbling blob)
  vec3 fwdH = normalize(vec3(d.x, 0., d.z)); vec3 acc = skyBase(r); float ws = 1.;
  for (int i=1;i<=4;i++){ float fi = float(i), w = exp(-fi*fi/5.0); float tl = fi*uRough*0.016;
    acc += (skyBase(normalize(reflect(d, normalize(n + fwdH*tl))*vec3(1.,1.,1.) + vec3(0.,1e-4,0.))) + skyBase(normalize(reflect(d, normalize(n - fwdH*tl))*vec3(1.,1.,1.) + vec3(0.,1e-4,0.))))*w; ws += 2.*w; }
  vec3 skyR = acc/ws + skyStars(r);
  // drawables in the mirror: same screen uv, pushed by the ripple normal, softened vertically with distance from the eye
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 off = n.xz * vec2(0.5, 1.0) * 0.10;
  float blur = uReflBlur * (0.5 + 2.5*uRough) * (0.5 + min(fp*0.6, 2.5)) / uRes.y;
  vec3 rc = vec3(0.); float cov = 0.;
  for (int i=-3;i<=3;i++){ float w = exp(-float(i*i)/6.0); vec2 q = uv + off + vec2(0., float(i)*blur); rc += texture(uRefl, q).rgb*w; cov += texture(uReflAux, q).a*w; }
  rc /= 4.165; cov /= 4.165;
  // large slow variation so that a top-down ground is never a flat void
  float wet = 0.75 + 0.5*gn(p.xz*0.004 + 3.7);
  vec3 col = uBase*wet*(1.-kS*uBaseCut) + kS*(skyR*(1.-cov) + rc*uReflGain);
  // aerial perspective into the horizon colour
  vec3 fogc = skyColor(normalize(vec3(d.x, 0.004, d.z)));
  float f = (1. - exp(-dist/uFogDist)) * uFogAmt;
  col = mix(col, fogc, f);
  o0 = vec4(col*a, a); o1 = vec4(0.);
}`, 'ground');
    this.night = hex('#060926'); this.day = hex('#FBF1DC');
  }
  // g: optional overrides { base:[r,g,b] linear, f0, ripple, fogDist, fogAmt, reflGain, reflBlur }
  draw(cam, sp, refl, reflAux, W, H, dawn, g = {}) {
    const gl = this.gl; const k = Math.min(1, Math.max(0, (dawn - 0.55) / 0.4)); const kk = k * k * (3 - 2 * k);
    const base = g.base || [0, 1, 2].map((i) => this.night[i] + (this.day[i] - this.night[i]) * kk);
    this.prog.use().set({ uInvVP: cam.invViewProj, uCam: cam.pos, ...sp, uRefl: refl, uReflAux: reflAux, uRes: [W, H], uBase: base,
      uF0: g.f0 ?? (0.55 - 0.3 * kk), uBaseCut: g.baseCut ?? (0.5 + 0.1 * kk), uRipple: g.ripple ?? 0.011, uFogDist: g.fogDist ?? 5000, uFogAmt: g.fogAmt ?? 1.0, uReflGain: g.reflGain ?? 0.6,
      uReflBlur: g.reflBlur ?? 2.0, uRough: g.rough ?? 0.3 });
    drawTri(gl);
  }
}
