"""analysis_v3/warp_v2_to_v3.json: old (v2, inputs/Merge.wav, analysis_v2/timing.json) -> new (v3) time map.
- beats: every v2 beat (and so every bar downbeat) with its v3 time = the v3 grid beat with the same index (same bar,
  same beat: the bar structure is identical, checked on the section hits). Old beats past the end of the v3 grid are
  extrapolated with the last v3 period (flagged).
- interpolate(t_old): piecewise-linear in beat index between those pairs (tools/analysis_v3/warpmap.py), i.e. a cut
  point at 'bar 37 beat 2.5' in v2 lands on 'bar 37 beat 2.5' in v3.
- lines: every v2 lyric line start with its musically-mapped v3 time AND the measured v3 start (use the measured one).
- events: every v2 event with its mapped v3 time and the matching v3 event (measured), or a note if it does not exist
  in v3; plus the v3 events that have no v2 counterpart.
- sections, key_moments, alternative mapping notes for the tail (bar 161)."""
import json, sys, numpy as np
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools/analysis')); sys.path.insert(0, str(Path(__file__).parent))
from apaths import WK, AN
from warpmap import old2new, GO
V2 = json.load(open(ROOT/'analysis_v2/timing.json')); V3 = json.load(open(AN/'timing.json'))
GN = np.array(V3['beat_grid']['beat_times']); n3 = len(GN)
r3 = lambda x: round(float(x), 3)
beats = []
for i, t in enumerate(GO):
    tn = float(old2new(t, GN)); beats.append(dict(i=i, bar=i//4+1, beat=i % 4+1, old=r3(t), new=r3(tn), shift=r3(tn - t),
                                                 **({} if i < n3 else dict(note='beyond the v3 grid: extrapolated'))))
new_only = [dict(i=i, bar=i//4+1, beat=i % 4+1, new=r3(GN[i])) for i in range(len(GO), n3)]
# lyric lines
L3 = {l['id']: l for l in V3['lyrics']['lines']}
lines = []
for l in V2['lyrics']['lines']:
    m = L3.get(l['id']); mp = float(old2new(l['start'], GN))
    lines.append(dict(id=l['id'], text=l['text'], old_start=l['start'], old_end=l['end'], new_start_mapped=r3(mp),
                      new_start_measured=m['start'] if m else None, new_end_measured=m['end'] if m else None,
                      measured_minus_mapped=r3(m['start'] - mp) if m else None,
                      old_start_pos=l['start_pos'], new_start_pos=m['start_pos'] if m else None))
words = []
for l in V2['lyrics']['lines']:
    m = L3[l['id']]
    for wo, wn in zip(l['words'], m['words']):
        words.append(dict(line=l['id'], w=wn['w'], old=wo['start'], new_mapped=r3(old2new(wo['start'], GN)), new_measured=wn['start']))
# events: pair each v2 event with the nearest same-type v3 event within 0.6 s of its mapped time
E3 = V3['events']; used = set(); events = []
ABSENT = {'build': 'v3 has no soft hat/snare pattern in bars 5-7', 'hit@52': 'v3 has no kick hit at bar 52 (Chorus 1)',
          'pickup@128': 'v3 has no kick/snare pickup before bar 129', 'texture@121': 'v3 Chorus 2 starts WITH a hit (see the v3 hit event at bar 121)',
          'drums_out@116': 'in v3 the cut comes right after a kick HIT on the bar-117 downbeat (v3 event 200.99); drums + bass gone by ~201.3'}
for e in V2['events']:
    mp = float(old2new(e['t'], GN))
    cand = [(abs(x['t'] - mp), j) for j, x in enumerate(E3) if j not in used and x['type'] == e['type'] and abs(x['t'] - mp) < 0.6]
    if not cand and e['type'] in ('drums_out', 'texture', 'end', 'start'):     # looser match for gradual / level events
        cand = [(abs(x['t'] - mp), j) for j, x in enumerate(E3) if j not in used and x['type'] == e['type'] and abs(x['t'] - mp) < 3.0]
    rec = dict(old_t=e['t'], old_bar=e['bar'], old_beat=e['beat'], type=e['type'], old_label=e['label'], new_t_mapped=r3(mp))
    if cand:
        j = min(cand)[1]; used.add(j); x = E3[j]
        rec.update(new_t=x['t'], new_bar=x['bar'], new_beat=x['beat'], new_label=x['label'], measured_minus_mapped=r3(x['t'] - mp))
    else:
        key = f"{e['type']}@{e['bar']}"; rec.update(new_t=None, note=ABSENT.get(key, ABSENT.get(e['type'], 'no matching event in v3 within 0.6 s of the mapped time (see NOTES)')))
    events.append(rec)
new_events = [dict(new_t=x['t'], new_bar=x['bar'], new_beat=x['beat'], type=x['type'], new_label=x['label'], old_t_equivalent=None)
              for j, x in enumerate(E3) if j not in used]
secs = [dict(name=a['name'], start_bar=a['start_bar'], old_start=a['start'], new_start=b['start'], shift=r3(b['start'] - a['start']),
             old_vocal_start=a['vocal_start'], new_vocal_start=b['vocal_start']) for a, b in zip(V2['sections'], V3['sections'])]
mono = bool(np.all(np.diff([b['new'] for b in beats]) > 0))
out = dict(
 doc=__doc__, old_file='inputs/Merge.wav (analysis_v2/timing.json)', new_file='inputs/Merge (keychange down).wav (analysis_v3/timing.json)',
 how_to_use='For a cut point at old time t: find its fractional beat index on beats[].old, take the same index on beats[].new (linear between beats). '
            'For lyric/lip-sync cues use lines[].new_start_measured / words[].new_measured (measured in v3), not the mapped value. '
            'Events marked new_t=None do not exist in v3; new_events exist only in v3.',
 monotone=mono, n_old_beats=len(GO), n_new_beats=n3,
 beats=beats, new_only_beats=new_only, sections=secs, lines=lines, words=words, events=events, new_events=new_events,
 tail_note='v2 bar 161 downbeat (278.383, chord change, no hit) maps by beat index to 275.964 in v3, but in v3 the matching chord change '
           f"comes 2 beats later, with the NEW final hit, at {[x['t'] for x in E3 if 'FINAL HIT' in x['label']][0]} (bar 161 beat 3). From the bar-153 hit on, "
           'v3 has 2 extra beats before the last chord, then a longer sustain/fade. A cut that should land on "the last chord" must use the v3 event, not the mapped bar.')
json.dump(out, open(AN/'warp_v2_to_v3.json', 'w'), indent=1, ensure_ascii=False)
print('monotone', mono, 'old beats', len(GO), 'new beats', n3)
for e in events: print(f"{e['old_t']:8.3f} {e['type']:10s} mapped {e['new_t_mapped']:8.3f} -> {e.get('new_t')}  {e.get('note', '')}  | {e['old_label'][:50]}")
print('new-only events:'); [print(' ', x['new_t'], x['type'], x['new_label'][:70]) for x in new_events]
