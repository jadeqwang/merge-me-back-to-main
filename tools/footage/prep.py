#!/usr/bin/env python3
"""Prepare Jade's synced phone clips for the v6 engine (footage intake, step 2; run tools/footage/sync.py first).

    python3 tools/footage/prep.py [TAKES...] [--width=960] [--raw-width=1920] [--sync=work/footage/sync.json]

For each take in sync.json: frames at 24 fps to work/footage/<take>/000000.jpg ... + meta.json {fps, n, w, h, s0, take, kind: 'footage'}
(engine/src/v6/seq.js). Text slots only need ~960 px; H1/H2 (shown unprocessed in the switch) are written at --raw-width and best quality.
HDR phone video (HLG / PQ, the iPhone default) is tone-mapped to SDR BT.709 when ffmpeg has zscale; otherwise it warns (better: film
with HDR Video off). Then work/footage/index.json maps each shot ID to its pick: docs/footage_picks.json {"A1": "A1_t2"} if listed,
else the best-synced take of that ID. Matte/depth prep stays on the box (tools/prep/prep.py; the weights come from Hugging Face).
"""
import json, os, shutil, subprocess, sys

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FF = os.environ.get('FFMPEG', 'ffmpeg')
RAW_SHOTS = ('H1', 'H2')


def probe(path):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-show_entries',
                        'stream=width,height,color_transfer,color_primaries,pix_fmt:stream_side_data=rotation', '-of', 'json', path],
                       capture_output=True, text=True)
    return (json.loads(r.stdout or '{}').get('streams') or [{}])[0]


def has_zscale():
    return 'zscale' in subprocess.run([FF, '-hide_banner', '-filters'], capture_output=True, text=True).stdout


def prep(take, e, width, raw_width):
    src = e['file'] if os.path.isabs(e['file']) else os.path.join(ROOT, e['file'])
    st = probe(src)
    raw = e.get('shot') in RAW_SHOTS
    w = raw_width if raw else width
    vf = []
    if st.get('color_transfer') in ('arib-std-b67', 'smpte2084'):
        if has_zscale():
            vf.append('zscale=t=linear:npl=100,format=gbrpf32le,zscale=p=bt709,tonemap=tonemap=hable:desat=0,zscale=t=bt709:m=bt709:r=tv,format=yuv420p')
        else:
            print(f'  WARNING {take}: HDR ({st.get("color_transfer")}) and this ffmpeg has no zscale: colours will be off. '
                  'Use an ffmpeg with zscale, or re-film with HDR Video off.')
    vf += ['fps=24', f'scale={w}:-2:flags=lanczos']
    d = os.path.join(ROOT, 'work/footage', take)
    shutil.rmtree(d, ignore_errors=True); os.makedirs(d)
    subprocess.run([FF, '-v', 'error', '-y', '-i', src, '-vf', ','.join(vf), '-q:v', '1' if raw else '3', '-start_number', '0',
                    os.path.join(d, '%06d.jpg')], check=True)   # ffmpeg applies the phone's rotation by itself
    n = len([f for f in os.listdir(d) if f.endswith('.jpg')])
    ow, oh = map(int, subprocess.run(['ffprobe', '-v', 'error', '-show_entries', 'stream=width,height', '-of', 'csv=p=0',
                                      os.path.join(d, '000000.jpg')], capture_output=True, text=True).stdout.strip().split(','))
    meta = {'fps': 24, 'n': n, 'w': ow, 'h': oh, 's0': e['s0'], 'take': take, 'kind': 'footage', 'synced': e['ok'], 'corr': e['corr']}
    json.dump(meta, open(os.path.join(d, 'meta.json'), 'w'))
    print(f'{take}: {n} frames {ow}x{oh}  s0 {e["s0"]}{"" if e["ok"] else "  (sync low confidence: set s0 by hand in sync.json)"}')
    return meta


def main():
    opt = {k: v for k, v in (a[2:].split('=', 1) for a in sys.argv[1:] if a.startswith('--') and '=' in a)}
    only = [a for a in sys.argv[1:] if not a.startswith('--')]
    sync = json.load(open(opt.get('sync', os.path.join(ROOT, 'work/footage/sync.json'))))
    width, raw_width = int(opt.get('width', 960)), int(opt.get('raw-width', 1920))
    done = {}
    for take, e in sync.items():
        if only and take not in only and e.get('shot') not in only:
            continue
        done[take] = prep(take, e, width, raw_width)
    # the index: one pick per shot ID
    pf = os.path.join(ROOT, 'docs/footage_picks.json')
    picks = json.load(open(pf)) if os.path.exists(pf) else {}
    index = {}
    for take, e in sync.items():
        sid = e.get('shot')
        if not sid or not os.path.exists(os.path.join(ROOT, 'work/footage', take, 'meta.json')):
            continue
        cur = index.get(sid)
        better = cur is None or (e['ok'], e['corr']) > (sync[cur['take']]['ok'], sync[cur['take']]['corr'])
        if picks.get(sid) == take or (picks.get(sid) is None and better):
            index[sid] = {'dir': f'/work/footage/{take}', 'take': take, 's0': e['s0']}
    json.dump(index, open(os.path.join(ROOT, 'work/footage/index.json'), 'w'), indent=1)
    print('index:', ', '.join(f'{k} = {v["take"]}' for k, v in sorted(index.items())))


if __name__ == '__main__':
    main()
