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
