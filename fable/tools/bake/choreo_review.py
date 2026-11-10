"""Review movies for the choreography tracks: stick figure with beat flashes, the song underneath.

    choreo_review.py build drop            # front (az 15), side (az 90) and top views, muxed with inputs/Merge.mp3
Output: work_fable/tracks/previews/<name>_{front,side,top}.mp4
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import motion as M  # noqa: E402
import preview_track as PV  # noqa: E402

VIEWS = {"front": (15.0, 12.0), "side": (90.0, 10.0), "top": (0.0, 86.0)}


def review(name, views=("front", "side", "top")):
    js = json.loads((M.TRACKS / f"{name}.json").read_text())
    t0 = js["meta"].get("song_t0")
    dur = js["duration"]
    outs = []
    for v in views:
        az, el = VIEWS[v]
        raw = PV.OUT / f"_{name}_{v}_raw.mp4"
        PV.movie(name, song_t0=t0, az=az, el=el, out=raw)
        out = PV.OUT / f"{name}_{v}.mp4"
        if t0 is None:
            raw.replace(out)
        else:
            subprocess.run(["/usr/bin/ffmpeg", "-y", "-loglevel", "error", "-i", str(raw), "-ss", f"{t0:.4f}", "-t", f"{dur:.3f}",
                            "-i", str(M.ROOT / "inputs" / "Merge.mp3"), "-map", "0:v", "-map", "1:a", "-c:v", "copy",
                            "-c:a", "aac", "-b:a", "160k", "-shortest", str(out)], check=True)
            raw.unlink()
        outs.append(out)
    return outs


if __name__ == "__main__":
    for n in sys.argv[1:]:
        for o in review(n):
            print(o)
