# Act C — seqs 08 build, 09 coil, 10 drop (bars 73-104, 125.34-180.99 s, 2:05-3:01)

Files: `fable/show/seq/08_build.js`, `09_coil.js`, `10_drop.js`, and the act's formation + performance in `fable/show/seq/actC_form.js`
(new; `K.shared.actC`). `fable/show/formation.js` is no longer used by this act (seq 12 still imports `N` from it; `K.LANES8` is still set).
No shared or engine file was changed.

## Commands
```
Q="tracks=build,drop,land,sprint_loop,run_loop,sprint_stop_look,idle"     # dev: 8 s start-up instead of 28 (other acts will complain about missing tracks)
node fable/tools/render.mjs --show /fable/show/main.js --q "$Q" --res 1280x720 --sheet 125.4:181:2:work_fable/stills/actC/sheet.jpg:7
node fable/tools/render.mjs --show /fable/show/main.js --from 124 --to 182 --res 1280x720 --mb 2 --workers 3 --audio --mp4 work_fable/out/actC.mp4      # 80 s
```

## The idea of the act
- The hero stands on main; the road is written under her feet (`world.main.head` is pinned to her hips), so the road ends at her: she is HEAD.
- The formation is ONE ground plan of 1,023 slots on concentric half-arcs round her (first ring 7 m, 2.2 m pitch, an aisle along main east and west).
  Slots never move. A slot is filled when its copy is born on a bar line: stages 1-8 fill a quarter fan toward the sun (the wedge, growing outward),
  stage 9 (b82) opens the fan to a half circle, stage 10 (b83) closes it into full rings behind her. So "the wedge opening into rings" is the
  last two doublings, and nobody ever slides to a new slot.
- A copy leaves its parent as a streak: a road in its lane colour written on the mirror in 0.3 s (polar path about her), the copy riding its head
  (alpha and accent gain ramp), then locked. The written roads stay, faint: by b83 the ground under the troupe is the fork graph itself.
- b82: the track's 360 spin is given 195 more degrees (about her own centre; the feet stay within 0.1 m), so from b82.7 the troupe faces the sun
  (`meta.best_yaw` 165 for the butterfly) for the rest of the act. No procedural turn in the b103 jump any more.
- b89: the butterfly is a solo. The copies hold the coil; her landing (153.42) sends a ripple outward (11 ms/m) on which each copy drops to the
  landing crouch with its hips kept in place; unison from b89.5.
- b93: on the downbeat (a cut) everyone runs to her MAIN cell: straight lines, `sprint_loop` at 0.85-1.15 of its own speed (0.85 = feet on the beat)
  or `run_loop` at 0.88 for runs under 8 m; mean run 15.6 m, longest 30.5 m, last arrival 165.50 (b96.1). Ring people are paired with cells by a
  recursive median split + seeded pair swaps (few crossings). On arrival she is in `drop` again, facing east. The hero runs 20 m east along main
  (`sprint_loop` at 1.1, then `sprint_stop_look` from its frame 0: its own braking), stands at 165.1, joins `drop` at 166.40.
- MAIN: Archivo 900 condensed, rasterised into 0.8 x 2.05 m cells, 102 x 29 m, centred on her rings. A body lies along x, feet west, head toward the sun.
  The hero is not a letter: she is the head of main, 6.5 m east of the top of the word, on the road.
- b97: the hero is flat on 167.082; every other body holds the standing `set` pose for `0.4 s * distance / max distance`: a ripple outward from her.
  Under each body a pool of warm light comes on at its impact, so the letters are laid down in light. Clocks are back in unison during the still bar.

## Shot list (song seconds)
| # | time | bars | camera | what it is for |
|---|---|---|---|---|
| 8A | 125.343-132.300 | b73-76 | on main, frontal, low: 3.5 -> 2.6 m push-in on the impact, hold on the crouch, then eases back to 6.1 m | the landing (`land` impact frame -> `build` at +0.2 s), hero 60 % of frame; 2, 4, 8 peel out of her |
| 8B | 132.300-139.256 | b77-80 | side truck along the south flank, looking north 16 deg toward the east, 1.05-1.2 m high | the four kicks in profile (side kick apex on the cut), canon 16 ms/m outward; 16 -> 128 |
| 8C | 139.256-147.952 | b81-85 | crane: from 4.6 m up beside her (she is at the fan's apex, foreground) up and back to 12.5 m on the axis (b83), then forward over her toward the glow; fov 50 | 256; the fan opens (b82), closes into rings (b83, 1,024) |
| 9 | 147.952-153.169 | b86-88 | from 74 m west and 27 m up down the aisle to 4.1 m behind her, 0.9 m high, no cut into the drop | rings and the sun's rim; the coil |
| 10A | 153.169-160.126 | b89-92 | on main behind her, 0.9 m, fov 38, leaning after her as the phrase carries her off the axis | butterfly apex in the sun on the downbeat, solo, hand/toe ribbons; unison phrase with the troupe from b90 |
| 10B | 160.126-167.082 | b93-96 | cut; lifts off from 2.7 m behind her to straight overhead by b96.4 | the run to the letters (main's write head glows under her feet); the word assembles |
| 10C | 167.082-174.039 | b97-100 | straight down (east up), 4 % push-in | the fall ripple, MAIN, stillness, push-up, rise, arms wide |
| 10D | 174.039-178.387 | b101-103.2 | on main behind her at the head: 6.4 m / 1.35 m high pushing in to 4.5 m / 0.9 m | last phrase alone against the sun, the jump kick inside the disc (apex 177.517) |
| 10E | 178.387-180.995 | b103.3-104 | from the sun side, 3/4, long lens (fov 24), 2.5 m up, slow push | the troupe lit for the first time (`figLight sunAmt 0.8`, warm grade); bao quan on 179.256, held |

## Decisions the director should know about
- Facing: build b73-81 faces west (the lens); from the b82 spin on everyone faces the sun. The b89-103 shots are from behind (RARE EARTH, hair, back disc).
- The hero's place in MAIN is the head of the road, apart from the word (a body on the orange line above the A/I gap). In the word she would be invisible
  in every ground-level shot; at the head she is in front for the sun-side salute and alone against the sun for the jump kick.
- The copies' b93-96 phrases are replaced by the run (then the three snap kicks and `set` in place for those who are in). The hero does not do the snap
  kicks: she arrives at 165.1 and stands.
- Canon is deliberate in three places only: 8B (16 ms/m), the b89 crouch ripple (11 ms/m), the b97 fall (0.4 s over the word). Everything else is unison +-25 ms (figure seed).
- An earlier wide shot from behind the word for b101-102 was tried and dropped (she was 4 % of frame height).

## Known problems
- 2:05.34 the first two frames are `land`'s upright touch-down (arms out, hair up); `land` -> `build` at 125.54 differs by < 0.1 m per joint (not visible in the strip).
- 2:07-2:12 stage 2 and 4 are not symmetric about her (3 copies cannot be: there is no slot on the axis; the aisle is main).
- 2:12-2:19 side truck: from b79 the frame is a dense troupe; the front row reads, the rows behind overlap. The northern sky is plain blue (no dawn band in frame).
- 2:14-2:19 the peel-outs cross the lens as translucent bodies for a frame or two (alpha ramp).
- 2:23-2:27 the written streaks are still a net of lines under the troupe (faded to 7 % by b85.5); 2:31-2:32 coiled bodies beside the aisle are cut by the bottom corners (flying through them).
- 2:33.4-2:34.0 the copies change from the coil to the landing crouch in one frame each, on the ripple (hips fixed; a 0.3 m drop). Fine at frieze size, visible if you look for it.
- 2:40.13 the cut hides the pop from `drop` to the run loops; arrivals pop from mid-stride to `drop` (seen from 30-100 m up). No acceleration or braking for the copies; the hero brakes.
- 2:40-2:44 runners pass through each other where streams cross.
- 2:49-2:54 standing / arms wide from above is a field of thin lines; the word stays readable through the pools of light (kept at 60 %).
- 2:58.4-3:01 from the sun side the copies' faces do not read at that size (far LOD: heads are hair-dark); the look is the day cel look under a warm grade, on a flat magenta western sky.
- Track notes (not edited): `drop` b93-96 hardly travels (1 m), so "travelling phrases" could not carry anyone to a letter; a run-to-stand and a stand-to-run for the troupe would remove the two pops.

## Outputs
- `work_fable/out/actC.mp4` (124-182 s, 720p, mb 2, audio), `work_fable/stills/actC/sheet_final.jpg` (one frame per 2 s from the clip), dense strips `k1..k5.jpg`.
