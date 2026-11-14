#!/usr/bin/env python3
"""Checks for a proof render (run after render_proof.sh):  .venv/bin/python fable/proof/tools/check.py [v2|v3]
1. cuts: finds each cut in the encoded mp4 by frame difference and reports its error against the measured beat (in frames)
2. turn: samples every grid cell's placeholder turn patch (black before turn_t, white after) on the frames around bar 37
3. type: measured cap heights (canvas measureText of 'H' in the font as drawn) from the page
4. single frame: renders 3 frames alone in fresh browsers and diffs them against the same frames saved during the full render
"""
import json, os, subprocess, sys
import numpy as np
from PIL import Image

V = sys.argv[1] if len(sys.argv) > 1 else 'v2'
TWOS = len(sys.argv) > 2 and sys.argv[2] == 'twos'; TAG = V + ('_twos' if TWOS else '')
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.join(ROOT, 'work_fable', 'proof', 'out'); DEV = os.path.join(ROOT, 'work_fable', 'proof', 'dev'); os.makedirs(DEV, exist_ok=True)
TIMING = os.environ.get('TIMING') or {'v2': '/analysis_v2/timing.json', 'v3': '/analysis_v3/timing.json'}[V]   # env TIMING + any tag V: test maps
MP4 = os.path.join(OUT, f'proof_{TAG}.mp4'); W, H, FPS = 1920, 1080, 30
R = lambda *a: subprocess.run(['node', os.path.join(ROOT, 'fable/proof/tools/render.mjs'), '--timing', TIMING, *(['--q', 'twos=1'] if TWOS else []), *a], cwd=ROOT, check=True, capture_output=True, text=True)

info_p = os.path.join(DEV, f'info_{V}.json'); R('--info', info_p); info = json.load(open(info_p)); ev = info['events']; t0 = info['t0']
def frames():
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', MP4, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    while True:
        b = p.stdout.read(W * H * 3)
        if len(b) < W * H * 3: break
        yield np.frombuffer(b, np.uint8).reshape(H, W, 3)

# ---- 1: cuts, from the mp4 (one pass)
hit_k = round((ev['hit'] - t0) * FPS); probe_p = os.path.join(DEV, f'probe_{V}.json'); R('--probe', f'{hit_k - 2}:{hit_k + 120}', probe_p)
probe = {p['k']: p for p in json.load(open(probe_p))}
diffs, prev = [], None
for k, f in enumerate(frames()):
    roi = f[int(H * 0.25):int(H * 0.65), int(W * 0.55):int(W * 0.97)].astype(np.int16)[::4, ::4]   # plate area, clear of type and lines
    diffs.append(0 if prev is None else float(np.abs(roi - prev).mean())); prev = roi
diffs = np.array(diffs)
events = [(f"cut -> {c['id']}", c['t']) for c in ev['cuts'][1:]] + [('grid (bar 33)', ev['grid']), ('hero cut (bar 41)', ev['t41']), ('black (bar 43)', ev['tEnd'])]
print(f'proof {TAG}: t0 {t0:.4f} s (bar 28), {len(diffs)} frames')
print('\n1. cuts (frame where the picture changes vs the measured beat; error in frames = (frame time - beat) * 30)')
worst = 0
for name, te in events:
    kk = (te - t0) * FPS; lo, hi = int(np.floor(kk)) - 2, int(np.ceil(kk)) + 3
    win = diffs[lo:hi]; k = lo + int(np.argmax(win > 0.35 * win.max())); err = (t0 + k / FPS - te) * FPS; worst = max(worst, abs(err))
    print(f'   {name:24s} beat {te:8.3f}  cut at frame {k:4d} ({t0 + k / FPS:8.3f})  error {err:+.2f} fr   (diff {diffs[k]:.1f}, window max {win.max():.1f})')
print(f'   max |error| {worst:.2f} frames')
# ---- 2: turn. Each cell's clip time (from the page) on the frames around the bar 37 downbeat vs its meta turn_t; grid cells at natural
# speed show source frame floor(c*fps), so the turn frame is on screen from the first output frame with c >= turn_t
print(f'\n2. turn: bar 37 downbeat {ev["hit"]:.3f} s = frame {(ev["hit"] - t0) * FPS:.2f}; nearest frame {hit_k}')
first = {}
for k in sorted(probe):
    for c in probe[k]['cells']:
        if c['turn'] is None: continue
        if c['c'] >= c['turn'] - 1e-6 and c['id'] not in first: first[c['id']] = (k, c['c'] - c['turn'], c['blend'])
for cid, (k, d, b) in first.items(): print(f'   {cid:10s} turn_t reached on frame {k} (clip time - turn_t = {d * 1000:+.1f} ms, frame-blended: {b})')
print(f'   all {len(first)} cells reach their turn on frame(s) {sorted(set(v[0] for v in first.values()))} (expected {hit_k})')
# the hold after the turn: clip time per cell from the hit until the cell has shrunk away (bar 38) must keep advancing and stay inside the clip
last = {i: (m['n'] - 1) / m['fps'] for i, m in info['meta'].items()}; track = {}
for k in sorted(probe):
    if k < hit_k: continue
    for c in probe[k]['cells']:
        if c['turn'] is not None: track.setdefault(c['id'], []).append((k, c['c']))
for cid, seq in track.items():
    d = [b[1] - a[1] for a, b in zip(seq, seq[1:])]
    print(f'   {cid:10s} hold: frames {seq[0][0]}-{seq[-1][0]}, clip {seq[0][1]:.3f} -> {seq[-1][1]:.3f} s (last frame {last[cid]:.3f}), slowest step {min(d) * 1000:.1f} ms of clip per output frame')

# ---- 3
print('\n3. type (cap height in px at 1080p, measured with measureText on the font as drawn)')
for k, s in info['sizes'].items(): print(f'   {k:16s} cap {s["capPx"]:5.1f} px   font {s["font"]}' + (f'   rows {s["rows"]}' if 'rows' in s else ''))

# ---- 4
keep = sorted(os.listdir(os.path.join(OUT, f'keep_{TAG}')))
print('\n4. single frame alone vs the same frame in the full render (fresh browser per frame)')
items = ','.join(f'{int(n[4:8])}:{os.path.join(DEV, "alone_" + n)}' for n in keep); R('--frames', items, '--fresh')
for n in keep:
    a = np.asarray(Image.open(os.path.join(OUT, f'keep_{TAG}', n))).astype(np.int16); b = np.asarray(Image.open(os.path.join(DEV, 'alone_' + n))).astype(np.int16)
    d = np.abs(a - b); print(f'   frame {int(n[4:8]):4d} (t {t0 + int(n[4:8]) / FPS:.3f}): max diff {d.max()}, mean {d.mean():.4f}, differing px {(d.max(axis=2) > 0).sum()}')
