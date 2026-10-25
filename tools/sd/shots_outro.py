"""Outro "orchestra of Jades" + post-credits palm-to-palm shots (2026-10-24, Jade's decisions 5 and 8). Loaded by tools/sd/batch.py.
Plates: media/plates/{out_orch,out_orch_close,pc_kneel,pc_beam}.png (GPT Image 2.5; candidates, refs and prompts in media/plates/outro/).
out_orch* audio windows are v2 song time on the v2 instrumental stem, starting on bar lines (bar 137 = 236.643, bar 141 = 243.599).
Lanes (engine/show/main.js LIFE): conductor = main orange, piano = rose, violin = white, electric guitar (Robot Ninja Apocalypse) = rose.
v5 (2026-10-25): the orch_* shots below replace the conductor with a COMPOSER who is the violet 1420 MHz branch (Jade's pick): bun with two
pencils, violet bands, writing the music in violet light (engine FX.score) while the main-world band plays it. Their first frames are the
STILLS at the bottom (tools/sd/stills.py writes the prompt files and prints the commands). pc_kneel / pc_beam are no longer used (the v5
post-credits reuse v2_horizon + ch0_window); their specs stay for the record."""
INST2 = "analysis_v2/stems/instrumental.wav"
ORCH_GUARD = (" Every copy keeps the same face, hair and outfit as in the first frame, only the band colours differ; the conductor in the centre keeps "
              "exactly her face (large very dark brown eyes, natural lips, no makeup) and her half-up braided hair. Natural hands with five fingers: the "
              "pianist's fingers stay on the keys, the violin bow stays on the strings, the guitarist's hands stay on the neck and strings. Nobody sings. "
              "One continuous shot, no cuts. No captions, no text.")
# v5 eye wording (same as tools/sd/batch.py EYES): "large very dark brown eyes" made Seedance enlarge eyes it had to redraw (1:58, 3:33)
EYES = ("Same face and eyes as the first frame: keep the exact eye size, eye shape and very dark brown irises; natural double-eyelid crease; white "
        "of the eye visible on both sides of the iris; do not enlarge, round or widen the eyes, no eyeliner, no tears.")
ORCH5_GUARD = (" Every copy keeps her face, hair and outfit from the first frame; only the band colours differ (the composer VIOLET, never orange, "
               "hair up in a bun with two pencils; the pianist and guitarist ROSE; the violinist WHITE). " + EYES + " Natural hands with five "
               "fingers: the composer's pencil stays in her right hand, the pianist's fingers on the keys, the bow on the strings, the guitarist's "
               "hands on the neck and strings. The pencil leaves no marks or trails; only its tip glows. Nobody sings. One continuous shot, no cuts. "
               "No captions, no text, no symbols in the air.")
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

 # ---- v5 orchestra (Jade 2026-10-25: "improve the instrument playing to match what's in the music"; the conductor becomes a composer who
 # writes the music in real time with a pencil; the composer is the violet branch). Cuts (engine/show/main.js, ORCH v5): wide 137 | violin 138 |
 # piano 139 | composer 140 | guitar 141 | wide 142-143 | composer 143.75-144. Windows start on a beat of the v2 instrumental, so whole-beat
 # s0 shifts stay on the beat. Clip times in the acts: drop 0.87 s into orch_wide; the sung line's leap/fall/rise 0.49/1.33/2.0 s and the
 # double bar 7.1 s into orch_pencil; chord change 0.87 s into orch_guitar. Plates: media/plates/outro/orch_*.png (STILLS below).
 "orch_wide": dict(plate="outro/orch_wide.png", dur=13, group=True, v2=True, audio=(INST2, 235.774, 13), guard=ORCH5_GUARD,
                   act="Every life she has lived plays together at sunrise; the violet composer in the centre writes the music as they play. Through "
                       "the rising sweep of the reference audio she holds a yellow pencil high; on the drop she slashes it down like a downbeat and the "
                       "band crashes in: the rose guitarist hits one big open strum, the rose pianist lands both hands on a chord. Then the pianist's "
                       "right hand ripples a fast, even broken-chord pattern while her left hand presses a low note on every beat; the guitarist chugs "
                       "tight strums on every half beat, bouncing at the knees; the white violinist waits, bow resting on the string, and two seconds "
                       "after the drop draws one long, slow bow stroke, eyes closed, never sawing on the beat. The composer writes in the air at head "
                       "height with the glowing pencil tip, quick precise strokes left to right as if on an invisible staff, nodding on the beat and "
                       "glancing at each player as she writes their part. All four play on together to the end. Very slow push in."),
 # no reference audio on purpose: with the drums as the reference, out_orch_t2's violinist bowed on every beat (2.3 Hz); the part is a long sung line
 "orch_line": dict(plate="outro/orch_line.png", dur=5, group=True, guard=ORCH5_GUARD,
                   act="Over the composer's shoulder at sunrise. In the foreground the violet composer, seen from behind in three-quarter profile with "
                       "her hair up in a bun with two pencils through it, draws one long rising curve in the air with the glowing pencil tip and points "
                       "the pencil gently at the violinist, as if handing her the melody. In the middle distance the white violinist answers at once: "
                       "right at the start she sets the bow on the string and draws one single long, slow, singing bow stroke that lasts the whole "
                       "shot, her left hand vibrating softly on one note, eyes closed, swaying slowly; the bow never changes direction. Far behind them, "
                       "softly out of focus, the pianist and the guitarist play. The camera holds, drifting slightly toward the violinist."),
 "orch_keys": dict(plate="outro/orch_keys.png", dur=5, v2=True, audio=(INST2, 239.252, 5),
                   guard=" Same hands, sleeves and face as in the first frame; the cuff bands stay ROSE. Natural hands with five fingers each; the fingers "
                         "stay on the keys and press real keys. Her mouth stays gently closed. One continuous shot, no cuts. No captions, no text.",
                   act="Close on the pianist's hands on the grand piano at sunrise: her right hand ripples a fast, even broken-chord pattern of four notes "
                       "up and down high on the keyboard, light and precise, never stopping, while her left hand presses one low note on every beat of "
                       "the reference audio. Golden light slides across the black lacquer and the keys; above, her face in soft profile, eyes half "
                       "closed, smiling. The camera glides slowly along the keyboard."),
 "orch_pencil": dict(plate="outro/orch_pencil.png", dur=8, group=True, v2=True, audio=(INST2, 241.425, 8), guard=ORCH5_GUARD,
                     act="The violet composer is writing the music in real time, and it is working. Half a second in she flicks the glowing pencil tip "
                         "up to a high note in the air beside her head, a second later makes a small stroke down, and at two seconds a small stroke back up, "
                         "then in the same motion taps three quick dots one above the other and flicks the pencil toward the guitarist behind her on the "
                         "right of the frame. Then she draws one long straight line to the right and holds it, listening, smiling, while the band plays "
                         "her line, and keeps writing small even strokes, nodding on the beat. About seven seconds in she draws one firm vertical stroke "
                         "like a final bar line, lowers the pencil and looks into the camera with a calm, delighted smile. Behind her, softly out of "
                         "focus, the pianist, the violinist and the guitarist play. The camera drifts slowly around her."),
 "orch_guitar": dict(plate="outro/orch_guitar.png", dur=5, v2=True, audio=(INST2, 242.730, 5),
                     guard=" " + EYES + " Same outfit as in the first frame, natural lips, no makeup; the jacket bands and headphone cups stay ROSE. "
                           "Natural hands with five fingers: the picking hand stays over the strings, the fretting hand on the neck. Her mouth stays "
                           "gently closed; she does not sing. One continuous shot, no cuts. No captions, no text.",
                     act="Low angle on the rose guitarist with the red electric guitar and the small amp beside her at sunrise. For the first second "
                         "she chugs short, tight strums in time with the reference audio, her fretting hand low on the neck; then she slides the fretting "
                         "hand up the neck and hits one huge open strum, arm swinging through, hair flying, and drives on with strong, steady strums on "
                         "every half beat, bouncing at the knees, grinning toward someone off to the left. The camera pushes in slowly."),
}

# First frames for the v5 orchestra (GPT Image 2.5 via tools/plates/gpt_plate.py, 2 candidates each, 1536x1024 -> crop 1536x864, copy the pick to
# media/plates/outro/<id>.png). Image edits drift toward canon orange, so every prompt pins the lane colours. Refs: at most 3; the first is the
# image to edit for the "Edit" prompts. Violet look = media/plates/face_v4/v2_pencil.png (canon face, bun with two pencils, violet bands) and
# media/style/canon_v4/violet_test/violet_ref.png. tools/sd/stills.py ID writes the prompt file and prints the command.
_TAIL = " The round white 1420 MHz sleeve patch on each woman's LEFT upper arm is the only lettering; no other text."
_VREFS = ["media/plates/face_v4/v2_pencil.png", "media/style/canon_v4/violet_test/violet_ref.png"]
STILLS = {
 "orch_wide": dict(tool="gpt", out="media/plates/outro/orch_wide", refs=["media/plates/out_orch.png"] + _VREFS,
   prompt="Edit the first image. Keep everything exactly as it is: the mirror salt flat at sunrise, the grand piano, the amp, the camera, and the "
          "three players with their faces and poses (the pianist with ROSE jacket bands, the violinist with WHITE bands, the guitarist with ROSE "
          "bands). Change only the woman in the centre: she is now the composer, the violet version of the same woman in the second and third "
          "images. Same face and eyes (keep the exact eye size and shape, very dark brown irises, natural double-eyelid crease, natural lips), the "
          "same white cropped jacket but with VIOLET bands and violet headphones, never orange, and her black hair up in a bun with two pencils "
          "pushed through it, exactly like the references. She holds a third yellow pencil raised high in her right hand like a baton about to "
          "come down, its tip glowing softly; her left hand is relaxed; she looks toward the pianist with a confident, excited smile. The "
          "violinist rests her bow on the string, still, ready. The upper quarter of the frame is open sky above their heads." + _TAIL),
 "orch_line": dict(tool="gpt", out="media/plates/outro/orch_line", refs=["media/plates/out_orch.png"] + _VREFS,
   prompt="Over-the-shoulder shot on the mirror salt flat at sunrise, in the world of the first image. In the left foreground, large and rim-lit, "
          "the composer is seen from behind in three-quarter profile: the violet version of the woman in the second and third images, white "
          "cropped jacket with VIOLET bands and violet headphones (never orange), black hair up in a bun with two pencils pushed through it. She "
          "raises a yellow pencil in her right hand, tip glowing softly, pointing gently toward the violinist. In the middle distance on the "
          "right, sharp and well lit, the violinist (the same woman's face and eyes, white jacket with WHITE bands and white headphones, long dark "
          "hair down) plays with her eyes closed, bow on the string. Far behind, out of focus, a pianist at a grand piano and a guitarist with a "
          "red electric guitar (ROSE bands). Low camera, golden sun low behind them, long reflections on the wet salt. The upper left of the "
          "frame is open sky." + _TAIL),
 "orch_keys": dict(tool="gpt", out="media/plates/outro/orch_keys", refs=["media/plates/out_orch.png", "media/plates/lf_piano_rose.jpg", "media/style/r7/turn_gpt_patch.png"],
   prompt="Close-up from the side of a black grand piano on the mirror salt flat at sunrise, in the world of the first image. The pianist's two "
          "hands are on the keys: the right hand high on the keyboard with fingers curved over a broken chord, the left hand lower. White jacket "
          "cuffs with ROSE bands. Golden light slides along the black lacquer and the keys. Her face is in soft profile at the top of the frame, "
          "eyes half closed, long dark hair down, rose headphones. The top third of the frame is the lid's reflection and open sky." + _TAIL),
 "orch_pencil": dict(tool="gpt", out="media/plates/outro/orch_pencil", refs=["media/plates/out_orch_close.png"] + _VREFS,
   prompt="Edit the first image. Keep the framing, the sunrise, the band behind her, and her face and eyes exactly (same eye size and shape, very "
          "dark brown irises, natural double-eyelid crease). Change her into the violet version of herself in the second and third images: her "
          "jacket bands and headphones become VIOLET, never orange, and her hair is up in a bun with two pencils pushed through it, a few loose "
          "strands, exactly like the references. She holds a third yellow pencil in her right hand at shoulder height beside her face, tip "
          "glowing softly, about to write in the air; her left hand is relaxed and lower. Focused and delighted. The sky to the right of her head "
          "is open." + _TAIL),
 "orch_guitar": dict(tool="gpt", out="media/plates/outro/orch_guitar", refs=["media/plates/out_orch.png", "media/plates/lf_band_rose.jpg", "media/style/r7/turn_gpt_patch.png"],
   prompt="Low-angle medium shot on the mirror salt flat at sunrise, in the world of the first image. The guitarist (the same woman's face and "
          "eyes, long dark hair down, white cropped jacket with ROSE bands and rose headphones, black cargo pants) plays a red electric guitar, "
          "right of centre, mid-strum, fretting hand low on the neck. A small guitar amp stands beside her on the wet salt, the golden sun low "
          "behind her. The left half of the frame is open sky and water." + _TAIL),
}
