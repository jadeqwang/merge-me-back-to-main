# Plates for film v6 (plates agent, 2026-11-15)

Brief: `notes/v6_direction.md` section B, plus three answers from Jade relayed mid-round (below). Specs: `gen/stills.json` (new
ids at the end), `gen/gen_clips.py` (block "Film v6 plates"). Stills `work_fable/take2/stills/<id>_<tag><k>`; clips
`media/gen/t2_<id>_t<k>_<hash>.mp4`; plates via `tools/intake.sh`. Review strips (every 0.25 s, last second included) and crops in
`work_fable/take2/dev/v6_plates/`.

## Resume state

IN PROGRESS. Done without generation: `vio_grid_stay`, `vio_cutaway`, `main_back_wide_v2`. Stills done and picked (below).
Ten clips submitted 2026-11-15 (t1 of page_reveal, pencil_lead, pencil_draw, car_confess, det_pad, pad_handover, intuit_piano,
intuit_violin, intuit_stance; like_sing0 take a), job ids `mergemain/t2_<id>_t1-<hash>` in `gen.py status`. Next: collect, strip,
intake, wiring rows; like_sing0 take b only if a fails.

## Stills picked (one reference each)

| still | reference | verdict |
|---|---|---|
| `page_wide_a1` | `vio_write2_a1` (edit: notebook pages black) | pass: both pages solid black with a thin white edge, rest unchanged (her profile shows a little more than in vio_write2). a2 also passed |
| `page_close_a1` | `page_wide_a1` | pass: the same notebook from just above her shoulder, two empty black pages, pencil tip on the right page, left hand fingers on the edge. a2 also passed |
| `pencil_lead_a1` | `vio_write2_a1` (medium only) | pass: black paper, hand and yellow pencil from the upper right, white cuff with violet band, left two thirds empty. a2 rejected (pasted the seated figure in) |
| `pencil_draw_a1` | `vio_write2_a1` | pass: pen grip, black empty page, violet at the shoulder. a2 rejected (pencil held wrongly) |
| `det_pad_a1` | `det_home_v2_a1` (edit: orange -> pad) | pass with a caveat: plain pale-grey dual-stick pad, buttons blank, no logo or lettering, warm hand, pink cuff; the generic dual-stick silhouette resembles common console pads (no brand marks drawn). Framing as det_home_v2, so the caption keeps its place |
| `pad_handover_a2` | `det_pad_a1` | pass: her hand (pink cuff, warm) holds the pad from the left, a small child's two hands (warm, yellow jumper cuffs) take it from the right; hands only. The pad is seen from behind: no buttons at all. a1 showed a PS-like button layout: not used |
| `car_pass_road_a2` | character sheet | pass: passenger seat, three-quarter view looking ahead, the sheet's face, hair down, seat belt, patch on her LEFT arm (nearer the camera), windows flat black and empty, nobody else, no wheel. a1 already faced the camera: not used |
| `car_pass_look_a1` | `car_pass_road_a2` (edit: head turned to camera) | pass: front three-quarter, closed mouth, almost-smile, same face |
| `intuit_piano_b_a1` | `day_jade_a1` (medium) | pass: her hand at the jacket's ribbed hem, curved fingers, fingertips down, a pianist's hand. First try `intuit_piano_a1/a2` and `_b_a2` rejected (hand on the belt / in the air) |
| `intuit_violin_c_a2` | `day_jade_a1` | pass, Jade to judge: thumb under the right forearm, four fingers arched over the top with fingertips down, two hands only. Rejected: `intuit_violin_a1` (drew a fingerboard), `_a2` (a grab), `_b_a1/a2` (flat fingers, a third hand-shape), `_c_a1` (three hands) |
| `intuit_stance_fix_a1` | `intuit_stance_a2` (edit: rear foot) | pass with a caveat, see below |

`intuit_stance` against the gong bu reference. No photograph of a bow stance was found on Wikimedia Commons; checked against the
standard description (en.wikipedia "Wushu stances", Gong Bu: lead foot straight ahead, lead knee bent, rear leg straight, rear
foot out 45 degrees, rear heel down, weight forward). `intuit_stance_a1/a2` and `intuit_stance_c_a1/a2`: the rear foot points
BACKWARD (toe toward the picture's right): wrong, rejected. `intuit_stance_fix_a1`: front foot flat, toes forward (left); front
shin about vertical from the knee down; rear leg straight; rear foot flat, heel down, toe pointing forward (left). Weak point: the
front thigh slopes at about 45 degrees (a high stance, not the low competition stance with the thigh level), and the wide trousers
hide the knee. The accepted `stance_bow_a1` was looked at as a source instead: its rear foot is ambiguous and the front trainer has
a swoosh-like mark, so not used.

## Jade's mid-round answers (relayed by the director, 2026-11-15)

1. The car: "the camera is in the driver's seat". She sits in the PASSENGER seat; the camera is at the wheel looking across. No clip
   of her driving. Ids for this framing: `car_pass_*` stills, plate `car_confess`.
2. "Go ahead and fix it": the b56 patch. New plate `main_back_wide_v2`.
3. `det_pad` keeps the parenthood message as its caption; leave room for it where the orange insert had it.

## Spend

Start of round: **$550.02**. After stills (30 x about $0.134) and ten clips submitted ($1.156 each): **$565.75** (round $15.73).
Note: the tools' cap constant is still 600 (`tools/gen/cf.py`); about $34 of headroom before it blocks.

## Notes per plate

### `vio_grid_stay` (no generation)
`vio_write2` (plates v2: head bowed over the notebook, writing, all 5 s, no turn) is the same scene as the violet life plate
(`work_fable/proof/plates/violet`, the grid tile). Registered on frame 1 (ORB + similarity): scale 1.016, rotation 0.33 deg, shift
3, 2 px at 1280. Plate = all 121 frames of `vio_write2` warped by that transform, so it sits on the tile's framing (residual check
after the warp: scale 1.005, 3 px). Strip `dev/v6_plates/vio_grid_stay.jpg`: head down and writing in every frame 0-5.0 s, never
turns; patch on the arm nearer the viewer (her left), as in the life plate.

### `vio_cutaway` (no generation)
A copy of plate `vio_write2` at its own framing (the full-frame dish shot). One bar of writing: use clip 0.5-2.5 s.

### `main_back_wide_v2` (no generation)
The audit fault: in `main_back_wide` the lettering `1420 MHz` is printed on the orange band of her RIGHT arm (picture right), and
there is no round patch. Fixed in code on the old clip's own frames, so the framing and time structure are identical
(`dev/v6_plates/mbw_fix.py`): the figure is tracked frame to frame (ECC affine on the figure box); the right band's label is
painted out to flat band orange (row fill between the band's orange pixels, up to the sleeve outline); a round white patch with a
black ring and `1420` / `MHz` in black is drawn on her LEFT upper-arm band (picture left), radius 25 px at frame 1, scaled and moved
with the track (`patch_track.json`: t, scale, x, y). Checked: strip every 0.25 s (`dev/v6_plates/main_back_wide_v2.jpg`) and tracked
crops at 0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5 s (`main_back_wide_v2_crops.jpg`): the patch stays on the band from 0 to 5.0 s, no drift;
the right band is plain orange with no remnant. The patch is drawn flat (no fold shading); at 1080p in the first second it reads
as a crisp sticker next to the softer video texture, acceptable for a flat cel.
