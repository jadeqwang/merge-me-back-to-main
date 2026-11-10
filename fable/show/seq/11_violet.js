// 11 · bars 105-120 · 3:01.0-3:28.8 · verse 2 over full drums; drums and bass cut on b117 (201.86)
// Deep night, far out. The violet branch, alone: hair up in a bun, two pencils through it. HUD jade/1420-mhz, ctx 97% -> 100%.
// A  b105  "This branch may never find the way"   side truck: she runs
// B  b109  "Back to the place where I began"      she slows, stops, looks east at the far glow
// C  b113  "And maybe something that I learned"   she draws a pencil and writes one line of light in the air: docs: start here
// D  b117  "Comes home to who I'll be again"      drums out: she lets it go; it lifts and streaks east; she sits at the end of her road and stills into a constellation
import { seg, ss, sm, lerp, easeIn } from '../kit.js';

export default function seq(K) {
  const { bar, world: W, cast, T, VIOLET } = K; const t0 = bar(105), t1 = bar(121), tGo = bar(117); const P = W.violetPath; const V = W.VEND, M = W.M1, C = W.CATCH;
  // `violet` is one continuous 30 s take (song_t0 180.995) with its own root motion: run, slow, stop (190.6), look, draw the pencil, write, let go (201.865), sit (206.9).
  // She rides her road: her hips are at the arc length where the track's forward travel puts her, counted back from where she stands at the end of the road.
  const VT = 'violet', tV = cast.songT0(VT) || t0, zStand = cast.root(VT, 12)[2];
  const sAt = (t) => Math.min(P.len - 0.05, Math.max(0, P.len - 0.3 - (zStand - cast.root(VT, t - tV)[2]))), posAt = (t) => P.at(sAt(t));
  const headAt = (t) => Math.max(t, P.gAt(Math.min(P.len, sAt(t) + 0.25)));          // her road is written under her feet: its write head stays with her
  const end = P.at(P.len - 0.3); const E3 = [end.x, end.z]; const endDir = P.at(P.len - 3);
  // the line of light: written at chest height in front of her, then it leaves. Its flight (seq 12 follows it): pchip through these.
  const fly = K.camPath([{ t: tGo, pos: [E3[0] + 0.9, 1.25, E3[1] - 0.2], target: [0, 0, 0] }, { t: tGo + 1.2, pos: [E3[0] + 6, 2.6, E3[1] + 3], target: [0, 0, 0] }, { t: bar(119), pos: [E3[0] + 60, 22, E3[1] + 60], target: [0, 0, 0] }, { t: t1, pos: [V[0] + 70, 62, V[1] + 250], target: [0, 0, 0] },
    { t: bar(124.5), pos: [M[0] - 240, 70, -520], target: [0, 0, 0] }, { t: bar(127), pos: [M[0] - 10, 40, -8], target: [0, 0, 0] }, { t: bar(128.5), pos: [C[0] - 110, 6, 0], target: [0, 0, 0] }, { t: bar(129), pos: [C[0] + 0.25, 1.25, 0], target: [0, 0, 0] }]);
  const lightAt = (t) => fly(t).pos; K.shared.lightAt = lightAt;
  const LL = K.E.lights(96);
  K.shared.lightDraw = (t, gain = 1) => { const d = new Float32Array(96 * 7); const c = K.hex(K.LANE.violet); let n = 0; for (let j = 0; j < 90; j++) { const tj = t - j * 0.004 - j * j * 0.00012; if (tj < tGo) break; const p = lightAt(tj), k = Math.exp(-j * 0.05) * (j ? 0.45 : 1); d.set([p[0], p[1], p[2], (c[0] + (j ? 0.15 : 1.2)) * 22 * k * gain, (c[1] + (j ? 0.15 : 1.2)) * 22 * k * gain, (c[2] + (j ? 0.3 : 1.2)) * 22 * k * gain, j ? 0.07 : 0.16], n * 7); n++; } return LL.drawable(d, n, { minPx: 1.6 }); };
  const hud = (t) => ({ branch: VIOLET.name, color: K.LANE.violet, ctx: lerp(0.97, 1.0, ss(t, bar(113), tGo)) });
  const night = { dawn: 0.085, grade: { exposure: 1.6, bloom: 0.65 } };
  const world0 = { text: 0.85, flow: 0.12, lights: { gain: 0.8 } };
  const who = (t, o = {}) => cast.actor('violet', { lane: 'violet', variant: 'violet' }).set({ ...K.ride(VT, t - tV, posAt(t)), track: VT, time: t - tV, ...o });
  return { name: '11_violet', t0, t1, frame(t) {
    const p = posAt(t), a = p;                              // the road's own tangent (a chord would flip when she shifts her weight)
    const world = { ...world0, violet: { head: headAt(t) } };
    return K.cut(t, [
      { t0, f: () => { const camera = { pos: K.rel(a, 1.9, 6.2, 1.3), target: K.rel(a, 2.3, -30, 1.1), fov: 35, focusDist: 6.4, aperture: 0.05 };   // from her right: she runs screen-left to right
        who(t);
        return { camera, env: night, world, type: [K.lyric(16, camera, { x: 0.1, y: 0.12, rows: [2, 2, 3], dist: 40 })], hud: hud(t) }; } },
      { t0: bar(109), f: (tt, u) => { const camera = { pos: K.rel(a, -4.4 + 0.4 * u, 0.6, 1.5), target: K.rel(a, 6, -3.2, 1.15), fov: 35, focusDist: 4.8, aperture: 0.05 };
        who(t);
        return { camera, env: { ...night, dawn: 0.11 }, world, type: [K.lyric(17, camera, { x: -0.9, y: 0.30, rows: [4, 3], dist: 30 })], hud: hud(t) }; } },
      { t0: bar(113), f: (tt, u) => { const fr = { x: p.x, z: p.z, tx: endDir.tx, tz: endDir.tz }; const camera = { pos: K.rel(fr, 0.55, 3.1 - 0.8 * sm(u), 1.3), target: K.rel(fr, 0.5, -4, 1.2), fov: 35, focusDist: 2.8, aperture: 0.03 };      // (I1: was 1.0 / 0.95; the real figure's head left the frame)
        who(t);
        // the written line: 0.9 m, chest height, left to right as seen by this camera (she writes it across herself)
        const line = { text: VIOLET.last, raw: true, font: 'mono', size: 0.074, pos: K.rel(fr, 0.42, 0.3, 1.22), right: [fr.tx, 0, fr.tz], up: [0, 1, 0], align: 'left', color: '#C9B3FF', gain: 2.4, t0: 196.4, wipe: true, wipeDur: 1.45, stagger: 1.48, reflGain: 0.5 };
        return { camera, env: night, world, type: [line, K.lyric(18, camera, { x: -0.06, y: 0.34, rows: [3, 3], dist: 30, out: tGo, fade: 0.2 })], hud: hud(t) }; } },
      { t0: tGo, f: (tt, u) => { const fr = { x: p.x, z: p.z, tx: endDir.tx, tz: endDir.tz }; const camera = { pos: K.rel(fr, -4.4 - 3.6 * sm(u), 2.4 + 1.4 * u, 1.5 + 1.9 * sm(u)), target: K.rel(fr, 3, -1.3, 0.95), fov: 35, focusDist: 5 + 4 * u, aperture: 0.02 };
        const still = ss(t, 206.9, t1);
        who(t, { density: lerp(1, 0.22, still) });
        return { camera, env: { ...night, dawn: 0.085 + 0.02 * u }, world, extra: [K.shared.lightDraw(t)], type: [K.lyric(19, camera, { x: -0.9, y: 0.30, rows: [3, 4], dist: 30 })], hud: { ...hud(t), ctx: 1 } }; } },
    ], t1);
  } };
}
