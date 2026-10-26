#!/usr/bin/env python3
"""Write engine/fonts/bravura_glyphs.json: the few SMuFL glyph outlines FX.score draws (clefs, noteheads, accidentals, rests, flags, dot, 4),
taken from Bravura as shipped in the `verovio` Python package (verovio/data/Bravura/<codepoint>.xml + Bravura.xml bounding boxes).
Bravura: copyright Steinberg Media Technologies GmbH, SIL Open Font License 1.1 (https://openfontlicense.org); the notice travels in the JSON.
Units: font units, 1000 per em = 4 staff spaces (250 per space), y up, origin as SMuFL defines it for each glyph.
usage: python3 tools/orch_tx/make_glyphs.py"""
import json, os, re
import verovio
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
D = os.path.join(os.path.dirname(verovio.__file__), 'data')
WANT = dict(gClef='E050', gClef8vb='E052', noteheadWhole='E0A2', noteheadHalf='E0A3', noteheadBlack='E0A4', accidentalFlat='E260',
            accidentalNatural='E261', accidentalSharp='E262', timeSig4='E084', restWhole='E4E3', restHalf='E4E4', restQuarter='E4E5',
            rest8th='E4E6', rest16th='E4E7', flag8thUp='E240', flag8thDown='E241', flag16thUp='E242', flag16thDown='E243', augmentationDot='E1E7')
meta = open(os.path.join(D, 'Bravura.xml')).read()
out = dict(font='Bravura (SMuFL)', license='Copyright (c) Steinberg Media Technologies GmbH. Licensed under the SIL Open Font License 1.1.',
           source=f'verovio {verovio.__version__ if hasattr(verovio, "__version__") else ""} data/Bravura', unitsPerSpace=250, glyphs={})
for name, cp in WANT.items():
    svg = open(os.path.join(D, 'Bravura', cp + '.xml')).read()
    d = re.search(r' d="([^"]+)"', svg).group(1)
    g = re.search(r'<g c="%s" x="([-\d.]+)" y="([-\d.]+)" w="([-\d.]+)" h="([-\d.]+)" h-a-x="([-\d.]+)"' % cp, meta)
    x, y, w, h, adv = map(float, g.groups())
    out['glyphs'][name] = dict(cp=cp, d=d, bbox=[x, y, w, h], adv=adv)
p = os.path.join(ROOT, 'engine/fonts/bravura_glyphs.json')
json.dump(out, open(p, 'w'), separators=(',', ':'))
print('wrote', os.path.relpath(p, ROOT), os.path.getsize(p), 'bytes,', len(out['glyphs']), 'glyphs')
