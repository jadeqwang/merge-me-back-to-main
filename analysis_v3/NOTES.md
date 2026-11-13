# analysis_v3 - notes (song v3 = `inputs/Merge (keychange down).wav`, 282.800 s, 48 kHz)

Same files and JSON schema as `analysis_v2/` (checked by `tools/analysis_v3/checks.py`: same top-level, sub-object, bar and section keys). `analysis/`, `analysis_v2/`, `work/`, `work_v2/` and `inputs/` were not touched. The input was copied to `work_v3/song.wav` (identical bytes) because of the spaces and parentheses in its name.

## How it was made
- Stems: `work_v3/stems.sh` (= `work_v2/stems.sh` with paths to work_v3: demucs `htdemucs_ft --float32` + BS-RoFormer ep_317 on the local RTX 3090), exported by `tools/analysis_v2/export_stems.py` (generic, run with v3 env vars) to `analysis_v3/stems/` (48 kHz PCM_24, sample-aligned).
- Pipeline: `tools/analysis_v3/run_all.sh [stems|grid|align|build|warp|all]`. Generic scripts from `tools/analysis/` with env-var paths; generic v2 scripts reused as they are (`export_stems`, `fuse`, `spotcheck`, `key_track`); v3-specific scripts in `tools/analysis_v3/`: `beatgrid.py` (drifting-period tracker), `warp_align.py` + `compare_ab.py` (independent grid estimate and comparison), `warpmap.py` (old->new by musical position), `lines.json` (v2 windows mapped, +-0.2 s), `events.py`, `build_timing.py`, `build_md.py`, `build_warp.py`, `checks.py`, and diagnostic plots (`anchor_plots.py`, `tail_check.py`, `grid_onset_plot.py`, `zoom_words.py`, `arr_compare.py`), `notes_tables.py` (tables below). Intermediates and manual corrections are in `work_v3/` (`overrides.json`). A full re-run (`run_all.sh all`) reproduced `grid_final.json` and `lyrics_fused.json` byte for byte; `timing.json` is deterministic from them.
- Running log: `work_v3/NOTES_progress.md`.

## Key
**A minor** (relative C major very prominent): v2's B minor / D major moved down a whole tone. Every per-section block's best key is the v2 block's key minus 2 semitones. No key change inside the song.

## Tempo / grid
- **Not constant** (v2 was 138.00 throughout). There is a smooth accelerando. BPM per 16-bar block:
  bar 1 (0.22 s) 137.80, bar 17 (28.09) 138.18, bar 33 (55.88) 138.54, bar 49 (83.59) 138.62, bar 65 (111.30) 138.77, bar 81 (138.97) 138.99, bar 97 (166.59) 139.48, bar 113 (194.12) 140.61, bar 129 (221.44) 140.98, bar 145 (248.67) 140.71, bar 161 (275.96) 140.26 (bars 154-160 are interpolated, and bars after the final hit are extrapolated).
  The best constant-tempo line is off by up to 633 ms. Cut on `beats[]` / `bars[]`.
- **Bar 1 beat 1 = 0.219 s** (v2 0.126). There are **164 bars** to the file end (v2: 163, the last one 2 beats). The section bar numbers are the same as in v2. The extra bar comes from the tail only: v3 is faster and its fade is longer. All complete bars are 1.698-1.752 s.
- **Estimate (a)**, from the new file only (`beatgrid.py` -> `comb_phase.py` -> `final_grid.py`): beat_this beats plus strong drum-stem onsets. Tracking is seeded in the most regular 24 s window, then extended beat by beat with the local period of the last 16 accepted beats. A candidate must be within 22 % of a beat of the prediction, so an off-beat-following tracker cannot shift the index (this is the v2 pitfall). The final grid is a smoothing spline on kick onsets plus the arp onset comb.
  Fit: **kick onsets 2.8 ms rms, p95 5.1 ms** (n=280). Arp comb 2.5 ms rms, p95 4.4 ms (n=185).
  Downbeat phase: the beat_this downbeat vote is 222 of 261 for the chosen phase (29 for phase 2).
- **Estimate (b)** (`warp_align.py`): the v2 grid carried through an old->new alignment. Onset envelopes (drum onset, kick-band flux, mix, other, bass; 5 ms) of both files are cross-correlated. Pass 1 uses 14 s windows, the lead lags as the prior (+-0.35 s), and a search over the new/old time stretch 0.975-1.0075. The stretch had to be included: without it, the 2 % tempo difference smeared the windows. Pass 2 uses 7 s windows every 2 beats, +-60 ms around pass 1. Windows that do not correlate (< 0.25) or are more than 20 ms off the running median are dropped, and the rest go through a spline. (b) does not read (a).
- **(a) - (b), per section** (mean |diff| / max |diff|, ms): Intro 5.0 / 15.7, Verse 1 11.3 / 26.4, Pre-Chorus 15.8 / 24.8, Chorus 1 7.3 / 13.9, Breakdown 3.9 / 11.9, Build Up 2.7 / 3.5, Drop 1.3 / 2.4, Verse 2 3.8 / 7.7, Chorus 2 13.6 / 25.6, Outro 10.8 / 41.3 (the 41 ms is in the pads-only tail, where (b) has no correlating window). Overall the mean |diff| is 7.4 ms over 650 beats. Both estimates give the same bar index everywhere (the largest difference is 1/10 of a beat). `timing.json` uses (a) because it is measured on the new file's own onsets.
- **Anchors checked on the waveform** (`anchor_bar009.png`, `anchor_bar089.png`):
  - Bar 9 is the first kick hit at **14.18** in v3 (v2 14.04). There is a drum pickup from 13.97 into it.
  - Bar 89, the drop, is at **152.79** (v2 153.167). (a) gives 152.788, (b) 152.788, and the drum-onset peak is at 152.79.
- **Section hits on downbeats** (drum onset minus grid, ms): bar 9 -5, 17 +13, 37 -8, 41 +4, 57 -12, 65 0, 69 -4, 73 -3, 86 -1, 89 +2, 105 +5, 117 +8, 121 +6, 129 +4, 137 +7, 149 +5, 153 -1. All are within 20 ms.
- **Interpolated** (no rhythmic anchor within +-2 beats): 15.9-19.8, 56.7-61.5, 71.5-75.4, 91.4-96.2, 204.8-206.5, 209.1-220.2 (Chorus 2 first half), 222.7-234.6 (Chorus 2 second half; the arp is audible but its comb contrast was below threshold), 263.6-275.5 (pads + bass after the bar-153 hit). There are also single beats at 103.1 and 202.3. The grid is **extrapolated after 277.25** (after the final hit).
  - Re-entry hits after the long stretches land on the grid: bar 129 (+4 ms), bar 137 (+7 ms), and the final hit 276.82 (bar 161 beat 3).
  - In the 263.6-275.5 tail, the chord changes measured on the bass stem fall on the bar 155/157/159 downbeats within the 0.1-0.15 s precision of that measurement. Bass onsets sit on the 269.1 and 270.8 bar lines.
- **Plots checked by eye**:
  - `gridcheck_intro*.png`: arp onsets sit on the beat lines from bar 1; the bar 9 and 17 kicks are on downbeats.
  - `gridcheck_chorus2a/b.png` (199-237 s): the bar 116-117 kicks, the bar 121 and 129 hits, the arp in bars 130-136 and the 16ths from 233.3 are on the grid.
  - `gridcheck_tail.png`: the bar 149 kick, the arp to bar 153, the bar 153 hit and the final hit are on the grid.
  - The (b) ticks coincide with the grid lines in every panel.
  - The generic `check_*.png` were also looked at (intro, outro).
  - `click_check.wav` was rendered but **nobody has listened to it**.

## Sections, v2 vs v3 (same bars)
| Section | bars | v2 start | v3 start | shift | v2 end | v3 end | v2 vocal | v3 vocal |
|---|---|---|---|---|---|---|---|---|
| Intro | 1-16 | 0.000 | 0.000 | +0.000 | 27.948 | 28.087 | - | - |
| Verse 1 | 17-32 | 27.948 | 28.087 | +0.139 | 55.773 | 55.876 | 28.54 | 28.675 |
| Pre-Chorus | 33-40 | 55.773 | 55.876 | +0.103 | 69.686 | 69.716 | 54.66 | 54.77 |
| Chorus 1 | 41-56 | 69.686 | 69.716 | +0.030 | 97.513 | 97.457 | 69.42 | 69.45 |
| Breakdown | 57-72 | 97.513 | 97.457 | -0.056 | 125.341 | 125.133 | 102.65 | 102.522 |
| Build Up | 73-88 | 125.341 | 125.133 | -0.208 | 153.167 | 152.787 | - | - |
| Instrumental Drop | 89-104 | 153.167 | 152.787 | -0.380 | 180.992 | 180.375 | - | - |
| Verse 2 | 105-120 | 180.992 | 180.375 | -0.617 | 208.817 | 207.819 | 182.0 | 181.403 |
| Chorus 2 | 121-136 | 208.817 | 207.819 | -0.998 | 236.643 | 235.038 | 208.13 | 207.58 |
| Outro | 137-164 (v2 137-163) | 236.643 | 235.038 | -1.605 | 282.516 | 282.800 | 235.75 | 234.158 |

Offset of each bar (v3 - v2), every 8 bars: `1:+0.093 9:+0.149 17:+0.139 25:+0.126 33:+0.104 41:+0.030 49:-0.005 57:-0.056 65:-0.132 73:-0.208 81:-0.288 89:-0.379 97:-0.485 105:-0.617 113:-0.779 121:-0.998 129:-1.294 137:-1.604 145:-1.882 153:-2.168 161:-2.418`.
These agree with the pre-run chroma/onset lags to within their 20-40 ms resolution, except at 230 s: -1.45 here against the lead's -1.56.

## Lyric lines, v2 vs v3
The line ids, order and count (23) are the same as in v2, and so is the number of words per line. The ASR (faster-whisper large-v3 with and without a prompt, plus windowed re-runs) hears the same words, with the same kind of mishearings as in v2 ("Back to Maine/me", "This French", "something that I love", "Nothing that I left"; the windowed run gives "lived").
The ASR output "Bye" / "Oh my God" at 136-141 and "Thank you (for watching)" at 261-276 are hallucinations: the RoFormer stem is silent at 136-141, and 261-276 holds only a faint wordless tone.
"mapped" = the v2 start moved by musical position. "measured - mapped" shows where the singing itself moved against the beat.

| id | # | line | v2 start | v3 start | shift | v3 mapped | measured - mapped | v3 end | v3 bar/beat |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 1 | I split myself a thousand ways | 28.540 | 28.675 | +0.135 | 28.678 | -3 ms | 32.370 | 17 / 2.36 |
| 2 | 2 | Down every road the night could hold | 33.524 | 33.654 | +0.130 | 33.655 | -1 ms | 40.165 | 20 / 1.82 |
| 3 | 3 | Each one a light I sent ahead | 42.324 | 42.399 | +0.075 | 42.450 | -51 ms | 46.365 | 25 / 1.95 |
| 4 | 4 | Each one a story to unfold | 47.472 | 47.637 | +0.165 | 47.601 | +36 ms | 54.065 | 28 / 1.99 |
| 5 | 5 | And every branch remembers | 54.660 | 54.770 | +0.110 | 54.772 | -2 ms | 58.920 | 32 / 2.44 |
| 6 | 6 | Where I started from | 59.930 | 60.000 | +0.070 | 59.996 | +4 ms | 66.025 | 35 / 2.57 |
| 7 | 7 | Merge me back to main | 69.420 | 69.450 | +0.030 | 69.450 | -0 ms | 75.743 | 40 / 4.39 |
| 8 | 8 | Every road I ran becomes the one | 75.768 | 75.758 | -0.010 | 75.787 | -29 ms | 82.020 | 44 / 2.92 |
| 9 | 9 | Fold me in again | 83.550 | 83.545 | -0.005 | 83.545 | +0 ms | 89.415 | 48 / 4.89 |
| 10 | 10 | Nothing that I lived can come undone | 89.460 | 89.430 | -0.030 | 89.439 | -9 ms | 98.985 | 52 / 2.46 |
| 11 | 11 | Branch... and wander... | 102.652 | 102.522 | -0.130 | 102.568 | -46 ms | 106.655 | 59 / 4.71 |
| 12 | 12 | Merge... and return... | 109.430 | 109.310 | -0.120 | 109.309 | +1 ms | 111.725 | 63 / 4.41 |
| 13 | 13 | Ahh... ahh... | 111.870 | 111.740 | -0.130 | 111.736 | +4 ms | 125.600 | 65 / 2.03 |
| 16 | 14 | This branch may never find the way | 182.000 | 181.403 | -0.597 | 181.372 | +31 ms | 186.970 | 105 / 3.39 |
| 17 | 15 | Back to the place where I began | 188.342 | 187.634 | -0.708 | 187.642 | -8 ms | 191.460 | 109 / 1.89 |
| 18 | 16 | And maybe something that I learned | 195.496 | 194.737 | -0.759 | 194.709 | +28 ms | 199.985 | 113 / 2.42 |
| 19 | 17 | Comes home to who I'll be again | 200.898 | 200.000 | -0.898 | 200.035 | -35 ms | 204.995 | 116 / 2.70 |
| 20 | 18 | Merge me back to main | 208.130 | 207.580 | -0.550 | 207.144 | **+436 ms** | 212.230 | 120 / 4.44 |
| 21 | 19 | Every road I ran becomes the one | 214.971 | 213.801 | -1.170 | 213.852 | -51 ms | 219.665 | 124 / 3.04 |
| 22 | 20 | Fold me in again | 222.632 | 221.353 | -1.279 | 221.340 | +13 ms | 225.890 | 128 / 4.80 |
| 23 | 21 | Every life I've lived, I have become | 228.880 | 227.403 | -1.477 | 227.443 | -40 ms | 234.143 | 132 / 3.05 |
| 24 | 22 | Back to main... | 235.749 | 234.158 | -1.591 | 234.163 | -5 ms | 238.040 | 136 / 2.93 |
| 25 | 23 | Back to main... | 249.443 | 247.762 | -1.681 | 247.584 | **+178 ms** | 251.175 | 144 / 2.86 |

The vocal is phrased the same as in v2: word starts are mostly within +-50 ms of the mapped v2 words. There are two exceptions:
- "Merge" at the start of Chorus 2 scoops in 0.44 s later (0.24 s before the new bar-121 hit; in v2 it was 0.69 s before bar 121).
- "Back to main" #2 starts 0.18 s later, and its "to/main" is tighter.

**Overrides** (`work_v3/overrides.json`). Every v2 override was re-checked on v3 zoom panels: RoFormer spectrogram, pyin and RMS, with the mapped v2 word marked. Values are measured in v3.
- Voiced onsets where CTC was late again: line 5 "And" 54.77, line 6 "Where" 60.00, line 7 "Merge" 69.45, line 10 "Nothing" 89.43, line 12 "Merge" 109.31, line 20 "Merge" 207.58.
- Line 18 "I" 197.28 / "learned" 197.57: the same MMS/wav2vec2 squeeze as in v2.
- Line 19 "who" 202.63.
- Line 25 "to" 248.15 / "main" 248.27.
- The wordless line 13 is placed by hand: Ahh 111.74-118.17, ahh 118.20-125.60.
- The v2 override for line 16 "This" was not needed: all aligners agree on 181.40, which equals the mapped value.
- The line 24 "to/main" overrides were not needed: the fused values are within 40 ms of the mapped ones.
- New: "one" at the end of lines 8 and 21 is set to the v2 convention (80.16, 218.16; 0.22 s before the vowel change). The v3 CTC had put it 0.4 s later. Low confidence.

Spot check (independent onsets on the demucs stem, 21 words): median |err| 24 ms, p90 110 ms, max 140 ms.

## Arrangement differences v2 -> v3
These come from bar-by-bar stem levels (`work_v3/arr_compare.json`) and were confirmed on the plots.
- **Intro**:
  - The low synth bass is clearly audible in bars 1-4 (it was faint in v2).
  - There is **no soft hat/snare pattern in bars 5-7**.
  - The vocal-stem low tone starts at 25.8 instead of the mapped 23.3.
  - The first audible sound is at 0.645 (v2 0.44).
- **Pre-Chorus**: the bass drops out during bar 33 instead of at bar 34 beat 4. The Verse 1 bass is louder.
- **Chorus 1**: there is **no kick hit at bar 52** (v2 89.80), and the bass lasts to about bar 54 beat 3.
- **Breakdown**: the kick pulse in bars 70-72 is louder. Otherwise it is the same.
- **Build Up and Drop**: the same, including no vocals in the Build Up and the "ooh" layer at 172.54-180.28.
- **Verse 2**: there is a **kick hit on the bar-117 downbeat** (200.99) before the drums-out. In v2 the drums just cut.
- **Chorus 2**:
  - It **starts with a hit on bar 121** (207.82, kick + bass). In v2 it was pads only until bar 129.
  - The bass plays in bars 121-133 and is out from about 229.5. In v2 the bass played in bars 129-136.
  - There is no kick/snare pickup before bar 129.
- **Outro**:
  - **No wordless vocalise** after the first held "main". That "main" ends at about 238.0, and the vocal stems are silent from 238.5 to 247.7 (v2 had a vocalise at 238.66-248.97).
  - The second held "main" ends at about 251.2, about 4 s shorter than in v2 (255.9).
  - New: a faint high wordless tone (~C5, -35 to -55 dB) at 260.85-264.3, leading into the bar-153 hit.
- **Ending**:
  - In v2, the last hit is at bar 153, then pads and bass sustain with chord changes every 2 bars (bars 155, 157, 159, 161 downbeat) and fade to < -40 dBFS at 282.45, with no further hit.
  - In v3, the bar-153 hit (262.30) and the chord changes at bars 155/157/159 (265.66, 269.28, 272.68) are the same. The **last chord change comes with a NEW FINAL HIT (kick) at 276.82**. That is bar 161 **beat 3** on a steady grid, i.e. 2 beats after where the 2-bar harmonic rhythm puts it.
  - After the hit, the sound sustains and fades to < -40 dBFS at 282.23. The file ends at 282.80.
  - Measured from the bar-153 hit to -40 dB, the v3 tail is 19.93 s (about 46.7 beats); the v2 tail is 17.98 s (about 41.4 beats). So the new ending is about 5 beats longer musically, even though it finishes about 2 s earlier in absolute time.
  - The "2 extra beats" reading is **inferred**. The pulses after the hit and the bar-153 -> hit distance (34 beats at 140.5 BPM, the same tempo as bars 145-152) fit a steady tempo. But there is no rhythmic onset between 272.7 and 276.8, so a ritard confined to bars 159-160 cannot be ruled out. If you want the final hit to be a downbeat, re-bar the tail by hand.

## Time map v2 -> v3 (`warp_v2_to_v3.json`)
- `beats[]`: every v2 beat (650; the downbeats included) with its v3 time, i.e. the v3 grid beat with the same index. This map is monotone. The v3 grid has 6 more beats (`new_only_beats`, fade tail).
- `lines[]` / `words[]`: the v2 start, the mapped v3 start and the measured v3 start. **Use the measured value for lip-sync.**
- `events[]`: every v2 event with its mapped time and the matching measured v3 event, or a note when it is absent in v3 (bar 5 hats, bar 52 hit, the bar 117 cut that is now a hit then a cut, the "no hit" note at bar 121, the pickup at bar 128).
- `new_events[]`: events that exist only in v3 (hits on bars 117 and 121, bass out at 229.5, the high tone at 260.85, the final hit 276.82).
- `tail_note`: v2's bar-161 chord change maps by index to 275.96, but the musical counterpart in v3 is 276.82.
- **No audio is shared sample for sample** (pass-2 correlations are 0.25-0.7). There is no constant offset anywhere. The vocal performance matches word for word in timing but is 2 semitones lower.

## Could not verify / watch
- The ear check of `analysis_v3/click_check.wav` has not been done.
- The tail grid (bars 154-160): there are no beat onsets in it; it is supported only by the bar-153 hit, the final hit and chord changes (+-0.1 s).
- The interpretation of the final hit as bar 161 beat 3 (see the ending above).
- Interpolated stretches in Chorus 2 (209.1-220.2, 222.7-234.6): (a) and (b) agree to 14 ms mean, 26 ms max.
- Event times for risers (64.93, 147.16, 219.74, 231.63, 261.02), the 32nd-note roll (123.29-124.72) and the "bass thins out" at 178.01 are v2 times mapped by musical position. Their presence was checked; their exact start was not measured.
- Low-confidence words: "one" (lines 8 and 21), "in" (line 22), "that/I/learned" (line 18), "who" (line 19), "to/main" in both "Back to main", the "Ahh" #1 start, and all word ENDS on held notes.
- What the new 260.85-264.3 tone is (pad or voice). It is marked `lip_sync: false`.
