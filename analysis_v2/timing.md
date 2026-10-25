# Merge (v2 of Merge Me Back to Main) - timing map

Source: `inputs/Merge.wav` (48 kHz stereo, 282.516 s). All times are seconds from the first sample (mm:ss.mmm). **Different song render from v1 (`analysis/`): not sample-identical anywhere; see `analysis_v2/NOTES.md` for the old->new time map.**

## Tempo / key / grid

- **Tempo: 138.00 BPM, CONSTANT** (v1 drifted 136 -> 139.5). Kick onsets fit one straight line to ~2.6 ms rms; the best constant grid is within 3.8 ms of beats[]; a 135 BPM grid drifts 6.19 s. Still cut on `beat_grid.beats` / `bars` in timing.json.
- 4/4, bar 1 beat 1 = 0.126 s, 163 bars (bar 163 incomplete). Every section starts on an 8-bar phrase line (bar 8n+1); same bar numbers as v1.
- Grid accuracy: kick onsets vs grid 2.8 ms rms (p95 5.1 ms); drumless sections anchored on the plucked-arp onsets (2.3 ms rms). Interpolated (no pulse) 15.3-20.1, 56.6-61.9, 202.7-221.9, 224.0-235.8, 265.8-278.8 s; extrapolated after 278.8 s.
- **Key: B minor** (as v1). The chorus leans on the relative D major. No modulation.

## Sections

| # | Section | Start | End | Bars | Vocal starts | Loudness dB | Energy 0-1 | Notes |
|---|---|---|---|---|---|---|---|---|
| 1 | **Intro** | 0:00.000 | 0:27.948 | 1-16 | - | -20.3 | 0.48 | Pads + plucked arp fading in with an opening filter (mix > -40 dBFS from 0.44 s; brightness 840 -> 2300 Hz over bars 1-6). Bar 5 (7.08): soft hat/snare pattern enters. Bar 9 (14.05): kick hit + rolling bass (bass already from bar 7 beat 3, 11.4). Bars 13-16: bass out, pads; a sustained low tone (~D4) in both vocal stems swells 23.2 -> 28.5 (see adlibs). No lyric. |
| 2 | **Verse 1** | 0:27.948 | 0:55.773 | 17-32 | 0:28.540 | -20.9 | 0.45 | Kick/bass hit on bar 17 (27.97); soft low vocal starts 28.54 (bar 17 beat 2.4). No steady drums. Bass under the verse. |
| 3 | **Pre-Chorus** | 0:55.773 | 1:09.686 | 33-40 | 0:54.660 | -20.5 | 0.48 | Vocal pickup "And every" starts 54.66 (bar 32 beat 2.5) - 1.1 s BEFORE the bar line. Bass out from bar 34 beat 4. Kick hit on bar 37 (62.72) under the held "from"; filter riser 64.9 -> 69.7 (bars 38-40). |
| 4 | **Chorus 1** | 1:09.686 | 1:37.513 | 41-56 | 1:09.420 | -19.6 | 0.54 | Hit on bar 41 (69.685); "Merge" scoops in at 69.42, 0.27 s before the bar. Stripped chorus: no steady kick; one more kick hit at 89.80 (bar 52, under "Nothing"). Bass bars 41-53, out from bar 54. Last line now "Nothing that I lived can come undone" ("undone" held to ~99.9). |
| 5 | **Breakdown** | 1:37.513 | 2:05.341 | 57-72 | 1:42.650 | -19.6 | 0.53 | Hit/crash on bar 57 (97.515). Strings/pads; "Branch... and wander..." 102.65, "Merge... and return..." 109.43; wordless "Ahh... ahh..." 111.87-125.9. Second half (bars 65-72) is a BUILD: kick hit + 16th hats from bar 65 (111.42), snare crescendo from 116.64, 32nd-note snare roll bar 72 (123.49-124.92). Same arrangement as v1, ~0.6 s earlier. |
| 6 | **Build Up** | 2:05.341 | 2:33.167 | 73-88 | - | -15.3 | 0.73 | Full kick + bass slam on bar 73 (125.34, strongest bar-line onset of the song). Four-on-the-floor groove bars 73-85, NO VOCAL (the v1 whispered "One repo per agent / Per session, per life" is gone; RoFormer vocal stem < -50 dB 127-172 s). Bar 86 (147.95): bass out, kick fades (-14 -> -40 dB) while snare/hats continue; mix brightens (riser) into the drop. Unlike v1 there is no full drums-out gap. |
| 7 | **Instrumental Drop** | 2:33.167 | 3:00.992 | 89-104 | - | -14.4 | 0.81 | DROP IMPACT 153.17 (bar 89 downbeat). Full kick/bass + lead + strings. NEW in v2: a sustained wordless "ooh" layer in the vocal stems 173.08-180.9 (bars 100-104, no consonants; adlib, not a lyric). Bass out bar 104 beat 3 (178.6); 16th snare fill 179.68-180.99 into Verse 2. |
| 8 | **Verse 2** | 3:00.992 | 3:28.817 | 105-120 | 3:02.000 | -15.6 | 0.66 | Impact on bar 105 (180.99), vocal 182.00. Improvised high melody (high notes on THE 185.30, I 190.57, THAT 197.12 held to 198.1, BE 204.38). Sung OVER full drums bars 105-116; drums + bass cut at bar 117 (201.86) for the last line. |
| 9 | **Chorus 2** | 3:28.817 | 3:56.643 | 121-136 | 3:28.130 | -20.6 | 0.42 | NO hit on bar 121 (208.82): pads only, no kick and no bass until bar 129. "Merge" scoops in at 208.13 out of the held "again"; "ME" emphasised (210.96). Kick/snare pickup 222.48 -> hit + bass return on bar 129 (222.73). Filter riser bars 135-136 (233.2-236.6). Last line now "Every life I've lived, I have become". |
| 10 | **Outro** | 3:56.643 | 4:42.516 | 137-163 | 3:55.750 | -15.8 | 0.69 | "Back to main" #1 is a pickup at 235.75 (end of Chorus 2). Bar 137 (236.64) full-drum outro drop; "main" held to 238.65 + wordless vocalise 238.66-248.97; "Back to main" #2 at 249.44, "main" held to ~255.9. Drums + bass out bar 149 (257.51): arp alone. Riser into bar 153: kick + bass hit 264.465, arp stops, then pads + bass sustain, fade to < -40 dBFS at 282.45. Only TWO "Back to main" (v1 had a third, low one) and NO final hit at bar 161 (v1 had one). |

Sub-parts (useful cut points):

- Intro: Intro A - pads/arp fade-in, hat pattern from bar 5 - 0:00.000 (bar 1) to 0:14.036
- Intro: Intro B - kick hit + rolling bass (bar 9), pads from bar 13 - 0:14.036 (bar 9) to 0:27.948
- Breakdown: Breakdown A - strings, "Branch/Merge" lines - 1:37.513 (bar 57) to 1:51.427
- Breakdown: Breakdown B - first build: hats + snare crescendo under "Ahh" - 1:51.427 (bar 65) to 2:05.341
- Build Up: Build Up A - full-drum groove (impact 125.34), no vocal - 2:05.341 (bar 73) to 2:27.949
- Build Up: Build Up B - bass out, kick fading, snare build + riser - 2:27.949 (bar 86) to 2:33.167
- Verse 2: Verse 2 A - over full drums - 3:00.992 (bar 105) to 3:21.861
- Verse 2: Verse 2 B - drums out - 3:21.861 (bar 117) to 3:28.817
- Outro: Outro A - final drop with held vocal - 3:56.643 (bar 137) to 4:17.512
- Outro: Outro B - drums out, arp alone - 4:17.512 (bar 149) to 4:24.469
- Outro: Outro C - last hit, pads + bass, fade - 4:24.469 (bar 153) to 4:42.516

## Key events

| Time | Bar / beat | Type | Event |
|---|---|---|---|
| 0:00.440 | 1 / 1.72 | start | first audible sound (pad/arp fade-in; mix < -40 dBFS before 0.44) |
| 0:07.080 | 4 / 5.00 | build | soft hat/snare pattern enters (bar 5) |
| 0:14.050 | 9 / 1.03 | hit | kick hit + rolling bass (Intro B) |
| 0:23.200 | 14 / 2.08 | texture | sustained low tone in the vocal stems begins (swells to -31 dB by 26.6; see adlibs) |
| 0:27.970 | 17 / 1.05 | hit | kick/bass hit on Verse 1 downbeat |
| 0:28.540 | 17 / 2.36 | vocal | first vocal ("I split...") |
| 1:02.720 | 36 / 4.98 | hit | kick hit mid Pre-Chorus (under held "from") |
| 1:04.900 | 38 / 1.99 | riser | filter riser into Chorus 1 (other-stem >3.5 kHz band +10 dB, centroid 1.9 -> 3.4 kHz) (until 1:09.690) |
| 1:09.685 | 40 / 5.00 | hit | Chorus 1 downbeat hit |
| 1:29.800 | 52 / 3.26 | hit | kick hit, Chorus 1 second half (under "Nothing") |
| 1:37.515 | 57 / 1.00 | hit | crash, Breakdown start |
| 1:51.420 | 64 / 4.98 | build | build 1 starts: kick hit + 16th-note hats |
| 1:56.640 | 67 / 4.99 | snare_roll | snare crescendo starts (build 1, snare band -47 -> -30 dB) (until 2:04.920) |
| 1:58.385 | 69 / 1.00 | hit | kick pulse returns (bar 69) + vocal leaps to F#5 ("ahh" #2 at 118.36) |
| 2:03.490 | 71 / 4.74 | snare_roll | 32nd-note snare roll (bar 72) (until 2:04.920) |
| 2:05.340 | 72 / 5.00 | impact | BIGGEST bar-line impact: full kick + bass slam, Build Up start |
| 2:27.500 | 85 / 3.97 | riser | mix brightening into the drop (centroid 3.3 -> 4.2 kHz) (until 2:33.170) |
| 2:27.950 | 86 / 1.00 | drums_out | bass out (bar 86); kick fades -14 -> -40 dB, snare/hats continue |
| 2:31.220 | 87 / 4.52 | snare_roll | snare build (16ths, -31 -> -25 dB) into the drop (until 2:33.170) |
| 2:33.170 | 89 / 1.01 | drop | INSTRUMENTAL DROP IMPACT (bar 89 downbeat) |
| 2:53.080 | 100 / 2.80 | texture | wordless sustained "ooh" layer in the vocal stems (not a lyric) (until 3:00.900) |
| 2:58.600 | 103 / 3.50 | drums_out | bass out (bar 104 beat 3) (until 3:00.990) |
| 2:59.680 | 104 / 1.98 | snare_roll | 16th-note snare fill into Verse 2 (until 3:00.990) |
| 3:00.990 | 104 / 5.00 | impact | Verse 2 downbeat impact (full drums) |
| 3:21.860 | 116 / 5.00 | drums_out | drums + bass cut (bar 117), stripped end of Verse 2 |
| 3:28.820 | 121 / 1.01 | texture | Chorus 2 downbeat with NO hit: pads only (no kick/bass until bar 129) |
| 3:40.990 | 127 / 5.00 | riser | high-band riser into bar 129 (other-stem >3.5 kHz +9 dB) (until 3:42.730) |
| 3:42.480 | 128 / 4.43 | pickup | kick/snare pickup (bar 128 beat 4) |
| 3:42.730 | 129 / 1.00 | hit | hit + bass returns, Chorus 2 second half |
| 3:53.160 | 134 / 4.99 | riser | filter riser into the outro drop (other-stem high band +10 dB, bars 135-136) (until 3:56.640) |
| 3:56.180 | 136 / 3.94 | pickup | snare pickup (bar 136 beat 4) |
| 3:56.640 | 136 / 4.99 | impact | Outro drop impact (full drums return) |
| 4:17.510 | 148 / 4.99 | drums_out | drums + bass out (bar 149); arp alone, vocal ended ~255.9 |
| 4:23.160 | 152 / 1.99 | riser | riser into the last hit (high band +12 dB) (until 4:24.470) |
| 4:24.465 | 152 / 4.99 | impact | last hit (bar 153): kick + bass; arp stops, pads + bass sustain to the fade |
| 4:42.450 | 163 / 2.35 | end | mix below -40 dBFS (fade-out end); file ends 282.516 |

**Drop impact (Instrumental Drop): 2:33.170 = 153.17 s, bar 89 downbeat.** The strongest bar-line impact is earlier, at 2:05.340 (bar 73, start of Build Up). no digital/full-mix silence inside the song (mix never < -40 dBFS between 0.44 and 282.45 s); the "gaps" are drums-out passages: 201.86-222.73 (pads only), 257.51-264.47 (arp only).

## Lyrics - line table

| # | Section | Line | Start | End | Dur | Bar / beat |
|---|---|---|---|---|---|---|
| 1 | Verse 1 | I split myself a thousand ways | 0:28.540 | 0:32.460 | 3.92 | 17 / 2.36 |
| 2 | Verse 1 | Down every road the night could hold | 0:33.524 | 0:39.700 | 6.18 | 20 / 1.83 |
| 3 | Verse 1 | Each one a light I sent ahead | 0:42.324 | 0:46.390 | 4.07 | 25 / 2.07 |
| 4 | Verse 1 | Each one a story to unfold | 0:47.472 | 0:53.975 | 6.50 | 28 / 1.91 |
| 5 | Pre-Chorus | And every branch remembers | 0:54.660 | 0:58.850 | 4.19 | 32 / 2.44 |
| 6 | Pre-Chorus | Where I started from | 0:59.930 | 1:05.990 | 6.06 | 35 / 2.56 |
| 7 | Chorus 1 | Merge me back to main | 1:09.420 | 1:15.065 | 5.64 | 40 / 4.39 |
| 8 | Chorus 1 | Every road I ran becomes the one | 1:15.768 | 1:22.140 | 6.37 | 44 / 2.99 |
| 9 | Chorus 1 | Fold me in again | 1:23.550 | 1:28.535 | 4.98 | 48 / 4.89 |
| 10 | Chorus 1 | Nothing that I lived can come undone | 1:29.460 | 1:39.920 | 10.46 | 52 / 2.48 |
| 11 | Breakdown | Branch... and wander... | 1:42.652 | 1:46.690 | 4.04 | 59 / 4.82 |
| 12 | Breakdown | Merge... and return... | 1:49.430 | 1:51.855 | 2.42 | 63 / 4.41 |
| 13 | Breakdown | Ahh... ahh... | 1:51.870 | 2:05.900 | 14.03 | 65 / 2.02 |
| 16 | Verse 2 | This branch may never find the way | 3:02.000 | 3:07.185 | 5.19 | 105 / 3.32 |
| 17 | Verse 2 | Back to the place where I began | 3:08.342 | 3:14.205 | 5.86 | 109 / 1.91 |
| 18 | Verse 2 | And maybe something that I learned | 3:15.496 | 3:20.883 | 5.39 | 113 / 2.36 |
| 19 | Verse 2 | Comes home to who I'll be again | 3:20.898 | 3:26.915 | 6.02 | 116 / 2.79 |
| 20 | Chorus 2 | Merge me back to main | 3:28.130 | 3:33.720 | 5.59 | 120 / 3.42 |
| 21 | Chorus 2 | Every road I ran becomes the one | 3:34.971 | 3:40.240 | 5.27 | 124 / 3.15 |
| 22 | Chorus 2 | Fold me in again | 3:42.632 | 3:48.395 | 5.76 | 128 / 4.77 |
| 23 | Chorus 2 | Every life I've lived, I have become | 3:48.880 | 3:55.734 | 6.85 | 132 / 3.15 |
| 24 | Outro | Back to main... | 3:55.749 | 3:58.650 | 2.90 | 136 / 2.94 |
| 25 | Outro | Back to main... | 4:09.443 | 4:15.885 | 6.44 | 144 / 2.44 |

### Word timings

- **1. I split myself a thousand ways** - I 28.54-28.61, split 28.62-29.02, myself 29.03-30.11, a 30.12-30.28, thousand 30.29-31.18, ways 31.19-32.46
- **2. Down every road the night could hold** - Down 33.52-34.10, every 34.11-34.69, road 34.70-36.15, the 36.16-36.38, night 36.39-37.59, could 37.60-38.38, hold 38.39-39.70
- **3. Each one a light I sent ahead** - Each 42.32-42.82, one 42.83-42.95, a 42.96-43.32, light 43.33-44.07, I 44.08-44.33, sent 44.34-44.94, ahead 44.95-46.39
- **4. Each one a story to unfold** - Each 47.47-48.04, one 48.05-48.27, a 48.28-48.35, story 48.36-50.33, to 50.34-51.62, unfold 51.63-53.98
- **5. And every branch remembers** - And 54.66-54.97, every 54.98-55.63, branch 55.64-57.02, remembers 57.03-58.85
- **6. Where I started from** - Where 59.93-60.59, I 60.60-60.68, started 60.69-62.18, from 62.19-65.99  
  _'Where' glide voiced from 59.93_
- **7. Merge me back to main** - Merge 69.42-71.79, me 71.80-72.01, back 72.02-72.69, to 72.69-72.92, main 72.93-75.06  
  _'Merge' nasal scoop starts 69.42 (CTC 69.66 = vowel)_
- **8. Every road I ran becomes the one** - Every 75.77-76.59, road 76.60-77.89, I 77.90-78.12, ran 78.13-78.76, becomes 78.77-79.62, the 79.63-80.14, one 80.15-82.14
- **9. Fold me in again** - Fold 83.55-85.72, me 85.72-86.30, in 86.31-86.71, again 86.72-88.53
- **10. Nothing that I lived can come undone** - Nothing 89.46-90.51, that 90.52-91.80, I 91.81-92.05, lived 92.06-92.66, can 92.67-93.02, come 93.03-93.62, undone 93.63-99.92  
  _'N' of 'Nothing' voiced from 89.46_
- **11. Branch... and wander...** - Branch 102.65-103.66, and 103.67-103.87, wander 103.88-106.69
- **12. Merge... and return...** - Merge 109.43-110.55, and 110.56-110.69, return 110.70-111.86
- **13. Ahh... ahh...** - Ahh 111.87-118.33, ahh 118.36-125.90  
  _Wordless: no aligner/ASR output. Same melody as v1, ~0.65 s earlier. Ahh #1 = drop to B3 right after 'return' (111.87, bar 65 beat 2), leaps at 114.06 and 116.69; Ahh #2 = leap to F#5 at 118.36 (bar 69 downbeat), held and fading out by ~125.9 (< -40 dB from ~124.8). Boundary 'return'/Ahh #1 is musical, not phonetic (medium-low confidence)._
- **16. This branch may never find the way** - This 182.00-182.34, branch 182.48-183.11, may 183.12-183.55, never 183.56-184.17, find 184.18-185.29, the 185.30-185.85, way 185.86-187.19  
  _173.08-180.9 sustained flat 'ooh' tone in both vocal stems is NOT this line (see adlibs)_
- **17. Back to the place where I began** - Back 188.34-188.60, to 188.71-189.03, the 189.04-189.32, place 189.33-190.09, where 190.10-190.56, I 190.57-190.75, began 190.76-194.21
- **18. And maybe something that I learned** - And 195.50-195.71, maybe 195.72-196.36, something 196.37-197.11, that 197.12-198.11, I 198.12-198.41, learned 198.42-200.88  
  _improvised: 'some-thing THAT' held on the high note 196.4-198.1; 'I' = drop to the low note 198.12; MMS CTC squeezed that/I/learned into 196.95-197.27 (wrong), wav2vec2 agrees with the inspection_
- **19. Comes home to who I'll be again** - Comes 200.90-201.81, home 201.82-203.25, to 203.26-203.55, who 203.56-204.19, I'll 204.20-204.38, be 204.38-205.00, again 205.01-206.91  
  _'who' = pitch step + RMS dip 203.56 (CTC spread 203.43-203.99)_
- **20. Merge me back to main** - Merge 208.13-210.95, me 210.96-211.18, back 211.19-211.73, to 211.74-212.11, main 212.12-213.72  
  _'Merge' scoop voiced from 208.13 after a breath 207.95-208.1; 'ME' (emphasised) 210.95_
- **21. Every road I ran becomes the one** - Every 214.97-215.74, road 215.75-217.11, I 217.12-217.28, ran 217.29-217.93, becomes 217.94-218.77, the 218.78-219.36, one 219.37-220.24
- **22. Fold me in again** - Fold 222.63-224.82, me 224.83-225.26, in 225.27-225.86, again 225.87-228.40
- **23. Every life I've lived, I have become** - Every 228.88-229.62, life 229.62-230.88, I've 230.89-231.16, lived 231.16-232.04, I 232.05-232.26, have 232.27-232.70, become 232.71-235.73
- **24. Back to main...** - Back 235.75-236.15, to 236.16-236.40, main 236.41-238.65  
  _'to' = t-burst 236.16, 'main' nasal 236.41 (vowel opens 236.45; wav2vec2 put to/main >1 s late); 'main' held B3 to 238.65, then wordless vocalise to 248.97 (adlib)_
- **25. Back to main...** - Back 249.44-250.00, to 250.01-250.29, main 250.30-255.88  
  _'to' t-burst 250.01; 'main' held to ~255.9. Only TWO 'Back to main' in v2 (v1 had a third, low one at 263.11)_

### Not on the lyric sheet / do not lip-sync

- 0:23.200-0:28.500 (sustained low tone ~D4 in both vocal stems, swelling into "I split"; probably a hummed pickup or vocal pad, no consonants) - lip-sync: no
- 2:53.080-3:00.900 (wordless sustained "ooh" layer in the drop, bars 100-104; flat pitch ~G#4 then glide down ~177; abrupt start) - lip-sync: no
- 3:58.660-4:08.970 (wordless vocalise "ooh/ahh" continuing out of the held "main", F#4-A4 with a leap to F#5 at 248.10; not on the lyric sheet) - lip-sync: yes (sustained vowel)

### Lyric sheet vs what is sung

- Every sheet line is sung once, in order, with the sheet words (ASR mishearings such as "Chained/Wrench and wander", "back to lane/Maine", "This dance", "something that I love" are breathy-vowel artefacts; the sung text matches the sheet).
- "Back to main..." is sung TWICE (235.75, 249.44) - the sheet line, plus the end-of-chorus pickup; v1 had three.
- Unlisted wordless vocalise 238.66-248.97 between "Back to main" #1 and #2 (continuous with the held "main").
- "Ahh... ahh..." = two long wordless notes 111.87-118.33 and 118.36-125.9 (leap to F#5 on bar 69); no consonants, boundary to "return" is musical.
- The build-up whispers of v1 are gone (no vocal at all 127-172 s in the RoFormer stem).
- Unlisted: low sustained tone in the vocal stems 23.2-28.5 before the first line, and a wordless "ooh" layer 173.08-180.9 in the drop (adlibs, lip_sync false).
- Verse 2 improvisation: high notes on THE (185.30-185.85), I (190.57), THAT (197.12-198.11, held), BE (204.38-205.0). Chorus 2 "ME" emphasised (210.96).
- No extra chorus repeats; choruses are not doubled.

### Long held notes (>= 2 s)

"unfold" 51.63-53.98 (2.3 s), "from" 62.19-65.99 (3.8 s), "Merge" 69.42-71.79 (2.4 s), "main" 72.93-75.06 (2.1 s), "Fold" 83.55-85.72 (2.2 s), "undone" 93.63-99.92 (6.3 s), "wander" 103.88-106.69 (2.8 s), "Ahh" 111.87-118.33 (6.5 s), "ahh" 118.36-125.90 (7.5 s), "began" 190.76-194.21 (3.5 s), "learned" 198.42-200.88 (2.5 s), "Merge" 208.13-210.95 (2.8 s), "Fold" 222.63-224.82 (2.2 s), "again" 225.87-228.40 (2.5 s), "become" 232.71-235.73 (3.0 s), "main" 236.41-238.65 (2.2 s), "main" 250.30-255.88 (5.6 s)

## ASCII energy timeline (2 bars per row, # = mix loudness, v = vocal sung, ! = event)

```
0:00.126 bar   1 |#########                               |     << INTRO
0:03.604 bar   3 |####################                    |     
0:07.081 bar   5 |#####################                   |   !   build
0:10.559 bar   7 |#######################                 |     
0:14.036 bar   9 |#######################                 |   !   hit
0:17.514 bar  11 |#######################                 |     
0:20.992 bar  13 |####################                    |     
0:24.470 bar  15 |##################                      |     
0:27.948 bar  17 |####################                    | v ! << VERSE 1  hit
0:31.426 bar  19 |################                        | v   
0:34.904 bar  21 |####################                    | v   
0:38.382 bar  23 |##################                      | v   
0:41.860 bar  25 |#####################                   | v   
0:45.338 bar  27 |################                        | v   
0:48.816 bar  29 |###################                     | v   
0:52.294 bar  31 |##################                      | v   
0:55.773 bar  33 |###################                     | v   << PRE-CHORUS
0:59.251 bar  35 |################                        | v   
1:02.729 bar  37 |####################                    | v !   hit; riser
1:06.207 bar  39 |######################                  |     
1:09.686 bar  41 |#########################               | v ! << CHORUS 1  hit
1:13.164 bar  43 |#####################                   | v   
1:16.643 bar  45 |######################                  | v   
1:20.121 bar  47 |####################                    | v   
1:23.599 bar  49 |#######################                 | v   
1:27.078 bar  51 |####################                    | v !   hit
1:30.556 bar  53 |######################                  | v   
1:34.035 bar  55 |#####################                   | v   
1:37.513 bar  57 |######################                  | v ! << BREAKDOWN  hit
1:40.992 bar  59 |#####################                   | v   
1:44.470 bar  61 |####################                    | v   
1:47.948 bar  63 |#####################                   | v   
1:51.427 bar  65 |#######################                 | v !   build
1:54.905 bar  67 |#######################                 | v !   snare_roll
1:58.384 bar  69 |#######################                 | v !   hit
2:01.862 bar  71 |#####################                   | v !   snare_roll
2:05.341 bar  73 |#################################       |   ! << BUILD UP  impact
2:08.819 bar  75 |################################        |     
2:12.297 bar  77 |################################        |     
2:15.775 bar  79 |#################################       |     
2:19.254 bar  81 |################################        |     
2:22.732 bar  83 |##################################      |     
2:26.210 bar  85 |###########################             |   !   riser; drums_out
2:29.689 bar  87 |######################                  |   !   snare_roll
2:33.167 bar  89 |#################################       |   ! << INSTRUMENTAL DROP  drop
2:36.645 bar  91 |##################################      |     
2:40.123 bar  93 |##################################      |     
2:43.601 bar  95 |#################################       |     
2:47.079 bar  97 |##################################      |     
2:50.558 bar  99 |#################################       |     
2:54.036 bar 101 |##################################      |     
2:57.514 bar 103 |################################        |   !   drums_out; snare_roll
3:00.992 bar 105 |##################################      | v ! << VERSE 2  impact
3:04.470 bar 107 |#################################       | v   
3:07.948 bar 109 |#################################       | v   
3:11.427 bar 111 |#################################       | v   
3:14.905 bar 113 |###############################         | v   
3:18.383 bar 115 |################################        | v   
3:21.861 bar 117 |###############                         | v !   drums_out
3:25.339 bar 119 |########                                | v   
3:28.817 bar 121 |#################                       | v   << CHORUS 2
3:32.295 bar 123 |#######                                 | v   
3:35.774 bar 125 |############                            | v   
3:39.252 bar 127 |###########                             | v !   riser
3:42.730 bar 129 |#########################               | v !   hit
3:46.208 bar 131 |####################                    | v   
3:49.686 bar 133 |#####################                   | v   
3:53.165 bar 135 |########################                | v !   riser
3:56.643 bar 137 |#################################       | v ! << OUTRO  impact
4:00.121 bar 139 |#################################       |     
4:03.599 bar 141 |#################################       |     
4:07.077 bar 143 |################################        | v   
4:10.556 bar 145 |####################################    | v   
4:14.034 bar 147 |####################################    | v   
4:17.512 bar 149 |######################                  |   !   drums_out
4:20.991 bar 151 |##################                      |   !   riser
4:24.469 bar 153 |################################        |   !   impact
4:27.947 bar 155 |###########################             |     
4:31.426 bar 157 |##########################              |     
4:34.904 bar 159 |#########################               |     
4:38.383 bar 161 |##################                      |     
4:41.861 bar 163 |                                        |     
```

## Confidence and verification

- **Beats/bars**: high. Tempo is metronomic (138.00 BPM); drum sections are locked to kick onsets (~3 ms), drumless intro/verse/chorus-1 to the plucked arp (~2-3 ms, softer onsets: allow +-10 ms). Long interpolated stretches (pad-only Chorus 2) are bridged by a straight line; the re-entry hits at bar 129 (222.73), bar 137 (236.64) and bar 153 (264.465) land within 0-4 ms of the grid.
- **Bar numbering**: bar 1 beat 1 = 0.126 s, chosen by beat_this downbeat vote (148/155) and the section hits (bars 9, 17, 37, 41, 57, 65, 73, 89, 105, 129, 137, 153 all on downbeats). The generic v1 beatgrid.py slipped one beat in the v2 intro (beat_this tracks the off-beat for the first 8 s), hence tools/analysis_v2/beatgrid.py.
- **Sections**: high for bar lines. Arrangement differs from v1 in places: no whispers in Build Up and no full drums-out gap before the drop; Chorus 2 starts with NO hit (pads only until bar 129); a wordless 'ooh' layer in the drop (173.1-180.9); only two 'Back to main'; no final hit at bar 161 (last hit is bar 153, 264.465).
- **Word starts**: independent spot check on 21 consonant-initial words (onset measured on the demucs stem, alignment refined on the RoFormer stem): median |error| 25 ms, mean 38 ms, 90th pct 80 ms, max 140 ms. The >90 ms cases are b/p words (place, become) where the timing marks lip closure and the measurement picks the burst/vowel.
- **Lower-confidence words** (+-0.1-0.3 s): 'I' and 'learned' in Verse 2 line 18 (improvised legato, placed on the pitch drop 198.12 / rise 198.42), 'who' in line 19 (203.56), 'to/main' in both 'Back to main' (nasal/vowel boundaries), 'Ahh' #1 start (musical boundary), vowel-initial words inside legato phrases, and all word ENDS on held notes (reverb tails: +-0.3 s).
- **Line starts**: high. Line-initial words were moved to the audible voiced onset by inspection where CTC was late (Merge x3, Nothing, Where, And, This; see work_v2/overrides.json).
- Aligners: 4 CTC runs agree within ~50 ms on most words; MMS_FA failed in Verse 2 line 18 (squeezed 'that I learned' into 0.3 s) and wav2vec2 placed 'to main' >1 s late in both 'Back to main' - both corrected by inspection. Whisper ran early on sustained notes and is a sanity check only.

## Files

- `analysis_v2/timing.json` - everything above (beats, downbeats, bars, phrases, sections, events, lyrics with words); same schema as analysis/timing.json. Lyric line `id`s are the v1 ids (14, 15, 26 do not exist in v2).
- `analysis_v2/energy.json` - 10 Hz + per-beat loudness/brightness/onset/vocal-activity curves
- `analysis_v2/stems/` - vocals.wav + instrumental.wav (demucs htdemucs_ft), drums/bass/other, vocals_roformer.wav (BS-RoFormer ep_317), all 48 kHz PCM_24 sample-aligned with inputs/Merge.wav
- `analysis_v2/check_overview.png`, `analysis_v2/check_NN_<section>.png` - waveform + beats + sections + word boundaries
- `analysis_v2/click_check.wav` - mix + beat clicks (downbeat high) + tone burst at each word start (line start = higher tone)
- `analysis_v2/NOTES.md` - v1 -> v2 comparison (sections, lines, time map)
- pipeline: `tools/analysis_v2/run_all.sh` (generic scripts in tools/analysis with env-var paths + v2-specific scripts); `work_v2/overrides.json` holds the manual corrections
