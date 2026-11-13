"""Compare beat-grid estimate (a) (grid_final.json: new file only, kick onsets + arp comb, drifting spline) with
estimate (b) (grid_b.json: v2 grid carried through the old->new onset alignment). Same beat index = same musical beat
(bar structure is checked to be identical). Per section: mean, max |a-b| in ms. Also checks the section-hit anchors
(bars 9 and 89) directly on the drum-stem onset envelope / kick band. Output: $WORK_DIR/compare_ab.json"""
import json, sys, numpy as np
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools/analysis'))
from apaths import WK, DUR
A = json.load(open(WK/'grid_final.json'))['beats']; ta = np.array([b['t'] for b in A]); za = [b['zone'] for b in A]
B = json.load(open(WK/'grid_b.json')); tb = np.array(B['new']); sb = np.array(B['supported'])
n = min(len(ta), len(tb)); D = (ta[:n] - tb[:n])*1000
SEC = [('Intro', 1, 17), ('Verse 1', 17, 33), ('Pre-Chorus', 33, 41), ('Chorus 1', 41, 57), ('Breakdown', 57, 73), ('Build Up', 73, 89),
       ('Instrumental Drop', 89, 105), ('Verse 2', 105, 121), ('Chorus 2', 121, 137), ('Outro', 137, 164)]
rows = []
for name, b0, b1 in SEC:
    i0, i1 = (b0-1)*4, min((b1-1)*4, n)
    d = D[i0:i1]; anc = np.array([za[i] == 'anchored' for i in range(i0, i1)]) & sb[i0:i1]
    rows.append(dict(section=name, bars=f'{b0}-{b1-1}', mean_ms=round(float(d.mean()), 1), mean_abs_ms=round(float(np.abs(d).mean()), 1),
                     max_abs_ms=round(float(np.abs(d).max()), 1),
                     both_anchored_mean_abs_ms=round(float(np.abs(d[anc]).mean()), 1) if anc.any() else None, n_beats=int(i1-i0)))
    print(rows[-1])
E = np.load(WK/'env.npz'); T = E['T']
anchors = {}
for bar, told in ((9, 14.04), (89, 153.167)):
    i = (bar-1)*4; m = (T > ta[i]-0.15) & (T < ta[i]+0.15)
    od = E['onset_drums'][m]; tt = T[m]; k = E['kick'][m]
    anchors[bar] = dict(grid_a=round(float(ta[i]), 4), grid_b=round(float(tb[i]), 4), drum_onset_peak=round(float(tt[np.argmax(od)]), 4),
                        kick_rise=round(float(tt[np.argmax(np.diff(k, prepend=k[0]))]), 4), old_v2=told)
    print('bar', bar, anchors[bar])
json.dump(dict(per_section=rows, overall=dict(mean_abs_ms=round(float(np.abs(D).mean()), 1), max_abs_ms=round(float(np.abs(D).max()), 1), n=n),
               anchors=anchors), open(WK/'compare_ab.json', 'w'), indent=1)
