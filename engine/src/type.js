// Typography layer: a 2D canvas redrawn per frame, uploaded as a texture and composited before bloom.
// Lyric words carry song-time {w, start, end}; every style is a pure function of t.
import * as THREE from 'three';

export const FONTS = [
  ['ARCH', '/engine/fonts/Archivo[wdth,wght].ttf'], ['UNB', '/engine/fonts/Unbounded[wght].ttf'],
  ['ISI', '/engine/fonts/InstrumentSerif-Italic.ttf'], ['ISR', '/engine/fonts/InstrumentSerif-Regular.ttf'],
  ['JBM', '/engine/fonts/JetBrainsMono[wght].ttf'], ['SG', '/engine/fonts/SpaceGrotesk[wght].ttf'],
];
export async function loadFonts() {
  for (const [name, url] of FONTS) {
    const f = new FontFace(name, `url(${url})`, name === 'ARCH' ? { stretch: '62% 125%', weight: '100 900' } : { weight: '100 900' });
    document.fonts.add(await f.load());
  }
}

export const ease = {
  out: (x) => 1 - Math.pow(1 - x, 3), inOut: (x) => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2,
  outExpo: (x) => x >= 1 ? 1 : 1 - Math.pow(2, -10 * x), back: (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); },
};
export const clamp01 = (x) => Math.max(0, Math.min(1, x));

export class TypeLayer {
  constructor(W, H) {
    this.W = W; this.H = H;
    this.cv = document.createElement('canvas'); this.cv.width = W; this.cv.height = H;
    this.g = this.cv.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.cv); this.tex.colorSpace = THREE.SRGBColorSpace;
    this.tex.minFilter = THREE.LinearFilter; this.tex.generateMipmaps = false;
    this.s = W / 1920;    // all layout in 1920-space
  }
  ledHook(words, t, o = {}) {
    // soft scrim behind the hook so it reads on any plate (fades with the text)
    if (words.length && o.scrim !== false) {
      const k = clamp01((t - words[0].start + .3) / .4) * (o.out ? 1 - clamp01((t - o.out) / .5) : 1);
      if (k > 0) { const g = this.g; g.save(); const cx = o.align === 'center' ? (o.x ?? 960) : (o.x ?? 110) + (o.maxW ?? 900) * .45, cy = (o.y ?? 300) + (o.size ?? 170) * .6;
        const R = Math.max(o.maxW ?? 900, 700) * .85, gr = g.createRadialGradient(cx, cy, 0, cx, cy, R);
        gr.addColorStop(0, `rgba(4,5,12,${.62 * k})`); gr.addColorStop(.6, `rgba(4,5,12,${.38 * k})`); gr.addColorStop(1, 'rgba(4,5,12,0)');
        g.fillStyle = gr; g.fillRect(0, 0, 1920, 1080); g.restore(); }
    }
    this.led?.hook(words, t, o);
  }
  begin() { this.led?.begin(); this.g.setTransform(1, 0, 0, 1, 0, 0); this.g.clearRect(0, 0, this.W, this.H); this.g.setTransform(this.s, 0, 0, this.s, 0, 0); }
  end() { this.tex.needsUpdate = true; }

  // HOOK: giant stacked words, each word slams in at its sung start; held words glow while sung.
  hook(words, t, { x = 110, y = 300, size = 168, lead = .92, font = 'ARCH', wdth = 125, wght = 900, color = '#FFF1DC', glow = '#FFC46B',
    maxW = 900, out = null, align = 'left' } = {}) {
    const g = this.g;
    g.font = `${wght} ${size}px ${font}`; g.fontStretch = 'expanded';
    if (font === 'ARCH') g.font = `${wght} ${size}px ${font}`;
    g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    // lay out lines greedily
    const lines = []; let cur = [], cw = 0;
    const sp = g.measureText(' ').width;
    for (const w of words) { const ww = g.measureText(w.w.toUpperCase()).width; if (cur.length && cw + sp + ww > maxW) { lines.push(cur); cur = []; cw = 0; } cur.push({ ...w, ww }); cw += (cur.length > 1 ? sp : 0) + ww; }
    if (cur.length) lines.push(cur);
    const fade = out ? clamp01((t - out) / .35) : 0;
    lines.forEach((line, li) => {
      const lw = line.reduce((a, w, i) => a + w.ww + (i ? sp : 0), 0);
      let xx = align === 'center' ? x - lw / 2 : x;
      for (const w of line) {
        const k = clamp01((t - w.start + .06) / .18);
        if (k <= 0) { xx += w.ww + sp; continue; }
        const e = ease.back(k), sung = t >= w.start && t <= w.end + .1;
        g.save();
        g.translate(xx, y + li * size * lead);
        g.globalAlpha = Math.min(1, k * 1.6) * (1 - fade);
        const sc = .82 + .18 * e; g.scale(sc, sc);
        g.shadowColor = glow; g.shadowBlur = sung ? 22 : 6;
        g.fillStyle = color; g.fillText(w.w.toUpperCase(), 0, (1 - e) * 40);
        g.restore();
        xx += w.ww + sp;
      }
    });
  }

  // SUB: intimate subtitle in Instrument Serif italic; the line fades in word by word.
  sub(words, t, { x = 960, y = 960, size = 54, color = '#FFF1DC', out = null } = {}) {
    const g = this.g;
    g.font = `400 ${size}px ISI`; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    const sp = g.measureText(' ').width;
    const total = words.reduce((a, w, i) => a + g.measureText(w.w).width + (i ? sp : 0), 0);
    let xx = x - total / 2;
    const fade = out ? clamp01((t - out) / .4) : 0;
    for (const w of words) {
      const ww = g.measureText(w.w).width;
      const k = clamp01((t - w.start + .12) / .3);
      g.globalAlpha = ease.out(k) * (1 - fade);
      g.shadowColor = 'rgba(0,0,0,.6)'; g.shadowBlur = 12;
      g.fillStyle = color; g.fillText(w.w, xx, y + (1 - ease.out(k)) * 10);
      xx += ww + sp;
    }
    g.globalAlpha = 1;
  }

  // MONO: terminal-ish chyron, typed on.
  mono(text, t, t0, { x = 64, y = 80, size = 22, color = 'rgba(255,241,220,.85)', cps = 40, out = null } = {}) {
    const g = this.g;
    g.font = `500 ${size}px JBM`; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
    const n = Math.floor(clamp01((t - t0) * cps / text.length) * text.length);
    const fade = out ? clamp01((t - out) / .3) : 0;
    g.globalAlpha = 1 - fade; g.shadowBlur = 0; g.fillStyle = color;
    g.fillText(text.slice(0, n) + ((Math.floor(t * 2) % 2 === 0 && n < text.length + 1) ? '▍' : ''), x, y);
    g.globalAlpha = 1;
  }
}

// extra styles ---------------------------------------------------------------------------------------------
TypeLayer.prototype.slam = function (text, t, t0, t1, { x = 960, y = 600, size = 260, font = 'ARCH', wght = 900, color = '#FFF1DC', glow = '#FFC46B',
  align = 'center', stretch = 'expanded', outline = false, tracking = 0 } = {}) {
  if (t < t0 - .02 || t > t1 + .25) return;
  const g = this.g, k = clamp01((t - t0 + .02) / .14), o = clamp01((t - t1) / .25);
  g.save(); g.globalAlpha = Math.min(1, k * 1.5) * (1 - o);
  g.font = `${wght} ${size}px ${font}`; g.fontStretch = stretch; g.textAlign = align; g.textBaseline = 'middle';
  if (tracking) g.letterSpacing = `${tracking}px`;
  const s = 1.18 - .18 * ease.outExpo(k) + .03 * (t - t0);
  g.translate(x, y); g.scale(s, s);
  g.shadowColor = glow; g.shadowBlur = 26 * Math.exp(-(t - t0) * 3);
  if (outline) { g.lineWidth = 3; g.strokeStyle = color; g.strokeText(text, 0, 0); } else { g.fillStyle = color; g.fillText(text, 0, 0); }
  g.restore();
};
TypeLayer.prototype.chyron = function (text, t, t0, t1, lane = '#FF7A1A', { x = 64, y = 1010, size = 24 } = {}) {
  if (t < t0 || t > t1) return;
  const g = this.g; const n = Math.floor(clamp01((t - t0) * 40 / text.length) * text.length);
  g.save(); g.globalAlpha = 1 - clamp01((t - t1 + .15) / .15);
  g.fillStyle = lane; g.beginPath(); g.arc(x + 9, y - 8, 7, 0, Math.PI * 2); g.fill();
  g.font = `600 ${size}px JBM`; g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.fillStyle = 'rgba(255,241,220,.92)';
  g.fillText(text.slice(0, n), x + 28, y);
  g.restore();
};
// center line: whole lyric line, words fade/rise in on their sung starts
TypeLayer.prototype.line = function (words, t, { x = 960, y = 930, size = 64, font = 'ISI', wght = 400, color = '#FFF1DC', out = null, upper = false, align = 'center' } = {}) {
  const g = this.g; g.save();
  g.font = `${wght} ${size}px ${font}`; g.textBaseline = 'alphabetic'; g.textAlign = 'left';
  const W = words.map((w) => g.measureText(upper ? w.w.toUpperCase() : w.w).width), sp = g.measureText(' ').width;
  const tot = W.reduce((a, b) => a + b, 0) + sp * (words.length - 1);
  let xx = align === 'center' ? x - tot / 2 : x;
  const fade = out ? clamp01((t - out) / .35) : 0;
  words.forEach((w, i) => {
    const k = clamp01((t - w.start + .1) / .28);
    g.globalAlpha = ease.out(k) * (1 - fade); g.shadowColor = 'rgba(0,0,0,.65)'; g.shadowBlur = 14; g.fillStyle = color;
    g.fillText(upper ? w.w.toUpperCase() : w.w, xx, y + (1 - ease.out(k)) * 12); xx += W[i] + sp;
  });
  g.restore();
};
