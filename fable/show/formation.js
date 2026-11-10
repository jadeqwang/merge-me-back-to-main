// THE THOUSAND: formation layouts for the build and the drop (bars 73-104) and the catch (bars 127-133).
// One performer copied 1,024 times. Index 0 is the hero. Front of the formation is WEST (they face where they came from; the sun rises behind them).
// Layouts (all return Float32Array [x, z] * 1024 in world metres):
//   grid(k)   stage k of the doubling: 2^k copies, alternately splitting sideways and backward, in a shallow wedge. Stage k is reached on bar 73 + k.
//   rings     concentric rings round the hero with a 7 m clearing (she solos in it at the drop)
//   MAIN      the bodies spell MAIN: Archivo ExtraBold Expanded rasterised, filled with body-sized cells (bodies lie along x, side by side along z)
import { setFont } from '../engine/src/type.js';
import { hash1 } from '../engine/src/rng.js';

export const N = 1024;
export function makeFormation(K, origin) {
  const [ox, oz] = origin; const D = 2.2;
  // --- doubling grid. col/row from the fork bits; later forks are less significant, so every fork is a step to the neighbouring slot.
  const colRow = (i, k) => { let col = 0, row = 0, first = true; for (let j = 0; j < k; j++) { const b = (i >> j) & 1; if (j % 2 === 0) { col = col * 2 + (first ? b : b ^ 1); first = false; } else row = row * 2 + b; } return [col, row]; };
  const gridPos = (i, k) => { const cb = Math.ceil(k / 2), C = 1 << cb; const [col, row] = colRow(i, k); const z = (col - (C - 1) / 2) * D; return [ox + row * D + Math.abs(z) * 0.22, oz + z + (row % 2 ? 0.35 : 0)]; };
  const grids = []; for (let k = 0; k <= 10; k++) { const a = new Float32Array(N * 2); for (let i = 0; i < N; i++) { const p = gridPos(i % (1 << k), k); a[i * 2] = p[0]; a[i * 2 + 1] = p[1]; } grids.push(a); }
  const hero10 = [grids[10][0], grids[10][1]];
  // --- rings round the hero
  const rings = new Float32Array(N * 2); { rings[0] = hero10[0]; rings[1] = hero10[1];
    const slots = []; for (let j = 0; slots.length < N - 1; j++) { const r = 7 + D * j, n = Math.round((2 * Math.PI * r) / 2.0); for (let q = 0; q < n && slots.length < N - 1; q++) { const a = (q / n) * Math.PI * 2 + j * 0.13; slots.push({ r, a, x: hero10[0] + Math.cos(a) * r, z: hero10[1] + Math.sin(a) * r, j }); } }
    // members sorted by their grid distance from the hero go to rings inner -> outer; inside a ring they keep their angular order
    const mem = []; for (let i = 1; i < N; i++) { const dx = grids[10][i * 2] - hero10[0], dz = grids[10][i * 2 + 1] - hero10[1]; mem.push({ i, r: Math.hypot(dx, dz), a: Math.atan2(dz, dx) }); } mem.sort((p, q) => p.r - q.r);
    let s0 = 0; while (s0 < slots.length) { let s1 = s0; while (s1 < slots.length && slots[s1].j === slots[s0].j) s1++; const ms = mem.slice(s0, s1).sort((p, q) => p.a - q.a), ss = slots.slice(s0, s1).sort((p, q) => Math.atan2(Math.sin(p.a), Math.cos(p.a)) - Math.atan2(Math.sin(q.a), Math.cos(q.a)));
      ms.forEach((m, q) => { rings[m.i * 2] = ss[q].x; rings[m.i * 2 + 1] = ss[q].z; }); s0 = s1; }
    // an aisle through the rings to the west of her (the way she came; the camera comes down it)
    for (let i = 1; i < N; i++) { const dz = rings[i * 2 + 1] - hero10[1]; if (rings[i * 2] < hero10[0] && Math.abs(dz - 1.0) < 1.7) rings[i * 2 + 1] = hero10[1] + 1.0 + (dz - 1.0 >= 0 ? 1.7 : -1.7); } }
  // --- MAIN, made of bodies. Reading direction = +z (screen-right in the east-up top-down view); letters stand up toward +x.
  const CW = 0.62, CL = 1.92; const MAIN = new Float32Array(N * 2); let mainBox = null;
  { const c = document.createElement('canvas'); c.width = 1600; c.height = 420; const g = c.getContext('2d'); setFont(g, 'hook', 300); g.fillStyle = '#fff'; g.textBaseline = 'alphabetic'; try { g.letterSpacing = '14px'; } catch (e) {}
    const m = g.measureText('MAIN'); const tw = m.width, cap = m.actualBoundingBoxAscent; g.fillText('MAIN', (1600 - tw) / 2, 360); const img = g.getImageData(0, 0, 1600, 420).data;
    const cov = (u, v) => { const x = Math.round((1600 - tw) / 2 + u * tw), y = Math.round(360 - v * cap); if (x < 0 || x >= 1600 || y < 0 || y >= 420) return 0; return img[(y * 1600 + x) * 4 + 3] / 255; };
    // cells for a text cap height of H metres: u along the word (z), v up the letters (x)
    const cells = (H) => { const Wm = (H * tw) / cap, out = []; const nz = Math.floor(Wm / CW), nx = Math.floor(H / CL); for (let a = 0; a < nx; a++) for (let b = 0; b < nz; b++) { const u = (b + 0.5) / nz, v = (a + 0.5) / nx; let cv = 0; for (const dv of [-0.3, 0, 0.3]) cv += cov(u, v + dv / nx); cv /= 3; if (cv > 0.5) out.push({ x: (a + 0.5) * CL, z: (b + 0.5) * CW - Wm / 2, cv }); } return { out, Wm, H: nx * CL }; };
    let lo = 10, hi = 80; for (let it = 0; it < 30; it++) { const mid = (lo + hi) / 2; if (cells(mid).out.length >= N) hi = mid; else lo = mid; }
    const C = cells(hi); const list = C.out.sort((p, q) => q.cv - p.cv).slice(0, N); const x0 = ox + 6; mainBox = { x0, x1: x0 + C.H, z0: oz - C.Wm / 2, z1: oz + C.Wm / 2 };
    // pair members with cells so that nobody crosses far: both sorted by z, then by x inside columns of 32
    const ms = []; for (let i = 0; i < N; i++) ms.push({ i, x: rings[i * 2], z: rings[i * 2 + 1] }); ms.sort((p, q) => p.z - q.z); list.sort((p, q) => p.z - q.z);
    for (let s = 0; s < N; s += 32) { const a = ms.slice(s, s + 32).sort((p, q) => p.x - q.x), b = list.slice(s, s + 32).sort((p, q) => p.x - q.x); a.forEach((m, q) => { MAIN[m.i * 2] = x0 + b[q].x; MAIN[m.i * 2 + 1] = oz + b[q].z; }); }
    // the hero takes the west-most cell near the middle of the word (she is in front when they turn to the sun); whoever had it takes hers
    let best = 0; for (let i = 1; i < N; i++) { if (Math.abs(MAIN[i * 2 + 1] - oz) < 8 && (Math.abs(MAIN[best * 2 + 1] - oz) >= 8 || MAIN[i * 2] < MAIN[best * 2])) best = i; }
    if (best) { const bx = MAIN[best * 2], bz = MAIN[best * 2 + 1]; MAIN[best * 2] = MAIN[0]; MAIN[best * 2 + 1] = MAIN[1]; MAIN[0] = bx; MAIN[1] = bz; } }
  const lerpL = (A, B, u, out) => { for (let i = 0; i < N * 2; i++) out[i] = A[i] + (B[i] - A[i]) * u; return out; };
  const tmp = new Float32Array(N * 2);
  const forkBar = (k) => 73 + k;                                     // stage k (2^k copies) begins on this bar's downbeat
  const stageAt = (t) => { let k = 0; while (k < 10 && t >= K.bar(forkBar(k + 1))) k++; return k; };
  const ease = (u) => { u = Math.min(1, Math.max(0, u)); return 1 - Math.pow(1 - u, 3); };
  // positions during the build: every fork is one decisive step that lands a beat after the downbeat
  function buildPos(t) { const k = stageAt(t); if (k === 0) return grids[0]; const u = ease((t - K.bar(forkBar(k))) / 0.40); return u >= 1 ? grids[k] : lerpL(grids[k - 1], grids[k], u, tmp); }
  return { N, D, grids, rings, MAIN, mainBox, hero10, stageAt, buildPos, lerpL, forkBar, cellL: CL, cellW: CW, canonDelay: (i, L) => Math.hypot(L[i * 2] - L[0], L[i * 2 + 1] - L[1]) * 0.012, jitter: (i) => hash1(i * 31 + 7) };
}
