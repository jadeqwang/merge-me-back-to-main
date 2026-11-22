#!/usr/bin/env python3
"""Style 2: "hash glyphs": the film's hatch pass redone with Latin glyphs only, every glyph the same font size, at the hatch's
resolution, in the film ink set on black paper.

Scale measured from src/paper.js at 1080p (S = 1): contour strokes 9-17 px long, one per 4x4 px cell at the strongest edge
pixel; tone hatch spacing 8 px (default), strokes ~20-35 px, three layers starting at tone .12 / .40 / .66; paper #141317;
ink = chalk #ECE6D8 unless the source is saturated, then the nearest ink by hue.
Here: one font at one size (em 14 px by default: cap height ~10, a '|' ~14 px, so a glyph is the size of a contour stroke);
  CONTOUR: per 4x4 cell, strongest DoG edge pixel over threshold -> one glyph, turned so its own main axis lies along the edge,
           chosen by shape fit to the edge patch (| / \\ - l I 1 ( ) win on lines).
  TONE:    up to three layers on jittered grids (spacing 8, 9, 10 px) where tone > .12 / .40 / .66, turned to the structure
           tangent, chosen by shape fit to the tone patch (dense M W # @ & in darks, . , ' : ; in lights).
Glyph identity can boil; positions are carried by optical flow in animation (see animate_hash.py).

  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/hashglyph.py SRC OUT.jpg [--font mono|serif|sans] [--em 14]
"""
import os, sys, math, json, time, argparse
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import paint as P

FONTS = {
    'mono': '/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf',
    'serif': '/usr/share/fonts/opentype/urw-base35/C059-Bold.otf',
    'sans': '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    'typewriter': '/usr/share/fonts/opentype/urw-base35/NimbusMonoPS-Bold.otf',
}
CHARS = ''.join(ch for ch in map(chr, range(33, 127)) if ch not in ".,'`:;\"^")   # ASCII printable minus specks (no space)
PAPER = '#141317'
CHALK = '#ece6d8'
INKS = ['#f2c230', '#ff8a2a', '#3a7bd5', '#8a5cf0', '#c23a8a', '#2a9d8f']   # D ink set (gold, orange, blue, violet, magenta, teal)


class FixedAtlas:
    """every glyph at the same font size; sprite canvas D = 2*em (room to rotate), glyph centred on its ink centroid"""

    def __init__(self, font='mono', em=14, ss=4):
        fp = FONTS.get(font, font)
        self.em, self.D = em, int(round(em * 1.6)) | 1
        big = ImageFont.truetype(fp, em * ss)
        S = self.D * ss
        spr, desc, axis, elong, chars = [], [], [], [], []
        for ch in CHARS:
            im = Image.new('L', (S, S), 0)
            ImageDraw.Draw(im).text((S / 2, S / 2), ch, font=big, fill=255, anchor='mm')
            a = np.asarray(im).astype(np.float32) / 255
            if a.max() < 0.3:
                continue
            ys, xs = np.nonzero(a > 0.05); w = a[ys, xs]; m = w.sum()
            cx, cy = (xs * w).sum() / m, (ys * w).sum() / m
            M = np.float32([[1, 0, S / 2 - cx], [0, 1, S / 2 - cy]])
            a = cv2.warpAffine(a, M, (S, S))                         # centre on ink centroid (rotation pivot)
            dx, dy = xs - cx, ys - cy
            cxx, cyy, cxy = (w * dx * dx).sum() / m, (w * dy * dy).sum() / m, (w * dx * dy).sum() / m
            tr, det = cxx + cyy, cxx * cyy - cxy * cxy
            l1 = tr / 2 + math.sqrt(max(tr * tr / 4 - det, 0)); l2 = tr / 2 - math.sqrt(max(tr * tr / 4 - det, 0))
            spr.append(cv2.resize(a, (self.D, self.D), interpolation=cv2.INTER_AREA))
            axis.append(0.5 * math.atan2(2 * cxy, cxx - cyy))       # main axis angle in the sprite
            elong.append(math.sqrt(l1 / max(l2, 1e-6)))
            chars.append(ch)
        self.spr = np.stack(spr); self.axis = np.array(axis, np.float32); self.elong = np.array(elong, np.float32)
        self.char = np.array(chars); self.N = len(chars)
        # descriptors in the glyph's OWN frame (main axis along +x) at 16x16 over the em square, so a patch sampled along the
        # target direction compares directly
        dsc = []
        for a, ax in zip(self.spr, self.axis):
            c = self.D / 2
            R = cv2.getRotationMatrix2D((c, c), math.degrees(ax), 1.0)
            r = cv2.warpAffine(a, R, (self.D, self.D))
            o = (self.D - em) // 2
            dsc.append(cv2.resize(r[o:o + em, o:o + em], (16, 16), interpolation=cv2.INTER_AREA).reshape(-1))
        self.desc = np.stack(dsc).astype(np.float32)


def stamp(can, at, x, y, rot, gid, col, op=1.0):
    """sprite gid rotated by rot (radians, image coords) centred at (x, y)"""
    H, W = can.shape[:2]
    D = at.D; r = D / 2
    x0, y0 = int(math.floor(x - r)), int(math.floor(y - r))
    bx0, by0, bx1, by1 = max(x0, 0), max(y0, 0), min(x0 + D + 1, W), min(y0 + D + 1, H)
    if bx1 <= bx0 or by1 <= by0:
        return
    c, s = math.cos(rot), math.sin(rot)
    dx, dy = bx0 + 0.5 - x, by0 + 0.5 - y
    A = np.array([[c, s, r + c * dx + s * dy - 0.5], [-s, c, r - s * dx + c * dy - 0.5]], np.float32)
    a = cv2.warpAffine(at.spr[gid], A, (bx1 - bx0, by1 - by0), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP)
    reg = can[by0:by1, bx0:bx1]
    reg += (col[None, None, :] - reg) * (a * op)[..., None]


class Analysis:
    def __init__(self, src, cfg):
        self.src = src
        H, W = src.shape[:2]
        L = P.lum(src).astype(np.float32)
        self.L = L
        b1 = cv2.GaussianBlur(L, (0, 0), 1.0); b2 = cv2.GaussianBlur(L, (0, 0), 2.6)
        self.E = np.clip(np.abs(b1 - b2) * cfg.get('edge_gain', 9.0), 0, 1)        # DoG edge strength
        coarse = P.tensor_field(L, 64)
        self.tan, self.coh = P.orient(L, cfg.get('flow_scale', 10), coarse)
        self.etan, _ = P.orient(L, 4, coarse)
        t0, g = cfg.get('t0', 0.3), cfg.get('gamma', 1.0)
        self.T = np.clip((L - t0) / (1 - t0), 0, 1) ** g
        # ink: chalk unless saturated, then the nearest ink by hue (as paper.js)
        hsv = cv2.cvtColor(np.clip(cv2.GaussianBlur(src, (0, 0), 2), 0, 1), cv2.COLOR_RGB2HSV)
        self.hue = hsv[..., 0] / 360.0; self.sat = hsv[..., 1]; self.val = hsv[..., 2]
        inks = [P.hexrgb(h) for h in cfg.get('inks', INKS)]
        ih = []
        for c in inks:
            h = cv2.cvtColor(c[None, None, :].astype(np.float32), cv2.COLOR_RGB2HSV)[0, 0, 0] / 360.0
            ih.append(h)
        self.inks = np.stack(inks); self.ink_h = np.array(ih, np.float32)
        self.chalk = P.hexrgb(cfg.get('chalk', CHALK))
        self.sat_min = cfg.get('sat_min', 0.28)

    def colour(self, x, y):
        ix = np.clip(x.astype(int), 0, self.L.shape[1] - 1); iy = np.clip(y.astype(int), 0, self.L.shape[0] - 1)
        h, s = self.hue[iy, ix], self.sat[iy, ix]
        d = np.abs(h[:, None] - self.ink_h[None]); d = np.minimum(d, 1 - d)
        k = d.argmin(1)
        w = np.clip((s - self.sat_min) / 0.25, 0, 1)[:, None] * (self.val[iy, ix] > 0.12)[:, None]
        return (self.chalk[None] * (1 - w) + self.inks[k] * w).astype(np.float32)


def fit(at, patches, rng, tau, elong_bias=None):
    """patches (M,256) in the target's own frame -> glyph ids, scores"""
    D = at.desc; mm = (D * D).sum(1)
    sc = 2 * patches @ D.T - mm[None, :]
    scale = np.abs(sc).max(1, keepdims=True) + 1e-6
    z = sc / scale + tau * (-np.log(-np.log(rng.random(sc.shape, dtype=np.float32) + 1e-12)))
    if elong_bias is not None:
        z += elong_bias[:, None] * np.clip((at.elong[None, :] - 1.5) / 3, 0, 1)
    j = z.argmax(1)
    return j, sc[np.arange(len(j)), j]


def patches_along(img, x, y, ang, em):
    return P.sample_patches(img[..., None] if img.ndim == 2 else img, x, y, ang, np.full(len(x), em, np.float32))[..., 0].reshape(len(x), 256)


def contour_marks(an, at, cfg, rng, occupied=None):
    E = an.E
    H, W = E.shape
    c = cfg.get('cgrid', 7)
    h, w = H // c, W // c
    e = E[:h * c, :w * c].reshape(h, c, w, c).transpose(0, 2, 1, 3).reshape(h, w, c * c)
    am = e.argmax(-1); mx = e.max(-1)
    yy, xx = np.mgrid[0:h, 0:w]
    sel = mx > cfg.get('line_min', 0.3)
    if occupied is not None:
        sel &= ~occupied
    py = (yy * c + am // c)[sel].astype(np.float32); px = (xx * c + am % c)[sel].astype(np.float32)
    keep = rng.random(len(px)) < cfg.get('cdensity', 1.0)
    px, py = px[keep], py[keep]
    px += rng.uniform(-0.8, 0.8, len(px)).astype(np.float32); py += rng.uniform(-0.8, 0.8, len(py)).astype(np.float32)
    ang = an.etan[py.astype(int), px.astype(int)] + rng.normal(0, 0.1, len(px)).astype(np.float32)
    pat = patches_along(E, px, py, ang, at.em)
    gid, sc = fit(at, pat, rng, cfg.get('tau', 0.12), np.full(len(px), cfg.get('line_bias', 0.5), np.float32))
    strength = E[py.astype(int), px.astype(int)]
    return dict(x=px, y=py, ang=ang, gid=gid, kind=np.zeros(len(px), np.int8),
                op=np.clip(0.55 + 0.6 * strength, 0, 1).astype(np.float32), layer=np.zeros(len(px), np.int8),
                flip=(rng.random(len(px)) < 0.5).astype(np.int8))


def tone_marks(an, at, cfg, rng, occ_layers=None):
    T = an.T
    H, W = T.shape
    out = []
    for q, (thr, sp) in enumerate(zip(cfg.get('thresholds', [0.12, 0.40, 0.66]), cfg.get('spacings', [8, 9, 10]))):
        h, w = int(H // sp), int(W // sp)
        ox, oy = rng.uniform(0, sp), rng.uniform(0, sp)
        yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
        px = (xx * sp + ox + rng.uniform(-0.3, 0.3, xx.shape) * sp).ravel().astype(np.float32)
        py = (yy * sp + oy + rng.uniform(-0.3, 0.3, yy.shape) * sp).ravel().astype(np.float32)
        ok = (px < W - 1) & (py < H - 1)
        px, py = px[ok], py[ok]
        tv = T[py.astype(int), px.astype(int)]
        need = tv > thr + rng.normal(0, 0.04, len(tv))
        if occ_layers is not None:
            need &= ~occ_layers[q][np.clip((py // sp).astype(int), 0, h - 1), np.clip((px // sp).astype(int), 0, w - 1)]
        px, py = px[need], py[need]
        if not len(px):
            continue
        base = an.tan[py.astype(int), px.astype(int)]
        ang = base + [0, -1.2, 0.6][q] * cfg.get('cross', 0.0) + rng.normal(0, 0.12, len(px)).astype(np.float32)
        pat = patches_along(np.clip(T - thr, 0, 1) / (1 - thr), px, py, ang, at.em)
        gid, sc = fit(at, pat, rng, cfg.get('tau', 0.12))
        tv = T[py.astype(int), px.astype(int)]
        out.append(dict(x=px, y=py, ang=ang, gid=gid, kind=np.ones(len(px), np.int8),
                        op=np.clip(0.45 + 0.6 * (tv - thr), 0.4, 1).astype(np.float32), layer=np.full(len(px), q + 1, np.int8),
                        flip=(rng.random(len(px)) < 0.5).astype(np.int8)))
    return out


def cat(ms):
    ms = [m for m in ms if m is not None and len(m['x'])]
    if not ms:
        return dict(x=np.zeros(0, np.float32), y=np.zeros(0, np.float32), ang=np.zeros(0, np.float32), gid=np.zeros(0, np.int64),
                    kind=np.zeros(0, np.int8), op=np.zeros(0, np.float32), layer=np.zeros(0, np.int8), flip=np.zeros(0, np.int8))
    return {k: np.concatenate([m[k] for m in ms]) for k in ms[0]}


def draw(an, at, marks, cfg, rng, fade=None):
    H, W = an.L.shape
    can = np.empty((H, W, 3), np.float32); can[:] = P.hexrgb(cfg.get('paper', PAPER))
    col = an.colour(marks['x'], marks['y'])
    order = np.lexsort((np.arange(len(marks['x'])), -marks['layer']))        # tone layers first, contour on top
    for i in order:
        rot = float(marks['ang'][i] - at.axis[marks['gid'][i]])
        if marks['flip'][i]:
            rot += math.pi                                                    # either way round (fixed per mark: no flicker)
        op = float(marks['op'][i]) * (1.0 if fade is None else float(fade[i]))
        stamp(can, at, float(marks['x'][i]), float(marks['y'][i]), rot, int(marks['gid'][i]), col[i], op)
    return can


def render_still(src, cfg, rng, at):
    an = Analysis(src, cfg)
    m = cat(tone_marks(an, at, cfg, rng) + [contour_marks(an, at, cfg, rng)])
    can = draw(an, at, m, cfg, rng)
    return can, m


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('out')
    ap.add_argument('--font', default='mono'); ap.add_argument('--em', type=int, default=14)
    ap.add_argument('--set', action='append', default=[]); ap.add_argument('--seed', type=int, default=5)
    a = ap.parse_args()
    cfg = dict(line_min=0.35)
    for kv in a.set:
        k, v = kv.split('=', 1); cfg[k] = json.loads(v)
    at = FixedAtlas(a.font, a.em)
    rng = np.random.default_rng(a.seed)
    src = P.load(a.src)
    t0 = time.time()
    can, m = render_still(src, cfg, rng, at)
    P.save(a.out, P.finish(can, dict(grain=0.01), rng))
    print(f'{a.out}: {len(m["x"])} glyphs ({int((m["kind"] == 0).sum())} contour), {at.N} glyphs in font, {time.time() - t0:.1f}s')


if __name__ == '__main__':
    main()
