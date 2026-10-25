# Style bible — "TOKEN DAWN"

## Two layers
1. **Plates (never shown raw):** AAA virtual-idol 3D (UE5-grade), from nano-banana-pro stills → Seedance 2.5 motion.
2. **The light lattice (what you see):** engine/src/lattice.js reconstructs each plate from rgb + depth + matte.
   - **Jade = LED.** The figure layer renders as a fine LED-wall image (square emitters, 3–4 px at 1080p). She is always
     the most "real" thing in frame, like the K-pop stage screen.
   - **The world is written.** The world layer renders as tokens: the actual lyric text, flowing in reading order,
     brightness by plate luminance, over a dim soft underpaint that keeps the dawn gradients.
   - **Fidelity = how merged she is.** LED pitch: sparse branch 7–9 px → main 3 px → full merge ~2 px + softened (reads solid).
     Token pitch in the world shrinks/grows the same way. Branch lane colour tints her emitters faintly.
   - Particles can peel (scatter), split into two lattices (fork), and stream back (merge).
3. **Typography** (engine/fonts): hooks = Archivo Expanded Black / Unbounded; intimate = Instrument Serif Italic;
   git/HUD = JetBrains Mono. At most ONE HUD layer per frame. One idea per frame.

## Palette
ink #05060D · night indigo #141A3A · violet #4B3A8C · rose #E0559B · coral #FF7A59 · sunrise gold #FFC46B · dawn cream #FFF1DC ·
Jade orange #FF7A1A · patch blue #8FB4FF.
Lanes (branch stripe/headphone colours): main ORANGE #FF7A1A, ROSE #FF5FA2, SKY #6FB6FF, MINT #4FE3B0, GOLD #FFD23F, VIOLET #A57BFF, WHITE #F4F4F8.

## Character pack v1 (image-model refs; Jade's own real photos MAY be model input as of 2026-10-24; never her kids')
- media/style/r1/sheet_nbp.jpg — 3D turnaround, hair down (canon costume incl. 1420 MHz, RARE EARTH back)
- media/style/r2/face_v2.jpg — head/expression sheet (front/¾/profile, soft sing, high note, smile)
- media/style/r2/bun_v2.png — bun + crossed pencils variant (caps up: blue eraser = FUNCTIONS/rainbow core, pink = FIXTURES/graphite)
- media/style/r1/formation.jpg — the 7-lane formation look
- Hair rule: hair down (main, choruses) OR bun with pencils (Verse 2 branch, writing scenes). Never both.

## Plate prompt rules (nano-banana-pro)
STYLE line: "High-end real-time 3D render with the fidelity of a AAA game cinematic or a virtual K-pop idol made in Unreal Engine 5:
high-polygon stylized-realistic character, strand-rendered hair, soft subsurface skin, physically based fabric, ray-traced lighting."
- Light for the lattice: strong warm rim/back light, readable face fill, clean silhouette, uncluttered set, sky with gradient.
- Leave negative space where hook lyrics will sit (state it: "the left half of the frame is open sky").
- No text in plates (we set all type procedurally).

## Seedance rules (from prior projects)
- First frame = approved plate; prompt pins composition ("Animate the first frame exactly: same framing…"), never names shot size.
- Lip sync: reference_audios = vocal-stem window starting ~0.3 s before the first word; use_virtual_avatar true; generate_audio false;
  measure lag per take (word strips > envelope correlation); conform at explicit -r.
- Acting: situation + one line of subtext + at most one shift; no gestures keyed to words; hands relaxed.

## Character pack v2 (2026-10-24, after Jade's notes: larger very dark brown eyes, double-eyelid crease, taller upper head; costume canon)
- FACE canon: media/style/r6/expr_a.jpg (crops: r6/canon_face_front.png, r6/canon_face_34.png)
- BODY canon (hair down): media/style/r7/turn_gpt.png (correct 1420 MHz sleeve patch + RARE EARTH back); 3D backup r7/turn_nbp.jpg
- BUN canon: media/style/r7/bun_nbp.jpg (beware: extra small chest dot — prompt "only ONE small pale-blue dot")
- Superseded: r1/sheet_nbp, r2/face_v2 (eyes too small — not her), r1/sheet_gpt costume (wrong patch, no RARE EARTH).

## v2 (2026-10-24, Jade's refs: ASCII MMORPG, drone tree of life)
- **World = coloured ASCII** (LOOKS.ascii): every world cell is a glyph from a brightness ramp (`RAMP` in engine/src/lattice.js), coloured by the
  plate (chroma-normalised so dark areas keep their hue), with the lyric letters taking over the highlights. The old 'dawn' (tokens only in highlights)
  is kept for reference.
- **Fidelity ladder:** written (ASCII figure, `written: true`) → coarse LED (fid .25 = clean 6 px grid) → fine LED (fid 1). Never fractional Bayer
  densities on a held shot (they read as a screen door).
- **Drone tree** (scenes/dronetree.js): ice-cyan drone dots, trunk = main (warms to orange at the root swirl), 10 forks → 1,024 warm tips; lane colours
  only as a faint wash at the tips. Pulses root→tips = split; tips→root = merge.
- **Branches are her lives** (LIFE in engine/show/main.js); lane colour per life on jacket bands/headphones; the 1420 MHz sleeve patch is the only
  lettering a plate may carry (gen_plates.py tail).
