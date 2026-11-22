#!/usr/bin/env python3
"""Contact sheet: labelled tiles in a grid, optional 1:1 crops beside each tile.
  sheet.py OUT.jpg --cols 3 --w 960 [--crop x,y,w,h] label=path ...
"""
import sys, argparse
import numpy as np, cv2

ap = argparse.ArgumentParser()
ap.add_argument('out'); ap.add_argument('items', nargs='+')
ap.add_argument('--cols', type=int, default=3); ap.add_argument('--w', type=int, default=960)
ap.add_argument('--crop', default='', help='x,y,w,h of a 1:1 crop (source px) shown under each tile')
a = ap.parse_args()
tiles = []
for it in a.items:
    lab, p = it.split('=', 1)
    im = cv2.imread(p)
    if im is None:
        print('missing', p); continue
    if im.shape[1] != 1920:
        im = cv2.resize(im, (1920, 1080), interpolation=cv2.INTER_CUBIC)
    h = a.w * im.shape[0] // im.shape[1]
    t = cv2.resize(im, (a.w, h), interpolation=cv2.INTER_AREA)
    if a.crop:
        x, y, w, hh = map(int, a.crop.split(','))
        c = im[y:y + hh, x:x + w]
        c = cv2.resize(c, (a.w, a.w * hh // w), interpolation=cv2.INTER_AREA if w > a.w else cv2.INTER_NEAREST)
        t = np.vstack([t, c])
    bar = np.full((34, a.w, 3), 18, np.uint8)
    cv2.putText(bar, lab, (8, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (230, 225, 215), 1, cv2.LINE_AA)
    tiles.append(np.vstack([bar, t]))
H = max(t.shape[0] for t in tiles)
tiles = [np.vstack([t, np.zeros((H - t.shape[0], a.w, 3), np.uint8)]) for t in tiles]
while len(tiles) % a.cols:
    tiles.append(np.zeros_like(tiles[0]))
rows = [np.hstack(tiles[i:i + a.cols]) for i in range(0, len(tiles), a.cols)]
cv2.imwrite(a.out, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 88])
print(a.out)
