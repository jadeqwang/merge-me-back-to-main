# Outro orchestra (bars 137–144, 236.5–249.4 s): what actually plays, transcribed and verified

Jade, 2026-10-26: *"make sure the musical notation correctly corresponds to the music for which ever instrument is being transcribed, and
that the notation is being read left to right the way you normally expect. It should not be arbitrary."* This is the transcription behind
the orchestra's score of light (`FX.score`, drawn by `engine/show/score.js` from `engine/show/score_orch.json`). Every pitch and onset below
was measured on the song. Where a part could not be measured reliably, it is not notated, and this document says so.

## 1. Result

Key: B minor / D major, two sharps. Every note in these bars is diatonic, so the score needs no accidentals. Meter: 4/4 at 138.00 BPM on
the `analysis_v2` grid (bar 137 = 236.643 s, one bar = 1.739 s, one 16th = 0.109 s).

| part (film player) | what plays | confidence |
|---|---|---|
| **Voice** (the violin doubles it from bar 138) | 137: the end of "Back to **main**" as a melisma, E4 (beat 1) D4 (the "and") B3 (from beat 2, held to the "and" of 1 of 138). 138–143: a wordless line in **two layers an octave apart**: **C#5/C#4** (138), **D5/D4** (139), an on-beat scoop G→A into **A5/A4** (140, beat 1), then the upper layer alone moves to **E5** on beat 3 over the lower layer's held A4, then **F#5/F#4** from the "and" of 4, tied over 141–142, F#4 to beat 2 of 143, F#5 to the "and" of 3. 144: rests, then "Back to main" #2 from the "and" of 2 (E4 F#4 E4 D4). | high (144 rhythm: medium) |
| **Synth keys** (the piano plays it) | A synth line on the **dotted-8th grid**: 16ths 0, 3, 6, 9 and 12 of each bar (3+3+3+3+4). It plays **A4** in 137–141 and 143 and **C#5** in 142 and 144, over a sustained pad, **Gadd9** (G3 B3 D4 G4 A4 B4 D5) in 137–140 and **Bm7** (B3 D4 F#4 A4 B4 D5) from 141. Notated as the line plus chord symbols. | 142–144 high, 137–140 medium, 141 low |
| **E. Guitar** (no guitar in the mix: it doubles the **bass synth**) | The bass synth (G1+G2, then B1+B2 octaves) is gated by the kick: it is silent on every beat and sounds from the "and" to the next beat, so the drive is **offbeat 8ths**. G in 137–140, B from the first offbeat of 141. The guitar plays it at the upper octave, G2/B2, written an octave up on a treble-8vb staff (G3/B3 with ledger lines). | high |
| **Violin-like instrument** | **None.** No bowed-string or vibrato instrument is present; the only line with vibrato is the voice. The violinist plays the sung line. | — |
| **The 16th inner arpeggiation** | A 16th-note arpeggiation of the chord tones is audible under the drop, but its note order cannot be recovered (§4.2), so **it is not notated**. The chord symbols carry its pitch content. | not transcribable |

The music, read left to right (also engraved by LilyPond from the same JSON, `tools/orch_tx/to_lilypond.py`):

```
          137              138                139         140                          141      142      143              144
Voice up  .                C#5 ───────────    D5 ──────   (G)A5 ──── E5 ── F#5 ~~~~~~  ~~~~~~   ~~~~~~   ~~~ to "and" of 3  .
Voice lo  E4 D4 B3 ~~~~~~  ~B3 C#4 ─────────  D4 ──────   (G)A4 ─────────── F#4 ~~~~~  ~~~~~~   ~~~~~~   to beat 2        r r E4 F#4 E4 D4~
Keys      A4 dotted-8ths ──────────────────────────────────────────────────────── A4    C#5      A4               C#5
Chords    Gadd9                                                                    Bm7
Guitar    offbeat 8ths on G ──────────────────────────────────────────────────── offbeat 8ths on B ─────────────────────────────────
```

## 2. Sources and alignment
- Audio: `review/cloud/audio/Merge_320k.mp3` (mix), `Merge_vocals_320k.mp3`, `Merge_instrumental_320k.mp3` (v2 song, sample-aligned), decoded
  with ffmpeg at 44.1 kHz.
- More stems: **htdemucs_6s** (vocals / drums / bass / guitar / piano / other) on the mix from 222.0 to 266.0 s, `--shifts 2`.
- Grid: `analysis_v2/timing.json`. The drum-stem onsets of bars 137, 138, 141 and 145 sit **−5 to +2 ms** from it, so the stems and the grid
  agree. Song time is the film's time.
- Stem levels per bar, 137–144: drums −17, bass −24, other −24 to −30, vocals −20 to −29 dB. The **guitar stem is at −80 to −89 dB and the
  piano stem at −77 to −81 dB**: both are empty. In bars 149–152, where the arp plays alone, htdemucs_6s puts that arp in "guitar" at −35 dB, so
  the model does pick up plucked synths when they are exposed.

## 3. Tools and versions
Python 3.13: numpy 2.5.3, scipy 1.18.1, librosa 1.0.0 (CQT, pYIN, HPSS), torch 2.14.1 + **torchcrepe 0.0.24** (full model, Viterbi decoding),
**basic-pitch 0.4.0** (ICASSP 2022 model, ONNX via onnxruntime 1.29.0), **demucs 4.1.0** with the htdemucs_6s weights `5c90dfd2-34c22ccb.th`
(mirror: github.com/nomadkaraoke/python-audio-separator, release `model-configs`), pretty_midi 0.2.11 + **FluidSynth 2.3.4** (FluidR3_GM)
for resynthesis, **GNU LilyPond 2.24.3** for the reference engraving, and verovio's Bravura outlines (SMuFL, SIL OFL 1.1) for the film's glyphs.

## 4. Method and per-part findings

### 4.1 Voice
- **Pitch of the lead layer.** torchcrepe (full, 10 ms hop, Viterbi) and pYIN on the vocal stem agree within 12 cents on every note. The
  song is at A440: notes sit within ±12 cents of equal temperament.
- **Onsets** come from the pitch-track changes and from basic-pitch note events. Each one was quantized to the nearest 16th; table §5 lists
  the deviations.
- **Two layers, not one.** On the held notes the second harmonic is 9–20 dB stronger than the fundamental, so an octave double alone could be
  an artefact of the vowel. Three measurements prove a separate upper layer:
  1. At the bar line 238.38 the B4 partial drops and C#5 rises (−11.5 → −2.9 dB in 0.1 s). The lead's B3 continues to 238.55, as the [n] of
     "main", and C#4 arrives only at 238.60.
  2. From 242.75 to 243.36 the strongest partial is **E5** (−4.9 dB). E4, which would be its fundamental if one voice sang E4, is at −34 dB,
     and the 3rd and 5th harmonics of E4 are absent or weak. Meanwhile the A4 series continues. So the upper layer sings E5 while the lower layer
     holds A4. Both trackers report "A3" here: that is the common fundamental of A4 + E5 (a virtual pitch), and it explains the 57% in bar 140
     (§6).
  3. After the lead's F#4 stops at 247.5, **F#5 holds for 0.65 s** (−21 dB vs −50 dB for F#4, 247.6–248.1).
- **Odd harmonics fix the lower layer's octave.** For example, C#4 shows 832 Hz (3rd harmonic) at −9 dB, F#4 shows its 3rd and 5th
  harmonics at −11 and −14 dB, and B3 shows its 3rd at −5 dB.
- **The scoop at bar 140.** Both layers slide from G (241.88) to A (242.03), 0.15 s on the downbeat. It is notated as a grace note.

### 4.2 Synth keys
- The intro arp (bars 1–4) is a clear 3-note 16th cell, for example D5–F#4–C#5. A per-bar fit of a 3-note cell to basic-pitch onset
  posteriorgrams finds it with **z = 3.5–6.2** against slot permutations. Where the arp plays alone (149–152) the same fit gives up to
  **z = 3.2**, and a grid shifted by half a 16th scores clearly lower.
- **Under the drop (137–144) the same fit fails.** It gives z = −1.4…+3.5, and the half-16th-shifted grid scores **as high or higher** in
  141–144. The inner 16th arpeggiation is therefore not recoverable note by note, and it is not notated.
- **What is recoverable** is a line on the dotted-8th positions. For the transcribed pitch, the onset activation at 16ths 0, 3, 6, 9, 12 is
  compared with the other 11 sixteenths, and tested against 20,000 random 5-of-16 position sets:

  | bar | 137 | 138 | 139 | 140 | 141 | 142 | 143 | 144 |
  |---|---|---|---|---|---|---|---|---|
  | pitch | A4 | A4 | A4 | A4 | A4 | C#5 | A4 | C#5 |
  | contrast | +0.26 | +0.29 | +0.25 | +0.33 | +0.17 | +0.42 | +0.58 | +0.55 |
  | p | .004 | .003 | .005 | .001 | **.08** | .0007 | .0001 | .0003 |

  At the same five positions every other chord tone is weaker in every bar. A4 is also a sustained pad tone, so 137–140 are medium
  confidence. Bar 141 is ambiguous: A4 on quarters scores +0.19, and B4 is active at positions 3 and 9. It is notated as A4 to continue the
  line and marked low confidence. A vocal delay cannot explain the line: it plays A4 while the voice sings B, C#, D, and C#5 while the voice
  sings F#.
- **Pad voicing.** One-bar spectra of the "other" stem give G3 B3 D4 G4 **A4** B4 D5 (= Gadd9) and B3 D4 F#4 **A4** B4 D5 (= Bm7). A4 is the
  common tone.

### 4.3 Guitar = the bass drive
- **Pitch.** Subharmonic summation on one-bar spectra of the bass stem, energy summed within ±50 cents of harmonics 1–8, gives G1 as the best
  fundamental in each of bars 137–140 and B1 in each of 141–144. The kick gate puts 2.3 Hz sidebands around each partial, so single FFT peaks
  wander between F#2 and G2. The summed harmonics resolve this. F#1 is the runner-up at 0.79–0.96.
- **Rhythm.** Average level per 32nd inside the beat over all 32 beats: **−14, −53, −51, −13, −2, −1, 0, 0 dB**. The bass is silent from just
  after the beat to the 16th after it and full from the "and". Correlation with offbeat 8ths: **r = +0.96**; with on-beat 8ths: r = −0.96.

### 4.4 Comparison with the v5 design's music map (`orchestra.md`, a hypothesis)

| design hypothesis | measured |
|---|---|
| "ooh … C#→D (D4 + D5)" | confirmed: two layers, C#5/C#4 then D5/D4 |
| "leap to A4 241.92, E5 242.75, F# 243.42" | A5/A4 at 241.88, scooped from G. E5 on beat 3 (242.73) is in the upper layer only, over the lower layer's held A4. F#5/F#4 at the "and" of 4 (243.38). |
| "F# held to 248.2, then a high synth F#5 from 247.1" | F#4 (lead) to 247.5 and F#5 (upper layer) to 248.15. The "synth F#5" is the vocal's upper layer: it is in the vocal stem and has no instrumental partner. |
| "arp G4–B4–D5–A4 / B4–D5–F#5–C#5 at full tilt" | not supported. What can be measured is the dotted-8th A4/C#5 line (§4.2). |
| "guitar: tight strums on every half beat" | the drive is **offbeat** 8ths. The bass is silent on the beat (−53 dB). |
| "G → Bm change at bar 141" | confirmed: pad Gadd9 → Bm7 and bass G → B (first offbeat of 141) |

## 5. Per-bar results (onsets: grid time, measured time, deviation)

| bar | voice, upper layer | voice, lower layer (lead) | keys (dotted 8ths) | bass/guitar | conf. |
|---|---|---|---|---|---|
| 137 | – | E4 ♪ 236.643 (−23 ms), D4 ♪ 236.860 (0), B3 𝅗𝅥. 237.078 (+22) tied | A4, Gadd9 | G offbeat 8ths | high / keys med |
| 138 | C#5 𝅝 238.382 (−2) | B3 ♪ (tie end), C#4 238.599 (+1) "ooh", tied to 𝅗𝅥. | A4 | G | high / keys med |
| 139 | D5 𝅝 240.121 (−21) | D4 𝅝 240.121 (+9) | A4 | G | high / keys med |
| 140 | grace G5, A5 𝅗𝅥 241.860 (+20); E5 ♩. 242.730 (+20); F#5 ♪ 243.382 (−2) tied | grace G4, A4 𝅗𝅥.+♪ 241.860 (+30); F#4 ♪ 243.382 (+18) tied | A4 | G | high / keys med |
| 141 | F#5 𝅝 tied | F#4 𝅝 tied | A4 (ambiguous), Bm7 | B from the first offbeat | high / keys **low** |
| 142 | F#5 𝅝 tied | F#4 𝅝 tied | C#5 | B | high |
| 143 | F#5 𝅗𝅥+♪ to 248.164 (measured 248.15); rests | F#4 ♩ to 247.512 (measured 247.50); rests | A4 | B | high |
| 144 | rests | rests; "Back" E4 𝅘𝅥𝅯 249.469 (+1), F#4 249.578 (+52, scoop), "to" E4 ♪ 249.904 (+16), "main" D4 ♩ 250.121 (+29) tied into 145 | C#5 | B | high / voice rhythm medium |

## 6. Verification by resynthesis (`tools/orch_tx/verify.py`)
The transcription was rendered with FluidSynth: voice as GM "Voice Oohs", keys as a synth lead plus the pad chords, guitar as a GM bass, each
aligned to song time. The A/B wavs (stem left, resynthesis right) are written to `--out`, not committed. The OLD rows re-measure the
notation the film used before this change (`VLINE`, `ARP`, guitar slashes on every 8th), with the same metrics.

| measure | NEW (this transcription) | OLD (v5 design notation) |
|---|---|---|
| voice, torchcrepe frames within 50 cents of the notated (lower-layer) pitch | **93.4%** (median 11.5 cents); per bar 137: 96, 138: 98, 139: 99, **140: 57**, 141: 100, 142: 100, 143: 100, 144: 81% | **25.0%** (median 1181 cents); 78% of voiced frames covered |
| same, pitch class only | 96.6% (140: 93%) | 71.9% |
| voice, CQT-salience cosine per bar (octave-sensitive), resynthesis vs stem | mean **0.70** (0.60–0.79) | 0.46 (0.06 in 137) |
| voice, chroma cosine per bar | 0.84 | 0.70 |
| keys, chroma cosine per bar vs the "other" stem (line + pad) | **0.94** (0.93–0.96) | 0.83 (16th ARP) |
| keys, dotted-8th onset contrast | see §4.2, p ≤ .005 except 141 | – |
| guitar/bass, best fundamental per bar | G1 ×4, B1 ×4 (= the notation) | – |
| guitar/bass, rhythm (envelope correlation) | offbeat 8ths r = +0.96 | slashes on every 8th: on the beat the bass is at −53 dB |

Bar 140's 57% is the two-layer passage. The trackers report the virtual pitch A3 while A4 and E5 sound together (§4.1). The pitch-class score
is 93%, and the separate partial check gives E5 at −4.9 dB against −34 dB for E4. Bar 144's 81% comes from the short scoops of "Back to
main" (E4→F#4). This doc was iterated with the checks: the bass pitch measure (single peaks → subharmonic summation), the octave of the bar-140 E
(E5, not E4 or A3), the length of the held F#s (lower to beat 2 of 143, upper to the "and" of 3), and the rest and tie rules of the engraving.

## 7. Engraving (what the film draws) and how it was checked
- `engine/show/score.js` engraves `score_orch.json`:
  - staves: five lines; treble clef (the guitar's with an 8 below); key signature (F#, C#); 4/4; bar lines and bar numbers on the real bars;
  - notes and rests:
    - noteheads on their line or space (diatonic step from the JSON), with ledger lines;
    - stems by voice in two-voice bars (voice 1 up, voice 2 down) and by position otherwise;
    - beams per beat, with 16th secondary and partial beams, flags, dots, and ties between noteheads (voice 1 above, voice 2 below, otherwise
      away from the stem; incoming and hanging ties at the window edges);
    - rests split to show the beats (voice 1 rests raised, voice 2 rests lowered in two-voice bars);
    - grace notes (slashed, small) and accidentals, though none are needed here;
  - chord symbols (Gadd9, Bm7) over the keys, and the lead's lyrics under a single voice staff.
- **Rhythm spelling.** Note values are split at beats, and the middle of the bar stays visible (`tools/orch_tx/build_score.py`). For
  example, the keys' 3+3+3+3+4 becomes 8th. + 16th⁀8th + 8th⁀16th + 16th + 8th. + quarter, as LilyPond prints it.
- **Reading.** Time runs left to right at a constant 16th spacing. A cursor (playhead) moves right with the music and, at 62% of the staff,
  the staff scrolls under it. The composer's pencil writes each glyph 0.55 s before it sounds. In her shots, the glyph flies from her
  keyframed pencil tip into its place. When a note sounds it lights in the player's lane colour, and a copy flies to the player, where a ring
  bursts and the player glows. The voice part flies to the violin only from bar 138.
- **Checks done.**
  1. LilyPond 2.24.3 engraved the JSON as a reference (`to_lilypond.py`).
  2. `score.js` rendered the same bars statically in Chromium (Playwright; a `static` view mode), and the two were compared bar by bar. Fixed
     on the way:
     - the lower layer's beamed 8ths in 138 had up-stems;
     - ties sat on the wrong side in two-voice bars, and short ties became "v" shapes;
     - rests used dotted values that hid beats;
     - bar numbers collided with grace notes.
  3. Film stills: frames of the picked takes (orch_wide t52, orch_line t51, orch_keys t51, orch_pencil t52, orch_guitar t53) at 29 song times,
     with the EDL's own `text()` run in Chromium and the engine's type-over-image composite plus a bloom pass. Staves sit in open sky, and
     player targets were set on those frames.
- What changed in the film: the old `FX.score` drew arbitrary glyphs. It had a 16th arp on G4 B4 D5 A4, slashes on every 8th, the sung line
  an octave off in places, and glyphs scrolling right-to-left in the composer close-up. All of that is gone.

## 8. Ambiguities, honestly
- Bar 141 keys: A4 vs B4 on the dotted grid (p = .08): low confidence.
- Bar 137 keys: the impact masks the attacks. The dotted A4 is still significant (p = .004), but medium confidence.
- The inner 16th arpeggiation of the keys is present but not transcribable (§4.2), so it is not notated.
- Bar 144 "Back": the E4→F#4 scoop falls between two 16ths (+52 / −57 ms). It is notated as E4 16th + F#4 to match "Back to main" #1 in
  bar 136.
- The upper vocal layer could be a doubled take or a harmony stack; either way it is sung, and it is notated as voice 1.
- The guitar register (G2/B2) is a choice. The bass synth sounds G1+G2, and G1 is below a guitar's range.

## 9. Reproduce
```
python3 tools/orch_tx/build_score.py                       # engine/show/score_orch.json from the measured events
python3 tools/orch_tx/to_lilypond.py OUT                    # reference engraving (LilyPond)
python3 tools/orch_tx/make_glyphs.py                        # engine/fonts/bravura_glyphs.json (needs `pip install verovio`)
ffmpeg -ss 222 -t 44 -i review/cloud/audio/Merge_320k.mp3 mix_222.wav
python3 -m demucs.separate --repo MODELS -n htdemucs_6s --shifts 2 mix_222.wav      # MODELS holds 5c90dfd2-34c22ccb.th + htdemucs_6s.yaml
python3 tools/orch_tx/verify.py --sep separated/htdemucs_6s/mix_222 --sep-t0 222 --out OUT   # every number in §4 and §6
```
