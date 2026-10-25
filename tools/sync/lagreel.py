#!/usr/bin/env python3
"""Lag audition clips: take video + song audio at several lags, stacked side by side with labels (no drawtext: lag label burned via PIL overlay).
  .venv/bin/python tools/sync/lagreel.py TAKE_BASE S0 LAG1,LAG2,LAG3 OUT.mp4
clip time = song time - S0 + lag. Audio = full mix from song time S0 - lag... each panel delayed so the audio is common: we shift video instead."""
import os, subprocess, sys
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FF = "/home/jade/Documents/1-music-shipped/moongazing/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
base, s0, lags, out = sys.argv[1], float(sys.argv[2]), [float(x) for x in sys.argv[3].split(",")], sys.argv[4]
mp4 = os.path.join(ROOT, "media/gen", base + ".mp4")
song = os.path.join(ROOT, "inputs/Merge Me Back to Main.wav")
A = s0 + max(lags) + .05                       # common song window start
dur = 5.0
ins, fc = [], []
for i, L in enumerate(lags):
    cs = A - s0 + L                            # clip time for song time A
    ins += ["-ss", f"{cs:.3f}", "-t", f"{dur:.3f}", "-i", mp4]
    lab = os.path.join(ROOT, "out/tmp", f"lab_{i}.png"); os.makedirs(os.path.dirname(lab), exist_ok=True)
    im = Image.new("RGBA", (420, 40), (0, 0, 0, 160)); ImageDraw.Draw(im).text((8, 10), f"lag {L:+.2f}s", fill=(255, 255, 0)); im.save(lab)
    ins += ["-i", lab]
for i in range(len(lags)):
    fc.append(f"[{2*i}:v]setpts=PTS-STARTPTS,fps=24,scale=640:-2[v{i}];[v{i}][{2*i+1}:v]overlay=0:0[w{i}]")
fc.append("".join(f"[w{i}]" for i in range(len(lags))) + f"hstack=inputs={len(lags)}[v]")
cmd = [FF, "-v", "error", "-y"] + ins + ["-ss", f"{A:.3f}", "-t", f"{dur:.3f}", "-i", song, "-filter_complex", ";".join(fc),
       "-map", "[v]", "-map", f"{2*len(lags)}:a", "-c:v", "libx264", "-crf", "22", "-preset", "fast", "-r", "24", "-c:a", "aac", "-b:a", "160k", "-shortest", out]
subprocess.run(cmd, check=True); print(out)
