# Orchestra of Jades (bars 81-84, v7 engine): resume note

Owner: orchestra agent. Paths: `fable/show/seq/orchestra.js` (new), small hooks in `fable/show/seq/08_build.js`, `fable/show/main.js`,
`fable/show/props.js`, `fable/engine/src/figure_anime/{figure,shade}.js`; this note; `review/fable_take2/orchestra_3d_sheet.jpg`,
`review/fable_take2/orchestra_3d_preview.mp4`. Dev data (git-ignored): `work_fable/take2/orchestra_dev/`, frames `work_fable/take2/v7/orchestra/`.

## Revision 2 (2026-11-13, 23:20): see the section at the end; it supersedes the counts, shots and frame range below.

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

## Revision 2 (director's review of the first sheet), 2026-11-13 23:20
Done, committed. Looked at on stills only (raw and through the film's paper pass); nobody has watched it at speed with sound.
- **All 1,024 play or do wushu.** Massed orchestra of 985 (`massedSeating()` in orchestra.js): rows of arcs round the podium, 3.0 m
  outward, 1.05 m apart. Band A (15 rows) 1st violins front left, 2nd violins, violas centre-right, cellos front right (outer 4 rows on the
  right: basses); band B (5) harps far left, horns, flutes|oboes then clarinets|bassoons in the centre, basses (2 rows) then trombones on
  the right; band C (2) horns, trumpets, trombones, tubas; band D (last row) timpani in the middle, percussion either side; one grand
  piano at the left edge. Counts: vn1 132, vn2 126, va 126, vc 72, db 70, fl 36, ob 36, cl 27, bn 27, hn 89, tp 41, tb 107, tu 24,
  timp 6, perc 42, harp 23, piano 1 (= 985). Wushu: the hero + row of 6 + two wing blocks of 16 (4 x 4, 2.2 m) = 39. Outer radius 26.5 m.
  The 255 copies of bar 81 fill the row, the wings and the innermost 217 seats; the copies of bar 82 are born seated in the next seats
  (timpani, percussion and inner basses first, for shots 4 and 6); the copies of bar 83 in the outermost seats. No standing idle figures.
- **Per-shot clutter**: chairs and stands only in shots 2, 4, 6 (shot 1: faint chairs). In wides (1, 3, 5, 7, 8) instruments draw only
  the strong silhouettes (bows, cello/bass bodies and necks, harp frame, piano lid and rim, timpani/drum rims, brass bells, cymbals; wind
  tubes faint) and the stroke layer is at 0.45 (`orchpg`).
- **Look in these bars**: `env.dawn 0` (night sky, no purple), ground with no reflection (`reflGain 0, f0 0, ripple 0`, near-black
  base), no world lights or road text (main's orange line stays), figures lit as at blue hour via `env.figLight` (ambient 0.42, `orchamb`).
  Props drawable `reflect: false`. Consequence: the sky and mirror change on the bar-81 cut (purple, reflective -> black).
- **Shot 1**: flights 0.36 s with a short comet tail (22 % of the path), the arrivals land standing and sit down over 0.30 s; the inner
  desks are seated by about 139.7 s (beat 2.7 of bar 81).
- **Continuity**: the hero is exactly as before (her own take, place, facing; the podium is a flat outline on the ground, no step);
  the row and the wings keep the original facing and turn with the original spin (old 141.0-142.2), which turns them toward the
  orchestra; the conductor's view is shot 5 only. From bar 84 beat 3.5 every seated player rises with her instrument (strings, winds,
  brass, harp: a rise segment in their tracks; basses and percussion already stand; the pianist does not rise): on bar 85 all stand.
  The old bow lift / hit on the downbeat of bar 85 is gone for seated strings (basses and percussion keep it).
- **Shots** (same cut points): 1 above (high three-quarter from audience left), 2 side_low_violins, 3 above_behind (lower and closer:
  over the 1st violin rows, 2.3 m up, 6.6 m out), 4 timpani (over the shoulder of the middle timpanist, toward the podium),
  5 conductor_view (in the aisle behind the front desks, at head height, at the hero and the row facing the lens), 6 basses_side,
  7 high_wide (top-down, 46 m), 8 last_wide (from over the audience side, 14 m up; the players rise).
- Frames: `work_fable/take2/v7/orchestra/` now 4143..4394 (138.1-146.5 s, a superset of what was asked, so the preview can start
  in bar 80); `meta.json` first 4143, n 252; hooks.json regenerated (all 221 in-window frames; the concertmaster is in frame in 1-5, 7, 8).
- Identity: new t 60, 137.5, 147.0, 230 PNG md5 identical to the baseline again; orchestra frame 4150 (bar 80) byte-identical to full/.
- Preview `review/fable_take2/orchestra_3d_preview.mp4`: **paper pass applied**, rendered by the film page itself
  (`node fable/take2/tools/render.mjs --q "v7dir=/work_fable/take2/v7/orchestra&hud=0" --mp4 ... --range 138.533:146.31 --audio ...`,
  18 s for 234 frames, then x264 15 Mb/s, 15.9 MB). It starts at bar 80 beat 4, not 80.5: the film has a missing-plate card on bar 80
  beats 3-4 (stance frame). Shots in it follow the film's current table (b81-84 as two shots per bar), with the orchestra frames.
  The sheet's paper stills are from the same page.

### Paper pass: which shots read (stills only)
- Read: 1 (the fan of seated desks, the row and the hero), 2, 4 (timpanist's back with the disc, drum rims), 5 (the hero in her stance
  between the row, backs in the foreground), 7 (the fan of the massed seating is unmistakable), 8 (fan of players, row, podium).
- Weak: 6 (basses: the necks read, the rest is a field of hatching), and **3 still does not fully work**: the backs are large white
  shapes now, but from above and three-quarter they overlap into one hatched mass and the pale-blue disc does not survive the pass (it
  is hatched like the white; it is neither dark nor saturated enough to be kept as an ink).
- Paper options I would want for this sequence (not applied; paper.js not touched), tested with fx.mjs on shot 3:
  `{ solid: 0.55, layers: 2, hatch: 12, thresholds: [0.2, 0.45, 0.7] }` on the Build's black paper and inks: the white backs fill in as
  rubbed solid shapes and the hatching thins; this did more for shot 3 than any engine change. For the disc to survive, either a
  `keep` colour (pass the disc's pale blue as an ink with a lower `inkSat`, ~0.12) or a mask; engine side, the disc could be drawn more
  saturated in these bars (not done).

### Weak / missing (rev 2)
- Look jump on the bar-81 cut (purple mirror -> black night) and on the bar-85 cut back.
- Poses procedural, approximate grips; winds/brass no final accent; pianist on mocap; harps rise with the harp in their arms (instrument
  lifts with them for half a beat, as do cellos).
- Shot 3 as above; shot 6 weak through the pass.
