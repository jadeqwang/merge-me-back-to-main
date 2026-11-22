#!/usr/bin/env python3
"""A1, film v11 (vb10 vio_still, 202.691-207.819): violet comes apart into the LETTERS OF THIS SONG (v11 direction A1).
v11 changes against v10 (atom_letters.py, otherwise unchanged: motion, release timing, the circle last, the ~50 large letters):
  - text = merge.txt only, in song order, Latin only, no script swap; whole words laid in reading order along short row pieces,
    and the pieces are filled in RELEASE order (mean release time of the piece), so the first lines leave first;
  - the large letters keep their own letter (no swap), so words stay words while they grow;
  - the small letters are larger (CFG size 34 -> 46 px at 1920: 15 px at 640).
v10 description follows.

A pre-rendered plate (new id vio_still_letters10) that replaces film.js atomize() for this shot. Same data and the same rules as
atomize() (tools/atomize.py -> kit/vio_still/atom: track.json, release.png; clean plate vio_empty = plate frame 121), so the timing
and the order are as before: release u runs 0..1 from shot start + 0.1 to shot end - 0.45; outline first, inward with a ragged front,
the pale-blue circle last; the rim is empty at the end. What changes: her points become letters. She is laid out as rows of the
handoff text (HANDOFF.md / Read this first. / Where things stand. / What it cost to learn. / What comes next., repeated; a third of
the letters swapped for glyphs of other scripts); as the front passes, the plate opens to the clean rim under each letter and the
letter is left standing in her own colour (so for a moment she IS the text), then lifts out and up, turning to violet or pale light;
one in eight rises into the sky and stays as a faint letter-star; the circle's letters (pale blue) gather into a short line of
characters that drifts east and leaves the frame at the cut (where cb01's streak of characters picks up).
Frames are in plate coordinates at 1920x1080 (plate 1280x720 x 1.5), no push: the shot's own push/zoom stays in the compositor.
  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/v10/atom_letters.py --test 203.5,205.0,206.5,207.6 OUTDIR
  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/v10/atom_letters.py --render
"""
import os, sys, math, json, time, argparse, shutil
import numpy as np, cv2
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'v10'))
import gl10 as L
import gl11 as M

ROOT = L.ROOT
PL = os.path.join(ROOT, 'work_fable/take2/plates'); AT = os.path.join(ROOT, 'work_fable/take2/kit/vio_still/atom')
W, H, SC = 1920, 1080, 1.5
T0, T1 = 202.691, 207.819
LEAD, TAIL, SOFT = 0.1, 0.45, 0.06
OUT_ID = os.environ.get('A1_ID', 'vio_still_letters11')
CFG = dict(size=float(os.environ.get('A1_SIZE', 46)), seg=9, hold=0.3, big=0.16, big_s=(62, 92), big_circ=0.4, adv=0.58, row=0.86, swap=0.33, star=0.12)


def ease_out(u):
    u = np.clip(u, 0, 1); return 1 - (1 - u) ** 2


class Atom:
    def __init__(s, seed=5):
        rng = s.rng = np.random.default_rng(seed)
        s.G = M.G11()
        tr = json.load(open(f'{AT}/track.json')); s.A = {int(k): np.array(v, np.float32).reshape(2, 3) for k, v in tr['A'].items()}
        rel = cv2.imread(f'{AT}/release.png', cv2.IMREAD_UNCHANGED)   # BGRA
        s.tau = np.where(rel[..., 3] > 0, np.maximum(0, rel[..., 2].astype(np.float32) - 1) / 254, -1)   # R channel; -1 = not her
        s.rel_a = rel[..., 3].astype(np.float32) / 255
        s.her = (rel[..., 3] > 0) & (rel[..., 2] > 1)
        s.F1 = cv2.imread(f'{PL}/vio_still/frames/f_0001.jpg')[..., ::-1].astype(np.float32) / 255
        s.empty = cv2.imread(f'{PL}/vio_empty/still.jpg')[..., ::-1].astype(np.float32) / 255
        s.n = json.load(open(f'{PL}/vio_still/meta.json'))['n']
        # v11: Merge's words over her, whole words along row pieces; pieces filled in release order (first lines leave first)
        sz = CFG['size'] / SC; rh = CFG['row'] * sz
        ys, xs = np.nonzero(s.her)
        items = []
        for li, line in enumerate(M.corpus(M.MERGE)):
            for w, han in M.words_in(line):
                f = M.TIERS[0 if rng.random() < 0.45 else 1][int(rng.integers(4))]
                items.append([(s.G.em_char(c, f), c) for c in w])
        her_er = cv2.erode(s.her.astype(np.uint8), np.ones((3, 3), np.uint8)) > 0
        segs = M.segments(her_er, sz, CFG['row'], CFG['seg'] * sz * CFG['adv'], rng)
        segs.sort(key=lambda g: float(np.mean([max(0, s.tau[int(g[0]), int(x)]) for x in np.linspace(g[1], g[2], 5)])))
        placed, nw = M.fill(segs, items, sz, s.G, adv_k=CFG['adv'] / 0.58 * 0.95, gap=0.42)
        print(f'A1: {len(placed)} letters, {nw} words ({nw / max(1, len(items)):.2f} x the song)')
        s.Ls = []
        for (si, wi, ci, x, y) in placed:
            xi, yi = int(np.clip(x, 0, s.her.shape[1] - 1)), int(np.clip(y, 0, s.her.shape[0] - 1))
            if not s.her[yi, xi]:
                continue
            cell = s.F1[max(0, yi - 4):yi + 4, max(0, xi - 3):xi + 3]
            col = cell.reshape(-1, 3).mean(0)
            s.Ls.append(dict(x=float(x), y=float(y), tau=float(s.tau[yi, xi]), col=col, gid=items[wi % len(items)][ci][0],
                             sd=float(rng.random()), r=rng.random(4), big=0.0))
        s.cx, s.cy = xs.mean(), ys.mean()
        # rev b: a visible share grow large as they lift (60-90 px at 1920): legible as characters at phone size; Latin letters
        # of the note for most of them, and a share of the circle's last ones
        for m in s.Ls:
            circ_ = m['tau'] >= 0.82
            if (rng.random() < (CFG['big_circ'] if circ_ else CFG['big'])) and m['sd'] >= CFG['star']:
                m['big'] = float(rng.uniform(*CFG['big_s']))   # v11: keeps its own letter (words stay words)
        circ = [m for m in s.Ls if m['tau'] >= 0.82]
        print('big letters', sum(1 for m in s.Ls if m['big']), 'of which circle', sum(1 for m in circ if m['big']))
        s.circ_c = (np.mean([m['x'] for m in circ]), np.mean([m['y'] for m in circ])) if circ else (s.cx, s.cy)
        print(f'letters {len(s.Ls)}, circle letters {len(circ)}')

    def Mk(s, k):   # frame-1 plate px -> output px for plate frame k
        A = s.A.get(k, s.A[1]); return A * SC

    def frame(s, t):
        k = int(np.clip(round((t - T0) * 24) + 1, 1, s.n))
        base = cv2.resize(cv2.imread(f'{PL}/vio_still/frames/f_{k:04d}.jpg')[..., ::-1].astype(np.float32) / 255, (W, H), interpolation=cv2.INTER_CUBIC)
        M = s.Mk(k)
        ta, tb = T0 + LEAD, T1 - TAIL; u = (t - ta) / (tb - ta); tOf = lambda tau: ta + tau * (tb - ta)
        # 1. the mask: released fraction per pixel (as atomize())
        tw = cv2.warpAffine(s.tau, M, (W, H), flags=cv2.INTER_NEAREST, borderValue=-1)
        aw = cv2.warpAffine(s.rel_a, M, (W, H), flags=cv2.INTER_LINEAR)
        r = np.clip((u - np.maximum(tw, 0)) / SOFT + 0.5, 0, 1); r = r * r * (3 - 2 * r)
        mk = np.where(tw >= 0, r, 0) * aw
        mk = cv2.GaussianBlur(mk.astype(np.float32), (0, 0), 1.2)
        # 2. the clean rim through it: vio_empty is plate frame 121
        Ae = np.vstack([s.A[121], [0, 0, 1]]); Ae = (np.vstack([M, [0, 0, 1]]) @ np.linalg.inv(Ae))[:2] * 1.0
        Ae = Ae.astype(np.float32) @ np.diag([1280 / s.empty.shape[1], 720 / s.empty.shape[0], 1]).astype(np.float32)
        emp = cv2.warpAffine(s.empty, Ae, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT)
        can = base * (1 - mk[..., None]) + emp * mk[..., None]
        # 3. the letters
        circ_te = tOf(0.98) + 0.2
        for m in s.Ls:
            tb0 = tOf(m['tau']); age = t - tb0
            if age < -0.1:
                continue
            circ = m['tau'] >= 0.82
            r0, r1, r2, r3 = m['r']
            lum = float(L.lum(m['col'][None])[0]); col = m['col']
            vio = (col[2] > col[1] + 0.1 and col[0] > col[1]) or lum < 0.35
            light = L.hexrgb('#B9A6FF' if circ else ('#9B6BFF' if vio else '#F1ECFF'))
            if circ:
                light = L.hexrgb('#A9C8FF')
            born = np.clip((age + 0.1) / 0.2, 0, 1)
            star = m['sd'] < CFG['star'] and not circ
            dx, dy = m['x'] - s.cx, m['y'] - s.cy; l = math.hypot(dx, dy) + 1e-6; dx /= l; dy /= l
            if circ:   # the circle's letters: lift a little, then gather into a line that drifts east and out at the cut
                lift = 60 * ease_out(age / 1.0)
                gx = s.circ_c[0] + 34 + (m['sd'] - 0.5) * 120; gy = s.circ_c[1] - 120 + (r1 - 0.5) * 16
                g = ease_out((t - circ_te + 0.5) / 0.8) if t > circ_te - 0.5 else 0
                wx = m['x'] + (gx - m['x']) * g; wy = m['y'] - lift * (1 - g) + (gy - m['y']) * g
                if t > circ_te:
                    e = ((t - circ_te) / (T1 - circ_te)) ** 2
                    wx += e * (1500 + 300 * m['sd']); wy -= e * 90
                X, Y = M @ np.array([wx, wy, 1.0])
                mix = ease_out(age / 0.5); c = col * (1 - mix) + light * mix
                a = born
                sz = CFG['size'] * (1.0 + 0.15 * mix) if not m['big'] else CFG['size'] + (m['big'] - CFG['size']) * mix
                x0, y0, d = L.sdf_item(s.G, [(m['gid'], X, Y, sz, 0.0)], margin=22 + int(m['big'] * 0.3))
                L.ink(can, x0, y0, d, c, a=a, glow=0.55 * mix, gcol=light, gr=6)
                continue
            ag = max(0.0, age - CFG['hold'] * (0.6 + 0.8 * r2))   # she stands as the text for a moment
            dist = (30 + 150 * r1) * ease_out(ag / 1.8)
            sky = min(m['y'] - 60 - 120 * r1, (0.08 + 0.42 * r2) * 720)
            rise = (m['y'] - sky) if star else 40 + 110 * r1
            up = rise * ease_out(ag / (2.6 if star else 2.2))
            wx = m['x'] + dx * dist * 0.6 + 0.25 * up + (r3 - 0.5) * 30 * min(1, ag); wy = m['y'] + dy * dist * 0.6 - up
            X, Y = M @ np.array([wx, wy, 1.0])
            mix = ease_out((ag - 0.05) / (0.3 if lum < 0.35 else 0.5))
            c = col * (1 - mix) + light * mix
            if lum < 0.35:    # a dark letter on the dark sky reads only once it is light: lift it at birth
                c = c * 0.6 + light * 0.4
            fade = 1.0 if star else 1 - np.clip((ag - 0.7) / (0.8 + 0.8 * r0), 0, 1)
            a = born * fade * (0.55 + 0.45 * (1 - mix) + (0.3 if star else 0))
            if a <= 0.02:
                continue
            sz = CFG['size'] * ((0.6 if star else 0.85) + (1 - (0.6 if star else 0.85)) * (1 - mix))
            if m['big']:      # grows as it lifts, stays upright, fades slower
                sz = CFG['size'] + (m['big'] - CFG['size']) * mix
                a = born * (1 - np.clip((ag - 1.1) / (1.0 + 0.6 * r0), 0, 1))
                if a <= 0.02:
                    continue
            tw_ = 0.6 + 0.4 * math.sin(math.floor(t * 12) * (0.6 + r0) + m['sd'] * 90) if star and ag > 1.2 else 1.0
            x0, y0, d = L.sdf_item(s.G, [(m['gid'], X, Y, sz, (r3 - 0.5) * (0.15 if m['big'] else 0.6) * mix)], margin=(16 + int(m['big'] * 0.3)) if mix > 0 else 4)
            L.ink(can, x0, y0, d, c, a=min(1.0, a * tw_), glow=0.4 * mix * tw_, gcol=light, gr=5)
        return np.clip(can, 0, 1)

    def render(s):
        out = f'{PL}/{OUT_ID}'; fd = f'{out}/frames'; os.makedirs(fd, exist_ok=True)
        n = int(math.ceil((T1 - T0) * 24)) + 1
        t_ = time.time()
        for i in range(n):
            L.save(f'{fd}/f_{i + 1:04d}.jpg', s.frame(T0 + i / 24), q=93)
        shutil.copy(f'{fd}/f_0001.jpg', f'{out}/still.jpg')
        pm = json.load(open(f'{PL}/vio_still/meta.json'))
        json.dump(dict(pm, n=n, w=W, h=H, t0_song=T0, src='vio_still frames + vio_empty, letters atomize (fable/take2/tools/glyphart/v11/atom_letters11.py)',
                       glyph=dict(v11='A1 Merge letters atomize', size=CFG['size'], lead=LEAD, tail=TAIL)), open(f'{out}/meta.json', 'w'))
        if os.path.exists(f'{PL}/vio_still/REAL'):
            shutil.copy(f'{PL}/vio_still/REAL', f'{out}/REAL')
        print(f'{OUT_ID}: {n} frames, {time.time() - t_:.0f} s')


if __name__ == '__main__':
    ap = argparse.ArgumentParser(); ap.add_argument('--test', default=''); ap.add_argument('out', nargs='?', default='')
    ap.add_argument('--render', action='store_true'); a = ap.parse_args()
    A = Atom()
    if a.test:
        os.makedirs(a.out, exist_ok=True)
        for t in [float(x) for x in a.test.split(',')]:
            L.save(f'{a.out}/a_{t:.3f}.jpg', A.frame(t))
    if a.render:
        A.render()
