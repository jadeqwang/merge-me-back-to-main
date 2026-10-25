// Engine entry: window.ENGINE = { ready, render(t), readPixels() }. t is song time in seconds.
// The show is an EDL (engine/show/edl.js): shots [{t0, t1, kind, ...}] -> scene instances (engine/src/scenes/*).
import * as THREE from 'three';
import { glyphAtlas, DEFAULT_TEXT } from './lattice.js';
import { Post } from './post.js';
import { TypeLayer, loadFonts } from './type.js';
import { LedText } from './ledtext.js';

const P = new URLSearchParams(location.search);
const W = +(P.get('w') || 1920), H = +(P.get('h') || 1080);

await loadFonts();
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H); document.body.appendChild(renderer.domElement);
const gl = renderer.getContext();

const ctx = { THREE, renderer, W, H, P, atlas: glyphAtlas(DEFAULT_TEXT), post: new Post(renderer, W, H), type: new TypeLayer(W, H), led: new LedText(renderer, W, H, { pitch: Math.max(2, Math.round(4 * W / 1920)) }) };
ctx.type.led = ctx.led; ctx.post.led = ctx.led;
const show = await import(P.get('show') || '/engine/show/edl.js');
const T = await import('./time.js');
await T.loadTiming();
ctx.T = T;
const SCENES = {};
async function sceneFor(shot) {
  if (!shot._inst) {
    if (!SCENES[shot.kind]) SCENES[shot.kind] = (await import(`/engine/src/scenes/${shot.kind}.js`)).default;
    shot._inst = new SCENES[shot.kind](ctx, shot);
    await shot._inst.setup?.();
  }
  return shot._inst;
}

let busy = Promise.resolve();
async function render(t) {
  const shots = show.shots.filter((s) => t >= s.t0 && t < s.t1);
  if (!shots.length) { renderer.setRenderTarget(null); renderer.setClearColor(0, 1); renderer.clear(); return; }
  // shots render in order; a shot's scene draws the whole frame (later shots may composite over via their own logic)
  for (const s of shots) { ctx.post.resolve.uniforms.uFade.value = 1; ctx.post.bloom.strength = s.bloom ?? .6; const inst = await sceneFor(s); await inst.render(t, (t - s.t0) / (s.t1 - s.t0)); }
  // dispose scenes that are well behind us
  for (const s of show.shots) if (s._inst && t > s.t1 + 2) { s._inst.dispose?.(); s._inst = null; }
}

const px = new Uint8Array(W * H * 4);
window.ENGINE = {
  ready: false,
  render: (t) => (busy = busy.then(() => render(t))),
  readPixels() {
    if (gl.isContextLost()) console.log('CONTEXT LOST at readPixels');
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
    let s = ''; const CH = 0x8000;
    for (let i = 0; i < px.length; i += CH) s += String.fromCharCode.apply(null, px.subarray(i, i + CH));
    return btoa(s);
  },
};
await window.ENGINE.render(+(P.get('t') || 0));
window.ENGINE.ready = true;
