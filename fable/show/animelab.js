// ANIME look-dev lab (fable/notes/anime_lookdev.md): the CURRENT figure and the ANIME figure in the same poses and lights, in the real engine.
//   node fable/tools/render.mjs --show /fable/show/animelab.js --q "mode=A" --res 960x720 --stills 0:a0.png,1:a1.png,...
// In the still modes the time is a CELL INDEX (t = 0, 1, 2 ...). --q "fig=both|old|anime" (default both: current on screen-left, anime on screen-right).
//   mode=A  turnaround, day, idle: cells 0-7 = 8 angles
//   mode=F  face close-ups (anime; cells 20-22 = the current figure): 0-5 views, 6-10 expressions front, 11-15 expressions 3/4, 16-19 gaze / blink
//   mode=B  the lighting arc: 3 poses x (night main, night violet + bun, sunrise against the sun, sunrise three-quarter, day): cell = pose * 5 + light
//   mode=C  action: cell = row * 6 + k; rows run_loop (night), drop (sunrise), violet (night, bun), catch (day), free (day)
//   mode=X  crowd of 64: cell 0 night, 1 sunrise        mode=P  perf: cell 0 = 1,024 far, 1 = hero + 255, 2 = one hero close (use with --bench)
//   mode=D  clip, t in seconds: 0-3 `free` by day, 3-6 `violet` at night; --q "mode=D&cam=head" follows the head (face stability check)
//   mode=M  medium / detail checks: 0 half body front, 1 back three-quarter (disc, RARE EARTH), 2 bun close, 3-5 right hand (fist, relaxed, splayed),
//           6 the figure at 1/3 of frame height (crop to judge the face at film size), 7 float top-down, 8 violet seated close, 9 catch open half body
//   mode=Z  one custom cell: --q "mode=Z&track=idle&tt=3&turn=0.5&el=0&dist=5&light=day&expr=joy&hand=1&variant=bun&ty=0.95&fov=30"
import { Figure as FigOld, LANES as FL } from '../engine/src/figure/figure.js';
import { Figure as FigNew } from '../engine/src/figure_anime/figure.js';
import { loadTrack } from '../engine/src/figure/skeleton.js';

let E, figs = {}, R = {}, L, mode, which, tracks = {}, camMode;
const PI = Math.PI, DEG = PI / 180, LN = ['main', 'rose', 'blue', 'cyan', 'mint', 'gold', 'coral', 'magenta'];
const h = (n, q) => { const s = Math.sin(n * q) * 43758.5453; return s - Math.floor(s); };
const NEED = { A: ['idle'], F: ['idle'], B: ['idle', 'run_loop', 'catch'], C: ['run_loop', 'drop', 'violet', 'catch', 'free'], X: ['run_loop', 'build'], M: ['idle', 'float', 'violet', 'catch'], P: ['float', 'idle', 'sidekick'], D: ['free', 'violet'], Z: [] };

export async function setup(engine) {
  E = engine; mode = String(E.param('mode', 'A')); which = String(E.param('fig', 'both')); camMode = String(E.param('cam', ''));
  const need = mode === 'Z' ? [String(E.param('track', 'idle'))] : NEED[mode];
  for (const n of need) tracks[n] = await loadTrack('/work_fable/tracks/' + n, n);
  if (which !== 'anime') { figs.old = new FigOld(E.gl, { fontBase: '/engine/fonts/' }); await figs.old.init(); }
  if (which !== 'old') { figs.anime = new FigNew(E.gl, { fontBase: '/engine/fonts/' }); await figs.anime.init(); }
  if (figs.anime && E.param('noclump', 0)) figs.anime.debugNoClump = true;
  for (const k in figs) for (const n of need) { const t0 = performance.now(); figs[k].addTrack(tracks[n]); if (E.param('log', 0)) console.log(k, n, 'sim', Math.round(performance.now() - t0), 'ms'); }
  const road = (z, color, text, a = 0) => ({ pts: [[-80, z - 80 * a], [0, z], [150, z + 150 * a], [600, z + 600 * a]], color, text, width: 0.035, textSize: 0.36, textSide: 1, flip: true, nodes: [] });
  const far = [road(-9, '#FF3D7F', 'jade/piano  climbed onto the piano bench before I was three', -0.16), road(11, '#22D3EE', 'jade/phd  how the brain listens, 2010', 0.2), road(-24, '#3DDC97', 'jade/wet-lab  kept the neurons alive, first paper 2005', -0.34), road(30, '#FFD23F', 'jade/violin  second violins, school orchestra', 0.42)];
  R.main = E.roads([road(0, '#FF7A1A', 'every road I ran becomes the one  ·  nothing that I lived can come undone'), ...far], { step: 1.0 });
  R.violet = E.roads([road(0, '#9B6BFF', 'jade/1420-mhz  listened to hydrogen  ·  docs: start here  ·  for whoever I am next'), ...far], { step: 1.0 });
  L = E.lights(1024);
}
function lights(n, gain) { const d = new Float32Array(n * 7); for (let i = 0; i < n; i++) { const c = FL[LN[i % 8]], x = 60 + 900 * h(i + 1, 12.9), z = (h(i + 1, 78.2) - 0.5) * (300 + x * 1.2), g = gain * (0.5 + 1.5 * h(i + 1, 3.3)); d.set([x, 1.25, z, (c[0] + 0.1) * g, (c[1] + 0.1) * g, (c[2] + 0.1) * g, 0.085], i * 7); } return L.drawable(d, n, { minPx: 1.0 }); }
const ENV = {
  night: () => ({ dawn: 0.0, ground: { fogDist: 3200 }, grade: { exposure: 1.5, bloom: 0.6, streak: 0.22, vignette: 0.36, saturation: 1.1 } }),
  rise: () => ({ dawn: 0.6, ground: { fogDist: 2400, rough: 1.0 }, grade: { exposure: 1.05, bloom: 0.6, bloomThreshold: 1.2, streak: 0.1, streakThreshold: 2.5, vignette: 0.26, saturation: 1.08 } }),
  blue: () => ({ dawn: 0.35, ground: { fogDist: 3000 }, grade: { exposure: 1.45, bloom: 0.55, streak: 0.2, vignette: 0.32, saturation: 1.1 } }),
  day: () => ({ dawn: 1.0, grade: { exposure: 1.75, bloom: 0.25, vignette: 0.2 } }),
};
// a joint of a track at track time T (track space)
// which way the head faces at track time T (yaw about +Y in track space), so the face cells are turned relative to the HEAD, not the hips
function headYaw(name, T) { const tr = tracks[name], F = tr.frames; let f = T * (tr.fps || 60); if (tr.loop) f = ((f % F) + F) % F; else f = Math.min(F - 1, Math.max(0, f)); const b = Math.floor(f) * 147 + 4 * 7 + 3, x = tr.data[b], y = tr.data[b + 1], z = tr.data[b + 2], w = tr.data[b + 3]; return Math.atan2(2 * (x * z + w * y), 1 - 2 * (x * x + y * y)); }
function jointAt(name, T, j) { const tr = tracks[name], F = tr.frames; let f = T * (tr.fps || 60); if (tr.loop) f = ((f % F) + F) % F; else f = Math.min(F - 1, Math.max(0, f)); const b = Math.floor(f) * 147 + j * 7; return [tr.data[b], tr.data[b + 1], tr.data[b + 2]]; }
const rot = (yaw, x, z) => [Math.cos(yaw) * x + Math.sin(yaw) * z, -Math.sin(yaw) * x + Math.cos(yaw) * z];
// LIGHT presets: env + camera azimuth (direction from her to the camera, from +X toward +Z) + road
const LIGHT = {
  day: { env: 'day', az: 0.17, road: 'main', lane: 'main' },
  night: { env: 'night', az: 0.35, road: 'main', lane: 'main' },
  nightV: { env: 'night', az: 0.35, road: 'violet', lane: 'violet', variant: 'bun' },
  rise: { env: 'rise', az: PI, road: 'main', lane: 'main' },          // against the sun
  riseQ: { env: 'rise', az: -1.05, road: 'main', lane: 'main' },      // three-quarter: the sun rakes her from camera-right
  blue: { env: 'blue', az: 0.35, road: 'main', lane: 'main' },
};
// one cell: the same instance drawn by each figure, side by side across the screen
function cell(c) {
  const lt = LIGHT[c.light || 'day'], az = c.az ?? lt.az, el = (c.el || 0), dist = c.dist || 5, sep = c.sep ?? 1.25, name = c.track, T = c.T || 0;
  const yaw = PI / 2 - az + (c.turn || 0) - (c.head && c.aim === undefined ? headYaw(name, T) : 0), right = [Math.sin(az), 0, -Math.cos(az)], both = which === 'both' && !c.only;
  const hip = jointAt(name, T, 0), o = rot(yaw, hip[0], hip[2]), inst = {};
  if (c.aim !== undefined) c.head = true;                    // aim: a joint index to look at (head: the head joint)
  const tj = c.head ? jointAt(name, T, c.aim ?? 4) : hip, to = rot(yaw, tj[0] - hip[0], tj[2] - hip[2]), ty = c.head ? tj[1] + (c.aim === undefined ? 0.045 : 0.03) : (c.ty ?? 0.95);
  const cam = { pos: [dist * Math.cos(el) * Math.cos(az) + (c.head ? to[0] : 0), ty + dist * Math.sin(el) + (c.camY || 0), dist * Math.cos(el) * Math.sin(az) + (c.head ? to[1] : 0)], target: [c.head ? to[0] : 0, ty, c.head ? to[1] : 0], fov: c.fov || 30 };
  for (const k of ['old', 'anime']) {
    if (!figs[k] || (c.only && c.only !== k)) continue;
    const s = both ? (k === 'old' ? -sep / 2 : sep / 2) : 0, ctr = [right[0] * s, 0, right[2] * s], pos = [ctr[0] - o[0], 0, ctr[2] - o[1]];
    const dTrue = Math.hypot(cam.pos[0] - ctr[0], cam.pos[1] - 0.9, cam.pos[2] - ctr[2]), dPos = Math.hypot(cam.pos[0] - pos[0], cam.pos[1] - 0.9, cam.pos[2] - pos[2]);
    inst[k] = [{ pos, yaw, track: name, time: T, lane: FL[c.lane || lt.lane], variant: c.variant ?? lt.variant, face: c.face, hand: c.hand, lodBias: Math.max(1, dPos / dTrue), seed: c.seed }];
  }
  return { cam, env: ENV[lt.env](), inst, road: lt.road, night: lt.env === 'night' || lt.env === 'blue', day: lt.env === 'day' };
}
const F = (expr, o = {}) => ({ expr, ...o });
function cellsFor(i, t) {
  if (mode === 'A') return cell({ track: 'idle', T: 3, turn: i * 45 * DEG, light: 'day', dist: 4.6, sep: 1.05 });
  if (mode === 'F') {
    const V = [[0, 0], [35, 0], [90, 0], [140, 0], [25, 35], [-25, -30]], EX = ['neutral', 'determined', 'joy', 'back', 'calm'];
    let v = V[0], face = F('neutral'), only = 'anime';
    if (i < 6) v = V[i]; else if (i < 11) face = F(EX[i - 6], i === 9 ? { gaze: [0.8, 0.1] } : {}); else if (i < 16) { v = V[1]; face = F(EX[i - 11], i === 14 ? { gaze: [-0.9, 0.1] } : {}); }
    else if (i < 20) { face = [F('neutral', { gaze: [-0.9, 0] }), F('neutral', { gaze: [0.6, 0.8] }), F('neutral', { blink: 0.55 }), F('neutral', { gaze: [0, -0.9] })][i - 16]; if (i === 19) v = V[1]; }
    else { only = 'old'; v = V[[0, 1, 2][i - 20] ?? 0]; }
    return cell({ track: 'idle', T: 3, turn: v[0] * DEG, el: v[1] * DEG, light: String(E.param('light', 'day')), dist: 1.15, fov: 20, head: true, face: { blink: 0, ...face }, only });
  }
  if (mode === 'B') {
    const P = [{ track: 'idle', T: 3, turn: 30 * DEG }, { track: 'run_loop', T: 0.25, turn: 75 * DEG, hand: 1, face: F('determined') }, { track: 'catch', T: 12.9, turn: 20 * DEG, hand: -1, face: F('joy') }][Math.floor(i / 5) % 3];
    return cell({ ...P, light: ['night', 'nightV', 'rise', 'riseQ', 'day'][i % 5], dist: 5.2 });
  }
  if (mode === 'C') {
    const row = Math.floor(i / 6) % 5, k = i % 6;
    if (row === 0) return cell({ track: 'run_loop', T: k * 0.128, turn: 70 * DEG, light: 'night', hand: 1, face: F('determined'), dist: 5.2 });
    if (row === 1) return cell({ track: 'drop', T: [0.63, 1.30, 1.42, 1.50, 1.75, 3.24][k], turn: 60 * DEG, light: 'riseQ', hand: k > 0 && k < 4 ? -0.6 : 1, face: F('determined'), dist: 6.6, ty: 1.05, sep: 2.3 });
    if (row === 2) return cell({ track: 'violet', T: [16.5, 17.5, 18.5, 19.5, 24, 27][k], turn: 40 * DEG, light: 'nightV', variant: k === 0 ? 'bun' : k < 4 ? 'bun_write' : 'bun_one', face: F(k < 4 ? 'determined' : 'back', { amt: 0.7 }), dist: 5.2, ty: k > 3 ? 0.7 : 0.95 });
    if (row === 3) return cell({ track: 'catch', T: [2.2, 2.74, 5, 9.6, 12.0, 12.9][k], turn: 25 * DEG, light: 'day', hand: k > 3 ? -1 : 0, face: F(k > 4 ? 'joy' : k > 2 ? 'back' : 'neutral'), dist: 5.6, sep: 1.6 });
    return cell({ track: 'free', T: [1.2, 1.74, 2.6, 3.48, 4.5, 5.9][k], turn: 35 * DEG, light: 'day', hand: -0.5, face: F(k === 1 || k === 3 ? 'joy' : 'neutral'), dist: 6.0, ty: 1.05, sep: 1.8 });
  }
  if (mode === 'M') {
    if (i === 0) return cell({ track: 'idle', T: 3, turn: 15 * DEG, light: 'day', dist: 2.7, ty: 1.22, sep: 0.95 });
    if (i === 1) return cell({ track: 'idle', T: 3, turn: 150 * DEG, light: 'day', dist: 2.7, ty: 1.22, sep: 0.95 });
    if (i === 2) return cell({ track: 'idle', T: 3, turn: 40 * DEG, light: 'day', dist: 1.5, fov: 22, head: true, variant: 'bun', only: 'anime' });
    if (i < 6) return cell({ track: 'idle', T: 3, turn: -40 * DEG, light: 'day', dist: 0.75, fov: 24, aim: 12, hand: [1, 0, -1][i - 3], only: 'anime' });
    if (i === 6) return cell({ track: 'idle', T: 3, turn: 20 * DEG, light: 'day', dist: 9.6, ty: 0.9, sep: 1.3 });
    if (i === 7) return cell({ track: 'float', T: 6, turn: 0, az: 0.0, el: 89 * DEG, light: 'night', dist: 5.0, ty: 0, sep: 2.4 });
    if (i === 8) return cell({ track: 'violet', T: 27, turn: 40 * DEG, light: 'nightV', variant: 'bun_one', dist: 2.6, ty: 0.75, sep: 1.1, face: F('back', { gaze: [-0.5, 0.2] }) });
    return cell({ track: 'catch', T: 12.9, turn: 20 * DEG, light: 'day', dist: 2.9, ty: 1.25, sep: 1.5, hand: -1, face: F('joy') });
  }
  if (mode === 'Z') {
    const expr = String(E.param('expr', 'neutral')), v = E.param('variant', '');
    return cell({ track: String(E.param('track', 'idle')), T: E.param('tt', 3), turn: E.param('turn', 0), el: E.param('el', 0), dist: E.param('dist', 5), fov: E.param('fov', 30), ty: E.param('ty', 0.95), head: !!E.param('head', 0), light: String(E.param('light', 'day')),
      face: { expr, gaze: [E.param('gx', 0), E.param('gy', 0)] }, hand: E.param('hand', 0), variant: v ? String(v) : undefined, sep: E.param('sep', 1.25) });
  }
  if (mode === 'D') {
    const violet = t >= 3 - 0.009, tl = violet ? Math.max(0, t - 3) : t;   // (the cut sits just before frame 90, so its motion-blur samples do not straddle it)
    const name = violet ? 'violet' : 'free', T = violet ? 17.0 + tl : 1.0 + tl, head = camMode === 'head';
    return cell({ track: name, T, turn: (violet ? 40 : 35) * DEG, light: violet ? 'nightV' : 'day', variant: violet ? (T < 17.4 ? 'bun' : 'bun_write') : undefined, dist: head ? 1.5 : (violet ? 4.6 : 5.6), fov: head ? 22 : 30, head, ty: 1.0, sep: head ? 0.62 : (violet ? 1.3 : 1.7),
      hand: violet ? undefined : -0.4, face: violet ? F('determined', { amt: 0.6 }) : F('joy', { amt: Math.max(0, 1 - Math.abs(tl - 0.74) / 0.35), blink: undefined }) });
  }
  return null;
}
function crowd(i) {
  const inst = [], n = 64, rise = i === 1, env = rise ? ENV.rise() : ENV.night();
  for (let k = 0; k < n; k++) { const r = Math.floor(k / 8), c = k % 8; inst.push({ pos: [(3.5 - r) * 2.1 + (h(k + 1, 12.9) - 0.5) * 0.5, 0, (c - 3.5) * 1.9 + (h(k + 1, 78.2) - 0.5) * 0.5], yaw: PI / 2, track: rise ? 'build' : 'run_loop', time: rise ? 6.95 - 0.02 * r + 0.3 * Math.floor(h(k + 1, 5.1) * 3) : 1 + 3 * h(k + 1, 5.1), seed: k + 1, lane: FL[LN[k % 8]], hand: 1, face: { expr: 'determined' } }); }
  const cam = rise ? { pos: [-13, 1.5, 3.2], target: [1, 1.0, 0], fov: 36 } : { pos: [13.5, 2.6, 6.5], target: [0, 0.8, 0], fov: 36 };
  return { cam, env, inst, night: !rise, road: 'main' };
}
function perf(i) {
  const inst = [];
  if (i === 0) { for (let k = 0; k < 1024; k++) inst.push({ pos: [((k % 32) - 15.5) * 2.4, 0, (Math.floor(k / 32) - 15.5) * 2.0], yaw: 0, track: 'float', time: 1 + 20 * h(k + 1, 5.1), seed: k + 1, lane: FL[LN[k % 8]] }); return { cam: { pos: [0, 62, 0.01], target: [0, 0, 0], fov: 35, near: 5, far: 500 }, env: ENV.rise(), inst }; }
  if (i === 1) { for (let r = 0, k = 0; k < 256; r++) for (let c = 0; c <= r && k < 256; c++, k++) inst.push({ pos: [5 + r * 1.9 + (h(k + 1, 12.9) - 0.5) * 0.3, 0, (c - r / 2) * 2.2 + (h(k + 1, 78.2) - 0.5) * 0.3], yaw: PI / 2, seed: k, lane: FL[LN[k % 8]], track: 'sidekick', time: 1.2 - 0.03 * r }); return { cam: { pos: [-5.2, 0.55, 0.8], target: [1.0, 1.55, -0.1], fov: 46 }, env: i === 1 && E.param('light', 'rise') === 'day' ? ENV.day() : ENV.rise(), inst }; }
  inst.push({ pos: [0, 0, 0], yaw: PI / 2 - 0.3, track: 'idle', time: 3, lane: FL.main });
  return { cam: { pos: [3.2, 1.3, 1.2], target: [0, 1.0, 0], fov: 30 }, env: ENV[String(E.param('light', 'day'))](), inst };
}
export function frame(t) {
  const i = Math.round(t); let cam, env, extra = [], draw = [], road = null;
  if (mode === 'X' || mode === 'P') {
    const c = mode === 'X' ? crowd(i) : perf(i); cam = c.cam; env = c.env; road = c.road;
    const k = which === 'old' ? 'old' : 'anime', fg = figs[k]; fg.begin(); for (const o of c.inst) fg.add(o); draw.push(fg); if (c.night) extra = [lights(600, 5)];
  } else {
    const c = cellsFor(i, t); cam = c.cam; env = c.env; road = c.road; if (c.night) extra = [lights(600, 5)];
    for (const k in c.inst) { const fg = figs[k]; fg.begin(); for (const o of c.inst[k]) fg.add(o); draw.push(fg); }
  }
  const roads = road ? [R[road].drawable({ head: 99, gain: 3.0, textGain: 0.7, flow: 0.1, ink: env.dawn > 0.9 })] : [];
  return { camera: cam, env, drawables: [...roads, ...extra, ...draw], hud: null };
}
