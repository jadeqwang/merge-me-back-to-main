"""Per-bar stem levels (dB, mean power) + vocal-active fraction + drum onset count, using a beat grid."""
import numpy as np, sys
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
E = np.load(WK/'env.npz'); T = E['T']
g = np.load(ROOT/(sys.argv[1] if len(sys.argv) > 1 else 'work/grid_v1.npy'))
def pw(x): return 10*np.log10(np.mean(10**(x/10)))
print('bar   start   mix  drm  kick bas  oth  voc vact')
bl = list(g[::4]) + [g[-1] + 4*(g[-1]-g[-2])]
for k in range(len(bl)-1):
    a, b = bl[k], bl[k+1]; m = (T >= a) & (T < b)
    if not m.any(): continue
    vact = (E['rms_vocals'][m] > -40).mean()
    print(f'{k+1:3d} {a:7.2f} {int(a//60)}:{a%60:05.2f} ' + ' '.join(f'{pw(E[c][m]):4.0f}' for c in ('rms_mix', 'rms_drums')) +
          f' {20*np.log10(E["kick"][m].max()+1e-9):4.0f} ' + ' '.join(f'{pw(E[c][m]):4.0f}' for c in ('rms_bass', 'rms_other', 'rms_vocals')) + f' {vact:4.2f} ' + '#'*int(max(0, pw(E['rms_mix'][m])+30)))
