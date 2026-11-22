#!/usr/bin/env python3
"""v11 B2: one glyph atlas per life's NOTATION (same npz format as atlas.py, so paint.py / animate.py use it unchanged).

  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/v11/natlas.py [NAME ...]     # all when no name
  -> work_fable/take2/dev/v11_glyph/atlas/<NAME>.npz (+ _sheet.png)

Notations (notes/v11_direction.md B2): staff_piano, staff_violin (Bravura, SMuFL), hanzi (strokes + radicals, Noto Serif SC),
dna (A T G C + codon triplets), rna (A C G U + codons), ipa, poet (lower-case serif + short words of her corpus), greek_math
(Greek + maths), code ({ } ; => / * | and hex), child (a child's capitals, some backwards: Indie Flower, mirrored).
Multi-character tokens (codons, words, '=>', hex pairs) are one sprite each. The 'script' field groups a notation's glyphs
('stroke' = the line-like ones that carry edges: staff lines, stems, 丨 一 丿, / | -; paint's prior weights them up).
Fonts: OFL, fetched once into work_fable/take2/dev/v11_glyph/fonts/ (nothing sent), plus system fonts already on the machine.
"""
import os, sys, re
import numpy as np, cv2
from PIL import ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.dirname(HERE))
import atlas as A  # noqa: E402

ROOT = A.ROOT
FONTD = os.path.join(ROOT, 'work_fable/take2/dev/v11_glyph/fonts')
OUTD = os.path.join(ROOT, 'work_fable/take2/dev/v11_glyph/atlas')
SYS = '/usr/share/fonts'
BRAVURA = f'{FONTD}/Bravura.otf'
SC = f'{FONTD}/NotoSerifSC[wght].ttf'
CHILD = f'{FONTD}/IndieFlower-Regular.ttf'
JB = os.path.join(ROOT, 'engine/fonts/JetBrainsMono[wght].ttf')
DJ = SYS + '/truetype/dejavu/DejaVuSans-Bold.ttf'
DJM = SYS + '/truetype/dejavu/DejaVuSansMono-Bold.ttf'
NSERIF = A.F('NotoSerif-Regular.ttf')
FSERIF = SYS + '/truetype/freefont/FreeSerif.ttf'
FSERIFI = SYS + '/truetype/freefont/FreeSerifItalic.ttf'
C059I = SYS + '/opentype/urw-base35/C059-Italic.otf'
C059 = SYS + '/opentype/urw-base35/C059-Roman.otf'
NMONO = SYS + '/opentype/urw-base35/NimbusMonoPS-Bold.otf'
GOTH = SYS + '/opentype/urw-base35/URWGothic-Demi.otf'
U = lambda *cs: [chr(c) for c in cs]
CORPUS = os.path.join(HERE, 'corpus')

# ---- staff notation (SMuFL code points in Bravura)
STAFF = dict(
    note=U(0xE050, 0xE062, 0xE05C,                           # clefs G F C
           0xE0A2, 0xE0A3, 0xE0A4,                           # noteheads whole half black
           0xE1D2, 0xE1D3, 0xE1D4, 0xE1D5, 0xE1D6, 0xE1D7, 0xE1D8, 0xE1D9, 0xE1DA,   # notes with stems/flags
           0xE4E3, 0xE4E4, 0xE4E5, 0xE4E6, 0xE4E7,           # rests
           0xE260, 0xE261, 0xE262, 0xE263,                   # flat natural sharp double-sharp
           0xE240, 0xE241, 0xE242, 0xE243,                   # flags
           0xE4C0, 0xE4A0, 0xE4A2, 0xE4A4, 0xE4AC,           # fermata, accent, staccato, tenuto, marcato
           0xE08A, 0xE084, 0xE083, 0xE086,                   # common time, 4, 3, 6
           0xE566, 0xE56C, 0xE567),                          # trill, mordent, turn
    dyn=U(0xE520, 0xE521, 0xE522, 0xE52B, 0xE52F, 0xE534, 0xE53E, 0xE53F),   # p m f pp ff? sfz, hairpins
    stroke=U(0xE030, 0xE031, 0xE014, 0xE010, 0xE022, 0xE1FD, 0xE1F7),         # barlines, staff lines, ledger, beams/ties
)
VIOLIN = U(0xE610, 0xE612, 0xE614, 0xE616, 0xE618, 0xE620, 0xE630)            # down/up bow, harmonic, half-harmonic, ..., pizz
PIANO = U(0xE650, 0xE655, 0xE651, 0xE652, 0xE653, 0xE654, 0xE656, 0xE658, 0xE659)   # Ped., *, P, e, d, ., pedal marks


def staff(extra):
    g = {k: [(c, BRAVURA) for c in v] for k, v in STAFF.items()}
    g['mark'] = [(c, BRAVURA) for c in extra]
    return g


# ---- hanzi strokes and radicals (wushu)
HZ_STROKES = [chr(c) for c in range(0x31C0, 0x31E4)] + list('一丨丿丶乙亅乚乛')
HZ_RAD = list('亻氵扌忄艹讠钅纟宀冖亠彳辶阝刂攵灬罒礻衤饣犭丬廴卩厶匚冂凵丷冫刀力又口囗土士夂夕大女子寸小尢尸山巛工己巾干广弋弓彐彡'
              '心戈户手支文斗斤方日月木欠止歹殳毋比毛氏气水火爪父爻片牙牛犬玉瓦甘生用田疋白皮皿目矛矢石示禾穴立竹米糸缶网羊羽'
              '老而耒耳肉臣自至臼舌舛舟艮色虍虫血行衣西见角言谷豆豕豸贝赤走足身车辛辰酉采里金长门隹雨青非面革韦音页风飞食首香马骨高鬼鱼鸟鹿麦黄黑鼓鼠鼻齐齿龙')
HZ_WUSHU = list('武术拳剑刀棍枪功夫')


def hanzi():
    return dict(stroke=[(c, SC) for c in HZ_STROKES], rad=[(c, SC) for c in HZ_RAD + HZ_WUSHU],
                rad2=[(c, A.F('NotoSerifJP.otf')) for c in HZ_RAD[:60]])


# ---- nucleotides
def bases(letters):
    fonts = [DJ, NSERIF, NMONO, C059, JB]
    g = dict(base=[(c, f) for c in letters for f in fonts])
    import itertools
    cod = [''.join(p) for p in itertools.product(letters, repeat=3)]
    g['codon'] = [(c, f) for c in cod for f in (DJM, NMONO)]
    return g


# ---- IPA
IPA = list('əɪʊŋʃʒθðɛɔæɑɒʌɜɹɾʔɡʤʧɐɨʉøœɯɤβɸχʁħʕɬɮʎɲɳɖʈʂʐɕʑçʝɣɰʋɭɻʀʙⱱɓɗʄɠʛʘǀǃǂǁɥʍʏɵɘɞʊ̈') + ['ː', 'ˈ', 'ˌ', '̃']
IPA = [c for c in IPA if len(c) == 1 and not (0x300 <= ord(c) < 0x370)]


def ipa():
    return dict(ipa=[(c, f) for c in IPA for f in (NSERIF, DJ, FSERIF)],
                stroke=[(c, f) for c in ['ˈ', 'ˌ', 'ː', '|', 'ǀ', 'ǁ'] for f in (NSERIF, DJ)])


# ---- poet: lower-case serif letters + short words of her corpus
def corpus_words(maxlen=5, minlen=2):
    ws = set()
    for fn in sorted(os.listdir(CORPUS)):
        if fn.endswith('.txt'):
            for w in re.findall(r"[a-z']+", open(os.path.join(CORPUS, fn)).read().lower()):
                w = w.strip("'")
                if minlen <= len(w) <= maxlen and w.isascii():
                    ws.add(w)
    return sorted(ws)


def poet():
    let = 'abcdefghijklmnopqrstuvwxyz'
    return dict(latin=[(c, f) for c in let for f in (NSERIF, C059I, FSERIFI, C059)],
                word=[(w, f) for w in corpus_words(4) for f in (C059I, NSERIF)])


def greek_math():
    gr = [chr(c) for c in range(0x391, 0x3A2)] + [chr(c) for c in range(0x3A3, 0x3AA)] + [chr(c) for c in range(0x3B1, 0x3CA)]
    return dict(greek=[(c, f) for c in gr for f in (NSERIF, DJ, FSERIFI)],
                math=[(c, f) for c in A.CHARS['math'] for f in (A.F('NotoSansMath-Regular.ttf'), DJ)],
                stroke=[(c, f) for c in '∫√−=∑' for f in (A.F('NotoSansMath-Regular.ttf'), DJ)])


def code():
    ch = list('{}();=>/*|<>[]&!#%:') + list('0123456789abcdef')
    tok = ['=>', '&&', '||', '/*', '*/', '0x', '{}', '();', '!=', '==', '->', '::', '//'] + \
          ['ff', '3a', '7f', 'c0', '1e', 'be', 'ef', 'de', 'ad', '0f', '9b', '42', 'a5', 'e2', '00', 'cafe', 'beef', 'f00d']
    return dict(code=[(c, f) for c in ch for f in (JB, DJM, NMONO)], tok=[(t, f) for t in tok for f in (JB, DJM)],
                stroke=[(c, f) for c in '/|\\-_' for f in (JB, DJM)])


BACKWARDS = set('RSNEJZKBDPCGLF')


def child():
    caps = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
    return dict(cap=[(c, CHILD) for c in caps] + [(c, GOTH) for c in caps],
                back=[(c, CHILD, 'mirror') for c in BACKWARDS] + [(c, GOTH, 'mirror') for c in 'RSNEJZ'])


def corpus_atlas():
    """the catch (3:22-3:55) and main Jade from 223 on: only the corpus's own characters, Latin and Simplified Chinese"""
    txt = ''.join(open(os.path.join(CORPUS, f), encoding='utf-8').read() for f in sorted(os.listdir(CORPUS)) if f.endswith('.txt'))
    lat = sorted(set(c for c in txt if c.isascii() and c.isalpha()))
    han = sorted(set(c for c in txt if 0x3400 <= ord(c) <= 0x9fff))
    return dict(latin=[(c, f) for c in lat for f in (DJ, NSERIF, C059I, GOTH)],
                cjk=[(c, f) for c in han for f in (SC, A.SYS + '/truetype/droid/DroidSansFallbackFull.ttf' if False else SC)][::2] +
                    [(c, '/usr/share/fonts/truetype/droid/DroidSansFallbackFull.ttf') for c in han],
                stroke=[(c, f) for c in ['一', 'l', 'I', 'i', '-', "'"] for f in ((SC,) if c == '一' else (DJ, NSERIF, C059I))])


NOTATIONS = dict(corpus=corpus_atlas, staff_piano=lambda: staff(PIANO), staff_violin=lambda: staff(VIOLIN), hanzi=hanzi, dna=lambda: bases('ATGC'),
                 rna=lambda: bases('ACGU'), ipa=ipa, poet=poet, greek_math=greek_math, code=code, child=child)


def canon(a, rotate=False):
    """atlas.canon, but v11 notation glyphs stay UPRIGHT (a note or a codon reads only upright; paint11's upright mode turns them
    onto strong edges by at most 90 degrees). Only the 'stroke' group is laid horizontal as in atlas.py. elong is still measured."""
    if rotate:
        return A.canon(a)
    r = A.canon(a)
    if r is None:
        return None
    elong = r[1]
    f = a.astype(np.float32) / 255
    ys, xs = np.nonzero(f > 0.02)
    c = f[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w_ = c.shape; k = 0.92 * 128 / max(h, w_)
    nh, nw = max(1, round(h * k)), max(1, round(w_ * k))
    c = cv2.resize(c, (nw, nh), interpolation=cv2.INTER_AREA)
    o = np.zeros((128, 128), np.float32); oy, ox = (128 - nh) // 2, (128 - nw) // 2
    o[oy:oy + nh, ox:ox + nw] = c
    return o, elong


def build(name):
    groups = NOTATIONS[name]()
    scripts = list(groups)
    sprites, meta = [], []
    fcache = {}
    for si, sc in enumerate(scripts):
        n0 = len(sprites)
        for item in groups[sc]:
            ch, fp = item[0], item[1]
            mirror = len(item) > 2
            if not os.path.exists(fp):
                print('missing font', fp); continue
            if fp not in fcache:
                f = ImageFont.truetype(fp, 200 if len(ch) == 1 else 120)
                f2 = ImageFont.truetype(fp, 120)
                fcache[fp] = (f, f2, A.notdef_mask(f))
            f, f2, nd = fcache[fp]
            a = A.render(f if len(ch) == 1 else f2, ch)
            if a is None or a.max() < 64:
                continue
            if nd is not None and nd.max() > 0 and np.array_equal(a, nd):
                continue
            if mirror:
                a = a[:, ::-1].copy()
            r = canon(a, rotate=(sc == 'stroke'))
            if r is None:
                continue
            o, elong = r
            sprites.append((o * 255).astype(np.uint8))
            meta.append((si, ch + ('~' if mirror else ''), os.path.basename(fp), elong))
        print(f'{name:12s} {sc:8s} {len(sprites) - n0}')
    S = np.stack(sprites)
    f = S.astype(np.float32) / 255
    desc = np.stack([cv2.resize(x, (16, 16), interpolation=cv2.INTER_AREA) for x in f]).reshape(len(f), -1)
    cov = f.mean(axis=(1, 2))
    os.makedirs(OUTD, exist_ok=True)
    out = f'{OUTD}/{name}.npz'
    np.savez_compressed(out, sprites=S, desc=desc.astype(np.float32), cov=cov.astype(np.float32),
                        script=np.array([m[0] for m in meta], np.int16), char=np.array([m[1] for m in meta]),
                        font=np.array([m[2] for m in meta]), elong=np.array([m[3] for m in meta], np.float32),
                        scripts=np.array(scripts))
    n = len(S); cols = 32; rows = (n + cols - 1) // cols
    sheet = np.zeros((rows * 40, cols * 40), np.uint8)
    for i, x in enumerate(S):
        r_, c_ = divmod(i, cols)
        sheet[r_ * 40 + 2:r_ * 40 + 38, c_ * 40 + 2:c_ * 40 + 38] = cv2.resize(x, (36, 36), interpolation=cv2.INTER_AREA)
    cv2.imwrite(out.replace('.npz', '_sheet.png'), 255 - sheet)
    print(name, n, '->', out)
    return out


if __name__ == '__main__':
    for nm in (sys.argv[1:] or list(NOTATIONS)):
        build(nm)
