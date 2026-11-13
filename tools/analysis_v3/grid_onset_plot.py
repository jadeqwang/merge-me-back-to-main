"""Grid vs onset check plots: onset envelopes (5 ms, from $WORK_DIR/env.npz) of mix / other / bass / drums and the
kick / snare / hat bands, with the final v3 grid (bold = downbeat + bar number; red = anchored zone boundaries shaded:
grey = interpolated, yellow = extrapolated) and the estimate-(b) grid as short blue ticks on top.
Usage: grid_onset_plot.py name a b [name a b ...] -> $ANALYSIS_DIR/gridcheck_<name>.png"""
import sys, json, numpy as np, matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools/analysis'))
from apaths import WK, AN
E = np.load(WK/'env.npz'); T = E['T']
B = json.load(open(WK/'grid_final.json'))['beats']; G = np.array([b['t'] for b in B]); Z = [b['zone'] for b in B]
GB = np.array(json.load(open(WK/'grid_b.json'))['new'])
K = [('onset_mix', 'mix onset'), ('onset_other', 'other onset'), ('onset_bass', 'bass onset'), ('onset_drums', 'drums onset'), ('kick', 'kick band'), ('snare', 'snare band'), ('hat', 'hat band')]
a_ = sys.argv[1:]
for k in range(0, len(a_), 3):
    name, a, b = a_[k], float(a_[k+1]), float(a_[k+2])
    m = (T >= a) & (T <= b)
    fig, ax = plt.subplots(len(K), 1, figsize=(max(16, (b-a)*1.1), 1.6*len(K)), sharex=True)
    for x, (key, lab) in zip(ax, K):
        y = E[key][m]; x.plot(T[m], y/max(np.percentile(y, 99.5), 1e-9), color='k', lw=0.6); x.set_ylabel(lab, fontsize=8); x.set_ylim(0, 1.1)
        for i, g in enumerate(G):
            if a <= g <= b:
                x.axvline(g, color='g', lw=1.4 if i % 4 == 0 else 0.5, alpha=0.9 if i % 4 == 0 else 0.6)
                if Z[i] != 'anchored': x.axvspan(g-0.2, g+0.2, color='grey' if Z[i] == 'interpolated' else 'gold', alpha=0.12, lw=0)
        for g in GB:
            if a <= g <= b: x.plot([g, g], [1.0, 1.1], color='b', lw=1)
    for i, g in enumerate(G):
        if a <= g <= b and i % 4 == 0: ax[0].text(g, 1.12, str(i//4+1), fontsize=8, ha='center')
    ax[-1].set_xticks(np.arange(np.ceil(a), b, 1.0)); ax[-1].set_xlabel('v3 time (s). green = v3 grid (bold = downbeat), blue ticks = estimate (b), grey band = interpolated beat, gold = extrapolated')
    ax[0].set_title(f'grid vs onsets: {name} {a:.1f}-{b:.1f} s', loc='left', fontsize=10)
    plt.tight_layout(); plt.savefig(AN/f'gridcheck_{name}.png', dpi=60); plt.close(); print('wrote', AN/f'gridcheck_{name}.png')
