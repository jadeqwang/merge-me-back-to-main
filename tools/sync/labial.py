"""Syllable-map lag score for a singing take (OS venv: mediapipe).
    $OSPY tools/sync/labial.py TAKE.mp4 S0 [--lo=-.5 --hi=.7]
Mouth gap curve g(f) (inner-lip gap / face height). For each candidate lag L (clip time = song time - S0 + L):
  closure  = mean gap at labial word onsets (m/b/p/w words, +/-1 frame min)      -> should be SMALL
  open     = mean gap over the vowel nucleus of every word (30-70% of the word)   -> should be LARGE
  score    = open - 2*closure (normalized by curve std). Also reports envelope corr from lipsync for reference.
Writes TAKE.labial.json next to work/takes/<base>."""
import json, os, sys, numpy as np, cv2, mediapipe as mp
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
args = [a for a in sys.argv[1:] if not a.startswith("--")]
opt = {a[2:].split("=")[0]: float(a.split("=", 1)[1]) for a in sys.argv[1:] if a.startswith("--") and "=" in a}
clip, s0 = args[0], float(args[1])
cap = cv2.VideoCapture(clip); fps = cap.get(cv2.CAP_PROP_FPS) or 24
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.3)
gap = []
while True:
    ok, f = cap.read()
    if not ok: break
    h, w = f.shape[:2]; r = fm.process(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    if not r.multi_face_landmarks: gap.append(np.nan); continue
    L = r.multi_face_landmarks[0].landmark; P = lambda i: np.array([L[i].x * w, L[i].y * h])
    gap.append(np.linalg.norm(P(13) - P(14)) / (np.linalg.norm(P(10) - P(152)) + 1e-6))
g = np.array(gap); n = len(g); ok = ~np.isnan(g)
if ok.sum() < n * .5: print(json.dumps({"clip": clip, "error": "face not found"})); sys.exit()
g = np.interp(np.arange(n), np.arange(n)[ok], g[ok]); g = (g - g.mean()) / (g.std() + 1e-9)
T = json.load(open(os.path.join(ROOT, "analysis_v2" if os.environ.get("MERGE_TIMING", "v1") == "v2" else "analysis", "timing.json")))
dur = n / fps
words = [w for l in T["lyrics"]["lines"] for w in l["words"] if s0 + .15 < w["start"] < s0 + dur - .25]
lab = [w for w in words if w["w"][0].lower() in "mbpw"]
def at(t): i = int(round(t * fps)); return g[max(0, min(n - 1, i))] if 0 <= i < n else np.nan
res = []
for L in np.arange(opt.get("lo", -.5), opt.get("hi", .7) + 1e-6, 1 / fps):
    cl = [min(at(w["start"] - s0 + L + d / fps) for d in (-1, 0, 1)) for w in lab]
    op = [np.mean([at(w["start"] + (w["end"] - w["start"]) * q - s0 + L) for q in (.3, .5, .7)]) for w in words if w["end"] - w["start"] > .15]
    cl = [c for c in cl if not np.isnan(c)]; op = [o for o in op if not np.isnan(o)]
    if not op: continue
    sc = float(np.mean(op) - (2 * np.mean(cl) if cl else 0))
    res.append((round(float(L), 3), round(sc, 3), round(float(np.mean(cl)) if cl else 0, 3), round(float(np.mean(op)), 3)))
res.sort(key=lambda r: -r[1])
out = {"clip": clip, "s0": s0, "n_words": len(words), "n_labial": len(lab), "best": res[0][0] if res else None, "top": res[:6]}
base = os.path.basename(clip)[:-4]
json.dump(out, open(os.path.join(ROOT, "work/takes", base + ".labial.json"), "w"))
print(json.dumps(out))
