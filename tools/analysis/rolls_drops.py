"""Drum-onset density per beat (snare-roll detection), band energies per beat, and strongest mix onsets in candidate
impact windows (adapted from vibesong rolls_drops.py)."""
import numpy as np, scipy.signal as ss, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
E = np.load(WK/'env.npz'); T = E['T']
g = np.load(WK/'grid_v1.npy')
O = E['onset_drums']; med = np.median(O[O > 0])
pk = ss.find_peaks(O, height=4*med, distance=8)[0]; pt = T[pk]
lo, hi = float(sys.argv[1]), float(sys.argv[2])
for i in range(len(g)-1):
    if lo <= g[i] < hi:
        a, b = g[i]-0.02, g[i+1]-0.02
        m = (T >= a) & (T < b)
        n = ((pt >= a) & (pt < b)).sum()
        print(f'#{i:3d} bar {i//4+1:3d}.{i%4+1} {g[i]:7.2f} onsets {n} kick {20*np.log10(E["kick"][m].max()+1e-9):6.1f} snare {20*np.log10(E["snare"][m].mean()+1e-9):6.1f} hat {20*np.log10(E["hat"][m].mean()+1e-9):6.1f} mix {E["rms_mix"][m].mean():6.1f} oth {E["rms_other"][m].mean():6.1f} voc {E["rms_vocals"][m].mean():6.1f}')
