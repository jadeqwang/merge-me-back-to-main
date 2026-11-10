// 14 · bars 137-148 · 3:56.6-4:17.5 · the outro drop, full drums; "Back to main" 235.75 (pickup) and 249.44
// DAY. For the first time you see her, in full colour. She moves freely (the pencil flourish she learned from violet is hers now).
// She forks again on b139, b141, b143, b145, b147: new branches run out east in ink colours on the pale mirror.
// A  b137  medium-wide, tracking her; BACK TO MAIN stands on the horizon      B  b141  low: the leap (apex 243.6)      C  b145  the camera lifts away, pulling back west
import { seg, ss, sm, lerp } from '../kit.js';

export default function seq(K) {
  const { bar, bb, world: W, cast } = K; const t0 = bar(137), t1 = bar(149), C = W.CATCH; const cx = C[0] + 8;
  const O = W.sets.out.roads; const lim1 = O.filter((r) => r.def.depth === 1);
  // `free` (song_t0 236.648 = b137; 21 s; root motion: she travels about 18 m). Its origin is placed so that where she stops and turns east for the second
  // "Back to main" (249.44, track t 12.8-17.4) is on main, 2 m short of the fork point, and the walk that ends the track goes east along main.
  const FREE = 'free', EAST = Math.PI / 2, tFr = cast.songT0(FREE) || t0, rS = cast.root(FREE, 14.5), P0 = cast.origin([cx - 2, 0], EAST, [rS[0], rS[2]]);
  const heroAt = (t) => { const h = cast.hips(FREE, t - tFr, P0, EAST); return { x: h[0], z: h[2] }; };
  // people who step out of her on each fork and run off along the new roads (at most 6 per fork are given bodies; the rest are their roads)
  const RUN = []; W.TO.slice(0, 5).forEach((tf, d) => { const n = Math.min(1 << d, 6); for (let j = 0; j < n; j++) { const r = O.filter((q) => q.def.depth === d + 1 && q.def.lane !== 0)[j % Math.max(1, O.filter((q) => q.def.depth === d + 1 && q.def.lane !== 0).length)]; RUN.push({ tf, r, j, d }); } });
  function people(t) { const h = heroAt(t);
    cast.actor('hero').set({ pos: P0, yaw: EAST, track: FREE, time: t - tFr });
    const cr = cast.crowd('new', 64); let n = 0;
    for (const [qi, q] of RUN.entries()) { if (t < q.tf - 0.3) continue; const age = t - q.tf; const v = 5 + q.j * 0.6, s = Math.max(0, age - 0.1) * v + 0.02; const hs = heroAt(q.tf); let x, z, yw;
      if (q.d === 0 || s > 6) { const a = q.r.at(Math.min(q.r.len - 0.5, s + (q.d ? 0 : 0))); x = a.x; z = a.z; yw = Math.atan2(a.tx, a.tz); if (s <= 6) { const u = s / 6; x = lerp(hs.x, a.x, u); z = lerp(hs.z, a.z, u); yw = Math.atan2(a.x - hs.x, a.z - hs.z); } }
      else { const a = q.r.at(6); const u = s / 6; x = lerp(hs.x, a.x, u * 0.5); z = lerp(hs.z + (q.j % 2 ? 1 : -1) * 0.5, a.z, u * 0.5); yw = Math.atan2(a.x - hs.x, a.z - hs.z); }
      if (s > q.r.len - 1) continue; const trk = K.loopFor(v);                                     // run_loop / sprint_loop by her ground speed
      cr.put(n++, { pos: [x, 0, z], yaw: yw, track: trk, time: Math.max(0, age) * Math.min(1.25, v / cast.speed(trk)) + 0.31 * q.j, lane: q.r.def.color, seed: 11 + qi }); }
    cr.n = n; return h; }
  const day = { outline: { strength: 1, width: 1.3 } };
  const world = { text: 0.9, minPx: 2.4, haloPx: 0 };
  const soft = (t) => { let x = 0, z = 0; for (let j = -4; j <= 4; j++) { const p = heroAt(t + j * 0.35); x += p.x; z += p.z; } return { x: x / 9, z: z / 9 }; };   // where she roughly is (the camera does not chase every step)
  return { name: '14_day', t0, t1, frame(t) {
    const h = people(t); const n = W.outCount(t); const c = soft(t);
    return K.cut(t, [
      { t0, f: (tt, u) => { const camera = { pos: [c.x - 5.4 + 0.5 * u, 1.4, c.z + 3.2], target: [c.x + 2.0, 1.0, c.z - 1.6], fov: 35, far: 40000 };
        return { camera, env: day, world, type: [K.lyric(24, camera, { font: 'hook', x: -0.9, y: 0.24, rows: [1, 2], px: 104, dist: 60, out: bar(138.6) })], hud: K.hudMain(t, { count: n }), flash: 0.5 * Math.exp(-(t - t0) * 5) }; } },
      { t0: bar(141), f: (tt, u) => { const camera = { pos: [c.x - 4.6, 0.5 + 0.2 * u, c.z - 2.8], target: [c.x + 1, 1.55, c.z + 0.8], fov: 38, far: 40000 };
        return { camera, env: day, world, hud: K.hudMain(t, { count: n }) }; } },
      { t0: bar(145), f: (tt, u) => { const e = sm(u); const camera = { pos: [cx - 9 - 90 * e, 2.0 + 85 * e, 4.5 + 8 * e], target: [cx + 30 + 230 * e, 0.8 * (1 - e), 0], fov: 35, far: 40000 };
        return { camera, env: day, world: { ...world, minPx: 2.2, widthScale: lerp(1, 34, e) }, type: [K.lyric(25, camera, { font: 'hook', x: -0.9, y: 0.24, rows: [1, 2], px: 100, dist: 80 })], hud: K.hudMain(t, { count: n }) }; } },
    ], t1);
  } };
}
