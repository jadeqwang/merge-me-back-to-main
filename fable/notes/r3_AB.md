# Round 3, Acts A and B (seq 01-07, 0:00-2:05). Working notes

Task list: `fable/NOTES_v3.md` ("Acts A+B"). Stills and strips: `work_fable/stills/r3_AB/` (git-ignored). Clip: `work_fable/out/r3_AB.mp4`.
Status line (kept current): **done: all eight items, the re-check of every shot, the clip. Not pushed. Open: "Still weak" and the three requests for the figure owner.**

## Commands
```
# strips at exact times, with per-time crops (a wrapper round --stills + ffmpeg tile; not in the repo, 20 lines):
#   strip.sh OUT.jpg COLS CELLW full A|B|all  t1 t2@w:h:x:y t3 ...      (crop of the 1280x720 frame, kept for the following times)
node fable/tools/render.mjs --show /fable/show/main.js --res 1280x720 --sheet 24.5:29:0.125:work_fable/stills/r3_AB/x.jpg:8
node fable/tools/render.mjs --show /fable/show/main.js --from 0 --to 125.4 --res 1280x720 --fps 30 --mb 4 --workers 4 --audio --mp4 work_fable/out/r3_AB.mp4
```
No cut time moved, so `fable/show/cuts.json` is unchanged.

## The list (NOTES_v3 "Acts A+B")
| note | what changed | where |
|---|---|---|
| 26.0-26.6 sparse mid-fall | light comes up the road she lands on: a pulse runs up her road and reaches her tip on each beat of the fall (b15.4, b16.1, b16.2, b16.3 = 25.778, 26.213, 26.648, 27.083), drawn as a pulse on the road line plus a three-disc comet of main-orange on the mirror at `W.heroAt(g)` (1.8 % of the camera's distance, so constant on screen); her tip's light takes each one (a flare) and grows to 1.9 x on screen by 26.6, back to r2's pool by 27.5 | `02_tree.js` `FALL`, `pulses`, `comet`, `kick`, `grow` |
| 60.0-60.13 "Where" jumps at the cut | the line has ONE place in the frame (lower left, 110 px) from "Where" (59.93) to the end of "from" (65.99). Before the cut (the last roll-call frames) it hangs square to the lens at that place; after the cut it lies on the ground under the top-down camera: the same picture. The sky copy of line 6 in the roll call is gone | `04_prechorus.js` `LINE6`, `bill` |
| 64.5-66.0 the line gone while "from" is sung | from the start of the dive (64.473) the line is hung square to the lens at the same place (frame-locked, 30 m from the camera), so it stays upright while the camera turns over; out at 65.99 (the word's end), fade 0.4 | `04_prechorus.js` |
| 108-113 she is under 15 % of frame | float camera capped at 12.6 m (was 24): her body is 20.8 % of the frame's height at the widest point. Centre offsets scaled with the height. "Merge and return" moved right (x 0.33 -> 0.40) because she is larger | `actB_float.js` `CK` |
| 116.6-117.95 upside-down road text | main's text fades out 115.0-116.0 in the top-down shot (the road line stays); it is back in 07 B's low shot, where it reads the right way | `actB_float.js` `top` |
| Banach-Tarski: lattice holds one pose | every cell is bound to the bone it lies on (the capsule it is deepest inside) and rides it: the scored lattice follows her limbs before the lift, the seated one follows them after the seat, turning with the bone. New optional group fields `srcBody(t)`, `dstBody(t)` | `bt.js` `bind`, `qOf`, `ride`; `03_verse1.js`, `05_chorus1.js` |
| ... and a column, larger than her | capsule radii are her outline (waist, neck, two legs, thinner arms), a cell is kept only if it lies inside the outline by 0.3 cell sides, cell side 7.5 cm (was 9): 199 pieces at the split (5 unfilled), 229 at the fold (0 unfilled) | `bt.js` `BONES`, `INSET` |
| 0.5 / last frame: hair over the back disc | figure-level: see "Requests for the figure owner". Left as is | |
| Lives: eyes lead the head turn | `eyesLead(track, time)`: from track 4.35 her gaze is where her head WILL be relative to her chest 0.22 s later: the eyes are in the corner about four frames before the head follows. Same helper for the hero's two look-backs (`sprint_stop_look` from 6.0: verse B and 05 D, 91.8) | `03_verse1.js` `headTurn`, `eyesLead`, `K.shared.eyesLead`; `05_chorus1.js` D |

## Found in the re-check and fixed
| where | what | fix |
|---|---|---|
| 57.5-60.1 roll call | with `face` five of the six look-backs ended with the BACK of her head to the lens (a black ball; her head ends about 152 degrees round to her right, 130 degrees for a view of the face would need her body turned less) | `LIFE[..].rface` (roll call only): body turned so the look-back ends 40 degrees past the lens: a three-quarter face looking back down her road (screen left), as jade/wushu always did. nasa keeps `face`: her arms hide her face from every side |
| 43.3-45.3 release | "I sent ahead" began under her raised right hand | lyric 3 moved right and up (x -0.2 -> -0.11, y 0.3 -> 0.44): clear of her hand, row 2 above jade/piano's head |
| 75.0-75.5 chorus A | the end of "BACK TO MAIN" reached the head of the sibling who runs in from the left to fuse on the cut | line 7 is three rows (MERGE ME / BACK TO / MAIN, y 0.33): the block ends at NDC x -0.25, clear of every runner's head |
| 123.5-125.3 roll (silhouette) | open eyes: the whites stayed lit on the dark face | her eyes close as the burst comes up (calm, 123.19-123.74) |

## Re-check, shot by shot, with the anime figure (strips `base_*.jpg` before, `v1..v5`, `final_A/B.jpg`, `m1..m4.jpg` after)
| shot | faces, gaze, hair, type |
|---|---|
| 0-14.0 root, forks, crane | backs only. Hair falls straight; the disc shows between the curtains, its top third covered (request 1). No type |
| 14.0-24.5 tree from above | no bodies |
| 24.5-27.9 fall | she is a body from 26.2, seen from behind; pulses and pool as above |
| 27.9-36.6 verse A | rear three-quarter, no faces to the lens. Lyric and counter in the sky above every head. Lattice checked at 20 fps (`v2_bt.jpg`) and 15 fps from the clip (`m4.jpg`) |
| 36.6-41.9 side truck | profile, determined at 20 % (night), hair streams; the brake and look-back: eyes first (same helper). "the night could hold" stays above the far runners' heads (38.5: 5 % of frame height clear) |
| 41.9-45.3 release | from behind; lyric moved off her hand (above) |
| 45.3-47.1 comets | no bodies |
| 47.1-55.8 lives, one bar each | piano, violin, poet, band: three-quarter faces, neutral, read well at 720p. nasa: her arms hide her face (the pose) |
| 55.8-57.5 home | low camera, head tipped back: eyes read as closed arcs from below; black disc under the chin 57.2-57.5 (request 2) |
| 57.5-60.1 roll call | faces to the lens in five of six beats (above), eyes in the corner before the head; one continuous look-back across the cuts (`m3.jpg`, 0.1 s) |
| 60.1-69.7 top-down, dive | no bodies; the line as above |
| 69.7-75.8 chorus A | low front: faces from below, determined at 20 %, her own forearm crosses her face on the arm swing (natural). Line 7 in three rows; nearest approach of a head is 74.83-74.9, about 30 px (720p) below the end of "BACK TO" (`m2_5A.jpg`) |
| 75.8-83.6 braid | no bodies |
| 83.6-89.5 fan | profiles, hair streaming; "FOLD ME IN AGAIN" ends 80 px (720p) left of her head. Lattice body-sized, rides her legs to 87.42 |
| 89.5-97.5 "Nothing that I lived" | front, calm; eyes go to her right at 91.85, the head follows from 92.1 (`v4_mix.jpg`); from 92.8 the back of her head is to the lens (she looks down her road: the shot's idea) |
| 97.5-117.95 float | eyes closed, calm, strand hair; body 20.8 % at the widest (camera 12.6 m, `m4.jpg` every 0.45 s); lyrics clear of her; road text gone before it is upside down |
| 117.95-125.3 rise, roll | head thrown back, seen from below: the face is a pale oval with few features 118.0-120.0; eyes open 120-123.2; closed from 123.7 as she goes to silhouette |

## Motion check
- `work_fable/out/r3_AB.mp4`: 0-125.4 s, 1280x720, 30 fps, mb 4, audio; 121 s to render. `final_A.jpg`, `final_B.jpg`: one frame every 1.4 s of it.
- `m1.jpg`: the fall 25.6-27.2 (0.1 s): the comet comes up the road, the pool swells on each beat, no pop into verse A; "Where" 59.87-60.2 at 30 fps: the word is written
  across the cut and does not move; the dive 64.3-66.5 (0.2 s): the line holds its place and stays upright while the world turns over at 64.7-64.9; chorus A 74.9-75.7.
- `m3.jpg`: 57.3-60.1 every 0.1 s (home, the six roll-call beats), the roll 123.0-125.2 every 0.2 s. `m4.jpg`: the float 107.2-117.6, the split 29.0-29.47 and the
  fold 86.93-87.4 at 15 fps (the seated lattice follows her legs; nothing is left behind as it fades).
- Not checked: the mp4 played back as video with sound (only frames taken from it); 1080p.

## Still weak (exact times)
- 57.2-57.5: the black disc under jade/home's chin (figure, request 2).
- 58.38-58.82 (jade/nasa-ames in the roll call): the look-back is a head turning behind her raised arms; no face.
- 118.0-120.0: her face is a pale oval from below (head thrown back at the leap).
- 26.0-26.4: better, but still the leanest second of the act (her light, the comet, one road).
- 64.7-64.9: the tree's bright branches pass behind the held line as the camera turns over; legible, not clean.
- 74.83-74.9: a sibling's head passes about 30 px (720p) under the end of "BACK TO" (no overlap).
- 92.8-97.5: the back of her head for 4.7 s (see the figure pass's item on the back of the hair, 195-202: the same shape).
- 43.0-43.7: the orb's warm light is not directional per body (as in r2).

## Requests for the figure owner
1. **0.5 and the last frame (back three-quarter, seq 01 / 16)**: the two back curtains of hair meet over the top third of the jacket's disc (the parting opens below the shoulder line, in a narrow V): the disc reads as a drop, not a circle. RARE EARTH is whole. Opening the parting about 6 cm higher (or 3 cm wider at the disc's top) would clear it.
2. **55.8-57.5 (jade/home, camera 0.66 m, her head tipped back 35-60 degrees)**: seen from below, the neck inside the jaw shadow is a black disc under the chin; at 57.3-57.5 it reads as an open mouth. A jaw shadow in a skin shadow tone (not black) at night would fix it.
3. **97.5-102 and 115-117.9 (float, top-down, close)**: the loose strands by her right ear lie on the water as two dark hooks curling away from the head.
