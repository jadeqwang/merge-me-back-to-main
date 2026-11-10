# Anime look-dev for the protagonist (experiment; NOT in the film)

Asked by Jade: "how do you feel about experimenting with anime styling for the protagonist and seeing if you like that?"
This is that experiment, isolated from the film: nothing under `fable/engine/src/figure/`, `fable/show/seq/`, `main.js`, `cast.js`,
`world.js`, `kit.js` was touched. Status and verdict are at the bottom (kept current at every checkpoint).

## Files (all of it)
- `fable/engine/src/figure_anime/` — a copy of the figure module with the same public API (`new Figure(gl, opts)`, `init`, `addTrack`,
  `begin`, `add({...})`, `draw(ctx)`, variants `bun` / `bun_write` / `bun_one`, `fig.light`, `env.figLight`, trails, instancing, LODs).
  - `body.js` — anime head (wider cranium, small soft-pointed chin, flatter face plane, nose / lips / chin pushed out of the loft so the
    profile reads), the hairline as a function (`hairD`, identical maths in the shader), hair as 22 CLUMPS on the unchanged guide sim,
    flat hands that the vertex shader bends, consistent triangle winding (needed by the hull outline).
  - `shade.js` — everything that looks different: mesh vertex + fragment shader (cel shading, folds, FACE, hull), clump shaders.
  - `figure.js` — the renderer: + clump program, + hull pass, + per-instance `face` / `hand`, + `fig.light.keyDir / ink / face`.
  - `sim.js` — unchanged except the head collider (bigger head). `skeleton.js`, `m.js` — unchanged copies.
  - `sheet.sh` — renders cells of the lab and tiles them into one labelled JPEG.
- `fable/show/animelab.js` — the lab show: current figure (screen-left) and anime figure (screen-right), same pose, same light, real engine.

## What "anime" means here (the design)
- FACE, drawn analytically in the head joint's frame (no textures): upper lid as a flat-topped arch with a lash stroke that thickens
  outward and ends in a flick, lower lid, tall iris (dark at the top, amber low, limbal ring), pupil, two catchlights (same side in both
  eyes), brow, a nose mark, a mouth line (opens to a soft D), blush. Planar projection along the head's Z onto a flattened face plane,
  so in three-quarter view the far eye narrows against the contour and in profile the eye is a wedge. The head is lit with clean
  spherical normals (no noisy terminator); the neck is always in the jaw's shadow; the hair lays a shadow band on the forehead.
- Every edge is filtered by its own pixel footprint (`aa`, `line` in shade.js): strokes hold about one pixel until they are a third of
  that, then fade; the eye white fades before the iris; beyond about 1 cm of face per pixel nothing is drawn. No LOD switch, no pop.
- Expressions per instance: `face: { expr: 'neutral' | 'determined' | 'joy' | 'back' | 'calm', amt, blink, gaze: [x, y], lookAt: [x, y, z] }`.
  Blink is automatic (seeded, every 3.3-5.7 s, 0.17 s) unless `blink` is given; `lookAt` is solved on the CPU from the track's head joint.
- LIGHT ARC (same keys as the current figure): night = shadow tones (skin keeps 1.6x the ambient, so a face, not a hole), a hard rim band,
  catchlights in the horizon's colour and the lane colour low in the iris; sunrise = silhouette (`light.face` 0: no catchlights); day = full
  colour, hard two-tone with designed shadow tints per material, ink.
- INK: inverted hull (the mesh pushed along its normals, front faces culled) in world units, capped at about 3 px, heavier on big forms
  and on the shadow side, brown round skin; plus the engine's existing aux-buffer outline for the thin interior lines. Daylight only
  (`light.ink`, default from `sunAmt`): at night the rim band is the line.
- HAIR: a cap (part of the head loft, pushed out) + 18 back clumps in two layers + 2 side locks per side (+ 2 temple wisps with the bun).
  A clump is a flattened tapered tube round a curve interpolated between two neighbouring guides of the SAME sim as the current figure;
  the back mass still parts down the middle so the disc and RARE EARTH show. Two flat tones, a hard rim on the whole mass, and a ring of
  uneven spikes round the crown in head space that slides with the camera (the "angel ring").
- HANDS: flat mitten + thumb, bent at two knuckle lines in the vertex shader. `hand: -1 (splayed) .. 0 (relaxed) .. 1 (fist)` or `{ L, R }`.
  `bun_write` closes the right hand round the pencil by itself.
- COSTUME: same lofts, same accents. Folds are shadow shapes drawn in loft space (`folds` in shade.js): tall wedges rising from the trouser
  hems, creases at the knee, gathers above the jacket's elastic hem and at the cuffs, a wedge inside the elbow.

## Commands (repo root)
```
S=fable/engine/src/figure_anime/sheet.sh
$S out.jpg <mode> <fig: both|old|anime> <res> <cols> <cell px> "<cell[:label] ...>" ["extra=query"]
$S work_fable/stills/anime/dev/a.jpg A both 720x720 4 480 "0:front 1 2 3 4:back 5 6 7"
node fable/tools/render.mjs --show /fable/show/animelab.js --q "mode=D" --res 1280x720 --from 0 --to 6 --mp4 work_fable/stills/anime/D_clip.mp4
node fable/tools/render.mjs --show /fable/show/animelab.js --q "mode=P&fig=anime" --bench 0     # 0 = 1,024 far, 1 = hero + 255, 2 = one hero
```
Modes and cell numbers are listed at the top of `fable/show/animelab.js`. Outputs: `work_fable/stills/anime/` (git-ignored).

## How to swap it into the film (if approved)
`fable/show/cast.js` line ~30: import `Figure, LANES` from `../engine/src/figure_anime/figure.js` (and `loadTrack` from either skeleton.js).
Nothing else is required: old instance options still work (`eyes: false` maps to the `calm` closed-eye face; otherwise eyes are open and
blink). To use the new controls, pass `face` and `hand` through `cast.js`'s `set()` (one line next to `eyes: s.eyes`).
