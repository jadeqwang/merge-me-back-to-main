#!/usr/bin/env python3
"""Seedance image-to-video specs for the orchestra (bars 81-84, film v2): media/gen/specs/t2_orch_<k>_t<n>.json (git-ignored).
   python3 fable/take2/gen/orch_clips.py orch_2[=still] [...] [--take=1]   then  $PY tools/gen/gen.py submit media/gen/specs/t2_orch_2_t1.json
First frames: work_fable/take2/stills/<still>.jpg|png (specs in orch_stills.json) re-encoded to work_fable/take2/refs/<id>.jpg (2048x1152).
Kept apart from gen_clips.py so the plates agent and this one do not edit the same file."""
import json, os, sys, subprocess
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
M = "a flat cel-shaded anime drawing with a clean inked line, flat colours and coloured-pencil texture, at blue hour"
KEEP = ("Animate the first frame exactly as drawn: same framing, same composition, the same people in the same places, and the same hand-made medium in every frame. "
        f"It is {M} and must stay that throughout, never photographic and never 3D. ")
END = (" Every player is the same young woman with the same face as drawn; faces do not change, nobody smiles or speaks, lips stay closed. "
       "The number of people stays exactly the same: nobody appears, disappears or merges. {L} One continuous shot, no cut. No captions, no subtitles, no added text.")
NOTEXT = "There is no lettering anywhere: no writing on the jackets, sleeves or music stands."
BOW = ("The bow arm moves from the shoulder: the wrist leads each change of bow direction and the elbow follows a moment later, the fingers of the bow hand soft and flexing slightly as the bow turns. "
       "Their left hands stay on the necks of the instruments, the fingers pressing the strings with a small, quick vibrato. ")
C = {  # id: (still, action, lettering)
 "orch_2": ("orch_2_a1", "The violinists play together in perfect unison, a brisk, energetic passage: full smooth bow strokes, down-bow then up-bow, every bow in the section changing direction at the same moment, about two bow changes per second, steady and even. "
            + BOW + "Their heads rest on the violins and their bodies sway very slightly with the music; their eyes stay on the music. The camera is locked off.", NOTEXT),
 "orch_4": ("orch_4_a1", "The timpanist plays a steady, driving rhythm on the kettle drums, alternating hands, about two strokes per second: each stroke falls from a loose, relaxed wrist, the felt mallet head bounces straight back up off the drumhead the instant it touches, the forearm stays easy and the hand follows the rebound. "
            "She stays standing with her back to the viewer the whole time; her long hair sways a little with each stroke. Far beyond the drums the rows of the orchestra play, their bows moving together. The camera is locked off.",
            "The lettering on her jacket (RARE EARTH on the back) stays exactly as drawn in the first frame; there is no other lettering anywhere."),
 "orch_5": ("orch_5_b1", "The conductor on the podium beats time with a clear, crisp pattern, about two beats per second: the tip of the baton drops to a firm point at the bottom of each beat and rebounds upward, her left hand shaping the phrase beside it, her arms moving from the shoulders with the forearms and wrists supple; her feet stay planted and her face is calm and intent. "
            "The women on either side of her hold the wushu stance perfectly still, arms spread; only their hair and sleeves stir. In the foreground the violinists, seen from behind, play together, their bows moving in unison. The camera is locked off.", NOTEXT),
 "orch_6": ("orch_6_a1", "The double bass players draw long, heavy bow strokes together, in unison, about one bow change per second: they lean their whole bodies into each stroke and ease back as the bow turns, the wrist leading the turn and the elbow following, left hands on the necks with a small vibrato. "
            "Behind them the seated cellists bow together in the same rhythm. The camera is locked off.", NOTEXT),
 "orch_3": ("orch_3_b1", "The seated violinists, seen from behind, play together in perfect unison, about two bow changes per second, every bow turning at the same moment, the wrist leading and the elbow following. "
            "The women standing at the front hold their wushu stance perfectly still; only hair and sleeves stir. The camera is locked off.", NOTEXT),
 "orch_1": ("orch_1_a1", "All the seated players play together in unison, their bows moving at the same moment, about two bow changes per second. The women standing near the glowing podium hold their wushu stance, only hair and sleeves stirring. The camera is locked off.", NOTEXT),
 "orch_7": ("orch_7_b1", "Seen from directly above, the whole fan of seated players plays together; the bows move together in unison, a small even shimmer of movement across the rows. Nobody leaves their seat. The camera is locked off, looking straight down,.", NOTEXT),
 "orch_8": ("orch_8_b1", "The whole fan of seated players plays together; the bows move together in unison across all the rows. Nobody leaves their seat. The camera is locked off.", NOTEXT),
}
def ref(src, out):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", "scale=2048:1152:flags=lanczos", "-q:v", "2", out], check=True)
def still(n):
    for e in (".jpg", ".png"):
        p = os.path.join(ROOT, "work_fable/take2/stills", n + e)
        if os.path.exists(p): return p
    raise SystemExit("no still " + n)
if __name__ == "__main__":
    want = [a for a in sys.argv[1:] if not a.startswith("--")]
    take = next((a.split("=")[1] for a in sys.argv if a.startswith("--take=")), "1")
    os.makedirs(os.path.join(ROOT, "media/gen/specs"), exist_ok=True)
    for w in want:
        i, _, alt = w.partition("="); st, action, L = C[i]; st = alt or st
        ref(still(st), os.path.join(ROOT, f"work_fable/take2/refs/{i}.jpg"))
        inp = {"prompt": KEEP + action + END.format(L=L), "image": f"file:work_fable/take2/refs/{i}.jpg", "duration": 5, "resolution": "720p",
               "use_virtual_avatar": True, "aspect_ratio": "16:9", "camera_fixed": True}
        spec = {"model": "bytedance/seedance-2.5", "tag": f"t2_{i}_t{take}", "notes": json.dumps({"take2": i, "still": st}), "input": inp}
        out = os.path.join(ROOT, "media/gen/specs", f"t2_{i}_t{take}.json"); json.dump(spec, open(out, "w"), indent=1); print(os.path.relpath(out, ROOT))
