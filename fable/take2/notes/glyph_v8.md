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
- [ ] step 2: animation test (wushu/orchestra, ~2:15), mp4 + strip
