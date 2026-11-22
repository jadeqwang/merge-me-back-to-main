#!/usr/bin/env python3
"""Film v9 B2 (Jade: "the bottom of the sneakers seem to slip a little bit", va05-va07): measure how far the standing shoe slides on
the ground, per plate frame. Measure only: nothing is written except an optional JSON and a sheet.
   work_fable/venv_hybrid/bin/python fable/take2/tools/slip.py PLATE K0 K1 [--kit KITDIR] [--door x0,y0,x1,y1] [--json out.json]
       [--sheet out.jpg] [--shift shift.json]
PLATE: work_fable/take2/plates/PLATE (frames 1-based). KIT: her cut-out (default work_fable/take2/kit/fig_<src plate>). --door: the
doorway as frame fractions (shots.js CROSS door): shoes are not searched inside it (some mattes take the door). --shift: a JSON
{k: [dx, dy]} of per-frame offsets already applied to her (to measure a fix before writing it).
Per frame k: shoes = white, unsaturated pixels of her matte (outside the door) in the lowest 15 % of her silhouette, blobs > 40 px;
each blob's TOE (front-most point: she runs to frame left) and SOLE (bottom). Ground motion k -> k+1: a RANSAC homography on ORB
features outside her (door, lane line, speed lines, grain). A shoe is STANDING in the pair when its sole is the lowest of the frame in
both and it moves less than 25 px against the ground. Slip = its travel minus the ground's at that point, per pair; printed per pair,
per stance run, and as the mean |slip| over standing pairs (plate px per plate frame)."""
import json, os, sys, numpy as np, cv2
a = [x for x in sys.argv[1:] if not x.startswith('--')]; opt = dict(zip(sys.argv[1:], sys.argv[2:]))
P, K0, K1 = a[0], int(a[1]), int(a[2])
PD = f'work_fable/take2/plates/{P}'; meta = json.load(open(f'{PD}/meta.json'))
KD = opt.get('--kit', f"work_fable/take2/kit/fig_{meta.get('src_plate', P)}")
SH = {int(k): v for k, v in json.load(open(opt['--shift'])).items()} if '--shift' in opt else {}
rd = lambda k: cv2.imread(f'{PD}/frames/f_{k:04d}.jpg')
F0 = rd(K0); H, W = F0.shape[:2]
def alpha(k):
    A = cv2.imread(f'{KD}/rgba/f_{k:04d}.png', cv2.IMREAD_UNCHANGED)[..., 3]
    if A.shape[:2] != (H, W): A = cv2.resize(A, (W, H))
    m = (A > 127).astype(np.uint8)
    if k in SH: m = cv2.warpAffine(m, np.float32([[1, 0, SH[k][0]], [0, 1, SH[k][1]]]), (W, H), flags=cv2.INTER_NEAREST)
    return m
DOOR = None
if '--door' in opt:
    d = [float(x) for x in opt['--door'].split(',')]; DOOR = (int(d[0] * W) - 6, int(d[1] * H) - 6, int(d[2] * W) + 6, int(d[3] * H) + 6)
def shoes(F, m):
    mm = m.copy()
    if DOOR: mm[DOOR[1]:DOOR[3], DOOR[0]:DOOR[2]] = 0
    nc, lab, st, _ = cv2.connectedComponentsWithStats(mm)
    if nc < 2: return []
    i = 1 + int(np.argmax(st[1:, 4])); her = lab == i   # her body: the largest piece outside the door
    ys, xs = np.nonzero(her); y1, y0 = ys.max(), ys.min()
    w = (F.min(axis=2) > 150) & ((F.max(axis=2).astype(int) - F.min(axis=2)) < 45) & (cv2.dilate(her.astype(np.uint8), np.ones((5, 5), np.uint8)) > 0)
    w[: int(y1 - 0.15 * (y1 - y0))] = False
    nc, lab, st, _ = cv2.connectedComponentsWithStats(w.astype(np.uint8)); out = []
    for j in range(1, nc):
        if st[j, 4] < 40: continue
        by, bx = np.nonzero(lab == j); sole = by.max()
        out.append(dict(toe=[float(bx.min()), float(by[bx <= bx.min() + 3].mean())], sole=float(sole), cx=float(bx.mean()), area=int(st[j, 4])))
    return sorted(out, key=lambda s: -s['sole'])
orb = cv2.ORB_create(3000); bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
def ground(Fa, ma, Fb, mb):
    ka, da = orb.detectAndCompute(cv2.cvtColor(Fa, cv2.COLOR_BGR2GRAY), (cv2.dilate(ma, np.ones((15, 15), np.uint8)) == 0).astype(np.uint8) * 255)
    kb, db = orb.detectAndCompute(cv2.cvtColor(Fb, cv2.COLOR_BGR2GRAY), (cv2.dilate(mb, np.ones((15, 15), np.uint8)) == 0).astype(np.uint8) * 255)
    if da is None or db is None: return np.eye(3), 0
    mt = sorted(bf.match(da, db), key=lambda x: x.distance)[:1000]
    if len(mt) < 12: return np.eye(3), 0
    Hm, inl = cv2.findHomography(np.float32([ka[x.queryIdx].pt for x in mt]), np.float32([kb[x.trainIdx].pt for x in mt]), cv2.RANSAC, 1.5, maxIters=4000)
    return (Hm if Hm is not None else np.eye(3)), int(inl.sum()) if inl is not None else 0
fr = {}
for k in range(K0, K1 + 1):
    F = rd(k)
    if k in SH: pass   # the shift is applied to the matte only; the frame is measured as given (use --shift with an un-fixed plate to predict)
    m = alpha(k); fr[k] = dict(F=F, m=m, s=shoes(F, m))
pairs, rows = [], []
for k in range(K0, K1):
    A, B = fr[k], fr[k + 1]
    if not A['s'] or not B['s']: rows.append([k, None]); continue
    Hm, inl = ground(A['F'], A['m'], B['F'], B['m'])
    s0, s1 = A['s'][0], B['s'][0]
    p = np.array([*s0['toe'], 1.0]); q = Hm @ p; q = q[:2] / q[2]
    sh0, sh1 = np.array(SH.get(k, [0, 0])), np.array(SH.get(k + 1, [0, 0]))
    gmove = q - np.array(s0['toe'])
    d = np.array(s1["toe"]) - np.array(s0["toe"]) - gmove   # (the toe is found with the shifted matte: it already includes the shift)
    standing = abs(s1['sole'] - s0['sole']) < 10 and np.hypot(*d) < 25
    rows.append([k, dict(toe0=s0['toe'], toe1=s1['toe'], ground=gmove.round(2).tolist(), slip=d.round(2).tolist(), standing=bool(standing), inl=inl)]); fr[k]['H'] = Hm
    if standing: pairs.append(d)
pairs = np.array(pairs) if pairs else np.zeros((0, 2))
runs, cur = [], []
for k, r in rows:
    if r and r['standing']: cur.append((k, r['slip']))
    elif cur: runs.append(cur); cur = []
if cur: runs.append(cur)
print(f'{P} frames {K0}-{K1}: standing pairs {len(pairs)}, mean slip {pairs.mean(axis=0).round(2).tolist() if len(pairs) else None} plate px/frame, '
      f'mean |slip| {np.hypot(pairs[:, 0], pairs[:, 1]).mean().round(2) if len(pairs) else None}, plate {W}x{H}')
for r in runs:
    v = np.array([x[1] for x in r]); print(f'  stance {r[0][0]}-{r[-1][0] + 1}: slip/frame {v.mean(axis=0).round(2).tolist()}, total {v.sum(axis=0).round(1).tolist()}')
if '--json' in opt: json.dump(dict(plate=P, k0=K0, k1=K1, W=W, H=H, rows=rows, runs=[[x[0] for x in r] for r in runs]), open(opt['--json'], 'w'))
# --- shoe tracking per stance run (robust to the heel-to-toe roll): the standing shoe at mid-stance is the template (its blob, grown 3 px),
# matched in every frame of the run (+1 frame either side) near where the ground carries it; slip_k = shoe_k - the mid shoe carried by the ground.
def carry(pt, ka, kb):   # a ground point in frame ka -> frame kb through the pairwise homographies
    q = np.array([*pt, 1.0])
    if kb >= ka:
        for k in range(ka, kb): q = fr[k].get('H', np.eye(3)) @ q; q = q / q[2]
    else:
        for k in range(ka - 1, kb - 1, -1): q = np.linalg.inv(fr[k].get('H', np.eye(3))) @ q; q = q / q[2]
    return q[:2]
def blobmask(F, m, sh):
    w = (F.min(axis=2) > 150) & ((F.max(axis=2).astype(int) - F.min(axis=2)) < 45); nc, lab, st, _ = cv2.connectedComponentsWithStats(w.astype(np.uint8))
    x, y = int(sh['toe'][0]), int(sh['sole'])
    best = None
    for j in range(1, nc):
        if st[j, 4] < 40: continue
        if st[j, 0] - 2 <= x <= st[j, 0] + st[j, 2] + 2 and st[j, 1] - 2 <= y <= st[j, 1] + st[j, 3] + 2: best = j
    return None if best is None else (lab == best)
track = {}
for r in runs:
    ks = list(range(max(K0, r[0][0] - 1), min(K1, r[-1][0] + 2) + 1)); mid = ks[len(ks) // 2]
    if not fr[mid]['s']: continue
    bm = blobmask(fr[mid]['F'], fr[mid]['m'], fr[mid]['s'][0])
    if bm is None: continue
    ys, xs = np.nonzero(bm); x0, y0, x1, y1 = xs.min() - 4, ys.min() - 4, xs.max() + 5, ys.max() + 5
    G = lambda k: cv2.cvtColor(fr[k]['F'], cv2.COLOR_BGR2GRAY).astype(np.float32)
    tpl = G(mid)[y0:y1, x0:x1]; tm = cv2.dilate(bm.astype(np.uint8), np.ones((7, 7), np.uint8))[y0:y1, x0:x1].astype(np.float32)
    for k in ks:
        c = carry([x0, y0], mid, k); R_ = 36; sx, sy = int(round(c[0])) - R_, int(round(c[1])) - R_
        win = G(k)[max(0, sy):sy + tpl.shape[0] + 2 * R_, max(0, sx):sx + tpl.shape[1] + 2 * R_]
        if win.shape[0] < tpl.shape[0] or win.shape[1] < tpl.shape[1]: continue
        res = cv2.matchTemplate(win, tpl, cv2.TM_SQDIFF, mask=tm); _, _, mn, _ = cv2.minMaxLoc(res)
        px, py = max(0, sx) + mn[0], max(0, sy) + mn[1]
        track[k] = dict(run=r[0][0], slip=[float(px - c[0]), float(py - c[1])], pos=[float(px), float(py)], box=[int(x0), int(y0), int(x1), int(y1)], mid=mid)
    v = [track[k]['slip'] for k in ks if k in track]
    if len(v) > 1:
        v = np.array(v); dv = np.diff(v, axis=0)
        print(f'  shoe track {ks[0]}-{ks[-1]} (mid {mid}): drift x {v[:, 0].min():.1f}..{v[:, 0].max():.1f}, y {v[:, 1].min():.1f}..{v[:, 1].max():.1f}; '
              f'mean |slip| {np.hypot(dv[:, 0], dv[:, 1]).mean():.2f} px/frame, max {np.hypot(dv[:, 0], dv[:, 1]).max():.1f}')
# --- flow measure (v9): DIS optical flow over the standing shoe's pixels, median, minus the ground's motion at its centre. Robust to the
# heel-to-toe roll (most of the shoe moves little while it rolls) and to shape changes. flow[k] = shoe slip k -> k+1 (plate px).
dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM); flow = {}
for k in range(K0, K1):
    A_, B_ = fr[k], fr[k + 1]
    if not A_['s'] or not B_['s'] or 'H' not in A_: continue
    bm = blobmask(A_['F'], A_['m'], A_['s'][0])
    if bm is None: continue
    fl = dis.calc(cv2.cvtColor(A_['F'], cv2.COLOR_BGR2GRAY), cv2.cvtColor(B_['F'], cv2.COLOR_BGR2GRAY), None)
    ys, xs = np.nonzero(bm); med = np.median(fl[ys, xs], axis=0); c = np.array([xs.mean(), ys.mean()])
    q = A_['H'] @ np.array([*c, 1.0]); gm = q[:2] / q[2] - c; d = med - gm
    st_ = abs(B_['s'][0]['sole'] - A_['s'][0]['sole']) < 10 and np.hypot(*d) < float(opt.get('--maxslip', 15))   # larger = a landing or a foot switch
    flow[k] = dict(slip=d.round(2).tolist(), standing=bool(st_), c=c.round(1).tolist())
fv = np.array([flow[k]['slip'] for k in flow if flow[k]['standing']])
if len(fv): print(f'FLOW SLIP {P}: standing pairs {len(fv)}, mean |slip| {np.hypot(fv[:, 0], fv[:, 1]).mean():.2f} px/plate frame, mean {fv.mean(axis=0).round(2).tolist()}, max {np.hypot(fv[:, 0], fv[:, 1]).max():.1f}')
print('  per pair (k: slip x,y; * = standing): ' + ' '.join(f"{k}:{flow[k]['slip'][0]:+.0f},{flow[k]['slip'][1]:+.0f}{'*' if flow[k]['standing'] else ''}" for k in sorted(flow)))
allv = []
for r in runs:
    ks = sorted(k for k in track if track[k]['run'] == r[0][0])
    for a_, b_ in zip(ks, ks[1:]): allv.append(np.hypot(*np.subtract(track[b_]['slip'], track[a_]['slip'])))
if allv: print(f'SHOE SLIP {P}: mean {np.mean(allv):.2f} px/plate frame over {len(allv)} stance pairs, max {np.max(allv):.1f}')
if '--offsets' in opt:   # v9 lock: offsets o_k for K0..KE. Standing pairs: o_{k+1} = o_k - slip_k (the shoe stays on the ground); flight and
    # landings unchanged; o = 0 at KE (--kend: the wipe frame, the plate's own frames from there), so she starts further back by the summed
    # slip (the plate's runner gains too little ground per stride) and catches up stance by stance. (Giving it back in the air instead was
    # tried: it runs her backwards in flight.)
    KE = int(opt.get('--kend', K1)); o = np.zeros(2); off = {KE: [0.0, 0.0]}
    for k in range(KE - 1, K0 - 1, -1):
        if k in flow and flow[k]['standing']: o = o + np.array(flow[k]['slip'])
        off[k] = o.round(2).tolist()
    json.dump({str(k): off[k] for k in sorted(off)}, open(opt['--offsets'], 'w'))
    print(f'offsets {K0}-{KE}: start {off[K0]} (plate px), 0 at {KE}')
if '--sheet' in opt:   # per stance run (the 3 longest): crops round the toe, red = the toe found, green = the run's first toe carried by the ground
    tiles = []
    for r in sorted(runs, key=len, reverse=True)[:3]:
        ks = [x[0] for x in r] + [r[-1][0] + 1]; g = np.array(fr[ks[0]]['s'][0]['toe'])
        for k in ks:
            F = fr[k]['F'].copy(); t = fr[k]['s'][0]['toe']
            cv2.drawMarker(F, (int(g[0]), int(g[1])), (0, 255, 0), cv2.MARKER_CROSS, 30, 1); cv2.circle(F, (int(t[0]), int(t[1])), 3, (0, 0, 255), -1)
            cx, cy = int(g[0]), int(g[1]); x0, y0 = max(0, cx - 90), max(0, cy - 70); c = F[y0:y0 + 120, x0:x0 + 180]
            c = cv2.resize(cv2.copyMakeBorder(c, 0, 120 - c.shape[0], 0, 180 - c.shape[1], cv2.BORDER_CONSTANT), (360, 240), interpolation=cv2.INTER_NEAREST)
            cv2.putText(c, str(k), (5, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2); tiles.append(c)
            if k in fr and 'H' in fr[k]: q = fr[k]['H'] @ np.array([*g, 1.0]); g = q[:2] / q[2]
        while len(tiles) % 8: tiles.append(np.zeros_like(tiles[0]))
    cv2.imwrite(opt['--sheet'], np.vstack([np.hstack(tiles[i:i + 8]) for i in range(0, len(tiles), 8)]), [cv2.IMWRITE_JPEG_QUALITY, 85])
