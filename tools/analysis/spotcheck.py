"""Self-verification of word starts: for a spread of consonant-initial words, measure an independent acoustic onset
on the *demucs* vocal stem (not the RoFormer stem used for snapping): time of the steepest rise of high-frequency
content (2-8 kHz energy, 5 ms frames, 30 ms smoothing) or of broadband RMS within +-180 ms of the predicted start,
whichever rise is larger. Reports predicted - measured. Output: work/spotcheck.json"""
import json, numpy as np, librosa, scipy.signal as ss
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
sr = 22050; hop = 110
y = librosa.load(AN/'stems/vocals.wav', sr=sr, mono=True)[0]
S = np.abs(librosa.stft(y, n_fft=512, hop_length=hop)); f = librosa.fft_frequencies(sr=sr, n_fft=512)
hf = 10*np.log10(S[(f > 2000) & (f < 8000)].sum(0)**2 + 1e-9); bb = 10*np.log10((S**2).sum(0) + 1e-9)
k = np.ones(6)/6; hf = np.convolve(hf, k, 'same'); bb = np.convolve(bb, k, 'same')
t = np.arange(len(hf))*hop/sr
dh = np.gradient(hf); db = np.gradient(bb)
L = {l['id']: l for l in json.load(open(WK/'lyrics_fused.json'))}
PICK = [(2, 'Down'), (2, 'night'), (4, 'story'), (5, 'branch'), (6, 'started'), (7, 'back'), (8, 'becomes'), (9, 'Fold'),
        (10, 'lived'), (15, 'session'), (16, 'never'), (17, 'place'), (18, 'something'), (19, 'home'), (20, 'back'),
        (23, 'lived'), (25, 'Back'), (26, 'Back')]
rows = []
for i, wname in PICK:
    w = next(x for x in L[i]['words'] if x['w'] == wname)
    p = w['start']; m = (t >= p-0.18) & (t <= p+0.18); tt = t[m]
    jh = np.argmax(dh[m]); jb = np.argmax(db[m])
    meas, feat = (tt[jh], 'hf') if dh[m][jh] >= db[m][jb] else (tt[jb], 'rms')
    # report the onset of the rise (backtrack to where the slope first exceeds 30 % of its max)
    g = dh if feat == 'hf' else db; j0 = np.where(m)[0][jh if feat == 'hf' else jb]
    while j0 > 0 and g[j0-1] > 0.3*g[j0] and t[j0-1] > p-0.25: j0 -= 1
    meas = t[j0]
    rows.append(dict(line=i, w=wname, predicted=p, measured=round(float(meas), 3), err_ms=round(1000*(p-meas)), feature=feat))
    print(f'{i:3d} {wname:10s} pred {p:8.3f} meas {meas:8.3f} err {1000*(p-meas):+5.0f} ms ({feat})')
e = np.array([r['err_ms'] for r in rows])
summ = dict(n=len(e), median_abs_ms=float(np.median(np.abs(e))), mean_abs_ms=round(float(np.mean(np.abs(e))), 1),
            p90_abs_ms=float(np.percentile(np.abs(e), 90)), max_abs_ms=float(np.abs(e).max()), bias_ms=round(float(np.mean(e)), 1))
print(summ)
json.dump(dict(method=__doc__, rows=rows, summary=summ), open(WK/'spotcheck.json', 'w'), indent=1)
