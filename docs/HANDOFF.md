# HANDOFF — "Merge" music video (Jade Q Wang, album *Rare Earth*)

Status 2026-10-24 ~13:00: **v2 delivered**, Jade is reviewing. She called it "a fantastic start". Read this, then `docs/REVIEW_FOR_JADE.md`
(what she's been asked to decide), then `docs/RESUME.md` (checkpoint log, newest at the bottom). Wait for her notes before changing anything.

## Ground rules (from Jade and prior projects; non-negotiable)
- **Real photos of Jade herself may be sent to models** (she said so on 2026-10-24, correcting an earlier over-cautious rule), e.g.
  `inputs/selfie_hairdown_jade_jacket_retouch_v2.png` as a likeness reference. **Never send real photos of her kids**; keep the kids stylized,
  not close-up (her family rules from the moongazing project: kids are M, a 4-year-old girl with light-to-medium brown waves, and T, a 7-year-old
  boy tall for his age with very dark brown hair; family gaming happens in the downstairs play room, not the living room).
  Still don't post frames or videos publicly yourself (Artifacts, uploads); Seedance `reference_videos` needs a public URL, so ask her first.
- **Never deploy, modify or delete Cloudflare Workers or KV.** We only *use* the relay Worker `rare-earth-v3-relay` through tools/gen.
- No git commits or pushes unless she asks (this directory isn't a git repo anyway). Never print or commit `work/cf_account_id.txt` or `work/gen_kv_ns.txt`.
- Budget: hard cap `MERGEMAIN_CAP` (default $600), enforced by tools/gen. Spent ≈ **$146** (list-price estimate; `tools/gen/spend.py`).
  She has explicitly asked us to *spend more on improvements*, economically. Seedance 720p costs about $0.23/s (≈$1.85 per 8 s take); a nano-banana-pro still ≈ $0.13.
- Her tone brief: epic techno-optimist, SF tech Twitter, AAA 3D sci-fi, light Tron, K-pop formation energy. **No fear angle, no
  downstream-harm-to-humans framing.** No "GPT slop". Lyrics on screen at varied scale, composed with the figure.

## Who she is (use this as source material; she said her real lives are "much more salient" than invented vignettes)
Memory file: `~/.claude/projects/-home-jade-Documents-merge-me-back-to-main/memory/jade-life-chapters.md`.
- Piano before age three, violin in school, self-taught guitar, band Robot Ninja Apocalypse 2011–13.
- Biologist (Stanford, 2005 paper), then neuroscientist (Northwestern PhD 2010, Kraus auditory lab), then NASA Ames research.
- **Published poet during grad school.** **Bronze medal, collegiate wushu (group set), undergrad.**
- Entrepreneur: Chez JJ hacker houses; Sandstorm (open source), then Cloudflare DevRel; tech demos and open-source talks on stage.
- Parent; her kids appear only from behind (she hasn't confirmed she's OK with even that; it's an open question in the review doc).
- Likeness notes (memory `jade-3d-likeness-eyes.md`): larger, very dark brown eyes with a distinct double-eyelid crease, slightly taller upper head.
  The **1420 MHz sleeve patch** (white circle, black ring, "1420 / MHz", on the LEFT upper arm) and **RARE EARTH + big pale-blue circle on the back**
  must be right. She flagged black-dot or gibberish patches, and those are now fixed.

## The concept (docs/concept.md, docs/style_bible.md)
**Fidelity = how merged she is.** Every pixel is redrawn in WebGL from Seedance plates (rgb + depth + matte). Raw clips are never shown.
- World = **coloured ASCII** (brightness-ramp glyphs; lyric letters take over the highlights), after her `inputs/mmorpg_ascii.png` reference.
- Her figure: **written** (ASCII, `written: true` shots) → **coarse LED** (`fid .25`) → **fine LED** (`fid 1`). Only use fid 1 or .25 on held
  shots; fractional values read as a screen door.
- Drop = first full merge: the world switches to **painted** light (`look: 'paint'`).
- Branch lane colours (jacket bands and headphones): main orange; rose, sky, mint, gold, violet, white for branches.
- **Drone tree of life** (`inputs/tree_of_life_drones.png` ref): `engine/src/scenes/dronetree.js` (API in its header). The trunk is main, with 10
  forks to 1,024 tips. Used at the breakdown peak (119.1–125.9) and in Chorus 2 "every road" (214.6–222.7).
- Lore carried from earlier songs: 1→1,024 Banach–Tarski splits (intro), Hilbert Hotel post-credits, the violet bun-and-pencils branch at the
  1420 MHz dish whose context fills (Verse 2), git-log credits with her commit cherry-picked into main.

## Where things are
| what | path |
|---|---|
| song / lyrics / refs (read-only) | `inputs/` (`Merge Me Back to Main.wav`, lyrics .md, character_sheet.png, mmorpg_ascii.png, tree_of_life_drones.png) |
| measured timing (bars, beats, every word) | `analysis/timing.json` (~138.2 BPM with drift; **always cut on measured bars/beats**, `T.bar(n)` in the EDL) |
| the whole show (EDL) | `engine/show/main.js`: `TITLE`/`SUBTITLE`, `L` lane colours, **`LIFE` table** (her lives: shot, branch, lane, commit msg, hash) |
| engine | `engine/src/main.js`, `lattice.js` (LatticeLayer shader, RAMP), `post.js`, `type.js`, `ledtext.js`, `plateseq.js`, `scenes/{lattice,forktree,dronetree,panels,card}.js` |
| plate prompts | `docs/plates.json` → `tools/plates/gen_plates.py ID… [--n=2]` → `media/plates/<id>[_a/_b].jpg` (copy the chosen one to `<id>.jpg`) |
| costume repair | `tools/plates/fix_patch.py NAME.jpg …` → `media/plates/fix/` (batch.py prefers fixed stills). Pin lane colours in `NOTES` or it repaints bands orange |
| Seedance shots | `tools/sd/batch.py` `SHOTS` dict; `batch.py SHOT… --takes=N --t0=K` (use a new `--t0` so tags don't collide) |
| collect / prep / sync metrics | `tools/gen/gen.py wait IDS…` then `.venv/bin/python tools/sd/intake.py` → `work/plates/<take>/`, `work/takes/<take>_{strip,ws}.jpg`, `.sync.json`, `.labial.json` |
| take choice + lip lag | `docs/picks_manual.json`, `docs/lags.json` → `.venv/bin/python tools/sd/picks.py` → `work/picks.json` (the EDL reads it) |
| audio | `.venv/bin/python tools/mix.py out/mix_v2.wav` (song bit-identical + split chimes + lobby + bell at 286.85 for `pc_hotel_t5`) |
| deliverables | `out/final/`: `master_v2.mp4` (CRF 17), `merge_v2_1080p.mp4` (X, 2-pass 12 Mb/s), `merge_v2_teaser_x.mp4` (1:22), v1 files for comparison |
| review page | `out/final/watch.html` (open via file://; karaoke from timing.json clocked by requestVideoFrameCallback). Rebuild: `.venv/bin/python tools/watch_page.py` |
| QA sheets | `out/review/qa2/` (v2), `docs/patch_audit.json` (patch audit of every plate/take) |
| old versions of edited files | `work/*.v1.*` |

## Commands
```bash
# Pythons: generation = moongazing venv; prep/intake/picks/mix/teaser = project .venv; sync tools = OSPY
PY=/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python
OSPY=/home/jade/Documents/1-music-shipped/orbital-sunrise-video/video/out/.venv/bin/python
export FFMPEG=/home/jade/Documents/1-music-shipped/moongazing/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2  # no drawtext

# stills / contact sheets / full render (render.mjs serves the project itself; ~13 min for the whole film at 3 workers)
node engine/render.mjs --q "show=/engine/show/main.js" --stills 72.8:out/test/a.png --res 1920x1080
node engine/render.mjs --q "show=/engine/show/main.js" --sheet out/test/s.jpg --from 0 --to 297 --every 4 --res 480x270
node engine/render.mjs --q "show=/engine/show/main.js" --from 0 --to 297 --res 1920x1080 --mp4 out/final/master_vN.mp4 --audio --audiofile out/mix_v2.wav --workers 3 --crf 17
# X encode: 2-pass libx264 -b:v 12M -maxrate 16M -bufsize 24M, aac 256k, +faststart (see RESUME ckpt 8).  Teaser: .venv/bin/python tools/teaser.py MASTER OUT
# partial fix without full re-render: tools/splice.py MASTER SEG T0 T1 OUT
```
Note: contact sheets at 480×270 look blocky because lattice cell sizes are in pixels. Judge the look at 1080p.

## Lip-sync method (do it the same way)
Clip time = song time − S0 + lag. Choose the lag from the **mouth word strips** (`*_ws.jpg`: crops at each word onset for candidate lags; look
for open "I/ah", rounded "gone/o", closed labials) together with the envelope correlation (`best_lag_s`, `corr` in `.sync.json`). The labial
scorer often disagrees, so trust the strips. Takes where the camera pushes in from full body fail face tracking (`face_found` low) and also break
layouts built around a fixed framing (v1_split_front ghost copies), so reject those. **Flag every lag for Jade's ear.** Her earlier project saw
the Debian desktop player add A/V offset, so she checks sync in `watch.html`.

## Gotchas we hit
- `pgrep -f`/`pkill -f` with a pattern that appears in your own shell command matches itself: waiters deadlock and kills take out your own
  shell (exit 144). Wait on files or log lines instead, or kill by PID.
- nano-banana-pro accepts **at most 3 reference images** (catalog schema). Faces: `media/style/r6/canon_face_front.png`, `canon_face_34.png`;
  body: `media/style/r7/turn_gpt_patch.png` (turnaround plus an enlarged patch inset); bun: `media/style/r7/bun_nbp.jpg`.
- A blanket "No text" in a plate prompt destroys the sleeve patch. `gen_plates.py` now rewrites tails so the patch is the one sanctioned lettering.
- Image-edit repairs drift toward canon orange on lane-coloured branches, so always pin the lane colour.
- Running 6 image calls in parallel produced HTTP 500 (code 6001); keep it to 3, and use 1 for edits.
- Unquoted heredocs run backticks (e.g. `git log` in markdown) as commands. Use `<<'EOF'`.
- Some EDL cuts reference **clip times** inside a take (drop cuts `[bar, plate, clipTime, sun]`, `pc_hotel` bell). If you swap a take, re-check those
  (bell = `bell_t` in `tools/mix.py`).

## Open decisions (Jade's), from REVIEW_FOR_JADE.md
1. Commit messages for her lives (edit `LIFE` in `engine/show/main.js`): violin line, "kept the neurons alive (first paper, 2005)", "PhD: how the brain listens (2010)", etc.
2. Kids on the couch (shown only from behind): keep or cut `lf_home_mint`.
3. Lip-sync by ear at 1:30 and 3:48 (new takes) plus the earlier ones (0:28, 0:42, 1:10, 3:01, 3:28).
4. Credits wording; the poster homage in the build (kept, no Cloudflare marks).

## Ideas not yet done (only if she wants them)
- Use more of her lives in the drop/outro the way wushu became the bar-95 formation (e.g. the band or piano as a formation beat; a guitar hit on a drop accent).
- Second takes for any life clip she dislikes (cheap: ≈$1.85 each). The wushu solo take holds a static horse stance after about 3 s.
- Likeness upgrade now allowed: regenerate key close-up plates (ch1_main, ch1/ch2_gone_close, out_main) with her real selfie as one of the 3
  reference images (in place of `canon_face_34.png`), then re-animate and re-sync. Ask her which shots first.
- The home shot (`lf_home_mint`) is set on a living-room sofa with generic kids. Per her family rules it should be the downstairs play room, with the kids
  matching M and T (stylized, from behind). Worth a regen if she keeps the kids in.
- Leftover patch nits: `v2_horizon` (patch on both sleeves), `v2_release` (patch on the right arm). Both are low-density branch shots, barely visible.
- Codex via tmux was offered in the original brief for mechanical tasks; we haven't needed it.
