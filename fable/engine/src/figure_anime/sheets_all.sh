#!/bin/bash
# anime look-dev: the four deliverable sheets (current figure on the left of every cell, anime on the right) -> work_fable/stills/anime/
#   fable/engine/src/figure_anime/sheets_all.sh [A] [B] [C] [D]      (no argument = all)
set -e
HERE=$(cd "$(dirname "$0")" && pwd); ROOT=$(cd "$HERE/../../../.." && pwd); cd "$ROOT"
S="$HERE/sheet.sh"; O=work_fable/stills/anime; T=$O/tmp; mkdir -p $T
WANT=${*:-A B C D}
title() { convert -background '#14122B' -fill '#FFF1D6' -pointsize ${3:-30} -size ${2}x label:"  $1" -gravity west $T/title_$4.png; }
if [[ $WANT == *A* ]]; then
  PT=20 $S $T/A1.jpg A both 720x720 8 480 "0:0°_front 1:45° 2:90° 3:135° 4:180°_back 5:225° 6:270° 7:315°"
  PT=20 $S $T/A2.jpg F both 640x640 8 480 "0:front 1:three-quarter 2:profile 3:back_three-quarter 4:from_above 5:from_below 20:CURRENT_front 21:CURRENT_three-quarter"
  PT=20 $S $T/A3.jpg F both 640x640 8 480 "6:neutral 7:determined 8:joy 9:looking_back_(gaze) 10:calm_(eyes:false) 12:determined 13:joy 14:looking_back_(gaze)"
  PT=20 $S $T/A4a.jpg F both 640x640 4 480 "16:gaze_to_her_right 17:gaze_up_to_her_left 18:blink_0.55 19:gaze_down"
  PT=20 $S $T/A4b.jpg F both 640x640 4 480 "0:NIGHT_front 1:NIGHT_three-quarter 2:NIGHT_profile 8:NIGHT_joy" "light=night"
  convert $T/A4a.jpg $T/A4b.jpg +append $T/A4.jpg
  title "A · turnaround, day, neutral (idle t=3). In every cell: CURRENT figure left, ANIME right.   Rows 2-4: face close-ups (anime unless marked), expressions, gaze, night." 3872 30 A
  convert $T/title_A.png $T/A1.jpg $T/A2.jpg $T/A3.jpg $T/A4.jpg -append -quality 88 $O/A_turnaround_faces.jpg; echo "-> $O/A_turnaround_faces.jpg"
fi
if [[ $WANT == *B* ]]; then
  L="night_(lane_main) night_(violet_branch,_bun) sunrise,_against_the_sun sunrise,_three-quarter day"; CE=""
  for p in 0 1 2; do k=0; for l in $L; do CE="$CE $((p * 5 + k)):$l"; k=$((k + 1)); done; done
  PT=20 $S $T/B1.jpg B both 800x720 5 640 "$CE"
  title "B · the lighting arc: idle, run_loop, catch (arms open). In every cell: CURRENT figure left, ANIME right." 3220 30 B
  convert $T/title_B.png $T/B1.jpg -append -quality 88 $O/B_lighting_arc.jpg; echo "-> $O/B_lighting_arc.jpg"
fi
if [[ $WANT == *C* ]]; then
  CE=""; for r in 0 1 2 3 4; do n=(run_loop_night drop_sunrise violet_night catch_day free_day); for k in 0 1 2 3 4 5; do CE="$CE $((r * 6 + k)):${n[$r]}_$k"; done; done
  PT=18 $S $T/C1.jpg C both 800x720 6 560 "$CE"
  PT=18 $S $T/C2.jpg X old 1280x720 2 840 "0:CURRENT_64_at_night 1:CURRENT_64_at_sunrise"
  PT=18 $S $T/C3.jpg X anime 1280x720 2 840 "0:ANIME_64_at_night 1:ANIME_64_at_sunrise"
  convert $T/C2.jpg $T/C3.jpg +append $T/C4.jpg
  title "C · in action (6 frames per track; CURRENT left, ANIME right in every cell) and a crowd of 64." 3380 30 C
  convert $T/title_C.png $T/C1.jpg $T/C4.jpg -append -quality 88 $O/C_action_crowd.jpg; echo "-> $O/C_action_crowd.jpg"
fi
if [[ $WANT == *D* ]]; then
  node fable/tools/render.mjs --show /fable/show/animelab.js --q "mode=D" --res 1280x720 --from 0 --to 6 --mp4 $O/D_clip.mp4 --mb 4 | tail -2
  CE=""; for i in $(seq 0 23); do t=$(echo "$i * 0.125" | bc -l); CE="$CE $t:free_$(printf %.2f $t)s"; done
  PT=16 MB=4 $S $T/D1.jpg D both 1280x720 8 480 "$CE"
  CE=""; for i in $(seq 0 23); do t=$(echo "3 + $i * 0.125" | bc -l); CE="$CE $t:violet_$(printf %.2f $t)s"; done
  PT=16 MB=4 $S $T/D2.jpg D both 1280x720 8 480 "$CE"
  CE=""; for i in $(seq 0 31); do t=$(echo "0.4 + $i * 0.0333333" | bc -l); CE="$CE $t:$(printf %.2f $t)"; done
  PT=14 MB=4 $S $T/D3.jpg D both 960x480 16 240 "$CE" "cam=head"
  CE=""; for i in $(seq 0 31); do t=$(echo "3.9 + $i * 0.0333333" | bc -l); CE="$CE $t:$(printf %.2f $t)"; done
  PT=14 MB=4 $S $T/D4.jpg D both 960x480 16 240 "$CE" "cam=head"
  title "D · clip strips (the film itself: D_clip.mp4). Rows 1-3 free by day, 4-6 violet at night, every 1/8 s; below: heads, every frame for 1 s." 3872 30 D
  convert $T/title_D.png $T/D1.jpg $T/D2.jpg $T/D3.jpg $T/D4.jpg -append -quality 86 $O/D_clip_strip.jpg; echo "-> $O/D_clip_strip.jpg"
fi
