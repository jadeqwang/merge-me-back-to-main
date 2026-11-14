#!/usr/bin/env python3
"""Film v3, b105-106 (vio_wide): track her feet and the plate's own violet road per frame, for the lane that is written only as far as
she has got. Prints a shots.js-ready ROAD track: [[clip s, lead foot x, foot y, road a, road b, rear foot x], ...] (plate fractions; road: y = a + b x).
   work_fable/venv_hybrid/bin/python fable/take2/tools/track_road.py PLATE_ID [every_n_frames]
Feet: pixels with min(R,G,B) > 150 (white trainers, the jacket is above the horizon) between y 0.78 and 0.97 below the black ground;
the cluster round their median x; lead = the foot furthest in the walking direction (left: min x; right: max x, by the track's sign).
Road: the violet pixels (B > G + 50, R > G + 20) below y 0.7 and more than 0.1 W from her feet, a least-squares line. Smoothed over 5 samples."""
import json, sys, numpy as np
from PIL import Image
pid = sys.argv[1]; every = int(sys.argv[2]) if len(sys.argv) > 2 else 3
D = f'work_fable/take2/plates/{pid}'; m = json.load(open(f'{D}/meta.json')); n, fps = m['n'], m.get('fps', 24)
rows = []
for k in range(1, n + 1, every):
    a = np.asarray(Image.open(f'{D}/frames/f_{k:04d}.jpg').convert('RGB')).astype(int); h, w, _ = a.shape
    yy = np.arange(h)[:, None]
    v = (a[..., 2] > a[..., 1] + 50) & (a[..., 0] > a[..., 1] + 20) & (yy > 0.7 * h)
    f = (a.min(axis=2) > 150) & (yy > 0.78 * h) & (yy < 0.97 * h)
    fy, fx = np.nonzero(f)
    if len(fx) < 30: continue
    mx = np.median(fx); s = np.abs(fx - mx) < 0.05 * w; xs, ys = fx[s], fy[s]
    # the road: violet pixels away from her (her trousers and strap are violet too), one line per frame
    vy, vx = np.nonzero(v); keep = np.abs(vx - mx) > 0.1 * w; vy, vx = vy[keep], vx[keep]
    b, c = np.polyfit(vx / w, vy / h, 1) if len(vx) > 20 else (np.nan, np.nan)
    rows.append([(k - 1) / fps, xs.min() / w, xs.max() / w, ys.max() / h, c, b])
R = np.array(rows); left = R[-1, 1] < R[0, 1]
lead = R[:, 1] if left else R[:, 2]; rear = R[:, 2] if left else R[:, 1]
sm = lambda x: np.convolve(np.pad(x, 2, mode='edge'), np.ones(5) / 5, mode='valid')
out = [[round(t, 3), round(x, 4), round(y, 4), round(a, 4), round(b, 4), round(r, 4)] for t, x, y, a, b, r in zip(R[:, 0], sm(lead), sm(R[:, 3]), sm(R[:, 4]), sm(R[:, 5]), sm(rear))]
print(json.dumps({'id': pid, 'dir': 'left' if left else 'right', 'track': out[::2] + ([out[-1]] if len(out) % 2 == 0 else [])}, separators=(',', ':')))
