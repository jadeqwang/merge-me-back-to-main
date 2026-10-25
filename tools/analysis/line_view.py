"""Per-line inspection panels: vocal-stem log spectrogram + pyin f0 + RMS/onset, with word starts from CTC (lime, below)
and stable-ts (white, above) and optional fused (red). Usage: line_view.py out.png id [id...]"""
import json, sys, numpy as np, librosa, librosa.display, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
out = sys.argv[1]; ids = [int(x) for x in sys.argv[2:]]
L = {l['id']: l for l in json.load(open(LINES))}
C = {l['id']: l for l in json.load(open(WK/'aligned_ctc.json'))}
S = {l['id']: l for l in json.load(open(WK/'aligned_st.json'))}
F = {}
fp = WK/'lyrics_fused.json'
if fp.exists(): F = {l['id']: l for l in json.load(open(fp))}
E = np.load(WK/'env.npz'); T = E['T']
fig, axs = plt.subplots(len(ids), 1, figsize=(22, 3.6*len(ids)))
axs = np.atleast_1d(axs)
for ax, i in zip(axs, ids):
    a, b = L[i]['win']; a -= 0.5; b += 0.5
    y, sr = librosa.load(AN/'stems'/__import__('os').environ.get('VOC','vocals_roformer.wav'), sr=22050, mono=True, offset=a, duration=b-a)
    Sp = librosa.amplitude_to_db(np.abs(librosa.stft(y, n_fft=1024, hop_length=128)), ref=np.max)
    librosa.display.specshow(Sp, sr=sr, hop_length=128, y_axis='log', ax=ax, cmap='magma', vmin=-75, x_coords=a+librosa.times_like(Sp, sr=sr, hop_length=128))
    f0, vf, _ = librosa.pyin(y, fmin=100, fmax=1200, sr=sr, frame_length=1024, hop_length=128)
    ax.plot(a+librosa.times_like(f0, sr=sr, hop_length=128), f0, color='cyan', lw=1.2)
    m = (T >= a) & (T <= b)
    ax2 = ax.twinx(); ax2.plot(T[m], E['rms_vocals'][m], color='yellow', lw=0.8); ax2.set_ylim(-80, 0)
    o = E['onset_vocals'][m]; ax2.plot(T[m], -80 + 25*o/max(o.max(), 1e-6), color='orange', lw=0.7)
    for w in C[i]['words']:
        ax.axvline(w['start'], ymin=0, ymax=0.45, color='lime', lw=1.5); ax.text(w['start'], 110, w['w'], color='lime', fontsize=9)
    for w in S[i]['words']:
        ax.axvline(w['start'], ymin=0.55, ymax=1, color='white', lw=1.5); ax.text(w['start'], 4500, w['w'], color='white', fontsize=9)
    if i in F:
        for w in F[i]['words']:
            ax.axvline(w['start'], color='red', lw=1.2, ls='--'); ax.axvline(w['end'], ymin=0.4, ymax=0.6, color='red', lw=1)
    ax.set_xlim(a, b); ax.set_ylim(90, 8000); ax.set_title(f"#{i} {L[i]['text']}", fontsize=10, loc='left')
    ax.set_xticks(np.arange(np.ceil(a*4)/4, b, 0.25), minor=True); ax.set_xticks(np.arange(np.ceil(a), b, 1.0))
    ax.grid(axis='x', which='major', alpha=.5); ax.grid(axis='x', which='minor', alpha=.15)
plt.tight_layout(); plt.savefig(out, dpi=int(sys.argv[0] and __import__("os").environ.get("DPI", "55")))
