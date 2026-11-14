#!/usr/bin/env python3
"""Checks for a film render (the proof's check.py carried over to the whole film):
   .venv/bin/python fable/take2/tools/check.py work_fable/take2/out/film_<tag>_master.mp4 [--q "page query used for the render"]
1. cuts: every shot boundary found in the mp4 by frame difference, error in frames against its bar/beat time
   (boundaries with no picture change by design are listed apart: v7 -> v7 on the same sequence, the proof's bar 37 turn and bar 39 iris)
2. type: measured cap heights / font sizes from the page against rule 5 (verse 64, slab 100, labels 24 px at 1080p)
3. lyrics: every word on screen at least 0.6 s; every sung line inside the film
4. single frame: the frames kept during the full render (keep_<tag>/) rendered alone in fresh browsers, diffed
Reads <mp4>.json (written by render.mjs: k0, n, q). Writes work_fable/take2/dev/check_<tag>.json."""
import json, os, subprocess, sys
import numpy as np
from PIL import Image

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
MP4 = os.path.abspath(sys.argv[1]); TAG = os.path.basename(MP4).replace('.mp4', '').replace('film_', '').replace('_master', '')
meta = json.load(open(MP4.replace('.mp4', '.json'))); Q = meta.get('q') or ''
if '--q' in sys.argv: Q = sys.argv[sys.argv.index('--q') + 1]
DEV = os.path.join(ROOT, 'work_fable', 'take2', 'dev'); os.makedirs(DEV, exist_ok=True)
FPS, k0, n = meta['fps'], meta['k0'], meta['n']
R = lambda *a: subprocess.run(['node', os.path.join(ROOT, 'fable/take2/tools/render.mjs'), *(['--q', Q] if Q else []), *a], cwd=ROOT, check=True, capture_output=True, text=True)
info_p = os.path.join(DEV, f'info_{TAG}.json'); R('--info', info_p); info = json.load(open(info_p))
shots = info['shots']; report = {'mp4': MP4, 'q': Q}

# ---- 1. cuts
w, h = 480, 270
p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', MP4, '-vf', f'scale={w}:{h}', '-f', 'rawvideo', '-pix_fmt', 'gray', '-'], stdout=subprocess.PIPE)
diffs, prev = [], None
while True:
    b = p.stdout.read(w * h)
    if len(b) < w * h: break
    f = np.frombuffer(b, np.uint8).reshape(h, w)[: int(h * 0.56), :].astype(np.int16)    # picture area: clear of lyric strip and HUD
    diffs.append(0.0 if prev is None else float(np.abs(f - prev).mean())); prev = f
diffs = np.array(diffs)
print(f'film {TAG}: frames {k0}..{k0 + len(diffs) - 1} ({len(diffs)} decoded, {n} expected), q "{Q}"')
print('\n1. cuts (frame where the picture changes vs the bar/beat time; error in frames = (frame time - cut time) * 30)')
rows, worst, soft, missing = [], 0.0, [], []
for a, b in zip(shots, shots[1:]):
    te = b['t0']; kk = te * FPS - k0
    if kk < 2 or kk > len(diffs) - 3: continue
    same_v7 = a['eff'] == 'v7' and b['eff'] == 'v7' and not b['flash'] and not a['flash']
    proof_soft = b['kind'] == 'proof' and (b['src'] in ('C:turn', 'D:root'))
    lo, hi = int(np.floor(kk)) - 2, int(np.ceil(kk)) + 3; win = diffs[lo:hi]
    if same_v7 or proof_soft: soft.append(f"{b['id']} ({'v7 same sequence' if same_v7 else b['src']})"); continue
    # the biggest change in the window (v7's paper pass re-draws every 1/12 s, so 'first above 35%' caught boil steps)
    k = lo + int(np.argmax(win)); err = ((k0 + k) / FPS - te) * FPS
    base = float(np.median(diffs[max(0, lo - 8):lo])) if lo > 0 else 0.0
    ok = win.max() > max(1.0, 3 * base)
    rows.append({'id': b['id'], 't': te, 'frame': k0 + k, 'err': round(err, 2), 'diff': round(float(diffs[k]), 1), 'clear': bool(ok)})
    if ok: worst = max(worst, abs(err))
    else: missing.append(b['id'])
errs = np.array([r['err'] for r in rows if r['clear']])
print(f'   {len(rows)} hard cuts checked: max |error| {worst:.2f} fr, mean |error| {np.abs(errs).mean():.2f} fr; |error| <= 0.5 fr: {(np.abs(errs) <= 0.5).sum()} of {len(errs)}')
for r in rows:
    if abs(r['err']) > 0.5 or not r['clear']: print(f"   ! {r['id']:5s} cut {r['t']:8.3f}  at frame {r['frame']} error {r['err']:+.2f} fr  diff {r['diff']} {'(no clear change)' if not r['clear'] else ''}")
print(f'   not hard cuts by design ({len(soft)}): ' + ', '.join(soft))
report['cuts'] = {'rows': rows, 'max_abs_err': worst, 'soft': soft, 'unclear': missing}

# ---- 2. type
print('\n2. type (px at 1080p; cap = measured ascent of H in the font as drawn)')
RULE = {'lyric_verse': ('cap', 64), 'lyric_slab': ('cap', 100), 'proof_lyric_upperleft': ('cap', 64), 'proof_lyric_strip': ('cap', 64), 'proof_slab': ('cap', 100)}
fails = []
for k, s in info['sizes'].items():
    kind, lim = RULE.get(k, ('fontPx', 24)); v = s['capPx'] if kind == 'cap' else s['fontPx']; ok = v >= lim - 0.05
    if not ok: fails.append(k)
    print(f"   {k:24s} cap {s['capPx']:6.1f}  font {s['fontPx']:6.1f} px   rule {kind} >= {lim}: {'ok' if ok else 'FAIL'}")
report['type_fails'] = fails

# ---- 3. lyrics
print('\n3. lyrics (fully on screen from the word start to the line out time - 0.2 s fade; the proof draws lines 4-7 inside bars 28-43)')
short = []
for L in info['lyrics']:
    for wd in L['words']:
        d = L['out'] - wd['start']
        if d - 0.2 < 0.6 - 1e-6: short.append((L['id'], wd['w'], round(d - 0.2, 3)))   # fully opaque until out - 0.2
print(f"   {len(info['lyrics'])} lines, {sum(len(L['words']) for L in info['lyrics'])} words; words under 0.6 s: {short if short else 'none'}")
print(f"   last line out at {max(L['out'] for L in info['lyrics']):.2f} s (film ends {info['tStop']:.2f} s)")
report['lyrics_short'] = short

# ---- 4. single frame alone vs the full render
kd = os.path.join(os.path.dirname(MP4), f'keep_{TAG}')
if os.path.isdir(kd):
    keep = sorted(x for x in os.listdir(kd) if x.startswith('seq_'))
    print(f'\n4. single frame alone vs the same frame in the full render (fresh browser per frame), {len(keep)} frames')
    items = ','.join(f'{int(x[4:9])}:{os.path.join(DEV, "alone_" + TAG + "_" + x)}' for x in keep); R('--frames', items, '--fresh')
    res = []
    for x in keep:
        a = np.asarray(Image.open(os.path.join(kd, x))).astype(np.int16); b = np.asarray(Image.open(os.path.join(DEV, 'alone_' + TAG + '_' + x))).astype(np.int16)
        d = np.abs(a - b); k = int(x[4:9]); s = next((s for s in shots if s['t0'] - 1 / 60 <= k / FPS < s['t1'] - 1 / 60), shots[-1])
        print(f"   frame {k:5d} (t {k / FPS:7.3f}, {s['id']} {s['eff']}): max diff {d.max()}, differing px {(d.max(axis=2) > 0).sum()}"); res.append({'k': k, 'max': int(d.max())})
    report['single'] = res
json.dump(report, open(os.path.join(DEV, f'check_{TAG}.json'), 'w'), indent=1)
