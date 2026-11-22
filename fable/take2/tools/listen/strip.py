"""Dense frame strips with the song's energy and the bar/beat grid drawn beneath, to read an arrival against its beat.

  .venv/bin/python fable/take2/tools/listen/strip.py MASTER.mp4 T0 T1 NAME [--step 2] [--sec-per-row 1.0]
        [--rows-per-page 8] [--thumb 160] [--marks t:label,...]

T0/T1 in film seconds (= song seconds). Every STEP-th frame is drawn, left edge at its presentation time, so a frame sits
exactly over the stretch of audio it is on screen for. Under each row: mix RMS dB (black), drums (red), vocal stem (green),
onset strength (grey fill), beat ticks (thin) and bar lines (thick, labelled bNNN), cyan marks for --marks.
Frame index and song time are printed on every 5th thumbnail.

Writes OUT/strips/NAME_pNN.png (likeness: these stay under work_fable/, never committed).
"""
import argparse
import os
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import common as C  # noqa: E402
import features as F  # noqa: E402


def frames(path, t0, t1, fps, step, tw):
    th = int(round(tw * 9 / 16))
    th += th % 2
    f0 = int(np.floor(t0 * fps))
    f1 = int(np.ceil(t1 * fps))
    # accurate input seek: the first decoded frame is the first with pts >= (f0 - 0.5) / fps, i.e. frame f0
    cmd = ['ffmpeg', '-v', 'error', '-ss', f'{max(0.0, (f0 - 0.5) / fps):.5f}', '-i', path, '-frames:v', str(f1 - f0), '-fps_mode', 'passthrough',
           '-vf', f'scale={tw}:{th}:flags=area', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-']
    raw = subprocess.check_output(cmd)
    n = len(raw) // (tw * th * 3)
    arr = np.frombuffer(raw[:n * tw * th * 3], np.uint8).reshape(n, th, tw, 3)
    idx = list(range(0, n, step))
    return [(f0 + i, arr[i]) for i in idx], th


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('mp4')
    ap.add_argument('t0', type=float)
    ap.add_argument('t1', type=float)
    ap.add_argument('name')
    ap.add_argument('--step', type=int, default=2)
    ap.add_argument('--sec-per-row', type=float, default=1.0)
    ap.add_argument('--rows-per-page', type=int, default=8)
    ap.add_argument('--thumb', type=int, default=160)
    ap.add_argument('--marks', default='')
    a = ap.parse_args()
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    from film_energy import fps_of
    fps = fps_of(a.mp4)
    fr, th = frames(a.mp4, a.t0, a.t1, fps, a.step, a.thumb)
    f = F.get()
    bt = C.beats()
    ft = f['t']
    marks = []
    for s in filter(None, a.marks.split(',')):
        tm, lab = s.split(':', 1)
        marks.append((float(tm), lab))
    od = os.path.join(C.RES, 'strips')
    os.makedirs(od, exist_ok=True)
    rows = []
    r0 = a.t0
    while r0 < a.t1 - 1e-6:
        rows.append((r0, min(a.t1, r0 + a.sec_per_row)))
        r0 += a.sec_per_row
    pages = [rows[i:i + a.rows_per_page] for i in range(0, len(rows), a.rows_per_page)]
    per_row = int(round(a.sec_per_row * fps / a.step))
    fig_w = per_row * a.thumb / 100 + 1.2
    onset = f['onset'] / np.percentile(f['onset'], 99)
    out = []
    for pi, pg in enumerate(pages):
        fig, axes = plt.subplots(len(pg) * 2, 1, figsize=(fig_w, len(pg) * (th / 100 + 1.15)),
                                 gridspec_kw=dict(height_ratios=[th / 100, 1.0] * len(pg)))
        axes = np.atleast_1d(axes)
        for ri, (r0, r1) in enumerate(pg):
            ai, ac = axes[2 * ri], axes[2 * ri + 1]
            span = a.sec_per_row
            for k, (fi, img) in enumerate([x for x in fr if r0 - 1e-6 <= x[0] / fps < r1 - 1e-6]):
                tl = fi / fps
                ai.imshow(img, extent=[tl, tl + a.step / fps, 0, 1], aspect='auto', interpolation='bilinear')
                if (fi // a.step) % 5 == 0:
                    ai.text(tl + 0.002, 0.04, f'{fi}\n{tl:.3f}', color='yellow', fontsize=6, va='bottom',
                            bbox=dict(facecolor='black', alpha=0.5, pad=0.5, lw=0))
            ai.set_xlim(r0, r0 + span)
            ai.set_ylim(0, 1)
            ai.set_yticks([])
            ai.set_xticks([])
            m = (ft >= r0) & (ft <= r0 + span)
            ac.fill_between(ft[m], -75, -75 + 40 * onset[m], color='0.8', lw=0)
            ac.plot(ft[m], f['mix_db'][m], 'k', lw=1)
            ac.plot(ft[m], f['drums_db'][m], color='tab:red', lw=0.7)
            ac.plot(ft[m], f['vocals_roformer_db'][m], color='tab:green', lw=0.7)
            ac.set_ylim(-75, 0)
            ac.set_xlim(r0, r0 + span)
            ac.set_yticks([])
            for i, b in enumerate(bt):
                if r0 - 0.001 <= b <= r0 + span:
                    down = i % 4 == 0
                    for axx in (ai, ac):
                        axx.axvline(b, color='white' if axx is ai else 'k', lw=2.2 if down else 0.8,
                                    ls='-' if down else '--', alpha=0.9)
                    ac.text(b + 0.004, -12, f'b{i // 4 + 1}.{i % 4 + 1}' if not down else f'b{i // 4 + 1}',
                            fontsize=8 if down else 6, weight='bold' if down else 'normal')
            for tm, lab in marks:
                if r0 <= tm <= r0 + span:
                    for axx in (ai, ac):
                        axx.axvline(tm, color='cyan', lw=1.5)
                    ac.text(tm + 0.004, -70, lab, fontsize=7, color='teal')
            ac.set_xticks(np.arange(np.ceil(r0 * 10) / 10, r0 + span, 0.1))
            ac.tick_params(labelsize=6)
            ac.set_ylabel(f'{r0:.1f}s\n{C.barbeat(r0, bt)}', fontsize=7, rotation=0, ha='right', va='center')
        fig.subplots_adjust(left=0.06, right=0.995, top=0.995, bottom=0.02, hspace=0.05)
        p = os.path.join(od, f'{a.name}_p{pi:02d}.png')
        fig.savefig(p, dpi=100)
        plt.close(fig)
        out.append(p)
    print('\n'.join(out))


if __name__ == '__main__':
    main()
