# I1 — integration: the real figure in the whole film (v1)

The stand-in capsules are gone from the film. Every body on screen is the real `Figure` (`fable/engine/src/figure/figure.js`) playing
the baked tracks in `work_fable/tracks/` at song time. Nothing in `fable/engine/**`, `fable/tools/**` or the tracks was edited.

## Commands
```
# stills (27 s start-up: 40 tracks are simulated once per page)
node fable/tools/render.mjs --show /fable/show/main.js --res 1280x720 --stills 153.2:work_fable/stills/i1/x.png
# the film
node fable/tools/render.mjs --show /fable/show/main.js --from 0 --to 282.5 --res 1280x720 --fps 30 --mb 2 --workers 3 --audio --mp4 work_fable/out/v1.mp4
# contact sheets (one frame every 2 s, 7 columns, 480 px tiles)
node fable/tools/render.mjs --show /fable/show/main.js --res 1280x720 --sheet 0:96:2:work_fable/stills/v1/sheet_1.jpg:7      # then 98:194 -> sheet_2, 196:282 -> sheet_3
# fast animatic with the old capsules / only some tracks / four tracks on a turntable
... --q "standin=1"        ... --q "tracks=idle,violet"        ... --q "dev=cast&dawn=0.6&a=idle&b=violet&c=float&d=build"
```

## What changed
- `fable/show/cast.js`: same interface (`begin`, `actor(id, {lane, variant}).set({...})`, `crowd(id, n).put(i, {...})`, `drawables()`), new backend.
  `makeCast` is now async (`kit.js` awaits it). It loads every track once (`TRACKS` list in the file, `_*` never, a missing file is skipped with a
  console line; the harness's static server cannot list a directory, see "patches" below), builds ONE `Figure`, `addTrack`s all of them
  (40 tracks, 22,682 frames; 0.6 s to load, 26-28 s to simulate), and every frame turns the live actors and crowd members into `fig.add(...)`
  calls; `drawables()` returns `[fig]`. `?standin=1` keeps the old capsule (it follows the track's hips, so travel, sitting and lying still read).
- Mapping: `track` + `time` -> figure track + time (loop tracks are wrapped in JS so the shader never accumulates loop drift; others clamp);
  `lane` (a LANE name, or a road colour `[r,g,b]` matched to the nearest lane) -> the figure's `LANES` colour; `variant: 'violet'` -> `'bun'`;
  `pos`, `yaw`, `scale`, `density`, `solid`, `visible`; new pass-throughs `alpha` (presence; what the animatic used `density` for when it faded
  a body), `gain`, `vary`, `trail`. `seed`: actors = hash of the id (`'hero'` = 0, the canonical her), crowds = `i + 1`.
  Defaults are `density 1, solid 1`: the figure's light follows the engine's dawn (nothing in the show overrides `figLight`).
- Stand-in-only parameters are gone from every sequence: `tilt`, `squat`, `arms`, `reach`, `cel`, `color` (a road colour is now `lane`),
  `K.look`, `K.shared.POSE`, the procedural `perf()` of the build/drop.
- Helpers on cast for tracks with root motion: `root(track, time, joint)`, `rot(yaw, x, z)`, `origin([wx, wz], yaw, [x, z])`,
  `hips(track, time, pos, yaw)`, `dur`, `meta`, `speed`, `songT0`, `event`, `has`.
- `kit.js`: `K.loopFor(v)` (the loop whose own speed is nearest), `K.loopClock(posAt, t0, t1, track, {lo, hi, anchor})` (a loop's phase
  advances with the ground she covers, rate clamped, tabulated once, so `frame(t)` stays pure and feet do not skate while the world moves her
  near the loop's speed), `K.ride(track, time, roadFrame)` (a root-motion track ridden along a curved road: the road carries the forward travel).
- `main.js`: passes dawn to `cast.drawables(dawn)` (only the stand-in uses it); `dev=cast` shows four tracks.

## Rules the sequences now follow
- Song-timed tracks play at `time = t - meta.song_t0` (read from the track, not typed in).
- A camera that used to follow the world's hero point follows HER hips wherever a track with root motion moves her (same offsets, same lens).
- Where she is ahead of or behind the world's write head because her track brakes or runs at its own speed, that one road's head is pinned
  to her feet (`world: { main: { head } }` in 05 C/D, `violet: { head }` in 11), so "the road is written under her feet" stays true.

## Per-sequence track table
| seq | time | who | track(s) and clock |
|---|---|---|---|
| 01 root | 0-14.0 | hero | `idle` (time = t) until 2.60; `fork_L`/`fork_R` pair (hero + twin, `vary 0`), step lands (track 1.0) on b3 = 3.604; from 5.10 both `walk_loop` out along their roads (the 0.9 m side step melts into the road over 3 s), `alpha` fades b5-b7 |
| 02 tree | 14.0-27.9 | hero | `sprint_loop` (only seen in the last bar of the swoop) |
| 03 verse 1 | 27.9-55.8 | hero | `sprint_loop` on the hero clock; the last fork (28.62, "split") = hero + `jade/piano` in step, parting with their roads; `sprint_stop_look` frames 0-4.2 as the brake (36.63-40.83, real root motion); `release` from 40.83, accent 2.5 on "light" 43.33 |
| | 47.5-55.8 | six lives | `life_piano`, `life_violin`, `life_wetlab`, `idle` (jade/phd: no track), `life_poet`, `life_nasa`; shots before the shared clock starts show the activity from their own cut (`t - cut + 0.5`), the last two are on the shared clock |
| 04 pre-chorus | 55.8-60.1 | five lives | `life_band`, `life_wushu`, `life_poet` (jade/chez-jj: no track), `life_stage` (sandstorm), `life_home`; all at `time = t - 52.53`, so the look-back (track 4.5) begins on "remembers" 57.03 |
| | 60.1-69.7 | - | no figures (top-down pulse, dive) |
| 05 chorus 1 | 69.7-85.6 | hero, merge sibling, 8 afterimages | `sprint_loop` (clock capped at 1.3x) |
| | 85.6-97.5 | hero (+ afterimages) | `sprint_stop_look`, song_t0 85.6, own root motion along main: at rest on the 89.80 hit, look-back from 91.8, held |
| 06 float | 97.5-111.4 | hero | `float`, song_t0 97.513, head on the hair-graph's origin, head east |
| 07 download | 111.4-118.4 | hero | `float` to 116.0, then `rise` (song_t0 116.0), same place and heading |
| | 118.4-125.3 | hero | `rise` continues (accent = the cut, b69), yaw 0.35 as the animatic had her |
| 08 build | 125.3-147.9 | hero + 2..1,024 | `build`, song_t0 125.343, everyone in unison (canon 0.02 s/m in the side truck b77-80 only). `land` is wired for t < b73 but no shot shows FORM before b73 |
| 09 coil | 147.9-153.2 | 1,024 | end of `build`; `drop` from b88.3 (152.30), where the two tracks are identical |
| 10 drop | 153.2-181.0 | 1,024 | `drop`, song_t0 151.669, unison (canon 0.012 s/m only in the lift-off b93-96). Performed around `meta.center`: from b93 a copy's slot is where her centre stands (rings -> MAIN cells + 0.82 m), so the b97 dive lays each body on its cell. The half turn to the sun is applied in the air of the b103 jump (takeoff 177.147 -> landing 177.664), about her centre; salute b104 faces east |
| 11 violet | 181.0-208.8 | violet (bun, lane violet) | `violet`, song_t0 180.995, one take, ridden along her road so that she stands 0.3 m from its end |
| 12 flight | 208.8-219.3 | - | no figures |
| | 219.3-222.7 | main-Jade, 1,023 | `idle` (time = t - 220) then `catch` from 220.0; crowd `idle` at `t + i` |
| 13 catch | 222.7-236.6 | main-Jade, crowd | `catch`, song_t0 220.0 (impact 222.735, head 229.6, open 232.71); folding copies `run_loop`, turned toward her |
| 14 day | 236.6-257.5 | hero | `free`, song_t0 236.648; origin placed so that her stop for the second "Back to main" (249.44) is on main, 2 m before the fork point; she starts 9.8 m off main |
| | | new branches | `sprint_loop` (their ground speed is 5-8 m/s; `K.loopFor` picks) |
| 15 map | 257.5-264.5 | - | none |
| 16 terminal | 264.5-282.5 | hero | `idle`, time = t - duration: the last frame is frame 0 |

## Deviations from the brief (and why)
- Verse 1 uses `sprint_loop` (the ACCAD run, 4.93 m/s), not `walk_loop`/`run_loop`: the world moves her at 4.7-5.6 m/s there, a walk would skate 4x.
- Verse 1's fork is not `fork_L/R` (a standing side step): she is running at 5 m/s. It is two runners in step parting with their roads.
- The outro's new branches run (`sprint_loop`); `fork_L/R` is not used there (the hero is mid-`free`, airborne on b141).
- `land`: its fall (124.85-125.34) lies in the last half second of seq 07, which is still at the float; only its impact frame (= `build` frame 0) exists in a shot.
- All 1,024 do the b89 butterfly with her (the animatic held the crowd in the coil for bar 89).
- Lives stand still for their shot (road frame at the cut); the animatic slid the stand-in along at 4.7 m/s.
- Commits contain only the files of this workstream (`cast.js`, `kit.js`, `main.js`, `seq/*`, this note); `fable/show/reel.js` had another agent's uncommitted edits and was left alone.

## Camera / type changes (minimal, only where the real figure made the frame wrong)
1. 11 C (194.9-201.9, the writing): camera and target moved 0.45 m back along her road (`K.rel(fr, 0.55, ...)`, was 1.0): her head left the frame's left edge at the end of the push-in.
2. 05 C/D (83.6-97.5), 03 B/C (36.6-47.5), 11 (all), 14 A/B: the camera's anchor is her hips instead of the world's hero point (same offsets). Framing unchanged while she is on the world's clock.
Nothing else was re-framed; no type was moved.

## Patches wanted elsewhere (not applied; I do not own these files)
- `fable/tools/render.mjs`, in `serve()`: a listing endpoint so cast can discover tracks instead of carrying `TRACKS`:
  `if (u === '/__ls') { const d = path.join(ROOT, new URLSearchParams(qs).get('dir') || ''); res.writeHead(200, {'Content-Type': 'application/json'}); res.end(JSON.stringify(d.startsWith(ROOT) && fs.existsSync(d) ? fs.readdirSync(d) : [])); return; }`
  then in cast.js: `names = (await (await fetch('/__ls?dir=work_fable/tracks')).json()).filter((f) => f.endsWith('.json') && !f.startsWith('_')).map((f) => f.slice(0, -5))`.
- Figure: a two-track blend per instance (`track2`, `time2`, `mix`) would remove the pose pops at track hand-overs listed below; a `mirror` flag would let
  `violet` look to her right (see 190.8). Start-up: the sim of all 40 tracks costs 26-28 s per page; a cache of `sim` keyed by track mtime (or skipping
  tracks no sequence names) would bring stills back to ~3 s.
- Tracks wanted: `life_phd`, `life_chezjj`; a run-to-stand that ends on a given spot from a constant-speed run; `fork` from a run.

## v1 render (2026-11-10)
- `work_fable/out/v1.mp4`: 1280x720, 30 fps, mb 2, 3 workers, audio; 8,475 frames in 249.8 s = 33.9 fps overall.
  Per frame: 69 ms render + readback on each worker, 2 ms encode pipe. Start-up 29 s per worker (track sim). 899 MB (crf 14).
- Contact sheets: `work_fable/stills/v1/sheet_1.jpg` (0:00-1:36), `sheet_2.jpg` (1:38-3:14), `sheet_3.jpg` (3:16-4:42); one frame every 2 s, 7 columns.
- Check stills and montages used while integrating: `work_fable/stills/i1/` (`m_*.jpg`).
- Stand-in mode (`standin=1`) starts in under 2 s.

## Track hand-overs (pose jump measured on the tracks, largest joint)
| song time | from -> to | jump |
|---|---|---|
| 2.60 | `idle` -> `fork_L/R` | 0.10 m |
| 5.10 | `fork_L/R` end -> `walk_loop` | 0.46 m (a visible pop; she goes from standing to mid-stride in one frame) |
| 36.63, 85.6 | `sprint_loop` -> `sprint_stop_look` frame 0 | 0 |
| 40.83 | `sprint_stop_look` at rest -> `release` | 0.11 m |
| 116.0 | `float` -> `rise` | 0 |
| 152.30 | `build` -> `drop` | 0 |
| 220.0 | `idle` -> `catch` | 0.03 m |
`land`'s impact frame and `build` frame 0 differ by 1.1 m (standing touch-down vs deep crouch): they cannot be cut together on b73 as they are.

## Known problems in v1 (judged on stills and the three sheets; the film was NOT watched in motion)
Motion / performance
- 0:05.1 fork -> walk pop (above). 0:06-0:08 the two walkers are cut by the bottom of frame as the crane lifts, then 0:08-0:14 nobody is in frame.
- 0:28-0:40 and 1:10-1:25 she sprints through verse 1 and chorus 1 because the world moves her at 4.7-5.6 m/s (verse) and 12-46 m/s (chorus A/B):
  in the chorus her legs run at 1.3x while the ground goes by up to 9x faster (skating, hidden mostly by the camera riding with her).
- 0:36.6-0:40.8 she brakes with real root motion and stops 7.1 m short of the world's pause point (camera, release glow and the following shots sit on
  her; the road's write head is up to 10 m ahead of her before she releases the light at 43.33).
- 0:48 `life_piano` sits on air (no bench, no keys); 0:52 jade/phd is plain `idle`; 0:58 jade/chez-jj reuses `life_poet`. The props of band/wet-lab/poet are missing too.
- 0:47.5-1:00 the lives stand still on roads whose lights keep moving; each life's pose changes at every cut (one life per 1.3 s), so the verse-1 shots show ~1.3 s of each mime.
- 1:25.6 the camera's travelling speed drops from 6.1 to 4.8 m/s in one frame when the track's own root motion takes over.
- 1:31.8-1:37 look-back: her chest stays toward the camera and her head turns away from it (the animatic turned the whole body 150 degrees to face the roads).
- 2:05.3 the landing is never seen: the shot begins on `build`'s crouch. 2:07-2:27 at every bar line the new copies slide 2.2 m sideways in 0.4 s while performing (the doubling is still a positional lerp); 2:24-2:28 and 2:40-2:46 everyone slides to new slots while performing.
- 2:33-2:40 the hero's "solo" is not a solo: all 1,024 do the butterfly and the phrase with her.
- 2:57.1-2:57.7 the turn to the sun is a procedural half turn during the jump: the jump's own travel is bent into a small arc.
- 3:10.8-3:14 `violet` looks to her LEFT; on this road east (the glow) is 32 degrees to her right. 3:16-3:21 her hand writes across her chest
  (her left to right) but the line of light is drawn along her heading, ahead of the hand, as the animatic placed it; the light leaves from that line, not from her hand.
- 3:27-3:29 `density` falls to 0.22 (the animatic's "constellation"): on the real figure this only thins the fibre shimmer.
- 3:44-3:49 the folding copies cover up to 75 m in 0.9 s on `run_loop` (streaks, legs at walking cadence for that speed).
- 4:00-4:04 she dances 5-10 m off main (no road under her) and reaches main at 4:09; 4:03.6 and 4:07 the new branches step out of her as a tight overlapping cluster.
Framing / type (not touched)
- 0:00 and 4:42: 3/4 back from her LEFT (F3: RARE EARTH reads better from her right); feet touch the bottom edge.
- 0:32 the sibling runner fills the right foreground, cut at the knees. 0:42-0:45 release: she is cut at the knees, right of frame.
- 0:54-0:55 lyric lines 4 and 5 are drawn on top of each other. 0:52 a bokeh light sits on her head.
- 0:54, 0:58, 1:00 seated lives are small and low in frame (under 1/3 of frame height).
- 1:30-1:37 the crane lifts off her: head and shoulders at the bottom edge by 1:34, only the top of her head at 1:36.
- 2:00 her raised hand touches the top edge. 2:32 the camera comes down the aisle through bodies cut by the frame.
- 3:08-3:14 she is cut at the knees/thighs and barely moves for 4 s. 3:16-3:21 cut at the hip. 3:26-3:29 she is about 1/7 of frame height.
- 3:54-3:56 "I HAVE BECOME" runs into her arm; 3:56 "BACK" arrives over the sunrise shot. 3:58-3:59 "BACK TO MAIN" touches her head.
- 4:12-4:17 she is a dot. 4:36-4:40 the credit line ends on her body.
