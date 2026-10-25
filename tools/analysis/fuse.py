"""Fuse word timings: median of 4 CTC runs (MMS_FA + wav2vec2-EN, on demucs + RoFormer vocal stems) as the primary
start estimate; stable-ts (whisper) as secondary; snap to a syllable onset (energy/pitch) within [-90,+50] ms;
word ends from the next word start / vocal-activity offset. Manual overrides (work/overrides.json, from visual
inspection of spectrogram panels) are applied last. Output: work/lyrics_fused.json"""
import json, numpy as np
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
W = lambda n: {l['id']: l for l in json.load(open(WK/f'aligned_{n}.json'))}
CT = [W('ctc'), W('ctc_rf'), W('w2v'), W('w2v_rf')]; ST = [W('st'), W('st_rf')]
L = json.load(open(LINES))
SO = np.load(WK/'syllable_onsets.npz'); ons = np.sort(np.concatenate([SO['all_rf'], SO['all_dm']]))
E = np.load(WK/'env.npz'); T = E['T']; V = np.maximum(E['rms_vocals'], -100)
import librosa
_y, _sr = librosa.load(AN/'stems/vocals_roformer.wav', sr=16000, mono=True)
RR = 20*np.log10(librosa.feature.rms(y=_y, frame_length=320, hop_length=80)[0] + 1e-9); TR = np.arange(len(RR))*0.005
_S = np.abs(librosa.stft(_y, n_fft=512, hop_length=80)); _f = librosa.fft_frequencies(sr=16000, n_fft=512)
HF = 10*np.log10((_S[_f > 3500]**2).sum(0) + 1e-9); HF = np.convolve(HF, np.ones(4)/4, 'same'); THF = np.arange(len(HF))*0.005
def fric_onset(c, prev):
    # sibilant/fricative-initial word: earliest start of the contiguous high-band (>3.5 kHz) plateau around the CTC start
    m = (THF >= max(c-0.22, prev+0.08)) & (THF <= c+0.06); idx = np.where(m)[0]
    if not len(idx): return None
    pk = idx[np.argmax(HF[idx])]; ref = HF[pk]
    if ref - np.median(HF[(THF >= c-0.6) & (THF < c-0.25)]) < 6: return None
    j = pk
    while j-1 >= idx[0] and HF[j-1] > ref - 8: j -= 1
    return float(THF[j])
ov = json.load(open(WK/'overrides.json')) if (WK/'overrides.json').exists() else {}
out = []
for ln in L:
    i = ln['id']; n = len(CT[0][i]['words'])
    words = []
    for k in range(n):
        cs = np.array([c[i]['words'][k]['start'] for c in CT if k < len(c[i]['words'])])
        ss = np.array([s[i]['words'][k]['start'] for s in ST if k < len(s[i]['words'])])
        c = float(np.median(cs)); spread = float(cs.max() - cs.min()); s = float(np.median(ss))
        cand = ons[(ons >= c - 0.09) & (ons <= c + 0.05)]
        st = float(cand[np.argmin(np.abs(cand - c))]) if len(cand) else c
        flags = []
        if CT[0][i]['words'][k]['w'].lower()[:1] in ('s', 'f'):
            prev = words[-1]['start'] if words else c - 0.6
            fo = fric_onset(c, prev)
            if fo is not None and st - 0.15 <= fo < st - 0.02:
                flags.append(f'fricative_onset{fo-st:+.3f}'); st = fo
        if spread > 0.15: flags.append(f'ctc_spread{spread:.2f}')
        if abs(s - c) > 0.30: flags.append(f'whisper_diff{s-c:+.2f}')
        words.append(dict(w=CT[0][i]['words'][k]['w'], start=round(st, 3), ctc=round(c, 3), whisper=round(s, 3),
                          snapped=round(st - c, 3), flags=flags))
    o = ov.get(str(i), {})
    for k, t in o.get('starts', {}).items():
        words[int(k)]['start'] = t; words[int(k)]['flags'].append('manual_start')
    rec = dict(_ends=o.get('ends', {}), id=i, section=ln['section'], text=ln['text'], kind=ln['kind'], start=words[0]['start'], end=None, words=words)
    if 'note' in o: rec['note'] = o['note']
    out.append(rec)
AHH = dict(id=13, section='Breakdown', text='Ahh... ahh...', kind='wordless', start=112.50, end=126.6,
           words=[dict(w='Ahh', start=112.50, end=119.05, flags=['manual_wordless'], ctc=None, whisper=None, snapped=0.0),
                  dict(w='ahh', start=119.09, end=126.6, flags=['manual_wordless'], ctc=None, whisper=None, snapped=0.0)],
           note='Wordless: no aligner/ASR output. Ahh #1 = new low note (B3) on bar 65 beat 2 right after "return" (112.50), with leaps at 114.65 and 117.25; '
                'Ahh #2 = soaring leap to F#5 at 119.09 (bar 69 downbeat), held and fading out by ~126.6. Boundary between "return" and Ahh #1 is musical, not phonetic (medium-low confidence).')
out.append(AHH)
out.sort(key=lambda r: r['words'][0]['start'])
for n, rec in enumerate(out):
    if rec['kind'] == 'wordless': continue
    words = rec['words']
    limit = out[n+1]['words'][0]['start'] - 0.01 if n + 1 < len(out) else DUR
    for k, w in enumerate(words):
        last_word = k + 1 == len(words)
        nxt = words[k+1]['start'] if not last_word else limit
        m = (TR >= w['start']) & (TR < nxt); seg = RR[m]; tt = TR[m]
        if not len(seg): w['end'] = round(w['start'] + 0.08, 3); continue
        thr = max(seg[:60].max() - 20, -40)
        act = seg > thr
        end_i = 0; gap = 0
        for j in range(len(act)):
            if act[j]: end_i = j; gap = 0
            else:
                gap += 1
                if gap >= 30: break
        end = tt[end_i] + 0.005
        if not last_word and end > nxt - 0.05: end = nxt - 0.01
        w['end'] = round(float(min(max(end, w['start'] + 0.08), nxt - 0.005)), 3)
    for k, t in rec.pop('_ends').items():
        words[int(k)]['end'] = t; words[int(k)]['flags'].append('manual_end')
    rec['start'] = words[0]['start']; rec['end'] = words[-1]['end']
for rec in out:
    rec.pop('_ends', None)
    print(f"{rec['id']:3d} {rec['start']:7.2f}-{rec['end']:7.2f} " + ' '.join(f"{w['w']}@{w['start']:.2f}-{w['end']:.2f}" for w in rec['words']))
json.dump(out, open(WK/'lyrics_fused.json', 'w'), indent=1)
