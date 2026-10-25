#!/usr/bin/env python3
"""Draw a measured eyelid-crease guide on a face image, for an image model to turn into a real crease (OS-venv: mediapipe/cv2).
  $OSPY tools/plates/creaseguide.py IN OUT [--inner=0.36] [--outer=0.26] [--from=0.12] [--to=0.90]
The guide runs along each upper lid from --from to --to of the inner→outer corner span (never reaching either corner), offset upward from the
lash line by a band that goes from --inner to --outer × iris diameter (her photos: ~0.3 D; renders were ~0.1 D — she asked for 3–5×).
--brows: draw BROW guides instead (target brow outline: lower edge raised by --raise × IPD, thickness --thick × IPD, her photos 0.35–0.41 /
0.10–0.11) — a thin cyan outline the model fills with real brow hair.
A thin dark line, so the model can see it clearly; the edit prompt asks it to render a soft natural crease there and remove the line.
--paint: instead of a guide, PAINT the crease directly (image models kept pulling it back toward the lashes): a soft fold shadow along the
curve (fainter at the inner end), a faint highlight just below it on the lid, and the lid subtly darker toward the outer corner."""
import sys, cv2, numpy as np, mediapipe as mp
pos = [a for a in sys.argv[1:] if not a.startswith("--")]
arg = lambda k, d: float(next((a.split("=")[1] for a in sys.argv if a.startswith(f"--{k}=")), d))
src, dst = pos; INNER, OUTER, A, Bt = arg("inner", .36), arg("outer", .26), arg("from", .12), arg("to", .90)
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.2)
im = cv2.imread(src); h, w = im.shape[:2]
L = np.array([[q.x * w, q.y * h] for q in fm.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB)).multi_face_landmarks[0].landmark])
EYE = {"R": dict(o=33, i=133, up=[246, 161, 160, 159, 158, 157, 173], c=468, ring=[469, 470, 471, 472]),
       "L": dict(o=263, i=362, up=[466, 388, 387, 386, 385, 384, 398], c=473, ring=[474, 475, 476, 477])}
hx = L[362] - L[133]; hx /= np.linalg.norm(hx); up = np.array([hx[1], -hx[0]]); up = -up if up[1] > 0 else up
out = im.copy(); th = max(1, int(h / 900)); PAINT = "--paint" in sys.argv or "--paint2" in sys.argv; P2 = "--paint2" in sys.argv
erase = np.zeros((h, w), np.float32); above = np.zeros((h, w), np.float32)
if "--brows" in sys.argv:
    RAISE, THK = arg("raise", .07), arg("thick", .105)
    ipd = np.linalg.norm(L[468] - L[473])
    for low in ([46, 53, 52, 65, 55], [276, 283, 282, 295, 285]):                 # lower brow edge, outer → inner
        lo = np.array([L[i] for i in low]) + up * RAISE * ipd
        # thickest near the inner/middle, tapering at the tail; a soft arch comes from the lower edge itself
        th_ = np.array([.55, .85, 1., 1., .9]) * THK * ipd
        hi = lo + up * th_[:, None]
        poly = np.vstack([lo, hi[::-1]]).astype(np.int32)
        cv2.polylines(out, [poly], True, (255, 230, 0), th, cv2.LINE_AA)
    cv2.imwrite(dst, out); print(dst); sys.exit()
shade = np.zeros((h, w), np.float32); lift = np.zeros((h, w), np.float32); lid = np.zeros((h, w), np.float32)
for e in EYE.values():
    D = 2 * np.mean(np.linalg.norm(L[e["ring"]] - L[e["c"]], axis=1))
    pts = np.vstack([L[e["i"]], L[e["up"][::-1]], L[e["o"]]])
    seg = np.r_[0, np.cumsum(np.linalg.norm(np.diff(pts, axis=0), axis=1))]
    curve = []
    for t in np.linspace(A, Bt, 40):
        s = t * seg[-1]; j = max(0, min(len(pts) - 2, np.searchsorted(seg, s) - 1)); a = (s - seg[j]) / max(seg[j + 1] - seg[j], 1e-6)
        p = pts[j] * (1 - a) + pts[j + 1] * a
        # band profile (her note): widest from the inner corner through the middle, narrowing toward the OUTER corner; never meets either end.
        # The lid line arches up over the iris, so the offset is applied along the face "up" axis from the lid point (band adds to the arch).
        u = (t - A) / (Bt - A)
        prof = INNER + (OUTER - INNER) * np.clip((u - .30) / .70, 0, 1) ** 1.1       # highest at the inner end, easing down to OUTER
        inner_end = .82 + .18 * np.clip(u / .12, 0, 1)                                  # only a slight lift-off at the very inner end
        # a real crease runs flatter than the lid line, which dives into the inner corner: lift the inner end toward the lid's peak height
        peak_h = max(q @ up for q in pts); lift_f = .65 * (1 - np.clip(u / .5, 0, 1)) + .15
        p = p + up * (peak_h - p @ up) * lift_f
        curve.append(p + up * prof * inner_end * D)
    if not PAINT: cv2.polylines(out, [np.array(curve, np.int32)], False, (255, 230, 0), th, cv2.LINE_AA); continue
    C = np.array(curve, np.float32); n = len(C); wgt = np.linspace(.55, 1., n)          # fainter at the inner end
    for k in range(n - 1):                                                          # fold shadow: thin line, strength by position
        cv2.line(shade, tuple((C[k] * 8).astype(int)), tuple((C[k + 1] * 8).astype(int)), float(wgt[k]), max(1, int((.04 if P2 else .03) * D)) * 8, cv2.LINE_AA, shift=3)
    lo = C - up * .06 * D                                                           # highlight just under the fold (the lid catching light)
    for k in range(n - 1):
        cv2.line(lift, tuple((lo[k] * 8).astype(int)), tuple((lo[k + 1] * 8).astype(int)), 1., max(1, int(.05 * D)) * 8, cv2.LINE_AA, shift=3)
    # --paint2: the band between (lash line + margin) and the new crease, for erasing the old low crease; and a soft zone above the crease
    lashes = np.array([pts[min(len(pts) - 1, max(0, int(round(t * (len(pts) - 1)))))] for t in np.linspace(A, Bt, n)]) + up * .07 * D
    cv2.fillPoly(erase, [np.vstack([lashes, C[::-1]]).astype(np.int32)], 1.)
    cv2.fillPoly(above, [np.vstack([C, (C + up * .22 * D)[::-1]]).astype(np.int32)], 1.)
    band = np.zeros((h, w), np.float32); cv2.fillPoly(band, [cv2.convexHull(np.vstack([C, pts]).astype(np.int32))], 1.)
    xs = np.arange(w, dtype=np.float32)[None, :]; t_out = np.clip(((xs - L[e["i"]][0]) / (L[e["o"]][0] - L[e["i"]][0])), 0, 1)
    lid += band * (.35 + .65 * t_out)                                               # subtly darker toward the outer corner
if P2:
    er = cv2.GaussianBlur(erase, (0, 0), D * .02 + .5)[..., None]
    smooth = cv2.GaussianBlur(out, (0, 0), D * .12 + 1).astype(np.float32)          # removes the old crease line inside the band
    out = (out * (1 - er) + smooth * er).clip(0, 255).astype(np.uint8)            # band: smooth skin (old crease gone)
    ab = cv2.GaussianBlur(above, (0, 0), D * .06 + .5)
    out = (out.astype(np.float32) * (1 - (1 - np.array([.86, .84, .92], np.float32)) * ab[..., None] * .5)).clip(0, 255).astype(np.uint8)
if PAINT:
    sh = cv2.GaussianBlur(shade, (0, 0), D * .02 + .5); li = cv2.GaussianBlur(lift, (0, 0), D * .03 + .5); ld = cv2.GaussianBlur(lid, (0, 0), D * .08 + 1)
    f = out.astype(np.float32)
    WARM = np.array([.70, .66, .80], np.float32)                                    # BGR: a warm skin-shadow multiply, not neutral grey
    f *= 1 - (1 - WARM) * ((.85 if P2 else .55) * sh)[..., None]
    f *= 1 - (1 - WARM) * (.12 * ld)[..., None]                                     # outer lid tone
    f += (255 - f) * ((0 if P2 else .10) * li)[..., None]
    out = np.clip(f, 0, 255).astype(np.uint8)
cv2.imwrite(dst, out); print(dst)
