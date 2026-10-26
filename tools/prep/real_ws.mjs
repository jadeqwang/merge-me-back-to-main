#!/usr/bin/env node
// The ?drop=real run sheet's commands, printed from the one segment table (engine/show/real_ws.js), so the cuts never drift from the EDL's keys.
// Prints; runs nothing. docs/wushu_real_routine.md explains each step and what to check.
//   node tools/prep/real_ws.mjs [--src=work/<the ignored folder>/<video>.mp4] [--py=.venv/bin/python] [--seg=burst,fall] [--refs]
//     (default: every segment; --refs adds step B, the motion-reference clips and first frames)
process.removeAllListeners('warning');
import path from 'node:path'; import url from 'node:url';
const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '../..');
const W = await import(url.pathToFileURL(path.join(REPO, 'engine/show/real_ws.js')).href);
const opt = (k, d) => { const a = process.argv.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const SRC = opt('src', '"$SRC"'), PY = opt('py', '.venv/bin/python'), segs = opt('seg', Object.keys(W.SEGS).join(',')).split(',');
const f = (x) => x.toFixed(3).replace(/\.?0+$/, '');
console.log(`# ?drop=real run sheet (engine/show/real_ws.js). SRC = the competition video in the box's ignored folder, e.g.
#   export SRC=work/<folder>/<file>.mp4      (never commit it, its frames or its URL)
mkdir -p media/real_ws/ref media/plates/real_ws work/real_ws`);
for (const seg of segs) {
  const S = W.SEGS[seg]; if (!S) { console.log(`# unknown segment ${seg}`); continue; }
  const [cw, ch, cx, cy] = S.crop, len = S.out - S.in, b = `real_ws_${seg}`;
  console.log(`\n# ---- ${seg}: video ${f(S.in)}-${f(S.out)} s (${f(len)} s), crop ${cw}x${ch}+${cx}+${cy}; keys ${JSON.stringify(S.keys)}
# 1. contact sheet of the source with the crop drawn (2 fps): all six inside the box for the whole segment? the key moves where the keys say?
ffmpeg -v error -y -ss ${f(S.in)} -t ${f(len)} -i ${SRC} -vf "fps=2,drawbox=x=${cx}:y=${cy}:w=${cw}:h=${ch}:color=yellow:t=1,tile=10x2" -frames:v 1 work/real_ws/${b}_src.jpg
# 2. the cut: frame-accurate (re-encoded), native 15 fps, cropped 16:9, no audio
ffmpeg -v error -y -ss ${f(S.in)} -t ${f(len)} -i ${SRC} -vf "crop=${cw}:${ch}:${cx}:${cy}" -an -c:v libx264 -crf 12 -pix_fmt yuv420p media/real_ws/${b}.mp4
# 3. prep (depth + matte) at 3x (960 px wide), keeping 15 fps; then the per-performer split and lanes (check work/plates/${b}_lanes.jpg)
${PY} tools/prep/prep.py media/real_ws/${b}.mp4 work/plates/${b} --w=960 --fps=15
python3 tools/prep/lanes.py work/plates/${b}`);
  if (process.argv.includes('--refs')) console.log(`# B. motion reference: the same cut at 854x480 (lanczos), native fps, no audio (sent to the model as a data: URI); its first frame for the start still
ffmpeg -v error -y -i media/real_ws/${b}.mp4 -vf "scale=854:480:flags=lanczos" -an -c:v libx264 -crf 16 -pix_fmt yuv420p media/real_ws/ref/${b}_480p.mp4
ffmpeg -v error -y -i media/real_ws/${b}.mp4 -vf "scale=1280:720:flags=lanczos" -frames:v 1 media/plates/real_ws/${b}_f0.png`);
}
console.log(`\n# then: node tools/edl_check.mjs --q="drop=real" (expect 0 exceptions, 0 held clocks, and the real_ws_* plates in --list), and stills:
# node engine/render.mjs --q "show=/engine/show/main.js&drop=real" --stills 154.2:r89.png,158.4:r92.png,166.6:r96.png,167.5:r97.png,169.6:r98.png,172.3:r100.png,173.4:r100s.png --res 1920x1080`);
