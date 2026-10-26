// ?drop=real: Jade's REAL 2004 collegiate group set (3rd place) as the drop, bars 89-100 (docs/wushu_real_routine.md). One table for the EDL
// (engine/show/main.js, drop block), the EDL check (tools/edl_check.mjs --fake=real) and the box's run sheet (tools/prep/real_ws.mjs prints the
// ffmpeg cuts, prep, lane split and motion-reference commands from it). Times are seconds into the competition video (320x240, 15 fps; the file
// stays in the box's ignored work/, never in the repo). A segment's clip time c = video time - in. keys: [[bar position, clip s], ...] for
// keyed() (98.5 = bar 98 beat 3): each key frame lands on its bar position, real speed outside the keys, linear between them. The planned
// values come from the box's timestamps (docs/wushu_groupset_notes.md, docs/wushu_v5_design.md section 9); after the cut, read the real key
// frames off each segment's contact sheet and correct them here (keep each stretch within ~0.8-1.25x, except the deliberate holds marked HOLD).
export const SRC = { w: 320, h: 240, fps: 15 };
// crop: [w, h, x, y] in source pixels, a 16:9 window that keeps all six whole for the WHOLE segment (they travel); as tight as that allows, so
// the figures stay large. Default = the full width, rows 40-220 (the carpet; a 2004 wide shot has the judges' table and crowd above it). The
// box draws each crop on the contact sheet and tightens it (e.g. 256x144) where the six stay inside.
const CROP = [320, 180, 0, 40];
export const SEGS = {
  // 89.1-91.1: the drop lands on the first unison hit. Burst out of attention (0:16.8), bow stance + straight punch (0:17.6) ON THE DROP 89.1,
  // pubu with the arm sweeping low (0:18.4) on 89.3, up into bow stance with the rear arm whipped overhead (liangxiang, 0:19.0-0:20.0) on 90.1.
  burst: { in: 16.6, out: 21.6, crop: CROP, keys: [[89, 1.0], [89.5, 1.8], [90, 2.6]] },                       // x0.92, x0.92, then 1.0
  // 91.1-93.1: the cross-colour pairs (1:12-1:30) and the set's best partner/acrobatic beat, its peak on 92.3 (the drop's strongest beat-3
  // onset, the airborne bar of the first phrase). The notes log NO roll or walkover over a partner's back: they log takedowns to the floor
  // (~1:13-1:15) and "sweeps and rolls" (~1:24, ~1:29). Default = the ~1:24 sweep/roll; ?realpair=13 | 29 swaps in the others (cut all three,
  // pick on frames; if one IS a roll over the partner's back, make it the default).
  pairs: { in: 81.0, out: 87.0, crop: CROP, keys: [[91, 1.0], [92.5, 3.6]] },                                  // attack/block 91.1, peak 92.3: x1.0
  pairs13: { in: 71.5, out: 77.5, crop: CROP, keys: [[91, 0.5], [92.5, 3.0]] },                               // attack/block 1:12.0, takedown lands ~1:14.5: x0.96
  pairs29: { in: 86.0, out: 92.0, crop: CROP, keys: [[92.5, 3.0]] },                                          // the ~1:29 sweep/roll on 92.3, real speed around it
  // 93.1-98.1: one continuous take of the real set, the halves' call and response into THE GROUP FALL. Knee-raise balance on the 93.1 phrase
  // landing (0:40.5); the black (cool) half's front kicks on 94.1 (0:42.2), the red (warm) half answers on 94.3 (0:43.0); slap kicks on 95.3
  // (0:44.6); the dive on 96.4 (0:47.2, the bass's F# take-off); all six hit the mat on 97.1 (0:47.6, the phrase landing, the crowd's loudest
  // moment); bar 97 is the held still bar (they lie flat, 0:48-0:49.3 at real speed).
  fall: { in: 40.0, out: 50.0, crop: CROP, keys: [[94, 2.2], [94.5, 3.0], [95.5, 4.6], [96.75, 7.2], [97, 7.6]] },   // x0.92, x0.92, x1.20, x0.92
  // 98.1-99.1: the rise (0:55-0:58), a jump cut from the stillness (0:49.3 -> 0:55.0, both lying flat): the first push-up on 98.1, they push up
  // in sequence, crouch and spring to standing on 99.1 (bass C# -> D: low, mid, high).
  rise: { in: 53.6, out: 58.6, crop: CROP, keys: [[98, 1.4], [99, 3.4]] },                                    // x1.15 (planned; must stay <= 1.25)
  // 99.1-101.1: the last phrase, the final pose and the salute, into the fold's match cut. Bow stance out of the pubu (1:54.86) on 99.1, the final
  // pose lands on 100.1 (1:56.6); HOLD: its ~1.8 s of stillness passes in an eighth of a bar (100.1 -> 100.125, a deliberate held moment, ~8x);
  // rise, feet together (1:58.4 ->), fist meets palm, the baoquan salute, on 100.3 = the "ooh" (1:59.2, x1.23); the salute held into the cut
  // (x0.8). Main (orange) steps out of Jade's own spot into the point of the line on the rise (ME, below).
  end: { in: 114.0, out: 121.0, crop: CROP, keys: [[100, 2.6], [100.125, 4.4], [100.5, 5.2], [101, 5.9]] },
};
// the drop's cuts: [bar position, segment]; each runs to the next, the last to the fold (bar 101, unchanged). Her jian solo (bar 95 in the
// default drop) is not in the real set, so it isn't here.
export const CUTS = [[89, 'burst'], [91, 'pairs'], [93, 'fall'], [98, 'rise'], [99, 'end']];
export const PAIRS = { 13: 'pairs13', 24: 'pairs', 29: 'pairs29' };    // ?realpair=
export const FLASH = [[92.5, .22], [97, .5]];                          // the partner peak, the fall (the drop's own flash on 89.1 stays)
// Lanes (tools/prep/lanes.py writes them into each plate's meta.json): the red uniforms become the warm half, the black the cool half, each half
// left to right, so a line that alternates red/black from the left reads white, mint, rose | sky, gold, violet = the fold's V without its point.
export const LANES = { warm: ['white', 'rose', 'gold'], cool: ['mint', 'sky', 'violet'] };
// Jade's own spot in the line at the salute, 1-6 from the left as the camera sees it (ask her; she knows where she stood). Main is drawn from
// that performer: a second, orange copy of her steps forward into the line's centre for the salute. null = the performer nearest the centre.
// ?realme=1..6 overrides; ?realme=0 leaves main out.
export const ME = null;
// the look at 320x240: the source is 6 output px per source px across a 1920 frame, so the finest glyph tier is ~1.4 source px (cellFig 5 ->
// tiers 5 / 8.3 / 12.5 / 18 px); finer cells only resample blur. bloom .45 (the drop's .6 merges limbs on figures ~200 px tall); world = the gym's
// gain (a faint floor under the light figures, the judges and crowd sunk into the dark); laneAmt/gain: the lane tint over black and red
// uniforms. z/pan per segment (cam zoom: a 2D punch-in, no parallax on the low-res depth) refine the ffmpeg crop. ?realcell= ?realworld= tune.
export const LOOK = { cellFig: 5, cellWorld: 8, bloom: .45, world: .25, laneAmt: .6, gain: 1.25, z: 1, pan: [0, 0] };
// &real=ref: picked motion-reference takes (tools/sd/shots_wushu.py dr_real_ref_<seg>) on the same clip clock as their reference clip; a take
// that drifted gets its own measured keys here: { take: [[bar position, clip s], ...] }.
export const REF_KEY = {};
