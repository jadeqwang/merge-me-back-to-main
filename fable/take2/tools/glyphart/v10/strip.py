#!/usr/bin/env python3
"""Test clip + frame strips of the catch passage as the glyph renderers draw it (no compositor overlays: no lyrics, no page-light):
cb08 c2_hands (coarse.py), cb09 catch (coarse.py), cb10-cb12 (merge.py), song t0..t1.
  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/v10/strip.py OUTDIR [t0 t1]
Writes OUTDIR/frames/f_%04d.jpg (960x540), strip_<a>_<b>.jpg (every 4th frame, 6 per row, 6 s per strip), clip.mp4 (with the song)."""
import os, sys, subprocess
import numpy as np, cv2
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import coarse, merge

out = sys.argv[1]; t0 = float(sys.argv[2]) if len(sys.argv) > 2 else 219.737; t1 = float(sys.argv[3]) if len(sys.argv) > 3 else 231.737
os.makedirs(f'{out}/frames', exist_ok=True)
C = {}; M = merge.Scene()
n = int(round((t1 - t0) * 24))
tiles = []
for i in range(n):
    t = t0 + i / 24
    if t < 221.436:
        c = C.setdefault('c2_hands', coarse.Coarse('c2_hands')); f = c.frame(min(c.n, int(round((t - c.o['t0']) * 24)) + 1), t); name = 'cb08'
    elif t < 223.135:
        c = C.setdefault('catch', coarse.Coarse('catch')); f = c.frame(min(c.n, int(round((t - c.o['t0']) * 24)) + 1), t); name = 'cb09'
    else:
        f = M.frame(t); name = 'cb10' if t < 226.532 else 'cb11' if t < 229.931 else 'cb12'
    im = (cv2.resize(np.clip(f, 0, 1), (960, 540), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8)[..., ::-1]
    cv2.imwrite(f'{out}/frames/f_{i + 1:04d}.jpg', im, [cv2.IMWRITE_JPEG_QUALITY, 90])
    if i % 4 == 0:
        tl = cv2.resize(im, (320, 180)).copy()
        cv2.putText(tl, f'{name} {t:.2f}', (6, 18), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 1)
        tiles.append(tl)
per = 36
for s in range(0, len(tiles), per):
    ch = tiles[s:s + per]
    while len(ch) % 6: ch.append(np.zeros_like(ch[0]))
    g = np.vstack([np.hstack(ch[r:r + 6]) for r in range(0, len(ch), 6)])
    a = t0 + s * 4 / 24
    cv2.imwrite(f'{out}/strip_{a:.1f}_{a + 6:.1f}.jpg', g, [cv2.IMWRITE_JPEG_QUALITY, 85])
root = merge.ROOT
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-framerate', '24', '-i', f'{out}/frames/f_%04d.jpg', '-ss', f'{t0:.3f}', '-t', f'{t1 - t0:.3f}',
                '-i', os.path.join(root, 'inputs/Merge (keychange down).wav'), '-map', '0:v', '-map', '1:a', '-c:v', 'libx264', '-crf', '18',
                '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-shortest', f'{out}/clip.mp4'], check=True)
print('done', out)
