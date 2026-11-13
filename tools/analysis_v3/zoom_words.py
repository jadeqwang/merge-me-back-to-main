"""Multi-panel zoom on the RoFormer vocal stem for word-start inspection: log spectrogram (5.8 ms hop), pyin f0 (cyan),
RMS (yellow, right axis), fused word starts (red dashed) and v2 word starts mapped by musical position (white dotted).
Usage: zoom_words.py out.png a1 b1 [a2 b2 ...]"""
import sys, json, numpy as np, librosa, librosa.display, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools/analysis')); sys.path.insert(0, str(Path(__file__).parent))
from apaths import WK, AN
from warpmap import old2new
F = json.load(open(WK/'lyrics_fused.json'))
V2 = json.load(open(ROOT/'analysis_v2/timing.json'))['lyrics']['lines']
out = sys.argv[1]; W = [(float(sys.argv[i]), float(sys.argv[i+1])) for i in range(2, len(sys.argv), 2)]
fig, axs = plt.subplots(len(W), 1, figsize=(16, 3.3*len(W))); axs = np.atleast_1d(axs)
for ax, (a, b) in zip(axs, W):
    y, sr = librosa.load(AN/'stems/vocals_roformer.wav', sr=22050, mono=True, offset=a, duration=b-a)
    S = librosa.amplitude_to_db(np.abs(librosa.stft(y, n_fft=1024, hop_length=128)), ref=np.max)
    x = a + librosa.times_like(S, sr=sr, hop_length=128)
    librosa.display.specshow(S, sr=sr, hop_length=128, y_axis='log', ax=ax, cmap='magma', vmin=-75, x_coords=x)
    f0, vf, _ = librosa.pyin(y, fmin=90, fmax=1200, sr=sr, frame_length=1024, hop_length=128)
    ax.plot(a + librosa.times_like(f0, sr=sr, hop_length=128), f0, color='cyan', lw=1.2)
    r = 20*np.log10(librosa.feature.rms(y=y, frame_length=512, hop_length=128)[0] + 1e-9)
    ax2 = ax.twinx(); ax2.plot(a + librosa.times_like(r, sr=sr, hop_length=128), r, color='yellow', lw=0.9); ax2.set_ylim(-80, 0)
    for l in F:
        for w in l['words']:
            if a <= w['start'] <= b: ax.axvline(w['start'], color='red', ls='--', lw=1.2); ax.text(w['start'], 6000, w['w'], color='red', fontsize=9)
    for l in V2:
        for w in l['words']:
            m = float(old2new(w['start']))
            if a <= m <= b: ax.axvline(m, color='white', ls=':', lw=1.2); ax.text(m, 150, w['w'], color='white', fontsize=8)
    ax.set_xlim(a, b); ax.set_ylim(90, 8000)
    ax.set_xticks(np.arange(np.ceil(a*10)/10, b, 0.1), minor=True); ax.set_xticks(np.arange(np.ceil(a*2)/2, b, 0.5))
    ax.grid(axis='x', which='minor', alpha=.25); ax.grid(axis='x', which='major', alpha=.6)
plt.tight_layout(); plt.savefig(out, dpi=62)
