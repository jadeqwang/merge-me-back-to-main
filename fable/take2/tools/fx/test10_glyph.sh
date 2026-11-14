#!/usr/bin/env bash
# PLAN section 9 test 10: the open-source plate ("my life in open source", jade/open-source) in real characters, her figure kept.
# Source: work_fable/proof/plates/sandstorm (still.jpg 2048x1152 and frames/ 1280x720 at 24 fps).
# Keep masks: BiRefNet (local) cut to the piece that contains her head (fable/take2/tools/fx/matte.py), needs a python with
# onnxruntime + opencv: PY=/home/jade/Documents/1-music-shipped/holdfire/.venv/bin/python (override with PY=...).
# Text: the twelve lives' commit messages (fable/proof/lives.js) and 60 real lines of this repo's git log --oneline (trimmed to a word).
# Outputs in work_fable/take2/tests/glyph/: glyph_sheet.png (source | source colour | lane palette, 1080p panels), glyph_sheet_half.png,
# glyph_still.png (1080p), glyph.mp4 (3 s, 30 fps, 1080p), glyph_side.mp4 (source | glyph, half size).
set -euo pipefail
cd "$(dirname "$0")/../../../.."
G=work_fable/take2/tests/glyph; SRC=work_fable/proof/plates/sandstorm; PY=${PY:-/home/jade/Documents/1-music-shipped/holdfire/.venv/bin/python}
mkdir -p $G
[ -f $G/keep_still.png ] || $PY -I fable/take2/tools/fx/matte.py --in $SRC/still.jpg --out $G/keep_still.png --seed 0.69,0.15 --region 0.44,0,0.9,1
[ -d $G/keep_frames ] && [ "$(ls $G/keep_frames | wc -l)" -ge 121 ] || nice -n 10 $PY -I fable/take2/tools/fx/matte.py --in $SRC/frames --out $G/keep_frames --seed 0.69,0.15 --region 0.44,0,0.9,1 --every 3
$PY -I fable/take2/tools/fx/matte.py --to-rgba --in $G/keep_still.png --out $G/keep_still.png      # older grey masks -> RGBA (no-op if RGBA)
$PY -I fable/take2/tools/fx/matte.py --to-rgba --in $G/keep_frames --out $G/keep_frames
python3 - "$G" <<'EOF'
import json, re, subprocess, random, sys
G = sys.argv[1]
lives = open('fable/proof/lives.js').read()
msgs = re.findall(r"branch: '([^']+)',\s*msg: '([^']+)'", lives)
gl = subprocess.run(['git', 'log', '--oneline', '-n', '600'], capture_output=True, text=True).stdout.splitlines()
def trim(l, n=58):
    if len(l) <= n: return l
    l = l[:n]; return l[:l.rfind(' ')].rstrip(' ,;:(')
gl = [trim(l) for l in gl if len(l) > 20]
random.seed(3); text = [f'{b}: {m}' for b, m in msgs] + random.sample(gl, min(60, len(gl))); random.shuffle(text)
base = {'text': text, 'seed': 3, 'gain': 2.4, 'gamma': .6, 'local': .8, 'peak': .8, 'hi': .9, 'thresh': .12, 'floor': .22,
        'depth': [.69, .71], 'dither': 0}
json.dump(base, open(f'{G}/opts_glyph.json', 'w'))
json.dump([base, dict(base, palette=['#0A4650', '#22D3EE', '#F0FFFF'])], open(f'{G}/opts_glyph_two.json', 'w'))
EOF
FX="node fable/take2/tools/fx/fx.mjs --pass glyph"
$FX --in $SRC/still.jpg --mask $G/keep_still.png --out $G/glyph_sheet.png --opts @$G/opts_glyph_two.json --side
$FX --in $SRC/still.jpg --mask $G/keep_still.png --out $G/glyph_sheet_half.png --opts @$G/opts_glyph_two.json --side --scale-out 0.5
$FX --in $SRC/still.jpg --mask $G/keep_still.png --out $G/glyph_still.png --opts @$G/opts_glyph.json --time 8
$FX --in $SRC/frames --mask $G/keep_frames --srcfps 24 --dur 3 --out $G/glyph.mp4 --opts @$G/opts_glyph.json --workers 2
$FX --in $SRC/frames --mask $G/keep_frames --srcfps 24 --dur 3 --out $G/glyph_side.mp4 --opts @$G/opts_glyph.json --side --workers 2 --scale-out 0.5
ls -la $G/*.png $G/*.mp4
