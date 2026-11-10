# F2 — motion library (checkpoint notes)

For whoever picks this up next. Workstream F2 turns open mocap into tracks for the canonical
21-joint figure of `fable/SPEC.md` §5. Code: `fable/tools/bake/`. Output (git-ignored, regenerate
with the recipes): `work_fable/tracks/<name>.bin/.json`, previews in `work_fable/tracks/previews/`.

## Run it
```
PY=.venv/bin/python                      # repo venv: numpy, scipy, pillow. Always pass -I.
$PY -I fable/tools/bake/bake.py --list   # recipes
$PY -I fable/tools/bake/bake.py all      # bake every track, validate the written file, draw the filmstrip
$PY -I fable/tools/bake/bake.py butterfly --mp4          # one track (+ stick-figure mp4)
$PY -I fable/tools/bake/preview_track.py NAME -n 16 [--mp4 --song-t0 153.167 --from 0 --to 8 --az 30]
$PY -I fable/tools/bake/validate.py              # retarget 11 source clips and check them
$PY -I fable/tools/bake/validate.py --tracks -v  # check every track on disk
```
Source data (downloaded by the mocap scout, not in git): `work_fable/mocap/` — CMU BVH
(`cmu_bvh_una/repo/data/<subj>/<id>.bvh`, true fps in `cmu_index.csv`), ACCAD Male2 / Female1 / Male1.
Parser: `fable/tools/mocap/bvh.py`. Licences: CMU free for all uses (credit asked), ACCAD CC BY 3.0.

## Files
- `motion.py` — the library (retarget, edit ops, IK, cycles, events, track I/O).
- `recipes_basic.py` — phase-1 tracks. A recipe = a function under `@recipe("name")` returning a Motion.
  New recipe files must be named `recipes_*.py`; `bake.py` picks them up.
- `bake.py`, `preview_track.py`, `validate.py` — CLIs. `skeleton.json` — written by every bake (bone
  lengths, offsets, parents, rest A-pose, the convention in words) for the figure module.

## Conventions settled (must match the figure module)
- `p_world = joint_pos + R(q) @ p_local`; quaternion xyzw is the WORLD orientation of the joint's frame.
- local +Y along the bone to the child (end joints continue the limb); local +Z = the character's front
  at rest, except footL/R and toeL/R where +Z = top of the foot; +X = Y x Z (her left on the spine chain).
- She faces +Z, her left is +X, Y up, metres. 60 fps. 21 joints x (pos xyz, quat xyzw) = 147 floats/frame.
- Hierarchy: hips > spine > chest > neck > head; chest > clavL/R > upArm > foreArm > hand;
  hips > thighL/R > shin > foot > toe. A child sits at `(0, parentBoneLength, 0)` in its parent's frame,
  except clavL/R = `(±0.023, 0.117, 0)` in the chest frame and thighL/R = `(±0.085, -0.075, 0)` in the hips frame.
- Bone lengths (m): hips .09, spine .13, chest .19, neck .09, head .15 (to crown), clav .135, upArm .27,
  foreArm .235, hand .17 (to fingertips), thigh .435, shin .41, foot .135 (ankle to ball), toe .07.
  Standing: hips joint 1.005, hip joints 0.93, ankle 0.085, ball of foot 0.025, crown 1.65.
- A flat foot's bone points 26.4 deg below horizontal (ankle is higher than the ball).
- Loops (`loop:true`) are IN PLACE; `meta.stride` (m per cycle), `meta.period`, `meta.speed` tell the engine
  how fast to move the root along +Z. Duration of a loop = frames/60; of an open clip = (frames-1)/60.

## Retarget (motion.retarget / load_clip)
`R_canon(t) = G_src(t) @ C_j`, with `C_j = G_src(ref)^T @ R_canon(ref)`: rotations are transferred through a
reference pose, positions re-solved by FK with the fixed canonical bone lengths, root path scaled by
(canonical leg)/(source leg). Reference pose: CMU and ACCAD Female1/Male1 = the BVH zero pose (a T-pose
facing +Z); ACCAD Male2 (odd rest pose) = frame 0 of `Male2_A1_Stand` (relaxed stance, front from the hip
and shoulder lines). In the reference pose the canonical frames are: spine chain = body axes; clavicle =
canonical 12 deg slope; arms and legs = +Y along the SOURCE bone direction (so CMU's splayed rest legs come
out right), +Z = front; foot = canonical flat pitch with the source's heading; toe = horizontal.
Joint map (canonical <- source): hips<-Hips, spine<-Spine, chest<-Spine1, neck<-Neck1 (CMU) / Neck (ACCAD),
head<-Head, clav<-Shoulder, upArm<-Arm, foreArm<-ForeArm, hand<-Hand, thigh<-UpLeg, shin<-Leg, foot<-Foot,
toe<-ToeBase (Left/Right).
After the transfer: resample to 60 fps (cubic rotation splines) -> `level_floor` (some captures have a tilted
floor: the ACCAD walk climbed 8 cm in 8 m) -> ground from ankle rest height -> `foot_lock` (pins the heel or
ball that is resting; heel-strike to toe-off still rolls) -> `plant_feet` (the ground pitches a planted foot
flat by the least angle; bends toes that dig in) -> IK lift of anything still below y=0 -> face +Z at the origin.

## Library API (all pure; Motion = root (F,3) + world rotations (F,21,3,3) + events + loop + meta)
load_clip(spec) 'cmu:88_06' | 'accad:Male2_Form_1' · trim · resample · sample(m, times, wrap) ·
time_warp(m, [(src_t, out_t)...]) (PCHIP, pins accents to beats) · speed_ramp · hold · transform / place /
heading · mirror · concat(a, b, halflife) (aligns ground position + heading, inertialised, re-locks feet) ·
sequence([...]) · find_cycle / make_cycle / roll / tile / relock_loop / drive(cycle, duration, speed, path) ·
contacts / point_contacts / foot_lock / plant_feet / ground_clamp / level_floor / leg_ik ·
arm_ik(m, side, target, weight, pole, hand_R) · look_at(m, target, weight) · twist_pelvis · additive ·
rotate_subtree · shift_root(keep_feet) · breathe · smooth(cutoff_hz) · detect_events / with_events ·
write_track / load_track / write_skeleton_json / rest_pose.
Events are `{t, name}` and survive every op. Auto names: footL/footR (contact starts), takeoff / jump_apex /
land, kickL/kickR (foot apex above ~0.62 m while upright), strikeL/strikeR (hand speed peaks).

## Tracks baked (phase 1)
walk_loop (1.25 s, 1.14 m/s, ACCAD Female1 walk) · run_loop (0.767 s, 3.42 m/s, CMU 09_09) · sprint_loop
(0.733 s, 4.93 m/s, ACCAD Female1 run) · run_fwd / walk_fwd (8 s driven straight, root motion) · idle (20.00 s
loop, 5 breaths) · lookback (5.5 s standing, over the right shoulder, hold 1.75-3.25) · walk_lookback (6 s) ·
turn_around (4.67 s run-plant-turn-run) · butterfly (3.82 s, CMU 88_06: takeoff 1.03, apex 1.23, land 1.48) ·
sidekick (2.35 s, CMU 135_11, kickR apex at 1.20, 1.35 m high) · form_test (18.5 s ACCAD Male2 Form_1).

## Status / next
- Phase 1 done except a last look at every preview (in progress when this was written).
- Phase 2 (to come from the director): utility performances (fork step, float, rise, salute, write-in-air,
  release, sit, catch ...) and the build/drop choreography warped to the beat grid.

## Known weaknesses
- No finger data; hands are one rigid bone. Head/hand twist for ACCAD Male2 assumes a neutral stance at
  the reference frame.
- ACCAD is 30 fps: fast kicks are spline-upsampled (fine in previews; watch hair/trouser sims on them).
- Jump/kick/strike detectors are heuristics: check the events list after each bake.
- `plant_feet` only pitches (no roll): a foot resting on its edge keeps the mocap's roll.
- Scaling a floor move (cartwheel hands) is not corrected: hands may miss the ground by a few cm.
