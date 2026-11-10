// Tiny WebGL2 helpers. No state caching: every pass sets what it needs.
export const VS_TRI = `#version 300 es
out vec2 vUv;
void main(){ vec2 p = vec2(float((gl_VertexID<<1)&2), float(gl_VertexID&2)); vUv = p; gl_Position = vec4(p*2.0-1.0, 0.0, 1.0); }`;

export const FS_HEAD = `#version 300 es
precision highp float; precision highp int; precision highp sampler2D;
`;

function sh(gl, type, src, name) {
  const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(s);
    const lines = src.split('\n').map((l, i) => `${String(i + 1).padStart(4)} ${l}`).join('\n');
    console.error(`[shader ${name}] ${log}\n${lines}`);
    throw new Error(`shader ${name}: ${log}`);
  }
  return s;
}

export class Program {
  constructor(gl, vs, fs, name = 'prog') {
    this.gl = gl; this.name = name;
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl, gl.VERTEX_SHADER, vs, name + '.vs'));
    gl.attachShader(p, sh(gl, gl.FRAGMENT_SHADER, fs, name + '.fs'));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(`link ${name}: ${gl.getProgramInfoLog(p)}`);
    this.p = p; this.u = {}; this.samplers = 0;
    const n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (let i = 0; i < n; i++) {
      const info = gl.getActiveUniform(p, i); const nm = info.name.replace(/\[0\]$/, '');
      this.u[nm] = { loc: gl.getUniformLocation(p, info.name), type: info.type, size: info.size };
    }
  }
  use() { this.gl.useProgram(this.p); this.unit = 0; return this; }
  attr(name) { return this.gl.getAttribLocation(this.p, name); }
  // set({uName: value}) — numbers, arrays, Float32Array, or a WebGLTexture for samplers
  set(vals) {
    const gl = this.gl;
    for (const k in vals) {
      const u = this.u[k]; if (!u) continue; const v = vals[k];
      switch (u.type) {
        case gl.FLOAT: if (u.size > 1) gl.uniform1fv(u.loc, v); else gl.uniform1f(u.loc, v); break;
        case gl.FLOAT_VEC2: gl.uniform2fv(u.loc, v); break;
        case gl.FLOAT_VEC3: gl.uniform3fv(u.loc, v); break;
        case gl.FLOAT_VEC4: gl.uniform4fv(u.loc, v); break;
        case gl.INT: case gl.BOOL: gl.uniform1i(u.loc, v); break;
        case gl.FLOAT_MAT4: gl.uniformMatrix4fv(u.loc, false, v); break;
        case gl.FLOAT_MAT3: gl.uniformMatrix3fv(u.loc, false, v); break;
        case gl.SAMPLER_2D: gl.activeTexture(gl.TEXTURE0 + this.unit); gl.bindTexture(gl.TEXTURE_2D, v); gl.uniform1i(u.loc, this.unit++); break;
        default: throw new Error(`uniform type ${u.type} for ${k}`);
      }
    }
    return this;
  }
}

export function tex(gl, { w, h, internal = gl.RGBA8, format = gl.RGBA, type = gl.UNSIGNED_BYTE, filter = gl.LINEAR, wrap = gl.CLAMP_TO_EDGE, data = null, mip = false }) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.texImage2D(gl.TEXTURE_2D, 0, internal, w, h, 0, format, type, data);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  if (mip) gl.generateMipmap(gl.TEXTURE_2D);
  t.w = w; t.h = h; return t;
}

// texture from a 2D canvas (premultiplied alpha, flipped so v=0 is the canvas bottom), mipmapped + anisotropic
export function canvasTex(gl, canvas, { mip = true } = {}) {
  const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, canvas);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false); gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  if (mip) {
    gl.generateMipmap(gl.TEXTURE_2D);
    const an = gl.getExtension('EXT_texture_filter_anisotropic');
    if (an) gl.texParameterf(gl.TEXTURE_2D, an.TEXTURE_MAX_ANISOTROPY_EXT, Math.min(16, gl.getParameter(an.MAX_TEXTURE_MAX_ANISOTROPY_EXT)));
  }
  t.w = canvas.width; t.h = canvas.height; return t;
}

export function fbo(gl, colors, depth = null) {
  const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f);
  colors.forEach((c, i) => gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0 + i, gl.TEXTURE_2D, c, 0));
  if (depth) gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.TEXTURE_2D, depth, 0);
  gl.drawBuffers(colors.map((_, i) => gl.COLOR_ATTACHMENT0 + i));
  const st = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (st !== gl.FRAMEBUFFER_COMPLETE) throw new Error('fbo incomplete 0x' + st.toString(16));
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  return f;
}

export function drawTri(gl) { gl.drawArrays(gl.TRIANGLES, 0, 3); }

// sRGB hex -> linear rgb [0..1]
export function hex(h) {
  const n = parseInt(h.replace('#', ''), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((c) => Math.pow(c / 255, 2.2));
}
