#!/bin/bash
# anime look-dev: render cells of fable/show/animelab.js and tile them into one labelled JPEG.
#   sheet.sh <out.jpg> <mode> <fig> <res> <cols> <cellpx> "<cells: i[:label] ...>" [extra query]
# e.g. sheet.sh work_fable/stills/anime/dev/a.jpg A both 960x720 4 480 "0:front 1 2 3 4 5 6 7"
set -e
OUT=$1; MODE=$2; FIG=$3; RES=$4; COLS=$5; PX=$6; CELLS=$7; Q=$8
ROOT=$(cd "$(dirname "$0")/../../../.." && pwd); TMP=$(mktemp -d /tmp/mfb_sheet.XXXXXX)
ST=""; n=0; for c in $CELLS; do i=${c%%:*}; ST="$ST${ST:+,}$i:$TMP/$(printf %03d $n).png"; n=$((n+1)); done
node "$ROOT/fable/tools/render.mjs" --show /fable/show/animelab.js --q "mode=$MODE&fig=$FIG${Q:+&$Q}" --res $RES --stills "$ST" ${MB:+--mb $MB} | grep -v '^still\|renderer' || true
ARGS=(); n=0; for c in $CELLS; do l=""; [[ "$c" == *:* ]] && l=${c#*:}; ARGS+=(-label "${l//_/ }" "$TMP/$(printf %03d $n).png"); n=$((n+1)); done
montage "${ARGS[@]}" -tile ${COLS}x -geometry ${PX}x+2+2 -background '#14122B' -fill '#FFF1D6' -pointsize ${PT:-15} -quality 90 "$OUT"
rm -rf "$TMP"; echo "sheet -> $OUT"
