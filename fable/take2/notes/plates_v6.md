# Plates for film v6 (plates agent, 2026-11-15)

Brief: `notes/v6_direction.md` section B, plus three answers from Jade relayed mid-round (below). Specs: `gen/stills.json` (new
ids at the end), `gen/gen_clips.py` (block "Film v6 plates"). Stills `work_fable/take2/stills/<id>_<tag><k>`; clips
`media/gen/t2_<id>_t<k>_<hash>.mp4`; plates via `tools/intake.sh` in `work_fable/take2/plates/<id>/`. Review strips (every 0.25 s,
last second included), crops and the code fixes in `work_fable/take2/dev/v6_plates/`.

## Resume state

DONE (2026-11-15). All thirteen plates exist and are checked on strips; Wiring table at the end. Nothing queued. Open: Jade's eye
on `like_sing0` (likeness), `intuit_violin` (technique) and `det_pad` (the pad's silhouette); a take b of `like_sing0` only if
the director asks (spec `media/gen/specs/t2_like_sing0_a.json`, change the tag). Code fixes made here are re-runnable:
`mbw_fix.py` (b56 patch), `pencil_clean.py` (marks off the paper + tip track), `page_track.py` (page quad).

## Jade's mid-round answers (relayed by the director, 2026-11-15)

1. The car: "the camera is in the driver's seat". She sits in the PASSENGER seat; the camera is at the wheel looking across. No clip
   of her driving was made (and no driving still: her answer made the alternative unnecessary). Stills `car_pass_*`, plate
   `car_confess`.
2. "Go ahead and fix it": the b56 patch. New plate `main_back_wide_v2`.
3. `det_pad` keeps the parenthood message as its caption; the still keeps `det_home_v2`'s framing, so the caption keeps its place.

## Spend

Start of round **$550.02**; close **$568.06** (`tools/gen/spend.py`, list-price estimates). This round **$18.04**: 34 stills
(nano-banana-pro, about $0.134 each) and 12 clips (seedance 2.5, $1.156 each: the ten t1 plus `intuit_piano_b`,
`intuit_violin_b`). The tools' cap constant is still 600 (`tools/gen/cf.py`): about $32 of headroom before it blocks.

## Notes per plate

### `vio_grid_stay` (no generation)
`vio_write2` (plates v2: head bowed over the notebook, writing, all 5 s, no turn) is the same scene as the violet life plate
(`work_fable/proof/plates/violet`, the grid tile). Registered on frame 1 (ORB + similarity): scale 1.016, rotation 0.33 deg, shift
3, 2 px at 1280. Plate = all 121 frames of `vio_write2` warped by that transform onto the tile's framing (residual after the warp:
scale 1.005, 3 px). Strip `vio_grid_stay.jpg`: head down and writing in every frame 0-5.0 s, never turns; patch on the arm nearer
the viewer (her left), as in the life plate.

### `vio_cutaway` (no generation)
A copy of plate `vio_write2` at its own framing (the full-frame dish shot), writing head down; no running anywhere.

### `main_back_wide_v2` (no generation)
The audit fault: in `main_back_wide` the lettering `1420 MHz` is printed on the orange band of her RIGHT arm (picture right), and
there is no round patch at all. Fixed in code on the old clip's own frames, so framing and time structure are identical
(`mbw_fix.py`): the figure is tracked frame to frame (ECC affine on the figure box); the right band's label is painted out to flat
band orange (row fill between the band's orange pixels, up to the sleeve outline); a round white patch with a black ring and
`1420` / `MHz` in black is drawn on her LEFT upper-arm band (picture left), radius 25 px at frame 1, moved and scaled with the track
(`patch_track.json`: t, scale, x, y). Checked: strip (`main_back_wide_v2.jpg`) and tracked crops at 0, 0.5, 1, 1.5, 2, 2.5, 3, 4,
5 s (`main_back_wide_v2_crops.jpg`): the patch stays on the band 0-5.0 s, no drift; the right band is plain orange, no remnant. The
patch is flat (no fold shading) and slightly crisper than the video texture in the first second.

### Stills picked (one reference each)

| still | reference | verdict |
|---|---|---|
| `page_wide_a1` | `vio_write2_a1` (edit: pages black) | pass: both pages solid black, thin white edge, the rest unchanged. a2 also passed |
| `page_close_a1` | `page_wide_a1` | pass: the same notebook from above her shoulder, two empty black pages, pencil tip on the right page |
| `pencil_lead_a1` | `vio_write2_a1` (medium only) | pass: black paper, hand and yellow pencil from the upper right, white cuff with violet band. a2 rejected (pasted the seated figure in) |
| `pencil_draw_a1` | `vio_write2_a1` | pass: pen grip, empty black page, violet at the shoulder. a2 rejected (pencil held wrongly) |
| `det_pad_a1` | `det_home_v2_a1` (edit: orange -> pad) | pass with a caveat: pale-grey dual-stick pad, buttons blank, no logo or lettering, warm hand, pink cuff; the dual-stick silhouette resembles common console pads (no brand marks drawn) |
| `pad_handover_a2` | `det_pad_a1` | pass: her hand from the left, a small child's two hands (warm, yellow jumper cuffs) from the right; hands only; the pad seen from behind, no buttons at all. a1 had a PS-like button face: not used |
| `car_pass_road_a2` | character sheet | pass: passenger seat, three-quarter, looking ahead, the sheet's face, hair down, patch on her LEFT arm (nearer the camera), windows flat black, nobody else, no wheel. a1 already faced the camera |
| `car_pass_look_a1` | `car_pass_road_a2` (edit: head to camera) | pass: front three-quarter, closed mouth, almost-smile, same face |
| `intuit_piano_b_a1` | `day_jade_a1` (medium) | pass: hand at the jacket's ribbed hem, curved fingers, fingertips down. Rejected: `intuit_piano_a1/a2` (hand on the belt), `_b_a2` (hand in the air) |
| `intuit_violin_c_a2` | `day_jade_a1` | pass, Jade to judge: thumb under the right forearm at the wrist, four fingers arched over the top, fingertips down, two hands only. Rejected: `intuit_violin_a1` (drew a fingerboard), `_a2` (a grab), `_b_a1/a2` (flat fingers, an extra hand-shape), `_c_a1` (three hands) |
| `intuit_stance_fix_a1` | `intuit_stance_a2` (edit: rear foot) | pass with a caveat, below |

`intuit_stance` against the gong bu reference. No photograph of a bow stance was found on Wikimedia Commons; checked against the
standard description (en.wikipedia "Wushu stances", Gong Bu: lead foot straight ahead, lead knee bent, rear leg straight, rear foot
out 45 degrees, rear heel down, weight forward). `intuit_stance_a1/a2` and `intuit_stance_c_a1/a2`: the rear foot points BACKWARD:
rejected. `intuit_stance_fix_a1` and the clip's hold: front foot flat, toes forward (left); front shin about vertical; rear leg
straight; rear foot flat, heel down, toe pointing forward (checked zoomed at clip 3.0 s). Weak point: the front thigh slopes about
45 degrees (a high stance, not the low competition stance with the thigh level) and the wide trousers hide the knee. The accepted
`stance_bow_a1` was looked at as a source instead: its rear foot is ambiguous and its front trainer has a swoosh-like mark.

### Clips (checked on strips every 0.25 s; crops where noted)

- `page_reveal` t1: ACCEPTED. One continuous pull-back from the page to the dish (fastest 0.5-2.5 s, still easing at 4.75); the
  pages solid black and empty in every frame; patch on her left arm; the last second holds the wide (matches `page_wide_a1`).
  The notebook-holding hand swaps sides of the picture during the move (1.25-2.25 s) as the camera swings; reads as the camera's
  move. Page outline per frame: `plates/page_reveal/page_track.json` (quad in plate fractions + area): it follows the LEFT page
  while the spine is resolved (0-1.75 s), then both pages as one (from about 2.0 s, where the quad jumps); corner order varies.
  Samples: 0 s left page about x 0.16-0.57, y 0.15-0.93; 3 s x 0.41-0.60, y 0.36-0.72; 5 s x 0.49-0.60, y 0.41-0.62 (area 0.85%).
- `pencil_lead` t1: ACCEPTED after a fix. A drawing hand: quick hatching movements, the hand travelling up and to the left
  (tip from x 0.56, y 0.58 at 0 s to x 0.45, y 0.21 at 5 s). The model drew faint grey hatch marks on the paper despite the prompt;
  they are inpainted off in the plate's `frames/` (`pencil_clean.py`: thin bright strokes, top-hat, inside the black paper, away
  from the hand and the graphite cone); the clip's own frames are kept in `frames_raw/`. Strip `pencil_lead_clean.jpg`: clean; a
  faint warm smudge below the tip at 2.5-4.25 s. Tip track `tip_track.json` checked with dots at 0, 1.25, 2.5, 2.75, 3.75, 5 s.
- `pencil_draw` t1: ACCEPTED after the same fix. Writing on the black page with small movements (tip x 0.42-0.50, y 0.25-0.33);
  left hand holds the notebook; hair stirs. Residue: a few small grey ticks beside the tip at about 1.25, 2.5 and 5.0 s (within
  about 25 px of the tip, where the gold strokes start). Tip track checked with dots.
- `car_confess` t1: ACCEPTED. Looks ahead 0-3.1 s (blinks at 0.5 and 3.1), turns to the camera 3.25-3.75 s, holds the closed-mouth
  almost-smile 3.75-5.0 s; face crops every 0.125 s (`car_confess_t1_faces.jpg`): the smile does NOT grow in the last second, no
  teeth. Nobody else, no reflection, no hands on a wheel. Faults: the turn comes later than asked, so the held look is only about
  1.25 s; a band of passing light crosses the window area at 0.75-1.5 s (the windows are otherwise flat black); her seat belt runs
  from her inboard (left) shoulder, which is the wrong side for a passenger in a left-hand-drive car (visible all through).
- `det_pad` t1: ACCEPTED. Her thumb works the stick and buttons, fingers shift on the grip, the pad tilts a little; hand warm in
  every frame; buttons blank at 2.5 s (zoom `det_pad_t1_zoom.jpg`); the bulb's chalk rays flicker strongly frame to frame.
- `pad_handover` t1: ACCEPTED. 0-2.4 s the three hands hold the pad together; she lets go 2.5 s; the child's hands draw it out
  right by 3.25 s; her open hand stays 3.25-5.0. Child hands only, warm, no face or body ever.
- `intuit_piano`: take b ACCEPTED (`t2_intuit_piano_b_t1`), t1 kept unused. The fingers ripple on the hem in turn all through
  (mean frame difference in the hand box 4.95; t1 3.0, too small to read at speed). The lifts are still modest and the fingers
  fairly flat: reads as fingers playing, not a concert pianist's arch.
- `intuit_violin`: t1 ACCEPTED (`t2_intuit_violin_t1`), take b rejected. t1: thumb under, the fingertips lift and press one at a
  time with small lifts, on the wrist end of the forearm next to the cuff (motion 1.1: subtle). Take b lifted the fingers high and
  splayed them (0-3 s), which reads as wrong technique, then froze. Jade judges violin technique: this is the plate I am least sure
  of.
- `intuit_stance` t1: ACCEPTED with the stance caveat above. 0-1.25 s landing: straps swinging, a grey dust haze over the trouser
  legs (0.25-1.25, looks like smoke more than dust); settled from about 1.5 s; holds still to 5.0 with both feet planted. The
  "quiet look down" of the brief is not in the plate (feet only, as advised).
- `like_sing0` take a: made (local only, `work_fable/take2/plates/like_sing0`, never committed). Method as `like_sing1`: the
  pencil trace of the Orbital daylight relight still (`media/gen/refs/like_day_2048.jpg`, the same trace like_sing1 used) plus the
  song 109.0-114.0 (`media/gen/refs/Merge_kd_0109.000_5s.mp3`). She sings "Merge" (mouth opens 0.50; voice 0.31), closes and
  reopens through "and return" (closures 1.5, 1.75-2.0, 2.25-2.4), then a steady "ahh" opening wider to the end. Mouth after voice
  by about +0.1 to +0.15 s at the start (not measured on every word). Blinks at about 0.25 and 2.0 s (both eyes). Likeness: on
  stills she stays the trace (glasses, centre parting, no beautifying, no redraw) through the whole clip; whether it looks like
  Jade is the director's and Jade's call, not mine. One take only so far; take b on request.

## Wiring

Clip times are plate seconds (24 fps, 121 frames). Fractions are of the plate (x/1280, y/720). The type areas were read by eye from
the strips and single gridded frames (car at 4.5 s), not measured over every frame: check them against the clip's own frames.

| plate id | what it is | brief | usable clip window | where type can sit | the compositor must know |
|---|---|---|---|---|---|
| `vio_grid_stay` | the rare-earth tile, head down writing, never turns (vio_write2 registered onto the violet life plate) | A2, B1 | 0-5.0 (any 1.9 s; ping-pong or 0.5x if the tile needs longer) | as the tile now | same framing as the life plate `violet` (focus [0.68, 0.35]); swap at the bar-37 turn is seamless within about 3 px |
| `vio_cutaway` | her at the dish writing, full frame (copy of vio_write2) | A3, B2 | 0.5-2.5 (one bar) | clear sky upper left x 0.02-0.30, y 0.05-0.50 (plates v2 wiring) | an existing clip, no new generation; same picture family as the grid tile |
| `pencil_lead` | extreme close: her hand and the yellow pencil on black paper, hatching, travelling up-left | A5 (2:12), B3 | 0-5.0 | the left half x 0.0-0.40 stays empty black paper until the hand passes | `tip_track.json` per frame for the gold strokes; marks inpainted (raw in `frames_raw/`); faint smudge near the tip 2.5-4.25; violet cuff band top right |
| `pencil_draw` | over her shoulder: hand drawing on the black page of the notebook | A5 (insert in the drop), B3 | 0-5.0 | the black page x 0.08-0.70, y 0.08-0.92 is empty (strokes go there) | `tip_track.json`; small grey ticks beside the tip at 1.25, 2.5, 5.0 s; tip moves little (x 0.42-0.50) |
| `page_reveal` | pull-back from the black notebook page to her at the dish under the Milky Way | A5 (3:00 reveal), B4 | 0-5.0 (fastest 0.5-2.5; wide from about 4.0) | in the wide end the sky upper left x 0.02-0.35, y 0.03-0.40 (Milky Way runs through it) | `page_track.json` quad per frame: LEFT page 0-1.75 s, both pages from about 2.0 s (jump there: smooth or fit a homography); pages black and empty in every frame |
| `det_pad` | her warm hand playing a plain grey gamepad by the bulb, home pastel | A4 (2:01), B5 | 0-5.0 | as `det_home_v2` (same framing; caption where the orange insert had it) | caption = the parenthood message (Jade); pad buttons blank, no logo; silhouette is the common dual-stick shape |
| `pad_handover` | her hand passes the pad into a small child's hands, hands only | A6 (about 3:19.9), B6 | one bar inside 1.6-3.6 (the let-go 2.5, gone 3.25) or 2.0-4.0 to end on her open hand | dark blue paper right of the bulb x 0.35-1.0, y 0.0-0.22 | child never shown beyond hands and cuffs; all hands warm |
| `intuit_piano` | fingers playing on the jacket hem, cel on white, daylight (take b) | A7a, B7 | 0-5.0 (any 2-3 beats) | white paper right x 0.62-0.98, y 0.05-0.55 (pale blue strokes at the top) | no chip or label over her (brief); hand stays in place; t1 clip kept, unused |
| `intuit_violin` | left hand violin fingering on her right forearm, cel on white (t1) | A7b, B7 | 0.5-3.5 (most finger movement 1.5-3.0) | white paper above the arms x 0.05-0.95, y 0.0-0.18 and below the arm x 0.05-0.55, y 0.75-1.0 | subtle motion; Jade to judge technique; take b (wild fingers) not used |
| `intuit_stance` | feet and lower legs land in a bow stance at a kerb, cel on white | A7c, B7 | 1.0-4.0 (landing settles 1.25; haze to 1.25) or 0.4-3.4 to keep the landing | white paper above the kerb between the legs x 0.40-0.62, y 0.0-0.55 is narrow; the sky strip at the top | high stance (front thigh about 45 deg); "look down" not in the plate |
| `car_confess` | drawn main Jade in the passenger seat, night, black paper; looks ahead, turns to camera, almost-smile | A8, B8 | 1.5-5.0 (turn 3.25-3.75, hold 3.75-5.0) | windows for the road dashes and stars: x 0.02-0.55, y 0.05-0.47 and x 0.65-0.93, y 0.05-0.33; camera's line lower left x 0.02-0.26, y 0.62-0.95 (dark door panel); her line upper left in the window area or right x 0.80-0.98, y 0.35-0.60 | hold is only 1.25 s (slow the last second or ping-pong); passing-light band crosses the window 0.75-1.5; seat belt on the wrong shoulder for LHD; driving variant not made |
| `main_back_wide_v2` | b56 wide from behind, patch moved to her LEFT arm in code | C3, Jade: "fix it" | as `main_back_wide` (0-3.0) | as before (top) | identical frames and timing to `main_back_wide`; wire wherever `main_back_wide` is used |
| `like_sing0` | LOCAL ONLY. The real Jade (pencil trace) sings "Merge... and return..." | A4 (1:49.3-1:52.2), B9 | song-locked: clip = song - 109.0, so the shot 109.3-112.2 = clip 0.3-3.2 | as `like_sing1` (her face centre-left x 0.35-0.55; right of her x 0.62-0.98 landscape) | `meta.json` `t0_song` 109.0; measured mouth after voice +0.1 to +0.15 s at "Merge" (retime with `retime_sung.py` if needed); likeness unconfirmed: falls back to the present inserts and the card with `likeness=0` |
