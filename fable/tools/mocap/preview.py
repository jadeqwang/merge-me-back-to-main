"""Stick-figure filmstrip PNG for a BVH clip (PIL + numpy only).

    python -I preview.py CLIP.bvh [-o out.png] [--fps 60] [--n 12] [--rows 1]
                         [--view 34|front|side|top] [--start S --end S] [--title TEXT]
    python -I preview.py 135_07 88_05 ...      # CMU ids: looked up in the index (fps corrected)

Each cell is one pose, evenly spaced in time, drawn with a fixed orthographic camera
(default 3/4 view: yaw 35 deg, pitch 12 deg) and centred on the hips' ground position,
so turning, height above the floor and inversion read correctly while travel does not
push the figure out of its cell. Left limbs are warm (orange), right limbs cool (blue),
spine/head dark. The floor line is y = 0. A sample that falls within half a spacing of a
detected jump / inversion / kick apex is moved onto it (label coloured). Under the strip: a top-down map of the hip
path with the pose numbers, and a time bar with detected beats (see metrics.py).
"""
from __future__ import annotations

import argparse
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # needed under python -I
import bvh       # noqa: E402
import metrics   # noqa: E402

SS = 2  # supersampling
BG = (250, 249, 246)
INK = (40, 40, 46)
LEFT = (224, 110, 36)
RIGHT = (38, 110, 200)
FLOOR = (170, 170, 170)
EVENT_COL = {"jump": (30, 150, 70), "inverted": (190, 40, 160), "kick": (210, 50, 40),
             "turn": (120, 90, 200), "low": (120, 100, 60), "arms_up": (0, 150, 170),
             "arms_wide": (0, 150, 170), "lookback": (90, 90, 90)}


def font(size):
    try:
        return ImageFont.load_default(size=size * SS)
    except TypeError:
        return ImageFont.load_default()


def camera(view):
    yaw, pitch = {"34": (35, 12), "front": (0, 0), "side": (90, 0), "top": (0, 90)}[view]
    y, p = np.radians(yaw), np.radians(pitch)
    Ry = np.array([[np.cos(y), 0, -np.sin(y)], [0, 1, 0], [np.sin(y), 0, np.cos(y)]])
    Rx = np.array([[1, 0, 0], [0, np.cos(p), -np.sin(p)], [0, np.sin(p), np.cos(p)]])
    return Rx @ Ry                           # world -> camera; x right, y up, z towards viewer


def side_colour(name):
    if name.startswith(("Left", "LHip", "LThumb")):
        return LEFT
    if name.startswith(("Right", "RHip", "RThumb")):
        return RIGHT
    return INK


def render(clip, out, n=12, rows=None, view="34", start=None, end=None, title="", subtitle="",
           cell_w=150, events=True):
    P = clip.positions()
    F, fps = clip.n_frames, clip.fps
    f0 = 0 if start is None else int(np.clip(start * fps, 0, F - 1))
    f1 = F - 1 if end is None else int(np.clip(end * fps, f0, F - 1))
    if rows is None:
        dur = (f1 - f0) / fps
        rows = 1 if dur <= 10 else 2 if dur <= 24 else 3 if dur <= 60 else 4
    per_row, n = n, n * rows                                # n is poses per row
    idx = np.round(f0 + (np.arange(n) + 0.5) * (f1 - f0) / n).astype(int)
    hip = clip.index(clip.names[int(np.flatnonzero(clip.parents < 0)[0])])
    cam = camera(view)
    bones = clip.bones()
    head = clip.index("Head") if "Head" in clip.names else None
    head_end = clip.index("Head_end") if "Head_end" in clip.names else None

    m = metrics.analyse(clip) if events else {"ok": False}
    floor = m.get("floor", 0.0) if m.get("ok") else 0.0
    # snap the nearest sample onto each detected jump / inversion / kick apex so beats are not skipped
    snapped = {}
    if m.get("ok") and n > 1:
        spacing = (f1 - f0) / n
        for tt, kind, _ in m["events"]:
            f = int(round(tt * fps))
            if kind in ("jump", "inverted", "kick") and f0 <= f <= f1:
                k = int(np.argmin(np.abs(idx - f)))
                if abs(idx[k] - f) <= spacing / 2 and k not in snapped:
                    idx[k] = f
                    snapped[k] = kind

    # vertical extent shared by all cells so heights are comparable
    Pw = P[idx] - np.array([0, floor, 0])
    ymax = max(1.9, float(Pw[..., 1].max()) + 0.1)
    ymin = min(-0.05, float(Pw[..., 1].min()) - 0.05)
    half_w = 0.75                                           # metres shown either side of the hips
    scale = cell_w / (2 * half_w)                           # px per metre
    cell_h = cell_w if view == "top" else int((ymax - ymin) * scale)
    pad, head_h, label_h = 10, 54 if subtitle else 34, 18
    map_h = 150
    W = pad * 2 + per_row * cell_w
    H = head_h + rows * (cell_h + label_h) + map_h + pad
    img = Image.new("RGB", (W * SS, H * SS), BG)
    d = ImageDraw.Draw(img)
    d.text((pad * SS, 6 * SS), title or os.path.basename(clip.path), fill=INK, font=font(15))
    if subtitle:
        d.text((pad * SS, 30 * SS), subtitle, fill=(90, 90, 96), font=font(11))

    for k, f in enumerate(idx):
        r, c = divmod(k, per_row)
        x0 = pad + c * cell_w
        y0 = head_h + r * (cell_h + label_h)
        pts = P[f] - np.array([P[f, hip, 0], floor, P[f, hip, 2]])
        q = pts @ cam.T
        if view == "top":
            sx = (x0 + cell_w / 2 + q[:, 0] * scale) * SS
            sy = (y0 + cell_h / 2 - q[:, 1] * scale) * SS
        else:
            sx = (x0 + cell_w / 2 + q[:, 0] * scale) * SS
            sy = (y0 + (ymax - q[:, 1]) * scale) * SS
            gy = (y0 + ymax * scale) * SS
            d.line([(x0 + 6) * SS, gy, (x0 + cell_w - 6) * SS, gy], fill=FLOOR, width=SS)
        order = sorted(bones, key=lambda b: q[b[0], 2] + q[b[1], 2])    # far first
        for j, p in order:
            d.line([sx[p], sy[p], sx[j], sy[j]], fill=side_colour(clip.names[j]), width=3 * SS)
        if head is not None:
            a = head_end if head_end is not None else head
            cx, cy = (sx[head] + sx[a]) / 2, (sy[head] + sy[a]) / 2
            rad = 0.085 * scale * SS
            d.ellipse([cx - rad, cy - rad, cx + rad, cy + rad], fill=BG, outline=INK, width=2 * SS)
        lab = f"{k + 1}  {f / fps:.2f}s" + (f"  {snapped[k]}" if k in snapped else "")
        d.text(((x0 + 4) * SS, (y0 + cell_h + 2) * SS), lab, fill=EVENT_COL[snapped[k]] if k in snapped else INK, font=font(11))

    # ---- top-down map of the hip path ---------------------------------------
    my0 = head_h + rows * (cell_h + label_h) + 4
    map_w = min(W - 2 * pad, 300)
    path = P[f0:f1 + 1, hip][:, [0, 2]]
    lo, hi = path.min(0), path.max(0)
    span = max(float((hi - lo).max()), 1.0)
    ctr = (lo + hi) / 2
    ms = (map_h - 30) / span
    def mp(xz):
        return ((pad + map_w / 2 + (xz[..., 0] - ctr[0]) * ms) * SS,
                (my0 + 14 + (map_h - 30) / 2 + (xz[..., 1] - ctr[1]) * ms) * SS)   # +z (towards viewer) down
    d.rectangle([pad * SS, my0 * SS, (pad + map_w) * SS, (my0 + map_h - 6) * SS], outline=FLOOR, width=SS)
    d.text(((pad + 4) * SS, (my0 + 2) * SS), f"top view, hip path, box = {span:.1f} m", fill=(90, 90, 96), font=font(10))
    xs, ys = mp(path)
    step = max(1, len(xs) // 600)
    d.line(list(zip(xs[::step], ys[::step])), fill=(120, 120, 130), width=SS)
    for k, f in enumerate(idx):
        x, y = mp(P[f, hip][[0, 2]])
        d.ellipse([x - 3 * SS, y - 3 * SS, x + 3 * SS, y + 3 * SS], fill=INK)
        d.text((x + 4 * SS, y - 6 * SS), str(k + 1), fill=INK, font=font(9))

    # ---- time bar with detected beats ---------------------------------------
    bx0, bx1 = pad + map_w + 20, W - pad - 10
    if bx1 - bx0 > 200:
        t0, t1 = f0 / fps, (f1 + 1) / fps
        tx = lambda tt: (bx0 + (tt - t0) / max(t1 - t0, 1e-6) * (bx1 - bx0)) * SS
        by = my0 + 18
        d.line([bx0 * SS, by * SS, bx1 * SS, by * SS], fill=INK, width=SS)
        nt = 10
        for i in range(nt + 1):
            tt = t0 + (t1 - t0) * i / nt
            d.line([tx(tt), (by - 3) * SS, tx(tt), (by + 3) * SS], fill=INK, width=SS)
            d.text((tx(tt) - 8 * SS, (by - 16) * SS), f"{tt:.1f}", fill=(90, 90, 96), font=font(9))
        if m.get("ok"):
            kinds = [k for k in EVENT_COL if any(e[1] == k for e in m["events"])]
            for row, kind in enumerate(kinds[:7]):
                yy = by + 12 + row * 14
                d.text(((bx0 - 2) * SS, (yy - 5) * SS), kind, fill=EVENT_COL[kind], font=font(9))
                for tt, kd, _ in m["events"]:
                    if kd == kind and t0 <= tt <= t1:
                        d.ellipse([tx(tt) - 3 * SS, (yy - 3) * SS, tx(tt) + 3 * SS, (yy + 3) * SS], fill=EVENT_COL[kind])
            stats = (f"travel {m['travel']} m  turn {m['total_turn_deg']:.0f} deg  glitch frames {m['glitch_frames']}  "
                     f"jitter {m['jitter_mm']} mm")
            d.text((bx0 * SS, (my0 + map_h - 22) * SS), stats, fill=(90, 90, 96), font=font(10))

    img = img.resize((W, H), Image.LANCZOS)
    os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
    img.save(out)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("clips", nargs="+", help="BVH paths or CMU ids like 135_07")
    ap.add_argument("-o", "--out", help="output PNG (single clip) or directory")
    ap.add_argument("--fps", type=float, help="override frame rate")
    ap.add_argument("--scale", type=float, default=bvh.CMU_SCALE, help="BVH units -> metres")
    ap.add_argument("--keep-tpose", action="store_true", help="keep frame 0 (cgspeed T-pose)")
    ap.add_argument("--n", type=int, default=12, help="poses per row")
    ap.add_argument("--rows", type=int, help="rows (default: 1, 2 or 3 by duration)")
    ap.add_argument("--view", default="34", choices=["34", "front", "side", "top"])
    ap.add_argument("--start", type=float)
    ap.add_argument("--end", type=float)
    ap.add_argument("--title")
    ap.add_argument("--index", help="cmu_index.csv (default: work_fable/mocap/cmu_index.csv)")
    a = ap.parse_args()

    index = None
    for c in a.clips:
        path, fps, title, sub = c, a.fps, a.title, ""
        if not os.path.exists(c):
            import catalog
            index = index or catalog.read_index(a.index)
            row = index[c]
            path, fps = row["path"], a.fps or float(row["fps"])
            title = title or f"CMU {c}  {row['description']}"
            sub = f"subject {row['subject']}: {row['subject_title']}   {row['frames']} frames @ {fps:g} fps = {row['duration_s']} s"
        clip = bvh.load(path, scale=a.scale, fps=fps, drop_tpose=not a.keep_tpose)
        name = os.path.splitext(os.path.basename(path))[0]
        if a.start is not None or a.end is not None:
            name += f"_{a.start or 0:g}-{a.end or clip.duration:g}s"
        if a.view != "34":
            name += f"_{a.view}"
        out = a.out or f"{name}.png"
        if os.path.isdir(out) or out.endswith("/"):
            out = os.path.join(out, name + ".png")
        print(render(clip, out, n=a.n, rows=a.rows, view=a.view, start=a.start, end=a.end,
                     title=title or f"{name}", subtitle=sub or f"{clip.n_frames} frames @ {clip.fps:g} fps = {clip.duration:.2f} s"))


if __name__ == "__main__":
    main()
