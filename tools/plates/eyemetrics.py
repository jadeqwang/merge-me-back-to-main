#!/usr/bin/env python3
"""Eye measurements for likeness work (OS-venv: mediapipe/cv2). Units = iris diameters (D), so photos and renders compare directly.
  $OSPY tools/plates/eyemetrics.py OVERLAY.jpg IMG [IMG ...] [--json=out.json]
Per eye (subject's R / L) and per position along the upper lid (inner 25 % · middle 50 % · outer 75 % of the corner-to-corner span):
  band   = lash line → crease distance / D          (crease = the most prominent faint shadow line above the lid)
  dark   = lid luminance in the band / skin luminance just above the crease   (<1 = lid darker than skin)
Eye shape: open = aperture height / width, tilt = inner→outer corner angle vs the face horizontal (deg, + = outer corner higher),
  peak = where along the width the upper lid is highest (0 = inner corner, 1 = outer).
NOTE (2026-10-24): open/peak/symmetry tracked her preference; iris/eyew size and the wing detector did NOT (her favourite, cand10/gc_a,
"fails" wing and measures the same size as ones she found uncanny) — use them as guardrails, not judges; her eye decides.
OVERLAY tiles an annotated eye crop per image (iris circle, lid line, detected crease points) to check the detection by eye."""
import json, os, sys, cv2, numpy as np, mediapipe as mp
args = [a for a in sys.argv[1:] if not a.startswith("--")]
out_img, imgs = args[0], args[1:]
JS = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--json=")), None)
CHECK = "--check" in sys.argv   # "protagonist" eye-shape profile she prefers (ch1_main_a): round, level tilt, centred lid peak, no wing
PROFILE = {"open": (.41, 9), "tilt": (-99, 9.5), "peak": (.54, .64), "wing": (-1, .15), "iris": (0, 9), "eyew": (0, 9)}
MAXSIZE = next((a.split("=", 1)[1] for a in sys.argv if a.startswith("--size-ref=")), None)   # image whose eye size must not be exceeded (+3 %)   # calibrated on ch1_main_a (3/4 view inflates tilt)
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.2)
fd = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=.2)
EYE = {  # subject's right / left: outer corner, inner corner, upper lid (outer→inner), lower lid, iris centre, iris ring
    "R": dict(o=33, i=133, up=[246, 161, 160, 159, 158, 157, 173], lo=[7, 163, 144, 145, 153, 154, 155], c=468, ring=[469, 470, 471, 472]),
    "L": dict(o=263, i=362, up=[466, 388, 387, 386, 385, 384, 398], lo=[249, 390, 373, 374, 380, 381, 382], c=473, ring=[474, 475, 476, 477])}


def mesh(im):
    h, w = im.shape[:2]; r = fm.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
    if r.multi_face_landmarks: return np.array([[q.x * w, q.y * h] for q in r.multi_face_landmarks[0].landmark])
    d = fd.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
    if not d.detections: return None
    b = d.detections[0].location_data.relative_bounding_box
    cx, cy, sz = (b.xmin + b.width / 2) * w, (b.ymin + b.height / 2) * h, max(b.width * w, b.height * h) * 1.8
    x0, y0 = int(max(0, cx - sz / 2)), int(max(0, cy - sz / 2)); c = im[y0:int(min(h, cy + sz / 2)), x0:int(min(w, cx + sz / 2))]
    k = 768 / max(c.shape[:2]); c2 = cv2.resize(c, None, fx=k, fy=k, interpolation=cv2.INTER_CUBIC)
    r = fm.process(cv2.cvtColor(c2, cv2.COLOR_BGR2RGB))
    if not r.multi_face_landmarks: return None
    return np.array([[x0 + q.x * c2.shape[1] / k, y0 + q.y * c2.shape[0] / k] for q in r.multi_face_landmarks[0].landmark])


def lid_point(L, e, t):
    """point on the upper lid at fraction t from inner (0) to outer (1) corner: interpolate the lid polyline by x-projection."""
    pts = np.vstack([L[e["i"]], L[e["up"][::-1]], L[e["o"]]])      # inner → outer
    seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]; s = t * seg[-1]
    j = min(len(pts) - 2, np.searchsorted(seg, s) - 1); j = max(j, 0); a = (s - seg[j]) / max(seg[j + 1] - seg[j], 1e-6)
    return pts[j] * (1 - a) + pts[j + 1] * a


def measure(im, L):
    g = cv2.GaussianBlur(cv2.cvtColor(im, cv2.COLOR_BGR2GRAY).astype(np.float32), (0, 0), 1.0)
    hx = L[362] - L[133]; hx /= np.linalg.norm(hx); up = np.array([hx[1], -hx[0]])      # face "up" (towards the brows)
    if up[1] > 0: up = -up
    res, marks = {}, []
    for side, e in EYE.items():
        D = 2 * np.mean(np.linalg.norm(L[e["ring"]] - L[e["c"]], axis=1))
        o, i = L[e["o"]], L[e["i"]]; W = np.linalg.norm(o - i)
        upper = L[e["up"]]; lower = L[e["lo"]]
        H = max(np.linalg.norm(upper[k] - lower[k]) for k in range(len(upper)))
        v = (o - i) * (1 if side == "L" else 1); ang = np.degrees(np.arctan2(-(v @ up), abs(v @ hx)))
        ang = -ang                                                     # + = outer corner higher
        ts = np.linspace(0, 1, 41); hts = [lid_point(L, e, t) @ up for t in ts]
        # wing: a dark lash line continuing past the outer corner along the upper lid's direction
        dirv = L[e["o"]] - lid_point(L, e, .85); dirv /= np.linalg.norm(dirv)
        ext = np.array([cv2.getRectSubPix(g, (1, 1), tuple((o + dirv * d).astype(np.float32)))[0, 0] for d in np.arange(.08 * D, .5 * D, .5)])
        skin = np.array([cv2.getRectSubPix(g, (1, 1), tuple((o + dirv * d + up * .35 * D).astype(np.float32)))[0, 0] for d in np.arange(.08 * D, .5 * D, .5)])
        wing = float((ext < .7 * skin).mean())                         # fraction of the 0.08–0.5 D extension that is lash-dark
        r = {"D_px": round(float(D), 1), "open": round(float(H / W), 3), "tilt": round(float(ang), 1), "peak": round(float(ts[int(np.argmax(hts))]), 2), "wing": round(wing, 2)}
        for name, t in (("inner", .25), ("mid", .5), ("outer", .75)):
            p0 = lid_point(L, e, t)
            # lid start = top edge of the lashes: from the darkest point near the mesh lid line (lashes, or iris+lashes over the pupil),
            # walk up until the brightness recovers 60 % of the way to the skin above
            dl = np.arange(-.35 * D, .6 * D, .5)
            pl = np.convolve(np.array([cv2.getRectSubPix(g, (1, 1), tuple((p0 + up * d).astype(np.float32)))[0, 0] for d in dl]), np.ones(3) / 3, mode="same")
            kmin = int(np.argmin(pl[:int(.75 * D / .5)])); skin_ref = np.percentile(pl[kmin:], 75); thr = pl[kmin] + .6 * (skin_ref - pl[kmin])
            kt = next((k for k in range(kmin, len(pl)) if pl[k] >= thr), kmin)
            p0 = p0 + up * dl[kt]
            ds = np.arange(0, 1.4 * D, .5)
            prof = np.array([cv2.getRectSubPix(g, (1, 1), tuple((p0 + up * d).astype(np.float32)))[0, 0] for d in ds])
            prof = np.convolve(prof, np.ones(5) / 5, mode="same")
            lo_i, hi_i = int(.05 * D / .5), int(1.0 * D / .5)          # from just above the lashes; stay below the brow
            best, bi = 0., None
            for k in range(lo_i + 3, min(hi_i, len(prof) - 4)):
                if prof[k] <= prof[k - 1] and prof[k] <= prof[k + 1]:
                    prom = min(prof[max(lo_i, k - 12):k].max(), prof[k + 1:k + 13].max()) - prof[k]
                    sharp = prof[k] < .45 * np.median(prof[lo_i:hi_i])      # a glasses rim: a thin line far darker than the skin
                    if prom > best and not sharp: best, bi = prom, k
            if bi is None: r[name] = None; continue
            band = ds[bi] / D
            lid = prof[lo_i:bi].mean() if bi > lo_i else prof[lo_i]; skin = prof[bi + 2:min(len(prof), bi + 2 + int(.25 * D / .5))].mean()
            r[name] = {"band": round(float(band), 3), "prom": round(float(best), 1), "dark": round(float(lid / max(skin, 1)), 3)}
            marks.append((p0, p0 + up * ds[bi]))
        res[side] = r
        marks.append(("iris", L[e["c"]], D / 2))
    return res, marks


tiles, allres = [], {}
for p in imgs:
    im = cv2.imread(p); L = mesh(im)
    if L is None: print(p, "no face"); continue
    res, marks = measure(im, L); allres[p] = res
    vis = im.copy(); th = max(1, int(im.shape[0] / 700))
    for m in marks:
        if isinstance(m[0], str): cv2.circle(vis, tuple(m[1].astype(int)), int(m[2]), (255, 255, 0), th)
        else: cv2.line(vis, tuple(m[0].astype(int)), tuple(m[1].astype(int)), (0, 255, 0), th); cv2.circle(vis, tuple(m[1].astype(int)), 2 * th, (0, 0, 255), -1)
    for e in EYE.values(): cv2.polylines(vis, [np.vstack([L[e["i"]], L[e["up"][::-1]], L[e["o"]]]).astype(np.int32)], False, (255, 0, 255), th)
    idx = [70, 105, 107, 336, 334, 300, 33, 133, 362, 263, 145, 374]
    x0, y0 = L[idx].min(0); x1, y1 = L[idx].max(0); px, py = (x1 - x0) * .1, (y1 - y0) * .3
    crop = vis[int(max(0, y0 - py)):int(y1 + py), int(max(0, x0 - px)):int(x1 + px)]
    crop = cv2.resize(crop, (1100, int(1100 * crop.shape[0] / crop.shape[1])), interpolation=cv2.INTER_CUBIC)
    cv2.putText(crop, os.path.basename(p), (6, 20), cv2.FONT_HERSHEY_SIMPLEX, .55, (0, 255, 255), 1)
    tiles.append(crop)
    ipd = float(np.linalg.norm(L[468] - L[473]))
    size = {"iris": float(np.mean([res[sd]["D_px"] for sd in ("R", "L")])) / ipd,
            "eyew": float(np.mean([np.linalg.norm(L[EYE[sd]["o"]] - L[EYE[sd]["i"]]) for sd in ("R", "L")])) / ipd}
    for sd in ("R", "L"): res[sd]["iris"], res[sd]["eyew"] = size["iris"], size["eyew"]
    if CHECK:
        mean = {k: float(np.mean([res[sd][k] for sd in res])) for k in PROFILE}
        if MAXSIZE and not hasattr(sys, "_ref"):
            Lr = mesh(cv2.imread(MAXSIZE)); rr, _ = measure(cv2.imread(MAXSIZE), Lr); ip = float(np.linalg.norm(Lr[468] - Lr[473]))
            sys._ref = {"iris": np.mean([rr[sd]["D_px"] for sd in rr]) / ip, "eyew": np.mean([np.linalg.norm(Lr[EYE[sd]["o"]] - Lr[EYE[sd]["i"]]) for sd in rr]) / ip}
            PROFILE["iris"] = (0, sys._ref["iris"] * 1.03); PROFILE["eyew"] = (0, sys._ref["eyew"] * 1.03)
        fails = [k for k, (a, b) in PROFILE.items() if not a <= mean[k] <= b]
        print(("PASS " if not fails else "FAIL ") + " ".join(f"{k} {mean[k]:.2f}" for k in PROFILE) + (f"  ✗ {','.join(fails)}" if fails else "") + f"  {p}")
        res["_shape"] = {"mean": mean, "fails": fails}
        continue
    f = lambda d: "  —  " if d is None else f"{d['band']:.2f}/{d['dark']:.2f}"
    print(f"{os.path.basename(p)[:34]:34s}", "  ".join(f"{s}: band/dark in {f(r['inner'])} mid {f(r['mid'])} out {f(r['outer'])} | open {r['open']:.2f} tilt {r['tilt']:+.1f} peak {r['peak']:.2f}"
                                                  for s, r in res.items()))
if tiles:
    Hm = max(t.shape[0] for t in tiles); cv2.imwrite(out_img, np.vstack([np.vstack([t, np.zeros((Hm - t.shape[0], 1100, 3), np.uint8)]) for t in tiles]))
if JS: json.dump(allres, open(JS, "w"), indent=1)
