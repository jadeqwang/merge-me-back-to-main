#!/usr/bin/env python3
"""Shimmer fix for style-1 glyph plates of near-static shots (v10): where the SOURCE plate does not move, the glyph frame is replaced
by a slow cross-dissolve between glyph key frames one second apart (24 frames), so the background (and still parts of her) hold
their glyphs instead of re-drawing them every frame; where the source moves (hair in wind, the meteor, a blink, the mouth) the
frame's own glyphs are kept. Motion weight per pixel = |source frame - source key blend| (blurred), soft threshold.
  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/v10/freeze.py GLYPH_ID SOURCE_ID OUT_ID [first last] [--key 24]
"""
import os, sys, json, shutil
import numpy as np, cv2
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import gl10 as L

PL = os.path.join(L.ROOT, 'work_fable/take2/plates')
gid, sid, oid = sys.argv[1:4]
first = int(sys.argv[4]) if len(sys.argv) > 4 else 1
last = int(sys.argv[5]) if len(sys.argv) > 5 else json.load(open(f'{PL}/{gid}/meta.json'))['n']
KEY = int(sys.argv[sys.argv.index('--key') + 1]) if '--key' in sys.argv else 24
W, H = 1920, 1080
rg = lambda k: cv2.imread(f'{PL}/{gid}/frames/f_{k:04d}.jpg').astype(np.float32)
rs = lambda k: cv2.resize(cv2.imread(f'{PL}/{sid}/frames/f_{k:04d}.jpg'), (W, H), interpolation=cv2.INTER_CUBIC).astype(np.float32)
os.makedirs(f'{oid}' if os.path.isabs(oid) else f'{PL}/{oid}/frames', exist_ok=True)
out = f'{PL}/{oid}'
keys = list(range(first, last + 1, KEY))
if keys[-1] != last:
    keys.append(last)
n = json.load(open(f'{PL}/{gid}/meta.json'))['n']
for k in range(1, n + 1):
    kk = min(max(k, first), last)
    i = max(j for j in range(len(keys)) if keys[j] <= kk); ka = keys[i]; kb = keys[min(i + 1, len(keys) - 1)]
    ph = 0 if kb == ka else (kk - ka) / (kb - ka); ph = ph * ph * (3 - 2 * ph)
    G = rg(kk); Gk = rg(ka) * (1 - ph) + rg(kb) * ph
    S = rs(kk); Sk = rs(ka) * (1 - ph) + rs(kb) * ph
    mot = cv2.GaussianBlur(np.abs(S - Sk).mean(-1), (0, 0), 6)
    w = np.clip((mot - 4) / 10, 0, 1)
    w = cv2.dilate(w, np.ones((15, 15), np.uint8))
    w = cv2.GaussianBlur(w, (0, 0), 6)[..., None]
    o = Gk * (1 - w) + G * w
    cv2.imwrite(f'{out}/frames/f_{k:04d}.jpg', np.clip(o, 0, 255).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 93])
m = json.load(open(f'{PL}/{gid}/meta.json')); m['glyph'] = dict(m.get('glyph', {}), freeze=dict(key=KEY, src=sid, from_=gid))
json.dump(m, open(f'{out}/meta.json', 'w'))
shutil.copy(f'{out}/frames/f_{first:04d}.jpg', f'{out}/still.jpg')
if os.path.exists(f'{PL}/{gid}/REAL'):
    shutil.copy(f'{PL}/{gid}/REAL', f'{out}/REAL')
print(oid, 'done')
