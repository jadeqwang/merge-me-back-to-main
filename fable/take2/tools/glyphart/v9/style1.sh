#!/bin/bash
# Style 1 ("multi-size", Jade's pick 3m42_catch_B_colour_figure, full frame): glyph-paint a whole plate into plates/<out>/.
#   bash fable/take2/tools/glyphart/v9/style1.sh PLATE_ID OUT_ID T0_SONG [extra animate.py args]
# Look B settings with the background painted too (colour_figure, skip_lum=0); faces/hands = per-frame skin focus map
# (v9/skin.py), no boil there. T0_SONG = song time of the plate's frame 1 as played (eighth-note boil phase only).
# Figure matte per frame (v9/plate_mattes.sh, waited for): background glyphs dimmed (bg_dim .7)
# so dark hair keeps its silhouette (dim spares bright/saturated things: lanes, lights); lift .12 on the figure (dark cloth reads);
# dark_k .35 refines dark-on-dark; --focus-bright .5 keeps lanes sharp; focus_soft 1 = no keylines in the face. MATTE=0: white paper.
cd "$(dirname "$0")/../../../../.."
id=$1; out=$2; t0=$3; shift 3
P=work_fable/take2/plates
M=work_fable/take2/dev/v9_glyph/pmatte/$id/rgba; MA=""
if [ "${MATTE:-1}" = 1 ]; then n=$(cat $P/$id/meta.json | python3 -c 'import json,sys; print(json.load(sys.stdin)["n"])')
  while [ ! -f $M/$(printf 'f_%04d.png' $n) ]; do sleep 20; done; sleep 5
  MA="--matte-dir $M --set bg_dim=0.7 --set dark_k=0.35 --set lift=0.12"; fi
mkdir -p work_fable/take2/dev/v9_glyph/logs
OMP_NUM_THREADS=1 work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/animate.py --frames $P/$id/frames --fps 24 \
  --t0 $t0 --beat0 $t0 --preset colour_figure --set skip_lum=0 --focus-skin 1 --focus-bright 0.5 --set focus_soft=1.0 $MA --out $P/$out --workers 1 "$@" \
  > work_fable/take2/dev/v9_glyph/logs/$out.log 2>&1
echo "$out done: $(tail -1 work_fable/take2/dev/v9_glyph/logs/$out.log)"
