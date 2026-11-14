// TAKE TWO · bars 81-84 · THE ORCHESTRA (a variant of seq 08; fable/take2/notes/orchestra.md). Off with ?orch=0. Everything is a pure function of song time.
// The wushu troupe of the build turns out to be an orchestra of Jades. On the downbeat of bar 81 the copies that exist (256) streak from the doubling
// grid to their seats along arcs round the podium and sit as their chairs and stands are drawn; the rest stand in rings round the orchestra (the copies of
// bars 82 and 83 are born into the outer rings). The hero is on the podium, facing the orchestra; six copies beside her keep doing wushu (`build`).
//
// SEATING (modern American, as seen from the audience; the audience is WEST, the orchestra faces west, the conductor at H faces east):
//   bearing th from the podium, measured from east toward +z (south); audience-left = north = -z = negative th. Radii in metres from the podium.
//   1st violins 16 (th -86..-46, rows 3.0 / 4.05 / 5.1 / 6.15)   2nd violins 14 (-42..-4)   violas 12 (4..42, three rows)   cellos 10 (46..86, three rows)
//   double basses 8, standing, behind the cellos (50..86, r 6.5 / 7.6)   flutes 3 + oboes 3 (r 7.3, centre)   clarinets 3 + bassoons 3 (r 8.35)
//   horns 4 (-40..-22, r 9.5)   trumpets 3 (-14..-2)   trombones 3 (2..14)   tuba 1 (19)   timpani (r 11.3, -6) and percussion 3 (bass drum, snare, cymbals; 8..22)
//   harp (r 7.6, -72) and grand piano (player r 10.0, -56) at the left. 89 players. The concertmaster (1st violins, first desk, outside seat) is the only one
//   with orange (main) bands besides the hero; every other section carries one lane colour.
// MOTION: procedural seated / standing poses baked as tracks on the 21-joint skeleton (fkFrame + two-bone IK), driven by the measured beat grid
//   (analysis_v2 beat index = analysis_v3 beat index: the warp maps beat to beat). Strings bow in unison per section (violins change direction every
//   half beat, the others every beat), timpani alternate hands on every kick, bass drum on 1 and 3, snare on 2 and 4, cymbals on each downbeat, winds and
//   brass sway over the bar, the trombone slide moves on the beat. On beat 4 of bar 84 everyone lifts; the downbeat of bar 85 is the hit.
// Instruments, chairs, stands, podium: strokes of light in the props vocabulary (props.js), in the section's lane colour.
import { fkFrame, makeTrack, REST_POS } from '../../engine/src/figure/skeleton.js';
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
const L_UA = len(sub(REST_POS[7], REST_POS[6])), L_FA = len(sub(REST_POS[8], REST_POS[7]));
const SEAT = { root: { y: -0.43 }, thighL: [88, 6, 0], thighR: [88, 6, 0], shinL: [-86, 0, 0], shinR: [-86, 0, 0], footL: [-2, 0, 0], footR: [-2, 0, 0],
  spine: [3, 0, 0], chest: [2, 0, 0], neck: [0, 0, 0], head: [3, 0, 0], upArmL: [30, -28, 0], upArmR: [30, -28, 0], foreArmL: [50, 0, 0], foreArmR: [50, 0, 0] };
const STAND = { thighL: [0, 3, 0], thighR: [0, 3, 0], shinL: [-3, 0, 0], shinR: [-3, 0, 0], spine: [2, 0, 0], chest: [1, 0, 0], head: [2, 0, 0],
  upArmL: [4, -30, 0], upArmR: [4, -30, 0], foreArmL: [14, 0, 0], foreArmR: [14, 0, 0] };
const merge = (a, b) => { const o = { ...a, root: { ...(a.root || {}), ...((b && b.root) || {}) } }; for (const k in b || {}) if (k !== 'root') o[k] = b[k]; return o; };
const JP = (F, j) => [F[j * 7], F[j * 7 + 1], F[j * 7 + 2]], JQ = (F, j) => [F[j * 7 + 3], F[j * 7 + 4], F[j * 7 + 5], F[j * 7 + 6]];
const setJ = (F, j, p, q) => { if (p) { F[j * 7] = p[0]; F[j * 7 + 1] = p[1]; F[j * 7 + 2] = p[2]; } if (q) { F[j * 7 + 3] = q[0]; F[j * 7 + 4] = q[1]; F[j * 7 + 5] = q[2]; F[j * 7 + 6] = q[3]; } };
function fk(pose, ground) { const F = new Float32Array(147); fkFrame(pose, F, 0, ground); return F; }
// two-bone IK for one arm (side 1 = her left, -1 = her right): the wrist on `target`, the elbow toward `pole`; o.dir = where the hand points (default: on from the forearm), o.thumb
function arm(F, side, target, pole, o = {}) {
  const ua = side > 0 ? 6 : 10, fa = ua + 1, ha = ua + 2, S = JP(F, ua); const d = sub(target, S), dir = norm(d), dl = clamp(len(d), Math.abs(L_UA - L_FA) + 0.03, L_UA + L_FA - 0.004);
  const a = (L_UA * L_UA + dl * dl - L_FA * L_FA) / (2 * dl), h = Math.sqrt(Math.max(0, L_UA * L_UA - a * a));
  let pp = sub(pole, mul(dir, dot(pole, dir))); pp = len(pp) < 1e-5 ? [0, -1, 0] : norm(pp);
  const E = add(S, add(mul(dir, a), mul(pp, h))), Hn = add(S, mul(dir, dl)), yU = norm(sub(E, S)), yF = norm(sub(Hn, E));
  const qU = qframe(yU, add(yF, mul(pp, -0.3))), zUw = qrot(qU, [0, 0, 1]), qF = qframe(yF, add(mul(yU, -1), mul(zUw, 0.3)));
  const yH = o.dir ? norm(o.dir) : yF, qH = qframe(yH, o.thumb || qrot(qF, [0, 0, 1]));
  setJ(F, ua, null, qU); setJ(F, fa, E, qF); setJ(F, ha, Hn, qH); return Hn; }
const mouthOf = (F) => add(JP(F, 4), qrot(JQ(F, 4), [0, -0.035, 0.095]));

// the bow: frog .. tip of one stroke for the hand; s 0 = frog (hand at the strings), 1 = tip
const bowEase = (u) => 0.55 * u + 0.45 * sm(u);
// fiddles: the pose for u in [0,4): [0,1) down-bow, [1,2) up-bow, [2,3) lift (bow off the string, up), [3,4) the hit (back on the string at 3, a fast down-bow)
function bowS(u) { if (u < 1) return { s: bowEase(u), up: 0 }; if (u < 2) return { s: 1 - bowEase(u - 1), up: 0 }; if (u < 3) return { s: 0, up: sm((u - 2) / 0.8) }; const w = u - 3; return { s: sm(w / 0.45), up: 1 - sm(w / 0.06) }; }
const POSES = {
  violin(u) { const b = bowS(u); const F = fk(merge(SEAT, { spine: [4, 2 * Math.sin(b.s * 2), 0], head: [8, 15, 12] }), false);
    arm(F, 1, [0.33, 0.99, 0.40], [0.2, -1, 0.15], { thumb: [0, 1, 0] });
    const frog = [0.05, 0.98, 0.25], tip = [-0.40, 0.86, 0.37], lift = [0.0, 1.24, 0.34];
    arm(F, -1, lerp3(lerp3(frog, tip, b.s), lift, b.up), [-0.7, -0.5, -0.2], { thumb: [0, 0, 1] }); return F; },
  cello(u) { const b = bowS(u); const F = fk(merge(SEAT, { thighL: [86, 20, 0], thighR: [86, 20, 0], shinL: [-84, 0, 0], shinR: [-84, 0, 0], spine: [7, 2 * Math.sin(b.s * 2), 0], head: [6, 7, 10] }), false);
    arm(F, 1, [0.13, 0.97, 0.27], [1, -0.4, -0.2], { thumb: [-1, 0, 0] });
    const frog = [-0.07, 0.66, 0.42], tip = [-0.44, 0.60, 0.44], lift = [-0.12, 0.98, 0.46];
    arm(F, -1, lerp3(lerp3(frog, tip, b.s), lift, b.up), [-0.8, -0.4, -0.3], { thumb: [0, 0, 1] }); return F; },
  bass(u) { const b = bowS(u); const F = fk(merge(STAND, { spine: [9, 2 * Math.sin(b.s * 2), -6], chest: [4, 0, -4], head: [4, 8, 6], thighL: [0, 6, 0], thighR: [-2, 6, 0] }), true);
    arm(F, 1, [0.17, 1.30, 0.17], [1, 0.1, -0.5], { thumb: [-1, 0, 0] });
    const frog = [-0.05, 0.95, 0.38], tip = [-0.42, 0.88, 0.42], lift = [-0.1, 1.25, 0.40];
    arm(F, -1, lerp3(lerp3(frog, tip, b.s), lift, b.up), [-0.8, -0.3, -0.3], { thumb: [0, 0, 1] }); return F; },
  // timpani (standing): right mallet strikes at u = 0 (and 2k), left at u = 1; [2,3) both lift, [3,4) both strike at 3
  timpani(u) { const hgt = (p) => { p = mod(p, 2); return sm(p / 0.32) * (1 - sm((p - 1.45) / 0.55)); };
    let hr, hl; if (u < 2) { hr = hgt(u); hl = hgt(u - 1); } else if (u < 3) { const w = sm((u - 2) / 0.85); hr = lerp(hgt(0), 1, w); hl = lerp(hgt(1), 1, w); hr = Math.max(hr, w); hl = Math.max(hl, w); } else { hr = hl = hgt(u - 3); }
    const F = fk(merge(STAND, { spine: [12, 0, 0], chest: [6, 0, 0], head: [10, 0, 0] }), true);
    for (const [side, h] of [[1, hl], [-1, hr]]) { const imp = [side * 0.30, 0.98, 0.34], up = [side * 0.24, 1.22, 0.24], W = lerp3(imp, up, h);
      const md = norm(lerp3([0, -0.42, 1], [0, 0.55, 1], h)); arm(F, side, W, [side * 1, -0.6, -0.3], { dir: md, thumb: [0, 1, 0] }); }
    return F; },
  // bass drum: right-hand beater strikes at u = 0 (beats 1 and 3); [2,3) lift, [3,4) strike at 3
  bassdrum(u) { const hgt = (p) => { p = mod(p, 2); return sm(p / 0.35) * (1 - sm((p - 1.4) / 0.6)); }; const h = u < 2 ? hgt(u) : u < 3 ? Math.max(hgt(0), sm((u - 2) / 0.85)) : hgt(u - 3);
    const F = fk(merge(STAND, { spine: [6, 0, 8], head: [6, 0, 12] }), true);
    arm(F, -1, lerp3([0.08, 0.92, 0.36], [-0.2, 1.12, 0.28], h), [-1, -0.5, -0.3], { dir: norm(lerp3([1, -0.1, 0.25], [0.2, 0.8, 0.5], h)), thumb: [0, 1, 0] });
    arm(F, 1, [0.32, 0.95, 0.30], [1, -0.6, -0.4]); return F; },
  // snare: right stick on beats 2 and 4 (u = 1), left a light tap on 1 and 3; [2,3) lift, [3,4) both strike at 3
  snare(u) { const hgt = (p) => { p = mod(p, 2); return sm(p / 0.3) * (1 - sm((p - 1.5) / 0.5)); };
    let hr, hl; if (u < 2) { hr = hgt(u - 1); hl = 0.45 * hgt(u); } else if (u < 3) { const w = sm((u - 2) / 0.85); hr = Math.max(hgt(1), w); hl = Math.max(0.45 * hgt(2), w); } else hr = hl = hgt(u - 3);
    const F = fk(merge(STAND, { spine: [10, 0, 0], head: [12, 0, 0] }), true);
    for (const [side, h] of [[1, hl], [-1, hr]]) arm(F, side, lerp3([side * 0.14, 0.86, 0.30], [side * 0.18, 1.08, 0.24], h), [side, -0.6, -0.3], { dir: norm(lerp3([-side * 0.3, -0.35, 1], [-side * 0.2, 0.45, 1], h)), thumb: [0, 1, 0] });
    return F; },
  // cymbals: crash at u = 0 (each downbeat, u = beat in the bar); [4,5) lift (apart, up), [5,6) crash at 5
  cymbals(u) { let a; if (u < 4) a = sm(u / 0.5) * (1 - sm((u - 3.3) / 0.7)); else if (u < 5) a = Math.max(sm(0.6), sm((u - 4) / 0.8)); else a = sm((u - 5) / 0.5);
    const F = fk(merge(STAND, { spine: [4, 0, 0], head: [4, 0, 0] }), true);
    for (const side of [1, -1]) arm(F, side, lerp3([side * 0.06, 1.12, 0.36], [side * 0.36, 1.22, 0.26], a), [side, -0.5, -0.4], { dir: [side * 0.15 * (1 - a), 0.9, 0.3], thumb: [-side, 0, 0] });
    return F; },
  // winds: sway over the bar (u = beat in the bar, 0..4)
  flute(u) { const w = Math.sin((u / 4) * Math.PI * 2); const F = fk(merge(SEAT, { spine: [4, 3 * w, -6], chest: [2, 1.5 * w, -6], head: [4, -8, 12] }), false);
    const m = mouthOf(F), d = norm([-1, -0.07, 0.12]); arm(F, 1, add(add(m, mul(d, 0.12)), [0, -0.03, 0.03]), [0.3, -1, -0.5], { thumb: [0, -1, 0] }); arm(F, -1, add(add(m, mul(d, 0.38)), [0, -0.03, 0.03]), [-0.3, -1, 0], { thumb: [0, -1, 0] }); return F; },
  reed(u) { const w = Math.sin((u / 4) * Math.PI * 2); const F = fk(merge(SEAT, { spine: [5 + 2 * w, 2 * w, 0], head: [6 + 3 * w, 0, 0] }), false);
    const m = mouthOf(F), d = norm([0, -0.78, 0.62]); arm(F, 1, add(add(m, mul(d, 0.20)), [0.03, 0, 0.03]), [1, -0.5, -0.3]); arm(F, -1, add(add(m, mul(d, 0.42)), [-0.03, 0, 0.03]), [-1, -0.5, -0.3]); return F; },
  bassoon(u) { const w = Math.sin((u / 4) * Math.PI * 2); const F = fk(merge(SEAT, { spine: [4, 2 * w, 0], head: [5, 2, 4] }), false);
    arm(F, 1, [0.20, 1.00, 0.26], [1, -0.5, -0.4]); arm(F, -1, [0.04, 0.66, 0.34], [-1, -0.6, -0.2]); return F; },
  horn(u) { const w = Math.sin((u / 4) * Math.PI * 2); const F = fk(merge(SEAT, { spine: [3, 2 * w, 0], head: [4, 0, 0] }), false);
    arm(F, 1, [-0.02, 0.88, 0.30], [1, -0.6, -0.2]); arm(F, -1, [-0.27, 0.70, 0.12], [-1, -0.3, -0.5]); return F; },
  trumpet(u) { const w = Math.sin((u / 4) * Math.PI * 2); const F = fk(merge(SEAT, { spine: [2 - 3 * w, 0, 0], head: [-2 - 3 * w, 0, 0] }), false);
    const m = mouthOf(F), d = norm([0, -0.10 + 0.05 * w, 1]); arm(F, 1, add(add(m, mul(d, 0.20)), [0.04, -0.05, 0]), [1, -0.8, 0]); arm(F, -1, add(add(m, mul(d, 0.25)), [-0.02, -0.03, 0]), [-1, -0.8, 0]); return F; },
  trombone(u) { const k = Math.floor(mod(u, 4)), f = mod(u, 1), POS = [0.30, 0.62, 0.42, 0.80], s = lerp(POS[(k + 3) % 4], POS[k], sm(f / 0.14));
    const F = fk(merge(SEAT, { spine: [3, 0, 0], head: [-2, 0, 0] }), false); const m = mouthOf(F), d = norm([0, -0.18, 1]);
    arm(F, 1, add(add(m, mul(d, 0.16)), [0.07, -0.04, 0]), [1, -0.8, 0]); arm(F, -1, add(add(m, mul(d, s)), [-0.02, -0.16, 0]), [-1, -0.8, 0], { thumb: [0, 1, 0] }); return F; },
  tuba(u) { const w = Math.sin((u / 4) * Math.PI * 2); const F = fk(merge(SEAT, { spine: [2, 2 * w, 0], head: [4, 0, 0] }), false);
    arm(F, 1, [0.20, 0.92, 0.30], [1, -0.4, -0.2]); arm(F, -1, [-0.08, 0.95, 0.34], [-1, -0.6, -0.2]); return F; },
  harp(u) { const p = (k) => Math.sin((u * 2 + k) * Math.PI); const F = fk(merge(SEAT, { spine: [6, 0, 0], head: [6, -4, -6] }), false);
    arm(F, 1, [0.10 + 0.02 * p(0), 1.02 + 0.03 * p(0.5), 0.40], [1, -0.4, -0.2], { thumb: [0, 1, 0] }); arm(F, -1, [-0.08 + 0.02 * p(1), 1.06 + 0.03 * p(1.5), 0.36], [-1, -0.4, -0.3], { thumb: [0, 1, 0] }); return F; },
};
const TRACK_LEN = { violin: 4, cello: 4, bass: 4, timpani: 4, bassdrum: 4, snare: 4, cymbals: 6, flute: 4, reed: 4, bassoon: 4, horn: 4, trumpet: 4, trombone: 4, tuba: 4, harp: 4 };

// ------------------------------------------------------------------------------------------------ the seating
// [section, lane, pose, rows: [radius, th0, th1, n]...]
const SECTIONS = [
  ['vn1', 'rose', 'violin', [[3.0, -86, -46, 3], [4.05, -86, -46, 4], [5.1, -86, -46, 4], [6.15, -86, -48, 5]]],
  ['vn2', 'coral', 'violin', [[3.0, -42, -4, 3], [4.05, -42, -4, 4], [5.1, -42, -4, 4], [6.15, -40, -6, 3]]],
  ['va', 'magenta', 'violin', [[3.0, 4, 42, 3], [4.05, 4, 42, 4], [5.1, 4, 42, 5]]],
  ['vc', 'violet', 'cello', [[3.1, 46, 86, 3], [4.2, 46, 86, 4], [5.3, 48, 84, 3]]],
  ['db', 'blue', 'bass', [[6.5, 50, 86, 4], [7.6, 52, 84, 4]]],
  ['fl', 'mint', 'flute', [[7.3, -17, -1, 3]]], ['ob', 'mint', 'reed', [[7.3, 1, 17, 3]]],
  ['cl', 'mint', 'reed', [[8.35, -15, -1, 3]]], ['bn', 'mint', 'bassoon', [[8.35, 1, 15, 3]]],
  ['hn', 'gold', 'horn', [[9.5, -40, -22, 4]]], ['tp', 'gold', 'trumpet', [[9.6, -14, -2, 3]]], ['tb', 'gold', 'trombone', [[9.6, 2, 14, 3]]], ['tu', 'gold', 'tuba', [[9.6, 17, 21, 1]]],
  ['timp', 'cyan', 'timpani', [[11.3, -9, -3, 1]]], ['perc', 'cyan', ['bassdrum', 'snare', 'cymbals'], [[11.3, 8, 22, 3]]],
  ['harp', 'mint', 'harp', [[7.6, -74, -70, 1]]], ['pno', 'blue', 'piano', [[10.0, -58, -54, 1]]],
];
const STANDING = { bass: 1, timpani: 1, bassdrum: 1, snare: 1, cymbals: 1 };

export function makeOrchestra(K, C) {
  const { bar, bb, cast, world: W, E } = K, T = K.T; const hx = C.hx, hz = C.hz, N = C.N;
  const EAST = Math.PI / 2, O = [hx + 5.5, hz];                                       // O: the orchestra's middle (the audience rings are centred on it)
  const tA = bar(81), tLift = bb(84, 4), tHit = bar(85), tEnd = E.Q.get('orchtail') === '1' ? bb(85, 2) : bar(85);
  const b0 = Math.round(T.beatAt(tA)), beatDur = (bb(85, 2) - bar(85));
  const P = makeProps(K, { max: 40000 }), hex = (n) => K.hex(K.LANE[n]);

  // ---- tracks (baked once; 60 fps; deterministic)
  const made = {};
  for (const name of Object.keys(POSES)) { const L = TRACK_LEN[name], n = Math.round(L * 60) + 1, tr = makeTrack('orch_' + name, n, { loop: false });
    for (let f = 0; f < n; f++) tr.data.set(POSES[name](Math.min(L - 1e-4, f / 60)), f * 147);
    tr.meta = { made: 'orchestra.js (procedural, beat-driven)' }; cast.tracks[tr.name] = tr; if (cast.fig && cast.fig.addTrack) cast.fig.addTrack(tr); made[name] = tr; }
  const quatAt = (name, time, j) => { const tr = made[name]; const f = clamp(Math.round(time * 60), 0, tr.frames - 1); return JQ(tr.data.subarray(f * 147, f * 147 + 147), j); };

  // ---- seats
  const seats = [];
  for (const [sec, lane, pose, rows] of SECTIONS) rows.forEach(([r, a0, a1, n], ri) => { for (let k = 0; k < n; k++) { const th = (n === 1 ? (a0 + a1) / 2 : a0 + ((k + 0.5) / n) * (a1 - a0)) * DEG;
    const x = hx + r * Math.cos(th), z = hz + r * Math.sin(th); seats.push({ sec, lane, pose: Array.isArray(pose) ? pose[k] : pose, row: ri, k, n, r, th, x, z, yaw: Math.atan2(hx - x, hz - z) }); } });
  const cm = seats.filter((s) => s.sec === 'vn1' && s.row === 0).sort((p, q) => p.th - q.th)[0]; cm.lane = 'main'; cm.concertmaster = true;
  // music stands: one per desk (strings: two players), one per wind / brass player; 0.75 m in front of the desk, toward the podium
  const stands = []; { const bySecRow = {}; for (const s of seats) (bySecRow[s.sec + s.row] = bySecRow[s.sec + s.row] || []).push(s);
    for (const key in bySecRow) { const g = bySecRow[key], s0 = g[0]; if (['timp', 'perc', 'harp', 'pno'].includes(s0.sec)) continue; const pair = ['vn1', 'vn2', 'va', 'vc', 'db'].includes(s0.sec);
      for (let k = 0; k < g.length; k += pair ? 2 : 1) { const a = g[k], b = pair && g[k + 1] ? g[k + 1] : a; const mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2, d = norm([hx - mx, 0, hz - mz]), off = a.pose === 'bass' ? 0.95 : 0.78;
        stands.push({ x: mx + d[0] * off, z: mz + d[2] * off, yaw: Math.atan2(-d[0], -d[2]), who: pair && b !== a ? [a, b] : [a], low: a.pose === 'bass' ? 0 : 1 }); } } }

  // ---- who goes where: the copies that exist on bar 81 (stage 8: 0..255)
  const WROW = [-2, 2, -4, 4, -6, 6].map((dz) => ({ x: hx - 1.8, z: hz + dz }));          // the wushu row beside the podium
  const S = C.S, nOld = 256; const taken = new Set([0]); const role = new Array(N).fill(null);
  const pick = (x, z) => { let best = -1, bd = 1e9; for (let i = 1; i < nOld; i++) { if (taken.has(i)) continue; const d = Math.hypot(S[i].x - x, S[i].z - z); if (d < bd) { bd = d; best = i; } } taken.add(best); return best; };
  // the orchestra fills from the back of the fan forward (the far seats take the far copies), then the wushu row
  [...seats].sort((p, q) => q.r - p.r || p.th - q.th).forEach((s) => { const i = pick(s.x, s.z); s.i = i; role[i] = { kind: 'player', seat: s }; });
  WROW.forEach((w) => { const i = pick(w.x, w.z); role[i] = { kind: 'wushu', at: w }; });
  // the audience rings round O, from 15 m out, 2 m apart, 1.8 m along the arc; an aisle on main to the west
  const ring = []; for (let j = 0; ring.length < N; j++) { const r = 15 + 2 * j, m = Math.floor((2 * Math.PI * r) / 1.8); for (let q = 0; q < m; q++) { const a = (q / m) * 2 * Math.PI + (j % 2) * (Math.PI / m), x = O[0] + r * Math.cos(a), z = O[1] + r * Math.sin(a);
    if (x < O[0] && Math.abs(z - hz) < 1.5) continue; ring.push({ x, z, j, a }); } }
  const movers = []; for (let i = 1; i < nOld; i++) if (!role[i]) movers.push(i);
  { const ang = (x, z) => Math.atan2(z - O[1], x - O[0]); const inner = ring.slice(0, Math.ceil(movers.length * 1.08)), keep = []; const step = inner.length / movers.length; for (let q = 0; q < movers.length; q++) keep.push(inner[Math.floor(q * step)]);
    keep.sort((p, q) => ang(p.x, p.z) - ang(q.x, q.z)); movers.sort((p, q) => ang(S[p].x, S[p].z) - ang(S[q].x, S[q].z)); movers.forEach((i, q) => { role[i] = { kind: 'aud', at: keep[q] }; keep[q].used = 1; });
    const rest = ring.filter((s) => !s.used); let q = 0; for (let i = nOld; i < N; i++) role[i] = { kind: 'aud', at: rest[q++], born: C.tBorn(C.S[i].k) }; }
  role[0] = { kind: 'hero' };
  // flights: every existing copy that changes place streaks there along an arc round the podium, starting between b81 + 0.06 s and b81 beat 1.55; 0.40 s each
  const bdur = bb(81, 2) - bar(81), TF = 0.40; const flyers = []; for (let i = 1; i < nOld; i++) { const r = role[i], to = r.kind === 'player' ? r.seat : r.at; flyers.push({ i, to, d: Math.hypot(S[i].x - to.x, S[i].z - to.z) }); }
  { const ds = flyers.map((f) => f.d).sort((a, b) => a - b), rank = (d) => ds.indexOf(d) / Math.max(1, ds.length - 1);
    for (const f of flyers) { const r = role[f.i]; r.tS = tA + 0.06 + 0.55 * bdur * rank(f.d) + 0.02 * h1(f.i); r.tL = r.tS + TF; r.from = [S[f.i].x, S[f.i].z]; } }
  const polar = (a, b, u) => { const ra = Math.hypot(a[0] - hx, a[1] - hz), rb = Math.hypot(b[0] - hx, b[1] - hz); let aa = Math.atan2(a[1] - hz, a[0] - hx), ab = Math.atan2(b[1] - hz, b[0] - hx); let d = ab - aa; if (d > Math.PI) d -= 2 * Math.PI; if (d < -Math.PI) d += 2 * Math.PI;
    const r = lerp(ra, rb, u), an = aa + d * u; return [hx + r * Math.cos(an), hz + r * Math.sin(an)]; };
  const streaks = E.roads(flyers.filter((f) => role[f.i].kind !== 'aud').map((f) => { const r = role[f.i], pts = []; const n = Math.max(4, Math.min(40, Math.ceil(f.d / 1.2))); for (let q = 0; q <= n; q++) pts.push(polar(r.from, [f.to.x, f.to.z], sm(q / n)));
    return { pts, g: [r.tS, r.tL], color: hex(r.kind === 'player' ? r.seat.lane : C.laneOf(f.i)), width: 0.018 }; }), { step: 0.5 });
  const seatYaw = (s) => s.yaw;
  const audYaw = (a) => Math.atan2(O[0] - a.x, O[1] - a.z);

  // ---- the clocks: track time of a pose at song time t (old time; beat index b - b0 counts from the bar 81 downbeat)
  const beat = (t) => T.beatAt(t) - b0;
  function clock(pose, t) { const b = beat(t), L = TRACK_LEN[pose];
    if (pose === 'violin' || pose === 'cello' || pose === 'bass') { if (t >= tHit) return 3 + Math.min(0.999, (t - tHit) / beatDur); if (t >= tLift) return 2 + seg(t, tLift, tHit) * 0.999;
      const rate = pose === 'violin' ? 2 : 1, s = b * rate, k = Math.floor(s), f = s - k, down = rate === 2 ? k % 2 === 0 : mod(k, 2) === 1; return down ? f : 1 + f; }
    const fin = pose === 'cymbals' ? 4 : 2;
    if (['timpani', 'bassdrum', 'snare', 'cymbals'].includes(pose)) { if (t >= tHit) return fin + 1 + Math.min(0.999, (t - tHit) / beatDur); if (t >= tLift) return fin + seg(t, tLift, tHit) * 0.999; return pose === 'cymbals' ? mod(b, 4) : mod(b, 2); }
    return Math.min(L - 1e-3, mod(b, 4)); }
  // the pianist: her mocap (life_piano), ping-pong between 0.5 and 4.3 s (before the look-back)
  const pianoTime = (t) => { const x = mod(t - tA, 7.6); return 0.5 + (x < 3.8 ? x : 7.6 - x); };

  // ---- one body at t
  const tBuild = cast.songT0('build') || bar(73);
  function body(i, t) { const r = role[i];
    if (r.kind === 'hero') return { pos: [hx, 0.16, hz], yaw: EAST, track: 'build', time: t - tBuild, lane: 'main', seed: 0, gain: 1, alpha: 1 };
    if (r.born !== undefined) { if (t < r.born) return { visible: false }; const age = t - r.born; return { pos: [r.at.x, 0, r.at.z], yaw: audYaw(r.at), track: 'idle', time: t + 20 * h1(i * 1.3), lane: C.laneOf(i), seed: i + 1, solid: AUD.solid, density: AUD.density, gain: (1 + 1.6 * Math.exp(-age / 0.25)) * AUD.gain, alpha: 0.35 + 0.65 * sm(age / 0.3) }; }
    const to = r.kind === 'player' ? r.seat : r.at, toYaw = r.kind === 'player' ? seatYaw(r.seat) : r.kind === 'wushu' ? EAST : audYaw(r.at), lane = r.kind === 'player' ? r.seat.lane : C.laneOf(i);
    const u = seg(t, r.tS, r.tL), out = { lane, seed: i + 1, gain: 1, alpha: 1 };
    if (u < 0.7) { const d = C.dancer(i, Math.min(t, r.tS), {}); const p = u > 0 ? polar(r.from, [to.x, to.z], sm(u / 0.7) * 0.92) : r.from; let dy = toYaw - d.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      Object.assign(out, { pos: [p[0], 0, p[1]], yaw: d.yaw + dy * sm(u / 0.7), track: d.track, time: u > 0 ? r.tS - tBuild + (t - r.tS) * 0.3 : d.time, alpha: 1 - 0.65 * sm(u / 0.35), gain: 1 + 1.4 * sm(u / 0.2) });
      if (u > 0 && r.kind !== 'aud') out.vary = 0; return out; }
    out.alpha = 0.35 + 0.65 * sm((u - 0.7) / 0.3); out.gain = 1 + 1.4 * (1 - sm((t - r.tL) / 0.4));
    if (r.kind === 'wushu') return Object.assign(out, { pos: [to.x, 0, to.z], yaw: EAST, track: 'build', time: t - tBuild });
    if (r.kind === 'aud') return Object.assign(out, { pos: [to.x, 0, to.z], yaw: toYaw, track: 'idle', time: t + 20 * h1(i * 1.3), solid: AUD.solid, density: AUD.density, gain: out.gain * AUD.gain });
    const s = r.seat; out.pos = [s.x, 0, s.z]; out.yaw = toYaw; out.vary = 0;
    if (s.pose === 'piano') { out.track = 'life_piano'; out.time = pianoTime(t); out.face = { expr: 'calm', amt: 0.3 }; return out; }
    out.track = 'orch_' + s.pose; out.time = clock(s.pose, t); out.face = { expr: 'calm', amt: 0.25 };
    out.hand = s.pose === 'violin' || s.pose === 'cello' || s.pose === 'bass' ? { L: 0.35, R: 'grip' } : STANDING[s.pose] ? 'grip' : s.pose === 'harp' ? 0.1 : 0.3; return out; }
  const AUD = { solid: +(E.param('orchaud', 0.4)), density: 0.6, gain: 0.8 };

  // ---- strokes: chairs, stands, podium, instruments
  const DIM = [0.42, 0.48, 0.68];
  function chair(b, s, g) { const M = P.placer({ pos: [s.x, 0, s.z], yaw: s.yaw }), c = DIM; const y = 0.45, x0 = -0.21, x1 = 0.21, z0 = -0.27, z1 = 0.16, w = 0.006;
    P.poly(b, [[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]].map(M), c, w, g, true);
    for (const x of [x0 + 0.02, x1 - 0.02]) { for (const z of [z0 + 0.02, z1 - 0.02]) P.seg(b, M([x, y, z]), M([x, 0, z]), c, w * 0.8, g * 0.8); P.seg(b, M([x, y, z0]), M([x, 0.86, z0 - 0.05]), c, w, g); }
    P.seg(b, M([x0 + 0.02, 0.86, z0 - 0.05]), M([x1 - 0.02, 0.86, z0 - 0.05]), c, w, g); P.seg(b, M([x0 + 0.02, 0.70, z0 - 0.04]), M([x1 - 0.02, 0.70, z0 - 0.04]), c, w * 0.7, g * 0.7); }
  function stand(b, st, g) { const M = P.placer({ pos: [st.x, 0, st.z], yaw: st.yaw }), c = DIM, w = 0.005, top = st.low ? 0.98 : 1.22;
    P.seg(b, M([0, 0.02, 0]), M([0, top, 0]), c, w, g); for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.4; P.seg(b, M([0, 0.12, 0]), M([0.2 * Math.cos(a), 0.01, 0.2 * Math.sin(a)]), c, w * 0.8, g * 0.8); }
    const tl = 25 * DEG, hw = 0.26, hh = 0.36, at = (x, v) => M([x, top + v * Math.cos(tl), -v * Math.sin(tl)]);
    P.poly(b, [at(-hw, 0), at(hw, 0), at(hw, hh), at(-hw, hh)], c, w, g * 1.1, true); P.seg(b, at(-hw * 0.8, hh * 0.45), at(hw * 0.8, hh * 0.45), [1, 0.96, 0.9], 0.003, g * 0.35); }
  function podium(b, g) { const M = P.placer({ pos: [hx, 0, hz], yaw: EAST }), c = hex('main').map((v) => v * 0.6 + 0.3), h = 0.16, a = 0.75;
    for (const y of [0.01, h]) P.poly(b, [[-a, y, -a], [a, y, -a], [a, y, a], [-a, y, a]].map(M), c, 0.008, g, true);
    for (const x of [-a, a]) for (const z of [-a, a]) P.seg(b, M([x, 0, z]), M([x, h, z]), c, 0.006, g * 0.8);
    P.poly(b, [[-0.5, h, 0.62], [-0.5, 1.02, 0.62], [0.5, 1.02, 0.62], [0.5, h, 0.62]].map(M), c, 0.006, g * 0.7); }      // the rail in front of her
  // helpers in an instrument's track space
  const ringPts = (C0, A1, A2, r1, r2, n = 24) => { const o = []; for (let k = 0; k < n; k++) { const a = (k / n) * 2 * Math.PI; o.push(add(C0, add(mul(A1, r1 * Math.cos(a)), mul(A2, r2 * Math.sin(a))))); } return o; };
  const FID = [[0, 0.03], [0.02, 0.16], [0.10, 0.27], [0.22, 0.29], [0.33, 0.25], [0.42, 0.172], [0.50, 0.155], [0.58, 0.172], [0.68, 0.222], [0.80, 0.236], [0.90, 0.2], [0.97, 0.115], [1.0, 0.045]];
  // a cello or double bass: body from `bot` along A (unit) for bl metres, face toward F (unit), neck nl beyond, endpin to the floor
  function fiddle(b, M, c, g, bot, A, Fw, bl, nl) { const Sd = norm(cross(A, Fw)), at = (u, v, h = 0) => M(add(bot, add(mul(A, u), add(mul(Sd, v), mul(Fw, h)))));
    const half = FID.map(([u, v]) => [u * bl, v * bl]); P.poly(b, P.smooth3([...half.map(([u, v]) => at(u, v)), ...half.slice().reverse().map(([u, v]) => at(u, -v))], 3, true), c, 0.005, g, true);
    for (const s of [-1, 1]) P.seg(b, at(bl, s * 0.022 * bl), at(bl + nl, s * 0.016 * bl), c, 0.004, g * 0.9);
    P.poly(b, P.smooth3([at(bl + nl, 0.016 * bl), at(bl + nl + 0.04, 0.03, -0.02), at(bl + nl + 0.07, 0, -0.05), at(bl + nl + 0.03, -0.02, -0.06)], 4), c, 0.004, g * 0.9);
    for (const s of [-1, 1]) P.seg(b, at(0.08 * bl, s * 0.01 * bl, 0.02), at(bl + nl - 0.02, s * 0.008 * bl, 0.02), c, 0.0016, g * 0.55);
    P.seg(b, at(0.36 * bl, -0.06 * bl, 0.03), at(0.36 * bl, 0.06 * bl, 0.03), c, 0.003, g * 0.8);
    const pin = add(bot, mul(A, -0.02)); P.seg(b, M(pin), M([pin[0] + A[0] * -pin[1] / A[1], 0.0, pin[2] + A[2] * -pin[1] / A[1]]), c, 0.003, g * 0.8); }
  const bowLine = (b, M, hand, contact, Lb, c, g) => { const D = norm(sub(contact, hand)); P.seg(b, M(add(hand, mul(D, -0.04))), M(add(hand, mul(D, Lb))), [1, 0.96, 0.9], 0.003, g * 1.2); P.seg(b, M(add(add(hand, mul(D, -0.02)), [0, -0.012, 0])), M(add(add(hand, mul(D, Lb - 0.01)), [0, -0.004, 0])), c, 0.0014, g * 0.6); };
  const tipOf = (name, time, j, Lm) => { const q = quatAt(name, time, j); return qrot(q, [0, Lm, 0]); };
  function instrument(b, s, o, g) { const M = P.placer(o), c = o.color.map((v) => v + (1 - v) * 0.3), J = (j) => cast.root(o.track, o.time, j), G = 1.6 * g;
    const tn = s.pose;
    if (tn === 'violin') { P.violin(b, { ...o, gain: g * (s.concertmaster ? 1.3 : 1) }); return; }
    if (tn === 'cello') { const bot = [-0.02, 0.17, 0.46], A = norm([0.11, 0.66, -0.22]), Fw = norm([0, 0.3, 1]); fiddle(b, M, c, G, bot, A, Fw, 0.76, 0.42);
      bowLine(b, M, J(12), add(add(bot, mul(A, 0.30)), mul(Fw, 0.07)), 0.72, c, G); return; }
    if (tn === 'bass') { const bot = [0.03, 0.14, 0.40], A = norm([0.05, 1, -0.16]), Fw = norm([0, 0.15, 1]); fiddle(b, M, c, G, bot, A, Fw, 1.0, 0.62);
      bowLine(b, M, J(12), add(add(bot, mul(A, 0.36 * 1.0)), mul(Fw, 0.1)), 0.70, c, G); return; }
    if (tn === 'timpani') { const D = [[0.62, 0.40, 0.36], [0.22, 0.66, 0.33], [-0.22, 0.66, 0.31], [-0.62, 0.40, 0.28]];
      for (const [x, z, r] of D) { const hd = ringPts([x, 0.84, z], [1, 0, 0], [0, 0, 1], r, r, 28); P.poly(b, hd.map(M), c, 0.005, G * 1.1, true); const lo = ringPts([x, 0.50, z], [1, 0, 0], [0, 0, 1], r * 0.62, r * 0.62, 16); P.poly(b, lo.map(M), c, 0.003, G * 0.5, true);
        for (let k = 0; k < 8; k++) { const a = (k / 8) * 2 * Math.PI, ca = Math.cos(a), sa = Math.sin(a); P.poly(b, P.smooth3([[x + r * ca, 0.84, z + r * sa], [x + r * 0.92 * ca, 0.66, z + r * 0.92 * sa], [x + r * 0.62 * ca, 0.5, z + r * 0.62 * sa], [x + r * 0.2 * ca, 0.40, z + r * 0.2 * sa]], 3).map(M), c, 0.0025, G * 0.4); }
        for (let k = 0; k < 3; k++) { const a = (k / 3) * 2 * Math.PI + 0.5; P.seg(b, M([x + r * 0.55 * Math.cos(a), 0.48, z + r * 0.55 * Math.sin(a)]), M([x + r * 0.75 * Math.cos(a), 0.0, z + r * 0.75 * Math.sin(a)]), c, 0.003, G * 0.45); } }
      for (const j of [8, 12]) { const h = J(j), tip = add(h, tipOf(tn, o.time, j, 0.36)); P.seg(b, M(h), M(tip), [1, 0.96, 0.9], 0.004, G); P.dot(b, M(tip), c, 0.03, G * 1.2); } return; }
    if (tn === 'bassdrum') { const C0 = [0.36, 0.62, 0.42], ax = [1, 0, 0.15]; for (const d of [-0.2, 0.2]) P.poly(b, ringPts(add(C0, mul(norm(ax), d)), [0, 1, 0], norm([-0.15, 0, 1]), 0.48, 0.48, 32).map(M), c, 0.005, G, true);
      for (let k = 0; k < 12; k++) { const a = (k / 12) * 2 * Math.PI, p = add(C0, add(mul([0, 1, 0], 0.48 * Math.cos(a)), mul(norm([-0.15, 0, 1]), 0.48 * Math.sin(a)))); P.seg(b, M(add(p, mul(norm(ax), -0.2))), M(add(p, mul(norm(ax), 0.2))), c, 0.002, G * 0.45); }
      const h = J(12), tip = add(h, tipOf(tn, o.time, 12, 0.34)); P.seg(b, M(h), M(tip), [1, 0.96, 0.9], 0.004, G); P.dot(b, M(tip), c, 0.04, G * 1.2); return; }
    if (tn === 'snare') { P.poly(b, ringPts([0, 0.78, 0.44], [1, 0, 0], [0, 0, 1], 0.18, 0.18, 24).map(M), c, 0.005, G, true); P.poly(b, ringPts([0, 0.66, 0.44], [1, 0, 0], [0, 0, 1], 0.18, 0.18, 24).map(M), c, 0.003, G * 0.6, true);
      for (let k = 0; k < 3; k++) { const a = (k / 3) * 2 * Math.PI; P.seg(b, M([0.12 * Math.cos(a), 0.64, 0.44 + 0.12 * Math.sin(a)]), M([0.3 * Math.cos(a), 0.0, 0.44 + 0.3 * Math.sin(a)]), c, 0.003, G * 0.5); }
      for (const j of [8, 12]) { const h = J(j), tip = add(h, tipOf(tn, o.time, j, 0.4)); P.seg(b, M(h), M(tip), [1, 0.96, 0.9], 0.003, G); } return; }
    if (tn === 'cymbals') { for (const j of [8, 12]) { const h = J(j), q = quatAt(tn, o.time, j), n = qrot(q, [j === 8 ? -1 : 1, 0, 0]), A1 = norm(cross(n, [0, 1, 0])), A2 = norm(cross(n, A1)), Cc = add(h, qrot(q, [0, 0.08, 0]));
        P.poly(b, ringPts(Cc, A1, A2, 0.22, 0.22, 28).map(M), [1, 0.92, 0.7], 0.005, G * 1.1, true); P.dot(b, M(Cc), c, 0.025, G); } return; }
    const m = ['flute', 'reed', 'bassoon', 'horn', 'trumpet', 'trombone', 'tuba'].includes(tn) ? add(J(4), qrot(quatAt(tn, o.time, 4), [0, -0.035, 0.095])) : null;
    if (tn === 'flute') { const d = norm(sub(J(12), J(8))), a = add(m, mul(d, -0.06)), e = add(m, mul(d, 0.62)); P.seg(b, M(a), M(e), [1, 0.96, 0.9], 0.005, G); for (let k = 1; k < 8; k++) P.dot(b, M(lerp3(a, e, 0.25 + k * 0.08)), c, 0.008, G * 0.7); return; }
    if (tn === 'reed') { const d = norm(sub(J(12), J(8))), e = add(m, mul(d, 0.64)); P.seg(b, M(m), M(e), [0.92, 0.9, 1], 0.009, G * 0.9); if (s.sec === 'cl') P.poly(b, ringPts(e, norm(cross(d, [1, 0, 0])), [1, 0, 0], 0.035, 0.035, 14).map(M), c, 0.003, G, true);
      for (let k = 1; k < 7; k++) P.dot(b, M(lerp3(m, e, 0.15 + k * 0.1)), c, 0.008, G * 0.6); return; }
    if (tn === 'bassoon') { const lo = [-0.06, 0.40, 0.30], hi = [0.32, 1.62, 0.16]; P.seg(b, M(lo), M(hi), c, 0.022, G * 0.8); P.seg(b, M(add(lo, [0.06, 0, -0.02])), M(add(lerp3(lo, hi, 0.55), [0.06, 0, -0.02])), c, 0.016, G * 0.6);
      P.poly(b, P.smooth3([m, add(m, [0.05, -0.05, 0.12]), lerp3(lo, hi, 0.62)], 4).map(M), [1, 0.96, 0.9], 0.003, G); return; }
    if (tn === 'horn') { const Cc = [-0.13, 0.84, 0.28], A1 = [0, 1, 0], A2 = norm([0.2, 0, 1]); P.poly(b, ringPts(Cc, A1, A2, 0.16, 0.16, 26).map(M), c, 0.005, G, true); P.poly(b, ringPts(Cc, A1, A2, 0.10, 0.10, 20).map(M), c, 0.003, G * 0.6, true);
      const bell = [-0.30, 0.70, 0.08]; P.poly(b, ringPts(bell, [0, 1, 0], [0, 0, 1], 0.14, 0.14, 22).map(M), c, 0.005, G, true); P.seg(b, M(add(Cc, [0, -0.16, 0])), M(bell), c, 0.008, G * 0.8); P.poly(b, P.smooth3([m, add(m, [-0.02, -0.08, 0.14]), add(Cc, [0, 0.16, 0])], 4).map(M), [1, 0.96, 0.9], 0.003, G); return; }
    if (tn === 'trumpet') { const d = norm(sub(lerp3(J(8), J(12), 0.5), m)), dd = norm([d[0], d[1] * 0.3, d[2]]), e = add(m, mul(dd, 0.50)); P.seg(b, M(m), M(e), [1, 0.96, 0.9], 0.006, G); P.poly(b, ringPts(e, [1, 0, 0], [0, 1, 0], 0.065, 0.065, 18).map(M), c, 0.004, G * 1.1, true);
      P.seg(b, M(add(m, mul(dd, 0.12))), M(add(add(m, mul(dd, 0.32)), [0, -0.06, 0])), c, 0.012, G * 0.6); return; }
    if (tn === 'trombone') { const d = norm([0, -0.18, 1]), hr = J(12); const se = add(m, mul(d, 0.92)); P.seg(b, M(m), M(se), [1, 0.96, 0.9], 0.004, G); P.seg(b, M(add(m, [0, -0.08, 0])), M(add(se, [0, -0.08, 0])), c, 0.004, G * 0.8);
      P.seg(b, M(add(hr, [0.02, 0.08, 0])), M(add(hr, [0.02, -0.08, 0])), c, 0.005, G); const bell = add(add(m, [0.12, -0.02, 0]), mul(d, 0.55)); P.seg(b, M(add(m, [0.10, 0, -0.1])), M(bell), c, 0.008, G * 0.8); P.poly(b, ringPts(bell, [1, 0, 0], [0, 1, 0], 0.11, 0.11, 20).map(M), c, 0.005, G * 1.1, true); return; }
    if (tn === 'tuba') { const lo = [0.02, 0.52, 0.30], hi = [0.10, 1.32, 0.22]; P.poly(b, ringPts(lerp3(lo, hi, 0.4), [1, 0, 0.2], [0, 1, 0], 0.17, 0.36, 26).map(M), c, 0.006, G, true); P.poly(b, ringPts([0.22, 1.50, 0.15], [1, 0, 0], [0, 0, 1], 0.24, 0.24, 26).map(M), c, 0.006, G * 1.1, true);
      P.seg(b, M(hi), M([0.22, 1.47, 0.15]), c, 0.03, G * 0.5); P.poly(b, P.smooth3([m, add(m, [0.0, -0.06, 0.12]), [0.02, 0.98, 0.32]], 4).map(M), [1, 0.96, 0.9], 0.003, G); return; }
    if (tn === 'harp') { const base = [0.02, 0.04, 0.60], top = [0.02, 1.82, 0.74], sb = [-0.13, 1.08, 0.10]; P.seg(b, M(base), M(top), c, 0.012, G); P.seg(b, M(base), M(sb), c, 0.02, G * 0.8);
      const neck = P.smooth3([top, [-0.04, 1.70, 0.50], [-0.10, 1.44, 0.28], sb], 5); P.poly(b, neck.map(M), c, 0.008, G);
      for (let k = 1; k < 16; k++) { const u = k / 16, p = lerp3(base, sb, u), q = neck[Math.min(neck.length - 1, Math.round((1 - u) * (neck.length - 1)))]; P.seg(b, M(p), M(lerp3(p, q, 0.98)), [1, 0.96, 0.9], 0.0012, G * 0.45); }
      P.poly(b, ringPts([0.02, 0.03, 0.5], [1, 0, 0], [0, 0, 1], 0.22, 0.16, 16).map(M), c, 0.004, G * 0.6, true); return; }
    if (tn === 'piano') { P.piano(b, { ...o, gain: g * 0.8 }); const yT = 0.98, yB = 0.72, z0 = 0.44, L = 1.85; const sp = 0.70, rt = -0.70;     // a grand: straight spine on her left (bass), the bentside on her right, the lid up on the spine side
      const out = [[sp, z0], [sp, z0 + L], [sp - 0.30, z0 + L + 0.08], [rt + 0.55, z0 + L - 0.25], [rt + 0.15, z0 + 1.0], [rt, z0 + 0.55], [rt, z0]], cs = P.smooth3(out.map(([x, z]) => [x, 0, z]), 3, false);
      for (const y of [yT, yB]) P.poly(b, cs.map((p) => M([p[0], y, p[2]])), c, 0.005, G * (y === yT ? 1 : 0.6), false);
      for (const p of [cs[0], cs[3], cs[cs.length - 1]]) P.seg(b, M([p[0], yB, p[2]]), M([p[0], yT, p[2]]), c, 0.004, G * 0.6);
      for (const [x, z] of [[sp - 0.08, z0 + 0.12], [rt + 0.08, z0 + 0.12], [0.2, z0 + L - 0.1]]) P.seg(b, M([x, yB, z]), M([x, 0, z]), c, 0.006, G * 0.7);
      const al = 42 * DEG, lid = cs.map((p) => { const dx = sp - p[0]; return [sp - dx * Math.cos(al), yT + dx * Math.sin(al), p[2]]; }); P.poly(b, lid.map(M), [1, 0.96, 0.9], 0.004, G * 0.9, false);
      P.seg(b, M([sp - 0.65, yT, z0 + 1.0]), M(lid[Math.floor(lid.length * 0.45)]), c, 0.003, G * 0.6); return; } }

  // ---- the eight shots (two per bar: on the bar line and on beat 3)
  const R = (x, y, z) => [hx + x, y, hz + z];
  const sFind = (sec, k = 0) => seats.filter((s) => s.sec === sec)[k];
  const timp = sFind('timp'), tdir = norm([hx - timp.x, 0, hz - timp.z]);
  const SHOTS = [
    { name: 'above', t0: bar(81), cam: (u) => ({ pos: R(lerp(-7, -5, u), lerp(30, 27, u), lerp(-1.5, 1.5, u)), target: R(lerp(5.5, 5.0, u), 0, lerp(-0.5, 0.5, u)), fov: 50 }) },
    { name: 'side_low_violins', t0: bb(81, 3), cam: (u) => ({ pos: R(lerp(-0.75, -0.45, u), 0.98, lerp(-0.85, -1.15, u)), target: R(2.7, 0.92, -4.7), fov: 32, focusDist: 3.0, aperture: 0.012 }) },
    { name: 'above_behind', t0: bar(82), cam: (u) => ({ pos: R(lerp(14.6, 13.6, u), lerp(5.2, 4.8, u), lerp(1.9, 1.5, u)), target: R(lerp(3.2, 3.0, u), 0.7, 0), fov: 40 }) },
    { name: 'timpani', t0: bb(82, 3), cam: (u) => { const side = norm(cross([0, 1, 0], tdir)); const p = add(add([timp.x, lerp(1.80, 1.70, u), timp.z], mul(tdir, lerp(-1.55, -1.35, u))), mul(side, 0.85)); return { pos: p, target: [timp.x + tdir[0] * 3.2, 0.85, timp.z + tdir[2] * 3.2], fov: 42, focusDist: 2.2, aperture: 0.006 }; } },
    { name: 'wushu_from_behind', t0: bar(83), cam: (u) => ({ pos: R(lerp(19.0, 17.8, u), 4.4, lerp(-0.9, -0.5, u)), target: R(-1.8, 0.9, 0), fov: 19, focusDist: 20, aperture: 0.006 }) },
    { name: 'basses_side', t0: bb(83, 3), cam: (u) => ({ pos: R(lerp(-1.6, -1.2, u), 1.3, lerp(7.9, 7.7, u)), target: R(3.4, 1.1, 5.9), fov: 34, focusDist: 4.5, aperture: 0.01 }) },
    { name: 'high_wide', t0: bar(84), cam: (u) => ({ pos: R(4.6 - 0.01, lerp(23.5, 22.5, u), 0), target: R(4.6, 0, 0), fov: 44, topUp: [1, 0, 0] }) },
    { name: 'last_wide', t0: bb(84, 3), cam: (u) => ({ pos: R(lerp(-13.5, -12.3, u), lerp(7.2, 6.6, u), 0.0), target: R(5.5, 0.6, 0), fov: 42 }) },
  ];
  const dev = E.Q.get('orchcam');      // dev: --q "orchcam=x,y,z,tx,ty,tz,fov" (relative to H) holds one camera over the whole variant
  function shotAt(t) { let k = 0; while (k < SHOTS.length - 1 && t >= SHOTS[k + 1].t0) k++; const a = SHOTS[k].t0, b = k + 1 < SHOTS.length ? SHOTS[k + 1].t0 : tHit; return { k, s: SHOTS[k], u: Math.min(1.2, (t - a) / (b - a)) }; }

  // ---- the frame
  const on = (t) => t >= tA && t < tEnd;
  const HOOKS = E.Q.get('orchhooks') === '1';
  function frame(t) {
    const cr = cast.crowd('thousand', N), nLive = t < bar(73) ? 0 : 1 << C.stageAt(t), b = P.begin(); let k = 0;
    for (let i = 0; i < N; i++) { if (i >= nLive) { cr.put(i, { visible: false }); continue; } const d = body(i, t); cr.put(i, d); const r = role[i];
      if (r.kind === 'player' && d.track && d.track.startsWith('orch_') || (r.kind === 'player' && r.seat.pose === 'piano' && t >= r.tL - 0.12)) { const s = r.seat, g = sm((t - r.tL + 0.12) / 0.3);
        if (!STANDING[s.pose] && s.pose !== 'piano') chair(b, s, 0.55 * g); instrument(b, s, { pos: d.pos, yaw: d.yaw, track: d.track, time: d.time, color: hex(s.lane) }, g); k++; } }
    for (const st of stands) { const g = Math.min(...st.who.map((s) => sm((t - role[s.i].tL + 0.05) / 0.35))); if (g > 0.01) stand(b, st, 0.32 * g); }
    podium(b, 0.8);
    const sh = shotAt(t); let camera = { ...sh.s.cam(sh.u), far: 30000 }; if (camera.aperture === undefined) camera.aperture = 0;
    if (dev) { const v = dev.split(',').map(Number); camera = { pos: R(v[0], v[1], v[2]), target: R(v[3], v[4], v[5]), fov: v[6] || 40, far: 30000, aperture: 0, topUp: [1, 0, 0] }; }
    if (!camera.focusDist) camera.focusDist = 10;
    if (HOOKS) { const p = K.project(camera, cmHead(t)), q = K.project(camera, [hx, 1.7, hz]); console.log('ORCHHOOK ' + JSON.stringify({ tOld: +t.toFixed(4), shot: sh.s.name, concertmaster: p.d > 0 ? [+(0.5 + 0.5 * p.x).toFixed(4), +(0.5 - 0.5 * p.y).toFixed(4)] : null, hero: q.d > 0 ? [+(0.5 + 0.5 * q.x).toFixed(4), +(0.5 - 0.5 * q.y).toFixed(4)] : null })); }      // dev: --q orchhooks=1 (frame fractions, x right, y down)
    const hot = 1 - sm((t - (tA + 0.9)) / 0.6), extra = [P.drawable(b, { gain: 1, minPx: 1.0, haloPx: 3, halo: 0.18 }), C.heroPool(t, camera, { gain: 0.75 })];
    { const g = sm((t - role[cm.i].tL) / 0.4); if (g > 0) extra.push(W.glow([{ x: cm.x, z: cm.z, r: Math.max(0.9, 0.03 * Math.hypot(camera.pos[0] - cm.x, camera.pos[1], camera.pos[2] - cm.z)), c: [1.0 * 0.7 * g, 0.40 * 0.7 * g, 0.09 * 0.7 * g] }])); }      // the concertmaster: a pool of main-orange under her chair, as under the hero
    if (hot > 0.01) extra.push(streaks.drawable({ head: t, gain: 0.06 + 0.45 * hot, textGain: 0, minPx: 1.2, halo: 0.25, haloPx: 4, headGain: 3, headLen: 0.12, soft: 0.02, flow: 0 }));
    return { camera, world: { text: 0.5, flow: 0.1, lights: { gain: 0.6 }, main: { head: C.mainHead(t) } }, extra, hud: K.hudMain(t, { count: nLive }), noBackBand: true }; }

  // the concertmaster, for the compositor's label: her head (world) at song time t (old time)
  const cmHead = (t) => { const d = body(cm.i, t); return d.track ? cast.hips(d.track, d.time, d.pos, d.yaw).map((v, j) => (j === 1 ? v + 0.52 : v)) : [cm.x, 1.1, cm.z]; };
  const counts = {}; for (const s of seats) counts[s.sec] = (counts[s.sec] || 0) + 1;
  console.log(`orchestra: ${seats.length} players ${JSON.stringify(counts)}, ${stands.length} stands, wushu row ${WROW.length} + the hero; audience rings ${ring.length} slots (${role.filter((r) => r && r.kind === 'aud').length} used); concertmaster copy ${cm.i}; window ${tA.toFixed(3)}..${tEnd.toFixed(3)} (old time), beat0 ${b0}`);
  return { on, frame, seats, cm, cmHead, SHOTS, shotAt, role };
}
