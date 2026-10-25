#!/usr/bin/env bash
# v2 song (inputs/Merge.wav) -> analysis_v2/ (same formats as analysis/). Intermediates + manual overrides in work_v2/.
# Generic scripts run from tools/analysis with paths redirected by env vars (see tools/analysis/apaths.py);
# song-specific scripts (hand-written sections/events/notes, wordless lines, spot-check picks, key blocks) live here.
# Stems first: work_v2/stems.sh (demucs htdemucs_ft + BS-RoFormer ep_317), then export_stems.py.
set -e
cd "$(dirname "$0")"
export ANALYSIS_DIR=analysis_v2 WORK_DIR=work_v2 SONG=inputs/Merge.wav LINES=tools/analysis_v2/lines.json
PY=/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python
SP=/home/jade/Documents/1-music-shipped/moongazing/.venv/lib/python3.12/site-packages/nvidia
export LD_LIBRARY_PATH=$SP/cublas/lib:$SP/cudnn/lib
G=../analysis
STEP=${1:-all}
if [ "$STEP" = all ] || [ "$STEP" = grid ]; then
  $PY $G/beats_beatthis.py; $PY $G/onset_envs.py; $PY beatgrid.py; $PY $G/comb_phase.py; $PY $G/final_grid.py
fi
if [ "$STEP" = all ] || [ "$STEP" = align ]; then
  $PY $G/ctc_align.py; VOC=vocals_roformer.wav TAG=_rf $PY $G/ctc_align.py
  $PY $G/ctc_align_w2v.py; VOC=vocals_roformer.wav TAG=_rf $PY $G/ctc_align_w2v.py
  $PY $G/align.py; VOC=vocals_roformer.wav TAG=_rf $PY $G/align.py
fi
if [ "$STEP" = all ] || [ "$STEP" = build ]; then
  $PY $G/syllable_onsets.py; $PY fuse.py; $PY spotcheck.py; $PY events.py; $PY key_track.py
  $PY $G/energy.py; $PY build_timing.py; $PY build_md.py; SONG_TITLE=Merge $PY $G/plot_check.py; $PY $G/click_check.py
fi
