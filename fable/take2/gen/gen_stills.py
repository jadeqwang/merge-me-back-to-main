#!/usr/bin/env python3
"""Stills for take two (Nano Banana Pro through tools/gen/cf.py: spend cap + ledger). Run with the moongazing venv python:
   $PY fable/take2/gen/gen_stills.py ID [ID ...] [--n=1] [--tag=a] [--dry]
Specs: fable/take2/gen/stills.json. Writes work_fable/take2/stills/<id>_<tag><k>.jpg.
A spec has: prompt parts (style, scene), lane, view (front|back|side|none), refs (image inputs; default the character sheet),
and optional "raw": true (the prompt is used as written, for edits)."""
import json, os, sys
from concurrent.futures import ThreadPoolExecutor
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, "..", "..", ".."))
sys.path.insert(0, os.path.join(ROOT, "tools", "gen")); import cf
SPEC = {p["id"]: p for p in json.load(open(os.path.join(HERE, "stills.json")))["stills"]}
SHEET = "inputs/character_sheet.png"
FACE = ("Her face is the face of the reference sheet and is the same in every picture, whatever the medium: an oval face with a tall clear forehead, hair parted in the centre with no fringe, "
        "large very dark brown eyes with a clear double eyelid, soft straight brows, a small straight nose, natural closed lips, no makeup. The medium changes how the lines and tones are made, never her features. "
        "Her expression is calm and hopeful, lips closed, never a wide advertising smile. ")
def char(p):
    lane = p.get("lane", "orange")
    s = ("She is the woman from the reference character sheet: long straight black hair to her waist with a centre parting and no fringe. " + FACE
         + f"She wears the outfit of the reference sheet: a white cropped bomber jacket with one {lane} band across the FRONT of the chest and one {lane} band around each upper arm. "
         "The BACK of the jacket is plain white with NO band and NO stripe across it: the only things on the back are a large pale-blue circle and, beneath it, the words RARE EARTH in small black capitals. "
         f"On her LEFT upper arm only, a round white patch with a black ring reading 1420 MHz; her right arm has no patch. A black cropped top under the open jacket; very wide navy cargo trousers with {lane} straps hanging from the belt; "
         f"chunky white trainers; {lane} headphones resting around her neck, not on her ears. ")
    if lane != "orange": s += f"The bands, straps and headphones are {lane}, not orange, and they are the only strong colour in the picture. "
    return s
VIEW = {
 "front": "She faces the viewer, so her LEFT arm, the one with the round 1420 MHz patch, is on the RIGHT side of the picture; the arm on the left side of the picture has no patch. ",
 "back": "She is seen from behind and faces toward the LEFT side of the picture, so the arm nearer the viewer is her left arm, the one with the round 1420 MHz patch; the back of her jacket with the pale-blue circle is clearly visible. ",
 "side": "She is seen exactly side-on and moves toward the LEFT side of the picture, so the viewer sees her left side and her left arm, the one with the round 1420 MHz patch. ",
 "none": ""}
TAIL = ("Wide 16:9 picture that fills the whole frame from edge to edge with no blank margin, bar or border. No caption, no signature, no watermark. "
        "The only lettering anywhere is RARE EARTH on the back of her jacket and 1420 MHz on the sleeve patch.")
def prompt(p):
    if p.get("raw"): return p["prompt"]
    return f"{p['style']} {p['scene']} {char(p)}{VIEW[p.get('view', 'front')]}{TAIL}"
def main():
    want = [a for a in sys.argv[1:] if not a.startswith("--")]
    n = int(next((a.split("=")[1] for a in sys.argv if a.startswith("--n=")), "1"))
    tag = next((a.split("=")[1] for a in sys.argv if a.startswith("--tag=")), "a")
    jobs = []
    for i in want:
        p = SPEC[i]
        for k in range(n):
            out = os.path.join(ROOT, "work_fable", "take2", "stills", f"{i}_{tag}{k+1}.jpg")
            if any(os.path.exists(out[:-4] + e) for e in (".jpg", ".png")): continue
            jobs.append((out, {"prompt": prompt(p), "aspect_ratio": "16:9", "image_size": "2K", "image_input": ["file:" + r for r in p.get("refs", [SHEET])]}, i))
    if "--dry" in sys.argv:
        for out, inp, i in jobs: print(i, len(inp["prompt"]), "chars", inp["image_input"], "\n ", inp["prompt"], "\n")
        return
    def run(j):
        out, inp, i = j
        try: return out, cf.generate("google/nano-banana-pro", inp, out, tag=f"t2_{i}")
        except Exception as e: return out, f"ERR {e}"
    with ThreadPoolExecutor(3) as ex:
        for out, r in ex.map(run, jobs): print(os.path.relpath(out, ROOT), "ok" if isinstance(r, list) else r, flush=True)
main()
