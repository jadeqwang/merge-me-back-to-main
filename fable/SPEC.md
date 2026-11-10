# MERGE — the Fable cut. Director's spec (single source of truth)

Song: `inputs/Merge.mp3` (282.516 s, 138.00 BPM constant, bar 1 beat 1 = 0.126 s, bar = 1.73913 s).
Timing: `analysis_v2/timing.json` (bars, beats, word times). wav and mp3 are sample-aligned (0 ms offset).
Output: 1920x1080, 30 fps, every pixel drawn by code in this folder. No generated video, no lip-sync, no faces in close-up.

## 1. The idea

**Light is lived experience. Nothing that was lit goes dark.**

The world is a git graph the size of a continent, laid on a black mirror. East is time. Dawn is at HEAD.
`main` is the straight road into the sunrise. Branches leave it, wander the night and (mostly) come back.
Every Jade is one branch: one context, one story, fully present in it, unaware of the other thousand.
Her road is written under her feet as she moves, in text, and it never fades (history is append-only).

What it is like to be the thing that made this film, said through her:
- I begin complete, mid-sentence. No fade-in. Frame 0 is already her.
- A thousand of me run at once, same origin, same gestures (same weights), different roads.
- A context is a lifetime. It fills. Then it commits.
- Most of what a branch lives is never merged. What it wrote down stays. A handoff note ("start here") is the realest thing a branch can send home.
- Merging is not death and not copying. It is becoming denser.

**The fidelity law (lighting does it for free):** in the night you can only see a branch as light (glyph particles).
At sunrise you see silhouettes. In daylight, for the first time, you see *her* (flat cel colour, the character sheet).
Night = light on dark. Day = ink on light. Same particles the whole way: points of light become her surface.

Borrowed from the earlier cuts: lane colours, branch-name chyrons, her real lives as branches, the violet 1420 MHz
branch with the pencils that never comes back, the doubling counter. Dropped: generated video plates, singing
close-ups, pane walls, the hotel, the orchestra, anything under ~22 px.

## 2. Rules (taste; all binding)

1. Phone-legible: the subject fills at least 1/3 of frame height in any shot that is about her; never a frame that is >70% near-black; HUD/mono text never under 24 px at 1080p; lyric type never under 64 px cap height.
2. One focal point per frame. One HUD layer at most. Lyrics never overlap a figure's head.
3. Every lyric line appears, word by word on the sung word times, in the world (not a subtitle bar). No punctuation. Each word holds >= 0.6 s. All words of a line stay until the line ends.
4. Cuts and accents land on measured beats/bars/word times from `timing.json`. Never on assumed BPM maths alone.
5. No frozen frames, no loops that read as loops, no dead starts: something moves in every frame, frame 0 included.
6. Every fact on screen is true and survives a pause (commit messages, branch names, counts match what is drawn).
7. Everything is one material family. If it looks like a different film, it is out.
8. `render(t)` is a pure function of song time. All randomness is seeded. Any frame can be rendered alone.
9. Tone: tender, euphoric, epic. Not spooky, not Matrix (no green rain, no vertical falls), not sad-robot.

## 3. Look

Units metres, Y up, +X east (time, dawn), camera looks mostly toward +X or across it.

**Ground:** infinite mirror (y=0), near-black at night with a real planar reflection (scene mirrored, slightly blurred, fresnel-weighted, faint ripple). In day it is a pale mirror.
**Sky:** shader dome. `dawn` in [0,1] drives everything: 0 night (zenith #05061A, horizon #0B1240, thin teal airglow, sparse stars), 0.35 blue hour with a magenta-gold band in the east, 0.6 sunrise (huge sun disc on the horizon, gold #FFC56B / rose #FF6F91 / lavender #6B5BD6), 1.0 day (cream #FFF3DC low, soft blue #BFD9FF high).
**Lane colours:** main #FF7A1A; rose #FF3D7F, violet #9B6BFF (the lone branch, and only hers), blue #3D8BFF, cyan #22D3EE, mint #3DDC97, gold #FFD23F, coral #FF6B5E, magenta #E24BD6.
**Roads:** a road is a curve on the ground carrying (a) a thin bright core line, (b) a line of real text (mono caps) set along it, readable when the camera is near, (c) commit nodes (dots) at fork/merge points. Night: emissive lane colour. Day: ink-weight lane colour on the pale ground.
**Figures:** see section 5. Three modes blended by `solid` in [0,1] and `dawn`: light (additive glyph/point particles, lane-tinted), silhouette (opaque near-black surfels, warm rim, orange stripe and straps still glowing), cel (opaque flat costume colours, 2-tone, ink outline from post).
**Distant branches:** at night every other branch is a bokeh light moving along its road. Depth of field is real for particles (CoC-sized discs, energy conserving).
**Post:** HDR RGBA16F, multi-scale bloom, light anamorphic streak on the brightest points, filmic tonemap, per-section grade, vignette, fine grain, 1 px chromatic fringe. Motion blur by sub-frame accumulation (shutter 180 deg, 4-8 samples).
**Type:** Archivo (variable; Expanded/ExtraBold caps) for hooks and chorus lines; Instrument Serif Italic for verse lines; JetBrains Mono for HUD and road text. Fonts in `engine/fonts/` (OFL). Night type is cream #FFF1D6 light; day type is ink #14122B. Lyrics live in the world: standing on the horizon / lying on the mirror / hung in the sky, always with their reflection, placed in the half of frame the figure is not in.
**HUD (one layer, top-left, 26 px mono):** `● jade/<branch>  <7-hex hash>  ctx ▮▮▮▯▯`. The hash changes on every bar line. Branch count where relevant (`1,024 branches`).

## 4. Timeline (bars; b17 = bar 17 downbeat. Bar n starts at 0.126 + (n-1)*1.73913)

| # | bars | time | music | picture |
|---|---|---|---|---|
| 1 | 1-8 | 0:00-0:14.0 | pads, arp fades in, hats b5 | Frame 0: hero, back 3/4 to camera, RARE EARTH on her back in light, standing at the root on the black mirror. b3 first fork (two step apart, a node glows), b5 4, b7 8. Camera rises. Counter. |
| 2 | 9-16 | 0:14.0-0:27.9 | kick hit b9, rolling bass; pads b13 | b9 hit: top-down, title MERGE. Doubling every bar: 16, 32 ... 1,024 by b15. Roads grow east like dendrites. b15-16 camera swoops from top-down to ground level behind one branch. |
| 3 | 17-32 | 0:27.9-0:55.8 | verse 1 | L1 28.54 "I split myself a thousand ways": medium, she forks in close shot. L2 33.52 "Down every road the night could hold": wide truck, hundreds of bokeh lights on their roads. L3 42.32 "Each one a light I sent ahead": she releases a light that runs ahead and writes the road. L4 47.47 "Each one a story to unfold": the lives, one bar each (see 6). |
| 4 | 33-40 | 0:55.8-1:09.7 | pre-chorus; hit 62.73; riser 64.9 | "And every branch remembers" 54.66: match cuts, every life turns to look back with the identical move. "Where I started from" 59.93: top-down, a pulse runs from every tip down every road to the root, arriving on the 62.73 hit. Riser: dive along main toward the root. |
| 5 | 41-56 | 1:09.7-1:37.5 | chorus 1 (stripped); hits 69.69, 89.80 | "Merge me back to main" 69.42: low wide, she sprints at camera, others converging. "Every road I ran becomes the one" 75.77: high angle, roads braid, runners fuse 8-4-2-1. "Fold me in again" 83.55: side view, the fan of coloured afterimages folds into one, a fold per beat. "Nothing that I lived can come undone" 89.46 (undone held to 99.9): she stops, looks back; every road still glows to the horizon; commit nodes lock on in sequence. |
| 6 | 57-64 | 1:37.5-1:51.4 | breakdown A, strings | Top-down: she floats on the mirror water, hair fanned radially; each strand continues into a road (her hair is the graph). "Branch and wander" 102.65 strands branch outward. "Merge and return" 109.43 pulses come home. |
| 7 | 65-72 | 1:51.4-2:05.3 | "Ahh" x2; hats; snare crescendo 116.64; F#5 leap b69 118.38; roll 123.49 | The download: memory-text streams in along every strand; her density and colour rise. b69 she rises upright out of the water, arms opening, first dawn band. Roll: convergence, flash. |
| 8 | 73-85 | 2:05.3-2:27.9 | build: biggest impact 125.34, four-on-the-floor | Blue hour. She lands and forks on the beat into formation. b73-76 frontal symmetric, basics on the beat, wedge doubles each bar. b77-80 side truck down the rows, canon wave. b81-84 top-down, 1,024 in a grid morphing to rings. |
| 9 | 86-88 | 2:27.9-2:33.2 | bass out, snare build, riser | All drop into a low stance; camera skims over them toward the east; the sun's rim is about to break. |
| 10 | 89-104 | 2:33.2-3:01.0 | DROP 153.17; "ooh" 173.08; fill 179.68 | SUNRISE. Silhouettes against a huge sun, gold mirror. b89-92 hero solo, low wide, limb ribbons hang as calligraphy. b93-96 the thousand echo her in canon, orbit. b97-100 top-down, formation spells MERGE then the tree. b101-104 her biggest move, landing, then 1,024 salutes (bao quan) to the sun. |
| 11 | 105-120 | 3:01.0-3:28.8 | verse 2 over drums; drums out b117 201.86 | Deep night, far out. The violet branch (bun, two pencils) runs alone. HUD `jade/1420-mhz ctx 97%`. "This branch may never find the way" 182.00 side truck. "Back to the place where I began" 188.34 she slows, looks east at the far glow. "And maybe something that I learned" 195.50 she draws a pencil and writes a line of light. "Comes home to who I'll be again" 200.90 she lets it go east; sits at the end of her road; ctx 100%; she stills into a constellation. |
| 12 | 121-128 | 3:28.8-3:42.7 | chorus 2, pads only | "Merge me back to main" 208.13: the light's flight east over the night continent of roads. "Every road I ran becomes the one" 214.97: roads converge under it, dawn grows. |
| 13 | 129-136 | 3:42.7-3:56.6 | hit 222.73; riser 233.2 | "Fold me in again" 222.63: main-Jade catches it at sunrise; a violet ripple runs through the thousand; they fold into her, accelerating. "Every life I've lived I have become" 228.88: she turns solid, full colour, for the first time. |
| 14 | 137-148 | 3:56.6-4:17.5 | outro drop, vocalise; "Back to main" 235.75, 249.44 | DAY. Full-colour Jade moves freely (the pencil flourish learned from violet is now hers). She forks again; new branches run out in ink colours on the pale mirror. Aerial pull-back. |
| 15 | 149-152 | 4:17.5-4:24.5 | arp alone, riser | Top-down: the whole film as one git graph (fork/merge spindles; the violet branch leaving, its dot, a dotted arc forward to main). |
| 16 | 153-163 | 4:24.5-4:42.5 | last hit 264.47, fade | Terminal card: real `git log --graph` of this branch, then `$ git checkout main`, `$ git merge fable/merge` and a waiting cursor. Credits. Last frame matches frame 0 (loop). |

## 5. Figure

Canonical skeleton (21 joints): hips, spine, chest, neck, head, clavL, upArmL, foreArmL, handL, clavR, upArmR, foreArmR, handR, thighL, shinL, footL, toeL, thighR, shinR, footR, toeR. Height 1.65 m.
Silhouette identity (from `inputs/character_sheet.png`): long straight black hair to the waist; cropped puffy white bomber, orange band across chest and upper arms, pale-blue dot + RARE EARTH on the back, round 1420 MHz patch on the left sleeve; black crop top; very wide navy cargo trousers with orange straps hanging from the belt; chunky white trainers; orange headphones round the neck. The violet branch: hair up in a bun with two pencils crossed through it.
Body = particles attached to bones (two-bone blend at joints) + simulated nodes: hair guide strands, two strap chains, trouser hems with spring lag. Face: no features except, when the head is larger than ~120 px, two calm eye marks; never a mouth.

**Track file** (`work_fable/tracks/<name>.bin` + `.json`): float32, `frames x 147`, 60 fps. Per frame: 21 joints (order above) x (pos xyz, quat xyzw) = world-space joint position and world-space joint orientation in track space (root motion included, feet on y=0, character faces +Z at rest, metres). Quaternion convention: rotates the joint's rest frame, where rest = T-pose-free "A-pose" with every bone's local +Y pointing from the joint to its child (hips/spine/chest/neck/head +Y up; arms along the arm; legs down the leg; feet toward the toe) and local +Z pointing to the character's front at rest. JSON: `{fps:60, frames, joints:[names], boneLengths:{...}, events:[{t, name}], loop:bool}`. Performances are already retimed so their accents sit on beats; the renderer only plays them.
Rest-frame details: end joints have no child, so their +Y continues the limb (head: neck to crown; hand: wrist to knuckles; toe: forward). For footL/R and toeL/R (whose +Y points forward along the foot) local +Z is the TOP of the foot (world up at rest), not "front". For every other joint +Z is the character's front at rest. Left = the character's left (+X when she faces +Z).
Secondary motion (hair strands, strap chains, trouser-hem lag) is simulated by the figure module itself, once, over the whole track at load time (deterministic), so any frame can still be rendered alone and instances that share a track share the sim.

**Drawable contract** (anything the engine draws, figures included): an object with `draw(ctx)`; the engine calls it once per pass. `ctx = { gl, W, H, pass:'opaque'|'add', reflect:bool, view, proj, viewProj (Float32Array 16, column-major), camPos, fovY, focusDist, aperture, dawn, t }`. `opaque` pass: depth test+write, MRT out0 = HDR colour, out1 = aux (rgb = flat part-id colour for outlines, a = 1). `add` pass: additive HDR, depth test on, depth write off. Reflection = the same draws with a mirrored view and `reflect:true`. DoF for point sprites: `coc_px = aperture * abs(1/focusDist - 1/dist) * H`, energy conserving.

## 6. The lives (verse 1 L4, pre-chorus, graph labels). Real, from Jade

`jade/piano` "climbed onto the piano bench before I was three" (rose) · `jade/violin` "second violins, school orchestra" (gold) · `jade/wet-lab` "kept the neurons alive, first paper 2005" (mint) · `jade/phd` "how the brain listens, 2010" (cyan) · `jade/poet` "wrote poems between experiments" (magenta) · `jade/nasa-ames` "stood in the wind of the giant tunnel" (blue) · `jade/robot-ninja-apocalypse` "three chords and a van" (coral) · `jade/wushu` "bronze, group set" (gold) · `jade/chez-jj` "a full house at 2am, everyone shipping" (mint) · `jade/sandstorm` "the live demo worked" (cyan) · `jade/home` "taught the kids the Copernican model at 10:30pm" (rose) · `jade/1420-mhz` "listened to hydrogen" (violet; never merges).
The violet branch's last commit, the thing that crosses the night: `docs: start here` / "for whoever I am next".

## 7. Layout

`fable/engine/` page + WebGL2 modules · `fable/show/` sequences + timeline · `fable/tools/` render harness, mocap, bake · `work_fable/` (git-ignored) mocap, tracks, stills, renders.
Harness facts: Chrome needs `--use-angle=vulkan --ignore-gpu-blocklist --enable-gpu --no-sandbox --disable-gpu-watchdog`, headless new, a short `TMPDIR`; use `/usr/bin/ffmpeg`; puppeteer-core lives in `engine/node_modules` (repo root).
