#!/usr/bin/env python3
"""Edit a face at full model resolution: crop a 3:2 window around the face, upscale to 1536x1024, optionally draw the crease guide, run a
GPT Image 2.5 edit, then downscale and feather-paste it back (face oval + margin) into the full plate. (OS-venv for mediapipe; the API call
runs in the moongazing venv.)
  $OSPY tools/plates/faceedit.py IN OUT PROMPT_FILE [--guide] [--inner=.42 --outer=.32] [--refs=a.jpg,b.png] [--n=2] [--pad=1.9]
Writes OUT_<k>.png for each candidate plus the crops (OUT_crop.png, OUT_guide.png)."""
import json, os, subprocess, sys, cv2, numpy as np, mediapipe as mp
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GPY = "/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python"
OSPY = sys.executable
pos = [a for a in sys.argv[1:] if not a.startswith("--")]
opt = lambda k, d: next((a.split("=", 1)[1] for a in sys.argv if a.startswith(f"--{k}=")), d)
src, out, pfile = pos; prompt = open(pfile).read().strip()
N, PAD = int(opt("n", "2")), float(opt("pad", "1.9")); refs = [r for r in opt("refs", "").split(",") if r]
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, min_detection_confidence=.2)
fd = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=.2)
im = cv2.imread(src); h, w = im.shape[:2]
r = fm.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
if r.multi_face_landmarks: L = np.array([[q.x * w, q.y * h] for q in r.multi_face_landmarks[0].landmark]); cx, cy = L.mean(0); fh = L[:, 1].ptp()
else:
    b = fd.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB)).detections[0].location_data.relative_bounding_box
    cx, cy, fh = (b.xmin + b.width / 2) * w, (b.ymin + b.height / 2) * h, b.height * h * 1.3
ch = int(min(h, fh * PAD)); cw = int(ch * 1.5); x0 = int(np.clip(cx - cw / 2, 0, w - cw)); y0 = int(np.clip(cy - ch / 2, 0, h - ch))
crop = cv2.resize(im[y0:y0 + ch, x0:x0 + cw], (1536, 1024), interpolation=cv2.INTER_LANCZOS4)
base = out + "_crop.png"; cv2.imwrite(base, crop)
if "--guide" in sys.argv:
    subprocess.run([OSPY, os.path.join(ROOT, "tools/plates/creaseguide.py"), base, out + "_guide.png", f"--inner={opt('inner', '.42')}", f"--outer={opt('outer', '.32')}"],
                   check=True, capture_output=True); base = out + "_guide.png"
if "--paste-only" in sys.argv:                  # just paste existing OUT_<k>_raw.png edits back (made outside this script)
    import glob as _g; procs_paint = True
elif "--paint" in sys.argv:                       # deterministic painted crease instead of a model edit
    # --bands=inner:outer,... in iris diameters (her photos: ~0.33 D)
    for k, bd in enumerate(opt("bands", ".40:.24,.50:.30").split(",")):
        bi, bo = bd.split(":"); o = f"{out}_p{bi}_raw.png"
        subprocess.run([OSPY, os.path.join(ROOT, "tools/plates/creaseguide.py"), out + "_crop.png", o, "--paint2" if "--paint2" in sys.argv else "--paint", f"--inner={bi}", f"--outer={bo}"],
                       check=True, capture_output=True)
    procs_paint = True
else: procs_paint = False
code = ("import sys, json; sys.path.insert(0, 'tools/gen'); import cf; a = json.loads(sys.argv[1]); "
        "print(json.dumps(cf.generate('openai/gpt-image-2.5-sunburst', {'prompt': a['p'], 'images': ['file:' + x for x in a['i']], 'size': '1536x1024', "
        "'quality': 'high'}, a['o'], tag='faceedit_' + a['t'])))")
procs = []
for k in ([] if procs_paint else range(N)):
    o = f"{out}_{'abcdefgh'[k]}_raw.png"
    arg = json.dumps({"p": prompt, "i": [os.path.abspath(base)] + [os.path.abspath(x) for x in refs], "o": os.path.relpath(o, ROOT), "t": f"{os.path.basename(out)}_{k}"})
    procs.append((o, subprocess.Popen([GPY, "-c", code, arg], cwd=ROOT, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)))
# feather mask: the face oval of the ORIGINAL crop, grown a little, faded at the edge
cr = cv2.resize(crop, (cw, ch)); rc = fm.process(cv2.cvtColor(cr, cv2.COLOR_BGR2RGB))
m = np.zeros((ch, cw), np.float32)
if rc.multi_face_landmarks:
    P = np.array([[q.x * cw, q.y * ch] for q in rc.multi_face_landmarks[0].landmark]); hull = cv2.convexHull(P.astype(np.int32))
    cv2.fillPoly(m, [hull], 1.); m = cv2.dilate(m, np.ones((int(ch * .06) | 1,) * 2, np.uint8))
else: m[int(ch * .15):int(ch * .85), int(cw * .25):int(cw * .75)] = 1
m = cv2.GaussianBlur(m, (0, 0), sigmaX=ch * .02)[..., None]
import glob
for o in (sorted(glob.glob(out + ("_?_raw.png" if "--paste-only" in sys.argv else "_p*_raw.png"))) if procs_paint else []):
    ed = cv2.resize(cv2.imread(o), (cw, ch), interpolation=cv2.INTER_AREA)
    full = im.copy(); full[y0:y0 + ch, x0:x0 + cw] = (ed * m + full[y0:y0 + ch, x0:x0 + cw] * (1 - m)).astype(np.uint8)
    fo = o.replace("_raw.png", ".png"); cv2.imwrite(fo, full); print(fo)
for o, p in procs:
    so, se = p.communicate()
    if p.returncode: print("ERR", se[-300:]); continue
    got = json.loads(so.strip().splitlines()[-1])[0]; ed = cv2.resize(cv2.imread(os.path.join(ROOT, got)), (cw, ch), interpolation=cv2.INTER_AREA)
    full = im.copy(); full[y0:y0 + ch, x0:x0 + cw] = (ed * m + full[y0:y0 + ch, x0:x0 + cw] * (1 - m)).astype(np.uint8)
    fo = o.replace("_raw.png", ".png"); cv2.imwrite(fo, full); print(fo)
