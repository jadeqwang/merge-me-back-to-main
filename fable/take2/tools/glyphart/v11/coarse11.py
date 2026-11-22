#!/usr/bin/env python3
"""A3, film v11 (coarse11.py; v10 coarse.py otherwise unchanged): what pours in is MERGE'S OWN LINES, set as whole words in short
runs (rows of 3-7 letters along the figure), filled in front order so the song's first lines arrive first; violet first, then her
own colours; Latin only, one font and one size per word. v10 description follows.
A3, film v10: she is written in COARSE letters (the largest of the film) for two bars: cb08 c2_hands, cb09 catch.

The letters of violet's note pour out of the opened page-light into her palms and run up her: hands, arms, jacket, hair. The face
stays clean. The first letters to arrive are violet (the note); the later ones take her own colours (she is being written).
Each letter is placed on the figure (BiRefNet matte of the plate, v9/plate_mattes.sh) in plate frame `ref`, carried frame to frame by
optical flow (DIS on the plate), and appears when the front reaches it: front distance from the source point grows from r0 to the
far end of the figure between song times f0 and f1 (letters near the source fly in from it, a pour). Under the letters the figure
dims to an underpainting so the letters carry the picture. No boil: letters keep their identity (no shimmer).
  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/v10/coarse.py SHOT [--test t1,t2 OUTDIR] [--render]
SHOT: c2_hands | catch (settings in SHOTS below). Output plate: plates/<shot>_glyph10/ (24 fps, all 121 frames; frames outside the
shot's range are the plate's own, painted with the state at the nearest end).
"""
import os, sys, math, json, time, argparse, shutil
import numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.dirname(HERE)); sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'v10'))
import gl10 as L  # noqa: E402
import gl11 as M  # noqa: E402
from v9.skin import skin_mask  # noqa: E402

ROOT = L.ROOT
PL = os.path.join(ROOT, 'work_fable/take2/plates')
PM = os.path.join(ROOT, 'work_fable/take2/dev/v9_glyph/pmatte')
W, H = 1920, 1080
# t0 = song time of plate frame 1 as the shot plays it (clip0 0, speed 1). src = source point (frame fractions, frame `ref`);
# f0..f1 = the front's run; r0 = radius already written at f0 (px); pour = letters within this radius fly in from src
SHOTS = {
    'c2_hands': dict(plate='c2_hands', base='c2_hands', t0=219.737, t1=221.436, ref=20, src=(0.5, 0.52), f0=220.45, f1=221.44, r0=0, from_skin=True,
                     pour=120, s=(96, 132), vio_frac=0.55, face=False),
    'catch': dict(plate='catch', base='catch_glyph11f', t0=221.436, t1=223.135, ref=10, src=(0.5, 0.56), f0=221.436, f1=222.45, r0=170,
                  pour=0, s=(90, 124), vio_frac=0.35, face=True, word0=53),
}


def rd(p, alpha=False):
    im = cv2.imread(p, cv2.IMREAD_UNCHANGED)
    if alpha:
        return cv2.resize(im[..., 3].astype(np.float32) / 255, (W, H))
    return cv2.resize(im[..., ::-1].astype(np.float32) / 255, (W, H), interpolation=cv2.INTER_CUBIC)


class Coarse:
    def __init__(s, shot, seed=11):
        s.o = o = SHOTS[shot]; s.shot = shot
        s.rng = rng = np.random.default_rng(seed)
        s.G = G = M.G11()
        n = json.load(open(f'{PL}/{o["plate"]}/meta.json'))['n']; s.n = n
        s.k1 = n
        bdir = os.environ.get('A3_BASE') or f'{PL}/{o["base"]}/frames'   # v11: base of catch = catch_glyph11f (corpus atlas)
        if not os.path.exists(f'{bdir}/f_{n:04d}.jpg'):
            print('base not ready, using the plate'); bdir = f'{PL}/{o["plate"]}/frames'
        s.bdir = bdir
        ref = o['ref']
        F = rd(f'{PL}/{o["plate"]}/frames/f_{ref:04d}.jpg')
        mat = rd(f'{PM}/{o["plate"]}/rgba/f_{ref:04d}.png', alpha=True)
        allow = cv2.morphologyEx((mat > 0.8).astype(np.uint8), cv2.MORPH_OPEN, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (31, 31))) > 0
        if o['face']:
            fb = bbox = np.nonzero(allow.any(1))[0]
            yy = np.arange(H)[:, None]
            sk = skin_mask(F) * (yy < 0.45 * H)
            face = cv2.dilate((sk > 0.3).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (61, 61)))
            s.face = cv2.GaussianBlur(face.astype(np.float32), (0, 0), 12)
            allow &= s.face < 0.05
        else:
            s.face = np.zeros((H, W), np.float32)
        # v11: Merge's words in short runs along rows over the allowed figure; runs filled in front order (first lines first)
        sz = float(np.mean(o['s']))
        allow_e = cv2.erode(allow.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15))) > 0
        segs = M.segments(allow_e, sz, o.get('row', 0.9), o.get('seg', 6) * 0.6 * sz, rng, jit=0.08)
        sx, sy = o['src'][0] * W, o['src'][1] * H
        if o.get('from_skin'):    # the front starts on her palms (skin), not at one point: hands first, then up the arms
            sk = (skin_mask(F) > 0.4).astype(np.uint8)
            dt = cv2.distanceTransform(1 - sk, cv2.DIST_L2, 5)
            dfun = lambda x, y: dt[int(np.clip(y, 0, H - 1)), int(np.clip(x, 0, W - 1))] + 0.15 * math.hypot(x - sx, y - sy)
        else:
            dfun = lambda x, y: math.hypot(x - sx, y - sy)
        # front order in bands about two rows deep; inside a band, reading order (so a line's words sit side by side)
        band = o.get('band', 2.2) * sz
        segs.sort(key=lambda g: (int(dfun((g[1] + g[2]) / 2, g[0]) // band), g[0], g[1]))
        items = []; wfont = []
        for line in M.corpus(M.MERGE):
            for w, han in M.words_in(line):
                f = M.TIERS[0][int(rng.integers(4))]
                items.append([(G.em_char(c, f), c) for c in w])
        w0 = o.get('word0', 0)            # v11: the catch continues the song where the hands left off
        items = items[w0:] + items[:w0]
        placed, nw = M.fill(segs, items, sz, G, adv_k=1.0, gap=0.4)
        print(f'{shot}: {len(placed)} letters, {nw} words ({nw / len(items):.2f} x the song)')
        taken = np.array([[p[3], p[4]] for p in placed], np.float32)
        dist = np.array([dfun(x, y) for x, y in taken])
        dmax = dist.max()
        wsize = {}; wth = {}
        s.L = []
        nseg_v = int(o['vio_frac'] * len(segs))
        for (si, wi, ci, x, y), d in zip(placed, dist):
            if wi not in wsize:
                wsize[wi] = sz * rng.uniform(0.93, 1.07); wth[wi] = float(rng.normal(0, 0.05))
            ta = o['f0'] + (o['f1'] - o['f0']) * max(0.0, (d - o['r0'])) / max(1.0, dmax - o['r0']) + rng.normal(0, 0.02)
            if d <= o['r0']:
                ta = o['t0'] - 1
            vio = si < nseg_v
            c = F[int(np.clip(y, 0, H - 1)), int(np.clip(x, 0, W - 1))]
            col = L.hexrgb('#B08CFF') * (0.92 + 0.12 * rng.random()) if vio else np.clip(1 - (1 - c) * 0.72, 0, 1)
            s.L.append(dict(gid=items[wi % len(items)][ci][0], x=float(x), y=float(y), s=wsize[wi], th=wth[wi],
                            col=np.clip(col, 0, 1), ta=float(ta), pour=d < o['pour'], d=float(d)))
        s.pos = s.track(ref)
        print(f'{shot}: {len(s.L)} letters, front {o["f0"]}-{o["f1"]}')

    def track(s, ref):
        """letter positions in every plate frame: DIS flow from the ref frame forward and backward (1280x720 plate px)"""
        n = s.n; P = np.array([[m['x'], m['y']] for m in s.L], np.float32)
        pos = {ref: P.copy()}
        dis = cv2.DISOpticalFlow_create(cv2.DISOPTICAL_FLOW_PRESET_MEDIUM)
        g = lambda k: cv2.resize(cv2.imread(f'{PL}/{s.o["plate"]}/frames/f_{k:04d}.jpg', cv2.IMREAD_GRAYSCALE), (960, 540))
        for step in (1, -1):
            cur = P.copy(); prev = g(ref); k = ref
            while 1 <= k + step <= n:
                nx = g(k + step); f = dis.calc(prev, nx, None)
                ix = np.clip((cur[:, 0] / 2).astype(int), 0, 959); iy = np.clip((cur[:, 1] / 2).astype(int), 0, 539)
                # smooth the flow (letters move with the surface, not with noise)
                fs = cv2.GaussianBlur(f, (0, 0), 6)
                cur = cur + fs[iy, ix] * 2
                k += step; pos[k] = cur.copy(); prev = nx
        return pos

    def frame(s, k, t):
        o = s.o
        base = rd(f'{s.bdir}/f_{k:04d}.jpg')
        P = s.pos[k]
        # the written region: the letters that have arrived, as soft discs; there the figure dims to an underpainting
        wm = np.zeros((H // 4, W // 4), np.float32)
        live = []
        for i, m in enumerate(s.L):
            a = (t - m['ta']) / 0.18
            if a <= 0:
                continue
            live.append((i, min(1.0, a)))
            cv2.circle(wm, (int(P[i, 0] / 4), int(P[i, 1] / 4)), int(m['s'] * 0.55 / 4), float(min(1.0, a)), -1)
        wm = cv2.resize(cv2.GaussianBlur(wm, (0, 0), 6), (W, H)) * (1 - s.face)
        under = cv2.GaussianBlur(base, (0, 0), 5) * 0.4 + 0.02
        can = (base * (1 - wm[..., None] * o.get('dim', 0.7)) + under * wm[..., None] * o.get('dim', 0.7)).astype(np.float32)
        sx, sy = o['src'][0] * W, o['src'][1] * H
        for i, a in live:
            m = s.L[i]; x, y = P[i]
            sz = m['s'] * (1 + 0.35 * (1 - a))
            glow = 0.7 * (1 - a)
            if m['pour'] and a < 1:   # poured: flies from the page into her palm
                e = 1 - (1 - a) ** 2
                x, y = sx + (x - sx) * e, sy + (y - sy) * e - math.sin(a * math.pi) * 40
            x0, y0, d = L.sdf_item(s.G, [(m['gid'], x, y, sz, m['th'])], margin=28 if glow > 0 else 6)
            L.ink(can, x0, y0, d, m['col'], a=min(1, a * 1.5), key=0.6, glow=glow, gcol=L.hexrgb('#C9B2FF'), gr=12)
        return np.clip(can, 0, 1)

    def render(s, out_id):
        o = s.o; out = f'{PL}/{out_id}'; fd = f'{out}/frames'; os.makedirs(fd, exist_ok=True)
        t_ = time.time()
        for k in range(1, s.n + 1):
            t = o['t0'] + (k - 1) / 24
            L.save(f'{fd}/f_{k:04d}.jpg', s.frame(k, t), q=93)
        shutil.copy(f'{fd}/f_0001.jpg', f'{out}/still.jpg')
        pm = json.load(open(f'{PL}/{o["plate"]}/meta.json'))
        m = dict(pm, w=W, h=H, src=f'work_fable/take2/plates/{o["base"]}/frames + coarse Merge words (fable/take2/tools/glyphart/v11/coarse11.py {s.shot})',
                 glyph=dict(v11='A3 coarse Merge words', size=o['s'], t0_song=o['t0'], front=[o['f0'], o['f1']]))
        json.dump(m, open(f'{out}/meta.json', 'w'))
        if os.path.exists(f'{PL}/{o["plate"]}/REAL'):
            shutil.copy(f'{PL}/{o["plate"]}/REAL', f'{out}/REAL')
        print(f'{out_id}: {s.n} frames, {time.time() - t_:.0f} s')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('shot'); ap.add_argument('--test', default=''); ap.add_argument('--out', default='')
    ap.add_argument('--render', action='store_true'); ap.add_argument('--id', default='')
    a = ap.parse_args()
    c = Coarse(a.shot)
    if a.test:
        os.makedirs(a.out, exist_ok=True)
        for t in [float(x) for x in a.test.split(',')]:
            k = int(np.clip(round((t - c.o['t0']) * 24) + 1, 1, c.n))
            L.save(f'{a.out}/{a.shot}_{t:.3f}.jpg', c.frame(k, t))
    if a.render:
        c.render(a.id or {'catch': 'catch_letters11', 'c2_hands': 'c2_hands_letters11'}[a.shot])


if __name__ == '__main__':
    main()
