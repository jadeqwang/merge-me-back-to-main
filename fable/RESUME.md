# Fable cut: resume here

Branch `fable/merge`. A third, independent cut of "Merge", made end to end by Claude Fable 5.2, every pixel code-drawn, no filming.
If you are a new session picking this up: read `fable/SPEC.md` (the direction, look, timeline, contracts), then this file, then the
workstream notes in `fable/notes/`.

## State (updated 2026-11-10 15:45, checkpoint 7): READ THIS BLOCK FIRST, the older text below is history

- Round 2 fix passes are done for all acts (notes: `fable/notes/r2_AB.md`, `r2_C.md`, `r2_DE.md`; task list was `fable/NOTES_v2.md`).
  Includes the Banach-Tarski Easter egg (`fable/show/seq/bt.js`: split at 28.62, fold at 87.08; quoted from Jade's "Rewind").
- v3 is rendered: `work_fable/out/v3.mp4` (1080p), sheets `work_fable/stills/v3/`, review copy `review/fable_v3/` (pushed).
  One command does render + sheets + 720p review encode: see "Cut script" below.
- Anime look-dev is done (sheets `work_fable/stills/anime/A_turnaround_faces.jpg`, `B_lighting_arc.jpg`; notes
  `fable/notes/anime_lookdev.md`). Director's decision (15:50): ADOPT for the whole film behind a switch (`fig=anime` default,
  `fig=classic` = the film as in v3). Jade has been shown the sheets and may veto.
- Running (one agent): anime integration: likeness pass against her selfie/character sheet, hair fixes (no cape flare; strand hair
  kept for the float), the switch in `fable/show/cast.js`, default expressions/gaze/blink (night calm in shadow, first lit open-eyed
  look at the catch 229.6-236, day joyful), check sheet `work_fable/stills/anime/F_in_film.jpg`. It keeps `fable/notes/anime_lookdev.md`.
- Next: (1) judge sheets E/F; (2) round 3, one fresh agent per act group, doing the "still weak" lists in `fable/notes/r2_*.md` plus
  2:44-2:46 (cropped letters, dash bodies before the fall), 4:16 (specks before the map), 3:56.6 handover, and per-shot expression/gaze
  choices; (3) v4 (anime), review copy to `review/fable_v4/`; then master (consider 4K), encodes for X (2-pass x264 ~12M, maxrate 16M,
  High@4.1, AAC 256k, faststart) and YouTube.
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
