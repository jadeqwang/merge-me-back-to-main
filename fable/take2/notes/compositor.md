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
