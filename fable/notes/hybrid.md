# Hybrid shot prototype: her redrawn by a video model, over the code-drawn world (2026-11-10)

Status: WORKING PROTOTYPE on two 6 s clips, no money spent (everything local). Not adopted; this is a test for Jade's decision.
(This first version of the note is a milestone checkpoint; the findings section is filled in at the end of the pass.)

## What it is
The video-model test (`review/fable_v7/seedance_test/README.md`) showed that Seedance redraws her well from the character sheet but drifts on
the background, lyric type and HUD. Here only HER is taken from the model's frames; sky, sun, mirror, roads, lyrics and HUD stay code.

    plate (code, no body)  +  her mirror image (her layer flipped, the code mirror's law)  +  her layer (model frame, matted, upscaled, registered)  +  HUD guard

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
`onnxruntime-gpu` must be a CUDA 12 build (1.22.0) to share torch's CUDA libraries; the newest wheel wants CUDA 13 and silently falls back to
the CPU (12 s per frame instead of 0.4 s).

## Per shot
A shot is a small JSON in `fable/tools/hybrid/shots/` (`name`, `t0`, `fps`, `frames`, `model` = the model's clip; optional overrides).
```
# 1. code renders at 1920x1080, 24 fps, mb 4: ref (the film), plate (no body), norefl (body without its mirror image)
fable/tools/hybrid/render_plates.sh day 236.65 145
fable/tools/hybrid/render_plates.sh become 230.0 145
# 2. everything else
work_fable/venv_hybrid/bin/python -I fable/tools/hybrid/hybrid.py fable/tools/hybrid/shots/day.json all
work_fable/venv_hybrid/bin/python -I fable/tools/hybrid/hybrid.py fable/tools/hybrid/shots/become.json all
```
Any stage can be re-run alone (`... day.json comp,encode,qa`). Intermediates: `work_fable/hybrid/<name>/`; judging strips: `work_fable/hybrid/qa/`.

The switch in the show: `fable/show/cast.js` reads `?hide=`. `hide=fig` draws no body at all (the plate); `hide=refl` draws the bodies but not
their mirror image. Without the parameter nothing changes. Everything that is not a body (world, roads, her ring, lyric type, HUD, the held
violet light of 13_catch) stays in the plate.

## Stages (`hybrid.py`)
| stage | what | time for 145 frames |
|---|---|---|
| render_plates.sh | three code renders | 50 s each (+ 30 s start-up each) |
| frames | model clip to PNG; finds the model's own cut frames near the code cuts | 1 s |
| patch | clean plate stills for frames where the code frame blends two shots or the model cuts a frame late | 37 s if needed |
| code | code figure mask = `norefl - plate`, code mirror image = `ref - norefl`, boxes | 15 s |
| a0 | coarse matte, BiRefNet on the whole 720p frame (only to find her) | 55 s |
| up | Real-ESRGAN anime 6B x4, stored at x2 (2560x1440) | 93 s |
| a1 | fine matte: BiRefNet on a square crop round her from the x2 frames | 60 s |
| alpha | orphans dropped, road guard at shoe level, light choke, motion-aware temporal median | 22 s |
| register | lag check, scale + offset to the code figure, mirror line | 7 s |
| comp | foreground colour estimate, warp, mirror image, light wrap, over, HUD guard | 76 s |
| encode | the two review files, AAC from `inputs/Merge.wav` | 5 s |
| qa | strips | 2 s |
