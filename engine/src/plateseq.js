// A prepped plate sequence (tools/prep/prep.py output) as three textures that are swapped per frame.
// Slowed playback (a take stretched by fit / a clip remap below BLEND_RATE, e.g. the 0.25-0.47x panes at 0:54 and 2:05) blends the two source
// frames either side of the clock (rgb2 / depth2 / matte2 at weight mixU.value, sampled by lattice.js), so a 0.3x pane glides instead of stepping
// at 7 images/s; at normal speed the nearest frame is shown alone, exactly as before.
import * as THREE from 'three';
import { levels } from './lattice.js';
import { last, fit } from './clip.js';

const cache = new Map();   // url -> Promise<ImageBitmap>
async function bitmap(url) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error('404 ' + url); return r.blob(); })
      .then((b) => createImageBitmap(b, { imageOrientation: 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' })));
    if (cache.size > 900) cache.delete(cache.keys().next().value);
  }
  return cache.get(url);
}

function tex(srgb) {
  const t = new THREE.Texture(); t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.minFilter = THREE.LinearFilter; t.magFilter = THREE.LinearFilter; t.generateMipmaps = false; t.flipY = false;
  return t;
}

export const BLEND_RATE = .9;   // clock rates (clip s per song s) below this blend adjacent frames
const H = 1 / 24;               // step for a clock's rate (one output frame)

export class PlateSeq {
  static async open(base) {
    const s = new PlateSeq(); s.base = base;
    const mr = await fetch(`${base}/meta.json`); if (!mr.ok) throw new Error('no plate ' + base); s.meta = await mr.json();
    s.rgb = tex(true); s.depth = tex(false); s.matte = tex(false);
    s.rgb2 = tex(true); s.depth2 = tex(false); s.matte2 = tex(false); s.mixU = { value: 0 };   // the next frame and its weight (0 = off)
    s.aspect = s.meta.w / s.meta.h; s.frame = -1; s.frame2 = -1; s.blend = true;   // blend = false: a consumer that never samples rgb2 (forktree)
    await s.seek(0);
    s.rgb2.image = s.rgb.image; s.depth2.image = s.depth.image; s.matte2.image = s.matte.image; s.frame2 = 0;   // never an empty sampler
    s.rgb2.needsUpdate = s.depth2.needsUpdate = s.matte2.needsUpdate = true;
    // levels from the first frame (stable for the whole shot)
    const im = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = `${base}/rgb/000000.jpg`; });
    const mm = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = `${base}/matte/000000.png`; });
    s.levels = levels(im, .02, .985, mm, false).map((v) => Math.pow(v, 2.2));
    s.figLevels = levels(im, .02, .995, mm, true).map((v) => Math.pow(v, 2.2));
    return s;
  }
  async load(i) {
    const f = String(i).padStart(6, '0');
    return Promise.all([bitmap(`${this.base}/rgb/${f}.jpg`), bitmap(`${this.base}/depth/${f}.png`), bitmap(`${this.base}/matte/${f}.png`)]);
  }
  // frame index i (fractional): the nearest frame, or with `blend` frames floor(i) and floor(i) + 1 mixed by the fraction
  async seek(i, blend = false) {
    const n = this.meta.n; i = Math.max(0, Math.min(n - 1, i));
    let i0 = Math.round(i), i1 = -1, w = 0;
    if (blend) { i0 = Math.floor(i); w = i - i0; if (w > .02 && i0 + 1 < n) i1 = i0 + 1; else { i0 = Math.round(i); w = 0; } }
    this.mixU.value = i1 < 0 ? 0 : w;
    if (i0 !== this.frame) {
      const [a, b, c] = await this.load(i0);
      this.rgb.image = a; this.depth.image = b; this.matte.image = c;
      this.rgb.needsUpdate = this.depth.needsUpdate = this.matte.needsUpdate = true;
      this.frame = i0;
    }
    if (i1 >= 0 && i1 !== this.frame2) {
      const [a, b, c] = await this.load(i1);
      this.rgb2.image = a; this.depth2.image = b; this.matte2.image = c;
      this.rgb2.needsUpdate = this.depth2.needsUpdate = this.matte2.needsUpdate = true;
      this.frame2 = i1;
    }
    // prefetch ahead
    for (let k = 1; k <= 4; k++) { const g = String(Math.min(n - 1, i0 + k)).padStart(6, '0'); bitmap(`${this.base}/rgb/${g}.jpg`); bitmap(`${this.base}/depth/${g}.png`); bitmap(`${this.base}/matte/${g}.png`); }
  }
  // a clock c(t) (clip s at song time t): show its frame, blended when it runs slower than BLEND_RATE
  async clock(c, t) { const x = c(t); await this.seek(x * this.meta.fps, this.blend && (c(t + H) - x) / H < BLEND_RATE); }
  get last() { return last(this.meta); }   // clip time of the take's last frame (s)
  // song time -> plate frame, with S0 = song time of the clip's frame 0; f = { from, to }: never run off the take before `to` (clip.js fit)
  async at(tSong, s0, f) { await this.clock((t) => fit(t - s0, t, f, this.last), tSong); }
}
