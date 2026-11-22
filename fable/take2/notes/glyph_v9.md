# Glyph art v9 (film-ready glyph frames): resume note

Owner: glyph agent. Direction: `notes/v9_direction.md` section A. Background: `notes/glyph_v8.md`.
Code: `fable/take2/tools/glyphart/**` only. Outputs (git-ignored): style-1 plates `work_fable/take2/plates/<id>_glyph/`,
style-2 and drop frames `work_fable/take2/v7/glyph_*/`, dev/tests `work_fable/take2/dev/v9_glyph/`.

## Plan / status
- [x] animate.py plate mode (`--frames DIR --fps 24 --first/--last`), per-frame focus = skin map (`--focus-skin`, v9/skin.py: faces,
      hands) + bright structure (`--focus-bright`, lanes/lights stay sharp), figure matte (`--matte-dir`, v9/plate_mattes.sh), no boil in
      the focus, no keylines/value jitter/dark underpaint gaps in the face, full underpainting + lift under the figure.
      paint.py: focus may be a map; `dark_k` (refine dark-on-dark); `bg_dim` spares bright/saturated colours (bg_dim_k).
- [x] style 2: va03, ca10, bu (wushu + orchestra) done. animate_hash.py: `--crop`, `--k0/--k1`, `--matte-open`, writes meta.json.
- [x] drop: `tools/glyphart/drop/slashpaper.js` (paper.js copy, marks = chains of keyboard stroke glyphs), `drop.html`,
      `drop_run.mjs` (headless Chrome, 3 pages, ~0.25 s/frame). 802 frames.
- [x] day_eyes_v2_glyph (oa03, white paper).
- [x] style 1, all 11 plates (2026-11-22 ~00:45). Jobs `work_fable/take2/dev/v9_glyph/style1_jobs.txt`; logs `dev/v9_glyph/logs/`.
      float_face uses `--set bg_dim=1.0 --set lift=0 --set keyline=0.12 --under 1.0`, float_top the same + `--set dark_k=0.12 --fill-k 1.0` (black hair fan on charcoal water:
      lifting the figure or dimming the water reverses or erases the fan; light keylines keep the water its own grey).
- Sheets v8 | v9 | source at 640 px, one per style-1 shot: `work_fable/take2/dev/v9_glyph/s1sheet/s1_<shot>.jpg`, all: `s1_all.jpg`.

## Commands
    bash fable/take2/tools/glyphart/v9/plate_mattes.sh ID...                         # BiRefNet mattes of plate frames (GPU)
    bash fable/take2/tools/glyphart/v9/style1.sh PLATE OUT T0SONG [--beat0 B --first a --last b]   # MATTE=0 for white paper
    bash fable/take2/tools/glyphart/v9/s2_mattes.sh NAME K0 K1 [crop]; W=3 bash fable/take2/tools/glyphart/v9/style2.sh NAME K0 K1 BEAT0 [...]
    node fable/take2/tools/glyphart/drop/drop_run.mjs --out work_fable/take2/v7/glyph_drop --frames 4584:5385 --workers 3   # skips existing
    node fable/take2/tools/glyphart/drop/drop_run.mjs --still 153.65 --out x.jpg [--which paper]   # --chart f.png: glyph angle chart
    work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/v9/s1_sheet.py work_fable/take2/dev/v9_glyph/s1sheet   # v8|v9|source at 640
    work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/v9/review.py SRC_PLATE GLYPH_PLATE OUTBASE [--box ..] [--crop ..]

## Findings (looked at 640 px and 1:1)
- Drop (`dev/v9_glyph/drop/drop_15365_sidebyside.jpg`, committed `review/fable_take2/v9_glyph/drop_15365_v8_vs_v9.jpg`,
  `drop_640_v8_vs_v9.jpg`): same read at full frame (mean luminance 38.5 vs paper.js 39.4), same density and gold on black. At 1:1
  the hatch is broken into short typed marks (\ / | - ( ) ~ ! = l ...), each glyph ~20 px, chained along the old stroke; dense areas
  read as broken hatching more than as legible characters; the sun's rubbed core stays solid (as in v8). The runner once hung on
  one frame (protocol timeout); re-running fills gaps.
- Style 2 at 640 px reads like the v8 hatch shots; letters are not legible at that size (only at 1:1). ORCHESTRA: the massed white
  jackets with upright letters read as grey NOISE BLOCKS at 640 px (rectangular denser patches where body glyphs meet the rotated
  background ones), see `dev/v9_glyph/review/s2_drop_phone.jpg` (rows 2-3). Matte: an opening (5 px) drops thin stand legs; the
  wire stands/chairs that overlap bodies stay "body"; tiny far players are missed by BiRefNet (they get rotated glyphs).
- Style 1 (first pass, before the fixes): hair/trousers sank into the dark background and the catch face looked scarred
  (dark keylines of carried glyphs). Fixed (see status). ca01 mouth-darkness curve glyph vs source: corr 0.994, derivative 0.992.
  Hair strands that BiRefNet leaves out of the matte (long flying strands, catch/hero) are dimmed with the background.
  day_eyes_v2 on white: the white paper becomes a light-grey type page; the white jacket picks up grey glyph strokes; patch visible.
- Style 1 final: silhouettes, trousers, lanes and faces read at 640 px as in v8; ca01 mouth curve corr 0.996 (derivative 0.994).
  Shimmer: mean frame-to-frame change (480 px luma) glyph/source = 1.1x hero (moving), 1.6x float_top, 3-4x on the near-static
  catch and c2_lookup (about 1.5-2 levels of 255: the eighth-note boil + hole refill breathing in the background glyphs).
  float_top: the hair fan reads at 640 px as dark radial strands, softer than the source.
- va01 (main_face) is left as it was (her note was at va02's time).

## Wiring table
All folders under `work_fable/take2/` (git-ignored). Style-2 and drop folders are v7 layout (`f_%05d.jpg`, number = round(t*30),
`meta.json` {fps 30, n, t0, first}): use per-shot `opt.v7dir` and `opt.paper: 0` (the frames are finished; no paper pass on top).
Style-1 folders are plate layout (`frames/f_%04d.jpg` 1..n, 24 fps, `meta.json` copied from the source plate + `glyph` field,
`REAL`, `still.jpg`), every frame of the source plate painted, 1920x1080 (source plates are 1280x720): swap the plate id (or put
`<id>_glyph` first in `opt.next`); clip maps (clip0/clip1/speed/songLock/HERO_NEXT t0_song) stay exactly as they are.

| shot(s) | source | output folder | frames | fps | t0 / first | notes for the compositor |
|---|---|---|---|---|---|---|
| va02 | plates/main_split (clip 0.5-3.2) | `plates/main_split_glyph/` | 121 (11-80 painted) | 24 | frame 1 = song 29.50 | style 1; same opt (clip0/clip1/push) as main_split |
| va10 | plates/main_release (clip 0-1.74) | `plates/main_release_glyph/` | 121 (1-44 painted) | 24 | 43.725 | style 1; lane/vioMote overlays unchanged |
| ca01 | plates/hero_paper_v2 (HERO_NEXT, songLock t0_song 69.2, lag -0.04) | `plates/hero_paper_v2_glyph/` | 121 (10-98 painted) | 24 | meta t0_song 69.2 kept | style 1; set HERO_NEXT.id = 'hero_paper_v2_glyph' (same t0_song/lag: frame-for-frame same timing; mouth curve checked) |
| ca03 | plates/hero_feet | `plates/hero_feet_glyph/` | 121 (1-44) | 24 | 74.924 | style 1 |
| ca09 | plates/look_back (clip0 0) | `plates/look_back_glyph/` | 121 (1-44) | 24 | 90.532 | style 1 |
| ca11 | plates/main_back_wide_v2 (next of main_back_wide; clip 0-3) | `plates/main_back_wide_v2_glyph/` | 121 (1-75) | 24 | 95.727 | style 1; put first in ca11 `next` (patch_track.json NOT copied: the patch is painted in the frames) |
| ba01, ba03, ba04, ba05 | plates/float_top (clip0 0 / 2 / 0.5 sp .75 / 3) | `plates/float_top_glyph/` | 121 (1-117) | 24 | 97.457 | style 1; strands + the ba04 gliding life window stay drawn by film.js on top |
| ba02 (also usable for bb04/08/12/16) | plates/float_face | `plates/float_face_glyph/` | 121 (1-44) | 24 | 100.917 | style 1; only ba02 is in her notes |
| cb02 | plates/c2_lookup_v2 (next; clip 0.3-3.5, zoom0 1.19, fx 0) | `plates/c2_lookup_v2_glyph/` | 121 (6-87) | 24 | 209.366 | style 1; same opt as c2_lookup_v2 |
| cb09 | plates/catch (clip0 0) | `plates/catch_glyph/` | 121 (1-44) | 24 | 221.436 | style 1 |
| oa03 | plates/day_eyes_v2 (mirror:true, clip 0.62-2.33) | `plates/day_eyes_v2_glyph/` | 121 (13-59) | 24 | 240.39 | style 1 on WHITE paper (no matte/dim; light paper, keyline .25, lift 0); keep mirror, streaks matte kit/day_eyes_v2 as the plates agent wired |
| va03 | v7 full f_00947-00998, PRE-CROPPED by the shot's v7crop [0.3,0,0.7,0.7] | `v7/glyph_s2_va03/` | 52 | 30 | first 947 (31.567) | style 2. DROP `v7crop` for va03 (already applied, upscaled to 1920x1080) and set `paper: 0` |
| ca10 | v7 full f_02768-02871 | `v7/glyph_s2_ca10/` | 104 | 30 | first 2768 (92.267) | style 2. `paper: 0`; the lit windows (opt.windows) stay drawn on top by film.js as in v8 |
| bu10,12,13,15,16,18,19,21 (wushu, the whole seq-08 run incl. under the inserts) + bu22-bu30 (orchestra) | v7 full f_03974-04142 + v7/orchestra f_04143-04389 (as animate.frame_path) | `v7/glyph_s2_bu/` | 416 | 30 | first 3974 (132.467) | style 2. `paper: 0` on every one of these shots (replaces both the default v7dir and `/work_fable/take2/v7/orchestra`; `paperLook: 'orch'` no longer applies). Re-seeded at every film cut (forced cuts at each bu22-bu30 start). bu09 (pencil lead) not included. bu30's `seedPrev` irrelevant |
| dr01,02,04,06,08,10,14,19,21-23,25,29,32,34 (every v7 dr shot) | v7 full f_04584-05385 (152.80-179.50) | `v7/glyph_drop/` | 802 | 30 | first 4584 | drop look: `tools/glyphart/drop/slashpaper.js` = src/paper.js with glyph marks, seed 1000+s.i, t=k/30, drop SEC opts. `paper: 0`. Frames under plate inserts are rendered too (contiguous) but unused. Alternative: import `slashPaperPass` from `/fable/take2/tools/glyphart/drop/slashpaper.js` in place of paperPass for these shots (same signature) |

