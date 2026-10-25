// Test EDL for the drone tree: grow (0–6 s), split pulses root->tips, merge pulses tips->root + flash, converge to one point.
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const ss = (a, b, x) => { const k = clamp((x - a) / (b - a)); return k * k * (3 - 2 * k); };

export const shots = [
  {
    t0: 0, t1: 16, kind: 'dronetree', bloom: .7,
    grow: (u, t) => clamp(t / 6),
    // + root->tips while it splits, then reverses: everything flows home
    flow: (u, t) => 5 * ss(5.5, 7, t) - 11 * ss(9.6, 11, t),
    flash: (u, t) => (t > 12.4 ? Math.exp(-(t - 12.4) * 2.2) : 0) + (t > 15.2 ? .6 * ss(15.2, 15.6, t) : 0),
    converge: (u, t) => ss(12.8, 15.6, t),
    cam: (u, t) => ({ orbit: .3 + .05 * t, height: 1.2 + .8 * ss(12, 16, t), dist: 30 - .2 * t, lookY: 6.6 - 3.4 * ss(12.5, 16, t), fov: 42 }),
  },
];
