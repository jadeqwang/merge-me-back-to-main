# Glyph art v8 (composed glyph painting): resume note

Owner: glyph-art agent. Jade's v7 notes 1:34.84 (b55.2), 2:15.93 (b79.1), 3:42.16 (b129.2).
Paths: `fable/take2/tools/glyphart/**` (code), `work_fable/take2/dev/v8_glyph/` (outputs, git-ignored),
`review/fable_take2/v8_glyph/` (chosen review images, committed). Does not touch shots.js / src / render.mjs.
Not an extension of `src/glyph.js` (fixed-grid ASCII ramp): new renderer, glyphs as paint strokes.

## Sources (song time -> shot -> clean source)
- 1:34.84 = shot ca10 `night world` (V7, b54-55, 92.264-95.727). Composite = v7 frame through the paper (hatch) pass.
  Clean source: raw v7 frame `work_fable/take2/v7/full/f_02845.jpg` (round(t*30)). Copied to `dev/v8_glyph/src/v7raw_2845.jpg`.
- 3:42.16 = shot cb09 `catch` (plate, b129, 221.436-223.135, clip0 0). Plate `work_fable/take2/plates/catch/` (drawn anime plate,
  24 fps, 1280x720): frame (222.16-221.436)*24+1 ~ f_0018. Copied to `src/catch_0018.jpg`.
- 2:15.93 = bu16 (V7 seq 08 frontal formation, wushu). Raw v7 frames `work_fable/take2/v7/full/` (e.g. f_04078);
  orchestra (b81-84) raw frames `work_fable/take2/v7/orchestra/f_04143..04394`.
- Current composites (likeness=0, hud=0): `src/cur_094.png`, `src/cur_222.png`, `src/cur_136.png`, `src/cur_139.png`.

## Fonts
System has only a few Noto fonts; added free OFL Noto fonts (downloaded from notofonts GitHub, not committed) into
`work_fable/take2/dev/v8_glyph/fonts/` (KR, Serif JP, Tibetan, Ethiopic, Devanagari, Naskh Arabic, Hebrew, Math, Symbols2,
Runic, Cherokee, Georgian, Thai, Tamil, Serif). Plus system Droid Sans Fallback, FreeSerif/FreeSans, DejaVu, Symbola.

## How it works (fable/take2/tools/glyphart/)
- `atlas.py`: 2,664 (char, font) glyphs in 20 script groups (Latin x7 fonts, Greek, Cyrillic, CJK x3 fonts, kana, Hangul,
  Devanagari, Arabic, Hebrew, Ethiopic, Tibetan, Georgian, Thai, Tamil, Runic, Cherokee, math, box/arrows, explicit
  stroke glyphs ノ丿|ー一―﹏∫ل...). Each cropped to ink; elongated ones (elong > 1.8) rotated so their main axis is +x;
  stored as 128 px alpha + 16x16 descriptor. Solid fills (█■●◆ etc.) excluded at paint time. -> `dev/v8_glyph/atlas.npz` (+ `_sheet.png`).
- `paint.py`: Hertzmann coarse-to-fine glyph layers (sizes 80/48/30/19/12/8 px, + 6/4.5 px inside focus ellipses = face, hands).
  Per layer: error vs source blurred at s/4 (measured on a keyline-free "decision canvas"), worst pixel per jittered grid cell
  over threshold gets a glyph; rotation = structure-tensor edge tangent (fine + coarse flow mixed), +180 at random; colour =
  source at that scale; glyph CHOSEN BY SHAPE FIT: patch under it rotated into glyph space (16x16), gain
  G = |canvas - t|^2 - |c - t|^2, score = G . mask over all glyphs, Gumbel-max sampling (tau 0.1) with a per-script prior and a
  bias to stroke-like glyphs where flow coherence is high (hair, folds). Each glyph stamped with a soft dark keyline (separates
  overlapping glyphs, like a stroke edge; softer in the face). Matte (BiRefNet via tools/matte.py) decides figure vs background.
  Palette modes posterise the source to the ink set first.
- `stills.sh`: renders all variants (4 parallel). `sheet.py`: contact sheet with 1:1 crops.
- Time: 3-10 s per 1920x1080 still (20-70k glyphs), python+numpy+cv2, 4 threads.

## Presets (paint.py PRESETS)
A colour_all (source colour, all scripts, whole frame) / B colour_figure (figure + bright light only, black paper) /
C colour_cjk (B with CJK/kana/hangul/strokes only) / D ink_palette (film ink set: cream, gold, orange, blue, violet, magenta,
teal on black) / E mono_ink (cream ink, 3 densities, black) / F paper_ink (dark ink on cream paper) / G sparse_big (bigger,
legible glyphs) / H dense (down to 3.4 px).

## Status
- [x] step 1 (2026-11-21 19:40): stills in `work_fable/take2/dev/v8_glyph/stills/` (night_* = 1:34, catch_* = 3:42);
  contact sheets `dev/v8_glyph/sheet_1m34_night.jpg`, `sheet_3m42_catch.jpg` (current | variants, 1:1 crops underneath).
  Committed copies: `review/fable_take2/v8_glyph/` (2 sheets + 6 stills).
  Command: `OMP_NUM_THREADS=4 bash fable/take2/tools/glyphart/stills.sh [names]`.
  My picks: 3:42 B (colour figure on black) and F (ink on cream paper); 1:34 A (whole frame in glyphs) and B.
  Weak: at full-frame viewing size the glyphs read as painterly texture; they are legible only at 1:1 (crops). The 1:34
  figure is small so her glyphs are tiny. Hair is the weakest area (dark grey glyph smoke). D on 1:34 is sparse.
- [x] step 2: `animate.py` (temporal glyph painting), preset colour_all (whole frame).
  - 2:15 test: song 135.0-141.6 (seq 08 wushu formation -> orchestra shots 1-3), 198 frames, 5.8 s/frame per worker, 731 s wall
    on 4 workers, ~58k glyphs/frame. `dev/v8_glyph/anim_wushu_orch/f_%05d.jpg` (number = round(t*30)),
    `dev/v8_glyph/glyph_2m15_wushu_orch.mp4` (1080p, with audio) + `_strip.jpg`.
  - 1:34 test: song 92.264-95.727 (ca10 night world, whole shot), 104 frames, 3.2 s/frame, 339 s wall on 2 workers.
    `dev/v8_glyph/anim_night/`, `dev/v8_glyph/glyph_1m34_night.mp4` + `_strip.jpg`.
  - Committed 720p copies + strips in `review/fable_take2/v8_glyph/`.
  - Method: shot cut by frame difference; first frame painted fresh; then glyphs carried by DIS optical flow (fwd-bwd check
    kills occluded ones), rotated by flow curl, scaled by flow divergence, recoloured from the new frame (50% smoothing);
    crowding cap 1 per (0.6 s) cell for fine layers (coarse layers never culled); holes filled by the painter's error-driven
    layers on top (threshold x2, new glyphs fade in over 3 frames); underpainting = source blurred 18 px at 70% so a hole is
    never black; boil: 8% of glyphs re-choose their character by shape fit on every eighth note (beat 0.43225 s from b79.1).
  - Coherence check: mean |frame - previous| of the output is 0.8-1.5x the source's (a random re-scatter would be far higher).
  - Known weak: cut detection missed the seq 08 -> orchestra "above" cut at ~139.0 (dark frames), so that shot inherits
    carried glyphs for its first frames (fill repaints it within a few frames). The 1:34 sky shows darker patches where the
    underpainting shows through holes. Fast motion + v7 motion blur makes bodies soft (glyphs smear into texture).
    No matte in animate.py (whole-frame style only); figure-only styles (B/D/F) would need a per-frame matte (tools/matte.py
    runs on mp4s).

## Commands
    OMP_NUM_THREADS=4 bash fable/take2/tools/glyphart/stills.sh [names]
    work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/animate.py --t0 T0 --t1 T1 --beat0 BARSTART --out DIR --workers 4 [--preset P --set k=json]
    bash fable/take2/tools/glyphart/encode.sh DIR T0 T1 OUTBASE        # mp4 with song + 8-frame strip

## Wiring into the film (for the compositor; not done here)
Frames are written with the v7 numbering (f_%05d.jpg, number = round(t*30)), so the cheapest route is the existing per-shot
`v7dir` mechanism (orchestra.md "For the compositor" item 2 makes `v7dir` per shot):
1. Render the wanted range with animate.py into e.g. `work_fable/take2/v7/glyph/` and write a `meta.json` there like
   v7/orchestra's: {"fps":30,"n":N,"t0":T0,"first":round(T0*30),"w":1920,"h":1080}.
2. In shots.js give those V shots `opt: { v7dir: '/work_fable/take2/v7/glyph', paper: 0 }` and make film.js skip
   `paperPass` for a shot with `opt.paper === 0` (the glyph frames are finished pictures; the hatch pass on top would muddy them).
3. For a plate shot (3:42 cb09 catch): run animate.py on the plate frames instead (needs a `--frames DIR` option, ~10 lines:
   frame_path() from the plate dir, plate fps 24 -> resample to 30), write a new plate dir `plates/catch_glyph/` with
   meta.json + REAL, and point the shot at it (`next`/id change). With the B/F looks it also needs the matte per frame.
4. Lyrics/overlays draw on top as for any other source.

## Iteration 2 (2026-11-21 ~20:10): glyph MARKS (coordinator's notes: v1 figure/face read as a filtered copy with letter texture)
New renderer `fable/take2/tools/glyphart/marks.py` (paint.py untouched; it still makes the v1 looks). Every glyph is a separate
flat single-value mark; paper shows between them; no underpainting, no source texture in the figure.
1. FILL: quadtree cells 40/20/10/5 px from a size field (detail -> small; face/hands focus: 10-12 px on smooth skin, 5 px only
   where there is detail; background 24-40). One glyph per cell at ~cell size (thin paper gaps), along the tangent field;
   glyph + ink value picked together by least squares against the tone patch (argmax 2v T.m - v^2 m.m, Gumbel variety); low tone
   = empty cell (paper); a second glyph on the residual in darks.
2. STRANDS: hair = dark figure region; evenly spaced streamlines of the coarse tangent field (scale 30), long stroke glyphs
   (丿 ノ ∫ ﹏ ~ ل ― ...) laid end to end along each (length 26 px, separation 3 px). No fill marks inside hair.
3. LINES: ridge map of the drawn lines (eyes, brows, mouth, contours; on the 3D night frame also bright edges); stroke glyphs
   placed greedily along it, spaced by their length (9 px in the face, 12-14 elsewhere), shape-fitted among stroke glyphs.
   Dark ink on cream; on black paper the lines are cut in the paper colour.
Presets: `ink_paper` (F2, dark ink on cream, 3 values), `mono_cream` (E2, cream ink on black), `colour` (C2, each mark one flat
colour from its cell, brightened). 1-6 s per still, 8-15k fill marks + 1.3k strands + 3k line strokes on the 3:42 frame.
Command: `bash fable/take2/tools/glyphart/stills_v2.sh` -> `work_fable/take2/dev/v8_glyph/v2/`; sheets
`dev/v8_glyph/sheet_3m42_catch_v2.jpg`, `sheet_1m34_night_v2.jpg`. Committed: `review/fable_take2/v8_glyph/*_v2.jpg`.
Judgement: 3:42 F2 is the best image so far (a pen drawing whose every mark is a glyph; likeness holds: eyes, parting, mouth).
E2/C2 3:42: skin is now dense legible glyph marks with gaps; hair reads as strands. 1:34 night: the background reads as
composed glyphs, but her figure is small and murky (few marks, dark trousers = paper on black); weaker than 3:42.
Next if wanted: night figure contrast (lift fg tone, finer cells), a mark-based animate (carry marks by flow, as animate.py does).

## Jade's direction after iterations 1-2 (relayed 2026-11-21), verbatim
"I think we should have 2 different styles of glyph art. * 3m42_catch_B_colour_figure.jpg is very good for these anime close-ups; I like all scripts full frame. * For 1m34_night_D_ink_palette.jpg and glyph_2m15_wushu_orch_strip.jpg, let's try another experimental type, where we have all the same font size and English glyphs only, and we end up with a similar resolution to the hashes. Can we see what that looks like?"
Coordinator's plan from it (replaces the iteration-3 list: no mark animation, no E2/C2 skin work):
- Style 1 (anime close-ups): paint.py preset colour_figure (look B), all scripts, full frame incl. background. Approved.
- Style 2 (new, priority): Latin/ASCII only, one font size, density/resolution matched to the hatch strokes, D ink palette on black.

### Style 1 (anime close-ups), approved: paint.py look B, all scripts, full frame
Still: `work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/paint.py SRC OUT.jpg --preset colour_figure --matte M.png --focus ...`
(see stills.sh, catch_B_colour_figure). Jade wants full frame incl. background in glyphs: use `--preset colour_all` with the
B settings, or colour_figure with `--set skip_lum=0` (background painted too).
Animated later for the 3:42 catch plate: `animate.py` (same painter, flow-carried, eighth-note boil) needs a `--frames DIR --fps 24`
option (frame_path() from `work_fable/take2/plates/catch/frames/f_%04d.jpg`, nearest plate frame for song t = 221.436 +
(i+0.5)/24) and the per-frame matte if B's figure/background split is wanted (`tools/matte.py` on an mp4 of the plate frames).
Command once added: `animate.py --frames work_fable/take2/plates/catch/frames --fps 24 --t0 221.436 --t1 223.135 --beat0 221.436 --preset colour_figure --out ...`.
Not built yet (no new style-1 work requested now).

### Style 2 (hash glyphs), 2026-11-21 ~20:20: `hashglyph.py` (stills), `animate_hash.py` (animation)
Scale measured from src/paper.js at 1080p: contour strokes 9-17 px long, one per 4x4 px cell; hatch spacing 8 px, strokes
~20-35 px, tone layers from .12/.40/.66; paper #141317; chalk #ECE6D8, inks by hue when saturated.
Built: ASCII printable only (86 glyphs, specks . , ' ` : ; " ^ dropped), ONE font at ONE size (em 14 px: cap ~10 px, '|' ~14 px
= a contour stroke), centred on ink centroid. Contour: one glyph per 7x7 cell at the strongest DoG edge pixel, its own main
axis turned along the edge, chosen by shape fit to the edge patch (| / \ - l I ( ) win on lines). Tone: three layers on 8/9/10
px jittered grids where tone (lum, .3 floor) > .12/.40/.66, turned along the structure tangent, shape fit to the tone patch
(M W # @ & in brights). Colour: chalk, or the nearest D ink by hue where saturated (as paper.js). Paper #141317.
Animation: glyphs carried by DIS flow; keep character + flip; re-aim along current edge (nearest branch); dropped when their
reason goes (edge < 70% threshold / tone below layer) or crowded (one per 0.7-cell); new ones fill empty cells (fade 2 frames);
boil 10% re-chosen on each eighth note; re-seed at camera cuts (hue/sat histogram correlation < .7: 4170, 4195, 4221 in this
range; the raw v7 wushu frames 4050-4169 are one continuous camera, the film's cuts there are to plate inserts).
Speed: 0.4 s per still; animation 0.9 s/frame/worker, 198 frames in ~100 s on 4 workers, ~26-31k glyphs/frame.
Outputs (dev): `work_fable/take2/dev/v8_glyph/s2/` (night_mono, night_serif, night_mono_em20, anim_mono/, anim_serif/,
s2_2m15_wushu_orch_{mono,serif}.mp4 + _strip.jpg). Sheet `dev/v8_glyph/sheet_1m34_night_s2.jpg` (v7 hatch | v1 D | s2 mono |
s2 serif | s2 mono 20 px, 1:1 crops). Committed `_s2` copies in `review/fable_take2/v8_glyph/` (sheet, 3 stills, 2 x 720p mp4 + strips).
Commands:
    work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/hashglyph.py SRC OUT.jpg --font mono|serif|sans|typewriter --em 14
    work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/animate_hash.py --t0 135.0 --t1 141.6 --font mono --out DIR --workers 4
    bash fable/take2/tools/glyphart/encode.sh DIR 135.0 141.6 OUTBASE
Judgement: at 14 px it has the hatch's resolution and reads like the hatch shots, but the letters are only legible up close
(at full frame it is "sketchy lines"); 20 px shows letters (0 9 G u #) while keeping the look. Mono vs serif differ little at
this size. Weak: the night sea glow is a cloud of small glyphs; in the orchestra shots frame-to-frame change is ~1.5-2x the
source's (dense sharp marks moving plus some churn), so there is some shimmer; wushu part is as stable as the source.
Wiring: same as before (frames use v7 numbering -> per-shot v7dir with the paper pass skipped).
