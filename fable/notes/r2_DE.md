# Round 2, Acts D + E (seq 11-16, 3:01-4:42): fix pass on NOTES_v2.md

Working notes of the r2 pass (2026-11-10). Task list: `fable/NOTES_v2.md` sections "Act D" and "Act E" + the motion check.
Stills / strips: `work_fable/stills/r2_DE/` (git-ignored). Clip: `work_fable/out/r2_DE.mp4`.

```
Q="tracks=free,idle,sprint_loop,run_loop,walk_loop,catch,violet,sit_idle,run_from_stand"    # dev: fast start-up for 3:01-4:42 (other acts complain about missing tracks)
node fable/tools/render.mjs --show /fable/show/main.js --q "$Q" --res 960x540 --sheet 236.5:245.3:0.2:work_fable/stills/r2_DE/e1.jpg:9     # motion strip
node fable/tools/render.mjs --show /fable/show/main.js --res 1920x1080 --stills 263.0:work_fable/stills/r2_DE/map.png                     # the map at full size
node fable/tools/render.mjs --show /fable/show/main.js --from 181 --to 282.5 --res 1280x720 --fps 30 --mb 4 --workers 4 --audio --mp4 work_fable/out/r2_DE.mp4
```

## Done (note by note)

### Act D
- **3:37-3:41 sparse** (`12_flight.js` `comets`): 18 lights in the lane colours come in from both sides of main (bearings 12-62 degrees, alternately north and south),
  bend onto main and land among the thousand between 219.9 and 221.1. Head + 0.48 s tail, low over the mirror (their reflections join them). A weak warm pool on
  the ground beyond CATCH warms the horizon from 216.5.
- **3:41-3:42.7 sun** (`12_flight.js` `sunHeld`, `13_catch.js` `sunAt`): `env.sun.elev` is held at -0.195 rad (disc just under the line, its glow on) through the end
  of the flight and the wait; on the hit it is released: `1 - exp(-(t - 222.735) / 0.45)` toward the sky's own track (rim over the line in two frames, in place by ~1.5 s).
- **3:48.4-3:49.7 empty wide** (`13_catch.js` `camC3`): C3 now begins on b132.2 (228.387), the beat the last 512 come home: waist-up on her, the violet note between
  her hands going into her chest, the sun behind her; from 229.3 it eases back to the old medium by 232.4 as her head lifts and her arms open. The cut on b133 is gone.
- **3:56.6 handover** (`14_day.js` shot A, `12_flight.js` `cT`): the pose pop (catch: arms wide -> free: arms down, same axis) is covered: the cut lands on her feet and
  the first metre of main (hands out of frame), and the camera rises to the old frame A in 1.4 s, in time for the skip on b138. `catch` no longer clamps (it froze
  from 236.0): after "become" it plays at 0.84 x to the cut.

### Act E
- **4:00-4:04 pivot foot** (`actE_morning.js` `placeAt`): the added half turn of the whirl now pivots on the supporting foot (was: about the hips). Planted-foot speed
  over the ground through the whirl: mean 0.26 -> 0.11 m/s, pivot foot (R, 240.7-241.5) 0.3 -> 0.08 m/s (what is left is the capture's own).
- **4:02 crouch** (`14_day.js` shot B2): cut on b140 (241.865) to her front quarter, low, in her path, backing away with her: the gather is seen from the front (legs
  apart), the leap comes at the lens, the first new branch runs off east behind her.
- **4:09-4:12 children at full stride** (`actE_morning.js` `make(..., rfs)`): the three branches that leave her while she stands (b144, b145, b146) start from a stand
  with `run_from_stand` (idle pose at frame 0, three accelerating strides, `run_loop` from 1.5 s on its phase), facing the way she faces, their road steering to their
  place in the fan. `cast.js` TRACKS: + `run_from_stand` (additive).
- **4:14-4:19 fan** (`actE_morning.js` `makeLift`): the stick stays on her to the end of "Back to main" (255.885): 4.5 m (b144), 5.6, 7.2, 9.5, 14 m. Then one
  pull-up over two bars to the map; the ground point slides from her to the map centre in proportion to the distance, so main stays under the centre.
- **4:18-4:24 map** (`15_map.js`): labels 33 px cap (45 px mono), re-placed in clear ground (positions read off a 1080p still), `formation` has a leader to its rings.
  Ground: deeper cream base, a wide warm pool under the graph, an orange aura along main, fork-node pools (ground glows need dawn < 0.92: the map sits at 0.88 with
  the day grade and ink roads), the mirror's slow variation at 0.3, vignette 0.24.

## Decisions
- No new tracks baked. The handover pop is covered by the camera, not removed (a `free` that began arms-open would remove it).
- "Children at full stride: stride scaled to their size" was read as: they must not appear at full stride beside a standing her; they accelerate from a stand.
- `(HEAD -> main)` sits over main's east end (not after it): after it, it ran to 30 px from the frame edge at this label size.
- The pull-up keeps the FAN centred (ground point 0.22 R east of her, on main) until 600 m, then slides west to the map centre: with the point sliding west from the
  start, 256.4-258.0 was a half-empty frame with the fan at its right edge.
- Lyric 25 (`BACK TO MAIN`, shot D) is capped at y 0.68 so it clears the HUD; it leaves 0.15 s after the word ends (255.885) as the horizon rises through it.
- The sun's disc is dimmed (gain 0.3) from 254.9 through the map: its reflection was a peach smudge in the lower right of the pull-up. Still faintly there 256.4-256.9.
- Ground glows (`W.glow`, `canopy`) are multiplied by (1 - ink) in the engine, so they draw nothing at full day. The map lowers `env.dawn` to 0.88 (glows at 20 %),
  passes the day grade and `ink: 1` for every road set explicitly. No engine change.

## Motion check (dense strips, `work_fable/stills/r2_DE/`)
- `m3_cuts.jpg`: every cut 3:01-4:42 (b109, b113, b118, 210.96, b128, b130.3, b132.2, b137, b139, b140, b142, b144, b153), 6 frames each (-0.2 .. +0.2 s).
  No pose pop left in view: 236.648 goes arms-wide -> feet; the others are the same take across the cut.
- `m2_whirl.jpg` (240.15-242.45, every 0.1 s, cropped on her): the half turn; feet stay on the road's marks through the pivot (numbers above).
- `m4_leapC.jpg` (242.0-248.65): the gather from the front, the leap, the fork at the apex (two bodies overlap 243.69-243.82, as before), shot C.
- `m1.jpg` (248.55-253.2, every 0.15 s): the three standing starts (b144 to the right, b145 behind her right shoulder along main, b146 to the right).
- `m5_lift.jpg`, `m6_lift.jpg`, `m7.jpg`: the lift, the pull-up, the map's labels arriving, the dive.
- `d1.jpg`, `d2.jpg`, `d3.jpg`: the comets, the held sun and its break on 222.735, the new C3.
- Map at 1920x1080: `map2.png` (263.0). Label cap height 33 px; nearest road to any label >= 20 px.

## Still weak (times)
- 3:41.0-3:42.7 with the sun held under, the thousand are lit grey-violet, not silhouettes; they turn to silhouettes on the hit.
- 3:56.65-3:57.4 the feet shot is a still body (the take stands still for its first second); only the camera, the road's ring and the flash move.
- 4:03.7-4:03.8 two bodies overlap in the air at the fork (unchanged).
- 4:05.3-4:08.8 shot C: the runners are about 35-40 % of frame height, and the wider family crosses the frame edges (unchanged from v2).
- 4:10.6-4:12 the b145 branch leaves along main straight away from the lens, half hidden by her for its first second.
- 4:16.4-4:18.0 the pull-up: people are specks from 4:16.6; the frame is the fan's rays with main under the centre, the sun's reflection a faint smudge lower right.
- 4:17.6 the hero's take ends (she stops walking) when she is under two pixels tall.
- Map: `formation` is 150 px from its rings (leader line); the violet road is still the world's version of its last 500 m (see actD.md).

## Outputs
- `work_fable/out/r2_DE.mp4`: 181.0-282.5, 1280x720, 30 fps, mb 4, audio (3,045 frames, 140 s to render). `work_fable/stills/r2_DE/final_sheet.jpg`: one frame per 2 s from it.
- Loop seam re-measured after this pass (720p stills): frame 0 vs frame 1 MSE 21.35, frame 0 vs last frame (282.4667) 22.44: unchanged. `16_terminal.js`, `11_violet.js`
  and `gitlog.json` are untouched.
- Dev track list: other acts' sequences now need their own tracks at set-up (`05_chorus1.js` fails without `sprint_stop_look`): add it to `Q`, or render without `--q`.
