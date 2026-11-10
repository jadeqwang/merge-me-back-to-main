// scratch (not part of the film): Act B experiments.  --q "x=nolights|noworld|noart..."
import * as M from '../main.js';
let E;
export async function setup(e) { E = e; await M.setup(e); }
export function frame(t) { const F = M.frame(t); const x = E.Q.get('x') || '';
  if (x) F.drawables = F.drawables.filter((d, i) => { const s = String(d.draw); const isL = d.passes && d.passes[0] === 'add' && s.includes('uAir'); const isRoad = d.passes && d.passes[0] === 'ground' && s.includes('pLine');
    if (x === 'nolights') return !isL; if (x === 'noroads') return !isRoad; if (x.startsWith('road')) { if (!isRoad) return true; frame.k = (frame.k || 0); return true; } return true; });
  if (x.startsWith('only')) { const k = +x.slice(4); let j = 0; F.drawables = F.drawables.filter((d) => { const isRoad = d.passes && d.passes[0] === 'ground' && String(d.draw).includes('pLine'); if (!isRoad) return true; return j++ === k; }); }
  return F; }
