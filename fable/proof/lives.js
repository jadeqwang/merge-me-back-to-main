// The lives of the proof segment (bars 28-43). Order = plate id order = grid order (4x3, row by row) = pop-in order.
// Lane colours are the film's palette (SPEC §3). root and hero have no chyron.
// tone: the plate's overall value (wushu: listed dark in the brief, but its plate is a light grey mat, so ink reads better), for the full-frame lyric colour (light plate -> ink #14122B, dark plate -> cream #FFF1D6).
export const MAIN = '#FF7A1A';
export const LIVES = [
  { id: 'piano',     branch: 'jade/piano',                    msg: 'climbed onto the piano bench before I was three', color: '#FF3D7F', tone: 'light' },
  { id: 'violin',    branch: 'jade/violin',                   msg: 'first chair, first violin',                        color: '#FFD23F', tone: 'light' },
  { id: 'wushu',     branch: 'jade/wushu',                    msg: 'bronze, group set',                                color: '#FF6B5E', tone: 'light' },
  { id: 'wetlab',    branch: 'jade/wet-lab',                  msg: 'kept the neurons alive, first paper 2005',         color: '#3DDC97', tone: 'light' },
  { id: 'phd',       branch: 'jade/phd',                      msg: 'how the brain listens, 2010',                      color: '#22D3EE', tone: 'light' },
  { id: 'poet',      branch: 'jade/poet',                     msg: 'wrote poems between experiments',                  color: '#E24BD6', tone: 'light' },
  { id: 'ames',      branch: 'jade/nasa-ames',                msg: 'stood in the wind of the giant tunnel',            color: '#3D8BFF', tone: 'dark' },
  { id: 'band',      branch: 'jade/robot-ninja-apocalypse',   msg: 'three chords and a van',                           color: '#FF6B5E', tone: 'dark' },
  { id: 'chezjj',    branch: 'jade/hacker-houses',            msg: 'a full house at 2am, everyone shipping',           color: '#3DDC97', tone: 'dark' },
  { id: 'sandstorm', branch: 'jade/open-source',              msg: 'the live demo worked',                             color: '#22D3EE', tone: 'dark' },
  { id: 'home',      branch: 'jade/home',                     msg: 'taught the Copernican model at 10:30pm',           color: '#FF3D7F', tone: 'dark' },
  { id: 'violet',    branch: 'jade/1420-mhz',                 msg: 'listened to hydrogen',                             color: '#9B6BFF', tone: 'dark' },
];
export const EXTRA = [{ id: 'root', color: MAIN }, { id: 'hero', color: MAIN }];
export const PLATE_IDS = [...LIVES.map((l) => l.id), 'root', 'hero'];
export const byId = Object.fromEntries([...LIVES, ...EXTRA].map((l) => [l.id, l]));

// 7-hex commit hash, deterministic from the id (FNV-1a 32 bit, then one more mix round for the 7th digit)
export function hashOf(id) {
  let h = 0x811c9dc5; for (const ch of 'jade/' + id) { h ^= ch.charCodeAt(0); h = Math.imul(h, 0x01000193) >>> 0; }
  let g = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d) >>> 0;
  return (h.toString(16).padStart(8, '0') + g.toString(16).padStart(8, '0')).slice(0, 7);
}
