// Placeholder figure for scale: a 1.65 m capsule of light points (night) that can also draw as an opaque silhouette. Not the figure (that is src/figure/).
import { Program, FS_HEAD } from './glx.js';
import { mulberry32 } from './rng.js';
export class Capsule {
  constructor(gl, { height = 1.65, radius = 0.2, n = 5000, seed = 7 } = {}) {
    this.gl = gl; const r = mulberry32(seed); const P = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { const y = r() * height; const a = r() * 6.2832; let rr = radius; if (y < radius) rr = Math.sqrt(Math.max(0, radius * radius - (radius - y) ** 2)); if (y > height - radius) rr = Math.sqrt(Math.max(0, radius * radius - (y - (height - radius)) ** 2));
      P[i * 4] = Math.cos(a) * rr; P[i * 4 + 1] = y; P[i * 4 + 2] = Math.sin(a) * rr; P[i * 4 + 3] = r(); }
    this.n = n; this.vao = gl.createVertexArray(); gl.bindVertexArray(this.vao); const b = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, b); gl.bufferData(gl.ARRAY_BUFFER, P, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 4, gl.FLOAT, false, 16, 0); gl.vertexAttribDivisor(0, 1); gl.bindVertexArray(null);
    this.prog = new Program(gl, `#version 300 es
layout(location=0) in vec4 iP; uniform mat4 uVP; uniform vec3 uPos; uniform vec2 uRes; uniform float uProjK, uAperture, uFocus, uSize, uSolid;
out vec2 vC; out float vE, vR, vSeed;
void main(){ vec2 c = vec2(float(gl_VertexID&1), float((gl_VertexID>>1)&1))*2.-1.; vC = c; vSeed = iP.w;
  vec4 p = uVP*vec4(iP.xyz + uPos, 1.); float dist = max(p.w, 1e-3);
  float r0 = uSize*uProjK/dist; float coc = uSolid > 0.5 ? 0. : uAperture*abs(1./uFocus - 1./dist)*uRes.y; float r = max(sqrt(r0*r0+coc*coc), 0.7);
  vE = (r0*r0)/(r*r); vR = r; p.xy += c*(r+1.)*2./uRes*p.w; gl_Position = p; }`, FS_HEAD + `
in vec2 vC; in float vE, vR, vSeed; uniform vec3 uCol; uniform float uSolid; layout(location=0) out vec4 o0; layout(location=1) out vec4 o1;
void main(){ float d = length(vC)*(vR+1.); float a = smoothstep(vR+0.7, vR-0.7, d);
  if (uSolid > 0.5) { if (a < 0.5) discard; o0 = vec4(uCol, 1.); o1 = vec4(0.2, 0.2, 0.3, 1.); }
  else { o0 = vec4(uCol*a*vE*(0.4+vSeed), 0.); o1 = vec4(0.); } }`, 'capsule');
  }
  // o: {pos:[x,y,z], color:[r,g,b] linear HDR, solid: 0|1 (silhouette), size: point radius m}
  drawable(o = {}) {
    const self = this, gl = this.gl;
    return { passes: [o.solid ? 'opaque' : 'add'], draw(ctx) {
      gl.bindVertexArray(self.vao);
      self.prog.use().set({ uVP: ctx.viewProj, uPos: o.pos || [0, 0, 0], uRes: [ctx.W, ctx.H], uProjK: ctx.H / (2 * Math.tan(ctx.fovY / 2)), uAperture: ctx.aperture, uFocus: ctx.focusDist,
        uSize: o.size ?? (o.solid ? 0.03 : 0.006), uSolid: o.solid ? 1 : 0, uCol: o.color || [1.2, 0.6, 0.2] });
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, self.n); gl.bindVertexArray(null);
    } };
  }
}
