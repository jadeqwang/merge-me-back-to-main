#!/bin/bash
# Style 1 ("multi-size", Jade's pick 3m42_catch_B_colour_figure, full frame): glyph-paint a whole plate into plates/<out>/.
#   bash fable/take2/tools/glyphart/v9/style1.sh PLATE_ID OUT_ID T0_SONG [extra animate.py args]
# Look B settings with the background painted too (colour_figure, skip_lum=0); faces/hands = per-frame skin focus map
# (v9/skin.py), no boil there. T0_SONG = song time of the plate's frame 1 as played (eighth-note boil phase only).
cd "$(dirname "$0")/../../../../.."
id=$1; out=$2; t0=$3; shift 3
P=work_fable/take2/plates
mkdir -p work_fable/take2/dev/v9_glyph/logs
OMP_NUM_THREADS=1 work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/animate.py --frames $P/$id/frames --fps 24 \
  --t0 $t0 --beat0 $t0 --preset colour_figure --set skip_lum=0 --focus-skin 1 --out $P/$out --workers 1 "$@" \
  > work_fable/take2/dev/v9_glyph/logs/$out.log 2>&1
echo "$out done: $(tail -1 work_fable/take2/dev/v9_glyph/logs/$out.log)"
