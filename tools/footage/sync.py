#!/usr/bin/env python3
"""Auto-sync Jade's phone clips to the song (v6 footage intake, step 1).

She films with "Merge" playing out loud from a speaker, sings along full voice, and claps once on camera at the start. So every clip's
audio contains the song (through the room and the phone mic). This finds where each clip sits in the song:

    song_time = clip_time + s0

    python3 tools/footage/sync.py CLIP_OR_DIR ... [--song=inputs/Merge.wav] [--out=work/footage/sync.json]

Method (numpy only, plus ffmpeg to decode):
  1. coarse: onset-strength envelopes (log-mel spectral flux, 100 frames/s, 24 bands 150 Hz-6 kHz) of the clip and the song,
     normalised cross-correlation over every lag (FFT). Robust to the room, the speaker's EQ and her voice on top.
  2. fine: GCC-PHAT on the 16 kHz waveforms in a +/-60 ms window around the coarse lag -> sub-millisecond offset.
  3. confidence: the coarse peak's normalised correlation, and its ratio to the best peak more than 1 s away. Below the thresholds
     (a silent take: A4, H2, the silent B8s; or the song too quiet) the clip is flagged "place by hand".
  4. the clap: the clip's strongest broadband transient in its first 10 s (reported in clip and song time, a check for the eye).
Writes/merges work/footage/sync.json {take: {file, s0, corr, ratio, ok, clap_clip, clap_song, dur, shot, take_n}} and prints a table.
Clip names follow the shot list: <ID>_t<N>.<ext> (A1_t2.mov); the ID becomes the slot (engine/show/v6_slots.json).
"""
import json, os, re, subprocess, sys
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FF = os.environ.get('FFMPEG', 'ffmpeg')
SR = 16000
HOP = SR // 100            # 100 envelope frames per second
NFFT = 1024
EXTS = ('.mov', '.mp4', '.m4v', '.MOV', '.MP4', '.M4V')
CORR_MIN, RATIO_MIN = .25, 1.35


def decode(path, sr=SR):
    """mono float32 at sr (first audio stream)"""
    r = subprocess.run([FF, '-v', 'error', '-i', path, '-vn', '-ac', '1', '-ar', str(sr), '-f', 'f32le', '-'], capture_output=True)
    if r.returncode != 0:
        raise RuntimeError(f'ffmpeg could not decode audio from {path}: {r.stderr.decode()[-300:]}')
    return np.frombuffer(r.stdout, np.float32).copy()


def mel_fb(n_bands=24, fmin=150., fmax=6000.):
    mel = lambda f: 2595 * np.log10(1 + f / 700)
    imel = lambda m: 700 * (10 ** (m / 2595) - 1)
    edges = imel(np.linspace(mel(fmin), mel(fmax), n_bands + 2))
    bins = np.fft.rfftfreq(NFFT, 1 / SR)
    fb = np.zeros((n_bands, len(bins)), np.float32)
    for i in range(n_bands):
        a, b, c = edges[i], edges[i + 1], edges[i + 2]
        fb[i] = np.clip(np.minimum((bins - a) / (b - a), (c - bins) / (c - b)), 0, None)
    return fb


FB = mel_fb()


def envelope(x):
    """onset strength at 100 Hz per band (bands x frames): half-wave rectified log-mel flux, detrended and normalised per band. Kept per band
    so the correlation sees timbre too (the build and the drop share a four-on-the-floor; their band balance differs)"""
    n = 1 + max(0, (len(x) - NFFT) // HOP)
    idx = np.arange(NFFT)[None, :] + HOP * np.arange(n)[:, None]
    fr = np.pad(x, (0, NFFT))[idx] * np.hanning(NFFT)[None, :].astype(np.float32)
    S = np.log1p(1000 * (FB @ (np.abs(np.fft.rfft(fr, axis=1)) ** 2).T))      # bands x frames
    flux = np.maximum(0, np.diff(S, axis=1, prepend=S[:, :1]))
    k = 50                                                                       # remove the slow trend (0.5 s)
    flux = flux - np.stack([np.convolve(f, np.ones(k) / k, mode='same') for f in flux])
    return (flux - flux.mean(axis=1, keepdims=True)) / (flux.std(axis=1, keepdims=True) + 1e-9)


def xcorr_norm(clip, song):
    """normalised cross-correlation of clip against song for every lag L (clip placed at song frame L); returns (lags, r)"""
    n = len(song) + len(clip)
    N = 1 << (n - 1).bit_length()
    num = np.fft.irfft(np.fft.rfft(song, N) * np.conj(np.fft.rfft(clip, N)), N)
    lags = np.arange(-len(clip) + 1, len(song))
    num = np.concatenate([num[N - len(clip) + 1:], num[:len(song)]])
    # local energy of the song under the clip's window (so a lag where only part of the clip overlaps isn't favoured)
    c2 = np.concatenate([[0], np.cumsum(song.astype(np.float64) ** 2)])
    a = np.clip(lags, 0, len(song)); b = np.clip(lags + len(clip), 0, len(song))
    en = np.sqrt(np.maximum(c2[b] - c2[a], 1e-9)) * np.sqrt((clip.astype(np.float64) ** 2).sum())
    overlap = (b - a) / len(clip)
    r = num / en * np.sqrt(np.clip(overlap, 0, 1))
    r[overlap < .3] = 0
    return lags, r


def gcc_phat(clip, song, lag_s, win=.06, seg=12.):
    """refine lag_s (song time of clip t=0) on the waveforms: GCC-PHAT over the best-overlapping `seg` s, +/- win"""
    c0 = max(0., -lag_s); c0 = min(c0, max(0., len(clip) / SR - seg))
    a = clip[int(c0 * SR):int((c0 + seg) * SR)]
    s0 = int((c0 + lag_s - win) * SR)
    if s0 < 0 or s0 + len(a) + int(2 * win * SR) > len(song) or len(a) < SR:
        return lag_s
    b = song[s0:s0 + len(a) + int(2 * win * SR)]
    N = 1 << (len(a) + len(b)).bit_length()
    X = np.fft.rfft(b, N) * np.conj(np.fft.rfft(a, N))
    cc = np.fft.irfft(X / (np.abs(X) + 1e-9), N)[:int(2 * win * SR) + 1]
    return (s0 + int(np.argmax(cc))) / SR - c0


def clap(x):
    """strongest broadband transient in the first 10 s (clip seconds)"""
    seg = x[:10 * SR]
    if len(seg) < SR // 2:
        return None
    hp = np.diff(seg, prepend=seg[0])                    # crude high-pass: claps are bright
    e = np.sqrt(np.convolve(hp ** 2, np.ones(SR // 200) / (SR // 200), mode='same'))
    bg = np.convolve(e, np.ones(SR // 2) / (SR // 2), mode='same') + 1e-6
    return float(np.argmax(e / bg) / SR)


def sync(path, song, song_env):
    x = decode(path)
    env = envelope(x)
    lags, r = None, 0
    for b in range(len(env)):                              # mean of the per-band normalised correlations
        lags, rb = xcorr_norm(env[b], song_env[b]); r = r + rb / len(env)
    i = int(np.argmax(r)); L = lags[i] / 100.; corr = float(r[i])
    far = np.abs(lags - lags[i]) > 100
    ratio = float(corr / max(1e-6, r[far].max())) if far.any() else 9.
    fine = gcc_phat(x, song, L)
    if abs(fine - L) > .03:                               # GCC disagreed by more than an envelope frame: keep the coarse lag
        fine = L
    cl = clap(x)
    ok = corr >= CORR_MIN and ratio >= RATIO_MIN
    return {'file': os.path.relpath(path, ROOT) if path.startswith(ROOT) else path, 's0': round(fine, 4), 's0_coarse': round(L, 3),
            'corr': round(corr, 3), 'ratio': round(ratio, 2), 'ok': bool(ok), 'clap_clip': None if cl is None else round(cl, 3),
            'clap_song': None if cl is None else round(cl + fine, 3), 'dur': round(len(x) / SR, 3)}


def clips(args):
    for a in args:
        if os.path.isdir(a):
            for f in sorted(os.listdir(a)):
                if f.endswith(EXTS):
                    yield os.path.join(a, f)
        elif os.path.exists(a):
            yield a
        else:
            print(f'not found: {a}', file=sys.stderr)


def main():
    opt = {k: v for k, v in (a[2:].split('=', 1) for a in sys.argv[1:] if a.startswith('--') and '=' in a)}
    paths = list(clips([a for a in sys.argv[1:] if not a.startswith('--')]))
    if not paths:
        print(__doc__); sys.exit(1)
    song_path = opt.get('song', os.path.join(ROOT, 'inputs/Merge.wav'))
    out = opt.get('out', os.path.join(ROOT, 'work/footage/sync.json'))
    song = decode(song_path)
    song_env = envelope(song)
    res = json.load(open(out)) if os.path.exists(out) else {}
    print(f'{"take":<14} {"s0 (song = clip + s0)":>22} {"corr":>6} {"ratio":>6}  clap(clip -> song)   dur')
    for p in paths:
        take = os.path.splitext(os.path.basename(p))[0]
        m = re.match(r'^([A-Z]\d*)_t(\d+)', take)
        try:
            r = sync(os.path.abspath(p), song, song_env)
        except RuntimeError as e:
            print(f'{take:<14} ERROR {e}'); continue
        r['shot'], r['take_n'] = (m.group(1), int(m.group(2))) if m else (None, None)
        res[take] = r
        flag = '' if r['ok'] else '   << low confidence: place by hand (silent take, or the song too quiet?)'
        cl = f"{r['clap_clip']:6.2f} -> {r['clap_song']:7.2f}" if r['clap_clip'] is not None else '      -'
        print(f"{take:<14} {r['s0']:>22.4f} {r['corr']:>6.3f} {r['ratio']:>6.2f}  {cl:<19} {r['dur']:6.1f}{flag}")
    os.makedirs(os.path.dirname(out), exist_ok=True)
    json.dump(res, open(out, 'w'), indent=1)
    print(f'wrote {out}')


if __name__ == '__main__':
    main()
