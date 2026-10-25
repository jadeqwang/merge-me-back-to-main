#!/usr/bin/env python3
"""Intake for collected Seedance takes: prep (depth/matte) + frame strip + lip-sync metrics for singing shots.
  .venv/bin/python tools/sd/intake.py [--loop]      (idempotent; --loop re-scans every 60 s until no jobs are pending)
Outputs: work/plates/<tag>_<id>/ (prep), work/takes/<tag>_<id>_strip.jpg, work/takes/<tag>_<id>.sync.json, _ws.jpg"""
import glob, json, os, subprocess, sys, time
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VPY = os.path.join(ROOT, ".venv/bin/python")
OSPY = "/home/jade/Documents/1-music-shipped/orbital-sunrise-video/video/out/.venv/bin/python"
GPY = "/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python"
FF = "/home/jade/Documents/1-music-shipped/moongazing/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
WORDS = {v: [(w["w"], w["start"], w["end"]) for l in json.load(open(os.path.join(ROOT, d, "timing.json")))["lyrics"]["lines"] for w in l["words"]]
         for v, d in (("v1", "analysis"), ("v2", "analysis_v2"))}       # a take's words come from the song it was made against (notes.timing)
os.makedirs(os.path.join(ROOT, "work/takes"), exist_ok=True)


def spec_for(mp4):
    base = os.path.basename(mp4)[:-4]           # <tag>_<id10>
    tag = base.rsplit("_", 1)[0]
    p = os.path.join(ROOT, "media/gen/specs", tag + ".json")
    return base, tag, (json.load(open(p)) if os.path.exists(p) else None)


def one(mp4):
    base, tag, spec = spec_for(mp4)
    out = os.path.join(ROOT, "work/plates", base)
    if not os.path.exists(os.path.join(out, "meta.json")):
        subprocess.run([VPY, "tools/prep/prep.py", mp4, out, "--w=1280", "--fps=24"], cwd=ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    strip = os.path.join(ROOT, "work/takes", base + "_strip.jpg")
    if not os.path.exists(strip):
        subprocess.run([FF, "-v", "error", "-y", "-i", mp4, "-vf", "fps=1,scale=320:-2,tile=10x1", "-frames:v", "1", strip])
    notes = json.loads(spec.get("notes") or "{}") if spec else {}
    s0 = notes.get("s0"); tv = notes.get("timing", "v1"); env = dict(os.environ, MERGE_TIMING=tv)
    if s0 is None or "reference_audios" not in (spec or {}).get("input", {}) or "INST" in (spec.get("notes") or ""):
        return base, None
    if "instrumental" in json.dumps(spec["input"].get("reference_audios", "")):
        return base, None
    sj = os.path.join(ROOT, "work/takes", base + ".sync.json")
    dur = spec["input"].get("duration", 6)
    if not os.path.exists(sj):
        r = subprocess.run([OSPY, "tools/sync/lipsync.py", mp4, str(s0), f"--win={s0 + .2},{s0 + dur - .1}"], cwd=ROOT, env=env, capture_output=True, text=True)
        line = [l for l in r.stdout.splitlines() if l.startswith("{")]
        if line: open(sj, "w").write(line[-1])
    lj = os.path.join(ROOT, "work/takes", base + ".labial.json")
    if not os.path.exists(lj):
        subprocess.run([OSPY, "tools/sync/labial.py", mp4, str(s0)], cwd=ROOT, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    ws = os.path.join(ROOT, "work/takes", base + "_ws.jpg")
    if not os.path.exists(ws):
        ev = [(w, a) for (w, a, b) in WORDS[tv] if s0 + .1 <= a <= s0 + dur - .3][:12]
        if ev:
            evs = ",".join(f"{w}@{a:.2f}" for w, a in ev)
            subprocess.run([OSPY, "tools/sync/pb_wordstrip.py", mp4, str(s0), "-0.25,-0.12,0,0.12,0.25,0.4", ws, evs], cwd=ROOT,
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return base, json.load(open(sj)) if os.path.exists(sj) else None


def scan():
    res = {}
    for mp4 in sorted(glob.glob(os.path.join(ROOT, "media/gen/*.mp4"))):
        if "ch1_main_a" in mp4: continue
        b, s = one(mp4)
        res[b] = s and {"lag": s.get("best_lag_s"), "corr": s.get("corr"), "face_h": s.get("face_h_ratio_min_max")}
    json.dump(res, open(os.path.join(ROOT, "work/takes/summary.json"), "w"), indent=1)
    return res


if __name__ == "__main__":
    while True:
        r = scan()
        print(time.strftime("%H:%M:%S"), len(r), "takes processed", flush=True)
        if "--loop" not in sys.argv: break
        st = subprocess.run([GPY, "tools/gen/gen.py", "status"], cwd=ROOT, capture_output=True, text=True).stdout
        if not any(w in st for w in ("queued", "running", "ready")):
            scan(); break
        time.sleep(60)
