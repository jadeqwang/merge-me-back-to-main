"""Line-start refinement helper: for the first word of each line, report (a) energy-rise point = earliest time in
[ctc-0.45, ctc+0.05] where the RoFormer vocal RMS (10 ms) exceeds (max over the next 0.3 s - 10 dB) after being below
it, (b) start of the pyin voiced run containing ctc+0.05, (c) syllable onsets in the window. Output: work/line_onsets.json"""
import json, numpy as np, librosa
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
y, sr = librosa.load(AN/'stems/vocals_roformer.wav', sr=16000, mono=True)
hop = 80
r = librosa.feature.rms(y=y, frame_length=320, hop_length=hop)[0]; R = 20*np.log10(r + 1e-9); TR = np.arange(len(R))*hop/sr
SO = np.load(WK/'syllable_onsets.npz'); f0t = SO['f0_t']; vf = SO['voiced_rf']
F = json.load(open(WK/'lyrics_fused.json'))
out = {}
for ln in F:
    c = ln['words'][0]['ctc']
    m = (TR >= c-0.45) & (TR <= c+0.05); idx = np.where(m)[0]
    ref = R[(TR >= c) & (TR <= c+0.3)].max()
    above = R[idx] > ref - 10
    # earliest index such that all subsequent in window above (contiguous rise)
    k = len(idx)-1
    while k > 0 and above[k-1]: k -= 1
    rise = TR[idx[k]]
    j = np.searchsorted(f0t, c+0.05)
    while j > 0 and vf[j-1] and f0t[j-1] > c-0.6: j -= 1
    vstart = f0t[j]
    so = [round(float(x), 3) for x in SO['all_rf'] if c-0.45 <= x <= c+0.1]
    pre = float(np.median(R[(TR >= c-0.8) & (TR < c-0.45)]))
    out[ln['id']] = dict(ctc=c, rise=round(float(rise), 3), voiced_start=round(float(vstart), 3), onsets=so, pre_db=round(pre, 1), ref_db=round(float(ref), 1))
    print(ln['id'], ln['words'][0]['w'], out[ln['id']])
json.dump(out, open(WK/'line_onsets.json', 'w'), indent=1)
