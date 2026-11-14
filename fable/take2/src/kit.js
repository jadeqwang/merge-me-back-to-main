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
  // a lane runs where its runner's visible figure ends (feet, or the faded cut at the knees/hips), so legs go behind the lane text
  function geo(o, n) { const hy = (o.head ?? 0.33) * H, far = (o.far ?? 0.5) * H, near = (o.near ?? 1.0) * H, gam = o.gamma ?? 1.25;
    const f = (p) => Math.pow(clamp01(p / Math.max(1, n - 1)), gam);
    return { laneY: (p, id) => hy + (VIS[SRC(id)] || 1) * (far + (near - far) * f(p) - hy), figH: (p) => far + (near - far) * f(p) - hy, cap: (p) => (6 + 30 * f(p)) * S, headY: hy, f }; }
  // ---- one runner: head top at (x, headY), full-figure height h; split = [idB, angle] draws idB right of a line through the head
  const OC = document.createElement('canvas'); OC.width = W; OC.height = H; const oc = OC.getContext('2d');
  const GA = document.createElement('canvas'), GB = document.createElement('canvas');
  function runner(id, t, b0, x, headY, h, o = {}) {
    const img = READY.get(url(id, frameOf(id, t, b0))); if (!img) return;
    const k = KJ[SRC(id)], vis = VIS[SRC(id)] || 1, q = (h * vis) / ((k.bottom - k.top) * img.height);
    const dw = img.width * q, dh = img.height * q, dx = x - k.headx * dw, dy = headY - k.top * dh;
    if (id === 'sandstorm') return glyphRunner(img, dx, dy, dw, dh, t, o);
    oc.setTransform(1, 0, 0, 1, 0, 0); oc.globalCompositeOperation = 'source-over'; oc.globalAlpha = 1; oc.clearRect(0, 0, W, H);
    oc.imageSmoothingQuality = 'high'; oc.drawImage(img, dx, dy, dw, dh);
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
      runner(L.id, t, b0, L.x * W, G.headY, G.figH(p)); });
  }
  // ---- 'fuse' (b46-47)
  function fuseState(s, t) {
    const K = s.opt.kit, n = K.lanes.length, u = bpos(t) - B0(s);
    let ents = K.lanes.map((L, i) => ({ lead: L.id, ids: [L.id], lanes: [i], p: i, x: L.x * W, split: null }));
    const junctions = [];   // { u (beat when the converge starts), x (screen x then), pa, pb, pm, lead, ids }
    for (const [bt, a, b] of K.events) {
      if (u < bt) break;
      const A = ents.find((e) => e.lanes.includes(a)), Bn = ents.find((e) => e.lanes.includes(b)), m = clamp01((u - bt) / 0.5), em = ease.io(m);
      const pm = (A.p + Bn.p) / 2, xm = (A.x + Bn.x) / 2;
      junctions.push({ u: bt, x: xm, pa: A.p, pb: Bn.p, pm, A: A.lead, B: Bn.lead, ids: [...A.ids, ...Bn.ids], lanes: [...A.lanes, ...Bn.lanes] });
      if (m < 1) { A.p = lerp(A.p, pm, em); Bn.p = lerp(Bn.p, pm, em); A.x = lerp(A.x, xm, em); Bn.x = lerp(Bn.x, xm, em); continue; }
      const since = u - bt - 0.5;
      ents = ents.filter((e) => e !== A && e !== Bn);
      ents.push({ lead: A.lead, ids: [...A.ids, ...Bn.ids], lanes: [...A.lanes, ...Bn.lanes], p: pm, x: xm, split: since < 1 ? [A.lead, Bn.lead] : null });
    }
    return { ents, junctions, u };
  }
  const density = (k) => (k >= 8 ? 1 : k >= 4 ? 0.78 : k >= 2 ? 0.45 : 0.12);
  function fuse(s, t) {
    const K = s.opt.kit, n = K.lanes.length, G = geo(K, n), b0 = B0(s), tt = t - s.t0, st = fuseState(s, t);
    const v = (K.ground ?? 520) * S, beat = 60 / 138.5, C = v * 0.5 * beat;   // the ground scrolls right at v px/s; a junction's curve is half a beat of ground long
    g.fillStyle = PAPER; g.fillRect(0, 0, W, H);
    // lanes: each original lane's path, bent at each junction it took part in; drawn up to where its group's lead lane takes over
    const jx = (j) => j.x + v * (st.u - j.u) * beat;
    K.lanes.forEach((L, i) => {
      const js = st.junctions.filter((j) => j.lanes.includes(i));
      const yOf = (x) => { let p = i; for (const j of js) { const tgt = j.pm, w = sstep((jx(j) - x) / C); p = lerp(p, tgt, w); } return G.laneY(p, L.id) + G.cap(p) * 0.6; };
      // segments right to left: [x_j, W] with the ids it carried before j; it stops at the first junction where it is not the lead
      let right = W, ids = [L.id], lead = L.id;
      for (const j of js) { const xj = jx(j) - C * 0.5;
        laneSeg(yOf, Math.max(0, xj), right, laneString(msgs(ids), true), col(lead), G.cap(i), density(ids.length), tt, 6);
        right = Math.max(0, xj); if (j.A !== lead) { right = -1; break; } ids = j.ids; }
      if (right > 0) { const e = st.ents.find((q) => q.lanes.includes(i)); laneSeg(yOf, 0, right, laneString(msgs(ids), true), col(lead), G.cap(e ? e.p : i), density(ids.length), tt, 6); }
    });
    // runners, far to near
    for (const e of [...st.ents].sort((a, b) => a.p - b.p)) {
      const h = G.figH(e.p);
      if (e.split) { const ang = 0.18;   // the split line through the head, leaning back
        runner(e.split[0], t, b0, e.x, G.headY, h, { clip: (c, x, y) => { c.moveTo(-W, -H); c.lineTo(x + ang * H, -H); c.lineTo(x - ang * 2 * H, 3 * H); c.lineTo(-W, 3 * H); c.closePath(); } });
        runner(e.split[1], t, b0, e.x, G.headY, h, { clip: (c, x, y) => { c.moveTo(x + ang * H, -H); c.lineTo(2 * W, -H); c.lineTo(2 * W, 3 * H); c.lineTo(x - ang * 2 * H, 3 * H); c.closePath(); } });
      } else runner(e.lead, t, b0, e.x, G.headY, h);
    }
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
