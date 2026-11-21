#!/usr/bin/env python3
"""Film v7 (Jade: "if she has one pencil in the hand, there should only be one pencil in the hair"): remove ONE bun pencil from a
plate, frame by frame, without regenerating the clip.

  .venv/bin/python fable/take2/gen/bun_pencil_v7.py SRC_FRAMES_DIR OUT_PLATE_DIR KEY:EDIT.jpg [KEY:EDIT.jpg ...] [--roi=x0,y0,x1,y1]

The pencil removed is the one that runs lower-left to upper-right through the bun (eraser up-right); the other (tip up-left, eraser
down-right) stays. Per frame:
  1. pencil pixels by colour (yellow wood, purple eraser) inside the head ROI; connected parts whose axis rises to the right are the
     removed pencil; each part is extended along its axis past both ends (the sharpened cone and the ferrule are not yellow) and
     dilated -> mask, feathered.
  2. the clean content comes from an image edit of a keyframe (one reference, pencil painted out by the model) registered onto
     that keyframe (ECC affine, pencils masked out), then carried to frame t by an ECC affine track of the head ROI (keyframe -> t).
     With several keyframes, each frame uses the keyframe whose tracked warp correlates best on the ROI.
  3. frame t = original outside the mask, tracked clean content inside (soft edge). If the best keyframe track scores below CCMIN (a
     fast head turn), the previous output frame is carried one step instead (frame-to-frame ECC, chain). --frames=a-b redoes only those frames.
Writes OUT/frames/f_NNNN.jpg (q 2 like intake), OUT/bun_track.json (per frame: key used, ECC score, mask px, residual B px).
"""
import cv2, json, os, sys, glob
import numpy as np

args = [a for a in sys.argv[1:] if not a.startswith("--")]
SRC, OUT = args[0], args[1]
KEYS = [(int(k.split(":", 1)[0]), k.split(":", 1)[1]) for k in args[2:]]
ROI = (820, 0, 1060, 210)
CCMIN = 0.90
ONLY = None   # --frames=a-b: redo only those frames (the rest of bun_track.json is kept)
for a in sys.argv[1:]:
    if a.startswith("--roi="): ROI = tuple(int(v) for v in a[6:].split(","))
    if a.startswith("--frames="): ONLY = tuple(int(v) for v in a[9:].split("-"))
x0, y0, x1, y1 = ROI
files = sorted(glob.glob(os.path.join(SRC, "f_*.jpg")))
os.makedirs(os.path.join(OUT, "frames"), exist_ok=True)

def pencil_px(img):
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
    h, s, v = hsv[..., 0], hsv[..., 1], hsv[..., 2]
    wood = (h >= 8) & (h <= 32) & (s > 70) & (v > 70)
    eras = (h >= 115) & (h <= 160) & (s > 50) & (v > 60)
    m = np.zeros(img.shape[:2], np.uint8); m[y0:y1, x0:x1] = ((wood | eras)[y0:y1, x0:x1]).astype(np.uint8)
    return m

def b_mask(img, ext=11, grow=5):
    """mask of the up-right pencil; returns (mask uint8 0/255, n raw px)"""
    m = pencil_px(img)
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    out = np.zeros_like(m); raw = 0
    for i in range(1, n):
        if st[i, cv2.CC_STAT_AREA] < 25: continue
        ys, xs = np.nonzero(lab == i)
        pts = np.stack([xs, ys], 1).astype(np.float32); c = pts.mean(0)
        u, s_, vt = np.linalg.svd(pts - c, full_matrices=False); d = vt[0]
        if s_[0] < 2.0 * max(s_[1], 1e-3): continue          # not elongated
        if d[0] * d[1] >= 0: continue                       # axis falls to the right: the pencil that stays
        t = (pts - c) @ d; a, b = c + d * (t.min() - ext), c + d * (t.max() + ext)
        w = max(4, int(round(3.46 * s_[1] / np.sqrt(len(pts)))))
        cv2.line(out, tuple(np.round(a).astype(int)), tuple(np.round(b).astype(int)), 255, int(w + 2 * grow))
        out[lab == i] = 255; raw += len(pts)
    out = cv2.dilate(out, np.ones((3, 3), np.uint8))
    return out, raw

def ecc(tmpl, img, mask, warp=None):
    warp = np.eye(2, 3, dtype=np.float32) if warp is None else warp.copy()
    try:
        cc, warp = cv2.findTransformECC(tmpl, img, warp, cv2.MOTION_AFFINE,
                                        (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), mask, 5)
    except cv2.error:
        cc = -1
    return cc, warp

def gray(img): return cv2.GaussianBlur(cv2.cvtColor(img, cv2.COLOR_BGR2GRAY), (0, 0), 1.2).astype(np.float32)

H, W = cv2.imread(files[0]).shape[:2]
roi_m = np.zeros((H, W), np.uint8); roi_m[y0:y1, x0:x1] = 255

# keyframes: register the edit onto its keyframe (ECC affine over ROI grown, pencils masked out)
keys = []
for k, path in KEYS:
    kf = cv2.imread(files[k - 1]); ed = cv2.resize(cv2.imread(path), (W, H), interpolation=cv2.INTER_AREA)
    big = np.zeros((H, W), np.uint8); big[max(0, y0 - 40):min(H, y1 + 120), max(0, x0 - 120):min(W, x1 + 60)] = 255
    pm = cv2.dilate(np.maximum(pencil_px(kf), pencil_px(ed)) * 255, np.ones((9, 9), np.uint8))
    m = cv2.bitwise_and(big, cv2.bitwise_not(pm))
    cc, wa = ecc(gray(kf), gray(ed), m)
    edw = cv2.warpAffine(ed, wa, (W, H), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REPLICATE)
    print(f"key {k}: edit registered cc={cc:.3f} warp={np.round(wa, 4).tolist()}", flush=True)
    keys.append(dict(k=k, img=kf, g=gray(kf), clean=edw, pm=pm, prev=None))

rec = []
LAST = None
for fi, f in enumerate(files, 1):
    if ONLY and not (ONLY[0] - 1 <= fi <= ONLY[1]): continue
    if ONLY and fi == ONLY[0] - 1:   # seed the chain from the frame already written
        img = cv2.imread(f); out = cv2.imread(os.path.join(OUT, "frames", os.path.basename(f))); mb, _ = b_mask(img); LAST = (gray(img), out, mb); continue
    img = cv2.imread(f); g = gray(img)
    mb, raw = b_mask(img)
    excl = cv2.dilate(np.maximum(pencil_px(img) * 255, mb), np.ones((9, 9), np.uint8))
    best = None
    for K in keys:
        m = cv2.bitwise_and(roi_m, cv2.bitwise_not(np.maximum(excl, K["pm"])))
        cands = [K["prev"], None]
        (dx, dy), _ = cv2.phaseCorrelate(K["g"][y0:y1, x0:x1], g[y0:y1, x0:x1])
        cands.append(np.array([[1, 0, dx], [0, 1, dy]], np.float32))
        cc, wa = max((ecc(K["g"], g, m, w0) for w0 in cands), key=lambda r: r[0])
        K["prev"] = wa
        if best is None or cc > best[0]: best = (cc, wa, K)
    cc, wa, K = best
    clean = cv2.warpAffine(K["clean"], wa, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)   # key coords -> frame t
    # mask also covers where the keyframe's pencil sits after the track (guards a missed colour part)
    kb, _ = b_mask(K["img"])
    kbw = cv2.warpAffine(kb, wa, (W, H), flags=cv2.INTER_NEAREST)
    mask = np.maximum(mb, kbw)
    soft = cv2.GaussianBlur(mask.astype(np.float32) / 255.0, (0, 0), 2.0)
    soft = np.clip(soft * 1.6, 0, 1)[..., None]
    out = (img * (1 - soft) + clean * soft).round().clip(0, 255).astype(np.uint8)
    how = "track"
    if cc < CCMIN and LAST is not None:   # the keyframe track failed (fast head turn): carry the previous clean frame one step (chain)
        m = cv2.bitwise_and(roi_m, cv2.bitwise_not(np.maximum(excl, LAST[2])))
        (dx, dy), _ = cv2.phaseCorrelate(LAST[0][y0:y1, x0:x1], g[y0:y1, x0:x1])
        c2, w2 = max((ecc(LAST[0], g, m, w0) for w0 in (None, np.array([[1, 0, dx], [0, 1, dy]], np.float32))), key=lambda r: r[0])
        lb = cv2.warpAffine(LAST[2], w2, (W, H), flags=cv2.INTER_NEAREST)
        mask = np.maximum(mb, lb)
        soft = np.clip(cv2.GaussianBlur(mask.astype(np.float32) / 255.0, (0, 0), 2.0) * 1.6, 0, 1)[..., None]
        clean = cv2.warpAffine(LAST[1], w2, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
        out = (img * (1 - soft) + clean * soft).round().clip(0, 255).astype(np.uint8); how = f"chain {c2:.3f}"
    LAST = (g, out, mask)
    _, resid = b_mask(out)
    cv2.imwrite(os.path.join(OUT, "frames", os.path.basename(f)), out, [cv2.IMWRITE_JPEG_QUALITY, 95])
    rec.append(dict(f=fi, how=how, key=K["k"], cc=round(float(cc), 4), mask=int((mask > 0).sum()), raw=int(raw), resid=int(resid),
                    warp=np.round(wa, 4).tolist()))
    if fi % 20 == 1: print(rec[-1], flush=True)
tp = os.path.join(OUT, "bun_track.json")
if ONLY and os.path.exists(tp):
    old = {r["f"]: r for r in json.load(open(tp))}; old.update({r["f"]: r for r in rec}); rec = [old[k] for k in sorted(old)]
json.dump(rec, open(tp, "w"))
print("resid>0 frames:", [r["f"] for r in rec if r["resid"] > 0])
print("min cc", min(r["cc"] for r in rec), "chained:", [(r["f"], r["how"]) for r in rec if r.get("how", "track") != "track"])
