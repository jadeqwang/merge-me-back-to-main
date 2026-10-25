# RESUME — Merge Me Back to Main video (checkpoint log; newest at bottom)

> Next instance: start with docs/HANDOFF.md (ground rules, map, commands, gotchas, open decisions).

## Layout
- inputs/ — song (wav/mp3), lyrics md, poster, character sheet, refs (read-only)
- docs/concept.md — director's concept ("fidelity is how merged you are"; TOKEN DAWN style)
- docs/prior_pipeline_brief.md — distilled tooling/lessons from vibesong, rewind-take-two etc. (subagent)
- analysis/ — timing.json, energy.json, stems (subagent)
- tools/prep/prep.py — plate → rgb/depth(DepthAnythingV2-L)/matte(BiRefNet) frames  (.venv = project uv venv, torch cu124)
- engine/ — three@0.170 + puppeteer-core; proto/token2.html = renderer prototype (glyph mode 0 / oriented splat mode 1,
  weighted accumulation + normalize resolve); shot.mjs screenshots via headless Chrome (ANGLE Vulkan on RTX 3090)
- static server: `python3 -m http.server 8790 --bind 127.0.0.1` from project root
- engine/fonts — Instrument Serif, JetBrains Mono, Archivo (wdth,wght), Unbounded, Space Grotesk, Bricolage

## 2026-10-23 ~23:30 checkpoint 1
- Recon done; concept v1 written. Renderer premise validated on a still (glyph mode reads well; splat mode near-photoreal).
- Decision: canon look = inputs/character_sheet.png (no glasses), lane-colored stripe variants for branches.
- Next: port gen tooling (await brief), style keyframes (image models), first Seedance lip-sync vertical slice.

## 2026-10-24 ~00:30 checkpoint 2
- Gen tooling ported: tools/gen (PREFIX mergemain/, cap MERGEMAIN_CAP default $600). PY=moongazing venv; export FFMPEG=<moongazing imageio ffmpeg>.
- Style: docs/style_bible.md. Character pack v1 = media/style/r1/sheet_nbp.jpg + r2/face_v2.jpg + r2/bun_v2.png. Look = "dawn"
  (tokens world + LED figure + dim underpaint) in engine/src/scenes/lattice.js LOOKS.
- Engine: engine/render.mjs (stills / sheet / mp4 + audio, workers), engine/web/index.html → src/main.js (EDL from ?show=),
  src/lattice.js, src/post.js (resolve+type composite+bloom+grade), src/type.js (hook/sub/mono), src/plateseq.js.
  Vertical slice EDL: engine/show/slice.js.
- Plate: media/plates/ch1_main_a.jpg; Seedance jobs mergemain/ch1_main_a_{t1,t2,720} (S0=68.3, vocals 7 s) submitted.
- Lip tools: tools/sync/{lipsync,pb_wordstrip}.py, run with OSPY=/home/jade/Documents/1-music-shipped/orbital-sunrise-video/video/out/.venv/bin/python

## 2026-10-24 ~01:30 checkpoint 3
- Jade notes (night 1): larger VERY dark brown eyes w/ double-eyelid crease, taller upper head (not hairline), sheet_gpt costume wrong
  → pack v2 (docs/style_bible.md "Character pack v2"); memory file jade-3d-likeness-eyes.
- Plates: docs/plates.json → tools/plates/gen_plates.py → media/plates/*. Seedance shots: tools/sd/batch.py (SHOTS dict; --takes, --t0).
  Batch 1 (25 shots + 10 second takes) + out_dance/out_main submitted. Waiters: background gen.py wait; intake: tools/sd/intake.py --loop
  (prep → work/plates/<take>, strips/sync → work/takes). Picks: tools/sd/picks.py → work/picks.json (manual overrides docs/picks_manual.json).
- Engine scenes: forktree (intro + reverse "every road" + breakdown converge), lattice (fid density via Bayer, fork copies, paint world),
  panels (pre-chorus grid fold, breakdown memories, build sessions), card. EDL v1 = engine/show/main.js (whole song).
- Review renders: node engine/render.mjs --q "show=/engine/show/main.js" --sheet out/test/x.jpg --from A --to B --every 1 --res 960x540
- Spend ≈ $90 of $600.

## 2026-10-24 ~03:30 checkpoint 4
- All batch-1 takes collected (38 mp4, ~$90). Picks: auto best-corr; manual docs/picks_manual.json; lags docs/lags.json (chosen from
  labial scorer tools/sync/labial.py + word strips + envelope; these are MY picks — flag for Jade's ear).
- LED lyric type (engine/src/ledtext.js) for hooks with scrim; look rebalance (fig gain 1.95; world tokens sparser; grade shoulder).
- Pre-chorus ends on the origin (single Jade top-down) instead of black. Verse L1 split shot cropped tight.
- Next: full 540p draft (node engine/render.mjs --q "show=/engine/show/main.js" --from 0 --to 284.8 --res 960x540 --mp4 out/review/draft_v1.mp4 --audio --workers 3),
  frame-by-frame review, round-2 Seedance for weak shots, sound design, 1080p master.

## 2026-10-24 ~05:30 checkpoint 5
- v2 fixes: whiteout floorK, panels autoClear, drop recut in 2-bar K-pop cuts (+"ALL BRANCHES MERGED"), outro git-log legible,
  bookend (one Jade from above, camera rising), end card, post-credits Hilbert Hotel (pc_hotel_t1, bell at 286.95 in tools/mix.py).
- Round 2 takes: v1_split_front_t1 (lag .25, ghost-branch split), ch2_fold_t1 (violet bun branch in the line).
- Master: out/final/master_v1.mp4 (1080p, mix out/mix_v1.wav, 297 s). Teaser: tools/teaser.py (bar 17 → bar 32 splice).
- Jade review notes: docs/REVIEW_FOR_JADE.md. Spend ≈ $82.

## 2026-10-24 ~06:00 checkpoint 6 — DELIVERED v1
- out/final/master_v1.mp4 (1080p30 CRF17, 4.1 GB, 4:57), out/final/merge_me_back_to_main_1080p.mp4 (2-pass 12 Mb/s, 455 MB, X-ready),
  out/final/teaser_x.mp4 (1:15). QA sheet out/review/qa/qa_sheet.jpg. Awaiting Jade's notes (docs/REVIEW_FOR_JADE.md).

## 2026-10-24 ~11:30 checkpoint 7 — v2 round (Jade's notes: real lives, ASCII/drone refs, arm patch, title "Merge")
- Title → MERGE (engine/show/main.js TITLE/SUBTITLE; hook "merge me back to main" kept as subtitle); end card "Jade Q Wang · Rare Earth".
- Branches = her lives: LIFE table at top of engine/show/main.js (piano, violin, wet-lab, phd booth, poet, NASA Ames wind tunnel,
  Robot Ninja Apocalypse, Chez JJ, open-source stage demo, home w/ kids from behind). Plates lf_* (docs/plates.json), Seedance specs in
  tools/sd/batch.py; montage cuts 2-1-2-1…, pre-chorus 3×3 grid, breakdown panels, build panes, git log, outro credits all from LIFE.
- Look: default world = 'ascii' (engine/src/scenes/lattice.js LOOKS; brightness-ramp glyphs RAMP in engine/src/lattice.js, lyrics in highlights,
  chroma-normalised); `written: true` shots draw her as ASCII (figText) crossfading to LED with fid. fid values quantised to 1 / .25 (no checkerboard).
- New scene engine/src/scenes/dronetree.js (subagent; API in its header / test EDL engine/show/test_dronetree.js): breakdown reveal 119.1–125.9
  (grow → merge pulses → converge to a point on the hit) and chorus 2 "every road" 214.6–222.7.
- Arm patch: audit docs/patch_audit.json; gen_plates.py COST/tail fixed (patch is the one sanctioned lettering; turn_gpt_patch.png ref);
  tools/plates/fix_patch.py edits failing stills → media/plates/fix/ (batch.py prefers them). Re-run Seedance for those shots next.
- Old engine copies in work/*.v1.* (lattice, scene_lattice, batch, plates.json, main.v1b.js).

## 2026-10-24 ~12:05 checkpoint 8 — DELIVERED v2
- out/final/master_v2.mp4 (1080p30 CRF17, 4:57), out/final/merge_v2_1080p.mp4 (2-pass 12 Mb/s, 455 MB), out/final/merge_v2_teaser_x.mp4 (1:22;
  tools/teaser.py now splices bar 17 → bar 28 = the life montage). Audio out/mix_v2.wav (bell 286.85 for pc_hotel_t5). QA out/review/qa2/.
- Added after ckpt 7: jade/wushu (bronze, collegiate group set) in LIFE; drop bar 95 = dr_wushu_t2 (seven Jades, sword group set + leap at sunrise).
- Re-picks (patch-repaired): docs/picks_manual.json; new lags ch1_gone_close_t6 +.125, ch2_gone_close_t5 +.208. Kept v1 takes: v1_split_front, v2_release, bd_float.
- Full render is ~13 min at 3 workers (4.2 fps each). Spend: TOTAL $146.03 of $600 cap  (174 billed items; list-price estimates)

## 2026-10-24 ~17:00 checkpoint 9 — likeness round, revised song, new intro (in progress)
- Jade OK'd her OWN real photos as model input (never the kids'); kids OK only as backs of heads. Photo sets: ~/Documents/character sheets/
  (selfies/ = 19 shots; skip (9) another person, (17) a drawing). Memory: photo-input-rule, jade-3d-likeness-eyes (natural crease wording, protagonist eye shape).
- Likeness tools (tools/plates/): likeness.py (selfie face pass), eyelids.py (feature pass; prompt = her crease description), hairswap.py
  (hair from another image, face kept exact incl. jaw, strands preserved), facecheck.py (eye placement vs midline), eyemetrics.py
  (iris-normalised lid band / open / tilt / peak / wing; --check profile; NOTE: size+wing metrics don't track her preference),
  facecrop.py (face/eye crops), likeness_page.py → out/review/likeness.html (her review page; newest at top).
- Current faces = media/plates/face/*.{jpg,png} (batch.py prefers face/ > fix/ > original). Approved: 1:30 ch1_gone_close = cand10/gc_a,
  1:10 ch1_main = cand8/ch1_main_a, 0:42 v1_light_hands = try7. 3:28 ch2_catch = cand12/catch_d1 (interim); candidate GPT refinement
  media/plates/face/gpt/catch_b_169.jpg awaiting Jade. Model bake-off: GPT Image 2.5 (openai/gpt-image-2.5-sunburst, up to 16 refs, 3:2 only —
  pad/crop) reads most like her; Seedream 5 Pro 2nd (needs watermark:false; adds liner unless told); Nano Banana drifts feline; FLUX adds liner.
- Revised song "Merge" (inputs/Merge.wav, 138.00 BPM const, 282.5 s): analysis_v2/ (same schema; NOTES.md has section/line tables + time map).
  time.js line(i) is positional — v2 drops lines 14,15,26 → switch to id lookup. main.js literal times must be re-derived. NOT yet ported.
- Glyph look ascii2 (multi-scale, structure-following glyphs) is default; old via &look=ascii. Figure LED grid still reads cross-hatched — proposal pending.
- Intro: 5-year-old Jade at the frosted window (ch0_window_t2) blows on her palm (ch0_blow_t2) → strands → drone swarm → drone tree forks on
  bars 3–12 (dronetree.js growKey/segGap/wave API). Agent wiring takes + title fix (in progress).
- Spaces Left Blank notes: docs/spaces_left_blank_notes.md (themes, motifs, ideas, don'ts). Jade approved idea 1 (blown hairs) = the intro.
- Pending Jade: GPT 3:28 b; figure grid; click check of analysis_v2; wushu duilian (Seedance prompt vocabulary; no need for her videos);
  hair variants per life (wushu ponytail/space buns, tech/house teal tips or short purple, bio braids, default down) after faces lock.

## 2026-10-24 checkpoint 10 — show ported to the revised song "Merge" (timing v2)
- engine/src/time.js: timing source = ?timing=v1|v2 (DEFAULT_TIMING = 'v2'); line(id)/words(id) look up by lyric `id` (v2 has no 14, 15, 26); lineAt(i) positional;
  bb(n, beats), beatLen(n), songEnd(), loadTimingVersion(v).
- engine/show/main.js = v2 EDL, every time as B(n)/bb(n, beats) or word times ws(id,k)/we(id,k). Lip-synced v1 takes re-synced at load (resync():
  median word offset v1 -> v2 per take; logged as `[show] ... resync {...}`); picks entries may carry "timing": "v2" for new takes (then no shift).
  ?timing=v1 renders the frozen v1 EDL engine/show/main_v1.js (EDL verified identical to the pre-port show). Pre-port backups: work/*.pre_v2port.*.
- render.mjs: default soundtrack follows timing (Merge.wav unless --q has timing=v1). Film end v2 = 282.516 + 12.2 = 294.716.
- tools/mix.py --timing=v2 (default) -> out/mix_v3.wav (bell 284.566); --timing=v1 --total=297 reproduces out/mix_v2.wav byte-for-byte.
- tools/teaser.py --timing=v2 (default): bar 17 -> bar 28 splice, end 101.12 (after "undone" + 1.2 s fade).
- Review: out/review/v3_port_540.mp4; checks out/test/v2port/ (sheet.jpg, stills/, stills_grid*.jpg).

## 2026-10-24 checkpoint 11 — v4: Jade's 12 decisions implemented (see docs/CLOUD_HANDOFF.md for the full state)
- Canon face v4 everywhere + head turns; 10 singing shots re-animated on v2 (picks_manual.json / lags.json); wushu drop (set, duilian, jian);
  fold gestures (?fold=palms|reach); home shot on line 25; orchestra outro; window post-credits with FX.frost (hotel cut); glyph-built figures
  (?figlook=led); earlier films (?pv=flash|screens). Review: out/final/watch.html (v4 full film + comparison clips in out/review/v4/).
- Tools: lipsync.py lag window from -1 s + small-face crop; intake/picks/batch timing-aware (notes.timing); tools/sd/shots_*.py hook.
- Lesson: run ONE tools/sd/intake.py at a time (three parallel runs prepped the same take into one folder).

## 2026-10-25 checkpoint 12: v5 integration (cloud session; nothing generated, rendered or spent)
- Jade's v4 notes and her 2026-10-25 decisions, applied on `claude/wonderful-mccarthy-f90kll`. Note by note: REVIEW_FOR_JADE.md, "Jade's
  notes, 2026-10-25"; commands, queue and checks: **docs/V5_BOX_RUNSHEET.md**.
- EDL (engine/show/main.js):
  - intro_up plays in every forktree use (the 1:07 freeze).
  - 3:30 and 4:12 interim trims, keyed on the old takes being picked (`isTake`).
  - The 4:15 living graph replaces the git-log card and the bookend (starts at `OUT_MAIN_END`).
  - Post-credits: the violet branch sends the light, the girl sees it, once (reuses v2_horizon_t5 + ch0_window_t2; PC_TOUCH 6.4).
  - Orchestra v5: the violet composer, FX.score, stand-ins until picked (`?orch=v4`).
  - Drop v5 wiring, default only once all six takes are picked (`?drop=v4|v5`).
  - `has(shot)` ignores picks.py's still_ placeholders.
- Engine:
  - Pane figures are glyph-built (panels.js; `?figlook=led`).
  - `clip` time remap in the lattice scene, `clip(u,t)`, and in panes, `clip(t)`.
- Tools:
  - batch.py: EYES guard (no more "large ... eyes"), RETAKES, `face=`.
  - shots_v5.py: re-takes + STILLS.
  - shots_outro.py: orch_* + STILLS.
  - stills.py: prompt files + commands.
  - fix_patch.py: `--prompt=`.
  - mix.py: no lone post-credits chime, ffmpeg fallback.
- Checks (cloud):
  - An EDL harness ran the real timing + picks over 0–297 s with a mock canvas, for the default and `?orch=v4`, `?drop=v4/v5`,
    `?fold=palms`, `?pv=off|flash`, `?figlook=led`. Picks variants: the box's picks.json, it with the new lags, it with still_
    placeholders, and all new takes faked as picked. Result: 0 exceptions, 0 non-finite draw args, no gaps.
  - `batch.py --dry` on all 20 v5 shots × 2 takes: schema OK.
  - mix.py ran end to end on stand-in audio.
- Merged the box's wushu v5.1 rebuild (6439c70: six copies, the group fall, main in for the salute); a follow-up session reworks plates + EDL.
- Wushu v5.1 follow-up (cloud, same day; nothing generated or spent). Details: `docs/wushu_v5_design.md` §10.
  - Plates: STILLS `dr_dl_close`, `dr_gs_line6` and `dr_gs_v6`, with refs and lanes pinned, plus `*_patch` edits through the new
    `stills.py` `patch` tool.
  - Takes: re-checked against the box's bar map. The fall take is now 7 s and its shot runs to 98.3, so the rise shows. The halves and
    pairs window starts at bb(97, 2). Orange is in the salute plate, so she keeps the canon face.
  - Audio cues: no "big hit" or choir cues where the instrumental has none.
  - EDL: cuts at bar positions (98.5), and `keyed()` pins the fall's hit and rise and the salute's stance and palm to bars.
  - Checks: `node --check`; the EDL harness over 0–297 s for the default, `?drop=v4` and `?drop=v5` × 3 picks variants, with all, some or
    none of the new takes faked as picked: 0 exceptions, 0 bad args, 0 gaps, no held drop frames. `batch.py --dry`: 12 specs, schema OK.
  - Wushu queue: ≈ $18.51 of ≈ $70.5 (run sheet §2.1).
- **Needs intake/render (box):** first `picks.py` (the new lags). Then the queue in V5_BOX_RUNSHEET.md §2 (≈ $70.5; generate with `--t0=13`),
  one intake at a time, lags from word strips, picks, `tools/mix.py out/mix_v5.wav`, and review renders 62–80, 99–119, 206–216, 226–266 and
  280–297.016 (720p), then the full film. Stills to fit after picking: the orchestra framings (`WIDE`/`CLOSE`), the post-credits `FR` and
  FX.mote paths, and the drop's `KEY` clip times.
