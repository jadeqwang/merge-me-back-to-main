# F1 — engine core, render harness, world. Resume note

Scope (F1 owns): `fable/engine/` except `src/figure/**` and `figlab.html`; `fable/tools/render.mjs`; `fable/show/lookdev_world.js`.
Spec: `fable/SPEC.md`. Raw WebGL2, no three.js. `ENGINE.render(t)` is a pure function of song time.

## Built and working (2026-11-10)
- `fable/tools/render.mjs`: harness. Chrome (ANGLE Vulkan, RTX 3090), puppeteer-core + ws from `engine/node_modules`, `/usr/bin/ffmpeg`, TMPDIR `/tmp/mfb`.
  Frames go page -> node as raw RGBA in one binary WebSocket message (HTTP POST of 8 MB from Chrome took 194 ms; WebSocket 50 ms).
- `fable/engine/index.html` + `src/main.js`: pipeline. Per sub-sample: planar reflection pass (mirrored view) -> sky -> mirror ground -> `ground`
  pass (roads, decals) -> `opaque` pass (MRT colour + aux, depth) -> ink outline from aux/depth -> `add` pass. Then accumulation (motion blur +
  jittered AA), bloom pyramid, anamorphic streak, ACES-ish tonemap, grade, vignette, grain, CA, HUD. README comment at the bottom of main.js.
- `src/sky.js` (dawn 0..1 model, stars, airglow, sun), `src/ground.js` (mirror, band-limited swells, sky smeared along the sight line),
  `src/roads.js` (core line + JetBrains Mono text along the curve + commit nodes, reveal by `head`, pulses, night emissive / day ink),
  `src/lights.js` (bokeh with true CoC), `src/type.js` (world-space lyric type, word-by-word wipe on word times, reflection, light/ink),
  `src/hud.js`, `src/tree.js` (1,024-tip dendrite), `src/camera.js` (mat4, buildCamera, camPath), `src/time.js` (timing.json), `src/rng.js`,
  `src/post.js`, `src/glx.js`, `src/shapes.js` (placeholder capsule).
- `fable/show/lookdev_world.js`: five look-dev shots (`--q shot=1..5`): night ground level, top-down tree + title, blue hour, sunrise, day.

## Commands (run from the repo root)
- Still:  `node fable/tools/render.mjs --show /fable/show/lookdev_world.js --q "shot=1" --stills 6:work_fable/stills/f1/a_night.png [--mb 8 --shutter 0] [--verify]`
- Sheet:  `node fable/tools/render.mjs --q "shot=1" --sheet 0:6:0.5:work_fable/stills/f1/a_sheet.jpg:4`
- Clip:   `node fable/tools/render.mjs --q "shot=1" --from 0 --to 6 --mb 4 --workers 3 --audio --mp4 work_fable/stills/f1/a_night_6s.mp4`
- Bench:  `node fable/tools/render.mjs --q "shot=1" --bench 3 --mb 4`
- Stills are in `work_fable/stills/f1/` (a_night, b_tree, b_tree_mid, c_bluehour, d_sunrise, e_day, a_sheet.jpg, a_night_6s.mp4).

## Measured
- Scene render ~1.5 ms per sub-sample at 1080p; readPixels 4 ms; transfer 50 ms. One worker: ~8.5 fps at mb 4 (99 ms/frame, encode not the limit).
- Determinism: same frame rendered twice is byte-identical (`--verify`), at mb 1 and mb 8.

## Gotchas learned
- GLSL `pow(x, 2.)` with negative x is NaN on this driver: square by multiplying.
- Value-noise finite differences gave 1 px dark dashes in the mirror; ripples are now a sum of band-limited sines.
- The ACES fit is pre-scaled by 0.6; day scenes need exposure ~1.75, night ~1.3-1.5.
- `--stills` splits on commas, so no commas in file names. Road text reads correctly from one side only: `flip:true, textSide:1` reads
  from the -z side of a road heading +x.
- `work_fable/` is NOT matched by .gitignore (`work/` only matches a dir named work). Never `git add` it.

## In the middle of / next
- Final AA stills of the five shots and a 4-worker timing run were in flight when this note was written.
- Not yet exercised by a real figure: the outline pass and opaque reflections with part-id aux (only the capsule has used them).
- Possible later work: DoF for type/roads (none now), a cheaper sky for reflection taps if a show gets slow, HUD position/size options.
