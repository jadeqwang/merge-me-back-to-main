#!/usr/bin/env python3
"""Still plates for the proof. Run with the moongazing venv python:
   $PY fable/proof/gen/gen_stills.py [ID ...] [--n=1] [--tag=a] [--dry]
Writes work_fable/proof/stills/<id>_<tag><k>.jpg. Uses tools/gen/cf.py (spend cap + ledger)."""
import json, os, sys
from concurrent.futures import ThreadPoolExecutor
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "gen")); import cf
SPEC = json.load(open(os.path.join(os.path.dirname(__file__), "lives_plates.json")))["plates"]
SHEET = "inputs/character_sheet.png"
FACE = ("Her face is the face of the reference sheet and is the same in every picture, whatever the medium: an oval face with a tall clear forehead, hair parted in the centre with no fringe, "
        "large very dark brown eyes with a clear double eyelid, soft straight brows, a small straight nose, natural closed lips, no makeup. The medium changes how the lines and tones are made, never her features. ")
CHILD_FACE = ("She is the same person as a small child: a round soft face, the same large very dark brown eyes. Her black hair is half up and half down: the top section tied back in a small ponytail at the crown, "
              "the rest loose to her shoulders, with side-swept bangs across her forehead. ")
def char(p):
    lane = p["lane"]; age = p["age"]
    who = {"adult": "She is the woman from the reference character sheet",
           "schoolgirl": "She is the woman from the reference character sheet as a girl of about twelve",
           "toddler": "She is the woman from the reference character sheet as a little girl not yet three",
           "child5": "She is the woman from the reference character sheet as a five-year-old"}[age]
    hair = ("black hair twisted up into a loose bun with two yellow pencils crossed through it" if p.get("hair") == "bun"
            else "long straight black hair to her waist with a centre parting and no fringe" if age in ("adult", "schoolgirl") else None)
    size = " in a small size that is a little too big for her" if age in ("toddler", "child5") else ""
    s = (f"{who}, drawn entirely in this picture's medium" + (f": {hair}" if hair else "") + ". "
         + (CHILD_FACE if age in ("toddler", "child5") else FACE)
         + f"She wears the outfit of the reference sheet{size}: a white cropped bomber jacket with one {lane} band across the FRONT of the chest and one {lane} band around each upper arm. "
         f"The BACK of the jacket is plain white with NO band and NO stripe across it: the only things on the back are a large pale-blue circle and, beneath it, the words RARE EARTH in small black capitals. "
         f"On her LEFT upper arm a round white patch with a black ring reading 1420 MHz; very wide navy cargo trousers with {lane} straps hanging from the belt; "
         f"chunky white trainers; {lane} headphones resting around her neck. ")
    if lane != "orange":
        s += f"The arm bands, straps and headphones are {lane}, not orange, and they are the strongest colour in the picture. "
    return s
COMP = ("Wide 16:9 picture. She faces toward the LEFT side of the picture, so the arm nearer the viewer is her left arm, the one that carries the round 1420 MHz patch; her right arm has no patch. She is large in the frame, right of centre, at least half the height of the picture, and the back of her jacket with the pale-blue circle is clearly visible. "
        "The picture fills the whole frame from edge to edge with no blank margin or bar; the bottom edge and the upper-left corner are simple, uncluttered areas. ")
COMP_FRONT = "Wide 16:9 picture. "
TAIL = ("The medium is applied to everything in the picture, her included, as if one artist made it by hand. No caption, no signature, no border, no watermark. "
        "The only lettering anywhere is RARE EARTH on the back of her jacket and 1420 MHz on the sleeve patch.")
def prompt(p):
    return f"{p['style']} {p['scene']} {char(p)}{COMP_FRONT if p.get('front') else COMP}{TAIL}"
def main():
    want = [a for a in sys.argv[1:] if not a.startswith("--")]
    n = int(next((a.split("=")[1] for a in sys.argv if a.startswith("--n=")), "1"))
    tag = next((a.split("=")[1] for a in sys.argv if a.startswith("--tag=")), "a")
    jobs = []
    for p in SPEC:
        if want and p["id"] not in want: continue
        for k in range(n):
            out = os.path.join(ROOT, "work_fable", "proof", "stills", f"{p['id']}_{tag}{k+1}.jpg")
            if any(os.path.exists(out[:-4] + e) for e in (".jpg", ".png")): continue
            jobs.append((out, {"prompt": prompt(p), "aspect_ratio": "16:9", "image_size": "2K", "image_input": ["file:" + SHEET]}, p["id"]))
    if "--dry" in sys.argv:
        for out, inp, i in jobs: print(i, len(inp["prompt"]), "chars\n ", inp["prompt"], "\n")
        return
    def run(j):
        out, inp, i = j
        try: return out, cf.generate("google/nano-banana-pro", inp, out, tag=f"proof_{i}")
        except Exception as e: return out, f"ERR {e}"
    with ThreadPoolExecutor(3) as ex:
        for out, r in ex.map(run, jobs): print(os.path.relpath(out, ROOT), "ok" if isinstance(r, list) else r, flush=True)
main()
