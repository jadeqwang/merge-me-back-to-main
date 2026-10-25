#!/usr/bin/env python3
"""Likeness pass: redraw only the face on existing plates from Jade's own photo (she OK'd her real photos as model input; never the kids').
  $PY tools/plates/likeness.py NAME[.jpg|.png] ... [--force]
Source = media/plates/fix/<stem>.jpg if a costume-repaired still exists, else media/plates/<name>. Writes media/plates/face/<stem>.jpg;
tools/sd/batch.py prefers face/ over fix/ over the original."""
import os, sys
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "gen")); import cf
ROOT = cf.ROOT
SELFIE = "media/style/selfie_face.jpg"     # crop of inputs/selfie_hairdown_jade_jacket_retouch_v2.png
FACE = ("Edit the first image. Redraw ONLY the woman's face so she is unmistakably the same person as in the second image (a real photo of her): "
        "the same face shape and proportions, tall broad forehead and hairline with a centre parting, the shape of her eyebrows, her eye shape with "
        "the distinct double-eyelid crease and very dark brown eyes, her nose, lips and jaw. Keep exactly the same stylized high-end 3D render style "
        "as the first image (AAA game cinematic, virtual idol made in Unreal Engine 5), not photographic, no extra skin texture. No glasses. "
        "Her eyes are LARGER than typical: keep them as large and expressive as in the first image, very dark brown, with the clear double-eyelid crease. "
        "Keep her exact expression and warmth from the first image (the same soft smile or open singing mouth), her head angle, hair, lighting, "
        "costume and patch, framing and background.")


def main():
    names = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv
    os.makedirs(os.path.join(ROOT, "media", "plates", "face"), exist_ok=True)
    jobs = []
    for n in names:
        stem = os.path.splitext(n)[0]
        fixed = os.path.join("media", "plates", "fix", stem + ".jpg")
        src = fixed if os.path.isfile(os.path.join(ROOT, fixed)) else next(
            os.path.join("media", "plates", n + e) for e in ("", ".jpg", ".png") if os.path.isfile(os.path.join(ROOT, "media", "plates", n + e)))
        out = os.path.join(ROOT, "media", "plates", "face", stem + ".jpg")       # saved as .png (model output format)
        if (os.path.exists(out) or os.path.exists(out[:-4] + ".png")) and not force: continue
        inp = {"prompt": FACE, "aspect_ratio": "16:9", "image_size": "2K", "image_input": ["file:" + src, "file:" + SELFIE]}
        jobs.append((out, inp, stem))

    def run(j):
        out, inp, stem = j
        try: return out, cf.generate("google/nano-banana-pro", inp, out, tag=f"face_{stem}")
        except Exception as e: return out, f"ERR {e}"
    with ThreadPoolExecutor(2) as ex:
        for out, r in ex.map(run, jobs): print(os.path.relpath(out, ROOT), "ok" if isinstance(r, list) else str(r)[:300])


main()
