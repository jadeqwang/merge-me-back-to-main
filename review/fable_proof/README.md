# Proof: 26 seconds of "Merge" built the take-two way (2026-11-13)

`merge_proof_bars28-43_1080p.mp4`: bars 28 to 43 of the song (0:47 to 1:13), on the new audio `inputs/Merge (keychange down).wav`,
timed to the new map `analysis_v3/timing.json`.
`compare_v7_vs_proof.mp4`: the same bars of the code-drawn v7 (left, timed to the old audio, so it drifts by up to 0.1 s here) next to
the proof (right); the sound is the proof's.
`proof_v3_sheet_0*.jpg`: contact sheets, four frames per second, song time burned in.

What it is
- "Each one a story to unfold": ten of Jade's lives, one plate each, every life in its own hand-made medium, cutting faster and faster
  (4, 4, 2, 2, 2, 2, 1, 1, 1, 1 beats).
- "And every branch remembers": the lives assemble into a twelve-panel grid (home and the violet 1420 MHz branch join here).
- Bar 37 hit: every life turns her head to look back at the same instant.
- "Where I started from": the twelve lanes merge into main and travel home to the child at the frost window.
- Bar 41: the chorus, with the sheet character on the main line.

How it was made
- Stills: Nano Banana Pro, with `inputs/character_sheet.png` as the only reference (23 stills including retakes).
- Motion: Seedance 2.5 image-to-video, 5 s at 720p per plate (16 clips including two retakes). No lip-sync, no likeness photo.
- Everything else is drawn in code by `fable/proof/` (Canvas 2D, deterministic): lane lines, branch chips, lyrics on the sung word
  times, the grid, the merge graph, paper grain. Prompts and specs: `fable/proof/gen/`.
- Paid generation for this proof: about $21.5 (cap for the proof was $40).

Known weaknesses
- Her face is drawn differently in each medium; whether the twelve read as one person is Jade's call.
- Text inside plates (the terminal on the stage, the whiteboard) is model-drawn gibberish; in a real cut the code would draw it.
- In the sandstorm plate she turns her whole body, not only her head, which puts the sleeve patch on the wrong side in those frames.
- The poet has a fringe; Jade does not.
- During the merge (bar 38) the top half of the frame is empty night.
- Nobody has watched it at speed with sound. All review was on stills and strips.
