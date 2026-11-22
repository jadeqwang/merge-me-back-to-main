// film v8 (Jade's v7 note at 4:30.46: "build it out in three.js, the car and the road; over-the-shoulder so you can see out the front of
// the car, then it pans around to where the driver's eyes are (the 'you')"). The car shot b157.3-161.3 in three.js: a night two-lane road
// (yellow centre dashes, white edges, receding to the vanishing point, moving at 26 m/s like the road shot before it), a car interior drawn
// in the film's look (flat toon tones in the car_confess plate's navy, ink lines from a normal/inverse-depth edge pass), the verse 2 Milky
// Way over hazy hills, the violet page-light riding ahead on the centre line (same path as outro.js roadPage).
// She: a toon back/over-shoulder proxy at the start; at the end the car_confess cut-out (kit/car_confess/clean) on a card fixed to the
// final camera. The camera reaches the driver's eye first and the last part of the move is a PURE PAN about that eye, so the card has no
// parallax and holds up exactly; the swap happens while she is out of frame (camera looking forward, she is ~100 deg to the right).
// World: metres, car fixed at the origin (x right = passenger side, y up, -z forward); the road moves toward +z.
// makeCar3D(THREE, { W, H, T, Q, base }) -> { canvas, load(), render(t), cam(t), info }   (t = song seconds)

export function makeCar3D(THREE, o) {
  const { W, H, T } = o, Q = o.Q || new URLSearchParams(), base = o.base || '';
  const num = (k, d) => (Q.get(k) !== null && Q.get(k) !== '' && isFinite(+Q.get(k)) ? +Q.get(k) : d);
  const clamp01 = (x) => Math.min(1, Math.max(0, x)), lerp = (a, b, u) => a + (b - a) * u, seg = (t, a, b) => clamp01((t - a) / (b - a));
  const sm = (u) => u * u * (3 - 2 * u), smr = (u) => u * u * u * (u * (6 * u - 15) + 10), D2R = Math.PI / 180;
  THREE.ColorManagement.enabled = false;
  const C = (h) => new THREE.Color(h);

  // ------------------------------------------------------------------ timing (song seconds, from the beat grid)
  // film v9 (Jade's v8 note on the car: "once you're inside the car, the initial camera position should be driver's eyes so you have more
  // time to turn"): the shot opens AT the driver's eye looking down the road (the 'you'), then pans round to her; no over-the-shoulder
  // opening, no dolly. The pan is longer (b158.2 -> b159.2, 1.7 s, gentler peak speed, shorter shutter: less mid-pan blur), her turn
  // starts on b159.3 and the almost-smile holds ~2.4 s (v7's hold). ?carv=8 = the v8 move.
  // film v10 C4 (essay move 3; listen_v10.md "Outro phrase map": every tail cut on a chord change): the car starts on b157.1 (269.126, C chord;
  // the log burst before it is cut) and ends where it did (b161.3): every v9 event two beats earlier (pan b157.4 -> b158.4) and her turn
  // on b159.1 (272.543, G chord), the moment the box has gone; the almost-smile holds ~3.3 s (v9 2.4). ?carv=9 = v9 timing, ?carv=8 the v8 move.
  const V8 = Q.get('carv') === '8', V9 = Q.get('carv') === '9';
  const TM = !V8 && !V9 ? {
    t0: T.beat(157, 1), t1: T.beat(161, 3), road0: T.beat(155, 1),
    holdEnd: T.beat(157, 1), dollyEnd: T.beat(157, 1),
    panA: T.beat(157, 4) + num('panA', 0), panB: T.beat(158, 4) + num('panB', 0),
    turn: T.beat(159, 1) + num('turn', 0),
  } : V8 ? {
    t0: T.beat(157, 3), t1: T.beat(161, 3), road0: T.beat(156, 1),       // shot; the road's first moment (outro.js road o.from)
    holdEnd: T.beat(158, 3),                                              // over-the-shoulder until here (bar 158 beat 3)
    dollyEnd: T.beat(159, 2) + 0.6 * (T.beat(159, 3) - T.beat(159, 2)),   // the camera arrives at the driver's eye
    panA: T.beat(159, 1) + 0.37 * (T.beat(159, 2) - T.beat(159, 1)),      // pan starts (overlaps the end of the dolly)
    panB: T.beat(159, 4),                                                 // lands on bar 159 beat 4
    turn: T.beat(159, 4) + 0.3 * (T.beat(160, 1) - T.beat(159, 4)),       // her turn starts (clip 3.0 s)
  } : {
    t0: T.beat(157, 3), t1: T.beat(161, 3), road0: T.beat(156, 1),
    holdEnd: T.beat(157, 3), dollyEnd: T.beat(157, 3),                    // (no dolly: at the eye from the first frame)
    panA: T.beat(158, 2) + num('panA', 0) , panB: T.beat(159, 2) + num('panB', 0),   // pan b158.2 -> b159.2
    turn: T.beat(159, 3) + num('turn', 0),                                // her turn starts (clip 3.0 s) on b159.3; settled ~1.0 s later
  };
  TM.swap = V8 ? TM.dollyEnd : TM.t0 - 1;   // v9: her card from the start (pure rotation about the eye: no parallax); the proxy is never seen
  // her clip time (car_confess, 24 fps, 121 frames): 3.0 at TM.turn; 0.75x through the turn (to clip 3.75 = the almost-smile settled), then 0.5x
  const HOLD = !V8 && !V9 ? 0.38 : 0.5;   // v10: the longer hold plays the clip's settled smile slower (0.38x) so it lasts to the cut (clip end 5.0)
  const herClip = (t) => { const c = 3.0 + (t - TM.turn) * 0.75; return c <= 3.75 ? c : 3.75 + (c - 3.75) / 0.75 * HOLD; };

  // ------------------------------------------------------------------ layout
  const ROAD = { CL: -1.8, LANE: 3.6, V: 26, DASH: 3.05, PER: 12.2, EDGE: 0.12, DW: 0.11 };   // US: 10 ft dashes, 40 ft cycle; 26 m/s ~ 58 mph
  const EYE = new THREE.Vector3(-0.37, 1.18, -0.12);       // the driver's eye: the 'you'
  const HER = new THREE.Vector3(0.38, 1.16, 0.12);         // her head centre (passenger, right: a left-hand-drive car on the right of the road)
  const CAM = {
    A0: { p: [0.07, 1.29, 0.74], yaw: num('yawA', 14), pitch: -1.5, vfov: 34 },     // over her left shoulder, from between the rear headrests
    A1: { p: [0.05, 1.285, 0.64] },
    M:  { p: [-0.06, 1.27, 0.12] },                       // bezier control: through the gap between the front headrests
    E:  { p: EYE.toArray(), vfov: num('vfovE', 52) },
    F:  { yaw: num('yawF', 101), pitch: num('pitchF', -16), vfov: num('vfovF', 52), push: 0.985 },   // final: looking at her
  };

  // ------------------------------------------------------------------ renderer and passes
  const canvas = document.createElement('canvas'); canvas.width = W; canvas.height = H;
  const R = new THREE.WebGLRenderer({ canvas, antialias: false, preserveDrawingBuffer: true, alpha: false, powerPreference: 'high-performance' });
  R.setPixelRatio(1); R.setSize(W, H, false); R.outputColorSpace = THREE.LinearSRGBColorSpace; R.autoClear = false;
  const rtCol = new THREE.WebGLRenderTarget(W, H, { samples: 4, type: THREE.HalfFloatType });
  const rtNrm = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const rtAcc = new THREE.WebGLRenderTarget(W, H, { type: THREE.FloatType });
  const scene = new THREE.Scene(); scene.background = null;
  const camera = new THREE.PerspectiveCamera(40, W / H, 0.03, 3000); camera.layers.enableAll();
  const L_SKY = 1, L_MASK = 2;   // layer 1: colour pass only (sky, page-light, her card); layer 2: normal pass only (her card's mask)

  // toon materials (flat steps like the plate's cel shading)
  const gradTex = (() => { const d = new Uint8Array([70, 140, 205, 255]); const t = new THREE.DataTexture(d, 4, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
  const toon = (hex, extra = {}) => new THREE.MeshToonMaterial({ color: C(hex), gradientMap: gradTex, ...extra });
  const PAL = { trim: '#232b40', panel: '#1d2436', seat: '#1b2233', seatHi: '#262f45', roof: '#1f2638', dash: '#161c2b', black: '#0b0e17', belt: '#141c2c',
    metal: '#3a4560', body: '#141a28', hair: '#0d0f18', jacket: '#e4e6ee', orange: '#f07c2c', skin: '#e9c9b0', glass: '#0a0d16' };

  scene.add(new THREE.AmbientLight(C('#3b4668'), 0.95));
  scene.add(new THREE.HemisphereLight(C('#5a6a9c'), C('#0b0c14'), 0.9));
  const moon = new THREE.DirectionalLight(C('#9fb3e6'), 0.9); moon.position.set(2, 6, -3); scene.add(moon);
  const dashL = new THREE.PointLight(C('#ffd6a0'), 0.55, 1.8, 1.5); dashL.position.set(0.0, 1.06, -0.7); scene.add(dashL);
  const clusterL = new THREE.PointLight(C('#7fd0ff'), 0.25, 1.0, 1.5); clusterL.position.set(-0.37, 0.98, -0.78); scene.add(clusterL);

  const G = new THREE.Group(); scene.add(G);   // the car (static)
  const box = (w, h, d, hex, x, y, z, rx = 0, ry = 0, rz = 0, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat || toon(hex)); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); G.add(m); return m; };
  let RB = null;
  const rbox = (w, h, d, r, hex, x, y, z, rx = 0, ry = 0, rz = 0, mat) => { const m = new THREE.Mesh(new RB(w, h, d, 3, r), mat || toon(hex)); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); G.add(m); return m; };
  // a beam between two points (pillars), cross-section a x b
  const beam = (p, q, a, b, hex, mat) => { const P = new THREE.Vector3(...p), Qv = new THREE.Vector3(...q), d = Qv.clone().sub(P), m = new THREE.Mesh(new THREE.BoxGeometry(a, d.length(), b), mat || toon(hex));
    m.position.copy(P).add(Qv).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); G.add(m); return m; };
  // a quad from four corners (panels)
  const quad = (pts, hex, mat) => { const g = new THREE.BufferGeometry(); const v = new Float32Array([...pts[0], ...pts[1], ...pts[2], ...pts[0], ...pts[2], ...pts[3]]);
    g.setAttribute('position', new THREE.BufferAttribute(v, 3)); g.computeVertexNormals(); const m = new THREE.Mesh(g, mat || toon(hex, { side: THREE.DoubleSide })); G.add(m); return m; };
  // a flat ribbon along points (seat belts): width w, the ribbon's flat side faces `nrm`
  const ribbon = (pts, w, nrm, hex) => { const cv = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), N = 24, pos = [], idx = [], n = new THREE.Vector3(...nrm).normalize();
    for (let i = 0; i <= N; i++) { const p = cv.getPoint(i / N), tg = cv.getTangent(i / N), s = tg.clone().cross(n).normalize().multiplyScalar(w / 2); pos.push(...p.clone().add(s).toArray(), ...p.clone().sub(s).toArray()); if (i < N) idx.push(2 * i, 2 * i + 1, 2 * i + 2, 2 * i + 1, 2 * i + 3, 2 * i + 2); }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const m = new THREE.Mesh(g, toon(hex, { side: THREE.DoubleSide })); G.add(m); return m; };

  function buildCar() {
    const XW = 0.76, FL = 0.32, SILL = 1.0, ROOF = 1.48, WB = -1.25, WBY = 0.98, HDR = -0.5, BP = 0.42, CP = 1.28, RW = 1.62;
    // floor, roof (headliner), dash
    box(2 * XW, 0.04, 3.2, PAL.black, 0, FL, 0.1);
    box(2 * XW + 0.04, 0.05, RW - HDR + 0.1, PAL.roof, 0, ROOF + 0.025, (HDR + RW) / 2);
    rbox(2 * XW, 0.34, 0.55, 0.05, PAL.dash, 0, 0.8, -1.1);                       // dash body
    rbox(2 * XW - 0.02, 0.06, 0.48, 0.03, PAL.trim, 0, WBY - 0.02, -1.08);        // dash top
    rbox(0.44, 0.09, 0.2, 0.03, PAL.dash, -0.37, 1.0, -0.9);                       // instrument hood
    box(2 * XW, 0.3, 0.06, PAL.dash, 0, 0.5, -0.92);                               // footwell wall
    // windshield frame: A-pillars, header; door tops (sills), B and C pillars, rear window frame
    for (const s of [-1, 1]) {
      beam([s * (XW - 0.03), WBY, WB], [s * (XW - 0.07), ROOF, HDR], 0.08, 0.1, PAL.trim);
      quad([[s * XW, FL, -1.05], [s * XW, FL, RW], [s * XW, SILL, RW], [s * XW, SILL, -1.05]], PAL.panel);                 // door skins (inside)
      box(0.08, 0.05, RW + 1.05, PAL.trim, s * (XW - 0.04), SILL, (RW - 1.05) / 2);                                             // window sill
      beam([s * (XW - 0.03), SILL, -1.05], [s * (XW - 0.03), WBY + 0.01, WB + 0.02], 0.07, 0.08, PAL.trim);
      beam([s * (XW - 0.03), SILL, BP], [s * (XW - 0.06), ROOF, BP + 0.05], 0.07, 0.12, PAL.trim);                           // B-pillar
      beam([s * (XW - 0.03), SILL, CP], [s * (XW - 0.07), ROOF, CP + 0.22], 0.07, 0.2, PAL.trim);                             // C-pillar
      box(0.06, 0.06, RW - HDR, PAL.trim, s * (XW - 0.06), ROOF - 0.02, (RW + HDR) / 2);                                       // roof rail
      rbox(0.1, 0.06, 0.55, 0.02, PAL.trim, s * (XW - 0.07), 0.74, -0.2);                                                       // armrest (front door)
      rbox(0.03, 0.035, 0.11, 0.012, PAL.metal, s * (XW - 0.03), 0.86, -0.45);                                                  // door handle
      box(0.02, 0.012, 0.6, PAL.metal, s * (XW - 0.02), 0.95, -0.25);                                                           // trim line
      rbox(0.04, 0.25, 0.55, 0.03, PAL.seatHi, s * (XW - 0.04), 0.52, -0.25);                                                   // door pocket
    }
    box(2 * XW, 0.08, 0.06, PAL.trim, 0, ROOF - 0.03, HDR);                                       // header
    box(2 * XW, 0.08, 0.06, PAL.trim, 0, 1.0, RW); box(2 * XW, 0.06, 0.06, PAL.trim, 0, ROOF - 0.02, RW);  // rear window frame
    // mirror
    rbox(0.22, 0.06, 0.03, 0.015, PAL.trim, 0, 1.34, HDR - 0.12, 0.15); beam([0, 1.38, HDR - 0.1], [0, ROOF, HDR - 0.02], 0.02, 0.02, PAL.black);
    // centre console, shifter, screen
    rbox(0.24, 0.36, 1.2, 0.04, PAL.trim, 0, 0.5, -0.25); rbox(0.2, 0.05, 0.5, 0.02, PAL.dash, 0, 0.7, 0.1);
    beam([0, 0.68, -0.45], [0, 0.8, -0.42], 0.025, 0.025, PAL.black); const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 16, 12), toon(PAL.black)); knob.position.set(0, 0.81, -0.42); G.add(knob);
    const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.14), new THREE.MeshBasicMaterial({ color: C('#5a7fb8') })); scr.position.set(0, 0.88, -0.86); scr.rotation.x = -0.25; G.add(scr);
    // gauges (glow) under the hood
    for (const gx of [-0.45, -0.29]) { const gm = new THREE.Mesh(new THREE.CircleGeometry(0.055, 32), new THREE.MeshBasicMaterial({ color: C(gx < -0.4 ? '#ffb070' : '#7fd8ff') })); gm.position.set(gx, 0.94, -0.83); gm.rotation.x = -0.15; G.add(gm);
      const rim = new THREE.Mesh(new THREE.RingGeometry(0.055, 0.064, 32), toon(PAL.metal)); rim.position.copy(gm.position).add(new THREE.Vector3(0, 0, 0.002)); rim.rotation.x = -0.15; G.add(rim); }
    // vents
    for (const vx of [-0.62, -0.1, 0.1, 0.62]) rbox(0.13, 0.05, 0.02, 0.01, PAL.black, vx, 0.88, -0.83);
    // steering wheel (driver's side, left): rim, hub, three spokes, column
    const SW = new THREE.Group(); SW.position.set(-0.37, 0.86, -0.6); SW.rotation.x = -0.42; G.add(SW);
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.185, 0.019, 12, 64), toon(PAL.black)); SW.add(rim);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.05, 24), toon(PAL.trim)); hub.rotation.x = Math.PI / 2; SW.add(hub);
    for (const a of [0, Math.PI, -Math.PI / 2]) { const sp = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.03, 0.015), toon(PAL.trim)); sp.position.set(Math.cos(a) * 0.12, Math.sin(a) * 0.12, 0); sp.rotation.z = a; SW.add(sp); }
    beam([-0.37, 0.86 - 0.02, -0.62], [-0.37, 0.78, -0.85], 0.07, 0.07, PAL.dash);
    // film v9: the driver's hands on the wheel at ten and two (the camera is the driver; a wheel turning nobody's hands read as empty).
    // Fists over the rim, dark sleeves running back and down out of frame.
    // Off by default (coordinator, v9: Jade did not ask for them, they give YOU a body and read crude); ?hands=1 shows them.
    if (Q.get('hands') === '1') {
      SW.updateMatrixWorld(true); const SKN = '#8f7466';   // skin in the dark cabin (the dash light only)
      const limb = (P, Qv, r0, r1, hex) => { const d = Qv.clone().sub(P), m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, d.length(), 18), toon(hex));
        m.position.copy(P).add(Qv).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); G.add(m); return m; };
      for (const [ang, side] of [[148, -1], [32, 1]]) {
        const a = ang * D2R, onRim = SW.localToWorld(new THREE.Vector3(Math.cos(a) * 0.185, Math.sin(a) * 0.185, 0.012));
        const fist = new THREE.Mesh(new THREE.SphereGeometry(1, 20, 14), toon(SKN)); fist.scale.set(0.05, 0.032, 0.036);
        fist.position.copy(SW.localToWorld(new THREE.Vector3(Math.cos(a) * 0.19, Math.sin(a) * 0.19, 0.03))); fist.quaternion.copy(SW.quaternion); fist.rotateZ(a - Math.PI / 2); G.add(fist);
        const thumb = new THREE.Mesh(new THREE.CapsuleGeometry(0.01, 0.026, 4, 10), toon(SKN)); thumb.position.copy(SW.localToWorld(new THREE.Vector3(Math.cos(a) * 0.15, Math.sin(a) * 0.15, 0.03)));
        thumb.quaternion.copy(SW.quaternion); thumb.rotateZ(a); G.add(thumb);
        const wrist = onRim.clone().add(new THREE.Vector3(side * 0.02, -0.05, 0.07)), elbow = new THREE.Vector3(-0.37 + side * 0.27, 0.70, -0.12);
        limb(wrist, onRim.clone().add(new THREE.Vector3(0, -0.01, 0.03)), 0.024, 0.022, SKN);
        limb(elbow, wrist, 0.05, 0.036, '#2b3350');
      }
    }
    // front seats (cushion, back reclined, headrest on posts) and rear bench
    for (const sx of [-0.37, 0.37]) {
      rbox(0.52, 0.14, 0.52, 0.05, PAL.seat, sx, 0.5, -0.06);
      const back = new THREE.Group(); back.position.set(sx, 0.55, 0.22); back.rotation.x = -0.2; G.add(back);
      const bm = new THREE.Mesh(new RB(0.5, 0.52, 0.13, 3, 0.05), toon(PAL.seat)); bm.position.set(0, 0.26, 0); back.add(bm);
      const bol = new THREE.Mesh(new RB(0.08, 0.42, 0.17, 3, 0.035), toon(PAL.seatHi)); for (const bs of [-1, 1]) { const b2 = bol.clone(); b2.position.set(bs * 0.23, 0.24, -0.03); back.add(b2); }
      const hr = new THREE.Mesh(new RB(0.27, 0.19, 0.1, 3, 0.045), toon(PAL.seatHi)); hr.position.set(0, 0.5, 0.03); back.add(hr);
      for (const px of [-0.07, 0.07]) { const pst = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.1, 8), toon(PAL.metal)); pst.position.set(px, 0.43, 0.03); back.add(pst); }
    }
    rbox(1.42, 0.16, 0.55, 0.05, PAL.seat, 0, 0.5, 1.0); rbox(1.42, 0.62, 0.14, 0.05, PAL.seat, 0, 0.85, 1.3, -0.22);
    for (const hx of [-0.45, 0.45]) rbox(0.25, 0.16, 0.09, 0.04, PAL.seatHi, hx, 1.26, 1.38, -0.22);
    // seat belts: each on the OUTBOARD shoulder (her right, the driver's left), from the B-pillar anchor across the chest to the inboard buckle
    ribbon([[0.70, 1.24, BP + 0.02], [0.62, 1.12, 0.25], [0.52, 1.0, 0.1], [0.36, 0.82, 0.0], [0.17, 0.62, -0.02]], 0.05, [0, 0.3, -1], PAL.belt);   // hers
    ribbon([[0.17, 0.62, -0.02], [0.42, 0.62, -0.06], [0.66, 0.6, 0.05]], 0.05, [0, 1, 0], PAL.belt);
    // the driver's belt hangs on its pillar (nobody is drawn in the driver's seat: the driver is the camera)
    ribbon([[-0.70, 1.24, BP + 0.02], [-0.69, 0.95, BP], [-0.68, 0.62, 0.3]], 0.05, [1, 0, 0], PAL.belt);
    box(0.04, 0.08, 0.03, PAL.metal, 0.15, 0.62, -0.02); box(0.04, 0.08, 0.03, PAL.metal, -0.15, 0.62, -0.02);   // buckles
    // the hood beyond the windshield (body colour), its edge catching the sky
    quad([[-0.85, 0.93, WB - 0.05], [0.85, 0.93, WB - 0.05], [0.8, 0.86, -2.65], [-0.8, 0.86, -2.65]], PAL.body);
    // the outside of the doors under the windows is not seen; a dark glass plane keeps the windows' depth closed for the edge pass
  }

  // ------------------------------------------------------------------ her: the back / over-the-shoulder proxy (toon), seen only at the start
  const PROXY = new THREE.Group(); scene.add(PROXY);
  function buildProxy() {
    const rim = (m, hex, k) => { m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', `gl_FragColor.rgb += vec3(${C(hex).toArray().map((v) => v.toFixed(3)).join(',')}) * ${k.toFixed(2)} * pow(1.0 - abs(dot(normalize(normal), normalize(vViewPosition))), 2.5);\n#include <dithering_fragment>`); }; return m; };
    const hairM = rim(toon('#141725'), '#8a8fd8', 0.9), jk = rim(toon(PAL.jacket), '#9aa6e0', 0.35), orn = toon(PAL.orange), add = (g, m, x, y, z, sx = 1, sy = 1, sz = 1, rx = 0, ry = 0, rz = 0) => { const k = new THREE.Mesh(g, m); k.position.set(x, y, z); k.scale.set(sx, sy, sz); k.rotation.set(rx, ry, rz); PROXY.add(k); return k; };
    const hx = HER.x, hy = HER.y, hz = HER.z;
    // hair from behind: a lathe shell (crown to below the shoulders, open at the face) with drawn streaks and the anime highlight ring
    const hc = document.createElement('canvas'); hc.width = 256; hc.height = 256; const hg = hc.getContext('2d'); hg.fillStyle = '#161927'; hg.fillRect(0, 0, 256, 256);
    let sd = 7; const rnd = () => ((sd = (sd * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < 90; i++) { const x = rnd() * 256, w = 0.6 + rnd() * 1.8; hg.strokeStyle = rnd() < 0.5 ? 'rgba(52,58,92,0.8)' : 'rgba(6,7,12,0.8)'; hg.lineWidth = w; hg.beginPath(); hg.moveTo(x, 20 + rnd() * 30); hg.bezierCurveTo(x + (rnd() - 0.5) * 10, 100, x + (rnd() - 0.5) * 14, 180, x + (rnd() - 0.5) * 20, 256); hg.stroke(); }
    const rg = hg.createLinearGradient(0, 36, 0, 62); rg.addColorStop(0, 'rgba(110,116,170,0)'); rg.addColorStop(0.5, 'rgba(110,116,170,0.55)'); rg.addColorStop(1, 'rgba(110,116,170,0)'); hg.fillStyle = rg; hg.fillRect(0, 36, 256, 26);
    const htex = new THREE.CanvasTexture(hc); htex.flipY = false; htex.colorSpace = THREE.NoColorSpace; htex.wrapS = THREE.RepeatWrapping; htex.repeat.set(3, 1);
    const hairS = rim(toon('#ffffff', { map: htex, side: THREE.DoubleSide }), '#8a8fd8', 0.6);
    const prof = [[0.001, 0.118], [0.03, 0.114], [0.055, 0.103], [0.075, 0.085], [0.09, 0.06], [0.098, 0.03], [0.1, 0.0], [0.1, -0.06], [0.104, -0.12], [0.115, -0.2], [0.13, -0.28], [0.14, -0.36], [0.135, -0.4]].map(([r, y]) => new THREE.Vector2(r, y));
    const lg = new THREE.LatheGeometry(prof, 48, Math.PI * 0.62, Math.PI * 1.76);   // open toward the face (-z)
    add(lg, hairS, hx, hy + 0.0, hz + 0.01, 0.9, 1, 0.95);
    add(new THREE.SphereGeometry(0.09, 24, 16), toon(PAL.hair), hx, hy + 0.0, hz - 0.005, 0.86, 1.08, 0.95);             // skull under the shell
    add(new THREE.CylinderGeometry(0.045, 0.05, 0.1, 16), toon(PAL.skin), hx, hy - 0.09, hz + 0.01);                       // neck
    add(new THREE.CapsuleGeometry(0.14, 0.22, 8, 16), jk, hx, hy - 0.32, hz + 0.05, 1.3, 1, 0.78);                          // torso, white jacket
    for (const s of [-1, 1]) {
      add(new THREE.SphereGeometry(0.07, 16, 12), jk, hx + s * 0.165, hy - 0.15, hz + 0.04, 1, 0.9, 1);                      // shoulders
      add(new THREE.CapsuleGeometry(0.05, 0.2, 6, 12), jk, hx + s * 0.2, hy - 0.29, hz + 0.0, 1, 1, 1, -0.35, 0, s * 0.1);   // upper arms
      add(new THREE.TorusGeometry(0.052, 0.012, 8, 24), orn, hx + s * 0.201, hy - 0.25, hz + 0.01, 1, 1, 1, Math.PI / 2 - 0.35, 0, s * 0.1);   // one band round each upper arm
      add(new THREE.CylinderGeometry(0.042, 0.042, 0.03, 20), orn, hx + s * 0.08, hy - 0.115, hz - 0.03, 1, 1, 1, 0, 0, Math.PI / 2);   // headphone cups round the neck
    }
    add(new THREE.TorusGeometry(0.075, 0.012, 8, 24, Math.PI), toon(PAL.black), hx, hy - 0.115, hz + 0.0, 1, 1, 1, -Math.PI / 2, 0, 0);   // the headphone band behind the neck
  }

  // ------------------------------------------------------------------ the world: road, markings, posts, poles, ground, hills, sky, page-light
  const WU = { off: { value: 0 }, page: { value: new THREE.Vector3(-1.8, 0.45, -22) }, pageA: { value: 1 } };
  const worldVS = `uniform float off; uniform float per; varying vec3 wp; void main(){ vec4 p = vec4(position,1.0);
    #ifdef USE_INSTANCING
      p = instanceMatrix * p;
    #endif
    p = modelMatrix * p; if (per > 0.0) { p.z += mod(off, per); }
    wp = p.xyz; gl_Position = projectionMatrix * viewMatrix * p; }`;
  const worldFS = `uniform vec3 col; uniform float refl; uniform float amb; uniform vec3 page; uniform float pageA; varying vec3 wp;
    void main(){ float z = -wp.z; float dx = wp.x;
      float pool = exp(-pow(dx / (1.3 + 0.05 * max(z, 0.0)), 2.0)) * smoothstep(1.0, 7.0, z) * exp(-max(z - 6.0, 0.0) / 38.0);   // low beams
      float vio = exp(-dot(wp.xz - page.xz, wp.xz - page.xz) / 9.0) * pageA;
      vec3 c = col * (amb + 1.35 * pool) + col * refl * (0.25 + 1.6 * pool) * smoothstep(2.0, 6.0, z) + vec3(0.61, 0.42, 1.0) * vio * 0.35 * (0.4 + refl);
      float fog = 1.0 - exp(-max(length(wp - cameraPosition) - 20.0, 0.0) / 160.0);
      gl_FragColor = vec4(mix(c, vec3(0.022, 0.025, 0.07), fog), 1.0); }`;
  const wmat = (hex, refl, amb, per = 0) => new THREE.ShaderMaterial({ vertexShader: worldVS, fragmentShader: worldFS, uniforms: { col: { value: C(hex) }, refl: { value: refl }, amb: { value: amb }, per: { value: per }, off: WU.off, page: WU.page, pageA: WU.pageA } });
  const W_ = new THREE.Group(); scene.add(W_);
  function buildWorld() {
    const ZN = 40, ZF = -900;
    const plane = (x0, x1, y, mat) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, ZN - ZF, 1, 60), mat); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, y, (ZN + ZF) / 2); W_.add(m); return m; };
    const { CL, LANE } = ROAD;
    plane(CL - LANE - 1.2, CL + LANE + 1.2, 0, wmat('#1a1d28', 0, 0.42));        // asphalt + shoulders
    plane(-1500, 1500, -0.03, wmat('#080a10', 0, 0.55));                          // ground
    plane(CL - LANE - 0.15, CL - LANE - 0.15 + ROAD.EDGE, 0.004, wmat('#e9e6dc', 1.0, 0.35));   // white edges
    plane(CL + LANE + 0.05, CL + LANE + 0.05 + ROAD.EDGE, 0.004, wmat('#e9e6dc', 1.0, 0.35));
    // yellow centre dashes (moving)
    const NDa = 80, dg = new THREE.PlaneGeometry(ROAD.DW, ROAD.DASH); dg.rotateX(-Math.PI / 2);
    const dm = new THREE.InstancedMesh(dg, wmat('#f2cf6e', 1.1, 0.4, ROAD.PER), NDa); const M4 = new THREE.Matrix4();
    for (let k = 0; k < NDa; k++) { M4.makeTranslation(CL, 0.005, ZN - 8 - k * ROAD.PER); dm.setMatrixAt(k, M4); } dm.frustumCulled = false; dm.layers.set(L_SKY); W_.add(dm);
    // delineator posts (white, a reflector at the top) on both shoulders every 40 m
    const PG = new THREE.BoxGeometry(0.08, 1.0, 0.08); PG.translate(0, 0.5, 0); const NP = 26;
    const pm = new THREE.InstancedMesh(PG, wmat('#c8c6c0', 0.5, 0.2, 40), NP * 2);
    for (let k = 0; k < NP; k++) { M4.makeTranslation(CL + LANE + 1.1, 0, ZN - 2 - k * 40); pm.setMatrixAt(2 * k, M4); M4.makeTranslation(CL - LANE - 1.1, 0, ZN - 22 - k * 40); pm.setMatrixAt(2 * k + 1, M4); }
    pm.frustumCulled = false; pm.layers.set(L_SKY); W_.add(pm);
    const RG = new THREE.BoxGeometry(0.085, 0.12, 0.085); RG.translate(0, 0.9, 0); const rm = new THREE.InstancedMesh(RG, wmat('#ffd27a', 2.4, 0.3, 40), NP * 2);
    for (let k = 0; k < 2 * NP; k++) { pm.getMatrixAt(k, M4); rm.setMatrixAt(k, M4); } rm.frustumCulled = false; rm.layers.set(L_SKY); W_.add(rm);
    // utility poles on the right, every 55 m (dark against the sky), wires between them
    const NPo = 16, poG = new THREE.CylinderGeometry(0.13, 0.16, 9, 8); poG.translate(0, 4.5, 0); const arm = new THREE.BoxGeometry(2.0, 0.12, 0.12); arm.translate(0, 8.4, 0);
    const pg = new THREE.InstancedMesh(poG, wmat('#202330', 0.0, 0.5, 55), NPo), ag = new THREE.InstancedMesh(arm, wmat('#202330', 0.0, 0.5, 55), NPo);
    for (let k = 0; k < NPo; k++) { M4.makeTranslation(CL + LANE + 7.5, 0, ZN - 10 - k * 55); pg.setMatrixAt(k, M4); ag.setMatrixAt(k, M4); } pg.frustumCulled = ag.frustumCulled = false; pg.layers.set(L_SKY); ag.layers.set(L_SKY); W_.add(pg); W_.add(ag);
    const wire = []; for (let k = 0; k < NPo - 1; k++) for (const wx of [-0.85, 0.85]) { const z0 = ZN - 10 - k * 55; for (let i = 0; i < 12; i++) { const a = i / 12, b = (i + 1) / 12, sag = (u) => 8.4 - 0.9 * 4 * u * (1 - u);
      wire.push(CL + LANE + 7.5 + wx, sag(a), z0 - a * 55, CL + LANE + 7.5 + wx, sag(b), z0 - b * 55); } }
    const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(wire, 3)); const wl = new THREE.LineSegments(wg, wmat('#2a2e40', 0, 0.6, 55)); wl.frustumCulled = false; wl.layers.set(L_SKY); W_.add(wl);
    // hills: a ring of low dark hills far away
    const NH = 360, hp = [], hi = []; const hh = (a) => 14 + 10 * Math.sin(a * 3.1 + 1) + 7 * Math.sin(a * 7.3 + 2) + 4 * Math.sin(a * 17.1) + 2 * Math.sin(a * 41.7);
    for (let i = 0; i <= NH; i++) { const a = (i / NH) * Math.PI * 2, r = 700, x = Math.sin(a) * r, z = -Math.cos(a) * r; hp.push(x, -2, z, x, Math.max(2, hh(a)), z); if (i < NH) hi.push(2 * i, 2 * i + 2, 2 * i + 1, 2 * i + 1, 2 * i + 2, 2 * i + 3); }
    const hgeo = new THREE.BufferGeometry(); hgeo.setAttribute('position', new THREE.Float32BufferAttribute(hp, 3)); hgeo.setIndex(hi);
    const hills = new THREE.Mesh(hgeo, new THREE.MeshBasicMaterial({ color: C('#06070c'), side: THREE.DoubleSide })); hills.userData.follow = true; W_.add(hills); HILLS = hills;
  }
  let HILLS = null, SKY = null, PAGE = null;
  function buildSky(skyImg) {
    const tex = new THREE.Texture(skyImg); tex.flipY = false; tex.wrapS = THREE.MirroredRepeatWrapping; tex.wrapT = THREE.ClampToEdgeWrapping; tex.colorSpace = THREE.NoColorSpace; tex.needsUpdate = true;
    const m = new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false, uniforms: { tex: { value: tex }, yawOff: { value: 0 } },
      vertexShader: `varying vec3 d; void main(){ d = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); gl_Position.z = gl_Position.w * 0.99999; }`,
      fragmentShader: `uniform sampler2D tex; uniform float yawOff; varying vec3 d; const float num_sky = ${num('sky', 0.45).toFixed(3)};
        void main(){ vec3 n = normalize(d); float yaw = atan(n.x, -n.z) + yawOff; float el = asin(clamp(n.y, -1.0, 1.0));
          float u = yaw / radians(150.0) + 0.5; float v = 1.0 - el / radians(36.0);
          vec2 uv = vec2(abs(mod(u + 1.0, 2.0) - 1.0) * 0.62, clamp(v, 0.0, 1.0) * 0.43);
          vec3 s = texture2D(tex, uv).rgb * num_sky * smoothstep(-0.02, 0.04, el);
          s *= mix(1.0, 0.35, smoothstep(radians(30.0), radians(55.0), el));
          vec3 haze = vec3(0.10, 0.12, 0.24) * exp(-max(el, 0.0) * 9.0) + vec3(0.03, 0.03, 0.08) * exp(-max(el, 0.0) * 2.5);
          gl_FragColor = vec4(s * vec3(0.92, 0.94, 1.05) + haze, 1.0); }` });
    SKY = new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), m); SKY.layers.set(L_SKY); SKY.renderOrder = -10; SKY.frustumCulled = false; scene.add(SKY);
  }
  function buildPage() {   // the violet page-light (film.js pageLight drawn into a sprite texture)
    const cv = document.createElement('canvas'); cv.width = cv.height = 512; const g = cv.getContext('2d'), c = 256, h = 72, w = 0.74 * h;
    const glow = (r, col, a) => { const gr = g.createRadialGradient(c, c, 0, c, c, r); gr.addColorStop(0, `rgba(255,255,255,${a})`); gr.addColorStop(0.22, col.replace('A', 0.85 * a)); gr.addColorStop(1, col.replace('A', 0)); g.fillStyle = gr; g.beginPath(); g.arc(c, c, r, 0, 6.2832); g.fill(); };
    glow(h * 3.2, 'rgba(155,107,255,A)', 0.55);
    g.shadowColor = '#9B6BFF'; g.shadowBlur = h * 0.6; g.fillStyle = 'rgba(240,234,255,0.95)'; g.fillRect(c - w / 2, c - h / 2, w, h); g.shadowBlur = 0;
    g.strokeStyle = 'rgba(155,107,255,0.9)'; g.lineWidth = Math.max(1, h * 0.035); g.beginPath();
    for (let k = 1; k <= 4; k++) { const yy = c - h / 2 + h * (0.2 + 0.17 * k); g.moveTo(c - w / 2 + w * 0.12, yy); g.lineTo(c + w / 2 - w * 0.1, yy); }
    g.moveTo(c - w / 2 + w * 0.22, c - h / 2 + h * 0.08); g.lineTo(c - w / 2 + w * 0.22, c + h / 2 - h * 0.06); g.stroke();
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.NoColorSpace;
    PAGE = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, fog: false })); PAGE.layers.set(L_SKY); PAGE.renderOrder = 5;
    PAGE.scale.setScalar(0.55 * 512 / h); scene.add(PAGE);
  }
  // outro.js roadPage(tt), in this world: on the centre line, ~22 m ahead of the driver's eye, 0.45 m up
  const pagePos = (t) => { const tt = t - TM.road0; return { p: new THREE.Vector3(ROAD.CL + 0.25 * Math.sin(tt * 1.3), 0.45 + 0.08 * Math.sin(tt * 2.1), EYE.z - (22 + 2.5 * Math.sin(tt * 0.9))), rot: 0.12 * Math.sin(tt * 1.4) }; };

  // ------------------------------------------------------------------ her card (car_confess cut-out), fixed to the final camera
  let CARD = null, MASK = null; const cardTex = [new THREE.Texture(), new THREE.Texture()]; const herCache = new Map();
  function buildCard() {
    const m = new THREE.ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false, uniforms: { a: { value: cardTex[0] }, b: { value: cardTex[1] }, f: { value: 0 }, op: { value: 1 } },
      vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform sampler2D a; uniform sampler2D b; uniform float f; uniform float op; varying vec2 vUv;
        void main(){ vec2 uv = vec2(vUv.x, 1.0 - vUv.y); vec4 p = texture2D(a, uv), q = texture2D(b, uv); vec4 c = mix(p, q, f); gl_FragColor = vec4(c.rgb, c.a * op * smoothstep(0.0, 0.04, vUv.y)); }` });
    CARD = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), m); CARD.layers.set(L_SKY); CARD.renderOrder = 20; scene.add(CARD);
    MASK = new THREE.Mesh(CARD.geometry, new THREE.ShaderMaterial({ uniforms: { a: { value: cardTex[0] } }, vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }`,
      fragmentShader: `uniform sampler2D a; varying vec2 vUv; void main(){ if (texture2D(a, vec2(vUv.x, 1.0 - vUv.y)).a < 0.35) discard; gl_FragColor = vec4(0.5, 0.5, 0.5, -1.0); }`, depthTest: false, depthWrite: false }));
    MASK.layers.set(L_MASK); MASK.renderOrder = 20; scene.add(MASK);
    // place: d metres along the final view direction from the eye, filling the final frustum (so the plate's framing is the final frame)
    const F = camAt(TM.panB), d = 0.8, hh = 2 * d * Math.tan(F.vfov * D2R / 2), ww = hh * W / H;
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(F.q), up = new THREE.Vector3(0, 1, 0).applyQuaternion(F.q);
    for (const k of [CARD, MASK]) { k.position.copy(F.p).addScaledVector(dir, d); k.quaternion.copy(F.q); k.scale.set(ww, hh, 1); }
  }
  async function herFrame(i) { i = Math.max(0, Math.min(120, i)); if (herCache.has(i)) return herCache.get(i);
    const p = (async () => { const r = await fetch(`${base}/work_fable/take2/kit/car_confess/clean/f_${String(i + 1).padStart(4, '0')}.png`); return await createImageBitmap(await r.blob(), { imageOrientation: 'none', premultiplyAlpha: 'none' }); })();
    herCache.set(i, p); if (herCache.size > 6) herCache.delete(herCache.keys().next().value); return p; }

  // ------------------------------------------------------------------ the camera
  const qOf = (yaw, pitch) => new THREE.Quaternion().setFromEuler(new THREE.Euler(pitch * D2R, -yaw * D2R, 0, 'YXZ'));   // yaw + = to the right
  const V3 = (a) => new THREE.Vector3(...a);
  function camAt(t) {
    let p, yaw, pitch, vfov;
    if (!V8) {
      // v9: fixed at the driver's eye; looking down the road (a slight settle from yaw -2), then a pure pan onto her
      const uP = sm(seg(t, TM.panA, TM.panB));
      p = V3(CAM.E.p);
      const yaw0 = lerp(-2, 0, sm(seg(t, TM.t0, TM.panA))), pit0 = -2;
      yaw = lerp(yaw0, CAM.F.yaw, uP); pitch = lerp(pit0, CAM.F.pitch, uP);
      vfov = lerp(CAM.E.vfov, CAM.F.vfov, uP);
      vfov *= lerp(1, CAM.F.push, sm(seg(t, TM.panB, TM.t1)));
      const vib = 0.0012 * Math.sin(t * 37.0) + 0.0008 * Math.sin(t * 23.3 + 1);
      p = p.add(new THREE.Vector3(0, vib * (1 - seg(t, TM.panA - 0.3, TM.panA + 0.3)), 0));   // road vibration only while she is out of frame
    } else {
    const uH = seg(t, TM.t0, TM.holdEnd), uD = smr(seg(t, TM.holdEnd, TM.dollyEnd)), uP = smr(seg(t, TM.panA, TM.panB));
    const pA = V3(CAM.A0.p).lerp(V3(CAM.A1.p), sm(uH));
    // dolly: quadratic bezier A1 -> M -> E
    const b0 = V3(CAM.A1.p), b1 = V3(CAM.M.p), b2 = V3(CAM.E.p); const bz = (u) => b0.clone().multiplyScalar((1 - u) * (1 - u)).addScaledVector(b1, 2 * u * (1 - u)).addScaledVector(b2, u * u);
    p = t < TM.holdEnd ? pA : bz(uD);
    // yaw/pitch: A -> (dolly drifts the view to straight ahead) -> pan to F
    const yawA = CAM.A0.yaw, pitA = CAM.A0.pitch;
    const yaw0 = lerp(yawA, 0, uD), pit0 = lerp(pitA, -2, uD);
    yaw = lerp(yaw0, CAM.F.yaw, uP); pitch = lerp(pit0, CAM.F.pitch, uP);
    vfov = lerp(lerp(CAM.A0.vfov, CAM.E.vfov, uD), CAM.F.vfov, uP);
    vfov *= lerp(1, CAM.F.push, sm(seg(t, TM.panB, TM.t1)));   // a slow push in after landing
    // the car's ride: a little road vibration (the eye, not the card's frame: kept tiny)
    const vib = 0.0012 * Math.sin(t * 37.0) + 0.0008 * Math.sin(t * 23.3 + 1);
    if (t < TM.swap) p = p.clone().add(new THREE.Vector3(0, vib, 0));
    }
    if (Q.get('dcam')) { const v = Q.get('dcam').split(',').map(Number); p = new THREE.Vector3(v[0], v[1], v[2]); yaw = v[3]; pitch = v[4]; vfov = v[5]; }   // dev: a fixed camera
    return { p, q: qOf(yaw, pitch), vfov, yaw, pitch };
  }

  // ------------------------------------------------------------------ edge pass (ink) and accumulation (motion blur)
  const nrmMat = new THREE.ShaderMaterial({ vertexShader: `varying vec3 vn; varying float vd; void main(){ vec4 mv = modelViewMatrix * vec4(position,1.0);
      #ifdef USE_INSTANCING
        mv = modelViewMatrix * instanceMatrix * vec4(position,1.0);
      #endif
      vn = normalize(normalMatrix * normal); vd = -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vn; varying float vd; void main(){ vec3 n = normalize(vn); if (!gl_FrontFacing) n = -n; gl_FragColor = vec4(n * 0.5 + 0.5, vd); }`, side: THREE.DoubleSide });
  const fsq = (fs, uniforms, extra = {}) => { const m = new THREE.ShaderMaterial({ uniforms, vertexShader: `varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }`, fragmentShader: fs, depthTest: false, depthWrite: false, ...extra });
    const s = new THREE.Scene(), q = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), m); q.frustumCulled = false; s.add(q); return { s, m }; };
  const ORTHO = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const comp = fsq(`uniform sampler2D col; uniform sampler2D nrm; uniform vec2 px; uniform float w; uniform float dbg; varying vec2 vUv;
    vec4 N(vec2 o){ return texture2D(nrm, vUv + o * px); }
    void main(){ vec4 c0 = N(vec2(0.0)); vec3 col = texture2D(col, vUv).rgb;
      float e = 0.0; bool masked = c0.a < 0.0; float id0 = c0.a > 0.0 ? 1.0 / c0.a : 0.0;
      vec2 O[4]; O[0] = vec2(1.0, 0.0); O[1] = vec2(0.0, 1.0); O[2] = vec2(1.0, 1.0); O[3] = vec2(1.0, -1.0);
      for (int k = 0; k < 4; k++) { vec4 a = N(O[k] * w), b = N(-O[k] * w); if (a.a < 0.0 || b.a < 0.0) { masked = true; continue; }
        float ia = a.a > 0.0 ? 1.0 / a.a : 0.0, ib = b.a > 0.0 ? 1.0 / b.a : 0.0;
        float lap = abs(ia + ib - 2.0 * id0) / max(max(id0, max(ia, ib)), 1e-4);
        float dz = smoothstep(0.04, 0.12, lap);
        float dn = smoothstep(0.35, 0.65, 1.0 - dot(a.xyz * 2.0 - 1.0, b.xyz * 2.0 - 1.0)) * step(0.0, -1.0 + 2.0 * step(0.001, a.a * b.a)) ;
        float near = smoothstep(60.0, 8.0, min(min(a.a, b.a), c0.a > 0.0 ? c0.a : 1e9));
        e = max(e, max(dz, dn * near)); }
      if (masked) e = 0.0;
      if (dbg > 0.5) { gl_FragColor = vec4(c0.rgb * step(0.0, c0.a), 1.0); return; } if (dbg > 0.0) { gl_FragColor = vec4(vec3(e), 1.0); return; }
      gl_FragColor = vec4(mix(col, vec3(0.012, 0.014, 0.03), 0.92 * e), 1.0); }`,
    { col: { value: rtCol.texture }, nrm: { value: rtNrm.texture }, px: { value: new THREE.Vector2(1 / W, 1 / H) }, w: { value: num('ink', 1.8) }, dbg: { value: num('dbg', 0) } });
  const accum = fsq(`uniform sampler2D src; uniform float k; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(src, vUv).rgb * k, 1.0); }`, { src: { value: null }, k: { value: 1 } }, { blending: THREE.AdditiveBlending, transparent: true });
  const rtTmp = new THREE.WebGLRenderTarget(W, H, { type: THREE.HalfFloatType });
  const out = fsq(`uniform sampler2D src; varying vec2 vUv; void main(){ vec3 c = texture2D(src, vUv).rgb; gl_FragColor = vec4(c, 1.0); }`, { src: { value: rtAcc.texture } });

  function setScene(t) {
    const cm = camAt(t); camera.position.copy(cm.p); camera.quaternion.copy(cm.q); camera.fov = cm.vfov; camera.updateProjectionMatrix(); camera.updateMatrixWorld();
    const dist = ROAD.V * (t - TM.road0); WU.off.value = dist;
    if (SKY) SKY.position.copy(camera.position); if (HILLS) HILLS.position.set(camera.position.x, 0, camera.position.z);
    const pg = pagePos(t); PAGE.position.copy(pg.p); PAGE.material.rotation = pg.rot; WU.page.value.copy(pg.p);
    const showCard = t >= TM.swap; PROXY.visible = !showCard; if (CARD) { CARD.visible = MASK.visible = showCard; }
    return cm;
  }
  function pass(t) {
    setScene(t);
    R.setRenderTarget(rtCol); R.setClearColor(0x05061a, 1); R.clear(); camera.layers.set(0); camera.layers.enable(L_SKY); R.render(scene, camera);
    R.setRenderTarget(rtNrm); R.setClearColor(new THREE.Color(0.5, 0.5, 1.0), 0); R.clear(); scene.overrideMaterial = nrmMat; camera.layers.set(0);
    R.render(scene, camera); scene.overrideMaterial = null;
    if (MASK && MASK.visible) { camera.layers.set(L_MASK); R.render(scene, camera); }
    camera.layers.enableAll();
    R.setRenderTarget(rtTmp); R.render(comp.s, ORTHO);
  }
  const SUB = num('sub', 6), SHUT = num('shutter', V8 ? 0.5 : 0.3) / 30;   // v9: shorter shutter (Jade's v8 'blurred mid-pan')
  async function render(t) {
    // her frames for the sub-frames' clip times (blend of the two nearest frames)
    if (t >= TM.swap - 0.1) { const c = herClip(t) * 24, i0 = Math.floor(c), f = c - i0; const [a, b] = await Promise.all([herFrame(i0), herFrame(i0 + 1)]);
      if (cardTex[0].image !== a) { cardTex[0].image = a; cardTex[0].needsUpdate = true; } if (cardTex[1].image !== b) { cardTex[1].image = b; cardTex[1].needsUpdate = true; }
      for (const tx of cardTex) { tx.flipY = false; tx.colorSpace = THREE.NoColorSpace; tx.premultiplyAlpha = false; } CARD.material.uniforms.f.value = f; }
    R.setRenderTarget(rtAcc); R.setClearColor(0x000000, 1); R.clear();
    for (let k = 0; k < SUB; k++) { const ts = t + (SUB > 1 ? ((k + 0.5) / SUB - 0.5) * SHUT : 0); pass(ts);
      R.setRenderTarget(rtAcc); accum.m.uniforms.src.value = rtTmp.texture; accum.m.uniforms.k.value = 1 / SUB; R.render(accum.s, ORTHO); }
    R.setRenderTarget(null); R.setClearColor(0x000000, 1); R.clear(); R.render(out.s, ORTHO);
    return canvas;
  }
  async function load() {
    RB = (await import('three/addons/geometries/RoundedBoxGeometry.js')).RoundedBoxGeometry;
    buildCar(); buildProxy(); buildWorld(); buildPage();
    const im = await createImageBitmap(await (await fetch(`${base}/work_fable/take2/plates/vio_wide/frames/f_0001.jpg`)).blob());
    buildSky(im); buildCard();
  }
  return { canvas, load, render, cam: camAt, TM, info: () => ({ TM, CAM, ROAD }) };
}
