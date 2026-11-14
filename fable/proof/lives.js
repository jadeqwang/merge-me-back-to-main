// The lives of the proof segment (bars 28-43). Order = plate id order = grid order (4x3, row by row) = pop-in order.
// Lane colours are the film's palette (SPEC §3). root and hero have no chyron.
// tone: the plate's overall value, for the full-frame lyric colour (light plate -> ink #14122B, dark plate -> cream #FFF1D6).
// side: where SHE is in the frame; the section A lyric, chip and lane node go to the other side. phd and band (figure near the
// centre) were chosen by eye: phd counts as 'left' (clear grid paper on the right gets the type), band as 'right' (the clear top
// left gets the type; her bandmates fill the right). wushu and ames are flipped to dark (cream type):
// wushu's top is a dark wooden wall, ames is a mid grey where ink read weakly.
// optional yshift (-0.5..0.5): nudges the full-frame plate's vertical crop (fraction of the spare height) if the lane would cut her head.
export const MAIN = '#FF7A1A';
export const LIVES = [
  { id: 'piano',     branch: 'jade/piano',                    msg: 'climbed onto the piano bench before I was three', color: '#FF3D7F', tone: 'light', side: 'left' },
  { id: 'violin',    branch: 'jade/violin',                   msg: 'first chair, first violin',                        color: '#FFD23F', tone: 'light', side: 'right' },
  { id: 'wushu',     branch: 'jade/wushu',                    msg: 'bronze, group set',                                color: '#FF6B5E', tone: 'dark', side: 'right' },
  { id: 'wetlab',    branch: 'jade/wet-lab',                  msg: 'kept the neurons alive, first paper 2005',         color: '#3DDC97', tone: 'light', side: 'left' },
  { id: 'phd',       branch: 'jade/phd',                      msg: 'how the brain listens, 2010',                      color: '#22D3EE', tone: 'light', side: 'left' },
  { id: 'poet',      branch: 'jade/poet',                     msg: 'wrote poems between experiments',                  color: '#E24BD6', tone: 'light', side: 'left' },
  { id: 'ames',      branch: 'jade/nasa-ames',                msg: 'stood in the wind of the giant tunnel',            color: '#3D8BFF', tone: 'dark', side: 'right' },
  { id: 'band',      branch: 'jade/robot-ninja-apocalypse',   msg: 'three chords and a van',                           color: '#FF6B5E', tone: 'dark', side: 'right' },
  { id: 'chezjj',    branch: 'jade/hacker-houses',            msg: 'a full house at 2am, everyone shipping',           color: '#3DDC97', tone: 'light', side: 'right' },
  { id: 'sandstorm', branch: 'jade/open-source',              msg: 'the live demo worked',                             color: '#22D3EE', tone: 'dark', side: 'right' },
  { id: 'home',      branch: 'jade/home',                     msg: 'taught the Copernican model at 10:30pm',           color: '#FF3D7F', tone: 'dark', side: 'right' },
  { id: 'violet',    branch: 'jade/1420-mhz',                 msg: 'listened to hydrogen',                             color: '#9B6BFF', tone: 'dark', side: 'right' },
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
