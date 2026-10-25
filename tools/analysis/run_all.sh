#!/usr/bin/env bash
# Re-run the analysis pipeline (after demucs/RoFormer stems exist). Order matters.
set -e
cd "$(dirname "$0")"
PY=/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python
SP=/home/jade/Documents/1-music-shipped/moongazing/.venv/lib/python3.12/site-packages/nvidia
export LD_LIBRARY_PATH=$SP/cublas/lib:$SP/cudnn/lib
# stems: python -m demucs -n htdemucs_ft --float32 -d cuda -o work/demucs work/song.wav  (then export to analysis/stems, see notes)
$PY beats_beatthis.py; $PY onset_envs.py; $PY beatgrid.py; $PY comb_phase.py; $PY final_grid.py
$PY ctc_align.py; VOC=vocals_roformer.wav TAG=_rf $PY ctc_align.py
$PY ctc_align_w2v.py; VOC=vocals_roformer.wav TAG=_rf $PY ctc_align_w2v.py
$PY align.py; VOC=vocals_roformer.wav TAG=_rf $PY align.py
$PY syllable_onsets.py; $PY fuse.py; $PY spotcheck.py; $PY events.py; $PY key_track.py
$PY energy.py; $PY build_timing.py; $PY build_md.py; $PY plot_check.py; $PY click_check.py
