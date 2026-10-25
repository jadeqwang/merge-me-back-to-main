#!/usr/bin/env python3
"""Twitter teaser from the master: intro (bars 1-16) spliced on the bar line into the life montage, pre-chorus + chorus 1 (bar 28 -> the
held last word of chorus 1: v2 "can come undone", v1 "is ever gone").
  .venv/bin/python tools/teaser.py MASTER.mp4 OUT.mp4 [--timing=v2|v1]     (or env TEASER_TIMING; default v2 = the revised song "Merge")
One-beat audio crossfade at the splice; picture cuts hard on the downbeat. Ends with a 1.2 s fade that starts as the held word ends."""
import json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = "/home/jade/Documents/1-music-shipped/moongazing/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
src, out = sys.argv[1], sys.argv[2]
timing = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--timing=")), os.environ.get("TEASER_TIMING", "v2"))
T = json.load(open(os.path.join(ROOT, {"v1": "analysis/timing.json", "v2": "analysis_v2/timing.json"}[timing])))
bar = lambda n: T["bars"][n - 1]["start"]
line = lambda i: next(l for l in T["lyrics"]["lines"] if l["id"] == i)     # by v1 line id (kept in v2)
beat = bar(2) - bar(1); beat /= 4
a0, a1 = 0.0, bar(17)          # intro
if timing == "v1":
    b1, v0 = 101.6, 47.75      # v1 values as delivered (teaser for master_v2)
else:
    b1 = line(10)["words"][-1]["end"] + 1.2      # 'undone' held to 99.92 -> fade 99.92..101.12
    v0 = line(4)["words"][0]["start"] - .18      # the montage's first cut (engine/show/main.js MONTAGE0 = 47.29)
b0 = bar(28)                   # 'each one a story to unfold' (her lives)
xf = beat
# v0: hold the montage's first frame back to the bar line so no sliver of the previous shot shows
fc = (f"[0:v]trim={a0}:{a1},setpts=PTS-STARTPTS[va];[0:v]trim={v0}:{b1},setpts=PTS-STARTPTS,tpad=start_duration={v0 - b0:.3f}:start_mode=clone[vb];"
      f"[va][vb]concat=n=2:v=1:a=0,fade=t=out:st={(a1 - a0) + (b1 - b0) - 1.2:.3f}:d=1.2[v];"
      f"[0:a]atrim={a0}:{a1 + xf / 2},asetpts=PTS-STARTPTS[aa];[0:a]atrim={b0 - xf / 2}:{b1},asetpts=PTS-STARTPTS[ab];"
      f"[aa][ab]acrossfade=d={xf:.3f}:c1=tri:c2=tri,afade=t=out:st={(a1 - a0) + (b1 - b0) - 1.2:.3f}:d=1.2[a]")
subprocess.run([FF, "-v", "error", "-y", "-i", src, "-filter_complex", fc, "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "slow",
                "-crf", "18", "-maxrate", "16M", "-bufsize", "32M", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "256k", "-movflags", "+faststart", out], check=True)
print(out, timing, f"splice bar17 {a1:.3f} -> bar28 {b0:.3f}, end {b1:.3f}, {(a1 - a0) + (b1 - b0):.2f}s")
