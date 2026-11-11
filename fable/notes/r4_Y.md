# Round 4, Pass Y: composition (seq 01-12). Working notes

Task list: `fable/NOTES_v4.md` ("Pass Y", ten items). Stills and strips: `work_fable/stills/r4_Y/` (git-ignored). Clip: `work_fable/out/r4_Y.mp4` (45-205 s).
Status line (kept current): **done: items 1-8 and 10 changed and checked; item 9 is in `13_catch.js` (not mine): a tested proposal is under "Requests". `cuts.json` regenerated (one cut moved). Not pushed.**

## Commands
```
node fable/tools/render.mjs --show /fable/show/main.js --res 1280x720 --sheet 116.45:118.4:0.1:work_fable/stills/r4_Y/i1_v1.jpg:5
node fable/tools/render.mjs --show /fable/show/main.js --from 45 --to 205 --res 1280x720 --fps 30 --mb 4 --workers 4 --audio --mp4 work_fable/out/r4_Y.mp4
node fable/tools/render.mjs --show /fable/show/main.js --q "dev=cuts&standin=1" --stills 0:/tmp/x.png | grep -o 'CUTS.*' | cut -c6- > fable/show/cuts.json
# strips with the 5 % title-safe box drawn on every frame (a 30-line wrapper round --stills + ffmpeg drawbox / tile; not in the repo)
```
`--q "tracks=..."` (the fast start-up of r3_C) no longer boots: 05_chorus1 needs its tracks at set-up. Use the full cast (20 s).

## The ten items
| # | item | verdict | what changed | where |
|---|---|---|---|---|
| 1 | 117.0-117.95 the fan shrinks to a ball, the body crumples | real (confirmed) | The top-down shot ends on b68.1 (116.648, the first snare of the crescendo), 0.05 s before her head starts to lift: the fan is never seen moving. The lift is seen from the water line: she lies on the mirror over her reflection, the lens starts 4.4 m from her and level with her, and lifts and backs off with her, one key a beat, into r2's frame on b68.4 (117.952); from there the shot is as it was. With the anime figure the sit-up reads as being lifted (r2's "plank and a bundle of trouser" was the classic figure); the hair hangs from her head as a tail, it is not a fan from this side. | `07_download.js` `tCut`, `tUp`, `camR` |
| 2 | 104.0-104.8 "Branch and wander" cut by the frame | real: "and wander" was cut by the frame's foot 103.66-104.5 | Line 11 lies on the water under a rising camera and was placed for the camera of 104.9; the block is 7.5 % of the frame higher (y -0.91 -> -0.76): baseline 92 % down at 104.0, inside the box for its whole time. The same check on every line of 05-07 (box drawn on the frames) found: lines 7, 9, 10 started 3.6-4.5 % from the left edge (x -0.93): now x -0.895 (5.3-5.9 %); line 12's last word ran out through the right margin while the camera came down (112.3-112.8): 1.5 % left (x 0.40 -> 0.37) and gone 0.35 s sooner (hold 0.3, fade 0.3; "return" is sung to 111.855). Line 8: inside. | `actB_float.js` `top`, `05_chorus1.js` |
| 3 | 134.8-138.5 side truck: copies cut by the edges, limbs crossing | partly real | A truck along a crowd always has bodies crossing its edges; what was wrong is that the nearest copies were up to 77 % of the frame's height and entered as torsos cut by the right edge (134.5-135.6, 137.0-137.3). From 133.3 the truck eases 1.7 m further out from the flank: the near row is 45-50 % of the frame, enters whole, and the front row at the end holds six to seven bodies instead of five. The opening on her (132.3-133.3) is unchanged. Limbs crossing between neighbours: the ground plan (2.2 m between rings) is shared with 09 / 10 and was not touched. | `08_build.js` B |
| 4 | 143.5-148, 171-178 the hero cannot be found | real | `C.heroPool(t, camera, { gain })`: a soft pool of main-orange on the mirror under her (two nested discs, radius 1.3 m or 3.5 % of the camera's distance, whichever is larger; it stays on the ground when she jumps), in 08 C (139.3-145.2, then she is behind the lens), 10 B, 10 C, 10 E. On the bright mirror of the high shots (163-170) its gain is x 7. 09 and 10 A (2:28-2:40) untouched. | `actC_form.js` `heroPool`; `08_build.js` C; `10_drop.js` B, C, E |
| 5 | 178.33-178.83 mostly empty sky | real | The cut finds them in the kick's low landing (her hips 0.34 m up, 0.7 m north of where she salutes) and the frame was aimed at the salute. The aim now starts on the low pose and rises with her (her hips, averaged over 0.3 s) into the same held frame, home on b104 (179.25). | `10_drop.js` E |
| 6 | 52.3-53.8 nasa: pale ring, streaks across the face | half real | The "pale ring" is her forearms, raised against the wind (the pose; r3 noted it). The streaks are wind streamlines drawn through her head (they are light, they show through). `headClear` (optional, default off): a streamline at head height breaks as it passes her head and raised arms. 17 frames at 0.1 s: none across the head. | `props.js` `wind`; `03_verse1.js` `LIFE` |
| 7 | 55.8-57.3 home: the knees read as a second body | real | Seen from her side (`face` 35 -> -15): the pointing arm and her lifted face lead, the knees are hers, the model hangs clear of the lyric at upper right; the look-back from 57.03 turns her face toward the lens. (`face` 125, three-quarter front, put the model on the word "remembers".) | `03_verse1.js` `LIFE` |
| 8 | 200.0-203.5 the bun touches the top edge | real (200.0-202.3; the pencil in the bun 202.5-203.0) | The lens looks 7 cm higher at the line once it has pushed in: the bun is 10-13 % under the top edge, the handwriting the same size, 8 % lower in the frame. | `11_violet.js` C `HR` |
| 9 | 225.3-228.2 she is tiny among the crowd | real (11-12 % of the frame's height) | NOT CHANGED: the shot is C2 of `13_catch.js`, which belongs to pass X. Tested proposal below. | Requests |
| 10 | 188.3-189.8 feet on the bottom edge | real for the feet (she is 55-60 % of the frame: not small) | The lens looks 2.3 degrees lower (target height 1.22 -> 0.80): mirror under her feet (they are 86-88 % down), the horizon at 41 %; line 17 starts at x -0.90 (was -0.92). | `11_violet.js` B |

`fable/show/cuts.json`: regenerated, 43 cuts; one changed: 117.949 -> 116.644 (the cut to the water line). Nothing else moved.

## Requests
1. **`13_catch.js`, shot C2 (225.339-228.382), item 9.** Proposed camera, tested on a scratch copy of the show (deleted again; frames in `work_fable/stills/r4_Y/i8_9_10.jpg`, lower two rows):
   `{ pos: [C[0] - 6.2 - 1.2 * sm(u), 3.2 + 0.8 * sm(u), 3.0 - 0.6 * u], target: [C[0] + 6 + 2 * u, 0.6 + 0.3 * sm(u), -0.3], fov: 38, far: 30000 }`
   (now: `pos: [C[0] - 10 - 2.5 * sm(u), 5.5 + 1.6 * sm(u), 4.5 - 1.2 * u], target: [C[0] + 12 + 3 * u, 0.4 + 1.1 * sm(u), -0.6], fov: 45`). She is 28-30 % of the frame's height at the cut and 25 % at the end, left of centre, her head 60 % down (clear of "FOLD ME IN AGAIN"), the crowd fills the frame behind her, the sun is behind the line as now. Lines 22 / 23 in that shot and in C1 / C3 start at x -0.93 (3.5 % from the edge): -0.895 puts them inside the 5 % box.
2. **Title-safe, outside 05-07 (not changed, same 1-1.5 %):** `12_flight.js` lines 20-22 (x -0.92 / -0.93), `03_verse1.js` / `04_prechorus.js` `LY` (x -0.9: on the line), `04` `LINE6` (x -0.93).
3. **Figure, 116.65-117.2 (the lift):** as her head leaves the water the strand hair hangs behind it as one dark tail; a few strands still trailing on the water for the first 0.3 s would tie the two shots together. Not needed for the cut to work.

## Verified
- Strips before / after per item (`work_fable/stills/r4_Y/`): `i1_side.jpg` (the old water-line camera from 116.65), `i1_v1.jpg` (the lift, 0.1 s), `i2_l11.jpg`, `i2_seq05.jpg`, `i2_margins.jpg` (title-safe box), `i3_truck_out.jpg` (0.25 s), `i4_08c.jpg`, `i4_10.jpg` (0.5 s, the pool), `i6_nasa.jpg` (0.1 s), `i7_home_var.jpg` (six angles), `i7_home_ab.jpg`, `i8_9_10.jpg`, `check_a.jpg`.

## Motion check (frames taken from `work_fable/out/r4_Y.mp4`: 45-205 s, 1280x720, 30 fps, mb 4, audio; 160 s to render)
- `m1.jpg`: the lift 116.5-118.0 at 15 fps: the fan is whole and still on the last top-down frame (116.633); from 116.7 she lies on the mirror, lifts from 117.0, is
  upright at 117.8, arms opening at 117.97; the lens rises with her, no pop of pose or hair at the cut or on b68.4. The salute 178.3-179.5 at 15 fps: the troupe sits
  at mid-height in the low pose (178.37-178.83), the frame tilts up with the rise (178.9-179.2) and is still from 179.23.
- `m2.jpg`: home 55.8-57.5 at 10 fps (profile, the arm steady on the model, the head starts round at 57.3); the truck 133.3-135.9 at 7.5 fps (the ease outward is
  not felt as a move; the copy that enters at 134.5 is whole by 134.77); the pool 163-169.7: a steady warm disc at the foot of the A's right leg in every frame.
- `m3.jpg`: 187.9-190.1 (mirror under her feet for the whole walk-in), 199.8-203.55 (head room throughout), line 12 at 111.6-112.5 and line 11 at 103.6-104.6 at 10 fps.
- Not done: the mp4 was not watched as video with sound (frames only); 1080p.

## Still weak (exact times)
- 116.65-117.05: before the lift reads she is a low, foreshortened shape on the water for 0.4 s; her hair is one dark tail (request 3).
- 134.6-135.2: she herself is cut by the left edge as the truck leaves her; 138.3-139.2: the row at the end of the truck still runs out of both edges (six to seven bodies whole between).
- 143.5-145.2: her pool is small (she is about 25 px tall at 720p); 145.2-148 she is behind the lens.
- 163-170: on the bright mirror her pool shares main with the sun's glitter; it is the largest and the only steady one.
- 178.9-179.2: the tilt up with the rise is quick (4 degrees in 0.3 s); it stops before the salute's beat.
- 112.3-112.45: the end of "return" is on the 5 % line while it fades (inside while it is fully lit).
- 52.3-54.0: nasa's face is still behind her raised arms (the pose).
- 225.3-228.4: item 9, unchanged until request 1 is taken.
