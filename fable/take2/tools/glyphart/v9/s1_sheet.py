#!/usr/bin/env python3
"""v8-vs-v9 sheet at 640 px for the style-1 shots: film_v8_local frame at Jade's note time | the glyph plate frame the shot plays
then (clip map from shots.js/film.js, no crop/zoom), | the source plate frame. One row per shot; also one PNG per shot.
  s1_sheet.py OUTDIR"""
import os, sys, subprocess, cv2, numpy as np
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..', '..', '..'))
W = os.path.join(ROOT, 'work_fable', 'take2')
# shot, source plate, song t (her note), shot t0, clip0, speed
S = [('va02', 'main_split', 29.82 + 0.6, 29.8231, 0.5, 2.7 / 1.7364), ('va10', 'main_release', 44.43, 43.7249, 0, 1),
     ('ca01', 'hero_paper_v2', 70.79, 69.716, 69.716 - 69.2 - 0.04, 1), ('ca03', 'hero_feet', 75.84, 74.9244, 0, 1),
     ('ca09', 'look_back', 91.10, 90.5317, 0, 1), ('ca11', 'main_back_wide_v2', 97.09, 95.7269, 0, 3 / 1.7305),
     ('ba01', 'float_top', 98.30, 97.4574, 0, 1), ('ba02', 'float_face', 101.70, 100.9171, 0, 1),
     ('cb02', 'c2_lookup_v2', 209.98, 209.5262, 0.3, 3.2 / 1.7051), ('cb09', 'catch', 222.36, 221.436, 0, 1),
     ('oa03', 'day_eyes_v2', 241.71, 241.0084, 0.62, 1.71 / 1.7043)]
out = sys.argv[1]; os.makedirs(out, exist_ok=True); rows = []
for sid, pl, t, t0, c0, sp in S:
    g = os.path.join(W, 'plates', pl + '_glyph', 'frames')
    if not os.path.isdir(g) or len(os.listdir(g)) < 121:
        print('skip', sid, '(not finished)'); continue
    i = int(round((c0 + (t - t0) * sp) * 24)) + 1
    v8 = os.path.join(out, f'v8_{sid}.png')
    if not os.path.exists(v8):
        subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{t}', '-i', os.path.join(W, 'out', 'film_v8_local.mp4'), '-frames:v', '1', v8])
    ims = [cv2.imread(v8), cv2.imread(os.path.join(g, f'f_{i:04d}.jpg')), cv2.imread(os.path.join(W, 'plates', pl, 'frames', f'f_{i:04d}.jpg'))]
    ims = [cv2.resize(x, (640, 360), interpolation=cv2.INTER_AREA) for x in ims]
    for x, l in zip(ims, (f'{sid} v8 {t:.2f}', f'v9 {pl}_glyph f{i}', 'source plate')):
        cv2.putText(x, l, (8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 0, 0), 3); cv2.putText(x, l, (8, 22), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (255, 255, 255), 1)
    r = cv2.hconcat(ims); rows.append(r); cv2.imwrite(os.path.join(out, f's1_{sid}.jpg'), r, [cv2.IMWRITE_JPEG_QUALITY, 85])
if rows:
    cv2.imwrite(os.path.join(out, 's1_all.jpg'), cv2.vconcat(rows), [cv2.IMWRITE_JPEG_QUALITY, 82])
