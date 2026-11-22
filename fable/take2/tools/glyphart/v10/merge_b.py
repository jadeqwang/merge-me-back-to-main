#!/usr/bin/env python3
"""A4 revision b (main thread's notes on merge.py, 2026-11-22): MANY INTO ONE.

  - The count halves, the size holds or grows: letters pair and fuse, survivors stay 60-130 px (at 1920). Late on there are eight,
    four, two large marks drifting onto her torso (fusions on the 8th-note pulse from 228.48, so they can be counted); the final
    fusion leaves ONE large violet mark at her chest (where she caught the light) that sinks into her at 231.210 ("become").
  - The drawing comes OUT of the letters: at 223.135 she is made of letters (the figure beneath is almost absent: a dim
    underpainting; the face stays clean as in the catch); every fusion leaves a patch of the clean drawn line and colour where it
    happened (a soft disc, radius ~ the spacing of the marks then alive); what is still hidden fills in from the chest outward
    as the last mark goes in. The drawing is complete only then.
  - Dark ground through the merge. Daylight on "become": at 231.210 it spreads outward FROM the point where the last mark sank,
    growing through the riser to full at 235.038; her eyes open (closed-eye night_jade face -> open-eye patch_settle face) in two
    frames at 231.21 under the flash. No dissolve of faces.
Same frame as merge.py (night_jade aligned onto patch_settle's figure; zoom 1 -> 1.035 baked). Plates: <id>b.
  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/v10/merge_b.py --test T,.. --out DIR | --render [--only cb10]
"""
import os, sys, math, json, time, argparse, shutil
import numpy as np, cv2
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import gl10 as L
import merge as M0
from merge import W, H, T10, T11, T12, T13, BECOME, PULSE, BEAT, FOLD_BEATS, PS_A, PS_B

PL = M0.PL
SHOTS = {'cb10': ('fold_merge10b', T10, T11), 'cb11': ('patch_hold_merge10b', T11, T12), 'cb12': ('patch_settle_merge10b', T12, T13)}
EIGHTH = BEAT / 2
tick = lambda k: PULSE + k * EIGHTH
# the countable end: 8 -> 4 -> 2 -> 1 on pulse ticks, then the one mark sinks in on "become"
FINAL = [(tick(5), 0.40), (tick(7), 0.40), (tick(9), 0.40)]     # 229.542, 229.966, 230.391 (each done 0.40 s later)
SINK0 = tick(9) + 0.30                                           # 230.69 -> BECOME
CFG = dict(N0=230, s0=(74, 100), run_s=88, smin=70, smax=150, grow=1.07, D0=0.75, t_merge0=223.4, n8=8, key=0.55)


class SceneB(M0.Scene):
    def build(s):
        G, rng, C = s.G, s.rng, CFG
        x0, y0, x1, y1 = s.figbb
        s.chest = (float((x0 + x1) / 2), float(y0 + 0.36 * (y1 - y0)))
        marks = []
        def add(**k):
            k['id'] = len(marks); marks.append(k); return k
        # 1. she is made of letters at 223.135 (as at the end of the catch): her own colours (lifted), a quarter violet
        ys, xs = np.nonzero(s.allow[::4, ::4]); pts = np.stack([xs * 4, ys * 4], 1).astype(np.float32)
        txt = G.text_glyphs(L.HANDOFF * 4, rng, swap=0.35)
        sp = 0.46 * np.mean(C['s0']); taken = []; grid = {}
        for i in rng.permutation(len(pts)):
            x, y = pts[i]; gx, gy = int(x // sp), int(y // sp)
            if any((x - p[0]) ** 2 + (y - p[1]) ** 2 < sp * sp for a in (-1, 0, 1) for b in (-1, 0, 1) for p in grid.get((gx + a, gy + b), [])):
                continue
            grid.setdefault((gx, gy), []).append((x, y)); taken.append((x, y))
        for j, (x, y) in enumerate(taken):
            vio = rng.random() < 0.25
            c = s.src_col(x, y)
            col = L.hexrgb('#B08CFF') if vio else np.clip(1 - (1 - c) * 0.72, 0, 1)
            add(gid=txt[j % len(txt)][0], x=float(x), y=float(y), s=float(rng.uniform(*C['s0'])), th=float(rng.normal(0, 0.1)), col=col,
                t_in=T10 - 1, t_out=1e9, fly=None, vio=vio, gen=0)
        # 2. the twelve words, as in merge.py (rows kept apart)
        rows = []
        for k, (lid, word, hexc, side) in enumerate(L.LIVES):
            tk = T10 + FOLD_BEATS[k] * BEAT
            sz = C['run_s']; adv = 0.56 * sz; n = len(word); wlen = adv * (n - 1); best = None
            for tries in range(3000):
                if tries and tries % 600 == 0 and best is None:
                    sz *= 0.88; adv = 0.56 * sz; wlen = adv * (n - 1)
                ax = rng.uniform(x0, x1 - wlen); ay = rng.uniform(y0 + 0.22 * (y1 - y0), y1 - 60)
                if not all(s.allow[int(ay), int(np.clip(ax + j * adv, 0, W - 1))] for j in range(n)):
                    continue
                clash = sum(1 for (bx0, bx1, by) in rows[-5:] if abs(by - ay) < 0.9 * sz and ax < bx1 and ax + wlen > bx0)
                if clash == 0:
                    best = (ax, ay); break
                if best is None:
                    best = (ax, ay)
            ax, ay = best; rows.append((ax - 0.3 * sz, ax + wlen + 0.3 * sz, ay))
            col = np.clip(L.hexrgb(hexc) * 0.85 + 0.15, 0, 1)
            fromx = -0.08 * W if side == 'left' else 1.08 * W
            for j, ch in enumerate(word):
                if ch == '-':
                    continue
                g0 = G.of_char(ch, rng); gid = G.em(g0) if g0 is not None else G.em(G.any_script(rng)[0])
                ta = tk - 0.02 * (n - j if side == 'right' else j)
                add(gid=gid, x=ax + j * adv, y=ay, s=sz, th=0.0, col=col, t_in=ta, t_out=1e9, vio=(lid == 'violet'), gen=0,
                    fly=(fromx + (j - n / 2) * adv * 0.9, ay - rng.uniform(-0.15, 0.25) * H, ta - 0.42, ta))
        s.merges = []; s.reveals = []
        tot = len(marks)
        figA = float((s.fig > 0.5).sum())

        def fuse(a, b, t, D, final=False, to=None):
            w = a['s'] + b['s']
            mx, my = (a['x'] * a['s'] + b['x'] * b['s']) / w, (a['y'] * a['s'] + b['y'] * b['s']) / w
            n_alive = sum(1 for m in marks if m['t_in'] <= t < m['t_out']) + sum(1 for m in marks if m['t_in'] > t)
            if to is not None:
                mx, my = to
            elif False:   # (rev b1: ring placement now in the endgame below) onto her torso, spread on a shrinking ring round her chest (countable)
                R = 80 * math.sqrt(max(1, n_alive - 1))
                vx, vy = mx - s.chest[0], my - s.chest[1]; l = math.hypot(vx, vy) + 1e-6
                if n_alive <= 12 or l > R:   # on the ring (pushed out too when few: they must not pile)
                    rr = R if n_alive <= 12 else R
                    mx, my = s.chest[0] + vx / l * rr * 1.0, s.chest[1] + vy / l * rr * 0.85
            sep = math.hypot(b['x'] - a['x'], b['y'] - a['y']) + 1e-3
            ux, uy = (b['x'] - a['x']) / sep, (b['y'] - a['y']) / sep
            close = 0.3 * max(a['s'], b['s'])
            pa = (mx - ux * close / 2, my - uy * close / 2); pb = (mx + ux * close / 2, my + uy * close / 2)
            cap = C['smax'] if n_alive <= 17 else 112.0       # many marks stay mid-size (so they do not pile); the last few are large
            sc = float(np.clip(max(a['s'], b['s']) * C['grow'], C['smin'], cap))
            if final:
                sc = 170.0
            tgt = G.tier_glyph(1 if rng.random() < 0.6 else 2, rng) if not final else G.em(int(np.nonzero((G.char == 'R') & (np.char.find(G.font.astype(str), 'DejaVuSans-Bold') >= 0))[0][0]))
            col = (a['col'] * a['s'] + b['col'] * b['s']) / w
            vio = a['vio'] or b['vio']
            gen = max(a['gen'], b['gen']) + 1
            if n_alive <= 5:       # the last marks carry the note: violet
                col = col * 0.4 + L.hexrgb('#A57BFF') * 0.6; vio = True
            c = add(gid=tgt, x=mx, y=my, s=sc, th=0.0 if n_alive <= 9 else float((a['th'] + b['th']) / 4), col=np.clip(col, 0, 1),
                    t_in=t + D, t_out=1e9, fly=None, vio=vio, gen=gen)
            a['t_out'] = b['t_out'] = t
            s.merges.append(dict(a=a['id'], b=b['id'], c=c['id'], t0=t, D=D, pa=pa, pb=pb))
            # the patch of drawing this fusion leaves: where both letters were and where they met
            r = 0.62 * math.sqrt(figA / max(1, n_alive))
            s.reveals.append((t + 0.5 * D, float((a['x'] + b['x']) / 2), float((a['y'] + b['y']) / 2), r))
            c['gen'] = gen
            return c

        # 3. fusions, continuous (no percussion under the folds): the count falls geometrically to 16 by TE (none in flight then)
        dt = 1 / 48; t = C['t_merge0']; TE = 228.30
        while t < TE:
            alive = [m for m in marks if m['t_in'] <= t < m['t_out']]
            pend = [m for m in marks if m['t_in'] > t and m['fly'] is None]    # children forming (not runs still in the air)
            n_alive = len(alive) + len(pend)
            u = min(1.0, (t - C['t_merge0']) / (TE - 1.2 - C['t_merge0']))
            landed = sum(1 for m in marks if m['gen'] == 0 and m['t_in'] <= t)
            nl = landed - sum(1 for r in s.merges)          # units if nothing had merged, minus merges so far = alive now
            target = (landed - (landed - 16) * u ** 0.9)
            D = C['D0'] if t < 226.0 else 0.55
            if t + D > TE:
                t += dt; continue
            elig = [m for m in alive if t - m['t_in'] >= (0.7 if m['fly'] is not None else 0.12)]
            while n_alive > target and len(elig) >= 2:
                ages = np.array([t - m['t_in'] for m in elig]) + 0.3
                a = elig[rng.choice(len(elig), p=ages / ages.sum())]
                others = [m for m in elig if m is not a]
                d = np.array([math.hypot(m['x'] - a['x'], m['y'] - a['y']) for m in others])
                band = np.where(d < 0.7 * a['s'], d + 3 * a['s'], d)
                b = others[int(np.argmin(band))]
                elig.remove(a); elig.remove(b)
                fuse(a, b, t, D); n_alive -= 1
            t += dt
        # 4. the countable end. At TE the survivors (about 16) glide onto a ring round her chest (TE -> first pulse tick), then on the
        # 8th-note pulse: 16 -> 8 (tick 1), 8 -> 4 (tick 5), 4 -> 2 (tick 7), 2 -> 1 (tick 9), each child on a smaller ring; the one
        # left is at her chest and sinks in on "become"
        cx, cy = s.chest
        al = [m for m in marks if m['t_in'] <= TE and m['t_out'] > TE]
        al.sort(key=lambda m: math.atan2(m['y'] - cy - 125, m['x'] - cx))
        # rings on her torso, centred below the chest so the top of every ring stays under her chin (the face stays clean)
        rings = {16: (245, 225), 8: (205, 190), 4: (150, 130), 2: (125, 0), 1: (0, 0)}
        ry0 = cy + 125
        def slot(n, k, ang=None):
            rx, ry = rings[n]
            a_ = ang if ang is not None else -math.pi / 2 + 2 * math.pi * (k + 0.5) / n
            return cx + rx * math.cos(a_), (ry0 if n > 2 else cy + 40) + ry * math.sin(a_)
        n0 = len(al)
        glided = []
        for k, m in enumerate(al):
            ang = math.atan2(m['y'] - cy, m['x'] - cx)
            sx, sy = slot(16, 0, ang=-math.pi + 2 * math.pi * (k + 0.5) / n0)
            m['t_out'] = TE
            g = add(gid=m['gid'], x=sx, y=sy, s=float(max(m['s'], 96)), th=0.0, col=m['col'], t_in=tick(1) - 0.02, t_out=1e9, fly=None,
                    vio=m['vio'], gen=m['gen'], glide=(m['x'], m['y'], m['s'], TE, tick(1) - 0.02))
            glided.append(g)
        cur = glided
        levels = [(tick(1), 16), (tick(3), 8), (tick(5), 4), (tick(7), 2), (tick(9), 1)]
        rings[32] = rings[16]
        for tf, nn in levels:
            f = min(len(cur) - nn, len(cur) // 2)
            if f <= 0:
                continue
            cur.sort(key=lambda m: math.atan2(m['y'] - cy, m['x'] - cx))
            step = len(cur) / f                   # spread the f pairs evenly round the ring
            used = set(); nxt = []
            starts = sorted({int(k * step) for k in range(f)})
            for st in starts:
                a, b = cur[st % len(cur)], cur[(st + 1) % len(cur)]
                if id(a) in used or id(b) in used:
                    continue
                used.add(id(a)); used.add(id(b))
                ang = math.atan2((a['y'] + b['y']) / 2 - cy, (a['x'] + b['x']) / 2 - cx)
                to = s.chest if nn == 1 else slot(nn if nn in rings else 16, 0, ang=ang)
                nxt.append(fuse(a, b, tf, 0.30, final=(nn == 1), to=to))
            cur = [m for m in cur if id(m) not in used] + nxt
        s.final = cur[0]
        s.final['t_out'] = SINK0
        for m in marks:
            if m['t_out'] > 1e8 and m is not s.final:
                m['t_out'] = SINK0
        s.marks = marks
        print(f'marks {len(marks)}, fusions {len(s.merges)}, ring {n0}',
              'final', round(s.final['s']), 'at', [round(v) for v in (s.final['x'], s.final['y'])])
        # the face switch: open-eyed patch_settle face, aligned box
        s.face_hard = (s.face > 0.02).astype(np.float32)
        s.face_hard = cv2.GaussianBlur(s.face_hard, (0, 0), 4)

    # ------------------------------------------------------------------ the picture under the letters
    def revealed(s, t):
        m = np.zeros((H // 4, W // 4), np.float32)
        live = sorted(((min(1.0, (t - tr) / 0.35), x, y, r) for (tr, x, y, r) in s.reveals if t > tr))   # ascending: max, not overwrite
        for (a, x, y, r) in live:
            cv2.circle(m, (int(x / 4), int(y / 4)), max(1, int(r / 4)), float(a), -1)
        if t > SINK0:   # what is still hidden fills in from her chest outward as the last mark goes in
            rr = (t - SINK0) / (BECOME + 0.25 - SINK0)
            cv2.circle(m, (int(s.chest[0] / 4), int(s.chest[1] / 4)), int(max(0, rr) * 0.45 * W / 4), 1.0, -1)
        return cv2.resize(cv2.GaussianBlur(m, (0, 0), 3), (W, H))

    def day_at(s, t):
        """daylight spreading from where the last mark sank (the chest) from 231.21 to full at 235.038: per-pixel weight"""
        if t < BECOME:
            return None
        u = (t - BECOME) / (T13 - BECOME); u = min(1.0, u)
        R = (0.04 + 1.3 * (u ** 0.75)) * W
        if not hasattr(s, '_dist'):
            yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
            s._dist = np.hypot(xx - s.chest[0], yy - s.chest[1])
        w = np.clip((R - s._dist) / (0.18 * W) + 0.5, 0, 1)
        w = w * w * (3 - 2 * w)
        return w * (0.35 + 0.65 * L.smooth(u * 1.4)) if u < 1 else np.ones((H, W), np.float32)

    def picture(s, t):
        night = s.nj
        rev = s.revealed(t)
        figm = (s.fig * (1 - s.face))
        under = cv2.GaussianBlur(night, (0, 0), 9) * 0.22 + 0.01
        hidden = figm * (1 - rev)
        out = night * (1 - hidden[..., None]) + under * hidden[..., None]
        if t >= BECOME:
            f = PS_A + (t - BECOME) / (T13 - BECOME) * (PS_B - PS_A)
            i0 = int(f); fb = f - i0
            day = s.psframe(i0) * (1 - fb) + s.psframe(min(PS_B, i0 + 1)) * fb
            # eyes open on "become": the face region switches in two frames, under the flash
            e = min(1.0, (t - BECOME) / (2 / 24 + 1e-6))
            fh = (s.face_hard * e)[..., None]
            out = out * (1 - fh) + day * fh
            w = s.day_at(t)[..., None]
            out = out * (1 - w) + day * w
            # a warm rim on the daylight front
            u = min(1.0, (t - BECOME) / (T13 - BECOME))
            if u < 1:
                R = (0.04 + 1.3 * (u ** 0.75)) * W
                rim = np.exp(-((s._dist - R) / (0.05 * W)) ** 2) * 0.35 * (1 - u)
                out = out + (1 - out) * rim[..., None] * np.array([1.0, 0.9, 0.7], np.float32)
        return out

    def grade(s, t):
        if t < BECOME:
            return None
        u = L.smooth((t - BECOME) / (T13 - BECOME))
        warm = np.array([1.0 + 0.04 * u, 1.0 + 0.015 * u, 1.0 - 0.025 * u], np.float32)
        return lambda c: c * warm + 0.03 * u * (1 - c)

    # ------------------------------------------------------------------ drawing
    def frame(s, t):
        G = s.G; key = CFG['key']
        can = s.picture(t).astype(np.float32).copy()
        for m in s.marks:
            if t >= m['t_out'] and m is not s.final:
                continue
            if m is s.final and t >= m['t_out']:
                continue
            if m['fly'] is not None and t < m['t_in']:
                fx, fy, ta, tb = m['fly']
                if t < ta:
                    continue
                u = (t - ta) / (tb - ta)
                for k_ in (3, 2, 1, 0):
                    u2 = max(0, u - 0.06 * k_); e2 = 1 - (1 - u2) ** 2.2
                    x2 = fx + (m['x'] - fx) * e2; y2 = fy + (m['y'] - fy) * e2 - math.sin(u2 * math.pi) * 0.05 * H
                    x0, y0, d = L.sdf_item(G, [(m['gid'], x2, y2, m['s'], m['th'])], margin=34 if k_ == 0 else 6)
                    if k_:
                        L.ink(can, x0, y0, d, m['col'], a=0.18 * (4 - k_) / 3)
                    else:
                        L.ink(can, x0, y0, d, m['col'], key=key, glow=0.5, gr=10)
                continue
            if m.get('glide') and t < m['t_in']:
                fx, fy, fs, ta, tb = m['glide']
                if t < ta:
                    continue
                e = L.smooth((t - ta) / (tb - ta))
                x0, y0, d = L.sdf_item(G, [(m['gid'], fx + (m['x'] - fx) * e, fy + (m['y'] - fy) * e, fs + (m['s'] - fs) * e, 0.0)])
                L.ink(can, x0, y0, d, m['col'], key=key)
                continue
            if t < m['t_in']:
                continue
            land = t - m['t_in']
            glow = 0.6 * max(0, 1 - land / 0.3) if m['fly'] is not None else 0
            x0, y0, d = L.sdf_item(G, [(m['gid'], m['x'], m['y'], m['s'], m['th'])], margin=34 if glow else 6)
            L.ink(can, x0, y0, d, m['col'], key=key, glow=glow, gr=10)
        for r in s.merges:
            if not (r['t0'] <= t < r['t0'] + r['D']):
                continue
            a, b, c = s.marks[r['a']], s.marks[r['b']], s.marks[r['c']]
            u = (t - r['t0']) / r['D']
            sl = L.smooth(u / 0.62)
            ax, ay = a['x'] + (r['pa'][0] - a['x']) * sl, a['y'] + (r['pa'][1] - a['y']) * sl
            bx, by = b['x'] + (r['pb'][0] - b['x']) * sl, b['y'] + (r['pb'][1] - b['y']) * sl
            mm = float(L.smooth((u - 0.52) / 0.48))
            # the new mark forms at the midpoint of the overlap, then (if pulled to her chest) glides there
            cx0, cy0 = (ax + bx) / 2, (ay + by) / 2
            cx, cy = cx0 + (c['x'] - cx0) * mm, cy0 + (c['y'] - cy0) * mm
            sz = (max(a['s'], b['s']) + (c['s'] - max(a['s'], b['s'])) * mm) * (1 + 0.18 * math.sin(math.pi * mm))
            gr = 12 + 0.15 * sz
            bb = L.sdf_item(G, [(a['gid'], ax, ay, a['s'], a['th']), (b['gid'], bx, by, b['s'], b['th']), (c['gid'], cx, cy, sz, c['th'])],
                            margin=int(3 * gr))
            x0, y0 = bb[0], bb[1]; hh, ww = bb[2].shape
            da = L._warp_sdf(G, a['gid'], ax, ay, a['s'], a['th'], x0, y0, ww, hh)
            db = L._warp_sdf(G, b['gid'], bx, by, b['s'], b['th'], x0, y0, ww, hh)
            dc = L._warp_sdf(G, c['gid'], cx, cy, sz, c['th'], x0, y0, ww, hh)
            d = (1 - mm) * np.minimum(da, db) + mm * dc
            wa = 1 / (1 + np.exp(np.clip((da - db) / 3, -30, 30)))
            colp = wa[..., None] * a['col'] + (1 - wa[..., None]) * b['col']
            flash = math.sin(math.pi * np.clip((u - 0.4) / 0.5, 0, 1))
            colp = colp * (1 - mm) + c['col'] * mm
            colp = colp + (1 - colp) * 0.55 * flash
            M0.Scene.ink_map(can, x0, y0, d, colp, key=key, glow=min(1.3, 0.55 + 0.15 * c['gen']) * flash, gcol=np.clip(c['col'] * 0.5 + 0.5, 0, 1), gr=gr)
        # the last mark: sinks into her chest (SINK0 -> BECOME), then a flash that becomes the daylight
        m = s.final
        if SINK0 <= t < BECOME:
            u = (t - SINK0) / (BECOME - SINK0); e = u * u
            sz = m['s'] * (1 - 0.92 * e)
            x0, y0, d = L.sdf_item(G, [(m['gid'], m['x'], m['y'] + 10 * e, sz, 0.0)], margin=60)
            L.ink(can, x0, y0, d, m['col'] * (1 - e) + np.ones(3, np.float32) * e, a=1.0, key=key * (1 - e), glow=0.4 + 0.8 * e, gcol=L.hexrgb('#C9B2FF'), gr=16)
        if BECOME - 1 / 24 <= t < BECOME + 0.6:
            f = 1 - max(0.0, t - BECOME) / 0.6
            if not hasattr(s, '_dist'):
                s.day_at(BECOME)
            g_ = np.exp(-(s._dist / (0.09 * W)) ** 2) * 0.9 * f
            can = can + (1 - can) * g_[..., None] * np.array([0.95, 0.88, 1.0], np.float32)
        g = s.grade(t)
        if g is not None:
            can = g(can)
        z = 1.0 + 0.035 * L.smooth((t - T10) / (T13 - T10))
        Mz = cv2.getRotationMatrix2D((W * 0.5, H * 0.45), 0, z)
        can = cv2.warpAffine(can, Mz, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        return np.clip(can, 0, 1)


def render_shot(sc, name):
    pid, t0, t1 = SHOTS[name]
    out = f'{PL}/{pid}'; fd = f'{out}/frames'; os.makedirs(fd, exist_ok=True)
    n = int(math.ceil((t1 - t0) * 24)) + 2
    t_ = time.time()
    for i in range(n):
        L.save(f'{fd}/f_{i + 1:04d}.jpg', sc.frame(t0 + i / 24), q=93)
    shutil.copy(f'{fd}/f_0001.jpg', f'{out}/still.jpg')
    json.dump(dict(fps=24, n=n, turn_t=None, w=W, h=H, t0_song=t0, src='fable/take2/tools/glyphart/v10/merge_b.py (night_jade + patch_settle '
                   'frames 82-121, many letters into one)', glyph=dict(v10='A4 merge b', shot=name, t0=t0, t1=t1)), open(f'{out}/meta.json', 'w'))
    open(f'{out}/REAL', 'w').write('glyph v10 A4 merge b render (derived from night_jade, patch_settle)\n')
    print(f'{pid}: {n} frames, {time.time() - t_:.0f} s')


def tests_b(sc, out, ts=(224, 226.5, 228.5, 230, 231.0, 231.3, 233, 234.9)):
    rows = []
    for t in ts:
        f = sc.frame(t)
        b = (cv2.resize(f, (640, 360), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8)[..., ::-1]
        cx, cy = sc.chest
        x0 = int(np.clip(cx - 480, 0, W - 960)); y0 = int(np.clip(cy - 220, 0, H - 540))
        a = (f[y0:y0 + 540, x0:x0 + 960] * 255).astype(np.uint8)[..., ::-1]
        a = cv2.resize(a, (640, 360), interpolation=cv2.INTER_AREA) if False else a
        r = np.hstack([np.vstack([b, np.full((180, 640, 3), 30, np.uint8)]), np.full((540, 6, 3), 255, np.uint8), a])
        cv2.putText(r, f'{t:.2f}  640 full 1:1', (8, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        cv2.putText(r, '1920 crop 1:1', (656, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
        rows.append(r)
    pairs = [np.hstack([rows[i], np.full((540, 10, 3), 255, np.uint8), rows[i + 1]]) for i in range(0, len(rows), 2)]
    cv2.imwrite(out, np.vstack([np.vstack([p, np.full((8, p.shape[1], 3), 255, np.uint8)]) for p in pairs]), [cv2.IMWRITE_JPEG_QUALITY, 86])
    print(out)


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--test', default=''); ap.add_argument('--out', default=''); ap.add_argument('--tests-b', default='')
    ap.add_argument('--render', action='store_true'); ap.add_argument('--only', default='')
    a = ap.parse_args()
    sc = SceneB(7)
    if a.test:
        os.makedirs(a.out, exist_ok=True)
        for t in [float(x) for x in a.test.split(',')]:
            L.save(f'{a.out}/b_{t:.3f}.jpg', sc.frame(t))
    if a.tests_b:
        tests_b(sc, a.tests_b)
    if a.render:
        for name in (a.only.split(',') if a.only else SHOTS):
            render_shot(sc, name)
