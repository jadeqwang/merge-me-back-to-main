#!/usr/bin/env python3
"""v11 B2 into the film: a life's MOVING plate written in its notation (notation2.py's ink look), as a plate folder
work_fable/take2/plates/<plate>_notation11/ (every frame, same frame count and meta as the source, so ids swap with the same clip maps).

Stable: ONE layout for the whole clip (same glyphs in the same places in every frame: no boil, no re-layout), ink colour taken from
the clip's median frame. Safe: glyphs only where the plate is flat AND outside, in every frame, (a) the figures (BiRefNet mattes of
every frame, v11 pmatte/<id>, union, + margin), (b) faces and hands (skin blobs of sampled frames, union, + margin), (c) anything that
moves (max difference to the median, + margin), (d) dense line drawing (sketched background people: edge density), so the notation
never crosses a moving figure, a face or hands in any frame.
  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/v11/notation11.py LIFE [--sheet-only]
LIFE: piano violin wushu wetlab phd poet ames band chezjj sandstorm home
"""
import os, sys, json, shutil, argparse
import numpy as np, cv2
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.dirname(HERE))
import notation2 as N  # noqa: E402
from v9.skin import skin_mask  # noqa: E402

ROOT = N.ROOT
PROOF = os.path.join(ROOT, 'work_fable/proof/plates'); T2 = os.path.join(ROOT, 'work_fable/take2/plates')
PM = os.path.join(ROOT, 'work_fable/take2/dev/v11_glyph/pmatte')
DEV = os.path.join(ROOT, 'work_fable/take2/dev/v11_glyph')
W, H = 1920, 1080
# life -> source plate (the one the film plays: shots.js PROOF_A / LIFE_SWAP, newest first)
PLATE = {'piano': ('piano', PROOF), 'violin': ('violin', PROOF), 'wushu': ('wushu_v3', T2), 'wetlab': ('wetlab', PROOF),
         'phd': ('phd', PROOF), 'poet': ('poet', PROOF), 'ames': ('ames', PROOF), 'band': ('band_v2', T2),
         'chezjj': ('chezjj', PROOF), 'sandstorm': ('sandstorm', PROOF), 'home': ('home_v3', T2)}
FLAT = {'wetlab': 85, 'wushu': 66, 'violin': 72, 'piano': 58, 'band': 88, 'home': 72}
EDGE_EXCL = {'violin': 0.10, 'wushu': 0.10}       # edge density above which (sketched / small people) stays clean
MARGIN = 36
# film overlays the notation must stay clear of (frame fractions x0, y0, x1, y1), read off the wired sheet
# (work_fable/take2/dev/v11/wire/notation_sheet.jpg): the verse lyric's box in that shot, the branch chip/caption and the ticker strip
# (one full-width band), each grown by ZONE_PAD (4 % of frame)
CHIP_TICKER = (0.0, 0.66, 1.0, 0.87)
ZONES = {'piano': [(0.55, 0.0, 0.86, 0.14)], 'violin': [(0.0, 0.0, 0.45, 0.16)], 'wushu': [(0.6, 0.0, 1.0, 0.22)],
         'wetlab': [(0.6, 0.0, 1.0, 0.22)], 'phd': [(0.6, 0.0, 1.0, 0.22)], 'poet': [(0.55, 0.0, 1.0, 0.30)],
         'ames': [(0.0, 0.0, 0.45, 0.22)], 'band': [(0.0, 0.0, 1.0, 0.2), (0.1, 0.85, 0.62, 1.0)],
         'chezjj': [(0.1, 0.84, 0.62, 1.0)], 'sandstorm': [(0.1, 0.84, 0.62, 1.0)], 'home': [(0.0, 0.0, 1.0, 0.2), (0.1, 0.84, 0.62, 1.0)]}
ZONE_PAD = 0.04
POET_SIZES = [60, 42, 30]       # poet: her words smaller and lighter than the sung line (the lyric stays the dominant text)


def zone_rects(life):
    out = []
    for (x0, y0, x1, y1) in ZONES.get(life, []) + [CHIP_TICKER]:
        out.append((max(0, x0 - ZONE_PAD) * W, max(0, y0 - ZONE_PAD) * H, min(1, x1 + ZONE_PAD) * W, min(1, y1 + ZONE_PAD) * H))
    return out


def load(p):   # uint8 RGB at 1920 (memory: a whole clip is held)
    return cv2.resize(cv2.imread(p)[..., ::-1], (W, H), interpolation=cv2.INTER_CUBIC)


fl = lambda f: f.astype(np.float32) / 255


def safe_mask(life, frames, med):
    pid = PLATE[life][0]
    n = len(frames)
    ex = np.zeros((H, W), bool)
    md = f'{PM}/{pid}/rgba'
    for k in range(1, n + 1):
        p = f'{md}/f_{k:04d}.png'
        if os.path.exists(p):
            a = cv2.imread(p, cv2.IMREAD_UNCHANGED)[..., 3]
            ex |= cv2.resize(a, (W, H)) > 70
    if not os.path.exists(f'{md}/f_0001.png'):
        print('WARNING: no mattes for', pid)
    for k in range(0, n, 6):
        sk = (skin_mask(fl(frames[k])) > 0.25).astype(np.uint8)
        nn, lab, st, _ = cv2.connectedComponentsWithStats(sk)
        big = np.nonzero(st[:, cv2.CC_STAT_AREA] > 0.02 * W * H)[0]
        ex |= (sk > 0) & ~np.isin(lab, big[big > 0])
    mv = np.zeros((H, W), np.float32)       # what moves, at a 4 px blur (a generated clip's line shimmer does not count)
    mb = cv2.GaussianBlur(med, (0, 0), 4)
    for f in frames[::2]:
        mv = np.maximum(mv, np.abs(cv2.GaussianBlur(fl(f), (0, 0), 4) - mb).max(-1))
    ex |= mv > 0.10
    if life in EDGE_EXCL:
        g = cv2.cvtColor((med * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
        e = (cv2.Canny(g, 60, 140) > 0).astype(np.float32)
        ex |= cv2.GaussianBlur(e, (0, 0), 14) > EDGE_EXCL[life]
    ex = cv2.dilate(ex.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (2 * MARGIN + 1, 2 * MARGIN + 1))) > 0
    for (x0, y0, x1, y1) in zone_rects(life):     # lyric, chip/caption, ticker
        ex[int(y0):int(y1), int(x0):int(x1)] = True
    return ex


def layout(life, med, ex, seed=3):
    N.FLAT_PCT.update(FLAT)
    rng = np.random.default_rng(seed)
    alpha = Image.new('L', (W, H), 0)
    used = ex.copy()                 # excluded areas count as taken: no row is laid across them
    flat = N.flat_mask(med, life) & ~ex
    sizes0 = list(N.SIZES)
    if life == 'poet':
        N.SIZES[:] = POET_SIZES
    if life in ('piano', 'violin'):
        N.staves(alpha, used, flat, life, rng)
    else:
        N.text_rows(alpha, used, flat, life, rng)
    N.SIZES[:] = sizes0
    a = np.asarray(alpha).astype(np.float32) / 255
    a = a * (1 - cv2.GaussianBlur(ex.astype(np.float32), (0, 0), 2))      # belt and braces: nothing inside the safe mask
    ground = cv2.GaussianBlur(med, (0, 0), 6)
    lum = ground[..., 0] * 0.299 + ground[..., 1] * 0.587 + ground[..., 2] * 0.114
    ink = np.where((lum > 0.5)[..., None], ground * 0.32, ground + (1 - ground) * 0.62)
    if life == 'poet':          # lighter than the lyric
        ink = ground + (ink - ground) * 0.55
    return a, ink


def main():
    ap = argparse.ArgumentParser(); ap.add_argument('life'); ap.add_argument('--sheet-only', action='store_true')
    a_ = ap.parse_args()
    life = a_.life
    pid, base = PLATE[life]
    meta = json.load(open(f'{base}/{pid}/meta.json'))
    n = meta['n']
    frames = [load(f'{base}/{pid}/frames/f_{k:04d}.jpg') for k in range(1, n + 1)]
    med = np.median(np.stack(frames[::6]), 0).astype(np.float32) / 255
    ex = safe_mask(life, frames, med)
    a, ink = layout(life, med, ex)
    out = f'{T2}/{pid}_notation11'
    if not a_.sheet_only:
        os.makedirs(f'{out}/frames', exist_ok=True)
        for k, f in enumerate(frames, 1):
            o = fl(f) * (1 - a[..., None]) + ink * a[..., None]
            cv2.imwrite(f'{out}/frames/f_{k:04d}.jpg', (np.clip(o, 0, 1)[..., ::-1] * 255 + 0.5).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 93])
        shutil.copy(f'{out}/frames/f_0001.jpg', f'{out}/still.jpg')
        m = dict(meta, w=W, h=H, src=f'{os.path.relpath(base, ROOT)}/{pid}/frames + notation ink (fable/take2/tools/glyphart/v11/notation11.py {life})',
                 glyph=dict(v11='B2 notation, one static layout, figure-safe', life=life, notation=N.LABEL[life], margin=MARGIN))
        json.dump(m, open(f'{out}/meta.json', 'w'))
        if os.path.exists(f'{base}/{pid}/REAL'):
            shutil.copy(f'{base}/{pid}/REAL', f'{out}/REAL')
    # sheets: frame 60 tile + a check of the safe mask over the whole clip
    k = min(60, n)
    img = fl(frames[k - 1]) * (1 - a[..., None]) + ink * a[..., None]
    t = N.tile(img, fl(frames[k - 1]), N.LABEL[life], meta.get('focus', [0.5, 0.4]))
    cv2.imwrite(f'{DEV}/notation11_{life}.jpg', t, [cv2.IMWRITE_JPEG_QUALITY, 90])
    chk = fl(frames[k - 1]) * 0.6; chk[ex] = chk[ex] * 0.4 + np.array([0.6, 0, 0], np.float32)
    chk = chk * (1 - a[..., None]) + a[..., None]
    cv2.imwrite(f'{DEV}/notation11_{life}_safe.jpg', (cv2.resize(np.clip(chk, 0, 1), (960, 540))[..., ::-1] * 255).astype(np.uint8))
    z = (cv2.resize(np.clip(img, 0, 1), (640, 360), interpolation=cv2.INTER_AREA)[..., ::-1] * 255).astype(np.uint8).copy()
    for (x0, y0, x1, y1) in zone_rects(life):
        cv2.rectangle(z, (int(x0 / 3), int(y0 / 3)), (int(x1 / 3) - 1, int(y1 / 3) - 1), (0, 0, 255), 2)
    cv2.putText(z, life, (8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
    cv2.imwrite(f'{DEV}/notation11_{life}_zones.jpg', z)
    print(life, pid, n, 'glyph cover', round(float(a.mean()), 3), flush=True)


if __name__ == '__main__':
    main()
