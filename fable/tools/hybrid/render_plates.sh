#!/bin/bash
# Hybrid step 1: the code renders a shot needs. Usage: render_plates.sh <shot> <t_from> <n_frames> [fps=24]
#   ref.mp4     the film as it is (procedural figure + her mirror image)
#   plate.mp4   the same frames without any body (cast.js ?hide=fig): world, roads, lyric type, HUD, lights
#   norefl.mp4  bodies drawn, their mirror image not (cast.js ?hide=refl): ref - norefl = the code reflection alone, norefl - plate = the code figure alone
# Frame k is song time (round(t_from * fps) + k) / fps: the harness snaps to whole frames.
set -e
SHOT=$1; FROM=$2; N=$3; FPS=${4:-24}
ROOT="$(cd "$(dirname "$0")/../../.." && pwd)"; cd "$ROOT"
OUT=work_fable/hybrid/$SHOT; mkdir -p "$OUT"
TO=$(python3 -c "print(round(($(python3 -c "print(round($FROM*$FPS))")+$N)/$FPS,5))")
for v in ref plate norefl; do
  case $v in ref) Q="";; plate) Q="hide=fig";; norefl) Q="hide=refl";; esac
  node fable/tools/render.mjs --show /fable/show/main.js --from "$FROM" --to "$TO" --res 1920x1080 --fps "$FPS" --mb 4 --workers 3 --crf 8 --preset medium ${Q:+--q "$Q"} --mp4 "$OUT/$v.mp4"
done
