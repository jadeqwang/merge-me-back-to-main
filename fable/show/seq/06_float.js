// 6 · bars 57-64 · 1:37.5-1:51.4 · breakdown A, strings (crash on b57)
// Straight down: she floats on the mirror, hair fanned out. Every strand runs on into a road: her hair is the graph.
// "Branch and wander" 102.65: the strands branch outward.  "Merge and return" 109.43: pulses come home along them.
// (Seq 7 keeps this shot rising until b69.)
import { seg, ss, lerp, sm } from '../kit.js';
import { mulberry32, fbm1 } from '../../engine/src/rng.js';

// the hair-graph: strands leave her head, become roads, fork three times. g = when each point is written (hair itself is always there).
export function makeHair(K) {
  const W = K.world, E = K.E; const H = [W.FLOAT[0] + 0.76, 0]; const rnd = mulberry32(41); const defs = []; const LN = ['rose', 'gold', 'mint', 'cyan', 'magenta', 'blue', 'coral', 'main'];
  const TXT = W.lives.map((l) => l.name + '  ' + l.text); const gOf = (r) => (r <= 1.1 ? -50 : 102.45 + 6.4 * Math.sqrt((r - 1.1) / 60));
  const NS = 46; let n = 0;
  const grow = (r0, a0, r1, da, lane, depth, wob) => { const pts = []; const seed = Math.floor(rnd() * 1e5); const m = 9; let a = a0; for (let i = 0; i <= m; i++) { const u = i / m, r = r0 + (r1 - r0) * u; a = a0 + da * u + wob * fbm1(u * 2.4 + 0.2, seed, 2) * (0.3 + u); pts.push([H[0] + Math.cos(a) * r, H[1] + Math.sin(a) * r]); }
    const hair = depth === 0; defs.push({ pts, g: [gOf(r0), gOf(r1)], color: hair ? [0.95, 0.80, 0.66] : E.hex(W.LANE[lane]), width: hair ? 0.006 : 0.012 + 0.006 * depth, text: depth >= 2 ? TXT[n++ % TXT.length] : undefined, textSize: 0.085 + 0.04 * depth, textSide: 1,
      nodes: hair ? [] : [{ u: 1, r: 0.03 + 0.03 * depth }] });
    return a; };
  // the fan sweeps up and to the left of frame; the lower right stays clear for the words
  for (let s = 0; s < NS; s++) { const a0 = (-152 + (192 * (s + 0.5)) / NS + 3 * (rnd() - 0.5)) * (Math.PI / 180); const lane = LN[s % LN.length];
    const a1 = grow(0.12, a0 * 0.8, 1.1, a0 * 0.2, lane, 0, 0.12);                       // hair: leaves the head, fans out
    const a2 = grow(1.1, a1, 2.6 + rnd() * 0.8, 0.06 * (rnd() - 0.5), lane, 1, 0.10); const r2 = Math.hypot(defs[defs.length - 1].pts[9][0] - H[0], defs[defs.length - 1].pts[9][1] - H[1]);
    for (const s1 of [-1, 1]) { const b = grow(r2, a2, 7 + rnd() * 3, s1 * (0.05 + 0.05 * rnd()), s1 < 0 ? lane : LN[(s * 3 + 1) % LN.length], 2, 0.08); const r3 = Math.hypot(defs[defs.length - 1].pts[9][0] - H[0], defs[defs.length - 1].pts[9][1] - H[1]);
      for (const s2 of [-1, 1]) { const c = grow(r3, b, 22 + rnd() * 8, s2 * (0.03 + 0.03 * rnd()), s2 < 0 ? lane : LN[(s * 5 + 2) % LN.length], 3, 0.06); const r4 = Math.hypot(defs[defs.length - 1].pts[9][0] - H[0], defs[defs.length - 1].pts[9][1] - H[1]);
        grow(r4, c, 62, s2 * 0.02, lane, 4, 0.04); } } }
  return { R: E.roads(defs, { step: 0.12, maxGlyphs: 300000 }), H };
}

export default function seq(K) {
  const { bar, world: W, cast } = K; const t0 = bar(57), t1 = bar(65); const hair = (K.shared.hair = makeHair(K)); const H = hair.H, fx = W.FLOAT[0];
  // the shot: head left of centre, body down-screen (west), lyrics on the mirror in the right half. It rises slowly; seq 7 takes it up.
  const cam = (t) => { const h = lerp(6.8, 9.6, sm(seg(t, t0, t1))) + (t > t1 ? 40 * Math.pow(seg(t, t1, bar(69)), 1.6) : 0); const half = h * Math.tan((35 * Math.PI) / 360) * (K.E.W / K.E.H);
    return { pos: [H[0] + 0.25 - 0.02 * h, h, 0.12 * half], target: [H[0] + 0.25, 0, 0.12 * half], fov: 35, topUp: [1, 0, 0], near: 0.3, far: 20000 }; };
  K.shared.floatCam = cam;
  // `float` (song_t0 97.513; supine, head toward its -Z) until 116.0, then `rise` (song_t0 116.0; its frame 0 is the float's pose there). Head east, on H: the strands leave it.
  const tF0 = cast.songT0('float') || t0, tR0 = cast.songT0('rise') || 116.0, hd = cast.root('float', 0, 4), P0 = cast.origin(H, -Math.PI / 2, [hd[0], hd[2] - 0.12]);
  K.shared.tRise = tR0;
  K.shared.floatBody = (t, o = {}) => cast.actor('hero').set({ pos: P0, yaw: -Math.PI / 2, track: t < tR0 ? 'float' : 'rise', time: t < tR0 ? t - tF0 : t - tR0, density: 0.7, ...o });
  K.shared.hairDraw = (t, o = {}) => hair.R.drawable({ head: t, gain: 2.0, textGain: 0.3, minPx: 1.3, haloPx: 3, halo: 0.25, headGain: 2.5, headLen: 0.25, nodeMinPx: 1.2, soft: 0.1, ...o });
  return { name: '06_float', t0, t1, frame(t) {
    const camera = cam(t); K.shared.floatBody(t);
    const ret = seg(t, 109.43, 111.3); const pulses = t >= 109.43 ? [{ g: lerp(108.9, 102.4, sm(ret)), width: 0.5, gain: 7 }, { g: lerp(108.9, 102.4, sm(seg(t, 110.2, 112.1))), width: 0.5, gain: 5 }] : [];
    return { camera, env: { ground: { ripple: 0.02, fogAmt: 0.2, base: K.hex('#081038'), f0: 0.2 }, grade: { exposure: 1.5, vignette: 0.42, bloom: 0.65 } },
      world: { text: 0.6, flow: 0.08, lights: false }, extra: [K.shared.hairDraw(t, { pulses, flow: 0.06, flowSpeed: 3 })],
      type: [K.lyric(11, camera, { mode: 'ground', x: 0.22, y: -0.66, rows: [1, 2], px: 100 }), K.lyric(12, camera, { mode: 'ground', x: 0.22, y: -0.66, rows: [1, 2], px: 100, out: t1 + 0.3 })],
      hud: K.hudMain(t, { count: 1 }) };
  } };
}
