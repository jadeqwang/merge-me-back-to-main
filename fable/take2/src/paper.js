// Paper pass (take two, PLAN section 2 item 5): a CG frame (v7) redrawn as line and tone on paper, the way an artist redraws a plate.
//   paperPass(ctx, src, rect, opts)   synchronous Canvas 2D; draws into ctx at rect {x, y, w, h}
// How it draws (deterministic: same inputs, same pixels):
//   1. Analysis at half size (luminance, colour) and quarter size (tone). Tone levels are anchored at the frame's MEDIAN: whatever is
//      at or below the typical value of the frame is bare paper, so a sky stays paper and only what stands out gets marks.
//   2. Lines: a one-sided XDoG edge field (light side of an edge on black paper, where chalk catches the rim; dark side on white paper,
//      the ink outline), broken by a low-frequency lift noise, drawn twice with small offsets that change every boil step (a sketchy,
//      redrawn contour rather than a traced one).
//   3. Tone: hatching as real strokes (Canvas paths): finite, tapered, slightly bowed lens shapes on up to three angles. A stroke is
//      drawn whole or not at all, decided by the tone at its own centre, so strokes overrun region edges as a hand does. Or stipple dots.
//      The brightest (or darkest) core is rubbed in solid.
//   4. Every mark is eaten by a fixed paper tooth (grain + fibres, destination-out), so it catches the grain like pencil, chalk or gel pen.
//   5. Colour: neutral (chalk on black, graphite on white) unless the source is near one of opts.ink by hue: lanes keep their hue.
//   Boil: strokes, line offsets and lift re-seed every 1/12 s (floor(t * 12)), never per frame. The paper never moves.
// opts:
//   paper   'black' | 'white' (default 'black')        paperColor  override ('#rrggbb')
//   stroke  neutral mark colour (default chalk #ECE6D8 on black, graphite #26221F on white)
//   ink     ['#rrggbb', ...] accent inks kept from the source by hue      inkSat  min source saturation to take an ink (default .28)
//   seed    integer (default 1)      t  song time (s)      fps  boil rate (default 12)      boil  0..1 how much moves per step (default 1)
//   tone    'hatch' | 'stipple' (default 'hatch')         hatch  hatch spacing in px at 1080p (default 9)    stroke length: len (default 90)
//   angle   base hatch angle, degrees (default 55)    angleVar  radians the hatch turns across the frame, fixed per seed (default .6)        layers  hatch layers 1..3 (default 3)
//   levels  [lo, hi] tone levels in luminance (default: lo = median + .04 on black paper / median - .04 on white, hi = 99.5th / .5th pct)
//   thresholds [a, b, c] tone where each hatch layer starts (default [.12, .4, .66])      solid  tone where the core is rubbed solid (.84 black, .94 white)
//   line    edge strength (default 1)    detail  edge threshold (lower = more lines; default .018)    lift  0..1 line breakup (default .4)
//   lineSide 'light' | 'dark' | 'both': which side of an edge carries the contour (default: light on black paper, both on white)
//   coarse  strength of the outline of big soft forms (coarse DoG at quarter size) (default 1; 0 = off)   coarseDetail (.03 one-sided, .007 both)
//   tooth   0..1 how much the paper grain eats the marks (default .55)
//   invert  white paper only: marks where it is LIGHT (a negative drawing) (default false)
//   scale   internal raster scale (default 1; .75 draws at 75% and scales up: about half the time, softer marks)
//   out     optional object; receives { ms, strokes, prof }    skip  debug: 'h' no hatch, 'c' no contour, 't' no tooth
const h3 = (a, b, c) => Math.sqrt(a * a + b * b + c * c);
const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
function hash3(a, b, c) {
  let h = Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263) + Math.imul(c | 0, 1274126177);
  h = Math.imul(h ^ (h >>> 13), 1274126177); h ^= h >>> 16; return (h >>> 0) / 4294967296;
}
const hexRGB = (s) => { const n = parseInt(String(s).replace('#', ''), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; };
const css = (c) => `rgb(${c[0] | 0},${c[1] | 0},${c[2] | 0})`;
const mk = (w, h) => (typeof OffscreenCanvas !== 'undefined' ? new OffscreenCanvas(w, h) : Object.assign(document.createElement('canvas'), { width: w, height: h }));
function hueOf(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn; if (d === 0) return 0;
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return h / 6;
}

const SC = {}, CACHE = new Map();
function scratch(name, w, h, rf = false) {
  let s = SC[name]; if (!s || s.w !== w || s.h !== h) { const cv = mk(w, h); s = SC[name] = { w, h, cv, g: cv.getContext('2d', { willReadFrequently: rf }) }; }
  return s;
}
function blur(src, w, h, sigma, tmp, dst) {
  const r = Math.max(1, Math.ceil(sigma * 2.2)), K = 2 * r + 1, k = new Float32Array(K); let sum = 0;
  for (let i = -r; i <= r; i++) { k[i + r] = Math.exp(-(i * i) / (2 * sigma * sigma)); sum += k[i + r]; }
  for (let i = 0; i < K; i++) k[i] /= sum;
  for (let y = 0; y < h; y++) {
    const o = y * w;
    for (let x = 0; x < w; x++) {
      let a = 0;
      if (x >= r && x < w - r) { const b = o + x - r; for (let i = 0; i < K; i++) a += src[b + i] * k[i]; }
      else for (let i = -r; i <= r; i++) { let xx = x + i; xx = xx < 0 ? 0 : xx >= w ? w - 1 : xx; a += src[o + xx] * k[i + r]; }
      tmp[o + x] = a;
    }
  }
  for (let y = 0; y < h; y++) {
    if (y >= r && y < h - r) { for (let x = 0; x < w; x++) { let a = 0, b = (y - r) * w + x; for (let i = 0; i < K; i++, b += w) a += tmp[b] * k[i]; dst[y * w + x] = a; } }
    else for (let x = 0; x < w; x++) { let a = 0; for (let i = -r; i <= r; i++) { let yy = y + i; yy = yy < 0 ? 0 : yy >= h ? h - 1 : yy; a += tmp[yy * w + x] * k[i + r]; } dst[y * w + x] = a; }
  }
  return dst;
}
// smooth value noise sampler over a lattice (cell cs px), one per (seed, step, channel)
function lattice(w, h, cs, seed, step, chan) {
  const gw = Math.ceil(w / cs) + 2, gh = Math.ceil(h / cs) + 2, L = new Float32Array(gw * gh);
  for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) L[j * gw + i] = hash3(i + chan * 1013, j + step * 7919, seed * 97 + chan);
  return (x, y) => {
    const fx = x / cs, fy = y / cs, i = fx | 0, j = fy | 0, u = fx - i, v = fy - j, uu = u * u * (3 - 2 * u), vv = v * v * (3 - 2 * v), o = j * gw + i;
    const a = L[o] + (L[o + 1] - L[o]) * uu, b = L[o + gw] + (L[o + gw + 1] - L[o + gw]) * uu; return a + (b - a) * vv;
  };
}
// the sheet: paper colour with grain (cached per size, colour and seed), and the tooth mask that eats marks (alpha = how much is eaten)
function sheet(W, H, P, black, seed, toothK) {
  const key = `${W}x${H}:${P}:${black}:${seed}:${toothK}`; let s = CACHE.get(key); if (s) return s;
  const grain = new Float32Array(W * H);
  for (const [sx, sy, amp, ch] of [[1.6, 1.6, .4, 1], [4, 4, .3, 2], [30, 2.6, .3, 3]]) { const n = lattice(W, H, 1, seed, 0, ch), kx = 1 / sx, ky = 1 / sy; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) grain[y * W + x] += amp * n(x * kx, y * ky); }
  const pc = mk(W, H), pg = pc.getContext('2d'), pi = pg.createImageData(W, H), pd = pi.data;
  const tc = mk(W, H), tg = tc.getContext('2d'), ti = tg.createImageData(W, H), td = ti.data;
  const amp = black ? 9 : 13;
  for (let i = 0, j = 0; i < W * H; i++, j += 4) {
    const g = grain[i] - .5;
    pd[j] = P[0] + g * amp; pd[j + 1] = P[1] + g * amp; pd[j + 2] = P[2] + g * amp * .9; pd[j + 3] = 255;
    td[j] = pd[j]; td[j + 1] = pd[j + 1]; td[j + 2] = pd[j + 2]; td[j + 3] = 255 * clamp01((.62 - grain[i]) * 2.4) * toothK;   // valleys of the tooth stay paper
  }
  pg.putImageData(pi, 0, 0); tg.putImageData(ti, 0, 0);
  s = { paper: pc, tooth: tc }; if (CACHE.size > 6) CACHE.clear(); CACHE.set(key, s); return s;
}

export function paperPass(ctx, src, rect, opts = {}) {
  const t0 = performance.now(); const PROF = [['start', t0]];
  const black = (opts.paper || 'black') !== 'white';
  const seed = (opts.seed ?? 1) | 0, fps = opts.fps || 12, boil = opts.boil ?? 1, bstep = boil > 0 ? Math.floor((opts.t || 0) * fps + 1e-6) : 0;
  const rs = opts.scale || 1, FW = Math.max(8, Math.round(rect.w * rs)), FH = Math.max(8, Math.round(rect.h * rs)), S = FH / 1080;
  const AW = Math.max(4, FW >> 1), AH = Math.max(4, FH >> 1), QW = Math.max(2, FW >> 2), QH = Math.max(2, FH >> 2);

  // ---------- 1. analysis at half size
  const an = scratch('an', AW, AH, true), ag = an.g;
  ag.globalCompositeOperation = 'copy'; ag.imageSmoothingEnabled = true; ag.imageSmoothingQuality = 'medium';
  const sw = src.width, sh = src.height, k = Math.max(AW / sw, AH / sh), dw = sw * k, dh = sh * k;
  ag.drawImage(src, (AW - dw) / 2, (AH - dh) / 2, dw, dh); ag.globalCompositeOperation = 'source-over';
  const px = ag.getImageData(0, 0, AW, AH).data, NA = AW * AH;
  if (!an.L) { an.L = new Float32Array(NA); an.b1 = new Float32Array(NA); an.b2 = new Float32Array(NA); an.tmp = new Float32Array(NA); an.ink = new Uint8Array(NA); an.inkW = new Float32Array(NA); an.img = ag.createImageData(AW, AH); an.E = new Float32Array(NA); an.o1 = new Float32Array(NA); an.o2 = new Float32Array(NA); }
  const L = an.L, inks = (opts.ink || []).map(hexRGB), inkHue = inks.map(([r, g, b]) => hueOf(r, g, b)), inkSat = opts.inkSat ?? .28;
  const hist = new Uint32Array(256);
  for (let i = 0, j = 0; i < NA; i++, j += 4) {
    const r = px[j], g = px[j + 1], b = px[j + 2], mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    const lum = (0.6 * (0.2126 * r + 0.7152 * g + 0.0722 * b) + 0.4 * mx) / 255;
    an.o1[i] = (r - g) / 255; an.o2[i] = ((r + g) * .5 - b) / 255;
    L[i] = lum; hist[Math.min(255, (lum * 255) | 0)]++;
    let ki = 0, kw = 0;
    if (inks.length && mx > 40) {
      const sat = (mx - mn) / mx;
      if (sat > inkSat) {
        const hu = hueOf(r, g, b); let best = 1e9;
        for (let q = 0; q < inks.length; q++) { let d = Math.abs(hu - inkHue[q]); if (d > .5) d = 1 - d; if (d < best) { best = d; ki = q + 1; } }
        kw = clamp01((sat - inkSat) / .25) * clamp01(1 - best / .12) * clamp01((mx - 40) / 80); if (kw <= .05) ki = 0;
      }
    }
    an.ink[i] = ki; an.inkW[i] = kw;
  }
  PROF.push(['an', performance.now()]);
  const pct = (p) => { let acc = 0; for (let i = 0; i < 256; i++) { acc += hist[i]; if (acc >= NA * p) return i / 255; } return 1; };
  const inv = black || opts.invert ? 1 : -1;
  let lo, hi;
  if (opts.levels) [lo, hi] = opts.levels;
  else if (inv > 0) { lo = pct(.5) + .04; hi = Math.max(lo + .12, pct(.995)); }
  else { lo = pct(.5) - .04; hi = Math.min(lo - .12, pct(.005)); }
  // tone at quarter size (area-averaged from the half-size luminance)
  const QN = QW * QH; if (!an.T || an.T.length !== QN) an.T = new Float32Array(QN);
  if (!an.LQ || an.LQ.length !== QN) { an.LQ = new Float32Array(QN); an.c1 = new Float32Array(QN); an.c2 = new Float32Array(QN); an.ct = new Float32Array(QN); an.O1 = new Float32Array(QN); an.O2 = new Float32Array(QN); an.p1 = new Float32Array(QN); an.p2 = new Float32Array(QN); an.p3 = new Float32Array(QN); an.p4 = new Float32Array(QN); }
  const LQ = an.LQ, O1 = an.O1, O2 = an.O2, T = an.T, tgam = opts.gamma ?? 1.5;
  for (let y = 0; y < QH; y++) for (let x = 0; x < QW; x++) {
    const o = (y * 2) * AW + x * 2, v = (L[o] + L[o + 1] + L[o + AW] + L[o + AW + 1]) * .25;
    T[y * QW + x] = Math.pow(clamp01((v - lo) / (hi - lo)), tgam); LQ[y * QW + x] = v;
    O1[y * QW + x] = (an.o1[o] + an.o1[o + 1] + an.o1[o + AW] + an.o1[o + AW + 1]) * .25; O2[y * QW + x] = (an.o2[o] + an.o2[o + 1] + an.o2[o + AW] + an.o2[o + AW + 1]) * .25;
  }
  const tq = blur(T, QW, QH, 1.2, new Float32Array(QN), T);
  const tAt = (x, y) => { let qx = (x * .25) | 0, qy = (y * .25) | 0; if (qx < 0 || qy < 0 || qx >= QW || qy >= QH) return 0; return tq[qy * QW + qx]; };
  // edges (one-sided DoG), with lift breakup and colour, into a half-size RGBA image
  const b1 = blur(L, AW, AH, .9, an.tmp, an.b1), b2 = blur(b1, AW, AH, 1.14, an.tmp, an.b2);   // b2 = sigma 1.45 (cascaded)
  const N0 = opts.stroke ? hexRGB(opts.stroke) : black ? [236, 230, 216] : [38, 34, 31];
  const lside = opts.lineSide ?? (black ? 'light' : 'both'), side = lside === 'light' ? 1 : lside === 'dark' ? -1 : 0, thr = opts.detail ?? .018, lineK = opts.line ?? 1, lift = opts.lift ?? .4, solid = opts.solid ?? (black ? .84 : .94);
  const nl = lattice(AW, AH, 11 * S, seed, bstep, 3); let anyF = false;
  for (let y = 0, i = 0; y < AH; y++) for (let x = 0; x < AW; x++, i++) {
    const d0 = b1[i] - .985 * b2[i], d = side ? d0 * side : Math.abs(d0) * .8;
    let e = clamp01((d - thr) / (thr * 2)) * lineK;
    if (e > 0) e *= clamp01((nl(x, y) - lift * .5) * 3);
    an.E[i] = e;
  }
  // the rubbed-in core (solid), at quarter size: soft anyway
  if (!an.sol || an.sol.width !== QW || an.sol.height !== QH) an.sol = ag.createImageData(QW, QH);
  const SD = an.sol.data;
  for (let i = 0; i < QN; i++) {
    const tv = tq[i], f = tv > solid ? clamp01((tv - solid) / (1 - solid) * 1.5) * .9 : 0, j = i * 4;
    if (f <= 0) { SD[j + 3] = 0; continue; }
    anyF = true;
    const ai = Math.min(AH - 1, ((i / QW) | 0) * 2) * AW + Math.min(AW - 1, (i % QW) * 2);
    let r = N0[0], g = N0[1], b = N0[2]; const ki = an.ink[ai]; if (ki) { const w = an.inkW[ai], c = inks[ki - 1]; r += (c[0] - r) * w; g += (c[1] - g) * w; b += (c[2] - b) * w; }
    SD[j] = r; SD[j + 1] = g; SD[j + 2] = b; SD[j + 3] = 255 * f;
  }
  PROF.push(['edges', performance.now()]);
  const ec = scratch('solid', QW, QH); if (anyF) ec.g.putImageData(an.sol, 0, 0);

  // ---------- 2-4. marks layer at full size
  const P = opts.paperColor ? hexRGB(opts.paperColor) : black ? [20, 19, 23] : [243, 238, 226];
  const SH = sheet(FW, FH, P, black, seed, opts.tooth ?? .55);
  // at scale 1 the marks go straight onto ctx (clipped to rect); otherwise onto a layer that is scaled up at the end
  const direct = rs === 1, M = direct ? null : scratch('marks', FW, FH), mg = direct ? ctx : M.g;
  mg.save();
  if (direct) { mg.beginPath(); mg.rect(rect.x, rect.y, FW, FH); mg.clip(); mg.translate(rect.x, rect.y); } else mg.setTransform(1, 0, 0, 1, 0, 0);
  mg.globalCompositeOperation = 'source-over'; mg.globalAlpha = 1; mg.filter = 'none';
  mg.drawImage(SH.paper, 0, 0);
  mg.imageSmoothingEnabled = true; mg.imageSmoothingQuality = 'medium';
  // the rubbed-in core (soft, from the half-size image)
  if (anyF) mg.drawImage(ec.cv, 0, 0, FW, FH);
  // the contour: short strokes laid along the edge (perpendicular to the gradient) at the strongest edge pixel of each 2 x 2 half-size
  // cell; they overlap into a sketchy line, re-laid every boil step
  const NCc = inks.length + 1, cpaths = Array.from({ length: NCc * 3 }, () => new Path2D()), E = an.E, cw = opts.lineWidth || 1;
  let nseg = 0;
  for (let cy = 1; cy < AH - 2; cy += 2) for (let cx = 1; cx < AW - 2; cx += 2) {
    let bi = -1, be = opts.lineMin ?? .3;
    for (let dy = 0; dy < 2; dy++) for (let dx = 0; dx < 2; dx++) { const i = (cy + dy) * AW + cx + dx; if (E[i] > be) { be = E[i]; bi = i; } }
    if (bi < 0) continue;
    const gx = b1[bi + 1] - b1[bi - 1], gy = b1[bi + AW] - b1[bi - AW], gm = Math.sqrt(gx * gx + gy * gy); if (gm < 1e-5) continue;
    const ex = -gy / gm, ey = gx / gm, hx = hash3(cx, cy, seed + bstep * 17), hy = hash3(cy, cx, seed + 3 + bstep * 17);
    const X = ((bi % AW) + .5) * 2 + (hx - .5) * 1.6 * S * boil, Y = (((bi / AW) | 0) + .5) * 2 + (hy - .5) * 1.6 * S * boil;
    const l = (4.5 + 4 * hx) * S, a = (hy - .5) * .35 * boil, ca = Math.cos(a), sa = Math.sin(a), ux = ex * ca - ey * sa, uy = ex * sa + ey * ca;
    const P2 = cpaths[(an.inkW[bi] > .35 ? an.ink[bi] : 0) * 3 + Math.min(2, (be * 3) | 0)];
    P2.moveTo(X - ux * l, Y - uy * l); P2.lineTo(X + ux * l, Y + uy * l); nseg++;
  }
  // big soft forms (a sun in its glow) get an outline too: the same contour strokes from a coarse DoG at quarter size, longer
  if ((opts.coarse ?? 1) > 0) {
    const c1 = blur(LQ, QW, QH, 1.3, an.ct, an.c1), c2 = blur(LQ, QW, QH, 2.3, an.ct, an.c2);
    // colour edges count too where both sides are drawn (a yellow sun in a pink glow of the same brightness)
    const q1 = side ? null : blur(O1, QW, QH, 1.3, an.ct, an.p1), q2 = side ? null : blur(O1, QW, QH, 2.3, an.ct, an.p2), q3 = side ? null : blur(O2, QW, QH, 1.3, an.ct, an.p3), q4 = side ? null : blur(O2, QW, QH, 2.3, an.ct, an.p4);
    const thr2 = opts.coarseDetail ?? (side ? .03 : .007), kq = opts.coarse ?? 1;
    for (let qy = 1; qy < QH - 1; qy++) for (let qx = 1; qx < QW - 1; qx++) {
      const i = qy * QW + qx, d0 = c1[i] - c2[i], d = side ? d0 * side : h3(d0 * .3, (q1[i] - q2[i]) * .5, (q3[i] - q4[i]) * .5) * .8;
      let e = clamp01((d - thr2) / (thr2 * 1.5)) * kq; if (e < .3) continue;
      // only at the ridge across the edge: the strongest of its neighbours along the gradient
      const gx = c1[i + 1] - c1[i - 1], gy = c1[i + QW] - c1[i - QW], gm = Math.sqrt(gx * gx + gy * gy); if (gm < 1e-5) continue;
      const nx = gx / gm, ny = gy / gm, ia = (qy + Math.round(ny)) * QW + qx + Math.round(nx), ib = (qy - Math.round(ny)) * QW + qx - Math.round(nx);
      const dq = (k) => side ? (c1[k] - c2[k]) * side : h3((c1[k] - c2[k]) * .3, (q1[k] - q2[k]) * .5, (q3[k] - q4[k]) * .5) * .8, da = dq(ia), db = dq(ib);
      if (da > d || db > d) continue;
      e *= clamp01((nl(qx * 2, qy * 2) - lift * .5) * 3); if (e < .3) continue;
      const hx = hash3(qx, qy, seed + 77 + bstep * 17), hy = hash3(qy, qx, seed + 78 + bstep * 17);
      const X = (qx + .5) * 4 + (hx - .5) * 2 * S * boil, Y = (qy + .5) * 4 + (hy - .5) * 2 * S * boil, l = (7 + 6 * hx) * S, a = (hy - .5) * .25 * boil;
      const ex = -ny, ey = nx, ca = Math.cos(a), sa = Math.sin(a), ux = ex * ca - ey * sa, uy = ex * sa + ey * ca;
      const ai = Math.min(AH - 1, qy * 2) * AW + Math.min(AW - 1, qx * 2);
      const P2 = cpaths[(an.inkW[ai] > .35 ? an.ink[ai] : 0) * 3 + Math.min(2, (e * 3) | 0)];
      P2.moveTo(X - ux * l, Y - uy * l); P2.lineTo(X + ux * l, Y + uy * l); nseg++;
    }
  }
  mg.lineCap = 'round';
  if (!(opts.skip || '').includes('c')) for (let ci = 0; ci < NCc; ci++) for (let al = 0; al < 3; al++) {
    mg.globalAlpha = .6 + .2 * al; mg.strokeStyle = css([N0, ...inks][ci]); mg.lineWidth = (1.1 + .5 * al) * S * cw; mg.stroke(cpaths[ci * 3 + al]);
  }
  mg.globalAlpha = 1;
  PROF.push(['sheet+contour', performance.now()]);
  // strokes, batched per (colour, alpha level)
  const nly = Math.max(1, Math.min(3, opts.layers ?? 3)), th = opts.thresholds || [.12, .4, .66];
  const sp0 = (opts.hatch || 8) * S, len0 = (opts.len || 56) * S, stip = opts.tone === 'stipple';
  const base = ((opts.angle ?? 55) + (hash3(seed, 3, 9) - .5) * 10) * Math.PI / 180;
  const NC = inks.length + 1, NAL = 4, paths = Array.from({ length: NC * NAL }, () => new Path2D());
  const colours = [N0, ...inks];
  const inkAt = (x, y) => { const ax = Math.min(AW - 1, Math.max(0, (x * .5) | 0)), ay = Math.min(AH - 1, Math.max(0, (y * .5) | 0)), i = ay * AW + ax; return an.inkW[i] > .35 ? an.ink[i] : 0; };
  let strokes = 0;
  const diag = Math.hypot(FW, FH), angVar = opts.angleVar ?? .6, angN = lattice(FW, FH, 260 * S, seed, 0, 9);
  if (!stip) for (let q = 0; q < nly; q++) {
    const a = base + [0, -1.2, .6][q] + (hash3(bstep, q, seed) - .5) * .06 * boil, c = Math.cos(a), s = Math.sin(a);
    const sp = sp0 * [1, .95, .85][q], len = len0 * [1, .8, .65][q], ph = hash3(bstep, q + 11, seed) * boil;
    const cx = FW / 2, cy = FH / 2, nL = Math.ceil(diag / sp / 2) + 1, nS = Math.ceil(diag / len / 2) + 1;
    for (let li = -nL; li <= nL; li++) {
      const v = (li + ph) * sp, off = hash3(li, q, seed + 3) * len;
      for (let sj = -nS; sj <= nS; sj++) {
        const u = sj * len + off;
        const x = cx + u * c - v * s, y = cy + u * s + v * c;
        if (x < -len || y < -len || x > FW + len || y > FH + len) continue;
        const hs = hash3(li * 3 + q, sj, seed + bstep * 101), tc = tAt(x, y), need = th[q] + (hs - .5) * .08;
        if (tc < need) continue;
        // a hand keeps a stroke mostly inside its area: shorten it toward whichever end leaves the tone
        const press = clamp01((tc - need) / .3);
        const L2 = len * (.42 + .12 * hash3(sj, li, seed + 7 + bstep)) * (.85 + .3 * press);
        const jx = (hash3(li, sj, bstep * 3 + 5) - .5) * sp * .5 * boil, jy = (hash3(sj, li, bstep * 3 + 6) - .5) * sp * .5 * boil;
        const dA = (angN(x, y) - .5) * angVar, cd = Math.cos(dA), sd = Math.sin(dA), c2 = c * cd - s * sd, s2 = s * cd + c * sd;   // the hand turns the hatch with the region
        let ea = L2, eb = L2; const lim = need * .7;
        if (tAt(x - c2 * ea, y - s2 * ea) < lim) ea *= tAt(x - c2 * ea * .5, y - s2 * ea * .5) < lim ? .3 : .6;
        if (tAt(x + c2 * eb, y + s2 * eb) < lim) eb *= tAt(x + c2 * eb * .5, y + s2 * eb * .5) < lim ? .3 : .6;
        const xa = x + jx - c2 * ea, ya = y + jy - s2 * ea, xb = x + jx + c2 * eb, yb = y + jy + s2 * eb;
        const w = sp * (.08 + .16 * press) * (black ? 1 : .9), bow = (hs - .5) * sp * .9;
        const mxp = x + jx - s2 * bow, myp = y + jy + c2 * bow;     // bowed middle
        const P2 = paths[inkAt(x, y) * NAL + Math.min(NAL - 1, (press * NAL) | 0)];
        P2.moveTo(xa, ya); P2.quadraticCurveTo(mxp - s2 * w * 2, myp + c2 * w * 2, xb, yb); P2.quadraticCurveTo(mxp + s2 * w * 2, myp - c2 * w * 2, xa, ya);
        strokes++;
      }
    }
  } else {
    const cs = sp0 * 1.1;
    for (let cj = 0; cj * cs < FH + cs; cj++) for (let ci = 0; ci * cs < FW + cs; ci++) {
      const hx = (ci + .15 + .7 * hash3(ci, cj, seed + bstep * 13)) * cs, hy = (cj + .15 + .7 * hash3(cj, ci, seed + 5 + bstep * 13)) * cs, tc = tAt(hx, hy);
      if (tc < th[0]) continue;
      const press = clamp01((tc - th[0]) / (1 - th[0])), r = cs * .55 * Math.sqrt(press) * (.7 + .5 * hash3(ci, cj, 77));
      if (r < .5) continue;
      const P2 = paths[inkAt(hx, hy) * NAL + Math.min(NAL - 1, (press * NAL) | 0)]; P2.moveTo(hx + r, hy); P2.arc(hx, hy, r, 0, Math.PI * 2); strokes++;
    }
  }
  PROF.push(['strokegen', performance.now()]);
  const SKIP = opts.skip || '';
  if (!SKIP.includes('h')) for (let ci = 0; ci < NC; ci++) for (let al = 0; al < NAL; al++) { mg.globalAlpha = .55 + .15 * al; mg.fillStyle = css(colours[ci]); mg.fill(paths[ci * NAL + al]); }
  PROF.push(['fill', performance.now()]);
  mg.globalAlpha = 1;
  // the tooth eats the marks: the paper itself, laid back over them where its grain is low
  if (!SKIP.includes('t')) mg.drawImage(SH.tooth, 0, 0);
  mg.restore();
  if (!direct) ctx.drawImage(M.cv, rect.x, rect.y, rect.w, rect.h);
  PROF.push(['composite', performance.now()]);
  if (opts.out) { opts.out.ms = performance.now() - t0; opts.out.strokes = strokes; opts.out.prof = PROF.slice(1).map(([n, v], i) => n + ' ' + (v - PROF[i][1]).toFixed(1)).join(', '); }
}
export const PAPER = { black: '#141317', white: '#F3EEE2' };
