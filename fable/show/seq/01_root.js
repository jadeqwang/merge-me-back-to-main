// 1 · bars 1-8 · 0:00-0:14.0 · pads, arp fades in, hats from b5
// Frame 0 is already her (no fade-in): back three-quarter, standing at the root on the black mirror, main lit behind her, nothing written ahead.
// b3 the first fork: two step apart, the root node glows, their lights run east writing two roads. b5: 4. b7: 8. The camera rises to see it.
import { seg, ss, sm, lerp } from '../kit.js';

// The frame-0 composition (also the film's last frame: seq 16 arrives here so the film loops). tau = seconds relative to frame 0 (may be negative).
export function rootCam(tau) { const k = tau * 0.045, c = Math.cos(0.29), s = Math.sin(0.29); return { pos: [-4.0 + k * c, 1.5, -2.3 + k * s], target: [5.58 + k * c, 0.95, 0.57 + k * s], fov: 35, focusDist: 4.6, aperture: 0.03 }; }
export const ROOT_YAW = Math.PI / 2;

export default function seq(K) {
  const { bar, world: W, cast } = K; const t0 = 0, t1 = bar(9), tF = bar(3);
  const mainLimb = W.heroPath.roads[0]; const sib = W.sets.fork.roads.find((r) => r.def.depth === 1 && r !== mainLimb);
  const c3 = rootCam(tF);
  const crane = K.camPath([{ t: tF, ...c3 }, { t: bar(4), pos: [-5.6, 2.4, -2.6], target: [12, 0.9, 0.4], fov: 35 }, { t: bar(5), pos: [-9, 5.5, -3], target: [60, 0.5, 0], fov: 35 },
    { t: bar(7), pos: [-20, 15, -4], target: [220, 0, 0], fov: 35 }, { t: bar(9), pos: [-36, 34, -4], target: [360, 0, 0], fov: 35 }]);
  // The fork (CHOREO fork_L / fork_R): two coincident Jades take one decisive side step apart; the step lands (track t = 1.0) on b3.
  // Then each walks out along her own road (walk_loop; the step's sideways offset melts into the road) and thins away as the camera rises.
  const tS = tF - 1.0, dF = cast.dur('fork_L'), tW = tS + dF, vW = cast.speed('walk_loop') || 1.14;
  const side = mainLimb.at(8).z < sib.at(8).z ? -1 : 1;                       // which way the hero's road leaves. Facing east, -z is her left.
  const trkH = side < 0 ? 'fork_L' : 'fork_R', trkS = side < 0 ? 'fork_R' : 'fork_L';
  const turn = (a, b, u) => a + Math.atan2(Math.sin(b - a), Math.cos(b - a)) * u;
  const walker = (road, trk, t, ph) => { const e = cast.root(trk, dF), o = cast.rot(ROOT_YAW, e[0], e[2]), a = road.at(Math.min(road.len - 1, (t - tW) * vW + 0.01)), k = 1 - sm(seg(t, tW, tW + 3));
    return { pos: [a.x + o[0] * k, 0, a.z + o[1] * k], yaw: turn(ROOT_YAW, K.yawOf(a), sm(seg(t, tW, tW + 1.5))), track: 'walk_loop', time: t - tW + ph }; };
  return { name: '01_root', t0, t1, frame(t) {
    const camera = t < tF ? rootCam(t) : { ...crane(t), aperture: lerp(0.03, 0, seg(t, tF, bar(5))), focusDist: 4.6 + (t - tF) * 6, far: 30000 };
    const fade = 1 - ss(t, bar(5), bar(7)); const hero = cast.actor('hero'), twin = cast.actor('fork1', { lane: sib.def.color });
    if (t < tS) hero.set({ pos: [0, 0, 0], yaw: ROOT_YAW, track: 'idle', time: t });
    else if (t < tW) { hero.set({ pos: [0, 0, 0], yaw: ROOT_YAW, track: trkH, time: t - tS }); twin.set({ pos: [0, 0, 0], yaw: ROOT_YAW, track: trkS, time: t - tS, vary: 0 }); }
    else if (fade > 0) { hero.set({ ...walker(mainLimb, trkH, t, 0), alpha: fade }); twin.set({ ...walker(sib, trkS, t, 0.31), alpha: fade, vary: 0 }); }
    const pop = Math.exp(-Math.max(0, t - tF) * 1.6) * (t >= tF ? 1 : 0);
    return { camera, world: { text: 0.75, flow: 0.14, headGain: 2.5, headLen: 0.3, canopy: t > bar(4) ? { gain: 1.5 * ss(t, bar(4), bar(6)) } : false, lights: { gain: 1.6, minPx: 1.4 }, minPx: lerp(1.3, 2.2, ss(t, bar(4), bar(7))), halo: 0.3 },
      extra: pop > 0.01 ? [W.glow([{ x: 0, z: 0, r: 2.5 + 4 * (1 - pop), c: [1.2 * pop, 0.55 * pop, 0.2 * pop] }])] : [],
      hud: K.hudMain(t, { count: W.count(t) }) };
  } };
}
