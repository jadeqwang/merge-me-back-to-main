#!/bin/bash
# 1 fps contact sheets (6x5 = 30 s per sheet, new song time burned in) from a plate frame folder. usage: sheets.sh [framesdir] [outdir]
D=${1:-work_fable/take2/v7/full}; O=${2:-work_fable/take2/v7/sheets}; mkdir -p $O
FONT='/home/jade/Documents/merge-me-back-to-main/fable/engine/fonts/JetBrainsMono[wght].ttf'
ffmpeg -y -v error -framerate 30 -i $D/f_%05d.jpg -vf "select='not(mod(n,30))',setpts=N/TB,scale=320:-2,drawtext=fontfile='${FONT//[/\\[}':text='%{pts\:hms}':x=6:y=5:fontsize=18:fontcolor=white:box=1:boxcolor=black@0.65:boxborderw=4,tile=6x5:padding=3:margin=3" -fps_mode passthrough -q:v 3 $O/sheet_%02d.jpg
ls $O | wc -l
