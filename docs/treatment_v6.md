# Merge — v6 treatment: written in text

Jade Q Wang, album *Rare Earth*. Song: the revised "Merge" (`inputs/Merge.wav`, 282.5 s, 138.00 BPM constant, bar 1 = 0.126 s).
All times are song seconds from `analysis_v2/timing.json` (engine: `?timing=v2`, the default). Source: Jade's Google Doc "Merge: new
treatment and shot list (v6)", written 2026-10-28. This replaces the v5 direction (`docs/treatment.md`, `docs/concept.md` are history).

## The decision
The whole film is written in text, and the only solid image is real footage of Jade. Every frame is characters on black, the way
Orbital Sunrise (github.com/jadeqwang/orbital-sunrise-video) is drawn in coloured pencil. Branches are sparse text; as they merge the
text gets denser. At the outro's "Back to main" the text fuses into unprocessed phone footage of her: the one solid moment. **Main is
reality.**

The performance comes from Jade, filmed on a phone, not from a video model: that fixes likeness, lip-sync and body physics at once. The
drop is her real 2004 group set, traced from the competition footage. Generation is kept only for what can't be filmed (the girl at the
frost window, which already exists as takes, and a few sets).

**Kept:** the engine, the timing analysis, the `LIFE` table and commit messages, the pre-chorus grid, the violet branch at the dish, the
git-graph ending, the real-routine pipeline (`?drop=real`, `docs/wushu_real_routine.md`).
**Dropped:** the 3D idol face, all generated group choreography, the orchestra, chess "analysis mode", the intro poem, most of the drone tree.

## The rules of the look (engine: `engine/src/textlook.js`)
1. **Characters on black.** A fixed character set (`CHARSET` in textlook.js: printable ASCII, box-drawing and block marks, a few dots and
   arrows); the brightness ramp is `.:-=+*#%@`, and hooks/titles are built from their own letters. Nothing is drawn but glyphs in cells:
   no gradients, no bloom halos, no grain, no photographic pixels — except the switch.
2. **Colour only from the branch palette.** main `#FF7A1A` orange; rose `#FF5FA2`, sky `#6FB6FF`, mint `#4FE3B0`, gold `#FFD23F`,
   violet `#A57BFF`, white `#F4F4F8`. A cell's colour is its lane colour scaled by brightness; there is no other hue.
3. **No generated pixel is ever shown unprocessed.** Every source (generated takes, phone footage, the 2004 video) goes through the same
   text pass; only H1 is shown raw, and only in the switch window.
4. **Density is the one story variable.** `density` 0..1 = cell size (large, sparse, readable → small, dense, near-solid) and the
   fraction of cells lit. A branch alone is sparse; merging makes it denser. Each shot in `engine/show/v6.js` sets its own density
   (verse 1 ≈ .3, the grid .5, chorus 1 .45 → .86, breakdown .5 → .9, drop .8, verse 2 ≈ .3, chorus 2 .5 → 1 into the switch).
5. **Glyph refresh rate carries emotion** (drawing on ones/twos/threes): `hold` = how many frames (at 24 fps "drawing" time) a glyph
   keeps its character before re-picking. Stillness on threes/fours, verses on twos, the drop and the build on ones.
6. **Big type only on the hooks.** Lyrics otherwise sit small and in the grid.

## The switch (236.64 s, bar 137)
On the outro's full-drum drop the text around her fuses into real, unprocessed footage (H1), held through "Back to main", the vocalise and
the second "Back to main" to ~256 s (bar 148 end is 257.51; the text returns for the git graph on bar 149). It is the only raw image in the
film. Transition: the cells shrink toward 1 px over ~2 beats before 236.64 while the glyph field is replaced by the footage's own pixels,
cell by cell from the face outward; on the bar line it is 100 % footage. The return at 255.9–257.5 is the reverse (footage → coarse text),
ending in the git graph. Built as a pure function of (source texture, t) so it applies unchanged to H1 when it arrives.

## Section map
| time (s) | bars | section | picture | source |
|---|---|---|---|---|
| 0–27.95 | 1–16 | Intro | The frost window at night. The girl blows on her palm; frost crystals branch across the glass. **The frost is the tree**: the count 1, 2, 4 … 1,024 as the frost grows (branch count doubles on the bars). MERGE slams on the bar-9 hit (14.04). No poem. | existing window takes (box), engine frost |
| 27.95–55.77 | 17–32 | Verse 1 | Sparse text. "I split myself a thousand ways" (28.5): she forks into copies that drift apart. "Down every road" (33.5): her back, walking away. "Each one a light I sent ahead" (42.3): cupped hands open. "Each one a story to unfold" (47.5): the lives, one prop and one action each. | A2, B1, A4, B2, C* |
| 55.77–69.69 | 33–40 | Pre-chorus | The 3×3 grid of lives; every life turns her head on the same beat (bar 37, 62.72). On "Where I started from" the cells fold back into the frost window. | B3 per life, C* |
| 69.69–97.51 | 41–56 | Chorus 1 | She sings; the copies stream into her and the text gets denser. "Fold me in again" (83.6): reach to lens, fold to chest. "Nothing that I lived can come undone" (89.5): close-up, eyes to lens, the long "undone". | A1, A2, A3 copies, B4 |
| 97.51–125.34 | 57–72 | Breakdown | "Branch… and wander / Merge… and return": the lives' commit messages drift in as loose text and gather into one frost branch. The "Ahh" (111.9): eyes closed, profile or lying back, text brightening with the snare build. | A5 (or A6), graphics |
| 125.34–153.17 | 73–88 | Build | The biggest hit, no vocal: **graphics only**. `git log` racing on the beat with real hashes and commit messages from `LIFE`, panes opening per kick, everything drawing inward on the riser (147.95–153.17). No chess. | graphics |
| 153.17–180.99 | 89–104 | Drop | Her real 2004 group set traced as text figures in lane colours (`?drop=real`). On the "ooh" (173.08) the final pose and salute; present-day Jade steps into position 3. | 2004 footage (box), B9 |
| 180.99–208.82 | 105–120 | Verse 2 | The violet branch at the radio dish (bun, two pencils). Context meter 95 → 100 %. Sits on the rim and sings, looks to the far glow, pulls a pencil from her bun, writes "learned: every road was worth it" in the air. At 201.86 the drums cut and she comes apart into text as the light leaves. | B7, B6, B8; dish set generated |
| 208.82–236.64 | 121–136 | Chorus 2 | Pads only: her light crosses the night. On the 222.73 hit it touches the frost window and **the frost blooms** into the whole tree; the girl sees it. "Merge me back to main" (208.1): she catches the light at her chest. "Every life I've lived, I have become" (228.9): close-up, text nearly solid. | window takes, B5, A1 |
| 236.64–257.51 | 137–148 | Outro A | **The switch.** Real Jade, unprocessed, at sunrise: "Back to main", the vocalise, the second "Back to main". | H1 |
| 257.51–264.47 | 149–152 | Outro B | Drums out, arp alone: the text returns and draws `git log --graph` of every life, all merged, violet cherry-picked last. | graphics |
| 264.47–282.52 | 153–163 | Outro C | Last hit: MERGE end card, credits as commits, fade. | graphics |

## Shot list (Jade films; IDs are the slot labels in the animatic)
Setup for every indoor shot: phone on a tripod, landscape, 4K 30 fps (60 fps where marked slow), focus/exposure locked; plain dark
background ≥ 1.5 m behind; one soft side key ~45°, optional warm rim; the jacket from the selfie, patch on the LEFT arm; hair down for main,
bun with two pencils for violet (B6–B8). **The song plays out loud from a speaker, she sings full voice, and claps once on camera at the
start of each take** (the clap + singing is what `tools/footage/sync.py` locks onto). Leave lyric space on one side; shoot a little wide.
5 s clean plate at the end of each setup. **Turn HDR Video off** (iPhone: Settings › Camera › Record Video) so the colours of the
unprocessed H1 survive as filmed; `prep.py` tone-maps HDR only if its ffmpeg has zscale.

| ID | framing | action | takes | used at |
|---|---|---|---|---|
| A1 | close-up, head and shoulders, centred | sing the whole song to the lens; calm; open mouth on held notes | 3 full | chorus closes, "Nothing that I lived", "Every life I've lived" |
| A2 | medium, waist up, right third | sing the whole song, small natural movement | 2 full | verse 1, "Merge me back to main" |
| A3 | wide, full body, centred | sing the whole song, stay in one spot (the crowd source) | 2 full | forks, chorus copies, fold |
| A4 | wide, from behind | (a) stand, slow head turn right and back, ~1 min; (b) walk away 5 steps, twice | 2 each | "Down every road", "Back to the place where I began" |
| A5 | close profile facing left | sing 97.5–125.3 eyes closed | 2 | breakdown |
| A6 | overhead (optional) | lying back, arms out, eyes closed, sing 97.5–125.3 | 1–2 | breakdown (replaces A5) |
| B1 | close ¾ profile, hand in frame, 60 fps | blow across the open palm, watch something drift off | 4 | "I split myself", the fork |
| B2 | medium close | cupped hands hold a light, open, follow it up past the lens; sing 42.3 | 3 | verse 1 line 3 |
| B3 | medium, as A2 | look left of lens; on the clap turn to look past camera right, hold | 3 per outfit | pre-chorus grid |
| B4 | medium, centred | fold: reach to the lens, draw back, cross hands to chest; slow / medium / on the beat; sing 83.6 | 4 | choruses 1 and 2 |
| B5 | close | catch: eyes closed, hands to chest, a breath, eyes open; sing 208.1 | 3 | chorus 2 opening |
| B6 | medium close, bun, cool light | pull a pencil from the bun, write a line in the air; sing 195.5 | 3 | verse 2 |
| B7 | medium wide, bun, seated, cool side light | look up and out, sing 181–207 | 2 | verse 2 at the dish rim |
| B8 | medium, bun | send: a light over the open palm drifts to the horizon; sing 200.9, then once silent | 3 + 2 | verse 2 end |
| B9 | wide, full body, front-on, chest height (≈ the 2004 camera) | step in from the side into the closing posture, then the salute, on the "ooh" (173.08) | 4 | drop, position 3 |
| C1–C9 | per life (piano, violin, guitar, poet, stage, home (hands only, no kids), wushu, lab/PhD/NASA, mic) | one simple action 15–30 s, then the B3 head turn | — | verse 1 lives, pre-chorus grid |
| H1 | flat horizon, nothing placeable (Ocean Beach at sunset facing the ocean, or Austin roofdeck at sunrise, sky only) | sing 235.7–256, eyes to lens by the end. **Shown exactly as filmed.** Location tagging off | as many as the light allows | the switch |
| H2 | same place | wide from behind at the water's edge / rail, still, 30 s | 2 | spare |

Delivery: original files (not through a messaging app) to the "footage" Drive subfolder, named `<ID>_t<N>.mov` (e.g. `A1_t2.mov`).
**Never committed** (`.gitignore` blocks `*.mov`, `*.MOV`, `*.m4v`, `/footage/`).

## What gets generated
Only the girl at the frost window (existing takes, reused), the radio-dish set for verse 2, and lives she can't film (one figure, one simple
action, drawn sparse). No group choreography, no orchestra, no singing faces. Spend should be well under v5's.

## Where it lives in the code
| piece | file |
|---|---|
| animatic show (whole song, every footage slot labelled) | `engine/show/v6.js` — `node engine/render.mjs --q "show=/engine/show/v6.js" …` |
| footage slots: shot ID → action + stand-in take | `engine/show/v6_slots.json` |
| her lives as branches (v6 LIFE, + jade/rare-earth, the violet commit) | `engine/show/life_v6.js` |
| text look: palette, charset, glyph atlas, TextGrid (cells), TextPass (glyph shader + the raw switch) | `engine/src/textlook.js` |
| the scene that draws a shot's layers | `engine/src/scenes/text.js` (kind `text`) |
| footage slots, labels, small lyrics, hooks, stars | `engine/src/v6/layers.js`; frame sequences `engine/src/v6/seq.js` |
| frost (intro 0–27.95, bloom at 222.73) | `engine/src/v6/frost.js` |
| build git log (125.34–153.17), outro git graph (257.51), end card (264.47) | `engine/src/v6/gitlog.js` (`buildLog`, `gitGraph`, `endCard`) |
| counter, commit messages → frost branch, dish, context meter, comet, air writing | `engine/src/v6/fx.js` |
| the switch (236.64) | `engine/show/v6.js` Outro A block (`raw(t, c, r)`) + `TextPass` raw cells |
| footage intake 1: auto-sync each phone clip to the song | `tools/footage/sync.py` → `work/footage/sync.json` |
| footage intake 2: frames for the engine + one pick per shot ID | `tools/footage/prep.py` → `work/footage/<take>/`, `work/footage/index.json` (override: `docs/footage_picks.json`) |
| stand-ins (existing takes) for the animatic | `tools/footage/standins.py` → `work/standin/` |

## Open questions (Jade's)
- A heads-up to her 2004 teammates (or the 2011 uploader) before the drop goes public? Their names stay out of the film and the repo.
- H1 location: Ocean Beach at sunset now, or the Austin roofdeck at sunrise, sky only?
- End-card wording, and whether the credits list the lives' commit messages.
