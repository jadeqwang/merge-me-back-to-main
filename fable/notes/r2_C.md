# Round 2, Act C (seq 08-10, 2:05-3:01): fix pass on NOTES_v2 "Act C"

Files: `fable/show/seq/actC_form.js` (ground plan, word, cameras of b86-92, run plan, performance), `actC_runs.js` (new: the run planner, pure maths),
`09_coil.js`, `10_drop.js`. Shared: `fable/show/cast.js` TRACKS + `'run_to_stand'` (one name; `run_from_stand` was already there). `08_build.js` untouched.
This note replaces `actC.md` for everything from b86 on (MAIN's geometry, the runs, shots 10B-10E). 2:05-2:27 is as in `actC.md`.

## Commands
```
Q="tracks=build,drop,drop_join,land,sprint_loop,run_loop,sprint_stop_look,idle,run_from_stand,run_to_stand"     # dev: 10 s start-up (other acts complain about missing tracks)
node fable/tools/render.mjs --show /fable/show/main.js --q "$Q" --res 1280x720 --sheet 160.2:181:1:work_fable/stills/r2_C/comp.jpg:7
node fable/tools/render.mjs --show /fable/show/main.js --from 125.3 --to 181.0 --res 1280x720 --fps 30 --mb 4 --workers 4 --audio --mp4 work_fable/out/r2_C.mp4
dev views (seq 10 only, t >= b89):  --q "$Q&ctop=1"  the whole floor from above (the runs as a plan)      --q "$Q&cdev=1"  beside the hero, from the south
numbers:  --q "$Q&ccheck=1"  prints `actC check:` (60 Hz over every copy's run: hips continuity, yaw steps, speed of feet that are on the ground)
```
The plan is computed the first time a frame at or after b86.5 (148.82) is asked for (about 5 s per worker; console line `actC runs:`). Frames before that cost nothing.

## What changed, by item of NOTES_v2
### 1. 2:44-2:53, the new shot shape (10_drop.js shots B, C)
- b93-b96.5 lift (as before, re-aimed at the new word); overhead by 166.2.
- b97.1 (167.082) the fall, top-down, MAIN lands; held to b98.0 (168.82). Ground: `topGround` + `topGlow`: gold toward the sun (top), rose, violet at the foot, and
  the sun's glitter path (520 seeded specks, twinkling) down main, which runs through the gap between the A and the I. Pools of light under the bodies kept (0.8).
- b98.0-b99.5 (168.82-171.43) ONE move (`down`): back and down behind the word looking east over it, round its south flank, over the I, down into the gap between
  the A and the I. Passing east it turns up-right without a roll (the engine's topUp blend). The push-up, crouch and the rise (b99.1, 170.56) are seen in passing.
- settles 171.4 at 4.5 m, 1.1 m high, 23 degrees off her front, fov 38: arms flung wide on 172.300 from the front, hero nearest and about half the frame height, her
  rank receding to the right, rows 0-2 behind her, the M and the foot of the I in the distance.
- b101-b103.3: the same shot sinks to 0.7 m and widens to fov 44 and FOLLOWS her (the phrase carries the troupe about 2 m off their cells): troupe behind her for the
  horse-stance punches and the jump kick (apex 177.517). No cut on b101 any more.
- b103.3 (178.387) cut: up the gap, 7.6 -> 6.9 m, 0.8 m high, fov 25, 14 degrees off her front: bao quan on 179.256, held.
### 2. The hero is a cell of MAIN
- Outer (I-side) edge of the A's right leg, row 3 of 20, on main. Five cells are left out of the word (her column above her, and the two nearest cells of the next
  two rows): nobody stands between her and the sun, and from the gap she is the nearest body to the lens. The word is still 1,024 cells: 1,023 copies + her.
- Why not the apex of the A: she can run 14.24 m from the b93 cut (stand -> run -> stand by b96.1). The apex would put the top of the word 16 m east of her start,
  i.e. the word centred on the rings, and then the copies standing east of it (in shot until the cut) would have to run west and arrive facing east: a U-turn each.
- Marked by her accents only: `gain` 2.4 / 1.6, and in the sun-side light every copy's trousers and shoes take its lane colour (`figLight.under 0.55`): hers are main-orange.
### 3. The runs (actC_runs.js; called from `ensure()` in actC_form.js)
- Tracks only: `idle` (waiting) -> `run_from_stand` (1.5 s, 3.16 m, straight) -> `run_loop` (entered on phase 0.704, left on phase 0) -> `run_to_stand` (1.2 s, 2.45 m,
  straight east) -> `drop` on its set pose at 166.30 (hips coincide; the fists go to the waist in one frame: 0.29 m in the forearm, 5 cm in a foot).
- A path is `6.38 + 2.62 k` m long (whole strides). Shape: straight on a heading phi off east (>= 3.16 m), ONE arc (radius 3.2 / 2.4 / 4.6 / 7 m) round to east, straight
  east (>= 2.5 m) into the cell. phi is solved so the length is exactly legal: no stretch. Cells dead ahead are legal only within 1.5 % of a legal length.
- The word was moved and reshaped so the runs exist: drawn tall (the font's glyphs at 0.45 width: 69 x 41 m, 16:9 like the frame) and laid over the EAST half of the
  rings (x +8.9..+49.9 from her spot H): everyone runs toward the sun or across it. 7 copies on the east rim hook back (start more than 92 degrees off east).
- Assignment: Hungarian, minimum sum of squared path lengths over the legal pairs (1,023 x 1,023), deterministic, once.
- Timing: everyone BRAKES TOGETHER on b95.2 (164.039): three braking steps, at rest by 165.24, standing on b96.1; so longer paths leave earlier: the wave.
  Loop rate 0.8817 (a footfall on every beat) unless the time is short, then up to 1.15.
- Who may leave when: the hero and the 236 copies that are in shot until the b93 cut leave on or after the cut (they stand in `idle` until their turn; paths <= 14.24 m).
  The 781 copies that are out of every frame leave earlier, from 148.92 (b86.6, behind / under the lens of the coil shot) on, and the planner keeps every one of them
  out of frame (and 3 m clear of the lens) until the cut. So the unison phrase of 2:33-2:40 is on screen exactly as before, and the b93 lift finds the wave already
  rolling in from behind and from the flanks. Their change of pose at departure is off screen.
- Result (console, this machine): 1,024 / 1,024 on legal paths; 1,021 with stride stretch <= 1.5 %, 3 east-rim copies with the looser fallback (<= 5 %, tighter arc 1.8 m);
  mean path 28.0 m, longest 51.4 m (k = 17); ground speed 3.01 m/s (713 copies, on the beat) to 3.93 m/s (cap 4.93); nobody sprints.
- `ccheck`: hips never jump (max 9.1 cm per 1/60 s, inside `drop_join`'s own leap); yaw steps <= 2 deg per 1/60 s; mean speed of feet that are on the ground, copies vs
  the hero on her straight exact path: run_from_stand 0.094 / 0.091, run_loop 0.361 / 0.410, run_to_stand 0.128 / 0.126 m/s: the paths add no slide to the tracks' own.
### 4. 2:58-3:01 salute, and every shot from the sun side (from 170.0)
- `sunSide(k)`: figLight `sunAmt 0.3`, amber ambient `[0.46, 0.22, 0.035]` (the engine has no key colour: the warmth is in the ambient and the grade gain `[1.25, 1, 0.68]`),
  cool rim `[0.8, 1.4, 3.2]` from the west, underlight in the lane colour, ink outline 0.3. It fades in as the camera comes round (170.0-171.0).
- Western sky: `belt()` (seq 10 only): the earth's shadow (a dusky blue band on the horizon) and the rose belt of the anti-twilight above it, also laid dimly on the far
  mirror. With the lower camera (0.7-1.1 m, tilted up) the frame holds indigo with stars, violet, rose, dusk: a gradient with a horizon.
- The far roads are off in these shots (`only: ['main']`): the whole continent compresses to a white-hot line on the western horizon otherwise.
### 5. Motion check (strips in `work_fable/stills/r2_C/`)
- `m_coil.jpg` 151.5-153.1 / 0.2 s, `m_10A.jpg` 151.4-161.4 / 0.5 s: nobody running in frame before the cut; the frieze of 10A is intact.
  Found and fixed: an early runner crossed the lens at 159.9 (a black frame): now nobody passes within 3 m of a low lens.
- `m_cut93.jpg` 159.6-161.5 / 0.1 s: the cut is on b93.1 (160.126); after it no pose pops, runners at speed, the ones in shot start from a stand.
- `m_arrive.jpg` 163.5-167.4 / 0.15 s: braking, standing by 165.3, set, fall on 167.08; no pops at this size.
- `m_down.jpg` 168.5-172.7 / 0.15 s, `m_last.jpg` 173.6-180.9 / 0.25 s: the move down, arms wide on 172.3, last phrase, kick, salute.
- Per-copy timing: unison +-25 ms (figure seed) everywhere except the two deliberate canons (8B 16 ms/m, the b97 fall ripple 0.4 s over the word).
- 2:05-2:27 (seq 08) not touched; 09's camera is the same path (its keys moved into actC_form.js as `coilCam`); 10A's camera is the same except that its lean no
  longer looks ahead past the cut (last 0.5 s, a few cm).

## Decisions the director should know about
- Two thirds of the troupe leave for their letters while they are off screen (b86.6-b93), instead of everyone at the b93 cut. It is true running from where each stood,
  and it is the only way all 1,023 make their cell at run speed facing east: the visible ones have 3.9 s, i.e. 14 m.
- MAIN is now tall poster letters (69 x 41 m) and sits east of where the rings were; it fills the top-down frame.
- The sun-side light is warm cream-gold, not full day colour; faces stay blank (heads are under 120 px except the hero's in the last shots).

## Still weak
- 2:40.2-2:41 just after the cut the lift camera starts inside the stream: runners close to the lens are large dark shapes for half a second.
- 2:44.9-2:46.9 from straight above, standing bodies are rows of dashes: the word only reads once they fall (2:47.1). (As in v2.)
- 2:50.6-2:51.1 the move down passes low over the standing I: bodies cut by the bottom edge for half a second.
- 2:51.4-2:53.8 the left fifth of the frame is empty mirror; the hero is nearest and largest but her rank-mates are 90 % of her size.
- 2:57.3-2:57.6 at the kick's apex the bodies have turned their backs: dark shapes with cream arms, the hero among them.
- 2:58.4-3:01 hero front-centre, but neighbours close behind her; the mirror under them is pale (it reflects the rose belt).
- 3 copies run on a stride stretched up to 5 %, 7 hook back; streams still pass through each other where they cross (unchanged from v2).
- The jackets read cream rather than gold: a real key colour needs a `sunCol` in the figure shader (engine, not touched).

## Outputs (git-ignored)
`work_fable/out/r2_C.mp4` (125.3-181.0, 720p, mb 4, audio), `work_fable/stills/r2_C/` (strips above, `ctop_runs.jpg` the plan from above, `final_1s.jpg`).
