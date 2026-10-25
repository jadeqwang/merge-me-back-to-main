"""Song/output locations for the analysis scripts, overridable by env vars so the same pipeline can analyse a new song
version without touching the old outputs. Defaults = the original song (analysis/, work/).
  ANALYSIS_DIR  outputs (timing.json, energy.json, stems/, check_*.png, click_check.wav)   default: analysis
  WORK_DIR      intermediates (env.npz, aligned_*.json, overrides.json, song.wav symlink)    default: work
  SONG          the mix WAV (48 kHz)                                                        default: inputs/Merge Me Back to Main.wav
  LINES         lyric lines + search windows                                                default: tools/analysis/lines.json
Relative paths are resolved against the project root."""
import os
from pathlib import Path
import soundfile as _sf
ROOT = Path(__file__).resolve().parents[2]
AN = ROOT/os.environ.get('ANALYSIS_DIR', 'analysis')
WK = ROOT/os.environ.get('WORK_DIR', 'work')
SONG = ROOT/os.environ.get('SONG', 'inputs/Merge Me Back to Main.wav')
LINES = ROOT/os.environ.get('LINES', 'tools/analysis/lines.json')
_i = _sf.info(str(SONG)); DUR = round(_i.frames/_i.samplerate, 4)   # 284.8 for the original song
