// Song time for take two (copied from fable/proof/src/timing.js; adds timingFrom() for node and T.duration). Reads a timing JSON (schema of analysis_v2/timing.json): bars[] {bar,start,end}, beat_grid.beat_times[],
// lyrics.lines[] {id, text, words[] {w,start,end}}. Every time the proof uses comes from here: bars and beats by index, words by time.
// Nothing assumes a tempo: beat(n, k) walks the measured beat list from the beat nearest bar n's downbeat (v3 drifts).
export async function loadTiming(url) { return timingFrom(await (await fetch(url)).json(), url); }
export function timingFrom(T, url = '') {
  const bars = T.bars.map((b) => b.start), barEnd = T.bars[T.bars.length - 1].end;
  const beats = T.beat_grid.beat_times;
  const nearestBeat = (t) => { let best = 0; for (let i = 1; i < beats.length; i++) if (Math.abs(beats[i] - t) < Math.abs(beats[best] - t)) best = i; return best; };
  const barStart = (n) => (n - 1 < bars.length ? bars[n - 1] : barEnd);
  const barBeat = new Map();
  const api = {
    raw: T, url, bars, beats, duration: (T.audio && T.audio.duration_s) || barEnd,
    bar: barStart,
    // index (into beat_times) of the downbeat of bar n
    barBeatIndex(n) { if (!barBeat.has(n)) barBeat.set(n, nearestBeat(barStart(n))); return barBeat.get(n); },
    // time of beat index i (fractional ok: linear between measured beats)
    beatT(i) { const k = Math.floor(i), f = i - k; const a = beats[Math.max(0, Math.min(beats.length - 1, k))]; if (f === 0) return a; const b = k + 1 < beats.length ? beats[k + 1] : a + (a - beats[k - 1]); return a + (b - a) * f; },
    // bar n, beat k (1-based; fractional ok: beat(37, 3) = bar 37 beat 3; beat(33, 1.5) = the off-beat after the downbeat)
    beat(n, k = 1) { return api.beatT(api.barBeatIndex(n) + (k - 1)); },
    // the lyric line whose text matches (case, punctuation and spacing ignored) -> {text, words:[{w,start,end}]}
    line(text) {
      const norm = (s) => s.toLowerCase().replace(/[^a-z0-9' ]/g, '').replace(/\s+/g, ' ').trim();
      const L = T.lyrics.lines.find((l) => norm(l.text || l.words.map((w) => w.w).join(' ')) === norm(text));
      if (!L) throw new Error(`timing ${url}: no lyric line "${text}"`);
      return { text: L.text, words: L.words.map((w) => ({ w: w.w.replace(/[,.;:!?…"“”]/g, ''), start: w.start, end: w.end })) };
    },
  };
  // sanity: the beat nearest each bar start should sit on it (logged, not fatal)
  let worst = 0; for (let n = 1; n < bars.length; n++) worst = Math.max(worst, Math.abs(beats[api.barBeatIndex(n)] - bars[n - 1]));
  api.barBeatWorst = worst;
  return api;
}
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const seg = (t, a, b) => clamp01((t - a) / (b - a));
export const ease = {
  io: (u) => u * u * (3 - 2 * u),
  io3: (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2),
  out: (u) => 1 - Math.pow(1 - u, 3),
  in: (u) => u * u * u,
  outBack: (u) => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(u - 1, 3) + c1 * Math.pow(u - 1, 2); },
};
