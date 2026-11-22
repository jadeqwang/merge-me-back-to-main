# Glyph art v10 (the catch as letters merging): resume note

Owner: glyph agent. Direction: `notes/v10_direction.md` section A (A1, A3, A4) + shimmer, with its "Timing corrections" (merge is one
slow arc; last letter on "become" 231.210, inside cb12). Background: `notes/glyph_v9.md`.
Code: `fable/take2/tools/glyphart/v10/`. Outputs (git-ignored): plates `work_fable/take2/plates/<id>/`, tests `work_fable/take2/dev/v10_glyph/`.

## Status
- [x] `v10/gl10.py` library: letters as signed-distance sprites (v8 atlas + em-box re-renders from the atlas fonts so letters keep
      baseline and width), union of letters morphing into a new letter (the fusion), keyline, glow.
- [x] A4 `v10/merge.py`: one simulation over cb10-cb12, rendered as three plates (below).
- [x] A3 `v10/coarse.py`: c2_hands, catch.
- [x] A1 `v10/atom_letters.py`: pre-rendered plate (letters atomize).
- [x] Shimmer: `v9/style1.sh ... --boil 0 --fill-k 4` (`*_glyph10`) then `v10/freeze.py` (`*_glyph10f`): static parts hold their glyphs
      (key frames 1 s apart, slow dissolve), moving parts keep per-frame glyphs. Frame-to-frame change / source: catch 3.9x (v9) -> 0.9x,
      c2_lookup_v2 3.1x -> 1.1x.
- [x] tests: `dev/v10_glyph/tests_A.jpg` (A3 + three A4 frames, 1920 crop and 640 full, + a merge close-up strip at 1920 and 640);
      `dev/v10_glyph/strip1/` (strips every 4th frame 219.7-231.7, clip.mp4 with the song, 960 px, renderer output only: no lyrics,
      no page-light); A1 stills `dev/v10_glyph/a1/`.
- [ ] full renders running/landed: see logs `dev/v10_glyph/logs/` (a1, a3, a4).

## How the merge works (A4)
- Base: night_jade aligned onto patch_settle's clean figure (matte bounding boxes: same height, top-centre) so all three shots share
  one frame; zoom 1.0 -> 1.035 baked over 223.135-235.038 (so `push: 0` on these shots).
- 223.135: ~150 coarse letters on her (violet = the note, and her own colours), the figure under them an underpainting (blurred, dim);
  face always clean. Twelve runs (branch word in branch colour, from the life's side, shots.js fold beats 0,1,2,3,4,4.5,5,...,7.5)
  land as readable words, rows kept apart.
- Merges start continuously from 223.4 (no percussion under the folds): a letter and a partner about one letter away slide together
  (0-62 %), overlap with each keeping its colour, then their union flows (SDF morph) into ONE new letter (pop 18 %, white-hot flash
  in the mixed colour), 10 % smaller and in a finer type each generation (bold -> book -> Z003 pen). From the 8th-note pulse (228.48)
  merges start only on pulse ticks and the count falls faster. The underpainting sharpens into the clean drawing as the count falls.
- Daylight 227.40-229.10: night -> day under a warm bloom from behind her (paper passes through bright, not grey).
- The last marks sink into the nearest line of the drawing; the last (violet) goes in at 231.210 = "become"
  (patch_settle_merge10 frame 32). After that: clean line; saturation and warmth keep rising to 235.038 (grade), not a still.

## For the compositor
1. cb10 (b130-131) is no longer `code: 'fold'`: make it a plate shot of `fold_merge10` (clip0 0, speed 1, `push: 0`); lyr as now.
2. cb11 `patch_hold` -> `patch_hold_merge10`; cb12 `patch_settle` -> `patch_settle_merge10` with clip0 0, NO clip1 (the frames are the
   shot, 1:1 in song time), `push: 0`. All three: frame i = song t0 + (i-1)/24.
3. vb10 `vio_still`: plate `vio_still_letters10` replaces the plate AND `opt.atom` (remove atom, or atomize() draws dust on top;
   skyGlints was called from atomize(): call it on its own if you want the glints). Frames are plate coordinates at 1920 (plate x1.5),
   no push baked: keep the shot's own push. Chip unchanged. The circle's letters leave east at the cut as a short line of pale-blue
   characters at about y 0.25-0.3 of frame (A2's streak can pick up from the left edge). `tools/atomize.py` needs no change.
4. cb08 `c2_hands` -> `c2_hands_letters10` (keep pageFly; the letters pour from the palms from 220.45, after the page opens),
   cb09 `catch` -> `catch_letters10` (its base is the de-shimmered style 1, `catch_glyph10f`). Same clip maps as now.
5. cb02 `c2_lookup_v2_glyph` -> `c2_lookup_v2_glyph10f` (same opt; frames 6-87 painted, rest copies).

## Wiring table
All under `work_fable/take2/plates/` (git-ignored), 1920x1080, 24 fps, `meta.json`, `REAL`, `still.jpg`.

| shot | replaces | folder | frames | frame 1 = song | settings / notes |
|---|---|---|---|---|---|
| vb10 | vio_still + opt.atom | `vio_still_letters10/` | 125 | 202.691 | atom_letters.py: size 34 px letters, hold 0.3 s as text, 12 % stars, swap 33 %; release timing as atomize() (lead .1, tail .45, soft .06); drop opt.atom |
| cb02 | c2_lookup_v2_glyph | `c2_lookup_v2_glyph10f/` | 121 (6-87) | 209.366 | style 1, boil 0, fill-k 4, then freeze.py key 24 |
| cb08 | c2_hands | `c2_hands_letters10/` | 121 | 219.737 | coarse.py c2_hands: letters 96-132 px, front from the palms 220.45-221.44, first 55 % violet |
| cb09 | catch_glyph | `catch_letters10/` | 121 | 221.436 | coarse.py catch on catch_glyph10f: 90-124 px, front 221.44-222.45 from r 170 at her hands, first 35 % violet, face clean |
| cb10 | code 'fold' | `fold_merge10/` | 84 | 223.135 | merge.py; push 0 |
| cb11 | patch_hold | `patch_hold_merge10/` | 84 | 226.532 | merge.py; push 0; daylight 227.40-229.10 |
| cb12 | patch_settle | `patch_settle_merge10/` | 125 | 229.931 | merge.py; push 0; no clip1; last letter in at 231.210 (f_0032); patch_settle frames 82-121 slowed underneath |
| (base) | - | `catch_glyph10/`, `catch_glyph10f/` | 121 | 221.436 | de-shimmered style 1 catch without letters (fallback) |

## Commands
    P=work_fable/venv_hybrid/bin/python; G=fable/take2/tools/glyphart/v10
    $P $G/merge.py --test 223.3,226.0 --out DIR [--closeup "T,OUT.jpg;..."]   |  $P $G/merge.py --render [--only cb10,cb11,cb12]
    $P $G/coarse.py catch|c2_hands --test T,.. --out DIR  |  --render --id <shot>_letters10
    $P $G/atom_letters.py --test T,.. DIR  |  --render
    $P $G/freeze.py GLYPH_ID SOURCE_ID OUT_ID first last
    $P $G/tests_a.py work_fable/take2/dev/v10_glyph/tests_A.jpg ;  $P $G/strip.py OUTDIR [t0 t1]
    bash fable/take2/tools/glyphart/v9/plate_mattes.sh ID   # mattes (c2_hands, patch_settle made this round)

## Weak / open
- The fusion is legible at 1920 and in close-up at 640; across the whole figure at 640 it reads as coalescing sparkles plus words
  arriving, the individual pair readable only for the larger letters (cb10). Later generations are small fine letters.
- Daylight: night_jade has closed eyes, patch_settle open: under the bloom (227.6-228.8) the face cross-fades (a brief double).
- cb10 at the cut from catch: framing jumps from medium to full figure (as in v9); letters smaller in frame there.
- No paid generation used or needed.
