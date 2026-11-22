#!/bin/sh
# Frame-labelled contact sheet at readable size: sheet.sh MASTER.mp4 T0 EVERY_N COLSxROWS WIDTH OUT.jpg
# Labels are the frame's absolute presentation time (s) and frame number at 30 fps. Likeness: keep OUT under work_fable/.
M="$1"; T0="$2"; N="$3"; G="$4"; W="$5"; OUT="$6"
C=${G%x*}; R=${G#*x}
ffmpeg -v error -y -copyts -ss "$T0" -i "$M" -fps_mode passthrough \
  -vf "select='not(mod(n\,$N))',scale=$W:-2,drawtext=text='%{pts\:flt} f%{eif\:t*30\:d}':x=5:y=5:fontcolor=yellow:fontsize=18:box=1:boxcolor=black,tile=$G" \
  -frames:v 1 "$OUT"
