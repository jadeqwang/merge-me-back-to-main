"""Export separator outputs (44.1 kHz) to $ANALYSIS_DIR/stems at 48 kHz PCM_24, sample-aligned with the song
(soxr HQ resample, length = song length). instrumental = drums + bass + other (as in v1)."""
import sys, numpy as np, soundfile as sf, soxr
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'analysis'))
from apaths import WK, AN, SONG
N = sf.info(str(SONG)).frames
out = AN/'stems'; out.mkdir(parents=True, exist_ok=True)
def exp(src, dst):
    x, sr = sf.read(str(src), dtype='float32', always_2d=True)
    y = soxr.resample(x, sr, 48000, quality='HQ') if sr != 48000 else x
    y = y[:N] if len(y) >= N else np.pad(y, ((0, N-len(y)), (0, 0)))
    sf.write(str(out/dst), y, 48000, subtype='PCM_24'); print(dst, sr, len(x), '->', len(y)); return y
d = WK/'demucs/htdemucs_ft/song'
S = {k: exp(d/f'{k}.wav', f'{k}.wav') for k in ('vocals', 'drums', 'bass', 'other')}
sf.write(str(out/'instrumental.wav'), S['drums']+S['bass']+S['other'], 48000, subtype='PCM_24'); print('instrumental.wav')
rf = next((WK/'roformer').glob('*(Vocals)*.wav'))
exp(rf, 'vocals_roformer.wav')
