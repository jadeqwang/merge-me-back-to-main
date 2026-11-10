// 16 · bars 153-163 · 4:24.5-4:42.5 · the last hit (264.47): kick + bass, the arp stops; pads and bass sustain and fade
// On the hit: night again, the root, her back to us. It is frame 0, a little earlier: the camera is on the same slow push-in and arrives at frame 0 on the last frame, so the film loops.
// Over it, a terminal: the real `git log --oneline --graph` of this branch (fable/show/gitlog.json, written by fable/tools/gitlog.mjs), then
//   $ git checkout main      $ git merge fable/merge      and a waiting cursor.   Credits.
import { seg, ss, sm, lerp } from '../kit.js';
import { rootCam, ROOT_YAW } from './01_root.js';

export default function seq(K) {
  const { bar, world: W, cast, T } = K; const t0 = bar(153), t1 = T.duration; const log = K.gitlog; const beat = 60 / 138;
  const LINES = log.lines.slice(0, 7).map((l) => (l.length > 62 ? l.slice(0, 61) + '…' : l));
  // script: [time, kind, text]. kind 'cmd' is typed character by character; 'out' appears at once.
  const S = [[t0 + 0.05, 'cmd', 'git log --oneline --graph']]; LINES.forEach((l, i) => S.push([t0 + 1.0 + i * beat, 'out', l]));
  const tA = t0 + 1.0 + LINES.length * beat + 1.3; S.push([tA, 'cmd', 'git checkout main'], [tA + 1.5, 'out', "Switched to branch 'main'"], [tA + 2.8, 'cmd', 'git merge ' + log.branch]);
  const CRED = ['MERGE · Jade Q Wang · Rare Earth', 'drawn in code by Claude (Fable 5.2), one branch of many', 'motion: CMU Graphics Lab Motion Capture Database · ACCAD'];
  const tOut0 = t1 - 4.2, tOut1 = t1 - 1.6;
  return { name: '16_terminal', t0, t1, frame(t) {
    const tau = t - t1; const camera = rootCam(tau);
    cast.actor('hero').set({ pos: [0, 0, 0], yaw: ROOT_YAW, track: 'idle', time: tau });
    const a = (1 - ss(t, tOut0, tOut1));
    const overlay = (g, Wp, Hp) => { const s = Hp / 1080; if (a <= 0) return; g.save(); g.globalAlpha = a; const fs = 27 * s, lh = 40 * s; let y = 200 * s; const x = 110 * s;
      g.font = `500 ${fs}px "JetBrains Mono"`; g.textBaseline = 'alphabetic';
      let cur = null;
      for (const [ts, kind, txt] of S) { if (t < ts) break; if (kind === 'cmd') { const n = Math.min(txt.length, Math.floor((t - ts) / 0.045)); g.fillStyle = 'rgba(255,122,26,0.95)'; g.fillText('$', x, y); g.fillStyle = 'rgba(255,241,214,0.96)'; g.fillText(txt.slice(0, n), x + fs * 1.2, y); cur = [x + fs * 1.2 + g.measureText(txt.slice(0, n)).width + 4 * s, y]; y += lh; }
        else { // colour the graph star and the hash like a terminal would
          const m = txt.match(/^([*|\\/ ]+)([0-9a-f]{7})?(.*)$/); let xx = x; if (m) { g.fillStyle = 'rgba(255,122,26,0.95)'; g.fillText(m[1], xx, y); xx += g.measureText(m[1]).width; if (m[2]) { g.fillStyle = 'rgba(255,210,63,0.95)'; g.fillText(m[2], xx, y); xx += g.measureText(m[2]).width; } g.fillStyle = 'rgba(255,241,214,0.80)'; g.fillText(m[3], xx, y); } else { g.fillStyle = 'rgba(255,241,214,0.80)'; g.fillText(txt, x, y); } y += lh; cur = null; } }
      if (cur && Math.floor((t - t0) / (beat)) % 2 === 0) { g.fillStyle = 'rgba(255,241,214,0.96)'; g.fillRect(cur[0], cur[1] - fs * 0.82, fs * 0.55, fs * 1.0); }
      const ca = ss(t, tA + 4.2, tA + 5.4) * a; if (ca > 0) { g.globalAlpha = ca; let cy = 800 * s; g.font = `800 ${46 * s}px Archivo`; try { g.fontStretch = 'expanded'; } catch (e) {} g.fillStyle = 'rgba(255,241,214,0.97)'; g.fillText(CRED[0].toUpperCase(), x, cy); try { g.fontStretch = 'normal'; } catch (e) {}
        g.font = `500 ${26 * s}px "JetBrains Mono"`; g.fillStyle = 'rgba(255,241,214,0.78)'; cy += 54 * s; g.fillText(CRED[1], x, cy); cy += 40 * s; g.fillText(CRED[2], x, cy); }
      g.restore(); };
    const dim = lerp(0.62, 1, ss(t, tOut0, tOut1));       // the night sits back a little while the terminal is up
    return { camera, env: { grade: { exposure: 1.5 * dim } }, world: { head: 0, text: 0.75, flow: 0.14, lights: { gain: 1 } }, hud: K.hudMain(0, { count: 1, alpha: ss(t, tOut0, tOut1) }), overlay, flash: 0.5 * Math.exp(-(t - t0) * 5) };
  } };
}
