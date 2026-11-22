#!/usr/bin/env python3
"""Review sheets for a glyph plate: (1) strip of 8 frames source|glyph at phone size (640 px), (2) a 1:1 crop pair, (3) the
mouth/eye check: per-frame mean darkness in a box (e.g. the mouth) in source vs glyph, correlation printed.
  review.py SRC_PLATE GLYPH_PLATE OUTBASE [--box x0,y0,x1,y1 (1920x1080)] [--crop x0,y0,x1,y1]"""
import sys, os, cv2, numpy as np
a = sys.argv; src, gl, ob = a[1], a[2], a[3]
opt = {a[i][2:]: a[i + 1] for i in range(4, len(a) - 1, 2)}
n = len(os.listdir(os.path.join(gl, 'frames')))
rd = lambda d, k: cv2.resize(cv2.imread(os.path.join(d, 'frames', f'f_{k:04d}.jpg')), (1920, 1080), interpolation=cv2.INTER_CUBIC)
ks = np.linspace(1, n, 8).astype(int)
rows = [cv2.hconcat([cv2.resize(rd(src, k), (640, 360), interpolation=cv2.INTER_AREA), cv2.resize(rd(gl, k), (640, 360), interpolation=cv2.INTER_AREA)]) for k in ks]
cv2.imwrite(ob + '_phone.jpg', cv2.vconcat([cv2.hconcat(rows[i:i + 2]) for i in range(0, 8, 2)]), [cv2.IMWRITE_JPEG_QUALITY, 82])
if 'crop' in opt:
    x0, y0, x1, y1 = map(int, opt['crop'].split(','))
    k = ks[3]; cv2.imwrite(ob + '_crop.jpg', cv2.hconcat([rd(src, k)[y0:y1, x0:x1], rd(gl, k)[y0:y1, x0:x1]]))
if 'box' in opt:
    x0, y0, x1, y1 = map(int, opt['box'].split(','))
    s = []; g = []
    for k in range(1, n + 1):
        s.append(255 - cv2.cvtColor(rd(src, k)[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY).mean()); g.append(255 - cv2.cvtColor(rd(gl, k)[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY).mean())
    s, g = np.array(s), np.array(g)
    print(f'box darkness corr {np.corrcoef(s, g)[0, 1]:.3f}  (source range {s.min():.1f}-{s.max():.1f}, glyph {g.min():.1f}-{g.max():.1f})')
    np.savetxt(ob + '_box.txt', np.c_[s, g], fmt='%.2f')
