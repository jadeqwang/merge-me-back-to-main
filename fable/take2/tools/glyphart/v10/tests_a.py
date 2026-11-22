#!/usr/bin/env python3
"""tests_A.jpg: A3 (catch, coarse) + three frames of the A4 merge (start, mid-fusion, nearly line) + one merge close-up strip.
Each row: a 1:1 crop of the 1920 frame (960x540 round the figure) | the whole frame downscaled to 640x360, shown 1:1.
  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/v10/tests_a.py OUT.jpg [catch_t] [merge_ts]"""
import os, sys
import numpy as np, cv2
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import gl10 as L
import coarse, merge

out = sys.argv[1]
ct = float(sys.argv[2]) if len(sys.argv) > 2 else 222.9
mts = [float(x) for x in (sys.argv[3] if len(sys.argv) > 3 else '223.3,225.6,229.6').split(',')]
rows = []


def row(f, cx, cy, label):
    x0 = int(np.clip(cx - 480, 0, 1920 - 960)); y0 = int(np.clip(cy - 270, 0, 1080 - 540))
    a = (np.clip(f[y0:y0 + 540, x0:x0 + 960], 0, 1) * 255).astype(np.uint8)[..., ::-1].copy()
    b = (cv2.resize(np.clip(f, 0, 1), (640, 360), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8)[..., ::-1]
    b = np.vstack([b, np.full((180, 640, 3), 30, np.uint8)])
    r = np.hstack([a, np.full((540, 8, 3), 255, np.uint8), b])
    cv2.putText(r, label, (12, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    cv2.putText(r, '640 px wide, 1:1', (980, 400), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (200, 200, 200), 1)
    rows.append(r)


c = coarse.Coarse('catch')
k = int(round((ct - c.o['t0']) * 24)) + 1
row(c.frame(k, ct), 960, 560, f'A3 catch {ct} (1920 crop 1:1)')
sc = merge.Scene()
for t in mts:
    row(sc.frame(t), 960, 520, f'A4 merge {t} (1920 crop 1:1)')
tmp = out.replace('.jpg', '_close.jpg')
merge.closeup(sc, 225.4, tmp)
cl = cv2.imread(tmp)
cl = cv2.resize(cl, (1608, int(cl.shape[0] * 1608 / cl.shape[1])))
rows.append(cl)
L.save  # noqa
cv2.imwrite(out, np.vstack([np.vstack([r, np.full((8, r.shape[1], 3), 255, np.uint8)]) for r in rows]), [cv2.IMWRITE_JPEG_QUALITY, 88])
print(out)
