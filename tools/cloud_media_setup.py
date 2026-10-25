#!/usr/bin/env python3
"""Cloud session: map the box's source pack (review/cloud/, made by tools/cloud_pack.py) onto the media/ paths the tools expect.
No repo code changes. Everything lands in gitignored paths (media/, analysis_v2/stems/). Re-runnable; never overwrites a real file.
  python3 cloud_media_setup.py [REPO]            (REPO defaults to the current directory)
  refs/face_v4__<shot>.jpg  -> media/plates/face_v4/<shot>.png      (real PNG: batch.py looks for exactly this name; MIME follows the extension)
  refs/<a>__<b>.jpg         -> media/style/<a>/<b>.png|.jpg        (original extension; PNG originals re-encoded, .jpg originals symlinked)
  stills/<take>.jpg         -> media/gen/refs/<name>.jpg           (the exact first frame of the picked take, under the name batch.py would
                                                                    build it, so batch.py reuses it instead of regenerating it from a plate)
                            -> media/plates/<plate>                (non-face_v4 shots, only when absent: a 1600-px stand-in for fix_patch/edits)
  takes/<take>.mp4          -> media/gen/<take>.mp4                (symlink; the box's collect layout)
  audio/Merge_vocals_320k.mp3 -> analysis_v2/stems/vocals.wav      (ffmpeg decode, gapless: 282.516 s, same as the song)"""
import importlib.util, os, shutil, subprocess, sys
from PIL import Image
REPO = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else ".")
PACK = os.path.join(REPO, "review", "cloud")
KEEP_JPG = {"r7/bun_nbp", "canon_v4/canon_face_crop", "canon_v4/canon_eyes_crop"}   # these were .jpg on the box (tools/cloud_pack.py)
J = lambda *p: os.path.join(REPO, *p)
done = {"ref": 0, "face_v4": 0, "still": 0, "standin": 0, "take": 0}


def place(src, dst, kind):
    if os.path.lexists(dst):
        return
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if dst.endswith(".png"):
        Image.open(src).convert("RGB").save(dst)
    else:
        os.symlink(os.path.abspath(src), dst)
    done[kind] += 1


for d in ("media/gen/refs", "media/gen/specs", "media/plates/face_v4", "analysis_v2/stems"):
    os.makedirs(J(d), exist_ok=True)
for f in sorted(os.listdir(os.path.join(PACK, "refs"))):
    stem = f[:-4]; parts = stem.split("__")
    if parts[0] == "face_v4":
        place(os.path.join(PACK, "refs", f), J("media/plates/face_v4", parts[1] + ".png"), "face_v4")
    else:
        rel = "/".join(parts)
        place(os.path.join(PACK, "refs", f), J("media/style", rel + (".jpg" if rel in KEEP_JPG else ".png")), "ref")
spec = importlib.util.spec_from_file_location("batch", J("tools/sd/batch.py")); batch = importlib.util.module_from_spec(spec)
spec.loader.exec_module(batch)                                     # main() only runs under __main__
for f in sorted(os.listdir(os.path.join(PACK, "stills"))):
    if os.path.isdir(os.path.join(PACK, "stills", f)): continue   # stills/drop/ = plates, below
    take = f[:-4]; shot = take.rsplit("_", 1)[0].rsplit("_t", 1)[0]
    s = batch.SHOTS.get(shot)
    if not s:
        print("no shot entry for", take); continue
    stem = os.path.splitext(s["plate"])[0]
    plate = s["plate"] if s["plate"].startswith("media/") else f"media/plates/{s['plate']}"
    if os.path.exists(J(f"media/plates/face_v4/{shot}.png")): ref = f"{shot}_v4.jpg"           # same order as batch.py main()
    elif os.path.exists(J(f"media/plates/fix/{stem}.jpg")): ref = f"{stem}_fix.jpg"
    else: ref = os.path.basename(stem) + ".jpg"
    src = os.path.join(PACK, "stills", f)
    place(src, J("media/gen/refs", ref), "still")
    if not ref.endswith("_v4.jpg") and "/face_v4/" not in plate and not os.path.exists(J(plate)):
        place(src, J(plate), "standin")   # pre-v4 / outro / post-credits plates only; face_v4 shots use media/plates/face_v4/<shot>.png
for f in sorted(os.listdir(os.path.join(PACK, "takes"))):
    place(os.path.join(PACK, "takes", f), J("media/gen", f), "take")
drop = os.path.join(PACK, "stills", "drop")                       # the drop plates (box: media/plates/drop/<id>.png)
for f in sorted(os.listdir(drop)) if os.path.isdir(drop) else []:
    place(os.path.join(drop, f), J("media/plates/drop", f[:-4] + ".png"), "standin")
ff = os.environ.get("FFMPEG") or shutil.which("ffmpeg")
for stem in ("vocals", "instrumental"):                              # gapless decode: 282.516 s = the song
    wav = J(f"analysis_v2/stems/{stem}.wav")
    if not os.path.exists(wav):
        subprocess.run([ff, "-v", "error", "-y", "-i", os.path.join(PACK, f"audio/Merge_{stem}_320k.mp3"), "-c:a", "pcm_s24le", wav], check=True)
print("placed:", done)
for p in ("media/x", "analysis_v2/stems/vocals.wav", "analysis_v2/stems/instrumental.wav"):
    r = subprocess.run(["git", "-C", REPO, "check-ignore", "-q", p])
    print(f"{p}: {'gitignored OK' if r.returncode == 0 else 'NOT IGNORED (or not a git repo) - do not commit it'}")
missing = [p for p in ("analysis_v2/stems/instrumental.wav", "media/style/r7/patch_34.png", "media/plates/drop/dr_jian.png") if not os.path.exists(J(p))]
print("still missing (ask the box):", missing)
