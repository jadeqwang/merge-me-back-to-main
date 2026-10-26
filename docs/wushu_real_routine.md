# Merge: Jade's REAL group set in the drop (bars 89–100), two ways (2026-10-26)

Jade, 2026-10-26:
- "real routine for motion makes sense, but everyone is in competition outfits. none of the teammates faces are even visible at that resolution
  because the cameras in 2004 were so low resolution you can't even tell who is who, there just aren't enough pixels."
- "I just wished our minor mistakes could be polished off with a model the way that minor imperfections in singing get polished off by suno."

She chose both approaches, together:
- **(A) The real routine drawn in light.** The competition footage itself becomes the drop's plates. Each of the six performers is a
  glyph-built figure in a branch lane. Wired as `?drop=real`.
- **(B) Motion reference.** Short clips of the real routine drive a video model, which repaints the set cleanly as the Jades. Specs:
  `dr_real_ref_<seg>` in `tools/sd/shots_wushu.py`. In the EDL: `?drop=real&real=ref`.

Nothing has been cut, prepped, generated or spent yet. The video is on the box only: it is in an ignored folder, and YouTube is blocked in the
cloud. Until the box preps the plates, `?drop=real` plays the default drop unchanged.

**One source of truth:** `engine/show/real_ws.js`. It holds the segments (video in/out, crop, key frames), the cuts, the lanes, Jade's spot
`ME` and the look. The EDL reads it, `tools/edl_check.mjs --fake=real` reads it, and `node tools/prep/real_ws.mjs` prints the box's commands
from it. After the box measures the real key frames, it edits only this file.

---

## 1. The map: real routine → bars 89–100 (138 BPM, analysis_v2; one bar = 1.739 s)

**Timing sources.** Video times come from the box's analysis (`docs/wushu_groupset_notes.md`, `docs/wushu_v5_design.md` §9; 320×240, 15 fps).
Those timestamps are approximate. Each one is a planned key: the box reads the real frame and corrects it in `real_ws.js`.

**How keys work.** "Key → bar" pins a video moment to a bar position with `keyed()`. Bar positions are `bar.beat`; in the code, 92.5 is
written for 92.3. Between keys the clip stretches linearly. Outside the keys it runs at real speed.

| bars (song s) | segment (video in–out) | what happens (video time → bar) | speed | pinned to a downbeat |
|---|---|---|---|---|
| 89.1–91.1 (153.17–156.65) | `burst` 0:16.6–0:21.6 | first unison phrase. **Bow stance + straight punch 0:17.6 → 89.1 (the drop)**; pubu, arm sweeping low 0:18.4 → 89.3; up into bow stance, rear arm whipped overhead (liangxiang) 0:19.2 → 90.1; then the line starts to travel (out at 0:20.9) | ×0.92, ×0.92, ×1.0 | the punch on the drop impact 89.1 (MAIN slam); the pose on 90.1 |
| 91.1–93.1 (156.65–160.12) | `pairs` 1:21.0–1:27.0 | **partner exchange + the best partner/acrobatic beat.** Cross-colour pairs attack and block 1:22.0 → 91.1; the sweep/roll at its highest ~1:24.6 → 92.3 (the drop's strongest beat-3 onset, bass E→F#, "the airborne bar"); out at 1:25.5 | ×1.00 | the peak on 92.3 (a 0.22 flash) |
| | alternates `?realpair=13` (`pairs13`, 1:11.5–1:17.5) and `?realpair=29` (`pairs29`, 1:26.0–1:32.0) | 13: attack/block 1:12.0 → 91.1, the **takedown to the floor** lands ~1:14.5 → 92.3. 29: the ~1:29 sweep/roll → 92.3 | ×0.96 / ×1.0 | same |
| 93.1–98.1 (160.12–168.82) | `fall` 0:40.0–0:50.0 | **the halves' call and response into THE GROUP FALL, one continuous take.** Knee-raise balance 0:40.5 on the 93.1 phrase landing; the **black (cool) half's front kicks 0:42.2 → 94.1**; the **red (warm) half answers 0:43.0 → 94.3**; slap kicks 0:44.6 → 95.3; **the dive 0:47.2 → 96.4** (take-off on the F#); **all six hit the mat 0:47.6 → 97.1**; bar 97 is the held still bar (they lie flat, 0:48.0–0:49.3) | ×1.0, ×0.92, ×0.92, ×1.20, ×0.92, ×1.0 | **the fall on 97.1**, the phrase landing (a 0.5 flash; the crowd's loudest moment in the real set) |
| 98.1–99.1 (168.82–170.56) | `rise` 0:53.6–0:58.6 | **the rise:** a jump cut through the stillness (0:49.3 → 0:55.0, flat in both frames). First push-up 0:55.0 → 98.1; they push up in sequence, crouch, and spring to standing 0:57.0 → 99.1 (low, mid, high on C#→D) | ×1.15 (must stay ≤ 1.25) | the first push-up on 98.1, standing on 99.1 |
| 99.1–101.1 (170.56–174.04) | `end` 1:54.0–2:01.0 | **the final pose and the salute.** Bow stance out of the pubu 1:54.9 → 99.1; **final pose 1:56.6 → 100.1**; its ~1.8 s hold passes in an eighth of a bar (HOLD, deliberate); rise, feet together 1:58.4; **fist meets palm 1:59.2 → 100.3 = the "ooh" (173.08)**; salute held to 1:59.9 → 101.1. Main (orange) steps out of Jade's own spot into the line's centre on the rise | ×1.0, HOLD ×8.3, ×1.23, ×0.80 | the final pose on 100.1, the salute on 100.3 |
| 101.1 | fold (unchanged) | the match cut on the V of seven | | |

### Choices behind the map
- **No roll or walkover over a partner is logged.** The notes log takedowns to the floor (~1:13–1:15) and "sweeps and rolls" (~1:24,
  ~1:29). As far as the notes say, those are floor rolls, not rolls over a partner's back.
  - The default is the ~1:24 sweep/roll. The run sheet cuts all three, so they can be compared on frames.
  - If one of them is a roll over the partner's back, make it the default (`CUTS` in `real_ws.js`).
- **Partner exchanges.** Bars 91–92 hold the cross-colour pairs. Bars 94.1–95.3 hold the halves' call and response (black kicks, red
  answers), which is the real set's kicks by half, right before its fall. Using that stretch keeps 93–98 one unbroken piece of the real routine.
- **The fall is fall 1 (0:47), not fall 2 (1:39).** All six go down in unison in fall 1, and it got the crowd's loudest reaction. In fall 2
  the pairs go down and roll, so it is less unison.
- **Bars 96.4 → 97.1.** The real dive lands at real speed (×1.20 / ×0.92) on the phrase landing the v5 design already gave its biggest hit.
- **The get-up is real people getting up.** Jade's note on v5a was that the Seedance get-up "is not how humans get up". This fixes it.
- **The ending.** The salute lands on the "ooh" (100.3).
  - The hold before it is compressed: they are motionless, and the cam zoom has no parallax. If the 2004 camera pans during the hold,
    that shows as a quick whip. Split the cut at 100.125 instead.
- **Dropped from the drop.** Her jian solo (bar 95 in the default drop) isn't in the real set, so it isn't used. The real set's arms-out
  line (1:47.4) and horse stance (1:51.4) don't fit in one bar next to the final pose and salute.
- **Real footage used:** ~22.7 s, in 20.9 s of drop.

---

## 2. (A) The real routine in light: `?drop=real` (wired; validated without the plates)

### What the EDL does (drop block of `engine/show/main.js`, `realCut()`)
1. **Gate.**
   - The EDL fetches `meta.json` for every cut's plate, `work/plates/real_ws_<seg>/` (with `?realpair=` swapping the pairs segment).
   - With `&real=ref`, a picked `dr_real_ref_<seg>` take also counts for its segment.
   - If any cut has no source, `DROP` falls back to `v4`, and the default drop plays exactly as before. Checked: the `--list` output is
     identical to the default.
2. **Figures in lanes.**
   - `tools/prep/lanes.py` splits each plate into one plate per performer, `real_ws_<seg>_p<k>/`. Each has the same rgb and depth
     (symlinks) and its own matte.
   - Each is drawn as a glyph-built figure copy in its lane colour: tint 0.6, gain 1.25.
   - The main plate's own figure is off (`figOff`). Its world, the gym, is dimmed to 25% gain: a faint floor, with the judges and the crowd
     sunk into the dark.
   - Without the split, the whole figure is drawn in one colour (gold, 0.35).
3. **Lanes.**
   - The colour of the uniforms picks the half: red uniforms become warm, black become cool. Within each half, left to right: warm is white,
     rose, gold; cool is mint, sky, violet.
   - A line that alternates red/black from the left reads white, mint, rose | sky, gold, violet. That is the fold's V without its point,
     the same order as the v5 design.
   - `lanes.py --groups=` / `--lanes=` override this.
4. **Main.**
   - Main is a second copy of **Jade's own performer**, tinted orange (0.75). On the rise (100.125) it eases from her own spot, over 0.65 s,
     to the line's centre: one step forward (y −0.07) and ×1.12 larger, arriving as the fist meets the palm (100.3).
   - The six plus main make a shallow V of seven in the fold's lane order, so the match cut into the fold at 101 holds.
   - **Ask Jade where she stood in the final line** (1–6 from the left). Set `ME` in `real_ws.js`, or use `?realme=k`.
   - Until then, main is drawn from the performer nearest the centre. `?realme=0` leaves main out.
5. **Cut extras.** Flashes on 92.3 (0.22) and 97.1 (0.5), on top of the drop's own flash on 89.1. MAIN slam, sun, streaks, the "ooh" swell
   and the fold text are unchanged.

### Settings for a 320×240 source (`LOOK` in `real_ws.js`)
- **Crop and scale.**
  - Each segment is cut to a 16:9 window: 320×180 at y = 40 by default, which is the carpet band. The box tightens the window per segment
    (e.g. 256×144) as long as all six stay inside for the whole segment, so the figures stay large.
  - Prep upsamples ×3 to 960×540 (lanczos). On screen, one source pixel is 6 output px across 1080p (7.5 px with a 256-wide crop). A
    performer 30–40 px tall in the source is 180–300 px tall on screen.
- **Lattice cells.** `cellFig: 5` scales the figure glyph tiers from 3 / 5 / 7.5 / 11 px to 5 / 8.3 / 12.5 / 18 px. The finest glyph is
  then about 1.4 source pixels; finer cells would only resample blur. A figure is 25–35 glyph rows tall. `cellWorld: 8` (paint splats ×2)
  is used for the dim gym. `?realcell=` tunes `cellFig`.
- **Fid.** 1 on every cut: every figure cell is drawn, because the figures need all of them.
- **Bloom.** 0.45, down from the drop's 0.6, which merges limbs on figures this small.
- **Cam.** A 2D zoom punch: zoom ×1.0 → 1.03 over the cut, plus 2% on each beat (`T.pulse`), with no dolly. The low-res depth would tear
  under parallax. Per-segment `z` and `pan` in `SEGS` refine the crop.
- **Frame rate.** Native 15 fps, prepped as 15 fps. `plateseq.js` now blends adjacent frames for sources under 20 fps, so the footage glides
  at 24 fps instead of judder-stepping. Every other plate is 24 fps and unaffected.
- **Depth.** DepthAnything V2 is still prepped (the engine needs it). With the zoom cam it only shifts cells slightly, so the Small model is
  enough (see §5).

### Engine changes (all backward-compatible; default and `?drop=v5` listings unchanged)
- `scenes/lattice.js`:
  - `copies[].plate` is another plate on the shot's own clock (its `clip`, or s0/fit).
  - `copies[].gain` multiplies the copy layers' gain.
  - `figOff` stops the main plate's figure from being drawn.
- `plateseq.js`: frames are blended for sources under 20 fps.
- `main.js`:
  - `keyed(shot, K, plate)` takes a plate.
  - A cut's optional 4th element spreads extra shot fields: cells, bloom, copies, update, cam.
  - Inside the drop block: the `RW` gate, `realCut()`, and the flash list.
- `tools/edl_check.mjs`:
  - `--fake=real` fakes prepped real plates plus the performer split (15 fps, each segment's length, six evenly spaced performers).
  - `--fake=realref` fakes picked motion-reference takes.
  - Copies with their own plate are checked for held frames.

### Validation (this session)
- `node --check` on every changed file.
- Each run below used `node tools/edl_check.mjs --picks=review/cloud/picks/picks.json` with the query shown. Each gave 0 exceptions, 0 bad
  args, 0 gaps and **0 held clocks**.
  - `--q="drop=real"`: no plates here, so it falls back to the default drop. The `--list --rates` output is identical to the default.
  - `--q="drop=real" --fake=real`:
    - burst clip 1.00–4.34 of 4.93
    - pairs 1.00–4.47 of 5.93
    - fall 0.46–9.34 of 9.93
    - rise 1.40–3.40 of 4.93
    - end 0.86–5.90 of 6.93
    - rates 0.80–1.20, the HOLD 8.3
  - `--q="drop=real&realpair=13&realme=2" --fake=real` and `--q="drop=real&realpair=29&realme=0" --fake=real`.
  - `--q="drop=real&real=ref" --fake=realref`, and mixed (`--fake=real,dr_real_ref_fall`).
  - Default and `?drop=v5` before and after: identical.
- `lanes.py` on a synthetic plate: six figures, a red/black pair crossing fully, all six lying side by side touching, and a stray "judge"
  blob. Identities held through the crossing, the halves and lanes came out right, and the stray was ignored. ~6 s on CPU.

---

## 3. (B) Motion reference: which models in our catalog take a driving video

Sources: `docs/gen_catalog/*.json` (Cloudflare's catalog, 2026-10-17) and `LIVE.tsv` (live probe, 2026-10-19). The relay sends every
`file:` input as a **data: URI inside the job body**: `tools/gen/gen.py` and `cf.resolve_files` do this, and the KV value limit is 24 MiB.
A model that takes data URIs therefore needs **no public URL**.

| model (id) | input field for the video | URL or data URI | duration / resolution limits | list price | on our relay | fit |
|---|---|---|---|---|---|---|
| **Seedance 2.5** `bytedance/seedance-2.5` | `reference_videos`: array of 0–10, "for style/motion guidance, video editing, or video extension"; plus `image` (first frame), `last_frame_image`, `reference_images` (≤30), `reference_audios` | **HTTP(S) URL or base64 data URI** | all reference videos together ≤ 30 s; output 4–30 s, or `-1`. "For multimodal reference-to-video requests that edit an input reference video, only −1 is supported, and the output duration is kept close to the input". 480p / 720p; aspect `adaptive` matches the reference | with a video input: **$0.4304/s @480p, $0.9676/s @720p** (vs $0.1028 / $0.2312 without) | yes (our default model; data URI in the job body) | **chosen.** It won the fight bake-off (two separate bodies, choreography followed, beats hit); the specs are written |
| Seedance 2.0 / 2.0 Fast / 2.0 Mini `bytedance/seedance-2.0[-fast\|-mini]` | `reference_video` (one string) "for style/motion guidance"; `image`, `last_frame_image`; `reference_images` (1–4) **cannot be combined with first/last frame**; Mini also has `reference_audio` | URL or data URI | output 4–12 s; 2.0: 480p–4k; Fast and Mini: 480p / 720p | video input @480p: $0.172 / $0.132 / $0.084 per s; @720p: $0.372 / $0.286 / $0.182 | yes (same path) | a cheaper fallback; older model, not tested in our bake-off |
| Runway Aleph 2 `runwayml/aleph-2` | `video_uri` (the source video to **edit**); `keyframes` (≤5 images at `seconds` / `at`); `prompt_images` (≤5, `first` / `last` / timestamp); prompt ≤ 1000 chars | HTTPS URL, Runway URI **or data URI** | source ≤ 30 s; the output keeps the source's length and motion | $0.336/s | should work (data URI); untested | a true video-to-video restyle, keeps the camera and motion exactly; risk: it keeps too much of the 2004 blur. Second choice |
| Pruna P-Video-Replace `pruna/p-video-replace` | `video` (the "motion and audio source"); `images`, 1–3 identity references; `instruction_prompt` | URL **or data URI** | none stated; 720p / 1080p; `target_fps` original / 24 / 48 | $0.03/s @720p, $0.06/s @1080p | live (probe asked for video + images); untested | **cheap test** (~$1 for all five segments). Built to put reference people into the source motion (the Wan-Animate "replace" kind of model). Only 3 identity images for 6–7 lanes, so pass the group still `dr_gs_line6` as one of them |
| Pruna P-Video-Animate `pruna/p-video-animate` | `video` (the motion source); `image` (**one** subject); `instruction_prompt` | URL or data URI | 720p / 1080p | $0.03/s | live; untested | single-subject motion transfer (the Wan-Animate "move" kind). It would need one run per performer (crop each one out) plus compositing. Not for the group |
| Gemini Omni Flash / 1.1 Flash `google/gemini-omni[-1.1]-flash` | `video` ("reference video for editing or extension"); `image`, `last_frame`, `reference_images` (≤10), `text` | not stated in the schema (string) | 360p–4k; 16:9 / 9:16 | tokens; card "Default (per second)" $1.5 | live; untested | expensive; editing-oriented |
| MiniMax H3 `minimax/h3` | `content[]` item `{type: video_url, video_url: {url}, role: reference_video}` (gen.py maps `reference_videos` to this) | `url` (data URI not documented) | 4–15 s; 768P / 2K | $0.08/s | **failed**: all 4 bake-off jobs, 7003 user input error | no |
| xAI Grok Imagine Video (+1.5 preview) | `video: {url}` with `_operation: edit\|extend` | URL; the ZDR account needs `output.upload_url` (a presigned PUT) | 1–15 s; 480p / 720p | $0.05–0.14/s | **unsupported** (gen.py `UNSUPPORTED`) | no |
| FLUX 3 Video `black-forest-labs/flux-3-video` (mode `v2v`) | `start_video` (the clip to **continue**) | HTTPS or base64 (≤ 50 MB, ≤ 15 s) | 5–20 s | v2v $0.41/s hd | live | extension, not a motion reference |
| Bria Video RMBG 3.0 `bria/v-rmbg-3.0` | `video` | **public URL only** (`format: uri`) | ≤ 60 s | $0.0225/s | live | not generative: a possible matte for (A) if BiRefNet fails at 320×240, but it needs a public URL |

**Not in our catalog, so the relay can't run them:**
- Wan VACE / Wan Animate: we have only `wan-2.7-i2v` (image) and `wan-3.0` (text).
- Runway Act-Two: we have only `gen-4.5` and `aleph-2`.
- Luma Modify: no Luma models at all.
- Vidu with a reference video: Vidu Q3 has `start_image` / `end_image` only.
- Kling.
- `alibaba/hh1.1-r2v` takes reference *images* only.

### The spec: `dr_real_ref_<seg>` (`tools/sd/shots_wushu.py`)
- **One shot per segment:** burst, pairs, pairs13, pairs29, fall, rise, end.
- **Inputs to Seedance 2.5:**
  - `image`: the start still.
  - `reference_videos: ["file:media/real_ws/ref/real_ws_<seg>_480p.mp4"]`: the same cut, at 854×480 lanczos, native 15 fps, no audio. It
    becomes a data URI at submit.
  - `duration`: the segment's length (5 / 6 / 10 / 5 / 7 s).
  - `group=True`, `use_virtual_avatar`, 16:9.
  - No reference audio: the timing is the real set's, and the EDL keys it onto the beat with the same keys as the light plate.
  - `batch.py` now takes `ref_video` (and `ref_mode="ref"`, which sends the still as `reference_images` instead of the first frame).
- **Prompt:**
  - Follow the reference video *exactly*: move for move, frame for frame, the same positions, timing, facings and framing; nothing added,
    skipped or re-timed.
  - Repaint the performers as the six copies of the first frame, each keeping her face, hair, outfit and lane colours to the end, on the
    salt flat at sunrise.
  - "Polish the execution the way a vocal tune polishes a sung note without changing the melody": crisp lines, deep stances, sharp stops,
    exact unison.
  - Then the segment's moves with their clip times, the guards (two separate bodies, colours kept, SAFE, mouths closed) and the copy count.
  - In `end`, the orange main copy stands behind the line in the still and steps into the line's centre on the rise, so seven salute.
- **Start stills (STILLS).**
  - `dr_real_ref_<seg>`: one nano-banana-pro edit of the segment's first frame, `media/plates/real_ws/real_ws_<seg>_f0.png` (1280×720).
    The references are `dr_gs_line6.png` (the look, lanes, hair) and the canon face.
  - The edit keeps every performer's place and pose and recolours by uniform: red to white / rose / gold, black to mint / sky / violet, each
    left to right. Hair: two buns for white, rose, sky and violet; a ponytail for mint and gold.
  - Then `dr_real_ref_<seg>_patch` adds the 1420 MHz patch on every LEFT sleeve, with every lane pinned.
  - **Check each still against its frame:** the reference motion starts from the frame's layout, so a moved performer breaks the take.
- **Untested points, both unbilled on failure:**
  - Seedance may refuse a first frame together with a reference video. Then set `ref_mode="ref"`.
  - It may require `duration: -1` with a reference video. Then set `dur=-1`; the output stays close to the clip's length.
- **Cost (list price):**
  - Five segments (33 s) × 2 takes at **480p: $28.41**; at 720p: $63.86.
  - Stills: ~$1.30 (5 edits + 5 patch edits).
  - A Pruna-Replace comparison: ~$1 per round. Aleph: $11.09 per round.
  - Spend now: $526.35 of $1,000.

### Hosting: a public URL is not needed
- Seedance 2.5, Seedance 2.0, Aleph and both Pruna models take **data URIs**. The clip travels inside the relay's job body (KV, our own
  `job:` key, deleted by the relay when it starts the job). It is never published anywhere.
- Each 480p clip of ≤ 10 s is a few MB, well under the 24 MiB job limit.
- If a model ever needs a URL (Bria, MiniMax H3), the least-public route is a **short-lived presigned GET** on a **private** R2 bucket:
  - Jade creates a bucket (e.g. `mergemain-refs`) with public access and r2.dev off, plus an R2 API token scoped to that one bucket
    (Object Read & Write).
  - We upload the clip, presign a GET that expires in ~15 minutes (S3 SigV4), submit, and delete the object when the job is done.
  - No Cloudflare resources were created for this. It's only needed if we pick a URL-only model.
- **Retention.** Seedance's catalog card says `zdr: false`, so the provider may keep the inputs. This is part of what Jade OK'd: the clips
  have no identifiable faces, and nobody is named.

---

## 4. Box run sheet

Print every command from the table: `node tools/prep/real_ws.mjs --src=work/<folder>/<video>.mp4 --refs` (add `--seg=burst,fall` for a
subset). The exact cuts for the seven segments (`$SRC` is the video in the box's ignored folder):

```bash
mkdir -p media/real_ws/ref media/plates/real_ws work/real_ws
ffmpeg -v error -y -ss 16.6 -t 5 -i "$SRC" -vf "crop=320:180:0:40" -an -c:v libx264 -crf 12 -pix_fmt yuv420p media/real_ws/real_ws_burst.mp4
ffmpeg -v error -y -ss 81 -t 6 -i "$SRC" -vf "crop=320:180:0:40" -an -c:v libx264 -crf 12 -pix_fmt yuv420p media/real_ws/real_ws_pairs.mp4
ffmpeg -v error -y -ss 71.5 -t 6 -i "$SRC" -vf "crop=320:180:0:40" -an -c:v libx264 -crf 12 -pix_fmt yuv420p media/real_ws/real_ws_pairs13.mp4
ffmpeg -v error -y -ss 86 -t 6 -i "$SRC" -vf "crop=320:180:0:40" -an -c:v libx264 -crf 12 -pix_fmt yuv420p media/real_ws/real_ws_pairs29.mp4
ffmpeg -v error -y -ss 40 -t 10 -i "$SRC" -vf "crop=320:180:0:40" -an -c:v libx264 -crf 12 -pix_fmt yuv420p media/real_ws/real_ws_fall.mp4
ffmpeg -v error -y -ss 53.6 -t 5 -i "$SRC" -vf "crop=320:180:0:40" -an -c:v libx264 -crf 12 -pix_fmt yuv420p media/real_ws/real_ws_rise.mp4
ffmpeg -v error -y -ss 114 -t 7 -i "$SRC" -vf "crop=320:180:0:40" -an -c:v libx264 -crf 12 -pix_fmt yuv420p media/real_ws/real_ws_end.mp4
```
These seek frame-accurately (the cut is re-encoded), keep the native 15 fps and drop the audio.

### A. The light plates
1. **Crop check, before cutting.**
   - Run `ffmpeg -v error -y -ss <in> -t <len> -i "$SRC" -vf "fps=2,drawbox=x=0:y=40:w=320:h=180:color=yellow:t=1,tile=10x2" -frames:v 1
     work/real_ws/real_ws_<seg>_src.jpg`.
   - Are all six inside the yellow box for the whole segment? Tighten `crop` in `real_ws.js` where they are (keep it 16:9).
   - Do the key moves happen where the keys say? (Listed in step 4.)
2. **Cut**, with the commands above.
3. **Prep:** `.venv/bin/python tools/prep/prep.py media/real_ws/real_ws_<seg>.mp4 work/plates/real_ws_<seg> --w=960 --fps=15`. On the 3090
   this takes about a minute or two for all segments.
   - Check the mattes. BiRefNet is a salient-object model, so at this size it can miss a performer, merge two, or take in the judges' table.
4. **Split and lanes:** `python3 tools/prep/lanes.py work/plates/real_ws_<seg>` (seconds; CPU).
   - Open `work/plates/real_ws_<seg>_lanes.jpg`. Check that each colour stays on one body through the crossings and falls, that there are
     three warm and three cool, and that no judge or crowd blob is coloured.
   - Fixes:
     - `--roi=x0,y0,x1,y1` (fractions of the frame) to exclude strays;
     - `--seeds=x1,..,x6` (frame-0 x fractions) for a bad start;
     - `--groups=wcwcwc` if the colour read is wrong;
     - split a segment at a same-colour crossing.
5. **Measure the keys.**
   - For each segment, step through the cut (or the `_lanes.jpg` strip) and find the real clip time of each key moment:
     - burst: the punch, the pubu, the overhead pose;
     - pairs: the attack and the peak;
     - fall: the black kicks, the red answer, the slap kicks, the dive and the impact;
     - rise: the first push-up and standing;
     - end: the final pose, the end of the hold, fist into palm.
   - Write them into `SEGS[seg].keys` in `real_ws.js`. Keep each stretch within ×0.8–1.25 (`--rates` shows them); only the `end` hold is
     exempt.
   - If the rise is longer than ~2.2 s, move its standing key to 99.25.
6. **Check:** `node tools/edl_check.mjs --q="drop=real" --list --rates`. Expect 0 exceptions and 0 held clocks, with `real_ws_*` on
   153.2–174.0.
7. **Stills:** `node engine/render.mjs --q "show=/engine/show/main.js&drop=real" --stills
   154.2:r89.png,158.4:r92.png,166.6:r96.png,167.5:r97.png,169.6:r98.png,172.3:r100.png,173.4:r100s.png --res 1920x1080`.
   - Are the figures readable and large?
   - Are the lanes right, and is the gym only a faint floor?
   - Is main in the centre at 173.4?
   - Tune `LOOK` (`?realcell=4|6`, `?realworld=0..0.5`).
8. **Review renders.**
   - Render 150–180 with `?drop=real`, `?drop=real&realpair=13` and `?drop=real&realpair=29`, plus the default for comparison.
   - Phone previews go in `review/previews/<name>/`. **These show the footage only as light figures: check that nothing identifies a
     teammate before committing a preview.**
   - Ask Jade for `ME` (her spot in the final line).

### B. The motion-reference takes (after A's keys are measured, so both share them)
1. **Clips and first frames.** `node tools/prep/real_ws.mjs --refs` prints them:
   - `ffmpeg … -vf scale=854:480:flags=lanczos -an … media/real_ws/ref/real_ws_<seg>_480p.mp4`;
   - `… -vf scale=1280:720:flags=lanczos -frames:v 1 media/plates/real_ws/real_ws_<seg>_f0.png`.
2. **Start stills:** `python3 tools/sd/stills.py dr_real_ref_<seg>` → run the printed nano-banana-pro edit → check → copy to
   `media/plates/drop/dr_real_ref_<seg>.png` → `stills.py dr_real_ref_<seg>_patch` → check the LEFT sleeve patch and the lanes.
3. **Dry run (free):** `python3 tools/sd/batch.py dr_real_ref_burst dr_real_ref_pairs dr_real_ref_fall dr_real_ref_rise dr_real_ref_end
   --takes=2 --t0=91 --res=480p --dry`. Check that the schema is OK and the estimate is ~$2.15–4.30 per take.
4. **Generate:** the same command without `--dry`, then `python3 tools/gen/gen.py wait <ids>`.
   - On an unbilled input error, set `ref_mode="ref"` or `dur=-1` on that shot and resubmit.
   - **Commit and push `docs/spend_ledger.jsonl`.**
5. **Judge on contact sheets, as in the bake-off:**
   - Does it follow the reference's motion and timing? Compare a strip of the take against a strip of the clip at the same clip times.
   - Two separate bodies at contact (pairs, fall).
   - The colours hold to the end, six copies stay six (seven in `end`), and the patch is on the LEFT.
   - Note any drift in timing.
6. **Intake and picks:** intake → `docs/picks_manual.json` → `picks.py`.
   - A take that drifted gets measured keys in `REF_KEY` in `real_ws.js`.
   - Check with `node tools/edl_check.mjs --q="drop=real&real=ref"`.
7. **Optional cheap comparison:** Pruna P-Video-Replace (~$0.18 for one 6 s segment):
   ```bash
   python3 tools/gen/gen.py spec dr_real_replace_pairs_t1 pruna/p-video-replace \
     --set 'video="file:media/real_ws/ref/real_ws_pairs_480p.mp4"' \
     --set 'images=["file:media/plates/drop/dr_real_ref_pairs.png","file:media/plates/drop/dr_gs_line6.png"]' \
     --set 'instruction_prompt="Replace the six performers with the six women of the reference images, matching each by position, keeping every move, its timing and the camera exactly; the salt flat at sunrise instead of the gym."' \
     --set turbo=false --set 'resolution="720p"' --set save_audio=false --set ignore_audio=true --set 'target_fps="original"' --set disable_safety_checker=false
   python3 tools/gen/gen.py submit media/gen/specs/dr_real_replace_pairs_t1.json --dry-run
   ```
   Aleph is the same, with `runwayml/aleph-2`, `video_uri`, `prompt_images` (`[{"uri": "file:…dr_real_ref_pairs.png", "position":
   "first"}]`), a prompt ≤ 1000 chars, and `duration` = the clip length (used for billing).

---

## 5. Cloud alternative (if Jade opens the network)

**Network.** Add these in the environment's network settings:
- `www.youtube.com` and `*.googlevideo.com`, for the video;
- `huggingface.co` **and its file CDNs `*.hf.co`** (`cas-server.xethub.hf.co`, `cas-bridge.xethub.hf.co`, `transfer.xethub.hf.co`,
  `us.aws.cdn.hf.co`) plus `cdn-lfs.huggingface.co`, for the model weights.

Tested here: `huggingface.co` itself answers 200 already, but every weight download redirects to those CDN hosts, and the proxy refuses them
(403). `huggingface.co` alone is not enough. PyPI is already reachable.

**Fetch.** A **new** cloud session (only new sessions see new network settings) runs:
```bash
pip install -U "yt-dlp[default]" transformers timm kornia      # torch 2.14 + torchvision are preinstalled; ffmpeg is at /usr/bin
mkdir -p work/wushu && yt-dlp -S "res:240,ext:mp4:m4a" --remux-video mp4 --js-runtimes node -o "work/wushu/groupset_2004.%(ext)s" "<URL from Jade, never written into the repo>"
export SRC=work/wushu/groupset_2004.mp4
```
- Recent yt-dlp needs a JS runtime for YouTube's challenges; node 22 is here (`--js-runtimes node`).
- YouTube may answer a cloud IP with "Sign in to confirm you're not a bot". If it does, this route fails: fall back to the box, or to Jade
  sharing the file some private way.

**CPU prep is practical at 320×240.** Measured in this container (4 vCPU, torch 2.14, fp32, the real architectures with random weights,
since the weights' CDN is blocked; one 960×540 frame):

| model | s/frame |
|---|---|
| DepthAnything V2 Large (335 M) | 11.3 |
| DepthAnything V2 Small (25 M) | 1.4 |
| BiRefNet at 1024² (220 M) | 27.2 |
| BiRefNet at 512² | 7.5 |
| BiRefNet_lite at 1024² | 14.2 |
| BiRefNet_lite at 512² | 2.7 |

The five default segments are 495 frames (33 s × 15 fps); all seven are 675.

| prep.py flags | s/frame | five segments | all seven |
|---|---|---|---|
| defaults (Large + BiRefNet 1024) | 38.5 | **5.3 h** | 7.2 h |
| `--depth=depth-anything/Depth-Anything-V2-Small-hf --matte-size=512` | 8.9 | **≈ 75 min** | 1.7 h |
| `… --matte=ZhengPeng7/BiRefNet_lite --matte-size=512` | 4.1 | **≈ 35 min** | 46 min |

- At 320×240 a 512² matte input is already 1.6× the source, so 512 loses nothing real. Depth barely matters under the zoom cam.
- **Recommended:** Small + BiRefNet at 512, about 75 minutes. Run it in the background, one segment at a time.
- `prep.py` now runs on CPU in fp32 when there's no GPU and takes `--depth=`, `--matte=` and `--matte-size=`. It falls back to the system
  ffmpeg. `lanes.py` needs only numpy, scipy and Pillow (seconds).

**What the cloud can and can't finish.**
- The plates are frames of the footage, so they **can't go through the public repo**. The cloud has no private route to the box (no Drive
  connector), and it can't render (no GPU Chrome). The box re-cuts and re-preps from the committed table in minutes.
- So the cloud session's job is the judgment work:
  - look at the frames (Read on the contact sheets);
  - fix the crops;
  - measure the keys;
  - check the lane splits;
  - run `edl_check` with the real lengths;
  - commit **only numbers** to `real_ws.js`.
- It can also run all of (B): clips → data URIs → Seedance through the relay. The takes and stills show the Jades, so they are committed to
  `review/takes/` like any take.

---

## 6. Hygiene: analysis only, and only the short clips go to a model
- **Where the footage lives.** The video, the cuts (`media/real_ws/`), the plates (`work/plates/real_ws_*`), the contact sheets
  (`work/real_ws/`, `work/plates/*_lanes.jpg`) and the raw first frames (`media/plates/real_ws/`) all stay in ignored folders (`media/`,
  `work/`, `*.mp4`).
  - **Never copy any of them into `review/`.** `review/` is tracked, and the repo is public.
  - Before every commit, run `git status --short` and make sure nothing under `review/` comes from the footage.
- **The URL.** The video's URL is never written into the repo, a spec, a commit message or a prompt.
- **What goes to a model.** Only the short segment clips (5–10 s, cropped, no audio) go to the video model, and only each segment's first
  frame goes to the image model for the start still. Both travel as data URIs through the relay. Nothing else from the video goes anywhere.
  - Jade OK'd this on 2026-10-26, because faces aren't identifiable at 320×240.
  - It narrows the earlier rule ("nothing from the video goes to any model", `docs/wushu_groupset_notes.md`) to exactly these clips and
    frames.
- **Teammates.** They are never named. A preview of (A) shows them only as lane-coloured glyph figures.
- **Before committing a take or still from (B):** look at it (it should show the Jades only, with nothing of a teammate carried over), as
  for every take.

## 7. Open for Jade
1. Where did you stand in the final line (1–6 from the left, as the camera sees it)? Main is drawn from that performer for the salute
   (`ME`).
2. Is 1:24 or 1:29 a roll over a partner's back? Otherwise, which partner beat (1:13 takedown / 1:24 / 1:29) for 92.3?
3. (B) at 480p for the first round ($28)? Should we also run the ~$1 Pruna-Replace comparison?
