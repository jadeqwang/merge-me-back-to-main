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
