"""Zoom panels (+-0.5 s) of the vocal stem around given times, predicted word start (red) and spot-check measure (cyan)."""
import json, sys, numpy as np, librosa, librosa.display, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
out = sys.argv[1]; pts = [tuple(map(float, x.split(':'))) for x in sys.argv[2:]]
fig, axs = plt.subplots(1, len(pts), figsize=(4.2*len(pts), 4))
for ax, (p, mz) in zip(np.atleast_1d(axs), pts):
    y, sr = librosa.load(AN/'stems/vocals_roformer.wav', sr=22050, offset=p-0.5, duration=1.0)
    S = librosa.amplitude_to_db(np.abs(librosa.stft(y, n_fft=512, hop_length=64)), ref=np.max)
    librosa.display.specshow(S, sr=sr, hop_length=64, y_axis='linear', ax=ax, cmap='magma', vmin=-70, x_coords=p-0.5+librosa.times_like(S, sr=sr, hop_length=64))
    ax.axvline(p, color='red', lw=2); ax.axvline(mz, color='cyan', lw=1.5, ls='--'); ax.set_ylim(0, 8000); ax.set_title(f'pred {p:.3f}  meas {mz:.3f}', fontsize=9)
    ax.set_xticks(np.arange(round(p-0.5, 1), p+0.5, 0.1)); ax.tick_params(labelsize=6)
plt.tight_layout(); plt.savefig(out, dpi=70)
