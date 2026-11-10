// 6 · bars 57-64 · 1:37.5-1:51.4 · breakdown A, strings (crash on b57).  Notes: fable/notes/actB.md
// One top-down shot (it runs on through 07 A to 116.64): it opens close, she fills the frame on the water with her hair fanned out; it rises and turns;
// fine filaments creep out of the hair; "Branch" 102.65 they fork, "wander" 103.88 they run out as roads; "Merge and return" 109.43 pulses come home.
// The graph, the camera and the frame are in actB_float.js.
import { actBFloat } from './actB_float.js';

export default function seq(K) {
  const F = actBFloat(K), t0 = K.bar(57), t1 = K.bar(65);
  return { name: '06_float', t0, t1, frame: (t) => F.top(t) };
}
