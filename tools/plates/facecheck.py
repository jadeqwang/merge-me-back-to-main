#!/usr/bin/env python3
"""Facial-geometry check for likeness edits (OS-venv: mediapipe/cv2): eye placement vs the face midline.
  $OSPY tools/plates/facecheck.py IMG [IMG ...] [--max=2.5]
Prints, per image, how far each iris centre sits from the nose-bridge→chin midline (as a fraction of the eye spacing) and the
left/right difference in %. Edits drift this; |diff| above --max (default 2.5 %) on a frontal face reads as "eyes off-centre". Exit 1 if any fail.
Only meaningful for near-frontal faces (a turned head projects asymmetrically)."""
import sys, cv2, numpy as np, mediapipe as mp
args = [a for a in sys.argv[1:] if not a.startswith("--")]
MAX = float(next((a.split("=")[1] for a in sys.argv if a.startswith("--max=")), "2.5"))
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True)
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


def measure(p):
    L = mesh(cv2.imread(p))
    if L is None: return None
    top, chin = L[168], L[152]
    ax = (chin - top) / np.linalg.norm(chin - top); nx = np.array([ax[1], -ax[0]])
    eR, eL = L[468], L[473]; io = np.linalg.norm(eR - eL)
    d = lambda i: abs((L[i] - top) @ nx)
    # inner-corner skew vs head yaw (face-outline skew): on a turned head both lean the same way; opposite signs read as "eyes off-centre"
    inner, yaw = 100 * (d(133) - d(362)) / io, 100 * (d(234) - d(454)) / io
    return 100 * (abs((eR - top) @ nx) - abs((eL - top) @ nx)) / io, 100 * ((eR - top) @ ax - (eL - top) @ ax) / io, inner, yaw


bad = 0
for p in args:
    m = measure(p)
    if m is None: print(f"{p}: no face"); continue
    skew = m[2] * np.sign(m[3]) < -2.5 if abs(m[3]) > 4 else abs(m[2]) > 3.5     # inner corners lean against the head turn
    ok = abs(m[0]) <= MAX and not skew; bad += not ok
    print(f"{'ok  ' if ok else 'FAIL'} midline diff {m[0]:+5.1f}%  height diff {m[1]:+5.1f}%  inner-corner {m[2]:+5.1f}% vs yaw {m[3]:+5.1f}%{'  ✗ corner skew' if skew else ''}  {p}")
sys.exit(1 if bad else 0)
