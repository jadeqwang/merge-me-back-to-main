# Proof segment (bars 28-43): running notes

A 26-second proof of the illustrated-plate approach: bar 28 downbeat to bar 43 downbeat, plus 0.5 s of black. It is a
deterministic, beat-locked Canvas2D compositor. `render(t)` is a pure function of song time, so any frame can be rendered alone.
It is built against placeholder plates, and real plates drop in with no code change.

## What exists

| file | what |
|---|---|
| `fable/proof/index.html`, `src/proof.js` | the compositor page (plates, grain, vignette, lines, type), and `window.PROOF` for the harness |
| `fable/proof/src/timing.js` | timing loader: bars, beats by index (`beat(n,k)` walks the measured beat list), lyric lines by text |
| `fable/proof/lives.js` | the lives table (id, branch, commit message, lane colour) and the 7-hex hash from the id (FNV-1a) |
| `fable/proof/tools/render.mjs` | headless-Chrome harness (a small copy of `fable/tools/render.mjs`): `--mp4`, `--frames k:out.png [--fresh]`, `--stills t:out.png`, `--info`, `--probe k0:k1 out.json` |
| `fable/proof/tools/render_proof.sh [v2\|v3]` | full render: mp4 with audio, contact sheets, 3 kept lossless frames |
| `fable/proof/tools/check.py [v2\|v3]` | checks: cut error in frames, turn landing, type sizes, single frame vs full render |
| `fable/proof/tools/placeholders.py` | placeholder plates (never touches a folder that has `REAL`, or a `meta.json` without `"placeholder": true`, or frames with no meta) |

Data (git-ignored): `work_fable/proof/plates/<id>/`, `work_fable/proof/out/` (renders, sheets, keep_*), `work_fable/proof/dev/` (stills, probe and info json).
The engine (`fable/engine`, `fable/show`) is not used or changed. Only the fonts in `engine/fonts/` are loaded.

## How to render

```
fable/proof/tools/render_proof.sh v2      # analysis_v2/timing.json + inputs/Merge.wav           (about 50 s with 4 workers)
fable/proof/tools/render_proof.sh v3      # analysis_v3/timing.json + "inputs/Merge (keychange down).wav"
.venv/bin/python fable/proof/tools/check.py v2
```
Outputs: `work_fable/proof/out/proof_<v>.mp4` (1080p30, H.264 CRF 16, AAC 256k excerpt from t0 = bar 28 downbeat),
`proof_<v>.json` (t0, frame count), `proof_<v>_sheet_01..04.jpg` (4 fps, song time burned in, 8x4 each).
Single frames: `node fable/proof/tools/render.mjs --timing /analysis_v2/timing.json --frames 470:/tmp/x.png` (k = frame index from bar 28),
or `--stills 62.73:/tmp/x.png` (song time). Any timing file under the repo root can be passed with `--timing /path.json`.
Env: `WORKERS` (default 4), `RES` (default 1920x1080; layout scales with height).

## Plate contract

`work_fable/proof/plates/<id>/frames/f_%04d.jpg` (from f_0001; 1280x720 expected, any 16:9 size works) plus `meta.json`
`{"fps":24,"n":N,"turn_t":s|null}`. Optional `still.jpg` is not used yet. Optional `"focus":[fx,fy]` in meta.json (0..1, default
0.5,0.5) sets where the grid cell crops the plate. ids: piano violin wushu wetlab phd poet ames band chezjj sandstorm home violet root hero.
Plates are read when the page loads, so after real plates arrive, re-run `render_proof.sh`. Nothing else is needed.
If a life plate has `turn_t: null`, the grid uses min(2.5 s, half the clip) as its turn. Put the real turn time into meta.json.

## The edit (all times from the timing file). Revision 1 (2026-11-13, all 14 real plates in)

- A, bars 28-32: 10 full-frame shots of 4,4,2,2,2,2,1,1,1,1 beats from bar 28's beat index, with a push of 3% (4 beats),
  2.2% (2 beats) or 1% (1 beat). Full-frame plates cross-blend adjacent source frames by the fractional position (24 to 30 fps,
  no repeated frames). The lane line sits at y=0.82H with a ring at x=0.12W; on each cut the new colour wipes out from the
  node over 3 frames. The chyron is a chip: #05061A at 82%, radius 4, with dot + branch + dim hash on line 1 and the commit message
  on line 2; its left edge sits on the node's left edge. "Each one a story / to unfold" (2 rows, baseline 140) is upper left.
  The colour follows the shot's `tone` in lives.js (ink #14122B with a thin cream shadow on light plates, cream with a thin ink
  shadow on dark ones) and switches on the cut. There is no scrim. wushu is marked light, against the brief's list: the plate is a light grey mat.
- B, bars 33-36: twelve 16:9 cells of 470x264 with 10 px gutters, top margin 14, grid bottom 827. Below the grid is a lyric strip
  on the near-black background. Sandstorm scales from full frame into its cell (row 3, col 2) over 8 frames. The other 11 cells
  pop in on half-beats with a back-ease, lane tick and node flash, and empty slots show a dim lane tint. Each cell has its lane
  along the bottom edge, its node at the right end (88%) and a small chip label at bottom left. Cells play their pre-turn action
  slowed (a power curve; ping-pong if the slowdown would be more than 4x). "And every branch remembers" and "Where I started from"
  are centred in the strip (cap 70, baseline 1000, cream, soft shadow, no box). "And every branch" starts over the last
  full-frame plates in the same place.
- C, bar 37: the turn lands on the frame nearest the downbeat. The clip map is half a frame early, and grid cells at natural speed
  show floor() (no blend), so the turn is crisp. The gutters flash white then lane colour, and the grid punches 3% over 6 frames.
  The grid holds the whole bar. In beat 3 a pulse runs left to right along each lane; in beat 4 the lit lane gathers into the node.
- D, bar 38: a night background (#05061A to #0B1240) with seeded stars at 0.35 parallax. Column by column, one column per beat
  with the left column first, the cells shrink into their nodes (first half of the beat). Each node throws a 12 px lane stroke
  (soft edge, colour body, bright core, round caps) in an S-curve down-left into main. Higher rows land further left, and the
  curves nest without crossing. Each junction flashes on arrival at beat+0.9, after which a strand runs alongside main and a small
  ring stays on it. Main goes from 6 to 18 px and brightens with each merge. The camera travels left (graph moves right, u^2) and
  pulls back to 0.62 about the frame centre. The root ring (r 24) enters from the left in the last beat and lands at (0.12W, 0.82H)
  on bar 39. There are no labels in this section.
- Bar 39 downbeat: an iris from the root node opens over 2 beats into the root plate. Lane strokes are clipped to outside the
  iris and fade, so over the plate only main and the root node remain, with light pulses on main that speed up into bar 41. The
  root push accelerates (1.0 to 1.12, power 2.4). "Where I started from" stays in the strip until it ends.
- E, bar 41: hard cut to hero with a 2-frame flash (0.85, 0.4) and a 4% scale punch settling over 8 frames, then a 4% push.
  The slab is MERGE / ME BACK / TO MAIN in Archivo Expanded 800 at cap 106, tracking -0.01em, x=100. The rows end at x 832, 1004
  and 937 (1049 at most while a word lands at 1.08 scale), and the hero figure starts at about 0.62W. Each word lands on its word time.
- Finish: a seeded paper grain (6 tiles, chosen and offset by floor(t*12)) multiplied over everything below the lines, and a
  0.24 vignette. Lines and type sit above.

## Check results (v3, all real plates, revision 1)

- Cuts: max |error| 0.48 frames over 12 cuts and transitions.
- Turn: every cell reaches its meta turn_t on frame 467. The bar 37 downbeat is at frame 467.01, and clip time minus turn_t is +16 ms.
  This is verified from the page's clip times, because the real plates have no test patch.
- Slab words, by frame (v3): MERGE 667, ME 738, BACK 745, TO 763, MAIN 772. Checked in the mp4: each is absent one frame before.
- Type (cap heights): chyron branch 37, commit 26, upper-left lyric 75, strip lyric 70, slab 106. Cell chip labels are 26 px font (20 cap).
- Single frame alone vs the same frame in the full render: max diff 0 for frames 75, 560 and 700.
- Faces: at each A shot's midpoint the lyric and chip are clear of the protagonist's face. On wushu, "story" passes just above a
  background dancer's head.

## Open problems / next

- `still.jpg` is not used.
- Bar 38 leaves the top half of the frame as starry night (the graph sits in the lower half after the pull-back).
- The A lyric on wushu passes close to a background figure. Per-plate lyric placement would fix that if needed.
- The grid cells near the turn use floor() sampling (crisp turn) rather than blending. Every 4th or 5th output frame repeats there.
