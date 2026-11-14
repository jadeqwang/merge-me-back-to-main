// MERGE take two: the runner kit (PLAN section 6, chorus 1 bars 43, 46-48). Cut-out runners (fable/take2/tools/matte.py ->
// work_fable/take2/kit/runner_<life>/rgba/f_%04d.png, straight alpha) on black paper, on written lanes (src/lanes.js).
// Per-runner data (head, cut, step period, strike frames) comes from fable/take2/kit.json (tools/kitstats.py).
//   shots.js kind 'kit', opt.kit.mode:
//     'row'   b43: every runner on her lane, far (small) to near (large), main in front; lanes = [{id, x}, ...] far -> near
//     'fuse'  b46-47: runners fuse in pairs on the beats (events [beat, laneA, laneB] in beats from the shot start): the two converge
//             in half a beat, the new runner is half one medium and half the other (split through the head) for one beat, then whole
//             in the first one's medium; their lanes join (git-merge curves that scroll away behind them) and the text gets denser
//     'one'   b48: main alone, the other mediums flickering across her (patches of other cut-outs inside her matte, one per sixteenth,
//             smaller and fainter through the bar; the last beat is clean cel)
// Unison: every runner's clip time is driven by the measured beat position, one step per beat, a strike frame on each beat:
//   frame = strike + (beat position - shot's first beat) * step, wrapped by whole strides inside the clip. Nearest frame.
// The open-source life (sandstorm) has no cut-out: it is main's cut-out through the glyph pass (real JetBrains Mono characters,
// her commit message), tinted in its lane colour, kept small and far (no glyph faces up close).
// Runners cut off at the knees or hips by their clip (kit.json cut = true) fade out over the bottom of the figure and stand behind
// a nearer lane's text or the frame edge, so no cut edge shows.
const VIS = { wushu: 0.55, phd: 0.75, poet: 0.75, ames: 0.75, band: 0.75, main: 0.97, violin: 0.97 };   // visible part of the full figure (head to cut)
const SRC = (id) => (id === 'sandstorm' ? 'main' : id);

export function makeKit(E) {
  const { g, W, H, S, T, KJ, READY, drawWrittenLane, laneString, glyphPass, byId, MAIN, clamp01, lerp, ease } = E;
  const col = (id) => (id === 'main' ? MAIN : byId[id].color);
  const msgs = (ids) => ids.map((id) => (id === 'main' ? 'merge me back to main' : byId[id].msg));
  const sstep = (u) => { u = clamp01(u); return u * u * (3 - 2 * u); };
  const B = T.beats;
  function bpos(t) { let lo = 0, hi = B.length - 1; if (t <= B[0]) return 0; while (lo < hi) { const m = (lo + hi + 1) >> 1; if (B[m] <= t) lo = m; else hi = m - 1; }
    return lo + (lo + 1 < B.length ? (t - B[lo]) / (B[lo + 1] - B[lo]) : 0); }
  const B0 = (s) => Math.round(bpos(s.t0));
  function frameOf(id, t, b0) {
    const k = KJ[SRC(id)], s0 = k.strikes[1], st = k.step, lim = k.n - 2, stride = 2 * st, room = stride * Math.max(1, Math.floor((lim - s0) / stride));
    let f = s0 + (bpos(t) - b0) * st; if (f > lim) f = s0 + ((f - s0) % room);
    return Math.max(0, Math.min(k.n - 1, Math.round(f)));
  }
  const url = (id, i) => `/${KJ[SRC(id)].dir.replace(/\/$/, '')}/rgba/f_${String(i + 1).padStart(4, '0')}.png`;
  // ---- geometry: lane index p (0 far .. n-1 near, fractional while two lanes converge)
  // depth p (0 far .. n-1 near, fractional while moving): f = (p / (n-1))^gamma; full-figure height lerp(hFar, hNear, f), the lane
  // (where the visible figure ends: feet, or the faded cut) at lerp(far, near, f); head top = lane - visible part of the figure.
  // So the front runners are large with their heads high (main in front: head near the top), the far ones small and low.
  function geo(o, n) { const gam = o.gamma ?? 2.4, far = (o.far ?? 0.5) * H, near = (o.near ?? 0.985) * H, hF = (o.hFar ?? 0.1) * H, hN = (o.hNear ?? 0.86) * H;
    const f = (p) => Math.pow(clamp01(p / Math.max(1, n - 1)), gam);
    const laneY = (p) => far + (near - far) * f(p), figH = (p) => hF + (hN - hF) * f(p);
    return { laneY: (p, id) => laneY(p), figH, headY: (p, id) => laneY(p) - (VIS[SRC(id)] || 1) * figH(p), cap: (p) => (6 + 30 * f(p)) * S, f }; }
  // ---- one runner: head top at (x, headY), full-figure height h; split = [idB, angle] draws idB right of a line through the head
  const OC = document.createElement('canvas'); OC.width = W; OC.height = H; const oc = OC.getContext('2d');
  const GA = document.createElement('canvas'), GB = document.createElement('canvas');
  function runner(id, t, b0, x, headY, h, o = {}) {
    const img = READY.get(url(id, frameOf(id, t, b0))); if (!img) return;
    const k = KJ[SRC(id)], vis = VIS[SRC(id)] || 1, q = (h * vis) / ((k.bottom - k.top) * img.height);
    const dw = img.width * q, dh = img.height * q, dx = x - k.headx * dw, dy = headY - k.top * dh;
    if (id === 'sandstorm') return glyphRunner(img, dx, dy, dw, dh, t, o);
    oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalCompositeOperation = 'source-over'; oc.globalAlpha = 1; oc.clearRect(0, 0, W, H);
    oc.imageSmoothingQuality = 'high'; if (o.flip) { oc.save(); oc.translate(2 * x, 0); oc.scale(-1, 1); oc.drawImage(img, dx, dy, dw, dh); oc.restore(); } else oc.drawImage(img, dx, dy, dw, dh);   // flip: mirrored about her head x
    if (k.cut) { const yb = dy + k.bottom * dh, y0 = yb - 0.16 * h * vis; const gr = oc.createLinearGradient(0, y0, 0, yb); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,1)');
      oc.globalCompositeOperation = 'destination-out'; oc.fillStyle = gr; oc.fillRect(dx - 2, y0, dw + 4, yb - y0 + dh); oc.globalCompositeOperation = 'source-over'; }
    if (o.clip) { oc.globalCompositeOperation = 'destination-in'; oc.beginPath(); o.clip(oc, x, headY); oc.fillStyle = '#000'; oc.fill(); oc.globalCompositeOperation = 'source-over'; }
    g.save(); g.globalAlpha = o.alpha ?? 1; g.drawImage(OC, 0, 0); g.restore();
    return { dx, dy, dw, dh };
  }
  function glyphRunner(img, dx, dy, dw, dh, t, o) {
    const w = Math.max(8, Math.ceil(dw)), h = Math.max(8, Math.ceil(dh)); GA.width = w; GA.height = h; GB.width = w; GB.height = h;
    const a = GA.getContext('2d'); a.clearRect(0, 0, w, h); a.drawImage(img, 0, 0, w, h); a.globalCompositeOperation = 'source-atop'; a.fillStyle = 'rgba(255,255,255,0.45)'; a.fillRect(0, 0, w, h);
    const b = GB.getContext('2d'); b.clearRect(0, 0, w, h);
    if (glyphPass) glyphPass(b, GA, { x: 0, y: 0, w, h }, { font: (11 * 1080) / h, depth: null, bg: 'none', palette: ['#0B3A44', '#22D3EE', '#DDFBFF'], text: [byId.sandstorm.msg, 'the live demo worked', 'docs: start here'],
      textMin: 4, hi: 0.55, thresh: 0.06, local: 0.4, edges: true, t, seed: 77 });
    g.save(); g.globalAlpha = o.alpha ?? 1; g.drawImage(GB, dx, dy); g.restore();
  }
  // ---- written lane segment between x0 and x1 (x0 < x1) along y(x)
  function laneSeg(yOf, x0, x1, text, color, cap, merge, t, speed) {
    if (x1 - x0 < 4) return; const pts = []; for (let x = x0; x < x1; x += 24 * S) pts.push({ x, y: yOf(x) }); pts.push({ x: x1, y: yOf(x1) });
    drawWrittenLane(g, pts, { text, color, cap, scroll: -t * speed, merge, under: 0.3 });
  }
  const PAPER = '#0D0D11';

  // ---- 'row' (b43)
  function row(s, t) {
    const K = s.opt.kit, n = K.lanes.length, G = geo(K, n), b0 = B0(s), tt = t - s.t0;
    g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
    K.lanes.forEach((L, p) => { const cap = G.cap(p), y = G.laneY(p, L.id) + cap * 0.6;
      laneSeg(() => y, 0, W, laneString(msgs([L.id]), true), col(L.id), cap, 0.2, tt, 4 + 10 * G.f(p));
      if (!K.conv || L.id === 'main') { runner(L.id, t, b0, L.x * W, G.headY(p, L.id), G.figH(p)); return; }
      // converge (chorus 2): run in toward main over the bar, accelerating, and fade into her in the last fifth
      const mx = K.lanes.find((q) => q.id === 'main').x * W, u = clamp01((t - s.t0) / (s.t1 - s.t0)), x = lerp(L.x * W, mx, ease.in(u) * 0.92);
      runner(L.id, t, b0, x, G.headY(p, L.id), G.figH(p), { flip: L.x * W < mx, alpha: 1 - clamp01((u - 0.8) / 0.2) }); });
  }
  // ---- 'fuse' (b46-47). events [beat, laneA, laneB] (beats from the shot start; a fusion lands ON its beat). For each event the
  // pair comes forward to the front over [bt-1, bt-0.5] (A on the front lane, B just behind it), converges over [bt-0.5, bt] (their
  // lanes join), is half A / half B (split through the head) for [bt, bt+1], then whole in A's medium and steps back over
  // [bt+1, bt+1.5]. Front slots alternate between two x places (K.slots) so the next pair can come up while the last one is split.
  // The rest stand back in their own rank. Lane text density follows how many lives a runner carries.
  function fuseState(s, t) {
    const K = s.opt.kit, n = K.lanes.length, u = bpos(t) - B0(s), slots = K.slots || [0.62, 0.84], back = n - 4;
    let ents = K.lanes.map((L, i) => ({ lead: L.id, ids: [L.id], lanes: [i], base: (i / (n - 1)) * back, bx: L.x, ev: -1, role: 0 }));
    K.events.forEach(([bt, a, b], k) => { if (u < bt - 1) return;
      const A = ents.find((e) => e.lanes.includes(a)), Bn = ents.find((e) => e.lanes.includes(b));
      A.ev = k; A.role = 1; Bn.ev = k; Bn.role = 2;
      if (u >= bt) { ents = ents.filter((e) => e !== A && e !== Bn);
        ents.push({ lead: A.lead, ids: [...A.ids, ...Bn.ids], lanes: [...A.lanes, ...Bn.lanes], base: (A.base + Bn.base) / 2, bx: (K.slots || [0.62, 0.84])[k % (K.slots || [0, 0]).length] - 0.08, ev: k, role: 0, split: u < bt + 1 ? [A.lead, Bn.lead] : null }); } });
    // the ones standing back: ranked by their lane order, packed one lane apart just behind the front (mid-large; never tiny)
    const rest = ents.filter((e) => true).sort((a, b) => a.base - b.base), top = n - 1.8;
    rest.forEach((e, r) => { e.base = Math.max(0, top - (rest.length - 1 - r) * 1.0); });
    for (const e of ents) {
      let p = e.base, x = e.bx * W;
      if (e.ev >= 0) { const [bt] = K.events[e.ev], sx = slots[e.ev % slots.length] * W;
        const wf = ease.io(clamp01((u - (bt - 1)) / 0.5)) * (1 - ease.io(clamp01((u - (bt + 1)) / 0.5)));
        const conv = ease.io(clamp01((u - (bt - 0.5)) / 0.5)), off = e.role === 1 ? -1 : e.role === 2 ? 1 : 0;
        p = lerp(e.base, (n - 1) - (e.role === 2 ? 0.9 * (1 - conv) : 0), wf);
        x = lerp(e.bx * W, sx + off * 0.11 * W * (1 - conv), wf); }
      e.p = p; e.x = x; }
    return { ents, u };
  }
  const density = (k) => (k >= 8 ? 1 : k >= 4 ? 0.78 : k >= 2 ? 0.45 : 0.12);
  function fuse(s, t) {
    const K = s.opt.kit, n = K.lanes.length, G = geo(K, n), b0 = B0(s), tt = t - s.t0, st = fuseState(s, t);
    g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
    const order = [...st.ents].sort((a, b) => a.p - b.p);
    for (const e of order) { const cap = G.cap(e.p), y = G.laneY(e.p, e.lead) + cap * 0.6;
      laneSeg(() => y, 0, W, laneString(msgs(e.ids), true), col(e.lead), cap, density(e.ids.length), tt, 4 + 10 * G.f(e.p));
      const h = G.figH(e.p), hy = G.headY(e.p, e.lead);
      if (e.split) { const ang = 0.18;   // the split line through the head, leaning back
        runner(e.split[0], t, b0, e.x, hy, h, { clip: (c, x, y) => { c.moveTo(-W, -H); c.lineTo(x + ang * H, -H); c.lineTo(x - ang * 2 * H, 3 * H); c.lineTo(-W, 3 * H); c.closePath(); } });
        runner(e.split[1], t, b0, e.x, hy, h, { clip: (c, x, y) => { c.moveTo(x + ang * H, -H); c.lineTo(2 * W, -H); c.lineTo(2 * W, 3 * H); c.lineTo(x - ang * 2 * H, 3 * H); c.closePath(); } });
      } else runner(e.lead, t, b0, e.x, hy, h); }
  }
  // ---- 'one' (b48)
  function one(s, t) {
    const K = s.opt.kit, b0 = B0(s), tt = t - s.t0, u = bpos(t) - b0, G = geo(K, 1);
    g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
    const hy = (K.head ?? 0.1) * H, h = ((K.near ?? 1.05) - (K.head ?? 0.1)) * H, x = (K.x ?? 0.5) * W, cap = 34 * S, yl = (K.lane ?? 0.93) * H;
    laneSeg(() => yl, 0, W, laneString(msgs(['main', ...K.flick]), true), MAIN, cap, 1, tt, 8);
    const r = runner('main', t, b0, x, hy, h); if (!r) return;
    // flicker: one patch per sixteenth (16 in the bar) for the first three beats, fading; the last beat is clean
    const k16 = Math.floor(u * 4); if (k16 >= 12 || k16 < 0) return;
    const id = K.flick[k16 % K.flick.length], img = READY.get(url(id, frameOf(id, t, b0))); if (!img) return;
    const kk = KJ[SRC(id)], fade = 1 - k16 / 12, rnd = (z) => { const v = Math.sin((k16 + 1) * 12.9898 + z * 78.233) * 43758.5453; return v - Math.floor(v); };
    const ph = (0.18 + 0.22 * rnd(1)) * r.dh * fade + 0.06 * r.dh, py = r.dy + (0.18 + 0.6 * rnd(2)) * r.dh - ph / 2;   // a horizontal band across her (below the face: from 18% down)
    oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalCompositeOperation = 'source-over'; oc.globalAlpha = 1; oc.clearRect(0, 0, W, H);
    const q = r.dh / img.height; oc.drawImage(img, x - kk.headx * img.width * q, r.dy + (KJ.main.top - kk.top) * r.dh, img.width * q, img.height * q);
    oc.globalCompositeOperation = 'destination-in'; const main = READY.get(url('main', frameOf('main', t, b0))); oc.drawImage(main, r.dx, r.dy, r.dw, r.dh);   // inside her matte
    oc.fillStyle = '#000'; oc.globalCompositeOperation = 'destination-in'; oc.fillRect(0, Math.max(py, r.dy + 0.2 * r.dh), W, ph);   // the band only, never over her face
    oc.globalCompositeOperation = 'source-over';
    g.save(); g.globalAlpha = 0.9 * fade + 0.1; g.drawImage(OC, 0, 0); g.restore();
  }
  // ---- frames a shot needs at t
  function need(s, t) {
    const K = s.opt.kit, b0 = B0(s), out = new Set(), add = (id) => out.add(url(id, frameOf(id, t, b0)));
    if (K.mode === 'one') { add('main'); const k16 = Math.floor((bpos(t) - b0) * 4); if (k16 >= 0 && k16 < 12) add(K.flick[k16 % K.flick.length]); }
    else for (const L of K.lanes) add(L.id);
    return [...out];
  }
  function draw(s, t) { const m = s.opt.kit.mode; if (m === 'fuse') fuse(s, t); else if (m === 'one') one(s, t); else row(s, t); }
  const ok = (s) => { const ids = s.opt.kit.mode === 'one' ? ['main', ...s.opt.kit.flick] : s.opt.kit.lanes.map((L) => L.id); return ids.every((id) => KJ[SRC(id)]); };
  return { need, draw, ok, bpos };
}
