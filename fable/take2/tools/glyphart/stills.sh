#!/bin/bash
# Glyph-art stills for Jade's v7 notes 1:34 (ca10 night world) and 3:42 (cb09 catch). 4 at a time.
#   bash fable/take2/tools/glyphart/stills.sh [variant ...]
cd "$(dirname "$0")/../../../.."
PY=work_fable/venv_hybrid/bin/python
P=fable/take2/tools/glyphart/paint.py
D=work_fable/take2/dev/v8_glyph
mkdir -p $D/stills
NIGHT="$D/src/v7raw_2845.jpg --matte $D/src/night_matte/rgba/f_0001.png --focus 1385,395,55,60 --focus 1390,560,90,120"
CATCH="$D/src/catch_0018.jpg --matte $D/src/catch_matte/rgba/f_0001.png --focus 930,300,150,170 --focus 935,700,170,130"
jobs_=(
  "night_A_colour_all     colour_all    $NIGHT"
  "night_B_colour_figure  colour_figure $NIGHT"
  "night_C_colour_cjk     colour_cjk    $NIGHT"
  "night_D_ink_palette    ink_palette   $NIGHT --set post_skip=0.45"
  "night_E_mono_ink       mono_ink      $NIGHT"
  "night_G_sparse_big     sparse_big    $NIGHT"
  "catch_B_colour_figure  colour_figure $CATCH"
  "catch_A_colour_all     colour_all    $CATCH"
  "catch_D_ink_palette    ink_palette   $CATCH"
  "catch_E_mono_ink       mono_ink      $CATCH"
  "catch_F_paper_ink      paper_ink     $CATCH"
  "catch_G_sparse_big     sparse_big    $CATCH"
)
run() { set -- $1; name=$1; pre=$2; shift 2
  $PY $P $@ $D/stills/$name.jpg --preset $pre > $D/stills/$name.log 2>&1 && tail -1 $D/stills/$name.log; }
export -f run; export PY P D
for j in "${jobs_[@]}"; do
  n=$(echo $j | cut -d' ' -f1)
  if [ $# -gt 0 ] && ! printf '%s\n' "$@" | grep -qx "$n"; then continue; fi
  printf '%s\0' "$j"
done | xargs -0 -P 4 -I{} bash -c 'run "{}"'
