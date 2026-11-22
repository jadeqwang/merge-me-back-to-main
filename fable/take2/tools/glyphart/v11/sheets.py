#!/usr/bin/env python3
"""v11 review sheets from saved test stills (no re-render):
  tests_A.jpg   A1 x3, A3 x2, A4 x10 (+ the I / 我 last-mark comparison at 640): each row 1920 crop 1:1 | 640 full 1:1
  notation_<life>.jpg  the life at x1.6 (top) and x1.0 (v9 size, bottom);  notation_all.jpg = every life at 640, x1.6
  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/v11/sheets.py
"""
import os, cv2, numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..'))
D = os.path.join(ROOT, 'work_fable/take2/dev/v11_glyph')
Y = (0, 255, 255)


def row(path, cx, cy, label):
    f = cv2.imread(path)
    f = cv2.resize(f, (1920, 1080)) if f.shape[1] != 1920 else f
    x0 = int(np.clip(cx - 480, 0, 960)); y0 = int(np.clip(cy - 270, 0, 540))
    a = f[y0:y0 + 540, x0:x0 + 960]
    b = np.vstack([cv2.resize(f, (640, 360), interpolation=cv2.INTER_AREA), np.full((180, 640, 3), 24, np.uint8)])
    r = np.hstack([a, np.full((540, 8, 3), 255, np.uint8), b]).copy()
    cv2.putText(r, label, (12, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, Y, 2)
    cv2.putText(r, '1920 crop 1:1', (12, 526), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 220, 220), 1)
    cv2.putText(r, '640 full 1:1', (980, 392), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 220, 220), 1)
    return r


def stack(rows, out):
    w = max(r.shape[1] for r in rows)
    rows = [np.hstack([r, np.zeros((r.shape[0], w - r.shape[1], 3), np.uint8)]) for r in rows]
    cv2.imwrite(out, np.vstack([np.vstack([r, np.full((8, w, 3), 255, np.uint8)]) for r in rows]), [cv2.IMWRITE_JPEG_QUALITY, 86])
    print(out)


rows = []
for t in ('203.500', '205.000', '206.500'):
    rows.append(row(f'{D}/a1/a_{t}.jpg', 1250, 620, f'A1 vb10 {t}: Merge letters, song order, small 46 px'))
rows.append(row(f'{D}/a3/c2_hands_221.300.jpg', 960, 400, 'A3 cb08 c2_hands 221.30: Merge lines, violet first'))
rows.append(row(f'{D}/a3/catch_222.900.jpg', 960, 640, 'A3 cb09 catch 222.90 (base: corpus-atlas style 1)'))
for t in ('224.000', '225.000', '226.500', '228.500', '228.800', '229.400', '230.000', '231.000', '231.300', '233.500'):
    rows.append(row(f'{D}/a4/m_{t}.jpg', 960, 600, f'A4 merge {t}'))
# I vs 我 at 640 (and 1920 crop), 230.5 and 231.0
cmp_ = []
for suf, lab in (('', 'I'), ('_wo', '我')):
    for t in ('230.720', '231.000'):
        f = cv2.imread(f'{D}/a4/m_{t}{suf}.jpg')
        s = cv2.resize(f, (640, 360), interpolation=cv2.INTER_AREA).copy()
        cv2.putText(s, f'last mark {"I" if lab == "I" else "wo"} {t} 640', (8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.55, Y, 2)
        cmp_.append(s)
rows.append(np.hstack([cmp_[0], np.full((360, 6, 3), 255, np.uint8), cmp_[1], np.full((360, 6, 3), 255, np.uint8), cmp_[2],
                       np.full((360, 6, 3), 255, np.uint8), cmp_[3]]))
cl = []
for suf in ('', '_wo'):
    f = cv2.imread(f'{D}/a4/m_230.720{suf}.jpg'); cl.append(f[300:700, 760:1160])
rows.append(np.hstack([cl[0], np.full((400, 6, 3), 255, np.uint8), cl[1]]))
stack(rows, f'{D}/tests_A.jpg')

# notation sheets
lives = ['piano', 'violin', 'wushu', 'wetlab', 'phd', 'poet', 'ames', 'band', 'chezjj', 'sandstorm', 'home', 'violet']
for l in lives:
    a, b = cv2.imread(f'{D}/notation_{l}_k16.jpg'), cv2.imread(f'{D}/notation_{l}_k10.jpg')
    if a is None or b is None:
        continue
    stack([a, b], f'{D}/notation_{l}.jpg')
import shutil
shutil.copy(f'{D}/notation_all_k16.jpg', f'{D}/notation_all.jpg')
