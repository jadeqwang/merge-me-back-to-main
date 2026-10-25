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
