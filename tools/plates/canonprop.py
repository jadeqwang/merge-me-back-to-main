#!/usr/bin/env python3
"""Propagate the locked canon face (docs/canon_face_v4.md) onto a shot still with GPT Image 2.5 (OS-venv: mediapipe/cv2; the API call runs in
the moongazing venv). Two modes:
  rect : edit a fixed 3:2 window (--box=x0,y0,H in source pixels; head + all of the hair) and paste the whole window back with a feathered
         edge after a border colour match. Used for hair + identity in one go.
  face : faceedit.py-style tight 3:2 window around the face (--pad x face height), paste back only the (dilated) face oval.
  $OSPY tools/plates/canonprop.py SRC OUT_STEM PROMPT_FILE --mode=rect|face [--box=..] [--pad=2.0] [--refs=a,b] [--n=3] [--rot180] [--tag=x]
Writes OUT_STEM_crop.png, OUT_STEM_<k>_raw.png (model output, reused if present) and OUT_STEM_<k>.png (full frame, same size as SRC)."""
import json, os, subprocess, sys, cv2, numpy as np, mediapipe as mp
from concurrent.futures import ThreadPoolExecutor
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GPY = "/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python"
if not os.path.exists(GPY): GPY = os.environ.get("GEN_PY", sys.executable)   # cloud: a py3.12 venv with mediapipe 0.10.21 + numpy<2
pos = [a for a in sys.argv[1:] if not a.startswith("--")]
opt = lambda k, d: next((a.split("=", 1)[1] for a in sys.argv if a.startswith(f"--{k}=")), d)
src, out, pfile = pos; prompt = open(pfile).read().strip()
MODE, N, PAD, TAG = opt("mode", "face"), int(opt("n", "3")), float(opt("pad", "2.0")), opt("tag", os.path.basename(out))
refs = [r for r in opt("refs", "").split(",") if r]; ROT = "--rot180" in sys.argv
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, min_detection_confidence=.2)
fd = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=.2)


def mesh(im):
    h, w = im.shape[:2]; r = fm.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
    if r.multi_face_landmarks: return np.array([[q.x * w, q.y * h] for q in r.multi_face_landmarks[0].landmark])
    d = fd.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
    if not d.detections: return None
    b = d.detections[0].location_data.relative_bounding_box
    cx, cy, sz = (b.xmin + b.width / 2) * w, (b.ymin + b.height / 2) * h, max(b.width * w, b.height * h) * 1.8
    x0, y0 = int(max(0, cx - sz / 2)), int(max(0, cy - sz / 2)); c = im[y0:int(min(h, cy + sz / 2)), x0:int(min(w, cx + sz / 2))]
    k = 768 / max(c.shape[:2]); c2 = cv2.resize(c, None, fx=k, fy=k, interpolation=cv2.INTER_CUBIC)
    r = fm.process(cv2.cvtColor(c2, cv2.COLOR_BGR2RGB))
    if not r.multi_face_landmarks: return None
    return np.array([[x0 + q.x * c2.shape[1] / k, y0 + q.y * c2.shape[0] / k] for q in r.multi_face_landmarks[0].landmark])


im0 = cv2.imread(src); im = cv2.rotate(im0, cv2.ROTATE_180) if ROT else im0; h, w = im.shape[:2]
if MODE == "rect":
    x0, y0, ch = map(int, opt("box", "").split(",")); cw = int(round(ch * 1.5))
else:
    L = mesh(im); cx, cy = L.mean(0); fh = np.ptp(L[:, 1])
    ch = int(min(h, fh * PAD)); cw = int(ch * 1.5)
    x0 = int(np.clip(cx - cw / 2, 0, w - cw)); y0 = int(np.clip(cy - ch / 2 + float(opt("dy", "0")) * fh, 0, h - ch))
assert 0 <= x0 and 0 <= y0 and x0 + cw <= w and y0 + ch <= h, (x0, y0, cw, ch, w, h)
win = im[y0:y0 + ch, x0:x0 + cw]
crop = cv2.resize(win, (1536, 1024), interpolation=cv2.INTER_LANCZOS4 if ch < 1024 else cv2.INTER_AREA)
cv2.imwrite(out + "_crop.png", crop)
print(f"window x0={x0} y0={y0} {cw}x{ch}")

code = ("import sys, json; sys.path.insert(0, 'tools/gen'); import cf; a = json.loads(sys.argv[1]); "
        "print(json.dumps(cf.generate('openai/gpt-image-2.5-sunburst', {'prompt': a['p'], 'images': ['file:' + x for x in a['i']], 'size': '1536x1024', "
        "'quality': 'high'}, a['o'], tag='canonv4_' + a['t'])))")


def gen(k):
    o = f"{out}_{'abcdefgh'[k]}_raw.png"
    if os.path.exists(o): return o
    arg = json.dumps({"p": prompt, "i": [os.path.abspath(out + "_crop.png")] + [os.path.abspath(x) for x in refs], "o": os.path.relpath(o, ROOT),
                      "t": f"{TAG}_{k}"})
    for attempt in range(3):
        r = subprocess.run([GPY, "-c", code, arg], cwd=ROOT, capture_output=True, text=True)
        if r.returncode == 0:
            got = os.path.join(ROOT, json.loads(r.stdout.strip().splitlines()[-1])[0])
            if got != os.path.abspath(o): cv2.imwrite(o, cv2.imread(got))
            return o
        print(f"ERR {k} attempt {attempt}: {r.stderr.strip()[-300:]}", file=sys.stderr)
    return None


with ThreadPoolExecutor(3) as ex: raws = list(ex.map(gen, range(N)))

# paste mask
if MODE == "rect":
    m = np.ones((ch, cw), np.float32); f = int(ch * .06)
    ramp = np.linspace(0, 1, f, dtype=np.float32)
    if y0 > 0: m[:f] *= ramp[:, None]
    if y0 + ch < h: m[-f:] *= ramp[::-1, None]
    if x0 > 0: m[:, :f] *= ramp[None]
    if x0 + cw < w: m[:, -f:] *= ramp[None, ::-1]
    band = m < .999
else:
    rc = mesh(win); m = np.zeros((ch, cw), np.float32)
    if rc is not None:
        cv2.fillPoly(m, [cv2.convexHull(rc.astype(np.int32))], 1.); m = cv2.dilate(m, np.ones((int(ch * .06) | 1,) * 2, np.uint8))
    else: m[int(ch * .15):int(ch * .85), int(cw * .25):int(cw * .75)] = 1
    m = cv2.GaussianBlur(m, (0, 0), sigmaX=ch * .02); band = None
for o in raws:
    if not o: continue
    ed = cv2.resize(cv2.imread(o), (cw, ch), interpolation=cv2.INTER_AREA).astype(np.float32)
    if band is not None:      # match the model's global colour drift to the plate on the feather band
        ed += (win[band].astype(np.float32).mean(0) - ed[band].mean(0))[None, None]
    full = im.copy().astype(np.float32)
    full[y0:y0 + ch, x0:x0 + cw] = ed * m[..., None] + full[y0:y0 + ch, x0:x0 + cw] * (1 - m[..., None])
    full = np.clip(full, 0, 255).astype(np.uint8)
    if ROT: full = cv2.rotate(full, cv2.ROTATE_180)
    fo = o.replace("_raw.png", ".png"); cv2.imwrite(fo, full); print(fo)
