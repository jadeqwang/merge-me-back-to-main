#!/usr/bin/env python3
"""film v8 (Jade on v7, 3:01.65: "drawing misaligned from book slightly"): re-track the notebook spread of page_reveal per frame.

The two black pages are near-black regions (L < 30) closed off from the dark sky by the book's light edge and split by the spine.
Per frame: threshold, open 5x5, connected components; the left and right page are the components that overlap the previous frame's
(dilated) pages most (frame 1: the components under two points picked on the frame: SEED). Each page -> convex hull (the hand
and pencil cut holes and notches; the hull fills them; the film keeps hands in front with its own dark test). The left page hull is
fitted with a 4-gon (approxPolyDP), corners labelled TL, TR (spine top), BR (spine bottom), BL from frame 1 and by continuity, then
smoothed over 5 frames (median) -- the film maps the crowd with these (pageMap: the left page extended across the spine). The clip is the
union of both page hulls (smoothed the same way): the drawing never leaves the paper.

    .venv/bin/python fable/take2/tools/page_track_v8.py PLATE_DIR [OUT_JSON] [--sheet out.jpg]
writes {fps, units:'frac', quad:[[clip s, [TL,TR,BR,BL], area], ...], clip:[[clip s, [[x,y]...] (spread polygon)], ...]}
"""
import sys, json, itertools, cv2, numpy as np

SEED = [(0.30, 0.55), (0.62, 0.30)]   # frame 1 of page_reveal: a point on the left page, one on the right page (plate fractions)

def main():
    a = [x for x in sys.argv[1:] if not x.startswith('--')]
    pdir = a[0]; out = a[1] if len(a) > 1 else pdir + '/page_track_v8.json'
    sheet = sys.argv[sys.argv.index('--sheet') + 1] if '--sheet' in sys.argv else None
    meta = json.load(open(pdir + '/meta.json')); fps = meta.get('fps', 24); n = meta['n']
    prev = None; quads = []; clips = []; dbg = []; spreads = []
    for k in range(1, n + 1):
        im = cv2.imread(f'{pdir}/frames/f_{k:04d}.jpg'); h, w = im.shape[:2]
        L = cv2.cvtColor(im, cv2.COLOR_BGR2GRAY); m = cv2.morphologyEx((L < 30).astype(np.uint8), cv2.MORPH_OPEN, np.ones((7, 7), np.uint8))
        nl, lab, st, cen = cv2.connectedComponentsWithStats(m)
        if prev is None:   # frame 1: the components under the SEED points
            pages = [int(lab[int(SEED[j][1] * h), int(SEED[j][0] * w)]) for j in (0, 1)]
        else:
            pages = []
            for pm in prev:   # the page = every component lying mostly (> 60 %) inside the previous page, dilated (the hand may cut it in pieces;
                              # a component that runs out into her trousers or the sky lies mostly outside and is left out)
                # and whose centroid lies inside the previous page's hull (sky pieces along the book's edge do not)
                hp = np.zeros_like(pm); cv2.fillConvexPoly(hp, cv2.convexHull(cv2.findNonZero(pm)), 1)
                d = cv2.dilate(pm, np.ones((21, 21), np.uint8)); ov = np.bincount(lab[d > 0].ravel(), minlength=nl)
                sel = [i for i in range(1, nl) if st[i, 4] >= 150 and ov[i] > 0.6 * st[i, 4] and hp[min(h - 1, int(cen[i][1])), min(w - 1, int(cen[i][0]))]]
                pages.append(np.isin(lab, sel).astype(np.uint8) if sel else None)
        masks = []
        for i, pm0 in zip(pages, prev or [None, None]):
            if i is None: masks.append(pm0); continue
            masks.append(i if isinstance(i, np.ndarray) else (lab == i).astype(np.uint8))
        prev = masks
        hulls = [cv2.convexHull(cv2.findNonZero(mm)) for mm in masks]
        # left page 4-gon
        hl = hulls[0]; per = cv2.arcLength(hl, True); q = None
        for eps in np.linspace(0.005, 0.1, 40):
            ap = cv2.approxPolyDP(hl, eps * per, True)
            if len(ap) == 4: q = ap.reshape(4, 2).astype(float); break
        if q is None: q = cv2.boxPoints(cv2.minAreaRect(hl)).astype(float)
        un = cv2.convexHull(np.vstack([hulls[0], hulls[1]])); per = cv2.arcLength(un, True); sq = None
        for eps in np.linspace(0.005, 0.1, 40):
            ap = cv2.approxPolyDP(un, eps * per, True)
            if len(ap) == 4: sq = ap.reshape(4, 2).astype(float); break
        if sq is None: sq = cv2.boxPoints(cv2.minAreaRect(un)).astype(float)
        spreads.append(sq)
        quads.append(q); clips.append((hulls[0].reshape(-1, 2), hulls[1].reshape(-1, 2), w, h)); dbg.append((im, q, hulls))
    # label corners: frame 1 by geometry (TL = top-left-most of the two away from the right page...), then continuity
    rc = clips[0][1].mean(0); q0 = quads[0]; ds = np.linalg.norm(q0 - rc, axis=1); sp = np.argsort(ds)[:2]; out_ = [i for i in range(4) if i not in sp]
    TR, BR = sorted(sp, key=lambda i: q0[i][1]); TL, BL = sorted(out_, key=lambda i: q0[i][1])
    lab4 = [q0[[TL, TR, BR, BL]]]
    for q in quads[1:]:
        p = lab4[-1]; best = min(itertools.permutations(range(4)), key=lambda o: sum(np.linalg.norm(q[o[j]] - p[j]) for j in range(4)))
        lab4.append(q[list(best)])
    Q = np.array(lab4)   # n x 4 x 2, px
    # the spread's 4-gon (both pages): frame 1 labelled by the image corners (TL nearest the top-left, ...), then by continuity
    s0 = spreads[0]; o0 = [int(np.argmin(s0[:, 0] + s0[:, 1])), int(np.argmin(-s0[:, 0] + s0[:, 1])), int(np.argmax(s0[:, 0] + s0[:, 1])), int(np.argmax(-s0[:, 0] + s0[:, 1]))]
    labS = [s0[o0]]
    for q in spreads[1:]:
        p = labS[-1]; best = min(itertools.permutations(range(4)), key=lambda o: sum(np.linalg.norm(q[o[j]] - p[j]) for j in range(4)))
        labS.append(q[list(best)])
    SP = np.array(labS); SPs = SP.copy()
    for k in range(len(SP)): SPs[k] = np.median(SP[max(0, k - 2):k + 3], axis=0)
    Qs = Q.copy()
    for k in range(len(Q)): Qs[k] = np.median(Q[max(0, k - 2):k + 3], axis=0)
    # spread polygon per frame: union hull of both pages, resampled to 64 points by angle about its centre, smoothed the same way
    def ring(poly, c, nn=64):
        ang = np.arctan2(poly[:, 1] - c[1], poly[:, 0] - c[0]); r = []
        for a in np.linspace(-np.pi, np.pi, nn, endpoint=False):
            # ray-polygon: farthest intersection along angle a
            d = np.array([np.cos(a), np.sin(a)]); best = 0
            for i in range(len(poly)):
                p1, p2 = poly[i] - c, poly[(i + 1) % len(poly)] - c; e = p2 - p1; den = d[0] * (-e[1]) - d[1] * (-e[0])
                if abs(den) < 1e-9: continue
                s = (p1[0] * (-e[1]) - p1[1] * (-e[0])) / den; u = (d[0] * p1[1] - d[1] * p1[0]) / den
                if s > 0 and -1e-6 <= u <= 1 + 1e-6: best = max(best, s)
            r.append(best)
        return np.array(r)
    U = []; C = []
    for l, r_, w, h in clips:
        un = cv2.convexHull(np.vstack([l, r_]).astype(np.float32)).reshape(-1, 2).astype(float); c = un.mean(0); C.append(c); U.append(ring(un, c))
    C = np.array(C); U = np.array(U); Cs = C.copy(); Us = U.copy()
    for k in range(len(U)): Cs[k] = np.median(C[max(0, k - 2):k + 3], axis=0); Us[k] = np.median(U[max(0, k - 2):k + 3], axis=0)
    angs = np.linspace(-np.pi, np.pi, 64, endpoint=False)
    w, h = clips[0][2], clips[0][3]
    J = {'fps': fps, 'units': 'frac', 'by': 'tools/page_track_v8.py', 'quad': [], 'clip': [], 'spread': []}
    for k in range(len(Qs)):
        c = (k) / fps; q = Qs[k]
        area = float(abs(cv2.contourArea(q.astype(np.float32))) / (w * h))
        J['quad'].append([round(c, 4), [[round(x / w, 4), round(y / h, 4)] for x, y in q], round(area, 4)])
        poly = [[round((Cs[k][0] + Us[k][i] * np.cos(a)) / w, 4), round((Cs[k][1] + Us[k][i] * np.sin(a)) / h, 4)] for i, a in enumerate(angs)]
        J['clip'].append([round(c, 4), poly])
        J['spread'].append([round(c, 4), [[round(x / w, 4), round(y / h, 4)] for x, y in SPs[k]]])
    json.dump(J, open(out, 'w')); print('wrote', out, len(Qs), 'frames')
    if sheet:
        tiles = []
        for k in range(0, len(dbg), max(1, len(dbg) // 20))[:20]:
            im = dbg[k][0].copy(); q = SPs[k].astype(np.int32); cv2.polylines(im, [q], True, (0, 255, 0), 2)
            for j, nm in enumerate(['TL', 'TR', 'BR', 'BL']): cv2.putText(im, nm, tuple(q[j]), 0, 0.9, (0, 0, 255), 2)
            poly = np.array([[x * w, y * h] for x, y in J['clip'][k][1]], np.int32); cv2.polylines(im, [poly], True, (255, 0, 255), 2)
            cv2.putText(im, f'c{k / fps:.2f}', (20, 50), 0, 1.5, (255, 255, 255), 3); tiles.append(cv2.resize(im, (480, 270)))
        while len(tiles) % 5: tiles.append(np.zeros_like(tiles[0]))
        cv2.imwrite(sheet, np.vstack([np.hstack(tiles[i:i + 5]) for i in range(0, len(tiles), 5)]))

if __name__ == '__main__': main()
