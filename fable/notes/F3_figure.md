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

## Look (current)
- LIGHT (solid 0): mesh = near-black occluder with a thin lane rim; clothes = fibres (far: threads of light broken into "words";
  close, when a glyph is > ~7 px: lines of real text along the thread, from the instance's story row); jacket threads pale warm, trouser
  threads lane colour; band, straps, headphones solid orange; back disc blue; RARE EARTH and patch crisp; skin = cream lantern
  (bright where it faces the camera, dark at the edge) with closed-eye arcs; hair = fine additive filaments (it does not occlude).
  `density` removes fibres and hair strands.
- SILHOUETTE (solid 1, dawn ~0.6): black mesh, warm rim toward `u_sun`, a little sun through the trouser hems and some hair tips,
  orange accents alight; hair = opaque ribbons that close into a mass.
- CEL (solid 1, dawn 1 or `cel:1`): character-sheet colours, soft 2-tone terminator, aux (flat colour mixed with a per-region tint,
  alpha = cel) for the ink outline pass, face = closed arcs + brow hint + blush drawn in head space, hair black with one sheen band.
- Performance (RTX 3090, 1080p, lab incl. reflection + bloom): 1 hero 2.3 ms; 1,024 instances 8-11 ms.

## Known problems / next
- Light-mode skin still reads a little like a matte mannequin in the lab (flat tonemap, no halo). Try in the real engine with bloom;
  if it still does, add an additive soft halo sprite at head/hands and lower the surface term.
- Trouser sail: the fabric hangs at most ~10 cm off a raised leg (limit = ring radius - 0.048); for a bigger sail raise the hem radii
  in `LEGR` (the character sheet argues for the current size) or loosen the limit.
- Hairline at the forehead is a bit jagged in cel close-ups; front locks are thin.
- Butterfly silhouette depends a lot on yaw (see `sil_butterfly`, `_b`, `_c`); `_c` (t 1.12, yaw 2.4) reads best.
- Open eyes (`eyes:true`) are plain dark ovals: use the closed arcs.
- Opaque surfaces have no depth of field (only fibres/hair/trails attenuate with the circle of confusion).
- In the lab's sunrise shots the sun and its reflection are the lab's own sky, not the engine's.
