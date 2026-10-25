"""Verification plots: analysis/check_overview.png (whole song) and analysis/check_<NN>_<section>.png (per section):
mix waveform, vocal-stem envelope, beat lines (downbeats bold, bar numbers), section bands, events, lyric word boundaries."""
import json, re, numpy as np, soundfile as sf, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
TJ = json.load(open(AN/'timing.json')); EN = np.load(WK/'energy10.npz')
y, sr = sf.read(WK/'song.wav'); y = y.mean(1)
v, _ = sf.read(AN/'stems/vocals_roformer.wav'); v = v.mean(1)
COL = ['#4e79a7', '#f28e2b', '#e15759', '#76b7b2', '#59a14f', '#edc948', '#b07aa1', '#ff9da7', '#9c755f', '#bab0ac']
secs = TJ['sections']; beats = TJ['beat_grid']['beats']; lines = TJ['lyrics']['lines']; events = TJ['events']
def env(sig, a, b, n):
    s = sig[int(a*sr):int(b*sr)]; k = max(1, len(s)//n); s = s[:k*n].reshape(n, k) if len(s) >= n else s.reshape(-1, 1)
    return s.max(1), s.min(1)
# overview
fig, ax = plt.subplots(4, 1, figsize=(26, 11), sharex=True, gridspec_kw=dict(height_ratios=[2, 1, 1, 1.2]))
mx, mn = env(y, 0, len(y)/sr, 6000); tt = np.linspace(0, len(y)/sr, len(mx))
ax[0].fill_between(tt, mn, mx, color='#333', lw=0)
for i, s in enumerate(secs):
    for a_ in ax: a_.axvspan(s['start'], s['end'], color=COL[i % 10], alpha=0.18, lw=0)
    ax[0].text(s['start']+0.5, 0.92, f"{s['name']}\nbar {s['start_bar']}", fontsize=9, va='top')
for b in beats:
    if b['beat'] == 1: ax[0].axvline(b['t'], color='k', alpha=0.15 if (b['bar']-1) % 8 else 0.6, lw=0.6 if (b['bar']-1) % 8 else 1.2)
for e in events:
    if e['type'] in ('drop', 'impact'):
        ax[0].axvline(e['t'], color='red', lw=1.5); ax[0].text(e['t'], -1.0, e['type'], color='red', fontsize=8)
ax[0].set_ylim(-1.05, 1.05); ax[0].set_ylabel('mix')
ax[1].plot(EN['t'], EN['loud'], color='k', lw=0.8, label='loudness 0-1'); ax[1].plot(EN['t'], (EN['cen']-1000)/4000, color='tab:orange', lw=0.6, label='brightness')
ax[1].legend(loc='upper left', fontsize=7)
ax[2].plot(EN['t'], EN['vrms'], color='tab:purple', lw=0.6); ax[2].fill_between(EN['t'], -80, np.where(EN['sung'] > 0, -10, -80), color='tab:green', alpha=0.25, lw=0)
ax[2].set_ylim(-80, -5); ax[2].set_ylabel('vocal dB / sung')
for l in lines:
    ax[3].plot([l['start'], l['end']], [l['id'] % 2, l['id'] % 2], lw=6, color='tab:green' if l['kind'] != 'wordless' else 'tab:olive', solid_capstyle='butt')
    ax[3].text(l['start'], (l['id'] % 2) + 0.25, l['text'][:28], fontsize=7, rotation=20)
ax[3].set_ylim(-0.5, 2.2); ax[3].set_yticks([])
ax[3].set_xticks(np.arange(0, 290, 10)); ax[3].set_xticklabels([f'{int(x//60)}:{int(x%60):02d}' for x in np.arange(0, 290, 10)], fontsize=8)
ax[3].set_xlim(0, len(y)/sr)
plt.suptitle(__import__('os').environ.get('SONG_TITLE', 'Merge Me Back to Main') + ' - timing overview (bold lines = 8-bar phrase starts, red = impacts)'); plt.tight_layout()
plt.savefig(AN/'check_overview.png', dpi=72); plt.close()
# per section
for i, s in enumerate(secs):
    a, b = max(0, s['start']-1.5), min(len(y)/sr, s['end']+1.0)
    fig, ax = plt.subplots(2, 1, figsize=(max(18, (b-a)*0.75), 6.5), sharex=True, gridspec_kw=dict(height_ratios=[1, 1.2]))
    n = int((b-a)*200); mx, mn = env(y, a, b, n); tt = np.linspace(a, b, len(mx)); ax[0].fill_between(tt, mn, mx, color='#444', lw=0)
    vx, vn = env(v, a, b, n); ax[1].fill_between(np.linspace(a, b, len(vx)), vn, vx, color='tab:purple', lw=0, alpha=0.8)
    for bb in beats:
        if a <= bb['t'] <= b:
            for a_ in ax: a_.axvline(bb['t'], color='k' if bb['beat'] == 1 else '#999', lw=1.2 if bb['beat'] == 1 else 0.4, alpha=0.8)
            if bb['beat'] == 1: ax[0].text(bb['t'], 1.02, str(bb['bar']), fontsize=7, ha='center')
    ax[0].axvspan(s['start'], s['end'], color=COL[i % 10], alpha=0.12)
    for e in events:
        if a <= e['t'] <= b:
            ax[0].axvline(e['t'], color='red', lw=1.3, ls='--'); ax[0].text(e['t'], -1.0, e['label'][:38], color='red', fontsize=7, rotation=12)
    for l in lines:
        for k, w in enumerate(l['words']):
            if a <= w['start'] <= b:
                ax[1].axvline(w['start'], color='lime' if k else 'red', lw=1.6 if k == 0 else 1.0)
                ax[1].axvspan(w['start'], w['end'], ymin=0.02, ymax=0.08, color='tab:green', alpha=0.7)
                ax[1].text(w['start']+0.02, 0.85 - 0.12*(k % 3), w['w'], fontsize=8, color='darkgreen')
    ax[0].set_ylim(-1.05, 1.1); ax[1].set_ylim(-1.0, 1.0)
    ax[1].set_xticks(np.arange(np.ceil(a), b, 1.0)); ax[1].set_xticklabels([f'{int(x//60)}:{x%60:04.1f}' for x in np.arange(np.ceil(a), b, 1.0)], fontsize=7, rotation=90)
    ax[1].set_xlim(a, b); ax[0].set_title(f"{s['name']}  {s['start']:.3f}-{s['end']:.3f}  bars {s['start_bar']}-{s['end_bar']}   (top: mix; bottom: RoFormer vocal stem, red = line start, lime = word start, green bar = word span)", fontsize=10, loc='left')
    plt.tight_layout(); plt.savefig(AN/f"check_{i+1:02d}_{re.sub(r'[^a-z0-9]+', '_', s['name'].lower())}.png", dpi=60); plt.close()
print('ok')
