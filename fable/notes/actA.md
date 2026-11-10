# Act A (seq 01-04, 0:00-1:10) + the Global fixes + the lives' props. Working notes

Task list: `fable/NOTES_v1.md` (Global + Act A). Stills and sheets: `work_fable/stills/actA/` (git-ignored). Clip: `work_fable/out/actA.mp4`.
Fast stills for this act (12 s instead of 30: only the tracks the act uses):
`--q "tracks=idle,fork_L,fork_R,walk_loop,run_loop,sprint_loop,sprint_stop_look,release,life_piano,life_violin,life_poet,life_nasa,life_band,life_wushu,life_stage,life_home"`

STATUS: in progress (see "State" at the bottom).

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

## Shot list
(filled in as the shots are finished; see State)

## State
- Done: Global fixes, world changes, props module (not yet seen in a render).
- In progress: seq 01 (the forks at human scale, people kept in frame), 02 (counter), 03 (split / four / side truck / release orb / fan / four lives), 04 (two lives, roll call, pulse, dive).
