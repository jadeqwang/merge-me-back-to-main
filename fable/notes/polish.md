# Hero-polish pass on the anime figure (`fable/engine/src/figure_anime/`), 2026-11-10

Brief: the figure seen LARGE (the 4K crop of 233.5 s, `work_fable/stills/v5/uhd_233_crop.jpg`) was below the bar: mitten hands, small eyes, stray shadow
patches on the face, a stair-stepped outline, balloon sleeves. Status line (kept current): **items 1-4 done; checked in the film at 1080p (`--mb 4`) and on the 4K peak frame; frame cost
measured A/B; `fig=classic` byte-identical. The crouch's trouser folds (204.9-205.4) were NOT touched. Not pushed. Open: "Below the bar" at the bottom.**

Files touched: `figure_anime/body.js`, `shade.js`, `figure.js`; `fable/show/cast.js` (hand defaults only, additive); `fable/show/animelab.js` (modes `H`, `S`).
`fig=classic` (`fable/engine/src/figure/`) is not touched.

## Commands
```
S=fable/engine/src/figure_anime/sheet.sh
$S out.jpg H anime 480x480 7 290 "0 1 2 3 4 5 6  8 9 10 ..."        # hands: cell = view * 8 + shape (see the header of animelab.js)
$S out.jpg S anime 900x800 3 720 "6 3 2 0 4 5"                      # sleeves / jacket in six poses
$S out.jpg F anime 640x640 4 540 "0 1 2 4 5 6 7 8 9 13 18 19"       # faces (the existing mode)
node fable/tools/render.mjs --show /fable/show/main.js --res 1920x1080 --mb 4 --stills 233.5:a.png     # judge ink with --mb 4: that is what the film is rendered with
```
Before / after: the `before` stills were rendered from a snapshot of HEAD bb48c63 (`git archive` into a scratch folder with `work_fable` and
`engine/node_modules` linked in, its own `render.mjs`), the `after` ones from the working tree, same times, same crop boxes.
Sheets (git-ignored): `work_fable/stills/polish/hands.jpg`, `face_day.jpg`, `ink.jpg`, `sleeves.jpg`; working sheets in `polish/dev/`.

## 1. Hands
- **Model** (`body.js` `HAND`): a palm (a slab with rounded edges, narrow wrist, sloping knuckle line), four fingers (tapered, three segments, round tips, a
  little long) and a thumb (a full base = the ball of the thumb, two joints), all rigid to the hand joint. Canonical hand frame: x out of the palm, y wrist ->
  fingertips, z toward the thumb; the joint's local frame is (side * x, y, z), so one table serves both hands.
- **Posing** (`shade.js` `handPose`, vertex shader): each digit is rotated at its three joints (soft 6 mm bands) by a row of the pose table, distal joint first.
  Fingers: spread, knuckle, middle, end. Thumb: swing in the palm plane, opposition, two joints, plus a turn about its own length. `handFK` in `body.js` is the
  same chain on the CPU (used to solve the shapes).
- **Shapes** (`HAND.pose`): `splay` (-1: flat, fanned), `relax` (0: natural curl, more toward the little finger), `fist` (+1: thumb across index and middle),
  `grip` (the pencil of `bun_write`), `blade` (flat, fingers together, thumb tucked: the salute's left palm, palm strikes). The thumb rows and the grip's
  finger rows were SOLVED, not guessed: a random search over the angles against target joint positions, with penalties for passing through a finger, the palm
  or the pencil (a scratch script; the numbers are in the table). Blend: `hand` -1..0..+1 runs splay - relax - fist; `grip` / `blade` blend in on top by an amount.
- **Per instance**: `hand: number | 'grip' | 'blade' | { v, grip } | { v, blade } | { L, R }`. Packed in `i_trail.w` as two 12-bit codes (shape 0..62,
  special 0..3, amount 0..15). Old calls (`hand: 1`, `{ L, R }` numbers) mean what they meant.
- **Pencil**: the held pencil's line and tip are unchanged, so `fig.body.pencilTip` is the same point ([-0.0481, 0.2, 0.0591] in the handR frame). Only its
  back end changed: it used to come out through the heel of the palm; it now starts inside the closed hand (ring `C(0.050)`). The grip: index along the shaft
  with its pad on it, the thumb's pad on the shaft from the side, the other three hooked round it.
- **Cuff**: the sleeve's end was an open tube; a small lip now closes it onto the wrist, and the wrist runs 4 cm up inside the sleeve. The lip has no ink hull
  (`noHull`: n.w = -1) and the sleeve's own hull stops short of its open end: seen from the hand's side the hull's inner wall was a black notch on the wrist.
  Digits have no hull where they are rooted in the palm (it filled the crotch between two fingers and the web of the thumb with black).
- **Lines**: no drawn finger lines any more. Each finger has its own aux colour (fading into the palm's at the knuckle), so the engine's post outline draws a
  thin line where two fingers touch and none across the knuckles; the hull on fingers is light (weight 0.30).
- **LOD**: only mesh LOD 0 (a body over about 370 px tall) carries the palm, the four fingers (10 x 14 quads each) and the cuff's lip. LOD 1 and 2 have the
  thumb and ONE form from wrist to fingertips (digit 5): rigid below the knuckles, bent beyond them by the mean of the four fingers' angles, its tip cut to the
  profile of the four fingertips. By the time a body is small enough for LOD 1 the fingers of LOD 0 have already closed into that same shape (next point), so
  the switch shows nothing (`dev/lod.jpg`: 389 px = LOD 0, 349 px = LOD 1).
- **Small hands** (found on the LOD strip, `dev/lod.jpg`): the engine's post outline inks 1.4 px on each side of every edge, so separate fingers under about
  6 px wide turned into black claws (a body under about 600 px tall at 1080p), and a thumb into a black nub. So the hand closes as it gets small, by the width
  of a finger in pixels (`handPx`, 6.2 -> 4.2 px): the fingers go parallel and close ranks (14 % thicker), the thumb folds in (the blade's thumb) and sinks
  into the palm's own outline, the per-finger aux colours and the digits' hull fade out. Continuous: nothing pops, and the far mitten takes over from a hand that is already one
  shape. Consequence: real, separate fingers are seen from about 620 px of body height at 1080p (the open arms at 233.5 are 680 px: just inside; at 720p
  the same shot has the fingers half closed).
- Geometry (deterministic, `buildBody`): triangles per LOD 30,552 / 7,850 / 2,406 -> 34,032 / 7,930 / 2,430 (+11 % / +1 % / +1 %).
- All sixteen hand lofts share one atlas tile (`tileKey`), so the atlas is the same size (5 x 5 tiles). None of them uses the body's random stream: hair
  clumps, fibres and decal points are bit-identical to before.
- `cast.js` defaults: the salute's left hand is `{ v, blade }`; `double_palm` and `*_push` events give `blade`; `release` opens the cupped hands as the light
  leaves (2.25-2.8 s of the track); everything else as before (fists for punches, -0.6 for open arms, 0.4 for runs, the figure's own grip for `bun_write`).

## 2. Eyes and face by day
- **Eyes**: 19 % wider (`FACE.EW` 0.0262 -> 0.0312), 17 % taller (`FACE.ES`), 1.7 mm further apart, outer corners a little more up (`TILT`). First try was
  +24 % in height: too round, a doll; her eyes are almond. Iris: near black under the lid, warm dark brown low, a lighter crescent at the bottom, dark limbal
  ring, pupil, ONE catchlight (upper left, 5 mm: about 2.5 px when she is 40 % of a 1080p frame). Lash line 20 % heavier, thickening into the flick. Brows
  higher (`BY`), straighter, fuller (5.8 -> 3 mm).
- **`joy`**: the open D mouth read as a dot. Now a line that widens (2.5 -> 4 cm) and turns up at its corners, the lips just parted (`mouth open` 0.30);
  only `laugh` opens the mouth. `joy`'s brows were tilted inner-end-up, which read as worry once the brows were full: now level (tilt -0.06).
- **Shading by day** (`faceD` in `meshFS`): the face no longer takes its shadow from the head's normals (that was the diagonal band). She is lit from the
  front by design; the shapes are (a) the hair's shadow, the hairline displaced away from the light: under the fringe and beside the temple on the sun's side;
  (b) a small shadow under the nose tip; (c) one crescent of tone along the cheek AWAY from the sun, 2 cm at most, hugging the contour, absent when the sun is
  in front of her or straight behind; (d) under the jaw, now from the loft's smooth normal (`v_hn`) instead of screen-space derivatives (those drew the
  mesh's facets: the triangle on the other cheek). Blush: warmer, a little larger, grows with the smile.
- **When**: with a white key from the first daylight (`sunAmt` 0.02-0.25: the catch's own sunrise, 229.6-231); with a COLOURED key (Act C's gold, 170-181)
  the old form shading stays until `sunAmt` 0.35-0.75. Night and silhouette are untouched: at `sunAmt` 0 the key does not light anything.

## 3. Ink
- The film's `--mb 4` (four jittered sub-samples) already smooths the line: `ink.jpg`, top row = one sample, second row = four. Stills for review should be
  rendered with `--mb 4`.
- A fully analytic edge is not possible from inside the figure: the outer edge of the line is drawn by the ENGINE's post outline (an 8-tap, binary edge
  detector on the aux buffer, `post.js`, not this pass's file), which dilates the hull's aliased edge by 1.4 px. Writing no aux from the hull would move that
  line 1.4 px INTO every form (it would eat the fingers). So: left to the sub-samples.
- Weight: the hull's width now varies 0.34-1.66 x (was 0.55-1.45) with the surface's turn from the key (raised a little, so undersides are heavy): thin
  toward the sun, heavy under the arms and the jaw. Fingers keep a fine line.

## 4. Sleeves and jacket
- Sleeve folds are drawn in loft space (`folds`, regions 1 / 2) and follow the elbow: the vertex shader passes how far the elbow is bent and where round the
  sleeve the INSIDE of the bend is (`v_arm`). Inside the elbow: a wedge of shadow with an inked far edge that deepens with the bend, and two more creases
  (forearm, upper arm) that come with it. A long pull on the upper arm (below the orange band: the band stays clean). Six gathers of different sizes rising
  from the cuff (they were nine equal teeth). The elbow's three creases are staggered round the arm; a band of tone under the puff was tried and removed:
  stacked creases and that band drew a TARGET on a bent elbow / round a cuff seen along the forearm (246.0).
- Folds on the jacket are a tone DEEPER than the form's shadow (white cloth's shadow is very pale under the day grade: the old folds were there and nobody
  could see them). The hem's gathers are of uneven height, with filtered edges.

## Frame cost
`--bench` cannot see a change this small: on this machine (a desktop Chrome shares the GPU) the same code gave 12.6-19.3 ms at 142 and 18.0-31.3 ms at 154 in
back-to-back runs. Measured instead with both versions OPEN AT ONCE and alternating bursts of 20 frames (a scratch script; before = HEAD bb48c63; a control
run of before against before gives 0.98-1.02). 1920x1080, ms per sub-sample, 10th percentile | median:

| t | shot | before | after | ratio |
|---|---|---|---|---|
| 142 | 1,024 top-down grid, blue hour | 4.7 / 5.2 | 4.7 / 5.1 | 1.00 (1.00-1.04 over three runs) |
| 154 | 1,024 silhouettes at sunrise | 7.5 / 8.1 | 7.5 / 8.0 | 1.00 (1.00-1.03) |
| 172.5 | arms wide, rows of near bodies, sun-side light | 9.8 / 10.4 | 10.2 / 10.9 | 1.04 |
| 243 | day, hero + 64 | 1.1 / 1.2 | 1.1 / 1.2 | 1.00 |

What it took to get there (the first version was +13-16 % at 142), in the order found:
- fingers at LOD 1 were +13 % triangles on every mid-distance body: LOD 0 only (see LOD above);
- looking up the elbow's two joints for every sleeve vertex was 7 % of the frame at 142: only for a body over about 240 px tall (the folds fade in up to
  390 px; below that there are none);
- SEVEN NEW VARYING FLOATS were a constant +0.35 ms (6 % at 142) whatever they carried: every small triangle and decal point of 1,024 bodies sets them up.
  There are now none: the new per-vertex data rides in the spare slots of `v_flags` (see the comment at its declaration in `shade.js`);
- no select (`a ? f() : g()`) round new vertex work, real branches; the hand's tables are uniforms (`HAND_U`), not const arrays; the face's whole block is
  skipped beyond 1 cm of face per pixel; no derivative is taken inside `folds()`.
The 4 % left at 172.5 is near-LOD work that was asked for (fingers on the front rows, the sleeve folds, a wider hull on shadow sides).

## Checked
- `fig=classic`: 36, 154, 198, 243 at 720p rendered from HEAD's snapshot and from this tree in the same order: all four byte-identical (md5).
- Hair clump seeds, fibre count, decal points and `pencilTip` are identical to before (no new loft uses the body's random stream).
- Night / sunrise / silhouette look: 51, 126.2, 172.5, 184, 197, 223.5, 270 before | after (`dev/sanity.jpg`): unchanged apart from the hands and the eyes' size.
- The peak frame at 4K: `uhd_233_before_after.jpg` (the brief's crop on top, the same crop now below).
- LOD: `dev/lod.jpg` (744, 622, 389, 349, 171 px of body height).
- Grip numbers (scratch FK): the index's pad is 0.5 mm into the pencil's surface 15 cm along it, the middle finger's 0.5 mm at 11.5 cm, the thumb's pad 0.2 mm off
  it at 10.7 cm; in the fist the thumb lies 1.6 mm into the index's middle segment and 0.6 mm off the middle finger's.
- NOT checked: anything in motion as video (stills only: no strip of a hand changing shape; the grip appears with the pencil, unblended); the hands of
  `build` / `drop` beyond 126.2, 129.7, 179.6; blink / gaze with the larger eyes; 720p.

## Below the bar (exact times)
1. **Hands at middle size.** Under about 620 px of body height at 1080p the hand is a closed paddle (by design, see "Small hands"): the salute (179.3-181: the
   front row is about 35 % of the frame: fist and palm are two paddles), the runners of 245.3-248.8, shot D 248.8-257.5, and at 720p even the open arms of
   229.6-236.5. The cause is the engine's outline width (1.4 px each side whatever the size of the form), which is `post.js`, not this pass's file.
2. **233.5 at 1080p**: the fingers are 6-7 px wide with 2-3 px of line: they read, but ink-heavy; they are clean at 4K.
3. **Ink**: a single-sample still is still stair-stepped (the outline is a binary edge detector); only `--mb 4` smooths it. Interior lines (band borders,
   between fingers) are a constant 2.8 px: "thinner inside" cannot be done from the figure.
4. **Sleeves**: the folds are drawn tones on a smooth loft: the SILHOUETTE of a sleeve is still a balloon (233.5, 236). On a hard bend (246.0, hand on hip)
   the elbow's wedge sits on a pinched mesh.
5. **Skin below the neck**: the midriff still takes a diagonal form shadow from mesh normals (233.5, 236); only the face was designed.
6. **The pencil hold, 195-202**: reads as a hand round a pencil with the index along it; at night it is one lilac tone, so the fingers separate only by the
   small dark gap between thumb and index (198.0, 200.5). The held pencil is 5 cm shorter at the back than the one in the bun.
7. **Brows** at 233.5 (head tipped back 14 degrees) read a little raised; level at 236 and 243.
8. **236.6-240** (low camera; checked 238.0): the under-jaw shadow ends on the cheek in a straight edge, so a pale wedge of lit jaw runs from the mouth's
   corner to the hair on her right side. Clean, but geometric. (`face_day.jpg`'s cell for 250 is the back of her head: she faces away there.)
9. **204.9-205.4**: the faceted trouser folds of the crouch: not touched (the cloth model, see r4_X.md item 5).
10. **172.5**: +4 % frame cost (above).
