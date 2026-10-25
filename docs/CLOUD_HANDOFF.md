# Handoff: continuing "Merge" from Claude Code on the web / phone (2026-10-24)

Jade is travelling from 2026-10-25. This note is for whichever Claude picks the project up next: a cloud session (claude.ai/code,
the phone app's Code tab) or a Remote Control session on the Linux box. Read this first, then `docs/HANDOFF.md` (ground rules, map,
commands), `docs/REVIEW_FOR_JADE.md` (her decisions, newest at the bottom), and `docs/RESUME.md` (checkpoint log).

## Jade's plan (2026-10-24): Claude Code cloud + GitHub + open-artifacts
The Linux box stays on. Jade will mostly work through **cloud sessions on this GitHub repo**, plus an "open-artifacts" setup she's building
with another Claude instance (ask her for its details; don't guess at how it works). Consequences for a cloud session:
- **Generation works in the cloud** (Jade set up Cloudflare credentials on cc cloud, 2026-10-24). tools/gen reads, from the environment:
  `CF_ACCOUNT_ID`, `GEN_KV_NS`, and either `CLOUDFLARE_API_TOKEN` or, when the token is a cloud *network secret* that the proxy attaches,
  `CF_AUTH_VIA_PROXY=1`. Network access must allow `api.cloudflare.com`. The tools are stdlib-only Python (3.11+ for tomllib); `ffmpeg`
  comes from apt (`apt-get install -y ffmpeg` in the setup script). Run them with `python3`, not the box's venv paths (batch.py falls back).
- **Spend cap across machines:** every billing row is also written to the committed `docs/spend_ledger.jsonl` (union-merged), and
  `tools/gen/spend.py` counts it, so the $600 cap holds in the cloud too. **Commit and push the ledger after every generation run.**
- Renders, stills, depth/matte prep (`tools/sd/intake.py`) and lip-sync picks still run only on the box (GPU + plates). A cloud session that
  generates takes must get the mp4s to the box (see "Media transfer" below) and add a **"needs intake/render"** entry at the bottom of
  `docs/RESUME.md` (what, which `--q` params and time range).
- Review media is big: the 720p film is ~1.2 GB and the comparison clips are 45–90 MB each. Artifact pages have size limits (claude.ai
  artifacts: 16 MB per page), so plan on stills, contact sheets or short low-bitrate excerpts there, not the film itself.
- If a render bridge is built (e.g. a GitHub Actions **self-hosted runner** on the box): the repo is **public**, so the bridge must never run
  on pull requests from forks. Trigger it only on `workflow_dispatch` or pushes by Jade, and keep the Cloudflare credentials off it. Ask Jade first;
  it's her machine.

## Media transfer (GitHub, files up to 100 MB)
TBD with Jade: the code repo is public, and generated takes and review renders show her likeness. Proposed: a separate **private** repo for
media (takes from cloud sessions, review excerpts ≤100 MB), which the box pulls into media/gen/ and out/review/. Not set up yet.

## Two ways to work, and what each can do

| | **Cloud session** (fresh VM, clone of github.com/jadeqwang/merge-me-back-to-main) | **Remote Control** (a session on Jade's Linux box, driven from web/phone) |
|---|---|---|
| Sees | the repo only: engine/, tools/, docs/, analysis timing JSON | everything: media/ (~2 GB), work/ (~14 GB: prepped plates, takes), out/ (renders), inputs/, the venvs |
| GPU / render | **no** GPU, 4 vCPU; `engine/render.mjs` needs the plates in work/plates + headless Chrome with GPU, so **no renders** | yes (RTX 3090): renders, stills, contact sheets |
| Generate (Seedance, GPT Image…) | **no**: needs work/cf_account_id.txt + KV ns (never committed, never put in cloud env vars) | yes, through tools/gen (budget cap enforced) |
| Good for | editing the EDL (`engine/show/main.js`), tools, shot prompts (`tools/sd/shots_*.py`), docs, planning, code review | anything that touches pixels: renders, picks, lip-sync, new takes |
| Hand back | push a branch / PR; the local session pulls it | commit + push as usual |

How Remote Control is started (on the box, before Jade leaves, or by her over SSH): `tmux new -s merge`, `cd ~/Documents/merge-me-back-to-main`,
`claude remote-control` (or `/remote-control` inside a running session). The process must keep running. Docs:
https://code.claude.com/docs/en/remote-control.md · cloud environments: https://code.claude.com/docs/en/cloud-environments.md.
Moving between them: a cloud session's pushed branch can be pulled locally (`claude --teleport` or just `git pull`); `claude --cloud "task"`
starts a cloud session from the pushed branch. Keep git clean and pushed before switching.

**Cloud-session rules on top of HANDOFF.md:** never print, log or commit the Cloudflare values. Never deploy, modify or delete Workers or KV
(we only use the relay through tools/gen). Don't attempt renders; write the change, push a branch, and leave a note in `docs/RESUME.md`. The repo is **public** (Jade's choice): code and docs only, never media, renders or
her kids' anything.

## Where things stand (end of 2026-10-24)

Spend ≈ $300 of the $600 cap (`tools/gen/spend.py`). Everything below is committed except media (local).

**Done since v3** (all of Jade's 12 decisions in REVIEW_FOR_JADE.md, "Jade's decisions, 2026-10-24"):
- Canon face v4 on every face shot (`media/plates/face_v4/`), straight-on shots turned ~20° (they read more like her), sleeve patch fixed.
- 10 singing shots re-animated on the revised song (v2 stems); picks in `docs/picks_manual.json`, lags in `docs/lags.json`
  (envelope correlation from tools/sync/lipsync.py, checked against word strips `work/takes/*_ws.jpg` where it disagreed).
- Drop = wushu: changquan group set (bar 89), duilian exchange, her jian solo (bar 95), duilian into the salute line, then the fold
  (`tools/sd/shots_drop.py`, plates `media/plates/drop/`).
- Folds: two gestures, `?fold=palms` (default) | `?fold=reach`; centre copy has the canon face/hair.
- Home shot on the final "Back to main…" (out_main, v2 line 25), then the git-log card.
- Outro: orchestra of Jades (piano, violin, electric guitar, conductor) replaces the K-pop afterglow (`tools/sd/shots_outro.py`).
- Post-credits (14.5 s after the song): adult Jade beside 5-year-old Jade at the frosted window, palm-to-palm light; the idea arrives in
  the frost as the logistic-map bifurcation (`FX.frost` in main.js), painted look. No equations, no book title (Jade: "only a shape, an
  idea"). Sound (`tools/mix.py` v2 → `out/mix_v4.wav`): one chime as the light passes, then 1-2-4-8 chimes as the shape blooms.
  **The Hilbert Hotel lobby is cut** (Jade, 2026-10-24: "window only"; v1 keeps it).
- Figures are glyph-built (no LED dot grid): `figGlyph` in `engine/src/scenes/lattice.js`; `?figlook=led` restores the old look.
- Her earlier films in the life montage, both ways for her to choose: `?pv=flash` | `?pv=screens` (default off).

**Waiting on Jade** (review page `out/final/watch.html`, local):
1. Fold gesture: palms vs reach (both folds).
2. Earlier films: flash vs screens vs neither.
3. The full v4 film: lip-sync by ear (esp. 0:28 split, lag 1.21 s measured; 3:49 "Every life", lag 0.12 s by word strip), the drop, orchestra, post-credits.

**Known nits / next ideas**
- dr_jian: in the final balance her right sleeve faces camera, so the patch shows on the wrong arm (small at 720p).
- dr_duilian take 2: one copy vanishes mid-take (6→5); its first ~4.5 s are slow (only the end is used).
- Hair variants per life (wushu ponytail/buns done in the drop; tech/house teal tips, biology braids) for the life-montage plates.
- After Jade picks: set the fold/pv defaults in main.js, render the 1080p master + X cut (`tools/teaser.py`), re-mix (`tools/mix.py`).

## Commands (Remote Control / local only)
- Review render: `node engine/render.mjs --q "show=/engine/show/main.js" --from 0 --to 294.8 --res 1280x720 --audio --workers 3 --mp4 out/review/v4/x.mp4`
- Stills: `node engine/render.mjs --q "show=/engine/show/main.js" --stills 72:a.png,93:b.png --res 1920x1080`
- Watch page: `.venv/bin/python tools/watch_page.py` → `out/final/watch.html` (VIDEOS list; `clip@<s>` for excerpts)
- New Seedance takes: add to a `tools/sd/shots_*.py`, then `$PY tools/sd/batch.py SHOT --takes=2 --dry`, submit, `gen.py wait`, `.venv/bin/python tools/sd/intake.py` (run ONE intake at a time), `tools/sd/picks.py`.
