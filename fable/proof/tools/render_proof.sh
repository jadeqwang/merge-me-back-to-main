#!/usr/bin/env bash
# Render the proof segment (bar 28 downbeat -> bar 43 downbeat, + 0.5 s of black) against a timing map, with its audio.
#   fable/proof/tools/render_proof.sh [v2|v3]            (default v2)
# v2: analysis_v2/timing.json + inputs/Merge.wav
# v3: analysis_v3/timing.json + "inputs/Merge (keychange down).wav"
# Out: work_fable/proof/out/proof_<v>.mp4 (1080p30, H.264 CRF 16, AAC 256k), proof_<v>.json (t0, frames),
#      proof_<v>_sheet_NN.jpg (4 frames per second, song time burned in, 8x4 per sheet), keep_<v>/seq_*.png (3 lossless frames for the
#      single-frame check in fable/proof/tools/check.py).
# Env: WORKERS (default 4), RES (default 1920x1080)
set -euo pipefail
V="${1:-v2}"
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
case "$V" in
  v2) TIMING=/analysis_v2/timing.json; AUDIO="inputs/Merge.wav" ;;
  v3) TIMING=/analysis_v3/timing.json; AUDIO="inputs/Merge (keychange down).wav" ;;
  *) echo "usage: $0 [v2|v3]"; exit 2 ;;
esac
[ -f ".${TIMING}" ] || { echo "missing timing map .${TIMING}"; exit 1; }
[ -f "$AUDIO" ] || { echo "missing audio $AUDIO"; exit 1; }
OUT=work_fable/proof/out; mkdir -p "$OUT"
.venv/bin/python fable/proof/tools/placeholders.py >/dev/null    # fills any plate that is missing; never touches REAL or real plates
node fable/proof/tools/render.mjs --timing "$TIMING" --res "${RES:-1920x1080}" --fps 30 --crf 16 --workers "${WORKERS:-4}" \
  --audio "$AUDIO" --keep 75,560,700 --keepdir "$OUT/keep_$V" --mp4 "$OUT/proof_$V.mp4"
T0=$(python3 -c "import json;print(json.load(open('$OUT/proof_$V.json'))['t0'])")
rm -f "$OUT"/proof_"$V"_sheet_*.jpg
FONT="$ROOT/engine/fonts/JetBrainsMono[wght].ttf"; FONTE=$(printf '%s' "$FONT" | sed 's/[][,:]/\\&/g')
ffmpeg -y -v error -i "$OUT/proof_$V.mp4" -vf "fps=4,scale=480:-2,drawtext=fontfile='$FONTE':text='%{pts\:hms\:$T0}':x=8:y=8:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=5,tile=8x4:padding=4:margin=4" \
  -q:v 3 "$OUT/proof_${V}_sheet_%02d.jpg"
ls -1 "$OUT"/proof_"$V".mp4 "$OUT"/proof_"$V"_sheet_*.jpg
