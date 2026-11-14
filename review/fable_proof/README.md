# Proof: 26 seconds of "Merge" built the take-two way

Bars 28 to 43 of the song (0:47 to 1:13), on the new audio `inputs/Merge (keychange down).wav`, timed to `analysis_v3/timing.json`.
The plan for the whole film is `fable/take2/PLAN.md`.

## Round 2 (2026-11-13, after Jade's notes)

- `merge_proof_r2_1080p.mp4`: the corrected proof.
- `merge_proof_r2_on_twos_1080p.mp4`: the same, with the drawn plates stepped at 12 frames a second ("on twos") while type, lanes
  and the graph stay smooth. For comparison; pick one.
- `compare_round1_vs_round2.mp4`: round 1 (left) beside round 2 (right).
- `proof_v3_sheet_0*.jpg`: contact sheets of round 2, four frames per second, song time burned in.
- `round1/`: the first proof and its files.

What changed from round 1
- The back of the jacket has no band: only the blue dot and RARE EARTH.
- One face in every medium (the character sheet's). Each clip now ends on an edited "looking back" still, so the video model does not
  invent a face.
- Little Jade: hair half up and half down with side-swept bangs, sitting properly at the piano while she plays and turns round.
- Violin: first chair of the first violins; chip reads `first chair, first violin`.
- Home: the two kids are shown from behind (an older boy with dark brown hair, a younger girl with light brown curly hair).
- The band: bandmates after the vibesong project's descriptions (text only; no photos were sent to a model).
- Names: `jade/open-source` and `jade/hacker-houses`.
- Colour restraint, begun: the wind tunnel, the hacker house and home are now one medium with one strong colour (the lane colour).
- No readable model-drawn text: the stage screen is empty, laptop logos are removed.
- Type sits on the side of the frame away from her; in the grid the lyrics have their own strip and cover no life.
- Chorus: the orange main line is written as text (her commit messages), a first test of "written lanes".
- Wushu: the first clip turned her body to the front for a moment (wrong sleeve, wrong jacket); retaken so every back stays to us.

Known weaknesses in round 2
- The chorus shot is still round 1's: clean anime on neon lanes. The plan replaces it with flat cel on black paper.
- The written lane runs across her shins in the chorus; it should pass behind her (needs a cut-out).
- Open source: columns of digits in the background, which the plan rules out; this plate is to be redone in real characters by the
  engine's glyph pass.
- Home: her hair reads shoulder-length, not long.
- The piano, the band and the wushu plates still carry more than one strong colour.
- Nobody has watched either version at speed with sound. All review was on stills and strips.

How it was made
- Stills: Nano Banana Pro with `inputs/character_sheet.png` as the reference. Motion: Seedance 2.5 image-to-video, 5 s at 720p, first
  and last frame given. No lip-sync, no likeness photo.
- Everything else is drawn in code by `fable/proof/` (Canvas 2D, deterministic): lanes, chips, lyrics on the sung word times, the
  grid, the merge graph, paper grain. Prompts and specs: `fable/proof/gen/`.
- Paid generation: round 1 about $21.5, round 2 about $24.
