#!/usr/bin/env python3
"""Give a plate the hairstyle of another version of the same shot while keeping its face pixel-exact.
  $OSPY tools/plates/hairswap.py FACE_IMG HAIR_IMG OUT.png        (OS-venv: mediapipe/cv2; calls nano-banana via the moongazing venv)
1. HAIR_IMG with its face masked grey (so the model can't copy the old face) → nano-banana edit of FACE_IMG "hair like this".
2. The model drifts the face a little, so FACE_IMG's face oval is feather-composited back over the result (checks landmark drift first).
Intermediates go next to OUT (_hairref.jpg, _model.*)."""
import os, subprocess, sys, json, cv2, numpy as np, mediapipe as mp
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GPY = "/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python"
if not os.path.exists(GPY): GPY = os.environ.get("GEN_PY", sys.executable)   # cloud: a py3.12 venv with mediapipe 0.10.21 + numpy<2
pos = [a for a in sys.argv[1:] if not a.startswith("--")]
face_p, hair_p, out = pos[0], pos[1], pos[2]
MASK = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--mask=")), "face")   # face (below the brows, incl. jaw) | none
EXTRA = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--hair=")), "")       # extra hair wording, e.g. curtain bangs
NAME = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--tag=")), "")
stem = os.path.splitext(out)[0]
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1)
OVAL = [10, 338, 297, 332, 284, 251, 389, 356, 454, 323, 361, 288, 397, 365, 379, 378, 400, 377, 152, 148, 176, 149, 150, 136, 172, 58, 132, 93, 234,
        127, 162, 21, 54, 103, 67, 109]


fd = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=.2)


def lm(im):
    """Face-mesh landmarks in pixels; small faces: full-range detector, then the mesh on an upscaled crop."""
    h, w = im.shape[:2]; r = fm.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
    if r.multi_face_landmarks: return np.array([[q.x * w, q.y * h] for q in r.multi_face_landmarks[0].landmark], np.float32)
    d = fd.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
    if not d.detections: sys.exit(f"no face in image {im.shape}")
    b = d.detections[0].location_data.relative_bounding_box
    cx, cy, sz = (b.xmin + b.width / 2) * w, (b.ymin + b.height / 2) * h, max(b.width * w, b.height * h) * 1.8
    x0, y0 = int(max(0, cx - sz / 2)), int(max(0, cy - sz / 2)); c = im[y0:int(min(h, cy + sz / 2)), x0:int(min(w, cx + sz / 2))]
    k = 768 / max(c.shape[:2]); c2 = cv2.resize(c, None, fx=k, fy=k, interpolation=cv2.INTER_CUBIC)
    r = fm.process(cv2.cvtColor(c2, cv2.COLOR_BGR2RGB))
    if not r.multi_face_landmarks: sys.exit(f"no face mesh in crop {c.shape}")
    return np.array([[x0 + q.x * c2.shape[1] / k, y0 + q.y * c2.shape[0] / k] for q in r.multi_face_landmarks[0].landmark], np.float32)


def oval(L, sx, sy, dy=0.):
    p = L[OVAL]; c = p.mean(0); return ((p - c) * np.array([sx, sy]) + c + np.array([0, dy])).astype(np.int32)


# 1. hair reference with the face hidden
hair = cv2.imread(hair_p); Lh = lm(hair)
# grey out only the brows-down part of the face: a grey patch over the forehead reads as a blunt fringe line (it caused short bangs)
mk = np.zeros(hair.shape[:2], np.uint8); cv2.fillPoly(mk, [oval(Lh, .92, .92)], 255)
mk[:int(Lh[[105, 334, 66, 296], 1].min() - .15 * (Lh[[33, 133, 362, 263], 1].mean() - Lh[[105, 334, 66, 296], 1].min()))] = 0
ref = hair.copy(); ref[mk > 0] = (128, 128, 128); cv2.imwrite(stem + "_hairref.jpg", ref)
P = ("Edit the first image. Change ONLY her hair so it matches the hairstyle in the second image exactly (the grey shape there is just a mask; ignore it): "
     "the same length, layers, face-framing strands, volume, parting and the same way it falls over and behind her shoulders. " + EXTRA + " Do NOT change her face in "
     "any way: keep her eyes, eyelids, eyebrows, nose, mouth, expression, face shape, skin and head angle exactly as in the first image. Keep lighting, "
     "costume and patch, framing and background identical. Same stylized 3D render style. No glasses. No text.")
code = ("import sys, json; sys.path.insert(0, 'tools/gen'); import cf; a = json.loads(sys.argv[1]); "
        "print(json.dumps(cf.generate('google/nano-banana-pro', {'prompt': a['p'], 'aspect_ratio': '16:9', 'image_size': '2K', "
        "'image_input': ['file:' + a['f'], 'file:' + a['h']]}, a['o'], tag='hairswap_' + a['t'])))")
arg = json.dumps({"p": P, "f": os.path.relpath(face_p, ROOT), "h": os.path.relpath(stem + "_hairref.jpg", ROOT), "o": os.path.relpath(stem + "_model" + NAME + ".jpg", ROOT),
                  "t": os.path.basename(stem)})
prev = [stem + "_model" + NAME + e for e in (".jpg", ".png") if os.path.exists(stem + "_model" + NAME + e)]
if prev and "--regen" not in sys.argv:          # reuse a finished model edit (re-composite only)
    model_p = prev[0]
else:
    r = subprocess.run([GPY, "-c", code, arg], cwd=ROOT, capture_output=True, text=True, check=True)
    model_p = os.path.join(ROOT, json.loads(r.stdout.strip().splitlines()[-1])[0])
# 2. put the exact face back
face = cv2.imread(face_p); h, w = face.shape[:2]
gen = cv2.resize(cv2.imread(model_p), (w, h), interpolation=cv2.INTER_LANCZOS4)
Lf, Lg = lm(face), lm(gen)
drift = float(np.median(np.linalg.norm(Lf - Lg, axis=1))) / h * 1000
print(f"landmark drift {drift:.1f} px per 1000 px height" + ("  (large: check the seam)" if drift > 6 else ""))
# the WHOLE face incl. jawline/cheeks/chin comes from FACE_IMG — pasting only the inner face onto another generation's jaw puts the eyes
# off-centre relative to the face outline (the 1:30 close-up bug, 2026-10-24); check with tools/plates/facecheck.py
# the hairline/forehead stay from the model (clipping above the brows) so the new hair has no hard edge
if MASK == "none":
    cv2.imwrite(out, gen)
else:
    m = np.zeros((h, w), np.float32); cv2.fillPoly(m, [oval(Lf, 1.0, 1.0)], 1.)
    brow, eye = Lf[[105, 334, 66, 296], 1].min(), Lf[[33, 133, 362, 263], 1].mean()
    yy = np.arange(h, dtype=np.float32)[:, None]; m *= np.clip((yy - (brow - .45 * (eye - brow))) / (.25 * (eye - brow)), 0, 1)
    # strands: where the model drew hair over what is skin in FACE_IMG (much darker there), keep the model's pixels — otherwise the paste
    # cuts every strand that crosses the face into a blunt edge. The eyes/nose/mouth core is always FACE_IMG.
    lf = cv2.cvtColor(face, cv2.COLOR_BGR2GRAY).astype(np.float32); lg = cv2.cvtColor(gen, cv2.COLOR_BGR2GRAY).astype(np.float32)
    strand = np.clip((lf - lg - 18.) / 30., 0, 1)
    core = np.zeros((h, w), np.float32)
    cv2.fillPoly(core, [cv2.convexHull(Lf[[33, 133, 362, 263, 159, 386, 145, 374, 1, 2, 98, 327, 61, 291, 0, 17]].astype(np.int32))], 1.)
    core = cv2.dilate(core, np.ones((int(h * .012) | 1,) * 2, np.uint8))
    m = m * (1 - strand * (1 - core))
    m = cv2.GaussianBlur(m, (0, 0), sigmaX=w * .0015)[..., None]
    cv2.imwrite(out, (face * m + gen * (1 - m)).astype(np.uint8))
print(out)
