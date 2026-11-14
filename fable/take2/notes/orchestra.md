# Orchestra of Jades (bars 81-84, v7 engine): resume note

Owner: orchestra agent. Paths: `fable/show/seq/orchestra.js` (new), small hooks in `fable/show/seq/08_build.js`, `fable/show/main.js`,
`fable/show/props.js`, `fable/engine/src/figure_anime/{figure,shade}.js`; this note; `review/fable_take2/orchestra_3d_sheet.jpg`,
`review/fable_take2/orchestra_3d_preview.mp4`. Dev data (git-ignored): `work_fable/take2/orchestra_dev/`, frames `work_fable/take2/v7/orchestra/`.

## State (2026-11-13, 23:00): DONE, first version. Looked at on stills and frame strips only; nobody has watched it at speed with sound.

## What it is
A variant of v7 seq 08, on only for song bars 81-84 (new 138.965-145.878 s; old show time 139.254-146.210), off with `--q orch=0`.
`--q orchtail=1` keeps it on one beat into bar 85 (to bar 85 beat 2, new 146.310) so the downbeat hit of bar 85 is visible;
the delivered frames use it. Without it, bar 85 returns to seq 08 as it was.
- On the bar 81 downbeat the 256 copies that exist streak (written arcs on the mirror, players and wushu row only) from the doubling grid to
  their places in about two beats; players sit as their chairs and stands are drawn. The copies of bars 82 and 83 (stages 9, 10) are born
  straight into the outer rings (fade in, flash), so the count is still 256 / 512 / 1,024 by the original schedule. No number is drawn
  (the HUD count, only with the HUD on, is the true number of bodies).
- **Choice for the 1,024**: one orchestra of 89 + the hero on the podium + a wushu row of 6 beside her; the other 928 stand in rings round
  the orchestra (from 15 m out, 2 m apart, aisle on main to the west) as an audience facing it, darker (`solid` 0.4, query `orchaud`), on
  the `idle` take. So only 7 do wushu (hero + row); the audience is not playing. The idea "mostly an orchestra" is only true near the
  centre: say so to Jade; the alternative (several orchestras) was not built.
- Seating (from the audience, which is WEST; orchestra faces the podium at the hero's spot H, she faces east into it):
  1st violins 16 front left (concertmaster = first desk, outside seat), 2nd violins 14 left-centre, violas 12 centre-right, cellos 10
  front right, double basses 8 standing behind the cellos, flutes 3 + oboes 3 (row 1, centre), clarinets 3 + bassoons 3 (row 2),
  horns 4 (left), trumpets 3, trombones 3, tuba 1, timpani 1 + percussion 3 (bass drum, snare, cymbals) at the back, harp and grand piano
  at the left. 89 players, 57 music stands (one per string desk, one per wind/brass player), chairs for every seated player, a podium with a rail.
- Section lane colours go to the instrument strokes (vn1 rose, vn2 coral, va magenta, vc violet, db blue, winds/harp mint, brass gold,
  percussion cyan, piano blue; concertmaster main orange). NOTE: the anime figure's bands are orange on every body (the lane colour does
  not reach the band in `figure_anime`), so the concertmaster cannot be "the only one with orange bands". Instead: a pool of main-orange
  light under her chair (as the hero has), and a per-frame hook file (below).
- **The figure's back**: the anime jacket's chest band (`PART.STRIPE`, y 1.272-1.314 in body.js) wraps round the body and is cut only in the
  middle 25 cm of the back (|x| < 0.125), so the outer back carried orange segments. For this variant the band stops at the side seams
  (shade.js: `u_nbb` uniform, jacket region, band texels with bone-local z < 0 drawn as jacket). The back is plain white with the pale-blue
  disc and RARE EARTH only. Every other frame of the film draws the figure as before (`noBackBand` false; checked pixel-identical). Arm bands
  unchanged (one round each upper arm, rule 8).
- Motion: procedural tracks `orch_<pose>` baked at start-up on the 21-joint skeleton (fkFrame seated/standing base + two-bone IK arms),
  added to the figure like actC_set. Driven by the v2 beat index (= v3 beat index through the warp): violins/violas change bow every half
  beat, cellos and basses every beat, all in unison (`vary: 0`); timpani alternate hands on every kick; bass drum beats 1 and 3, snare 2 and 4,
  cymbals each downbeat; winds and brass sway over the bar; trombone slide moves on each beat; harp small plucks; pianist = `life_piano`
  mocap ping-pong 0.5-4.3 s (not beat-locked). Beat 4 of bar 84: strings lift bows, percussion lift; bar 85 downbeat: everyone strikes
  (winds/brass do not lift). Wushu row and hero: `build` mocap, unchanged.
- Instruments, chairs, stands, podium: strokes of light (props.js vocabulary; `makeProps(K, {max})` added, default unchanged).

## The eight shots (cut on the bar and on beat 3; new song time)
| # | name | new t0 | new t1 | what |
|---|---|---|---|---|
| 1 | above | 138.965 (b81) | 139.830 (b81.3) | steep top view: the grid streaks into the arcs |
| 2 | side_low_violins | 139.830 | 140.694 (b82) | low, from beside the podium along the 1st violins' desks (concertmaster nearest) |
| 3 | above_behind | 140.694 | 141.558 (b82.3) | money shot: rows of white backs with the disc, podium and wushu row beyond |
| 4 | timpani | 141.558 | 142.422 (b83) | over the timpanist's shoulder, mallets on the kicks, orchestra beyond |
| 5 | wushu_from_behind | 142.422 | 143.286 (b83.3) | long lens over the orchestra at the wushu row and the hero |
| 6 | basses_side | 143.286 | 144.150 (b84) | basses in profile, cellos behind |
| 7 | high_wide | 144.150 | 145.014 (b84.3) | top-down, audience at the bottom, 1st violins screen-left: seating checkable when paused |
| 8 | last_wide | 145.014 | 145.878 (b85) (146.310 with the tail) | from over the audience; lift on b84.4, hit on b85 |

## For the compositor (not done here: shots.js and film.js are yours)
1. `fable/take2/shots.js`, replace the b81-84 loop (`V(81 + k, [81 + k, 3], 'seq 08 above' ...)` / `V([81 + k, 3], 82 + k, 'seq 08 side' ...)`)
   with eight V shots on the same cut points, each with `opt: { v7dir: '/work_fable/take2/v7/orchestra' }`, e.g.
   `const ORCH = ['above', 'side_low_violins', 'above_behind', 'timpani', 'wushu_from_behind', 'basses_side', 'high_wide', 'last_wide'];`
   `for (let k = 0; k < 8; k++) { const b = 81 + (k >> 1), a = k % 2 ? [b, 3] : b, e = k % 2 ? b + 1 : [b, 3]; V(a, e, 'orchestra ' + ORCH[k], 'The orchestra of Jades: ' + ORCH[k] + '.', { row: 'b81-84', opt: { v7dir: '/work_fable/take2/v7/orchestra' } }); }`
2. `fable/take2/src/film.js`: v7 frames are read from one global `V7DIR`. Make it per shot: at boot load `meta.json` for every distinct
   `s.opt.v7dir` (same code as for `V7DIR`, into a map dir -> {fps, n, first}); in `v7Index`/`v7Url` (and where `scene()` builds the v7
   image url) use the shot's dir and meta when `s.opt.v7dir` is set. File number = round(t * 30), valid 4155..4394.
   Quick check without code change: `--q "v7dir=/work_fable/take2/v7/orchestra"` (that is how the sheet's paper stills were made;
   other v7 shots then become cards).
3. Paper/ink: Build section default (black paper, all lane hues) was used for the sheet; looks right to me.
4. Optional: hold shot 8 one beat into bar 85 (frames exist to 146.310) to show the hit; otherwise cut on b85 as planned.
5. Label hook: `work_fable/take2/v7/orchestra/hooks.json`: per frame number, the concertmaster's and the hero's head as frame fractions
   (x right, y down), no occlusion test; 216 of the 221 in-window frames (a few missing from the log). The concertmaster is in frame in
   every shot except 6 (basses).

## Commands
    R="node fable/tools/render.mjs --show /fable/show/main.js --res 1920x1080 --warp analysis_v3/warp_v2_to_v3.json --mb 4"
    $R --q "notype=1&nohud=1&orchtail=1" --from 138.5 --to 146.5 --workers 6 --frames work_fable/take2/v7/orchestra   # 57 s; meta.json written by hand
    # dev: --q "orchcam=x,y,z,tx,ty,tz,fov" (metres from H) holds one camera; --q orchhooks=1 logs ORCHHOOK lines; --q orch=0 off
    node fable/take2/tools/render.mjs --q "v7dir=/work_fable/take2/v7/orchestra&hud=0" --stills 139.50:a.png,...   # paper-pass stills
Identity: new t 60, 137.5, 147.0, 230 (mb 4, notype nohud) rendered before and after every change: PNG md5 identical
(`work_fable/take2/orchestra_dev/base/` vs `ident/`). 137.5 and 147.0 are seq 08 just outside the window.

## Weak / missing
- Paper pass on dense wides (3, 5, 8) becomes a busy field of hatching; the orchestra reads best in 2, 4, 6, 7. Stands are prominent.
- Shot 1 streaks are still a firework of arcs (players come from up to ~20 m away in the fan).
- Poses are procedural and only checked at crowd scale; hands do not truly grip; cello/bass bows are approximate; no fingering.
- Winds/brass do not take the final lift; pianist not beat-locked; harp plucks are tiny.
- Pop at the bar 81 cut: hero and wushu turn to face east, audience switches to `idle`; at b85 back to seq 08 (everyone standing): a hard
  continuity jump the edit must accept.
- Not watched at speed with sound.
