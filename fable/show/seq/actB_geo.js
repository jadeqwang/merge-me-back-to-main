// ACT B (seq 05-07) shared geometry and clocks. One object, built once: K.shared.actB.
//   She is never moved faster than her legs: sprint_loop is 4.93 m/s and plays at 0.85..1.15 of it (NOTES_v1 Global), sprint_stop_look brings its own travel.
//   So the act keeps its own clock for where she is; the world's write head is pinned to her feet (the road is written under them).
//   05 A   her first three merge limbs, one node per NT[] beat          sA(t) on W.heroPath, tauA(t) = the world's own time at that spot
//   05 B   seen from far above she is a light on the world's clock; from M1 ("one", TM[0]) the light runs out along main, slowing to her running speed by tC
//   05 C-D sprint_loop into sprint_stop_look (song_t0 85.6): at rest on the 89.80 hit, with her hips where she will lie down (stopX)
//   06-07  float / rise at P0: the crown of her head on H, head east, feet west; she stands up facing west
import { Path } from '../world.js';

export function actBGeo(K) {
  if (K.shared.actB) return K.shared.actB;
  const { world: W, cast, bar, bb, T } = K; const A = W.almond, M = W.M1, HP = W.heroPath, SP = cast.speed('sprint_loop') || 4.926;
  const SSL = 'sprint_stop_look', EAST = Math.PI / 2, WEST = -Math.PI / 2, tS = cast.songT0(SSL) || 85.6, tHit = 89.80;
  const t0 = bar(41), tB = bb(44, 3), tC = bar(49), tD = T.words(10)[0].start, t1 = bar(57), tOne = W.TM[0];
  // ---- the float: crown on H, head east. Her hips there are where she stops in 05 D.
  const H = [W.FLOAT[0] + 0.76, 0], tF0 = cast.songT0('float') || t1, tR0 = cast.songT0('rise') || 116.0;
  const hd = cast.root('float', 0, 4), P0 = cast.origin(H, WEST, [hd[0], hd[2] - 0.12]);
  const stopX = cast.hips('float', 0, P0, WEST)[0];
  // ---- C, D: sprint_loop (its time 0 is sprint_stop_look's frame 0), then the track's own travel
  const xS = stopX - cast.root(SSL, 6.0)[2];
  const heroX = (t) => (t < tS ? xS + cast.root(SSL, 0)[2] - SP * (tS - t) : xS + cast.root(SSL, t - tS)[2]);
  const body = (t) => (t < tS ? { pos: [heroX(t) - cast.root(SSL, 0)[2], 0, 0], yaw: EAST, track: 'sprint_loop', time: t - tS } : { pos: [xS, 0, 0], yaw: EAST, track: SSL, time: t - tS });
  // ---- B: the one light on main, from M1 at tOne to where she is at tC, slowing from the last limb's speed to her own
  const xC = heroX(tC), v0 = 46, dtB = tC - tOne, need = xC - M[0] - SP * dtB; let ka = 0.2, kb = 30;
  for (let i = 0; i < 50; i++) { const k = (ka + kb) / 2; if (((v0 - SP) / k) * (1 - Math.exp(-k * dtB)) > need) ka = k; else kb = k; }
  const kB = (ka + kb) / 2; const xB = (t) => M[0] + SP * (t - tOne) + ((v0 - SP) / kB) * (1 - Math.exp(-kB * (t - tOne)));
  const mainX = (t) => (t < tOne ? M[0] : t < tC ? xB(t) : heroX(Math.min(t, tHit + 2)));       // the head of main east of M1 (her feet)
  const mainRoad = W.sets.main.roads[1]; const headAtX = (x) => mainRoad.gAt(x - M[0]);       // the world's g at that x: pass as { main: { head } }
  // ---- A: her first three merge limbs at running speed
  const sN = [11, 12, 13, 14].map((i) => HP.sOfRoad(i)), NT = [t0, bar(42), bb(43, 2), tB];
  const vA = (i) => (sN[i + 1] - sN[i]) / (NT[i + 1] - NT[i]);
  const sA = (t) => { let i = 0; while (i < 2 && t >= NT[i + 1]) i++; return sN[i] + (t - NT[i]) * vA(i); };
  const clockA = (t) => { let c = 0; for (let i = 0; i < 3; i++) { const a = NT[i], b = i === 2 ? 1e9 : NT[i + 1]; if (t > a) c += ((Math.min(t, b) - a) * vA(i)) / SP; } return c + Math.min(0, t - t0) * (vA(0) / SP); };
  const tauA = (t) => Math.max(W.TM[10] + 1e-3, HP.gAt(Math.max(sN[0], sA(t))));
  console.log(`actB: A speeds ${[0, 1, 2].map((i) => vA(i).toFixed(2))} m/s (sprint_loop ${SP.toFixed(2)}); B light k ${kB.toFixed(2)}; C starts at M1+${(xC - M[0]).toFixed(1)}, stops at M1+${(stopX - M[0]).toFixed(1)}`);
  return (K.shared.actB = { SP, SSL, EAST, WEST, tS, tHit, t0, tB, tC, tD, t1, tOne, H, P0, tF0, tR0, stopX, xS, heroX, body, xC, xB, mainX, headAtX, sN, NT, vA, sA, clockA, tauA, Path });
}
