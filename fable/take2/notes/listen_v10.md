# Listen agent, film v10 (section L of notes/v10_direction.md)

## Resume note
- Status: started 2026-11-22. Working on deliverable 1 (phrase maps).
- Code: `fable/take2/tools/listen/`. Outputs: `work_fable/take2/dev/v10_listen/` (git-ignored).
- Inputs: song `inputs/Merge (keychange down).wav`, stems `analysis_v3/stems/` (vocals = demucs, vocals_roformer), bar map
  `analysis_v3/timing.json` (beats, bars, events, aligned lyric words), cues `review/fable_take2/merge.en.srt`.
- 2026-11-22: deliverables 1-4 done (below). Phrase maps sent to main; the compositor's working shots.js already uses the
  recommended outro cuts (b145.1 / b147.1 / b152.1 / b155.1 / b157.1 / b161.3).
- WAITING: v10 renders. When they land, re-run sections "Re-run on v10" below (film_energy + strips) and add per-event
  offsets (streak arrival, first letter in her hands, last letter closing, "become", each new outro cut, box finished, smile).

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

## Baseline on film v9 (deliverable 2)

Tool: `film_energy.py MASTER TAG [TABLE.txt]` decodes every frame at 192x108, computes mean |luma difference| and a
512-bin colour-histogram distance per frame, detects hard cuts (both jump far above their +-8-frame neighbourhood), pairs each
shot-table start with the nearest detection within 150 ms, and labels the rest "internal" (flash exits, wipe steps, type
slabs). It also cross-correlates the film's audio track with the song. Outputs in `work_fable/take2/dev/v10_listen/film_v9/`:
`energy.png` (one plot: visual energy, audio energy with drums and vocal stems, cut rate per 4 bars, sections), `cuts.md`
(every cut: frame, time, bar.beat, ms to nearest beat and bar, shot, ms vs table), `cuts.json`, `shots.json`.
The v9 table is `film_v9/table_v9.txt`, made from HEAD's shots.js (the working shots.js already holds v10 outro edits).

Measured:
- Audio track of `film_v9_local.mp4` = the song at **+0.0 ms** offset (film time = song time).
- **179 table cuts detected; 175 land within 17 ms (half a frame) of their table time.** 160 sit within 17 ms of a beat, 85
  on bar lines; the other 19 are deliberate off-beat 8th cuts (bb19-bb33 at b70-71, bu37-43, dr31-38) or transitions.
  The four "off" ones are soft transitions whose largest frame change comes 2-4 frames in (pc01 +91 ms, bu29 +53, dr11 +51)
  and dr01, see next point.
- **The drop (b89.1, 152.787) has no hard cut.** The last bu43 flash exits at 152.667 (120 ms before the drop); the change
  at the drop itself is weak (histogram distance 0.18 vs 0.4-0.9 for the flashes). Worth a look: the biggest impact of the
  first half lands on a soft picture change right after a hard one.
- **Life inserts with the pencil-hatch wipe (dr09-dr26) start on the beat but register 87-117 ms (2.6-3.5 frames) late**:
  the wipe begins exactly on the beat (black first frame), the image becomes legible 3 frames later. dr20: cut at +4 ms,
  legible +104 ms. This is likely what the v9 "dr20 +2.1 frames late" note measured; the cut itself is on time. If the
  intent is "legible on the beat", the wipe should pre-roll ~3 frames.
- **Flash inserts bu32-bu43 are exact**: 3-frame flash starting on the beat (strip `strips/chk_bu32_p00.png`).
- Table starts with no hard cut (dissolves/continuous): ib02 ib11 ib12 va04 va11 pc03 pc04 ba04 ba05 bu04 bu06 bu08 bu13 bu16
  bu19 bu22 bu30 dr02 dr23 dr30 vb09 vb10 cb04 cb05 cb06 cb12 ob01 ob03.

Picture vs music per section (vis = mean |dY| 0-255; cuts per minute from table cuts only):

| section | s | mix dB | drums dB (median) | vis | cuts/min |
|---|---|---|---|---|---|
| Intro | 0.0-28.1 | -23.4 | -83 | 2.3 | 26 |
| Verse 1 | 28.1-55.9 | -21.6 | -81 | 4.7 | 41 |
| Pre-Chorus | 55.9-69.7 | -21.9 | -82 | 2.2 | 13 |
| Chorus 1 | 69.7-97.5 | -19.9 | -78 | 5.5 | 22 |
| Breakdown | 97.5-125.1 | -20.1 | -48 | 6.5 | 82 |
| Build Up | 125.1-152.8 | -17.7 | -24 | 11.8 | 78 |
| Instrumental Drop | 152.8-180.4 | -16.3 | -18 | 10.6 | 76 |
| Verse 2 | 180.4-207.8 | -18.3 | -32 | 2.4 | 15 |
| Chorus 2 | 207.8-235.0 | -19.4 | -79 | 2.4 | 20 |
| Outro | 235.0-282.8 | -18.7 | -41 | 3.2 | 13 |
| verse 2 end b114-b121 | 195.8-207.8 | -21.4 | -65 | 1.0 | 0 |
| catch b121-b130 | 207.8-223.1 | -19.1 | -79 | 3.3 | 27 |
| folds + settle b130-b137 | 223.1-235.0 | -19.7 | -79 | 1.2 | 10 |
| outro groove b137-b149 | 235.0-255.5 | -15.7 | -18 | 4.7 | 21 |
| outro tail b149-end | 255.5-282.8 | -20.9 | -78 | 2.1 | 7 |

What the plot shows (read from `energy.png`):
- **Verse 2 is the clearest "picture quieter than the music"**: the mix is as loud as the build (-18.3 dB, full drums from
  b105) but the picture is as still as the intro (2.4) with 15 cuts/min. The essay's claim is true by measurement. b114-b121
  is the extreme: 12 s with no hard cut and vis 1.0, while b114-b116 is the full groove.
- **Breakdown b111-b124: picture far busier than the music.** Cuts reach 22 per 4 bars and vis 20-28 while the mix sits at
  -20 dB with drums only building from -45 dB (16th hats, snare crescendo). The picture runs ahead of the build.
- **Build Up and Drop: picture tracks the music**, rising into the snare build (b85-88, 25 cuts per 4 bars) and peaking at the
  drop; the one mismatch is the soft picture change exactly at the drop (above).
- **Catch (Chorus 2) is quiet in both**: no drums, the picture at 2-4. **The folds and settle (b130-b137) are the stillest
  picture of the back half (1.2)** while the music builds from b133 (8th pulse) and b135 (riser, snare crescendo) into the
  b137 impact: the picture does not rise with the riser; it jumps at b137 (oa01-oa02, vis 12-24).
- **Outro groove b137-b149 is busier than the rest of the outro** and matches the loud four-on-the-floor; after b149 (drums
  and bass out) the picture goes quiet with it. The re-division keeps that shape; the tail's visual spikes are the credits
  log burst (~261) and transitions.

## Strip tool (deliverable 3)

```
.venv/bin/python fable/take2/tools/listen/strip.py MASTER.mp4 T0 T1 NAME [--step 2] [--sec-per-row 1.0] \
    [--rows-per-page 8] [--thumb 160] [--marks "t:label,t:label"]
```
Every STEP-th frame, left edge at its presentation time, so each thumbnail sits over the audio it is on screen for; beneath
each row: mix dB (black), drums (red), vocal stem (green), onset strength (grey), beats dashed, bars solid and labelled, cyan
marks. Frame number and time on every 5th thumbnail. Frame-exact (checked against a full decode: the b87 flash starts on
frame 4480 = 149.333 in both). Output: `work_fable/take2/dev/v10_listen/strips/NAME_pNN.png` (likeness: never commit).

"Before" strips on v9 (rendered): `strips/v9_catch_p00..05.png` (196-238), `strips/v9_outro_p00..05.png` (235-282.8).
Read so far:
- v9 catch: the cut to the violet streak cb01 is on the b121 hit (+14 ms); the streak is a dot crossing the frame, not
  characters; the "MERGE" slab appears with the sung "Merge" (~207.6, ahead of the cut). cb02 cut at b122.1 (+7 ms).
- v9 folds: patches change on the beats b130-b131 (visible colour steps), "EVERY" slab appears ~130 ms after the word.
- v9 car: the box types from ~270.4 to ~272.3; her face comes into the box view around 272.3-272.6, i.e. about on the
  b159.1 G chord (272.543), which is where the v10 recommendation puts the clear hold.

### Re-run on v10 (when renders land)
```
node fable/take2/tools/shots.mjs --table > work_fable/take2/dev/v10_listen/film_v10/table_v10.txt   # same shots.js as the render
.venv/bin/python fable/take2/tools/listen/film_energy.py work_fable/take2/out/film_v10_local.mp4 v10 \
    work_fable/take2/dev/v10_listen/film_v10/table_v10.txt
.venv/bin/python fable/take2/tools/listen/strip.py work_fable/take2/out/film_v10_local.mp4 196 238 v10_catch --step 2 \
    --marks "207.819:b121 hit,209.526:b122,221.436:b129 hit,227.403:Every,231.210:become,235.038:b137 IMPACT"
.venv/bin/python fable/take2/tools/listen/strip.py work_fable/take2/out/film_v10_local.mp4 235 282.8 v10_outro --step 2 \
    --marks "235.038:b137 IMPACT,247.762:Back#2,255.485:drums out,262.301:b153 hit,265.712:F chord,269.126:C chord,272.543:G chord,276.820:FINAL HIT"
```
For a single event at frame precision: `--step 1 --sec-per-row 0.6 --thumb 110` over a 0.6 s window.

## Ear clips for Jade (deliverable 4): one question each, measurement cannot settle these

Cut by the compositor from the local v10 master with sound (likeness allowed locally only). Each with 2 s lead-in.

| id | film range | question |
|---|---|---|
| E1 | 3:24-3:33 (204-213) | The violet light arrives on the bar at 3:29.5 (b122), where the song has no drum; the only hit nearby is 3:27.8 (b121, "Merge"). Does the arrival feel like it lands, or should it land on the hit? |
| E2 | 3:40-3:53 (220-233) | The twelve fold in one per beat over a stretch with no beat in the music (pads only, her voice silent 3:45.9-3:47.4). Does the picture's pulse feel right there, or imposed? |
| E3 | 3:46-3:57 (226-237) | Does "I have become" (3:51.2, held to 3:54.1) feel like the moment the last letter sinks in, and is the hold before the 3:55.0 impact the right length? |
| E4 | 3:52-4:00 (232-240) | v10 settles the drawing into her likeness instead of a hard cut on 3:55.0, the biggest hit since 3:00. Does the impact still hit? (v9 vs v10 back to back) |
| E5 | 4:03-4:24 (243-264) | With the stance and aerial gone, the graph holds 8.5 s across the drums dropping out (4:15.5). Does it feel long, or does it breathe? Does the credit line land on the 4:22.3 hit? |
| E6 | 4:24-4:42 (264-282) | The road and car now cut on chord changes (4:25.7, 4:29.1) and her face holds 4.3 s from 4:32.5 to the final hit. Right length for the almost-smile, or too long / too short? |

## Measured vs waiting on Jade's ear

Measured (numbers above): every bar/beat/hit/drop-out/riser and sung-word time in b114-end; chord changes in the drumless
tail; the film's audio offset (0 ms); every v9 cut's offset from table, beat and bar; per-section picture vs audio energy.
Waiting on her ear (E1-E6): whether an arrival on a quiet downbeat reads as landing; whether per-beat folds over a
beatless passage feel right; whether a settle can carry the b137 impact without a cut; the outro's pacing and the face hold.
Nothing was sent to any outside service.
