# Act A (seq 01-04, 0:00-1:10) + the Global fixes + the lives' props. Working notes

Task list: `fable/NOTES_v1.md` (Global + Act A). Stills and sheets: `work_fable/stills/actA/` (git-ignored). Clip: `work_fable/out/actA.mp4`.
Fast stills for this act (12 s instead of 30: only the tracks the act uses):
`--q "tracks=idle,fork_L,fork_R,walk_loop,run_loop,sprint_loop,sprint_stop_look,release,life_piano,life_violin,life_poet,life_nasa,life_band,life_wushu,life_stage,life_home"`

STATUS: reworked per NOTES_v1; judged on stills, sheets and frame strips cut from the 720p clip (not watched at speed with sound).
Final sheet `work_fable/stills/actA/sheet_final.jpg` (one frame per 1.5 s), clip `work_fable/out/actA.mp4` (0-70 s, 720p, audio).

## Global changes (apply to the whole film) and where they live

| what | where | how to opt out / tune |
|---|---|---|
| HUD 30 px semibold at 1080p (was 26 px medium), soft plate behind the glyphs | `engine/src/hud.js` | `hud: { px: 26 }` |
| Commit nodes are thin rings (15 % of the radius, at least 1.7 px), gain 0.75 + a short flash when they land; far-away dots unchanged | `engine/src/roads.js` FS_NODE; radii capped at 0.35 m in `show/world.js` | - |
| Roads at night are drawn with their TRUE footprint: a line lying across the view at a grazing angle is foreshortened (thin), and a sub-pixel line is dimmed by its coverage. This is what removes the white-hot horizon band (a thousand connectors used to stack there at full energy) and the fat neon ribbons | `engine/src/roads.js` VS_LINE (`uCalm`) | `calm: 0` in the set's draw options restores v1; ink (day) roads keep their v1 weight; `widthScale` thickens one set |
| Distant lights: night air 320 m (was 600): the horizon line of bokeh stays under a figure's accents | `engine/src/lights.js` (`uAir`) | `world: { lights: { air: 600 } }` |
| Gait: `K.gait(v)` -> `{track, rate, speed, ok}` (rate clamped to 0.85..1.15), `K.runner(at, s0, t0, v)` -> `(t) => {pos, yaw, track, time, s, a}`; `K.loopClock` now clamps to 0.85..1.15 by default (05 passes its own `hi`) | `show/kit.js` | `lo` / `hi` |
| Road text was mirror-written (`flip:false, textSide:1`): now `textSide:-1` on every world road: it reads in the direction of travel, from the right-hand side of the road, and appears in reading order as the road is written | `show/world.js` | a sequence that looks from the LEFT of a road sees it upside down (correct letters), as before it saw mirror writing |
| `world.lights(t, { clear: [[x, z, r], ...], almond: false, air })`: no bokeh light within r of a point where a figure stands (the "light sits on her head" problem); skip the tree's lights | `show/world.js` | - |

## World changes that only matter inside Act A (0:22-1:10)
- Fork clock `TF`: 256 on b13, **512 on "split" (28.62), 1,024 on "thousand" (30.29)**, tips reached on "road" (34.70). (v1: 512 on b14, 1,024 on "split".) `W.count(t)` follows.
- The last two forks round the hero are hand-set at human scale (`reshape` in `makeWorld`): main and jade/violin part at N9 on "split"; main | jade/piano and
  jade/violin | jade/poet part at N10 on "thousand", four abreast, 2.4-3 m apart; all four reach their tips on "road". Violin and poet are now her cousins
  (tips km-1, km-2). Limb lengths are set so the hero runs them at one steady speed (`W.hero.run`, 5.2 m/s = sprint_loop x 1.07): the world's own clock writes
  the road under her feet. The connectors, M1 and everything east of it are unchanged.
- Every connector is written by its Jade's feet and every Jade does what the hero does: sprint from the tip, `sprint_stop_look`'s brake, standing from
  `tPause0` (40.83) `W.hero.sStop` = 22.5 m along her road, the light released on "light" (43.33) writes the rest by 47.47. `W.connRun(t)`, `W.walkerS`.

## Props (`show/props.js`)
`makeProps(K)` -> `begin()`, `piano / violin / notebook / wind / guitar / stage / orrery (b, { pos, yaw, color, track, time })`, `drawable(b)`; also `seg`, `poly`, `dot`.
Strokes are instanced screen-space quads in the `add` pass (depth-tested against her, reflected in the mirror, ink by day). Held props follow her joints
(`cast.root(track, time, joint)`), so play the life with `vary: 0`. Positions are the tracks' `meta`.

## Shot list (song seconds; bar n = 0.126 + (n-1) x 1.73913)

| time | seq / shot | camera | what happens, and why |
|---|---|---|---|
| 0.00-3.20 | 01 frame 0 | `rootCam`: 3.9 m behind her on her RIGHT (az 32 deg), 1.3 m high, 35 mm, slow push-in 0.04 m/s | She stands at the root, 72 % of frame height, RARE EARTH between the parted hair; main and "... WHERE I STARTED FROM" run in to the ring under her feet; far lights west. `idle`, hair and breath move. **Changed from v1** (was her left side, smaller): seq 16 imports `rootCam` so it follows; for an exact loop it should also use `world: rootWorld(tau)` (exported from 01_root.js) |
| 2.60-14.04 | 01 the forks | crane up and back from frame 0 to 9.6 m behind / 6.6 m up, always looking east over them | b3 (3.60) `fork_L`/`fork_R`: the step lands on the bar, the root ring flashes. From 4.75 they walk (`walk_loop` x 1.08 = 1.24 m/s, stride phase chosen nearest the fork's last pose) on a small local tree: 2 -> 4 (b5) -> 8 (b7), each new branch stepping out of her twin, node rings and glows on the bar, roads and their messages written under their feet. HUD count 1, 2, 4, 8 |
| 14.04-24.47 | 02 the tree | top-down, slow push (v1) | MERGE; doublings on the bar lines 16, 32, 64, 128, 256 (b13); the live counter lower right (number cap 70 px, "branches" under it; rolls and flashes on the change) |
| 24.47-27.95 | 02 swoop | top-down -> 150 m behind her at 80 m (b16.4) -> behind her at ground level | no cut into the verse; counter holds 256 |
| 27.95-36.65 | 03 A | behind her, in her road's frame: 4.6 m back, low; rises to 3-3.7 m and 6-8 m back as they multiply; banks with the roads after "road" | **"split" 28.62: jade/violin steps out of her (counter 512). "thousand" 30.29: jade/piano out of her, jade/poet out of violin: four abreast (counter 1,024, then it fades).** Their lane-coloured roads and messages trail behind them. Lyric on ONE row above their heads |
| 36.65-41.87 | 03 B | side truck from her left (east), 5.4 m, 1.1 m high, slightly ahead; eases as she brakes, leans in | "the night could hold": hero right third, half frame height; piano beyond her, other lives as runners in the middle distance on their roads, unnamed branches as small bokeh; she brakes (`sprint_stop_look`) and stands |
| 41.87-45.34 | 03 C | behind her, between her road and piano's, 40 mm, she in the left third | `release`: a light gathers in her cupped hands (from 41.8), leaves ON "light" 43.33 and becomes the head of her road, lighting its message as it goes; piano does the same beside her (each one) |
| 45.34-47.08 | 03 D | flying 11-13 m up behind the wave of road heads at their speed (28 m/s) | the fan: roads dimmed to threads, every head a comet racing for the horizon |
| 47.08-55.78 | 03 E | one rig for every life: camera on the right-hand side of her road, she right of centre at about half frame height (seated lives closer) | one bar each: **piano** (bench, keybed, keys light under her hands), **violin** (violin + bow on her joints), **poet** (notebook, the line growing under the pen), **nasa** (wind streamlines parting round her), **band** b32 (guitar on her joints, strings ring on the beat). Her road alone is bright, its message set beside her feet on the camera side; chyron `jade/<life>`; the thousand others dimmed to threads |
| 55.78-57.52 | 04 A home | same rig | she traces the earth's orbit: a sun, two rings, the outer planet riding her fingertip; ON "remembers" 57.03 she begins to look back |
| 57.52-60.13 | 04 A roll call | frame anchored on her head; one beat each | the SAME look-back continues through six cuts: sandstorm (light cone + mic), wushu, nasa, poet, violin, piano: back to the piano bench |
| 60.13-64.47 | 04 B | top-down (v1) | "Where I started from": the pulse runs home, lands on the root on the b37 kick |
| 64.47-69.69 | 04 C | the dive along her road, always looking at the root (v1 path) | the root answers: a ring leaves it on every beat from the kick, its light and ground glow grow through the riser; white on b41 |

## Deviations from NOTES_v1, on purpose
- The counter reaches 256 on b13 and makes its last two doublings on the WORDS "split" and "thousand" (not on bar lines), with the splits the shot shows.
- Six lives get a full bar (piano, violin, poet, nasa, band, home); sandstorm and wushu appear only in the roll call. Eight one-bar vignettes do not fit between
  the release and "Where I started from" if every look-back must start on "remembers".
- While the large counter is up the HUD line does not repeat the count.
- The side truck starts on b22 (after the tips), not on "Down": during the last limb the four are abreast and block every side view.

## Known problems
- 4.75 s: fork -> walk hand-over is still a pose switch (nearest stride phase; no blend in the figure). 26.9-27.5: the swoop crosses bare mirror for half a second.
- 13-14 s: the eight walkers are about 10 % of frame height (the fan is 15 m wide).
- 30.3-32.2: the counter sits on jade/piano's road at the lower right.
- 36.7-41: road messages near the camera are seen from their left (upside down), dimmed to 0.3; wet-lab (within arm's reach of the hero) is neither a body nor a light, her road is empty.
- 43.3-45.3: the released light is small against the newly written roads; piano is as large as the hero.
- 55.8-57.5: jade/home is about 30 % of frame height (the frame must hold the orrery).
- Seq 16 (not mine): its last frame uses `world: { head: 0, ... }`, so the far lights and the HUD hash differ a little from frame 0.
- 1:30 (Act B) still shows a hot horizon line: tools are `calm`, `lights.air`, set gains.
