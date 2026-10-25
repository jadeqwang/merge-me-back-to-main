#!/usr/bin/env python3
"""Transfer Jade's real brow outline from a photo onto a render as a guide (OS-venv: mediapipe/cv2).
  $OSPY tools/plates/browguide.py RENDER PHOTO OUT_GUIDE [--lift=0]
Each photo brow (upper + lower edge landmarks) is mapped by a similarity transform fitted on that side's eye corners + brow-head point,
then drawn as a thin cyan outline. --lift moves the guide up by this × IPD (the render's brows were already raised by browlift).
Also writes OUT_GUIDE.mask.png: the brow regions (render's own brows ∪ guide), dilated, for compositing the edit back."""
import sys, cv2, numpy as np, mediapipe as mp
pos = [a for a in sys.argv[1:] if not a.startswith("--")]
LIFT = float(next((a.split("=")[1] for a in sys.argv if a.startswith("--lift=")), "0"))
render_p, photo_p, out = pos
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.2)
def mesh(im):
    h, w = im.shape[:2]; r = fm.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
    return np.array([[q.x * w, q.y * h] for q in r.multi_face_landmarks[0].landmark], np.float32)
R = cv2.imread(render_p); P = cv2.imread(photo_p); LR, LP = mesh(R), mesh(P)
ipd = np.linalg.norm(LR[468] - LR[473])
hx = LR[362] - LR[133]; hx /= np.linalg.norm(hx); up = np.array([hx[1], -hx[0]]); up = -up if up[1] > 0 else up
# subject's right brow (screen left) / left brow (screen right): upper edge outer→inner, lower edge outer→inner
SIDES = [dict(up=[70, 63, 105, 66, 107], lo=[46, 53, 52, 65, 55], fit=[33, 133, 159, 145]),
         dict(up=[300, 293, 334, 296, 336], lo=[276, 283, 282, 295, 285], fit=[263, 362, 386, 374])]
g = R.copy(); mask = np.zeros(R.shape[:2], np.uint8); th = max(1, int(R.shape[0] / 700))
for sd in SIDES:
    M, _ = cv2.estimateAffinePartial2D(LP[sd["fit"]], LR[sd["fit"]])
    tf = lambda idx: cv2.transform(LP[idx][None], M)[0] + up * LIFT * ipd
    upper, lower = tf(sd["up"]), tf(sd["lo"])
    def smooth(pts, n=40):   # Catmull-Rom through the landmark points
        P_ = np.vstack([pts[0], pts, pts[-1]]); out_ = []
        for i in range(1, len(P_) - 2):
            for t in np.linspace(0, 1, n // (len(P_) - 3), endpoint=False):
                a, b, c, d = P_[i - 1], P_[i], P_[i + 1], P_[i + 2]
                out_.append(.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t * t + (-a + 3 * b - 3 * c + d) * t ** 3))
        return np.vstack([out_, pts[-1]])
    outline = np.vstack([smooth(upper), smooth(lower)[::-1]]).astype(np.int32)
    cv2.polylines(g, [outline], True, (255, 230, 0), th, cv2.LINE_AA)
    cv2.fillPoly(mask, [outline], 255); cv2.fillPoly(mask, [cv2.convexHull(LR[sd["up"] + sd["lo"]].astype(np.int32))], 255)
mask = cv2.dilate(mask, np.ones((int(ipd * .12) | 1,) * 2, np.uint8))
cv2.imwrite(out, g); cv2.imwrite(out + ".mask.png", mask); print(out)
