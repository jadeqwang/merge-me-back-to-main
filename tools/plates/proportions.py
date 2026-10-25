#!/usr/bin/env python3
"""Measured proportion warp toward Jade's photos (OS-venv: mediapipe/cv2). Smooth, local, monotone fields (no thin-plate splines: those rippled).
  $OSPY tools/plates/proportions.py IN OUT [--nose=.13] [--cheek=.05] [--nosew=.10] [--mouthw=.07]
--nose   : lengthen the midface by this × IPD — the band nasion→subnasale stretches; mouth, chin and jaw move down by the full amount, the neck
           absorbs it below the chin.                    (her photos: nasion→subnasale 0.85–0.93 IPD; renders ~0.73)
--cheek  : widen the face at the cheeks by this fraction per side (fades out above the brows and toward the chin, keeping the heart shape)
           (her photos: cheek width 2.18–2.25 IPD; renders ~1.97)
--nosew  : widen the nose by this fraction                 (0.50–0.56 vs ~0.45)
--mouthw : widen the mouth by this fraction                (0.75–0.82 vs ~0.71)
Eyes keep their exact size, shape and spacing. Check with tools/plates/facegeom.py + facecheck.py."""
import sys, cv2, numpy as np, mediapipe as mp
pos = [a for a in sys.argv[1:] if not a.startswith("--")]
arg = lambda k, d: float(next((a.split("=")[1] for a in sys.argv if a.startswith(f"--{k}=")), d))
src, dst = pos; NOSE, CHEEK, NOSEW, MOUTHW = arg("nose", .13), arg("cheek", .05), arg("nosew", .10), arg("mouthw", .07)
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.2)
im = cv2.imread(src); h, w = im.shape[:2]
L = np.array([[q.x * w, q.y * h] for q in fm.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB)).multi_face_landmarks[0].landmark])
ipd = np.linalg.norm(L[468] - L[473])
hx = L[362] - L[133]; hx /= np.linalg.norm(hx); dn = np.array([-hx[1], hx[0]]); dn = dn if dn[1] > 0 else -dn
o = L[168]; S = lambda P: (P - o) @ dn; X = lambda P: (P - o) @ hx
gy, gx = np.mgrid[0:h, 0:w].astype(np.float32); G = np.stack([gx, gy], -1)
sm = lambda a, b, v: (lambda t: t * t * (3 - 2 * t))(np.clip((v - a) / (b - a), 0, 1))
eye_s = np.mean([S(L[i]) for i in (145, 374)]); nb = S(L[2]); chin = S(L[152]); top = S(L[10])
half = .5 * abs(X(L[454]) - X(L[234])); face_len = chin - top


def field(P):
    s = (P - o) @ dn; x = (P - o) @ hx
    side = np.exp(-np.clip(np.abs(x) - half * 1.0, 0, None) ** 2 / (2 * (half * .5) ** 2))
    # 1. midface: 0 at the lower lids → NOSE·ipd at the subnasale and below; the neck (below chin) absorbs it
    dv = NOSE * ipd * sm(eye_s, nb, s) * (1 - sm(chin + .05 * face_len, chin + .6 * face_len, s)) * side
    # 2. cheeks: outward ∝ x, strongest at cheekbone/mid-face height, zero above the brows and fading toward the chin (heart shape)
    band = sm(top + .35 * face_len, eye_s + .1 * face_len, s) * (1 - sm(nb + .15 * face_len, chin, s))
    dh = CHEEK * x * band * np.exp(-np.clip(np.abs(x) - half * 1.05, 0, None) ** 2 / (2 * (half * .3) ** 2))
    # 3./4. nose and mouth width: local horizontal scale about the midline
    nw = .5 * np.linalg.norm(L[98] - L[327]); ns = S(L[2]) - .25 * (S(L[2]) - S(L[168]))
    dh += NOSEW * x * np.exp(-(x / (nw * 1.6)) ** 2) * np.exp(-((s - ns) / (nw * 1.4)) ** 2)
    mw = .5 * np.linalg.norm(L[61] - L[291]); ms = np.mean([S(L[i]) for i in (13, 14)])
    dh += MOUTHW * x * np.exp(-(x / (mw * 1.5)) ** 2) * np.exp(-((s - ms) / (mw * .7)) ** 2)
    return dh[..., None] * hx + dv[..., None] * dn


D1 = field(G); D2 = field(G - D1); D3 = field(G - D2)                             # backward map by fixed-point iteration
mp_ = (G - D3).astype(np.float32)
cv2.imwrite(dst, cv2.remap(im, mp_[..., 0], mp_[..., 1], cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT))
print(dst, f"ipd {ipd:.0f}px nose +{NOSE * ipd:.1f}px cheek {CHEEK:+.0%} nosew {NOSEW:+.0%} mouthw {MOUTHW:+.0%}")
