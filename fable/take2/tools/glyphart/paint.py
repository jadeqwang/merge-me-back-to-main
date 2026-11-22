#!/usr/bin/env python3
"""Glyph painter: an image painted with tens/hundreds of thousands of glyphs used as paint strokes.

Hertzmann-style coarse-to-fine layers. In each layer (glyph size s):
  - error map |canvas - blur(src, s/4)|; on a jittered grid (step ~ spacing*s) a glyph is placed at the worst pixel of every
    cell whose mean error is over the threshold (layer 0: every cell).
  - orientation: structure-tensor edge tangent at scale s (doubled-angle field, fine + coarse mixed so flat areas follow the
    big flow); the glyph's canonical +x axis goes along it (+180 deg at random: any orientation).
  - colour: source (blurred at the layer scale) at the glyph centre, optionally snapped to a palette (ink set).
  - shape fit: the patch under the glyph, rotated into glyph space at 16x16, gives a gain map
      G = |canvas - t|^2 - |c - t|^2   (where painting colour c here helps)
    and every atlas glyph is scored by G . mask; one is drawn by Gumbel-max over normalised scores (temperature tau) with a
    per-script prior, so line-like glyphs land on lines, dense ones in masses, open ones where little ink is wanted.
  - stamping: the sprite (nearest mip >= s) is warped into place and alpha-composited with colour c (opaque ink).
A focus list (ellipses) adds finer layers and lower thresholds there (face, eyes, hands).

Library: paint(src, atlas, cfg, rng) -> (canvas, glyphs). CLI renders a still:
  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/paint.py SRC OUT.png --preset NAME [--focus x,y,rx,ry ...]
"""
import os, sys, math, json, time, argparse
import numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..', '..'))
ATLAS = os.path.join(ROOT, 'work_fable', 'take2', 'dev', 'v8_glyph', 'atlas.npz')


def hexrgb(h):
    h = h.lstrip('#')
    return np.array([int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)], np.float32)


FILLS = '█■□●○◆◇▲△▼▽◈◉◎★☆⬡⬢⧫⬟⬣▀▄▌▐░▒▓⊞⊠⊡'


class Atlas:
    def __init__(self, path=ATLAS, scripts=None, weights=None, max_cov=0.55):
        z = np.load(path)
        self.scripts = list(z['scripts'])
        keep = (z['cov'] <= max_cov) & ~np.isin(z['char'], list(FILLS))   # no blocks/discs: fills, not glyphs
        if scripts:
            keep &= np.isin(np.array(self.scripts)[z['script']], scripts)
        self.idx = np.nonzero(keep)[0]
        sp = z['sprites'][keep].astype(np.float32) / 255
        # channel 0: glyph alpha; channel 1: keyline (glyph dilated by ~4% of its size, blurred): the dark edge that
        # separates overlapping glyphs, as the edge of a paint stroke does
        ker = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
        dil = np.stack([cv2.GaussianBlur(cv2.dilate(x, ker), (0, 0), 1.5) for x in sp])
        self.mips = {128: np.ascontiguousarray(np.stack([sp, np.maximum(dil, sp)], -1))}
        for P in (64, 32, 16, 8):
            prev = self.mips[P * 2]
            self.mips[P] = np.stack([cv2.resize(x, (P, P), interpolation=cv2.INTER_AREA) for x in prev])
        self.desc = z['desc'][keep]                     # (N,256)
        self.cov = z['cov'][keep]
        self.script = z['script'][keep]
        self.char = z['char'][keep]
        self.elong = z['elong'][keep]
        self.N = len(self.desc)
        # per-script prior so big scripts (CJK) do not dominate the mix: log(w_s / n_s)
        w = weights or {}
        prior = np.zeros(self.N, np.float32)
        for s in np.unique(self.script):
            m = self.script == s
            prior[m] = math.log(w.get(self.scripts[s], 1.0) / m.sum() + 1e-9)
        self.prior = prior - prior.max()


def lum(x):
    return x[..., 0] * 0.299 + x[..., 1] * 0.587 + x[..., 2] * 0.114


def tensor_field(L, s):
    """doubled-angle structure tensor vector field (a, b) at scale ~s (edge normal angle = atan2(b,a)/2)"""
    sig = max(0.6, s / 6)
    g = cv2.GaussianBlur(L, (0, 0), sig)
    ix = cv2.Sobel(g, cv2.CV_32F, 1, 0, ksize=3)
    iy = cv2.Sobel(g, cv2.CV_32F, 0, 1, ksize=3)
    rho = max(1.0, s / 2.5)
    jxx = cv2.GaussianBlur(ix * ix, (0, 0), rho)
    jyy = cv2.GaussianBlur(iy * iy, (0, 0), rho)
    jxy = cv2.GaussianBlur(ix * iy, (0, 0), rho)
    return jxx - jyy, 2 * jxy


def orient(L, s, coarse):
    a, b = tensor_field(L, s)
    ca, cb = coarse
    n = np.sqrt(a * a + b * b)
    cn = np.sqrt(ca * ca + cb * cb) + 1e-9
    scale = np.percentile(n, 90) + 1e-9
    a = a + 0.35 * scale * ca / cn
    b = b + 0.35 * scale * cb / cn
    phi = 0.5 * np.arctan2(b, a)       # gradient (edge normal) angle
    coh = np.clip(n / scale, 0, 1)
    return (phi + np.pi / 2).astype(np.float32), coh.astype(np.float32)   # tangent


def sample_patches(img, xs, ys, th, s, D=16):
    """img (H,W,C) -> (M,D,D,C): rotated square patches of side s centred at (xs,ys), canonical +x along th"""
    M = len(xs)
    u = (np.arange(D, dtype=np.float32) + 0.5) / D - 0.5
    uu, vv = np.meshgrid(u, u)                             # (D,D)
    c, sn = np.cos(th)[:, None, None], np.sin(th)[:, None, None]
    ss = s[:, None, None] if np.ndim(s) else s
    mx = xs[:, None, None] + ss * (c * uu - sn * vv)
    my = ys[:, None, None] + ss * (sn * uu + c * vv)
    mx = mx.reshape(M * D, D).astype(np.float32); my = my.reshape(M * D, D).astype(np.float32)
    C = 1 if img.ndim == 2 else img.shape[2]
    out = np.empty((M * D, D, C), np.float32)
    step = 30000
    for i in range(0, M * D, step):
        r = cv2.remap(img, mx[i:i + step], my[i:i + step], cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        out[i:i + step] = r.reshape(r.shape[0], D, C)
    return out.reshape(M, D, D, C)


def stamp(canvas, at, x, y, s, th, gid, col, op=1.0, kl=0.0, kcol=None, dcan=None, dcol=None):
    """alpha-composite one glyph sprite onto canvas (H,W,3) in place; dcan: the decision canvas (no keyline, no jitter)"""
    H, W = canvas.shape[:2]
    P = 8
    while P < s and P < 128:
        P *= 2
    spr = at.mips[P][gid]
    r = s * 0.72 + 1
    x0, y0 = int(math.floor(x - r)), int(math.floor(y - r))
    x1, y1 = int(math.ceil(x + r)), int(math.ceil(y + r))
    bx0, by0, bx1, by1 = max(x0, 0), max(y0, 0), min(x1, W), min(y1, H)
    if bx1 <= bx0 or by1 <= by0:
        return
    k = P / s
    c, sn = math.cos(th), math.sin(th)
    # dst (box px) -> sprite: u = P/2 + k R(-th) (x' + b0 - p)
    A = np.array([[k * c, k * sn, 0], [-k * sn, k * c, 0]], np.float32)
    dx, dy = bx0 + 0.5 - x, by0 + 0.5 - y
    A[0, 2] = P / 2 + k * (c * dx + sn * dy) - 0.5
    A[1, 2] = P / 2 + k * (-sn * dx + c * dy) - 0.5
    a = cv2.warpAffine(spr, A, (bx1 - bx0, by1 - by0), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP,
                       borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    reg = canvas[by0:by1, bx0:bx1]
    if kl > 0:
        k_ = a[..., 1:2] * kl
        reg += ((col * 0.25 if kcol is None else kcol)[None, None, :] - reg) * k_
    g_ = a[..., 0:1] * op
    reg += (col[None, None, :] - reg) * g_
    if dcan is not None:
        d = dcan[by0:by1, bx0:bx1]
        d += (dcol[None, None, :] - d) * g_


def ellipse_mask(H, W, focus):
    m = np.zeros((H, W), np.float32)
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    for (cx, cy, rx, ry) in focus:
        d = ((xx - cx) / rx) ** 2 + ((yy - cy) / ry) ** 2
        m = np.maximum(m, np.clip(1.5 - d, 0, 1))
    return m


def quantise(cols, pal):
    d = ((cols[:, None, :] - pal[None, :, :]) ** 2).sum(-1)
    i = d.argmin(1)
    return pal[i], i


def choose(at, G, cand_scale, tau, rng, cover_pen, coh=None, flow_bias=0.0):
    """G (M,256) gain -> glyph ids (M,), best score (M,)"""
    M = len(G)
    out = np.empty(M, np.int64)
    best = np.empty(M, np.float32)
    D = at.desc.T                                           # (256,N)
    pen = cover_pen * at.desc.sum(1)                         # (N,)
    for i in range(0, M, 4096):
        g = G[i:i + 4096]
        sc = g @ D - pen[None, :] * np.abs(g).mean(1, keepdims=True)   # (m,N)
        mx = np.abs(sc).max(1, keepdims=True) + 1e-9
        z = sc / mx + tau * (at.prior[None, :] * 0.15 - np.log(-np.log(rng.random(sc.shape, dtype=np.float32) + 1e-12)))
        if flow_bias and coh is not None:      # coherent flow (hair, folds, edges): favour stroke-like glyphs
            z += flow_bias * coh[i:i + 4096, None] * np.clip((at.elong[None, :] - 1.5) / 3, 0, 1)
        j = z.argmax(1)
        out[i:i + 4096] = j
        best[i:i + 4096] = sc[np.arange(len(j)), j]
    return out, best


def paint(src, at, cfg, rng, focus=(), canvas=None, log=print, matte=None, dcan=None, fade_new=None):
    H, W = src.shape[:2]
    paper = hexrgb(cfg.get('paper', '#0d0c12'))
    if canvas is None:
        canvas = np.empty_like(src); canvas[:] = paper
    if dcan is None:
        dcan = canvas.copy()          # decision canvas: same glyphs, flat colour, no keylines
    pal = None   # palettes are applied to the source first (posterise)
    skip_paper = cfg.get('skip_paper', True)
    L = lum(src).astype(np.float32)
    coarse = tensor_field(L, 96)
    if isinstance(focus, np.ndarray):        # v9: a focus MAP (e.g. the skin mask of a plate frame, v9/skin.py)
        fm = focus.astype(np.float32); has_focus = bool(fm.max() > 0.3)
    else:
        fm = ellipse_mask(H, W, focus) if focus else np.zeros((H, W), np.float32); has_focus = bool(focus)
    glyphs = []
    layers = [(s, False) for s in cfg['sizes']] + [(s, True) for s in cfg.get('focus_sizes', []) if has_focus]
    for li, (s, focus_only) in enumerate(layers):
        t0 = time.time()
        tgt = cv2.GaussianBlur(src, (0, 0), max(0.5, s * cfg.get('blur', 0.25)))
        fit = cv2.GaussianBlur(src, (0, 0), max(0.5, s / 20))
        th_f, coh = orient(L, s, coarse)
        # error of the canvas seen at this layer's scale (so glyph texture and keylines of earlier layers do not by
        # themselves call for refinement; only missing structure does)
        cb = cv2.GaussianBlur(dcan, (0, 0), max(0.5, s * cfg.get('blur', 0.25)))
        err = np.sqrt(((cb - tgt) ** 2).sum(-1))
        g = max(2, int(round(s * cfg.get('spacing', 0.45))))
        if focus_only:
            g = max(2, int(round(s * cfg.get('focus_spacing', 0.4))))
        ox, oy = rng.integers(0, g), rng.integers(0, g)
        e = err[oy:, ox:]
        hc, wc = e.shape[0] // g, e.shape[1] // g
        e = e[:hc * g, :wc * g].reshape(hc, g, wc, g).transpose(0, 2, 1, 3).reshape(hc, wc, g * g)
        mean = e.mean(-1)
        am = e.argmax(-1)
        cy, cx = np.mgrid[0:hc, 0:wc]
        py = oy + cy * g + am // g
        px = ox + cx * g + am % g
        fmc = fm[py, px]
        thr = cfg.get('thresh', 0.06) * (1 - 0.6 * fmc)
        sel = (mean > thr) if (li > 0 or cfg.get('layer0_thresh', False)) else np.ones_like(mean, bool)
        if focus_only:
            sel &= fmc > 0.3
        px, py = px[sel].astype(np.float32), py[sel].astype(np.float32)
        M = len(px)
        if M == 0:
            continue
        jit = cfg.get('jitter', 0.15) * s
        px += rng.normal(0, jit, M).astype(np.float32); py += rng.normal(0, jit, M).astype(np.float32)
        px = np.clip(px, 0, W - 1); py = np.clip(py, 0, H - 1)
        ix, iy = px.astype(int), py.astype(int)
        th = th_f[iy, ix] + np.where(rng.random(M) < 0.5, 0, np.pi) + rng.normal(0, cfg.get('ang_jit', 0.12), M)
        th = th.astype(np.float32)
        ss = np.full(M, s, np.float32) * rng.uniform(1 - cfg.get('size_jit', 0.25), 1 + cfg.get('size_jit', 0.25), M).astype(np.float32)
        col = tgt[iy, ix].copy()
        if cfg.get('gain') and not cfg.get('palette'):
            col = np.clip((col - 0.5) * cfg.get('contrast', 1.0) + 0.5 + 0, 0, 1) * cfg['gain']
            col = np.clip(col, 0, 1)
        fg = matte[iy, ix] > 0.5 if matte is not None else np.zeros(M, bool)
        if cfg.get('skip_lum') is not None or matte is not None or cfg.get('palette'):
            keep = (lum(col) >= cfg.get('skip_lum', 0)) | fg
            if cfg.get('palette'):      # glyphs in the paper colour are the paper: skip
                keep &= np.sqrt(((col - paper) ** 2).sum(-1)) > 0.12
            if matte is not None and cfg.get('bg_keep', 1.0) < 1:
                keep &= fg | (rng.random(M) < cfg['bg_keep'])
            if matte is not None and cfg.get('bg_minsize', 0) > s:
                keep &= fg
            fg = fg[keep]
            px, py, th, ss, col = px[keep], py[keep], th[keep], ss[keep], col[keep]
            M = len(px)
            if M == 0:
                continue
        if cfg.get('lift'):
            lc = 1 - (1 - col) * (1 - cfg['lift'])
            col = np.where(fg[:, None], lc, col) if matte is not None else lc
        if matte is not None and cfg.get('bg_dim', 1.0) != 1.0:
            col = np.where(fg[:, None], col, col * cfg['bg_dim'])
        if pal is not None:
            col, pi = quantise(col, pal)
            if skip_paper:
                keep = pi != 0          # palette[0] is the paper
                px, py, th, ss, col = px[keep], py[keep], th[keep], ss[keep], col[keep]
                M = len(px)
                if M == 0:
                    continue
        # shape fit
        tp = sample_patches(fit, px, py, th, ss)               # (M,16,16,3)
        cp = sample_patches(dcan, px, py, th, ss)
        G = ((cp - tp) ** 2).sum(-1) - ((col[:, None, None, :] - tp) ** 2).sum(-1)
        G = G.reshape(M, 256).astype(np.float32)
        gid, best = choose(at, G, s, cfg.get('tau', 0.08), rng, cfg.get('cover_pen', 0.0),
                           coh[py.astype(int), px.astype(int)], cfg.get('flow_bias', 0.0))
        ok = best > 0 if (li > 0 or cfg.get('layer0_thresh')) else np.ones(M, bool)
        order = rng.permutation(np.nonzero(ok)[0])
        op = cfg.get('opacity', 1.0) * (1.0 / fade_new if fade_new else 1.0)
        kl = cfg.get('keyline', 0.0) * float(np.clip((s - cfg.get('kl_min', 6)) / 8, 0, 1))
        kcol = hexrgb(cfg['keycol']) if cfg.get('keycol') else None
        vj = cfg.get('val_jit', 0.0)
        dcol = col
        if vj:
            col = np.clip(col * rng.uniform(1 - vj, 1 + vj, (len(col), 1)).astype(np.float32), 0, 1)
        klf = kl * (1 - cfg.get('focus_soft', 0.0) * fm[py.astype(int), px.astype(int)])   # softer keylines in the face
        for k in order:
            stamp(canvas, at, float(px[k]), float(py[k]), float(ss[k]), float(th[k]), int(gid[k]), col[k], op, float(klf[k]), kcol,
                  dcan, dcol[k])
        glyphs.append(np.stack([px[order], py[order], ss[order], th[order], gid[order].astype(np.float32),
                                col[order, 0], col[order, 1], col[order, 2], np.full(len(order), li, np.float32)], 1))
        log(f'  layer {li} s={s:5.1f}{" focus" if focus_only else ""}: {len(order):7d} glyphs  {time.time() - t0:5.1f}s')
    gl = np.concatenate(glyphs) if glyphs else np.zeros((0, 9), np.float32)
    return canvas, gl


def finish(canvas, cfg, rng):
    out = canvas
    if cfg.get('grain', 0.012):
        out = out + rng.normal(0, cfg.get('grain', 0.012), out.shape[:2])[..., None].astype(np.float32)
    return np.clip(out, 0, 1)


# ----------------------------------------------------------------- presets
INK_NIGHT = ['#0d0c12', '#ece4d4', '#f2c230', '#ff8a2a', '#3a7bd5', '#8a5cf0', '#c23a8a', '#2a9d8f', '#34304a']
BASE = dict(sizes=[80, 48, 30, 19, 12, 8], focus_sizes=[6, 4.5], spacing=0.42, thresh=0.07, tau=0.10,
            keyline=0.5, focus_soft=0.6, val_jit=0.10, flow_bias=0.5, paper='#060509')
PRESETS = {
    # A. source colour, every script; whole frame painted (sky, sea, figure)
    'colour_all': dict(BASE),
    # B. source colour on black paper: only the figure (matte) and bright things; the rest is paper
    'colour_figure': dict(BASE, skip_lum=0.16, lift=0.07),
    # C. as B, CJK + kana + hangul + strokes only (one family of shapes)
    'colour_cjk': dict(BASE, skip_lum=0.16, lift=0.07, scripts=['cjk', 'kana', 'hangul', 'stroke']),
    # D. the film's ink set on black paper (cream, gold, orange, blue, violet, magenta, teal): closest to the hatch shots
    'ink_palette': dict(BASE, palette=INK_NIGHT, gain=1.2, contrast=1.1, paper='#0d0c12', keyline=0.35, val_jit=0.06,
                        flow_bias=0.8, skip_lum=0.08, post_skip=0.28),
    # E. monochrome cream ink, three densities, on black paper (chalk/graphite)
    'mono_ink': dict(BASE, mono=True, palette=['#0d0c12', '#3c3934', '#8a8273', '#f1e9d8'], gain=1.25, contrast=1.2,
                     paper='#0d0c12', keyline=0.4, flow_bias=0.8, skip_lum=0.08, post_skip=0.3, hue_w=0),
    # F. dark ink on cream paper, all scripts (the inverse: a printed page)
    'paper_ink': dict(BASE, mono=True, light_paper=True, palette=['#efe6d2', '#b9ad96', '#6d6253', '#1d1a17'], gain=1.6,
                      contrast=1.3, paper='#efe6d2', keyline=0.0, flow_bias=0.8, hue_w=0, post_skip=0.5),
    # G. sparser, bigger glyphs: legible as text, image still reads
    'sparse_big': dict(BASE, sizes=[110, 70, 44, 28, 18], focus_sizes=[12, 8], spacing=0.6, thresh=0.10, tau=0.12),
    # H. paint-stroke density: glyphs down to 3.4 px
    'dense': dict(BASE, sizes=[72, 44, 28, 18, 12, 8, 5.5], focus_sizes=[4.2, 3.4], spacing=0.36, thresh=0.05, tau=0.08),
}


def posterise(src, cfg, matte=None):
    """palette modes: map the source per pixel to the ink set first (so error and shape fit work in ink space).
    palette[0] = paper. Background (matte < .5) below skip_lum -> paper; figure always ink (nearest non-paper)."""
    pal = np.stack([hexrgb(h) for h in cfg['palette']])
    b = cv2.GaussianBlur(src, (0, 0), cfg.get('post_blur', 1.2))
    l0 = lum(b)
    if cfg.get('mono'):
        b = l0[..., None].repeat(3, -1)
    b = np.clip((b - 0.5) * cfg.get('contrast', 1.0) + 0.5, 0, 1) * cfg.get('gain', 1.0)
    b = np.clip(b, 0, 1)
    flat = b.reshape(-1, 3)
    d = ((flat[:, None, :] - pal[None, 1:, :]) ** 2).sum(-1)
    # weigh hue: compare chroma-normalised colours too, so dim blue goes to blue, not to cream
    n = flat / (flat.sum(1, keepdims=True) + 1e-3); pn = pal[1:] / (pal[1:].sum(1, keepdims=True) + 1e-3)
    d = d + cfg.get('hue_w', 2.0) * ((n[:, None, :] - pn[None]) ** 2).sum(-1)
    idx = d.argmin(1).reshape(src.shape[:2]) + 1
    bg = (matte < 0.5) if matte is not None else np.ones(src.shape[:2], bool)
    if cfg.get('light_paper'):     # dark ink on light paper: light source = paper
        d0 = ((flat - pal[0]) ** 2).sum(-1).reshape(src.shape[:2])
        dm = np.take_along_axis(d.reshape(*src.shape[:2], -1), (idx - 1)[..., None], -1)[..., 0]
        idx[(d0 < dm) | bg] = 0
    else:
        idx[bg & (l0 < cfg.get('post_skip', 0.3))] = 0
    if matte is not None:
        idx[~bg & (l0 < cfg.get('post_dark', 0.0))] = 0
    out = pal[idx]
    return cv2.GaussianBlur(out, (0, 0), 0.8).astype(np.float32)


def prep(src, cfg, matte=None):
    s = src
    if cfg.get('palette'):
        return posterise(src, cfg, matte)
    if cfg.get('mono'):
        l = lum(s)[..., None].repeat(3, -1)
        if cfg.get('invert'):
            l = 1 - l
        s = l.astype(np.float32)
    return s


def load(path, W=1920, H=1080):
    im = cv2.imread(path, cv2.IMREAD_COLOR)[..., ::-1].astype(np.float32) / 255
    if im.shape[1] != W or im.shape[0] != H:
        im = cv2.resize(im, (W, H), interpolation=cv2.INTER_CUBIC if im.shape[1] < W else cv2.INTER_AREA)
    return np.ascontiguousarray(im)


def save(path, im):
    cv2.imwrite(path, (np.clip(im, 0, 1)[..., ::-1] * 255 + 0.5).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, 92])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('out')
    ap.add_argument('--preset', default='colour_all')
    ap.add_argument('--set', action='append', default=[], help='key=json override')
    ap.add_argument('--focus', action='append', default=[], help='cx,cy,rx,ry in 1920x1080 px')
    ap.add_argument('--seed', type=int, default=1)
    ap.add_argument('--dump-src', default='')
    ap.add_argument('--matte', default='', help='RGBA png (figure alpha) from tools/matte.py')
    ap.add_argument('--weights', default='')
    a = ap.parse_args()
    cfg = dict(PRESETS[a.preset])
    for kv in a.set:
        k, v = kv.split('=', 1); cfg[k] = json.loads(v)
    w = json.loads(a.weights) if a.weights else {'stroke': 6, 'box': 2, 'cjk': 3, 'latin': 2, 'math': 2}
    at = Atlas(scripts=cfg.get('scripts'), weights=w, max_cov=cfg.get('max_cov', 0.55))
    rng = np.random.default_rng(a.seed)
    src = load(a.src)
    matte = None
    if a.matte:
        mm = cv2.imread(a.matte, cv2.IMREAD_UNCHANGED)
        matte = cv2.resize(mm[..., 3], (src.shape[1], src.shape[0])).astype(np.float32) / 255
    src = prep(src, cfg, matte)
    if a.dump_src:
        save(a.dump_src, src)
    focus = [tuple(float(v) for v in f.split(',')) for f in a.focus]
    t0 = time.time()
    canvas, gl = paint(src, at, cfg, rng, focus, matte=matte)
    out = finish(canvas, cfg, rng)
    save(a.out, out)
    np.save(a.out.rsplit('.', 1)[0] + '_glyphs.npy', gl)
    print(f'{a.out}: {len(gl)} glyphs, {at.N} atlas glyphs, {time.time() - t0:.1f}s')


if __name__ == '__main__':
    main()
