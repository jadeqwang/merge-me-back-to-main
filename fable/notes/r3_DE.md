# Round 3, Acts D + E (seq 11-16, 3:01-4:42) and the figure (`fable/engine/src/figure_anime/`)

Working notes of the r3 pass (2026-11-10). Task list: `fable/NOTES_v3.md`, section "Acts D+E ... owner of the figure".
Stills / strips: `work_fable/stills/r3_DE/` (git-ignored). Status line (kept current): **figure fixes done and committed; sequences in progress.**

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
