# v5 run sheet for the box (2026-10-25)

For the Remote Control / box session that turns the cloud integration (branch `claude/wonderful-mccarthy-f90kll`) into the v5 film. The cloud
generated nothing, rendered nothing and spent nothing. The committed ledger shows **$284.32 of the $600 cap** (`python3 tools/gen/spend.py`;
CLOUD_HANDOFF says ≈ $300 on the box). The full queue below is **≈ $70.5**.

Ground rules (HANDOFF.md, CLOUD_HANDOFF.md):
- **One** `tools/sd/intake.py` at a time.
- Commit and push `docs/spend_ledger.jsonl` after every generation run.
- Never commit frames or media, and nothing showing her kids.
- Image calls: at most 3 in parallel, and 1 at a time for edits. Pin lane colours in every edit.
- Jade's competition video is **analysis only**: never send it or its frames to a model, never commit them. They show her teammates.

## 1. What changed, and where

| Jade's note (v4 review) | what the cloud did | where | A/B |
|---|---|---|---|
| 1:07 still, glitchy, old face | Every forktree use of `intro_up` now plays its take. v4 passed s0 = 0, so all four uses (1:07, 1:15, 2:57, 4:17) showed its last frame. 1:07 now starts at clip 2.5 s (breath, blink, smile) with a slow push-in. The new face needs the `intro_up` re-take (queue 7). | `engine/show/main.js` (pre-chorus, chorus 1, drop forktrees) | |
| 1:46 old likeness; LED grid on figures | Pane figures (pre-chorus grid, breakdown panes and back plate, build panes) are glyph-built like the lattice scene (decision 9 had missed panels). The faces need re-takes: `bd_float` (queue 8); the `lf_*` panes are not queued. | `engine/src/scenes/panels.js` | `?figlook=led` |
| 1:58, 3:33 "huge, alien eyes" | The Seedance guard no longer asks for "large very dark brown eyes" (it enlarged every redrawn eye). The new `EYES` wording keeps the still's eyes. Re-takes: `bd_ahh` with eyes closed throughout and no push-in; `ch2_catch` with eyes closed and calm. | `tools/sd/batch.py` `EYES`/`GUARD`, `tools/sd/shots_v5.py` | |
| 0:32, 0:44, 1:11, 3:54 lip-sync | Lags were re-measured from the raw takes and the vocal stem: 0.62, −0.15, 0.40, 0.30 (interim). **They take effect only after you run `picks.py`.** | `docs/lags.json` (commit 4576711) | |
| 3:30 ends too smiley | **Interim**, while `ch2_catch_t11` is picked: the shot ends on the onset of "main" (212.09, eyes still closed; they open at 212.2 in the take), and the hook carries on unchanged over the drone tree. Picking the 8 s re-take restores the full shot automatically. | `main.js` `CATCH_CUT` | |
| 3:54, 4:12 too smiley | 4:12 **interim**, while `out_main_t12` is picked: the shot ends at 252.25, before the grin. Re-takes are queued for 3:54, 4:12 and 1:11. | `main.js` `OUT_MAIN_END`; `shots_v5.py` | |
| 3:07/3:09 violet band across the jacket back | Image edit prompt (remove the band; patch on the left sleeve only), then re-animate. | `shots_v5.py` STILLS `v2_horizon_v5`; `tools/plates/fix_patch.py --prompt=` | |
| 4:17 boring | The living graph replaces the git-log card and the bookend. Lives fork out of main in doublings as live panes, the log is read one commit per beat, everything merges home on the riser, and violet is cherry-picked last. It starts where the home shot ends; the end card keeps its bar-153 hit. No new takes. | `main.js` (4:15–4:24); `panels.js` `clip(t)` | |
| post-credits: no touching, play once | The **violet branch** (`v2_horizon_t5`, Jade's pick) sends a drawn light toward the horizon. Cut to the intro's window: `ch0_window_t2` clip 0–4.57, slowed to fill the shot (no frozen frame, no replayed palm lift). The light touches the glass once at song end + 6.4 s, and the bifurcation grows from there, one fork per chime group. `mix.py` drops the lone chime, so the 1-2-4-8 cascade starts on the touch. No new takes; `pc_kneel`/`pc_beam` are unused. | `main.js` post-credits, `FX.frost`/`FX.mote`; `scenes/lattice.js` `clip(u,t)`; `tools/mix.py` `PC_TOUCH` | |
| orchestra: playing should match the music; conductor boring | Seven cuts on the music (impact 137, violin 138, keys 139, composer 140, guitar 141, wide, composer). The **composer is the violet branch** (Jade's pick): bun with two pencils, violet bands, writing each part in violet light (`FX.score`), which lands on its player on the beat and finally folds into one orange line. Lyric captions are unchanged. Each cut uses a reframed v4 take until its new take is picked. | `main.js` ORCH v5; `tools/sd/shots_outro.py` `orch_*` + STILLS | `?orch=v4` |
| wushu: duilian first, then a medal-grade group set | v5.1, rebuilt from her real routine (box analysis: `docs/wushu_v5_design.md` §9, `docs/wushu_groupset_notes.md`; final map §10). Duilian 89–92 (three pairs). Group set 93–100 by six branch copies in one line, warm and cool alternating: unison burst on 93; jian solo on 95; **the group fall** lands flat on 97.1, bar 97 held still, rise as one on 98.1; the halves trade a phrase (98.3), then cross pairs (99.3); arms-out horse stance on 100.1; main steps into the V's point for the salute on the "ooh". Match cut into the fold at 101. Key frames are pinned to bars (`KEY`, `keyed()`). **Default = the v4 drop until all six new shots are picked.** | `main.js` drop block; `tools/sd/shots_wushu.py` (SHOTS + STILLS); `stills.py` `patch` tool | `?drop=v4` / `?drop=v5` |

Already on the branch before this pass: the poem shown whole from frame 0, the title MERGE alone, the home commit message, the `fold=reach`
and `pv=screens` defaults, re-measured lags, and the 2:17 build stanza as annotated moves.

**Tools.**
- `batch.py`: shots files may define `RETAKES` (same key, new spec) and `face=` (use another shot's face_v4 still).
- `tools/sd/stills.py`: writes each STILLS prompt file and prints its command.
- `fix_patch.py`: new `--prompt=FILE`.
- `mix.py`: falls back to the ffmpeg on PATH.

**Engine.** Both the lattice scene and panes have a `clip` time remap (slow motion with no held frames).

## 2. Generation queue (in this order; ≈ cost at list prices)

Use `--t0=13` for every v5 take: the box is at t12, so tags never collide. The cloud dry-ran all of these specs in a scratch copy with the
network blocked (`batch.py --dry`, 20 shots × 2 takes = 40 specs, schema OK). The six wushu specs were dry-run again after the v5.1 rework
(12 specs, schema OK, $16.65).
Every prompt is under Seedance's 2000-character limit; the orchestra report's `orch_wide` was over it and is now trimmed.

| # | step | shot tag(s) | first frame | takes | est. |
|---|---|---|---|---|---|
| 1 | 3:30 singing re-take (Jade's note b, first) | `ch2_catch` (8 s) + `ch2_catch_b` (slow eye-close variant) | `face_v4/ch2_catch.png` (both) | 2 + 1 | $5.55 |
| 2 | 3:54 re-take | `ch2_gone_close` (8 s) | `face_v4/ch2_gone_close.png` | 2 | $3.70 |
| 3 | 4:12 re-take | `out_main` (8 s) | `face_v4/out_main.png` | 2 | $3.70 |
| 4 | 1:11 re-take | `ch1_main` (7 s) | `face_v4/ch1_main.png` | 2 | $3.24 |
| 5 | 1:58 eyes | `bd_ahh` (7 s, eyes closed, no push-in) | `face_v4/bd_ahh.png` | 2 | $3.24 |
| 6 | 3:09 jacket back | edit `v2_horizon_v5` (1 nano-banana call), then `v2_horizon` (8 s) | `fix/v2_horizon.jpg` (edited) | 1 + 2 | $3.83 |
| 7 | 1:07 canon face | `canonprop` `intro_up` (3 candidates), then `intro_up` (8 s) | `face_v4/intro_up.png` (new) | 3 + 2 | $4.40 |
| 8 | 1:46 canon face | `canonprop` `bd_float` (3 candidates), then `bd_float` (10 s) | `face_v4/bd_float.png` (new) | 3 + 2 | $5.32 |
| 9 | orchestra stills | `orch_wide`, `orch_line`, `orch_keys`, `orch_pencil`, `orch_guitar` (GPT Image 2.5) | STILLS in `shots_outro.py` | 5 × 2 | $2.33 |
| 10 | orchestra takes | `orch_wide` 13 s, `orch_line` 5 s, `orch_keys` 5 s, `orch_pencil` 8 s, `orch_guitar` 5 s | `media/plates/outro/orch_*.png` | 2 each | $16.64 |
| 11 | wushu v5.1 (see 2.1) | plates `dr_dl_close`, `dr_gs_line6`, `dr_gs_v6` (GPT Image 2.5), then the patch fix (nano-banana-pro); takes `dr_dl_wide` 6 s, `dr_dl_close` 6 s, `dr_gs_ranks` 6 s, `dr_gs_tornado` 7 s (the fall), `dr_gs_ring` 6 s (halves + pairs), `dr_gs_salute` 5 s | `media/plates/drop/` (`dr_dl_wide`: the existing `dr_duilian.png`) | 3 × 2 + 3; 2 each | $18.51 |
| | **total** | | | | **≈ $70.5** (≈ $52 without wushu); spend after ≈ $355 of $600 |

Unit costs: Seedance 2.5 720p $0.2312/s (6 s $1.39, 8 s $1.85, 13 s $3.01). GPT Image 2.5 ≈ $0.23 per candidate. nano-banana-pro ≈ $0.13.

### 2.1 Wushu queue (step 11), in order: plates → pick → patch fix → takes (≈ $18.51)
The box analysed her real set (analysis only; never send the video or its frames to a model, never commit them): `docs/wushu_groupset_notes.md`,
`docs/wushu_v5_design.md` §9. The v5.1 rework (§10) is in `tools/sd/shots_wushu.py`: the bar map in its docstring, SHOTS, and STILLS for the
three plates and their patch fixes. Lanes and hair are pinned in every prompt.

1. **Plates**: GPT Image 2.5, 2 candidates each, ≈ $0.24 per candidate with 4–5 refs, **$1.46**. Each command makes 2 calls in parallel,
   so run them one after another (at most 3 image calls in parallel).
   ```bash
   python3 tools/sd/stills.py dr_dl_close dr_gs_line6 dr_gs_v6     # writes media/plates/v5_prompts/<id>.txt and prints these commands
   $PY tools/plates/gpt_plate.py media/plates/drop/dr_dl_close media/plates/v5_prompts/dr_dl_close.txt --refs=media/plates/drop/dr_duilian.png,media/style/canon_v4/canon_face.png,media/style/r7/turn_gpt_patch.png,media/style/r7/patch_34.png --n=2
   $PY tools/plates/gpt_plate.py media/plates/drop/dr_gs_line6 media/plates/v5_prompts/dr_gs_line6.txt --refs=media/plates/drop/dr_set.png,media/style/canon_v4/canon_face.png,media/style/r7/turn_gpt_patch.png,media/style/r7/patch_34.png --n=2
   $PY tools/plates/gpt_plate.py media/plates/drop/dr_gs_v6 media/plates/v5_prompts/dr_gs_v6.txt --refs=media/plates/drop/dr_set.png,media/plates/face_v4/ch1_formation.png,media/style/canon_v4/canon_face.png,media/style/r7/turn_gpt_patch.png,media/style/r7/patch_34.png --n=2
   ```
2. **Pick** one candidate per plate. Pick before the patch fix, so only the chosen plate is edited. Check each one for:
   - the copy count: `dr_dl_close` 6 (the front pair plus two small pairs); `dr_gs_line6` 6, with no orange; `dr_gs_v6` 6 in the V, plus
     orange just behind the empty point;
   - the lane order left to right: white, mint, rose, (orange), sky, gold, violet;
   - hair per lane, as in the docstring;
   - orange's canon face (`docs/canon_face_v4.md` checks);
   - heads and feet clear of the 16:9 crop (80 px off the top and the bottom);
   - `dr_gs_v6` framed like `face_v4/ch1_formation.png`, with the sun behind the point (the match cut at 101).
   ```bash
   python3 tools/sd/stills.py dr_dl_close --pick=a       # a or b -> media/plates/drop/dr_dl_close.png (1536x864); same for the other two
   python3 tools/sd/stills.py dr_gs_line6 --pick=a
   python3 tools/sd/stills.py dr_gs_v6 --pick=a
   ```
3. **Patch fix**: nano-banana-pro, one call at a time, every lane colour pinned in the prompt, 3 × $0.134 = **$0.40**.
   ```bash
   python3 tools/sd/stills.py dr_dl_close_patch dr_gs_line6_patch dr_gs_v6_patch
   ```
   For each plate it prints: keep the pick (`<id>_nopatch.png`), `fix_patch.py drop/<id> --prompt=...`, check `media/plates/fix/<id>.jpg`,
   save it back over `media/plates/drop/<id>.png` as a real PNG, and `rm` the cached first frame.
4. **Takes**: Seedance 720p, 2 each, 6 + 6 + 6 + 7 + 6 + 5 = 36 s per set, **$16.65**. Dry-run only once the plates are final: a cached first
   frame in `media/gen/refs/` wins over a newer plate. `dr_dl_wide` starts from the existing `dr_duilian.png`, the same first frame as
   dr_duilian_t1/t2.
   ```bash
   $PY tools/sd/batch.py dr_dl_wide dr_dl_close dr_gs_ranks dr_gs_tornado dr_gs_ring dr_gs_salute --takes=2 --t0=13 --dry
   $PY tools/sd/batch.py dr_dl_wide dr_dl_close dr_gs_ranks dr_gs_tornado dr_gs_ring dr_gs_salute --takes=2 --t0=13
   git add docs/spend_ledger.jsonl && git commit -m "ledger: wushu v5.1 plates and takes" && git push
   $PY tools/gen/gen.py wait mergemain/...          # the job ids batch.py printed
   ```
5. **Intake, picks, key frames.** Run one intake at a time.
   - Pick for: six bodies (seven once orange steps in) in every frame, the unison frames, the fall flat and still, the rise together, and
     the right fist into the left palm.
   - Write the picks to `docs/picks_manual.json`, then run `picks.py`. Once all six are picked, the drop switches to v5 by itself.
   - Read the key frames off each strip and put them into `KEY` in the drop block of `main.js`. Keep each within ±0.15 s of the plan:

     | take | key frame | planned clip time | lands on |
     |---|---|---|---|
     | `dr_gs_ranks` | the burst into bow stance | 1.739 | 93.1 |
     | `dr_gs_tornado` | the six hit the water | 3.478 | 97.1 |
     | `dr_gs_tornado` | the first push-up of the rise | 5.218 | 98.1 |
     | `dr_gs_salute` | the horse stance | 1.739 | 100.1 |
     | `dr_gs_salute` | fist meets palm | 2.609 | 100.3, the "ooh" |

     Between two keys, `keyed()` stretches or squeezes the clip so that bar 97 is all stillness and the salute lands on the "ooh". Keep each
     stretch within 0.6–1.5×.
   - Re-place each new cut's sun x,y on the picked stills; the values in the block are placeholders. Keep `dr_gs_salute` near the fold's
     [960, 430].
   - Render 150–182 s with `drop=v5`.
   - If a take fails, use the fallbacks in `docs/wushu_v5_design.md` §5 and §9.
6. Nit, not queued: the life-montage plate `lf_wushu_gold` shows a **sword group set with teammates**, which contradicts decision 4 (the
   group set is barehand; jian was her solo). Re-caption that branch as her jian solo, or regenerate it without teammates.

## 3. Commands

```bash
cd ~/Documents/merge-me-back-to-main && git pull          # this branch (or main once Jade merges it)
PY=/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python
OSPY=/home/jade/Documents/1-music-shipped/orbital-sunrise-video/video/out/.venv/bin/python
export FFMPEG=/home/jade/Documents/1-music-shipped/moongazing/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2
python3 tools/gen/spend.py                                # pull first: the cap counts the committed ledger
.venv/bin/python tools/sd/picks.py > /dev/null           # applies the re-measured lags.json before any review render
python3 tools/sd/stills.py                                # lists the v5 stills
```

**Stills and edits.** `stills.py ID` writes `media/plates/v5_prompts/ID.txt` and prints the exact command; nothing is generated until you
run that command.
```bash
python3 tools/sd/stills.py v2_horizon_v5     # cp the old still aside; fix_patch.py v2_horizon_v5src --prompt=...; check; cp back; rm the cached ref
python3 tools/sd/stills.py intro_up bd_float # canonprop --mode=rect: set --box=X0,Y0,H (3:2 head + all hair) on the still; --rot180 if upside down
python3 tools/sd/stills.py orch_wide orch_line orch_keys orch_pencil orch_guitar   # gpt_plate.py ... --n=2 (max 3 parallel image calls)
python3 tools/sd/stills.py orch_wide --pick=a   # crops the chosen candidate to 16:9 as media/plates/outro/orch_wide.png (repeat per still)
```
Check each canon-face still: `tools/plates/eyemetrics.py --check --size-ref=canon` and `facecrop.py --eyes` next to
`media/style/canon_v4/canon_eyes_crop.jpg`. Show Jade whole faces and crops from the same file. A cached first frame wins over a new still:
`stills.py` prints the `rm media/gen/refs/...` for each one.

**Takes** (dry-run first; submit; then commit and push the ledger):
```bash
$PY tools/sd/batch.py ch2_catch ch2_gone_close out_main ch1_main bd_ahh --takes=2 --t0=13 --dry
$PY tools/sd/batch.py ch2_catch ch2_gone_close out_main ch1_main bd_ahh --takes=2 --t0=13
$PY tools/sd/batch.py ch2_catch_b --takes=1 --t0=13
git add docs/spend_ledger.jsonl && git commit -m "ledger: v5 singing re-takes" && git push
$PY tools/sd/batch.py v2_horizon intro_up bd_float --takes=2 --t0=13            # after their stills are in place
$PY tools/sd/batch.py orch_wide orch_line orch_keys orch_pencil orch_guitar --takes=2 --t0=13
$PY tools/gen/gen.py wait mergemain/...          # the job ids batch.py printed (or: gen.py status)
```

**Intake** (one at a time), **picks, lags**:
```bash
.venv/bin/python tools/sd/intake.py              # -> work/plates/<take>/, work/takes/<take>_{strip,ws}.jpg, .sync.json, .labial.json
```
- Lip lag: read the mouth word strips (`work/takes/<take>_ws.jpg`, candidate lags −0.25…0.4). Look for closed lips on m/b/p, open on "I/ah",
  rounded on "o". Weigh them against `.sync.json` (`best_lag_s`, `corr`). Don't trust the envelope correlation alone: it locks onto phrase
  structure when a take drops a held note (that is how v4 got 1.208 and 1.958). Write `docs/lags.json` `{take: lag}` and flag each value for
  Jade's ear.
- Picks: `docs/picks_manual.json`. Pick `ch2_catch` from either `ch2_catch_t13/t14` or `ch2_catch_b_t13` (map `"ch2_catch"` to the chosen
  take). Then `.venv/bin/python tools/sd/picks.py`.
- Picking a re-take switches its interim trim off: 3:30 gets its full shot back, and the 4:12 home shot runs to 254.51, with the living graph
  starting there.
- Orchestra: each cut switches from its stand-in to the new take as soon as that take is picked. Then tune the `WIDE`/`CLOSE`/`to`/`tip`
  positions in the ORCH v5 block on stills at each cut's midpoint (below). If a big gesture lands off the beat, shift that cut's s0 by
  whole beats.
- Post-credits: fit `FR` (the glass region; the stem starts at the touch point) and the two `FX.mote` paths on stills at P0 + 2, 4, 5, 6.4, 8,
  9.6, 11, 13 (P0 = 282.516).

**Mix and renders** (720p review parts ≤ 75 s each go to `review/v5/` with a README line; GitHub's limit is 100 MB per file):
```bash
.venv/bin/python tools/mix.py out/mix_v5.wav                      # post-credits: 1-2-4-8 from song end + 6.4 s, no lone chime
R='node engine/render.mjs --q show=/engine/show/main.js --res 1280x720 --audio --audiofile out/mix_v5.wav --workers 3'
$R --from 62 --to 80 --mp4 out/review/v5/107_origin.mp4           # 1:07 + 1:15 forktrees (intro_up plays), pre-chorus grid panes
$R --from 99 --to 119 --mp4 out/review/v5/146_breakdown.mp4      # glyph pane figures, bd_float back, bd_ahh
$R --from 206 --to 216 --mp4 out/review/v5/330_catch.mp4         # 3:30 cut + hook over the tree
$R --from 226 --to 266 --mp4 out/review/v5/354_outro.mp4         # 3:54, orchestra, home 4:12, living graph, end-card hit
$R --from 280 --to 297.016 --mp4 out/review/v5/postcredits.mp4   # violet sender, window, frost, chimes
node engine/render.mjs --q "show=/engine/show/main.js&orch=v4" --res 1280x720 --audio --audiofile out/mix_v5.wav --from 234 --to 252 --mp4 out/review/v5/orch_v4.mp4
node engine/render.mjs --q "show=/engine/show/main.js&drop=v5" --res 1280x720 --audio --audiofile out/mix_v5.wav --from 150 --to 182 --mp4 out/review/v5/drop_v5.mp4   # once picked
node engine/render.mjs --q show=/engine/show/main.js --stills 237.5:out/test/o1.png,239.3:out/test/o2.png,241:out/test/o3.png,242.7:out/test/o4.png,244.5:out/test/o5.png,246.9:out/test/o6.png,248.9:out/test/o7.png --res 1920x1080
node engine/render.mjs --q show=/engine/show/main.js --stills 253:out/test/g1.png,256.6:out/test/g2.png,258.6:out/test/g3.png,260.2:out/test/g4.png,262:out/test/g5.png,263.6:out/test/g6.png --res 1920x1080
# full film (≈ 13 min at 3 workers), then split into ≤ 75 s parts for review/v5/ as in review/v4/README.md
node engine/render.mjs --q show=/engine/show/main.js --from 0 --to 297.016 --res 1280x720 --audio --audiofile out/mix_v5.wav --workers 3 --mp4 out/review/v5/merge_v5_720.mp4
```
Then rebuild `out/final/watch.html` (`.venv/bin/python tools/watch_page.py`), commit `review/v5/` (code and review clips only; nothing showing
the kids), push, and add a "needs Jade" line in `docs/RESUME.md`.

## 4. What Jade should check
- **1:07**: the origin Jade breathes, blinks, smiles, with a slow push-in. The face stays old until the `intro_up` re-take is picked.
- **Pane figures as glyphs** (0:54–1:05 grid, 1:40–1:52 breakdown, 2:05–2:33 build): are faces readable at pane size? Per pane `cellFig`
  (smaller = finer) is the lever; `?figlook=led` gives the old look for A/B.
- **3:30**: with the old take, the cut lands on "main", eyes closed, and the hook continues over the tree. With the re-take, the whole line.
- **4:12 → 4:24**: the home shot ends before the grin. Then the living graph: are the 14 lives readable? The log reads one commit per beat,
  violet merges last. `lf_home_mint` (kids from behind) is one pane, as in every life grid.
- **Post-credits**: the violet branch sends; the window girl in slow motion; the light's path and touch point; the shape growing from the
  touch; one chime cascade.
- **Orchestra**: the timing and cuts (stand-ins now); the violet composer once the takes are picked; the score's legibility; `?orch=v4` for A/B.
- **Drop (2:33–3:00)**, once all six wushu takes are picked (`?drop=v4` for A/B). Check:
  - the duilian pairs;
  - the group fall: they land on 97, the still bar, then rise together on 98.1;
  - the halves trading, then the cross pairs;
  - main stepping into the point for the salute on the "ooh", and the match cut into the fold.
  
  Hair: the duilian keeps the v4 plate's hair, so the cut from `dr_duilian` stays continuous (violet has one high bun). The group set uses
  the lane mix (violet has two space buns). Jade decides whether to unify the two.
- **Lip-sync by ear** (after `picks.py`):
  - 0:32 (lag .62)
  - 0:44 (−.15; the take's first frame holds 0.7 s of silence before "Each")
  - 1:11 (.40)
  - 3:54 (.30, interim)
  - every new re-take
- **Held frames not in her notes** (pre-existing; the engine's new `clip` remap could fix any of them, so it's her call):
  - pane last frames: the grid 4–6 s, the breakdown 3.5–8.5 s, the build 17–22 s (dimmed behind the graph)
  - the bd_float back plate 1.8 s at 1:50
  - 3:01 v2_dish_close: first frame held 0.9 s
  - 3:48 fold: last frame held 0.6 s
  - 1:11 ch1_main 0.4 s and 3:54 0.2 s (both go away with their re-takes)
- Not yet in Jade's notes: the forktree copies are still LED sprites (`engine/src/scenes/forktree.js` copy shader). At 1:07 the single figure
  now plays, but it is drawn as LED cells, not glyphs.

## 5. A/B parameters (`--q "show=/engine/show/main.js&..."`)
- `orch=v4`: the conductor orchestra.
- `drop=v4` / `drop=v5`: forces the drop. The default is v5 only when all six new shots are picked; forced v5 shows the v4 take that covered
  each bar until it is.
- `fold=palms` (default reach).
- `pv=flash` | `pv=off` (default screens).
- `figlook=led`: LED figures in lattice shots and panes.
- `timing=v1`: the frozen v1 film.
