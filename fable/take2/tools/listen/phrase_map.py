"""Mel-spectrogram panels with the bar map drawn on, plus an automatic event list, for a song range.

  .venv/bin/python fable/take2/tools/listen/phrase_map.py NAME T0 T1 [--marks t:label,...]

Writes OUT/spec_NAME.png (mix mel, vocal-stem mel, stem dB curves, onset strength; bar lines solid
and numbered, beats dotted, aligned lyric words and SRT cues marked) and OUT/events_NAME.json:
  hits      onset-strength peaks > 6x the range median, with bar.beat and ms from nearest beat
  vocal     vocal phrases (RoFormer vocal stem above -28 dB re its range max, gaps < 0.25 s bridged)
  dropouts  per-beat drums/bass dB drops >= 10 dB from the previous bar's level, and returns
"""
import argparse
import json
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import common as C  # noqa: E402
import features as F  # noqa: E402


def segs(mask, t, bridge=0.25, minlen=0.12):
    out = []
    i = 0
    n = len(mask)
    while i < n:
        if mask[i]:
            j = i
            while j < n and mask[j]:
                j += 1
            out.append([t[i], t[j - 1]])
            i = j
        else:
            i += 1
    merged = []
    for s in out:
        if merged and s[0] - merged[-1][1] < bridge:
            merged[-1][1] = s[1]
        else:
            merged.append(s)
    return [s for s in merged if s[1] - s[0] >= minlen]


def analyse(f, t0, t1, bt):
    t = f['t']
    m = (t >= t0) & (t <= t1)
    tt = t[m]
    ev = {}
    on = f['onset'][m]
    med = np.median(on)
    from scipy.signal import find_peaks
    pk, _ = find_peaks(on, height=6 * med, distance=int(0.15 * C.SR / C.HOP))
    hits = []
    for p in pk:
        i, tb, off = C.nearest_beat(tt[p], bt)
        hits.append(dict(t=round(float(tt[p]), 3), bb=C.barbeat(tt[p], bt), x_median=round(float(on[p] / med), 1),
                         nearest=f'b{i // 4 + 1}.{i % 4 + 1}', off_ms=round(float(off), 1),
                         low_db=round(float(f['low_db'][m][p]), 1)))
    ev['hits'] = hits
    v = f['vocals_roformer_db'][m]
    from scipy.ndimage import median_filter
    vs = median_filter(v, 5)
    thr = vs.max() - 28
    ev['vocal_threshold_db'] = round(float(thr), 1)
    ev['vocal'] = [dict(t_in=round(float(a), 3), bb_in=C.barbeat(a, bt), t_out=round(float(b), 3), bb_out=C.barbeat(b, bt),
                        dur=round(float(b - a), 2)) for a, b in segs(vs > thr, tt)]
    # per-beat stem levels
    rows = []
    for i in range(len(bt) - 1):
        if bt[i] < t0 - 2 or bt[i] > t1:
            continue
        mm = (t >= bt[i]) & (t < bt[i + 1])
        rows.append(dict(i=i, t=round(float(bt[i]), 3), bb=f'b{i // 4 + 1}.{i % 4 + 1}',
                         **{k: round(float(np.percentile(f[k + '_db'][mm], 90)), 1)
                            for k in ('mix', 'drums', 'bass', 'vocals_roformer', 'other')},
                         high=round(float(np.percentile(f['high_db'][mm], 90)), 1)))
    ev['beats'] = rows
    drops = []
    for k in ('drums', 'bass'):
        for a, b in zip(rows[4:], rows[8:]):
            pass
        for j in range(4, len(rows)):
            ref = np.median([r[k] for r in rows[j - 4:j]])
            if rows[j][k] <= ref - 10:
                drops.append(dict(stem=k, kind='out', bb=rows[j]['bb'], t=rows[j]['t'], db=rows[j][k], ref=float(ref)))
            elif rows[j][k] >= ref + 10:
                drops.append(dict(stem=k, kind='in', bb=rows[j]['bb'], t=rows[j]['t'], db=rows[j][k], ref=float(ref)))
    ev['dropouts'] = drops
    return ev


def render(f, t0, t1, bt, path, marks=()):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    T = C.timing()
    t = f['t']
    m = (t >= t0) & (t <= t1)
    tt = t[m]
    W = max(16, (t1 - t0) * 0.9)
    fig, ax = plt.subplots(5, 1, figsize=(W, 15), sharex=True,
                           gridspec_kw=dict(height_ratios=[3, 3, 2.2, 1.4, 0.8]))
    ext = [tt[0], tt[-1], 0, 128]
    ax[0].imshow(f['mel_mix'][:, m], aspect='auto', origin='lower', extent=ext, cmap='magma', vmin=-80, vmax=0)
    ax[0].set_ylabel('mix mel')
    ax[1].imshow(f['mel_voc'][:, m], aspect='auto', origin='lower', extent=ext, cmap='viridis', vmin=-80, vmax=0)
    ax[1].set_ylabel('vocal stem mel')
    cols = dict(mix='k', drums='tab:red', bass='tab:blue', vocals_roformer='tab:green', other='tab:orange')
    for k, c in cols.items():
        ax[2].plot(tt, f[k + '_db'][m], c, lw=1, label=k.replace('_roformer', ''))
    ax[2].plot(tt, f['high_db'][m] - 20, color='tab:purple', lw=0.8, label='>4k band (-20)')
    ax[2].set_ylim(-75, 0)
    ax[2].legend(loc='lower left', fontsize=8, ncol=6)
    ax[2].set_ylabel('dB')
    ax[3].plot(tt, f['onset'][m], 'k', lw=0.8)
    ax[3].set_ylabel('onset')
    # bar/beat lines
    for i, b in enumerate(bt):
        if b < t0 or b > t1:
            continue
        down = i % 4 == 0
        for a in ax[:4]:
            a.axvline(b, color='w' if a in ax[:2] else 'grey', lw=1.4 if down else 0.5,
                      ls='-' if down else ':', alpha=0.9 if down else 0.6)
        if down:
            ax[0].text(b + 0.03, 122, f'b{i // 4 + 1}', color='w', fontsize=11, weight='bold')
            ax[3].text(b + 0.03, ax[3].get_ylim()[1] * 0.85, f'{b:.2f}', fontsize=7)
    # lyrics words
    for ln in T['lyrics']['lines']:
        for w in ln['words']:
            if t0 <= w['start'] <= t1:
                ax[1].axvline(w['start'], color='yellow', lw=0.8, ymax=0.25)
                ax[1].text(w['start'], 8, w['w'], color='yellow', fontsize=9, rotation=0)
    for a_, b_, txt in C.srt_cues():
        if b_ < t0 or a_ > t1:
            continue
        ax[4].plot([max(a_, t0), min(b_, t1)], [0.5, 0.5], lw=6, color='tab:cyan')
        ax[4].text(max(a_, t0), 0.75, txt[:60], fontsize=8)
    ax[4].set_ylim(0, 1.2)
    ax[4].set_yticks([])
    ax[4].set_ylabel('srt')
    for ev in T['events']:
        if t0 <= ev['t'] <= t1:
            ax[2].text(ev['t'], -8, ev['type'], fontsize=8, color='m', rotation=90, va='top')
    for tm, lab in marks:
        for a in ax:
            a.axvline(tm, color='cyan', lw=1.2)
        ax[2].text(tm, -70, lab, color='c', fontsize=9, rotation=90, va='bottom')
    ax[-1].set_xlim(t0, t1)
    ax[-1].set_xticks(np.arange(np.ceil(t0), t1, 1.0))
    ax[-1].set_xlabel('song seconds')
    fig.tight_layout()
    fig.savefig(path, dpi=70)
    plt.close(fig)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('name')
    ap.add_argument('t0', type=float)
    ap.add_argument('t1', type=float)
    ap.add_argument('--marks', default='')
    a = ap.parse_args()
    marks = []
    for s in filter(None, a.marks.split(',')):
        tm, lab = s.split(':', 1)
        marks.append((float(tm), lab))
    f = F.get()
    bt = C.beats()
    os.makedirs(C.OUT, exist_ok=True)
    render(f, a.t0, a.t1, bt, os.path.join(C.OUT, f'spec_{a.name}.png'), marks)
    ev = analyse(f, a.t0, a.t1, bt)
    with open(os.path.join(C.OUT, f'events_{a.name}.json'), 'w') as fh:
        json.dump(ev, fh, indent=1)
    print('hits:')
    for h in ev['hits']:
        print(' ', h)
    print('vocal (thr %.1f dB):' % ev['vocal_threshold_db'])
    for v in ev['vocal']:
        print(' ', v)
    print('dropouts:')
    for d in ev['dropouts']:
        print(' ', d)


if __name__ == '__main__':
    main()
