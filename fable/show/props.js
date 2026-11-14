// PROPS: what the lives hold, drawn in the roads' own vocabulary: thin strokes and dots of light in the lane colour (additive at night, ink by day),
// with their reflection in the mirror, hidden behind her where she stands in front of them. Nothing here is a model: a piano is a bench, a keybed and its keys.
//   const P = makeProps(K);                         once
//   const b = P.begin();                            per frame(t): a fresh stroke list
//   P.piano(b, { pos, yaw, color, track, time });   add one prop, placed in its performer's track space (pos/yaw/scale = the cast instance's; time = her track time)
//   extra.push(P.drawable(b, { gain }));            ONE drawable per frame(t)
// Props that are held (violin + bow, guitar, pen) or pointed at (the orrery) follow her joints (cast.root(track, time, joint)); play her with `vary: 0`.
// Positions come from the life tracks' meta (CHOREO §A): piano bench 0.47 m, keys y 0.74 z 0.38; notebook on the left knee (0.23, 0.20, 0.40);
// guitar neck hand (0.43, 1.19, 0.17), strumming hand (-0.07, 0.99, 0.235); wind from +Z; home points along sky_dir. Track space: she faces +Z, her left is +X.
import { Program, FS_HEAD } from '../engine/src/glx.js';

const VS = `#version 300 es
layout(location=0) in vec4 iA; layout(location=1) in vec4 iB; layout(location=2) in vec4 iC;      // A xyz + half width m (negative = round caps) | B xyz + gain at B | rgb + gain at A
uniform mat4 uVP; uniform vec2 uRes; uniform float uProjK, uMinPx, uHaloPx, uNear;
out vec2 vP; out float vL, vR, vE, vRound; out vec3 vCol; out vec2 vG;
void main(){
  vec2 c = vec2(float(gl_VertexID&1), float((gl_VertexID>>1)&1));
  vec4 a = uVP*vec4(iA.xyz, 1.), b = uVP*vec4(iB.xyz, 1.);
  if (a.w < uNear && b.w < uNear) { gl_Position = vec4(2., 2., 2., 1.); return; }
  if (a.w < uNear) a = mix(a, b, (uNear - a.w)/(b.w - a.w)); else if (b.w < uNear) b = mix(b, a, (uNear - b.w)/(a.w - b.w));
  vec2 sa = a.xy/a.w*0.5*uRes, sb = b.xy/b.w*0.5*uRes; vec2 d = sb - sa; float L = length(d); vec2 u = L > 1e-4 ? d/L : vec2(1., 0.); vec2 n = vec2(-u.y, u.x);
  vec4 q = mix(a, b, c.x); float tru = abs(iA.w)*uProjK/max(q.w, 1e-3); float r = max(tru, uMinPx*0.5);
  vRound = iA.w < 0. ? 1. : 0.; float ext = r + uHaloPx + 1.5, ex = vRound > 0.5 ? ext : 0.6;
  vec2 p = mix(sa, sb, c.x) + u*(c.x*2. - 1.)*ex + n*(c.y*2. - 1.)*ext;
  vP = vec2(c.x*L + (c.x*2. - 1.)*ex, (c.y*2. - 1.)*ext); vL = L; vR = r; vE = min(1., tru/(uMinPx*0.5)); vCol = iC.rgb; vG = vec2(iC.a, iB.w);
  gl_Position = vec4(p*2./uRes, q.z/q.w, 1.);                         // divided here, so the varyings are linear on screen
}`;
const FS = FS_HEAD + `
in vec2 vP; in float vL, vR, vE, vRound; in vec3 vCol; in vec2 vG; uniform float uGain, uHalo, uHaloPx, uInk; out vec4 o;
void main(){
  float x = clamp(vP.x, 0., vL); float d = vRound > 0.5 ? length(vec2(vP.x - x, vP.y)) : abs(vP.y);
  float core = smoothstep(vR + 0.75, vR - 0.75, d); float hq = d/(vR + uHaloPx*0.45); float halo = exp(-hq*hq)*uHalo;
  float g = mix(vG.x, vG.y, vL > 1e-3 ? x/vL : 0.);
  float an = (core + halo*(1. - core))*vE*g; float l = dot(vCol, vec3(0.2126, 0.7152, 0.0722)); vec3 ink = mix(vec3(l), vCol, 1.25)*0.6;
  o = vec4(vCol*uGain*an*(1. - uInk) + ink*core*min(g, 1.)*uInk, core*min(g, 1.)*uInk);
}`;

const MAXS0 = 6000;
const add = (a, b) => [a[0] + b[0], a[1] + b[1], a[2] + b[2]], sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mul = (a, s) => [a[0] * s, a[1] * s, a[2] * s];
const dot3 = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => { const l = Math.hypot(a[0], a[1], a[2]) || 1; return [a[0] / l, a[1] / l, a[2] / l]; }, len3 = (a) => Math.hypot(a[0], a[1], a[2]);
const mix3 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
const sm = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
const hash = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 0.5) * 43758.5453; return x - Math.floor(x); };
// closed/open Catmull-Rom through 3D points
const smooth3 = (pts, sub = 5, closed = false) => { const n = pts.length, P = (i) => (closed ? pts[((i % n) + n) % n] : pts[Math.min(n - 1, Math.max(0, i))]), out = []; const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2); for (let k = 0; k < sub; k++) { const u = k / sub, u2 = u * u, u3 = u2 * u;
    out.push([0, 1, 2].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3))); } }
  if (!closed) out.push(pts[n - 1]); return out; };

export function makeProps(K, opt = {}) {
  const MAXS = opt.max ?? MAXS0;                                              // take two: the orchestra asks for more strokes; everyone else gets 6000 as before
  const E = K.E, gl = E.gl, cast = K.cast; const prog = new Program(gl, VS, FS, 'props.lines');
  const vao = gl.createVertexArray(), buf = gl.createBuffer(); gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferData(gl.ARRAY_BUFFER, MAXS * 48, gl.DYNAMIC_DRAW);
  for (const [loc, off] of [[0, 0], [1, 16], [2, 32]]) { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 4, gl.FLOAT, false, 48, off); gl.vertexAttribDivisor(loc, 1); } gl.bindVertexArray(null);
  let owner = null;
  const begin = () => ({ d: new Float32Array(MAXS * 12), n: 0 });
  // strokes. p, q world points; c linear rgb; w half width in metres; ga, gb gain at each end
  const seg = (b, p, q, c, w, ga = 1, gb = ga, round = false) => { if (b.n >= MAXS) return; const o = b.n++ * 12, d = b.d; d[o] = p[0]; d[o + 1] = p[1]; d[o + 2] = p[2]; d[o + 3] = round ? -w : w; d[o + 4] = q[0]; d[o + 5] = q[1]; d[o + 6] = q[2]; d[o + 7] = gb; d[o + 8] = c[0]; d[o + 9] = c[1]; d[o + 10] = c[2]; d[o + 11] = ga; };
  const poly = (b, pts, c, w, g = 1, closed = false) => { for (let i = 0; i + 1 < pts.length; i++) seg(b, pts[i], pts[i + 1], c, w, g, g); if (closed && pts.length > 2) seg(b, pts[pts.length - 1], pts[0], c, w, g, g); };
  const dot = (b, p, c, r, g = 1) => seg(b, p, p, c, r, g, g, true);
  function drawable(b, o = {}) { const data = b.d.subarray(0, b.n * 12), n = b.n, token = {};
    return { passes: ['add'], reflect: o.reflect !== false, draw(ctx) { if (!n) return; gl.bindVertexArray(vao);
      if (owner !== token) { gl.bindBuffer(gl.ARRAY_BUFFER, buf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, data); owner = token; }
      const ink = Math.min(1, Math.max(0, (ctx.dawn - 0.72) / 0.2)); if (ink > 0) gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      prog.use().set({ uVP: ctx.viewProj, uRes: [ctx.W, ctx.H], uProjK: ctx.H / (2 * Math.tan(ctx.fovY / 2)), uMinPx: (o.minPx ?? 1.5) * ctx.H / 1080, uHaloPx: (o.haloPx ?? 5) * ctx.H / 1080, uHalo: o.halo ?? 0.2, uNear: Math.max(0.05, ctx.near || 0.1), uInk: ink,
        uGain: (o.gain ?? 1) * (ctx.reflect ? (o.reflGain ?? 0.55) : 1) });
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, n); gl.bindVertexArray(null); } }; }

  // ---- placing: track space -> world for a cast instance { pos, yaw, scale }
  const placer = (o) => { const c = Math.cos(o.yaw || 0), s = Math.sin(o.yaw || 0), k = o.scale ?? 1, p = o.pos || [0, 0, 0]; return (v) => [p[0] + (v[0] * c + v[2] * s) * k, p[1] + v[1] * k, p[2] + (-v[0] * s + v[2] * c) * k]; };
  const J = (o, j) => cast.root(o.track, o.time, j);                         // a joint of her performance, track space
  const JN = { hips: 0, spine: 1, chest: 2, neck: 3, head: 4, clavL: 5, upArmL: 6, foreArmL: 7, handL: 8, clavR: 9, upArmR: 10, foreArmR: 11, handR: 12 };
  const tint = (o, w = 0.3) => { const c = o.color || [1, 0.5, 0.1]; return [c[0] + (1 - c[0]) * w, c[1] + (1 - c[1]) * w, c[2] + (1 - c[2]) * w]; };
  const G0 = 1.6;                                                             // base HDR gain of a stroke

  // ---- jade/piano: the bench she climbed onto, the keybed, 52 white keys and their blacks; the keys under her hands light as she plays
  function piano(b, o) { const M = placer(o), c = tint(o), g = (o.gain ?? 1) * G0; const L = (p, q, w, k) => seg(b, M(p), M(q), c, w, g * k);
    const bx = 0.43, bz0 = -0.20, bz1 = 0.17, by = 0.47;                      // bench: seat + four legs + a stretcher
    poly(b, [[-bx, by, bz0], [bx, by, bz0], [bx, by, bz1], [-bx, by, bz1]].map(M), c, 0.006, g * 0.9, true);
    for (const x of [-bx + 0.04, bx - 0.04]) { for (const z of [bz0 + 0.03, bz1 - 0.03]) L([x, by, z], [x, 0, z], 0.005, 0.55); L([x, 0.16, bz0 + 0.03], [x, 0.16, bz1 - 0.03], 0.003, 0.35); }
    const ky = 0.725, z0 = 0.285, z1 = 0.44, hw = 0.615, kw = (2 * hw) / 52;  // keybed (hands at y 0.76, z 0.36)
    poly(b, [[-hw, ky, z0], [hw, ky, z0], [hw, ky, z1], [-hw, ky, z1]].map(M), c, 0.006, g * 1.2, true);
    const hl = o.track ? J(o, JN.handL) : null, hr = o.track ? J(o, JN.handR) : null;
    const press = (x) => { if (!hl) return 0; let v = 0; for (const h of [hl, hr]) { const q = (x - h[0]) / 0.045; v += Math.exp(-q * q) * sm((0.83 - h[1]) / 0.09); } return v; };
    for (let i = 1; i < 52; i++) { const x = -hw + i * kw, p = press(x); L([x, ky, z0], [x, ky, z1], 0.0022, 0.6 + 1.8 * p);
      const note = (i - 1) % 7; if (note === 0 || note === 2 || note === 3 || note === 5 || note === 6) L([x, ky + 0.012, z0 + 0.062], [x, ky + 0.012, z1], 0.0052, 0.85 + 1.2 * p); }
    L([-hw, ky + 0.07, z1 + 0.012], [hw, ky + 0.07, z1 + 0.012], 0.004, 0.7);                                                    // fallboard
    for (const s of [-1, 1]) { const x = s * (hw + 0.045); L([x, ky - 0.03, z0 + 0.02], [x, 0, z0 + 0.02], 0.006, 0.6);            // it stands on the mirror: two legs, two cheeks
      poly(b, [[x, ky - 0.03, z0 - 0.005], [x, ky + 0.07, z0 - 0.005], [x, ky + 0.07, z1 + 0.012], [x, ky - 0.03, z1 + 0.012]].map(M), c, 0.004, g * 0.7, true); }
    L([-hw - 0.045, ky - 0.03, z0 - 0.005], [hw + 0.045, ky - 0.03, z0 - 0.005], 0.004, 0.7);                                    // key slip
  }

  // ---- jade/violin: violin under the chin, scroll in the left hand; the bow in the right hand crosses the strings and slides as she bows
  const VIOLIN = [[0, 0.03], [0.02, 0.16], [0.10, 0.27], [0.22, 0.29], [0.33, 0.25], [0.42, 0.172], [0.50, 0.155], [0.58, 0.172], [0.68, 0.222], [0.80, 0.236], [0.90, 0.2], [0.97, 0.115], [1.0, 0.045]];
  function violin(b, o) { const M = placer(o), c = tint(o), g = (o.gain ?? 1) * G0; const neck = J(o, JN.neck), head = J(o, JN.head), hl = J(o, JN.handL), el = J(o, JN.foreArmL), hr = J(o, JN.handR), er = J(o, JN.foreArmR);
    const left = norm(sub(J(o, JN.upArmL), J(o, JN.upArmR))), up = [0, 1, 0], front = norm(cross(left, up));
    const C = add(mix3(neck, head, 0.3), add(mul(left, 0.075), mul(front, 0.055)));                      // the chin rest, on her left collarbone
    const H = add(hl, mul(norm(sub(hl, el)), 0.05)); const A = norm(sub(H, C)), Lv = Math.max(0.5, len3(sub(H, C)) + 0.06), bl = 0.6 * Lv;
    const S = norm(cross(norm(add(up, mul(left, -0.45))), A)), N = norm(cross(A, S));                     // across the body; its top faces up and a little to her right
    const at = (u, v, h = 0) => M(add(C, add(mul(A, u), add(mul(S, v), mul(N, h)))));
    const half = VIOLIN.map(([u, v]) => [u * bl, v * bl]); const ring = [...half.map(([u, v]) => at(u, v)), ...half.slice().reverse().map(([u, v]) => at(u, -v))];
    poly(b, smooth3(ring, 3, true), c, 0.0035, g * 1.0, true);
    for (const s of [-1, 1]) seg(b, at(bl, s * 0.014), at(Lv - 0.05, s * 0.011), c, 0.003, g * 0.9);    // neck
    poly(b, smooth3([at(Lv - 0.05, 0.011), at(Lv - 0.01, 0.02, -0.012), at(Lv + 0.012, 0, -0.03), at(Lv - 0.012, -0.012, -0.036), at(Lv - 0.02, 0, -0.02)], 4), c, 0.003, g * 0.9);   // scroll
    for (const s of [-1, 1]) seg(b, at(0.07 * bl, s * 0.006, 0.012), at(Lv - 0.05, s * 0.005, 0.012), c, 0.0012, g * 0.55);   // strings
    seg(b, at(0.36 * bl, -0.03, 0.02), at(0.36 * bl, 0.03, 0.02), c, 0.002, g * 0.8);                    // bridge
    const Pc = add(C, add(mul(A, 0.47 * bl), mul(N, 0.03))), Hr = add(hr, mul(norm(sub(hr, er)), 0.07)); const toC = sub(Pc, Hr), dC = len3(toC);
    const Sd = dot3(S, toC) >= 0 ? S : mul(S, -1), D = norm(add(mul(norm(toC), sm(dC / 0.16)), mul(Sd, 0.35)));
    seg(b, M(add(Hr, mul(D, -0.04))), M(add(Hr, mul(D, 0.7))), [1, 0.96, 0.9], 0.0026, g * 1.2); seg(b, M(add(add(Hr, mul(D, -0.02)), mul(N, -0.012))), M(add(add(Hr, mul(D, 0.69)), mul(N, -0.004))), c, 0.0012, g * 0.6);   // bow: stick + hair
  }

  // ---- jade/poet: an open notebook on her left knee; the line she is writing grows under the pen
  function notebook(b, o) { const M = placer(o), c = tint(o), g = (o.gain ?? 1) * G0; const hr = o.track ? J(o, JN.handR) : [0.2, 0.32, 0.37], er = o.track ? J(o, JN.foreArmR) : [0.1, 0.5, 0.3];
    const O = [0.235, 0.225, 0.395], n = norm([0, 0.9, -0.45]), ax = [1, 0, 0], ay = norm([0, 0.45, 0.9]);               // centre, facing up and toward her; ay = up the page (away from her)
    const at = (x, y, h = 0) => M(add(O, add(mul(ax, x), add(mul(ay, y), mul(n, h + 0.016 * Math.abs(x) / 0.15)))));       // a shallow V at the spine
    const pw = 0.15, ph = 0.105;
    for (const s of [-1, 1]) poly(b, [at(0, -ph), at(s * pw, -ph), at(s * pw, ph), at(0, ph)], c, 0.003, g * 1.0);
    seg(b, at(0, -ph), at(0, ph), c, 0.0035, g * 1.1);
    const tt = o.time ?? 0, cur = Math.floor(tt / 1.4), fr = (tt / 1.4) % 1;                                              // a new line every 1.4 s
    for (let k = 0; k < 6; k++) { const y = ph - 0.028 - k * 0.03; seg(b, at(0.022, y), at(0.022 + 0.105 * (0.55 + 0.45 * hash(k, 3)), y), c, 0.0013, g * 0.5);        // the left page is full
      const w = k < cur % 6 ? 0.6 + 0.4 * hash(k, cur) : k === cur % 6 ? fr * 0.9 : 0; if (w > 0.02) seg(b, at(-0.128, y), at(-0.128 + 0.105 * w, y), c, 0.0013, g * (k === cur % 6 ? 1.3 : 0.5)); }
    const tip = add(hr, mul(norm(sub(hr, er)), 0.085)); seg(b, M(add(tip, [0, 0.085, -0.02])), M(add(tip, [0.005, -0.035, 0.02])), [1, 0.96, 0.9], 0.0028, g * 1.1);    // pen
  }

  // ---- jade/nasa-ames: the wind of the giant tunnel. Streamlines come from +Z, part round her and close behind her
  function wind(b, o) { const M = placer(o), c = tint(o, 0.45), g = (o.gain ?? 1) * G0, t = o.clock ?? o.time ?? 0, R = 0.36, n = o.n ?? 44, span = 15;
    for (let i = 0; i < n; i++) { const psi = (hash(i, 1) * 2 - 1) * 2.4, y = 0.1 + 1.52 * Math.pow(hash(i, 2), 0.8), v = 9 + 7 * hash(i, 3), ln = 0.7 + 1.5 * hash(i, 4), z0 = span / 2 - ((t * v + hash(i, 5) * span) % span);
      const body = y < 1.72 ? 1 : 0; const pts = [], N = 7;
      for (let k = 0; k <= N; k++) { const z = z0 + (ln * k) / N; let x = Math.abs(psi) < 1e-3 ? 1e-3 : psi; if (body) { let xx = Math.sign(x) * Math.max(Math.abs(x), R * 1.02); for (let it = 0; it < 4; it++) { const r2 = xx * xx + z * z; xx = x / Math.max(0.12, 1 - (R * R) / Math.max(r2, R * R * 1.0001)); } x = xx; }
        pts.push([x, y + 0.03 * Math.sin(z * 0.9 + i), z]); }
      const edge = sm((span / 2 - Math.abs(z0 + ln / 2)) / 2.5), a = edge * (0.35 + 0.65 * hash(i, 6));
      // r4 Y (NOTES_v4 Y6), optional: o.headClear = [y0, y1, z0, z1] (her frame, metres): a streamline at head height breaks as it passes her head, so no
      // streak is drawn across her face (the lines are light: they show through her). Default: none, as before.
      const hc = o.headClear, inB = hc && y > hc[0] && y < hc[1], hk = (z) => (inB ? 1 - sm((z - hc[2] + 0.25) / 0.25) * (1 - sm((z - hc[3]) / 0.25)) : 1);
      for (let k = 0; k < N; k++) seg(b, M(pts[k]), M(pts[k + 1]), c, 0.0035 + 0.003 * hash(i, 7), g * a * (1 - k / N) * hk(pts[k][2]), g * a * (1 - (k + 1) / N) * hk(pts[k + 1][2])); }
  }

  // ---- jade/robot-ninja-apocalypse: three chords and a van. The neck lies in her left hand, the sound hole under her strumming hand
  const GUITAR = [[-0.27, 0.0], [-0.255, 0.1], [-0.2, 0.168], [-0.11, 0.188], [-0.03, 0.162], [0.04, 0.122], [0.1, 0.134], [0.16, 0.128], [0.2, 0.08], [0.212, 0.028]];
  function guitar(b, o) { const M = placer(o), c = tint(o), g = (o.gain ?? 1) * G0; const hips = J(o, JN.hips), hl = J(o, JN.handL);
    const C = add(hips, [-0.115, 0.005, 0.2]), A = norm(sub(hl, C)), V = norm(cross([0, 0.25, 1], A)), N = norm(cross(A, V)); const at = (u, v, h = 0) => M(add(C, add(mul(A, u), add(mul(V, v), mul(N, h)))));
    poly(b, smooth3([...GUITAR.map(([u, v]) => at(u, v)), ...GUITAR.slice().reverse().map(([u, v]) => at(u, -v))], 3, true), c, 0.004, g * 1.0, true);
    const hole = []; for (let k = 0; k < 20; k++) { const a = (k / 20) * 6.2832; hole.push(at(0.05 + 0.046 * Math.cos(a), 0.046 * Math.sin(a), 0.004)); } poly(b, hole, c, 0.0022, g * 0.7, true);
    const nut = 0.66; for (const s of [-1, 1]) seg(b, at(0.212, s * 0.027, 0.01), at(nut, s * 0.021, 0.01), c, 0.003, g * 0.9);
    poly(b, [at(nut, 0.021, 0.01), at(nut + 0.03, 0.036, 0.0), at(nut + 0.13, 0.03, -0.012), at(nut + 0.13, -0.03, -0.012), at(nut + 0.03, -0.036, 0.0), at(nut, -0.021, 0.01)], c, 0.003, g * 0.9);
    for (const k of [1, 3, 5, 7, 9, 12]) { const u = nut - 0.8 * (1 - Math.pow(2, -k / 12)); if (u > 0.23) seg(b, at(u, 0.024, 0.012), at(u, -0.024, 0.012), c, 0.0012, g * 0.5); }
    const strum = Math.exp(-(((o.time ?? 0) * (138 / 60)) % 1) * 5);                                           // the strings ring on the beat she strums
    for (const s of [-1, 0, 1]) seg(b, at(-0.13, s * 0.016, 0.014), at(nut, s * 0.012, 0.014), [1, 0.96, 0.9], 0.0011, g * (0.5 + 1.1 * strum));
    seg(b, at(-0.13, 0.04, 0.012), at(-0.13, -0.04, 0.012), c, 0.0026, g * 0.8);                               // bridge
  }

  // ---- jade/sandstorm: the live demo worked. A cone of stage light from the rig, and the mic stand she stepped back from
  function stage(b, o) { const M = placer(o), c = tint(o, 0.4), g = (o.gain ?? 1) * G0; const apex = [1.3, 3.9, 0.9], ctr = [0, 0, 0.1], rad = 1.5, n = 56, ring = [];      // the lamp hangs ahead of her, to her left
    for (let k = 0; k < n; k++) { const a = (k / n) * 6.2832; ring.push([ctr[0] + rad * Math.cos(a), 0.012, ctr[2] + rad * Math.sin(a)]); }
    poly(b, ring.map(M), c, 0.006, g * 0.8, true);
    for (let k = 0; k < 12; k++) { const p = ring[Math.floor((k / 12) * n)]; seg(b, M(mix3(apex, p, 0.06)), M(p), c, 0.003, g * 0.16, g * 0.05); }
    dot(b, M(apex), [1, 0.96, 0.9], 0.05, g * 1.2);
    const m = [0.2, 0, 0.72], top = [m[0], 1.33, m[2]], cap = [m[0] - 0.045, 1.47, m[2] - 0.11];
    seg(b, M(m), M(top), c, 0.007, g * 1.0); for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.5; seg(b, M([m[0], 0.11, m[2]]), M([m[0] + 0.24 * Math.cos(a), 0.012, m[2] + 0.24 * Math.sin(a)]), c, 0.005, g * 0.8); }
    seg(b, M(top), M(cap), c, 0.011, g * 1.2); dot(b, M(add(cap, [-0.012, 0.03, -0.028])), [1, 0.96, 0.9], 0.03, g * 0.9);
  }

  // ---- jade/home: the Copernican model at 10:30 pm. A sun and two planets where she points; the outer one rides her fingertip as she traces its orbit
  const orr = new Map();
  function orreryOf(track, D = 1.2) { const key = track + '@' + D; let q = orr.get(key); if (q) return q; const S = [0, 0, 0], n = 60, t0 = 0.9, T = 2.5; let cn = [0, 0, 0];      // D (opts.reach): metres from her shoulder to the model
    for (let k = 0; k < n; k++) { const s = cast.root(track, t0 + (k / n) * T, JN.upArmR); S[0] += s[0] / n; S[1] += s[1] / n; S[2] += s[2] / n; }
    const P = (tt) => add(S, mul(norm(sub(cast.root(track, tt, JN.handR), cast.root(track, tt, JN.upArmR))), D));
    for (let k = 0; k < n; k++) cn = add(cn, mul(P(t0 + (k / n) * T), 1 / n));
    const axis = norm(sub(cn, S)), u = norm(cross(axis, [0, 1, 0])), v = norm(cross(u, axis)); let r = 0; for (let k = 0; k < n; k++) r += len3(sub(P(t0 + (k / n) * T), cn)) / n;
    const ang = (tt) => { const d = sub(P(tt), cn); return Math.atan2(dot3(d, v), dot3(d, u)); };
    // her fingertip's angle round the sun, unwrapped over the tracing (0.9 .. 4.3 s); before and after, the planet keeps its mean motion
    const tab = [], ta = 0.9, tb = 4.3, dt = 1 / 30; let prev = ang(ta), acc = prev; for (let tt = ta; tt <= tb + 1e-6; tt += dt) { const a = ang(tt); let d = a - prev; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; acc += d; prev = a; tab.push(acc); }
    const w = (tab[tab.length - 1] - tab[0]) / (tb - ta);
    const theta = (tt) => (tt <= ta ? tab[0] + w * (tt - ta) : tt >= tb ? tab[tab.length - 1] + w * (tt - tb) : (() => { const x = (tt - ta) / dt, i = Math.min(tab.length - 2, Math.floor(x)); return tab[i] + (tab[i + 1] - tab[i]) * (x - i); })());
    q = { cn, u, v, r: Math.max(0.24 * Math.min(1, D / 1.2), r), theta, w }; orr.set(key, q); return q; }
  function orrery(b, o) { const M = placer(o), c = tint(o), g = (o.gain ?? 1) * G0, q = orreryOf(o.track, o.reach ?? 1.2), th = q.theta(o.time ?? 0);
    const at = (rr, a) => M(add(q.cn, add(mul(q.u, rr * Math.cos(a)), mul(q.v, rr * Math.sin(a)))));
    for (const [rr, k] of [[q.r, 0.75], [q.r * 0.56, 0.55]]) { const ring = []; for (let i = 0; i < 64; i++) ring.push(at(rr, (i / 64) * 6.2832)); poly(b, ring, c, 0.0022, g * k, true); }
    dot(b, M(q.cn), [1, 0.86, 0.5], 0.05, g * 1.5); dot(b, at(q.r, th), [0.75, 0.9, 1], 0.022, g * 1.5); dot(b, at(q.r * 0.56, th * 2.39 + 1.2), tint(o, 0.6), 0.015, g * 1.3);
  }

  return { begin, seg, poly, dot, drawable, placer, piano, violin, notebook, wind, guitar, stage, orrery, smooth3 };
}
