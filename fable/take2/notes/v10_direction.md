# Film v10 direction (2026-11-22)

Coordinator: Fable (main thread). Source: `notes/v10_plan.md` (read sections 2A, 2C, 6) and the essay `notes/art_direction_fable.md`.
Jade's words this round, verbatim:

- G1 (catch as climax): yes. "I think there's something really cool about letters merging together that the patchwork jacket was
  only metaphorically gesturing at."
- G4: "yes to clear the outro"
- Her ask: actually check the film against the song (plan section 6); stop writing "nobody has watched it at speed" as a bare caveat.
- 2026-11-22, new session: "Please check out the handoff notes and start the v10 vision of this music video"

She has sent no v9 notes. Gates G2, G3, G5, G6, G7, G8 are unanswered, so plan sections B, D, E, F are NOT built. v9 stays as
built wherever this file is silent (`?glyph=0` and all v9 switches keep working). Binding rules: HANDOFF.md "What Jade has decided"
and "Rules that must not slip".

Scope of v10 = **A (the catch as letters merging) + C (clear the outro) + L (measure picture against the song) + carried v9 fixes.**

## A. The catch: letters merging (3:16-3:53, b114-b137)

The image, in her words, is letters MERGING: into each other and into her. Not only landing, not only shrinking. On screen a
viewer should see separate characters from separate lives meet, overlap and become one mark, and the marks become the line she is
drawn in. That is what the patchwork jacket stood for; the patchwork goes (or shrinks to a trace) and the merge is shown literally.

| id | when | shots | what | owner |
|---|---|---|---|---|
| A1 | 3:22-3:27 | vb10 `vio_still` | Violet comes apart into letters, not dust: the characters of the handoff typed at vb08 (`HANDOFF.md / Read this first. / Where things stand. / What it cost to learn. / What comes next.`), all-scripts look. Edges inward as now; the pale-blue circle goes last; the rim is empty. Chip unchanged. | glyph makes the sprites/frames, compositor wires |
| A2 | 3:28-3:31 | cb01, cb03 (v7 seq 12); cb02 `c2_lookup_v2_glyph` between | What crosses the sky is a short streak of those same characters, readable as characters in at least a few frames, not a dot. It ENTERS frame and its head reaches its mark on the downbeat (listen agent gives the ms). The plate's own meteor in cb02 stays. | compositor |
| A3 | 3:37-3:42 | cb08 `c2_hands`, cb09 `catch` | The letters pour into her open hands and run up her: for these two bars she is visibly written in COARSE glyphs (largest size of the film here) on hands, arms, jacket, hair. Face stays in the clean focus region. Violet's characters are violet; they are the first to arrive. | glyph |
| A4 | 3:43-3:53 | cb10 `fold`, cb11 `patch_hold`, cb12 `patch_settle` | The twelve fold in one per beat as now, but each arrives as a run of letters in its branch colour, and on each beat the letters on her MERGE: neighbours slide together, overlap, fuse into one finer mark (pairs into one, again and again: a visible coalescing, not a cross-fade and not a uniform shrink). By b132 the marks are the clean line of the drawing. cb11: the poster frame is the merged Jade (clean line, full colour and daylight arriving), not the patchwork; at most a one-bar trace of the twelve mediums if it helps the settle. "Every life I've lived, I have become" lands on the frame the last letter sinks in (listen agent gives the word time). cb12 ends as now on clean coloured daylight Jade. | glyph + compositor |

- Tests before the range: glyph agent shows stills of A3 (catch, coarse) and three frames of the A4 merge at 1920 and at 640 px;
  the main thread looks before the range is rendered. If letters are not visibly letters at 640 px, size goes up.
- Fix in the same pass: style-1 shimmer on near-static plates (catch, c2_lookup): lower the boil or freeze background glyphs.
- Compare clip for Jade: v9 vs v10, 3:16-3:58, with sound, side by side or back to back (local, likeness allowed locally only).

## C. Clear the outro (3:55-4:42, b137-end)

Music is fixed: cuts re-divide bars. The listen agent's phrase map (`notes/listen_v10.md`, "Outro phrase map") is the authority
for where the new cut points fall; build C as a rough cut, measure, then finish.

| id | change |
|---|---|
| C1 | oa01 `like_sing1` (3:55): the drawing settles into the traced likeness instead of a hard cut; no slab over her face. |
| C2 | Cut the stance oa06 (4:07): oa05 fork takes b143.1-145.1 as one shot. |
| C3 | Cut the aerial oa08 (4:12): the graph ob01 starts at b147, about 8.5 s; the cherry-pick label holds about 3 s at 32 px or more. |
| C4 | Cut the 2 s log burst in ob02: credits shorten, road ob03 and car ob04 start earlier; the car gets about 8.5 s: box types (2.5 s), is read (2.5 s), fades, then about three clear seconds of her face. First build: hold/extend with what exists (3D clip is code, so `car3d` can simply run longer; the aleph-2 `car_v9` needs a hold with breathing or a new take). A new aleph-2 take over a longer clean 3D clip (about $3) is approved if the hold looks dead; it should also lose the console scribble (1.6-2.3 s) and the cyan diamond. |
| C5 | One real handoff commit line in the credits, held long enough to read; the typed `git cherry-pick` uses that commit's real short hash. No personal data beyond what the repo already shows. |
| C6 | Window ob05 stays 5 s or more; last frame equals frame 0 (loop exact with HUD off). |

Unchanged: the rainbow wave run oa07 (G8), "she doesn't look", `YOU` never seen, 4:01 glyph paper as v9 (decision unanswered).

## L. Picture against the song (plan section 6) — owner: listen agent, note `notes/listen_v10.md`, tools in `tools/listen/`

1. Audio by measurement from `inputs/Merge (keychange down).wav`: loudness/energy, onsets, spectral flux, mel-spectrogram images
   per section, vocal band energy for phrase starts/ends, against the bar map and the subtitle cue times. FIRST deliverable
   (within the first half hour, compositor waits on it): **phrase map for b114-b137 and b137-end**: downbeats, hits, drop-outs,
   vocal phrase in/out, in song seconds and bar.beat, with the spectrogram read, not inferred from the lyric sheet.
2. Baseline on film v9 (local file): per-shot visual energy (frame difference, cut rate) vs audio energy for the whole film, one
   plot; cut-to-beat offsets in ms for every cut.
3. When v10 passages land: dense frame strips (every frame or every 2nd) with energy curve and beat ticks beneath for 3:16-3:58
   and 3:55-4:42; per-event offsets in ms (streak arrival, first letter in her hands, last letter closing, "become" word, each new
   outro cut, box finished typing, smile). Report measured vs waiting-on-Jade.
4. Cut the short with-sound clips for her ear, one question each (compositor renders; listen agent proposes the list).
No audio, song or likeness goes to any outside service.

## Carried from v9 (do in this round)

- dr20 cut registers +2.1 frames late: fix (compositor).
- Shimmer on catch / c2_lookup (glyph, above). Car scribble and diamond (with C4 if a new take is made).
- NOT this round, waiting on her v9 decisions: va07 0:39 glide, orchestra letters, 4:01 paper, va01 face, bu09.

## Owners and order

- **glyph** (`tools/glyphart/**`, `notes/glyph_v10.md`): A1 sprites, A3, A4 merge renderer, shimmer. Tests first.
- **compositor** (only it edits `shots.js`, `src/`, `tools/` outside glyphart and listen; `notes/compositor.md` "Film v10"): A1/A2
  wiring, A4 timing, C1-C6, dr20; then `film_v10` local + public (`likeness=0`), sheets, `review_v10.html`, check.py.
- **listen** (`tools/listen/**`, `notes/listen_v10.md`): section L.
- Each keeps its resume note current, commits its own paths (never `git add -A`, never pushes). Main thread looks at every test
  and sheet, pushes at checkpoints. Spend at start: $579.85.
