// Look-dev for the WORLD (no figure; a capsule of light stands in for scale).
//   --q shot=1..5 picks a shot and t is local time; without it, shot = floor(t/10)+1 and local time = t mod 10.
//   1 (a) night, ground level   2 (b) night, top-down tree + title   3 (c) blue hour   4 (d) sunrise   5 (e) day
let TB, E, tree, R, NR, main, L, cap, lightSeeds, nearSeeds, branchRoads;
const LIVES = [
  'climbed onto the piano bench before I was three', 'second violins, school orchestra', 'kept the neurons alive, first paper 2005', 'how the brain listens, 2010',
  'wrote poems between experiments', 'stood in the wind of the giant tunnel', 'three chords and a van', 'bronze, group set', 'a full house at 2am, everyone shipping',
  'the live demo worked', 'taught the kids the Copernican model at 10:30pm', 'listened to hydrogen',
];
const LANE_HEX = ['#FF7A1A', '#FF3D7F', '#3D8BFF', '#22D3EE', '#3DDC97', '#FFD23F', '#FF6B5E', '#E24BD6'];   // 0 main, then 7 branch lanes (no violet)

export async function setup(engine) {
  E = engine; const { hex, rng } = E;
  // the tree: depth d forks are written at "time" d (so head = depth reveals growth)
  tree = E.growTree({ levels: 10, seed: 23, fan: 150, r0: 150, q: 0.795, trunk: 420, timeOfDepth: (d) => d });
  const defs = tree.roads.map((r) => ({ ...r, color: LANE_HEX[r.lane], width: r.depth === 0 ? 0.035 : 0.028,
    text: r.depth === 0 ? 'every road I ran becomes the one  ·  nothing that I lived can come undone' : 'jade/' + ['piano', 'violin', 'wet-lab', 'phd', 'poet', 'nasa-ames', 'robot-ninja-apocalypse', 'wushu', 'chez-jj', 'sandstorm', 'home', 'kitchen-table'][r.index % 12] + '  ' + LIVES[r.index % 12],
    textSize: r.depth === 0 ? 0.36 : 0.34, textSide: 1, flip: r.depth === 0, nodes: [{ u: 1, r: r.depth === 0 ? 0.55 : 0.4 }] }));
  R = E.roads(defs, { step: 1.5, maxGlyphs: 900000 });
  // top-down framing box for the whole tree (east is screen-up; frame is 16:9, fov 35)
  { let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9; for (const r of tree.roads) for (const p of r.pts) { if (r.depth === 0) continue; x0 = Math.min(x0, p[0]); x1 = Math.max(x1, p[0]); z0 = Math.min(z0, p[1]); z1 = Math.max(z1, p[1]); }
    x0 -= 150; const k = 2 * Math.tan((35 * Math.PI) / 360); const hNeed = Math.max((x1 - x0) * 1.08 / k, ((z1 - z0) * 1.08) / (k * 16 / 9));
    TB = { cx: x0 + (hNeed * k) / 2 - 0.02 * hNeed * k, cz: (z0 + z1) / 2, h: hNeed, x0 }; }
  main = R.roads[0];
  branchRoads = R.roads.filter((r) => r.def.depth >= 2);
  // a dozen nearer branches: they leave main around the camera and wander off into the night
  const near = []; const NAMES = ['piano', 'violin', 'wet-lab', 'phd', 'poet', 'nasa-ames', 'robot-ninja-apocalypse', 'wushu', 'chez-jj', 'sandstorm', 'home', 'kitchen-table'];
  for (let i = 0; i < 12; i++) { const side = i % 2 ? 1 : -1, x0 = -52 + i * 11 + 6 * rng.hash1(i + 40), ang = (14 + 30 * rng.hash1(i + 70)) * (Math.PI / 180), len = 180 + 260 * rng.hash1(i + 90); const pts = [[x0, 0]]; let x = x0, z = 0;
    for (let k = 1; k <= 10; k++) { const u = k / 10; const a = ang * (1 - Math.exp(-u * 3)) + 0.16 * rng.fbm1(u * 2.2, i + 3, 2) * u; x += Math.cos(a) * len / 10; z += side * Math.sin(a) * len / 10; pts.push([x, z]); }
    near.push({ pts, color: LANE_HEX[1 + (i * 3) % 7], width: 0.028, text: 'jade/' + NAMES[i] + '  ' + LIVES[i], textSize: 0.34, textSide: 1, flip: true, textStart: 4, nodes: [{ s: 0, r: 0.16 }], g: [0, 1] }); }
  NR = E.roads(near, { step: 0.75 });
  nearSeeds = [...Array(60)].map((_, i) => ({ road: NR.roads[i % 12], ph: rng.hash1(i * 17 + 3), sp: 1.2 + 1.5 * rng.hash1(i * 5 + 1), br: 0.7 + 1.0 * rng.hash1(i * 29 + 4) }));
  L = E.lights(4096); cap = E.capsule({ n: 14000, radius: 0.19 });
  lightSeeds = [...Array(1400)].map((_, i) => ({ road: branchRoads[Math.floor(rng.hash1(i * 7 + 1) * branchRoads.length)], ph: rng.hash1(i * 13 + 5), sp: 1.5 + 3.5 * rng.hash1(i * 3 + 9), br: 0.5 + 1.5 * Math.pow(rng.hash1(i * 11 + 2), 2) }));
}

function lightsAt(t, n, gain = 1, nNear = 60) {
  const { hex } = E; const data = new Float32Array((n + nNear) * 7); let k = 0;
  const put = (s, g) => { const r = s.road; const u = (s.ph + (t * s.sp) / r.len) % 1; const a = r.at(u * r.len); const c = hex(r.def.color);
    data.set([a.x, 1.25, a.z, (c[0] + 0.12) * g * s.br, (c[1] + 0.12) * g * s.br, (c[2] + 0.12) * g * s.br, 0.085], k * 7); k++; };
  for (let i = 0; i < n; i++) put(lightSeeds[i], 5 * gain);
  for (let i = 0; i < nNear; i++) put(nearSeeds[i], 7 * gain);
  return L.drawable(data, k, { minPx: 1.0 });
}
const shiftWords = (id, dt) => E.time.words(id).map((w) => ({ w: w.w, start: w.start - dt, end: w.end - dt }));

export function frame(t) { const F = frame_(t); const h = E.Q.get('hide'); if (h) { const ks = h.split(',').map(Number); F.drawables = F.drawables.filter((_, i) => !ks.includes(i)); if (ks.includes(9)) F.type = []; } return F; }
function frame_(t) {
  const shot = E.Q.has('shot') ? +E.Q.get('shot') : Math.floor(t / 10) + 1; const u = E.Q.has('shot') ? t : t % 10;
  const { hex } = E;
  if (shot === 1) {
    // (a) NIGHT, ground level on main, looking east down the road. Hundreds of other branches are lights on their own roads.
    const cx = -64 + u * 0.55; const figX = cx + 10.8 - u * 0.25;
    return {
      camera: { pos: [cx, 2.35, -1.9], target: [cx + 40, 0.9, 1.8], fov: 35, focusDist: 8.5, aperture: 0.11 },
      env: { dawn: 0.0, ground: { fogDist: 3200 }, grade: { exposure: 1.5, bloom: 0.6, streak: 0.22, vignette: 0.36, saturation: 1.1 } },
      drawables: [R.drawable({ head: 99, gain: 3.2, textGain: 0.7, flow: 0.12 }), NR.drawable({ head: 99, gain: 3.0, textGain: 0.7, flow: 0.12 }), lightsAt(u, 900), cap.drawable({ pos: [figX, 0, 0.9], size: 0.0035, color: hex('#FF7A1A').map((c) => c * 2.0 + 0.2) })],
      type: [{ words: shiftWords(2, 33.0), font: 'serif', size: 3.3, pos: [22, 3.4, -17.5], right: [0.10, 0, 0.995], rows: [3, 4], leading: 1.0, align: 'left', gain: 1.6 }],
      hud: { branch: 'main', color: '#FF7A1A', ctx: 0.22 + u * 0.004, count: 1024 },
    };
  }
  if (shot === 2) {
    // (b) NIGHT, top-down. The graph grows east like a dendrite. Title in the open ground beside the trunk.
    const head = Math.min(10.6, u * 1.25);
    const count = Math.pow(2, Math.min(10, Math.floor(head)));
    return {
      camera: { pos: [TB.cx, TB.h, TB.cz], target: [TB.cx, 0, TB.cz], fov: 35, near: 10, far: 9000 },
      env: { dawn: 0.0, ground: { fogAmt: 0.0, ripple: 0.0, base: hex('#0A0F46'), f0: 0.12 }, grade: { exposure: 1.3, bloom: 0.8, bloomThreshold: 0.8, streak: 0.0, vignette: 0.5, saturation: 1.15 } },
      drawables: [R.drawable({ head, soft: 0.02, gain: 2.3, minPx: 1.25, haloPx: 3, halo: 0.3, headGain: 3.0, headLen: 0.12, nodeMinPx: 1.6, textGain: 0 })],
      type: [{ text: 'MERGE', font: 'hook', size: TB.h * 0.068, pos: [TB.x0 + TB.h * 0.035, 0.5, TB.cz - TB.h * 0.52], right: [0, 0, 1], up: [1, 0, 0], mode: 'ground', align: 'left', gain: 1.5, t0: 0.4, wipeDur: 0.8, stagger: 0 }],
      hud: { branch: 'main', color: '#FF7A1A', count },
    };
  }
  if (shot === 3) {
    // (c) BLUE HOUR, dawn 0.35. Three-quarter view across main toward the east; the magenta-gold band is on the horizon.
    const cx = -36 + u * 0.4;
    return {
      camera: { pos: [cx, 1.5, -6.5], target: [cx + 30, 1.5, 5.0], fov: 32, focusDist: 9, aperture: 0.07 },
      env: { dawn: 0.35, ground: { fogDist: 3000 }, grade: { exposure: 1.45, bloom: 0.55, streak: 0.2, vignette: 0.32, saturation: 1.1 } },
      drawables: [R.drawable({ head: 99, gain: 3.0, textGain: 0.75, flow: 0.1 }), NR.drawable({ head: 99, gain: 2.8, textGain: 0.75, flow: 0.1 }), lightsAt(u, 800, 0.9), cap.drawable({ pos: [cx + 8.2, 0, 0.0], size: 0.0035, color: hex('#E24BD6').map((c) => c * 2.0 + 0.25) })],
      type: [{ words: shiftWords(5, 54.4), font: 'serif', size: 3.3, pos: [84, 5.2, -12], right: [-0.30, 0, 0.954], rows: [2, 2], leading: 1.0, align: 'left', gain: 1.6 }],
      hud: { branch: 'jade/poet', color: '#E24BD6', ctx: 0.61 },
    };
  }
  if (shot === 4) {
    // (d) SUNRISE, dawn 0.6. The huge sun, a gold mirror, silhouettes. The chorus line stands on the horizon as black monoliths.
    const cx = -52 + u * 0.5;
    return {
      camera: { pos: [cx, 0.9, -1.2], target: [cx + 40, 3.3, 1.9], fov: 30 },
      env: { dawn: 0.6, ground: { fogDist: 2400, rough: 1.0 }, grade: { exposure: 1.05, bloom: 0.6, bloomThreshold: 1.2, streak: 0.1, streakThreshold: 2.5, vignette: 0.26, saturation: 1.08 } },
      drawables: [R.drawable({ head: 99, gain: 2.6, textGain: 0.9, ink: 0 }), cap.drawable({ pos: [cx + 7.5, 0, 1.55], solid: 1, color: [0.012, 0.008, 0.02] })],
      type: [{ words: shiftWords(7, 69.2), font: 'hook', size: 5.4, pos: [150, 0.05, -66], right: [0, 0, 1], rows: [2, 3], leading: 0.92, align: 'left', ink: 1, inkColor: '#1A0B22', reflGain: 1 }],
      hud: { branch: 'main', color: '#FF7A1A', ctx: 0.4, count: 1024 },
    };
  }
  // (e) DAY, dawn 1.0. Ink roads on the pale mirror, ink type. For the first time you can see what the night wrote.
  const cx = -40 + u * 0.6;
  return {
    camera: { pos: [cx, 4.6, -7.5], target: [cx + 40, 0.2, 5.5], fov: 34 },
    env: { dawn: 1.0, ground: { fogDist: 6000 }, grade: { exposure: 1.75, bloom: 0.2, bloomThreshold: 4.5, streak: 0, vignette: 0.12, saturation: 1.18, grain: 0.02, contrast: 1.05 } },
    drawables: [R.drawable({ head: 99, minPx: 2.4, haloPx: 0 }), NR.drawable({ head: 99, minPx: 2.4, haloPx: 0 }), cap.drawable({ pos: [cx + 10.5, 0, 0.0], solid: 1, color: [0.02, 0.018, 0.05] })],
    type: [{ words: shiftWords(23, 228.5), font: 'hook', size: 6.0, pos: [150, 0.1, -24], right: [0.05, 0, 0.9987], rows: [4, 3], leading: 0.92, align: 'left' }],
    hud: { branch: 'main', color: '#FF7A1A', ctx: 1.0, count: 1 },
  };
}
