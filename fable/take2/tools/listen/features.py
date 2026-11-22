"""Compute (and cache) whole-song audio features on the song and its stems.

  .venv/bin/python fable/take2/tools/listen/features.py      # writes OUT/features.npz

Features at hop 256 @ 22050 Hz (11.6 ms): mix/vocals/drums/bass/other RMS dB, mix onset strength,
mix spectral flux, low (<150 Hz) and high (>4 kHz) band dB, mel spectrograms of mix and vocals.
"""
import os
import sys

import numpy as np

sys.path.insert(0, os.path.dirname(__file__))
import common as C  # noqa: E402


def compute():
    import librosa
    os.makedirs(C.OUT, exist_ok=True)
    out = {}
    y = C.load(C.SONG)
    out['mix_db'] = C.rms_db(y)
    S = np.abs(librosa.stft(y, n_fft=2048, hop_length=C.HOP)) ** 2
    freqs = librosa.fft_frequencies(sr=C.SR, n_fft=2048)
    out['low_db'] = C.band_db(S, freqs, 20, 150)
    out['high_db'] = C.band_db(S, freqs, 4000, 11000)
    out['onset'] = librosa.onset.onset_strength(S=librosa.power_to_db(
        librosa.feature.melspectrogram(S=S, sr=C.SR, n_mels=128)), sr=C.SR, hop_length=C.HOP)
    lS = np.log1p(np.sqrt(S))
    out['flux'] = np.r_[0, np.maximum(np.diff(lS, axis=1), 0).sum(0)]
    out['mel_mix'] = librosa.power_to_db(librosa.feature.melspectrogram(S=S, sr=C.SR, n_mels=128,
                                                                         fmax=11000), ref=np.max)
    for stem in ('vocals', 'vocals_roformer', 'drums', 'bass', 'other'):
        ys = C.load(os.path.join(C.STEMS, stem + '.wav'))
        out[stem + '_db'] = C.rms_db(ys)
        if stem == 'vocals_roformer':
            Sv = np.abs(librosa.stft(ys, n_fft=2048, hop_length=C.HOP)) ** 2
            out['mel_voc'] = librosa.power_to_db(librosa.feature.melspectrogram(
                S=Sv, sr=C.SR, n_mels=128, fmax=11000), ref=np.max)
    n = min(len(v) if v.ndim == 1 else v.shape[1] for v in out.values())
    out = {k: (v[:n] if v.ndim == 1 else v[:, :n]) for k, v in out.items()}
    out['t'] = np.arange(n) * C.HOP / C.SR
    np.savez_compressed(os.path.join(C.OUT, 'features.npz'), **out)
    return out


def get():
    p = os.path.join(C.OUT, 'features.npz')
    if not os.path.exists(p):
        return compute()
    return dict(np.load(p))


if __name__ == '__main__':
    f = compute()
    print('frames', len(f['t']), 'dur', f['t'][-1])
