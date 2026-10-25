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
Jade's call (2026-10-24): videos go in **this public repo**, under `review/` (tracked; everything else in media/out/work stays ignored).
Keep each file < 100 MB (GitHub hard limit; > 50 MB only warns): split long renders into parts (see `review/v4/README.md`).
- Box → Jade / cloud: render, re-encode (e.g. 720p ~8.5 Mb/s, ≤ 75 s per part), copy into `review/vN/`, add a README line, commit, push.
- Cloud → box: generated takes can be committed under `review/takes/` (each < 100 MB); a box session copies them into `media/gen/`,
  runs `tools/sd/intake.py` (one run at a time), picks, renders.
- Don't commit anything showing her kids, and nothing larger than needed (history keeps every version forever).

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

## Where things stand (2026-10-25, after the v5 cloud integration)

Spend: $284.32 of the $600 cap in the committed ledger (`tools/gen/spend.py`; the box said ≈ $300). Code, docs and the ledger are committed;
media stays local. **v4** is the last rendered film (`review/v4/`). **v5** is integrated in code on `claude/wonderful-mccarthy-f90kll`, with
nothing generated or rendered yet. The box's next job is **`docs/V5_BOX_RUNSHEET.md`**: about $70 of re-takes and new shots, intake, picks,
mix, and review renders.

**v5, in code** (Jade's v4 review + her decisions of 2026-10-25; note by note in REVIEW_FOR_JADE.md, "Jade's notes, 2026-10-25"):
- Opening and title: the poem is shown whole from frame 0; the title is MERGE alone. The jade/home message reads "taught kids the Copernican
  model at 10:30pm". Defaults: `?fold=reach`, `?pv=screens`.
- Lags were re-measured from the raw takes and the vocal stem (`docs/lags.json`). The box must rerun `picks.py`.
- 1:07: `intro_up` plays in every forktree use (v4 froze it on its last frame). Pane figures are glyph-built like the lattice scene
  (`?figlook=led`).
- 2:17 build: her poem "Privilege Escalation" as small annotated moves on the git graph.
- 3:30 and 4:12: interim trims, active only while the old takes are picked. They end before the smile/grin; 3:30's hook carries over the
  drone tree. A picked re-take restores each full shot.
- Orchestra (3:56–4:09): cuts on the music, and the composer is the **violet branch** writing the score in light (`FX.score`). Reframed v4
  takes stand in until the `orch_*` takes are picked. `?orch=v4` keeps the conductor version.
- 4:15–4:24: the **living git graph** (lives fork out of main as panes, merge home, violet cherry-picked last) replaces the git-log card and
  the bookend. It starts where the home shot ends.
- Drop: duilian, then the group set rebuilt from Jade's real routine (six copies, the group fall on bar 97, main in for the salute). It is
  wired to replace the v4 drop only once all six takes are picked (`?drop=v4|v5`). The v5.1 plates (STILLS) and EDL are done
  (`docs/wushu_v5_design.md` §9–10, `docs/wushu_groupset_notes.md`). The queue is in the run sheet, §2.1.
- Post-credits: the **violet branch sends** the light (`v2_horizon_t5`); the girl alone at the intro's window (`ch0_window_t2`, slowed)
  sees it touch the glass once, and the bifurcation grows from that point. `tools/mix.py` plays one 1-2-4-8 chime cascade from the touch
  (`out/mix_v5.wav`). No new takes; `pc_kneel`/`pc_beam` are unused. The Hilbert Hotel lobby stays cut.
- Seedance specs: re-takes live in `tools/sd/shots_v5.py` (`RETAKES`, same keys) and new shots in the shots files. The eye guard now keeps
  the still's eyes ("large … eyes" made redrawn eyes grow). First frames and edits are in the `STILLS` tables, run via `tools/sd/stills.py`.

**From v4, unchanged:** canon face v4 on every face shot; the 10 singing shots on the revised song; folds; glyph-built figures; her
earlier films as screens; the home shot on the final "Back to main…".

**Waiting on Jade:** the v5 review renders (run sheet §4). Lip-sync by ear, after `picks.py`, for 0:32 / 0:44 / 1:11 / 3:54 and every
re-take. The `lf_wushu_gold` caption nit. Whether to fix the pre-existing held frames listed in run sheet §4.

**Known nits / next ideas**
- dr_jian: in the final balance her right sleeve faces camera, so the patch shows on the wrong arm (small at 720p).
- The forktree copies are still LED sprites (`engine/src/scenes/forktree.js`); the life panes (`lf_*_t1`) keep pre-v4 faces.
- Hair variants per life (wushu ponytail/buns done in the drop; tech/house teal tips, biology braids) for the life-montage plates.
- After v5 is approved: render the 1080p master + X cut (`tools/teaser.py`) with `out/mix_v5.wav`.

## Commands (Remote Control / local only)
- Review render: `node engine/render.mjs --q "show=/engine/show/main.js" --from 0 --to 294.8 --res 1280x720 --audio --workers 3 --mp4 out/review/v4/x.mp4`
- Stills: `node engine/render.mjs --q "show=/engine/show/main.js" --stills 72:a.png,93:b.png --res 1920x1080`
- Watch page: `.venv/bin/python tools/watch_page.py` → `out/final/watch.html` (VIDEOS list; `clip@<s>` for excerpts)
- New Seedance takes: add to a `tools/sd/shots_*.py`, then `$PY tools/sd/batch.py SHOT --takes=2 --dry`, submit, `gen.py wait`, `.venv/bin/python tools/sd/intake.py` (run ONE intake at a time), `tools/sd/picks.py`.
