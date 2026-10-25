#!/usr/bin/env python3
"""Local review page for the renders: out/final/watch.html (open it straight from disk, file:// — no server needed).
  .venv/bin/python tools/watch_page.py
Embeds the measured lyric word timings (analysis/timing.json) so a karaoke line runs under the picture, timed from the frame the browser
actually presents (requestVideoFrameCallback mediaTime) — a reference for judging A/V sync independent of any desktop player's offset."""
import json, os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
def timing(d):
    T = json.load(open(os.path.join(ROOT, d, "timing.json")))
    bar = lambda n: T["bars"][n - 1]["start"]
    return {"lines": [{"t": l["text"], "s": l["start"], "e": l["end"], "w": [[w["w"], w["start"], w["end"]] for w in l["words"]]} for l in T["lyrics"]["lines"]],
            "bars": [b["start"] for b in T["bars"]], "teaser": {"a1": bar(17), "b0": bar(28)}}   # tools/teaser.py: intro 0..bar 17, then bar 28..
TIMINGS = {"v1": timing("analysis"), "v2": timing("analysis_v2")}
# (path relative to out/final, label, mode full|teaser, timing v1 = "Merge Me Back to Main" audio | v2 = revised "Merge")
VIDEOS = [
    ("../review/v3_port_540.mp4", "v3 · revised song “Merge” · 540p review render", "full", "v2"),
    ("../test/intro2/intro.mp4", "NEW intro (child at the window → drone tree) · 0–29 s · old song timing", "full", "v1"),
    ("merge_v2_1080p.mp4", "v2 · full (X-ready, 12 Mb/s)", "full", "v1"),
    ("merge_v2_teaser_x.mp4", "v2 · teaser for X", "teaser", "v1"),
    ("master_v2.mp4", "v2 · master (CRF 17, 4 GB)", "full", "v1"),
    ("merge_me_back_to_main_1080p.mp4", "v1 · full (for comparison)", "full", "v1"),
]
CHECKS = [(28.77, "0:28 I split myself"), (42.74, "0:42 Each one a light"), (47.75, "0:47 her lives"), (54.7, "0:54 the grid"),
          (70.05, "1:10 Merge me back"), (90.10, "1:30 Nothing that I lived"), (119.1, "1:59 drone tree"), (153.68, "2:33 drop"),
          (164.08, "2:44 wushu"), (181.73, "3:01 This branch"), (208.79, "3:28 Merge me (catch)"), (214.6, "3:34 every road"),
          (228.57, "3:48 Nothing (ch2)"), (249.3, "4:09 git log"), (284.8, "4:44 hotel")]

html = """<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Merge — review</title>
<style>
:root { --bg:#05060D; --ink:#FFF1DC; --dim:#8a8796; --orange:#FF7A1A; --line:#1d1f2e; }
* { box-sizing:border-box; }
body { margin:0; background:var(--bg); color:var(--ink); font:14px/1.45 ui-monospace, "JetBrains Mono", Menlo, monospace; }
main { max-width:1280px; margin:0 auto; padding:16px; }
h1 { font:800 22px/1.2 system-ui, sans-serif; letter-spacing:.04em; margin:4px 0 12px; }
h1 span { color:var(--orange); }
.bar { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin:8px 0; }
select, button { background:#111320; color:var(--ink); border:1px solid var(--line); border-radius:6px; padding:6px 10px; font:inherit; cursor:pointer; }
button:hover, select:hover { border-color:var(--orange); }
video { width:100%; aspect-ratio:16/9; background:#000; display:block; border-radius:4px; }
#kara { min-height:2.2em; font:600 24px/1.4 system-ui, sans-serif; text-align:center; margin:10px 0 4px; }
#kara .w { color:#4a4757; transition:none; }
#kara .w.on { color:var(--orange); }
#kara .w.done { color:var(--ink); }
#hud { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:8px; margin:8px 0; }
#hud div { background:#0c0e18; border:1px solid var(--line); border-radius:6px; padding:6px 10px; }
#hud b { display:block; color:var(--dim); font-weight:400; font-size:11px; text-transform:uppercase; letter-spacing:.08em; }
.checks button { font-size:12px; padding:4px 8px; }
.note { color:var(--dim); font-size:12px; }
kbd { border:1px solid var(--line); border-radius:4px; padding:0 4px; }
</style></head><body><main>
<h1><span>MERGE</span> — review player</h1>
<div class="bar">
  <select id="src">__OPTIONS__</select>
  <button id="play">play / pause</button>
  <button data-step="-1">◀ frame</button><button data-step="1">frame ▶</button>
  <select id="rate"><option>0.25</option><option>0.5</option><option selected>1</option></select>
</div>
<video id="v" controls preload="auto" playsinline></video>
<div id="kara"></div>
<div id="hud">
  <div><b>video time</b><span id="tv">–</span></div>
  <div><b>song time</b><span id="ts">–</span></div>
  <div><b>frame (30 fps)</b><span id="tf">–</span></div>
  <div><b>bar · beat</b><span id="tb">–</span></div>
</div>
<div class="bar checks" id="checks"></div>
<p class="note">Keys: <kbd>space</kbd> play/pause · <kbd>,</kbd> <kbd>.</kbd> step one frame · <kbd>j</kbd> <kbd>l</kbd> ∓1 s · <kbd>[</kbd> <kbd>]</kbd> speed.
The karaoke line is the measured vocal timing (analysis/timing.json), clocked from the frame the browser is presenting — if the lips match the
highlighted word, sync is right; if the audio leads/lags the highlight, the player is adding offset.</p>
</main>
<script>
const TIMINGS = __TIMINGS__, CHECKS = __CHECKS__, FPS = 30;
let LINES, BARS, TEASER;
const useTiming = () => { const k = src.selectedOptions[0].dataset.timing || 'v1'; ({ lines: LINES, bars: BARS, teaser: TEASER } = TIMINGS[k]); };
const v = document.getElementById('v'), src = document.getElementById('src'), kara = document.getElementById('kara');
const $ = (id) => document.getElementById(id);
const fmt = (t) => { const m = Math.floor(t / 60), s = t - m * 60; return `${m}:${s.toFixed(3).padStart(6, '0')}`; };
const mode = () => src.selectedOptions[0].dataset.mode;
const toSong = (t) => mode() === 'teaser' ? (t < TEASER.a1 ? t : t - TEASER.a1 + TEASER.b0) : t;
const toVideo = (s) => mode() === 'teaser' ? (s < TEASER.a1 ? s : (s >= TEASER.b0 ? s - TEASER.b0 + TEASER.a1 : null)) : s;
let curLine = -1;
function draw(t) {
  if (!LINES) useTiming();
  const s = toSong(t);
  $('tv').textContent = fmt(t); $('ts').textContent = fmt(s); $('tf').textContent = Math.round(t * FPS);
  let b = 0; while (b + 1 < BARS.length && BARS[b + 1] <= s) b++;
  const len = (BARS[b + 1] ?? BARS[b] + 1.74) - BARS[b];
  $('tb').textContent = `${b + 1} · ${(1 + 4 * (s - BARS[b]) / len).toFixed(2)}`;
  let li = LINES.findIndex((l) => s >= l.s - .4 && s <= l.e + .6);
  if (li !== curLine) { curLine = li; kara.innerHTML = li < 0 ? '' : LINES[li].w.map((w) => `<span class="w">${w[0]}</span>`).join(' '); }
  if (li >= 0) [...kara.children].forEach((el, i) => { const w = LINES[li].w[i]; el.className = 'w' + (s >= w[2] ? ' done' : s >= w[1] ? ' on' : ''); });
}
// clock from presented frames when available (frame-accurate), else timeupdate
if ('requestVideoFrameCallback' in HTMLVideoElement.prototype) {
  const tick = (now, md) => { draw(md.mediaTime); v.requestVideoFrameCallback(tick); };
  v.requestVideoFrameCallback(tick);
} else { const loop = () => { draw(v.currentTime); requestAnimationFrame(loop); }; loop(); }
v.addEventListener('seeked', () => draw(v.currentTime));
function load() { useTiming(); curLine = -1; const t = v.currentTime || 0, keep = v.dataset.mode === mode(); v.dataset.mode = mode(); v.src = src.value; if (keep) v.currentTime = t; v.playbackRate = +$('rate').value; }
src.onchange = () => { try { localStorage.setItem('merge-src', src.value); } catch (e) {} load(); };
try { const s = localStorage.getItem('merge-src'); if (s && [...src.options].some((o) => o.value === s)) src.value = s; } catch (e) {}
load();
$('play').onclick = () => (v.paused ? v.play() : v.pause());
$('rate').onchange = () => (v.playbackRate = +$('rate').value);
document.querySelectorAll('[data-step]').forEach((b) => (b.onclick = () => { v.pause(); v.currentTime = Math.max(0, (Math.round(v.currentTime * FPS) + +b.dataset.step) / FPS + .001); }));
const cb = $('checks');
CHECKS.forEach(([s, label]) => { const b = document.createElement('button'); b.textContent = label;
  b.onclick = () => { const t = toVideo(s - 1.0); if (t === null) { b.textContent = label + ' (not in teaser)'; return; } v.currentTime = Math.max(0, t); v.play(); }; cb.appendChild(b); });
document.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'SELECT') return;
  const k = e.key;
  if (k === ' ') { e.preventDefault(); v.paused ? v.play() : v.pause(); }
  else if (k === ',' || k === '.') { v.pause(); v.currentTime = Math.max(0, (Math.round(v.currentTime * FPS) + (k === '.' ? 1 : -1)) / FPS + .001); }
  else if (k === 'j' || k === 'l') v.currentTime = Math.max(0, v.currentTime + (k === 'l' ? 1 : -1));
  else if (k === '[' || k === ']') { const r = $('rate'), i = Math.max(0, Math.min(2, r.selectedIndex + (k === ']' ? 1 : -1))); r.selectedIndex = i; v.playbackRate = +r.value; }
});
</script></body></html>
"""
opts = "".join(f'<option value="{f}" data-mode="{m}" data-timing="{tk}">{label}</option>' for f, label, m, tk in VIDEOS if os.path.exists(os.path.join(ROOT, "out/final", f)))
html = html.replace("__OPTIONS__", opts).replace("__TIMINGS__", json.dumps(TIMINGS)).replace("__CHECKS__", json.dumps(CHECKS))
out = os.path.join(ROOT, "out/final/watch.html")
open(out, "w").write(html)
print(out)
