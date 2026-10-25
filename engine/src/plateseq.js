// A prepped plate sequence (tools/prep/prep.py output) as three textures that are swapped per frame.
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

export class PlateSeq {
  static async open(base) {
    const s = new PlateSeq(); s.base = base;
    const mr = await fetch(`${base}/meta.json`); if (!mr.ok) throw new Error('no plate ' + base); s.meta = await mr.json();
    s.rgb = tex(true); s.depth = tex(false); s.matte = tex(false);
    s.aspect = s.meta.w / s.meta.h; s.frame = -1;
    await s.seek(0);
    // levels from the first frame (stable for the whole shot)
    const im = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = `${base}/rgb/000000.jpg`; });
    const mm = await new Promise((r) => { const i = new Image(); i.onload = () => r(i); i.src = `${base}/matte/000000.png`; });
    s.levels = levels(im, .02, .985, mm, false).map((v) => Math.pow(v, 2.2));
    s.figLevels = levels(im, .02, .995, mm, true).map((v) => Math.pow(v, 2.2));
    return s;
  }
  async seek(i) {
    i = Math.max(0, Math.min(this.meta.n - 1, Math.round(i)));
    if (i === this.frame) return;
    const f = String(i).padStart(6, '0');
    const [a, b, c] = await Promise.all([bitmap(`${this.base}/rgb/${f}.jpg`), bitmap(`${this.base}/depth/${f}.png`), bitmap(`${this.base}/matte/${f}.png`)]);
    this.rgb.image = a; this.depth.image = b; this.matte.image = c;
    this.rgb.needsUpdate = this.depth.needsUpdate = this.matte.needsUpdate = true;
    this.frame = i;
    // prefetch ahead
    for (let k = 1; k <= 4; k++) { const g = String(Math.min(this.meta.n - 1, i + k)).padStart(6, '0'); bitmap(`${this.base}/rgb/${g}.jpg`); bitmap(`${this.base}/depth/${g}.png`); bitmap(`${this.base}/matte/${g}.png`); }
  }
  get last() { return last(this.meta); }   // clip time of the take's last frame (s)
  // song time -> plate frame, with S0 = song time of the clip's frame 0; f = { from, to }: never run off the take before `to` (clip.js fit)
  async at(tSong, s0, f) { await this.seek(fit(tSong - s0, tSong, f, this.last) * this.meta.fps); }
}
