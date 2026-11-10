// Performance reel: ONE track on the hero, in the real engine, at song time (so --audio lines up).
//   --q "track=drop&cam=front|side|side2|top|orbit|tq|back&dawn=0.6&crowd=64&yaw=<deg>&dist=<m>&variant=bun&lane=violet&pair=fork_R&fov=32&lift=<m>"
// Song-timed tracks (meta.song_t0) play at  time = t - song_t0 ; others start at t = 0 (override with t0=<s>).
// In-place loops travel along her facing at meta.speed. Stage: track +Z = downstage; cam=front looks EAST (toward the sun) with her facing
// the camera (track +Z -> world -X), so sunrise shots are silhouettes against the sun.
// HUD: "<track> b<bar>.<beat>" + the ctx meter flashes on every beat (full on a beat, emptying); the dot turns white on bar lines.
// A small light beside the stage flashes on beats (big on bar lines).
import { Figure, LANES as FL } from '../engine/src/figure/figure.js';
import { loadTrack } from '../engine/src/figure/skeleton.js';
let E, fig, R, L, P = {}, trk, pair = null, hipsXZ;
const PI = Math.PI, LN = ['main', 'rose', 'blue', 'cyan', 'mint', 'gold', 'coral', 'magenta'];
const h = (n, q) => { const s = Math.sin(n * q) * 43758.5453; return s - Math.floor(s); };
export async function setup(engine) {
  E = engine;
  P = { track: E.param('track', 'drop'), cam: E.param('cam', 'front'), dawn: E.param('dawn', 0.6), crowd: E.param('crowd', 0), yaw: E.param('yaw', 0) * PI / 180,
    dist: E.param('dist', 0), variant: E.param('variant', ''), lane: E.param('lane', 'main'), pair: E.param('pair', ''), t0: E.param('t0', NaN), fov: E.param('fov', 0), lift: E.param('lift', 0), under: E.param('under', NaN), sp: E.param('sp', 2.2) };
  fig = new Figure(E.gl, { fontBase: '/engine/fonts/' }); await fig.init();
  trk = await loadTrack('/work_fable/tracks/' + P.track, P.track); fig.addTrack(trk);
  if (P.pair) { pair = await loadTrack('/work_fable/tracks/' + P.pair, P.pair); fig.addTrack(pair); }
  // smoothed hips path (track space) for the camera to follow
  const F = trk.frames, d = trk.data, w = 45; hipsXZ = new Float32Array(F * 2);
  const px = new Float64Array(F + 1), pz = new Float64Array(F + 1);
  for (let i = 0; i < F; i++) { px[i + 1] = px[i] + d[i * 147]; pz[i + 1] = pz[i] + d[i * 147 + 2]; }
  for (let i = 0; i < F; i++) { const a = Math.max(0, i - w), b = Math.min(F, i + w + 1); hipsXZ[i * 2] = (px[b] - px[a]) / (b - a); hipsXZ[i * 2 + 1] = (pz[b] - pz[a]) / (b - a); }
  const col = { main: '#FF7A1A', violet: '#9B6BFF', rose: '#FF3D7F', cyan: '#22D3EE' }[P.lane] || '#FF7A1A';
  const road = (z, color, text) => ({ pts: [[-300, z], [0, z], [300, z], [900, z]], color, text, width: 0.035, textSize: 0.36, textSide: 1, flip: true });
  R = E.roads([road(0, col, 'every road I ran becomes the one  ·  nothing that I lived can come undone'), road(-14, '#22D3EE', 'jade/phd  how the brain listens, 2010'), road(16, '#FF3D7F', 'jade/piano  climbed onto the piano bench before I was three')], { step: 1.0 });
  L = E.lights(64);
}
const songT0 = () => (isNaN(P.t0) ? (trk.meta.song_t0 ?? 0) : P.t0);
export function frame(t) {
  const dur = trk.loop ? trk.frames / 60 : (trk.frames - 1) / 60;
  let tk = t - songT0(); const travelT = Math.max(0, tk);
  if (trk.loop) tk = ((tk % dur) + dur) % dur; else tk = Math.min(dur, Math.max(0, tk));
  const dawn = P.dawn, top = P.cam === 'top';
  // her facing: track +Z -> world direction. front cam is at -X looking +X (east): she faces -X.
  const yaw = -PI / 2 + P.yaw, cy = Math.cos(yaw), sy = Math.sin(yaw);
  const toW = (x, z) => [x * cy + z * sy, -x * sy + z * cy];               // track xz -> world xz (figure yaw rotates +Z toward +X at yaw = PI/2)
  const travel = trk.loop && trk.meta.speed ? trk.meta.speed * travelT : 0;
  const base = toW(0, travel);                                             // instance origin (loops travel along her facing)
  const fi = Math.min(trk.frames - 1, Math.round(tk * 60)), hp = toW(hipsXZ[fi * 2], hipsXZ[fi * 2 + 1]);
  const c = [base[0] + hp[0], base[1] + hp[1]];                            // smoothed hips, world
  const wide = P.crowd >= 1024 ? 4.2 : P.crowd >= 64 ? 2.1 : P.crowd > 0 ? 1.5 : 1;
  const D = (P.dist || 5.6) * wide;
  let cam;
  if (P.cam === 'front') cam = { pos: [c[0] - D, 0.9 + 0.5 * (wide - 1) * 2.2 + P.lift, c[1] + 0.6], target: [c[0], 1.0 + P.lift * 0.3, c[1]], fov: P.fov || 30 };
  else if (P.cam === 'back') cam = { pos: [c[0] + D, 1.3 + P.lift, c[1] + 0.9], target: [c[0], 1.0, c[1]], fov: P.fov || 30 };
  else if (P.cam === 'side') cam = { pos: [c[0] + 0.5, 1.0 + P.lift, c[1] - D], target: [c[0], 1.0, c[1]], fov: P.fov || 30 };
  else if (P.cam === 'side2') cam = { pos: [c[0] + 0.5, 1.0 + P.lift, c[1] + D], target: [c[0], 1.0, c[1]], fov: P.fov || 30 };
  else if (P.cam === 'tq') cam = { pos: [c[0] - D * 0.75, 1.35 + P.lift, c[1] - D * 0.62], target: [c[0], 0.95, c[1]], fov: P.fov || 30 };
  else if (P.cam === 'orbit') { const a = t * 0.35; cam = { pos: [c[0] - D * Math.cos(a), 1.2 + P.lift, c[1] + D * Math.sin(a)], target: [c[0], 1.0, c[1]], fov: P.fov || 30 }; }
  else cam = { pos: [c[0] - 0.02, (P.dist || 7.5) * wide * (P.crowd >= 1024 ? 2 : 1), c[1]], target: [c[0], 0, c[1]], fov: P.fov || 32, near: 0.5, far: 900 };
  const env = dawn >= 0.9 ? { dawn, grade: { exposure: 1.75, bloom: 0.25, vignette: 0.2 } }
    : dawn >= 0.5 ? { dawn, ground: { fogDist: 2400, rough: 1.0 }, grade: { exposure: 1.05, bloom: 0.6, bloomThreshold: 1.2, streak: 0.1, streakThreshold: 2.5, vignette: 0.26, saturation: 1.08 } }
    : { dawn, ground: { fogDist: 3200 }, grade: { exposure: 1.5, bloom: 0.6, streak: 0.22, vignette: 0.36, saturation: 1.1 } };
  if (!isNaN(P.under)) env.figLight = { under: P.under };
  fig.begin();
  const hero = { pos: [base[0], 0, base[1]], yaw, track: P.track, time: tk, lane: FL[P.lane] || FL.main, variant: P.variant || undefined };
  fig.add(hero);
  if (pair) fig.add({ ...hero, track: P.pair, time: Math.min(tk, (pair.frames - 1) / 60), lane: FL.rose, seed: 7, vary: 0 });
  if (P.crowd > 0) {       // wedge behind her (away from the front camera), 2.2 m spacing, varied seeds
    let n = 0; for (let r = 1; n < P.crowd - 1; r++) for (let k = 0; k <= r && n < P.crowd - 1; k++) { n++;
      const lx = (k - r / 2) * P.sp, lz = -r * P.sp * 0.87, w = toW(lx, lz);
      fig.add({ pos: [base[0] + w[0], 0, base[1] + w[1]], yaw, track: P.track, time: tk, lane: FL[LN[n % 8]], seed: n + 1, variant: P.variant || undefined }); }
  }
  // beat light beside the stage + HUD
  const bar = E.time.barAt(t), bi = Math.floor(bar), beat = Math.floor((bar - bi) * 4) + 1, bp = E.time.pulse(t, { decay: 9 }), brp = E.time.barPulse(t, 7);
  const ld = new Float32Array(7), g = 2 + 40 * bp + 160 * brp, sidew = toW(top ? 2.6 : 2.4, top ? 0 : -0.5);
  ld.set([c[0] + sidew[0], 0.08, c[1] + sidew[1], g, g, g * 0.9, 0.05 + 0.1 * brp], 0);
  const drawables = [R.drawable({ head: 9999, gain: 3.0, textGain: 0.7, flow: 0.1, ink: dawn > 0.9 }), L.drawable(ld, 1, { minPx: 2.0 }), fig];
  const hud = { branch: `${P.track}  b${bi}.${beat}`, hash: (t - songT0()).toFixed(2) + 's', color: brp > 0.5 ? '#FFFFFF' : '#FF7A1A', ctx: bp, ink: dawn > 0.5 ? 1 : 0 };
  return { camera: cam, env, drawables, hud };
}
