# Plates for film v2 (plates agent, 2026-11-14)

Brief: `notes/v2_direction.md` section B. Specs: `gen/stills.json` (new ids at the end), `gen/gen_clips.py` (block "Film v2 plates").
Stills `work_fable/take2/stills/<id>_<tag><k>`; clips `media/gen/t2_<id>_t<k>_<hash>.mp4`; plates `work_fable/take2/plates/<id>/` via
`tools/intake.sh`. Review strips (one frame every 0.25 s) `work_fable/take2/dev/v2_plates/<id>_t<k>.jpg` (local, has her drawn face).
Strip helper: `work_fable/take2/dev/v2_plates/strip.sh clip out.jpg`.

Tool change: `gen_clips.py` gained `extra["audio"]` (adds `reference_audios` and drops the "mouth stays closed" sentence) and
`extra["fixed"]` (camera_fixed). Spec ids for the new plates are the plate ids.

## Spend

- Start: $480.10 (whole project). After group (a)+(b) stills and clips plus group (c) queued: $513.17 (whole project; includes the
  orchestra agent's spend in the same window). My own lines are tagged `t2_<plate id>`.

## Group (a)

**vio_write2**: still `vio_write2_a1` = edit of `vio_write_a1` (one ref): knees up, small notebook on the nearer knee, head bowed,
writing with the yellow pencil; full outfit and patch side restated. Passed first try (back clean, patch on her near/left arm, hands
young). Page shows scribble marks, not letters. Clip t1 accepted: she writes for the whole 5 s, pencil angle changes frame to frame
(real small wrist/finger motion), shoulders breathe. Locked off, starts on the still.

**vio_release2**: still `vio_release2_a1` = edit of `vio_release_b1` (adds a closed notebook in her lap). Clip t1 = first frame
`vio_write2_a1`, last frame `vio_release2_a1`: finishes the word (0-1.0 s), notebook closed by 1.25 s, open hand lifts 1.6-2.4 s,
head up, holds 2.5-5.0 s. The gold sliver of sunrise at the right edge appears from about 1.25 s (as in v1 release). She looks UP
and a little left (as v1 `vio_release`), not toward the sunrise; the brief's "looks up east" is approximated by the head lift.

**wave_run**: two stills tried in parallel. `wave_run_a1` used the Rewind F1 keyframe (`rewind-take-two/media/shots/F1/kf_1.jpg`,
copied to `work_fable/take2/v2refs/`) as the single composition ref: good wave, but the face drifted (eyeliner, ad-like). Chosen:
`wave_run_m_a1` with `day_jade_a1` as the one ref and the Rewind composition described in words: face matches the sheet; the
wave is ribbons in the twelve lane colours plus orange, curling over with white paper spray; no city. Small pale-blue dot on the
front chest (as the character sheet and `day_jade`), patch on her left arm (picture right), patch text garbled (not readable).
Clip t1 accepted: the model reframed to a smaller full-length figure in the centre (as the handoff warns) but she sprints at the
lens the whole time, hair streaming; the wave rolls and its crest breaks to white spray, largest at 3.5-4.8 s. The ribbons are
plain colour bands, not "written lanes": the compositor can lay lane text along them if wanted.

## Group (b)

**root_face_v2**: same still `root_face_a1`, new clip prompt (two blinks, breath fogs the glass and clears, chest rises, strand
moves, camera locked: "no zoom, no push-in"). t1 accepted: blinks at 0.25 s and 3.0 s, fog breath 1.25-2.5 s and 3.75-4.5 s, lips
part on the breath, no push (the ponytail tip touches the top edge as in the still). Frost keeps growing.

**wushu_v2**: new still. Prompt: woodblock print with a hierarchy; light from a single window off the left edge; her nearest and
largest, the only detail and the only coral red; three teammates behind, smaller, flat grey/indigo shapes, overlapping; plain wall,
bare floor. Character sheet as the only ref. `wushu_v2_a1` failed (RARE EARTH printed on the front chest). `wushu_v2_a2` passed
(front three-quarter facing left, patch on her left arm = picture right, no front lettering, teammates flat) but had a drawn
border: cropped 2.5% each side -> `wushu_v2_a2c`. Clip t1 accepted: she re-chambers (0-0.9 s), the punch lands about 1.0 s with
the teammates in unison, hair swings, then holds still to 5.0 s.

**drop_face_v2**: still `drop_face_a1` plus audio `media/gen/refs/Merge_kd_0171.800_5s.mp3` (song 171.8-176.8, clip t = song -
171.8). Prompt: wind from the right, hair streams, light flickers; eyes closed; a held open "ooh", no consonants. t1 accepted: eyes
closed throughout, mouth closed at 0.5 s and open by 0.75 s (the "ooh" starts at song 172.54 = clip 0.74 s), steady open vowel to
about 4.5 s, hair whipping all through, gold streaks of light cross in the first 0.5 s. No retime needed: lay clip 0 at song 171.8.
`meta.json` carries `t0_song: 171.8`.

**main_palm**: retake `main_palm_v2` t1 rejected: figure motion energy is lower than v1 (0.44 vs 0.99 mean frame diff in her box)
and the clip opens with the tree already grown (v1 grows it from nothing). Keep v1; not intaken; no second take (v1's life comes
from the tree). **root** (proof plate, child from behind): the frost grows from her hand; left as is.

## wave_run take 2 (director's note)

Stills (one ref `day_jade_a1`): `wave_run2_a1`/`a2` full length and scowling; `wave_run3_a1` large, towering saturated ribbon wave
with crest and spray, white paper to the edge, but an open-mouth grin and framed to the shins. Fixed by one expression-only edit
(`wave_run3_face_a1`, lips closed) and a free crop to knees-up: `wave_run3_knees.jpg`. Clip `t2_wave_run_t2` submitted (low camera
retreating, "framing stays from the knees up for the whole shot"); NOT yet reviewed or intaken. Fallback if it pulls back: take 3
with `wave_run3_knees` as the last frame too.

## Group (c) (in progress)

- `stance_bow_v2`, `stance_horse_v2`, `stance_drop2_v2`: accepted, intaken (arrival swing and dust, then the stance holds exactly).
- `stance_drop_v2` (from `stance_empty_a1`): t1 rejected (model zoomed in, legs cut off from 0.25 s); t2 with the still as first and
  last frame submitted, not reviewed.
- `ins_violin`, `ins_poem`: accepted, intaken. Insert stills: attempt 1 failed for all four (violin two crossed arms; poem light
  jeans; piano wrong keys; guitar letterboxed); attempt 2 passed (guitar cropped from a drawn frame: `ins_guitar_b1c`).
- `ins_piano`, `ins_guitar`, `drop_hero_2_v2`, `_3_v2`, `_4_v2`, `_5_v2`: accepted t1, intaken. Guitar's grey fretting sleeve and
  sturdy hands read acceptably in motion; no third still.
- `drop_hero_1_v2`: t2 only (t1 used a wrong last frame and is discarded); pending. New drop stills: `drop_hand_open`, `drop_eyes_closed` (edits, first frames toward the approved v1 stills),
  `drop_sun_only` -> `drop_palm_sun` (palm rises over the sun, no rays), `drop_land_clean` (v1 landing with the burst rays removed).

## Wiring

| plate id | replaces (shot) | clip range (s) | type room (frame fractions, 1280x720) | trim / notes |
|---|---|---|---|---|
| `vio_write2` | `vio_write` b113-115 | 0.0-5.0 (any 2.5 s; writing all through) | notebook at x 0.55-0.66, y 0.44-0.55. Clear dark sky: upper left x 0.02-0.30, y 0.05-0.50 (stars only; the Milky Way band runs from x 0.17 at the top to x 0.60 at y 0.45); upper right x 0.82-0.98, y 0.02-0.40 | page has scribble marks, not readable; cover with a small dark patch if the shot is ever held close |
| `vio_release2` | `vio_release` b116-117 | 0.0-5.0: close 0.9-1.25, hand lifts 1.6-2.4, hold 2.5-5.0. For a 3.4 s slot use 1.0-4.4 | hand at x 0.57-0.68, y 0.30-0.38 at the hold; sky clear x 0.0-0.20 and x 0.88-1.0, y 0-0.45; sunrise sliver at x 0.95-1.0, y 0.52-0.58 (east) | the line of light can leave from the hand toward the sunrise (right) |
| ~~`wave_run`~~ take 1 REJECTED by the director (small jogging figure, pastel spiral, grey band); take 2 pending | second likeness shot b145-146 (`like_sing2`) | 1.4-4.8 (3.4 s; wave crest breaks 3.5-4.8). Whole clip 0-5.04 usable | slab low: y 0.72-0.96 is white paper either side of the orange road (x 0.0-0.40 and x 0.60-1.0); her feet reach y 0.97 at the road centre | she is full length and centred, about 0.9 of frame height; do not mirror (patch text) |
| `root_face_v2` | `root_face` b5-6 | 0.0-3.5 (both blinks 0.25, 3.0; one fog breath 1.25-2.5) or 0.6-4.1 | frost area x 0.0-0.45 | no push; ponytail tip at top edge as before |
| `wushu_v2` | `wushu` life plate b30, the b12 flash, and wherever the proof `wushu` plate is used | 0.6-2.6 puts the punch landing at 0.4 s into the slot; for a flash use 1.0-1.3 | plain wall x 0.40-0.75, y 0.02-0.35; floor y 0.85-1.0 | 1280x720; face is profile at x 0.27, y 0.17 |
| `drop_face_v2` | `drop_face` b100 | lay clip 0 at song 171.8 (so 0.0-1.7 for the bar); mouth opens 0.6-0.75 on the "ooh" | sun disc behind her, x 0.2-0.75; dark sides x 0.0-0.18, x 0.80-1.0 | sung clip: likeness rules do not apply (drawn Jade); no "ooh" lyric on screen (brief A1) |
| `stance_bow_v2` | `stance_bow` (b73-76 impact, beat 3 of b77-80) | 0.0-5.0; settled hold from 1.5 | black paper either side of her (x 0.0-0.25, x 0.75-1.0) | figure about 0.8 of frame height |
| `stance_horse_v2` | `stance_horse` | 0.0-5.0; dust gone and still from 2.0 | same | big cartoon dust puffs 0-2.0 s |
| `stance_drop2_v2` | `stance_drop2` | 0.25-5.0; settled from 2.25 | upper left x 0.0-0.4, y 0.0-0.4 | frame 0 sits slightly off; start at 0.25 |
| `ins_violin` | new insert, beat 3 of b77-80 | 2.5-4.75 is the clearest bow travel (hand moves out to the right) | upper left above the strings x 0.0-0.45, y 0.0-0.30 | one bow, one hand throughout |
| `ins_poem` | new insert, beat 3 of b77-80 | 0.0-5.0, writing all through; small pencil lift about 3.75 | upper left x 0.0-0.3 (black) | page lines faint and unreadable |
| `ins_piano` | new insert, beat 3 of b77-80 | 0.0-1.9 (lift, chord lands about 1.0-1.25); the view shifts at 2.0 | upper left black x 0.0-0.35, y 0.0-0.25 | |
| `ins_guitar` | new insert (RNA band), beat 3 of b77-80 | strums 0.75-1.25, 2.5-3.0, 4.25-4.75 | little free area; small chip at upper left only | fretting sleeve greyish |
| `drop_hero_2_v2` | v1 `drop_hero_3` (palm) as the brief's hero 2 | 0.75-3.5 (palm rises 0.75-2.75, holds) | black sides x 0.0-0.3, x 0.7-1.0 | no rays; sun size steady |
| `drop_hero_3_v2` | v1 `drop_hero_1` (eyes) as hero 3 | 0.5-3.0 (eyes open 0.75-2.25, gold glints from 2.5) | none (full-frame face) | |
| `drop_hero_4_v2` | v1 `drop_hero_4` (hair whip) | 1.0-3.5 (whip), falls by 4.75 | right of the hair, x 0.75-1.0 | patch on the near arm |
| `drop_hero_5_v2` | v1 `drop_hero_5` (landing) | 0.0-2.25 (squat, strap swing, dust); dust thins to 4.0 | upper band y 0.0-0.35 is black trousers/black | no rays |
