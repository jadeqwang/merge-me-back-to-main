#!/usr/bin/env python3
"""Replace the picture of MASTER between song times T0..T1 with SEG (rendered with --from T0 --to T1); audio stays the master's.
  .venv/bin/python tools/splice.py MASTER.mp4 SEG.mp4 T0 T1 OUT.mp4
Cuts land on whole frames at 30 fps (T0/T1 are rounded to the frame grid the renderer used)."""
import subprocess, sys
FF = "/home/jade/Documents/1-music-shipped/moongazing/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
master, seg, t0, t1, out = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4]), sys.argv[5]
fps = 30
f0, f1 = round(t0 * fps), round(t1 * fps)
fc = (f"[0:v]trim=start_frame=0:end_frame={f0},setpts=PTS-STARTPTS[a];"
      f"[1:v]trim=start_frame=0:end_frame={f1 - f0},setpts=PTS-STARTPTS[b];"
      f"[0:v]trim=start_frame={f1},setpts=PTS-STARTPTS[c];[a][b][c]concat=n=3:v=1:a=0[v]")
subprocess.run([FF, "-v", "error", "-y", "-i", master, "-i", seg, "-filter_complex", fc, "-map", "[v]", "-map", "0:a", "-c:v", "libx264",
                "-preset", "medium", "-crf", "17", "-pix_fmt", "yuv420p", "-c:a", "copy", "-movflags", "+faststart", out], check=True)
print(out)
