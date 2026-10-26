#!/usr/bin/env python3
"""Reference engraving of engine/show/score_orch.json with LilyPond (an independent engraver to check FX.score against).
usage: python3 tools/orch_tx/to_lilypond.py OUT_DIR   -> OUT_DIR/orch_reference.ly and .png (needs `lilypond` on PATH)"""
import json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
S = json.load(open(os.path.join(ROOT, 'engine/show/score_orch.json')))
DUR = {('whole', 0): '1', ('half', 1): '2.', ('half', 0): '2', ('quarter', 1): '4.', ('quarter', 0): '4', ('eighth', 1): '8.', ('eighth', 0): '8', ('16th', 0): '16'}


def ly_pitch(p):
    name, octv = p[:-1], int(p[-1])
    s = name[0].lower() + ('is' if name.endswith('#') else 'es' if name.endswith('b') else '')
    d = octv - 3
    return s + ("'" * d if d > 0 else ',' * -d)


def voice(items, first=137, last=144):
    out = []
    for b in range(first, last + 1):
        bar = []
        for it in [x for x in items if x['bar'] == b]:
            d = DUR[(it['value'], it['dots'])]
            if it['kind'] == 'rest':
                bar.append(('R' if it['value'] == 'whole' and it['dur16'] == 16 else 'r') + d)
                continue
            g = f"\\acciaccatura {ly_pitch(it['grace'])}8 " if it.get('grace') else ''
            tie = '~' if it.get('tie') in ('start', 'continue') else ''
            bar.append(f"{g}{ly_pitch(it['written'])}{d}{tie}")
        out.append(' '.join(bar) + f' | % {b}')
    return '\n    '.join(out) + '\n'


def lyrics(items, first=137, last=144):
    out = []
    for it in items:
        if it['kind'] != 'note' or not (first <= it['bar'] <= last) or not it.get('sounds'): continue
        out.append(f"\"{it['lyric']}\"" if it.get('lyric') else '_')
    return ' '.join(out)


def main(od):
    os.makedirs(od, exist_ok=True)
    P = {p['id']: p for p in S['parts']}
    up = [L for L in P['voice']['layers'] if L['id'] == 'upper'][0]['items']
    lo = [L for L in P['voice']['layers'] if L['id'] == 'lower'][0]['items']
    keys = P['keys']['layers'][0]['items']; gtr = P['guitar']['layers'][0]['items']
    # bars 137 and 144: the upper layer is silent -> spacer rests (the lead is a single voice there)
    up_ly = 's1 | % 137\n    ' + voice(up, 138, 143) + '    s1 | % 144\n'
    chords = ' '.join({'Gadd9': 'g1:add9', 'Bm7': 'b1:m7'}[c['symbol']] for c in P['keys']['chords'])
    ly = f'''\\version "2.24.0"
\\header {{ title = "Merge — outro orchestra, bars 137–144" subtitle = "transcription (engine/show/score_orch.json), 138 BPM" tagline = ##f }}
\\paper {{ indent = 32\\mm }}
\\layout {{ \\context {{ \\Score \\override BarNumber.break-visibility = ##(#t #t #t) }} }}
global = {{ \\key d \\major \\time 4/4 \\set Score.currentBarNumber = #137 }}
\\score {{
  <<
    \\new Staff \\with {{ instrumentName = \\markup \\center-column {{ "Voice" "(violin doubles)" }} }} <<
      \\global
      \\new Voice = "up" {{ \\voiceOne \\relative c'' {{ }} {up_ly} }}
      \\new Voice = "lo" {{ \\voiceTwo
    {voice(lo)} }}
    >>
    \\new Lyrics \\lyricsto "lo" {{ {lyrics(lo)} }}
    \\new ChordNames {{ g1 g1 g1 g1 b1:m7 b1:m7 b1:m7 b1:m7 }}
    \\new Staff \\with {{ instrumentName = \\markup \\center-column {{ "Keys" "(piano)" }} }} {{ \\global
    {voice(keys)} }}
    \\new Staff \\with {{ instrumentName = \\markup \\center-column {{ "E. Guitar" "(= bass)" }} }} {{ \\global \\clef "treble_8"
    {voice(gtr)} }}
  >>
  \\layout {{ }}
}}
'''
    ly = ly.replace('\\new ChordNames { g1 g1 g1 g1 b1:m7 b1:m7 b1:m7 b1:m7 }', '\\new ChordNames { \\chordmode { g1:5.9 g1:5.9 g1:5.9 g1:5.9 b1:m7 b1:m7 b1:m7 b1:m7 } }')
    ly = ly.replace("\\relative c'' { } ", '')
    p = os.path.join(od, 'orch_reference.ly'); open(p, 'w').write(ly)
    subprocess.run(['lilypond', '-dresolution=160', '--png', '-o', os.path.join(od, 'orch_reference'), p], check=True)
    print('wrote', p)


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else '.')
