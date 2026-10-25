"""Assemble analysis/timing.json from work/ products (adapted from vibesong/tools/build_timing.py)."""
import json, numpy as np, soundfile as sf
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
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
# ---------------- sections
S = [
 ('Intro', 0.0, 17, 1, 16, None, 'Ambient pads + plucked arpeggio fading in (audible from ~0.4 s). Bar 9 (14.24): kick/crash hit and rolling offbeat bass enter; no vocal.',
   [('Intro A - pads/arp fade-in', 0.0, 9), ('Intro B - offbeat bass in (hit on bar 9)', 9, 17)]),
 ('Verse 1', 17, 33, 17, 32, 28.77, 'Kick/crash hit on bar 17 (28.31); soft breathy low vocal starts 28.77 (bar 17 beat 2). No steady drums. Bass drops out bars 29-30 (49.3-52.8).', None),
 ('Pre-Chorus', 33, 41, 33, 40, 55.21, 'Vocal pickup "And every" starts 55.21 (bar 32 beat 3) - 1.1 s BEFORE the bar line. Kick hit on bar 37 (63.32) under the held "from".', None),
 ('Chorus 1', 41, 57, 41, 56, 70.05, 'Hit on bar 41 (70.30); "Merge" scoops in at 70.05, 0.25 s before the bar. Stripped chorus: no steady kick (hits on bars 41 and 49 only); long held notes.', None),
 ('Breakdown', 57, 73, 57, 72, 103.27, 'Crash on bar 57 (98.15), "gone" held to ~100.4. Strings/pads; "Branch... and wander..." 103.27, "Merge... and return..." 110.05; wordless "Ahh... ahh..." 112.50-126.6. Second half (bars 65-72) is already a BUILD: kick hit + 16th hats from bar 65 (112.05), snare crescendo from 115.95, kick pulse back at bar 69 (118.99), 32nd-note snare roll bar 72 (124.20-125.50).',
   [('Breakdown A - strings, "Branch/Merge" lines', 57, 65), ('Breakdown B - first build: hats + snare crescendo under "Ahh"', 65, 73)]),
 ('Build Up', 73, 89, 73, 88, 136.25, 'Starts with the BIGGEST transient of the song: full kick + bass slam on bar 73 (125.935). Four-on-the-floor groove bars 73-85 with whispered layered "One repo per agent / Per session, per life" (136.25-147.4, with delay echoes). Kick stops after 147.18; bars 86-88 (148.48-153.68) drums/bass out: snare roll crescendo (from ~151.1) + filter riser, kick pickup 153.25.',
   [('Build Up A - full-drum groove (impact 125.935) + whispers', 73, 86), ('Build Up B - drums out, snare roll + filter riser', 86, 89)]),
 ('Instrumental Drop', 89, 105, 89, 104, None, 'DROP IMPACT 153.683 (bar 89 downbeat). Full kick/bass + soaring lead + strings, no vocal. Bass drops out bar 104 (179.65); riser 180.2-181.7 into Verse 2.', None),
 ('Verse 2', 105, 121, 105, 120, 181.73, 'Impact on bar 105 (181.38), vocal 181.73. Verse 2 sung OVER full drums (bars 105-116); drums + bass cut at bar 117 (202.09) for the last line.',
   [('Verse 2 A - over full drums', 105, 117), ('Verse 2 B - drums out', 117, 121)]),
 ('Chorus 2', 121, 137, 121, 136, 208.785, 'Hit on bar 121 (208.96); "Merge" scoops in at 208.785 straight out of the held "again". Stripped like Chorus 1 (kick hits on bars 121, 129 only). Filter riser bars 133-136 (229.6-236.5).', None),
 ('Outro', 137, None, 137, 164, 235.66, '"Back to main" #1 is a pickup at 235.66 (end of Chorus 2). Bar 137 (236.51) full-drum outro drop with held "main" + wordless vocalise (239.2-249.3), "Back to main" #2 at 249.38 held to 256.9. Drums out bar 149 (257.13), vocal gap 256.9-263.1, "Back to main" #3 263.11 (low) with kick hit bar 153 (264.02); pads + arp; final impact bar 161 (277.915) + second hit 278.16, sub swell 279-282, fade to silence ~284.45.',
   [('Outro A - final drop with held vocal', 137, 149), ('Outro B - drums out / vocal gap', 149, 153), ('Outro C - last "Back to main", pads + arp', 153, 161), ('Outro D - final hit + tail', 161, None)]),
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
 ev(0.56, 'start', 'first audible sound (pad fade-in; mix < -40 dBFS before 0.56)'),
 ev(I[9]['drum_onset'], 'hit', 'kick/crash hit + offbeat bass enters (Intro B)'),
 ev(I[17]['drum_onset'], 'hit', 'hit on Verse 1 downbeat'),
 ev(28.77, 'vocal', 'first vocal ("I split...")'),
 ev(I[37]['drum_onset'], 'hit', 'kick hit mid Pre-Chorus (under held "from")'),
 ev(I[41]['drum_onset'], 'hit', 'Chorus 1 downbeat hit'),
 ev(I[49]['drum_onset'], 'hit', 'hit, Chorus 1 second half ("Fold me in again")'),
 ev(I[57]['drum_onset'], 'hit', 'crash, Breakdown start'),
 ev(I[65]['drum_onset'], 'build', 'build 1 starts: kick hit + 16th-note hats'),
 ev(115.95, 'snare_roll', 'snare crescendo starts (build 1)', end=125.50),
 ev(I[69]['drum_onset'], 'hit', 'kick pulse returns (bar 69) + vocal leaps to F#5 ("ahh" #2 at 119.09)'),
 ev(124.20, 'snare_roll', '32nd-note snare roll (bar 72) + mix brightness riser', end=125.50),
 ev(125.50, 'pickup', 'kick pickup (bar 72 beat 4)'),
 ev(I[73]['drum_onset'], 'impact', 'BIGGEST IMPACT of the song: full kick + bass slam, Build Up start', strength_x_median=I[73]['strength_x']),
 ev(136.25, 'vocal', 'whispered "One repo per agent" begins'),
 ev(147.18, 'drums_out', 'last kick before the build gap (drums thin from bar 84, 145.0)'),
 ev(145.0, 'riser', 'filter riser on the synths (other-stem >3.5 kHz band +6.6 dB, bars 84-87)', end=151.95),
 ev(148.48, 'drums_out', 'kick + bass out (bar 86): build gap'),
 ev(151.09, 'snare_roll', 'snare-roll crescendo into the drop (snare band -64 -> -38 dB)', end=153.68),
 ev(153.25, 'pickup', 'kick pickup (bar 88 beat 4)'),
 ev(I[89]['drum_onset'], 'drop', 'INSTRUMENTAL DROP IMPACT (bar 89 downbeat)', strength_x_median=I[89]['strength_x'], mix_onset=I[89]['mix_onset']),
 ev(179.65, 'drums_out', 'bass out (bar 104), snare rising 176.2-181.0', end=181.38),
 ev(180.2, 'riser', 'noise riser (in vocal stem, not voice) into Verse 2', end=181.70),
 ev(I[105]['drum_onset'], 'impact', 'Verse 2 downbeat impact (full drums)', strength_x_median=I[105]['strength_x']),
 ev(202.09, 'drums_out', 'drums + bass cut (bar 117), stripped end of Verse 2'),
 ev(I[121]['drum_onset'], 'hit', 'Chorus 2 downbeat hit', strength_x_median=I[121]['strength_x']),
 ev(I[129]['drum_onset'], 'hit', 'kick hit, Chorus 2 second half'),
 ev(229.62, 'riser', 'filter riser into the outro drop (other-stem high band +9 dB, bars 133-136)', end=236.51),
 ev(I[137]['drum_onset'], 'impact', 'Outro drop impact (full drums return)', strength_x_median=I[137]['strength_x']),
 ev(257.13, 'drums_out', 'drums out (bar 149); vocal gap 256.9-263.1'),
 ev(I[153]['drum_onset'], 'hit', 'kick hit with last "Back to main"'),
 ev(273.1, 'texture', 'plucked arpeggio stops'),
 ev(I[161]['drum_onset'], 'impact', 'final hit (bar 161) + crash; second hit 278.16; sub-bass swell 279-282'),
 ev(284.44, 'end', 'mix below -40 dBFS (fade-out end); file ends 284.800'),
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
 dict(start=139.30, end=142.70, text='(whispered echo / delay tail of "agent")', kind='echo', lip_sync=False),
 dict(start=144.20, end=146.20, text='(whispered echo of "per session")', kind='echo', lip_sync=False),
 dict(start=147.50, end=148.70, text='(echo tail of "life")', kind='echo', lip_sync=False),
 dict(start=239.20, end=249.30, text='(wordless high vocalise "ooh/ahh", G5-A5 range, not on the lyric sheet)', kind='wordless', lip_sync=True,
      note='continuous with the held "main" (236.26-239.08); re-attacks ~239.7, ~243.4, ~245.5'),
]
out = dict(
 audio=dict(file='inputs/Merge Me Back to Main.wav', duration_s=DUR, sample_rate=48000, channels=2,
            time_base='seconds from the first sample of the WAV. The MP3 decodes sample-aligned with the WAV (encoder delay trimmed; cross-correlation lag 0 at 125 s and 200 s).',
            stems=dict(vocals='analysis/stems/vocals.wav (demucs htdemucs_ft)', instrumental='analysis/stems/instrumental.wav (drums+bass+other)',
                       also=['analysis/stems/drums.wav', 'analysis/stems/bass.wav', 'analysis/stems/other.wav', 'analysis/stems/vocals_roformer.wav (BS-RoFormer, cleaner, used for alignment checks)'])),
 tempo=dict(suno_claim=135, bpm=138.2, bpm_mean=G['drift']['mean_bpm'], bpm_constant_fit=G['drift']['constant_fit_bpm'],
            drift=dict(note='NOT constant: smooth accelerando ~136.1 BPM (intro) -> 137.0 (verse 1) -> 138.1 (chorus 1) -> 138.5 (build) -> 139.4-139.5 (verse 2 / chorus 2 / outro) -> ~139 at bar 145, slight ritard into the final hit.',
                       best_constant_grid_max_error_ms=G['drift']['constant_fit_max_err_ms'], fixed_135_bpm_grid_max_error_s=G['drift']['suno_135_max_err_s'],
                       warning='Do not cut on a fixed-BPM grid: the best constant 138.39 BPM grid is off by up to 0.68 s; Suno\'s 135 BPM would be off by 6.7 s. Use beats[] / bars[].'),
            curve_per_16_bars=[dict(bar=b['bar'], t=b['start'], bpm=round(float(np.mean([x['bpm'] for x in bars[b['bar']-1:b['bar']+15]])), 2)) for b in bars[::16]],
            meter='4/4, four-on-the-floor where drums play; bar 1 beat 1 = 0.134 s; 8-bar phrases throughout (every section starts on bar 8n+1)'),
 key=dict(suno_claim='B minor', estimate='B minor (relative D major very prominent)', confidence='high',
          evidence='bass-root histogram per bar: B 39, G 24, A 22, D 18, F# 4 bars -> progression Bm-G-D-A / G-A-Bm-Bm-D-D-A-A (i-VI-III-VII); harmonic-stem chroma correlates D major r=0.84 / B minor r=0.73 (same key signature, 2 sharps); verse blocks best-fit B minor, chorus blocks D major colour. No modulation.',
          blocks=KEY['blocks']),
 beat_grid=dict(convention='beats[i]: i from 0, bar = i//4+1, beat = i%4+1. zone: anchored = fitted to drum-stem kick onsets (drum sections) or to the plucked-arp onset comb (drumless sections); interpolated = no rhythmic anchor within +-2 beats (57.2-62.5 s = bars 33-36, 204.7-208.1 s, 210.7-221.9 s = pad-only Chorus 2; tempo carried smoothly by the spline); extrapolated = after the final hit (>278.8 s).',
                fit=G['fit'], verification='kick onsets vs grid residual rms 2.9 ms (p95 5.5 ms); arp-comb anchors rms 2.6 ms; downbeat phase matches beat_this downbeats in 161/165 cases (all 16-bar blocks).',
                beats=[dict(t=b['t'], bar=b['bar'], beat=b['beat'], bpm=b['bpm'], zone=b['zone']) for b in beats],
                beat_times=[b['t'] for b in beats], downbeats=[b['t'] for b in beats if b['beat'] == 1]),
 bars=bars, phrases=dict(eight_bar=phr8, sixteen_bar=phr16),
 sections=sections,
 events=events,
 key_moments=dict(drop_impact=dict(t=r3(I[89]['drum_onset']), bar=89, note='Instrumental Drop; preceded by drums-out snare-roll/filter build 148.48-153.68 and kick pickup 153.25'),
                  biggest_impact=dict(t=r3(I[73]['drum_onset']), bar=73, note='start of Build Up; strongest onset in the song (11x median), full kick+bass slam after the 32nd-note snare roll'),
                  snare_roll_1=dict(start=115.95, roll_32nd=[124.20, 125.50], end=125.935), snare_roll_2=dict(start=151.09, end=153.683),
                  filter_riser_1=dict(start=145.0, end=151.95), filter_riser_2=dict(start=229.62, end=236.51), noise_riser=dict(start=180.2, end=181.7),
                  silences='no digital/full-mix silence inside the song (mix never < -40 dBFS between 0.56 and 284.44 s); the "gaps" are drums-out builds: 148.48-153.68, 202.09-208.96, 257.13-264.02.'),
 lyrics=dict(
   method='Known lyric text force-aligned per line on the vocal stems with 4 CTC runs (torchaudio MMS_FA + wav2vec2-large-960h, each on demucs htdemucs_ft and BS-RoFormer vocals; median start) cross-checked with stable-ts/whisper-large-v3 alignment; starts snapped to syllable onsets (energy/pitch) within -90/+50 ms; sibilant onsets backtracked to the start of frication; line starts and ambiguous words corrected by visual inspection of spectrogram + pitch panels (work/overrides.json). Word ends = next word start, or the end of the sustained note (RoFormer RMS > max(peak-20, -40) dB).',
   lines=lines, adlibs=adlibs,
   vs_lyric_sheet=['Every sheet line is sung once, in order, with the sheet words (ASR mishearings such as "Wrench/Ranch and wander", "back to name", "This bridge" are breathy-vowel artefacts; the sung text matches the sheet).',
                   '"Back to main..." is sung THREE times (235.66, 249.38, 263.11), not twice; #1 is a pickup at the end of Chorus 2.',
                   'Unlisted wordless vocalise 239.2-249.3 between "Back to main" #1 and #2 (continuous with the held "main").',
                   '"Ahh... ahh..." = two long wordless notes 112.50-119.05 and 119.09-126.6 (leap to F#5 on bar 69); no consonants, boundary to "return" is musical.',
                   'Whispered build-up lines carry delay echoes (139.3-142.7, 144.2-146.2, 147.5-148.7) - do not lip-sync those.',
                   'No extra chorus repeats; choruses are not doubled.'],
   held_notes=[dict(word=w['w'], line=l['id'], start=w['start'], end=w['end'], dur=round(w['end']-w['start'], 2)) for l in lines for w in l['words'] if w['end']-w['start'] >= 2.0],
   spot_check=SC['summary'] | dict(rows=SC['rows'], method='independent onset on the demucs vocal stem (steepest 2-8 kHz or broadband rise, backtracked) vs predicted start; |err|>90 ms cases are b/p/h words where the prediction marks lip closure / breath and the measure marks the burst/vowel'))
)
json.dump(out, open(AN/'timing.json', 'w'), indent=1, ensure_ascii=False)
print('sections'); [print(f"{s['name']:18s} {s['start']:8.3f}-{s['end']:8.3f} bar {s['start_bar']}-{s['end_bar']} vocal {s['vocal_start']} loud {s['loudness_db']} e {s['energy_0_1']}") for s in sections]
print('held', out['lyrics']['held_notes'])
