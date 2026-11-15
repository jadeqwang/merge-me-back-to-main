# Take two: handoff (updated 2026-11-14, night, after film v4)

Read this first, then `fable/take2/PLAN.md` (section 3 rules and section 11 state), then the notes file for whatever you touch.

**If Jade's first message is a paste headed "MERGE FILM V4: JADE'S NOTES"**: that is the export of `review/fable_take2/review_v4.html`.
Follow "How a notes round runs" below. Worked examples: `notes/jade_v1_notes.md` -> `notes/v2_direction.md`, `notes/jade_v2_notes.md`
-> `notes/v3_direction.md`, `notes/jade_v3_notes.md` -> `notes/v4_direction.md`. A line like "lipsync v4: face +340 ms, hero -40 ms"
is her pick from the lip-sync picker (`review/fable_take2/lipsync_v4.html`, media local in `work_fable/take2/lipsync_v4/`): put the
two numbers in shots.js (or try them with `--q "lagface=X&laghero=Y"`); + means the sound plays later than the picture.

## Where things stand

**Film v4** exists (2026-11-14, night): 282.8 s, 1080p30. It answers Jade's notes on film v3 (`notes/jade_v3_notes.md`, verbatim; what
each became: `notes/v4_direction.md`). **Nobody has watched v4 at speed with sound**; checks were stills, beat strips, measurements.

- Pushed (a card for the one likeness shot): `review/fable_take2/film_v4.mp4`, sheets `film_v4_sheet_01..05.jpg`.
- Local only (her likeness): `work_fable/take2/out/film_v4_local.mp4`. v1 to v3 files are kept.
- Her review page: `review/fable_take2/review_v4.html` (nine decisions; she pastes the export back).
- Spend: **$548.46** (`tools/gen/spend.py`). Jade lifted the cap; the tools' constant is still 600 and was not hit. Nothing queued.
- Per-owner detail: `notes/compositor.md` ("Film v2", "Film v3", "Film v4"), `notes/plates_v2.md` to `plates_v4.md`, `notes/orchestra.md`.
- Decided by Jade: orchestra is the hatched 3D; labels `jade/parenthood`, `jade/rna-band`, `jade/rare-earth`, `jade/biology`,
  `jade/phd-neuroscience`; violet's message `still writing this one`; no lyrics for wordless vocals; second likeness shot dropped;
  real places in the town, biology = Bio-X (Clark Center); on v3 she accepted the violin insert, the wushu face, both drawn sung
  shots, the atomizing, the verse 2 opening, the lyric lane and banach-tarski.

What v4 changed: lip-sync lags measured on consonants (b17 `main_face_v2` +340 ms, b41-42 `hero_paper_v2` -40 ms; her ear decides);
b21 green runner rebuilt so the foot holds (`tools/recross.py`, `cross_wetlab_v4`; blue measured planted, unchanged); b25
`main_light_v3` one slow opening; `home_v2` warm skin everywhere; b51 fan starts open and only folds; b116-117 violet light rises
slowly, no flash; town runner from b139, clip rate 2.26x so feet ride the road; `wave_run_v4` no look-back, small closed smile.

Known weak points in v4 (told to Jade): the wave-run smile arrives over half a second, not across the run; the town runner's
cadence is quick (3.6 steps/s) and her feet creep a little at push-off; a short step in the green lane line at b21 for 2-3 frames;
blue's feet unchanged; plus v3's: `main_split` does not sing, violin stroke starts mid-bow, `float_hand_v2` fingers mid-curl at the
cut, cream slab on `day_fork`, hero shot opens washed-out, old branch names baked into v7 frames (mostly illegible).

## What Jade has decided (binding)

- Plate rules: no stripe across the jacket back (only the pale-blue circle and RARE EARTH); one face in every medium; her kids from
  behind only, never photo-referenced; the names "open source" and "hacker houses"; one strong colour per branch.
- Animatic v1 pacing is right. She likes the paper pass on the 3D crowds ("un-janky").
- The reveal uses the Orbital Sunrise trace, from the daylight relight still (no glasses shadow):
  `orbital-sunrise-video/media/plates/jade_loc_day/take1.first.jpg`. She found the glad take's final smile exaggerated and asked for
  "more thoughtful"; takes E and F answer that. On take D she picked **+80 ms** in Chrome.
- The orchestra of Jades is her idea and she asked for it in 3D. Her brief: some do wushu, most play, a full orchestra.
- Budget: she lifted the $600 cap on 2026-11-14 ("even above 600 is fine, we have plenty of credits"); no new number. Tell her the
  running total at each checkpoint. Rounds two and three cost about $45 and $16.
- From her v1 and v2 notes (all in the notes files): figures must blink and breathe; action should move, not sit as stills; she
  prefers a good underlying layer to an art pass that hides a weak one, but after seeing both she chose the hatched 3D orchestra;
  places are her real places; the drawn Jade may sing where it makes sense (b17, b41-42, b100 do); she was first chair first violin
  and judges violin technique; she likes ideas offered with a recommendation and answers quickly.
- Working method: delegate mechanical work to cheaper models, two or three agents at most, each with a notes file; commit and push at
  every checkpoint after the secret check; say plainly what was checked on stills only.

## Next work, in order

1. Apply her notes on film v4 and her lip-sync picks (the v4 page asks whether she wants a v5 or the master).
2. Step 6 of the plan: costume audit of every plate in motion; readable-text pass (the terminal git log is recaptured by `render_film.sh`).
3. Step 7: master without the review HUD (`--q hud=0`), X and YouTube encodes, subtitles. The loop is exact with the HUD off.

Open items of mine she has not ruled on: the b33-38 grid still shows the older wushu plate (needs a wushu clip with a look-back at
the grid's turn time, as `band_v2` has); bar 18 does not sing; the v3 weak points above.

## How a notes round runs (what worked twice)

1. Save her paste verbatim to `notes/jade_v<N>_notes.md`; append every follow-up she sends during the round, quoted.
2. Render stills at her timestamps (`render.mjs --stills`) and LOOK before deciding what each note means. Her timestamps are song time.
3. Write `notes/v<N+1>_direction.md`: one entry per note saying what it becomes, split by owner. Where she asks a question, answer
   it with a recommendation and tell her; she has agreed each time and said so.
4. Two background agents (model opus): **compositor** (only it edits `shots.js`, `src/`, `tools/`, `fable/proof/lives.js`; code first,
   then wiring, then the render) and **plates** (stills, clips, intake, a Wiring table in its notes). Each commits its own paths,
   never pushes. Send her mid-round additions to both by message; they arrive between tool calls.
5. Look at every plate's frame strip and the compositor's stills yourself before accepting; send retakes back with the reason.
6. Render `film_v<N+1>` (local with likeness, public `likeness=0`), copy the review page to `review_v<N+1>.html` with new decisions,
   update this file and memory, secret check, push, tell her what changed and what is still weak.

Agents stop early while paid clips render ("waiting on its own background work"); tell them to wait with one blocking command.
New plates never overwrite: new ids (`<id>_v2`), picked up through `opt.next` (a list, newest first) or the life-plate override
tables in film.js; a missing plate falls back to the previous source.

## How to run things

- Film page and shot table: `fable/take2/index.html`, `fable/take2/shots.js`, `src/film.js`; owner notes with every command:
  **`fable/take2/notes/compositor.md`**. Stills: `node fable/take2/tools/render.mjs --stills T:out.png`. Movie:
  `--mp4 out.mp4 --range a:b --audio "inputs/Merge (keychange down).wav" --workers 6 --crf 16`. Checks:
  `.venv/bin/python fable/take2/tools/check.py <master.mp4>`. Query flags via `--q`: `hud=0`, `likeness=0` (required for anything
  committed), `orchpaper=solid|light`, `orch=plates` (video-model orchestra), `hero=old`, `prooflanes=0`, `trail=0`, `proofbug=1`.
  Whole film: `fable/take2/tools/render_film.sh <tag>` (runs `tools/gitlog.py` first; do not re-run that between the master and
  `check.py`). After editing shots.js: `node -e "import('./fable/take2/shots.js')"`. Proof range changes: `tools/proof_identity.py`.
- Plates drop in by folder: `work_fable/take2/plates/<id>/` (frames at 24 fps, `meta.json`, `REAL`); still-only plates have
  `still.jpg` and `{"still":true}`. Cut-outs: `work_fable/take2/kit/<id>/` via `fable/take2/tools/matte.py` (venv
  `work_fable/venv_hybrid/bin/python`).
- Generation (paid): stills `fable/take2/gen/gen_stills.py ID` (specs in `stills.json`), clips `fable/take2/gen/gen_clips.py ID`
  then `tools/gen/gen.py submit|wait|collect`, with `/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python`. Intake:
  `fable/take2/tools/intake.sh <id> <clip.mp4>`; notes in `fable/take2/notes/intake.md`.
- Sung clips: the video model's lip-sync drifts, so no single lag fits. Measure the mouth-opening curve per frame, then
  `fable/take2/tools/retime_sung.py PLATE OUT "tau:clip,..." hold0:hold1` puts each mouth shape on its word time. Local plates
  `like_sing1`, `like_sing2` carry `t0_song` in `meta.json`. Drawn sung plates (`drop_face_v2`, `main_face_v2`, `hero_paper_v2`) were
  made from a still plus a 5 s window of the song (`gen_clips.py` `extra["audio"]`) and needed no retime; they are song-locked.
- Tracks measured on plates: `tools/track_road.py` (feet and road), palm and pencil tracks in shots.js. Strips of a clip every
  0.25 s: `work_fable/take2/dev/v2_plates/strip.sh <clip> <out.jpg>`.
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
- For a real building, one Wikimedia Commons photo as the single reference works first time (`work_fable/take2/v3refs/`).
- To hold a framing or a pose in a clip, give the still as BOTH first and last frame. A clip made from a still plus song audio sings.
- A face in strict profile loses her likeness in any medium; three-quarter view with large eyes and the centre parting keeps it.
- The video model cannot do a staged multi-figure event on cue (the singing split, the orchestra arrival); keep those in code or 3D.
- Measure stride period on every running clip (`fable/take2/tools/gait.py`, minimum lag 9); time-scale runners to the beat.

## Rules that must not slip

- Never print or commit the contents of `work/cf_account_id.txt` or `work/gen_kv_ns.txt`; grep the outgoing diff for both values
  before every push. Never deploy or touch Workers or KV.
- No likeness image or clip in the public repo: `review/fable_take2/step0/likeness_local/` and `work_fable/` are git-ignored; every
  committed render uses `likeness=0`.
- Jade's details are private in requests to outside services. Her own photos may go to models; her kids' photos never.
- Commit trailer: `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`. Commit own paths only, never `git add -A`.
