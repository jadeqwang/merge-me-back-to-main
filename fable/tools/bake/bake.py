"""Bake tracks from recipes.

    bake.py --list
    bake.py NAME [NAME ...] | all   [--no-preview] [--mp4]

Writes work_fable/tracks/<name>.bin/.json, validates the written file and renders the filmstrip
preview (work_fable/tracks/previews/<name>.png). Recipes live in recipes_*.py next to this file.
Run with the repo venv and -I:  .venv/bin/python -I fable/tools/bake/bake.py all
"""
from __future__ import annotations

import importlib
import sys
import time
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import motion as M  # noqa: E402
import validate  # noqa: E402


def all_recipes():
    out = {}
    for p in sorted(HERE.glob("recipes_*.py")):
        out.update(importlib.import_module(p.stem).RECIPES)
    return out


def main(argv):
    flags = {a for a in argv if a.startswith("--")}
    names = [a for a in argv if not a.startswith("--")]
    rec = all_recipes()
    if "--list" in flags or not names:
        for n, fn in rec.items():
            print(f"{n:18s} {(fn.__doc__ or '').strip().splitlines()[0] if fn.__doc__ else ''}")
        return 0
    if names == ["all"]:
        names = list(rec)
    M.write_skeleton_json()
    bad = 0
    for n in names:
        t0 = time.time()
        m = rec[n]()
        M.write_track(m, n)
        ok, lines = validate.check_track(n)
        ev = [(round(e["t"], 2), e["name"]) for e in m.events if not e["name"].startswith("foot")]
        nf = sum(e["name"].startswith("foot") for e in m.events)
        print(f"{'PASS' if ok else 'FAIL'} {n}: {m.frames} frames, {m.frames / 60 if m.loop else (m.frames - 1) / 60:.2f} s, "
              f"loop={m.loop}, footfalls={nf}, events={ev}  [{time.time() - t0:.1f}s]")
        if not ok:
            bad += 1
            print("\n".join(lines))
        if "--no-preview" not in flags:
            import preview_track as PV
            PV.filmstrip(n, n=8 if m.loop and m.frames < 200 else 16, az=75.0 if m.loop and m.frames < 200 else 30.0)
            if "--mp4" in flags:
                PV.movie(n)
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
