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
  → **1 done**: plates `dr_duilian_v5.png` + `dr_dl_close_v5.png`; picks **dr_dl_wide_t58**, **dr_dl_close_t57** (after the follow-up retakes, see checkpoint 14).
  → **2 done**: plate `lf_wushu_gold_v5.jpg` (candidate b); pick **lf_wushu_gold_t53** (wire via `docs/picks_manual.json` on the box).

## 2026-10-25 checkpoint 14: duilian two space buns + lf_wushu_gold jian solo — NEEDS INTAKE/RENDER (box)
Cloud session 3, started from Jade's instruction (her answers in session_01TSBays4bH1M779gzn9GT9M: "Match: two space buns", "Regenerate as your
jian solo"; spend OK'd). Only those two items. Spend **$388.47 / $600** (+$19.63: 5 nano-banana-pro images ≈ $0.67, 11 × 6 s + 2 × 8 s Seedance
≈ $18.96). The run's $385 stop was lifted mid-run (Jade, relayed by the parent session: "don't worry about the budget"), which paid for the
duilian retakes wide t58/t59 and close t55–t58. No renders, nothing in engine/. Relay: two image jobs and the close takes missed cron minutes (requeued, not billed twice).
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
| dr_dl_wide (89) | t58, t56, t57, t55, t59 | **t58** | starts on the still, violet's two buns hold, **exactly six fighters at every sampled frame** (0, 1.7, 3.3, 5.8 s). t56: OK but two extra background figures flash in around the drop (~1.7 s). **t59 fails** (doesn't start from the still). **t57 fails** (doesn't start from the still: purple sky, far framing; violet gets a ponytail). **t55 fails** (8–9 background fighters, violet's buns become a ponytail). t56/t57 were submitted as `dr_dl_wide_t53/t54`; those tags were already taken (cloud session 2's retake t53), so the files and specs were renamed and each spec's notes say so (`relay_tag`). |
| dr_dl_close (91) | t57, t53, t56, t54, t55, t58 | **t57** | sweep, jump over it, head-high flying kick, mirrored freeze; violet keeps two buns; the freeze has **exactly four** figures behind the pair, but 1–2 extra soft-focus fighters appear mid-action (every close take does this). t57/t58 were made with the act naming the four background figures. t53/t56: same action, 7–8 fighters at the freeze. **t55 and t58 fail** (don't start from the still) |
| lf_wushu_gold (life montage) | t53, t54 | **t53** | alone; draw back, overhead circle, low lunge-thrust, one-legged balance with the blade level; head turns screen-left in the last 2 s; steel blade. t54 also works (sword overhead in the balance), but its blade turns pinkish and the end turn is weaker |

- **Box next**: stills into place, copy the takes into `media/gen/` and specs into `media/gen/specs/`, intake one at a time, then `docs/picks_manual.json`:
  `dr_dl_wide` → `dr_dl_wide_t58_67a5ce5078`, `dr_dl_close` → `dr_dl_close_t57_2996c73578`, `lf_wushu_gold` → `lf_wushu_gold_t53_035fa485a9`;
  `picks.py`, `node tools/edl_check.mjs`. Re-check the drop `at()` clip times for the two duilian shots, and the pre-chorus and breakdown panes that
  show lf_wushu_gold (the pane turn cuts on clip 6.3). The caption (`LIFE` message) is unchanged. Note: the lives table near main.js line 955 shows
  her wushu life with the `dr_set` plate, not this take.

### Summary (cloud generation session 3, 2026-10-25)
Did Jade's two follow-ups. Violet now has two space buns in both duilian plates (one edit each; the close plate needed a second try because the
first dyed the background copies' hair) and in the new takes: picks dr_dl_wide_t58 (six fighters throughout) and dr_dl_close_t57 (six at the freeze; a
couple of extra soft-focus fighters mid-action). The wushu life clip is now Jade alone doing a jian solo at a collegiate competition: plate b, take t53. Spend **$388.47 / $600**.

## 2026-10-26: Jade's v5a notes, EDL only — NEEDS RENDER (box)
Cloud session, no generation, no spend, nothing rendered. Edits are in `engine/show/main.js` only: the build block, `FX.mote`, the post-credits.
`FX.score` and the ORCHESTRA block are untouched (another worktree is rewriting them). Details: run sheet §1.3; for Jade: REVIEW_FOR_JADE.md
"Jade's v5a notes".
- 2:20.3: "› analysis mode" is in the header from the screen's first frame; the fourth kick (AN) pulses it instead of typing it.
- 2:06.3: `?bd=full` variant. Bars 73–76: 16 full-frame cuts on the kicks. Bar 77: the matrix appears, then shrinks into the bottom-right corner
  by bar 78. The git log starts at bar 77 beat 4. The default is unchanged.
- 4:44.1: the post-credits sender is `v2_release` (`pk`, clip 0.6–5.2 at 1x, light leaving her palm). The drawn mote rides the take's light
  (`REL_ORB`, measured on t12). The cut, the touch at P0 + 6.4 and `mix.py` are unchanged. t12's 1420 MHz patch is on her right arm (flagged
  to Jade). The clean `v2_horizon` (t51/t52 + still) needs intake and a pick only; 3:07 follows PICKS.
- `edl_check` 0–297: 0 exceptions, 0 held clocks (default, `bd=full`, `drop=v4/v5`, `figlook=led`).
- **Box:** render 124–153 with the default and with `bd=full` (the A/B), plus 280–297.016 (run sheet §3).

## 2026-10-26 checkpoint 15: wushu v5.3, the partner roll — NEEDS INTAKE/RENDER (box)
Cloud session (started from Jade's instruction in session_01TSBays4bH1M779gzn9GT9M: "an actually impressive looking wushu move from the group
set, like rolling over your sparring partner's back"). It cost ≈ $21.45: 15 Seedance takes at 6 s (≈ $20.81) plus 3 billed stills (one
nano-banana-pro edit, two GPT Image 2.5 candidates; a third GPT job was refunded). The ledger shows **$463.13 / $600**, which includes other
sessions' parallel spend. Design and results: `docs/wushu_v5_design.md` §11. Run sheet: the wushu v5.3 row.
- **Where it lands:** the duilian close, bars 91–92. The roll's inverted peak is on **92.3** (159.25 s). There the bass steps E → F#: the
  drop's strongest beat-3 onset (flux 228 against 140–197 on every other bar) and the airborne bar of the first rising phrase. The
  liangxiang freeze lands on the 93.1 cut. Bar 98 (the cross pairs) is mid-phrase C#, with only the regular snare.
- **Stills** (`review/takes/stills/` → box `media/plates/drop/`):
  - `dr_dl_roll.png`: dr_dl_close_v5 pulled back with one nano-banana-pro edit, so the roll's arc stays in frame.
  - `dr_dl_ripple.png`: the three pairs in a diagonal echelon (GPT Image 2.5, candidate a cropped to 16:9; the uncropped candidate is kept).
  - Then `rm -f media/gen/refs/dr_dl_roll.jpg media/gen/refs/dr_dl_ripple.jpg`.
- **Takes** (`review/takes/<tag>_<id>.mp4` + `specs/`). Tags t63/t64 are variant b, retagged onto the base shot (`notes.variant`).

| shot | tags | pick | why |
|---|---|---|---|
| dr_dl_roll (91) | t65, t61, t62, t63, t64, t66 | **t65** | sweep ~2.0, duck ~3.2, violet rolls over orange's back, inverted peak 4.0, lands on the far side, a NEW liangxiang freeze from 5.05; two bodies throughout, lanes, faces and hair right. Behind the pair: one extra soft-focus figure and a small dark blob. t61/t62 roll cleanly but ~1 s early and spring back into the opening guard. t63 is busy; **t64 merges the bodies**; **t66 recolours violet orange after the landing** |
| dr_dl_ripple (91, `?roll=wide`) | t69, t65, t61–t64, t66–t68 | **t69** | starts on the still, back → middle → front canon, a new freeze from ~5.0. In the front roll orange goes over violet: an X of four legs for ~0.4 s. t65 has the cleanest canon but loses the orange partner for ~0.3 s. t61/t64: lanes recoloured from frame 0. t62/t63/t68: don't start from the still. t66: merges. t67: front pair first |

- **EDL** (drop block only; `node --check` OK; `tools/edl_check.mjs` with `?drop=v4`, `?drop=v5`, `?roll=close|wide|off`, and fake
  picks: 0 exceptions, 0 held clocks).
  - `?roll=close|wide|off`. The default is the picked roll (close first), else the v5.2 dr_dl_close.
  - Measured keys: `KEY.dr_dl_roll` = [[91, 2], [92.5, 4], [93, 5.25]]; `KEY.dr_dl_ripple` = [[91, 1.739], [91.5, 2.6], [92.5, 4.15]].
  - A 0.22 flash marks the peak.
  - The duilian → group set structure, the fall on 97 and the salute → fold are unchanged. The ORCHESTRA block and FX.score were not touched.
- **Previews for Jade's phone:** `review/previews/wushu_roll/<take>.mp4`, five files of 4.3–4.5 MB each (720p, 152.2–175.0 s). Each is a
  raw-take rough cut of the whole drop with the candidate in the 91 slot on its keyed clock, plus the full mix. Index entries are in
  `review/previews/index.json`. Tool: `tools/preview_drop.py`.
- **Box next:**
  1. Copy the stills into place, the takes into `media/gen/` and the specs into `media/gen/specs/`.
  2. Intake `dr_dl_roll_t65_96b71e9d46` and `dr_dl_ripple_t69_e0408ef0fb`, one at a time.
  3. Add both to `docs/picks_manual.json` (`dr_dl_roll`, `dr_dl_ripple`).
  4. Run `picks.py`, then `node tools/edl_check.mjs --q=drop=v5`.
  5. Render 150–176 with `drop=v5` and with `drop=v5&roll=wide`.
  6. Check that the peak lands on 92.3 (2:39.25) and that the freeze is there on the 93.1 cut.

### Summary (cloud session, wushu roll, 2026-10-26)
The duilian close now ends with a real back roll over the partner's back, peaking on the drop's one irregular accent (92.3, the bass's F#) and
freezing in liangxiang into the group set's burst on 93. Close pick **dr_dl_roll_t65** (the default). Wide canon pick **dr_dl_ripple_t69**
(`?roll=wide`; busier, an alternative). Two rounds: round 1 taught that Seedance runs ~1 s early, snaps back to the first frame's pose, and
recolours lanes when many colours are named; round 2's prompts fixed all three in the close. Previews are in `review/previews/wushu_roll/`.

## 2026-10-26 checkpoint 16: orchestra v5b — the notation is the music, the composer is still (engine/docs only; no spend) — NEEDS INTAKE/RENDER (box)
Jade's v5a note: the composer "is still not doing anything meaningful with her body … rather her be still, holding a pencil and drawing notes
that fly into the staff"; the notation must "correctly correspond to the music … read left to right … not arbitrary".
- **Transcription** of bars 137–144 with provenance and resynthesis checks: `docs/orchestra_transcription.md`, data `engine/show/score_orch.json`
  (`tools/orch_tx/build_score.py`; reference engraving `to_lilypond.py`; checks `verify.py`). Voice: two sung layers (C#5/C#4, D5/D4, G→A5/A4, E5
  over A4, F#5/F#4); keys: a dotted-8th synth line A4 (C#5 in 142/144) over Gadd9 → Bm7; bass drive offbeat 8ths G → B (no guitar in the mix:
  the guitar doubles it); nothing violin-like (the violin doubles the voice). The 16th inner arp is not transcribable under the drop: not notated.
- **Engraving**: `engine/show/score.js` (FX.score) draws real notation from the JSON (Bravura glyphs, `engine/fonts/bravura_glyphs.json`); a
  cursor reads left to right, the pencil writes each note 0.55 s ahead, notes fly to their player when they sound. `tools/edl_check.mjs` now
  serves the two JSONs and rewrites every `/engine/...` import.
- **Still composer**: `docs/picks_manual.json` now picks orch_wide_t52, orch_line_t51, orch_keys_t51, **orch_pencil_t52** (not t51: t51
  conducts with a raised arm) and orch_guitar_t53. The EDL uses orch_pencil_t52's still writing stretch (clip 3.0–4.8, 5.2–6.2) and orch_wide_t52
  clip 3.0–6.1 for the second wide (9.6–12.6 waves the pencil). Without t52 the composer cuts stay on the band (orch_line / orch_wide), and the
  v4 stand-ins never show the dancing conductor close.
- **Re-take spec (not generated)**: `tools/sd/shots_outro.py` `orch_compose` (8 s, still composer, only the pencil hand writes small strokes,
  eyes on the pencil, no trail, no reference audio; ≈ $1.85/take) and optional `orch_wide_still` (13 s, ≈ $3.0/take). Once picked, the EDL uses
  orch_compose automatically (clip 0.5–2.2 and 4–5); keyframe its pencil tip in `COMPOSE_TIP` (main.js) as PENCIL_TIP was.
- **Box next**: intake the orch_* takes, `picks.py`, `node tools/edl_check.mjs`, render 234–252 and check the score positions on the real lattice
  (views WIDE1/WIDE2/LINE/KEYS/PENCIL/GUITAR in the orchestra block; set on take frames at the cut midpoints).

## 2026-10-26 checkpoint 17: v5b singing shots (the brief called it "checkpoint 15"; the wushu roll and orchestra sessions took 15 and 16) (Jade's v5a lip-sync + expression notes) — NEEDS INTAKE/RENDER (box)
Cloud session (started from Jade's instruction via session_01TSBays4bH1M779gzn9GT9M). Nothing in engine/. Spend ≈ **$461 / $600** in the merged
ledger (other sessions spent in parallel; this session ≈ $65: 33 Seedance takes, 6 images). Direction for every sung shot (Jade): optimistic and
hopeful with depth, as if she has just said something profound; no shallow/advertising smile, no teeth grin, not somber or blank.
- **Method (cloud, no box needed): `tools/sync/cloudsync.py`** measures each raw take against the v2 vocal stem: per-frame mouth openness / width /
  smile / eyes / teeth (FaceMesh), envelope + onset + labial-weighted cross-correlation over the shot's EDL range, word strips (`--labials` = crops
  at each m/b/p onset), a contact sheet and a curve. The correlations lock onto phrase structure on held notes (e.g. v1_split_front 1.208,
  v1_light_hands 0.71, bd_ahh −0.375 were phrase locks), so every lag below was set by hand: mouth peaks on the vowels and closures on the
  labials, read from a clip-time plot with the words drawn at lag 0, then checked on the strips. Convention: clip = song − S0 + lag; all takes
  here are `timing: v2` (spec notes), so `picks.py` applies `s0 − lag` with no resync. **Ear-check every lag** (the previews below).
- **Previews for Jade (phone):** `review/previews/<shot>/<take>.mp4` (raw take at song time with the lag, full mix, shot range ±1 s, orange bar =
  inside the shot, sung word under the picture) + `review/previews/index.json` (44 clips: 8 picks, 28 candidates, 8 experiments).
  Made by `tools/sync/preview.py`.
- **Prompts:** `tools/sd/shots_v5.py` RETAKES (v5b: `HOPE`, `LIPS(last)`, `SING2`; ch1_main spells out the held "Merge"; out_main t64+ spells
  out the held "main"). Experiments: `tools/sd/shots_v5b.py` (new keys, never the default).

| shot (film) | candidates (lag) | expression | pick | why |
|---|---|---|---|---|
| v1_split_front (0:28) | **t11 (.62)** | soft closed smile at the end | **t11 .62** (unchanged) | mouth peaks on I / my / self / thou / sand / ways at +.62; no note from Jade on its sync |
| v1_light_hands (0:41) | **t62 (0)**, t12 (0), t63 (0); t61 lost on the relay | t62 smiles with some teeth mid-line, ends looking up at the light, soft | **t62 0** | holds "ahead" open to the end; t12 (v5a, lag −0.15) lumps "a-head" late and closes early; t63 puckers and opens "ahead" 0.6 s late |
| ch1_main (1:09) | **t61 (.167)**, t63 (.25), t52 (.125), t11 (.5), t62 (.45), t51 (.2) | t61: earnest wide-eyed singing, faint closed warmth at the end | **t61 .167** | M closed, mouth open through the whole held "Merge", closed on me/b/m, "main" held. **t11 (v5a) / t51 / t62 close mid-"Merge"** = Jade's "whole phrase in the space of merge": no lag fixes them |
| ch1_gone_close (1:29) | **t61 (0)**, t62 (0), t64 (0), t12 (0); t63 errored | t61: bright eyes, faint closed warmth; t62/t64/t12 end smiling | **t61 0** | "undone" held open (round) for its whole 5 s and closed as the sound ends; t12 closed 1.5 s early then smiled |
| bd_ahh (1:52) | **t52 (0)**, t51 (0), t12 (−.375) | eyes closed the whole note, serene | **t52 0** | fixes the huge eyes; mouth opens exactly on the "Ahh" (t51 opens 0.8 s early) |
| ch2_catch (3:28) | **t52 (.333)**, t51 (.25), _b_t51 (fail), t11 (.292) | eyes closed, contemplative, chin lowers | **t52 .333** | Merge held, closed on me/b/m, ends contemplative (Jade's 3:30 note). Picking it switches off the 3:30 interim trim (`CATCH_CUT`) |
| ch2_gone_close (3:48) | **t63 (0)**, t51 (.1), t62 (0), t64 (.4), t12 (.7), t52/t53 (grin) | t63: raised brows, earnest, faint closed warmth | **t63 0** | closed on the b, "become" held to its end. **t12 (v5a) fits at ~0.7, not 0.3** = Jade's "off by a whole word", and it grins. Note: t63 does not mouth the "Back to" pickup (235.75–236.4) before the orchestra cut at 236.53; consider cutting at `we(23)` (235.73) when t63 is picked |
| out_main (4:09) | **t61 (0)**, t64 (−.2), t65 (0), t66 (.1), t62 (0), t12 (−.25), t51 (0), t52 (.25); t63 lost | t61: calm, eyes close, relaxed; t64–66 pucker then teeth smile | **t61 0** | the vocal steps down a note ~1 s into the held "main" (spectrogram); every take re-articulates there. t61's is a small soft dip, no pucker, no extra word. t12 (v5a) shut for 1.3 s then reopened in a grin = Jade's "extra word after main". Picking t61 switches off the 4:12 interim trim (`OUT_MAIN_END`) |

- **EXPERIMENTS** (never default; to try one, point the real shot at it in `docs/picks_manual.json` and put the lag in `docs/lags.json`):
  - (a) 0:28 violet's face on main: still `media/plates/face_v4/v1_split_front_violet.png` (canonprop face mode, candidate b; refs = violet's
    dish close-up `face_v4/v2_dish_close.png`, i.e. `review/cloud/refs/canon_v4__violet_test__violet_ref.jpg` + a tighter crop
    `review/takes/stills/violet_dish_face.jpg`). **t61 (.25)** works but the camera pushes in more than t11 (the split copies assume a fixed
    framing); t62 pushes into a close-up (fail).
  - (b) 1:29 3/4 profile, main's face: still `ch1_gone_close_34.png` (GPT edit, first-round candidate b: a little slimmer than the canon,
    nearer violet, which Jade said is fine). **t61 (0)** keeps the 3/4 view, eyes past camera, calm and serious; **t63 (0)** keeps it too,
    soft closed smile at the end; t62 ignored the still (frontal), t64 reframed with the patch on the wrong arm.
  - (c) 1:29 3/4 profile, violet's face: still `ch1_gone_close_34v.png`. **t61 (0)** turns toward camera, clean held "undone"; **t62 (0)**
    keeps the 3/4 view looking past camera, mouth closes ~0.5 s late.
- **Post-credits sender `pc_send_v`** (Jade's 4:44 note, relayed by the parent session): the v2_release action, silent, from the v2_release still
  with the 1420 MHz patch moved to her LEFT (outstretched) arm. The nano-banana edit returned the image unchanged, then the relay errored and
  timed out, so the still is a local OpenCV edit (`review/takes/stills/pc_send_v.png`: old patch inpainted, same patch pixels placed on the
  left arm's band; a slight softness where the old one was). Same dish as v2_release (not the salt flat), so it cuts like the take it replaces.
  **Pick t61** (light lifts off her palm and drifts up-right, staying in frame; hand lowers; mouth closed, hopeful gaze following it up).
  t63 similar with less gaze lift; t62's light leaves the top of frame by ~2.3 s. Previews: `review/previews/postcredits/`.
  `docs/picks_manual.json` has `pc_send_v`. **EDL (not edited here; done in checkpoint 18):** the post-credits sender in `engine/show/main.js` (~lines 1082–1099,
  now `pk('v2_release')`, clip `REL_C0` 0.6–5.2) should switch to `pk('pc_send_v')` with `REL_C0` ≈ 0 and `REL_ORB` refit on t61 (the light
  starts above her palm at ~(735, 207) take px like t12 and rises up-right more slowly).
- **Box next:** copy `review/takes/*_t6[1-6]_*.mp4` + `_t5x` into `media/gen/`, specs into `media/gen/specs/`, the stills in
  `review/takes/stills/` (v1_split_front_violet / ch1_gone_close_34 / ch1_gone_close_34v .png → `media/plates/face_v4/`), intake one at a
  time (picks first: pc_send_v_t61, ch1_main_t61, ch1_gone_close_t61, ch2_gone_close_t63, out_main_t61, v1_light_hands_t62, bd_ahh_t52, ch2_catch_t52), then
  `picks.py` (docs/picks_manual.json + docs/lags.json are updated), `node tools/edl_check.mjs`, renders 27–48, 68–101, 110–119, 207–237, 248–256.
- **Relay:** 2047 errors (refunded) and two jobs stuck in `running` with no result (`out_main_t63`, `v1_light_hands_t61`; counted at their
  estimate in the ledger). One extra GPT still request (`drop_ch1_gone_close_34_*`, 00:49 UTC) never returned.
- **Orchestra composer (Jade's 3:57 note, relayed by the parent session; same v5b session):** `orch_compose` t61-63 and `orch_wide_still` t61-62
  (specs in `tools/sd/shots_outro.py`, stills `review/takes/stills/orch_pencil.png` / `orch_wide.png`). **Pick orch_compose t62**: body still,
  small writing strokes with the glowing tip, eyes on the pencil, no glyphs drawn, patch on her left arm. t61 draws note glyphs in the air
  (fail); t63 like t62 but closes her eyes late. `orch_wide_still`: t61 holds the still's raised-arm pose almost motionless (recorded in
  picks_manual, but the EDL doesn't read that key); t62 pushes in far. **`COMPOSE_TIP`** in `engine/show/main.js` (the only engine edit) now
  keys t62's tip: the brightest blob near her hand on every 3rd frame, x1.5 to 1920-space, clip 0.25-6.0 (the EDL uses clip 0.5-2.24 and
  4.0-4.98). `edl_check`: 0 exceptions / 0 held clocks with the cloud picks, and with orch_compose t62 added as picked. Previews:
  `review/previews/orchestra/`. Box: intake orch_compose_t62 (picks_manual has it) and look at the tip on the 4:01.9 and 4:08.4 cuts.
  Also fixed `tools/sync/preview.py` (the trim branch for takes that start before the window).

## 2026-10-26 checkpoint 18: v5b picks wired into the EDL (pc_send_v sender, ch2_gone_close t63 cut) — NEEDS INTAKE/RENDER (box)
Cloud session (session_01TSBays4bH1M779gzn9GT9M; no generation, no spend, nothing rendered). Edits: `engine/show/main.js` (post-credits sender,
the 3:56 cut; `COMPOSE_TIP` and the orchestra block untouched), `tools/edl_check.mjs` (`--fake=allnew` now includes `pc_send_v`), run sheet §1.4.
- **Post-credits sender → `pc_send_v`** (pick t61). `SEND = has('pc_send_v') ? pc_send_v : v2_release`, gated like the other v5 shots, so the
  v5a sender (`v2_release_t12`, clip 0.6–5.2, its hand-measured keys) stays until the box has run intake + `picks.py` for it.
  - With the pick: clip 0–4.6 at 1x (`REL_C0` = 0), from the light resting over her palm to the cut.
  - The mote lights up on the first frame on her palm's light and fades in with the picture. It is drawn at a constant size (`r` [12, 12]),
    because t61's light keeps a ~13 px core to the cut.
  - Unchanged: the cut (P0 + 4.6), the touch (P0 + 6.4), the window shot, the one pass and `tools/mix.py`'s 1-2-4-8 chimes.
- **`REL_ORB` refit** (now `SEND_ORB`, keyed by take with the take's size; `relXY` maps any take aspect, within 0.2 px of the old mapping for
  1284×716).
  - Tracker: ffmpeg rgb24 frames → numpy luma, box blur r 6, argmax within 60 px of the previous frame, then the centroid of the ≥ peak − 12
    core.
  - Keys: every 0.5 s, from a linear fit over ±3 frames.
  - Checked: the same tracker reproduces the v5a t12 keys within 2 px; the t61 keys are within 2.3 take px of the per-frame track to the cut.
  - Through the EDL under node, the drawn mote's head sits 0.5 px from the take's light on frame 0 and within 3.6 px (1080p) at every frame
    to the cut.
  - t61 path (take px 1284×716): (721, 215) at clip 0 → (843, 154) at 2 → (1015, 101) at 4 → ~(1071, 84) at the cut. It stays in frame.
  - t63 is measured too (1280×720, a different framing). Any other pc_send_v take falls back to t61's track: re-track it before picking it.
  - Contact sheet (scratch, not committed): every 0.5 s with the track, keys and keyed position drawn over the raw take; the ring sits on the
    light in every tile.
- **3:56 cut, take-aware** (`GONE_END`, like `CATCH_CUT`/`OUT_MAIN_END`): while `ch2_gone_close_t63_121f180301` is picked, the shot ends at
  `we(23)` (235.73, the end of "become"), because t63 keeps its mouth closed through the "Back to" pickup (235.75–236.4).
  - `ORCH_T0` follows, so the orchestra's first cut starts 0.8 s earlier. `orch_wide_t52` (s0 235.77) eases in from frame 0 at 0.96x; the
    stand-in and `orch=v4` (`out_orch`, s0 236.64) ease in at 0.49x until bar 137 + 2 beats.
  - No gap and no held frame. The hook's fade starts at min(we(23) + .15, cut − .2).
  - Any other pick keeps 236.53.
- **Validation:** `node --check` on an .mjs copy. `edl_check` (0–297) with default / `drop=v5` / `bd=full` / `orch=v4`, each × (cloud picks,
  `--fake=pc_send_v`, `--fake=allnew`), and the same with a scratch picks.json built like `picks.py` from `docs/picks_manual.json` + lags +
  take lengths (t63 and t61 live): 0 exceptions, 0 bad args, 0 gaps, 0 held clocks.
- **Box next:** after checkpoint 17's intake + `picks.py` + `node tools/edl_check.mjs`, render 222–266 and 280–297.016 (run sheet §1.4).
  Eyeball the drawn light on hers (4:42.5–4:47.1) and the 3:55.7 cut.

## 2026-10-26 checkpoint 19: Jade's review-page picks + "main in violet's look" — NEEDS INTAKE/RENDER (box)
Cloud v5b session, from Jade's notes on her review page (relayed by session_01TSBays4bH1M779gzn9GT9M). Spend **$503 / $1,000** (merged ledger).
- **Picks (docs/picks_manual.json + lags.json), Jade's choices:** v1_split_front → `v1_split_front_violet_t62` (lag .2, measured with
  per-frame face detection: the camera pushes in to a close-up and the tracker lost her; the split copies assume a fixed framing, so check
  0:28-0:33); v1_light_hands → `v1_light_hands_t12` (lag .05); ch1_gone_close → `ch1_gone_close_34v_t61`; out_main → `out_main_t61`; ch1_main
  t61, bd_ahh t52, ch2_catch t52, ch2_gone_close t63, orch_compose t62, pc_send_v t61 unchanged.
- **EDL (engine/show/main.js; the drop block untouched):**
  - v1_light_hands t12: "each one a light" fits at .05, but "ahead" opens ~0.3 s late. One lag can't fit both; within her 3% limit, from
    mid-"light" (`ws(3,3)+.4` = 43.73) the clip runs 3% fast (`clip(u,t)`), +0.05 s by "ahead". That is all a gentle map can give; the
    rate is capped so the take never runs past its last frame (with the stale cloud picks the cap is 0). Keyed on the take (`isTake`).
  - out_main t61 ("back to main me mo ohh"): the "main" vowel is open over clip 1.33-1.67 (250.43-250.77), the mouth shuts by 1.83 and the
    extra syllables reopen from 2.08 (251.18). `OUT_MAIN_END` = `bb(145, 1)` (250.99, beat 2 of bar 145) while t61 is picked; the living
    graph starts there (its second fork already waits for bar 147), gapless. Note: the violet-look `out_main_vl_t61` holds "main" as one
    vowel and could play the full shot.
  - `edl_check`: 0 exceptions / 0 held clocks with review/cloud/picks/picks.json, and with out_main t61 + v1_light_hands t12 at the new s0.
- **"Main in violet's look"** (Jade: violet's face is better, but face-swap edits leave partial-bang hair artifacts; give her violet's own hair
  in the orange jacket). No face swap: GPT Image stills of violet's own face and messy bun (her two pencils kept: "hair intact") in main's
  costume (orange lanes, patch on the LEFT upper arm), posed and framed like each shot's still. `tools/sd/shots_v5b.py` (`_vl()`, STILLS
  `*_vl`, SHOTS `*_vl`); stills in `review/takes/stills/` (v1_split_front_vl = cand a, ch1_gone_close_vl34 = b, ch1_main_vl = b, also used by
  out_main_vl, ch2_gone_close_vl = b).
  - 0:28 `v1_split_front_vl` t61-63: camera locked in all three (the prompt now says so), no bang artifacts, lag .2. **t63 recommended**.
  - 1:29 `ch1_gone_close_vl34` t61-63: **t63** keeps the 3/4 off-centre view (mouth closes ~0.4 s after the note); t61/t62 turn to face the
    camera. `ch1_gone_close_34v_t61` (Jade's pick) has a dark strand over one temple, the partial-bang artifact she described.
  - TEST (kind "experiment: violet look test"): ch1_main_vl **t61** (good sync, faint closed warmth), ch2_gone_close_vl **t61** (t62 fails:
    her eyes turn glowing orange), out_main_vl **t61** (one held vowel; some teeth on the held note).
- **Previews:** `review/previews/<shot>/` (+ `out_main_vl_t61_..._full.mp4` over the untrimmed shot); `review/previews/index.json` 71 entries.
  `tools/sync/preview.py --ramp=TA,K` plays the v1_light_hands time map. All of this session's previews are ≤ 1.5 MB.
- **Box:** copy the new takes/specs/stills, intake (picks first: v1_split_front_violet_t62, ch1_gone_close_34v_t61, v1_light_hands_t12 is
  already on the box), `picks.py`, `edl_check`, renders 27-48, 88-101, 248-256.

## 2026-10-26 checkpoint 20: fight-choreography model bake-off; v4 drop is the default again, with the roll and a kick-vs-block exchange spliced in — NEEDS INTAKE/RENDER (box)
Cloud session (started from Jade's instruction in session_01TSBays4bH1M779gzn9GT9M, her notes on `dr_dl_roll_t65`: a disembodied leg, arm
clipping, the fall get-up "not how humans get up", symmetric kicks; "try a few different models … how well does veo do?").
**Spend:** $22.90 for 24 takes. The ledger shows $526.35 / $1,000, which includes other sessions.
- **Bake-off:** `docs/video_model_bakeoff.md`. The same still and one shared prompt (`tools/sd/bakeoff.py`) on Seedance 2.5, Veo 3.1,
  Hailuo 2.3 (MiniMax H3 failed 7003 on every job, unbilled), Runway Gen-4.5 and Vidu Q3 Pro, 2 takes × 2 tests, plus 4 Seedance roll re-takes.
  Kling isn't in Cloudflare's catalog.
  - **Seedance 2.5 wins both tests.** Veo is sharper but ~1 s early, and it adds people or props.
  - Every roll take, from every model, breaks identity or colour after the landing. Seedance recolours violet from ~4.7 s.
- **Picks** (added to `docs/picks_manual.json`):

| shot | tags | pick | why |
|---|---|---|---|
| dr_dl_roll (v4 91–93) | t71–84 | **t72** `dr_dl_roll_t72_aca95618a0` | orange bridges on her hands, violet handstands over her back (vertical 3.75–4.17), two clean bodies; clip 1.29–4.65 only (orange tabs on violet from ~4.7, hair swap ~5.2). Alt: t84 (straddle roll, same recolour) |
| dr_dl_kick (v4 97.1–98.3) | t71–80 | **t72** `dr_dl_kick_t72_9f2e8dd66e` | front kick met by a lifted knee + downward forearm (1.67), step-in punch blocked by a forearm (3.42), freeze 3.67; clean throughout |

- **Takes:** `review/takes/dr_dl_{roll,kick}_t71…t84_*.mp4` (24 files, all models, kept as the record) + `review/takes/specs/`. Box: copy the two
  picks into `media/gen/` and their specs into `media/gen/specs/`. The first frame is the existing `media/plates/drop/dr_dl_roll.png`
  (`review/takes/stills/dr_dl_roll.png`). Intake ONLY `dr_dl_roll_t72_aca95618a0` and `dr_dl_kick_t72_9f2e8dd66e`, one at a time. The other
  22 are bake-off evidence. The Veo takes are 1920×1080 and the Hailuo takes 1376×768. `dr_dl_kick` is a new shot in `tools/sd/shots_wushu.py`
  (audio window B(96) = 165.34).
- **EDL** (drop block only; `out_main` / `v1_light_hands` untouched):
  - **default `DROP = 'v4'`**. The v5 group set, with the fall get-up, only plays behind `?drop=v5`.
  - **The roll in v4:** 91.1–93.1 = `keyed()` t72 [[92.5, 3.9], [93, 4.65]]: real speed into the handstand peak on 92.3, ×0.86 to the
    93.1 cut, on violet's legs swinging down to land (a cut on action into dr_duilian_mid's group burst).
    - `ROLL_KEY[take]` holds the keys and the take's checked clean range. v4 shows a roll only for a take that has one (so t65 is never shown in v4).
    - The 0.22 flash on the peak plays in v4 too. `?roll=off` restores v4's dr_set 91–93.
  - **The kick in v4:** `?kick=on|off`. On 97.1–98.3 it replaces v4's mirrored palm-to-palm clash (dr_duilian t2 clip 1.7–4.3).
    - `keyed()` t72 [[97.25, 1.67]] at real speed: clip 1.24 (the chamber) → contact on 97.2 → the punch on 98.2 → the freeze.
    - Then dr_duilian t2 from 98.3 on v4's own clock (`v4at('dr_duilian', 1, 97)`: orange's run-up into the duck under the high kick).
- **Validation:** `node --check`, plus `tools/edl_check.mjs` over every combination of:
  - picks: cloud picks, a scratch picks.json with the t72 picks, one with t65 picked;
  - fake: none, `--fake=dr_dl_roll,dr_dl_kick`, `--fake=allnew`;
  - query: default, `drop=v4`, `drop=v5`, `roll=close|wide|off`, `kick=off`, `drop=v5&roll=wide`.
  - All 72 runs: 0 exceptions, 0 bad args, 0 gaps, 0 held clocks.
  - `--list` (t72 picks): 156.645–160.123 dr_dl_roll_t72 clip 1.29–4.65; 167.079–169.688 dr_dl_kick_t72 clip 1.23–3.84; dr_duilian t2 4.35 → 8.69.
- **Previews for Jade's phone:** `review/previews/wushu_bakeoff/` (index.json: 25 new entries, kind pick/candidate).
  - Every take raw at real speed with the song at its slot (0.3–0.6 MB each).
  - `v4_drop_roll_t72_kick_t72.mp4` (1.7 MB): the new default drop as a raw rough cut. 93–95 is a black card, because dr_duilian_mid t1 is box-only.
  - Tool: `tools/preview_bakeoff.py`.
- **Box next:**
  1. Copy and intake the two picks (above).
  2. Run `picks.py`, then `node tools/edl_check.mjs` (expect held-clocks 0).
  3. Render 150–176 with the default, with `roll=off`, and with `kick=off`, plus `drop=v5` if Jade wants the A/B.
  4. Eyeball: the 91.1 cut (dr_set kicks → orange bending), the handstand on 92.3 (2:39.25), the 93.1 cut on the legs swinging down, and the
     kick's contact on 97.2 (2:47.5).
  5. Also check the background lumps in t72 (two background figures read as dark blobs from ~2.9 s).

## 2026-10-26 checkpoint 21 — Jade's violet-look decision
- Jade: "use violet's messy bun at 0:28. the 1:30 looks fine as is, so i'm reticent to risk messing it up."
- 0:28 `v1_split_front` → `v1_split_front_vl_t63_97c644fcfe` (violet's own face + messy bun, main's orange costume, camera locked, lag .2;
  `docs/picks_manual.json`). 1:30 stays `ch1_gone_close_34v_t61`. Main keeps the canon v4 face everywhere else (violet look not adopted
  globally; the `*_vl` tests for 1:11 / 3:50 / 4:11 stay experiments). Box: intake `v1_split_front_vl_t63`, then picks.py.

## 2026-10-26 checkpoint 22 — her REAL group set in the drop, two ways (`docs/wushu_real_routine.md`)
- Jade: the real routine for motion, but the 2004 footage has no identifiable faces; "polished off with a model the way … suno" polishes
  singing. Both approaches, together:
  - (A) `?drop=real`: the footage itself as the drop's plates, every performer a glyph figure in her lane.
  - (B) `dr_real_ref_<seg>`: Seedance 2.5 `reference_videos` (a data: URI; no public URL) repaints each segment as the Jades.
- Segment map, keys, lanes, `ME` and look: `engine/show/real_ws.js`.
  - Cuts: 89 burst (punch on the drop), 91 pairs (`?realpair=13|24|29`, peak 92.3), 93 halves → THE FALL (dive 96.4, impact 97.1, bar 97
    still), 98 rise, 99 final pose (100.1) + salute on the "ooh" (100.3), fold at 101 unchanged.
  - No roll over a partner's back is logged in the notes.
- Gated: plays the default drop until `work/plates/real_ws_<seg>/` exist (checked: identical `--list`).
- `edl_check --fake=real` and `--fake=realref`: 0 exceptions, 0 held clocks.
- New tools:
  - `tools/prep/lanes.py`: per-performer split and lanes;
  - `tools/prep/real_ws.mjs`: prints the run sheet;
  - `prep.py` runs on CPU (`--depth=`, `--matte=`, `--matte-size=`);
  - `batch.py` takes `ref_video` / `ref_mode`.
- CPU prep measured here: Small + BiRefNet@512 ≈ 9 s/frame, so ≈ 75 min for the five segments (defaults: 5.3 h). The cloud also needs
  `*.hf.co` for the weights.
- **Box next:**
  1. `node tools/prep/real_ws.mjs --src=… --refs`: cut, prep, lanes.
  2. Check the `_lanes.jpg` sheets and measure the keys into `real_ws.js`.
  3. `edl_check --q="drop=real"`, then stills and a 150–180 render.
  4. Ask Jade for `ME` (her spot in the final line).
  5. Then (B): start stills, `batch.py dr_real_ref_* --res=480p` (≈ $28 for 2 takes each).

## 2026-10-26 checkpoint 23: ?drop=sync, the compulsory long fist in unison — NEEDS INTAKE/RENDER (box)
Cloud session (from Jade's ideas, relayed by the parent session: "the entire group does standard long fist, in sync" and "maybe we do the
compulsory set?"). Everything is in `docs/wushu_sync_longfist.md`: the research, the move map, the takes and picks, the engine and validation,
and the open questions for Jade.

**The idea.** One clean solo Jade performs short phrases. The engine draws her six times in the real set's formations, recoloured per
lane, so unison is exact. There is no body contact.

**Spend.** This work cost $56.25 at list price. The ledger total is $585.84 of $1,000, which includes other sessions.

- **Routine:** the 2nd International Compulsory Changquan, moves 1–14, then the closing posture and salute (moves 15–28 skipped).
  Confidence ~60–65% that this is the set used in 2004. **Ask Jade whether she learned the 1st or the 2nd set.**
- **Stills** (`review/takes/stills/`):
  - `ws_solo.png`: canon face, high ponytail, orange lane, patch on her LEFT arm, about 45% of the frame height, horizon level. It is the
    first frame of every take.
  - `ws_bg.png`: the same frame, empty.
  - Also kept: `ws_solo_front.png` (the pick before the pull-back) and `ws_solo_34.png` (the 3/4 view, unused).
- **Takes:** `review/takes/ws_*` plus specs, 4 rounds, Seedance 2.5, with a Vidu Q3 Pro comparison on lotus and xuanfeng (Vidu lost: its
  camera moves, and the moves are missing).
- **Picks** (in `docs/picks_manual.json`; keys in `SYNC_KEY` in `main.js`):

| shot | pick |
|---|---|
| ws_open | t51 `ws_open_t51_edd396ea5b` |
| ws_lotus | t68 `ws_lotus_t68_26b3c2dd8d` |
| ws_kicks | t51 `ws_kicks_t51_c42416635a` |
| ws_feijiao | t61 `ws_feijiao_t61_a5d7a031d8` |
| ws_xuanfeng | t51 `ws_xuanfeng_t51_f613321301` |
| ws_close | t53 `ws_close_t53_a2e5719f59` |
| ws_bg | t61 `ws_bg_t61_b590c5c067` |

  Every jump in every take floats (0.8–1.35 s of air). The keys speed up the airborne stretch ×1.7–1.8.
- **EDL** (`engine/show/main.js`, drop block):
  - The **sync drop is the DEFAULT once all seven `ws_*` takes are picked.** Until then the default stays v4. `?drop=v4 | v5 | real` keep the
    other drops.
  - **Formations:**

    | bars | formation | timing |
    |---|---|---|
    | 89–90 | staggered rows | unison |
    | 91–92 | one line | unison |
    | 93–96.3 | the wedge, point empty | a 1/8-beat ripple from 93.25 |
    | 96.3–98 | the ring | the splits land on 97.1, unison; a 1/4-beat ripple on the rise |
    | 99–100 | the fold's V | main (orange, untinted) steps into the point on 100.1; the salute on the "ooh"; the fold match-cuts on 101 |

  - **Lattice:** `bg` (the empty set as the world) and a time-varying copy `dt`. `dt` copies follow a keyed clip.
  - **edl_check** counts both.
  - **Validation:** 18 runs, 0 exceptions / 0 held clocks / 0 gaps (§5 of the doc).
- **Previews** (`review/previews/wushu_sync/`, 7 index entries): the six picks raw with the song, and `sync_drop_formation_MOCK.mp4`, a
  labelled ffmpeg/cv2 composite of the formations, not the glyph render.
- **Box next:**
  1. Copy the seven picked takes (`review/takes/<take>.mp4` → `media/gen/`, specs → `media/gen/specs/`) and intake them one at a time. The
     other ws_* takes are the record; don't intake them.
  2. Run `picks.py`, then `node tools/edl_check.mjs` (expect 0 held clocks).
  3. Render 150–176: the default (now sync), and `?drop=v4` for the A/B.
  4. Eyeball:
     - the lane colours over the orange bands (`laneAmt` .32);
     - the copies' feet on the water line in each formation;
     - the ring overlap during the splits (97);
     - main stepping in on 100.1;
     - the match cut into the fold at 101.

## 2026-10-26 checkpoint 24: Jade's sync-drop review — the "wheely arm" and the front-back splits fixed — NEEDS INTAKE/RENDER (box)
- **Jade (review page):** "this is the one. but: the technique on the wheely arm is incorrect" and "I landed in front-back splits, not side".
  Her decisions: compulsory set = **2nd**; her final-line position = **3** (`engine/show/real_ws.js` `ME = 3` for `?drop=real`).
- **Diagnosis** (`docs/wushu_sync_longfist.md` §7):
  - **ws_xuanfeng t51:** a scissor knee jump facing the camera, arms flailing, landing in a straddle split.
  - **ws_open t51:** its 抡臂 was a jumping-jack fling, not vertical wheels.
- **Technique, from text sources** (cited in §7):
  - 抡臂: straight arms in vertical circles beside the body, past the ear and the hip, in opposite phase.
  - 旋风脚: off the right foot, turning left; the arms sweep down, then up to the left; the left palm meets the right sole.
  - 竖叉: front-back splits, left leg forward.
  - 砸拳: the right arm wheels back, up and over; the back of the fist hits the left palm with the stamp.
- **Re-takes:** rounds 5 (t71–74) and 6 (t81–84) of `ws_open` and `ws_xuanfeng`, with the body path spelled out. The open's arms turned
  side-on in round 6.
- **New picks** (in `docs/picks_manual.json`; `SYNC_KEY` in `main.js`):
  - `ws_open_t84_e475eb61aa`, keys [[90, 3.83], [90.75, 5.21]]: side-on vertical wheels.
  - `ws_xuanfeng_t72_fc342602d4`, keys [[96.62, 2.18], [97, 3.35], [98.5, 6]]: an upright left turn, front-back splits landing on 97.1.
  - The other picks are unchanged: lotus t68, kicks t51, feijiao t61, close t53, bg t61.
  - Still missing: the palm slap in the pubu, the slap on the sole, and the take-off foot.
- **Validation:** 15 edl_check runs, 0 exceptions / 0 held clocks / 0 gaps (cloud picks, the new real picks, --fake ws_*, --fake=real).
- **Previews:** `review/previews/wushu_sync/ws_open_t84_*.mp4`, `ws_xuanfeng_t72_*.mp4`, and a refreshed formation MOCK. The superseded
  t51 entries are marked in the index.
- **Spend:** $24.05 for the re-takes; $80.30 for the sync drop in all; the ledger is at $609.89 / $1,000.
- **Box:** as in checkpoint 23, but intake `ws_open_t84_e475eb61aa` and `ws_xuanfeng_t72_fc342602d4` instead of the two t51 takes.

## 2026-10-28 checkpoint 25 — handoff
- `docs/CLOUD_HANDOFF.md` START HERE rewritten as one current summary: the box's consolidated v5b list (intake the 24 cloud picks +
  intro_up t51, bd_float t52, v2_horizon t51, lf_wushu_gold t53, dr_dl_wide t58, dr_dl_close t57; picks.py; edl_check; mix; render + A/B
  clips), Jade's decisions since v4, open items, and how the cloud actually works now. Jade's review page + its db collections are listed there.
- Spend $609.89 / $1,000. Nothing rendered since v5a.

## 2026-10-28 checkpoint 26 — v6 rebuild starts: "written in text" (branch `claude/v6-text`, cloud session)
- Jade's new direction (Google Doc "Merge: new treatment and shot list (v6)") is in **`docs/treatment_v6.md`**: the film is characters on
  black in the branch palette, density tells the story, glyph refresh carries emotion, and the one raw image is her real phone footage at the
  switch (236.64). Her performance comes from footage she films (shot IDs A1-A6, B1-B9, C1-C9, H1-H2); crowds are one take copied by the engine.
- `.gitignore`: `*.mov`, `*.MOV`, `*.m4v`, `*.M4V`, `/footage/` (her phone footage is never committed, not even under review/).
- **Headless render in the cloud works now.** `engine/render.mjs` falls back to the pre-installed Chromium + SwiftShader and the system ffmpeg
  when the box's Chrome/ffmpeg aren't there (`CHROME=`, `FFMPEG=`, `SOFTGL=1` override). `engine/src/main.js` skips a shot whose setup fails
  (a plate that lives only on the box) with one log line instead of hanging, so graphics-only shots render anywhere. Measured here (4 vCPU):
  ~4.3 fps per worker at 720p for the v6 show, ~12 fps with `--workers 3` (the whole film ≈ 12 min). The v5 show (`main.js`) also renders its
  graphics shots (drone tree, cards) here; its plate shots come out black.
- v6 engine (code map in the treatment): `engine/src/textlook.js` (palette + charset by construction, TextGrid cells, TextPass glyph shader,
  raw cells for the switch), scene kind `text`, `engine/src/v6/{layers,seq,frost,gitlog,fx}.js`, show `engine/show/v6.js` (whole song, every
  footage slot labelled by shot ID), `engine/show/v6_slots.json`, `engine/show/life_v6.js`.
- Footage intake: `tools/footage/sync.py` (per-band onset-envelope cross-correlation + GCC-PHAT refine; tested on synthetic room-mic clips
  with a clap and a "voice": 4/4 offsets exact to 0.1 ms, an 8 s drop clip included; a silent clip is flagged), `tools/footage/prep.py`
  (24 fps frames, H1/H2 at 1920 px best quality, HDR tone-map when ffmpeg has zscale, pick per shot ID), `tools/footage/standins.py`.
