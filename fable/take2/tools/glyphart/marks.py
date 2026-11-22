#!/usr/bin/env python3
"""Glyph MARKS (iteration 2): a picture built from separate glyphs, each one flat single-value ink, with paper between them.

  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/marks.py SRC OUT.jpg --preset mono_cream|ink_paper|colour
      [--matte RGBA.png] [--focus cx,cy,rx,ry ...] [--set key=json]

Three passes, all glyphs, nothing of the source shows through:
 1. FILL: a quadtree of cells (40/20/10/5 px) from a size field (small where detail is high and in the focus ellipses = face,
    hands; large in flat areas and the background). One glyph per cell, drawn at about the cell size (so thin gaps of paper
    remain), turned to the local structure-tensor tangent. Glyph AND ink value are chosen together by least squares against
    the tone patch under it: argmax over (glyph, value) of 2 v T.m - v^2 m.m (+ Gumbel variety), so dense glyphs make darks,
    open ones lights, and an empty cell is paper. A second glyph is added on the residual where the tone is still far off.
 2. STRANDS (hair, and long cloth folds): streamlines of the tangent field traced through the hair region (evenly spaced,
    Jobard-Lefer style), with long stroke glyphs (丿 ノ ㇒ ∫ ﹏ ~ ل ― ...) laid end to end along each streamline.
 3. LINES (features: eyes, brows, mouth, contours): ridge map of the drawn lines; stroke glyphs placed greedily along it,
    spaced by their length, oriented along the line. Drawn last, in the line's ink (dark ink on light paper; on dark paper
    the drawn lines are cut in the paper colour).
"""
import os, sys, math, json, time, argparse
import numpy as np, cv2

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import paint as P

STROKE_PREF = set('ノ丿／|ー一―﹏∫ل乀丶亅㇏㇀⺁∼∽⌒⁀‿⸺⸻﹋﹌~〜〰）（｜‖╱╲⟋⟍〳〵乚乛ㇾ')


def tone_map(src, cfg, matte):
    L = P.lum(src)
    if cfg['paper_light']:
        T = 1 - L                                   # ink = darkness
        T = np.clip((T - cfg.get('t0', 0.15)) / (1 - cfg.get('t0', 0.15)), 0, 1) ** cfg.get('gamma', 1.0)
    else:
        T = np.clip((L - cfg.get('t0', 0.1)) / (1 - cfg.get('t0', 0.1)), 0, 1) ** cfg.get('gamma', 1.0)
    if matte is not None and cfg.get('bg_scale') is not None:
        T = np.where(matte > 0.5, T, T * cfg['bg_scale'])
    return T.astype(np.float32)


def size_field(L, cfg, matte, fm):
    gx = cv2.Sobel(cv2.GaussianBlur(L, (0, 0), 1.5), cv2.CV_32F, 1, 0)
    gy = cv2.Sobel(cv2.GaussianBlur(L, (0, 0), 1.5), cv2.CV_32F, 0, 1)
    d = cv2.GaussianBlur(np.hypot(gx, gy), (0, 0), 6)
    d = np.clip(d / (np.percentile(d, 97) + 1e-6), 0, 1)
    s = cfg['s_flat'] - (cfg['s_flat'] - cfg['s_detail']) * np.clip(d * 1.6, 0, 1)
    if matte is not None:
        s = np.where(matte > 0.5, s, cfg.get('s_bg', 40))
    # focus (face, hands): medium marks on smooth skin, the smallest only where there is detail (eyes, brows, mouth, fingers)
    s = np.where(fm > 0.35, np.minimum(s, cfg.get('s_face_flat', 10)), s)
    s = np.where((fm > 0.35) & (d > cfg.get('face_detail', 0.5)), np.minimum(s, cfg['s_face']), s)
    return s.astype(np.float32)


def quadtree(s, levels=(40, 20, 10, 5)):
    H, W = s.shape
    out = []
    active = None
    for i, c in enumerate(levels):
        h, w = H // c, W // c
        sm = s[:h * c, :w * c].reshape(h, c, w, c).min(axis=(1, 3))
        if active is None:
            active = np.ones((h, w), bool)
        else:
            active = np.repeat(np.repeat(active, 2, 0), 2, 1)[:h, :w]
        last = i == len(levels) - 1
        leaf = active & ((sm >= c * 0.8) | last)
        yy, xx = np.nonzero(leaf)
        out.append(np.stack([xx * c + c / 2, yy * c + c / 2, np.full(len(xx), c)], 1))
        active = active & ~leaf
    return np.concatenate(out).astype(np.float32)


def fit_marks(at, Tp, vlev, tau, rng, coh=None, flow_bias=0.0, cand=None):
    """Tp (M,256) tone patches; vlev (M,K) candidate ink values -> gid, v, score"""
    D = at.desc if cand is None else at.desc[cand]
    mm = (D * D).sum(1)                                     # (N,)
    M = len(Tp)
    gid = np.empty(M, np.int64); vv = np.empty(M, np.float32); best = np.empty(M, np.float32)
    for i in range(0, M, 4096):
        tm = Tp[i:i + 4096] @ D.T                           # (m,N)
        bs = None
        for k in range(vlev.shape[1]):
            v = vlev[i:i + 4096, k:k + 1]
            sc = 2 * v * tm - v * v * mm[None, :]
            if bs is None:
                bs, bk = sc, np.zeros(sc.shape, np.int8)
            else:
                m_ = sc > bs; bs = np.where(m_, sc, bs); bk = np.where(m_, k, bk)
        scale = np.abs(bs).max(1, keepdims=True) + 1e-6
        z = bs / scale + tau * (-np.log(-np.log(rng.random(bs.shape, dtype=np.float32) + 1e-12)))
        if cand is None:
            z += tau * at.prior[None, :] * 0.15
            if flow_bias and coh is not None:
                z += flow_bias * coh[i:i + 4096, None] * np.clip((at.elong[None, :] - 1.5) / 3, 0, 1)
        j = z.argmax(1)
        r = np.arange(len(j))
        gid[i:i + 4096] = j if cand is None else cand[j]
        vv[i:i + 4096] = vlev[i:i + 4096][r, bk[r, j]]
        best[i:i + 4096] = bs[r, j]
    return gid, vv, best


def ink_of(v, cfg, colour=None):
    """value v in [0,1] (ink amount) -> rgb"""
    paper = P.hexrgb(cfg['paper']); ink = P.hexrgb(cfg['ink'])
    if colour is not None:
        return colour
    return paper + (ink - paper) * v


def streamlines(th, region, sep, rng, step=1.5, maxlen=400, minlen=10):
    H, W = region.shape
    occ = np.zeros((H, W), np.uint8)
    seeds = np.argwhere(region[::3, ::3]) * 3
    rng.shuffle(seeds)
    lines = []
    for sy, sx in seeds:
        if occ[sy, sx]:
            continue
        pts = []
        for sgn in (1, -1):
            x, y = float(sx), float(sy)
            px, py = None, None
            seg = []
            for _ in range(int(maxlen / step)):
                ix, iy = int(x), int(y)
                if ix < 0 or iy < 0 or ix >= W or iy >= H or not region[iy, ix]:
                    break
                if seg and occ[iy, ix]:
                    break
                a = th[iy, ix]
                dx, dy = math.cos(a), math.sin(a)
                if px is not None and dx * px + dy * py < 0:
                    dx, dy = -dx, -dy
                if px is None and sgn < 0:
                    dx, dy = -dx, -dy
                seg.append((x, y))
                px, py = dx, dy
                x += dx * step; y += dy * step
            pts = (seg[::-1] + pts[1:]) if sgn < 0 else seg
        if len(pts) * step < minlen:
            continue
        p = np.array(pts, np.float32)
        cv2.polylines(occ, [p.round().astype(np.int32).reshape(-1, 1, 2)], False, 1, thickness=max(1, int(sep)))
        lines.append(p)
    return lines


def place_along(lines, Ls, gap=0.92):
    """stroke positions along polylines: centre, angle, length"""
    out = []
    for p in lines:
        d = np.r_[0, np.cumsum(np.hypot(*np.diff(p, axis=0).T))]
        if d[-1] < Ls * 0.6:
            continue
        n = max(1, int(d[-1] / (Ls * gap)))
        for k in range(n):
            a0 = (k + 0.5) * d[-1] / n
            i = min(np.searchsorted(d, a0), len(p) - 1)
            i0, i1 = max(0, i - 3), min(len(p) - 1, i + 3)
            ang = math.atan2(p[i1, 1] - p[i0, 1], p[i1, 0] - p[i0, 0])
            out.append((p[i, 0], p[i, 1], ang))
    return np.array(out, np.float32).reshape(-1, 3)


def render_marks(src, at, cfg, rng, matte=None, focus=(), log=print):
    H, W = src.shape[:2]
    paper = P.hexrgb(cfg['paper'])
    can = np.empty((H, W, 3), np.float32); can[:] = paper
    L = P.lum(src).astype(np.float32)
    fm = P.ellipse_mask(H, W, focus) if focus else np.zeros((H, W), np.float32)
    T = tone_map(src, cfg, matte)
    coarse = P.tensor_field(L, 96)
    th10, coh10 = P.orient(L, 10, coarse)
    fg = matte > 0.5 if matte is not None else np.ones((H, W), bool)
    stats = {}
    # ---------------------------------------------------------------- hair region
    hair = np.zeros((H, W), bool)
    if cfg.get('hair_lum') is not None:
        hb = cv2.GaussianBlur(L, (0, 0), 2)
        hair = fg & (hb < cfg['hair_lum'])
        if cfg.get('hair_ymax'):
            hair[int(cfg['hair_ymax'] * H):] = False
        hair = cv2.morphologyEx(hair.astype(np.uint8), cv2.MORPH_OPEN, np.ones((5, 5), np.uint8)) > 0
    # ---------------------------------------------------------------- 1. fill
    s = size_field(L, cfg, matte, fm)
    cells = quadtree(s, tuple(cfg.get('levels', (40, 20, 10, 5))))
    cx, cy, cs = cells[:, 0], cells[:, 1], cells[:, 2]
    ix = np.clip(cx.astype(int), 0, W - 1); iy = np.clip(cy.astype(int), 0, H - 1)
    keep = ~hair[iy, ix] if cfg.get('hair_only_strands', True) else np.ones(len(cx), bool)
    cx, cy, cs, ix, iy = cx[keep], cy[keep], cs[keep], ix[keep], iy[keep]
    M = len(cx)
    jit = cfg.get('jit', 0.12)
    cx = cx + rng.normal(0, jit, M).astype(np.float32) * cs
    cy = cy + rng.normal(0, jit, M).astype(np.float32) * cs
    ss = cs * rng.uniform(cfg.get('mark_lo', 0.95), cfg.get('mark_hi', 1.1), M).astype(np.float32)
    # orientation per cell size
    th = np.empty(M, np.float32); coh = np.empty(M, np.float32)
    for c in np.unique(cs):
        m = cs == c
        t_, k_ = P.orient(L, float(c), coarse)
        th[m] = t_[iy[m], ix[m]]; coh[m] = k_[iy[m], ix[m]]
    th += np.where(rng.random(M) < 0.5, 0, np.pi).astype(np.float32) + rng.normal(0, 0.1, M).astype(np.float32)
    Tb = cv2.GaussianBlur(T, (0, 0), 0.7)
    Tp = P.sample_patches(Tb[..., None], cx, cy, th, ss)[..., 0].reshape(M, 256)
    colour = None
    if cfg.get('colour'):
        cb = cv2.GaussianBlur(src, (0, 0), 2.0)
        col = cb[iy, ix]
        lc = P.lum(col)[:, None]
        col = np.clip(col * cfg.get('col_boost', 1.6) + cfg.get('col_lift', 0.04), 0, 1)
        vl = np.clip(P.lum(col), 0.05, 1)[:, None].astype(np.float32)
        vlev = vl
    else:
        vlev = np.tile(np.array(cfg['values'], np.float32)[None], (M, 1))
    gid, vv, best = fit_marks(at, Tp, vlev, cfg.get('tau', 0.12), rng, coh, cfg.get('flow_bias', 0.6))
    ok = best > cfg.get('min_score', 0.02) * (Tp ** 2).sum(1).clip(1e-3)  # empty cell -> paper
    ok &= Tp.mean(1) > cfg.get('empty_t', 0.06)
    marks = [(cx, cy, ss, th, gid, vv, ok, col if cfg.get('colour') else None)]
    # second mark on the residual where still far too light (darks need more ink than one glyph gives)
    m1 = at.desc[gid] * vv[:, None]
    R = np.clip(Tp - m1, 0, 1)
    need = ok & (R.mean(1) > cfg.get('second_t', 0.22))
    if need.any():
        n = np.nonzero(need)[0]
        th2 = th[n] + rng.choice([np.pi / 2, -np.pi / 2, np.pi / 3], len(n)).astype(np.float32) * cfg.get('cross', 0.0) \
              + rng.normal(0, 0.15, len(n)).astype(np.float32)
        cx2 = cx[n] + rng.normal(0, 0.18, len(n)).astype(np.float32) * cs[n]
        cy2 = cy[n] + rng.normal(0, 0.18, len(n)).astype(np.float32) * cs[n]
        Tp2 = P.sample_patches(np.clip(Tb - 0.0, 0, 1)[..., None], cx2, cy2, th2, ss[n] * 0.9)[..., 0].reshape(len(n), 256)
        Tp2 = np.clip(Tp2 - 0.5 * m1[n], 0, 1)
        g2, v2, b2 = fit_marks(at, Tp2, vlev[n], cfg.get('tau', 0.12), rng, coh[n], cfg.get('flow_bias', 0.6))
        marks.append((cx2, cy2, ss[n] * 0.9, th2, g2, v2, b2 > 0, col[n] if cfg.get('colour') else None))
    nfill = 0
    for (x_, y_, s_, t_, g_, v_, ok_, c_) in marks:
        order = rng.permutation(np.nonzero(ok_)[0])
        order = order[np.argsort(-s_[order], kind='stable')]        # big first
        for k in order:
            c = c_[k] if c_ is not None else ink_of(float(v_[k]), cfg)
            P.stamp(can, at, float(x_[k]), float(y_[k]), float(s_[k]), float(t_[k]), int(g_[k]), c)
        nfill += len(order)
    stats['fill'] = nfill
    # stroke-glyph candidate set
    elong_ids = np.nonzero(at.elong > cfg.get('stroke_elong', 2.6))[0]
    pref = np.array([i for i in elong_ids if at.char[i] in STROKE_PREF])
    # ---------------------------------------------------------------- 2. strands
    nstr = 0
    if hair.any():
        th_h, coh_h = P.orient(L, cfg.get('hair_scale', 8), coarse)
        lines = streamlines(th_h, hair, cfg.get('hair_sep', 4), rng)
        Ls = cfg.get('hair_len', 18)
        pts = place_along(lines, Ls)
        if len(pts):
            pool = pref if len(pref) and cfg.get('hair_pref', True) else elong_ids
            g = pool[rng.integers(0, len(pool), len(pts))]
            for (x, y, a), gi in zip(pts, g):
                if cfg.get('colour'):
                    c = np.clip(cv2.getRectSubPix(src, (1, 1), (float(x), float(y)))[0, 0] * cfg.get('hair_boost', 2.4) + 0.06, 0, 1)
                else:
                    c = ink_of(cfg['hair_v'], cfg)
                ln = Ls * rng.uniform(0.85, 1.25)
                P.stamp(can, at, float(x), float(y), float(ln), float(a + (math.pi if rng.random() < 0.5 else 0)), int(gi), c)
            nstr = len(pts)
    stats['strands'] = nstr
    # ---------------------------------------------------------------- 3. lines
    nl = 0
    if cfg.get('lines', True):
        b1 = cv2.GaussianBlur(L, (0, 0), 0.8); b2 = cv2.GaussianBlur(L, (0, 0), 3.0)
        Lm = np.clip((b2 - b1) * cfg.get('line_gain', 6.0), 0, 1)          # dark thin lines
        if cfg.get('bright_lines'):
            Lm = np.maximum(Lm, np.clip((b1 - b2) * cfg.get('line_gain', 6.0), 0, 1))
        Lm[~fg] = 0
        if cfg.get('lines_focus_only'):
            Lm[fm < 0.3] = 0
        Lm[hair] = 0
        thr = cfg.get('line_thr', 0.35)
        yy, xx = np.nonzero(Lm > thr)
        if len(xx):
            o = np.argsort(-Lm[yy, xx])
            yy, xx = yy[o], xx[o]
            th_l, _ = P.orient(Lm, 4, P.tensor_field(Lm, 24))
            occ = np.zeros((H, W), np.uint8)
            sel = []
            for y, x in zip(yy, xx):
                if occ[y, x]:
                    continue
                f = fm[y, x]
                Ll = cfg.get('line_len_face', 9) if f > 0.4 else cfg.get('line_len', 14)
                sel.append((x, y, Ll, th_l[y, x]))
                cv2.circle(occ, (int(x), int(y)), int(Ll * 0.42), 1, -1)
            sel = np.array(sel, np.float32)
            # shape-fit the stroke glyph to the line patch (stroke glyphs only)
            Lp = P.sample_patches(Lm[..., None], sel[:, 0], sel[:, 1], sel[:, 3], sel[:, 2] * 1.05)[..., 0].reshape(len(sel), 256)
            g, _, _ = fit_marks(at, Lp, np.ones((len(sel), 1), np.float32), 0.15, rng, cand=elong_ids)
            lc = P.hexrgb(cfg.get('line_ink', cfg['ink']))
            for (x, y, Ll, a), gi in zip(sel, g):
                P.stamp(can, at, float(x), float(y), float(Ll), float(a), int(gi), lc)
            nl = len(sel)
    stats['lines'] = nl
    log(f'  fill {stats["fill"]}  strands {stats["strands"]}  lines {stats["lines"]}')
    return can, stats


PRESETS = {
    # E2: cream ink on black paper, three ink values; drawn lines cut in paper colour
    'mono_cream': dict(paper='#0c0b10', ink='#f2eadb', paper_light=False, values=[1.0, 0.62, 0.34], t0=0.08, gamma=0.9,
                       s_flat=20, s_detail=10, s_face=5, s_bg=40, bg_scale=0.6, hair_lum=0.2, hair_v=0.42, hair_sep=3,
                       hair_len=26, hair_scale=30, line_ink='#0c0b10', line_thr=0.3, tau=0.12, second_t=0.14, mark_hi=1.2),
    # F2: dark ink on cream paper, three values; hair = dark strands; drawn lines in darkest ink
    'ink_paper': dict(paper='#efe7d4', ink='#17140f', paper_light=True, values=[1.0, 0.6, 0.32], t0=0.22, gamma=0.8,
                      s_flat=20, s_detail=10, s_face=5, s_bg=40, bg_scale=0.0, hair_lum=0.2, hair_v=1.0, hair_sep=3.5,
                      hair_len=26, hair_scale=30, line_ink='#17140f', line_thr=0.3, tau=0.12, second_t=0.2),
    # C2: colour marks on black: each glyph one flat colour (the source colour of its cell, brightened)
    'colour': dict(paper='#0a090e', ink='#ffffff', paper_light=False, colour=True, t0=0.06, gamma=0.8,
                   s_flat=20, s_detail=10, s_face=5, s_bg=40, bg_scale=0.3, hair_lum=0.2, hair_sep=3, hair_len=26,
                   hair_scale=30, line_ink='#0a090e', line_thr=0.3, tau=0.12, second_t=0.14, col_boost=1.5, mark_hi=1.2),
}


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('src'); ap.add_argument('out')
    ap.add_argument('--preset', default='mono_cream')
    ap.add_argument('--set', action='append', default=[])
    ap.add_argument('--focus', action='append', default=[])
    ap.add_argument('--matte', default='')
    ap.add_argument('--seed', type=int, default=3)
    a = ap.parse_args()
    cfg = dict(PRESETS[a.preset])
    for kv in a.set:
        k, v = kv.split('=', 1); cfg[k] = json.loads(v)
    at = P.Atlas(scripts=cfg.get('scripts'), weights={'stroke': 6, 'box': 1.5, 'cjk': 3, 'latin': 2, 'math': 2})
    rng = np.random.default_rng(a.seed)
    src = P.load(a.src)
    matte = None
    if a.matte:
        mm = cv2.imread(a.matte, cv2.IMREAD_UNCHANGED)
        matte = cv2.resize(mm[..., 3], (src.shape[1], src.shape[0])).astype(np.float32) / 255
    focus = [tuple(float(v) for v in f.split(',')) for f in a.focus]
    t0 = time.time()
    can, st = render_marks(src, at, cfg, rng, matte, focus)
    P.save(a.out, P.finish(can, dict(grain=0.008), rng))
    print(f'{a.out}: {st}, {time.time() - t0:.1f}s')


if __name__ == '__main__':
    main()
