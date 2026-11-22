#!/usr/bin/env python3
"""A4, film v10: the letters on her MERGE (cb10 fold 223.135 -> cb11 -> cb12, last letter sinks in on "become" 231.210).

One continuous simulation across the three shots, in the frame of patch_settle (night_jade is aligned onto patch_settle's figure by
the two mattes' bounding boxes), rendered as three plate folders (24 fps, frame i = song t0 + (i-1)/24):
  cb10 223.135-226.532  night_jade (black paper), coarse letters on her; the twelve lives arrive as runs of letters in their branch
                        colour (shots.js fold beats: 0,1,2,3,4,4.5,5,5.5,6,6.5,7,7.5 beats), flying in from their side
  cb11 226.532-229.931  daylight arrives: night_jade -> patch_settle's clean frame (aligned cross-light), the fusing continues
  cb12 229.931-235.038  patch_settle's clean frames (71..121, slowed); the last few marks sink into her line, the last (violet) on
                        231.210; clean line, full colour, daylight to the b137 impact
The merge: two neighbouring letters slide together, overlap (each keeps its colour where it is), and their union FLOWS (signed
distance morph) into one new character chosen by the union's footprint, smaller and finer, with a flash of the mixed colour. Merges
start continuously (no percussion under the folds: one slow arc), the count falls from ~250 to 4 by 229.9; the four left sink.
Under the letters the figure is an underpainting (blurred, dimmed) that sharpens into the clean drawing as the count falls; the face
is always clean.
  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/v10/merge.py --test T1,T2,... OUT.jpg     # stills (song s)
  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/v10/merge.py --render [--only cb10]       # the three plates
"""
import os, sys, math, json, time, argparse, shutil
import numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.dirname(HERE))
import gl10 as L  # noqa: E402
from v9.skin import skin_mask  # noqa: E402

ROOT = L.ROOT
PL = os.path.join(ROOT, 'work_fable/take2/plates')
KIT = os.path.join(ROOT, 'work_fable/take2/kit')
PM = os.path.join(ROOT, 'work_fable/take2/dev/v9_glyph/pmatte')
W, H = 1920, 1080
BEAT = 0.4247
T10, T11, T12, T13 = 223.135, 226.532, 229.931, 235.038
BECOME = 231.210
PULSE = 228.48        # a steady 8th-note pluck enters (listen_v10): merges gather on it
FOLD_BEATS = [0, 1, 2, 3, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5]
PS_A, PS_B = 82, 121          # patch_settle's clean frames
SHOTS = {'cb10': ('fold_merge10', T10, T11), 'cb11': ('patch_hold_merge10', T11, T12), 'cb12': ('patch_settle_merge10', T12, T13)}

CFG = dict(N0=320, s0=(84, 112), run_s=90, merge_D0=0.8, merge_D1=1.0, shrink=0.9, t_merge0=223.4, t_merge1=230.1,
           n_left=4, sink_at=[230.25, 230.6, 230.9, BECOME], sink_D=0.6, hold_run=0.7, zoom=(1.0, 1.035))


def bbox(a, thr=0.5):
    ys, xs = np.nonzero(a > thr)
    return xs.min(), ys.min(), xs.max(), ys.max()


def rd(p):
    im = cv2.imread(p, cv2.IMREAD_UNCHANGED)
    return im


class Scene:
    def __init__(s, seed=7):
        s.rng = np.random.default_rng(seed)
        s.G = L.Glyphs()
        # patch_settle clean frame (output frame of reference) and its matte
        s.ps = {}
        ps71 = s.psframe(PS_A)
        mp = rd(f'{PM}/patch_settle/rgba/f_{PS_A:04d}.png')[..., 3].astype(np.float32) / 255
        s.mps = cv2.resize(mp, (W, H))
        # night_jade aligned: scale by figure height, top-centre on top-centre
        nj = rd(f'{PL}/night_jade/still.jpg')[..., ::-1].astype(np.float32) / 255
        mn = rd(f'{KIT}/night_jade/rgba/f_0001.png')[..., 3].astype(np.float32) / 255
        mn = cv2.resize(mn, (nj.shape[1], nj.shape[0]))
        a0 = bbox(mn); b0 = bbox(s.mps)
        k = (b0[3] - b0[1]) / (a0[3] - a0[1])
        tx = (b0[0] + b0[2]) / 2 - k * (a0[0] + a0[2]) / 2; ty = b0[1] - k * a0[1]
        M = np.array([[k, 0, tx], [0, k, ty]], np.float32)
        s.nj = cv2.warpAffine(nj, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        s.mnj = cv2.warpAffine(mn, M, (W, H), flags=cv2.INTER_LINEAR)
        s.fig = np.maximum(s.mnj, s.mps)                     # where letters may sit (both figures)
        s.figbb = bbox(s.fig)
        # face: the skin blob(s) in the top 22 % of the figure, on both bases, dilated: always clean, never lettered
        x0, y0, x1, y1 = s.figbb
        yy = np.arange(H)[:, None]
        top = (yy < y0 + 0.22 * (y1 - y0)).astype(np.float32)
        f = np.maximum(skin_mask(s.nj), skin_mask(ps71)) * top
        f = cv2.dilate((f > 0.3).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (41, 41)))
        s.face = cv2.GaussianBlur(f.astype(np.float32), (0, 0), 9)
        s.allow = (s.fig > 0.5) & (s.face < 0.05)
        # line pixels of the clean drawing (where the last marks sink): edges inside the figure
        e = cv2.Canny((L.lum(ps71) * 255).astype(np.uint8), 60, 140) > 0
        e &= s.mps > 0.5
        s.edge_yx = np.argwhere(e)
        yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
        cx, cy = (x0 + x1) / 2, y0 + 0.35 * (y1 - y0)
        s.bloom = np.clip(1.15 - np.hypot((xx - cx) / (0.75 * W), (yy - cy) / (0.75 * H)), 0, 1) ** 0.8
        s.build()

    def psframe(s, k):
        if k not in s.ps:
            im = rd(f'{PL}/patch_settle/frames/f_{k:04d}.jpg')[..., ::-1].astype(np.float32) / 255
            s.ps[k] = cv2.resize(im, (W, H), interpolation=cv2.INTER_CUBIC)
            if len(s.ps) > 6:
                s.ps.pop(next(iter(s.ps)))
        return s.ps[k]

    # ------------------------------------------------------------------ the clean picture at time t
    def daylight(s, t):   # from "Every" (227.40) to 229.1
        return L.smooth((t - 227.40) / 1.7)

    def clean(s, t):
        if t < T12:
            d = s.daylight(t)
            if d <= 0:
                return s.nj.copy()
            if d >= 1:
                return s.psframe(PS_A).copy()
            # daylight arrives as light, not as a grey cross-fade: night -> day under a warm bloom from behind her that peaks
            # mid-way (the paper passes through bright, not through grey) and recedes into plain daylight
            e = d * d * (3 - 2 * d)
            out = s.nj * (1 - e) + s.psframe(PS_A) * e
            b = math.sin(math.pi * d) ** 1.3 * 0.55
            out = out + (1 - out) * (s.bloom * b)[..., None] * np.array([1.0, 0.93, 0.8], np.float32)
            return out
        f = PS_A + (t - T12) / (T13 - T12) * (PS_B - PS_A)
        i0 = int(math.floor(f)); fb = f - i0; i1 = min(PS_B, i0 + 1)
        return s.psframe(i0) * (1 - fb) + s.psframe(i1) * fb

    def grade(s, t):
        """daylight and colour keep growing to the b137 impact: from the cut to day (cb11) the picture is a little grey and cool;
        through cb12 saturation and a warm light rise to full at 235.038 (the riser), so the settle is not a still"""
        if t < T11:
            return None
        u = L.smooth((t - T11) / (T13 - T11)) ** 0.9
        sat = 0.62 + 0.38 * u
        warm = np.array([1.0 + 0.05 * u, 1.0 + 0.02 * u, 1.0 - 0.03 * u], np.float32)
        lift = 0.035 * u
        def f(c):
            l = L.lum(c)[..., None]
            c = l + (c - l) * sat
            return c * warm + lift * (1 - c)
        return f

    def written(s, t):
        """how much of the figure is still written (underpainting under the letters): 1 at the catch, 0 when the last sinks"""
        u = np.clip((t - T10) / (BECOME - 0.3 - T10), 0, 1)
        return float(1 - L.smooth(u) ** 0.8)

    def base(s, t):
        c = s.clean(t)
        w = s.written(t)
        if w <= 0.001:
            return c
        u = cv2.GaussianBlur(c, (0, 0), 7) * 0.42 + 0.03
        m = (s.fig * (1 - s.face))[..., None] * w
        return c * (1 - m) + u * m

    def src_col(s, x, y):
        xi, yi = int(np.clip(x, 0, W - 1)), int(np.clip(y, 0, H - 1))
        return s.nj[yi, xi]

    # ------------------------------------------------------------------ simulation
    def build(s):
        G, rng, C = s.G, s.rng, CFG
        marks = []   # dict: gid x y s th col t_in t_out kind src(path) thin lineage
        def add(**k):
            k['id'] = len(marks); marks.append(k); return k
        # 1. the catch's coarse letters already on her at 223.135: violet (the note) and her own colours, in rows
        ys, xs = np.nonzero(s.allow[::4, ::4]); pts = np.stack([xs * 4, ys * 4], 1).astype(np.float32)
        txt = G.text_glyphs(L.HANDOFF * 3, rng, swap=0.35)
        sp = 0.62 * np.mean(C['s0']); taken = []
        order = rng.permutation(len(pts)); ti = 0
        for i in order:
            x, y = pts[i]
            if any((x - a) ** 2 + (y - b) ** 2 < sp * sp for a, b in taken):
                continue
            taken.append((x, y))
            if len(taken) >= C['N0']:
                break
        for (x, y) in taken:
            vio = rng.random() < 0.45
            gid = txt[ti % len(txt)][0]; ti += 1
            c = s.src_col(x, y)
            col = L.hexrgb('#B08CFF') if vio else np.clip(1 - (1 - c) * 0.7, 0, 1)
            add(gid=gid, x=x, y=y, s=float(rng.uniform(*C['s0'])), th=float(rng.normal(0, 0.12)), col=col, t_in=T10 - 1,
                t_out=1e9, kind='idle', fly=None, thin=0.0, vio=vio, gen=0)
        # 2. the twelve runs: the branch word, one letter per glyph, in its colour, landing on its fold beat
        rows = []
        for k, (lid, word, hexc, side) in enumerate(L.LIVES):
            tk = T10 + FOLD_BEATS[k] * BEAT
            sz = C['run_s']; adv = 0.56 * sz; n = len(word); wlen = adv * (n - 1)
            # a row on her body, every letter on the figure, clear of the last five runs' rows (so each word is read as a word)
            best = None
            for tries in range(3000):
                if tries and tries % 600 == 0 and best is None:   # a long word that fits nowhere: smaller letters
                    sz *= 0.85; adv = 0.56 * sz; wlen = adv * (n - 1)
                ax = rng.uniform(s.figbb[0], s.figbb[2] - wlen); ay = rng.uniform(s.figbb[1] + 0.22 * (s.figbb[3] - s.figbb[1]), s.figbb[3] - 60)
                if not all(s.allow[int(ay), int(np.clip(ax + j * adv, 0, W - 1))] for j in range(n)):
                    continue
                clash = sum(1 for (bx0, bx1, by) in rows[-5:] if abs(by - ay) < 0.9 * sz and ax < bx1 and ax + wlen > bx0)
                if clash == 0:
                    best = (ax, ay); break
                if best is None:
                    best = (ax, ay)
            ax, ay = best
            rows.append((ax - 0.3 * sz, ax + wlen + 0.3 * sz, ay))
            col = np.clip(L.hexrgb(hexc) * 0.85 + 0.15, 0, 1)
            fromx = -0.08 * W if side == 'left' else 1.08 * W
            for j, ch in enumerate(word):
                if ch == '-':
                    continue
                g0 = G.of_char(ch, rng); gid = G.em(g0) if g0 is not None else G.em(G.any_script(rng)[0])
                lx, ly = ax + j * adv, ay
                ta = tk - 0.02 * (n - j if side == 'right' else j)   # the head of the run lands first
                add(gid=gid, x=lx, y=ly, s=sz, th=0.0, col=col, t_in=ta, t_out=1e9, kind='idle', thin=0.0, vio=(lid == 'violet'), gen=0,
                    fly=(fromx + (j - n / 2) * adv * 0.9, ly - rng.uniform(-0.15, 0.25) * H, ta - 0.42, ta))
        s.merges = []; s.sinks = []
        # 3. merges, continuous from t_merge0 to t_merge1: alive count follows a falling curve to n_left
        dt = 1 / 48
        t = C['t_merge0']
        tot = len(marks)
        while t < C['t_merge1']:
            alive = [m for m in marks if m['t_in'] <= t and m['t_out'] > t]
            pend = [m for m in marks if m['t_in'] > t]                      # runs not landed yet
            n_alive = len(alive) + len(pend)
            u = (t - C['t_merge0']) / (C['t_merge1'] - C['t_merge0'])
            target = C['n_left'] + (tot - C['n_left']) * (1 - u) ** 1.1
            if t >= PULSE:   # after the pulse enters, the rest go faster (the motion gathers)
                up = (t - PULSE) / (C['t_merge1'] - PULSE); tp = C['n_left'] + (tot - C['n_left']) * (1 - (PULSE - C['t_merge0']) / (C['t_merge1'] - C['t_merge0'])) ** 1.1
                target = C['n_left'] + (tp - C['n_left']) * (1 - up) ** 0.7
            D_ = C['merge_D0'] + (C['merge_D1'] - C['merge_D0']) * u if t < PULSE else 0.6
            elig = [m for m in alive if m['t_out'] > 1e8 and t - m['t_in'] >= (C['hold_run'] if m['fly'] is not None else 0.12)]
            on_pulse = t < PULSE or abs(((t - PULSE) / (BEAT / 2)) - round((t - PULSE) / (BEAT / 2))) < 0.5 * dt / (BEAT / 2) + 1e-6
            while on_pulse and n_alive > target and len(elig) >= 2:
                # an old letter (oldest first, randomised) and its nearest eligible neighbour
                ages = np.array([t - m['t_in'] for m in elig]) + 0.3
                a = elig[rng.choice(len(elig), p=ages / ages.sum())]
                others = [m for m in elig if m is not a]
                d = np.array([math.hypot(m['x'] - a['x'], m['y'] - a['y']) for m in others])
                # a partner about one letter away (not the touching neighbour): the slide together must be seen
                band = np.where(d < 0.75 * a['s'], d + 3 * a['s'], d)
                j = int(np.argmin(band)); b = others[j]; d = list(d)
                if d[j] > 3.5 * max(a['s'], b['s']) and len(elig) > 6:
                    elig.remove(a); continue
                D = D_
                a['t_out'] = b['t_out'] = t; elig.remove(a); elig.remove(b)
                mx, my = (a['x'] * a['s'] + b['x'] * b['s']) / (a['s'] + b['s']), (a['y'] * a['s'] + b['y'] * b['s']) / (a['s'] + b['s'])
                # the slide: each moves toward the midpoint until they overlap (centres 30 % of a size apart)
                sep = math.hypot(b['x'] - a['x'], b['y'] - a['y']) + 1e-3
                ux, uy = (b['x'] - a['x']) / sep, (b['y'] - a['y']) / sep
                close = 0.3 * max(a['s'], b['s'])
                pa = (mx - ux * close / 2, my - uy * close / 2); pb = (mx + ux * close / 2, my + uy * close / 2)
                sc = max(30.0, max(a['s'], b['s']) * C['shrink'])
                tgt = s.G.tier_glyph(max(a['gen'], b['gen']) + 1, rng)
                c0 = (a['col'] * a['s'] + b['col'] * b['s']) / (a['s'] + b['s'])
                sc_ = s.clean(min(t + D, BECOME))[int(np.clip(my, 0, H - 1)), int(np.clip(mx, 0, W - 1))]
                col = np.clip(c0 * 0.88 + sc_ * 0.12, 0, 1)
                vio = a['vio'] or b['vio']
                gen = max(a['gen'], b['gen']) + 1
                c = add(gid=tgt, x=mx, y=my, s=sc, th=float((a['th'] + b['th']) / 2 * 0.5), col=col, t_in=t + D, t_out=1e9, kind='idle',
                        fly=None, thin=0.0, vio=vio, gen=gen)
                s.merges.append(dict(a=a['id'], b=b['id'], c=c['id'], t0=t, D=D, pa=pa, pb=pb))
                n_alive -= 1
            t += dt
        # 4. the last few sink into her line; the last one is violet (the note goes in last) and lands on "become"
        alive = [m for m in marks if m['t_out'] > 1e8]
        alive.sort(key=lambda m: (m['vio'], -m['t_in']))
        # anything beyond the planned sinkers sinks early, staggered
        extra = alive[:-len(CFG['sink_at'])] if len(alive) > len(CFG['sink_at']) else []
        times = [C['t_merge1'] - 0.3 + 0.08 * i for i in range(len(extra))] + CFG['sink_at']
        for m, te in zip(alive, times[-len(alive):] if len(alive) <= len(times) else times):
            if m is alive[-1]:
                m['col'] = L.hexrgb('#A57BFF'); m['vio'] = True
            # the nearest line pixel of the clean drawing
            dd = (s.edge_yx[:, 0] - m['y']) ** 2 + (s.edge_yx[:, 1] - m['x']) ** 2
            ey, ex = s.edge_yx[int(np.argmin(dd))]
            m['t_out'] = te - CFG['sink_D']
            s.sinks.append(dict(m=m['id'], t0=te - CFG['sink_D'], t1=te, to=(float(ex), float(ey))))
        s.marks = marks
        print(f'marks {len(marks)}, merges {len(s.merges)}, sinks {len(s.sinks)}, last sink {max(k["t1"] for k in s.sinks):.3f}')

    # ------------------------------------------------------------------ drawing
    def frame(s, t):
        G = s.G
        can = s.base(t).astype(np.float32).copy()
        key = 0.55
        thin_g = lambda m: m['thin']
        # idle letters (and flying ones)
        for m in s.marks:
            if t >= m['t_out']:
                continue
            if m['fly'] is not None and t < m['t_in']:
                fx, fy, ta, tb = m['fly']
                if t < ta:
                    continue
                u = (t - ta) / (tb - ta); e = 1 - (1 - u) ** 2.2
                x = fx + (m['x'] - fx) * e; y = fy + (m['y'] - fy) * e - math.sin(u * math.pi) * 0.05 * H
                # a short streak behind the letter
                for k_ in (3, 2, 1):
                    u2 = max(0, u - 0.06 * k_); e2 = 1 - (1 - u2) ** 2.2
                    x2 = fx + (m['x'] - fx) * e2; y2 = fy + (m['y'] - fy) * e2 - math.sin(u2 * math.pi) * 0.05 * H
                    x0, y0, d = L.sdf_item(G, [(m['gid'], x2, y2, m['s'], m['th'])])
                    L.ink(can, x0, y0, d, m['col'], a=0.18 * (4 - k_) / 3)
                x0, y0, d = L.sdf_item(G, [(m['gid'], x, y, m['s'], m['th'])], margin=34)
                L.ink(can, x0, y0, d, m['col'], key=key, glow=0.5, gr=10)
                continue
            if t < m['t_in']:
                continue
            land = t - m['t_in']
            glow = 0.6 * max(0, 1 - land / 0.3) if m['fly'] is not None else 0
            x0, y0, d = L.sdf_item(G, [(m['gid'], m['x'], m['y'], m['s'], m['th'])], thin=thin_g(m), margin=34 if glow else 6)
            L.ink(can, x0, y0, d, m['col'], key=key, glow=glow, gr=10)
        # merges in progress
        for r in s.merges:
            if not (r['t0'] <= t < r['t0'] + r['D']):
                continue
            a, b, c = s.marks[r['a']], s.marks[r['b']], s.marks[r['c']]
            u = (t - r['t0']) / r['D']
            sl = L.smooth(u / 0.62)
            ax, ay = a['x'] + (r['pa'][0] - a['x']) * sl, a['y'] + (r['pa'][1] - a['y']) * sl
            bx, by = b['x'] + (r['pb'][0] - b['x']) * sl, b['y'] + (r['pb'][1] - b['y']) * sl
            mm = float(L.smooth((u - 0.52) / 0.48))
            sz = (max(a['s'], b['s']) + (c['s'] - max(a['s'], b['s'])) * mm) * (1 + 0.18 * math.sin(math.pi * mm))   # a pop as they fuse
            comps = [(a['gid'], ax, ay, a['s'], a['th']), (b['gid'], bx, by, b['s'], b['th'])]
            tgt = (c['gid'], c['x'], c['y'], sz, c['th'])
            # per-pixel colour: each letter keeps its own colour where it is nearer, until the fusion mixes them
            bb = L.sdf_item(G, comps + [tgt], margin=int(3 * (12 + 0.15 * sz)))
            x0, y0 = bb[0], bb[1]; hh, ww = bb[2].shape
            da = L._warp_sdf(G, a['gid'], ax, ay, a['s'], a['th'], x0, y0, ww, hh) + a['thin']
            db = L._warp_sdf(G, b['gid'], bx, by, b['s'], b['th'], x0, y0, ww, hh) + b['thin']
            dc = L._warp_sdf(G, c['gid'], c['x'], c['y'], sz, c['th'], x0, y0, ww, hh) + c['thin'] * mm
            d = (1 - mm) * np.minimum(da, db) + mm * dc
            wa = 1 / (1 + np.exp(np.clip((da - db) / 3, -30, 30)))
            colp = wa[..., None] * a['col'] + (1 - wa[..., None]) * b['col']
            flash = math.sin(math.pi * np.clip((u - 0.4) / 0.5, 0, 1))
            colp = colp * (1 - mm) + c['col'] * mm
            colp = colp + (1 - colp) * 0.55 * flash      # white-hot for an instant: the fusion
            s.ink_map(can, x0, y0, d, colp, key=key, glow=1.3 * flash, gcol=np.clip(c['col'] * 0.5 + 0.5, 0, 1), gr=12 + 0.15 * sz)
        # sinking
        for r in s.sinks:
            if not (r['t0'] <= t < r['t1'] + 0.35):
                continue
            m = s.marks[r['m']]
            u = (t - r['t0']) / (r['t1'] - r['t0'])
            if u < 1:
                e = L.smooth(u)
                x, y = m['x'] + (r['to'][0] - m['x']) * e, m['y'] + (r['to'][1] - m['y']) * e
                sz = m['s'] * (1 - 0.85 * e)
                x0, y0, d = L.sdf_item(G, [(m['gid'], x, y, sz, m['th'])], thin=m['thin'] * (1 - e), margin=40)
                L.ink(can, x0, y0, d, m['col'], a=1 - 0.6 * e ** 3, key=key * (1 - e), glow=0.5 * e, gr=10)
            else:   # the instant it goes in: a small glow on the line, fading
                f = 1 - (t - r['t1']) / 0.35
                x, y = r['to']
                gl = np.zeros((1, 1), np.float32) + 0.0
                x0, y0 = int(x) - 60, int(y) - 60
                yy, xx = np.mgrid[0:120, 0:120]
                d = np.hypot(xx - 60, yy - 60).astype(np.float32) - 1.0
                L.ink(can, x0, y0, d, m['col'], a=0.0, glow=0.9 * f, gr=9)
        g = s.grade(t)
        if g is not None:
            can = g(can)
        z0, z1 = CFG['zoom']
        z = z0 + (z1 - z0) * L.smooth((t - T10) / (T13 - T10))
        if z != 1:
            M = cv2.getRotationMatrix2D((W * 0.5, H * 0.45), 0, z)
            can = cv2.warpAffine(can, M, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        return np.clip(can, 0, 1)

    @staticmethod
    def ink_map(canvas, x0, y0, d, colmap, key=0.0, glow=0.0, gcol=None, gr=12.0, kcol=(0.03, 0.02, 0.05), keyw=2.2):
        hh, ww = d.shape
        bx0, by0, bx1, by1 = max(x0, 0), max(y0, 0), min(x0 + ww, W), min(y0 + hh, H)
        if bx1 <= bx0 or by1 <= by0:
            return
        sl = (slice(by0 - y0, by1 - y0), slice(bx0 - x0, bx1 - x0))
        dd = d[sl]; cm = colmap[sl]
        reg = canvas[by0:by1, bx0:bx1]
        if glow > 0:
            al0 = np.clip(0.5 - d, 0, 1).astype(np.float32)
            g_ = (glow * np.minimum(1, 2.2 * cv2.GaussianBlur(al0, (0, 0), gr * 0.6)))[sl][..., None]
            reg += (1 - reg) * np.asarray(gcol, np.float32)[None, None, :] * g_
        if key > 0:
            kk = (np.clip(0.5 - (dd - keyw), 0, 1) * key)[..., None]
            reg += (np.asarray(kcol, np.float32)[None, None, :] - reg) * kk
        al = np.clip(0.5 - dd, 0, 1)[..., None]
        reg += (cm - reg) * al


def render_shot(sc, name):
    pid, t0, t1 = SHOTS[name]
    out = f'{PL}/{pid}'; fd = f'{out}/frames'; os.makedirs(fd, exist_ok=True)
    n = int(math.ceil((t1 - t0) * 24)) + 2
    t_ = time.time()
    for i in range(n):
        t = t0 + i / 24
        L.save(f'{fd}/f_{i + 1:04d}.jpg', sc.frame(t), q=93)
    shutil.copy(f'{fd}/f_0001.jpg', f'{out}/still.jpg')
    json.dump(dict(fps=24, n=n, turn_t=None, w=W, h=H, t0_song=t0, src='fable/take2/tools/glyphart/v10/merge.py (night_jade + patch_settle '
                   'frames 71-121, letters merging)', glyph=dict(v10='A4 merge', shot=name, t0=t0, t1=t1)), open(f'{out}/meta.json', 'w'))
    open(f'{out}/REAL', 'w').write('glyph v10 A4 merge render (derived from night_jade, patch_settle)\n')
    print(f'{pid}: {n} frames, {time.time() - t_:.0f} s')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--test', default=''); ap.add_argument('--out', default='')
    ap.add_argument('--render', action='store_true'); ap.add_argument('--only', default='')
    ap.add_argument('--seed', type=int, default=7)
    ap.add_argument('--closeup', default='', help='T,OUT.jpg')
    a = ap.parse_args()
    sc = Scene(a.seed)
    if a.closeup:
        for spec in a.closeup.split(';'):
            t, o = spec.split(',', 1); os.makedirs(os.path.dirname(o), exist_ok=True); closeup(sc, float(t), o)
    if a.test:
        os.makedirs(a.out, exist_ok=True)
        for t in [float(x) for x in a.test.split(',')]:
            L.save(f'{a.out}/m_{t:.3f}.jpg', sc.frame(t))
    if a.render:
        for name in (a.only.split(',') if a.only else SHOTS):
            render_shot(sc, name)



def closeup(sc, t_near, out, n=7, box=(420, 300)):
    """one merge, frame by frame: the merge starting nearest t_near among the larger ones; crops at 1920 (1:1) and the same
    region from the frame downscaled to 640 px wide (shown 1:1 and x3 nearest)"""
    big = [r for r in sc.merges if sc.marks[r['a']]['s'] >= 60 and sc.marks[r['b']]['s'] >= 60]
    def crowd(r):   # marks near the merge when it starts (a clear one is easier to judge)
        c = sc.marks[r['c']]
        return sum(1 for m in sc.marks if m['t_in'] <= r['t0'] < m['t_out'] and math.hypot(m['x'] - c['x'], m['y'] - c['y']) < 150)
    cand = sorted(big or sc.merges, key=lambda r: abs(r['t0'] - t_near))[:12]
    r = min(cand, key=crowd)
    c = sc.marks[r['c']]; cx, cy = c['x'], c['y']
    bw, bh = box
    rows = []
    for i in range(n):
        t = r['t0'] - 0.1 + (r['D'] + 0.2) * i / (n - 1)
        f = sc.frame(t)
        x0 = int(np.clip(cx - bw / 2, 0, W - bw)); y0 = int(np.clip(cy - bh / 2, 0, H - bh))
        a = f[y0:y0 + bh, x0:x0 + bw]
        s6 = cv2.resize(f, (640, 360), interpolation=cv2.INTER_AREA)
        b = s6[y0 // 3:(y0 + bh) // 3, x0 // 3:(x0 + bw) // 3]
        b = cv2.resize(b, (bw, bh), interpolation=cv2.INTER_NEAREST)
        rows.append(np.vstack([a, np.ones((6, bw, 3), np.float32), b]))
        rows.append(np.ones((2 * bh + 6, 6, 3), np.float32))
    L.save(out, np.hstack(rows))
    print('closeup merge', r['t0'], r['D'], sc.marks[r['a']]['s'], sc.marks[r['b']]['s'])


if __name__ == '__main__':
    main()
