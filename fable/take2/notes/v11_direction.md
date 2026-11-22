# Film v11 direction (2026-11-22)

Coordinator: Fable (main thread). Her words: `notes/jade_v10_notes.md` (verbatim). Background: `notes/v10_direction.md`,
`notes/v10_plan.md` (B1, B2, E1), `notes/glyph_v10.md`, `notes/glyph_v9.md` (Wiring table), `notes/listen_v10.md` (phrase maps).
Binding rules: HANDOFF.md "What Jade has decided" and "Rules that must not slip". v10 stays as built wherever this file is silent;
`?v11=0` must give the v10 cut. Never overwrite a plate id a render has used: new ids end in `11`.

## What she decided

| # | her answer | becomes |
|---|---|---|
| 1 | Catch: adjust at 3:25, 3:28, 3:42-3:44 | section A |
| 2-5 | patchwork gone, outro pacing, car hold, credits commit line: Right | no change |
| 6-10 | glyph styles, orchestra letters, drop slashes: Right/Keep; 0:39 glide: Accept; 4:01 glyph paper: Keep | no change; close those open items |
| 11 | G2 size as the merge variable: Yes | section B1 |
| 12 | G3 a notation per life: Yes. "I like the idea and would like to see what it looks like for each. go ahead and implement it in the next version. but use ACGU for the band and ATGC for biology." | section B2 |
| 13 | G5: No ("not enough time for a human eye to read that much text") | D1 dropped for good |
| 14 | G6: take the slab off for those bars | section E |
| 15 | v11 with my notes | this round |

## The corpus (new this round)

`tools/glyphart/v11/corpus/*.txt` + `SOURCES.md`: the sung words of Merge (`merge.txt`), her five published songs on jadewang.me
(rare-earth, orbital-sunrise, moongazing, rewind, hold-fire) and `chaosmonkey.txt`. 1,495 words. Scripts: English, and Simplified
Chinese in moongazing and chaosmonkey. **These are the only two scripts in the catch from now on**: no Cyrillic, Hebrew, kana,
Tibetan, Greek etc. anywhere in 3:22-3:55. Words stay words: a letter on screen in the catch always belongs to a real word or
line from the corpus, laid in reading order where there is room; no random single glyphs mixed with sense.

## A. The catch, revised (owner: glyph, wired by compositor)

Her question "how did you decide on the letters?": at 3:25 they were the characters of the handoff typed at 3:16 (`HANDOFF.md /
Read this first. ...`), with a third swapped for other scripts. Answer to her idea: yes.

| id | when | shot | change |
|---|---|---|---|
| A1 | 3:22-3:27 | vb10 | She comes apart into **the letters of this song**: `merge.txt` only, in song order (first lines leave first), Latin only, no script swap. Keep everything she liked ("3:25 is right and looks really good"): motion, release timing, the circle going last, the 50 large letters. Fix the told weak point if it costs nothing else: small letters are specks at 640, so raise the small size somewhat (test at 640). New id `vio_still_letters11`. |
| A2 | 3:28-3:31 | cb01 (and cb03 if the streak is seen there) | The streak is **just the filename as a comet's tail**: `HANDOFF.md`, once. The head is the bright point; the ten characters trail behind it along the path, largest and brightest nearest the head, stretching and thinning toward the tail, in violet-white, readable in at least several frames at 640. Nothing else in the streak (no "What comes next." text, no extra glyph trail). Timing unchanged: enters on 207.819, head at mark 209.526. Compositor owns this (it is drawn in code now); show a 6-frame strip before rendering. |
| A3 | 3:37-3:42 | cb08, cb09 | What pours into her hands and runs up her is the note = **Merge's own lines** (violet, first to arrive), set as words in short runs, coarse (largest of the film), face clean. No other scripts. New ids `c2_hands_letters11`, `catch_letters11`. |
| A4 | 3:42-3:55 | cb10-cb12 | Same merge mechanics and timings as `merge_b.py` rev c (count falls 22-16-8-4-2-1 on the 8th-note pulse, last mark in on "become" 231.210, eyes open there, daylight to 235.038). Changes: (1) at 223.135 she is written in **corpus words** (her own songs; Merge's lines violet, her own colours otherwise); (2) each of the twelve lives arrives as **a line or phrase from one of her songs in its branch colour**, not the branch's name (the chips and lanes already name the branches). Pick the phrase per life from the corpus so it fits the life (main thread approves the list; put it in the note). Chinese lines are welcome where they fit (moongazing's Li Bai lines, chaosmonkey's rap) at a size where hanzi read. (3) the **last mark is chosen: `I`** (serif capital, violet, from "Every life I've lived, I have become"; it sinks in on "become"). If a lone I is too thin to read at 640, show `I` and `我` side by side as test stills and the main thread picks. (4) fix the told weak points: letters are a bright haze around 224 (lower glow, keep counters open), most of the drawing is uncovered by 228.5 (hold more letters longer so the count-down from 22 is seen on a figure still mostly written), daylight front at 233-234.6 is a blotchy cloud with dark patches at top of frame. New ids `fold_merge11`, `patch_hold_merge11`, `patch_settle_merge11`. |

Tests before any range render: A1 (3 frames), A3 (2), A4 (224, 225, 226.5, 228.5, 230, 231.0, 231.3, 233.5) at 1920 crop and 640
full, on one sheet; main thread looks first.

## B. The glyph grammar (owner: glyph)

### B2. A notation per life (do this before B1; both land in the same re-renders)

Each life's style-1 glyphs come from its own notation instead of all scripts. Atlas additions must be OFL/free fonts already on
the machine or fetched from a public font repo (a font download sends nothing of hers).

| life (branch) | notation |
|---|---|
| piano, violin | staff notation (an OFL music font, e.g. Bravura or Leland: noteheads, clefs, rests, accidentals, dynamics; violin adds bowing marks, piano adds pedal marks) |
| wushu | hanzi strokes and radicals |
| biology | **A T G C** (her word), codon triplets |
| rna-band | **A C G U** (her word) |
| phd-neuroscience | IPA |
| poet | lower-case serif, her own lines (corpus) |
| ames | Greek and maths |
| hacker-houses, open-source | `{ } ; => / * |` and hex |
| parenthood | a child's capitals, some backwards |
| rare-earth (violet) | as placed in v9 (she answered "Right" on the styles as placed and yes to "all scripts kept for violet only"); EXCEPT in the catch, where section A rules |
| main Jade | until the catch: as v9. From 223 on: the corpus (section A) |

**She wants to see each one.** First deliverable: one sheet per life (twelve tiles, or two sheets of six) showing that life's
plate still painted in its notation, 1920 crop + 640 full, labelled. Saved for the review page as
`review/fable_take2/v11/notation_<life>.jpg` only for lives whose plate has no likeness (drawn plates are fine; nothing from
`likeness_local`). Then apply to every style-1 shot where a life is the subject (find them: Wiring table in `glyph_v9.md`, and
life plates in fold/grid/window shots only if they are already glyphed; do not glyph new shots). Shots of main Jade keep their
v9 scripts except for size (B1).

### B1. Glyph size as the merge variable

One size setting per style-1 shot, written into the Wiring table: largest at 0:29 (va02), stepping down through chorus 1 (ca01,
ca03, ca09, ca11), the float (ba01-05), cb02; the catch and merge (A3, A4) finish it; daylight is clean line. oa03 (4:01) keeps
its glyph paper (decision 10: Keep), at the finest size. Check each at 640: characters must still be characters.

## E. Slab lyrics off 3:39-3:58 (owner: compositor)

No slab or verse lyric drawn from cb08 through oa01 (219.737-238.450). Subtitles (.srt/.vtt) unchanged. Switch `?slab2=1` restores.

## C. Carried small fixes (compositor, only if cheap)

- Car box: start typing earlier so the finished line is up longer than 0.8 s; still gone by 272.543.
- dr35/dr36 +0.55/+1.10 frames: leave.

## Owners, order, checkpoints

- **glyph** (`tools/glyphart/v11/**`, note `notes/glyph_v11.md` with a Wiring table): A1, A3, A4, B2, B1. Order: A tests and the
  notation sheets first (stop and report), then renders after the main thread's word.
- **compositor** (only it edits `shots.js`, `src/`, `tools/` outside glyphart and listen; `notes/compositor.md` "Film v11"): A2,
  E, C now; wiring when glyph's table lands; then `film_v11` local + public (`likeness=0`), sheets, `review_v11.html`, check.py.
- **listen**: re-measures final v10 now; measures v11 after the render.
- Each keeps its resume note current and commits its own paths (never `git add -A`, never pushes). Spend at start $579.85; no
  paid generation is planned or approved this round beyond what HANDOFF already lists.
