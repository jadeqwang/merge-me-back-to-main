// The canonical 21-joint skeleton (SPEC §5), its rest pose, the track format, and procedural test tracks.
//
// Conventions
//   metres, Y up, the character faces +Z at rest, so her LEFT is +X.
//   A track frame = 21 x (pos xyz, quat xyzw). The quaternion is the joint's WORLD orientation:
//   it maps the joint's local axes to track space, where local +Y points from the joint to its child
//   and local +Z is the character's front at rest (so local point p sits at pos + q*p).
//   Feet and toes: +Y runs ankle -> toe, so "front" is degenerate there; their +Z is the top of the foot (up).
import { add, sub, mul, norm, len, qmul, qconj, qrot, qframe, qX, qY, qZ, qslerp, lerp, smooth, clamp, DEG } from './m.js';

export const JOINTS = ['hips', 'spine', 'chest', 'neck', 'head', 'clavL', 'upArmL', 'foreArmL', 'handL', 'clavR', 'upArmR', 'foreArmR', 'handR',
  'thighL', 'shinL', 'footL', 'toeL', 'thighR', 'shinR', 'footR', 'toeR'];
export const J = Object.fromEntries(JOINTS.map((n, i) => [n, i]));
export const PARENT = [-1, 0, 1, 2, 3, 2, 5, 6, 7, 2, 9, 10, 11, 0, 13, 14, 15, 0, 17, 18, 19];
export const NJ = 21, STRIDE = 147, FPS = 60;

// The canonical rest pose is the motion library's (fable/tools/bake/skeleton.json): the same numbers, so every
// baked track attaches to this template without retargeting. A-pose, arms 35 degrees from the body.
const A = 55 * DEG, ARM = [Math.cos(A), -Math.sin(A), 0];
const SH = [0.155, 1.3701, 0], UA = 0.27, FA = 0.235, HAND = 0.17;
const mirror = (p) => [-p[0], p[1], p[2]];
const elbowL = add(SH, mul(ARM, UA)), wristL = add(elbowL, mul(ARM, FA));
export const REST_POS = [
  [0, 1.005, 0], [0, 1.095, 0], [0, 1.225, 0], [0, 1.415, 0], [0, 1.505, 0],
  [0.023, 1.342, 0], SH, elbowL, wristL,
  [-0.023, 1.342, 0], mirror(SH), mirror(elbowL), mirror(wristL),
  [0.085, 0.930, 0], [0.085, 0.495, 0], [0.085, 0.085, 0], [0.085, 0.025, 0.1209],
  [-0.085, 0.930, 0], [-0.085, 0.495, 0], [-0.085, 0.085, 0], [-0.085, 0.025, 0.1209],
];
// Where each joint's +Y points (child joint index, or an explicit tip for end joints).
const CHILD = [1, 2, 3, 4, -1, 6, 7, 8, -1, 10, 11, 12, -1, 14, 15, 16, -1, 18, 19, 20, -1];
const TIP = { 4: [0, 0.15, 0], 8: mul(ARM, HAND), 12: mul(mirror(ARM), HAND), 16: [0, 0, 0.07], 20: [0, 0, 0.07] };
const ZHINT = (j) => (j === 15 || j === 16 || j === 19 || j === 20) ? [0, 1, 0] : [0, 0, 1];
export const REST_Q = [], BONE_LEN = [];
for (let j = 0; j < NJ; j++) {
  const d = CHILD[j] >= 0 ? sub(REST_POS[CHILD[j]], REST_POS[j]) : TIP[j];
  REST_Q.push(qframe(d, ZHINT(j))); BONE_LEN.push(len(d));
}
export const REST_INV = REST_Q.map(qconj);
// Rest-pose world point -> joint-local point (and back).
export const toLocal = (j, p) => qrot(REST_INV[j], sub(p, REST_POS[j]));
export const dirToLocal = (j, n) => qrot(REST_INV[j], n);

// ---------------------------------------------------------------------------------------------
// Tracks
export function makeTrack(name, frames, opts = {}) {
  return { name, fps: FPS, frames, loop: !!opts.loop, events: opts.events || [], boneLengths: null, data: new Float32Array(frames * STRIDE), simOpts: opts.simOpts || {} };
}
export function restTrack(frames = 2) {
  const t = makeTrack('rest', frames, { loop: true });
  for (let f = 0; f < frames; f++) for (let j = 0; j < NJ; j++) t.data.set([...REST_POS[j], ...REST_Q[j]], f * STRIDE + j * 7);
  return t;
}
export async function loadTrack(urlNoExt, name) {
  const meta = await (await fetch(urlNoExt + '.json')).json();
  const buf = await (await fetch(urlNoExt + '.bin')).arrayBuffer();
  const data = new Float32Array(buf);
  if (meta.joints && meta.joints.join() !== JOINTS.join()) throw new Error('track ' + urlNoExt + ': joint order differs from the canonical skeleton');
  if (data.length !== meta.frames * STRIDE) throw new Error('track ' + urlNoExt + ': size mismatch');
  return { name: name || urlNoExt.split('/').pop(), fps: meta.fps || FPS, frames: meta.frames, loop: !!meta.loop, events: meta.events || [], boneLengths: meta.boneLengths || null, data, simOpts: meta.simOpts || {}, meta: meta.meta || {} };
}
// Per-joint scale applied to the template's along-bone coordinate when a track's bones differ from ours.
export function boneScales(track) {
  const s = new Float32Array(NJ).fill(1);
  if (track.boneLengths) for (let j = 0; j < NJ; j++) { const L = track.boneLengths[JOINTS[j]]; if (L > 0.01) s[j] = clamp(L / BONE_LEN[j], 0.6, 1.6); }
  return s;
}

// ---------------------------------------------------------------------------------------------
// Forward kinematics for authored poses (test tracks, procedural overlays).
// A pose is { root:{x,y,z,yaw,pitch,roll}, <joint>:[flex, abd, twist] (degrees, anatomical) }.
//   flex  = about local X: forward for spine/arms/thighs; for shins negative bends the knee; feet + = toes up
//   abd   = away from the body's midline (sign handled per side); spine/head: + leans to her left
//   twist = about the bone; spine/head: + turns to her left
const REL_OFF = [], REL_Q = [];
for (let j = 0; j < NJ; j++) {
  const p = PARENT[j];
  if (p < 0) { REL_OFF.push([0, 0, 0]); REL_Q.push(REST_Q[j]); }
  else { REL_OFF.push(qrot(REST_INV[p], sub(REST_POS[j], REST_POS[p]))); REL_Q.push(qmul(REST_INV[p], REST_Q[j])); }
}
const SIDE = JOINTS.map((n) => (n.endsWith('R') ? -1 : 1));
const CENTRAL = JOINTS.map((n) => !(n.endsWith('R') || n.endsWith('L')));
function localDelta(j, e) {
  if (!e) return [0, 0, 0, 1];
  const s = SIDE[j], c = CENTRAL[j];
  const fx = e[0] * DEG, ab = (c ? -e[1] : e[1] * s) * DEG, tw = (c ? e[2] : e[2] * s) * DEG;
  return qmul(qX(fx), qmul(qZ(ab), qY(tw)));
}
const SOLE = { 15: 0.085, 16: 0.025, 19: 0.085, 20: 0.025 };
export function fkFrame(pose, out, o, ground = true) {
  const r = pose.root || {}; const Q = new Array(NJ), P = new Array(NJ);
  const rootQ = qmul(qY((r.yaw || 0) * DEG), qmul(qX((r.pitch || 0) * DEG), qZ((r.roll || 0) * DEG)));
  for (let j = 0; j < NJ; j++) {
    const d = localDelta(j, pose[JOINTS[j]]), p = PARENT[j];
    if (p < 0) { Q[j] = qmul(rootQ, qmul(REST_Q[j], d)); P[j] = [r.x || 0, REST_POS[0][1] + (r.y || 0), r.z || 0]; }
    else { Q[j] = qmul(Q[p], qmul(REL_Q[j], d)); P[j] = add(P[p], qrot(Q[p], REL_OFF[j])); }
  }
  if (ground) {
    let lo = 1e9;
    for (const j of [15, 16, 19, 20]) { lo = Math.min(lo, P[j][1] - SOLE[j]); const tip = add(P[j], qrot(Q[j], [0, BONE_LEN[j], 0])); if (j === 16 || j === 20) lo = Math.min(lo, tip[1] - 0.02); }
    const lift = r.air || 0;
    for (let j = 0; j < NJ; j++) P[j][1] += lift - lo;
  }
  for (let j = 0; j < NJ; j++) { out[o + j * 7] = P[j][0]; out[o + j * 7 + 1] = P[j][1]; out[o + j * 7 + 2] = P[j][2]; out.set(Q[j], o + j * 7 + 3); }
}
export function blendPose(a, b, t) {
  const o = { root: {} };
  for (const k of ['x', 'y', 'z', 'yaw', 'pitch', 'roll', 'air']) o.root[k] = lerp((a.root || {})[k] || 0, (b.root || {})[k] || 0, t);
  for (const n of JOINTS) { const x = a[n] || [0, 0, 0], y = b[n] || [0, 0, 0]; o[n] = [lerp(x[0], y[0], t), lerp(x[1], y[1], t), lerp(x[2], y[2], t)]; }
  return o;
}

// ---- authored motions (lab only; the film uses baked mocap) ----
const S = Math.sin, C = Math.cos, TAU = Math.PI * 2;
const RELAX = { upArmL: [4, -30, 0], upArmR: [4, -30, 0], foreArmL: [14, 0, 0], foreArmR: [14, 0, 0], handL: [6, 0, 0], handR: [6, 0, 0] };
function idlePose(t) {
  const b = S(t * TAU / 4.2), w = S(t * TAU / 7.0), k = S(t * TAU / 5.3 + 1);
  return {
    root: { x: 0.016 * w, yaw: 2.5 * k, roll: -1.6 * w },
    spine: [1.2 * b, 1.6 * w, -1.5 * k], chest: [-1.5 * b - 1, 1.2 * w, -1.5 * k], neck: [2, 0, 3 * k], head: [-2 + 1.5 * b, -1.5 * w, 5 * S(t * TAU / 9)],
    upArmL: [4 + 1.5 * b, -30 - 1.2 * b, 0], upArmR: [4 + 1.5 * b, -30 - 1.2 * b, 0], foreArmL: [15 + 2 * k, 0, 0], foreArmR: [15 - 2 * k, 0, 0], handL: [6, 0, 0], handR: [6, 0, 0],
    thighL: [1.5 * w, 2 + 1.2 * w, 0], thighR: [-1.5 * w, 2 - 1.2 * w, 0], shinL: [-3 - 2 * Math.max(0, w), 0, 0], shinR: [-3 - 2 * Math.max(0, -w), 0, 0],
  };
}
function walkPose(ph) {
  const a = ph * TAU, s = S(a), c = C(a);
  return {
    root: { y: 0.018 * C(2 * a), yaw: -5 * s, roll: 2.2 * c, pitch: 2 },
    spine: [2, 2 * c, 4 * s], chest: [1, -1.5 * c, 7 * s], neck: [0, 0, -3 * s], head: [-2, 0, -3 * s],
    thighL: [26 * s + 3, 1.5, 0], thighR: [-26 * s + 3, 1.5, 0],
    shinL: [-(6 + 54 * Math.pow(Math.max(0, c), 2)), 0, 0], shinR: [-(6 + 54 * Math.pow(Math.max(0, -c), 2)), 0, 0],
    footL: [8 * c - 4, 0, 0], footR: [-8 * c - 4, 0, 0],
    upArmL: [-22 * s + 2, -31, 0], upArmR: [22 * s + 2, -31, 0], foreArmL: [16 + 10 * Math.max(0, -s), 0, 0], foreArmR: [16 + 10 * Math.max(0, s), 0, 0], handL: [6, 0, 0], handR: [6, 0, 0],
  };
}
function runPose(ph) {
  const a = ph * TAU, s = S(a), c = C(a);
  return {
    root: { y: 0.0, air: 0.05 * Math.pow(Math.abs(S(a)), 1.5), yaw: -8 * s, roll: 3 * c, pitch: 9 },
    spine: [5, 2 * c, 7 * s], chest: [3, -2 * c, 11 * s], neck: [-4, 0, -6 * s], head: [-5, 0, -4 * s],
    thighL: [46 * s + 14, 2, 0], thighR: [-46 * s + 14, 2, 0],
    shinL: [-(18 + 92 * Math.pow(Math.max(0, c * 0.9 + 0.1), 1.5)), 0, 0], shinR: [-(18 + 92 * Math.pow(Math.max(0, -c * 0.9 + 0.1), 1.5)), 0, 0],
    footL: [-14 + 16 * c, 0, 0], footR: [-14 - 16 * c, 0, 0],
    upArmL: [-44 * s + 6, -24, 0], upArmR: [44 * s + 6, -24, 0], foreArmL: [84 + 14 * s, 0, 0], foreArmR: [84 - 14 * s, 0, 0], handL: [8, 0, 0], handR: [8, 0, 0],
  };
}
const GUARD = { ...RELAX, upArmL: [38, -8, 0], foreArmL: [96, 0, 0], upArmR: [20, -18, 0], foreArmR: [108, 0, 0], spine: [-2, 0, -8], chest: [-2, 0, -10], root: { yaw: 14 } };
const KICK_CH = { ...GUARD, thighR: [98, 4, 0], shinR: [-118, 0, 0], footR: [-24, 0, 0], thighL: [-2, 3, 0], shinL: [-12, 0, 0], spine: [-8, 3, -6], chest: [-6, 2, -8], root: { yaw: 10, pitch: -3 } };
const KICK_EX = { ...GUARD, thighR: [118, 6, 0], shinR: [-4, 0, 0], footR: [-38, 0, 0], thighL: [-4, 4, 0], shinL: [-8, 0, 0], footL: [6, 0, 0], spine: [-8, 2, -4], chest: [-6, 2, -6], neck: [6, 0, 0], head: [4, 0, 0],
  upArmL: [-52, 24, 0], foreArmL: [18, 0, 0], upArmR: [-30, 34, 0], foreArmR: [30, 0, 0], root: { yaw: 6, pitch: -6 } };
const LUNGE = { thighL: [78, 6, 0], shinL: [-92, 0, 0], footL: [10, 0, 0], thighR: [-44, 8, 0], shinR: [-6, 0, 0], footR: [28, 0, 0], spine: [6, 0, -14], chest: [4, 0, -22], neck: [0, 0, 16], head: [-4, 0, 14],
  upArmR: [86, -18, 0], foreArmR: [4, 0, 0], handR: [0, 0, 0], upArmL: [-34, -20, 0], foreArmL: [112, 0, 0], handL: [0, 0, 0], root: { yaw: -20, pitch: 6 } };
const ARMS_OPEN = { upArmL: [-12, 44, 0], upArmR: [-12, 44, 0], foreArmL: [10, 0, 0], foreArmR: [10, 0, 0], chest: [-8, 0, 0], head: [-10, 0, 0], thighL: [0, 3, 0], thighR: [0, 3, 0] };

function keyed(keys, t) { // keys: [[time, pose], ...]
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) return blendPose(keys[i - 1][1], keys[i][1], smooth(keys[i - 1][0], keys[i][0], t));
  return keys[keys.length - 1][1];
}
function withRoot(p, r) { return { ...p, root: { ...(p.root || {}), ...r } }; }

const KINDS = {
  idle: { dur: 8.4, loop: true, pose: (t) => idlePose(t) },
  walk: { dur: 1.1, loop: true, pose: (t) => withRoot(walkPose(t / 1.1), { z: 1.38 * t }) },
  run: { dur: 0.68, loop: true, pose: (t) => withRoot(runPose(t / 0.68), { z: 4.3 * t }) },
  turn: { dur: 3.0, loop: false, pose: (t) => { const p = blendPose(idlePose(t), ARMS_OPEN, 0.55 * smooth(0.2, 0.9, t) * (1 - smooth(2.0, 2.8, t))); p.root.yaw += 360 * smooth(0.5, 2.1, t); return p; } },
  kick: { dur: 2.4, loop: false, pose: (t) => keyed([[0, idlePose(t)], [0.35, GUARD], [0.62, KICK_CH], [0.80, KICK_EX], [0.94, KICK_EX], [1.14, KICK_CH], [1.42, GUARD], [2.2, idlePose(t)]], t) },
  lunge: { dur: 2.6, loop: false, pose: (t) => keyed([[0, idlePose(t)], [0.3, GUARD], [0.62, withRoot(LUNGE, { yaw: -20, pitch: 6, z: 0.42 })], [1.5, withRoot(LUNGE, { yaw: -20, pitch: 6, z: 0.42 })], [2.3, withRoot(idlePose(t), { z: 0.3 })]], t) },
};
// One continuous 'stress' performance: idle, walk, run, stop, turn, kick, lunge.
function stressPose(t) {
  const seg = [[0, 2.0, 'idle'], [2.0, 5.3, 'walk'], [5.3, 8.02, 'run'], [8.02, 9.0, 'idle'], [9.0, 12.0, 'turn'], [12.0, 14.4, 'kick'], [14.4, 17.0, 'lunge'], [17.0, 18.0, 'idle']];
  let z = 0, cur = null, prev = null;
  for (const s of seg) {
    const sp = s[2] === 'walk' ? 1.38 : s[2] === 'run' ? 4.3 : 0;
    if (t >= s[1]) { z += sp * (s[1] - s[0]); if (s[2] === 'lunge') z += 0.3; prev = s; continue; }
    if (t >= s[0]) { cur = s; break; }
  }
  if (!cur) cur = seg[seg.length - 1];
  const lt = t - cur[0], k = KINDS[cur[2]];
  let p = k.pose(lt);
  p = withRoot(p, { z: ((p.root || {}).z || 0) + z });
  if (prev && lt < 0.35) { // crossfade from the previous segment's end
    const pk = KINDS[prev[2]]; let q = pk.pose(prev[1] - prev[0] + lt);
    q = withRoot(q, { z: p.root.z });
    p = blendPose(q, p, smooth(0, 0.35, lt));
  }
  return p;
}
KINDS.stress = { dur: 18.0, loop: false, pose: stressPose };

export function testTrack(kind = 'stress') {
  const k = KINDS[kind]; if (!k) throw new Error('unknown test track ' + kind);
  const frames = Math.round(k.dur * FPS) + (k.loop ? 0 : 1);
  const t = makeTrack(kind, frames, { loop: k.loop });
  for (let f = 0; f < frames; f++) fkFrame(k.pose(f / FPS), t.data, f * STRIDE, true);
  if (k.loop) { // the root advance per loop (walk/run), so loops can travel
    const adv = k.pose(k.dur).root || {}, st = k.pose(0).root || {};
    t.loopDelta = [(adv.x || 0) - (st.x || 0), (adv.z || 0) - (st.z || 0)];
  }
  return t;
}
export const TEST_KINDS = Object.keys(KINDS);
