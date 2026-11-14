#!/usr/bin/env python3
"""Stride period over time of a running clip, to catch a repeated or skipped step (measurement only).
   /home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python fable/take2/tools/gait.py CLIP.mp4 [more clips ...]
Frames at 24 fps, grey 320x180, middle band x 25..80% (the figure; the frame edges and the end-of-clip white-out are mostly not figure).
Signal m(t) = mean |F[t+1]-F[t]| (motion energy; it peaks at each footfall/swing). For each window of 36 frames (step 6) the local
period is the lag in 4..18 frames with the highest normalised autocorrelation of m (detrended) when that peak is a local maximum and > 0.3.
This measures STEP period (foot to foot); stride = 2x. A repeated or skipped step shows as a window where the period departs >25% from the clip
median, or where the autocorrelation peak is lost. Windows in the white-out (after frame 100 if the clip fades) are skipped by the caller reading the list."""
import sys, subprocess, numpy as np
WIN, STEP = 36, 6
MINLAG = int(__import__("os").environ.get("MINLAG", 4))   # MINLAG=6 skips a 4-frame flicker
def load(p):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-vf', 'fps=24,scale=320:180,format=gray', '-f', 'rawvideo', '-'], stdout=subprocess.PIPE).stdout
    F = np.frombuffer(r, np.uint8).reshape(-1, 180, 320).astype(np.float32); return F[:, :, 80:256]
def local_period(m):
    m = m - np.polyval(np.polyfit(np.arange(len(m)), m, 1), np.arange(len(m)))
    d = float((m * m).sum())
    if d < 1e-9: return 0, 0.0
    ac = [float((m[:len(m) - k] * m[k:]).sum()) / d for k in range(0, 19)]
    best = 0, 0.0
    for k in range(MINLAG, 18):
        if ac[k] > ac[k - 1] and ac[k] >= ac[k + 1] and ac[k] > 0.3 and ac[k] > best[1]: best = k, ac[k]
    return best
if __name__ == '__main__':
    for clip in sys.argv[1:]:
        F = load(clip); n = len(F); m = np.abs(np.diff(F, axis=0)).mean(axis=(1, 2)); res = []
        for a in range(0, len(m) - WIN + 1, STEP): res.append((a + 1, a + WIN, *local_period(m[a:a + WIN])))
        v = [r[2] for r in res if r[2]]; med = float(np.median(v)) if v else 0
        print(f'{clip}: n={n} median step period {med} frames')
        print('  windows (frames 1-based a-b: period/autocorr): ' + '  '.join(f'{a}-{b}:{p}/{c:.2f}' for a, b, p, c in res))
        print('  windows >25% off median or no peak:', [f'{a}-{b}' for a, b, p, c in res if not p or abs(p - med) / med > .25] or 'none')
