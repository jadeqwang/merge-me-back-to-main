#!/usr/bin/env python3
"""v11 B2: a notation per life. Paints a life's plate still in that life's notation (style 1 settings, v11 atlas, upright glyphs)
and makes the review sheets (1920 crop 1:1 | 640 full 1:1, labelled).

  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/v11/notation.py [--lives piano,band] [--size K] [--frame N]
  -> work_fable/take2/dev/v11_glyph/notation_<life>.jpg, notation_all.jpg (contact sheet of every life at 640)

NOTATION maps life -> (atlas name or None = v8 all-scripts atlas, prior weights). SIZE_K scales style 1's layer sizes (B1).
"""
import os, sys, json, time, argparse
import numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.dirname(HERE))
import paint11 as P  # noqa: E402
from v9.skin import skin_mask  # noqa: E402

ROOT = P.ROOT
ATD = os.path.join(ROOT, 'work_fable/take2/dev/v11_glyph/atlas')
OUT = os.path.join(ROOT, 'work_fable/take2/dev/v11_glyph')
LIFE_PL = os.path.join(ROOT, 'work_fable/proof/plates')

# life id (lives.js) -> branch label, notation atlas, script weights
NOTATION = {
    'piano': ('piano', 'staff_piano', {'note': 3, 'dyn': 1, 'stroke': 2, 'mark': 1.5}),
    'violin': ('violin', 'staff_violin', {'note': 3, 'dyn': 1, 'stroke': 2, 'mark': 1.5}),
    'wushu': ('wushu', 'hanzi', {'stroke': 3, 'rad': 2, 'rad2': 1}),
    'wetlab': ('biology', 'dna', {'base': 2, 'codon': 2}),
    'phd': ('phd-neuroscience', 'ipa', {'ipa': 3, 'stroke': 1}),
    'poet': ('poet', 'poet', {'latin': 2, 'word': 2}),
    'ames': ('nasa-ames', 'greek_math', {'greek': 2, 'math': 2, 'stroke': 1.5}),
    'band': ('rna-band', 'rna', {'base': 2, 'codon': 2}),
    'chezjj': ('hacker-houses', 'code', {'code': 2, 'tok': 2, 'stroke': 2}),
    'sandstorm': ('open-source', 'code', {'code': 2, 'tok': 2, 'stroke': 2}),
    'home': ('parenthood', 'child', {'cap': 3, 'back': 1}),
    'violet': ('rare-earth', None, {'stroke': 6, 'box': 2, 'cjk': 3, 'latin': 2, 'math': 2}),   # v9 as placed: all scripts
}
SIZES = [80, 48, 30, 19, 12, 8]; FOCUS_SIZES = [6, 4.5]


def atlas_for(life):
    _, name, w = NOTATION[life]
    path = f'{ATD}/{name}.npz' if name else P.ATLAS
    return P.Atlas(path=path, weights=w, max_cov=0.55), name is not None


def cfg_for(size_k=1.0, upright=True, smin=0.0):
    cfg = dict(P.PRESETS['colour_figure'], skip_lum=0)
    k = size_k
    cfg['sizes'] = [max(smin, s * k) for s in SIZES]
    cfg['focus_sizes'] = [max(smin * 0.7, s * k) for s in FOCUS_SIZES]
    cfg['upright'] = upright
    return cfg


def paint_still(life, src, size_k=1.0, seed=1, smin=0.0):
    at, up = atlas_for(life)
    cfg = cfg_for(size_k, up, smin)
    rng = np.random.default_rng(seed)
    foc = skin_mask(src)
    s2 = P.prep(src, cfg, None)
    can, gl = P.paint(s2, at, cfg, rng, foc, log=lambda *a: None)
    return P.finish(can, cfg, rng), len(gl)


def tile(img, label, focus):
    H, W = img.shape[:2]
    cx, cy = focus[0] * W, focus[1] * H
    x0 = int(np.clip(cx - 480, 0, W - 960)); y0 = int(np.clip(cy - 270, 0, H - 540))
    a = (np.clip(img[y0:y0 + 540, x0:x0 + 960], 0, 1) * 255).astype(np.uint8)[..., ::-1]
    b = (cv2.resize(np.clip(img, 0, 1), (640, 360), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8)[..., ::-1]
    b = np.vstack([b, np.full((180, 640, 3), 24, np.uint8)])
    r = np.hstack([a, np.full((540, 8, 3), 255, np.uint8), b]).copy()
    cv2.putText(r, label, (12, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    cv2.putText(r, '1920 crop 1:1', (12, 528), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
    cv2.putText(r, '640 full 1:1', (980, 400), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (200, 200, 200), 1)
    return r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--lives', default=''); ap.add_argument('--size', type=float, default=1.0)
    ap.add_argument('--smin', type=float, default=0.0); ap.add_argument('--frame', type=int, default=0)
    ap.add_argument('--tag', default='')
    a = ap.parse_args()
    lives = a.lives.split(',') if a.lives else list(NOTATION)
    smalls = []
    for life in lives:
        t0 = time.time()
        meta = json.load(open(f'{LIFE_PL}/{life}/meta.json'))
        k = a.frame or max(1, int(round(min(meta.get('turn_t', 2.5), 2.5) * 24)))   # before the turn: the plate as the proof shows it
        src = P.load(f'{LIFE_PL}/{life}/frames/f_{k:04d}.jpg')
        img, n = paint_still(life, src, a.size, smin=a.smin)
        br, nm, _ = NOTATION[life]
        lab = f'{br}: {nm or "all scripts (v9)"}  size x{a.size}  ({n} glyphs)'
        os.makedirs(f'{OUT}/raw', exist_ok=True); P.save(f'{OUT}/raw/notation_{life}{a.tag}.png', img)
        srcb = (cv2.resize(src, (640, 360), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8)[..., ::-1].copy()
        t = tile(img, lab, meta.get('focus', [0.5, 0.4]))
        t[540 - 180 - 0:540, 968:968 + 320] = cv2.resize(srcb, (320, 180))   # the plate itself, small, for reference
        cv2.putText(t, 'plate', (972, 376), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (200, 200, 200), 1)
        cv2.imwrite(f'{OUT}/notation_{life}{a.tag}.jpg', t, [cv2.IMWRITE_JPEG_QUALITY, 90])
        sm = (cv2.resize(np.clip(img, 0, 1), (640, 360), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8)[..., ::-1].copy()
        cv2.putText(sm, f'{br}: {nm or "all scripts"}', (8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        smalls.append(sm)
        print(f'{life}: frame {k}, {n} glyphs, {time.time() - t0:.0f} s', flush=True)
    if len(smalls) > 1:
        while len(smalls) % 3:
            smalls.append(np.zeros_like(smalls[0]))
        rows = [np.hstack([np.hstack([s, np.full((360, 6, 3), 255, np.uint8)]) for s in smalls[i:i + 3]]) for i in range(0, len(smalls), 3)]
        cv2.imwrite(f'{OUT}/notation_all{a.tag}.jpg', np.vstack([np.vstack([r, np.full((6, r.shape[1], 3), 255, np.uint8)]) for r in rows]),
                    [cv2.IMWRITE_JPEG_QUALITY, 90])


if __name__ == '__main__':
    main()
