# Hero-polish pass on the anime figure (`fable/engine/src/figure_anime/`), 2026-11-10

Brief: the figure seen LARGE (the 4K crop of 233.5 s, `work_fable/stills/v5/uhd_233_crop.jpg`) was below the bar: mitten hands, small eyes, stray shadow
patches on the face, a stair-stepped outline, balloon sleeves. Status line (kept current): **items 1-4 done and checked in the film at 1080p; LOD / perf /
4K check and the final sheets: see the bottom. Not pushed.**

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
  (`noHull`: n.w = -1), or its hull drew a black notch at the thumb.
- **Lines**: no drawn finger lines any more. Each finger has its own aux colour (fading into the palm's at the knuckle), so the engine's post outline draws a
  thin line where two fingers touch and none across the knuckles; the hull on fingers is light (weight 0.30).
- **LOD**: mesh LOD 0 and 1 carry the fingers (10 x 14 and 6 x 7 quads per finger); LOD 2 (a body under about 184 px tall at 1080p) has the palm, the thumb and
  ONE mitten (digit 5) that takes the mean of the four fingers' angles and widens as they fan, so the silhouette does not jump at the switch.
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
  from the cuff (they were nine equal teeth), over the shaded underside of the puff.
- Folds on the jacket are a tone DEEPER than the form's shadow (white cloth's shadow is very pale under the day grade: the old folds were there and nobody
  could see them). The hem's gathers are of uneven height, with filtered edges.

## Still to do / below the bar
(filled in at the end of the pass)
