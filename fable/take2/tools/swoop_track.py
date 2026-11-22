#!/usr/bin/env python3
"""Film v9 B4 (carried from v8: "purple branch drops at the 0:24.6 cut"): homographies of v7's swoop (ib11, raw v7 frames of seq 02) from
the cut frame to every later frame, so film.js can carry the code tree's violet branch into ib11 (the tree and the branch lie on the ground
plane: one homography per frame maps them exactly). Frame-to-frame ORB + RANSAC homography on the raw frames, composed from K0.
   work_fable/venv_hybrid/bin/python fable/take2/tools/swoop_track.py K0 K1 OUT.json [--sheet out.jpg]
K0 = the cut frame (film frame = round(t*30)), K1 = last frame tracked. Stops when inliers < 40 (the tree has left / blurred).
OUT: {"k0": K0, "H": {k: [9 floats, row-major, maps cut-frame pixels (1920x1080) to frame k pixels]}, "inl": {k: n}}"""
import json, sys, numpy as np, cv2
a = [x for x in sys.argv[1:] if not x.startswith('--')]; opt = dict(zip(sys.argv[1:], sys.argv[2:]))
K0, K1, OUT = int(a[0]), int(a[1]), a[2]
rd = lambda k: cv2.imread(f'work_fable/take2/v7/full/f_{k:05d}.jpg')
orb = cv2.ORB_create(5000); bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
def feats(F): return orb.detectAndCompute(cv2.cvtColor(F, cv2.COLOR_BGR2GRAY), None)
F = rd(K0); h, w = F.shape[:2]; sx, sy = w / 1920, h / 1080
S = np.diag([sx, sy, 1.0]); Si = np.linalg.inv(S)   # film px -> v7 px
kp, de = feats(F); Hc = np.eye(3); out = {str(K0): np.eye(3).ravel().tolist()}; inls = {}; frames = [(K0, F)]
for k in range(K0 + 1, K1 + 1):
    G = rd(k); kq, dq = feats(G)
    mt = sorted(bf.match(de, dq), key=lambda x: x.distance)[:1500]
    if len(mt) < 20: break
    Hm, inl = cv2.findHomography(np.float32([kp[x.queryIdx].pt for x in mt]), np.float32([kq[x.trainIdx].pt for x in mt]), cv2.RANSAC, 2.0, maxIters=5000)
    n = int(inl.sum()) if inl is not None else 0; inls[str(k)] = n
    if Hm is None or n < 40: print('stop at', k, 'inliers', n); break
    Hc = Hm @ Hc; Hf = Si @ Hc @ S; Hf = Hf / Hf[2, 2]; out[str(k)] = Hf.ravel().round(6).tolist(); kp, de = kq, dq; frames.append((k, G))
    print(k, 'inliers', n)
json.dump({'k0': K0, 'H': out, 'inl': inls}, open(OUT, 'w'))
if '--sheet' in opt:   # a test: the cut frame's right canopy tip region carried along (a red polyline across the canopy's right half)
    pts = np.float32([[x, 0.5 * 1080 - 0.25 * (x - 1300)] for x in np.linspace(1300, 1900, 20)]).reshape(-1, 1, 2)
    tiles = []
    for k, G in frames[::6]:
        Hf = np.array(out[str(k)]).reshape(3, 3); q = cv2.perspectiveTransform(pts, S @ Hf @ Si if False else Hf) * [sx, sy]
        G = G.copy(); cv2.polylines(G, [q.astype(np.int32)], False, (0, 0, 255), 3); tiles.append(cv2.resize(G, (480, 270)))
    while len(tiles) % 4: tiles.append(np.zeros_like(tiles[0]))
    cv2.imwrite(opt['--sheet'], np.vstack([np.hstack(tiles[i:i + 4]) for i in range(0, len(tiles), 4)]))
