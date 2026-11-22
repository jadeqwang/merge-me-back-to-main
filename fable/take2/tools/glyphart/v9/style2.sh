#!/bin/bash
# Style 2 ("single-size", Jade's approved V3): animate_hash.py, mono em 20, upright glyphs on the body (BiRefNet matte), rotated
# same-size glyphs in the background. Output: a v7-layout folder work_fable/take2/v7/glyph_s2_<name>/ (f_%05d.jpg, meta.json).
#   bash fable/take2/tools/glyphart/v9/style2.sh NAME K0 K1 BEAT0 [extra animate_hash args, e.g. --crop 0.3,0,0.7,0.7]
# The matte must exist: v9/s2_mattes.sh NAME K0 K1 [crop].
cd "$(dirname "$0")/../../../../.."
N=$1; K0=$2; K1=$3; B0=$4; shift 4
OMP_NUM_THREADS=1 work_fable/venv_hybrid/bin/python fable/take2/tools/glyphart/animate_hash.py --k0 $K0 --k1 $K1 --beat0 $B0 \
  --font mono --em 20 --set cgrid=10 --set 'spacings=[11,12,13]' --set upright_body=true \
  --matte work_fable/take2/dev/v9_glyph/s2/$N/matte/rgba --out work_fable/take2/v7/glyph_s2_$N --workers ${W:-2} "$@" \
  > work_fable/take2/dev/v9_glyph/logs/s2_$N.log 2>&1
echo "s2 $N: $(tail -1 work_fable/take2/dev/v9_glyph/logs/s2_$N.log)"
