"""Shared helpers for the listen tools: song loading, bar map, features.

All times are song seconds from the first sample of inputs/Merge (keychange down).wav
(film time == song time; the film master starts at song 0).
"""
import json
import os
import re

import numpy as np

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..'))
SONG = os.path.join(ROOT, 'inputs', 'Merge (keychange down).wav')
STEMS = os.path.join(ROOT, 'analysis_v3', 'stems')
TIMING = os.path.join(ROOT, 'analysis_v3', 'timing.json')
SRT = os.path.join(ROOT, 'review', 'fable_take2', 'merge.en.srt')
OUT = os.path.join(ROOT, 'work_fable', 'take2', 'dev', 'v10_listen')  # features cache lives here
RES = os.environ.get('LISTEN_OUT', OUT)  # strips / film_energy outputs (set LISTEN_OUT=.../v11_listen for a new film)

SR = 22050
HOP = 256  # 11.6 ms


def timing():
    with open(TIMING) as f:
        return json.load(f)


def beats():
    """beat times (s); index i -> bar i//4+1, beat i%4+1."""
    return np.array(timing()['beat_grid']['beat_times'], float)


def barbeat(t, bt=None):
    """song seconds -> 'bar.beat' string with fractional beat (e.g. 122.1.00)."""
    bt = beats() if bt is None else bt
    i = np.searchsorted(bt, t + 1e-4, side="right") - 1
    if i < 0:
        return 'pre'
    if i >= len(bt) - 1:
        per = bt[-1] - bt[-2]
    else:
        per = bt[i + 1] - bt[i]
    frac = (t - bt[i]) / per
    return f'b{i // 4 + 1}.{i % 4 + 1 + frac:.2f}'


def nearest_beat(t, bt=None):
    bt = beats() if bt is None else bt
    i = int(np.argmin(np.abs(bt - t)))
    return i, bt[i], (t - bt[i]) * 1000.0


def load(path=SONG, sr=SR):
    import librosa
    y, _ = librosa.load(path, sr=sr, mono=True)
    return y


def rms_db(y, hop=HOP, frame=1024):
    import librosa
    r = librosa.feature.rms(y=y, frame_length=frame, hop_length=hop)[0]
    return 20 * np.log10(np.maximum(r, 1e-6))


def band_db(S_pow, freqs, lo, hi):
    m = (freqs >= lo) & (freqs < hi)
    return 10 * np.log10(np.maximum(S_pow[m].sum(0), 1e-10))


def srt_cues(path=SRT):
    def ts(s):
        h, m, rest = s.split(':')
        sec, ms = rest.split(',')
        return int(h) * 3600 + int(m) * 60 + int(sec) + int(ms) / 1000
    txt = open(path, encoding='utf-8').read()
    cues = []
    for blk in re.split(r'\n\s*\n', txt.strip()):
        lines = blk.strip().splitlines()
        if len(lines) < 2:
            continue
        mm = re.match(r'(\S+)\s*-->\s*(\S+)', lines[1])
        if not mm:
            continue
        cues.append((ts(mm.group(1)), ts(mm.group(2)), ' / '.join(lines[2:])))
    return cues
