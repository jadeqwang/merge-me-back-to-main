#!/usr/bin/env python3
"""Plate preprocessing for the WebGL reconstruction renderer.

For a still image or a video, writes into OUT/:
  rgb/000000.jpg      source frames (resized to --w)
  depth/000000.png    16-bit relative inverse depth (near = bright), temporally smoothed for video
  matte/000000.png    8-bit person/foreground alpha (BiRefNet)
  meta.json           {w, h, n, fps, depth_lo, depth_hi}

Usage: .venv/bin/python tools/prep/prep.py SRC OUT [--w=1280] [--fps=24] [--no-matte] [--every=1]
"""
import json
import os
import subprocess
import sys

import numpy as np
import torch
from PIL import Image

FFMPEG = "/home/jade/Documents/vibesong/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
DEV = "cuda"


def arg(name, default):
    for a in sys.argv:
        if a.startswith(f"--{name}="):
            return type(default)(a.split("=", 1)[1])
    return default


def frames_of(src, w, fps, tmp):
    if src.lower().endswith((".png", ".jpg", ".jpeg", ".webp")):
        im = Image.open(src).convert("RGB")
        h = round(im.height * w / im.width / 2) * 2
        return [im.resize((w, h), Image.LANCZOS)]
    os.makedirs(tmp, exist_ok=True)
    subprocess.run([FFMPEG, "-v", "error", "-y", "-i", src, "-vf", f"fps={fps},scale={w}:-2:flags=lanczos",
                    "-q:v", "2", os.path.join(tmp, "%06d.jpg")], check=True)
    return [Image.open(os.path.join(tmp, f)).convert("RGB") for f in sorted(os.listdir(tmp))]


def depth_model():
    from transformers import AutoImageProcessor, AutoModelForDepthEstimation
    name = "depth-anything/Depth-Anything-V2-Large-hf"
    return AutoImageProcessor.from_pretrained(name), AutoModelForDepthEstimation.from_pretrained(name).to(DEV).half().eval()


def matte_model():
    from transformers import AutoModelForImageSegmentation
    m = AutoModelForImageSegmentation.from_pretrained("ZhengPeng7/BiRefNet", trust_remote_code=True)
    return m.to(DEV).half().eval()


@torch.no_grad()
def run_depth(proc, model, im):
    x = proc(images=im, return_tensors="pt")["pixel_values"].to(DEV).half()
    d = model(pixel_values=x).predicted_depth[:, None].float()
    d = torch.nn.functional.interpolate(d, size=(im.height, im.width), mode="bicubic", align_corners=False)
    return d[0, 0].cpu().numpy()


@torch.no_grad()
def run_matte(model, im):
    import torchvision.transforms as T
    tf = T.Compose([T.Resize((1024, 1024)), T.ToTensor(), T.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])])
    x = tf(im)[None].to(DEV).half()
    p = model(x)[-1].sigmoid().float()
    p = torch.nn.functional.interpolate(p, size=(im.height, im.width), mode="bilinear", align_corners=False)
    return p[0, 0].cpu().numpy()


def main():
    src, out = sys.argv[1], sys.argv[2]
    w, fps, every = arg("w", 1280), arg("fps", 24), arg("every", 1)
    for sub in ("rgb", "depth", "matte"):
        os.makedirs(os.path.join(out, sub), exist_ok=True)
    ims = frames_of(src, w, fps, os.path.join(out, "_src"))[::every]
    proc, dm = depth_model()
    mm = None if "--no-matte" in sys.argv else matte_model()
    depths = [run_depth(proc, dm, im) for im in ims]
    # one global range per plate so depth doesn't breathe frame to frame; light temporal EMA for video
    lo, hi = (float(np.percentile(np.stack(depths), p)) for p in (0.5, 99.5))
    prev = None
    for i, (im, d) in enumerate(zip(ims, depths)):
        d = np.clip((d - lo) / max(hi - lo, 1e-6), 0, 1)
        if prev is not None:
            d = 0.65 * d + 0.35 * prev
        prev = d
        im.save(os.path.join(out, "rgb", f"{i:06d}.jpg"), quality=94)
        Image.fromarray((d * 65535).astype(np.uint16)).save(os.path.join(out, "depth", f"{i:06d}.png"))
        if mm is not None:
            a = run_matte(mm, im)
            Image.fromarray((np.clip(a, 0, 1) * 255).astype(np.uint8)).save(os.path.join(out, "matte", f"{i:06d}.png"))
    json.dump({"w": ims[0].width, "h": ims[0].height, "n": len(ims), "fps": fps / every, "depth_lo": lo, "depth_hi": hi},
              open(os.path.join(out, "meta.json"), "w"), indent=1)
    print(f"{out}: {len(ims)} frames {ims[0].width}x{ims[0].height}")


if __name__ == "__main__":
    main()
