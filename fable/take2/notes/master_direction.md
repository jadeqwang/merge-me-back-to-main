# The master: direction (director's brief, 2026-11-14, night)

Source: Jade's answers on film v4, verbatim in `notes/jade_v4_notes.md`. She accepted everything in v4 except one thing, gave two
new commit messages, and chose "Go to the master". Rules as in `notes/v4_direction.md` (owners, notes files, own-path commits, no
push, nothing under `work_fable/` and no likeness committed, the canon).

## A. Plates
1. **`home_v3`: the kids' visible skin.** Jade: "kids faces should have skin tone". In `home_v2` the two children (from behind) have
   their ears, cheek edge, necks and hands painted in the room's blue. Edit the `home_v2` start still and its turn frame (one
   reference each, skin only): the children's visible skin in natural warm skin tone lit by the lamp, everything else unchanged,
   still from behind, no faces turned to us, never photo-referenced. Clip with the same time structure as `home_v2` (first and last
   frame; turn at the same clip time). Measure warm pixels on the kids' skin regions and on her face and hands through every frame.
   Check `det_home_v2`, `runner_home` and any other plate with the children for the same fault. Wiring table in `notes/plates_v5.md`.

## B. Compositor
1. **Commit messages** (`fable/proof/lives.js`): ames `landed a 747 in a class 4 sim` (was "stood in the wind of the giant
   tunnel"); phd `language and music cognition, auditory neuroscience` (was "how the brain listens, 2010"). Her exact words, lower
   case as the others. Everywhere they show (chyrons, grid, fold backs, written lanes, town road, kit lanes, graph, captions); the
   phd one is long: check every place it can overflow or collide, on stills, and fix the layout (not the words). Proof identity.
2. **Lip-sync stays** +340 / -40 ms (she said both are right). Wire `home_v3` when it lands (every use, as `home_v2`).
3. **Step 6 audit before the master** (report, fix what is yours, list what is not): on one-frame-per-beat strips of the whole film
   with `hud=0`, (a) costume: stripe on a jacket back, patch on the wrong arm, a second face, anything off canon; (b) readable text:
   every piece of type legible, nothing clipped at a frame edge, no old branch names or old messages where legible, the terminal log.
4. **The master** (Step 7), 1080p30, **no HUD** (`hud=0`): the local master WITH the likeness shot to
   `work_fable/take2/out/merge_master_1080p.mp4` (CRF 16, the song as PCM or 320k AAC; this is the release picture and stays out
   of the repo), and the public `likeness=0` version for the repo. `check.py`; last frame equals frame 0. Then STOP and report:
   the encodes (X, YouTube) and subtitles are made by another agent from your master.
