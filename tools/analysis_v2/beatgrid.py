"""Beat grid v1 for the v2 song -> $WORK_DIR/grid_v1.npy.
Why not tools/analysis/beatgrid.py: its interval chaining (fixed 0.437 s period) slipped by one beat in the v2 intro,
where beat_this tracks the off-beat for the first ~8 s (0.28, 0.72, ... then 8.16 -> 8.84 is a 0.68 s step), so every bar
number came out one beat late. Here beat indices come from a robust constant-period line through ALL beat_this mix
beats (v2 is metronomic: kick onsets fit a single 138.00 BPM line to 2.6 ms rms over bars 33-150), and bar 1 beat 1 is
the earliest beat (>= 0 s) on the downbeat phase voted by beat_this's downbeats. A smoothing spline on the inlier
beats then gives grid_v1 (refined by comb_phase.py / final_grid.py exactly as in v1)."""
import json, sys, numpy as np, collections
from scipy.interpolate import UnivariateSpline
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'analysis'))
from apaths import WK, DUR
bt = json.load(open(WK/'beatthis.json'))['mix']
b = np.array(bt['beats']); d = np.array(bt['downbeats'])
best = (0, None, None)                         # coarse search: period x phase maximising beats within 35 ms
for P in np.arange(0.40, 0.48, 0.00002):
    ph = np.mod(b, P); h, e = np.histogram(ph, bins=int(P/0.005), range=(0, P))
    j = np.argmax(np.convolve(np.r_[h, h[:13]], np.ones(14), 'valid')[:len(h)])
    n = np.convolve(np.r_[h, h[:13]], np.ones(14), 'valid')[j]
    if n > best[0]: best = (n, P, e[j] + 0.035)
P, t0 = best[1], best[2]
m = np.ones(len(b), bool)
for it in range(6):
    k = np.round((b - t0)/P); c = np.polyfit(k[m], b[m], 1); P, t0 = c[0], c[1]
    r = b - (t0 + np.round((b - t0)/P)*P); m = np.abs(r) < 0.035
    print(f'iter {it}: period {P:.5f} ({60/P:.3f} BPM) inliers {m.sum()}/{len(b)} rms {r[m].std()*1000:.1f} ms')
kd = np.round((d - t0)/P); okd = np.abs(d - (t0 + kd*P)) < 0.05
vote = collections.Counter((kd[okd] % 4).astype(int)); ph = vote.most_common(1)[0][0]
print('downbeat phase vote', dict(vote))
k0 = np.ceil((0 - t0)/P)                      # first beat index >= 0 s
while (k0 - ph) % 4: k0 += 1                   # ... on the downbeat phase
if t0 + (k0-4)*P >= 0: k0 -= 4
idx = (np.round((b - t0)/P) - k0).astype(int); keep = m & (idx >= 0)
sp = UnivariateSpline(idx[keep], b[keep], k=3, s=keep.sum()*0.012**2)
N = int(np.floor((b[-1] - (t0 + k0*P))/P))
g = sp(np.arange(N+1))
np.save(WK/'grid_v1.npy', g)
print('beats', len(g), 'bar 1 beat 1 =', round(float(g[0]), 4), 'last', round(float(g[-1]), 3))
per = np.diff(g)
for s in range(0, len(per), 64): print(f'bar {s//4+1:3d} {g[s]:7.2f} bpm {60/np.mean(per[s:s+64]):7.3f}')
