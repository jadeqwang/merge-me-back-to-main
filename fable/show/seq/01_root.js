// 1 · bars 1-8 · 0:00-0:14.0 · pads, arp fades in, hats from b5
// Frame 0 is already her (no fade-in): back three-quarter from her right, standing at the root on the black mirror, RARE EARTH between the parted hair,
// main and its message ("where I started from") running in from the west to the ring under her feet, nothing written ahead.
// b3 the first fork: two step apart (fork_L / fork_R, the step lands on the bar), the node lights. They walk off on their own roads, which are written
// under their feet; b5 each becomes two (4), b7 again (8). The camera cranes up and back and keeps all of them in frame. b9: cut to the tree from above.
//
// The people fork at HUMAN scale here (limbs of 3-5 m, walked at walk_loop's own speed), on a small local tree with the world tree's lanes and messages.
// The world's own first limbs are 150 m long (they are what seq 2 sees from 400 m up); they are not drawn in this sequence.
import { seg, ss, sm, lerp } from '../kit.js';

// The frame-0 composition (also the film's last frame: seq 16 imports this, so the film loops). tau = seconds relative to frame 0 (may be negative).
// She stands at the root (0, 0, 0) facing east (ROOT_YAW). The camera is 3.9 m away, behind her and on her RIGHT (south): she is in the right third.
const C0 = { pos: [-3.31, 1.3, 2.07], target: [2.08, 0.74, -3.14] };
export function rootCam(tau) { const k = tau * 0.04, dx = C0.target[0] - C0.pos[0], dz = C0.target[2] - C0.pos[2], l = Math.hypot(dx, dz);
  return { pos: [C0.pos[0] + (k * dx) / l, C0.pos[1], C0.pos[2] + (k * dz) / l], target: [C0.target[0] + (k * dx) / l, C0.target[1], C0.target[2] + (k * dz) / l], fov: 35, focusDist: 3.9, aperture: 0.03 }; }
export const ROOT_YAW = Math.PI / 2;
// The world as frame 0 sees it (seq 16: `world: rootWorld(tau)` with the same tau makes the last frame the first, far lights included).
export const rootWorld = (tau) => ({ head: tau, fork: { hide: true }, canopy: false, text: 0.85, flow: 0, gain: 2.4, halo: 0.3, lights: { t: tau, almond: false, gain: 1.7, minPx: 1.4, air: 900 }, art: { gain: 1.5 } });

export default function seq(K) {
  const { bar, world: W, cast, E } = K; const t0 = 0, t1 = bar(9), tF = bar(3), TFK = [tF, bar(5), bar(7), t1];
  const tS = tF - 1.0, dF = cast.dur('fork_L');                                 // fork_L / fork_R: the step lands at track t = 1.0
  const RATE = 1.08, vW = (cast.speed('walk_loop') || 1.144) * RATE, per = cast.dur('walk_loop');
  // ---- hand-over from the fork's last pose to the walk: the moment and stride phase where the two poses are nearest (hips-relative joints)
  const poseD = (trkA, ta, trkB, tb) => { let d = 0; const ha = cast.root(trkA, ta, 0), hb = cast.root(trkB, tb, 0); for (const j of [4, 7, 8, 11, 12, 14, 15, 18, 19]) { const a = cast.root(trkA, ta, j), b = cast.root(trkB, tb, j);
    d = Math.max(d, Math.hypot(a[0] - ha[0] - b[0] + hb[0], a[1] - b[1], a[2] - ha[2] - b[2] + hb[2])); } return d; };
  let ph0 = 0, bd = 1e9; for (let k = 0; k < 75; k++) { const d = poseD('fork_L', dF, 'walk_loop', (k / 75) * per) + poseD('fork_R', dF, 'walk_loop', (k / 75) * per); if (d < bd) { bd = d; ph0 = (k / 75) * per; } }
  const tW = tS + 2.15;                                                          // she has settled and looked ahead (the track's last 0.35 s is a hold)
  // ---- the little tree: lanes, colours and messages from the world tree's first three levels; geometry nested in a 98 degree fan (never crossing)
  const F = W.almond.F, kids = (i) => { const o = []; for (let j = 1; j < F.roads.length; j++) if (F.roads[j].parent === i) o.push(j); return o; };
  const LEAF = [-49, -35, -21, -7, 7, 21, 35, 49].map((d) => (d * Math.PI) / 180); const limbs = [];
  const walkPath = (x, z, h0, h1, len, lc) => { const pts = [[x, z]], ds = 0.05; let s = 0; while (s < len - 1e-6) { const d = Math.min(ds, len - s), h = h0 + (h1 - h0) * sm((s + d / 2) / lc); x += Math.cos(h) * d; z += Math.sin(h) * d; s += d; pts.push([x, z]); } return { pts, x, z, h: h0 + (h1 - h0) * sm(len / lc) }; };
  function grow(wi, depth, lo, hi, st, tA, parent) { const a = (LEAF[lo] + LEAF[hi - 1]) / 2, tB = TFK[depth], wr = W.sets.fork.roads[wi - 1], lane0 = F.roads[wi].lane === 0;
    let pts, gk, sWalk0 = 0, side = 0, w;
    if (depth === 1) { side = a < 0 ? -1 : 1; const trk = side < 0 ? 'fork_L' : 'fork_R', e = cast.root(trk, dF), o = cast.rot(ROOT_YAW, e[0], e[2]);          // where the side step leaves her hips
      const pre = []; for (let k = 0; k <= 18; k++) pre.push([(o[0] * k) / 18, (o[1] * k) / 18]); sWalk0 = Math.hypot(o[0], o[1]);
      w = walkPath(o[0], o[1], 0, a, vW * (tB - tW), 1.6); pts = pre.concat(w.pts.slice(1)); const L = sWalk0 + vW * (tB - tW);
      gk = [[0, tS + 0.55], [sWalk0 / L, tS + 1.5], [sWalk0 / L + 1e-4, tW], [1, tB]]; }
    else { w = walkPath(st.x, st.z, st.h + 0.55 * (a - st.h), a, vW * (tB - tA), 2.2); pts = w.pts; gk = [[0, tA], [1, tB]]; }
    const def = { pts, smooth: false, gk, color: wr.def.color, width: lane0 ? 0.03 : 0.024, text: wr.def.text, textSize: 0.2, textSide: -1, textStart: depth === 1 ? sWalk0 + 0.5 : 0.5, nodes: depth < 3 ? [{ u: 1, r: 0.2 }] : [] };
    const me = { depth, def, tA: depth === 1 ? tW : tA, tB, sWalk0, side, lane0, parent, color: wr.def.color, end: w, id: lane0 ? 'hero' : 'root_' + limbs.length }; limbs.push(me);
    if (depth < 3) { const ks = kids(wi), mid = (lo + hi) / 2; grow(ks[0], depth + 1, lo, mid, w, tB, me); grow(ks[1], depth + 1, mid, hi, w, tB, me); }
    return me; }
  { const ks = kids(0); grow(ks[0], 1, 0, 4, null, tF, null); grow(ks[1], 1, 4, 8, null, tF, null); }
  const R = E.roads(limbs.map((l) => l.def), { step: 0.1, maxGlyphs: 20000 }); limbs.forEach((l, i) => { l.road = R.roads[i]; });
  // a child that carries its parent's lane IS the parent walking on; the other child is the new branch and steps out of her
  for (const l of limbs) l.heir = !l.parent || l.color === l.parent.color;
  const sibOf = (l) => limbs.find((q) => q !== l && q.parent === l.parent && q.depth === l.depth);
  const posOn = (l, t) => { const a = l.road.at(Math.min(l.road.len - 0.02, l.sWalk0 + vW * Math.max(0, t - l.tA))); return a; };

  const crane = K.camPath([{ t: tF - 0.4, ...rootCam(tF - 0.4) }, { t: bar(4), pos: [-4.5, 1.9, 2.7], target: [3.0, 0.95, -2.0], fov: 35 }, { t: bar(5), pos: [-6.2, 3.1, 2.5], target: [3.8, 0.75, -1.0], fov: 35 },
    { t: bar(7), pos: [-8.2, 4.9, 1.4], target: [5.6, 0.45, -0.3], fov: 35 }, { t: t1, pos: [-9.6, 6.6, 0.5], target: [7.6, 0.25, 0], fov: 35 }]);
  const NODES = limbs.filter((l) => l.depth < 3).map((l) => ({ x: l.end.x, z: l.end.z, t: l.tB, c: l.color }));

  return { name: '01_root', t0, t1, frame(t) {
    const camera = t < tF - 0.4 ? rootCam(t) : { ...crane(t), aperture: lerp(0.03, 0, seg(t, tF, bar(5))), focusDist: lerp(3.9, 12, ss(t, tF, bar(5))), far: 30000 };
    if (t < tS) cast.actor('hero').set({ pos: [0, 0, 0], yaw: ROOT_YAW, track: 'idle', time: t });
    else if (t < tW) for (const l of limbs) { if (l.depth !== 1) continue; cast.actor(l.id, { lane: l.color }).set({ pos: [0, 0, 0], yaw: ROOT_YAW, track: l.side < 0 ? 'fork_L' : 'fork_R', time: t - tS, vary: 0 }); }
    else for (const l of limbs) { if (t < l.tA || t >= l.tB) continue; const a = posOn(l, t);
      if (!l.heir) { const b = posOn(sibOf(l), t); if (Math.hypot(a.x - b.x, a.z - b.z) < 0.03) continue; }             // the new branch appears as she steps out of her twin
      cast.actor(l.id, { lane: l.color }).set({ pos: [a.x, 0, a.z], yaw: K.yawOf(a), track: 'walk_loop', time: (t - tW) * RATE + ph0, vary: 0 }); }
    const glows = [{ x: 0, z: 0, t: tF, c: K.hex(K.LANE.main) }, ...NODES].filter((n) => t >= n.t && t < n.t + 2.5).map((n) => { const p = Math.exp(-(t - n.t) * 1.7); return { x: n.x, z: n.z, r: 0.9 + 1.5 * (1 - p), c: [n.c[0] * 0.9 * p + 0.25 * p, n.c[1] * 0.9 * p + 0.2 * p, n.c[2] * 0.9 * p + 0.15 * p] }; });
    const up = ss(t, bar(4), bar(8));
    return { camera, world: rootWorld(t),
      extra: [R.drawable({ head: t, gain: 2.5, textGain: 0.8, minPx: lerp(1.5, 2.0, up), halo: 0.3, haloPx: 5, headGain: 2.2, headLen: 0.25, flow: 0.12, nodeMinPx: 1.6 }), ...(glows.length ? [W.glow(glows)] : [])],
      hud: K.hudMain(t, { count: W.count(t) }) };
  } };
}
