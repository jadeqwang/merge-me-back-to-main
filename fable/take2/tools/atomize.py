#!/usr/bin/env python3
"""Film v3, b118-120 (vio_still): data for "she atomizes completely" (src/film.js atomize()).
   .venv/bin/python fable/take2/tools/atomize.py [--standin]
Writes work_fable/take2/kit/vio_still/atom/ (git-ignored, derived from the plate):
  track.json      camera track: per plate frame k (1-based) a 2x3 affine A_k taking frame-1 pixel coords to frame-k coords (the clip dollies
                  back), by ECC on the background (her and the dish's rim masked out of the error), 1280x720 plate pixels
  release.png     her release map in frame-1 coords: alpha 0 = not her; else R = release time tau (1..255 = 0..1): her outline first, the
                  inside later by distance from the outline (with a slow noise so the front is ragged, not a contour), the pale-blue circle
                  on her back last of all; a 9 px halo round her outline (tau ~0) so the cross to the clean plate takes her edge pixels too
  particles.json  her points: [x, y (frame-1 px), tau, r, g, b, seed] every 3 px inside her, the colour of her own pixels
  standin.jpg     (--standin) a clean plate of frame 1 without her: cv2 inpaint (Telea) of her dilated mask, then blurred inside it; a
                  layout stand-in until the plates agent's vio_empty lands
Her mask = the plate's matte (tools/matte.py, kit/vio_still/rgba) inside a hand-set polygon (the matte also took
the dish and its ring); the polygon here is on frame 1 (shots.js settle.poly was set on a later frame)."""
import json, os, sys, re
import numpy as np, cv2
from PIL import Image
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
P = os.path.join(ROOT, 'work_fable/take2/plates/vio_still'); K = os.path.join(ROOT, 'work_fable/take2/kit/vio_still')
OUT = os.path.join(K, 'atom'); os.makedirs(OUT, exist_ok=True)
meta = json.load(open(f'{P}/meta.json')); n = meta['n']
# her outline on plate frame 1, set by hand on a gridded crop (dev/v3/atom/grid1.jpg, checked as an overlay hermask.jpg); generous: the
# matte decides inside it, except below y 0.8 (the matte drops parts of her white soles against the white rim) and above y 0.2 (pencils)
poly = [[0.664, 0.04], [0.705, 0.04], [0.78, 0.01], [0.807, 0.17], [0.775, 0.27], [0.83, 0.31], [0.86, 0.45], [0.865, 0.62], [0.85, 0.7], [0.86, 0.83],
        [0.8, 0.855], [0.71, 0.865], [0.71, 0.975], [0.675, 0.975], [0.675, 0.87], [0.61, 0.875], [0.57, 0.9], [0.5, 0.905], [0.44, 0.87], [0.38, 0.83],
        [0.375, 0.76], [0.44, 0.7], [0.5, 0.62], [0.55, 0.56], [0.59, 0.515], [0.64, 0.5], [0.675, 0.44], [0.675, 0.33], [0.652, 0.24], [0.652, 0.12]]
fr = lambda k: np.asarray(Image.open(f'{P}/frames/f_{k:04d}.jpg').convert('RGB'))
F1 = fr(1); h, w, _ = F1.shape
ma = np.asarray(Image.open(f'{K}/rgba/f_0001.png'))[..., 3] > 128
pm = np.zeros((h, w), np.uint8); cv2.fillPoly(pm, [np.array([[x * w, y * h] for x, y in poly], np.int32)], 1)
yy = np.arange(h)[:, None] / h
her = ((ma | (yy > 0.8) | (yy < 0.2)) & (pm > 0)).astype(np.uint8)   # top band: the pencils and loose hair of her bun are not in the matte
her = cv2.morphologyEx(her, cv2.MORPH_CLOSE, np.ones((5, 5), np.uint8))
# ---- camera track: ECC affine frame 1 -> frame k on the background (her dilated, masked out)
bg = (cv2.dilate(her, np.ones((41, 41), np.uint8)) == 0).astype(np.uint8)
s = 0.5; g1 = cv2.resize(cv2.cvtColor(F1, cv2.COLOR_RGB2GRAY), None, fx=s, fy=s).astype(np.float32) / 255; m1 = cv2.resize(bg, None, fx=s, fy=s)
A = np.eye(2, 3, dtype=np.float32); track = {}
for k in range(1, n + 1):
    gk = cv2.resize(cv2.cvtColor(fr(k), cv2.COLOR_RGB2GRAY), None, fx=s, fy=s).astype(np.float32) / 255
    if k > 1:
        try: _, A = cv2.findTransformECC(g1, gk, A, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), m1, 5)
        except cv2.error as e: print('ECC failed at', k, e)
    # A maps frame-k coords (half res) to frame-1 coords? findTransformECC(template, input) gives warp with input(A x) ~ template(x):
    # x in frame-1 (template) coords -> A x in frame-k coords. Scale back to full res.
    M = A.astype(float).copy(); M[:, 2] /= s
    track[k] = [round(v, 6) for v in M.flatten()]
json.dump({'w': w, 'h': h, 'ref': 1, 'A': track}, open(f'{OUT}/track.json', 'w'))
print('track: frame', n, track[n])
# ---- release map
inside = cv2.distanceTransform(her, cv2.DIST_L2, 5); dmax = inside.max()
rng = np.random.default_rng(7)
noise = cv2.GaussianBlur(rng.standard_normal((h, w)).astype(np.float32), (0, 0), 18); noise /= noise.std() + 1e-6
hsv = cv2.cvtColor(F1, cv2.COLOR_RGB2HSV).astype(int)
blue = (her > 0) & (F1[..., 2].astype(int) > 180) & (F1[..., 2].astype(int) - F1[..., 0].astype(int) > 40) & (F1[..., 1].astype(int) > 150)
nb, lab, st, cen = cv2.connectedComponentsWithStats(blue.astype(np.uint8)); big = 1 + np.argmax(st[1:, cv2.CC_STAT_AREA]) if nb > 1 else 0
circ = (lab == big) if big else np.zeros_like(blue)
circ = cv2.morphologyEx(circ.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)); circ = cv2.dilate(circ, np.ones((7, 7), np.uint8)) & her
print('circle px', int(circ.sum()), 'bbox', cv2.boundingRect(circ))
dn = (inside / dmax) ** 0.7
# the back round the circle goes late too (so the circle is never a disc alone in the sky for long): + up to 0.2 near it
dc = cv2.distanceTransform((circ == 0).astype(np.uint8), cv2.DIST_L2, 5)
# order: half depth from her outline, half nearness to the circle, so the dissolving front closes in on her back from every side
# (her head, legs and hands go first, the circle's surroundings last); the circle itself 0.74-0.97 (its rim erodes with the last of the jacket)
near = 1 - np.clip(dc / max(1.0, float(dc[her > 0].max())), 0, 1)
f = 0.45 * dn + 0.55 * near ** 1.3
tau = np.clip(0.03 + 0.8 * f + 0.05 * noise, 0.02, 0.84)
cin = cv2.distanceTransform(circ, cv2.DIST_L2, 5); cmax = max(1, cin.max())
tau = np.where(circ > 0, 0.74 + 0.23 * (cin / cmax) ** 0.7, tau)
halo = (cv2.dilate(her, np.ones((19, 19), np.uint8)) > 0) & (her == 0)
rel = np.zeros((h, w, 4), np.uint8)
rel[..., 0] = np.where(her > 0, np.clip(1 + tau * 254, 1, 255), np.where(halo, 1, 0)); rel[..., 3] = np.where((her > 0) | halo, 255, 0)
Image.fromarray(rel, 'RGBA').save(f'{OUT}/release.png')
# ---- particles: every 3 px inside her
ys, xs = np.nonzero(her[1::3, 1::3]); ys = ys * 3 + 1; xs = xs * 3 + 1
pts = [[int(x), int(y), round(float(tau[y, x]), 4), *map(int, F1[y, x]), round(float(rng.random()), 4)] for x, y in zip(xs, ys)]
json.dump({'step': 3, 'n': len(pts), 'centre': [float(xs.mean()), float(ys.mean())], 'pts': pts}, open(f'{OUT}/particles.json', 'w'), separators=(',', ':'))
print('particles', len(pts), 'her px', int(her.sum()), 'dmax', round(float(dmax), 1))
if '--standin' in sys.argv:
    dm = cv2.dilate(her, np.ones((23, 23), np.uint8))
    bgr = cv2.cvtColor(F1, cv2.COLOR_RGB2BGR); ip = cv2.inpaint(bgr, dm, 9, cv2.INPAINT_TELEA)
    bl = cv2.GaussianBlur(ip, (0, 0), 6)
    # the sky behind her (above y 0.62): the plain star field at the right edge (x 1150-1280, y 0-320), tiled with mirroring; below it
    # the blurred inpaint, darkened (night ground and the rim's far side)
    sk = bgr[0:320, 1150:1280]; tile = np.vstack([np.hstack([sk, sk[:, ::-1]] * 6), np.hstack([sk[::-1], sk[::-1, ::-1]] * 6)])
    sky = np.tile(tile, (2, 1, 1))[:h, :w]; yy = np.arange(h)[:, None, None] / h
    wsky = np.clip((0.66 - yy) / 0.06, 0, 1)
    fill = sky * wsky + bl * (1 - wsky) * (0.25 + 0.75 * np.clip((yy - 0.8) / 0.06, 0, 1))
    a = cv2.GaussianBlur(dm.astype(np.float32), (0, 0), 3)[..., None]
    out = np.clip(bgr * (1 - a) + fill * a, 0, 255).astype(np.uint8); cv2.imwrite(f'{OUT}/standin.jpg', out, [cv2.IMWRITE_JPEG_QUALITY, 93])
    print('standin written')
