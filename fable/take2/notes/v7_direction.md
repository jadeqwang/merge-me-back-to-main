# Film v7 direction (2026-11-21), from notes/jade_v6_notes.md

Film v7 = film v6 plus these fixes only. Everything else in v6 stands. Decisions on the v6 page she did not mention stay as built
(like_sing0 stays off by default; pad, intuition, drawn drop unchanged). Decision 1 answered: **keep the violet branch as the
special one / narrator.**

## 1. The car (4:27-4:37), compositor
- Delete her line `I have a confession to make` entirely (no type beside her).
- Keep the turn and the almost-smile (hold it; it may now hold longer since nothing is typed over it).
- `You could tell me anything and I would find it strangely plausible` becomes an RPG dialogue box: a framed box across the
  lower part of the frame (dark fill, light double border / rounded corners, classic JRPG look), a small name tab reading `YOU`
  on its top-left edge, the text typed on letter by letter (RPG typewriter; whole line visible well before the cut), optionally a
  small blinking ▼ advance marker at the bottom-right once fully typed. Keep the film's lyric serif or a pixel-ish face only if it
  reads well at 1080p; legible on the night car plate. No speech tail.

## 2. Pencils at the dish, plates (then compositor re-wires if ids change)
Canon from now: a pencil in her hand means ONE pencil in the bun. Plates showing two in the bun plus one in hand:
`vio_write2`, `vio_cutaway`, `vio_grid_stay` (check also `vio_write`, the proof grid tile `work_fable/proof/plates/violet`, and
any other writing/pencil plate used in the film). `vio_release2` / `vio_still` (empty hands, two in bun) are fine.
Fix as new ids (`<id>_v2`), never overwrite. Recommended: remove one bun pencil from frame 1 (image edit, one reference) and carry
the clean bun patch through the clip with per-frame tracking + soft mask; regenerate the clip only if tracking fails.

## 3. 3:30, bar 122 `c2_lookup` (plates + compositor)
- She looks frozen: needs visible breathing (shoulders/chest), a blink, and hair moving in wind throughout the 1.5 s used.
  New plate `c2_lookup_v2` from the same still (crop/inpaint the stray patched arm at right if helpful), still as first and last
  frame only if it keeps motion; measure motion on the chosen window.
- Two meteors: the plate already has its own violet meteor and the code `comet` (drawn on top) does not match it. Keep ONE: the
  plate's own meteor, timed to arrive near the b123 downbeat via the clip window; remove `opt.comet` from the shot. If the new
  plate has no usable meteor, keep the code one and paint the plate's out, and make the code comet match the plate's look
  (thin tapered streak, small round head, no square).

## Owners
Compositor: shots.js / src / tools; car dialogue box; comet removal; wiring of the _v2 plates; film_v7 render (local + public
likeness=0), check.py, sheets, review_v7.html. Plates: items 2 and 3 plates, Wiring table in notes/plates_v7.md, spend per batch.
