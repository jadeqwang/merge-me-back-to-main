#!/usr/bin/env bash
# PLAN section 9 test 8: the kick against the sun and the 1,024 from above, redrawn on paper.
# Sources are v7 renders on OLD song time with v7's own type and HUD off (fable/tools/render.mjs --q "notype=1&nohud=1"):
#   kick: still 153.3, frames 152.6-155.6     above (the MAIN formation, top-down): still 167.5, frames 166-169
# Outputs in work_fable/take2/tests/paper/: <name>_sheet.png (source | black paper | white paper, 1080p panels), <name>_sheet_half.png,
# <name>_black.mp4 and <name>_white.mp4 (3 s, 30 fps, 1080p: judge the boil), <name>_triptych.mp4 (half size).
set -euo pipefail
cd "$(dirname "$0")/../../../.."
P=work_fable/take2/tests/paper; S=$P/src; FX="node fable/take2/tools/fx/fx.mjs --pass paper"
if [ ! -f $S/kick_153.3.png ] || [ "${RERENDER:-0}" = 1 ]; then
  Q="notype=1&nohud=1"; mkdir -p $S
  node fable/tools/render.mjs --show /fable/show/main.js --q "$Q" --stills 153.3:$PWD/$S/kick_153.3.png,167.5:$PWD/$S/above_167.5.png --res 1920x1080
  node fable/tools/render.mjs --show /fable/show/main.js --q "$Q" --frames $PWD/$S/kick_frames --from 152.6 --to 155.6 --workers 2 --mb 2 --res 1920x1080
  node fable/tools/render.mjs --show /fable/show/main.js --q "$Q" --frames $PWD/$S/above_frames --from 166 --to 169 --workers 2 --mb 2 --res 1920x1080
fi
GOLD='#FFC23A'
KB="{\"paper\":\"black\",\"stroke\":\"$GOLD\",\"seed\":3}"                          # the sunrise: two colours, gold and black
KW="{\"paper\":\"white\",\"ink\":[\"$GOLD\"],\"seed\":3}"
AB="{\"paper\":\"black\",\"ink\":[\"$GOLD\",\"#FF7A1A\"],\"seed\":5}"
AW="{\"paper\":\"white\",\"seed\":5}"
run() {  # name still t0 frames black white
  local n=$1 still=$2 t0=$3 fr=$4 b=$5 w=$6
  $FX --in $still --out $P/${n}_sheet.png --opts "[$b,$w]" --side --t0 $t0
  $FX --in $still --out $P/${n}_sheet_half.png --opts "[$b,$w]" --side --t0 $t0 --scale-out 0.5
  $FX --in $fr --out $P/${n}_black.mp4 --opts "$b" --t0 $t0 --workers 2
  $FX --in $fr --out $P/${n}_white.mp4 --opts "$w" --t0 $t0 --workers 2
  $FX --in $fr --out $P/${n}_triptych.mp4 --opts "[$b,$w]" --side --t0 $t0 --workers 2 --scale-out 0.5
}
run kick $S/kick_153.3.png 152.6 $S/kick_frames "$KB" "$KW"
run above $S/above_167.5.png 166 $S/above_frames "$AB" "$AW"
ls -la $P/*.png $P/*.mp4
