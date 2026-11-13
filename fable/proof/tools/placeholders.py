#!/usr/bin/env python3
"""Placeholder plates for the proof (fable/proof). Satisfies the plate contract in fable/proof/NOTES.md:
  work_fable/proof/plates/<id>/frames/f_%04d.jpg  1280x720, 24 fps, from f_0001.jpg
  work_fable/proof/plates/<id>/meta.json           {"fps":24,"n":<frames>,"turn_t":<s or null>}
Each card: flat mid-grey in a distinct tint, the id in large letters, a frame counter, a dot that runs left to right
(continuous motion), and the TURN PATCH: a 100x100 square at top centre (x 590-690, y 20-120) that is BLACK before
turn_t and WHITE from turn_t on (frame i shows clip time (i-1)/24). fable/proof/tools/check.py samples that patch.
Never touches a plate folder that contains a file named REAL.
  .venv/bin/python fable/proof/tools/placeholders.py [--force] [ids...]
"""
import json, os, sys
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT = os.path.join(ROOT, 'work_fable', 'proof', 'plates')
FONT_MONO = os.path.join(ROOT, 'engine', 'fonts', 'JetBrainsMono[wght].ttf')
IDS = ['piano', 'violin', 'wushu', 'wetlab', 'phd', 'poet', 'ames', 'band', 'chezjj', 'sandstorm', 'home', 'violet', 'root', 'hero']
TINT = {'piano': '#FF3D7F', 'violin': '#FFD23F', 'wushu': '#FF6B5E', 'wetlab': '#3DDC97', 'phd': '#22D3EE', 'poet': '#E24BD6',
        'ames': '#3D8BFF', 'band': '#FF6B5E', 'chezjj': '#3DDC97', 'sandstorm': '#22D3EE', 'home': '#FF3D7F', 'violet': '#9B6BFF',
        'root': '#BFD9FF', 'hero': '#FF7A1A'}
W, H, FPS, N, TURN = 1280, 720, 24, 120, 2.5
PATCH = (590, 20, 690, 120)
GREY = [128, 210, 96, 185, 140, 220, 110, 196, 128, 205, 150, 90, 170, 140]


def hexrgb(h):
    h = h.lstrip('#'); return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


def card(pid, i, turn, base):
    t = i / FPS
    im = Image.new('RGB', (W, H), base); d = ImageDraw.Draw(im)
    big = ImageFont.truetype(FONT_MONO, 150); small = ImageFont.truetype(FONT_MONO, 40)
    d.text((W / 2, H / 2 - 10), pid.upper(), font=big, fill=(236, 232, 224), anchor='mm')
    d.text((40, H - 50), f'f_{i + 1:04d}   t {t:5.3f}s   turn {"-" if turn is None else f"{turn:.2f}s"}', font=small, fill=(20, 20, 30), anchor='lm')
    # continuous motion: a dot runs left to right across the clip, and a bar spins
    x = 80 + (W - 160) * (t / (N / FPS)); d.ellipse((x - 22, 520 - 22, x + 22, 520 + 22), fill=(250, 245, 235))
    import math
    a = t * 2.4; cx, cy, r = 160, 140, 70
    d.line((cx - r * math.cos(a), cy - r * math.sin(a), cx + r * math.cos(a), cy + r * math.sin(a)), fill=(20, 20, 30), width=10)
    # the turn patch: black before turn_t, white from turn_t on; plus a label
    if turn is not None:
        after = t >= turn - 1e-9
        d.rectangle(PATCH, fill=(255, 255, 255) if after else (0, 0, 0))
        d.text(((PATCH[0] + PATCH[2]) / 2, PATCH[3] + 28), 'TURNED' if after else 'at work', font=small, fill=(20, 20, 30), anchor='mm')
    return im


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]; force = '--force' in sys.argv
    for pid in (args or IDS):
        d = os.path.join(OUT, pid)
        if os.path.exists(os.path.join(d, 'REAL')):
            print(f'{pid}: REAL plate present, left alone'); continue
        mp = os.path.join(d, 'meta.json')
        if os.path.exists(mp):
            try: ph = json.load(open(mp)).get('placeholder') is True
            except Exception: ph = False
            if not ph:
                print(f'{pid}: meta.json without "placeholder": true (a real plate?), left alone'); continue
            if not force:
                print(f'{pid}: placeholder exists (use --force to rebuild)'); continue
        elif os.path.isdir(os.path.join(d, 'frames')) and os.listdir(os.path.join(d, 'frames')):
            print(f'{pid}: frames present but no meta.json, left alone'); continue
        os.makedirs(os.path.join(d, 'frames'), exist_ok=True)
        turn = None if pid == 'root' else TURN
        tint = hexrgb(TINT[pid]); g0 = GREY[IDS.index(pid)]; grey = (g0, g0, g0)   # some light, some dark: tests type legibility
        base = tuple(int(g * 0.72 + c * 0.28) for g, c in zip(grey, tint))
        for i in range(N):
            card(pid, i, turn, base).save(os.path.join(d, 'frames', f'f_{i + 1:04d}.jpg'), quality=90)
        with open(os.path.join(d, 'meta.json'), 'w') as f: json.dump({'fps': FPS, 'n': N, 'turn_t': turn, 'placeholder': True}, f)
        print(f'{pid}: {N} frames, turn_t {turn}')


if __name__ == '__main__':
    main()
