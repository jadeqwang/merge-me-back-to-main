#!/bin/bash
# mp4 (with the song for that range) + an 8-frame strip from an animate.py frame dir.
#   bash fable/take2/tools/glyphart/encode.sh DIR T0 T1 OUT_BASENAME
cd "$(dirname "$0")/../../../.."
DIR=$1; T0=$2; T1=$3; OUT=$4
K0=$(python3 -c "print(round($T0*30))"); K1=$(python3 -c "print(round($T1*30))")
N=$((K1-K0)); DUR=$(python3 -c "print($N/30)")
ffmpeg -v error -y -framerate 30 -start_number $K0 -i "$DIR/f_%05d.jpg" -ss $T0 -t $DUR -i "inputs/Merge (keychange down).wav" \
  -frames:v $N -c:v libx264 -crf 18 -preset slow -pix_fmt yuv420p -c:a aac -b:a 192k -shortest "$OUT.mp4"
work_fable/venv_hybrid/bin/python - "$DIR" $K0 $K1 "$OUT" <<'EOF'
import sys, cv2, numpy as np
d, k0, k1, out = sys.argv[1], int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
ks = np.linspace(k0, k1 - 1, 8).round().astype(int)
ims = []
for k in ks:
    im = cv2.resize(cv2.imread(f'{d}/f_{k:05d}.jpg'), (640, 360), interpolation=cv2.INTER_AREA)
    cv2.putText(im, f'{k / 30:.2f}s', (8, 26), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (235, 230, 220), 2, cv2.LINE_AA)
    ims.append(im)
cv2.imwrite(out + '_strip.jpg', np.vstack([np.hstack(ims[:4]), np.hstack(ims[4:])]), [cv2.IMWRITE_JPEG_QUALITY, 88])
EOF
ls -la "$OUT.mp4" "${OUT}_strip.jpg"
