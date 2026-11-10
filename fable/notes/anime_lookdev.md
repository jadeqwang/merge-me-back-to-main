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
Status line (kept current): **all five milestones done (likeness incl. the director's three fixes on sheet E, hair, switch, defaults, check in the film). Not pushed. Open items: the list "Still wrong" at the bottom.**

## Commands
```
fable/engine/src/figure_anime/sheets_all.sh E                      # sheet E (AFTER rows; BEFORE rows are dev/E_before_{day,night}.jpg, rendered from dc7f714)
node fable/tools/render.mjs --show /fable/show/main.js --res 1280x720 --stills 231:a.png                      # the film, anime figure (default)
node fable/tools/render.mjs --show /fable/show/main.js --q "fig=classic" --res 1280x720 --stills 231:c.png    # the film as it was (byte-identical: checked on 36, 100, 154, 198, 243)
node fable/tools/render.mjs --show /fable/show/main.js --q "fig=anime" --bench 142                            # frame cost, compare with fig=classic
node fable/tools/render.mjs --show /fable/show/main.js --q "dev=cuts&standin=1" --stills 0:/tmp/mfb/x.png | grep -o 'CUTS.*' | cut -c6- > fable/show/cuts.json   # REDO whenever a camera or a cut changes
```
Sheets (git-ignored): `work_fable/stills/anime/E_likeness.jpg`, `F_in_film.jpg` (27 moments, classic | anime), `dev/strip_catch.jpg` (229.0-236.6 every 0.1 s, head crop),
`dev/strip_day.jpg` (236.7-240.0), `dev/strip_violet.jpg` (195-202). The stills behind them: `dev/f1/`, `dev/st/`.

## 1. Likeness (done). `E_likeness.jpg`
References: her own selfie and the character sheet (looked at locally only). What a designer would take from them, and where it lives:
- face outline: round-oval, soft cheeks, tapering to a defined (not pointed) chin (head loft rings 1.441-1.520 in `body.js`; was a narrow V)
- forehead and hairline: high and open, hair drawn back from a CENTRE parting (`hairD` in `body.js` and `shade.js`, keep in step): a notch at the parting, a rounded
  corner at the temple, three fine strand tips breaking the arc at each temple
- eyes: long almond, a little wider apart, outer corners up (`FACE.TILT`), flat upper lid with a short level flick, bigger overall (EW 0.0262; her note: larger eyes
  read as her), iris very dark brown, rounder; brows straight and full, rising a little outward, short tail, closer to the eye
- nose: a softer, wider mark; mouth: full lips (rose lower lip, a hint of the upper one), which is what makes her an adult
- profile (`faceBump`): forehead, the dip between the eyes, a small nose with a tip, lips, the dip under them, chin. Head mesh 88 x 68 (was 64 x 56) so the nose holds.
- hair on top (the "swim cap" note): more volume above the skull, a groove along the parting that notches the crown's silhouette, a thin lighter parting line from the
  hairline back over the crown (mesh fragment shader), the highlight band rises toward the parting and breaks on it, loose strands in front of each ear (thin clumps on
  the side-lock guides, `fan` = metres forward of the lock; an earlier version extrapolated between guides and crossed the chin like a goatee: do not do that)
- expressions: `joy` has OPEN eyes (lower lids rise with the smile); the old closed-eye arcs are `laugh`. `calm` = eyes closed (`amt` 0.3 = lowered lids).
Not done: her glasses (the character sheet has none; it would be the strongest single likeness cue: a decision for Jade).

## 2. Hair (done)
- (a) the cape: the two back curtains were pushed 10.5 cm sideways from the nape down, so from the front they flared past the shoulders. Now the hair falls straight
  behind the shoulders and the parting opens only BELOW the shoulder line, behind the jacket (`clumpVS`: `smoothstep(0.37, 0.58, sl)`, outer clumps move less).
  The disc and RARE EARTH still show from behind (frame 0 checked against classic). Checked on idle, run_loop, free.
- (b) float: per-instance `hair: 'strands'` draws the classic figure's 1,000 fine strands (same guides, same sim) instead of the back clumps; side locks, cap, face and
  body stay. Set in `actB_float.js` `body()`, so it holds for all of 06-07 (float and rise); the change back to clumps is hidden by the white flash on b73. Cost only in
  a LOD bucket that contains such an instance. Lab: `mode=M` cell 10. Also fixed there: black hair took the lane underlight and turned ginger when she lay on the water.
- (c) `bun`, `bun_write`, `bun_one` checked at night and by day (`mode=M` cells 11-14) and in the film (184, 197, 200, 205); `fig.body.pencilTip` unchanged.

## 3. Switch (done)
`cast.js` imports both modules and builds one: `fig=anime` (default) or `fig=classic`. Classic goes through the old `inst()` untouched; five stills (36, 100, 154, 198, 243)
are byte-identical to the renders made before the change. `cast.figKind` tells a sequence which one is live. `set()` / `put()` take `face`, `hand`, `hair`.
`main.js` passes song time and the frame's `env.figLight` to `cast.drawables(dawn, t, figLight)`.

## 4. Defaults (done; `cast.js` `autoFace`, `autoHand`; SPEC rule 10 and section 5)
- daylight `DAY` = `figLight.sunAmt` if the shot sets it, else (dawn - 0.6) / 0.4; `NIGHT` = 1 below dawn 0.1, 0 above 0.33.
- expression by track: `free` joy 0.62, to 1.0 on its accents (events skip_apex, whirl, leap_apex, joy_apex, cartwheel, flourish); `build`, `drop`, kicks, salute, `land`
  determined 0.85 (eyes closed while she lies on the mirror between `fall` and `push_up`); runs determined 0.5; determined is scaled to 40 % at night; `float`,
  `sit_idle` calm; `rise` calm until the b69 leap, then open; `violet` calm 0.28 (lowered lids), open for the look east (9.6-14.9), eyes down on the writing
  (15.4-19.9, gaze toward the right hand), closed once seated (24.3-27.6); `life_*` neutral, `back` from 4.5; `lookback`, `walk_lookback`, `sprint_stop_look`,
  `release`: `back` in their look windows; `catch`: eyes close at the impact (2.6-2.95), open when the head lifts (9.6-10.3 = 229.6-230.3), joy from 11.3 (231.3).
  Joy is multiplied by the daylight; a neutral face becomes joy 0.45 by day.
- gaze: seeded saccades (a fixation every 1.2-1.7 s, 70 ms to reach it, 40 % straight ahead, +-0.16 / 0.08) plus 1.6 x (head yaw - chest yaw - 0.12 rad) from the
  track, so the eyes lead every head turn (look-backs, `idle`'s looking around).
- blink: per seed, every 2.5-6 s, 0.17 s, centred on an OFF-beat (never on a beat or bar accent) and moved by whole beats away from any cut in `fable/show/cuts.json`
  (43 cuts, found by `main.js` `dev=cuts` from camera discontinuities; a missing file only loses the cut rule).
- hands: both fists round every `*punch*` event (-0.45 .. +0.6 s), the salute = right fist, left palm; palms open on `double_palm`, `arms_wide`, `catch` open;
  runs 0.4; `bun_write` keeps the figure's own pencil grip; relaxed otherwise.
- crowd: the same defaults per body (seed = its index). Face LOD in the shader, no switch: `visD` (mouth, brows, blush, lower lid) fades at 3.0-6.2 mm of face per
  pixel, the eyes at 5.0-10.5 mm; in the 1,024 shots nothing is drawn.

## 5. In the film (done). `F_in_film.jpg`, three dense strips
Fixed while checking: ginger hair on the water (underlight on black hair), loose strands crossing the chin, catchlights missing in the sun-side light of 172-180,
iris glow too yellow at night, eyes closing 0.3 s late at the catch.
Strips: catch 229.0-236.6: silhouette with closed eyes to 229.7, eyes open as the head lifts and the light comes up (229.8-230.3), looking down at the light, joy from
231.5, one blink at 233.4; no popping, outline steady. Day 236.7-240.0: stable, one blink at 238.6. Violet 195-202: seen from behind and three-quarter back, eye down on
the writing, one blink near 198.5; steady.

## Performance against classic (film frames, 1920x1080, `--bench`, ms per frame; the machine is noisy: classic at 172.5 ranged 17.8-30.3 over 8 runs, so min of N)
| t | shot | classic | anime | ratio |
|---|---|---|---|---|
| 142 | 1,024 top-down grid, blue hour | 13.6 (n=2) | 13.2 (n=2) | 1.0x |
| 154 | 1,024 silhouettes at sunrise | 24.6 (n=3) | 20.3 (n=3) | 0.83x |
| 172.5 | arms wide, low front, rows of near bodies, sun-side light | 17.8 (n=8, median 21.8) | 18.5 (n=3, median 22.3) | 1.04x |
| 243 | day, hero + 64 | 7.8 (n=2) | 7.3 (n=1) | 0.93x |
172.5 was 1.2x (min 21.3 against 17.8) until the hull pass was limited: LOD 0-3 only, and in a bucket of more than 48 bodies LOD 0-1 only (`figure.js` draw). The clumps
are cheaper than the 1,000 strands, which is why 154 is faster.

## Switch check, exactly
`fig=classic` stills are byte-identical to the renders made before any change WHEN RENDERED IN THE SAME ORDER (36, 100, 154, 198, 243 in one call: all five identical).
The film itself has a small render-history dependence that is not mine: classic 36 rendered after 0.5 differs from 36 rendered first in 8 pixels (PSNR 105 dB), with the
old code path on both sides. Worth knowing for anyone comparing stills by hash.

## Still wrong (exact times; figure only, composition belongs to other passes)
1. 195-202 (violet writes, seen from behind): her head is one large flat black shape (cap + bun), no rim or highlight on it at night. Classic has the same; the anime
   head is a little larger. A night rim on the cap would fix it.
2. 170.6-181 (arms wide, punches, salute; checked 172.5, 179.5): at that distance the eyes are dark ovals without whites (the white fades before the iris) and the
   determined brows do not read: slightly doll-like in the front rows.
3. 236.6-240 (low camera, checked 237.7, 238): the jaw's ink line and the collar's outline merge into a dark mark under the chin at 720p.
4. 222.7-229.6 (the catch, front on, sun behind her; checked 223, 229.0-229.7): eyes closed as intended, but before 229 her face is pale lilac rather than a true
   silhouette (classic is as bright; the shot's light, not the figure's).
5. 0.5 and 270 (back three-quarter): the hair covers the top of the disc and the ends of RARE EARTH (about as in classic).
6. 125.3-127 (build, close; checked 126): the loose strand by the ear crosses the cheek in profile and reads as a scratch at 720p. Her head leaves the top of frame (framing).
7. 97.5-118 (float): fine now (face with closed eyes, strand fan, black cap); the strand fan spans +-84 degrees where classic spans +-104, so the outermost road
   filaments start just outside the hair.
8. Everywhere close (231, 235, 197): hands are still mittens with three drawn finger lines.
9. 49-58 (lives, checked 51): the strand tips at the temples read as small notches at that size.
NOT checked: the film in motion as video (only stills and 0.1 s strips); the blink/cut rule on every cut (the logic was read, three blinks were seen: 198.5, 233.4, 238.6);
gaze direction in look-backs at full size; 1080p stills (all checks were 720p); seq 15's small figures; `standin=1` with `fig=anime` beyond the cut scan.
