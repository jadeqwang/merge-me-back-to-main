#!/usr/bin/env node
// Reads the real `git log --oneline --graph` of this branch into fable/show/gitlog.json (the terminal card at the end of the film shows it).
//   node fable/tools/gitlog.mjs [--n 14]
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
const i = process.argv.indexOf('--n'); const n = i > 0 ? +process.argv[i + 1] : 14;
const run = (c) => execSync(c, { cwd: ROOT, encoding: 'utf8' }).trim();
const branch = run('git rev-parse --abbrev-ref HEAD');
const lines = run(`git log --oneline --graph --decorate=short -n ${n}`).split('\n').map((l) => l.replace(/\s+$/, ''));
const total = +run('git rev-list --count HEAD');
fs.writeFileSync(path.join(ROOT, 'fable', 'show', 'gitlog.json'), JSON.stringify({ branch, total, head: run('git rev-parse --short HEAD'), generated: new Date().toISOString().slice(0, 10), lines }, null, 1) + '\n');
console.log(`gitlog.json: ${lines.length} lines of ${total} commits on ${branch}`);
