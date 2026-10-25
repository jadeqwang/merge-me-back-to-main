"""Snap grid_v1 beats to drum-stem / mix onsets (+-40 ms), report offsets per region (adapted from vibesong beat_refine.py)."""
import numpy as np
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
E = np.load(WK/'env.npz'); T = E['T']
g = np.load(WK/'grid_v1.npy')
def snap(O, t, w=0.04):
    m = (T > t-w) & (T < t+w); i = np.argmax(O[m]); return T[m][i], O[m][i]
res = {}
for key in ('onset_drums', 'onset_mix', 'onset_other', 'onset_bass'):
    O = E[key]; med = np.median(O[O > 0]) if (O > 0).any() else 1
    sn = np.array([snap(O, t) for t in g]); res[key] = sn
    strong = sn[:, 1] > 6*med
    off = (sn[:, 0] - g)*1000
    print(f'{key}: strong {strong.sum()} median off {np.median(off[strong]):.1f} ms std {off[strong].std():.1f}')
    for s in range(0, len(g), 32):
        mm = strong[s:s+32]
        print(f'   {g[s]:7.2f} n={mm.sum():2d} off med {np.median(off[s:s+32][mm]) if mm.any() else np.nan:6.1f} std {off[s:s+32][mm].std() if mm.any() else np.nan:5.1f}')
np.savez(WK/'snap.npz', **{k: v for k, v in res.items()})
