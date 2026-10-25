# Merge — v2, for your review

## Watch
- `out/final/merge_v2_1080p.mp4` — full piece incl. post-credits (song untouched; split chimes in the intro; Hilbert Hotel bell after)
- `out/final/merge_v2_teaser_x.mp4` — ~82 s cut for X (intro hook spliced on the bar line into your life montage, the 3×3 grid and chorus 1)
- v1 is still there for comparison: `out/final/merge_me_back_to_main_1080p.mp4`

## What changed since v1 (your notes)
1. **Title → MERGE.** One-word slam on the bar-9 hit with "merge me back to main" under it; end card "MERGE · Jade Q Wang · Rare Earth".
   Switch back: `TITLE` / `SUBTITLE` at the top of `engine/show/main.js`.
2. **The branches are your lives** (the `LIFE` table at the top of `engine/show/main.js`; edit the commit messages there):
   piano (before three) · violin (school orchestra) · wet lab (first paper, 2005) · PhD auditory booth (2010) · poet · NASA Ames (wind tunnel) ·
   Robot Ninja Apocalypse (2011–13) · collegiate wushu (bronze, group set) · Chez JJ hacker house · open-source stage demo · home — couch video games with the kids (seen only from behind).
   They drive the Verse-1 montage (cuts quickening 2-1-1 beats), the pre-chorus 3×3 grid where every life turns her head on the same beat,
   the breakdown memories, the build-section session panes + `git log`, and the outro credits graph. The violet 1420 MHz branch is unchanged.
   In the drop, all seven of you perform the wushu group set with swords at sunrise (bar 95) — one life, everyone's choreography after the merge.
3. **Glyph world, after the ASCII MMORPG:** the whole world is now coloured ASCII (a brightness ramp of characters, dark areas filled like the
   grass in the reference) and the song's words take over the highlights. Unmerged branches in the montage are *written* — you are drawn in
   characters — and only become LED as you merge. Half-density "screen-door" dithering is gone (branch = clean coarse LED grid).
4. **Tree of life drawn by drones:** the breakdown's scale reveal is now a drone-light tree that is literally the git graph (trunk = main,
   10 forks = 1,024 tips, swirl roots); it grows with the "Ahh", light pulses run home down every branch, and the whole tree draws into one point on
   the biggest hit. It returns in Chorus 2 for "every road I ran becomes the one", every tip flowing home into the trunk.
5. **Arm patch:** every plate where the 1420 MHz patch was a black dot / gibberish / missing was repaired (image edit, nothing else changed) and
   re-animated; new plates carry the patch spec + an enlarged patch reference. Audit: `docs/patch_audit.json`.

## Decisions that are yours
1. **Commit messages for your lives** — I kept them factual and modest from Wikipedia + jadewang.me; please correct anything (e.g. the violin
   line, "kept the neurons alive (first paper, 2005)", "PhD: how the brain listens (2010)").
2. **Kids:** they appear only from behind on the couch; say if you'd rather not have them in it at all (swap `lf_home_mint` out of `LIFE`).
3. **Lip-sync lags** (by ear) — new takes for the patch-repaired close-ups; see "Sync picks" below.
4. Credits wording; the poster homage in the build (kept).

## Sync picks (v2)
New takes (patch-repaired stills), chosen from mouth word strips + envelope correlation — please listen:
- 1:30 "Nothing that I lived is ever gone" (ch1) → `ch1_gone_close_t6`, lag +0.125 s (corr .71, best of all takes so far)
- 3:48 "Nothing that I lived…" (ch2) → `ch2_gone_close_t5`, lag +0.21 s
- Unchanged: 0:28 split (v1 take kept — the new ones push in and break the ghost-copy layout), 0:42 light, 1:10 merge, 3:01 dish, 3:28 catch.
Lags live in `docs/lags.json`, take choices in `docs/picks_manual.json`; after editing run `.venv/bin/python tools/sd/picks.py` and re-render.

## Re-render
`node engine/render.mjs --q "show=/engine/show/main.js" --from 0 --to 297 --res 1920x1080 --mp4 out/final/x.mp4 --audio --audiofile out/mix_v2.wav --workers 3`
Spend so far: $146.03 (list-price estimate) of the $600 cap (`tools/gen/spend.py`).

## Jade's decisions, 2026-10-24 (out/review/decisions.html)
1. Head-turned stills: keep take a for dr_center, ch2_catch, v1_split_front (installed in media/plates/face_v4/).
2. Hair: wushu = high ponytail (and for the group sets, a MIX of ponytails and space buns); tech/house = teal tips. Biology braids; main-Jade half-up.
3. Drop = wushu group set, then half-vs-half duilian; outro (~3:57, was the K-pop out_dance) = orchestra of Jades.
4. Group set = barehand changquan (her collegiate team's event). She also competed sword (jian) solo: use for the solo wushu beat.
5. Orchestra: piano, violin, electric guitar, a conductor Jade in the centre. (In Robot Ninja Apocalypse Ricky played electric; Jade and Charlie
   played acoustic. She's played electric too and found it easier, so electric is fine.)
6. Fold gesture: try BOTH open palms toward camera AND one hand reaching to camera; she'll pick.
7. Last sung shot: new home shot singing the final "Back to main…" (line 25, 4:09).
8. Post-credits: palm-to-palm beam, the light settles into the frost as a logistic-map bifurcation SHAPE. NO book title and NO written equations:
   "the adult is only able to send a shape, an idea, and the light shows up in the frost". (Book can stay on the sill, untitled.)
9. Figures in the glyph look too (drop the LED dot grid on figures).
10. Clips from her earlier videos: build BOTH (quick flashes in the life montage, and screens inside the open-source/tech-demo branch); she'll decide.
11. analysis_v2 click check: on the beat throughout. ✔
12. Likeness notes stay public in the repo.

## Jade's notes, 2026-10-25 (v4 review)
Each note, what the cloud session did (committed on `claude/wonderful-mccarthy-f90kll`), and what the box still has to generate or render.
The run sheet `docs/V5_BOX_RUNSHEET.md` has the commands, the costs (≈ $70.5 queued; $284 of $600 spent) and what to check.

| time | your note | done | queued (box) |
|---|---|---|---|
| 0:00–0:16 | the typed poem fought the girl's action | Poem shown whole from frame 0; title MERGE alone. Also: jade/home reads "taught kids the Copernican model at 10:30pm"; earlier films as screens (your pick) | — |
| 0:32, 0:44, 1:11, 3:54 | slight lip-sync issues | Lags re-measured from the raw takes against the vocal stem: 0.62, −0.15, 0.40, 0.30 | `picks.py` + render; your ear |
| 1:07 | still, glitchy, old face | It played the take's last frame (a bug in all four uses): it now plays (breath, blink, smile) with a slow push-in | Canon-face still + re-take `intro_up` |
| 1:11, 3:54, 4:12 | ends too smiley | 4:12 ends at 4:12.25, before the grin (interim, until a re-take is picked) | Re-takes: calm, mouth open on the held note, slow eye close, no grin (1:11 now 7 s) |
| 1:24, 3:42 | fold gesture | Your pick: one hand reaching (default) | — |
| 1:46 | updated likeness? | No: a first-round take. Pane figures are now glyph-built like the rest (your decision 9 had missed them) | Canon-face re-take `bd_float` (the small life panes not yet) |
| 1:58, 3:33 | huge, alien eyes | The Seedance guard asked for "large" eyes, so redrawn eyes grew. It now keeps the still's eyes | `bd_ahh` with eyes closed throughout; `ch2_catch` re-take |
| 2:17 | the poem's words too big | Small annotated moves on the git graph; "analysis mode" is the graph calculating | — |
| 3:07/3:09 | extra violet band across the jacket back | Edit prompt written (band out, patch on the left sleeve only) | 1 edit + re-animate |
| 3:30 | ends too smiley; contemplative, eyes closing fine | Cut on "main" with her eyes still closed (interim); the hook carries over the drone tree | 8 s re-take with eyes closed, plus a variant that half-opens them, then closes them slowly |
| 3:56–4:09 | orchestra: match the music; the conductor isn't doing anything useful | Cuts on the music (impact, violin, keys, composer, guitar). **Your pick: the composer is the violet branch** (bun, two pencils), writing the score in violet light that lands on each player on the beat and folds into one orange line. Reframed v4 takes stand in until the new ones are picked. `?orch=v4` keeps the old one. | 5 stills + 5 takes |
| 4:17 | boring; show a bit of everything | **Your OK to lose the readable card**: the living git graph. Your lives fork out of main in doublings as live panes, the log is read one commit per beat, everything merges home, violet cherry-picked last. It starts where the home shot ends; the end card keeps its hit. | — (no new takes) |
| 2:33–3:00 | wushu: duilian first, then a group set as good as your medal one | Duilian 89–92: three pairs, then the front pair's sweep, flying kick and freeze. Then your real group set, by six branch copies in one line, warm and cool alternating: a unison burst on 93, your jian solo, and **the group fall**, which lands on 97, holds still through the bar and rises as one on 98.1. Then the halves trade a phrase, the cross pairs attack and block, and an arms-out horse stance on 100. Main steps into the V's point for the salute on the "ooh" and cuts into the fold. It replaces the v4 drop only once all its takes are picked (`?drop=v4`/`?drop=v5`). | 3 plates + patch fix + 6 takes (≈ $18.51) |
| all | (your OK) fix every frozen frame, never loop | 50 held take clocks found in 12 places and fixed: the life panes (the grid's head turn, the breakdown, the build wall) now play slowed so each take lasts as long as its pane; sung takes are only trimmed (cuts at 0:42.1, 1:14.7, 1:51.9, 3:56.3 moved to the take's own first or last frame); 3:01 opens on two beats of the wide at the dish before the close-up; the folds play at 0.97x and 0.9x. The fork-tree copies (1:07, 1:15, 2:57) are glyph-built like every other figure (`?figlook=led` for the old dots) | eyeball in the review render |
| post-credits | they shouldn't touch; play once | **Your pick: the violet branch sends** (existing takes): she sends the light toward the horizon; the girl alone at the intro's window watches it touch the glass once, and the shape grows there. One chime cascade. No new takes. | Remix + fit the light's path on stills |

After the v5a QA: the 1:07 glyph face now reads (finer cells, and her hair shows). The 1:41 back plate is no longer blown out. The orchestra stand-in close-ups are clean crops and no longer tear. Slowed panes blend frames instead of stepping. Also fixed: the 2:26 label, the 4:18 log, the 3:01 dish flicker and the poem's contrast (run sheet §1.2).

Nits for you:
- The life-montage plate `lf_wushu_gold` shows a sword group set with teammates, but your group set was barehand and jian was your solo.
  Re-caption it or regenerate it?
- Held frames: you said fix them all (2026-10-25). Done: none left (run sheet §1.1 lists each one and its fix).
- Wushu hair: the duilian keeps the v4 plate's hair, because its new close-up cuts straight on from it (violet has one high bun). The group
  set uses your ponytail and space-bun mix per lane (violet has two space buns). Keep both, or should one look apply to both?
