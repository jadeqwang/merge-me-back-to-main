# Film v2: direction (director's brief, 2026-11-14)

Source: Jade's notes on film v1, verbatim in `fable/take2/notes/jade_v1_notes.md`. This file says what each note becomes.
Read `fable/take2/HANDOFF.md` first (how to run things, lessons that cost money, rules that must not slip). Plate rules are binding:
no stripe on the jacket back (pale-blue circle and RARE EARTH only), one face in every medium, kids from behind only, sleeve patch
on the correct arm, exactly the canon outfit.

Three owners. Each keeps a resume note, commits only its own paths at each milestone (never `git add -A`, never push; the director
pushes), and never commits anything under `work_fable/` or any likeness image.

| owner | notes file | owns |
|---|---|---|
| compositor | `notes/compositor.md` (append a "Film v2" section) | `shots.js`, `src/*`, `tools/*`, `fable/proof/lives.js`, renders |
| plates | `notes/plates_v2.md` (new) | `gen/*` (new ids only), new plates under `work_fable/take2/plates/`, kit cut-outs |
| orchestra | `notes/orchestra.md` (append "Revision 3") | `fable/show/seq/orchestra.js`, orchestra stills/clips/plates `orch_*` |

Only the compositor edits `shots.js` and `src/`. The other two end their notes file with a **Wiring** table: plate id, which shot it
replaces, clip range to use (seconds), where type can go (frame fractions), anything to trim. The director passes it on.

Budget: Jade lifted the cap ("even above 600 is fine"). Working limits: plates $70, orchestra $45. Report the running total
(`tools/gen/spend.py`) in the notes at each milestone. If `spend.py` or the gen tools refuse at the $600 cap, raise the cap constant
to 750 and say so in the notes.

## A. Compositor (code only, free)

1. **Lyrics.** Do not draw line 13 ("Ahh ahh", b65-72) or the "ooh" adlib (b100). On-screen lyrics are for words.
2. **Lives.** `jade/home` becomes `jade/parenthood`; the band's branch `jade/robot-ninja-apocalypse` becomes `jade/rna-band`.
   Everywhere they are drawn (chips, lanes, graph, town, git log). Ids (`home`, `band`) stay. `jade/1420-mhz` stays until Jade picks.
3. **Credits.** Add Opus 5.5: main line becomes "animated by Fable 5.2 and Opus 5.5, with a supporting cast of models". The spend
   log shows GPT Image was used for plates as well as Nano Banana Pro: the plates line names both. No longer a placeholder.
4. **Town direction (b139-142).** She runs facing frame left while the town also slides left: she looks like she runs backwards.
   The ground and buildings must move opposite to the way she faces (she faces left, so the world slides right; keep her unmirrored,
   the sleeve patch has text). Both shots (facades alone, then with her) travel the same way; the lives still pass in life order;
   the road text must still read left to right.
5. **Bars 54-55: build it.** The twelve worlds as small lit windows along the roads, a commit node locking on per beat (track the
   v7 roads or place the windows on a fixed horizon band if the track is poor; say which).
6. **The fold, b49-50 (replaces `fold_reach`, the hand to the lens: Jade finds it cliche).** Make the fold literal and make it this
   film's own: the picture is paper. The twelve life plates stand as the 4x3 grid the pre-chorus built (same order), and the sheet
   folds like a map along its creases, one fold per beat over the two bars: columns onto columns, rows onto rows, each panel
   turning in perspective with a shaded underside and a lane-colour flash on the crease, until one panel is left and it is her
   (`fold_chest`, hands crossed at her chest), which b51-52 then holds full frame with the existing fan. "FOLD ME IN AGAIN" slab on
   its word times, clear of the last panel. The crease grid can echo at b130-131 if cheap.
7. **Handwriting, b114-117.** Remove the wiggling cursive. New plates will show her writing in a notebook on her knee
   (`vio_write2`, then `vio_release2`; until they land keep the old plates). What appears in the air is set type, not handwriting:
   mono, violet light, steady (no wobble), typed line by line on the beat as she writes:
   `HANDOFF.md` / `Read this first.` / `Where things stand.` / `What it cost to learn.` / `What comes next.`
   (These are what the last session actually left for this one: the file is real, `fable/take2/HANDOFF.md`.) On the release the
   block closes to one line of light and leaves east as now, landing on the b117 downbeat. In the b149-152 graph the dotted arc's
   label becomes `cherry-pick HANDOFF.md`.
8. **Second likeness shot (b145-146) is dropped.** It becomes plate `wave_run` (plates agent): drawn Jade sprinting at the lens out
   of a wave of the twelve lane colours. "BACK TO MAIN" slab stays on its word times. The first likeness shot keeps take E, +80 ms,
   type as is.
9. **Wire new plates** as they land (the wiring tables), then render film v2: local with likeness, public with `likeness=0`, review
   encode, sheets, `check.py`. Version every output (`film_v2`), never overwrite v1.

## B. Plates (image and video models)

All in the existing mediums and outfit. One reference image per still. Check the last second of every clip.

1. **`root_face` retake (b5-6, 3.5 s on screen).** She must be alive: blinks twice, a breath that fogs the glass and clears, the
   chest and shoulders rise, a hair strand moves. No camera push that crops the ponytail. Then look at `root`, `root_fork`,
   `main_palm`: if she is as frozen there, retake those too.
2. **`wushu` life plate (b30, also the b12 flash and the crossing).** Jade: it "feels more AI-generated", every part of the frame
   has the same salience. Cause: five identical figures in a row, flat even light, every plank and floor line as sharp as her face.
   Retake as a woodblock print with a hierarchy: one figure (her, nearest) carries the detail and the one strong colour; the team
   behind are fewer (two or three), smaller, simplified to flat shapes and overlapping; large quiet areas (plain wall, bare floor);
   light from one side so the eye lands on her face and leading fist. Keep it barehand changquan, group set. Clip: the punch
   lands, sleeves snap, then stillness.
3. **Stances in motion (b73-76, and beat 3 of b77-80).** Jade: the stances are fine, motion would be nicer than stills. Animate
   the four approved stills (image to video, the still as first or last frame): she arrives in the stance in the first quarter
   second and holds, hair and jacket settle. If the model breaks the stance, use still-to-still micro motion (hair, sleeve, dust,
   breath) instead; the stance itself must stay true.
4. **Build inserts: not only wushu (beat 3 of b77-80; Jade: mix it up with writing poems and playing instruments).** Four moving
   close inserts, cel, rim-lit, blue hour, same look as the stances, one beat each on screen (make 2-3 s clips):
   `ins_violin` (bow arm, a full down-bow, the wrist leading), `ins_poem` (pen finishing a line in a notebook, the hand lifts),
   `ins_piano` (both hands land a chord, wrists drop), `ins_guitar` (a strum on an acoustic guitar: the RNA band). Hands as
   "slender hands of a young woman, smooth skin". No readable model text.
5. **Drop inserts (b90-92, b102, b103).** Jade: the fist, palm and eyes break up the choreography but "I'm not sure what they're
   actually accomplishing artistically". They become one sentence, in motion, gold on black with wind: `drop_hero_1` the fist closes
   (holding on); `drop_hero_2` the open palm rises until the sun's disc sits behind it (the child's palm on the glass, frame 0);
   `drop_hero_3` her eyes open, the sun in them. `drop_hero_4` and `_5`: her hair and jacket whip through the turn; the landing,
   dust rising gold. No comic impact rays. Animate from the existing stills where they fit, new stills where they do not.
6. **`drop_face` (b100, will hold the whole bar, about 1.7 s; make 4-5 s).** Wind: hair and jacket moving, light flickering across
   her face. She sings the wordless "ooh" (song 172.54 on; it is a held open vowel, mouth open and steady, eyes closed, no
   consonants): generate from the still plus the music as the sung likeness clips were, and time it with `retime_sung.py` if needed.
7. **`vio_write2`, `vio_release2` (b114-117).** Scratchboard, white on black, violet the only colour, same place as `vio_write` (on
   the dish rim, back three-quarter). She writes in a small notebook on her raised knee with the pencil, head bowed, the hand
   really writing (small, wrist and fingers); nothing drawn in the air and no readable text on the page. Then she closes the
   notebook, lifts her open hand and looks up east. Report the notebook's place in frame and a clear sky region for the type.
8. **`wave_run` (b145-146, 3.4 s).** Reference: Rewind's colour flood, `~/Documents/1-music-shipped/rewind-take-two/media/shots/F1/`
   (frames in `deliverables/rewind_v10b_master_1080p_sfx.mp4` at 169.4-173.0 s): Jade sprints at the lens, hair streaming, a great
   breaking wave of colour behind her. Merge's version: daylight, white paper, coloured pencil; she runs on the orange road of main;
   the wave is made of the twelve lane colours (`fable/proof/lives.js`) as ribbons of written lanes curling over like a breaker;
   no city. Use one Rewind frame as the single reference for composition. Leave room low for the slab.

## C. Orchestra (b81-84), 3D plus the video model

Jade: the violin and drum motion look "very mechanical", "the wrist articulation in drumming doesn't look the same as a puppet";
she chose the solid look only because "the underlying layer doesn't look that good, and the art style hides it. if we can find a
way to make the underlying layer look better (e.g., with a video model), then I'd prefer that." And the first shot (fly in and sit)
must be fixed: slower, fewer, visibly sitting.

1. Fix shot 1 in the 3D: far fewer arcs, slower, and the players are seen to sit (chairs first, then bodies settle into them).
2. Use the 3D only as layout. For each of the eight shots take a clean raw 3D frame, restyle it with the image model into the
   film's cel look (blue hour, rim light, white jackets with the pale-blue circle on the back and no stripe, one face) keeping
   the 3D frame's composition, then animate with the video model: bows in unison with real wrists and elbows, the timpanist's
   wrists rebounding, basses leaning, the conductor's beat. Closer shots first (violins from the side, timpani, basses, the
   conductor's view); for the wides either the same route or the 3D through the paper pass if the model cannot hold the crowd.
3. Deliver plates `orch_1` .. `orch_8` (intake as plates) with a wiring table (which 0.85 s of each clip, bow changes on the beat
   where it can be had: say the clip's bow period so the compositor can time-scale it).
4. Show the director a sheet of the eight stills before animating all of them.
