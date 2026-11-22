#!/usr/bin/env python3
"""Temporally coherent glyph painting of a frame sequence.

  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/animate.py --t0 135.0 --t1 141.6 --out DIR [--preset colour_all]
      [--workers 4] [--boil 0.08] [--bpm-beat 0.4322] [--beat0 135.508]

Source frames: v7 raw (`work_fable/take2/v7/full/f_%05d.jpg`, number = round(t*30)); from frame 4143 on the orchestra variant
(`work_fable/take2/v7/orchestra/`), which is v7 itself outside bars 81-85.
Per shot (cuts found by frame difference) the first frame is painted from scratch; after that every glyph is carried by
optical flow (DIS, forward; forward-backward check kills occluded glyphs), rotated by the local flow curl, recoloured from the
new frame (smoothed), and kept. Holes are filled by the painter's error-driven layers on top of the carried glyphs (new glyphs
fade in over 3 frames); crowding is capped per layer cell. Boil: on every eighth note a fraction of glyphs re-choose their
character by shape fit (identity changes, position/size/orientation stay), so the texture breathes on the music instead of
re-scattering every frame. Shots are independent, so they run in parallel.
"""
import os, sys, math, time, argparse, json
os.environ.setdefault('OMP_NUM_THREADS', '1')
import numpy as np, cv2
from multiprocessing import Pool

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import paint as P

ROOT = P.ROOT
V7 = os.path.join(ROOT, 'work_fable', 'take2', 'v7')


def frame_path(k):
    if k >= 4143:
        p = os.path.join(V7, 'orchestra', f'f_{k:05d}.jpg')
        if os.path.exists(p):
            return p
    return os.path.join(V7, 'full', f'f_{k:05d}.jpg')


def src_path(opt, k):
    """v9: plate mode (--frames DIR): plate frame k (1-based) of DIR/f_%04d.jpg; else the v7 frame k (= round(t*30))"""
    if opt.get('frames'):
        return os.path.join(opt['frames'], f'f_{k:04d}.jpg')
    return frame_path(k)


def song_t(opt, k):
    """song time of frame k (for the eighth-note boil): plate frames play from --t0 at --fps"""
    if opt.get('frames'):
        return opt['t0'] + (k - 1) / opt['fps']
    return k / 30.0


def focus_at(opt, k, src=None):
    """v9: focus for frame k: static ellipses (--focus) and/or the skin map of the frame (--focus-skin), as one map"""
    ell = opt.get('focus') or []
    if not opt.get('focus_skin'):
        return ell
    from v9.skin import skin_mask
    m = skin_mask(src) * opt['focus_skin']
    if ell:
        m = np.maximum(m, P.ellipse_mask(src.shape[0], src.shape[1], ell))
    return m


def find_cuts(ks, thr=0.10):
    segs, cur, prev = [], [ks[0]], None
    for k in ks:
        g = cv2.resize(cv2.imread(frame_path(k), cv2.IMREAD_GRAYSCALE), (192, 108), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        if prev is not None:
            d = np.abs(g - prev).mean()
            if d > thr:
                segs.append(cur); cur = [k]
            elif k != cur[0]:
                cur.append(k)
        prev = g
    segs.append(cur)
    return segs


def under(src, cfg, k):
    """underpainting: the source heavily blurred and darkened, so a hole left by a culled glyph is a soft patch of the
    right colour instead of black paper"""
    paper = P.hexrgb(cfg.get('paper', '#060509'))
    if k <= 0:
        c = np.empty_like(src); c[:] = paper; return c
    return (paper + (cv2.GaussianBlur(src, (0, 0), 18) - paper) * k).astype(np.float32)


def render(gl, at, cfg, H, W, fade, base):
    """gl columns: x y s th gid r g b layer age"""
    can = base.copy()
    dcan = can.copy()
    kl0 = cfg.get('keyline', 0.0)
    order = np.lexsort((np.arange(len(gl)), gl[:, 8]))
    for i in order:
        x, y, s, th, gid, r, g, b, li, age = gl[i]
        col = np.array([r, g, b], np.float32)
        op = min(1.0, (age + 1) / fade)
        kl = kl0 * float(np.clip((s - cfg.get('kl_min', 6)) / 8, 0, 1))
        P.stamp(can, at, float(x), float(y), float(s), float(th), int(gid), col, op, kl * op, None, dcan, col)
    return can, dcan


def cap_crowding(gl, cfg, H, W, rng, cap):
    keep = np.ones(len(gl), bool)
    for li in np.unique(gl[:, 8]):
        m = np.nonzero(gl[:, 8] == li)[0]
        s = np.median(gl[m, 2])
        if s >= 40:            # coarse layers: never culled for crowding (they hold the masses steady)
            continue
        g = max(2.0, s * 0.6)
        cx = (gl[m, 0] // g).astype(np.int64); cy = (gl[m, 1] // g).astype(np.int64)
        key = cy * 100000 + cx
        perm = rng.permutation(len(m))
        # keep the oldest `cap` in each cell (stability), drop the rest
        o = np.lexsort((-gl[m[perm], 9], key[perm]))
        idx = m[perm][o]; kk = key[perm][o]
        first = np.r_[True, kk[1:] != kk[:-1]]
        grp = np.cumsum(first) - 1
        start = np.nonzero(first)[0]
        rank = np.arange(len(kk)) - start[grp]
        keep[idx[rank >= cap]] = False
    return gl[keep]


def run_segment(args):
    seg, cfg, outdir, seed, opt = args
    rng = np.random.default_rng(seed)
    cv2.setNumThreads(2)
    at = P.Atlas(scripts=cfg.get('scripts'), weights=opt['weights'], max_cov=cfg.get('max_cov', 0.55))
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    gl = None; prev_small = None; tlog = []
    for j, k in enumerate(seg):
        t0 = time.time()
        src = P.load(src_path(opt, k))
        H, W = src.shape[:2]
        foc = focus_at(opt, k, src)
        small = cv2.cvtColor((src * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY)
        small = cv2.resize(small, (W // 2, H // 2), interpolation=cv2.INTER_AREA)
        if gl is None:
            base = under(src, cfg, opt['under'])
            can, g0 = P.paint(src, at, cfg, rng, foc, canvas=base.copy(), dcan=base.copy(), log=lambda *a: None)
            gl = np.concatenate([g0, np.full((len(g0), 1), 99, np.float32)], 1)
            dcan = None
        else:
            ff = dis.calc(prev_small, small, None)
            fb = dis.calc(small, prev_small, None)
            xs, ys = gl[:, 0] / 2, gl[:, 1] / 2
            ix = np.clip(xs.astype(int), 0, W // 2 - 1); iy = np.clip(ys.astype(int), 0, H // 2 - 1)
            u = ff[iy, ix]
            nx, ny = xs + u[:, 0], ys + u[:, 1]
            jx = np.clip(nx.astype(int), 0, W // 2 - 1); jy = np.clip(ny.astype(int), 0, H // 2 - 1)
            back = fb[jy, jx]
            err = np.hypot(u[:, 0] + back[:, 0], u[:, 1] + back[:, 1])
            # flow curl -> rotation
            dvx_dy = np.gradient(ff[..., 0], axis=0); dvy_dx = np.gradient(ff[..., 1], axis=1)
            curl = 0.5 * (dvy_dx - dvx_dy)
            gl[:, 3] += curl[iy, ix]
            div = np.gradient(ff[..., 0], axis=1) + np.gradient(ff[..., 1], axis=0)
            gl[:, 2] *= np.clip(1 + 0.5 * div[iy, ix], 0.9, 1.1)      # zoom: glyphs grow/shrink with the surface
            gl[:, 0] = nx * 2; gl[:, 1] = ny * 2
            ok = (err < opt['fb_tol'] + 0.05 * np.hypot(u[:, 0], u[:, 1])) & (gl[:, 0] > -20) & (gl[:, 0] < W + 20) & \
                 (gl[:, 1] > -20) & (gl[:, 1] < H + 20)
            gl = gl[ok]
            # recolour from the new frame at each glyph's layer scale (smoothed over time)
            for li in np.unique(gl[:, 8]):
                m = gl[:, 8] == li
                s = float(np.median(gl[m, 2]))
                tgt = cv2.GaussianBlur(src, (0, 0), max(0.5, s * cfg.get('blur', 0.25)))
                c = tgt[np.clip(gl[m, 1].astype(int), 0, H - 1), np.clip(gl[m, 0].astype(int), 0, W - 1)]
                gl[m, 5:8] = 0.5 * gl[m, 5:8] + 0.5 * c
            # boil on the eighth notes
            t = song_t(opt, k)
            ph = (t - opt['beat0']) / (opt['beat'] / 2)
            tp = song_t(opt, k - 1)
            if math.floor(ph) != math.floor((tp - opt['beat0']) / (opt['beat'] / 2)) and opt['boil'] > 0:
                b = np.nonzero(rng.random(len(gl)) < opt['boil'])[0]
                # v9: no boil inside the focus (face, hands): eyes and mouth stay temporally stable (sung shots)
                fmap = foc if isinstance(foc, np.ndarray) else (P.ellipse_mask(H, W, foc) if foc else None)
                if fmap is not None and len(b):
                    b = b[fmap[np.clip(gl[b, 1].astype(int), 0, H - 1), np.clip(gl[b, 0].astype(int), 0, W - 1)] < 0.3]
                if len(b):
                    fit = cv2.GaussianBlur(src, (0, 0), 1.0)
                    paper = P.hexrgb(cfg.get('paper', '#060509'))
                    ss = gl[b, 2]
                    tp_ = P.sample_patches(fit, gl[b, 0], gl[b, 1], gl[b, 3], ss)
                    col = gl[b, 5:8]
                    G = (((paper - tp_) ** 2).sum(-1) - ((col[:, None, None, :] - tp_) ** 2).sum(-1)).reshape(len(b), 256)
                    gid, _ = P.choose(at, G.astype(np.float32), 0, cfg.get('tau', 0.1) * 1.5, rng, 0.0)
                    gl[b, 4] = gid
            gl = cap_crowding(gl, cfg, H, W, rng, opt['cap'])
            can, dcan = render(gl, at, cfg, H, W, opt['fade'], under(src, cfg, opt['under']))
            # fill holes on top (error-driven, thresholded also in the coarsest layer)
            fcfg = dict(cfg, layer0_thresh=True, thresh=cfg.get('thresh', 0.07) * opt['fill_k'])
            can, gnew = P.paint(src, at, fcfg, rng, foc, canvas=can, dcan=dcan, log=lambda *a: None, fade_new=opt['fade'])
            if len(gnew):
                gl = np.concatenate([gl, np.concatenate([gnew, np.zeros((len(gnew), 1), np.float32)], 1)])
        gl[:, 9] += 1
        out = P.finish(can, cfg, rng)
        P.save(os.path.join(outdir, f'f_{k:04d}.jpg' if opt.get('frames') else f'f_{k:05d}.jpg'), out)
        tlog.append((k, len(gl), time.time() - t0))
        prev_small = small
    return tlog


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--t0', type=float, default=135.0); ap.add_argument('--t1', type=float, default=141.6)
    ap.add_argument('--out', required=True); ap.add_argument('--preset', default='colour_all')
    ap.add_argument('--set', action='append', default=[])
    ap.add_argument('--workers', type=int, default=4)
    ap.add_argument('--boil', type=float, default=0.08)
    ap.add_argument('--beat', type=float, default=0.43225)        # b78.1 133.779 -> b79.1 135.508: 1.729 s per bar
    ap.add_argument('--beat0', type=float, default=135.508)
    ap.add_argument('--cap', type=int, default=1)
    ap.add_argument('--fade', type=float, default=3)
    ap.add_argument('--fill-k', type=float, default=2.0)
    ap.add_argument('--fb-tol', type=float, default=1.0)
    ap.add_argument('--under', type=float, default=0.7)
    # v9 plate mode: paint a plate's frames (DIR/f_%04d.jpg, 1-based) into a new plate folder OUT/frames + meta.json + REAL
    ap.add_argument('--frames', default='', help='plate frames dir (plate mode); --t0 = song time of frame 1, --fps the plate fps')
    ap.add_argument('--fps', type=float, default=24)
    ap.add_argument('--first', type=int, default=1); ap.add_argument('--last', type=int, default=0)
    ap.add_argument('--focus', action='append', default=[], help='cx,cy,rx,ry (1920x1080 px), static')
    ap.add_argument('--focus-skin', type=float, default=0, help='>0: per-frame skin map (faces, hands) as focus, this strength')
    ap.add_argument('--seed', type=int, default=1000)
    a = ap.parse_args()
    cfg = dict(P.PRESETS[a.preset])
    for kv in a.set:
        k, v = kv.split('=', 1); cfg[k] = json.loads(v)
    os.makedirs(a.out, exist_ok=True)
    plate = bool(a.frames)
    if plate:
        pdir = os.path.dirname(os.path.abspath(a.frames.rstrip('/')))
        pm = json.load(open(os.path.join(pdir, 'meta.json')))
        last = a.last or pm['n']
        segs = [list(range(a.first, last + 1))]          # a plate is one shot
        fdir = os.path.join(a.out, 'frames'); os.makedirs(fdir, exist_ok=True)
    else:
        ks = list(range(round(a.t0 * 30), round(a.t1 * 30)))
        segs = find_cuts(ks)
        fdir = a.out
    print('segments', [(s[0], len(s)) for s in segs])
    opt = dict(weights={'stroke': 6, 'box': 2, 'cjk': 3, 'latin': 2, 'math': 2}, focus=[], boil=a.boil, beat=a.beat,
               beat0=a.beat0, cap=a.cap, fade=a.fade, fill_k=a.fill_k, fb_tol=a.fb_tol, under=a.under,
               frames=a.frames, fps=a.fps, t0=a.t0, focus_skin=a.focus_skin)
    opt['focus'] = [tuple(float(v) for v in f.split(',')) for f in a.focus]
    jobs = [(s, cfg, fdir, a.seed + i, opt) for i, s in enumerate(segs)]
    jobs.sort(key=lambda j: -len(j[0]))
    t0 = time.time()
    with Pool(a.workers) as pool:
        logs = pool.map(run_segment, jobs, chunksize=1)
    allt = [x for l in logs for x in l]
    json.dump(dict(segments=[(s[0], len(s)) for s in segs], frames=allt, cfg=cfg, opt=opt, wall=time.time() - t0),
              open(os.path.join(a.out, 'log.json'), 'w'), indent=1)
    if plate:   # same layout as the source plate: the compositor swaps the id, clip maps unchanged
        m = dict(pm, n=len(segs[0]) if a.first == 1 else pm['n'], w=1920, h=1080,
                 src=f"{os.path.relpath(pdir, P.ROOT)}/frames, glyph-painted (fable/take2/tools/glyphart/animate.py --preset {a.preset})",
                 glyph=dict(style=1, preset=a.preset, set=a.set, focus_skin=a.focus_skin, first=a.first, last=segs[0][-1]))
        json.dump(m, open(os.path.join(a.out, 'meta.json'), 'w'))
        import shutil
        shutil.copy(os.path.join(fdir, f'f_{segs[0][0]:04d}.jpg'), os.path.join(a.out, 'still.jpg'))   # still-only uses
        if os.path.exists(os.path.join(pdir, 'REAL')):
            open(os.path.join(a.out, 'REAL'), 'w').write(open(os.path.join(pdir, 'REAL')).read())
    sec = [x[2] for x in allt]
    print(f'{len(allt)} frames, {np.mean(sec):.1f} s/frame (per worker), wall {time.time() - t0:.0f} s, '
          f'glyphs/frame {np.mean([x[1] for x in allt]):.0f}')


if __name__ == '__main__':
    os.environ.setdefault('OMP_NUM_THREADS', '1')
    main()
