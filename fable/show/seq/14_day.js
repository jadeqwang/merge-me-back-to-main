// 14 · bars 137-148 · 3:56.6-4:17.5 · the outro drop, full drums; "Back to main" 235.75 (pickup) and 249.44
// DAY. For the first time you see her, in full colour. She moves freely (the pencil flourish she learned from violet is hers now).
// She forks again on b139, b141, b143, b145, b147: new branches run out east in ink colours on the pale mirror.
// A  b137  medium-wide, tracking her; BACK TO MAIN stands on the horizon      B  b141  low: the leap (apex 243.6)      C  b145  the camera lifts away, pulling back west
import { seg, ss, sm, lerp } from '../kit.js';

export default function seq(K) {
  const { bar, bb, world: W, cast } = K; const t0 = bar(137), t1 = bar(149), C = W.CATCH; const cx = C[0] + 8;
  const O = W.sets.out.roads; const lim1 = O.filter((r) => r.def.depth === 1);
  // her free movement near the fork point (stand-in for the `free` track): a wandering loop, a leap on b141, then she stops and faces east for the second "Back to main"
  const heroAt = (t) => { const tau = t - t0; const k = 1 - ss(t, 248.2, 249.44); return { x: cx - 2 + (1.3 * Math.sin(tau * 0.55) + 0.5 * Math.sin(tau * 1.3)) * k, z: (1.1 * Math.sin(tau * 0.8 + 1) + 0.4 * Math.sin(tau * 1.9)) * k }; };
  const bell = (t, tb, w) => { const x = (t - tb) / w; return Math.abs(x) < 1 ? 1 - x * x : 0; };
  // people who step out of her on each fork and run off along the new roads (at most 6 per fork are given bodies; the rest are their roads)
  const RUN = []; W.TO.slice(0, 5).forEach((tf, d) => { const n = Math.min(1 << d, 6); for (let j = 0; j < n; j++) { const r = O.filter((q) => q.def.depth === d + 1 && q.def.lane !== 0)[j % Math.max(1, O.filter((q) => q.def.depth === d + 1 && q.def.lane !== 0).length)]; RUN.push({ tf, r, j, d }); } });
  function people(t) { const h = heroAt(t), h2 = heroAt(t + 0.3); const yaw = t > 249.0 ? Math.PI / 2 : Math.atan2(h2.x - h.x, h2.z - h.z); const y = 0.95 * bell(t, 243.6, 0.42) + 0.12 * Math.abs(Math.sin((t - t0) * 4.4)) * (1 - ss(t, 248.2, 249.44));
    cast.actor('hero').set({ pos: [h.x, y, h.z], yaw, track: 'idle', time: t, density: 0, solid: 1, cel: 1, arms: 0.9 * bell(t, bar(138.5), 0.7) + bell(t, 243.6, 0.5) + 0.8 * bell(t, bar(144), 0.8), reach: 0.8 * bell(t, bar(142.5), 0.6) });
    const cr = cast.crowd('new', 64); let n = 0;
    for (const q of RUN) { if (t < q.tf - 0.3) continue; const age = t - q.tf; const s = Math.max(0, age - 0.1) * (5 + q.j * 0.6) + 0.02; const hs = heroAt(q.tf); let x, z, yw;
      if (q.d === 0 || s > 6) { const a = q.r.at(Math.min(q.r.len - 0.5, s + (q.d ? 0 : 0))); x = a.x; z = a.z; yw = Math.atan2(a.tx, a.tz); if (s <= 6) { const u = s / 6; x = lerp(hs.x, a.x, u); z = lerp(hs.z, a.z, u); } }
      else { const a = q.r.at(6); const u = s / 6; x = lerp(hs.x, a.x, u * 0.5); z = lerp(hs.z + (q.j % 2 ? 1 : -1) * 0.5, a.z, u * 0.5); yw = Math.atan2(a.x - hs.x, a.z - hs.z); }
      if (s > q.r.len - 1) continue; cr.put(n++, { pos: [x, 0, z], yaw: yw, track: 'run', time: t + q.j, color: q.r.def.color, density: 0, solid: 1, cel: 1 }); }
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
