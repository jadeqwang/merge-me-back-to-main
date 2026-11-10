// MERGE engine. Raw WebGL2, HDR, deterministic: ENGINE.render(t) is a pure function of song time.
//   page: fable/engine/index.html?show=/fable/show/<name>.js&w=1920&h=1080&fps=30&mb=1&<show params>
// A show module exports  async setup(engine)  and  frame(t) -> { camera, env, drawables, type, hud }  (see README at the bottom).
import { Program, VS_TRI, FS_HEAD, drawTri, tex, fbo, hex, canvasTex } from './glx.js';
import * as rng from './rng.js';
import { loadTiming, clamp01, lerp, smooth, ease } from './time.js';
import { m4, v3, buildCamera, camPath } from './camera.js';
import { Sky, skyParams } from './sky.js';
import { Ground } from './ground.js';
import { Post } from './post.js';
import { Roads } from './roads.js';
import { Lights, Glows } from './lights.js';
import { TypeLayer, loadFonts } from './type.js';
import { Hud } from './hud.js';
import { growTree } from './tree.js';
import { Capsule } from './shapes.js';

const Q = new URLSearchParams(location.search);
const W = +(Q.get('w') || 1920), H = +(Q.get('h') || 1080), FPS = +(Q.get('fps') || 30);
const canvas = document.getElementById('c'); canvas.width = W; canvas.height = H; canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
window.ENGINE = { ready: false, error: null };

export const LANES = { main: '#FF7A1A', rose: '#FF3D7F', violet: '#9B6BFF', blue: '#3D8BFF', cyan: '#22D3EE', mint: '#3DDC97', gold: '#FFD23F', coral: '#FF6B5E', magenta: '#E24BD6' };

async function boot() {
  if (!gl) throw new Error('no webgl2');
  if (!gl.getExtension('EXT_color_buffer_float')) throw new Error('no EXT_color_buffer_float');
  gl.getExtension('OES_texture_float_linear'); gl.getExtension('EXT_float_blend');
  const dbg = gl.getExtension('WEBGL_debug_renderer_info');
  console.log('renderer:', dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : 'unknown');

  const time = await loadTiming();
  await loadFonts();

  // --- targets: scene (HDR colour + aux + depth), reflection (same layout), colour-only view of the scene for the outline pass
  const mk = () => {
    const color = tex(gl, { w: W, h: H, internal: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT });
    const aux = tex(gl, { w: W, h: H, internal: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE, filter: gl.NEAREST });
    const depth = tex(gl, { w: W, h: H, internal: gl.DEPTH_COMPONENT24, format: gl.DEPTH_COMPONENT, type: gl.UNSIGNED_INT, filter: gl.NEAREST });
    return { color, aux, depth, f: fbo(gl, [color, aux], depth), fc: fbo(gl, [color]) };
  };
  const scene = mk(), refl = mk();
  const sky = new Sky(gl), ground = new Ground(gl), post = new Post(gl, W, H), hud = new Hud(W, H), type = new TypeLayer(gl);

  const engine = {
    gl, W, H, FPS, Q, time, LANES, hex, rng, m4, v3, camPath, clamp01, lerp, smooth, ease, growTree,
    Program, VS_TRI, FS_HEAD, tex, fbo, canvasTex, drawTri,
    type,                                              // engine.type.line(desc) -> drawable (or return descs in frame().type)
    roads: (defs, opts) => new Roads(gl, defs, opts),  // static road geometry; .drawable({head, ...}) per frame
    lights: (max) => new Lights(gl, max),              // bokeh lights; .drawable(Float32Array, count, opts) per frame
    glows: (max) => new Glows(gl, max),                // soft pools of light on the mirror; .drawable(Float32Array [x,z,radius,r,g,b], count, {gain})
    capsule: (o) => new Capsule(gl, o),                // 1.65 m placeholder figure for scale
    hashAt: (t) => rng.hex7(Math.floor(time.barAt(t))),
    param: (k, d) => (Q.has(k) ? (isNaN(+Q.get(k)) ? Q.get(k) : +Q.get(k)) : d),
  };

  const showUrl = Q.get('show') || '/fable/show/lookdev_world.js';
  const show = await import(showUrl);
  await show.setup(engine);

  const BOTH = [gl.COLOR_ATTACHMENT0, gl.COLOR_ATTACHMENT1], C0 = [gl.COLOR_ATTACHMENT0, gl.NONE];
  function state(pass) {
    gl.disable(gl.CULL_FACE); gl.colorMask(true, true, true, true);
    if (pass === 'opaque') { gl.drawBuffers(BOTH); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(true); gl.disable(gl.BLEND); }
    else if (pass === 'add') { gl.drawBuffers(C0); gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL); gl.depthMask(false); gl.enable(gl.BLEND); gl.blendEquation(gl.FUNC_ADD); gl.blendFunc(gl.ONE, gl.ONE); }
    else if (pass === 'ground') { gl.drawBuffers(C0); gl.disable(gl.DEPTH_TEST); gl.depthMask(false); gl.enable(gl.BLEND); gl.blendEquation(gl.FUNC_ADD); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA); }
  }
  function runPass(pass, list, ctx) {
    for (const d of list) {
      const passes = d.passes || ['opaque', 'add'];
      if (!passes.includes(pass)) continue;
      if (ctx.reflect && d.reflect === false) continue;
      state(pass); gl.bindVertexArray(null);
      d.draw(ctx);
    }
    gl.bindVertexArray(null); gl.depthMask(true);
  }

  function renderScene(F, ts, jx, jy) {
    const cam = buildCamera(F.camera, W, H, jx, jy);
    const env = F.env || {}; const dawn = env.dawn ?? 0;
    const pxAngle = (2 * Math.tan(cam.fovY / 2)) / H;
    const tc = F.clock ?? ts;                                // frame().clock: the shader clock (stars, ripples, fibres), when a show wants it to differ from song time (actE: the last frame = frame 0)
    const sp = skyParams(dawn, env.sun || {}, tc, pxAngle);
    const list = (F.drawables || []).slice();
    if (F.type) for (const d of F.type) list.push(type.line(d, ts));
    const base = { gl, W, H, camPos: cam.pos, fovY: cam.fovY, focusDist: cam.focusDist, aperture: cam.aperture, dawn, t: tc, near: cam.near, far: cam.far, env, sunDir: sp.uSunDir };
    // 1. planar reflection: the same draws through the mirrored view
    const rctx = { ...base, reflect: true, view: cam.viewR, proj: cam.proj, viewProj: cam.viewProjR };
    gl.bindFramebuffer(gl.FRAMEBUFFER, refl.f); gl.viewport(0, 0, W, H); gl.drawBuffers(BOTH);
    gl.depthMask(true); gl.clearColor(0, 0, 0, 0); gl.clearDepth(1); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    runPass('opaque', list, { ...rctx, pass: 'opaque' });
    runPass('add', list, { ...rctx, pass: 'add' });
    // 2. main view: sky, mirror, ground decals (roads), opaque, ink outline, light
    const ctx = { ...base, reflect: false, view: cam.view, proj: cam.proj, viewProj: cam.viewProj };
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.f); gl.viewport(0, 0, W, H); gl.drawBuffers(BOTH);
    gl.depthMask(true); gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.disable(gl.DEPTH_TEST); gl.disable(gl.BLEND); gl.depthMask(false);
    sky.draw(cam, sp);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    ground.draw(cam, sp, refl.color, refl.aux, W, H, dawn, env.ground || {});
    gl.disable(gl.BLEND);
    runPass('ground', list, { ...ctx, pass: 'ground' });
    runPass('opaque', list, { ...ctx, pass: 'opaque' });
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.fc); gl.depthMask(false);
    post.outline(scene.aux, scene.depth, cam, env.outline || {});
    gl.bindFramebuffer(gl.FRAMEBUFFER, scene.f);
    runPass('add', list, { ...ctx, pass: 'add' });
    gl.depthMask(true);
  }

  // render one output frame at song time t. opts: {mb: sub-samples, shutter: fraction of the frame interval (0.5 = 180 deg)}
  function render(t, opts = {}) {
    const N = Math.max(1, opts.mb ?? +(Q.get('mb') || 1)); const shutter = opts.shutter ?? +(Q.get('shutter') || 0.5);
    post.beginAccum();
    for (let i = 0; i < N; i++) {
      const ts = N > 1 ? t + ((i + 0.5) / N - 0.5) * (shutter / FPS) : t;
      const jx = N > 1 ? rng.halton(i, 2) - 0.5 : 0, jy = N > 1 ? rng.halton(i, 3) - 0.5 : 0;
      const F = show.frame(ts);
      renderScene(F, ts, jx, jy);
      post.accumulate(scene.color, 1 / N);
    }
    const F0 = show.frame(t);
    let hc = F0.hud ? hud.draw({ ink: ((F0.env && F0.env.dawn) || 0) > 0.5 ? 1 : 0, ...F0.hud }, t, engine) : null;
    if (F0.overlay) { if (!hc) hc = hud.clear(); F0.overlay(hud.g, W, H, t); }     // 2D overlay drawn crisp over the graded frame (terminal card, credits)
    post.finish((F0.env && F0.env.grade) || {}, hc, Math.round(t * FPS));
    const err = gl.getError(); if (err) console.log('gl error 0x' + err.toString(16) + ' at t=' + t);
  }

  let px = null, ws = null, wsAck = null;
  // push the canvas pixels (RGBA, bottom-up) to the harness: one binary WebSocket message per frame (key first, then pixels, then wait for 'ok')
  async function post_(i) {
    if (!px) px = new Uint8Array(W * H * 4);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
    if (!ws) { ws = new WebSocket(`ws://${location.host}/__ws`); ws.binaryType = 'arraybuffer'; await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; }); ws.onmessage = () => { const f = wsAck; wsAck = null; if (f) f(); }; }
    const ack = new Promise((res) => { wsAck = res; });
    ws.send((Q.get('wid') || 0) + ':' + i); ws.send(px); await ack;
  }
  Object.assign(window.ENGINE, { ready: true, render, post: post_, engine, show, duration: time.duration,
    async renderAndPost(t, i, opts) { render(t, opts); await post_(i); } });
  // interactive preview when opened by hand: ?play=1&t0=12
  if (Q.get('play')) { const t0 = +(Q.get('t0') || 0), s = performance.now(); const loop = () => { render(t0 + (performance.now() - s) / 1000); requestAnimationFrame(loop); }; loop(); }
  else render(+(Q.get('t') || 0));
}
boot().catch((e) => { console.error('BOOT ERROR', e && e.stack ? e.stack : e); window.ENGINE.error = String(e && e.stack ? e.stack : e); });

/* README — how things plug in
Show module:
  export async function setup(engine) { ... build static things: engine.roads(defs), engine.lights(n), your own drawables ... }
  export function frame(t) { return {
    camera: { pos, target, fov?, roll?, near?, far?, focusDist?, aperture? },
    env: { dawn: 0..1, sun?: {az, elev, radius, gain, bands}, ground?: {ripple, fogDist, fogAmt, f0, base, reflGain, reflBlur, rough},
           outline?: {width, strength, color}, grade?: {exposure, contrast, saturation, lift, gain, vignette, grain, ca, bloom, bloomThreshold, bloomSpread, streak, streakThreshold} },
    drawables: [ ... ],        // drawn in array order inside each pass
    type: [ lineDesc, ... ],   // world-space lyric lines (see type.js)
    hud: { branch, color, hash?, ctx?, count? } | null,
    overlay: (g2d, W, H, t) => {...}   // optional: draw on the HUD canvas (crisp, after grading)
  }; }
Drawable: { draw(ctx), passes?: ['opaque','add'] (default) | ['ground'] | ..., reflect?: false to skip the mirror }
  ctx = { gl, W, H, pass, reflect, view, proj, viewProj, camPos, fovY, focusDist, aperture, dawn, t, near, far, env, sunDir }
  The engine sets GL state before every draw: opaque = depth test+write, no blend, MRT (out0 HDR colour, out1 aux rgb=part id, a=1);
  add = blend ONE,ONE, depth test, no depth write, only out0; ground = blend ONE,ONE_MINUS_SRC_ALPHA, no depth, only out0 (decals on the mirror).
  A drawable may change blend func / draw buffers for itself; the engine resets state before the next drawable.
*/
