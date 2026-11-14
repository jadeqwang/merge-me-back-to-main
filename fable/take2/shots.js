// MERGE take two: the whole shot table (fable/take2/PLAN.md section 6) as data, bar 1 to the end of the audio (0 to 282.8 s).
// Pure data plus a resolver; loads in the browser (fable/take2/src/film.js) and in node (fable/take2/tools/shots.mjs).
//
// A shot:
//   id        working id (section letter + running number), stable for notes
//   sec       section key (SECTIONS below): card colour and the debug overlay's section name
//   from, to  [bar, beat] (beat 1-based, fractional = off-beats). Resolved through the measured beat list of analysis_v3/timing.json
//             (never constant BPM). from: [1,1] is the film's frame 0 (t = 0), to: 'end' is the end of the audio.
//   code      the table's source code (P, S, K, V7, L, C, or combinations such as 'V7+C')
//   kind      how the compositor draws it now: 'plate' | 'v7' | 'card' | 'proof' (missing plates fall back to a card)
//   src       source id: plate id (work_fable/take2/plates/<id> or work_fable/proof/plates/<id>), v7 sequence label, proof part
//   status    'exists' (the source exists now: proof plates, proof edit, the v7 film) or 'missing' (still to be made)
//   pic       the table's "Picture" text (for a split row, the part this shot shows)
//   layout    'full' (the only layout used so far)
//   lyric     lyric placement hint: 'auto' (verse lines low, chorus lines as a slab; on cards: the strip), 'proof' (the proof draws it)
//   ov        overlays (machine layer drawn in code over the source). Implemented: chip:<text>, counter, title:<text>, flash:<plate>.
//             Others are listed so the card shows them (to do in code): lanes, nodes, thumbnails, gitlog, handwriting, graph...
//   opt       per-shot source options: clip0 (s into the clip), clip1 (s: play clip0..clip1 over the shot, i.e. speed = span / shot
//             length), speed, push (zoom over the shot), zoom0, blend (frame blend; default on only when the clip is slowed, speed < 1),
//             twos (12 fps), still (use still.jpg), fx/fy (crop focus), flash {id, frames}
//             cross {life, reach, at, end, door, maxSpeed, life0}: the crossing wipe (b20-23). reach = clip time she is in the doorway;
//               it lands at fraction `at` of the shot (clip0 and speed are derived: speed = reach / (at * length), capped at maxSpeed,
//               the rest by starting later in the clip); door = [x0, y0, x1, y1] the doorway in frame fractions at clip time reach;
//               from `at` to `end` the doorway grows to the full frame showing the life plate `life` (proof plate) cover-fitted
//               inside it, from its clip time life0; after `end` the life plate is the picture
//             lane {pts, color, text, cap, scroll, merge, under, from, to}: a written lane (src/lanes.js) over the plate; pts in frame
//               fractions [[x, y], ...]; text = a life id (its commit message) or 'main' (merge me back to main + every message)
//             lyr {x0, x1, y, align, top}: where this shot's lyric goes (frame fractions; y 'bottom' | 'top', top = first row's top);
//               default the full width, bottom. Only the words sung before the shot ends are laid out in the region; tail N: only the
//               line's last N words (b56: the held 'undone')
//             v7crop [x, y, w, h]: v7 shots, the part of the v7 frame used (fractions), e.g. to crop out v7's own road-written lyric
//   alt       an alternative source named in the table
// paper / ink: the paper pass for v7 sources in the section (default black paper, every lane hue kept)
export const SECTIONS = {
  intro_a: { name: 'Intro A', color: '#FF7A1A' },
  intro_b: { name: 'Intro B', color: '#FF7A1A' },
  verse1: { name: 'Verse 1', color: '#FF3D7F' },
  pre: { name: 'Pre-chorus', color: '#FFD23F' },
  chorus1: { name: 'Chorus 1', color: '#FF7A1A' },
  break_a: { name: 'Breakdown A', color: '#22D3EE' },
  break_b: { name: 'Breakdown B', color: '#3DDC97' },
  build: { name: 'Build', color: '#3D8BFF' },
  drop: { name: 'Drop', color: '#FFB020', paper: 'black', ink: ['#FFB020'], stroke: '#FFC23A' },   // the sunrise drop: two colours, gold and black (gold neutral marks: effects test 8 recipe)
  verse2: { name: 'Verse 2', color: '#9B6BFF' },
  chorus2: { name: 'Chorus 2', color: '#FF7A1A' },
  outro_a: { name: 'Outro A', color: '#FF7A1A', paper: 'white' },              // day
  outro_bc: { name: 'Outro B-C', color: '#E24BD6' },
};

// the twelve lives in grid order (fable/proof/lives.js); plate ids
const LIFE = ['piano', 'violin', 'wushu', 'wetlab', 'phd', 'poet', 'ames', 'band', 'chezjj', 'sandstorm', 'home', 'violet'];
// the download details (b65-68), one per life, in the same order
const DETAIL = ['fingers on keys', 'bow on string', 'a fist', 'a pipette', 'a pen trace', 'typewriter keys', 'a fan blade', 'a guitar pick',
  'laptop keys', 'a lectern', 'a grapefruit by a lamp', 'a pencil in a bun'];
// the four stance stills (Step 3: no true empty stance was generated, so the fourth is a second drop stance)
const STANCE = [['stance_bow', 'bow stance punch'], ['stance_horse', 'horse stance'], ['stance_drop', 'drop stance'], ['stance_drop2', 'drop stance, second view']];

const S = [];
let sec = null, n = 0;
const PFX = { intro_a: 'ia', intro_b: 'ib', verse1: 'va', pre: 'pc', chorus1: 'ca', break_a: 'ba', break_b: 'bb', build: 'bu', drop: 'dr', verse2: 'vb', chorus2: 'cb', outro_a: 'oa', outro_bc: 'ob' };   // letters only, so ids read as letters + running number
function section(k) { sec = k; n = 0; }
// add a shot; from/to as [bar, beat] or a bar number
function shot(from, to, code, kind, src, status, pic, x = {}) {
  n++; const id = `${PFX[sec]}${String(n).padStart(2, '0')}`;
  const bb = (v) => (Array.isArray(v) || v === 'end' ? v : [v, 1]);
  S.push({ id, sec, from: bb(from), to: bb(to), code, kind, src, status, pic, layout: 'full', lyric: x.lyric || 'auto', ov: x.ov || [], opt: x.opt || {}, alt: x.alt || null, row: x.row || null });
}
const P = (from, to, src, status, pic, x) => shot(from, to, x && x.code || 'P', 'plate', src, status, pic, x);
const V = (from, to, src, pic, x) => shot(from, to, x && x.code || 'V7', 'v7', src, 'exists', pic, x);
const C = (from, to, src, pic, x) => shot(from, to, x && x.code || 'C', 'card', src, 'missing', pic, x);
const PR = (from, to, src, pic, x) => shot(from, to, x && x.code || 'P', 'proof', src, 'exists', pic, { lyric: 'proof', ...x });

// ------------------------------------------------------------------ Intro A: bars 1-8 (pads and arp, no drums)
section('intro_a');
P(1, 3, 'root', 'exists', "Frame 0, no fade-in: the child's palm on the cold glass, frost already branching from it. Chip top-left: ● main  1 branch.",
  { ov: ['chip:● main  1 branch'], opt: { clip0: 1.0, push: 0.03 }, row: 'b1-2' });
P(3, 5, 'root_fork', 'missing', 'Close on the glass: the frost forks in two, then four, on the bar lines. Counter 2, 4.', { ov: ['counter'], row: 'b3-4', opt: { clip0: 1.15, speed: 1.05 } });   // clip: forks in two at about 1.2 s (on the bar 3 line), branches on to about 3 s (bar 4)
P(5, 7, 'root_face', 'missing', "The child's face in profile, lit by the frost, watching. First face. Counter 8, 16.", { ov: ['counter'], row: 'b5-6', opt: { counterSide: 'left', clip0: 0, clip1: 3.0 } });   // clip: first 3 s (a blink at 3.2-3.4, a late push crops the ponytail)
// b7-8: the root clip from 2.0 s (the frost has grown) slightly slowed, pulling back; twelve frost tips (plate fractions, measured on the
// clip's frame 84) light up in the lives' lane colours one per half beat from beat 2 of b7
P(7, 9, 'root', 'exists', 'Pull back: the frost tree fills the pane; its tips take lane colours one by one. Counter 32, 64.',
  { code: 'P+C', ov: ['counter'], opt: { clip0: 2.0, speed: 0.85, zoom0: 1.18, push: -0.18,
    tips: [[0.43, 0.10], [0.672, 0.093], [0.312, 0.40], [0.53, 0.07], [0.35, 0.55], [0.77, 0.27], [0.36, 0.25], [0.46, 0.62], [0.60, 0.11], [0.40, 0.58], [0.56, 0.58], [0.335, 0.33]] }, row: 'b7-8' });

// ------------------------------------------------------------------ Intro B: bars 9-16 (kick hit, rolling bass)
section('intro_b');
// Step 3: no counter from b9 (the v7 tree's light count cannot be matched to a doubling number; Jade's rule: drop it after 64)
V(9, 10, 'seq 02', 'Match cut, frost tree to tree of light seen from above. Title MERGE. Counter doubles each bar to 1,024 by b15.', { code: 'V7+C', ov: ['title:MERGE'], row: 'b9' });
const FL = [['piano', 11], ['wushu', 12], ['ames', 13], ['violet', 14]];
V(10, [11, 3], 'seq 02', 'The tree grows east.', { row: 'b10-14' });
FL.forEach(([id, b], i) => {
  P([b, 3], [b, 4], id, 'exists', `One-beat flash of a life plate (${id === 'violet' ? 'the dish' : id === 'ames' ? 'wind tunnel' : id}): what the lights are.`, { opt: { clip0: 1.2, push: 0.02 }, row: 'b10-14' });
  if (i < 3) V([b, 4], [b + 1, 3], 'seq 02', 'The tree grows east.', { row: 'b10-14' });
});
V([14, 4], 15, 'seq 02', 'The tree grows east.', { row: 'b10-14' });
V(15, [16, 3], 'seq 02', 'Swoop down the trunk to ground level.', { row: 'b15-16' });
P([16, 3], 17, 'main_palm', 'missing', "Adult Jade from behind at the root, palm raised exactly like the child's.", { row: 'b15-16', opt: { clip0: 1.0, clip1: 3.0 } });   // clip: the tree grows fastest at about 1-3 s

// ------------------------------------------------------------------ Verse 1: bars 17-32
section('verse1');
// Step 2 (bars 17-56): every plate shot picks up its plate when work_fable/take2/plates/<id>/ is complete (meta.json and its last
// frame, or REAL); until then it is a card. Lyric places (lyr) and doorways (door) were measured on the first-frame stills
// (work_fable/take2/stills/) and on the clips that had landed; see notes/compositor.md "Step 2".
P(17, 18, 'main_face', 'missing', 'Close three-quarter on her face, eyes open, calm.', { row: 'b17', opt: { lyr: { x0: 0.05, x1: 0.47, align: 'left' } } });
P(18, 19, 'main_split', 'missing', 'She steps apart into two, then four (Banach-Tarski: each keeps a whole body). The copies\' bands take lane colours.',
  { row: 'b18', opt: { clip0: 0.5, clip1: 3.2, push: 0.02 } });   // director: one figure to 0.7 s, two by 1.0, four apart by 2.8
V(19, 20, 'seq 01', 'From above and behind: eight, sixteen, more run out along their lanes.',
  { code: 'V7', alt: 'K runners + C', row: 'b19', opt: { v7crop: [0.3, 0.0, 0.7, 0.7] } });   // v7's own road lyric (I SPLIT MYSELF...) runs along the bottom left: cropped out
const CROSS = [
  ['cross_wushu', 'Wushu (woodblock)', 'wushu', { reach: 3.5, door: [0.41, 0.125, 0.582, 0.66] }],   // clip: whole figure inside the door outline from 2.25 s
  ['cross_wetlab', 'neuron lab (ink)', 'wetlab', { reach: 3.0, door: [0.29, 0.10, 0.44, 0.74] }],   // measured on the clip: front half through the door at 3.0 s
  ['cross_ames', 'wind tunnel (painting)', 'ames', { reach: 2.7, door: [0.20, 0.09, 0.43, 0.80] }],   // clip: half through at 2.75 s, in at 3.25 s
  ['cross_hackerhouses', 'hacker houses (pixel)', 'chezjj', { reach: 2.7, door: [0.20, 0.07, 0.38, 0.50] }],   // clip: at the door's edge 2.25 s, inside and glowing at 3.0 s
];
CROSS.forEach(([id, m, life, c], i) =>
  P(20 + i, 21 + i, id, 'missing', `Crossing ${i + 1} of 4: a cel-drawn branch-Jade runs her lane toward a doorway of light; as she crosses, the whole picture turns into her medium: ${m}.`,
    { code: 'P+C', row: 'b20-23', opt: { push: 0, cross: { life, at: 0.58, end: 0.84, maxSpeed: 1.5, life0: 1.0, ...c }, lyr: { x0: 0.04, x1: 0.5, align: 'left' } } }));
P(24, 25, 'cross_violet', 'missing', 'The fifth road has no doorway: the violet one runs out into engraved dark, and she keeps going.', { row: 'b24' });
P(25, 26, 'main_light', 'missing', 'Close on cupped hands; a light kindles.', { row: 'b25', opt: { clip0: 2.0, clip1: 4.5, lyr: { y: 'top' } } });   // the light appears from about 2.2 s (director: use 2.0-4.5)
P(26, 27, 'main_release', 'missing', 'She opens her hands; the light leaves along the lane.',
  { code: 'P+C', row: 'b26', opt: { lyr: { x0: 0.04, x1: 0.55, align: 'left' },
    lane: { pts: [[0, 0.425], [0.04, 0.417], [0.111, 0.399], [0.181, 0.379], [0.331, 0.338], [0.548, 0.275], [0.595, 0.265]], color: '#FF3D7F', text: 'piano', cap: 30, scroll: -9,
      track: [[0, 0.595], [0.375, 0.548], [0.5, 0.331], [0.625, 0.181], [0.75, 0.111], [1.0, 0.064], [1.5, 0.044]] } } });   // the light's path, measured on the clip (warmest point per frame): the lane is written behind it
V(27, 28, 'lane shot', 'The light races down the rose lane and becomes the lamp in the piano room (match cut).', { row: 'b27' });
// b28-32: the proof edit, ten lives, 4,4,2,2,2,2,1,1,1,1 beats
{ const D = [4, 4, 2, 2, 2, 2, 1, 1, 1, 1]; let b = 0; const at = (k) => [28 + Math.floor(k / 4), 1 + (k % 4)];
  LIFE.slice(0, 10).forEach((id, i) => { PR(at(b), at(b + D[i]), `A:${id}`, `Ten lives, one plate each (${D[i]} beat${D[i] > 1 ? 's' : ''}): ${id}. Lane line and chip.`, { row: 'b28-32' }); b += D[i]; }); }

// ------------------------------------------------------------------ Pre-chorus: bars 33-40
section('pre');
PR(33, 37, 'B:grid', 'The twelve-panel grid assembles, one panel per half beat; home and the violet branch join. Lyrics in the strip under the grid.', { code: 'P+C', row: 'b33-36' });
PR(37, 38, 'C:turn', 'Every life turns her head to look back at the same instant. Hold the bar.', { row: 'b37' });
PR(38, 39, 'D:merge', "The twelve lanes merge into main, column by column, and the view travels home along it. (Fix still to do: fill the empty top half.)", { code: 'C', row: 'b38' });
PR(39, 41, 'D:root', 'The root node opens onto the child at the frost window; riser.', { row: 'b39-40' });

// ------------------------------------------------------------------ Chorus 1: bars 41-56
section('chorus1');
PR(41, 43, 'E:hero', 'Main Jade sprints at us on the orange line as the coloured lanes join it. Slab type.', { row: 'b41-42' });
// b43, b46-47, b48: the runner kit (kind 'kit', drawn by src/kit.js from the cut-outs in work_fable/take2/kit/ and fable/take2/kit.json).
// lanes far -> near with each runner's head x (frame fraction); every head top on one line (y `head`), the slab above it.
// far -> near; the front four (poet, phd, wushu, main) are large on the right, main in front and largest; the slab keeps to the upper left
const KIT_ROW = [['violet', 0.30], ['sandstorm', 0.16], ['chezjj', 0.44], ['wetlab', 0.08], ['home', 0.36], ['piano', 0.22], ['violin', 0.47],
  ['band', 0.12], ['ames', 0.33], ['poet', 0.93], ['phd', 0.80], ['wushu', 0.50], ['main', 0.68]].map(([id, x]) => ({ id, x }));
shot(43, 44, 'K+C', 'kit', 'runner_kit', 'missing', 'Side-on: the twelve run in parallel on their lanes, each drawn in her own medium, main in front.',
  { row: 'b43', opt: { lyr: { y: 'top', top: 0.035, x0: 0.03, x1: 0.48, align: 'left' }, kit: { mode: 'row', lanes: KIT_ROW } } });
P(44, 45, 'hero_feet', 'missing', 'Low and close: her trainers strike the orange line.',
  { row: 'b44', opt: { lyr: { y: 'top', x0: 0.04, x1: 0.96, align: 'left' }, lane: { pts: [[0, 0.845], [1, 0.845]], color: '#FF7A1A', text: 'main', cap: 34, scroll: -14 } } });   // written just under the plate's own line (y 0.80-0.81 in the clip)
V(45, 46, '1:16-1:20', 'From above: the lanes braid into one. Slab type.', { row: 'b45' });
// fusions on the measured half beats (a fusion lands ON its beat): [beat from the shot start, lane a, lane b]; 8 -> 4 at beats 0.5, 1.5,
// 2.5, 3.5 of b46, 4 -> 2 at 4.5 and 6.5 (b47 beats 1.5 and 3.5). Each pair comes to the front (src/kit.js 'fuse'), large, so the
// half-and-half beat reads; slots = the two front x places, alternating.
shot(46, 48, 'K+C', 'kit', 'runner_fuse', 'missing', 'Runners fuse in pairs, eight to four to two. Where pencil-Jade and gouache-Jade merge, the new runner is half and half for a beat, then whole.',
  { row: 'b46-47', opt: { lyr: { y: 'top', top: 0.035, x0: 0.03, x1: 0.46, align: 'left' }, kit: { mode: 'fuse', slots: [0.64, 0.86],
    lanes: [['violin', 0.30], ['piano', 0.52], ['wushu', 0.20], ['wetlab', 0.66], ['phd', 0.36], ['poet', 0.80], ['ames', 0.48], ['band', 0.10]].map(([id, x]) => ({ id, x })),
    events: [[0.5, 0, 1], [1.5, 2, 3], [2.5, 4, 5], [3.5, 6, 7], [4.5, 0, 2], [6.5, 4, 6]] } } });
shot(48, 49, 'K+C', 'kit', 'runner_one', 'missing', "One runner: main Jade, the others' mediums flickering across her jacket.",
  { row: 'b48', opt: { lyr: { y: 'top', top: 0.035, x0: 0.03, x1: 0.58, align: 'left' }, kit: { mode: 'one', x: 0.74, head: 0.1, near: 1.04, lane: 0.95,
    flick: ['piano', 'violin', 'wushu', 'wetlab', 'phd', 'poet', 'ames', 'band', 'chezjj', 'home', 'violet', 'piano'] } } });
P(49, 51, 'fold_reach', 'missing', 'Close: she reaches one hand to the lens, then draws it back.', { row: 'b49-50', opt: { lyr: { x0: 0.66, x1: 0.97, align: 'right' } } });   // clip: she is centred, the hand reaches to frame left; the right third is clear
P(51, 53, 'fold_chest', 'missing', 'Hands crossed at her chest; a fan of twelve afterimages, each in a medium, folds into her one per beat.', { code: 'P+K', row: 'b51-52', opt: { lyr: { x0: 0.03, x1: 0.97, align: 'left' },   // one row along the bottom (her trousers): clear of the fan, face and hands
    fan: { matte: '/work_fable/take2/kit/fold_chest', pivot: [0.5, 0.98], lives: ['piano', 'violin', 'wushu', 'wetlab', 'phd', 'poet', 'ames', 'band', 'chezjj', 'sandstorm', 'home', 'violet'] } } });
P(53, 54, 'look_back', 'missing', "She stops and looks back over her shoulder: the same look as the lives'.", { row: 'b53', opt: { clip0: 0, lyr: { x0: 0.03, x1: 0.5, align: 'left' } } });
V(54, 56, 'night world', 'Wide: every road still glows to the horizon; along them the twelve worlds as small lit windows; commit nodes lock on, one per beat.',
  { code: 'V7+P+C', ov: ['plate thumbnails (to do)', 'commit nodes per beat (to do)'], row: 'b54-55', opt: { lyr: { x0: 0.03, x1: 0.6, align: 'left' } } });
P(56, 57, 'main_back_wide', 'missing', 'Her from behind before the whole lit continent. Slow pull-out.', { row: 'b56', opt: { clip0: 0, clip1: 3.0, push: 0, lyr: { y: 'top', top: 0.025, tail: 1 } } });   // the whole pull-out (close on the jacket back to the wide by 3 s); only the held UNDONE, one row at the very top, above her head

// ------------------------------------------------------------------ Breakdown A: bars 57-64 (crash on b57, strings)
section('break_a');
// float_top + strands (src/film.js strands()): twelve hair strands continued as written lanes (branch name and commit message) from the hair
// ends (STRANDS, plate fractions measured on the clip) straight out to the frame edge. mode: 'grow' (written out over the first bar),
// 'double' (each forks in two), 'rotate' (the plate and the strands turn slowly and pull out; a life window glides along one strand),
// 'pulses' (light runs home along every strand, one strand per sixteenth)
P(57, 59, 'float_top', 'missing', 'From above: she floats on her back on dark water, hair fanned out; each strand continues as a coloured lane to the edge of frame, with its branch name.', { code: 'P+C', row: 'b57-58', opt: { strands: { mode: 'grow' } } });
P(59, 60, 'float_face', 'missing', 'Close on her face, eyes closed, water lapping.', { row: 'b59-60', opt: { lyr: { x0: 0.03, x1: 0.36, align: 'left' } } });   // her face is top centre: type bottom left
P(60, 61, 'float_top', 'missing', 'Back above: the strands branch outward, doubling.', { code: 'C+P', row: 'b59-60', opt: { clip0: 2.0, strands: { mode: 'double' } } });
P(61, 63, 'float_top', 'missing', 'Slow rotation and pull-out; along one strand a life window glides past.', { code: 'C+P', row: 'b61-62', opt: { clip0: 0.5, speed: 0.75, push: 0, strands: { mode: 'rotate', window: 'piano', on: 3 } } });
P(63, 64, 'float_top', 'missing', 'Pulses of light come home along every strand.', { code: 'C+P', row: 'b63-64', opt: { clip0: 3.0, strands: { mode: 'pulses' } } });
P(64, 65, 'float_hand', 'missing', 'Her hand opens on the water as one arrives.', { row: 'b63-64', opt: { clip0: 1.0, clip1: 3.5, lyr: { x0: 0.03, x1: 0.5, align: 'left' } } });   // clip: the light reaches her palm at about 2.5 s, a loose fist by 3.5

// ------------------------------------------------------------------ Breakdown B: bars 65-72 ("Ahh"; snare crescendo from b68, roll in b72)
section('break_b');
for (let bar = 65; bar <= 68; bar++) {
  for (let k = 0; k < 3; k++) { const i = (bar - 65) * 3 + k;
    shot([bar, 1 + k], [bar, 2 + k], 'S', 'plate', `det_${LIFE[i]}`, 'missing', `The download, one detail per beat in its medium: ${DETAIL[i]} (${LIFE[i]}).`, { row: 'b65-68', opt: { push: 0.04, caption: LIFE[i], lyr: { y: 'top' } } }); }
  P([bar, 4], bar + 1, 'float_face', 'missing', 'Every fourth beat, her face: eyes moving under closed lids.', { row: 'b65-68', opt: { clip0: 0.5 + (bar - 65) * 0.8, lyr: { x0: 0.03, x1: 0.36, align: 'left' } } });
}
P(69, 70, 'rise', 'missing', 'She rises upright out of the water, arms opening; the first band of dawn.', { row: 'b69' });
for (let k = 0; k < 16; k++) { const i = k % 12, bar = 70 + Math.floor(k / 8), beat = 1 + (k % 8) / 2;
  shot([bar, beat], k === 15 ? 72 : [70 + Math.floor((k + 1) / 8), 1 + ((k + 1) % 8) / 2], 'S', 'plate', `det_${LIFE[i]}`, 'missing',
    `The details again, two per beat, new crops: ${DETAIL[i]}${k >= 12 ? ' (second new crop)' : ''}. White flashes on the snare.`, { opt: { crop: k >= 12 ? 'c' : 'b', push: 0.05, caption: LIFE[i], white: k % 4 === 2, lyr: { y: 'top' } }, row: 'b70-71' }); }   // the snare: beats 2 and 4
shot(72, 73, 'C', 'code', 'tile_collapse', 'missing', 'All twelve tile in on sixteenths and collapse to a point.', { row: 'b72', opt: { code: 'tiles', lives: LIFE } });

// ------------------------------------------------------------------ Build: bars 73-88 (biggest impact on b73; four on the floor)
section('build');
for (let k = 0; k < 4; k++) {
  shot(73 + k, [73 + k, 2], 'S', 'plate', STANCE[k][0], 'missing', `Impact frame on the bar line: cel Jade in a long-fist stance (${STANCE[k][1]}), rim-lit, blue hour.`, { row: 'b73-76', opt: { push: 0.04, white: true } });
  shot([73 + k, 2], 74 + k, 'C', 'code', 'gitlog', 'missing', `git log --graph racing on the beat, her real commit messages: ${2 ** (k + 1)} rows per beat.`, { row: 'b73-76', opt: { code: 'gitlog', rate: 2 ** (k + 1), bar: k } });
}
for (let k = 0; k < 4; k++) {
  V(77 + k, [77 + k, 3], 'seq 08', `Frontal formation: she forks on every kick (bar ${k + 1} of 4, toward 256).`, { row: 'b77-80' });
  shot([77 + k, 3], [77 + k, 4], 'S', 'plate', STANCE[k][0], 'missing', `Stance frame on beat 3 (${STANCE[k][1]}).`, { row: 'b77-80', opt: { push: 0.04, white: true, zoom0: 1.06 } });
  V([77 + k, 4], 78 + k, 'seq 08', 'Frontal formation, after the stance frame.', { row: 'b77-80' });
}
// b81-84: the orchestra of Jades (v7 seq 08 variant, fable/take2/notes/orchestra.md revision 2), eight shots on the bar and beat 3,
// frames from their own folder (opt.v7dir); paper: the orchestra look (opt.paperLook, src/film.js PAPER_LOOKS; ?orchpaper=light|solid|default).
// Shot 8 holds one beat into bar 85 to show the hit (the frames run to bar 85 beat 2); seq 09 starts on beat 2.
const ORCH = ['above', 'side_low_violins', 'above_behind', 'timpani', 'conductor_view', 'basses_side', 'high_wide', 'last_wide'];
for (let k = 0; k < 8; k++) { const b = 81 + (k >> 1), a = k % 2 ? [b, 3] : b, e = k === 7 ? [85, 2] : k % 2 ? b + 1 : [b, 3];
  V(a, e, 'orchestra ' + ORCH[k], `The orchestra of Jades (${k + 1} of 8): ${ORCH[k].replace(/_/g, ' ')}.`, { row: 'b81-84', opt: { v7dir: '/work_fable/take2/v7/orchestra', paperLook: 'orch' } }); }
V([85, 2], 87, 'seq 09', 'Bass out in b86, snare build: all drop into a low stance; the view skims east.', { row: 'b85-88' });
for (let k = 0; k < 12; k++) { const half = k >= 4, bar = half ? 88 : 87, beat = half ? 1 + (k - 4) / 2 : 1 + k;
  const nk = k + 1, to = nk === 12 ? 89 : nk >= 4 ? [88, 1 + (nk - 4) / 2] : [87, 1 + nk];
  V([bar, beat], to, 'seq 09', `${half ? 'Two cuts per beat' : 'One cut per beat'}: a three-frame flash of the ${LIFE[k]} plate, then the skim east${k === 11 ? '; the sun\'s rim' : ''}.`,
    { code: 'V7+P', ov: [`flash:${LIFE[k]}`], opt: { flash: { id: LIFE[k], frames: 3 } }, row: 'b85-88' }); }

// ------------------------------------------------------------------ Drop: bars 89-104 (night to sunrise, full colour)
section('drop');
V(89, 90, '2:32', 'Butterfly kick at its apex against the huge sun.', { row: 'b89' });
for (let k = 0; k < 3; k++) {
  V(90 + k, [90 + k, 3], 'seq 10', 'The unison phrase, low and wide, the thousand in silhouette.', { row: 'b90-92' });
  shot([90 + k, 3], 91 + k, 'S', 'plate', `drop_hero_${k + 1}`, 'missing', `Two-beat close insert ${k + 1} of 3: cel Jade in one of the phrase's key poses, lit gold.`, { row: 'b90-92', opt: { push: 0.035, white: true } });
}
for (let k = 0; k < 4; k++) V(93 + k, 94 + k, '2:52', ['Travelling phrases.', 'The close line of copies.', 'Orbit.', 'Travelling phrase, orbit.'][k] + ' (one cut per bar)', { row: 'b93-96' });
V(97, 98, '2:44', 'The group fall, from her real set.', { row: 'b97-99' });
V(98, 100, '2:44', 'From above the bodies spell MAIN; hold; they rise as one.', { row: 'b97-99' });
// the wordless "ooh" (vocal stems 172.54-180.28; an adlib, not in the lyric lines) set on its time over both b100 shots
V(100, [100, 3], '2:56', 'Arms wide.', { row: 'b100', ov: ['adlib:ooh:172.54'] });
P([100, 3], 101, 'drop_face', 'missing', 'Close: her face in the sun, eyes closed, breathing ("ooh" 172.5).', { row: 'b100', ov: ['adlib:ooh:172.54'], opt: { adlibAt: [0.82, 0.86] } });
V(101, 102, '2:57', 'Last phrase.', { row: 'b101-103' });
shot(102, [102, 3], 'S', 'plate', 'drop_hero_4', 'missing', 'Insert: cel Jade, last phrase, lit gold.', { row: 'b101-103', opt: { push: 0.035, white: true } });
V([102, 3], [103, 3], '2:58', 'Tornado kick.', { row: 'b101-103' });
shot([103, 3], 104, 'S', 'plate', 'drop_hero_5', 'missing', 'Insert: the landing, lit gold.', { row: 'b101-103', opt: { push: 0.035, white: true } });
V(104, 105, '2:59', '1,024 salute the sun. Cut to night on b105.', { row: 'b104' });

// ------------------------------------------------------------------ Verse 2: bars 105-120 (scratchboard, white on black, violet the only colour)
section('verse2');
// lyrics in the empty sky (cream); lane = the violet branch written sparse (merge 0) on the plate's violet line
const VIO = '#9B6BFF';
P(105, 107, 'vio_wide', 'missing', 'A tiny figure on a violet lane under an engraved Milky Way. Chip: ● jade/1420-mhz  ctx 97%.',
  { ov: ['chip:● jade/1420-mhz  ctx 97%'], row: 'b105-106', opt: { lyr: { x0: 0.03, x1: 0.6, align: 'left' }, lane: { pts: [[0.27, 0.79], [1, 0.975]], color: VIO, text: 'violet', cap: 20, scroll: -6, under: 0.2 } } });
P(107, 108, 'vio_walk', 'missing', 'Side medium, walking.', { row: 'b107-108', opt: { lyr: { x0: 0.03, x1: 0.55, align: 'left' }, lane: { pts: [[0, 0.955], [1, 0.955]], color: VIO, text: 'violet', cap: 22, scroll: -10, under: 0.2 } } });
P(108, 109, 'vio_close', 'missing', 'Her profile, the bun and two pencils.', { row: 'b107-108', opt: { clip0: 0, lyr: { x0: 0.03, x1: 0.5, align: 'left' } } });   // clip 0-1.7 s, before the blink near 2.5 s
P(109, 111, 'vio_lookback', 'missing', 'She stops and looks back east: far off, a sliver of sunrise in full colour.', { row: 'b109-110', opt: { clip0: 0, clip1: 2.5, lyr: { y: 'top', x0: 0.42, x1: 0.97, align: 'right' } } });   // clip 0-2.5 s: the sunrise stays a far sliver
P(111, 112, 'vio_climb', 'missing', 'She climbs to the rim of the dish.', { row: 'b111-112' });
P(112, 113, 'violet', 'exists', 'She sits on the rim of the dish.', { opt: { clip0: 0.5, push: 0.02 }, row: 'b111-112' });
P(113, 114, 'vio_pencil', 'missing', 'She draws a pencil from her bun.', { row: 'b113-115', opt: { clip0: 2.3, clip1: 4.0, lyr: { x0: 0.56, x1: 0.97, align: 'right' } } });   // clip: the pencil out of the bun by 3 s, held up by 4 s (ends on it)
// the handwriting (src/script.js): written stroke by stroke where her pencil points; at = start of the line (plate fractions), size = x-height
// (frame fraction), write = [from, to] fraction of the shot; placed so the pen ends at her pencil tip (about 0.5-0.6, 0.07 in vio_write) and
// the line runs left of it in the empty sky above the dish; on vio_release the finished line lifts off and arcs up and over to the sunrise
// on the right (to), arriving on the bar 117 downbeat with a flash
// track: the pencil tip in vio_write per 4 frames (the yellow pencil's left end, minus the graphite point), plate fractions; the ink's pen
// point sits on it while writing, its end after (and where vio_release takes it from)
const HAND = { text: 'docs: start here', at: [0.21, 0.19], size: 0.04, track: [[0, 0.522, 0.122], [1.0, 0.522, 0.125], [1.5, 0.534, 0.117], [2.0, 0.548, 0.111], [2.5, 0.562, 0.106],
  [3.0, 0.572, 0.103], [3.5, 0.586, 0.096], [4.0, 0.601, 0.091], [4.5, 0.614, 0.085], [5.0, 0.615, 0.084]] };   
P(114, 116, 'vio_write', 'missing', 'She writes in the air. The handwriting docs: start here is drawn in code, in violet light. ctx 99%.',
  { code: 'P+C', ov: ['chip:● jade/1420-mhz  ctx 99%'], row: 'b113-115', opt: { lyr: { x0: 0.03, x1: 0.55, align: 'left' }, hand: { ...HAND, write: [0.05, 0.92] } } });
P(116, 118, 'vio_release', 'missing', 'She lets the line of light go; it lifts off east. Hit on b117, then the drums cut. ctx 100%.',
  { code: 'P+C', ov: ['chip:● jade/1420-mhz  ctx 100%'], row: 'b116-117', opt: { lyr: { x0: 0.03, x1: 0.55, align: 'left' }, hand: { ...HAND, release: { to: [0.93, 0.5], top: 0.04, arrive: 117, trackAt: 3.46 } } } });
P(118, 121, 'vio_still', 'missing', 'She sits, hands in her lap; the lines of her figure settle into the star field. Chip: detached, not merged. The stars keep twinkling.',
  { code: 'P+C', ov: ['chip:detached, not merged'], row: 'b118-120', opt: { lyr: { x0: 0.03, x1: 0.55, align: 'left' }, settle: { matte: '/work_fable/take2/kit/vio_still', poly: [[0.62, 0.06], [0.8, 0.06], [0.85, 0.4], [0.84, 0.68], [0.73, 0.76], [0.71, 0.93], [0.65, 0.94], [0.61, 0.83], [0.5, 0.9], [0.39, 0.87], [0.39, 0.72], [0.5, 0.6], [0.58, 0.5], [0.6, 0.3]] } } });

// ------------------------------------------------------------------ Chorus 2: bars 121-136
section('chorus2');
V(121, 122, 'seq 12', 'The violet light streaks east over the night continent of roads. Slab type.', { code: 'V7+C', row: 'b121' });
P(122, 123, 'c2_lookup', 'missing', 'Main Jade at first light looks up.', { row: 'b122-123', opt: { zoom0: 1.35, fx: 0, fy: 0.3, push: 0.02, lyr: { x0: 0.45, x1: 0.97, align: 'right' } } });   // she is left: the slab right; cropped left (a stray arm at the clip's right edge)
V(123, 124, 'seq 12', 'The light arriving, from her side.', { row: 'b122-123' });
// b124-126: the twelve converge on her (src/kit.js 'row' with conv): runners from the right run in toward main (large, centre), from the
// left they are mirrored; each reaches her and fades into her as the bar ends. Lanes as section 2.
const KC = (ids, xs) => ids.map((id, i) => ({ id, x: xs[i] }));
const CONV = [
  KC(['violet', 'home', 'chezjj', 'band', 'ames', 'poet', 'main'], [0.95, 0.85, 0.92, 0.8, 0.9, 0.88, 0.42]),
  KC(['sandstorm', 'wetlab', 'piano', 'violin', 'phd', 'wushu', 'main'], [0.06, 0.15, 0.1, 0.2, 0.12, 0.08, 0.6]),
  KC(['violet', 'piano', 'chezjj', 'violin', 'ames', 'phd', 'poet', 'wushu', 'main'], [0.05, 0.95, 0.1, 0.9, 0.15, 0.85, 0.02, 0.98, 0.5]),
];
for (let k = 0; k < 3; k++) shot(124 + k, 125 + k, 'K', 'kit', `runner_converge_${k + 1}`, 'missing', `The twelve runners converge on her from every side, each in her medium (shot ${k + 1} of 3).`,
  { row: 'b124-127', opt: { lyr: { y: 'top', top: 0.035, x0: 0.03, x1: 0.97, align: 'left' }, kit: { mode: 'row', lanes: CONV[k], conv: true, hNear: 0.6 } } });
V(127, 128, 'seq 12', 'From above, the roads converge.', { row: 'b124-127' });
P(128, 129, 'c2_hands', 'missing', 'Close on her hands opening.', { row: 'b128' });
P(129, 130, 'catch', 'missing', 'She catches the violet light at her chest, eyes closed.', { row: 'b129', opt: { lyr: { x0: 0.03, x1: 0.33, align: 'left' } } });   // she is centred, hands at her chest: the slab left of her
// b130-131: the folds, in code (opt.code 'fold'): night_jade on black paper; patchwork2's figure (aligned on the two cut-outs' bounding
// boxes) shows through twelve patch masks, one more per beat for eight beats, then on the off-beats of beats 5-8; each new patch flashes
// its life's lane colour on its edge
shot(130, 132, 'K+S', 'code', 'fold', 'missing', 'The twelve fold into her, one per beat; each fold adds its medium to her (twelve patches on night_jade).', { row: 'b130-131',
  opt: { lyr: { x0: 0.03, x1: 0.33, align: 'left' }, code: 'fold', base: 'night_jade', top: 'patchwork2', mattes: { night_jade: '/work_fable/take2/kit/night_jade', patchwork2: '/work_fable/take2/kit/patchwork2' }, beats: [0, 1, 2, 3, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5] } });
P(132, 134, 'patch_hold', 'missing', "The poster frame: one Jade drawn in all twelve mediums at once, on white paper: full colour and daylight arrive.", { row: 'b132-133', opt: { lyr: { x0: 0.03, x1: 0.32, align: 'left' } } });
P(134, 137, 'patch_settle', 'missing', 'The mediums settle into the clean, fully coloured Jade in daylight. Riser; snare pickup at 234.62.', { code: 'P+C', row: 'b134-136', opt: { clip0: 0, clip1: 4.95, lyr: { x0: 0.03, x1: 0.32, align: 'left' } } });

// ------------------------------------------------------------------ Outro A: bars 137-148 (full drums; has to top the drop)
section('outro_a');
// the sung likeness shots (code 'L'): used only if work_fable/take2/plates/like_sing1|2 exist locally; ?likeness=0 forces the cards
// (every committed review file is rendered with likeness=0: likeness clips stay out of the public repo)
shot(137, 139, 'L', 'plate', 'like_sing1', 'missing', 'The switch: on the impact the drawing becomes Jade herself, her traced likeness in the same jacket, singing.', { row: 'b137-138' });
// b139-140 and b141-142: the town (opt.code 'town'): white paper, far pencil hills, the twelve facades (cut out) along the road, the road =
// main's written lane, dense (she is merged); side travel with parallax; a chip with the branch name under each building
const TOWN = { code: 'town', lives: LIFE, speed: 1050, spacing: 0.3 };   // all twelve pass in the four bars (b139-142)
shot(139, 141, 'S+C', 'code', 'facades', 'missing', 'Day. The road runs past the twelve places of her life standing along it like a town, each still in its medium. Side travel with parallax.', { row: 'b139-140', opt: { ...TOWN } });
shot(141, 143, 'P+K', 'code', 'day_run', 'missing', 'Main Jade runs and dances down the road past them; she twirls a pencil, the flourish she learned from violet.', { row: 'b141-142',
  opt: { ...TOWN, x0: 3.41, runner: { dir: '/work_fable/take2/kit/day_run', x: 0.5, h: 0.62, y: 0.9 } } });
P(143, 145, 'day_fork', 'missing', 'She forks again: new branches run out as bare pencil lines on blank paper.', { code: 'P+C', row: 'b143-144', opt: { forks: true } });
shot(145, 147, 'L', 'plate', 'like_sing2', 'missing', 'Jade again, wider, singing.', { row: 'b145-146' });
shot(147, 149, 'S+C', 'code', 'aerial', 'missing', 'Aerial pull-back: the road, the town, the new forks.', { row: 'b147-148', opt: { code: 'aerial', lives: LIFE } });

// ------------------------------------------------------------------ Outro B and C: bars 149-164
section('outro_bc');
shot(149, 153, 'C', 'code', 'graph', 'missing', 'The whole film as one git graph, labels 26 px or more. The violet branch leaves; its dot; a dotted arc forward to main: cherry-pick docs: start here. Riser at 261.0.',
  { row: 'b149-152', opt: { code: 'graph', lives: LIFE } });
shot(153, 157, 'C', 'code', 'terminal', 'missing', 'Terminal: the real git log --graph of this branch, type 30 px or more, 7 s at most; $ git checkout main, $ git merge typed on beats.', { row: 'b153-156', opt: { code: 'terminal' } });
// credits: PLACEHOLDER wording from PLAN section 10 item 3, not yet approved by Jade
shot(157, [161, 3], 'C', 'code', 'credits', 'missing', 'Credits as commits, held.', { row: 'b157-160', opt: { code: 'credits', lines: [
  ['main', 'Merge'], ['main', 'animated by Fable 5.2 and a supporting cast of models'], ['jade/plates', 'Nano Banana Pro'], ['jade/clips', 'Seedance 2.5'],
  ['jade/motion', 'motion capture: CMU, ACCAD'], ['jade/arrangement', 'Suno'], ['jade/type', 'Archivo, Instrument Serif, JetBrains Mono']] } });
P([161, 3], 'end', 'root_light', 'missing', 'The child at the frost window. A violet-gold light appears in the frost in front of her palm. They do not touch. She watches it. Hold through the fade. Last frame equals frame 0.', { row: 'b161 beat 3', opt: { toFrame0: 1.5 } });

// float_top geometry (plate fractions): her head (strand centre) and twelve hair ends in the lives' order; measured on the clip when it lands
export const FLOAT = { at: 2.0, track: [[0, [0.555, 0.18], [0.297, 0.894]], [2.0, [0.588, 0.204], [0.266, 0.769]], [5.0, [0.623, 0.333], [0.259, 0.597]]], center: [0.59, 0.20], ends: [[0.31, 0.22], [0.344, 0.111], [0.4375, 0.037], [0.542, 0.019], [0.667, 0.015], [0.771, 0.056], [0.854, 0.148], [0.896, 0.278], [0.896, 0.426], [0.865, 0.556], [0.823, 0.667], [0.75, 0.74]] };   // measured on float_top frame 49
export const SHOTS = S;

// ------------------------------------------------------------------ resolve bar/beat to song time
// T: a timing api with beat(bar, beat) and duration (fable/take2/src/timing.js, or the node shim in tools/shots.mjs)
export function resolveShots(T) {
  const at = (v) => (v === 'end' ? T.duration : v[0] === 1 && v[1] === 1 ? 0 : T.beat(v[0], v[1]));
  const out = SHOTS.map((s, i) => ({ ...s, i, t0: at(s.from), t1: at(s.to) }));
  for (let i = 1; i < out.length; i++) if (Math.abs(out[i].t0 - out[i - 1].t1) > 1e-6) throw new Error(`shots: gap or overlap between ${out[i - 1].id} and ${out[i].id}`);
  for (const s of out) if (!(s.t1 > s.t0)) throw new Error(`shots: ${s.id} has no length`);
  return out;
}
