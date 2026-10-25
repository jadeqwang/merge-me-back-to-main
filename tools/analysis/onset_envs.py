"""5 ms onset-strength envelopes + RMS for mix and every stem (adapted from vibesong beatgrid_fit.py).
Output: work/env.npz  (T, onset_<name>, rms_<name> in dB, kick/snare band envelopes from drum stem)"""
import numpy as np, librosa, scipy.signal as ss
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
SR = 48000; HOP = 240  # 5 ms
srcs = dict(mix=WK/'song.wav', **{s: AN/f'stems/{s}.wav' for s in ('drums', 'bass', 'other', 'vocals')})
out = {}
for k, p in srcs.items():
    y, _ = librosa.load(p, sr=SR, mono=True)
    o = librosa.onset.onset_strength(y=y, sr=SR, hop_length=HOP, lag=1, max_size=1, n_mels=128)
    out['onset_'+k] = o
    r = np.sqrt(np.convolve(y**2, np.ones(HOP*4)/(HOP*4), mode='same'))[::HOP]   # 20 ms RMS @ 5 ms
    out['rms_'+k] = 20*np.log10(r[:len(o)] + 1e-9)
    if k == 'drums':
        for nm, (lo, hi) in dict(kick=(30, 120), snare=(1500, 6000), hat=(7000, 14000)).items():
            sos = ss.butter(4, [lo, hi], btype='band', fs=SR, output='sos'); z = ss.sosfilt(sos, y)
            e = np.sqrt(np.convolve(z**2, np.ones(HOP)/HOP, mode='same'))[::HOP]
            out[nm] = e[:len(o)]
    print(k, len(o))
n = min(len(v) for v in out.values())
out = {k: v[:n] for k, v in out.items()}
out['T'] = np.arange(n)*HOP/SR
np.savez(WK/'env.npz', **out)
