#!/usr/bin/env python3
"""v11 B2 second pass: a life's plate written in its notation as INK (main thread's notes on notation.py).

Not a tone-matched mosaic: the plate stays the picture, and its FLAT regions (walls, sky, floor, jacket body) carry large canonical
glyphs of the life's notation, drawn as ink with a clean edge, visibly darker than a light ground or lighter than a dark one. Detail
(faces, hands, hair, instruments) stays clean: glyphs go only where the plate is flat at the glyph's own scale. Upright, in rows, as
the notation is written: staves with clefs and notes (piano, violin), codon triplets (biology ATGC, band ACGU), whole hanzi words
(wushu), IPA transcriptions (neuroscience), her lines in lower-case serif (poet), Greek and maths (ames), code tokens and hex pairs
in monospace (hacker houses, open source), a child's wobbly capitals, some mirrored (parenthood).
  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/v11/notation2.py [--lives piano,band] [--frame N] [--seed S]
  -> work_fable/take2/dev/v11_glyph/notation2_<life>.jpg (1920 crop | 640 full | plate), notation2_all.jpg (640 tiles),
     raw/notation2_<life>.png (full 1920 still)
Library: write(life, src_rgb_float, rng) -> image (1920x1080 float RGB).
"""
import os, sys, json, math, argparse
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE); sys.path.insert(0, os.path.dirname(HERE))
import gl11 as M  # noqa: E402
from v9.skin import skin_mask  # noqa: E402

ROOT = M.ROOT
OUT = os.path.join(ROOT, 'work_fable/take2/dev/v11_glyph')
LIFE_PL = os.path.join(ROOT, 'work_fable/proof/plates')
FD = M.FD
BRAV = f'{FD}/Bravura.otf'
SC = f'{FD}/NotoSerifSC[wght].ttf'
CHILD = f'{FD}/IndieFlower-Regular.ttf'
JB = os.path.join(ROOT, 'engine/fonts/JetBrainsMono[wght].ttf')
DJB = '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
DJS = '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf'
NSERIF = M.FONTS['serif']
C059I, C059BI = M.FONTS['serif_it'], M.FONTS['serif_bi']
W, H = 1920, 1080
SIZES = [116, 76, 48]
FLAT_PCT = {'wetlab': 85, 'wushu': 60, 'violin': 66, 'piano': 58, 'band': 74}   # share of the frame (flattest first, 18 px blur) that may carry glyphs; default 68          # glyph rows, px at 1920: large on big flat areas, smaller where the flat area is smaller
LABEL = {'piano': 'piano: staff', 'violin': 'violin: staff + bowing', 'wushu': 'wushu: hanzi', 'wetlab': 'biology: ATGC codons',
         'phd': 'phd-neuroscience: IPA', 'poet': 'poet: her lines', 'ames': 'nasa-ames: Greek + maths', 'band': 'rna-band: ACGU codons',
         'chezjj': 'hacker-houses: code + hex', 'sandstorm': 'open-source: code + hex', 'home': "parenthood: a child's capitals",
         'violet': 'rare-earth: all scripts (v9)'}
_fc = {}


def font(path, px, var=None):
    k = (path, int(px), var)
    if k not in _fc:
        f = ImageFont.truetype(path, max(6, int(px)))
        if var:
            try:
                f.set_variation_by_name(var)
            except Exception:
                pass
        _fc[k] = f
    return _fc[k]


# ------------------------------------------------------------------ word generators: (text, fontpath, var, rel size)
def gen_words(life, rng):
    if life in ('wetlab', 'band'):
        b = 'ATGC' if life == 'wetlab' else 'ACGU'
        start = 'ATG' if life == 'wetlab' else 'AUG'
        k = 0
        while True:
            yield (start if k % 9 == 0 else ''.join(rng.choice(list(b), 3)), DJB, None, 1.0); k += 1
    if life == 'wushu':
        ws = ['武术', '长拳', '南拳', '太极', '剑术', '刀术', '棍术', '枪术', '功夫', '气', '拳', '马步', '弓步', '少林', '武当', '套路', '剑', '刀', '棍', '枪']
        while True:
            yield (ws[int(rng.integers(len(ws)))], SC, 'Black', 1.0)
    if life == 'phd':
        ws = ['/mɝdʒ/', '/mi/', '/bæk/', '/tə/', '/meɪn/', '/ˈɛvɹi/', '/ɹoʊd/', '/aɪ/', '/ɹæn/', '/bɪˈkʌmz/', '/ðə/', '/wʌn/', '/foʊld/',
              '/ɪn/', '/əˈɡɛn/', '/bɹæntʃ/', '/ˈwɑndɚ/', '/ɹɪˈtɝn/', '/laɪf/', '/lɪvd/', '/ˈnʌθɪŋ/', '/ʌnˈdʌn/']
        k = 0
        while True:
            yield (ws[k % len(ws)], NSERIF if k % 3 else DJB, None, 1.0); k += 1
    if life == 'poet':
        words = [w for l in M.corpus('rare-earth') + M.corpus('moongazing') + M.corpus('orbital-sunrise') for w, h in M.words_in(l) if not h]
        k = int(rng.integers(len(words)))
        while True:
            yield (words[k % len(words)].lower(), C059I if k % 4 else C059BI, None, 1.0); k += 1
    if life == 'ames':
        ws = ['∂ρ/∂t', '∇·u = 0', 'Σ', 'π', '∫', '≈', 'ρ', 'Δv', 'ω', 'θ', 'λ', 'α', '∇p', 'μ', 'L = ½ρv²S', 'Γ', 'ζ', '∂/∂x', '√2', 'β', 'φ', 'Ω']
        while True:
            yield (ws[int(rng.integers(len(ws)))], DJB if rng.random() < 0.6 else '/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', None, 1.0)
    if life in ('chezjj', 'sandstorm'):
        ws = ['{', '}', ';', '=>', '/*', '*/', '|', '#', '0x3f', 'a9', 'ff', '1e', 'c0', 'de', 'ad', '7b', '{ }', '();', '||', '#!', '=>', 'e2', '42', '0x00']
        while True:
            yield (ws[int(rng.integers(len(ws)))], JB, 'Bold', 1.0)
    if life == 'home':
        ws = ['SUN', 'MOON', 'MOM', 'EARTH', 'MARS', 'STAR', 'HI', 'LOVE', 'ME', 'MY', 'SKY', 'NIGHT', 'RED', 'BIG', 'NO', 'YES']
        while True:
            yield (ws[int(rng.integers(len(ws)))], CHILD, None, 1.0)
    raise KeyError(life)


# ------------------------------------------------------------------ drawing rows
def draw_word(alpha, x, y, word, rng, size, child=False):
    """a word at baseline (x, y) into alpha (PIL L image); returns advance px. child: each capital wobbles and some are mirrored,
    drawn with a crayon-thick stroke"""
    text, fp, var, rel = word
    f = font(fp, size * rel, var)
    d = ImageDraw.Draw(alpha)
    if not child:
        d.text((x, y), text, font=f, fill=255, anchor='ls')
        return f.getlength(text)
    adv = 0
    for c in text:
        sz = size * rng.uniform(0.85, 1.15)
        fc = font(fp, sz)
        sw = max(2, int(sz * 0.06))
        bb = fc.getbbox(c, stroke_width=sw)
        g = Image.new('L', (bb[2] - bb[0] + 4 * sw, int(sz * 1.6)), 0)
        ImageDraw.Draw(g).text((2 * sw - bb[0], int(sz * 1.15)), c, font=fc, fill=255, stroke_width=sw, stroke_fill=255, anchor='ls')
        if c in 'RSNEJZKBDPCGLF' and rng.random() < 0.4:
            g = g.transpose(Image.FLIP_LEFT_RIGHT)
        g = g.rotate(float(rng.normal(0, 9)), resample=Image.BICUBIC, expand=True)
        yy = int(y - sz * 1.15 + rng.normal(0, sz * 0.07) - (g.size[1] - int(sz * 1.6)) / 2)
        xx = int(x + adv)
        reg = alpha.crop((xx, yy, xx + g.size[0], yy + g.size[1]))
        alpha.paste(Image.fromarray(np.maximum(np.asarray(reg), np.asarray(g))), (xx, yy))
        adv += fc.getlength(c) * 0.95 + sw
    return adv


def text_rows(alpha, used, flat, life, rng):
    """fill flat regions with rows of words, largest size first; used: bool array of what is taken"""
    gen = gen_words(life, rng)
    child = life == 'home'
    for S in SIZES:
        k = int(S * 0.3) | 1
        ok = cv2.erode((flat & ~used).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_RECT, (k, int(S * 0.7) | 1))) > 0
        if ok.sum() < S * S:
            continue
        segs = M.segments(ok, S, 1.25, 1e9, rng)
        for (y, x0, x1) in segs:
            x = x0 + rng.uniform(0, 0.4 * S)
            yb = y + 0.33 * S
            while True:
                w = next(gen)
                f = font(w[1], S * w[3], w[2])
                wl = f.getlength(w[0]) * (1.08 if child else 1.0)
                if x + wl > x1:
                    break
                draw_word(alpha, x, yb, w, rng, S, child)
                x += wl + S * (0.45 if life not in ('wetlab', 'band') else 0.38)
            used[int(y - 0.62 * S):int(y + 0.62 * S), int(x0):int(x1)] = True


# ------------------------------------------------------------------ staff notation
def staves(alpha, used, flat, life, rng):
    for S in SIZES:
        sp = S / 7.0                        # staff space: the staff (4 sp) plus room for stems and marks in a row of S * 1.25
        k = int(S * 0.3) | 1
        ok = cv2.erode((flat & ~used).astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_RECT, (k, int(S * 0.8) | 1))) > 0
        if ok.sum() < S * S:
            continue
        segs = M.segments(ok, S, 1.3, 1e9, rng)
        bf = font(BRAV, 4 * sp)
        d = ImageDraw.Draw(alpha)
        for si, (y, x0, x1) in enumerate(segs):
            if x1 - x0 < 9 * sp:
                continue
            yb = y + 2 * sp                  # bottom staff line
            lw = max(1.0, sp * 0.13)
            for i in range(5):
                yl = yb - i * sp
                d.rectangle([x0, yl - lw / 2, x1, yl + lw / 2], fill=255)
            for xx in (x0, x1):
                d.rectangle([xx - lw / 2, yb - 4 * sp, xx + lw / 2, yb], fill=255)
            bass = life == 'piano' and si % 2 == 1
            x = x0 + 0.5 * sp
            if bass:
                d.text((x, yb - 3 * sp), '', font=bf, fill=255, anchor='ls')
            else:
                d.text((x, yb - sp), '', font=bf, fill=255, anchor='ls')
            x += 3.2 * sp
            if si % 3 == 0:
                for yy in (yb - 3 * sp, yb - sp):
                    d.text((x, yy), '', font=bf, fill=255, anchor='ls')
                x += 2.2 * sp
            if rng.random() < 0.5:   # a dynamic under the staff at the start
                dyn = ['', '', ''][int(rng.integers(3))]
                d.text((x, yb + 2.6 * sp), dyn, font=bf, fill=255, anchor='ls')
            beats = 0
            while x < x1 - 4 * sp:
                r = rng.random()
                p = int(rng.integers(-1, 10))            # staff position in half spaces from the bottom line
                yy = yb - p * sp / 2
                if r < 0.12:                              # accidental + note
                    d.text((x, yy), ['', '', ''][int(rng.integers(3))], font=bf, fill=255, anchor='ls'); x += 1.2 * sp
                if r < 0.42:                              # quarter note, stem by position
                    d.text((x, yy), '' if p < 4 else '', font=bf, fill=255, anchor='ls')
                    mark_above(d, bf, life, x, yb, sp, rng)
                    x += 2.2 * sp; beats += 1
                elif r < 0.62:                            # beamed eighths: two noteheads, stems, a beam
                    p2 = int(np.clip(p + rng.integers(-2, 3), 0, 8)); p = int(np.clip(p, 0, 8))
                    ya, yb2 = yb - p * sp / 2, yb - p2 * sp / 2
                    xa, xb = x, x + 2.0 * sp
                    hw = 1.18 * sp; sw = 0.12 * sp
                    top = min(ya, yb2) - 3.3 * sp
                    for (xh, yh) in ((xa, ya), (xb, yb2)):
                        d.text((xh, yh), '', font=bf, fill=255, anchor='ls')
                        d.rectangle([xh + hw - sw, top + (yh - min(ya, yb2)) * 0 , xh + hw, yh - 0.15 * sp], fill=255)
                    d.polygon([(xa + hw - sw, top), (xb + hw, top), (xb + hw, top + 0.5 * sp), (xa + hw - sw, top + 0.5 * sp)], fill=255)
                    mark_above(d, bf, life, xa, yb, sp, rng)
                    x += 4.2 * sp; beats += 1
                elif r < 0.75:                            # half note
                    d.text((x, yy), '' if p < 4 else '', font=bf, fill=255, anchor='ls'); x += 3.0 * sp; beats += 2
                elif r < 0.87:                            # quarter rest on the middle line
                    d.text((x, yb - 2 * sp), '', font=bf, fill=255, anchor='ls'); x += 1.8 * sp; beats += 1
                else:                                     # a note under a fermata
                    d.text((x, yy), '' if p < 4 else '', font=bf, fill=255, anchor='ls')
                    d.text((x - 0.4 * sp, yb - 5.6 * sp), '', font=bf, fill=255, anchor='ls'); x += 2.4 * sp; beats += 1
                if beats >= 4 and x < x1 - 4 * sp:        # bar line
                    d.rectangle([x - lw / 2, yb - 4 * sp, x + lw / 2, yb], fill=255); x += 1.2 * sp; beats = 0
                if life == 'piano' and rng.random() < 0.07:
                    d.text((x - 2 * sp, yb + 3.0 * sp), '', font=bf, fill=255, anchor='ls')
            used[int(y - 0.65 * S):int(y + 0.65 * S), int(x0):int(x1)] = True


def mark_above(d, bf, life, x, yb, sp, rng):
    if life == 'violin' and rng.random() < 0.3:      # bowing: down-bow / up-bow above the staff
        d.text((x, yb - 5.4 * sp), '' if rng.random() < 0.5 else '', font=bf, fill=255, anchor='ls')


# ------------------------------------------------------------------ the page
def flat_mask(src, life):
    l = cv2.cvtColor((src * 255).astype(np.uint8), cv2.COLOR_RGB2GRAY).astype(np.float32) / 255
    gx = cv2.Sobel(cv2.GaussianBlur(l, (0, 0), 1.5), cv2.CV_32F, 1, 0); gy = cv2.Sobel(cv2.GaussianBlur(l, (0, 0), 1.5), cv2.CV_32F, 0, 1)
    g = cv2.GaussianBlur(np.hypot(gx, gy), (0, 0), 18)
    thr = np.percentile(g, FLAT_PCT.get(life, 68))
    flat = g < max(thr, 0.02)
    sk = (skin_mask(src) > 0.25).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(sk)      # skin-coloured paper/walls are not skin: only face/hand-sized blobs
    big = np.nonzero(st[:, cv2.CC_STAT_AREA] > 0.02 * W * H)[0]
    sk = (sk > 0) & ~np.isin(lab, big[big > 0])
    sk = cv2.dilate(sk.astype(np.uint8), cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (71, 71))) > 0
    return flat & ~sk


def write(life, src, rng):
    alpha = Image.new('L', (W, H), 0)
    used = np.zeros((H, W), bool)
    flat = flat_mask(src, life)
    if life in ('piano', 'violin'):
        staves(alpha, used, flat, life, rng)
    else:
        text_rows(alpha, used, flat, life, rng)
    a = np.asarray(alpha).astype(np.float32) / 255
    ground = cv2.GaussianBlur(src, (0, 0), 6)
    lum = ground[..., 0] * 0.299 + ground[..., 1] * 0.587 + ground[..., 2] * 0.114
    dark = (lum > 0.5)[..., None]
    ink = np.where(dark, ground * 0.32, ground + (1 - ground) * 0.62)
    return src * (1 - a[..., None]) + ink * a[..., None], a


def tile(img, plate, label, focus):
    cx, cy = focus[0] * W, focus[1] * H
    x0 = int(np.clip(cx - 480, 0, W - 960)); y0 = int(np.clip(cy - 270, 0, H - 540))
    a = (np.clip(img[y0:y0 + 540, x0:x0 + 960], 0, 1) * 255).astype(np.uint8)[..., ::-1]
    b = (cv2.resize(np.clip(img, 0, 1), (640, 360), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8)[..., ::-1]
    p = (cv2.resize(plate, (320, 180), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8)[..., ::-1]
    right = np.vstack([b, np.hstack([p, np.full((180, 320, 3), 24, np.uint8)])])
    r = np.hstack([a, np.full((540, 8, 3), 255, np.uint8), right]).copy()
    cv2.putText(r, label, (12, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)
    cv2.putText(r, '1920 crop 1:1', (12, 526), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (220, 220, 220), 1)
    cv2.putText(r, '640 full 1:1   |   plate', (1300, 390), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (220, 220, 220), 1)
    return r


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--lives', default=''); ap.add_argument('--frame', type=int, default=60); ap.add_argument('--seed', type=int, default=3)
    a = ap.parse_args()
    lives = a.lives.split(',') if a.lives else list(LABEL)
    smalls = []
    os.makedirs(f'{OUT}/raw', exist_ok=True)
    for life in lives:
        meta = json.load(open(f'{LIFE_PL}/{life}/meta.json'))
        src = cv2.imread(f'{LIFE_PL}/{life}/frames/f_{a.frame:04d}.jpg')[..., ::-1].astype(np.float32) / 255
        src = cv2.resize(src, (W, H), interpolation=cv2.INTER_CUBIC)
        if life == 'violet':      # as placed in v9 (all scripts): the B2 first-pass painting at v9 size
            img = cv2.imread(f'{OUT}/raw/notation_violet_k10.png')[..., ::-1].astype(np.float32) / 255
        else:
            img, _ = write(life, src, np.random.default_rng(a.seed))
            cv2.imwrite(f'{OUT}/raw/notation2_{life}.png', (np.clip(img, 0, 1)[..., ::-1] * 255).astype(np.uint8))
        cv2.imwrite(f'{OUT}/notation2_{life}.jpg', tile(img, src, LABEL[life], meta.get('focus', [0.5, 0.4])), [cv2.IMWRITE_JPEG_QUALITY, 90])
        sm = (cv2.resize(np.clip(img, 0, 1), (640, 360), interpolation=cv2.INTER_AREA) * 255).astype(np.uint8)[..., ::-1].copy()
        cv2.putText(sm, LABEL[life], (8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 255, 255), 2)
        smalls.append(sm)
        print(life, flush=True)
    if len(smalls) > 1:
        while len(smalls) % 3:
            smalls.append(np.zeros_like(smalls[0]))
        rows = [np.hstack([np.hstack([s, np.full((360, 6, 3), 255, np.uint8)]) for s in smalls[i:i + 3]]) for i in range(0, len(smalls), 3)]
        cv2.imwrite(f'{OUT}/notation2_all.jpg', np.vstack([np.vstack([r, np.full((6, r.shape[1], 3), 255, np.uint8)]) for r in rows]),
                    [cv2.IMWRITE_JPEG_QUALITY, 90])


if __name__ == '__main__':
    main()
