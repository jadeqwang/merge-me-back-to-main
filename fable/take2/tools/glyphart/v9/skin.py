#!/usr/bin/env python3
"""Automatic focus map for style 1 (faces and hands keep her likeness): skin-tone mask of a plate frame.
Anime skin is light, low-to-mid saturation, warm (peach/cream). Mask = YCrCb box + HSV saturation band, cleaned, dilated
and feathered, then kept only for blobs of a plausible size. Returned as float (H,W) in [0,1] at the frame's size.
  skin.py PLATE_DIR OUT.jpg [frames]   -> overlay sheet (mask in magenta) to check it"""
import sys, os, cv2, numpy as np


def skin_mask(rgb01, min_area=250, grow=14, feather=10):
    """rgb01: float32 (H,W,3) 0..1 at 1920x1080 -> float32 (H,W) focus map"""
    u8 = (np.clip(rgb01, 0, 1) * 255).astype(np.uint8)
    bgr = u8[..., ::-1]
    ycc = cv2.cvtColor(bgr, cv2.COLOR_BGR2YCrCb)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    Y, Cr, Cb = ycc[..., 0].astype(int), ycc[..., 1].astype(int), ycc[..., 2].astype(int)
    Hh, S, V = hsv[..., 0].astype(int), hsv[..., 1].astype(int), hsv[..., 2].astype(int)
    m = (Y > 95) & (Cr > 134) & (Cr < 172) & (Cb > 85) & (Cb < 128) & (S > 18) & (S < 115) & ((Hh < 22) | (Hh > 170)) & (V > 110)
    m = m.astype(np.uint8)
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    keep = np.zeros(n, bool)
    for i in range(1, n):   # plausible face/hand blobs: big enough and compact (lanes, strands and stripes are long and thin)
        a, w, h = st[i, cv2.CC_STAT_AREA], st[i, cv2.CC_STAT_WIDTH], st[i, cv2.CC_STAT_HEIGHT]
        keep[i] = a >= min_area and a / float(w * h) > 0.3 and max(w, h) / max(1, min(w, h)) < 3.5
    m = keep[lab].astype(np.uint8)
    if grow:
        m = cv2.dilate(m, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * grow + 1, 2 * grow + 1)))
    f = cv2.GaussianBlur(m.astype(np.float32), (0, 0), feather) if feather else m.astype(np.float32)
    return np.clip(f * 1.6, 0, 1)


if __name__ == '__main__':
    d, out = sys.argv[1], sys.argv[2]
    ks = [int(x) for x in (sys.argv[3] if len(sys.argv) > 3 else '1,40,80,121').split(',')]
    tiles = []
    for k in ks:
        p = os.path.join(d, 'frames', f'f_{k:04d}.jpg')
        im = cv2.resize(cv2.imread(p), (1920, 1080), interpolation=cv2.INTER_CUBIC)
        f = skin_mask(im[..., ::-1].astype(np.float32) / 255)
        ov = im.astype(np.float32); ov = ov * (1 - 0.55 * f[..., None]) + np.array([255, 0, 255]) * 0.55 * f[..., None]
        tiles.append(cv2.resize(ov.astype(np.uint8), (960, 540)))
    while len(tiles) % 2: tiles.append(np.zeros_like(tiles[0]))
    cv2.imwrite(out, np.vstack([np.hstack(tiles[i:i + 2]) for i in range(0, len(tiles), 2)]), [cv2.IMWRITE_JPEG_QUALITY, 80])
