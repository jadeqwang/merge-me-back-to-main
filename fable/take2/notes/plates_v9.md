# Plates for film v9 (plates agent, started 2026-11-21)

Brief: `notes/v9_direction.md` section C; Jade's v8 notes `notes/jade_v8_notes.md` (decision 2 car, decision 3 jacket).

## Resume state
- [x] 1. `day_eyes_v2` (oa03): DONE, plate `work_fable/take2/plates/day_eyes_v2` (121 fr, 24 fps), matte `kit/day_eyes_v2`.
- [x] 2. `car_v9` (ob04): DONE, plate `work_fable/take2/plates/car_v9` (210 fr, 30 fps, t0_song 269.9, song-locked, 1920x1080).
State: both plates delivered, nothing queued. Round spend $4.25 (ledger total $577.53).

## day_eyes_v2 method
Base: day_eyes plate frame 1, HFLIPPED (film orientation, she faces left; her LEFT arm = sleeve nearest viewer), scaled 2048
(`dev/v9_plates/ref_day_eyes_f1_flip.jpg`). Edit specs in `gen/stills.json` (`v9_day_eyes_trim*`, `v9_day_eyes_shut`), one ref each.
Clip spec `gen_clips.py day_eyes_v2` (+ END lettering line changed by hand in `media/gen/specs/t2_day_eyes_v2_t1.json` to allow the patch text).
Intake: hflip frames back so the plate has day_eyes' orientation and `mirror: true` stays; film mirror makes the patch read right.
Why mirrored-text trick: the film mirrors day_eyes; a patch made on her left arm in plate orientation would land on her right arm.
Runner reference: `plates/day_run` f60 crop `dev/v9_plates/dayrun_jacket.jpg` (stripe ~half the old close-up band; patch on left arm).

## day_eyes_v2 checks
Strip `work_fable/take2/dev/v9_plates/day_eyes_v2_t1_strip.jpg` (clip in film orientation; the plate is its hflip).
Eye crops: `dev/v9_plates/eyes_v2.jpg` vs `eyes_v1.jpg` (frames 14-33). v1 lids start ~f21, half f23-24, shut f26; v2 start f26,
half f27-28, shut f29: about 4 frames (0.17 s) later -> window clip0 0.62 / clip1 2.33 (same 1.71 s length as v1's 0.45-2.16).
Eyes stay shut to the end (4.96 s); mouth calm closed throughout, nothing grows in the last second; paper stays plain; one figure.
Patch on the near (left) upper arm in every strip frame, stripes stay half-width. Framing: same chest-up three-quarter as v1, head
drifts a little like v1. In the plate (hflipped) the patch text reads mirrored; the film's mirror:true shows it the right way round.

## Car notes
Coordinator caution: the camera IS the driver ("YOU"): no body. Brief must say no hands on wheel, no reflection in mirror/glass, no
second person; audit every frame for invented hands/reflections/mirror face; reject takes that give the driver a body.
V2V candidates (docs/gen_catalog): runwayml/aleph-2 (video edit, keyframes, $0.336/s, ~ $2.35 for 7 s); seedance-2.5
reference_videos (edit, duration -1, $0.9676/s at 720p video input, ~ $6.8); flux-3-video v2v is continuation, not restyle.

## car_v9 method and checks
- Reference: the compositor's v9 clean clip has the driver's hands at ten and two (c5a8732). Coordinator rule: the driver has no body, so
  I re-rendered it with the compositor's own tool, no code edits: `node fable/take2/tools/car3d_render.mjs --mp4
  work_fable/take2/dev/v9_plates/car3d_clean_nohands.mp4 --range 270:276.8334 --crf 10 --workers 1 --q "box=0&hands=0"` (GPU was busy;
  3 workers failed on WebGL context), then 720p crf 17 `dev/v9_plates/car_ref_720.mp4` (205 fr, 1.3 MB).
- Guidance stills (one ref each): `v9_car_first_a1` (drawn driver's view, detailed dash, empty wheel, blank mirror),
  `v9_car_last_a1` (she unchanged, interior around her drawn). `gen/car_v9.py` writes the aleph-2 spec (prompt_images first/last).
- Output: 1920x1080, 30 fps, 205 frames, 6.833 s, motion and timing identical to the 3D (turn, blink at clip ~3.67 s, smile settle, hold).
- Audit: every frame 36-95 (pan) `dev/v9_plates/car_t1_pan.jpg`, mirror crops 0-63 `car_t1_mirror.jpg` (blank, no face), strips
  `car_v9_t1_strip.jpg` / `_strip_b.jpg` (last 2 s), face crops vs 3D `face_cmp.jpg` (frames 95-204: face, blink, almost-smile same,
  mouth closed). No hands, no driver arm, no reflection, no second person. The only hand is hers (white sleeve, enters at ~2.0 s).
- Intake: 30 fps frames, 3 copies of clip frame 0 in front (t0_song 269.9 as car3d_v9) and 2 of the last at the end -> n 210.
- Back of her head: the v9 camera never shows it (it starts at the driver's eye), so that half of Jade's note no longer applies.

## Spend (start of round ~$573; round cap ~$25)
| call | model | est $ | running |
|---|---|---|---|
| v9_day_eyes_trim a1,a2 (edit, 1/3-width trim: too thin, piping) | nano-banana-pro | 0.27 | 573.55 |
| v9_day_eyes_trim_half a1 (edit, 1/2-width trim) PICKED | nano-banana-pro | 0.13 | 573.69 |
| v9_day_eyes_shut a1 (closed eyes, from trim_half_a1) | nano-banana-pro | 0.13 | 573.82 |
| clip t2_day_eyes_v2_t1 (job 394b404696), first=trim_half_a1, last=shut_a1: ACCEPTED take 1 | seedance-2.5 | 1.16 | 574.98 |
| v9_car_first a1 (drawn driver's view, no body), v9_car_last a1 (interior behind her drawn, she unchanged) | nano-banana-pro | 0.27 | 575.25 |
| car_v9 t1 (job bbd800bd7d) aleph-2 on car_ref_720.mp4 + first/last guidance: ACCEPTED take 1 | runwayml/aleph-2 | 2.30 | 577.55 (spend.py: $577.53) |

## Wiring
| plate id | shot | clip0/clip1 | eyes-close / key time | weak points |
|---|---|---|---|---|
| `car_v9` (first in b157-161 `next`, before car3d_v9) | ob04 | songLock (as car3d_v9: `{ songLock: true, push: 0, blend: false }`), same t0_song 269.9, n 210, 30 fps | turn as the 3D: blink ~273.67, smile settled ~274.4, hold to 276.82 | mid-pan 1.6-2.3 s a centre-console screen with unreadable scribble "text" grows (blurred, passes in ~0.5 s); a cyan glowing diamond on the console at frame left in the hold; she is a cheat (door behind her at frame left), as in 3D |
| `day_eyes_v2` (replaces `day_eyes` in b140.3-141.3 `next`) | oa03 | 0.62 / 2.33 (was 0.45 / 2.16), keep mirror:true, push, lyr; streaks matte -> `/work_fable/take2/kit/day_eyes_v2` | lids half-shut clip 1.15 s, shut 1.21 s (v1 0.98/1.08) -> at clip0 0.62 they fall ~0.53-0.59 s into the shot, same as v1 | patch text mirrored in the plate (correct in film); head drift as v1; stripes half-width (runner proportion, not hairline) |
