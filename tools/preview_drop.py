#!/usr/bin/env python3
"""Phone preview of the v5 drop with one candidate take in its slot: a raw-take rough cut (no glyph look, no FX) of bars 89-101, each take on
the clip clock the EDL gives it (engine/show/main.js drop block, planned keys = at(shot, 1)), muxed with the song, the drop range +-1 s, 720p.
  python3 tools/preview_drop.py TAKE.mp4 OUT.mp4 [--slot=91] [--label=TEXT]
TAKE goes into the cut at bar --slot (91 = the duilian close, 91.1 -> 93.1; its audio window starts one bar before the slot). The other cuts use
the picked / current takes in review/takes and review/cloud/takes."""
import os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B89, BAR = 153.167, 240 / 138
B = lambda b: B89 + (b - 89) * BAR
T, CL = "review/takes/", "review/cloud/takes/"
args = [a for a in sys.argv[1:] if not a.startswith("--")]
opt = lambda k, d: next((a.split("=", 1)[1] for a in sys.argv if a.startswith(f"--{k}=")), d)
take, out = args; slot = float(opt("slot", "91")); label = opt("label", os.path.basename(take)[:-4])
# [song t0, song t1, file, s0 = song time of the clip's frame 0]
CUTS = [(B(89) - 1, B(91), T + "dr_dl_wide_t58_67a5ce5078.mp4", B(88)),
        (B(91), B(93), T + "dr_dl_close_t57_2996c73578.mp4", B(90)),
        (B(93), B(95), T + "dr_gs_ranks_t51_5d7acf5f0c.mp4", B(92)),
        (B(95), B(96), CL + "dr_jian_t2_ddfcbf5ebb.mp4", B(95)),
        (B(96), B(98.5), T + "dr_gs_tornado_t52_8514f8db08.mp4", B(95)),
        (B(98.5), B(100), T + "dr_gs_ring_t51_65f5dcb14f.mp4", B(97.5)),
        (B(100), B(101), T + "dr_gs_salute_t52_1653ce46e1.mp4", B(99)),
        (B(101), B(101) + 1, CL + "ch1_fold_palms_t11_2d7d5c7f74.mp4", B(101) - .2)]
CUTS = [(a, b, take, B(slot - 1)) if abs(a - B(slot)) < .01 else (a, b, f, s) for a, b, f, s in CUTS]
inp, fl = [], []
for i, (a, b, f, s0) in enumerate(CUTS):
    inp += ["-i", os.path.join(ROOT, f)]
    fl.append(f"[{i}:v]trim=start={a - s0:.3f}:duration={b - a:.3f},setpts=PTS-STARTPTS,fps=24,scale=1280:720:force_original_aspect_ratio=decrease,"
              f"pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1[v{i}]")
n = len(CUTS); t0, t1 = CUTS[0][0], CUTS[-1][1]
txt = label.replace(":", r"\:").replace("'", "")
fl.append("".join(f"[v{i}]" for i in range(n)) + f"concat=n={n}:v=1:a=0,drawtext=text='{txt}':x=24:y=h-48:fontsize=26:fontcolor=white@0.85:"
          f"box=1:boxcolor=black@0.4:boxborderw=6[v]")
cmd = ["ffmpeg", "-v", "error", "-y"] + inp + ["-ss", f"{t0:.3f}", "-t", f"{t1 - t0:.3f}", "-i", os.path.join(ROOT, "review/cloud/audio/Merge_320k.mp3"),
       "-filter_complex", ";".join(fl), "-map", "[v]", "-map", f"{n}:a", "-c:v", "libx264", "-preset", "slow", "-crf", "27", "-maxrate", "1600k",
       "-bufsize", "3200k", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-movflags", "+faststart", "-shortest", out]
subprocess.run(cmd, check=True)
print(out, f"{os.path.getsize(out) / 1e6:.2f} MB", f"song {t0:.2f}-{t1:.2f}")
