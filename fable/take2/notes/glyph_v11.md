# Glyph art v11 (the corpus catch, a notation per life, size as the merge variable): resume note

Owner: glyph agent. Direction: `notes/v11_direction.md` sections "The corpus", A (A1, A3, A4), B (B2, B1). Her words:
`notes/jade_v10_notes.md`. Background: `notes/glyph_v10.md`, `notes/glyph_v9.md`.
Code: `fable/take2/tools/glyphart/v11/` (v9/v10 files untouched). Outputs (git-ignored): plates `work_fable/take2/plates/<id>11/`,
tests `work_fable/take2/dev/v11_glyph/`, fonts fetched (OFL) `work_fable/take2/dev/v11_glyph/fonts/` (Bravura, Noto Serif SC,
Indie Flower; downloads only, nothing sent).

## Status
- [x] step 1a: A tests `dev/v11_glyph/tests_A.jpg` (A1 x3, A3 x2, A4 x10 incl. 228.8/229.4 endgame; 1920 crop + 640 full; last row
      I vs 我 at 640 and close-up). Single stills in `dev/v11_glyph/a1/`, `a3/`, `a4/` (`*_wo` = 我).
- [x] step 1b: notation sheets `dev/v11_glyph/notation_<life>.jpg` (top x1.6 size, bottom x1.0 = v9 size), `notation_all.jpg` (x1.6,
      640 per tile); `notation_all_k10.jpg` = all at v9 size. Atlases `dev/v11_glyph/atlas/<name>.npz` + `_sheet.png`.
- [x] STOP 2026-11-22: reported. Main thread: catch GO (phrases approved, last mark `I` heavier, no `_wo`; A4 fixes: written layer held
      to ~228.0, survivors SLIDE into MERGE ME BACK TO MAIN and each later line, endgame letters in the family of the merging ones,
      ragged daylight edge without blotches); cb02 + catch base on the corpus atlas; hold-fire "Style:" tail removed from the corpus;
      B1 ramp approved (my values); B2 NOT yet: second pass as ink (notation2.py).
- [x] A4 revision (merge11.py): n_te 70 (about 70 letters still on her at 228.0), late fusions in threes; endgame: every parent
      travels to its slot and the group's union flows into the new letter there (old line slides into the new one), letters in mixed
      heavy faces, size +-7 %, baseline +-5 %, slight tilt, colour blending to violet, keyline; last `I` DejaVu Serif Bold 180 px
      thickened 1 px (stem about 31 px = 10 px at 640); daylight = star-shaped torn-paper edge (radius by angle, no islands) + fibre
      jitter. Stills: `dev/v11_glyph/tests_A4rev.jpg` (227.99, 228.49, 228.78, 230.72, 233.51 from the rendered plates).
- [x] catch renders: `render_v11.sh catch` (A1, A3 c2_hands, A4 x3 landed; catch base -> freeze -> A3 catch, cb02 running)
- [x] B2 second pass sheets: `dev/v11_glyph/notation2_<life>.jpg`, `notation2_all.jpg` (notation2.py), waiting for the main thread
- [ ] B1 renders: `render_v11.sh b1` running (8 shots, ids `<plate>_glyph11`)

## What v11 does (code in tools/glyphart/v11/)
- `gl11.py`: corpus loader (hold-fire's trailing Suno "Style:" prompt is cut: not sung), `G11.em_char(c, font)` (any char/font as
  an em-box SDF sprite; Noto Serif SC for hanzi), `segments()` + `fill()` (whole words along row pieces, lookahead keeps it dense).
- A1 `atom_letters11.py` (id `vio_still_letters11`): merge.txt words, row pieces filled in RELEASE order (first lines leave first),
  big letters keep their letter, small 34 -> 46 px (15 px at 640), big share raised so ~45 grow (62-92 px). 293 letters = 0.66 of the song.
- A3 `coarse11.py` (ids `c2_hands_letters11`, `catch_letters11`): Merge words in short runs, front order in bands, reading order
  inside a band; catch continues the song where the hands stop (word0 53). catch base = `catch_glyph11f` (to render: corpus atlas,
  de-shimmered as v10). Test used one corpus-atlas frame (`a3/catch_base/`).
- A4 `merge11.py` (ids `fold_merge11`, `patch_hold_merge11`, `patch_settle_merge11`): v10 merge_b mechanics imported unchanged; corpus
  words interleaved song by song (Merge violet), twelve life phrases (below) in branch colour, fusion child = one parent's own
  character in a finer type; endgame spells MERGE ME / BACK TO / MAIN (17, from ~26 survivors at 228.30) -> FOLD / ME IN (tick 3)
  -> MAIN (tick 5) -> ME (tick 7) -> I (tick 9, C059 Bold violet 170 px, sinks 230.69 -> 231.210). Glows lower/tighter, reveals
  letter-sized at 45 % (figure stays written), daylight front smoother. `A4_LAST=我` renders the alternative (`*_wo` ids).
- B2 `natlas.py` (atlases: staff_piano, staff_violin [Bravura], hanzi, dna ATGC + codons, rna ACGU + codons, ipa, poet [lower-case
  serif + corpus words <= 4 letters], greek_math, code, child [Indie Flower + Gothic, some mirrored], corpus [Latin + corpus hanzi]),
  `paint11.py` (paint.py + `upright`: glyphs stand upright, turn onto strong edges by <= 90 deg), `notation.py` (sheets),
  `s1.py` (runs v9 animate.py with paint11 + a v11 atlas: the style-1 re-renders). `sheets.py` composes tests_A / notation sheets.

## A4: proposed phrase per life (main thread approves)
| life | phrase | song |
|---|---|---|
| piano | my hands still know | Orbital Sunrise ("Can't think, can't write, but my hands still know") |
| violin | Silent and patient | Hold Fire |
| wushu | 学会七十二变 | Chaos Monkey (learned the 72 transformations) |
| biology | fin into foot into hand | Hold Fire |
| phd-neuroscience | my dissertation defense | Rewind |
| poet | 举杯邀明月 | Moongazing (Li Bai) |
| nasa-ames | coming in hot | Orbital Sunrise (landing) |
| rna-band | a chord that's searching | Hold Fire |
| hacker-houses | the hundred come along | Chaos Monkey |
| open-source | message in a bottle | Hold Fire |
| parenthood | tell me before I sleep | Chaos Monkey ("妈妈, will you tell me before I sleep") |
| rare-earth | looking for a friend | Rare Earth |

## Commands
    P=work_fable/venv_hybrid/bin/python; G=fable/take2/tools/glyphart/v11; D=work_fable/take2/dev/v11_glyph
    $P $G/natlas.py [NAME..]                                   # atlases -> $D/atlas
    $P $G/notation.py [--lives a,b] --size 1.6 --smin 16 --tag _k16   # notation stills (also --size 1.0 --tag _k10)
    $P $G/atom_letters11.py --test 203.5,205.0,206.5 $D/a1  |  --render          (A1_SIZE=46)
    A3_BASE=<frames dir> $P $G/coarse11.py catch|c2_hands --test T --out $D/a3  |  --render [--id X]
    [A4_LAST=我] $P $G/merge11.py --test T,.. --out $D/a4  |  --tests-b OUT.jpg  |  --render [--only cb10]
    $P $G/s1.py --atlas corpus -- <animate.py args as v9/style1.sh> --boil 0 --fill-k 4   # then v10/freeze.py for de-shimmer
    $P $G/sheets.py

## Open questions for the main thread
- B2 "apply": the v9 style-1 shots (GLYPH_S1 + ca01, oa03) all have MAIN JADE as subject; no style-1 shot has a life. The only glyphed
  life shots are STYLE 2: the wushu run (bu10-21, life wushu) and the orchestra (bu22-30, violin; her decision 7 "Keep upright
  letters"). Apply hanzi to wushu / staff to the orchestra (style 2 re-render), or leave B2 as the sheets only?
- 3:22-3:55 "only two scripts": cb02 `c2_lookup_v2_glyph10f` (209.4) and the catch base `catch_glyph10f` are v9 all-scripts glyph
  paint; I plan to re-render both with the corpus atlas (`*_glyph11f`). vb10's plate itself is not glyphed (fine).

## Wiring table
All under `work_fable/take2/plates/` (git-ignored), 1920x1080, 24 fps, `meta.json`, `still.jpg`; frame i = frame-1 song time + (i-1)/24.
Wire exactly as the v10 row each one replaces (glyph_v10.md "For the compositor"): same clip maps, push, opts.

| shot | replaces (v10) | folder | frames | frame 1 = song | settings / notes |
|---|---|---|---|---|---|
| vb10 | vio_still_letters10b | `vio_still_letters11/` | 125 | 202.691 | atom_letters11.py: merge.txt words in song order (Latin only, no swap), small 46 px, ~45 big 62-92 px; plate coords at 1920, no push baked (shot keeps its push); circle letters still leave east at the cut |
| cb02 | c2_lookup_v2_glyph10f | `c2_lookup_v2_glyph11f/` | 121 (6-87 painted) | 209.366 | style 1 on the CORPUS atlas (Latin + her hanzi only), B1 size x0.95, boil 0, fill-k 4, then v10 freeze.py; same opt as now |
| cb08 | c2_hands_letters10 | `c2_hands_letters11/` | 121 | 219.737 | coarse11.py: Merge lines as word runs, front from the palms 220.45-221.44, first 55 % of runs violet; keep pageFly |
| cb09 | catch_letters10 | `catch_letters11/` | 121 | 221.436 | coarse11.py on `catch_glyph11f` (corpus atlas, B1 x0.85, de-shimmered); Merge continues from word 53; face clean |
| cb10 | fold_merge10b | `fold_merge11/` | 84 | 223.135 | merge11.py; push 0 |
| cb11 | patch_hold_merge10b | `patch_hold_merge11/` | 84 | 226.532 | merge11.py; push 0; written layer held (~70 letters at 228.0); 228.30-228.71 survivors slide into MERGE ME / BACK TO / MAIN |
| cb12 | patch_settle_merge10c | `patch_settle_merge11/` | 125 | 229.931 | merge11.py; push 0; no clip1; FOLD / ME IN 229.12, MAIN 229.54, ME 229.97, `I` 230.39 (alone 230.69), sinks in at 231.210 (f_0032), eyes open there; daylight torn-paper front 25 % 232.5, 50 % 233.8, 80 % 234.6, full 235.038 |
| (base) | - | `catch_glyph11/`, `catch_glyph11f/` | 121 | 221.436 | corpus-atlas style 1 catch without letters (fallback) |
| (base) | - | `c2_lookup_v2_glyph11/` | 121 | 209.366 | corpus-atlas cb02 before freeze (fallback) |

B1 rows: below when the renders land.

## Weak / open
- Notations at 640: they read in flat light areas (poet, phd, biology, code screen, ames) and vanish into texture in busy plates
  (piano, wushu, band, parenthood) at either size; at x1.0 most are texture only. Larger (x2+) would read but coarsen faces.
- A4: survivors at 228.30 are ~26 (not 22): 26 -> 17 at tick 1. Corpus layer is 129 letters (v10 had ~230 overlapping glyphs):
  she is written in readable words but less densely. Some corpus words lose letters early (the phrase blocks clear what is under
  them; fusions start at once). Life phrases can overlap a neighbour block for a moment (bh check is per 6 blocks).
- A4 lone `I` (C059 Bold 170 px) is readable at 640 but thin (about 6 px stroke); 我 is denser. It stands alone only 230.69-231.21
  (shrinking as it sinks).
- Daylight front now smooth: reads as a soft white oval opening from her chest (no blotches/dark islands) but more "spotlight".
- A3 catch: 40 letters / 12 words (longer words later in the song, narrow allowed area with the face clean): sparse.
- A1: release order vs song order is by row piece, so a line's words leave together but lines interleave at the edges.
