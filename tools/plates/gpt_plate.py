#!/usr/bin/env python3
"""Text+refs -> plate with GPT Image 2.5 (3:2, 1536x1024), N candidates, parallelism 2 (moongazing venv).
  $PY tools/plates/gpt_plate.py OUT_STEM PROMPT_FILE --refs=a,b,... [--n=2] [--tag=x] [--quality=high]
Writes OUT_STEM_<k>.png (reused if present). Crop to 16:9 afterwards (1536x864) for Seedance. Used for the drop wushu plates (media/plates/drop/)."""
import os, sys
from concurrent.futures import ThreadPoolExecutor
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "gen")); import cf
pos = [a for a in sys.argv[1:] if not a.startswith("--")]
opt = lambda k, d: next((a.split("=", 1)[1] for a in sys.argv if a.startswith(f"--{k}=")), d)
out, pfile = pos; prompt = open(pfile).read().strip()
refs = [r for r in opt("refs", "").split(",") if r]; N = int(opt("n", "2")); TAG = opt("tag", os.path.basename(out)); Q = opt("quality", "high")


def gen(k):
    o = f"{out}_{'abcdefgh'[k]}.png"
    if os.path.exists(o): return o
    inp = {"prompt": prompt, "size": "1536x1024", "quality": Q}
    if refs: inp["images"] = ["file:" + os.path.relpath(os.path.abspath(r), cf.ROOT) for r in refs]
    for attempt in range(3):
        try: return cf.generate("openai/gpt-image-2.5-sunburst", inp, os.path.relpath(o, cf.ROOT), tag=f"drop_{TAG}_{k}")[0]
        except Exception as e: print(f"ERR {k} attempt {attempt}: {str(e)[:300]}", file=sys.stderr)
    return None


with ThreadPoolExecutor(2) as ex:
    for r in ex.map(gen, range(N)): print(r)
