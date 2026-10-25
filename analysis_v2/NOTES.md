# analysis_v2 - notes (song v2 = `inputs/Merge.wav`, 282.516 s, 48 kHz)

Same files and JSON schema as `analysis/` (v1, `inputs/Merge Me Back to Main.wav`, 284.800 s), so the engine can switch by pointing at `analysis_v2/`. `analysis/` and the v1 intermediates in `work/` were not touched.

## How it was made
- Stems: `work_v2/stems.sh` = demucs `htdemucs_ft --float32` + BS-RoFormer `model_bs_roformer_ep_317_sdr_12.9755.ckpt` (audio-separator, same model/dir as v1's `work/roformer.log`), exported by `tools/analysis_v2/export_stems.py` to 48 kHz PCM_24, sample-aligned with the song (instrumental = drums+bass+other, as v1).
- Pipeline: `tools/analysis_v2/run_all.sh [grid|align|build|all]`. Generic scripts run from `tools/analysis/` with paths redirected by env vars (`ANALYSIS_DIR`, `WORK_DIR`, `SONG`, `LINES`; see `tools/analysis/apaths.py`, defaults = v1, regression-checked: v1 `final_grid.py`/`fuse.py` re-run into a scratch dir reproduce `work/grid_final.json` and `work/lyrics_fused.json` exactly). Song-specific scripts are v2 copies in `tools/analysis_v2/` (beatgrid, fuse, events, key_track, spotcheck, build_timing, build_md, lines.json). Intermediates + manual corrections: `work_v2/` (`overrides.json`). Full re-run is deterministic (identical timing.json).

## Tempo / grid
- **138.00 BPM, constant** (v1: accelerando 136.1 -> 139.5). Kick onsets fit one straight line to 2.6 ms rms (bars 33-150); every 16-bar block 137.99-138.03 BPM; the drumless intro arp comb sits on the same line. Best constant grid vs `beats[]` max error 3.8 ms. Fit: kicks 2.8 ms rms (p95 5.1), arp comb 2.3 ms rms.
- **Bar 1 beat 1 = 0.126 s** (v1 0.134). 163 bars (bar 163 = 2 beats). Same section bar numbers as v1.
- Bug avoided: the v1 `beatgrid.py` chaining slipped one beat in the v2 intro (beat_this follows the off-beat for the first 8 s), which made every bar number one beat late (bar 17 at 28.33 instead of 27.95). `tools/analysis_v2/beatgrid.py` indexes beats on a robust constant-period line instead, and picks the downbeat phase by the beat_this downbeat vote (148 of 155). The section hits (bars 9, 17, 37, 41, 57, 65, 73, 89, 105, 129, 137, 153) all land on these downbeats, within 0-20 ms.
- Interpolated (no rhythmic anchor) 15.3-20.1, 56.6-61.9, 202.7-221.9, 224.0-235.8, 265.8-278.8 s. After the long pad-only stretch, the re-entry hits land on the grid: bar 129 222.73 (0 ms), bar 137 236.64 (-3 ms), bar 153 264.465 (-4 ms).
- Checked on the plots: grid vs mix/other/bass/drum/kick/snare/hat onset envelopes in the intro, Chorus 2 and the tail (drumless parts). The arp onsets and the beat_this beats sit on the grid lines. `click_check.wav` was regenerated, but nobody has listened to it yet. **Do an ear check of `analysis_v2/click_check.wav` before cutting.**

## Sections (bars are identical to v1; the time shift comes from v1's tempo drift)
| Section | bars | v1 start | v2 start | shift | v1 end | v2 end | v1 vocal | v2 vocal |
|---|---|---|---|---|---|---|---|---|
| Intro | 1-16 | 0.000 | 0.000 | +0.000 | 28.308 | 27.948 | - | - |
| Verse 1 | 17-32 | 28.308 | 27.948 | -0.360 | 56.335 | 55.773 | 28.77 | 28.54 |
| Pre-Chorus | 33-40 | 56.335 | 55.773 | -0.562 | 70.303 | 69.686 | 55.21 | 54.66 |
| Chorus 1 | 41-56 | 70.303 | 69.686 | -0.617 | 98.151 | 97.513 | 70.05 | 69.42 |
| Breakdown | 57-72 | 98.151 | 97.513 | -0.638 | 125.933 | 125.341 | 103.27 | 102.65 |
| Build Up | 73-88 | 125.933 | 125.341 | -0.592 | 153.683 | 153.167 | 136.25 | - |
| Instrumental Drop | 89-104 | 153.683 | 153.167 | -0.516 | 181.381 | 180.992 | - | - |
| Verse 2 | 105-120 | 181.381 | 180.992 | -0.389 | 208.961 | 208.817 | 181.73 | 182.0 |
| Chorus 2 | 121-136 | 208.961 | 208.817 | -0.144 | 236.511 | 236.643 | 208.785 | 208.13 |
| Outro | 137-163 | 236.511 | 236.643 | +0.132 | 284.800 | 282.516 | 235.66 | 235.75 |

Arrangement differences vs v1: Build Up has **no vocal** (whispers gone) and **no full drums-out gap** (bar 86: bass out, kick fades, snare/hats continue). There is a **new wordless "ooh" layer in the drop**, 173.08-180.9. **Chorus 2 starts with NO hit**: pads only, with no kick and no bass until bar 129 (222.73). In Chorus 1 the second hit is at 89.80 (bar 52) instead of bar 49. The Outro has only **two** "Back to main". The **last hit is bar 153 (264.465)**, where the arp stops and pads and bass sustain to the fade (< -40 dBFS at 282.45). There is **no final hit at bar 161**.

## Lyric lines, v1 vs v2
`id` = v1 id (kept for traceability). **The positional index changes**: `engine/src/time.js` `line(i)` = `lines[i-1]`. In v1 the position equalled the id. In v2, ids 14, 15 and 26 are gone, so position 14 is id 16 and so on (column "v2 #"). If the engine switches, either look lines up by `id` or remap `lines(16..25)` to `lines(14..23)`; `lines(26)` no longer exists. `engine/show/main.js` also hardcodes many v1 times (t0/t1), which will need to be re-derived from `analysis_v2`.

| id | v2 # | line (v2 text) | v1 start | v1 end | v2 start | v2 end | start shift |
|---|---|---|---|---|---|---|---|
| 1 | 1 | I split myself a thousand ways | 28.770 | 33.755 | 28.540 | 32.460 | -0.230 |
| 2 | 2 | Down every road the night could hold | 33.930 | 40.800 | 33.524 | 39.700 | -0.406 |
| 3 | 3 | Each one a light I sent ahead | 42.740 | 47.100 | 42.324 | 46.390 | -0.416 |
| 4 | 4 | Each one a story to unfold | 47.930 | 54.595 | 47.472 | 53.975 | -0.458 |
| 5 | 5 | And every branch remembers | 55.210 | 59.515 | 54.660 | 58.850 | -0.550 |
| 6 | 6 | Where I started from | 60.580 | 67.565 | 59.930 | 65.990 | -0.650 |
| 7 | 7 | Merge me back to main | 70.050 | 75.090 | 69.420 | 75.065 | -0.630 |
| 8 | 8 | Every road I ran becomes the one | 76.260 | 82.870 | 75.768 | 82.140 | -0.492 |
| 9 | 9 | Fold me in again | 84.200 | 89.245 | 83.550 | 88.535 | -0.650 |
| 10 | 10 | Nothing that I lived can come undone  (v1: Nothing that I lived is ever gone) | 90.100 | 100.395 | 89.460 | 99.920 | -0.640 |
| 11 | 11 | Branch... and wander... | 103.270 | 107.060 | 102.652 | 106.690 | -0.618 |
| 12 | 12 | Merge... and return... | 110.050 | 112.485 | 109.430 | 111.855 | -0.620 |
| 13 | 13 | Ahh... ahh... | 112.500 | 126.600 | 111.870 | 125.900 | -0.630 |
| 14 | - | One repo per agent  **(removed in v2)** | 136.250 | 139.945 | - | - | - |
| 15 | - | Per session, per life  **(removed in v2)** | 142.780 | 147.395 | - | - | - |
| 16 | 14 | This branch may never find the way | 181.730 | 186.895 | 182.000 | 187.185 | +0.270 |
| 17 | 15 | Back to the place where I began | 186.910 | 193.000 | 188.342 | 194.205 | +1.432 |
| 18 | 16 | And maybe something that I learned | 195.520 | 200.040 | 195.496 | 200.883 | -0.024 |
| 19 | 17 | Comes home to who I'll be again | 201.050 | 208.770 | 200.898 | 206.915 | -0.152 |
| 20 | 18 | Merge me back to main | 208.785 | 213.060 | 208.130 | 213.720 | -0.655 |
| 21 | 19 | Every road I ran becomes the one | 214.870 | 222.705 | 214.971 | 220.240 | +0.101 |
| 22 | 20 | Fold me in again | 222.720 | 228.500 | 222.632 | 228.395 | -0.088 |
| 23 | 21 | Every life I've lived, I have become  (v1: Nothing that I lived is ever gone) | 228.570 | 235.645 | 228.880 | 235.734 | +0.310 |
| 24 | 22 | Back to main... | 235.660 | 239.080 | 235.749 | 238.650 | +0.089 |
| 25 | 23 | Back to main... | 249.380 | 256.900 | 249.443 | 255.885 | +0.063 |
| 26 | - | Back to main...  **(removed in v2)** | 263.110 | 266.725 | - | - | - |


Changed lines, word by word (v2): 10 `Nothing 89.46, that 90.52, I 91.81, lived 92.06, can 92.67, come 93.03, undone 93.63-99.92` - 16 `This 182.00, branch 182.48, may 183.12, never 183.56, find 184.18, THE 185.30, way 185.86` - 17 `Back 188.34, to 188.71, the 189.04, place 189.33, where 190.10, I 190.57, began 190.76` - 18 `And 195.50, maybe 195.72, something 196.37, THAT 197.12 (held to 198.11), I 198.12, learned 198.42` - 19 `Comes 200.90, home 201.82, to 203.26, who 203.56, I'll 204.20, BE 204.38, again 205.01` - 20 `Merge 208.13, ME 210.96, back 211.19, to 211.74, main 212.12` - 23 `Every 228.88, life 229.62, I've 230.89, lived 231.16, I 232.05, have 232.27, become 232.71-235.73`.
For all line starts and for the changed words: the 4 CTC aligners plus whisper were cross-checked on the RoFormer-stem spectrogram/pitch/band-energy panels, and starts were corrected where they were late (`work_v2/overrides.json`). Independent onset spot check on 21 consonant-initial words (demucs stem): median |err| 25 ms, p90 80 ms, max 140 ms ("become", b closure).

## Time map v1 -> v2
- **No audio is shared sample-for-sample.** Normalised cross-correlation of 4 s windows is 0.08-0.38 everywhere; identical audio would give about 1.0. v2 is a new render with the same structure, so there is no region with a constant offset.
- The arrangement maps **bar for bar**: `t_v2 = interp(beat_index_v1(t_v1))` on the two `beat_grid.beat_times` arrays. Offset (v2 bar start - v1 bar start), every 8 bars:
  `1:-0.008 9:-0.201 17:-0.360 25:-0.476 33:-0.562 41:-0.617 49:-0.640 57:-0.638 65:-0.619 73:-0.592 81:-0.556 89:-0.516 97:-0.460 105:-0.389 113:-0.288 121:-0.144 129:+0.002 137:+0.132 145:+0.294 153:+0.453 161:+0.471`
  So v2 runs early by up to 0.64 s around bars 49-57, crosses zero at bar 129, and runs 0.47 s late by bar 161. The offset is smooth because it reflects only v1's accelerando against v2's constant tempo.
- Vocals under that map: Verse 1 through Breakdown (lines 1-13), Chorus 2 line 22 and the Outro sit at the same musical position within +-0.15 s (word median within 0.05 s). **Verse 2 is re-phrased**: line 16 is +0.66 s and line 17 is +1.79 s against the mapped v1 position, with later words up to +1.6 s. Chorus 2 lines 20/21/23 differ by -0.5 to +0.4 s at the line start. In those places use the v2 word times, not a mapped v1 time.

## Uncertain / watch
- Adlibs (in `lyrics.adlibs`, not lines): 23.2-28.5 is a low sustained tone (~D4) in both vocal stems before "I split". It is a hum or a vocal pad, and I can't tell which from the spectrogram. 173.08-180.9 is a flat-pitched wordless "ooh" in the drop with no consonants; it could be a vocal-chop or choir pad. Both are marked `lip_sync: false`. 238.66-248.97 is the wordless vocalise after the held "main" (`lip_sync: true`, as in v1).
- Lower-confidence words (+-0.1-0.3 s): line 18 "I"/"learned" (improvised legato, placed on the pitch drop and rise); line 19 "who"; "to"/"main" in both "Back to main" (the boundary between the "oo" vowel and the nasal is not visible; the wav2vec2 aligners were more than 1 s late there); the end of "return" / start of Ahh #1 (a musical boundary); and every word END on a held note.
- The vocals stay in the Pre-Chorus/Chorus pickups as in v1 ("And every" at 54.66 is 1.1 s before bar 33; "Merge" at 69.42 / 208.13 scoops in before bars 41 / 121).
