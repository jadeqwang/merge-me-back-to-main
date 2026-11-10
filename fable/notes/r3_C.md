# Round 3, Act C (seq 08-10, 2:05-3:01): fix pass on NOTES_v3 "Act C" + re-check with the anime figure

Status line (kept current): **all items done and checked on strips; clip `work_fable/out/r3_C.mp4` rendered last. Not pushed.**
Files: `fable/show/seq/10_drop.js` (cameras of shots B and C, light, belt), `actC_form.js` (the set track, the fall wave, faces and hands), `08_build.js` (one camera
key pair: head room after the landing). `09_coil.js`, `actC_runs.js`, every shared file: untouched. `fable/show/cuts.json`: re-scanned, identical (no cut moved:
125.341, 132.297, 139.254, 147.949, 160.123, 178.384, 180.992), not rewritten. `r2_C.md` still describes the runs, the word and the ground plan.

## Commands
```
Q="tracks=build,drop,drop_join,land,sprint_loop,run_loop,sprint_stop_look,idle,run_from_stand,run_to_stand"     # dev: fast start-up
node fable/tools/render.mjs --show /fable/show/main.js --q "$Q" --res 1280x720 --sheet 160.5:181:0.5:work_fable/stills/r3_C/comp.jpg:7
node fable/tools/render.mjs --show /fable/show/main.js --from 125.3 --to 181.0 --res 1280x720 --fps 30 --mb 4 --workers 4 --audio --mp4 work_fable/out/r3_C.mp4
dev: --q "$Q&ccheck=1" (numbers of the runs)   "$Q&cdev=1" (beside the hero from the south, seq 10)   "$Q&ctop=1" (the floor from above)
     "$Q&cgeo=1" (prints the cells within 9 m of the hero: the gap, the I, the bite)   "$Q&cnoset=1" (the r2 join, fists snap: for comparison)
```

## What changed, by item of NOTES_v3
### 1. 2:44-2:46.9, MAIN before the fall (the main item)
- Shot B (b93-b97) is now: above and behind her at the cut (7.2 m up, 10.5 m back: the nearest runner is about a fifth of the frame's height; it was inside the
  stream at 2.7 m), back and up over two bars to a HIGH OBLIQUE FROM THE WEST (44-50 m up, 38-44 m west of the word's foot, fov 38) that holds the whole word while
  the runners arrive, brake (b95.2) and stand: standing bodies read as people with reflections, the letters as perspective letters, nothing cropped. From b96.4
  (166.04) it swings up and is straight overhead exactly on b97 (167.082, `stop`).
- The top-down frame has more air (frameBox margin 1.1 -> 1.2): the word is 77 % of the frame's height, the HUD line clears the M.
- The fall wave is reversed so that the word is COMPLETE on the downbeat. It was a ripple outward from her (last body 0.4 s after 167.082: MAIN only read at 167.5).
  Now each copy's clock runs ahead of the song by its `lead` (0 for the hero, 0.35 s at the far ends of the word) from the braking to the floor (`clock` in
  actC_form.js; eased in over the braking 164.1-165.9, so a far copy brakes up to 1.3 x faster, and eased out 167.2-167.85 while everyone lies still). The far ends
  of the M and the N go down first, the wave runs in, the hero is last, flat on 167.082. Still at 167.09: all 1,024 down, whole word in frame.
- So before the fall the word is never seen cropped, and "dashes" (standing bodies from straight above) exist only inside the last 0.4 s of the swing, when most
  of them are already diving.
### 2. Framing
- 2:40.2-2:41: see above (lift starts at 7.2 m).
- 2:50.6-2:51.1 (bodies cut by the bottom edge): the way down now crosses the N and the I at 10 m and more, reaches a point 8 m above the gap in front of her,
  comes down the gap on a longer lens (fov 31: the frame's foot stays inside the 4 m corridor between the A and the I) and glides in low, widening to 38. It
  settles later (b99.75 = 171.87 instead of 171.43: half a second less of everyone standing still before the arms). Bodies at the frame's edge are now about a
  fifth of the frame's height (were two fifths) and only at 170.9-171.2. Not zero: see "still weak".
- 2:51.4-2:53.8 (left fifth empty): the same camera position, panned 1.1 m toward her rank: she stands on the left third, her left arm reaches toward the frame
  edge on 172.3, the rank fills the right.
- 2:57.3-2:57.6 (backs at the apex): measured on the track: she faces south for the double palm (176.65), spins east -> south -> west and is facing WEST at the apex
  (177.36-177.52), north on the way down, east again by 178.0. The camera of b101-b103.3 is now polar round her (`orbit`): 23-26 degrees off east for arms wide
  and the punches (as before), and between b101.85 and b102.85 it comes round to 78 degrees (nearly due south), closer (3.0 m) and level (1.15 m, fov 48). So the
  double palm comes toward the lens, the take-off is seen from the front, the apex in profile (head and kicking foot against the rose belt), the landing from
  behind, the final low pose in profile. She is the nearest and largest body; her rank is a close echo behind her. The belt (`belt()`) now arcs round to the
  north-west so the rose is behind the jump.
### 3. 166.30 fists
- `actC_set`: a track MADE AT START-UP in actC_form.js (no new file in work_fable/tracks): run_to_stand's first 121 frames as they are, then 12 frames (0.2 s)
  easing into `drop`'s set pose at the same song time: world orientations nlerp'd per joint, positions rebuilt down the skeleton from bone offsets in the parent's
  frame (no bone changes length). Registered with `cast.tracks[...]` and `cast.fig.addTrack` (classic and anime; the stand-in needs only the hips). `drop` takes
  over on its last frame (166.253). Fists close over the same 0.2 s (`hand` 0.4 -> 1), open for the breakfall.
- Seen from the side (`cdev=1`, 165.9-166.5 every frame): arms travel over 6 frames at 30 fps, no pop. `ccheck`: hips step max 9.1 cm per 1/60 s (unchanged, it
  is `drop_join`'s own leap), at the set join 1.2 cm; feet: the 5.5 cm the feet differ by is now a slide of 0.2 s (peak 0.4 m/s) instead of one frame.
### 4. 2:58.4-3:01 gold
- The figure's owner added `figLight.keyCol` during this pass. Tested on the salute at 1080p: the key colour alone does not do it (the jacket stayed cream with
  keyCol [1, 0.6, 0.22] at sunAmt 0.5: its colour comes mostly from the ambient term). What works: amber ambient up ([0.62, 0.29, 0.035]), white key down
  (sunAmt 0.1), keyCol [1, 0.8, 0.5], ink kept at 0.3, grade gain [1.32, 1, 0.58]. `sunSide(k, g)` / `sunGrade(k, g)`: g fades in over b101-b103 (the last phrase)
  and is 1 for the salute. Jackets read gold-tan, skin goes golden with them.
### 5. 125.3-127 ear strand
- Fixed by the figure's owner in this round (the thin strand is gone). Checked 126.0-127.6: clean profile at 126.4-126.7.
- Found while checking: her crown sat on the frame's top edge, under the HUD line, at 125.9-126.3 (she is up sooner than the camera). 08_build.js camA: the key at
  b73 + 0.62 looks higher and one key is added at + 0.82. The landing itself (to 125.62) and everything from b74 are as they were.
### 6. Faces (actC_form.js `acting`, through `put()`: no shared file touched)
- build / drop / runs: the film default (determined), unchanged.
- arms wide: hero `joy` with open eyes, eased in 171.9-172.3, out 173.3-173.75. The 1,023 copies CLOSE their eyes over the same window (`calm`): arms open to
  the sun; she alone looks. (A decision of mine; the note asked for joy "for the hero only".)
- salute: from 178.7-179.2 everyone goes to `calm` 0.3 = lowered lids, eyes open, gaze fixed forward (no saccades). Compared at 1080p with `neutral` (wide
  round eyes, startled) and `calm` 0.5 (sleepy).
- set: fists (see 3); fall: open hands; salute: the default (right fist, left palm).

## Re-check with the anime figure (strips and 1080p crops in `work_fable/stills/r3_C/`)
| shot | time | what I looked at | verdict |
|---|---|---|---|
| 8A landing, wedge | 125.3-132.3 | 0.2 s strip to 127.2, 1 s after; crops 126.0, 126.6, 127.6 | face reads front-on in the crouch; head room fixed; profile clean; see hair note below |
| 8B side truck | 132.3-139.3 | 1 s strip; crops 133.4, 138.4 | faces small and mostly profile; fine except the hair note |
| 8C crane, 9 coil | 139.3-153.2 | 1 s strip | heads under 30 px: no faces drawn, as intended |
| 10A | 153.2-160.1 | 1 s strip | silhouettes (the figure's new silhouette rule makes them blacker): right |
| 10B lift | 160.1-167.1 | 0.4 s strip, 0.5 s sheet, stills 160.2, 163.2, 164.4, 166.2, 166.7 | see item 1 |
| 10C top, down, arms | 167.1-173.7 | 0.1 s strip 169.8-172.5; 1080p crops 172.5 | MAIN complete at 167.09; hero joy, copies' eyes closed |
| 10C punches, kick | 173.7-178.4 | 0.3 s strip, 0.1 s strip 176.5-178.4, 1080p 175.0, 177.2-177.52 | heads turn with the punches (profile, then away); kick as in item 2 |
| 10E salute | 178.4-181 | 1080p crops 179.8 in six lights / faces | calm, eyes forward, gold; copies' eyes have whites (figure fix) |

## Requests for the figure owner (`fable/engine/src/figure_anime/`)
1. **Side lock across the face.** 126.15-126.25 (step-punch, hero, head about 110 px at 1080p) and 133.4 (side truck, hero and near copies): the side lock
   whips across the nose and mouth for a few frames and reads as a black band / moustache. A collider that keeps the side locks off the face plane (or damping
   on those two guides) would do it. I did not change the angle: both are one-off frames inside the best part of the act.
2. **Hair highlight in the spin.** 177.40-177.45 (hero, jump kick, 1080p): the highlight band on the whipping back clumps reads as a grey loop on her back.
3. **Key colour barely tints the jacket** (item 4): if a real gold key is wanted, `keyCol` should weigh more in the lit tone than `sunAmt * sh` gives it at
   sunAmt 0.3, or the ambient needs a per-shot tint that does not also colour the skin. What is in the film now is done with the ambient.
4. Thank you for the eye whites and the ear strand: both landed while I was checking and are in every frame above from the gold tests on.

## Still weak (exact times)
- 170.9-171.2: coming down into the gap, a few bodies of the I (left) and of the A (bottom) are cut by the frame's edge at about a fifth of its height.
- 162.5-164.0: the oblique is dim (black figures on a dark violet mirror) until the gold-rose ground comes up; the word reads from about 163.2.
- 166.5-167.0: in the swing the centre of the word is still standing while the ends are down: it reads as a wave, but the letters are briefly two textures.
- 177.3-177.6: the apex is a profile, but black hair and navy trousers make it a dark shape on the rose belt; rows 0-2 of her column (west of her) kick at
  about 80 % of her size on the left of frame, so she is the largest, not the only one.
- 174.9-175.6: for the second and third punches her head is turned away from the lens (the choreography looks north): the back of her head for 0.7 s.
- 172.3-173.4: her rank-mates are still about 87 % of her size; she is marked by position (left third, nearest), the open eyes and the orange trousers only.
- Not done: the film as video was not watched (I cannot); motion was judged on 0.1 s and 1/30 s strips.

## Outputs (git-ignored)
`work_fable/out/r3_C.mp4` (125.3-181.0, 720p, mb 4, audio); `work_fable/stills/r3_C/`: `comp.jpg` (160.5-181 / 0.5 s), `b_lift.jpg`, `c_down.jpg`, `d_kick.jpg`,
`m_set_hero.jpg` (the set from the side, every frame), `m_fall.jpg` (166.0-167.3 / 0.1 s), montages `g_faces2.jpg`, `i_mont*.jpg`, `j_mont.jpg`, `k_mont.jpg`;
`a_before_*.jpg` = the cut as it was at the start of this pass (anime figure).
