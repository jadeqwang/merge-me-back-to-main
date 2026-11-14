#!/usr/bin/env python3
"""Image edits for the proof plates (Nano Banana Pro, image in -> image out). Run with the moongazing venv python.
   gen_edits.py turn [ID ...]     refs/<id>.jpg + character sheet -> turns/<id>.jpg  (she has turned only her head to look back; the sheet's face)
   gen_edits.py fix ID "instruction" SRC OUT   one-off repair"""
import os, sys
from concurrent.futures import ThreadPoolExecutor
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "gen")); import cf
SHEET = "inputs/character_sheet.png"
FACE = ("an oval face with a tall clear forehead, hair parted in the centre with no fringe, large very dark brown eyes with a clear double eyelid, soft straight brows, "
        "a small straight nose, natural closed lips, no makeup")
CHILD = ("the same person as a small child: a round soft face, large very dark brown eyes, side-swept bangs, the top of her hair tied back in a small ponytail")
MEDIUM = {"piano": "gouache picture-book paint", "violin": "coloured pencil", "wushu": "woodblock print lines and flat colour", "wetlab": "fine pen and ink",
          "phd": "plotter pen lines", "poet": "sumi ink brush lines and wash", "ames": "airbrushed paint", "band": "two-colour risograph halftone",
          "chezjj": "pixel art", "sandstorm": "text-character art", "home": "wax crayon and chalk pastel", "violet": "white-line scratchboard engraving"}
def turn_prompt(i):
    face = CHILD if i == "piano" else FACE
    extra = {"violet": " Her hair stays exactly as in the first image: twisted up in a bun with the two yellow pencils crossed through it; her hair is NOT let down.",
             "home": " Her skin is the same light tone as on the character sheet and her face has the sheet's features exactly, only rendered in crayon; she is not a different, more realistic woman. The two children still have their backs to the viewer; their faces are never seen."}.get(i, "")
    return ("Edit the first image. Keep EVERYTHING exactly as it is: the same picture, framing, medium, colours, background, other people, her body, shoulders, arms, hands, clothes, "
            "and the back of her jacket with the pale-blue circle and the words RARE EARTH. Change only ONE thing: she has turned her head over her left shoulder to look back at the viewer. "
            "Only her head and neck move; her shoulders and body stay exactly where they are, her back still toward the viewer. "
            f"Her face is now seen in three-quarter view, drawn in {MEDIUM[i]} like the rest of the picture, and it is the face of the character in the second image (the character sheet): {face}. "
            "Her expression is calm: a quiet look of recognition, lips closed, the faintest smile." + (extra if extra else " Her hair falls naturally with the turn.") + " Add nothing else; no text, no border.")
def run(job):
    out, inp, tag = job
    try: return out, cf.generate("google/nano-banana-pro", inp, out, tag=tag)
    except Exception as e: return out, f"ERR {e}"
def main():
    mode = sys.argv[1]
    if mode == "fix":
        _, _, i, instr, src, out = sys.argv
        jobs = [(os.path.join(ROOT, out), {"prompt": "Edit the image. Keep everything else exactly the same. " + instr, "aspect_ratio": "16:9", "image_size": "2K", "image_input": ["file:" + src]}, f"proof_fix_{i}")]
    else:
        ids = sys.argv[2:] or list(MEDIUM)
        os.makedirs(os.path.join(ROOT, "work_fable/proof/turns"), exist_ok=True)
        jobs = [(os.path.join(ROOT, f"work_fable/proof/turns/{i}.jpg"), {"prompt": turn_prompt(i), "aspect_ratio": "16:9", "image_size": "2K",
                 "image_input": [f"file:work_fable/proof/refs/{i}.jpg", "file:" + SHEET]}, f"proof_turn_{i}") for i in ids
                if not any(os.path.exists(os.path.join(ROOT, f"work_fable/proof/turns/{i}{e}")) for e in (".jpg", ".png"))]
    with ThreadPoolExecutor(1 if mode == "fix" else 3) as ex:
        for out, r in ex.map(run, jobs): print(os.path.relpath(out, ROOT), "ok" if isinstance(r, list) else r, flush=True)
main()
