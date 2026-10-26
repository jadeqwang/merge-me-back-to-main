"""Lip lag + expression check for one sung take, from the raw take and the v2 vocal stem (cloud or box; mediapipe 0.10.21 venv).

    $GEN_PY tools/sync/cloudsync.py TAKE.mp4 S0 --shot=T0,T1 --lines=7 [--lag=L] [--out=DIR]

S0 = song time of the take's audio-reference start (spec notes s0). Convention: clip time = song time - S0 + lag (lag > 0: the mouth runs late).
Per frame (FaceMesh, small-face crop fallback as in lipsync.py): mouth openness (inner-lip gap 13-14 / face height 10-152), mouth width (61-291 /
face height), smile (mouth-corner lift above the lip centre / face height), eye openness (lid gaps 159-145, 386-374 / face height), teeth (share of
bright pixels inside the inner-lip polygon). Vocal envelope = RMS dB of analysis_v2/stems/vocals.wav, normalised, at the take's frame rate.
Lag = best z-scored cross-correlation of openness vs envelope over the shot's range (T0..T1, song time) for lags -1.0..+1.5 s. Also scored:
`onset_hit` = share of sung word onsets (song) whose mouth opens within 0.15 s at that lag; a take whose best corr is low AND whose onset hits
stay low at every lag does not follow the words (a re-take, not a lag).
Writes DIR/<take>.cs.json, DIR/<take>_ws.jpg (mouth crops at each word's vowel, rows = lags), DIR/<take>_sheet.jpg (frames every 0.5 s of the
used range + the last 1.5 s), DIR/<take>_curve.png."""
import json, os, subprocess, sys
import numpy as np, cv2, mediapipe as mp
from PIL import Image, ImageDraw
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
args = [a for a in sys.argv[1:] if not a.startswith("--")]
opt = {a[2:].split("=")[0]: a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--") and "=" in a}
clip, S0 = args[0], float(args[1])
T0, T1 = [float(x) for x in opt["shot"].split(",")]
LINES = [int(x) for x in opt.get("lines", "").split(",") if x]
OUT = opt.get("out", os.path.dirname(clip)); os.makedirs(OUT, exist_ok=True)
take = os.path.basename(clip)[:-4]
TM = json.load(open(os.path.join(ROOT, "analysis_v2/timing.json")))
WORDS = [w for l in TM["lyrics"]["lines"] if l["id"] in LINES for w in l["words"]]

cap = cv2.VideoCapture(clip); fps = cap.get(cv2.CAP_PROP_FPS) or 24; frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    frames.append(f)
n = len(frames)
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.3)
fm2 = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.3)
fd = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=.3); last_box = None
INNER = [78, 191, 80, 81, 82, 13, 312, 311, 310, 415, 308, 324, 318, 402, 317, 14, 87, 178, 88, 95]
feat, boxes = [], []
for f in frames:
    h, w = f.shape[:2]
    r = fm.process(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)); X0, Y0, SX, SY = 0, 0, w, h
    if not r.multi_face_landmarks:
        d = fd.process(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
        if d.detections:
            bb = max(d.detections, key=lambda q: q.score[0]).location_data.relative_bounding_box
            box = np.array([(bb.xmin + bb.width / 2) * w, (bb.ymin + bb.height / 2) * h, max(bb.width * w, bb.height * h) * 2.4])
            last_box = box if last_box is None else .6 * last_box + .4 * box
        if last_box is not None:
            cx, cy, sz = last_box; X0, Y0 = int(max(0, cx - sz / 2)), int(max(0, cy - sz / 2))
            c = f[Y0:int(min(h, cy + sz / 2)), X0:int(min(w, cx + sz / 2))]
            if c.size:
                SX, SY = c.shape[1], c.shape[0]
                r = fm2.process(cv2.cvtColor(cv2.resize(c, (480, int(480 * SY / SX))), cv2.COLOR_BGR2RGB))
    if not r.multi_face_landmarks:
        feat.append([np.nan] * 6); boxes.append(None); continue
    L = r.multi_face_landmarks[0].landmark; P = lambda i: np.array([X0 + L[i].x * SX, Y0 + L[i].y * SY])
    H = np.linalg.norm(P(10) - P(152))
    gap = np.linalg.norm(P(13) - P(14)) / H
    wid = np.linalg.norm(P(61) - P(291)) / H
    # face "up" axis (10 is the forehead): smile = how far the corners sit above the midpoint of the lips, along that axis
    up = (P(10) - P(152)) / H; mid = (P(13) + P(14)) / 2
    smile = float(np.dot(((P(61) + P(291)) / 2 - mid) / H, up))
    eyes = (np.linalg.norm(P(159) - P(145)) + np.linalg.norm(P(386) - P(374))) / 2 / H
    poly = np.array([P(i) for i in INNER], np.int32); m = np.zeros(f.shape[:2], np.uint8); cv2.fillPoly(m, [poly], 255)
    g = cv2.cvtColor(f, cv2.COLOR_BGR2HSV); inside = m > 0
    teeth = float(((g[..., 2] > 170) & (g[..., 1] < 70) & inside).sum() / max(1, inside.sum())) if inside.sum() > 20 else 0.0
    feat.append([gap, wid, smile, eyes, teeth, H])
    c = (P(13) + P(14)) / 2; s = H * .32
    boxes.append((c, s))
F = np.array(feat, float); ok = ~np.isnan(F[:, 0]); idx = np.arange(n)
def fill(x): return np.interp(idx, idx[ok], x[ok]) if ok.sum() > 5 else x
gap, wid, smile, eyes, teeth, fh = [fill(F[:, k]) for k in range(6)]

VOC = os.path.join(ROOT, "analysis_v2/stems/vocals.wav")
raw = subprocess.run(["ffmpeg", "-v", "error", "-ss", f"{max(0, S0 - 2):.3f}", "-t", f"{n / fps + 6:.3f}", "-i", VOC, "-ac", "1", "-ar", "16000",
                      "-f", "f32le", "-"], capture_output=True).stdout
y = np.frombuffer(raw, np.float32); a0 = max(0, S0 - 2); hop = 16000 / fps
env = np.array([np.sqrt(np.mean(y[int(i * hop):int((i + 1) * hop)] ** 2) + 1e-12) for i in range(int(len(y) / hop))])
env = 20 * np.log10(env + 1e-6); env = np.clip((env - np.percentile(env, 20)) / (np.percentile(env, 98) - np.percentile(env, 20) + 1e-6), 0, 1)
envt = a0 + np.arange(len(env)) / fps                      # song time of each env sample
E = lambda t: np.interp(t, envt, env)
z = lambda x: (x - x.mean()) / (x.std() + 1e-9)
# expected openness: the vocal envelope with the lips shut (gaussian dips, sd 45 ms) at each word that starts on a labial (m b p w f v)
LAB = [w["start"] for w in WORDS if w["w"].lower()[:1] in "mbpwfv"]
def X(t):
    e = E(t)
    for tl in LAB: e = e * (1 - .95 * np.exp(-.5 * ((t - tl) / .045) ** 2))
    return e
sm = lambda x: np.convolve(x, np.ones(3) / 3, mode="same")
gs = sm(gap)
# window: the shot's song range, as far as the take covers it at a given lag
def score(lag):
    t = np.arange(n) / fps + S0 - lag                       # song time shown by each clip frame at this lag
    sel = (t >= T0) & (t <= T1) & ok
    if sel.sum() < 12: return None
    corr = float(np.mean(z(E(t[sel])) * z(gs[sel])))
    # onset corr: mouth opening speed vs the vocal's rising edges (syllable onsets), each smoothed over 3 frames; less fooled by held notes
    ocorr = float(np.mean(z(sm(np.maximum(0, np.gradient(E(t))))[sel]) * z(sm(np.maximum(0, np.gradient(gs)))[sel])))
    # onset hits: words starting inside the window; mouth open (> 40% of the take's openness range) within 0.15 s after the onset
    lo, hi = np.nanpercentile(gs, 10), np.nanpercentile(gs, 95); thr = lo + .4 * (hi - lo)
    hits = []
    for wd in WORDS:
        if not (T0 <= wd["start"] <= T1): continue
        c0, c1 = wd["start"] - S0 + lag, wd["start"] - S0 + lag + .15
        i0, i1 = int(round(c0 * fps)), int(round(c1 * fps)) + 1
        if i0 < 0 or i1 > n: continue
        hits.append(float(np.max(gs[i0:i1]) > thr))
    lcorr = float(np.mean(z(X(t[sel])) * z(gs[sel])))
    # labial closure: at each labial onset, is the mouth near its closed level (< 20% of the open range) within +-1 frame?
    lab = []
    for tl in LAB:
        if not (T0 <= tl <= T1): continue
        i = int(round((tl - S0 + lag) * fps))
        if 1 <= i < n - 1: lab.append(float(np.min(gs[i - 1:i + 2]) < lo + .2 * (hi - lo)))
    return corr, (float(np.mean(hits)) if hits else None), int(sel.sum()), ocorr, lcorr, (float(np.mean(lab)) if lab else None)
lags = np.round(np.arange(-0.8, 1.4001, 1 / fps), 4)
res = [(float(L),) + s for L in lags if (s := score(L))]
res.sort(key=lambda r: -r[1])
best = res[0]
obest = max(res, key=lambda r: r[4])
lbest = max(res, key=lambda r: r[5])
lag = float(opt["lag"]) if "lag" in opt else best[0]
chosen = next((r for r in res if abs(r[0] - lag) < 1e-3), score(lag) and (lag,) + score(lag))
# mouth state per word at the chosen lag (vowel = onset + 0.08 s; labials m/b/p/w checked at onset - 0.02)
def at(t): i = int(round((t - S0 + lag) * fps)); return i if 0 <= i < n else None
wrep = []
for wd in WORDS:
    if not (T0 - .2 <= wd["start"] <= T1): continue
    i, j = at(wd["start"] + .08), at(wd["start"] - .02)
    wrep.append({"w": wd["w"], "t": round(wd["start"], 2), "open": None if i is None else round(float(gs[i]), 3),
                 "width": None if i is None else round(float(wid[i]), 3), "open_at_onset": None if j is None else round(float(gs[j]), 3)})
# after the last sung word ends inside the shot: does the mouth keep moving (extra mouthing)?
lastw = [w for w in WORDS if w["start"] <= T1]
tail = {}
if lastw:
    e = min(lastw[-1]["end"], T1); i0 = at(e) or 0
    seg = gs[i0:]
    if len(seg) > 6: tail = {"after_last_word_s": round((n - i0) / fps, 2), "open_mean": round(float(seg.mean()), 3), "open_sd": round(float(seg.std()), 3),
                             "open_moves": int(np.sum(np.abs(np.diff(np.sign(np.diff(sm(seg))))) > 0) // 2)}
# expression over the used range and the end of the take
t_song = np.arange(n) / fps + S0 - lag; used = (t_song >= T0) & (t_song <= T1)
def stat(x, sel): return [round(float(np.nanmin(x[sel])), 3), round(float(np.nanmedian(x[sel])), 3), round(float(np.nanmax(x[sel])), 3)] if sel.any() else None
endsel = idx >= n - int(1.0 * fps); usedend = used & (t_song >= T1 - 1.0)
rep = {"take": take, "S0_audio": S0, "shot": [T0, T1], "fps": fps, "frames": n, "len_s": round((n - 1) / fps, 3), "face_found": int(ok.sum()),
       "best": {"lag": best[0], "corr": round(best[1], 3), "onset_hit": best[2], "ocorr": round(best[4], 3)},
       "best_labial_corr": {"lag": lbest[0], "lcorr": round(lbest[5], 3), "labial_closed": lbest[6], "corr": round(lbest[1], 3)},
       "best_onset_corr": {"lag": obest[0], "ocorr": round(obest[4], 3), "corr": round(obest[1], 3)},
       "chosen": {"lag": lag, "corr": round(chosen[1], 3) if chosen else None, "onset_hit": chosen[2] if chosen else None,
                  "ocorr": round(chosen[4], 3) if chosen else None, "lcorr": round(chosen[5], 3) if chosen else None,
                  "labial_closed": chosen[6] if chosen else None},
       "top": [(r[0], round(r[1], 3), r[2]) for r in res[:6]],
       "curve": [(r[0], round(r[1], 3), round(r[4], 3), round(r[5], 3), r[6]) for r in sorted(res)],
       "best_onset_hit_any_lag": max((r[2] or 0) for r in res),
       "covers": [round(S0 - lag, 3), round(S0 - lag + (n - 1) / fps, 3)],
       "smile_used_min_med_max": stat(smile, used), "smile_used_last1s": stat(smile, usedend), "smile_take_last1s": stat(smile, endsel),
       "smile_f0": round(float(smile[0]), 3), "teeth_used_max": stat(teeth, used)[2] if used.any() else None,
       "teeth_used_last1s_max": stat(teeth, usedend)[2] if usedend.any() else None,
       "eyes_f0": round(float(eyes[0]), 3), "eyes_used_min_med_max": stat(eyes, used), "eyes_used_last1s": stat(eyes, usedend),
       "words": wrep, "tail": tail,
       "series": {k: [round(float(v), 4) for v in x] for k, x in (("open", gs), ("smile", smile), ("eyes", eyes), ("teeth", teeth), ("width", wid))}}
json.dump(rep, open(os.path.join(OUT, take + ".cs.json"), "w"), indent=1)

# word strip: rows = lags (chosen, best, chosen +- 0.25 s, 0), cols = word vowels
rows = sorted({round(lag, 3), round(best[0], 3), round(lag - .25, 3), round(lag + .25, 3), 0.0}) if "rows" not in opt else [float(x) for x in opt["rows"].split(",")]
def crop(i):
    f = frames[i]; im = Image.fromarray(cv2.cvtColor(f, cv2.COLOR_BGR2RGB)); b = boxes[i]
    if b is None: return im.resize((120, 84))
    c, s = b; return im.crop((int(c[0] - s), int(c[1] - s * .7), int(c[0] + s), int(c[1] + s * .7))).resize((120, 84))
ev = []
for wd in WORDS:
    if T0 - .2 <= wd["start"] <= T1:
        ev.append((wd["w"], wd["start"] + .08))
        if wd["end"] - wd["start"] > 1.2 and "labials" not in opt: ev += [(wd["w"] + "~", wd["start"] + .6), (wd["w"] + "~~", min(wd["end"], T1) - .3)]
if "labials" in opt:
    ev = sorted([(w["w"] + "|", w["start"] - .01) for w in WORDS if w["w"].lower()[:1] in "mbpwfv" and T0 - .2 <= w["start"] <= T1] +
                [(w["w"], w["start"] + .15) for w in WORDS if T0 - .2 <= w["start"] <= T1], key=lambda e: e[1])
ev.append(("end+.3", min(lastw[-1]["end"], T1) + .3 if lastw else T1))
TW, TH = 120, 84 + 14
S = Image.new("RGB", (80 + TW * len(ev), TH * len(rows)), "black"); d = ImageDraw.Draw(S)
for r, L in enumerate(rows):
    d.text((4, r * TH + 40), f"lag {L:+.2f}" + (" *" if abs(L - lag) < 1e-3 else ""), fill=(255, 255, 0))
    for c, (lab, t) in enumerate(ev):
        i = int(round((t - S0 + L) * fps)); x, yy = 80 + c * TW, r * TH
        if 0 <= i < n: S.paste(crop(i), (x, yy + 14))
        d.text((x + 3, yy + 1), f"{lab} {t:.1f}", fill=(255, 255, 255))
S.save(os.path.join(OUT, take + "_ws.jpg"), quality=88)
# contact sheet: used range every 0.5 s, then the last 1.5 s of the take every 0.25 s
ts = list(np.arange(max(0, T0 - S0 + lag), min(n / fps, T1 - S0 + lag), .5)) + list(np.arange(max(0, (n - 1) / fps - 1.5), (n - 1) / fps + .01, .25))
cw, ch = 320, 180; cols = 6; rr = (len(ts) + cols - 1) // cols
C = Image.new("RGB", (cw * cols, ch * rr), "black"); d = ImageDraw.Draw(C)
for k, c in enumerate(ts):
    i = min(n - 1, int(round(c * fps))); im = Image.fromarray(cv2.cvtColor(frames[i], cv2.COLOR_BGR2RGB)).resize((cw, ch))
    C.paste(im, ((k % cols) * cw, (k // cols) * ch))
    d.text(((k % cols) * cw + 4, (k // cols) * ch + 2), f"c{c:.2f} s{c + S0 - lag:.2f}", fill=(255, 255, 0))
C.save(os.path.join(OUT, take + "_sheet.jpg"), quality=85)
try:
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    fig, ax = plt.subplots(2, 1, figsize=(13, 5.5), sharex=True)
    ax[0].plot(envt, env, color="#e0572a", label="vocal env"); ax[0].plot(t_song, (gs - gs.min()) / (np.ptp(gs) + 1e-9), color="#2a64e0", label=f"mouth @ lag {lag:+.3f}")
    for wd in WORDS: ax[0].axvline(wd["start"], color="#888", lw=.5); ax[0].text(wd["start"], 1.02, wd["w"], fontsize=7)
    ax[0].axvspan(T0, T1, alpha=.08); ax[0].legend(fontsize=7); ax[0].set_xlim(min(T0, t_song[0]) - .3, max(T1, t_song[-1]) + .3)
    ax[1].plot(t_song, smile, label="smile"); ax[1].plot(t_song, eyes, label="eyes"); ax[1].plot(t_song, teeth, label="teeth"); ax[1].plot(t_song, wid - wid[0], label="width-w0")
    ax[1].axvspan(T0, T1, alpha=.08); ax[1].legend(fontsize=7)
    fig.tight_layout(); fig.savefig(os.path.join(OUT, take + "_curve.png"), dpi=75)
except ImportError: pass
print(json.dumps({k: rep[k] for k in ("take", "best", "best_labial_corr", "chosen", "covers")}))
