#!/usr/bin/env python3
"""Verify engine/show/score_orch.json against the song by resynthesis and measurement (docs/orchestra_transcription.md, "Verification").

Inputs (song time = seconds from the first sample of Merge.wav; all files sample-aligned):
  --vocals  review/cloud/audio/Merge_vocals_320k.mp3 (default)
  --sep DIR --sep-t0 T   a htdemucs_6s separation of the mix that starts at song time T: DIR/{vocals,drums,bass,guitar,piano,other}.wav
             made with:  ffmpeg -ss 222 -t 44 -i Merge_320k.mp3 mix_222.wav;
                         python3 -m demucs.separate --repo MODELS -n htdemucs_6s --shifts 2 mix_222.wav
             (htdemucs_6s weights 5c90dfd2-34c22ccb.th: github.com/nomadkaraoke/python-audio-separator/releases/download/model-configs/)
  --out DIR  resynthesised parts (fluidsynth, FluidR3_GM) and A/B wavs are written here (not committed: audio)
Needs: numpy, scipy, librosa, soundfile, torch + torchcrepe, basic-pitch (onnx), pretty_midi, fluidsynth + /usr/share/sounds/sf2/FluidR3_GM.sf2.
Prints every number quoted in the doc. The OLD rows re-measure the v5 design's notation (VLINE / ARP / slashes in engine/show/main.js before
this change) with the same metrics, as a baseline."""
import argparse, json, os, subprocess, sys, warnings
import numpy as np, soundfile as sf, librosa
warnings.filterwarnings('ignore')
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SC = json.load(open(os.path.join(ROOT, 'engine/show/score_orch.json')))
TIM = json.load(open(os.path.join(ROOT, 'analysis_v2/timing.json')))
BARS = {b['bar']: (b['start'], b['end']) for b in TIM['bars']}
SR = 22050
GRACE = .14   # the on-beat scoops G -> A at bar 140 last 241.88 -> 242.03 in both voices
NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
mname = lambda m: f'{NAMES[int(round(m)) % 12]}{int(round(m)) // 12 - 1}'
hz2m = lambda f: 69 + 12 * np.log2(np.asarray(f) / 440.0)


def bar_t(b, pos=0.0):
    a, e = BARS[b]; return a + (e - a) * pos / 16


def sounding(part, layer=None):
    """merge tie chains into sounding notes: (midi, t_on, t_off)"""
    out = []
    for L in part['layers']:
        if layer and L['id'] != layer: continue
        cur = None
        for it in sorted([x for x in L['items'] if x['kind'] == 'note'], key=lambda x: x['t']):
            if cur and it['tie'] in ('stop', 'continue') and it['midi'] == cur[0]: cur[2] = it['t_end']; continue
            if cur: out.append(tuple(cur))
            cur = [it['midi'], it['t'], it['t_end']]
            if it.get('grace'):   # an on-beat scoop from the grace note (measured ~0.14 s), then the main note
                g = it['grace']; gm = 12 * (int(g[-1]) + 1) + NAMES.index(g[:-1])
                out.append((gm, it['t'], it['t'] + GRACE)); cur[1] = it['t'] + GRACE
        if cur: out.append(tuple(cur))
    return sorted(out, key=lambda x: x[1])


def load(path, t0, t1, base=0.0, mono=True):
    y, sr = sf.read(path, always_2d=True); y = y.T
    a, b = int((t0 - base) * sr), int((t1 - base) * sr)
    y = y[:, max(0, a):b]
    if mono: y = y.mean(0)
    if sr != SR: y = librosa.resample(y, orig_sr=sr, target_sr=SR)
    n = int((t1 - t0) * SR); return np.pad(y, (0, max(0, n - len(y))))[:n]


def decode(mp3, out):
    if not os.path.exists(out): subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', mp3, '-ar', '44100', out], check=True)
    return out


def synth(notes, program, path, t0, t1, vel=96):
    """render notes [(midi, on, off)] (song time) to a wav aligned to t0 with fluidsynth"""
    import pretty_midi
    pm = pretty_midi.PrettyMIDI(initial_tempo=138.0); ins = pretty_midi.Instrument(program=program)
    for m, a, b in notes:
        if b <= t0 or a >= t1: continue
        ins.notes.append(pretty_midi.Note(velocity=vel, pitch=int(m), start=max(0.0, a - t0), end=max(0.05, b - t0)))
    pm.instruments.append(ins); mid = path.replace('.wav', '.mid'); pm.write(mid)
    subprocess.run(['fluidsynth', '-ni', '-g', '0.8', '-F', path, '-r', str(SR), '/usr/share/sounds/sf2/FluidR3_GM.sf2', mid], check=True,
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    y, _ = sf.read(path, always_2d=True); y = y.mean(1)
    n = int((t1 - t0) * SR); return np.pad(y, (0, max(0, n - len(y))))[:n]


def cqt_sal(y, m0=40, n=60, hop=256):
    C = np.abs(librosa.cqt(y, sr=SR, hop_length=hop, fmin=librosa.midi_to_hz(m0 - 1 / 3), n_bins=n * 3, bins_per_octave=36))
    return np.log1p(30 * C.reshape(n, 3, -1).max(1) / (C.max() + 1e-9))


def per_bar_corr(A, B, t0, hop=256, bars=range(137, 145), chroma=False, m0=40):
    """frame-wise cosine similarity of two pitch-salience (or chroma) matrices, averaged per bar"""
    if chroma:
        fold = lambda X: np.array([X[[k for k in range(X.shape[0]) if (m0 + k) % 12 == c]].sum(0) for c in range(12)])
        A, B = fold(A), fold(B)
    n = min(A.shape[1], B.shape[1]); A, B = A[:, :n], B[:, :n]
    cs = (A * B).sum(0) / (np.linalg.norm(A, axis=0) * np.linalg.norm(B, axis=0) + 1e-9)
    t = t0 + np.arange(n) * hop / SR
    return {b: float(np.mean(cs[(t >= bar_t(b)) & (t < bar_t(b + 1))])) for b in bars}


def crepe_track(y, t0):
    import torch, torchcrepe
    y16 = librosa.resample(y, orig_sr=SR, target_sr=16000)
    p, per = torchcrepe.predict(torch.tensor(y16[None].astype(np.float32)), 16000, 160, 80, 1200, 'full', batch_size=512, device='cpu',
                                return_periodicity=True, decoder=torchcrepe.decode.viterbi)
    rms = librosa.feature.rms(y=y16, frame_length=1024, hop_length=160)[0]
    n = min(p.shape[1], len(rms))
    return t0 + np.arange(n) * .01, hz2m(p[0, :n].numpy()), per[0, :n].numpy(), 20 * np.log10(rms[:n] + 1e-9)


def at(notes, t):
    for m, a, b in notes:
        if a <= t < b: return m
    return None


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--vocals', default=os.path.join(ROOT, 'review/cloud/audio/Merge_vocals_320k.mp3'))
    ap.add_argument('--sep', default=None); ap.add_argument('--sep-t0', type=float, default=222.0)
    ap.add_argument('--out', default='/tmp/orch_tx_verify')
    a = ap.parse_args(); os.makedirs(a.out, exist_ok=True)
    P = {p['id']: p for p in SC['parts']}
    T0, T1 = bar_t(137), bar_t(145)
    # ------------------------------------------------------------------ voice
    vw = decode(a.vocals, os.path.join(a.out, 'vocals.wav'))
    yv = load(vw, T0, T1)
    up, lo = sounding(P['voice'], 'upper'), sounding(P['voice'], 'lower')
    OLD_V = [(62, 238.60, 241.64), (69, 241.92, 242.62), (76, 242.75, 243.36), (78, 243.42, 250.40)]   # v5 design VLINE [on, off, midi]
    tc, mc, per, db = crepe_track(yv, T0)
    ok = (per > .5) & (db > -40)
    print('== VOICE: torchcrepe (full, viterbi) on the vocal stem vs the transcription (frames with periodicity > .5, level > -40 dB)')
    for lab, notes, oct_free in (('NEW lower layer', lo, False), ('NEW lower layer, pitch class', lo, True), ('OLD VLINE', OLD_V, False),
                                 ('OLD VLINE, pitch class', OLD_V, True)):
        err, hit, tot, rows = [], 0, 0, {}
        for i in np.where(ok)[0]:
            t = tc[i]; m = at(notes, t)
            if m is None and lab.startswith('NEW'): m = None
            if m is None: continue
            d = mc[i] - m
            if oct_free: d = (d + 6) % 12 - 6
            tot += 1; hit += abs(d) < .5; err.append(abs(d))
            b = int(np.searchsorted([bar_t(k) for k in range(137, 146)], t, 'right') + 136)
            r = rows.setdefault(b, [0, 0]); r[0] += abs(d) < .5; r[1] += 1
        voiced = int(ok.sum())
        cov = sum(1 for i in np.where(ok)[0] if at(notes, tc[i]) is not None)
        print(f'  {lab:30s} within 50 cents: {100 * hit / max(1, tot):5.1f}% of {tot} frames ({100 * cov / voiced:4.1f}% of voiced frames covered); '
              f'median |err| {np.median(err) * 100 if err else 0:5.1f} cents; per bar ' + ' '.join(f'{b}:{100 * r[0] / r[1]:.0f}%' for b, r in sorted(rows.items())))
    # the upper layer where it is not the lower layer's octave: E5 over A4 (bar 140 beats 3-4), F#5 after the lead stops (bar 143)
    S = np.abs(librosa.stft(yv, n_fft=4096, hop_length=256)); f = librosa.fft_frequencies(sr=SR, n_fft=4096)
    tS = T0 + np.arange(S.shape[1]) * 256 / SR
    band = lambda m: S[(f > librosa.midi_to_hz(m - .5)) & (f < librosa.midi_to_hz(m + .5))].max(0)
    ref = S.max()
    for lab, m, a0, a1, alt in (('E5 over the held A4 (242.80-243.30)', 76, 242.80, 243.30, (64, 'E4 (if one voice sang E4)')),
                                ('F#5 after the lead stops (247.60-248.10)', 78, 247.60, 248.10, (66, 'F#4 (lead)'))):
        w = (tS >= a0) & (tS < a1)
        print(f'  upper layer {lab}: {mname(m)} {20 * np.log10(band(m)[w].mean() / ref):5.1f} dB vs {alt[1]} {20 * np.log10(band(alt[0])[w].mean() / ref):5.1f} dB')
    # resynthesis A/B and CQT / chroma correlation per bar
    new_v = synth(up + lo, 53, os.path.join(a.out, 'voice_new.wav'), T0, T1)
    old_v = synth(OLD_V, 53, os.path.join(a.out, 'voice_old.wav'), T0, T1)
    sf.write(os.path.join(a.out, 'AB_voice_stemL_newR.wav'), np.stack([yv / (np.abs(yv).max() + 1e-9), new_v / (np.abs(new_v).max() + 1e-9)], 1) * .7, SR)
    Cv, Cn, Co = cqt_sal(yv), cqt_sal(new_v), cqt_sal(old_v)
    for lab, X in (('NEW', Cn), ('OLD', Co)):
        c1 = per_bar_corr(Cv, X, T0); c2 = per_bar_corr(Cv, X, T0, chroma=True)
        print(f'  resynth {lab}: CQT-salience cosine per bar ' + ' '.join(f'{b}:{v:.2f}' for b, v in c1.items()) + f'  mean {np.mean(list(c1.values())):.2f}')
        print(f'               chroma cosine per bar      ' + ' '.join(f'{b}:{v:.2f}' for b, v in c2.items()) + f'  mean {np.mean(list(c2.values())):.2f}')
    if not a.sep: print('(no --sep: keys and guitar checks skipped)'); return
    stem = lambda n: load(os.path.join(a.sep, n + '.wav'), T0, T1, base=a.sep_t0)
    # ------------------------------------------------------------------ keys
    yo = stem('other')
    from basic_pitch.inference import predict
    from basic_pitch import ICASSP_2022_MODEL_PATH
    po = os.path.join(a.out, 'other.wav'); sf.write(po, yo, SR)
    out, _, _ = predict(po, ICASSP_2022_MODEL_PATH); O = out['onset']; tO = T0 + np.arange(O.shape[0]) * 256 / 22050
    rng = np.random.default_rng(0)
    print('== KEYS: basic-pitch onset activation of the transcribed pitch on the "other" stem, at the dotted-8th positions (0,3,6,9,12) vs the '
          'other 11 sixteenths; p = share of 20000 random 5-of-16 position sets with a contrast at least as large (best detector lag 0..45 ms)')
    keys_items = [x for x in P['keys']['layers'][0]['items'] if x['kind'] == 'note' and x['sounds']]
    for b in range(137, 145):
        m = [x for x in keys_items if x['bar'] == b][0]['midi']
        best = None
        for lag in (0, .15, .3, .45):
            v = np.array([O[(tO > bar_t(b, j + lag) - .03) & (tO < bar_t(b, j + lag) + .03), m - 21].max() for j in range(16)])
            on = np.zeros(16, bool); on[[0, 3, 6, 9, 12]] = True; c = v[on].mean() - v[~on].mean()
            if best is None or c > best[0]: best = (c, lag, v)
        c, lag, v = best
        null = np.array([v[s].mean() - np.delete(v, s).mean() for s in (rng.choice(16, 5, replace=False) for _ in range(20000))])
        alts = {mname(mm): np.array([O[(tO > bar_t(b, j + lag) - .03) & (tO < bar_t(b, j + lag) + .03), mm - 21].max() for j in (0, 3, 6, 9, 12)]).mean()
                for mm in (66, 67, 69, 71, 73, 74)}
        print(f'  bar {b}: {mname(m):4s} contrast {c:+.2f}  p={np.mean(null >= c):.4f}  (mean on-grid {v[[0, 3, 6, 9, 12]].mean():.2f}; same positions, other pitches: '
              + ' '.join(f'{k} {x:.2f}' for k, x in alts.items()) + ')')
    PAD = {137: [55, 59, 62, 67, 69, 71, 74], 141: [59, 62, 66, 69, 71, 74]}
    pad = [(mm, bar_t(137), bar_t(141)) for mm in PAD[137]] + [(mm, bar_t(141), bar_t(145)) for mm in PAD[141]]
    new_k = synth(sounding(P['keys']) + pad, 81, os.path.join(a.out, 'keys_new.wav'), T0, T1, vel=80)
    OLD_A = {'G': [67, 71, 74, 69], 'Bm': [71, 74, 78, 73]}
    old_arp = [(OLD_A['G' if b < 141 else 'Bm'][j % 4], bar_t(b, j), bar_t(b, j + 1)) for b in range(137, 145) for j in range(16)]
    old_k = synth(old_arp, 81, os.path.join(a.out, 'keys_old.wav'), T0, T1, vel=80)
    Co_, Ckn, Cko = cqt_sal(yo), cqt_sal(new_k), cqt_sal(old_k)
    for lab, X in (('NEW line + pad', Ckn), ('OLD 16th ARP', Cko)):
        c2 = per_bar_corr(Co_, X, T0, chroma=True)
        print(f'  resynth {lab:15s} chroma cosine vs "other" per bar ' + ' '.join(f'{b}:{v:.2f}' for b, v in c2.items()) + f'  mean {np.mean(list(c2.values())):.2f}')
    # ------------------------------------------------------------------ guitar / bass drive
    yb = stem('bass')
    print('== GUITAR (= the bass drive): bass stem. Pitch per bar by subharmonic summation on a 1-bar spectrum (harmonics 1-8, weight 0.8^(h-1), '
          'energy summed within +-50 cents of each harmonic: the kick gate puts 2.3 Hz sidebands around every partial, so single peaks mislead)')
    gtr = sounding(P['guitar'])
    for b in range(137, 145):
        x = yb[int((bar_t(b) - T0) * SR):int((bar_t(b + 1) - T0) * SR)]
        X = np.abs(np.fft.rfft(x * np.hanning(len(x)), 1 << 18)); fr = np.fft.rfftfreq(1 << 18, 1 / SR)
        sal = {}
        for m in range(28, 53):
            f0 = librosa.midi_to_hz(m)
            sal[m] = sum(.8 ** (h - 1) * np.sqrt((X[(fr > h * f0 * 2 ** (-.5 / 12)) & (fr < h * f0 * 2 ** (.5 / 12))] ** 2).sum()) for h in range(1, 9))
        top = sorted(sal, key=lambda m: -sal[m])[:3]
        want = [m for m, q, r in gtr if bar_t(b) <= q < bar_t(b + 1)][0]
        print(f'  bar {b}: best fundamentals ' + ', '.join(f'{mname(m)} {sal[m] / sal[top[0]]:.2f}' for m in top) + f'   (transcribed: {mname(want)}, the guitar doubles at that octave)')
    S = np.abs(librosa.stft(yb, n_fft=2048, hop_length=64)) ** 2; fq = librosa.fft_frequencies(sr=SR, n_fft=2048)
    e = S[(fq > 40) & (fq < 600)].sum(0); te = T0 + np.arange(len(e)) * 64 / SR
    prof = np.zeros(8); cnt = 0
    for b in range(137, 145):
        for beat in range(4):
            for k in range(8):
                w = (te >= bar_t(b, beat * 4 + k / 2)) & (te < bar_t(b, beat * 4 + (k + 1) / 2)); prof[k] += e[w].mean()
            cnt += 1
    prof = 10 * np.log10(prof / cnt / (prof / cnt).max())
    print('  level per 32nd inside the beat (dB rel. max, averaged over the 32 beats): ' + ' '.join(f'{v:.0f}' for v in prof))
    lin = 10 ** (prof / 10)
    for lab, pat in (('NEW offbeat 8ths (8th rest, 8th note)', [0, 0, 0, 0, 1, 1, 1, 1]), ('on-beat 8ths (8th note, 8th rest)', [1, 1, 1, 1, 0, 0, 0, 0])):
        print(f'    envelope vs {lab:38s} r = {np.corrcoef(lin, np.array(pat, float))[0, 1]:+.2f}')
    print(f'    the OLD notation struck a slash on every 8th; the level on the beat (first 32nd after it) is {prof[1]:.0f} dB vs {prof[5]:.0f} dB on the "and"')
    new_g = synth(gtr, 33, os.path.join(a.out, 'guitar_new.wav'), T0, T1)
    sf.write(os.path.join(a.out, 'AB_bass_stemL_guitarR.wav'), np.stack([yb / (np.abs(yb).max() + 1e-9), new_g / (np.abs(new_g).max() + 1e-9)], 1) * .7, SR)
    mix = load(decode(os.path.join(ROOT, 'review/cloud/audio/Merge_320k.mp3'), os.path.join(a.out, 'mix.wav')), T0, T1)
    allnew = new_v / (np.abs(new_v).max() + 1e-9) + .6 * new_k / (np.abs(new_k).max() + 1e-9) + .6 * new_g / (np.abs(new_g).max() + 1e-9)
    sf.write(os.path.join(a.out, 'AB_mixL_resynthR.wav'), np.stack([mix / (np.abs(mix).max() + 1e-9), allnew / (np.abs(allnew).max() + 1e-9)], 1) * .7, SR)
    print('wrote resynth / A-B wavs to', a.out)


if __name__ == '__main__':
    main()
