"""Third independent aligner: English wav2vec2 (torchaudio WAV2VEC2_ASR_LARGE_LV60K_960H) CTC forced alignment of each
line inside its window. Output: work/aligned_w2v<TAG>.json"""
import json, re, subprocess, os
from pathlib import Path
import numpy as np, torch, torchaudio
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
VOC = os.environ.get('VOC', 'vocals.wav'); TAG = os.environ.get('TAG', '')
dec = subprocess.run([str(ROOT/'work/bin/ffmpeg'), '-v', 'error', '-i', str(AN/'stems'/VOC),
                      '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
audio = torch.from_numpy(np.frombuffer(dec, dtype=np.float32).copy())
B = torchaudio.pipelines.WAV2VEC2_ASR_LARGE_LV60K_960H
model = B.get_model().to('cuda').eval(); labels = B.get_labels(); D = {c: i for i, c in enumerate(labels)}
L = json.loads((LINES).read_text())
res = []
for ln in L:
    a, b = ln['win']
    wav = audio[int(a*16000):int(b*16000)][None].to('cuda')
    with torch.inference_mode():
        em, _ = model(wav)
    em = torch.log_softmax(em, -1)
    ws = re.findall(r"[A-Za-z']+", ln.get('align_text', ln['text']))
    toks = []; spans = []
    for k, w in enumerate(ws):
        ids = [D[c] for c in w.upper() if c in D]
        spans.append((len(toks), len(toks)+len(ids))); toks += ids
        if k < len(ws)-1: toks.append(D['|'])
    ali, sc = torchaudio.functional.forced_align(em, torch.tensor([toks], device='cuda'), blank=0)
    ali = ali[0].cpu().numpy(); sc = sc[0].exp().cpu().numpy()
    ratio = wav.shape[1] / em.shape[1] / 16000
    # walk path: token position advances when a non-blank label differs from previous frame label or follows blank
    pos = -1; prev = 0; first = {}; last = {}; scores = {}
    for f, t in enumerate(ali):
        if t != 0 and (t != prev):
            pos += 1
        if t != 0:
            first.setdefault(pos, f); last[pos] = f; scores.setdefault(pos, []).append(sc[f])
        prev = t
    words = []
    for w, (i0, i1) in zip(ws, spans):
        if i0 not in first: continue
        s = first[i0]*ratio + a; e = (last.get(i1-1, first[i0]) + 1)*ratio + a
        words.append(dict(w=w, start=round(s, 3), end=round(e, 3), score=round(float(np.mean([np.mean(scores[p]) for p in range(i0, i1) if p in scores])), 3)))
    res.append(dict(id=ln['id'], text=ln['text'], words=words))
    print(f"{ln['id']:3d} " + ' '.join(f"{w['w']}@{w['start']:.2f}-{w['end']:.2f}({w['score']:.2f})" for w in words), flush=True)
(WK/f'aligned_w2v{TAG}.json').write_text(json.dumps(res, ensure_ascii=False, indent=1))
