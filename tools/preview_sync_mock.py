#!/usr/bin/env python3
"""Rough formation MOCK of the ?drop=sync drop (docs/wushu_sync_longfist.md) for Jade's phone: the picked solo takes, each composited six times
in the engine's formations (the FORM / SYNC_CUTS / place() of engine/show/main.js's drop block, mirrored here), lane-tinted like the shader
(mix toward lane * (.35 + luma) at .32), with the per-copy dt ripples and main (orange, untinted) stepping into the V's point, over the song.
The figure matte is mediapipe selfie segmentation (it keeps her reflection), not the box's prep matte, and nothing is glyph-built: a mock of
the layout and timing the engine will draw, labelled as such. Needs mediapipe (CLOUD_GEN.md: /opt/gen312/bin/python).
  /opt/gen312/bin/python tools/preview_sync_mock.py OUT.mp4 --bg=WS_BG.mp4|.png ws_open=TAKE.mp4[:hit] ws_lotus=... (all six) [--to=102]
keys: the take's keyed() pairs as main.js SYNC_KEY, "bar@clip,bar@clip" (e.g. 93@1.12,94@3.46); default the planned hit (real speed)."""
import math, os, subprocess, sys, tempfile
import cv2, numpy as np, mediapipe as mp

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B89, BAR = 153.167, 240 / 138
BEAT = BAR / 4
B = lambda b: B89 + (b - 89) * BAR
BT = lambda p: B(int(p)) + (p - int(p)) * BAR
SONG = os.path.join(ROOT, "review/cloud/audio/Merge_320k.mp3")
W, H = 960, 540
LANES = ["#F4F4F8", "#4FE3B0", "#FF5FA2", "#6FB6FF", "#FFD23F", "#A57BFF"]   # white mint rose | sky gold violet
HZ = -.014
place = lambda x, s: ((x, HZ + .014 * s), s)   # x: screen position of her centre (frame half-width .89)
FORM = {
    "rows": [(x, .88 if i % 2 else .6) for i, x in enumerate((-.72, -.43, -.14, .14, .43, .72))],
    "line": [(x, .78) for x in (-.67, -.4, -.13, .13, .4, .67)],
    "wedge": [(-.66, .6), (-.45, .8), (-.2, 1.05), (.2, 1.05), (.45, .8), (.66, .6)],
    "ring": [(.58 * math.sin(a), .78 + .22 * math.cos(a)) for a in [(k - 2.5) * math.pi / 3 + math.pi / 12 for k in range(6)]],
    "v": [(-.68, .6), (-.46, .74), (-.22, .9), (.22, .9), (.46, .74), (.68, .6)],
}
CUTS = [(89, "ws_open", "rows", 89, None), (91, "ws_lotus", "line", 92.5, None), (93, "ws_kicks", "wedge", 93, (93.25, 1 / 8, "lr", 2)),
        (95, "ws_feijiao", "wedge", 96, None), (96.5, "ws_xuanfeng", "ring", 97, (97.25, 1 / 4, "ring", 3)), (99, "ws_close", "v", 100.5, None)]
PLAN = {"ws_open": BAR, "ws_lotus": BAR + 6 * BEAT, "ws_kicks": BAR, "ws_feijiao": 2 * BAR, "ws_xuanfeng": BAR + 2 * BEAT, "ws_close": BAR + 6 * BEAT}
ss = lambda a, b, x: (lambda u: u * u * (3 - 2 * u))(min(1, max(0, (x - a) / (b - a))))
hexrgb = lambda h: np.array([int(h[i:i + 2], 16) for i in (5, 3, 1)], np.float32) / 255   # BGR


def frames(path):
    cap, out = cv2.VideoCapture(path), []
    while True:
        ok, f = cap.read()
        if not ok: break
        out.append(cv2.resize(f, (W, H), interpolation=cv2.INTER_AREA))
    return out


SEG = mp.solutions.selfie_segmentation.SelfieSegmentation(model_selection=0)


def matte(f):   # centre square crop (she stays near the centre of a locked frame), soft edges
    x0 = (W - H) // 2
    m = np.zeros((H, W), np.float32)
    m[:, x0:x0 + H] = SEG.process(cv2.cvtColor(f[:, x0:x0 + H], cv2.COLOR_BGR2RGB)).segmentation_mask
    return cv2.GaussianBlur(np.clip((m - .35) / .3, 0, 1), (5, 5), 0)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    opt = lambda k, d=None: next((a.split("=", 1)[1] for a in sys.argv if a.startswith(f"--{k}=")), d)
    out = args[0]
    takes = {}
    for a in args[1:]:
        shot, v = a.split("=", 1); p, _, ks = v.partition(":")
        takes[shot] = (p, [tuple(map(float, k.split("@"))) for k in ks.split(",")] if ks else None)
    bgp = opt("bg")
    bgf = frames(bgp) if bgp.endswith(".mp4") else [cv2.resize(cv2.imread(bgp), (W, H), interpolation=cv2.INTER_AREA)]
    t_from, t_to = B(89), BT(float(opt("to", "101.5")))
    tmp = tempfile.mkdtemp()
    vw = cv2.VideoWriter(os.path.join(tmp, "v.avi"), cv2.VideoWriter_fourcc(*"MJPG"), 24, (W, H))
    cache = {}
    n = int((min(t_to, B(101)) - t_from) * 24)
    for i in range(n):
        t = t_from + i / 24
        ci = max(k for k, c in enumerate(CUTS) if BT(c[0]) <= t + 1e-6)
        b0, shot, form, hit, rip = CUTS[ci]
        if shot not in cache:
            cache.clear(); fr = frames(takes[shot][0]); cache[shot] = (fr, [matte(f) for f in fr])
        fr, mt = cache[shot]
        K = [(BT(b), c) for b, c in (takes[shot][1] or [(hit, PLAN[shot])])]

        def clip(x):   # keyed() of main.js: real speed outside the keys, linear between
            j = 0
            while j < len(K) - 1 and x > K[j + 1][0]: j += 1
            if j == len(K) - 1 or x < K[0][0]: return K[j][1] + x - K[j][0]
            return K[j][1] + (x - K[j][0]) * (K[j + 1][1] - K[j][1]) / (K[j + 1][0] - K[j][0])
        bg = bgf[min(len(bgf) - 1, int((t - t_from + .5) / (B(101) - t_from + .5) * (len(bgf) - 1)))].astype(np.float32) / 255
        img = bg.copy()
        order = [2, 1, 0, 5, 4, 3] if rip and rip[2] == "ring" else list(range(6))
        cps = []
        for j, (X, s) in enumerate(FORM[form]):
            dt = -order[j] * rip[1] * BEAT * ss(BT(rip[0]), BT(rip[0]) + rip[3] * BEAT, t) if rip else 0
            off, sc = place(X, s); cps.append((sc, off, clip(t + dt), LANES[j], .32, 1))
        if shot == "ws_close":
            ta, tb = BT(100) - BEAT, BT(100) + .5 * BEAT
            if t >= ta:
                k = min(1, (t - ta) / (tb - ta)); e = 1 - (1 - k) ** 3; a, z = place(0, .8), place(0, 1.08)
                cps.append((1 + (z[1] - 1) * e, (0, a[0][1] + (z[0][1] - a[0][1]) * ss(ta, tb, t)), clip(t), None, 0, .5 + .5 * k * k))
        for sc, (ox, oy), c, lane, amt, dens in sorted(cps, key=lambda q: q[0]):   # far (small) first, near on top
            fi = min(len(fr) - 1, max(0, round(c * 24)))
            f, m = fr[fi].astype(np.float32) / 255, mt[fi]
            if lane:
                lum = f.mean(axis=2, keepdims=True); f = f * (1 - amt) + hexrgb(lane) * (.35 + lum) * amt
            M = np.float32([[sc, 0, W / 2 - sc * W / 2 + ox * H], [0, sc, H / 2 - sc * H / 2 - oy * H]])
            fw = cv2.warpAffine(f, M, (W, H)); mw = cv2.warpAffine(m, M, (W, H))[..., None] * dens
            img = img * (1 - mw) + np.clip(fw, 0, 1) * mw
        o = (np.clip(img, 0, 1) * 255).astype(np.uint8)
        bar = 89 + (t - B89) / BAR
        cv2.rectangle(o, (0, 0), (W, 30), (0, 0, 0), -1)
        cv2.putText(o, f"MOCK of the engine's ?drop=sync (not the glyph render)  bar {int(bar)}.{int((bar % 1) * 4) + 1}  {shot}  {form}",
                    (10, 21), cv2.FONT_HERSHEY_SIMPLEX, .5, (255, 255, 255), 1, cv2.LINE_AA)
        vw.write(o)
    vw.release()
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", os.path.join(tmp, "v.avi"), "-ss", f"{t_from:.3f}", "-i", SONG, "-map", "0:v", "-map", "1:a",
                    "-c:v", "libx264", "-preset", "slow", "-crf", "28", "-maxrate", "1500k", "-bufsize", "3000k", "-pix_fmt", "yuv420p",
                    "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", "-shortest", out], check=True)
    print(out, os.path.getsize(out))


if __name__ == "__main__":
    main()
