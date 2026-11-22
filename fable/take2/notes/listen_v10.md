# Listen agent, film v10 (section L of notes/v10_direction.md)

## Resume note
- Status: started 2026-11-22. Working on deliverable 1 (phrase maps).
- Code: `fable/take2/tools/listen/`. Outputs: `work_fable/take2/dev/v10_listen/` (git-ignored).
- Inputs: song `inputs/Merge (keychange down).wav`, stems `analysis_v3/stems/` (vocals = demucs, vocals_roformer), bar map
  `analysis_v3/timing.json` (beats, bars, events, aligned lyric words), cues `review/fable_take2/merge.en.srt`.
- 2026-11-22: deliverable 1 written (below). Next: 2 baseline on v9, 3 strip tool, 4 ear clips.

## How this was measured (deliverable 1)

- `features.py` caches whole-song features at 11.6 ms hop: RMS dB of the mix and of each stem (drums, bass, other, vocals
  demucs + BS-RoFormer), <150 Hz and >4 kHz band levels, mel onset strength, spectral flux, mel spectrograms of the mix and the
  RoFormer vocal stem.
- `phrase_map.py NAME T0 T1 [--marks t:label,...]` draws mix mel / vocal mel / stem dB / onset / SRT cues with bar lines (solid,
  numbered) and beats (dotted) from `analysis_v3/timing.json`, the aligned lyric words in yellow, and writes `events_NAME.json`
  (onset peaks with bar.beat and ms to nearest beat, vocal-stem phrase spans, per-beat stem levels and drop-outs).
  Images READ: `work_fable/take2/dev/v10_listen/spec_{catchA,catchB,outroA,outroB}.png`.
- Chord changes in the drumless tail: per-beat chroma (CQT) cosine change against the previous two beats (inline script, folded
  into `phrase_map.py` later if needed).
- Cue check: SRT starts equal the aligned word starts of `timing.json` lyrics to the ms for b113-b146 (both come from the same
  v3 alignment); the vocal-stem energy spans agree within 20-60 ms of word starts (breaths start 0.2-0.4 s earlier). So the cue
  times are current for this range, despite predating later picture changes.
- Grid caution: b153-b161 is interpolated (no rhythmic anchor, pads only). Bar lines there are not audible; the chord changes
  are, and they fall on b155.1, b157.1, b159.1 (measured, per-beat resolution, ~±0.2 s).
- Onset peaks on the beat read 20-30 ms after the grid line throughout (analysis frame centring); the grid (kick-fitted,
  2.8 ms rms) is the reference, not the onset peak.

## Catch phrase map (b114-b137, 3:16-3:55)

Bars: b114 195.842 | b117 200.982 | b120 206.110 | b121 207.819 | b122 209.526 | b123 211.231 | b124 212.935 | b125 214.637 |
b126 216.338 | b127 218.038 | b128 219.737 | b129 221.436 | b130 223.135 | b131 224.833 | b132 226.532 | b133 228.231 |
b134 229.931 | b135 231.632 | b136 233.335 | b137 235.038. Beat = 0.425-0.429 s here (140.0-141.0 BPM).

| song s | bar.beat | what (measured) |
|---|---|---|
| 195.84-200.98 | b114.1-b117.1 | Full groove: kick on every beat, sidechained bass pumping per beat, 8th hats. Vocal "And maybe something that I learned" 194.74-199.99, "Comes" 200.00 |
| 200.982 | b117.1 | Kick hit, then drums AND bass cut (both gone by 201.41 = b117.2): the stripped end of verse 2. Mix drops ~10 dB |
| 200.86-205.43 | b116.4-b119.3 | Vocal over pads only: "home" held 200.86-202.22; "to who I'll be again" 202.41-205.00, tail to 205.43. Breath/consonant spikes 202.43, 203.55 ("be"), 204.19 |
| 205.43-207.56 | b119.3-b120.4 | VOCAL SILENCE, 2.1 s (quietest stretch of the range, mix about -30 dB) |
| 206.11-207.39 | b120.1-b120.4 | Plucked notes on each beat of b120 (onset peaks 206.14, 206.57, 206.77, 206.99, 207.22), drum pickup at b120.4 207.392 |
| 207.580 | b120.4.44 | "Merge" voiced (breath 207.40-207.55): the vocal enters 239 ms BEFORE the bar |
| **207.819** | **b121.1** | **HIT: kick + bass return** (3.4x median). Drums are this one hit only (decay gone by ~209.5); bass and pads sustain |
| 209.526 | b122.1 | Quiet downbeat: no percussion, no onset; "Merge" still held (to 209.873); "me" 209.883 (+357 ms), "back" 210.122, "to" 210.696, "main" 211.000 (b122.4.47, 231 ms before b123.1) |
| 212.58-213.38 | b123.4-b124.2 | short vocal gap; "Every road I ran becomes the one" 213.80 (b124.3.04) - 219.67 |
| 219.665 | b128.1 (-72 ms) | "one" ends right on b128.1; vocal gap 219.67-221.35 |
| 219.74-221.44 | b128 | High-band riser (weak) into b129 |
| 221.353 | b128.4.80 | "Fold" voiced 83 ms before the bar, held to 223.54 |
| **221.436** | **b129.1** | **HIT** (drums + kick, 2.5x), drums decay out by ~223.1 (b130.1) |
| 223.135-227.806 | b130.1-b132.4 | THE TWELVE BEATS OF THE FOLD. Music: pads + bass only, NO percussion and no plucked pulse (other-stem onsets: none above 3x median from 219 to 228.4 except 225.30). Vocal "me" 223.552 (b130.2 -7 ms), "in" 224.101 (b130.3.27), "again" 224.530-225.890 (b130.4.28-b131.3.5). Vocal SILENCE 225.89-227.40 (b131.3.5-b132.3) |
| 223.135, 223.559, 223.984, 224.409 / 224.833, 225.258, 225.683, 226.107 / 226.532, 226.957, 227.382, 227.806 | b130.1-4 / b131.1-4 / b132.1-4 | fold beat times |
| 227.403 | b132.3.05 | "Every life I've lived, I have become": Every 227.403, life 228.241, I've 229.415, lived 229.743, I 230.576, have 230.776 |
| 228.48 | b133.1.6 | An 8th-note plucked pulse enters (other stem) and runs to b137: the first steady pulse since b121 |
| 229.506 | b133.4 | Bass out for the rest of the chorus |
| **231.210** | **b134.4 (+3 ms)** | **"become"** voiced, held to 234.143 (2.9 s, the longest held note of the range) |
| 231.632-235.045 | b135.1-b137.1 | Filter riser + drums building (snare crescendo from ~232.6, b135.3) |
| 234.158 | b136.2.93 | "Back" (to 234.597), "to" 234.607, "main" 234.811 held to 238.04 (tail 238.13) |
| 234.612 | b136.4 | Snare pickup |
| **235.038** | **b137.1** | **IMPACT: full drums + bass return** (6.0x median, the biggest hit since b105) |

Answers asked for:
- **Violet light arrival.** The only accented downbeat between b117 and b129 is **b121.1 = 207.819 s** (kick + bass return,
  with "Merge" voiced 239 ms before it). b122.1 = 209.526 is musically quiet: no hit; the sung word changes "Merge"->"me" at
  209.883 (+357 ms). Recommendation: streak ENTERS on the cut at b121.1 207.819 (the hit), head reaches its mark at
  **b122.1 = 209.526** (cut to cb02) if the arrival is to sit on the bar; nothing in the audio marks 209.526 itself, so the
  arrival will read as "on the bar" only through the cut. If the arrival should coincide with something heard, the nearest
  are "me" 209.883 and "main" 211.000.
- **Twelve folds (b130.1-b132.4):** times in the table. The music has NO beat marker under them (pads + bass, no drums, no
  pluck), and the vocal falls silent 225.89-227.40, so beats 8-11 (b131.4-b132.3) are the stillest audio of the catch. A
  per-beat fold imposes a pulse the song does not play there. Option: the merge could accelerate when the 8th pulse enters
  (228.48, b133.1.6). Ask Jade (ear clip E2).
- **"become": 231.210 s = b134.4 (+3 ms), held to 234.143.** NOTE: by the v9 shot table that is inside cb12 `patch_settle`
  (b134.1-b137.1), 1.28 s in, not at the end of the folds (b132.4 227.806, which is "Every" 227.403). If "the last letter
  sinks in on become", the merging must continue through cb11 to 231.21.
- **b137 impact: 235.038 (grid) / 235.045 (event)**; "Back to main" pickup 234.158 is sung across the cut.

## Outro phrase map (b137-end, 3:55-4:42)

| song s | bar.beat | what (measured) |
|---|---|---|
| 235.038-255.485 | b137.1-b149.1 | Steady four-on-the-floor: kick every beat, pumping bass, hats on the 8ths. Texture flat for 12 bars; 4-bar phrase lines b137, b141, b145 (b149 = section change) |
| 234.16-238.13 | b136.2.9-b138.4.3 | "Back to main" #1, "main" held to 238.04 |
| 238.13-247.76 | b138.4-b144.2.9 | NO VOCAL (9.6 s) |
| 247.762 | b144.2.86 | "Back" #2 (breath from ~247.6), "to" 248.150, "main" 248.270 (b144.4.05), held to 251.175, tail 251.48 (b146.3.6) |
| 248.673 | b145.1 | 4-bar phrase line, mid-"main" (+403 ms into the held vowel) |
| 251.48-260.82 | b146.3.6-b152.1.5 | NO VOCAL |
| **255.485** | **b149.1** | **Last kick; drums and bass OUT** (drum tail gone by ~257.2 b150.1); bright plucked arp alone, >4 kHz band up. The biggest texture change in the outro after b137 |
| 255.49-260.6 | b149-b151 | Arp alone; chords move each bar: G (b149.1) C (b150.1) D (b151.1 258.892, the strongest change here) |
| 259.74 | b151.3 | Drums creep back in (riser) |
| 260.818-264.301 | b152.1.5-b154.1.7 | Faint high sustained tone in the vocal stem (wordless, about -35 to -55 dB) |
| 261.02-262.30 | b152.2-b153.1 | Riser |
| **262.301** | **b153.1** | **Hit: kick + bass**, arp stops; pads + bass sustain (Am). Drums gone by 264.0 (b154.1) |
| 264.0-276.82 | b154-b161.3 | Pads only, no rhythm (grid interpolated). Chord changes, measured by chroma: **b155.1 265.712 (F, strongest change of the tail)**, **b157.1 269.126 (C)**, **b159.1 272.543 (G)**; nothing at b156.1 or b157.3 |
| **276.820** | **b161.3** | **FINAL HIT** (kick + last chord change, A), then sustain and fade; below -40 dBFS at 282.23 |

Where shot boundaries can fall (the cut points under discussion are all exactly on grid lines already):
- **oa06** 247.397-248.673 = b144.2-b145.1. Cutting it (C2): **oa05 runs 245.268-248.673 (b143.1-b145.1)**; the cut to oa07 on
  b145.1 is a 4-bar phrase line and sits 0.40 s into the held "main" (the vocal carries across the cut: good). Do not cut at
  b144.2 or b144.3, which would chop the "Back to" pickup.
- **oa08** 252.079-255.485 = b147.1-b149.1. Cutting it (C3): **ob01 graph starts 252.079 (b147.1)** (vocal tail ended 251.48,
  so the graph opens in a vocal-free bar). Inside the graph, **b149.1 255.485 (drums + bass out)** is the moment the picture
  should change state (e.g. the violet branch leaving / the graph going still), and the b151.1 chord change 258.892 suits the
  cherry-pick arc landing; label held from ~257.6 to the cut is 3.0 s.
- **ob02 log burst** 260.596-262.596: b152.1 to b153.1.7. The b153.1 hit (262.301) falls 0.3 s before the burst's end, so in
  v9 the credit card arrived just after the hit.

Recommended re-division (my numbers, all on chord changes or section hits):

| shot | from | to | length | music under it |
|---|---|---|---|---|
| oa05 day_fork | 245.268 b143.1 | 248.673 b145.1 | 3.41 | groove; "Back to main" pickup inside |
| oa07 wave_run (unchanged) | 248.673 b145.1 | 252.079 b147.1 | 3.41 | held "main" |
| ob01 graph | 252.079 b147.1 | 260.596 b152.1 | 8.52 | drums/bass out at b149.1 (+3.41 s); D chord b151.1 |
| ob02 credits (no burst) | 260.596 b152.1 | 265.712 b155.1 | 5.12 | riser; **commit line / card on the b153.1 hit 262.301**; drums gone 264.0; `git cherry-pick` typed b154 |
| ob03 road | 265.712 b155.1 | 269.126 b157.1 | 3.41 | F chord arrives on the cut |
| ob04 car | 269.126 b157.1 | 276.820 b161.3 | 7.69 | C chord on the cut; box types b157.1-b158.3 (2.56 s), read to **b159.1 272.543 (G chord)**, then **4.28 s clear on her face** to the final hit |
| ob05 window (unchanged) | 276.820 b161.3 | 282.800 | 5.98 | final hit, fade |

- If the car must be 8.5 s: start it at **b156.3 268.272** (8.55 s; road 265.712-268.272 = 2.56 s). That cut falls inside the
  held F chord with nothing audible under it (soft, not wrong). I prefer b157.1: every tail cut then lands on a chord change.
- Alternative for ob01/ob02: cut graph->credits ON the b153.1 hit (262.301; graph 10.22 s, credits 3.41 s). Stronger cut, but
  3.41 s is likely too short for card + commit line + typed command. Ear clip E4 asks.
