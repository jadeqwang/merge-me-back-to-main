#!/usr/bin/env node
// Resolve the shot list against a timing map and print it (count, per-section counts, longest holds, cut rate).
//   node fable/take2/tools/shots.mjs [--timing analysis_v3/timing.json] [--json out.json] [--table]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { timingFrom } from '../src/timing.js';
import { resolveShots, SECTIONS } from '../shots.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');
const argv = process.argv.slice(2), arg = (k, d) => { const i = argv.indexOf('--' + k); return i < 0 ? d : argv[i + 1] === undefined || argv[i + 1].startsWith('--') ? true : argv[i + 1]; };
const tf = path.resolve(ROOT, String(arg('timing', 'analysis_v3/timing.json')).replace(/^\//, ''));
const T = timingFrom(JSON.parse(fs.readFileSync(tf, 'utf8')), tf);
const shots = resolveShots(T);
const fmt = (v) => (v === 'end' ? 'end' : `${v[0]}.${v[1]}`);
if (arg('table')) for (const s of shots) console.log(`${s.id.padEnd(5)} ${fmt(s.from).padStart(6)}-${fmt(s.to).padEnd(6)} ${s.t0.toFixed(3).padStart(8)}-${s.t1.toFixed(3).padEnd(8)} ${(s.t1 - s.t0).toFixed(2).padStart(5)} s  ${s.code.padEnd(7)} ${s.kind.padEnd(5)} ${String(s.src).padEnd(20)} ${s.status.padEnd(7)} ${s.pic}`);
const by = {}; for (const s of shots) { by[s.sec] = by[s.sec] || { n: 0, missing: 0, dur: 0 }; by[s.sec].n++; by[s.sec].dur += s.t1 - s.t0; if (s.status === 'missing') by[s.sec].missing++; }
console.log(`\n${shots.length} shots over ${shots[shots.length - 1].t1.toFixed(1)} s (${(shots.length / (shots[shots.length - 1].t1 / 60)).toFixed(1)} per minute)`);
for (const [k, v] of Object.entries(by)) console.log(`  ${SECTIONS[k].name.padEnd(12)} ${String(v.n).padStart(3)} shots, ${String(v.missing).padStart(3)} missing, ${(v.n / (v.dur / 60)).toFixed(1).padStart(5)} per minute`);
const kinds = {}; for (const s of shots) kinds[s.kind + '/' + s.status] = (kinds[s.kind + '/' + s.status] || 0) + 1; console.log('  by kind/status:', JSON.stringify(kinds));
const long = [...shots].sort((a, b) => (b.t1 - b.t0) - (a.t1 - a.t0)).slice(0, 6); console.log('  longest:', long.map((s) => `${s.id} ${(s.t1 - s.t0).toFixed(2)} s`).join(', '));
const out = arg('json'); if (out) { fs.writeFileSync(path.resolve(out), JSON.stringify(shots, null, 1)); console.log('json ->', out); }
