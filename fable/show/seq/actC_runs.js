// ACT C helper: the runs from the rings into the letter cells of MAIN (bars 88-96). Pure maths, no DOM, no engine: `planRuns` is called once by actC_form.js.
//
// One run = stand -> run -> stand, on baked tracks only, feet never sliding:
//   `run_from_stand` (1.5 s, 3.16 m, straight)  ->  `run_loop` (entered on its phase 0.704, left on phase 0: k whole strides + 0.30)  ->  `run_to_stand` (1.2 s, 2.45 m, straight)
//   so a path can only be Lk = 6.38 + 2.62 k metres long. Every copy brakes on the same song time T2 (the stop is in unison), so a longer path leaves EARLIER:
//   tDep = T2 - 1.5 - loopClock(k) / rate, rate in 0.85..1.15 of the loop (0.8817 puts a footfall on every beat; faster only when the time is short).
// The path: from A straight on a heading phi off east (s1 >= the 3.16 m of acceleration), ONE arc of radius R round to east, straight east (s2 >= the 2.45 m of braking)
//   into the cell. phi (and R from a short list) are solved so the length is exactly a legal Lk: she arrives facing east, on her cell, on a whole stride.
//   Cells straight ahead (no room for an arc) are legal only if their distance is a legal length within `tol` (the stride is then stretched by that much: <= 1.5 %).
// Who goes where: minimum total squared path length over all legal (copy, cell) pairs (Hungarian), where a pair is legal only if
//   - the copy can leave late enough: not before it is out of every frame (tHid: copies that are in shot until the b93 cut leave on or after the cut), and
//   - a copy that leaves before the cut stays out of frame until the cut (seenAt), all along its path.
export const sm = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };

// Hungarian assignment (Jonker-Volgenant form), cost row-major n x n; returns as[row] = column
export function hungarian(cost, n) { const u = new Float64Array(n + 1), v = new Float64Array(n + 1), p = new Int32Array(n + 1), way = new Int32Array(n + 1), minv = new Float64Array(n + 1), used = new Uint8Array(n + 1);
  for (let i = 1; i <= n; i++) { p[0] = i; let j0 = 0; minv.fill(Infinity); used.fill(0);
    do { used[j0] = 1; const i0 = p[j0], row = (i0 - 1) * n - 1; let delta = Infinity, j1 = 0; for (let j = 1; j <= n; j++) if (!used[j]) { const cur = cost[row + j] - u[i0] - v[j]; if (cur < minv[j]) { minv[j] = cur; way[j] = j0; } if (minv[j] < delta) { delta = minv[j]; j1 = j; } }
      for (let j = 0; j <= n; j++) if (used[j]) { u[p[j]] += delta; v[j] -= delta; } else minv[j] -= delta; j0 = j1; } while (p[j0] !== 0);
    do { const j1 = way[j0]; p[j0] = p[j1]; j0 = j1; } while (j0); }
  const as = new Int32Array(n); for (let j = 1; j <= n; j++) as[p[j] - 1] = j - 1; return as; }

// o: { n, start(i, t) -> [x, z] of copy i (0..n-1) in its earlier performance at song time t, tHid[i], seenAt(t, x, z) -> bool (t < tRun), cells: [[x, z]] stand points (n),
//      tRun, T2, FZ (run_from_stand travel), SZ (run_to_stand travel), tAcc (1.5), accZ(t) -> metres travelled t s into run_from_stand, per, v (run_loop), ph0 (loop time at hand-over),
//      beat, tol, rMax, fixed: { i: cell index } pairs that are given (the hero) }
export function planRuns(o) {
  const { n, cells, tRun, T2, FZ, SZ, per, v } = o, tAcc = o.tAcc ?? 1.5, rMax = o.rMax ?? 1.15, rBeat = per / (2 * o.beat); let tol = o.tol ?? 0.015, RS = o.radii || [3.2, 2.4, 4.6, 7];
  const lc = (k) => (per - o.ph0) + k * per, Lk = (k) => FZ + v * lc(k) + SZ, dStride = v * per, KMAX = 40;
  const PH = []; for (let q = 0; q <= 58; q++) PH.push(((2 + q * 3) * Math.PI) / 180);                       // 2 .. 176 degrees off east (past 90 she sets off away from the sun and hooks back)
  const fam = (dE, dLat, phi, R) => { const sp = Math.sin(phi), cp = Math.cos(phi), s1 = (dLat - R * (1 - cp)) / sp, s2 = dE - s1 * cp - R * sp; return { s1, s2, L: s1 + R * phi + s2, ok: s1 >= FZ + 0.02 && s2 >= SZ + 0.05 }; };
  // the shortest legal path for one radius: scan phi upward (the path grows with phi); the first legal length bracketed is solved exactly, else the first within tol is kept
  function solve1(dE, dLatS, R) { const dLat = Math.abs(dLatS), sg = dLatS < 0 ? -1 : 1; let loose = null;
    if (dLat < 0.05) { for (let k = 0; k <= KMAX; k++) { const sc = dE / Lk(k); if (Math.abs(sc - 1) <= tol) return { k, L: dE, phi: 0, s1: dE - SZ - 0.05, s2: SZ + 0.05, sc, R, dz: dLatS }; } return null; }
    let prev = null; for (const phi of PH) { const f = fam(dE, dLat, phi, R); f.phi = phi;
      if (f.ok && prev && prev.ok) { const a = Math.min(prev.L, f.L), b = Math.max(prev.L, f.L), k = Math.max(0, Math.ceil((a - Lk(0)) / dStride - 1e-9));
        if (k <= KMAX && Lk(k) <= b) { if (loose && loose.k < k) return loose; let p0 = prev.phi, p1 = f.phi; const inc = f.L > prev.L;
          for (let it = 0; it < 26; it++) { const pm = (p0 + p1) / 2; if ((fam(dE, dLat, pm, R).L < Lk(k)) === inc) p0 = pm; else p1 = pm; } const pm = (p0 + p1) / 2, fm = fam(dE, dLat, pm, R); return { k, L: fm.L, phi: pm * sg, s1: fm.s1, s2: fm.s2, sc: fm.L / Lk(k), R, dz: 0 }; } }
      if (f.ok && !loose) { const k = Math.max(0, Math.round((f.L - Lk(0)) / dStride)), sc = f.L / Lk(k); if (Math.abs(sc - 1) <= tol) loose = { k, L: f.L, phi: phi * sg, s1: f.s1, s2: f.s2, sc, R, dz: 0 }; }
      prev = f; }
    return loose; }
  function solve(dE, dLat, k0) { let best = null; for (const R of RS) { const b = solve1(dE, dLat, R); if (b && (!best || b.k < best.k)) best = b; if (best && best.k <= k0 + 1) break; } return best; }
  // where a run is: metres along the path at song time t, and the point + heading there
  const arcAt = (p, t) => { const dt = t - p.tDep; if (dt <= 0) return 0; return (dt < tAcc ? o.accZ(dt) : FZ + v * p.r * Math.min(dt - tAcc, lc(p.k) / p.r)) * p.sc; };
  function along(p, q) { const R = p.R, sg = p.phi < 0 ? -1 : 1, ph = Math.abs(p.phi), c = Math.cos(ph), sn = Math.sin(ph); let e, l, h = ph;
    if (q < p.s1) { e = q * c; l = q * sn; } else if (q < p.s1 + R * ph) { const a = (q - p.s1) / R; h = ph - a; e = p.s1 * c + R * (sn - Math.sin(h)); l = p.s1 * sn + R * (Math.cos(h) - c); } else { h = 0; e = p.s1 * c + R * sn + (q - p.s1 - R * ph); l = p.s1 * sn + R * (1 - c); }
    return { x: p.A[0] + e, z: p.A[1] + sg * l + (p.dz || 0) * Math.min(1, q / p.L), h: sg * h }; }
  const seenEarly = (p) => { if (p.tDep >= tRun) return false; for (let t = p.tDep; t < tRun; t += 0.25) { const w = along(p, arcAt(p, t)); if (o.seenAt(t, w.x, w.z)) return true; } const w = along(p, arcAt(p, tRun - 0.01)); return o.seenAt(tRun - 0.01, w.x, w.z); };
  function pair(i, B) { const tMin = o.tHid[i] >= tRun - 1e-6 ? tRun : o.tHid[i] + 0.1, tMax = T2 - tAcc - tMin; let A = o.start(i, Math.min(tRun, tMin)), out = null;
    for (let pass = 0; pass < 2; pass++) { const dE = B[0] - A[0], dLat = B[1] - A[1], k0 = Math.max(0, Math.ceil((Math.hypot(dE, dLat) * (1 - tol) - Lk(0)) / dStride - 1e-9)); if (lc(k0) / tMax > rMax) return null;      // too far for the time she has
      const s = solve(dE, dLat, k0); if (!s) return null; const rNeed = lc(s.k) / tMax; if (rNeed > rMax) return null;
      if (out) { if (s.k !== out.k) return null; const o2 = { ...s, r: out.r, tDep: out.tDep, A, B }; return seenEarly(o2) ? null : o2; }
      const r0 = Math.max(rNeed, rBeat); for (const r of [r0, 1.0, 1.08, rMax]) { if (r < r0) continue; const c = { ...s, r, tDep: T2 - tAcc - lc(s.k) / r, A, B }; if (!seenEarly(c)) { out = c; break; } }
      if (!out) return null; const A2 = o.start(i, Math.min(out.tDep, tRun)); if (Math.hypot(A2[0] - A[0], A2[1] - A[1]) < 1e-4) return out; A = A2; }      // she sets off from where her earlier performance has her at that moment
    return out; }
  // the assignment
  const fixed = o.fixed || {}, rows = [], cols = [], takenC = new Set(Object.values(fixed)); for (let i = 0; i < n; i++) if (!(i in fixed)) rows.push(i); for (let j = 0; j < n; j++) if (!takenC.has(j)) cols.push(j);
  const m = rows.length, INF = 1e7, cost = new Float64Array(m * m); let feas = 0;
  for (let a = 0; a < m; a++) for (let b = 0; b < m; b++) { const p = pair(rows[a], cells[cols[b]]); if (p) feas++; cost[a * m + b] = p ? p.L * p.L + (Math.abs(p.phi) > 1.6 ? 80 : 0) + (p.tDep < tRun ? 0 : 0) : INF; }
  let as = hungarian(cost, m); const runs = new Array(n).fill(null), cellOf = new Int32Array(n).fill(-1), strict = [tol, RS], loose = [o.tolLoose ?? 0.06, [3.2, 2.4, 1.8, 4.6, 7]], relaxed = new Set();
  for (const i in fixed) { runs[i] = pair(+i, cells[fixed[i]]); cellOf[i] = fixed[i]; }
  // copies left without a legal path (a few on the east rim, with no cell far enough ahead of them): give those alone a looser stride (<= 6 %) and a tighter arc, and assign again
  for (let a = 0; a < m; a++) if (cost[a * m + as[a]] >= INF) relaxed.add(a);
  if (relaxed.size) { [tol, RS] = loose; for (const a of relaxed) for (let b = 0; b < m; b++) { const p = pair(rows[a], cells[cols[b]]); cost[a * m + b] = p ? 1e4 + p.L * p.L : INF; } as = hungarian(cost, m); }
  for (let a = 0; a < m; a++) { [tol, RS] = relaxed.has(a) ? loose : strict; runs[rows[a]] = pair(rows[a], cells[cols[as[a]]]); cellOf[rows[a]] = cols[as[a]]; } [tol, RS] = strict;
  // statistics (for the console and the notes)
  const st = { n, feasiblePairs: feas / (m * m), relaxed: relaxed.size, failed: 0, kHist: {}, sumL: 0, maxL: 0, minDep: 1e9, maxDep: 0, early: 0, onBeat: 0, maxRate: 0, maxSpeed: 0, maxStretch: 0, hooks: 0, maxTurn: 0 };
  for (let i = 0; i < n; i++) { const p = runs[i]; if (!p) { st.failed++; continue; } st.kHist[p.k] = (st.kHist[p.k] || 0) + 1; st.sumL += p.L; st.maxL = Math.max(st.maxL, p.L); st.minDep = Math.min(st.minDep, p.tDep); st.maxDep = Math.max(st.maxDep, p.tDep); if (p.tDep < tRun - 1e-6) st.early++;
    if (Math.abs(p.r - rBeat) < 1e-6) st.onBeat++; st.maxRate = Math.max(st.maxRate, p.r); st.maxSpeed = Math.max(st.maxSpeed, v * p.r * p.sc); st.maxStretch = Math.max(st.maxStretch, Math.abs(p.sc - 1)); if (Math.abs(p.phi) > 1.6) st.hooks++; st.maxTurn = Math.max(st.maxTurn, Math.abs(p.phi)); }
  st.meanL = st.sumL / Math.max(1, n - st.failed);
  return { runs, cellOf, stats: st, lc, Lk, arcAt, along, rBeat };
}
