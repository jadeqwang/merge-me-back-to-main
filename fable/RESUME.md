# Fable cut: resume here

Branch `fable/merge`. A third, independent cut of "Merge", made end to end by Claude Fable 5.2, every pixel code-drawn, no filming.
If you are a new session picking this up: read `fable/SPEC.md` (the direction, look, timeline, contracts), then this file, then the
workstream notes in `fable/notes/`.

## State (updated 2026-11-10, checkpoint 2)

Done
- Recon: both earlier cuts reviewed (v5a on `claude/wonderful-mccarthy-f90kll`, v6 "written in text" on `claude/v6-text`), shipped work in `~/Documents/1-music-shipped` surveyed.
- `fable/SPEC.md`: concept, rules, look, bar-by-bar timeline, figure spec, track + drawable contracts.
- Mocap: CMU (free for all uses) + ACCAD (CC BY 3.0) downloaded to `work_fable/mocap/` (git-ignored), catalogue in `work_fable/mocap/CATALOG.md`, tools in `fable/tools/mocap/`.

Built since checkpoint 1
- F1 engine + world done (`fable/notes/F1_engine.md`): harness `fable/tools/render.mjs`, sky/mirror/roads/lights/type/HUD, look-dev stills in `work_fable/stills/f1/` (look approved). ~10 min for a full-film render.
- F2 motion library done (`fable/notes/F2_motion.md`): retarget + edit ops + IK; phase-1 tracks baked and validated. (Its agent died at a login error; work recovered and committed.)
- F3 figure v1 (`fable/notes/F3_figure.md`): API, tracks, sim, LOD work; LOOK rejected by the director (mannequin/doll). Redesign brief sent: skinned mesh for opaque modes, cloth-lite trousers, hair mass, light mode woven of fibres like the roads.

In progress (four agents; each keeps a note in `fable/notes/` and commits its own paths)
- F1 phase 2: show kit (`fable/show/world.js`, `cast.js`, `main.js`, `seq/*`) + full-length animatic with stand-in figures -> `work_fable/out/animatic_v1.mp4`.
- F3 phase 2: the figure redesign (above).
- M1: utility performances, `fable/CHOREO.md` section A -> `fable/tools/bake/recipes_util.py`, note `M1_util.md`.
- M2: build + drop choreography, `fable/CHOREO.md` section B -> `recipes_choreo.py`, note `M2_choreo.md`.

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
