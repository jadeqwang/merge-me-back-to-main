"""Render vocal-stem spectrogram + pyin pitch + RMS for a window (visual inspection). Usage: spec_view.py a b out.png [stem]"""
import numpy as np, librosa, librosa.display, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
a, b, out = float(sys.argv[1]), float(sys.argv[2]), sys.argv[3]
stem = sys.argv[4] if len(sys.argv) > 4 else 'vocals'
p = WK/'song.wav' if stem == 'mix' else AN/f'stems/{stem}.wav'
y, sr = librosa.load(p, sr=22050, mono=True, offset=a, duration=b-a)
S = librosa.amplitude_to_db(np.abs(librosa.stft(y, n_fft=2048, hop_length=256)), ref=np.max)
f0, vf, _ = librosa.pyin(y, fmin=100, fmax=1200, sr=sr, frame_length=2048, hop_length=256)
fig, ax = plt.subplots(2, 1, figsize=(max(12, (b-a)*0.9), 8), sharex=True, gridspec_kw=dict(height_ratios=[3, 1]))
librosa.display.specshow(S, sr=sr, hop_length=256, x_axis='time', y_axis='log', ax=ax[0], cmap='magma', vmin=-80)
t = librosa.times_like(f0, sr=sr, hop_length=256)
ax[0].plot(t, f0, color='cyan', lw=1.5); ax[0].set_ylim(80, 8000)
r = librosa.feature.rms(y=y, hop_length=256)[0]; ax[1].plot(t[:len(r)], 20*np.log10(r+1e-9)); ax[1].set_ylim(-60, -5)
tk = np.arange(np.ceil(a), b, 1.0)
for x in ax: x.set_xticks(tk-a); x.set_xticklabels([f'{v:.0f}' for v in tk], fontsize=7); x.grid(axis='x', alpha=.4)
plt.tight_layout(); plt.savefig(out, dpi=70)
