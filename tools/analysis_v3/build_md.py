"""v3 copy of tools/analysis_v3/build_md.py (v3 wording). $ANALYSIS_DIR/timing.md: human-readable section table, lyric line table (with word timings), events, ASCII energy timeline, notes."""
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
P('# Merge (keychange down) - timing map (v3)\n')
P(f"Source: `inputs/Merge (keychange down).wav` (48 kHz stereo, {TJ['audio']['duration_s']:.3f} s). All times are seconds from the first sample (mm:ss.mmm). **Different render from v2 (`analysis_v3/`, inputs/Merge.wav): 2 semitones lower and NOT the same tempo; use `analysis_v3/warp_v2_to_v3.json` to move a v2-timed cut, see `analysis_v3/NOTES.md`.**\n")
P('## Tempo / key / grid\n')
P(f"- **Tempo: NOT constant** (v2 was 138.00 throughout): accelerando ~137.8 BPM (intro) -> ~138.5 (bars 33-80) -> ~139.5 (drop) -> ~140.6-141.0 (Verse 2 to Outro). The best constant grid is off by up to {T['drift']['best_constant_grid_max_error_ms']:.0f} ms; a 135 BPM grid drifts {T['drift']['fixed_135_bpm_grid_max_error_s']} s. **Cut on `beat_grid.beats` / `bars` in timing.json, never on a BPM.**")
P('- BPM per 16-bar block: ' + ', '.join(f"bar {c['bar']} {c['bpm']:.2f}" for c in T['curve_per_16_bars']))
P(f"- 4/4, bar 1 beat 1 = {TJ['bars'][0]['start']:.3f} s, {len(TJ['bars'])} bars to the file end (bars 162-164 are extrapolated fade tail). Every section starts on an 8-bar phrase line (bar 8n+1); same section bar numbers as v2. The final hit (new in v3) falls on bar 161 beat 3.")
P(f"- Grid accuracy: kick onsets vs grid {TJ['beat_grid']['fit']['drum']['resid_rms_ms']} ms rms (p95 {TJ['beat_grid']['fit']['drum']['resid_p95_ms']} ms); drumless sections anchored on the plucked-arp onsets ({TJ['beat_grid']['fit']['comb']['resid_rms_ms']} ms rms). Interpolated (no pulse) 15.9-20.3, 56.7-61.9, 71.5-75.8, 91.4-96.6, 209.1-220.6, 222.7-235.0, 263.6-276.0 s (and a few sub-second gaps); extrapolated after 277.25 s.")
P(f"- **Key: A minor** (v2 B minor transposed down 2 semitones). The chorus leans on the relative C major. No modulation inside the song.\n")
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
P(f"- **Beats/bars**: high in drum sections (kick onsets, ~3 ms) and the arp-anchored drumless parts (~2-3 ms, softer onsets: allow +-10 ms). The tempo drifts, so interpolated stretches are bridged by a smooth spline: the re-entry hits at bar 129, 137 and 153 land within 4-7 ms of the grid. An independent estimate (v2 grid carried through an onset alignment) agrees within ~1-15 ms in drum sections and ~10-25 ms in drumless ones (NOTES.md). Least certain: the pads-only tail bars 154-160 (one anchor at each end).")
P(f"- **Bar numbering**: bar 1 beat 1 = {TJ['bars'][0]['start']:.3f} s, chosen by beat_this downbeat vote (222 of 261) and the section hits (bars 9, 17, 37, 41, 57, 65, 73, 89, 105, 121, 129, 137, 153 all on downbeats). tools/analysis_v3/beatgrid.py tracks a drifting period (the v2 constant-line beatgrid cannot fit v3).")
P(f"- **Sections**: high for bar lines. Arrangement differs from v2 in places: no soft hats in bars 5-7; no kick hit at bar 52; a kick hit on bar 117 before the Verse 2 drums-out; Chorus 2 STARTS WITH A HIT (bar 121, kick + bass) and has bass bars 121-133; no wordless vocalise after the first 'Back to main'; shorter second held 'main'; a faint high tone 260.9-264.3; and a NEW FINAL HIT on bar 161 beat 3 (276.82) before the fade.")
P(f"- **Word starts**: independent spot check on {SC['n']} consonant-initial words (onset measured on the demucs stem, alignment refined on the RoFormer stem): median |error| {SC['median_abs_ms']:.0f} ms, mean {SC['mean_abs_ms']:.0f} ms, 90th pct {SC['p90_abs_ms']:.0f} ms, max {SC['max_abs_ms']:.0f} ms. The >90 ms cases are b/p words (place, become) where the timing marks lip closure and the measurement picks the burst/vowel.")
P("- **Lower-confidence words** (+-0.1-0.3 s): 'I' and 'learned' in Verse 2 line 18 (improvised legato, placed on the pitch drop 197.28 / rise 197.57), 'who' in line 19 (202.63), 'one' at the end of both 'Every road I ran becomes the one' (v2 convention kept, CTC says ~0.4 s later), 'in' in line 22, 'to/main' in both 'Back to main', 'Ahh' #1 start (musical boundary), vowel-initial words inside legato phrases, and all word ENDS on held notes (reverb tails: +-0.3 s).")
P("- **Line starts**: high. Line-initial words were moved to the audible voiced onset by inspection where CTC was late (Merge x3, Nothing, Where, And; see work_v3/overrides.json, every v2 override re-checked on v3 audio).")
P("- Aligners: 4 CTC runs agree within ~50 ms on most words; as in v2, MMS_FA/wav2vec2 squeezed 'I learned' in line 18 and placed 'main' late in 'Back to main' #2 - corrected by inspection. Whisper ran early on sustained notes and is a sanity check only.")
P('\n## Files\n')
P('- `analysis_v3/timing.json` - everything above (beats, downbeats, bars, phrases, sections, events, lyrics with words); same schema as analysis_v2/timing.json. Lyric line `id`s are the v1 ids, as in v2 (14, 15, 26 do not exist).')
P('- `analysis_v3/energy.json` - 10 Hz + per-beat loudness/brightness/onset/vocal-activity curves')
P('- `analysis_v3/stems/` - vocals.wav + instrumental.wav (demucs htdemucs_ft), drums/bass/other, vocals_roformer.wav (BS-RoFormer ep_317), all 48 kHz PCM_24 sample-aligned with inputs/Merge (keychange down).wav')
P('- `analysis_v3/check_overview.png`, `analysis_v3/check_NN_<section>.png` - waveform + beats + sections + word boundaries')
P('- `analysis_v3/click_check.wav` - mix + beat clicks (downbeat high) + tone burst at each word start (line start = higher tone)')
P('- `analysis_v3/NOTES.md` - v2 -> v3 comparison (sections, lines, tempo, time map); `analysis_v3/warp_v2_to_v3.json` - old->new time map (every beat, line start, event)')
P('- pipeline: `tools/analysis_v3/run_all.sh` (generic scripts in tools/analysis with env-var paths + v3-specific scripts); `work_v3/overrides.json` holds the manual corrections')
open(AN/'timing.md', 'w').write('\n'.join(L) + '\n')
print('\n'.join(L)[:200])
