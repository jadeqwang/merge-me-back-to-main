#!/bin/bash
# v11 renders (glyph agent). Run from anywhere:  bash fable/take2/tools/glyphart/v11/render_v11.sh [catch|b1|all]
#   catch: A1, A3 (c2_hands; catch base on the corpus atlas -> freeze -> catch), cb02 on the corpus atlas (-> freeze), A4 x3
#   b1:    the main-Jade style-1 shots at their B1 size (v8 all-scripts atlas, as v9), ids <plate>_glyph11
# Logs: work_fable/take2/dev/v11_glyph/logs/. Never overwrites a plate id a render has used (all ids end in 11).
cd "$(dirname "$0")/../../../../.."
P=work_fable/venv_hybrid/bin/python; G=fable/take2/tools/glyphart/v11; LG=work_fable/take2/dev/v11_glyph/logs; mkdir -p $LG
PL=work_fable/take2/plates; PM=work_fable/take2/dev/v9_glyph/pmatte
B="80 48 30 19 12 8"; FB="6 4.5"
sizes() {  # B1 size factor k -> --set sizes / focus_sizes (focus = faces scale with sqrt(k): they stay fine)
  python3 -c "import sys,math;k=float(sys.argv[1]);print(\"--set sizes=[%s] --set focus_sizes=[%s]\" % (','.join('%.1f'%(s*k) for s in (80,48,30,19,12,8)), ','.join('%.1f'%(s*math.sqrt(k)) for s in (6,4.5))))" $1; }
s1() {  # plate out t0 atlas k [extra animate args]
  local id=$1 out=$2 t0=$3 at=$4 k=$5; shift 5
  OMP_NUM_THREADS=1 $P $G/s1.py --atlas $at -- --frames $PL/$id/frames --fps 24 --t0 $t0 --beat0 $t0 --preset colour_figure \
    --set skip_lum=0 --focus-skin 1 --focus-bright 0.5 --set focus_soft=1.0 --matte-dir $PM/$id/rgba --set bg_dim=0.7 --set dark_k=0.35 \
    --set lift=0.12 $(sizes $k) --out $PL/$out --workers 1 "$@" > $LG/$out.log 2>&1
  echo "$out: $(tail -1 $LG/$out.log)"
}
catch_jobs() {
  $P $G/atom_letters11.py --render > $LG/vio_still_letters11.log 2>&1 &
  $P $G/coarse11.py c2_hands --render > $LG/c2_hands_letters11.log 2>&1 &
  for s in cb10 cb11 cb12; do $P $G/merge11.py --render --only $s > $LG/merge11_$s.log 2>&1 & done
  ( s1 catch catch_glyph11 221.436 corpus 0.85 --last 44 --boil 0 --fill-k 4 && \
    $P fable/take2/tools/glyphart/v10/freeze.py catch_glyph11 catch catch_glyph11f > $LG/catch_glyph11f.log 2>&1 && \
    $P $G/coarse11.py catch --render > $LG/catch_letters11.log 2>&1 ) &
  ( s1 c2_lookup_v2 c2_lookup_v2_glyph11 209.366 corpus 0.95 --beat0 209.5262 --first 6 --last 87 --boil 0 --fill-k 4 && \
    $P fable/take2/tools/glyphart/v10/freeze.py c2_lookup_v2_glyph11 c2_lookup_v2 c2_lookup_v2_glyph11f 6 87 > $LG/c2_lookup_v2_glyph11f.log 2>&1 ) &
  wait
}
b1_jobs() {   # B1 ramp: largest at 0:29 (va02), stepping down to the float; cb02/catch above (0.95 / 0.85); oa03 unchanged (finest)
  s1 main_split main_split_glyph11 29.50 v8 1.8 --beat0 29.8231 --first 11 --last 80 &
  s1 main_release main_release_glyph11 43.7249 v8 1.6 --last 44 &
  s1 hero_paper_v2 hero_paper_v2_glyph11 69.24 v8 1.45 --beat0 69.716 --first 10 --last 98 &
  s1 hero_feet hero_feet_glyph11 74.9244 v8 1.35 --last 44 &
  s1 look_back look_back_glyph11 90.5317 v8 1.25 --last 44 &
  s1 main_back_wide_v2 main_back_wide_v2_glyph11 95.7269 v8 1.15 --last 75 &
  s1 float_top float_top_glyph11 97.4574 v8 1.05 --last 117 --set bg_dim=1.0 --set lift=0 --set keyline=0.12 --under 1.0 --set dark_k=0.12 --fill-k 1.0 &
  s1 float_face float_face_glyph11 100.9171 v8 1.05 --last 44 --set bg_dim=1.0 --set lift=0 --set keyline=0.12 --under 1.0 &
  wait
}
case "${1:-all}" in
  catch) catch_jobs ;;
  b1) b1_jobs ;;
  all) catch_jobs & b1_jobs & wait ;;
esac
echo "render_v11 $1 done"
