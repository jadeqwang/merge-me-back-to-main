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

## Next / open
- motion strips of every cut 3:01-4:42, final clip, composition strip.
