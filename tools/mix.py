#!/usr/bin/env python3
"""Final audio: the song bit-identical + quiet split chimes in the intro + post-credits (lobby + desk bell) after the song.
  .venv/bin/python tools/mix.py OUT.wav [--timing=v2|v1] [--total=SECONDS]
--timing (or env MIX_TIMING; default v2): v2 = revised song inputs/Merge.wav + analysis_v2 (-> out/mix_v3.wav);
v1 = "Merge Me Back to Main.wav" + analysis/ (reproduces out/mix_v2.wav with --total=297).
Chimes: one per Banach–Tarski split (bars 3..12 of the timing's grid), pitched up a step each generation, -24 dB under the mix.
Lobby from the song end; desk bell at the hotel shot's s0 + 1.25 s (hand taps the bell in pc_hotel_t5). The hotel shot starts at the song end
and its clip at song end + 0.8 s (engine/show/main.js post-credits block) and lasts 12.2 s, so the default total is song end + 12.2."""
import json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
FF = "/home/jade/Documents/1-music-shipped/moongazing/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
out = sys.argv[1]
arg = lambda k, d: next((a.split("=", 1)[1] for a in sys.argv if a.startswith(f"--{k}=")), d)
timing = arg("timing", os.environ.get("MIX_TIMING", "v2"))
CFG = {"v1": dict(an="analysis/timing.json", song="inputs/Merge Me Back to Main.wav", song_end=284.8, total=297.0),
       "v2": dict(an="analysis_v2/timing.json", song="inputs/Merge.wav", song_end=None, total=None)}[timing]
T = json.load(open(os.path.join(ROOT, CFG["an"])))
bar = lambda n: T["bars"][n - 1]["start"]
SONG = os.path.join(ROOT, CFG["song"])
song_end = CFG["song_end"] or round(T["audio"]["duration_s"], 3)          # v2: 282.516 (= the show's SONG_END)
total = float(arg("total", CFG["total"] or round(song_end + 12.2, 3)))
CH = os.path.join(ROOT, "media/sfx/chime_b.mp3"); BELL = os.path.join(ROOT, "media/sfx/bell.mp3"); LOBBY = os.path.join(ROOT, "media/sfx/lobby.mp3")
ins = ["-i", SONG]
fc = ["[0:a]apad=whole_dur=%.3f[song]" % total]
mix = ["[song]"]
k = 1
for g in range(1, 11):
    t = bar(3 + g - 1) - .05
    rate = 48000 * 2 ** (g * 2 / 12)                     # +2 semitones per generation
    ins += ["-i", CH]
    fc.append(f"[{k}:a]aresample=48000,asetrate={rate:.0f},aresample=48000,volume={-24 - g * .6:.1f}dB,adelay={int(t * 1000)}|{int(t * 1000)},apad=whole_dur={total:.3f}[c{g}]")
    mix.append(f"[c{g}]"); k += 1
ins += ["-i", LOBBY]; fc.append(f"[{k}:a]aresample=48000,volume=-14dB,afade=t=in:d=1.2,adelay={int(song_end * 1000)}|{int(song_end * 1000)},apad=whole_dur={total:.3f}[lb]"); mix.append("[lb]"); k += 1
bell_t = 286.85 if timing == "v1" else song_end + .8 + 1.25   # = hotel s0 (song end + 0.8) + 1.25 s; v1: s0 285.6 + 1.25
ins += ["-i", BELL]; fc.append(f"[{k}:a]aresample=48000,volume=-6dB,adelay={int(bell_t * 1000)}|{int(bell_t * 1000)},apad=whole_dur={total:.3f}[bl]"); mix.append("[bl]"); k += 1
fc.append("".join(mix) + f"amix=inputs={len(mix)}:normalize=0:duration=first,atrim=0:{total:.3f}[a]")
subprocess.run([FF, "-v", "error", "-y"] + ins + ["-filter_complex", ";".join(fc), "-map", "[a]", "-ar", "48000", "-c:a", "pcm_s16le", out], check=True)
print(out, timing, f"song_end={song_end} bell={bell_t:.3f} total={total:.3f}")
