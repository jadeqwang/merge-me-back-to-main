"""Beat + downbeat tracking with beat_this on the full mix and the drum stem (moongazing venv python, GPU).
Adapted from vibesong/tools/beats_beatthis.py. Output: work/beatthis.json"""
import json
from pathlib import Path
from beat_this.inference import File2Beats
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
out = {}
for dbn in (False,):
    f2b = File2Beats(checkpoint_path="final0", device="cuda", dbn=dbn)
    for name, p in (('mix', WK/'song.wav'), ('drums', AN/'stems/drums.wav')):
        b, d = f2b(str(p))
        key = f"{name}{'_dbn' if dbn else ''}"
        out[key] = dict(beats=[float(x) for x in b], downbeats=[float(x) for x in d])
        print(key, len(b), len(d), [round(x,3) for x in b[:6]], [round(x,3) for x in d[:3]])
(WK/'beatthis.json').write_text(json.dumps(out, indent=1))
