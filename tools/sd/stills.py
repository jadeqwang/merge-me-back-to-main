#!/usr/bin/env python3
"""First frames and still edits for new / re-taken Seedance shots: the STILLS tables in tools/sd/shots_*.py -> prompt files + exact commands.
Nothing is generated or spent here; run the printed command on the box (it goes through tools/gen and the spend cap).
  python3 tools/sd/stills.py                 list the stills
  python3 tools/sd/stills.py ID [ID ...]     write media/plates/v5_prompts/ID.txt and print the command(s) for each
  python3 tools/sd/stills.py ID --pick=a     after a gpt candidate is chosen: centre-crop OUT_a.png (1536x1024) to 16:9 (1536x864) as OUT.png
STILLS entries: tool = gpt (tools/plates/gpt_plate.py, GPT Image 2.5; refs[0] is the image to edit for "Edit" prompts) | canonprop (canon face onto
a still, tools/plates/canonprop.py; fill in --box) | fix (one nano-banana-pro edit via tools/plates/fix_patch.py --prompt=) | patch (the sleeve-patch
edit of a picked gpt plate, a PNG: fix_patch.py --prompt= with every lane colour pinned, then saved back over the PNG). ~$0.21-0.25 per gpt
candidate, ~$0.13 per nano-banana edit."""
import glob, importlib.util, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PDIR = "media/plates/v5_prompts"
STILLS = {}
for f in sorted(glob.glob(os.path.join(ROOT, "tools/sd/shots_*.py"))):
    sp = importlib.util.spec_from_file_location(os.path.basename(f)[:-3], f); m = importlib.util.module_from_spec(sp); sp.loader.exec_module(m)
    for k, v in getattr(m, "STILLS", {}).items():
        assert k not in STILLS, f"duplicate still {k} in {f}"; STILLS[k] = dict(v, file=os.path.basename(f))


def cmds(k, s, pf):
    if s["tool"] == "gpt":
        return [f"$PY tools/plates/gpt_plate.py {s['out']} {pf} --refs={','.join(s['refs'])} --n=2",
                f"# pick a candidate ({s['out']}_a.png / _b.png), then: python3 tools/sd/stills.py {k} --pick=a   (-> {s['out']}.png, 16:9)"]
    if s["tool"] == "canonprop":
        return [f"mkdir -p {os.path.dirname(s['out'])} && $OSPY tools/plates/canonprop.py {s['src']} {s['out']} {pf} {s['args']} --refs={','.join(s['refs'])}",
                f"# check eyes: tools/plates/eyemetrics.py --check --size-ref=canon, facecrop.py --eyes; copy the pick to {s['to']}",
                f"rm -f media/gen/refs/{os.path.splitext(os.path.basename(s['to']))[0]}_v4.jpg   # no stale cached first frame"]
    if s["tool"] == "fix":
        return [f"cp {s['src']} {s['src'].replace('.jpg', '_v4.jpg')}   # keep the old still",
                f"cp {s['src']} media/plates/{s['name']}.jpg && $PY tools/plates/fix_patch.py {s['name']} --prompt={pf}",
                f"# check media/plates/fix/{s['name']}.jpg, then: cp media/plates/fix/{s['name']}.jpg {s['to']}", s.get("then", "")]
    if s["tool"] == "patch":   # fix_patch.py NAME reads media/plates/NAME(.png) and writes media/plates/fix/<basename>.jpg
        stem = os.path.splitext(s["src"])[0]; base = os.path.basename(stem); fixed = f"media/plates/fix/{base}.jpg"
        return [f"cp {s['src']} {stem}_nopatch.png   # keep the pick",
                f"$PY tools/plates/fix_patch.py {stem.replace('media/plates/', '', 1)} --prompt={pf}",
                f"# check {fixed}: the patch on every visible LEFT sleeve and every band colour unchanged (never orange on a branch); then:",
                f"python3 -c \"from PIL import Image; Image.open('{fixed}').convert('RGB').save('{s['src']}')\"   # a real PNG (cf.py types by extension)",
                f"rm -f media/gen/refs/{base}.jpg   # no stale cached first frame (batch.py reuses it)"]
    raise SystemExit(f"{k}: unknown tool {s['tool']}")


def main():
    ids = [a for a in sys.argv[1:] if not a.startswith("--")]
    pick = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--pick=")), None)
    if not ids:
        for k, s in STILLS.items(): print(f"{k:18s} {s['tool']:9s} {s['file']:16s} -> {s.get('to') or s.get('src') or s['out'] + '.png'}")
        return
    for k in ids:
        s = STILLS[k]
        if pick:
            from PIL import Image
            im = Image.open(os.path.join(ROOT, f"{s['out']}_{pick}.png")); w, h = im.size; ch = round(w * 9 / 16)
            im.crop((0, (h - ch) // 2, w, (h - ch) // 2 + ch)).save(os.path.join(ROOT, s["out"] + ".png")); print("wrote", s["out"] + ".png"); continue
        os.makedirs(os.path.join(ROOT, PDIR), exist_ok=True)
        pf = f"{PDIR}/{k}.txt"
        open(os.path.join(ROOT, pf), "w").write(s["prompt"] + "\n")
        print(f"# {k} ({s['file']})"); [print(c) for c in cmds(k, s, pf) if c]


if __name__ == "__main__":
    main()
