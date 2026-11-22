# Car in three.js (film v8, Jade's 4:30.46 note): resume note

Owner: car agent. Own paths (committed): `fable/take2/src/car3d.js` (the module), `fable/take2/src/car3d_page.js` + `fable/take2/car3d.html`
(standalone harness, exposes `window.FILM` like film.js), `fable/take2/tools/car3d_render.mjs` (copy of `tools/render.mjs`, GPU on,
page car3d.html, max 3 workers), `fable/take2/tools/car3d_matte_clean.py`, this note.
Outputs (git-ignored): `work_fable/take2/dev/v8_car/` (stills, strips, mp4s), cut-out `work_fable/take2/kit/car_confess/{rgba,clean}/`,
**plate `work_fable/take2/plates/car3d/`** (210 frames, 30 fps, `t0_song` 269.9 = film frame 8097, song-locked, ends 276.9).

## State (2026-11-21): DONE v2, waiting for the main thread / compositor. Looked at on stills, strips and the mp4; not watched by Jade.
Review files: `work_fable/take2/dev/v8_car/car3d_v2_preview.mp4` (with audio and a preview copy of the box), `car3d_v2_plate.mp4` (no box),
`v2_strip.jpg` (every 0.25 s), `dbg/full_a.png` (opening, full res), `dbg/full_h.png` (end, full res).

## What it is
Shot b157.3-161.3 (269.980-276.820 s). World in metres, car fixed, road moving at 26 m/s (~58 mph), left-hand-drive car in the right
lane of a two-lane road: yellow centre dashes (US 3.05 m dash / 12.2 m cycle) on the driver's left, solid white edges, delineator posts
with amber reflectors, utility poles + wires on the right, low hills, the verse 2 Milky Way (vio_wide crop, as outro.js uses) dimmed,
horizon haze, low-beam pool on the road, the violet page-light riding on the centre line ~22 m ahead (outro.js `roadPage` path, same
clock `road0` = b156.1, so it continues from the road shot) with a violet glow on the asphalt. Car interior: dash, instrument hood with
two glowing gauges, centre screen, vents, rear-view mirror, A/B/C pillars, roof, door panels (armrest, handle, pocket), centre console +
shifter, two front seats with headrests, rear bench, steering wheel on the LEFT (driver), seat belts on the outboard shoulders (hers from
the right B-pillar across to the inboard buckle; the driver's hangs on its pillar). Look: MeshToon (4 flat steps) in the car_confess
plate's navy (sampled), ink lines from a normal + inverse-depth Laplacian edge pass, 6-sample motion blur (half-frame shutter).
Not the hatched paper pass: the end of the shot is the drawn plate, so the 3D is styled to match the plate's cel look instead.

## Camera (song time)
1. 269.98-271.69 (to b158.3): over her LEFT shoulder from between the rear headrests (0.07, 1.29, 0.74 m), yaw 14 deg right, vfov 34;
   slow drift forward. Road VP at ~x 0.3, centre dashes on the left, white edge on the right, page-light ahead; her hair from behind right.
2. 271.69-273.18 (b158.3 to b159.2.6): dolly (bezier through the gap between the front headrests) to the DRIVER'S EYE (-0.37, 1.18, -0.12),
   the view straightening to dead ahead: for a moment the frame is the driver's view of the road (the 'you'). She leaves frame right.
3. 272.70-273.83 (lands on b159.4): pan right ~101 deg about the eye (pure rotation in its last part), pitch to -16, vfov 52, onto her.
4. 273.83-276.82: hold with a 1.5 % push. Her turn starts 273.95 (clip 3.0 s, the blink), the almost-smile settled by ~274.95 and held
   ~1.9 s to the cut (v7: ~2.4 s; see weak points).

## How she is placed
- Start: a toon proxy (lathe hair shell with drawn streaks and a highlight ring, rim light; white shoulders, arm bands, orange headphone
  cups, black band behind the neck). Only her back/left side is ever seen.
- End: the car_confess plate cut out with BiRefNet (`tools/matte.py`, then `car3d_matte_clean.py` keeps the largest component) on a card
  fixed to the FINAL camera (fills its frustum at 0.8 m, drawn on top, no depth test), so the end frame is exactly v7's framing of her.
  Because the camera is at the driver's eye and only rotating while she is in frame, the card has no parallax and holds up.
- Swap proxy -> card at 273.18 (dolly end), when she is ~60 deg outside frame right. Her clip: 0.75x through the turn, 0.5x after,
  two-frame blend; the card's bottom 4 % fades (her lap at the frame edge).
- No new drawn still is needed. Optional (paid, ask Jade first): a drawn back/over-shoulder still of her in the car seat (hair down,
  white jacket, orange headphones, no stripe on the back) to replace the proxy; one gpt-image/nano-banana still ~ $0.05-0.20 plus a
  short clip if she should move (~$1-3). Recommendation: not needed unless Jade finds the proxy too plain.

## Commands
    node fable/take2/tools/car3d_render.mjs --stills 270.5:a.png,276.2:b.png [--q "hud=1&box=0"]
    node fable/take2/tools/car3d_render.mjs --mp4 out.mp4 --range 269.9:276.9 --audio "inputs/Merge (keychange down).wav" --workers 3 --crf 16
    # the plate (no box): --range 269.9:276.9 --crf 10 --q box=0, then
    #   ffmpeg -i car3d_v2_plate.mp4 -q:v 2 -start_number 1 work_fable/take2/plates/car3d/frames/f_%04d.jpg ; meta.json {fps:30,n:210,t0_song:269.9}; touch REAL
    # dev: --q "dcam=x,y,z,yaw,pitch,vfov" (fixed camera), "dbg=1" (normal buffer), "dbg=0.3" (edges), "sub=1" (no blur), "ink=1.8", "sky=0.45",
    #      "yawA", "yawF", "pitchF", "vfovF", "vfovE"
    # matte: work_fable/venv_hybrid/bin/python fable/take2/tools/matte.py <car_confess.mp4> work_fable/take2/kit/car_confess --fps 24 --size 1280x720
    #        work_fable/venv_hybrid/bin/python fable/take2/tools/car3d_matte_clean.py work_fable/take2/kit/car_confess
Renders: ~19 fps with 3 workers on the RTX 3090 (the whole shot in ~12 s).

## Wiring (compositor; shots.js only, no film.js change needed)
In `fable/take2/shots.js`, the b157-161 shot: put the new plate first in `next` and drop `carRoad` for it (the windows are no longer
black, the road is in the frames):
    next: [{ id: 'car3d', kind: 'plate', opt: { songLock: true, push: 0, blend: false } },
           { id: 'car_confess', kind: 'plate', opt: { clip0: 1.5, clip1: 5.0, blend: true, push: 0.015, carRoad: CAR_ROAD } }]
(film.js already takes a `next` list, first landed plate wins: film.js ~line 1181.)
`songLock` uses `meta.t0_song` (clip = song time - 269.9, frame = round(clip*30)): every film frame k in 8097..8306 maps 1:1 to plate
frame k-8096, no resampling. Keep `carBox: CAR_BOX` unchanged: the box timing (open 0.35 s, typed by ~3.2 s, close 6.55 s) was checked
against the move: it finishes typing as the camera reaches the driver's eye, and her face is above the box for the whole hold.
Grain/vignette come from the film as for any plate. The plate holds the drawn likeness only (no photo likeness); it stays git-ignored anyway.
Optional continuity: the road shot before (outro.js `RD`) uses 2 m dashes every 6 m with the line 1.9 m left of the eye; here the US
spacing and 1.43 m. Nobody should see it across the cut; align `RD.DL/DP` to 3.05/12.2 if wanted.

## Weak points
- The opening proxy is plain (hair shell + shoulders); it reads as her from behind but has no drawn texture like the plate.
- The steering wheel's lower rim shows at the bottom-left corner in the opening and the driver's view, with no hands (the driver is the
  camera); the box hides most of it.
- Sky through the side window (end) is the mirrored Milky Way crop and reads a bit like cloud; poles pass ~every 2 s there.
- Her hold after the smile settles is ~1.9 s (v7 ~2.4). To lengthen: start the pan earlier (TM.panA/panB) or speed the turn (herClip).
- Mid-pan frames (273.2-273.6) are heavily motion-blurred (half-frame shutter); her card enters blurred, which hides the swap.
- The plate's 3/4 cheat: her body is drawn more frontal than a real driver's-eye view; the 3D seat behind her is seen from the side.
