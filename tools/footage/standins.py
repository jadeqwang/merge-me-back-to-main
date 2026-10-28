#!/usr/bin/env python3
"""Extract the v6 animatic's stand-in takes as frame sequences the engine reads (engine/src/v6/seq.js).

    python3 tools/footage/standins.py [--width=640] [IDS...]

For every slot in engine/show/v6_slots.json with a `standin`, finds <take>.mp4 in review/takes/ (cloud and box) or media/gen/ (box only),
writes work/standin/<ID>/000000.jpg ... + meta.json {fps, n, w, h, s0, take, kind}, and work/standin/index.json. Slots whose take isn't on
this machine are skipped (the engine draws their labelled card). Stdlib + ffmpeg only.
"""
import json, os, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FF = os.environ.get('FFMPEG', 'ffmpeg')


def find(take):
    for d in ('review/takes', 'media/gen'):
        p = os.path.join(ROOT, d, take + '.mp4')
        if os.path.exists(p):
            return p
    return None


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    width = int(next((a.split('=')[1] for a in sys.argv[1:] if a.startswith('--width=')), 640))
    slots = json.load(open(os.path.join(ROOT, 'engine/show/v6_slots.json')))
    out = os.path.join(ROOT, 'work/standin')
    os.makedirs(out, exist_ok=True)
    ixf = os.path.join(out, 'index.json')
    index = json.load(open(ixf)) if os.path.exists(ixf) else {}
    for sid, s in slots.items():
        if sid.startswith('_') or 'standin' not in s or (args and sid not in args):
            continue
        take = s['standin']['take']
        src = find(take)
        if not src:
            print(f'{sid}: {take} not on this machine, card')
            index.pop(sid, None)
            continue
        d = os.path.join(out, sid)
        shutil.rmtree(d, ignore_errors=True)
        os.makedirs(d)
        subprocess.run([FF, '-v', 'error', '-y', '-i', src, '-vf', f'fps=24,scale={width}:-2', '-q:v', '3', '-start_number', '0',
                        os.path.join(d, '%06d.jpg')], check=True)
        n = len([f for f in os.listdir(d) if f.endswith('.jpg')])
        w, h = map(int, subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height', '-of',
                                        'csv=p=0', os.path.join(d, '000000.jpg')], capture_output=True, text=True).stdout.strip().split(','))
        meta = {'fps': 24, 'n': n, 'w': w, 'h': h, 's0': s['standin'].get('s0'), 'take': take, 'kind': 'standin'}
        json.dump(meta, open(os.path.join(d, 'meta.json'), 'w'))
        index[sid] = {'dir': f'/work/standin/{sid}', 'take': take, 's0': meta['s0']}
        print(f'{sid}: {take} -> {n} frames {w}x{h}')
    json.dump(index, open(ixf, 'w'), indent=1)


if __name__ == '__main__':
    main()
