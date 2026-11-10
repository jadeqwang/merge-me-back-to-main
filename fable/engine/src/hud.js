// HUD: one layer, top-left, JetBrains Mono 30 px semibold at 1080p (NOTES_v1 Global; SPEC §3 said 26):  ● jade/<branch>  <7-hex>  ctx ▮▮▮▯▯   [1,024 branches]
// desc: { branch:'main', color:'#FF7A1A', hash?: string (default: ticks on every bar line), ctx?: 0..1, count?: number, ink?: 0..1, alpha?: 0..1 }
export class Hud {
  constructor(W, H) { this.W = W; this.H = H; this.c = document.createElement('canvas'); this.c.width = W; this.c.height = H; this.g = this.c.getContext('2d'); }
  clear() { this.g.clearRect(0, 0, this.W, this.H); return this.c; }
  draw(d, t, engine) {
    const g = this.g, s = this.H / 1080, fs = (d.px ?? 30) * s; g.clearRect(0, 0, this.W, this.H);
    const a = d.alpha ?? 1; if (a <= 0) return this.c;
    const ink = d.ink ?? 0; const fg = ink > 0.5 ? `rgba(20,18,43,${0.92 * a})` : `rgba(255,241,214,${0.92 * a})`; const dim = ink > 0.5 ? `rgba(20,18,43,${0.55 * a})` : `rgba(255,241,214,${0.55 * a})`;
    g.font = `600 ${fs}px "JetBrains Mono"`; g.textBaseline = 'middle'; g.shadowColor = ink > 0.5 ? 'rgba(255,243,220,0.55)' : 'rgba(5,6,26,0.6)'; g.shadowBlur = 6 * s;      // a soft plate of the sky's own colour so it reads over lights
    let x = 56 * s; const y = 64 * s;
    g.fillStyle = d.color || '#FF7A1A'; g.globalAlpha = a; g.beginPath(); g.arc(x + 9 * s, y, 9 * s, 0, 6.2832); g.fill(); g.globalAlpha = 1; x += 34 * s;
    const put = (txt, col) => { g.fillStyle = col; g.fillText(txt, x, y + 1 * s); x += g.measureText(txt).width; };
    put(d.branch || 'main', fg); x += 28 * s;
    put(d.hash || engine.hashAt(t), dim); x += 28 * s;
    if (d.ctx !== undefined) {
      put('ctx', dim); x += 15 * s; const n = 5, cw = 11 * s, ch = 23 * s, gap = 6 * s; const fill = Math.min(1, Math.max(0, d.ctx)) * n;
      for (let i = 0; i < n; i++) { const f = Math.min(1, Math.max(0, fill - i)); g.fillStyle = ink > 0.5 ? `rgba(20,18,43,${0.22 * a})` : `rgba(255,241,214,${0.22 * a})`; g.fillRect(x, y - ch / 2, cw, ch); if (f > 0) { g.fillStyle = fg; g.fillRect(x, y + ch / 2 - ch * f, cw, ch * f); } x += cw + gap; }
      x += 10 * s; put(Math.round(Math.min(1, d.ctx) * 100) + '%', dim); x += 28 * s;
    }
    if (d.count !== undefined) put(Math.round(d.count).toLocaleString('en-US') + (Math.round(d.count) === 1 ? ' branch' : ' branches'), fg);
    g.shadowBlur = 0; g.shadowColor = 'transparent';
    return this.c;
  }
}
