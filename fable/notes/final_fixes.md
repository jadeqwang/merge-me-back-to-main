# Final-fix pass before the master render, 2026-11-10

Brief: three exact fixes on the Fable cut v6. Status line (kept current): **item 1 done and checked; items 2 and 3 open. Not pushed.**

Files touched: `fable/engine/src/figure_anime/shade.js`, `figure.js`. `fig=classic` (`fable/engine/src/figure/`) is not touched.

## Commands
```
node fable/tools/render.mjs --show /fable/show/main.js --res 1280x720 --sheet 195:202:0.5:work_fable/stills/final/i1_write_05s.jpg:5
node fable/tools/render.mjs --show /fable/show/main.js --res 1280x720 --sheet 199.0:200.5:0.1:work_fable/stills/final/i1_write_01s.jpg:4
node fable/tools/render.mjs --show /fable/show/main.js --res 1920x1080 --stills 199:a.png,200.5:b.png        # 3840x2160 and a crop to judge the hand
node fable/tools/render.mjs --show /fable/show/main.js --res 1920x1080 --bench 172.5
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
