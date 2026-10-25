"""Outro "orchestra of Jades" + post-credits palm-to-palm shots (2026-10-24, Jade's decisions 5 and 8). Loaded by tools/sd/batch.py.
Plates: media/plates/{out_orch,out_orch_close,pc_kneel,pc_beam}.png (GPT Image 2.5; candidates, refs and prompts in media/plates/outro/).
out_orch* audio windows are v2 song time on the v2 instrumental stem, starting on bar lines (bar 137 = 236.643, bar 141 = 243.599).
Lanes (engine/show/main.js LIFE): conductor = main orange, piano = rose, violin = white, electric guitar (Robot Ninja Apocalypse) = rose."""
INST2 = "analysis_v2/stems/instrumental.wav"
ORCH_GUARD = (" Every copy keeps the same face, hair and outfit as in the first frame, only the band colours differ; the conductor in the centre keeps "
              "exactly her face (large very dark brown eyes, natural lips, no makeup) and her half-up braided hair. Natural hands with five fingers: the "
              "pianist's fingers stay on the keys, the violin bow stays on the strings, the guitarist's hands stay on the neck and strings. Nobody sings. "
              "One continuous shot, no cuts. No captions, no text.")
PC_GUARD = (" Same faces as the first frame: the little girl stays a five-year-old with a round childlike face and large very dark brown eyes; the woman "
            "keeps exactly her face (large very dark brown eyes, natural lips, no makeup) and her half-up braided hair. Do not age the child, do not "
            "restyle or beautify either face. Natural hands with five fingers. The light is only a soft warm glow, never letters, numbers or symbols. "
            "Neither of them speaks. One continuous shot, no cuts. No captions, no text, no writing on the frost or the book.")
SHOTS = {
 "out_orch": dict(plate="out_orch.png", dur=10, group=True, v2=True, audio=(INST2, 236.64, 10), guard=ORCH_GUARD,
                  act="Every life she has lived plays together at sunrise. On the beat of the reference audio the four copies play as one band: the conductor "
                      "in the centre conducts with big joyful sweeping gestures of both open hands exactly on the beat, swaying and laughing; at the left the "
                      "rose copy plays the grand piano with both hands, rocking with the rhythm; the white copy draws long and quick bow strokes on the violin; "
                      "the rose guitarist strums the red electric guitar hard on the beat, bouncing. They glance at each other and grin. Low camera, a slow "
                      "gentle push in, golden sun, ripples on the thin water at their feet."),
 "out_orch_close": dict(plate="out_orch_close.png", dur=8, group=True, v2=True, audio=(INST2, 243.60, 8), guard=ORCH_GUARD,
                        act="The conductor conducts her other selves with big joyful sweeping gestures of both open hands exactly on the beat of the "
                            "reference audio, radiant, laughing, her hair moving in the wind; she turns her head from the pianist at the left to the "
                            "violinist and guitarist at the right, bringing them in; behind her, softly out of focus, they play along on the beat. "
                            "The camera drifts slowly around her."),
 "pc_kneel": dict(plate="pc_kneel.png", dur=8, guard=PC_GUARD,
                  act="Quiet early morning at the frosted window. The grown-up woman settles down onto one knee beside the little girl, gently, "
                      "smiling at her with tenderness; she slowly raises her open palm toward the child's small palm, and the tiny warm light in her palm "
                      "grows and floats softly across the gap into the child's palm. The girl looks at it in wonder, then turns to the frosted window and "
                      "lifts her palm toward the glass; the light drifts from her palm into the frost and settles there, a soft glow spreading gently "
                      "through the ice crystals. The camera slowly drifts left toward the window and holds on the calm glowing frost at the end."),
 "pc_beam": dict(plate="pc_beam.png", dur=8, guard=PC_GUARD,
                 act="The small warm light floats slowly from the woman's raised palm across to the little girl's small palm and rests there, glowing; "
                     "the girl watches it in wonder and the woman smiles with quiet hope, as if sending her younger self an idea. Then the girl turns "
                     "toward the frosted window and gently raises her palm to the glass; the light drifts off her palm into the frost and settles there, "
                     "a soft glow spreading through the ice crystals. The camera slowly pans left onto the frosted glass and holds on the calm glowing "
                     "frost for the last two seconds."),
}
