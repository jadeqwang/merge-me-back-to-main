# Take two: handoff (updated 2026-11-14 after film v3)

Read this first, then `fable/take2/PLAN.md` (section 3 rules and section 11 state), then the notes file for whatever you touch.

## Where things stand

**Film v3** exists (2026-11-14, evening): 185 shots, 282.8 s, 1080p30. It answers Jade's notes on film v2
(`notes/jade_v2_notes.md`, verbatim, with her same-day follow-ups; what each became: `notes/v3_direction.md`). **Nobody has watched
v3 at speed with sound**; checks were stills, beat strips, measurements. Jade is about to watch it.

- Pushed (a card for the one likeness shot): `review/fable_take2/film_v3.mp4`, sheets `film_v3_sheet_01..05.jpg`.
- Local only (her likeness): `work_fable/take2/out/film_v3_local.mp4`. v1 and v2 files are kept.
- Her review page: `review/fable_take2/review_v3.html` (eight decisions; she pastes the export back).
- Spend: **$541.82** (`tools/gen/spend.py`). Jade lifted the cap; the tools' constant is still 600 and was not hit. Nothing queued.
- Per-owner detail: `notes/compositor.md` ("Film v2", "Film v3"), `notes/plates_v2.md`, `notes/plates_v3.md`, `notes/orchestra.md`.
- Decided by Jade: orchestra is the hatched 3D (revision 3 frames; `?orch=plates` shows the video-model version she turned down);
  labels `jade/parenthood`, `jade/rna-band`, `jade/rare-earth`, `jade/biology`, `jade/phd-neuroscience`; violet's message
  `still writing this one`; no lyrics for wordless vocals; second likeness shot dropped (`wave_run`); real places in the town.

Known weak points in v3 (told to Jade): the b33-38 grid keeps the old wushu plate (the new ones have no look-back); `main_split`
does not sing (one attempt failed); the violin stroke starts mid-bow; `float_hand_v2` fingers are mid-curl at the cut; the runner
covers a chip as she passes in the town; the slab on `day_fork` is cream on white paper; the hero shot opens on a washed-out frame;
old branch names survive where they are baked into v7 frames (mostly illegible).

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

## Next work, in order

1. Apply her notes on film v3 (review page export).
2. Step 6 of the plan: costume audit of every plate in motion; readable-text pass (the terminal git log is recaptured by `render_film.sh`).
3. Step 7: master without the review HUD (`--q hud=0`), X and YouTube encodes, subtitles. The loop is exact with the HUD off.

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
