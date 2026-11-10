# M1 — utility performances (CHOREO.md section A). Working notes

Recipes: `fable/tools/bake/recipes_util.py`. Library additions: `fable/tools/bake/motion.py` (sections "pose authoring", `plant_hands`, `despike`).
Rebake everything (validate + filmstrip): `.venv/bin/python -I fable/tools/bake/bake.py NAME [NAME...]` (names below; `--list` shows all).
Previews: `work_fable/tracks/previews/<name>.png`; beat-flash movies `<name>.mp4` for violet, sprint_stop_look, rise, land, catch, free
(`preview_track.py NAME --mp4 --song-t0 T`). `violet_write.png`, `violet_sit.png` are section strips.
Song-timed tracks carry `meta.song_t0`; play with `time = t - song_t0`. Events are in each track JSON. All 22 tracks pass `validate.py --tracks`.

## Library additions (motion.py, backward compatible; nothing existing changed)
- `Poser` (one authored pose; chainable): `hips(pos, dx/dy/dz, yaw, pitch, roll)`, `bend(joint, pitch, yaw, roll)`, `spine()`, `head()`,
  `look(target|direction)`, `arm(side, hand, space, pole, fingers, palm)` (IK), `arm_fk(side, raise_, fwd, elbow)`, `hand()`,
  `leg(side, ankle, knee, toes, top)` (IK), `foot(side, xz, yaw, heel)` (flat planted foot), `unpin('legs'|'L'|'R')`.
  Spaces: 'body' (origin under the hips, her heading; x = her left, y = world height, z = front), 'world', or a joint name.
  Degrees: +pitch = bend forward (thigh: flex; shin: negative = knee bend; foot: negative = point the toes), +yaw = to her left,
  thigh +roll = toward +X.
- `keyframes([(t, Poser|Motion, ease)...], overlap, soften)`: eased local-space interpolation with follow-through; feet that are on
  the ground in both neighbouring keys are pinned by leg IK and arc when they move. Eases: io, io2, in, out, in3, out3, lin.
- `stand_pose()`, `hand_frame(side, fingers, palm)`, `foot_frame(direction, top)`, `euler_local()`.
- `drift(m, joints, deg, period, seed, weight)` = moving hold; `ramp(t, a, b, c, d)` = overlay weight.
- `body_clearance(m)`, `rest_on_ground(m)`: seated / lying support (joint spheres in `BODY_RADII`).
- `step_foot(m, side, t0, t1, delta)`: one step on a standing motion. `graft_upper(lower, upper)`: captured upper body on an authored lower body.
- `plant_hands(m)`: rigid hands no longer spear the floor (cartwheel, a hand on the ground). `despike(m, deg, radius, joints)`: spreads
  one-frame capture twist flips over a few frames.
In recipes_util.py (reusable by other recipe files via `import recipes_util as U`): `idle_seg`, `hand_path` (IK along keyed points with
keyed finger/palm/pole directions), `spine_turn`, `lookback`, `run_to_stand` (run -> ACCAD RunToStand, rest pinned to a time, pose-matched
cut), `turn_in_place`, `stop_time`, `bar(n, beat)`.

## Tracks (grade = how well a viewer reads the intent in two seconds, on the stick figure)
| track | dur | source | pins (measured) | grade |
|---|---|---|---|---|
| violet | 30.0 | ACCAD Female1 C03_Run (sprint_loop) + C02_RunToStand + idle; IK overlays; CMU 114_16 (sits down); CMU 82_05 (seated) | song_t0 180.995. stop 9.600 (0 ms), look 9.81, pencil 14.98, write 15.41-19.91 (line 0.87 m, THAT stroke 16.12-17.11), release 20.87 (-3 ms), sit_start 22.75, seated 25.93 (+33 ms). Glow is to her LEFT (+X) | B+ (run, stop, sit are capture: A; writing reads as a hand drawing a line at shoulder height: B; needs the line of light) |
| sprint_stop_look | 14.4 | sprint_loop + C02_RunToStand + idle; breath + look-back | song_t0 85.6. at rest 4.200 (0 ms), look starts 6.20, hold from 7.35 to the end | A- |
| float | 30.0 | authored + drift + breath | song_t0 97.513. supine, head toward -Z, hips y 0.10 +-0.02; meta.water | B+ |
| rise | 9.0 | authored keys; frame 0 = float at 116.0 | song_t0 116.0. hips +0.5 m and arms wide at 2.383 (-4 ms); touch 7.75; landed 8.45 | A- |
| release | 7.0 | idle + IK | cupped 1.35, release 2.500 (0 ms) | B+ |
| catch | 16.0 | idle + step back + IK | song_t0 220.0. hands on chest 2.733 (-2 ms), head lifts from 9.6, arms open 12.71 (keyed) | B+ |
| fork_L / fork_R | 2.5 | ACCAD Female1 B22_SideStepLeft, first step, 0.898 m (R = mirror) | leading foot planted 1.000 (0 ms) | A |
| fork_walk_L / R | 4.2 | walk_loop driven along a curve | veer 25 deg, 1.0 to 3.0 (not looked at; passes validation) | B (unseen) |
| land | 4.0 | authored keys | song_t0 124.848. feet touch 0.500 (+5 ms) after a 1.2 m free fall, head_up 1.64, ready 2.23 | B+ |
| free | 21.0 | CMU 142_09 (Joy) + 55_01 (whirl) + 49_04 (leap) + ACCAD Female1 D6_CartWheel + idle + IK flourish + walk_loop | song_t0 236.648. skip apex 1.733 (-6), leap apex 6.950 (-6), joy apex 8.700 (+5), cartwheel upside down 10.433 (-1), turns east 12.79-13.94, flourish 13.91-15.65, walk 17.39. East = +Z at the end | B+ |
| sit_idle | 12.0 loop | CMU 82_05 | seated, knees up | A- |
| life_piano | 7.0 | authored seat (bench 0.47) + CMU 80_70 upper body | look-back 4.5 / 5.4 in every life | B- (needs the keyboard prop; hands at y 0.76, z 0.36) |
| life_violin | 7.0 | CMU 80_36 | | A- |
| life_wetlab | 7.0 | idle + IK (tube, pipette, rack) | | B |
| life_poet | 7.0 | authored cross-legged + IK writing, looks up for the word at 1.9-3.4 | | B (needs the notebook prop) |
| life_nasa | 7.0 | authored brace + buffeting drift; wind from +Z | | B+ (needs wind on hair/trousers) |
| life_band | 7.0 | idle + IK strum on the beat (138 BPM), step-touch | | B- (needs the guitar prop) |
| life_wushu | 7.0 | authored: gongbu punch 0.92, pubu 2.3, rise 3.62 | | B+ |
| life_stage | 7.0 | authored: fists up + jump (apex 1.26), second pump 2.62 | | A- |
| life_home | 7.0 | CMU 82_05 seat + IK: leans back on the left hand, right arm traces a circle on the sky | | B+ |
Prop positions for the lives are in each track's `meta` (track-space coordinates).

## Notes for the show
- violet's written line: body-space ends in `meta.line_from` / `line_to`; draw it from the right hand tip (handR joint + R @ (0, 0.17, 0))
  between write_start and write_end; it leaves on `release`.
- catch: the light arrives from +Z; she takes half a step back (-Z) with her right foot.
- land overlaps M2's `build` (both start at the b73 impact); cut or cross-fade at `ready` (t 2.23).
- rise ends standing at the float's (x, z); float's last usable pose for the hand-off is t = 18.487 (song 116.0).
- free is turned as a whole so that the walk at the end goes along +Z; she travels about 18 m.

## Known weaknesses
- Hands are rigid mittens: "cupped", "holding a pencil", "on the keys" are orientations only.
- The ACCAD run has a fast forearm twist once per stride (softened by despike; invisible on a sleeve).
- Authored lives (piano, band, wetlab, poet) are mimes: they need their prop to read at a glance.
- fork_walk_L/R and the mp4 movies were rendered but not all looked at frame by frame.
