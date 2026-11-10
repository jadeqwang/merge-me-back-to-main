// World-space lyric type. Words are rasterised once on a 2D canvas (crisp, real fonts), then stood up / laid down / hung in the world as quads.
// They are drawables, so they get the mirror reflection for free. Night: cream light. Day: ink.
//
// line descriptor (return an array of these in frame().type, or call engine.type.line(desc, t) for a drawable):
//   { words: [{w, start, end}, ...]  (from engine.time.words(id))   or  text: 'MERGE' (always on, or with t0)
//     font: 'hook' (Archivo Expanded ExtraBold caps) | 'serif' (Instrument Serif Italic) | 'mono' (JetBrains Mono)
//     size: cap height in metres,  pos: [x,y,z] anchor on the LAST row's baseline (anchor:'first' for the first row),  right: [x,y,z] reading direction (unit),  up: [x,y,z] (unit; default +Y)
//     align: 'left'|'center'|'right',  rows: [n1, n2, ...] words per row (default one row),  leading: 1.25 (x cap height... in em units of the font: 1.0 em default)
//     color: '#FFF1D6', gain: 1.35 (HDR), ink: 0..1 (default from dawn), inkColor: '#14122B'
//     out: time the line leaves (default: last word end, at least 0.6 s after it starts, + hold 0.5), fade: 0.45
//     mode: 'ground' => not drawn in the mirror,  wipe: true (written left to right by a bright edge),  alpha: 1, tracking: em }
import { Program, FS_HEAD, canvasTex, hex } from './glx.js';

const FONTS = [
  ['Archivo', '/engine/fonts/Archivo[wdth,wght].ttf', { weight: '100 900', stretch: '62% 125%' }],
  ['Instrument Serif', '/engine/fonts/InstrumentSerif-Italic.ttf', { style: 'italic' }],
  ['Instrument Serif', '/engine/fonts/InstrumentSerif-Regular.ttf', {}],
  ['JetBrains Mono', '/engine/fonts/JetBrainsMono[wght].ttf', { weight: '100 800' }],
];
export async function loadFonts() {
  await Promise.all(FONTS.map(async ([name, url, desc]) => { const f = new FontFace(name, `url("${encodeURI(url)}")`, desc); await f.load(); document.fonts.add(f); }));
  await document.fonts.ready;
}
export const FACES = {
  hook: { css: (px) => `800 ${px}px Archivo`, stretch: 'expanded', upper: true, px: 200, tracking: 0.01 },
  hookc: { css: (px) => `800 ${px}px Archivo`, stretch: 'normal', upper: true, px: 200, tracking: 0.01 },
  serif: { css: (px) => `italic 400 ${px}px "Instrument Serif"`, stretch: 'normal', upper: false, px: 230, tracking: 0 },
  mono: { css: (px) => `500 ${px}px "JetBrains Mono"`, stretch: 'normal', upper: false, px: 160, tracking: 0 },
};
export function setFont(g, face, px) { const f = FACES[face]; g.font = f.css(px); try { g.fontStretch = f.stretch; } catch (e) {} g.textBaseline = 'alphabetic'; g.textAlign = 'left'; }

const VS = `#version 300 es
uniform mat4 uVP; uniform vec3 uP0, uR, uU; uniform vec4 uUV;
out vec2 vUv; out float vX;
void main(){ vec2 c = vec2(float(gl_VertexID&1), float((gl_VertexID>>1)&1)); vX = c.x;
  vUv = vec2(mix(uUV.x, uUV.z, c.x), mix(uUV.y, uUV.w, c.y));
  gl_Position = uVP * vec4(uP0 + uR*c.x + uU*c.y, 1.); }`;
const FS = FS_HEAD + `
in vec2 vUv; in float vX; uniform sampler2D uT; uniform vec3 uCol, uInkCol; uniform float uAlpha, uWipe, uInk, uEdge;
layout(location=0) out vec4 o0; layout(location=1) out vec4 o1;
void main(){
  float a = texture(uT, vUv).a;
  float m = smoothstep(uWipe, uWipe - 0.22, vX);
  float ee = (uWipe - 0.08 - vX)/0.10; float edge = exp(-ee*ee) * uEdge * step(uWipe, 1.3);
  a *= m * uAlpha; if (a < 0.002) discard;
  vec3 light = uCol * (1. + edge*2.5);
  o0 = vec4(mix(light, uInkCol, uInk)*a, a*uInk);
  o1 = vec4(0., 0., 0., a*uInk);
}`;

export class TypeLayer {
  constructor(gl) { this.gl = gl; this.prog = new Program(gl, VS, FS, 'type'); this.cache = new Map(); this.cream = hex('#FFF1D6'); this.inkc = hex('#14122B'); }

  layout(d) {
    const face = FACES[d.font || 'serif']; const key = JSON.stringify([d.font || 'serif', d.words ? d.words.map((w) => w.w) : d.text, d.rows || 0, d.tracking || 0, d.upper]);
    let L = this.cache.get(key); if (L) return L;
    const upper = d.upper ?? face.upper; const px = face.px;
    const raw = d.words ? d.words.map((w) => w.w) : String(d.text).split(' ');
    const texts = raw.map((s) => (upper ? s.toUpperCase() : s).replace(/[,.;:!?\u2026]/g, ''));   // rule 3: no punctuation (apostrophes stay)
    const c = document.createElement('canvas'); let g = c.getContext('2d'); setFont(g, d.font || 'serif', px);
    const track = (d.tracking ?? face.tracking) * px;
    try { g.letterSpacing = track + 'px'; } catch (e) {}
    const cap = g.measureText('H').actualBoundingBoxAscent, space = g.measureText(' ').width + track;
    const pad = Math.ceil(px * 0.16), asc = Math.ceil(px * 1.02), desc = Math.ceil(px * 0.34), ch = asc + desc + pad * 2;
    const ms = texts.map((s) => { const m = g.measureText(s); return { adv: m.width, l: Math.max(0, m.actualBoundingBoxLeft), r: Math.max(m.width, m.actualBoundingBoxRight) }; });
    // pack the word cells into atlas rows
    const MAXW = 4096; let x = 0, y = 0; const cells = ms.map((m) => { const w = Math.ceil(m.l + m.r) + pad * 2; if (x + w > MAXW) { x = 0; y += ch; } const cell = { x, y, w, h: ch }; x += w; return cell; });
    c.width = Math.min(MAXW, Math.max(...cells.map((q) => q.x + q.w))); c.height = y + ch;
    g = c.getContext('2d'); setFont(g, d.font || 'serif', px); try { g.letterSpacing = track + 'px'; } catch (e) {}
    g.fillStyle = '#fff';
    texts.forEach((s, i) => g.fillText(s, cells[i].x + pad + ms[i].l, cells[i].y + pad + asc));
    const texture = canvasTex(this.gl, c);
    // word positions in px relative to each row's baseline start
    const rows = d.rows || [texts.length]; const words = []; let wi = 0; const rowW = [];
    rows.forEach((n, r) => { let cx = 0; for (let k = 0; k < n && wi < texts.length; k++, wi++) { words.push({ row: r, x: cx, m: ms[wi], cell: cells[wi] }); cx += ms[wi].adv + space; } rowW.push(cx - space); });
    L = { texture, words, rowW, cap, px, pad, asc, desc, cw: c.width, chh: c.height, em: px };
    this.cache.set(key, L); return L;
  }

  // -> drawable
  line(d, t) {
    const self = this, gl = this.gl; const L = this.layout(d);
    return { passes: ['add'], reflect: d.mode === 'ground' ? false : d.reflect !== false, draw(ctx) {
      const W = d.words; let tOut = d.out, alphaLine = d.alpha ?? 1;
      if (W) { const last = W[W.length - 1]; if (tOut === undefined) tOut = Math.max(last.end, last.start + 0.6) + (d.hold ?? 0.5); }
      else if (d.t1 !== undefined) tOut = d.t1;
      const fade = d.fade ?? 0.45;
      if (tOut !== undefined) alphaLine *= 1 - Math.min(1, Math.max(0, (t - tOut) / fade));
      if (alphaLine <= 0) return;
      const s = d.size / L.cap; const right = d.right || [1, 0, 0], up = d.up || [0, 1, 0]; const lead = (d.leading ?? 1.18) * L.px * s;
      const nrows = L.rowW.length; const rowBase = d.anchor === 'first' ? 0 : nrows - 1;   // pos = baseline of the LAST row by default (type stands on the ground)
      const ink = d.ink ?? Math.min(1, Math.max(0, (ctx.dawn - 0.72) / 0.2));
      const col = (d.color ? hex(d.color) : self.cream).map((c) => c * (d.gain ?? 1.35) * (ctx.reflect ? (d.reflGain ?? 0.5) : 1)); const inkc = d.inkColor ? hex(d.inkColor) : self.inkc;
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      if (ctx.reflect) gl.drawBuffers([gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1]);
      const P = self.prog.use(); P.set({ uVP: ctx.viewProj, uT: L.texture, uCol: col, uInkCol: inkc, uInk: ink, uEdge: (d.wipe === false ? 0 : 1) * (1 - ink) });
      L.words.forEach((w, i) => {
        let wipe = 2, a = alphaLine;
        if (W) { const t0 = W[i].start - 0.04; if (t < t0) return; const dur = Math.min(0.3, Math.max(0.14, (W[i].end - W[i].start) * 0.6)); wipe = d.wipe === false ? 2 : ((t - t0) / dur) * 1.3; if (d.wipe === false) a *= Math.min(1, (t - t0) / 0.12); }
        else if (d.t0 !== undefined) { if (t < d.t0) return; wipe = d.wipe === false ? 2 : ((t - d.t0 - i * (d.stagger ?? 0.06)) / (d.wipeDur ?? 0.35)) * 1.3; if (wipe <= 0) return; }
        const ax = d.align === 'center' ? -L.rowW[w.row] / 2 : d.align === 'right' ? -L.rowW[w.row] : 0;
        const x0 = (ax + w.x - w.m.l - L.pad) * s, wd = w.cell.w * s, y0 = -(L.desc + L.pad) * s + (rowBase - w.row) * lead, hh = w.cell.h * s;
        const p0 = [0, 1, 2].map((k) => d.pos[k] + right[k] * x0 + up[k] * y0);
        P.set({ uP0: p0, uR: right.map((v) => v * wd), uU: up.map((v) => v * hh), uAlpha: a, uWipe: wipe,
          uUV: [w.cell.x / L.cw, 1 - (w.cell.y + w.cell.h) / L.chh, (w.cell.x + w.cell.w) / L.cw, 1 - w.cell.y / L.chh] });
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      });
    } };
  }
  // reading direction for upright text at `pos` that faces a viewer at `cam` (horizontal only)
  static facing(pos, cam) { const dx = cam[0] - pos[0], dz = cam[2] - pos[2], l = Math.hypot(dx, dz) || 1; return [dz / l, 0, -dx / l]; }
  // total width in metres of row r for a descriptor (for placing things next to type)
  width(d, r = 0) { const L = this.layout(d); return (L.rowW[r] * d.size) / L.cap; }
}
