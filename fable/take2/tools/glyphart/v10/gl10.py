"""Glyph art v10 library: letters as signed-distance sprites, so letters can be drawn, thinned, and FUSED (two characters sliding
together, their union flowing into one new character) instead of cross-faded.

Sprites come from the v8 atlas (work_fable/take2/dev/v8_glyph/atlas.npz: 2664 (char, font) sprites, 128 px, 19 scripts). Each used
sprite gets a signed distance field at 64 px (negative inside the ink), computed lazily and cached.

  sdf_item(comps, m=0, target=None, thin=0) -> (x0, y0, d): the distance field (output px) of one drawn mark in its box:
      comps = [(gid, x, y, s, th), ...] are united (min of distances); with target=(gid, x, y, s, th) and m in 0..1 the union
      morphs into the target (d = (1-m) min(d_i) + m d_target): a shape flow, not a cross-fade.
  ink(canvas, x0, y0, d, col, a=1, key=0.0, glow=0.0, gcol=None): composite one mark (anti-aliased edge at d=0), with an optional
      dark keyline (a ring outside the ink, so a pale letter reads on a pale jacket) and an optional soft glow (the fusion flash).
Coordinates: output pixels; s = the glyph's em box side (as paint.py: sprite side P maps to s px), th = rotation (rad).
"""
import os, sys, math
import numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import paint as P  # noqa: E402

ROOT = P.ROOT
HANDOFF = 'HANDOFF.md / Read this first. / Where things stand. / What it cost to learn. / What comes next.'
EM0 = 100000   # gids >= EM0: em-box re-renders (Glyphs.em)
FAR = 40.0       # distance (sprite px at 64) outside every sprite box


class Glyphs:
    def __init__(self, path=P.ATLAS):
        z = np.load(path)
        self.scripts = [str(s) for s in z['scripts']]
        self.char = z['char']; self.script = np.array(self.scripts)[z['script']]; self.font = z['font']
        self.cov = z['cov']; self.elong = z['elong']; self.desc = z['desc'].astype(np.float32)
        self.spr = z['sprites']                       # (N,128,128) uint8
        self.N = len(self.char)
        fills = set(P.FILLS)
        self.ok = np.array([(c not in fills) and (0.04 < cv < 0.5) for c, cv in zip(self.char, self.cov)])
        fb = np.array([os.path.basename(str(f)) for f in self.font])
        letters = np.isin(self.script, ['latin', 'greek', 'cyrillic']) & np.array([str(c).isalpha() for c in self.char])
        other = self.ok & np.isin(self.script, ['georgian', 'armenian', 'cherokee', 'ethiopic', 'devanagari', 'hebrew', 'arabic', 'tamil', 'thai', 'kana', 'hangul'])
        # v10 fusion tiers: what two letters become, by generation: heavy type -> book type -> a fine pen (the line)
        bold = ['DejaVuSans-Bold.ttf', 'NimbusMonoPS-Bold.otf', 'URWGothic-Demi.otf', 'C059-BdIta.otf', 'FreeSerifBoldItalic.ttf']
        self.tiers = [np.nonzero(letters & np.isin(fb, bold))[0],
                      np.nonzero((letters & np.isin(fb, ['NotoSerif-Regular.ttf', 'FreeSerifItalic.ttf', 'C059-Italic.otf'])) | other)[0],
                      np.nonzero(letters & np.isin(fb, ['Z003-MediumItalic.otf', 'FreeSerifItalic.ttf', 'C059-Italic.otf']))[0]]
        self._sdf = {}; self._em = {}; self.ems = []

    def em(self, gid):
        """v10: atlas glyph gid re-rendered from its own font in a fixed em box (128 px, font size 96): letters keep their own
        widths, x-height and baseline (Latin, Greek, Cyrillic on a common baseline; other scripts centred), so a row reads as text
        (the atlas sprites are each cropped to their ink and rotated: fine for paint strokes, not for reading). Returns an em gid
        (>= EM0) whose sprite is in self.ems."""
        key = int(gid)
        if key in self._em:
            return self._em[key]
        from PIL import Image, ImageDraw, ImageFont
        fp = self._fontpath(str(self.font[gid]), str(self.script[gid]))
        im = Image.new('L', (128, 128), 0); dr = ImageDraw.Draw(im)
        f = ImageFont.truetype(fp, 110)
        c = str(self.char[gid])
        if self.script[gid] in ('latin', 'greek', 'cyrillic'):
            dr.text((64, 103), c, font=f, fill=255, anchor='ms')
        else:
            bb = dr.textbbox((0, 0), c, font=f)
            dr.text((64 - (bb[0] + bb[2]) / 2, 64 - (bb[1] + bb[3]) / 2), c, font=f, fill=255)
        a = np.asarray(im)
        if a.max() < 128:
            self._em[key] = key; return key
        nid = EM0 + len(self.ems); self.ems.append(a); self._em[key] = nid
        return nid

    def _fontpath(self, base, script):
        if not hasattr(self, '_fp'):
            import atlas as A
            self._fp = {}
            for lst in A.FONTS.values():
                for f in lst:
                    self._fp.setdefault(os.path.basename(f), A.F(f) if not f.startswith('/') else f)
        return self._fp[base]

    def sprite(self, gid):
        return self.ems[gid - EM0] if gid >= EM0 else self.spr[gid]

    def sdf(self, gid):
        d = self._sdf.get(gid)
        if d is None:
            a = cv2.resize(self.sprite(gid).astype(np.float32) / 255, (64, 64), interpolation=cv2.INTER_AREA)
            ins = (a > 0.5).astype(np.uint8)
            do = cv2.distanceTransform(1 - ins, cv2.DIST_L2, 5)
            di = cv2.distanceTransform(ins, cv2.DIST_L2, 5)
            d = (do - di + (0.5 - a) * 0.9).astype(np.float32)   # sub-pixel: the coverage nudges the edge
            # pad so warping outside the sprite is "far outside"
            d = cv2.copyMakeBorder(d, 8, 8, 8, 8, cv2.BORDER_CONSTANT, value=FAR)
            self._sdf[gid] = d
        return d

    # ---- choosing characters
    def of_char(self, c, rng, latin_only=True):
        """a sprite of character c (any font that has it), or None"""
        m = np.nonzero((self.char == c) & ((self.script == 'latin') | (not latin_only)))[0]
        if not len(m):
            m = np.nonzero(self.char == c)[0]
        return int(rng.choice(m)) if len(m) else None

    def any_script(self, rng, n=1, exclude=('box', 'stroke', 'math')):
        m = np.nonzero(self.ok & ~np.isin(self.script, list(exclude)))[0]
        # equalise scripts: pick a script first, then a glyph
        sc = sorted(set(self.script[m]))
        out = []
        for _ in range(n):
            s = sc[rng.integers(len(sc))]
            mm = m[self.script[m] == s]
            out.append(int(rng.choice(mm)))
        return out

    def text_glyphs(self, text, rng, swap=0.35):
        """the handoff text, character by character, in violet's all-scripts look: each letter in one of the atlas's Latin fonts;
        a fraction `swap` of letters replaced by a glyph from another script (any of 16), spaces and slashes dropped"""
        out = []
        for c in text:
            if c in ' /.':
                continue
            if rng.random() < swap:
                out.append((self.em(self.any_script(rng)[0]), c))
            else:
                g = self.of_char(c, rng)
                out.append((self.em(g if g is not None else self.any_script(rng)[0]), c))
        return out

    def tier_glyph(self, gen, rng):
        """a letter for a fused mark of generation gen (1, 2, ...): finer type each generation, em-rendered"""
        T = self.tiers[min(len(self.tiers) - 1, max(0, gen - 1))]
        for _ in range(20):
            g = self.em(int(rng.choice(T)))
            if g >= EM0 and (self.sprite(g) > 128).mean() > 0.05:
                return g
        return g

    def fuse_target(self, comps, rng, k=6, pool=None):
        """the character the union of comps flows into: the atlas glyph whose 16x16 descriptor best matches the union's footprint
        (drawn in a box round the union), one of the best k at random"""
        x0, y0, d = sdf_item(self, comps)
        a = np.clip(0.5 - d, 0, 1)
        hh, ww = a.shape
        sq = max(hh, ww)
        pad = np.zeros((sq, sq), np.float32); pad[(sq - hh) // 2:(sq - hh) // 2 + hh, (sq - ww) // 2:(sq - ww) // 2 + ww] = a
        v = cv2.resize(pad, (16, 16), interpolation=cv2.INTER_AREA).reshape(-1)
        v = v / (np.linalg.norm(v) + 1e-6)
        if pool is None:
            if not hasattr(self, '_pool'):   # letters of every script; no boxes, strokes, maths signs (they read as crosses)
                self._pool = np.nonzero(self.ok & ~np.isin(self.script, ['box', 'stroke', 'math']) & (self.cov > 0.12))[0]
            pool = self._pool
        m = pool
        D = self.desc[m]; D = D / (np.linalg.norm(D, axis=1, keepdims=True) + 1e-6)
        sc = D @ v
        best = m[np.argsort(-sc)[:k]]
        return int(rng.choice(best))


def _warp_sdf(G, gid, x, y, s, th, bx0, by0, bw, bh):
    d = G.sdf(gid)                    # 80x80 (64 + 2*8 pad), sprite px
    k = 64.0 / s
    c, sn = math.cos(th), math.sin(th)
    A = np.array([[k * c, k * sn, 0], [-k * sn, k * c, 0]], np.float32)
    dx, dy = bx0 + 0.5 - x, by0 + 0.5 - y
    A[0, 2] = 40 + k * (c * dx + sn * dy) - 0.5
    A[1, 2] = 40 + k * (-sn * dx + c * dy) - 0.5
    w = cv2.warpAffine(d, A, (bw, bh), flags=cv2.INTER_LINEAR | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_CONSTANT, borderValue=FAR)
    return w / k                      # output px


def sdf_item(G, comps, m=0.0, target=None, thin=0.0, margin=6):
    all_ = list(comps) + ([target] if target is not None else [])
    r = max(c[3] for c in all_) * 0.75 + margin
    xs = [c[1] for c in all_]; ys = [c[2] for c in all_]
    bx0, by0 = int(math.floor(min(xs) - r)), int(math.floor(min(ys) - r))
    bx1, by1 = int(math.ceil(max(xs) + r)), int(math.ceil(max(ys) + r))
    bw, bh = bx1 - bx0, by1 - by0
    d = None
    for (gid, x, y, s, th) in comps:
        w = _warp_sdf(G, gid, x, y, s, th, bx0, by0, bw, bh)
        d = w if d is None else np.minimum(d, w)
    if target is not None and m > 0:
        dt = _warp_sdf(G, target[0], *target[1:], bx0, by0, bw, bh)
        d = dt if d is None else (1 - m) * d + m * dt
    return bx0, by0, d + thin


def ink(canvas, x0, y0, d, col, a=1.0, key=0.0, kcol=(0.03, 0.02, 0.05), keyw=2.2, glow=0.0, gcol=None, gr=14.0):
    H, W = canvas.shape[:2]
    hh, ww = d.shape
    bx0, by0, bx1, by1 = max(x0, 0), max(y0, 0), min(x0 + ww, W), min(y0 + hh, H)
    if bx1 <= bx0 or by1 <= by0 or a <= 0:
        return
    dd = d[by0 - y0:by1 - y0, bx0 - x0:bx1 - x0]
    reg = canvas[by0:by1, bx0:bx1]
    if glow > 0:
        gc = np.asarray(gcol if gcol is not None else col, np.float32)
        al0 = np.clip(0.5 - d, 0, 1).astype(np.float32)
        g_ = (glow * a * np.minimum(1, 2.2 * cv2.GaussianBlur(al0, (0, 0), gr * 0.6)))[by0 - y0:by1 - y0, bx0 - x0:bx1 - x0, None]
        reg += (1 - reg) * gc[None, None, :] * g_          # screen-like add of light
    if key > 0:
        kk = (np.clip(0.5 - (dd - keyw), 0, 1) * key * a)[..., None]
        reg += (np.asarray(kcol, np.float32)[None, None, :] - reg) * kk
    al = (np.clip(0.5 - dd, 0, 1) * a)[..., None]
    reg += (np.asarray(col, np.float32)[None, None, :] - reg) * al


def hexrgb(h):
    return P.hexrgb(h)


def lum(x):
    return P.lum(x)


def load(path, W=1920, H=1080):
    return P.load(path, W, H)


def save(path, im, q=92):
    cv2.imwrite(path, (np.clip(im, 0, 1)[..., ::-1] * 255 + 0.5).astype(np.uint8), [cv2.IMWRITE_JPEG_QUALITY, q])


def cover(img, W=1920, H=1080, zoom=1.0, fx=0.5, fy=0.45):
    """film.js cover(): fill W x H with img (any size), zoomed about focus (fx, fy) of the source"""
    h, w = img.shape[:2]
    sc = max(W / w, H / h) * zoom
    sw, sh = W / sc, H / sc
    sx = min(max(fx * w - sw / 2, 0), w - sw) if zoom >= 1 else fx * w - sw / 2
    sy = min(max(fy * h - sh / 2, 0), h - sh) if zoom >= 1 else fy * h - sh / 2
    M = np.array([[sc, 0, -sx * sc], [0, sc, -sy * sc]], np.float32)
    return cv2.warpAffine(img, M, (W, H), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REFLECT), M


def smooth(u):
    u = np.clip(u, 0, 1)
    return u * u * (3 - 2 * u)


LIVES = [  # fable/proof/lives.js (order = shots.js LIFE): id, branch word shown, colour, side
    ('piano', 'piano', '#FF3D7F', 'left'), ('violin', 'violin', '#FFD23F', 'right'), ('wushu', 'wushu', '#FF6B5E', 'right'),
    ('wetlab', 'biology', '#3DDC97', 'left'), ('phd', 'neuroscience', '#22D3EE', 'left'), ('poet', 'poet', '#E24BD6', 'left'),
    ('ames', 'nasa-ames', '#3D8BFF', 'right'), ('band', 'rna-band', '#FF6B5E', 'right'), ('chezjj', 'hacker-houses', '#3DDC97', 'right'),
    ('sandstorm', 'open-source', '#22D3EE', 'right'), ('home', 'parenthood', '#FF3D7F', 'right'), ('violet', 'rare-earth', '#9B6BFF', 'right')]
VIOLET = '#9B6BFF'
