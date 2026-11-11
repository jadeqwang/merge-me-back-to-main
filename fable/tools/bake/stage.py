"""Bake to a staging directory, look, then install (r4 X). The film is rendered by other people all the
time: a track must never be half written where the show loads it.

    stage.py NAME [NAME ...]            # bake into work_fable/tracks_x/, validate there
    stage.py --install NAME [NAME ...]  # move the staged .bin/.json over work_fable/tracks/ (rename: atomic per file)

Preview a staged track with the dev reel (work_fable/dev/reel_x.js, --q "track=NAME&dir=tracks_x").
Run with the repo venv and -I, like bake.py.
"""
from __future__ import annotations

import json
import os
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import motion as M  # noqa: E402
import validate  # noqa: E402
import bake  # noqa: E402

STAGE = M.TRACKS.parent / "tracks_x"


def check(name, d=STAGE):
    import numpy as np
    js = json.loads((d / f"{name}.json").read_text())
    a = np.fromfile(d / f"{name}.bin", dtype=np.float32).reshape(js["frames"], M.NJ, 7).astype(np.float64)
    return validate.check_arrays(a[:, :, :3], a[:, :, 3:], js.get("events", []), name, js.get("loop", False))


def main(argv):
    names = [a for a in argv if not a.startswith("-")]
    if "--install" in argv:
        for n in names:
            ok, lines = check(n)
            if not ok:
                print(f"FAIL {n}: not installed\n" + "\n".join(lines))
                return 1
            for ext in (".bin", ".json"):
                os.replace(STAGE / f"{n}{ext}", M.TRACKS / f"{n}{ext}")
            print(f"installed {n}")
        return 0
    rec = bake.all_recipes()
    bad = 0
    for n in names:
        t0 = time.time()
        m = rec[n]()
        M.write_track(m, n, out_dir=STAGE)
        ok, lines = check(n)
        ev = [(round(e["t"], 3), e["name"]) for e in m.events if not e["name"].startswith("foot")]
        print(f"{'PASS' if ok else 'FAIL'} {n}: {m.frames} frames, events={ev}  [{time.time() - t0:.1f}s] -> {STAGE}")
        if not ok or "-v" in argv:
            print("\n".join(lines))
        bad += not ok
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
