// Song timing helpers over analysis*/timing.json (measured grid; never assume a fixed BPM).
// Timing source: page query ?timing=v1 (analysis/, "Merge Me Back to Main.wav", 284.8 s) or ?timing=v2 (analysis_v2/, "Merge.wav",
// 282.5 s, the revised song). Default = DEFAULT_TIMING.
export const DEFAULT_TIMING = 'v2';
export const SOURCES = { v1: '/analysis/timing.json', v2: '/analysis_v2/timing.json' };
const q = typeof location !== 'undefined' ? new URLSearchParams(location.search).get('timing') : null;
export const VERSION = SOURCES[q] ? q : DEFAULT_TIMING;
export let TIMING = null;
const cache = {};
export async function loadTimingVersion(v) { if (!cache[v]) cache[v] = (await fetch(SOURCES[v])).json(); return cache[v]; }
export async function loadTiming() { if (!TIMING) TIMING = await loadTimingVersion(VERSION); return TIMING; }
export const songEnd = () => TIMING.audio.duration_s;
export const bar = (n) => TIMING.bars[n - 1].start;                 // 1-based bar start (s)
export const barEnd = (n) => TIMING.bars[n - 1].end;
export const beatLen = (n = 1) => (TIMING.bars[n - 1].end - TIMING.bars[n - 1].start) / 4;   // one beat in bar n (s)
export const bb = (n, beats = 0) => bar(n) + beats * beatLen(n);    // bar n + beats (fractional ok)
export const beats = () => TIMING.beat_grid.beats.map((b) => (typeof b === 'number' ? b : b.t));
export function barAt(t) { const B = TIMING.bars; let lo = 0, hi = B.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (B[m].start <= t) lo = m; else hi = m - 1; } return lo + 1 + Math.max(0, Math.min(1, (t - B[lo].start) / (B[lo].end - B[lo].start))); }
// lyric line by its `id` (v1 numbering, kept in v2; v2 has no ids 14, 15, 26). Positional access: lineAt(i).
export const hasLine = (id) => TIMING.lyrics.lines.some((l) => l.id === id);
export function line(id) { const l = TIMING.lyrics.lines.find((x) => x.id === id); if (!l) throw new Error(`timing ${VERSION}: no lyric line id ${id}`); return l; }
export const lineAt = (i) => TIMING.lyrics.lines[i - 1];
export const words = (id) => line(id).words.map((w) => ({ w: w.w, start: w.start, end: w.end }));
// beat pulse: 1 at each beat, decaying with time constant k (s)
export function pulse(t, k = .12, every = 1) {
  const B = beats(); let lo = 0, hi = B.length - 1;
  while (lo < hi) { const m = (lo + hi + 1) >> 1; if (B[m] <= t) lo = m; else hi = m - 1; }
  let i = lo; while (i > 0 && i % every) i--;
  return t >= B[i] ? Math.exp(-(t - B[i]) / k) : 0;
}
