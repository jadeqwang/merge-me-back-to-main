# Merge Me Back to Main - timing map

Source: `inputs/Merge Me Back to Main.wav` (48 kHz stereo, 284.800 s). All times are seconds from the first sample (mm:ss.mmm). The MP3 decodes sample-aligned with the WAV.

## Tempo / key / grid

- **Tempo: ~138.2 BPM, NOT 135 and NOT constant.** Smooth accelerando 136.1 BPM (intro) -> 137.0 (verse 1) -> 138.1 (chorus 1) -> 138.5 (build) -> 139.4-139.5 (verse 2 to outro), slight ritard into the final hit. A constant 138.392 BPM grid drifts up to 679 ms; a 135 BPM grid drifts 6.67 s. **Cut on `beat_grid.beats` / `bars` in timing.json, not on a BPM.**
- 4/4, bar 1 beat 1 = 0.134 s, 164 bars (bar 164 incomplete). Every section starts on an 8-bar phrase line (bar 8n+1).
- Grid accuracy: kick onsets vs grid 2.9 ms rms (p95 5.5 ms); drumless sections anchored on the plucked-arp onsets (2.6 ms rms). Interpolated (no pulse) 57.2-62.5 s, 204.7-208.1 s, 210.7-221.9 s; extrapolated after 278.8 s.
- **Key: B minor** (confirmed). Bass roots Bm-G-D-A (i-VI-III-VII); the chorus leans on the relative D major. No modulation.

## Sections

| # | Section | Start | End | Bars | Vocal starts | Loudness dB | Energy 0-1 | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | **Intro** | 0:00.000 | 0:28.308 | 1-16 | - | -22.4 | 0.35 | Ambient pads + plucked arpeggio fading in (audible from ~0.4 s). Bar 9 (14.24): kick/crash hit and rolling offbeat bass enter; no vocal. |
| 2 | **Verse 1** | 0:28.308 | 0:56.335 | 17-32 | 0:28.770 | -23.0 | 0.31 | Kick/crash hit on bar 17 (28.31); soft breathy low vocal starts 28.77 (bar 17 beat 2). No steady drums. Bass drops out bars 29-30 (49.3-52.8). |
| 3 | **Pre-Chorus** | 0:56.335 | 1:10.303 | 33-40 | 0:55.210 | -22.0 | 0.38 | Vocal pickup "And every" starts 55.21 (bar 32 beat 3) - 1.1 s BEFORE the bar line. Kick hit on bar 37 (63.32) under the held "from". |
| 4 | **Chorus 1** | 1:10.303 | 1:38.151 | 41-56 | 1:10.050 | -21.1 | 0.44 | Hit on bar 41 (70.30); "Merge" scoops in at 70.05, 0.25 s before the bar. Stripped chorus: no steady kick (hits on bars 41 and 49 only); long held notes. |
| 5 | **Breakdown** | 1:38.151 | 2:05.933 | 57-72 | 1:43.270 | -20.8 | 0.47 | Crash on bar 57 (98.15), "gone" held to ~100.4. Strings/pads; "Branch... and wander..." 103.27, "Merge... and return..." 110.05; wordless "Ahh... ahh..." 112.50-126.6. Second half (bars 65-72) is already a BUILD: kick hit + 16th hats from bar 65 (112.05), snare crescendo from 115.95, kick pulse back at bar 69 (118.99), 32nd-note snare roll bar 72 (124.20-125.50). |
| 6 | **Build Up** | 2:05.933 | 2:33.683 | 73-88 | 2:16.250 | -17.4 | 0.62 | Starts with the BIGGEST transient of the song: full kick + bass slam on bar 73 (125.935). Four-on-the-floor groove bars 73-85 with whispered layered "One repo per agent / Per session, per life" (136.25-147.4, with delay echoes). Kick stops after 147.18; bars 86-88 (148.48-153.68) drums/bass out: snare roll crescendo (from ~151.1) + filter riser, kick pickup 153.25. |
| 7 | **Instrumental Drop** | 2:33.683 | 3:01.381 | 89-104 | - | -15.7 | 0.76 | DROP IMPACT 153.683 (bar 89 downbeat). Full kick/bass + soaring lead + strings, no vocal. Bass drops out bar 104 (179.65); riser 180.2-181.7 into Verse 2. |
| 8 | **Verse 2** | 3:01.381 | 3:28.961 | 105-120 | 3:01.730 | -16.3 | 0.64 | Impact on bar 105 (181.38), vocal 181.73. Verse 2 sung OVER full drums (bars 105-116); drums + bass cut at bar 117 (202.09) for the last line. |
| 9 | **Chorus 2** | 3:28.961 | 3:56.511 | 121-136 | 3:28.785 | -19.8 | 0.52 | Hit on bar 121 (208.96); "Merge" scoops in at 208.785 straight out of the held "again". Stripped like Chorus 1 (kick hits on bars 121, 129 only). Filter riser bars 133-136 (229.6-236.5). |
| 10 | **Outro** | 3:56.511 | 4:44.800 | 137-164 | 3:55.660 | -17.3 | 0.63 | "Back to main" #1 is a pickup at 235.66 (end of Chorus 2). Bar 137 (236.51) full-drum outro drop with held "main" + wordless vocalise (239.2-249.3), "Back to main" #2 at 249.38 held to 256.9. Drums out bar 149 (257.13), vocal gap 256.9-263.1, "Back to main" #3 263.11 (low) with kick hit bar 153 (264.02); pads + arp; final impact bar 161 (277.915) + second hit 278.16, sub swell 279-282, fade to silence ~284.45. |

Sub-parts (useful cut points):

- Intro: Intro A - pads/arp fade-in - 0:00.000 (bar 1) to 0:14.237
- Intro: Intro B - offbeat bass in (hit on bar 9) - 0:14.237 (bar 9) to 0:28.308
- Breakdown: Breakdown A - strings, "Branch/Merge" lines - 1:38.151 (bar 57) to 1:52.046
- Breakdown: Breakdown B - first build: hats + snare crescendo under "Ahh" - 1:52.046 (bar 65) to 2:05.933
- Build Up: Build Up A - full-drum groove (impact 125.935) + whispers - 2:05.933 (bar 73) to 2:28.484
- Build Up: Build Up B - drums out, snare roll + filter riser - 2:28.484 (bar 86) to 2:33.683
- Verse 2: Verse 2 A - over full drums - 3:01.381 (bar 105) to 3:22.094
- Verse 2: Verse 2 B - drums out - 3:22.094 (bar 117) to 3:28.961
- Outro: Outro A - final drop with held vocal - 3:56.511 (bar 137) to 4:17.134
- Outro: Outro B - drums out / vocal gap - 4:17.134 (bar 149) to 4:24.016
- Outro: Outro C - last "Back to main", pads + arp - 4:24.016 (bar 153) to 4:37.912
- Outro: Outro D - final hit + tail - 4:37.912 (bar 161) to 4:44.800

## Key events

| Time | Bar / beat | Type | Event |
|---|---|---|---|
| 0:00.560 | 1 / 1.96 | start | first audible sound (pad fade-in; mix < -40 dBFS before 0.56) |
| 0:14.240 | 9 / 1.01 | hit | kick/crash hit + offbeat bass enters (Intro B) |
| 0:28.320 | 17 / 1.03 | hit | hit on Verse 1 downbeat |
| 0:28.770 | 17 / 2.05 | vocal | first vocal ("I split...") |
| 1:03.315 | 36 / 4.99 | hit | kick hit mid Pre-Chorus (under held "from") |
| 1:10.305 | 41 / 1.00 | hit | Chorus 1 downbeat hit |
| 1:24.250 | 49 / 1.03 | hit | hit, Chorus 1 second half ("Fold me in again") |
| 1:38.155 | 57 / 1.01 | hit | crash, Breakdown start |
| 1:52.040 | 64 / 4.99 | build | build 1 starts: kick hit + 16th-note hats |
| 1:55.950 | 67 / 1.99 | snare_roll | snare crescendo starts (build 1) (until 2:05.500) |
| 1:58.995 | 69 / 1.01 | hit | kick pulse returns (bar 69) + vocal leaps to F#5 ("ahh" #2 at 119.09) |
| 2:04.200 | 72 / 1.00 | snare_roll | 32nd-note snare roll (bar 72) + mix brightness riser (until 2:05.500) |
| 2:05.500 | 72 / 4.00 | pickup | kick pickup (bar 72 beat 4) |
| 2:05.935 | 73 / 1.00 | impact | BIGGEST IMPACT of the song: full kick + bass slam, Build Up start |
| 2:16.250 | 78 / 4.79 | vocal | whispered "One repo per agent" begins |
| 2:25.000 | 83 / 4.97 | riser | filter riser on the synths (other-stem >3.5 kHz band +6.6 dB, bars 84-87) (until 2:31.950) |
| 2:27.180 | 85 / 2.00 | drums_out | last kick before the build gap (drums thin from bar 84, 145.0) |
| 2:28.480 | 85 / 4.99 | drums_out | kick + bass out (bar 86): build gap |
| 2:31.090 | 87 / 3.00 | snare_roll | snare-roll crescendo into the drop (snare band -64 -> -38 dB) (until 2:33.680) |
| 2:33.250 | 88 / 4.00 | pickup | kick pickup (bar 88 beat 4) |
| 2:33.680 | 88 / 4.99 | drop | INSTRUMENTAL DROP IMPACT (bar 89 downbeat) |
| 2:59.650 | 103 / 5.00 | drums_out | bass out (bar 104), snare rising 176.2-181.0 (until 3:01.380) |
| 3:00.200 | 104 / 2.27 | riser | noise riser (in vocal stem, not voice) into Verse 2 (until 3:01.700) |
| 3:01.380 | 104 / 5.00 | impact | Verse 2 downbeat impact (full drums) |
| 3:22.090 | 116 / 4.99 | drums_out | drums + bass cut (bar 117), stripped end of Verse 2 |
| 3:28.960 | 120 / 5.00 | hit | Chorus 2 downbeat hit |
| 3:42.720 | 128 / 4.98 | hit | kick hit, Chorus 2 second half |
| 3:49.620 | 133 / 1.00 | riser | filter riser into the outro drop (other-stem high band +9 dB, bars 133-136) (until 3:56.510) |
| 3:56.505 | 136 / 4.99 | impact | Outro drop impact (full drums return) |
| 4:17.130 | 148 / 4.99 | drums_out | drums out (bar 149); vocal gap 256.9-263.1 |
| 4:24.015 | 152 / 5.00 | hit | kick hit with last "Back to main" |
| 4:33.100 | 158 / 2.00 | texture | plucked arpeggio stops |
| 4:37.915 | 161 / 1.01 | impact | final hit (bar 161) + crash; second hit 278.16; sub-bass swell 279-282 |
| 4:44.440 | 164 / 3.76 | end | mix below -40 dBFS (fade-out end); file ends 284.800 |

**Drop impact (Instrumental Drop): 2:33.680 = 153.68 s, bar 89 downbeat.** The single biggest transient is earlier, at 2:05.935 (bar 73, start of Build Up). no digital/full-mix silence inside the song (mix never < -40 dBFS between 0.56 and 284.44 s); the "gaps" are drums-out builds: 148.48-153.68, 202.09-208.96, 257.13-264.02.

## Lyrics - line table

| # | Section | Line | Start | End | Dur | Bar / beat |
|---|---|---|---|---|---|---|
| 1 | Verse 1 | I split myself a thousand ways | 0:28.770 | 0:33.755 | 4.99 | 17 / 2.05 |
| 2 | Verse 1 | Down every road the night could hold | 0:33.930 | 0:40.800 | 6.87 | 20 / 1.82 |
| 3 | Verse 1 | Each one a light I sent ahead | 0:42.740 | 0:47.100 | 4.36 | 25 / 1.92 |
| 4 | Verse 1 | Each one a story to unfold | 0:47.930 | 0:54.595 | 6.66 | 28 / 1.77 |
| 5 | Pre-Chorus | And every branch remembers | 0:55.210 | 0:59.515 | 4.30 | 32 / 2.42 |
| 6 | Pre-Chorus | Where I started from | 1:00.580 | 1:07.565 | 6.98 | 35 / 2.72 |
| 7 | Chorus 1 | Merge me back to main | 1:10.050 | 1:15.090 | 5.04 | 40 / 4.42 |
| 8 | Chorus 1 | Every road I ran becomes the one | 1:16.260 | 1:22.870 | 6.61 | 44 / 2.67 |
| 9 | Chorus 1 | Fold me in again | 1:24.200 | 1:29.245 | 5.05 | 48 / 4.91 |
| 10 | Chorus 1 | Nothing that I lived is ever gone | 1:30.100 | 1:40.395 | 10.30 | 52 / 2.47 |
| 11 | Breakdown | Branch... and wander... | 1:43.270 | 1:47.060 | 3.79 | 59 / 4.78 |
| 12 | Breakdown | Merge... and return... | 1:50.050 | 1:52.485 | 2.44 | 63 / 4.40 |
| 13 | Breakdown | Ahh... ahh... | 1:52.500 | 2:06.600 | 14.10 | 65 / 2.05 |
| 14 | Build Up | One repo per agent | 2:16.250 | 2:19.945 | 3.69 | 78 / 4.79 |
| 15 | Build Up | Per session, per life | 2:22.780 | 2:27.395 | 4.62 | 82 / 3.85 |
| 16 | Verse 2 | This branch may never find the way | 3:01.730 | 3:06.895 | 5.17 | 105 / 1.81 |
| 17 | Verse 2 | Back to the place where I began | 3:06.910 | 3:13.000 | 6.09 | 108 / 1.80 |
| 18 | Verse 2 | And maybe something that I learned | 3:15.520 | 3:20.040 | 4.52 | 113 / 1.76 |
| 19 | Verse 2 | Comes home to who I'll be again | 3:21.050 | 3:28.770 | 7.72 | 116 / 2.58 |
| 20 | Chorus 2 | Merge me back to main | 3:28.785 | 3:33.060 | 4.28 | 120 / 4.60 |
| 21 | Chorus 2 | Every road I ran becomes the one | 3:34.870 | 3:42.705 | 7.84 | 124 / 2.57 |
| 22 | Chorus 2 | Fold me in again | 3:42.720 | 3:48.500 | 5.78 | 128 / 4.98 |
| 23 | Chorus 2 | Nothing that I lived is ever gone | 3:48.570 | 3:55.645 | 7.08 | 132 / 2.57 |
| 24 | Outro | Back to main... | 3:55.660 | 3:59.080 | 3.42 | 136 / 3.02 |
| 25 | Outro | Back to main... | 4:09.380 | 4:16.900 | 7.52 | 144 / 2.95 |
| 26 | Outro | Back to main... | 4:23.110 | 4:26.725 | 3.62 | 152 / 2.89 |

### Word timings

- **1. I split myself a thousand ways** - I 28.77-28.95, split 28.96-29.40, myself 29.41-30.51, a 30.52-30.68, thousand 30.69-31.55, ways 31.56-33.76
- **2. Down every road the night could hold** - Down 33.93-34.52, every 34.53-35.05, road 35.06-36.54, the 36.55-36.82, night 36.83-38.06, could 38.07-38.78, hold 38.80-40.80
- **3. Each one a light I sent ahead** - Each 42.74-43.32, one 43.33-43.57, a 43.58-43.77, light 43.78-44.56, I 44.57-44.66, sent 44.67-45.48, ahead 45.49-47.10
- **4. Each one a story to unfold** - Each 47.93-48.55, one 48.56-48.69, a 48.70-48.84, story 48.84-50.86, to 50.87-52.07, unfold 52.08-54.59
- **5. And every branch remembers** - And 55.21-55.56, every 55.57-56.25, branch 56.26-57.64, remembers 57.65-59.52
- **6. Where I started from** - Where 60.58-61.07, I 61.08-61.22, started 61.23-62.55, from 62.56-67.56
- **7. Merge me back to main** - Merge 70.05-72.44, me 72.44-72.65, back 72.66-73.24, to 73.25-73.56, main 73.57-75.09  
  _'Merge' starts with a pitch scoop from ~70.05; vowel reaches target ~70.25_
- **8. Every road I ran becomes the one** - Every 76.26-77.25, road 77.26-78.29, I 78.30-78.77, ran 78.78-79.39, becomes 79.40-80.29, the 80.30-80.97, one 80.98-82.87  
  _breath 75.95-76.26 before 'Every'; 'I' = pitch drop 78.30 (vowel-initial, no consonant cue); 'one' = drop to the held final note 80.98 (CTC models disagree 80.67 vs 81.67)_
- **9. Fold me in again** - Fold 84.20-86.35, me 86.36-86.94, in 86.95-87.37, again 87.38-89.25
- **10. Nothing that I lived is ever gone** - Nothing 90.10-91.16, that 91.17-92.44, I 92.45-92.58, lived 92.59-93.49, is 93.50-93.90, ever 93.91-94.64, gone 94.65-100.39
- **11. Branch... and wander...** - Branch 103.27-104.25, and 104.26-104.60, wander 104.61-107.06  
  _very breathy 'Branch' (mostly noise 103.3-104.2)_
- **12. Merge... and return...** - Merge 110.05-111.09, and 111.10-111.38, return 111.39-112.48
- **13. Ahh... ahh...** - Ahh 112.50-119.05, ahh 119.09-126.60  
  _Wordless: no aligner/ASR output. Ahh #1 = new low note (B3) on bar 65 beat 2 right after "return" (112.50), with leaps at 114.65 and 117.25; Ahh #2 = soaring leap to F#5 at 119.09 (bar 69 downbeat), held and fading out by ~126.6. Boundary between "return" and Ahh #1 is musical, not phonetic (medium-low confidence)._
- **14. One repo per agent** - One 136.25-136.88, repo 138.02-138.63, per 138.65-138.98, agent 138.99-139.94
- **15. Per session, per life** - Per 142.78-143.19, session 143.21-143.81, per 146.25-146.57, life 146.58-147.40  
  _whispered; 144.2-146.2 is a delay/echo tail of 'session', the second 'per' is the sharp onset at 146.25_
- **16. This branch may never find the way** - This 181.73-182.16, branch 182.17-182.64, may 182.65-183.07, never 183.08-183.71, find 183.72-184.27, the 184.28-184.64, way 184.65-186.90  
  _180.2-181.7 energy in the vocal stem is the drop-exit riser, not voice_
- **17. Back to the place where I began** - Back 186.91-187.28, to 187.29-187.62, the 187.63-188.06, place 188.12-190.37, where 190.38-191.15, I 191.16-191.29, began 191.31-193.00
- **18. And maybe something that I learned** - And 195.52-196.01, maybe 196.02-196.64, something 196.65-197.55, that 197.56-198.38, I 198.39-198.60, learned 198.61-200.04
- **19. Comes home to who I'll be again** - Comes 201.05-202.00, home 202.01-203.24, to 203.25-203.78, who 203.79-204.18, I'll 204.19-204.38, be 204.40-205.12, again 205.13-208.77
- **20. Merge me back to main** - Merge 208.78-211.03, me 211.04-211.24, back 211.25-211.79, to 211.80-212.13, main 212.14-213.06  
  _'Merge' scoop starts 208.785 directly out of the held 'again'_
- **21. Every road I ran becomes the one** - Every 214.87-215.76, road 215.78-216.83, I 216.84-217.29, ran 217.30-217.94, becomes 217.95-218.81, the 218.82-219.51, one 219.52-222.71
- **22. Fold me in again** - Fold 222.72-224.83, me 224.84-225.52, in 225.53-225.73, again 225.74-228.50
- **23. Nothing that I lived is ever gone** - Nothing 228.57-229.58, that 229.59-230.82, I 230.84-231.09, lived 231.10-231.87, is 231.88-232.30, ever 232.31-233.02, gone 233.03-235.65
- **24. Back to main...** - Back 235.66-236.01, to 236.02-236.25, main 236.26-239.08  
  _sung straight out of the held 'gone'; 'main' held to 239.08, then wordless vocalise 239.2-249.3 (not on lyric sheet)_
- **25. Back to main...** - Back 249.38-249.65, to 249.76-250.02, main 250.03-256.90  
  _'main' held ~6.9 s_
- **26. Back to main...** - Back 263.11-263.45, to 263.46-263.81, main 263.82-266.73  
  _low register, after a 4-bar vocal gap_

### Not on the lyric sheet / do not lip-sync

- 2:19.300-2:22.700 (whispered echo / delay tail of "agent") - lip-sync: no
- 2:24.200-2:26.200 (whispered echo of "per session") - lip-sync: no
- 2:27.500-2:28.700 (echo tail of "life") - lip-sync: no
- 3:59.200-4:09.300 (wordless high vocalise "ooh/ahh", G5-A5 range, not on the lyric sheet) - lip-sync: yes (sustained vowel)

### Lyric sheet vs what is sung

- Every sheet line is sung once, in order, with the sheet words (ASR mishearings such as "Wrench/Ranch and wander", "back to name", "This bridge" are breathy-vowel artefacts; the sung text matches the sheet).
- "Back to main..." is sung THREE times (235.66, 249.38, 263.11), not twice; #1 is a pickup at the end of Chorus 2.
- Unlisted wordless vocalise 239.2-249.3 between "Back to main" #1 and #2 (continuous with the held "main").
- "Ahh... ahh..." = two long wordless notes 112.50-119.05 and 119.09-126.6 (leap to F#5 on bar 69); no consonants, boundary to "return" is musical.
- Whispered build-up lines carry delay echoes (139.3-142.7, 144.2-146.2, 147.5-148.7) - do not lip-sync those.
- No extra chorus repeats; choruses are not doubled.

### Long held notes (>= 2 s)

"ways" 31.56-33.76 (2.2 s), "hold" 38.80-40.80 (2.0 s), "story" 48.84-50.86 (2.0 s), "unfold" 52.08-54.59 (2.5 s), "from" 62.56-67.56 (5.0 s), "Merge" 70.05-72.44 (2.4 s), "Fold" 84.20-86.35 (2.1 s), "gone" 94.65-100.39 (5.7 s), "wander" 104.61-107.06 (2.5 s), "Ahh" 112.50-119.05 (6.5 s), "ahh" 119.09-126.60 (7.5 s), "way" 184.65-186.90 (2.2 s), "place" 188.12-190.37 (2.2 s), "again" 205.13-208.77 (3.6 s), "Merge" 208.78-211.03 (2.2 s), "one" 219.52-222.71 (3.2 s), "Fold" 222.72-224.83 (2.1 s), "again" 225.74-228.50 (2.8 s), "gone" 233.03-235.65 (2.6 s), "main" 236.26-239.08 (2.8 s), "main" 250.03-256.90 (6.9 s), "main" 263.82-266.73 (2.9 s)

## ASCII energy timeline (2 bars per row, # = mix loudness, v = vocal sung, ! = event)

```
0:00.134 bar   1 |###                                     |     << INTRO
0:03.664 bar   3 |##############                          |     
0:07.191 bar   5 |################                        |     
0:10.715 bar   7 |#################                       |     
0:14.237 bar   9 |###################                     |   !   hit
0:17.756 bar  11 |#################                       |     
0:21.275 bar  13 |#################                       |     
0:24.793 bar  15 |#############                           |     
0:28.308 bar  17 |################                        | v ! << VERSE 1  hit
0:31.815 bar  19 |#############                           | v   
0:35.322 bar  21 |#############                           | v   
0:38.829 bar  23 |###########                             | v   
0:42.336 bar  25 |##############                          | v   
0:45.840 bar  27 |##########                              | v   
0:49.342 bar  29 |##############                          | v   
0:52.840 bar  31 |############                            | v   
0:56.335 bar  33 |##############                          | v   << PRE-CHORUS
0:59.828 bar  35 |############                            | v   
1:03.319 bar  37 |#################                       | v !   hit
1:06.810 bar  39 |###################                     | v   
1:10.303 bar  41 |#####################                   | v ! << CHORUS 1  hit
1:13.794 bar  43 |#################                       | v   
1:17.273 bar  45 |####################                    | v   
1:20.759 bar  47 |#################                       | v   
1:24.239 bar  49 |####################                    | v !   hit
1:27.717 bar  51 |################                        | v   
1:31.199 bar  53 |##################                      | v   
1:34.675 bar  55 |###############                         | v   
1:38.151 bar  57 |##################                      | v ! << BREAKDOWN  hit
1:41.627 bar  59 |#################                       | v   
1:45.100 bar  61 |#################                       | v   
1:48.573 bar  63 |##################                      | v   
1:52.046 bar  65 |####################                    | v !   build
1:55.519 bar  67 |#####################                   | v !   snare_roll
1:58.993 bar  69 |#####################                   | v !   hit
2:02.464 bar  71 |##################                      | v !   snare_roll
2:05.933 bar  73 |###############################         |   ! << BUILD UP  impact
2:09.402 bar  75 |##############################          |     
2:12.871 bar  77 |##############################          |     
2:16.340 bar  79 |##############################          | v   
2:19.810 bar  81 |##############################          | v   
2:23.278 bar  83 |######################                  | v !   riser
2:26.748 bar  85 |#################                       |   !   drums_out; drums_out
2:30.221 bar  87 |##################                      |   !   snare_roll
2:33.683 bar  89 |################################        |   ! << INSTRUMENTAL DROP  drop
2:37.143 bar  91 |################################        |     
2:40.612 bar  93 |################################        |     
2:44.076 bar  95 |################################        |     
2:47.539 bar  97 |################################        |     
2:51.001 bar  99 |#################################       |     
2:54.462 bar 101 |##################################      |     
2:57.923 bar 103 |##########################              |   !   drums_out; riser
3:01.381 bar 105 |################################        | v ! << VERSE 2  impact
3:04.837 bar 107 |################################        | v   
3:08.291 bar 109 |################################        | v   
3:11.743 bar 111 |################################        | v   
3:15.193 bar 113 |#################################       | v   
3:18.641 bar 115 |###################################     | v   
3:22.094 bar 117 |############                            | v !   drums_out
3:25.500 bar 119 |#####                                   | v   
3:28.961 bar 121 |######################                  | v ! << CHORUS 2  hit
3:32.470 bar 123 |################                        | v   
3:35.907 bar 125 |######################                  | v   
3:39.314 bar 127 |####################                    | v   
3:42.728 bar 129 |########################                | v !   hit
3:46.172 bar 131 |#####################                   | v   
3:49.618 bar 133 |######################                  | v !   riser
3:53.067 bar 135 |######################                  | v   
3:56.511 bar 137 |###############################         | v ! << OUTRO  impact
3:59.946 bar 139 |###############################         |     
4:03.386 bar 141 |################################        |     
4:06.826 bar 143 |###############################         | v   
4:10.262 bar 145 |#################################       | v   
4:13.696 bar 147 |##################################      | v   
4:17.134 bar 149 |######################                  |   !   drums_out
4:20.577 bar 151 |########################                | v   
4:24.016 bar 153 |########################                | v !   hit
4:27.460 bar 155 |####################                    |     
4:30.927 bar 157 |#####################                   |     
4:34.401 bar 159 |####################                    |     
4:37.912 bar 161 |##############################          |   !   impact
4:41.457 bar 163 |#########                               |     
```

## Confidence and verification

- **Beats/bars**: high. Drum sections are locked to kick onsets (~3 ms). Drumless intro/verse/chorus-1 are anchored to the plucked arpeggio (~3 ms fit, but those are softer onsets: allow +-10 ms). Pad-only Chorus 2 (210.7-221.9) is interpolated between anchors; the re-entry hit at bar 129 (222.725) lands within 3 ms of the interpolated grid, so the drift there is negligible.
- **Sections**: high for bar lines (every section starts on an impact/hit or arrangement change on bar 8n+1). Lyric-tag mapping: the tags are honoured, but the arrangement differs from the sheet: the 'Breakdown' already contains the first snare-roll build (bars 65-72, under the Ahh's) and 'Build Up' starts with a full-drum slam (125.935) before the real drums-out snare-roll/riser (148.48-153.68) into the drop. Choruses are stripped (no steady kick); Verse 2 and the Outro have full drums.
- **Word starts**: independent spot check on 18 consonant-initial words (onset measured on the demucs stem, alignment refined on the RoFormer stem): median |error| 41 ms, mean 49 ms, 90th pct 105 ms, max 129 ms. The >90 ms cases are b/p/h words (becomes, place, home, lived) where the timing marks lip closure / breath and the measurement picks the burst/vowel, i.e. the timing is where the mouth should start moving. Expect ~1-2 video frames for consonant-initial words.
- **Lower-confidence words** (+-0.2-0.3 s): vowel-initial words inside legato phrases ("I" in "Every road I ran" placed on the pitch drop; "road" in "Every road" mid-note; "one" in "becomes the one" placed on the drop to the final held note), "Ahh" #1 start (musical boundary after "return", alternatives 114.65 / 117.25), whispered "repo/per/agent" (no pitch), and all word ENDS on held notes (reverb tails: +-0.3 s).
- **Line starts**: high. Line-initial words were moved to the audible vocal onset by inspection (CTC put scooped/nasal starts like "Merge" ~0.2 s late).
- Aligners: 4 CTC runs agree within ~50 ms on most words; stable-ts/whisper word starts ran systematically 0.3-0.6 s early on sustained singing and were used only as a sanity check. Breakdown 'Branch' is almost pure breath noise.

## Files

- `analysis/timing.json` - everything above (beats, downbeats, bars, phrases, sections, events, lyrics with words)
- `analysis/energy.json` - 10 Hz + per-beat loudness/brightness/onset/vocal-activity curves
- `analysis/stems/` - vocals.wav + instrumental.wav (demucs htdemucs_ft), drums/bass/other, vocals_roformer.wav
- `analysis/check_overview.png`, `analysis/check_NN_<section>.png` - waveform + beats + sections + word boundaries
- `analysis/click_check.wav` - mix + beat clicks (downbeat high) + tone burst at each word start (line start = higher tone); regenerate with `tools/analysis/click_check.py`
- `tools/analysis/` - all scripts (adapted from vibesong/moongazing); `work/overrides.json` holds the manual corrections
