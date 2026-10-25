#!/usr/bin/env python3
"""Pack source files for a Claude Code cloud session into review/cloud/ (the repo is PUBLIC: nothing showing Jade's kids; stills as JPG q90;
every file < ~30 MB; never the Cloudflare ids).
  .venv/bin/python tools/cloud_pack.py
Needs work/edl_v4.json, the show's edit list:
  node engine/render.mjs --q "show=/engine/show/main.js&dumpedl=1" --stills 1:/tmp/x.png --res 320x180 | grep -o "\\[edl\\] .*" | cut -c7- > work/edl_v4.json
Writes review/cloud/{manifest.md, picks/, sync/, stills/, refs/, takes/, audio/}."""
import json, os, shutil, subprocess
from PIL import Image
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "review/cloud")
FF = "/home/jade/Documents/1-music-shipped/moongazing/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
NO_KIDS = ("lf_home_mint",)                        # the home branch shows her kids (from behind): never in the public repo
TIMES = [("0:32", 32), ("0:44", 44), ("1:07", 67), ("1:11", 71), ("1:24", 84), ("1:46", 106), ("1:58", 118), ("3:07", 187), ("3:09", 189),
         ("3:30", 210), ("3:33", 213), ("3:42", 222), ("3:43 fold", 223.5), ("3:54", 234), ("3:58 orchestra", 238), ("4:05 orchestra close", 245), ("4:12", 252), ("4:16-4:17", 256.5),
         ("post-credits", 285), ("post-credits", 292)]
V4 = ("face_v4/", "plates/drop/", "out_orch", "pc_kneel", "pc_beam")   # plates made from the locked canon face v4

edl = json.load(open(os.path.join(ROOT, "work/edl_v4.json")))
picks = json.load(open(os.path.join(ROOT, "work/picks.json")))
take2shot = {v["take"]: k for k, v in picks.items()}
for d in ("picks", "sync", "stills", "refs", "takes", "audio"):
    os.makedirs(os.path.join(OUT, d), exist_ok=True)


def spec(take):
    p = os.path.join(ROOT, "media/gen/specs", take.rsplit("_", 1)[0] + ".json")
    return json.load(open(p)) if os.path.exists(p) else {}


def jpg(src, dst, maxw=1920):
    im = Image.open(src).convert("RGB")
    if im.width > maxw: im = im.resize((maxw, round(im.height * maxw / im.width)), Image.LANCZOS)
    im.save(dst, quality=90); return os.path.relpath(dst, OUT)


def still_for(take):
    """the first frame sent to Seedance (media/gen/refs/*.jpg in the spec) and the plate it came from"""
    sp = spec(take); notes = json.loads(sp.get("notes") or "{}")
    ref = (sp.get("input", {}).get("image") or "").replace("file:", "")
    return notes, (os.path.join(ROOT, ref) if ref and not os.path.isabs(ref) else ref)


rows, copied = [], set()
def add_take(label, t, shot_entry, plate, s0, role):
    take = plate.rsplit("/", 1)[-1]
    shot = take2shot.get(take, take.rsplit("_t", 1)[0])
    if any(k in take for k in NO_KIDS):
        rows.append((label, t, shot, take, "(omitted: shows her kids)", "", "", "", role)); return
    if take.startswith("still_"):
        rows.append((label, t, shot, take, "still fallback (no take)", s0, "", "?", role)); return
    notes, ref = still_for(take)
    pl = notes.get("plate") or ""
    face = "face_v4" if any(k in pl for k in V4) else "pre-v4 (older face)"
    lag = picks.get(shot, {}).get("lag", "") if picks.get(shot, {}).get("take") == take else ""
    sp = ""
    if ref and os.path.exists(ref):
        dst = os.path.join(OUT, "stills", take + ".jpg")
        if take not in copied: jpg(ref, dst)
        sp = os.path.relpath(dst, OUT)
    copied.add(take)
    rows.append((label, t, shot, take, f"{sp}  (plate: {pl})", s0, lag, face, role))
    return take


singing, keep_mp4 = set(), set()
for label, t in TIMES:
    hit = [x for x in edl if x["t0"] <= t < x["t1"]]
    for x in hit:
        if x.get("plate"):
            tk = add_take(label, t, x, x["plate"], x.get("s0"), x["kind"] + (f"/{x['look']}" if x.get("look") else ""))
            if tk: keep_mp4.add(tk)
        if x.get("back"):
            add_take(label, t, x, x["back"], None, "panels: full-frame back")
        for p, s0 in x.get("panels") or []:
            add_take(label, t, x, p, s0, "panels: pane")
        if x["kind"] == "card":
            rows.append((label, t, "(card)", "-", "git log / end card: drawn by the engine, no plate", "", "", "", "card"))
        if x["kind"] == "dronetree":
            rows.append((label, t, "(dronetree)", "-", "drone tree: procedural, no plate", "", "", "", "dronetree"))

# singing takes = picks with a vocal sync file
for shot, v in picks.items():
    tk = v.get("take", "")
    if os.path.exists(os.path.join(ROOT, "work/takes", tk + ".sync.json")) and v.get("timing") == "v2" and "orch" not in tk:
        singing.add(tk)
shutil.copy(os.path.join(ROOT, "work/picks.json"), os.path.join(OUT, "picks/picks.json"))
for f in ("docs/picks_manual.json", "docs/lags.json"):
    shutil.copy(os.path.join(ROOT, f), os.path.join(OUT, "picks", os.path.basename(f)))
for tk in sorted(singing):
    for ext in (".sync.json", ".labial.json"):
        p = os.path.join(ROOT, "work/takes", tk + ext)
        if os.path.exists(p): shutil.copy(p, os.path.join(OUT, "sync", tk + ext))
# picked raw takes: singing + orchestra + post-credits (and whatever the listed times use), each < 30 MB
for tk in sorted(singing | {k for k in keep_mp4 if k.startswith(("out_orch", "pc_"))} | keep_mp4):
    if any(k in tk for k in NO_KIDS): continue
    src = os.path.join(ROOT, "media/gen", tk + ".mp4")
    if os.path.exists(src) and os.path.getsize(src) < 30e6: shutil.copy(src, os.path.join(OUT, "takes", tk + ".mp4"))
# refs the generation tools use
for r in ("media/style/r6/canon_face_front.png", "media/style/r6/canon_face_34.png", "media/style/r7/turn_gpt_patch.png", "media/style/r7/bun_nbp.jpg",
          "media/style/canon_v4/canon_face.png", "media/style/canon_v4/canon_face_crop.jpg", "media/style/canon_v4/canon_eyes_crop.jpg",
          "media/style/canon_v4/violet_test/violet_ref.png", "media/style/r7/patch_34.png"):
    p = os.path.join(ROOT, r)
    if os.path.exists(p): jpg(p, os.path.join(OUT, "refs", os.path.splitext(r.replace("media/style/", "").replace("/", "__"))[0] + ".jpg"))
for f in sorted(os.listdir(os.path.join(ROOT, "media/plates/face_v4"))):
    if f.endswith(".png"): jpg(os.path.join(ROOT, "media/plates/face_v4", f), os.path.join(OUT, "refs", "face_v4__" + f[:-4] + ".jpg"))
# the wushu drop start plates (finals + a/b candidates; not cand/ or prompts/)
os.makedirs(os.path.join(OUT, "stills/drop"), exist_ok=True)
for f in sorted(os.listdir(os.path.join(ROOT, "media/plates/drop"))):
    if f.endswith(".png"): jpg(os.path.join(ROOT, "media/plates/drop", f), os.path.join(OUT, "stills/drop", f[:-4] + ".jpg"))
# audio (Jade OK'd both public, 2026-10-24)
for src, dst in (("inputs/Merge.wav", "Merge_320k.mp3"), ("analysis_v2/stems/vocals.wav", "Merge_vocals_320k.mp3"),
                 ("analysis_v2/stems/instrumental.wav", "Merge_instrumental_320k.mp3")):
    subprocess.run([FF, "-v", "error", "-y", "-i", os.path.join(ROOT, src), "-c:a", "libmp3lame", "-b:a", "320k", os.path.join(OUT, "audio", dst)], check=True)

with open(os.path.join(OUT, "manifest.md"), "w") as f:
    f.write("# review/cloud manifest (v4, 2026-10-24)\n\nFilm time = song time (v2, `analysis_v2/timing.json`); the film adds 14.5 s of post-credits after 282.516 s.\n"
            "S0 = song time of the take's frame 0 as used by the show (picks s0, already minus lag); lag: clip time = song time - S0_audio + lag.\n"
            "Still = the first frame sent to Seedance (`stills/`), with the plate it was made from. Face: face_v4 = the locked canon (docs/canon_face_v4.md).\n"
            "Shots showing Jade's kids are listed but never committed. Full edit list: `edl_v4.json`.\n\n"
            "| time | t (s) | shot | picked take | still (plate) | S0 | lag | face | role |\n|---|---|---|---|---|---|---|---|---|\n")
    for r in rows:
        f.write("| " + " | ".join(str(c) for c in r) + " |\n")
    f.write("\nNotes\n- 1:07 is the forktree bookend (`intro_up_t5`, Jade seen from above while the tree forks), a real take, NOT a still fallback; its face predates v4.\n"
            "- 1:46 is the breakdown panels: the full-frame back is `bd_float_t1` (pre-v4 face); the panes are her life clips (the home one omitted).\n"
            "- 4:16-4:17 is the git-log card (engine-drawn).\n- picks/: work/picks.json + docs/picks_manual.json + docs/lags.json. sync/: .sync.json/.labial.json of the picked singing takes.\n"
            "- refs/: canon v4 (canon_v4__*), older r6/r7 refs (incl. the patch ref r7__patch_34), and every face_v4 plate.\n"
            "- stills/drop/: the wushu drop start plates (dr_set, dr_duilian, dr_jian = finals; _a/_b = candidates).\n"
            "- audio/: the revised song, its vocal stem and its instrumental stem, 320k mp3 (Jade approved public).\n")
shutil.copy(os.path.join(ROOT, "work/edl_v4.json"), os.path.join(OUT, "edl_v4.json"))
tot = sum(os.path.getsize(os.path.join(dp, fn)) for dp, _, fns in os.walk(OUT) for fn in fns)
big = [(fn, os.path.getsize(os.path.join(dp, fn))) for dp, _, fns in os.walk(OUT) for fn in fns if os.path.getsize(os.path.join(dp, fn)) > 30e6]
print(f"review/cloud: {sum(len(f) for _, _, f in os.walk(OUT))} files, {tot / 1e6:.0f} MB; over 30 MB: {big}")
