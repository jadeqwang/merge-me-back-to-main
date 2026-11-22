#!/bin/bash
# v11 B2: the life plates written in their notation (notation11.py), 3 at a time; each life waits for its mattes (v11 pmatte).
#   bash fable/take2/tools/glyphart/v11/render_notation11.sh [life ...]
cd "$(dirname "$0")/../../../../.."
P=work_fable/venv_hybrid/bin/python; LG=work_fable/take2/dev/v11_glyph/logs
declare -A PID=([piano]=piano [violin]=violin [wushu]=wushu_v3 [wetlab]=wetlab [phd]=phd [poet]=poet [ames]=ames [band]=band_v2 [chezjj]=chezjj [sandstorm]=sandstorm [home]=home_v3)
L=${@:-piano violin wetlab phd poet wushu ames band chezjj sandstorm home}
for l in $L; do
  ( until [ -f work_fable/take2/dev/v11_glyph/pmatte/${PID[$l]}/rgba/f_0121.png ]; do sleep 15; done; sleep 5
    $P fable/take2/tools/glyphart/v11/notation11.py $l > $LG/notation11_$l.log 2>&1; echo "$l: $(grep -v WARN $LG/notation11_$l.log | tail -1)" ) &
  while [ $(jobs -r | wc -l) -ge 3 ]; do sleep 5; done
done
wait; echo "notation11 done"
