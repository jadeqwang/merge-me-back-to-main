#!/bin/bash
# BiRefNet mattes of plate frames (figure vs background for style 1's bg_dim/lift), f_%04d.png = plate frame index.
#   bash fable/take2/tools/glyphart/v9/plate_mattes.sh PLATE_ID ...   -> work_fable/take2/dev/v9_glyph/pmatte/<id>/rgba/
cd "$(dirname "$0")/../../../../.."
for id in "$@"; do D=work_fable/take2/dev/v9_glyph/pmatte/$id; mkdir -p $D
  [ -f $D/rgba/f_0121.png ] && continue
  ffmpeg -v error -y -framerate 24 -i work_fable/take2/plates/$id/frames/f_%04d.jpg -c:v libx264 -crf 12 -pix_fmt yuv420p $D/src.mp4
  work_fable/venv_hybrid/bin/python fable/take2/tools/matte.py $D/src.mp4 $D --fps 24 --size 1280x720 > $D/log.txt 2>&1
  echo "$id $(ls $D/rgba | wc -l)"; done
