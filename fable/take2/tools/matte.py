#!/usr/bin/env python3
"""Cut-out (K) layers: matte a still or a clip with BiRefNet (the matte step of fable/tools/hybrid/hybrid.py). Nothing leaves the machine.
   work_fable/venv_hybrid/bin/python fable/take2/tools/matte.py SRC(.jpg|.png|.mp4) OUTDIR [--fps 24] [--size 1280x720] [--over '#101018']
Writes OUTDIR/rgba/f_%04d.png (straight alpha), OUTDIR/meta.json, and OUTDIR/check.jpg: frames 1, mid and last over a flat colour and
over a checker, to judge the edge. The matte is run on the whole frame and again on a square crop round the figure (finer edge)."""
import json, os, sys, subprocess
import numpy as np, cv2
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.abspath(os.path.join(HERE, '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'fable', 'tools', 'hybrid')); import hybrid
def frames(src, w, h, fps):
    if src.lower().endswith(('.jpg', '.png', '.jpeg')):
        yield cv2.cvtColor(cv2.resize(cv2.imread(src), (w, h), interpolation=cv2.INTER_AREA), cv2.COLOR_BGR2RGB); return
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', src, '-vf', f'fps={fps},scale={w}:{h}:flags=lanczos', '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    while True:
        b = p.stdout.read(w * h * 3)
        if len(b) < w * h * 3: break
        yield np.frombuffer(b, np.uint8).reshape(h, w, 3)
def main():
    a = sys.argv[1:]; src, out = a[0], a[1]
    opt = {a[i][2:]: a[i + 1] for i in range(2, len(a) - 1, 2)}
    w, h = map(int, opt.get('size', '1280x720').split('x')); fps = int(opt.get('fps', 24))
    over = opt.get('over', '#101018'); oc = np.array([int(over[i:i + 2], 16) for i in (1, 3, 5)], np.float32)
    os.makedirs(os.path.join(out, 'rgba'), exist_ok=True); M = hybrid.Matter(); keep = []; n = 0
    for rgb in frames(src, w, h, fps):
        a0 = M(rgb); ys, xs = np.where(a0 > 0.5)
        if len(xs) > 50:   # second pass on a square crop round the figure
            cx, cy = (xs.min() + xs.max()) // 2, (ys.min() + ys.max()) // 2; s = int(max(xs.max() - xs.min(), ys.max() - ys.min()) * 1.15) // 2 + 8
            x0, x1, y0, y1 = max(0, cx - s), min(w, cx + s), max(0, cy - s), min(h, cy + s)
            a1 = np.zeros_like(a0); a1[y0:y1, x0:x1] = M(np.ascontiguousarray(rgb[y0:y1, x0:x1])); a0 = a1
        n += 1; al = (a0 * 255 + 0.5).astype(np.uint8)
        cv2.imwrite(os.path.join(out, 'rgba', f'f_{n:04d}.png'), cv2.cvtColor(np.dstack([rgb, al]), cv2.COLOR_RGBA2BGRA))
        keep.append((rgb, a0))
        if len(keep) > 3 and n % 2: keep.pop(1)   # first, a middle one, last
    json.dump({'fps': fps, 'n': n, 'w': w, 'h': h, 'src': os.path.relpath(src, ROOT), 'alpha': 'straight'}, open(os.path.join(out, 'meta.json'), 'w'))
    yy, xx = np.mgrid[0:h, 0:w]; chk = np.where(((yy // 24 + xx // 24) % 2)[..., None] == 0, 200., 90.) * np.ones(3)
    rows = []
    for rgb, al in [keep[0], keep[len(keep) // 2], keep[-1]]:
        A = al[..., None]; rows.append(np.hstack([rgb * A + oc * (1 - A), rgb * A + chk * (1 - A)]))
    cv2.imwrite(os.path.join(out, 'check.jpg'), cv2.cvtColor(np.vstack(rows).astype(np.uint8), cv2.COLOR_RGB2BGR), [cv2.IMWRITE_JPEG_QUALITY, 88])
    print(out, n, 'frames')
main()
