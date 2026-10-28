// The frost (v6 intro 0-27.95 and the Chorus 2 bloom at 222.73): frost crystals growing across the window glass, written in characters.
// The frost IS the tree: one trunk, then every tip forks in two on a bar, so the branch count runs 1, 2, 4 … 1,024 (10 doublings, as the
// v5 drone tree did on bars 3-12). Each branch is a dendrite: a jittered stroke drawn with direction glyphs (- / | \), with frost-fern
// needles at ±60° that grow in after it, and DLA-style accretion (loose dim specks) around it. The newest growth front is bright and boils
// on ones; old ice is dim and still. Tips take the branch lanes (each tip is a life), the trunk is main.
// Geometry is generated once (seeded) in frame-height units, x from the left edge, y down; the root is at the bottom centre of the glass.
import { hash } from '../textlook.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const BRANCH_LANES = ['rose', 'sky', 'mint', 'gold', 'violet', 'white'];

export function buildFrost({ seed = 11, aspect = 16 / 9, gens = 10, trunk = .2, first = .19, ratio = .76, spread = .62, root = null } = {}) {
  const R = (i, k = 0) => hash(seed, i, k);
  const segs = [];
  const rootP = root || [aspect / 2, 1.02];
  let id = 0;
  // a: angle from vertical (+ = right); y is down, so the direction is (sin a, -cos a)
  const grow = (p, a, len, g, tip) => {
    const me = id++, q = [p[0] + Math.sin(a) * len, p[1] - Math.cos(a) * len];
    // the stroke: points every ~.004, with a small smooth perpendicular wander (dendrite jitter)
    const n = Math.max(2, Math.ceil(len / .004)), pts = [], nx = Math.cos(a), ny = Math.sin(a), ph = R(me, 1) * 6.28, amp = len * .035;
    for (let i = 0; i <= n; i++) { const f = i / n, w = Math.sin(f * Math.PI) * amp * Math.sin(ph + f * 9);
      pts.push([p[0] + (q[0] - p[0]) * f + nx * w, p[1] + (q[1] - p[1]) * f + ny * w]); }
    // frost-fern needles: short spikes at ±60° along the stroke, alternating sides, longer near the middle
    const needles = [];
    const nn = Math.floor(len / .014);
    for (let i = 1; i < nn; i++) {
      if (R(me, 10 + i) < .35) continue;
      const f = i / nn, side = i % 2 ? 1 : -1, L = len * (.08 + .22 * Math.sin(f * Math.PI)) * (.5 + R(me, 40 + i)), b = a + side * 1.05;
      const s = pts[Math.round(f * n)], m = Math.max(2, Math.ceil(L / .004)), np = [];
      for (let j = 1; j <= m; j++) np.push([s[0] + Math.sin(b) * L * j / m, s[1] - Math.cos(b) * L * j / m]);
      needles.push({ f, pts: np });
    }
    segs.push({ id: me, g, pts, needles, tip, lane: g <= 1 ? 'orange' : BRANCH_LANES[tip % BRANCH_LANES.length] });
    if (g >= gens) return;
    const s = spread * Math.pow(.9, g) * (.8 + .4 * R(me, 2)), l2 = (g === 0 ? first : len * ratio) * (.85 + .3 * R(me, 3));
    const lim = (x) => Math.max(-1.5, Math.min(1.5, x));
    grow(q, lim(a - s), l2, g + 1, tip * 2); grow(q, lim(a + s), l2 * (.85 + .3 * R(me, 4)), g + 1, tip * 2 + 1);
  };
  grow(rootP, 0, trunk, 0, 0);
  return { segs, gens, aspect, root: rootP };
}

const dirGlyph = (dx, dy) => {   // screen direction -> stroke character
  const a = Math.atan2(-dy, dx), k = ((Math.round(a / (Math.PI / 4)) % 4) + 4) % 4;
  return ['-', '/', '|', '\\'][k];
};

// A frost layer. o: { start(g) -> song time generation g starts growing, dur(g) -> its growth time (s), density, hold, fade, on,
//   gain(t), front (s the growth front stays bright), seed, accrete (0..1 amount of loose specks), lane override }
// Returns the layer; layer.count(t) = how many branches exist at t (1, 2, 4 …)
export function frost(o = {}) {
  let F = null;
  const start = o.start, dur = o.dur || (() => .5);
  const layer = {
    density: o.density ?? ((t) => .38 + .042 * genAt(t)), hold: o.hold ?? 2, on: o.on, fade: o.fade,
    draw(g, k) {
      if (!F || F.aspect !== g.W / g.H) F = buildFrost({ seed: o.seed ?? 11, aspect: g.W / g.H, root: o.root });
      const t = k.tq, H = g.H, gain = o.gain ? o.gain(k.t) : 1, front = o.front ?? .35;
      const put = (p, ch, ln, b) => g.put(Math.floor(p[0] * H / g.cw), Math.floor(p[1] * H / g.ch), ch, ln, clamp(b * gain), { max: true });
      for (const s of F.segs) {
        const t0 = start(s.g); if (t < t0) continue;
        const d = dur(s.g), x = clamp((t - t0) / d), e = 1 - Math.pow(1 - x, 3), n = Math.floor(e * (s.pts.length - 1));
        const age = t - t0 - d, old = .68 - .14 * (s.g / F.gens);
        for (let i = 0; i <= n; i++) {
          const p = s.pts[i], q = s.pts[Math.min(s.pts.length - 1, i + 1)], pr = s.pts[Math.max(0, i - 1)];
          const isFront = x < 1 && i > n - 6, glow = x < 1 ? Math.exp(-(n - i) / 12) : Math.exp(-Math.max(0, age) / front) * .6;
          const ch = isFront && i === n ? '*' : dirGlyph(q[0] - pr[0], q[1] - pr[1]);
          put(p, ch, isFront ? 'white' : (o.lane || (s.g <= 1 ? 'orange' : 'white')), old + (1 - old) * glow);
        }
        // the tip: a bright mark in its life's lane once the branch has reached it
        if (x >= 1) { const tw = .55 + .45 * hash(s.id, k.df, 5); put(s.pts[s.pts.length - 1], s.g >= F.gens ? '·' : '+', o.lane || s.lane, (s.g >= 6 ? .75 : .95) * tw); }
        // needles grow in after the stroke has passed them
        for (const nd of s.needles) {
          const tn = t0 + d * nd.f + .15; if (t < tn) continue;
          const y = clamp((t - tn) / (d * .8 + .2)), m = Math.ceil(y * nd.pts.length);
          for (let j = 0; j < m; j++) { const p = nd.pts[j], pr = j ? nd.pts[j - 1] : s.pts[Math.round(nd.f * (s.pts.length - 1))];
            put(p, dirGlyph(p[0] - pr[0], p[1] - pr[1]), o.lane || 'white', .32 + .3 * Math.exp(-Math.max(0, t - tn) / front)); }
        }
        // accretion: loose dim specks stuck around the stroke (DLA's fuzz), more on old ice
        const acc = (o.accrete ?? .5) * clamp((t - t0 - d) / 1.5);
        if (acc > 0) for (let i = 0; i < s.pts.length; i += 3) {
          if (hash(s.id, i, 77) > acc * .5) continue;
          const p = s.pts[i], ang = hash(s.id, i, 78) * 6.28, r = .006 + .012 * hash(s.id, i, 79);
          put([p[0] + Math.cos(ang) * r, p[1] + Math.sin(ang) * r], hash(s.id, i, 80) < .5 ? '.' : ':', o.lane || 'white', .25 + .2 * hash(s.id, i, k.df));
        }
      }
    },
  };
  const genAt = (t) => { let G = 0; for (let g = 1; g <= 10; g++) if (t >= start(g)) G = g; return G; };
  layer.gen = genAt;
  layer.count = (t) => (t < start(0) ? 0 : Math.pow(2, genAt(t)));
  layer.frost = () => F;
  return layer;
}
