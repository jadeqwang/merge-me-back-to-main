# Act D — seq 11 violet, 12 flight, 13 catch (180.99–236.64, 3:01–3:57)

Files: `fable/show/seq/11_violet.js`, `12_flight.js`, `13_catch.js`, `actd_hand.js` (her handwriting). Shared: `fable/show/cast.js` (one additive option).
Status: IN PROGRESS (see "In progress / known problems" at the bottom). Stills: `work_fable/stills/actD/`.

## Shot list (song time; all cuts on measured bars / words)
| # | time | cut on | camera | what it is for |
|---|---|---|---|---|
| A | 180.99–187.95 | b105 | side truck from her right, 4.3 m, lens with her; she crosses left to right, ~55 % of frame height | "This branch may never find the way": alone, running, deep night |
| B | 187.95–194.90 | b109 | behind her right shoulder, 4.6 m, slow creep; she walks in, stops at the end of her road, turns her head to the east | "Back to the place where I began": she looks at the faint warm band and far lights where main's morning is |
| C | 194.90–203.60 | b113 | over her right shoulder (46° off her back), push in to 1.9 m, 30° lens; held through the drum-out | she draws the pencil (195.5–196.3) and writes (196.4–200.9): the ribbon leaves the lead and settles into `docs: start here`; `for whoever I am next` resolves under it (199.7–201.9); on b117 (201.86) the line lets go and gathers into one mote in her open hands |
| D | 203.60–210.96 | b118 … "me" | from her right, pushing in to a medium as she sits (seated 206.9); from "Merge" (208.13) the camera lifts away to a wide | the mote leaves east; she lowers herself, looks up; HUD `ctx ▮▮▮▮▮ 100%`, the hash stops changing; her body dims to its accents; she is a small steady light at the end of her road. MERGE is sung over her |
| F1 | 210.96–214.97 | "me" | chase: 100 m behind and 30 m above the light, 46° lens | "... me back to main": the light over the dark continent |
| F2 | 214.97–220.99 | "Every" | the same chase coming down, banking east onto main | "Every road I ran becomes the one": the merge of the thousand roads under it, dawn swinging in ahead; "one" lands on the first sight of the people on main |
| F3 | 220.99–222.73 | b128 | low frontal on main-Jade, 7.4 → 6 m, the thousand behind her in arcs, sun about to break dead behind her | she is waiting; the light comes over our shoulder |
| C1 | 222.73–225.34 | (same shot) hit b129 | the same frontal, creeping in | it lands between her hands at her chest on the hit; the sun breaks; half a step back, head bowed; violet ripple out through the thousand; 1 then 2 run up behind her and are light (b130.1, b130.2) |
| C2 | 225.34–229.69 | b130.3 | high wide from the west, slow crane | the fold: 4, 8 … 512 on eight more beats, each a runner then a light; HUD 1,024 → 1 branches; she stands alone from 228.38 |
| C3 | 229.69–236.64 | b133 | frontal medium, she is right of centre at half the frame height, type in the left third | head lifts on "life" (229.6); arms open and full colour complete on "become" (232.71); day by b137 |

## How the writing works (11_violet.js, actd_hand.js)
- `actd_hand.js`: a single-stroke hand (glyphs `d o c s : t a r h e`, strokes in pen order, seeded unevenness). Runs in node for a preview.
- The pencil's lead (`fig.body.pencilTip` in the handR frame) is sampled along the take between `write_start` and `write_end` (track events). It travels 0.93 m, her left to her right.
  The words are scaled to that travel (x-height 6 cm). Every point of ink has a birth time = when the lead is over its letter (letters and strokes in order) and a birth place = the lead at that time;
  it relaxes into its place in the letter with a 0.17 s time constant. So the ribbon really streams from the pencil and curls into handwriting behind it. Pure function of t.
- After b117 each bead is drawn into the mote (nearest first) while the mote sits over her two open hands (`hold(t)`), then the mote follows `lightAt(t)`.
- Her light's path `K.shared.actD.lightAt(t)` (also `K.shared.lightAt`, which 15_map draws): hands → east, slowly → bends south-west over the roads → over the merge → east along main → main-Jade's hands on b129.

## The end of her road (a local override, please read)
The `violet` take looks to her LEFT at the glow (yaw +75°), lets the light go to her left, and seated looks up to her right. The world's violet road ends heading north-east, which puts
her gaze on the empty north. 11_violet therefore draws its own last ~500 m of that road: it keeps bending right and arrives at the same end point (`VEND`) heading 19° east of due south
(straight at CATCH). Then her left is due east (the dawn), main is ahead of her, and her seated up-right look is the sky over the root. The world's own violet road is drawn only up to the
junction (`world: { violet: { head } }`). The map (seq 15) still shows the world's version; it differs by at most ~55 m near the end, the end point is the same.
To make the world agree, replace the tail of `vpts` in `world.js` with the points `11_violet.js` builds (`pts`), or ask me.

## Shared / engine changes
- `fable/show/cast.js` `inst()`: `actor.set({ pencil: 'hand' | 'gone' })` selects the figure variants `bun_write` / `bun_one`. Default (no `pencil`) unchanged.

## Notes for the director (performance, not camera)
- `violet` 204.3–206.6: the way down to the ground goes through a forward fold with straight legs and a roll; it reads as awkward in stills. A knees-first sit would be kinder.
- `violet` seated: she leans on her right hand with the left arm over the knee (not "arms round the knees").

## In progress / known problems
(updated at each checkpoint)
