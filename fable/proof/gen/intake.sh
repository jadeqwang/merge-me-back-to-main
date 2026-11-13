#!/bin/bash
# intake.sh <id> <clip.mp4> [turn_t|null]  -> work_fable/proof/plates/<id>/{frames/f_%04d.jpg, meta.json, still.jpg, REAL} + a 6 fps review strip
set -e
cd "$(dirname "$0")/../../.."
id=$1; clip=$2; turn=${3:-null}
d=work_fable/proof/plates/$id; rm -rf $d/frames; mkdir -p $d/frames work_fable/proof/strips
ffmpeg -v error -y -i "$clip" -vf "fps=24,scale=1280:720:flags=lanczos" -q:v 2 $d/frames/f_%04d.jpg
n=$(ls $d/frames | wc -l)
cp work_fable/proof/refs/$id.jpg $d/still.jpg
echo "{\"fps\":24,\"n\":$n,\"turn_t\":$turn,\"src\":\"$clip\"}" > $d/meta.json
touch $d/REAL
FONT=$(fc-match -f '%{file}' 'DejaVu Sans Mono:bold')
ffmpeg -v error -y -i "$clip" -vf "fps=6,scale=480:270,drawtext=fontfile=$FONT:text='%{pts\:flt}':x=4:y=4:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.6,tile=6x5" -frames:v 1 -q:v 3 work_fable/proof/strips/$id.jpg
echo "$id: $n frames, turn_t=$turn"
