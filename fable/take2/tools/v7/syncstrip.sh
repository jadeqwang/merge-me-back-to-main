#!/bin/bash
# Sync strip for test 5: frames at the NEW downbeats of bars 89,97,100,105 (frame before, on, after), warped (top rows) and un-warped (bottom rows).
# usage: fable/take2/tools/v7/syncstrip.sh [outdir]   (run from the repo root)
set -e
OUT=${1:-work_fable/take2/tests/v7_retime/sync}; mkdir -p $OUT
BARS="89 97 100 105"
R="node fable/tools/render.mjs --show /fable/show/main.js --res 1920x1080 --q notype=1&nohud=1 --mb 1"
TIMES=$(python3 - <<'P'
import json
b=json.load(open('analysis_v3/timing.json'))['bars']
for n in (89,97,100,105): print(n,b[n-1]['start'])
P
)
SW=""; SU=""
while read bar t; do for k in -1 0 1; do tt=$(python3 -c "print(round($t+($k)/30,4))"); SW="$SW,$tt:$OUT/w_${bar}_$k.png"; done; done <<< "$TIMES"
$R --warp analysis_v3/warp_v2_to_v3.json --stills ${SW#,}
SU=$(echo ${SW#,} | sed "s#/w_#/u_#g")
$R --stills $SU
F="fontfile='/home/jade/Documents/merge-me-back-to-main/fable/engine/fonts/JetBrainsMono\\[wght\\].ttf'"
for kind in w u; do
  lab=$([ $kind = w ] && echo "WARPED" || echo "UNWARPED")
  while read bar t; do for k in -1 0 1; do
    ffmpeg -nostdin -y -v error -i $OUT/${kind}_${bar}_$k.png -vf "scale=640:-2,drawtext=$F:text=$lab bar $bar new t=$t frame $k:x=8:y=8:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.7:boxborderw=4" $OUT/s_${kind}_${bar}_$k.png
  done; done <<< "$TIMES"
done
ARGS=(); for kind in w u; do for bar in $BARS; do for k in -1 0 1; do ARGS+=(-i $OUT/s_${kind}_${bar}_$k.png); done; done; done
ffmpeg -nostdin -y -v error "${ARGS[@]}" -filter_complex "xstack=inputs=24:layout=$(for r in 0 1 2 3 4 5 6 7; do for c in 0 1 2; do echo -n "$((c*640))_$((r*360))|"; done; done | sed 's/|$//')" -q:v 3 $OUT/sync_strip.jpg
echo $OUT/sync_strip.jpg
