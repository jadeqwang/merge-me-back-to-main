#!/usr/bin/env node
// EDL check (no GPU, no plates needed): loads engine/show/main.js with the real timing (analysis_v2) and a picks.json under node, samples every
// shot's draw / camera / clock functions over the film with a mock canvas, and reports exceptions, non-finite drawing args, coverage gaps and
// HELD FRAMES: for every plate clock the engine runs (lattice main plate, fork copies with their own clock, screens, panes, a panels back
// plate, the forktree's copy clocks) the frame it would show against the take's real length. A clip time past the take's last frame
// ((n - 1) / 24) holds that frame (a freeze, which Jade does not want); one below 0 holds the first.
//   node tools/edl_check.mjs [--q="drop=v5&orch=v4"] [--picks=work/picks.json] [--fake=allnew | --fake=shot[:s0],...] [--len] [--list] [--rates]
//        [--from=0] [--to=297] [--quiet] [--logs]
// ?drop=real (engine/show/real_ws.js): --fake=real pretends the box prepped every real_ws_<seg> plate (15 fps, the segment's length, six performers
// split by tools/prep/lanes.py, evenly spaced); --fake=realref pretends a motion-reference take dr_real_ref_<seg> is picked for every segment.
// Without them ?drop=real must fall back to the default drop (no plates here).
// Take lengths: work/plates/<take>/meta.json (the box), else picks `len`, else review/cloud/takes/<take>.mp4 (ffprobe), else the billed seconds
// in docs/spend_ledger.jsonl, else the shot's spec duration (tools/sd SHOTS). --fake=allnew pretends every queued v5 shot is picked (its spec's
// audio window, lag 0, its spec length); --len adds picks.py's `len` to every pick. Run it after picks.py: expect "held-clocks 0".
process.removeAllListeners("warning");   // engine/package.json has no "type": "module" (the browser loads it), so node warns on every import
import fs from 'node:fs'; import os from 'node:os'; import path from 'node:path'; import url from 'node:url'; import { execFileSync } from 'node:child_process';
const REPO = path.resolve(path.dirname(url.fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (k, d) => { const a = args.find((x) => x.startsWith(`--${k}=`)); return a ? a.slice(k.length + 3) : d; };
const edl = path.join(REPO, 'engine/show/main.js'), query = opt('q', '');
const picksFile = opt('picks', fs.existsSync(path.join(REPO, 'work/picks.json')) ? path.join(REPO, 'work/picks.json') : path.join(REPO, 'review/cloud/picks/picks.json'));
const picks = JSON.parse(fs.readFileSync(picksFile, 'utf8'));
// ---- take lengths in frames (24 fps; a Seedance take of s seconds has 24 s + 1 frames)
const DUR = { take: {}, shot: {}, spec: {} };
for (const line of fs.readFileSync(path.join(REPO, 'docs/spend_ledger.jsonl'), 'utf8').split('\n')) {
  if (!line.trim()) continue; const r = JSON.parse(line);
  if (r.model !== 'bytedance/seedance-2.5' || r.event !== 'result' || !r.ok || !r.job) continue;
  const [tag, h] = [r.job.split('/')[1].replace(/-[0-9a-f]+$/, ''), r.job.split('-').pop()]; DUR.take[`${tag}_${h}`] = 24 * Math.round(r.est_usd / .2312) + 1;
}
try {   // spec durations and audio windows (batch.py --timing=v2, the default: sung shots use the A2 windows)
  const py = 'import importlib.util,json,sys; sys.path.insert(0,"tools/sd"); s=importlib.util.spec_from_file_location("b","tools/sd/batch.py"); b=importlib.util.module_from_spec(s); s.loader.exec_module(b); '
    + 'print(json.dumps({k:{"n":24*v["dur"]+1,"a0":((v["audio"][1] if v.get("v2") else b.A2.get(k)) if v.get("audio") else None)} for k,v in b.SHOTS.items()}))';
  const o = JSON.parse(execFileSync('python3', ['-c', py], { cwd: REPO, stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim().split('\n').pop());
  for (const [k, v] of Object.entries(o)) { DUR.shot[k] = v.n; DUR.spec[k] = { a0: v.a0, timing: 'v2' }; }
} catch (e) { console.log('  (no spec durations: ' + e.message.split('\n')[0] + ')'); }
const measured = (tk) => {
  const meta = path.join(REPO, 'work/plates', tk, 'meta.json'); if (fs.existsSync(meta)) return JSON.parse(fs.readFileSync(meta, 'utf8')).n;
  const mp4 = path.join(REPO, 'review/cloud/takes', tk + '.mp4');
  if (fs.existsSync(mp4)) try { return +execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_packets', '-show_entries', 'stream=nb_read_packets', '-of', 'csv=p=0', mp4]).toString().trim().replace(/,$/, ''); } catch { /* no ffprobe */ }
  return null; };
const NEW = ['ch2_catch', 'ch2_gone_close', 'out_main', 'ch1_main', 'bd_ahh', 'v2_horizon', 'intro_up', 'bd_float', 'orch_wide', 'orch_line', 'orch_keys', 'orch_pencil', 'orch_guitar',
  'dr_dl_wide', 'dr_dl_close', 'dr_gs_ranks', 'dr_gs_tornado', 'dr_gs_ring', 'dr_gs_salute', 'pc_send_v'];
// --fake=allnew: every queued v5 shot picked, s0 = its spec's audio window (lag 0) in the spec's timing, as picks.py would write it
let fake = opt('fake', ''); if (fake === 'allnew') fake = NEW.join(',');
const RWS = await import(url.pathToFileURL(path.join(REPO, 'engine/show/real_ws.js')).href);
const REALFAKE = {};   // --fake=real: '/work/plates/real_ws_<seg>[_p<k>]/meta.json' -> a meta as prep.py + lanes.py write it
if (fake.split(',').includes('real')) for (const [seg, S] of Object.entries(RWS.SEGS)) {
  const fps = RWS.SRC.fps, n = Math.round((S.out - S.in) * fps), base = `real_ws_${seg}`, order = ['white', 'mint', 'rose', 'sky', 'gold', 'violet'];
  const performers = order.map((lane, j) => ({ k: j + 1, lane, group: j % 2 ? 'cool' : 'warm', cx: Array(n).fill(+(.15 + .14 * j).toFixed(3)), cy: Array(n).fill(.62) }));
  REALFAKE[`/work/plates/${base}/meta.json`] = { w: 960, h: 540, n, fps, performers };
  for (const p of performers) REALFAKE[`/work/plates/${base}_p${p.k}/meta.json`] = { w: 960, h: 540, n, fps, performer: p.k, lane: p.lane };
  for (const b of [base, ...performers.map((p) => `${base}_p${p.k}`)]) DUR.take[b] = Math.round((n - 1) / fps * 24) + 1;   // as 24 fps frames
}
if (fake.split(',').includes('realref')) fake = fake.split(',').filter((f) => f !== 'realref').concat(Object.keys(RWS.SEGS).map((g) => `dr_real_ref_${g}`)).join(',');
for (const f of fake.split(',').filter((x) => x && x !== 'real')) {   // pretend intake + picks ran for a new shot: shot[:s0] (no s0: the spec's window)
  const [shot, s0] = f.split(':'), sp = DUR.spec[shot] || {};
  picks[shot] = { plate: `/work/plates/${shot}_t99_fake`, s0: s0 ? +s0 : sp.a0 ?? null, take: `${shot}_t99_fake`, timing: s0 ? 'v2' : sp.timing || 'v2', lag: 0,
    ...(DUR.shot[shot] ? { len: (DUR.shot[shot] - 1) / 24 } : {}) };
}
for (const p of Object.values(picks)) {   // a length per picked take (picks.py's `len` wins; --len writes it as picks.py would)
  if (!p.take || p.take.startsWith('still_')) continue;
  const n = p.len != null ? Math.round(p.len * 24) + 1 : measured(p.take); if (n) DUR.take[p.take] = n;
  if (args.includes('--len') && p.len == null) { const m = DUR.take[p.take]; if (m) p.len = (m - 1) / 24; }
}
globalThis.location = { search: query ? '?' + query : '' };
const J = (p) => JSON.parse(fs.readFileSync(path.join(REPO, p), 'utf8'));
const FILES = { '/work/picks.json': () => picks, '/analysis_v2/timing.json': () => J('analysis_v2/timing.json'), '/analysis/timing.json': () => J('analysis/timing.json'),
  '/engine/show/score_orch.json': () => J('engine/show/score_orch.json'), '/engine/fonts/bravura_glyphs.json': () => J('engine/fonts/bravura_glyphs.json') };
for (const [p, v] of Object.entries(REALFAKE)) FILES[p] = () => v;
globalThis.fetch = async (p) => { const f = FILES[p]; if (!f) throw new Error('fetch ' + p); const v = f(); return { ok: true, json: async () => v }; };
const logs = []; const clog = console.log; console.log = (...a) => logs.push(a.join(' '));
const src = fs.readFileSync(edl, 'utf8').replace(/import\('\/engine\/([^']+)'\)/g, (m, f) => `import('${url.pathToFileURL(path.join(REPO, 'engine', f)).href}')`);   // the EDL's engine modules (time.js, show/score.js)
const tmp = path.join(os.tmpdir(), `edl_check_${process.pid}.mjs`); fs.writeFileSync(tmp, src);
let mod; try { mod = await import(url.pathToFileURL(tmp).href); } finally { fs.unlinkSync(tmp); }
console.log = clog;
const T = await import(url.pathToFileURL(path.join(REPO, 'engine/src/time.js')).href);
const CL = await import(url.pathToFileURL(path.join(REPO, 'engine/src/clip.js')).href);   // the engine's take clocks (fit, spread)
const S = mod.shots;
// ---- mock canvas: flags non-finite numbers in any call or assignment, bad gradient stops, text far outside the frame
const bad = [], offText = new Map(); let calls = 0, font = '22px JBM', cur = null, curT = 0;
const fin = (v) => typeof v !== 'number' || Number.isFinite(v);
const note = (what, a) => { if (bad.length < 40) bad.push([curT.toFixed(2), cur?.kind, what, JSON.stringify(a).slice(0, 160)]); else bad.push(0); };
const g = new Proxy({}, {
  get: (o, k) => {
    if (k === 'measureText') return (s) => { const m = /(\d+)px/.exec(font); return { width: String(s).length * (m ? +m[1] : 20) * .55 }; };
    if (k === 'createRadialGradient' || k === 'createLinearGradient') return (...a) => { calls++; if (!a.every(fin)) note(k, a); return { addColorStop: (s, c) => { if (!(s >= 0 && s <= 1) || /NaN|undefined|Infinity/.test(c)) note('stop', [s, c]); } }; };
    if (k === 'fillText' || k === 'strokeText') return (s, x, y) => { calls++; if (![x, y].every(fin)) note(k, [s, x, y]);
      if (x < -400 || x > 2320 || y < -200 || y > 1300) offText.set(String(s).slice(0, 30), [curT.toFixed(2), Math.round(x), Math.round(y)]); };
    if (k === 'font') return font;
    if (k in o) return o[k];
    return (...a) => { calls++; if (!a.every(fin)) note(k, a); };
  },
  set: (o, k, v) => { if (k === 'font') font = v; if (!fin(v) || (typeof v === 'string' && /NaN|undefined|Infinity/.test(v))) note('set ' + String(k), v); o[k] = v; return true; } });
const chk = (name, ...a) => { const flat = a.flatMap((x) => (x && typeof x === 'object' && !Array.isArray(x) ? Object.values(x) : [x])).flat(); if (!flat.every(fin)) note(name, a); };
const ty = { g, line: (w, t, o) => chk('line', t, o), mono: (s, t, t0, o) => chk('mono', t, t0, o), ledHook: (w, t, o) => { chk('ledHook', t, o); if (!Array.isArray(w)) note('ledHook words', w); },
  chyron: (s, t, t0, t1, lane, o) => chk('chyron', t, t0, t1, o), hook: (w, t, o) => chk('hook', t, o) };
const figSet = (k, v) => { if (k === 'uTintAmt' && !fin(v)) note('fig.set', [k, v]); };
const scn = { fig: { set: figSet, u: new Proxy({}, { get: () => ({ value: { set: () => {} } }) }) } };
// ---- take lengths (frames at 24 fps)
const FPS = 24;
const takeOf = (plate) => (plate || '').split('/').pop();
const nOf = (plate) => { const tk = takeOf(plate); if (DUR.take[tk]) return DUR.take[tk]; const shot = tk.replace(/^still_/, '').replace(/_t\d+_[0-9a-z]+$/, '').replace(/_t\d+$/, '');
  if (tk.startsWith('still_')) return 1e9;   // a still fallback has one frame by design: not a held take
  return DUR.shot[shot] ?? null; };
const lastOf = (plate) => { const n = nOf(plate); return n == null || n >= 1e9 ? 1e9 : (n - 1) / FPS; };
const fitc = (c, t, f, plate) => (f ? CL.fit(c, t, f, lastOf(plate)) : c);   // as PlateSeq.at(t, s0, fit)
const clocks = new Map();   // key -> {label, plate, n, t0, t1, min, max, holds: [[t0,t1,kind]], rmin, rmax, amin}
const rec = (key, label, plate, c, t, dt, a = 1) => {
  let r = clocks.get(key); if (!r) clocks.set(key, (r = { label, plate: takeOf(plate), n: nOf(plate), min: 1e9, max: -1e9, holds: [], rmin: 1e9, rmax: -1e9, amin: 1, last: null }));
  r.min = Math.min(r.min, c); r.max = Math.max(r.max, c); r.amin = Math.min(r.amin, a);
  if (r.last && t - r.last[0] > 1e-6 && t - r.last[0] < 3 * dt) { const rt = (c - r.last[1]) / (t - r.last[0]); r.rmin = Math.min(r.rmin, rt); r.rmax = Math.max(r.rmax, rt); }
  r.last = [t, c];
  if (r.n == null || r.n >= 1e9) return;
  const i = Math.round(c * FPS), kind = i > r.n - 1 ? 'last' : i < 0 ? 'first' : null;
  if (!kind) return;
  const h = r.holds[r.holds.length - 1];
  if (h && h[2] === kind && t - h[1] <= 1.5 * dt) h[1] = t; else r.holds.push([t, t, kind]);
};
const fps = +opt('fps', 24), from = +opt('from', 0), to = +opt('to', 297), dt = 1 / fps;
let exc = 0; const excs = [];
const callAll = (s, u, t) => {   // any other function-valued shot parameter (dronetree keys etc.), called as (u, t)
  for (const [k, f] of Object.entries(s)) {
    if (typeof f !== 'function' || ['text', 'cam', 'fid', 'fade', 'update', 'scatter', 'worldFid', 'xf', 'clip', 'treeTime', 'rise', 'glow', 'trailT'].includes(k) || k.startsWith('_')) continue;
    const v = f(u, t); if (v && typeof v === 'object') chk(k, v); else if (!fin(v)) note(k, v);
  }
};
// the forktree's copy clocks, exactly as scenes/forktree.js computes them (k = 0..3)
const ftClock = (s, tt, k) => { const s0 = s.s0 ?? s.t0, step = CL.spread(lastOf(s.plate), s.t0 - s0, s.t1 - s.t0);
  return fitc(tt + k * step - s0, tt, { from: s.t0, to: s.t1 }, s.plate); };
for (const [si, s] of S.entries()) {
  if (s.t1 <= from || s.t0 >= to) continue;
  const n = Math.max(2, Math.ceil((s.t1 - s.t0) / dt));
  for (let j = 0; j <= n; j++) {
    const t = Math.min(s.t1 - 1e-4, s.t0 + j * (s.t1 - s.t0) / n), u = (t - s.t0) / (s.t1 - s.t0); cur = s; curT = t; const ddt = (s.t1 - s.t0) / n;
    try {
      if (s.kind === 'lattice') {
        if (s.cam) chk('cam', s.cam(u, t)); if (s.fid) chk('fid', s.fid(u, t)); if (s.worldFid) chk('worldFid', s.worldFid(u, t));
        const fa = s.fade ? s.fade(u, t) : 1; chk('fade', fa);
        if (s.scatter) chk('scatter', s.scatter(u, t)); if (s.update) s.update(scn, u, t);
        const s0 = s.s0 ?? s.t0, c = s.clip ? s.clip(u, t) : fitc(t - s0, t, s.fit && { from: s.t0, to: s.t1, ...(s.fit === true ? {} : s.fit) }, s.plate); if (!fin(c)) note('clip', c);
        rec(si, 'lattice', s.plate, c, t, ddt, fa);
        for (const [k, cp] of (s.copies || []).entries()) { if (typeof cp.off === 'function') chk('copy.off', cp.off(t, .5));
          const vis = cp.at === undefined || t >= cp.at; if (cp.dt && !cp.plate && vis) rec(`${si}.c${k}`, `copy dt ${cp.dt}`, s.plate, t + cp.dt - s0, t, ddt, fa);
          if (cp.plate && vis) rec(`${si}.c${k}`, `copy ${takeOf(cp.plate)}`, cp.plate, s.clip ? c : c + (cp.dt || 0), t, ddt, fa); }   // its own plate on the shot's clock
        for (const [k, sc] of (s.screens || []).entries()) if (sc.at === undefined || t >= sc.at) rec(`${si}.s${k}`, 'screen', sc.plate, t - (sc.s0 ?? s0), t, ddt, fa);
      } else if (s.kind === 'panels') {
        if (s.cam) chk('cam', s.cam(t, u));
        for (const [k, p] of s.panels.entries()) {
          const x = p.xf(t, u); if (x) chk('xf', x);
          if (p.fid) chk('pane.fid', p.fid(t));
          if (x && x.a > .001) { const c = p.clip ? p.clip(t) : fitc(t - (p.s0 ?? 0), t, p.fit, p.plate); if (!fin(c)) note('pane.clip', c); rec(`${si}.p${k}`, `pane ${k}`, p.plate, c, t, ddt, x.a * (x.gain ?? 1)); }
        }
        if (s.back) { const c = s.back.clip ? s.back.clip(t) : fitc(t - (s.back.s0 ?? 0), t, s.back.fit, s.back.plate); if (!fin(c)) note('back.clip', c); rec(`${si}.back`, 'back', s.back.plate, c, t, ddt, (s.cam ? s.cam(t, u).backA : 1) ?? 1); if (s.back.cam) chk('back.cam', s.back.cam(t)); }
      } else if (s.kind === 'forktree') {
        const tt = s.treeTime ? s.treeTime(t) : t; if (!fin(tt)) note('treeTime', tt);
        if (s.rise) chk('rise', s.rise(t)); if (s.glow) chk('glow', s.glow(t));
        // which of the four clocks are on screen: copy i of generation g uses clock (i * 7 + g) % 4 (forktree.js), g from the split bars
        let gg = 0; while (gg < (s.splits ?? 10) && tt >= T.bar((s.splitBar0 ?? 3) + gg)) gg++;
        const used = new Set(); for (let i = 0; i < Math.min(4, 1 << gg); i++) used.add((i * 7 + gg) % 4);
        for (let k = 0; k < 4; k++) { const c = ftClock(s, t, k); if (!fin(c)) note('forktree.clip', c); if (used.has(k)) rec(`${si}.k${k}`, `forktree clock ${k}`, s.plate, c, t, ddt); }
      } else callAll(s, u, t);
      if (s.kind === 'dronetree' && s.cam) chk('cam', s.cam(u, t));
      if (s.text) s.text(ty, t, s.kind === 'forktree' ? { g: 0, n: 1, S: [], tau: t } : u);
    } catch (e) { exc++; if (excs.length < 10) excs.push(`${t.toFixed(2)} ${s.kind} ${s.plate || ''}: ${e.stack.split('\n').slice(0, 3).join(' | ')}`); }
  }
}
// coverage: every frame of the film has a shot
const end = mod.FILM_END ?? 297; const gaps = []; let multi = 0;
for (let t = Math.max(0, from); t < Math.min(end, to); t += 1 / 30) { const k = S.filter((s) => t >= s.t0 && t < s.t1).length; if (!k) gaps.push(t.toFixed(3)); if (k > 1) multi++; }
// report
const q = args.includes('--quiet');
const mmss = (t) => `${Math.floor(t / 60)}:${(t % 60).toFixed(1).padStart(4, '0')}`;
clog(`== main.js ?${query} picks=${path.relative(REPO, picksFile)}${fake ? ' fake=' + (opt('fake') === 'allnew' ? 'allnew' : fake) : ''}  shots=${S.length} film_end=${end.toFixed(3)}`);
const shotOf = (key) => S[+String(key).split('.')[0]];
if (args.includes('--list')) for (const [si, s] of S.entries()) if (s.t1 > from && s.t0 < to) {
  const r = clocks.get(si) || clocks.get(`${si}.k0`);
  clog(`  ${s.t0.toFixed(3)}-${s.t1.toFixed(3)} ${s.kind.padEnd(9)} ${takeOf(s.plate) || (s.panels ? s.panels.length + ' panes' : '')}${r ? ` clip ${r.min.toFixed(2)}..${r.max.toFixed(2)}/${r.n ? ((r.n - 1) / FPS).toFixed(2) : '?'}` : ''}`);
}
let held = 0, nh = 0;
for (const [key, r] of clocks) {
  if (r.n == null || r.n >= 1e9) continue;
  const tot = r.holds.reduce((a, [x, y]) => a + (y - x) + dt, 0); if (tot <= 1.01 * dt * 1.5 && r.holds.length <= 1 && tot < .06) continue;   // < 1.5 frames: rounding
  held += tot; nh++;
  const s = shotOf(key);
  clog(`  HOLD ${mmss(r.holds[0][0])} ${s.kind}${r.label.startsWith(s.kind) ? '' : ' ' + r.label} ${r.plate}: clip ${r.min.toFixed(2)}..${r.max.toFixed(2)} of ${((r.n - 1) / FPS).toFixed(2)} s; `
    + r.holds.map(([x, y, k]) => `${k} frame held ${(y - x + dt).toFixed(2)} s (${x.toFixed(2)}-${(y + dt).toFixed(2)})`).join(', ') + (r.amin < .999 ? ` [min alpha ${r.amin.toFixed(2)}]` : ''));
}
if (args.includes('--rates')) for (const [key, r] of clocks) if (r.rmin < 1e8 && (Math.abs(r.rmin - 1) > .01 || Math.abs(r.rmax - 1) > .01)) {
  const s = shotOf(key); clog(`  RATE ${mmss(s.t0)} ${s.kind} ${r.label} ${r.plate}: ${r.rmin.toFixed(3)}..${r.rmax.toFixed(3)}x, clip ${r.min.toFixed(2)}..${r.max.toFixed(2)} of ${r.n ? ((r.n - 1) / FPS).toFixed(2) : '?'}`); }
const unknown = [...new Set([...clocks.values()].filter((r) => r.n == null).map((r) => r.plate))];
clog(`  exceptions ${exc}  bad-args ${bad.length}  gaps ${gaps.length}${gaps.length ? ' (' + gaps.slice(0, 4).join(',') + '…)' : ''}  held-clocks ${nh} (${held.toFixed(2)} s)  off-frame-text ${offText.size}  unknown-length plates ${unknown.length}`);
for (const e of excs) clog('  EXC ' + e);
for (const b of bad.slice(0, 8)) clog('  BAD ' + JSON.stringify(b));
for (const [s, v] of [...offText].slice(0, 5)) clog(`  OFF '${s}' at ${v}`);
if (unknown.length && !q) clog('  unknown-length plates: ' + unknown.join(' '));
if (args.includes('--logs')) for (const l of logs) clog('  log: ' + l.slice(0, 300));
process.exitCode = exc || bad.length || gaps.length ? 1 : 0;
