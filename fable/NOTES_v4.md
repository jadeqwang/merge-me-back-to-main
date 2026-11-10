# Director's notes on v4 (round 4, from the motion QA)

v4: `work_fable/out/v4.mp4` (anime figure), sheets `work_fable/stills/v4/sheet_1..3.jpg`, 6 fps strips of the whole film
`work_fable/stills/v4/qa/qa_SSS.jpg` (5 s per sheet, time burnt in), QA reports `work_fable/stills/v4/qa/report_1.md`, `report_2.md`
(the third reviewer's findings are folded in below). A scene-change scan found no unplanned jumps. No pops or broken faces were found;
what is left is below. Items marked CONFIRMED were checked by the director on the strips; the rest must be verified on a strip before
changing anything (a reviewer on a weaker model flagged them; some will be false alarms).

## Pass X: performance and figure (tracks, `fable/engine/src/figure_anime/`, seq 13, 14, 16)
1. CONFIRMED, the most important item in the film: 232.7-236.5 "I have become". She stands in a rigid T-pose (arms dead level,
   straight, symmetric, motionless) for almost four seconds in the first full-colour, open-eyed shot. Re-author the end of `catch`
   (and the start of `handover`) so it is a human gesture: arms open wide and slightly raised (hands above shoulder height, a soft V),
   elbows unlocked and a little behind the shoulders, palms forward and up, chest lifted, head tipped back a little then coming level
   to look at us, weight on one leg; not symmetric; alive through the hold (breath, a slow further opening that peaks on "become"
   232.71 and keeps drifting, fingers/wrists relaxing). The same pose family appears at the rise (118.4-124) and arms wide (172.3):
   check those too and give them the same life if they read as T-poses.
2. CONFIRMED: 125.33 (landing hit, close shot): her hair clumps shoot straight up as two symmetric spikes (reads as horns/ears) and the
   face is a blur. Clamp how far clumps can lift during fast descents (they may trail up and back, never two vertical spikes), and
   make sure the face is readable on the first frame after the cut.
3. Terminal (264.5-282.5): she stands almost motionless for 18 s on a locked camera. Keep the stillness but not frozen: breath, a
   slow weight shift, hair and trouser hems moving in a light wind, one slow head turn toward the text and back. The last frame must
   still match frame 0 (the loop seam), so ease back into the seam pose. The last credit line overlaps the glowing road text "FROM":
   move the credits clear of it. Verify the reported one-frame HUD dropout at 279.0.
4. 236.55-237.05 back foot slides ~30 cm; 237.3-237.7 arms go down then up (from `fable/notes/r3_DE.md`): fix in the `handover` blend.
5. 201.5 the bun looks elongated for one frame; 204.5-205.5 blocky trouser folds dropping into the crouch: verify, fix if real and cheap.

## Pass Y: composition (seq 01-12)
1. CONFIRMED: 117.0-117.95 (end of the float, seen from above): the hair fan shrinks to a dark ball in ~0.2 s and the body crumples
   with an arm flung up. Neither may be seen. Leave the top-down by 116.9 at the latest (cut on a measured beat to the water-line
   shot of her lifting, or let the b69 flash/bloom build from 116.9 so the frame is light by the time she moves), and never shrink the
   fan on screen (it may fade to light).
2. 104.0-104.8: lyric "Branch and wander" reported cut by the bottom/right frame edge: verify; keep it fully inside the title-safe
   area (5% margins) for its whole time on screen. Check every lyric in seq 05-07 against the same margins.
3. 134.8-138.5 (the side truck of the canon kicks): copies clipped by the left/right frame edges and limbs crossing between
   neighbours: verify; widen the spacing or the framing so the front row is whole.
4. 143.5-148 and 171-178: the hero cannot be told from her copies. In the wide 1,024 shots this is intended, but she should be
   findable: only her road (main-orange) under her feet with a soft pool of orange light, in every wide shot of 08-10.
5. 178.33-178.83: frame reported as mostly empty sky with the troupe low and to the right: verify and reframe.
6. 52.3-53.8 (life `nasa`): head reported with a pale ring and hair streaks across the face: verify (wind streaks crossing the face?).
7. 55.8-57.3 (life `home`): her big foreground knees read as a second body: change the angle so the pointing arm and face lead.
8. 200.0-203.5 (writing close-up): the bun touches the top edge: a little head room, without losing the size of the handwriting.
9. 225.3-228.2: after the cut to the high oblique the original is ~40 px tall among the crowd, then alone on an empty plain:
   come in so she is at least a quarter of frame height, the crowd as her frame.
10. 188.3-189.8: the violet runner small at lower right with feet on the bottom edge: reframe.
Left as they are (by design): the tree / braid shots without a figure (45-47, 76-83), the Banach-Tarski lattice, flashes on hits,
bodies coinciding at the instant of a fork.
