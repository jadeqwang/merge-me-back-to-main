// Seeded randomness. Everything in the film derives from these (rule 8: render(t) is pure).
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () { a |= 0; a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function hash1(n) { let x = Math.imul((n | 0) ^ 0x9E3779B9, 0x85EBCA6B); x ^= x >>> 13; x = Math.imul(x, 0xC2B2AE35); x ^= x >>> 16; return (x >>> 0) / 4294967296; }
export function hash2(a, b) { return hash1(Math.imul(a | 0, 73856093) ^ Math.imul(b | 0, 19349663)); }
export function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
const sm = (t) => t * t * (3 - 2 * t);
// smooth value noise, 1D and 2D, range [-1,1]
export function noise1(x, seed = 0) { const i = Math.floor(x), f = x - i; const a = hash2(i, seed), b = hash2(i + 1, seed); return (a + (b - a) * sm(f)) * 2 - 1; }
export function noise2(x, y, seed = 0) {
  const ix = Math.floor(x), iy = Math.floor(y), fx = sm(x - ix), fy = sm(y - iy);
  const h = (i, j) => hash2(i + seed * 131, j - seed * 71);
  const a = h(ix, iy), b = h(ix + 1, iy), c = h(ix, iy + 1), d = h(ix + 1, iy + 1);
  return (a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy) * 2 - 1;
}
export function fbm1(x, seed = 0, oct = 3) { let s = 0, a = 0.5, f = 1; for (let o = 0; o < oct; o++) { s += a * noise1(x * f, seed + o * 17); a *= 0.5; f *= 2; } return s; }
// 7-hex "commit hash" for any integer (the HUD hash ticks on every bar line)
export function hex7(n) { let s = ''; for (let i = 0; i < 7; i++) s += '0123456789abcdef'[Math.floor(hash2(n, i + 11) * 16)]; return s; }
export function halton(i, b) { let f = 1, r = 0; i += 1; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; }
