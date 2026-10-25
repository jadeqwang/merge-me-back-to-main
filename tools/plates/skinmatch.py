#!/usr/bin/env python3
"""Pull an edited face's skin tone/lighting back toward the original plate's (Lab mean/std transfer on the face skin, feathered).
  $OSPY tools/plates/skinmatch.py ORIG EDIT OUT [--amount=.7] [--rot180]
Skin = face-mesh hull minus eyes/brows/lips (and dark pixels); applied over the dilated hull with a soft edge. For model edits that warmed or
re-lit the face (e.g. bd_ahh, canon pass 2026-10-24)."""
import sys, cv2, numpy as np, mediapipe as mp
pos = [a for a in sys.argv[1:] if not a.startswith("--")]
opt = lambda k, d: next((a.split("=", 1)[1] for a in sys.argv if a.startswith(f"--{k}=")), d)
orig_p, edit_p, out = pos; AMT = float(opt("amount", ".7")); ROT = "--rot180" in sys.argv
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, min_detection_confidence=.2)
FEAT = {"eyeR": [33, 246, 161, 160, 159, 158, 157, 173, 133, 155, 154, 153, 145, 144, 163, 7],
        "eyeL": [263, 466, 388, 387, 386, 385, 384, 398, 362, 382, 381, 380, 374, 373, 390, 249],
        "browR": [70, 63, 105, 66, 107, 55, 65, 52, 53, 46], "browL": [300, 293, 334, 296, 336, 285, 295, 282, 283, 276],
        "lips": [61, 185, 40, 39, 37, 0, 267, 269, 270, 409, 291, 375, 321, 405, 314, 17, 84, 181, 91, 146]}


def lm(im):
    h, w = im.shape[:2]; r = fm.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
    return np.array([[q.x * w, q.y * h] for q in r.multi_face_landmarks[0].landmark])


def skin(im, L):
    m = np.zeros(im.shape[:2], np.uint8); cv2.fillPoly(m, [cv2.convexHull(L.astype(np.int32))], 1)
    for idx in FEAT.values(): cv2.fillPoly(m, [cv2.convexHull(L[idx].astype(np.int32))], 0)
    k = max(3, int(np.ptp(L[:, 1]) * .03) | 1); m = cv2.erode(m, np.ones((k, k), np.uint8))
    lab = cv2.cvtColor(im, cv2.COLOR_BGR2LAB).astype(np.float32)
    return (m > 0) & (lab[..., 0] > 60), lab


o, e = cv2.imread(orig_p), cv2.imread(edit_p)
if ROT: o, e = cv2.rotate(o, cv2.ROTATE_180), cv2.rotate(e, cv2.ROTATE_180)
Lo, Le = lm(o), lm(e)
mo, labo = skin(o, Lo); me, labe = skin(e, Le)
mu_o, sd_o = labo[mo].mean(0), labo[mo].std(0) + 1e-3; mu_e, sd_e = labe[me].mean(0), labe[me].std(0) + 1e-3
new = (labe - mu_e) * (sd_o / sd_e) + mu_o
print("orig Lab", mu_o.round(1), "edit Lab", mu_e.round(1))
fh = np.ptp(Le[:, 1]); w = np.zeros(e.shape[:2], np.float32)
cv2.fillPoly(w, [cv2.convexHull(Le.astype(np.int32))], 1.); w = cv2.dilate(w, np.ones((int(fh * .08) | 1,) * 2, np.uint8))
w = cv2.GaussianBlur(w, (0, 0), fh * .05)[..., None] * AMT
res = cv2.cvtColor(np.clip(labe * (1 - w) + new * w, 0, 255).astype(np.uint8), cv2.COLOR_LAB2BGR)
if ROT: res = cv2.rotate(res, cv2.ROTATE_180)
cv2.imwrite(out, res); print(out)
