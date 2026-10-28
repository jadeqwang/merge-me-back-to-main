// v6 graphics layers that aren't footage: the intro counter, the breakdown's commit messages gathering into a frost branch, the radio dish,
// the context meter, the light crossing the night, words written in the air. All characters, all palette (textlook.js).
import { bigType, hash } from '../textlook.js';
import { LIFE, VIOLET } from '/engine/show/life_v6.js';

const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };
const fmt = (n) => n.toLocaleString('en-US');

// the intro's branch counter (1, 2, 4 … 1,024): digits made of digits, a small "branches" under them; each new count slams in
export function counter(count, o = {}) {
  return {
    density: .12, hold: 1, on: o.on, fade: o.fade,   // big cells: the number is a few real characters, readable at once
    draw(g, k) {
      const n = count(k.t); if (n < 1) return;
      const since = o.since ? k.t - o.since(k.t) : 1, kick = Math.exp(-Math.max(0, since) / .15);
      g.text(1, 1, fmt(n), 'white', .7 + .3 * kick);
    },
  };
}
export function counterLabel(count, o = {}) {
  return { density: .62, hold: 4, on: o.on, fade: o.fade,
    draw(g, k) { const n = count(k.t); if (n >= 1) g.text(3, Math.round(g.H * .12 / g.ch), n === 1 ? 'branch' : 'branches', 'white', .6); } };
}

// the title: MERGE made of its own letters (intro bar 9; the end card has its own)
export function bigTitle(g, k, kick = 0, fill = 1) {
  if (fill <= 0) return;
  bigType(g, 'MERGE', { size: 300 * g.W / 1920, y: g.H * .42, lane: 'orange', df: k.df, scale: 1 + .08 * kick, fill });
}

// Breakdown: every life's commit message drifts in as loose text (one every `every` s from t0), then on [g0, g1] each character flies to its
// place along one frost branch (a long rising stroke), and frost needles grow off it
export function messages(o) {
  const MSG = [...LIFE.map((l) => [l[3], l[2]]), [VIOLET[3], VIOLET[2]]];
  const { t0, g0, g1, every = .9 } = o;
  return {
    density: o.density ?? .52, hold: o.hold ?? 3, on: o.on, fade: o.fade,
    draw(g, k) {
      const t = k.tq, C = g.cols, R = g.rows;
      // the branch path (cells): bottom-left to top-right, a gentle S
      const path = []; let len = 0; const P = (f) => [C * (.06 + .88 * f), R * (.84 - .62 * f - .08 * Math.sin(f * Math.PI * 2))];
      let prev = P(0); for (let f = 0; f <= 1.0001; f += .001) { const p = P(f); len += Math.hypot(p[0] - prev[0], (p[1] - prev[1]) * 1.6); prev = p; if (len >= path.length) path.push(p); }
      let idx = 0;
      MSG.forEach(([m, ln], i) => {
        const a = t0 + i * every; if (t < a) { idx += m.length + 3; return; }
        const r0 = Math.round(R * (.1 + .78 * hash(i, 1, 3))), c0 = Math.round((C - m.length) * hash(i, 2, 3)), dx = (hash(i, 3, 3) - .5) * 3;
        const appear = clamp((t - a) / .5);
        for (let j = 0; j < m.length; j++, idx++) {
          if (m[j] === ' ') continue;
          const s = [c0 + j + dx * (t - a), r0], p = path[Math.min(path.length - 1, idx)], st = g0 + (g1 - g0) * .6 * (idx / 420);
          const f = ss(st, st + (g1 - g0) * .4, t), x = s[0] + (p[0] - s[0]) * f, y = s[1] + (p[1] - s[1]) * f;
          if (j / m.length <= appear) g.put(Math.round(x), Math.round(y), m[j], ln, .85);
        }
        idx += 3;
      });
      // needles grow off the gathered branch
      const nd = ss(g1 - .3, g1 + 1.2, t);
      if (nd > 0) for (let i = 4; i < Math.min(path.length, idx) - 1; i += 3) {
        const p = path[i], q = path[i + 1], a = Math.atan2(q[1] - p[1], q[0] - p[0]), side = (i / 3) % 2 ? 1 : -1, L = Math.round((2 + 5 * hash(i, 9, 9)) * nd);
        for (let s = 1; s <= L; s++) { const b = a + side * 1.05; g.put(Math.round(p[0] + Math.cos(b) * s), Math.round(p[1] + Math.sin(b) * s / 1.6), side > 0 ? '/' : '\\', 'white', .45); }
      }
    },
  };
}

// a radio dish drawn as characters (verse 2 set, until the generated dish plate exists): a parabola on a strut, the feed at its focus
export function dish(o = {}) {
  return {
    density: o.density ?? .42, hold: o.hold ?? 3, on: o.on, fade: o.fade,
    draw(g, k) {
      const W = g.W, H = g.H, cx = (o.x ?? .72) * W, cy = (o.y ?? .48) * H, s = (o.s ?? .32) * H;
      g.shape((c) => {
        c.strokeStyle = '#fff'; c.lineWidth = s * .05; c.lineCap = 'round';
        c.save(); c.translate(cx, cy); c.rotate(-.5);
        c.beginPath(); for (let i = -1; i <= 1.0001; i += .05) { const x = i * s, y = (i * i) * s * .45; i === -1 ? c.moveTo(x, y) : c.lineTo(x, y); } c.stroke();
        c.lineWidth = s * .02; for (const i of [-1, 1]) { c.beginPath(); c.moveTo(i * s, i * i * s * .45); c.lineTo(0, -s * .5); c.stroke(); }
        c.beginPath(); c.arc(0, -s * .5, s * .05, 0, 7); c.fillStyle = '#fff'; c.fill(); c.restore();
        c.lineWidth = s * .05; c.beginPath(); c.moveTo(cx, cy + s * .2); c.lineTo(cx + s * .1, cy + s * 1.3); c.stroke();
        c.beginPath(); c.moveTo(cx - s * .6, cy + s * 1.3); c.lineTo(cx + s * .8, cy + s * 1.3); c.stroke();
      }, { lane: o.lane ?? 'white', gain: .8, thresh: .2, df: k.df, boil: .1, bmin: .35 });
      if (o.label) g.text(g.col(cx) - 4, g.row(cy + s * 1.3) + 2, '1420 MHz', 'violet', .6);
    },
  };
}

// the violet branch's context meter: `context ▕██████░▏ 95%`
export function meter(pct, o = {}) {
  return {
    density: .6, hold: 2, on: o.on, fade: o.fade,
    draw(g, k) {
      const p = clamp(pct(k.t) / 100), n = 24, f = Math.round(p * n), r = Math.round(g.rows * (o.y ?? .08)), c = Math.round(g.cols * (o.x ?? .06));
      g.text(c, r, 'context', 'violet', .7);
      for (let i = 0; i < n; i++) g.put(c + 8 + i, r, i < f ? '█' : '░', 'violet', i < f ? .9 : .35);
      g.text(c + 9 + n, r, `${Math.round(p * 100)}%`, p >= 1 ? 'white' : 'violet', .9);
    },
  };
}

// a light crossing the night: a bright head and a fading trail of characters along a curve from `from` to `to` (frame fractions) on [t0, t1]
export function comet(o) {
  return {
    density: o.density ?? .55, hold: 1, on: o.on, fade: o.fade,
    draw(g, k) {
      const t = k.t, { from, to, t0, t1 } = o, bend = o.bend ?? -.18;
      const at = (f) => { const x = from[0] + (to[0] - from[0]) * f, y = from[1] + (to[1] - from[1]) * f + bend * Math.sin(f * Math.PI); return [x * g.cols, y * g.rows]; };
      const head = clamp((t - t0) / (t1 - t0)); if (t < t0) return;
      const e = 1 - Math.pow(1 - head, 2);
      for (let i = 0; i < 60; i++) {
        const f = e - i * .006; if (f < 0) break; const [x, y] = at(f), b = Math.exp(-i / 14) * (t > t1 ? Math.exp(-(t - t1) / .3) : 1);
        g.put(Math.round(x + (hash(i, k.df, 1) - .5) * i * .08), Math.round(y), i === 0 ? '✦' : i < 4 ? '*' : i < 14 ? '+' : '·', o.lane ?? 'violet', b, { max: true });
      }
    },
  };
}

// words written in the air with a pencil: the characters appear one by one along a gentle arc on [t0, t1]
export function airwrite(str, o) {
  return {
    density: o.density ?? .55, hold: o.hold ?? 2, on: o.on, fade: o.fade,
    draw(g, k) {
      const t = k.tq, n = Math.floor(clamp((t - o.t0) / (o.t1 - o.t0)) * str.length); if (n <= 0) return;
      const c0 = g.cols * (o.x ?? .1), r0 = g.rows * (o.y ?? .3);
      for (let i = 0; i < n; i++) { const ch = str[i]; if (ch === ' ') continue; const y = r0 - Math.sin(i / str.length * Math.PI) * 2;
        g.put(Math.round(c0 + i), Math.round(y), ch, o.lane ?? 'violet', i === n - 1 ? 1 : .8); }
    },
  };
}
