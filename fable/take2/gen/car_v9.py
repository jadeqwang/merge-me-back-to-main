#!/usr/bin/env python3
"""Film v9 car (ob04): restyle the compositor's clean three.js clip with runwayml/aleph-2 (video edit, motion and camera kept).
   Input video: work_fable/take2/dev/v9_plates/car_ref_720.mp4 (car3d_clean rendered with ?box=0&hands=0, 205 fr @30, 6.833 s).
   Guidance: first = v9_car_first_a1 (drawn driver's view, no driver body), last = v9_car_last_a1 (her drawn card, interior detailed).
   Writes media/gen/specs/t2_car_v9_t<take>.json; then tools/gen/gen.py submit|wait as usual.   python3 car_v9.py [--take=1]"""
import json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
take = next((a.split("=")[1] for a in sys.argv if a.startswith("--take=")), "1")
P = ("Turn this rough 3D animation into a finished hand-drawn anime film shot in a clean cel style with ink outlines, keeping the camera "
     "move, timing and layout exactly. Night, inside a car on a dark country road. The camera is the driver's eyes: the driver is never "
     "seen, no hands on the steering wheel, no arms, no reflection of a driver in the mirror or the glass. Add the detail of the car "
     "interior: dashboard seams and vents, glowing gauges, door panel, seats, roof lining. The young woman in the passenger seat keeps "
     "exactly her drawn face, long black hair, white jacket with orange stripes, 1420 MHz sleeve patch and orange headphones round her "
     "neck. She turns her head to the camera and settles into a quiet, mysterious almost-smile, mouth closed, and holds it. She does not "
     "speak. She is the only person. No text.")
assert len(P) <= 1000, len(P)
spec = {"model": "runwayml/aleph-2", "tag": f"t2_car_v9_t{take}", "notes": json.dumps({"take2": "car_v9"}),
        "input": {"prompt": P, "video_uri": "file:work_fable/take2/dev/v9_plates/car_ref_720.mp4", "duration": 6.833,
                  "prompt_images": [{"uri": "file:work_fable/take2/stills/v9_car_first_a1.jpg", "position": "first"},
                                    {"uri": "file:work_fable/take2/stills/v9_car_last_a1.jpg", "position": "last"}]}}
out = os.path.join(ROOT, "media/gen/specs", f"t2_car_v9_t{take}.json"); json.dump(spec, open(out, "w"), indent=1); print(os.path.relpath(out, ROOT), len(P), "chars")
