// The figure in the REAL engine: shots that mirror the film's key moments.  --q "shot=N&v=K&tt=<track seconds>"
//   1 frame 0 (night, 3/4 back from her right)   2 night run (v0 behind, v1 side)   3 fork (tt 0.9 / 1.0 / 1.4)
//   4 violet at night (v0 writing, v1 seated)    5 float, top-down                  6 blue hour wedge of 16
//   7 sunrise (v0 butterfly, v1 + 256 wedge, v2 1,024 lying, top-down)             8 day (v0 `free` leap, v1 standing)   9 catch at sunrise
import { Figure, LANES as FL } from '../engine/src/figure/figure.js';
import { loadTrack } from '../engine/src/figure/skeleton.js';
let E, fig, R, L, shot, v, tt, speed = {};
const PI = Math.PI, EAST = PI / 2, LN = ['main', 'rose', 'blue', 'cyan', 'mint', 'gold', 'coral', 'magenta'];
const NEED = { 1: ['idle'], 2: ['run_loop'], 3: ['fork_L', 'fork_R'], 4: ['violet'], 5: ['float'], 6: ['lookback', 'idle'], 7: ['butterfly', 'sidekick', 'float'], 8: ['free', 'idle'], 9: ['catch'] };
const h = (n, q) => { const s = Math.sin(n * q) * 43758.5453; return s - Math.floor(s); };
export async function setup(engine) {
  E = engine; shot = E.param('shot', 1); v = E.param('v', 0); tt = E.param('tt', -1);
  fig = new Figure(E.gl, { fontBase: '/engine/fonts/' }); await fig.init();
  for (const n of NEED[shot]) { const t = await loadTrack('/work_fable/tracks/' + n, n); speed[n] = (t.meta && t.meta.speed) || 0; fig.addTrack(t); }
  const road = (z, color, text, a = 0) => ({ pts: [[-80, z - 80 * a], [0, z], [150, z + 150 * a], [600, z + 600 * a]], color, text, width: 0.035, textSize: 0.36, textSide: 1, flip: true, nodes: [{ s: 80, r: 0.5 }] });
  R = E.roads([road(0, shot === 4 ? '#9B6BFF' : '#FF7A1A', shot === 4 ? 'jade/1420-mhz  listened to hydrogen  ·  docs: start here  ·  for whoever I am next' : 'every road I ran becomes the one  ·  nothing that I lived can come undone'),
    road(-9, '#FF3D7F', 'jade/piano  climbed onto the piano bench before I was three', -0.16), road(11, '#22D3EE', 'jade/phd  how the brain listens, 2010', 0.2), road(-24, '#3DDC97', 'jade/wet-lab  kept the neurons alive, first paper 2005', -0.34), road(30, '#FFD23F', 'jade/violin  second violins, school orchestra', 0.42)], { step: 1.0 });
  L = E.lights(1024);
}
function lights(n, gain) { const d = new Float32Array(n * 7); for (let i = 0; i < n; i++) { const c = FL[LN[i % 8]], x = 60 + 900 * h(i + 1, 12.9), z = (h(i + 1, 78.2) - 0.5) * (300 + x * 1.2), g = gain * (0.5 + 1.5 * h(i + 1, 3.3)); d.set([x, 1.25, z, (c[0] + 0.1) * g, (c[1] + 0.1) * g, (c[2] + 0.1) * g, 0.085], i * 7); } return L.drawable(d, n, { minPx: 1.0 }); }
const wedge = (n, o) => { const a = []; for (let r = 0; a.length < n; r++) for (let k = 0; k <= r && a.length < n; k++) { const i = a.length + 1; a.push({ pos: [-r * 1.9 + (h(i, 12.9) - 0.5) * 0.3, 0, (k - r / 2) * 2.2 + (h(i, 78.2) - 0.5) * 0.3], yaw: EAST, seed: i, lane: FL[LN[i % 8]], story: 1 + (i % 11), ...o(r, k, i) }); } return a; };
export function frame(t) {
  const T = tt >= 0 ? tt : null; let cam, env, inst = [], hud = null, roads = { head: 99, gain: 3.0, textGain: 0.7, flow: 0.1 }, extra = [];
  const night = (o = {}) => ({ dawn: 0.0, ground: { fogDist: 3200 }, grade: { exposure: 1.5, bloom: 0.6, streak: 0.22, vignette: 0.36, saturation: 1.1 }, ...o });
  const rise = (o = {}) => ({ dawn: 0.6, ground: { fogDist: 2400, rough: 1.0 }, grade: { exposure: 1.05, bloom: 0.6, bloomThreshold: 1.2, streak: 0.1, streakThreshold: 2.5, vignette: 0.26, saturation: 1.08 }, ...o });
  const day = (o = {}) => ({ dawn: 1.0, grade: { exposure: 1.75, bloom: 0.25, vignette: 0.2 }, ...o });
  if (shot === 1) { cam = { pos: [-4.3, 1.45, 2.7], target: [0.4, 1.0, -0.1], fov: 30, focusDist: 5.2, aperture: 0.05 }; env = night(); inst = [{ pos: [0, 0, 0], yaw: EAST, track: 'idle', time: T ?? 3 + t, lane: FL.main }]; extra = [lights(600, 5)]; hud = { branch: 'main', color: '#FF7A1A', ctx: 0.02, count: 1 }; }
  else if (shot === 2) { const x = speed.run_loop * (2 + t); cam = v ? { pos: [x + 1.2, 1.1, -5.6], target: [x + 0.3, 1.0, 0], fov: 30, focusDist: 5.7, aperture: 0.09 } : { pos: [x - 4.6, 1.5, 1.6], target: [x + 2, 1.0, -0.2], fov: 32, focusDist: 5, aperture: 0.09 }; env = night(); inst = [{ pos: [x, 0, 0], yaw: EAST, track: 'run_loop', time: T ?? 2 + t, lane: FL.main }]; extra = [lights(600, 5)]; hud = { branch: 'jade/down-every-road', color: '#FF7A1A', ctx: 0.3 }; }
  else if (shot === 3) { cam = { pos: [4.6, 1.3, -2.6], target: [0.2, 0.95, 0], fov: 30 }; env = night(); const tk = T ?? 1.0; inst = [{ pos: [0, 0, 0], yaw: EAST, track: 'fork_L', time: tk, lane: FL.main }, { pos: [0, 0, 0], yaw: EAST, track: 'fork_R', time: tk, lane: FL.rose, seed: 7, vary: 0 }]; extra = [lights(400, 4)]; hud = { branch: 'main', color: '#FF7A1A', count: 2 }; }
  else if (shot === 4) { const tk = T ?? (v ? 27 : 18.5); cam = v ? { pos: [-3.6, 1.0, -3.2], target: [0, 0.6, 0], fov: 30 } : { pos: [3.4, 1.35, -2.9], target: [0, 1.1, 0], fov: 30 }; env = night(); inst = [{ pos: [-34.73, 0, 0], yaw: EAST, track: 'violet', time: tk,  lane: FL.violet, variant: 'bun', story: 12 }]; extra = [lights(60, 3)]; hud = { branch: 'jade/1420-mhz', color: '#9B6BFF', ctx: 0.97 }; }
  else if (shot === 5) { cam = { pos: [0, 6.2, 0.01], target: [0, 0, 0], fov: 30 }; env = night({ ground: { ripple: 0.5 } }); inst = [{ pos: [0, 0, 0], yaw: 0, track: 'float', time: T ?? 6, lane: FL.main }]; roads = null; }
  else if (shot === 6) { cam = { pos: [5.5, 1.7, -7.5], target: [-5, 1.0, 0.5], fov: 34 }; env = { dawn: 0.35, ground: { fogDist: 3000 }, grade: { exposure: 1.45, bloom: 0.55, streak: 0.2, vignette: 0.32, saturation: 1.1 } }; inst = wedge(16, (r, k, i) => ({ track: i % 3 ? 'idle' : 'lookback', time: 1 + 9 * h(i, 5.1) })); extra = [lights(500, 4)]; }
  else if (shot === 7) {
    env = rise();
    if (v === 2) { cam = { pos: [0, 62, 0.01], target: [0, 0, 0], fov: 35, near: 5, far: 500 }; for (let i = 0; i < 1024; i++) inst.push({ pos: [((i % 32) - 15.5) * 2.4, 0, (Math.floor(i / 32) - 15.5) * 2.0], yaw: 0, track: 'float', time: 1 + 20 * h(i + 1, 5.1), seed: i + 1, lane: FL[LN[i % 8]] }); roads = null; }
    else { cam = { pos: [-5.2, 0.55, 0.8], target: [1.0, 1.55, -0.1], fov: 46 }; inst = [{ pos: [0, 0, 0], yaw: EAST + (v ? 0 : 0.9), track: 'butterfly', time: T ?? 1.16, lane: FL.main }];
      if (v === 1) inst.push(...wedge(256, (r, k, i) => ({ track: 'sidekick', time: 1.2 - 0.03 * r })).map((o) => ({ ...o, pos: [5 - o.pos[0], 0, o.pos[2]] })).slice(1)); }
  }
  else if (shot === 8) { env = day(); roads.ink = true; if (v) { cam = { pos: [3.8, 1.3, -3.4], target: [0, 0.95, 0], fov: 30 }; inst = [{ pos: [0, 0, 0], yaw: EAST, track: 'idle', time: T ?? 3, lane: FL.main }]; } else { cam = { pos: [3.2, 1.0, -5.2], target: [0.2, 1.15, 0], fov: 32 }; inst = [{ pos: [0, 0, 0], yaw: EAST, track: 'free', time: T ?? 1.74, lane: FL.main }]; } }
  else { cam = { pos: [-4.6, 1.0, 1.4], target: [0.6, 1.2, 0], fov: 34 }; env = rise(); inst = [{ pos: [0, 0, 0], yaw: EAST, track: 'catch', time: T ?? 12.7, lane: FL.main }]; }
  fig.begin(); for (const o of inst) fig.add(o);
  return { camera: cam, env, drawables: [...(roads ? [R.drawable(roads)] : []), ...extra, fig], hud };
}
