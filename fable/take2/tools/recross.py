#!/usr/bin/env python3
"""Film v4 item 1 (Jade: "green and blue's sneakers slip on the floor but others don't"): rebuild a crossing plate (b20-23) so the runner's
standing foot keeps its place on the floor. Nothing generated: a derived plate made from the plate's own frames.
   work_fable/venv_hybrid/bin/python fable/take2/tools/recross.py PLATE OUT_ID REF K0 KEND [--fill 20,116] [--slip auto|x,y] [--sheet out.jpg]
PLATE: work_fable/take2/plates/PLATE (frames 1-based, 24 fps); her cut-out: work_fable/take2/kit/fig_PLATE (tools/matte.py on the clip:
BiRefNet takes the doorway too). REF: a late frame with the doorway and no runner. K0..KEND: the frames rebuilt (KEND = the clip frame at
the shot's `reach`, where the wipe starts; from KEND on the frames are the plate's own). --fill: frames the uncovered ground is taken
from, in order of preference: negative = relative (k-8: a few frames earlier she was further back, so that patch of door was clear, and
the perspective is nearly the same), positive = absolute frames; each aligned onto k by a homography on the door (features outside her)
and used only where she is not within 5 px of it (her outline stroke lies outside the matte).
Per frame k: (1) REF is aligned onto k (ORB + RANSAC similarity on the ground, then a homography on the door once her mask is known); (2) her mask = the matte outside the doorway (REF's
matte, warped), and inside the doorway only where k differs from the aligned clean door (by > 26 levels), closed and holes filled (not grown: that carried a cream halo of door with her); the door mask is grown 3 px so the door's rim stays;
(3) her standing shoe = the lower white blob in her lowest 13 %, its TOE (front-most point: she runs to frame left) relative to the
doorway's foot (REF's door bottom-left corner mapped into k). The floor is black, so the doorway is the only floor mark the eye has; a
planted toe keeps its distance to it (the heel lifts, the toe stays). (4) slip = the mean travel per frame of the toe over stance pairs
(toe moves < 12 px); she is moved by o_k = slip x (KEND - k): she starts further back and gains the slip every frame (a constant extra
speed toward the doorway), reaching her own place at KEND. Drawn over the frame; the ground she uncovers is filled from the --fill frames.
Writes work_fable/take2/plates/OUT_ID/frames (all frames), meta.json (with the slip, K0, KEND), REAL, and prints the toe before/after."""
import json, os, sys, shutil, numpy as np, cv2
import scipy.ndimage as ndi
a = [x for x in sys.argv[1:] if not x.startswith('--')]; opt = dict(zip(sys.argv[1:], sys.argv[2:]))
P, OUT, REF, K0, KEND = a[0], a[1], int(a[2]), int(a[3]), int(a[4])
FILL = [int(x) for x in opt.get('--fill', str(REF)).split(',')]
PD, KD, OD = f'work_fable/take2/plates/{P}', f'work_fable/take2/kit/fig_{P}', f'work_fable/take2/plates/{OUT}'
meta = json.load(open(f'{PD}/meta.json')); n = meta['n']
rd = lambda k: cv2.imread(f'{PD}/frames/f_{k:04d}.jpg')
al = lambda k: cv2.imread(f'{KD}/rgba/f_{k:04d}.png', cv2.IMREAD_UNCHANGED)[..., 3].astype(np.float32) / 255
R = rd(REF); H, W = R.shape[:2]; doorR = (al(REF) > 0.5).astype(np.uint8)
_d = cv2.morphologyEx(doorR, cv2.MORPH_OPEN, np.ones((15, 15), np.uint8)); _n, _l, _st, _ = cv2.connectedComponentsWithStats(_d)   # the door alone (the lane line is thin)
_ys, _xs = np.nonzero(_l == 1 + int(np.argmax(_st[1:, 4]))); _bl = _ys > _ys.max() - 6; CORNER = np.array([_xs[_bl].min(), _ys.max(), 1.0])   # the doorway's foot (bottom-left) in REF
orb = cv2.ORB_create(4000); bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
kR, dR = orb.detectAndCompute(cv2.cvtColor(R, cv2.COLOR_BGR2GRAY), None)
def align(F, herA):
    m = (herA < 0.3).astype(np.uint8) * 255; kF, dF = orb.detectAndCompute(cv2.cvtColor(F, cv2.COLOR_BGR2GRAY), m)
    mt = sorted(bf.match(dR, dF), key=lambda x: x.distance)[:800]
    src = np.float32([kR[x.queryIdx].pt for x in mt]); dst = np.float32([kF[x.trainIdx].pt for x in mt])
    M, inl = cv2.estimateAffinePartial2D(src, dst, method=cv2.RANSAC, ransacReprojThreshold=2.0, maxIters=5000)
    return M, int(inl.sum())
def H3(M): return M if M.shape == (3, 3) else np.vstack([M, [0, 0, 1]])
def warp(img, M, interp=cv2.INTER_LINEAR): return cv2.warpPerspective(img, H3(M), (W, H), flags=interp, borderMode=cv2.BORDER_REPLICATE)
def homog(Fa, ma, Fb, mb):   # a -> b, features outside her (the door included), RANSAC homography
    ka, da = orb.detectAndCompute(cv2.cvtColor(Fa, cv2.COLOR_BGR2GRAY), (cv2.dilate(ma, np.ones((9, 9), np.uint8)) == 0).astype(np.uint8) * 255)
    kb, db = orb.detectAndCompute(cv2.cvtColor(Fb, cv2.COLOR_BGR2GRAY), (cv2.dilate(mb, np.ones((9, 9), np.uint8)) == 0).astype(np.uint8) * 255)
    mt = sorted(bf.match(da, db), key=lambda x: x.distance)[:1200]
    Hm, inl = cv2.findHomography(np.float32([ka[x.queryIdx].pt for x in mt]), np.float32([kb[x.trainIdx].pt for x in mt]), cv2.RANSAC, 1.5, maxIters=5000)
    return Hm, int(inl.sum())
def her_mask(F, A, M, thr=38):
    Rw = warp(R, M)
    dw = cv2.dilate(warp(doorR, M, cv2.INTER_NEAREST), np.ones((7, 7), np.uint8))   # grown: the door's rim is door, never her
    diff = np.abs(F.astype(np.int16) - Rw.astype(np.int16)).max(axis=2)
    on_door = cv2.morphologyEx((diff > thr).astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    m = ((A > 0.5) & ((dw == 0) | (on_door > 0))).astype(np.uint8)
    nc, lab, st, _ = cv2.connectedComponentsWithStats(m)   # keep her: the components of real size (drop specks and stray door edges)
    keep = np.zeros_like(m)
    if nc > 1:
        big = st[1:, 4].max()
        for i in range(1, nc):
            if st[i, 4] > 0.02 * big: keep[lab == i] = 1
    keep = cv2.morphologyEx(keep, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
    keep = ndi.binary_fill_holes(keep).astype(np.uint8)   # her silhouette is solid: white jacket on the cream door keys badly
    return keep, Rw   # not grown: a grown mask carries a cream halo of door with her (the ground under her is refilled from a grown area anyway)
def toe(F, m):
    ys, xs = np.nonzero(m)
    if len(ys) < 50: return None
    y1, y0 = ys.max(), ys.min(); shoe = (F.min(axis=2) > 150) & (m > 0); shoe[: int(y1 - 0.13 * (y1 - y0))] = False
    nc, lab, st, _ = cv2.connectedComponentsWithStats(shoe.astype(np.uint8)); bl = [i for i in range(1, nc) if st[i, 4] > 60]
    if not bl: return None
    i = max(bl, key=lambda i: st[i, 1] + st[i, 3]); return float(st[i, 0]), float(st[i, 1] + st[i, 3])
rows = {}
REL = [x for x in FILL if x < 0]; ABS = [x for x in FILL if x > 0]   # --fill: negative = frames before k (k-8: she was further back there)
need_k = set(range(K0, KEND + 1)) | set(ABS) | {k + d for k in range(K0, KEND + 1) for d in REL if k + d >= 1}
mR = np.zeros_like(doorR)
for k in sorted(need_k):
    F = rd(k); A = al(k); M, _ = align(F, A); m, Rw = her_mask(F, A, M)
    M, ninl = homog(R, mR, F, m); m, Rw = her_mask(F, A, M, 26)   # second pass: on the door itself, as a homography; finer key on the door
    dc = H3(M) @ CORNER; dc = dc[:2] / dc[2]
    rows[k] = dict(k=k, M=M, inl=ninl, toe=toe(F, m), door=dc.tolist(), mask=m)
v = []
for k in range(K0, KEND):
    a_, b_ = rows[k], rows[k + 1]
    if a_['toe'] is None or b_['toe'] is None: continue
    d = np.subtract(b_['toe'], a_['toe'])
    if np.hypot(*d) < 12: v.append(d - np.subtract(b_['door'], a_['door']))   # the same toe, down (a landing jumps); minus the doorway's travel
v = np.array(v); slip = v.mean(axis=0) if opt.get('--slip', 'auto') == 'auto' else np.array([float(x) for x in opt['--slip'].split(',')])
print(f'{P}: frames {K0}-{KEND}, stance pairs {len(v)}, mean toe slip against the doorway, plate px/frame {slip.round(2).tolist()}, sd {v.std(axis=0).round(2).tolist()}')
def inv(M): return cv2.invertAffineTransform(M)
def compose(A2, A1):   # A2 after A1 (2x3 affines)
    return (np.vstack([A2, [0, 0, 1]]) @ np.vstack([A1, [0, 0, 1]]))[:2]
os.makedirs(f'{OD}/frames', exist_ok=True)
for k in range(1, n + 1): shutil.copyfile(f'{PD}/frames/f_{k:04d}.jpg', f'{OD}/frames/f_{k:04d}.jpg')
sheet = []
for k in range(K0, KEND + 1):
    r = rows[k]; F = rd(k); M = r['M']; m = r['mask']
    o = slip * (KEND - k); T = np.float32([[1, 0, o[0]], [0, 1, o[1]]])
    # the ground she uncovers: from the --fill frames (warped into k), each only where she is not in it; the plate's own frame k elsewhere
    bg = F.astype(np.float32); need = cv2.dilate(m, np.ones((11, 11), np.uint8)).astype(bool); filled = np.zeros((H, W), bool)
    for j in [k + d for d in REL if k + d in rows] + ABS:
        if not need[~filled].any(): break
        Aj, _ = homog(rd(j), rows[j]['mask'], F, m); Fj = warp(rd(j), Aj)
        clear = warp(cv2.dilate(rows[j]['mask'], np.ones((11, 11), np.uint8)), Aj, cv2.INTER_NEAREST) == 0 if j != REF else np.ones((H, W), bool)
        use = need & ~filled & clear; bg[use] = Fj[use]; filled |= use
    hole = cv2.GaussianBlur(need.astype(np.float32), (0, 0), 1.2)[..., None]
    bg = F * (1 - hole) + bg * hole
    soft = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 0.8)
    mv = cv2.warpAffine(soft, T, (W, H))[..., None]; Fv = cv2.warpAffine(F, T, (W, H))
    out = (bg * (1 - mv) + Fv * mv).clip(0, 255).astype(np.uint8)
    cv2.imwrite(f'{OD}/frames/f_{k:04d}.jpg', out, [cv2.IMWRITE_JPEG_QUALITY, 95])
    t = r['toe']; dc = np.array(r['door']); rel = lambda p: [round(p[0] - dc[0], 1), round(p[1] - dc[1], 1)]
    print(k, 'inliers', r['inl'], 'toe - door: before', None if t is None else rel(t), 'after', None if t is None else rel((t[0] + o[0], t[1] + o[1])), 'offset', o.round(1).tolist(), 'unfilled px', int((need & ~filled).sum()))
    if '--sheet' in opt and (k - K0) % 3 == 0: sheet.append(cv2.resize(out, (640, 360)))
m2 = dict(meta); m2.update(dict(src_plate=P, recross=dict(ref=REF, fill=FILL, k0=K0, kend=KEND, slip=slip.round(3).tolist(), tool='fable/take2/tools/recross.py')))
json.dump(m2, open(f'{OD}/meta.json', 'w')); open(f'{OD}/REAL', 'w').close()
if os.path.exists(f'{PD}/still.jpg'): shutil.copyfile(f'{PD}/still.jpg', f'{OD}/still.jpg')
if sheet:
    while len(sheet) % 4: sheet.append(np.zeros_like(sheet[0]))
    cv2.imwrite(opt['--sheet'], np.vstack([np.hstack(sheet[i:i + 4]) for i in range(0, len(sheet), 4)]), [cv2.IMWRITE_JPEG_QUALITY, 85])
