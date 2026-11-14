// Glyph pass (take two, PLAN section 5 item 10): a plate rendered in REAL characters, every one a JetBrains Mono glyph set by the browser.
// Canvas 2D port of v6's engine/src/textlook.js (branch claude/v6-text): its ramp, its 12 fps boil (re-seeded per drawing step, a cell's
// level jitters by one), its rule that bright regions take real text instead of ramp characters. New here: edge-direction glyphs, two
// cell sizes for depth, colour from the source or a lane palette, and a keep mask so her face and body are never turned into text.
//   await loadGlyphFont()                        once per page (adds the "JetBrains Mono" FontFace; harmless if already loaded)
//   glyphPass(ctx, src, rect, opts)              synchronous; draws into ctx at rect {x, y, w, h}
// opts:
//   font      font size in px at 1080p for far cells (default 24: phone-legible); cell = .6 x 1.22 of it (JetBrains Mono's advance)
//   cell      alias: cell HEIGHT in px at 1080p (overrides font: font = cell / 1.22)
//   near      font size for near cells (default font * 1.5); depth chooses between the two
//   depth     null (all far) | 'y' (lower in frame = near; default) | [v0, v1] (near from v0 to v1 down the frame) | 'luma' | fn(u, v) -> 0..1 (u, v in 0..1 of rect) | canvas (white = near)
//   nearAt    depth above which a cell is near (default .62); dither: noise on that choice (default .22; 0 = a clean edge); far cells are dimmer (farDim, default .62)
//   ramp      dim -> bright characters (default v6's '.:-=+*#%@')   edges  true: strong edges take | / - \ by direction (default true)
//   edgeT     edge strength for a direction glyph (default .22)
//   palette   null: colour from the source (saturation boosted); or ['#dark', ..., '#bright'] a lane ramp by luminance
//   sat       saturation boost for source colour (default 1.35)    gain  brightness gain (default 1.15)   gamma (default .75)
//   peak      0..1 cell luminance = mean mixed with the brightest of 3 x 3 samples (default .5)   local  local contrast (default .8)
//   thresh    luminance below which a cell is empty (default .05)   floor  >0: empty cells still get a faint ramp glyph at this
//             brightness (a field of characters, as in the MMORPG reference) (default 0)   textMin  shortest bright run that takes text (8)
//   text      array of strings (real commit messages): cells brighter than `hi` (default .62) take these, laid along each row's bright
//             runs from the run's start, so they read as words; textBright: brightness of text cells (default 1)
//   seed, t   song time; shimmer steps at fps (default 12), never per frame, never falling: a fraction `shimmer` (default .12) of ramp
//             cells moves one level up or down per step; text cells hold (they must read when paused) unless textShimmer
//   bg        '#000' (default) or 'none' (draw over what is in ctx)
//   keep      [{x, y, w, h}, ...] in rect-relative px, or { mask: canvas|ImageBitmap, luma: bool, feather: px, invert: bool }: the source
//             shows through untouched there (the mask is white/opaque where kept)
//   weight    font weight (default 600)    out  optional object; receives { ms, cells }
const FAMILY = 'JetBrains Mono';
export const RAMP = '.:-=+*#%@';
export async function loadGlyphFont(url = '/engine/fonts/JetBrainsMono[wght].ttf') {
  if (typeof document === 'undefined') return;
  for (const f of document.fonts) if (f.family.replace(/"/g, '') === FAMILY && f.status === 'loaded') return;
  const ff = new FontFace(FAMILY, `url("${url}")`, { weight: '100 800' }); await ff.load(); document.fonts.add(ff);
}
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
function hash3(a, b, c) {
  let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296;
}
const hexRGB = (s) => { const n = parseInt(String(s).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const mk = (w, h) => (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h }));

// ---------------------------------------------------------------- glyph atlas: white glyphs on transparent, lazily filled, per font size
const ATL = new Map();
function atlasFor(fpx, weight) {
  const key = `${fpx.toFixed(2)}:${weight}`; let A = ATL.get(key); if (A) return A;
  const cw = Math.ceil(fpx * .6) + 2, ch = Math.ceil(fpx * 1.22) + 2, cols = 32, rows = 12;
  const cv = mk(cols * cw, rows * ch), g = cv.getContext('2d');
  A = { cv, g, cw, ch, cols, rows, map: new Map(), n: 0, fpx, font: `${weight} ${fpx}px "${FAMILY}"` };
  ATL.set(key, A); return A;
}
function slot(A, c) {
  let s = A.map.get(c); if (s !== undefined) return s;
  if (A.n >= A.cols * A.rows) return A.map.get('?') ?? 0;
  s = A.n++; A.map.set(c, s);
  const x = (s % A.cols) * A.cw, y = Math.floor(s / A.cols) * A.ch, g = A.g;
  g.save(); g.beginPath(); g.rect(x, y, A.cw, A.ch); g.clip();
  g.font = A.font; g.fillStyle = '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(c, x + A.cw / 2, y + A.ch / 2 + A.fpx * .04);
  g.restore(); return s;
}

// ---------------------------------------------------------------- scratch
const SC = {};
function scratch(name, w, h, rf = true) {
  let s = SC[name]; if (!s || s.w !== w || s.h !== h) { const cv = mk(w, h); s = SC[name] = { w, h, cv, g: cv.getContext('2d', { willReadFrequently: rf }) }; }
  return s;
}

// the source sampled to a grid of cells (average colour per cell, plus a 2x grid for gradients)
function sampleGrid(src, cols, rows, rect, cover) {
  const s = scratch(`g${cols}x${rows}`, cols, rows), g = s.g;
  g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, cols, rows); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
  g.drawImage(src, cover[0], cover[1], cover[2], cover[3], 0, 0, cols, rows);
  return g.getImageData(0, 0, cols, rows).data;
}

export function glyphPass(ctx, src, rect, opts = {}) {
  const t0 = performance.now();
  const S = rect.h / 1080, seed = (opts.seed ?? 1) | 0, fps = opts.fps || 12, step = Math.floor((opts.t || 0) * fps + 1e-6);
  const weight = opts.weight || 600;
  const farF = (opts.cell ? opts.cell / 1.22 : (opts.font || 24)) * S, nearF = (opts.near || (opts.cell ? opts.cell / 1.22 : (opts.font || 24)) * 1.5) * S;
  const depth = opts.depth === undefined ? 'y' : opts.depth, nearAt = opts.nearAt ?? .62, farDim = opts.farDim ?? .62;
  const ramp = opts.ramp || RAMP, NR = ramp.length, thresh = opts.thresh ?? .05, gain = opts.gain ?? 1.15, gamma = opts.gamma ?? .75;
  const pal = opts.palette ? opts.palette.map(hexRGB) : null, sat = opts.sat ?? 1.35, edges = opts.edges ?? true, edgeT = opts.edgeT ?? .22;
  const dither = opts.dither ?? .22, floor = opts.floor ?? 0, textMin = opts.textMin ?? 8, peak = opts.peak ?? .5, local = opts.local ?? .8, text = opts.text && opts.text.length ? opts.text : null, hi = opts.hi ?? .62, shimmer = opts.shimmer ?? .12;
  // source rect that covers the target rect
  const sw = src.width, sh = src.height, k = Math.max(rect.w / sw, rect.h / sh), cover = [(sw - rect.w / k) / 2, (sh - rect.h / k) / 2, rect.w / k, rect.h / k];
  // depth sampler
  let depthAt;
  if (!depth) depthAt = () => 0;
  else if (depth === 'y') depthAt = (u, v) => clamp01((v - .35) / .5);
  else if (Array.isArray(depth)) depthAt = (u, v) => clamp01((v - depth[0]) / Math.max(1e-3, depth[1] - depth[0]));
  else if (typeof depth === 'function') depthAt = depth;
  else if (depth === 'luma') depthAt = null;   // per cell, from its own luminance
  else { const d = sampleGrid(depth, 64, 36, rect, [0, 0, depth.width, depth.height]); depthAt = (u, v) => d[(Math.min(35, (v * 36) | 0) * 64 + Math.min(63, (u * 64) | 0)) * 4] / 255; }

  const layer = scratch('layer', Math.ceil(rect.w), Math.ceil(rect.h), false), lg = layer.g;
  if (opts.bg !== 'none') { ctx.save(); ctx.fillStyle = opts.bg || '#000'; ctx.fillRect(rect.x, rect.y, rect.w, rect.h); ctx.restore(); }
  let cells = 0;
  for (const near of [false, true]) {
    if (near && !depth) break;
    const fpx = near ? nearF : farF, A = atlasFor(fpx, weight);
    const cw = fpx * .6, ch = fpx * 1.22, cols = Math.ceil(rect.w / cw), rows = Math.ceil(rect.h / ch);
    // the source at 3 x 3 samples per cell: colour = mean, luminance = mean mixed with the peak (thin bright strokes survive), then
    // local contrast against the neighbourhood so silhouettes on a dark ground still separate
    const sub = sampleGrid(src, cols * 3, rows * 3, rect, cover), N = cols * rows, px = new Float32Array(N * 4), lum = new Float32Array(N), W3 = cols * 3;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      let R = 0, G = 0, B = 0, mx = 0, mean = 0;
      for (let dy = 0; dy < 3; dy++) for (let dx = 0; dx < 3; dx++) {
        const j = ((r * 3 + dy) * W3 + c * 3 + dx) * 4, a = sub[j], b = sub[j + 1], d = sub[j + 2];
        R += a; G += b; B += d; const l = (.2126 * a + .7152 * b + .0722 * d) * .7 + Math.max(a, b, d) * .3; mean += l; if (l > mx) mx = l;
      }
      const i = r * cols + c; px[i * 4] = R / 9; px[i * 4 + 1] = G / 9; px[i * 4 + 2] = B / 9;
      lum[i] = ((1 - peak) * mean / 9 + peak * mx) / 255;
    }
    if (local > 0) {
      const bl = new Float32Array(N), R2 = 3;
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { let a = 0, n = 0; for (let dy = -R2; dy <= R2; dy++) { const rr = r + dy; if (rr < 0 || rr >= rows) continue; for (let dx = -R2; dx <= R2; dx++) { const cc = c + dx; if (cc < 0 || cc >= cols) continue; a += lum[rr * cols + cc]; n++; } } bl[r * cols + c] = a / n; }
      for (let i = 0; i < N; i++) lum[i] = clamp01(lum[i] + (lum[i] - bl[i]) * local);
    }
    const col = scratch(near ? 'colN' : 'colF', cols, rows), cimg = col.g.createImageData(cols, rows), C = cimg.data;
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.globalCompositeOperation = 'source-over'; lg.globalAlpha = 1; lg.clearRect(0, 0, layer.w, layer.h);
    let tpos = 0, inRun = false, this_msg = '', msgI = 0, runs = 0; const tbase = text ? Math.floor(hash3(seed, 1, 2) * text.length) : 0;
    // length of each row's bright run (text needs room to be read: runs shorter than textMin take the ramp)
    const runLen = new Uint16Array(N);
    if (text) for (let r = 0; r < rows; r++) { let c0 = 0; for (let c = 0; c <= cols; c++) { const br = c < cols && Math.pow(clamp01(lum[r * cols + c] * gain), gamma) >= hi; if (!br) { for (let q = c0; q < c; q++) runLen[r * cols + q] = c - c0; c0 = c + 1; } } }
    for (let r = 0; r < rows; r++) {
      inRun = false;
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c, u = (c + .5) / cols, v = (r + .5) / rows;
        const L0 = lum[i]; let dp = depthAt ? depthAt(u, v) : clamp01((L0 - .3) / .5);
        const isNear = !(text && L0 * gain >= hi) && dp + (hash3(c * 3 + (near ? 1 : 0), r * 5, seed + 9) - .5) * dither >= nearAt;   // text stays on the far (reading) plane
        if (isNear !== near) { inRun = false; continue; }
        let lv = Math.pow(clamp01(L0 * gain), gamma);
        let dim = false;
        if (lv < thresh) { inRun = false; if (floor <= 0) continue; dim = true; }
        // glyph: text in bright runs, else edge direction, else the ramp
        let chr, isText = false;
        if (text && lv >= hi && runLen[i] >= textMin) {
          if (!inRun) { inRun = true; const m = (tbase + r * 5 + runs++ * 3) % text.length; tpos = 0; this_msg = text[m]; msgI = m; }
          let s = this_msg; while (tpos >= s.length + 3) { tpos -= s.length + 3; msgI = (msgI + 1) % text.length; this_msg = s = text[msgI]; }
          chr = tpos < s.length ? s[tpos] : ' '; tpos++; isText = true;
          if (chr === ' ') continue;
        } else {
          inRun = false;
          let lev = dim ? (hash3(c, r, seed + step * 3) < .5 ? 0 : 1) : Math.min(NR - 1, Math.floor((lv - thresh) / (1 - thresh) * NR));
          chr = ramp[lev];
          if (!dim && edges && c > 0 && r > 0 && c < cols - 1 && r < rows - 1) {
            const gx = (lum[i + 1] - lum[i - 1]) * 2 + lum[i - cols + 1] - lum[i - cols - 1] + lum[i + cols + 1] - lum[i + cols - 1];
            const gy = (lum[i + cols] - lum[i - cols]) * 2 + lum[i + cols - 1] - lum[i - cols - 1] + lum[i + cols + 1] - lum[i - cols + 1];
            const gm = Math.hypot(gx, gy * (cw / ch));
            if (gm > edgeT * 4) {
              // the edge runs perpendicular to the gradient; cells are taller than wide, so correct the angle by the aspect
              let a = Math.atan2(gy * cw, gx * ch) * 180 / Math.PI + 90; a = ((a % 180) + 180) % 180;
              chr = a < 22.5 || a >= 157.5 ? '-' : a < 67.5 ? '\\' : a < 112.5 ? '|' : '/';
            }
          }
          if (shimmer > 0 && chr === ramp[lev]) {
            const hsh = hash3(c * 7 + 1, r * 13 + 5, step * 31 + seed);
            if (hsh < shimmer * .5) lev = Math.max(0, lev - 1); else if (hsh > 1 - shimmer * .5) lev = Math.min(NR - 1, lev + 1);
            chr = ramp[lev];
          }
        }
        let b = isText ? (opts.textBright ?? 1) : dim ? floor * (.6 + .8 * hash3(c, r, seed + 4)) : .35 + .65 * lv;
        if (!near && depth) b *= farDim + (1 - farDim) * dp / nearAt;
        const s = slot(A, chr);
        lg.globalAlpha = clamp01(b);
        lg.drawImage(A.cv, (s % A.cols) * A.cw, Math.floor(s / A.cols) * A.ch, A.cw, A.ch, c * cw + (cw - A.cw) / 2, r * ch + (ch - A.ch) / 2, A.cw, A.ch);
        cells++;
        // colour of this cell
        const j = i * 4; let R, G, B;
        if (pal) {
          const x = clamp01(lv) * (pal.length - 1), p = Math.min(pal.length - 2, Math.floor(x)), f = x - p, P0 = pal[p], P1 = pal[Math.min(pal.length - 1, p + 1)];
          if (pal.length === 1) [R, G, B] = pal[0]; else { R = P0[0] + (P1[0] - P0[0]) * f; G = P0[1] + (P1[1] - P0[1]) * f; B = P0[2] + (P1[2] - P0[2]) * f; }
        } else {
          R = px[j]; G = px[j + 1]; B = px[j + 2]; const m = (R + G + B) / 3; R = m + (R - m) * sat; G = m + (G - m) * sat; B = m + (B - m) * sat;
          const mx = Math.max(R, G, B, 1), up = Math.min(255 / mx, 2.2); R *= up; G *= up; B *= up;   // colour at full value; brightness is the glyph's alpha
        }
        C[j] = R; C[j + 1] = G; C[j + 2] = B; C[j + 3] = 255;
      }
    }
    col.g.putImageData(cimg, 0, 0);
    lg.globalAlpha = 1; lg.globalCompositeOperation = 'source-in'; lg.imageSmoothingEnabled = false;
    lg.drawImage(col.cv, 0, 0, cols * cw, rows * ch);
    lg.globalCompositeOperation = 'source-over';
    ctx.drawImage(layer.cv, 0, 0, rect.w, rect.h, rect.x, rect.y, rect.w, rect.h);
  }
  // keep: the source untouched (her face and body)
  if (opts.keep) drawKeep(ctx, src, rect, cover, opts.keep);
  if (opts.out) { opts.out.ms = performance.now() - t0; opts.out.cells = cells; }
}

function drawKeep(ctx, src, rect, cover, keep) {
  if (Array.isArray(keep)) {
    ctx.save(); ctx.beginPath(); for (const k of keep) ctx.rect(rect.x + k.x, rect.y + k.y, k.w, k.h); ctx.clip();
    ctx.drawImage(src, cover[0], cover[1], cover[2], cover[3], rect.x, rect.y, rect.w, rect.h); ctx.restore(); return;
  }
  const W = Math.ceil(rect.w), H = Math.ceil(rect.h), m = scratch('keepM', W, H), k = scratch('keepK', W, H, false);
  const mg = m.g; mg.setTransform(1, 0, 0, 1, 0, 0); mg.globalCompositeOperation = 'source-over'; mg.clearRect(0, 0, W, H);
  mg.filter = keep.feather ? `blur(${keep.feather * rect.h / 1080}px)` : 'none';
  mg.drawImage(keep.mask, 0, 0, W, H); mg.filter = 'none';
  if (keep.luma || keep.invert) {
    const d = mg.getImageData(0, 0, W, H), a = d.data;
    for (let i = 0; i < a.length; i += 4) { let v = keep.luma ? a[i] * a[i + 3] / 255 : a[i + 3]; if (keep.invert) v = 255 - v; a[i] = a[i + 1] = a[i + 2] = 255; a[i + 3] = v; }
    mg.putImageData(d, 0, 0);
  }
  const kg = k.g; kg.globalCompositeOperation = 'source-over'; kg.clearRect(0, 0, W, H);
  kg.drawImage(src, cover[0], cover[1], cover[2], cover[3], 0, 0, rect.w, rect.h);
  kg.globalCompositeOperation = 'destination-in'; kg.drawImage(m.cv, 0, 0); kg.globalCompositeOperation = 'source-over';
  ctx.drawImage(k.cv, 0, 0, rect.w, rect.h, rect.x, rect.y, rect.w, rect.h);
}
