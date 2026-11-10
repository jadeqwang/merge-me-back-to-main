# Act B — seqs 05 chorus 1, 06 float, 07 download (bars 41-72, 69.69-125.34 s, 1:10-2:05)

Files: `fable/show/seq/05_chorus1.js`, `06_float.js`, `07_download.js`, and two helpers next to them:
`actB_geo.js` (`K.shared.actB`: the act's own clocks and places) and `actB_float.js` (`K.shared.actBFloat`: the hair-graph, the top-down shot).
No shared show file and no engine file was changed by this act.

STATUS: in progress (see "State" at the bottom).

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
| 5A | 69.686-75.77 | "Merge me back to main" | on her road ahead of her, 0.3 m high, fov 48, 3.5 -> 2.9 m, travelling backwards with her | heroic: she sprints at the lens, siblings come up from behind and fuse at each node |
| 5B | 75.77-83.60 | "Every road I ran becomes the one" | 135-175 m up east of M1 looking west, slow push | the delta braiding into main; flashes on 8-4-2-1; the one light runs east |
| 5C | 83.60-89.46 | "Fold me in again" | side-on from the south, 5.4 m, travelling with her | eleven lane-coloured afterimages, one folds in per beat; the brake |
| 5D | 89.46-97.515 | "Nothing that I lived can come undone" | front-quarter from the east, 1.25 -> 1.75 m high, slow push | she stops on the hit, looks back; her road to the horizon, commits lock on through "undone" |
| 6 / 7A | 97.515-116.64 | crash; "Branch and wander"; "Merge and return"; "Ahh" | straight down: 2.75 m (she fills the frame) rising to 32 m and turning 113 degrees, then back down to 6.6 m | the hair is the graph: filaments, forks, roads, pulses home, the text streaming in, her light growing |
| 7B | 116.64-125.343 | snare crescendo; leap 118.387; roll 123.49 | on the water west of her looking east, 0.24 -> 0.6 m high; from the roll it lifts to 15 m and back | the rise, arms open against the first dawn; the convergence; white into Act C's landing |

## Known problems (so far)
- 5A: figures in the pack overlap in pairs just before each fusion (that is the fusion, but it reads as doubles in a still).
- 5B: the lower half of the frame is night mirror with the lyric on it; the delta fills the upper half only.
- 5D: Act A reported a hot horizon line at 1:30 (the stacked connectors/lights west of her): being fixed per shot (`fogDist`, `lights.air`).
- 6: the filaments leave the hair as a regular comb of straight lines; the first fork ring reads as a drawn semicircle.
- 7B: she rises facing west (toward the lens), so the dawn is behind her and she is front-lit only by her own accents.

## State
- Done (first pass, seen in stills only): all six shots; gait-legal speeds everywhere; hand-overs 5C -> 5D -> 6 on the same spot.
- In progress: horizon calm in 5C/5D; the float's first 5 s (filament comb); the roll and the last frame into 125.343; clip with audio not yet watched.
