#!/usr/bin/env python3
"""Smooth local brow lift (OS-venv: mediapipe/cv2). Replaces liquify.py for brows: that tool's global thin-plate field rippled the hair and
softened the face (Jade, 2026-10-24). Here the displacement is a separable, monotone field along the face's "up" axis:
  f(s) = 0 below the upper lids → ramps to RAISE at the brows' lower edge → RAISE+THICK at their upper edge → RAISE+THICK+TOP at the hairline,
  then fades back to 0 toward the crown; × a smooth horizontal falloff outside the face width.
Everything below the brows (eyes, lids, nose, mouth, jaw, chin) is untouched; the forehead keeps (or gains) height; nothing oscillates.
  $OSPY tools/plates/browlift.py IN OUT [--raise=.08] [--thick=.02] [--top=.0]      (× IPD; her photos: brow→eye 0.35–0.41, thickness 0.10–0.11)"""
import sys, cv2, numpy as np, mediapipe as mp
pos = [a for a in sys.argv[1:] if not a.startswith("--")]
arg = lambda k, d: float(next((a.split("=")[1] for a in sys.argv if a.startswith(f"--{k}=")), d))
src, dst = pos; RAISE, THICK, TOP = arg("raise", .08), arg("thick", .02), arg("top", 0.)
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.2)
im = cv2.imread(src); h, w = im.shape[:2]
L = np.array([[q.x * w, q.y * h] for q in fm.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB)).multi_face_landmarks[0].landmark])
ipd = np.linalg.norm(L[468] - L[473])
hx = L[362] - L[133]; hx /= np.linalg.norm(hx); up = np.array([hx[1], -hx[0]]); up = -up if up[1] > 0 else up
o = L[168]                                                                     # origin: nose bridge
s_of = lambda P: (P - o) @ up                                                  # height along "up"
x_of = lambda P: (P - o) @ hx
lid = max(s_of(L[i]) for i in (159, 386, 158, 385))                            # top of the upper lids
blo = np.mean([s_of(L[i]) for i in (52, 65, 282, 295, 53, 283)])               # brows' lower edge
bhi = np.mean([s_of(L[i]) for i in (105, 66, 334, 296, 63, 293)])              # brows' upper edge
hair = s_of(L[10])                                                             # top of the face mesh ≈ hairline
crown = hair + (hair - lid) * 1.2
half = .5 * abs(x_of(L[454]) - x_of(L[234]))
R, T_, K = RAISE * ipd, THICK * ipd, TOP * ipd
gy, gx = np.mgrid[0:h, 0:w].astype(np.float32)
P = np.stack([gx, gy], -1)
S = (P - o) @ up; X = (P - o) @ hx
# monotone piecewise-smooth displacement along up (in the DESTINATION frame; inverted below by one fixed-point step)
def disp(s):
    sm = lambda a, b, v: np.clip((v - a) / (b - a), 0, 1) ** 2 * (3 - 2 * np.clip((v - a) / (b - a), 0, 1))
    d = R * sm(lid + .15 * (blo - lid), blo, s)                                # 0 at the lid crease zone → R at the brow's lower edge
    d += T_ * sm(blo, bhi, s)                                                  # thicker brows
    d += K * sm(bhi, hair, s)                                                  # optional extra forehead height
    d *= 1 - sm(hair + .1 * (crown - hair), crown, s)                          # fade back to 0 toward the crown
    return d
side = np.exp(-np.clip(np.abs(X) - half * .95, 0, None) ** 2 / (2 * (half * .45) ** 2))   # smooth falloff outside the face width
D1 = disp(S) * side; D2 = disp(S - D1) * side                                 # backward map: src = dst - D(dst - D(dst))
mx = (gx - up[0] * D2).astype(np.float32); my = (gy - up[1] * D2).astype(np.float32)
cv2.imwrite(dst, cv2.remap(im, mx, my, cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT))
print(dst, f"ipd {ipd:.0f}px  raise {R:.1f}px  thick {T_:.1f}px  top {K:.1f}px")
