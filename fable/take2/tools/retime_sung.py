#!/usr/bin/env python3
"""Re-time a sung likeness clip so its mouth shapes land on the word times (the video model's lip-sync drifts: no single lag fits).
   retime_sung.py PLATE_DIR OUT_DIR "tau:clip,tau:clip,..." [hold0:hold1]
tau = seconds from the start of the audio window, clip = seconds into the clip; piecewise linear. Output frames at 30 fps (w_%04d.jpg).
Frames are blended only inside hold0..hold1 (the slowed held note); nearest frame elsewhere. Run with work_fable/venv_hybrid/bin/python."""
import sys, glob, os, numpy as np
from PIL import Image
plate, out, anchors = sys.argv[1:4]
A = [tuple(map(float, a.split(":"))) for a in anchors.split(",")]
h0, h1 = map(float, sys.argv[4].split(":")) if len(sys.argv) > 4 else (1e9, -1e9)
fs = sorted(glob.glob(os.path.join(plate, "frames", "f_*.jpg"))); os.makedirs(out, exist_ok=True)
xs, ys = [a for a, _ in A], [b for _, b in A]
for k in range(int(round(xs[-1] * 30))):
    tau = k / 30; c = float(np.interp(tau, xs, ys)) * 24
    i = min(int(c), len(fs) - 1); j = min(i + 1, len(fs) - 1); f = c - int(c)
    im = Image.blend(Image.open(fs[i]), Image.open(fs[j]), f) if h0 < tau < h1 and 0.15 < f < 0.85 else Image.open(fs[j] if f >= 0.5 else fs[i])
    im.save(os.path.join(out, f"w_{k+1:04d}.jpg"), quality=95)
