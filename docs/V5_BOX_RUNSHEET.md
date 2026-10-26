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
| post-credits: no touching, play once | (v5a; the sender is now `v2_release`, §1.3) The **violet branch** (`v2_horizon_t5`, Jade's pick) sends a drawn light toward the horizon. Cut to the intro's window: `ch0_window_t2` clip 0–4.57, slowed to fill the shot (no frozen frame, no replayed palm lift). The light touches the glass once at song end + 6.4 s, and the bifurcation grows from there, one fork per chime group. `mix.py` drops the lone chime, so the 1-2-4-8 cascade starts on the touch. No new takes; `pc_kneel`/`pc_beam` are unused. | `main.js` post-credits, `FX.frost`/`FX.mote`; `scenes/lattice.js` `clip(u,t)`; `tools/mix.py` `PC_TOUCH` | |
| orchestra: playing should match the music; conductor boring | Seven cuts on the music (impact 137, violin 138, keys 139, composer 140, guitar 141, wide, composer). The **composer is the violet branch** (Jade's pick): bun with two pencils, violet bands, writing each part in violet light (`FX.score`), which lands on its player on the beat and finally folds into one orange line. Lyric captions are unchanged. Each cut uses a reframed v4 take until its new take is picked. | `main.js` ORCH v5; `tools/sd/shots_outro.py` `orch_*` + STILLS | `?orch=v4` |
| held frames (Jade's OK, 2026-10-25: fix every take that runs out before its shot ends; never loop or ping-pong) + fork-tree dots | 50 held plate clocks in 12 places (0:30–3:56, 0.1–22 s each), all fixed: non-sung takes and panes slow just enough (`fit`), lip-synced takes are only trimmed (their cut moves to the take's first/last frame, the neighbour fills in). Fork-tree copies are glyph-built. Details and what to eyeball: §1.1. | `engine/src/clip.js`, `plateseq.js` `at(t, s0, fit)`, `main.js`, `scenes/forktree.js`; `tools/edl_check.mjs`; `picks.py` writes `len` | `?figlook=led` (fork tree) |
| wushu: duilian first, then a medal-grade group set | v5.1, rebuilt from her real routine (box analysis: `docs/wushu_v5_design.md` §9, `docs/wushu_groupset_notes.md`; final map §10). Duilian 89–92 (three pairs). Group set 93–100 by six branch copies in one line, warm and cool alternating: unison burst on 93; jian solo on 95; **the group fall** lands flat on 97.1, bar 97 held still, rise as one on 98.1; the halves trade a phrase (98.3), then cross pairs (99.3); arms-out horse stance on 100.1; main steps into the V's point for the salute on the "ooh". Match cut into the fold at 101. Key frames are pinned to bars (`KEY`, `keyed()`). **Default = the v4 drop until all six new shots are picked.** | `main.js` drop block; `tools/sd/shots_wushu.py` (SHOTS + STILLS); `stills.py` `patch` tool | `?drop=v4` / `?drop=v5` |
| wushu v5.3: the partner roll (Jade 2026-10-26) | The duilian close (91–92) becomes a **back roll over the partner's back**: the sweep on 91.1, violet's lunge punch, orange ducks into a flat-backed table, violet rolls over it, **inverted peak on 92.3** (the bass's E → F#, the drop's strongest beat-3 onset), the landing, and the liangxiang freeze on the 93.1 cut. A wide canon version: three pairs roll back to front, the front pair on 92.3. Picks **`dr_dl_roll_t65`** (close, default) and **`dr_dl_ripple_t69`** (wide). The keys are measured (`KEY.dr_dl_roll`, `KEY.dr_dl_ripple`). It falls back to the v5.2 dr_dl_close until a roll take is picked. `docs/wushu_v5_design.md` §11. | `main.js` drop block (`ROLL`, `KEY`); `shots_wushu.py` v5.3; `tools/preview_drop.py` | `?roll=close` / `wide` / `off` |

Already on the branch before this pass: the poem shown whole from frame 0, the title MERGE alone, the home commit message, the `fold=reach`
and `pv=screens` defaults, re-measured lags, and the 2:17 build stanza as annotated moves.

**Tools.**
- `batch.py`: shots files may define `RETAKES` (same key, new spec) and `face=` (use another shot's face_v4 still).
- `tools/sd/stills.py`: writes each STILLS prompt file and prints its command.
- `fix_patch.py`: new `--prompt=FILE`.
- `mix.py`: falls back to the ffmpeg on PATH.

**Engine.** Both the lattice scene and panes have a `clip` time remap (slow motion with no held frames). Lattice shots, panes and a panels back
plate also take `fit` (src/clip.js): from `from` on, the clock slows just enough that the take's last frame lands on `to`, never faster than real
time, so a longer re-take plays at 1x by itself.

### 1.1 Frozen-frame + fork-tree fixes (cloud, 2026-10-25; nothing rendered)
`tools/edl_check.mjs` runs the EDL under node with the real timing and picks and compares every plate clock with its take's real length (box:
`work/plates/*/meta.json`; cloud: the mp4s in `review/cloud/takes`, the ledger's billed seconds). Before: 50 held clocks with the new lags (49
with v4's): 33 panes, 7 fork copies, 10 shots. After: 0, for the default, `figlook=led`, `drop=v4/v5`, `orch=v4`, `fold=palms` and
`pv=flash/off`, with the box's picks, with the new lags, and with every queued re-take faked as picked. Run it again after every `picks.py`
(expect `held-clocks 0`).

| time | held before | fix (take-aware: recomputed from the picked take's s0 and `len`) | eyeball |
|---|---|---|---|
| 0:30–0:33 | L1's 7 fork copies ran 0.9–6.3 s ahead of her: up to 2.5 s on the 6 s take's last frame | each copy runs a moment behind her (an echo of the line), inside what she has sung | copies at 0:29–0:33 |
| 0:41 | `v1_light_hands` (lag −0.15) starts 0.7 s after its cut: first frame held | cut moved to the take's frame 0 (42.13); L2 `v1_track_rose` runs on to it at 0.92x | the 0:42.1 cut, L2 speed |
| 0:54–1:05 | pre-chorus grid panes: last frame 4–6 s (after the head turn) | 1x to the turn (still together on `turn`), then ~0.23x through the fold | the slow head turn |
| 1:18 | the fork tree's copy clocks (+1.7, 3.4, 5.1 s) ran past `intro_up`'s 8 s (0.5 s) | the scene spaces its four clocks to fit the take (1.25–1.7 s apart) | 1:15–1:19 copies |
| 1:14.7 | `ch1_main_t11` (6 s) ended 0.3 s before its cut | cut on its last frame (interim: the 7 s re-take reaches the old cut) | the cut into the tree |
| 1:23 | fold: first frame held 0.2 s (clip started 0.2 s late) | from frame 0 on the cut, 0.97x | — |
| 1:40–1:52 | breakdown panes: last frame 3.7–8.5 s; `bd_float` back 1.8 s | panes start near their heads, ~0.68x; back ~0.84x | pane motion, back |
| 1:51.8 | `bd_ahh` (lag −0.375) first frame 0.17 s | cut at its frame 0 (111.945); the breakdown runs on | — |
| 2:05–2:31 | build panes: last frame 17–22 s | each take spans its pane's life (0.25–0.47x) | the 16-pane wall |
| 3:00.8 | `v2_dish_close` first frame held 0.87 s (its window starts at 181.67) | the downbeat goes to the wide of her alone at the dish (`v2_dish_sit` clip 3–3.9, unused elsewhere), close-up from 3:01.67; context bar and chyron run on | the new 2-beat insert |
| 3:48 | fold: last frame held 0.6 s | 0.9x | — |
| 3:56.3 | `ch2_gone_close` (lag 0.3) ended 0.2 s early; then the orchestra stand-in's first frame 0.1–0.3 s | cut on its last frame; the stand-in eases in from frame 0 and is on the beat again 2 beats after bar 137 (the `orch_wide` take covers the head by itself) | the cut into the orchestra |

**Fork tree** (1:07, 1:15, 2:57): the copies are built from glyphs like every other figure (decision 9): the soft underpaint and three glyph tiers
of `LOOKS.ascii2.figGlyph`, per screen cell (copy height / 160, 2.5–5 px since §1.2; it was 5 px for a big copy); lane recolour and the Banach–Tarski
ownership as before. A SwiftShader smoke test on a test plate (the intro_up still, rough matte) compiled and drew them, with about the LED
copies' brightness (`figGain`, default 1.2). Check the 1:07 face against `?figlook=led` (the old LED copies).

**Review render ranges for these** (in §3's commands): 27–44 (L1 copies, the 0:42 cut), 53–90 (grid, origin, 1:15 tree, ch1 cut, fold),
99–119 (breakdown), 124–153 (build), 176–184 (drop tree, the 3:01 insert), 222–266 (fold, the 3:56 cut), and 64–80 with `figlook=led`.

### 1.2 v5a QA fixes (cloud, 2026-10-25; nothing rendered)
The QA pass on `review/v5a/` found five problems. All are engine or EDL fixes; no new takes. Test stills were rendered with SwiftShader on test
plates made from the raw takes in `review/cloud/takes` (not committed). `edl_check` reports 0 exceptions and 0 held clocks for the default,
`orch=v4`, `drop=v4/v5`, `figlook=led` and `--fake=allnew`.

| time | problem | fix | eyeball |
|---|---|---|---|
| 1:07 (+1:15, 2:57) | glyph face unreadable: ~10 cells across, hair lost | fork-tree glyph cell = copy height / 160 (2.5–5 px; was 5 px for a big copy), so the hero copy is ~17 cells across the face at 720p, with the same count at 1080p; the underpaint fills her dark parts with their own colour (`uShadow`, as the LED dots did), so hair frames the face. Test still: eyes, nose, mouth and hair resolve; frame mean unchanged (18.9 vs LED 18.6) | 1:05–1:10, A/B `figlook=led` |
| 1:40–1:47 | `bd_float` back plate blown to white | the back is added rgb × coverage alpha, and the glyph figure (four layers) carries ~2.5x the LED's coverage: back `figGain: .3` (panels.js; LED ignores it). Test: figure mean 64 vs LED 54, clipped 3.6% vs 3.8% (was 135, 21%) | 1:40–1:52 |
| 3:58–4:05 | stand-in close-ups tear (beige/black smears) | `LatticeView.frame({ zoom })`: a 2D punch-in (the depth lattice converges on the camera, so there is no parallax), clamped inside the plate. The three stand-in close-ups (line, keys, guitar) use it with a ±1% push instead of dolly .42–.52. Test on a random-block depth: the zoom renders the same as flat depth (diff 0.0; the dolly was 27). The line staff ends left of the violinist's head; the keys pan is clamped (targets moved 63 px). The v5 orchestra stays the default: the stand-ins are clean now, so no take gate is needed | 3:56–4:09, A/B `orch=v4` |
| 0:54–1:05, 2:05–2:31 (+1:40, 4:12, 4:47) | slowed panes step at 3.5–7.5 images/s | frame blending (plateseq.js): a clock slower than 0.9x shows frames floor/ceil mixed by the fraction (rgb, depth, matte; lattice.js samples both). At normal speed the nearest frame is shown, as before. The fork tree opts out (its shader reads one frame; its clocks aren't slowed). Test: 6 frames at 0.46x give 6 distinct images, where nearest-frame gave 3 pairs | the grid's head turn, the build wall, the post-credits window |
| 2:26 | "chess move" lost on the returning panes | a soft dark ellipse fitted to each right-hand word, firmer from bar 85 when the panes come back | 2:24–2:28 |
| 4:18 | a popped pane clips the oldest log hash | one hash column (the block is centred on the longest message), 30/24 px type, 28 px apart from 1060: the oldest line's top (~982) clears the lowest pane edge (~968) | 4:15–4:22 |
| 3:00.8 | dish flicker; near-black frame after the flash | the insert starts at `v2_dish_sit` clip 3.35 (the take flickers over 3.0–3.3). The drop's white card fades to 30% (not to black) and the verse carries the tail to 0 | 3:00.6–3:01.8 |
| 0:00 | poem low-contrast on the frost | the hooks' radial scrim (.8/.55), fitted to the block, and a denser shadow | 0:00–0:03 |

**Review render ranges**: 0–4, 53–70 (and 64–70 with `figlook=led`), 99–113, 124–152, 178–184, 235–253, 255–266 and 285–297.

### 1.3 Jade's v5a notes (cloud, 2026-10-26; EDL only, nothing rendered, no new takes, no spend)
`edl_check` (0–297 s): 0 exceptions, 0 held clocks for the default, `bd=full`, `drop=v4`, `drop=v5` and `figlook=led`.

| v5a time | her note | change | where | A/B |
|---|---|---|---|---|
| 2:20.3 (2:19.3–2:27.9, bars 81–85) | "analysis mode" is announced at the end; it should be there when the screen loads | The engine header reads "› analysis mode" (with its cursor) from the poster/graph's first frame, fading in with it. The fourth kick (bar 84 beat 3, 2:25.3) now pulses it (glow, brighter underline, an 8% swell) instead of typing it. The depth counter, the evals, the candidate lines and the three moves are unchanged. | `main.js` build block, `stanza()` | |
| 2:06.3 (2:05.3–2:12.3, bars 73–77) | the build wall: "each one fullscreen on the beat, then the matrix of selves shrinks into the corner" | **A variant, `?bd=full`; the default is unchanged.** Bars 73–76 make 16 full-frame cuts, one per kick, in the wall's order. Each is a lattice shot like the life montage (written figure, lane tint, branch chyron, kick punch) on its pane's own clock: 1x through its beat, then slowed, so the matrix continues it. The bar-73 slam flash is on the first cut. On the bar-77 downbeat (the 4-bar line) the full 4×4 matrix appears at frame size. It holds 2 beats, then shrinks over beats 3–4 into the **bottom-right corner** (28% size, 38 px in; x 1368–1882, y 751–1042 at 1080p), in place by bar 78. Nothing else uses that corner: the git log types from the top left (from bar 77 beat 4 here), and the sun, the graph, the header and the stanza's right-hand words sit above it. As in the default, the panes dim through bars 81–85 and collapse from there into the point on bar 86. (Jade's note says "breakdown", but at 2:06.3 the film is in the Build Up's wall, bar 73. The 1:40 breakdown is a ring of 8 panes, not a matrix.) | `main.js` build block (`FULL`, `MAT0`, `SHR`, `K`, `LOG0`) | `?bd=full` |
| 4:44.1 (4:42.5–4:47.1) | the sender has the violet band under the blue dot; where did the clean image go; use the clip where she sends the light off | The sender is now **`v2_release`**, verse 2's last line (where her context fills and she lets the light go). It plays clip 0.6–5.2 at 1x (`v2_release_t12`): the fade-in lands on the light over her open palm, the light drifts off and climbs up-right toward the far glow from about clip 2.5, and her hand drops as she watches it go. The cut is at 5.2, on her smile. Its plate follows PICKS (`pk`). The drawn light rides the take's own light (`REL_ORB`, measured on t12; overlay-checked at clip 1.6, 3.0, 4.5 and 5.2), then arrives at the window from outside and touches the glass once at P0 + 6.4. The cut, the touch and the 1-2-4-8 chimes are unchanged, so `tools/mix.py` is unchanged. **Jacket:** it's a front view, so the back band can't show; the chest band under the small blue dot matches the canon front (`r7/turn_gpt`). **But the 1420 MHz patch is on her RIGHT arm** (the near, hanging arm, readable throughout). It's a sung take, so her mouth moves over clip ~0.8–4.8. The clean `v2_horizon` (still `v2_horizon_v5.jpg`, takes t51/t52 in `review/takes/`) only needs intake + a pick: 3:07 uses `pk('v2_horizon')`, and the only hard-coded t5 is the pick in `docs/picks_manual.json`. | `main.js` post-credits (`REL_C0`, `REL_ORB`, `relXY`), `FX.mote({ path })` | |

**Render for these** (720p, with `out/mix_v5.wav`):
- the A/B for 2:06: 124–153 with the default and with `bd=full`;
- 280–297.016 for the post-credits.

The default 124–153 render also shows the 2:19 header. The commands are in §3.

### 1.4 v5b picks wired into the EDL (cloud, 2026-10-26; EDL only, nothing rendered; RESUME checkpoint 18)
Both changes switch on by themselves once the box has done intake and `picks.py` for the picks in `docs/picks_manual.json`; until then the
film is unchanged. `edl_check` (0–297 s): 0 exceptions, 0 held clocks, 0 gaps for the default, `drop=v5`, `bd=full` and `orch=v4`, with the
cloud picks, `--fake=pc_send_v`, `--fake=allnew` (now includes `pc_send_v`) and a scratch picks.json built like `picks.py` from the manual picks.

| time | change | where | eyeball |
|---|---|---|---|
| 4:42.5–4:47.1 | The sender is **`pc_send_v_t61`** (silent; the 1420 MHz patch on her **left**, outstretched arm), gated on `has('pc_send_v')` like the other v5 shots. It plays clip 0–4.6 at 1x (`REL_C0` = 0): the light lifts off her palm at once and drifts up and to the right, staying in frame; her hand lowers (~3.5–4.5); her mouth stays closed. `REL_ORB` was refit on the raw take: the brightest blob tracked per frame and keyed every 0.5 s. Through the EDL, the drawn light starts on her palm's light (0.5 px) and stays within 3.6 px (1080p) of the take's light to the cut. It is drawn at a constant size, because t61's light keeps its size. Before intake: the v5a `v2_release_t12` sender, unchanged. The cut (P0 + 4.6), the touch (P0 + 6.4), the one pass and the 1-2-4-8 chimes are unchanged, so `tools/mix.py` is unchanged. `t63` also has a measured track (1280×720). | `main.js` post-credits (`SEND`, `SEND_ORB`, `relXY`) | 280–297.016: does the drawn light sit on hers from the first frame to the cut? The patch on her left arm |
| 3:55.7 (3:48.8–3:58.4) | While **`ch2_gone_close_t63`** is picked (`isTake`), the shot ends at the end of "become", `we(23)` = 235.73: t63 doesn't mouth the "Back to" pickup. The orchestra's first cut starts there, 0.8 s earlier than before. `orch_wide_t52` eases in from its frame 0 at 0.96x. The stand-in (`out_orch`) and `orch=v4` ease in at 0.49x until bar 137 + 2 beats. Nothing is held. The hook fades from 235.53. "Back to main" is captioned over the orchestra, as before. Any other pick keeps the 236.53 cut. | `main.js` `GONE_END` → `ORCH_T0` | 228–240: "become" held to the cut, a clean cut into the wide on the pickup, no frozen frame |

**Render for these:** 222–266 (`354_outro.mp4`) and 280–297.016 (`postcredits.mp4`), both from §3.

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
.venv/bin/python tools/sd/picks.py > /dev/null           # applies the re-measured lags.json (and writes each take's len) before any review render
node tools/edl_check.mjs                                  # held frames / exceptions with the real plates: expect "held-clocks 0" (after every picks.py)
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
  take). Then `.venv/bin/python tools/sd/picks.py` and `node tools/edl_check.mjs` (a held frame shows as a HOLD line with its time).
- Picking a re-take switches its interim trim off: 3:30 gets its full shot back, and the 4:12 home shot runs to 254.51, with the living graph
  starting there.
- Orchestra: each cut switches from its stand-in to the new take as soon as that take is picked. Then tune the `WIDE`/`CLOSE`/`to`/`tip`
  positions in the ORCH v5 block on stills at each cut's midpoint (below). If a big gesture lands off the beat, shift that cut's s0 by
  whole beats.
- Post-credits: fit `FR` (the glass region; the stem starts at the touch point) and the window's `FX.mote` path on stills at P0 + 5, 6.4, 8,
  9.6, 11, 13 (P0 = 282.516). The sender's mote rides `SEND_ORB`, the take's light tracked per frame: `pc_send_v_t61` (the pick) and `t63`,
  plus `v2_release_t12` (the sender until `pc_send_v` is through intake). If another take is picked, track it the same way (§1.4).

**Mix and renders** (720p review parts ≤ 75 s each go to `review/v5/` with a README line; GitHub's limit is 100 MB per file):
```bash
.venv/bin/python tools/mix.py out/mix_v5.wav                      # post-credits: 1-2-4-8 from song end + 6.4 s, no lone chime
R='node engine/render.mjs --q show=/engine/show/main.js --res 1280x720 --audio --audiofile out/mix_v5.wav --workers 3'
$R --from 27 --to 44 --mp4 out/review/v5/030_verse1.mp4          # L1 copies echo behind her; L2 slowed into L3's new cut (0:42.1)
$R --from 53 --to 90 --mp4 out/review/v5/107_origin.mp4           # grid panes' slow turn, 1:07 + 1:15 forktrees (glyph copies, intro_up plays), ch1 cut, fold
$R --from 99 --to 119 --mp4 out/review/v5/146_breakdown.mp4      # glyph pane figures (slowed), bd_float back, bd_ahh from its frame 0
$R --from 124 --to 153 --mp4 out/review/v5/205_build.mp4         # build panes, each take spanning its pane's life
$R --from 176 --to 184 --mp4 out/review/v5/257_tree_dish.mp4     # drop forktree (glyph copies), the dish wide insert at 3:00.8, close-up from 3:01.7
$R --from 206 --to 216 --mp4 out/review/v5/330_catch.mp4         # 3:30 cut + hook over the tree
$R --from 222 --to 266 --mp4 out/review/v5/354_outro.mp4         # ch2 fold, 3:54, the 3:55.7 cut (t63: on "become"'s end), orchestra, home 4:12, living graph, end-card hit
node engine/render.mjs --q "show=/engine/show/main.js&figlook=led" --res 1280x720 --audio --audiofile out/mix_v5.wav --from 64 --to 80 --mp4 out/review/v5/107_led.mp4   # fork tree A/B
$R --from 280 --to 297.016 --mp4 out/review/v5/postcredits.mp4   # violet sender (pc_send_v_t61: the light lifts off her palm), window, frost, chimes
node engine/render.mjs --q "show=/engine/show/main.js&bd=full" --res 1280x720 --audio --audiofile out/mix_v5.wav --from 124 --to 153 --mp4 out/review/v5/205_build_bdfull.mp4   # A/B with 205_build.mp4 (§1.3)
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
  touch; one chime cascade. Since v5a (§1.3) she sends it in motion; since v5b (§1.4) in the silent `pc_send_v_t61`, the patch on her left
  arm: does the drawn light sit on the take's light from her palm to the cut?
- **2:06 build wall, A/B** (`205_build.mp4` vs `205_build_bdfull.mp4`): 16 full-frame cuts on the kicks, then the matrix shrinking into the
  bottom-right corner on bar 77. **2:19**: "› analysis mode" is there from the screen's first frame and pulses on the fourth kick (2:25.3).
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
  - 0:44 (−.15; the take starts 0.7 s after bar 24 beat 3, so the cut now waits for its first frame at 0:42.1)
  - 1:11 (.40)
  - 3:54 (.30, interim)
  - every new re-take
- **Held frames** (Jade OK'd fixing them all, 2026-10-25; §1.1): none left. Look at the slowed panes (the grid's head turn ~0.23x, the build
  wall 0.25–0.47x), the new 2-beat dish wide at 3:00.8, and the cuts that moved (0:42.1, 1:14.7, 1:51.9, 3:56.3; 3:55.7 with
  `ch2_gone_close_t63`, §1.4).
- **Fork-tree copies as glyphs** (1:07, 1:15, 2:57): is the 1:07 face readable? `?figlook=led` gives the LED copies for A/B.

## 5. A/B parameters (`--q "show=/engine/show/main.js&..."`)
- `orch=v4`: the conductor orchestra.
- `drop=v4` / `drop=v5`: forces the drop. The default is v5 only when all six new shots are picked; forced v5 shows the v4 take that covered
  each bar until it is.
- `fold=palms` (default reach).
- `pv=flash` | `pv=off` (default screens).
- `figlook=led`: LED figures in lattice shots, panes and the fork tree's copies.
- `bd=full`: the 2:06 build wall as 16 full-frame cuts on the kicks, then the matrix shrinking into the bottom-right corner (Jade's v5a note,
  §1.3). Default: the wall pops in pane by pane, as before.
- `timing=v1`: the frozen v1 film.
