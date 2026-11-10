# Act E — seq 14 day, 15 map, 16 terminal (bars 137-163, 236.64-282.5 s, 3:57-4:42)

Files: `fable/show/seq/14_day.js`, `15_map.js`, `16_terminal.js`, and the act's people, roads and camera lift in `fable/show/seq/actE_morning.js` (new; `K.shared.actE`).
Status: reworked (2026-11-10). Judged on stills, contact sheets and dense strips; see "Known problems".

```
Q="tracks=free,idle,sprint_loop,run_loop,walk_loop,catch,fork_L,fork_R"      # dev: 7 s start-up (other acts complain about missing tracks)
node fable/tools/render.mjs --show /fable/show/main.js --q "$Q" --res 1280x720 --sheet 236.7:282.4:1.5:work_fable/stills/actE/sheet_actE.jpg:7
node fable/tools/render.mjs --show /fable/show/main.js --res 1280x720 --from 235 --to 282.5 --mb 2 --workers 3 --audio --crf 18 --mp4 work_fable/out/actE.mp4
```

## The idea of the act
- She caught the light facing west, the sun behind her (13_catch). Shot A stays on that axis, so the day arrives BEHIND her in one shot: the sun leaves the top of
  frame, the sky turns from rose to blue (`W.dawn` 0.86 -> 1.0 by b139, plus `env.sun.grad` 1 -> 1.9 which brings the blue down toward the horizon).
  Her light is the day key from the first frame (what 13 ends on), so nothing jumps at the cut except the lens.
- `free` begins and ends facing the same way, and it has to end facing east. The half turn is given to her whirl (track 3.45-5.55 s, b139-b140, where she is
  spinning anyway), about her own centre: `yawAt(t)`, `placeAt(t)` in actE_morning.js (the hips path is the track's own steps turned by the yaw of the moment,
  tabulated at 120 Hz; the track is not edited). So: 3 m west along main toward the lens, the whirl, 10 m south through the leap, the joy and the cartwheel, the stop
  and the turn east (HUB = CATCH + (-4.6, +9.9)), the flourish, the walk east.
- Her dance IS main: `nearR.roads[0]` is written under her feet (the softened hips path), then runs straight east from where she walks on.
- Forks: b141 (the leap's apex) 2, b142 4, b143 8, b144 16, b145 32, b146 64: the hero forks on every bar line and so does every branch. A hero child is there on
  the bar line, already running (out of the leap she comes down running); a runner's child leaves her in step, same stride, and their roads part (she is hidden while she
  is still inside her twin). Loops at their own speed x 0.93..1.07 (`sprint_loop` 4.6-5.3 m/s, `run_loop` 3.2-3.7 m/s): nobody skates.
- Every branch has a place in a fan about east seen from HUB: 42 tips north of main (to 60 deg), 21 south (to 46 deg); a branch's interval is halved at each of her later
  forks. Roads steer toward the centre of their interval (turn radius 3.2 m): the tree again, by daylight. Names are `jade/<next, what-if, try-this ...>` set along each road.
- b147: every branch sends her light ahead (verse 1's line, now by day): the roads race out to 0.5-0.9 km by b152.5 (`farR`). That fan is what the map sees.
- One camera from b144 to the last hit (`makeLift`): a stick (ground point, distance, pitch, azimuth) from behind her shoulder up to the whole film from above. No cut into
  the map; seq 15 is the same shot.

## Shot list (song seconds; cuts on bar lines)
| # | time | bars | camera | what it is for |
|---|---|---|---|---|
| 14A | 236.64-240.12 | b137-138 | west of her on 13's axis, 3.4 m, 0.42-0.58 m high, 38 deg lens; follows her softened | DAY. She faces us, 70 % of frame height, the sun leaving the top of frame, rose -> blue. Stands in the impact, skips (b138), comes at us. BACK TO MAIN in ink exactly where 13 left it (held to 238.65) |
| 14B | 240.12-245.34 | b139-141 | low (0.36-0.5 m) from the south-east of the whirl, tracking back south with her | the whirl (with the half turn), the run, the leap: apex b141 = the first fork: a new branch comes down running and leaves frame; main-Jade lands |
| 14C | 245.34-248.82 | b142-143 | in front of the first new branch and her family, backing away and rising 0.75 -> 2 m, 40 deg | 2 -> 4 -> 8: she becomes two in step on the cut, four on b143; their roads (names readable) part under them; main-Jade cartwheels behind |
| 14D | 248.82-257.51 | b144-148 | the lift: behind her right shoulder (4.5 m) as she stops and turns east, then back and up: 8.5 m (b145), 27 m (b146), 78 m (b147), 185 m by 255.9 | "Back to main" 249.44 in the sky over the fan (frame-locked, right, above the horizon, clear of every runner); 16, 32, 64 roads with their runners; her pencil flourish; b147 the lights go ahead |
| 15 | 257.51-264.47 | b149-152 | the same lift: up and over to straight down by b150 (east right, north up), 4.5 % push, then on the riser (263.16) it falls toward the root | the whole film as one graph. Labels (25 px cap = 34 px mono), one per beat from b150.1: `main`, `1,024 branches`, `merge 1,024 -> 1`, `formation`, `jade/1420-mhz`, `docs: start here`, `64 new branches`, `(HEAD -> main)` |
| 16 | 264.47-282.52 | b153-163 | frame 0's camera (`rootCam(t - duration)`), frame 0's world (`rootWorld`), frame 0's shader clock | cut on the last hit to night, the root, her back. Terminal typed on the beat grid (below). Text gone by 279.25, HUD back by 280.99, then the clean first image |

## The terminal (16)
- 264.55 `$ git log --oneline --graph -6` typed (0.042 s per character), then the six newest lines of `fable/show/gitlog.json` one per beat from b153.3 (31 px mono; graph orange,
  hash gold, refs mint; cut at 54 characters with an ellipsis).
- b155 (267.95) `$ git checkout main` (42 px), b155.4 `Switched to branch 'main'`, b156 (269.69) `$ git merge fable/merge` and the cursor, blinking on the beat, never answered.
- b157 (271.43) credits fade in: `MERGE · JADE Q WANG · RARE EARTH` (Archivo Expanded 46 px), two mono lines (28 px).
- Everything fades b160.3-b161.3 (277.5-279.25); the night comes back to full exposure with it. A soft scrim sits behind the type on the left; she is on the right, untouched.
- The loop: last frame (282.467) vs frame 0 differs only by 0.05 s of the push-in and the film grain (seeded by frame number).
- `gitlog.json` is a snapshot (head 8b0c4d4): run `node fable/tools/gitlog.mjs` before the final render so the six lines are the real last six.

## Shared / engine changes (all additive; defaults keep the old behaviour)
- `fable/engine/src/sky.js`: `env.sun.grad` (default 1) scales the elevation used by the sky gradient: > 1 brings the zenith blue down toward the horizon. Uniform `uSkyK` (the mirror uses the same GLSL).
- `fable/engine/src/main.js`: `frame().clock` (default = song time): the clock the shaders see (stars, ripples, fibres, road flow). 16 passes `t - duration` so the last frame is frame 0.
- `fable/show/main.js`: passes `F.clock` through.
- World: nothing changed. 14/15 hide the world's own `out` set (the v1 outro tree) and draw the morning's roads instead; `W.outCount` is no longer used by this act.

## Known problems
(see the end of this file; kept current)
