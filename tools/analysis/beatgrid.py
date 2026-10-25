"""Beat grid v1: integer beat indices for beat_this pulses -> robust smoothing spline -> work/grid_v1.npy
(adapted from vibesong beatgrid.py / final_grid.py)."""
import json, numpy as np
from scipy.interpolate import UnivariateSpline
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
bt = json.load(open(WK/'beatthis.json'))['mix']
b = np.array(bt['beats'])
P = 0.437
idx = [0]; keep = [0]
for i in range(1, len(b)):
    x = (b[i] - b[keep[-1]]) / P
    k = round(x)
    if k >= 1 and abs(x - k) < 0.25:
        idx.append(idx[-1] + k); keep.append(i)
idx = np.array(idx); t = b[keep]
m = np.ones(len(t), bool)
for it in range(4):
    sp = UnivariateSpline(idx[m], t[m], k=3, s=m.sum()*0.012**2)
    r = t - sp(idx); m = np.abs(r) < 0.035
    print(f'iter {it}: inliers {m.sum()}/{len(t)} resid rms {r[m].std()*1000:.1f} ms')
N = idx[-1]
g = sp(np.arange(N+1))
np.save(WK/'grid_v1.npy', g)
per = np.diff(g)
print('beats', len(g), 'first', g[0], 'last', g[-1])
for s in range(0, len(per), 32):
    print(f'{g[s]:7.2f} bpm {60/np.mean(per[s:s+32]):7.3f}')
