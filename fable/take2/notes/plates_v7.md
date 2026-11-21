# Plates for film v7 (plates agent, 2026-11-21)

Brief: `notes/v7_direction.md` items 2 (pencils) and 3 (b122 `c2_lookup`), from `notes/jade_v6_notes.md`. Specs: `gen/stills.json`
(ids `v7_nopencil_*`, `c2_lookup_far`, `c2_lookup_empty` at the end), `gen/gen_clips.py` (block "Film v7 plates"). Tool:
`gen/bun_pencil_v7.py`. Review strips, crops and measuring scripts: `work_fable/take2/dev/v7_plates/`.

## Resume state

DONE (2026-11-21). Five new plates exist and are checked (Wiring table at the end): `vio_write2_v2`, `vio_cutaway_v2`,
`vio_grid_stay_v2`, `violet_v2` (pencils) and `c2_lookup_v2` (b122), plus the unused alternative take `c2_lookup_v2a`. Nothing
queued. The compositor wires them (shots.js `next` lists, `PROOF_STAY`, and the life-plate override for `violet`).

## Spend

Start **$568.06**, close **$571.45** (`tools/gen/spend.py`). This round **$3.39**: 8 stills (nano-banana-pro edits, $0.134 each;
`c2_lookup_empty` was specced but not generated) and 2 clips (seedance 2.5, $1.156 each). The cap constant (600) was not raised.

## Pencils (item 2)

Canon from Jade: one pencil in her hand means ONE pencil in the bun. Plates where she holds a pencil while two are in the bun:

| plate | used in the film | fixed as |
|---|---|---|
| `vio_write2` | b114-116 (`next` of `vio_write`), b48 fallback | `vio_write2_v2` |
| `vio_cutaway` | b48 (copy of vio_write2) | `vio_cutaway_v2` |
| `vio_grid_stay` | proof grid tile (`PROOF_STAY.violet`) | `vio_grid_stay_v2` |
| `violet` (life plate, `work_fable/proof/plates/violet`) | b14 flash, b112 "she sits on the rim", the b85-88 flashes, mapfold, night windows, tile collapse | `violet_v2` (in `work_fable/take2/plates/`) |
| `vio_write` (old) | not shown while `vio_write2` exists | not fixed |

Fine as they are: `vio_pencil` (she draws one pencil out of the bun: two before, one after, one in hand: already canon),
`vio_close`, `vio_release`, `vio_still`, `vio_lookback`, `vio_climb` (empty hands). `vio_release2`: she writes with a pencil at
0-0.9 s (two in the bun), but the film plays it from clip 1.0, where her hands hold the closed notebook; inside the window it is
fine. If the window ever starts before 1.0 it needs the same fix. `pencil_lead` / `pencil_draw` / `page_reveal` show no bun.

Method (no clip regenerated): the pencil removed is the one running lower-left to upper-right (eraser up-right); the one kept runs
tip up-left to eraser down-right, the same one left in her bun at the end of `vio_pencil`. One image edit of a keyframe
(ONE reference: the frame itself) paints it out (`v7_nopencil_write2_a1`; `violet1_a1` for frame 1 and `violet121_a1` for frame 121 of
the life plate, which turns). `bun_pencil_v7.py` registers the edit onto the keyframe, tracks the head ROI per frame (ECC affine,
pencils masked out), finds the up-right pencil per frame by colour and axis, and pastes the tracked clean content into a soft
mask over that pencil only (the kept pencil and the hair around it stay the original video). The life plate's head turn (frames
67-72) fails the keyframe track and is carried frame to frame from the last clean frame instead. Where the tool samples the
bun it stays above the purple collar (ROI y < 185 / 180).

Checks: residual up-right pencil pixels = 0 in all 121 frames of every plate (`bun_track.json`); bun strips every 0.25 s
(`*_bun.jpg`): one pencil, no smear; turn frames one by one (`violet_v2_turn.jpg`, `violet_turn_cmp3.jpg`); frame-to-frame
difference in the bun box is no higher than the original anywhere (no flicker frames; mean 1.48 vs 1.83, 1.69 vs 2.12, 1.91
vs 2.16 for write2, grid_stay, violet). Weak points: `violet_v2` frames 71-74 (clip 2.92-3.04 s, mid-turn) carry a small soft dark
patch at the bun's upper right / left centre where the chained content sits; mid-motion and half a second long. The clean
content is the edit's drawing of the bun, so the hair under the removed pencil is a little softer than the video's lines (visible
only zoomed).

## b122 `c2_lookup_v2` (item 3)

The old plate measured frozen: figure frame-difference energy 0.20 over clip 0.3-3.5, the same as the black paper's own grain
(0.17-0.20); its mouth opens from 4.0 s; and the t1 clip had zoomed out from the still and grown a big patched arm at the right
edge (the still itself never had it; that is why the shot crops left 84 %).

Made: an image edit of the original still `c2_lookup_a1` (one reference) moving its meteor far to the upper right
(`c2_lookup_far_a2`), then two clips from it, both `camera_fixed`, view "none" (the prompt never mentions a sleeve patch), prompt
`ALIVE` (breathing, wind from the right through the hair all through, one blink, a gentle lift of the face, mouth closed and
neutral, the meteor gliding toward her gaze, no other figure): take "v2" with the original still as last frame, take "v2b" with no
last frame. Picked **v2b** as `c2_lookup_v2` (more motion, blink inside the used window); the other is kept as `c2_lookup_v2a`.

`c2_lookup_v2` (`media/gen/t2_c2_lookup_v2b_t1_1c0e8004bb.mp4`), measured on clip 0.3-3.5 (mean abs difference of consecutive
frames, grey, 0-255; paper grain 0.20):

| box | old `c2_lookup` | `c2_lookup_v2` | `c2_lookup_v2a` |
|---|---|---|---|
| figure (x 0-0.50) | 0.20 | **1.46** | 0.97 |
| hair, left strands (x 0-0.16, y 0.2-0.75) | 0.21 | **1.18** | 0.51 |
| torso | 0.19 | 2.12 | 1.45 |
| face box | 0.21 | 1.70 | 1.00 |

- Breathing: the orange chest band rises and falls about 6 px (at 720) peak to peak with a period of about 1.75 s (highest at
  0.5, 2.25, 4.0 s); the old plate's band is flat (within 0.3 px) until it drifts at 4.25.
- Hair: streams and ripples to the left in every quarter second; loose strands cross the ear and cheek.
- Blink: closes 2.96, closed 3.00-3.17, open by 3.25.
- Look-up: her face lifts slowly a little higher over the clip (most visible 3.5-4.0).
- Mouth: closed and neutral in every frame; checked on crops at 0, 0.33, 1.5, 2.5, 3.5, 4.0, 4.33, 4.67, 5.0 (`c2_mouth.jpg`): no
  opening, at most a faint lift at the corners after 3.5 (no grown smile).
- No other figure, arm or hand in any frame (strip `c2_lookup_v2b_t1_1c0e8004bb.jpg`); no patch visible (her right side faces us).
- Framing: like the old clip, the clip does not start on the still: it opens slightly wider (her head at about x 0.27, the gold
  horizon band at y about 0.73), so it matches the old plate's framing closely; the crop/zoom can stay. With no stray arm the
  84 % crop is no longer needed.
- The meteor: one thin violet streak, small round head, short tapered trail (no square), gliding slowly down-left toward her gaze
  at an even speed, never reaching her. Head position (plate fractions x, y), brightest leftmost point in the upper-right sky:

| clip s | 0 | 0.3 | 0.5 | 1.0 | 1.5 | 2.0 | 2.5 | 3.0 | 3.5 | 4.0 | 4.5 | 5.0 |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| x | 0.728 | 0.716 | 0.709 | 0.690 | 0.672 | 0.653 | 0.634 | 0.616 | 0.596 | 0.577 | 0.559 | 0.539 |
| y | 0.186 | 0.195 | 0.201 | 0.217 | 0.228 | 0.243 | 0.257 | 0.271 | 0.286 | 0.299 | 0.312 | 0.329 |

  Speed about 0.038 W and 0.029 H per clip second (doubled at the shot's 2x). It is in the sky from the first frame; it does not
  enter or land, so "arriving near the b123 downbeat" means: at clip 3.5 (the end of the present window) the head is at
  (0.596, 0.286), its closest to her gaze inside the window.

`c2_lookup_v2a` (the take with the still as last frame): less hair motion; breathing is one slow fall and rise (about 4 px); blink at
4.25 (outside 0.3-3.5); its meteor moves about the same path (0.727, 0.186 -> 0.550, 0.285). Not recommended.

## Wiring

Clip times are plate seconds (24 fps, 121 frames). Fractions are of the plate (x/1280, y/720).

| plate id | what it is | replaces | usable clip window | layout notes |
|---|---|---|---|---|
| `vio_write2_v2` | `vio_write2` with one bun pencil (one in the bun, one in her hand) | `vio_write2` (b114-116 `next`, b48 fallback) | as `vio_write2` (0-5.0; b114 clip0 0) | identical framing and timing, frame for frame; the plates_v2 wiring (sky upper left x 0.02-0.30, y 0.05-0.50; notebook x 0.55-0.66, y 0.44-0.55; boots to x 0.38) and the pencil-point / mote positions hold unchanged |
| `vio_cutaway_v2` | copy of `vio_write2_v2` | `vio_cutaway` (b48 `next`) | 0.5-2.5 (one bar) | as `vio_cutaway` |
| `vio_grid_stay_v2` | `vio_grid_stay` with one bun pencil | `vio_grid_stay` (`PROOF_STAY.violet.id`: put `vio_grid_stay_v2` first) | as before (0-5.0) | same framing as the life plate (focus [0.68, 0.35]); the bar-37 swap stays seamless within about 3 px |
| `violet_v2` | the violet life plate with one bun pencil, all 121 frames incl. the turn (turn_t 2.85 kept in meta) | `violet` wherever it is played: b14 flash (clip0 1.2), b112 (clip0 0.5), b85-88 flashes, mapfold, night windows, tile collapse | as `violet` | lives in `work_fable/take2/plates/violet_v2` (not the proof folder): needs an override like `LIFE_SWAP` or a `next` on each use; the grid tile itself is `vio_grid_stay_v2`. Weak: frames 71-74 (2.92-3.04 s) a small soft patch mid-turn |
| `c2_lookup_v2` | main Jade at first light: breathing, hair in wind, blink, slow look-up, mouth closed; the plate's own thin violet meteor | `c2_lookup` (b122) | 0.3-3.5 as now (blink 2.96-3.25 near its end, breath peaks 0.5 and 2.25); or 1.0-4.2 to put the blink mid-shot | **remove `opt.comet`**: the plate's meteor is the only one, head at (0.716, 0.195) at clip 0.3 and (0.596, 0.286) at 3.5 (table above); no stray arm, so the left-84 % crop is optional (zoom 1.19, fx 0, fy 0.5 still fits: meteor stays inside x < 0.84); lyric right x 0.56-0.97 overlaps the meteor's path (x 0.60-0.72, y 0.19-0.29): keep the lyric below y 0.35 or left of it |
| `c2_lookup_v2a` | alternative take (last frame = the original still) | not used | 0.3-3.5 | blink at 4.25 (outside the window); less motion. Kept, not recommended |
