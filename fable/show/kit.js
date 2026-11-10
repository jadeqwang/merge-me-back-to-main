// SHOW KIT: what every sequence gets. K = { E, T, bar, bb, world, cast, type helpers, grade, hud helpers, small maths }.
import { makeWorld, LANE, LIVES, VIOLET } from './world.js';
import { makeCast } from './cast.js';

export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const mix3 = (a, b, u) => [a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, a[2] + (b[2] - a[2]) * u];
export const sm = (u) => { u = clamp01(u); return u * u * (3 - 2 * u); };
export const seg = (t, a, b) => clamp01((t - a) / (b - a));            // 0..1 progress of t through [a, b]
export const ss = (t, a, b) => sm(seg(t, a, b));                         // smoothstepped
export const easeOut = (u) => 1 - Math.pow(1 - clamp01(u), 3);
export const easeIn = (u) => Math.pow(clamp01(u), 3);

export async function makeKit(E) {
  const T = E.time, bar = (n) => T.bar(n), bb = (n, k) => T.bb(n, k);
  const world = makeWorld(E), cast = await makeCast(E);
  let gitlog = { lines: ['* (HEAD -> fable/merge) the Fable cut'], branch: 'fable/merge' };
  try { gitlog = await (await fetch('/fable/show/gitlog.json')).json(); } catch (e) { console.log('gitlog.json missing: run node fable/tools/gitlog.mjs'); }

  // ---- camera basis (matches engine buildCamera)
  const basis = (c) => { const f = E.v3.norm(E.v3.sub(c.target, c.pos)); let up = c.up || [0, 1, 0]; const d = Math.abs(E.v3.dot(f, up));
    if (d > 0.96) { const w = Math.min(1, (d - 0.96) / 0.035), tu = c.topUp || [1, 0, 0], ww = w * w * (3 - 2 * w); up = E.v3.norm([up[0] * (1 - ww) + tu[0] * ww, up[1] * (1 - ww) + tu[1] * ww, up[2] * (1 - ww) + tu[2] * ww]); }
    const r = E.v3.norm(E.v3.cross(f, up)); const u = E.v3.cross(r, f); return { f, r, u, tan: Math.tan(((c.fov || 35) * Math.PI) / 360), asp: E.W / E.H }; };
  // world point seen at NDC (sx, sy) at depth d along the view axis
  const at = (c, sx, sy, d) => { const b = basis(c); return [0, 1, 2].map((i) => c.pos[i] + b.f[i] * d + b.r[i] * sx * d * b.tan * b.asp + b.u[i] * sy * d * b.tan); };
  // where a world point lands on screen (NDC), and its depth
  const project = (c, p) => { const b = basis(c); const v = E.v3.sub(p, c.pos); const d = E.v3.dot(v, b.f); return { x: E.v3.dot(v, b.r) / (d * b.tan * b.asp), y: E.v3.dot(v, b.u) / (d * b.tan), d }; };

  // ---- lyric type, placed by where it should sit in frame (rule 3: in the world, never over a head, >= 64 px cap height at 1080p)
  //   lyric(id, cam, { font:'serif'|'hook', px: cap height in 1080p pixels, x, y: NDC of the left end of the LAST row's baseline (or centre/right with align),
  //                    dist: metres from camera, mode: 'float' (upright, faces the camera) | 'stand' (upright, feet on the mirror at dist: y is ignored) | 'ground' (lying on the mirror),
  //                    rows, align, leading, ink, gain, out, hold, ...type.js fields })
  // Pass the camera of a fixed moment for world-locked type (parallax), or the current camera for frame-locked type.
  function place(cam, o) {
    const b = basis(cam), mode = o.mode || 'float'; let pos, right, up, d = o.dist ?? 30;
    if (mode === 'ground') { const far = at(cam, o.x ?? 0, o.y ?? 0, 1), dir = E.v3.sub(far, cam.pos); const k = -cam.pos[1] / dir[1]; pos = [cam.pos[0] + dir[0] * k, 0.02, cam.pos[2] + dir[2] * k]; d = k;   // k = depth along the axis
      const rh = E.v3.norm([b.r[0], 0, b.r[2]]); let uh = [b.u[0], 0, b.u[2]]; if (Math.hypot(uh[0], uh[2]) < 0.2) uh = [b.f[0], 0, b.f[2]]; uh = E.v3.norm(uh); right = rh; up = uh; }
    else { const rh = E.v3.norm([b.r[0], 0, b.r[2]]); right = rh; up = [0, 1, 0]; pos = at(cam, o.x ?? 0, o.y ?? 0, d); if (mode === 'stand') pos[1] = 0.04; }
    const size = ((o.px ?? 80) / 1080) * 2 * d * b.tan;
    return { pos, right, up, size };
  }
  const FONT_DEF = { serif: { px: 90, leading: 1.0 }, hook: { px: 78, leading: 0.94 }, mono: { px: 40, leading: 1.2 } };
  function lyric(id, cam, o = {}) { const font = o.font || 'serif'; const fd = FONT_DEF[font]; const pl = place(cam, { px: fd.px, ...o });
    const words = o.words || T.words(id); const d = { words, font, leading: fd.leading, align: 'left', gain: 1.5, reflGain: font === 'hook' ? 0.1 : 0.22, ...o, ...pl }; if (o.mode === 'ground') d.mode = 'ground'; else delete d.mode; delete d.x; delete d.y; delete d.px; delete d.dist; return d; }
  function label(text, cam, o = {}) { const font = o.font || 'mono'; const fd = FONT_DEF[font]; const pl = place(cam, { px: fd.px, ...o }); const d = { text, font, leading: fd.leading, align: 'left', gain: 1.3, wipe: false, raw: true, ...o, ...pl }; if (o.mode === 'ground') d.mode = 'ground'; else delete d.mode; delete d.x; delete d.y; delete d.px; delete d.dist; return d; }

  // ---- grade by dawn (night / blue hour / sunrise / day), then per-shot overrides
  const GK = [
    [0.0, { exposure: 1.5, bloom: 0.55, bloomThreshold: 1.0, streak: 0.12, streakThreshold: 1.2, vignette: 0.36, saturation: 1.1, contrast: 1.04, grain: 0.028 }],
    [0.35, { exposure: 1.45, bloom: 0.5, bloomThreshold: 1.0, streak: 0.12, streakThreshold: 1.2, vignette: 0.32, saturation: 1.1, contrast: 1.04, grain: 0.028 }],
    [0.6, { exposure: 1.0, bloom: 0.55, bloomThreshold: 1.25, streak: 0.12, streakThreshold: 2.4, vignette: 0.30, saturation: 1.12, contrast: 1.1, grain: 0.026 }],
    [1.0, { exposure: 1.75, bloom: 0.2, bloomThreshold: 4.5, streak: 0.0, streakThreshold: 5, vignette: 0.12, saturation: 1.18, contrast: 1.05, grain: 0.02 }],
  ];
  function grade(dawn, over = {}) { let i = 0; while (i < GK.length - 2 && GK[i + 1][0] <= dawn) i++; const a = GK[i], b = GK[i + 1], u = clamp01((dawn - a[0]) / (b[0] - a[0])); const g = {}; for (const k in a[1]) g[k] = lerp(a[1][k], b[1][k], u); return { ...g, ...over }; }

  const ctxMain = (t) => clamp01(t / bar(137));                         // main's context fills over the night; it is full when the day comes
  const hudMain = (t, o = {}) => ({ branch: 'main', color: LANE.main, ctx: ctxMain(t), ...o });
  const yawTo = (dx, dz) => Math.atan2(dx, dz);
  // a point relative to a road frame a = {x, z, tx, tz}: f metres ahead, r metres to the right of the heading, y up
  const rel = (a, f, r, y = 0) => [a.x + a.tx * f - a.tz * r, y, a.z + a.tz * f + a.tx * r];
  const yawOf = (a) => Math.atan2(a.tx, a.tz);
  // a smoothed road frame for a moving subject: position at t, heading from the chord over +-w seconds
  const frameOf = (posAt, t, w = 1.5) => { const p = posAt(t), a = posAt(t - w), b = posAt(t + w); let dx = b.x - a.x, dz = b.z - a.z; const l = Math.hypot(dx, dz); if (l < 1e-3) { dx = p.tx; dz = p.tz; } else { dx /= l; dz /= l; } return { x: p.x, z: p.z, tx: dx, tz: dz }; };
  // ---- bodies in motion
  // In-place loops do not travel: the sequence moves pos. loopFor(v) = the loop whose own speed is nearest to a ground speed v (m/s).
  const LOOPS = ['walk_loop', 'run_loop', 'sprint_loop'].filter((n) => cast.has(n));
  const loopFor = (v) => { let best = LOOPS[0] || 'idle', bd = 1e9; for (const n of LOOPS) { const d = Math.abs(Math.log(Math.max(v, 0.05) / cast.speed(n))); if (d < bd) { bd = d; best = n; } } return best; };
  // No skating (NOTES_v1 Global): a loop plays at most 15 % faster or slower than it was captured (run_loop 3.42, sprint_loop 4.93, walk_loop 1.14 m/s).
  //   gait(v) -> { track, rate, speed, ok }: the loop for a ground speed v, its playback rate (clamped to 0.85..1.15) and the ground speed that rate really
  //   gives. Move her at `speed`; when `ok` is false v is outside every loop's range: change how fast she travels, not her legs.
  //   runner(at, s0, t0, v, { phase }) -> (t) => { s, a, pos, yaw, track, time }: a body on a road/path (at(s) -> {x, z, tx, tz}) that passes arc length s0 at
  //   time t0 and holds the gait-legal speed nearest v. Spread the result into cast.actor(...).set({...}).
  const GAIT = { lo: 0.85, hi: 1.15 };
  const gait = (v) => { let best = null; for (const n of LOOPS) { const sp = cast.speed(n), rate = Math.min(GAIT.hi, Math.max(GAIT.lo, v / sp)), err = Math.abs(Math.log(Math.max(v, 0.01) / (sp * rate))) + 0.02 * Math.abs(Math.log(rate));
    if (!best || err < best.err) best = { track: n, rate, speed: sp * rate, err }; } return best ? { ...best, ok: best.err < 0.03 } : { track: 'idle', rate: 1, speed: 0, ok: false }; };
  const runner = (at, s0, t0, v, o = {}) => { const g = gait(v); return (t) => { const s = s0 + g.speed * (t - t0), a = at(s); return { s, a, pos: [a.x, 0, a.z], yaw: Math.atan2(a.tx, a.tz), track: g.track, time: (t - t0) * g.rate + (o.phase ?? 0) }; }; };
  // loopClock(posAt, t0, t1, track, { lo, hi, anchor: [t, phase] }) -> (t) => track time. The loop's phase advances with the ground covered along posAt
  // (rate = speed / meta.speed, clamped to [lo, hi] = 0.85..1.15 by default), so her feet do not skate while the world moves her near the loop's own speed. `anchor` pins the phase
  // at one song time (to hand over to another track on a matching frame). Tabulated once at 30 Hz: frame(t) stays a pure function of t.
  function loopClock(posAt, t0, t1, track, o = {}) { const dt = 1 / 30, n = Math.max(1, Math.ceil((t1 - t0) / dt)), sp = cast.speed(track) || 1, lo = o.lo ?? GAIT.lo, hi = o.hi ?? GAIT.hi, ph = new Float32Array(n + 1); let p = posAt(t0);
    for (let i = 0; i < n; i++) { const q = posAt(t0 + (i + 1) * dt), v = Math.hypot(q.x - p.x, q.z - p.z) / dt; ph[i + 1] = ph[i] + dt * Math.min(hi, Math.max(lo, v / sp)); p = q; }
    const at = (t) => { const x = Math.min(n, Math.max(0, (t - t0) / dt)), i = Math.min(n - 1, Math.floor(x)); return ph[i] + (ph[i + 1] - ph[i]) * (x - i) + Math.min(0, t - t0) + Math.max(0, t - t0 - n * dt); };
    const off = o.anchor ? o.anchor[1] - at(o.anchor[0]) : 0; return (t) => at(t) + off; }
  // A track with root motion ridden along a road: a = the road frame {x, z, tx, tz} at the arc length her hips have reached. Returns { pos, yaw } for cast:
  // the track's forward travel (root z) is taken out of the origin (the road carries it, so she follows the curve), its sideways sway stays.
  const ride = (track, time, a) => { const yaw = Math.atan2(a.tx, a.tz); return { pos: cast.origin([a.x, a.z], yaw, [0, cast.root(track, time)[2]]), yaw }; };
  const shared = {};
  // a shot list: pick the entry whose [t0, next t0) contains t. Each entry: { t0, f(t, u, t0, t1) }
  const cut = (t, list, tEnd) => { let i = 0; while (i < list.length - 1 && t >= list[i + 1].t0) i++; const a = list[i].t0, b = i + 1 < list.length ? list[i + 1].t0 : tEnd; return list[i].f(t, (t - a) / (b - a), a, b); };

  return { E, T, bar, bb, world, cast, gitlog, LANE, LIVES, VIOLET, basis, at, project, place, lyric, label, grade, hudMain, ctxMain, yawTo, rel, yawOf, frameOf, loopFor, loopClock, gait, runner, GAIT, ride, shared, cut, hex: E.hex, camPath: E.camPath, rng: E.rng };
}
