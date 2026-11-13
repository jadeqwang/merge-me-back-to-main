"""Arrangement comparison v2 vs v3, bar by bar (same bar numbers): RMS (dB) per bar of the mix and of each stem
(drums, bass, other, vocals_roformer) plus kick-band level, in both files. Flags bars where a stem differs by > 6 dB
(an instrument present in one version and not the other), and measures the tail (last-hit, decay, fade).
Output: $WORK_DIR/arr_compare.json"""
import json, sys, numpy as np, soundfile as sf
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT/'tools/analysis'))
from apaths import WK, AN
GO = np.array(json.load(open(ROOT/'analysis_v2/timing.json'))['beat_grid']['beat_times'])
GN = np.array([b['t'] for b in json.load(open(WK/'grid_final.json'))['beats']])
EO = np.load(ROOT/'work_v2/env.npz'); EN = np.load(WK/'env.npz')
def stemdb(path, G):
    y, sr = sf.read(str(path), dtype='float32'); y = y.mean(1) if y.ndim > 1 else y
    out = []
    for b in range(len(G)//4):
        a, z = G[4*b], (G[4*b+4] if 4*b+4 < len(G) else len(y)/sr)
        s = y[int(a*sr):int(z*sr)]; out.append(float(10*np.log10(np.mean(s**2) + 1e-12)))
    return np.array(out)
def kickdb(E, G):
    T = E['T']; return np.array([float(20*np.log10(np.max(E['kick'][(T >= G[4*b]-0.03) & (T < G[4*b]+0.6)]) + 1e-9)) for b in range(len(G)//4)])
R = {}
for nm, po, pn in (('mix', ROOT/'work_v2/song.wav', WK/'song.wav'),) + tuple((s, ROOT/f'analysis_v2/stems/{s}.wav', AN/f'stems/{s}.wav') for s in ('drums', 'bass', 'other', 'vocals_roformer')):
    R[nm] = (stemdb(po, GO), stemdb(pn, GN))
R['kick'] = (kickdb(EO, GO), kickdb(EN, GN))
nb = min(len(R['mix'][0]), len(R['mix'][1]))
rows = []; flags = []
for b in range(nb):
    r = dict(bar=b+1, t_old=round(float(GO[4*b]), 3), t_new=round(float(GN[4*b]), 3))
    for k, (o, n) in R.items():
        if b < len(o) and b < len(n):
            r[k] = [round(float(o[b]), 1), round(float(n[b]), 1)]
            if max(o[b], n[b]) > -45 and abs(o[b] - n[b]) > 6: flags.append((b+1, k, round(float(o[b]), 1), round(float(n[b]), 1)))
    rows.append(r)
for f in flags: print('DIFF bar %d %-16s old %6.1f new %6.1f' % f)
# tail: mix level in 0.5 s steps after the last hit (bar 153), both files, relative to the bar-153 downbeat
tail = {}
for nm, p, G in (('old', ROOT/'work_v2/song.wav', GO), ('new', WK/'song.wav', GN)):
    y, sr = sf.read(str(p), dtype='float32'); y = y.mean(1); t0 = G[152*4]
    lv = [round(float(10*np.log10(np.mean(y[int((t0+k*0.5)*sr):int((t0+k*0.5+0.5)*sr)]**2) + 1e-12)), 1) for k in range(int((len(y)/sr - t0)/0.5))]
    q = 20*np.log10(np.abs(y) + 1e-9); env = np.convolve(np.abs(y), np.ones(int(0.05*sr))/int(0.05*sr), 'same')
    above = np.where(20*np.log10(env + 1e-9) > -40)[0]; last40 = above[-1]/sr
    above60 = np.where(20*np.log10(env + 1e-9) > -60)[0]; last60 = above60[-1]/sr
    tail[nm] = dict(bar153=round(float(t0), 3), file_end=round(len(y)/sr, 3), last_above_m40dB=round(float(last40), 3), last_above_m60dB=round(float(last60), 3),
                    after_bar153_to_m40=round(float(last40 - t0), 3), after_bar153_to_m60=round(float(last60 - t0), 3), level_db_per_0p5s=lv)
    print(nm, {k: v for k, v in tail[nm].items() if k != 'level_db_per_0p5s'})
print('tail level per 0.5 s from bar 153 (old/new):'); print(list(zip(tail['old']['level_db_per_0p5s'], tail['new']['level_db_per_0p5s'])))
json.dump(dict(rows=rows, flags=flags, tail=tail), open(WK/'arr_compare.json', 'w'), indent=0)
