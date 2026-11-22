# Glyph art v9 (film-ready glyph frames): resume note

Owner: glyph agent. Direction: `notes/v9_direction.md` section A. Background: `notes/glyph_v8.md`.
Code: `fable/take2/tools/glyphart/**` only. Outputs (git-ignored): style-1 plates `work_fable/take2/plates/<id>_glyph/`,
style-2 and drop frames `work_fable/take2/v7/glyph_*/`, dev/tests `work_fable/take2/dev/v9_glyph/`.

## Plan / status
- [ ] animate.py: `--frames DIR --fps 24` plate mode (+ per-frame focus ellipses, keyframed/flow-tracked)
- [ ] style 1 plates: va02 main_split, va10 main_release, ca01 hero_paper_v2, ca03 hero_feet, ca09 look_back,
      ca11 main_back_wide_v2, ba01-05 float_top, ba02 float_face, cb02 c2_lookup_v2, cb09 catch; oa03 day_eyes_v2 (waits on plates agent;
      still test on day_eyes white paper first)
- [ ] style 2 (animate_hash V3, mono em 20, upright body via BiRefNet matte): va03 (v7 seq 01, pre-cropped to v7crop),
      ca10 night world, bu10-bu21 wushu run, bu22-bu30 orchestra
- [ ] drop (dr* v7 shots): paper.js hatch look with slash glyphs; still at 153.65 vs v8 first, then the range

## Wiring table
All folders under `work_fable/take2/` (git-ignored). Style-2 and drop folders are v7 layout (`f_%05d.jpg`, number = round(t*30),
`meta.json` {fps 30, n, t0, first}): use per-shot `opt.v7dir` and `opt.paper: 0` (the frames are finished; no paper pass on top).
Style-1 folders are plate layout (`frames/f_%04d.jpg` 1..n, 24 fps, `meta.json` copied from the source plate + `glyph` field,
`REAL`, `still.jpg`), every frame of the source plate painted, 1920x1080 (source plates are 1280x720): swap the plate id (or put
`<id>_glyph` first in `opt.next`); clip maps (clip0/clip1/speed/songLock/HERO_NEXT t0_song) stay exactly as they are.

| shot(s) | source | output folder | frames | fps | t0 / first | notes for the compositor |
|---|---|---|---|---|---|---|
| va03 | v7 full f_00947-00998, PRE-CROPPED by the shot's v7crop [0.3,0,0.7,0.7] | `v7/glyph_s2_va03/` | 52 | 30 | first 947 (31.567) | style 2. DROP `v7crop` for va03 (already applied, upscaled to 1920x1080) and set `paper: 0` |
| ca10 | v7 full f_02768-02871 | `v7/glyph_s2_ca10/` | 104 | 30 | first 2768 (92.267) | style 2. `paper: 0`; the lit windows (opt.windows) stay drawn on top by film.js as in v8 |
| bu10,12,13,15,16,18,19,21 (wushu, the whole seq-08 run incl. under the inserts) + bu22-bu30 (orchestra) | v7 full f_03974-04142 + v7/orchestra f_04143-04389 (as animate.frame_path) | `v7/glyph_s2_bu/` | 416 | 30 | first 3974 (132.467) | style 2. `paper: 0` on every one of these shots (replaces both the default v7dir and `/work_fable/take2/v7/orchestra`; `paperLook: 'orch'` no longer applies). Re-seeded at every film cut (forced cuts at each bu22-bu30 start). bu09 (pencil lead) not included. bu30's `seedPrev` irrelevant |
| dr01,02,04,06,08,10,14,19,21-23,25,29,32,34 (every v7 dr shot) | v7 full f_04584-05385 (152.80-179.50) | `v7/glyph_drop/` | 802 | 30 | first 4584 | drop look: `tools/glyphart/drop/slashpaper.js` = src/paper.js with glyph marks, seed 1000+s.i, t=k/30, drop SEC opts. `paper: 0`. Frames under plate inserts are rendered too (contiguous) but unused. Alternative: import `slashPaperPass` from `/fable/take2/tools/glyphart/drop/slashpaper.js` in place of paperPass for these shots (same signature) |

