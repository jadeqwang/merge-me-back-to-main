#!/usr/bin/env python3
"""Seedance image-to-video specs for take two: media/gen/specs/t2_<id>_t<k>.json (git-ignored).
   python3 fable/take2/gen/gen_clips.py ID[=still] [...] [--take=1]   then  $PY tools/gen/gen.py submit media/gen/specs/t2_<id>_t1.json ...
First frames are work_fable/take2/stills/<still>.jpg|png re-encoded to work_fable/take2/refs/<id>.jpg (2048x1152)."""
import json, os, sys, subprocess
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
KEEP = ("Animate the first frame exactly as drawn: same framing, same composition, same character, and the same hand-made medium in every frame. It is {m} and must stay {m} throughout, never photographic and never 3D. ")
# Lettering. Take 1 said "the lettering (RARE EARTH and 1420 MHz) stays as drawn" for every view; in front and side views the model then
# wrote RARE EARTH on the chest and moved the patch about. From take 2 the sentence depends on what the shot can see.
LETTER = {"back": "The lettering on her jacket (RARE EARTH on the back and 1420 MHz on the sleeve patch) stays exactly as drawn in the first frame.",
          "front": "There is no lettering anywhere on the front of her jacket: no label, no tag, no words on the chest. The only lettering is 1420 MHz on the one round patch on her left upper arm, which stays exactly where it is in the first frame; her other arm has no patch.",
          "side": "Her torso never twists: she stays exactly side-on, so the back of her jacket is never seen. No lettering appears anywhere except 1420 MHz on the one round patch on her left upper arm, which stays exactly where it is in the first frame; her other arm has no patch; no words on the jacket."}
VIEWS = {"patch_resolve": "front", "runner_pencil": "side", "runner_pixel": "side", "cross_wetlab": "back", "hero_paper": "front"}
END0 = " Her mouth stays closed; she does not speak or sing. {L} One continuous shot, no cut. No captions, no subtitles, no added text."
END = "{END}"
RUN = ("She runs in place at a steady sprint, exactly side-on, as if on a treadmill: an even, regular stride, left and right legs strictly alternating, arms pumping, her hair and trouser straps streaming behind her. "
       "She stays in the same place in the frame and at the same size the whole time: her whole body, from the top of her head to the soles of her trainers, stays inside the frame with space around it, exactly as in the first frame; the camera is locked off and never zooms in. The background stays a completely plain, flat, even, empty grey with nothing in it: no ground, no shadow, no scenery, no lines.")
C = {  # id: (still, medium, action, extra input)
 "patch_resolve": ("patchwork_a1", "a hand-made illustration", None, {"last": "resolve_a1"}),
 "runner_pencil": ("runner_pencil_a1", "a coloured-pencil drawing", RUN, {}),
 "runner_pixel": ("runner_pixel_a1", "16-bit pixel art with crisp square pixels, moving in small pixel-art animation steps", RUN, {}),
 "cross_wetlab": ("cross_wetlab_a1", "a flat cel-shaded anime drawing on black paper",
                  "She runs along the mint-green line toward the tall doorway of ivory light, with an even stride, her back to the viewer the whole time, and reaches it in about three seconds; she runs through the doorway and is gone into the ivory light. The hand-drawn strokes of light around the doorway flicker as in hand-drawn animation; inside the doorway the fine ink neurons grow slowly. The camera is locked off: no zoom, no pan.", {}),
 "hero_paper": ("hero_paper_a2", "a flat cel-shaded anime drawing on black paper, with flat colours and no glow",
                "She sprints straight toward the viewer with long, even, powerful strides, left and right legs strictly alternating in a regular rhythm, hair and trouser straps flying behind her. The camera tracks backward at exactly her speed so she stays the same size and in the same place in the frame, her whole body in frame. The thin hand-drawn coloured lines on the black paper stream past and waver slightly as in hand-drawn animation; the black paper stays black and empty. Her expression is open and determined, lips closed.", {}),
}
PATCH = ("The video begins on the first frame and ends exactly on the last frame. It is one hand-made drawing of one woman, who stays in the same pose, the same place and the same size throughout; the camera is locked off. "
         "For the first second the patchwork of art mediums on her shimmers gently as in hand-drawn animation and she blinks once. Then, over about two and a half seconds, the patches settle: starting from her face and spreading outward over her hair, jacket, arms and trousers, "
         "each patch of a different medium smooths into clean flat cel-shaded anime colour with a clean inked line, the torn-paper seams closing and disappearing, while behind her the white paper fills with a bright pale-blue morning sky. "
         "It arrives at exactly the last frame and holds it, nearly still, her hair stirring a little, for the final second. She does not walk or turn; never photographic, never 3D." + END)
def ref(src, out):
    os.makedirs(os.path.dirname(out), exist_ok=True)
    subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", src, "-vf", "scale=2048:1152:flags=lanczos", "-q:v", "2", out], check=True)
def still(n):
    for e in (".jpg", ".png"):
        p = os.path.join(ROOT, "work_fable/take2/stills", n + e)
        if os.path.exists(p): return p
    raise SystemExit("no still " + n)
want = [a for a in sys.argv[1:] if not a.startswith("--")] or list(C)
take = next((a.split("=")[1] for a in sys.argv if a.startswith("--take=")), "1")
os.makedirs(os.path.join(ROOT, "media/gen/specs"), exist_ok=True)
for w in want:
    i, _, alt = w.partition("="); st, medium, action, extra = C[i]; st = alt or st
    ref(still(st), os.path.join(ROOT, f"work_fable/take2/refs/{i}.jpg"))
    prompt = (PATCH if i == "patch_resolve" else KEEP.format(m=medium) + action + END).replace("{END}", END0.format(L=LETTER[VIEWS[i]]))
    inp = {"prompt": prompt, "image": f"file:work_fable/take2/refs/{i}.jpg", "duration": 5, "resolution": "720p", "use_virtual_avatar": True, "aspect_ratio": "16:9"}
    if i.startswith("runner"): inp["camera_fixed"] = True
    if extra.get("last"):
        ref(still(extra["last"]), os.path.join(ROOT, f"work_fable/take2/refs/{i}_last.jpg")); inp["last_frame_image"] = f"file:work_fable/take2/refs/{i}_last.jpg"
    spec = {"model": "bytedance/seedance-2.5", "tag": f"t2_{i}_t{take}", "notes": json.dumps({"take2": i, "still": st}), "input": inp}
    out = os.path.join(ROOT, "media/gen/specs", f"t2_{i}_t{take}.json"); json.dump(spec, open(out, "w"), indent=1); print(os.path.relpath(out, ROOT))
