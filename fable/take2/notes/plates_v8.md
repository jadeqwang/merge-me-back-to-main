# Plates for film v8 (plates agent, 2026-11-21)

Brief: `notes/v8_direction.md`, Jade's v7 note "3:03.39 b106.4 3 pencils error".

## Resume state
DONE. One new plate: `page_reveal_v2` (`work_fable/take2/plates/page_reveal_v2`). Nothing queued. Compositor wires it.
Shot at 183.39 s is b105 `vb01`: `vio_wide` row, whose `next` list starts with `page_reveal` (clip 0.3-4.6, 1.25x). The bun
is in view from plate frame ~76 (3.2 s); at 183.39 s the plate is at about clip 4.0 s (frame 96): hand pencil + two in the bun.

## Method
Same as v7 (`gen/bun_pencil_v7.py`), now with `--ext=N` (mask extension along the pencil axis; this plate needed 40 so the stub
of the pencil that shows through the bun hair is covered). Three keyframes (plate frames 90, 102, 118) edited with
nano-banana-pro, one reference each (`v8_nopencil_page_reveal{90,102,118}`, specs in `gen/stills.json`; refs in
`work_fable/take2/dev/v8_plates/ref_page_reveal_f*.jpg`; edits `work_fable/take2/stills/v8_nopencil_page_reveal*_a1.jpg`).
Commands (venv python = `.venv/bin/python`; frames 1-69 are copied unchanged, bun is not in view):
`bun_pencil_v7.py plates/page_reveal/frames plates/page_reveal_v2 90:E90 102:E102 118:E118 --roi=860,0,1260,210 --frames=70-121`
then `--frames=84-104 --ext=40`. Other files (meta.json, REAL, still.jpg, page_track.json) copied from `page_reveal`; same
framing frame for frame, so `page_track.json` holds.
Removed pencil: the one running lower-left to upper-right (eraser up-right); kept: tip up-left, eraser lower-right (same as v7).

## Checks
Strip of the whole clip: `work_fable/take2/dev/v8_plates/page_reveal_v2_strip.jpg` (original: `page_reveal_orig_strip.jpg`).
Bun crops original vs new: `page_reveal_v2_bun.jpg`; zoom 84-108: `page_reveal_v2_zoom.jpg`; 96-120: `page_reveal_v2_late.jpg`.
Result: frames 76-121 show exactly one pencil in the bun; no smear seen except a faint soft dark vertical patch at the top edge of
the bun at frame 96 (3.95 s, one frame-ish, partly at the picture's top edge). Frames 76-85: only the kept pencil's eraser end
is in view at the top edge. Frames 1-69: no bun in view.
Note: tracker `resid` counts in `bun_track.json` are not meaningful here (ROI includes purple collar in early frames).

## Audit: plates where she holds a pencil
| plate | result |
|---|---|
| `page_reveal` (b105 vb01, Verse 2) | 3 pencils (hand + 2 in bun) -> fixed as `page_reveal_v2` |
| `vio_write2_v2`, `vio_cutaway_v2`, `vio_grid_stay_v2`, `violet_v2` | fixed in v7, one in bun |
| `vio_write`, `vio_write2`, `vio_cutaway`, `vio_grid_stay`, `violet` (old) | two in bun; superseded by the v2 ids, must not be shown |
| `vio_pencil` | draws one out of the bun: ends with one in the bun and one in hand, canon |
| `vio_release2`, `vio_release` | pencil only at 0-0.9 s (two in bun); film plays from 1.0 s, hands empty: fine |
| `vio_close`, `vio_still`, `vio_lookback`, `vio_walk`, `vio_climb`, `vio_wide`, `vio_wide_v2`, `cross_violet` | hands empty (or figure tiny, no pencil in hand): fine (`vio_close`'s two bun pencils with empty hands: canon only concerns pencil in hand) |
| `det_violet` | close detail of bun, one pencil, no hand: fine |
| `pencil_lead`, `pencil_draw` | hand with pencil, no bun in view: fine |
| `ins_poem` | hand with pencil, no bun: fine |
| `runner_pencil`, `hero_paper(_v2)`, `main_*`, `day_jade`, `night_jade`, `float_*` | no bun pencils or no pencil in hand: fine |
Checked on mid-frame contact sheet `dev/v8_plates/audit_sheet.jpg` plus v7 bun strips. Not exhaustively re-rendered at every Verse 2 song time:
the only Verse 2 plates with a pencil in hand are the vio_* writing plates, `page_reveal` (b105) and `vio_pencil` (b113).

## Wiring
| old id | new id | where used | notes |
|---|---|---|---|
| `page_reveal` | `page_reveal_v2` | b105 (`vio_wide` row, `next[0]`, shots.js ~line 358): same opts (clip0 0.3, clip1 4.6, page quad `page_track.json`) | identical framing and timing; `page_track.json` copied into the new folder, so the quadUrl can point at `/work_fable/take2/plates/page_reveal_v2/page_track.json` or stay |

## Spend
3 edits x $0.134 = **$0.40** (see `docs/spend_ledger.jsonl`).
