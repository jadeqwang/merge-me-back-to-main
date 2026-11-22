# Listen agent, film v11 (2026-11-22)

Film `work_fable/take2/out/film_v11_local.mp4` (15:42). Outputs (git-ignored): `work_fable/take2/dev/v11_listen/` with
`film_v11/` (cuts.md/json, energy.png, table.txt), `strips/v11_catch_p00..05`, `strips/v11_outro_p00..05`, `ev/v11_*.jpg`
(event sheets, `cmp_*` = v10 vs v11 side by side; local, likeness). Re-run commands: end of the "v10 final re-measured" section of
`listen_v10.md` (TAG=v11). Baseline for comparisons = film_v10f (final v10).

## v11 measured (2026-11-22)

**Sync and cuts.** Audio = song at +0.0 ms. Table identical to v10's. 193 detected cuts, 178 table cuts, 175 within 17 ms of table,
160 within 17 ms of a beat: the same cuts at the same frames as final v10 (none moved; no table cut over 2 frames except pc01 +91 ms
and dr01 -120 ms, as before). Only the internal detections differ (ca07 internal new, va07 internal gone).

**Luma diff vs final v10** (mean-luma per frame, threshold 0.5): changed 207.9-209.5 (streak), 211.2-212.9 (cb03), 219.73-238.43 (cb08-cb12,
no-slab; max 19), 205.0-206.5 (vb10 letters, small), 269.1-269.3 and 271.1-271.2 (car box), and 48.9-56.0 (notation on the life plates).
**Not on your list:** smaller changes (mean 0.5-1.5, max 0.9-3.1) at 30.0-31.5 (va02: notation drawn on her jacket and trousers,
seen in a side-by-side), 43.7-45.4, 56.6, 65.0-65.4, 69.7-76.6, 90.5-92.2 (ca09 "NOTHING THAT": more notation on the jacket), 95.7-96.4; and
single frames at 104.37, 125.07 (max 3.4), 131.20, 132.87. So the notation reaches beyond va12-pc01 (47.2-62.8) to
verse 1, chorus 1 and the breakdown/build plates; confirm that is intended. Nothing changed in 0-30, 97-205 other than those frames,
or 238.5-269 and 273-282.8.

**Per-event offsets**

| event | target | measured | offset |
|---|---|---|---|
| cut into cb01 (streak plate) | 207.819 | f6235 207.833 | +14 ms (0 fr) |
| comet head enters | 207.819 | extrapolated left-edge crossing 207.83; white core first visible f6237 207.900 (x 88 at 207.933, 166 at 208.000), tail HANDOFF.md readable from ~208.1 | +10 ms (0 fr) extrapolated; +81 ms (2.4 fr) first visible |
| comet head at its mark | 209.526 | head x 1385 px (0.72 W = the mark 1382) on the last cb01 frame f6285 209.500, still moving ~600 px/s; head crosses 1382 at ~209.49; cut to cb02 f6286 209.533 | -35 ms (-1 fr); cut +7 ms |
| first letters in her hands (cb08) | 220.45 | violet mark small and alone to f6615 220.500; faint letters f6617 220.567; clear pour f6619 220.633 | **+117 ms (3.5 fr) faint, +183 ms (5.5 fr) clear** (v10 final: +50-83 ms) |
| survivors assemble | 228.30 | first motion in the torso crop 228.333, peak 228.53, settled 228.70-228.73 | +33 ms (1 fr) start |
| line 1 complete (MERGE ME / BACK TO / MAIN) | 228.69 | motion ends 228.700-228.733; fully stable by 228.733 | +10 to +40 ms (0-1 fr) |
| step 2 (to FOLD ME IN) | 229.12 | motion starts f6874 229.167, peak 229.20-229.27 | +47 ms (1.4 fr) |
| step 3 (MAIN) | 229.54 | motion starts 229.567, peak 229.60-229.67 | +27 ms (0.8 fr) |
| step 4 (ME) | 229.97 | change 229.933-230.167 | -37 to +0 ms (-1 fr) |
| step 5 (I) | 230.39 | change 230.433-230.600 | +44 ms (1.3 fr) |
| last mark (violet I) gone | 231.210 | shrinks from 231.067, tiny f6936 231.200, gone f6937 231.233 | +23 ms (0 fr) |
| eyes open | 231.210 | closed through 231.200, open 231.233 (one-frame hard change) | +23 ms (0 fr) |
| daylight front starts | 231.210 | first edge on the shoulder 231.233; jacket colour is already coming in from ~230.77 | +23 ms (0 fr) |
| daylight full | 235.038 | top-right crop luma: 36 at 234.03, 90 % (180) at 234.533, 95 % (194) at 234.667, 205 at 235.000 | -0.50 s to 90 % (-15 fr), -0.37 s to 95 %: the front sweeps 234.07-234.55, a slower start than v10 final (234.47-234.63) |
| likeness whole on the impact | 235.038 | f7051 235.033 (luma 205 -> 171, same as v10 final) | -5 ms (0 fr) |
| car box fully typed | 271.21 | "plausi" at 271.100, "plausible" complete f8136 271.200 (box starts typing on the cut 269.133) | about -10 ms (0 fr) |
| car box gone | 272.543 | fade starts 272.233, faint 272.50, gone by 272.533-272.567 | about 0 to +24 ms (0 fr) |

Events I did not re-measure because the luma shows no change in their frames: violet branch leaves 255.485 (+15 ms), commit line 262.301
(-1 ms), her turn 272.543+ (start +90 ms, eyes on camera 272.80 = +8 fr), dr26/dr30 wipes (+17 / +0).

**Over 2 frames (66.7 ms):**
1. First letters in her hands: +117 ms faint / +183 ms clear (3.5-5.5 fr) late; v10 final was +50-83. The cb08 plate is slower to show letters.
2. Daylight "full" 0.37-0.50 s (11-15 fr) before the bar: the sweep begins 0.4 s earlier than v10 final but ends at the same place;
   the face growth and the cut hold the impact.
3. Comet head first visible +81 ms (2.4 fr); by extrapolation it crosses the edge on time, so probably the glow's fade-in.
4. Unchanged: her eyes to camera +8 fr; table cuts pc01 +91, dr01 -120 ms.
Within 2 frames: streak enters and arrives (-1 fr), all five line steps (+1.4 fr at most), last mark, eyes, impact, car box.

Fusion beats: the five steps now land within +47 ms of the design times (v10 final glows were +190-230 ms late), i.e. on the beat.
Not measured: letters in vb10 (same timing, per the brief), no-slab (visual only: no slab text in 219.7-238.5 in the strips).
