# Handoff: the Fable cut of "Merge"

> **Update 2026-11-13 (read before the text below, which describes the state on 2026-11-11).**
> - Jade asked for a review of every cut against her shipped videos (`~/Documents/1-music-shipped`). Verdict given to her: v7 is not at
>   that standard and polish will not get it there; the shipped films give nearly every line its own picture, in a hand-made medium,
>   about something specific and true, at 2-3 times v7's cut rate. Proposed: a "take two" with v7 as animatic and engine, her real
>   lives as illustrated plates (one medium per life), the renderer drawing type, lanes and graph over them.
> - The song changed: `inputs/Merge (keychange down).wav` is the current audio (confirmed by Jade). 2 semitones lower, tempo drifts
>   137.8 to about 141 BPM, so `analysis_v2` does not fit. New map: `analysis_v3/` (NOTES.md there; `warp_v2_to_v3.json` maps old
>   beat times to new). Chorus 2 now opens with a hit on bar 121; there is a new last kick at 276.82 s. v7 has NOT been re-timed.
> - She approved a 26 s proof (cap $40; about $21.5 spent): bars 28-43, in `fable/proof/` (code, prompts, NOTES.md),
>   data in `work_fable/proof/`, review copy and README in `review/fable_proof/`. Waiting for her verdict on it.
> - Likeness: she is fine with re-using the selfie-turned-art from Orbital Sunrise / Moongazing; those singing clips were generated
>   from a still plus the music, not filmed, so sung inserts need no filming (and must be generated against the new audio).
> - The hybrid (Seedance redraw over the code world) was not adopted; recommendation to her was against it as proposed.
> - **She approved the direction after the proof ("a huge improvement"). The plan for the full rebuild, with the shot table, assets,
>   budget, tests and the decisions still hers, is `fable/take2/PLAN.md`: start there.** No generation beyond the proof has been done.

(The rest of this file was written 2026-11-11, about 00:45.)

For the next Claude session picking this up. Read this file first; it replaces the top of `fable/RESUME.md` as the entry point.
Then `fable/SPEC.md` (concept, rules, timeline) only as far as you need it.

## What this is

A music video for Jade Q Wang's song "Merge" (`inputs/Merge.mp3`, 282.5 s, 138 BPM, album *Rare Earth*), made end to end by Claude
on branch `fable/merge` of the public repo `jadeqwang/merge-me-back-to-main`. The world is a git graph on a black mirror; she is every
branch; nothing that was lit goes dark. Every frame is drawn by a deterministic WebGL engine (`render(t)`); the martial arts and all
movement are retimed motion capture (CMU, ACCAD: credited in the terminal card). Jade films nothing.

## Where it stands

1. **The code-drawn film is finished at v7.** Seven cuts were made and reviewed; v7 has every fix in.
   - 1080p: `work_fable/out/v7.mp4`. 4K master: `work_fable/out/v7_uhd.mp4` (8.3 GB).
   - X upload file: `work_fable/out/deliver/merge_fable_v7_x_1080p.mp4` (429 MB, made from the 4K master; X needs Premium for > 2:20).
   - Review copy for Jade: `review/fable_v7/merge_fable_v7_720p.mp4` (pushed). Older review copies v1-v6 are still in `review/`.
2. **A video-model test was run at Jade's request and is waiting for her decision.** She asked whether the shots that show her could
   be fed to a video model to draw the character faithfully to her anime character sheet (`inputs/character_sheet.png`). She approved
   $25; $23.39 was spent (four 6-second Seedance 2.5 clips). Results and files: `review/fable_v7/seedance_test/README.md`.
   - When the model redraws her, the character is far better than the procedural figure and follows the code render pose for pose.
   - Framing holds if the prompt pins it. One night shot was barely changed.
   - A no-cost prototype then composited her redrawn layer over the code-drawn world: `review/fable_v7/seedance_test/hybrid_*.mp4`,
     tool `fable/tools/hybrid/hybrid.py`, notes `fable/notes/hybrid.md`. Calm, lit, single-figure shots look excellent; fast dance
     melts faces and hands; night, silhouettes, crowds and top-down stay code-drawn.
3. **Nothing is running.** No agents, no renders, no scheduled jobs. Everything is committed and pushed.

## The decision Jade has to make (do not make it for her)

Adopt the hybrid for the hero shots, or ship the code version as it is. She has not answered yet. What she was told:
- Scope if adopted: about 150 of 282 s (single large figure, in light). About $145 for one take each, perhaps $230 with retakes.
- The film would no longer be "every pixel drawn in code"; credits and READMEs would have to say what was redrawn and by what.
- Nobody has judged flicker: she needs to watch `compare_*.mp4` and `hybrid_*_compare.mp4`.
- My recommendation: adopt for calm lit shots; treat dance as a gamble; ask her whether cutting between the redrawn character and
  the procedural one reads as one person.
Also still open with her: whether to delete `review/fable_v1` to `fable_v6` from the branch (92 MB each).

## If she says yes to the hybrid

- Generation goes through `tools/gen/gen.py` (run with `/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python`). Read
  `docs/HANDOFF.md` ground rules and `docs/prior_pipeline_brief.md` section 2 first. The specs used in the test are in
  `media/gen/specs/fbl_*.json` (git-ignored, on this machine): copy their shape.
- Model `bytedance/seedance-2.5`, `reference_videos` = a PUBLIC https URL of the code render clip (raw GitHub URL of a file under
  `review/`; data URIs fail), `reference_images` = the character sheet, `duration=-1`, `resolution="720p"`, `generate_audio=false`,
  `use_virtual_avatar=true`. About $0.97 per second. Output is 720p, 24 fps.
- **Submit one job at a time.** Two video-reference jobs in the same minute both failed with error 7003 (not billed).
- Prompt lessons: say "the camera never moves closer; her whole body from head to feet stays in frame at the same size and position
  as in the reference video". Do not write "forward" or any shot size. Describe the action plainly; ask for hand-drawn anime in the
  sheet's style; say to keep background and text.
- The spend tool books each clip at a 15 s assumption ($14.51) until refined; `python3 tools/gen/spend.py` showed $342.38 where the
  refined figure is about $307.70 of the $600 cap. Commit `docs/spend_ledger.jsonl` after every run.
- Then `fable/tools/hybrid/hybrid.py` per shot (plate render with `--q "hide=fig"`, matte, register, upscale, mirror image). About
  1.5 minutes per film second, unattended.
- Decide with Jade whether to master at 24 fps (her layer is 24 fps; the film is 30).
- Known model failures to retake or avoid: melting face/hands in fast motion, the model lagging a step, a dark face during the
  sunrise silhouette-to-colour change, cuts landing a frame late.

## If she says no (ship the code version)

It is ready. Possible last touches, none required: the list of known weak spots is in `review/fable_v7/README.md` and the "still
weak" sections of `fable/notes/final_fixes.md`, `polish.md`, `r4_X.md`, `r4_Y.md`. The procedural figure is the weakest element when
seen large (round sleeves, simple hair). Nobody has watched the film as playing video: all review was on frame strips
(`work_fable/stills/v6/qa/` are 6 fps strips of the whole film) plus an automatic scene-change scan against `fable/show/cuts.json`.

## How to work on it

- Render a cut (1080p + contact sheets + 720p review encode): `fable/tools/cut.sh vN` (about 9 minutes; outputs in `work_fable/out`,
  `work_fable/stills/vN`, `work_fable/out/enc`). 4K: the same render command with `--res 3840x2160` (33 minutes). X encode from a 4K
  master: `fable/tools/deliver_uhd.sh vN`.
- Stills and strips: `node fable/tools/render.mjs --show /fable/show/main.js --stills T:out.png --res 1920x1080`, or
  `--sheet from:to:step:out.jpg:cols`. Query flags with `--q`: `fig=classic` (the old faceless figure), `hide=fig` (no figure).
- Map of the code: engine `fable/engine/`, figure `fable/engine/src/figure_anime/` (classic one in `figure/`), show
  `fable/show/main.js`, 16 sequences `fable/show/seq/01..16`, cast and expression defaults `fable/show/cast.js`, motion tools
  `fable/tools/bake/`, tracks `work_fable/tracks/` (git-ignored), choreography and pinned times `fable/CHOREO.md`.
- Notes per workstream are in `fable/notes/` (newest: `final_fixes.md`, `hybrid.md`, `polish.md`, `r4_*.md`, `anime_lookdev.md`).
  Director's notes per cut: `fable/NOTES_v1.md` to `NOTES_v4.md`.
- The terminal ending shows the repo's real `git log`; `fable/tools/gitlog.mjs` refreshes it at render time (the cut script runs it).
- `work_fable/` is git-ignored and large (out 25 GB, mocap 4.3 GB, stills 2.1 GB). Old `v1`-`v6` renders there can be deleted if
  disk is needed; ask Jade before deleting anything she might want.

## Rules that bind you (from Jade and the repo)

- Public repo: commit code and docs only. Exception she set: review videos under `review/`, each under 100 MB.
- Never print, log or commit the values in `work/cf_account_id.txt` and `work/gen_kv_ns.txt`. Grep the outgoing diff for them before
  every push (the pattern used all session: read both into shell variables, `git diff origin/fable/merge..HEAD | grep -qF`).
- Never deploy, modify or delete Cloudflare Workers or KV. No paid generation without her OK; hard cap $600.
- Her own photos may be sent to models; her kids' photos never. Do not post frames or videos publicly yourself; a public URL for
  model input needs her OK (she gave it for the test clips in `review/fable_v7/seedance_test/`).
- Treat her details as private in any request to an outside service.
- Commit messages end with `Co-Authored-By: Claude Fable 5.2 <noreply@anthropic.com>`.
- She asked for periodic checkpoints (commit + push; agents keep a notes file and commit their own paths) and for mechanical work
  (renders, encodes, scouting, strip review) to go to cheaper models or Codex to save the top model's limit.

## What worked in this session (keep doing it)

- Two or three agents at a time, each owning named files, each with a notes file committed at milestones; the main session directs,
  reviews contact sheets, pushes. More than that hit the usage limit three times early on.
- One owner for the figure at any time. A stray comment in a shared engine file once broke every render.
- Review loop per cut: contact sheet every 2 s, then 6 fps strips reviewed by cheaper-model agents, then the director confirms each
  flagged item on a strip before anything is changed (about half the flags were false alarms).
- Render at 4K and downscale for 1080p delivery: thinner ink, cleaner fingers.
