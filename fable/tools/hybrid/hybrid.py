#!/usr/bin/env python3
"""MERGE, Fable cut: the HYBRID shot. A video model's redraw of her, cut out and laid over the code-drawn world.

    python -I fable/tools/hybrid/hybrid.py <shot.json> <stage>[,<stage>...]      (stages run in the order given; `all` = every stage)

Run it with the venv in work_fable/venv_hybrid (see fable/notes/hybrid.md for the one-time setup). Everything is local and free:
BiRefNet (ONNX, MIT) for the matte, Real-ESRGAN anime (BSD) for the upscale, OpenCV/NumPy for the rest. Nothing leaves the machine.

Inputs of a shot (the JSON): `name`, `t0` (film time of the model clip's first frame), `fps`, `model` (the video model's clip, 1280x720),
`frames`, and optional per-shot overrides (see DEFAULTS). The code renders (ref / plate / norefl, 1920x1080) come from render_plates.sh.

Stages (each writes under work_fable/hybrid/<name>/ and can be re-run alone):
  frames    model clip -> model/%04d.png; the model's own cut frames near the code cuts (segments.json)
  patch     clean plate stills for frames where the code frame blends two shots or the model cuts a frame late/early (platefix/; runs the render harness)
  code      ref, plate, norefl -> the code figure's mask and box per frame (codefig/, code.json), the code mirror image (coderefl/)
  a0        coarse matte of every model frame at 720p (BiRefNet on the whole frame): where she is (a0/)
  up        Real-ESRGAN anime x4 on the model frames, stored at x2 (up/)
  a1        fine matte: BiRefNet again on a square crop round her from the x2 frames (a1/)
  alpha     orphans dropped, road guard at shoe level, light choke, motion-aware temporal median (alpha/)
  register  model figure -> code figure: time lag check, one scale per segment, slow offsets, the mirror line (reg.json)
  comp      plate + her mirror image + her layer + HUD guard -> out/%04d.png (and layer/ = her alpha at film resolution)
  encode    hybrid_<name>.mp4 and hybrid_<name>_compare.mp4 with the song (review folder), each kept under 15 MB
  qa        contact strips for judging (work_fable/hybrid/qa/)
"""
import argparse, json, os, subprocess, sys, time
import numpy as np, cv2

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..'))
WORK = os.path.join(ROOT, 'work_fable', 'hybrid')
MODELS = os.path.join(WORK, 'models')
BIREFNET = os.path.join(MODELS, 'models', 'birefnet-general', 'birefnet-general.onnx')     # fetched once by rembg (github.com/danielgatis/rembg releases)
ESRGAN = os.path.join(MODELS, 'esrgan', 'RealESRGAN_x4plus_anime_6B.pth')                   # github.com/xinntao/Real-ESRGAN releases
W, H = 1920, 1080          # the film
MW, MH = 1280, 720         # the model clip
UP = 2                     # her layer is stored at x2 of the model clip (x4 from the upscaler, area-averaged down)

DEFAULTS = {
    'audio': 'inputs/Merge.wav',
    'review': 'review/fable_v7/seedance_test',      # where encode writes
    'cuts': 'fable/show/cuts.json',
    'lag': 0,                 # model frame k shows code frame k + lag
    'fig_thr': 14,            # code figure mask: |norefl - plate| above this (0..255)
    'crop_pad': 0.10,         # fine-matte crop: her box per segment, padded by this fraction of its size
    'smooth_sigma': 16.0,     # registration: gaussian sigma (frames) of the slow residual on top of the robust line, inside a shot
    'fixed_scale': True,      # registration: one scale per segment (median) instead of a slowly varying one
    'road_guard': 0.12,       # matte: lane-coloured pixels in the lowest fraction of her height are road, not her (0 = off)
    'refl': {},               # reflection overrides: on, gain, blur, ripple, road_key {h: [lo, hi], s, v} (OpenCV HSV) (see comp)
    'grade': {},              # her layer: gain [r, g, b], sat, wrap (light wrap strength), wrap_px (see comp)
}


def log(*a):
    print(time.strftime('%H:%M:%S'), *a, flush=True)


def load_shot(path):
    with open(path) as f:
        s = json.load(f)
    for k, v in DEFAULTS.items():
        s.setdefault(k, v)
    s['dir'] = os.path.join(WORK, s['name'])
    s['path'] = path
    os.makedirs(s['dir'], exist_ok=True)
    f0 = round(s['t0'] * s['fps'])
    s['f0'] = f0
    s['times'] = [(f0 + k) / s['fps'] for k in range(s['frames'])]
    cuts = []
    cp = os.path.join(ROOT, s['cuts'])
    if os.path.exists(cp):
        with open(cp) as f:
            cuts = json.load(f).get('cuts', [])
    # a cut at film time c: the first code frame of the new shot is the first frame whose time >= c. The harness blurs over half a frame interval, so a frame whose
    # shutter window holds the cut is a blend of both shots (24 fps does not divide the song's bars). The model's own cut may sit a frame later or earlier: `frames`
    # finds it in the model clip (segments.json), and `patch` renders a clean plate for every frame where code and model disagree or the code frame is a blend.
    sh = 0.25 / s['fps']
    s['cutinfo'] = []
    for c in cuts:
        if s['times'][0] < c <= s['times'][-1]:
            kc = int(np.ceil(c * s['fps'] - 1e-6)) - f0
            s['cutinfo'].append({'t': c, 'code_frame': kc, 'model_frame': kc, 'blend': [k for k in (kc - 1, kc) if 0 <= k < s['frames'] and abs(s['times'][k] - c) < sh]})
    sp = os.path.join(s['dir'], 'segments.json')
    if os.path.exists(sp):
        with open(sp) as f:
            s['cutinfo'] = json.load(f)
    edges = sorted({0, s['frames']} | {c['model_frame'] for c in s['cutinfo']})
    s['segments'] = [(a, b) for a, b in zip(edges[:-1], edges[1:]) if b > a]
    # frames whose code render is not a clean picture of the shot the model shows there (no use for registration), and the time a clean plate is rendered at
    s['patch'] = {}
    for c in s['cutinfo']:
        kc, km = c['code_frame'], c['model_frame']
        for k in set(range(min(kc, km), max(kc, km))) | set(c['blend']):
            if 0 <= k < s['frames']:
                s['patch'][k] = c['t'] - 0.003 if k < km else max(s['times'][k], c['t'] + 0.003)
    return s


def P(s, *a):
    p = os.path.join(s['dir'], *a)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    return p


def read_video(path, w, h):
    """frames of a video as RGB uint8 arrays (ffmpeg pipe; bt709 limited range -> full range RGB)"""
    p = subprocess.Popen(['ffmpeg', '-v', 'error', '-i', path, '-f', 'rawvideo', '-pix_fmt', 'rgb24', '-'], stdout=subprocess.PIPE)
    n = w * h * 3
    while True:
        b = p.stdout.read(n)
        if len(b) < n:
            break
        yield np.frombuffer(b, np.uint8).reshape(h, w, 3)
    p.wait()


def imread(p, flags=cv2.IMREAD_UNCHANGED):
    a = cv2.imread(p, flags)
    if a is None:
        raise FileNotFoundError(p)
    return a


# ------------------------------------------------------------------------------------------------ frames
def stage_frames(s):
    d = P(s, 'model', 'x')[:-2]
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', os.path.join(ROOT, s['model']), '-frames:v', str(s['frames']), os.path.join(d, '%04d.png')], check=True)
    # ffmpeg numbers from 1: rename to 0-based
    for k in range(s['frames']):
        os.replace(os.path.join(d, f'{k + 1:04d}.png'), os.path.join(d, f'{k:04d}.png'))
    # the model's own cuts: the largest frame-to-frame change within two frames of each code cut
    small = lambda k: cv2.resize(imread(os.path.join(d, f'{k:04d}.png'), cv2.IMREAD_COLOR), (160, 90), interpolation=cv2.INTER_AREA).astype(np.float32)
    info = []
    for c in s['cutinfo']:
        kc = c['code_frame']
        best = (-1, kc)
        for j in range(max(1, kc - 2), min(s['frames'] - 1, kc + 2) + 1):
            dd = float(np.abs(small(j) - small(j - 1)).mean())
            if dd > best[0]:
                best = (dd, j)
        info.append(dict(c, model_frame=best[1], change=best[0]))
        log(f'frames: cut at {c["t"]}: code frame {kc}, model cuts at frame {best[1]} (change {best[0]:.1f}), blended code frames {c["blend"]}')
    with open(os.path.join(s['dir'], 'segments.json'), 'w') as f:
        json.dump(info, f)
    log('frames:', s['frames'], '->', d)


# ------------------------------------------------------------------------------------------------ patch (clean plates round a cut)
def stage_patch(s):
    s = load_shot(s['path'])
    if not s['patch']:
        log('patch: nothing to do')
        return
    items = ','.join(f'{t:.4f}:{P(s, "platefix", f"{k:04d}.png")}' for k, t in sorted(s['patch'].items()))
    cmd = ['node', os.path.join(ROOT, 'fable', 'tools', 'render.mjs'), '--show', '/fable/show/main.js', '--res', f'{W}x{H}', '--fps', str(s['fps']), '--mb', '4', '--shutter', '0.05', '--q', 'hide=fig', '--stills', items]
    subprocess.run(cmd, check=True, cwd=ROOT, stdout=subprocess.DEVNULL)
    log('patch: clean plates for frames', {k: round(t, 4) for k, t in sorted(s['patch'].items())})


# ------------------------------------------------------------------------------------------------ code
def stage_code(s):
    """The code figure, from the renders themselves: figure = |norefl - plate|, her mirror image = |ref - norefl|."""
    gens = [read_video(P(s, n + '.mp4'), W, H) for n in ('ref', 'plate', 'norefl')]
    out = []
    k3 = np.ones((3, 3), np.uint8)
    for k, (ref, plate, norefl) in enumerate(zip(*gens)):
        if k >= s['frames']:
            break
        d = np.abs(norefl.astype(np.int16) - plate.astype(np.int16)).max(axis=2).astype(np.uint8)
        m = cv2.morphologyEx((d > s['fig_thr']).astype(np.uint8), cv2.MORPH_OPEN, k3)
        n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
        rec = {'k': k, 't': s['times'][k], 'box': None}
        if n > 1:
            # her body = the largest piece and whatever touches its dilated neighbourhood (a hand or a strap seen apart)
            big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
            body = cv2.dilate((lab == big).astype(np.uint8), np.ones((41, 41), np.uint8))
            keep = np.unique(lab[(body > 0) & (m > 0)])
            m = np.isin(lab, keep[keep > 0]).astype(np.uint8)
            ys, xs = np.where(m > 0)
            x0, x1, y0, y1 = int(xs.min()), int(xs.max()) + 1, int(ys.min()), int(ys.max()) + 1
            rows = m.sum(axis=1)
            # feet: the lowest rows; their x extent and centre (bottom 3 % of her height)
            fb = m[max(y0, y1 - max(4, int(0.03 * (y1 - y0)))):y1]
            fx = np.where(fb.any(axis=0))[0]
            rec.update(box=[x0, y0, x1, y1], area=int(m.sum()), cx=float(xs.mean()), cy=float(ys.mean()), feet_x=[int(fx.min()), int(fx.max()) + 1],
                       cut=[bool(x0 <= 1), bool(y0 <= 1), bool(x1 >= W - 1), bool(y1 >= H - 1)])
            # the mirror image: |ref - norefl| below her
            dr = np.abs(ref.astype(np.int16) - norefl.astype(np.int16)).max(axis=2)
            mr = (dr > 5).astype(np.uint8)
            mr[:, :max(0, x0 - 40)] = 0
            mr[:, min(W, x1 + 40):] = 0
            rr = np.where(mr.sum(axis=1) >= 3)[0]
            rr = rr[rr > y0 + 0.5 * (y1 - y0)]
            if len(rr):
                rec['refl_top'] = int(rr.min())
                rec['refl_bottom'] = int(rr.max()) + 1
            cv2.imwrite(P(s, 'coderefl', f'{k:04d}.png'), np.clip(dr * 4, 0, 255).astype(np.uint8))
        cv2.imwrite(P(s, 'codefig', f'{k:04d}.png'), m * 255)
        out.append(rec)
    with open(P(s, 'code.json'), 'w') as f:
        json.dump(out, f)
    log('code:', len(out), 'frames; boxes', sum(1 for r in out if r['box']))


# ------------------------------------------------------------------------------------------------ matte (BiRefNet, ONNX)
class Matter:
    def __init__(self):
        import torch  # noqa: F401  (loads the CUDA libraries onnxruntime-gpu needs)
        import onnxruntime as ort
        so = ort.SessionOptions()
        so.log_severity_level = 3
        self.s = ort.InferenceSession(BIREFNET, so, providers=['CUDAExecutionProvider', 'CPUExecutionProvider'])
        self.inp = self.s.get_inputs()[0].name
        log('matte: BiRefNet on', self.s.get_providers()[0])

    def __call__(self, rgb):
        """rgb uint8 (h, w, 3) -> alpha float32 (h, w) 0..1"""
        h, w = rgb.shape[:2]
        x = cv2.resize(rgb, (1024, 1024), interpolation=cv2.INTER_AREA if max(h, w) > 1024 else cv2.INTER_CUBIC).astype(np.float32) / 255
        x = ((x - (0.485, 0.456, 0.406)) / (0.229, 0.224, 0.225)).astype(np.float32).transpose(2, 0, 1)[None]
        y = self.s.run(None, {self.inp: x})[-1][0, 0]
        a = 1 / (1 + np.exp(-y))
        return cv2.resize(a, (w, h), interpolation=cv2.INTER_CUBIC if max(h, w) > 1024 else cv2.INTER_AREA).clip(0, 1)


def stage_a0(s):
    M = Matter()
    t = time.time()
    for k in range(s['frames']):
        rgb = imread(P(s, 'model', f'{k:04d}.png'), cv2.IMREAD_COLOR)[..., ::-1]
        cv2.imwrite(P(s, 'a0', f'{k:04d}.png'), (M(np.ascontiguousarray(rgb)) * 255 + 0.5).astype(np.uint8))
    log(f'a0: {s["frames"]} frames in {time.time() - t:.1f} s')


# ------------------------------------------------------------------------------------------------ up (Real-ESRGAN anime)
def stage_up(s):
    import torch
    from spandrel import ModelLoader
    m = ModelLoader().load_from_file(ESRGAN)
    m.cuda().eval()
    m.half()
    t = time.time()
    for k in range(s['frames']):
        bgr = imread(P(s, 'model', f'{k:04d}.png'), cv2.IMREAD_COLOR)
        x = torch.from_numpy(np.ascontiguousarray(bgr[..., ::-1])).cuda().permute(2, 0, 1)[None].half() / 255
        with torch.no_grad():
            y = m(x)
        o = (y[0].permute(1, 2, 0).float().clamp(0, 1).cpu().numpy() * 255 + 0.5).astype(np.uint8)[..., ::-1]
        cv2.imwrite(P(s, 'up', f'{k:04d}.png'), cv2.resize(o, (MW * UP, MH * UP), interpolation=cv2.INTER_AREA), [cv2.IMWRITE_PNG_COMPRESSION, 1])
    log(f'up: {s["frames"]} frames in {time.time() - t:.1f} s')


# ------------------------------------------------------------------------------------------------ a1 (fine matte + guards + temporal)
def main_piece(a, thr=127, reach=31):
    """the largest connected piece of a matte and everything within `reach` px of it (a strap or a hand seen apart)"""
    m = (a > thr).astype(np.uint8)
    n, lab, st, _ = cv2.connectedComponentsWithStats(m, 8)
    if n <= 1:
        return m
    big = 1 + int(np.argmax(st[1:, cv2.CC_STAT_AREA]))
    body = cv2.dilate((lab == big).astype(np.uint8), np.ones((reach, reach), np.uint8))
    keep = np.unique(lab[(body > 0) & (m > 0)])
    return np.isin(lab, keep[keep > 0]).astype(np.uint8)


def boxes_a0(s):
    """her box per model frame at 720p from the coarse matte: [x0, y0, x1, y1] (median-filtered over 5 frames against single-frame glitches)"""
    B = []
    for k in range(s['frames']):
        m = main_piece(imread(P(s, 'a0', f'{k:04d}.png'), 0))
        ys, xs = np.where(m > 0)
        B.append([xs.min(), ys.min(), xs.max() + 1, ys.max() + 1] if len(xs) else [0, 0, MW, MH])
    B = np.array(B, float)
    F = B.copy()
    for a, b in s['segments']:
        for k in range(a, b):
            F[k] = np.median(B[max(a, k - 2):min(b, k + 3)], axis=0)
    return B, F


def stage_a1(s):
    M = Matter()
    _, F = boxes_a0(s)
    N = s['frames']
    t = time.time()
    crops = []
    for a, b in s['segments']:
        side = max(np.percentile(F[a:b, 2] - F[a:b, 0], 95), np.percentile(F[a:b, 3] - F[a:b, 1], 95)) * (1 + 2 * s['crop_pad'])
        side = int(np.ceil(side * UP / 8) * 8)
        for k in range(a, b):
            cx, cy = (F[k, 0] + F[k, 2]) / 2 * UP, (F[k, 1] + F[k, 3]) / 2 * UP
            # her box must fit: a box larger than the 95th percentile (a flung arm) widens this frame's crop
            sd = int(max(side, np.ceil(max(F[k, 2] - F[k, 0], F[k, 3] - F[k, 1]) * UP * (1 + s['crop_pad']) / 8) * 8))
            crops.append([int(round(cx - sd / 2)), int(round(cy - sd / 2)), sd])
    for k in range(N):
        up = imread(P(s, 'up', f'{k:04d}.png'), cv2.IMREAD_COLOR)[..., ::-1]
        x0, y0, sd = crops[k]
        px0, py0, px1, py1 = max(0, -x0), max(0, -y0), max(0, x0 + sd - MW * UP), max(0, y0 + sd - MH * UP)
        c = up[max(0, y0):y0 + sd, max(0, x0):x0 + sd]
        if px0 or py0 or px1 or py1:
            c = cv2.copyMakeBorder(c, py0, py1, px0, px1, cv2.BORDER_REPLICATE)
        al = M(np.ascontiguousarray(c))
        al = al[py0:sd - py1, px0:sd - px1]
        full = np.zeros((MH * UP, MW * UP), np.float32)
        full[max(0, y0):max(0, y0) + al.shape[0], max(0, x0):max(0, x0) + al.shape[1]] = al
        cv2.imwrite(P(s, 'a1', f'{k:04d}.png'), (full * 255 + 0.5).astype(np.uint8))
    with open(P(s, 'crops.json'), 'w') as f:
        json.dump(crops, f)
    log(f'a1: {N} frames in {time.time() - t:.1f} s')

def seg_of(s, k):
    for a, b in s['segments']:
        if a <= k < b:
            return a, b
    return 0, s['frames']


def stage_alpha(s):
    """a1 -> alpha: orphans dropped, a light choke, and a motion-aware temporal median (flicker goes where the picture is still; a fast hand keeps its own frame)"""
    N = s['frames']
    lo, hi = s.get('choke', [0.12, 0.88])
    guard = s.get('road_guard', 0.12)
    key = s['refl'].get('road_key', {'h': [3, 24], 's': 110, 'v': 110})
    A = [None] * N
    G = [None] * N

    def load(k):
        if A[k] is None:
            a = imread(P(s, 'a1', f'{k:04d}.png'), 0)
            keep = main_piece(a, 96, 61)
            keep = cv2.dilate(keep, np.ones((9, 9), np.uint8))
            A[k] = np.clip((a.astype(np.float32) / 255 * keep - lo) / (hi - lo), 0, 1)
            bgr = imread(P(s, 'up', f'{k:04d}.png'), cv2.IMREAD_COLOR)
            # road guard: lane-coloured pixels at the level of her shoes are the model's road (its ring, its arrow-head), never her (white trainers, navy hems).
            # Only when her feet are in frame; the straps hang higher than the zone (the lowest `road_guard` of her height)
            ys = np.where((A[k] > 0.5).any(axis=1))[0]
            if guard > 0 and len(ys) and ys.max() < MH * UP - 3:
                z0 = int(ys.max() + 1 - guard * (ys.max() + 1 - ys.min()))
                A[k][z0:] *= 1 - np.clip(road_key(np.ascontiguousarray(bgr[z0:, :, ::-1]), key) * 1.5, 0, 1)
                A[k] *= cv2.dilate(main_piece((A[k] * 255).astype(np.uint8), 96, 61), np.ones((5, 5), np.uint8))
            g = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
            G[k] = cv2.GaussianBlur(g.astype(np.float32), (0, 0), 2.0)
        return A[k], G[k]

    ch = []
    for k in range(N):
        a, b = seg_of(s, k)
        ak, gk = load(k)
        out = ak
        if k - 1 >= a and k + 1 < b:
            ap, gp = load(k - 1)
            an, gn = load(k + 1)
            med = np.median(np.stack([ap, ak, an]), axis=0)
            d = cv2.GaussianBlur(np.maximum(np.abs(gk - gp), np.abs(gk - gn)), (0, 0), 4.0)
            w = np.exp(-(d / s.get('still_thr', 5.0)) ** 2)
            out = w * med + (1 - w) * ak
        ch.append(float(np.abs(out - ak).sum() / max(1.0, ak.sum())))
        cv2.imwrite(P(s, 'alpha', f'{k:04d}.png'), (out * 255 + 0.5).astype(np.uint8))
        if k - 2 >= 0:
            A[k - 2] = G[k - 2] = None
    log(f'alpha: temporal median changed {100 * np.mean(ch):.2f} % of the matte on average, max {100 * np.max(ch):.2f} % (frame {int(np.argmax(ch))})')


# ------------------------------------------------------------------------------------------------ register
def robust_smooth(v, ok, sigma, win=9, degree=1):
    """a slow track through noisy per-frame estimates: a robust polynomial (Tukey biweight, IRLS) plus the gaussian-smoothed residual of the inliers.
    Outliers (a jump the model drew higher, a matte glitch, the last frames where the model left the motion) do not pull it."""
    v = np.array(v, float)
    ok = np.array(ok, bool) & np.isfinite(v)
    n = len(v)
    t = np.arange(n, dtype=float)
    if ok.sum() == 0:
        return np.zeros(n)
    if ok.sum() < 4:
        return np.full(n, np.median(v[ok]))
    deg = min(degree, 1 if n < 24 else degree)
    tt = (t - t.mean()) / max(1.0, n / 2)
    X = np.stack([tt ** d for d in range(deg + 1)], axis=1)
    w = ok.astype(float)
    coef = np.zeros(deg + 1)
    coef[0] = np.median(v[ok])
    for _ in range(30):
        r = v - X @ coef
        sc = 1.4826 * np.median(np.abs(r[ok] - np.median(r[ok]))) + 0.3
        u = np.clip(r / (4.0 * sc), -1, 1)
        w = ok * (1 - u ** 2) ** 2
        if w.sum() < deg + 2:
            break
        A = X * w[:, None]
        coef = np.linalg.lstsq(A.T @ X, A.T @ v, rcond=None)[0]
    fit = X @ coef
    r = v - fit
    sc = 1.4826 * np.median(np.abs(r[ok] - np.median(r[ok]))) + 0.3
    inl = ok & (np.abs(r) < 3.0 * sc)
    if sigma <= 0 or inl.sum() < 4:
        return fit
    x = np.interp(t, t[inl], r[inl])
    rr = int(min(n - 1, np.ceil(3 * sigma)))
    pad = np.pad(x, rr, mode='reflect')
    g = np.exp(-0.5 * (np.arange(-rr, rr + 1) / sigma) ** 2)
    return fit + np.convolve(pad, g / g.sum(), mode='valid')


def stage_register(s):
    """Her layer (x2 canvas of the model clip) -> film pixels: x_film = S * x + TX, y_film = S * y + TY.
    S: one value per segment (median of code height / model height). TY: her feet on the code figure's feet (her head on its head while the frame cuts her legs).
    TX: best overlap of the two silhouettes. TX, TY vary slowly inside a segment. The mirror line comes from the code reflection."""
    with open(P(s, 'code.json')) as f:
        code = json.load(f)
    N = s['frames']
    lag = s['lag']
    mb = []
    al = []
    for k in range(N):
        a = imread(P(s, 'alpha', f'{k:04d}.png'), 0)
        m = a > 127
        ys, xs = np.where(m)
        mb.append([xs.min(), ys.min(), xs.max() + 1, ys.max() + 1])
        al.append(cv2.resize(a, (MW, MH), interpolation=cv2.INTER_AREA))          # 720p copies for the overlap search
    mb = np.array(mb, float)
    cb = np.array([code[min(N - 1, max(0, k + lag))]['box'] for k in range(N)], float)
    # ---- lag check (report only): first differences of the box edges
    best = None
    for L in range(-3, 4):
        idx = np.arange(max(0, -L), min(N, N - L))
        e = []
        for c in range(4):
            dm, dc = np.diff(mb[idx, c]), np.diff(np.array([code[i + L]['box'][c] for i in idx], float))
            okk = (np.abs(dm) < 150) & (np.abs(dc) < 150)
            e.append(np.corrcoef(dm[okk], dc[okk])[0, 1] if okk.sum() > 8 else 0)
        sc = float(np.mean(e))
        if best is None or sc > best[1]:
            best = (L, sc)
    log(f'register: best time lag {best[0]} (corr {best[1]:.3f}); using lag {lag}')
    Sx = np.zeros(N)
    TX = np.zeros(N)
    TY = np.zeros(N)
    raw = []
    for a, b in s['segments']:
        ks = np.arange(a, b)
        good = np.array([k not in s['patch'] for k in ks])          # code frames that are a clean picture of this shot
        m_cut_b = mb[ks, 3] >= MH * UP - 2
        m_cut_t = mb[ks, 1] <= 1
        c_cut_b = cb[ks, 3] >= H - 2
        c_cut_t = cb[ks, 1] <= 1
        full = ~(m_cut_b | m_cut_t | c_cut_b | c_cut_t) & good
        hs = (cb[ks, 3] - cb[ks, 1]) / (mb[ks, 3] - mb[ks, 1])
        if s.get('scale') is not None:
            S = np.full(len(ks), float(s['scale']) * 1.5 / UP)
        elif full.sum() >= 3:
            S = np.full(len(ks), np.median(hs[full])) if s['fixed_scale'] else robust_smooth(hs, full, s['smooth_sigma'] * 2)
        else:
            S = np.full(len(ks), 1.5 / UP)
            log(f'register: segment {a}-{b}: she is never whole in frame; scale left at 1 (set "scale" in the shot file)')
        ty_b = cb[ks, 3] - S * mb[ks, 3]
        ty_t = cb[ks, 1] - S * mb[ks, 1]
        ok_b = ~(m_cut_b | c_cut_b) & good
        ok_t = ~(m_cut_t | c_cut_t) & good
        both = ok_b & ok_t
        bias = np.median((ty_t - ty_b)[both]) if both.sum() >= 3 else 0.0          # her hair stands a little higher or lower than the code figure's
        ty = np.where(ok_b, ty_b, ty_t - bias)
        # TX: overlap of the silhouettes at 720p, her matte scaled by S * UP / 1.5
        tx = np.zeros(len(ks))
        okx = np.zeros(len(ks), bool)
        for i, k in enumerate(ks):
            cm = cv2.resize(imread(P(s, 'codefig', f'{min(N - 1, max(0, k + lag)):04d}.png'), 0), (MW, MH), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
            sc = S[i] * UP / 1.5
            mm = cv2.resize(al[k], None, fx=sc, fy=sc, interpolation=cv2.INTER_AREA if sc < 1 else cv2.INTER_LINEAR).astype(np.float32) / 255
            pad = 80
            big = np.pad(cm, ((pad, pad + max(0, mm.shape[0] - MH)), (pad, pad + max(0, mm.shape[1] - MW))))
            res = cv2.matchTemplate(big, mm, cv2.TM_CCORR)
            # only shifts whose vertical part agrees with the feet/head estimate
            yy = int(round(ty[i] / 1.5)) + pad
            row = res[max(0, yy - 3):yy + 4].max(axis=0) if 0 <= yy < res.shape[0] else res.max(axis=0)
            j = int(np.argmax(row))
            # sub-pixel peak
            d = 0.0
            if 0 < j < len(row) - 1:
                den = row[j - 1] - 2 * row[j] + row[j + 1]
                d = 0.5 * (row[j - 1] - row[j + 1]) / den if abs(den) > 1e-9 else 0.0
            tx[i] = (j + d - pad) * 1.5
            okx[i] = (2 < j < len(row) - 3) and good[i]
        Sx[a:b] = S
        TX[a:b] = robust_smooth(tx, okx, s['smooth_sigma'])
        TY[a:b] = robust_smooth(ty, ok_b | ok_t, s['smooth_sigma'])
        raw += [{'k': int(k), 'hs': float(hs[i]), 'ty_b': float(ty_b[i]), 'ty_t': float(ty_t[i]), 'tx': float(tx[i]), 'full': bool(full[i])} for i, k in enumerate(ks)]
        res_b = (ty_b - TY[a:b])[ok_b]
        log(f'register: segment {a}-{b}: S {np.median(S):.4f} (x{np.median(S) * UP / 1.5:.4f} at equal resolution), TX {TX[a:b].min():.1f}..{TX[a:b].max():.1f}, TY {TY[a:b].min():.1f}..{TY[a:b].max():.1f} film px; '
            f'feet residual (her lowest point against the code figure\'s): median {np.median(np.abs(res_b)) if len(res_b) else 0:.1f} px, rms {np.sqrt(np.mean(res_b ** 2)) if len(res_b) else 0:.1f} px, max {np.abs(res_b).max() if len(res_b) else 0:.1f} px; '
            f'largest step of the track {max(np.abs(np.diff(TX[a:b])).max(), np.abs(np.diff(TY[a:b])).max()) if b - a > 1 else 0:.2f} px/frame')
    # ---- the mirror line: the row about which the code figure flips onto the code reflection
    ML = np.full(N, np.nan)
    for k in range(N):
        r = code[min(N - 1, max(0, k + lag))]
        if not r['box'] or 'refl_top' not in r or k in s['patch']:
            continue
        x0, y0, x1, y1 = r['box']
        F = imread(P(s, 'codefig', f'{r["k"]:04d}.png'), 0)[:, x0:x1:2] > 127
        R = imread(P(s, 'coderefl', f'{r["k"]:04d}.png'), 0)[:, x0:x1:2].astype(np.float32) / 255
        R = np.minimum(R * 4, 1)          # coderefl is the difference x4: saturate at 16 levels
        if R[y1:].sum() < 50:
            continue
        best = (-1e9, None)
        for ym in range(max(y0 + (y1 - y0) // 2, y1 - 30), min(H - 4, y1 + (y1 - y0) // 2), 2):
            n = min(H - ym, ym - y0)          # rows of reflection that are in frame and have a source
            if n < 12:
                break
            Ff = F[ym - n:ym][::-1]
            Rr = R[ym:ym + n]
            sc = float((Ff * Rr).sum() - 0.6 * ((~Ff) * Rr).sum() - 0.25 * (Ff * (1 - Rr)).sum())
            if sc > best[0]:
                best = (sc, ym)
        if best[1] is not None:
            ML[k] = best[1]
    for a, b in s['segments']:
        okm = np.isfinite(ML[a:b])
        ML[a:b] = robust_smooth(np.nan_to_num(ML[a:b]), okm, 3.0, 7, degree=3) if okm.sum() >= 2 else np.nan
    air = [float(ML[k] - code[min(N - 1, max(0, k + lag))]['box'][3]) if np.isfinite(ML[k]) else None for k in range(N)]
    reg = {'S': Sx.tolist(), 'TX': TX.tolist(), 'TY': TY.tolist(), 'mirror': [None if not np.isfinite(v) else float(v) for v in ML], 'air': air, 'raw': raw}
    with open(P(s, 'reg.json'), 'w') as f:
        json.dump(reg, f)
    log('register: mirror line found in', int(np.isfinite(ML).sum()), 'of', N, 'frames')

# ------------------------------------------------------------------------------------------------ comp
def hud_mask(plate):
    """The HUD is drawn over the finished frame, so it must stay over her too: its glyphs, found in the plate itself (top-left strip; anything that stands out of the
    local sky colour there). Returns a float mask (H, W)."""
    y0, y1, x0, x1 = int(28 * H / 1080), int(102 * H / 1080), int(36 * W / 1920), int(1150 * W / 1920)
    c = plate[y0:y1, x0:x1]
    bg = cv2.medianBlur(c, 31)
    d = np.abs(c.astype(np.int16) - bg.astype(np.int16)).max(axis=2).astype(np.float32)
    m = cv2.dilate(np.clip((d - 8) / 18, 0, 1), np.ones((3, 3), np.uint8))
    full = np.zeros((H, W), np.float32)
    full[y0:y1, x0:x1] = cv2.GaussianBlur(m, (0, 0), 0.7)
    return full


def road_key(plate, key):
    """ground decals that hide the mirror (the road, her ring, type lying on the ground): keyed by the lane colour in the plate. 1 = road."""
    hsv = cv2.cvtColor(plate, cv2.COLOR_RGB2HSV)
    h, sa, v = hsv[..., 0].astype(np.int16), hsv[..., 1], hsv[..., 2]
    m = ((h >= key['h'][0]) & (h <= key['h'][1]) & (sa >= key['s']) & (v >= key['v'])).astype(np.float32)
    return cv2.GaussianBlur(m, (0, 0), 1.2)


def flip_about(img, ym):
    return cv2.warpAffine(img, np.float32([[1, 0, 0], [0, -1, 2 * ym]]), (W, H), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def ripple(img, ym, t, amp):
    """the mirror's swell, approximated: a slow displacement of a pixel or two that grows a little with distance from the contact line"""
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    d = np.clip((yy - ym) / 120.0, 0, 1.5)
    dx = amp * (0.4 + d) * (np.sin(0.055 * (yy - ym) + 1.1 * t + 1.0) + 0.6 * np.sin(0.021 * (yy - ym) - 0.7 * t + 0.008 * xx))
    dy = amp * (0.4 + d) * (np.sin(0.041 * (yy - ym) + 0.9 * t + 2.2) + 0.5 * np.sin(0.012 * xx + 0.6 * t))
    return cv2.remap(img, xx + dx, yy + dy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=0)


def fit_reflection(s, reg):
    """How the code mirror shows a body, measured on the code renders: ref = a * norefl + b * (flipped figure colour) under the flipped code figure (per channel,
    non-negative least squares over sampled frames). The same law is then applied to her flipped layer."""
    with open(P(s, 'code.json')) as f:
        code = json.load(f)
    key = s['refl'].get('road_key', {'h': [3, 24], 's': 110, 'v': 110})
    Xs, Ys = [], []
    gens = [read_video(P(s, n + '.mp4'), W, H) for n in ('ref', 'plate', 'norefl')]
    for k, (ref, plate, norefl) in enumerate(zip(*gens)):
        if k >= s['frames']:
            break
        ym = reg['mirror'][k]
        if k % 4 or ym is None or not code[k]['box']:
            continue
        m = imread(P(s, 'codefig', f'{k:04d}.png'), 0).astype(np.float32) / 255
        col = norefl.astype(np.float32) * m[..., None]
        cf = cv2.GaussianBlur(flip_about(m, ym), (0, 0), 2.2)
        colf = cv2.GaussianBlur(flip_about(col, ym), (0, 0), 2.2)
        sel = (cf > 0.97) & (m < 0.02) & (road_key(plate, key) < 0.02)
        sel[:int(ym) + 4] = False
        if sel.sum() < 200:
            continue
        idx = np.where(sel.ravel())[0]
        idx = idx[::max(1, len(idx) // 4000)]
        Xs.append(np.concatenate([norefl.reshape(-1, 3)[idx].astype(np.float32), colf.reshape(-1, 3)[idx], np.full((len(idx), 1), k, np.float32)], axis=1))
        Ys.append(ref.reshape(-1, 3)[idx].astype(np.float32))
    N = s['frames']
    if not Xs:
        log('reflection fit: no usable samples; using defaults')
        return {'a': [[0.9] * 3] * N, 'b': [[0.08] * 3] * N, 'n': 0}
    X, Y = np.concatenate(Xs), np.concatenate(Ys)
    from scipy.optimize import nnls

    def fit1(sel):
        # no free offset (a pale, even mirror makes it trade against a): the mirror keeps `a` of what was there and adds `b` of the body's colour
        a_, b_, r_ = [], [], []
        for c in range(3):
            A = np.stack([X[sel, c], X[sel, 3 + c]], axis=1).astype(np.float64)
            co, _ = nnls(A, Y[sel, c].astype(np.float64))
            co[0] = min(co[0], 1.0)
            a_.append(co[0])
            b_.append(co[1])
            r_.append(np.sqrt(np.mean((A @ co - Y[sel, c]) ** 2)))
        return a_, b_, r_

    # the light changes inside a shot (sunrise): the law is fitted in windows of a second and interpolated
    win = s['refl'].get('fit_window', 24)
    centres, AA, BB, RR = [], [], [], []
    for c0 in range(0, N, win // 2):
        sel = (X[:, 6] >= c0 - win / 2) & (X[:, 6] < c0 + win / 2)
        if sel.sum() < 500:
            continue
        a_, b_, r_ = fit1(sel)
        centres.append(c0)
        AA.append(a_)
        BB.append(b_)
        RR.append(r_)
    if not centres:
        a_, b_, r_ = fit1(np.ones(len(X), bool))
        centres, AA, BB, RR = [0], [a_], [b_], [r_]
    AA, BB = np.array(AA), np.array(BB)
    ks = np.arange(N)
    fit = {'a': np.stack([np.interp(ks, centres, AA[:, c]) for c in range(3)], axis=1).tolist(), 'b': np.stack([np.interp(ks, centres, BB[:, c]) for c in range(3)], axis=1).tolist(),
           'n': int(len(X)), 'rms': float(np.mean(RR)), 'mean_change': [float(np.mean(Y[:, c] - X[:, c])) for c in range(3)]}
    log(f'reflection fit: {len(centres)} windows, {len(X)} samples, rms {fit["rms"]:.1f} levels; a {np.round(AA.mean(axis=0), 3).tolist()} b {np.round(BB.mean(axis=0), 3).tolist()}; '
        f'mean change under the code figure\'s mirror image {np.round(fit["mean_change"], 1).tolist()} levels')
    return fit


def her_layer(s, k, reg, grade):
    """her premultiplied RGB (float 0..1) and alpha at film resolution for model frame k"""
    from pymatting import estimate_foreground_ml
    al = imread(P(s, 'alpha', f'{k:04d}.png'), 0).astype(np.float32) / 255
    ys, xs = np.where(al > 0.004)
    if not len(xs):
        return np.zeros((H, W, 3), np.float32), np.zeros((H, W), np.float32)
    x0, x1, y0, y1 = max(0, xs.min() - 12), min(MW * UP, xs.max() + 13), max(0, ys.min() - 12), min(MH * UP, ys.max() + 13)
    rgb = imread(P(s, 'up', f'{k:04d}.png'), cv2.IMREAD_COLOR)[y0:y1, x0:x1, ::-1].astype(np.float64) / 255
    a = al[y0:y1, x0:x1]
    # the colour of HER in the edge pixels (the model's sky taken out of them), so no halo of the model's background comes along
    F = estimate_foreground_ml(rgb, a.astype(np.float64)).astype(np.float32)
    g = np.array(grade.get('gain', [1, 1, 1]), np.float32)
    F = np.clip(F * g, 0, 1)
    if grade.get('sat', 1) != 1:
        l = F.mean(axis=2, keepdims=True)
        F = np.clip(l + (F - l) * grade['sat'], 0, 1)
    pm = np.dstack([F * a[..., None], a])
    S, TX, TY = reg['S'][k], reg['TX'][k], reg['TY'][k]
    if S < 1:
        pm = cv2.GaussianBlur(pm, (0, 0), 0.45 * np.sqrt(1 / (S * S) - 1) + 1e-3)
    M = np.float32([[S, 0, TX + S * x0], [0, S, TY + S * y0]])
    o = cv2.warpAffine(pm, M, (W, H), flags=cv2.INTER_LANCZOS4, borderMode=cv2.BORDER_CONSTANT, borderValue=0)
    A = np.clip(o[..., 3], 0, 1)
    return np.clip(o[..., :3], 0, A[..., None]), A


def stage_comp(s):
    with open(P(s, 'reg.json')) as f:
        reg = json.load(f)
    R = dict({'gain': 1.0, 'blur': 2.2, 'ripple': 1.3, 'on': True}, **s['refl'])
    G = dict({'wrap': 0.18, 'wrap_px': 5.0}, **s['grade'])
    key = R.get('road_key', {'h': [3, 24], 's': 110, 'v': 110})
    fit = fit_reflection(s, reg) if R['on'] else None
    if fit:
        with open(P(s, 'reflfit.json'), 'w') as f:
            json.dump(fit, f)
        FA, FB = np.array(fit['a'], np.float32), np.array(fit['b'], np.float32)
    t0 = time.time()
    hud_hits = 0
    edge_warn = 0
    stat = []
    for k, plate in enumerate(read_video(P(s, 'plate.mp4'), W, H)):
        if k >= s['frames']:
            break
        if k in s['patch'] and os.path.exists(P(s, 'platefix', f'{k:04d}.png')):
            plate = np.ascontiguousarray(imread(P(s, 'platefix', f'{k:04d}.png'), cv2.IMREAD_COLOR)[..., ::-1])
        pm, A = her_layer(s, k, reg, G)
        out = plate.astype(np.float32) / 255
        t = s['times'][k]
        # ---- her mirror image
        ym = reg['mirror'][k]
        if fit and ym is not None and ym < H - 2:
            rf = flip_about(np.dstack([pm, A]), ym)
            rf = cv2.GaussianBlur(rf, (0, 0), sigmaX=0.6 * R['blur'], sigmaY=R['blur'])
            if R['ripple'] > 0:
                rf = ripple(rf, ym, t, R['ripple'])
            ramp = np.clip((np.arange(H, dtype=np.float32) - ym) / 3.0, 0, 1)[:, None]          # nothing of the mirror image above the contact line
            c = rf[..., 3] * ramp * (1 - road_key(plate, key)) * R['gain']
            cp = rf[..., :3] * (ramp * (1 - road_key(plate, key)) * R['gain'])[..., None]
            dref = c[..., None] * (FA[k] - 1) * out + FB[k] * cp
            out = out + dref
            stat.append([float(dref[..., i].sum() / max(1.0, c.sum())) * 255 for i in range(3)])
        out = np.clip(out, 0, 1)
        # ---- light wrap: the world's light creeps a little over her edge
        if G['wrap'] > 0:
            band = A * (1 - cv2.GaussianBlur(A, (0, 0), G['wrap_px'])) * G['wrap']
            env = cv2.GaussianBlur(out, (0, 0), 24)
            pm = pm + band[..., None] * (env * A[..., None] - pm)
        # ---- her, over
        out = out * (1 - A[..., None]) + pm
        # ---- the HUD stays on top
        hm = hud_mask(plate)
        hit = float((hm * A).sum())
        if hit > 1:
            hud_hits += 1
            out = out * (1 - hm[..., None]) + (plate.astype(np.float32) / 255) * hm[..., None]
        # her layer ends where the model's frame ends: warn if that edge lies inside the film frame
        S, TX, TY = reg['S'][k], reg['TX'][k], reg['TY'][k]
        ex = [TX, TY, S * MW * UP + TX, S * MH * UP + TY]
        if (ex[0] > 0.5 and A[:, int(ex[0]) + 1].max() > 0.5) or (ex[1] > 0.5 and A[int(ex[1]) + 1].max() > 0.5) or (ex[2] < W - 1.5 and A[:, int(ex[2]) - 2].max() > 0.5) or (ex[3] < H - 1.5 and A[int(ex[3]) - 2].max() > 0.5):
            edge_warn += 1
        cv2.imwrite(P(s, 'out', f'{k:04d}.png'), (np.clip(out, 0, 1)[..., ::-1] * 255 + 0.5).astype(np.uint8), [cv2.IMWRITE_PNG_COMPRESSION, 1])
        cv2.imwrite(P(s, 'layer', f'{k:04d}.png'), (A * 255 + 0.5).astype(np.uint8))
    if stat:
        log('comp: mean change under HER mirror image', np.round(np.mean(stat, axis=0), 1).tolist(), 'levels (compare with the code figure\'s in the fit line)')
    log(f'comp: {s["frames"]} frames in {time.time() - t0:.1f} s; HUD guard used on {hud_hits} frames; her layer cut by the model frame edge inside the film frame on {edge_warn} frames')


# ------------------------------------------------------------------------------------------------ encode
FONT = os.path.join(ROOT, 'engine', 'fonts', 'JetBrainsMono[wght].ttf')
VF = 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p'
TAGS = ['-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv']


def encode(cmd_in, vf, out, s, limit=15e6, crf=18, fc=False):
    dur = s['frames'] / s['fps']
    while True:
        cmd = ['ffmpeg', '-v', 'error', '-y'] + cmd_in + ['-ss', f'{s["times"][0]:.6f}', '-t', f'{dur:.6f}', '-i', os.path.join(ROOT, s['audio'])]
        cmd += (['-filter_complex', vf, '-map', '[v]'] if fc else ['-vf', vf, '-map', '0:v']) + ['-map', f'{cmd_in.count("-i")}:a']
        cmd += ['-c:v', 'libx264', '-preset', 'slow', '-crf', str(crf), *TAGS, '-c:a', 'aac', '-b:a', '256k', '-t', f'{dur:.6f}', '-movflags', '+faststart', out]
        subprocess.run(cmd, check=True)
        sz = os.path.getsize(out)
        if sz <= limit or crf >= 30:
            log(f'encode: {os.path.relpath(out, ROOT)} crf {crf}, {sz / 1e6:.2f} MB')
            return
        crf += 1


def stage_encode(s):
    rev = os.path.join(ROOT, s['review'])
    fps = str(s['fps'])
    hyb = os.path.join(rev, f'hybrid_{s["name"]}.mp4')
    encode(['-framerate', fps, '-i', P(s, 'out', '%04d.png')], VF, hyb, s)
    font = FONT.replace('\\', '/').replace(':', '\\:').replace('[', '\\[').replace(']', '\\]')
    dt = lambda txt, x: f"drawtext=fontfile='{font}':text='{txt}':x={x}:y=h-34:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=6"
    vf = (f"[0:v]scale=960:540:flags=lanczos,{dt('code render (procedural figure)', 14)}[l];[1:v]scale=960:540:flags=lanczos,{dt('hybrid\\: her redrawn by the video model, over the code-drawn world', 14)}[r];"
          f"[l][r]hstack,{VF}[v]")
    encode(['-i', P(s, 'ref.mp4'), '-framerate', fps, '-i', P(s, 'out', '%04d.png')], vf, os.path.join(rev, f'hybrid_{s["name"]}_compare.mp4'), s, fc=True)


# ------------------------------------------------------------------------------------------------ qa
def stage_qa(s):
    """strips for judging: the composite at 4 fps; code | hybrid pairs cropped on her; her feet and mirror image at full resolution"""
    qa = os.path.join(WORK, 'qa')
    os.makedirs(qa, exist_ok=True)
    with open(P(s, 'code.json')) as f:
        code = json.load(f)
    N = s['frames']
    step = max(1, round(s['fps'] / s.get('qa_fps', 4)))
    ks = list(range(0, N, step))
    tiles = []
    for k in ks:
        im = cv2.resize(imread(P(s, 'out', f'{k:04d}.png'), cv2.IMREAD_COLOR), (384, 216), interpolation=cv2.INTER_AREA)
        cv2.putText(im, str(k), (6, 20), 0, 0.6, (0, 0, 255), 2)
        tiles.append(im)
    cols = 5
    while len(tiles) % cols:
        tiles.append(np.zeros_like(tiles[0]))
    cv2.imwrite(os.path.join(qa, f'{s["name"]}_strip.jpg'), np.vstack([np.hstack(tiles[i:i + cols]) for i in range(0, len(tiles), cols)]), [cv2.IMWRITE_JPEG_QUALITY, 88])
    # pairs and feet: need the code reference frames
    want = set(ks)
    pairs, feet = [], []
    for k, ref in enumerate(read_video(P(s, 'ref.mp4'), W, H)):
        if k >= N:
            break
        if k not in want or not code[k]['box']:
            continue
        out = imread(P(s, 'out', f'{k:04d}.png'), cv2.IMREAD_COLOR)
        ref = np.ascontiguousarray(ref[..., ::-1])
        x0, y0, x1, y1 = code[k]['box']
        cx, cy, hh = (x0 + x1) // 2, (y0 + y1) // 2, max(y1 - y0, x1 - x0) // 2 + 60
        xa, xb, ya, yb = max(0, cx - hh), min(W, cx + hh), max(0, cy - hh), min(H, cy + hh + 40)
        pr = np.hstack([ref[ya:yb, xa:xb], out[ya:yb, xa:xb]])
        pr = np.ascontiguousarray(cv2.resize(pr, (380, int(pr.shape[0] * 380 / pr.shape[1])), interpolation=cv2.INTER_AREA))
        cv2.putText(pr, str(k), (6, 20), 0, 0.6, (0, 0, 255), 2)
        pairs.append(pr)
        fa, fb = max(0, y1 - 150), min(H, y1 + 150)
        fx0, fx1 = max(0, cx - 260), min(W, cx + 260)
        ft = np.ascontiguousarray(np.hstack([ref[fa:fb, fx0:fx1], out[fa:fb, fx0:fx1]]))
        cv2.putText(ft, str(k), (6, 20), 0, 0.6, (0, 0, 255), 2)
        feet.append(ft)

    def sheet(tl, cols, name, wmax=1900):
        if not tl:
            return
        hmax, wm = max(t.shape[0] for t in tl), max(t.shape[1] for t in tl)
        tl = [np.pad(t, ((0, hmax - t.shape[0]), (0, wm - t.shape[1]), (0, 0))) for t in tl]
        while len(tl) % cols:
            tl.append(np.zeros_like(tl[0]))
        o = np.vstack([np.hstack(tl[i:i + cols]) for i in range(0, len(tl), cols)])
        if o.shape[1] > wmax:
            o = cv2.resize(o, (wmax, int(o.shape[0] * wmax / o.shape[1])), interpolation=cv2.INTER_AREA)
        cv2.imwrite(os.path.join(qa, name), o, [cv2.IMWRITE_JPEG_QUALITY, 88])

    sheet(pairs, 5, f'{s["name"]}_pairs.jpg')
    sheet(feet[::2], 2, f'{s["name"]}_feet.jpg')
    log('qa: strips in', os.path.relpath(qa, ROOT))


STAGES = {'frames': stage_frames, 'code': stage_code, 'a0': stage_a0, 'up': stage_up, 'a1': stage_a1, 'alpha': stage_alpha, 'register': stage_register, 'patch': stage_patch, 'comp': stage_comp, 'encode': stage_encode, 'qa': stage_qa}
ORDER = ['frames', 'patch', 'code', 'a0', 'up', 'a1', 'alpha', 'register', 'comp', 'encode', 'qa']

if __name__ == '__main__':
    ap = argparse.ArgumentParser()
    ap.add_argument('shot')
    ap.add_argument('stages')
    a = ap.parse_args()
    shot = load_shot(a.shot)
    for st in (ORDER if a.stages == 'all' else a.stages.split(',')):
        t0 = time.time()
        shot = load_shot(a.shot)          # (segments.json may have been written by `frames`)
        STAGES[st](shot)
        log(f'[{shot["name"]}] {st} done in {time.time() - t0:.1f} s')
