# Hybrid shot prototype: her redrawn by a video model, over the code-drawn world (2026-11-10)

Status: WORKING PROTOTYPE on two 6 s clips. No money spent: every step is local (RTX 3090), nothing was sent anywhere, nothing in
`tools/gen/` was run. Not adopted; this is a test for Jade's decision. Nothing in the film changes unless `?hide=` is passed.

Review files (in `review/fable_v7/seedance_test/`, 1920x1080, 24 fps, 6.04 s, with the song):
- `hybrid_day.mp4`, `hybrid_become.mp4`: the composites.
- `hybrid_day_compare.mp4`, `hybrid_become_compare.mp4`: left the code render with the procedural figure, right the hybrid (960x540 each).

## What it is
The video-model test (`review/fable_v7/seedance_test/README.md`) showed that Seedance redraws her well from the character sheet but drifts on
the background, lyric type and HUD. Here only HER is taken from the model's frames; sky, sun, mirror, roads, lyrics and HUD stay code.

    plate (code, no body)  +  her mirror image (her layer flipped, with the code mirror's law)  +  her layer (model frame: matted, upscaled, registered)  +  HUD guard

Outside her layer and her mirror image the composite is pixel-identical to the plate (checked: 0 changed pixels in the HUD strip and on the
lyric side of the frame).

## One-time setup (free, local)
```
uv venv --python 3.12 work_fable/venv_hybrid
uv pip install --python work_fable/venv_hybrid/bin/python torch torchvision --index-url https://download.pytorch.org/whl/cu124
uv pip install --python work_fable/venv_hybrid/bin/python numpy opencv-python-headless scipy pillow spandrel "rembg[gpu]" "onnxruntime-gpu==1.22.0"
# weights (open): BiRefNet-general ONNX (973 MB, MIT, from the rembg release page), Real-ESRGAN anime 6B (18 MB, BSD)
mkdir -p work_fable/hybrid/models/esrgan work_fable/hybrid/models/models/birefnet-general
curl -L -o work_fable/hybrid/models/models/birefnet-general/birefnet-general.onnx https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-epoch_244.onnx
curl -L -o work_fable/hybrid/models/esrgan/RealESRGAN_x4plus_anime_6B.pth https://github.com/xinntao/Real-ESRGAN/releases/download/v0.2.2.4/RealESRGAN_x4plus_anime_6B.pth
```
- The system Python has no `venv` module; `uv` makes the environment.
- `onnxruntime-gpu` must be a CUDA 12 build (1.22.0) so that it shares torch's CUDA libraries. The newest wheel wants CUDA 13 and silently
  falls back to the CPU (12 s per frame instead of 0.4 s).
- `rembg` is only used for its dependencies and as the source of the BiRefNet ONNX file; `hybrid.py` runs the network itself.

## Per shot: the exact commands
A shot is a small JSON in `fable/tools/hybrid/shots/`: `name`, `t0` (film time of the model clip's first frame), `fps`, `frames`, `model`
(the model's clip). Optional overrides are listed in `DEFAULTS` at the top of `hybrid.py`.
```
# 1. code renders at 1920x1080, 24 fps, mb 4: ref (the film), plate (no body), norefl (bodies without their mirror image)
fable/tools/hybrid/render_plates.sh day 236.65 145
fable/tools/hybrid/render_plates.sh become 230.0 145
# 2. everything else
work_fable/venv_hybrid/bin/python -I fable/tools/hybrid/hybrid.py fable/tools/hybrid/shots/day.json all
work_fable/venv_hybrid/bin/python -I fable/tools/hybrid/hybrid.py fable/tools/hybrid/shots/become.json all
```
Any stage can be re-run alone (`... day.json comp,encode,qa`). Intermediates: `work_fable/hybrid/<name>/` (git-ignored); judging strips:
`work_fable/hybrid/qa/`.

Frame times: the harness snaps to whole frames, so frame k is film time `(round(t0 * 24) + k) / 24`. The day clip therefore starts at
236.667 (frame 5680), not 236.65, and the audio is cut from that time, as the harness itself does with `--audio`.

The switch in the show: `fable/show/cast.js` reads `?hide=`. `hide=fig` draws no body at all (the plate); `hide=refl` draws the bodies but
not their mirror image. Without the parameter the output is byte-identical to before (checked on two stills, 238.0 and 153.5: same md5 with
and without the patch). Everything that is not a body stays in the plate: world, roads, her ring, lyric type, HUD, and the held violet
light of 13_catch (a separate drawable; her layer then covers it, as her body does in the code version).

## The pipeline, stage by stage (`hybrid.py`)
| stage | what it does | time, 145 frames |
|---|---|---|
| `render_plates.sh` | three code renders: `ref`, `plate` (`hide=fig`), `norefl` (`hide=refl`) | about 50 s each, incl. 30 s start-up |
| `frames` | model clip to PNG; finds the model's own cut frame near each code cut (`fable/show/cuts.json`) | 1 s |
| `patch` | a clean plate still for every frame where the code frame blends two shots, or where the model cuts a frame late or early | 37 s when needed |
| `code` | the code figure's mask = `norefl - plate`; the code mirror image = `ref - norefl`; her box per frame | 15 s |
| `a0` | coarse matte: BiRefNet on the whole 720p frame, only to find her | 55 s |
| `up` | Real-ESRGAN anime 6B x4 on the model frame, stored at x2 (2560x1440) | 93 s |
| `a1` | fine matte: BiRefNet again on a square crop round her, taken from the x2 frames (about 2x the pixels on her) | 60 s |
| `alpha` | orphan pieces dropped; road guard (lane-coloured pixels at shoe level are the model's road, not her); a light choke; temporal median of 3 frames, applied only where the picture is still (a fast hand keeps its own frame) | 22 s |
| `register` | time lag check; ONE scale per segment (median of code height / model height); offsets that vary slowly (robust line + smoothed residual): her feet on the code figure's feet, her head on its head while the frame cuts her legs, x from the best overlap of the two silhouettes; the mirror line from the code reflection | 7 s |
| `comp` | her colour in the edge pixels estimated (pymatting, so the model's sky does not come along); Lanczos warp to film pixels; mirror image; light wrap; over; HUD guard | 76 s |
| `encode` | the two review files, x264 crf 18 (raised until under 15 MB), AAC from `inputs/Merge.wav` | 5 s |
| `qa` | strips: composite at 4 fps, code/hybrid pairs, feet at full resolution | 2 s |

Time per clip (6 s of film): about 2.5 min of code renders + about 6 min of `hybrid.py` = under 9 min, unattended, about 1.5 min per film
second. (Measured totals of the clean final runs are in the last section.)

### Why these choices (what was tried)
- Matte. `isnet-anime` (rembg) failed: it lost the black silhouette entirely (alpha near 0 at 230.0) and kept the orange ring and road at her
  feet. `BiRefNet-general` is clean on both clips: hair strands, fingers and the straps kept; ring, road, mirror image, lyric and HUD left out.
  Running it a second time on a crop from the upscaled frame gives it about twice the pixels on her: a sharper edge, and the ring at her
  feet, which the whole-frame pass still kept in the dark frames (231.25), is left out. A difference key
  against the plate was NOT used: the model's background is the code background scaled and shifted, with its own sun, so it is not a clean
  reference, and her white jacket is close to the day sky.
- Upscale. Real-ESRGAN `x4plus_anime_6B` (0.5 s per frame) against `realesr-animevideov3` (0.05 s) against bicubic: 6B has the crispest
  line and eyes; animevideov3 is a little softer and a safe faster choice; bicubic keeps the H.264 grain of the model clip. RGB is upscaled,
  the alpha is made on the upscaled picture.
- Registration. The model's frame turned out to be a near-constant similarity of the input: day x1.034 (she is drawn 3.4 % smaller; offset
  about -22 px in x, 0 px in y at film resolution, the same in all three shots of the clip), become x0.989 (+36 px in x, +10..18 px in y,
  drifting slowly). So one scale per segment and slow offsets are right; per-frame
  matching would make her bob with every difference in the model's drawing. Time lag is 0 frames in both clips.
- Mirror image. The code mirror is measured, not guessed: under the flipped code figure, `ref = a * norefl + b * figure colour` is fitted
  per channel in windows of one second (the light changes during the sunrise) and the same law is applied to her flipped, softened,
  slightly rippled layer. Mean change under the mirror image, code against hybrid: day (-3.9, -10.2, -26.4) against (-2.7, -8.2, -24.0)
  levels; become (-22.0, -11.6, -4.7) against (-19.0, -10.3, -3.7). The road and her ring hide the mirror in the code (ground decals are
  drawn after it): keyed out of the plate by the lane colour. The code version has NO contact shadow, so none was added.
- Order. Lyric type is depth-tested in the world (34 m away) and always behind her, so "her over the plate" is the code order. The HUD is
  drawn over the finished frame: its glyphs are found in the plate (top-left strip) and put back over her. In these two clips she never
  reaches it (guard used on 0 frames).
- Cuts at 24 fps. The cut at 240.121 falls inside the shutter of frame 83 (240.125 +- 0.008 s): the code frame is a blend of both shots,
  and the model, which saw that blend, cuts one frame later. `frames` detects this and `patch` renders a clean plate for that frame from
  just before the cut (240.118, shutter 0.05). The cut at 241.86 falls between frames and needed nothing.

## What is automatic, what needed tuning
- Automatic, same defaults for both clips (the shot files hold only name, time, frame count and the clip): matte, upscale, time lag,
  scale and offset, cut detection and plate patch, mirror line, mirror law, HUD guard, encode size.
- Tuned once while building, on these two clips, and likely to need a look per shot type: the road key (the hue range of main's orange;
  another lane colour needs `refl.road_key`), `road_guard` (lowest 12 % of her height), the mirror blur and ripple (2.2 px, 1.3 px; set by
  eye against the code mirror), the light wrap (0.18).
- No per-shot overrides were used. No grade was applied to her beyond the light wrap (the world's blurred colour creeping 5 px over her
  edge at 18 %); `grade.gain` and `grade.sat` exist for it.

## Visible problems (film time; judged on strips and full-resolution crops, NOT watched in motion)
Day clip (236.67-242.71)
1. 239.2-239.4 (frames 61-65) and 240.8 (frame 100): in fast moves the model's face and hands melt (eyes drift, a smeared forearm over the
   face). It is in the model's frames; the upscaler turns the smear into clean-edged wrong shapes, so at 1080p it shows more than at 720p.
   Not fixable in the composite. This is the worst defect.
2. 242.5-242.71 (frames 139-144): the model stops following. The code figure takes a step toward the lens; the model keeps her standing.
   The road's write head (in the plate, under the code figure's feet) appears as an orange arrow ahead of her shoes. Frame 144 has no
   source at all (the input had 144 frames, the model returned 145).
3. 240.125: the hybrid's cut is one frame (42 ms) later than the film's nominal cut, because the model's is.
4. Feet. After registration her lowest point is within 1.4 px (median, first shot), 2.9 px and 5.3 px (second, third shot) of the code
   figure's; single frames differ by 20 px and more where the model places a foot differently or shows a shoe the code trousers hide
   (241.5-241.7). The registration track itself moves at most 0.4 px per frame, so any sliding seen is the model's own drawing.
5. Mirror image: one flip line for the whole body (the ground row at her depth), so the nearer foot's image sits 10-20 px off; it is soft
   and faint like the code's, and carries little of the redraw's detail. In a jump the image stays on the ground as it should.
6. Colour: her trousers are the sheet's navy, darker than the procedural figure's blue; frames 0-6 are lighter (the model copied the
   flash on the cut). No scale pops (one scale per shot: 0.7760, 0.7751, 0.7745). No matte flicker seen on consecutive frames; the
   temporal median changed 0.08 % of the matte on average and removed one single-frame glitch (frame 120, 9.6 %).
7. Her hair is longer and flies wider than the code figure's (up to 14 % of her layer lies outside the code silhouette + 40 px, at 241.1 and 241.7):
   the redraw's choice, but it means she covers more of the plate than the code figure did.

Become clip (230.0-236.04)
1. 230.2-230.6 (frames 5-14): as the model brings her from silhouette to colour, her face in shadow reads as dark skin for about 0.4 s,
   then turns to the sheet's skin. The code version keeps the face dark until the light is on it.
2. 230.0-231.5: in the code version the bands AND the trouser straps glow yellow on the black silhouette, with a warm rim from the sun.
   The model keeps the glowing bands but draws the straps dark, and there is no rim light.
3. From about 232.5: a pale yellow shape beside the strap at her left hip and a warm fringe at one shoe (glows of the model's own that
   the matte kept).
4. The held violet light is the model's version (in her layer); the code's is behind her and its timing differs slightly.
5. Her trousers stay nearly black to the end; the procedural figure's are navy by 233.
6. Feet: 0.6 px median, 6 px max against the code figure; the track moves 0.22 px per frame at most. Stable edges on consecutive frames.

Both: the redraw is 24 fps; the film is 30 fps. Her layer at 24 inside a 30 fps world would judder; a hybrid film wants a 24 fps master,
and then cut times must be snapped to frames (see "Cuts at 24 fps").

## A full conversion (about 150 s of hero shots): what it would need
Feasible, on this evidence
- A single large figure in day or sunrise light, whole body or cut by the frame edge, slow to medium motion, sky or mirror behind her.
  The matte, registration and mirror image ran without overrides. `become` is the model case.
- Shots with a cut inside (handled), a moving camera (handled: the plate carries the camera, the track is slow).

Not feasible or not worth it
- Fast dance: the composite is fine but the model's drawing breaks (day 239.2). Needs retakes or slower source motion; no compositing fix.
- Night: the model returned a near copy of the code figure (`compare_write.mp4`), and at night she is partly a figure of light fibres,
  which is additive and translucent: an opaque matte is the wrong model for it. Dark figure on dark ground was not tested for matting.
- Silhouette shots: the code silhouette is already right and the model blurs the idea (it starts adding a face); nothing to gain.
- Several figures, the 1,024: one matte for everybody, no identity between copies, no way to keep copies in unison across a model clip;
  occlusion between bodies would need a depth order the model's frames do not have.
- Top-down and small figures: too few pixels for the redraw and for the box-based registration; her mirror image is under her, not below.
- Anything that passes in FRONT of her in the code render (lights in the add pass, another body, a road seen from below) is lost; it
  would need a second code pass for "foreground over her".

Work a full conversion would add
- 15 to 25 model clips (6 to 10 s each). Each has its own framing error (handled) and its own lapses: frames where it stops following
  (day 242.5), push-ins (take 1 of the day clip). Expect retakes; join clips ON CUTS, because hair and costume details differ from one
  generation to the next and would pop inside a continuous shot.
- A check per clip: the `qa` strips plus the two numbers `register` prints (feet residual, largest step of the track).
- Machine time about 1.5 min per film second on the 3090: about 4 h for 150 s, unattended.
- A decision on frame rate (24 fps master), and the credits must say what was redrawn and by what.

## Measured run times
Final clean runs of `hybrid.py ... all` from the model clip and the three code renders, on the RTX 3090, nothing else on the GPU:
day 376 s (with the 37 s plate patch), become 342 s. The code renders before that: 135 s for the first (shader warm-up), then 47 to 57 s
each. So 8 to 9 minutes per 6 s clip, of which nothing needs a person.

## Honest view
- The compositing side holds. Cutting her out, putting her on the code figure's place and giving her the code mirror worked on both clips
  with one set of defaults, and the code world, lyric type and HUD come through untouched. On a calm shot (`become`) the result is clean
  enough to cut into the film as it is: stable edges, feet within a pixel or two, a believable mirror image.
- The weak link is the model's drawing, not the composite: faces and hands melt in fast moves, it can stop following for a few frames,
  it cuts a frame late, and it decides lighting for itself (the dark face in the transition, no glowing straps). None of that can be
  repaired by matte or grade; it means choosing which shots to redraw and paying for retakes.
- Across a whole film I would expect it to hold for the calm, lit, single-figure hero shots (sunrise, standing, walking, slow turns: maybe
  half of the 150 s), to be a gamble for the dance, and to be the wrong tool for night, silhouettes, crowds and top-down shots. The film
  would then mix two kinds of figure, redrawn and procedural, cut against each other; whether that reads as a style or as a seam was not
  tested here and is the real question for Jade.
- Not judged: motion. Everything above comes from stills and strips; line boil, edge shimmer and the mirror ripple in motion need eyes
  on the four review files.
