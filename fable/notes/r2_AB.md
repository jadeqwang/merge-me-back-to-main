# Round 2, Acts A and B (seq 01-07, 0:00-2:05). Working notes

Task list: `fable/NOTES_v2.md` (Act A, Act B). Stills and strips: `work_fable/stills/r2_AB/` (git-ignored). Final clip: `work_fable/out/r2_AB.mp4`.
NOTE: the times in NOTES_v2 were read off `sheet_1/2.jpg`, whose labels run about 1 s late (the "0:28" cell already shows 512, which lands at 28.62).
Times below are song seconds.

## Commands
```
# exact-time strips (one browser start, any list of times): a small wrapper round --stills + ffmpeg tile; or the harness's own --sheet
QA="tracks=idle,fork_go_L,fork_go_R,walk_loop,run_loop,sprint_loop,sprint_stop_look,release,life_piano,life_violin,life_poet,life_nasa,life_band,life_wushu,life_stage,life_home"
QB="tracks=sprint_loop,sprint_stop_look,float,rise,idle,run_loop,walk_loop,land,build"
node fable/tools/render.mjs --show /fable/show/main.js --q "$QA" --res 1280x720 --sheet 24.5:29:0.125:work_fable/stills/r2_AB/x.jpg:8
node fable/tools/render.mjs --show /fable/show/main.js --from 0 --to 125.4 --res 1280x720 --fps 30 --mb 4 --workers 4 --audio --mp4 work_fable/out/r2_AB.mp4
```
The harness drops any page console line that contains "404" (its favicon filter): a debug print with such a number in it silently vanishes.

## Act A: done
| note | what changed | where |
|---|---|---|
| 0:10-0:13 walkers 10 % | the little tree's fan is 60 degrees (was 98): the eight are 12 m abreast at b9, not 17. The crane rises to 4.1 m (was 6.6) and follows them east instead of backing away: walkers about 30 % of frame height from b5 to the cut on b9 (kept on the kick) | `01_root.js` `LEAF`, `crane` |
| (found in motion) | at b5 and b7 EVERY walker vanished for 2-6 frames: `heir` compared colour arrays by identity, never true, so both children of a fork were hidden until 3 cm apart. Now by lane value, exactly one heir per fork | `01_root.js` |
| 0:26-0:28 swoop | one move, no keys: gaze slides from the tree to her tip (by 25.7), distance to it falls log-uniformly 1,540 m -> 10 m, tilt from straight down to seq 3's camera; from 27.5 it IS `K.shared.followA(t)`. A pool of main-orange of constant screen size marks her tip until she is a body (26.6). The big counter leaves as the fall begins (HUD carries the count) | `02_tree.js` |
| 0:28-0:34 verse A | camera low (1.2 m, level), rear three-quarter from her right: whole bodies. violin steps out to the far side on "split", piano to the near side and poet beyond violin on "thousand": a diagonal of four, nearest 60 %, farthest 22 %. The counter is in the sky upper right, on the lyric's baseline (`K.shared.counter(t, alpha, { top: 1 })`) | `03_verse1.js` `camA`, `02_tree.js` |
| 0:43-0:45 orb | three nested halo discs round the core (0.12 / 0.17 / 0.25 m); `orbLit(t)`: warm rim from the orb's direction + warm ambient lift + accent gain on her (figLight for the frame), a pool on the mirror; swells as it gathers, peaks on "light", falls with distance squared | `03_verse1.js` |
| 0:56 home | camera 3.0 m (was 4.5): seated she is about half the frame with her arm; the orrery hangs 0.72 m from her shoulder (was 1.2; `props.orrery` new option `reach`) so it still fits | `03_verse1.js` `LIFE`, `props.js` |
| 1:04 "from" upside down | the ground line leaves before the dive turns over it (out 64.17, gone by 64.52). It was held to 66.2 while the camera flipped 180 degrees at 64.6. Costs rule 3 the last 1.5 s of the held "from" | `04_prechorus.js` |

## Act B: done (motion check pending)
| note | what changed | where |
|---|---|---|
| 1:29.5-1:37 "Nothing that I lived can come undone" | one slow push straight at her on a fixed bearing, 7.5 m -> 4.8 m, eye height 1.25-1.3 m: whole body, 37 % -> 55 % of frame height, she in the right third, her road's vanishing point left of centre. Locks on eighth notes from 90.78, toward us; the LAST under her feet on b55.1 = 94.039 = the "d" of un-DONE (measured in `analysis_v2/stems/vocals_roformer.wav`: nasal 93.80-93.96, burst 93.98-94.04); ring + pool + accent flash there; through the held note the locked road breathes on the beat. The gaze pulse (it ran the other way) is gone. Lyric is four rows (NOTHING THAT / I LIVED / CAN COME / UNDONE, cap 66 px): the three-row block reached her head | `05_chorus1.js` `camD`, `locks` |
| 1:48-1:55 | float camera keys: widest 24 m held about a bar round "return" (was 26 m at 111.43, 12 m still at 115.3); from the hats it comes home with the pulses: 16.5 m b65.3, 10.5 m b66.1, 7 m b66.3, 4.6 m 115.3, 3.3 m at 116.64. The pool under her is scaled down when the lens is close (it filled the frame) | `actB_float.js` `CK`, `near` |
| 1:56-1:58 sit-up | the top-down shot runs on to b68.4 (117.952), rising with her (3.3 -> 4.9 m): the sit-up is seen only from straight above. Cut to the water line on b68.4: she is upright, arms opening, one beat before the leap | `actB_float.js` `CK`, `07_download.js` `tCut`, `camR` |
| 2:03.5-2:05.3 | the camera stays low (1.15 m) and backs off to 7 m instead of lifting to 15 m: she is a third of the frame, head above the horizon. From the roll she goes to silhouette (ambient, emissive, fibres down; band and rim kept) while the strands and the dawn come up behind her; ground pool 0.9 (was 2.4). The white still lands on b73 | `07_download.js` |

## The Banach-Tarski egg (added by the director mid-pass, for the musician)
`fable/show/seq/bt.js` (`K.shared.bt`): `BT.event({...})` -> `{ draw(b, t), dip(t) }`; strokes go through `props.js`' line renderer (add pass, depth-tested, mirrored).
- A lattice of equilateral triangles, side 9 cm, in the plane facing the lens 0.34 m in front of her hips, clipped to the skeleton's bones as capsules seen
  from the lens (173 cells at the split, 225 at the fold). Point-up and point-down cells are the checkerboard. The paradox is real geometry: the outlines of
  the point-up cells alone already draw every line of the lattice, and so do the point-down ones, so each half seats as a COMPLETE scored body.
- Pieces are rigid: translate + turn 120 degrees in plane (so they seat exactly); rows lift from the head down; the two streams swing to the far side first
  and cross once (one 12 cm nearer the lens, one farther); they ride each body's ground point, so they inherit her run. A cell whose place moved with a limb
  goes to the nearest free cell; a surplus cell seats on a neighbour (nothing left over); 6 of 173 destination cells stay unfilled at the split, 0 at the fold.
- Split (seq 03): scored 28.49, lifts ON "split" 28.62, seats 29.12 (0.5 s; the bodies are 0.45 m apart by then and go on stepping apart), gold cells on
  jade/violin, orange on main for 0.1 s, seams gold + flash at 29.25, gone by 29.47. Figures at alpha 0.18 from 28.72 to 28.97 (0.25 s). The doubling on
  "thousand" stays plain.
- Fold (seq 05): fan copy 8 (jade/wushu), the one that comes home on b51.1 = 87.08, the downbeat nearest "again" (86.72). Lift b50.4 (86.65): the copy's
  point-up cells in its lane colour, her own point-down cells in orange; seated on her as a two-colour checkerboard 87.08-87.18, gold flash 87.2, gone 87.42.
- Commit messages on the road (road text is caps): `SPLIT: 5 PIECES, NOTHING LEFT OVER` on the right of her road from the split node (9 m, em 0.36, written
  under her feet; about 60 px tall at 1080p as the camera passes, 29.3-30.5); `MERGE: BANACH-TARSKI, INVERTED` south of main from the b51 commit node
  (written under her feet, 87.2-88.7).
- Checked on 30 fps strips (`bt1..3.jpg`, `eggs.jpg`). Weak: the seated lattice keeps the seat pose while she runs on, so in the last 0.2 s of the fade her
  legs leave it.
