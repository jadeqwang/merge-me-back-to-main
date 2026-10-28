// Her lives as git branches for v6: [slot ID (docs/treatment_v6.md, section C), branch, lane, commit message, hash]. Messages and hashes are the
// v5 LIFE table's (engine/show/main.js; Jade's open decision 1 still applies: edit both together). Oldest first. The violet 1420 MHz branch
// is the one that never merged; it is cherry-picked into main last. jade/rare-earth (C9, making this album) is new in v6: its message and
// hash are placeholders for Jade.
export const LIFE = [
  ['C1', 'jade/piano', 'rose', 'climbed onto the piano bench before I was three', '3f9a1c2'],
  ['C2', 'jade/violin', 'white', 'thin red tape on the fingerboard', '8d02e6b'],
  ['C7', 'jade/wushu', 'gold', 'listened to the footsteps like a drum rhythm', '4b7e2d9'],
  ['C8', 'jade/wet-lab', 'mint', 'watched a neuron light up under the scope', '7c21d4b'],
  ['C8', 'jade/phd', 'sky', 'heard the brain echo the sound back', 'e5b0a17'],
  ['C4', 'jade/poet', 'gold', 'wrote poems between experiments', '5d3b9f8'],
  ['C8', 'jade/nasa-ames', 'white', 'stood in the wind of the giant tunnel', '0d9c8f2'],
  ['C3', 'jade/robot-ninja-apocalypse', 'rose', 'turned the amp up', '9be44a1'],
  ['C5', 'jade/chez-jj', 'gold', 'a full house at 2am, everyone shipping', 'a41e7d0'],
  ['C5', 'jade/open-source', 'sky', 'the live demo worked', 'c8f2a61'],
  ['C6', 'jade/home', 'mint', 'taught kids the Copernican model at 10:30pm', '2e7b0c4'],
  ['C9', 'jade/rare-earth', 'orange', 'sang it back to main', 'b7a7e00'],
];
export const VIOLET = ['B6', 'jade/1420-mhz', 'violet', 'learned: every road was worth it', 'f01d9ae'];
// a merge commit's hash: 7 hex digits from the branch name (stable, distinct from the life hashes)
export function mergeHash(s) { let h = 2166136261; for (const c of s) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16).padStart(8, '0').slice(0, 7); }
