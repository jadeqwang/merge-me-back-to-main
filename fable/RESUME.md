# Fable cut: resume here

**Start with `fable/HANDOFF.md`** (written 2026-11-11): current state, the decision waiting for Jade, how to work, the rules.
This file is the running log behind it; the block below was last updated at the end of that session and the older text is history.

## State (updated 2026-11-10 15:45, checkpoint 7): READ THIS BLOCK FIRST, the older text below is history

- Round 2 fix passes are done for all acts (notes: `fable/notes/r2_AB.md`, `r2_C.md`, `r2_DE.md`; task list was `fable/NOTES_v2.md`).
  Includes the Banach-Tarski Easter egg (`fable/show/seq/bt.js`: split at 28.62, fold at 87.08; quoted from Jade's "Rewind").
- v3 is rendered: `work_fable/out/v3.mp4` (1080p), sheets `work_fable/stills/v3/`, review copy `review/fable_v3/` (pushed).
  One command does render + sheets + 720p review encode: see "Cut script" below.
- The anime figure (face, expressions, gaze, clump hair) is ADOPTED and is the default (`fig=anime`); `--q "fig=classic"` renders the
  film as in v3. Notes `fable/notes/anime_lookdev.md` (section "ADOPTION PASS"); sheets `work_fable/stills/anime/E_likeness.jpg`,
  `F_in_film.jpg`. Jade has seen the first sheets and may still veto.
- Round 3 is done (notes `fable/notes/r3_AB.md`, `r3_C.md`, `r3_DE.md`; task list was `fable/NOTES_v3.md`).
- v4 is rendered with the anime figure: `work_fable/out/v4.mp4`, sheets `work_fable/stills/v4/`, review copy `review/fable_v4/` (pushed).
  Scene-change check against `fable/show/cuts.json`: no unplanned jumps (only flashes on hits at 80.13, 118.4, 153.2, 222.73).
- v7 is the current code-drawn cut (final fixes in: smooth sleeve + pencil grip in the writing close-up, symmetric salute, readable
  kick; notes `fable/notes/final_fixes.md`): `work_fable/out/v7.mp4`, sheets `work_fable/stills/v7/`, review copy `review/fable_v7/`.
- Running since ~22:10: the 4K master of v7, `work_fable/out/v7_uhd.mp4` (log `v7_uhd.log`, ~1 s per frame). When done: X encode by
  downscaling it to 1080p (deliver script pattern: 2-pass 12M, maxrate 16M, High@4.1, audio from `inputs/Merge.wav`, AAC 256k,
  faststart); the 4K file is the YouTube upload.
- VIDEO-MODEL TEST (Jade asked 2026-11-10 evening, approved $25, then went to bed: "check on the experiment in the morning"):
  feed the code render to Seedance 2.5 as `reference_videos` + her character sheet (`inputs/character_sheet.png`) to redraw the
  character as hand-drawn anime. Inputs: `review/fable_v7/seedance_test/in_{write,become,day}.mp4` (public raw GitHub URLs, needed by
  the model). Specs `media/gen/specs/fbl_*.json` (git-ignored); tool `tools/gen/gen.py` run with
  `/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python`; outputs land in `media/gen/fbl_*`. Price ~$0.97/s at 720p with
  a video reference. `fbl_write` was submitted first (job `mergemain/fbl_write-826fc24df3`); submit `fbl_become` and `fbl_day` only
  after seeing its real cost, total <= $25. After each run commit `docs/spend_ledger.jsonl`. Then make side-by-side strips
  (code | Seedance) for Jade and write a verdict: likeness to the sheet, motion lock on pinned beats, flicker, hands, text damage.
  Do NOT restyle the film beyond the test without her decision.
  TEST DONE (23:20), $23.39 at list price (4 clips x 6.04 s; the spend tool books each at $14.51, so `spend.py` shows $342.38
  where the refined figure is about $307.70). Verdict and files: `review/fable_v7/seedance_test/README.md` (pushed). Short version:
  when it redraws, the character is far better than the procedural figure and follows the code render pose for pose; framing holds
  if the prompt pins it; the night shot from behind was hardly changed; submit ONE job at a time. Flicker not judged (Jade must
  watch `compare_*.mp4`). NO further generation without Jade's decision: a full conversion is ~150 s of hero shots, ~$145-230.
- Hybrid composite prototype DONE (00:30, no spend): her redrawn layer cut out (BiRefNet), registered, upscaled and laid over the
  code-drawn world with her mirror image; lyrics/HUD/world pixels are the code's. Outputs `review/fable_v7/seedance_test/hybrid_*.mp4`
  (+ `_compare`), tool `fable/tools/hybrid/hybrid.py`, notes `fable/notes/hybrid.md`, plate switch `--q "hide=fig"` in cast.js.
  8-9 min per 6 s clip, unattended, no per-shot tuning. Calm lit single-figure shots look excellent (`hybrid_become` is usable as
  is). Problems, all from the model's frames: face and hands melt in fast motion (day 239.2-239.4, 240.8), the model stops following
  her step at 242.5-242.7, her face reads dark during the sunrise transition 230.2-230.6, the model cut one frame late, 24 fps layer
  in a 30 fps film. WAITING FOR JADE: adopt the hybrid for hero shots or not (see the README in that folder). Nothing else is
  running; the hourly checkpoint job was cancelled at 00:35 because nothing changes until she decides.
- Code-version deliverables exist: 4K master `work_fable/out/v7_uhd.mp4` (8.3 GB), X encode
  `work_fable/out/deliver/merge_fable_v7_x_1080p.mp4` (429 MB).
- Ask Jade whether to drop older review versions (v1-v6, 92 MB each) from the branch.
- Jade's standing asks: checkpoint periodically (an hourly cron in the session does commit + push); mechanical work (renders, encodes,
  scouting) goes to cheaper models or Codex in tmux to save the top model's limit.

Cut script (render 1080p, sheets every 2 s, two-pass 720p review encode at 2450k + AAC 160k):
`node fable/tools/gitlog.mjs; node fable/tools/render.mjs --show /fable/show/main.js --from 0 --to 282.5 --res 1920x1080 --fps 30 --mb 4 --workers 4 --audio --mp4 work_fable/out/vN.mp4`
then ffmpeg `fps=1/2,scale=480:270,tile=7x7` per 98 s for sheets, and `-vf scale=1280:720 -c:v libx264 -preset slow -b:v 2450k` two-pass.

## State at checkpoint 5 (history)

Done
- Recon: both earlier cuts reviewed (v5a on `claude/wonderful-mccarthy-f90kll`, v6 "written in text" on `claude/v6-text`), shipped work in `~/Documents/1-music-shipped` surveyed.
- `fable/SPEC.md`: concept, rules, look, bar-by-bar timeline, figure spec, track + drawable contracts.
- Mocap: CMU (free for all uses) + ACCAD (CC BY 3.0) downloaded to `work_fable/mocap/` (git-ignored), catalogue in `work_fable/mocap/CATALOG.md`, tools in `fable/tools/mocap/`.

Built since checkpoint 1
- F1 engine + world done (`fable/notes/F1_engine.md`): harness `fable/tools/render.mjs`, sky/mirror/roads/lights/type/HUD, look-dev stills in `work_fable/stills/f1/` (look approved). ~10 min for a full-film render.
- F2 motion library done (`fable/notes/F2_motion.md`): retarget + edit ops + IK; phase-1 tracks baked and validated. (Its agent died at a login error; work recovered and committed.)
- F3 figure v1 (`fable/notes/F3_figure.md`): API, tracks, sim, LOD work; LOOK rejected by the director (mannequin/doll). Redesign brief sent: skinned mesh for opaque modes, cloth-lite trousers, hair mass, light mode woven of fibres like the roads.

Built since checkpoint 2
- Figure (F3, `fable/notes/F3_figure.md`): skinned mesh, cloth-lite trousers, hair mass, ONE lit-cel shading model (night rim + lane underlight + emissive accents; sunrise silhouette; day full colour). Runs in the real engine as a plain drawable; test show `fable/show/figtest.js`, stills `work_fable/stills/figtest/sheet_a.jpg`, `sheet_b.jpg` (approved direction).
- M1 utility performances (22 tracks; `fable/notes/M1_util.md`) and M2 build + drop choreography (5 tracks; `fable/notes/M2_choreo.md`) baked and validated; judged on stick figures only so far.

Animatic (stand-ins): the whole film is blocked out, 16 sequences in `fable/show/seq/`, sheets in `work_fable/stills/animatic_v0/s1-3.jpg`.
Director's notes on it (to apply per act AFTER v1 with the real figure exists):
- Figures are too small in verse 1, chorus 1, verse 2 and the day outro (rule: subject >= 1/3 of frame height). Bring the camera in.
- Verse 1 / pre-chorus (0:34-1:00): the white horizon band and long light streaks overpower the frame; distant branches should be bokeh dots, horizon subtle.
- Breakdown hair-roads top-down (1:38-1:58) is the right image but static for 20 s: it needs evolution (slow rotation / pull-out, pulses coming home).
- Build (2:14-2:26): top-down for too long with tiny figures; needs the frontal symmetric shot with the hero large in front.
- Day outro (4:02-4:16): near-empty white frames; needs the hero large, dancing (`free`), then the forks.
- Whole-film map (4:18) is right; labels too small. Terminal card text too small (rule: >= 24 px); fewer, larger lines.
- Keep: the tree + MERGE title, MAIN spelled by the fallen bodies, the catch against the sun, the map, the terminal ending.

Usage note: the Claude 5-hour limit was hit once (about 1.5 h of 5-6 parallel image-heavy agents). From here: 2-3 agents at a time, fresh
general-purpose agents with tight briefs that read the notes on disk (cheaper than forks of the main session), fewer image reads.

v1 exists: `work_fable/out/v1.mp4` (first full cut with the real figure; `fable/notes/I1_integration.md`), sheets `work_fable/stills/v1/`.
Performance QA done (`fable/notes/P1_qa.md`). Director's notes on v1, act by act: `fable/NOTES_v1.md` (the task list for the act passes).

In progress (fresh agents, one per act; each keeps `fable/notes/act<X>.md` and commits its own paths)
- Act C (seq 08-10, build + drop), Act A (seq 01-04 + the Global fixes + life props), Act D (seq 11-13, violet/flight/catch).
- Not started yet: Act B (seq 05-07: chorus 1, float, rise), Act E (seq 14-16: day, map, terminal). Launch when a slot frees up, with the same brief shape (see NOTES_v1).

Then: render v2 (1080p), director reviews in motion-dense sheets, second round of notes; encodes for X + YouTube; review page for Jade.

Next, in order
1. Review F1/F3 stills against SPEC section 2; iterate until the look is right. Integrate the figure into the engine.
2. F2 phase 2: utility performances (idle, walk, run, lookback, fork step, float, rise, write-in-air, release, sit, catch, salute, lives mimes).
3. Choreography for build + drop (bars 73-104), pinned to beats. Plan:
   - Build b73-76 basics on the beat, formation doubles each bar (1..16); b77-80 kicks in canon, to 256; b81-84 top-down 1,024, grid to rings; b86-88 slow gather into a low stance.
   - Drop b89 butterfly kick apex on the downbeat against the breaking sun; b90-92 the unison phrase from Jade's real 2004 group set (bow-stance punch, drop to pubu, up, arms whip overhead); b93-96 travelling phrases and staggered kicks, warm lanes vs cool lanes; **b97 the group fall**: all 1,024 fall flat together and lie still (top-down: the bodies spell MAIN), rise as one on b98-99, arms-wide hold b100; b101-104 last unison phrase, tornado kick, final pose, bao quan salute on the "ooh".
4. Shared show kit (`fable/show/world.js` the graph-continent, cast, lyric placement), then one reference sequence polished end to end, then the other sequences in parallel (one fork per act).
5. Full render, watch, contact sheets, fix, repeat. Encodes for X and YouTube. Review page for Jade.

Decisions made (and why)
- No generated video, no faces in close-up, no lip-sync: the earlier cuts lost the most to face drift and uncanny takes.
- Lighting carries the fidelity arc: night = branches seen only as light; sunrise = silhouettes; day = full cel colour.
- Martial arts from mocap, retimed to the beat grid; nobody films anything.
- Ideas kept from the Opus cuts: lane colours, branch chyrons, her real lives as branches, the violet 1420 MHz branch that never merges, the doubling counter, the group fall from her real set.

Rules that carry over from the repo: public repo, so code/docs only; never commit media, inputs, tracks or secrets; never deploy or touch Workers/KV; paid generation is capped and logged (none used so far in this cut).
