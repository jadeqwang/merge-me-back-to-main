# M1 — utility performances (CHOREO.md section A). Working notes

Recipes: `fable/tools/bake/recipes_util.py`. Library additions: `fable/tools/bake/motion.py` (section "pose authoring").
Bake + validate + filmstrip: `.venv/bin/python -I fable/tools/bake/bake.py NAME [NAME...]` (previews in `work_fable/tracks/previews/`).
Song-timed tracks carry `meta.song_t0`; play with `time = t - song_t0`. Events are in each track JSON.

## Library additions (motion.py, backward compatible)
- `Poser` (one authored pose; chainable): `hips(pos, dx/dy/dz, yaw, pitch, roll)`, `bend(joint, pitch, yaw, roll)`, `spine()`, `head()`,
  `look(target|direction)`, `arm(side, hand, space, pole, fingers, palm)` (IK), `arm_fk(side, raise_, fwd, elbow)`, `hand()`,
  `leg(side, ankle, knee, toes, top)` (IK), `foot(side, xz, yaw, heel)` (flat planted foot), `unpin('legs'|'L'|'R')`.
  Spaces: 'body' (origin under the hips, her heading; x = her left, y = world height, z = front), 'world', or a joint name.
  Angles in degrees: +pitch = bend forward (thigh: flex; shin: negative = knee bend; foot: negative = point the toes), +yaw = to her left.
- `keyframes([(t, Poser|Motion, ease)...], overlap, soften)`: local-space eased interpolation, follow-through on forearms/hands/head,
  feet on the ground in both neighbouring keys are pinned by leg IK and arc when they move. Eases: io, io2, in, out, in3, out3, lin.
- `stand_pose()`, `hand_frame(side, fingers, palm)`, `foot_frame(direction, top)`, `euler_local()`.
- `drift(m, joints, deg, period, seed, weight)` moving hold; `ramp(t, a, b, c, d)` overlay weight.
- `body_clearance(m)`, `rest_on_ground(m)` seated / lying support (joint spheres in `BODY_RADII`).
- `step_foot(m, side, t0, t1, delta)` one step overlay on a standing motion; `graft_upper(lower, upper)` captured upper body on an authored lower body.

## Tracks
| track | dur | source | events / pins |
|---|---|---|---|
| sprint_stop_look | 14.4 | sprint_loop driven + ACCAD Female1 C02_RunToStand + idle; breath + look-back overlays | song_t0 85.6; stop 4.20 (89.80), look_start 6.20 (91.8), look 7.35, held to the end |
| violet | 30.0 | sprint_loop + C02_RunToStand + idle; IK overlays (look left, pencil from the bun, writing, release); CMU 114_16 sit-down; CMU 82_05 seated | song_t0 180.995; stop 9.60, look 9.81, pencil 14.98, write_start 15.41, stroke 16.12 (THAT), write_end 19.91, release 20.87 (201.865), sit_start 22.75, seated 25.91. Glow is to her LEFT (+X). `meta.line_from/line_to` = the written line in body space at the stop |
| float | 30.0 | authored (Poser) + drift + breath | song_t0 97.513; supine, head toward -Z, hips y 0.10; meta.water |
| rise | 9.0 | authored keys; frame 0 = float at 116.0 | song_t0 116.0; accent 2.387 (118.387): arms wide, hips +0.5 m; touch 7.75, landed 8.45 |
| release | 7.0 | idle + IK overlays | cupped 1.35, release 2.5 |
| catch | 16.0 | idle + step + IK overlays | song_t0 220.0; impact 2.735, head_lifts 9.6, open 12.71; light arrives from +Z |
| fork_L / fork_R | 2.5 | ACCAD Female1 B22_SideStepLeft, first step, scaled to 0.9 m (R = mirror) | step lands 1.0 |
| fork_walk_L / R | 4.2 | walk_loop driven along a curve | veer 25 deg between 1.0 and 3.0 |
| land | 4.0 | authored keys | song_t0 125.343-0.495; impact 0.495 (free fall from 1.2 m), head_up 1.64, ready 2.23 |
| sit_idle | 12.0 loop | CMU 82_05 | seated knees up |

## Next
free, lives (life_wushu, piano, poet, home, stage, nasa, violin, band, wetlab).

## Known weaknesses
- The ACCAD run has a one-frame forearm twist (about 40 deg) once per stride at slowed playback; invisible on a sleeve, but check the hand.
- Hands are rigid mittens: "cupped" and "holding a pencil" are orientations only.
