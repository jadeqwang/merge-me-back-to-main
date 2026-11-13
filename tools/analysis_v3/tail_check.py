"""Tail check (after the last section hit, bar 153): bass + other stem CQT (harmonic changes) and drum-stem waveform for
v2 and v3, each with its own grid, to see whether chord changes / the final v3 hit sit on the v3 grid (the grid there
has no kick anchor between bar 153 and the final hit). Output: $ANALYSIS_DIR/anchor_tail_harmony.png"""
import sys, json, numpy as np, librosa, librosa.display, soundfile as sf, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools/analysis'))
from apaths import WK, AN
GO = np.array(json.load(open(ROOT/'analysis_v2/timing.json'))['beat_grid']['beat_times'])
GN = np.array([b['t'] for b in json.load(open(WK/'grid_final.json'))['beats']])
fig, ax = plt.subplots(4, 1, figsize=(24, 13))
for k, (nm, sd, G) in enumerate((('v2', ROOT/'analysis_v2/stems', GO), ('v3', AN/'stems', GN))):
    t0 = G[148*4] - 0.5; t1 = sf.info(str(sd/'bass.wav')).duration
    y = sum(librosa.load(sd/f'{s}.wav', sr=22050, mono=True, offset=t0, duration=t1-t0)[0] for s in ('bass', 'other'))
    C = librosa.amplitude_to_db(np.abs(librosa.cqt(y, sr=22050, hop_length=256, fmin=librosa.note_to_hz('C1'), n_bins=72)), ref=np.max)
    librosa.display.specshow(C, sr=22050, hop_length=256, y_axis='cqt_note', fmin=librosa.note_to_hz('C1'), ax=ax[2*k], cmap='magma', vmin=-60,
                             x_coords=t0 + librosa.times_like(C, sr=22050, hop_length=256))
    d = librosa.load(sd/'drums.wav', sr=22050, mono=True, offset=t0, duration=t1-t0)[0]
    ax[2*k+1].plot(t0 + np.arange(len(d))/22050, d, lw=0.3, color='#a33')
    for i, g in enumerate(G):
        if g >= t0:
            for a in (ax[2*k], ax[2*k+1]): a.axvline(g, color='lime' if i % 4 == 0 else '#6a6', lw=1.2 if i % 4 == 0 else 0.4, alpha=0.8)
            if i % 4 == 0: ax[2*k].text(g, librosa.note_to_hz('C7'), str(i//4+1), color='w', fontsize=8)
    ax[2*k].set_title(f'{nm}: bass+other CQT from bar 149 to the file end (lime = {nm} grid downbeats)', loc='left'); ax[2*k+1].set_ylabel(f'{nm} drums')
    for a in (ax[2*k], ax[2*k+1]): a.set_xlim(t0, t1)
plt.tight_layout(); plt.savefig(AN/'anchor_tail_harmony.png', dpi=55); print('ok')
