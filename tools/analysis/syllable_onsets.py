"""Syllable-onset candidates in the vocal stems (adapted from vibesong arbitrate.py): spectral-flux onsets (backtracked)
+ pitch-change / voicing-start points from pyin. Output: work/syllable_onsets.npz (energy, pitch, combined) and per-aligner
mean distance to the nearest onset (which aligner tracks the acoustics best)."""
import json, numpy as np, librosa
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
sr = 22050; hop = 110
res = {}
for tag, f in (('rf', 'vocals_roformer.wav'), ('dm', 'vocals.wav')):
    v = librosa.load(AN/'stems'/f, sr=sr, mono=True)[0]
    o = librosa.onset.onset_strength(y=v, sr=sr, hop_length=hop, lag=2)
    eon = librosa.onset.onset_detect(onset_envelope=o, sr=sr, hop_length=hop, units='time', delta=0.04, wait=16, backtrack=True)
    f0, vf, vp = librosa.pyin(v, fmin=110, fmax=1100, sr=sr, hop_length=hop*4, frame_length=2048)
    midi = librosa.hz_to_midi(f0); tt = np.arange(len(midi))*hop*4/sr
    pon = []
    for i in range(4, len(midi)-3):
        if vf[i] and (not vf[i-1] or (not np.isnan(midi[i-4]) and abs(np.nanmedian(midi[i:i+3]) - np.nanmedian(midi[i-4:i-1])) > 0.8)):
            if not pon or tt[i]-pon[-1] > 0.08: pon.append(tt[i])
    res[f'energy_{tag}'] = eon; res[f'pitch_{tag}'] = np.array(pon)
    res[f'f0_{tag}'] = f0; res[f'voiced_{tag}'] = vf; res['f0_t'] = tt
    res[f'all_{tag}'] = np.sort(np.concatenate([eon, np.array(pon)]))
np.savez(WK/'syllable_onsets.npz', **res)
ons = res['all_rf']
def dist(t): return float(np.min(np.abs(ons - t)))
for name in ('ctc', 'ctc_rf', 'w2v', 'w2v_rf', 'st', 'st_rf'):
    A = json.load(open(WK/f'aligned_{name}.json'))
    d = [dist(w['start']) for l in A for w in l['words'] if l['id'] not in (24, 25, 26)]
    print(f'{name:7s} mean |start - nearest syllable onset| {np.mean(d)*1000:5.0f} ms  median {np.median(d)*1000:4.0f} ms  n={len(d)}')
