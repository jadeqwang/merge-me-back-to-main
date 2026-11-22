#!/usr/bin/env python3
"""v11 style 1 with a notation: runs the v9 animate.py (unchanged) with v11's paint11 (upright option) and a v11 atlas.

  work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/v11/s1.py --atlas NAME [--weights JSON] -- ANIMATE ARGS...
NAME: a notation in work_fable/take2/dev/v11_glyph/atlas/<NAME>.npz (natlas.py; e.g. corpus, hanzi, staff_violin) or 'v8' (the v9
all-scripts atlas). Weights default to notation.py's for that atlas. B1 size: pass --set 'sizes=[...]' --set 'focus_sizes=[...]'
(see v11/size.py). Upright glyphs: --set upright=true (default for every atlas but v8).
"""
import os, sys, json

HERE = os.path.dirname(os.path.abspath(__file__))
GA = os.path.dirname(HERE)
sys.path.insert(0, HERE); sys.path.insert(0, GA)
import paint11  # noqa: E402
sys.modules['paint'] = paint11          # animate.py's `import paint as P` gets the v11 painter

ATD = os.path.join(paint11.ROOT, 'work_fable/take2/dev/v11_glyph/atlas')
DEFAULT_W = {
    'corpus': {'latin': 2, 'cjk': 2, 'stroke': 2},
    'v8': {'stroke': 6, 'box': 2, 'cjk': 3, 'latin': 2, 'math': 2},
}


def main():
    argv = sys.argv[1:]
    k = argv.index('--') if '--' in argv else len(argv)
    own, rest = argv[:k], argv[k + 1:]
    name = own[own.index('--atlas') + 1]
    w = json.loads(own[own.index('--weights') + 1]) if '--weights' in own else None
    if w is None:
        w = DEFAULT_W.get(name)
        if w is None:
            import notation
            w = next(v[2] for v in notation.NOTATION.values() if v[1] == name)
    path = paint11.ATLAS if name == 'v8' else f'{ATD}/{name}.npz'
    Base = paint11.Atlas

    class Atlas11(Base):
        def __init__(self, path_=None, scripts=None, weights=None, max_cov=0.55, **kw):
            super().__init__(path, None, w, max_cov)
    paint11.Atlas = Atlas11
    if name != 'v8' and not any(a.startswith('upright=') for a in rest):
        rest += ['--set', 'upright=true']
    import animate
    sys.argv = ['animate.py'] + rest
    animate.main()
    # note the atlas in the plate's meta
    out = rest[rest.index('--out') + 1]
    mp = os.path.join(out, 'meta.json')
    if os.path.exists(mp):
        m = json.load(open(mp)); m.setdefault('glyph', {})['v11'] = dict(atlas=name, weights=w)
        m['src'] = m.get('src', '').replace('glyphart/animate.py', 'glyphart/v11/s1.py (animate.py + paint11)')
        json.dump(m, open(mp, 'w'))


if __name__ == '__main__':
    main()
