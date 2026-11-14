# Plates for film v3 (plates agent, 2026-11-14)

Brief: `notes/v3_direction.md` section B, plus coordinator items 8 (band_v2), 9 (main_face_v2 / main_split_v2), 10 (wushu_v3),
11 (main_light_v2), and the change to item 7 (hero_paper_v2 sings). Specs: `gen/stills.json` (new ids at the end), `gen/gen_clips.py`
(block "Film v3 plates": new `OVR` dict for whole-prompt overrides, used by `main_split_v2` and `band_v2`). Stills
`work_fable/take2/stills/<id>_<tag><k>`; clips `media/gen/t2_<id>_t<k>_<hash>.mp4`; plates via `tools/intake.sh`. Review strips (one
frame every 0.25 s, last second included) `work_fable/take2/dev/v3_plates/<id>_t<k>.jpg`. Building reference photos (Wikimedia
Commons, one per building, licence in each `SOURCE.json`) in `work_fable/take2/v3refs/<life>/`.

## Spend

- Start: $525.40 (whole project). After first group of stills + 8 clips: $539.51.
- Close: **TOTAL $541.82 of $600 cap** (whole project, list-price estimates). My lines: $16.42 (19 stills, 12 clips including the
  rejected `main_split_v2` and `main_light_v2` take 1). No cap change was needed.

## Items

**1. float_hand_v2** (b64). First frame `float_hand_a1` (the v1 still), last frame `float_hand_close_a1` (edit of it: the light IN
the palm, fingers loosely closed, glow between them; passed first try). Clip t1 ACCEPTED: the light sits at the fingertips 0-1.25 s,
is in the palm at 1.5 s, fingers curl round it 2.0-2.75 s, glow between the fingers, held to 5.0. The model drifts the framing in a
little over the first 1.25 s (smooth, no jump). The drift "across the water" is short: the first still already had the light at the
fingertips. **The light settles in the palm at 1.5 s.**

**2. ins_violin_v3**. Two stills in parallel. `ins_violin_v3_a1` (one ref: a crop of the orchestra still `orch_2_a1` round the
centre violinist, `v3refs/orch_2_violinist.jpg`) and `ins_violin_v3s_a1` (character sheet, same wording). Audit (zoomed on the
contact point): a1: violin on her LEFT shoulder, jaw on the chinrest, scroll to picture right; left hand round the neck with curved
fingers on the fingerboard, wrist straight; bow held at the frog with bent thumb and curved little finger; bow hair on the strings
just on the fingerboard side of the bridge, between bridge and fingerboard end, about 75 degrees to the strings. v3s put the
contact at the end of the fingerboard (borderline) and printed a readable patch: rejected. Framing chin to waist, lips only.
Prompt wording that worked: the violinist checklist in `stills.json` `ins_violin_v3` (VIOLIN block). Clip t1 ACCEPTED: down-bow
0-2.25 s (the right hand travels down-left, the bow slides along its length so the tip comes in toward the strings, the contact
stays between bridge and fingerboard), bow change 2.25-2.5, up-bow 2.5-4.75; left fingers stay curved on the fingerboard; always
two hands, one bow. Lips closed. A ring emblem on the front of the jacket (the sheet's front dot), no text.

**3. drop_hero_5_v3** (b103 beat 3). The stance the hatched crowd lands in (v7 frames 5330-5350 = 177.7-178.3 s, under the
insert): a drop stance (pubu), facing the camera, the STRAIGHT leg out to picture LEFT along the ground, the BENT leg on picture
RIGHT in a deep squat, foot flat (same as `stance_drop_a1`). Still `drop_pubu_a1` (one ref `stance_drop_a1`, restyled to gold on
black, low camera on the legs): passed. First frame `drop_air_a2` (edit of drop_pubu: a split second before, both feet in the air,
legs opening; a1 had the feet touching, rejected). Clip t1 (first `drop_air_a2`, last `drop_pubu_a1`, camera fixed) ACCEPTED:
legs come down 0-0.6, **feet strike at 0.67 s (frame 16)**, gold dust bursts, stance exact and still from 1.0 s, dust settles by
2.5. The clip is drawn on twos (motion every other frame). Gold strap colour (not orange) in this medium.

**5. vio_empty** (still-only plate). Edit of `vio_still` plate frame f_0121 (`vio_empty_a1`): she was removed cleanly, but the model
also redrew the dish slightly (visible in a difference image). Final still `vio_empty_c1` = the plate frame's own pixels outside her
silhouette and the edit's pixels inside a dilated, feathered union of the `kit/vio_still` matte over all 121 frames. Alignment:
mean abs difference to f_0121 outside the figure 4.1 (of 255), shift 0.0 px. NOTE the plate is not static: it pulls back. Scale of
plate frame -> vio_empty (ORB affine): f1 0.870 (tx 84, ty 47 px at 1280x720), f30 0.900, f60 0.932, f90 0.965, f105 0.985,
f115 0.995, f121 1.002. So vio_empty matches the plate's last frames exactly; to cross earlier, scale vio_empty by 1/s about the
same transform or cross from about frame 105 on.

**10. wushu_v3**. Edit of `wushu_v2_a2c` (one ref): head turned three-quarter, the film's face in woodblock line. a1/a2 got the large
eyes but a blunt straight fringe; a2 looked along the fist. Third attempt `wushu_v3h_a1` = edit of a2: centre parting, curtain locks,
forehead clear: PASSED (judged beside `main_face`: large dark eyes, soft cheeks, small nose, centre-parted hair; patch on her left
arm, picture right; patch text garbled, not readable). Clip t1 ACCEPTED: re-chambers 0.33-0.75 s, **punch lands 1.40 s (frame
33-34)**, 0.4 s later than wushu_v2's 1.0; teammates punch with her. She punches with her LEFT (patched) arm (a reverse punch, torso
turning; correct for the bow stance and keeps the patch on the left); in the hold her extended arm covers her chin, the eyes stay
visible. Blink at about 4.5 s. Hold still 1.75-5.0.

**7 (changed). hero_paper_v2** (b41-42, sings "Merge me back to main"). Still `hero_paper_a2` (the v1 still, lips closed) + audio
`media/gen/refs/Merge_kd_0069.200_5s.mp3` (song 69.2-74.2). No still edit was needed: the model opened the mouth. Clip t1
ACCEPTED: sprints at the lens all through, framing held (full length, about 0.9 of the height), hair streaming; the orange line
under her feet grows into a short orange road from about 0.5 s. Mouth (clip t = song - 69.2): open on "Merge" from 0.5-0.62 s (the
vowel is at 69.65 = 0.45), the lips close for the "m" of "me" at 2.62-2.75 (word 2.62), open on "back" 2.88-3.25, round on "to"
3.5 (word 3.43), open on "main" from 3.75, closes at about 4.5 (song 73.7, after the shot). **Lag about 0 (+0.1 at most); one lag
fits, no retime.** `meta.json`: `t0_song 69.2`, `lag_s 0`.

**9a. main_face_v2** (b17, sings "I split myself"). Still `main_face_a1` + audio `Merge_kd_0027.600_5s.mp3` (song 27.6-32.6). Clip t1
ACCEPTED for the shot window: open on "I split" 1.0-1.25 (words 1.07-1.55), lips closed for the "m" of "myself" 1.5-1.62 (word
1.56), open on "-self" 2.0-2.25, closed for "th" 2.75 (word 2.83), "ways" open and round 3.9-4.5. **Lag about 0 (-0.05 by the lip
closures); one lag fits, no retime.** Lips part slightly from 0.12 s (a breath before "I"). Eyes open in the shot window; a wink at
3.5 s (outside the window used: clip 0.49-2.22). `meta.json`: `t0_song 27.6`.

**9b. main_split_v2** (one attempt): REJECTED. First `main_split1_e1`, last `main_split4_a1`, audio from 29.3. She stays one figure
to 2.5 s, then two at 2.75 and four at 3.0 in a jump (the current clip: two by 1.0, four apart by 2.8, stepping out). Mouths do
move. The film keeps `main_split`. Clip kept at `media/gen/t2_main_split_v2_t1_3b1ffa9260.mp4`, not intaken.

**11. main_light_v2**. Look at v1: the hands are frozen; the only motion is the push-in, and the light only appears at 2.25 s. t1
(locked camera): the light kindles at 0.25 s (bright by 0.5); the hands move (optical flow 3-6 px per 0.25 s) but only from 1.5 s:
no 1.75 s window has both. Take 2 (stronger wording: movement from the first frame, fingers part to let the light out, hands lift
at 2 s; the first version of that prompt was 2020 characters and the catalog refused it: the limit is 2000) ACCEPTED and intaken:
the hands move from 0.25 s and keep moving in waves (open wider 0.25-0.5, close round the light 1.0-1.5, lift 2.0-2.5, shift
3.25-3.75; optical flow up to 30 px per 0.25 s), each hand five fingers. Trade-off: in take 2 the light is already a small point at
frame 0 and its glow swells over the palms 0.25-0.5 s (it does not kindle from nothing; take 1 did, at 0.25 s, but its hands were
still until 1.5 s). Chose take 2 because the note was about the hands. **Best 1.75 s window: 0.0-1.75** (glow swells 0.25-0.5,
hands open and close round it). Take 1 kept as a clip only (`media/gen/t2_main_light_v2_t1_4ec9453f9f.mp4`).

**8. band_v2** (life plate, replaces `band` everywhere). The old band plate (`work_fable/proof/plates/band`, clip
`pf_band_t3`): a club with a crowd packed in front and a van seen through the open back door: it reads as a club gig, not
Hacker Dojo (strip `dev/v3_plates/band_old_pf_t3.jpg`). Structure of the old clip: sings and strums 0-2.5 s, turns ONLY her head
over her left shoulder from about 2.5, motion peak 2.62, settled 3.3, holds; `turn_t` 2.6; first frame `work_fable/proof/refs/band.jpg`,
last frame `work_fable/proof/turns/band.jpg`. New first frame `band_v2_a2` (edit of the old first frame, one ref: the three musicians
kept, the room changed to a hackerspace: truss ceiling with ducts and strip lights, whiteboards with unreadable scribbles,
folding tables with laptops, soldering iron and wire, office chairs, a closed roll-up door, three people watching, two with
laptops; no bar, no stage, no drinks, no signs). `band_v2_a1` lost the second bandmate: rejected. Turn frame `band_v2_turn_a1` =
edit of a2 (head turned, the film's face): the face matches the old approved turn frame closely. Clip t1 (first a2, last turn,
the proof's own prompt structure) ACCEPTED: sings and strums 0-2.5, head turn from 2.5 (motion peak 2.58, as the old 2.62),
settled 3.6 (old 3.3, so the look arrives 0.3 s later), holds to 5.0. `meta.json`: `turn_t 2.6` (same as the old plate),
`focus [0.32, 0.35]`. **Her side of the frame is LEFT** (x 0.08-0.45; the old plate counted as 'right' in `lives.js`), so type goes
right; but the right side is a busy room (whiteboards, tables); the calmest area is the ceiling band x 0.5-1.0, y 0.0-0.18.

**4. vio_wide_v2**. Same still `vio_wide_a1`. Clip t1 ACCEPTED: the model reframed as it did for v1 (figure about 0.15-0.2 of the
height, not one eighth), but held it: she runs 0-1.5 s (arms pumping), jogs 1.5-2.5, walks from about 3.0 to 5.0, moving left from
x 0.73 to x 0.49. Track (every 0.25 s; her centre x and feet y, feet from a fit of the violet line `y = 0.1288 x + 510.3` px) in
`work_fable/take2/plates/vio_wide_v2/track.json`. NOTE the plate's own violet line runs ahead of her to x 0.31 (and to the right
edge behind her): to make the lane end at her feet, mask the drawn line left of her feet.

**7. wave_run_v3**. Same still `wave_run3_knees` (the take 2 still). Clip t1 ACCEPTED: sprints at the lens all through, framing held
knees-up, patch on her left arm (picture right), one face. Expression: calm and slightly smiling 0-1.25 (not as "set" as asked),
a blink at 1.5, **glance up and back over her shoulder 1.75-2.5** (profile at 2.25), forward again 2.75, **open smile from 3.25**
to the end (teeth showing, glad). The wave's crest breaks into white spray from 2.75, largest 3.5-5.0.

**6. Facades** (`facade_<life>_v2`, still-only plates, cut-outs `kit/facade_<life>_v2` by `matte.py`). One reference photo each
(Wikimedia Commons; `v3refs/<life>/SOURCE.json` has title, URL, licence): Roble Gym 2013 (`Roble Gym Stanford April 2013 002.jpg`),
Frances Searle Building (two students in the doorway painted out of the ref before use), Stanford University Medical Center 05 (Stone's
concrete key-pattern screens), Hangar One "Last Look ... (cropped)" (the black-and-white skinned hangar; the "Sept 2012" photo was
the bare frame with a crowd, not used), Hacker Dojo Mountain View 2012 (140 S. Whisman; the logo sign blanked in the ref). All
passed first try and read as their buildings: Roble's three arched windows and gables in woodblock (ochre walls, coral roof);
Searle's ribbed brutalist masses and glass top on graph paper; the key-pattern screen bays on ivory (fills more of the height than
the others: about 0.92, scale it down); Hangar One long and whale-backed in grey-teal airbrush with one blue bin as accent; the
low Whisman unit with red doors and a guitar case in risograph. `facade_home_v2`: no reference; a cut-away modern living room in
chalk on dark blue (sofa, coffee table with controllers, TV glowing with colour only, floor lamp, rug, plant, rose cushions), wider
than tall. No model-drawn text on any.

## Wiring

| plate id | replaces (shot) | clip range (s) | beat moment | type room (frame fractions, 1280x720) |
|---|---|---|---|---|
| `float_hand_v2` | `float_hand` b64 | 0.9-2.6 (1.7 s): light at the fingertips, into the palm, fingers close | **light settles in the palm at 1.5 s**; fingers closed by 2.5-2.75 | left half x 0.02-0.45 is black water with the pink line at y 0.48; upper band y 0.0-0.25 clear |
| `ins_violin_v3` | `ins_violin` (beat 3 of b77-80 insert) | 0.0-2.25 one down-bow; 2.5-4.75 up-bow | bow change 2.25-2.5 s (put a downbeat at 0.0 or 2.5) | upper right x 0.62-1.0, y 0.0-0.35 (black) |
| `drop_hero_5_v3` | `drop_hero_5_v2` b103 beat 3 - b104 | 0.4-2.0 (or 0.5-1.4 for the half bar) | **feet strike at 0.67 s** (frame 16): put it on b103 beat 3 (177.79), i.e. clip0 about 0.67 at the cut, or start 0.4 to see the fall | upper half y 0.0-0.4 black |
| `wushu_v3` | `wushu_v2` (life plate b30, the b12 flash, and wherever wushu_v2 is used) | 1.0-3.0 puts the landing at 0.4 s into the slot; flash 1.35-1.65 | **punch lands 1.40 s** (v2 was 1.0: add 0.4 to every clip0 that used wushu_v2) | plain wall x 0.40-0.75, y 0.02-0.30; floor y 0.85-1.0 |
| `hero_paper_v2` | `hero_paper` b41-42 (69.7-73.2) | lay clip 0 at song 69.2 (so the shot is clip 0.5-4.0) | mouth already open on "Merge" at the cut; "me" closure at 71.82 | sides x 0.0-0.3 and x 0.7-1.0 above y 0.55 (coloured lines below) |
| `main_face_v2` | `main_face` b17 (28.09-29.82) | lay clip 0 at song 27.6 (shot = clip 0.49-2.22) | "I" at 28.675 (clip 1.07), "my-" closure 29.16 | left x 0.0-0.45 (dark, stars, orange line at y 0.48) |
| `vio_empty` | still, crossed under `vio_still` b118-120 | still | matches `vio_still` frame 121 exactly; earlier frames need the scale above | as vio_still |
| `facade_wushu_v2` .. `facade_band_v2`, `facade_home_v2` | town facades b139-142, b147-148 | stills; cut-outs in `kit/facade_<life>_v2/rgba/f_0001.png` | | cut-out heights differ from v1 (frame fractions): wushu 0.68 (v1 0.66), phd 0.68 (0.74), wetlab 0.88 (0.61), ames 0.57 (0.92; long and low, x 0.07-0.97), band 0.49 (0.70; low unit), home 0.86 (0.60; cut-away room, x 0.20-0.81). Base lines at y 0.84 (wushu), 0.88 (phd), 0.94 (wetlab), 0.81 (ames), 0.77 (band), 0.93 (home): normalise by bbox. Matte flaws: wetlab_v2 has a thin dark sliver down its left column; phd_v2's right edge is ragged where the wall met the graph paper |
| `main_light_v2` (take 2) | `main_light` b25 (41.99-43.73) | **0.0-1.75** | glow swells 0.25-0.5; cup opens 0.25-0.5 and closes 1.0-1.5 | as v1 (locked camera now, no push-in): black above the hands y 0.0-0.12 between the sleeves only |
| `band_v2` | `band` everywhere (verse b28-32, the b37 grid, flashes) | 0.0-2.5 playing; turn from 2.5 | **turn_t 2.6** (same as `band`); look settled 3.6 | her side LEFT (x 0.08-0.45); calmest area the ceiling x 0.5-1.0, y 0.0-0.18; grid focus [0.32, 0.35] |
| `vio_wide_v2` | `vio_wide` b105-106 (3.4 s) | 0.0-3.4 (run, jog, walk; the walk from 3.0 meets `vio_walk`); or 1.6-5.0 to land fully in the walk | slows to a walk at about 3.0 s | track.json: x 0.73 -> 0.49, feet y 0.876 -> 0.821; sky above y 0.55 |
| `wave_run_v3` | `wave_run` b145-146 | 1.4-4.8 as v2 (glance 1.75-2.5, smile from 3.25) | glance back over the shoulder 2.25; smile breaks 3.25 | as `wave_run` v2: slab low y 0.75-0.97 or upper corners |
| ~~`main_split_v2`~~ | rejected: keep `main_split` | | | |
