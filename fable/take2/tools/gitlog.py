#!/usr/bin/env python3
"""Capture the real `git log --graph` of this branch for the terminal shot (b153-156) into fable/take2/data/gitlog.json.
   python3 fable/take2/tools/gitlog.py [branch]      (default fable/merge)
render_film.sh runs it before every film render (film v3: the log is recaptured at render time, so the terminal shows the branch
as it is when the film is made). Messages are cut at 86 characters (one row at mono 34 px). Run single-frame checks after the
render without re-running this, or the terminal frames will differ from the render's."""
import json, os, subprocess, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
br = sys.argv[1] if len(sys.argv) > 1 else 'fable/merge'
cmd = ['git', 'log', '--graph', '--format=%h %s', br]
lines = subprocess.run(cmd, cwd=ROOT, check=True, capture_output=True, text=True).stdout.rstrip('\n').split('\n')
cut = lambda s: s if len(s) <= 86 else s[:85] + '…'
out = {'cmd': f'git log --graph --format="%h %s" {br}', 'note': 'real lines of this repo branch, captured for the terminal shot (b153-156) by tools/gitlog.py at render time; messages cut at 86 characters',
       'head': lines[0][2:9] if lines else None, 'lines': [cut(l) for l in lines]}
p = os.path.join(ROOT, 'fable', 'take2', 'data', 'gitlog.json')
with open(p, 'w') as f: f.write('{\n' + ',\n'.join(f'{json.dumps(k)}: {json.dumps(v)}' for k, v in out.items() if k != 'lines') + ',\n"lines": [\n' + ',\n'.join(json.dumps(l) for l in out['lines']) + '\n]\n}\n')
print(f'gitlog: {len(lines)} lines, head {out["head"]} -> {os.path.relpath(p, ROOT)}')
