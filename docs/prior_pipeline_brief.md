# Prior pipeline brief for "Merge Me Back to Main"

Compiled 2026-10-23 by reading the code and docs of vibesong, rewind-take-two, the 1-music-shipped projects and the
Claude memory files. It is read-only research: nothing outside `merge-me-back-to-main/docs/` was changed. **No secret
values are reproduced here**, only where they live.

The most useful prior single docs (read these when you need more depth):
- `/home/jade/Documents/vibesong/docs/research/past_work.md`: a 726-line digest of OS, RE, MG/MGP and RW2. Some paths in it are stale; see §0.
- `/home/jade/Documents/vibesong/media/cutscenes/README.md`: the Seedance 2.5 singing-card log, take by take.
- `/home/jade/Documents/vibesong/docs/v48_brief.md` Part B: the acting-direction rethink.
- `/home/jade/Documents/1-music-shipped/rewind-take-two/render/engine/README.md`: the most complete JS-engine doc.
- `/home/jade/Documents/1-music-shipped/moongazing/docs/GEN_OPS.md` and `/home/jade/Documents/1-archive/rewind-music-video/docs/GEN_API.md`: the "gen media documentation" in markdown (details in §2).

Abbreviations: OS = Orbital Sunrise, RE = Rare Earth techno remix, MG / MGP = Moongazing (family cut / public cut),
RW1 / RW2 = Rewind take one (archived) / rewind-take-two, VS = vibesong.

---
## 0. Environment facts (verified today)

| Thing | Value |
|---|---|
| **Gen python (use this)** | `/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python`. It has jsonschema, PyAV, PIL, numpy, torch (CUDA), faster-whisper, stable-ts, demucs, beat_this, torchaudio, transformers. |
| MediaPipe python (lip and face tools) | `/home/jade/Documents/1-music-shipped/orbital-sunrise-video/video/out/.venv/bin/python` (mediapipe 0.10.14, cv2, matplotlib). The VS docs call it `$OSPY`. |
| VS light venv | `/home/jade/Documents/vibesong/.venv/bin/python` (librosa, scipy, soundfile, imageio-ffmpeg). **No jsonschema or av**, so `gen.py` fails under it. |
| ffmpeg | Not on PATH. Use the static 7.0.2 build at `/home/jade/Documents/1-music-shipped/moongazing/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2` (the same build sits under `vibesong/.venv/...`). It has **no drawtext**; libass works, so burn text with ASS or Pillow PNG layers. There is no ffprobe: use PyAV (`gen.probe`). `moongazing/.venv/bin/ffmpeg` is a dangling symlink. |
| Chrome / Node | `/usr/bin/google-chrome` 153.0.8010.36; Node v22.23.2 at `/usr/bin/node`; GPU RTX 3090. |
| codex / tmux | `/home/jade/.local/bin/codex`, `/usr/bin/tmux`. Live tmux sessions: `moongazing`, `public-cut`, `rewind-rev`, `rewind-v4`, `vibesong-codex`. |
| Disk | `/` has 409 GB free (the old 97 %-full warnings in the VS/RW2 docs are obsolete). `/tmp` is a 16 GB tmpfs, 50 % used: always `export TMPDIR=<project>/out/tmp` for Chrome and ffmpeg. |
| Path moves | rewind-take-two now lives at `/home/jade/Documents/1-music-shipped/rewind-take-two` (`~/Documents/rewind-take-two` no longer exists). Moongazing lives at `~/Documents/1-music-shipped/moongazing`. The docstrings in `tools/gen/*.py` still say `~/Documents/moongazing/.venv/bin/python`; that path is gone. |

---
## 1. Generation pipeline (Cloudflare unified catalog plus the KV relay)

**Auth and ids** (`tools/gen/cfauth.py`):
- **Token:** the Wrangler OAuth token in `~/.config/.wrangler/config/default.toml` (`oauth_token`, `expiration_time`), read at call time.
  - Within 2 minutes of expiry it runs `npx -y wrangler whoami` to refresh it. If that fails, Jade runs `npx wrangler login`.
  - Env `CLOUDFLARE_API_TOKEN` wins if it is set.
- **Account id:** env `CF_ACCOUNT_ID`, else the first token of `<ROOT>/work/cf_account_id.txt`.
- **Relay KV namespace id:** env `GEN_KV_NS`, else `<ROOT>/work/gen_kv_ns.txt`.
- Copies of both id files exist in `vibesong/work/` and `1-music-shipped/rewind-take-two/work/` (mode 600, gitignored).
- **There are no provider API keys anywhere.** Every model, ElevenLabs included, goes through Jade's Cloudflare account.

**Endpoints** (`cf.py`):
- Unified catalog: `POST https://api.cloudflare.com/client/v4/accounts/{acct}/ai/run`, body `{"model": "...", "input": {...}}`.
  - The result is `{"result": {"state": "Completed", "result": {"image"|"video"|"audio": url|data-uri}}}`.
  - The URLs are presigned and expire, so download promptly.
- Workers AI: `POST .../ai/run/@cf/<model>`, with the input as the body.
- Jade's rule (memory `cloudflare-model-preference`): prefer `@cf/` when both exist, and give Veo a real try (Ricky leads Veo).

**Sync calls (images, TTS, music, ASR):**
- `cf.py MODEL OUT '<json>' --tag=x [--dry-run]`, or `cf.generate(model, inp, out, tag=...)`.
- It validates the input against `docs/gen_catalog/<author>-<model>.json` (jsonschema), estimates cost from the catalog card, enforces the spend cap and logs to `media/genlog.jsonl`.
- It refuses video models unless `--allow-video`.

**Video (async relay) — `tools/gen/gen.py`:**
- `gen.py submit` PUTs `job:<minuteBucket>:<PREFIX><tag>-<10hex>` (the job body is `{"model", "input"}`) into the JOBS KV of the existing Worker **`rare-earth-v3-relay`**.
  - That Worker runs on cron `* * * * *`, with bindings AI and JOBS (the namespace is `rare-earth-v3-jobs`).
- The Worker runs exactly that minute's keys:
  - It writes `state:<id>` and calls `env.AI.run`, with about a 15-minute wall limit.
  - It mirrors the outputs into `media:<id>:<n>[:<chunk>]` (20 MB chunks, 21-day TTL) and writes `res:<id>`.
- Buckets start at now + 2 minutes, with `GEN_PER_MINUTE` (default 2) jobs per minute. They also count other projects' queued keys.
- The job body must be **24 MiB or less**. Shrink inputs with `gen.py ref-image` (JPEG, 2048 px max) and `audio-ref` (mp3, 192k).
- Latency is about 5–5.5 minutes from submit to file for a 5 s clip.
- In VS, a few jobs sat at the provider for about 3 hours and died (v48 S2). A job still `running` after 30 minutes hit the wall limit: resubmit it.
- `requeue` is only for `stale` jobs (the cron minute was missed and more than 10 minutes have passed).
- **Standing rule: never deploy, modify or delete Workers or KV namespaces.** Only write and read your own prefixed keys.
- CLI:

```
PY=/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python
$PY tools/gen/gen.py spec TAG bytedance/seedance-2.5 --prompt "..." --image ff.png \
     --audio inputs/song.wav@62.40+5 [--ref-image x.png ...] --set duration=5 --set resolution=480p --set use_virtual_avatar=true
$PY tools/gen/gen.py submit media/gen/specs/TAG.json --dry-run     # schema + cost, no spend
$PY tools/gen/gen.py submit media/gen/specs/TAG.json               # queue
$PY tools/gen/gen.py wait ID [ID ...] [--timeout=1800]             # poll + collect -> media/gen/<tag>_<id>.mp4
$PY tools/gen/gen.py status | collect [IDs]
$PY tools/gen/gen.py audio-ref SRC START DUR OUT.mp3               # exact window; mp3 adds ~25 ms LAME delay
$PY tools/gen/spend.py [--tags]                                    # running total vs cap
```

**What `gen.py` handles for you:**
- Spec JSON: `{"model", "tag", "notes", "input"}`. Any `"file:<path>"` string becomes a data URI at submit time.
- It fills the required Seedance defaults (`DEFAULTS`: 5 s, 480p, 16:9, fps 24, `camera_fixed`, `watermark`, `output_format`, `use_virtual_avatar:false`, `generate_audio:false`).
- It builds minimax/h3's `content[]`.
- It strips the `data:` prefix for Veo's `image_input`, which wants raw base64.
- It blocks `xai/grok-imagine-video*`, because the ZDR account needs a presigned `output.upload_url`.
- `media/gen/manifest.json` is file-locked, because parallel collectors once raced and dropped takes in RE.
- `vgen.py` adds per-shot takes: `media/gen/<SHOT>/take_N.{spec.json,json,mp4}` plus a 6-frame sheet, from `tools/gen/shots.py` `SHOTS`.

**Spend tracking (`spend.py`):**
- It sums `media/genlog.jsonl` (sync calls plus relay submits; errored jobs are refunded) and `media/gen/spend.jsonl` (vgen).
- Cap: env `VIBESONG_CAP`, then `REWIND_CAP`, then `VGEN_CAP`. The default is $400 in VS and $600 in the RW2 copy.
- `cf.generate`, `gen.submit` and `vgen.submit` refuse to cross the cap.
- All figures are list-price estimates: the token cannot read the bill, and errored runs are normally not billed.
- **Gotcha:** there is no estimator for `flux-video-upscale` (priced per MP-s), so it logs $0. VS hand-logged `cost_note`s instead.
- VS spent $153.62 in total (Seedance 2.5 $73.9 over 113 calls, nano-banana-pro $28.9, Veo 3.1 $18.4, gpt-image-2.5 $11.8, Veo fast $11.4).

**Job-id prefixes already in code:** `moongazing/` (MG, MGP), `rewind/` (RW1), `rewind2/` (RW2), `vibesong/` (VS).
RE used a webhook relay and no KV prefix. **Use `mergemain/` for this project.**

**Can you run vibesong/tools/gen in place from a new root? No.**
- `ROOT` comes from the file's own location (`cfauth.ROOT` = three directories above `tools/gen/cfauth.py`).
- Run in place, it would therefore:
  - read VS's `work/` ids and `docs/gen_catalog/`;
  - write VS's `media/gen/`, `media/genlog.jsonl` and spend logs;
  - tag the jobs `vibesong/`.
- Hard-coded values to change after copying:
  - `PREFIX = "vibesong/"` (gen.py:58).
  - `FFMPEG` default (gen.py:63; points into `vibesong/.venv`, still valid but foreign; set `FFMPEG=` instead).
  - `RELAY` (keep it).
  - `shots.py` (Rewind and VS shot entries: replace with an empty `SHOTS = {}`).
  - The spend cap env names.
  - The cutscene tools hard-code `/home/jade/Documents/vibesong/work/demucs/htdemucs_ft/song/vocals.wav`, `work/song.wav` and the VS ffmpeg path (`lipsync.py`, `pb_sync.py`, `compose.py`, `pb_slot.py`), plus VS time constants (`compose.py` `J_IN`, `wordstrip.py` `EV`, `pb_tmplsync.py` `SEG`).
- Suggested copy:

```
cd /home/jade/Documents/merge-me-back-to-main && mkdir -p tools/gen docs/gen_catalog work media/gen
cp /home/jade/Documents/vibesong/tools/gen/{cfauth,cf,gen,spend,vgen,catalog}.py tools/gen/
printf 'SHOTS = {}\n' > tools/gen/shots.py
cp /home/jade/Documents/vibesong/docs/gen_catalog/* docs/gen_catalog/        # 2026-10-17 cards, 2026-10-19 live probe
install -m 600 /home/jade/Documents/vibesong/work/{cf_account_id.txt,gen_kv_ns.txt} work/   # never print/commit
sed -i 's#^PREFIX = "vibesong/"#PREFIX = "mergemain/"#' tools/gen/gen.py
export FFMPEG=/home/jade/Documents/1-music-shipped/moongazing/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2
export VIBESONG_CAP=<agreed budget>        # or rename the env var in spend.py
$PY tools/gen/catalog.py --probe-only      # free re-probe of what's live
```
Add `work/`, `media/` and `*.mp4` to `.gitignore` before any git init.

---
## 2. Models in the catalog (`vibesong/docs/gen_catalog/`, cards @c7e5b29 2026-10-17, LIVE.tsv probe 2026-10-19)

**Where the "Seedance 2.5 gen media docs" live.** There is no standalone Seedance doc. The markdown descriptions are:
- `/home/jade/Documents/1-archive/rewind-music-video/docs/GEN_API.md`, the "Seedance 2.5 answers" section (lines 42–75): limits, avatar mode, the schema gotcha and a sample payload.
- `/home/jade/Documents/1-music-shipped/moongazing/docs/GEN_OPS.md`: the model table, gotchas and smoke tests. A duplicate is at `1-archive/rewind-music-video/docs/GEN_OPS.md`.
- `/home/jade/Documents/1-music-shipped/rewind-take-two/docs/TOOLS.md`.
- `/home/jade/Documents/vibesong/docs/research/past_work.md` §2.

The authoritative schema is the JSON card `vibesong/docs/gen_catalog/bytedance-seedance-2.5.json`. Copies are in `rewind-take-two/docs/gen_catalog/`, `moongazing/docs/gen_catalog/` and `1-archive/rewind-music-video/docs/gen_catalog/`.

**Seedance 2.5 (`bytedance/seedance-2.5`), full input schema.** `additionalProperties:false`, and these are required: `duration, resolution, aspect_ratio, fps, camera_fixed, watermark, output_format, use_virtual_avatar`.

| Field | Spec |
|---|---|
| `prompt` | string ≤2000 chars. Optional if any ref is given (audio-only input is allowed). |
| `image` | first frame (URL or data URI) |
| `last_frame_image` | needs `image`. In first/last-frame mode `aspect_ratio` is forced to `adaptive`. |
| `reference_images` | 0–30. Aspect 0.39–2.5; references wider than 2.5:1 are rejected (RE). |
| `reference_videos` | 0–10, ≤30 s total. **In practice a data URI fails with 7003, so a public HTTPS URL is required** (§3). |
| `reference_audios` | 0–10, ≤30 s total, URL or `data:audio/...` |
| `duration` | integer 4–30, or −1 for auto. Editing a reference video allows only −1. |
| `resolution` | `480p` \| `720p` |
| `aspect_ratio` | `16:9` `4:3` `1:1` `3:4` `9:16` `21:9` `adaptive` (the default) |
| `fps` | const 24 |
| `camera_fixed` | accepted, but has no effect: say it in the prompt |
| `generate_audio` | bool. **Always false with the song as a ref**: output audio trips the copyright filter. |
| `seed` | accepted, but not reproducible |
| `output_format` | `mp4` \| `mov` |
| `use_virtual_avatar` | routes `image`, `reference_images` and `last_frame_image` through ByteDance's virtual-avatar library so AI characters pass face and deepfake detection. **True beat false every time for Jade.** RE used false for anime with refs only. |

Prices per second: non-video input $0.1028 at 480p and $0.2312 at 720p; with any video ref, $0.4304 and $0.9676.
Output: 854×480 or 1280×720 at 24 fps, but portrait and 4:3 do come back (§3). The 5 s 480p smoke test took 138 s of
generation and 295 s from submit to result.

**Video models (list prices per second unless noted):**

| Model | Key inputs / limits | Price | Prior verdict |
|---|---|---|---|
| `bytedance/seedance-2.0` | image, last_frame_image, reference_images ≤4, single `reference_video`; 4–12 s; up to 4k; aspect also 9:21 | $0.07 / 0.15 / 0.37 / 0.78 (480p / 720p / 1080p / 4k); video input $0.172 / 0.372 / 0.914 / 1.866 | Best composition lock with first+last frame (VS A3: 0.89 inliers). RW2's keyframe-locked workhorse. Drifts to a grey wash after ~0.5 s in engraved styles. |
| `seedance-2.0-fast` / `-mini` | same; mini adds `reference_audio` (music only) | $0.06 / 0.12 · $0.04 / 0.09 | unused |
| `google/veo-3.1` | prompt, `image_input` (first frame only, raw base64), `duration` "4s"/"6s"/"8s", aspect 16:9 / 9:16 / 1:1, 720p/1080p, `generate_audio` | $0.20/s at 720p/1080p (×2 with audio), 4k $0.40 | Beautiful at 1080p. **It cannot take our audio, so it sings on its own clock** (fit +0.42–1.57 s). Trim its ~0.8 s / ~20-frame ease-in. Used for silent Charlie/Ricky playing shots and aerials. |
| `google/veo-3.1-fast` | same | $0.08 (720p) / 0.10 (1080p) / 0.25 (4k); audio $0.10 / 0.12 / 0.30 | Best top-down sweep in VS |
| `minimax/h3` | `content[]` (text, first_frame, last_frame, reference_image, video_url, audio_url); 4–15 s; 768P/2K | $0.08 (768P) / 0.13 (2K) | MG workhorse. Returns the raw MiniMax CDN URL (collect fast). Carries an AAC track (`-an`). Repeats frames 2–3×. |
| `minimax/h3-max` | same + `extra.prompt_expansion_mode`; 480P/768P | $0.05 / 0.08 | |
| `minimax/hailuo-2.3` (`-fast`) | first_frame_image, 6 or 10 s, 768P/1080P | 6 s@768P $0.28 (fast $0.19) | never used |
| `pruna/p-video-avatar` | image + audio = explicit lip-sync; 720p/1080p | $0.025 / 0.045 | **Rejected in VS:** reframes to a frontal close-up, burns garbled captions, mangles the pencils. |
| `pruna/p-video` (`-replace`, `-animate`) | image+audio / identity swap / animate | $0.02–0.06 | p-video rejected; `p-video-replace` failed with 7003 |
| `black-forest-labs/flux-video-upscale` | input_video, upscale_factor 1.5–3, creativity | precise $0.07/MP-s, creative $0.10 | **Used on every VS card** (precise, creativity 0, 2.25× / 1.5×). Frame-exact (mouth-curve corr 0.98–0.99 at shift 0). Linework, patch and caps survive. |
| `black-forest-labs/flux-3-video` | `mode` t2v/i2v/v2v | hd $0.17, fhd $0.29, v2v $0.41–0.53 | v2v only continues a clip; it does not edit |
| `google/gemini-omni-flash` / `-1.1-flash` | text, image, last_frame, reference_images ≤10, video, audio; 360p–4k | token-priced (video out $17.5/1M), ~$4.8–7.5 per try (VS estimate) | specs written, never run |
| `runwayml/gen-4.5` / `aleph-2` | image_input / video_uri edit | $0.12 / $0.336 | aleph-2 failed with error 2047 (a provider credential error behind the Cloudflare proxy) |
| `xai/grok-imagine-video(-1.5-preview)` | needs `output.upload_url` | $0.05–0.14 | **unusable** (ZDR account) |
| Other live models | alibaba wan-3.0 ($0.05 / 0.10 / 0.20), wan-3.0-prime, wan-2.7-i2v, hh1/hh1.1 ($0.14–0.28); vidu q3-pro/turbo ($0.04–0.15); pixverse v6 ($0.025–0.115), v5.6; lightricks ltx-2-5-fast ($0.09–0.37); topaz starlight upscalers ($0.12/unit); **bria/v-rmbg-3.0 video background removal $0.0225/s** | | untested |

There is no Kling, no "Hailuo 3", no ElevenLabs SFX model and no `@cf/` video model.

**Image models:**

| Model | Key inputs | Price | Verdict |
|---|---|---|---|
| `google/nano-banana-pro` | prompt, `image_input` ≤3, aspect (16:9, 21:9, …), `image_size` 1K/2K/4K (2K = 2752×1536) | $2/1M in, $120/1M out: ~$0.134 at 1K/2K, ~$0.24 at 4K; 17–29 s | The house model for painted / pencil / ink styles and **the best editor**. It invents glyphs in seals and signs and returns the old picture when that picture is among its inputs. |
| `openai/gpt-image-2.5-sunburst` (best) / `-flare` (fast) | `images` ≤16, `quality` low…max, `size` 1024², 1024×1536, 1536×1024 (**no 16:9: crop**) | $30/1M out-image tokens: ~$0.19 at high 1536×1024 | Character sheets and sprites (all VS sprites); the RE canonical sheet. Its edit mode is too conservative. |
| `openai/gpt-image-2`, `-1.5` | same family | ~$0.06 at medium | RW1 anime first frames, with the faces pasted back |
| `google/nano-banana-2` / `-2.1` / `-2-lite` / `nano-banana` | + `google_search` / `image_search` grounding | $60 / $30 / $30 / $30 per 1M out | research references (OS) |
| `xai/grok-imagine-image-2.0` / `-quality` / base | **`response_format:"b64_json"` required**; images ≤5/10; mask | $0.04 (+$0.01/input) / $0.05 / $0.02 | throwaway layouts only: kitsch, adds typography |
| `bytedance/seedream-5-pro` / `5-lite` / `4.5` | image ≤10 / ≤14 | $0.045 / $0.035 / $0.04 | barely used |
| flux-2-max/pro/flex, flux-3-image-klein, krea-2/3, recraft v3/v4.x (incl. vector), qwen-image-3.0-pro, bria fibo, pruna p-image(-edit, -upscale, -try-on) | | $0.005–0.30 | RE bake-off only |

**Audio and ASR:**
- ElevenLabs: `elevenlabs/eleven-v3`, `multilingual-v2`, `turbo-v2-5`, `flash-v2-5`.
  - Input `{text, voice_id, output_format:"mp3_44100_128", voice_settings, seed}`; supports tags like `[whispering]`; $0.0001/char.
- `elevenlabs/music-v2`: `{prompt | composition_plan, music_length_ms 3 s–10 min, force_instrumental}`, $0.0025/s. It is also the SFX substitute.
- Also listed: minimax music-2.6 ($0.15/track) and speech-2.8, openai tts-1(-hd), inworld TTS, gemini TTS.
- ASR:
  - `xai/grok-stt`: the cleanest, $0.0017/min, word times.
  - `@cf/openai/whisper-large-v3-turbo`: word stamps, but it hallucinates on vocal chops.
  - Also `assemblyai/universal-3.5-pro` and `openai/gpt-4o-transcribe`.
- `google/gemini-3.8-flash` was used as an outside reviewer of a 540p cut (RE, RW2).

---
## 3. Lip-sync learnings (Seedance 2.5, `reference_audios` + `use_virtual_avatar`)

**Recipe that worked (VS bridge and cards, OS, RW2, MGP):**
- **First frame:** an approved still, chest-up, centred.
- **Audio ref:** the exact song or vocal-stem window, starting ~0.3 s before the first sung word, in a gap. VS used the demucs vocal stem for most cards.
- **Settings:** `generate_audio:false`, `use_virtual_avatar:true`, 480p, 5–6 s. 480p was VS's choice: every 720p VS take "barely moved the mouth on 一笔一画" and synced worse. RW2 did fine at 720p.
- Then measure the lag, cut a frame-exact slot, upscale with `flux-video-upscale` precise, and build lag variants for Jade's ear.
- **Convention everywhere:** `clip time = song time − S0 + lag`, where S0 is the song time of the audio-ref start.

**Measured lags vary per take; never assume 0:**
- VS bridge keeper `cut_jsing_centre_t2`: 0.00. Jade later picked +0.10 (picture ahead).
- Cards 03/04/05/06 Pass B: +0.08 / +0.10 / 0.00 / +0.25. The v2 stills gave +0.32 / +0.04 / +0.008.
- v4.8: 03 A1 −0.12, 04 t2 −0.25, 05 −0.105.
- **Card 06 B3 sang the whole line 0.92 s late at its own tempo.** A closure-based measure (−0.10) locked onto the wrong syllables, and Jade heard it "off by syllables". Fixed with a constant fit of +0.933.
- On the bridge, 画 arrives ~0.38 s late after a held 一 (drift inside the take). Fixed with an optical-flow time warp (`tools/cutscenes/pb_brwarp48.py`); card 03 used `pb_warp03.py` (a +0→+6 frame ramp inside a held vowel).
- RW2 S1: +0.45 to +1.00, drifting, so the sync was piecewise. **Jade picked +0.90 against a measured +0.10.**
- OS: 0.2–1.5 s.

**How the tools measure** (`vibesong/tools/cutscenes/`, run with `$OSPY`):
- `lipsync.py CLIP S0 [--win=A,B]`: the FaceMesh inner-lip gap (landmarks 13/14) divided by face height (10–152), correlated with the RMS envelope of the demucs vocal stem over lags −0.2…+2.4 s.
  - It also reports `eye_dist_ratio` and `face_h_ratio` against frame 0: the head-shrink and drift check.
  - Writes `.sync.json` and `.sync.png`.
- `pb_sync.py`: the same, restricted to a plausible lag range (default −0.4…+0.8 s), with a face crop.
- `wordstrip.py` / `pb_wordstrip.py TAKE S0 LAGS OUT.jpg "label@t,..." [CROP]`: a grid of mouth crops at key syllables (closed on b/m/p, open on vowels), one row per candidate lag. **This was more reliable than envelope correlation**, which is useless on legato or doubled lines (all four card-03 takes scored 0.15–0.18).
- `pb_tmplsync.py`: a phoneme template from the stem's word map, plus a per-labial closure error.
- `pb_mouthplot47.py`: overlays the mouth curve in song time at candidate lags.
- `facecmp.py` / `facemeasure.py`: side-by-side face crops against the approved sheet.
- `compose.py lagopts`: three offsets side by side with the song.
- `pb_slot.py TAKE S0 LAG IN OUT OUT.mp4`: a frame-exact slot at 30 fps. It uses `setpts=PTS-ct0/TB,fps=30:start_time=0`; an input `-ss` snapped up to a frame early.
- **Process rule (memory `jade-review-by-video`):**
  1. Build a syllable map over the whole take first (vocal onsets vs mouth open/close), and check for a tempo mismatch (that needs a warp, not an offset).
  2. Render switchable 540p variants (+0/±2/±4/±6 frames, or wider) with audio on one browser page.
  3. **Trust her ear over the metrics.**

**Aspect and composition failures:**
- 16:9 requests came back **portrait**:
  - The VS keeper itself was 480×854.
  - Medium framings on card 04 came back 560×752 (2 of 3 takes).
  - RW2 got 4:3 1112×834.
  - The schema says first-frame mode forces `adaptive`, and the model also recomposes.
- **Never name a shot size in a first-frame prompt.** "Close-up of the young woman…" made all 6 card-03 takes ignore the still (recomposed, off-model face, 2 portrait).
  - Pin the composition instead: "Animate the first frame exactly as drawn: same framing and composition, … The camera drifts slowly in toward her." (`tools/cutscenes/pb_specs48.py` `PIN`)
  - RE could say "Close-up" because it used `reference_images` without a first frame.
- **Portrait fallback:** frame the take as a paper card on a 16:9 background (`tools/cutscenes/card.py`). An off-centre first frame or a landscape request also shrinks her head (OS).
- **Keeping an approved take's motion at a new aspect or resolution:**
  - The method is `reference_videos`, which returned **7003 User Input Error for data URIs** (not billed). It needs a public URL; OS hosted its takes on raw.githubusercontent.com.
  - A temporary litterbox upload was blocked by the permission system. Publishing her likeness needs Jade's explicit OK.
  - The ready spec is `vibesong/media/gen/specs/cut_jsing_r720_t1.json`. Video refs also raise the price ~4×.

**Face and costume drift seen:**
- Iris shrink of 7–19 % within a clip (RW1).
- Face rounds out or goes doll-like at the end of a push-in.
- Glossy lips. Fix with "Natural lips, no gloss, no lipstick, no makeup".
- The chest dot turns into a second "1420 MHz" label. Fix: paste the still's chest back per frame (`pb_dotfix.py`).
- Gibberish sleeve patch. **Never paste a rigid disc**; Jade sees it float. Rewrite only the text inside the take's own drawn label, writing only on label-white ≥5 px from the border (`pb_label48.py`).
- Pencils dropped when a hand goes to the chest, unless the prompt keeps the pencil in that hand.
- The privacy filter ("PrivacyInformation") is probabilistic: reshuffle refs or drop the face close-ups.
- Seedance idles before and after a phrase, so measure lag only over the window you use.

**Prompt phrasings that worked:**
- Likeness: "Same face as the first frame", "forehead smooth, brows relaxed", "Do not redraw, beautify, slim, age or restyle her face".
- Style: "A colored-pencil drawing on cream paper comes to life, hand-drawn in every frame… never a photo or 3D".
- Sync: one sentence, "She sings the words of the reference audio with precise lip sync." The VS v4.3 per-phoneme instructions were dropped.
- Camera: "Static locked-off camera… never a face close-up", or the PIN line.
- Acting, after Jade's 2026-10-21 critique (memory `singing-acting-direction`):
  - Situation + objective + one line of her subtext.
  - At most ONE shift, usually in the eyes.
  - "Her hands stay relaxed and natural".
  - 60–90 words plus the canon guards.
  - **Never key gestures to lyric words** ("charades").
  - Don't rank takes by gesture energy; she picks by eye.
  - Singing TO a friend reads best.
  - RE's ~40-word prompts (`1-music-shipped/rare-earth-techno-remix/pipeline/seedance_shots.py`, e.g. sd02 "she looks up and off to the left at the stars, singing with longing… Slow push-in") are the model.
  - On a stage, performing to the crowd is natural.
  - Avoid "cinematic / epic / anamorphic" (MG). Never prompt "raise hairline"; she comes out bald. Say "large tall broad forehead, larger upper head" instead (RW1).

---
## 4. Audio analysis (VS tools; outputs `vibesong/analysis/{timing.json,lyrics_timed.json,song_map.md}`)

The VS scripts are **project-specific**: they use relative `work/` paths and hand-written section tables (`build_timing.py` `SECT`, `sections.py`, `tools/lines.json`). Copy them, then edit.

Run with the MG venv on GPU, from the project root.

1. **Decode:** `work/song.wav` (time base = first decoded sample; mp3 encoder delay trimmed). Prefer the provided `inputs/Merge Me Back to Main.wav`.
2. **Stems:**
   - demucs htdemucs_ft into `work/demucs/htdemucs_ft/song/{vocals,drums,bass,other}.wav`. The exact command isn't recorded; the layout matches `$PY -m demucs -n htdemucs_ft -o work/demucs work/song.wav`. Use `-m`: the venv's console-script shebangs are stale.
   - The weights are cached at `~/.cache/huggingface/hub/models--adefossez--HTDemucs-ft`.
   - Alternatives: Kim_Vocal_2 / BS-Roformer (OS, RE, RW2).
3. **Beats:**
   - `tools/beats_beatthis.py` (beat_this `File2Beats(checkpoint_path="final0", device="cuda", dbn=False)`) writes `work/beatthis.json` `{beats, downbeats}`.
   - `beatgrid_fit.py` writes the 5 ms drum-stem onset envelope `work/drum_onset_env.npy` and tests polyfits.
   - `beatgrid.py` / `final_grid.py`: beat_this pulses + midpoints snapped to drum onsets, then a cubic smoothing spline, giving `work/grid_final.json`.
   - VS verified that 97.9 % of strong onsets fall within 15 ms of a grid subdivision.
   - **Suno tempos drift** (VS ran 140→152 BPM; RW2 wandered ±0.2 s), so cut on measured beat times, never a fixed BPM.
   - This song is nominally 135 BPM trance: verify the drift first.
4. **Sections and energy:** `sections.py` (per-section dB per stem from `work/env5ms.npz`), `plot_energy.py`, `rolls_drops.py`, `key_track.py`, `keychange_check.py` (chroma correlation proved that VS's "key change" never happened).
5. **Lyrics:**
   - `transcribe.py`: faster-whisper large-v3 (cached at `~/.cache/huggingface/hub/models--Systran--faster-whisper-large-v3`), en/zh/auto passes with `initial_prompt` = lyrics and `word_timestamps`. Writes `work/asr.json`.
   - `transcribe_windows.py '[[a,b],...]' [prompt]`: windowed re-checks.
   - `align.py`: stable-ts forced alignment per line window, giving `work/aligned_raw.json`; `refine_lyrics.py` gives `aligned_refined.json`.
   - `ctc_align.py`: an independent torchaudio MMS_FA forced alignment (pypinyin for 汉字) over `tools/lines.json` (`{id, text, align_text, win:[a,b]}`), giving `work/ctc_align.json` `[{id, text, words:[{w, start, end, score}]}]`.
   - `arbitrate.py` / `fuse.py` / `assemble_lyrics.py`: per-word arbitration against vocal-stem syllable onsets, giving `analysis/lyrics_timed.json`.
   - "First consonants often precede CTC vowels by 0.2–0.3 s" (MG).
6. **`build_timing.py` writes `analysis/timing.json`:**
   - Keys: `audio, tempo, beat_grid{beats:[{i,t,bar,beat,zone,bpm}], downbeats, verification}, sections[{name,start,end,start_bar,end_bar,energy_1_10,description,loudness_db}], silences, drops, snare_rolls_builds, key, hooks, accent_hits, energy.per_bar`.
   - `lyrics_timed.json` lines are `{id, section, type, text, start, end, confidence, evidence, words:[{w,start,end,conf}], start_bar, vocal_accent}`.
   - `song_map.md` is the human-readable table for shot planning.
   - Measure the micro-cues (accents after stops land 50–80 ms after the grid) into a `cues.json`.

For checking by ear: OS `tools/timing_edit.py clicks` puts clicks on every word and beat. Pass `--out`; by default it writes into OS.

---
## 5. JS → video rendering

**VS engine** (`/home/jade/Documents/vibesong/engine/render.js`, README there; three.js 0.170):
- **Browser:** `puppeteer-core` ^23 drives `/usr/bin/google-chrome` (`headless:'new'`, `CHROME=` overrides) with `--no-sandbox --disable-gpu-watchdog --font-render-hinting=none --use-angle=vulkan --enable-features=Vulkan --ignore-gpu-blocklist --enable-gpu`. Also `--gpu gl|swiftshader`.
- **Frame loop:**
  - A local static server; the page exposes `window.ENGINE`.
  - Per frame `t = f/FPS`: `page.evaluate(ENGINE.render(t))`, then `ENGINE.readPixels()`, which returns base64 RGBA.
  - That is piped to `ffmpeg -f rawvideo -pix_fmt rgba -s WxH -r FPS -i pipe:0 -vf vflip -c:v libx264 -preset medium -crf 16 -pix_fmt yuv420p`. No PNGs are written unless `--out`.
- **Workers:** `--workers N` splits the frame range into contiguous chunks, one Chrome each, then `ffmpeg -f concat -c copy`.
- **Audio:** `--audio` decodes the song once to `out/cache/song.wav` (48 k), muxes `-ss first_frame/FPS -t n/FPS`, AAC 192k, `+faststart`.
- **Other modes:** `--stills t:file,...`, `--sheet` (one frame per beat), `--serve` (scrub at `localhost:8123/web/?show=main&t=..`), `--mblur N --shutter s` (sub-frame accumulation; VS used 8 / 0.33 for masters).
- **Determinism:** `update(t)` is a pure function of `t`, with seeded mulberry32. **But** `Math.random` is one seeded global stream consumed during scene setup, so a frame depends on which scenes the range sets up (a 5 s slice differs from the master at 23–35 dB). Compare renders only at equal setup ranges.
- **Speed (RTX 3090):**
  - 960×540 at 19.6 fps on 1 worker (GPU ~2 ms; ~47 ms readback); 48 fps on 3 workers.
  - 1080p costs ~4× the readback.
  - Full 203 s at 540p: ~5.5 minutes on 2 workers.
  - 1080p master with mblur 8: ~23 minutes, ~420 MB.

**RW2 engine** (`/home/jade/Documents/1-music-shipped/rewind-take-two/render/engine/render.mjs`; `playwright-core` 1.56.1 + three 0.186.1):
- Timeline/EDL compositor at 24 fps; frame `i → t = i/24`.
- N Chrome workers take 1-second chunks off a shared queue (resumable, atomic writes) and PUT JPEG frames to the local server (`--png` for lossless).
- ffmpeg then encodes frames + the audio slice to H.264 High (BT.709), AAC 48 k.
- Video sources are pre-decoded to CFR JPEG sequences in `media/engine_cache/`.
- Time expressions: `"25:1"` (bar:beat), `"word:reload"`, `"section:drop1"`.
- `--verify N` renders frames in two browsers in opposite orders and compares hashes.
- A lost WebGL context retries, then falls back nvidia → egl → cpu. Never mix backends in a final encode.
- **Throughput:** 960×540 preview at 91 fps (3 workers); 1080p at 38 fps (4 workers). Readback/JPEG-bound: 6 workers gain nothing.
- A full 1080p render is ~5–6 GB of frames.
- It has the best typography/HUD kit to borrow: `lowerthird` ink bleed, `slam`, `pin` corner-pinned signs, `pencil` handwriting, `ghosts`, `motes`, `iteration` odometer, `ribbon`.

**Other references:**
- OS `video/render.mjs` (puppeteer-core 24, Canvas pencil engine, `--frames A:B --workers 4`, resumable).
- RE three.js/Canvas under SwiftShader, ~1 s per 1080p frame.
- MG `render/tools/render_verified.sh`: renders twice plus a majority vote, because **renders under load silently saved wrong frames**; a verified 1080p pass took 42 minutes.

**Gotchas:**
- Set `TMPDIR` on disk, or Chrome and ffmpeg fail confusingly.
- Orphan headless Chromes from other projects share the GPU, so use fewer workers.
- A GTAO state leak across scenes in one process (VS drop2 rebound a shared AO pass) caused black blobs seen only in full stitches.
- One `--stills` call spanning two 3D acts lost the GPU context.
- Edit shared engine files atomically: copy, `node --check`, then `mv`. Half-written files rendered silently wrong.
- RW2 caches by path, so a redrawn plate needs a new filename. Never prune the cache mid-render. `--range` ignores `--outdir`.
- `ffmpeg -ss` can land a frame late: compare by frame index.
- **Encode every intermediate with an explicit `-r 24`.** VS upscale segments trimmed without it came out at 25 fps, so the picture drifted 1–3 frames late over 3 s.
- Generated clips are 24 fps; conform them to the master rate deliberately.
- 2 fps audit sheets miss one-frame dropouts.
- Review at 540p; 1080p only for a signed-off cut (memory `check-renders-below-1080p`).

**Deliverables used before:**
- Masters: 1080p H.264 CRF 16, slow.
- Upload copies: two-pass x264 under 100 MB, audio copied, `+faststart`.
- OS also made a 4K YouTube master (45 Mb/s), and VS made 9:16 launch cuts.
- 9:16 lesson: never non-uniformly stretch 2D. Show it as an uncropped band over a blurred copy.

---
## 6. Codex via tmux

**Split of work** (memory `delegation-preferences`, and VS decision 2026-10-14 "Codex in tmux session `vibesong`: yes"):
- Opus subagents handle creative and managerial work, writing file checkpoints.
- Codex handles mechanical work: encodes, probes, contact sheets, file and luma/cut checks, lyric videos, analysis. MG also used Codex's free built-in image tool for 9 repaints and 4 vignettes.

**Layout:** Claude in pane `<session>:0.0`, Codex in `<session>:0.1`. VS used session `vibesong-codex` (log `engine/out/review/v45/codex_stitch.log`, report `full_v4.5_check/REPORT.md`).

**Submitting a prompt:**
1. `tmux send-keys "<long text>" Enter` does NOT submit: the paste swallows the Enter.
2. Instead use `tmux load-buffer FILE; tmux paste-buffer -p -t S:0.1`, then a separate, delayed `tmux send-keys -t S:0.1 Enter` (sometimes twice).
3. Verify with `tmux capture-pane -p -t S:0.1` (look for "Working (esc to interrupt)").
4. Give absolute paths.

**Handoff by file:**
- Write `work/codex/job_<NAME>.md`:
  - numbered commands with a check after each;
  - "STOP and append `<NAME>_FAILED step N`";
  - no src or git edits;
  - the env vars to export.
- Paste only a pointer to the file. Codex appends `<NAME>_DONE` to a log.
- Templates in `/home/jade/Documents/1-music-shipped/moongazing-public-version/work/codex/`: `job_render_v10.md`, `wait.sh MARKER` (polls the log or the approval prompt), `wait_prompt.sh`, `approve_script.sh`.

**Limits:**
- **Codex's sandbox cannot run the renderers.** The local server fails with `listen EPERM 127.0.0.1`, and the sandbox hides the GPU.
- Launching codex with sandbox-bypass flags makes the auto-mode classifier block Claude's Bash. Use `-s workspace-write` (add `-c sandbox_workspace_write.network_access=true` only if needed).
- So run renders from Claude's shell in the background, and give Codex only file checks.
- One `codex exec` at a time: `flock /tmp/<proj>-codex.lock`.
- Never let Codex edit `src` while Claude does: a Codex comment scrub silently undid four edits mid-render (MG).
- Budget: three xhigh Codex jobs drained its quota in 25 minutes. 13 concurrent subagents burned Jade's window in an hour; plan for ~3–4 at a time.

---
## 7. ElevenLabs

There is **no `xi-api-key` anywhere** (grep of every `.py/.md/.sh/.toml` under `~/Documents`).
- Access is only through the Cloudflare catalog: `cf.generate("elevenlabs/eleven-v3", {...})` via `POST .../ai/run`.
- The other route would be gateway passthrough (`gateway.ai.cloudflare.com/.../elevenlabs`), which needs our own key. Ask Jade before signing up for anything.
- Examples:
  - `1-music-shipped/rewind-take-two/docs/TOOLS.md` ("[whispering] Never stop.", music-v2 "tape rewind whoosh" 4000 ms).
  - RE `1-music-shipped/rare-earth-techno-remix/pipeline/sound_design.py`: the `VOICES` dict of premade voice ids. It checks every processed voice line with Whisper.
  - RW1 tested voice `JBFqnCBsd6RMkjVDRZzb` (a public premade id).
- SFX = `music-v2` with `force_instrumental:true`.
- RW2's SFX mix rule: the song stays bit-identical, with cues only in the gaps (~−15.8 LUFS).

---
## 8. Hard-won lessons (top 15) and Jade's recorded taste

**Lessons that cost time or money:**
1. Seedance lag is per take and can be ~1 s, drifting inside a take. Measure with word strips and a syllable map, then let Jade pick by ear from switchable 540p variants in a **browser** page. Her Debian player is out of A/V sync on USB headphones.
2. Naming a shot size in a first-frame prompt recomposes the still: $3 wasted on card 03 r1. Pin the composition.
3. Seedance returns portrait or 4:3 at random. Budget extra takes, or design a card frame.
4. `reference_videos` needs a public URL; data URIs give 7003. Plan any hosting with Jade up front.
5. Per-word gesture prompts read as charades. Use subtext + one shift.
6. Image models average her face, add makeup, shrink the head and recompress the forehead when they re-pose her. Photoreal Jade always failed. Keep approved pixels and restore them; check head scale with MediaPipe.
7. Never pass approved art through a regenerate when a local fix will do: brows inside a feathered mask (model-drawn, not code-drawn), the chest-dot paste-back, the label rewrite.
8. Encode intermediates with an explicit rate (`-r 24`); the 25 fps segment drift was found only after Jade had picked timings on drifted clips.
9. `TMPDIR` on disk; check `nvidia-smi`; there are orphan Chromes; render under no other GPU load. Use double-render verification for finals.
10. Codex cannot render. Don't hand it the renderer; don't run bypass flags.
11. Account and session limits kill agents mid-edit. Write checkpoints (`checkpoints/<unit>.md`) and back up before edits. Verify file integrity on resume.
12. claude.ai artifact links die (auth drops, deletions). Mirror every decision in `docs/decisions.md` and keep page sources in `docs/pages/`.
13. The `flux-video-upscale` cost is not estimated ($0 in logs); the h3 CDN URL expires; Veo needs raw base64 and has a ~0.8 s ease-in; grok video and image need ZDR workarounds; errored runs are normally free.
14. Subagent visual verdicts were wrong more than once (RW2 P2, F4). Eyeball before relaying and give m:ss plus frame numbers.
15. Text, seals, lyrics and patches: render them procedurally, never by a model. Models invent glyphs ("PACE EARTH").

**What Jade loved:**
- **Anime Jade** ("all look phenomenal", RW1).
- The **watercolour** Jade (MGP, RW2: "all 3 water color are better").
- The VS paper cards after the v4.6 prompts ("better… by quite a lot").
- The 3:08 outro expressiveness ("really good").
- The 1:47 stage card.
- The k09 colour wave (she was "disappointed" when it was missing).
- RE's body language and dance moves ("so incredibly good").
- The half-1 game levels.
- The "merge looks good" option A (RW2).
- "fit is perfect" (VS timing fits).
- Charlie and Ricky actively DOING things: guitar powers the world, playing rather than listening.
- Thumbnail F (anime band on stage).
- Subtle, toned-down captions (Shorts).

**What she rejected or corrected:**
- Choreographed gestures.
- Frozen bodies with a moving mouth.
- "Cross-eyed" or "demented" eyes.
- Over-thick brows; code-pasted brows.
- A balding forehead; too pointy a chin.
- Floating rigid patches.
- Gibberish 1420 MHz patches.
- Orange cuffs or hem (the jacket has white cuffs and hem).
- Squished 9:16.
- Generic dance moves (she wants an anime style based on real K-pop / pop MV moves).
- Stacked HUD and type layers (RW1 died of it; "one idea per frame", at most one HUD layer).
- Overstated hooks.
- Marvel/"TVA" terms.
- Real photos as model input (VS rule).
- Hands through guitars.
- Lips "a whole word" off.

**Process she asked for:**
- Delegate heavily and keep the main context lean.
- Show keyframes or sheets before any long or expensive run.
- One card per decision, with variants in one composite video.
- Refer to shots by timestamp and description, not IDs.
- She reviews on her phone and in the browser. RW2 preferred local HTML opened via `xdg-open`; VS used claude.ai pages.
- No commit or push until she asks; VS and RW2 are **public** repos.
- Log every paid call and ask before crossing a budget.

---
## 9. Lore and canon breadcrumbs

**Jade canon** (memory `jade-character-rules`; `vibesong/docs/bible.md`):
- **Jacket:** a white cropped racer jacket (`vibesong/inputs/jacket-base.png`: band collar, snap throat-tab, snap epaulets) with ONE horizontal orange band per upper arm plus one across the chest, never vertical stripes.
- **Front:** one small pale-blue dot on her LEFT chest.
- **Sleeve:** a round b/w **1420 MHz** patch centred ON the left sleeve band (`vibesong/inputs/sleeve_patch_1420MHz.png`; the real costume art is in `1-music-shipped/rare-earth-techno-remix/costume/{artwork,spec}`).
  - 1420 MHz is the hydrogen line, the SETI frequency. Rare Earth was written for SETI's 2011 crowdfunding; in RE, Jade is "DOT" signalling the fictional world Echo.
- **Back:** a big pale-blue dot with RARE EARTH on one line.
- **Rest of the outfit:** black high-neck crop top with a bare midriff strip; navy cargo pants with orange straps; chunky white sneakers. Headphones round the neck are canon (VS 10-16: black band, orange cups).
- **The newest 4-view sheet** (hair down, matching all of this): `merge-me-back-to-main/inputs/character_sheet.png`.
- **Pencils:**
  - Two yellow pencils: a blue-eraser one with a RAINBOW core (= FUNCTIONS, draws colour) and a pink/orange-eraser one with a GRAPHITE core (= FIXTURES, draws structure).
  - In the bun they cross in an X through it, both caps UP.
  - Hair rule: bun with the pencils OR hair down with the pencils in hand, never both.
- **In-universe the pencils edit reality/code:**
  - VS: every platform is a stroke of a Chinese character; "是一幅画 也是一段代码 — it's a painting, and it's also code"; vibe coding = "spoken words → prompt text → strokes → geometry"; faint mirrored code is drawn on the back of her paper (`tools/cutscenes/code_ghost.py`).
  - RW2: she pulls the pencil from her bun at "Anomaly detected" and redraws the world (Escher's *Drawing Hands*).
- **Likeness:** large head, high forehead, wide heart-shaped face with the chin not too pointy, two slightly different brows, big eyes, centre part, no makeup, no glasses in VS.
  - Approved traces: `1-music-shipped/orbital-sunrise-video/media/chars/jade_src/jade_trace_*.jpg`.
  - VS paper likeness v9: `vibesong/assets/sheets/v6/*_v9.png`, `vibesong/assets/sheets/paper/paper_expr_jade.png`, `paper_jade_turnaround.png`.
  - Anime: `vibesong/inputs/jade_anime.png`; RW1 `1-archive/rewind-music-video/assets/character/anime/CANON_SHEET_v3.jpg`.
  - Watercolour: `1-music-shipped/rewind-take-two/inputs/jade_watercolor_jacket_v6.png`.
  - **Photos** (`merge-me-back-to-main/inputs/selfie_hairdown_jade_jacket_retouch_v2.png`, and RW2's `nomakeup_selfie.png` / `light_makeup_irl.png`): VS rule = never send to a model (look only). OS did trace a photo with Nano Banana successfully. Ask Jade which rule applies here.

**Multiple Jades / branches (RW2, the direct ancestor of this song's idea):**
- Every rewind spawns a translucent coloured **ghost Jade** that keeps running her old route. The ghosts *are* the "committee of variant Jades".
  - Committee art: `1-archive/rewind-music-video/assets/character/anime/committee_v3_*_ff.png`, also `rewind-take-two/inputs/committee_v3_long_ponytails_ff.png`.
  - Thumbnails: `rewind-take-two/deliverables/thumbnails/rewind_thumb_{A..D}_*.png`; `merge-me-back-to-main/inputs/rewind_thumb_C_ghost_sprint.png`.
- The ITERATION counter reads 4,097→4,113 under the credits; 4098 is canon (`docs/revisions/v5/counters.md`).
- **Banach–Tarski:**
  - The hint: a ghost hands her a slip, "What's an anagram of Banach–Tarski?" (E5c 128.76).
  - At 2:10 (E6, 130.50) she bursts into orange/blue motes and reassembles as **two** Jades, ORANGE (always screen-left: orange stripes) and BLUE (blue stripes and headphones).
  - At 3:23 (F7_07m, 202.88–205.52) they **merge back**: "she can un-banach-tarski herself into becoming original her". Canon Jade = ORANGE's band + BLUE's dot.
  - Docs `rewind-take-two/docs/revisions/v5/merge.md`, `docs/sections/D.md`; strip `media/reviews/v5/plans/merge/0323_merge_previz_A_strip.jpg`; tools `tools/v5/merge/`.
  - **This is the literal visual precedent for "Merge me back to main / Fold me in again."**
- **Hilbert Hotel:**
  - A hotel sign on Lake Shore reads HILBERT / VACANCY (the Drake renamed).
  - The post-credits scene (226–244.05): a gloved hand opens the emblem door, a bell rings, then the receptionist's POV of an **infinite queue of Jades** (committee plus ghosts), with a text box: "Of course we have space for you."
  - The ledger lists Escher, Penrose, Klimt and Hilbert.
  - Files: `rewind-take-two/docs/revisions/v5/coda.md`, `build.md`; modules `tools/sectionF/modules/hilbert_{door,lobby}.js`; assets `media/shots/PC/{door.jpg,lobby.jpg,sprites/}`; sheets `media/reviews/v5/coda_full_r5_sheet.jpg`, `coda_hilbert_sheet.jpg`. There is also a Short, `1-music-shipped/shorts` `rewind-hilbert-hotel-b`.
- The RW2 world is an Escher-woodcut Chicago (the Loop, *Ascending and Descending*, *Relativity*, *Drawing Hands*), and Jade is the only colour. **Colour = causal residue.** The agency is always "TIME VARIANCE █████████", never TVA.

**Supporting cast (VS):**
- **Charlie** wrote the original 2011 "The Product Manager Song" (SWE → PM). Curly dark hair, beige flat cap (the hat pulls out more hats, "wears many hats"), charcoal tee, jeans, brown boots, acoustic guitar. Bio: "singer-songwriter · guitarist · tech demos".
- **Ricky:** short black hair, blue/white vertical-striped shirt with the sleeves rolled, jeans, white sneakers, a natural-wood Strat. Bio: "electric guitar · hacker · PM extraordinaire". Power chord = ranged shot; sustained note = a light bridge. He leads Veo.
- **References:** `vibesong/inputs/charlie_anime.png`, `vibesong/inputs/ricky-anime.png`, `vibesong/assets/sheets/paper/paper_expr_{charlie,ricky}.png`, `vibesong/assets/sheets/party_paper_sheet.png`, band images `vibesong/inputs/rna_band*.png` (not inspected).
- Names were "held until Jade asks them" (10-14). They later appear in the VS end card ("Charlie wrote this…"), but confirm before any new public use.
- **The Eraser:** a grey rubber boss who becomes the pink friendly eraser and joins as UNDO ("`> you are my friend`"). Also the pacifist bugs that become features.
- **Dedication:** "For every partial project in a drawer."

**New inputs here:**
- `merge-me-back-to-main/inputs/Artifacts_poster.png` is a synthwave "ARTIFACTS: versioned storage that speaks git" poster with the tagline "ONE REPO PER AGENT. PER SESSION. PER TASK.": neon branch lines fork from a tower and merge back. It echoes the build lyric "One repo per agent / Per session, per life". It carries Cloudflare branding, so don't reproduce its marks in published frames without Jade's call.
- Song facts from the Suno prompt: progressive vocal trance, 135 BPM nominal, B minor. The structure: verse 1 ("I split myself a thousand ways"), pre-chorus, chorus ("Merge me back to main"), breakdown, snare-roll build with whispered layers, instrumental drop, verse 2, chorus, outro ("Back to main…").
