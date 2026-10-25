"""Final beat grid -> work/grid_final.json (adapted from vibesong final_grid.py).
Anchors: (1) drum-stem onset snaps (kick on every beat in drum sections, +-25 ms of grid_v1, strength > 6x median);
(2) in drumless windows, 16-beat comb phase of the 'other' stem (plucks/arp) at 16th resolution, bias-corrected to the
drum reference. Cubic smoothing spline of time vs beat index. Tail after the last pulse extrapolated."""
import json, numpy as np
from scipy.interpolate import UnivariateSpline
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
E = np.load(WK/'env.npz'); T = E['T']
g = np.load(WK/'grid_v1.npy'); idx = np.arange(len(g))
rows = list(np.load(WK/'comb_phase.npy', allow_pickle=True))
O = E['onset_drums']; med = np.median(O[O > 0])
def snap(t, w=0.025):
    m = (T > t-w) & (T < t+w); i = np.argmax(O[m]); return T[m][i], O[m][i]
sn = np.array([snap(t) for t in g])
drum_ok = sn[:, 1] > 6*med
# bias between 'other' comb and drum comb
pairs = [r['onset_other'][0] - r['onset_drums'][0] for r in rows if r['onset_drums'][1] > 8 and r['onset_other'][1] > 1.8]
bias = float(np.median(pairs)); print('other-vs-drum comb bias ms', bias, 'from', len(pairs), 'windows')
A_i, A_t, A_w, A_src = [], [], [], []
for i in idx[drum_ok]:
    A_i.append(i); A_t.append(sn[i, 0]); A_w.append(1.0); A_src.append('drum')
drum_windows = set()
for r in rows:
    s = r['i']; n_drum = drum_ok[s:s+16].sum()
    if n_drum >= 6: continue
    sh, c = r['onset_other']
    if c < 1.8: continue
    for i in range(s, min(s+16, len(g))):
        A_i.append(i); A_t.append(g[i] + (sh - bias)/1000); A_w.append(0.5); A_src.append('comb')
A_i = np.array(A_i); A_t = np.array(A_t); A_w = np.array(A_w); o = np.argsort(A_i, kind='stable')
A_i, A_t, A_w, A_src = A_i[o], A_t[o], A_w[o], np.array(A_src)[o]
# collapse duplicates (keep drum)
keep = np.ones(len(A_i), bool)
for k in range(1, len(A_i)):
    if A_i[k] == A_i[k-1]: keep[k if A_src[k] == 'comb' else k-1] = False
A_i, A_t, A_w, A_src = A_i[keep], A_t[keep], A_w[keep], A_src[keep]
m = np.ones(len(A_i), bool)
for it in range(3):
    sp = UnivariateSpline(A_i[m], A_t[m], w=A_w[m], k=3, s=m.sum()*0.003**2*0.6)
    r = A_t - sp(A_i); m = np.abs(r) < 0.02
G = sp(idx)
r = A_t - sp(A_i)
for src in ('drum', 'comb'):
    mm = (A_src == src) & m
    print(f'{src}: n={mm.sum()} resid rms {r[mm].std()*1000:.1f} ms p95 {np.percentile(np.abs(r[mm]), 95)*1000:.1f} max {np.abs(r[mm]).max()*1000:.1f}')
stats = {src: dict(n=int(((A_src == src) & m).sum()), resid_rms_ms=round(float(r[(A_src == src) & m].std()*1000), 1),
                    resid_p95_ms=round(float(np.percentile(np.abs(r[(A_src == src) & m]), 95)*1000), 1)) for src in ('drum', 'comb')}
# zones: which beats are anchored within +-8 beats
anch = np.zeros(len(G), bool)
for i in A_i[m]: anch[max(0, i-2):i+3] = True
# extend tail to the end of audio with last local period
dur = DUR
per_end = np.mean(np.diff(G[-9:]))
tail = []
t = G[-1]
while t + per_end < dur - 0.05:
    t += per_end; tail.append(t)
allG = np.concatenate([G, tail])
zone = ['anchored' if (i < len(G) and anch[i]) else ('extrapolated' if i >= len(G) else 'interpolated') for i in range(len(allG))]
print('tail beats', len(tail), 'period', per_end)
# drift check vs constant tempo and 135 BPM
n = np.arange(len(G)); c = np.polyfit(n, G, 1); lin = np.polyval(c, n)
c2 = np.polyfit(n, G, 2)
drift = dict(constant_fit_bpm=round(60/c[0], 3), constant_fit_max_err_ms=round(float(np.abs(G-lin).max()*1000), 1),
             suno_135_max_err_s=round(float(np.abs(G - (G[0] + n*60/135)).max()), 2),
             bpm_start=round(60/np.mean(np.diff(G[:32])), 2), bpm_end=round(60/np.mean(np.diff(G[-32:])), 2),
             mean_bpm=round(60*(len(G)-1)/(G[-1]-G[0]), 3))
print(drift)
beats = []
for i, t in enumerate(allG):
    bpm = 60/(allG[i+1]-t) if i+1 < len(allG) else 60/(t-allG[i-1])
    beats.append(dict(i=i, t=round(float(t), 4), bar=i//4 + 1, beat=i % 4 + 1, bpm=round(float(bpm), 2), zone=zone[i]))
json.dump(dict(beats=beats, fit=stats, drift=drift, bias_ms=bias), open(WK/'grid_final.json', 'w'), indent=0)
np.save(WK/'grid_final.npy', allG)
for s in range(0, len(G), 64): print(f'bar {s//4+1:3d} {G[s]:8.3f}  bpm {60/np.mean(np.diff(G[s:s+64])):7.3f}  zone {zone[s]}')
print('zones', {z: zone.count(z) for z in set(zone)})
print('interpolated ranges:', [(round(float(allG[i]),2)) for i in range(1,len(allG)) if zone[i] != zone[i-1]])
