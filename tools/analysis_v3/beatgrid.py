"""Beat grid estimate (a) for the v3 song (inputs/Merge (keychange down).wav) -> $WORK_DIR/grid_v1.npy.
Measured on the new file only (no use of the old file). Why not tools/analysis_v2/beatgrid.py: that one fits ONE
constant-period line, but v3 accelerates (~138 -> ~141 BPM). Why not tools/analysis/beatgrid.py: its interval chaining
slips when beat_this follows the off-beat (the v2 intro pitfall).
Method: pulse candidates = beat_this mix beats + strong drum-stem onsets. Seed in the 24 s window whose best local
constant-period line has the most inliers; then track outward beat by beat with the local period of the last 16
accepted beats (prediction +- 22 % of a beat; candidates near the half-beat are rejected, so an off-beat-following
tracker cannot shift the index). Downbeat phase = beat_this downbeat vote. Bar 1 beat 1 = first downbeat >= 0 s.
A smoothing spline over the accepted beats gives grid_v1 (refined later by comb_phase.py / final_grid.py)."""
import json, sys, numpy as np, collections, scipy.signal as ss
from scipy.interpolate import UnivariateSpline
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'analysis'))
from apaths import WK, DUR
bt = json.load(open(WK/'beatthis.json'))
b = np.array(bt['mix']['beats']); d = np.array(bt['mix']['downbeats'])
E = np.load(WK/'env.npz'); T = E['T']; O = E['onset_drums']; med = np.median(O[O > 0])
pk = ss.find_peaks(O, height=8*med, distance=40)[0]          # strong drum onsets, >= 200 ms apart
cand = np.unique(np.round(np.sort(np.concatenate([b, T[pk]])), 3))
# merge candidates closer than 40 ms (keep the beat_this one = first in the pair is fine for tracking)
keep = np.r_[True, np.diff(cand) > 0.04]; cand = cand[keep]
def linefit(t, P0):
    best = (0, None, None)
    for P in np.arange(P0-0.02, P0+0.02, 0.0001):
        ph = np.mod(t, P); h, e = np.histogram(ph, bins=int(P/0.005), range=(0, P))
        cs = np.convolve(np.r_[h, h[:9]], np.ones(10), 'valid')[:len(h)]; j = np.argmax(cs)
        if cs[j] > best[0]: best = (cs[j], P, e[j] + 0.025)
    return best
# seed window
bestw = None
for a in np.arange(0, DUR-24, 4.0):
    m = (b >= a) & (b < a+24)
    if m.sum() < 30: continue
    n, P, t0 = linefit(b[m], 0.43)
    if bestw is None or n/m.sum() > bestw[0]: bestw = (n/m.sum(), a, P, t0)
fr, a0, P, t0 = bestw
print(f'seed window {a0:.0f}-{a0+24:.0f} s, period {P:.5f} ({60/P:.2f} BPM), inlier frac {fr:.2f}')
m = (b >= a0) & (b < a0+24)
k = np.round((b[m] - t0)/P); r = b[m] - (t0 + k*P); ok = np.abs(r) < 0.03
acc = {int(kk): float(tt) for kk, tt in zip(k[ok], b[m][ok])}
def track(direction):
    while True:
        ks = sorted(acc); ref = ks[-16:] if direction > 0 else ks[:16]
        c = np.polyfit(ref, [acc[x] for x in ref], 1); Pl = c[0]
        edge = ks[-1] if direction > 0 else ks[0]
        found = False
        for step in range(1, 40):                          # look up to 40 beats ahead (bridges drumless stretches)
            kk = edge + direction*step; pred = np.polyval(c, kk)
            if pred < -0.1 or pred > DUR: return
            near = cand[np.abs(cand - pred) < 0.22*Pl]
            if len(near):
                acc[kk] = float(near[np.argmin(np.abs(near - pred))]); found = True; break
        if not found: return
track(+1); track(-1)
K = np.array(sorted(acc)); Tt = np.array([acc[x] for x in K])
# robust spline
m = np.ones(len(K), bool)
for it in range(4):
    sp = UnivariateSpline(K[m], Tt[m], k=3, s=m.sum()*0.012**2); r = Tt - sp(K); m = np.abs(r) < 0.035
    print(f'iter {it}: inliers {m.sum()}/{len(K)} resid rms {r[m].std()*1000:.1f} ms')
# downbeat phase vote (beat_this mix + drums downbeats)
dd = np.concatenate([d, np.array(bt['drums']['downbeats'])])
kd = np.array([K[np.argmin(np.abs(Tt - x))] for x in dd]); okd = np.array([np.min(np.abs(Tt - x)) < 0.05 for x in dd])
vote = collections.Counter((kd[okd] % 4).astype(int)); ph = vote.most_common(1)[0][0]
print('downbeat phase vote', dict(vote), '-> phase', ph)
# first downbeat >= 0 s (extrapolate the spline backwards with the first local period)
c0 = np.polyfit(K[m][:16], Tt[m][:16], 1)
kmin = int(np.ceil(-c0[1]/c0[0]))
while (kmin - ph) % 4: kmin += 1
kmax = int(K.max())
idx = np.arange(kmin, kmax+1)
g = np.where(idx < K[m][0], np.polyval(c0, idx), sp(idx))
np.save(WK/'grid_v1.npy', g)
json.dump(dict(seed=[float(a0), float(P)], k0=kmin, phase=int(ph), vote={int(a): int(v) for a, v in vote.items()},
               accepted=[[int(x), float(y)] for x, y in zip(K - kmin, Tt)]), open(WK/'grid_v1_track.json', 'w'))
print('beats', len(g), 'bar 1 beat 1 =', round(float(g[0]), 4), 'last', round(float(g[-1]), 3))
per = np.diff(g)
for s in range(0, len(per), 64): print(f'bar {s//4+1:3d} {g[s]:7.2f} bpm {60/np.mean(per[s:s+64]):7.3f}')
