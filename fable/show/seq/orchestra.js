// TAKE TWO · bars 81-84 · THE ORCHESTRA (a variant of seq 08; fable/take2/notes/orchestra.md). Off with ?orch=0. Everything is a pure function of song time.
// Revision 2 (director's notes, 2026-11-13): every one of the 1,024 either plays or does wushu.
//   A MASSED ORCHESTRA of 985 seated (and standing) Jades in concentric arcs round the podium, one legal modern seating with multiplied desks
//   (as seen from the audience, which is WEST; the orchestra faces the podium at the hero's spot H):
//     band A, rows from 3.0 m: 1st violins front left, 2nd violins next to them, violas centre-right, cellos front right (outer string rows on the
//       right: double basses, behind the cellos)
//     band B: woodwinds in the centre (flutes | oboes in the front rows, clarinets | bassoons behind), horns left, harps at the far left of its
//       first row, basses still on the right
//     band C: trumpets, trombones and tubas behind the winds, horns left
//     band D (last row): timpani in the middle, percussion either side; one grand piano at the left edge
//   Wushu: the hero (as she was: her own take, place and facing), a row of six beside her and two blocks of 16 at the front wings, on the
//   original `build` take with the original facing (they turn to the sun on the spin at old 141.0-142.2 s, which turns them toward the orchestra).
//   The 256 copies that exist on bar 81 fly to the nearest places (the inner desks, the row, the wings) with a short comet tail and sit down by
//   beat 3; the copies of bars 82 and 83 are born seated in the outer desks, so the orchestra grows outward bar by bar (256 / 512 / 1,024).
// MOTION: procedural seated / standing tracks on the 21-joint skeleton (fkFrame + two-bone IK), driven by the measured beat grid (v2 beat index
//   = v3 beat index through the warp). Strings bow in unison per section (violins and violas every half beat, cellos every beat), timpani
//   alternate hands on every kick, bass drum on 1 and 3, snare on 2 and 4, cymbals each downbeat, winds and brass sway over the bar, the
//   trombone slide moves on the beat. From beat 3.5 of bar 84 every seated player rises with her instrument: on bar 85 all 1,024 stand.
// LOOK in these bars: a night ground with no reflection, no purple sky (dawn 0), the figures lit as at blue hour; instruments, chairs, stands as
//   strokes of light; chairs and stands only in the close shots (2, 4, 6); in the wides only the strong instrument silhouettes.
import { fkFrame, makeTrack, REST_POS, blendPose } from '../../engine/src/figure/skeleton.js';
import { add, sub, mul, norm, cross, dot, len, qframe, qrot } from '../../engine/src/figure/m.js';
import { makeProps } from '../props.js';

const sm = (u) => { u = Math.min(1, Math.max(0, u)); return u * u * (3 - 2 * u); };
const seg = (t, a, b) => Math.min(1, Math.max(0, (t - a) / (b - a)));
const lerp = (a, b, u) => a + (b - a) * u, lerp3 = (a, b, u) => [lerp(a[0], b[0], u), lerp(a[1], b[1], u), lerp(a[2], b[2], u)];
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const DEG = Math.PI / 180;
const h1 = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const mod = (a, n) => ((a % n) + n) % n;

// ------------------------------------------------------------------------------------------------ poses (track space: she faces +Z, her left is +X)
const L_UA = len(sub(REST_POS[7], REST_POS[6])), L_FA = len(sub(REST_POS[8], REST_POS[7])), SEAT_DY = 0.43;
const SEAT = { root: { y: -SEAT_DY }, thighL: [88, 6, 0], thighR: [88, 6, 0], shinL: [-86, 0, 0], shinR: [-86, 0, 0], footL: [-2, 0, 0], footR: [-2, 0, 0],
  spine: [3, 0, 0], chest: [2, 0, 0], neck: [0, 0, 0], head: [3, 0, 0], upArmL: [30, -28, 0], upArmR: [30, -28, 0], foreArmL: [50, 0, 0], foreArmR: [50, 0, 0] };
const STAND = { thighL: [0, 3, 0], thighR: [0, 3, 0], shinL: [-3, 0, 0], shinR: [-3, 0, 0], spine: [2, 0, 0], chest: [1, 0, 0], head: [2, 0, 0],
  upArmL: [4, -30, 0], upArmR: [4, -30, 0], foreArmL: [14, 0, 0], foreArmR: [14, 0, 0] };
const merge = (a, b) => { const o = { ...a, root: { ...(a.root || {}), ...((b && b.root) || {}) } }; for (const k in b || {}) if (k !== 'root') o[k] = b[k]; return o; };
const JP = (F, j) => [F[j * 7], F[j * 7 + 1], F[j * 7 + 2]], JQ = (F, j) => [F[j * 7 + 3], F[j * 7 + 4], F[j * 7 + 5], F[j * 7 + 6]];
const setJ = (F, j, p, q) => { if (p) { F[j * 7] = p[0]; F[j * 7 + 1] = p[1]; F[j * 7 + 2] = p[2]; } if (q) { F[j * 7 + 3] = q[0]; F[j * 7 + 4] = q[1]; F[j * 7 + 5] = q[2]; F[j * 7 + 6] = q[3]; } };
let LIFT = 0;                                                                  // while a pose is being made: how far she has risen from the chair (m)
// a seated pose with overrides, risen by r (0 seated .. 1 standing: legs straighten, hips up SEAT_DY)
function seated(ov, r = 0) { const a = merge(SEAT, ov); LIFT = SEAT_DY * r; if (r <= 0) return fk(a, false);
  const b = merge(a, { root: { y: 0 }, thighL: STAND.thighL, thighR: STAND.thighR, shinL: STAND.shinL, shinR: STAND.shinR, footL: [0, 0, 0], footR: [0, 0, 0] }); return fk(blendPose(a, b, r), false); }
function fk(pose, ground) { const F = new Float32Array(147); fkFrame(pose, F, 0, ground); return F; }
// two-bone IK for one arm (side 1 = her left, -1 = her right): the wrist on `target` (+ LIFT unless o.abs), the elbow toward `pole`
function arm(F, side, target, pole, o = {}) {
  if (!o.abs) target = [target[0], target[1] + LIFT, target[2]];
  const ua = side > 0 ? 6 : 10, fa = ua + 1, ha = ua + 2, S = JP(F, ua); const d = sub(target, S), dir = norm(d), dl = clamp(len(d), Math.abs(L_UA - L_FA) + 0.03, L_UA + L_FA - 0.004);
  const a = (L_UA * L_UA + dl * dl - L_FA * L_FA) / (2 * dl), h = Math.sqrt(Math.max(0, L_UA * L_UA - a * a));
  let pp = sub(pole, mul(dir, dot(pole, dir))); pp = len(pp) < 1e-5 ? [0, -1, 0] : norm(pp);
  const E = add(S, add(mul(dir, a), mul(pp, h))), Hn = add(S, mul(dir, dl)), yU = norm(sub(E, S)), yF = norm(sub(Hn, E));
  const qU = qframe(yU, add(yF, mul(pp, -0.3))), zUw = qrot(qU, [0, 0, 1]), qF = qframe(yF, add(mul(yU, -1), mul(zUw, 0.3)));
  const yH = o.dir ? norm(o.dir) : yF, qH = qframe(yH, o.thumb || qrot(qF, [0, 0, 1]));
  setJ(F, ua, null, qU); setJ(F, fa, E, qF); setJ(F, ha, Hn, qH); return Hn; }
const mouthOf = (F) => add(JP(F, 4), qrot(JQ(F, 4), [0, -0.035, 0.095]));
const bowEase = (u) => 0.55 * u + 0.45 * sm(u);
// fiddles (seated): u in [0,2) the bow (down 0-1, up 1-2); [2,3) she rises (the bow where the last stroke left it: violins at the tip, cellos mid-bow)
function bowS(u, riseS) { if (u >= 2) return { s: riseS, r: sm(u - 2) }; if (u < 1) return { s: bowEase(u), r: 0 }; return { s: 1 - bowEase(u - 1), r: 0 }; }
// winds, brass, harp: u in [0,4) the bar (sway), [4,5) she rises
const rise4 = (u) => (u >= 4 ? { u: 0, r: sm(u - 4) } : { u, r: 0 });
const POSES = {
  violin(u) { const b = bowS(u, 1); const F = seated({ spine: [4, 2 * Math.sin(b.s * 2), 0], head: [8, 15, 12] }, b.r);
    arm(F, 1, [0.33, 0.99, 0.40], [0.2, -1, 0.15], { thumb: [0, 1, 0] });
    arm(F, -1, lerp3([0.05, 0.98, 0.25], [-0.40, 0.86, 0.37], b.s), [-0.7, -0.5, -0.2], { thumb: [0, 0, 1] }); return F; },
  cello(u) { const b = bowS(u, 0.5); const F = seated({ thighL: [86, 20, 0], thighR: [86, 20, 0], shinL: [-84, 0, 0], shinR: [-84, 0, 0], spine: [7, 2 * Math.sin(b.s * 2), 0], head: [6, 7, 10] }, b.r);
    arm(F, 1, [0.13, 0.97, 0.27], [1, -0.4, -0.2], { thumb: [-1, 0, 0] });
    arm(F, -1, lerp3([-0.07, 0.66, 0.42], [-0.44, 0.60, 0.44], b.s), [-0.8, -0.4, -0.3], { thumb: [0, 0, 1] }); return F; },
  // double bass (standing): [0,2) bow, [2,3) lift, [3,4) the hit
  bass(u) { let s, up = 0; if (u < 1) s = bowEase(u); else if (u < 2) s = 1 - bowEase(u - 1); else if (u < 3) { s = 0; up = sm((u - 2) / 0.8); } else { s = sm((u - 3) / 0.45); up = 1 - sm((u - 3) / 0.06); }
    LIFT = 0; const F = fk(merge(STAND, { spine: [9, 2 * Math.sin(s * 2), -6], chest: [4, 0, -4], head: [4, 8, 6], thighL: [0, 6, 0], thighR: [-2, 6, 0] }), true);
    arm(F, 1, [0.17, 1.30, 0.17], [1, 0.1, -0.5], { thumb: [-1, 0, 0] });
    arm(F, -1, lerp3(lerp3([-0.05, 0.95, 0.38], [-0.42, 0.88, 0.42], s), [-0.1, 1.25, 0.40], up), [-0.8, -0.3, -0.3], { thumb: [0, 0, 1] }); return F; },
  timpani(u) { const hgt = (p) => { p = mod(p, 2); return sm(p / 0.32) * (1 - sm((p - 1.45) / 0.55)); };
    let hr, hl; if (u < 2) { hr = hgt(u); hl = hgt(u - 1); } else if (u < 3) { const w = sm((u - 2) / 0.85); hr = Math.max(lerp(hgt(0), 1, w), w); hl = Math.max(lerp(hgt(1), 1, w), w); } else { hr = hl = hgt(u - 3); }
    LIFT = 0; const F = fk(merge(STAND, { spine: [12, 0, 0], chest: [6, 0, 0], head: [10, 0, 0] }), true);
    for (const [side, h] of [[1, hl], [-1, hr]]) arm(F, side, lerp3([side * 0.30, 0.98, 0.34], [side * 0.24, 1.22, 0.24], h), [side, -0.6, -0.3], { dir: norm(lerp3([0, -0.42, 1], [0, 0.55, 1], h)), thumb: [0, 1, 0] });
    return F; },
  bassdrum(u) { const hgt = (p) => { p = mod(p, 2); return sm(p / 0.35) * (1 - sm((p - 1.4) / 0.6)); }; const h = u < 2 ? hgt(u) : u < 3 ? Math.max(hgt(0), sm((u - 2) / 0.85)) : hgt(u - 3);
    LIFT = 0; const F = fk(merge(STAND, { spine: [6, 0, 8], head: [6, 0, 12] }), true);
    arm(F, -1, lerp3([0.08, 0.92, 0.36], [-0.2, 1.12, 0.28], h), [-1, -0.5, -0.3], { dir: norm(lerp3([1, -0.1, 0.25], [0.2, 0.8, 0.5], h)), thumb: [0, 1, 0] });
    arm(F, 1, [0.32, 0.95, 0.30], [1, -0.6, -0.4]); return F; },
  snare(u) { const hgt = (p) => { p = mod(p, 2); return sm(p / 0.3) * (1 - sm((p - 1.5) / 0.5)); };
    let hr, hl; if (u < 2) { hr = hgt(u - 1); hl = 0.45 * hgt(u); } else if (u < 3) { const w = sm((u - 2) / 0.85); hr = Math.max(hgt(1), w); hl = Math.max(0.45 * hgt(2), w); } else hr = hl = hgt(u - 3);
    LIFT = 0; const F = fk(merge(STAND, { spine: [10, 0, 0], head: [12, 0, 0] }), true);
    for (const [side, h] of [[1, hl], [-1, hr]]) arm(F, side, lerp3([side * 0.14, 0.86, 0.30], [side * 0.18, 1.08, 0.24], h), [side, -0.6, -0.3], { dir: norm(lerp3([-side * 0.3, -0.35, 1], [-side * 0.2, 0.45, 1], h)), thumb: [0, 1, 0] });
    return F; },
  cymbals(u) { let a; if (u < 4) a = sm(u / 0.5) * (1 - sm((u - 3.3) / 0.7)); else if (u < 5) a = Math.max(sm(0.6), sm((u - 4) / 0.8)); else a = sm((u - 5) / 0.5);
    LIFT = 0; const F = fk(merge(STAND, { spine: [4, 0, 0], head: [4, 0, 0] }), true);
    for (const side of [1, -1]) arm(F, side, lerp3([side * 0.06, 1.12, 0.36], [side * 0.36, 1.22, 0.26], a), [side, -0.5, -0.4], { dir: [side * 0.15 * (1 - a), 0.9, 0.3], thumb: [-side, 0, 0] });
    return F; },
  flute(uu) { const { u, r } = rise4(uu), w = Math.sin((u / 4) * Math.PI * 2); const F = seated({ spine: [4, 3 * w, -6], chest: [2, 1.5 * w, -6], head: [4, -8, 12] }, r);
    const m = mouthOf(F), d = norm([-1, -0.07, 0.12]); arm(F, 1, add(add(m, mul(d, 0.12)), [0, -0.03, 0.03]), [0.3, -1, -0.5], { thumb: [0, -1, 0], abs: 1 }); arm(F, -1, add(add(m, mul(d, 0.38)), [0, -0.03, 0.03]), [-0.3, -1, 0], { thumb: [0, -1, 0], abs: 1 }); return F; },
  reed(uu) { const { u, r } = rise4(uu), w = Math.sin((u / 4) * Math.PI * 2); const F = seated({ spine: [5 + 2 * w, 2 * w, 0], head: [6 + 3 * w, 0, 0] }, r);
    const m = mouthOf(F), d = norm([0, -0.78, 0.62]); arm(F, 1, add(add(m, mul(d, 0.20)), [0.03, 0, 0.03]), [1, -0.5, -0.3], { abs: 1 }); arm(F, -1, add(add(m, mul(d, 0.42)), [-0.03, 0, 0.03]), [-1, -0.5, -0.3], { abs: 1 }); return F; },
  bassoon(uu) { const { u, r } = rise4(uu), w = Math.sin((u / 4) * Math.PI * 2); const F = seated({ spine: [4, 2 * w, 0], head: [5, 2, 4] }, r);
    arm(F, 1, [0.20, 1.00, 0.26], [1, -0.5, -0.4]); arm(F, -1, [0.04, 0.66, 0.34], [-1, -0.6, -0.2]); return F; },
  horn(uu) { const { u, r } = rise4(uu), w = Math.sin((u / 4) * Math.PI * 2); const F = seated({ spine: [3, 2 * w, 0], head: [4, 0, 0] }, r);
    arm(F, 1, [-0.02, 0.88, 0.30], [1, -0.6, -0.2]); arm(F, -1, [-0.27, 0.70, 0.12], [-1, -0.3, -0.5]); return F; },
  trumpet(uu) { const { u, r } = rise4(uu), w = Math.sin((u / 4) * Math.PI * 2); const F = seated({ spine: [2 - 3 * w, 0, 0], head: [-2 - 3 * w, 0, 0] }, r);
    const m = mouthOf(F), d = norm([0, -0.10 + 0.05 * w, 1]); arm(F, 1, add(add(m, mul(d, 0.20)), [0.04, -0.05, 0]), [1, -0.8, 0], { abs: 1 }); arm(F, -1, add(add(m, mul(d, 0.25)), [-0.02, -0.03, 0]), [-1, -0.8, 0], { abs: 1 }); return F; },
  trombone(uu) { const { u, r } = rise4(uu), k = Math.floor(mod(u, 4)), f = mod(u, 1), POS = [0.30, 0.62, 0.42, 0.80], s = lerp(POS[(k + 3) % 4], POS[k], sm(f / 0.14));
    const F = seated({ spine: [3, 0, 0], head: [-2, 0, 0] }, r); const m = mouthOf(F), d = norm([0, -0.18, 1]);
    arm(F, 1, add(add(m, mul(d, 0.16)), [0.07, -0.04, 0]), [1, -0.8, 0], { abs: 1 }); arm(F, -1, add(add(m, mul(d, s)), [-0.02, -0.16, 0]), [-1, -0.8, 0], { thumb: [0, 1, 0], abs: 1 }); return F; },
  tuba(uu) { const { u, r } = rise4(uu), w = Math.sin((u / 4) * Math.PI * 2); const F = seated({ spine: [2, 2 * w, 0], head: [4, 0, 0] }, r);
    arm(F, 1, [0.20, 0.92, 0.30], [1, -0.4, -0.2]); arm(F, -1, [-0.08, 0.95, 0.34], [-1, -0.6, -0.2]); return F; },
  harp(uu) { const { u, r } = rise4(uu), p = (k) => Math.sin((u * 2 + k) * Math.PI); const F = seated({ spine: [6, 0, 0], head: [6, -4, -6] }, r);
    arm(F, 1, [0.10 + 0.02 * p(0), 1.02 + 0.03 * p(0.5), 0.40], [1, -0.4, -0.2], { thumb: [0, 1, 0] }); arm(F, -1, [-0.08 + 0.02 * p(1), 1.06 + 0.03 * p(1.5), 0.36], [-1, -0.4, -0.3], { thumb: [0, 1, 0] }); return F; },
};
const TRACK_LEN = { violin: 3, cello: 3, bass: 4, timpani: 4, bassdrum: 4, snare: 4, cymbals: 6, flute: 5, reed: 5, bassoon: 5, horn: 5, trumpet: 5, trombone: 5, tuba: 5, harp: 5 };
const RISE0 = { violin: 2, cello: 2, flute: 4, reed: 4, bassoon: 4, horn: 4, trumpet: 4, trombone: 4, tuba: 4, harp: 4 };     // seated poses: where the rise segment starts
const STANDING = { bass: 1, timpani: 1, bassdrum: 1, snare: 1, cymbals: 1 };
const POSE_OF = { vn1: 'violin', vn2: 'violin', va: 'violin', vc: 'cello', db: 'bass', fl: 'flute', ob: 'reed', cl: 'reed', bn: 'bassoon', hn: 'horn', tp: 'trumpet', tb: 'trombone', tu: 'tuba', timp: 'timpani', harp: 'harp', pno: 'piano' };
const LANE_OF = { vn1: 'rose', vn2: 'coral', va: 'magenta', vc: 'violet', db: 'blue', fl: 'mint', ob: 'mint', cl: 'mint', bn: 'mint', hn: 'gold', tp: 'gold', tb: 'gold', tu: 'gold', timp: 'cyan', perc: 'cyan', harp: 'mint', pno: 'blue' };

// ------------------------------------------------------------------------------------------------ the massed seating
// rows of arcs round the podium; each row a list of [section, th0, th1, spacing m]; th from east toward +z (south), audience-left = negative
export function massedSeating(nSeats) {
  const rows = []; const DR = 1.05; let r = 3.0;
  const A = 15, B = 5, C = 2;
  for (let j = 0; j < A; j++, r += DR) rows.push({ r, band: 'A', segs: [['vn1', -86, -46, 0.78], ['vn2', -42, -4, 0.78], ['va', 4, 42, 0.78], j < 11 ? ['vc', 46, 86, 0.82] : ['db', 46, 86, 1.1]] });
  for (let j = 0; j < B; j++, r += DR) rows.push({ r, band: 'B', segs: [['harp', -86, -64, 1.6], ['hn', -60, -34, 0.85], [j < 3 ? 'fl' : 'cl', -30, -1, 0.8], [j < 3 ? 'ob' : 'bn', 1, 30, 0.8], j < 2 ? ['db', 34, 86, 1.1] : ['tb', 34, 86, 0.9]] });
  for (let j = 0; j < C; j++, r += DR) rows.push({ r, band: 'C', segs: [['hn', -86, -50, 0.85], ['tp', -46, -2, 0.9], ['tb', 2, 46, 0.9], ['tu', 50, 86, 1.25]] });
  r += 0.4; rows.push({ r, band: 'D', segs: [['perc', -86, -16, 1.4], ['timp', -14, 14, 2.1], ['perc', 16, 86, 1.4]] });
  const seats = [];
  rows.forEach((row, ri) => { for (const [sec, a0, a1, ds] of row.segs) { const span = (a1 - a0) * DEG * row.r, n = Math.max(1, Math.floor(span / ds));
    for (let k = 0; k < n; k++) { const th = (a0 + ((k + 0.5) / n) * (a1 - a0)) * DEG; seats.push({ sec, row: ri, band: row.band, k, n, r: row.r, th }); } } });
  // keep exactly nSeats - 1 (the piano is added): drop from the ends of the outermost rows (the timpani in the middle of the last row stay)
  seats.sort((p, q) => p.r - q.r || Math.abs(p.th) - Math.abs(q.th)); const out = seats.slice(0, nSeats - 1);
  out.push({ sec: 'pno', row: -1, band: 'P', k: 0, n: 1, r: 15.5, th: -93 * DEG });           // the grand piano: at the left edge, its case along the fan's edge toward the podium
  let pk = 0; for (const s of out) if (s.sec === 'perc') s.pose = ['bassdrum', 'snare', 'cymbals'][pk++ % 3];
  return { seats: out, total: seats.length + 1, rOut: r };
}

export function makeOrchestra(K, C) {
  const { bar, bb, cast, world: W, E } = K, T = K.T; const hx = C.hx, hz = C.hz, N = C.N;
  const tA = bar(81), tRise = bb(84, 3.5), tHit = bar(85), tLift = bb(84, 4), tEnd = E.Q.get('orchtail') === '1' ? bb(85, 2) : bar(85);
  const b0 = Math.round(T.beatAt(tA)), beatDur = (bb(85, 2) - bar(85));
  const P = makeProps(K, { max: 160000 }), hex = (n) => K.hex(K.LANE[n]);

  // ---- tracks (baked once; 60 fps; deterministic)
  const made = {};
  for (const name of Object.keys(POSES)) { const L = TRACK_LEN[name], n = Math.round(L * 60) + 1, tr = makeTrack('orch_' + name, n, { loop: false });
    for (let f = 0; f < n; f++) tr.data.set(POSES[name](Math.min(L - 1e-4, f / 60)), f * 147);
    tr.meta = { made: 'orchestra.js (procedural, beat-driven)' }; cast.tracks[tr.name] = tr; if (cast.fig && cast.fig.addTrack) cast.fig.addTrack(tr); made[name] = tr; }
  LIFT = 0;
  const quatAt = (name, time, j) => { const tr = made[name]; const f = clamp(Math.round(time * 60), 0, tr.frames - 1); return JQ(tr.data.subarray(f * 147, f * 147 + 147), j); };
  const riseOf = (pose, time) => (RISE0[pose] !== undefined && time >= RISE0[pose] ? sm(time - RISE0[pose]) : 0);

  // ---- places
  const WROW = [-2, 2, -4, 4, -6, 6].map((dz) => ({ x: hx - 1.8, z: hz + dz }));                                   // the wushu row beside the podium
  const WING = []; for (const sd of [-1, 1]) for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) WING.push({ x: hx - 3.0 - 2.2 * a, z: hz + sd * (12.0 + 2.2 * b) });   // two blocks of 16 at the wings
  const nSeats = N - 1 - WROW.length - WING.length, M = massedSeating(nSeats), seats = M.seats;
  for (const s of seats) { s.pose = s.pose || POSE_OF[s.sec]; s.lane = LANE_OF[s.sec]; s.x = hx + s.r * Math.cos(s.th); s.z = hz + s.r * Math.sin(s.th); s.yaw = Math.atan2(hx - s.x, hz - s.z); }
  const cm = seats.filter((s) => s.sec === 'vn1' && s.row === 0).sort((p, q) => p.th - q.th)[0]; cm.lane = 'main'; cm.concertmaster = true;
  const stands = []; { const byRow = {}; for (const s of seats) (byRow[s.sec + ':' + s.row] = byRow[s.sec + ':' + s.row] || []).push(s);
    for (const key in byRow) { const g = byRow[key].sort((p, q) => p.th - q.th), s0 = g[0]; if (['timp', 'perc', 'harp', 'pno'].includes(s0.sec)) continue; const pair = ['vn1', 'vn2', 'va', 'vc', 'db'].includes(s0.sec);
      for (let k = 0; k < g.length; k += pair ? 2 : 1) { const a = g[k], b = pair && g[k + 1] ? g[k + 1] : a; const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, d = norm([hx - mx, 0, hz - mz]), off = a.pose === 'bass' ? 0.95 : 0.78;
        stands.push({ x: mx + d[0] * off, z: mz + d[2] * off, yaw: Math.atan2(-d[0], -d[2]), who: b !== a ? [a, b] : [a], low: a.pose === 'bass' ? 0 : 1 }); } } }

  // ---- who goes where. The 255 copies of bar 81: the row and the wings take the nearest; the rest take the innermost seats (nearest copy per seat,
  // far seats first). The copies of bars 82 / 83 take the next seats outward, in angular order, born seated.
  const S = C.S, nOld = 256, taken = new Set([0]), role = new Array(N).fill(null);
  const pick = (x, z) => { let best = -1, bd = 1e9; for (let i = 1; i < nOld; i++) { if (taken.has(i)) continue; const d = Math.hypot(S[i].x - x, S[i].z - z); if (d < bd) { bd = d; best = i; } } taken.add(best); return best; };
  [...WROW, ...WING].forEach((w) => { const i = pick(w.x, w.z); role[i] = { kind: 'wushu', at: w }; });
  const order = [...seats].sort((p, q) => p.r - q.r || p.th - q.th); const nEarly = nOld - 1 - WROW.length - WING.length;
  order.slice(0, nEarly).sort((p, q) => q.r - p.r || p.th - q.th).forEach((s) => { const i = pick(s.x, s.z); s.i = i; role[i] = { kind: 'player', seat: s }; });
  { const rest = order.slice(nEarly), pri = (s) => s.sec === 'timp' || s.sec === 'perc' || (s.sec === 'db' && s.r < 16); const later = [...rest.filter(pri), ...rest.filter((s) => !pri(s))]; let i = nOld;      // the timpani, percussion and the inner basses are born on bar 82 (shots 4 and 6 need them)
  for (const s of later) { s.i = i; role[i] = { kind: 'player', seat: s, born: C.tBorn(C.S[i].k) }; i++; } }
  role[0] = { kind: 'hero' };
  // flights of the bar-81 copies: start between b81 + 0.05 s and beat 1.25, 0.36 s each; then the seated players sit down over 0.30 s
  const bdur = bb(81, 2) - bar(81), TF = 0.36, TSIT = 0.30;
  { const fl = []; for (let i = 1; i < nOld; i++) { const r = role[i], to = r.kind === 'player' ? r.seat : r.at; r.from = [S[i].x, S[i].z]; r.to = [to.x, to.z]; fl.push({ i, d: Math.hypot(S[i].x - to.x, S[i].z - to.z) }); }
    const ds = fl.map((f) => f.d).sort((a, b) => a - b); for (const f of fl) { const r = role[f.i], q = ds.indexOf(f.d) / Math.max(1, ds.length - 1); r.tS = tA + 0.05 + 0.5 * bdur * q + 0.02 * h1(f.i); r.tL = r.tS + TF; } }
  const polar = (a, b, u) => { const ra = Math.hypot(a[0] - hx, a[1] - hz), rb = Math.hypot(b[0] - hx, b[1] - hz); const aa = Math.atan2(a[1] - hz, a[0] - hx), ab = Math.atan2(b[1] - hz, b[0] - hx); let d = ab - aa; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
    const r = lerp(ra, rb, u), an = aa + d * u; return [hx + r * Math.cos(an), hz + r * Math.sin(an)]; };

  // ---- the clocks: track time of a pose at song time t (old time; beat index counted from the bar 81 downbeat)
  const beat = (t) => T.beatAt(t) - b0;
  function clock(pose, t) { const b = beat(t);
    if (RISE0[pose] !== undefined && t >= tRise) return RISE0[pose] + seg(t, tRise, tHit) * 0.999;
    if (pose === 'violin' || pose === 'cello') { const rate = pose === 'violin' ? 2 : 1, s = b * rate, k = Math.floor(s), f = s - k, down = rate === 2 ? k % 2 === 0 : mod(k, 2) === 1; return down ? f : 1 + f; }
    if (pose === 'bass') { if (t >= tHit) return 3 + Math.min(0.999, (t - tHit) / beatDur); if (t >= tLift) return 2 + seg(t, tLift, tHit) * 0.999; const s = b, k = Math.floor(s), f = s - k; return mod(k, 2) === 1 ? f : 1 + f; }
    const fin = pose === 'cymbals' ? 4 : 2;
    if (STANDING[pose]) { if (t >= tHit) return fin + 1 + Math.min(0.999, (t - tHit) / beatDur); if (t >= tLift) return fin + seg(t, tLift, tHit) * 0.999; return pose === 'cymbals' ? mod(b, 4) : mod(b, 2); }
    return Math.min(3.999, mod(b, 4)); }
  const pianoTime = (t) => { const x = mod(t - tA, 7.6); return 0.5 + (x < 3.8 ? x : 7.6 - x); };

  // ---- one body at t
  function seatedBody(i, s, t, out) { out.pos = [s.x, 0, s.z]; out.yaw = s.yaw; out.vary = 0;
    if (s.pose === 'piano') { out.track = 'life_piano'; out.time = pianoTime(t); out.face = { expr: 'calm', amt: 0.3 }; return out; }
    out.track = 'orch_' + s.pose; out.time = clock(s.pose, t); out.face = { expr: 'calm', amt: 0.25 };
    const r = role[i]; if (r.tL !== undefined && RISE0[s.pose] !== undefined && t < r.tL + TSIT) out.time = RISE0[s.pose] + 0.999 * (1 - sm((t - r.tL) / TSIT));      // arrives standing, sits down
    out.hand = s.pose === 'violin' || s.pose === 'cello' || s.pose === 'bass' ? { L: 0.35, R: 'grip' } : STANDING[s.pose] ? 'grip' : s.pose === 'harp' ? 0.1 : 0.3; return out; }
  function body(i, t) { const r = role[i];
    if (r.kind === 'hero') return { ...C.dancer(0, t, {}), lane: 'main', seed: 0 };
    const lane = r.kind === 'player' ? r.seat.lane : C.laneOf(i), out = { lane, seed: i + 1, gain: 1, alpha: 1 };
    if (r.born !== undefined) { if (t < r.born) return { visible: false }; const age = t - r.born; seatedBody(i, r.seat, t, out); out.gain = 1 + 1.6 * Math.exp(-age / 0.25); out.alpha = 0.35 + 0.65 * sm(age / 0.3); return out; }
    const u = seg(t, r.tS, r.tL), d = C.dancer(i, r.kind === 'wushu' ? t : Math.min(t, r.tS), {});
    if (u < 0.75) { const p = u > 0 ? polar(r.from, r.to, sm(u / 0.75) * 0.94) : r.from; let toYaw = r.kind === 'player' ? r.seat.yaw : d.yaw, dy = Math.atan2(Math.sin(toYaw - d.yaw), Math.cos(toYaw - d.yaw));
      Object.assign(out, { pos: [p[0], 0, p[1]], yaw: d.yaw + dy * sm(u / 0.75), track: d.track, time: u > 0 && r.kind === 'player' ? r.tS - (cast.songT0('build') || bar(73)) + (t - r.tS) * 0.3 : d.time, alpha: 1 - 0.6 * sm(u / 0.3), gain: 1 + 1.2 * sm(u / 0.2) });
      if (u > 0 && r.kind === 'player') out.vary = 0; return out; }
    out.alpha = 0.4 + 0.6 * sm((u - 0.75) / 0.25); out.gain = 1 + 1.2 * (1 - sm((t - r.tL) / 0.4));
    if (r.kind === 'wushu') return Object.assign(out, { pos: [r.at.x, 0, r.at.z], yaw: d.yaw, track: d.track, time: d.time });
    return seatedBody(i, r.seat, t, out); }

  // ---- strokes: chairs, stands, podium, instruments
  const DIM = [0.42, 0.48, 0.68];
  function chair(b, s, g, dy) { const M = P.placer({ pos: [s.x, 0, s.z], yaw: s.yaw }), c = DIM; const y = 0.45, x0 = -0.21, x1 = 0.21, z0 = -0.27, z1 = 0.16, w = 0.006;
    P.poly(b, [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]].map(M), c, w, g, true);
    for (const x of [x0 + 0.02, x1 - 0.02]) { for (const z of [z0 + 0.02, z1 - 0.02]) P.seg(b, M([x, y, z]), M([x, 0, z]), c, w * 0.8, g * 0.8); P.seg(b, M([x, y, z0]), M([x, 0.86, z0 - 0.05]), c, w, g); }
    P.seg(b, M([x0 + 0.02, 0.86, z0 - 0.05]), M([x1 - 0.02, 0.86, z0 - 0.05]), c, w, g); }
  function stand(b, st, g) { const M = P.placer({ pos: [st.x, 0, st.z], yaw: st.yaw }), c = DIM, w = 0.005, top = st.low ? 0.98 : 1.22;
    P.seg(b, M([0, 0.02, 0]), M([0, top, 0]), c, w, g); for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.4; P.seg(b, M([0, 0.12, 0]), M([0.2 * Math.cos(a), 0.01, 0.2 * Math.sin(a)]), c, w * 0.8, g * 0.8); }
    const tl = 25 * DEG, hw = 0.26, hh = 0.36, at = (x, v) => M([x, top + v * Math.cos(tl), -v * Math.sin(tl)]);
    P.poly(b, [at(-hw, 0), at(hw, 0), at(hw, hh), at(-hw, hh)], c, w, g, true); }
  function podium(b, g) { const M = P.placer({ pos: [hx, 0, hz], yaw: Math.PI / 2 }), c = hex('main').map((v) => v * 0.6 + 0.3), a = 0.8;      // a flat square on the mirror where she stands (no step: she stays where she was)
    P.poly(b, [[-a, 0.01, -a], [a, 0.01, -a], [a, 0.01, a], [-a, 0.01, a]].map(M), c, 0.008, g, true); }
  const ringPts = (C0, A1, A2, r1, r2, n = 24) => { const o = []; for (let k = 0; k < n; k++) { const a = (k / n) * 2 * Math.PI; o.push(add(C0, add(mul(A1, r1 * Math.cos(a)), mul(A2, r2 * Math.sin(a))))); } return o; };
  const FID = [[0, 0.03], [0.02, 0.16], [0.10, 0.27], [0.22, 0.29], [0.33, 0.25], [0.42, 0.172], [0.50, 0.155], [0.58, 0.172], [0.68, 0.222], [0.80, 0.236], [0.90, 0.2], [0.97, 0.115], [1.0, 0.045]];
  function fiddle(b, M, c, g, bot, A, Fw, bl, nl, wide) { const Sd = norm(cross(A, Fw)), at = (u, v, h = 0) => M(add(bot, add(mul(A, u), add(mul(Sd, v), mul(Fw, h)))));
    const half = FID.map(([u, v]) => [u * bl, v * bl]); P.poly(b, P.smooth3([...half.map(([u, v]) => at(u, v)), ...half.slice().reverse().map(([u, v]) => at(u, -v))], 3, true), c, wide ? 0.012 : 0.005, g, true);
    for (const s of [-1, 1]) P.seg(b, at(bl, s * 0.022 * bl), at(bl + nl, s * 0.016 * bl), c, wide ? 0.008 : 0.004, g * 0.9);
    if (wide) return;
    P.poly(b, P.smooth3([at(bl + nl, 0.016 * bl), at(bl + nl + 0.04, 0.03, -0.02), at(bl + nl + 0.07, 0, -0.05), at(bl + nl + 0.03, -0.02, -0.06)], 4), c, 0.004, g * 0.9);
    for (const s of [-1, 1]) P.seg(b, at(0.08 * bl, s * 0.01 * bl, 0.02), at(bl + nl - 0.02, s * 0.008 * bl, 0.02), c, 0.0016, g * 0.55);
    P.seg(b, at(0.36 * bl, -0.06 * bl, 0.03), at(0.36 * bl, 0.06 * bl, 0.03), c, 0.003, g * 0.8);
    const pin = add(bot, mul(A, -0.02)); P.seg(b, M(pin), M([pin[0] + A[0] * -pin[1] / A[1], 0.0, pin[2] + A[2] * -pin[1] / A[1]]), c, 0.003, g * 0.8); }
  const bowLine = (b, M, hand, contact, Lb, c, g, w = 0.003) => { const D = norm(sub(contact, hand)); P.seg(b, M(add(hand, mul(D, -0.04))), M(add(hand, mul(D, Lb))), [1, 0.96, 0.9], w, g * 1.2); };
  const tipOf = (name, time, j, Lm) => qrot(quatAt(name, time, j), [0, Lm, 0]);
  // wide = only the strong silhouettes (bows, cello and bass bodies and necks, harp frame, piano lid, timpani rims, brass bells)
  function instrument(b, s, o, g, wide) { const tn = s.pose, dy = riseOf(tn, o.time) * SEAT_DY, M0 = P.placer(o), M = dy ? (p) => M0([p[0], p[1] + dy, p[2]]) : M0;
    const c = o.color.map((v) => v + (1 - v) * 0.3), J = (j) => cast.root(o.track, o.time, j), G = 1.6 * g;
    if (tn === 'violin') { if (!wide) { P.violin(b, { ...o, gain: g * (s.concertmaster ? 1.3 : 1) }); return; }
      const nk = J(3), hl = J(8), ct = lerp3(add(nk, [0.07, 0, 0.06]), hl, 0.42); bowLine(b, M0, J(12), ct, 0.68, c, G, 0.007); return; }
    if (tn === 'cello') { const bot = [-0.02, 0.17, 0.46], A = norm([0.11, 0.66, -0.22]), Fw = norm([0, 0.3, 1]); fiddle(b, M, c, G, bot, A, Fw, 0.76, 0.42, wide);
      bowLine(b, M0, J(12), add(add(add(bot, mul(A, 0.30)), mul(Fw, 0.07)), [0, dy, 0]), 0.72, c, G, wide ? 0.007 : 0.003); return; }
    if (tn === 'bass') { const bot = [0.03, 0.14, 0.40], A = norm([0.05, 1, -0.16]), Fw = norm([0, 0.15, 1]); fiddle(b, M, c, G, bot, A, Fw, 1.0, 0.62, wide);
      bowLine(b, M, J(12), add(add(bot, mul(A, 0.36)), mul(Fw, 0.1)), 0.70, c, G, wide ? 0.007 : 0.003); return; }
    if (tn === 'timpani') { const D = [[0.62, 0.40, 0.36], [0.22, 0.66, 0.33], [-0.22, 0.66, 0.31], [-0.62, 0.40, 0.28]];
      for (const [x, z, r] of D) { P.poly(b, ringPts([x, 0.84, z], [1, 0, 0], [0, 0, 1], r, r, 28).map(M), c, wide ? 0.012 : 0.005, G * 1.1, true); if (wide) continue;
        P.poly(b, ringPts([x, 0.50, z], [1, 0, 0], [0, 0, 1], r * 0.62, r * 0.62, 16).map(M), c, 0.003, G * 0.5, true);
        for (let k = 0; k < 8; k++) { const a = (k / 8) * 2 * Math.PI, ca = Math.cos(a), sa = Math.sin(a); P.poly(b, P.smooth3([[x + r * ca, 0.84, z + r * sa], [x + r * 0.92 * ca, 0.66, z + r * 0.92 * sa], [x + r * 0.62 * ca, 0.5, z + r * 0.62 * sa], [x + r * 0.2 * ca, 0.40, z + r * 0.2 * sa]], 3).map(M), c, 0.0025, G * 0.4); } }
      for (const j of [8, 12]) { const h = J(j), tip = add(h, tipOf(tn, o.time, j, 0.36)); P.seg(b, M(h), M(tip), [1, 0.96, 0.9], 0.004, G); P.dot(b, M(tip), c, 0.03, G * 1.2); } return; }
    if (tn === 'bassdrum') { const C0 = [0.36, 0.62, 0.42], ax = norm([1, 0, 0.15]), Fd = norm([-0.15, 0, 1]); for (const d of [-0.2, 0.2]) P.poly(b, ringPts(add(C0, mul(ax, d)), [0, 1, 0], Fd, 0.48, 0.48, 32).map(M), c, wide ? 0.012 : 0.005, G, true);
      const h = J(12), tip = add(h, tipOf(tn, o.time, 12, 0.34)); P.seg(b, M(h), M(tip), [1, 0.96, 0.9], 0.004, G); P.dot(b, M(tip), c, 0.04, G * 1.2); return; }
    if (tn === 'snare') { P.poly(b, ringPts([0, 0.78, 0.44], [1, 0, 0], [0, 0, 1], 0.18, 0.18, 24).map(M), c, wide ? 0.01 : 0.005, G, true); if (wide) return;
      for (let k = 0; k < 3; k++) { const a = (k / 3) * 2 * Math.PI; P.seg(b, M([0.12 * Math.cos(a), 0.64, 0.44 + 0.12 * Math.sin(a)]), M([0.3 * Math.cos(a), 0.0, 0.44 + 0.3 * Math.sin(a)]), c, 0.003, G * 0.5); }
      for (const j of [8, 12]) { const h = J(j), tip = add(h, tipOf(tn, o.time, j, 0.4)); P.seg(b, M(h), M(tip), [1, 0.96, 0.9], 0.003, G); } return; }
    if (tn === 'cymbals') { for (const j of [8, 12]) { const h = J(j), q = quatAt(tn, o.time, j), n = qrot(q, [j === 8 ? -1 : 1, 0, 0]), A1 = norm(cross(n, [0, 1, 0])), A2 = norm(cross(n, A1)), Cc = add(h, qrot(q, [0, 0.08, 0]));
        P.poly(b, ringPts(Cc, A1, A2, 0.22, 0.22, 28).map(M), [1, 0.92, 0.7], wide ? 0.012 : 0.005, G * 1.1, true); } return; }
    if (tn === 'harp') { const base = [0.02, 0.04, 0.60], top = [0.02, 1.82, 0.74], sb = [-0.13, 1.08, 0.10], w = wide ? 2 : 1; P.seg(b, M(base), M(top), c, 0.012 * w, G); P.seg(b, M(base), M(sb), c, 0.02 * w, G * 0.8);
      const neck = P.smooth3([top, [-0.04, 1.70, 0.50], [-0.10, 1.44, 0.28], sb], 5); P.poly(b, neck.map(M), c, 0.008 * w, G); if (wide) return;
      for (let k = 1; k < 16; k++) { const u = k / 16, p = lerp3(base, sb, u), q = neck[Math.min(neck.length - 1, Math.round((1 - u) * (neck.length - 1)))]; P.seg(b, M(p), M(lerp3(p, q, 0.98)), [1, 0.96, 0.9], 0.0012, G * 0.45); } return; }
    if (tn === 'piano') { if (!wide) P.piano(b, { ...o, gain: g * 0.8 }); const yT = 0.98, yB = 0.72, z0 = 0.44, L = 1.85, sp = 0.70, rt = -0.70;
      const out = [[sp, z0], [sp, z0 + L], [sp - 0.30, z0 + L + 0.08], [rt + 0.55, z0 + L - 0.25], [rt + 0.15, z0 + 1.0], [rt, z0 + 0.55], [rt, z0]], cs = P.smooth3(out.map(([x, z]) => [x, 0, z]), 3, false);
      const al = 42 * DEG, lid = cs.map((p) => { const dx = sp - p[0]; return [sp - dx * Math.cos(al), yT + dx * Math.sin(al), p[2]]; }); P.poly(b, lid.map(M), [1, 0.96, 0.9], wide ? 0.012 : 0.004, G * 0.9, false);
      P.poly(b, cs.map((p) => M([p[0], yT, p[2]])), c, wide ? 0.01 : 0.005, G, false); if (wide) return;
      P.poly(b, cs.map((p) => M([p[0], yB, p[2]])), c, 0.005, G * 0.6, false);
      for (const [x, z] of [[sp - 0.08, z0 + 0.12], [rt + 0.08, z0 + 0.12], [0.2, z0 + L - 0.1]]) P.seg(b, M([x, yB, z]), M([x, 0, z]), c, 0.006, G * 0.7); return; }
    const m = add(J(4), qrot(quatAt(tn, o.time, 4), [0, -0.035, 0.095]));
    if (tn === 'flute') { const d = norm(sub(J(12), J(8))), a = add(m, mul(d, -0.06)), e = add(m, mul(d, 0.62)); P.seg(b, M0(a), M0(e), [1, 0.96, 0.9], wide ? 0.008 : 0.005, G * (wide ? 0.6 : 1)); return; }
    if (tn === 'reed') { const d = norm(sub(J(12), J(8))), e = add(m, mul(d, 0.64)); P.seg(b, M0(m), M0(e), [0.92, 0.9, 1], 0.009, G * (wide ? 0.6 : 0.9)); if (s.sec === 'cl' && !wide) P.poly(b, ringPts(e, norm(cross(d, [1, 0, 0])), [1, 0, 0], 0.035, 0.035, 14).map(M0), c, 0.003, G, true); return; }
    if (tn === 'bassoon') { const lo = [-0.06, 0.40, 0.30], hi = [0.32, 1.62, 0.16]; P.seg(b, M(lo), M(hi), c, 0.022, G * (wide ? 0.6 : 0.8)); if (!wide) P.poly(b, P.smooth3([m, add(m, [0.05, -0.05, 0.12]), add(lerp3(lo, hi, 0.62), [0, dy, 0])], 4).map(M0), [1, 0.96, 0.9], 0.003, G); return; }
    if (tn === 'horn') { const Cc = [-0.13, 0.84, 0.28], A1 = [0, 1, 0], A2 = norm([0.2, 0, 1]), bell = [-0.30, 0.70, 0.08]; P.poly(b, ringPts(bell, [0, 1, 0], [0, 0, 1], 0.14, 0.14, 22).map(M), c, wide ? 0.012 : 0.005, G, true); if (wide) return;
      P.poly(b, ringPts(Cc, A1, A2, 0.16, 0.16, 26).map(M), c, 0.005, G, true); P.seg(b, M(add(Cc, [0, -0.16, 0])), M(bell), c, 0.008, G * 0.8); return; }
    if (tn === 'trumpet') { const d = norm(sub(lerp3(J(8), J(12), 0.5), m)), dd = norm([d[0], d[1] * 0.3, d[2]]), e = add(m, mul(dd, 0.50)); P.poly(b, ringPts(e, [1, 0, 0], [0, 1, 0], 0.065, 0.065, 18).map(M0), c, wide ? 0.01 : 0.004, G * 1.1, true);
      P.seg(b, M0(m), M0(e), [1, 0.96, 0.9], 0.006, G * (wide ? 0.6 : 1)); return; }
    if (tn === 'trombone') { const d = norm([0, -0.18, 1]), hr = J(12), se = add(m, mul(d, 0.92)), bell = add(add(m, [0.12, -0.02, 0]), mul(d, 0.55)); P.poly(b, ringPts(bell, [1, 0, 0], [0, 1, 0], 0.11, 0.11, 20).map(M0), c, wide ? 0.012 : 0.005, G * 1.1, true);
      P.seg(b, M0(m), M0(se), [1, 0.96, 0.9], wide ? 0.007 : 0.004, G * (wide ? 0.6 : 1)); if (wide) return; P.seg(b, M0(add(m, [0, -0.08, 0])), M0(add(se, [0, -0.08, 0])), c, 0.004, G * 0.8); P.seg(b, M0(add(hr, [0.02, 0.08, 0])), M0(add(hr, [0.02, -0.08, 0])), c, 0.005, G); return; }
    if (tn === 'tuba') { P.poly(b, ringPts([0.22, 1.50, 0.15], [1, 0, 0], [0, 0, 1], 0.24, 0.24, 26).map(M), c, wide ? 0.014 : 0.006, G * 1.1, true); if (wide) return;
      P.poly(b, ringPts(lerp3([0.02, 0.52, 0.30], [0.10, 1.32, 0.22], 0.4), [1, 0, 0.2], [0, 1, 0], 0.17, 0.36, 26).map(M), c, 0.006, G, true); return; } }

  // ---- the eight shots (two per bar: on the bar line and on beat 3). chairs / stands: gain (0 = off); wide: only the strong instrument silhouettes
  const R = (x, y, z) => [hx + x, y, hz + z], PL = (thDeg, r, y) => [hx + r * Math.cos(thDeg * DEG), y, hz + r * Math.sin(thDeg * DEG)];
  const timp = seats.filter((s) => s.sec === 'timp').sort((p, q) => Math.abs(p.th) - Math.abs(q.th))[0], tdir = norm([hx - timp.x, 0, hz - timp.z]), tside = norm(cross([0, 1, 0], tdir));
  const dbIn = seats.filter((s) => s.sec === 'db').sort((p, q) => p.r - q.r || p.th - q.th), dbC = dbIn.slice(0, 6).reduce((a, s) => [a[0] + s.x / 6, a[1] + s.z / 6], [0, 0]), dbR = Math.hypot(dbC[0] - hx, dbC[1] - hz);
  const SHOTS = [
    { name: 'above', t0: bar(81), chairs: 0.3, stands: 0, wide: true, cam: (u) => ({ pos: R(lerp(-9.5, -8.5, u), lerp(11.5, 10.5, u), lerp(-9.0, -8.2, u)), target: R(3.6, 0.4, 0.2), fov: 46 }) },
    { name: 'side_low_violins', t0: bb(81, 3), chairs: 0.55, stands: 0.32, wide: false, cam: (u) => ({ pos: R(lerp(-0.75, -0.45, u), 0.98, lerp(-0.85, -1.15, u)), target: R(2.7, 0.92, -4.7), fov: 32, focusDist: 3.0, aperture: 0.012 }) },
    { name: 'above_behind', t0: bar(82), chairs: 0, stands: 0, wide: true, cam: (u) => ({ pos: PL(-36, lerp(6.9, 6.4, u), lerp(2.35, 2.2, u)), target: PL(-38, 1.6, 0.5), fov: 50 }) },
    { name: 'timpani', t0: bb(82, 3), chairs: 0.55, stands: 0.32, wide: false, cam: (u) => { const p = add(add([timp.x, lerp(1.80, 1.70, u), timp.z], mul(tdir, lerp(-1.55, -1.35, u))), mul(tside, 0.85)); return { pos: p, target: [timp.x + tdir[0] * 3.2, 0.85, timp.z + tdir[2] * 3.2], fov: 42, focusDist: 2.2, aperture: 0.006 }; } },
    { name: 'conductor_view', t0: bar(83), chairs: 0, stands: 0, wide: true, cam: (u) => ({ pos: PL(0, lerp(6.9, 6.4, u), 1.5), target: R(-0.6, 1.2, 0), fov: 40, focusDist: 6.5, aperture: 0.004 }) },
    { name: 'basses_side', t0: bb(83, 3), chairs: 0.55, stands: 0.32, wide: false, cam: (u) => ({ pos: PL(lerp(97, 96, u), dbR + 0.6, 1.3), target: [dbC[0], 1.1, dbC[1]], fov: 36, focusDist: 4.5, aperture: 0.01 }) },
    { name: 'high_wide', t0: bar(84), chairs: 0, stands: 0, wide: true, cam: (u) => ({ pos: R(9.5 - 0.01, lerp(47, 45.5, u), 0), target: R(9.5, 0, 0), fov: 44, topUp: [1, 0, 0] }) },
    { name: 'last_wide', t0: bb(84, 3), chairs: 0, stands: 0, wide: true, cam: (u) => ({ pos: R(lerp(-17.0, -15.6, u), lerp(14.5, 13.5, u), 0.0), target: R(8.5, 0, 0), fov: 50 }) },
  ];
  const dev = E.Q.get('orchcam');      // dev: --q "orchcam=x,y,z,tx,ty,tz,fov" (relative to H) holds one camera over the whole variant
  function shotAt(t) { let k = 0; while (k < SHOTS.length - 1 && t >= SHOTS[k + 1].t0) k++; const a = SHOTS[k].t0, b = k + 1 < SHOTS.length ? SHOTS[k + 1].t0 : tHit; return { k, s: SHOTS[k], u: Math.min(1.2, (t - a) / (b - a)) }; }

  // ---- the frame
  const on = (t) => t >= tA && t < tEnd, HOOKS = E.Q.get('orchhooks') === '1';
  const FIGLIGHT = { ambient: [+(E.param('orchamb', 0.42)), +(E.param('orchamb', 0.42)) * 1.0, +(E.param('orchamb', 0.42)) * 1.45], rimCol: [1.6, 0.8, 1.04], rimBoth: 0.3, sunAmt: 0.12, under: 0.5, emissive: 1.5, fibres: 0.8, trans: 0.2, face: 1 };     // the figure lit as at blue hour (dawn 0.35)
  function frame(t) {
    const sh = shotAt(t), SS = sh.s; let camera = { ...SS.cam(sh.u), far: 30000 }; if (camera.aperture === undefined) camera.aperture = 0;
    if (dev) { const v = dev.split(',').map(Number); camera = { pos: R(v[0], v[1], v[2]), target: R(v[3], v[4], v[5]), fov: v[6] || 40, far: 30000, aperture: 0, topUp: [1, 0, 0] }; }
    if (!camera.focusDist) camera.focusDist = 10;
    const cr = cast.crowd('thousand', N), nLive = t < bar(73) ? 0 : 1 << C.stageAt(t), b = P.begin(), wide = dev ? false : SS.wide, gI = wide ? 0.75 : 1;
    for (let i = 0; i < N; i++) { if (i >= nLive) { cr.put(i, { visible: false }); continue; } const d = body(i, t); cr.put(i, d); const r = role[i];
      if (r.tS !== undefined && t > r.tS && t < r.tL) { const u = seg(t, r.tS, r.tL), pts = []; for (let q = 0; q <= 4; q++) { const w = Math.max(0, u - 0.22 + 0.055 * q); const p = polar(r.from, r.to, sm(Math.min(1, w / 0.75)) * 0.94); pts.push([p[0], 0.05, p[1]]); }
        P.poly(b, pts, hex(r.kind === 'player' ? r.seat.lane : C.laneOf(i)), 0.02, 1.4 * (1 - sm((u - 0.6) / 0.4))); }      // a short comet tail, not the whole path
      if (r.kind !== 'player' || d.visible === false || !d.track) continue;
      const s = r.seat, born = r.born !== undefined ? r.born : r.tL - 0.15, g = sm((t - born) / 0.3); if (g <= 0 || (d.track === 'build')) continue;
      const cg = dev ? 0.55 : SS.chairs; if (cg > 0 && !STANDING[s.pose] && s.pose !== 'piano') chair(b, s, cg * g);
      instrument(b, s, { pos: d.pos, yaw: d.yaw, track: d.track, time: d.time, color: hex(s.lane) }, g * gI, wide); }
    const sg = dev ? 0.32 : SS.stands; if (sg > 0) for (const st of stands) { const g = Math.min(...st.who.map((s) => { const r = role[s.i]; return sm((t - (r.born !== undefined ? r.born : r.tL) + 0.05) / 0.35); })); if (g > 0.01) stand(b, st, sg * g); }
    podium(b, 0.8);
    const extra = [P.drawable(b, { gain: wide ? +(E.param('orchpg', 0.45)) : 1, minPx: 1.0, haloPx: wide ? 1.5 : 3, halo: wide ? 0.08 : 0.18, reflect: false }), C.heroPool(t, camera, { gain: 0.75 })];
    { const g = sm((t - role[cm.i].tL) / 0.4); if (g > 0) extra.push(W.glow([{ x: cm.x, z: cm.z, r: Math.max(0.9, 0.03 * Math.hypot(camera.pos[0] - cm.x, camera.pos[1], camera.pos[2] - cm.z)), c: [0.7 * g, 0.28 * g, 0.063 * g] }])); }      // the concertmaster: a pool of main-orange under her chair, as under the hero
    if (HOOKS) { const p = K.project(camera, cmHead(t)), q = K.project(camera, C.heroHips(t).map((v, j) => (j === 1 ? v + 0.6 : v))); console.log('ORCHHOOK ' + JSON.stringify({ tOld: +t.toFixed(4), shot: SS.name, concertmaster: p.d > 0 ? [+(0.5 + 0.5 * p.x).toFixed(4), +(0.5 - 0.5 * p.y).toFixed(4)] : null, hero: q.d > 0 ? [+(0.5 + 0.5 * q.x).toFixed(4), +(0.5 - 0.5 * q.y).toFixed(4)] : null })); }
    return { camera, env: { dawn: 0, ground: { reflGain: 0, f0: 0, ripple: 0, base: [0.003, 0.003, 0.006], fogAmt: 0 }, figLight: FIGLIGHT },
      world: { text: 0, flow: 0, gain: 1.2, lights: false, main: { head: C.mainHead(t) } }, extra, hud: K.hudMain(t, { count: nLive }), noBackBand: true }; }

  const cmHead = (t) => { const d = body(cm.i, t); return d.track ? cast.hips(d.track, d.time, d.pos, d.yaw).map((v, j) => (j === 1 ? v + 0.52 : v)) : [cm.x, 1.1, cm.z]; };
  const counts = {}; for (const s of seats) counts[s.sec] = (counts[s.sec] || 0) + 1;
  console.log(`orchestra (massed): ${seats.length} players ${JSON.stringify(counts)} (generated ${M.total}, outer r ${M.rOut.toFixed(1)} m), ${stands.length} stands, wushu: hero + row ${WROW.length} + wings ${WING.length}; concertmaster copy ${cm.i}; window ${tA.toFixed(3)}..${tEnd.toFixed(3)} (old time), beat0 ${b0}`);
  return { on, frame, seats, cm, cmHead, SHOTS, shotAt, role, counts };
}
