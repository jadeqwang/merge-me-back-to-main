#!/usr/bin/env bash
# Render the whole film (or a range) on the new audio, then the review encode and contact sheets.
#   fable/take2/tools/render_film.sh TAG [RANGE] [QUERY]
#     TAG    output name: work_fable/take2/out/film_TAG_master.mp4 (CRF 16, AAC 256k) and keep_TAG/ (lossless frames for check.py)
#            TAG=animatic_vN also writes review/fable_take2/animatic_vN.mp4 (H.264 capped at 2.4 Mb/s, AAC 192k: under 100 MB for
#            the whole film) and review/fable_take2/animatic_vN_sheet_NN.jpg (one frame per second, song time burned in, 10x6)
#     RANGE  a:b seconds (default the whole film)
#     QUERY  page query, e.g. "v7=0" or "hud=0"
# Env: WORKERS (default 6, the harness caps at 6)
set -euo pipefail
TAG="${1:?tag}"; RANGE="${2:-}"; QUERY="${3:-}"
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
AUDIO="inputs/Merge (keychange down).wav"; [ -f "$AUDIO" ] || { echo "missing $AUDIO"; exit 1; }
OUT=work_fable/take2/out; mkdir -p "$OUT"
MASTER="$OUT/film_${TAG}_master.mp4"
# frames kept for the single-frame check: plate, cards, proof (A, grid, merge, hero), flash, last
KEEP=15,870,1600,1900,1985,2205,2600,4000,4530,6000,8483
rm -rf "$OUT/keep_$TAG"
node fable/take2/tools/render.mjs --mp4 "$MASTER" ${RANGE:+--range "$RANGE"} ${QUERY:+--q "$QUERY"} --audio "$AUDIO" --workers "${WORKERS:-6}" --crf 16 \
  --keep "$KEEP" --keepdir "$OUT/keep_$TAG"
case "$TAG" in animatic*) DEST=review/fable_take2; mkdir -p "$DEST"; FINAL="$DEST/$TAG.mp4" ;; *) DEST="$OUT"; FINAL="$OUT/film_$TAG.mp4" ;; esac
T0=$(python3 -c "import json;print(json.load(open('${MASTER%.mp4}.json'))['t0'])")
ffmpeg -y -v error -i "$MASTER" -c:v libx264 -preset slow -crf 20 -maxrate 2400k -bufsize 4800k -pix_fmt yuv420p \
  -colorspace bt709 -color_primaries bt709 -color_trc bt709 -color_range tv -c:a aac -b:a 192k -movflags +faststart "$FINAL"
FONT="$ROOT/engine/fonts/JetBrainsMono[wght].ttf"; FONTE=$(printf '%s' "$FONT" | sed 's/[][,:]/\\&/g')
rm -f "$DEST/${TAG}_sheet_"*.jpg
ffmpeg -y -v error -i "$MASTER" -vf "fps=1,scale=384:-2,drawtext=fontfile='$FONTE':text='%{pts\:hms\:$T0}':x=6:y=6:fontsize=20:fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=4,tile=10x6:padding=4:margin=4" \
  -q:v 4 "$DEST/${TAG}_sheet_%02d.jpg"
ls -la "$FINAL" "$DEST/${TAG}_sheet_"*.jpg
