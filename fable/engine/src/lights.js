// Bokeh lights: every other branch, far away, is a light on its road. True circle-of-confusion discs, energy conserving.
//   const L = engine.lights(4096);  per frame: L.drawable(data, count, {minPx, gain})  with data = Float32Array [x,y,z, r,g,b (linear HDR), radius m] * count
import { Program, FS_HEAD } from './glx.js';
const VS = `#version 300 es
layout(location=0) in vec3 iPos; layout(location=1) in vec3 iCol; layout(location=2) in float iRad;
uniform mat4 uVP; uniform vec2 uRes; uniform float uProjK, uAperture, uFocus, uMinPx, uGain;
out vec2 vC; out vec3 vCol; out float vR, vCoc;
void main(){
  vec2 c = vec2(float(gl_VertexID&1), float((gl_VertexID>>1)&1))*2.-1.; vC = c;
  vec4 p = uVP * vec4(iPos, 1.);
  float dist = max(p.w, 1e-3);
  float r0 = iRad * uProjK / dist;                                   // true projected radius, px
  float coc = uAperture * abs(1./uFocus - 1./dist) * uRes.y;         // SPEC: coc_px = aperture*|1/focus - 1/dist|*H
  float r = max(sqrt(r0*r0 + coc*coc), uMinPx);
  float e = (r0*r0)/(r*r);                                           // energy conservation
  e = max(e, min(1., r0/uMinPx)*0.6*step(coc, uMinPx));              // tiny sharp lights keep a floor so the far plain still glitters
  vCol = iCol * uGain * e; vR = r; vCoc = coc;
  p.xy += c * (r + 1.5) * 2. / uRes * p.w;
  gl_Position = p;
}`;
const FS = FS_HEAD + `
in vec2 vC; in vec3 vCol; in float vR, vCoc; out vec4 o;
void main(){
  float d = length(vC) * (vR + 1.5);
  float a = smoothstep(vR + 0.75, vR - 0.75, d);
  float k = clamp(vCoc/6., 0., 1.);                                  // defocused discs get a soft bright rim; sharp ones a hot centre
  float rim = 1. + 0.45*k*smoothstep(0.55, 0.98, d/vR) - 0.12*k;
  float core = mix(exp(-d*d/(vR*vR*0.5))*1.6 + 0.4, 1., k);
  o = vec4(vCol * a * rim * core, 0.);
}`;
export class Lights {
  constructor(gl, max = 4096) {
    this.gl = gl; this.max = max; this.prog = new Program(gl, VS, FS, 'lights');
    this.vao = gl.createVertexArray(); this.buf = gl.createBuffer();
    gl.bindVertexArray(this.vao); gl.bindBuffer(gl.ARRAY_BUFFER, this.buf); gl.bufferData(gl.ARRAY_BUFFER, max * 28, gl.DYNAMIC_DRAW);
    for (const [loc, n, off] of [[0, 3, 0], [1, 3, 12], [2, 1, 24]]) { gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, n, gl.FLOAT, false, 28, off); gl.vertexAttribDivisor(loc, 1); }
    gl.bindVertexArray(null);
  }
  drawable(data, count, o = {}) {
    const self = this, gl = this.gl; let uploaded = false;
    return { passes: ['add'], reflect: o.reflect !== false, draw(ctx) {
      if (!count) return;
      gl.bindVertexArray(self.vao);
      if (!uploaded) { gl.bindBuffer(gl.ARRAY_BUFFER, self.buf); gl.bufferSubData(gl.ARRAY_BUFFER, 0, data, 0, count * 7); uploaded = true; }
      self.prog.use().set({ uVP: ctx.viewProj, uRes: [ctx.W, ctx.H], uProjK: ctx.H / (2 * Math.tan(ctx.fovY / 2)), uAperture: ctx.aperture, uFocus: ctx.focusDist, uMinPx: o.minPx ?? 0.9, uGain: (o.gain ?? 1) * (ctx.reflect ? (o.reflGain ?? 1) : 1) });
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, count); gl.bindVertexArray(null);
    } };
  }
}
