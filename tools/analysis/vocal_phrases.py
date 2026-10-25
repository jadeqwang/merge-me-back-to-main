"""Vocal-stem activity segments (20 ms RMS > thr, gaps < 150 ms merged) + pyin pitch summary per segment."""
import numpy as np, librosa, json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
E = np.load(WK/'env.npz'); T = E['T']; v = E['rms_vocals']
thr = float(sys.argv[1]) if len(sys.argv) > 1 else -38
act = v > thr
segs = []; i = 0
while i < len(act):
    if act[i]:
        j = i
        while j < len(act) and act[j]: j += 1
        segs.append([T[i], T[j-1]]); i = j
    else: i += 1
merged = []
for s in segs:
    if merged and s[0] - merged[-1][1] < 0.15: merged[-1][1] = s[1]
    else: merged.append(s)
merged = [s for s in merged if s[1]-s[0] > 0.12]
y, sr = librosa.load(AN/'stems/vocals.wav', sr=16000, mono=True)
out = []
for a, b in merged:
    seg = y[int(a*sr):int(b*sr)]
    f0, vf, vp = librosa.pyin(seg, fmin=110, fmax=1100, sr=sr, frame_length=1024, hop_length=160)
    f = f0[vf] if vf.any() else np.array([np.nan])
    notes = librosa.hz_to_note(np.nanmedian(f)) if np.isfinite(np.nanmedian(f)) else '-'
    rng = (librosa.hz_to_note(np.nanmin(f)), librosa.hz_to_note(np.nanmax(f))) if np.isfinite(np.nanmedian(f)) else ('-', '-')
    out.append(dict(start=round(float(a), 3), end=round(float(b), 3), dur=round(float(b-a), 2), voiced=round(float(vf.mean()), 2), med_note=notes, range=rng,
                    peak_db=round(float(v[(T >= a) & (T <= b)].max()), 1)))
    print(f'{a:7.2f}-{b:7.2f} ({b-a:5.2f}s) voiced {vf.mean():.2f} med {notes:4s} range {rng[0]}-{rng[1]} peak {out[-1]["peak_db"]}')
json.dump(out, open(WK/'vocal_phrases.json', 'w'), indent=0)
