// MERGE take two, film v2: the fold, b49-50 (replaces fold_reach; Jade found the hand to the lens cliche). The picture is paper.
// The twelve life plates stand as the 4x3 grid the pre-chorus built (same order, row by row) on one sheet of paper, and the sheet folds
// like a map along its creases, one fold landing on each beat: columns onto columns, then rows onto rows. Every fold is a valley fold
// toward the lens: the flap lifts at us in perspective (the free edge grows as it comes near), turns edge-on, shows its underside and
// slaps down on the beat, with a lane-colour flash along the crease. The undersides are the backs of the pictures, like the backs of
// photographs: cream paper, the picture's ghost showing through, captioned with the life's branch and commit message. The underside of
// the last flap is her (fold_chest frame 0, hands crossed at her chest); the last panel then grows to the full frame, landing on the
// cut into b51-52, which plays fold_chest from clip 0 (the same frame).
// What is face-up where: the bottom layer at a position is always the cell that started there, so when the stack at P folds onto Q the
// new face-up at Q is the back of P's own cell; the flap's front face is whatever was face-up at P.
// shots.js opt (code 'mapfold'): lives (12 plate ids, grid order), her (plate id), grid {cw, g, y0} (1080p px), folds [[beat, axis
// 'x'|'y', crease after column/row k, moving side 'lo'|'hi'], ...], final [col, row], grow [beat, beat], clip0, speed, D (camera
// distance, 1080p px), dur (beats a fold takes; it lands on its beat), drift (how far the face-up sheet re-centres, 0..1).
export function makeMapfold(E) {
  const { g, W, H, S, READY, PLATE, byId, clamp01, lerp, ease, cover, bposT, hexA, hashOf } = E;
  const PAPER = '#EFE7D7', INKP = '#3A3632';
  const url = (p, k) => `${p.dir}/frames/f_${String(k + 1).padStart(4, '0')}.jpg`;
  const off = () => { const c = document.createElement('canvas'); c.width = W; c.height = H; return c; };
  let FL = null, BK = null;

  function geo(o) {
    const cw = o.grid.cw * S, ch = cw * 9 / 16, gg = o.grid.g * S, gw = 4 * cw + 3 * gg, x0 = (W - gw) / 2, y0 = o.grid.y0 * S;
    const cells = o.lives.map((id, i) => ({ id, i, col: i % 4, row: Math.floor(i / 4), x: x0 + (i % 4) * (cw + gg), y: y0 + Math.floor(i / 4) * (ch + gg), w: cw, h: ch }));
    const at = (col, row) => cells[row * 4 + col];
    return { cw, ch, gg, x0, y0, cells, at, colX: (c) => x0 + c * (cw + gg) - gg / 2, rowY: (r) => y0 + r * (ch + gg) - gg / 2 };
  }
  const moves = (e, c) => { const [, ax, k, side] = e, j = ax === 'x' ? c.col : c.row; return side === 'hi' ? j > k : j <= k; };
  const dest = (e, c, G) => { const [, ax, k] = e; return ax === 'x' ? G.at(2 * k + 1 - c.col, c.row) : G.at(c.col, 2 * k + 1 - c.row); };
  // face-up state after every fold landed before beat u: { up: Set of cell indices still face-up, top: {cellIndex: {kind, i}} }
  function state(o, G, u) {
    const up = new Set(G.cells.map((c) => c.i)), top = {}; G.cells.forEach((c) => (top[c.i] = { kind: 'front', i: c.i }));
    o.folds.forEach((e, n) => { if (u < e[0]) return; const last = n === o.folds.length - 1;
      for (const c of G.cells) if (up.has(c.i) && moves(e, c)) { const q = dest(e, c, G); top[q.i] = last ? { kind: 'her' } : { kind: 'back', i: c.i }; up.delete(c.i); } });
    return { up, top };
  }
  const bbox = (G, idx) => { const cs = [...idx].map((i) => G.cells[i]); const x = Math.min(...cs.map((c) => c.x)), y = Math.min(...cs.map((c) => c.y));
    return { x: x - G.gg, y: y - G.gg, w: Math.max(...cs.map((c) => c.x + c.w)) - x + 2 * G.gg, h: Math.max(...cs.map((c) => c.y + c.h)) - y + 2 * G.gg }; };

  const clipOf = (o, s, t) => Math.max(0, (o.clip0 || 0) + (t - s.t0) * (o.speed || 1));
  const frameUrl = (id, c) => { const p = PLATE[id]; return url(p, Math.min(p.meta.n - 1, Math.round(c * p.meta.fps))); };
  function need(s, t) { const o = s.opt, c = clipOf(o, s, t), out = o.lives.filter((id) => PLATE[id]).map((id) => frameUrl(id, c)); if (PLATE[o.her]) out.push(url(PLATE[o.her], 0)); return out; }
  const ok = (s) => s.opt.lives.every((id) => PLATE[id]) && !!PLATE[s.opt.her];

  // ---- the faces: a picture (front), the back of a picture (caption), her
  function front(x, o, s, t, id, r) { const b = READY.get(frameUrl(id, clipOf(o, s, t))); if (!b) return; const fo = PLATE[id].meta.focus || [0.5, 0.45], cr = cover(b.width, b.height, r.w, r.h, 1, fo[0], fo[1]);
    x.drawImage(b, cr.sx, cr.sy, cr.sw, cr.sh, r.x, r.y, r.w, r.h); }
  function herFace(x, o, r) { const b = READY.get(url(PLATE[o.her], 0)); if (!b) return; const cr = cover(b.width, b.height, r.w, r.h, 1, 0.5, 0.5); x.drawImage(b, cr.sx, cr.sy, cr.sw, cr.sh, r.x, r.y, r.w, r.h); }
  // the back of a picture: paper, the picture's ghost mirrored through it, a lane-colour rule, the branch (mono) and the commit message
  // (serif, as handwriting on the back of a photograph). Type at 1080p: branch 30 px mono, message 34 px serif.
  function back(x, o, s, t, i, r) {
    const L = byId[o.lives[i]]; x.save(); x.fillStyle = PAPER; x.fillRect(r.x, r.y, r.w, r.h);
    x.save(); x.globalAlpha = 0.09; x.translate(r.x * 2 + r.w, 0); x.scale(-1, 1); front(x, o, s, t, o.lives[i], r); x.restore();
    const k = r.w / (470 * S), pad = 26 * S * k; x.fillStyle = L.color; x.fillRect(r.x + pad, r.y + pad, 6 * S * k, r.h - 2 * pad);
    x.font = `600 ${30 * S * k}px "JetBrains Mono"`; x.textBaseline = 'alphabetic'; x.fillStyle = L.color; const tx = r.x + pad + 22 * S * k;
    x.fillText(L.branch, tx, r.y + pad + 30 * S * k); x.fillStyle = hexA(INKP, 0.55); x.font = `500 ${24 * S * k}px "JetBrains Mono"`; x.fillText(hashOf(L.id), tx, r.y + pad + 64 * S * k);
    x.font = `italic 400 ${40 * S * k}px "Instrument Serif"`; x.fillStyle = INKP; const maxW = r.x + r.w - pad - tx; let line = '', yy = r.y + pad + 118 * S * k;
    for (const w of L.msg.split(' ')) { const tr = line ? line + ' ' + w : w; if (line && x.measureText(tr).width > maxW) { x.fillText(line, tx, yy); yy += 40 * S * k; line = w; } else line = tr; }
    if (line) x.fillText(line, tx, yy); x.restore(); }
  function face(x, o, s, t, f, cellI, r) { if (f.kind === 'front') front(x, o, s, t, o.lives[f.i], r); else if (f.kind === 'back') back(x, o, s, t, f.i, r); else herFace(x, o, r); }

  function draw(s, t) {
    const o = s.opt, G = geo(o), u = bposT(t) - Math.round(bposT(s.t0)), D = (o.D || 1500) * S, dur = o.dur || 0.55;
    g.fillStyle = '#05050A'; g.fillRect(0, 0, W, H);
    const st = state(o, G, u), ev = o.folds.find(([b]) => u >= b - dur && u < b), evn = ev ? o.folds.indexOf(ev) : -1;
    // camera: the face-up sheet's centre eases toward the view centre (drift) over the half beat after each landing; then the grow
    const view = { x: W / 2, y: o.viewY !== undefined ? o.viewY * H : G.y0 + (3 * G.ch + 2 * G.gg) / 2 };
    let R = bbox(G, state(o, G, -1).up);
    o.folds.forEach((e) => { const nx = bbox(G, state(o, G, e[0]).up), k = ease.io(clamp01((u - e[0]) / 0.6)); R = { x: lerp(R.x, nx.x, k), y: lerp(R.y, nx.y, k), w: lerp(R.w, nx.w, k), h: lerp(R.h, nx.h, k) }; });
    // and the camera closes in as the sheet gets smaller, so the face-up part stays a good size (o.fit = [max width, max height] as
    // frame fractions, o.zmax): it never shrinks below the sheet's own size
    const dr = o.drift === undefined ? 0.5 : o.drift, fit = o.fit || [0.8, 0.62], Rc = { x: R.x + R.w / 2, y: R.y + R.h / 2 };
    let sc = Math.max(1, Math.min(o.zmax || 2, fit[0] * W / R.w, fit[1] * H / R.h));
    const cv = { x: lerp(Rc.x, view.x, dr), y: lerp(Rc.y, view.y, dr) }; let tx = cv.x - Rc.x * sc, ty = cv.y - Rc.y * sc;
    const fin = G.at(o.final[0], o.final[1]), gu = ease.io(clamp01((u - o.grow[0]) / (o.grow[1] - o.grow[0])));
    if (gu > 0) { const a = { x: tx + fin.x * sc, y: ty + fin.y * sc, w: fin.w * sc }, x = lerp(a.x, 0, gu), y = lerp(a.y, 0, gu), w = lerp(a.w, W, gu); sc = w / fin.w; tx = x - fin.x * sc; ty = y - fin.y * sc; }
    const CAM = (x, y) => ({ x: tx + x * sc, y: ty + y * sc });
    const C = { x: W / 2, y: H * 0.4 }, proj = (x, y, z) => { const p = CAM(x, y), f = D / (D - z * sc); return { x: C.x + (p.x - C.x) * f, y: C.y + (p.y - C.y) * f }; };
    const scr = (c) => { const p = CAM(c.x, c.y); return { x: p.x, y: p.y, w: c.w * sc, h: c.h * sc }; };

    // the face-up sheet without the moving flap: paper (one sheet, soft shadow), the faces, the scored creases
    const flapCells = ev ? G.cells.filter((c) => st.up.has(c.i) && moves(ev, c)) : [];
    const stay = [...st.up].filter((i) => !flapCells.some((c) => c.i === i));
    if (stay.length) { const sr = bbox(G, stay), a = CAM(sr.x, sr.y);
      g.save(); g.shadowColor = 'rgba(0,0,0,0.65)'; g.shadowBlur = 34 * S; g.shadowOffsetY = 8 * S; g.fillStyle = PAPER; g.fillRect(a.x, a.y, sr.w * sc, sr.h * sc); g.restore();
      for (const i of stay) face(g, o, s, t, st.top[i], i, scr(G.cells[i]));
      // creases between face-up cells: a fine groove; scored bright on beat 0 (the sheet is announced as paper on the downbeat)
      const flash = 1 - clamp01(u / 0.6), cs = [...new Set(stay.map((i) => G.cells[i].col))].sort(), rs = [...new Set(stay.map((i) => G.cells[i].row))].sort();
      g.save(); g.lineCap = 'butt';
      const groove = (p0, p1) => { g.strokeStyle = 'rgba(70,60,45,0.5)'; g.lineWidth = 2 * S * sc; g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.stroke();
        if (flash > 0) { g.save(); g.globalCompositeOperation = 'lighter'; g.strokeStyle = `rgba(255,246,225,${0.9 * flash})`; g.lineWidth = (2 + 4 * flash) * S; g.shadowColor = '#FFF1D6'; g.shadowBlur = 18 * S * flash; g.stroke(); g.restore(); } };
      for (const cc of cs.slice(1)) groove(CAM(G.colX(cc), sr.y + G.gg / 2), CAM(G.colX(cc), sr.y + sr.h - G.gg / 2));
      for (const rr of rs.slice(1)) groove(CAM(sr.x + G.gg / 2, G.rowY(rr)), CAM(sr.x + sr.w - G.gg / 2, G.rowY(rr)));
      g.restore(); }
    if (ev) drawFlap(o, s, t, G, ev, evn, u, dur, st, flapCells, proj, CAM, sc);
    // the crease flash on each landing, in the lane colours of the cells folded in
    o.folds.forEach((e, n) => { const df = u - e[0]; if (df < 0 || df > 0.45) return; const a = 1 - df / 0.45, before = state(o, G, e[0] - 1e-6), [, ax, k] = e;
      g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
      for (const c of G.cells) { if (!before.up.has(c.i) || !moves(e, c)) continue; const L = byId[c.id];
        const p0 = ax === 'x' ? CAM(G.colX(k + 1), c.y) : CAM(c.x, G.rowY(k + 1)), p1 = ax === 'x' ? CAM(G.colX(k + 1), c.y + c.h) : CAM(c.x + c.w, G.rowY(k + 1));
        g.shadowColor = L.color; g.shadowBlur = 30 * S; g.strokeStyle = hexA(L.color, a); g.lineWidth = (5 + 7 * a) * S; g.beginPath(); g.moveTo(p0.x, p0.y); g.lineTo(p1.x, p1.y); g.stroke();
        g.shadowBlur = 0; g.strokeStyle = `rgba(255,250,240,${a})`; g.lineWidth = 2 * S; g.stroke(); }
      g.restore(); void n; });
  }

  // a flap in perspective: its front (what is face-up there now) and its underside (the backs of its own cells, or her for the last
  // fold) drawn flat into offscreen canvases in sheet coordinates; then drawn in strips parallel to the crease, each at its rotated 3D
  // place, scaled by depth, shaded by how it faces the light (front, from the lens)
  function drawFlap(o, s, t, G, e, n, u, dur, st, cells, proj, CAM, sc) {
    if (!FL) { FL = off(); BK = off(); }
    const [b, ax, k, side] = e, p = clamp01((u - (b - dur)) / dur), th = Math.PI * (p * p * (1.6 - 0.6 * p)), cth = Math.cos(th), sth = Math.sin(th);
    const last = n === o.folds.length - 1, crease = ax === 'x' ? G.colX(k + 1) : G.rowY(k + 1), dirn = side === 'hi' ? 1 : -1;
    const r = bbox(G, cells.map((c) => c.i)); if (ax === 'x') { if (dirn > 0) { r.w -= crease - r.x; r.x = crease; } else r.w = crease - r.x; } else { if (dirn > 0) { r.h -= crease - r.y; r.y = crease; } else r.h = crease - r.y; }
    const under = th > Math.PI / 2, src = under ? BK : FL, x = src.getContext('2d');
    x.setTransform(1, 0, 0, 1, 0, 0); x.clearRect(0, 0, W, H); x.fillStyle = PAPER; x.fillRect(r.x, r.y, r.w, r.h);
    for (const c of cells) {
      if (!under) face(x, o, s, t, st.top[c.i], c.i, c);
      else { // the underside, drawn as it will read once landed (at the mirror cell), then mirrored back onto the flap's own place
        x.save(); if (ax === 'x') { x.translate(2 * crease, 0); x.scale(-1, 1); } else { x.translate(0, 2 * crease); x.scale(1, -1); }
        const q = dest(e, c, G); if (last) herFace(x, o, q); else back(x, o, s, t, c.i, q); x.restore(); } }
    // the flap's shadow on the cells it lands on, deepening as it comes down
    if (th > 0.2) { const k2 = Math.pow(Math.sin(th / 2), 3) * 0.55; for (const c of cells) { const q = dest(e, c, G), a = CAM(q.x, q.y); g.fillStyle = `rgba(8,6,16,${k2})`; g.fillRect(a.x, a.y, q.w * sc, q.h * sc); } }
    const far = ax === 'x' ? r.w : r.h, N = 56, light = under ? 0.25 + 0.75 * (-cth) : 0.35 + 0.65 * cth;   // facing the lens = lit
    g.save(); g.imageSmoothingQuality = 'high';
    for (let i = 0; i < N; i++) {
      const d0 = far * i / N, d1 = far * (i + 1) / N, dm = (d0 + d1) / 2, z = dm * sth;
      let sx, sy, sw, sh, dx, dy, dw, dh;
      if (ax === 'x') { const xa = crease + dirn * d0, xb = crease + dirn * d1; sx = Math.min(xa, xb); sw = Math.abs(xb - xa); sy = r.y; sh = r.h;
        const A = proj(crease + dirn * d0 * cth, r.y, d0 * sth), B = proj(crease + dirn * d1 * cth, r.y, d1 * sth), y0 = proj(crease + dirn * dm * cth, r.y, z), y1 = proj(crease + dirn * dm * cth, r.y + r.h, z);
        dx = Math.min(A.x, B.x); dw = Math.abs(B.x - A.x) + 0.8; dy = y0.y; dh = y1.y - y0.y; }
      else { const ya = crease + dirn * d0, yb = crease + dirn * d1; sy = Math.min(ya, yb); sh = Math.abs(yb - ya); sx = r.x; sw = r.w;
        const A = proj(r.x, crease + dirn * d0 * cth, d0 * sth), B = proj(r.x, crease + dirn * d1 * cth, d1 * sth), x0 = proj(r.x, crease + dirn * dm * cth, z), x1 = proj(r.x + r.w, crease + dirn * dm * cth, z);
        dy = Math.min(A.y, B.y); dh = Math.abs(B.y - A.y) + 0.8; dx = x0.x; dw = x1.x - x0.x; }
      g.save(); if (cth < 0) { if (ax === 'x') { g.translate(2 * dx + dw, 0); g.scale(-1, 1); } else { g.translate(0, 2 * dy + dh); g.scale(1, -1); } }
      g.drawImage(src, sx, sy, sw, sh, dx, dy, dw, dh);
      const nearC = 1 - i / N, shade = Math.min(0.85, (1 - light) * 0.7 + 0.22 * sth * nearC * nearC);   // the crease side in its own shadow
      if (shade > 0.01) { g.fillStyle = `rgba(14,10,22,${shade})`; g.fillRect(dx, dy, dw, dh); }
      g.restore();
    }
    g.restore();
  }
  return { need, ok, draw };
}
