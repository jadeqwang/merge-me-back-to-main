#!/bin/bash
# Iteration 2 (glyph MARKS, marks.py): 3:42 catch and 1:34 night, presets ink_paper (F2), mono_cream (E2), colour (C2).
#   bash fable/take2/tools/glyphart/stills_v2.sh [--set k=json ...]
cd "$(dirname "$0")/../../../.."
export OMP_NUM_THREADS=4
PY=work_fable/venv_hybrid/bin/python; M=fable/take2/tools/glyphart/marks.py; D=work_fable/take2/dev/v8_glyph; mkdir -p $D/v2
CATCH="$D/src/catch_0018.jpg --matte $D/src/catch_matte/rgba/f_0001.png --focus 930,300,150,170 --focus 935,700,170,130"
NIGHT="$D/src/v7raw_2845.jpg --matte $D/src/night_matte/rgba/f_0001.png --focus 1385,395,40,45 --set bright_lines=true --set line_len=12 --set s_flat=14 --set s_detail=7 --set s_face=4.5 --set s_bg=24"
SKIN="--set s_face_flat=12 --set tau=0.08 --set values=[1.0,0.7]"
$PY $M $CATCH $D/v2/catch_ink_paper.jpg --preset ink_paper "$@" | tail -1
$PY $M $CATCH $D/v2/catch_mono_cream.jpg --preset mono_cream $SKIN "$@" | tail -1
$PY $M $CATCH $D/v2/catch_colour.jpg --preset colour $SKIN "$@" | tail -1
$PY $M $NIGHT $D/v2/night_mono_cream.jpg --preset mono_cream --set bg_scale=0.6 "$@" | tail -1
$PY $M $NIGHT $D/v2/night_colour.jpg --preset colour --set bg_scale=0.6 --set t0=0.04 "$@" | tail -1
