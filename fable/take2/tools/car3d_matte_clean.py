#!/usr/bin/env python3
"""car3d (film v8): clean the car_confess cut-out for the 3D car. Keeps the largest alpha component of each frame (drops stray belt
   fragments), writes premultiplied-free straight-alpha PNGs to KIT/clean/f_%04d.png and a bbox file.
   work_fable/venv_hybrid/bin/python fable/take2/tools/car3d_matte_clean.py work_fable/take2/kit/car_confess"""
import os, sys, json, cv2, numpy as np
kit = sys.argv[1]; src = os.path.join(kit, 'rgba'); out = os.path.join(kit, 'clean'); os.makedirs(out, exist_ok=True)
fs = sorted(f for f in os.listdir(src) if f.endswith('.png'))
for f in fs:
    im = cv2.imread(os.path.join(src, f), cv2.IMREAD_UNCHANGED); a = im[..., 3]
    n, lab, st, _ = cv2.connectedComponentsWithStats((a > 24).astype(np.uint8), 8)
    if n > 2:
        big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA])); keep = (lab == big).astype(np.uint8)
        keep = cv2.dilate(keep, np.ones((5, 5), np.uint8)); im[..., 3] = (a * keep).astype(np.uint8)
    cv2.imwrite(os.path.join(out, f), im)
json.dump({'n': len(fs), 'fps': 24, 'w': 1280, 'h': 720}, open(os.path.join(out, 'meta.json'), 'w'))
print(out, len(fs))
