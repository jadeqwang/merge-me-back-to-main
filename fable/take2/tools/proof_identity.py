#!/usr/bin/env python3
"""The proof range of the film (bars 28-43) against the proof itself, by pixel diff.
   .venv/bin/python fable/take2/tools/proof_identity.py [k,k,...]
Renders proof frames k (fable/proof/tools/render.mjs, unchanged; t = bar 28 + k/30) and the film at the same song times, twice:
  proofbug=1  the port exactly as the proof (expected max diff 0)
  default     the film as rendered (strip-lyric fix on; expected to differ only where "And every branch remembers" / "Where I started
              from" are on screen, bars 32-38)
Both with hud=0. Output: work_fable/take2/tests/proofdiff/."""
import json, os, subprocess, sys
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
D = os.path.join(ROOT, 'work_fable', 'take2', 'tests', 'proofdiff'); os.makedirs(D, exist_ok=True)
KS = [int(x) for x in sys.argv[1].split(',')] if len(sys.argv) > 1 else [0, 75, 130, 300, 400, 467, 470, 520, 560, 610, 650, 700, 779]
T = json.load(open(os.path.join(ROOT, 'analysis_v3', 'timing.json'))); t0 = T['bars'][27]['start']   # the proof's t0 = bar 28 start
run = lambda *a: subprocess.run(['node', *a], cwd=ROOT, check=True, capture_output=True, text=True)
run('fable/proof/tools/render.mjs', '--timing', '/analysis_v3/timing.json', '--frames', ','.join(f'{k}:{D}/proof_{k}.png' for k in KS))
for tag, q in [('bug', 'hud=0&proofbug=1'), ('film', 'hud=0')]:
    run('fable/take2/tools/render.mjs', '--q', q, '--stills', ','.join(f'{t0 + k / 30!r}:{D}/{tag}_{k}.png' for k in KS))
print(f'proof t0 {t0} (bar 28); frames {KS}')
for k in KS:
    a = np.asarray(Image.open(f'{D}/proof_{k}.png')).astype(np.int16)
    r = []
    for tag in ('bug', 'film'):
        d = np.abs(a - np.asarray(Image.open(f'{D}/{tag}_{k}.png')).astype(np.int16)); m = d.max(axis=2) > 0
        ys = np.where(m.any(axis=1))[0]
        r.append(f'{tag}: max {d.max():3d}, px {m.sum():7d}' + (f' (rows {ys.min()}-{ys.max()})' if len(ys) else ''))
    print(f'  k {k:4d} t {t0 + k / 30:8.3f}   ' + '   '.join(r))
