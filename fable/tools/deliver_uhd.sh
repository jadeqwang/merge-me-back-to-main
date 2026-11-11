#!/bin/bash
# X encode (1080p, 2-pass 12M) made by downscaling the 4K master; audio fresh from the wav
set -e
V=$1; cd "$(dirname "$0")/../.."; D=work_fable/out/deliver; mkdir -p $D
VF="scale=1920:1080:flags=lanczos"
/usr/bin/ffmpeg -y -v error -i work_fable/out/${V}_uhd.mp4 -vf "$VF" -c:v libx264 -preset slow -b:v 12M -maxrate 16M -bufsize 24M -profile:v high -level 4.1 -pix_fmt yuv420p -r 30 -g 60 -pass 1 -passlogfile $D/xu_$V -an -f null /dev/null
/usr/bin/ffmpeg -y -v error -i work_fable/out/${V}_uhd.mp4 -i inputs/Merge.wav -map 0:v -map 1:a -vf "$VF" -c:v libx264 -preset slow -b:v 12M -maxrate 16M -bufsize 24M -profile:v high -level 4.1 -pix_fmt yuv420p -r 30 -g 60 -pass 2 -passlogfile $D/xu_$V -c:a aac -b:a 256k -ar 48000 -t 282.5 -movflags +faststart $D/merge_fable_${V}_x_1080p.mp4
rm -f $D/merge_fable_v5_x_1080p.mp4
ls -la $D/*.mp4 | awk '{print $5,$9}'
