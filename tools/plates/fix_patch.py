#!/usr/bin/env python3
"""Repair costume details on existing plates with an image edit (nano-banana-pro), keeping everything else.
  $PY tools/plates/fix_patch.py NAME[.jpg|.png] ... [--force]
Writes media/plates/fix/<stem>.jpg. Default fix = the 1420 MHz sleeve patch; extra per-plate notes in NOTES."""
import os, sys
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "gen")); import cf
ROOT = cf.ROOT
PATCH = ("Edit the first image. Change ONLY the round patch on the woman's left upper sleeve (on the coloured arm band): make it exactly like the patch "
         "in the reference images — a round white embroidered patch with a thin black ring and the bold black text '1420' above 'MHz', crisp and legible, "
         "following the curve and lighting of the sleeve. Keep the band colours exactly as they are in the first image. If the patch is hidden or missing where the sleeve is visible, add it there. "
         "Keep every other detail of the first image exactly the same: same framing, pose, face, hair, lighting, colours, background and grain. "
         "Do not add any other text.")
NOTES = {
    "ch1_formation": " Apply the same patch to every copy of the woman whose left sleeve is visible.",
    "ch2_formation": " Apply the same patch to every copy of the woman whose left sleeve is visible.",
    "ch1_formation_old": " Apply the same patch to every copy of the woman whose left sleeve is visible.",
    "v2_horizon": " This version of her wears VIOLET instead of orange everywhere: jacket bands, pant straps and headphones all stay VIOLET, never orange." " Also, on the back of her jacket there must be one big pale-blue circle with the words RARE EARTH in black below it, as in the turnaround reference back view.",
    "v2_dish_sit": " Also fix the jacket: ONE VIOLET band straight across the chest and one VIOLET band around each upper arm (no other stripes or blocks), and exactly one small pale-blue dot on the left chest. This version of her wears VIOLET instead of orange everywhere: jacket bands, pant straps and headphones all stay violet purple, never orange.",
    "v1_track_rose": " This version of her wears ROSE PINK instead of orange everywhere: jacket bands, pant straps and headphones all stay ROSE PINK, never orange.",
    "v2_pencil": " Also, her jacket must have exactly ONE small pale-blue dot on the left chest; remove any second dot.",
    "v2_release": " This version of her wears VIOLET instead of orange everywhere: jacket bands, pant straps and headphones all stay VIOLET, never orange." " Also make the small pale-blue dot on her left chest clearly visible (exactly one).",
}
REFS = ["media/style/r7/turn_gpt_patch.png", "media/style/r7/patch_34.png"]


def main():
    names = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv
    os.makedirs(os.path.join(ROOT, "media", "plates", "fix"), exist_ok=True)
    jobs = []
    for n in names:
        src = next(os.path.join("media", "plates", n + e) for e in ("", ".jpg", ".png") if os.path.isfile(os.path.join(ROOT, "media", "plates", n + e)))
        stem = os.path.splitext(os.path.basename(src))[0]
        out = os.path.join(ROOT, "media", "plates", "fix", stem + ".jpg")
        if os.path.exists(out) and not force: continue
        inp = {"prompt": PATCH + NOTES.get(stem, ""), "aspect_ratio": "16:9", "image_size": "2K", "image_input": ["file:" + src] + ["file:" + r for r in REFS]}
        jobs.append((out, inp, stem))

    def run(j):
        out, inp, stem = j
        try: return out, cf.generate("google/nano-banana-pro", inp, out, tag=f"fixpatch_{stem}")
        except Exception as e: return out, f"ERR {e}"
    with ThreadPoolExecutor(1) as ex:
        for out, r in ex.map(run, jobs): print(os.path.relpath(out, ROOT), "ok" if isinstance(r, list) else str(r)[:300])


main()
