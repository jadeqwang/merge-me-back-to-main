# P1 — performance QA on the real figure

Every track was watched on the real character (mesh, cloth-lite trousers, hair, straps) in the real engine, with
`fable/show/reel.js`, not as a stick figure. Fixes went into the figure (`fable/engine/src/figure/**`) where the
problem was shape / sim, into the recipes (`fable/tools/bake/recipes_*.py`) where it was motion. Sheets are in
`work_fable/out/reel/` (git-ignored).

## The reel (`fable/show/reel.js`)
```
R="node fable/tools/render.mjs --show /fable/show/reel.js"
$R --q "track=drop&cam=front&dawn=0.6&dist=5" --sheet 155:160.8:0.2:work_fable/out/reel/x.jpg:6 --res 800x800
$R --q "track=drop&cam=front&dawn=0.6&crowd=64&yaw=165&ripple=0.04&lift=1.2" --from 165 --to 175 --audio --mp4 work_fable/out/reel/fall.mp4
```
- `track=` any track; song-timed tracks (`meta.song_t0`) play at `t - song_t0`, so sheet times are SONG times and `--audio` lines up.
- `cam=front|back|side|side2|tq|top|orbit`, `dist=`, `lift=`, `fov=`, `dawn=`, `lane=`, `variant=bun`, `pair=<track>` (second figure, e.g. fork_R), `yaw=<deg>` (0 = she faces the front camera).
- `crowd=64` wedge behind the hero (world space, recedes east), `sp=` spacing, `ripple=<s per row>` canon.
- QA: `freeze=<song s>&spin=1` with `--sheet 0:345:15` = yaw sweep of one pose; `times=153.1_159.3_167.5` with `--sheet 0:2:1` = hand-picked song times.
- Square renders (`--res 800x800`) give the largest figure per sheet cell (cells are 480 px wide).
- HUD: track, bar.beat, track time; the ctx meter and the light in the lower right corner flash on beats (big on bar lines).
- With `variant=bun` on `violet` the reel switches `bun` -> `bun_write` (at `pencil` + 0.45 s) -> `bun_one` (at `release`) and draws a hand trail while she writes.
- Numeric check used alongside the sheets (frozen windows, foot skate, pops): see "Numbers" below.

## What was wrong on the real figure, and the fix

### Trousers (figure.js SKIN, body.js `lim`)
- Kicks, the butterfly and jumps turned the legs into megaphones: at speed the hem grew to 0.38 x 0.50 m, a rigid cone that hid the
  kick line and, end-on, showed a black disc with a shoe in it. Now: the flare in motion is capped (`FLARE` 0.5 of the old gain), and where
  the cloth hangs or trails away from the leg the ring collapses into a flat fold (`DRAPE` 0.45 narrower across the offset, 10 % longer
  along it). Kicks read as a leg with a sail. The leg stays inside the ring at rest size (`lim` reduced toward the hem).
- Lying (fall, float, seated hems): a leg on the ground was a 0.3 m pipe half under the mirror. Rings are now squashed against the floor
  (flatter and a little wider when the chain is horizontal) and clamped at y = 0.006.

### Hair (sim.js, figure.js RIB_VS)
- Front locks and the bun's temple wisps were bent 10 cm sideways into "spectacle frames" (the back-hair parting offset was applied to
  them too). Parting now applies to back hair only; locks / wisps use a tighter head collider so they hang by the temples.
- Bowed or leaning poses (catch, wetlab, poet, nasa, salute after the spin) dropped the back hair over the front of the shoulders and
  chest, hiding the hands. A frontal plane in the chest frame (just in front of the jacket's back, open above the neck and 0.30 m out
  to the sides) keeps the back hair behind her; on a bow it slides down her back. Sleeves have 1/5 of the friction so hair does not
  hang on a raised arm (the salute).
- Float: all the hair went to one side as a single plume. Water mode is now a fan: each guide column has its own direction round the
  crown (+-98 deg), lies on the surface (y 0.012-0.024), sways on SONG time (float -> rise is seamless), floats 32 % longer, parting closed.
  `meta.water` may be `true` (float) or `[t0, t1]` (rise: the fan lets go between 0.45 and 1.3 s as she is drawn up).
- `meta.sim` on a track is merged into the sim options (life_nasa: wind -26 m/s2 along -Z, hair, straps and hems stream downwind).

### Straps (sim.js)
- Stuck out sideways when she lay down and flew horizontal after kicks. A weak preference for lying along the leg + a little more drag.

### The pencil (body.js, figure.js) — new, additive
- The violet "draws a pencil and writes" read as an arm held out. New variants: `'bun'` (two pencils in the bun, as before),
  `'bun_write'` (one of them is in her right hand, held like a pen, emissive like the other accents), `'bun_one'` (one left in the bun:
  the other became the light). The lead of the held pencil is `fig.body.pencilTip` in the handR joint's local frame: start the line of
  light there. Switch on the track events `pencil` (+0.45 s, the hand reaches the bun) and `release`.

### Motion (recipes)
- Salute (`stand("salute")`, used by drop and salute_only): wrists lowered 8.5 cm to the chest joint's height. On the real figure the
  open left hand covered her chin from the front. Accent unchanged (179.26).
- `drop` / `butterfly_only`: `meta.best_yaw` (see below). `rise`: `meta.water = [0.45, 1.3]`. `life_nasa`: `meta.sim` wind.

## Specifics asked for
- (a) Butterfly apex against the sun: `meta.best_yaw = 165` (degrees from facing the camera: `fig.yaw = yaw_facing_camera + best_yaw`;
  camera looking east: `fig.yaw = -PI/2 + 165 deg`). She performs TOWARD the sun, back to the lens: the legs open into a V at
  153.02-153.10, the apex frame (153.169) is a clean horizontal body inside the sun disc, the landing reads. `best_yaw_alt = 0`
  (facing the lens) has the widest V at 153.05 but the apex frame is a blob with the hems toward the camera. Sheets: `v_yaw.jpg`
  (rows yaw 0, 45, 150, 180, 210, 315; columns 153.02 .10 .169 .25 .33), `drop_bfly_yaw2.jpg` (apex, every 15 deg).
  Keep the camera low (0.9 m) and 5-5.5 m away so the whole arc stays inside the sun.
- (b) Group fall: from above the body is a clean arrow (legs one flat block with a seam, arms in a narrow A, hair a short bob beyond the
  head, straps along the legs): `v_b.jpg` row 2. From the front at ground level a lying body is a thin line; put the camera >= 3 m up
  (`lift=1.2` in the reel). In perfect unison the wall of silhouettes becomes a carpet in 3 frames; with a canon of 0.03-0.04 s per row
  (hero and front row ON 167.082, back rows up to 0.3 s later) it reads as a WAVE breaking away from the camera: `v_w3.jpg`. Recommended.
- (c) Salute: crisp (snap ease, 0.15 s) and still (breath only); hands at chest height, face clear, hair settles behind the arms within
  ~1 s of the stand-up. `v_b.jpg` row 2 left.
- (d) Crowd unison reads as a troupe (per-instance +-25 ms / +-2.5 % height keep it human): `v_w.jpg`, `drop_crowd_a.jpg`.

## Numbers (frozen / skate / pops)
- No track has a window where every joint is slower than 4 mm/s for 0.75 s, except the fall hold (167.09-168.55), which is specified
  dead-still. Holds everywhere else breathe / drift.
- Foot skate flagged and looked at: the run-to-stand braking in `violet` / `sprint_stop_look` is a 9 cm settle on landing (fine);
  `drop` 163.1-163.4 the support foot turns out 15 cm on the heel during the travelling snap kick (visible only close up); `free`
  240.3-240.6 a skip where the trailing toe drags 35 cm (reads as a skip). Not fixed.

## Grades on the real figure (A/B/C) — see the final table at the end of this file

## Notes for the film (not my files)
- Night with the violet lane: the default underlight + fibres wash the whole figure lavender and the seated pose goes murky. Pass
  `env.figLight = { under: 0.4, fibres: 0.8 }` (or lower) for sequence 11.
- The fall: canon by row (above); camera height >= 3 m.
- violet: variant switching + line of light from `fig.body.pencilTip` (above).
- life_nasa needs no extra wind from the show any more.
