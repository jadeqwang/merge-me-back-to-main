# Round 4, Pass X: performance and figure (tracks, `figure_anime`, seq 13, 14, 16)

Working notes (2026-11-10). Task list: `fable/NOTES_v4.md`, "Pass X". Stills / strips: `work_fable/stills/r4_X/` (git-ignored).
Status line (kept current): **item 1 done (catch ending, handover, rise, drop arms-wide) and installed; item 4 done with it; items 2, 3, 5 open.**

## How tracks are changed while the film is being rendered by someone else
`fable/tools/bake/stage.py NAME` bakes into `work_fable/tracks_x/` (validated there); `stage.py --install NAME` renames the staged files over
`work_fable/tracks/` (atomic per file; refuses a track that fails validation). A staged track is looked at in the dev reel
`work_fable/dev/reel_x.js` (git-ignored: `fable/show/reel.js` with the ANIME figure and `dir=tracks_x`, `joy=`, `hand=`):
`node fable/tools/render.mjs --show /work_fable/dev/reel_x.js --q "track=catch&cam=front&dir=tracks_x&dawn=1&joy=0.7&hand=-0.5&dist=3.6&times=232.71_234.6" --sheet 0:1:1:out.jpg:2`.
The tracks as they were before this pass: `work_fable/tracks_x/backup/` (catch, rise, drop, land, idle).

## 1. "I have become" (229.6-236.6): `catch`, re-authored from the moment her head lifts
`recipes_util.py`: `_catch_base()` is the old recipe, untouched; `catch()` keeps its frames before 9.6 s (bit-identical: 0.0 difference) and authors the rest
as eight key poses on her own stance (`key(...)`: hips, spine, head, FK arms with a wrist angle, or IK hands at the chest), run through with the new
`spline_keys()` (PCHIP on every joint's parent-relative rotation: a key is passed at speed, not stopped on; per-joint `lead`, so nothing arrives together).
- 229.6-230.4 the head comes up first, the hands loosen on the chest. 231.2 they have left it and unfold forward, palms up; she sinks 1 cm, gathering.
  231.95 the sweep, elbows leading. **232.71 open**: a soft V, wrists 13 / 21 cm above the shoulders (left / right), elbows bent 40 / 30 degrees and behind
  the shoulder line, palms forward and up, chest lifted, head tipped back 14 degrees; her weight has come onto the front (left) leg, hips 6.5 cm toward it,
  the right hip hanging, shoulders answering, the back heel 5.5 cm off the ground. The left arm leads the right by 0.09 s; hips and chest lead both.
- The hold is a phrase, not a pose: to 234.6 the arms float 9-11 degrees higher and the head comes level (she looks at us); then a breath out to 236.6:
  arms sink, elbows and wrists soften, the weight sits into the hip, the heel nearly down; a last breath in. Wander on arms / wrists / head, different on
  each side. Slowest half second after "become": 28 mm/s at the fastest joint (never frozen).
- Feet: left ankle and toe 0.00 mm of travel from 229.6 to the end; the right foot turns on the ball of the foot (toe 0.03 mm).
- Pins (track events, unchanged): impact 222.735, head lifts 229.600, open 232.710. Measured: both hands fall below 15 % of their peak speed at 232.700
  (peaks 232.08 left, 232.23 right). Join at 9.6 s: no step (max joint speed across it 0.07 m/s).
- `13_catch.js` `camC3`: through the hold (232.4 -> b137) the camera keeps coming in, 0.6 m, tilting down 2.7 degrees so her feet stay in frame.
- Face / hands are still cast.js's defaults for `catch` (eyes open from 229.6-230.3, joy from 231.3, open hands from 231.8): they fit the new timing.

### The handover (236.15-238.1; `actE_morning.js`), items 1 and 4
- The back foot STEPS (it slid 30 cm): both ankles are driven in the world and the legs re-solved (two-bone IK in the blend, knee toward the thigh's front).
  Left foot: 3.5 mm of travel on the ground over the whole handover. Right foot: lifts 7.5 cm, set down beside the left, 236.62 -> 237.12; the hips stay over
  the standing leg until it lands (236.85 -> 237.35).
- The arms come down ONCE (236.45 -> 237.95, out through the sides) and arrive at her sides at the bottom of the skip's gathering dip, which throws them up:
  one swing (it was: down by 237.35, wait, up at 237.7). Spine and head go over 236.3 -> 237.2. `handover` is now 235.9-238.3 (145 frames), played to 238.1.
- Checked by numbers with `--q "hodump=1"` (prints the made track; digits as letters because the harness drops console lines containing "404"):
  bone lengths constant to 0.3 mm, max joint speed in the blend 1.25 m/s, no spike (the first version flipped a knee for a frame: the pole is now the
  thigh's front). Checked by eye: `h1_handover.jpg`, every frame 236.0-238.2 (1/30 s): no pop of pose, hair or light across the cut on b137.

### The same pose family elsewhere
- **`rise` (118.4-124)**: was one symmetric shape with locked elbows, and the arms RESTED level (a T) at 121-122.5. Now the right arm reaches higher on the
  accent, elbows soft, a small turn of the chest and head; on the way down the elbows lead and pass the level at about 120.7 with the hands trailing above
  them, and she rests lower, half folded like wings (121.75), then down. Accent event 118.387 unchanged; frames before 117.4 and after 124.7 unchanged.
- **`drop` b100.1 (172.300) and `drop_join`**: `stand("open")`: arms a little above and behind the shoulder line, elbows unlocked, palms standing, chest
  lifted, eyes up; through the bar it keeps opening (`"open2"`, wrists 7 -> 11 cm above the shoulders) until the next phrase takes it. Still a unison snap
  (arrives 172.300, same frame as before). Only 172.14-173.89 changed; everything else in both tracks is bit-identical (checked against the files on disk
  before installing: an unchanged re-bake gives 0.0 difference).

## Outputs so far (git-ignored)
`work_fable/stills/r4_X/`: `c1_front.jpg`, `c2_pose.jpg` (reel: front / side / three-quarter of the new ending), `f1..f3_film*.jpg` (the film's camera, with the
zoomed face strip), `h1_handover.jpg` (1/30 s), `r1..r3_rise*.jpg`, `r2_rise_drop.jpg`.
