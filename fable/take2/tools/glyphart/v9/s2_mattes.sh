#!/bin/bash
# Body mattes (BiRefNet, tools/matte.py) for the style-2 ranges, numbered f_0001 from the range's first v7 frame.
#   bash fable/take2/tools/glyphart/v9/s2_mattes.sh NAME K0 K1 [crop_sx,sy,sw,sh]
# Source frame k: v7/orchestra/f_k.jpg if it exists and k >= 4143, else v7/full/f_k.jpg (as animate.frame_path).
set -e
cd "$(dirname "$0")/../../../../.."
R=$PWD; N=$1; K0=$2; K1=$3; CROP=$4
D=work_fable/take2/dev/v9_glyph/s2/$N; mkdir -p $D
: > $D/list.txt
for k in $(seq $K0 $K1); do f=$(printf 'work_fable/take2/v7/orchestra/f_%05d.jpg' $k)
  if [ $k -lt 4143 ] || [ ! -f $f ]; then f=$(printf 'work_fable/take2/v7/full/f_%05d.jpg' $k); fi
  echo "file '$R/$f'" >> $D/list.txt; echo "duration 0.0333333" >> $D/list.txt; done
VF="scale=1920:1080"
if [ -n "$CROP" ]; then IFS=, read sx sy sw sh <<< "$CROP"
  VF="crop=iw*$sw:ih*$sh:iw*$sx:ih*$sy,scale=1920:1080:flags=lanczos"; fi
ffmpeg -v error -y -f concat -safe 0 -i $D/list.txt -vf "$VF,fps=30" -c:v libx264 -crf 12 -pix_fmt yuv420p $D/src.mp4
work_fable/venv_hybrid/bin/python fable/take2/tools/matte.py $D/src.mp4 $D/matte --fps 30 --size 1920x1080
