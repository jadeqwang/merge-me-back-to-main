#!/usr/bin/env python3
"""Film v4 items 1 and 4: where a runner's feet are, per frame, from her cut-out's alpha (kit/<id>/rgba, tools/matte.py).
   work_fable/venv_hybrid/bin/python fable/take2/tools/feet.py KITDIR [f0 f1] [--ref PLATE_ID]
Per frame (1-based): the figure = alpha > 0.5; the feet = the figure's pixels in the bottom 9 % of its height, split into connected
blobs; for each of the two biggest blobs its sole (bottom y) and its x (mean x of the lowest 6 px of the blob). The lower sole is the
standing foot. --ref PLATE_ID: also the floor reference of a crossing plate (the doorway's bottom-left corner: the largest bright
component of the plate frame outside her figure), so slip = the standing foot's travel relative to the doorway.
Prints JSON {frames: [[k, bbox_h, [[x, sole_y], [x, sole_y]], ref_x, ref_y], ...]} in plate pixels."""
import json, sys, numpy as np, cv2
from PIL import Image
a = [x for x in sys.argv[1:] if not x.startswith('--')]; opts = dict(zip(sys.argv[1:], sys.argv[2:]))
K = a[0]; m = json.load(open(f'{K}/meta.json')); n = m['n']
f0, f1 = (int(a[1]), int(a[2])) if len(a) > 2 else (1, n)
ref = opts.get('--ref')
out = []
for k in range(f0, f1 + 1):
    al = np.asarray(Image.open(f'{K}/rgba/f_{k:04d}.png'))[..., 3] > 127
    ys, xs = np.nonzero(al)
    if len(ys) < 100: continue
    y0, y1 = ys.min(), ys.max(); hh = y1 - y0
    band = al.copy(); band[: int(y1 - 0.09 * hh)] = False
    nc, lab, st, cen = cv2.connectedComponentsWithStats(band.astype(np.uint8))
    blobs = sorted(range(1, nc), key=lambda i: -st[i, cv2.CC_STAT_AREA])[:2]
    feet = []
    for i in blobs:
        by, bx = np.nonzero(lab == i); sole = by.max(); low = by >= sole - 6
        feet.append([round(float(bx[low].mean()), 1), int(sole)])
    feet.sort(key=lambda f: -f[1])
    rx = ry = None
    if ref:
        im = np.asarray(Image.open(f'work_fable/take2/plates/{ref}/frames/f_{k:04d}.jpg').convert('RGB')).astype(int)
        b = ((im.min(axis=2) > 165) & ~cv2.dilate(al.astype(np.uint8), np.ones((9, 9), np.uint8)).astype(bool)).astype(np.uint8)
        b = cv2.morphologyEx(b, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
        nc2, lab2, st2, _ = cv2.connectedComponentsWithStats(b)
        if nc2 > 1:
            di = 1 + int(np.argmax(st2[1:, cv2.CC_STAT_AREA])); rx, ry = int(st2[di, 0]), int(st2[di, 1] + st2[di, 3])
    out.append([k, int(hh), feet, rx, ry])
print(json.dumps({'frames': out}, separators=(',', ':')))
