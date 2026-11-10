// Roads: curves on the mirror. Each carries a bright core line, a line of real text set along it (JetBrains Mono caps), and commit nodes.
// Every point of a road has a reveal value g (think: the song time at which that point was written). A road is visible where g <= head.
// So "the road is written under her feet and never fades" is just head = t.
//
//   const R = engine.roads([{ pts:[[x,z],...], color:'#FF7A1A'|[r,g,b] linear, text:'COMMIT MESSAGE', g:[g0,g1] | gs:[equally spaced in arc length] | gk:[[u,g],...],
//                             width: 0.07 (m, half-width of the core), textSize: 0.42 (em, m), textSide: 1|-1, flip: false, repeat: true, textStart, textOff, textGap,
//                             nodes:[{u:0..1 | s:metres, r:0.35}], smooth: true }], { step, maxGlyphs });
//   R.drawable({ head, ink, gain, textGain, minPx, widthScale, halo, haloPx, headGain, headLen, pulses:[{g, width, gain}], flow, flowSpeed (negative = toward s=0), nodeAir (m; 0 = off) })  -> drawable for the 'ground' pass
//   R.roads[i].at(s) -> {x,z,tx,tz};  .len;  .gAt(s);  .sAtG(g)   (place a runner where the road is being written)
import { Program, FS_HEAD, canvasTex, hex } from './glx.js';
import { setFont } from './type.js';

function resample(pts, step, smooth) {
  // Catmull-Rom through the control points, then uniform arc length
  let dense = [];
  if (smooth === false || pts.length < 3) dense = pts.map((p) => [p[0], p[1]]);
  else {
    const n = pts.length; const P = (i) => pts[Math.min(n - 1, Math.max(0, i))];
    for (let i = 0; i < n - 1; i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2); const segLen = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]); const sub = Math.max(2, Math.ceil(segLen / Math.max(step * 0.5, 1e-3)));
      for (let k = 0; k < sub; k++) { const u = k / sub, u2 = u * u, u3 = u2 * u; dense.push([0, 1].map((j) => 0.5 * (2 * p1[j] + (-p0[j] + p2[j]) * u + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * u2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * u3))); } }
    dense.push([pts[n - 1][0], pts[n - 1][1]]);
  }
  const cum = [0]; for (let i = 1; i < dense.length; i++) cum.push(cum[i - 1] + Math.hypot(dense[i][0] - dense[i - 1][0], dense[i][1] - dense[i - 1][1]));
  const len = cum[cum.length - 1]; const n = Math.max(2, Math.ceil(len / step) + 1); const out = new Float32Array(n * 2); let j = 0;
  for (let i = 0; i < n; i++) { const s = (i / (n - 1)) * len; while (j < cum.length - 2 && cum[j + 1] < s) j++; const u = cum[j + 1] > cum[j] ? (s - cum[j]) / (cum[j + 1] - cum[j]) : 0; out[i * 2] = dense[j][0] + (dense[j + 1][0] - dense[j][0]) * u; out[i * 2 + 1] = dense[j][1] + (dense[j + 1][1] - dense[j][1]) * u; }
  // arc length of each control point (for per-control-point g)
  return { P: out, n, len, ds: len / (n - 1) };
}

class Road {
  constructor(def, step) {
    this.def = def; const r = resample(def.pts, def.step || step, def.smooth); Object.assign(this, r);
    const gs = def.gs || (def.g ? def.g : [0, 0]); this.gs = gs;   // linear in arc length between the given values
  }
  at(s) { const f = Math.min(this.n - 1.0001, Math.max(0, s / this.ds)); const i = Math.floor(f), u = f - i; const P = this.P;
    const x = P[i * 2] + (P[i * 2 + 2] - P[i * 2]) * u, z = P[i * 2 + 1] + (P[i * 2 + 3] - P[i * 2 + 1]) * u; let tx = P[i * 2 + 2] - P[i * 2], tz = P[i * 2 + 3] - P[i * 2 + 1]; const l = Math.hypot(tx, tz) || 1; return { x, z, tx: tx / l, tz: tz / l }; }
  // g along the road: def.gk = [[u, g], ...] (u = fraction of length, ascending) or gs/g = values equally spaced in arc length
  gAt(s) { const u = Math.min(1, Math.max(0, s / this.len)); const k = this.def.gk;
    if (k) { if (u <= k[0][0]) return k[0][1]; for (let i = 0; i < k.length - 1; i++) if (u <= k[i + 1][0]) return k[i][1] + (k[i + 1][1] - k[i][1]) * ((u - k[i][0]) / Math.max(1e-9, k[i + 1][0] - k[i][0])); return k[k.length - 1][1]; }
    const gs = this.gs, m = gs.length - 1; const f = u * m; const i = Math.min(m - 1, Math.floor(f)); return gs[i] + (gs[i + 1] - gs[i]) * (f - i); }
  sAtG(g) { const k = this.def.gk;
    if (k) { if (g <= k[0][1]) return k[0][0] * this.len; for (let i = 0; i < k.length - 1; i++) if (g <= k[i + 1][1]) return (k[i][0] + (k[i + 1][0] - k[i][0]) * ((g - k[i][1]) / Math.max(1e-9, k[i + 1][1] - k[i][1]))) * this.len; return k[k.length - 1][0] * this.len; }
    const gs = this.gs, m = gs.length - 1; if (g <= gs[0]) return 0; if (g >= gs[m]) return this.len; for (let i = 0; i < m; i++) if (g <= gs[i + 1]) return ((i + (g - gs[i]) / Math.max(1e-9, gs[i + 1] - gs[i])) / m) * this.len; return this.len; }
  g0() { return this.gAt(0); } g1() { return this.gAt(this.len); }
}

const COMMON = `
uniform float uHead, uSoft, uHeadLen, uHeadGain, uInk, uGain, uFlow, uFlowSpeed, uTime; uniform vec4 uPulse[4];
float reveal(float g){ return smoothstep(uHead, uHead - uSoft, g); }
float boost(float g, float s){
  float b = exp(-max(uHead - g, 0.)/uHeadLen) * uHeadGain;
  for (int i=0;i<4;i++) { float q = (g - uPulse[i].x)/max(uPulse[i].y, 1e-4); b += uPulse[i].z * exp(-q*q); }
  b += uFlow * pow(0.5 + 0.5*sin(s*0.9 - uTime*uFlowSpeed), 3.0) * 2.0;
  return 1. + b;
}
vec3 inkOf(vec3 c){ float l = dot(c, vec3(0.2126,0.7152,0.0722)); return mix(vec3(l), c, 1.25) * 0.78; }
`;
const VS_LINE = `#version 300 es
layout(location=0) in vec2 aPos; layout(location=1) in vec2 aDir; layout(location=2) in float aSide; layout(location=3) in float aS; layout(location=4) in float aG; layout(location=5) in vec3 aCol; layout(location=6) in float aW;
uniform mat4 uVP; uniform vec2 uRes; uniform float uProjK, uMinPx, uHaloPx, uWidthScale, uCamY, uFogDist, uCalm;
out float vV, vCore, vG, vS, vE; out vec3 vCol;
void main(){
  vec4 c = uVP*vec4(aPos.x, 0., aPos.y, 1.); vec4 cd = uVP*vec4(aDir.x, 0., aDir.y, 0.);
  vec2 sd = (cd.xy*c.w - c.xy*cd.w) * uRes; float l = length(sd); sd = l > 1e-12 ? sd/l : vec2(1., 0.);
  vec2 n = vec2(-sd.y, sd.x);
  float pxPerM = uProjK / max(abs(c.w), 1e-3);
  float tru = aW*uWidthScale*pxPerM;
  float graze = smoothstep(0.0, 0.10, uCamY/max(abs(c.w), 1e-3));          // 0 at the horizon, 1 seen from above
  // A road lying ACROSS the view at a grazing angle covers far less of the screen than its width in metres says (it is foreshortened by camY/dist): a
  // thousand such lines used to stack into a white-hot band on the horizon. uCalm = 1 (default; opts.calm; night only: ink roads keep their weight) draws the true footprint; 0 = the old look.
  vec4 cn = uVP*vec4(-aDir.y, 0., aDir.x, 0.); float perp = aW*uWidthScale*abs(dot((cn.xy*c.w - c.xy*cn.w)*uRes*0.5/max(c.w*c.w, 1e-6), n));
  float wpx = mix(tru, min(tru, perp), uCalm);                             // the width it really has on screen (a line on the ground, not a tube)
  float core = max(wpx, uMinPx*0.5); float cov = min(1., wpx/(uMinPx*0.5));
  vE = pow(cov, mix(mix(1.25, 0.6, graze), 0.6, uCalm)) * mix(exp(-abs(c.w)/uFogDist), 1., graze);   // and night air: far roads seen edge-on fade out
  float half_ = core + uHaloPx + 1.5;
  c.xy += n * aSide * half_ * 2. / uRes * c.w;
  vV = aSide*half_; vCore = core; vG = aG; vS = aS; vCol = aCol; gl_Position = c;
}`;
const FS_LINE = FS_HEAD + COMMON + `
in float vV, vCore, vG, vS, vE; in vec3 vCol; uniform float uHalo, uHaloPx; out vec4 o;
void main(){
  float vis = reveal(vG); if (vis <= 0.) discard;
  float d = abs(vV);
  float core = smoothstep(vCore + 0.75, vCore - 0.75, d);
  float hq = d/(vCore + uHaloPx*0.45); float halo = exp(-hq*hq) * uHalo;
  float an = (core + halo*(1.-core)) * vE, ad = core;
  vec3 em = vCol * uGain * boost(vG, vS);
  o = vec4((em*an*(1.-uInk) + inkOf(vCol)*ad*uInk)*vis, ad*uInk*vis);
}`;
const VS_GLYPH = `#version 300 es
layout(location=0) in vec2 iPos; layout(location=1) in vec2 iAdv; layout(location=2) in float iSide; layout(location=3) in float iChar; layout(location=4) in float iG; layout(location=5) in vec3 iCol; layout(location=6) in float iSize; layout(location=7) in float iS;
uniform mat4 uVP; uniform float uProjK; uniform vec2 uCell; uniform vec4 uAtlas; // cell size in em (w,h); atlas: cols, rows, cellUVw, cellUVh
out vec2 vUv; out float vG, vPx, vS; out vec3 vCol;
void main(){
  vec2 c = vec2(float(gl_VertexID&1), float((gl_VertexID>>1)&1));
  vec2 up = vec2(-iAdv.y, iAdv.x)*iSide;
  vec2 w = iPos + iAdv*(c.x-0.5)*uCell.x*iSize + up*(c.y-0.5)*uCell.y*iSize;
  vec4 p = uVP*vec4(w.x, 0., w.y, 1.);
  float col = mod(iChar, uAtlas.x), row = floor(iChar/uAtlas.x);
  vUv = vec2((col + c.x)*uAtlas.z, 1. - (row + 1. - c.y)*uAtlas.w);
  vPx = iSize*uProjK/max(p.w, 1e-3); vG = iG; vCol = iCol; vS = iS; gl_Position = p;
}`;
const FS_GLYPH = FS_HEAD + COMMON + `
in vec2 vUv; in float vG, vPx, vS; in vec3 vCol; uniform sampler2D uT; uniform float uTextGain; out vec4 o;
void main(){
  float vis = reveal(vG) * smoothstep(3.0, 7.0, vPx); if (vis <= 0.) discard;
  float a = texture(uT, vUv).a * vis;
  vec3 em = mix(vCol, vec3(1.), 0.35) * uGain * uTextGain * boost(vG, vS);
  o = vec4(em*a*(1.-uInk) + inkOf(vCol)*a*uInk, a*uInk);
}`;
const VS_NODE = `#version 300 es
layout(location=0) in vec2 iPos; layout(location=1) in float iG; layout(location=2) in vec3 iCol; layout(location=3) in float iR;
uniform mat4 uVP; uniform vec2 uRes; uniform float uProjK, uNodeMinPx, uNodeCamY, uNodeAir;
out vec2 vC; out float vG, vR, vAir; out vec3 vCol;
void main(){ vec2 c = vec2(float(gl_VertexID&1), float((gl_VertexID>>1)&1))*2.-1.; vC = c;
  vec4 p = uVP*vec4(iPos.x, 0., iPos.y, 1.); float r = max(iR*uProjK/max(p.w, 1e-3), uNodeMinPx); vR = r;
  // opts.nodeAir (metres; 0 = off, the default): night air for commit nodes seen at a grazing angle, as fogDist does for the lines (thousands of far nodes stack into a hot line on the horizon)
  vAir = uNodeAir > 0. ? mix(exp(-abs(p.w)/uNodeAir), 1., smoothstep(0.0, 0.10, uNodeCamY/max(abs(p.w), 1e-3))) : 1.;
  p.xy += c*(r + 1.5)*2./uRes*p.w; vG = iG; vCol = iCol; gl_Position = p; }`;
const FS_NODE = FS_HEAD + COMMON + `
in vec2 vC; in float vG, vR, vAir; in vec3 vCol; out vec4 o;
void main(){
  float vis = step(vG, uHead); if (vis <= 0.) discard;
  float d = length(vC)*(vR + 1.5);
  float disc = smoothstep(vR + 0.75, vR - 0.75, d);
  float ring = smoothstep(4.0, 7.0, vR);                   // 0 = a far dot, 1 = near enough to be a ring
  float ri = vR - max(1.7, vR*0.15);                       // a thin ring (NOTES_v1: punctuation, not props)
  float hole = smoothstep(ri + 0.75, ri - 0.75, d) * ring;
  float pop = exp(-max(uHead - vG, 0.)/0.35) * mix(3.0, 1.6, ring);        // a commit lands: it flashes, then settles
  float a = disc - hole*0.9;
  vec3 em = mix(vCol, vec3(1.), 0.25) * uGain * (mix(1.6, 0.75, ring) + pop) * vAir;
  o = vec4(em*a*(1.-uInk) + inkOf(vCol)*a*uInk, a*uInk);
}`;

let ATLAS = null;
function glyphAtlas(gl) {
  if (ATLAS) return ATLAS;
  const px = 150, cw = Math.ceil(px * 0.6) + 12, ch = Math.ceil(px * 1.3) + 12, cols = 12, rows = 8;
  const c = document.createElement('canvas'); c.width = cols * cw; c.height = rows * ch; const g = c.getContext('2d');
  g.font = `600 ${px}px "JetBrains Mono"`; g.textBaseline = 'alphabetic'; g.textAlign = 'center'; g.fillStyle = '#fff';
  for (let i = 0; i < 95; i++) { const col = i % cols, row = Math.floor(i / cols); g.fillText(String.fromCharCode(32 + i), col * cw + cw / 2, row * ch + 6 + px * 1.0); }
  ATLAS = { tex: canvasTex(gl, c), cols, rows, cellEm: [cw / px, ch / px], uv: [1 / cols, 1 / rows] };
  return ATLAS;
}

export class Roads {
  constructor(gl, defs, opts = {}) {
    this.gl = gl; const step = opts.step || 1.0;
    this.roads = defs.map((d) => new Road(d, step));
    const col = (c) => (typeof c === 'string' ? hex(c) : c || [1, 0.2, 0.02]);
    // --- core lines
    let nv = 0, ni = 0; for (const r of this.roads) { nv += r.n * 2; ni += (r.n - 1) * 6; }
    const V = new Float32Array(nv * 11), I = new Uint32Array(ni); let vo = 0, io = 0, vb = 0;
    for (const r of this.roads) { const c = col(r.def.color), w = r.def.width ?? 0.07;
      for (let i = 0; i < r.n; i++) { const s = i * r.ds; const a = r.at(Math.min(s, r.len - 1e-4)); const g = r.gAt(s);
        for (const side of [-1, 1]) { V.set([r.P[i * 2], r.P[i * 2 + 1], a.tx, a.tz, side, s, g, c[0], c[1], c[2], w], vo); vo += 11; }
        if (i < r.n - 1) { const b = vb + i * 2; I.set([b, b + 1, b + 2, b + 1, b + 3, b + 2], io); io += 6; } }
      vb += r.n * 2; }
    this.lineVao = gl.createVertexArray(); gl.bindVertexArray(this.lineVao);
    let b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, V, gl.STATIC_DRAW);
    [[0, 2, 0], [1, 2, 8], [2, 1, 16], [3, 1, 20], [4, 1, 24], [5, 3, 28], [6, 1, 40]].forEach(([l, n, o]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, n, gl.FLOAT, false, 44, o); });
    b = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, I, gl.STATIC_DRAW); this.ni = ni;
    // --- text along the road
    const atlas = glyphAtlas(gl); this.atlas = atlas; const maxG = opts.maxGlyphs || 1500000; const G = []; let ng = 0;
    for (const r of this.roads) { const d = r.def; if (!d.text || ng >= maxG) continue; const em = d.textSize ?? 0.42, adv = em * 0.62, side = d.textSide ?? 1, flip = d.flip ? -1 : 1; const c = col(d.color);
      const txt = String(d.text).toUpperCase(); const gap = d.textGap ?? 8; const off = d.textOff ?? (d.width ?? 0.07) + em * 0.72;   /* textOff < 0: the text lies on the reader's side of the line */ let s = d.textStart ?? em * 2; let k = 0; const total = txt.length + gap;
      const rep = d.repeat !== false;
      while (s < r.len - em && ng < maxG) { const ci = k % total; if (!rep && k >= txt.length) break;
        if (ci < txt.length) { const code = txt.charCodeAt(flip > 0 ? ci : txt.length - 1 - ci); if (code > 32 && code < 127) { const a = r.at(s); const px = -a.tz * side, pz = a.tx * side;
          G.push(a.x + px * off, a.z + pz * off, a.tx * flip, a.tz * flip, side * flip, code - 32, r.gAt(s), c[0], c[1], c[2], em, s); ng++; } }
        s += adv; k++; } }
    this.ng = ng; this.glyphVao = gl.createVertexArray(); gl.bindVertexArray(this.glyphVao); b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(G), gl.STATIC_DRAW);
    [[0, 2, 0], [1, 2, 8], [2, 1, 16], [3, 1, 20], [4, 1, 24], [5, 3, 28], [6, 1, 40], [7, 1, 44]].forEach(([l, n, o]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, n, gl.FLOAT, false, 48, o); gl.vertexAttribDivisor(l, 1); });
    // --- commit nodes
    const N = []; let nn = 0;
    for (const r of this.roads) for (const nd of r.def.nodes || []) { const s = nd.s !== undefined ? nd.s : (nd.u ?? 0) * r.len; const a = r.at(s); const c = col(nd.color || r.def.color); N.push(a.x, a.z, nd.g ?? r.gAt(s), c[0], c[1], c[2], nd.r ?? 0.35); nn++; }
    this.nn = nn; this.nodeVao = gl.createVertexArray(); gl.bindVertexArray(this.nodeVao); b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(N), gl.STATIC_DRAW);
    [[0, 2, 0], [1, 1, 8], [2, 3, 12], [3, 1, 24]].forEach(([l, n, o]) => { gl.enableVertexAttribArray(l); gl.vertexAttribPointer(l, n, gl.FLOAT, false, 28, o); gl.vertexAttribDivisor(l, 1); });
    gl.bindVertexArray(null);
    this.pLine = new Program(gl, VS_LINE, FS_LINE, 'road.line'); this.pGlyph = new Program(gl, VS_GLYPH, FS_GLYPH, 'road.glyph'); this.pNode = new Program(gl, VS_NODE, FS_NODE, 'road.node');
  }
  drawable(o = {}) {
    const self = this, gl = this.gl;
    return { passes: ['ground'], reflect: false, draw(ctx) {
      const ink = o.ink ?? Math.min(1, Math.max(0, (ctx.dawn - 0.72) / 0.2)); const projK = ctx.H / (2 * Math.tan(ctx.fovY / 2));
      const pulses = new Float32Array(16); (o.pulses || []).slice(0, 4).forEach((p, i) => pulses.set([p.g, p.width ?? 0.3, p.gain ?? 2, 0], i * 4));
      const common = { uVP: ctx.viewProj, uRes: [ctx.W, ctx.H], uProjK: projK, uHead: o.head ?? 1e9, uSoft: o.soft ?? 0.05, uHeadLen: o.headLen ?? 0.35, uHeadGain: o.headGain ?? 0, uInk: ink,
        uGain: o.gain ?? 2.2, uFlow: o.flow ?? 0, uFlowSpeed: o.flowSpeed ?? 5, uTime: ctx.t, uPulse: pulses };
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.bindVertexArray(self.lineVao); self.pLine.use().set({ ...common, uFogDist: o.fogDist ?? 260, uCalm: (o.calm ?? 1) * (1 - ink), uCamY: Math.abs(ctx.camPos[1]), uWidthScale: o.widthScale ?? 1, uMinPx: o.minPx ?? 1.3, uHaloPx: o.haloPx ?? 5, uHalo: o.halo ?? 0.22 }); gl.drawElements(gl.TRIANGLES, self.ni, gl.UNSIGNED_INT, 0);
      if (self.ng && (o.textGain ?? 1) > 0) { gl.bindVertexArray(self.glyphVao); self.pGlyph.use().set({ ...common, uT: self.atlas.tex, uCell: self.atlas.cellEm, uAtlas: [self.atlas.cols, self.atlas.rows, self.atlas.uv[0], self.atlas.uv[1]], uTextGain: o.textGain ?? 0.8 }); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, self.ng); }
      if (self.nn) { gl.bindVertexArray(self.nodeVao); self.pNode.use().set({ ...common, uNodeMinPx: o.nodeMinPx ?? 1.8, uNodeCamY: Math.abs(ctx.camPos[1]), uNodeAir: o.nodeAir ?? 0 }); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, self.nn); }
      gl.bindVertexArray(null);
    } };
  }
}
