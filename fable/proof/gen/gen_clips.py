#!/usr/bin/env python3
"""Write Seedance image-to-video specs for the proof plates: media/gen/specs/pf_<id>_t<k>.json (git-ignored).
   python3 fable/proof/gen/gen_clips.py [ID ...] [--take=1]    then:  $PY tools/gen/gen.py submit media/gen/specs/pf_<id>_t1.json ..."""
import json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
C = {  # id: (medium, action for the first two seconds, ambient motion, turn?)
 "piano": ("a hand-painted gouache picture-book illustration", "the toddler presses the piano keys one at a time with one hand, rocking a little on the bench", "the lamplight wavers softly", True),
 "violin": ("a coloured-pencil drawing on cream paper", "she plays the violin with steady bow strokes while the lightly sketched players around her bow along", "the pencil lines shimmer very slightly as in hand-drawn animation", True),
 "wushu": ("a woodblock print with bold black key lines and flat colour", "she and the four teammates behind her move through the form in perfect unison: the punching fist draws back to the hip and the other fist punches out, crisp and strong, stances low", "the teammates hold their stances", True),
 "wetlab": ("a fine pen-and-ink scientific drawing on aged ivory paper", "she slowly turns the focus knob of the microscope while the drawn neurons above her grow new fine branches, line by line, as if being inked by an invisible pen", "the neuron branches keep growing slowly", True),
 "phd": ("a pen-plotter line drawing on pale green graph paper", "the strip of chart paper feeds steadily through her hands and the long plotted waveform across the top of the picture draws itself onward", "the oscilloscope trace flickers and the chart paper keeps feeding", True),
 "poet": ("a sumi ink-wash painting on rice paper", "she types on the typewriter; typed pages lift off the desk and the ink-brushed birds beat their wings and fly up past the window", "the birds keep flying and a page drifts", True),
 "ames": ("a 1970s airbrushed space-agency concept painting", "the six enormous fans spin and the wind streams her long hair and the straps of her trousers sideways as she leans into it", "the fans keep spinning and her hair keeps streaming", True),
 "band": ("a two-colour risograph print with coarse halftone dots in coral and navy", "she strums the guitar in rhythm at the microphone, her bandmates play, and the small crowd nods along", "the band keeps playing and the halftone dots stay crisp", True),
 "chezjj": ("16-bit pixel art with crisp square pixels", "she types quickly on the laptop; screens flicker, the people on the sofas type, the cat's tail flicks, in small pixel-art animation steps", "the screens keep flickering", True),
 "sandstorm": ("ANSI and ASCII text-character art on a black terminal screen", "lines of text scroll up the big projected terminal behind her while she lowers her raised arm and the audience raise their hands and clap", "the terminal text keeps scrolling and the audience keeps clapping", True),
 "home": ("a wax-crayon and chalk-pastel drawing on dark blue paper", "she moves the small blue ball slowly around the grapefruit along the chalk-drawn orbit, the lamp glowing", "the chalk orbit lines shimmer slightly as in hand-drawn animation", True),
 "violet": ("a black-and-white scratchboard engraving with a single violet accent", "she writes in the notebook on her knee with the pencil; the engraved stars twinkle and the Milky Way drifts very slowly", "the stars keep twinkling", True),
 "root": ("a watercolour and gouache illustration with white-ink frost", "the little girl keeps her palm pressed on the cold window glass while the white frost crystals grow outward from under her hand across the whole pane, branching and branching again like a tree, the warm glow at her palm pulsing gently; in the last second she tips her head back a little to look up at it", "", False),
 "hero": ("a clean cel-shaded anime key visual", "she sprints straight toward the viewer with long powerful strides, hair and trouser straps flying behind her, the dark mirror ground and the lines of coloured light streaming past beneath her; the camera tracks backward at exactly her speed so she stays the same size and in the same place in the frame, her whole body in frame; her expression is open, determined and joyful, mouth closed in a smile", "", False),
}
def prompt(i):
    medium, action, ambient, turn = C[i]
    child = i in ("piano", "root"); who = "the toddler" if i == "piano" else "she"
    p = (f"Animate the first frame exactly as drawn: same framing, same composition, same character, and the same hand-made medium in every frame. It is {medium} and must stay {medium} throughout, never photographic and never 3D. "
         + ("The camera is locked off: no zoom, no pan, no cut. " if i != "hero" else "No cut. "))
    if turn:
        p += (f"For the first two seconds {action}. Then {who} pauses and turns ONLY her head, over her left shoulder, to look back toward the viewer: a calm, quiet look of recognition, lips closed, the faintest smile; she holds that look, nearly still, until the end. Her shoulders, back, arms and body do not turn: her back stays toward the viewer exactly as in the first frame, so the back of the jacket with the pale-blue circle stays in view. "
              f"Her face is drawn in the same medium as the rest of the picture: " + ("a small East Asian child with a round face and large very dark eyes. " if child else "an East Asian woman with large very dark brown eyes, a tall forehead, natural, no makeup. ")
              + f"Meanwhile {ambient}. ")
    else:
        p += f"{action[0].upper() + action[1:]}. "
    p += "Her mouth stays closed; she does not speak or sing. The lettering on her jacket (RARE EARTH and 1420 MHz) stays exactly as drawn in the first frame. One continuous shot. No captions, no subtitles, no added text."
    return p
want = [a for a in sys.argv[1:] if not a.startswith("--")] or list(C)
take = next((a.split("=")[1] for a in sys.argv if a.startswith("--take=")), "1")
os.makedirs(os.path.join(ROOT, "media/gen/specs"), exist_ok=True)
for i in want:
    spec = {"model": "bytedance/seedance-2.5", "tag": f"pf_{i}_t{take}", "notes": json.dumps({"proof_plate": i}),
            "input": {"prompt": prompt(i), "image": f"file:work_fable/proof/refs/{i}.jpg", "duration": 5, "resolution": "720p", "use_virtual_avatar": True, "aspect_ratio": "16:9"}}
    out = os.path.join(ROOT, "media/gen/specs", f"pf_{i}_t{take}.json"); json.dump(spec, open(out, "w"), indent=1); print(os.path.relpath(out, ROOT))
