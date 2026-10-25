"""Lip lag + head-scale drift for a singing take (OS-venv: mediapipe 0.10.14, cv2).

    $OSPY tools/cutscenes/lipsync.py CLIP.mp4 S0 [--win=A,B] [--out=PREFIX]

S0 = song time of the clip's audio-reference start. lag: clip time = song time - S0 + lag.
Mouth curve = inner-lip gap (FaceMesh 13/14) / face height (10..152). Vocal curve = RMS of the demucs vocal stem.
Also reports per-frame eye distance (33-263) and face height relative to frame 0 (head shrink / drift check).
"""
import sys, json, subprocess, numpy as np, cv2, mediapipe as mp
FF = "/home/jade/Documents/1-music-shipped/moongazing/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
import os
AN = "analysis_v2" if os.environ.get("MERGE_TIMING", "v1") == "v2" else "analysis"     # song version (set by tools/sd/intake.py)
VOC = f"/home/jade/Documents/merge-me-back-to-main/{AN}/stems/vocals.wav"
args = [a for a in sys.argv[1:] if not a.startswith("--")]
opt = {a[2:].split("=")[0]: a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith("--") and "=" in a}
clip, s0 = args[0], float(args[1])
cap = cv2.VideoCapture(clip); fps = cap.get(cv2.CAP_PROP_FPS) or 24
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=False, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.3)
gap, eye, fh, cen = [], [], [], []
while True:
    ok, f = cap.read()
    if not ok: break
    h, w = f.shape[:2]
    r = fm.process(cv2.cvtColor(f, cv2.COLOR_BGR2RGB))
    if not r.multi_face_landmarks:
        gap.append(np.nan); eye.append(np.nan); fh.append(np.nan); cen.append((np.nan, np.nan)); continue
    L = r.multi_face_landmarks[0].landmark; P = lambda i: np.array([L[i].x * w, L[i].y * h])
    H = np.linalg.norm(P(10) - P(152))
    gap.append(np.linalg.norm(P(13) - P(14)) / H); eye.append(np.linalg.norm(P(33) - P(263))); fh.append(H)
    cen.append(tuple((P(1) / [w, h]).round(4)))
gap = np.array(gap); n = len(gap); ok = ~np.isnan(gap)
idx = np.arange(n); g = np.interp(idx, idx[ok], gap[ok]) if ok.sum() > 5 else None
raw = subprocess.run([FF, "-v", "error", "-ss", f"{s0:.3f}", "-t", f"{n / fps + 2:.3f}", "-i", VOC, "-ac", "1", "-ar", "16000", "-f", "f32le", "-"], capture_output=True).stdout
y = np.frombuffer(raw, np.float32); hop = 16000 / fps
env = np.array([np.sqrt(np.mean(y[int(i * hop):int((i + 1) * hop)] ** 2) + 1e-12) for i in range(int(len(y) / hop))])
env = 20 * np.log10(env + 1e-6); env = np.clip((env - np.percentile(env, 20)) / (np.percentile(env, 98) - np.percentile(env, 20) + 1e-6), 0, 1)
win = [float(v) for v in opt.get("win", f"{s0},{s0 + n / fps}").split(",")]
a, b = max(0, int((win[0] - s0) * fps)), min(n, int((win[1] - s0) * fps))
z = lambda x: (lambda x: (x - x.mean()) / (x.std() + 1e-9))(np.convolve(x, np.ones(3) / 3, mode="same"))
res = []
if g is not None:
    for L in range(-int(.2 * fps), int(2.4 * fps) + 1):   # clip frame = song frame + L
        lo, hi = max(a, -L), min(b, n - L, len(env))
        if hi - lo < 12: continue
        x, yy = z(env[lo:hi]), z(g[lo + L:hi + L]); res.append((float(np.mean(x * yy)), L / fps))
res.sort(reverse=True)
e0, h0 = np.nanmedian(eye[:3]), np.nanmedian(fh[:3])
rep = {"clip": clip, "s0": s0, "fps": fps, "frames": n, "face_found": int(ok.sum()), "win": win,
       "best_lag_s": round(res[0][1], 3) if res else None, "corr": round(res[0][0], 3) if res else None,
       "top5": [(round(l, 3), round(c, 3)) for c, l in res[:5]],
       "eye_dist_ratio_min_max": [round(float(np.nanmin(eye) / e0), 3), round(float(np.nanmax(eye) / e0), 3)] if ok.any() else None,
       "face_h_ratio_min_max": [round(float(np.nanmin(fh) / h0), 3), round(float(np.nanmax(fh) / h0), 3)] if ok.any() else None,
       "eye_dist_px_f0": round(float(e0), 1) if ok.any() else None}
out = opt.get("out", clip[:-4])
json.dump(rep, open(out + ".sync.json", "w"), indent=1)
try:
    import matplotlib; matplotlib.use("Agg"); import matplotlib.pyplot as plt
    fig, ax = plt.subplots(2, 1, figsize=(12, 5))
    t = np.arange(len(env)) / fps + s0; ax[0].plot(t, env, label="vocal env", color="#e0572a")
    if g is not None:
        L = rep["best_lag_s"]; ax[0].plot(np.arange(n) / fps + s0 - L, (g - np.nanmin(g)) / (np.ptp(g) + 1e-9), label=f"mouth shifted lag {L:+.2f}s", color="#2a64e0")
    ax[0].axvspan(*win, alpha=.1); ax[0].legend(fontsize=8); ax[0].set_title(json.dumps({k: rep[k] for k in ("best_lag_s", "corr", "top5")}), fontsize=8)
    ax[1].plot(np.array(eye) / e0, label="eye dist / f0"); ax[1].plot(np.array(fh) / h0, label="face h / f0"); ax[1].legend(fontsize=8)
    fig.tight_layout(); fig.savefig(out + ".sync.png", dpi=80)
except Exception as e: print("plot", e)
print(json.dumps(rep))
