"""Sanity checks for analysis_v3 (printed and written to $WORK_DIR/checks.json):
1 every section hit lands on a downbeat within 20 ms (drum-stem onset vs grid); 2 bar count and bar lengths within
1.68-1.76 s (complete bars; the last, file-end-truncated bar excluded); 3 lyric line ids/order/count = v2;
4 warp monotone; 5 schema: same top-level keys / bar keys / section keys as analysis_v2/timing.json;
6 per-16-bar BPM curve; 7 grid fit; 8 (a)-vs-(b) per section."""
import json, sys, numpy as np
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools/analysis'))
from apaths import WK, AN
V2 = json.load(open(ROOT/'analysis_v2/timing.json')); V3 = json.load(open(AN/'timing.json')); WP = json.load(open(AN/'warp_v2_to_v3.json'))
EV = json.load(open(WK/'events.json'))['impacts']; AB = json.load(open(WK/'compare_ab.json'))
res = {}; ok = True
HITS = [9, 17, 37, 41, 57, 65, 69, 73, 86, 89, 105, 117, 121, 129, 137, 149, 153]
d = {b: round((EV[str(b)]['drum_onset'] - EV[str(b)]['bar_t'])*1000, 1) for b in HITS}
res['section_hits_ms'] = d; res['section_hits_ok'] = all(abs(x) <= 20 for x in d.values()); ok &= res['section_hits_ok']
fh = EV['161.3']; res['final_hit_bar161_beat3_ms'] = round((fh['drum_onset'] - fh['bar_t'])*1000, 1)
bars = V3['bars']; L = np.array([b['end'] - b['start'] for b in bars[:-1]])
res['n_bars'] = len(bars); res['n_bars_v2'] = len(V2['bars']); res['last_bar'] = bars[-1]
res['bar_len_min_max'] = [round(float(L.min()), 4), round(float(L.max()), 4)]; res['bar_len_ok'] = bool((L >= 1.68).all() and (L <= 1.76).all()); ok &= res['bar_len_ok']
i2 = [l['id'] for l in V2['lyrics']['lines']]; i3 = [l['id'] for l in V3['lyrics']['lines']]
st = [l['start'] for l in V3['lyrics']['lines']]
res['lines_same_ids_order'] = i2 == i3; res['n_lines'] = [len(i2), len(i3)]; res['line_starts_increasing'] = bool(np.all(np.diff(st) > 0))
res['words_per_line_same'] = all(len(a['words']) == len(b['words']) for a, b in zip(V2['lyrics']['lines'], V3['lyrics']['lines']))
ok &= res['lines_same_ids_order'] and res['line_starts_increasing'] and res['words_per_line_same']
res['warp_monotone'] = WP['monotone'] and bool(np.all(np.diff([w['new_measured'] for w in WP['words']]) > 0)); ok &= res['warp_monotone']
res['schema_top_keys_same'] = list(V2.keys()) == list(V3.keys())
res['schema_sub_keys_same'] = {k: sorted(V2[k].keys()) == sorted(V3[k].keys()) for k in ('audio', 'tempo', 'key', 'beat_grid', 'key_moments', 'lyrics') }
res['schema_bar_keys_same'] = sorted(V2['bars'][0]) == sorted(V3['bars'][0])
res['schema_section_keys_same'] = [sorted(a) == sorted(b) for a, b in zip(V2['sections'], V3['sections'])]
res['section_bars_same'] = [(a['start_bar'], a['end_bar']) == (b['start_bar'], b['end_bar']) for a, b in zip(V2['sections'], V3['sections'])]
res['tempo_curve'] = V3['tempo']['curve_per_16_bars']; res['bar1_beat1'] = bars[0]['start']
res['grid_fit'] = V3['beat_grid']['fit']; res['a_vs_b'] = AB['per_section']; res['a_vs_b_overall'] = AB['overall']
res['all_ok'] = bool(ok)
for k, v in res.items():
    if k not in ('tempo_curve', 'a_vs_b'): print(f'{k}: {v}')
for r in res['tempo_curve']: print('  bpm', r)
for r in res['a_vs_b']: print('  a-b', r)
json.dump(res, open(WK/'checks.json', 'w'), indent=1)
