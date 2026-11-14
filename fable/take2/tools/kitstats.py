#!/usr/bin/env python3
"""Runner kit cut-out stats for the compositor: per runner, the matte's bbox (head top, bottom, cut at the frame bottom or not),
the step period (autocorrelation of the silhouette of the lower half: legs swapping look alike side-on, so this is foot to foot)
and the strike frames (widest leg spread). Writes fable/take2/kit.json (tracked: the compositor reads it).
   .venv/bin/python fable/take2/tools/kitstats.py"""
import glob, json, os
import numpy as np, cv2
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
DIRS = {os.path.basename(d.rstrip('/')).replace('runner_', ''): d for d in sorted(glob.glob(os.path.join(ROOT, 'work_fable/take2/kit/runner_*/'))) if os.path.isdir(d + 'rgba')}
DIRS['violin'] = os.path.join(ROOT, 'work_fable/take2/tests/kit/runner_pencil/')
out = {}
for k, d in DIRS.items():
    fs = sorted(glob.glob(d + 'rgba/f_*.png')); A = []
    for f in fs: A.append(cv2.resize(cv2.imread(f, cv2.IMREAD_UNCHANGED)[..., 3], (320, 180), interpolation=cv2.INTER_AREA).astype(np.float32) / 255)
    A = np.array(A); n = len(A)
    ys = [np.where(a.max(1) > 0.5)[0] for a in A]; xs = [np.where(a.max(0) > 0.5)[0] for a in A]
    top = float(np.median([y.min() for y in ys])) / 180; bot = float(np.median([y.max() for y in ys])) / 180
    cut = bool(np.mean([y.max() >= 178 for y in ys]) > 0.5)
    cx = float(np.median([(x.min() + x.max()) / 2 for x in xs])) / 320
    # head: centre of the alpha in the band 4-12% of the figure height below its top (below the hair's crown)
    hx = float(np.median([np.mean(np.where(a[int(y.min() + 0.04 * (y.max() - y.min())):int(y.min() + 0.12 * (y.max() - y.min()) + 1)].max(0) > 0.5)[0]) for a, y in zip(A, ys)])) / 320
    # lower half of the figure band: silhouette
    y0 = int((top + 0.55 * (bot - top)) * 180); L = A[:, y0:, :].reshape(n, -1); L = L - L.mean(0)
    ac = [float((L[:-l] * L[l:]).sum() / np.sqrt((L[:-l] ** 2).sum() * (L[l:] ** 2).sum())) for l in range(1, 30)]
    lags = np.arange(1, 30); cand = [(ac[i], lags[i]) for i in range(5, 27) if ac[i] > ac[i - 1] and ac[i] >= ac[i + 1]]
    P = int(max(cand)[1]) if cand else 10
    # refine to fractional period by parabolic peak
    i = P - 1; p = P + (0.5 * (ac[i - 1] - ac[i + 1]) / (ac[i - 1] - 2 * ac[i] + ac[i + 1]) if 0 < i < len(ac) - 1 else 0)
    w = np.array([ (np.ptp(np.where(a[y0:].max(0) > 0.5)[0]) if (a[y0:] > 0.5).any() else 0) for a in A], float)
    w = np.convolve(w, np.ones(3) / 3, 'same'); strikes = [j for j in range(2, n - 2) if w[j] == w[max(0, j - 4):j + 5].max()]
    sp = float(np.median(np.diff(strikes))) if len(strikes) > 2 else p / 2
    step = p / 2 if abs(p / 2 - sp) < abs(p - sp) else p   # the silhouette period is usually the stride (arms differ); strikes are per step
    out[k] = {'step': round(step, 2), 'strikeSpacing': sp, 'dir': os.path.relpath(d, ROOT), 'n': n, 'top': round(top, 3), 'bottom': round(bot, 3), 'cut': cut, 'cx': round(cx, 3), 'headx': round(hx, 3), 'period': round(float(p), 2), 'periodInt': P, 'ac': round(ac[P - 1], 2), 'strikes': strikes}
    print(f"{k:8s} top {top:.2f} bot {bot:.2f} cut {cut!s:5s} cx {cx:.2f} period {p:5.2f} step {step:5.2f} (strike spacing {sp}) fr (ac {ac[P-1]:.2f}) strikes {strikes[:8]}")
json.dump(out, open(os.path.join(ROOT, 'fable/take2/kit.json'), 'w'), indent=1)
