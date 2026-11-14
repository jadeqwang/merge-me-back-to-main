# Plates for film v3 (plates agent, 2026-11-14)

Brief: `notes/v3_direction.md` section B, plus coordinator items 8 (band_v2), 9 (main_face_v2 / main_split_v2), 10 (wushu_v3),
11 (main_light_v2), and the change to item 7 (hero_paper_v2 sings). Specs: `gen/stills.json` (new ids at the end), `gen/gen_clips.py`
(block "Film v3 plates": new `OVR` dict for whole-prompt overrides, used by `main_split_v2` and `band_v2`). Stills
`work_fable/take2/stills/<id>_<tag><k>`; clips `media/gen/t2_<id>_t<k>_<hash>.mp4`; plates via `tools/intake.sh`. Review strips (one
frame every 0.25 s, last second included) `work_fable/take2/dev/v3_plates/<id>_t<k>.jpg`. Building reference photos (Wikimedia
Commons, one per building, licence in each `SOURCE.json`) in `work_fable/take2/v3refs/<life>/`.

## Spend

- Start: $525.40 (whole project). After first group of stills + 8 clips: $539.51.

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
no 1.75 s window has both. Take 2 submitted with stronger wording (movement from the first frame, fingers part to let the light
out, hands lift at 2 s).

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
| `facade_wushu_v2` .. `facade_band_v2`, `facade_home_v2` | town facades b139-142, b147-148 | stills; cut-outs in `kit/facade_<life>_v2/rgba/f_0001.png` | | home is wider than a house front (cut-away room) |
