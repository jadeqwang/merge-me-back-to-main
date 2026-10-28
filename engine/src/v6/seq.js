// Frame sequences for v6 footage slots: a directory with meta.json { fps, n, w, h, s0?, take, kind } and frames 000000.jpg ...
// (tools/footage/prep.py writes Jade's phone clips to work/footage/<take>/, tools/footage/standins.py writes stand-ins to work/standin/<ID>/).
// s0 = the song time of the clip's frame 0 (from the audio sync), so a sung take plays in sync with clip time c = t - s0.
// Takes are never looped: a clock outside the clip holds its first / last frame.
const cache = new Map();   // url -> Promise<ImageBitmap>
function bitmap(url) {
  if (!cache.has(url)) {
    cache.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error('404 ' + url); return r.blob(); })
      .then((b) => createImageBitmap(b, { premultiplyAlpha: 'none', colorSpaceConversion: 'none' })));
    if (cache.size > 1200) cache.delete(cache.keys().next().value);
  }
  return cache.get(url);
}

export class FrameSeq {
  static async open(base) {
    const r = await fetch(`${base}/meta.json`); if (!r.ok) throw new Error('no sequence ' + base);
    const s = new FrameSeq(); s.base = base; s.meta = await r.json(); s.dur = (s.meta.n - 1) / s.meta.fps; return s;
  }
  index(c) { return Math.max(0, Math.min(this.meta.n - 1, Math.round(c * this.meta.fps))); }
  // the frame at clip time c (s); prefetches the next few
  async at(c) {
    const i = this.index(c);
    for (let k = 1; k <= 3; k++) bitmap(this.url(Math.min(this.meta.n - 1, i + k))).catch(() => {});
    return bitmap(this.url(i));
  }
  url(i) { return `${this.base}/${String(i).padStart(6, '0')}.jpg`; }
}

// slot sources: Jade's footage (work/footage/index.json, written by tools/footage/sync.py + prep.py) wins over a stand-in
// (work/standin/index.json, tools/footage/standins.py); with neither, the slot draws its labelled card.
const j = (u) => fetch(u).then((r) => (r.ok ? r.json() : {})).catch(() => ({}));
let IDX = null;
export async function indexes() { if (!IDX) IDX = Promise.all([j('/work/footage/index.json'), j('/work/standin/index.json')]).then(([footage, standin]) => ({ footage, standin })); return IDX; }
export async function openSlot(id) {
  const { footage, standin } = await indexes();
  for (const [kind, ix] of [['footage', footage], ['standin', standin]]) {
    const e = ix[id]; if (!e) continue;
    try { const seq = await FrameSeq.open(e.dir); return { kind, seq, s0: e.s0 ?? seq.meta.s0 ?? null, take: e.take || seq.meta.take, entry: e }; } catch (_) { /* fall through */ }
  }
  return { kind: 'card', seq: null };
}
