#!/usr/bin/env python3
"""Deterministic iris shrink + lower-lip fullness (OS-venv: mediapipe/cv2) — image models barely move either.
  $OSPY tools/plates/irislip.py IN OUT [--iris=.85] [--lip=.05]
--iris : scale the iris diameter by this, inside the eye opening only (lids, lashes and the eye outline don't move; the sclera stretches in)
         (her photos: iris 0.19–0.20 IPD; renders ~0.23)
--lip  : add this × IPD of lower-lip height (local vertical stretch between the lips' meeting line and the lower-lip edge; the chin follows)
         (her photos: lower lip 0.15–0.19 IPD; renders ~0.12–0.13)"""
import sys, cv2, numpy as np, mediapipe as mp
pos = [a for a in sys.argv[1:] if not a.startswith("--")]
arg = lambda k, d: float(next((a.split("=")[1] for a in sys.argv if a.startswith(f"--{k}=")), d))
src, dst = pos; IRIS, LIP = arg("iris", .85), arg("lip", .05)
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.2)
im = cv2.imread(src); h, w = im.shape[:2]
L = np.array([[q.x * w, q.y * h] for q in fm.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB)).multi_face_landmarks[0].landmark])
ipd = np.linalg.norm(L[468] - L[473])
gy, gx = np.mgrid[0:h, 0:w].astype(np.float32)
mx, my = gx.copy(), gy.copy()
EYE = {"R": dict(c=468, ring=[469, 470, 471, 472], poly=[33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246]),
       "L": dict(c=473, ring=[474, 475, 476, 477], poly=[263, 249, 390, 373, 374, 380, 381, 382, 362, 398, 384, 385, 386, 387, 388, 466])}
for e in EYE.values():
    c = L[e["c"]]; R = np.mean(np.linalg.norm(L[e["ring"]] - c, axis=1)); Rn = R * IRIS; M = R * 1.9      # warp zone: out to 1.9 R
    dx, dy = gx - c[0], gy - c[1]; r = np.sqrt(dx * dx + dy * dy) + 1e-6
    # dst radius → src radius: [0, Rn] → [0, R] (iris shrinks); [Rn, M] → [R, M] (sclera stretches in); identity beyond M
    rs = np.where(r < Rn, r * R / Rn, np.where(r < M, R + (r - Rn) * (M - R) / (M - Rn), r))
    mask = np.zeros((h, w), np.float32); cv2.fillPoly(mask, [L[e["poly"]].astype(np.int32)], 1.)
    mask = cv2.GaussianBlur(cv2.erode(mask, np.ones((3, 3), np.uint8)), (0, 0), max(1., R * .06))     # stay inside the opening
    mx = mx * (1 - mask) + (c[0] + dx * rs / r) * mask; my = my * (1 - mask) + (c[1] + dy * rs / r) * mask
out = cv2.remap(im, mx.astype(np.float32), my.astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
if LIP > 0:
    hx = L[362] - L[133]; hx /= np.linalg.norm(hx); dn = np.array([-hx[1], hx[0]]); dn = dn if dn[1] > 0 else -dn
    o = L[14]; s = (np.stack([gx, gy], -1) - o) @ dn; x = (np.stack([gx, gy], -1) - L[0]) @ hx
    lip_h = (L[17] - L[14]) @ dn; chin = (L[152] - o) @ dn; mw = .5 * np.linalg.norm(L[61] - L[291])
    sm = lambda a, b, v: (lambda t: t * t * (3 - 2 * t))(np.clip((v - a) / (b - a), 0, 1))
    d = LIP * ipd * sm(0, lip_h, s) * (1 - sm(chin + .2 * lip_h, chin + 4 * lip_h, s)) * np.exp(-np.clip(np.abs(x) - mw * 1.6, 0, None) ** 2 / (2 * (mw * .8) ** 2))
    d2 = LIP * ipd * sm(0, lip_h, s - d) * (1 - sm(chin + .2 * lip_h, chin + 4 * lip_h, s - d)) * np.exp(-np.clip(np.abs(x) - mw * 1.6, 0, None) ** 2 / (2 * (mw * .8) ** 2))
    out = cv2.remap(out, (gx - dn[0] * d2).astype(np.float32), (gy - dn[1] * d2).astype(np.float32), cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
cv2.imwrite(dst, out); print(dst, f"iris ×{IRIS}  lower lip +{LIP * ipd:.1f}px")
