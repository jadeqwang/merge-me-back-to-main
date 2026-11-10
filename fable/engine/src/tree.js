// The graph as a tree grown east: a binary tree with `levels` doublings (10 -> 1,024 tips), laid out so that it reads as a dendrite /
// river delta / tree of life and never as an H-tree. Non-crossing by construction (nested wedges, monotone radius), organic by vigour,
// uneven wedge splits and curved, slightly wandering limbs.
//   growTree({ levels:10, seed, fan: deg total, r0: first limb length, q: length falloff, trunk: metres of main before the first fork,
//              timeOfDepth: d => song time when depth-d forks happen })  ->  { roads:[def...], tips:[{x,z,road}], forks:[{x,z,depth,g}] }
// Each road def is ready for engine.roads(): {pts, g:[g0,g1], depth, index, parent, lane} with lane 0 = main (one unbroken main runs root to a tip), 1..7 = branch lanes (violet is never used here).
import { mulberry32, fbm1 } from './rng.js';
export function growTree(o = {}) {
  const levels = o.levels ?? 10, rnd = mulberry32(o.seed ?? 11), fan = ((o.fan ?? 150) * Math.PI) / 180, r0 = o.r0 ?? 120, q = o.q ?? 0.80, trunk = o.trunk ?? 80;
  const T = o.timeOfDepth || ((d) => d); const roads = [], tips = [], forks = [];
  const polar = (r, a) => [r * Math.cos(a), r * Math.sin(a)];
  // trunk = main, straight from the west into the origin
  roads.push({ pts: [[-trunk, 0], [-trunk * 0.5, 0], [0, 0]], g: [T(0) - (T(1) - T(0)), T(0)], depth: 0, index: 0, parent: -1, lane: 0, smooth: false });
  forks.push({ x: 0, z: 0, depth: 0, g: T(0) });
  let seq = 1;
  function grow(parent, px, pz, pdir, r, a0, a1, depth, vigor, lane) {
    if (depth > levels) { tips.push({ x: px, z: pz, road: parent }); return; }
    const f = 0.5 + (rnd() - 0.5) * 0.30; const mid = a0 + (a1 - a0) * f;
    const kids = [[a0, mid], [mid, a1]]; const heir = rnd() < 0.5 ? 0 : 1;
    kids.forEach(([b0, b1], k) => {
      const v = Math.min(1.7, Math.max(0.42, vigor * (0.80 + 0.42 * rnd()))); const len = r0 * Math.pow(q, depth - 1) * v * (depth === 1 ? 1 : 1);
      const ang = b0 + (b1 - b0) * (0.5 + (rnd() - 0.5) * 0.35); const rr = r + len;
      const [cx, cz] = polar(rr, ang);
      // limb: leaves along the parent's direction, arrives along its own radial; a little wander on top
      const cdir = [Math.cos(ang * 0.85), Math.sin(ang * 0.85)]; const L = Math.hypot(cx - px, cz - pz);
      const h1 = [px + pdir[0] * L * 0.38, pz + pdir[1] * L * 0.38], h2 = [cx - cdir[0] * L * 0.34, cz - cdir[1] * L * 0.34];
      const pts = []; const n = 7; const seed = Math.floor(rnd() * 1e6); const nx = -(cz - pz) / (L || 1), nz = (cx - px) / (L || 1);
      for (let i = 0; i <= n; i++) { const u = i / n, m = 1 - u; const bx = m * m * m * px + 3 * m * m * u * h1[0] + 3 * m * u * u * h2[0] + u * u * u * cx, bz = m * m * m * pz + 3 * m * m * u * h1[1] + 3 * m * u * u * h2[1] + u * u * u * cz;
        const w = Math.sin(Math.PI * u) * L * 0.07 * fbm1(u * 2.3 + 0.5, seed, 2); pts.push([bx + nx * w, bz + nz * w]); }
      // git semantics: at a fork one child IS the parent continuing (same lane colour), the other is a new branch (new lane)
      const idx = seq++; let myLane = lane; if (k === heir) myLane = lane; else { myLane = 1 + Math.floor(rnd() * 7); if (myLane === lane) myLane = 1 + (myLane % 7); }
      roads.push({ pts, g: [T(depth - 1), T(depth)], depth, index: idx, parent, lane: myLane });
      forks.push({ x: cx, z: cz, depth, g: T(depth) });
      const last = pts[n], prev = pts[n - 1]; const dl = Math.hypot(last[0] - prev[0], last[1] - prev[1]) || 1;
      grow(idx, cx, cz, [(last[0] - prev[0]) / dl, (last[1] - prev[1]) / dl], rr, b0, b1, depth + 1, v, myLane);
    });
  }
  grow(0, 0, 0, [1, 0], 0, -fan / 2, fan / 2, 1, 1, 0);
  return { roads, tips, forks };
}
