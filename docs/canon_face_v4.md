# Canon face v4 — main Jade (locked 2026-10-24 by Jade: "let's just go with the first one … for everything")

**Canon image:** `media/style/canon_v4/canon_face.png` (crops: `canon_face_crop.jpg`, `canon_eyes_crop.jpg`). No glasses.
Glasses variant of the same face (if ever wanted): `media/plates/face/brow/W_X_Z_F_G1_b_a_a.png`.
Kenton: "much closer!" — Jade: brow shape "very good".

## What makes it her (every face shot must keep all of these)
| feature | target | how it was set |
|---|---|---|
| eye shape | rounder, friendly, "protagonist" opening (~0.45 h/w), lid peak over the iris, no cat-eye wing | `cand8/ch1_main_a` → GPT edits |
| eyelid crease | **her own clicked line** (`media/style/crease_points_jade.json`): band ≈ 0.3–0.45 iris diameters, fairly level, never touching the lash line, slightly fainter at the inner end; lid subtly darker + soft warm-brown gradient at the outer corner | `crease_draw.html` → GPT on her line |
| brows | thick-ish, NOT over-thickened; **shape traced from her photo 15** (tails taper to a thin point past the outer eye corner, soft feathered heads); only slightly asymmetric; set high (brow→eye ≈ 0.33 IPD) | `browguide.py` + `browlift.py` (raise only) |
| proportions | nose length 0.87 IPD, nose width 0.50, mouth 0.78, lower lip 0.14, face L/W 1.20; iris size kept at render default (0.24, her choice); face width half-way to her photos (2.08) | `proportions.py`, `irislip.py` |
| forehead + hair | tall forehead fully uncovered; **half-up, half-down**: thin braids from each temple back to the crown, rest long, loosely wavy, black | `hairswap.py` (hairstyle-only ref `media/style/ref_hair_halfup.png`, its face masked) |
| skin/makeup | natural, minimal; no V-chin, no slimming, no gloss/blush/liner; no "influencer / makeup-tutorial" look | prompt guards |

## Checks for every derived face
`tools/plates/facecheck.py` (eye placement / corner skew), `facegeom.py` (proportions vs her photos), `eyemetrics.py --check --size-ref=canon`,
and eye/brow crops next to the canon (`facecrop.py --eyes`). Show Jade whole faces AND crops **from the same file**.

## Lessons (don't repeat)
- Models erase/lower natural creases and default to surgical-looking, monolid, or cat-eye shapes; describe her crease in her words and use her line.
- Never composite a face from one generation onto another's jaw (eyes go off-centre). Thin-plate warps ripple hair; use the smooth monotone tools.
- Old bangs leave shadow "fragments" and temple locks; remove by painting the region out first, or rebuild from a clean version.
- Brow outlines from landmarks miss hidden tails; reveal or trace from photos.

## Propagation to the face shots (2026-10-24)
Stills with the canon face: `media/plates/face_v4/<shot>.png` (candidates + raw model outputs in `face_v4/cand/`, prompts in `face_v4/prompts/`;
review: top section of `out/review/likeness.html`). Not yet animated; `tools/sd/batch.py` does not read face_v4/ yet.
- Tool: `tools/plates/canonprop.py` (GPT Image 2.5, 3:2 window so no padding needed). Main-Jade: `--mode=rect` head+all-hair window
  (hair + identity in one edit, whole window pasted back with a feathered edge + border colour match), then `--mode=face` (pad 2.0, face oval
  pasted back) for an identity refinement. Violet branch: `--mode=rect` head window, hair/bun/pencils kept by prompt. Refs: canon_face(.png,
  _crop, eyes_crop); no selfies were needed.
- `bd_ahh` is upside-down in frame: `--rot180` (mediapipe and GPT both need it upright). The edit warmed the pale skin light; pulled back with
  `tools/plates/skinmatch.py --amount=.8` (Lab transfer from the original plate's face skin).
- The face-refine pass can slim the face / narrow the chin (ch2_catch): compare with the rect-pass result and keep the rect one when it does.
- ch1_gone_close / ch2_gone_close = the canon image itself.

## Jade's read after the rollout (2026-10-24)
"violet actually reads the most like me" → "sitting on the dish looks most like me" = `face_v4/v2_dish_close.png`.
Test (`media/style/canon_v4/violet_test/`, sheet `out/review/violet_test.jpg`): the frontal canon with only the hair-up style (hair_a/b), and with
the hair plus cool night light (both_a/b; use the *_raw files, because the rect paste colour-matched them back to pink). Neither clearly became the dish face, and
the hair-up edits made the face rounder. `skinmatch` light-only looked grey; skip it.
