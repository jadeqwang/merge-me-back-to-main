"""Waveform zooms for direct verification of grid anchors and arrangement differences (new file, with the old file
on the same musical axis below it). Usage: anchor_plots.py name t_new_start t_new_end [name a b ...]
Panels: new mix waveform, new drum-stem waveform + kick-band envelope, old mix waveform (old times mapped to new
via warpmap), grid lines (downbeats bold, bar numbers) on all. Output: $ANALYSIS_DIR/anchor_<name>.png"""
import sys, json, numpy as np, soundfile as sf, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools/analysis')); sys.path.insert(0, str(Path(__file__).parent))
from apaths import WK, AN
from warpmap import new2old, GO
GN = np.array([b['t'] for b in json.load(open(WK/'grid_final.json'))['beats']])
yn, sr = sf.read(str(WK/'song.wav'), dtype='float32'); yn = yn.mean(1)
dn, _ = sf.read(str(AN/'stems/drums.wav'), dtype='float32'); dn = dn.mean(1)
yo, _ = sf.read(str(ROOT/'work_v2/song.wav'), dtype='float32'); yo = yo.mean(1)
EN = np.load(WK/'env.npz')
args = sys.argv[1:]
for k in range(0, len(args), 3):
    name, a, b = args[k], float(args[k+1]), float(args[k+2])
    fig, ax = plt.subplots(3, 1, figsize=(max(14, (b-a)*2.2), 7.5), sharex=True)
    t = np.arange(int(a*sr), int(b*sr))/sr
    ax[0].plot(t, yn[int(a*sr):int(b*sr)], color='#333', lw=0.3); ax[0].set_ylabel('new mix')
    ax[1].plot(t, dn[int(a*sr):int(b*sr)], color='#a33', lw=0.3); ax[1].set_ylabel('new drums')
    m = (EN['T'] >= a) & (EN['T'] <= b); kk = EN['kick'][m]
    ax[1].plot(EN['T'][m], kk/max(kk.max(), 1e-9)*np.abs(dn[int(a*sr):int(b*sr)]).max(), color='b', lw=1, label='kick band env (scaled)'); ax[1].legend(loc='upper right', fontsize=7)
    to = new2old(t[::8]); yo_s = np.interp(to, np.arange(len(yo))/sr, yo)   # old waveform on the new musical axis (decimated)
    ax[2].plot(t[::8], yo_s, color='#357', lw=0.3); ax[2].set_ylabel('old mix (warped)')
    for i, g in enumerate(GN):
        if a <= g <= b:
            for x in ax: x.axvline(g, color='g' if i % 4 == 0 else '#9c9', lw=1.3 if i % 4 == 0 else 0.6)
            if i % 4 == 0: ax[0].text(g, ax[0].get_ylim()[1], str(i//4+1), fontsize=8, ha='center', va='bottom')
    ax[2].set_xlabel('new-file time (s); green = v3 grid (bold = downbeat, bar number on top)')
    ax[0].set_title(f'{name}: {a:.2f}-{b:.2f} s (new file)', loc='left', fontsize=10)
    plt.tight_layout(); plt.savefig(AN/f'anchor_{name}.png', dpi=70); plt.close()
    print('wrote', AN/f'anchor_{name}.png')
