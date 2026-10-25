"""Pass B: mouth crops at given syllable events for candidate lags (rows). Events "label@songtime,..." (generalised wordstrip.py).
    $OSPY tools/cutscenes/pb_wordstrip.py TAKE.mp4 S0 LAG1,LAG2,... OUT.jpg EVENTS [CROP x0,y0,x1,y1]"""
import sys, cv2, numpy as np, mediapipe as mp
from PIL import Image, ImageDraw
take, s0, lags, out = sys.argv[1], float(sys.argv[2]), [float(x) for x in sys.argv[3].split(",")], sys.argv[4]
EV = [(e.split("@")[0], float(e.split("@")[1])) for e in sys.argv[5].split(",")]
CROP = [float(v) for v in sys.argv[6].split(",")] if len(sys.argv) > 6 else None   # x0,y0,x1,y1 fractions: only look for her face there
cap = cv2.VideoCapture(take); fps = cap.get(cv2.CAP_PROP_FPS); frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    frames.append(f)
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, refine_landmarks=True, min_detection_confidence=.3)
def mouth(f):
    if CROP: H0, W0 = f.shape[:2]; f = f[int(CROP[1] * H0):int(CROP[3] * H0), int(CROP[0] * W0):int(CROP[2] * W0)]
    h, w = f.shape[:2]; r = fm.process(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)); im = Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    if r.multi_face_landmarks:
        L = r.multi_face_landmarks[0].landmark; c = np.array([L[13].x * w, (L[13].y + L[14].y) / 2 * h]); s = np.linalg.norm(np.array([L[10].x * w, L[10].y * h]) - np.array([L[152].x * w, L[152].y * h])) * .32
        im = im.crop((int(c[0] - s), int(c[1] - s * .7), int(c[0] + s), int(c[1] + s * .7)))
    return im.resize((110, 77))
TW, TH = 110, 77 + 14
S = Image.new("RGB", (70 + TW * len(EV), TH * len(lags)), "black"); d = ImageDraw.Draw(S)
for r, L in enumerate(lags):
    d.text((4, r * TH + 30), f"lag {L:+.2f}", fill=(255, 255, 0))
    for c, (lab, t) in enumerate(EV):
        i = int(round((t - s0 + L) * fps)); x, y = 70 + c * TW, r * TH
        if 0 <= i < len(frames): S.paste(mouth(frames[i]), (x, y + 14))
        d.text((x + 3, y + 1), lab, fill=(255, 255, 255))
S.save(out, quality=90); print(out)
