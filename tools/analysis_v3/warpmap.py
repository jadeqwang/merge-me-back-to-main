"""Old (v2, inputs/Merge.wav) -> new (v3) time map by musical position: t_old -> fractional beat index on the v2 grid
(analysis_v2/timing.json beat_times) -> same index on the v3 grid ($WORK_DIR/grid_final.json). Linear in the beat
index between beats; beyond either end, extrapolated with the end periods. Used for the lyric search windows,
the v2 override carry-over, and warp_v2_to_v3.json."""
import json, numpy as np
from pathlib import Path
ROOT = Path(__file__).resolve().parents[2]
GO = np.array(json.load(open(ROOT/'analysis_v2/timing.json'))['beat_grid']['beat_times'])
def _new_grid():
    import os
    wk = ROOT/os.environ.get('WORK_DIR', 'work_v3')
    return np.array([b['t'] for b in json.load(open(wk/'grid_final.json'))['beats']])
def _idx(G, t):
    t = np.asarray(t, float); i = np.interp(t, G, np.arange(len(G)))
    i = np.where(t < G[0], (t - G[0])/(G[1]-G[0]), i)
    return np.where(t > G[-1], len(G)-1 + (t - G[-1])/(G[-1]-G[-2]), i)
def _time(G, i):
    i = np.asarray(i, float); t = np.interp(i, np.arange(len(G)), G)
    t = np.where(i < 0, G[0] + i*(G[1]-G[0]), t)
    return np.where(i > len(G)-1, G[-1] + (i - (len(G)-1))*(G[-1]-G[-2]), t)
def old2new(t, GN=None):
    GN = _new_grid() if GN is None else GN
    return _time(GN, _idx(GO, t))
def new2old(t, GN=None):
    GN = _new_grid() if GN is None else GN
    return _time(GO, _idx(GN, t))
