#!/usr/bin/env python3
"""Split a prepped plate of several performers into one plate per performer, each with her branch lane, for ?drop=real
(engine/show/real_ws.js, docs/wushu_real_routine.md). CPU only (numpy, scipy, Pillow); seconds per segment at 960x540.
  python3 tools/prep/lanes.py work/plates/real_ws_<seg> [--n=6] [--seeds=x1,..,xn] [--roi=x0,y0,x1,y1] [--groups=wcwcwc]
                              [--lanes=white,mint,rose,sky,gold,violet] [--thr=0.5] [--copy] [--no-sheet]
Reads PLATE/matte/*.png (BiRefNet, tools/prep/prep.py) and PLATE/rgb/*.jpg. Writes
  PLATE_p<k>/            k = 1..n, left to right at frame 0: meta.json (+ performer, lane), rgb/ and depth/ (relative symlinks to PLATE's;
                         --copy copies them), matte/ = PLATE's soft matte inside performer k's region
  PLATE/meta.json        + "performers": [{k, lane, group, red, cx: [...], cy: [...]}] (per-frame centroid, 0..1 image coordinates; the EDL
                         places main from it) and "lanes_args"
  PLATE_lanes.jpg        contact sheet, every 0.5 s: each performer's region in her lane colour. CHECK IT for identity swaps (a colour jumping
                         to another body after a crossing or a fall) and for strays (a judge or a crowd blob coloured as a performer).
Tracking: frame 0's six largest matte blobs (touching ones split by x), then each frame's matte pixels go to the performer with the lowest
cost: distance to her last region moved by her last velocity, plus the colour distance to her uniform (a running mean). Distance keeps
performers apart while they touch or lie side by side; colour carries a red and a black performer through a full crossing (the cross pairs are
always red against black). Two same-colour performers crossing can swap: re-run with --seeds, or split the segment at the crossing. If this
matte misses or merges the performers at 320x240, use an instance segmenter for the matte instead (docs/wushu_real_routine.md).
Lanes: the uniforms' colour picks the half (red = warm, black = cool; --groups= overrides, w/c per performer left to right), then each half
left to right: warm white, rose, gold; cool mint, sky, violet (engine/show/real_ws.js LANES). --lanes= sets them outright."""
import glob
import json
import os
import shutil
import sys

import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage as ndi

LANE_HEX = {"orange": "#FF7A1A", "rose": "#FF5FA2", "sky": "#6FB6FF", "mint": "#4FE3B0", "gold": "#FFD23F", "violet": "#A57BFF", "white": "#F4F4F8"}
WARM, COOL = ["white", "rose", "gold"], ["mint", "sky", "violet"]
LINE = ["white", "mint", "rose", "sky", "gold", "violet"]


def opt(k, d=None):
    return next((a.split("=", 1)[1] for a in sys.argv if a.startswith(f"--{k}=")), d)


def load(plate, sub, i, ext):
    return Image.open(os.path.join(plate, sub, f"{i:06d}.{ext}"))


def init_regions(fg, n, seeds):
    """frame 0: label map 1..n (0 = none), ordered left to right."""
    h, w = fg.shape
    ys, xs = np.nonzero(fg)
    if seeds:                                            # nearest seed (x as a fraction of the width, y at the blobs' median height)
        sx = np.array(seeds) * w
        lab = np.zeros(fg.shape, np.int32)
        lab[ys, xs] = 1 + np.argmin(np.abs(xs[:, None] - sx[None, :]), axis=1)
        return relabel_lr(lab, n)
    cc, m = ndi.label(fg)
    areas = ndi.sum(fg, cc, range(1, m + 1))
    regs = [cc == (j + 1) for j in np.argsort(-areas)[:n]]
    while len(regs) < n and regs:                        # fewer blobs than performers: split the widest along x (2-means on columns)
        big = max(range(len(regs)), key=lambda j: np.ptp(np.nonzero(regs[j])[1]) if regs[j].any() else 0)
        r = regs.pop(big); yy, xx = np.nonzero(r)
        c = np.percentile(xx, [25, 75]).astype(float)
        for _ in range(10):
            a = np.abs(xx - c[0]) <= np.abs(xx - c[1]); c = np.array([xx[a].mean(), xx[~a].mean()]) if a.any() and (~a).any() else c
        for part in (a, ~a):
            q = np.zeros_like(r); q[yy[part], xx[part]] = True; regs.append(q)
    lab = np.zeros(fg.shape, np.int32)
    for j, r in enumerate(regs): lab[r] = j + 1
    return relabel_lr(lab, n)


def relabel_lr(lab, n):
    cx = [np.nonzero(lab == k)[1].mean() if (lab == k).any() else 1e9 for k in range(1, n + 1)]
    out = np.zeros_like(lab)
    for new, old in enumerate(np.argsort(cx)): out[lab == old + 1] = new + 1
    return out


def main():
    plate = sys.argv[1].rstrip("/")
    n = int(opt("n", "6")); thr = float(opt("thr", "0.5"))
    seeds = [float(x) for x in opt("seeds", "").split(",") if x]
    meta = json.load(open(os.path.join(plate, "meta.json")))
    N, fps = meta["n"], meta["fps"]
    W0, H0 = meta["w"], meta["h"]
    sc = min(1.0, 480 / W0)                                  # track at <= 480 px wide, write mattes at full size
    w, h = max(1, round(W0 * sc)), max(1, round(H0 * sc))
    roi = None
    if opt("roi"):
        x0, y0, x1, y1 = (float(v) for v in opt("roi").split(","))   # fractions of the frame
        roi = np.zeros((h, w), bool); roi[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = True
    maxd = 0.15 * h                                          # a blob this far from every performer is a stray (judge, crowd), not assigned
    mattes, labs, cx, cy = [], [], np.full((N, n), np.nan), np.full((N, n), np.nan)
    prev, prev2, mu = None, None, np.zeros((n, 3), np.float32)
    for i in range(N):
        M = np.asarray(load(plate, "matte", i, "png").convert("L").resize((w, h), Image.BILINEAR), np.float32) / 255
        px = np.asarray(load(plate, "rgb", i, "jpg").convert("RGB").resize((w, h), Image.BILINEAR), np.float32)
        if roi is not None: M = M * roi
        fg = ndi.binary_opening(M > thr, iterations=1)
        cc, m = ndi.label(fg)
        if m:
            areas = ndi.sum(fg, cc, range(1, m + 1)); keep = np.isin(cc, 1 + np.nonzero(areas >= 0.0004 * w * h)[0]); fg &= keep
        soft = M > 0.05                                      # matte edges go to a performer too
        if prev is None:
            lab = init_regions(fg, n, seeds)
            if (lab > 0).sum():                              # grow frame 0's regions over the soft edges
                d, (iy, ix) = ndi.distance_transform_edt(lab == 0, return_indices=True)
                lab = np.where(soft & (d < maxd), lab[iy, ix], 0)
        else:
            D = np.full((n, h, w), np.inf, np.float32)
            for k in range(1, n + 1):
                r = prev == k
                if not r.any(): continue
                if prev2 is not None and (prev2 == k).any():   # move her last region by her last velocity
                    v = np.array(ndi.center_of_mass(r)) - np.array(ndi.center_of_mass(prev2 == k))
                    r = ndi.shift(r.astype(np.uint8), np.clip(v, -0.1 * h, 0.1 * h), order=0) > 0 if np.abs(v).max() >= 1 else r
                D[k - 1] = ndi.distance_transform_edt(~r)
            C = np.stack([np.linalg.norm(px - mu[k], axis=2) for k in range(n)]) / 60     # colour distance, in units of 60 RGB levels
            near = np.argmin(D / (0.04 * h) + C, axis=0) + 1
            lab = np.where(soft & (np.min(D, axis=0) < maxd), near, 0).astype(np.int32)
        for k in range(1, n + 1):
            yy, xx = np.nonzero((lab == k) & fg)
            if len(xx):
                cx[i, k - 1], cy[i, k - 1] = xx.mean() / w, yy.mean() / h
                m = px[yy, xx].mean(axis=0); mu[k - 1] = m if prev is None else .9 * mu[k - 1] + .1 * m
        prev2, prev = prev, lab
        labs.append(lab)
        mattes.append(M)
    for k in range(n):                                       # gaps (a performer hidden for a frame): hold her last centroid
        for a in (cx, cy):
            s = a[:, k]; idx = np.where(~np.isnan(s), np.arange(N), 0); np.maximum.accumulate(idx, out=idx); s[:] = s[idx]
            s[np.isnan(s)] = np.nanmean(s) if not np.isnan(s).all() else 0.5
    # the halves: redness of each performer's uniform over the first second (median), red = warm
    red = np.zeros(n)
    for k in range(1, n + 1):
        vals = []
        for i in range(min(N, int(fps) + 1)):
            px = np.asarray(load(plate, "rgb", i, "jpg").convert("RGB").resize((w, h), Image.BILINEAR), np.float32)
            sel = (labs[i] == k) & (mattes[i] > thr)
            if sel.sum() > 10:
                p = px[sel]; vals.append(float(np.mean(p[:, 0] - np.maximum(p[:, 1], p[:, 2]))) / 255)
        red[k - 1] = np.median(vals) if vals else 0
    g = opt("groups")
    if g: warm = [c == "w" for c in g[:n]]
    else: order = np.argsort(-red); warm = [bool(k in order[: n // 2]) for k in range(n)]
    if opt("lanes"): lanes = opt("lanes").split(",")[:n]
    elif n == 6 and sum(warm) == 3:
        it = {True: iter(WARM), False: iter(COOL)}; lanes = [next(it[warm[k]]) for k in range(n)]   # k is already left to right
    else: lanes = [LINE[k % 6] for k in range(n)]
    # write the performer plates
    name = os.path.basename(plate)
    for k in range(1, n + 1):
        out = f"{plate}_p{k}"
        os.makedirs(os.path.join(out, "matte"), exist_ok=True)
        for sub in ("rgb", "depth"):
            dst = os.path.join(out, sub)
            if os.path.islink(dst) or os.path.isfile(dst): os.unlink(dst)
            elif os.path.isdir(dst): shutil.rmtree(dst)
            if "--copy" in sys.argv: shutil.copytree(os.path.join(plate, sub), dst)
            else: os.symlink(os.path.join("..", name, sub), dst)
        for i in range(N):
            full = np.asarray(load(plate, "matte", i, "png").convert("L"), np.uint8)
            lab = np.asarray(Image.fromarray((labs[i] == k).astype(np.uint8) * 255).resize((W0, H0), Image.NEAREST)) > 0
            Image.fromarray(np.where(lab, full, 0).astype(np.uint8)).save(os.path.join(out, "matte", f"{i:06d}.png"))
        json.dump({**meta, "performer": k, "lane": lanes[k - 1], "of": name}, open(os.path.join(out, "meta.json"), "w"), indent=1)
    meta["performers"] = [{"k": k + 1, "lane": lanes[k], "group": "warm" if warm[k] else "cool", "red": round(float(red[k]), 4),
                           "cx": [round(float(v), 4) for v in cx[:, k]], "cy": [round(float(v), 4) for v in cy[:, k]]} for k in range(n)]
    meta["lanes_args"] = " ".join(sys.argv[2:])
    json.dump(meta, open(os.path.join(plate, "meta.json"), "w"), indent=1)
    if "--no-sheet" not in sys.argv:
        step = max(1, round(fps / 2)); idx = list(range(0, N, step)); tw = 320; th = round(tw * H0 / W0)
        sheet = Image.new("RGB", (tw * min(8, len(idx)), th * ((len(idx) + 7) // 8)))
        for j, i in enumerate(idx):
            im = load(plate, "rgb", i, "jpg").convert("RGB").resize((tw, th), Image.BILINEAR)
            ov = np.asarray(im, np.float32)
            lab = np.asarray(Image.fromarray(labs[i].astype(np.uint8)).resize((tw, th), Image.NEAREST))
            for k in range(1, n + 1):
                c = np.array([int(LANE_HEX[lanes[k - 1]][q:q + 2], 16) for q in (1, 3, 5)], np.float32)
                ov[lab == k] = ov[lab == k] * .45 + c * .55
            im = Image.fromarray(ov.clip(0, 255).astype(np.uint8)); ImageDraw.Draw(im).text((4, 4), f"{i / fps:.1f}s", fill=(255, 255, 255))
            sheet.paste(im, ((j % 8) * tw, (j // 8) * th))
        sheet.save(f"{plate}_lanes.jpg", quality=88)
    print(f"{plate}: {n} performers; lanes " + ", ".join(f"p{k + 1}={lanes[k]}({'w' if warm[k] else 'c'} red {red[k]:.3f})" for k in range(n)))


if __name__ == "__main__":
    main()
