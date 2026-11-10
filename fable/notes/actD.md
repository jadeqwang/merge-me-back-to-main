# Act D — seq 11 violet, 12 flight, 13 catch (180.99–236.64, 3:01–3:57)

Files: `fable/show/seq/11_violet.js`, `12_flight.js`, `13_catch.js`, `actd_hand.js` (her handwriting). Shared: `fable/show/cast.js` (one additive option).
Status: reworked, first complete pass (2026-11-10). Judged on stills and contact sheets, NOT watched in motion.
Sheets: `work_fable/stills/actD/sheet_actD.jpg` (every 2 s), `clip_sheet.jpg` (every 1 s, from the clip), `k1..k9.jpg` (key moments). Clip: `work_fable/out/actD.mp4` (720p, audio, 180.5–237.2).

```
node fable/tools/render.mjs --show /fable/show/main.js --res 1280x720 --sheet 181:237:2:work_fable/stills/actD/sheet_actD.jpg:7
node fable/tools/render.mjs --show /fable/show/main.js --res 1280x720 --from 180.5 --to 237.2 --mb 2 --workers 3 --audio --crf 18 --mp4 work_fable/out/actD.mp4
# fast iteration (7 s start-up): --q "tracks=violet,catch,idle,run_loop,sprint_loop,sit_idle,walk_loop"
```

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

## The fold (12_flight.js `crowd`, 13_catch.js)
- The thousand stand in arcs behind main-Jade (5 m to ~50 m), an aisle left along main so she is clear against the sun.
- The violet ripple leaves her at 30 m/s on the hit: as it passes, a copy's accents turn violet and a violet light shows at her chest for 0.9 s.
- They fold home nearest first: 1, 2, 4 ... 512 on ten successive beats, b130.1 (224.47) to b132.2 (228.38): the doubling of the intro run backwards. HUD: 1,024 -> 1,023 -> 1,021 ... -> 1 branches.
- Each copy sprints for home at a legal gait (`K.gait(5.6)`, at most 2.6 s), and 0.5 s before her beat she lets go of her body and is a light in her lane colour that reaches
  main-Jade's hands exactly on the beat. Nobody skates; nobody covers 75 m in a second as a body.
- The note stays lit between her hands (`held(t)`), moves into her chest as her head lifts, and goes out into her own colour between "life" and "become".
- Colour: `env.figLight` runs from the sunrise silhouette key to the day key with `ss(t, 229.63, 232.71)`; ink outline with it; `dawn` 0.63 -> `world.dawn(b137)` (0.86) by 236.64.

## Known problems (timestamps)
- 3:24.3–3:26.6 the way she gets down to the ground (performance, see above). The camera stays wide of it; a kinder sit would let the shot be closer.
- 3:24–3:27 the mote passes through the lyric "who I'll be again" on its way out (same part of the sky). I left it: the words hang where it is going.
- 3:08–3:14 the far lights are a faint row of dots and the warm band in the east is subtle (sky model at dawn 0.12); it reads at 1080p, less so on a phone.
- 3:29–3:31 in the wide, the commit dot at the road's end is nearly as bright as her own light; they sit together as one glow with a reflection.
- 3:37–3:41 after the merge the frame is one comet and one road for ~3 s; the people on main are not readable before the cut to them at 3:41.0.
- 3:41–3:42.7 the sun is already half up before the hit (dawn 0.42 -> 0.5); it "breaks" more on the hit but is not hidden before it.
- 3:45–3:48.4 the far rows wait standing until 2.6 s before their beat, and the last 512 arrive mostly as a field of lights, not as runners.
- 3:48.4–3:49.7 one bar of an almost empty wide (she is small, alone, the sun). Meant as a breath; may read as a hole.
- 3:56.6 cut to 14_day: she is fully day-lit here by `figLight` while the sky is at dawn 0.86. If 14 keeps the default light at dawn 0.86 she darkens a little at the cut:
  raise the world's `DK` key at `bar(137)` to 1.0, or let 14 start with the day key.
- The road's end drawn here differs from the world's (see above); the map shows the world's.
- Lyric reflections in the mirror are on in A, B, D (off in C and the flight where they cluttered the frame).
- Motion not reviewed: the chase camera in F1/F2 follows a pchip path (speeds 130–230 m/s between keys) and banks up to 9 degrees; check it for lurches in the clip.

## Also touched
- `fable/engine/src/roads.js` line 164 (another agent's uncommitted edit had a `//` comment in the middle of the line that commented out `let s = ...` and broke every render):
  changed to a `/* */` comment, nothing else. Left uncommitted with their changes.
