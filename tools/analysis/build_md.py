"""analysis/timing.md: human-readable section table, lyric line table (with word timings), events, ASCII energy timeline, notes."""
import json, numpy as np
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
TJ = json.load(open(AN/'timing.json')); EN = json.load(open(AN/'energy.json'))
def ts(t): return f"{int(t//60)}:{t%60:06.3f}"
L = []; P = L.append
T = TJ['tempo']
P('# Merge Me Back to Main - timing map\n')
P(f"Source: `inputs/Merge Me Back to Main.wav` (48 kHz stereo, {TJ['audio']['duration_s']:.3f} s). All times are seconds from the first sample (mm:ss.mmm). The MP3 decodes sample-aligned with the WAV.\n")
P('## Tempo / key / grid\n')
P(f"- **Tempo: ~138.2 BPM, NOT 135 and NOT constant.** Smooth accelerando 136.1 BPM (intro) -> 137.0 (verse 1) -> 138.1 (chorus 1) -> 138.5 (build) -> 139.4-139.5 (verse 2 to outro), slight ritard into the final hit. "
  f"A constant {T['bpm_constant_fit']} BPM grid drifts up to {T['drift']['best_constant_grid_max_error_ms']:.0f} ms; a 135 BPM grid drifts {T['drift']['fixed_135_bpm_grid_max_error_s']} s. **Cut on `beat_grid.beats` / `bars` in timing.json, not on a BPM.**")
P(f"- 4/4, bar 1 beat 1 = 0.134 s, {len(TJ['bars'])} bars (bar 164 incomplete). Every section starts on an 8-bar phrase line (bar 8n+1).")
P(f"- Grid accuracy: kick onsets vs grid {TJ['beat_grid']['fit']['drum']['resid_rms_ms']} ms rms (p95 {TJ['beat_grid']['fit']['drum']['resid_p95_ms']} ms); drumless sections anchored on the plucked-arp onsets ({TJ['beat_grid']['fit']['comb']['resid_rms_ms']} ms rms). Interpolated (no pulse) 57.2-62.5 s, 204.7-208.1 s, 210.7-221.9 s; extrapolated after 278.8 s.")
P(f"- **Key: B minor** (confirmed). Bass roots Bm-G-D-A (i-VI-III-VII); the chorus leans on the relative D major. No modulation.\n")
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
P(f"\n**Drop impact (Instrumental Drop): {ts(km['drop_impact']['t'])} = {km['drop_impact']['t']} s, bar 89 downbeat.** The single biggest transient is earlier, at {ts(km['biggest_impact']['t'])} (bar 73, start of Build Up). {km['silences']}\n")
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
P(f"- **Beats/bars**: high. Drum sections are locked to kick onsets (~3 ms). Drumless intro/verse/chorus-1 are anchored to the plucked arpeggio (~3 ms fit, but those are softer onsets: allow +-10 ms). Pad-only Chorus 2 (210.7-221.9) is interpolated between anchors; the re-entry hit at bar 129 (222.725) lands within 3 ms of the interpolated grid, so the drift there is negligible.")
P(f"- **Sections**: high for bar lines (every section starts on an impact/hit or arrangement change on bar 8n+1). Lyric-tag mapping: the tags are honoured, but the arrangement differs from the sheet: the 'Breakdown' already contains the first snare-roll build (bars 65-72, under the Ahh's) and 'Build Up' starts with a full-drum slam (125.935) before the real drums-out snare-roll/riser (148.48-153.68) into the drop. Choruses are stripped (no steady kick); Verse 2 and the Outro have full drums.")
P(f"- **Word starts**: independent spot check on {SC['n']} consonant-initial words (onset measured on the demucs stem, alignment refined on the RoFormer stem): median |error| {SC['median_abs_ms']:.0f} ms, mean {SC['mean_abs_ms']:.0f} ms, 90th pct {SC['p90_abs_ms']:.0f} ms, max {SC['max_abs_ms']:.0f} ms. The >90 ms cases are b/p/h words (becomes, place, home, lived) where the timing marks lip closure / breath and the measurement picks the burst/vowel, i.e. the timing is where the mouth should start moving. Expect ~1-2 video frames for consonant-initial words.")
P("- **Lower-confidence words** (+-0.2-0.3 s): vowel-initial words inside legato phrases (\"I\" in \"Every road I ran\" placed on the pitch drop; \"road\" in \"Every road\" mid-note; \"one\" in \"becomes the one\" placed on the drop to the final held note), \"Ahh\" #1 start (musical boundary after \"return\", alternatives 114.65 / 117.25), whispered \"repo/per/agent\" (no pitch), and all word ENDS on held notes (reverb tails: +-0.3 s).")
P("- **Line starts**: high. Line-initial words were moved to the audible vocal onset by inspection (CTC put scooped/nasal starts like \"Merge\" ~0.2 s late).")
P("- Aligners: 4 CTC runs agree within ~50 ms on most words; stable-ts/whisper word starts ran systematically 0.3-0.6 s early on sustained singing and were used only as a sanity check. Breakdown 'Branch' is almost pure breath noise.")
P('\n## Files\n')
P('- `analysis/timing.json` - everything above (beats, downbeats, bars, phrases, sections, events, lyrics with words)')
P('- `analysis/energy.json` - 10 Hz + per-beat loudness/brightness/onset/vocal-activity curves')
P('- `analysis/stems/` - vocals.wav + instrumental.wav (demucs htdemucs_ft), drums/bass/other, vocals_roformer.wav')
P('- `analysis/check_overview.png`, `analysis/check_NN_<section>.png` - waveform + beats + sections + word boundaries')
P('- `analysis/click_check.wav` - mix + beat clicks (downbeat high) + tone burst at each word start (line start = higher tone); regenerate with `tools/analysis/click_check.py`')
P('- `tools/analysis/` - all scripts (adapted from vibesong/moongazing); `work/overrides.json` holds the manual corrections')
open(AN/'timing.md', 'w').write('\n'.join(L) + '\n')
print('\n'.join(L)[:200])
