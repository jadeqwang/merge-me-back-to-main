#!/usr/bin/env python3
"""Phone previews for the video-model bake-off (docs/video_model_bakeoff.md), each <= 2 MB, with the full song mix at the intended placement.
  python3 tools/preview_bakeoff.py take TAKE.mp4 OUT.mp4 --s0=154.906 [--label=TEXT]
      the raw take at real speed, frame 0 on song time s0 (its audio window), 960x540.
  python3 tools/preview_bakeoff.py v4 OUT.mp4 [--roll=TAKE.mp4:92.5:3.9,93:4.65] [--kick=TAKE.mp4:97.25:1.67] [--label=TEXT]
      raw-take rough cut of the default (v4 / v5a) drop, bars 89-101 (+1 s of the fold), on the clocks of engine/show/main.js's drop block: dr_set 89, the
      roll keyed into 91-93, dr_duilian_mid 93 (box only: a labelled black card here), dr_jian 95, the kick keyed into 97-98.3, dr_duilian 98.3-101,
      the fold. --roll/--kick: TAKE:keys (bar position:clip time, comma separated; real speed outside the keys, linear between, like keyed())."""
import os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
B89, BAR = 153.167, 240 / 138
B = lambda b: B89 + (b - 89) * BAR
BT = lambda p: B(int(p)) + (p - int(p)) * BAR          # bar position (98.5 = bar 98 beat 3), as main.js BT()
CL, SONG = "review/cloud/takes/", "review/cloud/audio/Merge_320k.mp3"
SC = "fps=24,scale=960:540:force_original_aspect_ratio=decrease,pad=960:540:(ow-iw)/2:(oh-ih)/2,setsar=1"
ENC = ["-c:v", "libx264", "-preset", "slow", "-crf", "30", "-maxrate", "650k", "-bufsize", "1300k", "-pix_fmt", "yuv420p",
       "-c:a", "aac", "-b:a", "96k", "-movflags", "+faststart", "-shortest"]
args = [a for a in sys.argv[1:] if not a.startswith("--")]
opt = lambda k, d=None: next((a.split("=", 1)[1] for a in sys.argv if a.startswith(f"--{k}=")), d)
esc = lambda s: s.replace(":", r"\:").replace("'", "").replace(",", r"\,")


def label(txt, y="h-40"):
    return f"drawtext=text='{esc(txt)}':x=16:y={y}:fontsize=20:fontcolor=white@0.9:box=1:boxcolor=black@0.45:boxborderw=5"


def dur(f):
    return float(subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).decode())


def run(cmd, out):
    subprocess.run(["ffmpeg", "-v", "error", "-y"] + cmd + ENC + [out], check=True)
    print(out, f"{os.path.getsize(out) / 1e6:.2f} MB")


def take(src, out, s0, txt):
    d = dur(src)
    run(["-i", src, "-ss", f"{s0:.3f}", "-t", f"{d:.3f}", "-i", os.path.join(ROOT, SONG), "-filter_complex",
         f"[0:v]{SC},{label(txt)},drawtext=text='%{{pts\\:flt}}':x=w-90:y=12:fontsize=18:fontcolor=yellow:box=1:boxcolor=black@0.5[v]",
         "-map", "[v]", "-map", "1:a"], out)


def keyed_pieces(a, b, keys):   # [(song ta, tb, clip ca, cb)] after main.js keyed(); keys = [(song t, clip t)]
    def clip(t):
        if t <= keys[0][0]: return keys[0][1] + t - keys[0][0]
        if t >= keys[-1][0]: return keys[-1][1] + t - keys[-1][0]
        return next(c0 + (t - k0) * (c1 - c0) / (k1 - k0) for (k0, c0), (k1, c1) in zip(keys, keys[1:]) if k0 <= t <= k1)
    ts = [a] + [k for k, _ in keys if a < k < b] + [b]
    return [(x, y, clip(x), clip(y)) for x, y in zip(ts, ts[1:])]


def v4(out, roll, kick, txt):
    def parse(s):
        f, ks = s.split(":", 1)
        return f, [(BT(float(p.split(":")[0])), float(p.split(":")[1])) for p in ks.split(",")]
    cuts = [(B(89), B(91), CL + "dr_set_t1_46e828e934.mp4", [(B(89), 0.0)], "89 dr_set (v4)")]
    cuts.append((B(91), B(93), *parse(roll), "91 roll") if roll else (B(91), B(93), CL + "dr_set_t1_46e828e934.mp4", [(B(89), 0.0)], "91 dr_set"))
    cuts.append((B(93), B(95), None, None, "93-95 dr_duilian_mid t1 (on the box, not in the cloud pack)"))
    cuts.append((B(95), B(97), CL + "dr_jian_t2_ddfcbf5ebb.mp4", [(B(95), 0.0)], "95 dr_jian"))
    if kick:
        cuts.append((B(97), BT(98.5), *parse(kick), "97 kick vs knee check, punch vs block"))
        cuts.append((BT(98.5), B(101), CL + "dr_duilian_t2_4e9556bd6b.mp4", [(B(96), 0.0)], "98.3 dr_duilian (v4)"))
    else:
        cuts.append((B(97), B(101), CL + "dr_duilian_t2_4e9556bd6b.mp4", [(B(96), 0.0)], "97 dr_duilian (v4)"))
    cuts.append((B(101), B(101) + 1, CL + "ch1_fold_palms_t11_2d7d5c7f74.mp4", [(B(101) - .2, 0.0)], "101 fold"))
    inp, fl, n = [], [], 0
    for i, (a, b, f, keys, lab) in enumerate(cuts):
        if f is None:
            fl.append(f"color=c=black:s=960x540:r=24:d={b - a:.3f},{label(lab, '(h-th)/2')}[v{i}]"); continue
        inp += ["-i", os.path.join(ROOT, f)]; j = n; n += 1
        ps = keyed_pieces(a, b, keys)
        fl.append(f"[{j}:v]split={len(ps)}" + "".join(f"[s{i}_{k}]" for k in range(len(ps))))
        for k, (ta, tb, ca, cb) in enumerate(ps):
            fl.append(f"[s{i}_{k}]trim=start={ca:.3f}:end={cb:.3f},setpts=(PTS-STARTPTS)*{(tb - ta) / (cb - ca):.5f},fps=24,trim=duration={tb - ta:.3f}[p{i}_{k}]")
        fl.append("".join(f"[p{i}_{k}]" for k in range(len(ps))) + f"concat=n={len(ps)}:v=1:a=0,{SC},{label(lab, '12')}[v{i}]")
    t0, t1 = cuts[0][0], cuts[-1][1]
    fl.append("".join(f"[v{i}]" for i in range(len(cuts))) + f"concat=n={len(cuts)}:v=1:a=0,{label(txt)}[v]")
    run(inp + ["-ss", f"{t0:.3f}", "-t", f"{t1 - t0:.3f}", "-i", os.path.join(ROOT, SONG), "-filter_complex", ";".join(fl),
               "-map", "[v]", "-map", f"{n}:a"], out)


if __name__ == "__main__":
    if args[0] == "take":
        take(args[1], args[2], float(opt("s0")), opt("label", os.path.basename(args[1])[:-4]))
    elif args[0] == "v4":
        v4(args[1], opt("roll"), opt("kick"), opt("label", "v4 drop"))
    else:
        print(__doc__)
