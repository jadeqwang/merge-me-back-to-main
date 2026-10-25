"""v2 (inputs/Merge.wav) copy of tools/analysis/build_timing.py: same code path and schema, v2 hand-written section /
event / adlib / tempo / key text (from inspection of work_v2 products, see analysis_v2/NOTES.md).
Assemble analysis/timing.json from work/ products (adapted from vibesong/tools/build_timing.py)."""
import json, numpy as np, soundfile as sf
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools/analysis'))
from apaths import WK, AN, LINES, SONG, DUR
W = lambda p: json.load(open(WK/p))
G = W('grid_final.json'); beats = G['beats']; GT = np.array([b['t'] for b in beats])
EV = W('events.json'); KEY = W('key.json'); LY = W('lyrics_fused.json'); SC = W('spotcheck.json')
EN = np.load(WK/'energy10.npz')
DUR = round(sf.info(str(WK/'song.wav')).frames/48000, 4)
def bar(b): return float(GT[(b-1)*4])
def where(t):
    j = int(np.searchsorted(GT, t, side='right') - 1); j = max(0, j)
    per = (GT[j+1]-GT[j]) if j+1 < len(GT) else (GT[j]-GT[j-1])
    return dict(bar=j//4+1, beat=round(j % 4 + 1 + (t-GT[j])/per, 2))
r3 = lambda x: round(float(x), 3)
# ---------------- bars / phrases
bars = []
for k in range(0, len(beats), 4):
    s = GT[k]; e = GT[k+4] if k+4 < len(GT) else DUR
    b = k//4 + 1
    bars.append(dict(bar=b, start=r3(s), end=r3(e), bpm=round(240/(e-s), 2) if k+4 < len(GT) else beats[k]['bpm'],
                     phrase8=(b-1)//8 + 1, phrase16=(b-1)//16 + 1, zone=beats[k]['zone']))
phr8 = [dict(phrase=p, start_bar=(p-1)*8+1, start=r3(bar((p-1)*8+1))) for p in range(1, (len(bars)-1)//8 + 2) if (p-1)*8+1 <= len(bars)]
phr16 = [dict(phrase=p, start_bar=(p-1)*16+1, start=r3(bar((p-1)*16+1))) for p in range(1, (len(bars)-1)//16 + 2) if (p-1)*16+1 <= len(bars)]
# ---------------- sections (v2: same bar layout as v1; every section starts on bar 8n+1)
S = [
 ('Intro', 0.0, 17, 1, 16, None, 'Pads + plucked arp fading in with an opening filter (mix > -40 dBFS from 0.44 s; brightness 840 -> 2300 Hz over bars 1-6). Bar 5 (7.08): soft hat/snare pattern enters. Bar 9 (14.05): kick hit + rolling bass (bass already from bar 7 beat 3, 11.4). Bars 13-16: bass out, pads; a sustained low tone (~D4) in both vocal stems swells 23.2 -> 28.5 (see adlibs). No lyric.',
   [('Intro A - pads/arp fade-in, hat pattern from bar 5', 0.0, 9), ('Intro B - kick hit + rolling bass (bar 9), pads from bar 13', 9, 17)]),
 ('Verse 1', 17, 33, 17, 32, 28.54, 'Kick/bass hit on bar 17 (27.97); soft low vocal starts 28.54 (bar 17 beat 2.4). No steady drums. Bass under the verse.', None),
 ('Pre-Chorus', 33, 41, 33, 40, 54.66, 'Vocal pickup "And every" starts 54.66 (bar 32 beat 2.5) - 1.1 s BEFORE the bar line. Bass out from bar 34 beat 4. Kick hit on bar 37 (62.72) under the held "from"; filter riser 64.9 -> 69.7 (bars 38-40).', None),
 ('Chorus 1', 41, 57, 41, 56, 69.42, 'Hit on bar 41 (69.685); "Merge" scoops in at 69.42, 0.27 s before the bar. Stripped chorus: no steady kick; one more kick hit at 89.80 (bar 52, under "Nothing"). Bass bars 41-53, out from bar 54. Last line now "Nothing that I lived can come undone" ("undone" held to ~99.9).', None),
 ('Breakdown', 57, 73, 57, 72, 102.65, 'Hit/crash on bar 57 (97.515). Strings/pads; "Branch... and wander..." 102.65, "Merge... and return..." 109.43; wordless "Ahh... ahh..." 111.87-125.9. Second half (bars 65-72) is a BUILD: kick hit + 16th hats from bar 65 (111.42), snare crescendo from 116.64, 32nd-note snare roll bar 72 (123.49-124.92). Same arrangement as v1, ~0.6 s earlier.',
   [('Breakdown A - strings, "Branch/Merge" lines', 57, 65), ('Breakdown B - first build: hats + snare crescendo under "Ahh"', 65, 73)]),
 ('Build Up', 73, 89, 73, 88, None, 'Full kick + bass slam on bar 73 (125.34, strongest bar-line onset of the song). Four-on-the-floor groove bars 73-85, NO VOCAL (the v1 whispered "One repo per agent / Per session, per life" is gone; RoFormer vocal stem < -50 dB 127-172 s). Bar 86 (147.95): bass out, kick fades (-14 -> -40 dB) while snare/hats continue; mix brightens (riser) into the drop. Unlike v1 there is no full drums-out gap.',
   [('Build Up A - full-drum groove (impact 125.34), no vocal', 73, 86), ('Build Up B - bass out, kick fading, snare build + riser', 86, 89)]),
 ('Instrumental Drop', 89, 105, 89, 104, None, 'DROP IMPACT 153.17 (bar 89 downbeat). Full kick/bass + lead + strings. NEW in v2: a sustained wordless "ooh" layer in the vocal stems 173.08-180.9 (bars 100-104, no consonants; adlib, not a lyric). Bass out bar 104 beat 3 (178.6); 16th snare fill 179.68-180.99 into Verse 2.', None),
 ('Verse 2', 105, 121, 105, 120, 182.0, 'Impact on bar 105 (180.99), vocal 182.00. Improvised high melody (high notes on THE 185.30, I 190.57, THAT 197.12 held to 198.1, BE 204.38). Sung OVER full drums bars 105-116; drums + bass cut at bar 117 (201.86) for the last line.',
   [('Verse 2 A - over full drums', 105, 117), ('Verse 2 B - drums out', 117, 121)]),
 ('Chorus 2', 121, 137, 121, 136, 208.13, 'NO hit on bar 121 (208.82): pads only, no kick and no bass until bar 129. "Merge" scoops in at 208.13 out of the held "again"; "ME" emphasised (210.96). Kick/snare pickup 222.48 -> hit + bass return on bar 129 (222.73). Filter riser bars 135-136 (233.2-236.6). Last line now "Every life I\'ve lived, I have become".', None),
 ('Outro', 137, None, 137, 163, 235.75, '"Back to main" #1 is a pickup at 235.75 (end of Chorus 2). Bar 137 (236.64) full-drum outro drop; "main" held to 238.65 + wordless vocalise 238.66-248.97; "Back to main" #2 at 249.44, "main" held to ~255.9. Drums + bass out bar 149 (257.51): arp alone. Riser into bar 153: kick + bass hit 264.465, arp stops, then pads + bass sustain, fade to < -40 dBFS at 282.45. Only TWO "Back to main" (v1 had a third, low one) and NO final hit at bar 161 (v1 had one).',
   [('Outro A - final drop with held vocal', 137, 149), ('Outro B - drums out, arp alone', 149, 153), ('Outro C - last hit, pads + bass, fade', 153, None)]),
]
sections = []
for name, a, b, b0, b1, vs, desc, parts in S:
    st = 0.0 if a == 0.0 else bar(a); en = DUR if b is None else bar(b)
    m = (EN['t'] >= st) & (EN['t'] < en)
    rec = dict(name=name, start=r3(st), end=r3(en), start_bar=b0, end_bar=b1, bars=b1-b0+1, vocal_start=vs,
               loudness_db=round(float(10*np.log10(np.mean(10**(EN['rms'][m]/10)))), 1), energy_0_1=round(float(EN['loud'][m].mean()), 2), description=desc)
    if parts:
        rec['parts'] = [dict(name=pn, start=r3(0.0 if pa == 0.0 else bar(pa)), end=r3(DUR if pb is None else bar(pb)), start_bar=1 if pa == 0.0 else pa) for pn, pa, pb in parts]
    sections.append(rec)
# ---------------- events
I = {int(k): v for k, v in EV['impacts'].items()}
def ev(t, kind, label, **kw): return dict(t=r3(t), **where(t), type=kind, label=label, **kw)
events = [
 ev(0.44, 'start', 'first audible sound (pad/arp fade-in; mix < -40 dBFS before 0.44)'),
 ev(7.08, 'build', 'soft hat/snare pattern enters (bar 5)'),
 ev(I[9]['drum_onset'], 'hit', 'kick hit + rolling bass (Intro B)'),
 ev(23.2, 'texture', 'sustained low tone in the vocal stems begins (swells to -31 dB by 26.6; see adlibs)'),
 ev(I[17]['drum_onset'], 'hit', 'kick/bass hit on Verse 1 downbeat'),
 ev(28.54, 'vocal', 'first vocal ("I split...")'),
 ev(I[37]['drum_onset'], 'hit', 'kick hit mid Pre-Chorus (under held "from")'),
 ev(64.9, 'riser', 'filter riser into Chorus 1 (other-stem >3.5 kHz band +10 dB, centroid 1.9 -> 3.4 kHz)', end=69.69),
 ev(I[41]['drum_onset'], 'hit', 'Chorus 1 downbeat hit'),
 ev(89.80, 'hit', 'kick hit, Chorus 1 second half (under "Nothing")'),
 ev(I[57]['drum_onset'], 'hit', 'crash, Breakdown start'),
 ev(I[65]['drum_onset'], 'build', 'build 1 starts: kick hit + 16th-note hats'),
 ev(116.64, 'snare_roll', 'snare crescendo starts (build 1, snare band -47 -> -30 dB)', end=124.92),
 ev(I[69]['drum_onset'], 'hit', 'kick pulse returns (bar 69) + vocal leaps to F#5 ("ahh" #2 at 118.36)'),
 ev(123.49, 'snare_roll', '32nd-note snare roll (bar 72)', end=124.92),
 ev(I[73]['drum_onset'], 'impact', 'BIGGEST bar-line impact: full kick + bass slam, Build Up start', strength_x_median=I[73]['strength_x']),
 ev(147.95, 'drums_out', 'bass out (bar 86); kick fades -14 -> -40 dB, snare/hats continue'),
 ev(147.5, 'riser', 'mix brightening into the drop (centroid 3.3 -> 4.2 kHz)', end=153.17),
 ev(151.22, 'snare_roll', 'snare build (16ths, -31 -> -25 dB) into the drop', end=153.17),
 ev(I[89]['drum_onset'], 'drop', 'INSTRUMENTAL DROP IMPACT (bar 89 downbeat)', strength_x_median=I[89]['strength_x'], mix_onset=I[89]['mix_onset']),
 ev(173.08, 'texture', 'wordless sustained "ooh" layer in the vocal stems (not a lyric)', end=180.9),
 ev(178.6, 'drums_out', 'bass out (bar 104 beat 3)', end=180.99),
 ev(179.68, 'snare_roll', '16th-note snare fill into Verse 2', end=180.99),
 ev(I[105]['drum_onset'], 'impact', 'Verse 2 downbeat impact (full drums)', strength_x_median=I[105]['strength_x']),
 ev(201.86, 'drums_out', 'drums + bass cut (bar 117), stripped end of Verse 2'),
 ev(208.82, 'texture', 'Chorus 2 downbeat with NO hit: pads only (no kick/bass until bar 129)'),
 ev(220.99, 'riser', 'high-band riser into bar 129 (other-stem >3.5 kHz +9 dB)', end=222.73),
 ev(222.48, 'pickup', 'kick/snare pickup (bar 128 beat 4)'),
 ev(I[129]['drum_onset'], 'hit', 'hit + bass returns, Chorus 2 second half', strength_x_median=I[129]['strength_x']),
 ev(233.16, 'riser', 'filter riser into the outro drop (other-stem high band +10 dB, bars 135-136)', end=236.64),
 ev(236.18, 'pickup', 'snare pickup (bar 136 beat 4)'),
 ev(I[137]['drum_onset'], 'impact', 'Outro drop impact (full drums return)', strength_x_median=I[137]['strength_x']),
 ev(257.51, 'drums_out', 'drums + bass out (bar 149); arp alone, vocal ended ~255.9'),
 ev(263.16, 'riser', 'riser into the last hit (high band +12 dB)', end=264.47),
 ev(I[153]['drum_onset'], 'impact', 'last hit (bar 153): kick + bass; arp stops, pads + bass sustain to the fade', strength_x_median=I[153]['strength_x']),
 ev(282.45, 'end', f'mix below -40 dBFS (fade-out end); file ends {DUR:.3f}'),
]
events.sort(key=lambda e: e['t'])
# ---------------- lyrics
SEC_OF = {}
lines = []
for ln in LY:
    words = [dict(w=w['w'], start=r3(w['start']), end=r3(w['end'])) for w in ln['words']]
    rec = dict(id=ln['id'], section=ln['section'], text=ln['text'], kind=ln['kind'], start=words[0]['start'], end=words[-1]['end'],
               start_pos=where(words[0]['start']), words=words)
    fl = sorted({f.split('-')[0].split('+')[0].rstrip('0123456789.') for w in ln['words'] for f in w.get('flags', [])})
    if fl: rec['flags'] = fl
    if ln.get('note'): rec['note'] = ln['note']
    lines.append(rec)
adlibs = [
 dict(start=23.20, end=28.50, text='(sustained low tone ~D4 in both vocal stems, swelling into "I split"; probably a hummed pickup or vocal pad, no consonants)', kind='hum', lip_sync=False,
      note='-66 dB at 23.2, -48 dB at 24.5, -31 dB 26.6-28.4 (RoFormer); uncertain whether it is the singer'),
 dict(start=173.08, end=180.90, text='(wordless sustained "ooh" layer in the drop, bars 100-104; flat pitch ~G#4 then glide down ~177; abrupt start)', kind='wordless', lip_sync=False,
      note='both separators put it in the vocal stem; no consonants; could be a vocal-chop/choir pad rather than the lead - do not lip-sync unless intended'),
 dict(start=238.66, end=248.97, text='(wordless vocalise "ooh/ahh" continuing out of the held "main", F#4-A4 with a leap to F#5 at 248.10; not on the lyric sheet)', kind='wordless', lip_sync=True,
      note='continuous with the held "main" (236.41-238.65); re-attacks ~241.92 (leap to A4), ~243.42, ~248.10'),
]
out = dict(
 audio=dict(file='inputs/Merge.wav', duration_s=DUR, sample_rate=48000, channels=2,
            time_base='seconds from the first sample of inputs/Merge.wav (48 kHz). NOT interchangeable with analysis/ (v1 song): see analysis_v2/NOTES.md for the old->new time map.',
            stems=dict(vocals='analysis_v2/stems/vocals.wav (demucs htdemucs_ft)', instrumental='analysis_v2/stems/instrumental.wav (drums+bass+other)',
                       also=['analysis_v2/stems/drums.wav', 'analysis_v2/stems/bass.wav', 'analysis_v2/stems/other.wav', 'analysis_v2/stems/vocals_roformer.wav (BS-RoFormer, cleaner, used for alignment checks)'])),
 tempo=dict(suno_claim=135, bpm=138.0, bpm_mean=G['drift']['mean_bpm'], bpm_constant_fit=G['drift']['constant_fit_bpm'],
            drift=dict(note='CONSTANT (unlike v1): 138.00 BPM from bar 1 to the end; kick onsets fit one straight line to 2.6 ms rms (bars 33-150), the drumless intro arp comb sits on the same line, every 16-bar block averages 137.99-138.03 BPM.',
                       best_constant_grid_max_error_ms=G['drift']['constant_fit_max_err_ms'], fixed_135_bpm_grid_max_error_s=G['drift']['suno_135_max_err_s'],
                       warning='A constant 138.00 BPM grid from 0.126 s is within ~4 ms of beats[] everywhere, but still use beats[] / bars[]; Suno\'s 135 BPM would be off by 6.2 s.'),
            curve_per_16_bars=[dict(bar=b['bar'], t=b['start'], bpm=round(float(np.mean([x['bpm'] for x in bars[b['bar']-1:b['bar']+15]])), 2)) for b in bars[::16]],
            meter='4/4, four-on-the-floor where drums play; bar 1 beat 1 = 0.126 s; 8-bar phrases throughout (every section starts on bar 8n+1)'),
 key=dict(suno_claim='B minor', estimate='B minor (relative D major very prominent)', confidence='high',
          evidence=f"same harmony as v1. Harmonic-stem (other+bass) chroma: {KEY['global_harmonic'][0][1]} r={KEY['global_harmonic'][0][0]} / {KEY['global_harmonic'][1][1]} r={KEY['global_harmonic'][1][0]} (same key signature, 2 sharps); verse blocks best-fit B minor, chorus blocks D major colour. No modulation.",
          blocks=KEY['blocks']),
 beat_grid=dict(convention='beats[i]: i from 0, bar = i//4+1, beat = i%4+1. zone: anchored = fitted to drum-stem kick onsets (drum sections) or to the plucked-arp onset comb (drumless sections); interpolated = no rhythmic anchor within +-2 beats (15.3-20.1, 56.6-61.9, 202.7-221.9 = end of Verse 2 + pad-only Chorus 2, 224.0-235.8, 265.8-278.8 = pads after the last hit; tempo is metronomic so the drift there is negligible); extrapolated = after 278.8 s.',
                fit=G['fit'], verification=f"kick onsets vs grid residual rms {G['fit']['drum']['resid_rms_ms']} ms (p95 {G['fit']['drum']['resid_p95_ms']} ms); arp-comb anchors rms {G['fit']['comb']['resid_rms_ms']} ms; downbeat phase matches beat_this downbeats in 148/155 cases (the 7 others are bars 80-85, all phase 2); section-start hits after long interpolated stretches land within 0-4 ms of the grid (bar 129 222.73, bar 137 236.64, bar 153 264.465).",
                beats=[dict(t=b['t'], bar=b['bar'], beat=b['beat'], bpm=b['bpm'], zone=b['zone']) for b in beats],
                beat_times=[b['t'] for b in beats], downbeats=[b['t'] for b in beats if b['beat'] == 1]),
 bars=bars, phrases=dict(eight_bar=phr8, sixteen_bar=phr16),
 sections=sections,
 events=events,
 key_moments=dict(drop_impact=dict(t=r3(I[89]['drum_onset']), bar=89, note='Instrumental Drop; preceded by bass-out / kick-fading build 147.95-153.17 with snare build 151.22-153.17'),
                  biggest_impact=dict(t=r3(I[73]['drum_onset']), bar=73, note=f"start of Build Up; strongest bar-line onset among section starts ({I[73]['strength_x']}x median), full kick+bass slam after the 32nd-note snare roll"),
                  snare_roll_1=dict(start=116.64, roll_32nd=[123.49, 124.92], end=r3(I[73]['drum_onset'])), snare_roll_2=dict(start=151.22, end=r3(I[89]['drum_onset'])),
                  filter_riser_1=dict(start=147.5, end=153.17), filter_riser_2=dict(start=233.16, end=236.64), noise_riser=dict(start=179.68, end=180.99),
                  silences='no digital/full-mix silence inside the song (mix never < -40 dBFS between 0.44 and 282.45 s); the "gaps" are drums-out passages: 201.86-222.73 (pads only), 257.51-264.47 (arp only).'),
 lyrics=dict(
   method='Known lyric text force-aligned per line on the vocal stems with 4 CTC runs (torchaudio MMS_FA + wav2vec2-large-960h, each on demucs htdemucs_ft and BS-RoFormer vocals; median start) cross-checked with stable-ts/whisper-large-v3 alignment; starts snapped to syllable onsets (energy/pitch) within -90/+50 ms; sibilant onsets backtracked to the start of frication; line starts and ambiguous words corrected by visual inspection of spectrogram + pitch panels (work_v2/overrides.json). Word ends = next word start, or the end of the sustained note (RoFormer RMS > max(peak-20, -40) dB).',
   lines=lines, adlibs=adlibs,
   vs_lyric_sheet=['Every sheet line is sung once, in order, with the sheet words (ASR mishearings such as "Chained/Wrench and wander", "back to lane/Maine", "This dance", "something that I love" are breathy-vowel artefacts; the sung text matches the sheet).',
                   '"Back to main..." is sung TWICE (235.75, 249.44) - the sheet line, plus the end-of-chorus pickup; v1 had three.',
                   'Unlisted wordless vocalise 238.66-248.97 between "Back to main" #1 and #2 (continuous with the held "main").',
                   '"Ahh... ahh..." = two long wordless notes 111.87-118.33 and 118.36-125.9 (leap to F#5 on bar 69); no consonants, boundary to "return" is musical.',
                   'The build-up whispers of v1 are gone (no vocal at all 127-172 s in the RoFormer stem).',
                   'Unlisted: low sustained tone in the vocal stems 23.2-28.5 before the first line, and a wordless "ooh" layer 173.08-180.9 in the drop (adlibs, lip_sync false).',
                   'Verse 2 improvisation: high notes on THE (185.30-185.85), I (190.57), THAT (197.12-198.11, held), BE (204.38-205.0). Chorus 2 "ME" emphasised (210.96).',
                   'No extra chorus repeats; choruses are not doubled.'],
   held_notes=[dict(word=w['w'], line=l['id'], start=w['start'], end=w['end'], dur=round(w['end']-w['start'], 2)) for l in lines for w in l['words'] if w['end']-w['start'] >= 2.0],
   spot_check=SC['summary'] | dict(rows=SC['rows'], method='independent onset on the demucs vocal stem (steepest 2-8 kHz or broadband rise, backtracked) vs predicted start; |err|>90 ms cases are b/p words (place, become) where the prediction marks lip closure and the measure marks the burst/vowel'))
)
json.dump(out, open(AN/'timing.json', 'w'), indent=1, ensure_ascii=False)
print('sections'); [print(f"{s['name']:18s} {s['start']:8.3f}-{s['end']:8.3f} bar {s['start_bar']}-{s['end_bar']} vocal {s['vocal_start']} loud {s['loudness_db']} e {s['energy_0_1']}") for s in sections]
print('held', out['lyrics']['held_notes'])
