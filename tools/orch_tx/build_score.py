#!/usr/bin/env python3
"""Build engine/show/score_orch.json: the transcription of the outro orchestra section (bars 137-144, film 236.5-249.4 s) that FX.score draws.

The measured events below come from the analysis in docs/orchestra_transcription.md (method, tools, numbers): every onset was located on the
song's real grid (analysis_v2/timing.json, 4/4 at 138 BPM) and every pitch was measured, not assumed. This script only (1) turns those events
into engraved notation (ties at beats/bar lines, rests, beams, stems, accidentals against the key signature) and (2) attaches song times.

Positions are 16ths inside a bar (0..15); a duration that runs past the bar end continues into the next bar (tied).
Key: B minor / D major, two sharps. Every pitch in these bars is diatonic, so no accidentals are printed (the key signature carries F# and C#).

usage: python3 tools/orch_tx/build_score.py            (writes engine/show/score_orch.json; prints a bar-by-bar summary)
"""
import json, os, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TIM = json.load(open(os.path.join(ROOT, 'analysis_v2/timing.json')))
BARS = {b['bar']: (b['start'], b['end']) for b in TIM['bars']}
FIRST, LAST = 137, 144            # the orchestra block
KEY_FIFTHS = 2                    # D major / B minor
NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
STEP = {'C': 0, 'D': 1, 'E': 2, 'F': 3, 'G': 4, 'A': 5, 'B': 6}
KEY_ALTER = {'F': 1, 'C': 1}      # two sharps


def midi(name):                   # 'C#5' -> 73
    p, o = (name[:-1], int(name[-1]))
    return 12 * (o + 1) + NAMES.index(p)


def t_of(bar, pos):               # song time of a 16th position (bar start + pos/16 of the bar; the engine's bb() is linear inside a bar too)
    while pos >= 16: bar, pos = bar + 1, pos - 16
    a, b = BARS[bar]
    return round(a + (b - a) * pos / 16, 4)


# ---------------------------------------------------------------------------------------------------------------------- measured events
# (pitch, bar, pos16, dur16, measured onset s, measured offset s, extra)   extra: grace=<pitch> (on-beat scoop from that note), lyric=...
# VOICE, lower layer = the lead singer (torchcrepe full + pYIN agree within 12 cents on every note; onsets from the pitch-track changes).
VOICE_LOWER = [
    # bar 136 pickup (context only: "Back to main" #1 starts on beat 3 of bar 136; the orchestra block starts at bar 137)
    ('E4', 136, 8, 1, 235.75, 235.89, dict(lyric='Back')), ('F#4', 136, 9, 2, 235.91, 236.08, {}),
    ('E4', 136, 11, 2, 236.09, 236.20, dict(lyric='to')), ('D4', 136, 13, 3, 236.30, 236.59, dict(lyric='main')),
    # 137: the melisma on "main" (E4 on the downbeat, D4 on the "and", B3 from beat 2), the B3 held into bar 138 (its final [n] to 238.55)
    ('E4', 137, 0, 2, 236.62, 236.86, {}), ('D4', 137, 2, 2, 236.86, 237.08, {}), ('B3', 137, 4, 14, 237.10, 238.55, {}),
    # 138-139: the wordless line, "ooh": C#4 from the "and" of 1 (after the [n] of "main"), D4 on the downbeat of 139
    ('C#4', 138, 2, 14, 238.60, 240.13, dict(lyric='ooh')), ('D4', 139, 0, 16, 240.13, 241.88, {}),
    # 140: the leap. On-beat scoop G4 -> A4 (241.89 -> 242.03), A4 held to the "and" of 4 (under the upper voice's E5), then F#4 anticipating bar 141
    ('A4', 140, 0, 14, 241.89, 243.36, dict(grace='G4')), ('F#4', 140, 14, 38, 243.40, 247.50, {}),
    # 144: "Back to main" #2 (lead): Back = E4 on the "and" of 2 scooping to F#4, to = E4 on the "and" of 3, main = D4 on beat 4 (held into 145)
    ('E4', 144, 6, 1, 249.47, 249.62, dict(lyric='Back')), ('F#4', 144, 7, 3, 249.63, 249.89, {}),
    ('E4', 144, 10, 2, 249.92, 250.08, dict(lyric='to')), ('D4', 144, 12, 4, 250.15, 250.48, dict(lyric='main', tie_out=True)),
]
# VOICE, upper layer = a second sung layer an octave above (C#5/D5/F#5) that moves on its own: it changes B4 -> C#5 on the bar line 238.38
# while the lead still holds B3 to 238.55, sings E5 over the lead's held A4 (242.75-243.36) and holds F#5 0.65 s after the lead's F#4 ends.
VOICE_UPPER = [
    ('C#5', 138, 0, 16, 238.38, 240.10, {}), ('D5', 139, 0, 16, 240.10, 241.88, {}),
    ('A5', 140, 0, 8, 241.88, 242.70, dict(grace='G5')), ('E5', 140, 8, 6, 242.75, 243.36, {}),
    ('F#5', 140, 14, 44, 243.38, 248.15, {}),
]
# KEYS: a synth line on the dotted-8th grid (16ths 0, 3, 6, 9, 12 of every bar = 3+3+3+3+4): A4 in bars 137-141 and 143, C#5 in 142 and 144.
# Measured on basic-pitch onset activations of the htdemucs_6s "other" stem (docs/orchestra_transcription.md, keys).
KEYS_LINE = {137: 'A4', 138: 'A4', 139: 'A4', 140: 'A4', 141: 'A4', 142: 'C#5', 143: 'A4', 144: 'C#5'}
KEYS_CONF = {137: 'medium', 138: 'medium', 139: 'medium', 140: 'medium', 141: 'low', 142: 'high', 143: 'high', 144: 'high'}
CHORDS = [(137, 0, 'Gadd9'), (141, 0, 'Bm7')]        # the sustained pad under the line (G3 B3 D4 G4 A4 B4 D5 / B3 D4 F#4 A4 B4 D5)
# BASS DRIVE (the guitar doubles it): the bass synth (G1+G2 / B1+B2 octaves) is gated by the kick: silent on each beat, on from the "and"
# (16th 2 of each beat) to the next beat = offbeat 8ths. G for bars 137-140, B from the first offbeat of 141.
BASS_ROOT = {137: 'G2', 138: 'G2', 139: 'G2', 140: 'G2', 141: 'B2', 142: 'B2', 143: 'B2', 144: 'B2'}


# ---------------------------------------------------------------------------------------------------------------------- engraving rules
VALUES = {16: ('whole', 0), 12: ('half', 1), 8: ('half', 0), 6: ('quarter', 1), 4: ('quarter', 0), 3: ('eighth', 1), 2: ('eighth', 0), 1: ('16th', 0)}


def allowed(pos, n):
    """may one engraved note/rest start at 16th `pos` and last `n` 16ths inside a 4/4 bar? (beats stay visible; the middle of the bar is shown
    except for a half on beat 2 or a dotted half from beat 2 to the bar end, the usual syncopations)"""
    if n not in VALUES or pos + n > 16: return False
    if pos % 4:                                   # starts off the beat: must end by the next beat
        return pos + n <= (pos // 4 + 1) * 4
    if n in (1, 2, 3, 4): return True             # inside one beat
    if n == 6: return pos in (0, 8)               # dotted quarter on beat 1 or 3
    if n == 8: return pos in (0, 4, 8)            # half on beats 1, 2 (syncopation), 3
    if n == 12: return pos in (0, 4)              # dotted half from beat 1 or 2
    if n == 16: return pos == 0
    return False


def allowed_rest(pos, n):
    """rests show every beat: a whole rest for an empty bar, half rests on beats 1 and 3, quarter rests on beats, 8th / 16th rests inside a
    beat on the 8th / 16th grid, no dotted rests"""
    if n == 16: return pos == 0
    if n == 8: return pos in (0, 8)
    if n == 4: return pos % 4 == 0
    if n == 2: return pos % 2 == 0
    return n == 1


def split(pos, n, rest=False):
    """greedy: the longest allowed value at each step"""
    out = []
    ok = allowed_rest if rest else allowed
    while n > 0:
        for v in (16, 12, 8, 6, 4, 3, 2, 1):
            if v <= n and ok(pos, v) and allowed(pos, v) | rest: out.append((pos, v)); pos += v; n -= v; break
        else: raise ValueError((pos, n))
    return out


def spell(p):
    """scientific pitch -> (letter, alter, octave) with sharps (D major)"""
    name, octv = p[:-1], int(p[-1])
    return name[0], (1 if name.endswith('#') else -1 if name.endswith('b') else 0), octv


def staff_step(p, clef):
    """diatonic steps above the bottom staff line (treble: E4 = 0; treble_8vb is written an octave up, so the same positions)"""
    L, _, o = spell(p)
    return (o * 7 + STEP[L]) - (4 * 7 + STEP['E'])


def engrave_voice(events, clef, first=FIRST, last=LAST, transpose=0, stem=None, fill_rests=True):
    """events -> per-bar engraved items (notes with ties, rests), song times, accidentals vs key + bar-local alterations"""
    items = []
    by_bar = {b: [] for b in range(first - 1, last + 2)}
    for ev in events:
        p, bar, pos, n, mon, moff, extra = ev
        written = p if not transpose else (lambda m: f'{NAMES[m % 12]}{m // 12 - 1}')(midi(p) + transpose)
        chain = []
        b, q, left = bar, pos, n
        while left > 0:
            take = min(left, 16 - q)
            for (sp, sv) in split(q, take): chain.append((b, sp, sv))
            left -= take; b, q = b + 1, 0
        for i, (b, sp, sv) in enumerate(chain):
            tie = None
            if len(chain) > 1: tie = 'start' if i == 0 else ('stop' if i == len(chain) - 1 else 'continue')
            if i == len(chain) - 1 and extra.get('tie_out'): tie = 'continue' if tie else 'start'
            it = dict(kind='note', bar=b, pos=sp, dur16=sv, value=VALUES[sv][0], dots=VALUES[sv][1], pitch=p, written=written, midi=midi(p),
                      tie=tie, t=t_of(b, sp), t_end=t_of(b, sp + sv), sounds=(i == 0))
            if i == 0:
                if mon is not None: it.update(t_meas=mon, t_meas_end=moff, dev_ms=round((mon - t_of(bar, pos)) * 1000))
                if extra.get('grace'): it['grace'] = extra['grace'] if not transpose else None
                if extra.get('lyric'): it['lyric'] = extra['lyric']
            if stem: it['stem'] = stem
            by_bar.setdefault(b, []).append(it)
    for b in sorted(by_bar):
        if b < first - 1 or b > last: continue
        notes = sorted(by_bar[b], key=lambda x: x['pos'])
        # accidentals: the key signature carries F#, C#; a note needs a sign when its alteration differs from what is in force at that
        # staff position in this bar (key or an earlier accidental); a tied continuation never repeats its sign
        force = {}
        for it in notes:
            L, alt, o = spell(it['written'])
            cur = force.get((L, o), KEY_ALTER.get(L, 0))
            it['accidental'] = None
            if alt != cur and it['tie'] not in ('stop', 'continue'):
                it['accidental'] = {1: 'sharp', -1: 'flat', 0: 'natural'}[alt]
            force[(L, o)] = alt
            it['step'] = staff_step(it['written'], clef)
        # rests in the gaps (16ths not covered by a note)
        if fill_rests and first <= b <= last:
            cov = [False] * 16
            for it in notes:
                for k in range(it['pos'], it['pos'] + it['dur16']): cov[k] = True
            k = 0
            while k < 16:
                if cov[k]: k += 1; continue
                j = k
                while j < 16 and not cov[j]: j += 1
                for (sp, sv) in split(k, j - k, rest=True):
                    notes.append(dict(kind='rest', bar=b, pos=sp, dur16=sv, value=VALUES[sv][0] if sv != 16 else 'whole', dots=VALUES[sv][1],
                                      t=t_of(b, sp), t_end=t_of(b, sp + sv), **({'stem': stem} if stem else {})))
                k = j
        items += sorted(notes, key=lambda x: x['pos'])
    return items


def beams(items):
    """beam 8ths/16ths (notes only) inside each beat; returns items with beam group ids"""
    gid = 0
    groups = {}
    for it in items:
        if it['kind'] != 'note' or it['value'] not in ('eighth', '16th'): continue
        groups.setdefault((it['bar'], it['pos'] // 4, it.get('stem')), []).append(it)
    for k, g in sorted(groups.items(), key=lambda kv: (kv[0][0], kv[0][1])):
        if len(g) < 2: continue
        # a group is beamable only if its notes are contiguous inside the beat (no rest between)
        g = sorted(g, key=lambda x: x['pos'])
        if any(g[i]['pos'] + g[i]['dur16'] != g[i + 1]['pos'] for i in range(len(g) - 1)): continue
        gid += 1
        for it in g: it['beam'] = gid
    return items


def stems_single(items, mid_step=4):
    """single-voice stems: by the furthest note of a beam group from the middle line, else per note (middle line and above = down)"""
    groups = {}
    for it in items:
        if it['kind'] == 'note' and it.get('beam'): groups.setdefault(it['beam'], []).append(it)
    for g in groups.values():
        far = max(g, key=lambda x: abs(x['step'] - mid_step))
        d = 'down' if far['step'] >= mid_step else 'up'
        for it in g: it['stem'] = d
    for it in items:
        if it['kind'] == 'note' and 'stem' not in it: it['stem'] = 'down' if it['step'] >= mid_step else 'up'
    return items


def main():
    S = lambda b, pos: t_of(b, pos)
    parts = []
    # ---- voice (two layers on one treble staff; the upper layer only sounds in bars 138-143)
    lower = engrave_voice(VOICE_LOWER, 'treble', stem='down')
    upper = engrave_voice(VOICE_UPPER, 'treble', stem='up')
    one = {137, 144, 136}                                        # bars where only the lead sings: a single voice with normal stems
    upper = [it for it in upper if it['bar'] not in one]
    for it in upper + lower: it['poly'] = it['bar'] not in one     # a two-voice bar: voice 1 stems/ties/rests up, voice 2 down
    for it in lower:
        if it['bar'] in one: it.pop('stem', None)
    lower = beams(lower); upper = beams(upper)
    stems_single([it for it in lower if it['bar'] in one])      # single-voice bars get normal stems; bars 138-143 keep the voice-2 stems (down)
    voice = dict(id='voice', instrument='Voice (wordless line) — the violin doubles it', short='Vln. = voice', player='violin',
                 clef='treble', key=dict(fifths=KEY_FIFTHS, name='B minor / D major'), time='4/4',
                 source='vocal stem (review/cloud/audio/Merge_vocals_320k.mp3)',
                 layers=[dict(id='upper', stem='up', items=upper, note='second sung layer an octave above, bars 138-143'),
                         dict(id='lower', stem='down', items=lower, note='the lead: "main" (137), "ooh" (138-143), "Back to main" #2 (144)')],
                 flies=dict(from_bar=138, note='the violin doubles the wordless line from bar 138; bar 137 is the lyric "main" (no flight)'),
                 confidence={str(b): c for b, c in {137: 'high', 138: 'high', 139: 'high', 140: 'high', 141: 'high', 142: 'high', 143: 'high', 144: 'medium'}.items()})
    parts.append(voice)
    # ---- keys (single voice: the dotted-8th line) + chord symbols for the sustained pad
    kev = []
    for b in range(FIRST, LAST + 1):
        for k, (pos, n) in enumerate(((0, 3), (3, 3), (6, 3), (9, 3), (12, 4))):
            kev.append((KEYS_LINE[b], b, pos, n, None, None, {}))
    keys = stems_single(beams(engrave_voice(kev, 'treble')))
    for it in keys:
        if it['kind'] == 'note': it['conf'] = KEYS_CONF[it['bar']]
    parts.append(dict(id='keys', instrument='Keys (synth line + pad) — the piano plays it', short='Pno. = synth', player='piano', clef='treble',
                      key=dict(fifths=KEY_FIFTHS, name='B minor / D major'), time='4/4', source='htdemucs_6s "other" stem of the mix',
                      layers=[dict(id='line', items=keys)],
                      chords=[dict(bar=b, pos=p, symbol=s, t=S(b, p)) for b, p, s in CHORDS],
                      confidence={str(b): KEYS_CONF[b] for b in range(FIRST, LAST + 1)},
                      not_notated='a 16th-note inner arpeggiation of the chord tones is audible but its note order is not recoverable under the drop'))
    # ---- guitar = the bass drive, offbeat 8ths, sounding G2/B2, written an octave up (treble clef with an 8 below)
    gev = []
    for b in range(FIRST, LAST + 1):
        for beat in range(4):
            gev.append((BASS_ROOT[b], b, beat * 4 + 2, 2, None, None, {}))
    gtr = stems_single(beams(engrave_voice(gev, 'treble_8vb', transpose=12)))
    parts.append(dict(id='guitar', instrument='E. Guitar — doubles the bass synth (no guitar in the mix)', short='Gtr. = bass', player='guitar',
                      clef='treble_8vb', transposition=-12, key=dict(fifths=KEY_FIFTHS, name='B minor / D major'), time='4/4',
                      source='htdemucs_6s "bass" stem (G1+G2 / B1+B2 octaves, sidechain-gated on every beat)',
                      layers=[dict(id='drive', items=gtr)],
                      confidence={str(b): 'high' for b in range(FIRST, LAST + 1)}))
    out = dict(
        title='Merge, outro orchestra (bars 137-144): transcription', made_by='tools/orch_tx/build_score.py', doc='docs/orchestra_transcription.md',
        time='4/4', bpm=138.0, key=dict(fifths=KEY_FIFTHS, name='B minor / D major (two sharps)'),
        bars={str(b): dict(start=BARS[b][0], end=BARS[b][1]) for b in range(FIRST - 1, LAST + 2)},
        fields=dict(pos='16th inside the bar (0-15)', dur16='engraved length in 16ths', beat='1-based beat (fractional) = 1 + pos/4',
                    t='song time of the engraved onset (grid, s)', t_meas='measured onset of a sounding note (s)', pitch='sounding pitch (scientific)',
                    written='written pitch (differs only for the guitar: an octave up)', step='diatonic steps above the bottom staff line of the written note',
                    tie='start / continue / stop', poly='voice part: a two-voice bar (layer stems, ties and rests by voice)', accidental='printed accidental (null: none needed with the key signature)', sounds='true on the first note of a tie chain'),
        violin_like='none: no bowed-string or vibrato instrument in the mix; the violinist plays the sung line', parts=parts)
    for p in parts:
        for L in p['layers']:
            for it in L['items']: it['beat'] = round(1 + it['pos'] / 4, 4)
    path = os.path.join(ROOT, 'engine/show/score_orch.json')
    json.dump(out, open(path, 'w'), indent=None, separators=(',', ':'))
    # summary
    for p in parts:
        print(f"== {p['id']} ({p['clef']})")
        for L in p['layers']:
            for b in range(FIRST, LAST + 1):
                row = [f"{'r' if it['kind'] == 'rest' else it['written']}:{it['value']}{'.' * it['dots']}{'~' if it.get('tie') in ('start', 'continue') else ''}"
                       for it in L['items'] if it['bar'] == b]
                if row: print(f"   {L['id']:6s} {b}: " + ' '.join(row))
    print('wrote', os.path.relpath(path, ROOT), os.path.getsize(path), 'bytes')


if __name__ == '__main__':
    main()
