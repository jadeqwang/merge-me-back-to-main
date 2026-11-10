# M2 — build + drop choreography (checkpoint notes)

Tracks for `fable/CHOREO.md` section B: `build`, `drop`, `fall_only`, `salute_only`, `butterfly_only`.
Code: `fable/tools/bake/recipes_choreo.py` (the choreography) and `fable/tools/bake/choreo_lib.py`
(pose builder, foot-aware blend, song-time Timeline). `motion.py` is not edited by this workstream.

## Run it
```
PY=.venv/bin/python
$PY -I fable/tools/bake/bake.py build drop fall_only salute_only butterfly_only   # bake + validate + filmstrips
$PY -I fable/tools/bake/choreo_review.py build drop     # front / side / top stick-figure movies with the song
$PY -I fable/tools/bake/validate.py --tracks build drop fall_only salute_only butterfly_only -v
```
Outputs (git-ignored): `work_fable/tracks/<name>.bin/.json`, `work_fable/tracks/previews/<name>.png`,
`<name>_{front,side,top}.mp4` (beat flashes; red bar = downbeat).

## How it is made
- Stage: +Z downstage (frontal camera), +X her left when she faces +Z. `bt(bar, beat)` = song time.
- `choreo_lib.make_pose(...)`: a key pose from a description (pelvis, spine lean/twist, each foot on the
  ground or in the air, each arm by reach, head by look) solved into clean joint frames. The vocabulary
  (`stand`, `gongbu`, `mabu`, `pubu`, `crouch`, `kick_front`, `slap_kick`, `prone`, `plank`, `squat`,
  `reach`) lives at the top of `recipes_choreo.py`; `S(pose, facing, at)` places one, `mir()` mirrors it.
- `choreo_lib.Timeline(t0, t1, start_pose)`: `to(pose, t, dur, ease)` arrives in a pose exactly on song
  time t; `clip(motion, t_first, t_in, blend_in)` lays a placed mocap clip. Between entries the current
  source keeps playing, so fades are from moving material. Feet are handled in world space by
  `choreo_lib.blend`: a foot that does not move is pinned, one that moves makes a small step (lift arc);
  `free="L"` lets a leg swing by joint rotation (kicks, jumps); `hop` lifts the hips mid-move.
- Eases: `snap`/`hit` = strike profile (speed builds, dies in the last ~3 frames, then dead still),
  `smooth`, `soft`, `in`, `out`, `lin`. `strike(tl, chamber, hit, t)` = chamber then strike on t.
- Breathing is added at the end as a function of SONG time (so `build` and `drop` agree where they overlap).
- Every accent is in the track JSON twice: `events` (track time) and `meta.accents` (song time, bar).

## Phrase table (bar.beat, move, source)
`build` (song_t0 = b73 = 125.343; around the origin; ends in the coil)
| when | move | source |
|---|---|---|
| 73.1 | landing crouch, one hand down (start pose) | authored |
| 73.3 | rise into left bow stance toward +X, right straight punch | authored |
| 74.1 | horse stance to the front, left forearm block overhead, eyes right | authored |
| 74.3 | right punch out to the side | authored |
| 75.1 | turn: right bow stance toward -X, low block | authored |
| 75.3 | left straight punch | authored |
| 76.1 | front snap kick (rear leg), toward -X | authored |
| 76.3 | plant: feet together, fists at the waist, front | authored |
| 77.1 | side kick (R) toward +Z | cmu:135_11 4.00-5.95, apex 5.07 |
| 78.1 | roundhouse (R) toward -Z | cmu:135_07 2.80-4.75 mirrored, apex 3.68 |
| 79.1 | side kick (L) toward +Z | cmu:135_11 12.10-14.00, apex 13.15 |
| 80.1 | spinning back kick (L) toward -Z | accad:Male2_G4 0.02-2.25, apex 1.20 |
| 81.1 / 81.3 | the fan: palms shoot forward, arms open flat to the sides | authored |
| 82.1-82.4 | full turn on the left foot, arms out, ends arms crossed | authored |
| 83.1 | wide horse stance, both palms thrown out | authored |
| 84.1-84.3 | draw in: fists to the waist, feet together | authored |
| 85.1 / 85.3 | bow-stance punch toward +X, turn, bow-stance punch toward -X | authored |
| 86.3 -> 88.1 | open high horse stance on the diagonal, sinking, arms drawing in, head lowering | authored |
| 88.3 | winds into the butterfly's loaded pose; still to the end | pose = cmu:88_06 @ 0.78 s |

The kicks go front, back, front, back along Z (profile for a side camera); her body keeps one facing and the drift cancels.

`drop` (song_t0 = b89 - 1.5 = 151.669; performed around `meta.center` = where the butterfly lands, about (0.99, 0.98) from the build's origin)
| when | move | source |
|---|---|---|
| 151.67-152.70 | identical to the end of `build` (handoff window) | - |
| 89.1 | butterfly kick, APEX on the downbeat | cmu:88_06 (natural speed) |
| 89.3 | sticks the landing: low crouch, one hand down, head up | authored |
| 90.1 | left bow stance toward +X + straight punch (gongbu chongquan) | authored |
| 90.3 | pubu, left palm threading down the extended leg | authored |
| 91.1 | back up to bow stance, right palm push, left arm hooked behind | authored |
| 91.3 | feet together, both arms whip overhead, head snaps left; held | authored |
| 92.3 | turn to -X, slap kick | authored |
| 93.1 / 93.3 | two stepping punches toward -X | authored |
| 94.1 | turning jump (apex) | authored |
| 94.3 | second pubu | authored |
| 95.1 / 95.3 / 96.1 | front snap kicks R, L, R travelling toward +X | authored |
| 96.3 | set: attention at the centre, front | authored |
| **97.1** | **the group fall**: straight-bodied dive along +Z, flat on the downbeat, still through the bar | authored |
| 98.1 / 98.3 / 99.1 | push up / crouch / spring to standing | authored |
| 100.1 | arms straight out to the sides, held | authored |
| 101.1 / 101.3 / 102.1 | horse stance punches: right side, left side, right front | authored |
| 102.3 | right bow stance toward -X, double palm | authored |
| 103.1 | jump double kick, the high kick on the downbeat | cmu:90_05 1.55-3.30, kick 2.42 |
| 103.3 | final low pose (pubu on the landing foot) | authored |
| 104.1 | bao quan salute, held to 180.995 | authored |

## Status (done)
- All five tracks bake and pass `validate.py --tracks` (bone lengths, soles, quats, FK rebuild).
- Accents: every authored accent arrives within one frame of its song time (measured -19..+4 ms; the pose is
  reached on the first frame at or after the time); mocap accents (butterfly apex, the four kick apexes, the
  high jump kick) are within 5 ms. The fall is flat on 167.083 and moves 0.0 mm until 168.56.
- Footprint (hips, relative to each track's centre): build x[-0.62, +0.26] z[-0.57, +0.59]; drop
  x[-1.66, +1.00] z[-0.43, +0.93]. Widest block is bars 93-96 (the travelling phrase): hips 2.0 m, limbs 3.1 m.
- At the phrase starts she is on her centre facing front: b73 (0, -0.10), b81 (0, 0), b97 (0, 0) falling
  along +Z, b100 (0, 0), b104 (0, 0). b77: she steps back 0.55 m into the fighting stance (kicks along Z).
- Net drift: `build` ends on its origin; the butterfly carries her (+0.99, +0.98) m to `drop`'s `meta.center`;
  `drop` ends exactly on that centre. Identical for every copy.

## Things the show should know
- `build` frame 0 is a landing crouch (one hand down). M1's `land` ends in a ready stance, so either cut
  from `land`'s impact straight to `build` at b73.1, or play `build` alone from b73.1.
- `build` -> `drop`: the two tracks are identical from 151.67 to 152.70 s; switch anywhere in that window.
  She is still in the coil from b88.3 (152.30) and launches 2 frames before b88.4+ (152.70), because the
  butterfly needs 0.45 s from loaded to apex.
- Kicks in bars 77-80 go along +-Z (profile from a side camera); b73-76 strikes go along +-X (profile from
  the front); the fall goes along +Z; the last jump travels along +X.
- Holds are breathing-only (no sway); the fall hold has no breathing at all.

## Known weaknesses
- Authored transitions are pose-to-pose: clean and sharp, but there is no weight-shift overlap or
  follow-through beyond a 2% recoil, so close up they read a little mechanical next to the mocap inserts.
- Hands are rigid (no fists/palms); pubu and the palm strikes rely on the forearm line.
- The roundhouse (cmu:135_07) is chest height, lower than the two side kicks.
- Judged on stick figures only (filmstrips, movies); hair/trouser sim on the fast moves is untested.

## Library fixes worth upstreaming into motion.py (all live in choreo_lib.py)
- `make_pose` (authoring poses), `blend` (world-space feet in cross-fades, `free` legs), `Timeline`
  (song-time layout, strike eases, still windows), `put` (place a clip by a foot / mid-feet / an aim
  between two joints), `lift_feet`, `mix`.
- motion.py private helper used: `M._limb_ik` (with `bend_axis`); worth making public.
