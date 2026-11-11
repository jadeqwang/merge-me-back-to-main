// 16 · bars 153-163 · 4:24.5-4:42.5 · the last hit (264.47): kick + bass, the arp stops; pads and bass sustain and fade to silence by 282.45
// On the hit: night again, the root, her back to us. It is frame 0, eighteen seconds early: the same camera on the same slow push-in (01_root's rootCam /
// rootWorld at tau = t - duration), the same idle, the same shader clock (frame().clock), so the last frame IS the first and the film loops.
// Over it, a terminal, typed on the beat grid: the real `git log --oneline --graph` of this branch (fable/show/gitlog.json, six lines), then
//   $ git checkout main   ->  Switched to branch 'main'      $ git merge fable/merge   and a cursor that waits and is never answered.
// Credits under it. Everything typed is gone by ~279.2; the HUD of frame 0 comes back; the last three seconds are the clean first image.
import { seg, ss, sm, lerp, clamp01 } from '../kit.js';
import * as R01 from './01_root.js';
import { FK } from './actE_morning.js';

export default function seq(K) {
  const { bar, bb, world: W, cast, T, E } = K; const t0 = bar(153), t1 = T.duration, log = K.gitlog, beat = 60 / 138;
  const tLoop = Math.round(t1 * E.FPS) / E.FPS;                 // the film is a whole number of frames long (8,475 at 30 fps = 282.5 s): its last frame is exactly one frame before frame 0
  const rootWorld = R01.rootWorld || ((tau) => ({ head: tau, fork: { hide: true }, canopy: false, text: 0.85, flow: 0, gain: 2.4, halo: 0.3, lights: { t: tau, almond: false, gain: 1.7, minPx: 1.4, air: 900 }, art: { gain: 1.5 } }));
  const MAXC = 54, LINES = log.lines.slice(0, 6).map((l) => (l.length > MAXC ? l.slice(0, MAXC - 1) + '…' : l));
  // the script: [time, kind, text]. 'cmd' is typed character by character (the two that matter are set larger); 'out' appears at once, on a beat
  const tCo = bar(155), tSw = bb(155, 4), tMg = bar(156), tCred = bar(157), tOut0 = bb(160, 3), tOut1 = bb(161, 3), tHud0 = tOut1, tHud1 = bar(162.5);
  const S = [[t0 + 0.08, 'cmd', 'git log --oneline --graph -6', 0]]; LINES.forEach((l, i) => S.push([bb(153, 3 + i), 'out', l, 0]));
  S.push([tCo, 'cmd', 'git checkout main', 1], [tSw, 'out', "Switched to branch 'main'", 0], [tMg, 'cmd', 'git merge ' + log.branch, 1]);
  const CRED = ['MERGE · Jade Q Wang · Rare Earth', 'drawn in code by Claude (Fable 5.2), one branch of many', 'motion: CMU Graphics Lab Motion Capture Database · ACCAD'];
  const CREAM = (a) => `rgba(255,241,214,${a})`, ORANGE = 'rgba(255,122,26,0.96)', GOLD = 'rgba(255,210,63,0.96)', MINT = 'rgba(61,220,151,0.92)';
  // r4: SHE IS NOT FROZEN. For 18 s she stood in `idle` alone on a locked camera. `stand` is made here from `idle` on the same clock (so its last frame is still
  // idle one frame before 0: the loop seam) plus: her weight goes onto her right leg (266.2-269.6: hips 3 cm over, the hip up, the left knee easing, shoulders
  // answering) and comes back (275.6-279.4); one slow turn of the head toward the terminal, to her left, as `git merge` is typed and not answered (269.3-271.9),
  // held, and back (274.6-277.4); a deeper breath under it all. The feet are idle's own (re-solved, they do not move). Its simulation has a light wind in the hair,
  // the straps and the trouser hems (265.5-278.8); from 279.3 the pose IS idle's, and by 281.5 the simulation has gone over to idle's own (Figure.settleSim): the loop seam holds.
  const idleT = cast.tracks && cast.tracks.idle, STAND = 'stand16'; let hasStand = false;
  const MS = Math.ceil((tLoop - t0) * 60) + 1, tS = tLoop - MS / 60;           // the take's clock starts a whole number of 60 Hz frames before the loop point (a few ms before the hit): its frames ARE idle's frames
  if (idleT && cast.fig && !cast.standin && idleT.loop) { const fps = 60, NF = MS, data = new Float32Array(NF * 147), { qmul, axq } = FK, X = [1, 0, 0], Y = [0, 1, 0], Z = [0, 0, 1];
    const env = (t, a, b, c, d) => ss(t, a, b) * (1 - ss(t, c, d)), wind = (ff) => env(tS + ff / fps, 265.5, 268.0, 276.0, 278.8);
    for (let k = 0; k < NF; k++) { const t = tS + k / fps, A = FK.pose(idleT, (k - MS) / fps, true), ws = env(t, 266.2, 269.6, 275.6, 279.3), wh = env(t, 269.3, 271.9, 274.6, 277.4), br = (0.5 - 0.5 * Math.cos((2 * Math.PI * (t - 265.0)) / 4.6)) * env(t, 265.0, 267.3, 277.0, 279.3);
      const lq = A.lq.map((q) => q.slice()), lo = A.lo.map((v) => v.slice()), tw = (j, ax, deg) => { lq[j] = qmul(lq[j], axq(ax, deg)); };
      lo[0][0] -= 0.030 * ws; lo[0][1] -= 0.007 * ws; lo[0][2] += 0.004 * ws; tw(0, Z, -3.4 * ws); tw(0, Y, -2.0 * ws); tw(1, Z, 2.2 * ws); tw(2, Z, 2.4 * ws); tw(2, Y, 1.5 * ws);      // the weight shift (her right is -X; a negative roll lifts the right hip)
      tw(2, Y, 7 * wh); tw(3, Y, 18 * wh); tw(4, Y, 26 * wh); tw(4, X, 4 * wh); tw(4, Z, -2.5 * wh);                                                                    // the head, to her left and a little down, with a small tilt
      tw(1, X, -0.6 * br); tw(2, X, -1.5 * br); tw(4, X, 1.2 * br); tw(5, Z, 2.2 * br); tw(9, Z, -2.2 * br); tw(6, Z, -1.2 * br); tw(10, Z, 1.2 * br);                 // the breath: chest lifts, shoulders rise, the arms ride on it
      const B = FK.build(lq, lo); for (const th of [13, 17]) FK.legIK(B.P, B.Q, th, A.P[th + 2], A.Q[th + 2], A.Q[th + 3], A.lo[th + 3]); FK.write(data, k, B.P, B.Q); }
    const track = { name: STAND, fps, frames: NF, loop: false, events: [], boneLengths: idleT.boneLengths, data, simOpts: { windK: (ff) => 1 + 6 * wind(ff), hemK: (ff) => 11 * wind(ff) }, meta: { song_t0: tS, made_by: '16_terminal.js (idle + a weight shift, a look at the terminal, wind)' } };
    cast.tracks[STAND] = track; cast.fig.addTrack(track); hasStand = true;
    if (cast.fig.settleSim) cast.fig.settleSim(STAND, 'idle', (f) => f - MS, (279.5 - tS) * fps, (281.5 - tS) * fps);      // hair and cloth hang as idle's from 281.5: the last frame is frame 0's neighbour to the last strand
    if (+E.Q.get('standdump')) for (let k = 0; k < NF; k += 8) console.log('STANDDUMP ' + (k + ' ' + NF + ' ' + Array.from(data.subarray(k * 147, Math.min(NF, k + 8) * 147), (v) => v.toFixed(5)).join(' ')).replace(/\d/g, (c) => 'abcdefghij'[c])); }      // dev, as hodump in actE_morning.js
  return { name: '16_terminal', t0, t1, frame(t) {
    const tau = t - tLoop, camera = R01.rootCam(tau);
    cast.actor('hero').set(hasStand ? { pos: [0, 0, 0], yaw: R01.ROOT_YAW, track: STAND, time: t - tS } : { pos: [0, 0, 0], yaw: R01.ROOT_YAW, track: 'idle', time: tau });
    const a = 1 - ss(t, tOut0, tOut1);
    const overlay = (g, Wp, Hp) => { const s = Hp / 1080; if (a <= 0) return; g.save(); g.globalAlpha = a;
      // a soft scrim on the left so the type sits on calm dark (the figure, on the right, is untouched)
      const gr = g.createLinearGradient(0, 0, Wp * 0.74, 0); gr.addColorStop(0, 'rgba(3,4,16,0.72)'); gr.addColorStop(0.72, 'rgba(3,4,16,0.6)'); gr.addColorStop(1, 'rgba(3,4,16,0)'); g.fillStyle = gr; g.fillRect(0, 0, Wp * 0.74, Hp);
      const x = 96 * s; let y = 124 * s, cur = null; g.textBaseline = 'alphabetic';
      for (const [ts, kind, txt, big] of S) { if (t < ts) break; const fs = (big ? 42 : 31) * s; g.font = `${big ? 600 : 500} ${fs}px "JetBrains Mono"`;
        if (kind === 'cmd') { y += (big ? 30 : 0) * s; const n = Math.min(txt.length, Math.floor((t - ts) / 0.042)); g.fillStyle = ORANGE; g.fillText('$', x, y); g.fillStyle = CREAM(0.97); g.fillText(txt.slice(0, n), x + fs * 1.25, y);
          cur = [x + fs * 1.25 + g.measureText(txt.slice(0, n)).width + 5 * s, y, fs]; y += (big ? 58 : 52) * s; }
        else { const m = txt.match(/^([*|\\/ ]+)([0-9a-f]{7,})?( \([^)]*\))?(.*)$/); let xx = x;        // the graph, the hash and the refs coloured as a terminal would
          if (m && m[2]) { for (const [part, col] of [[m[1], ORANGE], [m[2], GOLD], [m[3] || '', MINT], [m[4], CREAM(0.86)]]) { g.fillStyle = col; g.fillText(part, xx, y); xx += g.measureText(part).width; } }
          else { g.fillStyle = CREAM(0.86); g.fillText(txt, x, y); } y += 44 * s; cur = null; } }       // six lines end above the horizon's far lights; the commands sit below them
      if (cur && ((t - t0) / beat) % 1 < 0.5) { g.fillStyle = CREAM(0.97); g.fillRect(cur[0], cur[1] - cur[2] * 0.84, cur[2] * 0.56, cur[2] * 1.02); }       // the cursor, on the beat, waiting
      const ca = ss(t, tCred, tCred + 0.7) * a; if (ca > 0) { g.globalAlpha = ca; let cy = 806 * s;      /* r4: 62 px higher: the last line ran into the road's glowing FROM at the bottom of the frame */ g.font = `800 ${40 * s}px Archivo`; try { g.fontStretch = 'expanded'; } catch (e) {} g.fillStyle = CREAM(0.98); g.fillText(CRED[0].toUpperCase(), x, cy); try { g.fontStretch = 'normal'; } catch (e) {}
        g.font = `500 ${29 * s}px "JetBrains Mono"`; g.fillStyle = CREAM(0.86); cy += 56 * s; g.fillText(CRED[1], x, cy); cy += 42 * s; g.fillText(CRED[2], x, cy); }
      g.restore(); };
    const dim = lerp(0.6, 1, ss(t, tOut0, tOut1 + 0.3));       // the night sits back while the terminal is up
    return { camera, clock: tau, env: { grade: { exposure: 1.5 * dim } }, world: rootWorld(tau), hud: K.hudMain(0, { count: 1, hash: E.hashAt(0), alpha: ss(t, tHud0, tHud1) }), overlay, flash: 0.5 * Math.exp(-(t - t0) * 5) };
  } };
}
