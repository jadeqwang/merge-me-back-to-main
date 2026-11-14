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

## Shot table: ambiguities and how they were resolved

See the report in this file's last section (kept up to date).
