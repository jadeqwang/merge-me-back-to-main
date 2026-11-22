#!/usr/bin/env python3
"""Film v9 B2 (Jade: "the bottom of the sneakers seem to slip a little bit", va05-va07): rebuild a crossing plate so the standing shoe
stays on the ground, from per-frame offsets measured by tools/slip.py (--offsets). Nothing generated: the plate's own frames.
   work_fable/venv_hybrid/bin/python fable/take2/tools/relock.py PLATE OUT_ID OFFSETS.json [--kit KITDIR] [--ref R] [--door x0,y0,x1,y1] [--keylane R] [--fill -6,...,aNNN]
       [--fill -6,-10,-14,-20,6,10,14] [--sheet out.jpg]
Per frame k in OFFSETS (k: [dx, dy], plate px): her = the kit matte (> 0.5), its components of real size (outside --door when the matte
takes the doorway), grown 2 px (her ink outline lies just outside the matte), softened; she is moved by o_k and drawn over the ground,
the ground she uncovers is filled from the --fill frames (relative to k), each aligned onto k by a RANSAC homography on features outside
her, used only where she is not within 7 px of it; the plate's own frame k is kept where nothing clean is found. Other frames are copied.
Writes work_fable/take2/plates/OUT_ID/frames, meta.json (src_plate, offsets), REAL."""
import json, os, sys, shutil, numpy as np, cv2
a = [x for x in sys.argv[1:] if not x.startswith('--')]; opt = dict(zip(sys.argv[1:], sys.argv[2:]))
P, OUT, OFF = a[0], a[1], {int(k): v for k, v in json.load(open(a[2])).items()}
PD, OD = f'work_fable/take2/plates/{P}', f'work_fable/take2/plates/{OUT}'; meta = json.load(open(f'{PD}/meta.json')); n = meta['n']
KD = opt.get('--kit', f'work_fable/take2/kit/fig_{P}')
FILL = [x for x in opt.get('--fill', '-6,-10,-14,-20,6,10,14,20').split(',')]   # 'aNNN' = an absolute frame (e.g. the empty doorway)
rd = lambda k: cv2.imread(f'{PD}/frames/f_{k:04d}.jpg'); F0 = rd(1); H, W = F0.shape[:2]
DOOR = None
if '--door' in opt:
    d = [float(x) for x in opt['--door'].split(',')]; DOOR = (int(d[0] * W) - 6, int(d[1] * H) - 6, int(d[2] * W) + 6, int(d[3] * H) + 6)
orb = cv2.ORB_create(4000); bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
def homog(Fa, ma, Fb, mb):
    ka, da = orb.detectAndCompute(cv2.cvtColor(Fa, cv2.COLOR_BGR2GRAY), (cv2.dilate(ma, np.ones((15, 15), np.uint8)) == 0).astype(np.uint8) * 255)
    kb, db = orb.detectAndCompute(cv2.cvtColor(Fb, cv2.COLOR_BGR2GRAY), (cv2.dilate(mb, np.ones((15, 15), np.uint8)) == 0).astype(np.uint8) * 255)
    mt = sorted(bf.match(da, db), key=lambda x: x.distance)[:1200]
    Hm, _ = cv2.findHomography(np.float32([ka[x.queryIdx].pt for x in mt]), np.float32([kb[x.trainIdx].pt for x in mt]), cv2.RANSAC, 1.5, maxIters=5000)
    return Hm if Hm is not None else np.eye(3)
mcache = {}
# --keylane R (v9 va07): the matte takes the lane line (a strip down to the frame edge). The lane's place = lane-green pixels of the empty
# frame R (static camera), grown 15 px (its ink edges, a little drift); there only her shoes (white) and trousers (navy) count as her.
LANEW = None
if '--keylane' in opt:
    _R = cv2.imread(f"{PD}/frames/f_{int(opt['--keylane']):04d}.jpg").astype(int); _R[: int(0.3 * _R.shape[0])] = 0
    LANEW = cv2.dilate(((_R[..., 1] > _R[..., 2] + 30) & (_R[..., 1] > 80) & (_R[..., 1] >= _R[..., 0] - 15)).astype(np.uint8), np.ones((15, 15), np.uint8)) > 0
def herpx(k):
    F = rd(k).astype(int); b_, g_, r_ = F[..., 0], F[..., 1], F[..., 2]
    return (F.min(axis=2) > 150) | ((b_ > r_ + 15) & (b_ > g_) & (F.max(axis=2) < 140))
# --ref R: the matte takes the doorway (wetlab, hackerhouses): frame R has the doorway and no runner; its matte (the door) is carried
# into k by a homography on the ground (features outside k's matte), grown 7 px, and removed from her, except where frame k differs from
# the carried clean door by > 26 (she is in front of it). As tools/recross.py her_mask.
REF = int(opt['--ref']) if '--ref' in opt else None
def alpha(k):
    A = cv2.imread(f'{KD}/rgba/f_{k:04d}.png', cv2.IMREAD_UNCHANGED)[..., 3]
    if A.shape[:2] != (H, W): A = cv2.resize(A, (W, H))
    return (A > 127).astype(np.uint8)
if REF:
    FR = cv2.imread(f'{PD}/frames/f_{REF:04d}.jpg'); doorR = alpha(REF)
    doorR = cv2.morphologyEx(doorR, cv2.MORPH_OPEN, np.ones((15, 15), np.uint8))
def her(k):
    if k in mcache: return mcache[k]
    m = alpha(k)
    if REF:
        F = rd(k); Hm = homog(FR, doorR, F, m)
        Rw = cv2.warpPerspective(FR, Hm, (W, H), borderMode=cv2.BORDER_REPLICATE)
        dw = cv2.dilate(cv2.warpPerspective(doorR, Hm, (W, H), flags=cv2.INTER_NEAREST), np.ones((7, 7), np.uint8))
        diff = np.abs(F.astype(np.int16) - Rw.astype(np.int16)).max(axis=2)
        on = cv2.morphologyEx((diff > 26).astype(np.uint8), cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
        m = (m & ((dw == 0) | (on > 0))).astype(np.uint8)
        m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (11, 11)))
        import scipy.ndimage as ndi; m = ndi.binary_fill_holes(m).astype(np.uint8)
    if DOOR: m[DOOR[1]:DOOR[3], DOOR[0]:DOOR[2]] = 0
    if '--keylane' in opt: m[LANEW & ~herpx(k)] = 0
    nc, lab, st, _ = cv2.connectedComponentsWithStats(m); keep = np.zeros_like(m)
    if nc > 1:
        big = st[1:, 4].max()
        for i in range(1, nc):
            if st[i, 4] > (0.15 if '--keylane' in opt else 0.02) * big: keep[lab == i] = 1
    keep = cv2.dilate(keep, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (5, 5)))
    if '--keylane' in opt: keep[LANEW & ~herpx(k)] = 0   # (again after the dilation)
    mcache[k] = keep; return keep
os.makedirs(f'{OD}/frames', exist_ok=True)
for k in range(1, n + 1): shutil.copyfile(f'{PD}/frames/f_{k:04d}.jpg', f'{OD}/frames/f_{k:04d}.jpg')
sheet = []
for k in sorted(OFF):
    o = OFF[k]; F = rd(k); m = her(k)
    if abs(o[0]) < 0.25 and abs(o[1]) < 0.25: continue
    T = np.float32([[1, 0, o[0]], [0, 1, o[1]]])
    need = cv2.dilate(m, np.ones((9, 9), np.uint8)).astype(bool); filled = np.zeros((H, W), bool); bg = F.astype(np.float32)
    for d in FILL:
        j = int(d[1:]) if d.startswith('a') else k + int(d)
        if j < 1 or j > n or not need[~filled].any(): continue
        Fj, mj = rd(j), her(j); Hm = homog(Fj, mj, F, m); Fw = cv2.warpPerspective(Fj, Hm, (W, H), borderMode=cv2.BORDER_REPLICATE)
        clear = cv2.warpPerspective(cv2.dilate(mj, np.ones((15, 15), np.uint8)), Hm, (W, H), flags=cv2.INTER_NEAREST) == 0
        use = need & ~filled & clear; bg[use] = Fw[use]; filled |= use
    hole = cv2.GaussianBlur(need.astype(np.float32), (0, 0), 1.2)[..., None]; bg = F * (1 - hole) + bg * hole
    soft = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 0.8)
    mv = cv2.warpAffine(soft, T, (W, H))[..., None]; Fv = cv2.warpAffine(F, T, (W, H), flags=cv2.INTER_LINEAR)
    out = (bg * (1 - mv) + Fv * mv).clip(0, 255).astype(np.uint8)
    cv2.imwrite(f'{OD}/frames/f_{k:04d}.jpg', out, [cv2.IMWRITE_JPEG_QUALITY, 95])
    print(k, 'offset', o, 'unfilled px', int((need & ~filled).sum()))
    if '--sheet' in opt and k % 3 == 0: sheet.append(cv2.resize(out, (640, 360)))
m2 = dict(meta); m2.update(dict(src_plate=meta.get('src_plate', P), relock=dict(plate=P, offsets=a[2], fill=FILL, tool='fable/take2/tools/relock.py')))
json.dump(m2, open(f'{OD}/meta.json', 'w')); open(f'{OD}/REAL', 'w').close()
if sheet:
    while len(sheet) % 4: sheet.append(np.zeros_like(sheet[0]))
    cv2.imwrite(opt['--sheet'], np.vstack([np.hstack(sheet[i:i + 4]) for i in range(0, len(sheet), 4)]), [cv2.IMWRITE_JPEG_QUALITY, 85])
