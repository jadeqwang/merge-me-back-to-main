# Merge (keychange down) - timing map (v3)

Source: `inputs/Merge (keychange down).wav` (48 kHz stereo, 282.800 s). All times are seconds from the first sample (mm:ss.mmm). **Different render from v2 (`analysis_v3/`, inputs/Merge.wav): 2 semitones lower and NOT the same tempo; use `analysis_v3/warp_v2_to_v3.json` to move a v2-timed cut, see `analysis_v3/NOTES.md`.**

## Tempo / key / grid

- **Tempo: NOT constant** (v2 was 138.00 throughout): accelerando ~137.8 BPM (intro) -> ~138.5 (bars 33-80) -> ~139.5 (drop) -> ~140.6-141.0 (Verse 2 to Outro). The best constant grid is off by up to 633 ms; a 135 BPM grid drifts 8.73 s. **Cut on `beat_grid.beats` / `bars` in timing.json, never on a BPM.**
- BPM per 16-bar block: bar 1 137.80, bar 17 138.18, bar 33 138.54, bar 49 138.62, bar 65 138.77, bar 81 138.99, bar 97 139.48, bar 113 140.61, bar 129 140.98, bar 145 140.71, bar 161 140.26
- 4/4, bar 1 beat 1 = 0.219 s, 164 bars to the file end (bars 162-164 are extrapolated fade tail). Every section starts on an 8-bar phrase line (bar 8n+1); same section bar numbers as v2. The final hit (new in v3) falls on bar 161 beat 3.
- Grid accuracy: kick onsets vs grid 2.8 ms rms (p95 5.1 ms); drumless sections anchored on the plucked-arp onsets (2.5 ms rms). Interpolated (no pulse) 15.9-20.3, 56.7-61.9, 71.5-75.8, 91.4-96.6, 209.1-220.6, 222.7-235.0, 263.6-276.0 s (and a few sub-second gaps); extrapolated after 277.25 s.
- **Key: A minor** (v2 B minor transposed down 2 semitones). The chorus leans on the relative C major. No modulation inside the song.

## Sections

| # | Section | Start | End | Bars | Vocal starts | Loudness dB | Energy 0-1 | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | **Intro** | 0:00.000 | 0:28.087 | 1-16 | - | -21.8 | 0.37 | Pads + plucked arp fading in (mix > -40 dBFS from 0.65 s). Low synth bass audible in bars 1-4 (~1.2-6.9 s; only faint in v2) and again from bar 7 beat 3 (~11.3). NO soft hat/snare pattern in bars 5-7 (v2 had one from bar 5). Drum pickup in bar 8, then bar 9 (14.18): kick hit + rolling bass. Bars 13-16: bass out by ~24.5, pads; a sustained low tone in both vocal stems 25.8 -> 28.6 (starts ~2.5 s later than in v2, see adlibs). No lyric. |
| 2 | **Verse 1** | 0:28.087 | 0:55.876 | 17-32 | 0:28.675 | -21.1 | 0.42 | Kick/bass hit on bar 17 (28.10); soft low vocal starts 28.68. No steady drums. Bass under the verse (louder than in v2). |
| 3 | **Pre-Chorus** | 0:55.876 | 1:09.716 | 33-40 | 0:54.770 | -21.3 | 0.4 | Vocal pickup "And every" starts 54.77 - before the bar line. Bass fades out during bar 33 (v2: out from bar 34 beat 4). Kick hit on bar 37 (62.77) under the held "from"; filter riser 64.9 -> 69.72 (bars 38-40). |
| 4 | **Chorus 1** | 1:09.716 | 1:37.457 | 41-56 | 1:09.450 | -19.6 | 0.53 | Hit on bar 41 (69.720); "Merge" scoops in at 69.45, before the bar. Stripped chorus: no steady kick and, unlike v2, NO second kick hit at bar 52. Bass bars 41-54, out from ~94.0 (bar 54 beat 3). Last line "Nothing that I lived can come undone" ("undone" held to ~99.0). |
| 5 | **Breakdown** | 1:37.457 | 2:05.133 | 57-72 | 1:42.522 | -19.8 | 0.52 | Hit/crash on bar 57 (97.445). Strings/pads; "Branch... and wander..." 102.52, "Merge... and return..." 109.31; wordless "Ahh... ahh..." 111.74-125.6. Second half (bars 65-72) is a BUILD: kick hit + 16th hats from bar 65 (111.30), snare crescendo from 116.48, 32nd-note snare roll bar 72 (123.29-124.71). Same arrangement as v2 (kick pulse in bars 70-72 louder). |
| 6 | **Build Up** | 2:05.133 | 2:32.787 | 73-88 | - | -16.7 | 0.68 | Full kick + bass slam on bar 73 (125.13, strongest bar-line onset of the song). Four-on-the-floor groove bars 73-85, NO VOCAL (RoFormer vocal stem < -60 dB 126-171 s; whisper hallucinated "Bye"/"Oh my God" here). Bar 86 (147.60): bass out, kick continues to ~150.5 then fades while snare/hats continue; snare build 150.85 -> drop; mix brightens into the drop. Same as v2. |
| 7 | **Instrumental Drop** | 2:32.787 | 3:00.375 | 89-104 | - | -15.7 | 0.77 | DROP IMPACT 152.79 (bar 89 downbeat). Full kick/bass + lead + strings. Sustained wordless "ooh" layer in the vocal stems 172.54-180.3 (bars 100-104, as in v2; adlib, not a lyric). Bass thins out in bar 104; 16th snare fill 179.09-180.38 into Verse 2. |
| 8 | **Verse 2** | 3:00.375 | 3:27.819 | 105-120 | 3:01.403 | -16.2 | 0.65 | Impact on bar 105 (180.38), vocal 181.40. Improvised high melody (high notes on THE 184.66, I 189.81, THAT 196.46 held to 197.27, BE 203.52). Sung OVER full drums bars 105-116; bar 117 (200.99): one more kick HIT on the downbeat (v2: no hit), then drums + bass out (by ~201.3) for the last line. |
| 9 | **Chorus 2** | 3:27.819 | 3:55.038 | 121-136 | 3:27.580 | -19.2 | 0.56 | HIT on bar 121 (207.82): kick + bass return (v2 had NO hit here: pads only until bar 129). "Merge" scoops in at 207.58, 0.24 s before the bar; "ME" 209.88. No steady kick bars 122-128; bass under bars 121-133, out from ~229.5 (v2: bass bars 129-136). No kick/snare pickup before bar 129 (v2 had one). Hit on bar 129 (221.44). Filter riser bars 135-136 (231.6-235.04), snare pickup 234.58. Last line "Every life I've lived, I have become". |
| 10 | **Outro** | 3:55.038 | 4:42.800 | 137-164 | 3:54.158 | -17.2 | 0.63 | "Back to main" #1 is a pickup at 234.16 (end of Chorus 2). Bar 137 (235.04) full-drum outro drop; "main" held to ~238.0 and then NO wordless vocalise (v2 had one 238.66-248.97: the v3 vocal stems are silent ~238.5-247.7). "Back to main" #2 at 247.76, "main" held to ~251.2 (v2 ~4 s longer). Bar 149 (255.49): last kick, drums + bass out: arp alone. NEW: faint high sustained tone (~C5) in the vocal stems 260.85-264.3. Riser into bar 153: kick + bass hit 262.300, arp stops, then pads + bass sustain with chord changes on bars 155/157/159. NEW: FINAL HIT 276.82 (kick + last chord change) on bar 161 BEAT 3 - 2 beats later than the 2-bar chord rhythm predicts (v2: chord change on the bar-161 downbeat, no hit). Fade to < -40 dBFS at 282.23; file ends 282.800. |

Sub-parts (useful cut points):

- Intro: Intro A - pads/arp fade-in, low bass bars 1-4 - 0:00.000 (bar 1) to 0:14.185
- Intro: Intro B - kick hit + rolling bass (bar 9), pads from bar 13 - 0:14.185 (bar 9) to 0:28.087
- Breakdown: Breakdown A - strings, "Branch/Merge" lines - 1:37.457 (bar 57) to 1:51.295
- Breakdown: Breakdown B - first build: hats + snare crescendo under "Ahh" - 1:51.295 (bar 65) to 2:05.133
- Build Up: Build Up A - full-drum groove (impact 125.13), no vocal - 2:05.133 (bar 73) to 2:27.606
- Build Up: Build Up B - bass out, kick fading, snare build + riser - 2:27.606 (bar 86) to 2:32.787
- Verse 2: Verse 2 A - over full drums - 3:00.375 (bar 105) to 3:20.982
- Verse 2: Verse 2 B - hit on bar 117, then drums out - 3:20.982 (bar 117) to 3:27.819
- Outro: Outro A - final drop with held vocal - 3:55.038 (bar 137) to 4:15.485
- Outro: Outro B - drums out, arp alone - 4:15.485 (bar 149) to 4:22.301
- Outro: Outro C - last section hit, pads + bass, final hit bar 161 beat 3, fade - 4:22.301 (bar 153) to 4:42.800

## Key events

| Time | Bar / beat | Type | Event |
|---|---|---|---|
| 0:00.645 | 1 / 1.97 | start | first audible sound (pad/arp fade-in; mix < -40 dBFS before 0.65) |
| 0:14.180 | 8 / 4.99 | hit | kick hit + rolling bass (Intro B) |
| 0:25.800 | 15 / 3.73 | texture | sustained low tone in the vocal stems begins (swells to ~-35 dB by 27; see adlibs) |
| 0:28.100 | 17 / 1.03 | hit | kick/bass hit on Verse 1 downbeat |
| 0:28.675 | 17 / 2.36 | vocal | first vocal ("I split...") |
| 1:02.765 | 36 / 4.98 | hit | kick hit mid Pre-Chorus (under held "from") |
| 1:04.934 | 38 / 1.99 | riser | filter riser into Chorus 1 (other-stem >3.5 kHz band rises ~+29 dB) (until 1:09.720) |
| 1:09.720 | 41 / 1.01 | hit | Chorus 1 downbeat hit |
| 1:37.445 | 56 / 4.97 | hit | crash, Breakdown start |
| 1:51.295 | 65 / 1.00 | build | build 1 starts: kick hit + 16th-note hats |
| 1:56.480 | 67 / 4.99 | snare_roll | snare crescendo starts (build 1) (until 2:04.715) |
| 1:58.210 | 68 / 4.99 | hit | kick pulse returns (bar 69) + vocal leaps up ("ahh" #2 at 118.20) |
| 2:03.293 | 71 / 4.74 | snare_roll | 32nd-note snare roll (bar 72) (until 2:04.715) |
| 2:05.130 | 72 / 4.99 | impact | BIGGEST bar-line impact: full kick + bass slam, Build Up start |
| 2:27.159 | 85 / 3.97 | riser | mix brightening into the drop (until 2:32.790) |
| 2:27.605 | 85 / 5.00 | drums_out | bass out (bar 86); kick continues to ~150.5 then fades, snare/hats continue |
| 2:30.850 | 87 / 4.51 | snare_roll | snare build (16ths) into the drop (until 2:32.790) |
| 2:32.790 | 89 / 1.01 | drop | INSTRUMENTAL DROP IMPACT (bar 89 downbeat) |
| 2:52.540 | 100 / 2.80 | texture | wordless sustained "ooh" layer in the vocal stems (not a lyric) (until 3:00.280) |
| 2:58.008 | 103 / 3.50 | drums_out | bass thins out (bar 104; weaker change than in v2) (until 3:00.380) |
| 2:59.090 | 104 / 2.01 | snare_roll | 16th-note snare fill into Verse 2 (until 3:00.380) |
| 3:00.380 | 105 / 1.01 | impact | Verse 2 downbeat impact (full drums) |
| 3:20.990 | 117 / 1.02 | hit | kick hit on bar 117, then drums + bass cut (by ~201.3): stripped end of Verse 2 |
| 3:27.825 | 121 / 1.01 | hit | Chorus 2 downbeat HIT: kick + bass return (v2: no hit here) |
| 3:39.736 | 127 / 5.00 | riser | high-band riser into bar 129 (weaker than in v2: bass/pads already playing) (until 3:41.440) |
| 3:41.440 | 129 / 1.01 | hit | hit, Chorus 2 second half |
| 3:49.500 | 133 / 3.98 | drums_out | bass out (bar 133 beat 4) for the rest of Chorus 2 |
| 3:51.628 | 134 / 4.99 | riser | filter riser into the outro drop (bars 135-136) (until 3:55.045) |
| 3:54.620 | 136 / 4.02 | pickup | snare pickup (bar 136 beat 4) |
| 3:55.045 | 137 / 1.02 | impact | Outro drop impact (full drums return) |
| 4:15.490 | 149 / 1.01 | drums_out | last kick (bar 149), then drums + bass out; arp alone; vocal ended ~251.2 |
| 4:20.850 | 152 / 1.60 | texture | NEW in v3: faint high sustained tone (~C5) in the vocal stems, into the last section hit (until 4:24.300) |
| 4:21.018 | 152 / 1.99 | riser | riser into the bar-153 hit (until 4:22.300) |
| 4:22.300 | 152 / 5.00 | impact | last section hit (bar 153): kick + bass; arp stops, pads + bass sustain |
| 4:36.820 | 161 / 3.00 | impact | NEW in v3: FINAL HIT (kick + last chord change) on bar 161 BEAT 3; then sustain and fade |
| 4:42.230 | 164 / 3.65 | end | mix below -40 dBFS (fade-out end); file ends 282.800 |

**Drop impact (Instrumental Drop): 2:32.790 = 152.79 s, bar 89 downbeat.** The strongest bar-line impact is earlier, at 2:05.130 (bar 73, start of Build Up). no digital/full-mix silence inside the song (mix never < -40 dBFS between 0.65 and 282.23 s); the "gaps" are drums-out passages: ~201.3-207.82 (end of Verse 2), 255.49-262.30 (arp only), 262.30-276.82 (pads + bass only).

## Lyrics - line table

| # | Section | Line | Start | End | Dur | Bar / beat |
|---|---|---|---|---|---|---|
| 1 | Verse 1 | I split myself a thousand ways | 0:28.675 | 0:32.370 | 3.69 | 17 / 2.36 |
| 2 | Verse 1 | Down every road the night could hold | 0:33.654 | 0:40.165 | 6.51 | 20 / 1.82 |
| 3 | Verse 1 | Each one a light I sent ahead | 0:42.399 | 0:46.365 | 3.97 | 25 / 1.95 |
| 4 | Verse 1 | Each one a story to unfold | 0:47.637 | 0:54.065 | 6.43 | 28 / 1.99 |
| 5 | Pre-Chorus | And every branch remembers | 0:54.770 | 0:58.920 | 4.15 | 32 / 2.44 |
| 6 | Pre-Chorus | Where I started from | 1:00.000 | 1:06.025 | 6.03 | 35 / 2.57 |
| 7 | Chorus 1 | Merge me back to main | 1:09.450 | 1:15.743 | 6.29 | 40 / 4.39 |
| 8 | Chorus 1 | Every road I ran becomes the one | 1:15.758 | 1:22.020 | 6.26 | 44 / 2.92 |
| 9 | Chorus 1 | Fold me in again | 1:23.545 | 1:29.415 | 5.87 | 48 / 4.89 |
| 10 | Chorus 1 | Nothing that I lived can come undone | 1:29.430 | 1:38.985 | 9.55 | 52 / 2.46 |
| 11 | Breakdown | Branch... and wander... | 1:42.522 | 1:46.655 | 4.13 | 59 / 4.71 |
| 12 | Breakdown | Merge... and return... | 1:49.310 | 1:51.725 | 2.41 | 63 / 4.41 |
| 13 | Breakdown | Ahh... ahh... | 1:51.740 | 2:05.600 | 13.86 | 65 / 2.03 |
| 16 | Verse 2 | This branch may never find the way | 3:01.403 | 3:06.970 | 5.57 | 105 / 3.39 |
| 17 | Verse 2 | Back to the place where I began | 3:07.634 | 3:11.460 | 3.83 | 109 / 1.89 |
| 18 | Verse 2 | And maybe something that I learned | 3:14.737 | 3:19.985 | 5.25 | 113 / 2.42 |
| 19 | Verse 2 | Comes home to who I'll be again | 3:20.000 | 3:24.995 | 5.00 | 116 / 2.70 |
| 20 | Chorus 2 | Merge me back to main | 3:27.580 | 3:32.230 | 4.65 | 120 / 4.44 |
| 21 | Chorus 2 | Every road I ran becomes the one | 3:33.801 | 3:39.665 | 5.86 | 124 / 3.04 |
| 22 | Chorus 2 | Fold me in again | 3:41.353 | 3:45.890 | 4.54 | 128 / 4.80 |
| 23 | Chorus 2 | Every life I've lived, I have become | 3:47.403 | 3:54.143 | 6.74 | 132 / 3.05 |
| 24 | Outro | Back to main... | 3:54.158 | 3:58.040 | 3.88 | 136 / 2.93 |
| 25 | Outro | Back to main... | 4:07.762 | 4:11.175 | 3.41 | 144 / 2.86 |

### Word timings

- **1. I split myself a thousand ways** - I 28.68-28.73, split 28.73-29.15, myself 29.16-30.27, a 30.27-30.42, thousand 30.43-31.30, ways 31.31-32.37
- **2. Down every road the night could hold** - Down 33.65-34.24, every 34.25-34.73, road 34.74-36.17, the 36.18-36.53, night 36.54-37.73, could 37.74-38.52, hold 38.53-40.16
- **3. Each one a light I sent ahead** - Each 42.40-42.95, one 42.96-43.20, a 43.21-43.47, light 43.48-44.18, I 44.19-44.47, sent 44.48-45.05, ahead 45.06-46.37
- **4. Each one a story to unfold** - Each 47.64-48.13, one 48.14-48.40, a 48.41-48.48, story 48.48-50.44, to 50.45-51.75, unfold 51.76-54.06
- **5. And every branch remembers** - And 54.77-55.01, every 55.02-55.75, branch 55.76-57.12, remembers 57.13-58.92  
  _'And' voiced onset 54.77 (v2 54.66 -> mapped 54.77)_
- **6. Where I started from** - Where 60.00-60.61, I 60.62-60.70, started 60.70-62.18, from 62.19-66.03  
  _'Where' glide voiced from 60.00 (v2 59.93 -> mapped 60.00; CTC 60.11)_
- **7. Merge me back to main** - Merge 69.45-71.81, me 71.82-72.05, back 72.06-72.62, to 72.63-72.92, main 72.93-75.74  
  _'Merge' scoop voiced from 69.45 (v2 69.42 -> mapped 69.45; CTC 69.65 = vowel)_
- **8. Every road I ran becomes the one** - Every 75.76-76.61, road 76.61-77.93, I 77.94-78.15, ran 78.16-78.78, becomes 78.79-79.65, the 79.66-80.15, one 80.16-82.02  
  _'one': v2 convention (v2 80.154 sits 0.22 s before the vowel/formant change at 80.38; v3 shows the same change at 80.37, mapped v2 = 80.16). v3 CTC put it on the formant change (80.55). Low confidence (+-0.2 s), legato_
- **9. Fold me in again** - Fold 83.55-85.69, me 85.70-86.32, in 86.33-86.69, again 86.70-89.42
- **10. Nothing that I lived can come undone** - Nothing 89.43-90.48, that 90.49-91.52, I 91.53-91.86, lived 91.87-92.60, can 92.61-92.95, come 92.96-93.69, undone 93.70-98.98  
  _'N' of 'Nothing' voiced from 89.43 (v2 89.46 -> mapped 89.44; CTC 89.59)_
- **11. Branch... and wander...** - Branch 102.52-103.56, and 103.56-103.88, wander 103.89-106.66
- **12. Merge... and return...** - Merge 109.31-110.35, and 110.36-110.66, return 110.67-111.72  
  _'Merge' voiced from 109.31 (v2 109.43 -> mapped 109.31; CTC 109.52)_
- **13. Ahh... ahh...** - Ahh 111.74-118.17, ahh 118.20-125.60  
  _Wordless: no aligner/ASR output. Same melody as v2 (2 semitones lower). Ahh #1 = drop to the low note right after 'return' (111.74, measured; mapped v2 111.74), leaps at 113.91 and 116.53; Ahh #2 = leap up at 118.20 (bar 69 downbeat; mapped v2 118.19), held and fading out by ~125.6 (< -40 dB from ~124.95). Boundary 'return'/Ahh #1 is musical, not phonetic (medium-low confidence)._
- **16. This branch may never find the way** - This 181.40-181.80, branch 181.81-182.41, may 182.43-182.90, never 182.91-183.53, find 183.54-184.66, the 184.66-185.15, way 185.16-186.97
- **17. Back to the place where I began** - Back 187.63-188.02, to 188.03-188.33, the 188.34-188.53, place 188.61-189.32, where 189.33-189.80, I 189.81-190.03, began 190.04-191.46
- **18. And maybe something that I learned** - And 194.74-194.93, maybe 194.94-195.55, something 195.56-196.45, that 196.46-197.27, I 197.28-197.56, learned 197.57-199.99  
  _same improvisation as v2: 'some-thing that' on the high note 196.0-197.27; 'I' = drop to the low note 197.28 (mapped v2 197.30); 'learned' = step up 197.57 (mapped 197.59). MMS/wav2vec2 squeezed 'I learned' into 196.9-197.05 (wrong). 'that' kept at the fused 196.46 (RMS dip; mapped v2 196.31)_
- **19. Comes home to who I'll be again** - Comes 200.00-200.85, home 200.86-202.22, to 202.41-202.62, who 202.63-203.23, I'll 203.24-203.51, be 203.52-204.03, again 204.04-205.00  
  _'who' = new voiced note 202.63 (mapped v2 203.56 -> 202.65; CTC 202.84)_
- **20. Merge me back to main** - Merge 207.58-209.87, me 209.88-210.11, back 210.12-210.69, to 210.70-210.99, main 211.00-212.23  
  _'Merge' scoop voiced from 207.58 after a breath 207.4-207.55. NOT where v2 maps (207.14): in v3 the scoop starts 0.24 s before the bar-121 hit (207.82), in v2 0.69 s before bar 121. CTC 207.76_
- **21. Every road I ran becomes the one** - Every 213.80-214.58, road 214.59-215.88, I 215.89-216.03, ran 216.04-216.72, becomes 216.73-217.57, the 217.58-218.15, one 218.16-219.66  
  _'one': v2 convention as line 8 (mapped v2 = 218.16; vowel/formant change 218.30; CTC 218.55). Low confidence_
- **22. Fold me in again** - Fold 221.35-223.54, me 223.55-224.09, in 224.10-224.52, again 224.53-225.89
- **23. Every life I've lived, I have become** - Every 227.40-228.23, life 228.24-229.41, I've 229.41-229.73, lived 229.74-230.57, I 230.58-230.77, have 230.78-231.20, become 231.21-234.14
- **24. Back to main...** - Back 234.16-234.60, to 234.61-234.80, main 234.81-238.04
- **25. Back to main...** - Back 247.76-248.14, to 248.15-248.26, main 248.27-251.18  
  _'to' = RMS dip + t-burst 248.15-248.25, 'main' = voicing resumes 248.27 (same pattern as v2 250.01/250.30, but tighter; wav2vec2/CTC put 'main' on the pitch drop 249.17). 'main' held to ~251.6 (v2: to ~255.9)_

### Not on the lyric sheet / do not lip-sync

- 0:25.800-0:28.600 (sustained low tone in both vocal stems, swelling into "I split"; probably a hummed pickup or vocal pad, no consonants) - lip-sync: no
- 2:52.540-3:00.280 (wordless sustained "ooh" layer in the drop, bars 100-104; flat pitch then glide down ~176.4; abrupt start) - lip-sync: no
- 4:20.850-4:24.300 (NEW in v3: faint high sustained tone ~C5 in the vocal stems into the last section hit; no consonants) - lip-sync: no

### Lyric sheet vs what is sung

- Same words, same line order and the same 22 sung lines as v2 (faster-whisper on the v3 vocal stem, with and without prompt, plus windowed re-transcription). ASR mishearings such as "Back to Maine/me", "Branch and wonder", "This French", "something that I love", "Nothing that I left" are breathy-vowel artefacts as in v2; windowed ASR gives "Nothing that I lived can come undone".
- "Back to main..." is sung TWICE (234.16, 247.76), as in v2.
- NO wordless vocalise after the first held "main" (v2 had one, 238.66-248.97): the held "main" ends ~238.0 and the vocal stems are silent until "Back to main" #2.
- "Ahh... ahh..." = two long wordless notes 111.74-118.17 and 118.20-125.6 (leap up on bar 69); no consonants, boundary to "return" is musical.
- No vocal in the Build Up (RoFormer stem < -60 dB 126-171 s); the ASR outputs "Bye" / "Oh my God" there are hallucinations.
- Unlisted: low sustained tone in the vocal stems 25.8-28.6 before the first line, a wordless "ooh" layer 172.54-180.28 in the drop, and (new) a faint high tone 260.85-264.3 before the last section hit (adlibs, lip_sync false).
- Verse 2 improvisation as in v2: high notes on THE (184.66), I (189.81), THAT (196.46-197.27, held), BE (203.52). Chorus 2 "ME" emphasised (209.88).
- No extra chorus repeats; choruses are not doubled.

### Long held notes (>= 2 s)

"unfold" 51.76-54.06 (2.3 s), "from" 62.19-66.03 (3.8 s), "Merge" 69.45-71.81 (2.4 s), "main" 72.93-75.74 (2.8 s), "Fold" 83.55-85.69 (2.1 s), "again" 86.70-89.42 (2.7 s), "undone" 93.70-98.98 (5.3 s), "wander" 103.89-106.66 (2.8 s), "Ahh" 111.74-118.17 (6.4 s), "ahh" 118.20-125.60 (7.4 s), "learned" 197.57-199.99 (2.4 s), "Merge" 207.58-209.87 (2.3 s), "Fold" 221.35-223.54 (2.2 s), "become" 231.21-234.14 (2.9 s), "main" 234.81-238.04 (3.2 s), "main" 248.27-251.18 (2.9 s)

## ASCII energy timeline (2 bars per row, # = mix loudness, v = vocal sung, ! = event)

```
0:00.219 bar   1 |###                                     |     << INTRO
0:03.720 bar   3 |###############                         |     
0:07.214 bar   5 |################                        |     
0:10.702 bar   7 |###################                     |     
0:14.185 bar   9 |#####################                   |   !   hit
0:17.664 bar  11 |##################                      |     
0:21.140 bar  13 |###############                         |     
0:24.614 bar  15 |#############                           |     
0:28.087 bar  17 |####################                    | v ! << VERSE 1  hit
0:31.559 bar  19 |##################                      | v   
0:35.033 bar  21 |##################                      | v   
0:38.508 bar  23 |################                        | v   
0:41.985 bar  25 |####################                    | v   
0:45.465 bar  27 |###############                         | v   
0:48.945 bar  29 |###############                         | v   
0:52.419 bar  31 |################                        | v   
0:55.876 bar  33 |################                        | v   << PRE-CHORUS
0:59.323 bar  35 |###############                         | v   
1:02.773 bar  37 |################                        | v !   hit; riser
1:06.239 bar  39 |##################                      |     
1:09.716 bar  41 |#########################               | v ! << CHORUS 1  hit
1:13.190 bar  43 |####################                    | v   
1:16.659 bar  45 |######################                  | v   
1:20.126 bar  47 |###################                     | v   
1:23.594 bar  49 |########################                | v   
1:27.064 bar  51 |####################                    | v   
1:30.532 bar  53 |####################                    | v   
1:33.996 bar  55 |####################                    | v   
1:37.457 bar  57 |#####################                   | v ! << BREAKDOWN  hit
1:40.917 bar  59 |####################                    | v   
1:44.376 bar  61 |####################                    | v   
1:47.835 bar  63 |####################                    | v   
1:51.295 bar  65 |#######################                 | v !   build
1:54.754 bar  67 |########################                | v !   snare_roll
1:58.214 bar  69 |######################                  | v !   hit
2:01.674 bar  71 |###################                     | v !   snare_roll
2:05.133 bar  73 |###############################         |   ! << BUILD UP  impact
2:08.592 bar  75 |###############################         |     
2:12.050 bar  77 |###############################         |     
2:15.508 bar  79 |###############################         |     
2:18.965 bar  81 |###############################         |     
2:22.422 bar  83 |################################        |     
2:25.878 bar  85 |##########################              |   !   riser; drums_out
2:29.333 bar  87 |###############                         |   !   snare_roll
2:32.787 bar  89 |################################        |   ! << INSTRUMENTAL DROP  drop
2:36.241 bar  91 |###############################         |     
2:39.693 bar  93 |################################        |     
2:43.144 bar  95 |################################        |     
2:46.594 bar  97 |################################        |     
2:50.042 bar  99 |#################################       |     
2:53.489 bar 101 |##################################      |     
2:56.933 bar 103 |#############################           |   !   drums_out; snare_roll
3:00.375 bar 105 |#################################       | v ! << VERSE 2  impact
3:03.815 bar 107 |#################################       | v   
3:07.253 bar 109 |#################################       | v   
3:10.690 bar 111 |#################################       |     
3:14.125 bar 113 |#################################       | v   
3:17.558 bar 115 |####################################    | v   
3:20.982 bar 117 |########                                | v !   hit
3:24.401 bar 119 |######                                  | v   
3:27.819 bar 121 |########################                | v ! << CHORUS 2  hit
3:31.231 bar 123 |######################                  | v   
3:34.637 bar 125 |########################                | v   
3:38.038 bar 127 |#####################                   | v !   riser
3:41.436 bar 129 |#########################               | v !   hit
3:44.833 bar 131 |#####################                   | v   
3:48.231 bar 133 |######################                  | v !   drums_out
3:51.632 bar 135 |######################                  | v !   riser
3:55.038 bar 137 |################################        | v ! << OUTRO  impact
3:58.450 bar 139 |################################        |     
4:01.861 bar 141 |################################        |     
4:05.268 bar 143 |################################        | v   
4:08.673 bar 145 |#################################       | v   
4:12.079 bar 147 |###################################     |     
4:15.485 bar 149 |#################                       |   !   drums_out
4:18.892 bar 151 |#################                       |   !   riser
4:22.301 bar 153 |############################            |   !   impact
4:25.712 bar 155 |########################                |     
4:29.126 bar 157 |#####################                   |     
4:32.543 bar 159 |##################                      |     
4:35.964 bar 161 |##########################              |   !   impact
4:39.386 bar 163 |############                            |     
```

## Confidence and verification

- **Beats/bars**: high in drum sections (kick onsets, ~3 ms) and the arp-anchored drumless parts (~2-3 ms, softer onsets: allow +-10 ms). The tempo drifts, so interpolated stretches are bridged by a smooth spline: the re-entry hits at bar 129, 137 and 153 land within 4-7 ms of the grid. An independent estimate (v2 grid carried through an onset alignment) agrees within ~1-15 ms in drum sections and ~10-25 ms in drumless ones (NOTES.md). Least certain: the pads-only tail bars 154-160 (one anchor at each end).
- **Bar numbering**: bar 1 beat 1 = 0.219 s, chosen by beat_this downbeat vote (222 of 261) and the section hits (bars 9, 17, 37, 41, 57, 65, 73, 89, 105, 121, 129, 137, 153 all on downbeats). tools/analysis_v3/beatgrid.py tracks a drifting period (the v2 constant-line beatgrid cannot fit v3).
- **Sections**: high for bar lines. Arrangement differs from v2 in places: no soft hats in bars 5-7; no kick hit at bar 52; a kick hit on bar 117 before the Verse 2 drums-out; Chorus 2 STARTS WITH A HIT (bar 121, kick + bass) and has bass bars 121-133; no wordless vocalise after the first 'Back to main'; shorter second held 'main'; a faint high tone 260.9-264.3; and a NEW FINAL HIT on bar 161 beat 3 (276.82) before the fade.
- **Word starts**: independent spot check on 21 consonant-initial words (onset measured on the demucs stem, alignment refined on the RoFormer stem): median |error| 24 ms, mean 45 ms, 90th pct 110 ms, max 140 ms. The >90 ms cases are b/p words (place, become) where the timing marks lip closure and the measurement picks the burst/vowel.
- **Lower-confidence words** (+-0.1-0.3 s): 'I' and 'learned' in Verse 2 line 18 (improvised legato, placed on the pitch drop 197.28 / rise 197.57), 'who' in line 19 (202.63), 'one' at the end of both 'Every road I ran becomes the one' (v2 convention kept, CTC says ~0.4 s later), 'in' in line 22, 'to/main' in both 'Back to main', 'Ahh' #1 start (musical boundary), vowel-initial words inside legato phrases, and all word ENDS on held notes (reverb tails: +-0.3 s).
- **Line starts**: high. Line-initial words were moved to the audible voiced onset by inspection where CTC was late (Merge x3, Nothing, Where, And; see work_v3/overrides.json, every v2 override re-checked on v3 audio).
- Aligners: 4 CTC runs agree within ~50 ms on most words; as in v2, MMS_FA/wav2vec2 squeezed 'I learned' in line 18 and placed 'main' late in 'Back to main' #2 - corrected by inspection. Whisper ran early on sustained notes and is a sanity check only.

## Files

- `analysis_v3/timing.json` - everything above (beats, downbeats, bars, phrases, sections, events, lyrics with words); same schema as analysis_v2/timing.json. Lyric line `id`s are the v1 ids, as in v2 (14, 15, 26 do not exist).
- `analysis_v3/energy.json` - 10 Hz + per-beat loudness/brightness/onset/vocal-activity curves
- `analysis_v3/stems/` - vocals.wav + instrumental.wav (demucs htdemucs_ft), drums/bass/other, vocals_roformer.wav (BS-RoFormer ep_317), all 48 kHz PCM_24 sample-aligned with inputs/Merge (keychange down).wav
- `analysis_v3/check_overview.png`, `analysis_v3/check_NN_<section>.png` - waveform + beats + sections + word boundaries
- `analysis_v3/click_check.wav` - mix + beat clicks (downbeat high) + tone burst at each word start (line start = higher tone)
- `analysis_v3/NOTES.md` - v2 -> v3 comparison (sections, lines, tempo, time map); `analysis_v3/warp_v2_to_v3.json` - old->new time map (every beat, line start, event)
- pipeline: `tools/analysis_v3/run_all.sh` (generic scripts in tools/analysis with env-var paths + v3-specific scripts); `work_v3/overrides.json` holds the manual corrections
