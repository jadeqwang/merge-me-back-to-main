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

## Act B: in progress
