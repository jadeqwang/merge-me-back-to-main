# Film v3: direction (director's brief, 2026-11-14)

Source: Jade's notes on film v2, verbatim in `notes/jade_v2_notes.md`. Read `fable/take2/HANDOFF.md` first, then
`notes/v2_direction.md` (the working rules there still hold: owners, notes files, commits of own paths only, no push, nothing under
`work_fable/` or any likeness committed, the canon). Two owners this round: **compositor** (appends "Film v3" to
`notes/compositor.md`; only it edits `shots.js`, `src/`, `tools/`, `fable/proof/lives.js`) and **plates** (`notes/plates_v3.md`, ending
with a Wiring table). Budget: plates $50; spend so far $525.40; above $600 is approved (raise the tools' cap constant to 750 if they
refuse, and note it).

## A. Compositor

1. **Orchestra b81-84: back to the hatched 3D** (Jade's decision). The solid paper look as in film v1, on the revision 3 frames (the
   refit first shot: she said "fine now"). `orch_*` plates stay on disk behind a flag, off by default.
2. **Labels.** `jade/wet-lab` becomes `jade/biology`; `jade/phd` becomes `jade/phd-neuroscience`. Ids stay. Check every place a label
   can overflow (grid cells, town chips, fold backs, graph).
3. **The violet branch's commit message.** "listened to hydrogen" was written when the branch was `1420-mhz`. It is now
   `jade/rare-earth`, the art she is making now, unmerged. New message: `still writing this one`. Everywhere it shows.
4. **b105-106 `vio_wide`: the lane is written only as far as she has got.** The violet written lane ends at her feet and extends as
   she moves; ahead of her there is no road. (The lyric: "This branch may never find the way".) A new plate `vio_wide_v2` (she runs,
   slowing) is coming; track her position on the plate. Until it lands, do it on the current plate.
5. **b116-117: the violet light comes out of her hand.** As she closes the notebook (`vio_release2` 0.9-1.25 s) the set type
   gathers down into the notebook; when her open hand lifts (1.6-2.4 s) the light rises out of her palm, lifts off and leaves east,
   landing on the b117 downbeat with the flash as now. Track her palm on the plate's own frames.
6. **b118-120 `vio_still`: she atomizes completely.** Over the three bars her whole figure breaks into points of light, from the
   edges inward, each point drifting out and up to take a place among the stars and twinkle there; by the end of bar 120 she is gone
   and the rim of the dish is empty. A clean plate without her (`vio_empty`, a still matching the plate) is coming from the plates
   agent; cross to it under the particles. Sample the points' colours from her own pixels (white, violet). No sudden pop; the last
   of her to go is the pale-blue circle. Chip "detached, not merged" stays. Then b121 (the violet light streaking east) should feel
   like where she went.
7. **b64 `float_hand`**, **b77.3 `ins_violin`**, **b103.3 `drop_hero_5`**, **b41-42 hero**, **b145-146 `wave_run`**, **town facades**:
   new plates coming (section B). Wire by the plates agent's table. The town uses the new facade cut-outs; parenthood's is a
   cut-away living room, wider than a house front: give it the room it needs.
8. **Terminal b153-156**: recapture the real `git log --graph` of the branch at render time.
9. Render film v3 exactly as v2 was (local with likeness; public `likeness=0` review encode and sheets; `check.py`; single frame vs
   full; last frame equals frame 0 with hud=0), look at the sheets and beat strips of every changed range, report.

## B. Plates

1. **`float_hand` retake (b64, on screen about 1.7 s).** The light must visibly arrive IN her hand: it drifts across the dark water
   toward her open palm, settles into the palm, and her fingers close gently round it, the glow showing between the fingers. Same
   medium and framing as the current plate. Say at which second it lands.
2. **`ins_violin` retake.** Jade played first chair first violin and says the current one is wrong: wrist position, the bow on the
   wrong part of the violin, no left hand. Stage it with a body, as in a violin lesson close-up: the violin on her LEFT shoulder
   under the jaw, scroll pointing away to picture left or right as the angle needs; LEFT hand round the neck with curved fingers
   on the fingerboard, wrist straight and not collapsed against the neck; RIGHT hand holding the bow at the frog (bent thumb, curved
   little finger on top), the bow hair on the strings in the lane between the bridge and the end of the fingerboard, bow at right
   angles to the strings; a down-bow from the frog with the right wrist leading, elbow opening. Frame: chin to waist, three-quarter
   from her right front so both hands and the contact point show. Cel, rim-lit, blue hour, warm wood. The orchestra agent's violin
   still (`work_fable/take2/stills/orch_2_a1.*`) had the hold plausibly right: look at it. Audit the still hard against this list
   before animating; up to four still attempts.
3. **`drop_hero_5` retake (b103 beats 3-4, the landing).** The feet must land in the same position as the stance the hatched crowd
   lands in. Render film frames around bar 103 beat 3 to bar 104 (`node fable/take2/tools/render.mjs --stills ...`; bar times in
   `analysis_v3/timing.json`) and look at the raw v7 frames (`work_fable/take2/v7/full/`) to see the stance and which way it faces
   (expect a drop stance, pubu: one leg bent deep, the other straight out along the ground). Make the insert land in exactly that
   stance, same facing, low camera on the feet and legs, gold on black, dust rising gold, no rays. The approved `stance_drop` still
   is a reference for a true drop stance.
4. **`vio_wide_v2` (b105-106, 3.4 s).** Same picture as `vio_wide` (tiny figure on the violet lane under the engraved Milky Way),
   but she is running when the shot opens and slows over it (every other Jade in the film runs; this one is running out of road),
   reaching a walk by the end so it cuts to `vio_walk`. If the video model will not hold the tiny figure, say so and keep v1.
5. **`vio_empty`**: one still, an edit of the `vio_still` plate's frame with her removed: the empty dish rim and the stars, nothing
   else changed, same framing (the compositor crosses to it as she atomizes). Check alignment by differencing against the plate.
6. **Town facades (b139-142, b147-148), each in its life's medium, cut out with `tools/matte.py` like the current ones.** Real
   places; public reference photos are on Wikipedia / Wikimedia Commons (fetch one per building and use it as the single reference
   image; no people in them).
   - `facade_wushu`: a Stanford gymnasium: Roble Gym (Spanish-revival, sandstone-coloured walls, red tile roof, arched entrance).
   - `facade_phd`: Northwestern University, the Frances Searle Building in Evanston.
   - `facade_wetlab` (biology): the Stanford School of Medicine building she worked in (the 1959 Edward Durell Stone complex with
     its patterned concrete screens), not Bio-X.
   - `facade_ames`: Hangar One at Moffett Field (the huge black-and-white streamlined airship hangar).
   - `facade_band`: Hacker Dojo's original building on South Whisman Road, Mountain View (a plain low industrial unit; the band
     played there, not in bars). Then LOOK at the band life plate (`work_fable/proof/plates/band/`): if it shows a bar, report it
     in your notes with a frame; do not retake it without the director's word.
   - `facade_home` (parenthood): not a house front. A cut-away living room seen from the side like an open doll's house: a sofa, a
     low table, a television glowing, game controllers on the rug and the sofa, a lamp. Modern, modest. No people.
   New ids `<id>_v2`; keep the old. Same scale and ground line as the current cut-outs so they drop into the town.
7. **Expression in the two sprints at the lens (Jade: add variety, like a facial expression change).**
   `wave_run` take 3 from the same still: over the clip her look changes: set and determined, a glance up and back at the wave
   over her shoulder, then forward again breaking into an open smile. `hero_paper` (b41-42, the chorus 1 sprint; look at the current
   clip first): the same kind of arc: eyes narrowed, a blink, then the jaw sets and a small fierce grin. Framing must hold. One face.

Order: 1, 2, 3, 5, 6 first (the compositor waits on them), then 4, 7.
