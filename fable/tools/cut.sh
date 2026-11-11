#!/bin/bash
# usage: cut.sh vN  -> render 1080p, contact sheets, 720p review encode (<100 MB)
set -e
V=$1
cd "$(dirname "$0")/../.."
node fable/tools/gitlog.mjs >/dev/null 2>&1 || true
node fable/tools/render.mjs --show /fable/show/main.js --from 0 --to 282.5 --res 1920x1080 --fps 30 --mb 4 --workers 4 --audio --mp4 work_fable/out/$V.mp4 > work_fable/out/$V.log 2>&1
tail -2 work_fable/out/$V.log
mkdir -p work_fable/stills/$V work_fable/out/enc
for i in 1 2 3; do ss=$(( (i-1)*98 ))
  /usr/bin/ffmpeg -y -v error -ss $ss -t 98 -i work_fable/out/$V.mp4 -vf "fps=1/2,scale=480:270,drawtext=fontfile=/usr/share/fonts/truetype/dejavu/DejaVuSansMono-Bold.ttf:text='%{eif\:(t+$ss)/60\:d}\:%{eif\:mod(t+$ss\,60)\:d\:2}':x=6:y=6:fontsize=22:fontcolor=white:box=1:boxcolor=black@0.6,tile=7x7:padding=4:color=0x303030" -frames:v 1 -q:v 3 work_fable/stills/$V/sheet_$i.jpg
done
O=work_fable/out/enc
/usr/bin/ffmpeg -y -v error -i work_fable/out/$V.mp4 -vf "scale=1280:720:flags=lanczos" -c:v libx264 -preset slow -b:v 2450k -pass 1 -passlogfile $O/${V}_720 -pix_fmt yuv420p -an -f null /dev/null
/usr/bin/ffmpeg -y -v error -i work_fable/out/$V.mp4 -vf "scale=1280:720:flags=lanczos" -c:v libx264 -preset slow -b:v 2450k -pass 2 -passlogfile $O/${V}_720 -pix_fmt yuv420p -profile:v high -c:a aac -b:a 160k -movflags +faststart $O/${V}_720.mp4
ls -la work_fable/out/$V.mp4 $O/${V}_720.mp4 work_fable/stills/$V/
