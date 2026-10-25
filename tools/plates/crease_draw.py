#!/usr/bin/env python3
"""Build out/review/crease_draw.html: Jade clicks her real crease onto the render (OS-venv: mediapipe/cv2).
  $OSPY tools/plates/crease_draw.py RENDER_CROP.png [PHOTO ...]
The page shows the eye band of the render (2× upscaled) with each photo aligned onto it by a similarity transform on the four eye corners
(fade slider, photo picker). Click points along the crease of each eye; "Save" downloads crease_points.json (coords in RENDER_CROP pixels)."""
import base64, json, os, sys, cv2, numpy as np, mediapipe as mp
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
render_p, photos = sys.argv[1], sys.argv[2:]
fm = mp.solutions.face_mesh.FaceMesh(static_image_mode=True, max_num_faces=1, refine_landmarks=True, min_detection_confidence=.2)
fd = mp.solutions.face_detection.FaceDetection(model_selection=1, min_detection_confidence=.2)


def mesh(im):
    h, w = im.shape[:2]; r = fm.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB))
    if r.multi_face_landmarks: return np.array([[q.x * w, q.y * h] for q in r.multi_face_landmarks[0].landmark])
    b = fd.process(cv2.cvtColor(im, cv2.COLOR_BGR2RGB)).detections[0].location_data.relative_bounding_box
    cx, cy, sz = (b.xmin + b.width / 2) * w, (b.ymin + b.height / 2) * h, max(b.width * w, b.height * h) * 1.8
    x0, y0 = int(max(0, cx - sz / 2)), int(max(0, cy - sz / 2)); c = im[y0:int(min(h, cy + sz / 2)), x0:int(min(w, cx + sz / 2))]
    k = 768 / max(c.shape[:2]); c2 = cv2.resize(c, None, fx=k, fy=k); r = fm.process(cv2.cvtColor(c2, cv2.COLOR_BGR2RGB))
    return np.array([[x0 + q.x * c2.shape[1] / k, y0 + q.y * c2.shape[0] / k] for q in r.multi_face_landmarks[0].landmark])


CORNERS = [33, 133, 362, 263]
R = cv2.imread(render_p); LR = mesh(R)
idx = [70, 105, 107, 336, 334, 300, 33, 133, 362, 263, 145, 374]
x0, y0 = LR[idx].min(0); x1, y1 = LR[idx].max(0); px, py = (x1 - x0) * .12, (y1 - y0) * .45
X0, Y0, X1, Y1 = int(max(0, x0 - px)), int(max(0, y0 - py)), int(min(R.shape[1], x1 + px)), int(min(R.shape[0], y1 + py))
SC = 2
band = cv2.resize(R[Y0:Y1, X0:X1], None, fx=SC, fy=SC, interpolation=cv2.INTER_CUBIC)
enc = lambda im: "data:image/jpeg;base64," + base64.b64encode(cv2.imencode(".jpg", im, [cv2.IMWRITE_JPEG_QUALITY, 92])[1]).decode()
layers = []
for p in photos:
    P = cv2.imread(p); LP = mesh(P)
    M, _ = cv2.estimateAffinePartial2D(LP[CORNERS].astype(np.float32), LR[CORNERS].astype(np.float32))
    warped = cv2.warpAffine(P, M, (R.shape[1], R.shape[0]), flags=cv2.INTER_CUBIC)
    layers.append({"name": os.path.basename(p), "src": enc(cv2.resize(warped[Y0:Y1, X0:X1], None, fx=SC, fy=SC, interpolation=cv2.INTER_CUBIC))})
bx = lambda P: [float((P[0] - X0) * SC), float((P[1] - Y0) * SC)]
meta = {"render": os.path.relpath(render_p, ROOT), "box": [X0, Y0, X1, Y1], "scale": SC, "W": band.shape[1], "H": band.shape[0],
        "split": bx(LR[168])[0], "eyes": {"R": bx(LR[[33, 133]].mean(0)), "L": bx(LR[[362, 263]].mean(0))}}
html = """<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Crease — click your crease</title>
<style>body{margin:0;background:#05060D;color:#FFF1DC;font:14px/1.4 ui-monospace,Menlo,monospace}main{padding:16px;max-width:1600px;margin:0 auto}
.bar{display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin:8px 0}button,select{background:#111320;color:#FFF1DC;border:1px solid #2a2d40;border-radius:6px;padding:6px 10px;font:inherit;cursor:pointer}
button.on{border-color:#FF7A1A;color:#FF7A1A}.view{display:flex;gap:12px;align-items:flex-start}.view.sbs .pane{width:calc(50% - 6px)}.pane{position:relative;width:100%;overflow:hidden}
.pane>img{display:block;width:100%}.layer{position:absolute;inset:0;pointer-events:none}.layer img{position:absolute;left:0;top:0;width:100%;transform-origin:0 0}
canvas{position:absolute;inset:0}#side{display:none}.view.sbs #side{display:block}.cap{color:#8a8796;font-size:12px;padding:4px 0}.note{color:#8a8796}
.move canvas{cursor:grab}.draw canvas{cursor:crosshair}</style></head><body><main>
<h2 style="font:700 18px system-ui">Click where your crease is — on each eye, a few points from the inner end to the outer end</h2>
<div class="bar"><span>eye:</span><button id="eR" class="on">left-of-screen eye</button><button id="eL">right-of-screen eye</button>
<span style="margin-left:14px">mode:</span><button id="mD" class="on">draw points</button><button id="mM">move photo eye</button>
<button id="undo">undo point</button><button id="clr">clear points (this eye)</button><button id="rst">reset alignment</button></div>
<div class="bar"><span>photo:</span><select id="pick"></select><span>fade</span><input id="fade" type="range" min="0" max="100" value="50"><span id="fv">50%</span>
<span style="margin-left:14px">view:</span><button id="vO" class="on">overlay</button><button id="vS">side by side</button>
<button id="save" style="margin-left:18px;border-color:#FF7A1A">Save points</button></div>
<div class="view" id="view"><div class="pane draw" id="wrap"><img id="base" src="__BASE__"><div class="layer" id="lay1"></div><canvas id="cv"></canvas><div class="cap">render (+ your photo overlaid)</div></div>
<div class="pane draw" id="side"><img id="base2" src="__BASE__" style="visibility:hidden"><div class="layer" id="lay2"></div><canvas id="cv2"></canvas><div class="cap">your photo</div></div></div>
<p class="note"><b>Move photo eye:</b> pick an eye, then drag to move your photo's eye onto the cartoon eye · scroll = scale · Shift+scroll = rotate. Each eye aligns separately.
<b>Draw points:</b> click along your crease (on either panel). <b>Save points</b> downloads crease_points.json (points + your alignment).</p>
<pre id="out" class="note"></pre></main><script>
const META=__META__, LAYERS=__LAYERS__; const W=META.W, H=META.H;
const base=document.getElementById('base'), cv=document.getElementById('cv'), cv2=document.getElementById('cv2');
const pts={R:[],L:[]}, al={R:{x:0,y:0,s:1,r:0},L:{x:0,y:0,s:1,r:0}}; let eye='R', mode='draw', sbs=false;
const pick=document.getElementById('pick'); LAYERS.forEach((l,i)=>{const o=document.createElement('option');o.value=i;o.textContent=l.name;pick.appendChild(o)});
// two per-eye photo layers in each pane, each clipped to its half of the face
function mkLayers(id){const L=document.getElementById(id);L.innerHTML='';const out={};for(const e of ['R','L']){const im=document.createElement('img');
  const x=META.split/W*100; im.style.clipPath=e==='R'?`inset(0 ${100-x}% 0 0)`:`inset(0 0 0 ${x}%)`; L.appendChild(im); out[e]=im;} return out;}
let IM1=mkLayers('lay1'), IM2=mkLayers('lay2');
const k=()=>W/base.clientWidth;
function apply(){const src=LAYERS.length?LAYERS[+pick.value].src:'';const op=document.getElementById('fade').value/100;
  for(const [set,isSide] of [[IM1,false],[IM2,true]]) for(const e of ['R','L']){const a=al[e],c=META.eyes[e],im=set[e];if(im.src!==src)im.src=src;
    const sc=base.clientWidth/W, cx=c[0]*sc, cy=c[1]*sc;
    im.style.transform=`translate(${cx+a.x*sc}px,${cy+a.y*sc}px) rotate(${a.r}deg) scale(${a.s}) translate(${-cx}px,${-cy}px)`;
    im.style.opacity=isSide?1:(sbs?0:op);}}
pick.onchange=apply; document.getElementById('fade').oninput=(e)=>{document.getElementById('fv').textContent=e.target.value+'%';apply()};
const fit=()=>{for(const c of [cv,cv2]){c.width=base.clientWidth;c.height=base.clientHeight}apply();draw()}; base.onload=fit; window.onresize=fit;
function draw(){for(const c of [cv,cv2]){const g=c.getContext('2d');g.clearRect(0,0,c.width,c.height);for(const [e,col] of [['R','#4FE3B0'],['L','#FFD23F']]){const p=pts[e];g.strokeStyle=col;g.fillStyle=col;g.lineWidth=2;g.beginPath();
 p.forEach(([x,y],i)=>{const X=x/k(),Y=y/k();i?g.lineTo(X,Y):g.moveTo(X,Y)});g.stroke();p.forEach(([x,y])=>{g.beginPath();g.arc(x/k(),y/k(),4,0,7);g.fill()})}}}
let drag=null;
for(const c of [cv,cv2]){
 c.onmousedown=(e)=>{if(mode!=='move')return;drag={x:e.clientX,y:e.clientY,a:{...al[eye]}};c.style.cursor='grabbing'};
 c.onclick=(e)=>{if(mode!=='draw')return;const r=c.getBoundingClientRect();pts[eye].push([(e.clientX-r.left)*k(),(e.clientY-r.top)*k()]);draw()};
 c.onwheel=(e)=>{if(mode!=='move')return;e.preventDefault();const a=al[eye];if(e.shiftKey)a.r+=e.deltaY>0?.5:-.5;else a.s*=e.deltaY>0?.985:1.015;apply()};}
window.onmousemove=(e)=>{if(!drag)return;const a=al[eye];a.x=drag.a.x+(e.clientX-drag.x)*k();a.y=drag.a.y+(e.clientY-drag.y)*k();apply()};
window.onmouseup=()=>{drag=null;for(const c of [cv,cv2])c.style.cursor=''};
const sel=(e)=>{eye=e;document.getElementById('eR').classList.toggle('on',e==='R');document.getElementById('eL').classList.toggle('on',e==='L')};
document.getElementById('eR').onclick=()=>sel('R');document.getElementById('eL').onclick=()=>sel('L');
const setMode=(m)=>{mode=m;document.getElementById('mD').classList.toggle('on',m==='draw');document.getElementById('mM').classList.toggle('on',m==='move');
 for(const p of [document.getElementById('wrap'),document.getElementById('side')]){p.classList.toggle('move',m==='move');p.classList.toggle('draw',m==='draw')}};
document.getElementById('mD').onclick=()=>setMode('draw');document.getElementById('mM').onclick=()=>setMode('move');
document.getElementById('undo').onclick=()=>{pts[eye].pop();draw()};document.getElementById('clr').onclick=()=>{pts[eye]=[];draw()};
document.getElementById('rst').onclick=()=>{al[eye]={x:0,y:0,s:1,r:0};apply()};
const setView=(v)=>{sbs=v;document.getElementById('view').classList.toggle('sbs',v);document.getElementById('vO').classList.toggle('on',!v);document.getElementById('vS').classList.toggle('on',v);requestAnimationFrame(fit)};
document.getElementById('vO').onclick=()=>setView(false);document.getElementById('vS').onclick=()=>setView(true);
document.getElementById('save').onclick=()=>{const [X0,Y0]=META.box,s=META.scale,tr=(p)=>p.map(([x,y])=>[X0+x/s,Y0+y/s]);
 const data={render:META.render,points:{screen_left:tr(pts.R),screen_right:tr(pts.L)},photo_compared:LAYERS.length?LAYERS[+pick.value].name:null,alignment_band_px:al};
 const b=new Blob([JSON.stringify(data,null,1)],{type:'application/json'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='crease_points.json';a.click();
 document.getElementById('out').textContent=JSON.stringify(data)};
</script></body></html>"""
html = html.replace("__BASE__", enc(band)).replace("__META__", json.dumps(meta)).replace("__LAYERS__", json.dumps(layers))
out = os.path.join(ROOT, "out/review/crease_draw.html"); open(out, "w").write(html); print(out)
