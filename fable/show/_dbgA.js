// scratch (not part of the film): prints Act A numbers
import * as M from './main.js';
export async function setup(E) { await M.setup(E); const out = []; for (const t of [28.2, 30.3, 31.5, 33, 36]) { const F = M.frame(t); const c = F.camera; out.push(t + ' pos ' + c.pos.map((v) => v.toFixed(2)) + ' tgt ' + c.target.map((v) => v.toFixed(2))); } console.log('DBG\n' + out.join('\n')); }
export function frame(t) { return M.frame(t); }
