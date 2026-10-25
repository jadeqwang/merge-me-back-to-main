#!/usr/bin/env python3
"""Landmark-driven liquify for likeness proportions (OS-venv: mediapipe/cv2/scipy) — what a retoucher does by hand, but measured.
  $OSPY tools/plates/liquify.py IN OUT [--brow=0.10] [--thick=0.025] [--chin=0.06]
--brow  : raise both brows (lower edge) by this × IPD                       (her photos: brow→eye 0.35–0.41 IPD; renders ~0.28)
--thick : additionally raise the brows' upper edge by this × IPD (thicker)   (her photos: 0.10–0.11; renders ~0.08)
--chin  : lengthen the lower face — chin moves down by this × face length, mouth/jaw proportionally (her L/W 1.20–1.34; renders ~1.14)
Eyes, lids, nose bridge and the hairline are pinned (zero displacement), so only the targeted proportions change. The displacement field is a
thin-plate-spline through landmark controls, applied by backward remap. Run tools/plates/facegeom.py + facecheck.py on the result."""
import sys, cv2, numpy as np, mediapipe as mp
from scipy.interpolate import RBFInterpolator
pos = [a for a in sys.argv[1:] if not a.startswith("--")]
arg = lambda k, d: float(next((a.split("=")[1] for a in sys.argv if a.startswith(f"--{k}=")), d))
src, dst = pos
BROW, THICK, CHIN, TOP = arg("brow", .10), arg("thick", .025), arg("chin", 0), arg("top", .14)
# --top: raise the hairline/upper forehead by this × IPD as well, so raising the brows never squeezes the forehead (her tall forehead is a
#        defining feature; v1 of this tool pinned the hairline and stretched the chin, which she rejected on 2026-10-24)
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.2)
fd = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=.2)


def mesh(im):
    h, w = im.shape[:2]; r = fm.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
    if r.multi_face_landmarks: return np.array([[q.x * w, q.y * h] for q in r.multi_face_landmarks[0].landmark])
    d = fd.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
    b = d.detections[0].location_data.relative_bounding_box
    cx, cy, sz = (b.xmin + b.width / 2) * w, (b.ymin + b.height / 2) * h, max(b.width * w, b.height * h) * 1.8
    x0, y0 = int(max(0, cx - sz / 2)), int(max(0, cy - sz / 2)); c = im[y0:int(min(h, cy + sz / 2)), x0:int(min(w, cx + sz / 2))]
    k = 768 / max(c.shape[:2]); c2 = cv2.resize(c, None, fx=k, fy=k)
    r = fm.process(cv2.cvtColor(c2, cv2.COLOR_BGR2RGB))
    return np.array([[x0 + q.x * c2.shape[1] / k, y0 + q.y * c2.shape[0] / k] for q in r.multi_face_landmarks[0].landmark])


im = cv2.imread(src); h, w = im.shape[:2]; L = mesh(im)
ipd = np.linalg.norm(L[468] - L[473])
down = (L[152] - L[168]); flen = np.linalg.norm(L[10] - L[152]); down /= np.linalg.norm(down)   # face "down" axis (handles head tilt)
up = -down
UPPER_BROW = [70, 63, 105, 66, 107, 336, 296, 334, 293, 300]
LOWER_BROW = [46, 53, 52, 65, 55, 285, 295, 282, 283, 276]
EYES = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386,
        387, 388, 466, 468, 473]
PIN = EYES + [168, 6, 197, 195, 5, 4, 1]                                                  # eyes + nose bridge stay put
HAIRLINE = [10, 109, 338, 67, 297, 103, 332, 54, 284, 21, 251]
OVAL_LOW = [132, 58, 172, 136, 150, 149, 176, 148, 152, 377, 400, 378, 379, 365, 397, 288, 361]
MOUTH = [61, 291, 0, 17, 13, 14, 37, 267, 84, 314]
ctrl, disp = [], []
for i in PIN: ctrl.append(L[i]); disp.append((0, 0))
for i in LOWER_BROW: ctrl.append(L[i]); disp.append(up * BROW * ipd)
for i in HAIRLINE: ctrl.append(L[i]); disp.append(up * (BROW + THICK + TOP) * ipd)
for k in (1.25, 1.6):                                                                      # the crown/hair above follows, fading out
    ctrl.append(L[10] + up * (k - 1) * flen); disp.append(up * (BROW + THICK + TOP) * ipd * (1.6 - k) / .35)
for i in UPPER_BROW: ctrl.append(L[i]); disp.append(up * (BROW + THICK) * ipd)
nose_base = L[2] @ down; chin_y = L[152] @ down
for i in OVAL_LOW + MOUTH + [2, 164]:                                                     # lower face: linear stretch from the nose base
    f = np.clip(((L[i] @ down) - nose_base) / max(chin_y - nose_base, 1), 0, 1)
    ctrl.append(L[i]); disp.append(down * CHIN * flen * f)
# below the chin the neck/collar shifts with the chin, fading out; the frame border is pinned
for k in (1.15, 1.4):
    ctrl.append(L[152] + down * (k - 1) * flen); disp.append(down * CHIN * flen * (1.4 - k) / .25)
for x in np.linspace(0, w, 9):
    for y in (0, h): ctrl.append((x, y)); disp.append((0, 0))
for y in np.linspace(0, h, 6):
    for x in (0, w): ctrl.append((x, y)); disp.append((0, 0))
ctrl, disp = np.array(ctrl, float), np.array(disp, float)
# forward field on a coarse grid; backward map ≈ x - D(x - D(x)) (one fixed-point step, fine for small displacements)
s = 8; gy, gx = np.mgrid[0:h:s, 0:w:s]; G = np.c_[gx.ravel(), gy.ravel()].astype(float)
rbf = RBFInterpolator(ctrl, disp, kernel="thin_plate_spline", smoothing=1.0)
D1 = rbf(G); D2 = rbf(G - D1)
mx = cv2.resize((G[:, 0] - D2[:, 0]).reshape(gx.shape).astype(np.float32), (w, h), interpolation=cv2.INTER_CUBIC)
my = cv2.resize((G[:, 1] - D2[:, 1]).reshape(gy.shape).astype(np.float32), (w, h), interpolation=cv2.INTER_CUBIC)
warped = cv2.remap(im, mx, my, cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_REFLECT)
if CHIN == 0:   # upper-face only: fade the warp out between the eyes and the nose tip so the jaw/chin (her heart shape) stay pixel-exact
    yy = (np.mgrid[0:h, 0:w].transpose(1, 2, 0)[..., ::-1].astype(np.float32) @ down)
    e_y, n_y = np.mean([L[i] @ down for i in (468, 473)]), L[1] @ down
    a = np.clip((n_y - yy) / max(n_y - e_y, 1), 0, 1)[..., None]
    warped = (warped * a + im * (1 - a)).astype(np.uint8)
cv2.imwrite(dst, warped)
print(dst, f"ipd {ipd:.0f}px  brow +{BROW * ipd:.1f}px  thick +{THICK * ipd:.1f}px  chin +{CHIN * flen:.1f}px")
