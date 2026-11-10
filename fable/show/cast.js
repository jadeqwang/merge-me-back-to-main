// CAST: the thin actor layer every sequence goes through. Shows never touch a figure implementation directly.
//   const cast = await makeCast(E)                 loads every track in work_fable/tracks once (names in TRACKS; `_*` never), builds ONE shared Figure
//   cast.begin()                                   start of every frame(t)
//   const a = cast.actor('hero', { lane: 'main' | [r,g,b], variant: 'jade' | 'violet', seed })      (created once, same object returned for the same id)
//   a.set({ pos:[x,y,z], yaw, track, time, scale, density, solid, alpha, gain, visible, vary, trail })
//   const c = cast.crowd('thousand', 1024);  c.put(i, { pos, yaw, track, time, lane, seed, ... });  c.n = how many are live this frame
//   cast.drawables(dawn)                           -> drawables for this frame (actors + crowds)
// yaw: radians about +Y; yaw 0 faces +Z, yaw = atan2(dx, dz) faces (dx, dz). East (+X) is PI/2. Track space: she faces +Z, her left is +X.
// track/time name a baked performance (work_fable/tracks/<track>) and its clock in seconds. Song-timed tracks carry meta.song_t0: time = t - song_t0
//   (cast.songT0(track)). Loop tracks wrap; others clamp. In-place loops (run_loop, sprint_loop, walk_loop; meta.speed) do not travel: the sequence moves pos.
//   Tracks with root motion (violet, sprint_stop_look, free, drop ...) travel from their origin = pos. Helpers to place them:
//     cast.root(track, time, joint = 0)        -> [x, y, z] of a joint (hips) in track space
//     cast.rot(yaw, x, z)                      -> [wx, wz] track-space offset turned into the world
//     cast.origin([wx, wz], yaw, [x, z])       -> pos that puts track-space point (x, z) on world (wx, wz)
//     cast.hips(track, time, pos, yaw)         -> world [x, y, z] of the hips of an instance
//     cast.dur(track), cast.meta(track), cast.speed(track), cast.has(track), cast.event(track, name)
// density 0..1 = how rich the fibre shimmer in her clothes is (night). solid 0..1 = lit by the world's light (default 1; the figure follows dawn by itself).
// alpha 0..1 = presence (dithered); gain = glow of her accents. lane = a LANE name or a road colour [r,g,b] (matched to the nearest lane).
// seed: per-instance variation (+-25 ms, +-2.5 % height, hair). Actors default to a hash of their id ('hero' = 0, the canonical her); crowds to i + 1.
//
// Two backends behind this interface:
//   the real Figure (fable/engine/src/figure/figure.js): default
//   StandIn (?standin=1, --q "standin=1"): a 1.65 m capsule with a head and a facing tick, for fast animatic renders. It follows the track's hips
//   (so root motion, sitting, lying and jumps read as position/height), nothing else.
import { Program, FS_HEAD, hex } from '../engine/src/glx.js';
import { mulberry32 } from '../engine/src/rng.js';
import { LANE } from './world.js';
import { Figure, LANES as FIG_LANES } from '../engine/src/figure/figure.js';
import { loadTrack } from '../engine/src/figure/skeleton.js';

// The render harness's static server cannot list a directory, so the track names live here (everything in work_fable/tracks except `_*`).
// A missing file is skipped with a console line; add new names here. --q "tracks=a,b,c" loads only those (dev).
export const TRACKS = ['build', 'butterfly', 'butterfly_only', 'catch', 'drop', 'drop_join', 'fall_only', 'float', 'fork_L', 'fork_R', 'fork_go_L', 'fork_go_R', 'fork_walk_L', 'fork_walk_R', 'form_test', 'free', 'idle', 'land',
  'life_band', 'life_home', 'life_nasa', 'life_piano', 'life_poet', 'life_stage', 'life_violin', 'life_wetlab', 'life_wushu', 'lookback', 'release', 'rise', 'run_from_stand', 'run_fwd', 'run_loop', 'salute_only',
  'sidekick', 'sit_idle', 'sprint_loop', 'sprint_stop_look', 'turn_around', 'violet', 'walk_fwd', 'walk_lookback', 'walk_loop', 'walk_turn'];
const SIM_OPTS = { life_nasa: { wind: [0, 0, -9], gust: 1.0 } };          // the wind tunnel (track meta: wind from +Z)

const STRIDE = 16; // x y z yaw | tilt sy scale arms | reach r g b | density solid cel bun
const XF = `
layout(location=3) in vec4 iA; layout(location=4) in vec4 iB; layout(location=5) in vec4 iC; layout(location=6) in vec4 iD;
vec3 xform(vec3 p, float part){
  if (part > 2.5 && part < 3.5) p.x *= iB.w; else if (part > 3.5 && part < 4.5) p.z = 0.1 + (p.z - 0.1)*iC.x; else if (part > 4.5) p = vec3(0., 1.66, -0.05) + (p - vec3(0., 1.66, -0.05))*iD.w;
  p.y *= iB.y; p *= iB.z;
  float ct = cos(iB.x), st = sin(iB.x); p = vec3(p.x, p.y*ct + p.z*st + 0.19*iB.z*abs(st), -p.y*st + p.z*ct);   // tilt: falls backward about the feet and lies on the mirror
  float cy = cos(iA.w), sy = sin(iA.w); p = vec3(p.x*cy + p.z*sy, p.y, -p.x*sy + p.z*cy);
  return p + iA.xyz;
}
vec3 xdir(vec3 n){ float ct = cos(iB.x), st = sin(iB.x); n = vec3(n.x, n.y*ct + n.z*st, -n.y*st + n.z*ct); float cy = cos(iA.w), sy = sin(iA.w); return vec3(n.x*cy + n.z*sy, n.y, -n.x*sy + n.z*cy); }
`;
const VS_MESH = `#version 300 es
layout(location=0) in vec3 aP; layout(location=1) in vec3 aN; layout(location=2) in float aPart;
uniform mat4 uVP; out vec3 vN, vL, vLane; out float vPart, vSolid, vCel, vInst;` + XF + `
void main(){ vec3 w = xform(aP, aPart); vN = xdir(aN); vL = aP; vPart = aPart; vLane = iC.yzw; vSolid = iD.y; vCel = iD.z; vInst = float(gl_InstanceID);
  gl_Position = (iD.y <= 0.02 || (aPart > 2.5 && aPart < 3.5 && iB.w < 0.02) || (aPart > 3.5 && aPart < 4.5 && iC.x < 0.02) || (aPart > 4.5 && iD.w < 0.02)) ? vec4(2., 2., 2., 1.) : uVP*vec4(w, 1.); }`;
const FS_MESH = FS_HEAD + `
in vec3 vN, vL, vLane; in float vPart, vSolid, vCel, vInst; uniform vec3 uSun; uniform float uCelDawn;
layout(location=0) out vec4 o0; layout(location=1) out vec4 o1;
float h12(vec2 p){ vec3 p3 = fract(vec3(p.xyx)*.1031); p3 += dot(p3, p3.yzx+33.33); return fract((p3.x+p3.y)*p3.z); }
void main(){
  if (vSolid < 0.999 && h12(gl_FragCoord.xy + vInst*7.) > vSolid) discard;
  float cel = vCel < 0. ? uCelDawn : vCel;
  // costume by height (character sheet): navy cargo trousers, black crop top, white bomber with the lane-coloured band, black hair
  vec3 c = vec3(0.012, 0.016, 0.05); float part = floor(vPart + 0.5); float band = 0.;
  if (part < 0.5) { if (vL.y > 0.80) c = vec3(0.004); if (vL.y > 0.92) c = vec3(0.86, 0.84, 0.78); band = step(1.10, vL.y)*step(vL.y, 1.19); if (vL.y < 0.09) c = vec3(0.86, 0.84, 0.8); }
  else if (part < 1.5) { c = vec3(0.006, 0.005, 0.012); if (vL.z > 0.075 && vL.y < 1.60 && vL.y > 1.46) c = vec3(0.80, 0.56, 0.42); }
  else if (part < 2.5) { c = vLane; band = 1.; }
  else if (part < 4.5) { c = vec3(0.86, 0.84, 0.78); band = part < 3.5 ? step(0.36, abs(vL.x))*step(abs(vL.x), 0.46) : 0.; }
  else { c = vec3(0.006, 0.005, 0.012); if (vL.y > 1.70 || abs(vL.x) > 0.08) c = vec3(0.9, 0.62, 0.12); }
  c = mix(c, vLane, band);
  float lit = smoothstep(-0.05, 0.05, dot(normalize(vN), normalize(uSun + vec3(0., 0.35, 0.))));
  vec3 celc = c * mix(0.62, 1.0, lit) * 1.05;
  vec3 sil = vec3(0.010, 0.007, 0.018) + vLane * band * 1.6;                                   // silhouette: only the band still glows
  o0 = vec4(mix(sil, celc, cel), 1.);
  o1 = vec4(cel > 0.5 ? vec3(0.15 + 0.14*part, 0.2 + 0.5*band, fract(vInst*0.37)*0.5 + 0.3) : vec3(0.), 1.);
}`;
const VS_PTS = `#version 300 es
layout(location=0) in vec3 aP; layout(location=1) in vec3 aN; layout(location=2) in float aPart;
uniform mat4 uVP; uniform vec2 uRes; uniform float uProjK, uAperture, uFocus, uSize, uMinPx, uT;
out vec2 vC; out vec3 vCol; out float vR;` + XF + `
void main(){ int j = gl_VertexID % 6; int cid = j < 3 ? j : (j == 3 ? 2 : (j == 4 ? 1 : 3)); vec2 c = vec2(float(cid&1), float((cid>>1)&1))*2.-1.; vC = c;
  vec3 w = xform(aP, aPart); vec4 p = uVP*vec4(w, 1.); float dist = max(p.w, 1e-3);
  float hide = (iD.x <= 0.004 || (aPart > 2.5 && aPart < 3.5 && iB.w < 0.02) || (aPart > 3.5 && aPart < 4.5 && iC.x < 0.02) || (aPart > 4.5 && iD.w < 0.02)) ? 1. : 0.;
  float seed = aN.x;                                           // per-point random (0..1)
  if (seed > iD.x*1.25) hide = 1.;                             // density thins the cloud
  float r0 = uSize*iB.z*uProjK/dist; float coc = uAperture*abs(1./uFocus - 1./dist)*uRes.y; float r = max(sqrt(r0*r0 + coc*coc), uMinPx);
  float e = (r0*r0)/(r*r); e = max(e, min(1., r0/uMinPx)*0.5*step(coc, uMinPx));
  float tw = 0.7 + 0.3*sin(uT*(2. + 5.*aN.y) + aN.z*40.);
  vec3 lane = iC.yzw; vec3 col = mix(lane, vec3(1.0, 0.92, 0.82), aPart > 0.5 && aPart < 1.5 ? 0.55 : 0.18 + 0.5*step(0.93, aN.y));
  vCol = col * e * tw * (0.35 + aN.z) * min(iD.x*1.6, 1.3); vR = r;
  p.xy += c*(r + 1.)*2./uRes*p.w; gl_Position = hide > 0.5 ? vec4(2., 2., 2., 1.) : p; }`;
const FS_PTS = FS_HEAD + `in vec2 vC; in vec3 vCol; in float vR; uniform float uGain; out vec4 o;
void main(){ float d = length(vC)*(vR + 1.); float a = smoothstep(vR + 0.7, vR - 0.7, d); o = vec4(vCol*a*uGain, 0.); }`;

function buildTemplate() {
  const P = [], I = []; let nv = 0;
  // capsule along an axis from a to b with radius r (lat-long), part id
  const capsule = (a, b, r, part, seg = 14, rings = 5) => {
    const ax = [b[0] - a[0], b[1] - a[1], b[2] - a[2]]; const len = Math.hypot(...ax) || 1; const z = ax.map((v) => v / len);
    let x = Math.abs(z[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]; const y = [z[1] * x[2] - z[2] * x[1], z[2] * x[0] - z[0] * x[2], z[0] * x[1] - z[1] * x[0]]; const yl = Math.hypot(...y); y.forEach((v, i) => (y[i] = v / yl));
    x = [y[1] * z[2] - y[2] * z[1], y[2] * z[0] - y[0] * z[2], y[0] * z[1] - y[1] * z[0]];
    const rows = []; for (let i = 0; i <= rings; i++) { const th = (i / rings) * Math.PI / 2; rows.push([-Math.cos(th) * r, Math.sin(th) * r, 0]); } for (let i = rings; i >= 0; i--) { const th = (i / rings) * Math.PI / 2; rows.push([Math.cos(th) * r, Math.sin(th) * r, 1]); }
    const base = nv;
    rows.forEach(([h, rr, end]) => { for (let s = 0; s <= seg; s++) { const ph = (s / seg) * Math.PI * 2, cx = Math.cos(ph), sx = Math.sin(ph); const o = end ? b : a;
      const px = o[0] + z[0] * h + (x[0] * cx + y[0] * sx) * rr, py = o[1] + z[1] * h + (x[1] * cx + y[1] * sx) * rr, pz = o[2] + z[2] * h + (x[2] * cx + y[2] * sx) * rr;
      const nx = z[0] * h + (x[0] * cx + y[0] * sx) * rr, ny = z[1] * h + (x[1] * cx + y[1] * sx) * rr, nz = z[2] * h + (x[2] * cx + y[2] * sx) * rr; const nl = Math.hypot(nx, ny, nz) || 1;
      P.push(px, py, pz, nx / nl, ny / nl, nz / nl, part); nv++; } });
    for (let i = 0; i < rows.length - 1; i++) for (let s = 0; s < seg; s++) { const p = base + i * (seg + 1) + s, q = p + seg + 1; I.push(p, q, p + 1, p + 1, q, q + 1); }
  };
  capsule([0, 0.19, 0], [0, 1.24, 0], 0.19, 0, 18, 6);               // body (feet at y = 0, shoulders ~1.43)
  capsule([0, 1.52, 0], [0, 1.521, 0], 0.13, 1, 16, 6);              // head (crown at 1.65)
  capsule([0, 1.50, 0.12], [0, 1.50, 0.20], 0.035, 2, 8, 3);         // facing tick (nose)
  capsule([0, 1.18, 0.17], [0, 1.18, 0.26], 0.05, 2, 8, 3);          // facing tick (chest)
  capsule([-0.80, 1.30, 0], [0.80, 1.30, 0], 0.055, 3, 10, 3);       // arm bar (x scaled by arms)
  capsule([0, 1.22, 0.1], [0, 1.22, 0.62], 0.06, 4, 10, 3);          // forward reach (z scaled by reach)
  capsule([0, 1.66, -0.05], [0, 1.661, -0.05], 0.075, 5, 10, 4);     // violet's bun
  capsule([-0.16, 1.60, -0.10], [0.13, 1.76, 0.0], 0.012, 5, 6, 2);  // two pencils through it
  capsule([0.16, 1.61, -0.08], [-0.12, 1.75, -0.02], 0.012, 5, 6, 2);
  const V = new Float32Array(P), X = new Uint32Array(I);
  // light-mode points: random points on the surface, area-weighted. normal slot carries three randoms instead.
  const rnd = mulberry32(99), tri = []; let area = 0; for (let i = 0; i < X.length; i += 3) { const a = X[i] * 7, b = X[i + 1] * 7, c = X[i + 2] * 7; const ux = V[b] - V[a], uy = V[b + 1] - V[a + 1], uz = V[b + 2] - V[a + 2], vx = V[c] - V[a], vy = V[c + 1] - V[a + 1], vz = V[c + 2] - V[a + 2];
    const ar = 0.5 * Math.hypot(uy * vz - uz * vy, uz * vx - ux * vz, ux * vy - uy * vx) * (V[a + 6] > 0.5 ? 2.2 : 1); area += ar; tri.push([a, b, c, area]); }
  const NP = 900, Q = new Float32Array(NP * 7);
  for (let k = 0; k < NP; k++) { const r = rnd() * area; let lo = 0, hi = tri.length - 1; while (lo < hi) { const m = (lo + hi) >> 1; if (tri[m][3] < r) lo = m + 1; else hi = m; } const [a, b, c] = tri[lo]; let u = rnd(), v = rnd(); if (u + v > 1) { u = 1 - u; v = 1 - v; }
    for (let j = 0; j < 3; j++) Q[k * 7 + j] = V[a + j] + (V[b + j] - V[a + j]) * u + (V[c + j] - V[a + j]) * v; Q[k * 7 + 3] = k / NP; Q[k * 7 + 4] = rnd(); Q[k * 7 + 5] = rnd(); Q[k * 7 + 6] = V[a + 6]; }
  return { V, X, Q, NP };
}

class StandIn {
  constructor(E) {
    const gl = (this.gl = E.gl); this.E = E; const T = buildTemplate(); this.ni = T.X.length; this.np = T.NP;
    this.pMesh = new Program(gl, VS_MESH, FS_MESH, 'cast.mesh'); this.pPts = new Program(gl, VS_PTS, FS_PTS, 'cast.pts');
    this.inst = gl.createBuffer(); this.cap = 0;
    const attribs = (vao) => { gl.bindVertexArray(vao); gl.bindBuffer(gl.ARRAY_BUFFER, this.inst); for (let k = 0; k < 4; k++) { gl.enableVertexAttribArray(3 + k); gl.vertexAttribPointer(3 + k, 4, gl.FLOAT, false, STRIDE * 4, k * 16); gl.vertexAttribDivisor(3 + k, 1); } };
    this.vaoMesh = gl.createVertexArray(); gl.bindVertexArray(this.vaoMesh); let b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, T.V, gl.STATIC_DRAW);
    [[0, 3, 0], [1, 3, 12], [2, 1, 24]].forEach(([l, n, o]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, n, gl.FLOAT, false, 28, o); });
    b = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, T.X, gl.STATIC_DRAW); attribs(this.vaoMesh);
    // points: each point is a quad -> the template is per-instance too, so expand: one draw of np*inst quads needs both as instanced attributes. Simplest: bake the point template into a texture-free loop:
    // draw np instanced quads per figure is too many draw calls for a crowd, so the point cloud is drawn as GL_POINTS-like quads via a vertex buffer of np*4 corner vertices.
    const C = new Float32Array(T.NP * 6 * 7);
    for (let k = 0; k < T.NP; k++) for (let j = 0; j < 6; j++) C.set(T.Q.subarray(k * 7, k * 7 + 7), (k * 6 + j) * 7);
    this.vaoPts = gl.createVertexArray(); gl.bindVertexArray(this.vaoPts); b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, C, gl.STATIC_DRAW);
    [[0, 3, 0], [1, 3, 12], [2, 1, 24]].forEach(([l, n, o]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, n, gl.FLOAT, false, 28, o); }); attribs(this.vaoPts);
    gl.bindVertexArray(null);
  }
  // data: Float32Array n*STRIDE (a private copy per frame)
  drawable(data, n) {
    const self = this, gl = this.gl; let up = false; let anySolid = false, anyLight = false; for (let i = 0; i < n; i++) { if (data[i * STRIDE + 13] > 0.02) anySolid = true; if (data[i * STRIDE + 12] > 0.004) anyLight = true; }
    return { passes: ['opaque', 'add'], draw(ctx) {
      if (!n) return; if (ctx.pass === 'opaque' && !anySolid) return; if (ctx.pass === 'add' && !anyLight) return;
      if (!up) { gl.bindBuffer(gl.ARRAY_BUFFER, self.inst); if (n > self.cap) { self.cap = Math.max(n, 64); gl.bufferData(gl.ARRAY_BUFFER, self.cap * STRIDE * 4, gl.DYNAMIC_DRAW); } gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, n * STRIDE); up = true; }
      if (ctx.pass === 'opaque') { gl.bindVertexArray(self.vaoMesh);
        self.pMesh.use().set({ uVP: ctx.viewProj, uSun: ctx.sunDir, uCelDawn: Math.min(1, Math.max(0, (ctx.dawn - 0.70) / 0.14)) }); gl.drawElementsInstanced(gl.TRIANGLES, self.ni, gl.UNSIGNED_INT, 0, n); }
      else { gl.bindVertexArray(self.vaoPts);
        self.pPts.use().set({ uVP: ctx.viewProj, uRes: [ctx.W, ctx.H], uProjK: ctx.H / (2 * Math.tan(ctx.fovY / 2)), uAperture: ctx.aperture, uFocus: ctx.focusDist, uSize: 0.011, uMinPx: 0.75, uT: ctx.t, uGain: ctx.reflect ? 0.6 : 1 });
        gl.drawArraysInstanced(gl.TRIANGLES, 0, self.np * 6, n); }
      gl.bindVertexArray(null);
    } };
  }
}

export async function makeCast(E) {
  const { hex } = E; const standin = !!E.param('standin', 0); const only = E.Q.get('tracks');
  const names = (only ? String(only).split(',') : TRACKS).filter((n) => n && !n.startsWith('_'));
  // ---- tracks: loaded once, by both backends (the stand-in only reads the hips)
  const tracks = {}; const tl = performance.now();
  await Promise.all(names.map(async (n) => { try { tracks[n] = await loadTrack('/work_fable/tracks/' + n, n); } catch (e) { console.log('cast: track ' + n + ' not loaded (' + e.message + ')'); } }));
  let fig = null, impl = null;
  if (standin) impl = new StandIn(E);
  else { fig = new Figure(E.gl, { fontBase: '/engine/fonts/' }); await fig.init(); const ts = performance.now(); let fr = 0;
    for (const n of Object.keys(tracks).sort()) { fig.addTrack(tracks[n], SIM_OPTS[n]); fr += tracks[n].frames; }
    console.log(`cast: ${Object.keys(tracks).length} tracks, ${fr} frames; load ${(ts - tl).toFixed(0)} ms, sim ${(performance.now() - ts).toFixed(0)} ms`); }
  const laneLin = {}, laneCol = {}; for (const k in LANE) { laneLin[k] = hex(LANE[k]); laneCol[k] = standin ? laneLin[k] : (FIG_LANES[k] || laneLin[k]); }
  // a lane name, or a road colour (linear rgb, from E.hex) matched to the nearest lane
  const laneOf = (l) => { if (!Array.isArray(l)) return laneCol[l] || laneCol.main; if (standin) return l; let best = 'main', bd = 1e9; for (const k in laneLin) { const c = laneLin[k], d = (c[0] - l[0]) ** 2 + (c[1] - l[1]) ** 2 + (c[2] - l[2]) ** 2; if (d < bd) { bd = d; best = k; } } return laneCol[best]; };
  const warned = {}; const T = (n) => { const t = tracks[n]; if (!t && !warned[n]) { warned[n] = 1; console.log('cast: unknown track "' + n + '" (idle is played instead)'); } return t || tracks.idle; };
  const dur = (n) => { const t = T(n); return t ? (t.loop ? t.frames : t.frames - 1) / t.fps : 1; };
  const wrap = (n, time) => { const t = T(n), d = dur(n); return t && t.loop ? ((time % d) + d) % d : Math.min(d, Math.max(0, time)); };
  const root = (n, time, j = 0) => { const t = T(n); if (!t) return [0, 1, 0]; const ft = wrap(n, time) * t.fps, f0 = Math.min(t.frames - 1, Math.floor(ft)), f1 = f0 + 1 < t.frames ? f0 + 1 : (t.loop ? 0 : f0), u = ft - f0, D = t.data, a = f0 * 147 + j * 7, b = f1 * 147 + j * 7;
    return [D[a] + (D[b] - D[a]) * u, D[a + 1] + (D[b + 1] - D[a + 1]) * u, D[a + 2] + (D[b + 2] - D[a + 2]) * u]; };
  const rot = (yaw, x, z) => { const c = Math.cos(yaw), s = Math.sin(yaw); return [x * c + z * s, -x * s + z * c]; };
  const origin = (w, yaw, p) => { const o = rot(yaw, p[0], p[1]); return [w[0] - o[0], 0, w[1] - o[1]]; };
  const hips = (n, time, pos, yaw) => { const r = root(n, time), o = rot(yaw, r[0], r[2]); return [pos[0] + o[0], pos[1] + r[1], pos[2] + o[1]]; };
  const hashStr = (s) => { let h = 2166136261; for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619); return 1 + ((h >>> 0) % 9973); };
  const DEF = { pos: [0, 0, 0], yaw: 0, scale: 1, density: 1, solid: 1, alpha: 1, gain: 1, visible: true, track: 'idle', time: 0 };
  // ---- the real figure: one instance description per body
  const inst = (s, lane, variant, seed) => { const t = T(s.track); return { pos: s.pos, yaw: s.yaw, scale: s.scale, track: t ? t.name : 0, time: t ? wrap(t.name, s.time) : 0, lane: laneOf(lane), density: s.density, solid: s.solid, alpha: s.visible ? s.alpha : 0, gain: s.gain,
    variant: s.pencil === 'hand' ? 'bun_write' : s.pencil === 'gone' ? 'bun_one' : variant === 'violet' || variant === 'bun' ? 'bun' : undefined, seed: s.seed ?? seed, /* set({ pencil: 'hand' | 'gone' }): the violet branch has drawn one pencil / it became the light (actD) */ vary: s.vary, trail: s.trail, story: s.story, eyes: s.eyes, lodBias: s.lodBias }; };
  // ---- the stand-in: a capsule that follows the track's hips
  const ss = (x, a, b) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
  const write = (d, o, s, color, bun, dawn) => { const r = root(s.track, s.time), w = rot(s.yaw, r[0], r[2]), vis = s.visible ? s.alpha : 0, sol = s.solid * ss(dawn, 0.38, 0.54), den = (0.25 + 0.75 * s.density) * (1 - ss(dawn, 0.40, 0.56));
    d[o] = s.pos[0] + w[0]; d[o + 1] = s.pos[1] + Math.max(0, r[1] - 1.02); d[o + 2] = s.pos[2] + w[1]; d[o + 3] = s.yaw; d[o + 4] = 0; d[o + 5] = Math.min(1, Math.max(0.12, r[1] / 0.98)); d[o + 6] = s.scale; d[o + 7] = 0;
    d[o + 8] = 0; d[o + 9] = color[0]; d[o + 10] = color[1]; d[o + 11] = color[2]; d[o + 12] = vis * den * (1 - sol); d[o + 13] = vis * sol; d[o + 14] = -1; d[o + 15] = bun; };
  const actors = new Map(), crowds = new Map();
  const cast = {
    standin, fig, impl, tracks, laneCol, laneOf, root, rot, origin, hips, dur,
    has: (n) => !!tracks[n], meta: (n) => (tracks[n] && tracks[n].meta) || {}, speed: (n) => (tracks[n] && tracks[n].meta && tracks[n].meta.speed) || 0, songT0: (n) => (tracks[n] && tracks[n].meta && tracks[n].meta.song_t0) || 0,
    event: (n, name) => { const e = tracks[n] && tracks[n].events.find((q) => q.name === name); return e ? e.t : undefined; },
    begin() { for (const a of actors.values()) a.live = false; for (const c of crowds.values()) c.n = 0; },
    actor(id, o = {}) { let a = actors.get(id); if (!a) { a = { id, lane: o.lane || 'main', variant: o.variant || 'jade', seed: o.seed ?? (id === 'hero' ? 0 : hashStr(id)), s: { ...DEF }, live: false,
      set(v) { this.s = { ...DEF, ...v }; this.live = true; return this; } }; actors.set(id, a); } if (o.lane) a.lane = o.lane; if (o.variant) a.variant = o.variant; return a; },
    crowd(id, max = 1024) { let c = crowds.get(id); if (!c) { c = { id, max, n: 0, items: new Array(max),
      put(i, v) { this.items[i] = v; if (i >= this.n) this.n = i + 1; } }; crowds.set(id, c); } return c; },
    drawables(dawn = 0) {
      const live = [...actors.values()].filter((a) => a.live && a.s.visible && a.s.alpha > 0);
      if (fig) { fig.begin(); let n = 0; for (const a of live) { fig.add(inst(a.s, a.s.lane || a.lane, a.variant, a.seed)); n++; }
        for (const c of crowds.values()) for (let i = 0; i < c.n; i++) { const v = c.items[i]; if (!v || v.visible === false) continue; fig.add(inst({ ...DEF, ...v }, v.lane || 'main', v.variant, i + 1)); n++; }
        return n ? [fig] : []; }
      const list = [];
      if (live.length) { const d = new Float32Array(live.length * STRIDE); live.forEach((a, i) => write(d, i * STRIDE, a.s, laneOf(a.s.lane || a.lane), a.variant === 'violet' ? 1 : 0, dawn)); list.push(impl.drawable(d, live.length)); }
      for (const c of crowds.values()) if (c.n) { const d = new Float32Array(c.n * STRIDE); let n = 0; for (let i = 0; i < c.n; i++) { const v = c.items[i]; if (!v || v.visible === false) continue; write(d, n++ * STRIDE, { ...DEF, ...v }, laneOf(v.lane || 'main'), v.variant === 'violet' ? 1 : 0, dawn); } if (n) list.push(impl.drawable(d, n)); }
      return list; },
    yawTo: (dx, dz) => Math.atan2(dx, dz),
  };
  return cast;
}
