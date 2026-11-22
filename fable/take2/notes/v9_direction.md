# Film v9 direction (from `notes/jade_v8_notes.md`, 2026-11-21)

Coordinator: Fable (main thread). Three owners, each with a resume note, each commits its own paths, never pushes.
Stills looked at for every timestamp (v8 local). Shot ids from `node fable/take2/tools/shots.mjs --table`.

## A. Glyph art into the film (owner: glyph agent, `tools/glyphart/**`, note `notes/glyph_v9.md`)

**Style 1, "multi-size"** = paint.py/animate.py, all scripts, multi-size, colour, FULL FRAME (her pick `3m42_catch_B_colour_figure.jpg`,
with background painted too). Plate shots; output = new plate folders `work_fable/take2/plates/<id>_glyph/` (24 fps frames, meta.json, REAL).

| note | shot | plate now in the film (check film.js overrides/`next`) |
|---|---|---|
| 0:29.82 b17.4 | va02 | main_split (the frame at her time is va02; va01 face left as is, tell Jade) |
| 0:44.43 b26.2 | va10 | main_release |
| 1:10.79 b41.3 | ca01 | proof E:hero (hero_paper_v2), sung: keep mouth readable |
| 1:15.84 b44.3 | ca03 | hero_feet |
| 1:31.10 b53.2 | ca09 | look_back |
| 1:37.09 b56.4 | ca11 | main_back_wide |
| 1:38.30 b57.2 | ba01 (and ba03-ba05, same plate) | float_top: on HER BODY (and hair/water); the gliding life window in ba04 stays as it is |
| 1:41.70 b59.2 | ba02 | float_face |
| 3:29.98 b122.2 | cb02 | c2_lookup_v2 |
| 3:42.36 b129.3 | cb09 | catch |
| 4:01.71 b140.4 | oa03 | day_eyes on WHITE paper: after the plates agent delivers the jacket-matched plate (section C) |

Lyrics, lanes, slab type, chips, windows are drawn by the compositor on top and stay un-glyphed.

**Style 2, "single-size"** = animate_hash.py V3: ASCII, mono 20 px, upright glyphs on the body (matte), rotated same-size letters in
the background, D ink palette on black. v7 shots; output = frame folders in v7 numbering with meta.json.

| note | shots | source |
|---|---|---|
| 0:31.92 b19.1 | va03 | v7 seq 01 |
| 1:33.18 b54.3 | ca10 | night world; the lit windows stay exactly as they look in v8 (compositor draws/keeps them on top, or composite them from the v8 look) |
| 2:13.42 b77.4 | bu10, 12, 13, 15, 16, 18, 19, 21 | v7 seq 08 wushu formation (the whole run, not only her bar) |
| 2:19.15 b81.1 | bu22 onward, all orchestra shots | v7/orchestra |

**Drop, 2:33.65 b89.2**: she likes the black-and-gold hatch look as it is; wants the marks to be slashes and such (/ \ | - and kin)
instead of hash strokes. Same density, same gold-on-black, same read at full frame. Every v7 shot of the drop section (dr*). Stroke
glyphs only, turned along the hatch direction (this is the dropped "V2" idea applied to the whole frame). Show a still at 153.65
beside the v8 frame before rendering the range.

## B. Compositor (owner: compositor agent; only it edits `shots.js`, `src/`, `tools/` outside glyphart; note `notes/compositor.md` "Film v9")

1. Wire A: `opt.paper: 0` (skip paper pass) + per-shot `v7dir` for style 2 and the drop; `<id>_glyph` plates for style 1.
2. Sneakers slip at 0:35.82 (va05 wetlab), 0:37.54 (va06 ames), 0:39.58 (va07 hacker houses): the soles slide on the lane. Measure
   foot vs ground per frame (`tools/track_road.py`, `tools/feet.py`, `tools/recross.py` did va05 in v4) and lock the planted foot
   to the lane (scroll/retime the lane or the clip so stance-foot ground speed is zero). Check va04 too.
3. Car (ob04, `src/car3d.js`), her decision 2 "almost right": once inside the car the camera STARTS at the driver's eyes (so the turn
   to her has more time; smile hold back to about 2.4 s). The `YOU` box sentence breaks evenly over two lines (no single-word
   second line). Then render the car clip clean (no box, no HUD) for the plates agent to use as video-model reference.
4. Carried v8 fix list: purple branch drop at the 0:24.6 cut; 4:01 faint streaks and old peach road behind the 4:04 patches; car
   steering-wheel rim bottom-left, blurred mid-pan.
5. Render `film_v9` (local with likeness; public likeness=0), sheets, `review_v9.html`, check.py.

## C. Plates (owner: plates agent; note `notes/plates_v9.md` with a Wiring table)

1. 4:01 `day_eyes` (oa03), her decision 3 "match the closeup to the runner and make sure there's an arm patch": jacket as the runner's
   (thin orange trim, not broad bands), 1420 MHz patch on her LEFT arm visible, no stripe on the back, one bun pencil rule n/a.
   New id `day_eyes_v2`; eyes close on b140.4 as now. Hand to the glyph agent when accepted.
2. Car: pass the compositor's clean three.js clip to the video model as the reference (camera path and layout from it) to fill in
   the car interior and the back of her head; she turns, almost-smile, hold. New plate id; keep the 3D version as fallback.
   Lessons in HANDOFF.md apply (one reference image; first+last frame to hold framing; check the last second).

## Decisions recorded
1 "she doesn't look" right. 4 tree in code right. 5 v9 with notes. Style-2 size: 20 px (as the V3 she approved).
