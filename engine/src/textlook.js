// v6 "written in text" (docs/treatment_v6.md): every frame is characters on black, from one fixed character set, coloured only from the
// branch palette. The rules are enforced by construction:
//   - a TextGrid is the only thing a v6 scene can draw into: one cell = one character (CHARSET index) + one lane (PALETTE index) + a
//     brightness + a raw-mix byte. There is no other colour and no other mark.
//   - TextPass draws a grid with the glyph atlas: colour = PALETTE[lane] * brightness * glyph coverage, on black. No bloom, no grain.
//   - Sources (her footage, stand-in takes, procedural shapes, big type) reach the screen only through TextGrid.image()/shape(), which turn
//     luminance into ramp characters. The one exception is the switch (236.64): cells with a raw-mix byte show the raw source texture, and a
//     cell at 255 shows it unprocessed (TextPass samples it with no colour transform).
// Density (one number 0..1) sets the cell size: sparse and readable at 0, near-solid at 1 (cellPx). The refresh rate (hold, in 24 fps
// "drawing" frames: 1 = on ones, 2 = on twos ...) quantises content time and re-seeds the glyph boil (drawClock).
import * as THREE from 'three';

// main orange; rose, sky, mint, gold, violet, white for the branches (same values as engine/show/main.js L)
export const PALETTE = { orange: '#FF7A1A', rose: '#FF5FA2', sky: '#6FB6FF', mint: '#4FE3B0', gold: '#FFD23F', violet: '#A57BFF', white: '#F4F4F8' };
export const LANES = Object.keys(PALETTE);                     // lane index = position here (0 = main)
export const lane = (name) => (typeof name === 'number' ? name : Math.max(0, LANES.indexOf(name)));

// The fixed character set: printable ASCII + a few drawing marks (procedural in the atlas so they join across cells). Index 0 = empty cell.
const BOX = '─│┌┐└┘├┤┬┴┼╱╲╳';
const BLOCK = '█▓▒░';
const EXTRA = BOX + BLOCK + '·•●○◆✦↳→←↑↓…';
export const CHARSET = [...Array.from({ length: 95 }, (_, i) => String.fromCharCode(32 + i)), ...EXTRA];
const CODE = new Map(CHARSET.map((c, i) => [c, i + 1]));
export const code = (ch) => CODE.get(ch) ?? CODE.get('?');
// brightness ramp, dim -> bright (one character per level)
export const RAMP = '.:-=+*#%@';
export const ASPECT = 1.6;                                      // cell height / width

// density 0..1 -> cell width in output px (1920-reference 40 px at 0, 6 px at 1), never below 3 px
export const cellPx = (d, W) => Math.max(3, (W / 1920) * 40 * Math.pow(6 / 40, Math.max(0, Math.min(1, d))));
// the drawing clock: frame index df on `hold` (24 fps drawing frames per glyph refresh) and the quantised content time tq
export function drawClock(t, hold = 2) { const h = Math.max(1, hold), df = Math.floor(t * 24 / h + 1e-6); return { df, tq: df * h / 24 }; }
export const hash = (a, b = 0, c = 0) => { let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 2147483647); h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export class TextGrid {
  constructor(W, H) { this.W = W; this.H = H; this.cw = 0; this.setCell(16); }
  setCell(px) {
    const cw = Math.max(3, Math.round(px)); if (cw === this.cw) return this;
    this.cw = cw; this.ch = Math.round(cw * ASPECT); this.cols = Math.ceil(this.W / cw); this.rows = Math.ceil(this.H / this.ch);
    this.data = new Uint8Array(this.cols * this.rows * 4);
    this.tex?.dispose();
    this.tex = new THREE.DataTexture(this.data, this.cols, this.rows, THREE.RGBAFormat, THREE.UnsignedByteType);
    this.tex.magFilter = this.tex.minFilter = THREE.NearestFilter; this.tex.generateMipmaps = false; this.tex.flipY = false;
    this.cv = document.createElement('canvas'); this.cv.width = this.cols; this.cv.height = this.rows;
    this.g = this.cv.getContext('2d', { willReadFrequently: true });
    return this;
  }
  setDensity(d) { return this.setCell(cellPx(d, this.W)); }
  clear() { this.data.fill(0); this.raw = null; return this; }
  upload() { this.tex.needsUpdate = true; }
  // screen px <-> cell
  col(x) { return Math.floor(x / this.cw); }
  row(y) { return Math.floor(y / this.ch); }
  // one cell. b = brightness 0..1; max = true keeps the brighter of old and new (crowds, overlaps)
  put(c, r, ch, ln = 0, b = 1, { max = false, raw = 0 } = {}) {
    c |= 0; r |= 0; if (c < 0 || r < 0 || c >= this.cols || r >= this.rows || b <= 0) return;
    const i = (r * this.cols + c) * 4, B = Math.min(255, Math.round(b * 255));
    if (max && this.data[i + 2] >= B) return;
    this.data[i] = typeof ch === 'number' ? ch : code(ch); this.data[i + 1] = lane(ln); this.data[i + 2] = B; if (raw) this.data[i + 3] = raw;
  }
  get(c, r) { const i = (r * this.cols + c) * 4; return { code: this.data[i], lane: this.data[i + 1], b: this.data[i + 2] / 255 }; }
  // a string from cell (c, r); align 'left' | 'center' | 'right'; n = how many characters are shown (typing on)
  text(c, r, s, ln = 0, b = 1, { align = 'left', n = Infinity, max = false } = {}) {
    s = String(s); const k = Math.min(s.length, Math.max(0, Math.floor(n)));
    const c0 = Math.round(align === 'center' ? c - s.length / 2 : align === 'right' ? c - s.length : c);
    for (let i = 0; i < k; i++) if (s[i] !== ' ') this.put(c0 + i, r, s[i], ln, b, { max });
    return c0;
  }
  // a box of drawing characters, cells [c0, c1] x [r0, r1]
  box(c0, r0, c1, r1, ln = 0, b = 1) {
    for (let c = c0 + 1; c < c1; c++) { this.put(c, r0, '─', ln, b); this.put(c, r1, '─', ln, b); }
    for (let r = r0 + 1; r < r1; r++) { this.put(c0, r, '│', ln, b); this.put(c1, r, '│', ln, b); }
    this.put(c0, r0, '┌', ln, b); this.put(c1, r0, '┐', ln, b); this.put(c0, r1, '└', ln, b); this.put(c1, r1, '┘', ln, b);
  }
  // Rasterise a canvas drawing (draw(g) in SCREEN px, on black) into lit cells: luminance -> ramp character, lane colour, brightness.
  // opts: lane, gain, gamma, thresh (below = empty), fill (0..1: fraction of cells allowed to light: sparse = low), seed, df (boil frame),
  //       boil (0..1: chance a cell's level jitters by one per drawing frame), text (characters that replace the ramp above `hi`),
  //       laneOf(r, g, b) -> lane (per-pixel lanes), raw (fn(c, r, lum) -> 0..1: the switch), bmin (dimmest lit brightness)
  shape(draw, o = {}) {
    const g = this.g; g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    g.fillStyle = '#000'; g.fillRect(0, 0, this.cols, this.rows);
    g.setTransform(this.cols / this.W, 0, 0, this.rows / this.H, 0, 0); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    draw(g);
    return this.fromCanvas(o);
  }
  fromCanvas({ lane: ln = 0, gain = 1, gamma = 1, thresh = .07, fill = 1, seed = 1, df = 0, boil = .15, text = null, hi = .8, laneOf = null,
    raw = null, bmin = .3, max = true, mask = null, levels = null, key = 'luma' } = {}) {
    const px = this.g.getImageData(0, 0, this.cols, this.rows).data, N = RAMP.length, L = lane(ln);
    let lit = 0;
    // key 'diff' (stand-ins with lit generated backgrounds): a cell's value is how far it is from its row's median (the background), over the
    // drawn (non-black) cells only; key 'luma' (her footage, shot on a dark backdrop): the value is the brightness itself
    let med = null;
    if (key === 'diff') { med = new Float32Array(this.rows); for (let r = 0; r < this.rows; r++) { const a = [];
      for (let c = 0; c < this.cols; c++) { const j = (r * this.cols + c) * 4, v = Math.max(px[j], px[j + 1], px[j + 2]) / 255; if (v > .02) a.push(v); }
      a.sort((x, y) => x - y); med[r] = a.length ? a[a.length >> 1] : 0; } }
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const j = (r * this.cols + c) * 4, R = px[j], G = px[j + 1], Bl = px[j + 2];
      let v = Math.max(R, G, Bl) / 255; if (med) v = v > .02 ? Math.abs(v - med[r]) * 2.2 : 0; if (mask) v *= mask(c, r);
      if (levels) v = Math.max(0, (v - levels[0]) / (levels[1] - levels[0]));
      v = Math.pow(Math.min(1, v * gain), gamma);
      if (v < thresh) continue;
      if (fill < 1 && hash(c, r, seed) > fill) continue;
      let lev = Math.min(N - 1, Math.floor((v - thresh) / (1 - thresh) * N));
      if (boil > 0) { const h = hash(c * 7 + 1, r * 13 + 5, df * 31 + seed); if (h < boil * .5) lev = Math.max(0, lev - 1); else if (h > 1 - boil * .5) lev = Math.min(N - 1, lev + 1); }
      let ch = RAMP[lev];
      if (text && v >= hi) { const s = text.replace(/ /g, ''); ch = s[(c + r * 7 + (seed | 0)) % s.length]; }
      const rw = raw ? raw(c, r, v) : 0;
      this.put(c, r, ch, laneOf ? laneOf(R, G, Bl) : L, bmin + (1 - bmin) * v, { max, raw: rw > 0 ? Math.max(1, Math.round(rw * 255)) : 0 });
      lit++;
    }
    return lit;
  }
  // the switch: set every cell's raw byte (dark cells too), fn(c, r) -> 0..1
  rawMask(fn) {
    let any = 0;
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) { const v = fn(c, r); if (v <= 0) continue; this.data[(r * this.cols + c) * 4 + 3] = Math.max(1, Math.min(255, Math.round(v * 255))); any++; }
    return any;
  }
  // coming apart: lit cells lift and drift (amount 0..1), some drop out; deterministic per cell (seed)
  scatter(amount, seed = 1) {
    if (amount <= 0) return;
    const src = this.data.slice(); this.data.fill(0);
    for (let r = 0; r < this.rows; r++) for (let c = 0; c < this.cols; c++) {
      const i = (r * this.cols + c) * 4; if (!src[i]) continue;
      const h = hash(c, r, seed); if (h < amount * .6) continue;
      const dy = Math.round(amount * amount * this.rows * .5 * hash(c, r, seed + 1)), dx = Math.round((hash(c, r, seed + 2) - .5) * amount * 6);
      const c2 = c + dx, r2 = r - dy; if (c2 < 0 || r2 < 0 || c2 >= this.cols) continue;
      const j = (r2 * this.cols + c2) * 4; this.data[j] = src[i]; this.data[j + 1] = src[i + 1]; this.data[j + 2] = Math.round(src[i + 2] * (1 - .5 * amount)); this.data[j + 3] = src[i + 3];
    }
  }
  // an image-like source (ImageBitmap, canvas, img) placed at screen rect [x, y, w, h] (default: cover the frame), mirrored with flipX
  image(src, o = {}) {
    if (!src) return 0;
    const rect = o.rect || cover(src.width, src.height, this.W, this.H, o.zoom ?? 1, o.cx ?? .5, o.cy ?? .5);
    return this.shape((g) => {
      g.save(); if (o.flipX) { g.translate(rect[0] * 2 + rect[2], 0); g.scale(-1, 1); }
      g.drawImage(src, rect[0], rect[1], rect[2], rect[3]); g.restore();
    }, o);
  }
}
// rect that covers (W, H) with an image (w, h), zoomed about (cx, cy) of the image
export function cover(w, h, W, H, zoom = 1, cx = .5, cy = .5) {
  const s = Math.max(W / w, H / h) * zoom, dw = w * s, dh = h * s;
  return [W / 2 - cx * dw, H / 2 - cy * dh, dw, dh];
}

// big type made of characters: words drawn into the grid canvas, lit cells take the word's own letters
export function bigType(grid, str, { x = grid.W / 2, y = grid.H / 2, size = 200, font = 'ARCH', wght = 900, lane: ln = 0, gain = 1, align = 'center',
  df = 0, seed = 3, fill = 1, stretch = 'expanded', scale = 1, text = null } = {}) {
  return grid.shape((g) => {
    g.save(); g.translate(x, y); g.scale(scale, scale);
    g.font = `${wght} ${size}px ${font}`; g.fontStretch = stretch; g.textAlign = align; g.textBaseline = 'middle'; g.fillStyle = '#fff';
    g.fillText(str, 0, 0); g.restore();
  }, { lane: ln, gain, thresh: .35, text: text ?? str, hi: 0, df, seed, fill, boil: 0, bmin: .55 });
}

// the glyph atlas: CHARSET in 16 x 9 slots of 64 x 113 px on a 1024 px canvas (mipmapped); box and block marks drawn procedurally so they
// join across cells
let ATLAS = null;
const SLOT_W = 64, SLOT_H = 113, ACOLS = 16;
export function atlas() {
  if (ATLAS) return ATLAS;
  const cv = document.createElement('canvas'); cv.width = cv.height = 1024;
  const g = cv.getContext('2d'); g.fillStyle = '#000'; g.fillRect(0, 0, 1024, 1024); g.fillStyle = '#fff'; g.strokeStyle = '#fff';
  g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '600 80px JBM';
  CHARSET.forEach((ch, i) => {
    const x0 = (i % ACOLS) * SLOT_W, y0 = Math.floor(i / ACOLS) * SLOT_H, cx = x0 + SLOT_W / 2, cy = y0 + SLOT_H / 2, lw = 9;
    g.save(); g.beginPath(); g.rect(x0, y0, SLOT_W, SLOT_H); g.clip();
    const bi = BOX.indexOf(ch), ki = BLOCK.indexOf(ch);
    if (bi >= 0) {
      g.lineWidth = lw; g.lineCap = 'butt'; g.beginPath();
      const arm = { '─': 'LR', '│': 'UD', '┌': 'RD', '┐': 'LD', '└': 'UR', '┘': 'UL', '├': 'UDR', '┤': 'UDL', '┬': 'LRD', '┴': 'LRU', '┼': 'LRUD' }[ch];
      if (arm) for (const a of arm) { g.moveTo(cx, cy); g.lineTo(a === 'L' ? x0 : a === 'R' ? x0 + SLOT_W : cx, a === 'U' ? y0 : a === 'D' ? y0 + SLOT_H : cy); }
      if (ch === '╱' || ch === '╳') { g.moveTo(x0, y0 + SLOT_H); g.lineTo(x0 + SLOT_W, y0); }
      if (ch === '╲' || ch === '╳') { g.moveTo(x0, y0); g.lineTo(x0 + SLOT_W, y0 + SLOT_H); }
      g.stroke();
    } else if (ki >= 0) {
      g.globalAlpha = [1, .72, .45, .22][ki]; g.fillRect(x0, y0, SLOT_W, SLOT_H);
    } else if (ch !== ' ') g.fillText(ch, cx, cy + 4);
    g.restore();
  });
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.NoColorSpace; tex.flipY = false;
  tex.minFilter = THREE.LinearMipmapLinearFilter; tex.magFilter = THREE.LinearFilter; tex.generateMipmaps = true; tex.anisotropy = 1;
  ATLAS = { tex, cv };
  return ATLAS;
}

// draws grids to the current render target, composited "over" by glyph coverage (premultiplied), on whatever is there (black after begin())
export class TextPass {
  constructor(renderer, W, H) {
    this.r = renderer; this.W = W; this.H = H;
    // the palette's sRGB bytes as they are (Vector3, so no colour management touches them); the shader writes them straight to the frame
    const pal = LANES.map((k) => { const n = parseInt(PALETTE[k].slice(1), 16); return new THREE.Vector3((n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255); });
    this.mat = new THREE.ShaderMaterial({
      uniforms: { tGrid: { value: null }, uGrid: { value: new THREE.Vector2() }, uCell: { value: new THREE.Vector2() }, tAtlas: { value: atlas().tex },
        uPal: { value: pal }, uRes: { value: new THREE.Vector2(W, H) }, uFade: { value: 1 }, tRaw: { value: null }, uHasRaw: { value: 0 },
        uRawRect: { value: new THREE.Vector4(0, 0, W, H) }, uKnock: { value: 0 } },
      vertexShader: 'void main(){ gl_Position = vec4(position.xy, 0., 1.); }',
      fragmentShader: `precision highp float;
        uniform sampler2D tGrid, tAtlas, tRaw; uniform vec2 uGrid, uCell, uRes; uniform vec3 uPal[${LANES.length}]; uniform float uFade, uHasRaw, uKnock; uniform vec4 uRawRect;
        void main(){
          vec2 p = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);          // top-left origin, px
          vec2 cell = floor(p / uCell), f = fract(p / uCell);
          if (cell.x >= uGrid.x || cell.y >= uGrid.y) discard;
          vec4 g = texture2D(tGrid, (cell + .5) / uGrid) * 255.;
          float code = floor(g.r + .5), raw = g.a / 255.;
          float cov = 0.; vec3 col = vec3(0.);
          if (code > .5) {
            float i = code - 1.; vec2 slot = vec2(mod(i, ${ACOLS}.), floor(i / ${ACOLS}.));
            vec2 uv = (slot * vec2(${SLOT_W}., ${SLOT_H}.) + f * vec2(${SLOT_W}., ${SLOT_H}.)) / 1024.;
            cov = texture2D(tAtlas, uv).r;
            int ln = int(floor(g.g + .5)); vec3 pc = uPal[0];
            for (int k = 1; k < ${LANES.length}; k++) if (k == ln) pc = uPal[k];
            col = pc * (g.b / 255.) * cov;
          }
          if (uHasRaw > .5 && raw > 0.) {
            vec2 q = (p - uRawRect.xy) / uRawRect.zw;
            vec3 rc = (q.x < 0. || q.y < 0. || q.x > 1. || q.y > 1.) ? vec3(0.) : texture2D(tRaw, q).rgb;
            col = mix(col, rc, raw); cov = max(cov, raw);
          }
          if (uKnock > .5 && code > .5) cov = 1.;   // knockout: a written cell hides what is under it (labels, small lyrics)
          gl_FragColor = vec4(col * uFade, cov * uFade);
        }`,
      transparent: true, depthTest: false, depthWrite: false,
      blending: THREE.CustomBlending, blendEquation: THREE.AddEquation, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    });
    this.scene = new THREE.Scene(); this.cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    this.scene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), this.mat));
    this.rawTex = new THREE.Texture(); this.rawTex.colorSpace = THREE.NoColorSpace; this.rawTex.flipY = false; this.rawTex.generateMipmaps = false;
    this.rawTex.minFilter = this.rawTex.magFilter = THREE.LinearFilter;
  }
  begin() { const r = this.r; r.setRenderTarget(null); r.autoClear = false; r.setClearColor(0x000000, 1); r.clear(); }
  // raw = { src: ImageBitmap/canvas, rect: [x, y, w, h] } for the switch
  draw(grid, { fade = 1, raw = null, knock = false } = {}) {
    const u = this.mat.uniforms; grid.upload(); u.uKnock.value = knock ? 1 : 0;
    u.tGrid.value = grid.tex; u.uGrid.value.set(grid.cols, grid.rows); u.uCell.value.set(grid.cw, grid.ch); u.uFade.value = fade;
    if (raw && raw.src) {
      if (this.rawTex.image !== raw.src) { this.rawTex.image = raw.src; this.rawTex.needsUpdate = true; }
      u.tRaw.value = this.rawTex; u.uHasRaw.value = 1; u.uRawRect.value.set(...raw.rect);
    } else u.uHasRaw.value = 0;
    this.r.render(this.scene, this.cam);
  }
  end() { this.r.autoClear = true; }
}
