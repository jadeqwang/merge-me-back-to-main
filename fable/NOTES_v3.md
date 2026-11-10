# Director's notes on v3 + the anime figure (round 3)

v3: `work_fable/out/v3.mp4`, sheets `work_fable/stills/v3/sheet_1..3.jpg`. Since v3 the protagonist's figure is the anime one by default
(`fig=anime`; `--q "fig=classic"` is the film as in v3). In-film comparison: `work_fable/stills/anime/F_in_film.jpg`; notes
`fable/notes/anime_lookdev.md` (section "ADOPTION PASS": expression/gaze/hand defaults live in `fable/show/cast.js`, blink-safe cut
list `fable/show/cuts.json`, which must be regenerated if a cut time changes).

Round 3 is small and exact. Do not restage what works. Each pass: fix its list, then re-check every shot of its act with the anime
figure (strips; faces, gaze direction, fists, hair, type crossing a body), choosing an explicit expression/gaze per shot only where the
default is wrong. SPEC section 2 stays binding.

## Acts A+B (seq 01-07)
From `fable/notes/r2_AB.md` "still weak" plus v3:
- 26.0-26.6 sparse mid-fall from the tree: give the eye something (her tip's light growing, the road she lands on).
- 60.0-60.13 "Where" jumps at the cut; 64.5-66.0 the line is gone while "from" is still sung: keep the line legible until the word ends.
- 108-113 she is under 15% of frame at the widest point of the float: cap the height so she stays >= 20%, or shorten the hold.
- 116.6-117.95 upside-down road text in a corner: remove it from frame or turn it.
- 29.25-29.47 and 87.2-87.42 (Banach-Tarski): the lattice holds one pose while her legs run on: let the seated lattice ride her
  moving joints (or fade it ~0.1 s sooner). Also shape the lattice to her silhouette rather than a column, if cheap.
- 1:26 fold: the triangle heap is larger than her body: scale to the body.
- 0.5 and the last frame (270+, seq 16 shares it): her hair covers the top of the jacket's back disc: tell the D+E pass if the fix is in
  the figure; otherwise leave.
- Lives (48-60): with a face, each life's look-back should have the eyes leading the head turn; check all eight.

## Act C (seq 08-10)
From `fable/notes/r2_C.md` "still weak" plus v3:
- 2:44-2:46.9 (before the fall): the top-down is too close (letters cropped) and standing bodies read as dashes. Either stay on the
  oblique of the running/arriving troupe until about half a bar before the fall and go top-down just in time for the fall, or pull the
  top-down back so all of MAIN is in frame as they arrive. MAIN must be fully legible from 167.082.
- 2:40.2-2:41 runners too close to the lens; 2:50.6-2:51.1 bodies cut by the bottom edge; 2:51.4-2:53.8 left fifth of frame empty;
  2:57.3-2:57.6 backs to camera at the kick apex (shift the camera so the apex reads in profile or three-quarter front).
- 166.30 fists snap to the waist in one frame: ease over 3-4 frames (track or show level).
- 2:58.4-3:01 jackets read cream, not gold: a warm key on the figure for this shot (ask the D+E pass if it needs a shader input; they
  own `fable/engine/src/figure_anime/`).
- 125.3-127 a loose ear strand crosses her cheek in the landing close shot: choose an angle/expression where it does not, or report it
  to the D+E pass.
- Faces: build/drop = determined; the salute = calm, eyes forward; arms wide (172.3) = joy with open eyes for the hero only.

## Acts D+E (seq 11-16) + owner of the figure (`fable/engine/src/figure_anime/`)
From `fable/notes/r2_DE.md` "still weak", the adoption pass's "still wrong", plus v3:
- Figure fixes (shader/mesh; you are the only pass allowed to edit the figure):
  - 195-202 from behind her head is a flat black shape: give the back of the hair its highlight band, a few strand lines and the rim,
    so the bun and the head read as form (this is the film's closest shot).
  - 170.6-181 front-row copies' eyes are dark ovals: face LOD should drop to "no eyes" earlier, or keep proper eyes; never dark ovals.
  - 236.6-240 jaw ink line and collar merge under the chin: separate them (neck shadow shape, collar a little lower).
  - 222.7-229 her face is pale against the sun where it should be silhouette: silhouette rule by sun angle, face included.
  - hair covering the top of the back disc at 0.5 / last frames; ear strand crossing the cheek at 125.3-127 (if figure-level).
  - a warm key-colour input if Act C asks for one.
- 3:41.0-3:42.7 the waiting crowd is grey-violet: true silhouettes with accents.
- 3:56.6-3:57.4 the handover into day: remove the pop properly (blend `catch` into `free` over the cut, or start `free` earlier under
  the catch's last hold) instead of hiding it on her feet; she should be seen whole, face lit, as "Back to main" starts.
- 4:03.7 bodies overlap at the fork; 4:10.6-4:12 a branch half hidden.
- 4:16.0-4:18 runners are specks on white, then the map: keep people readable until the pull-up (hold lower longer, start the map
  dissolve from a frame that still has bodies).
- Map: `formation` label sits far from its rings.
- Face arc check: night calm; first lit open-eyed look at the catch (229.6-236); day joyful; the last shot (terminal) calm, back to us.
