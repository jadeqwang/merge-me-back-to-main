#!/usr/bin/env python3
"""Build the glyph atlas for the glyph painter.

  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/atlas.py [OUT.npz]

Every (character, font) pair is rasterised, cropped to its ink, put into a canonical frame and stored as a 128x128 alpha
sprite (plus mips 64/32/16/8 and a 16x16 descriptor for shape fitting). Canonical frame: glyphs whose ink is clearly
elongated (stroke-like: ノ 丿 | ー ― ∫ ل ...) are rotated so their main axis is horizontal; all others stay upright
(baseline along +x). The painter rotates the canonical +x axis onto the local edge tangent / flow direction.
"""
import os, sys, math
import numpy as np, cv2
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
FD = os.path.join(ROOT, 'work_fable', 'take2', 'dev', 'v8_glyph', 'fonts')
SYS = '/usr/share/fonts'


def F(p):
    return p if p.startswith('/') else os.path.join(FD, p)


# fonts per script (several per script: the "any font" part)
FONTS = {
    'latin': [SYS + '/truetype/dejavu/DejaVuSans-Bold.ttf', F('NotoSerif-Regular.ttf'), SYS + '/opentype/urw-base35/C059-BdIta.otf',
              SYS + '/opentype/urw-base35/URWGothic-Demi.otf', SYS + '/opentype/urw-base35/Z003-MediumItalic.otf',
              SYS + '/opentype/urw-base35/NimbusMonoPS-Bold.otf', SYS + '/truetype/freefont/FreeSerifBoldItalic.ttf'],
    'greek': [F('NotoSerif-Regular.ttf'), SYS + '/truetype/dejavu/DejaVuSans-Bold.ttf', SYS + '/truetype/freefont/FreeSerifItalic.ttf'],
    'cyrillic': [F('NotoSerif-Regular.ttf'), SYS + '/truetype/dejavu/DejaVuSans-Bold.ttf', SYS + '/opentype/urw-base35/C059-Italic.otf'],
    'cjk': [F('NotoSerifJP.otf'), SYS + '/truetype/droid/DroidSansFallbackFull.ttf', F('NotoSansKR.otf')],
    'kana': [F('NotoSerifJP.otf'), SYS + '/truetype/droid/DroidSansFallbackFull.ttf'],
    'hangul': [F('NotoSansKR.otf')],
    'devanagari': [F('NotoSansDevanagari-Regular.ttf'), SYS + '/truetype/freefont/FreeSerif.ttf'],
    'arabic': [F('NotoNaskhArabic-Bold.ttf'), SYS + '/truetype/dejavu/DejaVuSans-Bold.ttf'],
    'hebrew': [F('NotoSansHebrew-Bold.ttf'), SYS + '/truetype/freefont/FreeSerif.ttf'],
    'ethiopic': [F('NotoSansEthiopic-Bold.ttf')],
    'tibetan': [F('NotoSerifTibetan-Bold.ttf')],
    'georgian': [F('NotoSansGeorgian-Regular.ttf')],
    'thai': [F('NotoSansThai-Regular.ttf')],
    'tamil': [F('NotoSansTamil-Regular.ttf')],
    'runic': [F('NotoSansRunic-Regular.ttf')],
    'cherokee': [F('NotoSansCherokee-Regular.ttf')],
    'math': [F('NotoSansMath-Regular.ttf'), SYS + '/truetype/dejavu/DejaVuSans-Bold.ttf', SYS + '/truetype/ancient-scripts/Symbola_hint.ttf'],
    'box': [SYS + '/truetype/dejavu/DejaVuSansMono-Bold.ttf', F('NotoSansSymbols2-Regular.ttf'), SYS + '/truetype/ancient-scripts/Symbola_hint.ttf'],
    'stroke': [F('NotoSerifJP.otf'), SYS + '/truetype/droid/DroidSansFallbackFull.ttf', SYS + '/truetype/dejavu/DejaVuSans-Bold.ttf',
               F('NotoNaskhArabic-Bold.ttf'), F('NotoSansMath-Regular.ttf'), SYS + '/truetype/ancient-scripts/Symbola_hint.ttf'],
}

R = lambda a, b: ''.join(chr(c) for c in range(a, b + 1))
CHARS = {
    'latin': R(0x41, 0x5A) + R(0x61, 0x7A) + '&@#%?!§¶ßæøþðŋ',
    'greek': R(0x391, 0x3A1) + R(0x3A3, 0x3A9) + R(0x3B1, 0x3C9),
    'cyrillic': 'БГДЖЗИЙЛПФЦЧШЩЪЫЬЭЮЯбвгджзийклмнпфцчшщъыьэюяѢѣѲѳЄЇ',
    'cjk': ('一二三十人入八大小山川工己巾干弓心戈手文斤方日月木欠止水火爪父片牛犬王玉瓜生用田白皮目矛矢石示禾穴立竹米糸羊羽老耳肉臣自至舌舟色艸虫血行衣西見角言谷豆貝赤走足身車辛辰邑酉里金長門阜隹雨青非面革音頁風飛食首香馬骨高髟鬥鬯鬲鬼魚鳥鹵鹿麥麻黃黍黑黹黽鼎鼓鼠鼻齊齒龍龜龠'
            '森晶品鑫淼焱垚犇羴驫麤龘靐齉爨鬱灩讟籲鑿靈纛矗轟囊鼈鷹體響變'
            '永愛夢光風雲雪花月星海空道心生死天地書畫琴劍舞歌詩情緣'),
    'kana': 'あいうえおかきくけこさしすせそたちつてとなにぬねのはひふへほまみむめもやゆよらりるれろわをんアイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン',
    'hangul': 'ㄱㄴㄷㄹㅁㅂㅅㅇㅈㅊㅋㅌㅍㅎㅏㅑㅓㅕㅗㅛㅜㅠㅡㅣ가나다라마바사아자차카타파하글빛꿈별밤길손눈물봄꽃숲강섬뫼흙쇠힘뜻말춤',
    'devanagari': 'अआइईउऊएऐओऔकखगघचछजझटठडढणतथदधनपफबभमयरलवशषसहॐऋ',
    'arabic': 'ابتثجحخدذرزسشصضطظعغفقكلمنهوي',
    'hebrew': R(0x5D0, 0x5EA),
    'ethiopic': ''.join(chr(c) for c in range(0x1200, 0x1340, 3)),
    'tibetan': R(0x0F40, 0x0F47) + R(0x0F49, 0x0F6C) + 'ༀ༄༅༁',
    'georgian': R(0x10D0, 0x10F0),
    'thai': R(0x0E01, 0x0E2E),
    'tamil': 'அஆஇஈஉஊஎஏஐஒஓஔகஙசஞடணதநபமயரலவழளறன',
    'runic': R(0x16A0, 0x16EA),
    'cherokee': R(0x13A0, 0x13F4),
    'math': '∫∬∮∑∏∐√∛∞∂∇∆≈≡≠≤≥±×÷∴∵⊕⊗⊘⊙∀∃∄∈∉∩∪⊂⊃⊆⊇∧∨¬λμπφψωΩℵℏ℘ℑℜ∝∠∡∢⋈⋉⋊⨁⨂⨀∯∰∱∲∳⌠⌡',
    'box': '─│┼╱╲╳═║╬╋┃━┏┓┗┛├┤┬┴░▒▓█▀▄▌▐■□▲△▼▽●○◆◇◈◉◎★☆※⌘⌗⌖⊞⊠⊡⬡⬢⧫⬟⬣←→↑↓↔↕↖↗↘↙⇐⇒⇑⇓⇔⟵⟶⟷⟹⟿↯↻↺⤳⥈',
    # explicit stroke-like glyphs (lines, hooks, waves): what carries edges
    'stroke': 'ノ丿／|ー一―﹏∫ل乀丶亅乚乛㇏㇀⺁∼∽⌒⁀‿⸺⸻﹋﹌~〜〰）（〕〔｜‖¦╱╲⟋⟍⌇⌢⌣〳〵ㇾㇼㇺ乙巛彡',
}


def notdef_mask(font):
    return render(font, '\U0010FFFD')


def render(font, ch, S=384):
    im = Image.new('L', (S, S), 0)
    d = ImageDraw.Draw(im)
    try:
        d.text((S // 2, S // 2), ch, font=font, fill=255, anchor='mm')
    except Exception:
        return None
    return np.asarray(im)


def canon(a, out=128, fill=0.92):
    """crop to ink, rotate elongated glyphs so the main axis is horizontal, fit into out x out (max side = fill*out)"""
    a = a.astype(np.float32) / 255
    ys, xs = np.nonzero(a > 0.02)
    if len(xs) < 8:
        return None
    w = a[ys, xs]
    m = w.sum()
    cx, cy = (xs * w).sum() / m, (ys * w).sum() / m
    dx, dy = xs - cx, ys - cy
    cxx, cyy, cxy = (w * dx * dx).sum() / m, (w * dy * dy).sum() / m, (w * dx * dy).sum() / m
    tr, det = cxx + cyy, cxx * cyy - cxy * cxy
    l1 = tr / 2 + math.sqrt(max(tr * tr / 4 - det, 0))
    l2 = tr / 2 - math.sqrt(max(tr * tr / 4 - det, 0))
    elong = math.sqrt(l1 / max(l2, 1e-6))
    ang = 0.5 * math.atan2(2 * cxy, cxx - cyy)  # main axis angle (image coords, y down)
    if elong > 1.8:
        M = cv2.getRotationMatrix2D((float(cx), float(cy)), math.degrees(ang), 1.0)
        a = cv2.warpAffine(a, M, (a.shape[1], a.shape[0]), flags=cv2.INTER_LINEAR)
    ys, xs = np.nonzero(a > 0.02)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    c = a[y0:y1, x0:x1]
    h, w_ = c.shape
    k = fill * out / max(h, w_)
    nh, nw = max(1, round(h * k)), max(1, round(w_ * k))
    c = cv2.resize(c, (nw, nh), interpolation=cv2.INTER_AREA)
    o = np.zeros((out, out), np.float32)
    oy, ox = (out - nh) // 2, (out - nw) // 2
    o[oy:oy + nh, ox:ox + nw] = c
    return o, elong


def main(out):
    sprites, meta = [], []
    scripts = list(CHARS)
    for si, sc in enumerate(scripts):
        for fp in FONTS[sc]:
            if not os.path.exists(fp):
                print('missing font', fp); continue
            font = ImageFont.truetype(fp, 200)
            nd = notdef_mask(font)
            n0 = len(sprites)
            for ch in CHARS[sc]:
                a = render(font, ch)
                if a is None or a.max() < 64:
                    continue
                if nd is not None and nd.max() > 0 and np.array_equal(a, nd):
                    continue
                r = canon(a)
                if r is None:
                    continue
                o, elong = r
                sprites.append((o * 255).astype(np.uint8))
                meta.append((si, ch, os.path.basename(fp), elong))
            print(f'{sc:11s} {os.path.basename(fp):34s} {len(sprites) - n0}')
    A = np.stack(sprites)
    f = A.astype(np.float32) / 255
    desc = np.stack([cv2.resize(x, (16, 16), interpolation=cv2.INTER_AREA) for x in f]).reshape(len(f), -1)
    cov = f.mean(axis=(1, 2))
    np.savez_compressed(out, sprites=A, desc=desc.astype(np.float32), cov=cov.astype(np.float32),
                        script=np.array([m[0] for m in meta], np.int16), char=np.array([m[1] for m in meta]),
                        font=np.array([m[2] for m in meta]), elong=np.array([m[3] for m in meta], np.float32),
                        scripts=np.array(scripts))
    print('glyphs', len(A), '->', out)
    # proof sheet of the atlas
    n = len(A); cols = 64; rows = (n + cols - 1) // cols
    sheet = np.zeros((rows * 32, cols * 32), np.uint8)
    for i, x in enumerate(A):
        r, c = divmod(i, cols)
        sheet[r * 32:(r + 1) * 32, c * 32:(c + 1) * 32] = cv2.resize(x, (32, 32), interpolation=cv2.INTER_AREA)
    cv2.imwrite(out.replace('.npz', '_sheet.png'), sheet)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(ROOT, 'work_fable', 'take2', 'dev', 'v8_glyph', 'atlas.npz'))
