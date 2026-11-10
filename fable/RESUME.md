# Fable cut: resume here

Branch `fable/merge`. A third, independent cut of "Merge", made end to end by Claude Fable 5.2, every pixel code-drawn, no filming.
If you are a new session picking this up: read `fable/SPEC.md` (the direction, look, timeline, contracts), then this file, then the
workstream notes in `fable/notes/`.

## State (updated 2026-11-10, checkpoint 5)

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
