"""Glyph art v11 library: the lyric corpus (tools/glyphart/v11/corpus) and letters as signed-distance sprites drawn from ANY
(character, font) pair, on top of v10's gl10 (imported unchanged).

  G = G11()                     a gl10.Glyphs with em_char()
  G.em_char(c, font)            em-box sprite gid (>= EM0) of character c in font (key in FONTS or a path): Latin on a baseline,
                                hanzi centred; cached
  corpus(slug) -> [lines]       the sung lines of one song; SONGS = slugs, MERGE = 'merge'
  words_in(line) -> [(word, is_han)]   words in reading order; a run of hanzi is split into single characters (each its own cell)
  layout_rows(allow, size, adv, row, text_iter, ...)   lays words left to right along rows over a mask: whole words only, a blank
                                cell between words, a word that does not fit the rest of a run goes to the next run
Only two scripts ever: Latin (with ' and -) and Simplified Chinese.
"""
import os, sys, re, math
import numpy as np, cv2

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(os.path.dirname(HERE), 'v10'))
sys.path.insert(0, os.path.dirname(HERE))
import gl10 as L  # noqa: E402

ROOT = L.ROOT
CORPUS = os.path.join(HERE, 'corpus')
FD = os.path.join(ROOT, 'work_fable/take2/dev/v11_glyph/fonts')
U35 = '/usr/share/fonts/opentype/urw-base35'
FONTS = {
    'sans_bold': '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    'serif': os.path.join(ROOT, 'work_fable/take2/dev/v8_glyph/fonts/NotoSerif-Regular.ttf'),
    'serif_bold': f'{U35}/C059-Bold.otf', 'serif_bi': f'{U35}/C059-BdIta.otf', 'serif_it': f'{U35}/C059-Italic.otf',
    'serif_roman': f'{U35}/C059-Roman.otf', 'gothic': f'{U35}/URWGothic-Demi.otf', 'pen': f'{U35}/Z003-MediumItalic.otf',
    'mono': f'{U35}/NimbusMonoPS-Bold.otf', 'free_it': '/usr/share/fonts/truetype/freefont/FreeSerifItalic.ttf',
    'han': f'{FD}/NotoSerifSC[wght].ttf', 'han_bold': f'{FD}/NotoSerifSC[wght].ttf#Bold', 'han_light': f'{FD}/NotoSerifSC[wght].ttf#Regular',
    'han_sans': '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf',
}
# fonts for a word, by weight tier (coarse: heavy; book; pen = the fine line the merge ends in)
TIERS = [['sans_bold', 'serif_bold', 'serif_bi', 'gothic'], ['serif', 'serif_roman', 'serif_it', 'free_it'], ['pen', 'serif_it', 'free_it']]
HAN_TIERS = [['han_bold'], ['han_light', 'han_sans'], ['han_light']]
MERGE = 'merge'
SONGS = ['merge', 'rare-earth', 'orbital-sunrise', 'moongazing', 'rewind', 'hold-fire', 'chaosmonkey']
HAN = re.compile(r'[㐀-鿿]')


def is_han(c):
    return bool(HAN.match(c))


def corpus(slug):
    """sung lines only: hold-fire.txt carries its Suno 'Style:' prompt at the end (not sung): cut there"""
    out = []
    for l in open(os.path.join(CORPUS, f'{slug}.txt'), encoding='utf-8'):
        if l.strip().startswith('Style:'):
            break
        if l.strip():
            out.append(l.strip())
    return out


def words_in(line):
    """words of a line in reading order. Latin words keep letters, ' and - (other punctuation dropped); hanzi come one per item
    (flagged), so a Chinese line lays out as consecutive cells with no gaps"""
    out = []
    for tok in re.findall(r"[A-Za-z][A-Za-z'’-]*|[㐀-鿿]+", line):
        if is_han(tok[0]):
            out.append((tok, True))
        else:
            out.append((tok.replace('’', "'").strip("'-"), False))
    return [w for w in out if w[0]]


class G11(L.Glyphs):
    def em_char(self, c, font):
        fp = FONTS.get(font, font)
        key = (c, fp)
        if not hasattr(self, '_emc'):
            self._emc = {}; self._fobj = {}
        if key in self._emc:
            return self._emc[key]
        from PIL import Image, ImageDraw, ImageFont
        if fp not in self._fobj:
            path, _, var = fp.partition('#')
            f = ImageFont.truetype(path, 110 if not is_han(c) else 100)
            if var:
                f.set_variation_by_name(var)
            self._fobj[fp] = f
        f = self._fobj[fp]
        im = Image.new('L', (128, 128), 0); dr = ImageDraw.Draw(im)
        if is_han(c):
            bb = dr.textbbox((0, 0), c, font=f)
            dr.text((64 - (bb[0] + bb[2]) / 2, 64 - (bb[1] + bb[3]) / 2), c, font=f, fill=255)
        else:
            dr.text((64, 103), c, font=f, fill=255, anchor='ms')
        a = np.asarray(im)
        nid = L.EM0 + len(self.ems); self.ems.append(a); self._emc[key] = nid
        return nid

    def word_glyphs(self, word, han, font):
        """gids of a word's characters (one font for the whole word, so it reads as a word)"""
        return [self.em_char(c, font) for c in word]

    def adv_of(self, gid):
        """advance of an em sprite as a fraction of the em box (ink width + a little): letters keep their widths in a row"""
        a = self.sprite(gid) > 60
        xs = np.nonzero(a.any(0))[0]
        if not len(xs):
            return 0.3
        return float(np.clip((xs.max() - xs.min() + 1) / 128 + 0.08, 0.22, 0.95))


def layout_rows(allow, size, row, items, rng, adv_k=1.0, G=None, x_jit=0.0, start_y=None, min_run=2):
    """lay items (lists of (gid, char)) as words along rows over boolean mask allow (output px). Each word goes whole into the
    current run of allowed cells or to the next run/row; one blank cell between words. Returns [(word_index, char_index, x, y)]
    (x = letter centre) and the number of words placed; stops when the rows or the items run out."""
    H, W = allow.shape
    ys, xs = np.nonzero(allow)
    if not len(ys):
        return [], 0
    y = (ys.min() + row * size * 0.5) if start_y is None else start_y
    out = []; wi = 0
    while y < ys.max() and wi < len(items):
        yi = int(y)
        r = allow[yi]
        cols = np.nonzero(r)[0]
        if not len(cols):
            y += row * size; continue
        # runs of allowed px along this row
        br = np.nonzero(np.diff(cols) > 1)[0]
        runs = np.split(cols, br + 1)
        for run in runs:
            x = run[0] + rng.uniform(0, x_jit * size); xe = run[-1]
            while wi < len(items):
                w = items[wi]
                advs = [(G.adv_of(g) if G is not None else 0.6) * size * adv_k for g, _ in w]
                wl = sum(advs)
                if x + wl > xe:
                    break
                for ci, ((g, ch), a) in enumerate(zip(w, advs)):
                    out.append((wi, ci, x + a / 2, y))
                    x += a
                x += 0.45 * size * adv_k
                wi += 1
            if wi >= len(items):
                break
        y += row * size
    return out, wi


def segments(allow, size, row, maxlen, rng, jit=0.0):
    """runs of allowed cells along rows (row pitch row*size), cut into pieces of at most maxlen px: [(y, x0, x1)]"""
    ys, xs = np.nonzero(allow)
    out = []
    y = ys.min() + row * size * 0.5
    while y < ys.max():
        cols = np.nonzero(allow[int(y)])[0]
        if len(cols):
            for run in np.split(cols, np.nonzero(np.diff(cols) > 1)[0] + 1):
                x0, x1 = float(run[0]), float(run[-1])
                n = max(1, int(math.ceil((x1 - x0) / maxlen)))
                for k in range(n):
                    a = x0 + (x1 - x0) * k / n; b = x0 + (x1 - x0) * (k + 1) / n
                    if b - a >= 1.2 * size * 0.5:
                        out.append((float(y + rng.normal(0, jit * size)), a, b))
        y += row * size
    return out


def fill(segs, items, size, G, adv_k=1.0, gap=0.45, cycle=True, look=0):
    """flow words (items: lists of (gid, char)) into segments in the given order, whole words only; returns
    [(seg_index, word_index, char_index, x, y)] and the number of words placed (items cycle if cycle). look > 0: when the next
    word does not fit the rest of a piece, one of the next `look` words that fits goes there first (near song order, denser)"""
    out = []; n = len(items); queue = []; nxt = 0; placed = 0

    def refill():
        nonlocal nxt
        while len(queue) < look + 1 and (cycle or nxt < n):
            queue.append(nxt); nxt += 1
    wl = lambda wi: [G.adv_of(g) * size * adv_k for g, _ in items[wi % n]]
    for si, (y, x0, x1) in enumerate(segs):
        x = x0; tried = 0
        while True:
            refill()
            if not queue:
                return out, placed
            pick = None
            for qi, wi in enumerate(queue[:look + 1]):
                if x + sum(wl(wi)) <= x1:
                    pick = qi; break
            if pick is None:
                if x == x0 and tried < 3:          # nothing fits an empty piece: drop the head word (too long for these runs)
                    queue.pop(0); tried += 1; continue
                break
            wi = queue.pop(pick)
            for ci, ((g, ch), a) in enumerate(zip(items[wi % n], wl(wi))):
                out.append((si, wi, ci, x + a / 2, y))
                x += a
            x += gap * size * adv_k
            placed += 1
    return out, placed
