// 16 · bars 153-163 · 4:24.5-4:42.5 · the last hit (264.47): kick + bass, the arp stops; pads and bass sustain and fade to silence by 282.45
// On the hit: night again, the root, her back to us. It is frame 0, eighteen seconds early: the same camera on the same slow push-in (01_root's rootCam /
// rootWorld at tau = t - duration), the same idle, the same shader clock (frame().clock), so the last frame IS the first and the film loops.
// Over it, a terminal, typed on the beat grid: the real `git log --oneline --graph` of this branch (fable/show/gitlog.json, six lines), then
//   $ git checkout main   ->  Switched to branch 'main'      $ git merge fable/merge   and a cursor that waits and is never answered.
// Credits under it. Everything typed is gone by ~279.2; the HUD of frame 0 comes back; the last three seconds are the clean first image.
import { seg, ss, sm, lerp, clamp01 } from '../kit.js';
import * as R01 from './01_root.js';

export default function seq(K) {
  const { bar, bb, world: W, cast, T, E } = K; const t0 = bar(153), t1 = T.duration, log = K.gitlog, beat = 60 / 138;
  const rootWorld = R01.rootWorld || ((tau) => ({ head: tau, fork: { hide: true }, canopy: false, text: 0.85, flow: 0, gain: 2.4, halo: 0.3, lights: { t: tau, almond: false, gain: 1.7, minPx: 1.4, air: 900 }, art: { gain: 1.5 } }));
  const MAXC = 54, LINES = log.lines.slice(0, 6).map((l) => (l.length > MAXC ? l.slice(0, MAXC - 1) + '…' : l));
  // the script: [time, kind, text]. 'cmd' is typed character by character (the two that matter are set larger); 'out' appears at once, on a beat
  const tCo = bar(155), tSw = bb(155, 4), tMg = bar(156), tCred = bar(157), tOut0 = bb(160, 3), tOut1 = bb(161, 3), tHud0 = tOut1, tHud1 = bar(162.5);
  const S = [[t0 + 0.08, 'cmd', 'git log --oneline --graph -6', 0]]; LINES.forEach((l, i) => S.push([bb(153, 3 + i), 'out', l, 0]));
  S.push([tCo, 'cmd', 'git checkout main', 1], [tSw, 'out', "Switched to branch 'main'", 0], [tMg, 'cmd', 'git merge ' + log.branch, 1]);
  const CRED = ['MERGE · Jade Q Wang · Rare Earth', 'drawn in code by Claude (Fable 5.2), one branch of many', 'motion: CMU Graphics Lab Motion Capture Database · ACCAD'];
  const CREAM = (a) => `rgba(255,241,214,${a})`, ORANGE = 'rgba(255,122,26,0.96)', GOLD = 'rgba(255,210,63,0.96)', MINT = 'rgba(61,220,151,0.92)';
  return { name: '16_terminal', t0, t1, frame(t) {
    const tau = t - t1, camera = R01.rootCam(tau);
    cast.actor('hero').set({ pos: [0, 0, 0], yaw: R01.ROOT_YAW, track: 'idle', time: tau });
    const a = 1 - ss(t, tOut0, tOut1);
    const overlay = (g, Wp, Hp) => { const s = Hp / 1080; if (a <= 0) return; g.save(); g.globalAlpha = a;
      // a soft scrim on the left so the type sits on calm dark (the figure, on the right, is untouched)
      const gr = g.createLinearGradient(0, 0, Wp * 0.74, 0); gr.addColorStop(0, 'rgba(3,4,16,0.62)'); gr.addColorStop(0.72, 'rgba(3,4,16,0.5)'); gr.addColorStop(1, 'rgba(3,4,16,0)'); g.fillStyle = gr; g.fillRect(0, 0, Wp * 0.74, Hp);
      const x = 96 * s; let y = 150 * s, cur = null; g.textBaseline = 'alphabetic';
      for (const [ts, kind, txt, big] of S) { if (t < ts) break; const fs = (big ? 42 : 31) * s; g.font = `${big ? 600 : 500} ${fs}px "JetBrains Mono"`;
        if (kind === 'cmd') { y += (big ? 30 : 0) * s; const n = Math.min(txt.length, Math.floor((t - ts) / 0.042)); g.fillStyle = ORANGE; g.fillText('$', x, y); g.fillStyle = CREAM(0.97); g.fillText(txt.slice(0, n), x + fs * 1.25, y);
          cur = [x + fs * 1.25 + g.measureText(txt.slice(0, n)).width + 5 * s, y, fs]; y += (big ? 58 : 54) * s; }
        else { const m = txt.match(/^([*|\\/ ]+)([0-9a-f]{7,})?( \([^)]*\))?(.*)$/); let xx = x;        // the graph, the hash and the refs coloured as a terminal would
          if (m && m[2]) { for (const [part, col] of [[m[1], ORANGE], [m[2], GOLD], [m[3] || '', MINT], [m[4], CREAM(0.86)]]) { g.fillStyle = col; g.fillText(part, xx, y); xx += g.measureText(part).width; } }
          else { g.fillStyle = CREAM(0.86); g.fillText(txt, x, y); } y += 47 * s; cur = null; } }
      if (cur && ((t - t0) / beat) % 1 < 0.5) { g.fillStyle = CREAM(0.97); g.fillRect(cur[0], cur[1] - cur[2] * 0.84, cur[2] * 0.56, cur[2] * 1.02); }       // the cursor, on the beat, waiting
      const ca = ss(t, tCred, tCred + 0.7) * a; if (ca > 0) { g.globalAlpha = ca; let cy = 868 * s; g.font = `800 ${46 * s}px Archivo`; try { g.fontStretch = 'expanded'; } catch (e) {} g.fillStyle = CREAM(0.98); g.fillText(CRED[0].toUpperCase(), x, cy); try { g.fontStretch = 'normal'; } catch (e) {}
        g.font = `500 ${28 * s}px "JetBrains Mono"`; g.fillStyle = CREAM(0.84); cy += 56 * s; g.fillText(CRED[1], x, cy); cy += 42 * s; g.fillText(CRED[2], x, cy); }
      g.restore(); };
    const dim = lerp(0.6, 1, ss(t, tOut0, tOut1 + 0.3));       // the night sits back while the terminal is up
    return { camera, clock: tau, env: { grade: { exposure: 1.5 * dim } }, world: rootWorld(tau), hud: K.hudMain(0, { count: 1, hash: E.hashAt(0), alpha: ss(t, tHud0, tHud1) }), overlay, flash: 0.5 * Math.exp(-(t - t0) * 5) };
  } };
}
