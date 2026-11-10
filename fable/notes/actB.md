# Act B — seqs 05 chorus 1, 06 float, 07 download (bars 41-72, 69.69-125.34 s, 1:10-2:05)

Files: `fable/show/seq/05_chorus1.js`, `06_float.js`, `07_download.js`, and two helpers next to them:
`actB_geo.js` (`K.shared.actB`: the act's own clocks and places) and `actB_float.js` (`K.shared.actBFloat`: the hair-graph, the top-down shot).
No shared show file was changed. One additive engine change: `fable/engine/src/roads.js`, drawable option `nodeAir` (metres; default 0 = off, output
unchanged): night air for commit nodes seen at a grazing angle, as `fogDist` does for the lines. Without it thousands of far nodes (1.8 px minimum each)
stack into a hot line on the horizon. Pass it per set: `world: { fork: { fogDist: 90, nodeAir: 80 }, merge: {...}, ... }` (05 has a helper `far(fog, air)`).
Proof stills after the change: `work_fable/stills/actB/proof_040.png`, `proof_160.png`.

STATUS: act pass done (see "State" at the bottom).

## Commands
```
Q="tracks=sprint_loop,sprint_stop_look,float,rise,idle,run_loop,walk_loop,land,build"    # dev: 9 s start-up instead of 28 (other acts complain about missing tracks)
node fable/tools/render.mjs --show /fable/show/main.js --q "$Q" --res 1280x720 --sheet 70:125.3:1.5:work_fable/stills/actB/sheet.jpg:6
node fable/tools/render.mjs --show /fable/show/main.js --from 68 --to 127 --res 1280x720 --mb 2 --workers 3 --audio --mp4 work_fable/out/actB.mp4
```

## The idea of the act
- She is never moved faster than her legs. v1 let the world carry her at 12-46 m/s through the chorus on a sprint loop (skating). The act now keeps its
  own clock for where she is (`actB_geo.js`), always at `sprint_loop` x 0.88..1.08, and pins the world's write head to her feet, so "the road is written
  under her feet" stays true: in A the world is drawn at `tauA(t)` (the world's own time at the spot she has reached), from B on `main: { head }`.
- A: she runs her first three merge limbs (26 m in 5.6 s; the nodes fall on b42, b43.2 and the cut). The runners round her are real branches on their own
  limbs: each is timed backwards from the node where it meets its partner, a little faster than the partner, so it comes up from behind and fuses.
- B: from 150 m up she is a light. The world's own merge clock runs (8 on the cut, 4 on "road", 2 on "ran", 1 on "one"); the last six levels of the merge
  tree are drawn again as rivers whose width is what they carry. From M1 the one light runs out along main and slows to her running speed by the cut to C.
- C: the fan is her eleven lives: copy i is her a moment ago (same footprints, 0.118 s apart), in the lane colour of life i; one folds in per beat and the
  HUD names it (`main <- jade/piano`). She runs on `sprint_loop` at 1.0 and goes into `sprint_stop_look` (song_t0 85.6) with no change of speed.
- D: she is at rest on the 89.80 hit with her hips exactly where she will lie down for the float. Her commits lock on, oldest first, on eighth notes:
  the root, her ten merges, the four bar lines she ran on main, HEAD under her feet on b56.4 (97.08), one beat before the crash.
- Float: one top-down shot from 97.515 to 116.64 that never stops moving (height, turn, centre are keyed in `actB_float.js` `CK`). Main runs in to her
  feet from the west; out of the fan of her hair run thirty strands, and each forks three times (240 tips, 62 m out). When a point of the graph is written
  depends only on its distance from her head, so it grows outward on the words. Every strand carries one of her lives as text.
- The download: the pulses come home one per beat from b65; her light (`figLight` ambient / emissive / fibres, `density`, accent `gain`, the pool under her)
  steps up as each lands. The camera comes back down to her for the hand-over to the rise.
- The rise: cut on the snare crescendo (116.64) to the water's surface west of her, looking east. She is lifted; on 118.387 her arms open and dawn comes
  up behind her (0.07 -> 0.2 in 0.8 s). On the roll (123.49) the camera lifts away and every strand fires home; white on b73.

## Shot list (song seconds)
| # | time | words / music | camera | what it is for |
|---|---|---|---|---|
| 5A | 69.686-75.77 | "Merge me back to main" | on her road ahead of her, 0.28 m high, fov 48, 3.1 -> 2.35 m, travelling backwards with her | heroic: she sprints at the lens, siblings come up from behind and fuse at each node |
| 5B | 75.77-83.60 | "Every road I ran becomes the one" | 135-150 m up, looking west, travelling east (backwards) with the merging front until M1 is in frame | the delta braiding into main; flashes on 8-4-2-1; the one light runs east |
| 5C | 83.60-89.46 | "Fold me in again" | side-on from the south, travelling with her, 5.5 -> 3.6 m: it closes in as the fan shortens | eleven lane-coloured afterimages, one folds in per beat; the brake |
| 5D | 89.46-97.515 | "Nothing that I lived can come undone" | front-quarter from the east, 1.25 -> 1.75 m high, slow push | she stops on the hit, looks back; her road to the horizon, commits lock on through "undone" |
| 6 / 7A | 97.515-116.64 | crash; "Branch and wander"; "Merge and return"; "Ahh" | straight down: 2.75 m (she fills the frame) rising to 26 m and turning 113 degrees, then back down to 6.6 m | the hair is the graph: filaments, forks, roads, pulses home, the text streaming in, her light growing |
| 7B | 116.64-125.343 | snare crescendo; leap 118.387; roll 123.49 | one arc on the water round her, 0.28-0.5 m high, fov 36: from her right side (the sit-up in 3/4 profile) to the front on the leap, on to her left; from the roll it lifts to 15 m and back | the rise, arms open against the first dawn; the convergence; white into Act C's landing |

## Decisions the director should know about
- The world's merge clock is untouched (1,024 -> 512 on b41.3 ... 1 on "one"), but she no longer rides it: in 5A she covers three limbs, not seven, and the HUD
  count shows the world's count at the spot she has reached (1,024 -> 256 by the cut). 5B then shows the real count (8, 4, 2, 1) on the words.
- 5B has no figure: at that height a body is 3 px. She is the bright head of main; the cut to 5C finds her where that light is.
- The fan in 5C is eleven copies (her lives in SPEC order), not eight: one per beat fills bars 49-51.3, and the last fold lands as she begins to brake.
  The HUD reads `main <- jade/<life>` for the beat after each fold.
- 5D's commits are hers only (root, ten merges, four bar lines, HEAD = 16): the rings on the road in frame are real nodes of her path, in order.
- Float: she lies head east, feet west, so main arrives at her feet and the graph leaves her head toward the dawn; she stands up facing west (toward the
  lens in 7B), and the dawn is behind her. The fork radius is different for every strand (1.25-2.2 m from the crown) so there is no drawn ring.
- 7B ends wide and white (the strands firing home, 0.75 flash); 08 opens close and low on the landing with its own flash.
- `float` and `rise` put her 240 m west of FORM, where 08 lands her: the white frame covers the move.

## Known problems
- 1:10-1:16 the pack: two runners that are about to fuse overlap as a double for ~0.3 s; her hair streams behind her and is hidden by her own body from
  the front. The big rings on the ground near the horizon are other branches' commit nodes (thin rings since Act A's change).
- 1:16-1:18 the top third of 5B (the far connectors and their lights) is a dense sparkle; the lyric lies on empty mirror in the lower left.
- 1:24 the two farthest afterimages start at the left edge of frame.
- 1:29.5-1:37 5D is a quiet 8 s: the only motion is the look-back (from 91.8), the commits locking on and a slow push. Her chest stays toward the lens while
  the head turns (performance: `sprint_stop_look` turns head and shoulders only; a half-step round would sell it).
- 1:49-1:55 at the top of the crane she is 8 % of frame height (the shot is about the graph there). The road text does not travel: "streaming in" is
  brightness running inward along static text (`flow` < 0) plus the pulses.
- 1:56 the float -> rise hand-over happens at the end of the top-down shot, 0.64 s before the cut: she begins to sit up seen from above.
- 1:57-1:58 the sit-up is a bundle of trouser for about half a second (deep crouch poses, P1_qa).
- 2:03.5-2:05.3 in the pull-back she is small and partly lost in the glare of the strands.

## State
- Done: all six shots, watched as strips from the clip with audio (not frame by frame). Gait: 5A 0.885 / 1.01 / 1.08 x `sprint_loop`, runners 1.11-1.15,
  5C 1.0, then the track's own brake. No positional lerp of a body anywhere in the act.

## Outputs
- `work_fable/out/actB.mp4` (68-127 s, 720p, mb 2, audio), `work_fable/stills/actB/sheet_final.jpg` (one frame per 2 s from the clip), dense strips `k1..k4.jpg`.
