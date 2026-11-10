# M3 — motion fixes flagged by the sequence directors (working notes)

Recipes: `fable/tools/bake/recipes_util.py` (violet), `recipes_m3.py` (new tracks). Bake / validate / look as in `M1_util.md`, `P1_qa.md`.
Sheets (git-ignored): `work_fable/out/reel/m3/` (reel, real figure), `work_fable/stills/m3/` (from `main.js`).

## 1. `violet` sit (song 203.745-208.8, track 22.75-30.0) — done
- Was: CMU 114_16 sit-down (forward fold, roll) + CMU 82_05 seat (leaning on the right hand).
- Now authored (`_violet_sit` in `recipes_util.py`, `Poser` keys + `keyframes`): a breath out and the eyes drop (204.3), squat with the arms forward
  (205.05), deep squat on the balls of the feet while the right hand goes to the ground beside the hip (205.7), the seat touches down with the
  weight on that hand (206.35), the hand leaves the ground and both arms come round the knees (wrapped 207.7: elbows outside the knees, each hand
  on the other forearm in front of the shins), the chin lifts while the arms close (up at the sky, 32 deg, a little to her right, by 208.3), a small
  settling sigh, then breath (4.3 s period; the arms ride on it) and a slow head / spine drift to the end of the take.
- The feet never move (0 skate when seated, 4 cm of IK give during the squat); the seat ends 0.53 m BEHIND where she stood (the old capture sat her
  down in place). `11_violet.js` shot D: the frame goes back 0.5 m with her (`0.8 - 0.4 * u`), nothing else changed; the road's end ring is at her feet.
- Pins: frames 0-22.2 s are bit-identical to the old track (stop, pencil, writing, release untouched); events unchanged (`sit_start` 22.75, `seated` 25.905:
  the seat is on the ground from 25.35, i.e. 206.35). No window slower than 4 mm/s (alive). Max joint speed in the sit 1.7 m/s (the hand coming round).
- Sheets: `work_fable/out/reel/m3/violet_sit_before.jpg`, `violet_sit_1s.jpg` (side, every 0.25 s), `violet_sit_spin.jpg` (seated pose, 8 yaws),
  `work_fable/stills/m3/violet_film.jpg` (the film, 204.5-210.5).

## 2. Fork -> walk pop at 0:04.75 (seq 01) — done: `fork_go_L` / `fork_go_R` (12.0 s each, `recipes_m3.py`)
- Frame 0 = `idle` at 2.604 s (`meta.idle_t`; the moment seq 01 leaves idle; 0.1 mm from the idle track, feet held where idle has them until they
  first lift). The side step is `fork_L/R`'s (ACCAD Female1 B22, 0.9 m): leading foot planted at t = 1.0 (`step` event; footfall detected at 0.98).
  Instead of closing and settling, the trailing foot swings straight through into `walk_loop`'s first stride (footfall 1.62) and she walks along
  track +Z at walk_loop's own speed, 1.144 m/s, to 12.0 s. Body cross-fade 0.98-1.60, feet in world space (`choreo_lib.blend`), then foot-locked.
- From `meta.walk_from` (1.75 s) the pose IS `walk_loop` at loop time `meta.walk_phase_t + (t - 1.75)` (L 0.750, R 0.117; hips-relative difference
  < 2 cm, from the foot lock), hips at `x = meta.step_x`, `z = meta.walk_z0 + 1.144 * (t - 1.75)` (error < 1 mm). So a sequence can switch to `walk_loop`
  on that phase at any later time without a pop.
- Root path (hips x, z in track space; facing +Z; her left = +X), every second (`meta.root_path_xz_per_second`):
  | t | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 |
  |---|---|---|---|---|---|---|---|---|---|---|---|---|---|
  | L x | 0.005 | 0.356 | 0.888 | 0.882 | 0.891 | 0.913 | 0.912 | 0.888 | 0.882 | 0.891 | 0.913 | 0.912 | 0.888 |
  | R x | 0.005 | -0.356 | -0.896 | -0.885 | -0.898 | -0.920 | -0.917 | -0.896 | -0.885 | -0.898 | -0.920 | -0.917 | -0.896 |
  | z (L; R within 2 cm) | -0.013 | -0.033 | 0.620 | 1.799 | 2.910 | 4.075 | 5.207 | 6.341 | 7.520 | 8.631 | 9.796 | 10.928 | 12.062 |
  `step_x` = +0.897 (L) / -0.903 (R): the road should run along x = step_x from z = 0.
- Wired (`fable/show/seq/01_root.js`, `cast.js` TRACKS + 2 names): hero and twin play `fork_go_L/R` from 2.604 (track origin on the root, as idle) to b5
  (7.08): the track's root z is laid along each first limb (`cast.origin([road point], yaw, [step_x, z])`, so the limb's curve turns her), the limb is as
  long as the track walks by b5 (3.45 m; was 2.87 m at walk_loop x 1.08), the road's write head follows her feet (gk keys from the track). From b5
  everyone is on `walk_loop` x 1.08 as before, entered on the track's phase at b5 (`l.ph`, per family: L and R are half a stride apart).
  Removed: the nearest-pose phase search and the 2.15 s `fork_L/R` section. `fork_L` / `fork_R` are no longer used by the film (kept on disk).
  Dev track lists (`--q tracks=...` in actA.md) need `fork_go_L,fork_go_R` instead of `fork_L,fork_R`.
- Sheets: `work_fable/out/reel/m3/fork_go_front.jpg` (pair, front), `fork_go_tq.jpg` (0.7-2.2 s every 0.1 s), `work_fable/stills/m3/fork_film.jpg` (film 2.5-7.75).

## 3. Drop, crowd join at 153.4-154.0 (seq 10) — done: `drop_join` (`recipes_choreo.py`: `_drop(join=True)`; `drop` itself is bit-identical to before)
- Same clock (`song_t0` 151.6695), same length (1,761 frames), same `meta.center` as `drop`. Identical to `drop` (and to the end of `build`, 0.07 mm)
  up to 152.74; then, instead of the butterfly, the coil is HELD with breath only (max joint speed 18 mm/s) to b89.3 = 154.04. Then: sinks and loads
  away from the direction of travel (0.24 s: hips -8.5 cm, -9 cm back, torso folds 14 deg), leaps the butterfly's travel (hips 1.5 m in 0.48 s, peak
  hips 0.81 m, feet land 14 % early) into `drop`'s own bow-stance chamber at 154.758, and the b90.1 punch (154.908) is `drop`'s.
- Measured: `drop_join` == `drop` frame for frame from track frame 186 = song 154.769 to the end (max difference 0.0); `meta.same_as_drop_from` = 3.089.
  So a copy may stay on `drop_join` for the whole act or switch to `drop` anywhere after 154.77.
- Wired (`actC_form.js`, `cast.js` TRACKS): copies play `drop_join` from b88.3 to b93 with their origin on their slot (as in the coil); the hero plays
  `drop`. Removed: the one-frame coil -> crouch switch on the 11 ms/m ripple and the per-copy origin shift that kept the hips in place (`tSw`, the
  `coil`/`low` offset). The join is now in UNISON (all copies leave the coil on b89.3); a ripple can be had again by delaying `time` per ring before
  154.04 and catching up by 154.77, not done. Since every copy now travels the butterfly's (0.99, 0.98) m like the hero, the formation keeps its
  shape round her and the run start points `P[i].A` moved by the same small offset.
- Sheets: `work_fable/out/reel/m3/drop_join_front.jpg` (153.95-155.0 every 0.07 s), `work_fable/stills/m3/join_film.jpg` (film, 153.3-155.1).

## 4. Runs to the MAIN cells (seq 10, 160.1-165.5) — tracks baked, NOT wired (it cannot be done cleanly; see "why")
Recipes in `recipes_m3.py` (`_from_stand`, `_to_stand`, reusable for other loops / captures). Both pass `validate.py --tracks`. Not in `cast.js` TRACKS
(two unused tracks would cost ~1.5 s of start-up sim): add `'run_from_stand', 'run_to_stand'` there when a sequence uses them.

**`run_from_stand`** (3.0 s; ACCAD Male2 C1_StandToRun 1.80 s on, then `run_loop`). Frame 0 = `idle` at time 0 (2 mm), at the origin facing +Z. Leans, pushes
off, three accelerating strides (footfalls R 0.53, L 1.00, R 1.35), body cross-fade into `run_loop` 1.05-1.45 on the R footfall, feet in world space.
- From `meta.run_from` = **1.5 s** the pose is `run_loop` at loop time `meta.loop_phase_t` = **0.540 s (phase 0.704)** + (t - 1.5); hips-relative difference
  < 3 cm (foot lock), z = `meta.run_z0` + 3.418 (t - 1.5) within 6 mm. The track carries on as pure run to 3.0 s, so the switch can be at any t >= 1.5.
- Travel (hips z, m): 0.25 s 0.10 · 0.5 s 0.41 · 0.75 s 0.89 · 1.0 s 1.61 · 1.25 s 2.33 · **1.5 s 3.16** · 2.0 s 4.89 · 3.0 s 8.28. Hips x stays within 3 cm of 0.
  Hips speed: 1.3 m/s at 0.4 s, 2.7 at 0.8 s, run speed (3.2-3.7, the loop's own ripple) from 1.2 s.

**`run_to_stand`** (4.0 s; ACCAD Male2 C2_RunToStand from its first footfall, mirrored so that it starts on the LEFT footfall like `run_loop`). Frame 0 =
`run_loop` phase 0 exactly (0.0 mm hips-relative), moving along +Z. Three braking steps (R 0.40, L 0.67, R 0.93), at rest at `meta.stop_t` = **1.2 s** (hips
speed 0.22 m/s and falling; the capture's 1.53 s brake is time-warped to 1.2), then the feet close into the idle stance (0.06 m lift) and she is `idle`.
- She stands on `meta.stand_xz` = **(0.037, 2.445)**: travel **2.45 m** (hips z: 0.25 s 0.71 · 0.5 s 1.45 · 0.75 s 2.05 · 1.0 s 2.26 · 1.2 s 2.32 · 2.0 s 2.44).
  Facing +Z (1.2 deg). The capture's 0.4 m sideways drift is sheared out: she stops straight ahead of where she ran.
- From `meta.idle_from` = **2.25 s** the pose IS `idle` at time (t - `meta.idle_t0`) = t - 1.2, standing on `stand_xz` (0.0 mm): switch to `idle` there, or let
  the track play to 4.0 s (it clamps = freezes after that).

**How to use them (one copy running a straight line of length d from A to B, heading yaw, starting at t0, loop rate r in 0.85..1.15):**
```
const F = cast.meta('run_from_stand'), S = cast.meta('run_to_stand'), per = cast.dur('run_loop'), v = cast.speed('run_loop');       // 0.7667 s, 3.418 m/s
const tauM = (k) => (per - F.loop_phase_t) + k * per;            // loop time from the hand-over phase to phase 0: 0.2267 + 0.7667 k
const dK = (k) => F.run_z0 + v * tauM(k) + S.stand_xz[1];        // nominal distances: 6.38, 9.00, 11.62, 14.24, 16.86, 19.48 ... m (one stride = 2.62 m apart)
const k = Math.max(0, Math.round((d - dK(0)) / (v * per))), sc = d / dK(k);          // sc = stretch of the ground covered (feet slide by |sc - 1|: at most 1.31 m / d)
const t1 = t0 + F.run_from, t2 = t1 + tauM(k) / r, dir = [Math.sin(yaw), Math.cos(yaw)], at = (q) => [A[0] + dir[0] * q * sc, 0, A[1] + dir[1] * q * sc];
t <  t1 : { track: 'run_from_stand', time: t - t0, yaw, pos: at(0) }                        // root motion is in the track (for sc != 1 add (sc - 1) * cast.root(track, time)[2] along dir)
t <  t2 : { track: 'run_loop', time: F.loop_phase_t + (t - t1) * r, yaw, pos: at(F.run_z0 + v * r * (t - t1)) }
t >= t2 : { track: 'run_to_stand', time: t - t2, yaw, pos: at(F.run_z0 + v * tauM(k)) }       // she stands on B = pos + rot(yaw, S.stand_xz); arrival (at rest) = t2 + 1.2
t >= t2 + S.idle_from : optionally { track: 'idle', time: t - t2 - S.idle_t0, yaw, pos: pos + rot(yaw, S.stand_xz) }
```
Total time = 1.5 + (0.2267 + 0.7667 k) / r + 1.2 s. `K.loopFor` / `K.gait` are not needed: the loop is entered on a fixed phase and left on phase 0.

**Why it is not wired into `actC_form.js`** (measured on the act's own assignment, 1,023 copies, runs mean 15.7 m / median 14.7 m / max 31.3 m):
1. Speed. The run block gives everyone 5.2 s (b93 -> b96.1) and moves the far half on `sprint_loop` at up to 5.67 m/s. Stand -> run -> stand on `run_loop`
   at rate 1.15 covers at most 14.2 m by b96.1 and 16.9 m by the `set` pose (166.42): only 501 copies (689 by `set`) can make their cell; the rest
   would still be running at the fall. They need a sprint pair (`sprint_stop_look` frames 0-4.2 already is sprint_loop phase 0 -> stand; a
   `sprint_from_stand` does not exist) or shorter runs (re-pair cells, or start before the b93 cut).
2. Facing. `run_to_stand` stops facing the way she ran; `drop` on the cell faces EAST. The runs point every way: 816 of 1,023 are more than 45 deg off east,
   594 more than 90, 334 more than 135. So the stand -> `drop` switch would still be a yaw pop unless the copies also turn (a baked turn per angle, curved
   arrival paths, or turning the instance yaw during the brake, which slides the feet).
3. Short runs. 44 copies run less than 5.6 m (the accelerate + brake distance) and 84 less than 8 m: they need a walk or a side-step instead.
4. Quantised length. The loop must be left on phase 0, so legal lengths are 6.38 + 2.62 k m; other lengths need the stretch `sc` (or half strides with a
   mirrored `run_to_stand_R`, not baked).
5. The pose after the stand. On arrival the copies are put back into `drop` mid-phrase (snap kicks); from a stand that is a new pop until `set` (166.42,
   attention, fists at the waist: 0.3 m in the hands from the idle stance).
None of this is a small edit to the director's run block; the tracks are ready for a re-plan of it (e.g. nearer cells + curved arrivals facing east).
- Sheets: `work_fable/out/reel/m3/run_from_stand.jpg` (0-1.9 s every 0.1 s, side), `run_to_stand.jpg` (0-2.85 s every 0.15 s, side).
