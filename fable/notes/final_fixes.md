# Final-fix pass before the master render, 2026-11-10

Brief: three exact fixes on the Fable cut v6. Status line (kept current): **items 1, 2 and 3 done and checked (stills and strips; not watched as video). `cuts.json` unchanged. Not pushed. Open points: the last section.**

Files touched: `fable/engine/src/figure_anime/shade.js`, `figure.js`; `fable/show/seq/10_drop.js`, `actC_form.js`. `fig=classic` (`fable/engine/src/figure/`) is not touched.

## Commands
```
node fable/tools/render.mjs --show /fable/show/main.js --res 1280x720 --sheet 195:202:0.5:work_fable/stills/final/i1_write_05s.jpg:5
node fable/tools/render.mjs --show /fable/show/main.js --res 1280x720 --sheet 199.0:200.5:0.1:work_fable/stills/final/i1_write_01s.jpg:4
node fable/tools/render.mjs --show /fable/show/main.js --res 1920x1080 --stills 199:a.png,200.5:b.png        # 3840x2160 and a crop to judge the hand
node fable/tools/render.mjs --show /fable/show/main.js --res 1920x1080 --bench 172.5
node fable/tools/render.mjs --show /fable/show/main.js --res 1280x720 --sheet 178.4:181.0:0.2:work_fable/stills/final/i2_salute_02s.jpg:4      # and 178.4:179.5:0.1 -> i2_salute_01s.jpg
node fable/tools/render.mjs --show /fable/show/main.js --res 1280x720 --sheet 177.25:177.75:0.0333334:work_fable/stills/final/i3_kick_30fps.jpg:4
node fable/tools/render.mjs --show /fable/show/main.js --q "cgeo=1" --res 640x360 --stills 179.6:x.png | grep 'actC geo'      # the cells round her, metres from her feet
node fable/tools/render.mjs --show /fable/show/main.js --q "dev=cuts&standin=1" --stills 0:x.png | grep -o 'CUTS.*' | cut -c6- | cmp - fable/show/cuts.json
fable/engine/src/figure_anime/sheet.sh out.jpg H anime 480x480 4 500 "5 13 21 29"                            # the pencil grip by day, four views (MB=4 in the environment for the film's ink)
```
Outputs (git-ignored): `work_fable/stills/final/` (strips), `work_fable/stills/final/dev/` (working crops, before / after).

## 1. The writing shot, 195-202 (and the sleeves everywhere)
Two separate causes, found by turning the folds off and by colouring the hand's digits by id on the film's own frame:

- **The closest shot of the film was drawn with mesh LOD 1.** The level of detail was chosen by the distance from the lens to the instance's ORIGIN. The `violet`
  take has root motion (she walks out from the origin), so at 195-202 the origin is far from the lens although she fills the frame: LOD 1 = the mitten hand
  (one form from wrist to fingertips + a thumb: the "blocky fist"), the coarse sleeve and jacket (the angular silhouette, the 16-gon bun and collar).
  `figure.js` `draw` now also measures the distance to where she IS (`_hips`: her hips on the track, a CPU copy of the vertex shader's lookup) and takes the
  nearer of the two. A level can only go up, never down. Only when 48 bodies or fewer are on stage: a crowd keeps its buckets exactly as they were (with the rule
  applied to the 1,024, ten more bodies went to LOD 0 at 172.5 and the frame was slower).
  Result at 195-202: LOD 0, i.e. the real hand in the solved pencil grip (index along the shaft, the thumb's pad on it, three fingers hooked), a smooth sleeve with
  its ribbed cuff, the round bun and collar, and the jacket's back as designed (the disc, RARE EARTH). The whole shot is LOD 0 from 195.0, so nothing switches in it.
- **The sleeve folds of the polish pass were polygons by construction** (`shade.js` `folds`): the elbow's shadow was a diamond (a wedge with a corner at its
  thickest point, 9 cm thick at a full bend), the cuff's gathers and the upper arm's pull were straight-sided triangles, all with a one-pixel edge; at night they
  were 30-58 % darker than the sleeve. Now:
  - the elbow's three shapes are CRESCENTS (`cres`): one edge is the crease, a smooth curve round the arm; the other bulges away from it; the thickness runs out
    to a fine point without a corner; a third as thick as before (1.3-3.2 cm);
  - the gathers are THORNS (`gather`): concave sides, a fine point, each leaning a little its own way;
  - every fold edge has its own softness: 1.5 mm by day (a drawn edge), 8 mm at night;
  - at night (`nite`: the key weaker than 0.12-0.30, i.e. night and the violet hour; 0 from sunrise on) a fold is ONE soft tone step of 17 % (`foldN`), and on
    the jacket and its sleeves the form's own terminator is a soft gradient and the rim's inner edge is soft (hard, both followed the mesh: facets on a bent elbow).
  Day and sunrise keep the bold drawn tone (deeper than the form's shadow), with the new shapes.
- **The hand at night**: there is no ink at night, so a hand was one flat tone. Each finger and the palm's edge now turn a tone darker (36 %) where they turn away
  from the lens, only while the fingers are open (their width in pixels) and only while the key is weak: the fingers separate (`shade.js`, after the folds' ink).
- **The bun**: with LOD 0 it is the round 30-gon and meets the head in a clean concave line; the hard notch was LOD 1. No change of its own.

Checked (1080p stills, crops in `dev/a_zoom.jpg`, `dev/a_crops.jpg`, `dev/a_bun_elbow.jpg`, `dev/v_hand.jpg`; before: `dev/before_close.jpg`, `dev/elbow_zoom.jpg`):
night close 199.0, 200.5 (and 197 at 4K); night medium 36, 93; sunrise 172.5, 179.6; day 233.5, 238, 243; bent elbows 179.6 (salute), 126.2 (punch), 49 (violin).
Strips: `i1_write_05s.jpg` (195-202 / 0.5 s), `i1_write_01s.jpg` (199.0-200.5 / 0.1 s).

Frame cost, `--bench 172.5` at 1920x1080, working tree and HEAD (e194108) alternating, ms per sub-sample: after 27.5 / 29.7 / 29.5, before 24.6 / 31.9. The same code
spans 24.6-31.9 on this machine (a desktop shares the GPU), so `--bench` cannot separate them; by construction the 1,024's LOD buckets are unchanged (logged at
172.5: 18, 36, 72, 103, 153, 352, 267, 23 before and after) and the sleeve's fragment work is a few operations lighter at night, the same by day.
`fig=classic`: 36, 198, 243 at 720p from HEAD and from this tree: byte-identical (md5).

Left / not done for item 1:
- The pale rim on the far side of the inner elbow (199-201) is still a narrow light sliver in the notch of the bend: the rim of the forearm seen past the upper arm.
- Night folds are deliberately faint (17 %): at 720p they are barely there; the sleeve reads by its rim and its cuff.
- Any other shot with 48 bodies or fewer whose take carries her far from her instance's origin now gets the mesh level her real distance asks for. Seen: seq 11
  (188-203). Not swept: the whole film at a fine step.

## 2. The salute, 178.383-181.0 (10 E)
Why it sat right of centre with bodies cut by the right edge: no lens could balance it. In the word's ground plan (`--q "cgeo=1"`) she stands on a CORNER: her
row runs 8.7 m to her north at 0.8 m a body, three rows stand behind her on that side only, a second group stands IN FRONT of her on the north side (2-8 m east,
from 0.8-2.4 m north of her axis), and to her south there is nothing for 4.8 m (the gap between the A and the I), then the I. The old lens stood in that gap.
- **The lens is frontal**: on her axis, due east of where she salutes (on main), 7.5 -> 7.1 m, 1.15 m up, 25 degrees as before; it aims at her hips' own
  north-south position (she lands 0.7 m north of where she salutes and comes back), so she is on the vertical centre line (50.2 % at 179.6).
- **For this shot the 1,023 stand in a wedge behind her** (`actC_form.js` `troupeSlot`, applied in the shot's `each`): row k is 1.7 k m behind her, k + 1 bodies
  1.9 m apart, centred on her axis, each row in the gaps of the one before; she is alone in the front row, nobody stands between her and the lens. The copies
  nearest to her in the word take the nearest rows. Offsets are from her instance origin: all 1,024 are on the same take at the same time there, so the wedge
  moves as one body. The wedge is wider than the lens's angle from the eighth row on (22 m back, bodies a third of her size): the crowd runs out through both
  edges there, the near rows are whole. The change of ground plan is on the cut (178.383), from a lens 2.3 m away at ground level to this one.
- Her head is 31-34 % down the frame, her feet 83 %, the pool under her. The aim rises with her as before (`rise`, her hips' height): 178.8-179.0, still from 179.1.
- Cut times: unchanged (`cuts.json` regenerated into a scratch file: identical).
Checked: `i2_salute_02s.jpg` (178.4-181 / 0.2 s), `i2_salute_01s.jpg` (178.4-179.5 / 0.1 s), 1080p stills 178.6, 179.0, 179.6 (`dev/s_check.jpg`).
Left: 178.4-178.8 (the low landing pose before the rise): the troupe is a low band across the middle, sky above and 35 % of empty mirror (reflections) below;
she is 2 % right of centre there (she is still coming back from the landing). The far rows are cut by both frame edges (by design, from row 8).

## 3. The jump kick's apex, 177.3-177.6 (10 C, the orbit)
Measured on the take (hero, metres from her cell): it is a CRESCENT kick. Her left foot passes from the south (177.40: 0.7 m toward the old lens, 1.3 m up) over
her head (177.517: 1.98 m up, straight above her) to the north (177.60); her hips are only 0.26 m higher than standing. The lens stood level (1.15 m), 3 m to her
south: her leg came at it, then crossed her own head, and behind her at the same height stood the copies in the same kick. Hence the dark tangle and the smear.
- **The lens sinks and comes in under the kick** (`orbit`, `kickLow`): from b102.55 (176.73) to 0.08 s before the apex it goes from 1.15 m to 0.2 m above the
  mirror and from 3.0 m to 2.3 m, looking up, 2 degrees wider. The copies are 0.8-2 m further off than she is, so from there they end below her shoulders: her
  head, her torso and the whole kicking leg stand against the sky (apex: her foot 14 % under the top edge). 6 degrees less round her (72 instead of 78 off east):
  toward the key's side (the key comes from the south-east: the flank the lens sees is the lit one, cream against the sky).
- **The sky behind her**: up there it was near-black violet, and her hair and trousers are black and navy. `belt(k, hi)`: while the lens is low a wide, soft rose
  (centred about 24 degrees up, strength 0.5) is added to the western sky above the rose belt. It comes in with the lens's move (176.73-177.43) and is gone on the cut.
- After the apex the aim follows her down into the landing (`u5`, 0.42 m by the cut); the lens stays low.
- The apex time (177.517), the take and the cut (178.383) are unchanged.
Checked: `i3_kick_30fps.jpg` (177.25-177.75 at 1/30 s), `i3_kick_leadin_01s.jpg` (176.5-177.25), `i3_kick_landing_01s.jpg` (177.75-178.38), 1080p 177.517
(`dev/s_check.jpg`); before: `dev/kick_before.jpg`.

## Still wrong / not done (exact times)
- **176.75-177.25**: the sky turns from violet-with-a-belt to rose over half a second while the lens drops: a lighting cue, not a real sky. If it reads as a
  flicker in motion, lower `0.5 * kickLow(t)` in 10 C's `belt` call (0 = the old sky; the leg is then dark on dark again).
- **177.3-177.6**: her own row still stands right behind her (0.8 m a body), a staircase of copies down to the right of her hips and legs; only her upper body,
  head and kicking leg are clear of them. The copies' kicking feet reach about the height of her head.
- **177.75-178.38**: the landing from the low lens: she sinks to the lower third, sky above her.
- **178.4-178.8**: see item 2 (the low band of the landing pose under a lot of sky and mirror).
- **178.383 (the cut)**: the troupe's ground plan changes on it (the word's cells -> the wedge). Not visible on the strips; not judged in motion.
- **195-202**: the faint pale rim in the notch of the bent elbow; night folds are faint by design.
- Nothing was watched as video with sound; 1080p / `--mb 4` only on single stills (199, 200.5, 178.6, 179.0, 179.6, 177.517 without `--mb`).
- `--bench` at 172.5: see item 1 and the numbers below; it cannot resolve a few per cent on this machine.

## Frame cost at 172.5, final tree against the code before this pass (e194108)
`--bench 172.5 --res 1920x1080`, one process per run, the two versions alternating (the four files checked out and back), ms per sub-sample:
after 25.9 / 21.7 / 18.6 / 22.1 (and 27.5 / 29.7 / 29.5 / 31.4 / 27.8 earlier in the day), before 18.5 / 27.0 / 29.5 / 25.9 (and 24.4 / 26.3 / 24.6 / 31.9).
Means 26.0 and 26.0: no difference that this bench can see (either version runs 18.5-31.9 from one process to the next). Nothing in the pass adds work at 172.5:
the crowd's LOD buckets are the same, the kick's sky term is one `exp` per sky pixel times 0, the wedge exists only from 178.383.
`fig=classic`, 36 / 198 / 243 at 720p: byte-identical to HEAD before the pass, checked again on the final tree. It also renders 177.517 and 179.6 (the new
lens and the wedge are the sequence's, so both figures get them).
