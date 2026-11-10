// 7 · bars 65-72 · 1:51.4-2:05.3 · "Ahh" twice; hats; snare crescendo from 116.64; the F#5 leap on b69 (118.387); 32nd roll 123.49.  Notes: fable/notes/actB.md
// A  b65      the download: the top-down shot of 06 comes back down toward her; what every branch lived streams home along every strand as text, a pulse
//             lands on every beat, and she grows brighter (actB_float.js `top`)
// B  116.64   (snare crescendo) low on the water, west of her, looking east: she sits up, is lifted, and on the leap (118.387) her arms open and the first
//             band of dawn comes up behind her, over the horizon of roads. She hovers; on the roll the camera lifts away and everything she is made of
//             comes home at once: white on the b73 impact (08 opens on her landing, close and low)
import { seg, ss, lerp, sm, easeIn } from '../kit.js';
import { actBGeo } from './actB_geo.js';
import { actBFloat } from './actB_float.js';

export default function seq(K) {
  const { bar, world: W, cast, T } = K; const G = actBGeo(K), F = actBFloat(K), t0 = bar(65), t1 = bar(73), tCut = 116.64, tLeap = bar(69), tRoll = 123.49, sx = G.stopX;
  const camR = K.camPath([
    { t: tCut, pos: [sx - 2.9, 0.24, 0.8], target: [sx + 0.2, 0.3, 0], fov: 40 }, { t: 117.6, pos: [sx - 3.2, 0.3, 0.85], target: [sx, 0.95, 0], fov: 40 },
    { t: tLeap, pos: [sx - 3.7, 0.4, 0.9], target: [sx, 1.7, 0], fov: 40 }, { t: 121.0, pos: [sx - 3.55, 0.48, 0.2], target: [sx, 1.72, 0], fov: 40 },
    { t: tRoll, pos: [sx - 3.5, 0.6, -0.4], target: [sx, 1.55, 0], fov: 40 }, { t: 124.5, pos: [sx - 9.5, 5.2, -1.1], target: [sx + 2.5, 1.1, 0], fov: 40 }, { t: t1, pos: [sx - 21, 15, -2], target: [sx + 7, 0.4, 0], fov: 40 }]);
  const dawnAt = (t) => (t < tLeap ? lerp(0.03, 0.07, ss(t, tCut, tLeap)) : lerp(0.07, 0.2, ss(t, tLeap, tLeap + 0.8)));
  return { name: '07_download', t0, t1, frame(t) {
    if (t < tCut) return F.top(t);
    const camera = camR(t), leap = t >= tLeap ? Math.exp(-(t - tLeap) * 1.8) : 0, up = ss(t, tCut, tLeap), roll = seg(t, tRoll, t1), flash = 0.75 * easeIn(seg(t, t1 - 0.45, t1));
    const beat = T.beatAt(t), kick = t >= tLeap ? Math.exp(-(beat % 1) * 3.0) : 0;
    F.body(t, { gain: 2.3 + 0.8 * leap + 1.5 * roll + 0.3 * kick });
    // pulses come home on every beat; in the roll they come faster and faster
    const pulses = roll > 0 ? [0, 1, 2, 3].map((j) => ({ g: lerp(108.6, 97.4, (roll * (2 + 6 * roll) + j / 4) % 1), width: 0.6, gain: 8 }))
      : [0, 1, 2, 3].map((j) => { const a = T.beatTime(Math.ceil(beat - 1e-6) + j); return { g: lerp(108.6, 97.4, Math.pow(Math.min(1, Math.max(0, 1 - (a - t) / 1.74)), 0.8)), width: 0.45, gain: 6 }; });
    const warm = [1.0, 0.56, 0.24], gl = 0.3 + 0.7 * leap + 0.15 * kick + 2.4 * roll * roll;
    return { camera, env: { dawn: dawnAt(t), grade: { bloom: 0.62 + 0.3 * leap + 0.5 * roll, exposure: 1.5 + 0.25 * leap }, ground: { ripple: 0.014 + 0.05 * (1 - up) + 0.03 * leap },
        figLight: { under: 0.75, emissive: 3.0 + 1.0 * leap + 2 * roll, fibres: 3.0 } },
      world: { text: 0.6, flow: 0.25, flowSpeed: 6, fogDist: 110, ...Object.fromEntries(['fork', 'merge', 'conn', 'named', 'art', 'violet'].map((k) => [k, { nodeAir: 100 }])), lights: { gain: 0.6, air: 200, clear: [[sx, 0, 8]] }, main: { head: G.headAtX(F.feetX), fogDist: 260 } },
      extra: [W.glow([{ x: sx, z: 0, r: 2.2 + 2.5 * leap + 8 * roll, c: warm.map((c) => c * gl) }]),
        F.drawFil(t, { gain: 1.6 }), F.draw(t, { pulses: pulses.map((q) => ({ ...q, gain: q.gain * (0.35 + 0.65 * roll) })), gain: 0.9 + 1.2 * leap + 0.9 * roll, flow: 0.4, flowSpeed: -(12 + 14 * roll), textGain: 0.6, halo: 0.12, minPx: 1.1, fogDist: 70 + 400 * roll })],
      hud: K.hudMain(t, { count: 1 }), flash: flash + 0.16 * leap * (t - tLeap < 0.5 ? 1 : 0) };
  } };
}
