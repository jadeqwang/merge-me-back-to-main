// Song time. Loads analysis_v2/timing.json (measured grid; rule 4: cut on measured beats/bars/words).
export async function loadTiming(url = '/analysis_v2/timing.json') {
  const T = await (await fetch(url)).json();
  const bars = T.bars.map((b) => b.start);            // bars[n-1] = start of bar n
  const barEnd = T.bars[T.bars.length - 1].end;
  const beats = T.beat_grid.beat_times;
  const lines = new Map(T.lyrics.lines.map((l) => [l.id, l]));
  const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
  const api = {
    raw: T, duration: T.audio.duration_s, bpm: 138, bars, beats,
    // start time of bar n (1-based, fractional ok: bar(17.5) = half-way through bar 17)
    bar(n) { const i = Math.floor(n) - 1, f = n - Math.floor(n); const a = i < bars.length ? bars[clamp(i, 0, bars.length - 1)] : barEnd; const b = i + 1 < bars.length ? bars[i + 1] : barEnd; return a + (b - a) * f; },
    // bar n beat k (1..4, fractional ok)
    bb(n, k = 1) { return api.bar(n + (k - 1) / 4); },
    // fractional bar number at time t (1-based)
    barAt(t) { if (t <= bars[0]) return 1 + (t - bars[0]) / (bars[1] - bars[0]); let lo = 0, hi = bars.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (bars[m] <= t) lo = m; else hi = m - 1; } const a = bars[lo], b = lo + 1 < bars.length ? bars[lo + 1] : barEnd; return lo + 1 + (t - a) / (b - a); },
    // fractional beat index at time t (0-based over the whole song)
    beatAt(t) { if (t <= beats[0]) return (t - beats[0]) / (beats[1] - beats[0]); let lo = 0, hi = beats.length - 1; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (beats[m] <= t) lo = m; else hi = m - 1; } const a = beats[lo], b = lo + 1 < beats.length ? beats[lo + 1] : a + 60 / 138; return lo + (t - a) / (b - a); },
    beatTime(i) { const k = Math.floor(i), f = i - k; const a = beats[clamp(k, 0, beats.length - 1)], b = beats[clamp(k + 1, 0, beats.length - 1)]; return a + (b - a) * f; },
    // decaying pulse on every beat (or every `div` beats): 1 at the beat, exp decay
    pulse(t, { div = 1, decay = 6, phase = 0 } = {}) { const b = api.beatAt(t) / div - phase; const f = b - Math.floor(b); return Math.exp(-decay * f * div * (60 / 138)); },
    barPulse(t, decay = 3) { const b = api.barAt(t); return Math.exp(-decay * (b - Math.floor(b)) * (240 / 138)); },
    line(id) { return lines.get(id); },
    // words of lyric line `id`: [{w, start, end}]
    words(id) { const l = lines.get(id); return l ? l.words.map((w) => ({ w: w.w, start: w.start, end: w.end })) : []; },
    lines: T.lyrics.lines, sections: T.sections, events: T.events,
    section(t) { return T.sections.find((s) => t >= s.start && t < s.end) || T.sections[T.sections.length - 1]; },
  };
  return api;
}
// easing
export const clamp01 = (x) => Math.min(1, Math.max(0, x));
export const lerp = (a, b, u) => a + (b - a) * u;
export const smooth = (a, b, x) => { const u = clamp01((x - a) / (b - a)); return u * u * (3 - 2 * u); };
export const ease = { io: (u) => u * u * (3 - 2 * u), io5: (u) => u * u * u * (u * (u * 6 - 15) + 10), out: (u) => 1 - Math.pow(1 - u, 3), in: (u) => u * u * u, outExpo: (u) => (u >= 1 ? 1 : 1 - Math.pow(2, -10 * u)) };
