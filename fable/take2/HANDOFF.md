# Take two: handoff (written 2026-11-14)

Read this first, then `fable/take2/PLAN.md` (section 3 rules and section 11 state), then the notes file for whatever you touch.

## Where things stand

The whole film exists as **film v1** (185 shots, 282.8 s, 1080p30, on `inputs/Merge (keychange down).wav`, timing `analysis_v3/timing.json`).
Steps 0 to 5 of the plan are done. **Nobody has watched film v1 at speed with sound.** Every check so far was on stills, contact
sheets, clip strips and measurements. Jade is about to watch it and send notes.

- Pushed (cards for the two likeness shots): `review/fable_take2/film_v1.mp4`, sections `section1_v1`, `section2_v3`, `section3_v3`,
  `section4_v2`, `section5_v1`, orchestra looks `orchestra_v1.mp4` (solid) and `orchestra_v1_light.mp4`.
- Local only (git-ignored, has her likeness): `work_fable/take2/out/film_v1_local.mp4`.
- Her review page: `review/fable_take2/review_v1.html` (timestamped notes plus thirteen decisions; she pastes the export back).
- Lag picker for the sung takes: `review/fable_take2/step0/likeness_local/index.html` (local only).
- Spend: **$480.10 of the $600 cap** (`python tools/gen/spend.py`). Nothing is queued.
- Branch `fable/merge`, pushed. Last film commit: the compositor's `29733c1`; later commits are notes, the review page and this file.

## What Jade has decided (binding)

- Plate rules: no stripe across the jacket back (only the pale-blue circle and RARE EARTH); one face in every medium; her kids from
  behind only, never photo-referenced; the names "open source" and "hacker houses"; one strong colour per branch.
- Animatic v1 pacing is right. She likes the paper pass on the 3D crowds ("un-janky").
- The reveal uses the Orbital Sunrise trace, from the daylight relight still (no glasses shadow):
  `orbital-sunrise-video/media/plates/jade_loc_day/take1.first.jpg`. She found the glad take's final smile exaggerated and asked for
  "more thoughtful"; takes E and F answer that. On take D she picked **+80 ms** in Chrome.
- The orchestra of Jades is her idea and she asked for it in 3D. Her brief: some do wushu, most play, a full orchestra.
- Budget: paid generation may go up to the $600 cap; tell her the running total at each checkpoint; ask before going past it.
- Working method: delegate mechanical work to cheaper models, two or three agents at most, each with a notes file; commit and push at
  every checkpoint after the secret check; say plainly what was checked on stills only.

## Waiting on Jade (the review page lists these)

1. Orchestra look for bars 81-84: solid, light, or light stripped back to black sky and flat ground (my lean; not built).
2. The first orchestra shot (fly in and sit) still reads as a firework.
3. First "Back to main": take E, F or D, and the lag. Film v1 local uses E at +80 ms (my provisional choice).
4. Second "Back to main" (wide): does it read as her. Local plate is the wide take re-timed, +80 ms.
5. The BACK TO MAIN slab crosses her outstretched arm in the first likeness shot.
6. Whether the stance stills (bars 73-80) are true wushu. The "empty stance" failed twice and was dropped; two drop stances are used.
7. Runner kit built large with feet behind the lane (the video model will not keep a small full-length runner).
8. The hand on the water closes round the light where the plan had it opening.
9. Intro counter stops at 64.
10. Bars 54-55 lit windows and commit nodes: not built.
11. Credits wording: placeholder from PLAN section 10 item 3, not approved.
12. The lives list and commit messages (Cloudflare is not one of the twelve).
13. Budget for fixes.

## Next work, in order

1. Apply her timestamped notes and decisions (compositor work is free; retakes about $1.16 a clip, $0.13 a still).
2. Step 6 of the plan: costume audit of every plate **in motion** (I audited every still and five frames per clip, not every frame);
   readable-text pass (no model-drawn text shown; check the sleeve patch on small figures, the child's patch in `root_light` reads
   garbled up close); fix the known weak shots below.
3. Step 7: master without the review HUD (`--q hud=0`), X and YouTube encodes, subtitles. The loop is exact with the HUD off (last
   frame equals frame 0).

Known weak shots: orchestra wides through the paper pass; aerial pull-back (b147-148) is plain; code pencil branches on `day_fork` are
faint; hard-edged patch cells in b130-131; small violet comet in `c2_lookup` (the clip has a stray arm at the right edge, cropped
out); fused runners keep only the first runner's medium; handwriting "docs: start here" is hand-built; bars 54-55 overlays missing.

## How to run things

- Film page and shot table: `fable/take2/index.html`, `fable/take2/shots.js`, `src/film.js`; owner notes with every command:
  **`fable/take2/notes/compositor.md`**. Stills: `node fable/take2/tools/render.mjs --stills T:out.png`. Movie:
  `--mp4 out.mp4 --range a:b --audio "inputs/Merge (keychange down).wav" --workers 6 --crf 16`. Checks:
  `.venv/bin/python fable/take2/tools/check.py <master.mp4>`. Query flags via `--q`: `hud=0`, `likeness=0` (required for anything
  committed), `orchpaper=solid|light`, `hero=old`, `prooflanes=0`, `trail=0`, `proofbug=1`.
- Plates drop in by folder: `work_fable/take2/plates/<id>/` (frames at 24 fps, `meta.json`, `REAL`); still-only plates have
  `still.jpg` and `{"still":true}`. Cut-outs: `work_fable/take2/kit/<id>/` via `fable/take2/tools/matte.py` (venv
  `work_fable/venv_hybrid/bin/python`).
- Generation (paid): stills `fable/take2/gen/gen_stills.py ID` (specs in `stills.json`), clips `fable/take2/gen/gen_clips.py ID`
  then `tools/gen/gen.py submit|wait|collect`, with `/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python`. Intake:
  `fable/take2/tools/intake.sh <id> <clip.mp4>`; notes in `fable/take2/notes/intake.md`.
- Sung clips: the video model's lip-sync drifts, so no single lag fits. Measure the mouth-opening curve per frame, then
  `fable/take2/tools/retime_sung.py PLATE OUT "tau:clip,..." hold0:hold1` puts each mouth shape on its word time. Local plates
  `like_sing1`, `like_sing2` carry `t0_song` in `meta.json`.
- 3D orchestra: `fable/show/seq/orchestra.js`; notes `fable/take2/notes/orchestra.md` (render command, shot list, `orch=0` off).
- v7 re-timing: `fable/take2/notes/v7.md`. Paper and glyph passes: `fable/take2/notes/effects.md`.

## Lessons that cost money to learn

- Give the image model ONE reference image. A second (the character sheet, another plate) made it copy the sheet's layout and labels
  or paste the figure into the other picture. Restyling one approved still into another medium works with that still alone.
- The image model puts the sleeve patch on whichever arm is visible. For back and three-quarter views say which side of the picture
  each arm is on and that the other has a band and no patch; when it still fails, edit the patch out.
- The video model reframes: it will not hold a small full-length figure on a flat ground (padding the still does not help, nor does
  a square frame), and several clips do not start on their first-frame still. Lay out type against the clip's own frames.
- Ask for hands as "slender hands of a young woman, smooth skin" or they come back old; say "bare hand, not a glove" on two-colour art.
- Generated wushu stances are unreliable; faces and hands are safe. The plan's rule (martial arts stay in the mocap) held.
- Clips sometimes grow things the brief forbade late in the take (a sliver of sunrise becomes a sun, eyes open, a smile, a bloom):
  check the last second and trim.
- Measure stride period on every running clip (`fable/take2/tools/gait.py`, minimum lag 9); time-scale runners to the beat.

## Rules that must not slip

- Never print or commit the contents of `work/cf_account_id.txt` or `work/gen_kv_ns.txt`; grep the outgoing diff for both values
  before every push. Never deploy or touch Workers or KV.
- No likeness image or clip in the public repo: `review/fable_take2/step0/likeness_local/` and `work_fable/` are git-ignored; every
  committed render uses `likeness=0`.
- Jade's details are private in requests to outside services. Her own photos may go to models; her kids' photos never.
- Commit trailer: `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`. Commit own paths only, never `git add -A`.
