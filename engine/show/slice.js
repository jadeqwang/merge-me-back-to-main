// Vertical slice: chorus 1 line 1 "Merge me back to main" on the dawn salt flat.
const P = new URLSearchParams(location.search);
const PLATE = P.get('plate') || '/work/plates/ch1_main_a_t1';
const S0 = +(P.get('s0') || 68.3);
const W = (w, a, b) => ({ w, start: a, end: b });
const LINE = JSON.parse(P.get('words') || 'null') || [W('Merge', 68.75, 69.6), W('me', 69.6, 70.3), W('back', 70.3, 71.2), W('to', 71.2, 71.9), W('main', 71.9, 75.0)];

export const shots = [
  {
    t0: 68.0, t1: 75.5, kind: 'lattice', plate: PLATE, s0: S0, fidBase: .65,
    cam: (u) => ({ dolly: 1 - .06 * u, orbit: -.04 + .05 * u, over: 1.06 }),
    text: (ty, t) => {
      ty.mono('git merge --no-ff branch/*  →  main', t, 68.1, { x: 110, y: 200, size: 24, out: 74.9 });
      ty.hook(LINE, t, { x: 110, y: 420, size: 170, maxW: 860, out: 75.1 });
    },
  },
];
