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
   drawn in code or painted out. (The proof breaks this in the Sandstorm and Chez JJ plates; fix in the rebuild.)
7. True when paused: commit messages, dates, counts, the clock at 10:30, a legal orchestra seating, a real wushu stance.
8. Costume audit on every plate and clip: round `1420 MHz` patch on her LEFT upper arm only; pale-blue circle and `RARE EARTH` on the
   jacket back; one band across chest and back and one on each upper arm; band, straps and headphones in the branch's lane colour
   (orange for main); headphones round the neck unless the scene says otherwise.
9. Her kids are never shown and never photo-referenced. The home plate uses two empty beanbags. (Jade can change this: section 10.)
10. Nothing frozen: every shot has movement, from its first frame.
11. Anime Jade never lip-syncs (mouth closed, as in Rewind). Only her traced likeness sings, in the outro.
12. Expression: calm, hopeful, "never an ad smile". The look-back is a quiet look of recognition.
13. Tone: tender, euphoric, epic. No fear framing.
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
5. **Code-drawn readable text** over plates: terminal on the Sandstorm screen, the handwriting `docs: start here`, the wall clock.
6. **Use `still.jpg`** (the 2K still) for near-static full-frame shots so they are sharper than the 720p clip.

Generation tooling (unchanged from the proof): `fable/proof/gen/gen_stills.py` (stills through `tools/gen/cf.py`), `gen_clips.py`
(specs) and `tools/gen/gen.py submit|wait` (video queue), `intake.sh` (frames, meta, review strip). Run with
`/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python`. Every call is logged to `docs/spend_ledger.jsonl`; commit it after
each run.

## 6. Shot table

Times are seconds in the new audio (`analysis_v3`). `b17` means bar 17; a bar is about 1.72 s. Source codes as in section 5.
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
| b20-23 | 33.3-40.2 | Down every road the night could hold (33.65) | Four crossings, one per bar: a cel-drawn branch-Jade runs her lane toward a doorway of light; as she crosses, the whole picture turns into her medium. Wushu (woodblock), neuron lab (ink), wind tunnel (painting), Chez JJ (pixel). | P `cross_*` (4 new) wiped by C into the life plates |
| b24 | 40.2 | | The fifth road has no doorway: the violet one runs out into engraved dark, and she keeps going. | P `cross_violet` (new) |
| b25 | 42.0 | Each one a light (42.40) | Close on cupped hands; a light kindles. | P `main_light` (new) |
| b26 | 43.7 | I sent ahead | She opens her hands; the light leaves along the lane. | P `main_release` (new) + C |
| b27 | 45.5 | | The light races down the rose lane and becomes the lamp in the piano room. | V7 lane shot, match cut |
| b28-32 | 47.2-55.9 | Each one a story to unfold (47.64) | Ten lives, one plate each, 4, 4, 2, 2, 2, 2, 1, 1, 1, 1 beats: piano, violin, wushu, neuron lab, PhD, poet, wind tunnel, band, Chez JJ, Sandstorm. Lane line and chip on each. | P x10 (exist) |

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
| Crossings | `cross_wushu`, `cross_wetlab`, `cross_ames`, `cross_chezjj`, `cross_violet` | 5 P |
| Runner kit | twelve runners, one per medium, plus main, on a flat ground | 13 P (matted to K) |
| Details | `det_*`, one per life | 12 S |
| Stances and drop inserts | `stance_*` x4, `drop_hero_*` x5 | 9 S |
| Violet | `vio_wide`, `vio_walk`, `vio_close`, `vio_lookback`, `vio_climb`, `vio_pencil`, `vio_write`, `vio_release`, `vio_still` | 9 P |
| Patchwork | `patch_1-3`; `patchwork`, `resolve` | 3 S, 2 P |
| The town | `facade_*`, one per life | 12 S |
| Likeness | `like_sing1`, `like_sing2` | 2 L |
| Retakes of proof plates | poet (no fringe), Sandstorm (head-only turn; screen text painted out), Chez JJ (whiteboards painted out) | 3 P |

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

Proposed cap for take two: **$180**, leaving about $55 of the $600 untouched. The proof ran at $0.80 per second of film; this plan
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

## 10. Decisions for Jade

1. **Do the twelve read as one person?** Her face is drawn differently in each medium in the proof. If not, the fix is one face
   design carried through every medium (the medium changes the rendering, not the features), at the cost of some of the variety.
2. **The reveal at bar 137.** Is her traced likeness from Orbital Sunrise the right image for "main is reality", and should it be
   held back until then (recommended), or also appear earlier as in Orbital?
3. **Home.** Two empty beanbags instead of the kids: keep, or show them from behind, stylised?
4. **The lives.** Twelve are in the table. Cloudflare is not one of them. Any to add, drop or reword? Commit messages are in `fable/proof/lives.js`.
5. **Budget.** $180 cap for take two?
6. **Credits.** Proposed: "Animated by Fable 5.2 and a supporting cast of models", naming only the models that made the cut (Nano
   Banana Pro, Seedance 2.5), the mocap sources (CMU, ACCAD), Suno for the arrangement, fonts.
7. **The click track.** `analysis_v3/click_check.wav` has not been listened to. A minute of her ear on it before the cut is locked.

## 11. Order of work

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
| Twelve faces, not one person | Jade's reaction to the proof | one face design across mediums; fewer close-ups of branch faces |
| Generated wushu looks wrong | stance stills | keep all martial arts in v7's mocap silhouettes; inserts are faces and hands only |
| The sung likeness fails her gate | test 3 | hold on a still of her likeness with drawn-on motion, no lip-sync |
| The patchwork frame is a mess | test 1 | build it in code from matted runner stills |
| 720p plates look soft full-frame | watching the proof at speed | use the 2K still for static shots; upscale clips with the hybrid tool's upscaler |
| v7 crowds clash with painted plates | step 1 animatic | grade and grain pass over V7 plates; keep them to silhouette, top-down and night |
| Budget | ledger after step 2 | drop the town facades to six; reuse proof plates in more places |
