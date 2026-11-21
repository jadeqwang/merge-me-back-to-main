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
// film v2: the moving stance clips (plates_v2 wiring: settled from bow 1.5, horse 2.0, drop2 2.25 s; stance_drop_v2 not delivered yet, its
// settle point is a guess of 1.5 s until its wiring row exists). clip0 = settle - 0.11 s, so she settles about a quarter beat after the
// bar line and holds, moving, through the beat
const STANCE_V2 = [['stance_bow_v2', 1.5], ['stance_horse_v2', 2.0], ['stance_drop_v2', 1.0], ['stance_drop2_v2', 2.25]];   // drop_v2: use 0.5-5.0, holds from 1.0
// beat 3 of b77-80 (film v2): four close inserts instead of the stances (Jade: mix it up with writing poems and playing instruments).
// clip0 measured on the clips: the piano chord lands at about 0.85-1.0 s, the guitar strum crosses the strings at about 1.0 s
const INSERT = [['ins_violin', 'violin: the bow arm, a down-bow, the wrist leading', { clip0: 1.0, speed: 1.25, next: { id: 'ins_violin_v3', opt: { clip0: 0.0, speed: 1.25 } } }],   // take 2 (warm wood violin): use 1.0-4.75; film v3: ins_violin_v3 (staged with a body) down-bow 0.0-2.25 (plates_v3), timing to check in item 7
  ['ins_poem', 'a pen finishing a line in a notebook, the hand lifts', { clip0: 3.4 }],
  ['ins_piano', 'both hands land a chord', { clip0: 0.82 }], ['ins_guitar', 'a strum on an acoustic guitar (the RNA band)', { clip0: 0.95 }]];

// film v3: wushu_v3 (her face reads as her) replaces wushu_v2 wherever v2 is used, when it lands; same composition and timing (punch ~1.0 s)
const WUSHU_IDS = ['wushu_v3', 'wushu_v2'];
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
P(5, 7, 'root_face', 'missing', "The child's face in profile, lit by the frost, watching. First face. Counter 8, 16.", { ov: ['counter'], row: 'b5-6', opt: { counterSide: 'left', clip0: 0, clip1: 3.0,
  next: { id: 'root_face_v2', opt: { clip0: 0, clip1: 3.5, push: 0 } } } });   // v2 (plates_v2 wiring): 0-3.5 s keeps both blinks (0.25, 3.0) and the fog breath (1.25-2.5); no push   // clip: first 3 s (a blink at 3.2-3.4, a late push crops the ponytail)
// b7-8: the root clip from 2.0 s (the frost has grown) slightly slowed, pulling back; twelve frost tips (plate fractions, measured on the
// clip's frame 84) light up in the lives' lane colours one per half beat from beat 2 of b7
P(7, 9, 'root', 'exists', 'Pull back: the frost tree fills the pane; its tips take lane colours one by one. Counter 32, 64.',
  { code: 'P+C', ov: ['counter'], opt: { clip0: 2.0, speed: 0.85, zoom0: 1.18, push: -0.18,
    tips: [[0.43, 0.10], [0.672, 0.093], [0.312, 0.40], [0.53, 0.07], [0.35, 0.55], [0.77, 0.27], [0.36, 0.25], [0.46, 0.62], [0.60, 0.11], [0.40, 0.58], [0.56, 0.58], [0.335, 0.33]],
    // film v6 A1: the violet light (life 11) is the 4th to light (slot 3, beat 2.5 of b7) and the only one that does not stay: after `hold`
    // beats it drifts to the pane's left edge and out (`to`, frame fractions) over `drift` beats; the others keep glowing
    vioTip: { i: 11, slot: 3, hold: 1.0, drift: 2.6, to: [-0.08, 0.22] } }, row: 'b7-8' });

// ------------------------------------------------------------------ Intro B: bars 9-16 (kick hit, rolling bass)
section('intro_b');
// Step 3: no counter from b9 (the v7 tree's light count cannot be matched to a doubling number; Jade's rule: drop it after 64)
// film v6 A1: one violet lane leaves the canopy's right end and runs out of frame alone, further than any other (src/film.js vlane):
// anchor = the canopy's rightmost tip per song time (frame fractions, measured on the raw v7 frames 14.5-24.4 s); the lane grows from
// `grow[0]` to `grow[1]` s with a light at its head that leaves the frame; afterwards a quiet line out of frame. No label.
const VLANE = { anchor: [[14.2, 0.81, 0.44], [17.0, 0.91, 0.57], [19.2, 0.91, 0.60], [22.3, 0.90, 0.62], [24.7, 0.89, 0.62]], grow: [14.6, 17.6], out: [1.08, 0.18] };
V(9, 10, 'seq 02', 'Match cut, frost tree to tree of light seen from above. Title MERGE. Counter doubles each bar to 1,024 by b15.', { code: 'V7+C', ov: ['title:MERGE'], row: 'b9', opt: { vlane: VLANE } });
const FL = [['piano', 11], ['wushu', 12], ['ames', 13], ['violet', 14]];
V(10, [11, 3], 'seq 02', 'The tree grows east.', { row: 'b10-14', opt: { vlane: VLANE } });
FL.forEach(([id, b], i) => {
  P([b, 3], [b, 4], id, 'exists', `One-beat flash of a life plate (${id === 'violet' ? 'the dish' : id === 'ames' ? 'wind tunnel' : id}): what the lights are.`, { opt: { clip0: 1.2, push: 0.02, ...(id === 'wushu' ? { next: [{ id: 'wushu_v3', opt: { clip0: 1.35, clip1: 1.65 } }, { id: 'wushu_v2', opt: { clip0: 1.0, clip1: 1.3 } }] } : {}) }, row: 'b10-14' });   // wushu_v2: the landed punch
  if (i < 3) V([b, 4], [b + 1, 3], 'seq 02', 'The tree grows east.', { row: 'b10-14', opt: { vlane: VLANE } });
});
V([14, 4], 15, 'seq 02', 'The tree grows east.', { row: 'b10-14', opt: { vlane: VLANE } });
V(15, [16, 3], 'seq 02', 'Swoop down the trunk to ground level.', { row: 'b15-16' });
P([16, 3], 17, 'main_palm', 'missing', "Adult Jade from behind at the root, palm raised exactly like the child's.", { row: 'b15-16', opt: { clip0: 1.0, clip1: 3.0 } });   // clip: the tree grows fastest at about 1-3 s

// ------------------------------------------------------------------ Verse 1: bars 17-32
section('verse1');
// Step 2 (bars 17-56): every plate shot picks up its plate when work_fable/take2/plates/<id>/ is complete (meta.json and its last
// frame, or REAL); until then it is a card. Lyric places (lyr) and doorways (door) were measured on the first-frame stills
// (work_fable/take2/stills/) and on the clips that had landed; see notes/compositor.md "Step 2".
P(17, 18, 'main_face', 'missing', 'Close three-quarter on her face, eyes open, calm.', { row: 'b17', opt: { lyr: { x0: 0.05, x1: 0.47, align: 'left' },
  next: { id: 'main_face_v2', opt: { songLock: true, push: 0, lag: 0.34, lagQ: 'lagface' } } } });   // film v4: lag +340 ms measured (plates_v4 wiring; ?lagface=<ms> overrides)   // film v3: main_face_v2 sings "I split myself a thousand ways", song-locked (meta t0_song)
P(18, 19, 'main_split', 'missing', 'She steps apart into two, then four (Banach-Tarski: each keeps a whole body). The copies\' bands take lane colours.',
  { row: 'b18', opt: { clip0: 0.5, clip1: 3.2, push: 0.02 } });   // film v3: main_split_v2 was rejected (plates_v3): no hook, bar 18 stays main_split   // director: one figure to 0.7 s, two by 1.0, four apart by 2.8
V(19, 20, 'seq 01', 'From above and behind: eight, sixteen, more run out along their lanes.',
  { code: 'V7', alt: 'K runners + C', row: 'b19', opt: { v7crop: [0.3, 0.0, 0.7, 0.7] } });   // v7's own road lyric (I SPLIT MYSELF...) runs along the bottom left: cropped out
const CROSS = [
  ['cross_wushu', 'Wushu (woodblock)', 'wushu', { reach: 3.5, door: [0.41, 0.125, 0.582, 0.66] }],   // clip: whole figure inside the door outline from 2.25 s
  ['cross_wetlab', 'neuron lab (ink)', 'wetlab', { reach: 3.0, door: [0.29, 0.10, 0.44, 0.74] }],   // measured on the clip: front half through the door at 3.0 s
  ['cross_ames', 'wind tunnel (painting)', 'ames', { reach: 2.7, door: [0.20, 0.09, 0.43, 0.80] }],   // clip: half through at 2.75 s, in at 3.25 s
  ['cross_hackerhouses', 'hacker houses (pixel)', 'chezjj', { reach: 2.7, door: [0.20, 0.07, 0.38, 0.50] }],   // clip: at the door's edge 2.25 s, inside and glowing at 3.0 s
];
// film v4 item 1 (Jade: "green and blue's sneakers slip on the floor but others don't"): b21 (wetlab, green) uses a derived plate rebuilt
// by tools/recross.py from the plate's own frames (nothing generated): her figure separated from the doorway and moved at a constant
// extra speed (4.0 plate px per clip frame) so her standing toe keeps its place against the doorway (the floor is black: the doorway is
// the only floor mark), reaching her own place at `reach`, where the wipe starts. Same timing and doorway; the plate's own frames from
// reach on. b22 (ames, blue): its standing toe measures planted against the doorway (only the heel lifts): not rebuilt (notes).
const CROSS_V4 = { cross_wetlab: 'cross_wetlab_v4' };
CROSS.forEach(([id, m, life, c], i) =>
  P(20 + i, 21 + i, id, 'missing', `Crossing ${i + 1} of 4: a cel-drawn branch-Jade runs her lane toward a doorway of light; as she crosses, the whole picture turns into her medium: ${m}.`,
    { code: 'P+C', row: 'b20-23', opt: { push: 0, cross: { life, at: 0.58, end: 0.84, maxSpeed: 1.5, life0: 1.0, ...c }, lyr: { x0: 0.04, x1: 0.5, align: 'left' },
      ...(CROSS_V4[id] ? { next: { id: CROSS_V4[id], opt: {} } } : {}) } }));
P(24, 25, 'cross_violet', 'missing', 'The fifth road has no doorway: the violet one runs out into engraved dark, and she keeps going.', { row: 'b24' });
P(25, 26, 'main_light', 'missing', 'Close on cupped hands; a light kindles.', { row: 'b25', opt: { clip0: 2.0, clip1: 4.5, lyr: { y: 'top' },
  next: [{ id: 'main_light_v3', opt: { clip0: 1.6, clip1: 3.35, push: 0 } }, { id: 'main_light_v2', opt: { clip0: 0.0, clip1: 1.75, push: 0 } }] } });   // film v4: main_light_v3 (one slow opening, never closes): 1.6-3.35 (plates_v4)   // film v3: main_light_v2 take 2 (the hands move in waves; locked camera): 0.0-1.75 (plates_v3)   // the light appears from about 2.2 s (director: use 2.0-4.5)
P(26, 27, 'main_release', 'missing', 'She opens her hands; the light leaves along the lane.',
  { code: 'P+C', row: 'b26', opt: { lyr: { x0: 0.04, x1: 0.55, align: 'left' },
    lane: { pts: [[0, 0.425], [0.04, 0.417], [0.111, 0.399], [0.181, 0.379], [0.331, 0.338], [0.548, 0.275], [0.595, 0.265]], color: '#FF3D7F', lyric: 3, cap: 46, endX: 0.55,   // film v3: the lane carries the lyric (line 3), not the piano message
      track: [[0, 0.595], [0.375, 0.548], [0.5, 0.331], [0.625, 0.181], [0.75, 0.111], [1.0, 0.064], [1.5, 0.044]] },
    // film v6 A2: a second, violet light leaves her hands just after the rose one and goes furthest: over the rose light, up and out of the
    // top-left of the frame (src/film.js vioMote; from/to/ctrl frame fractions, at = [start, out] s from the shot start)
    vioMote: { from: [0.6, 0.255], ctrl: [[0.42, 0.06], [0.12, -0.02]], to: [-0.06, 0.03], at: [0.3, 1.55] } } });   // the light's path, measured on the clip (warmest point per frame): the lane is written behind it
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
// film v6 A3: no violet runner in either chorus (she is the one who does not merge): violet's lane is gone from the row
const KIT_ROW = [['sandstorm', 0.16], ['chezjj', 0.44], ['wetlab', 0.08], ['home', 0.36], ['piano', 0.22], ['violin', 0.47],
  ['band', 0.12], ['ames', 0.33], ['poet', 0.93], ['phd', 0.80], ['wushu', 0.50], ['main', 0.68]].map(([id, x]) => ({ id, x }));
shot(43, 44, 'K+C', 'kit', 'runner_kit', 'missing', 'Side-on: the twelve run in parallel on their lanes, each drawn in her own medium, main in front.',
  { row: 'b43', opt: { lyr: { y: 'top', top: 0.035, x0: 0.03, x1: 0.48, align: 'left' }, kit: { mode: 'row', lanes: KIT_ROW } } });
P(44, 45, 'hero_feet', 'missing', 'Low and close: her trainers strike the orange line.',
  { row: 'b44', opt: { lyr: { y: 'top', x0: 0.04, x1: 0.96, align: 'left' }, lane: { pts: [[0, 0.845], [1, 0.845]], color: '#FF7A1A', text: 'main', cap: 34, scroll: -14 } } });   // written just under the plate's own line (y 0.80-0.81 in the clip)
// film v3 item 11 (Jade's easter egg from Rewind): one extra written lane, `banach–tarski`, quiet gold, joining the braid where the lanes
// meet main's band; a drawn curve from the junction out to the right edge, over the dark ground clear of the slab (src/film.js egg())
V(45, 46, '1:16-1:20', 'From above: the lanes braid into one. Slab type.', { row: 'b45', opt: { egg: { text: 'banach–tarski', color: '#FFB020', alpha: 0.55, cap: 26, pts: [[0.66, 0.15], [0.74, 0.30], [0.88, 0.37], [1.03, 0.41]], grow: 0.5, merge: [0, 0.3], scroll: 4 } } });
// fusions on the measured half beats (a fusion lands ON its beat): [beat from the shot start, lane a, lane b]; 8 -> 4 at beats 0.5, 1.5,
// 2.5, 3.5 of b46, 4 -> 2 at 4.5 and 6.5 (b47 beats 1.5 and 3.5). Each pair comes to the front (src/kit.js 'fuse'), large, so the
// half-and-half beat reads; slots = the two front x places, alternating.
shot(46, 48, 'K+C', 'kit', 'runner_fuse', 'missing', 'Runners fuse in pairs, eight to four to two. Where pencil-Jade and gouache-Jade merge, the new runner is half and half for a beat, then whole.',
  { row: 'b46-47', opt: { lyr: { y: 'top', top: 0.035, x0: 0.03, x1: 0.46, align: 'left' }, kit: { mode: 'fuse', slots: [0.64, 0.86],
    lanes: [['violin', 0.30], ['piano', 0.52], ['wushu', 0.20], ['wetlab', 0.66], ['phd', 0.36], ['poet', 0.80], ['ames', 0.48], ['band', 0.10]].map(([id, x]) => ({ id, x })),
    events: [[0.5, 0, 1], [1.5, 2, 3], [2.5, 4, 5], [3.5, 6, 7], [4.5, 0, 2], [6.5, 4, 6]] } } });
// film v6 A3: bar 48 (between "becomes the one" and "Fold", ~1:22.5) is a cut-away to her at the dish, writing, not running: the plates
// agent's vio_cutaway when it lands, else vio_write2 (she writes in the notebook on the dish rim) from clip 0.4. runner_one is not shown.
P(48, 49, 'vio_write2', 'exists', 'Cut-away: the violet branch at the dish, writing, not running.', { row: 'b48', opt: { clip0: 0.4, push: 0.02, lyr: { y: 'top', top: 0.04, x0: 0.03, x1: 0.62, align: 'left', tail: 3 },   // the line's held end only ("becomes the one"), fading over the sky
  next: { id: ['vio_cutaway_v2', 'vio_cutaway'], opt: { clip0: 0.5, clip1: 2.5, push: 0.02 } } } });   // film v7: _v2 = one pencil in the bun   // plates_v6: one bar of writing, clip 0.5-2.5
// b49-50 (film v2, src/mapfold.js): the fold made literal. The twelve life plates as the pre-chorus's 4x3 grid on one paper sheet; it folds
// like a map, every fold a valley fold toward the lens, landing on its beat: b49.2 column 4 onto 3, b49.3 column 1 onto 2, b49.4 the
// column-2 stack onto 3, b50.1 row 3 onto 2, b50.2 row 1 onto 2. The undersides are the backs of the pictures (captioned with branch and
// commit message); the last flap's underside is her (fold_chest frame 0). The last panel grows to the full frame by the b51 cut, where
// fold_chest takes over from clip 0. folds: [beat from the shot start, axis, crease after column/row k, moving side]. Grid cells 420 px
// (the pre-chorus's were 470): the two-row slab FOLD ME IN / AGAIN sits under the sheet. (Replaces fold_reach.)
const MAPFOLD = { code: 'mapfold', lives: LIFE, her: 'fold_chest', grid: { cw: 420, g: 10, y0: 22 }, clip0: 0.3, speed: 0.6, D: 1500, dur: 0.55, drift: 0.9, fit: [0.94, 0.9], zmax: 3, viewY: 0.47,   // film v2 fix: the folded stack stays big (0.9 H tall), the slab over its lower edge
 
  folds: [[1, 'x', 2, 'hi'], [2, 'x', 0, 'lo'], [3, 'x', 1, 'lo'], [4, 'y', 1, 'hi'], [5, 'y', 0, 'lo']], final: [2, 1], grow: [5.6, 8] };
shot(49, 51, 'P+C', 'code', 'mapfold', 'missing', 'The sheet of twelve lives folds like a map, one crease per beat, down to one panel: her, hands crossed at her chest.',
  { row: 'b49-50', opt: { ...MAPFOLD, lyr: { x0: 0.03, x1: 0.97, align: 'left' } } });
P(51, 53, 'fold_chest', 'missing', 'Hands crossed at her chest; a fan of twelve afterimages, each in a medium, folds into her one per beat.', { code: 'P+K', row: 'b51-52', opt: { lyr: { x0: 0.03, x1: 0.97, align: 'left' },   // one row along the bottom (her trousers): clear of the fan, face and hands
    fan: { matte: '/work_fable/take2/kit/fold_chest', pivot: [0.5, 0.98], lives: ['piano', 'violin', 'wushu', 'wetlab', 'phd', 'poet', 'ames', 'band', 'chezjj', 'sandstorm', 'home'] } } });   // film v6: eleven, violet does not fold in
P(53, 54, 'look_back', 'missing', "She stops and looks back over her shoulder: the same look as the lives'.", { row: 'b53', opt: { clip0: 0, lyr: { x0: 0.03, x1: 0.5, align: 'left' } } });
// b54-55 (film v2): the twelve worlds as small lit windows on the horizon (src/film.js windows()): a fixed horizon band, measured on the raw
// v7 frames (the roads do not survive the paper pass well enough to track); xs = window centres in life order (frame fractions), clear of
// her figure (x 0.64-0.80); locks = beats from the shot start when each commit node locks on (one per beat in bar 54, two per beat in bar
// 55, so all twelve lock in the two bars, as the b130-131 folds do)
const NIGHT_WIN = { lives: LIFE, h: 0.042, zoom: 1.7, horizon: [[92.2, 0.4602], [95.8, 0.4324]],
  xs: [0.04, 0.105, 0.17, 0.235, 0.3, 0.365, 0.43, 0.495, 0.56, 0.845, 0.907, 0.969],
  locks: [0, 1, 2, 3, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5] };
V(54, 56, 'night world', 'Wide: every road still glows to the horizon; along them the twelve worlds as small lit windows; commit nodes lock on, one per beat.',
  { code: 'V7+P+C', row: 'b54-55', opt: { lyr: { x0: 0.03, x1: 0.6, align: 'left', tail: 4 }, windows: NIGHT_WIN } });   // lyric: only "lived can come undone" (the line's first words were set on the two shots before), so the slab stays under the horizon
P(56, 57, 'main_back_wide', 'missing', 'Her from behind before the whole lit continent. Slow pull-out.', { row: 'b56', opt: { clip0: 0, clip1: 3.0, push: 0, lyr: { y: 'top', top: 0.025, tail: 1 },
  next: { id: 'main_back_wide_v2', opt: {} } } });   // film v6 (Jade): main_back_wide_v2, the patch on her LEFT arm; timing from the plates_v6 wiring row   // the whole pull-out (close on the jacket back to the wide by 3 s); only the held UNDONE, one row at the very top, above her head

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
// film v6 A4: the real Jade once, early: like_sing0 (local only, song-locked like like_sing1) sings "Merge... and return..." (109.31-111.72)
// from b63 beat 4 to b65. Wired ONLY when the director says her likeness passed on stills: set LIKE0_ON = true. Off: b63-64 as before
// (the float_top pulses and float_hand). On: b63 ends on beat 4 and one shot code 'L' plays like_sing0 (likeness=0: the card).
const LIKE0_ON = typeof location !== 'undefined' && new URLSearchParams(location.search).get('like0') === '1';   // off unless ?like0=1 (Jade decides)
P(63, LIKE0_ON ? [63, 4] : 64, 'float_top', 'missing', 'Pulses of light come home along every strand.', { code: 'C+P', row: 'b63-64', opt: { clip0: 3.0, strands: { mode: 'pulses' } } });
if (LIKE0_ON) shot([63, 4], 65, 'L', 'plate', 'like_sing0', 'missing', 'The real Jade, once, early: she sings "Merge... and return...", daylight (the Orbital relight trace; song-locked).', { row: 'b63-64', opt: { songLock: true, push: 0, lyr: { x0: 0.03, x1: 0.4, align: 'left' } } });
else P(64, 65, 'float_hand', 'missing', 'Her hand opens on the water as one arrives.', { row: 'b63-64', opt: { clip0: 1.0, clip1: 3.5, lyr: { x0: 0.03, x1: 0.5, align: 'left' },
  next: { id: 'float_hand_v2', opt: { clip0: 0.5, clip1: 2.6 } } } });   // film v3: the light settles in the palm at clip 1.5 s = on beat 3 of b64 (0.5 + 2 beats x 1.21); fingers closing 2.0-2.6 at the cut   // clip: the light reaches her palm at about 2.5 s, a loose fist by 3.5

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
  shot(73 + k, [73 + k, 2], 'S', 'plate', STANCE[k][0], 'missing', `Impact frame on the bar line: cel Jade in a long-fist stance (${STANCE[k][1]}), rim-lit, blue hour.`, { row: 'b73-76', opt: { push: 0.04, white: true,
    next: { id: STANCE_V2[k][0], opt: { clip0: STANCE_V2[k][1] - 0.11, push: 0.02 } } } });
  shot([73 + k, 2], 74 + k, 'C', 'code', 'gitlog', 'missing', `git log --graph racing on the beat, her real commit messages: ${2 ** (k + 1)} rows per beat.`, { row: 'b73-76', opt: { code: 'gitlog', rate: 2 ** (k + 1), bar: k } });
}
// film v6 A5: 2:12 (b77), the first pencil figure: a pencil tip leads the first hatch strokes. Until pencil_lead lands, the v7 formation is
// revealed over its first beat by the hatch wipe with a gold pencil point at the head of the newest stroke; when it lands, b77 beat 1 is
// the plate (her hand and pencil, gold on black; the strokes are code, src/film.js pencilStrokes) and the formation follows on beat 2.
// plates_v6 wiring: pencil_lead 0-5.0 (hand and pencil travel up-left, the left of the frame empty paper); tip_track.json per frame. One
// beat is short: clip 0.3-1.5 (2.8x), the hatching laid by the tip in code (film.js pencilStrokes); the formation then enters on beat 2
// through the hatch wipe with the pen point.
const PENCIL_LEAD = { id: 'pencil_lead', kind: 'plate', opt: { clip0: 0.3, clip1: 1.5, push: 0.02, hatch: null, pencil: { trackUrl: '/work_fable/take2/plates/pencil_lead/tip_track.json', from: 0.3, len: 80, step: 4 } } };
for (let k = 0; k < 4; k++) {
  if (k === 0) { V(77, [77, 2], 'seq 08', 'The first pencil figure: a pencil tip leads the first hatch strokes, gold on black.', { row: 'b77-80', opt: { hatch: { frames: 13, seed: 77, pen: true }, next: PENCIL_LEAD } });
    V([77, 2], [77, 3], 'seq 08', 'Frontal formation: she forks on every kick (bar 1 of 4, toward 256); enters through the hatch wipe after the pencil.', { row: 'b77-80', opt: { hatch: { frames: 9, seed: 78, pen: true } } }); }
  else V(77 + k, [77 + k, 3], 'seq 08', `Frontal formation: she forks on every kick (bar ${k + 1} of 4, toward 256).`, { row: 'b77-80' });
  shot([77 + k, 3], [77 + k, 4], 'S', 'plate', INSERT[k][0], 'missing', `Insert on beat 3: ${INSERT[k][1]}.`, { row: 'b77-80', opt: { push: 0.02, ...INSERT[k][2] } });
  V([77 + k, 4], 78 + k, 'seq 08', 'Frontal formation, after the stance frame.', { row: 'b77-80' });
}
// b81-84: the orchestra of Jades (v7 seq 08 variant, fable/take2/notes/orchestra.md revision 2), eight shots on the bar and beat 3,
// frames from their own folder (opt.v7dir); paper: the orchestra look (opt.paperLook, src/film.js PAPER_LOOKS; ?orchpaper=light|solid|default).
// Shot 8 holds one beat into bar 85 to show the hit (the frames run to bar 85 beat 2); seq 09 starts on beat 2.
const ORCH = ['above', 'side_low_violins', 'above_behind', 'timpani', 'conductor_view', 'basses_side', 'high_wide', 'last_wide'];
// film v2: the eight shots use the cel plates orch_1..8 raw (no paper pass), time-scaled per notes/orchestra.md revision 3 wiring so the
// strokes land on beats: [clip0, speed]. Shot 1 stays the 3D arrival (solid paper look) and dissolves over 5 frames at 139.60 into orch_1
// from 1.0 s (opt.tail); shot 8 is orch_8 to b84 beat 3.5, then the 3D for the rise and the bar-85 hit.
// film v3 (Jade: "go back to the hatched 3D"): the plates are OFF by default (film.js ORCH_V7); ?orch=plates turns film v2's route back on.
const ORCH_PLATE = [null, [0.65, 1.45], [1.5, 1.2], [1.55, 1.25], [0.4, 0.93], [1.8, 1.35], [0.3, 1], [0.3, 1]];
const OV = { v7dir: '/work_fable/take2/v7/orchestra', paperLook: 'orch' };
for (let k = 0; k < 8; k++) { const b = 81 + (k >> 1), a = k % 2 ? [b, 3] : b, e = k === 7 ? [84, 3.5] : k % 2 ? b + 1 : [b, 3];
  const o = k === 0 ? { ...OV, tail: { id: 'orch_1', at: 139.60, clip0: 1.0, frames: 5 } }
    : { ...OV, next: { id: 'orch_' + (k + 1), kind: 'plate', flag: 'orch', opt: { clip0: ORCH_PLATE[k][0], speed: ORCH_PLATE[k][1], push: 0 } } };
  V(a, e, 'orchestra ' + ORCH[k], `The orchestra of Jades (${k + 1} of 8): ${ORCH[k].replace(/_/g, ' ')}.`, { row: 'b81-84', opt: o }); }
V([84, 3.5], [85, 2], 'orchestra rise', 'The orchestra of Jades (8 of 8, end): the rise and the bar-85 hit (3D).', { row: 'b81-84', opt: { ...OV, seedPrev: true } });   // film v3: shot 8's paper seed, so the 3D runs on through the split without a change of hatching
V([85, 2], 87, 'seq 09', 'Bass out in b86, snare build: all drop into a low stance; the view skims east.', { row: 'b85-88' });
for (let k = 0; k < 12; k++) { const half = k >= 4, bar = half ? 88 : 87, beat = half ? 1 + (k - 4) / 2 : 1 + k;
  const nk = k + 1, to = nk === 12 ? 89 : nk >= 4 ? [88, 1 + (nk - 4) / 2] : [87, 1 + nk];
  V([bar, beat], to, 'seq 09', `${half ? 'Two cuts per beat' : 'One cut per beat'}: a three-frame flash of the ${LIFE[k]} plate, then the skim east${k === 11 ? '; the sun\'s rim' : ''}.`,
    { code: 'V7+P', ov: [`flash:${LIFE[k]}`], opt: { flash: { id: LIFE[k], frames: 3 } }, row: 'b85-88' }); }

// ------------------------------------------------------------------ Drop: bars 89-104 (night to sunrise, full colour)
section('drop');
V(89, 90, '2:32', 'Butterfly kick at its apex against the huge sun.', { row: 'b89' });
// film v2: the inserts as one sentence in motion (v2 ids: 1 fist, 2 palm, 3 eyes, 4 hair whip, 5 landing). [fallback (v1 still), v2 clip,
// what, clip map]; ranges from plates_v2 wiring (drop_hero_1_v2 not delivered: the v1 fist still, v1 drop_hero_2, until it lands)
const DROP = [['drop_hero_2', 'drop_hero_1_v2', 'the fist closes', { clip0: 2.0, clip1: 3.6 }],   // fist: curling 2.0, closed by 3.5 (measured): closed at the end of the two beats
  ['drop_hero_3', 'drop_hero_2_v2', 'the open palm rises until the sun sits behind it', { clip0: 1.3, clip1: 2.9 }],
  ['drop_hero_1', 'drop_hero_3_v2', 'her eyes open, the sun in them', { clip0: 0.7, clip1: 2.2 }]];
for (let k = 0; k < 3; k++) {
  V(90 + k, [90 + k, 3], 'seq 10', 'The unison phrase, low and wide, the thousand in silhouette.', { row: 'b90-92' });
  const D = DROP[k]; shot([90 + k, 3], 91 + k, 'S', 'plate', D[0], 'missing', `Two-beat close insert ${k + 1} of 3: ${D[2]}, lit gold.`, { row: 'b90-92', opt: { push: 0.035, white: true, next: { id: D[1], opt: { push: 0, white: false, ...D[3] } } } });
}
// film v6 A5 (Jade: "maybe the reason the orchestra and wushu agent swarms are drawn in pencil is because she's drawing them?"): the MAIN
// spelling (b94-b99) is cut to about half: b94-96 become mostly the lives in motion in their own mediums, 1 beat each (2 for the first),
// a face or hands in every one, each entering through a pencil-hatch wipe (src/film.js hatchIn: gold hatch strokes on black paper reveal
// the picture, so they belong to the drawing). The v7 crowd keeps a beat or two in each bar; MAIN holds whole in b97-99.
// DROP_LIFE: [from, to, plate id, clip0, why]. Proof plates are each life's clip (her face); clip0 well before any look-back (turn_t 2.6+).
const HATCH = { frames: 6, seed: 0 };
const DROP_LIFE = [
  [[93, 3], 94, 'piano', 1.0, 'piano: her at the keys'], [[94, 3], [94, 4], 'violin', 1.0, 'violin: her playing'], [[94, 4], 95, 'wushu', 1.2, 'wushu: the punch'],
  [95, [95, 2], 'wetlab', 1.0, 'biology: her at the bench'], [[95, 3], [95, 4], 'ins_piano', 0.82, 'piano: both hands land a chord'], [[95, 4], 96, 'phd', 1.0, 'phd: her at the screen'],
  [96, [96, 2], 'poet', 1.0, 'poet: her writing'], [[96, 2], [96, 3], 'ames', 1.0, 'ames: her in the wind tunnel'], [[96, 4], 97, 'band', 1.0, 'rna-band: her playing'],
];
// the v7 beats between them: [from, to, label]
const DROP_V7 = [[93, [93, 3], 'Travelling phrases.'], [94, [94, 3], 'The close line of copies: MAIN forms.'], [[95, 2], [95, 3], 'Orbit: MAIN.'], [[96, 3], [96, 4], 'MAIN.']];
{ const all = [...DROP_LIFE.map((r) => ({ k: 'L', r })), ...DROP_V7.map((r) => ({ k: 'V', r }))].sort((a, b) => (a.r[0][0] || a.r[0]) - (b.r[0][0] || b.r[0]) || ((a.r[0][1] || 1) - (b.r[0][1] || 1)));
  for (const { k, r } of all) {
    if (k === 'V') V(r[0], r[1], '2:52', r[2] + ' (film v6: cut to its v7 beats)', { row: 'b93-96' });
    else shot(r[0], r[1], 'S', 'plate', r[2], 'exists', `Life insert in its own medium (${r[4]}), entering through a pencil-hatch wipe.`, { row: 'b93-96', opt: { clip0: r[3], push: 0.03, hatch: { ...HATCH, seed: r[2].length * 7 + (r[0][0] || r[0]) } } }); } }
// film v6 A5: one more hand-and-pencil insert inside the drop: pencil_draw (her hand and pencil, gold strokes on black paper; the strokes are
// code) on the first beat of b97 when it lands; until then the v7 group fall plays whole
V(97, [97, 2], '2:44', 'The group fall, from her real set.', { row: 'b97-99', opt: { next: { id: 'pencil_draw', kind: 'plate', opt: { clip0: 0.5, speed: 2, push: 0.02, pencil: { trackUrl: '/work_fable/take2/plates/pencil_draw/tip_track.json', from: 0.5, len: 60, step: 4 } } } } });   // plates_v6: tip moves little (x 0.42-0.50); the hatching is laid in code
V([97, 2], 98, '2:44', 'The group fall, from her real set.', { row: 'b97-99' });
V(98, 100, '2:44', 'From above the bodies spell MAIN; hold; they rise as one.', { row: 'b97-99' });
// the wordless "ooh" (vocal stems 172.54-180.28) is sung, not shown: film v2 draws no type for it (Jade: lyrics on screen are for words)
// film v2: drop_face_v2 holds the whole bar, song-locked (meta t0_song 171.8: the mouth opens on the "ooh" at 172.54); no lyric
P(100, 101, 'drop_face', 'missing', 'Close: her face in the sun, wind in her hair, singing the wordless "ooh" (172.5).', { row: 'b100', opt: { next: { id: 'drop_face_v2', opt: { songLock: true, push: 0 } } } });
V(101, [101, 3], '2:57', 'Last phrase.', { row: 'b101-103' });
// film v6 A5: the cut rate rises into the end of the drop: two 1-beat lives in b101, two half-beat ones in b103, four in the last two beats of b104
shot([101, 3], [101, 4], 'S', 'plate', 'chezjj', 'exists', 'Life insert (hacker houses: her at the laptop), pencil-hatch wipe.', { row: 'b101-103', opt: { clip0: 1.0, push: 0.03, hatch: { ...HATCH, seed: 31 } } });
shot([101, 4], 102, 'S', 'plate', 'sandstorm', 'exists', 'Life insert (open source: her at the lectern), pencil-hatch wipe.', { row: 'b101-103', opt: { clip0: 1.0, push: 0.03, hatch: { ...HATCH, seed: 37 } } });
shot(102, [102, 3], 'S', 'plate', 'drop_hero_4', 'missing', 'Insert: her hair and jacket whip through the turn, lit gold.', { row: 'b101-103', opt: { push: 0.035, white: true, next: { id: 'drop_hero_4_v2', opt: { push: 0, white: false, clip0: 1.2, speed: 1.5 } } } });
V([102, 3], 103, '2:58', 'Tornado kick.', { row: 'b101-103' });
shot(103, [103, 1.5], 'S', 'plate', 'home', 'exists', 'Life insert (parenthood: her with the kids, from behind them), half a beat, pencil-hatch wipe.', { row: 'b101-103', opt: { clip0: 1.0, push: 0.03, hatch: { frames: 4, seed: 41 } } });
shot([103, 1.5], [103, 2], 'S', 'plate', 'ins_guitar', 'exists', 'Life insert (rna-band: the strum), half a beat, pencil-hatch wipe.', { row: 'b101-103', opt: { clip0: 0.95, push: 0.03, hatch: { frames: 4, seed: 43 } } });
V([103, 2], [103, 3], '2:58', 'Tornado kick, landing.', { row: 'b101-103' });
shot([103, 3], 104, 'S', 'plate', 'drop_hero_5', 'missing', 'Insert: the landing, dust rising gold.', { row: 'b101-103', opt: { push: 0.035, white: true, next: [{ id: 'drop_hero_5_v3', opt: { push: 0, clip0: 0.62 } }, { id: 'drop_hero_5_v2', opt: { push: 0, clip0: 0.05 } }] } });   // v3 (plates_v3): feet strike at 0.67 s, so it lands on the cut with the flash   // v2: feet touch down at about 0.1 s: on the cut, with the white flash
V(104, [104, 3], '2:59', '1,024 salute the sun.', { row: 'b104' });
[['ins_violin_v3', 0.0, 'violin: the down-bow'], ['violin', 1.3, 'violin: her face'], ['wushu', 1.4, 'wushu: the punch lands'], ['ins_poem', 3.4, 'poet: the pen lifts']].forEach(([id, c0, why], k) =>
  shot([104, 3 + k / 2], k === 3 ? 105 : [104, 3.5 + k / 2], 'S', 'plate', id, 'exists', `Life insert (${why}), half a beat, pencil-hatch wipe. Cut to night on b105.`, { row: 'b104', opt: { clip0: c0, push: 0.03, hatch: { frames: 4, seed: 50 + k } } }));

// ------------------------------------------------------------------ Verse 2: bars 105-120 (scratchboard, white on black, violet the only colour)
section('verse2');
// lyrics in the empty sky (cream); lane = the violet branch written sparse (merge 0) on the plate's violet line
const VIO = '#9B6BFF';
// film v3: vio_wide's feet and own violet road per clip time (tools/track_road.py vio_wide 3): [clip s, lead foot x, foot y, road a, road b, rear foot x]
// vio_wide_v2 (she runs, slowing): tools/track_road.py vio_wide_v2 3 (feet, and the road fitted on violet pixels away from her). The plates
// agent's track.json line (y = 0.1288 x + 510.3 px) sits above the painted line on the left of frame: not used
const ROAD_VW2 = [[0.0,0.7445,0.8828,0.7506,0.1842,0.7789],[0.25,0.7244,0.8803,0.7505,0.1843,0.7683],[0.5,0.6972,0.8778,0.7505,0.1844,0.7406],[0.75,0.6728,0.8731,0.7504,0.1845,0.717],[1.0,0.6478,0.8714,0.7503,0.1845,0.6923],[1.25,0.643,0.8686,0.7503,0.1845,0.6945],[1.5,0.6255,0.8653,0.7503,0.1846,0.6669],[1.75,0.6114,0.865,0.7503,0.1846,0.6484],[2.0,0.6114,0.8606,0.7503,0.1846,0.6459],[2.25,0.5875,0.8569,0.7503,0.1847,0.6253],[2.5,0.5678,0.8578,0.7503,0.1846,0.6038],[2.75,0.5625,0.8578,0.7503,0.1846,0.6139],[3.0,0.5484,0.8544,0.7504,0.1845,0.6034],[3.25,0.5405,0.8514,0.7505,0.1844,0.5875],[3.5,0.5273,0.8511,0.7506,0.1843,0.573],[3.75,0.5111,0.8506,0.7507,0.1842,0.5675],[4.0,0.4988,0.8486,0.7507,0.1841,0.5636],[4.25,0.4988,0.8464,0.7508,0.184,0.5505],[4.5,0.4933,0.8444,0.7509,0.1839,0.5334],[4.75,0.4805,0.8444,0.751,0.1838,0.5234],[5.0,0.4673,0.8444,0.751,0.1838,0.5227]];
const ROAD_VW = [[0.0,0.7397,0.8883,0.7486,0.1852,0.7769],[0.25,0.7111,0.8836,0.749,0.1852,0.7584],[0.5,0.6727,0.8792,0.7495,0.1853,0.7295],[0.75,0.6488,0.8778,0.7497,0.1855,0.7114],[1.0,0.6333,0.8761,0.7492,0.1863,0.707],[1.25,0.6264,0.8728,0.7489,0.1871,0.6955],[1.5,0.6147,0.87,0.7477,0.1887,0.6698],[1.75,0.5914,0.8694,0.7476,0.1893,0.6498],[2.0,0.575,0.8683,0.7481,0.1892,0.6427],[2.25,0.5656,0.8644,0.7497,0.1879,0.6309],[2.5,0.5545,0.8606,0.7502,0.1879,0.6078],[2.75,0.5334,0.8589,0.7507,0.1878,0.5911],[3.0,0.517,0.8578,0.7508,0.1882,0.587],[3.25,0.5105,0.8542,0.75,0.1896,0.5781],[3.5,0.5038,0.8508,0.7495,0.1907,0.5567],[3.75,0.4845,0.85,0.7509,0.1896,0.5388],[4.0,0.4681,0.8497,0.7521,0.189,0.5317],[4.25,0.4588,0.8467,0.7517,0.1899,0.5238],[4.5,0.4537,0.8431,0.7522,0.1898,0.5041],[4.75,0.435,0.8414,0.7531,0.1892,0.4862],[5.0,0.4147,0.8417,0.7542,0.1883,0.4791]];
P(105, 107, 'vio_wide', 'missing', 'A tiny figure on a violet lane under an engraved Milky Way. Chip: ● jade/rare-earth  ctx 97%.',
  { ov: ['chip:● jade/rare-earth  ctx 97%'], row: 'b105-106', opt: { lyr: { x0: 0.03, x1: 0.6, align: 'left' }, road: { track: ROAD_VW, color: VIO, text: 'violet', cap: 20 },
    next: [
      // film v6 A5, the reveal at 3:00 (b105): page_reveal pulls back from the black notebook page to her at the dish; the live gold crowd
      // frames (v7 at 179.4 s on, at 0.25x: the salute; it must stay before 180.37, where v7's night begins) are mapped onto the pages (film.js pageMap, page_track.json from the plates agent);
      // clip 0.3-4.6 (1.25x: the fast part 0.5-2.5, the wide from ~4.0). vio_wide's written road is not used (it replaces that shot).
      { id: 'page_reveal', opt: { clip0: 0.3, clip1: 4.6, push: 0, road: null, page: { v7: [179.4, 0.25], quadUrl: '/work_fable/take2/plates/page_reveal/page_track.json', single: 99 },
        lyr: { y: 'top', top: 0.14, x0: 0.03, x1: 0.42, align: 'left' } } },
      { id: 'vio_wide_v2', opt: { clip0: 0, clip1: 3.4, road: { track: ROAD_VW2, color: VIO, text: 'violet', cap: 20 } } }] } });   // film v3 item 4: the lane written only as far as she has got (src/film.js roadMask/roadLane). vio_wide_v2 (she runs, slowing): measure its track with tools/track_road.py and put it in place of null (a null track = no road drawn)
P(107, 108, 'vio_walk', 'missing', 'Side medium, walking.', { row: 'b107-108', opt: { lyr: { x0: 0.03, x1: 0.55, align: 'left' }, lane: { pts: [[0, 0.955], [1, 0.955]], color: VIO, text: 'violet', cap: 22, scroll: -10, under: 0.2 } } });
P(108, 109, 'vio_close', 'missing', 'Her profile, the bun and two pencils.', { row: 'b107-108', opt: { clip0: 0, lyr: { x0: 0.03, x1: 0.5, align: 'left' } } });   // clip 0-1.7 s, before the blink near 2.5 s
P(109, 111, 'vio_lookback', 'missing', 'She stops and looks back east: far off, a sliver of sunrise in full colour.', { row: 'b109-110', opt: { clip0: 0, clip1: 2.5, lyr: { y: 'top', x0: 0.42, x1: 0.97, align: 'right' } } });   // clip 0-2.5 s: the sunrise stays a far sliver
P(111, 112, 'vio_climb', 'missing', 'She climbs to the rim of the dish.', { row: 'b111-112' });
P(112, 113, 'violet', 'exists', 'She sits on the rim of the dish.', { opt: { clip0: 0.5, push: 0.02 }, row: 'b111-112' });
P(113, 114, 'vio_pencil', 'missing', 'She draws a pencil from her bun.', { row: 'b113-115', opt: { clip0: 2.3, clip1: 4.0, lyr: { x0: 0.56, x1: 0.97, align: 'right' } } });   // clip: the pencil out of the bun by 3 s, held up by 4 s (ends on it)
// b114-117 (film v2): set type in the air instead of the hand-drawn cursive (src/film.js typed()). TYPE.at = left edge and top of the block
// in FRAME fractions; px = mono font px at 1080p; beats = beat from the shot start on which each line starts typing (one per beat, the
// last two on beats 5 and 7 of the 8); from = her pencil point: a mote of violet light leaves it half a beat before each line and lands
// where that line types. Two layouts: on vio_write2 (notebook on her knee; plates_v2.md wiring: clear sky upper left x 0.02-0.30,
// y 0.05-0.50; notebook x 0.55-0.66, y 0.44-0.55) the block sits upper left under the chip; on the old vio_write (until vio_write2
// is in the plates folder) it sits top centre, ending near her raised pencil, with the dark cloud over the dish.
// vio_release2 (wiring: clip 1.0-4.4; hand x 0.57-0.68, y 0.30-0.38 at the hold; sunrise x 0.95-1.0, y 0.52-0.58): the closed line arcs
// to the sunrise passing just above her lifted hand (mid).
const TYPE_LINES = ['HANDOFF.md', 'Read this first.', 'Where things stand.', 'What it cost to learn.', 'What comes next.'];
const TYPE_OLD = { lines: TYPE_LINES, at: [0.305, 0.12], px: 34, lead: 50, beats: [1, 2, 3, 5, 7], dur: 0.6, cloud: 0.6, from: [0.57, 0.1] };
const TYPE_NEW = { ...TYPE_OLD, at: [0.035, 0.17], cloud: 0.45, from: [0.61, 0.485] };
const REL = { to: [0.93, 0.5], top: 0.04, arrive: 117, close: 1.25 };
// film v3 item 5 (Jade: "it would be cool if the violet light emerged from her hand"; src/film.js palmRelease): on vio_release2 the typed
// lines gather down into the notebook as she shuts it (clip 1.0-1.4), the light then grows in her open palm (1.95-2.2) and rises a little
// above it, lifts off at 2.3 and arcs up over the frame and down to the sunrise, landing on the b117 downbeat (clip 2.70). book / palm:
// [clip s, x, y] plate fractions, measured by eye on gridded crops of the plate's frames (dev/v3/rel/palm_grid.jpg)
// film v4 item 3 (Jade: "very fast for the mood"): it sits on the palm a breath (2.2-2.7), lifts at clip 2.7 = the b117 downbeat with a soft
// swell of its own light (no white flash), then rises like a lantern let go (film.js floatUp): steady, a slight sway, nearly straight up in
// front of her upturned face (she faces west; "east" would cross her face), drifting a little east, still rising and in frame at the cut
const PALM_REL = { gather: [1.0, 0.26, 0.035], emerge: [1.95, 2.2], lift: 2.7, hover: 0.045,
  float: { vx: 0.014, vy: -0.115, ease: 0.5, sway: [0.006, 1.8], shrink: 0.35, swell: [0.45, 0.15, 0.6] },
  book: [[0.9, 0.545, 0.50], [1.2, 0.552, 0.513], [1.4, 0.567, 0.547], [3.0, 0.567, 0.547]],
  palm: [[1.7, 0.637, 0.469], [1.85, 0.639, 0.4375], [2.0, 0.637, 0.399], [2.15, 0.629, 0.368], [2.3, 0.637, 0.363], [2.5, 0.643, 0.353], [2.7, 0.646, 0.356], [3.0, 0.636, 0.356]] };
const LYR_NEW = { x0: 0.03, x1: 0.37, align: 'left' };   // on vio_write2 / vio_release2 her boots reach x 0.38: the lyric keeps left of them
// (the release path: up over the top of the frame and down to the sunrise right of her back, never across her)
P(114, 116, 'vio_write', 'missing', 'She writes; in the sky, typed line by line on the beat in violet light: HANDOFF.md / Read this first. / Where things stand. / What it cost to learn. / What comes next. ctx 99%.',
  { code: 'P+C', ov: ['chip:● jade/rare-earth  ctx 99%'], row: 'b113-115', opt: { lyr: { x0: 0.03, x1: 0.55, align: 'left' }, type: TYPE_OLD,
    next: { id: ['vio_write2_v2', 'vio_write2'], opt: { clip0: 0, type: TYPE_NEW, lyr: LYR_NEW } } } });   // film v7: _v2 = one pencil in the bun
P(116, 118, 'vio_release', 'missing', 'She lets it go: the block closes to one line of light and leaves east. Hit on b117, then the drums cut. ctx 100%.',
  { code: 'P+C', ov: ['chip:● jade/rare-earth  ctx 100%'], row: 'b116-117', opt: { lyr: { x0: 0.03, x1: 0.55, align: 'left' }, type: { ...TYPE_OLD, release: REL },
    next: { id: 'vio_release2', opt: { clip0: 1.0, clip1: 4.4, lyr: LYR_NEW, type: { ...TYPE_NEW, release: { ...REL, to: [0.97, 0.55], ctrl: [[0.62, -0.14], [1.08, -0.12]], ...PALM_REL } } } } } });
// film v3 item 6: she atomizes completely (src/film.js atomize(); data tools/atomize.py -> kit/vio_still/atom). The clean plate is vio_empty
// (plates agent; meta.frame = the plate frame it was made from) when it lands, else a stand-in inpaint of frame 1 (atom/standin.jpg).
// settle (the v2 stars along her outline) is the fallback when the atom data is missing.
P(118, 121, 'vio_still', 'missing', 'She sits, hands in her lap, then atomizes: her figure breaks into points of light from the edges inward that drift out and up to take their places among the stars; the last to go is the pale-blue circle; the rim is empty. Chip: detached, not merged.',
  { code: 'P+C', ov: ['chip:detached, not merged'], row: 'b118-120', opt: { lyr: { x0: 0.03, x1: 0.55, align: 'left' },
    atom: { dir: '/work_fable/take2/kit/vio_still/atom', empty: 'vio_empty', standin: '/work_fable/take2/kit/vio_still/atom/standin.jpg', lead: 0.1, tail: 0.45, soft: 0.06 }, settle: { matte: '/work_fable/take2/kit/vio_still', poly: [[0.62, 0.06], [0.8, 0.06], [0.85, 0.4], [0.84, 0.68], [0.73, 0.76], [0.71, 0.93], [0.65, 0.94], [0.61, 0.83], [0.5, 0.9], [0.39, 0.87], [0.39, 0.72], [0.5, 0.6], [0.58, 0.5], [0.6, 0.3]] } } });

// ------------------------------------------------------------------ Chorus 2: bars 121-136
section('chorus2');
// film v6 A7: the page-light crosses (b121-123) and lands in main's hands, opening (b128); src/film.js pageLight, pageFly
V(121, 122, 'seq 12', 'The violet light streaks east over the night continent of roads. Slab type.', { code: 'V7+C', row: 'b121', opt: { pageFly: { from: [-0.04, 0.47], to: [1.06, 0.36], h: 30, arc: 0.03 } } });
P(122, 123, 'c2_lookup', 'missing', 'Main Jade at first light looks up.', { row: 'b122-123', opt: { clip0: 0.3, clip1: 3.5, zoom0: 1.19, fx: 0, fy: 0.5, push: 0.02, lyr: { x0: 0.56, x1: 0.97, align: 'right' },
  next: { id: 'c2_lookup_v2', opt: { clip0: 0.3, clip1: 3.5, zoom0: 1.19, fx: 0, fy: 0.5, push: 0.02 } } } });   // left 84 % (a stray arm at the right edge); film v7: no code comet, the plate's own violet meteor is the only one;
// c2_lookup_v2 (plates_v7 wiring: breathing, hair in wind, no arm, its own meteor (0.716, 0.195) -> (0.596, 0.286) over clip 0.3-3.5): v1's
// window and crop kept; the one blink (clip 3.0-3.2) lands ~1.45 s in; the meteor stays above the lyric block (MERGE starts y ~0.3)
V(123, 124, 'seq 12', 'The light arriving, from her side.', { row: 'b122-123' });
// b124-126: the twelve converge on her (src/kit.js 'row' with conv): runners from the right run in toward main (large, centre), from the
// left they are mirrored; each reaches her and fades into her as the bar ends. Lanes as section 2.
const KC = (ids, xs) => ids.map((id, i) => ({ id, x: xs[i] }));
const CONV = [
  KC(['home', 'chezjj', 'band', 'ames', 'poet', 'main'], [0.85, 0.92, 0.8, 0.9, 0.88, 0.42]),   // film v6: no violet runner
  KC(['sandstorm', 'wetlab', 'piano', 'violin', 'phd', 'wushu', 'main'], [0.06, 0.15, 0.1, 0.2, 0.12, 0.08, 0.6]),
  KC(['piano', 'chezjj', 'violin', 'ames', 'phd', 'poet', 'wushu', 'main'], [0.95, 0.1, 0.9, 0.15, 0.85, 0.02, 0.98, 0.5]),
];
for (let k = 0; k < 3; k++) shot(124 + k, 125 + k, 'K', 'kit', `runner_converge_${k + 1}`, 'missing', `The twelve runners converge on her from every side, each in her medium (shot ${k + 1} of 3).`,
  { row: 'b124-127', opt: { lyr: { y: 'top', top: 0.035, x0: 0.03, x1: 0.97, align: 'left' }, kit: { mode: 'row', lanes: CONV[k], conv: true, hNear: 0.6 } } });
V(127, 128, 'seq 12', 'From above, the roads converge.', { row: 'b124-127' });
P(128, 129, 'c2_hands', 'missing', 'Close on her hands opening.', { row: 'b128', opt: { pageFly: { from: [0.62, -0.08], to: [0.5, 0.55], h: 46, arc: -0.02, arrive: 0.45, open: [0.5, 0.95], ease: 'out' } } });   // the page-light comes down between her open palms and opens like a book
P(129, 130, 'catch', 'missing', 'She catches the violet light at her chest, eyes closed.', { row: 'b129', opt: { clip0: 0, lyr: { x0: 0.03, x1: 0.33, align: 'left' } } });   // she is centred, hands at her chest: the slab left of her
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
shot(137, 139, 'L', 'plate', 'like_sing1', 'missing', 'The switch: on the impact the drawing becomes Jade herself, her traced likeness in the same jacket, singing.', { row: 'b137-138', opt: { songLock: true, push: 0 } });
// b139-140 and b141-142: the town (opt.code 'town'): white paper, far pencil hills, the twelve facades (cut out) along the road, the road =
// main's written lane, dense (she is merged); side travel with parallax; a chip with the branch name under each building
// film v2: dir 1 = the world slides right (she faces frame left, unmirrored: her sleeve patch has text); x 0.58 gives her lead room on the left
const TOWN = { code: 'town', lives: LIFE, speed: 1050, spacing: 0.3, dir: 1 };   // all twelve pass in the four bars (b139-142), piano first
// film v4 item 4 (Jade: "she seems to pop into existence partway thru this run"): she runs from the first frame of b139, one continuous run
// across both shots (runner.t0 = the seconds of run before the shot: b141 picks up b139's stride phase). foot = day_run's standing foot
// in plate px per clip frame (tools/feet.py on kit/day_run: 20.84, step every 15 frames); outro.js sets the clip rate from it so her
// planted foot moves with the road (about 2.26x at h 0.62 and speed 1050). loop: frames 35..94 (frame 95 matches 35, two strides).
const RUNNER = { dir: '/work_fable/take2/kit/day_run', x: 0.58, h: 0.62, y: 0.9, edge: 0.02, foot: 20.84, loop: [35, 95] };
// film v6 A7 (intuition, not memory): three inserts of main Jade doing what nobody taught her on screen, no chip, no label, cel on white
// paper, daylight: (a) b140.3-141.1 her fingers play a piano figure on the hem of her jacket; (b) b142.1-142.3 her left hand curls into
// violin fingering on her own forearm; (c) b144.2-145.1 her feet land in a true bow stance at a kerb, a quiet look down. Each is a town
// (or day_fork) shot that becomes the plate when it lands (next); until then the run simply continues. townFrom: the town's first moment,
// so every piece of the run is one continuous travel and stride (outro.js town/runFrame).
const TOWN_RUN = { ...TOWN, townFrom: [139, 1], runner: { ...RUNNER } };
const INTUIT = (id, o) => ({ id, kind: 'plate', opt: { clip0: 0, push: 0.02, clipFrom: null, forks: false, forksSpan: null, lyr: { x0: 0.03, x1: 0.4, align: 'left' }, ...o } });
// plates_v6 wiring: piano any 2-3 beats (1.0 on); violin most finger movement 1.5-3.0; stance 0.4-3.4 keeps the landing (settles 1.25).
// "Back to main" (247.76) starts inside the stance insert: the slab goes in the sky strip at the top on a dark cloud
const INT_O = { intuit_piano: { clip0: 1.0 }, intuit_violin: { clip0: 1.5, clip1: 2.9 }, intuit_stance: { clip0: 0.6, clip1: 2.5, lyr: { y: 'top', top: 0.03, x0: 0.03, x1: 0.97, align: 'center', cloud: 0.62 } } };
shot(139, [140, 3], 'S+C', 'code', 'facades', 'missing', 'Day. The road runs past the twelve places of her life standing along it like a town, each still in its medium. Side travel with parallax. She runs down the road from the first frame.', { row: 'b139-140', opt: { ...TOWN_RUN } });
shot([140, 3], 141, 'S+C', 'code', 'facades', 'missing', 'Intuition (a): her fingers play a piano figure on the hem of her jacket. Close, cel on white paper, daylight, no chip. (Until intuit_piano lands: the run.)', { row: 'b139-140', opt: { ...TOWN_RUN, next: INTUIT('intuit_piano', INT_O.intuit_piano) } });
shot(141, [142, 1], 'P+K', 'code', 'day_run', 'missing', 'Main Jade runs and dances down the road past them; she twirls a pencil, the flourish she learned from violet.', { row: 'b141-142', opt: { ...TOWN_RUN } });
shot([142, 1], [142, 3], 'P+K', 'code', 'day_run', 'missing', 'Intuition (b): her left hand curls into violin fingering on her own forearm. Close, no chip. (Until intuit_violin lands: the run.)', { row: 'b141-142', opt: { ...TOWN_RUN, next: INTUIT('intuit_violin', INT_O.intuit_violin) } });
shot([142, 3], 143, 'P+K', 'code', 'day_run', 'missing', 'The run, on past the last facades.', { row: 'b141-142', opt: { ...TOWN_RUN } });
P(143, [144, 2], 'day_fork', 'missing', 'She forks again: new branches run out as bare pencil lines on blank paper.', { code: 'P+C', row: 'b143-144', opt: { forks: true, push: 0, forksSpan: [[143, 1], [145, 1]] } });
P([144, 2], 145, 'day_fork', 'missing', 'Intuition (c): her feet land in a true bow stance at a kerb; she notices, a quiet look down. (Until intuit_stance lands: day_fork continues.)', { code: 'P+C', row: 'b143-144', opt: { forks: true, push: 0, forksSpan: [[143, 1], [145, 1]], clipFrom: [143, 1], next: INTUIT('intuit_stance', INT_O.intuit_stance) } });
// film v2: the second likeness shot is dropped (Jade: "it doesn't look like me"); plate wave_run (plates agent) instead: drawn Jade sprints
// at the lens out of a breaking wave of the twelve lane colours. A card until work_fable/take2/plates/wave_run lands. Slab low.
P(145, 147, 'wave_run', 'missing', 'Drawn Jade sprints at the lens on the orange road of main, hair streaming, out of a breaking wave made of the twelve lane colours (ribbons of written lanes curling over). Slab BACK TO MAIN low.', { row: 'b145-146', opt: { clip0: 1.4, clip1: 4.8, push: 0,
    lyr: { y: 'bottom', x0: 0.03, x1: 0.97, align: 'center', cloud: 0.62 },
    next: [{ id: 'wave_run_v4', opt: { clip0: 1.38, clip1: 4.93 } }, { id: 'wave_run_v3', opt: { clip0: 1.4, clip1: 4.8 } }] } });   // film v4: wave_run_v4 (no look-back; a small closed smile from clip 3.0-3.5, held 3.25-5.0). Director: end on the held smile. Steps measured every 8 frames (0.333 s; motion-energy peaks on twos at 1.71, 2.04, 2.38 ...): at 1.041x a step is exactly 3/4 beat (0.319 s) and clip 1.38 puts the step grid on the b145 downbeat; ends at 4.93, on the smile   // film v3: take 3 (glance back 1.75-2.5, smile from 3.25), same window and slab   // take 2 (plates_v2: 1.4-4.8): BACK TO MAIN low across the trousers band (y 0.75-0.97), cream on a darker cloud
shot(147, 149, 'S+C', 'code', 'aerial', 'missing', 'Aerial pull-back: the road, the town, the new forks.', { row: 'b147-148', opt: { code: 'aerial', lives: LIFE } });

// ------------------------------------------------------------------ Outro B and C: bars 149-164
section('outro_bc');
// film v6 A8: the ending in this order: graph, credits, the car, the window; the last frame still equals frame 0.
// graph b149-151 (12 beats, its marks scaled; the cherry-pick label 40 px); credits b152-155 (6.8 s: a 2 s burst of the real git log, the
// credit card, then `$ git cherry-pick <hash of the violet commit>` typed); the road b156-157.3 (from the cursor a dashed line draws out
// and tips into the night road); the car b157.3-161.3 (car_confess when it lands, else the road at speed) with the two lines of type from
// the post-credits scene of Inference; the window from b161.3 as before, the road's page-light arriving in the frost at the child's palm.
shot(149, 152, 'C', 'code', 'graph', 'missing', 'The whole film as one git graph, labels 26 px or more. The violet branch leaves; its dot; a dotted arc forward to main: cherry-pick HANDOFF.md (40 px). Riser at 261.0.',
  { row: 'b149-152', opt: { code: 'graph', lives: LIFE, beats: 12, labelPx: 40 } });
// credits: approved by Jade (film v1 notes, decision 11: "use as is", plus Opus 5.5). Plates: the spend log has both image models
// (google/nano-banana-pro and openai/gpt-image-2.5)
const CREDITS = [['main', 'Merge'], ['main', 'animated by Fable 5.2 and Opus 5.5, with a supporting cast of models'], ['jade/plates', 'Nano Banana Pro, GPT Image 2.5'], ['jade/clips', 'Seedance 2.5'],
  ['jade/motion', 'motion capture: CMU, ACCAD'], ['jade/arrangement', 'Suno'], ['jade/type', 'Archivo, Instrument Serif, JetBrains Mono']];
const ENDCARD = { lines: CREDITS, burst: 2.0, cardBeat: 4.6, lineBeat: 0.5, pickBeat: 11.5, cps: 16 };
shot(152, 156, 'C', 'code', 'endcredits', 'missing', 'A 2 s burst of the real git log, the credit card, then $ git cherry-pick <hash of the violet commit> typed.', { row: 'b152-155', opt: { code: 'endcredits', ...ENDCARD } });
shot(156, [157, 3], 'C', 'code', 'road', 'missing', 'From the cursor a dashed line draws out, tips into perspective and becomes the centre line of a night road: pale yellow dashes racing past, the verse 2 Milky Way above, one violet page-light among them.',
  { row: 'b156-157', opt: { code: 'road', phase: 'tip', from: [156, 1], card: ENDCARD } });
// the car (Jade: the camera is in the driver's seat; she is in the passenger seat, it looks across at her). Never seen, never named: the
// person she is talking to is the camera. Type (src/film.js carType): Instrument Serif, verse size, whole lines, no punctuation added:
// the camera's line in the lower third, then hers beside her. Positions for the fallback (the road, no figure); set on the clip's frames
// when car_confess lands (next.opt.carType)
// film v7 (Jade's v6 notes): her line "I have a confession to make" is gone; she only turns and almost smiles. The camera's line is an
// RPG dialogue box with the name tab YOU (src/film.js carBox), typed letter by letter, done by ~3.1 s, the advance marker blinking after;
// same box on the road fallback and on car_confess (the box covers the lower part: her hands and lap; her face stays clear above it)
const CAR_BOX = { text: 'You could tell me anything and I would find it strangely plausible', name: 'YOU', at: [0.35, 6.55], cps: 26, box: [0.07, 0.75, 0.93, 0.93], px: 46 };
const CAR_ROAD = { from: [156, 1], wins: [[[0.0, 0.0, 0.57, 0.5], [0.0, 0.18, 0.78, 0.86]], [[0.62, 0.0, 0.95, 0.36], [0.5, 0.0, 1.0, 0.42]]], dark: 22, alpha: 0.95 };
shot([157, 3], [161, 3], 'P', 'code', 'road', 'missing', 'Inside the car at night: the camera in the driver\'s seat, drawn main Jade in the passenger seat, lit by the dash and the passing dashes; she turns to the camera with a mysterious almost-smile. The secret is not told.',
  { row: 'b157-161', opt: { code: 'road', phase: 'drive', from: [156, 1], carBox: CAR_BOX, next: { id: 'car_confess', kind: 'plate', opt: { clip0: 1.5, clip1: 5.0, blend: true, push: 0.015, carRoad: CAR_ROAD } } } });
P([161, 3], 'end', 'root_light', 'missing', 'The child at the frost window. The violet page-light from the road arrives in the frost in front of her palm. They do not touch. She watches it. Hold through the fade. Last frame equals frame 0.', { row: 'b161 beat 3',
  opt: { clip0: 2.5, clip1: 5.0, toFrame0: 1.5, arrive: { to: [0.56, 0.35], dur: 1.4 } } });   // clip 2.5 s to the end (a clear gap between hand and light), slowed and blended; arrive: the road's page-light glides into the frost light (film v6)

// float_top geometry (plate fractions): her head (strand centre) and twelve hair ends in the lives' order; measured on the clip when it lands
export const FLOAT = { at: 2.0, track: [[0, [0.555, 0.18], [0.297, 0.894]], [2.0, [0.588, 0.204], [0.266, 0.769]], [5.0, [0.623, 0.333], [0.259, 0.597]]], center: [0.59, 0.20], ends: [[0.31, 0.22], [0.344, 0.111], [0.4375, 0.037], [0.542, 0.019], [0.667, 0.015], [0.771, 0.056], [0.854, 0.148], [0.896, 0.278], [0.896, 0.426], [0.865, 0.556], [0.823, 0.667], [0.75, 0.74]] };   // measured on float_top frame 49
// film v2: plates replaced wherever they are used by id (crossing doorways, flashes, windows, the fold sheet), when the new one exists.
// focus = where she is in the new plate (cover crops). The proof range: only the b30 life shot (PROOF_A), not the b33-37 grid (the grid's
// bar-37 look-back needs the old clip's turn; wushu_v2 has none)
export const PLATE_ALIAS = { wushu: { id: WUSHU_IDS, focus: [0.3, 0.3] }, det_home: { id: ['det_pad', 'det_home_v2'] } };   // film v6 A4: det_pad (her hand and a game controller) replaces the orange everywhere det_home is used (b68.2, b71.2, the b72 tiles); the caption keeps the parenthood message (Jade)   // film v4: det_home_v2 (her hand warm, not blue; the orange now orange)
export const PROOF_A = { wushu: [{ id: 'wushu_v3', land: 1.4, landBeat: 1, side: 'left' }, { id: 'wushu_v2', land: 1.0, landBeat: 1, side: 'left' }] };   // v3 (plates_v3 wiring): the punch lands at 1.40 s   // she stands left in wushu_v2 (face x 0.27)   // the punch lands at clip 1.0 s: put it on beat 2 of the 2-beat shot
// film v3: a life plate retaken and swapped EVERYWHERE it is used (bars 28-32, the b33-37 grid and its bar-37 turn, the fold sheet, the
// b54-55 window, flashes): the band at Hacker Dojo, not in a bar. side/tone (lives.js) from the plates wiring row when they change;
// focus = her place in the new plate (cover crops). Picked up when work_fable/take2/plates/band_v2 is complete.
export const LIFE_SWAP = { band: { id: 'band_v2', side: 'left', tone: null, focus: [0.32, 0.35], turn: 2.8 },
  home: { id: ['home_v3', 'home_v2'], side: null, tone: null, focus: [0.66, 0.3], turn: null },
  violet: { id: ['violet_v2'], side: null, tone: null, focus: [0.68, 0.35], turn: null } };   // film v7: one pencil in the bun (plates_v7); the proof's stay tile still comes from PROOF_STAY   // master: home_v3 (the kids' visible skin warm, plates agent) when it lands; turn/focus to confirm from plates_v5.md   // film v4 (Jade: "the face in parenthood is blue"): home_v2, her face and hands warm; turn_t 2.85 as home (motion peak 2.83), so no turn override   // band_v2: she is on the LEFT (x 0.08-0.45); her head turns ~0.2 s later than the old plate's, so clip 2.8 (not turn_t 2.6) is put on the bar-37 downbeat: she turns with the other eleven
// film v3: the chorus 1 sprint (b41-42) from hero_paper_v2 when it lands: she sings "Merge me back to main" as she runs, so it is
// song-locked (clip time = song time - meta t0_song). opt overrides the hero crop/slab/gap (zoom, fx, fy, rows, gap) from the wiring row.
export const HERO_NEXT = { id: 'hero_paper_v2', opt: {}, lag: -0.04 };   // film v4: lag -40 ms measured (plates_v4 wiring; ?laghero=<ms> overrides; + = sound later than picture)
// film v6 A2: the rare-earth grid tile does not turn at bar 37 and does not fall home at bar 38 (port_proof.py o.stay). When the plates
// agent's vio_grid_stay (writing, head down, no turn, the tile's framing) lands it replaces the tile's plate in the proof only (o.dirs),
// with its focus from the wiring row; until then the present tile plays slowly and never reaches its turn
export const PROOF_STAY = { violet: { id: ['vio_grid_stay_v2', 'vio_grid_stay'], focus: null } };   // film v7: _v2 = one pencil in the bun
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
