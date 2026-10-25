#!/usr/bin/env python3
"""Surgical features pass on likeness plates: Jade's natural double-eyelid crease + her thick, asymmetric brows (left arched, right straight).
  $PY tools/plates/eyelids.py STEM ... [--dir=media/plates/face]
Why it's needed: in her selfie the upper rim of her glasses sits right on the crease, so "no glasses" edits erase the fold with the frame
(and image models drift East Asian faces toward single lids and symmetric brows). Refs: media/style/selfie_brows_eyes.jpg (real), anchor_eyes_light_hands.jpg (approved stylized).
The previous version of each plate is kept in <dir>/try3/."""
import os, shutil, sys
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "gen")); import cf
ROOT = cf.ROOT
EYES = "media/style/ref_eyes_noglasses.jpg"   # her real eyes, NO glasses (selfies 7 + 8), magnified
FACES = "media/style/ref_faces_board.jpg"   # 8 of her selfies (front / 3/4), for brows + overall proportions
ANCHOR = "media/style/anchor_eyes_light_hands.jpg"   # stylized eyes she approved: try7/v1_light_hands (shape, size, distance to brows)
P = ("Edit the first image. Change ONLY her upper eyelids (leave the eyebrows as they are), so her eyes look like the REAL eyes in the second image "
     "(close-up photos of her without glasses), in the stylized 3D style of the first image. The third image shows the stylized eye shape, size and "
     "distance to the brows she approved — match those proportions. Keep both eyes EXACTLY where they are: same position, size, spacing and distance "
     "from the centre of the face. Her double eyelid is natural: a soft crease runs above the lashes along the whole upper lid but NEVER touches the "
     "lash line at either end. Near the INNER corner the band of lid between the crease and the lashes is slightly WIDER and the crease there is "
     "lighter and fainter; toward the OUTER corner the band narrows a little (still never meeting the eye) and the lid skin itself is subtly darker, "
     "a faint natural shadow (no makeup). No monolid, no high sharp surgical line, no crease merging into the inner or outer corner. Slightly "
     "different on each eye. Keep the eyes very dark brown. Do not change anything else: eyebrows, face, expression, mouth, skin, hair, head angle, "
     "lighting, costume, framing and background. Same stylized 3D render style. No glasses. No text.")


def main():
    d = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--dir=")), "media/plates/face")
    stems = [a for a in sys.argv[1:] if not a.startswith("--")]
    KEEP = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--keep=")), "try3")
    os.makedirs(os.path.join(ROOT, d, KEEP), exist_ok=True)
    jobs = []
    for s in stems:
        src = next(os.path.join(d, s + e) for e in (".png", ".jpg") if os.path.exists(os.path.join(ROOT, d, s + e)))
        keep = os.path.join(d, KEEP, os.path.basename(src))
        shutil.copy(os.path.join(ROOT, src), os.path.join(ROOT, keep))
        jobs.append((s, keep, os.path.join(ROOT, src)))

    def run(j):
        s, keep, out = j
        inp = {"prompt": P, "aspect_ratio": "16:9", "image_size": "2K", "image_input": ["file:" + keep, "file:" + EYES, "file:" + ANCHOR]}
        try:
            r = cf.generate("google/nano-banana-pro", inp, os.path.splitext(out)[0] + ".jpg", tag=f"eyelid_{s}")
            for p in r:                                   # the model's format may differ from the source's; keep one file per stem
                if os.path.abspath(p) != os.path.abspath(out) and os.path.exists(out): os.remove(out)
            return s, "ok " + ", ".join(os.path.relpath(p, ROOT) for p in r)
        except Exception as e: return s, f"ERR {e}"
    with ThreadPoolExecutor(2) as ex:
        for s, r in ex.map(run, jobs): print(s, str(r)[:200])


if __name__ == "__main__":
    main()
