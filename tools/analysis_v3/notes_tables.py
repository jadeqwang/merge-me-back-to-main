"""Print the markdown tables used in analysis_v3/NOTES.md (sections old vs new, lyric lines old vs new, tempo curve,
interpolated stretches, offset every 8 bars) from analysis_v2/timing.json, analysis_v3/timing.json and
analysis_v3/warp_v2_to_v3.json, so the notes can be regenerated after a re-run."""
import json, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
V2 = json.load(open(ROOT/'analysis_v2/timing.json')); V3 = json.load(open(ROOT/'analysis_v3/timing.json')); WP = json.load(open(ROOT/'analysis_v3/warp_v2_to_v3.json'))
print('| Section | bars | v2 start | v3 start | shift | v2 end | v3 end | v2 vocal | v3 vocal |'); print('|---|---|---|---|---|---|---|---|---|')
for a, b in zip(V2['sections'], V3['sections']):
    print(f"| {a['name']} | {b['start_bar']}-{b['end_bar']} | {a['start']:.3f} | {b['start']:.3f} | {b['start']-a['start']:+.3f} | {a['end']:.3f} | {b['end']:.3f} | {a['vocal_start'] or '-'} | {b['vocal_start'] or '-'} |")
print()
L3 = {l['id']: l for l in V3['lyrics']['lines']}
print('| id | # | line | v2 start | v3 start | shift | v3 mapped | measured - mapped | v3 end | v3 bar/beat |'); print('|---|---|---|---|---|---|---|---|---|---|')
for k, (a, w) in enumerate(zip(V2['lyrics']['lines'], WP['lines'])):
    b = L3[a['id']]
    print(f"| {a['id']} | {k+1} | {a['text']} | {a['start']:.3f} | {b['start']:.3f} | {b['start']-a['start']:+.3f} | {w['new_start_mapped']:.3f} | {w['measured_minus_mapped']*1000:+.0f} ms | {b['end']:.3f} | {b['start_pos']['bar']} / {b['start_pos']['beat']:.2f} |")
print()
print('tempo: ' + ', '.join(f"bar {c['bar']} ({c['t']:.2f} s) {c['bpm']:.2f}" for c in V3['tempo']['curve_per_16_bars']))
B = V3['beat_grid']['beats']; z = [b['zone'] for b in B]; t = [b['t'] for b in B]
runs = []; s = None
for i in range(len(z)):
    if z[i] == 'interpolated' and s is None: s = i
    if z[i] != 'interpolated' and s is not None: runs.append((t[s], t[i-1], i - s)); s = None
print('interpolated:', ', '.join(f'{a:.2f}-{b:.2f} ({n} beats)' for a, b, n in runs))
print('extrapolated from', next(b['t'] for b in B if b['zone'] == 'extrapolated'))
print('offset (v3 - v2) every 8 bars: ' + ' '.join(f"{b['bar']}:{b['shift']:+.3f}" for b in WP['beats'] if b['beat'] == 1 and (b['bar']-1) % 8 == 0))
