"""Forced alignment (stable-ts / whisper large-v3) of the known lyric text, one line per search window, on the demucs
vocal stem. Adapted from vibesong/tools/align.py. Output: work/aligned_st.json"""
import json, subprocess
from pathlib import Path
import numpy as np, stable_whisper
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
dec = subprocess.run([str(ROOT/'work/bin/ffmpeg'), '-v', 'error', '-i', str(AN/'stems'/__import__('os').environ.get('VOC','vocals.wav')),
                      '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
audio = np.frombuffer(dec, dtype=np.float32).copy()
L = json.loads((LINES).read_text())
model = stable_whisper.load_model('large-v3', device='cuda')
out = []
for ln in L:
    a, b = ln['win']; txt = ln.get('align_text', ln['text'])
    r = model.align(audio[int(a*16000):int(b*16000)], txt, language='en',
                    original_split=False, regroup=False, vad=False, suppress_silence=True, verbose=None)
    words = [dict(w=w.word.strip(), start=round(w.start+a, 3), end=round(w.end+a, 3), p=round(float(w.probability), 3))
             for s in r.segments for w in s.words]
    out.append(dict(ln, words=words))
    print(f"{ln['id']:>3} {words[0]['start']:7.2f}-{words[-1]['end']:7.2f} | " +
          ' '.join(f"{w['w']}@{w['start']:.2f}-{w['end']:.2f}({w['p']:.2f})" for w in words), flush=True)
(WK/('aligned_st'+__import__('os').environ.get('TAG','')+'.json')).write_text(json.dumps(out, ensure_ascii=False, indent=1))
