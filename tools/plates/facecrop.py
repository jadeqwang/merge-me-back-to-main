#!/usr/bin/env python3
"""Face-centred crops for likeness review (OS-venv: mediapipe + cv2).
  $OSPY tools/plates/facecrop.py OUT.jpg [--eyes] IMG [IMG ...]
Tiles one crop per image side by side (face box padded; --eyes = brows+eyes band only). Labels with the file name."""
import os, sys, cv2, numpy as np, mediapipe as mp
args = [a for a in sys.argv[1:] if not a.startswith("--")]
out, imgs, eyes = args[0], args[1:], "--eyes" in sys.argv
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.2)
fd = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=.2)


def mesh(im):
    """Landmarks in image pixels; small faces: full-range detector first, then the mesh on a padded crop."""
    h, w = im.shape[:2]
    r = fm.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
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
S = float(next((a.split("=")[1] for a in sys.argv if a.startswith("--scale=")), "1"))
TW, TH = (int(560 * S), int(260 * S)) if eyes else (int(480 * S), int(560 * S))
tiles = []
for p in imgs:
    im = cv2.imread(p); h, w = im.shape[:2]
    L = mesh(im)
    if L is None:
        t = cv2.resize(im, (TW, TH))
    else:
        if eyes:   # brows (70..107 / 300..336) to lower lids
            idx = [70, 63, 105, 66, 107, 336, 296, 334, 293, 300, 33, 133, 362, 263, 145, 374]
            x0, y0 = L[idx].min(0); x1, y1 = L[idx].max(0); px, py = (x1 - x0) * .12, (y1 - y0) * .35
        else:
            x0, y0 = L.min(0); x1, y1 = L.max(0); px, py = (x1 - x0) * .35, (y1 - y0) * .3
        x0, y0, x1, y1 = int(max(0, x0 - px)), int(max(0, y0 - py)), int(min(w, x1 + px)), int(min(h, y1 + py))
        crop = im[y0:y1, x0:x1]; s = min(TW / crop.shape[1], TH / crop.shape[0])
        crop = cv2.resize(crop, (int(crop.shape[1] * s), int(crop.shape[0] * s)), interpolation=cv2.INTER_LANCZOS4)
        t = np.zeros((TH, TW, 3), np.uint8); oy, ox = (TH - crop.shape[0]) // 2, (TW - crop.shape[1]) // 2; t[oy:oy + crop.shape[0], ox:ox + crop.shape[1]] = crop
    cv2.putText(t, os.path.basename(os.path.dirname(p)) + "/" + os.path.basename(p), (6, 18), cv2.FONT_HERSHEY_SIMPLEX, .45, (0, 255, 255), 1)
    tiles.append(t)
cv2.imwrite(out, np.hstack(tiles))
print(out)
