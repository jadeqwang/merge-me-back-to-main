"""Stick-figure previews of CANONICAL tracks (work_fable/tracks/<name>.bin/.json).

    preview_track.py NAME [NAME ...] [-n 14] [--mp4] [--song-t0 153.167] [--from 0 --to 8] [--az 30]

PNG: filmstrip (each pose centred on its own hips, world orientation kept, front-3/4 orthographic
view, left limbs blue / right orange, nose tick = facing), events marked, ground line, hip path
from above. MP4 (--mp4): world-space stick figure at 30 fps on a 1 m ground grid; with --song-t0
(the song time of the track's t=0) the frame flashes on every beat (downbeats stronger), so sync
can be judged by eye. Output: work_fable/tracks/previews/.
"""
from __future__ import annotations

import argparse
import json
import math
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, str(Path(__file__).resolve().parent))
import motion as M  # noqa: E402

OUT = M.TRACKS / "previews"
BLUE, ORANGE, INK, PAPER, GREY = (36, 106, 200), (222, 110, 30), (30, 30, 34), (250, 248, 243), (150, 150, 150)
SS = 2  # supersample


def _font(size):
    for p in ("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"):
        if Path(p).exists():
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def view_axes(az_deg, el_deg):
    az, el = math.radians(az_deg), math.radians(el_deg)
    right = np.array([math.cos(az), 0.0, -math.sin(az)])
    fwd = np.array([-math.sin(az) * math.cos(el), -math.sin(el), -math.cos(az) * math.cos(el)])  # camera look dir
    up = np.cross(right, fwd)
    return right, up / np.linalg.norm(up), fwd


BONES = [(c, int(M.PARENT[c])) for c in range(1, M.NJ)]


def _col(name):
    return BLUE if name.endswith("L") else ORANGE if name.endswith("R") else INK


def draw_pose(d, P, R, origin, scale, axes, width=3.0, alpha=1.0):
    """P (21,3) world positions relative to whatever; origin = pixel position of world (0,0,0)."""
    right, up, fwd = axes

    def px(p):
        return (origin[0] + scale * float(p @ right), origin[1] - scale * float(p @ up))
    segs = []
    for c, p in BONES:
        segs.append((float((P[c] + P[p]) @ fwd), P[p], P[c], _col(M.JOINTS[c])))
    for s in "LR":   # hand, foot, toe end segments
        for n in ("hand", "toe"):
            j = M.J[n + s]
            tip = P[j] + R[j] @ np.array([0.0, M.bone_len(n + s), 0.0])
            segs.append((float((P[j] + tip) @ fwd), P[j], tip, _col(n + s)))
    hj = M.J["head"]
    hc = P[hj] + R[hj] @ np.array([0.0, 0.085, 0.01])
    nose = hc + R[hj] @ np.array([0.0, 0.0, 0.13])
    segs.append((float(2 * hc @ fwd) - 0.02, hc, nose, INK))
    for _, a, b, col in sorted(segs, key=lambda s: -s[0]):
        d.line([px(a), px(b)], fill=col, width=int(round(width)))
    r = 0.1 * scale
    c = px(hc)
    d.ellipse([c[0] - r, c[1] - r, c[0] + r, c[1] + r], outline=INK, width=max(1, int(width * 0.7)))


def filmstrip(name, n=14, az=30.0, el=8.0, t_from=None, t_to=None, out=None):
    m = M.load_track(name)
    P = m.meta["_stored_pos"]
    F = m.frames
    dur = (F - 1) / m.fps
    t0 = 0.0 if t_from is None else t_from
    t1 = dur if t_to is None else min(t_to, dur)
    ts = list(np.linspace(t0, t1, n))
    evs = [e for e in m.events if t0 <= e["t"] <= t1]
    labels = {}
    step = (t1 - t0) / max(1, n - 1)
    for e in evs:                      # snap the nearest sample to each accent event
        if e["name"].startswith("foot"):
            continue
        k = int(np.argmin([abs(t - e["t"]) for t in ts]))
        if abs(ts[k] - e["t"]) <= step * 0.6 and k not in labels:
            ts[k] = e["t"]
            labels[k] = e["name"]
    cols = min(n, 8)
    rows = math.ceil(n / cols)
    cw, ch = 250 * SS, 300 * SS
    W, H = cols * cw + 40 * SS, rows * ch + 290 * SS
    img = Image.new("RGB", (W, H), PAPER)
    d = ImageDraw.Draw(img)
    f1, f2, f3 = _font(20 * SS), _font(13 * SS), _font(11 * SS)
    d.text((20 * SS, 12 * SS), name, fill=INK, font=f1)
    d.text((20 * SS, 40 * SS), f"{F} frames @ {m.fps:.0f} fps = {F / m.fps:.2f} s   loop={m.loop}   "
           f"source={m.meta.get('source', '?')}   view az {az:.0f} el {el:.0f}", fill=GREY, font=f2)
    axes = view_axes(az, el)
    scale = 118 * SS
    for k, t in enumerate(ts):
        fr = min(F - 1, int(round(t * m.fps)))
        cx = 20 * SS + (k % cols) * cw + cw // 2
        gy = 70 * SS + (k // cols) * ch + int(ch * 0.82)
        d.line([(cx - cw * 0.46, gy), (cx + cw * 0.46, gy)], fill=(200, 200, 200), width=SS)
        Pp = P[fr] - np.array([P[fr, 0, 0], 0.0, P[fr, 0, 2]])
        draw_pose(d, Pp, m.R[fr], (cx, gy), scale, axes, width=3 * SS)
        lab = labels.get(k)
        d.text((cx - cw * 0.44, gy + 8 * SS), f"{k + 1}  {t:.2f}s" + (f"  {lab}" if lab else ""),
               fill=(200, 40, 40) if lab else INK, font=f2)
    # top view
    y0 = 70 * SS + rows * ch + 10 * SS
    bx, by, bw, bh = 20 * SS, y0, 300 * SS, 200 * SS
    d.rectangle([bx, by, bx + bw, by + bh], outline=GREY)
    xz = P[:, 0][:, [0, 2]]
    lo, hi = xz.min(0), xz.max(0)
    span = max(1.0, float((hi - lo).max()) * 1.15)
    ctr = (lo + hi) / 2

    def tp(p):   # +Z up the page, +X to the right
        return (bx + bw / 2 + (p[0] - ctr[0]) / span * bh * 0.95, by + bh / 2 - (p[1] - ctr[1]) / span * bh * 0.95)
    d.text((bx + 6 * SS, by + 4 * SS), f"top view (+Z up, +X right), box = {span:.1f} m", fill=GREY, font=f3)
    d.line([tp(p) for p in xz[::2]], fill=INK, width=SS)
    for k, t in enumerate(ts):
        fr = min(F - 1, int(round(t * m.fps)))
        p = tp(xz[fr])
        hd = m.R[fr, 0][:, 2]
        d.ellipse([p[0] - 3 * SS, p[1] - 3 * SS, p[0] + 3 * SS, p[1] + 3 * SS], fill=INK)
        d.line([p, (p[0] + hd[0] * 12 * SS, p[1] - hd[2] * 12 * SS)], fill=(200, 40, 40), width=SS)
        d.text((p[0] + 4 * SS, p[1] - 12 * SS), str(k + 1), fill=INK, font=f3)
    # timeline
    tx, tw = bx + bw + 40 * SS, W - (bx + bw + 80 * SS)
    ty = y0 + 20 * SS
    d.line([(tx, ty), (tx + tw, ty)], fill=INK, width=SS)
    for i in range(11):
        tt = t0 + (t1 - t0) * i / 10
        x = tx + tw * i / 10
        d.line([(x, ty - 4 * SS), (x, ty + 4 * SS)], fill=INK, width=SS)
        d.text((x - 10 * SS, ty - 20 * SS), f"{tt:.1f}", fill=GREY, font=f3)
    kinds = sorted({e["name"] for e in evs})
    for r, kn in enumerate(kinds[:10]):
        yy = ty + (18 + 16 * r) * SS
        d.text((tx - 2 * SS, yy - 7 * SS), kn, fill=INK, font=f3)
        for e in evs:
            if e["name"] == kn:
                x = tx + 90 * SS + (tw - 90 * SS) * (e["t"] - t0) / max(1e-6, t1 - t0)
                d.ellipse([x - 3 * SS, yy - 3 * SS, x + 3 * SS, yy + 3 * SS], fill=(200, 40, 40))
    travel = float(np.linalg.norm(np.diff(xz, axis=0), axis=1).sum())
    d.text((tx, y0 + 180 * SS), f"travel {travel:.2f} m   hips y {P[:, 0, 1].min():.2f}..{P[:, 0, 1].max():.2f} m   "
           f"lowest joint {P[..., 1].min():.3f} m", fill=GREY, font=f3)
    img = img.resize((W // SS, H // SS), Image.LANCZOS)
    OUT.mkdir(parents=True, exist_ok=True)
    out = Path(out) if out else OUT / f"{name}.png"
    img.save(out)
    return out


def movie(name, song_t0=None, t_from=None, t_to=None, az=30.0, el=14.0, fps=30, size=(960, 540), follow=False, out=None):
    m = M.load_track(name)
    P = m.meta["_stored_pos"]
    F = m.frames
    dur = F / m.fps if m.loop else (F - 1) / m.fps
    t0 = 0.0 if t_from is None else t_from
    t1 = dur if t_to is None else min(t_to, dur)
    beats, down = [], []
    if song_t0 is not None:
        tj = json.loads((M.ROOT / "analysis_v2" / "timing.json").read_text())
        beats = [(b["t"] - song_t0, b["bar"], b["beat"]) for b in tj["beat_grid"]["beats"]]
    axes = view_axes(az, el)
    right, up, fwd = axes
    fa, fb = int(t0 * m.fps), min(F - 1, int(t1 * m.fps))
    pts = P[fa:fb + 1].reshape(-1, 3)
    u, v = pts @ right, pts @ up
    W, H = size[0] * SS, size[1] * SS
    if follow:
        scale = H / 2.6
    else:
        scale = min(W * 0.9 / max(1e-3, u.max() - u.min() + 0.6), H * 0.8 / max(1e-3, v.max() - v.min() + 0.5))
        scale = min(scale, H / 2.4)
    uc, vc = (u.max() + u.min()) / 2, (v.max() + v.min()) / 2
    OUT.mkdir(parents=True, exist_ok=True)
    out = Path(out) if out else OUT / f"{name}.mp4"
    cmd = ["/usr/bin/ffmpeg", "-y", "-loglevel", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{size[0]}x{size[1]}",
           "-r", str(fps), "-i", "-", "-c:v", "libx264", "-crf", "20", "-pix_fmt", "yuv420p", str(out)]
    ff = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    f2 = _font(14 * SS)
    gx0, gx1 = math.floor(pts[:, 0].min() - 2), math.ceil(pts[:, 0].max() + 2)
    gz0, gz1 = math.floor(pts[:, 2].min() - 2), math.ceil(pts[:, 2].max() + 2)
    nfr = int(round((t1 - t0) * fps))
    for i in range(nfr):
        t = t0 + i / fps
        fr = min(F - 1, int(round(t * m.fps)))
        flash, lab = 0.0, ""
        for bt, bar, beat in beats:
            if 0 <= t - bt < 0.12:
                flash = (1.0 - (t - bt) / 0.12) * (1.0 if beat == 1 else 0.5)
            if bt <= t:
                lab = f"bar {bar}.{beat}"
        bg = tuple(int(c - 60 * flash) for c in PAPER)
        img = Image.new("RGB", (W, H), bg)
        d = ImageDraw.Draw(img)
        cu, cv = (P[fr, 0] @ right, 0.9) if follow else (uc, vc)
        origin = (W / 2 - scale * cu, H / 2 + scale * cv)

        def px(p):
            return (origin[0] + scale * float(p @ right), origin[1] - scale * float(p @ up))
        for gx in range(gx0, gx1 + 1):
            d.line([px(np.array([gx, 0.0, gz0])), px(np.array([gx, 0.0, gz1]))], fill=(215, 213, 208), width=SS)
        for gz in range(gz0, gz1 + 1):
            d.line([px(np.array([gx0, 0.0, gz])), px(np.array([gx1, 0.0, gz]))], fill=(215, 213, 208), width=SS)
        draw_pose(d, P[fr], m.R[fr], origin, scale, axes, width=max(2.0, scale * 0.022))
        names = [e["name"] for e in m.events if 0 <= t - e["t"] < 0.25 and not e["name"].startswith("foot")]
        d.text((16 * SS, 12 * SS), f"{name}  t={t:5.2f}s  {lab}  {' '.join(names)}", fill=INK, font=f2)
        if flash > 0:
            d.rectangle([0, H - 14 * SS, W, H], fill=(200, 40, 40) if flash > 0.5 else (230, 150, 60))
        ff.stdin.write(img.resize(size, Image.BILINEAR).tobytes())
    ff.stdin.close()
    ff.wait()
    return out


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("names", nargs="+")
    ap.add_argument("-n", type=int, default=14)
    ap.add_argument("--az", type=float, default=30.0)
    ap.add_argument("--el", type=float, default=8.0)
    ap.add_argument("--from", dest="t_from", type=float)
    ap.add_argument("--to", dest="t_to", type=float)
    ap.add_argument("--mp4", action="store_true")
    ap.add_argument("--follow", action="store_true")
    ap.add_argument("--song-t0", type=float)
    a = ap.parse_args()
    for nm in a.names:
        print(filmstrip(nm, a.n, a.az, a.el, a.t_from, a.t_to))
        if a.mp4:
            print(movie(nm, a.song_t0, a.t_from, a.t_to, a.az, follow=a.follow))
