#!/usr/bin/env python3
"""Face proportions vs Jade's photos (OS-venv: mediapipe/cv2). All ratios are per eye spacing (IPD) or per face size, so photos and renders compare.
  $OSPY tools/plates/facegeom.py IMG [IMG ...]
Columns: brow→eye (lower brow edge to upper-lid top / IPD), brow-thick (/ IPD), face L/W (forehead top→chin / cheek width), jaw/cheek, forehead/face.
TARGET is the range measured on her selfies (character sheets/selfies 4, 7, 8, 15, 18) on 2026-10-24; renders were consistently low on the first
three (brows too low and thin, face too short/wide) — the gap she described via her "who'd play you" answer."""
import sys, cv2, numpy as np, mediapipe as mp
TARGET = {"brow→eye": (.35, .41), "brow-thick": (.10, .11), "face L/W": (1.20, 1.34), "jaw/cheek": (.73, .78), "forehead/face": (.18, .21)}
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.2)
fd = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=.2)


def mesh(im):
    h, w = im.shape[:2]; r = fm.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
    if r.multi_face_landmarks: return np.array([[q.x * w, q.y * h] for q in r.multi_face_landmarks[0].landmark])
    d = fd.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
    if not d.detections: return None
    b = d.detections[0].location_data.relative_bounding_box
    cx, cy, sz = (b.xmin + b.width / 2) * w, (b.ymin + b.height / 2) * h, max(b.width * w, b.height * h) * 1.8
    x0, y0 = int(max(0, cx - sz / 2)), int(max(0, cy - sz / 2)); c = im[y0:int(min(h, cy + sz / 2)), x0:int(min(w, cx + sz / 2))]
    k = 768 / max(c.shape[:2]); c2 = cv2.resize(c, None, fx=k, fy=k)
    r = fm.process(cv2.cvtColor(c2, cv2.COLOR_BGR2RGB))
    if not r.multi_face_landmarks: return None
    return np.array([[x0 + q.x * c2.shape[1] / k, y0 + q.y * c2.shape[0] / k] for q in r.multi_face_landmarks[0].landmark])


def geom(L):
    ipd = np.linalg.norm(L[468] - L[473]); cw = np.linalg.norm(L[234] - L[454])
    return {"brow→eye": np.mean([np.linalg.norm(L[a] - L[b]) for a, b in ((52, 159), (282, 386))]) / ipd,
            "brow-thick": np.mean([np.linalg.norm(L[a] - L[b]) for a, b in ((105, 52), (334, 282))]) / ipd,
            "face L/W": np.linalg.norm(L[10] - L[152]) / cw, "jaw/cheek": np.linalg.norm(L[172] - L[397]) / cw,
            "forehead/face": np.linalg.norm(L[10] - L[9]) / np.linalg.norm(L[10] - L[152])}


if __name__ == "__main__":
    print(f"{'':40s}" + "".join(f"{k:>15s}" for k in TARGET))
    print(f"{'TARGET (her photos)':40s}" + "".join(f"{f'{a:.2f}–{b:.2f}':>15s}" for a, b in TARGET.values()))
    for p in sys.argv[1:]:
        L = mesh(cv2.imread(p))
        if L is None: print(p, "no face"); continue
        g = geom(L)
        print(f"{p.split('/')[-1][:40]:40s}" + "".join(f"{(f'{g[k]:.2f}' + (' ' if a <= g[k] <= b else '✗')):>15s}" for k, (a, b) in TARGET.items()))
