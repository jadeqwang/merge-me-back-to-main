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
- Frozen-frame + fork-tree fixes (cloud, same day; Jade's OK; nothing generated, rendered or spent). Run sheet §1.1.
  - `tools/edl_check.mjs` found 50 held plate clocks in 12 places (panes 4–22 s, fork copies, 0:42, 1:14, 1:51, 3:01, 3:48, 3:56 …). Now 0 in
    every variant. Non-sung takes and panes slow just enough (`fit`, engine/src/clip.js); lip-synced takes are only trimmed (cut on the take's
    first/last frame, `len` from picks.py); 3:01 opens on a 2-beat `v2_dish_sit` wide. No loops.
  - Fork-tree copies are glyph-built (figGlyph tiers per screen cell; `?figlook=led` = LED). SwiftShader smoke test on a test plate only.
- **Needs intake/render (box):** first `picks.py` (the new lags, and each take's `len`), then `node tools/edl_check.mjs` (expect held-clocks 0).
  Then the queue in V5_BOX_RUNSHEET.md §2 (≈ $70.5; generate with `--t0=13`), one intake at a time, lags from word strips, picks,
  `tools/mix.py out/mix_v5.wav`, and review renders 27–44, 53–90, 99–119, 124–153, 176–184, 206–216, 222–266 and 280–297.016 (720p), plus
  64–80 with `figlook=led`, then the full film. Stills to fit after picking: the orchestra framings (`WIDE`/`CLOSE`), the post-credits `FR` and
  FX.mote paths, and the drop's `KEY` clip times.
- **v5a rendered (box, 2026-10-25 05:46 CDT), needs Jade:** `review/v5a/` (4 × 720p parts, 75–80 MB; README has the eyeball table). Branch at 54bf08e,
  default params, `picks.py` + `edl_check` (held-clocks 0) + `mix.py out/mix_v5.wav` first. No Drive upload route on the box, so no 1080p file.
  No generation (stand-ins everywhere v5 needs new takes). Master: box `out/review/v5a/merge_v5a_720.mp4`.
- **Cloud generation attempt (cloud, 2026-10-25 ~11:00 UTC; Jade flying; needs intake/render + Jade):** the v5 queue could NOT run from the cloud.
  Two blockers, both outside the repo:
  1. **Seedance blocked: KV 401.** The read-only probe in `docs/CLOUD_GEN.md` (check 1) returned `401 Authentication error`: the proxied
     Cloudflare token has no Workers KV permission, so `gen.py` can't queue relay jobs. **Jade: add "Workers KV Storage: Edit" (account
     scope) to the cloud token.** The same token passes `/user/tokens/verify` and `/ai/models/search` (200), so only the KV scope is missing.
  2. **Image calls time out at ~30 s.** `/ai/run` works, but every attempt that runs longer than ~30 s comes back as `HTTP 502: upstream
     request failed` (plain text, not Cloudflare JSON; every failed attempt lasted 30.5 s). GPT Image 2.5 `high` and nano-banana-pro
     usually take longer, so only 3 of ~44 attempts returned. The upstream may still have billed the timed-out ones, so the ledger carries a
     **conservative $8.79 row** (36 GPT Image + 5 nano-banana attempts, tags `cloud_502_timeouts_maybe_billed_*`). Delete those two rows
     once the Cloudflare bill shows they weren't charged. I stopped image work after the orchestra plates kept failing. Once KV works,
     image calls can go through the relay (async, no 30 s hop), or the box can make them.
  - **Made (in `review/takes/stills/`; box: copy into place, then `rm` the cached first frame):**
    - `v2_horizon_v5.jpg` (3:09 jacket back, queue 6): 2 nano-banana-pro calls from the 1600-px stand-in (`review/cloud/stills/v2_horizon_t5_*`).
      **Pick b**: the violet band behind the circle is gone, the 1420 MHz patch is on her LEFT arm only, bands/collar/straps/headphones
      stay violet, and the bun, pencils, dish and sky are unchanged. Candidate a removed the band but kept the patch on both sleeves. Box:
      `cp media/plates/fix/v2_horizon.jpg media/plates/fix/v2_horizon_v4.jpg; cp review/takes/stills/v2_horizon_v5.jpg media/plates/fix/v2_horizon.jpg;
      rm -f media/gen/refs/v2_horizon_fix.jpg`. It's 2752×1536 (made from the stand-in, not the box's full-res plate); redo it from the box
      plate if it looks soft. Then the `v2_horizon` takes (2 × 8 s).
    - `orch_wide.png` (16:9 crop) + `orch_wide_a_uncropped.png` (queue 9): only candidate a returned (b timed out three times). It matches
      the prompt: the violet composer (bun, two pencils, glowing pencil baton raised in her right hand, patch on her left arm), with the
      rose pianist, white violinist and rose guitarist kept. Provisional pick: the centre crop clips the shoes a little, and the box may
      want candidate b (`gpt_plate.py` reuses `_a` if it's in `media/plates/outro/`). Box: `cp review/takes/stills/orch_wide_a_uncropped.png
      media/plates/outro/orch_wide_a.png`, make b, then pick.
  - **Not made:** `orch_line/keys/pencil/guitar` plates, `intro_up`/`bd_float` canonprop candidates, the three wushu plates and their patch fixes,
    and **every Seedance take** (queue 1–5, 6's takes, 7, 8, 10, 11). No `review/takes/*.mp4`. The canonprop windows for the box (on the
    1600-px stand-ins; scale ×1.2 for the 1920-wide plates): `intro_up --box=425,0,480` (head + the long hair to the shoulders), `bd_float
    --box=570,10,320` (the whole fanned hair).
  - **Spend:** ledger $293.61 of $600 = $284.32 before + $0.49 logged (3 images) + $8.79 conservative for the timeouts. Hard stop was $365.
  - **Next:** either Jade fixes the KV scope and a NEW cloud session reruns the queue (`--t0=51`; route the images through the relay too),
    or the box runs V5_BOX_RUNSHEET §2 as written (then it can drop the two stills above into place instead of regenerating them).

### Summary for Jade (cloud generation session, 2026-10-25)
Nothing was animated: the cloud token can't write Workers KV (401), so Seedance can't queue. Image calls work but hit a ~30 s timeout
between this container and Cloudflare, so only 3 of ~44 came back. Kept: the 3:09 jacket-back fix (band gone, patch on the left arm only) and
one orchestra wide candidate (violet composer). Spend: $284.82 logged, plus $8.79 booked conservatively in case Cloudflare billed the timed-out
attempts (ledger $293.61 / $600). To unblock: add **Workers KV Storage: Edit** to the cloud token, or let the box run the queue when you're back.

### v5a QA fixes (cloud engine session, 2026-10-25; nothing rendered)
Engine/EDL only, no takes, no spend. 1:07 glyph face readable (fork-tree cell = copy height / 160, dark parts filled); 1:41 `bd_float` back
no longer blown (back `figGain .3`); orchestra stand-in close-ups are 2D crops (`zoom`, no parallax), no tearing, v5 orchestra stays default;
slowed clocks (< 0.9x) blend frames; minors (2:26 scrim, 4:18 log, 3:00.8 insert/flash, poem scrim). edl_check: 0 exceptions, 0 held clocks
(default, orch=v4, drop=v4/v5, figlook=led). **Next render:** eyeball V5_BOX_RUNSHEET §1.2's ranges.

## 2026-10-25 checkpoint 13: v5 generation queue run from the cloud — NEEDS INTAKE/RENDER (box)
Cloud session, Jade flying (she OK'd the spend). The KV check printed `None` (Jade added Workers KV Storage: Edit), so the whole run sheet §2
queue ran through the relay. **Spend: $368.84 / $600** in the committed ledger (was $293.61; hard stop was $380). No renders, nothing in engine/.
- **Images through the relay**: `GEN_IMAGES_VIA_RELAY=1` makes `cf.generate()` (so gpt_plate / fix_patch / gen_plates / canonprop) queue the
  image call as a relay job (`gen.run_image`: KV PUT job, the relay cron runs env.AI.run, KV GET result) instead of the direct call that times out at
  ~30 s here. The default (unset, the box) is the direct path. Relay quirks seen today: an intermittent `2047: Invalid User Credentials` on every
  model (errored = refunded; resubmitting worked), two cron minutes missed (jobs requeued; the orphaned keys deleted and logged ok=false), and three
  jobs stuck in `running` with no result. Those three are counted conservatively in the ledger: `canonv4_intro_up_v5_0` and `drop_dr_gs_line6_0`
  ($0.24 each), `intro_up_t52-b3bff38a5a` ($1.85). If `res:mergemain/intro_up_t52-b3bff38a5a` ever shows up in KV, it can be collected.
- **Box: put the stills in place before intake** (copy from `review/takes/stills/`; `rm media/gen/refs/<name>*` for each first frame):
  `v2_horizon_v5.jpg` → `media/plates/fix/v2_horizon.jpg` (kept from the earlier session); `intro_up_face_v4.png` → `media/plates/face_v4/intro_up.png`;
  `bd_float_face_v4.png` → `media/plates/face_v4/bd_float.png`; `orch_{wide,line,keys,pencil,guitar}.png` → `media/plates/outro/`;
  `dr_dl_close.png`, `dr_gs_line6.png`, `dr_gs_v6.png` → `media/plates/drop/`. The face_v4 and fix stills were made from the 1600-px stand-ins in
  `review/cloud/stills/`, so they're 1600 px (intro_up, bd_float) or 2752 px (v2_horizon) wide.
- **Takes** (`review/takes/<tag>_<id>.mp4` + `review/takes/specs/<tag>.json`; 41 takes, ≤ 16 MB each). Copy them into `media/gen/` and the specs into
  `media/gen/specs/`, then run intake one take at a time. Preferred = my pick from frames only; lip lag and beat timing are the box's call.

| shot (time) | tags | preferred | why / failures |
|---|---|---|---|
| ch2_catch (3:30) | ch2_catch_t51, _t52, ch2_catch_b_t51 | **t52** | eyes closed and calm throughout, only a soft closed-mouth smile at the very end; t51 smiles a little while singing; _b opens her eyes mid-line as its variant asks |
| ch2_gone_close (3:54) | t51, t52, t53 (retake) | **t51** | calm, eyes close on the last note; **t52 and t53 grin with teeth** (fail) |
| out_main (4:12) | t51, t52 | **t51** | eyes close from 4.4 s, ends lips relaxed; t52 smiles more |
| ch1_main (1:11) | t51, t52 | **t51** | both a bit smiley while singing; t52 has an odd teeth-bared blink at 2.3 s |
| bd_ahh (1:58) | t51, t52 | either (t52) | both eyes closed the whole time, camera still; t52 opens on the note sooner; pick on lip lag |
| v2_horizon (3:09) | t51, t52 | either (t51) | both keep the fixed back (no band, RARE EARTH + circle, patch on the left arm) to the last frame |
| intro_up (1:07) | t51 (t52 lost on the relay) | **t51** | canon face (nano-banana whole-frame edit; the GPT canonprop windows redrew her body smaller = doubled torso, rejected); breath, slow blink, small smile |
| bd_float (1:46) | t51, t52 | **t52** | starts on the still, slow rise, ripples from her fingertips, canon face eyes closed; t51 opens close-in and pulls far up |
| orch_wide | t51, t52 | **t52** (check vs music) | four players throughout; t52 holds the pencil high longer before the downbeat, t51 slashes at ~1.3 s |
| orch_line | t51, t52 | **t51** | draws the glowing rising curve; RARE EARTH back holds in both. Still edited: the composer is seen from behind, so her right-arm patch and the back band were removed and RARE EARTH + circle added |
| orch_keys | t51, t52 | **t51** | two hands (still edited: a phantom third hand removed); t52 adds stray lettering on her trousers |
| orch_pencil | t51, t52 | **t51** | writes the strokes, keeps her face; t52 restyles the face a little |
| orch_guitar | t51, t52, t53 (retake) | **t53** | starts on the still, big strum; t51 fine; **t52 doesn't start from the still** (no amp, other sky; fail) |
| dr_dl_wide (89) | t51, t52, t53 (retake) | **t53** | **t51/t52 grow extra background fighters** (8–10); t53 stays close to six, spinning kick at ~4.5 s |
| dr_dl_close (91) | t51, t52 | **t51** | sweep, jump, flying kick, mirrored freeze; extra soft-focus background fighters creep in at the end of both (t52 worse) |
| dr_gs_ranks (93) | t51, t52 | **t51** | burst near 1.7 s, drop stance, overhead pose held; t52 bursts late (~3 s) |
| dr_gs_tornado (97, the fall) | t51, t52 | **t52** | six land flat together in one sheet of spray, still, rise by ~6 s; t51 similar |
| dr_gs_ring (98.3) | t51, t52 | **t51** | six, frontal, halves then pairs; t52 starts at an angle off the still |
| dr_gs_salute (100) | t51, t52 | **t52** | horse stance with arms out, orange visibly steps into the point, salute; seven bodies in both |

- **Stills made** (all looked at): orchestra 5 × GPT Image (picks wide a, line a + edit, keys a + edit, pencil b, guitar b), wushu plates (dl_close b +
  patch fix: violet faces left, so her near-arm patch was removed; gs_line6 b; gs_v6 b). The gs_line6 / gs_v6 patch edits were **skipped**: their
  patches already sit on the left arms and read at plate size (run `stills.py dr_gs_line6_patch dr_gs_v6_patch` on the box if they blur in the takes).
  Rejected: intro_up/bd_float GPT canonprop candidates (scale/window seams), bd_float nano-banana a (a second body).
- **Box next:** stills into place (above), copy the takes, intake one at a time, word-strip lags for the sung takes, picks
  (`docs/picks_manual.json`), `picks.py`, `node tools/edl_check.mjs`, the drop `KEY` frames (run sheet §2.1 step 5), orchestra framing fits, then the
  §3 review renders (330_catch, 354_outro, 107_origin, 146_breakdown, drop_v5) and the full film for Jade.

### Summary (cloud generation session 2, 2026-10-25)
Generated the whole v5 queue from the cloud: 41 Seedance takes (11 singing re-takes, v2_horizon, intro_up, bd_float, 10 orchestra, 13 wushu incl.
retakes) and the stills they start from (5 orchestra plates + 2 edits, 3 wushu plates + 1 patch fix, 2 canon-face stills). Every shot has at least
one take that passes the frame checks; clear failures: ch2_gone_close t52/t53 grin, orch_guitar t52 ignores its still, dr_dl_wide t51/t52 extra
fighters. Spend **$368.84 / $600** (+$75.23 this session, ≈ $2.3 of it conservative rows for jobs the relay lost). Blockers: none; the relay is
flaky (2047 errors, missed minutes, stuck jobs), so watch `gen.py status`.
- **Requested after the run; DONE by cloud session 3 (checkpoint 14 below)** (2026-10-25 22:02 UTC, via a message from session_01TSBays4bH1M779gzn9GT9M relaying Jade's decisions; this
  session's brief was "run the queue, nothing else", so new spend waits for Jade's direct OK or a session she starts for it):**
  1. Duilian: violet gets TWO space buns to match the group set. One careful nano-banana edit of `media/plates/drop/dr_duilian.png` (only violet's
     hair; every lane colour pinned; faces, poses, patch unchanged) → point `dr_dl_wide` at it in `tools/sd/shots_wushu.py` → regenerate its 2 takes
     (≈ $0.13 + $2.77). Note: `dr_dl_close.png` (this session's plate) also gives violet ONE bun, per the prompt then; it needs the same hair edit
     and its takes redone (≈ $0.13 + $2.77). The dr_dl_* takes in review/takes keep the one-bun violet.
  2. Life clip `lf_wushu_gold` (jade/wushu): regenerate as Jade ALONE doing a jian (sword) solo at a collegiate competition (canon face v4, high
     ponytail, gold bands, patch on the LEFT arm, competition carpet, soft arena light, nobody else in focus): a `docs/plates.json` lf_* entry, a
     Seedance spec next to the other lf_* shots (one lunge-thrust-into-balance phrase, ~6 s), 2 still candidates + 2 takes (≈ $2.50). Caption
     unchanged; the box wires the pick via `docs/picks_manual.json`.
  Total ≈ $8.3 → ≈ $377 of the $380 cap set for this run.
  → **1 done**: plates `dr_duilian_v5.png` + `dr_dl_close_v5.png`; picks **dr_dl_wide_t56** (submitted as t53, renamed), **dr_dl_close_t53**.
  → **2 done**: plate `lf_wushu_gold_v5.jpg` (candidate b); pick **lf_wushu_gold_t53** (wire via `docs/picks_manual.json` on the box).

## 2026-10-25 checkpoint 14: duilian two space buns + lf_wushu_gold jian solo — NEEDS INTAKE/RENDER (box)
Cloud session 3, started from Jade's instruction (her answers in session_01TSBays4bH1M779gzn9GT9M: "Match: two space buns", "Regenerate as your
jian solo"; spend OK'd). Only those two items. Spend **$380.14 / $600** (+$11.30: 5 nano-banana-pro images ≈ $0.67, 5 × 6 s + 2 × 8 s Seedance
≈ $10.64; hard stop was $385). No renders, nothing in engine/. Relay: two image jobs and the close takes missed cron minutes (requeued, not billed twice).
- **Code**: `tools/sd/shots_wushu.py` STILLS `dr_duilian_buns` / `dr_dl_close_buns` (new stills.py tool `edit`: one nano-banana-pro edit with its own
  refs, saved as a new PNG, src kept), and `dr_dl_wide` / `dr_dl_close` now start from `media/plates/drop/dr_duilian_v5.png` / `dr_dl_close_v5.png`
  (the v4 `dr_duilian` shot keeps the original plate). `fix_patch.py --refs=`; `gen_plates.py hair=ponytail` (canon face v4 + patch refs);
  `docs/plates.json` `lf_wushu_gold_v5`; `tools/sd/batch.py` `lf_wushu_gold` = alone, jian solo, `plate=lf_wushu_gold_v5.jpg`, `face=lf_wushu_gold_v5`
  (so a box `face_v4/lf_wushu_gold.png` can't win). **8 s, not 6**: the sword phrase takes ~6 s, then the shared head turn left in the last 2 s,
  because the pre-chorus panes cut every lf_* take on clip 6.3 (engine/show/main.js `turn - 6.3`); a 6 s take would hold its last frame there.
- **Stills** (`review/takes/stills/`; box: copy into place, then `rm -f media/gen/refs/<name>.jpg`):
  `dr_duilian_v5.png`, `dr_dl_close_v5.png` → `media/plates/drop/`; `lf_wushu_gold_v5.jpg` (+ candidates `_a`, `_b`) → `media/plates/`;
  `violet_space_buns.png` (violet's head cropped from dr_gs_line6, the edit reference) → `media/style/v5/`.
  - dr_duilian edit: violet has two space buns (seen in profile); faces, poses, patches, every lane and the other copies' hair unchanged. Made with the
    prompt before the "hair stays BLACK" sentence was added.
  - dr_dl_close: first edit **rejected** (the four background copies' hair dyed in their lane colours); the second, with "everyone's hair stays BLACK",
    is right. It came back 1376×768 (the source is 1536×864).
  - lf_wushu_gold_v5: **b** (gold bands/headphones, jian thrust in a bow stance, left hand in sword-finger, patch on her LEFT upper arm, red carpet,
    arena lights, judges' table soft). a was rejected: its bands/headphones read orange. b's patch lettering is mushy at plate size (as on other plates).
- **Takes** (`review/takes/<tag>_<id>.mp4` + `specs/<tag>.json`):

| shot | tags | pick | why / failures |
|---|---|---|---|
| dr_dl_wide (89) | t56, t57, t55 | **t56** | starts on the still, violet's two buns hold, six fighters from ~2 s on; two extra background figures flash in around the drop (~1.7 s). **t57 fails** (doesn't start from the still: purple sky, far framing; violet gets a ponytail). **t55 fails** (8–9 background fighters, violet's buns become a ponytail). t56/t57 were submitted as `dr_dl_wide_t53/t54`; those tags were already taken (cloud session 2's retake t53), so the files and specs were renamed and each spec's notes say so (`relay_tag`). |
| dr_dl_close (91) | t53, t54 | **t53** | sweep, jump over it, flying kick, mirrored freeze; violet keeps two buns; soft-focus background fighters multiply (6–8) as in t51/t52, t54 worse |
| lf_wushu_gold (life montage) | t53, t54 | **t53** | alone; draw back, overhead circle, low lunge-thrust, one-legged balance with the blade level; head turns screen-left in the last 2 s; steel blade. t54 also works (sword overhead in the balance), but its blade turns pinkish and the end turn is weaker |

- **Box next**: stills into place, copy the takes into `media/gen/` and specs into `media/gen/specs/`, intake one at a time, then `docs/picks_manual.json`:
  `dr_dl_wide` → `dr_dl_wide_t56_22b50b2f35`, `dr_dl_close` → `dr_dl_close_t53_5b3390e313`, `lf_wushu_gold` → `lf_wushu_gold_t53_035fa485a9`;
  `picks.py`, `node tools/edl_check.mjs`. Re-check the drop `at()` clip times for the two duilian shots, and the pre-chorus and breakdown panes that
  show lf_wushu_gold (the pane turn cuts on clip 6.3). The caption (`LIFE` message) is unchanged. Note: the lives table near main.js line 955 shows
  her wushu life with the `dr_set` plate, not this take.

### Summary (cloud generation session 3, 2026-10-25)
Did Jade's two follow-ups. Violet now has two space buns in both duilian plates (one edit each; the close plate needed a second try because the
first dyed the background copies' hair) and in the new takes: picks dr_dl_wide_t56 and dr_dl_close_t53, both still with some extra soft-focus
background fighters. The wushu life clip is now Jade alone doing a jian solo at a collegiate competition: plate b, take t53. Spend **$380.14 / $600**.
