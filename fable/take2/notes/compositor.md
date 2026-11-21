# Take two compositor: running notes (owner: compositor agent)

Resume from here. Plan: `fable/take2/PLAN.md` (sections 3, 5, 6, 9, 11). Proof it grew from: `fable/proof/NOTES.md`.

## Files

| file | what |
|---|---|
| `fable/take2/shots.js` | the whole shot table (PLAN section 6) as data; `resolveShots(T)` gives t0/t1 from `analysis_v3/timing.json` beats |
| `fable/take2/index.html`, `src/film.js` | the film compositor page; `window.FILM` for the harness; `?mode=lanetest` runs the written-lane test |
| `src/timing.js` | copy of the proof's timing loader plus `timingFrom()` (node) and `T.duration` |
| `src/proofscene.js` | the proof edit (bars 28-43) as a module: generated from `fable/proof/src/proof.js` by `tools/port_proof.py` |
| `src/lanes.js`, `src/lanetest.js` | written lanes (text along straight lines and curves) and test 7 |
| `src/paper.js`, `src/glyph.js` | NOT mine (effects agent). The film imports them inside try/catch. |
| `tools/render.mjs` | headless-Chrome harness (copy of the proof's): mp4 of any range, stills, frames, info; max 6 workers |
| `tools/shots.mjs` | prints the resolved table, counts, longest holds |
| `tools/proof_identity.py` | pixel diff of the film's bars 28-43 against the proof's own render |
| `tools/check.py` | cut error, single frame vs full render, type sizes, lyric word durations |
| `tools/render_film.sh` | animatic: full render, final encode under 100 MB, contact sheets |

Data (git-ignored): `work_fable/take2/` (`dev/` stills and info, `tests/` test outputs, `out/` renders, `tmp/` segments).

## How to render

```
node fable/take2/tools/shots.mjs [--table]                                # count and table
node fable/take2/tools/render.mjs --stills 29.0:/tmp/a.png,50:/tmp/b.png   # song time
node fable/take2/tools/render.mjs --frames 870:/tmp/a.png                  # film frame k = t*30
node fable/take2/tools/render.mjs --mp4 out.mp4 --range 28:56 --audio "inputs/Merge (keychange down).wav" --workers 6
node fable/take2/tools/render.mjs --info work_fable/take2/dev/info.json    # shots, sources found, lyrics, measured type sizes
```
Page query (`--q "a=1&b=2"`): `hud=0` (no debug corner), `v7=0` (v7 shots as cards), `paper=0` (v7 raw), `cards=1` (all non-proof
shots as cards), `proofbug=1` (proof range exactly as the proof renders), `plates=/dir1,/dir2`, `v7dir=...`.

## Source kinds (as built)

- `proof`: bars 28-43 call `makeProof()` (the proof's own code). Frames equal the proof's (below).
- `plate`: `work_fable/take2/plates/<id>/` first, then `work_fable/proof/plates/<id>/` (frames `f_%04d.jpg` from 1, `meta.json`).
  Clip time = `opt.clip0` + (t - shot start) * `opt.speed`, soft-capped before the last frame. Nearest frame by default; `opt.blend`,
  `opt.twos` (12 fps), `opt.still` (still.jpg), `opt.push` (zoom over the shot, default 0.03), `opt.zoom0`, `opt.fx/fy`.
  A plate with `"placeholder": true` in its meta, or no meta, counts as missing (card).
- `v7`: `work_fable/take2/v7/full/f_%05d.jpg` + `meta.json`; file number = round(t*30) (the v7 harness numbers from 0 at new time 0),
  valid while inside `[first, first+n)` (`first` from meta, else round(t0*30)). Outside, or not delivered: a card.
  If `src/paper.js` loads, v7 frames go through `paperPass(g, bitmap, rect, {paper, ink, seed, t})` (paper from `SECTIONS[sec].paper`,
  default black; ink = section colour; seed = 1000 + shot index).
- `card`: dark paper in the section colour, alternating tone per shot, slides in over 5 frames with a lane-colour edge flash;
  id, bars, times, source code and id, why it is missing, the Picture text (Archivo 50 px), "to do in code" overlays, a progress
  line with a tick per beat that pops on the beat. Lyrics in the strip under the card (y 640-1080).
- Overlays implemented: `chip:<text>`, `counter` (1 in bars 1-2, doubling every bar from bar 3 to 1,024 at bar 12, then held),
  `title:<text>`, `flash` (3 frames of a life plate at the head of a shot, bars 87-88).
- Lyrics: every line of `timing.json`, word by word on word times, punctuation stripped, held until min(end + 0.5, next line - 0.1)
  but at least 0.6 s after the last word starts. Chorus lines (ids 7-10, 20-25) as an Archivo slab (cap 105), others serif (cap 66).
  On full-frame sources: bottom, with a soft dark gradient. Inside bars 28-43 the proof draws its own lyrics.
- HUD (debug, `hud=0` off): bottom-right, bar.beat, section, shot id, effective kind, song time.

## Proof identity (2026-11-13)

`tools/proof_identity.py`: the proof rendered by its own harness vs the film at the same song times (13 frames: 0, 75, 130, 300,
400, 467, 470, 520, 560, 610, 650, 700, 779 from bar 28). With `proofbug=1`: max diff 0 on all 13. (Times must be passed with full
precision: `%.6f` gave 1-4 levels of difference from bar 38 on, where everything moves continuously.)
Default (fix on): differs only in rows 915-1037 on frames 300-560, which is the restored strip lyric.

**Bug found in the proof:** `fable/proof/src/proof.js` line 93: the assignments `TL.L5.out`, `TL.L6.out`, `TL.L7.out` sit inside the
comment at the end of the line, so the strip lyrics "And every branch remembers" and "Where I started from" have NaN alpha and are
never drawn in the proof renders. The proof is unchanged (as instructed); the film's port restores them (`fixStrip`).

## Written lanes (test 7)

`src/lanes.js` `drawWrittenLane(g, pts, {text, color, merge, cap, scroll, from, upto, alpha, under})`. Text runs along any polyline
(per-glyph transform from the path tangent). Far/near: `cap` may be a function of the arc fraction; where the cap is under about
6 px only a bright hairline is drawn, from 11 px the glyphs are fully on (smoothstep between). Merge 0 to 0.35: one row, the gaps
between commit messages close up; 0.35 to 0.7: a row above and a row below fade in; 0.7 to 1: the band fills with the lane colour
and the text turns to dark knock-out (solid colour at 1). Test page: `index.html?mode=lanetest` (`src/lanetest.js`, 14 s).
Outputs in `work_fable/take2/tests/lane/`: `lane_test.mp4` (14 s, no audio) and stills `lane_a_sparse`, `lane_b_dense`,
`lane_b2_dense_rows`, `lane_c_solid` (over the hero plate, with a perspective lane 40 px cap near to a hairline at the horizon),
`lane_d_curves`, `lane_e_curves_solid` (the bar 38 S-curves, each written with its branch and commit message), `lane_f_ladder`.
Checked by eye on the stills: readable at cap 13-40 px; the perspective lane thins to a line; curves read left to right (paths run
junction to node so the type is never upside down). Not checked: how it survives X's compression on a phone; at speed.
Not yet used in the film itself (the proof range keeps its own lanes; the bar 41 hero already has the proof's written lane test).

## v7 and the effect modules

- v7 full sequence delivered by the v7 agent: `work_fable/take2/v7/full/` (8484 frames, f_00000 = t 0, meta t0 0, n 8484).
- `paper.js` exists (effects agent) and loads; `paperPass` takes `ink` as an ARRAY of hex colours (the film passes every lane hue,
  or `SECTIONS[sec].ink`; the drop passes gold only: "gold and black"). Outro A is set to white paper (day). Stills checked:
  15.0 s (tree + MERGE title + counter) and 153.5 s (the kick against the sun): both drawn.
- `glyph.js` exists and loads; nothing in the film calls it yet.
- Paper/ink per section in the animatic (paper.js at commit 3b26997): every section black paper with all lane hues kept as inks
  (`ink` = MAIN + the twelve lane colours), except the Drop (black paper, gold `#FFB020` only: "gold and black") and Outro A
  (white paper; it has no v7 shot yet, so unused). Every V7 shot in the animatic goes through the paper pass; none is raw.

## Animatic v1 (whole film, PLAN section 11 step 1)

`fable/take2/tools/render_film.sh animatic_v1` then `.venv/bin/python fable/take2/tools/check.py work_fable/take2/out/film_animatic_v1_master.mp4`.
Master `work_fable/take2/out/film_animatic_v1_master.mp4` (CRF 16), review encode `review/fable_take2/animatic_v1.mp4` (x264 slow,
CRF 20 capped 2.4 Mb/s, AAC 192k), sheets `review/fable_take2/animatic_v1_sheet_01..05.jpg` (1 frame per second, 10x6, song time).
Whole film renders in about 9 minutes with 6 workers (about 16 fps).
Contents: proof in bars 28-43; v7 re-timed through the paper pass on every V7 shot (58); real plates where they exist (the proof
plates as flashes and the root, plus any plate an asset agent has put in `work_fable/take2/plates/`, e.g. `cross_wushu`); cards
for everything else. HUD on.

Lessons from the first full render (19:55): paper.js changed while it ran, so v7 frames of that render did not match frames
rendered later (the single-frame check caught it: max diff 229). Re-rendered with paper.js frozen at 3b26997. Also: lyric lines
faded for 0.3 s after their out time and overlapped the next line by 0.2 s on adjacent lines (seen on the sheet at 1:29, "FOLD ME
IN AGAIN" under "NOTHING"); now a line is opaque until out - 0.2 s and gone by out (out <= next line - 0.1 s, >= last word + 0.8 s).
A syntax error in a module hangs the harness for 5 minutes (no FILM.error); index.html now reports module errors.


## Shot table: ambiguities and how they were resolved

187 shots (0 to 282.8 s, 39.7 per minute). By section: Intro A 4, Intro B 12, Verse 1 21, Pre-chorus 4, Chorus 1 11,
Breakdown A 6, Breakdown B 34, Build 41, Drop 20, Verse 2 10, Chorus 2 14, Outro A 6, Outro B-C 4. Longest: credits 7.69 s
(b157 to b161 beat 3), grid 6.90 s, terminal 6.83 s, graph 6.82 s, last shot 5.98 s.

- Ids: section letters + running number (`ia`, `ib`, `va` verse 1, `pc`, `ca` chorus 1, `ba`, `bb`, `bu` build, `dr`, `vb` verse 2,
  `cb` chorus 2, `oa`, `ob`).
- Split rows: b10-14 into tree / one-beat flash on beat 3 of b11-14 (piano, wushu, ames, violet = "the dish") / tree; b15-16 into
  v7 swoop and `main_palm` on the last two beats; b20-23 four crossings; b28-32 the ten proof lives; b59-60 `float_face` then
  `float_top` + C; b63-64 C pulses then `float_hand`; b65-68 sixteen beats (three details then her face, per bar); b70-71 sixteen
  half-beats (the twelve details, then the first four again as a third crop); b73-76 stance on the bar line (1 beat) then git log
  (3 beats); b77-80 v7 / stance on beat 3 / v7; b81-84 two per bar (above, side); b87 one per beat and b88 two per beat, each
  opening with a three-frame flash of one of the twelve life plates (12 cuts = the twelve plates); b90-92 v7 then a two-beat insert
  on beats 3-4 of each bar; b93-96 one shot per bar (the "plus inserts" is not specified: none added); b97-99 the fall (b97) and
  MAIN from above with the rise (b98-99); b100 v7 then `drop_face` from beat 3 (the "ooh" at 172.54 s is just before beat 3,
  172.66); b101-103 v7 b101, insert 4 b102 beats 1-2, v7 (tornado) to b103 beat 3, insert 5 (landing); b107-108, b111-112,
  b113-115 one asset per bar as named; b122-123 `c2_lookup` then v7; b124-127 three K converge shots then v7 from above;
  b130-131 three patch stages (2 + 2 + 4 beats).
- b19: "K runners + C, or V7 seq 01": V7 (exists); K kept as `alt`.
- b149-152: "V7 seq 15 (labels enlarged) or C": V7 for now; enlarged labels are a to-do.
- Counter: "doubles each bar to 1,024 by b15" read with b3-8 = 2..64 from the table: it keeps doubling per bar (b9 128 ... b12
  1,024) and holds 1,024 to b16. Shown on b3-16 shots.
- V7 sources are all the one re-timed full sequence at the same song time; the table's v7 labels (seq 02, 2:32, ...) are kept as
  source ids. Consequence: cuts between two v7 shots (e.g. b81-84 "above" and "side") show no picture change until separate v7
  camera sequences exist. check.py lists them as "not hard cuts by design".
- First shot starts at t 0 (frame 0, no fade-in), although bar 1 is at 0.219 s. The last shot ends at the end of the audio.
- Lyric "Ahh... ahh..." (line 13) is drawn as "Ahh ahh" (rule 5: every lyric, no punctuation).

### Check results, animatic v1 (second render, 20:17)

- Size 63.0 MB (282.8 s, 1080p30, video about 1.6 Mb/s, AAC 192k).
- Cuts: 160 hard cuts checked; 157 within 0.5 frames; mean |error| 0.29 frames. Outliers, all explained: `bu37`, `bu39` (+2.8 fr)
  are bar 88 shots that open with a 3-frame life-plate flash: the detector takes the larger change at the flash's end; `pc03`
  (+1.9 fr) is the proof's own bar 38 transition; `bu16`, `bu19`, `dr01` show no clear change (v7 into a card or v7 to v7 where
  the paper pass changes little), error under 0.4 fr. 23 boundaries are not cuts by design (v7 to v7 on the one sequence; the
  proof's bar 37 turn and bar 39 iris).
- Type: verse lyric cap 66, slab cap 105, proof lyrics 67/70/106; every mono label font 24 px or more (card text 30-50 px).
- Lyrics: 23 lines, 121 words, none opaque for less than 0.6 s.
- Single frame alone vs full render: 11 frames (plate, cards, proof A/grid/merge, v7 + paper, last), max diff 0 on all.
- Looked at (all five sheets, by eye): no blank frames; every v7 shot shows v7 through the paper pass; lyrics present on every sung
  line, including the restored strip lines in bars 32-38. Not watched at speed with sound by anyone.
- Known: the bar 149-152 graph (v7) is sparse and its labels are not enlarged; v7 frames after about 279.8 s hold v7's last
  frame (unused: the last shot is a card); counter stays at 1,024 from bar 12.

## Step 2: bars 17-56 as a real section (2026-11-13, late; compositor agent, second owner)

What is wired (all in `shots.js` opts + `src/film.js`; proof-range changes in `tools/port_proof.py` -> `src/proofscene.js`):
- **Plates drop in.** A plate counts when `meta.json` (not a placeholder, with `n`) and either `REAL` or its last frame `f_<n>.jpg`
  exist (intake writes frames, meta, REAL in that order). No code change when a plate lands; boot-time check, so a render started
  before a plate lands keeps the card for that render.
- **Clip map** (`clipMap()`): `clip0`, `clip1` (play clip0..clip1 over the shot), `speed`. Nearest frame; frame blend only when the
  clip is slowed (speed < 1) unless `blend` is set. Defaults: main_split 0.5-3.5 s (1.73x), main_light from 1.5 s (the spark kindles
  at about 2.2-3.0 s), look_back from 0, main_back_wide from 1.8 s (she is small enough for the slab above her).
- **Crossings** (b20-23, `opt.cross`): `reach` = clip time she is through the doorway (measured on each clip: wushu 2.5, wetlab 3.0,
  ames 3.0, hacker houses 2.8), lands at `at` = 0.58 of the bar; speed = reach / (at x bar), capped at `maxSpeed` 1.5, the rest by
  starting later in the clip (so the clips do NOT start at 0: 1.5x running looked like the limit; set maxSpeed 3 to play from 0).
  From `at` to `end` (0.84) the doorway rect (`door`, plate fractions, measured on the clips at reach) grows (ease io3) to the frame
  plus 6 px, with the life plate (proof plate wushu / wetlab / ames / chezjj, from its 1.0 s) cover-fitted inside it, and a lane-colour
  edge that fades; after `end` the life plate is the picture. The rect overshoots the frame, so no edge of the old picture survives
  (the Step 0 one-frame dark edge came from the test script's resize rounding; nothing like it here, checked on stills).
- **Hero b41-42**: `hero_paper` (work_fable/take2/plates) replaces the proof's hero through `makeProof({dirs: {hero: dir}})`;
  nearest frame (`heroBlend` false). It has her in the centre, so: crop zoom 1.25 anchored left/top (fx 0, fy 0.05) puts her right of
  centre; the slab stacks one word per row (MERGE / ME / BACK / TO / MAIN) on the left, clear of face and hands; the written lane has
  a gap where her legs cross it (she passes in front of it). `?hero=old` gives the proof's first hero and its layout back.
- **Written lanes**: `opt.lane` on plates (`lane()`): hero_feet (main text, cap 34, just under the plate's own orange line at
  y 0.80-0.81), main_release (the rose/piano lane, cap 30, written behind the light along its measured path: `track` = light x per
  clip time, from the warmest point per frame). Lane points are plate fractions mapped through the plate's crop and push. The ten
  lives (b28-32, proof range): the lane line is now a written lane (cap 24, the life's commit message, the proof's colour wipe kept;
  `?prooflanes=0` restores the solid line). `?lanes=0` turns plate lanes off.
- **Bar 38**: each panel's last frame trails behind it as afterimages (5 per panel, from its place toward its node, lane-colour tint,
  fading out by the root iris). `?trail=0` off.
- **Lyrics per shot** (`opt.lyr` = {x0, x1, y, align, top}): a region with a soft dark cloud behind the words instead of the
  full-width bottom gradient; only the words sung before the shot's last 0.15 s are laid out there. Placements, checked on the
  clip frames: main_face left; crossings bottom-left; main_light top (over the chest); main_release bottom-left; hero_feet top (over
  the trousers); fold_reach right third (she is centred and the hand reaches to frame left; the clip differs from the still);
  fold_chest left; look_back left; b54-55 v7 left; main_back_wide top. A line that runs over several shots is re-set in each.
- **v7 in this section**: b19, b27, b45, b54-55 through the paper pass on black paper. b19 is cropped (`v7crop` [0.3, 0, 0.7, 0.7]):
  v7's own road lyric ("I SPLIT MYSELF", "CLIMBED ONTO TH...") runs big along the bottom left there. b27 and b45: no readable road
  text after the paper pass. b54-55: small text along the orange lane at her feet in the raw v7; illegible after the paper pass.
- **Runner kit b43** (kind `kit`): black paper, thirteen written lanes in perspective (far hairlines to near readable), runner_main
  (cut out with tools/matte.py into work_fable/take2/kit/runner_main) on main's lane in front, runner_pencil (the Step 0 cut-out
  in work_fable/take2/tests/kit/runner_pencil, from take t2 of that clip, not the plate's t1) on the violin lane; chip
  "runner kit 2 of 13 (partial)". A card until the first runner's cut-out exists. b46-48 stay cards.
- Proof identity (`tools/proof_identity.py`) after these changes: proofbug=1 still max diff 0 on all 13 frames.

Mistake to avoid: two edits put a `// comment` before the closing `);` of a shot line in shots.js and the page failed to boot (the
harness prints "module error ... shots.js:N"). Check with `node -e "import('./fable/take2/shots.js')"` after editing shots.js.

### Director's strip notes applied (same evening)
main_split 0.5-3.2 s; doorway entries wushu 3.5, ames 2.7, hacker houses 2.7, wetlab 3.0 (the wipe starts as she enters, so the
clip's white-out is never the picture); main_light 2.0-4.5 s (no extra rays drawn: the spark reads on stills); main_back_wide the
whole pull-out 0-3.0 s; cross_violet natural speed from 0 (uses 0-1.74 s, inside the 0-3 s asked); look_back from 0 (ends at
1.73 s, before the blink at 2.6 s); hero_feet from 0 (opens on a strike). **b43 is a card again**: runner_main take 1 is cropped
at the feet and is being retaken; the kit code stays, switched off by `kit.off: true` in shots.js (remove it, re-cut the new take
with matte.py into work_fable/take2/kit/runner_main, and b43 builds).

### Section 2 v1 render (bars 16-57, 26.35-99.19 s)
    rm -rf work_fable/take2/out/keep_section2_v1
    node fable/take2/tools/render.mjs --mp4 work_fable/take2/out/film_section2_v1_master.mp4 --range 26.35:99.187 \
      --audio "inputs/Merge (keychange down).wav" --workers 6 --crf 16 \
      --keep 870,1040,1095,1335,1600,1960,2130,2210,2330,2560,2900 --keepdir work_fable/take2/out/keep_section2_v1
    # review encode (CRF 20, capped 4.5 Mb/s) and 4 fps sheets (8x6): see the ffmpeg lines in render_film.sh, same flags
    .venv/bin/python fable/take2/tools/check.py work_fable/take2/out/film_section2_v1_master.mp4
2185 frames in about 110 s (6 workers). review/fable_take2/section2_v1.mp4 35.8 MB; sheets section2_v1_sheet_01..07.jpg.
check.py: 36 hard cuts, mean |error| 0.33 fr, 35 within 0.5 fr; the one outlier is pc03 (+1.89 fr, the proof's own bar 38
transition, as in the animatic). Type: all rule-5 sizes pass (verse 66, slab 105, proof slab 106; written lanes in this section
cap 24-34, font 33-47 px). Lyrics: no word under 0.6 s. Single frame vs full render: 11 frames, max diff 0.
Known: a region lyric does not lay out a word sung in the last 0.15 s of a shot (it appears on the next shot's first frame
instead; check.py's word-duration check does not see this). The "Merge me back to main" slab re-sets at bar 43 (card strip) and b44
in its own layout after the proof's stacked one. The 4 fps sheets' timestamp box hides the top of top-placed slabs (sheet only).
Nobody has watched it at speed with sound.

## Section 2 v2: the runner kit, fusions, one runner, the fan (2026-11-13, night)

- `src/kit.js` (new) draws kind 'kit' shots; per-runner data in `fable/take2/kit.json` from `tools/kitstats.py` (matte bbox, head x,
  whether the clip cuts the figure, step period, strike frames). Measured step: 7-10 frames (chezjj 7, wushu/phd/poet/ames/band/
  violin/piano/home 8-8.4, wetlab 9, main 9.6, violet 10). Unison: clip frame = a strike frame + (measured beat position) x step,
  so every runner strikes on every beat (wrapped by whole strides inside the clip). Nearest frame.
- Cut figures (wushu, phd, poet, ames, band, main, violin): drawn at a full-figure scale with a visible fraction (VIS in kit.js),
  the bottom 16% faded out, and their lane laid where the visible figure ends, so legs go behind the lane text (fixes v1's pencil cut edge).
- Open source (sandstorm): main's cut-out through glyphPass (real JetBrains Mono, its commit messages, cyan ramp), placed far
  (lane 2 of 13), small.
- b43 'row': 13 lanes far to near, main in front; no chip. b46-47 'fuse': 8 lives, fusions on beats 0,1,2,3 (8->4) and 4,6 (4->2);
  converge in half a beat, split runner (diagonal line through the head, A left / B right) for one beat, then whole in A's medium;
  lanes bend into each other at the junction (scrolling right behind them) and text density follows how many lives a lane carries
  (merge 0.12 / 0.45 / 0.78 / 1). b48 'one': main large, a horizontal band of another life's cut-out inside her matte per sixteenth,
  never above 20% of her height (face), shrinking and fading over three beats; beat 4 clean; the lane under her is solid (merge 1).
- b51-52 fan (`opt.fan`): fold_chest matted (work_fable/take2/kit/fold_chest); twelve copies of her own matte, tinted in each life's
  colour, rotated about a pivot at her hips; open over beat 1, one folds in per half beat from beat 1.5, colour flash on her outline;
  she is redrawn on top, so her face is never covered. Lyric for that shot moved to a bottom band.
- Fixes: a region lyric now lays out every word sung inside the shot (on its word time); main_back_wide shows only the held
  "UNDONE" (opt.lyr.tail 1) in one row at the very top, above her head.
- b54-55 thumbnails and commit nodes: NOT done (v7's roads move under the paper pass; placing windows on them needs a track; left).
- Render: same as v1 with `section2_v2` names (keep frames 870,1040,1335,1960,2130,2215,2365,2465,2630,2900). 38.2 MB.
  check.py: 36 hard cuts, mean 0.33 fr, 35 within 0.5 (pc03 +1.89, the proof's bar 38); type all pass; no word under 0.6 s;
  single frame vs full render 10 frames max diff 0. Proof identity with proofbug=1 still 0.

## Section 2 v3 and the orchestra v1 (2026-11-13, late night)

Section 2 fixes:
- b51-52 fan: the fold flash is now a rim pulse BEHIND her (her silhouette in the life's colour, blurred, offset 6 px four ways,
  drawn under her), and she is drawn on top in her own colours: face and hands are never tinted. The copies behind stay tinted.
- Kit geometry (kit.js `geo`): depth p -> f = (p/(n-1))^2.4; figure height lerp(0.10, 0.86) H, lane (end of the visible figure)
  lerp(0.50, 0.985) H, head = lane - visible part. Front four in b43 (poet, phd, wushu, main) are large on the right, main in front
  with her head near the top; the far ones small and low. Slab region narrowed to the left (x 0.03-0.48), so it stacks into more rows.
- b46-47 fuse: fusions now land on half beats (0.5, 1.5, 2.5, 3.5, 4.5, 6.5 beats from the shot start). Each pair comes to the front
  over [bt-1, bt-0.5], converges (lanes join) over [bt-0.5, bt], is split for [bt, bt+1], then steps back over [bt+1, bt+1.5] to its
  rank; front x alternates between two slots (0.64, 0.86). Runners standing back are packed one depth apart just behind the front.

Orchestra (b81-84):
- shots.js: eight V shots on the bar and beat 3 (names from notes/orchestra.md rev 2), `opt.v7dir: '/work_fable/take2/v7/orchestra'`;
  shot 8 holds one beat into bar 85 (to bar 85 beat 2, the hit), seq 09 then starts on bar 85 beat 2.
- film.js: per-shot v7 folders (V7S map, loadV7 at boot); `opt.paperLook: 'orch'` with `?orchpaper=solid|light` (default solid):
  - solid: paperPass with { levels [0.2, 0.62], gamma 1, solid 0.6, layers 2, hatch 12, thresholds [0.2, 0.45, 0.7], inkSat 0.12,
    ink + pale blue #9FC3EA }. The orchestra agent's suggestion alone left the jackets hatched (the 99.5th-pct level is the sky's
    horizon glow); explicit levels made the backs solid light shapes. The disc comes through as a flat pale blue where it is large
    enough (shots 3-6); in the wides (1, 7, 8) it is too small.
  - light: the raw v7 frame, plus paperPass's contour only (skip 'h') added with 'lighter' at 0.6, then the film's grain/vignette.
  - paper.js is unchanged (options only). Three non-orchestra v7 frames (film 4000, 4530, 6000) re-rendered: identical to the
    animatic v1 keep frames (max diff 0).
- Renders (range 137.237-147.606, bars 80-85, sound): work_fable/take2/out/film_orchestra_{solid,light}_master.mp4;
  review/fable_take2/orchestra_v1.mp4 (solid, 18.2 MB) and orchestra_v1_light.mp4 (18.3 MB) (x264 crf 20 capped 13 Mb/s: the boil
  needs the rate); review/fable_take2/orchestra_v1_sheet.jpg (shot middles, solid | light).
- check.py treats the eight as one v7 sequence (no hard cuts by its rule); measured by hand on frame differences: cuts at
  +0.05..+0.58 fr (the v7 render's own camera cuts, from the warped time), the b85 beat 2 cut -0.30 fr; light variant's b81 cut +1.05
  fr (weak change into the orchestra). Single frame vs full render: 6 frames each, max diff 0.
- What reads (stills): solid: 2, 3, 4, 5, 6 (white backs as solid shapes, disc blue in 4-6, instruments as lane-colour lines);
  weak: 1 (streak firework of arcs), 7 and 8 (dense wides become a field of marks; the fan shape reads in 7), and the sky's horizon
  glow is hatched in every low shot. light: all eight read as pictures, but it is close to the raw 3D (purple trousers, blue sky
  gradient, shading): it breaks "v7 never raw" in spirit; 1 still a firework.

## Step 3: intro (b1-16), breakdown (b57-72), build (b73-88) (2026-11-14, night)

- **Still-only plates** (meta {"still": true} + still.jpg) count as plates; drawn from still.jpg with the shot's push (det_* 4-5 %,
  stances 4 %). STANCE ids are now stance_bow, stance_horse, stance_drop, stance_drop2 (no true empty stance).
- **Intro A**: root b1-2 as before (clip from 1.0, frame 0 no fade-in, chip); root_fork from clip 1.15 at 1.05x (the fork into two on the
  bar 3 line, branching on through bar 4); root_face clip 0-3.0 (before the blink), counter on the LEFT (her face is right);
  root b7-8 from clip 2.0 at 0.85x pulling back, twelve frost tips (`opt.tips`, plate fractions measured on root frame 84) glow in
  the lives' lane colours one per half beat from beat 2 of b7. Counter 2..64 on b3-8 as before.
- **Intro B**: no counter from b9 (the v7 tree cannot be matched to a doubling count: the coordinator's fallback). MERGE title b9,
  flashes on beat 3 of b11-14 as before (piano, wushu, ames, violet: the table's "the dish"; the coordinator's message said sandstorm,
  the PLAN row says the dish: kept the PLAN), main_palm clip 1.0-3.0 for the last two beats of b16.
- **Breakdown A**: float_top with written strands (`strands()`, FLOAT in shots.js): twelve strands from 70 % of the way head->hair end
  straight to the frame edge, each written with its branch name and commit message (cap 22, under-band). The clip turns and pulls
  back, so the strands follow the similarity that maps head+left foot at clip 2.0 s to head+foot now (FLOAT.track, measured at 0, 2, 5 s).
  Modes: grow (b57-58, written out over 3 beats), double (b60, each forks in two), rotate (b61-62: plate and strands turn 7 deg and
  pull out 20 %; the piano plate as a window glides inward along the piano strand), pulses (b63, one per sixteenth, light runs home
  along each strand). float_face b59 (lyric bottom left), float_hand clip 1.0-3.5 (the light arrives at about 2.5 s).
- **Breakdown B**: det_* one per beat b65-68 with the life's commit message written under it (cap 28, writes on in 0.12 s); float_face
  every 4th beat, clip 0.5/1.3/2.1/2.9 + 0.43 s (never past 4.0: eyes open at 4.1); rise b69 from 0 (it ends at 1.73 s, before the
  bloom and smile); b70-71 the details again two per half beat with new crops (zoom 1.55, then 2.1 for the last four) and a 2-frame
  white flash on beats 2 and 4 (the snare); b72 kind 'code' tiles: the twelve tile in on sixteenths (4 x 3) and collapse to a point.
  Lyrics in b65-71 at the top (details) / bottom left (face).
- **Build**: b73-76 stance stills on the bar line (one beat, 2-frame white flash), then `gitlog()` (kind 'code'): real messages from
  proof/lives.js + main, branch names, hashes from hashOf(id#n), graph columns; rows scroll at 2, 4, 8, 16 per beat, a faint pop on each
  beat; mono 34 px. No glyph pass (plain text read better and stays real). b77-80 v7 + stance on beat 3; b81-84 orchestra (solid);
  b85 seq 09 from beat 2 (orchestra holds into it); b87-88 the flashes as before.
- Renders: section1_v1 (0-29.823 s, bars 1-17) 15.5 MB, 3 sheets; section3_v1 (95.727-154.514 s, bars 56-89) 33.9 MB, 5 sheets.
  check.py section1: 14 hard cuts, max 0.45 fr, mean 0.27; section3: 65 clear cuts mean 0.33 fr, outliers bu37/bu39 (+2.8 fr, the
  3-frame flash ends, as in the animatic); "no clear change" on bb16, bb22, bb31 (similar crops or face to face), bu09 (stance into
  v7), dr01. Type, lyrics pass; single frame vs full: 7 + 12 frames, max diff 0.

## Step 4: drop (b89-104) and verse 2 (b105-120), plus section 3 v2 (2026-11-14, night)

Section 3 v2 fixes: b72 tiles in on sixteenths and holds, then on the last sixteenth (beat 3.75) snaps to a point with a 2-frame flash
and a dying bright point (no tween); float strands start at the measured hair ends and carry only the branch name, sparse (merge 0);
b14 flash stays violet. Note: section3_v2 was rendered before the drop's gold stroke, so its last bar (b89) shows the old chalk marks.

Drop: SECTIONS.drop gets `stroke: '#FFC23A'` (passed to paperPass as its neutral mark colour) with black paper and ink ['#FFB020']:
every mark is gold on black (effects test 8's sunrise recipe; before, the neutral marks were chalk cream). drop_hero_1..3 (b90-92
beats 3-4) and 4, 5 (b102 beats 1-2, b103 beats 3-4): still-only, push 3.5 %, 2-frame white flash on entry. drop_face on b100 beats
3-4 from clip 0 (eyes closed; push-in is the clip's). The wordless "ooh" (172.54, not a lyric line in timing.json) is an overlay
`adlib:ooh:172.54` on both b100 shots, verse serif cap 66, at (0.82, 0.86) on drop_face (black, clear of her face), bottom centre on
the v7 shot. No other type in the drop.

Verse 2 (lyrics cream, in the sky; chips as the rows):
- vio_wide: violet lane written sparse (branch message 'listened to hydrogen', cap 20) on the plate's violet line, measured on the clip.
- vio_walk: lane on the bottom line (cap 22), lyric left; vio_close clip 0-1.7 (before the blink), lyric left; vio_lookback clip 0-2.5
  slowed (the sunrise stays a sliver), lyric top right; vio_climb whole; violet as before; vio_pencil clip 2.3-4.0 (ends on the pencil
  held up), lyric right.
- Handwriting (`src/script.js`): "docs: start here" as single-stroke cursive I drew by hand point by point (one pen path per letter,
  joined as cursive, Catmull-Rom smoothed, small per-letter irregularity, colon dots and t bars as separate strokes after their word),
  revealed along its arc length with a pen-point glow; violet glow + pale core. Placed in the sky below the chip, ending near her
  pencil tip (it drifts in the clip; the line does not track it frame by frame). x-height 0.045 H.
- vio_release: the finished line lifts off from the shot start and travels a quadratic arc up and over (top at 0.04 H) to the sunrise
  sliver (0.93, 0.5), shrinking, with a trail; on the b117 downbeat a 2-frame violet-white flash and a glow on the horizon (the hit).
- vio_still: her matte (tools/matte.py -> work_fable/take2/kit/vio_still; the matte also takes the dish, so only x > 0.55 counts):
  stars appear along her outline (more through the shot), her figure dims toward the sky (to 55 %), the sky's brightest star cells get
  twinkling glints. Chip "detached, not merged".
- Render: review/fable_take2/section4_v1.mp4 (151.06-209.526 s = bars 88-121, 32.3 MB), 5 sheets. check.py: 30 clear cuts, mean
  0.41 fr; outliers bu37/bu39 (+2.8 fr, the flash shots as always), dr01 no clear change (v7 into v7 at the drop); type and lyrics
  pass; single frame vs full 11 of 11 identical.

## Step 5: chorus 2, outro A, outro B-C; section 4/3 fixes; the whole film v1 (2026-11-14, night)

Section 4 fixes (section4_v2):
- vio_still: she stays at full brightness; star points break off her outline (each edge cell at its own moment over the three bars),
  drift outward from her centre 25-95 px and twinkle among the sky's stars. Her alone: the matte (which also took the dish and its ring)
  is clipped to a hand-set polygon round her (`settle.poly`, knees and feet included).
- Handwriting: new d, o, r, e (closed bowls, "here" with an open e and a clear r); x-height 0.04 H; the pen point of the ink sits on
  the pencil tip measured per 4 frames on vio_write (yellow pencil body's left end; `HAND.track`); on vio_release the line starts where
  it ended (clip 3.46 s position) and lifts off.
- section3_v3: re-rendered so b89 has the gold marks.

Chorus 2:
- c2_lookup cropped left (zoom 1.35, fx 0): the clip has a stray arm at its right edge; slab right.
- b124-126: kit 'row' with `conv`: runners (mirrored when coming from the left) run in toward main over the bar, accelerating, and fade
  into her in the last fifth; main hNear 0.6 so her head sits under the slab.
- b130-131 'fold' (src/outro.js): night_jade still; patchwork2's figure aligned by the two cut-outs' bounding boxes (both matted with
  tools/matte.py into work_fable/take2/kit/night_jade, patchwork2) shows through twelve patch cells (nearest-seed cells over the figure
  box), one more per beat for four beats then per half beat; each new patch flashes its life's colour. Black paper kept to b132.
- patch_hold b132-133; patch_settle b134-136 at clip 0-4.95 slowed (blended), lyric left of her.
Outro A:
- like_sing1/2 (code 'L'): used if work_fable/take2/plates/like_sing1|2 exist locally; `?likeness=0` forces the cards. Every committed
  review file is rendered with likeness=0.
- b139-142 'town': white paper, two pencil hill lines (parallax 0.18, 0.32), the twelve facades (matte.py cut-outs; sandstorm by a
  hand-written key keeping its black board) along the road at 0.3 W spacing, 1050 px/s, a chip (26 px) with the branch name under each,
  the road = main's written lane, merge 0.82 (dense). b141-142 continues the same travel with day_run's cut-out in front.
- day_fork + forks(): pencil branches continue from eight tip points of the plate's tree. b147-148 'aerial': pull-back (zoom 1.5 to
  0.62), the road written, the facades small on both sides, pencil forks growing at the road's end.
Outro B-C:
- b149-152 'graph': white paper, main + the eleven lives as branches merging into main (labels 28 px), revealed left to right over two
  bars; bar 151 the violet branch leaves and its dot; bar 152 a dotted arc forward to main, "cherry-pick docs: start here".
- b153-156 'terminal': the real `git log --graph --format="%h %s"` of fable/merge, captured into fable/take2/data/gitlog.json (199 lines,
  messages cut at 86 characters), scrolling over 7.5 beats; then "$ git checkout main" typed on beats, "Switched to branch 'main'",
  "$ git merge" typed on beats. Mono 34 px. 6.83 s.
- b157-161 'credits': commits, one per beat. **PLACEHOLDER wording from PLAN section 10 item 3, not approved by Jade.**
- b161.3-end root_light; the last 1.5 s cross to the film's own frame 0 (rendered at t = 0 into a cache): checked, the last frame (8483)
  equals frame 0 with hud=0 (max diff 0).

### Director's Step 5 clip notes applied; renders (2026-11-14, ~01:10)
c2_lookup clip 0.3-3.5, zoom 1.19 anchored left (left 84 %: the stray arm never shows), the violet light drawn in code (`comet`, from
the upper right toward her, arriving on the b123 downbeat), slab right; catch from clip 0; day_run cut-out drawn without its outer 2 %
(`runner.edge`); root_light clip 2.5-5.0 slowed and blended (hand and light never touch), crossing to frame 0 over the last 1.5 s.
Likeness (oa01, oa05): `opt.songLock` plays like_sing1/2 at natural speed locked to song time (meta t0_song); `?likeness=0` = cards.
Checked locally that oa01 draws the plate without the flag; every committed file uses likeness=0.
- section5_v1 (206.11-282.8, bars 120-end, likeness=0): 34.8 MB, 7 sheets. check: 19 clear cuts, max 0.49 fr, mean 0.20; no clear
  change on cb04 (v7 into the converge kit: both dark), oa03 (town into the same town travel with the runner: by design a continuation),
  oa04 (day_run into day_fork: both white paper); type and lyrics pass; 13 of 13 single frames identical.
- film_v1 (whole film, likeness=0, HUD on): master work_fable/take2/out/film_film_v1_master.mp4 (444 s render, 6 workers); review
  encode review/fable_take2/film_v1.mp4 76.0 MB (x264 slow CRF 20 capped 2.3 Mb/s, AAC 192k); sheets film_v1_sheet_01..05 (1 fps).
  check: 153 clear cuts, mean |error| 0.29 fr, 150 within 0.5; outliers pc03 (+1.89, the proof's bar 38 move) and bu37/bu39 (+2.8,
  the 3-frame flashes); type and lyrics pass; 15 of 15 single frames identical. check.py names the tag 'v1' for film_film_v1 (keep dir
  symlink keep_v1 -> keep_film_v1).
- Counts: 185 shots; effective in film_v1: 93 plate, 57 v7, 15 proof, 12 code, 6 kit, 2 cards (the likeness shots, by the flag).
  Longest holds: credits ob03 7.69 s, the grid pc01 6.90 s, terminal ob02 6.83 s, graph ob01 6.82 s.

## Film v2 (2026-11-14, compositor; brief: notes/v2_direction.md section A, Jade's notes: notes/jade_v1_notes.md)

Plates from the other two agents (vio_write2, vio_release2, wave_run, stance/insert clips, orch_1..8, retakes) drop in by folder as
before (`work_fable/take2/plates/<id>/`); until they land the current source is used. Item 9 (wiring them, the film v2 render) waits
for the director's message. Nothing of film v2 rendered whole yet.

Done:
1. Lyrics: lines made only of vocables are not drawn (film.js `VOCABLE` filter in buildLyrics: line 13 "Ahh... ahh..."); the b100 "ooh"
   adlib overlays removed from shots.js (the overlay code stays, unused). Line 12 now holds to its own end + 0.5 s (its next line was 13).
2. Lives: fable/proof/lives.js `home` branch `jade/parenthood`, `band` branch `jade/rna-band` (ids unchanged). Drawn everywhere from
   lives.js (proof chyrons and grid labels, kit lanes, git log, town chips, graph). `jade/1420-mhz` unchanged.
   Proof identity after the change (`.venv/bin/python fable/take2/tools/proof_identity.py`): proofbug=1 max diff 0 on all 13 frames
   (the proof imports the same lives.js). Film vs its own pre-change render: frames 400, 467, 470, 520 (the grid, bars 33-37) differ
   only in x 1085-1919, y 497-825 = the band and home cell labels; every other frame identical. (The old band label ran off its cell.)
3. Credits (outro.js credits, shots.js ob03): "animated by Fable 5.2 and Opus 5.5, with a supporting cast of models" (wraps after
   the comma onto a continuation row with a graph `|`; credits now wrap any message wider than the frame); plates line
   "Nano Banana Pro, GPT Image 2.5" (spend log: google/nano-banana-pro and openai/gpt-image-2.5-sunburst). Placeholder note removed.
7 (part). Graph b149-152 dotted arc label: `cherry-pick HANDOFF.md`.
8. b145-146: plate `wave_run` (P, push 0.02); a card until it lands. like_sing2 no longer used. First likeness shot unchanged.
Stills: work_fable/take2/dev/v2/{credits,graph,ahh,b100}.jpg, check_lives_grid.jpg (before above, after below).
2b. (coordinator, later) violet's branch `jade/1420-mhz` becomes `jade/rare-earth` (Jade's pick) in lives.js and the three verse 2 chips
   in shots.js (`● jade/rare-earth  ctx 97% / 99% / 100%`); everything else reads lives.js. The id `violet`, its message and the
   painted "1420 MHz" sleeve patch stay. Proof identity re-run: proofbug=1 max 0 on 13/13; film and proof vs their pre-v2 renders
   differ only in x 1085-1919, y 497-825 on frames 400-520 (grid labels: band, home, violet cells).
4. Town (b139-142, outro.js town, `TOWN.dir: 1`): the world slides RIGHT (day_run's cut-out faces frame left, unmirrored). Facades
   start at 0.22 W and enter from the left, piano first (life order kept in time; in frame they stand right-to-left); hills parallax
   reversed; road text scrolls right at ground speed and still reads left to right (path starts 3 glyphs off-frame: a negative
   scroll leaves one empty glyph cell at the start). She moves to x 0.58 (lead room on the left, the way she runs). `dir: -1` = v1.
   Checked: 6 stills (dev/v2/town_sheet.jpg) and the clip dev/v2/town_v2.mp4 (238.45-245.27) as a 3-frame strip of the road
   (town_road_strip.jpg): facades, road and chips move together, about 35 px a frame.
5. Bars 54-55 (ca10, film.js `windows()`, shots.js `NIGHT_WIN`): built on a FIXED HORIZON BAND, not on tracked roads (the v7 roads do
   not survive the paper pass well enough to track; the raw horizon is a clean line, measured per 6 frames on v7/full 2766-2874:
   y 0.4602 at 92.2 s to 0.4324 at 95.8 s, linear). Twelve 16:9 windows (h 0.042 H) in life order, nine left of her and three right
   (her figure is x 0.64-0.80), bottom on the horizon, each playing its life plate (proof plates, cropped on her via meta focus, zoom
   1.7) from clip 0.6 s, with a broken reflection under it. Each waits dark (alpha 0.16) and lights when its commit node locks on:
   locks at beats 0,1,2,3 then 4,4.5,...,7.5 from the shot start (all twelve in two bars, the b130-131 rhythm); a ring closes in over
   the quarter beat before, a lane-colour flash, a node with a light stem. Lyric for this shot: `tail: 4` ("LIVED CAN COME UNDONE",
   three rows under the horizon): with the whole line the slab's rows crossed the horizon and the windows (tried, looked bad).
   Checked: stills dev/v2/n54_{a,b,c}.jpg and the clip dev/v2/night_v2.mp4 (91.9-96.1 s) as a 9-frame strip (night_strip.jpg).
6. The fold, b49-50 (ca07 is now kind 'code', `src/mapfold.js`, shots.js `MAPFOLD`; fold_reach no longer used). The twelve life plates
   (proof plates, playing from clip 0.3 at 0.6x so no one turns) as the pre-chorus grid (same order) on one cream paper sheet, cells 420
   px (pre-chorus 470: the smaller sheet keeps the two-row slab FOLD ME IN / AGAIN under it). Every fold is a VALLEY fold toward the
   lens (first try: mountain folds away from us read as a sliver vanishing, not as paper). A flap is drawn in 56 strips parallel to the
   crease, each at its rotated 3D place with perspective (D 1500 px), shaded by how it faces the lens, its crease side in its own
   shadow; it casts a deepening shadow on the cells it lands on; it accelerates (th = pi p^2 (1.6 - 0.6p) over 0.55 beat) and lands
   ON the beat with a lane-colour crease flash (the colours of the cells folded in). Folds land on b49.2 (col 4 onto 3), b49.3 (col 1
   onto 2), b49.4 (col-2 stack onto 3), b50.1 (row 3 onto 2), b50.2 (row 1 onto 2). Undersides are the backs of the pictures, like
   photographs: cream paper, the picture's ghost through it, the life's colour rule, branch (mono 27 px at sheet scale), hash, and the
   commit message in Instrument Serif. Face-up tracking: the bottom of every stack is the cell that started there, so a stack folding
   P onto Q leaves the back of P's own cell face-up. The last flap's underside is her (fold_chest frame 0). The sheet re-centres after
   each landing (drift 0.9) and the camera closes in as it shrinks (fit 0.8 W x 0.62 H, max 2x); b50.2.6 to b51 the last panel grows
   to the full frame; b51 (fold_chest from clip 0) matches it (checked: last frame of ca07 vs first of ca08 are the same picture, the
   slab in the same place). Creases scored bright on the b49 downbeat. Nothing covers her face (slab rows at y 0.69+, her face ~0.2).
   Checked: stills sheets dev/v2/fold/f2_sheet.jpg (valley v1), f3_sheet.jpg (with zoom), clip dev/v2/fold_v2.mp4 (83.3-88.0 s) as
   frame strips round landings 1 and 5 (fold/land1.jpg, land5.jpg: k-4, k-2, k-1, k, k+1, k+3; landed on the beat frame) and the cut
   (fold/cut.jpg). Not done: the crease echo at b130-131 (optional in the brief).
7. Handwriting b114-117 -> set type (film.js `typed()`, shots.js `TYPE_OLD`/`TYPE_NEW`/`REL`; the cursive `hand` option and script.js
   are no longer used). JetBrains Mono 600, 34 px (cap 25), lead 50 px, violet light (violet glow under a pale violet core), integer
   positions, nothing moves once typed. Lines start on beats 1, 2, 3, 5, 7 of vio_write's 8 (one character every 0.6 beat / length,
   the first on the beat), a block cursor at the newest line (blinks once typed). A mote of violet light leaves her pencil (`from`) half
   a beat before each line and lands at its start, tying the type to her hand. Dark cloud behind the block (alpha 0.45-0.6).
   Release (vio_release): the block is on screen from the cut, closes to one line of light over 1.25 beats, then travels east and
   lands on the b117 downbeat (flash and sunrise glow, as v1).
   **vio_write2 and vio_release2 had already landed** (plates agent), so the new generic `opt.next = {id, opt}` (film.js boot: if
   that plate exists the shot uses it with `opt` merged; s.swapped) switched both shots; the layout was set on THEM, from the plates
   wiring table: block upper left at (0.035, 0.17) under the chip (nothing near the notebook is clear for 22 characters at 34 px);
   from = pencil point (0.61, 0.485); vio_release2 clip 1.0-4.4; lyric region x 0.03-0.37 on both (her boots reach x 0.38: the v1
   region x1 0.55 put "that I" on her boot); the release path is a cubic (`ctrl` [[0.3,-0.14],[1.12,-0.14]]) up over the top edge and
   down right of her bun to the sunrise (0.97, 0.55): every quadratic through the sky crossed her head. The old-plate layout
   (TYPE_OLD, top centre at (0.305, 0.12)) is only used if vio_write2 disappears: not checked since the new plates landed.
   Graph b149-152: `cherry-pick HANDOFF.md` (done with items 1-3).
   Checked: stills dev/v2/hand/t3_sheet.jpg (10 times across b114-117), t2_05_crop.png (type at full size), mote.jpg; clip
   dev/v2/vio_v2.mp4 (195.6-203.0) as a strip of the release path every 3 frames up to the b117 frame (hand/release_path.jpg).
8 (check). wave_run had landed too: b145-146 plays it (clip 0 at speed 1 for now). Its wiring (plates_v2.md: clip 1.4-4.8, slab low
   y 0.72-0.96) is item 9. Seen on a still (dev/v2/v2_11_wave_run_slab.jpg): the cream slab BACK TO MAIN on the white paper reads
   weakly and crosses her legs: item 9 should give this shot a lyric region and a darker cloud (or ink-coloured slab on white).
Boot check (`render.mjs --info`): ca07 mapfold code, ca10 v7 + windows, vb08/vb09 vio_write2/vio_release2, oa05 wave_run plate,
   22 lyric lines (13 gone), no cards left locally (likeness on).
Review stills (960 px): work_fable/take2/dev/v2/v2_01..v2_11_*.jpg.

Next (item 9, on the director's message): wire the remaining plates from plates_v2.md and orchestra.md wiring tables (root_face_v2,
wushu_v2 incl. the b12 flash and proof uses, drop_face_v2 song-locked from 171.8, stance/insert clips, drop_hero_*, orch_1..8),
mostly with `opt.next` (film.js) so each falls back while missing; then film v2 renders (local likeness, public likeness=0, review
encode, sheets, check.py), versioned film_v2. Optional, not done: the crease echo at b130-131.

### Film v2, item 9 part 1: wiring (2026-11-14, commit e1ef25c + notes)
Mechanisms: `opt.next` (shot switches to a new plate when it exists, with its opt merged); shots.js `PLATE_ALIAS` (film.js boot replaces
PLATE[id] everywhere the film uses it: crossings, flashes, windows, fold sheet; `focus` = her place in the new plate); shots.js `PROOF_A`
(proof range: a life's b28-32 A shot from a new plate, `land` clip time put on beat `landBeat`, `side` = her side there; through
port_proof.py -> proofscene.js `o.aPlates`; the b33-38 grid keeps the old plate, whose bar-37 look-back wushu_v2 does not have).
- root_face_v2 b5-6: clip 0-3.5 (both blinks, the fog breath), no push.
- wushu_v2: alias (focus [0.3, 0.3]) -> b12 flash (next: clip 1.0-1.3, the landed punch), b20 doorway, b49 fold sheet, b54 window,
  b87 flash; b30 A shot via PROOF_A (clip0 = 1.0 - one beat: the punch lands on b30.2; chip and lyric to the right, side 'left').
  Proof identity: proofbug=1 max 0 on all frames (0,75,100,115,130,300,467,700 and the default 13); film differs from its previous
  render only at k=115 (inside b30's wushu shot: the whole frame, the new plate) besides the known label changes.
- b73-76: stance_bow_v2 / stance_horse_v2 / stance_drop2_v2 from settle - 0.11 s (settle 1.5 / 2.0 / 2.25: she settles about a quarter
  beat after the bar line), push 0.02, white flash kept (bar-line impacts). b75 keeps the old stance_drop still until stance_drop_v2
  lands (its settle 1.5 is a guess: set it from the wiring row).
- Beat 3 of b77-80: ins_violin (2.5, speed 1.25), ins_poem (3.4), ins_piano (0.82: the chord lands at the cut), ins_guitar (0.95: the
  strum crosses the strings at the cut), measured on the clips (dev/v2/w9/piano.jpg, guitar.jpg); no white flash.
- Drop: b90 fist = v1 drop_hero_2 still until drop_hero_1_v2 lands; b91 drop_hero_2_v2 clip 1.3-2.9; b92 drop_hero_3_v2 0.7-2.2;
  b102 drop_hero_4_v2 from 1.2 at 1.5x; b103.3 drop_hero_5_v2 from 0.05 (touch-down on the cut, white flash kept). No push.
- b100: one shot, drop_face_v2 song-locked (t0_song 171.8), whole bar; the v7 "arms wide" half removed. No lyric.
- Fold fix: fit [0.94, 0.9], zmax 3, viewY 0.47: sheet starts 0.89 W, every folded stack about 0.9 H; the slab overlaps the lower edge.
  Stills dev/v2/fold/f4_sheet.jpg.
- Town: fresh still confirms `jade/rare-earth` under the dish (dev/v2/w9/b87_town.jpg; v2_06 predated the rename).
- Not yet: wave_run take 2 slab layout (waiting), stance_drop_v2, drop_hero_1_v2, orch_*.
Check clips (hud on, likeness default, sound): dev/v2/check_b73-93.mp4, check_b96-104.mp4; beat sheets (one frame per beat at beat +
0.25, 6 across, 480 px cells) check_b73-93_beats.jpg, check_b96-104_beats.jpg (scratchpad tool beatsheet.py).

### Film v2, item 9 part 2: the rest wired, film v2 rendered (2026-11-14)
Wiring (commit "film v2 wiring 2"):
- Orchestra b81-84 (notes/orchestra.md rev 3 wiring): shots 2-7 = orch_2..7 raw (no paper pass) via `next {kind: 'plate', flag:
  'orch'}`, [clip0, speed] = orch_2 [0.65, 1.45], orch_3 [1.5, 1.2], orch_4 [1.55, 1.25] (strikes on the kicks), orch_5 [0.4, 0.93],
  orch_6 [1.8, 1.35], orch_7 [0.3, 1]; shot 1 = the rev-3 3D arrival (solid paper look) with `opt.tail` dissolving over 5 frames from
  139.60 into orch_1 from 1.0 s (the restyle kept the 3D layout: blocks, dais and walkers line up, checked on stills); shot 8 split:
  orch_8 [0.3, 1] to b84 beat 3.5, then a new shot "orchestra rise" = 3D to b85 beat 2 (the hit). `?orch=v7` = the v1 route.
- stance_drop_v2 at b75 from 0.89 s (holds from 1.0); drop_hero_1_v2 at b90 clip 2.0-3.6 (curls from 2.0, closed by 3.5 = at the end
  of the two beats); ins_violin take 2 from 1.0 at 1.25x; wave_run take 2 clip 1.4-4.8, BACK TO MAIN slab low across the trousers
  band (lyr bottom, centred, x 0.03-0.97, `cloud` 0.62: cream on a darker cloud; ink type would die on her navy trousers).
- Checked on stills: dev/v2/w9/orch_cuts.jpg (every orchestra cut, the dissolve, rise and hit), misc.jpg (wave_run 3 frames, fist end,
  b75, violin).
- Shot count: 185 (b100 merged into one shot, shot 8 split in two).

### Film v2 renders and checks (2026-11-14)
Commands:
    fable/take2/tools/render_film.sh film_v2 "" "likeness=0"          # public master work_fable/take2/out/film_film_v2_master.mp4 (465 s)
    ffmpeg -i work_fable/take2/out/film_film_v2_master.mp4 -c:v libx264 -preset slow -crf 20 -maxrate 2300k -bufsize 4600k \
      -pix_fmt yuv420p -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -c:a aac -b:a 192k \
      -movflags +faststart review/fable_take2/film_v2.mp4             # v1's encode
    cp work_fable/take2/out/film_v2_sheet_0*.jpg review/fable_take2/; ln -sfn keep_film_v2 work_fable/take2/out/keep_v2
    .venv/bin/python fable/take2/tools/check.py work_fable/take2/out/film_film_v2_master.mp4   # -> out/check_v2.txt
    node fable/take2/tools/render.mjs --mp4 work_fable/take2/out/film_v2_local_master.mp4 --audio "inputs/Merge (keychange down).wav" --workers 6 --crf 16
      then the same encode -> work_fable/take2/out/film_v2_local.mp4 (likeness, local only)
Outputs: review/fable_take2/film_v2.mp4 75.9 MB (282.8 s, likeness=0, HUD on); film_v2_sheet_01..05.jpg (1 fps, 10x6).
check.py: 169 hard cuts, mean |error| 0.29 fr, 158 of 161 within 0.5 fr; outliers pc03 +1.89 (the proof's bar 38), bu38/bu40 +2.8 (the
3-frame flashes, as v1), ca08 +2.08 "no clear change" (the fold's match cut into fold_chest, by design); no clear change also on bb16,
bb22, bb31, bu09, dr01, cb04, oa03 (as v1). Type all pass; 22 lyric lines, 119 words, none under 0.6 s; single frame vs full render 11 of
11 identical; last frame equals frame 0 with hud=0 (max diff 0).
Counts: 185 shots; effective (likeness=0): 100 plate, 50 v7, 15 proof, 13 code, 6 kit, 1 card (oa01, the likeness shot). Longest holds:
credits ob03 7.69 s, grid pc01 6.90, terminal ob02 6.83, graph ob01 6.82.
Looked at: the five sheets and one-frame-per-beat strips of b5-6, b28-32, b49-52, b54-55, b73-84, b85-93, b100, b114-117, b139-146
(work_fable/take2/dev/v2/strips/). Nobody has watched v2 at speed with sound.

## Film v3 (2026-11-14, compositor; brief: notes/v3_direction.md section A, Jade's notes: notes/jade_v2_notes.md)

State: items 1-6, 8 done in code, plus the coordinator's additions (hero_paper_v2, main_face_v2 / main_split_v2 song-locked, band_v2
everywhere, wushu_v3, main_light_v2, items 10 and 11). Item 7 (checking the plates agent's wiring) and item 9 (the film v3 render) wait for
the director's message. Nothing of film v3 rendered whole. Check renders: `work_fable/take2/dev/v3/` (960 px review stills `v3_*.jpg`).

1. Orchestra b81-84 back to the hatched 3D (rev-3 frames, solid paper look, as film v1). film.js `ORCH_V7` is now on unless
   `?orch=plates` (film v2's orch_1..8 route and shot 1's dissolve). The split "orchestra rise" shot reuses shot 8's paper seed
   (`opt.seedPrev`) so the hatching does not change at b84.3.5. Boot: 57 v7 shots (as v1). Still: v3_01_orchestra_hatched.jpg.
2. Labels: lives.js wetlab `jade/biology`, phd `jade/phd-neuroscience` (ids unchanged). Checked on stills: grid cell labels (phd fits
   its cell), b29-30 chyrons, graph, git log b73-76, town chips, fold backs, kit lanes; float strands run off the frame edge as all do.
   v7 frames (old code film) still have old names baked in where its road text is legible; not re-rendered (b19 crop, illegible elsewhere).
3. violet's message `still writing this one` (lives.js): vio_wide/vio_walk lanes, gitlog, town road, kit, fold back, det caption.
   Proof identity (`tools/proof_identity.py`): proofbug=1 max diff 0 on all 13 frames, before and after the port change below. Film vs
   its own pre-change render (every 15 frames of bars 28-43): labels only change k 135-150 (wetlab chyron, x 1011-1215 y 758-805),
   k 165-180 (phd chyron and written lane, x 769-1684 y 748-859), k 300-510 (grid labels, x 173-1670 y 231-538). Later, with the new
   plates landed: k 105-120 (b30 wushu shot = wushu_v3) and k 675-765 (b41-42 hero = hero_paper_v2), whole frame; nothing else.
4. vio_wide b105-106 (film.js `roadMask`/`roadLane`, shots.js `ROAD_VW` from `tools/track_road.py vio_wide 3`: per 0.25 s her lead
   foot, rear foot and the plate's own violet road as a line y = a + b x). The plate's road AHEAD of her lead foot is painted out (the
   ground is pure black), opaque to just under her toe, fading under the shoe; behind her rear foot the road is written with her branch's
   message, glyphs fixed on the ground (no scroll) so new text appears as she walks on; a small violet-white pen point glows at her toe.
   vio_wide_v2 (she runs, slowing): `next` is wired with `road.track: null` (no road) until its track is measured with the same tool.
   Checked on 6 stills and crops of her feet (vw/road_sheet.jpg, road_crops.jpg).
5. vio_release2 b116-117 (film.js `palmRelease`, shots.js `PALM_REL`): the typed block flows down into the notebook as she shuts it
   (clip 1.0-1.4, line by line along curves, shrinking, small flares), a violet glow breathes at the notebook, then the light grows IN
   her palm (clip 1.95-2.2; palm per clip time measured by eye on gridded crops, rel/palm_grid.jpg), rises 0.045 H above it, lifts off at
   clip 2.3 and arcs up in front of her face, over her head and down to the sunrise, accelerating, landing on the b117 downbeat (flash
   as before). Her hand is open from 2.0 and raised from 2.15 (palm up), so the light sits on the open palm. Checked: a 16-still sheet
   (rel/rel_sheet.jpg) and every frame of the flight to the downbeat (rel/rel_frames.jpg, rel_top.jpg). The light goes out of the top of
   the frame for about one frame at the apex.
6. vio_still b118-120: she atomizes (film.js `atomize`, data `tools/atomize.py` -> kit/vio_still/atom/: track.json, release.png,
   particles.json, standin.jpg). The clip dollies back (scale 0.86 by frame 121), so every frame uses an ECC affine (background only)
   from plate frame 1 to frame k. Her mask on frame 1: matte inside a hand-set polygon (the matte also took the dish; trusted only away from
   the dish: below y 0.8 the soles, above y 0.2 the pencils of her bun). Release time per pixel: half depth from her outline, half nearness
   to the pale-blue circle, plus slow noise (ragged front closing in on her back); the circle 0.74-0.97, last; a halo round her at 0. Per
   frame the clean plate is warped in (vio_empty landed: still from plate frame 121, read from its meta `matches`; the stand-in is only
   used if vio_empty is missing) through a mask that opens pixel by pixel (0.06 soft); 21k points every 3 px are born where the pixel fades,
   first a square of her own colour (no pop), then a point of light (white or violet), drift out and up; one in ten rises to a place in
   the sky (above the horizon) and twinkles to the end; the circle's points go up and the last of them becomes one violet mote that
   drifts east and leaves the frame at the cut into b121. Release runs from shot start + 0.1 s to end - 0.45 s: the last 0.45 s is the
   empty rim. Checked: 13-still strip across the three bars (v3_05), close crops of the late phase (atom/atom_close.jpg), and a rendered
   clip (atom/atom_clip.mp4, 202.5-208.6) measured frame to frame: mean change 0.6-4.5 per frame inside the shot, spikes only at the two
   cuts (no pop); cut strip atom/cut_strip.jpg. Fixed on the way: a pencil and a hair strand were left floating (not in the matte).
8. Terminal b153-156: `tools/gitlog.py` writes fable/take2/data/gitlog.json from `git log --graph --format="%h %s" fable/merge`;
   render_film.sh runs it before every film render. Do not re-run it between the master render and check.py's single-frame check.
10. b26 main_release (coordinator item 10): the lane behind the light carries lyric line 3 itself (`lane.lyric: 3`, film.js
   `lyricLane`): Instrument Serif cap 46, cream with a dark shadow, on a rose hairline, once, ending at x 0.55 (short of her hands).
   Words sung before the shot ("Each one a light") are sent out from her hands over the first 8 frames, ahead of the light; "I", "sent",
   "ahead" appear on their word times (3-frame fade and rise). The separate lyric is not drawn on this shot. b25 unchanged; the cut
   reads (b25's top lyric, then the words flying out). Checked: 9-still sheet (b26/new_sheet.jpg), crop n7_crop.jpg.
11. b45 easter egg (film.js `egg`): one written lane `banach–tarski` (lower case, en dash), #FFB020 at 0.55, cap 26, a drawn cubic from
   main's band (0.66, 0.15) out to the right edge (1.03, 0.41) over the dark ground clear of the slab, written outward over the first half
   of the shot, merge 0 to 0.3 (above 0.35 a second row fades in and doubled it). Not added to the b46-47 fuse (kit lanes are tied to
   runners; not trivial). Checked: 6-still strip.

Plate hooks (picked up when the folder exists, current source until then): `opt.next` may now be a LIST of {id, opt} (first existing
wins: per-take timings) and `next.id` / PLATE_ALIAS / PROOF_A ids may be lists. Landed and so active now, values from plates_v3.md's
wiring table, NOT yet checked as item 7: wushu_v3 (b12 flash 1.35-1.65, b30 land 1.4, alias everywhere v2 was), hero_paper_v2
(song-locked: c0 = bar 41 - t0_song through makeProof `hero.c0`, port_proof.py; crop/slab as hero_paper, HERO_NEXT.opt to override; the
slab clears her face on stills), main_face_v2 (songLock; lyric bottom left clears her mouth on stills), float_hand_v2 (0.9-2.6),
ins_violin_v3 (from 0.0 at 1.25x), drop_hero_5_v3 (from 0.62: strike on the cut), facade_*_v2 (outro.js prefers kit/facade_<id>_v2; a
v2 facade may be 0.42 W wide, slots laid end to end, the town's speed scaled so the twelve pass in the same time). Waiting: band_v2
(shots.js LIFE_SWAP: every use incl. the proof grid via makeProof dirs, side/tone overridable), main_split_v2 (songLock if t0_song),
main_light_v2, vio_wide_v2 (needs its track), wave_run take 3 (id not known yet: not hooked).

### Film v3, items 7 and 9: wiring and the render (2026-11-14, evening)
Wiring (commit "film v3 wiring", plates_v3.md table):
- band_v2 everywhere (shots.js LIFE_SWAP): film PLATE.band and the proof's dirs.band, so b32's life shot, the b33-37 grid and its
  bar-37 turn, b38, the fold sheet, b54 window, b87 flash. lives.js side overridden to 'left' (chyron, lyric, node to the right). Her
  head turned about 0.2 s after the other eleven with turn_t 2.6, so clip 2.8 is put on the bar-37 downbeat (`turn: 2.8`, makeProof
  `o.turn`, port_proof.py patch on turnOf): offset +0.2 s; checked on crops of the band and ames cells at -0.2..+0.8 s (w7/turn37b.jpg).
  b32 chyron sits on its dark box over her hip and reads; the strip lyric "And every branch remembers" keeps its fixed place across
  b32-38 (it reads; not moved, for continuity).
  Proof identity: proofbug=1 max 0 on all 13 frames. Film vs before band_v2 (every 15 frames): k 225 (b32 band shot, whole frame),
  k 315-510 the band grid cell only (x 1445-1914, y 288-548), k 525-570 that cell's path into main at bar 38; nothing else.
- main_light_v2 b25: 0.0-1.75, no push. main_split_v2 rejected: its hook removed (b18 stays main_split).
- vio_wide_v2 b105-106: clip 0-3.4, road track from tools/track_road.py (now fits the road on violet pixels > 0.1 W from her feet). The
  plates agent's track.json line sits above the painted line on the left of frame (its band cut the hills): not used. Checked: no line
  ahead of her on 4 crops (w7/vw_crops.jpg), the written road behind her, pen point at her toe.
- wave_run_v3 b145-146: 1.4-4.8 (glance at b145.2-3, smile from b146.1), slab as take 2 (checked on 3 frames + the beat strip).
- float_hand_v2 b64: 0.5-2.6 (1.21x): the light settles in the palm on beat 3; fingers closing at the cut.
- ins_violin_v3 from 0.0 at 1.25x (the down-bow). drop_hero_5_v3 from 0.62: feet strike 1-2 frames after the b103.3 cut, the stance
  (straight leg picture left, bent right, facing camera) matches the hatched crowd that follows at b104.
- wushu_v3: punch landed in the b12 flash (1.35-1.65) and on b30.2 (land 1.4). hero_paper_v2 and main_face_v2 song-locked; type clear
  of their mouths (stacked slab left on b41-42, lyric bottom left on b17).
- Facades: the reported matte flaws (wetlab_v2 left sliver, phd_v2 ragged right edge) do not show at town scale (a faint graph-paper
  fringe at phd's right edge only); cut-outs left as delivered.
Render (gitlog.py run once, by render_film.sh, before the public render; not again):
    fable/take2/tools/render_film.sh film_v3 "" "likeness=0"      # 505.6 s; master work_fable/take2/out/film_film_v3_master.mp4
    ffmpeg ... (v2's encode, CRF 20 capped 2.3 Mb/s) review/fable_take2/film_v3.mp4; sheets film_v3_sheet_01..05.jpg
    node fable/take2/tools/render.mjs --mp4 work_fable/take2/out/film_v3_local_master.mp4 ... (likeness, 589 s) -> film_v3_local.mp4
Outputs: review/fable_take2/film_v3.mp4 76.4 MB (282.8 s, likeness=0, HUD on); sheets 0.67-1.30 MB each; local
work_fable/take2/out/film_v3_local.mp4 76.2 MB. check.py (out/check_v3.txt): 161 hard cuts, mean |error| 0.28 fr, 150 of 152 within
0.5 fr; outliers pc03 +1.89 (the proof's bar 38), bu40 +2.80 (the 3-frame flash), ca08 +2.08 no clear change (the fold's match cut);
no clear change also bb16, bb22, bb31, bu09, dr01, cb04, oa03, oa04 (as v2). Type all pass; 22 lyric lines, 119 words, none under 0.6 s;
single frame vs full render 11 of 11 identical; last frame equals frame 0 with hud=0 (max diff 0).
Looked at: the five sheets and one-frame-per-beat strips of b12, b17-18, b20, b25-26, b28-32, b33-38, b41-42, b45, b64, b77, b81-84,
b103-104, b105-106, b114-120, b139-148 (work_fable/take2/dev/v3/strips/). Nobody has watched v3 at speed with sound.

## Film v4 (2026-11-14, compositor; brief: notes/v4_direction.md section A, Jade's notes: notes/jade_v3_notes.md)

State: film v4 rendered (2026-11-14, evening), items 1-8 done. Nobody has watched v4 at speed with sound; checks were stills, beat
strips, measurements. Next: Jade's picker numbers for the two sung shots -> re-render with `--q "lagface=X&laghero=Y"` (or change the
two values in shots.js and re-render the film). Check renders: `work_fable/take2/dev/v4/`.

2. ca08 b51-52 fan (film.js `fan`): the fan is fully open on the shot's first frame (the b51 downbeat), held through beat 1, then the folds
   as before (first starts at beat 1, twelfth gone at beat 7); no outward motion. `opt.fan.open` (beats to open) brings v3's opening back.
   Checked: 12-still sheet 87.03-90.0 (fan/fan_sheet.jpg): ca07's last frame shows her alone, ca08's first frame the full fan.
3. vb09 b116-117 violet light (film.js `floatUp`, shots.js `PALM_REL.lift` 2.7 + `float`): it grows in the palm as before (clip 1.95-2.2),
   sits on the palm a breath to clip 2.7 (= the b117 downbeat), swells softly there (radius x1.45, 0.15 s up, 0.6 s down; no white flash,
   no horizon glow), then rises like a lantern: eased from rest over 0.5 s to a steady 0.115 H/s up and 0.014 W/s east, sway 0.006 W
   over 1.8 s, shrinking to 0.65; a faint wake. She faces WEST (frame left) and the sunrise is behind her, so a path "east" would cross
   her face: it rises nearly straight up in front of her upturned face (x 0.635 -> ~0.66) and ends at y ~0.15, in frame, still rising at
   the cut. Her eyes are turned up toward it in the plate (reads as following on stills). The b121 streak east is unchanged. vb10's
   atomize mote is unchanged. Checked: 12 stills 200.3-202.68 (dot/dot_sheet.jpg), grid stills (dot/grid_sheet.jpg).
4. oa02-oa03 b139-142 town (outro.js `runFrame`, shots.js `RUNNER`): the runner is drawn from the first frame of b139; one continuous run
   (`runner.t0`: b141 continues b139's run, same stride phase; checked across the cut, town/b141_cut.jpg). Feet: `tools/feet.py` on
   kit/day_run (alpha-based soles): a step every 15 frames, standing foot 20.84 plate px per clip frame (mean over stance frames); the clip
   rate is derived in code from it so the standing foot moves with the road (rate = 1050 px/s / (20.84 x 24 x 0.93) = 2.26x; v3 played it
   at 1x: the foot moved 446 px/s on a 1050 px/s road). Loop frames 35..94 (frame 95 matches 35; best of all pairs). The chips are drawn
   over her (she no longer covers a branch name). Checked: 14 stills (town/town_sheet.jpg); proof strips with a red mark fixed to the road
   started at a standing toe: after (town/town_feet_proof.jpg) the shoe rides the mark through the stance, creeping ~15 px/frame ahead
   only in the last 2 frames of push-off (the source foot accelerates 17 -> 30 px/frame within a stance); before (town_feet_before.jpg,
   v3 rate) the shoe stays put while the mark runs past at 35 px/frame. Locking every frame (x driven by the foot) was computed and
   rejected: it needs a +/-40 px body lurch every step (the source's stance speeds are not physical). At 2.26x her cadence is ~3.6 steps/s
   and the pencil twirl is quicker: to judge at speed.
1. b21-22 the door runners. What the measurement found (tools/feet.py, then the toe measure inside tools/recross.py): the floor is
   black, so the doorway's foot is the only floor mark; measured as the standing shoe's TOE (front-most point; the heel lifts, the toe
   should stay) against the doorway's bottom-left corner mapped into each frame (ORB + homography on the door):
   - cross_wetlab (b21, green): the toe slides back 3.3-5.1 plate px per clip frame in every stance (271->315, 178->239, 135->171 over
     ~11 frames): real slip; she gains little on the door per stride (a treadmill). At 1.5x and 1080p that is ~7 px per film frame.
   - cross_ames (b22, blue): the toe is planted (348 for clip frames 29-42, 240 for 53-62); only the heel lifts. Film frames 1103-1110
     agree on stills. NOT rebuilt. If Jade still sees blue slide, my guess is the plate's held frames (many on twos) at 1.5x, or the
     lyric "Down every road the night" sitting over her feet in va06; not changed.
   - cross_wushu (b20) and cross_hackerhouses (b23): not measured (BiRefNet's matte takes the door and, on hackerhouses, the floor);
     she visibly covers ground stride for stride in both (raw sheets dev/v4/feet/raw_*.jpg).
   Fix for wetlab: `tools/recross.py` builds the derived plate `cross_wetlab_v4` (work_fable/take2/plates/, nothing generated; meta has
   src_plate and the parameters): her matte (kit/fig_cross_wetlab, tools/matte.py on the source clip) minus the door (the clean late frame
   116's matte, warped by a homography, grown 3 px), keyed on the door by difference (> 26), closed and hole-filled; she is moved by
   o_k = slip x (73 - k), slip (4.0, -0.25) plate px per clip frame (the per-stance mean; the frame-pair mean, 2.9, is diluted by held
   frames), i.e. she starts 172 px further back and reaches her own place at clip frame 73 = reach 3.0, where the wipe starts (the wipe
   is unchanged and continuous, dev/v4/feet/va05_after_wipe.jpg). The ground she uncovers is filled from frames k-6, -10, -14, -20, -28,
   then 12 and 116, each aligned by homography and used only where she is not within 5 px. shots.js `CROSS_V4` hooks it via opt.next.
     work_fable/venv_hybrid/bin/python fable/take2/tools/matte.py media/gen/t2_cross_wetlab_t1_92785f7480.mp4 work_fable/take2/kit/fig_cross_wetlab
     work_fable/venv_hybrid/bin/python fable/take2/tools/recross.py cross_wetlab cross_wetlab_v4 116 30 73 --fill -6,-10,-14,-20,-28,12,116 --slip 4.0,-0.25 --sheet <jpg>
   Toe against the doorway after: 440-449 (stance 1), 290-300 (stance 2), 185-193 (stance 3) plate px, i.e. within +/-5 (log
   dev/v4/feet/cross_wetlab_v4.log). Proof strips (film frames 1055-1066, a ruler fixed to the doorway's foot, dev/v4/feet/ruler.py):
   va05_before.jpg (the shoe slides ~50 px over 6 frames against the ruler) and va05_after.jpg (it stays on its tick through the
   stance). Looked at: va05_after_sheet.jpg (every 2nd frame), va05_after_close.jpg (full-size crops where she overlaps the door).
   Still weak: a short step in the green lane line where the fill meets it in 2-3 frames (1065-1066); her size is not changed for the
   extra depth at the start (she starts ~0.13 W further back along the lane at the same size); checked on stills and strips only.
5-7. Wiring (plates_v4.md Wiring table, with the director's choices; all plates had landed, so every hook is live):
   - b17 `main_face_v2` and b41-42 `hero_paper_v2`: lag L (s; + = the sound later than the picture, as plates_v4: clip = song - t0_song
     + L). film.js `lagOf(o)`: opt.lag, or the query `opt.lagQ` in ms (wins). main_face next.opt `lag: 0.34, lagQ: 'lagface'`; hero via
     shots.js `HERO_NEXT.lag -0.04` and `?laghero=` into makeProof's hero.c0. Tested: default renders equal `lagface=340&laghero=-40`
     exactly (diff 0) and differ from 0 (diff 215/220). Jade's pick: re-render with `--q "lagface=X&laghero=Y"` or change the two numbers.
   - b25 `main_light_v3` 1.6-3.35 (next is a list: v3, then v2). Strip of 12 stills (dev/v4/wire/light.jpg): the hands open steadily from
     nearly closed to open palms with the star; nothing closes.
   - b145-146 `wave_run_v4`: the director chose 1.6-5.0 (end on the held smile). Steps measured every 8 frames (0.333 s: motion-energy
     peaks on twos at 1.71, 2.04, 2.38, ... 4.71; the plates note's 10 frames came from gait.py's minimum lag 9, which excludes 8). At
     1.041x a step is exactly 3/4 beat (0.319 s at b145) and clip 1.38 puts the step grid on the b145 downbeat: wired 1.38-4.93 (ends on
     the smile, held 3.25-5.0). Slab as v3.
   - `home_v2` everywhere: shots.js LIFE_SWAP.home (focus [0.66, 0.3], no side/tone/turn override: turn_t 2.85 as home). `det_home_v2`
     via PLATE_ALIAS.det_home (b68.2, b71.2 and the tiles). Checked: the grid cell (warm face; profile at 62.7, turned at 63.0 with the
     others; chyron clear of her face, dev/v4/wire/home_turn.jpg), det_home_v2 at 117.1 and 122.2 (warm hand), the b88 flash at 152.38.
   - `facade_wetlab_v3` (Bio-X, the Clark Center): outro.js tries kit/facade_<id>_v3, _v2, then v1; a v3 is laid out like a v2 (up to
     0.42 W wide: it is drawn 0.42 W x ~0.22 H, a wide low building). Chip under it (dev/v4/wire/facade.jpg). The town's road speed is
     unchanged (only the facade travel scales with the layout), so the runner's rate is unchanged.
   Proof range: tools/proof_identity.py, proofbug=1 max diff 0 on all 13 frames.

### Film v4, item 8: the render (2026-11-14, evening)
Commands (wiring committed first, so the terminal's git log has it; gitlog.py ran once, by render_film.sh, before the public master):
    fable/take2/tools/render_film.sh film_v4 "" "likeness=0"      # 669 s; master work_fable/take2/out/film_film_v4_master.mp4
    ffmpeg ... (v2's encode, CRF 20 capped 2.3 Mb/s) review/fable_take2/film_v4.mp4; cp out/film_v4_sheet_0*.jpg review/fable_take2/
    node fable/take2/tools/render.mjs --mp4 work_fable/take2/out/film_v4_local_master.mp4 ... (likeness) -> same encode -> out/film_v4_local.mp4
    ln -sfn keep_film_v4 work_fable/take2/out/keep_v4; .venv/bin/python fable/take2/tools/check.py out/film_film_v4_master.mp4  # out/check_v4.txt
Outputs: review/fable_take2/film_v4.mp4 76.3 MB (likeness=0, HUD on); film_v4_sheet_01..05.jpg; local work_fable/take2/out/film_v4_local.mp4
76.2 MB. check.py: 161 hard cuts, mean |error| 0.27 fr, 151 of 153 within 0.5 fr; outliers pc03 +1.89 and bu40 +2.80 (as v3); ca08 is no
longer "no clear change" (the fan is on the first frame now); oa03 "no clear change" by design (one continuous run); no clear change also
bb16, bb22, bb31, bu09, dr01, cb04, oa04 (as v3). Type all pass; 22 lines, 119 words, none under 0.6 s; single frame vs full 11 of 11
identical; last frame equals frame 0 with hud=0 (max diff 0).
Looked at: the five sheets and one-frame-per-beat strips (2 frames after each beat) of b17-18, b21-22, b25, b33-38, b41-42, b51-52,
b116-117, b139-142, b145-146 (work_fable/take2/dev/v4/strips/).

## Master (2026-11-14, night; brief: notes/master_direction.md section B, Jade's words: notes/jade_v4_notes.md)

State: B1-B4 done (2026-11-14, night). Masters rendered and checked; next owner makes the X/YouTube encodes and subtitles from the local master.

B1. Commit messages (fable/proof/lives.js): ames `landed a 747 in a class 4 sim`, phd `language and music cognition, auditory
   neuroscience` (Jade's words). Checked with hud=0 stills (dev/master/msg/msg_sheet.jpg, msg_sheet2.jpg, gitlog.jpg): b31 phd and b32
   ames chyrons (the box grows with the text: fits), proof written lanes, kit lanes b43-48 and b124-126, fold backs b49-50 (phd wraps
   to three lines inside its cell), strands b57-64 (branch names run off the frame edge as every strand did in v3: the brief's design),
   detail captions b66.2/b67.1/b70.3/b70.4 (one line, fits), the town road. Fixed: the git log b73-76 rows were 97 mono characters for
   phd (about 2050 px at 34 px): rows now 31 px (film.js gitlog), the longest ends at x ~1893 of 1920. The v7 frames (old code film,
   b9-16, b19, b45, b54-55, b77-104, b121-127) have messages baked in where its roads are written: not re-rendered (not mine).
B2. Lip-sync unchanged (+340 / -40 ms). shots.js LIFE_SWAP.home id is now a list ['home_v3', 'home_v2'] (film.js LIFE_SWAP reads lists,
   newest first): home_v3 is used everywhere home is when work_fable/take2/plates/home_v3 exists.
Lyric word times (for the subtitle agent): analysis_v3/timing.json, key `lyrics.lines`: 23 lines, each {id, section, text, kind,
   start, end, start_pos, words: [{w, start, end}, ...]}, seconds from the first sample of "inputs/Merge (keychange down).wav" = film
   time (frame k = t x 30). The film shows 22 of them: it drops lines that are only vocables (film.js buildLyrics, VOCABLE regex), strips
   punctuation per word, and holds a line until min(last end + 0.5, next line start - 0.1), at least last start + 0.8 s.
   home_v3 landed (plates_v5 Wiring: as home_v2, turn_t 2.85, focus [0.66, 0.3]): picked up by the id list, nothing else changed.
   Checked (dev/master/home/): grid cell at 60.0, 62.7 (profile) and 63.3 (turned with the others), the kids' ears, necks and hands
   warm; the b88 flash; the fold sheet. Proof identity after B1/B2: proofbug=1 max diff 0 on all 13 frames.
B3. Step 6 audit, hud=0, likeness on (local), one still 2 frames after every beat, 680 stills (dev/master/audit/f/, sheets
   sheet_00..14.jpg, 48 beats each, sheet NN = bars 12xNN+1 .. 12xNN+12). Costume and text, what I saw:
   - Costume, NOT mine (plate): b56 `main_back_wide` (from behind): the 1420 MHz patch is on the picture-right sleeve = her RIGHT arm,
     the orange band on her left: swapped against the canon (patch left arm, band right). Not mirrored (RARE EARTH would read
     backwards). Every other back view checked closer (b16 main_palm, b53 look_back, b109-115 violet shots, b143-144 day_fork): no
     stripe across the back, patch side right where it shows. Front views: patch on picture right (her left) in b17, b100, b122,
     b129, b145-146. One face everywhere I could see at sheet size; the b137-138 likeness shot is the only photo face (by design).
   - Text, fixed (mine): the git log b73-76 phd row overflowed the right edge (B1).
   - Text, by design / as before: strand labels b57-64 run off the frame edge (each strand is written to the edge); detail captions
     b65-71 write on over their beat (partly written at a beat's start); the terminal b153-156 cuts long commit subjects with an
     ellipsis at the right margin (it shows this branch's real log, recaptured at each render); day_fork b144 slab is cream on near-white
     paper over a soft dark gradient (v3 weak point, legible); the town chips are small (26 px cap) but legible at 1080p.
   - Text, NOT mine: v7 frames (old code film) with old branch names baked into their roads: legible nowhere at 1080p that I saw
     (b19 is cropped to cut its road lyric).
   - Nothing else clipped at a frame edge; every lyric line fully inside the frame on the strips.
B4. The masters (1080p30, hud=0). Commands (notes committed first; gitlog.py ran once, inside render_film.sh, before both renders):
    fable/take2/tools/render_film.sh master_public "" "likeness=0&hud=0"   # 495 s: out/film_master_public_master.mp4 (CRF 16, AAC 256k, 1.11 GB),
                                                                            # out/film_master_public.mp4 (capped 2.4 Mb/s, 80.0 MB), sheets, keep_master_public/
    node fable/take2/tools/render.mjs --mp4 work_fable/take2/out/merge_master_1080p.mp4 --q "hud=0" --audio "inputs/Merge (keychange down).wav" --abr 320k --workers 6 --crf 16
    .venv/bin/python fable/take2/tools/check.py work_fable/take2/out/film_master_public_master.mp4                        # out/check_master.txt
   - The release master (local only, with the likeness): work_fable/take2/out/merge_master_1080p.mp4, 1.13 GB, H.264 1920x1080 30/1,
     8484 frames, CRF 16 (31.5 Mb/s), AAC 48 kHz 320k, 282.80 s. b137-138 is the likeness shot (checked at 236.5 s).
   - Public (repo): review/fable_take2/merge_master_public.mp4 (the capped encode of the hud=0 likeness=0 master, 80.0 MB) and
     merge_master_public_sheet_01..05.jpg. The full CRF 16 public master (1.11 GB) stays at work_fable/take2/out/film_master_public_master.mp4
     (too large for the repo).
   - check.py (public master): 161 hard cuts, mean |error| 0.28 fr, 152 of 154 within 0.5 fr (outliers pc03 +1.89, bu40 +2.80, as v3/v4;
     no clear change by design: oa03; also bb16, bb22, bb31, dr01, cb04, oa04 as before); type all pass; 22 lines, 119 words, none under
     0.6 s; single frame vs full render 11 of 11 identical. Last frame equals frame 0 with hud=0 (rendered, likeness on: max diff 0).
     Decoded from the mp4s, the first and last frames differ by mean 1.6 levels (max 43): frame 0 is an I-frame, the last a P-frame.

## Film v6 (2026-11-15, compositor; brief: notes/v6_direction.md section A, Jade's words: notes/jade_v5_notes.md)

**Resume here.** All code for A1-A8 is in and every plate of plates_v6 is wired except two by choice: `like_sing0` (shots.js
`LIKE0_ON = false`: waits for the director's word on her likeness) and `pad_handover` (not wired: see "Wiring" below). Next / last
step: the film_v6 renders (commands under "Film v6 renders"), check.py, sheets, report.
Check stills: `work_fable/take2/dev/v6/` (c1..c5 sheets; `sheet.sh out.jpg cols files...` tiles 640 px).
Mid-round answers from Jade (via the director): det_pad KEEPS the parenthood message as its caption; the camera is in the DRIVER's seat
(she is the passenger, the camera looks across at her; the road is seen ahead from the driver's side); wire main_back_wide_v2 (b56).

What changed, by section of the brief (song times):
- A1 intro. ia04 (b7-8, 10.70-14.19): the violet frost light takes slot 4 (lights at 11.79 s), glows a beat and drifts to the pane's left
  edge and out (gone by ~13.3 s); the other eleven stay (`opt.vioTip`, film.js tips). ib01-ib10 (14.19-24.61): one violet lane leaves the
  canopy's right tip and runs out of frame top right, a light at its head (14.6-17.6 s), then a quiet line with a slow pulse; anchor
  measured on the raw v7 frames per song time (shots.js VLANE, film.js vlane). No label.
- A2 verse 1. va10 (b26, 43.73-45.47): a violet light leaves her hands 0.3 s in, after the rose one, and goes furthest: up over the frame
  and out top left by 1.55 s (`opt.vioMote`). Grid: port_proof.py `o.stay` (film passes `stay: {violet}` unless proofbug=1): the
  rare-earth tile plays slowly and never reaches a turn; with vio_grid_stay (landed) she writes head down through bar 37; in bar 38 her
  tile keeps its size, throws no lane into main, keeps its label; it stays over the opening iris for ~0.55 s of bar 39 and fades (the
  last tile lit, alone, about a beat after the col-3 tiles fold at 65.8 s). "Start mid-sentence": not done (no existing verse 1 clip
  opens on reading; the brief allows skipping).
- A3 chorus 1. No violet runner: removed from the b43 row (12 lanes), the b124/b126 converge rows; the b51-52 fan is eleven (violet does
  not fold in); the b48 flicker list went with runner_one. b48 (81.86-83.59) is now the cut-away: vio_cutaway clip 0.5-2.5 (fallback
  vio_write2 from 0.4); runner_one is not shown. Its lyric: only the fading tail "becomes the one" at the top (it overlaps the dish top
  a little while fading). NOT changed: the b49-50 map-fold sheet still folds all twelve cells (violet's included).
- A4 breakdown. det_pad: PLATE_ALIAS det_home -> [det_pad, det_home_v2] (b68.2, b71.2, the b72 tiles), caption unchanged (Jade).
  like_sing0: not wired (waits for the director's word).
- A5 build and drop. b77.1 (132.05): the v7 formation is revealed over one beat by the pencil-hatch wipe with a gold pencil point at the
  newest stroke's head; pencil_lead replaces that beat when it lands (next). Hatch wipe (film.js hatchIn, `opt.hatch {frames, seed,
  pen}`): broad diagonal strokes (17 px apart, 24-38 px wide, each a little off the angle) laid in a sweep, revealing whatever the source
  drew, on black paper, gold edges on the growing strokes. MAIN spelling: b94-96 cut to its v7 beats (94.1-94.3, 95.2, 96.3); b97-99
  MAIN whole. 17 life inserts, each through the wipe, 2/1/1/1/1/1/1/1/1 beats in b93-96, two 1-beat in b101, two half-beat in b103, four
  half-beat in b104 beats 3-4 (rate rises into b105): piano, violin, wushu(v3), wetlab, ins_piano, phd, poet, ames, band(v2), chezjj,
  sandstorm, home(v3), ins_guitar, ins_violin_v3, violin, wushu, ins_poem (DROP_LIFE and the shots after it). pencil_draw: b97.1 one beat
  when it lands, else the v7 fall continues.
- A6/A7 the page-light (film.js pageLight: violet halo, a pale ruled page, `open` parts it into two pages): rises from her palm at
  b116-117 (grows in the palm as a page, then floats up); crosses b121 (v7, pageFly left to right) and arrives in c2_lookup (comet head
  is a page); b128 c2_hands: comes down between her palms and opens (220.2-221.3).
- A7 day: town split for the three intuition inserts (b140.3-141.1 piano, b142.1-142.3 violin, b144.2-145.1 stance); every piece of the
  town is one continuous travel and stride (`townFrom`), day_fork continues its clip across its split (`clipFrom`, forks over the whole
  span). Until each plate lands nothing changes on screen.
- A8 ending: graph b149-151 (255.49-260.60, 12 beats, marks scaled, label `cherry-pick HANDOFF.md` mono 40 px bold); endcredits
  b152-155 (260.60-267.42): real git log burst 2.0 s, card lines one per half beat from beat 4.6, `$ git cherry-pick b1e72d6`
  (hashOf('violet')) typed from beat 11.5 at 16 chars/s, cursor blinking; road b156.1-157.3 (267.42-269.98): the card fades, pale
  yellow dashes draw out from the cursor, tip into a perspective road (driver's view, centre line on the left, eye 1.25 m), speed ramps
  to 26 m/s, vio_wide's Milky Way above the horizon, one page-light riding among the dashes; car b157.3-161.3 (269.98-276.82): car_confess
  when it lands, else the road at speed; type (film.js carType) whole lines, Instrument Serif at verse size: camera's line 0.35-3.35 s
  lower third (two rows), hers 3.6-6.45 s; window b161.3-end: the road's page-light glides into the frost light at the palm (0.56, 0.35)
  over 1.4 s; the last 1.5 s cross to frame 0 as before.

Wiring of the plates_v6 table (checked on stills, dev/v6/c6..c8):
- page_reveal (vb01 b105-106, 180.38-183.82): next list [page_reveal, vio_wide_v2]; clip 0.3-4.6 (1.25x); the crowd = v7 at 179.4 s + 0.25x
  (must stay before 180.37, where v7's night starts: a first try at 179.9 put a single verse-2 figure on the page at the end), through
  the drop's gold-on-black paper pass. page_track.json is the LEFT page in every frame (drawn on the frames, dev/v6/quads.jpg; the
  plates note's "both pages from 2.0" did not hold), its corners in varying order: film.js pageOrder labels them TL/TR/BR/BL from
  frame 0 (indices [3,0,1,2]) and then by continuity; pageMap lays the crowd on the spread = the left page extended across the spine by
  its width, as a parallelogram, kept only where the plate is dark (< 42), so hands, pencil and page edges stay in front. Lyric top
  left (y 0.14). vio_wide's written violet road is gone with the shot (the brief: it replaces the wide opening).
- pencil_lead (b77.1, one beat): clip 0.3-1.5 (2.8x); the hatching is code (film.js pencilStrokes: from the tip track, parallel gold
  strokes laid down-right of the tip every 4 px of travel, the newest bright); the formation then enters on b77.2 through the hatch
  wipe with the pen point. pencil_draw (b97.1, one beat): clip 0.5 at 2x, same hatching.
- det_pad: through the det_home alias (b68.2, b71.2, b72 tiles); caption = the parenthood message (Jade).
- intuit_piano b140.3-141.1 clip 1.0 (1x); intuit_violin b142.1-142.3 clip 1.5-2.9; intuit_stance b144.2-145.1 clip 0.6-2.5 (keeps the
  landing); "Back to main" starts inside the stance insert (247.76): its first word sits in the sky strip at the top on a dark cloud.
- car_confess (b157.3-161.3): clip 1.5-5.0 slowed to 0.51x, blended (the hold 3.75-5.0 becomes 2.4 s); she turns at shot 3.4-4.4 s.
  The night road (the same travel as the road shots) shows through the black windows (film.js carRoadFrame/carWindows: kept where the
  plate is < 22). Type: the camera's line in the dark door panel lower left (x 0.025-0.245, cap 50 px, four rows; the only place in the
  lower third clear of her arm and hand) 0.35-3.6 s; hers top left in the windscreen beside her, verse size, one row, 4.3-6.5 s (after
  she has turned). Brief asked lower third for the camera's line: it is lower third but narrow, at 50 px cap (verse lyric size is 66).
- pad_handover: NOT wired. The brief's place (between "something that I learned" and "Comes home", 199.9-200.0) has no gap: line 18
  ends 199.99 and line 19 starts 200.00, and the bar around it is vio_release2's light: the typed lines flowing into the notebook
  (199.27-199.67), then the page-light growing in her palm (200.2) and lifting on the b117 downbeat (200.98). One bar there cuts the
  violet light (the brief's own rule: "if it crowds the lyric or the violet light, it goes"). The plate is ready if the director wants
  it elsewhere (2 beats from b116.1 would cost the type flowing into the notebook).
- like_sing0: hook ready (LIKE0_ON in shots.js: b63 ends on beat 4, one 'L' shot b63.4-65 song-locked, t0_song 109.0, lyric region
  left); off until the director says her likeness passed.

### Film v6 renders (2026-11-15)
Commands (wiring committed first, so the terminal burst shows it; gitlog.py ran once, inside render_film.sh, before the public master):
    fable/take2/tools/render_film.sh film_v6 "" "likeness=0"        # 492 s; master work_fable/take2/out/film_film_v6_master.mp4 (CRF 16)
    cp work_fable/take2/out/film_film_v6.mp4 review/fable_take2/film_v6.mp4; cp work_fable/take2/out/film_v6_sheet_0*.jpg review/fable_take2/
    ln -sfn keep_film_v6 work_fable/take2/out/keep_v6; .venv/bin/python fable/take2/tools/check.py work_fable/take2/out/film_film_v6_master.mp4  # out/check_v6.txt
    node fable/take2/tools/render.mjs --mp4 work_fable/take2/out/film_v6_local_master.mp4 --audio "inputs/Merge (keychange down).wav" --workers 6 --crf 16
      then v4's encode (CRF 20, capped 2.3 Mb/s) -> work_fable/take2/out/film_v6_local.mp4 (likeness: b137-138 like_sing1; like_sing0 not wired)
Outputs: review/fable_take2/film_v6.mp4 80.1 MB (282.8 s, likeness=0, HUD on), film_v6_sheet_01..05.jpg (1 fps).
check.py: 190 hard cuts, mean |error| 0.33 fr, 174 of 183 clear cuts within 0.5 fr. Outliers: pc03 +1.89 (the proof's bar 38), bu39/bu41
+2.8 (the 3-frame flashes, as before), and the new hatch-wipe inserts dr09 +2.31, dr11 +1.54, dr26 +2.50, dr30 +2.00, dr35 +0.55,
dr36 +1.10: the insert's first frame is on its beat but is mostly black paper with the first strokes, so the largest frame change comes
1-2.5 frames later as the picture fills (by design). No clear change: bb16, bb22, bb31, dr01, cb04 (as before), cb06 (converge kit into
kit, both dark), oa07 (the run into day_fork, both white paper: this was oa04 before the town was split).
Type all pass; 22 lines, 119 words, none under 0.6 s; single frame vs full render 11 of 11 identical. Last frame equals frame 0 with
hud=0 likeness=0 (rendered alone: max diff 0).
Looked at: the five sheets; check stills dev/v6/c1..c8; check clips dev/v6/{intro,drop,end}_check.mp4 as frame strips. Nobody has
watched film_v6 at speed with sound.

## Film v7 (2026-11-21, compositor; brief: notes/v7_direction.md, Jade's words: notes/jade_v6_notes.md)

**Resume here.** Code done and committed (car box, comet removed, pencil _v2 ids pre-wired with fallbacks). Waiting on plates:
`c2_lookup_v2` (needs its window from plates_v7.md, then `opt.next` on the b122 row), `vio_write2_v2`, `vio_cutaway_v2`,
`vio_grid_stay_v2` (picked up automatically when their folders land). Then: render film_v7, check.py, stills, review_v7.html.
Check stills: `work_fable/take2/dev/v7/` (`../v6/sheet.sh out.jpg cols files...`).

- Car (b157.3-161.3): `CAR_TYPE`/`CAR_TYPE_P` gone; her line "I have a confession to make" deleted. New `CAR_BOX` (shots.js) drawn by
  film.js `carBox`: box x 0.07-0.93, y 0.75-0.93, fill rgba(8,10,34,0.80), cream 3 px rounded border + 1.5 px inner rule, name tab
  `YOU` (mono 700) on the top-left edge, text JetBrains Mono 46 px typed at 26 chars/s from 0.65 s (wrapped on the whole line first,
  two rows; done at ~3.2 s, as she starts turning at 3.4 s), blinking ▼ bottom right once typed, box on 0.35-6.55 s (opens in 0.22 s,
  fades 0.35 s). Same box on the road fallback. Checked on stills 270.4-276.9: legible, face clear above the box, box covers hands/lap.
- c2_lookup (b122): `opt.comet` removed; the plate's own meteor enters top right inside the 84 % crop at ~210.4 s and is fully in frame
  by 211.0. The page-light no longer "arrives" in this shot (it did in v6 as the comet head).
- Pencils: `vio_cutaway` -> id list ['vio_cutaway_v2', 'vio_cutaway'] (b48), b114 next ['vio_write2_v2', 'vio_write2'],
  PROOF_STAY ['vio_grid_stay_v2', 'vio_grid_stay']; same windows (same framing per the plates brief).
