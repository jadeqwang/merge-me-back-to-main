"""Beat grid estimate (b) for v3: the v2 grid (analysis_v2/timing.json beats) carried into v3 time through an
old->new alignment measured on onset envelopes. Independent of estimate (a) (does not read grid_v1/grid_final).
Features (5 ms, from work_v2/env.npz and $WORK_DIR/env.npz, same onset_envs.py code): drum-stem onset, kick band
(30-120 Hz) flux, mix onset, other-stem onset, bass onset; each log-compressed and z-normalised per window.
Pass 1: 14 s windows every 2 bars, lag searched over prior +- 0.35 s and new/old stretch 0.975-1.0075 (tempo drift) (prior = the chroma/onset lags measured before this run).
Pass 2: 7 s windows every 2 beats, lag searched over the pass-1 smooth curve +- 60 ms (stretch = its slope), parabolic
peak interpolation. Lags are fitted vs old beat index with a weighted smoothing spline (weights = peak correlation;
windows with correlation < 0.25 or > 20 ms from the running median of their neighbours are dropped). Output: $WORK_DIR/grid_b.json"""
import json, sys, numpy as np
from scipy.interpolate import UnivariateSpline
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools/analysis'))
from apaths import WK, DUR
EO = np.load(ROOT/'work_v2/env.npz'); EN = np.load(WK/'env.npz')
TJ = json.load(open(ROOT/'analysis_v2/timing.json')); GO = np.array(TJ['beat_grid']['beat_times'])
H = 0.005
def flux(x): return np.maximum(np.diff(x, prepend=x[0]), 0)
def feats(E):
    F = {k: E[k] for k in ('onset_drums', 'onset_mix', 'onset_other', 'onset_bass')}
    F['kick'] = flux(np.log(E['kick'] + 1e-5))
    return {k: np.log1p(v/np.median(v[v > 0])) for k, v in F.items()}
FO, FN = feats(EO), feats(EN)
W = dict(onset_drums=1.0, kick=1.0, onset_mix=1.0, onset_other=0.7, onset_bass=0.5)
import os
if os.environ.get('WARP_FEATS'): W = {k: W[k] for k in os.environ['WARP_FEATS'].split(',')}   # diagnostic: feature subset
OUT = os.environ.get('WARP_OUT', 'grid_b.json')
# prior lag (new - old) vs old time, from the pre-run chroma/onset comparison
PT = np.array([0, 30, 60, 75, 120, 150, 180, 200, 230, 265, 282.5]); PL = np.array([0.14, 0.14, 0.13, 0.0, -0.2, -0.4, -0.68, -0.9, -1.56, -2.2, -2.3])
prior = lambda t: np.interp(t, PT, PL)
def xcorr(t0, half, lags, st=1.0):
    """correlation of the old window [t0-half, t0+half] with the new file at t0 + lag + st*u (u = old offset from t0;
    st = local new/old duration ratio, so the tempo drift does not smear the comparison)"""
    i0, i1 = int((t0-half)/H), int((t0+half)/H)
    if i0 < 0 or i1 >= len(FO['onset_mix']): return None
    u = np.arange(i0, i1)*H - t0
    sc = np.zeros(len(lags)); wsum = 0
    for k, w in W.items():
        a = FO[k][i0:i1]
        if a.std() < 1e-6: continue
        a = (a - a.mean())/a.std(); s = []
        for L in lags:
            x = (t0 + L + st*u)/H
            if x[0] < 0 or x[-1] >= len(FN[k])-1: s.append(-1); continue
            bb = np.interp(x, np.arange(len(FN[k])), FN[k]); bb = (bb - bb.mean())/(bb.std() + 1e-9); s.append(float(np.mean(a*bb)))
        sc += w*np.array(s); wsum += w
    return sc/max(wsum, 1e-9)
def peak(sc, lags):
    j = int(np.argmax(sc))
    if 0 < j < len(sc)-1:
        y0, y1, y2 = sc[j-1], sc[j], sc[j+1]; dn = y0 - 2*y1 + y2
        off = 0.5*(y0 - y2)/dn if dn < 0 else 0.0
    else: off = 0.0
    return lags[j] + off*(lags[1]-lags[0]), sc[j]
NB = len(GO)
# pass 1
p1 = []
for i in range(0, NB, 8):
    t = GO[i]; lags = prior(t) + np.arange(-0.35, 0.3501, H)
    bestc = None
    for st in np.arange(0.975, 1.0076, 0.0025):
        sc = xcorr(t, 7.0, lags, st)
        if sc is None: break
        L, c = peak(sc, lags)
        if bestc is None or c > bestc[1]: bestc = (L, c, st)
    if bestc is None: continue
    p1.append((i, bestc[0], bestc[1], bestc[2]))
p1 = np.array(p1)
m = p1[:, 2] > 0.15
sp1 = UnivariateSpline(p1[m, 0], p1[m, 1], w=p1[m, 2], k=3, s=m.sum()*0.03**2)
print('pass1 windows', len(p1), 'used', m.sum())
for r in p1[::4]: print(f'  pass1 old beat {int(r[0]):3d} t {GO[int(r[0])]:7.2f} lag {r[1]:+.4f} corr {r[2]:.2f} stretch {r[3]:.4f}')
# pass 2
p2 = []
for i in range(0, NB, 2):
    t = GO[i]; lags = float(sp1(i)) + np.arange(-0.06, 0.0601, H)
    st = 1 + float(sp1.derivative()(i))/max(GO[min(i+1, NB-1)] - GO[i], 0.3)   # d(lag)/d(old time) from the pass-1 curve
    sc = xcorr(t, 3.5, lags, st)
    if sc is None: continue
    L, c = peak(sc, lags); p2.append((i, L, c))
p2 = np.array(p2)
m = p2[:, 2] > 0.25
# outliers: compare each confident window with the running median of its confident neighbours (+-8 windows)
med = np.array([np.median(p2[m & (np.abs(p2[:, 0] - i) <= 16), 1]) if (m & (np.abs(p2[:, 0] - i) <= 16)).any() else np.nan for i in p2[:, 0]])
m = m & (np.abs(p2[:, 1] - med) < 0.02)
sp = UnivariateSpline(p2[m, 0], p2[m, 1], w=p2[m, 2], k=3, s=m.sum()*0.004**2)
r = p2[:, 1] - sp(p2[:, 0])
print(f'pass2 windows {len(p2)}, used {m.sum()}, resid rms {r[m].std()*1000:.1f} ms')
# beats of the old grid supported by a confident window within +-8 beats; else 'interpolated'
sup = np.zeros(NB, bool)
for i in p2[m, 0].astype(int): sup[max(0, i-8):i+9] = True
lag = sp(np.arange(NB)); tn = GO + lag
out = dict(method=__doc__, old=[float(x) for x in GO], new=[round(float(x), 4) for x in tn], lag=[round(float(x), 4) for x in lag],
           supported=[bool(x) for x in sup], windows=[[int(a), round(float(b_), 4), round(float(c), 3), bool(u)] for (a, b_, c), u in zip(p2, m)])
json.dump(out, open(WK/OUT, 'w'))
for i in range(0, NB, 32): print(f'old beat {i:3d} bar {i//4+1:3d} old {GO[i]:7.3f} new {tn[i]:7.3f} lag {lag[i]*1000:+7.1f} ms {"" if sup[i] else "(no confident window)"}')
