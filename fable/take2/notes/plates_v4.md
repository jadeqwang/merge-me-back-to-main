# Plates for film v4 (plates agent, 2026-11-14)

Brief: `notes/v4_direction.md` section B (order 1, 4, 2, 3, 5). Specs: `gen/stills.json` (new ids at the end), `gen/gen_clips.py`
(block "Film v4 plates"). Stills `work_fable/take2/stills/<id>_<tag><k>`; clips `media/gen/t2_<id>_t<k>_<hash>.mp4`; plates via
`tools/intake.sh`. Review strips (one frame every 0.25 s, last second included) `work_fable/take2/dev/v4_plates/<id>_t<k>.jpg`.

## Resume state

All five items DONE (2026-11-14). Accepted plates: `home_v2` (t2), `det_home_v2` (still), `main_light_v3` (t1), `wave_run_v4`
(t1), `facade_wetlab_v3` (still + cut-out); lip-sync values measured, picker `review/fable_take2/lipsync_v4.html`. Nothing queued.
Waiting on: Jade's picker numbers (they replace the measured lags); the compositor's wiring (table at the end).

## Spend

- Start: **$541.82**. Close: **$548.46** (whole project, `tools/gen/spend.py`; tools' cap constant still 600, not hit, not
  changed). This round: **$6.64** of the $40 budget: 16 stills (nano-banana-pro, about $0.134 each: home_v2 x2, det_home_v2 x2,
  main_light_v3 closed/open x4, wave_run4 set/smile x4, facade_wetlab_v3 x2, home_turn_v2 x2) and 4 clips (seedance, $1.156 each:
  home_v2 t1 rejected, home_v2 t2, main_light_v3 t1, wave_run_v4 t1).

## B1. Lip-sync on the two drawn sung shots (no spend)

Method. Mouth opening per frame (24 fps) on the plates: face = largest skin blob in a search box, mouth box = lower 45% of the
face, centre 60% of its width; openness = dark or dark-red pixels inside the filled face outline. Contact sheets of the mouth
crops with the values (`work_fable/take2/lipsync_v4/dev/mf_sheet.jpg`, `hp_sheet.jpg`) confirm the measure follows the mouth
(closed / teeth / open read correctly). Voice events from `analysis_v3/stems/vocals.wav` every 40 ms: RMS and the share of energy
above 4 kHz (sibilants), against the word times in `analysis_v3/timing.json`. Envelope cross-correlation alone is NOT reliable
for `main_face_v2`: legato singing gives a periodic correlation (peaks at -0.36 and +0.30 s, the sign flips between halves), so
the lag is read off consonants: lip closures for p, m, f and the teeth for s, th.

**`main_face_v2`** (t0_song 27.6; clip time = song - 27.6). Lag = mouth event minus voice event; + means the mouth comes after
the voice.

| word / sound | voice (clip s) | mouth (clip s) | lag |
|---|---|---|---|
| s of "split" | 1.12-1.24 (hf 94-96%) | teeth 1.46-1.54 | +0.32 |
| p of "split" | dip 1.26 | lips closed 1.58-1.67 | +0.36 |
| m of "myself" | dip 1.46-1.50 | lips closed 1.79-1.88 | +0.37 |
| s of "-self" | 1.82-2.00 | teeth 2.08-2.38 | +0.32 |
| f of "-self" | 2.58-2.62 | closed 2.71-2.92 | +0.21 |
| th of "thousand" | 2.74-2.84 | teeth 2.96-3.12 | +0.25 |
| s of "thousand" | 3.26-3.34 | teeth 3.42-3.75 | +0.28 |
| w of "ways" | about 3.78 | round from 4.04 | +0.26 |
| final s of "ways" | 4.54-4.74 | teeth 4.54-4.71 | 0 (the mouth closes early at the end of the clip) |

The shot uses song 28.09-29.82; inside it the four events read +0.32 to +0.37 (mean +0.34), so one constant fits the shot
(spread ±0.03). It drifts to about +0.25 later in the clip, outside the shot. **Ship +340 ms** (audio 340 ms later than the
picture = lay clip 0 at song 27.26, i.e. the shot shows clip 0.83-2.56). No retime. Film v3 used 0, which put every mouth shape
about a third of a second after its sound (Jade's "need to do the lip sync exercise" at 0:29). This disagrees with the v3 note
("lag about 0"): that reading matched the open mouth 1.0-1.25 to "I split", but the voice is already on the s of "split" at
1.12-1.24 while the mouth is still wide open; the closures show the true lag.

**`hero_paper_v2`** (t0_song 69.2; clip = song - 69.2). "Merge" is held 0.25-2.44 (mouth wide 0.54-2.0, then it narrows
early).

| word / sound | voice (clip s) | mouth (clip s) | lag |
|---|---|---|---|
| "rge" (dzh, rounded) | 2.48-2.52 | small round 2.46-2.50 | 0 |
| m of "me" | 2.56-2.64 | closed 2.62-2.75 | +0.08 |
| b of "back" | about 2.82 | slit 2.79-2.83, opens 2.88 | -0.02 |
| a of "back" | 2.92-3.24 | open 2.88-3.17 | -0.05 |
| ck of "back" | 3.28-3.32 | closed 3.29-3.42 | 0 |
| m of "main" | 3.64-3.72 | closed 3.54-3.58 | -0.12 |
| n of "main" | about 4.2 | teeth 4.21-4.33 | 0 |

Cross-correlation of openness with voiced energy over clip 0.3-4.8: peak -0.04 s (r 0.77; r 0.74 at 0). **Ship -40 ms**
(audio 40 ms earlier than the picture = lay clip 0 at song 69.24). Per word -0.12 to +0.08; no retime (a retime would only fix the
"main" closure, 0.1 s early, and risk a visible stutter in a running shot).

**Picker** `review/fable_take2/lipsync_v4.html` (committed). Media under `work_fable/take2/lipsync_v4/` (git-ignored): the plates'
own frames at 960x540 (`<plate>/f_0001..0121.jpg`) and the song windows (t0 - 0.6 s, 6.2 s, PCM WAV, also base64 in `audio.js`).
Design change from the brief, and why: the first version used a muted `<video>` and an `<audio>` element and kept them together by
seeking; in headless Chrome it needed about 16 audio seeks a second to hold 35 ms and still read up to 40 ms off, which would
stutter and be too coarse for 20 ms steps. The page now plays the song through Web Audio (decoded from `audio.js`, so it works
from file:// with no server) and draws the plate's frames on a canvas from the clock of the sound being heard
(`AudioContext.getOutputTimestamp`, so the sound card's delay is accounted for). The slider restarts the sound at the new offset
without a seek in the picture. Per shot: play/pause, "as cut" (the film's window with a 0.4 s lead-in) or "whole clip", -20/+20,
"measured", "film v3 (0)", and a sticky green line "lipsync v4: face +340 ms, hero -40 ms" with a copy button. Slider -240..+240
in 20 ms steps for hero; face -240..+580 because the measured value is +340 (the brief's range would not reach it).
Convention as take D: + = the voice later than the picture.

Test (headless Chrome via puppeteer-core from `engine/node_modules`, `/usr/bin/google-chrome --headless=new
--autoplay-policy=no-user-gesture-required`, page opened as `file://`): 121 + 121 frames and `audio.js` load, no console errors or
failed requests; AudioContext running; for each shot at lags measured, -240, 0, +240 and after the +20 button the
song time being heard minus the song time of the frame shown = -lag exactly (e.g. face +340 -> -340 ms, hero -40 -> +40 ms); frames
advance 7 per 0.3 s; "as cut" on face wraps 2.76 -> 0.43 and keeps going; the send line updates. Script:
`/tmp/.../scratchpad/test_picker.mjs` (not kept). Not tested: real speakers (headless has no audio device; the output-latency
correction cannot be checked there).

## B4. Parenthood: `home_v2` (and `det_home_v2`)

What v3 had: the life plate `home` (`work_fable/proof/plates/home`, clip `pf_home_t4`, strip `dev/v4_plates/home_old_pf_t4.jpg`):
profile 0-2.5 s with her face, neck and hands painted in the room's blue; head turn from about 2.75 s (motion peak 2.88, `turn_t`
2.85), and the turned face is warm. The first-frame ref `work_fable/proof/refs/home.jpg` has the blue face; the proof's turn frame
`work_fable/proof/turns/home.jpg` has a warm face but BLUE hands.

Stills (one ref each): `home_v2_a1/a2` = edit of `proof/refs/home.jpg`, skin only. Both passed: face, neck and both hands warm
peach-ivory lit by the lamp, profile and pose unchanged, children from behind, patch on her left arm, back of the jacket circle +
RARE EARTH only. Chose a1 (the eye reads larger). Note: the edit came back at 2752x1536 with the framing of the turn frame (the old
ref was a slightly tighter 2048 crop), so her figure sits about 4% further right than in `home` frame 1.

Clip t1 (first `home_v2_a1`, last the proof's turn frame, the proof's prompt structure plus "face, neck and hands keep their warm
skin tone"): REJECTED. Face warm in profile 0-3.0 s and warm after the turn, turn peak 3.00 s; but the hands switch back to blue
between 3.0 and 3.25 s (warm-pixel count in the hand region 1600 -> 80) because the last frame had blue hands.
Fix: `home_turn_v2_a1` = edit of the proof's turn frame, hands only, to her warm tone (a1 and a2 both passed; a1 keeps the face
exactly). Clip t2: first `home_v2_a1`, last `home_turn_v2_a1`: ACCEPTED. Face warm in every frame (profile 0-2.7, the film's face
after the turn: large eyes, centre parting, closed lips); hands warm in every frame (warm-pixel count 1600-1730, no drop); children
backs to the viewer throughout; head-turn motion peak **2.83 s** (half-peak 2.71-3.33; old `home` 2.88), settled by about 3.4,
holds to 5.0. Intake with `turn_t 2.85` (same as `home`) and `focus [0.66, 0.3]` copied from `home`. Strips
`dev/v4_plates/home_v2_t2.jpg`, crops `home_v2_t2_crops.jpg`.

Other parenthood plates: `runner_home` (chalk/pastel runner kit): warm face and hands, fine. `det_home` (still insert, the hand on
the orange by the bulb): the hand is grey-blue like the rest of the drawing. Fixed cheaply: `det_home_v2_a1` (one-ref edit, hand
only): warm bare hand, same pose; side effect: the orange is now orange (it was grey), a second colour beside the pink lane. Plate
`work_fable/take2/plates/det_home_v2` (still-only). The fold window and the b37 grid use the life plate, so `home_v2` covers them.

## B2. `main_light_v3` (b25)

Stills (one ref each, edits of `main_light_a1`, the v1 still): `main_light_v3_closed_a1` (hands nearly closed like a shell, glow
only through the gaps): passed; a2 barely changed the open cup of v1: not used. `main_light_v3_open_a2` (palms open, bright small
star): passed; a1 drew a literal five-point star icon: not used. Five fingers each hand checked zoomed. Both edits zoomed out a
little from v1 (sleeves narrower), and keep the same framing as each other.

Clip t1 (first closed_a1, last open_a2, camera_fixed, prompt: one movement only, never closes, even pace): ACCEPTED. Measured hand
area and spread per frame (skin pixels, x-extent): never decreases (smoothed over 5 frames); near still 0-1.0 s (spread 454 ->
464 px), glow shows between the fingers from 1.25, opening fastest 2.0-3.5 (494 -> 672 px), then slowly to 5.0 (735 px); glow
area rises 3.4k -> 18k px over the clip. No closing, no back-and-forth, locked camera. Five fingers per hand at 1.75, 2.6, 3.0, 3.5
(fingers foreshortened mid-open, not deformed). The last second is the open palms with the star, no new elements.
**Use clip 1.6-3.35** (starts closed with the glow in the gaps, ends just as the palms are open). Plate `main_light_v3`.

## B3. `wave_run_v4` (b145-146)

The take 2 still `wave_run3_knees` already wears a slight closed smile, so it cannot be the neutral start. Deviation from the brief
(which said "first frame the still"): two one-ref edits of it: `wave_run4_set_a2` (neutral, set, level mouth; a1 frowned too hard:
not used) as first frame, `wave_run4_smile_a2` (small closed smile, no teeth, slightly softer eyes; a1 added a blush and read as
more of a performance: not used) as last frame.

Clip t1: ACCEPTED. Sprints at the lens all through, knees-up framing held, head and eyes forward the whole time (no turn, no
glance), patch on her left arm (picture right). Face crops every 0.25 s (`dev/v4_plates/wave_run_v4_faces_t1.jpg`): neutral and set
0-2.75 (half blink at 0.25), the corners of the mouth lift from about 3.0, small closed-mouth smile 3.25-5.0, no teeth, it does not
grow into a grin in the last second; blink at 4.25. A light blush comes with the smile. Weak point: the smile arrives over about
half a second (3.0-3.5) rather than across the whole run. Step period 10 frames, steady in all windows (`MINLAG=9 gait.py`; v3 was
12). The wave crest stays a curl; no white spray burst as in v3.

## B5. `facade_wetlab_v3` (Bio-X, the James H. Clark Center)

`kit/facade_wetlab` (v1) is a generic three-storey brick lab with flasks in the windows (its prompt asked for "a plain laboratory
building"): not the Clark Center. New reference, one Wikimedia Commons photo: `File:Clark Center.jpg` (CC BY-SA 3.0,
https://commons.wikimedia.org/wiki/File:Clark_Center.jpg), straight-on view of the curved wings; record in
`work_fable/take2/v4refs/wetlab/SOURCE.json` (copied into the kit folder). Other candidates looked at (`dev`: `v4refs/wetlab/cands_tile.jpg`):
the October 2019 courtyard photos (perspective, sky), the round-plaza photo (a flag and people).
Still `facade_wetlab_v3_a2`: ACCEPTED: a flat, straight-on elevation in the histology-plate ink medium of `facade_wetlab_v2`: two
curved glass wings, the deep curved overhanging roof, balconies and walkways on thin posts, the outdoor stair in the middle, mint
doors as the only strong colour; the steel drawn rust-sepia (reads as the building's red-orange); no lettering; white ground with
one base line. a1 drew the courtyard in perspective with the plaza: rejected. Plate `work_fable/take2/plates/facade_wetlab_v3`
(still-only), cut-out `work_fable/take2/kit/facade_wetlab_v3/rgba/f_0001.png` (matte.py, BiRefNet): clean; the gaps under the roof
between the wings are transparent. Bbox (frame fractions, 1280x720): x 0.046-0.954, y 0.226-0.699, height 0.472, base line at
y 0.699. It is much wider than tall (unlike v2's 0.88-high block): scale by width or by bbox height as the town layout needs.

## Wiring

Lag convention for the sung shots: + = the audio plays later than the picture (as take D and `notes/intake.md`). With the shot laid
by `t0_song`, lag L means: lay clip 0 at song `t0_song - L` (the picture moves EARLIER by L), i.e. clip time = song - t0_song + L.

| plate id | replaces | clip range to use | timed events | framing / notes |
|---|---|---|---|---|
| `main_face_v2` (unchanged) | b17 sung close-up (28.09-29.82) | at the measured lag: clip 0.83-2.56 | **measured lag per word** (mouth after voice): s of "split" +0.32, p +0.36, m of "myself" +0.37, s of "-self" +0.32 (in the shot); later f +0.21, th +0.25, s +0.28, w +0.26, final s 0. **Ship +340 ms** (`lagface=340`): clip 0 at song 27.26 | one constant fits the shot within ±0.03 s; no retime needed. v3 used 0 |
| `hero_paper_v2` (unchanged) | b41-42 (69.7-73.2) | at the measured lag: clip 0.46-3.96 | **measured lag per word**: "rge" 0, m of "me" +0.08, b of "back" -0.02, a of "back" -0.05, ck 0, m of "main" -0.12, n 0; cross-correlation peak -0.04 (r 0.77). **Ship -40 ms** (`laghero=-40`): clip 0 at song 69.24 | no retime. v3 used 0 |
| `home_v2` | `home` everywhere (parenthood life plate, the b37 grid turn, the fold window, flashes) | as `home` | **turn_t 2.85** (motion peak 2.83, old 2.88); look settled about 3.4; holds to 5.0 | her figure sits a little further right than in `home` frame 1 (the edit has the framing of the turn frame, by eye about 4% of the width); `focus [0.66, 0.3]` as `home`; chip under the children's heads as before |
| `det_home_v2` | `det_home` (still insert) | still | | same framing; the orange is now coloured orange (was grey) |
| `main_light_v3` | `main_light_v2` b25 (41.99-43.73, 1.75 s) | **1.6-3.35** | closed with the glow in the gaps at 1.6; the hands open steadily (spread 475 -> 640 px at 1280 wide, fastest 2.0-3.5); open with the star from about 3.4. Fully open only at the very end of that window; 2.0-3.75 shows more opening and ends fully open | locked camera; slightly wider than v2 (sleeves narrower); black above the hands y 0.0-0.12 between the sleeves |
| `wave_run_v4` | `wave_run_v3` b145-146 (3.4 s) | **1.4-4.8** (as v3; set face to about 3.0, smile from 3.0-3.5, blink 4.25) or 1.6-5.0 to end on the smile | no look-back, no head turn. Smile: corners lift from **3.0 s**, small closed-mouth smile **3.25-5.0**, no teeth; blinks at 0.25 (half) and **4.25**; step period **10 frames** (v3 12: re-check the time-scale to the beat) | knees-up framing held, head near the top third; patch on picture right; no white spray burst (v3 had one from 2.75) |
| `facade_wetlab_v3` | `facade_wetlab_v2` (town b139-142, b147-148): prefer when the folder exists | still; cut-out `kit/facade_wetlab_v3/rgba/f_0001.png` | | bbox x 0.046-0.954, y 0.226-0.699 (height 0.472, very wide; v2 was 0.88 high); base line y 0.699; normalise by bbox. The James H. Clark Center (Bio-X) |

Still weak: `wave_run_v4`'s smile arrives over about half a second rather than across the whole run, with a light blush;
`main_light_v3` spends its first second nearly still (the window above skips it); the lip-sync numbers are measured from the picture
and the vocal stem and have not been heard: the picker is where Jade sets them. The picker's output-latency correction was not tested
on a real sound device.
