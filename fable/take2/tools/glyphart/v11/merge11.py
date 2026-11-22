#!/usr/bin/env python3
"""A4, film v11 (v11 direction A4): the merge written in HER WORDS. Same mechanics and timings as v10 merge_b.py rev c (imported,
unchanged): one simulation over cb10-cb12 in patch_settle's frame, the count falls on the 8th-note pulse, the last mark sinks in on
"become" 231.210, eyes open there, daylight from the chest to 235.038. What changes:

  1. 223.135: she is written in corpus words (tools/glyphart/v11/corpus): whole words in reading order along short runs over her,
     lines interleaved song by song (Merge, Rare Earth, Orbital Sunrise, Moongazing, Rewind, Hold Fire, Chaos Monkey; hanzi lines
     in chunks of up to four characters); Merge's words violet, the others in her own colours (lifted). Only Latin and hanzi.
  2. Each of the twelve lives arrives as a PHRASE from one of her songs (PHRASES below) in its branch colour, wrapped in a block on
     her, flying in from the life's side on its fold beat (shots.js beats as v10); the corpus letters under the block give way.
  3. Fusions: two letters slide together and their union flows into ONE letter that is one of the two (its character kept, the next
     finer type: heavy -> book -> pen), so no letter is ever foreign to the words. The endgame spells: the ~22 survivors flow at
     228.30 into MERGE ME / BACK TO / MAIN (17), then on the pulse ticks FOLD / ME IN (8), MAIN (4), ME (2), and the last mark,
     `I` (C059 Bold, violet; A4_LAST=我 for the alternative), sinks in on "become".
  4. Told weak points: glows lower and tighter (counters stay open); the count holds high longer (curve) and each fusion uncovers
     only a letter-sized patch, so the figure is still mostly written while the count falls from 22; the daylight front is
     smoother (large-scale ragged edge only, wider soft edge: no blotches, no dark islands at the top).
Plates (1:1 song time, frame i = t0 + (i-1)/24): fold_merge11 (cb10), patch_hold_merge11 (cb11), patch_settle_merge11 (cb12).
  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/v11/merge11.py --test T,.. --out DIR | --tests-b OUT.jpg | --render [--only cb10]
"""
import os, sys, math, json, time, argparse, shutil
import numpy as np, cv2
HERE = os.path.dirname(os.path.abspath(__file__))
V10 = os.path.join(os.path.dirname(HERE), 'v10')
sys.path.insert(0, HERE); sys.path.insert(0, V10)
import gl10 as L
import gl11 as M
L.Glyphs = M.G11                      # merge.py's Scene builds L.Glyphs(): the v11 glyphs (em_char)
import merge as M0
import merge_b as MB
from merge import W, H, T10, T11, T12, T13, BECOME, PULSE, BEAT, FOLD_BEATS, PS_A, PS_B

PL = M0.PL
SHOTS = {'cb10': ('fold_merge11', T10, T11), 'cb11': ('patch_hold_merge11', T11, T12), 'cb12': ('patch_settle_merge11', T12, T13)}
tick = MB.tick
SINK0 = MB.SINK0
TE = 228.30
LAST = os.environ.get('A4_LAST', 'I')
CFG = dict(s0=66, row=0.9, seg=12, look=5, fly_hold=1.0, rev_a=0.45, run_s=64, smin=70, smax=150, grow=1.07, D0=0.75, t_merge0=223.4, key=0.55, n_te=70, curve=3.0, late=227.6, late_group=3, D_late=0.35, final_thick=1.0,
           rev_k=0.4, fly_glow=0.25, land_glow=0.3, flash_col=0.35, phrase_w=1.15)
# the twelve lives (gl10.LIVES order): a line or phrase of one of her songs that fits the life (main thread approves)
PHRASES = {
    'piano': ('my hands still know', 'orbital-sunrise'),          # "Can't think, can't write, but my hands still know"
    'violin': ('Silent and patient', 'hold-fire'),                 # first chair, waiting for the downbeat
    'wushu': ('学会七十二变', 'chaosmonkey'),                        # "learned the seventy-two transformations" (Sun Wukong)
    'wetlab': ('fin into foot into hand', 'hold-fire'),
    'phd': ('my dissertation defense', 'rewind'),                  # "The night before my dissertation defense"
    'poet': ('举杯邀明月', 'moongazing'),                            # Li Bai: "I raise my cup to invite the moon"
    'ames': ('coming in hot', 'orbital-sunrise'),                  # "Fifteen hundred klicks, coming in hot" (landed the 747 sim)
    'band': ("a chord that's searching", 'hold-fire'),
    'chezjj': ('the hundred come along', 'chaosmonkey'),           # "One whisper, and the hundred come along"
    'sandstorm': ('message in a bottle', 'hold-fire'),
    'home': ('tell me before I sleep', 'chaosmonkey'),             # "妈妈, will you tell me before I sleep"
    'violet': ('looking for a friend', 'rare-earth'),              # "A rare earth looking for a friend"
}
ENDGAME = [  # (start, duration, rows, letter size): each level flows into the next on the 8th-note pulse
    (TE, tick(1) + 0.08 - TE, 'MERGE ME|BACK TO|MAIN', 88),
    (tick(3), 0.30, 'FOLD|ME IN', 112),
    (tick(5), 0.30, 'MAIN', 132),
    (tick(7), 0.30, 'ME', 150),
    (tick(9), 0.30, LAST, 180),
]
VIO = L.hexrgb('#B08CFF')


def han_chunks(w, n=4):
    return [w[i:i + n] for i in range(0, len(w), n)]


class Scene11(MB.SceneB):
    def build(s):
        G, rng, C = s.G, s.rng, CFG
        x0, y0, x1, y1 = s.figbb
        s.chest = (float((x0 + x1) / 2), float(y0 + 0.36 * (y1 - y0)))
        marks = []

        def add(**k):
            k['id'] = len(marks); marks.append(k); return k
        # 1. she is written in corpus words
        songs = {sl: M.corpus(sl) for sl in M.SONGS}
        lines = []
        for i in range(max(len(v) for v in songs.values())):
            for sl in M.SONGS:
                if i < len(songs[sl]):
                    lines.append((sl, songs[sl][i]))
        items, meta = [], []
        for sl, line in lines:
            for w, han in M.words_in(line):
                for piece in (han_chunks(w) if han else [w]):
                    f = (M.HAN_TIERS[0] if han else M.TIERS[0])[int(rng.integers(1 if han else 4))]
                    items.append([(G.em_char(c, f), c) for c in piece]); meta.append((sl, han))
        sz0 = C['s0']
        segs = M.segments(s.allow, sz0, C['row'], C['seg'] * 0.6 * sz0, rng, jit=0.05)
        placed, nw = M.fill(segs, items, sz0, G, gap=0.4, look=C['look'])
        s.n_words0 = nw
        wsz = {}
        for (si, wi, ci, x, y) in placed:
            sl, han = meta[wi % len(items)]
            if wi not in wsz:
                wsz[wi] = (sz0 * rng.uniform(0.94, 1.08), float(rng.normal(0, 0.05)))
            vio = sl == M.MERGE
            col = VIO if vio else np.clip(1 - (1 - s.src_col(x, y)) * 0.72, 0, 1)
            gid, ch = items[wi % len(items)][ci]
            add(gid=gid, ch=ch, han=han, x=float(x), y=float(y), s=wsz[wi][0], th=wsz[wi][1], col=col, t_in=T10 - 1, t_out=1e9,
                fly=None, vio=vio, gen=0, wi=wi)
        print(f'corpus: {len(marks)} letters, {nw} words')
        # 2. the twelve lives: a phrase each, wrapped in a block, flying in from the life's side
        blocks = []
        figw = x1 - x0
        for k, (lid, word, hexc, side) in enumerate(L.LIVES):
            tk = T10 + FOLD_BEATS[k] * BEAT
            text, _ = PHRASES[lid]
            sz = C['run_s']
            ws = []
            for w, han in M.words_in(text):
                f = 'han_bold' if han else 'serif_bold'
                gl = [(G.em_char(c, f), c) for c in w]
                ws.append((gl, [G.adv_of(g) * sz for g, _ in gl], han))
            maxw = max(C['phrase_w'] * figw * 0.5, max(sum(a) for _, a, _ in ws))
            rows = [[]]; cw = 0
            for wd in ws:
                wl = sum(wd[1])
                if rows[-1] and cw + 0.35 * sz + wl > maxw:
                    rows.append([]); cw = 0
                cw += (0.35 * sz if rows[-1] else 0) + wl; rows[-1].append(wd)
            rw = [sum(sum(w[1]) for w in r) + 0.35 * sz * (len(r) - 1) for r in rows]
            bw, bh = max(rw), sz * 0.95 * len(rows)
            best = None
            for tries in range(4000):
                ax = rng.uniform(x0 - 0.08 * figw, x1 + 0.08 * figw - bw); ay = rng.uniform(y0 + 0.24 * (y1 - y0), y1 - 60 - bh)
                cx_, cy_ = ax + bw / 2, ay + bh / 2
                if not s.allow[int(np.clip(cy_, 0, H - 1)), int(np.clip(cx_, 0, W - 1))]:
                    continue
                clash = sum(1 for (bx0, by0, bx1, by1) in blocks[-6:] if ax < bx1 and ax + bw > bx0 and ay < by1 and ay + bh > by0)
                if clash == 0:
                    best = (ax, ay); break
                if best is None or tries % 500 == 0:
                    best = (ax, ay)
            ax, ay = best
            blocks.append((ax - 0.2 * sz, ay - 0.5 * sz, ax + bw + 0.2 * sz, ay + bh))
            col = np.clip(L.hexrgb(hexc) * 0.85 + 0.15, 0, 1)
            fromx = -0.08 * W if side == 'left' else 1.08 * W
            n = sum(len(w[0]) for r in rows for w in r); j = 0
            for ri, r in enumerate(rows):
                x = ax + (bw - rw[ri]) / 2; y = ay + ri * sz * 0.95 + 0.5 * sz
                for (gl, advs, han) in r:
                    for (g, ch), a in zip(gl, advs):
                        ta = tk - 0.02 * (n - j if side == 'right' else j)
                        add(gid=g, ch=ch, han=han, x=x + a / 2, y=y, s=sz, th=0.0, col=col, t_in=ta, t_out=1e9, vio=(lid == 'violet'),
                            gen=0, fly=(fromx + (j - n / 2) * sz * 0.5, y - rng.uniform(-0.15, 0.25) * H, ta - 0.42, ta), life=lid)
                        x += a; j += 1
                    x += 0.35 * sz
            # the corpus letters under the block give way as it lands
            bx0, by0, bx1, by1 = blocks[-1]
            for m in marks:
                if m['fly'] is None and m['gen'] == 0 and m['t_out'] > 1e8 and bx0 < m['x'] < bx1 and by0 < m['y'] < by1:
                    m['t_out'] = tk - 0.1
        s.merges = []; s.reveals = []

        def child_glyph(group, gen, ch=None, font=None):
            if ch is None:
                p = group[int(rng.integers(len(group)))]
                ch, han = p['ch'], p['han']
            else:
                han = M.is_han(ch)
            if font is None:
                tiers = M.HAN_TIERS if han else M.TIERS
                T = tiers[min(len(tiers) - 1, max(0, gen - 1))]
                font = T[int(rng.integers(len(T)))]
            return G.em_char(ch, font), ch, han

        def fuse(group, t, D, to=None, ch=None, size=None, final=False, vio_k=None, font=None, th=None):
            w = sum(m['s'] for m in group)
            mx = sum(m['x'] * m['s'] for m in group) / w; my = sum(m['y'] * m['s'] for m in group) / w
            n_alive = sum(1 for m in marks if m['t_in'] <= t < m['t_out']) + sum(1 for m in marks if m['t_in'] > t)
            cap = C['smax'] if n_alive <= 17 else 112.0
            sc = size if size is not None else float(np.clip(max(m['s'] for m in group) * C['grow'], C['smin'], cap))
            gen = max(m['gen'] for m in group) + 1
            gid, ch_, han = child_glyph(group, gen, ch, font)
            col = sum(m['col'] * m['s'] for m in group) / w
            vio = any(m['vio'] for m in group)
            if vio_k is not None:
                col = col * (1 - vio_k) + L.hexrgb('#A57BFF') * vio_k; vio = vio or vio_k > 0.5
            cx, cy = (to if to is not None else (mx, my))
            th_ = th if th is not None else (0.0 if n_alive <= 9 else float(np.mean([m['th'] for m in group]) / 2))
            c = add(gid=gid, ch=ch_, han=han, x=float(cx), y=float(cy), s=float(sc), th=th_, col=np.clip(col, 0, 1), t_in=t + D,
                    t_out=1e9, fly=None, vio=vio, gen=gen, thick=C['final_thick'] if final else 0.0)
            for m in group:
                m['t_out'] = t
            s.merges.append(dict(src=[m['id'] for m in group], c=c['id'], t0=t, D=D, mx=mx, my=my, single=len(group) == 1, to=to is not None))
            if len(group) > 1 and to is None:     # the patch of drawing a fusion leaves: about one letter
                s.reveals.append((t + 0.5 * D, float(mx), float(my), C['rev_k'] * float(np.mean([m['s'] for m in group]))))
            return c

        # 3. fusions, continuous: the count holds high, then falls to n_te by TE (none in flight then)
        dt = 1 / 48; t = C['t_merge0']
        while t < TE:
            alive = [m for m in marks if m['t_in'] <= t < m['t_out']]
            pend = [m for m in marks if m['t_in'] > t and m['fly'] is None]
            n_alive = len(alive) + len(pend)
            u = min(1.0, (t - C['t_merge0']) / (TE - 0.35 - C['t_merge0']))
            target = s._target(marks, t, u)
            D = C['D0'] if t < 226.0 else (0.45 if t < C['late'] else C['D_late'])
            if t + D > TE:
                t += dt; continue
            elig = [m for m in alive if t - m['t_in'] >= (C['fly_hold'] if m['fly'] is not None else 0.12)]
            while n_alive > target and len(elig) >= 2:
                ages = np.array([t - m['t_in'] for m in elig]) + 0.3
                a = elig[rng.choice(len(elig), p=ages / ages.sum())]
                others = [m for m in elig if m is not a]
                d = np.array([math.hypot(m['x'] - a['x'], m['y'] - a['y']) for m in others])
                band = np.where(d < 0.7 * a['s'], d + 3 * a['s'], d)
                k = 1 if t < C['late'] else min(C['late_group'] - 1, max(1, int(n_alive - target)), len(others))
                grp = [others[i] for i in np.argsort(band)[:k]]      # late: three or four nearest letters fuse at once
                for b in grp:
                    elig.remove(b)
                elig.remove(a)
                fuse([a] + grp, t, D); n_alive -= len(grp)
            t += dt
        # 4. the endgame spells, level by level, in reading order
        cx, cy = s.chest
        cur = [m for m in marks if m['t_in'] <= TE and m['t_out'] > TE]
        cur.sort(key=lambda m: (int((m['y'] - cy) // 90), m['x']))
        print('survivors at TE', len(cur))
        for li, (tf, D, text, size) in enumerate(ENDGAME):
            slots = s.layout(text, size)
            if len(cur) < len(slots):
                print('WARNING: fewer marks than slots', len(cur), len(slots))
            groups = [list(g) for g in np.array_split(np.array(cur, dtype=object), len(slots)) if len(g)]
            vk = [0.3, 0.5, 0.7, 0.85, 1.0][li]
            cur = [fuse(g, tf, D, to=(x, y), ch=ch, size=sz_, final=(len(slots) == 1), vio_k=vk, font=fo, th=th_)
                   for g, (ch, x, y, fo, sz_, th_) in zip(groups, slots)]
        s.final = cur[0]
        s.final['t_out'] = SINK0
        s.final['thick'] = C['final_thick']
        for m in marks:
            if m['t_out'] > 1e8 and m is not s.final:
                m['t_out'] = SINK0
        s.marks = marks
        print(f'marks {len(marks)}, fusions {len(s.merges)}', 'final', s.final['ch'], round(s.final['s']), 'at',
              [round(v) for v in (s.final['x'], s.final['y'])])
        s.face_hard = cv2.GaussianBlur((s.face > 0.02).astype(np.float32), (0, 0), 4)

    def _target(s, marks, t, u):
        """how many marks should be alive at t: every landed letter (less those that gave way under a phrase), held high, then
        falling to n_te at TE - 1 s (u ** curve)"""
        fused = {i for r in s.merges for i in r['src']}
        n0 = sum(1 for m in marks if m['gen'] == 0 and m['t_in'] <= t and not (m['t_out'] <= t and m['id'] not in fused))
        return n0 - (n0 - CFG['n_te']) * u ** CFG['curve']

    def layout(s, text, size):
        """slots (ch, x, y, font, size, th) of the endgame text in rows, centred on her chest, top row under her chin. In the family of
        the merging letters: each letter its own heavy face, size +-7 %, baseline +-5 %, a slight tilt. The last mark (one letter)
        is a heavy slab serif, upright."""
        rows = text.split('|')
        cx, cy = s.chest
        pitch = 1.02 * size
        yc = cy + 70 + (0 if len(rows) > 1 else 10)
        rng = np.random.default_rng(abs(hash(text)) % 1000)
        lone = len(text.replace(' ', '').replace('|', '')) == 1
        out = []
        for ri, r in enumerate(rows):
            spec = []
            for c in r:
                if c == ' ':
                    spec.append((c, None, 0.36 * size, size, 0.0)); continue
                if M.is_han(c):
                    fo = 'han_bold'
                elif lone:
                    fo = 'slab'
                else:
                    fo = ['serif_bold', 'sans_bold', 'serif_bi', 'gothic', 'serif_bold'][int(rng.integers(5))]
                sz = size if lone else size * rng.uniform(0.93, 1.07)
                spec.append((c, fo, s.G.adv_of(s.G.em_char(c, fo)) * sz, sz, 0.0 if lone else float(rng.normal(0, 0.05))))
            x = cx - sum(a for _, _, a, _, _ in spec) / 2; y = yc + (ri - (len(rows) - 1) / 2) * pitch
            for (c, fo, a, sz, th) in spec:
                if c != ' ':
                    out.append((c, x + a / 2, y + (0 if lone else rng.normal(0, 0.05 * size)), fo, sz, th))
                x += a
        return out

    def revealed(s, t):
        """v11: each fusion uncovers its letter-sized patch only part way (rev_a), so the figure stays written (dim) while the count
        falls; what is hidden fills in from her chest as the last mark goes in (as v10)"""
        m = np.zeros((H // 4, W // 4), np.float32)
        live = sorted(((min(1.0, (t - tr) / 0.35) * CFG['rev_a'], x, y, r) for (tr, x, y, r) in s.reveals if t > tr))
        for (a, x, y, r) in live:
            cv2.circle(m, (int(x / 4), int(y / 4)), max(1, int(r / 4)), float(a), -1)
        if t > SINK0:
            rr = (t - SINK0) / (BECOME + 0.25 - SINK0)
            cv2.circle(m, (int(s.chest[0] / 4), int(s.chest[1] / 4)), int(max(0, rr) * 0.45 * W / 4), 1.0, -1)
        return cv2.resize(cv2.GaussianBlur(m, (0, 0), 3), (W, H))

    # smoother daylight front (told weak point: blotchy cloud, dark patches at the top at 233-234.6)
    def front_R(s, t):
        """daylight front (rev c2 look without the blotches): the lit region is star-shaped about the chest (its radius depends on
        the ANGLE only: a torn-paper outline at several scales, so there are no islands or dark holes), plus a fine paper-fibre
        jitter of a few px along the edge"""
        if not hasattr(s, '_dist'):
            yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
            s._dist = np.hypot(xx - s.chest[0], yy - s.chest[1])
            rng = np.random.default_rng(31)
            ang = np.arctan2(yy - s.chest[1], xx - s.chest[0])
            n = np.zeros((H, W), np.float32)
            for k, amp in ((2, 0.07), (3, 0.06), (5, 0.05), (8, 0.04), (13, 0.03), (21, 0.022), (34, 0.015), (55, 0.01), (89, 0.007)):
                for _ in range(2):
                    n += amp * np.cos(k * ang + rng.uniform(0, 2 * np.pi)).astype(np.float32) * rng.uniform(0.6, 1.2)
            fib = cv2.GaussianBlur(rng.standard_normal((H, W)).astype(np.float32), (0, 0), 2.0)
            fib /= fib.std() + 1e-6
            s._dfront = np.hypot((xx - s.chest[0]) * 0.86, yy - s.chest[1]) * (1 + n) + 5.0 * fib
            s._dsort = np.sort(s._dfront[::4, ::4].ravel())
        ts, fs = zip(*MB.SceneB.DAY_KEYS)
        f = float(np.interp(t, ts, fs))
        if f >= 1.0:
            return None
        return float(s._dsort[min(len(s._dsort) - 1, int(f * len(s._dsort)))])

    def day_at(s, t):
        if t < BECOME:
            return None
        R = s.front_R(t)
        if R is None:
            return np.ones((H, W), np.float32)
        e = 0.06 * R + 10          # a fairly crisp paper edge (soft, not a vignette)
        w = np.clip((R - s._dfront) / e + 0.5, 0, 1)
        return w * w * (3 - 2 * w)

    # ------------------------------------------------------------------ drawing
    def frame(s, t):
        G = s.G; key = CFG['key']; C = CFG
        can = s.picture(t).astype(np.float32).copy()
        for m in s.marks:
            if t >= m['t_out']:
                continue
            if m['fly'] is not None and t < m['t_in']:
                fx, fy, ta, tb = m['fly']
                if t < ta:
                    continue
                u = (t - ta) / (tb - ta)
                for k_ in (3, 2, 1, 0):
                    u2 = max(0, u - 0.06 * k_); e2 = 1 - (1 - u2) ** 2.2
                    x2 = fx + (m['x'] - fx) * e2; y2 = fy + (m['y'] - fy) * e2 - math.sin(u2 * math.pi) * 0.05 * H
                    x0, y0, d = L.sdf_item(G, [(m['gid'], x2, y2, m['s'], m['th'])], margin=24 if k_ == 0 else 6)
                    if k_:
                        L.ink(can, x0, y0, d, m['col'], a=0.12 * (4 - k_) / 3)
                    else:
                        L.ink(can, x0, y0, d, m['col'], key=key, glow=C['fly_glow'], gr=6)
                continue
            if t < m['t_in']:
                continue
            land = t - m['t_in']
            glow = C['land_glow'] * max(0, 1 - land / 0.3) if m['fly'] is not None else 0
            x0, y0, d = L.sdf_item(G, [(m['gid'], m['x'], m['y'], m['s'], m['th'])], margin=24 if glow else 6, thin=-m.get('thick', 0.0))
            L.ink(can, x0, y0, d, m['col'], key=key, glow=glow, gr=6)
        for r in s.merges:
            if not (r['t0'] <= t < r['t0'] + r['D']):
                continue
            src = [s.marks[i] for i in r['src']]; c = s.marks[r['c']]
            u = (t - r['t0']) / r['D']
            sl = L.smooth(u / 0.62)
            mm = float(L.smooth((u - 0.52) / 0.48))
            if r.get('to'):      # endgame: the old line's letters SLIDE into the new line's letters: every parent travels to the
                # slot (converging there from its own side), growing to the new size; on arrival their union flows into the new letter
                e = float(L.smooth(u / 0.8)); mm = float(L.smooth((u - 0.45) / 0.55))
                ps = []
                for a in src:
                    ox, oy = (a['x'] - r['mx']) * 0.35, (a['y'] - r['my']) * 0.35
                    tx, ty = c['x'] + ox * (1 - mm), c['y'] + oy * (1 - mm)
                    ps.append((a, a['x'] + (tx - a['x']) * e, a['y'] + (ty - a['y']) * e, a['s'] + (c['s'] - a['s']) * e,
                               a['th'] + (c['th'] - a['th']) * e))
                gr = 6 + 0.05 * c['s']
                comps = [(a['gid'], x, y, sz_, th_) for (a, x, y, sz_, th_) in ps] + [(c['gid'], c['x'], c['y'], c['s'], c['th'])]
                bb = L.sdf_item(G, comps, margin=int(3 * gr))
                x0, y0 = bb[0], bb[1]; hh, ww = bb[2].shape
                ds = [L._warp_sdf(G, a['gid'], x, y, sz_, th_, x0, y0, ww, hh) for (a, x, y, sz_, th_) in ps]
                dc = L._warp_sdf(G, c['gid'], c['x'], c['y'], c['s'], c['th'], x0, y0, ww, hh) - c.get('thick', 0.0)
                dmin = np.min(np.stack(ds), 0)
                d = (1 - mm) * dmin + mm * dc
                wts = np.stack([np.exp(-np.clip(dd - dmin, 0, 30) / 3) for dd in ds]); wts /= wts.sum(0, keepdims=True)
                colp = sum(wts[i][..., None] * (ps[i][0]['col'] * (1 - e * 0.6) + c['col'] * e * 0.6) for i in range(len(ps)))
                colp = colp * (1 - mm) + c['col'] * mm
                flash = math.sin(math.pi * np.clip((u - 0.45) / 0.5, 0, 1)) * (0.6 if len(src) > 1 else 0.25)
                colp = colp + (1 - colp) * C['flash_col'] * flash
                M0.Scene.ink_map(can, x0, y0, d, colp, key=key, glow=0.3 * flash, gcol=np.clip(c['col'] * 0.5 + 0.5, 0, 1), gr=gr)
                continue
            if r['single']:      # a letter that only moves and changes (endgame): glide + shape flow
                a = src[0]; e = L.smooth(u)
                px, py = a['x'] + (c['x'] - a['x']) * e, a['y'] + (c['y'] - a['y']) * e
                sz = a['s'] + (c['s'] - a['s']) * e
                x0, y0, d = L.sdf_item(G, [(a['gid'], px, py, sz, a['th'] * (1 - e))], m=e, target=(c['gid'], px, py, sz, 0.0), margin=8)
                L.ink(can, x0, y0, d, a['col'] * (1 - e) + c['col'] * e, key=key)
                continue
            ps = []
            for a in src:     # every parent slides toward the group's centre (to a quarter of its distance)
                ps.append((a, a['x'] + (r['mx'] + (a['x'] - r['mx']) * 0.25 - a['x']) * sl, a['y'] + (r['my'] + (a['y'] - r['my']) * 0.25 - a['y']) * sl))
            cx0 = np.mean([p[1] for p in ps]); cy0 = np.mean([p[2] for p in ps])
            cx, cy = cx0 + (c['x'] - cx0) * mm, cy0 + (c['y'] - cy0) * mm
            smax = max(a['s'] for a in src)
            sz = (smax + (c['s'] - smax) * mm) * (1 + 0.12 * math.sin(math.pi * mm))
            gr = 8 + 0.08 * sz
            comps = [(a['gid'], x, y, a['s'], a['th']) for (a, x, y) in ps] + [(c['gid'], cx, cy, sz, c['th'])]
            bb = L.sdf_item(G, comps, margin=int(3 * gr))
            x0, y0 = bb[0], bb[1]; hh, ww = bb[2].shape
            ds = [L._warp_sdf(G, a['gid'], x, y, a['s'], a['th'], x0, y0, ww, hh) for (a, x, y) in ps]
            dc = L._warp_sdf(G, c['gid'], cx, cy, sz, c['th'], x0, y0, ww, hh)
            dmin = np.min(np.stack(ds), 0)
            d = (1 - mm) * dmin + mm * dc
            wts = np.stack([np.exp(-np.clip(dd - dmin, 0, 30) / 3) for dd in ds])
            wts /= wts.sum(0, keepdims=True)
            colp = sum(wts[i][..., None] * ps[i][0]['col'] for i in range(len(ps)))
            flash = math.sin(math.pi * np.clip((u - 0.4) / 0.5, 0, 1))
            colp = colp * (1 - mm) + c['col'] * mm
            colp = colp + (1 - colp) * C['flash_col'] * flash
            M0.Scene.ink_map(can, x0, y0, d, colp, key=key, glow=min(0.7, 0.3 + 0.08 * c['gen']) * flash,
                             gcol=np.clip(c['col'] * 0.5 + 0.5, 0, 1), gr=gr)
        m = s.final
        if SINK0 <= t < BECOME:
            u = (t - SINK0) / (BECOME - SINK0); e = u * u
            sz = m['s'] * (1 - 0.92 * e)
            x0, y0, d = L.sdf_item(G, [(m['gid'], m['x'], m['y'] + 10 * e, sz, 0.0)], margin=50, thin=-m.get('thick', 0.0) * (1 - e))
            L.ink(can, x0, y0, d, m['col'] * (1 - e) + np.ones(3, np.float32) * e, a=1.0, key=key * (1 - e), glow=0.2 + 0.25 * e,
                  gcol=L.hexrgb('#C9B2FF'), gr=8)
        if BECOME <= t < BECOME + 0.45:
            f = 1 - (t - BECOME) / 0.45
            if not hasattr(s, '_dist'):
                s.front_R(BECOME)
            g_ = np.exp(-(s._dist / (0.035 * W + 0.12 * W * (1 - f))) ** 2) * 0.85 * f
            can = can + (1 - can) * g_[..., None] * np.array([0.97, 0.9, 1.0], np.float32)
        g = s.grade(t)
        if g is not None:
            can = g(can)
        z = 1.0 + 0.035 * L.smooth((t - T10) / (T13 - T10))
        Mz = cv2.getRotationMatrix2D((W * 0.5, H * 0.45), 0, z)
        can = cv2.warpAffine(can, Mz, (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
        return np.clip(can, 0, 1)


def render_shot(sc, name):
    pid, t0, t1 = SHOTS[name]
    if LAST != 'I':
        pid += '_wo'
    out = f'{PL}/{pid}'; fd = f'{out}/frames'; os.makedirs(fd, exist_ok=True)
    n = int(math.ceil((t1 - t0) * 24)) + 2
    t_ = time.time()
    for i in range(n):
        L.save(f'{fd}/f_{i + 1:04d}.jpg', sc.frame(t0 + i / 24), q=93)
    shutil.copy(f'{fd}/f_0001.jpg', f'{out}/still.jpg')
    json.dump(dict(fps=24, n=n, turn_t=None, w=W, h=H, t0_song=t0, src='fable/take2/tools/glyphart/v11/merge11.py (night_jade + patch_settle '
                   'frames 82-121, her words into one)', glyph=dict(v11='A4 merge in corpus words', shot=name, t0=t0, t1=t1, last=LAST)),
              open(f'{out}/meta.json', 'w'))
    open(f'{out}/REAL', 'w').write('glyph v11 A4 merge render (derived from night_jade, patch_settle)\n')
    print(f'{pid}: {n} frames, {time.time() - t_:.0f} s')


if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('--test', default=''); ap.add_argument('--out', default=''); ap.add_argument('--tests-b', default='')
    ap.add_argument('--render', action='store_true'); ap.add_argument('--only', default='')
    a = ap.parse_args()
    sc = Scene11(7)
    if a.test:
        os.makedirs(a.out, exist_ok=True)
        for t in [float(x) for x in a.test.split(',')]:
            L.save(f'{a.out}/m_{t:.3f}{"" if LAST == "I" else "_wo"}.jpg', sc.frame(t))
    if a.tests_b:
        MB.tests_b(sc, a.tests_b, ts=(224, 225, 226.5, 228.5, 230, 231.0, 231.3, 233.5))
    if a.render:
        for name in (a.only.split(',') if a.only else SHOTS):
            render_shot(sc, name)
