# F3 — the figure (Jade). Working notes for whoever continues

Spec: `fable/SPEC.md` §3 (look) and §5 (skeleton, track format, Drawable contract). This file is the state of the work
after the director's rework (mesh + cloth-lite trousers + fibres). The earlier surfel/glyph-row version is in git history (6361fa6, 2d1fb7a).

## Files
- `fable/engine/src/figure/m.js` — vec/quat helpers, seeded rng, tiny mat4 (lab camera).
- `fable/engine/src/figure/skeleton.js` — 21 joints, rest pose = `fable/tools/bake/skeleton.json` (A-pose, arms 35 deg from the body, hips 1.005 m),
  rest frames per SPEC §5, `loadTrack(urlNoExt)` (keeps `meta`), `boneScales`, FK + procedural `testTrack(kind)` (lab only).
- `fable/engine/src/figure/body.js` — `buildBody()`:
  - every form is a `Loft` (elliptical rings, Catmull-Rom) listed with a config in `defs`; from the same lofts come
    (1) the skinned triangle mesh in 3 LODs (20.3k / 5.3k / 1.7k triangles), (2) a part-id atlas (R8, one tile per loft, 255 = hole) so the
    orange band, the open jacket front and skin/cloth borders are crisp, (3) the FIBRES (463 threads running top to bottom along jacket,
    sleeves, waist and trouser legs; 30 segments each, shuffled so a prefix is an even subset);
  - decal points (4.7k): back disc, RARE EARTH (canvas-rasterised Archivo), chest dot, 1420 MHz patch (text not mirrored: checked);
  - trousers: each leg is a chain of 8 ring centres (`LEGR` = y, centre x, rx, rz per node; `LEG.K` = stiffness per node), hem about 0.31 x 0.32 m;
  - hair: guide grid 14 columns (where the hair leaves the head, ear to ear round the back) x 4 layers (root height), each guide pinned
    over the scalp then free to the waist; 2 slim front-lock guides per side; 4 short temple wisps (bun variant only); 1,092 render strands;
  - variant 2 lofts: bun + two pencils.
- `fable/engine/src/figure/sim.js` — `simulate(track, body, opts)`: once per track, 60 fps x 3 substeps, verlet with drag and a speed limit
  (`vmax` 7 m/s): hair (capsule colliders, bending resistance, neighbour cohesion in the guide grid, back hair nudged behind the shoulders),
  3 straps, jacket-hem lag spring, trouser chains (pinned at the hip, stiffness falling to the hem, leg axis kept inside each ring, floor).
  In-place loops (`meta.speed`) get an apparent head wind (half the speed) so hair and cloth stream. One row of `SIM.W` = 940 texels per frame.
- `fable/engine/src/figure/figure.js` — `Figure`: programs mesh (also draws the decal points), fibre, ribbon (hair, straps, trails).
- Lab: `fable/show/figlab.js`, `fable/engine/figlab.html`, `fable/tools/figlab.mjs`.

## Commands
```
node fable/tools/figlab.mjs                       # every shot in SHOTS -> work_fable/stills/f3/<shot>.jpg (1920x1080)
node fable/tools/figlab.mjs sil_sidekick cel_run  # some shots
node fable/tools/figlab.mjs --perf light_front_full formation_light
node fable/tools/figlab.mjs --tracks idle,butterfly,my_new_track --custom '{"dawn":0.6,"cam":{"az":-1.57,"dist":6,"target":[0,1,0]},"inst":[{"track":"my_new_track","time":1.2,"solid":1}]}' --out test
```
The lab loads `idle,butterfly,sidekick,run_loop,sprint_loop,walk_loop,lookback,turn_around` from `work_fable/tracks/` by default.

## API
```js
const fig = new Figure(gl, { fontBase:'/engine/fonts/', stories:[...] }); await fig.init();     // ~3 s (template + atlas)
const id = fig.addTrack(await loadTrack('/work_fable/tracks/butterfly'), simOpts /* {wind, gust, airSpeed, drag} */);
fig.begin();
fig.add({ pos:[x,0,z], yaw, scale, track:id|'name', time, lane:[r,g,b], density:0..1, solid:0..1, cel:-1 (auto from dawn)|0..1,
          variant:'bun', story:row, alpha, gain, eyes:true (open; default closed arcs), lodBias,
          seed /* non-zero: per-instance variation: +-25 ms, +-2.5 % height, hair length */, vary:0|1,
          trail:{ len:seconds, gain, width, color, mask:bits|['handL','handR','toeL','toeR','strap0..2','hair0..5','hemL','hemR'] } });
fig.draw(ctx);   // once per pass; ctx per SPEC §5 plus optional ctx.sunDir
```
Looped in-place tracks (`run_loop`, ...) do not travel: the caller moves `pos` at `track.meta.speed`.

## Look (current, after the director's second review): ONE shading model, lit by the world
There is no separate "light mode" any more. She is always the cel character (mesh + flat albedo); `fig.lightFor(ctx)` picks the light.
```js
fig.light = { ambient:[r,g,b], rimCol:[r,g,b], rimDir:[x,y,z] (default east), rimBoth:0..1 (rim on both edges vs only toward rimDir),
              sunAmt:0..1 (key light + ink outline + face), under:gain (road light from below, lane-coloured), emissive:gain,
              fibres:gain, trans:0..1 (sun through hems / hair tips), sunDir };   // any subset; also ctx.env.figLight
```
With no input the values are interpolated from `ctx.dawn` between four keys in `lightFor` (figure.js): night 0 (deep indigo ambient,
teal rim on both edges, underlight 1, accents emissive 1.25, fibres 1), blue hour 0.35, sunrise 0.6 (near-black, hot rim toward the
sun, translucency 1, accents 1.5), day 1 (full cel, outline, face, no emissive).
- Mesh: `albedo * (ambient + (1 - ambient) * sunAmt * terminator)` + thin rim (tinted 35 % by lane) + underlight (lane colour, strongest
  at shoes/hems, gone by 1.05 m) + emissive accents (band, straps, headphones, back disc, RARE EARTH, patch) + hem translucency.
- `solid` (default now 1): 0 = accents + rim only, 1 = fully lit by the current light. `cel` is ignored.
- Hair: always opaque black ribbons (1,092 strands, tapering to points, length varying smoothly across the mass), Kajiya-Kay sheen
  band + rim; the mass parts down the middle of the back (two curtains) so the disc and RARE EARTH show between them.
- Fibres: 1,352 fine threads (3 mm pitch), additive, intensity = fresnel x slow patchy noise x `density` x `light.fibres`
  (a shimmer at the silhouette edges at night, nothing by day).
- Face: closed-eye arcs, brow hint and blush only appear with `sunAmt` (day). No face at night.
- Trousers: hem 0.39 m wide x 0.55 m deep (bigger than the sheet, for the sail).
- Performance (RTX 3090, 1080p, lab incl. reflection + bloom): 1 hero 5.5 ms; 1,024 instances 10-11 ms.
- Lab: shots are named `night_*`, `blue_wedge64`, `sunrise_*`, `day_*`, `formation_*`; `road: LANES.x` on a shot draws a glowing line
  under her; sheets `sheet_night.jpg`, `sheet_arc.jpg`, `sheet_wedge.jpg` in `work_fable/stills/f3/` are composites made by hand with `magick`.

## Known problems / next
- Frame-0 shot (3/4 back): the disc reads, RARE EARTH reads as "ARE EARTH" when the camera is on her left (the near hair curtain covers
  the R). Either put the camera on the other side, widen the parting (`0.105` in the hair block of RIB_VS), or shorten the near curtain.
- At rest in a narrow stance the big hems overlap and the trousers read as a gown from the front (day_front); in motion they read as trousers.
- Night underlight is strong on the trousers (gain 1.3 in MESH_FS `under`); the real engine should pass `light.under` per shot.
- Hair tips still show a little fringe in day close shots; forehead hairline is the cap edge of the head loft (512 px atlas tile).
- Blue-hour look was only judged in the lab's sky, which goes pink there; re-judge in the real engine.
- Butterfly silhouette depends on yaw (`sunrise_butterfly` uses t 1.12, yaw 2.4).
- Opaque surfaces have no depth of field.

## Phase 4: in the real engine (fable/show/figtest.js)
`node fable/tools/render.mjs --show /fable/show/figtest.js --q "shot=N&v=K&tt=<track s>" --stills 0:work_fable/stills/figtest/x.png`
Shots: 1 frame 0 · 2 night run (v0 behind, v1 side) · 3 fork (tt 0.9/1.0/1.4) · 4 violet (v0 writing t 18.5, v1 seated t 27) · 5 float top-down ·
6 blue-hour wedge of 16 · 7 sunrise (v0 butterfly, v1 + 256 troupe, v2 1,024 lying, top-down) · 8 day (v0 `free` leap t 1.74, v1 standing) · 9 catch at sunrise.
Stills: `work_fable/stills/figtest/` (`sheet_a.jpg` = shots 1-6, `sheet_b.jpg` = 4, 7, 8, 9; `s*_*.png` full size).
- The figure needed NO engine patch: it is a plain drawable (`drawables: [..., fig]`), uses ctx.view/viewProj/sunDir/dawn/env, writes aux alpha =
  sunAmt x solid, which the engine's outline pass reads as "ink only by day". It imports `skyParams` from `engine/src/sky.js` (read only) so the
  rim takes the horizon colour of the engine sky at that dawn; at dawn > 0.45 the rim direction is the engine's sun direction.
- Night keys in `lightFor` were re-tuned in the engine (ambient x3, rim x2.5, emissive 2.0): the lab now looks brighter than the film.
- New: `water` sim mode (track `meta.water` or simOpts.water): hair rises to y~0.1 and fans from the head. Hems draw in at rest
  (sim writes a per-leg flare 0..1 from hem speed into lag slots 0/1; the ring shrinks 27 % wide / 40 % deep at flare 0).
- Tracks with root travel (e.g. `violet` ends 34.7 m along her +Z): place `pos` accordingly. In-place loops: move `pos` at `meta.speed`.
- Performance in the real pipeline at 1080p, per sub-sample: 1 hero 1.6 ms; hero + 255 troupe 13.1 ms; 1,024 (top-down, far LOD) 7.3 ms.
- Not judged closely: frame 0 is still dark (disc reads, RARE EARTH is small at that framing); 1,024 lying from 62 m read as small figure glyphs.

### How cast.js should drive it
```js
import { Figure, LANES } from '../engine/src/figure/figure.js';
import { loadTrack } from '../engine/src/figure/skeleton.js';
const fig = new Figure(engine.gl, { fontBase: '/engine/fonts/' }); await fig.init();          // once, ~3 s
const tracks = {}; for (const n of ['idle', 'run_loop', 'fork_L']) { const t = await loadTrack('/work_fable/tracks/' + n, n); tracks[n] = t; fig.addTrack(t); }
// every frame(t), before returning:
fig.begin();
fig.add({ pos: [x, 0, z], yaw: Math.PI / 2 /* faces +X (east) */, track: 'run_loop', time: tLocal, lane: LANES.main,   // LANES here are linear [r,g,b]
          density: 1, solid: 1, seed: branchId, variant: isViolet ? 'bun' : undefined, story: row, trail: { len: 0.4, mask: ['handL', 'toeR'] } });
return { camera, env /* optional env.figLight = { under: 0.6, ... } */, drawables: [roads, lights, fig], hud };
// in-place loops: x += tracks.run_loop.meta.speed * dt * rate;  track events: tracks[n].events = [{t, name}]
```
