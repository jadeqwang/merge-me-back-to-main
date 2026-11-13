"""v3 ("inputs/Merge (keychange down).wav") copy of tools/analysis_v2/build_timing.py: same code path and schema as
analysis_v2/timing.json; v3 hand-written section / event / adlib / tempo / key text from inspection of work_v3 products
(see analysis_v3/NOTES.md). Event times: measured on v3 where marked in NOTES.md; risers and a few gradual changes
are v2 times mapped by musical position (tools/analysis_v3/warpmap.py, M() below) and checked for presence only.
Assemble $ANALYSIS_DIR/timing.json from $WORK_DIR products (adapted from vibesong/tools/build_timing.py)."""
import json, numpy as np, soundfile as sf
import sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools/analysis')); sys.path.insert(0, str(Path(__file__).parent))
from apaths import WK, AN, LINES, SONG, DUR
from warpmap import old2new
M = lambda t: float(old2new(t))           # v2 time -> v3 time (same musical position)
W = lambda p: json.load(open(WK/p))
G = W('grid_final.json'); beats = G['beats']; GT = np.array([b['t'] for b in beats])
EV = W('events.json'); KEY = W('key.json'); LY = W('lyrics_fused.json'); SC = W('spotcheck.json'); AB = W('compare_ab.json')
EN = np.load(WK/'energy10.npz')
DUR = round(sf.info(str(WK/'song.wav')).frames/48000, 4)
def bar(b): return float(GT[(b-1)*4])
def where(t):
    j = int(np.searchsorted(GT, t, side='right') - 1); j = max(0, j)
    per = (GT[j+1]-GT[j]) if j+1 < len(GT) else (GT[j]-GT[j-1])
    return dict(bar=j//4+1, beat=round(j % 4 + 1 + (t-GT[j])/per, 2))
r3 = lambda x: round(float(x), 3)
LYD = {l['id']: l for l in LY}
def wd(i, w, k='start', n=0):
    return [x for x in LYD[i]['words'] if x['w'] == w][n][k]
# ---------------- bars / phrases
bars = []
for k in range(0, len(beats), 4):
    s = GT[k]; e = GT[k+4] if k+4 < len(GT) else DUR
    b = k//4 + 1
    bars.append(dict(bar=b, start=r3(s), end=r3(e), bpm=round(240/(e-s), 2) if k+4 < len(GT) else beats[k]['bpm'],
                     phrase8=(b-1)//8 + 1, phrase16=(b-1)//16 + 1, zone=beats[k]['zone']))
phr8 = [dict(phrase=p, start_bar=(p-1)*8+1, start=r3(bar((p-1)*8+1))) for p in range(1, (len(bars)-1)//8 + 2) if (p-1)*8+1 <= len(bars)]
phr16 = [dict(phrase=p, start_bar=(p-1)*16+1, start=r3(bar((p-1)*16+1))) for p in range(1, (len(bars)-1)//16 + 2) if (p-1)*16+1 <= len(bars)]
I = {k: v for k, v in EV['impacts'].items()}; I = {(int(k) if k.isdigit() else k): v for k, v in I.items()}
FH = I['161.3']['drum_onset']            # v3 final hit (bar 161 beat 3)
SIL = EV['silences_mix_below_-40dB']; START = SIL[0][1] if SIL and SIL[0][0] == 0.0 else 0.0
if len(SIL) > 1 and SIL[1][0] - START < 0.1: START = SIL[1][1]
FADE = SIL[-1][0] if SIL and SIL[-1][1] > DUR - 0.05 else DUR
# ---------------- sections (v3: same bar layout as v2/v1; every section starts on bar 8n+1)
S = [
 ('Intro', 0.0, 17, 1, 16, None, f'Pads + plucked arp fading in (mix > -40 dBFS from {START:.2f} s). Low synth bass audible in bars 1-4 (~1.2-6.9 s; only faint in v2) and again from bar 7 beat 3 (~11.3). NO soft hat/snare pattern in bars 5-7 (v2 had one from bar 5). Drum pickup in bar 8, then bar 9 ({I[9]["drum_onset"]:.2f}): kick hit + rolling bass. Bars 13-16: bass out by ~24.5, pads; a sustained low tone in both vocal stems 25.8 -> 28.6 (starts ~2.5 s later than in v2, see adlibs). No lyric.',
   [('Intro A - pads/arp fade-in, low bass bars 1-4', 0.0, 9), ('Intro B - kick hit + rolling bass (bar 9), pads from bar 13', 9, 17)]),
 ('Verse 1', 17, 33, 17, 32, wd(1, 'I'), f'Kick/bass hit on bar 17 ({I[17]["drum_onset"]:.2f}); soft low vocal starts {wd(1, "I"):.2f}. No steady drums. Bass under the verse (louder than in v2).', None),
 ('Pre-Chorus', 33, 41, 33, 40, wd(5, 'And'), f'Vocal pickup "And every" starts {wd(5, "And"):.2f} - before the bar line. Bass fades out during bar 33 (v2: out from bar 34 beat 4). Kick hit on bar 37 ({I[37]["drum_onset"]:.2f}) under the held "from"; filter riser {M(64.9):.1f} -> {I[41]["drum_onset"]:.2f} (bars 38-40).', None),
 ('Chorus 1', 41, 57, 41, 56, wd(7, 'Merge'), f'Hit on bar 41 ({I[41]["drum_onset"]:.3f}); "Merge" scoops in at {wd(7, "Merge"):.2f}, before the bar. Stripped chorus: no steady kick and, unlike v2, NO second kick hit at bar 52. Bass bars 41-54, out from ~94.0 (bar 54 beat 3). Last line "Nothing that I lived can come undone" ("undone" held to ~{wd(10, "undone", "end"):.1f}).', None),
 ('Breakdown', 57, 73, 57, 72, wd(11, 'Branch'), f'Hit/crash on bar 57 ({I[57]["drum_onset"]:.3f}). Strings/pads; "Branch... and wander..." {wd(11, "Branch"):.2f}, "Merge... and return..." {wd(12, "Merge"):.2f}; wordless "Ahh... ahh..." {wd(13, "Ahh"):.2f}-{wd(13, "ahh", "end"):.1f}. Second half (bars 65-72) is a BUILD: kick hit + 16th hats from bar 65 ({I[65]["drum_onset"]:.2f}), snare crescendo from 116.48, 32nd-note snare roll bar 72 ({M(123.49):.2f}-{M(124.92):.2f}). Same arrangement as v2 (kick pulse in bars 70-72 louder).',
   [('Breakdown A - strings, "Branch/Merge" lines', 57, 65), ('Breakdown B - first build: hats + snare crescendo under "Ahh"', 65, 73)]),
 ('Build Up', 73, 89, 73, 88, None, f'Full kick + bass slam on bar 73 ({I[73]["drum_onset"]:.2f}, strongest bar-line onset of the song). Four-on-the-floor groove bars 73-85, NO VOCAL (RoFormer vocal stem < -60 dB 126-171 s; whisper hallucinated "Bye"/"Oh my God" here). Bar 86 ({I[86]["drum_onset"]:.2f}): bass out, kick continues to ~150.5 then fades while snare/hats continue; snare build 150.85 -> drop; mix brightens into the drop. Same as v2.',
   [('Build Up A - full-drum groove (impact %.2f), no vocal' % I[73]['drum_onset'], 73, 86), ('Build Up B - bass out, kick fading, snare build + riser', 86, 89)]),
 ('Instrumental Drop', 89, 105, 89, 104, None, f'DROP IMPACT {I[89]["drum_onset"]:.2f} (bar 89 downbeat). Full kick/bass + lead + strings. Sustained wordless "ooh" layer in the vocal stems 172.54-180.3 (bars 100-104, as in v2; adlib, not a lyric). Bass thins out in bar 104; 16th snare fill 179.09-{I[105]["drum_onset"]:.2f} into Verse 2.', None),
 ('Verse 2', 105, 121, 105, 120, wd(16, 'This'), f'Impact on bar 105 ({I[105]["drum_onset"]:.2f}), vocal {wd(16, "This"):.2f}. Improvised high melody (high notes on THE {wd(16, "the"):.2f}, I {wd(17, "I"):.2f}, THAT {wd(18, "that"):.2f} held to {wd(18, "that", "end"):.2f}, BE {wd(19, "be"):.2f}). Sung OVER full drums bars 105-116; bar 117 ({I[117]["drum_onset"]:.2f}): one more kick HIT on the downbeat (v2: no hit), then drums + bass out (by ~201.3) for the last line.',
   [('Verse 2 A - over full drums', 105, 117), ('Verse 2 B - hit on bar 117, then drums out', 117, 121)]),
 ('Chorus 2', 121, 137, 121, 136, wd(20, 'Merge'), f'HIT on bar 121 ({I[121]["drum_onset"]:.2f}): kick + bass return (v2 had NO hit here: pads only until bar 129). "Merge" scoops in at {wd(20, "Merge"):.2f}, 0.24 s before the bar; "ME" {wd(20, "me"):.2f}. No steady kick bars 122-128; bass under bars 121-133, out from ~229.5 (v2: bass bars 129-136). No kick/snare pickup before bar 129 (v2 had one). Hit on bar 129 ({I[129]["drum_onset"]:.2f}). Filter riser bars 135-136 ({M(233.16):.1f}-{I[137]["drum_onset"]:.2f}), snare pickup {M(236.18):.2f}. Last line "Every life I\'ve lived, I have become".',
   None),   # no parts (as v2, keeps the section keys identical)
 ('Outro', 137, None, 137, len(bars), wd(24, 'Back'), f'"Back to main" #1 is a pickup at {wd(24, "Back"):.2f} (end of Chorus 2). Bar 137 ({I[137]["drum_onset"]:.2f}) full-drum outro drop; "main" held to ~{wd(24, "main", "end"):.1f} and then NO wordless vocalise (v2 had one 238.66-248.97: the v3 vocal stems are silent ~238.5-247.7). "Back to main" #2 at {wd(25, "Back"):.2f}, "main" held to ~{wd(25, "main", "end"):.1f} (v2 ~4 s longer). Bar 149 ({I[149]["drum_onset"]:.2f}): last kick, drums + bass out: arp alone. NEW: faint high sustained tone (~C5) in the vocal stems 260.85-264.3. Riser into bar 153: kick + bass hit {I[153]["drum_onset"]:.3f}, arp stops, then pads + bass sustain with chord changes on bars 155/157/159. NEW: FINAL HIT {FH:.2f} (kick + last chord change) on bar 161 BEAT 3 - 2 beats later than the 2-bar chord rhythm predicts (v2: chord change on the bar-161 downbeat, no hit). Fade to < -40 dBFS at {FADE:.2f}; file ends {DUR:.3f}.',
   [('Outro A - final drop with held vocal', 137, 149), ('Outro B - drums out, arp alone', 149, 153), ('Outro C - last section hit, pads + bass, final hit bar 161 beat 3, fade', 153, None)]),
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
def ev(t, kind, label, **kw): return dict(t=r3(t), **where(t), type=kind, label=label, **kw)
events = [
 ev(START, 'start', f'first audible sound (pad/arp fade-in; mix < -40 dBFS before {START:.2f})'),
 ev(I[9]['drum_onset'], 'hit', 'kick hit + rolling bass (Intro B)'),
 ev(25.8, 'texture', 'sustained low tone in the vocal stems begins (swells to ~-35 dB by 27; see adlibs)'),
 ev(I[17]['drum_onset'], 'hit', 'kick/bass hit on Verse 1 downbeat'),
 ev(wd(1, 'I'), 'vocal', 'first vocal ("I split...")'),
 ev(I[37]['drum_onset'], 'hit', 'kick hit mid Pre-Chorus (under held "from")'),
 ev(M(64.9), 'riser', 'filter riser into Chorus 1 (other-stem >3.5 kHz band rises ~+29 dB)', end=r3(I[41]['drum_onset'])),
 ev(I[41]['drum_onset'], 'hit', 'Chorus 1 downbeat hit'),
 ev(I[57]['drum_onset'], 'hit', 'crash, Breakdown start'),
 ev(I[65]['drum_onset'], 'build', 'build 1 starts: kick hit + 16th-note hats'),
 ev(116.48, 'snare_roll', 'snare crescendo starts (build 1)', end=r3(M(124.92))),
 ev(I[69]['drum_onset'], 'hit', f'kick pulse returns (bar 69) + vocal leaps up ("ahh" #2 at {wd(13, "ahh"):.2f})'),
 ev(M(123.49), 'snare_roll', '32nd-note snare roll (bar 72)', end=r3(M(124.92))),
 ev(I[73]['drum_onset'], 'impact', 'BIGGEST bar-line impact: full kick + bass slam, Build Up start', strength_x_median=I[73]['strength_x']),
 ev(I[86]['drum_onset'], 'drums_out', 'bass out (bar 86); kick continues to ~150.5 then fades, snare/hats continue'),
 ev(M(147.5), 'riser', 'mix brightening into the drop', end=r3(I[89]['drum_onset'])),
 ev(150.85, 'snare_roll', 'snare build (16ths) into the drop', end=r3(I[89]['drum_onset'])),
 ev(I[89]['drum_onset'], 'drop', 'INSTRUMENTAL DROP IMPACT (bar 89 downbeat)', strength_x_median=I[89]['strength_x'], mix_onset=I[89]['mix_onset']),
 ev(172.54, 'texture', 'wordless sustained "ooh" layer in the vocal stems (not a lyric)', end=180.28),
 ev(M(178.6), 'drums_out', 'bass thins out (bar 104; weaker change than in v2)', end=r3(I[105]['drum_onset'])),
 ev(179.09, 'snare_roll', '16th-note snare fill into Verse 2', end=r3(I[105]['drum_onset'])),
 ev(I[105]['drum_onset'], 'impact', 'Verse 2 downbeat impact (full drums)', strength_x_median=I[105]['strength_x']),
 ev(I[117]['drum_onset'], 'hit', 'kick hit on bar 117, then drums + bass cut (by ~201.3): stripped end of Verse 2'),
 ev(I[121]['drum_onset'], 'hit', 'Chorus 2 downbeat HIT: kick + bass return (v2: no hit here)', strength_x_median=I[121]['strength_x']),
 ev(M(220.99), 'riser', 'high-band riser into bar 129 (weaker than in v2: bass/pads already playing)', end=r3(I[129]['drum_onset'])),
 ev(I[129]['drum_onset'], 'hit', 'hit, Chorus 2 second half', strength_x_median=I[129]['strength_x']),
 ev(229.5, 'drums_out', 'bass out (bar 133 beat 4) for the rest of Chorus 2'),
 ev(M(233.16), 'riser', 'filter riser into the outro drop (bars 135-136)', end=r3(I[137]['drum_onset'])),
 ev(234.62, 'pickup', 'snare pickup (bar 136 beat 4)'),
 ev(I[137]['drum_onset'], 'impact', 'Outro drop impact (full drums return)', strength_x_median=I[137]['strength_x']),
 ev(I[149]['drum_onset'], 'drums_out', 'last kick (bar 149), then drums + bass out; arp alone; vocal ended ~%.1f' % wd(25, 'main', 'end')),
 ev(260.85, 'texture', 'NEW in v3: faint high sustained tone (~C5) in the vocal stems, into the last section hit', end=264.3),
 ev(M(263.16), 'riser', 'riser into the bar-153 hit', end=r3(I[153]['drum_onset'])),
 ev(I[153]['drum_onset'], 'impact', 'last section hit (bar 153): kick + bass; arp stops, pads + bass sustain', strength_x_median=I[153]['strength_x']),
 ev(FH, 'impact', 'NEW in v3: FINAL HIT (kick + last chord change) on bar 161 BEAT 3; then sustain and fade', strength_x_median=I['161.3']['strength_x']),
 ev(FADE, 'end', f'mix below -40 dBFS (fade-out end); file ends {DUR:.3f}'),
]
events.sort(key=lambda e: e['t'])
# ---------------- lyrics
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
 dict(start=25.80, end=28.60, text='(sustained low tone in both vocal stems, swelling into "I split"; probably a hummed pickup or vocal pad, no consonants)', kind='hum', lip_sync=False,
      note='-50 dB at 25.9, ~-35 dB 27-28.5 (RoFormer); starts ~2.5 s later than in v2 (23.2); uncertain whether it is the singer'),
 dict(start=172.54, end=180.28, text='(wordless sustained "ooh" layer in the drop, bars 100-104; flat pitch then glide down ~176.4; abrupt start)', kind='wordless', lip_sync=False,
      note='as in v2 (2 semitones lower); both separators put it in the vocal stem; no consonants; could be a vocal-chop/choir pad rather than the lead - do not lip-sync unless intended'),
 dict(start=260.85, end=264.30, text='(NEW in v3: faint high sustained tone ~C5 in the vocal stems into the last section hit; no consonants)', kind='wordless', lip_sync=False,
      note='-35 to -55 dB (RoFormer), whisper hallucinated "Thank you for watching" on it; probably a pad/vocal texture, not a sung line'),
]
held_main = wd(24, 'main', 'end')
out = dict(
 audio=dict(file='inputs/Merge (keychange down).wav', duration_s=DUR, sample_rate=48000, channels=2,
            time_base='seconds from the first sample of "inputs/Merge (keychange down).wav" (48 kHz; analysed as the identical copy work_v3/song.wav). NOT interchangeable with analysis_v2/ (inputs/Merge.wav): use analysis_v3/warp_v2_to_v3.json for the old->new time map (see analysis_v3/NOTES.md).',
            stems=dict(vocals='analysis_v3/stems/vocals.wav (demucs htdemucs_ft)', instrumental='analysis_v3/stems/instrumental.wav (drums+bass+other)',
                       also=['analysis_v3/stems/drums.wav', 'analysis_v3/stems/bass.wav', 'analysis_v3/stems/other.wav', 'analysis_v3/stems/vocals_roformer.wav (BS-RoFormer, cleaner, used for alignment checks)'])),
 tempo=dict(suno_claim=135, bpm=G['drift']['mean_bpm'], bpm_mean=G['drift']['mean_bpm'], bpm_constant_fit=G['drift']['constant_fit_bpm'],
            drift=dict(note='NOT CONSTANT (unlike v2, which is 138.00 throughout): smooth accelerando ~137.8 BPM (intro) -> 138.2 (verse 1) -> 138.5-138.8 (bars 33-80) -> 139.0 (build) -> 139.5 (drop) -> 140.6-141.0 (verse 2 to outro), ~140.3-140.7 in the drumless tail. Fitted to kick onsets (2.8 ms rms) and the drumless arp comb with a smoothing spline; cross-checked against the v2 grid carried through an onset-envelope alignment (agreement 1-15 ms in drum sections).',
                       best_constant_grid_max_error_ms=G['drift']['constant_fit_max_err_ms'], fixed_135_bpm_grid_max_error_s=G['drift']['suno_135_max_err_s'],
                       warning=f"A constant-BPM grid is useless here: the best constant line is off by up to {G['drift']['constant_fit_max_err_ms']:.0f} ms. Cut on beats[] / bars[] only."),
            curve_per_16_bars=[dict(bar=b['bar'], t=b['start'], bpm=round(float(np.mean([x['bpm'] for x in bars[b['bar']-1:b['bar']+15]])), 2)) for b in bars[::16]],
            meter=f"4/4, four-on-the-floor where drums play; bar 1 beat 1 = {GT[0]:.3f} s; 8-bar phrases throughout (every section starts on bar 8n+1); the final hit falls on bar 161 beat 3 (see NOTES)"),
 key=dict(suno_claim='B minor (claim for the original render; this version is transposed down 2 semitones)', estimate='A minor (relative C major very prominent)', confidence='high',
          evidence=f"v2 harmony transposed down a whole tone throughout, no key change inside the song. Harmonic-stem (other+bass) chroma: {KEY['global_harmonic'][0][1]} r={KEY['global_harmonic'][0][0]} / {KEY['global_harmonic'][1][1]} r={KEY['global_harmonic'][1][0]} (no sharps/flats; v2 gave D major / B minor with the same r pattern); verse blocks best-fit A minor / C major, chorus blocks C major colour; every block's best key is the v2 block key minus 2 semitones or its relative.",
          blocks=KEY['blocks']),
 beat_grid=dict(convention='beats[i]: i from 0, bar = i//4+1, beat = i%4+1. zone: anchored = fitted to drum-stem kick onsets (drum sections) or to the plucked-arp onset comb (drumless sections); interpolated = no rhythmic anchor within +-2 beats (15.9-20.3, 56.7-61.9, 71.5-75.8, 91.4-96.6, 103.1-103.5, 202.3-202.7, 204.8-207.0, 209.1-220.6 = Chorus 2 first half, 222.7-235.0 = Chorus 2 second half, 263.6-276.0 = pads after the bar-153 hit; the tempo drifts, so interpolated stretches are less certain than in v2: see NOTES); extrapolated = after 277.25 s (after the final hit).',
                fit=G['fit'], verification=f"kick onsets vs grid residual rms {G['fit']['drum']['resid_rms_ms']} ms (p95 {G['fit']['drum']['resid_p95_ms']} ms); arp-comb anchors rms {G['fit']['comb']['resid_rms_ms']} ms; downbeat phase = beat_this downbeat vote (222 of 261 on phase 0, 29 on phase 2); every section hit lands on a downbeat within 13 ms (bars 9, 17, 37, 41, 57, 65, 69, 73, 86, 89, 105, 117, 121, 129, 137, 149, 153); independent estimate (v2 grid through an onset alignment) agrees within {AB['overall']['mean_abs_ms']} ms mean |diff| (per section in NOTES).",
                beats=[dict(t=b['t'], bar=b['bar'], beat=b['beat'], bpm=b['bpm'], zone=b['zone']) for b in beats],
                beat_times=[b['t'] for b in beats], downbeats=[b['t'] for b in beats if b['beat'] == 1]),
 bars=bars, phrases=dict(eight_bar=phr8, sixteen_bar=phr16),
 sections=sections,
 events=events,
 key_moments=dict(drop_impact=dict(t=r3(I[89]['drum_onset']), bar=89, note=f"Instrumental Drop; preceded by bass-out / kick-fading build {I[86]['drum_onset']:.2f}-{I[89]['drum_onset']:.2f} with snare build 150.85-{I[89]['drum_onset']:.2f}"),
                  biggest_impact=dict(t=r3(I[73]['drum_onset']), bar=73, note=f"start of Build Up; strongest bar-line onset among section starts ({I[73]['strength_x']}x median), full kick+bass slam after the 32nd-note snare roll"),
                  snare_roll_1=dict(start=116.48, roll_32nd=[r3(M(123.49)), r3(M(124.92))], end=r3(I[73]['drum_onset'])), snare_roll_2=dict(start=150.85, end=r3(I[89]['drum_onset'])),
                  filter_riser_1=dict(start=r3(M(147.5)), end=r3(I[89]['drum_onset'])), filter_riser_2=dict(start=r3(M(233.16)), end=r3(I[137]['drum_onset'])), noise_riser=dict(start=179.09, end=r3(I[105]['drum_onset'])),
                  silences=f'no digital/full-mix silence inside the song (mix never < -40 dBFS between {START:.2f} and {FADE:.2f} s); the "gaps" are drums-out passages: ~201.3-207.82 (end of Verse 2), {I[149]["drum_onset"]:.2f}-{I[153]["drum_onset"]:.2f} (arp only), {I[153]["drum_onset"]:.2f}-{FH:.2f} (pads + bass only).'),
 lyrics=dict(
   method='Known lyric text force-aligned per line on the vocal stems with 4 CTC runs (torchaudio MMS_FA + wav2vec2-large-960h, each on demucs htdemucs_ft and BS-RoFormer vocals; median start) cross-checked with stable-ts/whisper-large-v3 alignment; starts snapped to syllable onsets (energy/pitch) within -90/+50 ms; sibilant onsets backtracked to the start of frication; line starts and ambiguous words corrected by visual inspection of spectrogram + pitch panels (work_v3/overrides.json; every v2 override re-checked on the v3 audio, values measured in v3). Search windows = v2 windows mapped by musical position, +-0.2 s. Word ends = next word start, or the end of the sustained note (RoFormer RMS > max(peak-20, -40) dB).',
   lines=lines, adlibs=adlibs,
   vs_lyric_sheet=['Same words, same line order and the same 22 sung lines as v2 (faster-whisper on the v3 vocal stem, with and without prompt, plus windowed re-transcription). ASR mishearings such as "Back to Maine/me", "Branch and wonder", "This French", "something that I love", "Nothing that I left" are breathy-vowel artefacts as in v2; windowed ASR gives "Nothing that I lived can come undone".',
                   f'"Back to main..." is sung TWICE ({wd(24, "Back"):.2f}, {wd(25, "Back"):.2f}), as in v2.',
                   f'NO wordless vocalise after the first held "main" (v2 had one, 238.66-248.97): the held "main" ends ~{held_main:.1f} and the vocal stems are silent until "Back to main" #2.',
                   f'"Ahh... ahh..." = two long wordless notes {wd(13, "Ahh"):.2f}-{wd(13, "Ahh", "end"):.2f} and {wd(13, "ahh"):.2f}-{wd(13, "ahh", "end"):.1f} (leap up on bar 69); no consonants, boundary to "return" is musical.',
                   'No vocal in the Build Up (RoFormer stem < -60 dB 126-171 s); the ASR outputs "Bye" / "Oh my God" there are hallucinations.',
                   'Unlisted: low sustained tone in the vocal stems 25.8-28.6 before the first line, a wordless "ooh" layer 172.54-180.28 in the drop, and (new) a faint high tone 260.85-264.3 before the last section hit (adlibs, lip_sync false).',
                   f'Verse 2 improvisation as in v2: high notes on THE ({wd(16, "the"):.2f}), I ({wd(17, "I"):.2f}), THAT ({wd(18, "that"):.2f}-{wd(18, "that", "end"):.2f}, held), BE ({wd(19, "be"):.2f}). Chorus 2 "ME" emphasised ({wd(20, "me"):.2f}).',
                   'No extra chorus repeats; choruses are not doubled.'],
   held_notes=[dict(word=w['w'], line=l['id'], start=w['start'], end=w['end'], dur=round(w['end']-w['start'], 2)) for l in lines for w in l['words'] if w['end']-w['start'] >= 2.0],
   spot_check=SC['summary'] | dict(rows=SC['rows'], method='independent onset on the demucs vocal stem (steepest 2-8 kHz or broadband rise, backtracked) vs predicted start; |err|>90 ms cases are b/p words where the prediction marks lip closure and the measure marks the burst/vowel'))
)
json.dump(out, open(AN/'timing.json', 'w'), indent=1, ensure_ascii=False)
print('sections'); [print(f"{s['name']:18s} {s['start']:8.3f}-{s['end']:8.3f} bar {s['start_bar']}-{s['end_bar']} vocal {s['vocal_start']} loud {s['loudness_db']} e {s['energy_0_1']}") for s in sections]
print('held', out['lyrics']['held_notes'])
