#!/usr/bin/env python3
"""Step 0 test composites (PLAN section 9, tests 2 and 4), quick numpy versions made before the film compositor could do them.
   work_fable/venv_hybrid/bin/python fable/take2/tools/step0_tests.py cross|kit
cross: the crossing clip, then the doorway itself grows to fill the frame and the picture is the life plate (wetlab). 30 fps, bar 21-22 audio.
kit:   two matted runners (work_fable/take2/tests/kit/<id>/rgba) over a dark paper ground with a text lane under each."""
import json, os, sys, glob, subprocess
import numpy as np, cv2
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..')); os.chdir(ROOT)
W, H, FPS = 1280, 720, 30
AUDIO = 'inputs/Merge (keychange down).wav'
BARS = [b['start'] for b in json.load(open('analysis_v3/timing.json'))['bars']]
def enc(frames, out, t0):
    n = 0; p = subprocess.Popen(['ffmpeg', '-v', 'error', '-y', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-s', f'{W}x{H}', '-r', str(FPS), '-i', '-', '-ss', f'{t0:.4f}', '-i', AUDIO,
                          '-map', '0:v', '-map', '1:a', '-shortest', '-c:v', 'libx264', '-crf', '17', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', out], stdin=subprocess.PIPE)
    for f in frames: p.stdin.write(np.ascontiguousarray(f, np.uint8).tobytes()); n += 1
    p.stdin.close(); p.wait(); print(out, n, 'frames')
def plate(d):
    fs = sorted(glob.glob(f'{d}/frames/f_*.jpg')); return lambda c: cv2.cvtColor(cv2.imread(fs[min(len(fs) - 1, max(0, int(c * 24 + 0.5)))]), cv2.COLOR_BGR2RGB)
def cross():
    A = plate('work_fable/take2/plates/cross_wetlab'); B = plate('work_fable/proof/plates/wetlab')
    t0, t1 = BARS[20], BARS[22]; c0 = 1.25; tw = BARS[21] - 0.42      # the wipe ends on the bar 22 downbeat
    def gen():
        n = int(round((t1 - t0) * FPS))
        for k in range(n):
            t = t0 + k / FPS; a = A(c0 + (t - t0)); u = min(1, max(0, (t - tw) / (BARS[21] - tw)))
            if u <= 0: yield a; continue
            m = (a[..., 0] > 200) & (a[..., 2] > 150); ys, xs = np.where(cv2.morphologyEx(m.astype(np.uint8), cv2.MORPH_OPEN, np.ones((9, 9), np.uint8)) > 0)
            x0, x1, y0, y1 = (xs.min(), xs.max(), ys.min(), ys.max()) if len(xs) > 500 else (270, 440, 90, 520)
            e = u * u * u; X0, X1, Y0, Y1 = [int(round(v)) for v in (x0 * (1 - e), x1 + (W - x1) * e, y0 * (1 - e), y1 + (H - y1) * e)]
            b = B(max(0, t - BARS[21]) ); bw, bh = X1 - X0, Y1 - Y0; s = max(bw / W, bh / H); r = cv2.resize(b, (max(bw, int(W * s + 1)), max(bh, int(H * s + 1))), interpolation=cv2.INTER_AREA)
            ox, oy = (r.shape[1] - bw) // 2, (r.shape[0] - bh) // 2; a = a.copy(); a[Y0:Y1, X0:X1] = r[oy:oy + bh, ox:ox + bw]; yield a
    enc(gen(), 'review/fable_take2/step0/t4_crossing.mp4', t0)
def kit():
    from PIL import Image, ImageDraw, ImageFont
    R = [('runner_pencil', '#FFD23F', 'first chair, first violin'), ('runner_pixel', '#3DDC97', 'a full house at 2am, everyone shipping')]
    seqs = [sorted(glob.glob(f'work_fable/take2/tests/kit/{r[0]}/rgba/f_*.png')) for r in R]
    font = ImageFont.truetype('engine/fonts/JetBrainsMono[wght].ttf', 20); rng = np.random.default_rng(7)
    paper = np.clip(18 + rng.normal(0, 3.5, (H, W, 1)), 0, 255) * np.array([1, 1.02, 1.25])
    def gen():
        for k in range(150):
            c = k / FPS; im = Image.fromarray(paper.astype(np.uint8)); d = ImageDraw.Draw(im)
            for j, (rid, col, msg) in enumerate(R):       # written lane under each runner, scrolling right (she runs left)
                y = 330 + j * 330; s = (msg.upper() + ' · ') * 12; off = int((c * 260) % d.textlength(msg.upper() + ' · ')); d.text((-600 + off, y), s, font=font, fill=col); d.line([(0, y + 27), (W, y + 27)], fill=col, width=2)
            f = np.asarray(im).astype(np.float32)
            for j, sq in enumerate(seqs):
                g = cv2.imread(sq[min(len(sq) - 1, int(c * 24 + 0.5))], cv2.IMREAD_UNCHANGED); g = cv2.resize(g, (640, 360), interpolation=cv2.INTER_AREA)
                al = g[..., 3:4].astype(np.float32) / 255; rgb = g[..., 2::-1].astype(np.float32); x, y = 330 + j * 60, 5 + j * 330
                h = min(360, H - y); f[y:y + h, x:x + 640] = rgb[:h] * al[:h] + f[y:y + h, x:x + 640] * (1 - al[:h])
            yield f
    enc(gen(), 'review/fable_take2/step0/t2_runner_kit.mp4', BARS[42])
{'cross': cross, 'kit': kit}[sys.argv[1]]()
