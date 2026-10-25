"""Independent CTC forced alignment (torchaudio MMS_FA) of each lyric line inside its window on the demucs vocal stem.
Adapted from vibesong/tools/ctc_align.py (English only). Output: work/aligned_ctc.json"""
import json, re, subprocess
from pathlib import Path
import numpy as np, torch, torchaudio
ROOT = Path(__file__).resolve().parents[2]
from apaths import WK, AN, LINES, SONG, DUR
dec = subprocess.run([str(ROOT/'work/bin/ffmpeg'), '-v', 'error', '-i', str(AN/'stems'/__import__('os').environ.get('VOC','vocals.wav')),
                      '-ac', '1', '-ar', '16000', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
audio = torch.from_numpy(np.frombuffer(dec, dtype=np.float32).copy())
bundle = torchaudio.pipelines.MMS_FA
model = bundle.get_model(with_star=True).to('cuda').eval()
D = bundle.get_dict(star='*')
L = json.loads((LINES).read_text())
res = []
for ln in L:
    a, b = ln['win']
    wav = audio[int(a*16000):int(b*16000)][None].to('cuda')
    with torch.inference_mode():
        em, _ = model(wav)
    em = torch.log_softmax(em, -1)
    ws = [(t, t.lower().replace("'", "")) for t in re.findall(r"[A-Za-z']+", ln.get('align_text', ln['text']))]
    toks = [D['*']]; spans_idx = []
    for _, rom in ws:
        ids = [D[c] for c in rom if c in D]
        spans_idx.append((len(toks), len(toks)+len(ids))); toks += ids
    toks.append(D['*'])
    ali, sc = torchaudio.functional.forced_align(em, torch.tensor([toks], device='cuda'), blank=0)
    ali = ali[0].cpu().numpy(); sc = sc[0].exp().cpu().numpy()
    ratio = wav.shape[1] / em.shape[1] / 16000
    # map frames to token positions (handle repeated identical consecutive tokens via CTC path order)
    tspans = []; prev = None
    for f, t in enumerate(ali):
        if t == 0: prev = None; continue
        if t != prev: tspans.append([f, f+1, [sc[f]], t])
        else: tspans[-1][1] = f+1; tspans[-1][2].append(sc[f])
        prev = t
    # tspans[0] may be the star token
    if tspans and tspans[0][3] == D['*']: tspans = tspans[1:]
    if tspans and tspans[-1][3] == D['*']: tspans = tspans[:-1]
    words = []
    for (w, rom), (i0, i1) in zip(ws, spans_idx):
        seg = tspans[i0-1:i1-1]
        if not seg: continue
        s, e = seg[0][0]*ratio + a, seg[-1][1]*ratio + a
        words.append(dict(w=w, start=round(s, 3), end=round(e, 3), score=round(float(np.mean([np.mean(x[2]) for x in seg])), 3)))
    res.append(dict(id=ln['id'], text=ln['text'], words=words))
    print(f"{ln['id']:3d} " + ' '.join(f"{w['w']}@{w['start']:.2f}-{w['end']:.2f}({w['score']:.2f})" for w in words), flush=True)
(WK/('aligned_ctc'+__import__('os').environ.get('TAG','')+'.json')).write_text(json.dumps(res, ensure_ascii=False, indent=1))
