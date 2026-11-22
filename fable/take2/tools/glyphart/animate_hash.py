#!/usr/bin/env python3
"""Style 2 animation (hash glyphs, hashglyph.py) over v7 frames, glyphs carried by optical flow, re-seeded at camera cuts.

  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/animate_hash.py --t0 135.0 --t1 141.6 --out DIR
      [--font mono] [--em 14] [--workers 4] [--boil 0.10] [--cuts 138.965,139.830,...]

Per shot: frame 1 placed from scratch. Then each glyph is moved by DIS flow (forward-backward check kills occluded ones), keeps
its character, flip and layer, and re-aims along the current edge / structure direction (nearest branch, so no flips).
A glyph is dropped when its reason is gone (contour: edge under it fell below 70% of the threshold; tone: tone below its layer
threshold - .05) or when its cell already holds an older glyph; empty cells where a glyph is wanted get a new one (fades in
over 2 frames). Boil: on every eighth note a fraction re-choose their character by shape fit. Colour re-read every frame.
Cuts: hue/sat histogram correlation < .7 between frames (found 4170, 4195, 4221, 4247 in 135-141.6) plus --cuts.
"""
import os, sys, math, time, argparse, json
os.environ.setdefault('OMP_NUM_THREADS', '1')
import numpy as np, cv2
from multiprocessing import Pool

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import paint as P
import hashglyph as HG
from animate import frame_path

KEYS = ('x', 'y', 'ang', 'gid', 'kind', 'op', 'layer', 'flip')


def segments(ks, forced, thr=0.7):
    """camera cuts: hue/sat histogram correlation with the previous frame < thr (robust to fast camera moves and motion
    blur, which a pixel difference is not), plus forced frame numbers"""
    segs, cur, prev = [], [], None
    for k in ks:
        im = cv2.resize(cv2.imread(frame_path(k)), (192, 108), interpolation=cv2.INTER_AREA)
        h = cv2.calcHist([cv2.cvtColor(im, cv2.COLOR_BGR2HSV)], [0, 1], None, [16, 8], [0, 180, 0, 256]); cv2.normalize(h, h)
        cut = prev is not None and (cv2.compareHist(prev, h, cv2.HISTCMP_CORREL) < thr or k in forced)
        if cut and cur:
            segs.append(cur); cur = []
        cur.append(k); prev = h
    segs.append(cur)
    return segs


def sub(m, keep):
    return {k: m[k][keep] for k in m}


def near_branch(new, old):
    d = (new - old + np.pi / 2) % np.pi - np.pi / 2
    return old + d


def cell_keep(m, cfg, H, W):
    """one glyph per cell (contour: cgrid; tone layer q: its spacing); older first (they are first in the arrays)"""
    keep = np.ones(len(m['x']), bool)
    occ = {}
    sps = [cfg.get('cgrid', 7)] + list(cfg.get('spacings', [8, 9, 10]))
    for q in range(len(sps)):
        idx = np.nonzero(m['layer'] == q)[0]
        sp = sps[q]
        # crowding is judged on a finer grid (0.7 x the cell) so glyphs drifting across a cell edge are not culled (churn);
        # occupancy for new glyphs on the full cell
        sc = sp * 0.7
        key = (m['y'][idx] // sc).astype(np.int64) * 100000 + (m['x'][idx] // sc).astype(np.int64)
        _, first = np.unique(key, return_index=True)
        k2 = np.zeros(len(idx), bool); k2[first] = True
        keep[idx[~k2]] = False
        cx = np.clip((m['x'][idx] // sp).astype(np.int64), 0, W // sp); cy = np.clip((m['y'][idx] // sp).astype(np.int64), 0, H // sp)
        o = np.zeros((H // sp + 1, W // sp + 1), bool); o[cy[k2], cx[k2]] = True
        occ[q] = o
    return keep, occ


def run_segment(args):
    seg, cfg, out, seed, opt = args
    rng = np.random.default_rng(seed)
    cv2.setNumThreads(2)
    at = HG.FixedAtlas(opt['font'], opt['em'])
    dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
    m = None; prev = None; log = []
    for k in seg:
        t0 = time.time()
        src = P.load(frame_path(k))
        H, W = src.shape[:2]
        if opt.get('matte'):        # body mask: BiRefNet matte of the source range, f_%04d.png numbered from t0
            mm = cv2.imread(os.path.join(opt['matte'], f"f_{k - opt['k0'] + 1:04d}.png"), cv2.IMREAD_UNCHANGED)
            cfg = dict(cfg, _body=cv2.resize(mm[..., 3], (W, H)) > 127)
        an = HG.Analysis(src, cfg)
        small = cv2.resize(cv2.cvtColor((src * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY), (W // 2, H // 2), interpolation=cv2.INTER_AREA)
        if m is None:
            m = HG.cat(HG.tone_marks(an, at, cfg, rng) + [HG.contour_marks(an, at, cfg, rng)])
            age = np.full(len(m['x']), 9, np.float32)
        else:
            ff = dis.calc(prev, small, None); fb = dis.calc(small, prev, None)
            ix = np.clip((m['x'] / 2).astype(int), 0, W // 2 - 1); iy = np.clip((m['y'] / 2).astype(int), 0, H // 2 - 1)
            u = ff[iy, ix]
            nx, ny = m['x'] / 2 + u[:, 0], m['y'] / 2 + u[:, 1]
            jx = np.clip(nx.astype(int), 0, W // 2 - 1); jy = np.clip(ny.astype(int), 0, H // 2 - 1)
            e = np.hypot(u[:, 0] + fb[jy, jx, 0], u[:, 1] + fb[jy, jx, 1])
            m['x'] = (nx * 2).astype(np.float32); m['y'] = (ny * 2).astype(np.float32)
            ok = (e < 1.0 + 0.05 * np.hypot(u[:, 0], u[:, 1])) & (m['x'] >= 0) & (m['x'] < W - 1) & (m['y'] >= 0) & (m['y'] < H - 1)
            px = np.clip(m['x'].astype(int), 0, W - 1); py = np.clip(m['y'].astype(int), 0, H - 1)
            Emax = cv2.dilate(an.E, np.ones((5, 5), np.uint8))
            thr = np.array([0] + list(cfg.get('thresholds', [0.12, 0.40, 0.66])), np.float32)
            con = m['layer'] == 0
            ok &= np.where(con, Emax[py, px] > cfg.get('line_min', 0.35) * 0.7, an.T[py, px] > thr[m['layer']] - 0.05)
            # re-aim along the current structure (nearest branch)
            m['ang'] = np.where(con, near_branch(an.etan[py, px], m['ang']), near_branch(an.tan[py, px], m['ang'])).astype(np.float32)
            if cfg.get('upright_body'):
                m['ang'] = np.where(an.is_body(m['x'], m['y']), 0, m['ang']).astype(np.float32)
            m = sub(m, ok); age = age[ok]
            keep, occ = cell_keep(m, cfg, H, W)
            m = sub(m, keep); age = age[keep]
            # boil on the eighth notes
            ph = lambda t: math.floor((t - opt['beat0']) / (opt['beat'] / 2))
            if ph(k / 30) != ph((k - 1) / 30) and opt['boil'] > 0 and len(m['x']):
                b = np.nonzero(rng.random(len(m['x'])) < opt['boil'])[0]
                if len(b):
                    con_b = m['layer'][b] == 0
                    img = np.where(con_b[:, None], 0, 0)
                    pe = HG.patches_along(an.E, m['x'][b], m['y'][b], m['ang'][b], at.em)
                    pt = HG.patches_along(an.T, m['x'][b], m['y'][b], m['ang'][b], at.em)
                    pat = np.where(con_b[:, None], pe, pt)
                    upb = an.is_body(m['x'][b], m['y'][b]) if cfg.get('upright_body') else None
                    g, _ = HG.fit(at, pat, rng, cfg.get('tau', 0.12) * 1.5, up=upb)
                    m['gid'][b] = g
            # new glyphs in empty cells
            new = [HG.contour_marks(an, at, cfg, rng, occupied=occ[0][:H // cfg.get('cgrid', 7), :W // cfg.get('cgrid', 7)])]
            new += HG.tone_marks(an, at, cfg, rng, occ_layers=[occ[q] for q in (1, 2, 3)])
            n = HG.cat(new)
            m = {kk: np.concatenate([m[kk], n[kk]]) for kk in KEYS}
            age = np.concatenate([age, np.zeros(len(n['x']), np.float32)])
        fade = np.clip((age + 1) / 2, 0, 1)
        can = HG.draw(an, at, m, cfg, rng, fade=fade)
        P.save(os.path.join(out, f'f_{k:05d}.jpg'), P.finish(can, dict(grain=0.01), rng))
        age += 1
        prev = small
        log.append((k, len(m['x']), time.time() - t0))
    return log


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--t0', type=float, default=135.0); ap.add_argument('--t1', type=float, default=141.6)
    ap.add_argument('--out', required=True)
    ap.add_argument('--font', default='mono'); ap.add_argument('--em', type=int, default=14)
    ap.add_argument('--set', action='append', default=[])
    ap.add_argument('--workers', type=int, default=4)
    ap.add_argument('--boil', type=float, default=0.10)
    ap.add_argument('--beat', type=float, default=0.43225); ap.add_argument('--beat0', type=float, default=135.508)
    # extra forced cuts (song time). The film's cut points inside 135-139 (bu16-bu21) are cuts to plate inserts; the raw v7
    # frames themselves run continuously there, so only real camera cuts (found by histogram) re-seed.
    ap.add_argument('--cuts', default='')
    ap.add_argument('--matte', default='', help='dir of f_%%04d.png RGBA mattes numbered from --t0 (body mask)')
    a = ap.parse_args()
    cfg = dict(line_min=0.35)
    for kv in a.set:
        k, v = kv.split('=', 1); cfg[k] = json.loads(v)
    os.makedirs(a.out, exist_ok=True)
    ks = list(range(round(a.t0 * 30), round(a.t1 * 30)))
    forced = {round(float(c) * 30) for c in a.cuts.split(',') if c}
    segs = segments(ks, forced)
    print('segments', [(s[0], len(s)) for s in segs], flush=True)
    opt = dict(font=a.font, em=a.em, boil=a.boil, beat=a.beat, beat0=a.beat0, matte=a.matte, k0=round(a.t0 * 30))
    jobs = sorted([(s, cfg, a.out, 7 + i, opt) for i, s in enumerate(segs)], key=lambda j: -len(j[0]))
    t0 = time.time()
    with Pool(a.workers) as pool:
        logs = pool.map(run_segment, jobs, chunksize=1)
    allt = [x for l in logs for x in l]
    json.dump(dict(segments=[(s[0], len(s)) for s in segs], frames=allt, cfg=cfg, opt=opt, wall=time.time() - t0),
              open(os.path.join(a.out, 'log.json'), 'w'), indent=1)
    print(f'{len(allt)} frames, {np.mean([x[2] for x in allt]):.2f} s/frame/worker, wall {time.time() - t0:.0f} s, '
          f'glyphs/frame {np.mean([x[1] for x in allt]):.0f}')


if __name__ == '__main__':
    main()
