#!/usr/bin/env bash
# v3 song ("inputs/Merge (keychange down).wav", copied to work_v3/song.wav) -> analysis_v3/ (same formats as analysis_v2/).
# Intermediates + manual overrides in work_v3/ (overrides.json = corrections checked by eye on zoom_words.py panels).
# Generic scripts run from tools/analysis (paths via env vars, see tools/analysis/apaths.py); generic v2 scripts reused
# as-is (export_stems, fuse, spotcheck, key_track); v3-specific scripts live here.
# Before step 'stems': cp "inputs/Merge (keychange down).wav" work_v3/song.wav && bash work_v3/stems.sh
# Steps: stems | grid | align | build | warp | all (all = grid align build warp)
set -e
cd "$(dirname "$0")"
export ANALYSIS_DIR=analysis_v3 WORK_DIR=work_v3 SONG=work_v3/song.wav LINES=tools/analysis_v3/lines.json
PY=/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python
SP=/home/jade/Documents/1-music-shipped/moongazing/.venv/lib/python3.12/site-packages/nvidia
export LD_LIBRARY_PATH=$SP/cublas/lib:$SP/cudnn/lib
G=../analysis; V2=../analysis_v2
STEP=${1:-all}
if [ "$STEP" = stems ]; then
  $PY $V2/export_stems.py
fi
if [ "$STEP" = all ] || [ "$STEP" = grid ]; then
  $PY $G/beats_beatthis.py; $PY $G/onset_envs.py
  $PY beatgrid.py; $PY $G/comb_phase.py; $PY $G/final_grid.py   # estimate (a): new file only (drifting period)
  $PY warp_align.py; $PY compare_ab.py                          # estimate (b): v2 grid through an old->new onset alignment; (a)-(b)
fi
if [ "$STEP" = all ] || [ "$STEP" = align ]; then
  # lines.json windows = v2 windows mapped by musical position (warpmap.py), +-0.2 s (made once, kept in the repo)
  $PY $G/transcribe.py > ../../work_v3/asr.log 2>&1              # ASR check of the words (faster-whisper)
  $PY $G/ctc_align.py; VOC=vocals_roformer.wav TAG=_rf $PY $G/ctc_align.py
  $PY $G/ctc_align_w2v.py; VOC=vocals_roformer.wav TAG=_rf $PY $G/ctc_align_w2v.py
  $PY $G/align.py; VOC=vocals_roformer.wav TAG=_rf $PY $G/align.py
fi
if [ "$STEP" = all ] || [ "$STEP" = build ]; then
  $PY $G/syllable_onsets.py; $PY $V2/fuse.py; $PY $V2/spotcheck.py; $PY events.py; $PY $V2/key_track.py
  $PY $G/energy.py; $PY build_timing.py; $PY build_md.py; SONG_TITLE="Merge (keychange down)" $PY $G/plot_check.py; $PY $G/click_check.py
fi
if [ "$STEP" = all ] || [ "$STEP" = warp ]; then
  $PY build_warp.py; $PY arr_compare.py; $PY checks.py
  $PY anchor_plots.py bar009 12.4 16.0 bar089 151.0 154.6 intro 0 8 ending 270 282.8; $PY tail_check.py
  $PY grid_onset_plot.py intro 0 15 intro2 14 29 chorus2a 199 218 chorus2b 217.5 237 tail 254 283
fi
