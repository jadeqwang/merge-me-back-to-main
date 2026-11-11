// ACT B, the breakdown (seq 06-07): she floats on the mirror, the crown of her head on H, head east. Main runs in to her feet from the west; out of her hair
// run the strands, and the strands are roads: thirty leave the fan of her hair, each forks three times (240 tips, 62 m out). One line in, the graph out.
//   strand geometry is static; g (when a point is written) is a function of its distance from her head, so the graph grows outward on the words:
//   97.6-102.3 fine filaments creep out of the hair · "Branch" 102.65 the first fork · "wander" 103.88 on outward, forking, wandering · tips by 108.6
// K.shared.actBFloat = { hair (Roads), draw(t, opts), cam(t) (the one top-down shot of 06 + 07A: rises, turns, comes back down), body(t, set), gOfR, lives of strands }
import { lerp } from '../kit.js';
import { mulberry32, fbm1 } from '../../engine/src/rng.js';
import { actBGeo } from './actB_geo.js';

export function actBFloat(K) {
  if (K.shared.actBFloat) return K.shared.actBFloat;
  const { world: W, cast, E } = K, G = actBGeo(K), H = G.H, rnd = mulberry32(41);
  const RG = [[0.3, 97.3], [0.55, 97.6], [1.6, 102.3], [1.62, 102.65], [4.6, 103.8], [11, 105.0], [26, 106.3], [62, 108.6]];
  const gOfR = (r) => { if (r <= RG[0][0]) return RG[0][1]; for (let i = 0; i < RG.length - 1; i++) if (r <= RG[i + 1][0]) return lerp(RG[i][1], RG[i + 1][1], (r - RG[i][0]) / (RG[i + 1][0] - RG[i][0])); return RG[RG.length - 1][1]; };
  const lives = W.lives, defs = [], fdefs = [], NS = 30, M = 9, cream = [0.62, 0.55, 0.50];
  // one limb: from radius r0 at angle a0 out to r1, turning by da, wandering by wob (rad). Returns the end angle and radius.
  // o.gm(r, u): its own clock (the filaments are ragged: each creeps out at its own pace; the first limbs leave their fork exactly on "Branch")
  const limb = (r0, a0, r1, da, wob, o) => { const pts = [], gs = [], seed = Math.floor(rnd() * 1e5); let a = a0;
    for (let i = 0; i <= M; i++) { const u = i / M, r = r0 + (r1 - r0) * u; a = a0 + da * u + wob * fbm1(u * 2.4 + 0.2, seed, 2) * u * (1.3 - 0.3 * u); pts.push([H[0] + Math.cos(a) * r, H[1] + Math.sin(a) * r]); gs.push(o.gm ? o.gm(r, u) : gOfR(r)); }
    (o.fil ? fdefs : defs).push({ pts, gs, textSide: -1, ...o }); return a; };
  for (let s = 0; s < NS; s++) {
    const a0 = ((-93 + (186 * (s + 0.5)) / NS + 2.5 * (rnd() - 0.5)) * Math.PI) / 180;
    const rf = 1.25 + 0.95 * rnd(), creep = (p, d) => (r, u) => 97.6 + d + (102.3 - 97.6 - d) * Math.pow(u, p);          // the fork is 1.25-2.2 m from her crown: no ring
    const a1 = limb(0.3, a0 * 0.93, rf, a0 * 0.07, 0.16, { color: cream, width: 0.0016, step: 0.04, fil: 1, gm: creep(0.75 + 0.7 * rnd(), 0.5 * rnd()) });        // the filament: out of the hair
    for (const k of [-1, 1]) { const b0 = a0 * 0.93 + k * (0.035 + 0.03 * rnd()); limb(0.3 + 0.12 * rnd(), b0, rf, a1 - b0, 0.12, { color: cream, width: 0.0012, step: 0.04, fil: 1, gm: creep(0.7 + 0.9 * rnd(), 0.9 * rnd()) }); }   // a lock of three gathers into each strand
    for (const s1 of [-1, 1]) { const li = (s * 2 + (s1 > 0 ? 1 : 0)) % lives.length, L = lives[li], col = W.col(L.lane), txt = L.name + '  ' + L.text;
      const r2 = 4.2 + 0.9 * rnd(), a2 = limb(rf, a1, r2, s1 * (0.05 + 0.03 * rnd()), 0.06, { color: col, width: 0.006, step: 0.1, nodes: [{ u: 0, r: 0.03 }], gm: (r, u) => gOfR(1.62 + (r2 - 1.62) * u) });
      for (const s2 of [-1, 1]) { const r3 = 10 + 2.2 * rnd(), a3 = limb(r2, a2, r3, s2 * (0.035 + 0.02 * rnd()), 0.09, { color: col, width: 0.01, step: 0.15, text: txt, textSize: 0.2, nodes: [{ u: 0, r: 0.06 }] });
        for (const s3 of [-1, 1]) { const r4 = 24 + 5 * rnd(), a4 = limb(r3, a3, r4, s3 * (0.02 + 0.012 * rnd()), 0.11, { color: col, width: 0.016, step: 0.3, text: txt, textSize: 0.34, nodes: [{ u: 0, r: 0.1 }] });
          limb(r4, a4, 62, s3 * 0.012, 0.12, { color: col, width: 0.024, step: 0.6, text: s3 > 0 ? txt : undefined, textSize: 0.5, nodes: [{ u: 0, r: 0.14 }] }); } } }
  }
  const hair = E.roads(defs, { step: 0.12, maxGlyphs: 300000 }), fil = E.roads(fdefs, { step: 0.05 });
  const draw = (t, o = {}) => hair.drawable({ head: t, gain: 2.0, textGain: 0.3, minPx: 1.2, haloPx: 3, halo: 0.25, headGain: 3, headLen: 0.3, nodeMinPx: 1.1, soft: 0.12, ...o });
  const drawFil = (t, o = {}) => fil.drawable({ head: t, gain: 0.8, minPx: 0.7, haloPx: 1.5, halo: 0.1, headGain: 2.5, headLen: 0.3, soft: 0.25, ...o });
  // ---- the top-down shot. Keys: [t, height, turn (deg: where east points on screen, counter-clockwise from screen-right), centre (m east of H)]
  // r2 (NOTES_v2): the widest point (24 m) is held for about a bar round "return"; from the hats (111.43) the camera comes home WITH the pulses, one a beat:
  // 7 m by b66.3, close on her (she is 3/4 of the frame) for the last bar and the hand-over to the rise. (v2: 26 m at 111.43, still 12 m at 115.3.)
  // r3 (NOTES_v3: at 24 m she was 11 % of the frame's height for five seconds): the height is capped at 12.6 m, where her body is 20.8 % of the frame's
  // height (1.65 m of 7.95 m). The frame at the widest point still holds her, the hair and the first two forks of every strand (4.2-5.1 m out); the third
  // forks (10-12 m) are at its corners. Centre offsets scaled with the height.
  const CK = [[97.515, 2.75, 28, -0.5], [100.0, 3.1, 44, -0.42], [102.65, 5.6, 78, -0.1], [104.9, 7.0, 100, 0.5], [107.2, 9.5, 110, 1.2], [109.43, 11.9, 116, 2.05], [110.6, 12.6, 119, 2.2], [111.43, 12.5, 121, 2.2],
    [112.3, 11.2, 124, 1.95], [113.17, 9.3, 127, 1.6], [114.04, 7.0, 130, 1.1], [115.3, 4.6, 136, 0.4], [116.0, 3.7, 139, 0.15], [116.64, 3.3, 141, 0.0],
    // r2: the shot now runs on to b68.4 (117.952): the sit-up is seen from straight above (she rises toward the lens and the lens rises with her), never side-on
    // r4 Y: 07 now leaves this shot on b68.1 (116.648), before she moves (the fan of hair shrank to a ball as she sat up): the two keys below are no longer seen
    [117.3, 3.9, 145, -0.45], [117.952, 4.9, 149, -0.8]];
  const path = K.camPath(CK.map(([t, h, th, e]) => ({ t, pos: [h, th, e], target: [0, 0, 0] })));
  const cam = (t) => { const [h, thd, e] = path(t).pos, th = (thd * Math.PI) / 180, cx = H[0] + e * Math.cos(0); return { pos: [cx, h, 0], target: [cx, 0, 0], topUp: [Math.sin(th), 0, -Math.cos(th)], fov: 35, near: 0.2, far: 20000, h }; };
  // `float` (song_t0 97.513; supine, head toward its -Z) until 116.0, then `rise` (song_t0 116.0; its frame 0 is the float's pose there, she stands up facing west)
  const body = (t, o = {}) => cast.actor('hero').set({ pos: G.P0, yaw: G.WEST, track: t < G.tR0 ? 'float' : 'rise', time: t < G.tR0 ? t - G.tF0 : t - G.tR0, hair: 'strands', ...o });   // hair: 'strands' (anime figure): the fine strand hair for the whole of 06-07; the b73 flash hides the change back
  const feetX = cast.hips('float', 0, G.P0, G.WEST)[0] - 0.85;                               // main is written up to her feet
  // ---- the frame of the top-down shot (06 and 07 A share it; the cut between the two sequences is not a cut)
  const { T } = K, tHats = 111.42, RET = [T.bb(65, 1), T.bb(65, 2), T.bb(65, 3), T.bb(65, 4)], RDUR = 2.0;      // "Merge and return": four pulses come home, one a beat, the first on the hats
  const refL11 = cam(104.9), refL12 = cam(110.8), sm = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); }, ss = (x, a, b) => sm((x - a) / (b - a));
  const gHome = (p) => lerp(108.6, 97.4, Math.pow(Math.min(1, Math.max(0, p)), 0.8));
  const top = (t) => {
    const camera = cam(t), dl = ss(t, tHats, 116.6);
    // pulses in flight: the four that return on the words, then one arriving on every beat of the download
    const arr = RET.filter((a) => t > a - RDUR && t < a + 0.15).map((a) => ({ a, d: RDUR }));
    if (t > RET[3] - 1.0) { const b0 = Math.ceil(T.beatAt(Math.max(t, RET[3] + 0.01)) - 1e-6); for (let j = 0; j < 4 && arr.length < 4; j++) { const a = T.beatTime(b0 + j); if (a - 1.74 < t && a < 118.0) arr.push({ a, d: 1.74 }); } }
    const pulses = arr.map(({ a, d }) => ({ g: gHome(1 - (a - t) / d), width: 0.4, gain: 3.2 }));
    // her light: a step as each pulse comes home, and a slow swell through the download
    let lit = 0.72 * dl, kick = 0; for (const a of RET) lit += 0.07 * ss(t, a - 0.03, a + 0.3); if (t > RET[0]) { const f = T.beatAt(t) % 1; kick = Math.exp(-f * 3.2); }
    const imp = Math.exp(-(t - 97.515) * 1.6);
    body(t, { density: lerp(0.5, 1, lit), gain: 1 + 1.3 * lit + 0.5 * kick * (0.4 + lit) });
    const hx = H[0] - 0.55, warm = [1.0, 0.56, 0.24];
    const near = 0.3 + 0.7 * ss(camera.h, 3.5, 9);                                         // close to her the pool would fill the frame: keep it a pool
    const glows = [{ x: hx, z: 0, r: 1.5 + 1.0 * lit + 0.3 * kick, c: warm.map((c) => c * near * (0.08 + 0.5 * lit + 0.3 * kick * lit + 0.1 * imp)) }];
    const inward = ss(t, 109.2, 110.4);
    return { camera, env: { dawn: 0.03 * dl, ground: { ripple: 0.016 + 0.05 * imp, fogAmt: 0.2, base: K.hex('#081038'), f0: 0.2 }, grade: { exposure: 1.5, vignette: 0.4, bloom: 0.6 },
        figLight: { under: 0.25 + 0.5 * lit, ambient: [0.06 + 0.13 * lit, 0.07 + 0.09 * lit, 0.19 + 0.02 * lit], emissive: 2 + 1.6 * lit + 0.8 * kick * lit, fibres: 1.6 + 2.2 * lit } },
      world: { only: ['main'], lights: false, text: 0.45, flow: 0.12, flowSpeed: 6, main: { head: G.headAtX(feetX), gain: 2.6, textGain: 0.45 * (1 - ss(t, 115.0, 116.0)) } },      // r3: main's text leaves before the close frame turns it upside down (116.6-117.95); the road stays
      extra: [W.glow(glows), drawFil(t, { pulses, gain: 0.8 + 1.0 * lit }), draw(t, { pulses, gain: 2.0 - 0.7 * inward, flow: 0.05 + 0.3 * inward, flowSpeed: -(4 + 8 * dl) * inward, textGain: 0.3 + 0.9 * dl, halo: 0.25 - 0.13 * inward })],
      // r4 Y (NOTES_v4 Y2: title-safe, 5 % margins, for a line's whole time on screen). Both lines lie on the water under a camera that moves. Line 11 is placed
      // for the camera of 104.9; before that the camera is lower, and "and wander" (103.67) was cut by the frame's foot until 104.5: the block is 7.5 % of the
      // frame higher (y -0.91 -> -0.76; baseline 92 % down at 104.0). Line 12: the camera starts down at 111.43 and the end of "return" ran out through the right
      // margin at 112.3-112.8: 1.5 % left (x 0.40 -> 0.37) and gone 0.35 s sooner (hold 0.3, fade 0.3: out by 112.46; "return" is sung to 111.855).
      type: [K.lyric(11, refL11, { mode: 'ground', x: 0.306, y: -0.76, rows: [1, 2], px: 87 }), K.lyric(12, refL12, { mode: 'ground', x: 0.37, y: -0.79, rows: [1, 2], px: 70, hold: 0.3, fade: 0.3 })],
      hud: K.hudMain(t, { count: 1 }) };
  };
  return (K.shared.actBFloat = { hair, fil, draw, drawFil, cam, body, gOfR, feetX, H, top });

}
