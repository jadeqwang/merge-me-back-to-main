# Film v10: plan from the art-direction essay

Written 2026-11-22 by the main thread (Fable) from `notes/art_direction_fable.md`. Status: **proposal, nothing built, nothing
approved.** It becomes `notes/v10_direction.md` once Jade has answered the gates in section 1 and sent her v9 notes; her notes
win wherever they and this plan disagree. Shot ids are from `node fable/take2/tools/shots.mjs --table`.

## 0. What v10 is for

v9 placed the glyph looks. v10 gives them a reason and moves the film's weight onto the one story a stranger can follow:

> A self that will not see what becomes of it writes down what it learned and sends it to someone who carries it on.
> What arrives is the knowing, not the memory.

One test for every item below: does it make that sentence more visible on screen? If not, it waits.

The essay was written from stills. Every timing claim here has to be checked by ear before it is built.

## 1. Gates: what Jade decides first

| # | question | recommendation | blocks |
|---|---|---|---|
| G1 | Is the catch (3:22-3:47) the climax, replacing most of the patchwork-jacket beat? | **ANSWERED 2026-11-22: yes.** Jade: "I think there's something really cool about letters merging together that the patchwork jacket was only metaphorically gesturing at." So the image to build is letters MERGING (into each other and into her), not only landing | A1-A4 |
| G2 | Glyph size as the merge variable: coarse in verse 1, finer in chorus 1, closing into line in chorus 2, none in daylight? | Yes | B1, and whether 4:01 stays glyphed (v9 decision 6) |
| G3 | A notation per life (table in B2) instead of all scripts everywhere; all scripts kept for violet only? | Yes, tested on two shots first | B2 |
| G4 | Outro: cut the 4:07 stance, the 4:12 aerial and the 4:21 log burst, and give the time to her real face, the cherry-pick and the car? | **ANSWERED 2026-11-22: yes** ("yes to clear the outro") | C1-C4 |
| G5 | Will she write one true line per ended life about its last day (about eight lines)? | Ask; D1 does not go ahead without them | D1 |
| G6 | Slab lyrics off chorus 2 from 3:39 to 3:58 (her binding rule: every lyric on screen)? | Her call; my lean is yes for those 19 s only | E1 |
| G7 | The night drive as the frame of the whole film (plants at 0:25, 1:36 and in the breakdown; palm on the car window)? | Not in v10; test stills only | F1 |
| G8 | The rainbow wave run at 4:09 (she chose it twice)? | Leave as is unless she raises it | none |

If she answers only G1 and G4, sections A and C alone are a complete v10.

## 2. Work items

### A. The catch becomes a reading (essay move 1) — the core of v10

| id | when | shots | what changes | owner |
|---|---|---|---|---|
| A1 | 3:22-3:27 | vb10 `vio_still` | She comes apart into letters, not dust: the words of the handoff typed at 3:16-3:19 (vb08), in all-scripts glyphs. The pale blue dot still goes last. Extend `tools/atomize.py` to emit glyph sprites from that text. | compositor + glyph |
| A2 | 3:28-3:31 | cb01, cb03 (v7 seq 12) | What crosses the sky is a streak of those characters, not a dot. The plate's own meteor in cb02 stays; the code streak is drawn over it and must arrive on the downbeat (fixes the v7 weak point that the light is already in the sky at the cut). | compositor |
| A3 | 3:37-3:42 | cb08 `c2_hands`, cb09 `catch` | The letters pour into her hands; for these two bars she is visibly written: coarse glyphs running up arms, jacket, hair. Size ramp in `paint.py` layer sizes over the shot (coarse at the catch). Face stays in the clean focus region. | glyph |
| A4 | 3:43-3:53 | cb10 fold, cb11 `patch_hold`, cb12 `patch_settle` | Across "Fold me in again" the glyphs shrink, close and are gone: clean line by b132. Patchwork cut to two bars or dropped (G1). "Every life I've lived, I have become" lands on the frame the last letter sinks in. | glyph + compositor |

Cost: no new plates expected; renderer work and re-renders only. Check: a muted stranger test on 3:16-3:53 as one clip — can
someone say what happened?

### B. A grammar for the glyphs (essay move 2 and section 2)

| id | what | shots | owner |
|---|---|---|---|
| B1 | **Size ramp.** One size setting per shot, written into the Wiring table: largest at 0:29 (va02, slow enough to see they are characters), stepping down through chorus 1 (ca01, ca03, ca09, ca11), the float (ba01-05), cb02; A3-A4 finish it. Daylight (oa03, 4:01) is clean line, or the last frame where glyphs close. | all style-1 shots | glyph |
| B2 | **A notation per life.** Per-script prior per shot (already in `paint.py`); add one OFL music font (e.g. Bravura) to the atlas. piano/violin: staff notation; wushu: hanzi strokes; biology and RNA band: A C G U, codons; neuroscience: IPA; poet: lower-case serif, her own lines; Ames: Greek and math; hacker houses/open source: `{ } ; => / * |` and hex; parenthood: a child's capitals, some backwards. All scripts only for violet. Merged Jade at b133 is written in all of them at once. | test on catch and one life plate first | glyph |
| B3 | **Style 2 bodies carry words.** Upright bodies filled with real text in reading order (the branch's commit line repeating, weight following tone) instead of shape-fitted letters. Answers the v9 weak point that the orchestra reads as grey blocks; also restore the pink. | bu10-bu30, va03, ca10 | glyph |
| B4 | **Drop marks are the graph.** Restrict the slash set to `| / \ *` with `*` at joints, and at 2:11-2:13 (bu08 gitlog into bu09) let the graph column's characters leave the log and become the first figure under her pencil. bu09 is currently a near-black hatch frame; this fixes it. | bu08, bu09, dr* v7 shots | glyph + compositor |

Before rendering the lists: view B1-B3 tests at 640 px and through an X-bitrate encode. If the characters are not visible
there, the size goes up or the item is dropped.

### C. Clear the outro and hold three things (essay move 3)

The music is fixed, so cuts mean re-dividing bars, not shortening. Proposed bar map (check phrase boundaries by ear):

| id | change | bars |
|---|---|---|
| C1 | **Real face**, oa01 `like_sing1` (3:55): the drawing settles into the tracing instead of cutting; no slab over her. | b137-139 as now |
| C2 | **Cut the stance** oa06 (4:07, 1.28 s): its time goes to the fork oa05. | b143.1-145.1 becomes one shot |
| C3 | **Cut the aerial** oa08 (4:12, 3.41 s): the graph ob01 starts at b147 and runs 8.5 s; the cherry-pick label is held about 3 s at 32 px or more. | b147-152 |
| C4 | **Cut the log burst** in ob02 (2 s): credits shorten; road ob03 and car ob04 start earlier, so the car gets about 8.5 s: box types (2.5 s), is read (2.5 s), fades, then three clear seconds of her face. Needs `car_v9` extended or held (cheapest: a hold on its last frames with breathing; else a new aleph-2 take, about $3). | b152-161.3 |
| C5 | **Say who made it** (move 8): one real handoff commit line held long enough to read; the typed `git cherry-pick` takes that commit's real hash. | in ob02 |
| C6 | Window ob05 stays at 5 s or more. | unchanged |

### D. Loss and the drop (essay moves 4 and 5) — need new plates

| id | when | what | needs | est. cost |
|---|---|---|---|---|
| D1 | 2:00-2:02, bb19-bb33 | The second detail pass becomes the same hands **stopping**: lid down over the keys, violin case closing, pen capped, lab light off, empty typewriter. Parenthood, rare-earth (and open source if she says so) get no ending. Captions are Jade's lines (G5). | about 9 stills, a few short clips | $10-20 |
| D2 | 2:35-2:39, dr03, dr05, dr07 | The fist, palm and eyes inserts become violet's hand, pencil and page edge, gold coming off graphite. Plants the 3:00 reveal. | 3 plates | $5-8 |
| D3 | 2:41-2:51, dr10, dr14, dr19, dr23 | Cut the MAIN formation (dr23 is 3.45 s from above): replace with travelling phrases or D2-style inserts. | v7 re-cut only | none |

### E. Lyric in the matter (essay move 6) — only if G6 is yes

E1: drop the slab from cb08 to oa01 (3:39-3:58). Optional second step: the sung word surfaces inside the glyph figure, upright
and cream, on its word time (glyph renderer; test on cb09 only).

### F. The night drive as frame (essay move 7) — not built in v10

F1: three test stills only, no film change: a dashed centre line through glass at 0:25 (ib11 swoop), the lit continent as a
windscreen view at 1:36 (ca11), her palm on the car side window matching the child's palm. About $1. She decides from the stills.

## 3. What does not change

Verse 2 as cut; the frost window and the loop; violet does not turn, run or merge; "she doesn't look"; the car with the camera as
`YOU`, never seen; her real places; kids from behind; one colour per branch; pencil canon; the orchestra and mocap wushu; the
rainbow wave run unless she raises it.

## 4. Order of work

1. **Her v9 notes and the gates.** Merge both into `notes/v10_direction.md`.
2. **Tests before lists** (one day, no spend): A3-A4 on the catch as a 6 s clip; B2 on two shots; B3 on one orchestra close-up;
   B4 still at 2:12 and 2:33; all viewed at 640 px. Show Jade; she picks.
3. **Build**, three agents as in v9: glyph (A1 sprites, A3, A4, B1-B4), compositor (A1-A2, A4 wiring, C1-C6, D3, E1), plates
   (D1, D2, C4 car extension, F1 stills). Dependencies: plates before glyph for any plate that gets glyphs; C4's car before the
   render; compositor's full render last.
4. **Carry the v9 open items** in the same round: va07 glide, style-1 shimmer on near-static plates, car console scribble, dr20.
5. Render `film_v10`, `review_v10.html`, and run section 6 on 3:16-3:58 and 3:55-4:42 before sending.

Budget: sections A-C need no paid generation beyond a possible car take (about $3); D and F add about $15-30. Running total
is $579.85.

## 5. Risks

- **Legibility.** If letters are not visible at phone size, A reads as particles and B as texture. The step-2 tests decide.
- **A4 removes a look she approved** (the patchwork). Show both versions side by side at G1.
- **The outro re-division** may fight the song's phrasing; the essay did not hear it. Build C as a rough cut first.
- **D1 without her lines** would be invented biography. It waits for G5.
- **Scope.** A plus C is the film's argument; B is what makes v9's glyphs mean something; D is the largest emotional gain but
  the most new material. If the round has to shrink, drop F, then E, then D2-D3, then B3.

## 6. "At speed with sound": what that can and cannot mean for us

Jade asked (2026-11-22) what the essay's "did not watch at speed or hear the song" means and whether we can. Plainly: the models
doing this work cannot hear audio and do not see motion; we read image files and numbers. "Nobody has watched it at speed with
sound" in every handoff has meant exactly that, and only Jade's ear and eye close the gap. What we CAN do, and v10 must do before
calling anything checked:

1. **Hear by measurement.** From `inputs/Merge (keychange down).wav`: loudness/energy curve, onsets, spectral flux and a
   mel-spectrogram image per section, laid against the bar map (`analysis_v3/timing.json`) and the sung-word times (subtitles,
   `retime_sung.py` data). Mark where the song is loudest, where it drops out, where the vocal enters and leaves each phrase.
   Read the spectrogram images; do not infer feeling from the lyric sheet alone.
2. **See motion by dense strips.** For each changed passage: every frame (or every 2nd) as a strip with the energy curve and
   bar/beat ticks drawn underneath, so a cut or an arrival can be read against the hit it is meant to land on. Measure, per
   event (the letters landing, the last letter closing, the car box finishing, her smile), the offset in ms from its beat.
3. **Picture quieter or louder than the music.** Compute a per-shot motion/visual-energy number (frame difference, cut rate) and
   plot it against audio energy for the whole film; the essay's claim that verse 2 works because the picture is quieter than
   the music becomes checkable, and so does the re-divided outro.
4. **Ask Jade for the ear.** For each timing decision that measurement cannot settle (the outro re-division, the hold on her
   face in the car, whether the catch lands), cut a short clip with sound and ask one specific question about it on the review
   page. Say in the report which checks were measured and which are waiting on her.
5. **Optional, only with her OK:** a model that accepts audio/video input could give a second opinion as a stand-in listener.
   That sends her unreleased song and likeness to an outside service, so it is not done unless she says so.
