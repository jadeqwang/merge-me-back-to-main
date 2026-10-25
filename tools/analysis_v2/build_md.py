"""v2 copy of tools/analysis/build_md.py (v2 wording). $ANALYSIS_DIR/timing.md: human-readable section table, lyric line table (with word timings), events, ASCII energy timeline, notes."""
import json, numpy as np
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools/analysis'))
from apaths import WK, AN, LINES, SONG, DUR
TJ = json.load(open(AN/'timing.json')); EN = json.load(open(AN/'energy.json'))
def ts(t): return f"{int(t//60)}:{t%60:06.3f}"
L = []; P = L.append
T = TJ['tempo']
P('# Merge (v2 of Merge Me Back to Main) - timing map\n')
P(f"Source: `inputs/Merge.wav` (48 kHz stereo, {TJ['audio']['duration_s']:.3f} s). All times are seconds from the first sample (mm:ss.mmm). **Different song render from v1 (`analysis/`): not sample-identical anywhere; see `analysis_v2/NOTES.md` for the old->new time map.**\n")
P('## Tempo / key / grid\n')
P(f"- **Tempo: 138.00 BPM, CONSTANT** (v1 drifted 136 -> 139.5). Kick onsets fit one straight line to ~2.6 ms rms; the best constant grid is within {T['drift']['best_constant_grid_max_error_ms']:.1f} ms of beats[]; a 135 BPM grid drifts {T['drift']['fixed_135_bpm_grid_max_error_s']} s. Still cut on `beat_grid.beats` / `bars` in timing.json.")
P(f"- 4/4, bar 1 beat 1 = 0.126 s, {len(TJ['bars'])} bars (bar {len(TJ['bars'])} incomplete). Every section starts on an 8-bar phrase line (bar 8n+1); same bar numbers as v1.")
P(f"- Grid accuracy: kick onsets vs grid {TJ['beat_grid']['fit']['drum']['resid_rms_ms']} ms rms (p95 {TJ['beat_grid']['fit']['drum']['resid_p95_ms']} ms); drumless sections anchored on the plucked-arp onsets ({TJ['beat_grid']['fit']['comb']['resid_rms_ms']} ms rms). Interpolated (no pulse) 15.3-20.1, 56.6-61.9, 202.7-221.9, 224.0-235.8, 265.8-278.8 s; extrapolated after 278.8 s.")
P(f"- **Key: B minor** (as v1). The chorus leans on the relative D major. No modulation.\n")
P('## Sections\n')
P('| # | Section | Start | End | Bars | Vocal starts | Loudness dB | Energy 0-1 | Notes |')
P('|---|---|---|---|---|---|---|---|---|')
for i, s in enumerate(TJ['sections']):
    vs = ts(s['vocal_start']) if s['vocal_start'] else '-'
    P(f"| {i+1} | **{s['name']}** | {ts(s['start'])} | {ts(s['end'])} | {s['start_bar']}-{s['end_bar']} | {vs} | {s['loudness_db']} | {s['energy_0_1']} | {s['description']} |")
P('\nSub-parts (useful cut points):\n')
for s in TJ['sections']:
    for p in s.get('parts', []):
        P(f"- {s['name']}: {p['name']} - {ts(p['start'])} (bar {p['start_bar']}) to {ts(p['end'])}")
P('\n## Key events\n')
P('| Time | Bar / beat | Type | Event |'); P('|---|---|---|---|')
for e in TJ['events']:
    extra = f" (until {ts(e['end'])})" if 'end' in e else ''
    P(f"| {ts(e['t'])} | {e['bar']} / {e['beat']:.2f} | {e['type']} | {e['label']}{extra} |")
km = TJ['key_moments']
P(f"\n**Drop impact (Instrumental Drop): {ts(km['drop_impact']['t'])} = {km['drop_impact']['t']} s, bar 89 downbeat.** The strongest bar-line impact is earlier, at {ts(km['biggest_impact']['t'])} (bar 73, start of Build Up). {km['silences']}\n")
P('## Lyrics - line table\n')
P('| # | Section | Line | Start | End | Dur | Bar / beat |'); P('|---|---|---|---|---|---|---|')
for l in TJ['lyrics']['lines']:
    P(f"| {l['id']} | {l['section']} | {l['text']} | {ts(l['start'])} | {ts(l['end'])} | {l['end']-l['start']:.2f} | {l['start_pos']['bar']} / {l['start_pos']['beat']:.2f} |")
P('\n### Word timings\n')
for l in TJ['lyrics']['lines']:
    P(f"- **{l['id']}. {l['text']}** - " + ', '.join(f"{w['w']} {w['start']:.2f}-{w['end']:.2f}" for w in l['words']) + (f"  \n  _{l['note']}_" if l.get('note') else ''))
P('\n### Not on the lyric sheet / do not lip-sync\n')
for a in TJ['lyrics']['adlibs']:
    P(f"- {ts(a['start'])}-{ts(a['end'])} {a['text']} - lip-sync: {'yes (sustained vowel)' if a['lip_sync'] else 'no'}")
P('\n### Lyric sheet vs what is sung\n')
for x in TJ['lyrics']['vs_lyric_sheet']: P(f'- {x}')
P('\n### Long held notes (>= 2 s)\n')
P(', '.join(f"\"{h['word']}\" {h['start']:.2f}-{h['end']:.2f} ({h['dur']:.1f} s)" for h in TJ['lyrics']['held_notes']))
# ascii timeline
P('\n## ASCII energy timeline (2 bars per row, # = mix loudness, v = vocal sung, ! = event)\n')
P('```')
pb = EN['per_beat']; ev = TJ['events']; secs = TJ['sections']
for b0 in range(0, len(pb), 8):
    grp = pb[b0:b0+8]; t0 = grp[0]['t']; t1 = pb[b0+8]['t'] if b0+8 < len(pb) else TJ['audio']['duration_s']
    loud = np.mean([g['loud'] for g in grp]); sung = np.mean([g['sung'] for g in grp])
    sec = next((s['name'] for s in secs if s['start'] <= t0 + 1e-3 < s['end']), '')
    head = next((s['name'] for s in secs if abs(s['start'] - t0) < 0.05 or (s['start'] == 0 and b0 == 0)), '')
    evs = [e for e in ev if t0 - 0.03 <= e['t'] < t1 - 0.03 and e['type'] in ('drop', 'impact', 'hit', 'snare_roll', 'riser', 'drums_out', 'build')]
    bar_ = '#'*int(round(loud*40))
    P(f"{ts(t0)} bar {grp[0]['bar']:3d} |{bar_:<40s}| {'v' if sung > 0.3 else ' '} {'!' if evs else ' '} " + (f"<< {head.upper()}" if head else '') + ('  ' + '; '.join(e['type'] for e in evs) if evs else ''))
P('```\n')
SC = TJ['lyrics']['spot_check']
P('## Confidence and verification\n')
P(f"- **Beats/bars**: high. Tempo is metronomic (138.00 BPM); drum sections are locked to kick onsets (~3 ms), drumless intro/verse/chorus-1 to the plucked arp (~2-3 ms, softer onsets: allow +-10 ms). Long interpolated stretches (pad-only Chorus 2) are bridged by a straight line; the re-entry hits at bar 129 (222.73), bar 137 (236.64) and bar 153 (264.465) land within 0-4 ms of the grid.")
P(f"- **Bar numbering**: bar 1 beat 1 = 0.126 s, chosen by beat_this downbeat vote (148/155) and the section hits (bars 9, 17, 37, 41, 57, 65, 73, 89, 105, 129, 137, 153 all on downbeats). The generic v1 beatgrid.py slipped one beat in the v2 intro (beat_this tracks the off-beat for the first 8 s), hence tools/analysis_v2/beatgrid.py.")
P(f"- **Sections**: high for bar lines. Arrangement differs from v1 in places: no whispers in Build Up and no full drums-out gap before the drop; Chorus 2 starts with NO hit (pads only until bar 129); a wordless 'ooh' layer in the drop (173.1-180.9); only two 'Back to main'; no final hit at bar 161 (last hit is bar 153, 264.465).")
P(f"- **Word starts**: independent spot check on {SC['n']} consonant-initial words (onset measured on the demucs stem, alignment refined on the RoFormer stem): median |error| {SC['median_abs_ms']:.0f} ms, mean {SC['mean_abs_ms']:.0f} ms, 90th pct {SC['p90_abs_ms']:.0f} ms, max {SC['max_abs_ms']:.0f} ms. The >90 ms cases are b/p words (place, become) where the timing marks lip closure and the measurement picks the burst/vowel.")
P("- **Lower-confidence words** (+-0.1-0.3 s): 'I' and 'learned' in Verse 2 line 18 (improvised legato, placed on the pitch drop 198.12 / rise 198.42), 'who' in line 19 (203.56), 'to/main' in both 'Back to main' (nasal/vowel boundaries), 'Ahh' #1 start (musical boundary), vowel-initial words inside legato phrases, and all word ENDS on held notes (reverb tails: +-0.3 s).")
P("- **Line starts**: high. Line-initial words were moved to the audible voiced onset by inspection where CTC was late (Merge x3, Nothing, Where, And, This; see work_v2/overrides.json).")
P("- Aligners: 4 CTC runs agree within ~50 ms on most words; MMS_FA failed in Verse 2 line 18 (squeezed 'that I learned' into 0.3 s) and wav2vec2 placed 'to main' >1 s late in both 'Back to main' - both corrected by inspection. Whisper ran early on sustained notes and is a sanity check only.")
P('\n## Files\n')
P('- `analysis_v2/timing.json` - everything above (beats, downbeats, bars, phrases, sections, events, lyrics with words); same schema as analysis/timing.json. Lyric line `id`s are the v1 ids (14, 15, 26 do not exist in v2).')
P('- `analysis_v2/energy.json` - 10 Hz + per-beat loudness/brightness/onset/vocal-activity curves')
P('- `analysis_v2/stems/` - vocals.wav + instrumental.wav (demucs htdemucs_ft), drums/bass/other, vocals_roformer.wav (BS-RoFormer ep_317), all 48 kHz PCM_24 sample-aligned with inputs/Merge.wav')
P('- `analysis_v2/check_overview.png`, `analysis_v2/check_NN_<section>.png` - waveform + beats + sections + word boundaries')
P('- `analysis_v2/click_check.wav` - mix + beat clicks (downbeat high) + tone burst at each word start (line start = higher tone)')
P('- `analysis_v2/NOTES.md` - v1 -> v2 comparison (sections, lines, time map)')
P('- pipeline: `tools/analysis_v2/run_all.sh` (generic scripts in tools/analysis with env-var paths + v2-specific scripts); `work_v2/overrides.json` holds the manual corrections')
open(AN/'timing.md', 'w').write('\n'.join(L) + '\n')
print('\n'.join(L)[:200])
