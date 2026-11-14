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

## The edit (all times from the timing file). Revision 2 (2026-11-13, final plates: late turns, figures on either side)

- A, bars 28-32: 10 full-frame shots of 4,4,2,2,2,2,1,1,1,1 beats from bar 28's beat index, with a push of 3% (4 beats),
  2.2% (2 beats) or 1% (1 beat). Full-frame plates cross-blend adjacent source frames.
  - Layout follows the figure. Each life in lives.js has `side` (where SHE is), plus an optional `yshift` (vertical crop nudge;
    none needed so far). The upper lyric block ("Each one a story / to unfold", cap 68, baseline 108) goes in the upper corner
    away from her. The chip and the lane node go to the same side at the lane height (node at 0.12W or 0.88W; the chip's outer
    edge sits on the node's outer edge). The lane runs full width and is continuous; on a cut the node may jump sides and the
    new colour wipes out from wherever the node now is.
  - Sides: left = piano, wetlab, poet, phd (type on the right); right = violin, wushu, ames, band, chezjj, sandstorm, home, violet.
    phd and band are near the centre and were chosen by eye: phd's right is clear grid paper, band's top left is clear (bandmates on the right).
  - Tones (lyric ink #14122B on light, cream #FFF1D6 on dark, thin opposite shadow): light = piano, violin, wetlab, phd, poet,
    chezjj; dark = wushu, ames, band, sandstorm, home, violet. wushu and ames are flipped from the brief's list (wushu's top is a
    dark wooden wall, ames a mid grey where ink read weakly).
  - The line holds 0.3 s after its last word and fades in 0.2 s, so it is gone before the band cut.
- No A shot reaches a turn. The longest shot is 4 beats (1.74 s) against turn_t of at least 2.5 s, and A clip time is soft-capped at turn_t - 0.4.
- B, bars 33-36: twelve 16:9 cells of 470x264 with 10 px gutters, top 14, bottom 827, and a lyric strip below. Sandstorm scales
  into its cell over 8 frames; the others pop in on half-beats. Each cell has its lane along the bottom edge, its node at the
  right end and a chip label at bottom left (the labels fade out at bar 38). Pre-turn action is slowed with a power curve.
  "And every branch remembers" and "Where I started from" are centred in the strip (cap 70, baseline 1000).
- C, bar 37: the turn lands on the frame nearest the downbeat. The clip map is half a frame early, and grid cells at natural
  speed show floor() (no blend). After the turn, plates play at natural speed for min(1.2 s, half the remaining clip), then ease
  toward the last frame along a curve (linear part 0.25 plus ease-out) that arrives as the cell finishes shrinking in bar 38.
  Slowed playback blends frames; it never stops and never runs off the clip. The grid holds the whole bar, with a pulse left to
  right in beat 3 and a gather into the node in beat 4.
- D, bar 38: night background. The camera does not translate: it zooms (u^2, accelerating) from 1 to 0.8 about (1880, lane y),
  so the graph slides right, stays tall in frame, and the root (world x = 1880 - 1650/0.8) enters from the left mid-bar and lands
  on (0.12W, 0.82H) on bar 39. Column per beat, left first: cells shrink into their nodes and each node throws a 12 px S-curve
  into main. Junction flashes; main grows from 6 to 18 px. There are no labels.
- Bar 39: an iris from the root node opens into the root plate over 2 beats. Strokes are clipped outside the iris and fade, so
  only main and the root node remain over the plate. The push accelerates into bar 41.
- E, bar 41: the hero cut with a 2-frame flash and a 4% punch over 8 frames. Slab MERGE / ME BACK / TO MAIN at cap 106.
  Written lane (test): main under the hero is a line of JetBrains Mono caps (22 px cap, lane orange) reading
  "MERGE ME BACK TO MAIN · " then the twelve commit messages separated by " · ", repeated and scrolling left at 46 px/s, on a
  2.5 px solid rule, with a gap around the node ring.
- `twos=1` (query flag; `render_proof.sh v3 twos`): plate time is quantised to 1/12 s on a grid with a step boundary at each
  plate's turn_t (turn_t + k/12), with no blending. Everything drawn in code stays at 30 fps.
- Finish: seeded paper grain (multiply, 12 fps) and a 0.24 vignette under lines and type.

## Check results (v3, final plates, revision 2)

- Cuts (twos off): max |error| 0.48 frames. Twos: the detector reports wetlab at -1.36 frames, but it is fooled by a large
  12 fps pose step on wushu at frame 129. Frame 130 is the first wetlab frame (checked by eye), so the cut timing is the same as
  with twos off (cut code is shared).
- Turn: all 12 cells reach turn_t on frame 467 (downbeat 467.01, +16 ms), with twos off and on.
- Hold after the turn (frame 467 to each cell's shrink): every clip keeps advancing and stays below its last frame (ends 4.81-4.86
  of 5.00 s). The slowest step is 1.4 ms of clip per output frame (wetlab, violet, the last column, near the end of the hold).
  With twos on, those cells can hold one 12 fps plate frame for up to roughly a second while they shrink.
- Type caps (measured): chyron 37, commit 26, A lyric 67 (set at 68), strip lyric 70, slab 106, chips 26 px font. The written lane is 22 px cap.
- Single frame alone vs full render: max diff 0 for frames 75, 560 and 700 (twos off and on).

## Open problems / next

- `still.jpg` is not used.
- The home cell's chip (bottom left of the cell) sits just below the two children's heads, touching their shoulders.
- Twos makes slow passages read as stepped (that is the point). The end of the grid hold is the slowest.
