# Take two: the paper pass and the glyph pass (PLAN section 2 items 2 and 5, section 5 items 9 and 10, section 9 tests 8 and 10)

Owner paths: `fable/take2/src/paper.js`, `fable/take2/src/glyph.js`, `fable/take2/fx_test.html`, `fable/take2/tools/fx/**`, this file.
Data (git-ignored): `work_fable/take2/tests/paper/`, `work_fable/take2/tests/glyph/`.

## API (both synchronous Canvas 2D, import from the compositor)

```js
import { paperPass } from './src/paper.js';
import { glyphPass, loadGlyphFont } from './src/glyph.js';
await loadGlyphFont('/engine/fonts/JetBrainsMono[wght].ttf');   // once
paperPass(ctx, src, { x, y, w, h }, { paper: 'black', stroke: '#FFC23A', t, seed });
glyphPass(ctx, src, { x, y, w, h }, { text: [...], keep: { mask, luma: true, feather: 3 }, t, seed });
```

`src` is anything drawImage takes (ImageBitmap, canvas). Both cover-fit the source to `rect`. Every option is documented at the top
of each file. Both are deterministic (same inputs, same pixels; checked by md5 on two runs) and boil only on 12 fps steps
(`floor(t * 12)`): two times in the same 1/12 s give identical pixels.

## Paper pass: how it draws
1. Analysis at half size; tone at quarter size. Tone levels are anchored at the frame's median (black paper: marks where it is
   lighter than typical; white paper: where darker), so skies and flat areas stay bare paper.
2. Contour: one-sided DoG at half size (light side on black paper = chalk on the rim; both sides on white paper) turned into short
   vector strokes laid along the edge at the strongest pixel of each 2x2 cell, re-laid every boil step. Plus a coarse DoG at quarter
   size (with colour edges on white paper) for big soft forms: this is what draws the sun's circle on white paper.
3. Tone: hatching as real Canvas paths (tapered, bowed lens shapes) on up to three angles; a stroke is drawn whole or not at all by
   the tone at its centre and shortened where it would leave its area. The core above `solid` is rubbed in (soft fill).
4. Paper grain: the sheet (colour + grain) is drawn first; a paper-coloured "tooth" overlay is laid back over the marks where the
   grain is low, so marks break on the tooth. The paper never boils.
5. Colour: `stroke` (neutral) or `ink` colours kept from the source by hue.

Parameters that mattered: median-anchored levels (first try used percentiles: the whole sky was hatched, looked like a filter);
tone gamma 1.5 (separates the sun from its glow); vector contour strokes instead of an upscaled edge image (the image read as a
glow/filter, the strokes read drawn); stroke length 56 px at 1080p and width .08-.24 of the spacing (longer read as scribble);
colour edges in the coarse DoG (a yellow sun in a pink glow has almost no luminance edge).

Recipes used in test 8: sunrise = `{paper:'black', stroke:'#FFC23A'}` (gold and black only); white paper = `{paper:'white',
ink:['#FFC23A']}`; MAIN from above = `{paper:'black', ink:['#FFC23A','#FF7A1A']}` and `{paper:'white'}`.

## Glyph pass: how it draws
Port of v6 `engine/src/textlook.js` (branch `origin/claude/v6-text`): same ramp `.:-=+*#%@`, same 12 fps boil rule (a fraction
of cells moves one ramp level per step), same "bright regions take real text" rule. v6 drew a TextGrid through a three.js shader
with an atlas; here an atlas of real JetBrains Mono glyphs (filled lazily with `fillText`) is blitted per cell with alpha =
brightness, then tinted per cell (`source-in` with a cols x rows colour canvas). New: cell luminance = mean mixed with the peak of
3x3 samples plus local contrast (thin bright strokes survive); `|/-\` by edge direction; two cell sizes for depth (far 24 px font,
near 36 px; far cells dimmer); text runs only where a bright run is at least `textMin` (8) cells long so it reads as words; each
row starts a different message; text stays on the far plane; `keep` mask or rects where the source shows through untouched.

Recipe used in test 10 (`work_fable/take2/tests/glyph/opts_glyph.json`): gain 2.4, gamma .6, local .8, peak .8, hi .9,
thresh .12, floor .22, depth [.69, .71] with dither 0 (near cells for the audience below the screen's edge).

## Tools and commands
- `node fable/take2/tools/fx/fx.mjs --pass paper|glyph --in <still|frames dir> --out <png|mp4|dir> --opts '<json|[json,..]>|@file'
  [--side] [--mask still|dir] [--t0 s] [--fps 30] [--srcfps 24] [--dur 3] [--workers 2] [--scale-out .5] [--time N] [--prof]`
  (headless Chrome via engine/node_modules puppeteer-core; max 4 workers).
- `fable/take2/fx_test.html?pass=paper&src=/path.png&opts={...}&side=1` by hand in a browser.
- `fable/take2/tools/fx/matte.py`: BiRefNet keep masks (local ONNX, CPU here: about 10 s a frame under load; `--every 3`).
- `fable/take2/tools/fx/test8_paper.sh`, `fable/take2/tools/fx/test10_glyph.sh`: the two tests end to end.
- v7 sources: `node fable/tools/render.mjs --show /fable/show/main.js --q "notype=1&nohud=1" --stills T:out.png` (OLD song time).

## Timing (1080p, headless Chrome, software raster, machine loaded by other renders, so upper bounds)
See the status section below for the latest numbers.

## Status
- Paper pass: built; test 8 rendered. Glyph pass: built; test 10 rendering.
- Next: speed (paper is over the 60 ms target under load), glyph audience reads weakly (heads), judge both at speed.
