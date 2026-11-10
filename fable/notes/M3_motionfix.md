# M3 — motion fixes flagged by the sequence directors (working notes)

Recipes: `fable/tools/bake/recipes_util.py` (violet), `recipes_m3.py` (new tracks). Bake / validate / look as in `M1_util.md`, `P1_qa.md`.
Sheets (git-ignored): `work_fable/out/reel/m3/` (reel, real figure), `work_fable/stills/m3/` (from `main.js`).

## 1. `violet` sit (song 203.745-208.8, track 22.75-30.0) — done
- Was: CMU 114_16 sit-down (forward fold, roll) + CMU 82_05 seat (leaning on the right hand).
- Now authored (`_violet_sit` in `recipes_util.py`, `Poser` keys + `keyframes`): a breath out and the eyes drop (204.3), squat with the arms forward
  (205.05), deep squat on the balls of the feet while the right hand goes to the ground beside the hip (205.7), the seat touches down with the
  weight on that hand (206.35), the hand leaves the ground and both arms come round the knees (wrapped 207.7: elbows outside the knees, each hand
  on the other forearm in front of the shins), the chin lifts while the arms close (up at the sky, 32 deg, a little to her right, by 208.3), a small
  settling sigh, then breath (4.3 s period; the arms ride on it) and a slow head / spine drift to the end of the take.
- The feet never move (0 skate when seated, 4 cm of IK give during the squat); the seat ends 0.53 m BEHIND where she stood (the old capture sat her
  down in place). `11_violet.js` shot D: the frame goes back 0.5 m with her (`0.8 - 0.4 * u`), nothing else changed; the road's end ring is at her feet.
- Pins: frames 0-22.2 s are bit-identical to the old track (stop, pencil, writing, release untouched); events unchanged (`sit_start` 22.75, `seated` 25.905:
  the seat is on the ground from 25.35, i.e. 206.35). No window slower than 4 mm/s (alive). Max joint speed in the sit 1.7 m/s (the hand coming round).
- Sheets: `work_fable/out/reel/m3/violet_sit_before.jpg`, `violet_sit_1s.jpg` (side, every 0.25 s), `violet_sit_spin.jpg` (seated pose, 8 yaws),
  `work_fable/stills/m3/violet_film.jpg` (the film, 204.5-210.5).
