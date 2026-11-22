#!/usr/bin/env python3
"""Contact sheet of plate frames with a 1920x1080 coordinate grid (every 120 px), to place focus ellipses.
  gridsheet.py PLATE_DIR OUT.jpg [frames, e.g. 1,30,60,90,121] [--focus-json F] """
import sys, os, json, cv2, numpy as np
d, out = sys.argv[1], sys.argv[2]
ks = [int(x) for x in (sys.argv[3] if len(sys.argv) > 3 and not sys.argv[3].startswith('--') else '1,30,60,90,121').split(',')]
fj = sys.argv[sys.argv.index('--focus-json') + 1] if '--focus-json' in sys.argv else None
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
tiles = []
for k in ks:
    p = os.path.join(d, 'frames', f'f_{k:04d}.jpg') if os.path.isdir(os.path.join(d, 'frames')) else os.path.join(d, f'f_{k:04d}.jpg')
    im = cv2.resize(cv2.imread(p), (1920, 1080))
    for x in range(0, 1920, 120):
        cv2.line(im, (x, 0), (x, 1079), (0, 255, 255) if x % 480 == 0 else (0, 140, 140), 1)
        cv2.putText(im, str(x), (x + 3, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)
    for y in range(0, 1080, 120):
        cv2.line(im, (0, y), (1919, y), (0, 255, 255) if y % 480 == 0 else (0, 140, 140), 1)
        cv2.putText(im, str(y), (3, y + 28), cv2.FONT_HERSHEY_SIMPLEX, 0.9, (0, 255, 255), 2)
    if fj:
        import importlib; A = importlib.import_module('animate')
        for (cx, cy, rx, ry) in A.focus_at(json.load(open(fj)), k):
            cv2.ellipse(im, (int(cx), int(cy)), (int(rx), int(ry)), 0, 0, 360, (255, 0, 255), 3)
    cv2.putText(im, f'f{k}', (1700, 1050), cv2.FONT_HERSHEY_SIMPLEX, 2, (0, 0, 255), 4)
    tiles.append(cv2.resize(im, (960, 540), interpolation=cv2.INTER_AREA))
while len(tiles) % 2: tiles.append(np.zeros_like(tiles[0]))
rows = [np.hstack(tiles[i:i + 2]) for i in range(0, len(tiles), 2)]
cv2.imwrite(out, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 80])
