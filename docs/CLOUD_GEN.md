# Generating from a cloud session (Seedance takes, GPT Image / nano-banana stills)

Written 2026-10-25 by the cloud session that integrated v5 (from a no-spend feasibility check; **not yet proven with a paid call**).
Jade OK'd spending the v5 queue (≈ $70.5, `docs/V5_BOX_RUNSHEET.md` §2) on 2026-10-25. The $600 cap is enforced from the committed
`docs/spend_ledger.jsonl`, so **pull before spending, and commit + push the ledger after every run.**

## Environment (Jade set these in the cloud environment; only NEW sessions see them)
- `GEN_KV_NS` (the relay's JOBS namespace), `CF_AUTH_VIA_PROXY=1` (the proxy attaches the token for api.cloudflare.com).
- Account id: `tools/gen/cfauth.py` now falls back from `CF_ACCOUNT_ID` to `CLOUDFLARE_ACCOUNT_ID`.
- Never print these values. Never deploy, modify or delete Workers or KV namespaces (we only put/get our own `job:`/`res:` keys via tools/gen).

## Setup (idempotent; outputs land in gitignored media/ and analysis_v2/stems/)
```bash
apt-get install -y ffmpeg 2>/dev/null || true          # /usr/bin/ffmpeg is usually there already
python3 -m pip install -q pillow jsonschema av          # av (PyAV) is REQUIRED before any collect: without it a billed take is logged failed and refunded
python3 tools/cloud_media_setup.py .                    # maps review/cloud/ (refs, face_v4, stills, drop plates, takes, stems) onto media/ paths
python3 tools/gen/spend.py                              # shows spend vs the $600 cap
```
Only `faceedit.py` / `canonprop.py` / `hairswap.py` need mediapipe: `python3.12 -m venv /opt/gen312 && /opt/gen312/bin/pip install
"mediapipe==0.10.21" "numpy<2" opencv-python-headless pillow jsonschema av`, then run them with `GEN_PY=/opt/gen312/bin/python`.

## Checks before the first paid call
1. KV access (read of a key that doesn't exist; writes nothing): expect `None`. `RuntimeError ... 401` = the proxied token lacks Workers KV
   Storage permission, and **every Seedance job is blocked** (Jade must add Workers KV Storage: Edit to the token). Stop and say so.
   `python3 -c "import sys; sys.path.insert(0,'tools/gen'); import gen; print(gen.kv_get('res:mergemain/__cloud_probe__', tries=1))"`
2. Dry runs (free): `python3 tools/sd/batch.py ch2_catch --takes=1 --t0=51 --dry`, `python3 tools/sd/stills.py ... --dry` (see the run sheet).
3. First real image: **one** cheap call. If the result download fails with a proxy 403 (`curl -sS "$HTTPS_PROXY/__agentproxy/status"` →
   recentRelayFailures shows the host), the image was billed but not logged: add the billed row to the ledger by hand and stop image work.

## Rules
- Use `--t0=51` or higher for cloud takes so tags never collide with the box's (the box is at t12).
- At most 3 image calls in parallel, 1 at a time for edits; pin lane colours in every edit. Seedance: submit, then `gen.py wait`.
- Intake (depth/matte prep), lip-lag measurement, picks and renders are box-only (CUDA models, GPU Chrome). Hand takes to the box by
  committing each `media/gen/<tag>_<id>.mp4` as `review/takes/<tag>_<id>.mp4` (< 100 MB each) **plus** its `media/gen/specs/<tag>.json`
  as `review/takes/specs/<tag>.json` (intake's `spec_for()` needs it for s0/timing/duration), and new stills/plates under
  `review/takes/stills/`. Add a "needs intake/render" entry at the bottom of `docs/RESUME.md` listing every tag.
- Look at every still and take you keep (Read tool on frames) before committing: canon face, eyes as in the still, the 1420 MHz patch on
  the LEFT upper arm, RARE EARTH + pale-blue circle on the back (no extra band), lane colours right, nothing showing her kids.
- Public repo: never commit Cloudflare values, Jade's competition video or its URL, or anything with her kids.
