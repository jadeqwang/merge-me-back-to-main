#!/usr/bin/env python3
"""Video-model bake-off for fight choreography (docs/video_model_bakeoff.md). Writes one gen.py spec per (model, test, take) into
media/gen/specs/, all from the same first frame (review/takes/stills/dr_dl_roll.png) and the same prompt text, adapted only where a model
needs it (Seedance takes the drop instrumental as a reference audio and is told to hit its beats; the others get second marks).
  python3 tools/sd/bakeoff.py [--models=seedance,veo,hailuo,runway,vidu] [--tests=roll,kick] [--t0=71]   # prints the spec paths
Then: python3 tools/gen/gen.py submit <specs> (est + cap check), python3 tools/gen/gen.py wait <ids>.
Tags: dr_dl_roll_t<N> (test a) and dr_dl_kick_t<N> (test b); one tag pair per model, so a model owns the same N in both tests."""
import json, os, subprocess, sys
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(ROOT, "tools", "gen"))
import gen  # noqa: E402

STILL = "review/takes/stills/dr_dl_roll.png"
I2 = "analysis_v2/stems/instrumental.wav"
B89, BAR = 153.167, 240 / 138
B = lambda b: B89 + (b - 89) * BAR
DUR = 6

HEAD = ("Animate the first frame exactly, same framing and characters. Rehearsed wushu partner set on a wet salt flat at sunset: orange "
        "copy (ponytail) left, violet copy (two buns) right, in guard. ")
BODY = ("Real weight and momentum; knees bend on every landing. Always exactly two separate people, two arms and two legs each; no limb "
        "appears, vanishes or detaches; bodies never pass through each other. The four small background figures stay in place. Static low "
        "side camera. One continuous shot, no slow motion, no text, mouths closed.")
ACT = {
    # (a) the partner roll over the back
    "roll": ("About {t1} the orange copy bends forward at the waist, back flat like a table, hands on her knees, feet planted. About {t2} "
             "the violet copy puts her palms and shoulders on that back and rolls over it lengthwise, legs together in one high arc, "
             "inverted above the back about {t3}. About {t4} she lands on both feet on the far left side and both freeze in a "
             "liangxiang pose facing the camera. "),
    # (b) a correct kick-vs-block exchange (not symmetric kicks)
    "kick": ("About {t1} the violet copy alone throws a middle front snap kick at the orange copy's stomach. The orange copy does NOT kick: "
             "she lifts her front knee and sweeps her forearm down, parrying the shin aside past her hip. About {t2} the orange copy "
             "counters with a straight punch in a bow stance, stopping short; the violet copy leans back and blocks with her forearm. "
             "About {t3} both freeze. One kick only. "),
}
# cue marks: Seedance hits beats of the reference audio (window starts one bar before the slot, so the slot's downbeat is clip 1.739)
CUES = {"roll": ("1.7 seconds in", "2.6 seconds in", "4.3 seconds in", "4.8 seconds in"),
        "kick": ("1.7 seconds in", "3.5 seconds in", "4.6 seconds in")}
SLOT = {"roll": 91, "kick": 97}          # the drop bar each test is made for (its audio window starts one bar before)

MODELS = {   # name: (model id, build(prompt, still path, audio path) -> input)
    "seedance": ("bytedance/seedance-2.5", lambda p, im, au: dict(prompt=p + " Each timed move lands exactly on a beat of the "
                 "reference audio.", image=f"file:{im}", duration=DUR, resolution="720p", aspect_ratio="16:9",
                 use_virtual_avatar=True, reference_audios=[f"file:{au}"])),
    "veo": ("google/veo-3.1", lambda p, im, au: dict(prompt=p, image_input=f"file:{im}", duration=f"{DUR}s", aspect_ratio="16:9",
            resolution="1080p", generate_audio=False)),
    "hailuo": ("minimax/hailuo-2.3", lambda p, im, au: dict(prompt=p, first_frame_image=f"file:{im}", duration=DUR, resolution="768P",
               prompt_optimizer=False, fast_pretreatment=False)),   # minimax/h3 (same slot) failed 7003 on all four jobs, unbilled
    "runway": ("runwayml/gen-4.5", lambda p, im, au: dict(prompt=p[:1000], image_input=f"file:{im}", ratio="1280:720", duration=DUR)),
    "vidu": ("vidu/q3-pro", lambda p, im, au: dict(prompt=p, start_image=f"file:{im}", duration=DUR, resolution="720p", audio=False)),
}
ORDER = list(MODELS)


def prompt(test):
    return HEAD + ACT[test].format(**{f"t{i + 1}": c for i, c in enumerate(CUES[test])}) + BODY


def main():
    opt = lambda k, d: next((a.split("=", 1)[1] for a in sys.argv[1:] if a.startswith(f"--{k}=")), d)
    models, tests, t0 = opt("models", ",".join(ORDER)).split(","), opt("tests", "roll,kick").split(","), int(opt("t0", "71"))
    im = os.path.relpath(gen.ref_image(os.path.join(ROOT, STILL), os.path.join(gen.REFS, "dr_dl_roll_2048.jpg")), ROOT)
    for test in tests:
        s0 = B(SLOT[test] - 1)
        au = os.path.relpath(gen.audio_ref(os.path.join(ROOT, I2), s0, DUR, os.path.join(gen.REFS, f"dr_dl_{test}_v2_{s0:.2f}_{DUR}s.mp3")), ROOT)
        for m in models:
            mid, build = MODELS[m]
            for k in range(2):
                n = t0 + 2 * ORDER.index(m) + k
                tag = f"dr_dl_{test}_t{n}"
                spec = {"model": mid, "tag": tag, "notes": json.dumps({"shot": f"dr_dl_{test}", "s0": round(s0, 3), "plate":
                        "media/plates/drop/dr_dl_roll.png", "timing": "v2", "bakeoff": m}), "input": build(prompt(test), im, au)}
                p = os.path.join(gen.SPECS, f"{tag}.json")
                os.makedirs(gen.SPECS, exist_ok=True)
                json.dump(spec, open(p, "w"), indent=1, ensure_ascii=False)
                print(os.path.relpath(p, ROOT))


if __name__ == "__main__":
    main()
