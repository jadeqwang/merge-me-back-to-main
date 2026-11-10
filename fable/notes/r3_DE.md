# Round 3, Acts D + E (seq 11-16, 3:01-4:42) and the figure (`fable/engine/src/figure_anime/`)

Working notes of the r3 pass (2026-11-10). Task list: `fable/NOTES_v3.md`, section "Acts D+E ... owner of the figure".
Stills / strips: `work_fable/stills/r3_DE/` (git-ignored). Status line (kept current): **done: the figure list, the requests of the A+B and C passes, the sequence list, the re-check of every shot 3:01-4:42. Not pushed. Open: "Still weak" at the bottom.**

## How the figure was changed without breaking the other passes' renders
A private copy of the module lives in `work_fable/dev/fa/` (git-ignored) with a copy of the lab (`work_fable/dev/lab.js`, mode `R` = the r3 check cells:
back of the head at night / by day, disc, neck front / low, profile, against the sun, face LOD strip `20..31`). Every shader edit was compiled and rendered
there first (`work_fable/dev/labsheet.sh out.jpg "0 1 2 ..."`), then copied over the real files in one move (`work_fable/dev/push.sh`). If the dev copy is
gone: `cp fable/engine/src/figure_anime/*.js work_fable/dev/fa/` and change the sky import in `figure.js` to `/fable/engine/src/sky.js`.

## Figure (all in `shade.js` unless said; "r3" comments in the code)
1. **Back of the head, 195-202 (the film's closest shot).** `hairLit` takes a `kind` (0 clumps, 1 the cap, 2 the bun). Cap and bun get: a rim BAND (fresnel
   threshold 0.69 instead of 0.80: on a sphere 0.80 was 2 % of the radius, invisible), a second hard tone at night on the side of the horizon's glow, STRAND
   LINES (`strandLines`: meridians from the crown when the hair hangs, from the bun when it is tied up; about half of 30 cells carry one, each with its own
   start and length; round the bun they are the winds of the coil), and the highlight ring at 2.3 x at night. Nothing over the forehead (the parting and the
   hairline are drawn there). The bun mesh is 30 x 14 (was 16 x 10: a visible polygon). `v_inst.y` now carries "hair tied up" (it was `celAmt`, unused).
2. **Crowd eyes (170.6-181).** They were dark ovals because the white faded at 2.2-4.5 mm of face per pixel and the iris at 5-10.5. Now the eye keeps its
   white as long as it is drawn, the iris shrinks 23 % far away (so the white shows on both sides), and the whole eye fades at 6.8-10.5 mm/px. The LOD
   measure is one number per face (`v_fpx`, from the head's distance), not the per-pixel derivative: in a three-quarter view the far eye used to go first.
3. **Jaw and collar (236.6-240).** The collar stood ABOVE the underside of the chin (1.446 against 1.441) and closed across the throat, and the top was black
   up to 1.436: she had no neck. `body.js`: collar top 1.430 and open at the throat (`gap`), a neckline on the top (1.406, a shallow scoop at the front),
   neck skin from 1.404. Shader: the jaw's shadow is a shape in the HEAD's frame (`jaw`; neck and torso vertices carry their head-frame position in `v_la`),
   a deeper tint by day and 38 % darker at night, so chin / neck / top / collar are four areas. Face, neck and neckline skin share one aux colour (the post
   outline between chin and neck plus the hull was the dark mark); the hull is not drawn where the neck leaves the torso.
4. **Silhouette by sun angle, face included (222.7-229).** New light field `sil` (0..1; `fig.light.sil` / `env.figLight.sil`): by default
   `smooth(dawn, 0.42, 0.56) * (1 - smooth(dawn, 0.64, 0.86)) * (1 - sunAmt)`. In the shader `silh = sil * smoothstep(0.25, 0.80, dot(-V, sun))`: whatever the
   lens sees against the sun loses 92 % of its diffuse light, the hair's ring and strand lines and the catchlights; rim and accents stay. A shot that lights her
   with its own `sunAmt` (13_catch from 229.6, Act C's sun-side light) takes the silhouette away by the same number. VISIBLE IN OTHER ACTS: sunrise shots that
   look toward the sun (153-170) are blacker; shots with the sun behind the lens are unchanged.
5. **Hair over the back disc (0.5, 270+).** `clumpVS`: the six inner back clumps (|fan| < 0.45) part from sl 0.30-0.45 (the nape to the shoulder line), the
   outer ones as before (0.37-0.58), so the disc is clear and nothing new shows from the front. The ends of RARE EARTH are still crossed by the near curtain
   in three-quarter views.
6. **Ear strand (125.3-127).** `body.js`: the thin strand 2.7 cm forward of the side lock is gone; the other one sits 1.1 cm forward (was 1.7), reads as part
   of the lock.
7. **Key colour.** `env.figLight.keyCol` / `fig.light.keyCol` = [r, g, b] of the sun-lit tone (default white = no change). For Act C's gold salute (2:58-3:01)
   if they ask: e.g. `figLight: { keyCol: [1.0, 0.86, 0.55] }` in that shot's env. Per frame, not per body (all eight instance attributes are taken).

Checked: lab sheet (16 cells) before / after, LOD strip at 3-10 mm/px in two lights, film crops at 0.5, 126, 172.5, 197, 199.5, 200.3, 201.5, 223.5, 226,
229.3, 231.5, 237.7, 280 (720p and 1080p). Frame cost (1080p `--bench`, noisy machine, before -> after): 172.5 24.6 -> 20.2, 198 9.7 -> 10.3,
231 12.9 -> 10.7, 243 7.7 -> 8.4 ms: unchanged within the noise.

## Requests served for the other passes (figure)
From `r3_AB.md`:
1. Disc at 0.5 / last frame: item 5 above (a circle now).
2. "Black disc under the chin" (55.8-57.5, head tipped back, seen from below): the head loft was OPEN underneath (its lowest ring had a 3 x 2 cm radius): one
   looked into the head. `body.js`: a closing ring (1.4398); no hull at the tip. The jaw's shadow no longer rides down the neck when the head tips back
   (`1 - smoothstep(0.062, 0.090, z)` in the head's frame: a neck in front of the jaw is in the light) and now also covers the underside of the jaw itself
   (from the true surface normal, `cross(dFdx, dFdy)` of the head-space position), in a skin shadow tone, never black.
3. Ear strands as hooks on the water (97.5-118): the loose strands are not drawn with `hair: 'strands'` (`clumpVS` cull).
4. Face from below (118-120): nose and lips fade by the face's distance (`v_fpx`), not by the slant of the surface (they vanished at grazing angles); with the
   under-jaw shadow the from-below view has features and a jaw. Also: the cap's rim needs the real surface to turn away (from below the whole fringe was rim).
From `r3_C.md`:
1. Side lock across nose and mouth (126.15-126.25, 133.4): `sim.js` `offFace`: in the head's frame, in front of the ear line and between chin and brow, a node
   of the locks / wisps may not come nearer the middle than 7.8 cm nor further forward than 4.5 cm (more when the head is bowed, so they still hang over a
   bowed face: checked at 229.2). 126.2: the lock curls by her ear, the face is clear.
2. Grey loop in the spin (177.4): the ring is drawn only on the part of a clump that lies on the head (s < 0.3-0.42), and back hair flung more than 0.3-0.5 m
   out from the spine loses its rim (`v_fly`). NOT solved by that, as far as one still shows: at 177.42 the grey shape on her back is the JACKET seen between
   the parted, whipping curtains (fold lines on it), not a highlight. It would take a camera or hair-parting change in that move.
3. `keyCol` too weak: a coloured key now counts by its own saturation (`kW = max(sunAmt, min(0.85, 2 * (max - min of keyCol)))`), skin takes half the tint.
   White key: unchanged. With Act C's own values (sunAmt 0.1, keyCol [1, 0.8, 0.5]) the salute's lit side is gold (checked at 179.6).

## Sequences (NOTES_v3 list)
- **3:56.6 handover** (`actE_morning.js` `HO`, `12_flight.js` `hero`, `14_day.js` A): the pop is removed, not hidden. A third performance, `handover` (235.9-238.0,
  127 frames), is made at set-up from the two tracks: `catch` on its slowed clock blended into `free` from its frame 0, joint by joint in parent-relative
  rotations (slerp), bone offsets kept, positions rebuilt from the hips, so no limb changes length. Arms / spine / head go over 236.20-237.35, hips and legs over
  236.55-237.05 (the back foot comes up beside the front one; `free` is placed so its front foot is where `catch` left it: `ST`, about 1 x 5 cm). It is
  registered with the cast (`cast.tracks.handover`, `cast.fig.addTrack`), played by both sequences from 236.15 to 237.8, with joy 0.9 -> 0.65 and open hands.
  The cut on b137 lands on her whole (the old frame A; no feet shot), arms a third of the way down, face lit. Frame-by-frame strips of the two track switches
  and the cut: no pop of pose or hair (`hx.jpg`).
- **3:41.0-3:42.7 silhouettes** (`12_flight.js` `SIL`, also the fold in `13_catch.js` to 228.4): no fibre shimmer (that was the grey-violet), ambient
  [0.03, 0.02, 0.03], `sil: 1`. Black bodies, orange bands and straps, the violet note; unchanged at the hit, so nothing pops on b129.
- **4:03.7 fork at the apex** (`14_day.js` B2): the lens is due south of her (x = CATCH - 3.1, was - 4.7), so the branch that leaves her runs east across the
  frame: one body at 243.6, the second emerging at 243.7, clear at 243.8 (it ran away behind her for 0.25 s).
- **4:10.6 the b145 branch** (`makeLift` keys): the lens swings to az -24 .. -26 for b145-b147 (was -12): the branch is beside her from 251.0 and clear at 251.2.
- **4:16-4:18 specks, then the map** (`makeLift` keys): the stick stays low to b149 (14 -> 24 m: she is about 13 % of the frame, the nearest runners are
  bodies), and the whole climb to the map is one bar, b149 -> b150, on the bar the drums go out. 15's map look ramps over the same bar, from a frame with people.
- **Map label**: `formation` 100 m (36 px) nearer its rings, leader shortened; lower than that the word would touch the northern arterial or the fan's first ray.
- Dev: `--q "zf=1"` (`zoomOn` in `actE_morning.js`): the film's own lens magnified on her head for 11-14; used for the face check below.

## Re-check 3:01-4:42 with the anime figure (strips `v1.jpg` .. `v4.jpg`, each with its zoomed face row)
| shot | face / gaze / hands / hair / type |
|---|---|
| 181-188.3 A, the run | profile, calm lowered lids, bun and pencils read; rim on cap and bun |
| 188.3-195.3 B, looks east | seen from behind for the whole shot: the back of the head now reads (rim, ring, lines); her open-eyed look east is not seen (not restaged) |
| 195.3-203.6 C, the writing | the film's closest shot: back of head as form; from 198 her profile, eye down on the line, one blink near 198.5 |
| 203.6-211 D, the sit | wisps fall forward over her face as she lowers herself (205.5), eyes closed once seated; the lift-away as before |
| 221-222.7 the wait | silhouettes with accents (was grey-violet) |
| 222.7-228.4 the hit, the fold | silhouettes against the sun, face included; the bowed head has its locks hanging (229.2) |
| 228.4-236.6 C3 | black to 230.1; the face comes out of the dark 230.4-230.7 looking down at the light; lit and open-eyed from 231.0, turns to us 232.5, joy; one blink 233.4 |
| 236.6-245.3 A, B, B2 | whole on the cut; joy; chin, neck (shadow tone), top and open collar are four areas at 237.7; fork reads at 243.7-243.8 |
| 245.3-248.8 C | as r2: the runners are 30-35 % of frame height |
| 248.8-257.5 D | behind her shoulder; b144 / b145 / b146 children all leave in view; BACK TO MAIN clear of every head |
| 257.5-264.5 pull-up and map | one bar up; eight labels as before, `formation` nearer |
| 264.5-282.5 terminal | calm, her back to us, the disc a full circle between the curtains; text untouched. Loop seam (720p): frame 0 vs frame 1 MSE 22.13, frame 0 vs last frame 22.77 (r2: 21.35 / 22.44): the last frame still matches frame 0 |
`fable/show/cuts.json` regenerated and compared: 43 cuts, identical times (no cut moved).

## Frame cost (1080p `--bench`, ms; the machine is shared and noisy)
| t | before r3 | after |
|---|---|---|
| 172.5 | 24.6 | 20.2 / 26.3 (two runs) |
| 198 | 9.7 | 10.3 / 11.0 |
| 231 | 12.9 | 10.7 / 10.0 |
| 243 | 7.7 | 8.4 / 7.6 |
| 256.5 | - | 11.6 |
Against the classic figure at 172.5, interleaved at the end of the pass: anime 23.6, classic 24.0, anime 19.7: parity, as before r3.

## Still weak (exact times)
- 177.40-177.45: the grey shape on the hero's back in the spin is her jacket between the whipping curtains (see above): not fixed.
- 188.3-195.3: her look east is seen only from behind.
- 245.3-248.8: shot C, runners at 30-35 % of frame height (unchanged).
- 236.55-237.05: the back foot slides 30 cm along the ground to close the stance (a blend, not a step: no IK).
- 237.3-237.7: her arms come down and go up again within a second (the take starts its skip from hands at her sides).
- 257.8-258.6: the pull-up passes through about 0.5 s of fan rays on white before the graph swings in.
- 200-202 at 720p: the strand lines on the cap are one pixel wide; they read at 1080p.
- Front view at eye level: the lit strip of collarbone under the jaw's shadow is narrow; neck and neckline are mostly one shadow tone.
- Not watched as video: everything above was judged on stills, 0.1 s strips and three 1/30 s strips (236.05-236.25, 236.55-236.75, 237.70-237.90).
