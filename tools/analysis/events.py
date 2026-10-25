"""Key events: impact onsets at section bar lines (strongest mix/drum onset within +-70 ms), snare-roll density,
filter-riser detection (spectral centroid / high-band slope of the 'other' stem + mix), silences (mix RMS < -40 dBFS
for >= 80 ms). Output: work/events.json"""
import json, numpy as np, librosa, scipy.signal as ss
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
E = np.load(WK/'env.npz'); T = E['T']
G = np.load(WK/'grid_final.npy')
bar = lambda b: float(G[(b-1)*4])
res = {}
# impacts
imp = {}
for b in (9, 17, 37, 41, 49, 57, 65, 69, 73, 89, 105, 121, 129, 137, 153, 161):
    t0 = bar(b); m = (T >= t0-0.07) & (T <= t0+0.07)
    om = E['onset_mix'][m]; od = E['onset_drums'][m]; tt = T[m]
    imp[b] = dict(bar_t=round(t0, 3), mix_onset=round(float(tt[np.argmax(om)]), 3), drum_onset=round(float(tt[np.argmax(od)]), 3),
                  strength_x=round(float(om.max()/np.median(E['onset_mix'])), 1),
                  kick_db=round(float(20*np.log10(E['kick'][m].max()+1e-9)), 1))
    print('bar', b, imp[b])
res['impacts'] = imp
# snare roll density (drum onsets per beat) 110-126 & 145-154
O = E['onset_drums']; med = np.median(O[O > 0]); pk = ss.find_peaks(O, height=4*med, distance=6)[0]; pt = T[pk]
dens = []
for i in range(len(G)-1):
    if 108 <= G[i] < 154.5 or 255 <= G[i] < 265 or 176 <= G[i] < 182:
        n = int(((pt >= G[i]-0.015) & (pt < G[i+1]-0.015)).sum())
        sn = float(20*np.log10(E['snare'][(T >= G[i]) & (T < G[i+1])].mean()+1e-9))
        dens.append((i//4+1, i % 4+1, round(float(G[i]), 3), n, round(sn, 1)))
res['drum_density'] = dens
for d in dens: print('dens', d)
# spectral centroid per beat of other stem and mix
y, sr = librosa.load(AN/'stems/other.wav', sr=22050, mono=True)
cen = librosa.feature.spectral_centroid(y=y, sr=sr, hop_length=512)[0]; tc = np.arange(len(cen))*512/sr
S = np.abs(librosa.stft(y, n_fft=2048, hop_length=512)); f = librosa.fft_frequencies(sr=sr, n_fft=2048)
hb = 10*np.log10(S[f > 4000].sum(0)+1e-9)
ym, _ = librosa.load(WK/'song.wav', sr=22050, mono=True)
cm = librosa.feature.spectral_centroid(y=ym, sr=sr, hop_length=512)[0]
rows = []
for b in range(55, 162):
    a, z = bar(b), (bar(b+1) if b < 161 else 284.8); m = (tc >= a) & (tc < z)
    rows.append((b, round(a, 2), int(np.median(cen[m])), int(np.median(cm[m[:len(cm)]])), round(float(np.mean(hb[m])), 1)))
res['bar_centroid'] = rows
for r in rows: print('cent', r)
# silences
R = E['rms_mix']; q = R < -40; sil = []; i = 0
while i < len(q):
    if q[i]:
        j = i
        while j < len(q) and q[j]: j += 1
        if (j-i)*0.005 >= 0.08: sil.append((round(float(T[i]), 3), round(float(T[j-1]), 3)))
        i = j
    else: i += 1
res['silences_mix_below_-40dB'] = sil; print('silences', sil)
json.dump(res, open(WK/'events.json', 'w'), indent=1)
