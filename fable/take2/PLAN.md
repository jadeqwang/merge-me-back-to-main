# Merge, take two: plan and handoff (written 2026-11-13)

For Jade, and for the next Claude session. This is the plan for rebuilding the "Merge" video after the review of 2026-11-13 and the
26-second proof she approved ("a huge improvement"). Read this first; then `fable/proof/NOTES.md` (how the proof compositor works) and
`analysis_v3/NOTES.md` (the timing map). `fable/HANDOFF.md` and `fable/SPEC.md` describe the code-drawn cut (v7) that this builds on.

Nothing in this plan has been generated yet except the proof. Paid generation needs Jade's go-ahead on the budget in section 8.

## 1. Where things stand

- **v7** (the code-drawn Fable cut) is finished but not at the standard of the shipped films. Measured against them it has one place
  for 4:42, no hand-made material, about a third of their cut rate, a procedural figure that reads as a CG toy when large, a peak at
  2:45 followed by a two-minute wind-down, and Jade's real lives reduced to small labels.
- **The song changed.** Current audio: `inputs/Merge (keychange down).wav` (282.8 s, A minor, tempo drifting from 137.8 to about
  141 BPM). Timing map: `analysis_v3/timing.json`. v7 is timed to the old audio and has not been re-timed.
- **The proof** (`review/fable_proof/`, code in `fable/proof/`) is bars 28 to 43 built the new way: her lives as illustrated plates,
  one medium per life, with type, lanes and the graph drawn in code. It cost about $21.5.
- **Budget:** $363.83 of the $600 cap is used; about $236 is left.

## 2. The idea

The song is one self splitting into branches and merging back. The film shows that with drawing itself.

1. **A branch is a medium.** Each of her lives is drawn in its own hand-made medium and carries its own lane colour.
2. **Main is the character sheet.** The merged self is the clean cel-anime Jade of `inputs/character_sheet.png`, on the orange lane.
3. **Merging is mediums folding together.** When branches merge into her, their mediums show in her. At "Every life I've lived, I have
   become" she is drawn in all twelve at once, and then they settle into one clean, fully coloured Jade in daylight.
4. **The world is still a git graph.** Lanes of light, commit nodes, branch chips, the doubling counter, the whole-film graph and the
   terminal ending stay, drawn in code.
5. **Main is reality.** On the outro drop the drawing becomes Jade herself (her traced likeness), singing "Back to main". This is the
   idea from her own v6 treatment, done without filming.
6. **The film is a loop.** Frame 0 is the child's palm on the frost window. The last image is the same window, with the light the
   violet branch sent home showing up in the frost.

### The look (agreed with Jade, 2026-11-13)

What works in the proof and is kept:

- **The medium means something.** Each life is drawn the way that life drew or recorded itself: the neuron lab as a histology plate,
  the PhD on chart paper, the band as a gig poster, the violet branch as scratchboard (white cut out of black: you see a branch by
  its own light).
- **The jacket is the logo.** White takes any medium; the blue circle and RARE EARTH read at once in all twelve. That constant is
  what lets the styles vary.
- **Paper.** Light grounds and visible paper, so the film looks made by a hand and the night sections mean something.

What changes from the first proof:

1. **Colour restraint; colour is the merge variable.** A branch is one medium on a near-monochrome ground, with its lane colour as
   the only strong colour (bands, straps, headphones, the lane, at most one object). Only the merged Jade gets every colour. Full
   colour is held back until "Every life I've lived, I have become" and the day that follows, so it is earned, as in Rewind. The
   sunrise drop is two colours, gold and black. (The wind tunnel and the hacker house were restyled this way on 2026-11-13; the
   home plate is still multi-colour crayon and should follow.)
2. **Main gets a material.** No neon tubes and no gradient sky. Main's world is drawn on paper as in Orbital Sunrise: black paper
   for night, white paper for day. Main Jade is the sheet's flat cel with an inked line, on that paper, with light drawn as strokes.
3. **The lanes are written.** A lane is a line of text in its colour: a thin bright line from far off, readable commit messages up
   close, written under her feet as she runs. Sparse text, then dense, then solid colour at the merge: v6's rule that density is
   how merged she is.
4. **Drawn things move on twos.** Plates are stepped to 12 frames a second in the compositor so they read as drawn and lose the
   video model's smoothness. The machine layer (type, lanes, chips, graph) stays on ones. To be tested first; it is free.
5. **v7 renders are never shown raw.** Every V7 source in the shot table goes through a paper pass in the compositor (line and
   tone redrawn on black or white paper), the way Orbital redrew its plates in pencil. Silhouettes and crowds suit this.

Glyph (text) art, after the ASCII reference in `inputs/mmorpg_ascii.png`, v6 and the Opus cuts:

- **Use it where the text is true:** the build's `git log` with her real commit messages; the written lanes; the download in the
  breakdown (memory arriving along each strand as readable lines); the open-source life, rendered by the engine's real glyph pass
  (v6's `engine/src/textlook.js` on branch `claude/v6-text`) instead of the image model's imitation, so every character is real.
- **Keep it alive, as in the reference:** colour from the lane palette, depth, motion.
- **Do not use it** for her face or body (it costs the likeness), as a skin over everything, at sizes a phone or X's compression
  turns to mush, or as falling columns of characters.

## 3. Rules (binding)

From the shipped films, Jade's recorded notes, and the proof.

1. Every sung line gets its own picture or pictures. Target 180 or more shots. No composition held longer than about 6 s outside the
   breakdown and the end card.
2. A strong image inside the first 3 seconds, readable with the sound off. First face by 10 s.
3. Cuts and events land on measured bars, beats and word times from `analysis_v3/timing.json`. Never constant-BPM arithmetic: the
   tempo drifts.
4. The cut rate rises into the drop; the last chorus and the outro must top the drop, not coast after it.
5. Every lyric is on screen while it is sung, word by word on the word times, set in the world. No punctuation. At least 0.6 s per
   word. Never over a face or hands. Sizes at 1080p: verse lyric cap height 64 px or more, chorus slab 100 px or more, chips and
   labels 24 px or more.
6. No text drawn by an image model is shown. Screens, whiteboards, sheet music titles, clocks and handwriting that can be read are
   drawn in code or painted out. (The first proof broke this in the open-source and hacker-house plates; the corrected plates leave those screens empty for the code to fill.)
7. True when paused: commit messages, dates, counts, the clock at 10:30, a legal orchestra seating, a real wushu stance.
8. Costume audit on every plate and clip: round `1420 MHz` patch on her LEFT upper arm only; the jacket BACK is plain white with
   only the pale-blue circle and `RARE EARTH` (no band or stripe across the back: Jade, 2026-11-13); one band across the front of
   the chest and one round each upper arm; bands, straps and headphones in the branch's lane colour (orange for main); headphones
   round the neck unless the scene says otherwise.
9. Her kids are never photo-referenced and their faces are never shown. In the home plate they are seen from behind (Jade,
   2026-11-13): an older boy of seven with dark brown hair and a younger girl of four with light brown curly hair.
10. Nothing frozen: every shot has movement, from its first frame.
11. Anime Jade never lip-syncs (mouth closed, as in Rewind). Only her traced likeness sings, in the outro.
12. Expression: calm, hopeful, "never an ad smile". The look-back is a quiet look of recognition.
    One face in every medium: the character sheet's face (oval, tall clear forehead, centre parting with no fringe, large very dark
    eyes, soft straight brows). The medium changes the rendering, never the features. Jade as a child: hair half up and half down
    with side-swept bangs.
13. Tone: tender, euphoric, epic. No fear framing.
    Style rules are in "The look" above and are binding: one strong colour per branch, written lanes, paper, drawn things on twos,
    no raw v7 renders, no glyph faces.
14. Public repo: code and docs only, plus review videos under `review/` (each under 100 MB). Never print or commit the values in
    `work/cf_account_id.txt` and `work/gen_kv_ns.txt`; grep the outgoing diff before every push. Never deploy or touch Workers or KV.
15. Jade's details are private in any request to an outside service. Her own photos may be sent to models; her kids' photos never.

## 4. What is kept, and from where

| Kept | From | Use in take two |
|---|---|---|
| The twelve life plates, the grid, the simultaneous look-back, the merge home, the chorus hero | proof | bars 28 to 43, with fixes (section 6) |
| The child at the frost window, the doubling counter 1 to 1,024 | Jade's idea, Opus cuts | cold open and last image |
| Top-down tree of lanes with the MERGE title | v7 0:14 | intro, bar 9 hit |
| Hair as roads, seen from above | v7 1:44 | breakdown, rebuilt as a plate with code-drawn lanes |
| `git log` racing on the beat | v6 | build |
| The 1,024 in silhouette at sunrise, the kick against the sun, MAIN spelled by bodies, the salute | v7 2:32 to 3:00 | the drop, re-timed, with new close inserts |
| The violet 1420 MHz branch, `docs: start here` written in light, the context meter | Opus cuts, v7 3:16 | verse 2, in scratchboard |
| The catch, the fold (one hand reaching to the lens) | Opus v4, v7 | choruses |
| "Main is reality" | Jade's v6 treatment | outro drop, with her traced likeness |
| The whole-film graph, the terminal with the real `git log`, credits as commits | v7, Opus | ending, shorter and larger |
| Banach-Tarski split | Rewind, v7 | "I split myself" |

Dropped: the procedural figure whenever she is large and lit; the Seedance hybrid as proposed on 2026-11-10 (it added a third look
and did nothing at night); the empty day world; the 18-second terminal ending; small road text.

## 5. How it is built

**Everything is a plate, and the code draws on top.** The proof compositor (`fable/proof/`, Canvas 2D, a pure function of song time)
plays image sequences full-frame or in panels and draws lanes, chips, lyrics, the graph and paper grain over them. Take two extends
it into `fable/take2/` and feeds it six kinds of source:

| Code | Source | How it is made |
|---|---|---|
| P | plate: a still plus a 5 s clip | still from Nano Banana Pro with the character sheet as the only reference; clip from Seedance 2.5 image-to-video at 720p |
| S | still moved in code | Nano Banana Pro still; push, parallax or wipe in the compositor |
| K | cut-out layer | a P plate on a flat ground, matted with BiRefNet (`fable/tools/hybrid/`), composited over a code-drawn or painted ground |
| V7 | a v7 engine render used as a plate | v7 sequence rendered through the old-to-new time map, with its own lyrics and HUD switched off |
| L | Jade's traced likeness, singing | a still of the Orbital Sunrise selfie-art plus the song section, to a video model (as Orbital and Moongazing did) |
| C | drawn in code in the compositor | type, lanes, nodes, chips, counters, graph, terminal, grain |

Work needed in code before any section can be finished:

1. **Promote the proof compositor** to `fable/take2/`: a shot list file (JSON or JS) instead of the hard-wired proof edit; each shot
   names its bars, source, layout, lyric position and overlays. Keep the proof's checks (`tools/check.py`): cut error in frames,
   single-frame identity, text sizes.
2. **v7 as plates.** Add a time map to the v7 harness (`fable/tools/render.mjs`): for each output frame at new time t, render the show
   at the old time from `analysis_v3/warp_v2_to_v3.json` (piecewise linear between beats; speed change under 2.5%). Add query flags
   to hide v7's own lyric type and HUD. Render the needed sequences to frame folders.
3. **Cut-outs.** Reuse the matte step of `fable/tools/hybrid/hybrid.py` for K layers; check it on pencil and pixel-art figures.
4. **Medium overlays for merges.** A small set of compositor effects that lay a medium over part of a plate inside a mask (pencil
   hatch, halftone, woodcut grain, pixel blocks), for the moments when a branch's medium "shows" in main Jade.
5. **Code-drawn readable text** over plates: terminal on the open-source stage screen, the handwriting `docs: start here`, the wall clock.
6. **Use `still.jpg`** (the 2K still) for near-static full-frame shots so they are sharper than the 720p clip.
7. **Written lanes.** Replace the proof's solid lane lines with lines of set text (mono, lane colour) that hold up from thin line to
   readable words, on straight lanes and on the merge curves.
8. **On twos.** A per-plate hold so drawn sources update at 12 fps while overlays stay at 30.
9. **Paper pass for V7 sources** (and the black-paper and white-paper grounds for main's world).
10. **Glyph pass.** Port v6's `textlook.js` so a plate can be rendered in real characters (the open-source life, the build).

Generation tooling (unchanged from the proof): `fable/proof/gen/gen_stills.py` (stills through `tools/gen/cf.py`), `gen_clips.py`
(specs) and `tools/gen/gen.py submit|wait` (video queue), `intake.sh` (frames, meta, review strip). Run with
`/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python`. Every call is logged to `docs/spend_ledger.jsonl`; commit it after
each run.

## 6. Shot table

Times are seconds in the new audio (`analysis_v3`). `b17` means bar 17; a bar is about 1.72 s. Source codes as in section 5.
Read the table with "The look" in mind: every lane is a written line, every V7 source goes through the paper pass, main's world
is black paper at night and white paper by day, and full colour waits for the end of chorus 2.
"exists" means the proof already has it. New plate names are working ids.

### Intro A: bars 1-8, 0:00-0:14 (pads and arp, no drums)

| Bars | Time | Picture | Source |
|---|---|---|---|
| b1-2 | 0.2-3.7 | Frame 0, no fade-in: the child's palm on the cold glass, frost already branching from it. Chip top-left: `● main  1 branch`. | P `root` (exists; start mid-growth) |
| b3-4 | 3.7-7.2 | Close on the glass: the frost forks in two, then four, on the bar lines. Counter 2, 4. | P `root_fork` (new) |
| b5-6 | 7.2-10.7 | The child's face in profile, lit by the frost, watching. First face. Counter 8, 16. | P `root_face` (new) |
| b7-8 | 10.7-14.2 | Pull back: the frost tree fills the pane; its tips take lane colours one by one. Counter 32, 64. | P `root` wide + C |

### Intro B: bars 9-16, 0:14-0:28 (kick hit, rolling bass)

| Bars | Time | Picture | Source |
|---|---|---|---|
| b9 | 14.19 hit | Match cut, frost tree to tree of light seen from above. Title MERGE. Counter doubles each bar to 1,024 by b15. | V7 seq 02 + C |
| b10-14 | 15.9-24.6 | The tree grows east. On beat 3 of b11, b12, b13, b14 a one-beat flash of a life plate (piano, wushu, wind tunnel, the dish): what the lights are. | V7 + P (exist) |
| b15-16 | 24.6-28.1 | Swoop down the trunk to ground level. Last two beats: adult Jade from behind at the root, palm raised exactly like the child's. | V7, then P `main_palm` (new) |

### Verse 1: bars 17-32, 0:28-0:56

| Bars | Time | Lyric | Picture | Source |
|---|---|---|---|---|
| b17 | 28.09 hit | I split myself (28.68) | Close three-quarter on her face, eyes open, calm. | P `main_face` (new) |
| b18 | 29.8 | a thousand ways | She steps apart into two, then four (Banach-Tarski: each keeps a whole body). The copies' bands take lane colours. | P `main_split` (new) |
| b19 | 31.6 | | From above and behind: eight, sixteen, more run out along their lanes. | K runners + C, or V7 seq 01 |
| b20-23 | 33.3-40.2 | Down every road the night could hold (33.65) | Four crossings, one per bar: a cel-drawn branch-Jade runs her lane toward a doorway of light; as she crosses, the whole picture turns into her medium. Wushu (woodblock), neuron lab (ink), wind tunnel (painting), hacker houses (pixel). | P `cross_*` (4 new) wiped by C into the life plates |
| b24 | 40.2 | | The fifth road has no doorway: the violet one runs out into engraved dark, and she keeps going. | P `cross_violet` (new) |
| b25 | 42.0 | Each one a light (42.40) | Close on cupped hands; a light kindles. | P `main_light` (new) |
| b26 | 43.7 | I sent ahead | She opens her hands; the light leaves along the lane. | P `main_release` (new) + C |
| b27 | 45.5 | | The light races down the rose lane and becomes the lamp in the piano room. | V7 lane shot, match cut |
| b28-32 | 47.2-55.9 | Each one a story to unfold (47.64) | Ten lives, one plate each, 4, 4, 2, 2, 2, 2, 1, 1, 1, 1 beats: piano, violin, wushu, neuron lab, PhD, poet, wind tunnel, band, hacker houses, open source. Lane line and chip on each. | P x10 (exist) |

### Pre-chorus: bars 33-40, 0:56-1:10

| Bars | Time | Lyric | Picture | Source |
|---|---|---|---|---|
| b33-36 | 55.9-62.8 | And every branch remembers (54.77) / Where I started from (60.00) | The twelve-panel grid assembles, one panel per half beat; home and the violet branch join. Lyrics in the strip under the grid. | P x12 (exist) + C |
| b37 | 62.77 hit | from (held) | Every life turns her head to look back at the same instant. Hold the bar. | exists |
| b38 | 64.5 | | The twelve lanes merge into main, column by column, and the view travels home along it. Fix: fill the empty top half (let each panel's last frame trail behind its lane as it shrinks). | C (exists, revise) |
| b39-40 | 66.2-69.7 | | The root node opens onto the child at the frost window; riser. | P `root` (exists) |

### Chorus 1: bars 41-56, 1:10-1:37 (stripped; hit on b41)

| Bars | Time | Lyric | Picture | Source |
|---|---|---|---|---|
| b41-42 | 69.72 hit | Merge me back to main (69.45) | Main Jade sprints at us on the orange line as the coloured lanes join it. Slab type. | P `hero` (exists) |
| b43 | 73.2 | | Side-on: the twelve run in parallel on their lanes, each drawn in her own medium, main in front. | K runner kit (13 new) + C |
| b44 | 74.9 | | Low and close: her trainers strike the orange line. | P `hero_feet` (new) |
| b45 | 76.7 | Every road I ran (75.76) | From above: the lanes braid into one. Slab type. | V7 1:16-1:20 |
| b46-47 | 78.4-81.9 | becomes the one | Runners fuse in pairs, eight to four to two. Where pencil-Jade and gouache-Jade merge, the new runner is half and half for a beat, then whole. | K + C medium overlays |
| b48 | 81.9 | | One runner: main Jade, the others' mediums flickering across her jacket. | K + C |
| b49-50 | 83.6-87.1 | Fold me in again (83.55) | Close: she reaches one hand to the lens, then draws it back. | P `fold_reach` (new) |
| b51-52 | 87.1-90.5 | | Hands crossed at her chest; a fan of twelve afterimages, each in a medium, folds into her one per beat. | P `fold_chest` (new) + K |
| b53 | 90.5 | Nothing that I lived (89.43) | She stops and looks back over her shoulder: the same look as the lives'. | P `look_back` (new) |
| b54-55 | 92.3-95.7 | can come undone | Wide: every road still glows to the horizon; along them the twelve worlds as small lit windows; commit nodes lock on, one per beat. | V7 night world + plate thumbnails + C |
| b56 | 95.7 | undone (held to 98.98) | Her from behind before the whole lit continent. Slow pull-out. | P `main_back_wide` (new) |

### Breakdown A: bars 57-64, 1:37-1:51 (crash on b57, strings)

| Bars | Time | Lyric | Picture | Source |
|---|---|---|---|---|
| b57-58 | 97.46 crash | | From above: she floats on her back on dark water, hair fanned out; each strand continues as a coloured lane to the edge of frame, with its branch name. | P `float_top` (new) + C |
| b59-60 | 100.9-104.4 | Branch... and wander... (102.52) | Close on her face, eyes closed, water lapping. Then back above: the strands branch outward, doubling. | P `float_face` (new), C over `float_top` |
| b61-62 | 104.4-107.8 | | Slow rotation and pull-out; along one strand a life window glides past. | C |
| b63-64 | 107.8-111.3 | Merge... and return... (109.31) | Pulses of light come home along every strand. Her hand opens on the water as one arrives. | C, P `float_hand` (new) |

### Breakdown B: bars 65-72, 1:51-2:05 ("Ahh"; hats, snare crescendo from b68, roll in b72)

| Bars | Time | Picture | Source |
|---|---|---|---|
| b65-68 | 111.3-118.2 | The download. One detail per beat, each in its medium: fingers on keys, bow on string, a fist, a pipette, a pen trace, typewriter keys, a fan blade, a guitar pick, laptop keys, a lectern, a grapefruit by a lamp, a pencil in a bun. Every fourth beat, her face (eyes moving under closed lids). | S `det_*` (12 new), P `float_face` |
| b69 | 118.21 leap | She rises upright out of the water, arms opening; the first band of dawn. | P `rise` (new) |
| b70-71 | 119.9-123.4 | The details again, two per beat, new crops; white flashes on the snare. | S (reuse) |
| b72 | 123.4 roll | All twelve tile in on sixteenths and collapse to a point. | C |

### Build: bars 73-88, 2:05-2:33 (biggest impact on b73; four on the floor; no vocal)

| Bars | Time | Picture | Source |
|---|---|---|---|
| b73-76 | 125.13 impact | `git log --graph` racing on the beat, with her real commit messages: 2, 4, 8, 16 rows per beat. On each bar line a one-beat impact frame of cel Jade in a long-fist stance (bow stance punch, horse stance, empty stance, drop stance), rim-lit, blue hour. | C + S `stance_*` (4 new) |
| b77-80 | 132.1-139.0 | Frontal formation: she forks on every kick, 1 to 256. Cut on every bar; stance frame on beat 3. | V7 seq 08 + S |
| b81-84 | 139.0-145.9 | 1,024 from above, grid to rings; two shots per bar, above and side. | V7 seq 08 |
| b85-88 | 145.9-152.8 | Bass out in b86, snare build: all drop into a low stance; the view skims east; one cut per beat in b87, two per beat in b88 (three-frame flashes of the twelve life plates); the sun's rim. | V7 seq 09 + P (exist) |

### Drop: bars 89-104, 2:33-3:00 (the style flip: night to sunrise, full colour)

| Bars | Time | Picture | Source |
|---|---|---|---|
| b89 | 152.79 drop | Butterfly kick at its apex against the huge sun. | V7 2:32 |
| b90-92 | 154.5-159.7 | The unison phrase, low and wide, the thousand in silhouette. Two-beat close inserts of cel Jade in the phrase's key poses, lit gold. | V7 seq 10 + S `drop_hero_1-3` (new) |
| b93-96 | 159.7-166.6 | Travelling phrases; the close line of copies; orbit. One cut per bar plus inserts. | V7 2:52 |
| b97-99 | 166.59 | The group fall, from her real set. From above the bodies spell MAIN; hold; they rise as one. | V7 2:44 |
| b100 | 171.8 ("ooh" 172.5) | Arms wide. Close: her face in the sun, eyes closed, breathing. | V7, P `drop_face` (new) |
| b101-103 | 173.5-178.7 | Last phrase, tornado kick, landing. | V7 + S `drop_hero_4-5` (new) |
| b104 | 178.7 fill | 1,024 salute the sun. Cut to night on b105. | V7 |

### Verse 2: bars 105-120, 3:00-3:28 (the violet branch; scratchboard, white on black, violet the only colour; drums out after b117)

| Bars | Time | Lyric | Picture | Source |
|---|---|---|---|---|
| b105-106 | 180.38 impact | This branch may never find the way (181.40) | A tiny figure on a violet lane under an engraved Milky Way. Chip: `● jade/1420-mhz  ctx 97%`. | P `vio_wide` (new) |
| b107-108 | 183.8-187.3 | | Side medium, walking; then her profile, the bun and two pencils. | P `vio_walk`, `vio_close` (new) |
| b109-110 | 187.3-190.7 | Back to the place where I began (187.63) | She stops and looks back east: far off, a sliver of sunrise in full colour. | P `vio_lookback` (new) |
| b111-112 | 190.7-194.1 | | She climbs to the rim of the dish and sits. | P `vio_climb` (new), P `violet` (exists) |
| b113-115 | 194.1-199.3 | And maybe something that I learned (194.74) | She draws a pencil from her bun and writes in the air. The handwriting `docs: start here` is drawn in code, in violet light. ctx 99%. | P `vio_pencil`, `vio_write` (new) + C |
| b116-117 | 199.3-202.7 | Comes home to who I'll be again (200.00) | She lets the line of light go; it lifts off east. Hit on b117, then the drums cut. ctx 100%. | P `vio_release` (new) + C |
| b118-120 | 202.7-207.8 | | She sits, hands in her lap; the lines of her figure settle into the star field. Chip: `detached, not merged`. The stars keep twinkling. | P `vio_still` (new) + C |

### Chorus 2: bars 121-136, 3:28-3:55 (new in this audio: a hit with bass on b121; hit on b129; bass out b133; riser b135-136)

| Bars | Time | Lyric | Picture | Source |
|---|---|---|---|---|
| b121 | 207.82 hit | Merge me back to main (207.58) | The violet light streaks east over the night continent of roads. Slab type. | V7 seq 12 + C |
| b122-123 | 209.5-212.9 | | Main Jade at first light looks up. The light arriving, from her side. | P `c2_lookup` (new), V7 |
| b124-127 | 212.9-219.7 | Every road I ran becomes the one (213.80) | The twelve runners converge on her from every side, each in her medium (three shots); from above, the roads converge (one). | K + V7 |
| b128 | 219.7 riser | | Close on her hands opening. | P `c2_hands` (new) |
| b129 | 221.44 hit | Fold me in again (221.35) | She catches the violet light at her chest, eyes closed. | P `catch` (new) |
| b130-131 | 223.1-226.5 | | The twelve fold into her, one per beat; each fold adds its medium to her. Three stages of the patchwork. | K + S `patch_1-3` (new) |
| b132-133 | 226.5-229.9 | Every life I've lived (227.40) | The poster frame: one Jade drawn in all twelve mediums at once. Her eyes open. | P `patchwork` (new) |
| b134-136 | 229.9-235.0 | I have become | The mediums settle into the clean, fully coloured Jade in daylight. Riser; snare pickup at 234.62. | P `resolve` (new) + C |

### Outro A: bars 137-148, 3:55-4:15 (full drums; this has to top the drop)

| Bars | Time | Lyric | Picture | Source |
|---|---|---|---|---|
| b137-138 | 235.04 impact | Back to main (234.16, held to 238.0) | The switch: on the impact the drawing becomes Jade herself, her traced likeness in the same jacket, singing. | L `like_sing1` |
| b139-140 | 238.5-241.9 | | Day. The road runs past the twelve places of her life standing along it like a town, each still in its medium. Side travel with parallax. | S `facade_*` (12 new) + C |
| b141-142 | 241.9-245.3 | | Main Jade runs and dances down the road past them; she twirls a pencil, the flourish she learned from violet. | P `day_run` (new, also K) |
| b143-144 | 245.3-248.7 | | She forks again: new branches run out as bare pencil lines on blank paper. | P `day_fork` (new) + C |
| b145-146 | 248.7-252.1 | Back to main (247.76) | Jade again, wider, singing. | L `like_sing2` |
| b147-148 | 252.1-255.5 | | Aerial pull-back: the road, the town, the new forks. | S + C |

### Outro B and C: bars 149-164, 4:15-4:43

| Bars | Time | Picture | Source |
|---|---|---|---|
| b149-152 | 255.49 drums out | The whole film as one git graph, labels 26 px or more. The violet branch leaves; its dot; a dotted arc forward to main: `cherry-pick docs: start here`. Riser at 261.0. | V7 seq 15 (labels enlarged) or C |
| b153-156 | 262.30 hit | Terminal: the real `git log --graph` of this branch, type 30 px or more, 7 s at most; `$ git checkout main`, `$ git merge` typed on beats. | C |
| b157-160 | 269.1-276.0 | Credits as commits, held. | C |
| b161 beat 3 | 276.82 final hit | The child at the frost window. A violet-gold light appears in the frost in front of her palm. They do not touch. She watches it. Hold through the fade. Last frame equals frame 0. | P `root_light` (new) |

**Counts.** About 195 shots over 282.8 s, about 41 per minute. By their own shot lists Hold Fire runs about 43 per minute and
Moongazing about 40; v7 has 32 hard cuts in the whole film. Longest holds: the bar 37 grid (1.7 s after the turn), the MAIN spelling (two bars), the violet
stillness (three bars), the terminal (7 s).

## 7. Asset list

| Group | New assets | Kind |
|---|---|---|
| Root (the child) | `root_fork`, `root_face`, `root_light` | 3 P |
| Main Jade, cel | `main_palm`, `main_face`, `main_split`, `main_light`, `main_release`, `hero_feet`, `fold_reach`, `fold_chest`, `look_back`, `main_back_wide`, `float_top`, `float_face`, `float_hand`, `rise`, `drop_face`, `c2_lookup`, `c2_hands`, `catch`, `day_run`, `day_fork` | 20 P |
| Crossings | `cross_wushu`, `cross_wetlab`, `cross_ames`, `cross_hackerhouses`, `cross_violet` | 5 P |
| Runner kit | twelve runners, one per medium, plus main, on a flat ground | 13 P (matted to K) |
| Details | `det_*`, one per life | 12 S |
| Stances and drop inserts | `stance_*` x4, `drop_hero_*` x5 | 9 S |
| Violet | `vio_wide`, `vio_walk`, `vio_close`, `vio_lookback`, `vio_climb`, `vio_pencil`, `vio_write`, `vio_release`, `vio_still` | 9 P |
| Patchwork | `patch_1-3`; `patchwork`, `resolve` | 3 S, 2 P |
| The town | `facade_*`, one per life | 12 S |
| Likeness | `like_sing1`, `like_sing2` | 2 L |
| Proof plates, redone 2026-11-13 after Jade's notes | all twelve lives and the root: jacket back, one face, her corrections (see section 10) | done in the proof budget |

Totals: 55 plates (still plus clip), 36 stills, 2 sung clips. Reused: the 14 proof plates and about 110 s of v7 renders.

## 8. Budget

Unit prices from the proof: a still $0.134; a 5 s clip at 720p $1.156; a sung clip of about 8 s roughly $1.90 (not yet measured).

| Item | Estimate |
|---|---|
| 55 plates, first takes | $71 |
| 36 stills, first takes | $5 |
| 2 sung clips, first takes | $4 |
| Still retakes (the proof needed 1.6 tries per plate) | $8 |
| Clip retakes (assume 30%) | $19 |
| Likeness alternates and lag variants for Jade's ear | $8 |
| Tests in section 9 | $10 |
| **Planned** | **about $125** |

Jade lifted the proposed $180 cap on 2026-11-13 (see section 10); the tools still enforce the $600 project cap. The proof ran at $0.80 per second of film; this plan
works out lower per second because the drop, the build and the graph stay code-drawn.

## 9. Tests to run before committing to the whole table

Each is small. Run them first, show Jade, then generate in bulk.

1. **Patchwork Jade** (about $2): can one figure be drawn in several mediums at once and still read as her, and can the settle into
   clean cel be animated? This is the poster frame; if it fails, the fallback is a code-built patchwork from the runner kit stills.
2. **Runner kit** (about $3): two runners in different mediums on a flat ground; matte them; composite side by side over the code
   plain. Checks that cut-outs hold on pencil and pixel art.
3. **Sung insert** (about $4): the Orbital Sunrise likeness still plus "Back to main" (234.16 to 238.04) from the new audio. Check
   likeness, lip-sync, and whether the jacket matches. Make lag variants for Jade to choose by ear.
4. **Crossing** (about $1.5): one cel-to-medium doorway shot with the wipe along the lane.
5. **v7 re-timed** (free): render the drop through the time map with type and HUD off; check sync against the new audio on a strip.
6. **On twos** (free): the proof with plates held at 12 fps beside the current one.
7. **Written lane** (free): one lane as text across a full-frame plate and through the grid's merge curves.
8. **Paper pass** (free): the kick against the sun and the 1,024 from above, redrawn on paper.
9. **Main on paper** (about $2): the chorus hero redone as flat cel on black paper with written lanes, to replace the neon version.
10. **Glyph pass** (free): the open-source plate in real characters.

## 10. Decisions

**Made by Jade on 2026-11-13** (all applied to the proof plates and the prompts in `fable/proof/gen/`):

- **Faces must be consistent.** One face design in every medium (rule 12). Method that worked: for each life, an edited "looking
  back" still with the sheet's face, used as the last frame of the clip, so the video model does not invent a face.
- **Jacket back:** no stripe, only the blue dot and RARE EARTH (rule 8). Every first-round plate failed this; all were redone.
- **Names:** the Sandstorm life is "my life in open source" (`jade/open-source`); the Chez JJ life is "my life in hacker houses"
  (`jade/hacker-houses`). Use these names everywhere, including on screen.
- **Violin:** she was first chair, first violin. Chip: `first chair, first violin`; plate: the outside seat of the front desk.
- **Kids:** shown from behind in the home plate: an older boy (7) with dark brown hair, a younger girl (4) with light brown curly
  hair. No faces, no photo references.
- **Little Jade** (piano, frost window): hair half up and half down with side-swept bangs; at the piano she sits properly while she
  plays and turns round.
- **The band:** the bandmates may follow the vibesong project's descriptions: one tall with short black hair, a pale striped shirt
  with rolled sleeves and a natural-wood electric guitar; one with curly dark hair under a flat cap and an acoustic guitar. Text
  descriptions only; their photos are not sent to models.
- **Art style:** agreed as written in "The look" (section 2): colour restraint, a material for main, written lanes, drawn things on
  twos, glyph art only where the text is true.
- **Budget:** "no need to cap it so low, it can go higher." The $180 figure in section 8 is no longer a cap; the working limit is
  the project cap enforced by the tools ($600 in total, about $200 left). Ask before going past that.

**Made by Jade after watching proof round 2 (2026-11-13):**

- **The faces read as one person.** The method stays: one face design, and a "looking back" still as each clip's last frame.
- **Smooth versus on twos:** she sees no big difference. On twos is therefore not required for the look; decide per shot.
- **A small discontinuity in the running shot at the end of the proof** (the chorus hero), less noticeable on twos. Not yet
  diagnosed. Likely cause (unverified): the compositor cross-blends 24 fps plate frames into 30 fps, which doubles fast-moving legs;
  the on-twos path does not blend. Check the source clip frame by frame first; if the clip is clean, show fast-motion plates
  without blending (nearest frame, or on twos). That shot is due to be replaced by the black-paper version anyway.

**Made by Jade after animatic v1 (2026-11-13, late):**

- **Animatic v1 pacing is about right** (judged at her reading speed; pictures may feel different). The paper pass on the v7
  material works for her: "the art style of the 3d renders makes them feel un-janky".
- **The reveal at bar 137 uses the Orbital Sunrise trace**, and specifically a still where the grey shadow cast by her glasses is
  gone and natural skin colour is back: Orbital's round-4 daylight relight, `media/plates/jade_loc_day/take1.first.jpg` in the
  Orbital repo. Retake asks for a glad, open face.
- **The click track** was listened to; no complaint.
- **Her idea, under discussion:** the crowd of Jades doing wushu turns out to be mostly an orchestra of Jades, with only some doing
  wushu. Concept still: `review/fable_take2/orchestra_concept.jpg`.

**Still open:**

1. **The reveal at bar 137.** Is her traced likeness from Orbital Sunrise the right image for "main is reality", and should it be
   held back until then (recommended), or also appear earlier as in Orbital?
2. **The lives.** Twelve are in the table; Cloudflare is not one of them. Any to add, drop or reword? Commit messages are in
   `fable/proof/lives.js`.
3. **Credits.** Proposed: "Animated by Fable 5.2 and a supporting cast of models", naming only the models that made the cut (Nano
   Banana Pro, Seedance 2.5), the mocap sources (CMU, ACCAD), Suno for the arrangement, fonts.
4. **The click track.** `analysis_v3/click_check.wav` has not been listened to. A minute of her ear on it before the cut is locked.

## 11. Order of work

**State on 2026-11-13, late:** Steps 0 and 1 are done and waiting for Jade's notes. Spent $399.45 of the $600 project cap.
- Step 0 results: `review/fable_take2/step0/index.html` (all ten tests and the running-shot diagnosis). Step 1: `review/fable_take2/animatic_v1.mp4`.
- Code: compositor `fable/take2/` (`shots.js`, 187 shots; `src/film.js`; notes in `fable/take2/notes/compositor.md`), v7 time map and
  hide flags (`fable/take2/notes/v7.md`; plates in `work_fable/take2/v7/full/`), paper and glyph passes (`notes/effects.md`), cut-outs
  (`fable/take2/tools/matte.py`), generation (`fable/take2/gen/`).
- Next: Jade's notes on the animatic and on the open points below; then Step 2. Do not generate the sections before her notes.

**State on 2026-11-14 (Steps 2 and 3 cut, waiting for Jade to watch):** `review/fable_take2/section1_v1.mp4` (bars 1-17),
`section2_v3.mp4` (bars 16-57), `section3_v1.mp4` (bars 56-89, with the 3D orchestra of Jades in bars 81-84: `fable/take2/notes/orchestra.md`;
two paper looks, `orchestra_v1.mp4` solid and `orchestra_v1_light.mp4`, Jade to choose). No cards left before bar 89. Sung insert: takes
E and F (thoughtful, re-timed to the word times with `fable/take2/tools/retime_sung.py`) in the local picker; Jade picked +80 ms on take D.
Spent $451.82 of $600. Next: Step 4 (drop, verse 2). Open for Jade: the orchestra look; whether the stance stills are true stances.
- The video model will not keep a small full-length runner: three takes (padded 16:9 twice, 1:1 once) all reframed to a large figure
  cropped at the soles or knees. The kit is therefore built large, with the feet behind the written lane.
- Restyling one approved runner still into each medium works when the ONLY image input is that still. Adding the character sheet or
  another plate as a second input made the model paste the runner into that picture or copy the sheet's labels.
- Several clips do not start on their first-frame still (fold_reach mirrored, fold_chest and main_back_wide reframed): lay out type
  against the clip's own frames.

What Step 0 changed (apply from Step 2 on):
- The running-shot jump was a repeated step in the generated clip (same foot twice, source frames 65 to 78). Measure the stride period
  of every running clip before accepting it (method in `review/fable_take2/step0/index.html`).
- Plates play nearest-frame; blend only when a clip is slowed (24-to-30 blending pulsed sharpness at 6 Hz).
- Clip prompts must say where lettering may appear for that view (`LETTER` in `fable/take2/gen/gen_clips.py`). "RARE EARTH stays as
  drawn" made the model write it on the chest and move the sleeve patch.
- The video model pushes in on full-length figures on a flat ground: runner-kit stills need a smaller figure and more margin, and one
  must pass before the other eleven are made.
- Paper pass: black paper only for now; white paper loses the picture. Its 12 fps boil makes large files; try `boil` below 1.
- Patchwork and its settle work; build the real plate from an approved main-Jade still so the face is the sheet's.
- Sung insert: both takes look pained; ask for a glad, open face. Jade to choose the likeness image (trace as is, or redrawn in the
  Merge jacket). Lip-sync was not measured; lag variants exist. Likeness clips stay out of the public repo.
- v7's lyrics written along its roads are part of the picture and are still in the re-timed plates.

| Step | Work | Jade sees |
|---|---|---|
| 0 | Tests 1 to 5. Promote the compositor to `fable/take2/` with a shot list. v7 time map and hide flags. | test clips, one page |
| 1 | Whole-film animatic on the new audio: v7 re-timed, the proof, labelled cards for every missing shot. Free. | the animatic |
| 2 | Verse 1, pre-chorus, chorus 1 (0:28 to 1:37): 14 plates, the runner kit, the crossings. | section cut |
| 3 | Intro, breakdown, build (0:00 to 0:28, 1:37 to 2:33). | section cut |
| 4 | Drop and verse 2 (2:33 to 3:28). | section cut |
| 5 | Chorus 2, outro, ending (3:28 to 4:43): patchwork, the reveal, the town. | section cut |
| 6 | Full cut. Costume audit of every plate. Readable-text pass. Lag choices for the sung inserts. Jade's timestamped notes, then fixes. | full cut, watched at speed with sound |
| 7 | Master at 1080p (plates are 720p; 4K buys nothing), X and YouTube encodes, subtitles. | deliverables |

How to run it (what worked before): two or three agents at a time, each owning named files, each keeping a notes file; one owner for
the compositor; mechanical work (renders, encodes, intake, strip cutting) on cheaper models; the main session directs, reviews sheets
and stills, and approves every plate before it is animated. Commit and push at each step, after the secret check.

## 12. What the proof taught about generating plates

- The character sheet as the only reference image is enough to keep the costume across every medium tried.
- Tell the model which way she faces. With her back to us she must face LEFT, or the patch lands on the wrong arm (5 of 14 first
  takes). The generator now says so.
- Pin the lane colour ("rose pink, not orange") or the band drifts to orange.
- "Keep the bottom of the picture calm" produced blank bars. Ask for a picture that fills the frame, and crop paper borders before
  animating.
- For the look-back, say that ONLY her head turns and her back stays to the viewer; otherwise the whole body turns and the costume
  goes wrong. Clips reach the turn at about 2 s, which leaves enough action before it.
- Every medium tried survived animation at 720p: gouache, coloured pencil, woodblock, pen and ink, plotter lines, ink wash, airbrush,
  risograph, pixel art, text art, crayon, scratchboard, watercolour, cel.
- Queue video jobs through `gen.py`; it spaces them two per minute. A batch of twelve took about twelve minutes.
- Check plates at full size for model-drawn text and paint it out or cover it in code.

## 13. Risks

| Risk | What would show it | Fallback |
|---|---|---|
| Twelve faces, not one person | confirmed by Jade; fixed with one face design and a last-frame still per clip | fewer close-ups of branch faces |
| Generated wushu looks wrong | stance stills | keep all martial arts in v7's mocap silhouettes; inserts are faces and hands only |
| The sung likeness fails her gate | test 3 | hold on a still of her likeness with drawn-on motion, no lip-sync |
| The patchwork frame is a mess | test 1 | build it in code from matted runner stills |
| 720p plates look soft full-frame | watching the proof at speed | use the 2K still for static shots; upscale clips with the hybrid tool's upscaler |
| v7 crowds clash with painted plates | step 1 animatic | grade and grain pass over V7 plates; keep them to silhouette, top-down and night |
| Written lanes or glyphs turn to mush after X's compression | a test encode at X's bitrate, watched on a phone | larger type; fewer, thicker lines; keep readable text to close shots |
| Budget | ledger after step 2 | drop the town facades to six; reuse proof plates in more places |
