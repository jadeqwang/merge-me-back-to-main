// Take clocks: pure helpers shared by plateseq.js, the scenes and the cloud EDL harness (no three.js here, so node can import it).
// A prepped plate has meta.n frames at meta.fps; clip time c shows frame round(c * fps), clamped to the take, so a clock past last(meta) holds
// the take's last frame (a freeze) and one below 0 holds its first. Takes are never looped or ping-ponged (Jade, 2026-10-25).
export const last = (meta) => (meta.n - 1) / meta.fps;
// fit = { from, to } (song times): a real-time clock c (c = t - s0) that would run off the take before `to` is slowed from `from` on, at one
// constant rate, never faster than real time, so the last frame lands on `to`. Before `from` (and whenever the take is long enough) it is
// untouched, so a longer re-take plays at real speed by itself. Not for lip-synced takes: those are trimmed in the EDL instead.
export function fit(c, t, f, end) {
  if (!f || t <= f.from || !(f.to > f.from)) return c;
  const c0 = c - (t - f.from), r = Math.max(0, Math.min(1, (end - c0) / (f.to - f.from)));
  return c0 + (t - f.from) * r;
}
// the fork tree's copy clocks run `step` s apart (k * step, k = 0..n-1): as far apart as the take allows over the shot (at most `max`), so the
// latest clock reaches the take's last frame on the cut at the earliest. c0 = the first clock's clip time on the cut, len = the shot's length.
export const spread = (end, c0, len, n = 4, max = 1.7) => Math.max(0, Math.min(max, (end - c0 - len) / (n - 1)));
