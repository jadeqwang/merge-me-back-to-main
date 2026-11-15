# Film v4: direction (director's brief, 2026-11-14)

Source: Jade's notes on film v3, verbatim in `notes/jade_v3_notes.md`. Read `fable/take2/HANDOFF.md` first (rules, commands, lessons),
then `notes/v3_direction.md` for the shape of a round. The working rules hold: two owners; each keeps a notes file with a resume
state and commits only its own paths at every milestone; never push; nothing under `work_fable/` and no likeness in a commit; the
plate canon in HANDOFF. **Compositor** appends "Film v4" to `notes/compositor.md`; only it edits `shots.js`, `src/`, `tools/`,
`fable/proof/lives.js`. **Plates** writes `notes/plates_v4.md`, ending with a Wiring table. Spend so far $541.82; plates budget this
round $40; above $600 is approved by Jade (raise the tools' cap constant to 750 if they refuse, and note it).

What the director saw at her timestamps (strips in `work_fable/take2/dev/v4_look/`) is written into each item.

## A. Compositor

1. **b21-22, the runner into the doors (`va05` green/biology, `va06` blue/ames): the sneakers slide.** Jade: "green and blue's
   sneakers slip on the floor but others don't". The cut-out's travel across the floor does not match its stride, so the planted
   foot skates. Measure the stride of each runner cut-out (`tools/gait.py`) and the planted foot's position per frame, then make
   the travel match: while a foot is down it stays on its spot on the floor (drive x from the planted foot, or scale the travel or
   the clip rate to the stride). Check the other door shots the same way and say which you measured. Proof: a crop strip of the
   feet with a fixed floor mark, before and after.
2. **b51-52 `ca08`, the fan.** Jade: start with the shadow Jades already fanned out and being folded in, not fanning out and then
   folding in. The fan is fully open on the first frame of the shot (the b51 downbeat), holds a moment, then folds in one by one
   as now, the last ones gone where they go now. No outward motion at all.
3. **b116-117 `vb09`, the violet light.** Jade: its speed is "very fast for the mood". Now: it grows in her palm at clip 1.95,
   lifts at 2.3, arcs over her head and accelerates to the sunrise by the b117 downbeat. New: it grows in the palm as now, sits
   there a breath, then rises slowly and steadily (no acceleration, a slight sway, about the pace of a lantern let go), drifting up
   and east; it stays in frame, small and still rising, when the shot ends, and never leaves the top of the frame. The b117 downbeat
   flash goes or becomes a soft swell of the light itself. b121 (the violet streak east) may keep its speed: by then the music moves.
   Her eyes should seem to follow it if the plate allows (do not retake for this).
4. **b139-142, the town: she pops in.** Jade: "she seems to pop into existence partway thru this run". The runner is absent in
   `oa02` (b139-140) and present from the first frame of `oa03` (b141) although the town scrolls through without a cut. She is in
   the town from the start: either she runs in from frame left over the first beats of b139 and settles at her place, or she is
   there on the first frame. Director's pick: there on the first frame of b139 (the cut from the sung close-up to her running is
   the clean read). One continuous run across both shots, same stride phase across the b141 boundary, feet matched to the scroll
   speed (item 1's method). Keep her from covering the chips where the layout allows.
5. **Biology facade.** Jade: the med-school building is not the one she was in; use Bio-X. Plates makes `facade_wetlab_v3`
   (the Clark Center); prefer it when its folder exists.
6. **Lip-sync on the two drawn sung shots** (b17 `main_face_v2`, b41-42 `hero_paper_v2`). Jade: keep both, "fine-tune timing",
   and "do the lip sync exercise where we pick the timing". Plates measures each and builds her a picker page; plates gives you a
   lag (or a retimed plate id) per shot in its Wiring table. Add a query override so a lag can be tried without an edit
   (`lagface=<ms>`, `laghero=<ms>`); v4 ships with the measured values, her pick replaces them.
7. Wire the rest from the plates table: `main_light_v3` (b25), `wave_run_v4` (b145-146), `home_v2` (parenthood life plate, every
   use, as `band_v2` was swapped in).
8. Render film v4 exactly as v3 (`render_film.sh film_v4 "" "likeness=0"`, the review encode and five sheets, the local likeness
   render to `work_fable/take2/out/film_v4_local.mp4`, `check.py`, single frame vs full, last frame equals frame 0 with hud=0).
   Look at the sheets and a one-frame-per-beat strip of every changed range, and report what you saw, plainly, including what is
   still weak. Wait for the director's word before the whole-film render; items 1-4 do not wait on plates.

## B. Plates

1. **Lip-sync, first.** `main_face_v2` ("I split myself a thousand ways", `t0_song` 27.6) and `hero_paper_v2` ("Merge me back to
   main", `t0_song` 69.2). Measure the mouth-opening curve per frame against the word times in `analysis_v3` (HANDOFF "Sung
   clips"); report the lag per word. If one constant lag fits, give it; if it drifts, retime with `tools/retime_sung.py` into
   `<id>r`. Then build the picker, as she did for take D (she picked +80 ms by ear in Chrome): one local page
   `review/fable_take2/lipsync_v4.html`, per shot a video of the plate (muted) and the song window as a separate audio element,
   a slider from -240 to +240 ms in 20 ms steps that shifts the audio against the picture live, looping, starting on your
   measured value, with a line of text showing the number to send back. Media under `work_fable/take2/lipsync_v4/` (git-ignored;
   the page is committed, the media is not). Test it in a headless browser: the page loads and the offset changes `currentTime`.
2. **`main_light_v3` (b25, 1.75 s on screen).** Jade: "let's have the hand motion seem natural, just a slow opening, not the back
   and forth motion". v2 opens and closes. One motion only: the cupped hands start nearly closed round the light and open slowly
   and steadily through the whole clip, the glow growing as they open; no closing, no curling back, locked camera, same framing
   and medium as v2. Give the still for the closed start and the open end as first and last frames. Say the clip range to use.
3. **`wave_run_v4` (b145-146, 3.4 s).** Jade: the look back and the giant smile are "kinda weird"; go back to what we had before,
   "but maybe she slowly grows a 15-20% smile during the run (not a goofy grin)", "a subtle shift in expression so she just seems
   more alive rather than a whole stage direction". From the take 2 still (`wave_run3_knees`): she sprints at the lens all through,
   eyes forward, no head turn, no glance; mouth closed, starting neutral and determined, and by the end the corners of the mouth
   have lifted a little and the eyes softened: a small closed-mouth smile, no teeth. First frame the still; last frame the same
   still edited to that small smile only. Blinks welcome. Check the last second for a grin and trim if it grows.
4. **Parenthood: "the face in parenthood is blue"** (0:58, the grid cell; the life plate `home` in `work_fable/proof/plates/`).
   Her face and hands are painted in the room's blue; every other life has her skin tone. `home_v2`: the same picture and medium
   (night room, the lamp, the model planets, the two kids from behind, never photo-referenced), her face and hands in her natural
   warm skin tone lit by the lamp, the film's one face. Edit the plate's still (one reference image), then make the clip with the
   same time structure as `home`, including the look-back at the same clip time, so it replaces `home` everywhere including the
   grid's bar-37 turn. Look at the other parenthood plates (`det_home`, `runner_home`, the fold window) and report any with a blue
   face; fix by the same edit if cheap.
5. **`facade_wetlab_v3`: Bio-X**, the James H. Clark Center at Stanford (curved glass, red-orange steel, three wings round a
   courtyard). First look at `kit/facade_wetlab` (v1): if it already is the Clark Center and reads, say so and propose it. Else one
   Wikimedia Commons photo as the single reference, biology's medium, cut out with `tools/matte.py`, scale and ground line as
   `facade_wetlab_v2`.

Order: 1, 4, 2, 3, 5.
