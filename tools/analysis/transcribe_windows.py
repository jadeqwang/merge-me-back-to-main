"""Windowed re-transcription of the vocal stem (faster-whisper large-v3, en) to resolve ambiguous passages.
Usage: transcribe_windows.py '[[a,b],...]' [prompt] [temperature]   (adapted from vibesong)"""
import json, subprocess, sys
from pathlib import Path
import numpy as np
from faster_whisper import WhisperModel
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
model_path = next(Path('/home/jade/.cache/huggingface/hub/models--Systran--faster-whisper-large-v3/snapshots').iterdir())
model = WhisperModel(str(model_path), device='cuda', compute_type='float16')
src = AN/'stems/vocals.wav'
dec = subprocess.run([str(ROOT/'work/bin/ffmpeg'), '-v', 'error', '-i', str(src), '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'],
                     capture_output=True, check=True).stdout
audio = np.frombuffer(dec, dtype=np.float32).copy()
wins = json.loads(sys.argv[1]); prompt = sys.argv[2] if len(sys.argv) > 2 and sys.argv[2] else None
for a, b in wins:
    segs, _ = model.transcribe(audio[int(a*16000):int(b*16000)], language='en', beam_size=5, word_timestamps=True,
                               vad_filter=False, condition_on_previous_text=False, initial_prompt=prompt)
    for s in segs:
        ws = ' '.join(f"{w.word.strip()}@{w.start+a:.2f}-{w.end+a:.2f}({w.probability:.2f})" for w in s.words)
        print(f'[{a}-{b}] {s.start+a:7.2f}-{s.end+a:7.2f} {s.text} || {ws}', flush=True)
