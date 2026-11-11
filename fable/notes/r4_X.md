# Round 4, Pass X: performance and figure (tracks, `figure_anime`, seq 13, 14, 16)

Working notes (2026-11-10). Task list: `fable/NOTES_v4.md`, "Pass X". Stills / strips: `work_fable/stills/r4_X/` (git-ignored).
Status line (kept current): **all five items done (5: verified, nothing changed), plus Pass Y's request for shot C2. Tracks installed: catch, rise, drop, drop_join, land. Not pushed. Open: "Still weak" at the bottom.**

## How tracks are changed while the film is being rendered by someone else
`fable/tools/bake/stage.py NAME` bakes into `work_fable/tracks_x/` (validated there); `stage.py --install NAME` renames the staged files over
`work_fable/tracks/` (atomic per file; refuses a track that fails validation). A staged track is looked at in the dev reel
`work_fable/dev/reel_x.js` (git-ignored: `fable/show/reel.js` with the ANIME figure and `dir=tracks_x`, `joy=`, `hand=`):
`node fable/tools/render.mjs --show /work_fable/dev/reel_x.js --q "track=catch&cam=front&dir=tracks_x&dawn=1&joy=0.7&hand=-0.5&dist=3.6&times=232.71_234.6" --sheet 0:1:1:out.jpg:2`.
The tracks as they were before this pass: `work_fable/tracks_x/backup/` (catch, rise, drop, land, idle).

## 1. "I have become" (229.6-236.6): `catch`, re-authored from the moment her head lifts
`recipes_util.py`: `_catch_base()` is the old recipe, untouched; `catch()` keeps its frames before 9.6 s (bit-identical: 0.0 difference) and authors the rest
as eight key poses on her own stance (`key(...)`: hips, spine, head, FK arms with a wrist angle, or IK hands at the chest), run through with the new
`spline_keys()` (PCHIP on every joint's parent-relative rotation: a key is passed at speed, not stopped on; per-joint `lead`, so nothing arrives together).
- 229.6-230.4 the head comes up first, the hands loosen on the chest. 231.2 they have left it and unfold forward, palms up; she sinks 1 cm, gathering.
  231.95 the sweep, elbows leading. **232.71 open**: a soft V, wrists 13 / 21 cm above the shoulders (left / right), elbows bent 40 / 30 degrees and behind
  the shoulder line, palms forward and up, chest lifted, head tipped back 14 degrees; her weight has come onto the front (left) leg, hips 6.5 cm toward it,
  the right hip hanging, shoulders answering, the back heel 5.5 cm off the ground. The left arm leads the right by 0.09 s; hips and chest lead both.
- The hold is a phrase, not a pose: to 234.6 the arms float 9-11 degrees higher and the head comes level (she looks at us); then a breath out to 236.6:
  arms sink, elbows and wrists soften, the weight sits into the hip, the heel nearly down; a last breath in. Wander on arms / wrists / head, different on
  each side. Slowest half second after "become": 28 mm/s at the fastest joint (never frozen).
- Feet: left ankle and toe 0.00 mm of travel from 229.6 to the end; the right foot turns on the ball of the foot (toe 0.03 mm).
- Pins (track events, unchanged): impact 222.735, head lifts 229.600, open 232.710. Measured: both hands fall below 15 % of their peak speed at 232.700
  (peaks 232.08 left, 232.23 right). Join at 9.6 s: no step (max joint speed across it 0.07 m/s).
- `13_catch.js` `camC3`: through the hold (232.4 -> b137) the camera keeps coming in, 0.6 m, tilting down 2.7 degrees so her feet stay in frame.
- Face / hands are still cast.js's defaults for `catch` (eyes open from 229.6-230.3, joy from 231.3, open hands from 231.8): they fit the new timing.

### The handover (236.15-238.1; `actE_morning.js`), items 1 and 4
- The back foot STEPS (it slid 30 cm): both ankles are driven in the world and the legs re-solved (two-bone IK in the blend, knee toward the thigh's front).
  Left foot: 3.5 mm of travel on the ground over the whole handover. Right foot: lifts 7.5 cm, set down beside the left, 236.62 -> 237.12; the hips stay over
  the standing leg until it lands (236.85 -> 237.35).
- The arms come down ONCE (236.45 -> 237.95, out through the sides) and arrive at her sides at the bottom of the skip's gathering dip, which throws them up:
  one swing (it was: down by 237.35, wait, up at 237.7). Spine and head go over 236.3 -> 237.2. `handover` is now 235.9-238.3 (145 frames), played to 238.1.
- Checked by numbers with `--q "hodump=1"` (prints the made track; digits as letters because the harness drops console lines containing "404"):
  bone lengths constant to 0.3 mm, max joint speed in the blend 1.25 m/s, no spike (the first version flipped a knee for a frame: the pole is now the
  thigh's front). Checked by eye: `h1_handover.jpg`, every frame 236.0-238.2 (1/30 s): no pop of pose, hair or light across the cut on b137.

### The same pose family elsewhere
- **`rise` (118.4-124)**: was one symmetric shape with locked elbows, and the arms RESTED level (a T) at 121-122.5. Now the right arm reaches higher on the
  accent, elbows soft, a small turn of the chest and head; on the way down the elbows lead and pass the level at about 120.7 with the hands trailing above
  them, and she rests lower, half folded like wings (121.75), then down. Accent event 118.387 unchanged; frames before 117.4 and after 124.7 unchanged.
- **`drop` b100.1 (172.300) and `drop_join`**: `stand("open")`: arms a little above and behind the shoulder line, elbows unlocked, palms standing, chest
  lifted, eyes up; through the bar it keeps opening (`"open2"`, wrists 7 -> 11 cm above the shoulders) until the next phrase takes it. Still a unison snap
  (arrives 172.300, same frame as before). Only 172.14-173.89 changed; everything else in both tracks is bit-identical (checked against the files on disk
  before installing: an unchanged re-bake gives 0.0 difference).

## 2. The landing hit (125.34): hair spikes, the face
- **Cause** (`figure_anime/sim.js`): with the air at rest the hair's drag gives it a terminal speed of 1.6 m/s; she lands at 4.85 m/s and the old crouch folded at up
  to 8 m/s, so every back guide stood straight up from the crown: 0.48 m above it at 125.415, all 56 guides steeper than 45 degrees for a quarter of a second.
- **Fix, general** (any take, no per-track switch): while her head descends faster than 1.5 m/s (all of it from 3.5 m/s) the hair's drag is taken against air that
  moves down with the head (75 % of its speed), is stronger (0.035 -> 0.135 per sub-step) and pushes back behind her; and a guard, `noSpike`: a back-hair node may
  be no higher than the top of the head + 2 cm, plus 0.8 m per metre it is BEHIND the head (a mane trailing up and back at 40 degrees is allowed, a column over
  the crown is not). After: highest node 0.10 m above the crown (0.05 at rest), no guide steeper than 45 degrees.
- **What else it changes**: only takes with real falls. Bit-identical hair in idle, catch, violet, rise, float, the runs and loops, the lives, release, fork_go,
  sit_idle. Different in `land`; `build` (142.63, the drop into the horse stance); `drop` / `drop_join` (153.24-153.49 the butterfly's descent, 155.67, 161.99,
  162.60, **166.80-167.10 the group fall**, 178.25 the last landing) and `free` (a 3 cm touch in the cartwheel, 246.65-247.65). The old sim had the same spikes
  in the group fall and at 178.4 (`l3_hair_other.jpg`, top row old, second row new): they are gone too. Pass Y / Act C: your hair there is tamer, not broken.
- **The face on the first frame after the cut** (`land` in `recipes_util.py`): the cut is ON the impact; the frame after it was a T (both arms level) already
  falling at 8 m/s (the crouch was eased "out3": faster than the fall itself), a smear under motion blur. Now touch-down is a shape (right arm reaching for the
  ground, left thrown back and up, face to the lens) that she is IN for 0.07 s while the legs take 5 cm; the fold follows (to 125.61, peak 5 m/s). Head speed on
  the film's first three frames after the cut: 1.0, 0.7, 2.0 m/s (was 6.9, 5.4, 3.2). Impact event 125.343 unchanged; `ready` and everything after 126.35 unchanged.
- Dev tools (git-ignored, `work_fable/dev/fx/`): `hairtest.mjs` (the sim in node: how high the back hair stands, per frame), `simdiff.mjs` (old against new per
  track), `simstats.mjs` (when the fall air and the guard act), `seam.mjs` (item 3). The sim runs in node with a stub canvas: 0.4 s per track.

## 3. Terminal (264.5-282.5)
- She no longer stands in `idle` alone. `16_terminal.js` makes `stand16` at set-up from `idle` on the same clock (its frames ARE idle's frames, so the last film
  frame is still idle one frame before 0), plus: her weight goes onto her right leg (266.2-269.6: hips 3 cm over, the hip up, the left knee easing, shoulders
  answering) and back (275.6-279.3); one slow turn of the head toward the terminal (to her left, 51 degrees over chest / neck / head) as `git merge` is typed and
  not answered (269.3-271.9), held, and back (274.6-277.4); a deeper breath. Feet re-solved on idle's own ankles (they move only as idle's do, 3-4 mm). Fastest joint: median 68 mm/s, peak 0.19 m/s (the
  head turn, 272.1): slow, never still.
- Wind: the take's simulation gets `windK` (hair and straps x 7) and `hemK` (the lower rings of the trouser legs feel it, gusting: about 3 cm at the hem) from
  265.5 to 278.8. New sim options, off by default (every other take is bit-identical with them in the code).
- **The loop seam**: after wind, hair comes to rest 2 cm away from where idle has it (friction; it does not find its way back in 3 s). New `Figure.settleSim`:
  from 279.5 to 281.5 `stand16`'s hair / straps / cloth go over to idle's own simulation at the same frames (the pose is idle's from 279.3). Measured at 720p:
  frame 0 vs frame 1 MSE 29.27, frame 0 vs LAST frame 30.47, last vs the one before 29.49 (before the settle: 42.25). The last frame equals frame 0's neighbour.
- Credits 62 px higher (1080p): the last line ran into the road's glowing FROM; now clear of it by about 30 px at 720p (checked at 274.0).
- **The reported one-frame HUD dropout at 279.0 is not there**: frames 8364-8380 (278.80-279.33) measured one by one: the top-left HUD region and the whole frame
  change by the same small step every frame (mean difference 1.65-1.72 per frame), no frame without it. The HUD is off under the terminal by design and fades
  back in from 279.2 (a 6 fps strip shows it absent in one cell and present in the next).

## 4. Handover (236.55-237.7): done with item 1 (section above)

## 5. Verified, nothing changed
- **201.5, the bun**: not a one-frame fault. Every frame 201.37-201.63 at 1080p with motion blur (`i5_bun_folds.jpg`, `i5_zoom.jpg`): from 201.47 she tips her head
  back toward the lens (the film's closest shot); the bun, on the back of the crown, comes up and toward the camera and stays so on every later frame.
- **204.5-205.5, the trousers in the squat**: real. At 205.0-205.3 the cloth round the knees is a faceted dark shape (flat folds meeting at angles). It is the
  cloth model (eight ring centres per leg, the "drape" collapse into flat folds), not mesh resolution (28 rings, already a spline): not cheap, not changed.

## Pass Y's request (their item 9): shot C2 of `13_catch.js` (225.34-228.38)
Their tested camera, as given (`pos [C - 6.2 - 1.2 sm(u), 3.2 + 0.8 sm(u), 3.0 - 0.6 u]`, `target [C + 6 + 2u, 0.6 + 0.3 sm(u), -0.3]`, fov 38): she is about a
quarter of the frame's height, left of centre, the crowd behind and round her, the sun on the line; the lyric clear of her head (`c2_oblique.jpg`, 0.5 s). Cut
times unchanged. Lines 22 / 23 in C2 and 23 / 24 in C3 and in 14's shot A start at x -0.895 (inside the 5 % box). NOT changed: line 22 in C1 (x -0.93), because
`12_flight.js` draws the same line with the same number up to the cut on b129 (it would jump 1.75 % of the width there): change both together.

## Still weak (exact times)
- 232.7-236.6: the pose is a gesture now, but her hands are the figure's flat mittens: open palms read, fingers do not.
- 236.6-237.1: the back foot's step is low (7.5 cm) and seen from the front at trouser-hem height; it reads as a shuffle forward rather than a clear step.
- 237.5-237.95: her arms are at her sides for 0.4 s in the skip's gathering dip before it throws them up (`free`'s own first second is a stand).
- 120.6-121.8 (rise): better from the front than from below; from the water-line camera the wing-fold may read as a shrug. Not checked in the film's camera
  after Pass Y moved it (their shot).
- 172.3-173.6: 1,024 copies do the open shape in unison: it is no longer a T, but it is still one shape a thousand times.
- 125.47-125.60: the fold into the crouch is three blurred frames (5 m/s); the face is not readable again until 125.6.
- 269.3-277.4: the head turn is seen from behind and to her right: it reads in the hair and the shoulder line, her face stays hidden.
- 204.9-205.4: faceted trouser folds in the squat (item 5).
- 177.40-177.45 and the other r3 leftovers of this owner are untouched.

## Outputs (git-ignored)
`work_fable/out/r4_X_become.mp4` (221-241), `r4_X_terminal.mp4` (262-282.5), `r4_X_rise_land.mp4` (116-128): 1280x720, 30 fps, mb 4, audio.
`work_fable/stills/r4_X/`: `c1_front.jpg`, `c2_pose.jpg` (reel: front / side / three-quarter of the new ending), `f1..f3_film*.jpg` (the film's camera, with the
zoomed face strip), `h1_handover.jpg` (1/30 s), `r1..r3_rise*.jpg`, `r2_rise_drop.jpg`, `l0_land_before.jpg`, `l1`, `l2_land_reel.jpg`, `l3_hair_other.jpg`,
`l4_land_film.jpg`, `t0_276.png`, `t1_terminal.jpg`, `c2_oblique.jpg`, `i5_bun_folds.jpg`, `i5_zoom.jpg`.
