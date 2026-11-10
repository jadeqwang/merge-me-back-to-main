# Director's notes on v1 (first full cut with the real figure)

v1: `work_fable/out/v1.mp4`, sheets `work_fable/stills/v1/sheet_1..3.jpg` (one frame per 2 s). Integration notes: `fable/notes/I1_integration.md`.
Performance notes (best yaws, cameras, figure variants): `fable/notes/P1_qa.md`.
The structure works. What follows is what each act must fix. SPEC §2 rules are binding; the ones v1 breaks most:
subject at least 1/3 of frame height in any shot about her; no frame mostly empty or mostly black; one focal point; type never on a figure.

## Global (whoever touches the shared file fixes it once, additively)
- HUD is unreadably small: 30 px mono at 1080p, top-left, with a little more weight. Branch count stays in the HUD.
- Commit nodes under her feet are huge glowing donuts: radius ~0.35 m, thin ring, modest glow. They are punctuation, not props.
- The white-hot horizon band of streaked lights (verse 1, pre-chorus, chorus 1) overpowers everything: distant branches are small bokeh
  dots with short trails at most; total horizon brightness well under the figure's accents.
- Speed must match the gait: `run_loop` 3.42 m/s, `sprint_loop` 4.93 m/s, `walk_loop` 1.14 m/s (track `meta.speed`). Move her at that speed
  or play the loop faster/slower by at most 15%. No skating.
- Figure light at night: for violet use `env.figLight = { under: 0.4, fibres: 0.8 }`.

## Act A: seq 01-04 (0:00-1:10) intro, tree, verse 1, pre-chorus
- 0:00-0:04 good (3/4 back, standing at the root, RARE EARTH between the parted hair). Hold her a touch larger.
- 0:04-0:14 after the first fork the frame empties (two roads, nobody). Keep the people: the two walk off on diverging roads as the camera
  cranes up and back; each forks again on b5 (4) and b7 (8), visibly (two figures stepping apart, a node lighting, roads written behind
  them). Cut to the top-down tree on the b9 hit (14.04).
- 0:14-0:28 tree + MERGE: keep. Add a large live counter (mono, cap height ~70 px, lower right): `16 branches` ... `1,024 branches`, changing on the bar lines exactly when the tree's tips double.
- 0:28 "I split myself a thousand ways": the split must happen ON "split" (28.62): one runner becomes two, then four on "thousand" (30.29).
- 0:34 "Down every road the night could hold": she should be about half the frame height, side tracking; a few other runners readable in the middle distance on their own coloured roads; calm horizon.
- 0:42 "Each one a light I sent ahead": one clear orb leaves her hands on "light" (43.33) and runs ahead along her road, lighting its text as it goes. The wide shot at 0:46 is a tangle: make it an orderly fan of comet-headed roads racing away from camera toward the east.
- 0:48-1:00 the lives (four in verse 1, four in the pre-chorus): each is a clean one-bar vignette: her at ~half frame height, her road in her lane colour with its commit message readable, the HUD chyron `jade/piano`, a dark calm background, and ONE simple prop drawn in light lines (piano: bench + keyboard edge; violin + bow; poet: notebook on the knee; nasa: horizontal wind streaks; band: guitar; stage: a cone of light and a mic stand; home: a little orrery, a sun and two orbiting dots she points at; wushu: none). Prop positions are in each life track's `meta`. No floating piano. Every life's look-back starts on "remembers" (57.03).
- 1:02 "Where I started from": keep the pulses running home down the tree; the dive along main (1:06-1:09) needs something to dive toward: the root node glowing, growing.

## Act B: seq 05-07 (1:10-2:05) chorus 1, float, download + rise
- 1:10 "Merge me back to main": low wide heroic shot, she sprints TOWARD camera, hair streaming, large in frame; other runners converge from the sides behind her. Not a small pale figure on a white band.
- 1:16 "Every road I ran becomes the one": currently thin lines on black. High angle, bright and rich: runners as lights with tails braiding into main, merge nodes flashing 8-4-2-1 on the beats, main thickening and brightening as each joins.
- 1:24 "Fold me in again": the side view with the fan of afterimages is right: make the copies large, each in its lane colour, folding into her one per beat.
- 1:30 "Nothing that I lived can come undone": the crane leaves only her head. She stops on the 89.80 hit and looks back; frame her from the front-quarter, waist-up to full body in the right third, with her road running back to the horizon behind her and its commit nodes locking on one by one down the road through the long "undone".
- 1:38-1:58 float: the hair-into-roads image is the heart of the film; it is static for 20 s. Start close (she fills the frame, hair fanned on the water), then rise and rotate slowly so the strands are revealed becoming roads. "Branch and wander": strands branch outward. "Merge and return": pulses travel home. The text streams (1:52+) are good.
- 2:00 rise: keep (arms open against the horizon of roads).

## Act C: seq 08-10 (2:05-3:01) build, coil, drop
- 2:05 show the landing: close, low, on the impact (125.343), then `build`.
- 2:06-2:12: hero LARGE centre front (60% of frame height), frontal and symmetric; copies peel out of her on each bar (fast, with a trail, then locked in a wedge); camera eases back to reveal the wedge growing 1-2-4-8-16.
- 2:14-2:18 side truck: closer on the front row; kicks read in profile.
- 2:20-2:26 pure top-down on flat blue with specks: replace with a high oblique crane (about 40 degrees down) travelling over the formation toward the eastern glow, bodies clearly bodies; the grid opening into rings should be the event.
- 2:28-2:32 rings and the sun's rim: keep.
- 2:33 drop: b89-92 the hero is SOLO, low wide lens, big in frame, butterfly apex inside the sun disc on 153.169 (yaw per `meta.best_yaw`); the thousand stay in the coil as a low frieze behind her and join in unison on b90.1.
- b97 the fall: a fast ripple outward from the hero (hero on 167.082, last row within 0.4 s), then all still. Top-down MAIN: the ground should be the gold-rose mirror, not flat salmon; bands glowing. Then the rise (b98-99) and arms wide (b100).
- b104 salute: cut to the sun side looking back at them: the first time we see the troupe lit, gold, not silhouettes (`meta.salute_yaw`).
- Per-copy timing variance 25 ms at most. Copies must not slide while performing.

## Act D: seq 11-13 (3:01-3:57) violet, flight, catch
- 3:02 run: bigger in frame.
- 3:08 "Back to the place where I began": she must be looking at something: a faint warm glow and a few far lights on the eastern horizon where main is, in frame.
- 3:16 the writing: the line of light must come from the pencil tip (`fig.body.pencilTip`, variant `bun_write`), forming `docs: start here` along her hand's path as she writes; not text popping up beside her.
- 3:22 release: good. Then HOLD on her sitting down, at peace, looking up (3:24-3:27) before the crane up; as `ctx` reaches 100% her body dims to its accents and she stays as a small steady light.
- 3:30-3:39 flight: make the comet clearer (violet head, long tail), dawn growing ahead of it.
- 3:50 "Every life I've lived I have become": type is touching her arm and head: move it; this is where she turns to full colour for the first time (by 3:56).

## Act E: seq 14-16 (3:57-4:42) day, whole-film map, terminal
- 3:58-4:16 day: she is small on empty white. Low angle, she is large and dancing (`free`), blue sky, ink roads; then the forks; then the pull-back should reveal abundance: dozens of new branches fanning east in ink colours with runners on them, the tree again but by daylight.
- 4:18 map: keep; labels larger (24 px+).
- 4:26 terminal: text is tiny. Six log lines at 30 px+, the two commands larger still, credits readable; figure on the right. Last frame matches frame 0.
