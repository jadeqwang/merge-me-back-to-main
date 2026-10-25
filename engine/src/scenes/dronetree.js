// DRONE TREE: a tree of life drawn by a drone light show, over a dark city. The tree IS the git graph:
// the trunk is `main`, it forks 10 times (1 -> 1,024 tips). Every branch is a bundle of dotted strands (one strand
// per lineage, bundles halve at each fork, so limbs thin like a real tree); the trunk's strands twist and pour out
// at the base into a swirl on the ground. Tips are warm dots (one of her each), wrapped in a canopy of foliage drones.
// Everything is a pure function of song time t (all randomness is seeded at setup).
//
// shot: {
//   grow?(u,t)     -> 0..1   tree draws itself root -> tips (drones fly into place).       default 1
//   flow?(u,t)     -> signed pulse speed, world units/s (tree is ~10.5 tall). + root->tips (splitting),
//                     - tips->root (merging home). Phase = integral of flow from shot.t0 (fixed step).   default 0
//   flowPhase?(u,t)-> override the integrated phase directly (world units)
//   flash?(u,t)    -> 0..1   flash at the root (glow + nearby strands)                        default 0
//   converge?(u,t) -> 0..1   canopy spirals in to the trunk and down into one bright point     default 0
//   cam?(u,t)      -> { orbit (rad, default .35 + .045 t), height (1.2), dist (28), lookY (6.6), fov (42 deg), lookX (0) }
//   tips = 1 (warm tip-dot gain), laneAmt = .32 (lane tint at the tips), reflect = .09, city = 1, stars = 1,
//   gain = 1, twinkle = 1, pulseGap = 3.2, pulseGain = 1, seed = 7, trunkStrands = 64 (power of 2), foliage = 40 (dots per tip),
//   spacing = .065 (world units between strand dots), lanes = LANES (7 hex colours, indexed by the gen-3 ancestor),
//   text?(ty,t,u), fade?(u,t)
//
//   ---- per-generation growth (the intro: one fork per bar). All optional; without them the shot renders as before.
//   growKey?(u,t)  -> growth in KEY units, overrides grow (key = g + lam along a gen-g segment: trunk 0..1, gen g g..g+1,
//                     foliage/tips 10.4..11.8; everything is drawn at ~12.6). May return { tree, trunk } to give the
//                     pre-front dots (key < frontKey: trunk + root swirl) their own clock.
//   frontKey = 99  dots with key >= frontKey grow as a sharp drawing front (no fly-in), others fly in as drones
//   growSoft = .9  key width of the drawing front; popK = 2.5 / popGain = .8 decay / gain of the bright head behind it
//   segGap = 0     front mode: each segment is drawn in the first (1 - segGap) of its key unit, so a generation is
//                  complete exactly at key g+1 and the next one starts dark (lets a fork land on a bar)
//   gain / popGain / trunkPopGain (= .8, the fly-in landing flare) may be numbers or functions (u,t)
//   trunkSoft = .9   key width of the pre-front fly-in (smaller: the trunk assembles bottom -> top)
//   flyFrom?: [x,y,z], flySpread = 1.2   pre-front drones fly in from this point (a swarm) instead of from below
//   wave?(u,t)     -> { pos (key units), amp, tail = .6 }   a bright wave running through the tree in key space
//                     (pos increasing = root -> tips); its tail trails root-ward
//   cam may also return pos: [x,y,z], look: [x,y,z] (absolute, override orbit/dist/height/lookY/lookX)
// }
import * as THREE from 'three';

export const LANES = ['#FF7A1A', '#FF5FA2', '#6FB6FF', '#4FE3B0', '#FFD23F', '#A57BFF', '#F4F4F8'];
const NG = 10, NT = 1 << NG;
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = (x) => { x = clamp(x); return x * x * (3 - 2 * x); };
const QUAD = new Float32Array([-.5, -.5, 0, .5, -.5, 0, .5, .5, 0, -.5, .5, 0]);

function mulberry(a) { return () => { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);

const VS = /* glsl */`
precision highp float;
in vec3 position;
in vec4 a0;   // x y z key(growth)
in vec4 a1;   // arc rnd kind lane
in vec4 a2;   // strandRnd size bright -
uniform mat4 modelViewMatrix, projectionMatrix;
uniform float uProjScale, uMinPx, uTime, uGrow, uGrow0, uSoft0, uFrontKey, uSoft, uPopK, uPopGain, uPopGain0, uSegGap, uFlyFrom, uFlySpread,
  uWave, uWaveAmp, uWaveW, uPhase, uPulse, uDir, uGap, uFlash, uConv, uMirror, uLaneAmt, uTips,
  uTwinkle, uCity, uStars, uGain, uReflect, uGlow, uGlowSize;
uniform vec3 uLanes[7]; uniform vec3 uFlyPos;
out vec2 vQ; out vec3 vCol; out float vKind;
float h1(float n){ return fract(sin(n * 12.9898) * 43758.5453); }
void cull(){ gl_Position = vec4(2., 2., 2., 1.); vCol = vec3(0.); }
void main(){
  vec3 p = a0.xyz; float key = a0.w, arc = a1.x, rnd = a1.y, kind = a1.z, lane = a1.w, srnd = a2.x, size = a2.y, b = a2.z;
  bool tree = kind < 3.5;
  vKind = kind; vQ = position.xy;
  if (uMirror > .5 && kind > 3.5 && kind < 5.5) { cull(); return; }
  vec3 col = vec3(.5, .82, 1.);
  if (kind > 5.5) {                                   // root glow sprite (flash / converge point)
    if (uGlow < .001) { cull(); return; }
    size = uGlowSize; b = uGlow; col = vec3(1., .86, .66);
  } else if (tree) {
    // ---- growth: drones fly up into position, generation by generation
    bool front = key >= uFrontKey;
    float kk = (front && kind < .5) ? floor(key) + fract(key) * (1. - uSegGap) : key;
    float G = front ? uGrow : uGrow0, soft = front ? uSoft : uSoft0;
    float k = clamp((G - kk) / soft, 0., 1.);
    if (k <= 0.) { cull(); return; }
    float e = 1. - pow(1. - k, 3.);
    if (!front) {
      vec3 fly = vec3(h1(rnd * 91.7) - .5, -.55 - h1(rnd * 37.1), h1(rnd * 53.3) - .5) * vec3(3.2, 3.4, 3.2);
      if (uFlyFrom > .5) {                              // a swarm from one point, curling in
        vec3 s = uFlyPos + (vec3(h1(rnd * 91.7), h1(rnd * 37.1), h1(rnd * 53.3)) - .5) * uFlySpread;
        float ang = (1. - e) * (1.6 + 1.2 * h1(rnd * 7.3)), cs = cos(ang), sn = sin(ang);
        vec3 q = mix(s, p, e) ; vec2 r2 = mat2(cs, sn, -sn, cs) * q.xz; q.xz = mix(q.xz, r2, (1. - e) * .5);
        p = q;
      } else p = mix(p + fly, p, e);
    }
    float pop = smoothstep(.75, 1., k) * exp(-max(0., G - kk - soft) * (front ? uPopK : 2.5));
    b *= mix(.25, 1., k) + (front ? uPopGain : uPopGain0) * pop;
    float wv = 0.;                                     // a wave of light through the tree (key space)
    if (uWaveAmp > 0.) { float dk = uWave - kk; wv = uWaveAmp * (dk >= 0. ? exp(-dk / uWaveW) : exp(dk / .04)); b *= 1. + wv * (kind > 1.5 ? .5 : 1.); }
    // ---- hover jitter + twinkle
    p += .014 * vec3(sin(uTime * (.6 + rnd * .9) + rnd * 61.), sin(uTime * (.5 + srnd * .8) + rnd * 17.), cos(uTime * (.7 + rnd * .6) + rnd * 29.));
    float tw = .74 + .26 * sin(uTime * (1.3 + 4. * rnd) + rnd * 211.);
    if (rnd > .955) tw *= .45 + 2.2 * pow(.5 + .5 * sin(uTime * (2. + 3. * srnd) + rnd * 517.), 10.);
    b *= mix(1., tw, uTwinkle);
    // ---- colour: ice-cyan tree, orange main at the root, faint lane tint at the tips
    if (kind > 1.5 && kind < 2.5) col = mix(vec3(.3, .6, 1.), vec3(.85, .93, 1.), step(.86, rnd));
    vec3 lc = uLanes[int(lane + .5)];
    if (kind < .5) col = mix(col, vec3(1., .5, .16), (1. - smoothstep(.0, .75, key)) * .85);
    if (kind > .5 && kind < 1.5) col = mix(col, vec3(1., .42, .09), (1. - .8 * smoothstep(.1, 1., key)) * .9);
    col = mix(col, lc, uLaneAmt * smoothstep(5., 11., key) * (kind > 1.5 && kind < 2.5 ? .4 : 1.));
    if (kind > 2.5) { col = mix(vec3(1., .8, .58), lc, uLaneAmt * .7); b *= uTips; }
    col = mix(col, vec3(1., .93, .82), clamp(wv * .25, 0., .7));
    // ---- pulses along the strands (periodic train in arc length; strands desync away from the trunk)
    float q = arc + srnd * uGap * .5 * smoothstep(2.5, 9., key) - uPhase;
    float f = fract(q / uGap); float dd = (f < .5 ? f : f - 1.) * uGap; float ah = dd * uDir;
    float pb = (ah > 0. ? exp(-ah / .06) : exp(ah / .55)) * uPulse;
    col = mix(col, vec3(1., .93, .82), clamp(pb, 0., 1.) * .55);
    b *= 1. + pb * (kind > 1.5 && kind < 2.5 ? 2. : kind > 2.5 ? 1.5 : 5.);
    size *= 1. + .5 * pb;
    // ---- flash at the root
    float dr = length(p - vec3(0., .25, 0.));
    b *= 1. + uFlash * (.25 + 3.5 * exp(-dr / 1.4));
    // ---- converge: the canopy spirals in to the trunk, then drains down into the root point
    if (uConv > 0.) {
      float cc = clamp(uConv * 1.7 - (1. - key / 12.) * .7, 0., 1.);
      float e1 = cc * cc * (3. - 2. * cc), ang = e1 * e1 * 2.4, cs = cos(ang), sn = sin(ang);
      vec2 xz = mat2(cs, sn, -sn, cs) * p.xz * (1. - e1);
      p = vec3(xz.x, mix(p.y, .25, smoothstep(.2, 1., cc)), xz.y);
      b *= (1. - smoothstep(.6, .97, cc)) * pow(1. - .93 * e1, 1.6) * (1. + 1.2 * e1 * (1. - e1));
    }
  } else if (kind < 4.5) {                             // city lights
    b *= .7 * uCity * (.8 + .2 * sin(uTime * (.8 + 2. * rnd) + rnd * 300.));
    col = mix(vec3(1., .55, .22), vec3(1., .86, .66), step(.7, srnd));
    if (srnd > .96) col = vec3(.55, .8, 1.);
  } else {                                             // stars
    b *= uStars * (.8 + .2 * sin(uTime * (1. + 2. * rnd) + rnd * 400.));
    col = mix(vec3(.75, .85, 1.), vec3(1., .9, .8), srnd);
  }
  if (uMirror > .5) {                                  // reflection on the dark ground (wet plaza)
    p.x += sin(p.y * 2.3 + uTime * 1.7 + p.z * 1.3) * .05 * min(p.y, 6.);
    b *= uReflect * exp(-p.y * .1); p.y = -p.y;
  }
  vec4 vp = modelViewMatrix * vec4(p, 1.);
  float w = -vp.z; if (w < .05) { cull(); return; }
  float px = size * uProjScale / w, s = max(px, uMinPx);
  b *= (px * px) / (s * s);                            // energy-preserving pixel floor (no shimmer)
  vp.xy += position.xy * 3. * s * w / uProjScale;
  gl_Position = projectionMatrix * vp;
  vCol = col * b * uGain;
}`;

const FS = /* glsl */`
precision highp float;
in vec2 vQ; in vec3 vCol; in float vKind;
out vec4 o;
void main(){
  float r2 = dot(vQ, vQ);
  float a = vKind > 5.5 ? exp(-r2 * 1400.) * 1.6 + (exp(-r2 * 160.) * .35 + exp(-r2 * 26.) * .12) * (1. - smoothstep(.1, .25, r2)) : exp(-r2 * 36.);
  o = vec4(vCol * a, 0.);
}`;

export default class DroneTree {
  constructor(ctx, shot) { this.ctx = ctx; this.shot = shot; }

  async setup() {
    const { ctx, shot } = this;
    const rnd = mulberry(shot.seed ?? 7);
    const S0 = shot.trunkStrands ?? 64;
    const S = (g) => Math.max(1, S0 >> g);                 // strands in a gen-g segment
    const rT = .5;                                          // trunk bundle radius
    const rB = (g) => rT * Math.sqrt(S(g) / S0) * (S(g) === 1 ? .7 : 1);
    // ---------------------------------------------------------------- tips on a dome canopy (recursive split: subtrees are spatially coherent)
    const Rh = 10.2, Rv = 4.3, yc = 6.1, thMax = 1.78, phiRot = rnd() * 6.283;
    const cosMax = Math.cos(thMax);
    const tipUV = new Array(NT);
    const split = (g, i, ph0, ph1, v0, v1) => {
      if (g === NG) { tipUV[i] = [ph0 + (ph1 - ph0) * (.5 + (rnd() - .5) * .6), v0 + (v1 - v0) * (.5 + (rnd() - .5) * .6)]; return; }
      const vm = (v0 + v1) / 2, th = Math.acos(1 - (1 - vm) * (1 - cosMax));
      const dPhi = (ph1 - ph0) * Math.max(.15, Math.sin(th)) * Rh;
      const dV = (v1 - v0) * thMax / Math.max(.1, Math.sin(th) * 1.1) * Rv * .9;
      const k = .5 + (rnd() - .5) * .12;
      if (dPhi >= dV) { const m = ph0 + (ph1 - ph0) * k; split(g + 1, 2 * i, ph0, m, v0, v1); split(g + 1, 2 * i + 1, m, ph1, v0, v1); }
      else { const m = v0 + (v1 - v0) * k; split(g + 1, 2 * i, ph0, ph1, v0, m); split(g + 1, 2 * i + 1, ph0, ph1, m, v1); }
    };
    split(0, 0, 0, Math.PI * 2, 0, 1);
    const tips = tipUV.map(([ph, v]) => {
      const c = 1 - (1 - v) * (1 - cosMax), th = Math.acos(c), a = ph + phiRot;
      const rho = .78 + .22 * Math.sqrt(rnd());           // volume: some tips sit inside the canopy
      const droop = Math.max(0, th - 1.2) * 1.4;           // the rim hangs a little lower
      return V(Math.sin(th) * Math.cos(a) * Rh * rho, yc + Math.cos(th) * Rv * rho - droop, Math.sin(th) * Math.sin(a) * Rh * rho);
    });
    // ---------------------------------------------------------------- nodes: N[g][i]; N[NG] = tips
    const C = [], N = [], Tg = [];
    for (let g = 0; g <= NG; g++) {
      C[g] = []; const sub = 1 << (NG - g);
      for (let i = 0; i < 1 << g; i++) { const c = V(); for (let j = 0; j < sub; j++) c.add(tips[i * sub + j]); C[g][i] = c.divideScalar(sub); }
    }
    const root = V(0, .25, 0);
    const Ht = 3.6;
    N[0] = [V(.15, Ht, -.1)];
    const alpha = (g) => g >= NG ? 1 : [0, .5, .46, .46, .48, .52, .56, .62, .7, .8][g];
    for (let g = 1; g <= NG; g++) {
      N[g] = [];
      for (let i = 0; i < 1 << g; i++) {
        const P = N[g - 1][i >> 1];
        if (g === NG) { N[g][i] = tips[i].clone(); continue; }
        const d = C[g][i].clone().sub(P), L = d.length();
        const n = P.clone().addScaledVector(d, alpha(g));
        const j = V(rnd() - .5, (rnd() - .5) * .6, rnd() - .5).multiplyScalar(L * alpha(g) * .32);
        N[g][i] = n.add(j);
      }
    }
    // tangents at nodes: average of incoming and outgoing directions
    const nodeT = (g, i) => {
      const P = g === 0 ? root : N[g - 1][i >> 1], n = N[g][i];
      const din = n.clone().sub(P).normalize();
      if (g === NG) return din;
      const dout = C[g][i].clone().sub(n).normalize();
      return din.add(dout).normalize();
    };
    for (let g = 0; g <= NG; g++) { Tg[g] = []; for (let i = 0; i < 1 << g; i++) Tg[g][i] = nodeT(g, i); }
    const frame = (T) => { const ref = Math.abs(T.z) > .9 ? V(1, 0, 0) : V(0, 0, 1); const e1 = V().crossVectors(T, ref).normalize(); return [e1, V().crossVectors(T, e1).normalize()]; };
    const disc = (k, n) => { if (n <= 1) return [0, 0]; const r = Math.sqrt((k + .5) / n), a = k * 2.39996; return [Math.cos(a) * r, Math.sin(a) * r]; };
    // offset of strand tau at node (g,i) (the fork between gen g and gen g+1); g = -1 is the root
    const nodeOffset = (g, i, tau) => {
      if (g === NG) return V();
      if (g === -1) {
        const k = tau / (NT / S0); const [a, b] = disc(k, S0);
        return V(a, 0, b).multiplyScalar(1.25);
      }
      const T = Tg[g][i], [e1, e2] = frame(T), n = N[g][i];
      const cg = g + 1, sub = 1 << (NG - cg), c = (tau / sub) | 0;
      const child = N[cg][c], side = child.clone().sub(n); side.addScaledVector(T, -side.dot(T));
      if (side.lengthSq() > 1e-8) side.normalize();
      const Sc = S(cg), loc = (tau - c * sub) / (sub / Sc);
      const [a, b] = disc(loc, Sc);
      const r = rB(cg);
      return side.multiplyScalar(r * (Sc > 1 ? .95 : .9)).addScaledVector(e1, a * r).addScaledVector(e2, b * r);
    };
    // ---------------------------------------------------------------- dots
    const data = []; const push = (p, key, arc, r, kind, lane, sr, size, br) => data.push(p.x, p.y, p.z, key, arc, r, kind, lane, sr, size, br, 0);
    const laneOf = (tau) => (tau >> (NG - 3)) % 7;
    const arcN = []; arcN[-1] = 0;
    const strandR = new Float32Array(NT); for (let k = 0; k < NT; k++) strandR[k] = rnd();
    const bez = (P0, P1, P2, P3, t) => { const s = 1 - t; return P0.clone().multiplyScalar(s * s * s).addScaledVector(P1, 3 * s * s * t).addScaledVector(P2, 3 * s * t * t).addScaledVector(P3, t * t * t); };
    const rotAbout = (v, ax, a) => { const c = Math.cos(a), s = Math.sin(a); return v.clone().multiplyScalar(c).add(V().crossVectors(ax, v).multiplyScalar(s)).addScaledVector(ax, ax.dot(v) * (1 - c)); };
    const SP = shot.spacing ?? .065;
    const arcNode = [[0]];
    for (let g = 0; g <= NG; g++) {
      if (g > 0) arcNode[g] = [];
      for (let i = 0; i < 1 << g; i++) {
        const A = g === 0 ? root : N[g - 1][i >> 1], B = N[g][i];
        const TA = g === 0 ? V(0, 1, 0) : Tg[g - 1][i >> 1], TB = Tg[g][i];
        const L = A.distanceTo(B);
        const P1 = A.clone().addScaledVector(TA, L * .38), P2 = B.clone().addScaledVector(TB, -L * .38);
        // center arc length
        let Lc = 0, prev = A; for (let k = 1; k <= 24; k++) { const q = bez(A, P1, P2, B, k / 24); Lc += q.distanceTo(prev); prev = q; }
        const a0 = g === 0 ? 0 : arcNode[g - 1][i >> 1];
        arcNode[g][i] = a0 + Lc;
        const sub = 1 << (NG - g), Sg = S(g);
        const n = Math.max(3, Math.ceil(Lc / (Sg > 1 ? SP : SP * 1.1)));
        const twist = g === 0 ? 1 : 0, wob = (g === 0 ? 0 : .55) * ((i & 1) ? 1 : -1);
        for (let k = 0; k < Sg; k++) {
          const tau = i * sub + k * (sub / Sg);
          const Os = nodeOffset(g - 1, i >> 1, tau), Oe = nodeOffset(g, i, tau);
          const ls = Os.length(), le = Oe.length();
          const sr = strandR[tau];
          for (let j = 0; j < n; j++) {
            const lam = j / n;
            const c = bez(A, P1, P2, B, lam);
            const tc = bez(A, P1, P2, B, Math.min(1, lam + .01)).sub(bez(A, P1, P2, B, Math.max(0, lam - .01))).normalize();
            const m = ss(lam);
            let off = Os.clone().lerp(Oe, m); const ol = off.length();
            let rad = ls + (le - ls) * m;
            if (g === 0) rad *= 1 - .42 * Math.sin(Math.PI * Math.pow(lam, .8)) + .0;
            if (ol > 1e-6) off.multiplyScalar(rad / ol);
            off.addScaledVector(tc, -off.dot(tc));
            const ang = twist * Math.PI * 2 * m + wob * Math.sin(Math.PI * lam);
            off = rotAbout(off, tc, ang);
            const p = c.add(off);
            const r = rnd();
            push(p, g + lam, a0 + lam * Lc, r, 0, laneOf(tau), sr, Sg > 1 ? .04 : .036, (Sg > 1 ? 1.25 / Math.pow(Sg, .62) : .48) * (g === 0 ? 1.9 - .5 * lam : 1) * (.55 + .45 * r));
          }
        }
      }
    }
    // ---------------------------------------------------------------- roots: trunk strands pour out into a swirl on the ground
    for (let k = 0; k < S0; k++) {
      const tau = k * (NT / S0), sr = strandR[tau];
      const O = nodeOffset(-1, 0, tau);
      const r0 = Math.max(.15, O.length()), ph0 = Math.atan2(O.z, O.x);
      const Rend = 2.4 + 3.2 * Math.pow(rnd(), .8), spin = 2.4 + 1.6 * rnd();
      let prev = null, arc = 0, last = -1;
      const n = 260;
      for (let j = 0; j <= n; j++) {
        const s = j / n, r = r0 + (Rend - r0) * Math.pow(s, .85), ph = ph0 + spin * Math.pow(s, .7);
        const p = V(Math.cos(ph) * r, .25 * Math.pow(1 - s, 3) + .03, Math.sin(ph) * r * .92);
        if (prev) arc += p.distanceTo(prev);
        if (last < 0 || arc >= last + SP * 1.15) {
          last = arc;
          push(p, s * 1.05, -arc, rnd(), 1, 0, sr, .036, .3 * (1 - .55 * s));
        }
        prev = p;
      }
    }
    // swirl dust: faint log-spiral arms of drones on the ground
    for (let k = 0; k < 2600; k++) {
      const s = Math.pow(rnd(), .7), arm = (k % 5) / 5 * 6.283;
      const r = .9 + 5.8 * s, ph = arm + 2.6 * Math.log(1 + r) + (rnd() - .5) * .5;
      const p = V(Math.cos(ph) * r, .03 + rnd() * .05, Math.sin(ph) * r * .92);
      push(p, .2 + s * .9, -(r * 2.2), rnd(), 1, 0, rnd(), .034, .12 * (1 - .6 * s));
    }
    // ---------------------------------------------------------------- tips (one of her) + foliage drones
    const nF = shot.foliage ?? 40;
    for (let tau = 0; tau < NT; tau++) {
      const tp = N[NG][tau], T = Tg[NG][tau], a = arcNode[NG][tau], lane = laneOf(tau), sr = strandR[tau];
      push(tp, 11, a, rnd(), 3, lane, sr, .085, .9);
      // sprigs
      const ns = 3;
      for (let s = 0; s < ns; s++) {
        const d = T.clone().add(V(rnd() - .5, rnd() - .5, rnd() - .5).multiplyScalar(1.6)).normalize();
        const len = .22 + .3 * rnd(), m = Math.round(len / .05);
        for (let j = 1; j <= m; j++) { const p = tp.clone().addScaledVector(d, len * j / m); p.y -= .04 * j * j / (m * m); push(p, 10.6 + .4 * j / m, a + len * j / m, rnd(), 2, lane, sr, .03, .16); }
      }
      // cloud
      const ctr = tp.clone().addScaledVector(T, .12);
      for (let j = 0; j < nF; j++) {
        // gaussian-ish via sum of uniforms
        const g3 = () => (rnd() + rnd() + rnd() - 1.5) * 1.15;
        const o = V(g3(), g3() * .7, g3()).multiplyScalar(.36);
        const p = ctr.clone().add(o);
        push(p, 10.4 + rnd() * 1.4, a + o.length() * 1.5, rnd(), 2, lane, sr, .026 + .01 * rnd(), .07 + .3 * Math.pow(rnd(), 4));
      }
    }
    this.nTree = data.length / 12;
    // ---------------------------------------------------------------- city lights (warm, far, sparse, on street lines)
    const ncity = 7000;
    for (let k = 0; k < ncity; k++) {
      const r = 34 + 260 * Math.pow(rnd(), 1.6), ph = rnd() * 6.283;
      let x = Math.cos(ph) * r, z = Math.sin(ph) * r;
      if (rnd() < .5) x = Math.round(x / 7) * 7 + (rnd() - .5) * .4; else z = Math.round(z / 7) * 7 + (rnd() - .5) * .4;
      const br = .25 + 1.2 * Math.pow(rnd(), 6);
      push(V(x, .05 + (rnd() < .06 ? rnd() * 3 : 0), z), 0, 0, rnd(), 4, 0, rnd(), .09, br);
    }
    // ---------------------------------------------------------------- stars
    for (let k = 0; k < 2600; k++) {
      const z = .04 + .96 * Math.pow(rnd(), .8), ph = rnd() * 6.283, rr = Math.sqrt(1 - z * z);
      push(V(Math.cos(ph) * rr * 600, z * 600, Math.sin(ph) * rr * 600), 0, 0, rnd(), 5, 0, rnd(), .7, .1 + .9 * Math.pow(rnd(), 5));
    }
    // root glow sprite
    push(root, 0, 0, .5, 6, 0, 0, 1, 1);
    const arr = new Float32Array(data);
    this.count = arr.length / 12;
    const geo = new THREE.InstancedBufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(QUAD, 3));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    const ib = new THREE.InstancedInterleavedBuffer(arr, 12);
    geo.setAttribute('a0', new THREE.InterleavedBufferAttribute(ib, 4, 0));
    geo.setAttribute('a1', new THREE.InterleavedBufferAttribute(ib, 4, 4));
    geo.setAttribute('a2', new THREE.InterleavedBufferAttribute(ib, 4, 8));
    geo.instanceCount = this.count;
    this.geo = geo;
    const lanes = (shot.lanes || LANES).map((c) => new THREE.Color(c));
    const U = this.U = {
      uProjScale: { value: 1 }, uMinPx: { value: 1.25 * ctx.H / 1080 }, uTime: { value: 0 }, uGrow: { value: 99 }, uGrow0: { value: 99 }, uSoft0: { value: shot.trunkSoft ?? .9 },
      uFrontKey: { value: shot.frontKey ?? 99 }, uSoft: { value: shot.growSoft ?? .9 }, uPopK: { value: shot.popK ?? 2.5 }, uPopGain: { value: .8 }, uPopGain0: { value: .8 },
      uSegGap: { value: shot.segGap ?? 0 }, uFlyFrom: { value: shot.flyFrom ? 1 : 0 }, uFlyPos: { value: new THREE.Vector3(...(shot.flyFrom || [0, 0, 0])) },
      uFlySpread: { value: shot.flySpread ?? 1.2 }, uWave: { value: 0 }, uWaveAmp: { value: 0 }, uWaveW: { value: .6 }, uPhase: { value: 0 }, uPulse: { value: 0 },
      uDir: { value: 1 }, uGap: { value: shot.pulseGap ?? 3.2 }, uFlash: { value: 0 }, uConv: { value: 0 }, uMirror: { value: 0 }, uLaneAmt: { value: shot.laneAmt ?? .32 },
      uTips: { value: (shot.tips ?? 1) * .6 }, uTwinkle: { value: shot.twinkle ?? 1 }, uCity: { value: shot.city ?? 1 }, uStars: { value: shot.stars ?? 1 }, uGain: { value: 1.2 },
      uReflect: { value: shot.reflect ?? .09 }, uGlow: { value: 0 }, uGlowSize: { value: 1 }, uLanes: { value: lanes },
    };
    const mk = (u) => new THREE.RawShaderMaterial({
      glslVersion: THREE.GLSL3, vertexShader: VS, fragmentShader: FS, uniforms: u, transparent: true, depthTest: false, depthWrite: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneFactor,
    });
    this.mat = mk(U); this.matM = mk({ ...U, uMirror: { value: 1 } });
    this.mesh = new THREE.Mesh(geo, this.mat); this.mesh.frustumCulled = false;
    this.mirror = new THREE.Mesh(geo, this.matM); this.mirror.frustumCulled = false;
    this.scene = new THREE.Scene(); this.scene.add(this.mirror, this.mesh);
    this.cam = new THREE.PerspectiveCamera(40, ctx.W / ctx.H, .05, 2000);
    this.acc = new THREE.WebGLRenderTarget(ctx.W, ctx.H, { type: THREE.HalfFloatType, depthBuffer: false });
  }

  phase(t) {
    const { shot } = this, dur = shot.t1 - shot.t0, uo = (x) => (x - shot.t0) / dur;
    if (shot.flowPhase) return shot.flowPhase(uo(t), t);
    if (!shot.flow) return 0;
    const n = Math.max(1, Math.ceil(Math.abs(t - shot.t0) * 60)), dt = (t - shot.t0) / n;
    let P = 0; for (let k = 0; k < n; k++) { const tm = shot.t0 + (k + .5) * dt; P += shot.flow(uo(tm), tm) * dt; }
    return P;
  }

  async render(t, u) {
    const { ctx, shot, U } = this, r = ctx.renderer;
    const c = { orbit: .35 + .045 * t, height: 1.2, dist: 28, lookY: 6.6, fov: 42, lookX: 0, ...(shot.cam ? shot.cam(u, t) : {}) };
    this.cam.fov = c.fov; this.cam.updateProjectionMatrix();
    if (c.pos) this.cam.position.set(...c.pos); else this.cam.position.set(Math.sin(c.orbit) * c.dist, c.height, Math.cos(c.orbit) * c.dist);
    this.cam.up.set(0, 1, 0); if (c.look) this.cam.lookAt(...c.look); else this.cam.lookAt(c.lookX, c.lookY, 0); this.cam.updateMatrixWorld();
    U.uProjScale.value = ctx.H / (2 * Math.tan(THREE.MathUtils.degToRad(c.fov) / 2));
    U.uTime.value = t;
    if (shot.growKey) { const gk = shot.growKey(u, t); U.uGrow.value = typeof gk === 'number' ? gk : gk.tree; U.uGrow0.value = typeof gk === 'number' ? gk : (gk.trunk ?? gk.tree); }
    else U.uGrow.value = U.uGrow0.value = (shot.grow ? clamp(shot.grow(u, t)) : 1) * 12.6;
    const fv = (x, d) => (typeof x === 'function' ? x(u, t) : (x ?? d));
    U.uGain.value = 1.2 * fv(shot.gain, 1); U.uPopGain.value = fv(shot.popGain, .8); U.uPopGain0.value = fv(shot.trunkPopGain, .8);
    const wv = shot.wave ? shot.wave(u, t) : null;
    U.uWave.value = wv?.pos ?? 0; U.uWaveAmp.value = wv?.amp ?? 0; U.uWaveW.value = wv?.tail ?? .6;
    const fl = shot.flow ? shot.flow(u, t) : 0;
    U.uPhase.value = this.phase(t);
    U.uDir.value = fl >= 0 ? 1 : -1;
    U.uPulse.value = clamp(Math.abs(fl) / 1.5) * (shot.pulseGain ?? 1);
    const fla = shot.flash ? clamp(shot.flash(u, t), 0, 4) : 0, cv = shot.converge ? clamp(shot.converge(u, t)) : 0;
    U.uFlash.value = fla; U.uConv.value = cv;
    U.uGlow.value = 1.3 * Math.min(1.5, fla) + 1.4 * ss((cv - .35) / .65);
    U.uGlowSize.value = 1.4 + 1.6 * Math.min(1, fla) + 1.2 * ss((cv - .5) / .5);
    r.setRenderTarget(this.acc); r.setClearColor(0, 0); r.clear(); r.render(this.scene, this.cam); r.setRenderTarget(null);
    let typeTex = null;
    if (shot.text) { ctx.type.begin(); shot.text(ctx.type, t, u); ctx.type.end(); typeTex = ctx.type.tex; }
    ctx.post.resolve.uniforms.uFade.value = shot.fade ? shot.fade(u, t) : 1;
    ctx.post.render(this.acc.texture, t, typeTex);
  }

  dispose() { this.geo.dispose(); this.mat.dispose(); this.matM.dispose(); this.acc.dispose(); }
}
