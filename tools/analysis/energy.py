"""energy.json: 10 Hz and per-beat curves of the full mix (RMS dBFS + 0-1 normalized loudness, spectral centroid
brightness, onset strength) and vocal activity from the RoFormer + demucs vocal stems (RMS dB, voiced prob, 0/1 active)."""
import json, numpy as np, librosa
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
SR = 22050; HOP = 2205  # 10 Hz
y, _ = librosa.load(WK/'song.wav', sr=SR, mono=True)
n = int(np.ceil(len(y)/HOP))
def frames(sig, fn):
    return np.array([fn(sig[i*HOP:(i+1)*HOP]) for i in range(n)])
rms = 20*np.log10(frames(y, lambda s: np.sqrt(np.mean(s**2)) if len(s) else 1e-9) + 1e-9)
cen = librosa.feature.spectral_centroid(y=y, sr=SR, n_fft=4096, hop_length=HOP, center=False)[0]
cen = np.pad(cen, (0, n-len(cen)), mode='edge')
o = librosa.onset.onset_strength(y=y, sr=SR, hop_length=HOP//5)  # 50 Hz -> max-pool to 10 Hz
o = np.array([o[i*5:(i+1)*5].max() if len(o[i*5:(i+1)*5]) else 0 for i in range(n)])
vr, _ = librosa.load(AN/'stems/vocals_roformer.wav', sr=SR, mono=True)
vd, _ = librosa.load(AN/'stems/vocals.wav', sr=SR, mono=True)
vrms = 20*np.log10(frames(vr, lambda s: np.sqrt(np.mean(s**2)) if len(s) else 1e-9) + 1e-9)
vdrms = 20*np.log10(frames(vd, lambda s: np.sqrt(np.mean(s**2)) if len(s) else 1e-9) + 1e-9)
SO = np.load(WK/'syllable_onsets.npz'); ft = SO['f0_t']; vv = SO['voiced_rf'].astype(float)
voiced = np.array([vv[(ft >= i*0.1) & (ft < (i+1)*0.1)].mean() if ((ft >= i*0.1) & (ft < (i+1)*0.1)).any() else 0 for i in range(n)])
active = ((vrms > -40) & (vdrms > -42)).astype(int)
L = json.load(open(WK/'lyrics_fused.json'))
sung = np.zeros(n, int)
for ln in L:
    for w in ln['words']:
        sung[int(w['start']*10):int(np.ceil(w['end']*10))] = 1
def norm(x, lo, hi): return np.clip((x-lo)/(hi-lo), 0, 1)
lo, hi = np.percentile(rms[rms > -60], 2), np.percentile(rms, 99.5)
t = np.round(np.arange(n)*0.1, 1)
G = json.load(open(WK/'grid_final.json'))['beats']
bt = np.array([b['t'] for b in G] + [DUR])
per_beat = []
for i, b in enumerate(G):
    a, z = bt[i], bt[i+1]; m = (t >= a) & (t < z)
    if not m.any(): m = np.argmin(np.abs(t-a)) == np.arange(n)
    per_beat.append(dict(i=i, t=b['t'], bar=b['bar'], beat=b['beat'],
        rms_db=round(float(10*np.log10(np.mean(10**(rms[m]/10)))), 2), loud=round(float(norm(10*np.log10(np.mean(10**(rms[m]/10))), lo, hi)), 3),
        bright_hz=int(np.median(cen[m])), onset=round(float(o[m].max()), 3), vocal_db=round(float(vrms[m].max()), 1),
        vocal_active=round(float(active[m].mean()), 2), sung=int(sung[m].max())))
out = dict(
  doc=dict(time_base='seconds from first sample of the WAV (48 kHz). 10 Hz frames cover [t, t+0.1).',
           rms_db='mix RMS per frame, dBFS (mono sum)', loud_0_1='rms_db min-max normalized (2nd pct of non-silent .. 99.5th pct)',
           bright_hz='spectral centroid of the mix (Hz)', onset='librosa onset strength of the mix, max over the frame (arbitrary units)',
           onset_0_1='onset / 99th percentile, clipped', vocal_db='RoFormer vocal-stem RMS dBFS', vocal_voiced='pyin voiced fraction (RoFormer stem)',
           vocal_active='1 if RoFormer RMS > -40 dB and demucs vocal RMS > -42 dB', sung='1 if inside an aligned lyric word (incl. wordless Ahh)'),
  hz10=dict(t=t.tolist(), rms_db=np.round(rms, 2).tolist(), loud_0_1=np.round(norm(rms, lo, hi), 3).tolist(), bright_hz=cen.astype(int).tolist(),
            onset=np.round(o, 3).tolist(), onset_0_1=np.round(np.clip(o/np.percentile(o, 99), 0, 1), 3).tolist(),
            vocal_db=np.round(vrms, 1).tolist(), vocal_voiced=np.round(voiced, 2).tolist(), vocal_active=active.tolist(), sung=sung.tolist()),
  per_beat=per_beat)
json.dump(out, open(AN/'energy.json', 'w'), separators=(',', ':'))
np.savez(WK/'energy10.npz', t=t, rms=rms, loud=norm(rms, lo, hi), cen=cen, onset=o, vrms=vrms, active=active, sung=sung)
print('frames', n, 'loud range', lo, hi)
