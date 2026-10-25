#!/usr/bin/env python3
"""Generate first-frame plates from docs/plates.json (list of {id, prompt, refs?, hair?: down|bun, ar?, extra_refs?}).
Skips plates that already exist unless --force. Run with the moongazing venv: $PY tools/plates/gen_plates.py [ID ...] [--force] [--n=2]
Each plate gets the STYLE line and the face/body canon refs; output media/plates/<id>[_k].jpg"""
import json, os, sys
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "gen")); import cf
ROOT = cf.ROOT
STYLE = ("High-end real-time 3D render with the fidelity of a AAA game cinematic or a virtual K-pop idol music video made in Unreal Engine 5: "
 "stylized 3D character, strand-rendered hair, soft subsurface skin, physically based fabric, ray-traced global illumination, filmic.")
FACE = ("The woman is the character from the reference images: large expressive very dark brown, almost black eyes with a distinct double-eyelid crease, "
 "a slightly taller upper head with a tall broad forehead, long straight black hair with a centre parting, a soft heart-shaped face, natural lips, no makeup, "
 "adult woman about thirty.")
COST = ("Costume as the reference turnaround: white cropped racer jacket with ONE orange band across the chest and one around each upper arm, white cuffs and hem, "
 "only ONE small pale-blue dot on the left chest, on her LEFT upper arm a round white embroidered patch with a thin black ring, printed with the bold black text '1420 MHz' on two lines, exactly as in the enlarged patch inset of the turnaround reference; black high-neck crop top; navy wide cargo pants with "
 "orange straps; chunky white sneakers; orange headphones around the neck.")
REFS = {"down": ["media/style/r6/canon_face_front.png", "media/style/r6/canon_face_34.png", "media/style/r7/turn_gpt_patch.png"],
        "bun": ["media/style/r6/canon_face_front.png", "media/style/r7/bun_nbp.jpg", "media/style/r7/turn_gpt_patch.png"],
        "none": []}
def main():
    specs = json.load(open(os.path.join(ROOT, "docs", "plates.json")))
    want = [a for a in sys.argv[1:] if not a.startswith("--")]
    force = "--force" in sys.argv
    n = int(next((a.split("=")[1] for a in sys.argv if a.startswith("--n=")), "1"))
    jobs = []
    for s in specs:
        if want and s["id"] not in want: continue
        for k in range(n):
            out = os.path.join(ROOT, "media", "plates", f"{s['id']}{'' if n == 1 else '_' + 'abcdefgh'[k]}.jpg")
            if os.path.exists(out) and not force: continue
            hair = s.get("hair", "down")
            people = hair != "none"
            tail = s.get("tail", "No text, no letters, no logos.")
            if people:   # the sleeve patch is the one sanctioned lettering; a blanket "no text" turns it into a black dot or gibberish
                tail = tail.replace("No text, no letters, no logos.", "No other text, letters or logos.").replace("No text.", "No other text.")
                tail += ' The only lettering anywhere on her is "1420 MHz" on the round white sleeve patch (and RARE EARTH on her jacket back when her back is visible).'
            p = f"{STYLE} {s['prompt']}" + (f" {FACE} {COST}" if people and not s.get("no_canon_text") else "") + " " + tail
            if hair == "bun": p = p.replace("long straight black hair with a centre parting", "black hair twisted up into a loose bun with two yellow pencils crossing through it in an X, eraser caps up (one pale blue, one pink), centre parting")
            refs = REFS[hair] + s.get("extra_refs", [])
            inp = {"prompt": p, "aspect_ratio": s.get("ar", "16:9"), "image_size": "2K"}
            if refs: inp["image_input"] = ["file:" + r for r in refs[:3]]
            jobs.append((out, inp, s["id"]))
    def run(j):
        out, inp, i = j
        try: return out, cf.generate("google/nano-banana-pro", inp, out, tag=f"plate_{i}")
        except Exception as e: return out, f"ERR {e}"
    with ThreadPoolExecutor(3) as ex:
        for out, r in ex.map(run, jobs): print(os.path.relpath(out, ROOT), "ok" if isinstance(r, list) else r)
main()
