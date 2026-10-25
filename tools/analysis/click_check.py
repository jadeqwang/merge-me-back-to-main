"""Audit-by-ear render: analysis/click_check.wav = full mix (-4 dB) + click on every beat (downbeats accented, higher
pitch) + a short tone burst at every lyric word start (line starts get a higher two-tone burst).
Usage: click_check.py [--words-only | --beats-only] [--start S --end E]
Reads analysis/timing.json. Clicks in both channels; word bursts panned slightly right so they separate from the beat."""
import json, sys, argparse, numpy as np, soundfile as sf
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
ap = argparse.ArgumentParser(); ap.add_argument('--words-only', action='store_true'); ap.add_argument('--beats-only', action='store_true')
ap.add_argument('--start', type=float, default=0.0); ap.add_argument('--end', type=float, default=None); ap.add_argument('--out', default=str(AN/'click_check.wav'))
A = ap.parse_args()
TJ = json.load(open(AN/'timing.json'))
y, sr = sf.read(SONG, dtype='float32')
out = y * 10**(-4/20)
def burst(f, dur, amp, decay):
    t = np.arange(int(dur*sr))/sr; return (amp*np.sin(2*np.pi*f*t)*np.exp(-t/decay)).astype(np.float32)
def add(t, sig, pan=0.5):
    i = int(round(t*sr))
    if i < 0 or i >= len(out): return
    n = min(len(sig), len(out)-i)
    out[i:i+n, 0] += sig[:n]*(1-pan)*2*0.5; out[i:i+n, 1] += sig[:n]*pan*2*0.5
if not A.words_only:
    hi, lo = burst(2000, 0.03, 0.55, 0.006), burst(1200, 0.025, 0.35, 0.005)
    for b in TJ['beat_grid']['beats']:
        add(b['t'], hi if b['beat'] == 1 else lo)
if not A.beats_only:
    wb, lb = burst(660, 0.07, 0.30, 0.03), burst(990, 0.09, 0.40, 0.04)
    for ln in TJ['lyrics']['lines']:
        for k, w in enumerate(ln['words']):
            add(w['start'], lb if k == 0 else wb, pan=0.7)
peak = np.abs(out).max()
if peak > 0.99: out *= 0.99/peak
a = int(A.start*sr); e = int(A.end*sr) if A.end else len(out)
sf.write(A.out, out[a:e], sr, subtype='PCM_16')
print('wrote', A.out, f'{(e-a)/sr:.1f}s', 'peak', round(float(peak), 3))
