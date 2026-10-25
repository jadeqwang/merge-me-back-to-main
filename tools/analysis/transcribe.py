"""Independent ASR of the demucs vocal stem with faster-whisper large-v3 (en), word timestamps; two passes
(with / without lyric prompt). Adapted from vibesong/tools/transcribe.py. Output: work/asr.json"""
import json, subprocess
from pathlib import Path
import numpy as np
from faster_whisper import WhisperModel
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
FF = str(ROOT/'work/bin/ffmpeg')
model_path = next(Path('/home/jade/.cache/huggingface/hub/models--Systran--faster-whisper-large-v3/snapshots').iterdir())
model = WhisperModel(str(model_path), device='cuda', compute_type='float16')
dec = subprocess.run([FF, '-v', 'error', '-i', str(AN/'stems/vocals.wav'),
                      '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
audio = np.frombuffer(dec, dtype=np.float32).copy()
prompt = "Merge me back to main. Every road I ran becomes the one. Fold me in again. Branch and wander. One repo per agent, per session, per life."
out = {}
for tag, pr in (('noprompt', None), ('prompt', prompt)):
    segs, info = model.transcribe(audio, language='en', beam_size=5, word_timestamps=True, vad_filter=False,
                                  condition_on_previous_text=False, initial_prompt=pr)
    res = []
    for s in segs:
        print(f'[{tag}] {s.start:7.2f}-{s.end:7.2f} {s.text}', flush=True)
        res.append(dict(start=s.start, end=s.end, text=s.text,
                        words=[dict(w=w.word, start=w.start, end=w.end, p=w.probability) for w in s.words]))
    out[tag] = res
(WK/'asr.json').write_text(json.dumps(out, ensure_ascii=False, indent=1))
