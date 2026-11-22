# Take two: handoff (updated 2026-11-22: film v8 rendered, waiting for Jade's notes)

Read this first, then `fable/take2/PLAN.md` (section 3 rules and section 11 state), then the notes file for whatever you touch.

## Start here (next session)
State at handoff: working tree clean, everything pushed on `fable/merge`, no agents running, nothing paid queued. Spend about $573
(`tools/gen/spend.py`; the tools' cap constant is still 600 and Jade lifted the cap; raise it when needed).

1. **Her v8 notes.** She is reviewing `review/fable_take2/review_v8.html` (open it as a local file; the video menu has local v8 with
   likeness, public v8, and v7). Five decisions: (1) 4:01-4:04 "she doesn't look" right / needs work; (2) car camera move right /
   adjust; (3) 4:01 face plate's broad orange jacket bands vs the runner's thin trim: fine / match; (4) tree drawn in code right /
   adjust; (5) next: v9 / master. Run the notes round as below ("How a notes round runs"): save her paste verbatim to
   `notes/jade_v8_notes.md`, stills at her timestamps, `notes/v9_direction.md`, agents.
2. **Glyph art (she asked to prioritise it).** Everything verbatim plus commands in `notes/glyph_v8.md`; review files in
   `review/fable_take2/v8_glyph/`. Her decisions so far: TWO styles.
   - Style 1, anime close-ups (e.g. 3:42 catch, b129): iteration-1 look B, colour, all scripts, FULL FRAME (`tools/glyphart/paint.py
     --preset colour_all`). Her pick: `3m42_catch_B_colour_figure.jpg`. Not yet animated: `animate.py` needs a `--frames/--fps 24`
     option to read plate frames (and per-frame cut-outs if the figure/background split is kept).
   - Style 2 for 1:34 night (ca10) and 2:15 wushu/orchestra (b79): English/ASCII glyphs only, one font, one size at hatch resolution,
     D film-ink palette on black (`hashglyph.py`, `animate_hash.py`, about 1 s/frame). She said "big improvement", then asked for
     bodies upright only (V3): `2m15_wushu_orch_mono_s2b_V3_720p.mp4` + `sheet_2m15_s2b_V3.jpg` (bodies upright, background rotated).
     **Open with her:** V3 upright vs rotated, and 14 px vs 20 px (we lean 20, mono and serif look alike). My read on V3: bodies read as
     typeset text, busier and flatter than rotated; works best on the wushu, the orchestra close-ups turn into blocks of type, and the
     BiRefNet body mask also catches chairs/stands there.
   - Iteration-2 `marks.py` (flat marks, F2 ink on cream) exists but she chose the styles above; parked.
   - Wiring into the film (after she picks): render frames in v7 numbering, per-shot `v7dir` pointing at the glyph folder, and a
     `paper: 0` option so film.js skips the hatch pass for those shots; for the 3:42 plate, a new plate folder `plates/catch_glyph/`.
     The compositor does this; the glyph renderer's owner paths are `tools/glyphart/**`.
3. Fix-list carried from v8 (do with her v8 notes): purple branch drops at the 0:24.6 cut into the old swoop (ib11); 4:01 streaks faint
   and old peach road behind the 4:04 patches; car: plain 3D stand-in in the over-shoulder opening (a drawn back-view still would cost
   about $0.2 + $1-3 clip, ask her), steering wheel rim bottom-left, blurred mid-pan, smile hold 1.9 s vs 2.4 s in v7.
4. If she picks "master": master from v8 settings under "The master" below (`--q hud=0`), then encodes and subtitles; release files are
   local only (likeness).

## Film v8 (2026-11-22)
Notes `notes/jade_v7_notes.md`, brief `notes/v8_direction.md`; built: `notes/compositor.md` "Film v8", `plates_v8.md`, `car_v8.md`,
`outro_ideas_v8.md` (she picked A "she doesn't look", kept the 4:07 stance). Tree drawn in code (`src/tree.js`); book re-tracked
(`tools/page_track_v8.py`); `page_reveal_v2` one bun pencil; 4:01 `day_eyes` (mirrored, eyes close on b140.4); 4:04 lane patches
under her steps (`src/outro.js`); car in three.js (`src/car3d.js`, plate `car3d`). Public `review/fable_take2/film_v8.mp4`, local
`work_fable/take2/out/film_v8_local.mp4`. check.py: nothing new. Spend about $573. Weak: purple branch drops at 0:24.6 cut; jacket
bands; faint 4:01 streaks; car opening stand-in plain, wheel rim, blurred pan, smile hold 1.9 s. Nobody watched v8 at speed.

## Film v7 (2026-11-21)
Jade's v6 notes: `notes/jade_v6_notes.md`; brief `notes/v7_direction.md`; built: `notes/compositor.md` "Film v7" (resume note,
render record), `notes/plates_v7.md` (Wiring table, measurements). Strips and stills: `work_fable/take2/dev/v7_plates/`, `work_fable/take2/dev/v7/`.
- Car (4:27-4:37): her line `I have a confession to make` deleted; the turn and almost-smile hold ~2.4 s with nothing over her face.
  His line is a JRPG dialogue box (x 0.07-0.93, y 0.75-0.93, `YOU` name tab, typed at 26 letters/s, blinking ▼, fades 0.3 s
  before the cut): `carBox` in `src/film.js`, `CAR_BOX` in `shots.js`.
- 3:30 (b122): `c2_lookup_v2` (breathes ~6 px, one blink at ~211.0, hair streaming in wind, mouth closed), clip 0.3-3.5;
  `opt.comet` removed so the plate's own meteor is the only one. Alt take `c2_lookup_v2a` (less motion) not recommended.
- Pencils (new canon: a pencil in her hand means one in the bun): `vio_write2_v2`, `vio_cutaway_v2`, `vio_grid_stay_v2`
  (first in PROOF_STAY), `violet_v2` (via `LIFE_SWAP.violet`, covers every life-plate use). Old `vio_write` still has two but is not shown.
  Made by image-editing a keyframe and ECC-tracking the clean patch (`gen/bun_pencil_v7.py`).
- Decided by Jade: the violet branch stays special (v6 decision 1). Unanswered v6 decisions stay as built (like_sing0 off).
- Public `review/fable_take2/film_v7.mp4` (80 MB, likeness=0), sheets `film_v7_sheet_01..05.jpg`, `review_v7.html` (four
  decisions: car box, 3:30, pencils, what next; thumbs in `review/fable_take2/v7/`). Local `work_fable/take2/out/film_v7_local.mp4`.
  `check.py`: same outliers as v6, nothing new (`work_fable/take2/out/check_v7.txt`).
- Spend **$571.45** (round $3.39); the tools' cap constant is still 600 — raise it when needed (Jade lifted the cap).
- Weak points told to her: the meteor is already in the sky at the cut-in and drifts (no arrival on the downbeat; the violet
  light's arrival is weaker than in v6 — if she misses it, an option is a later clip window or a matched code streak that enters);
  the box covers her hands; the wind may read gusty; `violet_v2` has a soft dark patch in the bun at frames 71-74; fold sheet
  b49-50 not checked for pencils at readable size. Nobody has watched v7 at speed with sound.

## Film v6 (2026-11-15: rendered, waiting for Jade's notes)

Jade asked for a review of the master against the shipped films ("a solid B-side"). Her words: `notes/jade_v5_notes.md`; brief:
`notes/v6_direction.md` (section C holds her answers: caption stays, camera drives, b56 patch fixed). What was built:
`notes/compositor.md` "Film v6" and `notes/plates_v6.md` (Wiring table, the plates' weak points).

- Public (likeness=0, HUD on): `review/fable_take2/film_v6.mp4`, sheets `film_v6_sheet_01..05.jpg`. Local: `work_fable/take2/out/film_v6_local.mp4`.
- Her page: `review/fable_take2/review_v6.html` (seven decisions). The early likeness shot `like_sing0` is off by default and
  switched by `--q like0=1`; compare clips (local) `work_fable/take2/out/like0_cmp_0.mp4` / `_1.mp4` (bars 104-118).
- Not wired: `pad_handover` (no gap in verse 2); offered to her for 2:01 instead. `check.py` passes (outliers listed in compositor.md).
- Spend **$568.06** (round: $18.04). The tools' cap constant is 600; Jade lifted the cap, raise the constant if needed.
- Nobody has watched v6 at speed with sound. Weak points told to her: violin fingering subtle, stance high, car seat belt on the
  inboard shoulder, the road is minimal, the camera's line in the car is 50 px (door panel).
- Next: her v6 notes, then either v7 or a new master and encodes (settings under "The master" below).

## The master (2026-11-14, late night)

Jade accepted film v4 ("looks good!", `notes/jade_v4_notes.md`) and chose "Go to the master"; brief `notes/master_direction.md`.
Changes after v4: `home_v3` (the kids' visible skin warm), ames message `landed a 747 in a class 4 sim`, phd message
`language and music cognition, auditory neuroscience` (git log rows 31 px to fit), lip-sync kept at +340 / -40 ms.

- Release master, local only (her likeness): `work_fable/take2/out/merge_master_1080p.mp4` (1080p30, no HUD, CRF 16, 1.13 GB).
- Deliverables, local only: `work_fable/take2/out/deliver/merge_youtube_1080p.mp4` (CRF 14, 1.38 GB), `merge_x_1080p.mp4`
  (10 Mb/s, 360 MB), `merge.en.srt`, `merge.en.vtt` (22 cues, the film's own line timing). Audio from the WAV, lag 0 ms measured.
- Pushed: `review/fable_take2/merge_master_public.mp4` (likeness=0, capped, 80 MB), sheets, `merge.en.srt/.vtt`.
- Spend **$550.02**. Details: `notes/compositor.md` "Master", `notes/plates_v5.md`.
- **Nobody has watched the master or the encodes at speed with sound.** Open with Jade: (1) b56 `main_back_wide` has the 1420 MHz
  patch on her right arm (canon: left), found by the Step 6 audit; a retake means re-rendering the master; her call. (2) She wrote
  "1040p"; taken as 1080p (the plan's master size). Anything she asks next is a fix to the master, then re-run the encodes
  (settings in the encode agent's report, summarised above; X script ancestor `fable/tools/deliver_uhd.sh`).

## Where things stood at film v4

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
