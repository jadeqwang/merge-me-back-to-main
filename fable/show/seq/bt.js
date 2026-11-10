// BANACH-TARSKI (an Easter egg for the musician: her earlier video "Rewind" split and rejoined its protagonist with the paradox).
// Used twice: the split on "split" (seq 03, 28.62) and, reversed, one fold of "Fold me in again" (seq 05, b51.1 = 87.08).
//
// The body is scored with a lattice of small EQUILATERAL triangles (outlines of light, additive, no fill) lying in the plane that faces the camera, clipped to
// her silhouette (the skeleton's bones as capsules, seen from the lens). The lattice has two kinds of cell, point-up and point-down: a checkerboard.
// The paradox is real geometry here: the outlines of the point-up cells ALONE already draw every line of the lattice, and so do the point-down cells alone.
// So one scored body comes apart into two complete scored bodies, and nothing is left over. Every cell flies as a rigid piece (it only translates and turns
// in its plane by a multiple of 120 degrees, so it seats exactly), the two colours cross once (one stream over, one under), the seams flash gold and fade.
//
//   const BT = makeBT(K, props)                      props = makeProps(K): its stroke list is the line renderer (add pass, depth-tested, mirrored)
//   const ev = BT.event({ seed, a, tPre, tLift, tSeat, tEnd, cam0, cam1, groups: [{ cls: 0 | 1, color, src, dst, srcAt, dstAt }, ...] })
//       src / dst: the cast instance ({ pos, yaw, track, time }) the pieces leave (its pose at tLift) and seat on (its pose at tSeat)
//       srcAt(t) / dstAt(t): that body's ground point [x, z] at any t: the pieces ride it, so they inherit her run
//       srcBody(t) / dstBody(t) (optional, r3): the same instances at any t. With them every cell is bound to the bone it lies on and RIDES it: the scored
//       lattice follows her limbs before the lift, and the seated one follows them after the seat (it used to hold the seat pose while her legs ran on).
//       cam0 / cam1: the shot's camera at tLift / tSeat
//   ev.draw(b, t)     add this frame's strokes to a props stroke list b;  ev.dip(t) -> 0..1: how far to take the figures down (the pieces are what we see)
// Deterministic: everything is a function of t and the seed.
const TAU = Math.PI * 2, H3 = Math.sqrt(3) / 2;
const hash = (i, k = 0) => { const x = Math.sin(i * 127.1 + k * 311.7 + 0.5) * 43758.5453; return x - Math.floor(x); };
const sm = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); }, ss = (x, a, b) => sm((x - a) / (b - a));
const sm5 = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * u * (u * (6 * u - 15) + 10); };
// bones as capsules [joint a, joint b, radius m]: the puffy bomber, the very wide trousers (hair is left out: it streams behind her). Joint 21 = the top of
// her head. r3 (NOTES_v3: the heap was larger than her body, and a column): the radii are her own outline (a waist, a neck, two legs), and a cell is kept
// only if it lies INSIDE that outline by INSET cell sides (a cell reaches 0.58 sides from its centre), so the lattice is her size, not a size larger.
const BONES = [[0, 1, 0.16], [1, 2, 0.18], [2, 3, 0.085], [2, 6, 0.1], [6, 7, 0.085], [7, 8, 0.07], [2, 10, 0.1], [10, 11, 0.085], [11, 12, 0.07],
  [0, 13, 0.13], [13, 14, 0.125], [14, 15, 0.14], [15, 16, 0.075], [0, 17, 0.13], [17, 18, 0.125], [18, 19, 0.14], [19, 20, 0.075], [3, 21, 0.11]];
const INSET = 0.3;
const GOLD = [1.0, 0.7, 0.2], HIP = 0.95, FRONT = 0.34;                 // the lattice plane stands 0.34 m in front of her hips, toward the lens

export function makeBT(K, props) {
  const cast = K.cast;
  const joints = (b) => { const J = []; for (let j = 0; j < 21; j++) { const r = cast.root(b.track, b.time, j), o = cast.rot(b.yaw, r[0], r[2]); J.push([b.pos[0] + o[0], (b.pos[1] || 0) + r[1], b.pos[2] + o[1]]); }
    const nk = J[3], hd = J[4], d = [hd[0] - nk[0], hd[1] - nk[1], hd[2] - nk[2]], l = Math.hypot(...d) || 1; J.push([hd[0] + (d[0] / l) * 0.13, hd[1] + (d[1] / l) * 0.13, hd[2] + (d[2] / l) * 0.13]); return J; };
  const basis = (cam) => { const fx = cam.target[0] - cam.pos[0], fz = cam.target[2] - cam.pos[2], l = Math.hypot(fx, fz) || 1; return { r: [-fz / l, 0, fx / l], n: [-fx / l, 0, -fz / l] }; };
  // the cells of one kind inside a body's silhouette, as seen from camPos, in plane coordinates about P0 (x along r, y up)
  function cells(body, camPos, P0, B, a, cls, grow) {
    const J = joints(body), h = a * H3, P = [];
    const pr = (p) => { const dx = p[0] - camPos[0], dy = p[1] - camPos[1], dz = p[2] - camPos[2], s = ((P0[0] - camPos[0]) * B.n[0] + (P0[2] - camPos[2]) * B.n[2]) / (dx * B.n[0] + dz * B.n[2]);
      const q = [camPos[0] + dx * s, camPos[1] + dy * s, camPos[2] + dz * s]; return [(q[0] - P0[0]) * B.r[0] + (q[2] - P0[2]) * B.r[2], q[1] - P0[1], s]; };
    for (let j = 0; j < 22; j++) P.push(pr(J[j]));
    const caps = BONES.map(([i, j, r]) => [P[i], P[j], Math.max(0.2 * a, r * grow * 0.5 * (P[i][2] + P[j][2]) - INSET * a)]);
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; for (const [p, q, r] of caps) { x0 = Math.min(x0, p[0] - r, q[0] - r); x1 = Math.max(x1, p[0] + r, q[0] + r); y0 = Math.min(y0, p[1] - r, q[1] - r); y1 = Math.max(y1, p[1] + r, q[1] + r); }
    // the bone a point lies on (the capsule it is deepest inside): [bone index, place along it 0..1, offset from that place x, y], or null outside all of them
    const bind = (x, y) => { let best = null, bd = 0; caps.forEach(([p, q, r], bi) => { const ex = q[0] - p[0], ey = q[1] - p[1], l2 = ex * ex + ey * ey, u = l2 > 1e-9 ? Math.min(1, Math.max(0, ((x - p[0]) * ex + (y - p[1]) * ey) / l2)) : 0, ox = x - p[0] - ex * u, oy = y - p[1] - ey * u, d = Math.hypot(ox, oy) - r; if (d < bd) { bd = d; best = [bi, u, ox, oy]; } }); return best; };
    const out = new Map(), k = cls ? 2 / 3 : 1 / 3;
    for (let n = Math.floor(y0 / h) - 1; n <= Math.ceil(y1 / h); n++) for (let m = Math.floor((x0 - n * a * 0.5) / a) - 1; m <= Math.ceil((x1 - n * a * 0.5) / a); m++) {
      const x = (m + k) * a + (n + k) * a * 0.5, y = (n + k) * h, b = y + P0[1] > 0.02 ? bind(x, y) : null; if (b) out.set(m + ':' + n, { m, n, x, y, b }); }
    out.sc = P.map((q) => q[2]);            // each joint's scale on the plane (for `ride`)
    return out;
  }
  // RIDE (r3). q = a body's joints on the lattice plane about its own ground point (the reference projection's scales); a cell bound to a bone moves by what
  // that bone has moved since the reference pose (lift for the source, seat for the destination), and turns with it. Returns (cell) -> [dx, dy, dtheta].
  const qOf = (body, xz, B, sc) => joints(body).map((p, j) => [((p[0] - xz[0]) * B.r[0] + (p[2] - xz[1]) * B.r[2]) * sc[j], (p[1] - HIP) * sc[j]]);
  const Z3 = [0, 0, 0], still = () => Z3;
  const ride = (q0, q1) => { const M = BONES.map(([i, j]) => { const a0 = q0[i], b0 = q0[j], a1 = q1[i], b1 = q1[j], e0 = [b0[0] - a0[0], b0[1] - a0[1]], e1 = [b1[0] - a1[0], b1[1] - a1[1]];
      let th = Math.hypot(...e0) > 0.04 && Math.hypot(...e1) > 0.04 ? Math.atan2(e1[1], e1[0]) - Math.atan2(e0[1], e0[0]) : 0; th = Math.atan2(Math.sin(th), Math.cos(th)); return [a1[0] - a0[0], a1[1] - a0[1], b1[0] - b0[0], b1[1] - b0[1], th, Math.cos(th) - 1, Math.sin(th)]; });
    return (c) => { const [bi, u, ox, oy] = c.b, m = M[bi]; return [m[0] + (m[2] - m[0]) * u + m[5] * ox - m[6] * oy, m[1] + (m[3] - m[1]) * u + m[6] * ox + m[5] * oy, m[4]]; }; };
  // corner offsets of a cell about its centre (plane coordinates); cls 0 points up, cls 1 points down
  const corners = (a, cls) => { const R = a / Math.sqrt(3), s = cls ? -1 : 1; return [0, 1, 2].map((i) => { const th = s * (Math.PI / 2) + (i * TAU) / 3; return [R * Math.cos(th), R * Math.sin(th)]; }); };

  function event(o) {
    const a = o.a ?? 0.09, seed = o.seed ?? 1, B = basis(o.cam0), fl = o.tSeat - o.tLift, STAG = 0.24 * fl, pieces = [];
    const P0 = (xz) => [xz[0] + B.n[0] * FRONT, HIP, xz[1] + B.n[2] * FRONT];
    let ymin = 1e9, ymax = -1e9;
    o.groups.forEach((g, gi) => {
      const S = cells(g.src, o.cam0.pos, P0(g.srcAt(o.tLift)), B, a, g.cls, 1.0), D = cells(g.dst, o.cam1.pos, P0(g.dstAt(o.tSeat)), B, a, g.cls, 1.0), free = new Map(D), rest = [];
      g.scS = S.sc; g.scD = D.sc; g.qS = qOf(g.src, g.srcAt(o.tLift), B, S.sc); g.qD = qOf(g.dst, g.dstAt(o.tSeat), B, D.sc);
      for (const [k, c] of S) { if (free.has(k)) { pieces.push({ g: gi, s: c, d: free.get(k) }); free.delete(k); } else rest.push(c); }
      // limbs move between lift and seat: a cell with no twin goes to the nearest free cell; if none is free it seats ON a neighbour (nothing is left over)
      rest.sort((p, q) => p.y - q.y || p.x - q.x);
      for (const c of rest) { let best = null, bd = 1e9; for (const [k, d] of free) { const dd = (d.x - c.x) ** 2 + (d.y - c.y) ** 2; if (dd < bd) { bd = dd; best = k; } }
        if (best !== null) { pieces.push({ g: gi, s: c, d: free.get(best) }); free.delete(best); } else { let nb = null; bd = 1e9; for (const d of D.values()) { const dd = (d.x - c.x) ** 2 + (d.y - c.y) ** 2; if (dd < bd) { bd = dd; nb = d; } } if (nb) pieces.push({ g: gi, s: c, d: nb }); } }
      g.holes = free.size; });
    for (const p of pieces) { ymin = Math.min(ymin, p.s.y); ymax = Math.max(ymax, p.s.y); }
    // which side each stream ends on (screen-right = +1): they start by swinging to the OTHER side, so the two cross once on the way
    const ends = o.groups.map((g) => { const q = g.dstAt(o.tSeat); return q[0] * B.r[0] + q[1] * B.r[2]; }), mid = ends.reduce((s, v) => s + v, 0) / ends.length;
    o.groups.forEach((g, gi) => { g.side = Math.abs(ends[gi] - mid) > 0.02 ? Math.sign(ends[gi] - mid) : g.cls ? 1 : -1; g.cor = corners(a, g.cls); });
    pieces.forEach((p, i) => { const g = o.groups[p.g], id = p.s.m * 31 + p.s.n * 57 + g.cls * 7 + seed * 13;
      p.delay = STAG * (0.88 * (1 - (p.s.y - ymin) / Math.max(1e-3, ymax - ymin)) + 0.12 * hash(id, 1));       // they lift from the head down, row after row
      p.turn = (g.cls ? -1 : 1) * (TAU / 3); p.w = (o.swing ?? 0.5) * (0.88 + 0.24 * hash(id, 3)); p.up = (g.cls ? -0.1 : 0.22) * (0.85 + 0.3 * hash(id, 4)); });      // one stream = one sheet: every piece turns 120 degrees, the same way
    console.log(`bt: event at ${o.tLift.toFixed(2)}: ${pieces.length} pieces (${o.groups.map((g, gi) => pieces.filter((p) => p.g === gi).length + ' cls' + g.cls + ', ' + g.holes + ' unfilled').join(' | ')}), side ${a} m`);
    const W = o.width ?? 0.0028;
    function draw(b, t) {
      if (t < o.tPre || t > o.tEnd) return 0;
      const pre = ss(t, o.tPre, o.tLift), out = 1 - ss(t, o.tSeat + 0.14, o.tEnd), A = o.groups.map((g) => [P0(g.srcAt(t)), P0(g.dstAt(t))]);
      const RS = o.groups.map((g) => (g.srcBody && t < o.tSeat ? ride(g.qS, qOf(g.srcBody(t), g.srcAt(t), B, g.scS)) : still)), RD = o.groups.map((g) => (g.dstBody && t > o.tLift ? ride(g.qD, qOf(g.dstBody(t), g.dstAt(t), B, g.scD)) : still));
      for (const p of pieces) { const g = o.groups[p.g], u = (t - o.tLift - p.delay) / (fl - STAG), e = sm5(u), [As, Ad] = A[p.g];
        const rs = e < 1 ? RS[p.g](p.s) : Z3, rd = e > 0 ? RD[p.g](p.d) : Z3, e1 = 1 - e;                    // riding its bone: the source's until it lifts, the destination's once it seats
        const sw = -g.side * p.w * Math.sin(TAU * e) * (1 - 0.35 * e), dep = (g.cls ? -1 : 1) * 0.12 * Math.sin(Math.PI * e), th = p.turn * e + e1 * rs[2] + e * rd[2], c = Math.cos(th), s = Math.sin(th);
        const px = p.s.x + (p.d.x - p.s.x) * e + sw + e1 * rs[0] + e * rd[0], py = Math.max(0.03 - As[1], p.s.y + (p.d.y - p.s.y) * e + p.up * Math.sin(Math.PI * e) + e1 * rs[1] + e * rd[1]);
        const ox = As[0] + (Ad[0] - As[0]) * e + B.r[0] * px + B.n[0] * dep, oy = As[1] + py, oz = As[2] + (Ad[2] - As[2]) * e + B.r[2] * px + B.n[2] * dep;
        const fly = u > 0 && u < 1 ? 1 : 0, k = u >= 1 ? 1 : fly ? 0.25 + 0.75 * Math.min(1, u * 5) : 0;      // 0 scored white .. 1 its own colour
        // seated: its own colour for a moment (two colours side by side: the checkerboard), then the seams turn gold, flash and fade
        const gd = ss(t, o.tSeat + 0.05, o.tSeat + 0.13), fla = t > o.tSeat + 0.05 ? Math.exp(-Math.max(0, t - o.tSeat - 0.13) * 9) * gd : 0;
        const col = u >= 1 ? [0, 1, 2].map((i) => g.color[i] + (GOLD[i] - g.color[i]) * gd) : [0, 1, 2].map((i) => 1.0 * (1 - k) * [1, 0.9, 0.78][i] + g.color[i] * k);
        const gain = (u >= 1 ? (2.2 + 2.8 * fla) * out : u > 0 ? 2.4 : 1.6 * pre) * (o.gain ?? 1);
        const V = g.cor.map(([vx, vy]) => { const rx = vx * c - vy * s, ry = vx * s + vy * c; return [ox + B.r[0] * rx, oy + ry, oz + B.r[2] * rx]; });
        for (let i = 0; i < 3; i++) props.seg(b, V[i], V[(i + 1) % 3], col, W, gain, gain); }
      return 1;
    }
    // the figures step back while the pieces fly: down for the middle of the move (at most ~0.25 s), whole again as the pieces seat
    const dip = (t) => ss(t, o.tLift + 0.02, o.tLift + 0.12) * (1 - ss(t, o.tSeat - 0.17, o.tSeat - 0.03));
    return { draw, dip, n: pieces.length, o };
  }
  return { event };
}
