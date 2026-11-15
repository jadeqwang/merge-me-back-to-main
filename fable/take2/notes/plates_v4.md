# Plates for film v4 (plates agent, 2026-11-14)

Brief: `notes/v4_direction.md` section B (order 1, 4, 2, 3, 5). Specs: `gen/stills.json` (new ids at the end), `gen/gen_clips.py`
(block "Film v4 plates"). Stills `work_fable/take2/stills/<id>_<tag><k>`; clips `media/gen/t2_<id>_t<k>_<hash>.mp4`; plates via
`tools/intake.sh`. Review strips (one frame every 0.25 s, last second included) `work_fable/take2/dev/v4_plates/<id>_t<k>.jpg`.

## Resume state

- B1 lip-sync: DONE (measured, picker built and tested). No plate change, no retime.
- Next: B4 `home_v2`, then B2, B3, B5.

## Spend

- Start: **$541.82** (whole project, `tools/gen/spend.py`). Round budget $40.

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
