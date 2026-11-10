# F3 — the figure (Jade as bone-attached particles). Working notes for whoever continues

Spec: `fable/SPEC.md` §3 (look) and §5 (skeleton, track format, Drawable contract). This file is the state of the work.

## What exists and works
- `fable/engine/src/figure/m.js` — vec/quat helpers, seeded rng, tiny mat4 (lab camera).
- `fable/engine/src/figure/skeleton.js` — 21-joint canonical skeleton, A-pose rest (arms 52° below horizontal), rest frames exactly as SPEC §5
  (track quat = world orientation of the joint frame; local +Y to the child, +Z front; feet/toes +Z = top of foot), `loadTrack(urlNoExt)`,
  `boneScales(track)` (per-bone along-bone scale from the track JSON's `boneLengths`), FK for authored poses and the procedural
  test tracks `testTrack('idle'|'walk'|'run'|'turn'|'kick'|'lunge'|'stress')` (lab only).
- `fable/engine/src/figure/body.js` — `buildBody()`: the particle template, shaped from lofted elliptical cross-sections in the rest pose.
  Kinds: 0 fill surfels (close the surface), 1 glyph lattice (rows of text round the cloth: pitch 12.8 x 20.5 mm), 2 decals (back disc,
  RARE EARTH, chest dot, 1420 MHz patch), 3 eyes (variant 3 = closed arcs, default; variant 4 = open ovals + lash). Variant 2 = bun + two pencils.
  Also returns hair guides (60 long + 4 short temple strands, 14 nodes; each guide has `pins`: a combed path over the scalp that is kinematic),
  ~936 render strands (3 nearest same-side guides + weights), 3 strap chains.
- `fable/engine/src/figure/sim.js` — `simulate(track, body, opts)`: deterministic verlet over the whole track at 60 fps x 3 substeps:
  hair guides (capsule colliders on head, neck, shoulders, jacket, arms, waist, pelvis; long hair is biased to fall BEHIND the shoulders),
  3 strap chains (collide with pelvis and trouser legs), 3 lag springs (trouser hems L/R chase the ankles at 2.1 Hz, jacket hem chases the chest).
  Output one row of `SIM.W` = 924 texels per frame (hair/strap nodes relative to the hips joint; lags are offsets). ~1 ms per track frame.
- `fable/engine/src/figure/figure.js` — `Figure`: instanced renderer behind the Drawable contract. Two programs: body points and ribbons
  (hair strands, straps, motion trails). Tracks live in a float atlas (joints RGBA32F, sim RGBA16F, 4096 rows per column), a track table
  texture holds start/frames/loop/fps/loopDelta/bone scales. Auto LOD: instances are bucketed by on-screen height, each bucket draws a
  prefix of the (shuffled) particle ranges with larger points.
- Lab: `fable/show/figlab.js` (mini renderer: sky by `dawn`, mirror reflection, bloom, aux outline, tonemap; shot table `SHOTS`),
  `fable/engine/figlab.html`, `fable/tools/figlab.mjs` (puppeteer still capture).

## Commands
```
node fable/tools/figlab.mjs                      # every shot -> work_fable/stills/f3/<shot>.jpg (1920x1080)
node fable/tools/figlab.mjs light_back_full sil_kick
node fable/tools/figlab.mjs --perf formation_light light_front_full
node fable/tools/figlab.mjs --tracks idle,walk   # also load baked tracks work_fable/tracks/<name>.bin/.json
node fable/tools/figlab.mjs --custom '{"cam":{"az":0.3,"dist":5},"dawn":0,"inst":[{"track":"idle","time":1}]}' --out mytest
```

## API (what the show code uses)
```js
const fig = new Figure(gl, { fontBase:'/engine/fonts/', stories:[...] }); await fig.init();
const id = fig.addTrack(track /* from loadTrack or testTrack */, simOpts /* {wind:[x,y,z], gust} optional */);
fig.begin();                                   // each frame
fig.add({ pos:[x,0,z], yaw, scale, track:id|'name', time, lane:[r,g,b], density:0..1, solid:0..1, cel:-1(auto from dawn)|0..1,
          variant:'bun', story:rowIndex, alpha, gain, seed, flow, eyes:true(open), lodBias,
          trail:{ len:seconds, gain, width, color:[r,g,b], mask:bits|['handL','toeR',...] } });
fig.draw(ctx);                                 // engine calls once per pass; ctx per SPEC §5 (+ optional ctx.sunDir)
```
`fig.emitters` lists trail emitters (handL, handR, toeL, toeR, strap0-2, hair0-5). `fig.sun` default sun direction (+X).

## Look decisions (settled so far)
- LIGHT mode (solid 0): opaque pass draws a DARK GLASS body (near-black, fresnel rim in the lane tint; skin a little brighter; the orange band,
  headphones, back disc, RARE EARTH and the patch are solid emissive surfels, so they are crisp); add pass draws only the glyph rows
  (jacket pale, trousers lane-blue), hair as fine additive strands (not occluding, so RARE EARTH reads through), strap glow, trails.
  A glitter "dust" body was tried and rejected (looked like sequins; a glowing-eyed dark face looked spooky).
- Eyes: closed gentle arcs by default (serene); `eyes:true` shows open ovals with a lash line. Shown when the head is > ~60 px (opaque).
- SILHOUETTE (solid 1, dawn ~0.6): near-black surfels + warm rim toward `u_sun`; band, straps, headphones stay orange (HDR 1.7).
- CEL (solid 1, dawn -> 1, or `cel:1`): flat sRGB swatches from the character sheet (converted to linear in the shader), 2-tone,
  aux = flat part colour varied per region (arm / leg / torso ...) with alpha = cel amount, so an outline pass can ink part and limb borders.
- Hair: all long hair combed over the scalp and falling behind the shoulders (front locks covered the jacket and looked like a barcode).

## Status at the second checkpoint
- Rest pose now equals the motion library's `fable/tools/bake/skeleton.json` (A-pose, arms 35 deg from the body, hips 1.005 m), so baked
  tracks attach without retargeting. Verified with real tracks `idle`, `butterfly` (CMU 88_06), `run_fwd`, `lookback`, `form_test`:
  `node fable/tools/figlab.mjs --tracks idle,butterfly,run_fwd,lookback,form_test --custom '{...,"inst":[{"track":"butterfly","time":1.3}]}' --out x`.
  In the lab the procedural tracks are named `t_idle`, `t_walk`, `t_run`, `t_turn`, `t_kick`, `t_lunge`, `t_stress`.
- Particle counts: 167,564 fill surfels, 8,604 glyphs, 5,288 decal points, 920 eye points, 1,300 hair strands (27 segments each).
- Performance (RTX 3090, 1080p, lab incl. reflection pass + bloom): 1 hero 2.4 ms/frame; 1,024 instances 11-16 ms/frame.
  Sim at load: ~1 ms per track frame (a 20 s track = 1.8 s). Template build ~1.5 s.
- Stills: `work_fable/stills/f3/` (all `SHOTS` + `sheet_light.jpg`, `sheet_solid.jpg`, `sheet_mocap.jpg`, `close_trio.jpg`, `cel_pair.jpg`).

## Known problems / next
- Bun variant: the short temple strands hang across the face in light mode; move their roots further back / shorten.
- Light mode close-up: jacket glyph rows and the crop-top rows under the open jacket can overlap visually near the opening.
- Cel close-up: a few dark specks on the forehead (hair strands' scalp path poking through the skin near the parting).
- In the lab's side-on sunrise shots the sun reflection is drawn by the lab sky, not physically; the real engine owns sky and ground.
- Silhouette identity is weak when hair is at rest (head reads bald, sleeves read as biceps): add hair volume (cap offset, thicker mass),
  check with real mocap where the hair flies.
- Cel edges are slightly scalloped (surfel discs); raise `fillDensity` for hero shots if needed.
- Opaque surfels have no depth of field (only additive particles do).
- Real baked tracks (work_fable/tracks) not tested yet at the time of writing; `fable/tools/bake/skeleton.json` did not exist yet.
- Performance numbers still to measure (`--perf`).

## Director's review (after checkpoint 2) -> REWORK IN PROGRESS
Verdict: plumbing good (API, tracks, LOD, decals: keep). Look not there: mannequin/doll; an army of them reads ominous.
Rework plan, in priority order (being implemented as a rewrite of body.js / sim.js / figure.js):
1. SHAPE: opaque modes become a real skinned triangle mesh built from the same lofts (part ids from a small atlas texture, so
   band / openings are crisp). Trousers = "cloth-lite": each leg is a chain of 8 simulated ring centres (pinned at the hip, stiffness
   falling to the hem, the leg axis kept inside the ring) so the fabric hangs off a raised leg like a sail. Jacket: drop shoulders,
   narrower, blousing over a tight cuff. Head slightly larger, soft jaw. Hair: crown volume + guide grid (14 columns x 4 layers) falling
   behind the shoulders as a wide sheet + two slim front locks; sim gets velocity clamp, damping and neighbour cohesion.
2. LIGHT: no rows of glyphs round the limbs. Fine luminous FIBRES running along the cloth (text along the fibre when close, a thread
   of light when far), skin = soft warm lantern glow, body = near-black occluder with a thin lane rim.
3. SILHOUETTE poster-grade (rim, translucent hems/hair edge). 4. CEL clean (soft terminator, closed-eye arcs, brow hint, blush).
5. Crowd variation per instance seed.
