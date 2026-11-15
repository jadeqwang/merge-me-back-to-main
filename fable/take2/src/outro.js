// MERGE take two, Step 5: code-drawn shots of chorus 2 and the outro (kind 'code' in shots.js):
//   fold      b130-131  night_jade with patchwork2's figure showing through twelve patches, one more per beat
//   town      b139-142  white paper, pencil hills, the twelve cut-out facades along the road (main's written lane, dense), chips; optional
//                       runner (day_run's cut-out) in front
//   aerial    b147-148  the road from above, the town as small cut-outs, the new forks as pencil lines; pull-back
//   graph     b149-152  the whole film as one git graph on white paper; the violet branch leaves, its dot, a dotted arc forward to main
//   terminal  b153-156  the real `git log --graph` of this branch (fable/take2/data/gitlog.json), then $ git checkout main / $ git merge on beats
//   credits   b157-161  credits as commits (placeholder wording, see notes)
// plus forks(): pencil branches continuing the day_fork plate's tree. Everything is a pure function of song time.
export function makeOutro(E) {
  const { g, W, H, S, T, READY, LIVES, byId, MAIN, hashOf, drawWrittenLane, laneString, clamp01, lerp, ease, plateToScreen, cover, bposT, glowAt, hexA, json } = E;
  const PAPERW = '#F3EFE6', INKP = '#3A3632', mono = (px, wt = 600) => `${wt} ${px}px "JetBrains Mono"`;
  const rnd = (a) => { let x = a | 0; return () => { x = (x + 0x6d2b79f5) | 0; let t = Math.imul(x ^ (x >>> 15), 1 | x); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const st = {};   // loaded data: facades {id: {url, bbox}}, mattes, gitlog, day_run
  // alpha bbox of an image (fractions), computed once
  function bboxOf(img) { const c = document.createElement('canvas'), w = 320, h = Math.round(320 * img.height / img.width); c.width = w; c.height = h; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0, w, h);
    const d = x.getImageData(0, 0, w, h).data; let x0 = w, y0 = h, x1 = 0, y1 = 0; for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) if (d[(j * w + i) * 4 + 3] > 128) { x0 = Math.min(x0, i); x1 = Math.max(x1, i); y0 = Math.min(y0, j); y1 = Math.max(y1, j); }
    return { x0: x0 / w, y0: y0 / h, x1: (x1 + 1) / w, y1: (y1 + 1) / h }; }
  async function bmp(u) { const r = await fetch(u); if (!r.ok) return null; return createImageBitmap(await r.blob()); }
  async function load(shots) {
    for (const s of shots) { const o = s.opt || {};
      if ((o.code === 'town' || o.code === 'aerial') && !st.facades) { st.facades = {};
        // film v3: the new facade cut-outs (kit/facade_<id>_v2: real places, parenthood a cut-away living room) when they exist
        // film v4: _v3 first (facade_wetlab_v3: Bio-X, the Clark Center, very wide: laid out as a v2, up to 0.42 W wide)
        for (const id of o.lives) for (const v of ['_v3', '_v2', '']) { const u = `/work_fable/take2/kit/facade_${id}${v}/rgba/f_0001.png`, b = await bmp(u); if (b) { st.facades[id] = { url: u, img: b, bb: bboxOf(b), v2: v !== '' }; break; } } }
      if (o.code === 'fold' && !st.fold) { st.fold = {}; for (const k of ['night_jade', 'patchwork2']) { const b = await bmp(`${o.mattes[k]}/rgba/f_0001.png`); if (b) st.fold[k] = { img: b, bb: bboxOf(b) }; } }
      if (o.code === 'terminal' && !st.log) { const j = await json('/fable/take2/data/gitlog.json'); st.log = j ? j.lines : null; }
      if (o.runner && !st.run) { const m = await json(`${o.runner.dir}/meta.json`); st.run = m && m.n ? m : null; } }
  }
  const ok = (s) => { const o = s.opt; if (o.code === 'town' || o.code === 'aerial') return st.facades && Object.keys(st.facades).length >= 6 && (!o.runner || !!st.run);
    if (o.code === 'fold') return st.fold && st.fold.night_jade && st.fold.patchwork2 && E.PLATE.night_jade && E.PLATE.patchwork2; if (o.code === 'terminal') return !!st.log; return true; };
  // film v4 item 4: the runner's frame. R.t0: seconds of the run already gone at the shot start (b141 continues b139's run: same stride
  // phase across the cut). R.foot: her standing foot's travel in plate px per clip frame (tools/feet.py on the cut-out); the clip rate is
  // set so that foot moves exactly with the road under it (rate = road px/s / (foot px/s at her drawn scale)): no sliding. R.loop
  // [a, b] (1-based frames, frame b looks like frame a): the run is played from a and cycles a..b-1.
  function runFrame(s, t) { const R = s.opt.runner, m = st.run, v = s.opt.speed * S, q = (R.h * H) / (m.h || 720);
    const rate = R.foot ? v / (R.foot * m.fps * q) : 1, c = Math.max(0, t - s.t0 + (R.t0 || 0)) * rate;
    if (!R.loop) return Math.min(m.n - 1, Math.round(c * m.fps));
    const [a, b] = R.loop, P = b - a; return a - 1 + (Math.round(c * m.fps) % P); }
  // urls a shot needs at t (the harness preloads them into READY)
  function need(s, t) { const o = s.opt, out = [];
    if (o.code === 'town' || o.code === 'aerial') for (const id of o.lives) if (st.facades[id]) out.push(st.facades[id].url);
    if (o.runner && st.run) out.push(`${o.runner.dir}/rgba/f_${String(runFrame(s, t) + 1).padStart(4, '0')}.png`);
    if (o.code === 'fold') out.push(`${E.PLATE.night_jade.dir}/still.jpg`, `${E.PLATE.patchwork2.dir}/still.jpg`, `${o.mattes.patchwork2}/rgba/f_0001.png`);
    return out; }

  // ---------------------------------------------------------------- fold (b130-131)
  let CELLS = null, FC = null, UC = null;
  function cells(bb) {   // twelve patches: nearest-seed cells over the figure box (3 x 4 jittered grid), each a soft mask canvas at frame size / 4
    if (CELLS) return CELLS; const r = rnd(4242), w = W / 4 | 0, h = H / 4 | 0, sx = [];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 3; i++) sx.push({ x: (bb.x0 + (bb.x1 - bb.x0) * (i + 0.2 + 0.6 * r()) / 3) * w, y: (bb.y0 + (bb.y1 - bb.y0) * (j + 0.2 + 0.6 * r()) / 4) * h });
    CELLS = sx.map((q, k) => { const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); const im = x.createImageData(w, h);
      for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { let best = 1e9, bk = -1; for (let m = 0; m < sx.length; m++) { const d = (i - sx[m].x) ** 2 + (j - sx[m].y) ** 2; if (d < best) { best = d; bk = m; } } if (bk === k) im.data[(j * w + i) * 4 + 3] = 255; }
      x.putImageData(im, 0, 0); return c; });
    return CELLS; }
  function fold(t, s) {
    const o = s.opt, base = READY.get(`${E.PLATE.night_jade.dir}/still.jpg`), top = READY.get(`${E.PLATE.patchwork2.dir}/still.jpg`), mt = READY.get(`${o.mattes.patchwork2}/rgba/f_0001.png`);
    const u = seg(t, s.t0, s.t1), zoom = 1 + 0.03 * ease.io(u);
    const cb = cover(base.width, base.height, W, H, zoom, 0.5, 0.45); g.drawImage(base, cb.sx, cb.sy, cb.sw, cb.sh, 0, 0, W, H);
    // align patchwork2's figure box onto night_jade's (both mattes are of the full stills, cover-fitted the same way)
    const bn = st.fold.night_jade.bb, bp = st.fold.patchwork2.bb, sc = (bn.y1 - bn.y0) / (bp.y1 - bp.y0);
    const ax = (bn.x0 + bn.x1) / 2, ay = bn.y0, px = (bp.x0 + bp.x1) / 2, py = bp.y0;
    const zx = (v) => W / 2 + (v * W - W / 2) * zoom, zy = (v) => H * 0.45 + (v * H - H * 0.45) * zoom;   // the push, about the cover focus
    if (!FC) { FC = document.createElement('canvas'); FC.width = W; FC.height = H; UC = document.createElement('canvas'); UC.width = W / 4 | 0; UC.height = H / 4 | 0; }
    const fc = FC.getContext('2d'); fc.setTransform(1, 0, 0, 1, 0, 0); fc.globalCompositeOperation = 'source-over'; fc.clearRect(0, 0, W, H);
    // patchwork2 placed so its box top-centre lands on night_jade's, scaled by the box heights
    const tx = (v) => (ax + (v - px) * sc), ty = (v) => (ay + (v - py) * sc), ct = cover(top.width, top.height, W, H), cm = cover(mt.width, mt.height, W, H);
    const dx0 = zx(tx(0)), dy0 = zy(ty(0)), dw = zx(tx(1)) - dx0, dh = zy(ty(1)) - dy0;
    fc.drawImage(top, ct.sx, ct.sy, ct.sw, ct.sh, dx0, dy0, dw, dh); fc.globalCompositeOperation = 'destination-in'; fc.drawImage(mt, cm.sx, cm.sy, cm.sw, cm.sh, dx0, dy0, dw, dh);
    const C = cells({ x0: tx(bp.x0), y0: ty(bp.y0), x1: tx(bp.x1), y1: ty(bp.y1) }), ub = bposT(t) - Math.round(bposT(s.t0));
    const uc = UC.getContext('2d'); uc.clearRect(0, 0, UC.width, UC.height); let newest = -1, nb = 0;
    o.beats.forEach((b, k) => { if (ub >= b) { uc.drawImage(C[k], 0, 0); newest = k; nb = b; } });
    fc.save(); fc.setTransform(zoom, 0, 0, zoom, W / 2 * (1 - zoom), H * 0.45 * (1 - zoom)); fc.imageSmoothingEnabled = true; fc.drawImage(UC, 0, 0, W, H); fc.restore();
    g.drawImage(FC, 0, 0);
    if (newest >= 0) { const f = clamp01((ub - nb) / 0.5); if (f < 1) {   // the new patch flashes its life's colour
      const col = LIVES[newest].color; fc.globalCompositeOperation = 'source-over'; fc.setTransform(1, 0, 0, 1, 0, 0); fc.clearRect(0, 0, W, H);
      fc.save(); fc.setTransform(zoom, 0, 0, zoom, W / 2 * (1 - zoom), H * 0.45 * (1 - zoom)); fc.drawImage(C[newest], 0, 0, W, H); fc.restore();
      fc.globalCompositeOperation = 'destination-in'; fc.drawImage(mt, cm.sx, cm.sy, cm.sw, cm.sh, dx0, dy0, dw, dh);
      fc.globalCompositeOperation = 'source-in'; fc.fillStyle = col; fc.fillRect(0, 0, W, H);
      g.save(); g.globalAlpha = 0.55 * (1 - f); g.shadowColor = col; g.shadowBlur = 30 * S; g.drawImage(FC, 0, 0); g.restore(); } }
  }
  const seg = (t, a, b) => clamp01((t - a) / (b - a));

  // ---------------------------------------------------------------- town (b139-142)
  let LAY = null;
  function townLayout(o) { if (LAY) return LAY; const sp = o.spacing * W, q = [], c = []; let acc = 0, prev = null;
    o.lives.forEach((id, k) => { const F = st.facades[id]; let slot = sp;
      if (F) { const bw = (F.bb.x1 - F.bb.x0) * F.img.width, bh = (F.bb.y1 - F.bb.y0) * F.img.height, s1 = Math.min((0.4 * H) / bh, ((F.v2 ? 0.42 : 0.25) * W) / bw); q[k] = { bw, bh, q: s1 }; slot = Math.max(sp, bw * s1 + 0.05 * W); }
      acc += prev === null ? 0 : (prev + slot) / 2; c[k] = acc; prev = slot; });
    LAY = { q, c, ratio: (acc / Math.max(1, o.lives.length - 1)) / sp }; return LAY; }
  function pencilLine(pts, w = 1.6, a = 0.55, col = INKP) { g.save(); g.strokeStyle = col; g.globalAlpha = a; g.lineWidth = w * S; g.lineCap = 'round'; g.lineJoin = 'round'; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.stroke(); g.restore(); }
  function hills(off, y0, amp, seed, a) { for (let pass = 0; pass < 2; pass++) { const pts = []; for (let x = -40; x <= W + 40; x += 18 * S) { const wx = x + off; pts.push({ x, y: y0 + amp * (Math.sin(wx * 0.0021 + seed) * 0.6 + Math.sin(wx * 0.0057 + seed * 2) * 0.3) + pass * 2 * S }); } pencilLine(pts, 1.4, a * (pass ? 0.5 : 1)); } }
  function chipAt(x, y, L) { g.save(); g.font = mono(26 * S, 600); const tw = g.measureText(L.branch).width, pad = 10 * S, h = 40 * S, d = 8 * S, w = tw + 2 * pad + 2 * d + 10 * S;
    g.fillStyle = 'rgba(243,239,230,0.92)'; g.strokeStyle = hexA(L.color, 0.9); g.lineWidth = 2 * S; g.beginPath(); g.roundRect(x - w / 2, y, w, h, 4 * S); g.fill(); g.stroke();
    g.fillStyle = L.color; g.beginPath(); g.arc(x - w / 2 + pad + d, y + h / 2, d, 0, 6.2832); g.fill(); g.fillStyle = INKP; g.fillText(L.branch, x - w / 2 + pad + 2 * d + 10 * S, y + h / 2 + 9 * S); g.restore(); }
  // film v2: the world slides RIGHT (day_run faces frame left: Jade saw her "running the opposite direction to how the buildings are
  // moving"). o.dir = +1 world to the right (default), -1 the v1 travel. The lives still pass in life order (piano first, entering from
  // the left), the road text still reads left to right (it scrolls right with the ground), hills follow with parallax.
  function town(t, s) {
    const o = s.opt, dir = o.dir === undefined ? 1 : o.dir, v = o.speed * S, tt = (t - s.t0) + (o.x0 || 0), scroll = v * tt, roadY = 0.86 * H, baseY = 0.74 * H, sp = o.spacing * W;
    g.fillStyle = PAPERW; g.fillRect(0, 0, W, H);
    hills(-dir * scroll * 0.18, 0.42 * H, 40 * S, 1.3, 0.35); hills(-dir * scroll * 0.32, 0.5 * H, 26 * S, 4.1, 0.45);
    // the facades along the road. film v3: a v2 facade may be wider (up to 0.42 W: Hangar One, the cut-away living room), and every facade
    // gets a slot of max(spacing, its width + 0.05 W); the slots are laid end to end (with the v1 facades all slots equal the spacing, so
    // the v1 layout is unchanged) and the travel speed scales with the total so the twelve still pass in the same time
    const lay = townLayout(o), vs = lay.ratio, chips = [];
    o.lives.forEach((id, k) => { const F = st.facades[id]; if (!F) return; const L = byId[id], bb = F.bb, img = F.img, Q = lay.q[k];
      const bw = Q.bw, bh = Q.bh, q = Q.q, sc2 = scroll * vs,
        cx = dir > 0 ? 0.22 * W - lay.c[k] + sc2 : 0.78 * W + lay.c[k] - sc2;
      if (cx < -0.4 * W || cx > 1.4 * W) return;
      g.drawImage(img, bb.x0 * img.width, bb.y0 * img.height, bw, bh, cx - bw * q / 2, baseY - bh * q, bw * q, bh * q);
      pencilLine([{ x: cx - bw * q / 2 - 20 * S, y: baseY + 1 }, { x: cx + bw * q / 2 + 20 * S, y: baseY + 2 }], 1.4, 0.5);
      chips.push([cx, baseY + 14 * S, L]); });
    // film v4: the chips are drawn after the runner (over her legs as they pass), so she never covers a branch name
    if (!o.runner) chips.forEach((c) => chipAt(...c));
    // the road: main written dense (she is merged), scrolling with the ground (the path starts off-frame: a negative scroll leaves up to
    // one glyph cell empty at the path's start)
    const adv = 26 * S / 0.73 * 0.6, x0r = -3 * adv;
    drawWrittenLane(g, [{ x: x0r, y: roadY }, { x: W, y: roadY }], { text: laneString(['merge me back to main', ...LIVES.map((l) => l.msg)], true), color: MAIN, cap: 26 * S, merge: 0.82, under: 0, scroll: dir * -(scroll / adv) });
    if (o.runner && st.run) { const R = o.runner, f = runFrame(s, t), img = READY.get(`${R.dir}/rgba/f_${String(f + 1).padStart(4, '0')}.png`);
      if (img) { const h = R.h * H, q = h / img.height, w = img.width * q, e = R.edge || 0;   // edge: the outer margin of the cut-out is dropped (stray specks)
        g.drawImage(img, e * img.width, e * img.height, img.width * (1 - 2 * e), img.height * (1 - 2 * e), R.x * W - w / 2 + e * w, R.y * H - h + e * h, w * (1 - 2 * e), h * (1 - 2 * e)); }
      chips.forEach((c) => chipAt(...c)); }
  }
  // ---------------------------------------------------------------- aerial (b147-148)
  function aerial(t, s) {
    const o = s.opt, u = ease.io(seg(t, s.t0, s.t1)), z = lerp(1.5, 0.62, u), cx = W * 0.5, cy = H * 0.5, P = (x, y) => ({ x: cx + (x - cx) * z, y: cy + (y - cy) * z });
    g.fillStyle = PAPERW; g.fillRect(0, 0, W, H);
    const y0 = H * 0.55, a = P(-W, y0), b = P(W * 1.15, y0);
    drawWrittenLane(g, [a, b], { text: laneString(['merge me back to main'], true), color: MAIN, cap: 16 * S * z, merge: 0.85, under: 0, scroll: -t * 4 });
    o.lives.forEach((id, k) => { const F = st.facades[id]; if (!F) return; const bb = F.bb, img = F.img, bw = (bb.x1 - bb.x0) * img.width, bh = (bb.y1 - bb.y0) * img.height;
      const side = k % 2 ? 1 : -1, wx = -0.6 * W + k * 0.13 * W, wy = y0 + side * 0.09 * H, q = (0.11 * H * z) / bh, p = P(wx, wy);
      g.drawImage(img, bb.x0 * img.width, bb.y0 * img.height, bw, bh, p.x - bw * q / 2, p.y - bh * q / 2, bw * q, bh * q); });
    // the new forks: bare pencil lines from the road's end, branching
    const end = P(W * 1.15, y0), r = rnd(77); const grow = clamp01(seg(t, s.t0, s.t1) * 1.4);
    const br = (p, ang, len, d) => { if (d > 5) return; const q = { x: p.x + Math.cos(ang) * len * z * grow, y: p.y + Math.sin(ang) * len * z * grow }; pencilLine([p, q], 1.4, 0.6); br(q, ang - 0.35 - 0.2 * r(), len * 0.72, d + 1); br(q, ang + 0.35 + 0.2 * r(), len * 0.72, d + 1); };
    br(P(W * 0.95, y0), -0.5, 160 * S, 0); br(P(W * 0.95, y0), 0.5, 160 * S, 0); void end;
  }
  // ---------------------------------------------------------------- day_fork: pencil branches continuing the plate's tree
  function forks(t, s, im) {
    const u = ease.out(seg(t, s.t0, s.t1)), r = rnd(91), tips = [[0.12, 0.22], [0.2, 0.12], [0.3, 0.07], [0.4, 0.06], [0.6, 0.06], [0.7, 0.07], [0.8, 0.12], [0.88, 0.22]];
    tips.forEach(([x, y], k) => { const p0 = plateToScreen(im, x, y), ang = Math.atan2(y - 0.55, x - 0.5);
      const br = (p, a, len, d, del) => { const gr = clamp01((u - del) / 0.35); if (gr <= 0 || d > 4) return; const q = { x: p.x + Math.cos(a) * len * gr, y: p.y + Math.sin(a) * len * gr };
        pencilLine([p, q], 1.3, 0.55); if (gr >= 1) { br(q, a - 0.3 - 0.25 * r(), len * 0.7, d + 1, del + 0.12); br(q, a + 0.3 + 0.25 * r(), len * 0.7, d + 1, del + 0.12); } };
      br(p0, ang, (90 + 50 * r()) * S, 0, 0.05 * k); });
  }
  // ---------------------------------------------------------------- graph (b149-152)
  function graph(t, s) {
    g.fillStyle = PAPERW; g.fillRect(0, 0, W, H);
    const ub = bposT(t) - Math.round(bposT(s.t0)), rev = clamp01(ub / 8), my = 0.82 * H, X = (f) => (0.05 + 0.9 * f) * W, lw = 5 * S;
    const lives = LIVES.filter((l) => l.id !== 'violet'), sw = X(rev);
    g.save(); g.beginPath(); g.rect(0, 0, sw, H); g.clip();
    // main
    g.strokeStyle = MAIN; g.lineWidth = 7 * S; g.lineCap = 'round'; g.beginPath(); g.moveTo(X(0), my); g.lineTo(X(1), my); g.stroke();
    g.font = mono(30 * S, 700); g.fillStyle = MAIN; g.fillText('main', X(0), my + 50 * S);
    lives.forEach((L, i) => { const y = my - (60 + 46 * (lives.length - 1 - i)) * S, xa = X(0.06 + 0.022 * i), xm = X(0.6 + 0.008 * i), r = 40 * S;
      g.strokeStyle = L.color; g.lineWidth = lw; g.beginPath(); g.moveTo(xa, my); g.bezierCurveTo(xa + r, my, xa, y, xa + r, y); g.lineTo(xm - r, y); g.bezierCurveTo(xm, y, xm - r, my, xm, my); g.stroke();
      g.font = mono(28 * S, 600); g.fillStyle = L.color; g.fillText(L.branch, X(0.33), y - 10 * S);
      g.fillStyle = PAPERW; g.strokeStyle = L.color; g.lineWidth = 4 * S; g.beginPath(); g.arc(xm, my, 9 * S, 0, 6.2832); g.fill(); g.stroke(); });
    g.restore();
    // the violet branch leaves (bar 3), its dot; the dotted arc forward to main (bar 4)
    const V = byId.violet, vy = my - (60 + 46 * lives.length) * S, xv = X(0.7), xd = X(0.82), xc = X(0.94);
    const k1 = clamp01((ub - 8) / 3), k2 = clamp01((ub - 11) / 3.5);
    if (ub >= 7.5) { const xe = lerp(xv, xd, ease.out(k1)); g.strokeStyle = V.color; g.lineWidth = lw; g.beginPath(); g.moveTo(xv, my); g.bezierCurveTo(xv + 40 * S, my, xv, vy, xv + 40 * S, vy); g.lineTo(Math.max(xv + 40 * S, xe), vy); g.stroke();
      g.font = mono(28 * S, 600); g.fillStyle = V.color; g.fillText(V.branch, xv + 50 * S, vy - 14 * S);
      if (k1 >= 1) { g.fillStyle = V.color; g.beginPath(); g.arc(xd, vy, 12 * S, 0, 6.2832); g.fill(); } }
    if (k2 > 0) { g.save(); g.setLineDash([10 * S, 12 * S]); g.strokeStyle = V.color; g.lineWidth = 3.5 * S; g.beginPath(); const N = 40;
      for (let i = 0; i <= N * ease.io(k2); i++) { const q = i / N, x = lerp(xd, xc, q), y = lerp(vy, my, q) - Math.sin(q * Math.PI) * 120 * S; if (i) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke(); g.restore();
      g.save(); g.globalAlpha = clamp01(k2 * 2); g.font = mono(28 * S, 600); g.fillStyle = INKP; const lab = 'cherry-pick HANDOFF.md', tw = g.measureText(lab).width; g.fillText(lab, Math.min(W - 40 * S - tw, (xd + xc) / 2 - tw / 2), vy - 70 * S); g.restore();
      if (k2 >= 1) { g.fillStyle = PAPERW; g.strokeStyle = V.color; g.lineWidth = 4 * S; g.beginPath(); g.arc(xc, my, 11 * S, 0, 6.2832); g.fill(); g.stroke(); } }
  }
  // ---------------------------------------------------------------- terminal (b153-156)
  function term(t, s) {
    g.fillStyle = '#0B0C10'; g.fillRect(0, 0, W, H);
    const fpx = 34 * S, lh = 48 * S, ub = bposT(t) - Math.round(bposT(s.t0)), rows = Math.floor((H - 80 * S) / lh);
    g.font = mono(fpx, 500); g.textBaseline = 'alphabetic';
    const lines = [{ txt: '$ git log --graph --oneline fable/merge', col: '#9EF0B0' }];
    const nLog = Math.floor(clamp01(ub / 7.5) * st.log.length); for (let i = 0; i < nLog; i++) lines.push({ txt: st.log[i], log: true });
    if (ub >= 8) { const words = ['$ git', 'checkout', 'main']; const k = Math.min(3, Math.floor(ub - 8) + 1); lines.push({ txt: words.slice(0, k).join(' '), col: '#9EF0B0' }); if (ub >= 11) lines.push({ txt: "Switched to branch 'main'", col: '#E8E2D4' }); }
    if (ub >= 12) { const words = ['$ git', 'merge']; const k = Math.min(2, Math.floor(ub - 12) + 1); lines.push({ txt: words.slice(0, k).join(' ') + (Math.floor(ub * 2) % 2 ? ' _' : ''), col: '#9EF0B0' }); }
    const show = lines.slice(-rows); show.forEach((L, r) => { const y = 70 * S + (r + 1) * lh; let x = 60 * S;
      if (L.log) { const m = L.txt.match(/^([*|\\/ ]*)([0-9a-f]{7})? ?(.*)$/); if (m) { g.fillStyle = '#FF7A1A'; g.fillText(m[1], x, y); x += g.measureText(m[1]).width; if (m[2]) { g.fillStyle = '#FFD23F'; g.fillText(m[2] + ' ', x, y); x += g.measureText(m[2] + ' ').width; } g.fillStyle = '#E8E2D4'; g.fillText(m[3], x, y); return; } }
      g.fillStyle = L.col || '#E8E2D4'; g.fillText(L.txt, x, y); });
  }
  // ---------------------------------------------------------------- credits (b157-161)
  function credits(t, s) {
    g.fillStyle = '#0B0C10'; g.fillRect(0, 0, W, H);
    const o = s.opt, ub = bposT(t) - Math.round(bposT(s.t0)), fpx = 38 * S, lh = 74 * S, X0 = 160 * S, XR = W - 110 * S;
    g.font = mono(fpx, 600);
    // a message too wide for the frame wraps after its last comma (or space) that fits, continuing under itself (one commit per beat still)
    const rows = o.lines.map(([br, msg], i) => { const h = hashOf('credits/' + i), b = `(${br})`, xm = X0 + fpx * 1.2 + g.measureText(h + ' ').width + g.measureText(b + ' ').width;
      const parts = []; let rest = msg;
      while (xm + g.measureText(rest).width > XR) {
        const fits = [...rest.matchAll(/ /g)].map((m) => m.index).filter((k) => xm + g.measureText(rest.slice(0, k)).width <= XR);
        if (!fits.length) break; const commas = fits.filter((k) => rest[k - 1] === ','), cut = commas.length ? commas[commas.length - 1] : fits[fits.length - 1];
        parts.push(rest.slice(0, cut)); rest = rest.slice(cut + 1); }
      parts.push(rest); return { br, h, b, xm, parts }; });
    const nr = rows.reduce((a, r) => a + r.parts.length, 0); let y = (H - nr * lh) / 2 + lh * 0.7;
    rows.forEach((R, i) => { const a = clamp01((ub - i) / 0.5); if (a > 0) { let x = X0; g.save(); g.globalAlpha = a;
      g.fillStyle = '#FF7A1A'; g.fillText('*', x, y); x += fpx * 1.2; g.fillStyle = '#FFD23F'; g.fillText(R.h, x, y); x += g.measureText(R.h + ' ').width;
      const col = R.br === 'main' ? MAIN : '#9B6BFF'; g.fillStyle = col; g.fillText(R.b, x, y); g.fillStyle = '#F3EFE6';
      R.parts.forEach((p, k) => { if (k) { g.fillStyle = '#FF7A1A'; g.fillText('|', X0, y + k * lh); g.fillStyle = '#F3EFE6'; } g.fillText(p, R.xm, y + k * lh); }); g.restore(); }
      y += R.parts.length * lh; });
  }
  function draw(s, t, sc) { const c = s.opt.code; if (c === 'fold') fold(t, s); else if (c === 'town') town(t, s); else if (c === 'aerial') aerial(t, s); else if (c === 'graph') graph(t, s); else if (c === 'terminal') term(t, s); else if (c === 'credits') credits(t, s); }
  return { load, ok, need, draw, forks };
}
