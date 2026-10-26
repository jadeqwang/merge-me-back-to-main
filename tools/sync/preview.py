#!/usr/bin/env python3
"""Lip-sync preview for Jade's phone: the RAW take placed at its song time with a lag, muxed with the full mix, over the shot's EDL range +- 1 s.
    python3 tools/sync/preview.py TAKE.mp4 S0 LAG T0 T1 OUT.mp4 [--lines=7,8] [--label="..."]
S0 = the take's audio-reference start (spec notes s0); clip time = song time - S0 + lag (engine/show/main.js pk() + tools/sd/picks.py).
Black where the take has no frame. A thin orange bar along the bottom marks the part of the window that is inside the shot (T0..T1); the sung word
is shown under the picture. 1280x720, x264 CRF 27, AAC 128k (~2-4 MB for 10 s). Film time = song time (the film starts with the song)."""
import json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
a = [x for x in sys.argv[1:] if not x.startswith("--")]
opt = {x[2:].split("=")[0]: x.split("=", 1)[1] for x in sys.argv[1:] if x.startswith("--") and "=" in x}
take, S0, LAG, T0, T1, out = a[0], float(a[1]), float(a[2]), float(a[3]), float(a[4]), a[5]
W0, W1 = max(0.0, T0 - 1), T1 + 1; D = W1 - W0
MIX = os.path.join(ROOT, "review/cloud/audio/Merge_320k.mp3")
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
# --ramp=TA,K: the EDL's gentle time map (clip = t - S0 + lag + K * max(0, t - TA), e.g. v1_light_hands t12): the take is retimed to rate 1+K after
# song time TA into a temp file first, so the preview shows exactly what the film plays
if "ramp" in opt:
    import tempfile
    TA, K = [float(x) for x in opt["ramp"].split(",")]; cA = TA - (S0 - LAG); tmp = tempfile.mktemp(suffix=".mp4")
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", take, "-filter_complex",
                    f"[0:v]trim=end={cA:.4f},setpts=PTS-STARTPTS[a];[0:v]trim=start={cA:.4f},setpts=(PTS-STARTPTS)/{1 + K:.4f}[b];[a][b]concat=n=2:v=1[v]",
                    "-map", "[v]", "-r", "24", "-c:v", "libx264", "-crf", "16", tmp], check=True)
    take = tmp
dur = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", take], capture_output=True, text=True).stdout)
start = S0 - LAG                       # song time of the take's frame 0
esc = lambda s: s.replace("\\", "\\\\").replace(":", "\\:").replace("'", "’").replace("%", "\\%").replace(",", "\\,")
TM = json.load(open(os.path.join(ROOT, "analysis_v2/timing.json")))
lines = [int(x) for x in opt.get("lines", "").split(",") if x]
words = [w for l in TM["lyrics"]["lines"] if (not lines or l["id"] in lines) for w in l["words"] if w["end"] > W0 and w["start"] < W1]
fx = []
# take placement: pad the start with black when the take begins after W0, trim it when it begins before
off = start - W0
src = f"[1:v]scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=24"
if off < 0: src = f"[1:v]trim=start={-off:.4f},setpts=PTS-STARTPTS," + src[5:]
fx.append(src + (f",tpad=start_duration={off:.4f}:color=black" if off > 0 else "") + "[tk]")
fx.append("[0:v][tk]overlay=0:0:eof_action=pass:shortest=0[v0]")
v = "v0"
lab = opt.get("label", os.path.basename(take)[:-4])
dt = [f"drawtext=fontfile={FONT}:text='{esc(lab)}':x=16:y=14:fontsize=24:fontcolor=white:box=1:boxcolor=black@0.55:boxborderw=6",
      f"drawtext=fontfile={FONT}:text='lag {LAG:+.3f} s   film %{{pts\\:hms\\:{W0:.3f}}}':x=16:y=50:fontsize=20:fontcolor=yellow:box=1:boxcolor=black@0.55:boxborderw=5",
      f"drawbox=x=0:y=712:w=1280:h=8:color=0xff7a1a@0.95:t=fill:enable='between(t,{T0 - W0:.3f},{T1 - W0:.3f})'"]
for w in words:
    dt.append(f"drawtext=fontfile={FONT}:text='{esc(w['w'])}':x=(w-tw)/2:y=640:fontsize=44:fontcolor=white:box=1:boxcolor=black@0.5:boxborderw=8:"
              f"enable='between(t,{w['start'] - W0:.3f},{min(w['end'], W1) - W0:.3f})'")
fx.append(f"[{v}]" + ",".join(dt) + "[v]")
cmd = ["ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=c=black:s=1280x720:r=24:d={D:.3f}", "-i", take,
       "-ss", f"{W0:.3f}", "-t", f"{D:.3f}", "-i", MIX, "-filter_complex", ";".join(fx), "-map", "[v]", "-map", "2:a",
       "-t", f"{D:.3f}", "-c:v", "libx264", "-preset", "slow", "-crf", opt.get("crf", "27"), "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k",
       "-movflags", "+faststart", out]
os.makedirs(os.path.dirname(os.path.abspath(out)), exist_ok=True)
subprocess.run(cmd, check=True)
print(out, round(os.path.getsize(out) / 1e6, 2), "MB", f"take covers song {start:.2f}-{start + dur:.2f}, window {W0:.2f}-{W1:.2f}")
