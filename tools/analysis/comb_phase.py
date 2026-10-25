"""Per-window grid phase check: shift (+-60 ms) of the 16th-note comb built from grid_v1 that maximizes onset energy,
for mix / other / bass / drums onset envelopes, 16-beat windows. Validates grid in drumless sections."""
import numpy as np
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
E = np.load(WK/'env.npz'); T = E['T']
g = np.load(WK/'grid_v1.npy')
shifts = np.arange(-0.06, 0.0605, 0.0025)
def best(O, beats, sub=4):
    pts = np.concatenate([beats[:-1] + (beats[1:]-beats[:-1])*k/sub for k in range(sub)])
    sc = [np.interp(pts + s, T, O).mean() for s in shifts]
    sc = np.array(sc); j = np.argmax(sc)
    contrast = sc[j] / np.median(sc)
    return shifts[j]*1000, contrast
rows = []
for s in range(0, len(g)-16, 16):
    w = g[s:s+17]
    line = f'{g[s]:7.2f}'
    r = dict(t=g[s], i=s)
    for k in ('onset_drums', 'onset_mix', 'onset_other', 'onset_bass'):
        O = E[k]
        sh, c = best(O, w, sub=1 if k == 'onset_drums' else 4)
        r[k] = (sh, c); line += f'  {k[6:]:5s} {sh:6.1f}ms x{c:4.2f}'
    rows.append(r); print(line)
np.save(WK/'comb_phase.npy', rows, allow_pickle=True)
