"""Key estimate: CQT chroma of the harmonic stems (other + bass) and of the vocal stem, Krumhansl-Kessler profile
correlation (global + per section block). Output: work/key.json"""
import json, numpy as np, librosa
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
sr = 22050
h = sum(librosa.load(AN/f'stems/{s}.wav', sr=sr, mono=True)[0] for s in ('other', 'bass'))
v = librosa.load(AN/'stems/vocals_roformer.wav', sr=sr, mono=True)[0]
MAJ = np.array([6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88])
MIN = np.array([6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17])
N = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
def keyscores(ch):
    s = []
    for k in range(12):
        s.append((np.corrcoef(ch, np.roll(MAJ, k))[0, 1], N[k]+' major')); s.append((np.corrcoef(ch, np.roll(MIN, k))[0, 1], N[k]+' minor'))
    return sorted(s, reverse=True)[:4]
C = librosa.feature.chroma_cqt(y=h, sr=sr, hop_length=2048); Cv = librosa.feature.chroma_cqt(y=v, sr=sr, hop_length=2048)
tt = np.arange(C.shape[1])*2048/sr
res = dict(global_harmonic=[(round(float(a), 3), b) for a, b in keyscores(C.mean(1))],
           global_vocal=[(round(float(a), 3), b) for a, b in keyscores(Cv[:, Cv.sum(0) > np.percentile(Cv.sum(0), 40)].mean(1))],
           chroma_profile={N[i]: round(float(x), 3) for i, x in enumerate(C.mean(1)/C.mean(1).max())})
blocks = [(0, 28.3), (28.3, 70.3), (70.3, 98.15), (98.15, 125.93), (125.93, 153.68), (153.68, 181.38), (181.38, 208.96), (208.96, 236.51), (236.51, 284.8)]
res['blocks'] = []
for a, b in blocks:
    m = (tt >= a) & (tt < b); ks = keyscores(C[:, m].mean(1))
    res['blocks'].append(dict(start=a, end=b, best=ks[0][1], r=round(float(ks[0][0]), 3), second=ks[1][1]))
print(json.dumps(res, indent=1))
json.dump(res, open(WK/'key.json', 'w'), indent=1)
