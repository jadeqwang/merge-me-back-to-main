# Merge, take two: review files

Plan: `fable/take2/PLAN.md`. Nobody has watched any of these at speed with sound yet; all checks so far were on stills, strips and
measurements.

## Step 0: test results (2026-11-13)
Open `step0/index.html` in a browser: the ten tests of plan section 9 on one page, with the diagnosis of the running-shot
discontinuity. The sung-insert clips (Jade's likeness) are kept out of this public repo; on the build machine they are in
`step0/likeness_local/`.

## Step 1: whole-film animatic v1 (2026-11-13)
`animatic_v1.mp4` (282.8 s, 1080p30, the new audio `Merge (keychange down)`), sheets `animatic_v1_sheet_01..05.jpg` (one frame a
second, song time burned in).

- 187 shots, about 40 a minute. 22 use finished material (the proof at bars 28 to 43, and the plates that exist), 58 are v7 re-timed
  to the new song and redrawn by the paper pass (black paper; gold and black in the drop), 107 are labelled cards for shots not yet made.
- Every lyric line is on screen on its sung word times. The small bar, beat and section readout in the corner is for review only.
- Cuts: 157 of 160 hard cuts measure within half a frame of their bar or beat; the other three are measurement artefacts of flashes
  and the proof's own transition (see `fable/take2/notes/compositor.md`).
- Where the shot table cuts between two v7 angles ("above", "side"), the animatic shows no change yet: v7 is one re-timed sequence.
- Not in yet: written lanes in the film itself, the glyph pass, the overlays the cards list as "to do in code".
- The proof never drew "And every branch remembers" and "Where I started from" (a bug in `fable/proof/src/proof.js` line 93; the
  proof is left as approved). The film's copy draws them, in the strip under the grid.

Render again: `fable/take2/tools/render_film.sh animatic_vN`. Checks: `fable/take2/tools/check.py`.

## Film v1 (2026-11-14)

- `film_v1.mp4`: the whole film with sound, review readout on. The two sung likeness shots are cards here (likeness clips stay local).
- Sections with more bitrate: `section1_v1.mp4` (bars 1-17), `section2_v3.mp4` (16-57), `section3_v3.mp4` (56-89), `section4_v2.mp4` (88-121), `section5_v1.mp4` (120-end).
- Orchestra looks for bars 81-84: `orchestra_v1.mp4` (solid) and `orchestra_v1_light.mp4`; `orchestra_v1_sheet.jpg` compares them.
- Nobody has yet watched film v1 at speed with sound; all checks so far were on stills, contact sheets and measurements.
- `review_v1.html`: open in Chrome from disk to take timestamped notes on film v1 and answer the open decisions; it exports plain text.
