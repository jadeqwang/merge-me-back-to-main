"""Picture against the song for a whole film master: visual energy vs audio energy, and every cut vs the beat grid.

  .venv/bin/python fable/take2/tools/listen/film_energy.py MASTER.mp4 TAG [TABLE.txt]

TABLE.txt = saved output of `node fable/take2/tools/shots.mjs --table` for the shots.js the master was rendered from
(default: run it on the working tree, which is only right if shots.js has not changed since the render).

Writes to OUT/film_TAG/:
  frames.npz      per-frame mean abs luma difference (0-255, at 192x108) and colour-histogram distance
  cuts.json       detected cuts (frame, time, bar.beat, ms to nearest beat and nearest bar line, matched shot-table id)
  cuts.md         the same as a markdown table, plus shot-table starts with no detected cut
  shots.json      per-shot visual energy (mean frame diff), audio energy (mean mix dB), cut density
  energy.png      one plot for the whole film
Also checks that the film's audio track is the song at offset 0 (cross-correlation of RMS envelopes).
"""
import json
import os
import re
import subprocess
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import common as C  # noqa: E402
import features as F  # noqa: E402

W, H = 192, 108


def decode(path):
    cmd = ['ffmpeg', '-v', 'error', '-i', path, '-vf', f'scale={W}:{H}:flags=area', '-f', 'rawvideo',
           '-pix_fmt', 'rgb24', '-']
    p = subprocess.Popen(cmd, stdout=subprocess.PIPE)
    diffs, hd, luma = [], [], []
    prev = None
    prevh = None
    n = W * H * 3
    while True:
        buf = p.stdout.read(n)
        if len(buf) < n:
            break
        fr = np.frombuffer(buf, np.uint8).reshape(H, W, 3).astype(np.int32)
        y = (fr[..., 0] * 77 + fr[..., 1] * 150 + fr[..., 2] * 29) >> 8
        q = (fr >> 5)
        h = np.bincount((q[..., 0] * 64 + q[..., 1] * 8 + q[..., 2]).ravel(), minlength=512).astype(float)
        h /= h.sum()
        if prev is None:
            diffs.append(0.0)
            hd.append(0.0)
        else:
            diffs.append(float(np.abs(y - prev).mean()))
            hd.append(float(0.5 * np.abs(h - prevh).sum()))
        luma.append(float(y.mean()))
        prev, prevh = y, h
    p.wait()
    return np.array(diffs), np.array(hd), np.array(luma)


def fps_of(path):
    r = subprocess.check_output(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                                 'stream=r_frame_rate', '-of', 'csv=p=0', path]).decode().strip()
    a, b = r.split('/')
    return float(a) / float(b)


def detect_cuts(d, hd, fps):
    """A cut = a frame whose histogram distance AND luma diff both stand far above their local neighbourhood."""
    cuts = []
    n = len(d)
    for i in range(1, n):
        lo, hi = max(1, i - 8), min(n, i + 9)
        nb = np.r_[hd[lo:i], hd[i + 1:hi]]
        nd = np.r_[d[lo:i], d[i + 1:hi]]
        if len(nb) == 0:
            continue
        sh = hd[i] / (np.median(nb) + 0.01)
        sd = d[i] / (np.median(nd) + 0.5)
        if (hd[i] > 0.25 and sh > 4 and sd > 2.5) or (hd[i] > 0.5 and sh > 2.5) or (d[i] > 25 and sd > 4):
            if cuts and i - cuts[-1] <= 2:  # keep the stronger of adjacent frames
                if hd[i] > hd[cuts[-1]]:
                    cuts[-1] = i
                continue
            cuts.append(i)
    return cuts


def shot_table(table_file=None):
    if table_file:
        out = open(table_file).read()
    else:
        out = subprocess.check_output(['node', os.path.join(C.ROOT, 'fable/take2/tools/shots.mjs'), '--table'],
                                      cwd=C.ROOT).decode()
    rows = []
    for ln in out.splitlines():
        m = re.match(r'^(\S+)\s+(\S+)\s+([\d.]+)-([\d.]+)\s', ln)
        if m:
            rows.append(dict(id=m.group(1), bars=m.group(2), start=float(m.group(3)), end=float(m.group(4))))
    return rows


def check_audio(path, f, od):
    import librosa
    wav = os.path.join(od, 'film_audio.wav')
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', path, '-vn', '-ac', '1', '-ar', str(C.SR), wav], check=True)
    y, _ = librosa.load(wav, sr=C.SR, mono=True)
    e = C.rms_db(y)
    s = f['mix_db']
    n = min(len(e), len(s))
    a = (e[:n] - e[:n].mean())
    b = (s[:n] - s[:n].mean())
    lags = range(-40, 41)
    cc = [np.dot(a[max(0, k):n + min(0, k)], b[max(0, -k):n - max(0, k)]) for k in lags]
    k = list(lags)[int(np.argmax(cc))]
    return k * C.HOP / C.SR * 1000.0


def main():
    path, tag = sys.argv[1], sys.argv[2]
    table_file = sys.argv[3] if len(sys.argv) > 3 else None
    od = os.path.join(C.OUT, f'film_{tag}')
    os.makedirs(od, exist_ok=True)
    fps = fps_of(path)
    cache = os.path.join(od, 'frames.npz')
    if os.path.exists(cache):
        z = np.load(cache)
        d, hd, luma = z['d'], z['hd'], z['luma']
    else:
        d, hd, luma = decode(path)
        np.savez_compressed(cache, d=d, hd=hd, luma=luma)
    t = np.arange(len(d)) / fps
    f = F.get()
    bt = C.beats()
    bars = bt[::4]
    audio_off = check_audio(path, f, od)
    shots = shot_table(table_file)
    starts = np.array([s['start'] for s in shots])
    cuts = detect_cuts(d, hd, fps)
    rows = []
    # each table start claims the nearest detected cut within 150 ms; other detections are internal events
    claim = {}
    for j, s0 in enumerate(starts):
        if j == 0 or not cuts:
            continue
        k = int(np.argmin([abs(i / fps - s0) for i in cuts]))
        if abs(cuts[k] / fps - s0) < 0.15:
            claim[k] = j
    for k, i in enumerate(cuts):
        tc = i / fps
        bi, tb, off = C.nearest_beat(tc, bt)
        ob = (tc - bars[np.argmin(np.abs(bars - tc))]) * 1000
        if k in claim:
            j, kind = claim[k], 'cut'
        else:
            j, kind = int(np.searchsorted(starts, tc + 1e-6) - 1), 'internal'
        dj = (tc - starts[j]) * 1000
        rows.append(dict(frame=i, t=round(tc, 3), bb=C.barbeat(tc, bt), beat=f'b{bi // 4 + 1}.{bi % 4 + 1}',
                         off_beat_ms=round(float(off), 1), off_bar_ms=round(float(ob), 1), kind=kind,
                         shot=shots[j]['id'], off_table_ms=round(float(dj), 1),
                         hist=round(float(hd[i]), 3), diff=round(float(d[i]), 1)))
    matched = {r['shot'] for r in rows if r['kind'] == 'cut'}
    unmatched_table = [s for s in shots[1:] if s['id'] not in matched]
    # per-shot energies
    S = []
    ft = f['t']
    for s in shots:
        m = (t >= s['start'] + 2 / fps) & (t < s['end'])
        ma = (ft >= s['start']) & (ft < s['end'])
        vis = float(np.mean(d[m])) if m.any() else float('nan')
        S.append(dict(id=s['id'], start=s['start'], end=s['end'], vis=round(vis, 2),
                      audio_db=round(float(np.mean(f['mix_db'][ma])), 1),
                      drums_db=round(float(np.mean(f['drums_db'][ma])), 1)))
    with open(os.path.join(od, 'cuts.json'), 'w') as fh:
        json.dump(dict(fps=fps, audio_offset_ms=audio_off, cuts=rows,
                       table_starts_without_detected_cut=unmatched_table), fh, indent=1)
    with open(os.path.join(od, 'shots.json'), 'w') as fh:
        json.dump(S, fh, indent=1)
    with open(os.path.join(od, 'cuts.md'), 'w') as fh:
        fh.write(f'film {path}, {fps:g} fps, audio offset vs song {audio_off:+.1f} ms, {len(rows)} detected cuts, '
                 f'{len(shots)} table shots\n\n| frame | t | bar.beat | ms to beat | ms to bar | table shot | ms vs table |'
                 '\n|---|---|---|---|---|---|---|\n')
        fh.write('(kind "internal" = a hard picture change inside a shot: flash exits, wipes, type slabs, fast motion;'
                 ' "ms vs table" is then the time since the shot start)\n\n')
        for r in rows:
            fh.write(f"| {r['frame']} | {r['t']:.3f} | {r['bb']} | {r['off_beat_ms']:+.0f} | {r['off_bar_ms']:+.0f} | "
                     f"{r['shot']}{'' if r['kind'] == 'cut' else ' (internal)'} | {r['off_table_ms']:+.0f} |\n")
        fh.write('\nTable starts with no detected cut (dissolves, match cuts, continuous plates):\n\n')
        for s in unmatched_table:
            fh.write(f"- {s['id']} {s['start']:.3f} ({C.barbeat(s['start'], bt)})\n")
    plot(od, t, d, f, S, rows, bt, fps)
    print(f'audio offset {audio_off:+.1f} ms; cuts {len(rows)}; table shots {len(shots)}; '
          f'table starts w/o cut {len(unmatched_table)}')


def plot(od, t, d, f, S, rows, bt, fps):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    T = C.timing()
    fig, ax = plt.subplots(3, 1, figsize=(30, 11), sharex=True, gridspec_kw=dict(height_ratios=[2.2, 2.2, 1]))
    k = int(fps)  # 1 s smoothing
    ds = np.convolve(d, np.ones(k) / k, mode='same')
    ax[0].plot(t, ds, color='tab:blue', lw=0.8, label='frame diff, 1 s mean')
    for s in S:
        ax[0].plot([s['start'], s['end']], [s['vis'], s['vis']], color='k', lw=2)
    ax[0].set_ylabel('visual energy\n(mean |dY|, 0-255)')
    ax[0].set_ylim(0, max(12, np.percentile(ds, 99.5) * 1.1))
    ax[0].legend(loc='upper left')
    ft = f['t']
    a = np.convolve(f['mix_db'], np.ones(86) / 86, mode='same')
    ax[1].plot(ft, a, color='tab:red', lw=1, label='mix RMS dB, 1 s mean')
    ax[1].plot(ft, np.convolve(f['drums_db'], np.ones(86) / 86, mode='same'), color='tab:orange', lw=0.7,
               label='drums stem')
    ax[1].plot(ft, np.convolve(f['vocals_roformer_db'], np.ones(86) / 86, mode='same'), color='tab:green', lw=0.7,
               label='vocal stem')
    for s in S:
        ax[1].plot([s['start'], s['end']], [s['audio_db'], s['audio_db']], color='k', lw=2)
    ax[1].set_ylim(-70, -5)
    ax[1].set_ylabel('audio dB')
    ax[1].legend(loc='lower center', ncol=3)
    # cut rate: cuts per 4 bars
    ct = np.array([r['t'] for r in rows if r['kind'] == 'cut'])
    bars = bt[::4]
    cr = [(bars[i], ((ct >= bars[i]) & (ct < bars[min(i + 4, len(bars) - 1)])).sum()) for i in range(0, len(bars) - 4, 1)]
    ax[2].step([c[0] for c in cr], [c[1] for c in cr], where='post', color='tab:purple')
    ax[2].set_ylabel('cuts per\nnext 4 bars')
    for c in ct:
        ax[2].axvline(c, color='grey', lw=0.4, alpha=0.6)
    for sec in T['sections']:
        for a_ in ax:
            a_.axvline(sec['start'], color='k', lw=1, ls='--')
        ax[0].text(sec['start'] + 0.5, ax[0].get_ylim()[1] * 0.92, sec['name'], fontsize=10)
    ax[2].set_xlim(0, t[-1])
    ax[2].set_xticks(np.arange(0, t[-1], 10))
    ax[2].set_xlabel('film = song seconds')
    fig.tight_layout()
    fig.savefig(os.path.join(od, 'energy.png'), dpi=60)
    plt.close(fig)


if __name__ == '__main__':
    main()
