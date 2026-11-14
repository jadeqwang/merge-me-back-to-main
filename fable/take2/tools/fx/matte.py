#!/usr/bin/env python3
"""Keep masks for the glyph pass: BiRefNet (the ONNX model fable/tools/hybrid uses, local, nothing leaves the machine) on a still or
a frames folder, cut to the connected piece that contains a seed point (her), optionally limited to a region, dilated a little.
Written as RGBA: white, alpha = kept (the source shows through untouched there; the glyph pass uses the alpha as is, no conversion).
  <python with onnxruntime + cv2> -I fable/take2/tools/fx/matte.py --in still.jpg|frames_dir --out mask.png|mask_dir \
      --seed 0.69,0.2 [--region 0.42,0,0.9,1] [--dilate 9] [--every 1]
(--seed and --region in 0..1 of the frame; --every N mattes every Nth frame and copies it to the frames between, for speed.)
"""
import argparse, os, sys
import numpy as np, cv2

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..'))
BIREFNET = os.path.join(ROOT, 'work_fable', 'hybrid', 'models', 'models', 'birefnet-general', 'birefnet-general.onnx')


class Matter:
    def __init__(self):
        import onnxruntime as ort
        so = ort.SessionOptions(); so.log_severity_level = 3
        self.s = ort.InferenceSession(BIREFNET, so, providers=[p for p in ('CUDAExecutionProvider', 'CPUExecutionProvider') if p in ort.get_available_providers()])
        self.inp = self.s.get_inputs()[0].name
        print('matte: BiRefNet on', self.s.get_providers()[0], flush=True)

    def __call__(self, rgb):
        h, w = rgb.shape[:2]
        x = cv2.resize(rgb, (1024, 1024), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        x = ((x - (0.485, 0.456, 0.406)) / (0.229, 0.224, 0.225)).astype(np.float32).transpose(2, 0, 1)[None]
        y = self.s.run(None, {self.inp: x})[-1][0, 0]
        return cv2.resize(1 / (1 + np.exp(-y)), (w, h), interpolation=cv2.INTER_CUBIC).clip(0, 1)


def cut(a, seed, region, dilate):
    h, w = a.shape
    m = (a > 0.5).astype(np.uint8)
    if region:
        x0, y0, x1, y1 = region; r = np.zeros_like(m); r[int(y0 * h):int(y1 * h), int(x0 * w):int(x1 * w)] = 1; m &= r
    n, lab = cv2.connectedComponents(m, connectivity=8)
    sx, sy = int(seed[0] * w), int(seed[1] * h)
    k = lab[sy, sx]
    if k == 0:   # seed fell outside: nearest labelled pixel
        ys, xs = np.nonzero(lab)
        if len(xs) == 0: return np.zeros_like(a)
        i = np.argmin((xs - sx) ** 2 + (ys - sy) ** 2); k = lab[ys[i], xs[i]]
    piece = (lab == k).astype(np.float32)
    soft = a * cv2.dilate(piece, np.ones((15, 15), np.uint8))       # keep the soft edge of that piece only
    if dilate: soft = cv2.dilate(soft, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (dilate, dilate)))
    return soft


def rgba(a):
    m = (a * 255 + .5).astype(np.uint8); w = np.full_like(m, 255)
    return np.dstack([w, w, w, m])


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--in', dest='inp', required=True); ap.add_argument('--out', required=True)
    ap.add_argument('--seed', default='0.69,0.2'); ap.add_argument('--region', default=None)
    ap.add_argument('--dilate', type=int, default=9); ap.add_argument('--every', type=int, default=1)
    ap.add_argument('--to-rgba', action='store_true', help='only convert existing grey masks (--in) to RGBA (--out), no model')
    a = ap.parse_args()
    seed = [float(v) for v in a.seed.split(',')]; region = [float(v) for v in a.region.split(',')] if a.region else None
    if a.to_rgba:
        fs = sorted(os.listdir(a.inp)) if os.path.isdir(a.inp) else [None]
        for f in fs:
            src = os.path.join(a.inp, f) if f else a.inp; dst = os.path.join(a.out, f) if f else a.out
            if f: os.makedirs(a.out, exist_ok=True)
            g = cv2.imread(src, cv2.IMREAD_UNCHANGED)
            if g.ndim == 3 and g.shape[2] == 4: continue
            cv2.imwrite(dst, rgba(g.astype(np.float32) / 255))
        return
    M = Matter()
    if os.path.isdir(a.inp):
        fs = sorted(f for f in os.listdir(a.inp) if f.lower().endswith(('.png', '.jpg', '.jpeg')))
        os.makedirs(a.out, exist_ok=True); last = None
        for i, f in enumerate(fs):
            if i % a.every == 0 or last is None:
                rgb = cv2.imread(os.path.join(a.inp, f), cv2.IMREAD_COLOR)[..., ::-1]
                last = rgba(cut(M(np.ascontiguousarray(rgb)), seed, region, a.dilate))
            cv2.imwrite(os.path.join(a.out, os.path.splitext(f)[0] + '.png'), last)
        print('masks:', len(fs), '->', a.out)
    else:
        rgb = cv2.imread(a.inp, cv2.IMREAD_COLOR)[..., ::-1]
        cv2.imwrite(a.out, rgba(cut(M(np.ascontiguousarray(rgb)), seed, region, a.dilate))); print('mask ->', a.out)


if __name__ == '__main__':
    sys.exit(main())
