# Video-model test: redrawing the character from the code render (2026-11-10)

Question (Jade): what if the parts of the film that show her were fed into a video model, to draw the character faithfully to the
anime character sheet?

Method: Seedance 2.5 with the code render as `reference_videos` (motion, camera, timing), `inputs/character_sheet.png` as the
reference image, and a prompt saying: redraw as hand-drawn anime in the sheet's style, follow the video frame for frame, keep
background and text. 720p, 24 fps, about 6 s per clip, $0.97 per second. Four clips were paid for: $23.39 at list price (the spend tool
books each at its 15-second assumption, so it shows more).

| file | shot | redrawn from the sheet? | framing kept? |
|---|---|---|---|
| `compare_write.mp4` | 3:16 writing in light, from behind, night | barely: a near copy of the code figure | yes |
| `compare_day_take1.mp4` | 3:56 day dance | fully | no: pushed in to waist-up |
| `compare_become.mp4` | 3:50 open arms at sunrise | fully | yes, incl. the silhouette-to-colour change |
| `compare_day_take2.mp4` | 3:56 day dance, prompt pins the framing | fully | yes, incl. the cut and the lyric |

In each comparison the code render is on the left. `out_become.mp4` and `out_day_take2.mp4` are the two best raw outputs.

What it shows
- When it redraws, the character is far better than the procedural figure: proportions, hair, cargo trousers, hands, trainers, and
  she reads as the sheet. Poses follow the code render frame for frame in the frames compared (two per second).
- Framing can be held by saying so in the prompt ("the camera never moves closer; her whole body stays in frame at the same size
  and position"). Take 1 had "dances forward" in the prompt and the model pushed in.
- Lyrics and HUD mostly survive but drift (a lyric stayed white where the code turns it dark; one line did not appear). In a real
  pipeline the type would come from the code render, not from the model.
- The night shot from behind was hardly changed. Night, silhouette and crowd shots are untested or unsuitable.
- Two jobs submitted in the same minute both failed (error 7003, not billed). One at a time works.
- Not judged: flicker and line boil in motion. Jade should watch the clips.

If this is adopted (not started; needs Jade's decision)
- The code film stays as the layout: world, roads, lyrics, HUD, crowds, silhouettes, timing. Only shots where she is a single large
  figure in light are redrawn: roughly 150 s of the 282 s.
- Rough cost: 150 s x $0.97 = about $145 for one take each, perhaps $230 with retakes, inside what is left of the $600 cap.
- Output is 720p at 24 fps. Either master the film at 24 fps, or accept her layer moving at 24 inside a 30 fps world. Her layer
  would be cut out, scaled up and laid over the code-drawn world at full resolution.
- "Every pixel is drawn in code" stops being true; the terminal credits and READMEs would say what was redrawn and by what.
