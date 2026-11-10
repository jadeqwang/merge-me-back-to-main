# Anime figure for the protagonist (look-dev, then ADOPTED for the film 2026-11-10; switch `fig=classic`)

**Read the section "ADOPTION PASS" at the bottom first: it is the current state. Everything above it is the look-dev record.**

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

## Deliverables (git-ignored, rebuilt by `fable/engine/src/figure_anime/sheets_all.sh [A] [B] [C] [D]`, about 4 minutes)
- `work_fable/stills/anime/A_turnaround_faces.jpg` — 8-angle turnaround (current left, anime right), face views, expressions, gaze, blink, night faces.
- `work_fable/stills/anime/B_lighting_arc.jpg` — idle / run / catch x night (main), night (violet, bun), sunrise against the sun, sunrise three-quarter, day.
- `work_fable/stills/anime/C_action_crowd.jpg` — 6 frames each of run_loop, drop, violet, catch, free; 64 at night and at sunrise (current, anime).
- `work_fable/stills/anime/D_clip.mp4` (0-3 s `free` by day, 3-6 s `violet` at night) and `D_clip_strip.jpg` (every 1/8 s, plus heads on every frame for 1 s).

## What works (judged on the sheets, harshly)
- The face holds: front, three-quarter (far eye narrows against the contour), profile (wedge eye, small nose, lips, chin), above, below.
  Neutral, joy, calm and the gaze read at once; `determined` is quieter than the others. No popping in the frame-by-frame head strips
  (16 consecutive frames each of `free` with the neutral -> joy blend and of `violet` at night; no automatic blink fell inside those
  windows, blink was only checked as a still at 0.55), and at 1/3 of frame height the eyes are still two clear marks.
  Outline flicker was judged from those strips and the 1/8 s strips, not by watching `D_clip.mp4`.
- Close and medium shots gain the most: she is a person instead of a mannequin head. The violet branch (bun, pencil, eyes down at night,
  seated) is where the difference is largest; so are `catch` (joy, open hands) and any shot where she looks back.
- Night: the face sits in lilac shadow tones with dark eyes, small catchlights and a thin rim on the profile: neither a hole nor a lantern.
- Sunrise: it stays a silhouette; the two figures are indistinguishable against the sun. Crowds of 64: indistinguishable at night and at sunrise.
- Day: ink with weight, tinted shadows and the drawn folds make the costume read as designed rather than lit; the disc and RARE EARTH still show.
- Hair in motion: the clumps whip and separate into points on the same sim; no fringe, no dither, and it is cheaper than 1,092 strands.

## What does not (yet)
- The float shot (top-down, "her hair is the graph"): 18 blades do not make the fine radial fan the current strands do, and at night they are
  nearly black on black. That shot would need the strand hair kept for it, or a dedicated fan (many thin blades, lit edges).
- From the front the two back curtains flare wide behind the shoulders (the parting inherited from the current figure, now solid): it can
  read as a cape. A real fix is a designed back-hair shape (one mass with a notch), which then hides part of the disc.
- Hands are still mittens with three drawn finger lines; the fist reads, splay barely differs from relaxed. Real fingers would be the next step.
- The ring highlight is two or three soft spikes: correct, but it is the least "designed" element. Ears do not exist (the side lock covers the spot).
- Identity: this is a generic appealing anime face on her silhouette, not yet a likeness of Jade (it follows the character sheet: centre part,
  dark brown eyes, calm mouth; her note "larger eyes read as her" is honoured). Likeness would be a pass on eye shape / brow / face width with her.
- Not checked: depth of field on close-ups (opaque surfaces have none, as before), the 1,024 formation in daylight, blue hour (dawn 0.35).

## Rules that adopting it would change
- SPEC header "no faces in close-up" and §5 "Face: no features except ... two calm eye marks; never a mouth" -> she has a face (and a mouth).
- SPEC §1 fidelity law "in daylight, for the first time, you see *her*": the face is now readable at night too (in shadow tones). To keep the
  reveal, hold `face: { expr: 'calm' }` or back-three-quarter framings until bar 129, or drive a new `fig.light.faceVis` to fade features in at dawn.
- F3 note "Face ... only appear with sunAmt (day). No face at night" and the `eyes` option (now: open by default, `eyes: false` = calm).
- Per shot work: every close and medium shot wants a `face` (expression, `lookAt`) and `hand` choice; the float shot needs its own hair.

## Performance (1080p, RTX 3090 SHARED with three other agents' renders, so noisy: min of 5 interleaved `--bench` runs, ms per sub-sample)
| case | current | anime | ratio | second run (busier GPU) |
|---|---|---|---|---|
| 1,024 far, top-down, sunrise (`mode=P` cell 0) | 11.8 | 8.1 | 0.7x | 13.1 / 13.2 |
| hero + 255, sunrise (cell 1) | 5.2 | 6.2 | 1.2x | 10.5 / 11.3 |
| hero + 255, day (cell 1, `light=day`; the hull pass runs) | 3.5 | 5.0 | 1.4x | 11.6 / 9.0 |
| one hero, close, day (cell 2) | 3.7 | 4.7 | 1.3x | 6.4 / 5.8 |
Inside the 1.5x budget in every run; the worst case is daylight with many near figures (hull pass, levels 0-4). The clumps are cheaper than the
strands (about 4k vertices instead of 59k per near figure), which pays for the face and the hull. Re-measure on an idle GPU before trusting a ratio.

## Verdict (mine)
Adopt for SOME shots, not everywhere, and not before Jade has seen sheets A and B. It is clearly better wherever her head is larger than
about 60 px (close and medium, day and night; the violet branch above all). It changes nothing in silhouette shots and crowds. It is worse
in the float shot, and it spends the film's "you see her for the first time in daylight" reveal unless the face is held back until bar 129.
The low-risk path: swap the import (one line), keep `face: { expr: 'calm' }` / backs / silhouettes through the night acts except the violet
branch, open her eyes at the catch, and keep the current strand hair for the float.

---
# ADOPTION PASS (2026-11-10). Director's verdict: the face is adopted for the whole film, switchable (`fig=anime` default, `fig=classic`).
Status line (kept current): **milestones 1 (likeness) and 2 (hair) done and committed; next 3 (switch in cast.js), 4 (defaults), 5 (check in the film).**

## 1. Likeness (done). Sheet `work_fable/stills/anime/E_likeness.jpg` (`sheets_all.sh E`; the BEFORE rows are `dev/E_before_{day,night}.jpg`, rendered from dc7f714)
References: her own selfie and the character sheet (looked at locally only). What a designer would take from them, and where it lives:
- face outline: round-oval, full cheeks, soft short chin (head loft rings 1.441-1.520 in `body.js`; was a narrow V with a pointed chin)
- forehead and hairline: high and open, drawn back from a CENTRE parting in one smooth arch, rounded at the temples (`hairD` in `body.js` and `shade.js`, keep in step; was off-centre curtain bangs)
- eyes: long almond, a little wider apart, outer corners up (`FACE.TILT`), flat upper lid with a short level flick, bigger overall (EW 0.0262; her note: larger eyes read as her), iris very dark brown, rounder
- brows: straight and full, rising a little outward, short tail, closer to the eye
- nose: a softer, wider mark; mouth: full lips (rose lower lip, a hint of the upper one), which is what makes her an adult
- expressions: `joy` now has OPEN eyes (lower lids rise with the smile); the old closed-eye arcs are `laugh`. `calm` = eyes closed (use `amt` 0.3 for lowered lids).
Not done: her glasses (the character sheet has none; it would be the strongest single likeness cue: a decision for Jade).

## 2. Hair (done)
- (a) the cape: the two back curtains were pushed 10.5 cm sideways from the nape down, so from the front they flared past the shoulders. Now the hair falls straight
  behind the shoulders and the parting opens only BELOW the shoulder line, behind the jacket (`clumpVS`: `smoothstep(0.37, 0.58, sl)`, outer clumps move less).
  The disc and RARE EARTH still show from behind (the top of the disc is slightly covered). Checked on idle, run_loop, free.
- (b) float: per-instance `hair: 'strands'` draws the classic figure's 1,000 fine strands (same guides, same sim) instead of the back clumps; side locks, cap, face
  and body stay, so the character does not change at the cuts. Cost only in a LOD bucket that contains such an instance. Lab: `mode=M` cell 10.
- (c) `bun`, `bun_write`, `bun_one` checked at night and by day (`mode=M` cells 11-14); `fig.body.pencilTip` unchanged.
