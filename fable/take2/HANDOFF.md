# Take two: handoff (updated 2026-11-22: film v9 rendered, waiting for Jade's notes)

Read this first, then `fable/take2/PLAN.md` (section 3 rules and section 11 state), then the notes file for whatever you touch.

## Film v9 (2026-11-22: rendered, waiting for Jade's notes)
Notes `notes/jade_v8_notes.md`, brief `notes/v9_direction.md`; built: `notes/compositor.md` "Film v9", `notes/glyph_v9.md` (Wiring
table, settings), `notes/plates_v9.md`. Art-direction essay (Fable, her request): `notes/art_direction_fable.md` (thesis: the film
is about the violet branch that does not merge; top moves: catch at 3:42 as climax, a glyph grammar, clear the outro).
- Public `review/fable_take2/film_v9.mp4`, sheets `film_v9_sheet_01..05.jpg`, page `review_v9.html` (8 decisions). Local
  `work_fable/take2/out/film_v9_local.mp4`. check.py: v8's outliers plus dr20 (+2.1 frames). Spend $579.85.
- In: style 1 (multi-size) on va02, va10, ca01, ca03, ca09, ca11, ba01-05, cb02, cb09, oa03 (`<plate>_glyph`); style 2 (mono 20 px,
  upright bodies) on va03, ca10 (windows as v8), bu10-bu30; drop in slash glyphs (`v7/glyph_drop`); `?glyph=0` = v8 look. Car:
  driver's-eye start, `car_v9` (aleph-2 pass over the 3D clip, no driver hands; `car3d_v9` fallback), box in two even lines.
  `day_eyes_v2` (thin trim, left-arm patch). Sneakers locked on va05/va06 (`tools/slip.py`, `tools/relock.py`). Carried v8 fixes done.
- Weak / open: va07 (0:39) still glides (retake `cross_hackerhouses_v9_lock` locks but barely travels; v8 plate kept); orchestra in
  upright letters loses pink and reads as grey blocks at small size; style-1 shimmer on near-static plates (catch, c2_lookup);
  va01 face left un-glyphed; car console scribble mid-pan and cyan diamond. Nobody has watched v9 at speed with sound.
- Disk: full renders v1-v6 of this cut and v7 masters deleted at her request. Other cuts untouched (out/tmp ~27 GB, out/final +
  out/review ~14 GB, work_fable/out v1-v5 ~12 GB): offered to her, awaiting her word.
- Next: her v9 notes (run a notes round as below), and her answer on which essay moves to pursue.

## Start here (next session)
State at handoff (2026-11-22): working tree clean, everything pushed on `fable/merge`, no agents running, nothing paid queued.
Spend $579.85 (`tools/gen/spend.py`; cap constant still 600, Jade lifted the cap; raise it when needed). Disk about 200 GB free.

1. **Her v9 notes.** She is reviewing `review/fable_take2/review_v9.html` (local file; menu: local v9, public v9, v8). Eight
   decisions: (1) the two glyph styles as placed: right / adjust; (2) orchestra 2:19 in upright letters: keep / rotated / back to
   hatch; (3) drop in slashes: right / more visible characters; (4) car 4:30: right / adjust; (5) 0:39 runner glide: accept / another
   plate; (6) 4:01 on glyph paper: keep / clean line; (7) which essay moves to pursue (multi-select); (8) v10 / master.
   Run the round as in "How a notes round runs": paste verbatim to `notes/jade_v9_notes.md`, stills at her timestamps, write
   `notes/v10_direction.md`, then agents. This round used three opus agents (glyph, compositor, plates) plus the main thread
   looking at every sheet; that split worked. Order dependencies: plates before glyph for any new plate that gets glyphs;
   compositor's full render only after all sources land.
2. **The v10 plan** drawn from the essay: `notes/v10_plan.md` (proposal: eight gates for Jade, items A-F with shot ids, order of
   work, risks). It becomes `notes/v10_direction.md` once she answers the gates and sends v9 notes.
   **The essay** (`notes/art_direction_fable.md`, 4,300 words, she has only my summary so far). If she picks moves from it, the
   feasible-in-pipeline ones are ranked there with timestamps: catch at 3:42 as climax (violet's handoff text crosses and writes main
   through), glyph grammar (a notation per life; glyph size as the merge variable), clearing the outro (cut 4:07 stance, 4:12
   aerial, log burst), lives ending once at 2:00 (needs captions written by Jade), drop as violet's drawing. Its opinions against
   her binding choices (slab lyrics over chorus 2, the 4:09 rainbow wave run) are hers to weigh; do not act on them unasked.
   The essay also disagrees with parts of v9 as she specified it (style 1 on every close-up; glyphs at 4:01): told to her, her call.
   **Answered 2026-11-22:** G1 yes (the catch is the climax; she wants letters *merging together*, which "the patchwork jacket was
   only metaphorically gesturing at") and G4 yes (clear the outro). Gates G2, G3, G5-G8 still open.
   **Her ask for v10:** actually check the film against the song. We cannot hear or watch; do `notes/v10_plan.md` section 6
   (audio measured and read as spectrograms/energy against the bar map, dense frame strips with beat ticks, picture-vs-music
   energy plot, per-event offsets in ms, short clips with one question each for her ear) and report which checks were measured
   and which wait on her. Stop writing "nobody has watched it at speed" as a bare caveat; say what was measured instead.
3. **Open items told to her** (fix with her notes): va07 0:39 glide (options: `cross_hackerhouses_v9_lock` with an earlier window
   via maxSpeed 2 or a later wipe, entry commented out in `CROSS_V4` in shots.js; or a third paid take that starts further from the
   door); va04 slip never measured (matte takes the door); orchestra pink lost in the D palette and bodies read as grey blocks at
   640 px; style-1 shimmer on catch and c2_lookup (eighth-note boil + background refill; lower the boil or freeze background
   glyphs on near-static plates); 4:01 paper turns light-grey type; va01 face un-glyphed (her 0:29.82 note sat on the cut, applied
   to va02 only); car_v9 console scribble at 1.6-2.3 s and cyan diamond in the hold; bu09 (2:12) dark hatch shot sits right before
   the glyph wushu run; dr20 cut registers +2.1 frames late.
4. **Disk, awaiting her word:** other cuts' old renders untouched: `out/tmp/v_*.mp4` (~27 GB, temp renders, safest),
   `out/final` + `out/review` (~14 GB), `work_fable/out/v1..v5.mp4` and r2/r3/r4/act parts (~12 GB; keep v6, v7, v7_uhd, whose
   frames feed take two). She said keep the latest two versions of the full film; in take two that is now v8 and v9 (v7 finals
   are still there and may go when v10 exists).
5. If she picks "master": settings under "The master" below (`--q hud=0`), then encodes and subtitles; release files local only.

Switches worth knowing: `?glyph=0` renders the v8 look everywhere; `?carv=8` the v8 car move; `?hands=1` driver's hands in the 3D
car (off by default: she did not ask for them). The car 3D render needs `--workers 1` (GPU memory; 3 workers gave black frames).
New tools: `tools/slip.py` (stance-foot slip vs ground homography; trust it over the v4 toe measure), `tools/relock.py`
(`--keylane`, `--fill aNNN`), `tools/swoop_track.py`; glyph renderers and the slash paper pass in `tools/glyphart/` (see glyph_v9.md).
Video-to-video that keeps camera motion: runwayml/aleph-2, $0.336/s (`gen/car_v9.py`); feed it a clean 3D clip plus image-edited
first/last stills, and audit every frame for invented people.

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
