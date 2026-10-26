# Video-model bake-off: fight choreography (2026-10-26)

Jade's notes on the partner-roll take `dr_dl_roll_t65`: "the roll itself is good, but there's a bunch of glitches like a disembodied leg … getting
up from the fall — that's not how humans get up … one character clipping through the arms … symmetrically kicking at each other is kinda weird,
we'd normally have a kick be countered with a block that's designed for kicks … can you try a few different models? how well does veo do on this?"

**Winner: Seedance 2.5** (`bytedance/seedance-2.5`, the model we already use). It won both tests. It is the only model that kept the two
partners as two separate, correctly coloured people through most of the move, that obeyed the choreography (one kick, a knee check, a counter,
a block), and that hit the second marks (it takes the drop instrumental as a reference audio, so its cues land on beats). Veo 3.1 is the
runner-up on looks (1080p, the best skin and cloth), but it runs ~1 s early, reframes the shot, and in 2 of its 4 takes it invents a third
person, a ghost figure or a prop. **Picks: `dr_dl_roll_t72_aca95618a0` (the roll) and `dr_dl_kick_t72_9f2e8dd66e` (kick vs block).**

## Setup (the same for every model)
- **First frame:** `review/takes/stills/dr_dl_roll.png` (the close two-shot: orange copy left with a ponytail, violet copy right with two space
  buns, four small background figures), re-encoded to `media/gen/refs/dr_dl_roll_2048.jpg`.
- **One prompt per test, under 1000 characters** (Runway's limit), the same words for every model: `tools/sd/bakeoff.py` (`HEAD + ACT[test] +
  BODY`; the specs are `review/takes/specs/dr_dl_{roll,kick}_t71–80.json`). Only Seedance also gets the reference audio and one extra sentence,
  "Each timed move lands exactly on a beat of the reference audio."
  - (a) **roll:** the orange copy bends forward with a flat back at 1.7 s; at 2.6 s the violet copy puts her palms and shoulders on that back
    and rolls over it lengthwise, legs together in one high arc, inverted at 4.3 s; she lands on both feet on the far left side at 4.8 s, and
    both freeze in a liangxiang pose.
  - (b) **kick:** at 1.7 s the violet copy alone throws a middle front snap kick at the orange copy's stomach. The orange copy does NOT kick:
    she lifts her front knee and sweeps her forearm down, parrying the shin past her hip. At 3.5 s she counters with a bow-stance straight
    punch that the violet copy blocks with her forearm; both freeze at 4.6 s. "One kick only."
  - Both prompts end with the same physics/anatomy block: real weight, knees bend on every landing, always two separate people with two arms
    and two legs each, no limb appears, vanishes or detaches, bodies never pass through each other, a static low side camera, one shot.
- 6 s, 16:9, no generated audio, 2 takes per model per test (tags: Seedance t71/72, Veo t73/74, Hailuo t75/76, Runway t77/78, Vidu t79/80).
  Round 2 (the winner only): 4 more Seedance roll takes t81–84, with one added sentence: each copy keeps her own colours to the end.
- Judged on contact sheets at 6 fps and 12 fps crops of the action (and full-res frames at the critical moments) for anatomy, physics,
  choreography logic and likeness/costume (lane colours, violet's two buns, orange's ponytail, the patch).

## Models on the relay (`docs/gen_catalog/`, live probe 2026-10-19)

| model | id | first frame | durations | audio | resolution | list price | used |
|---|---|---|---|---|---|---|---|
| Seedance 2.5 | `bytedance/seedance-2.5` | `image` (+ last frame, 30 ref images, ref videos, **ref audio**) | 4–30 s | ref audio in; generated optional | 480p / 720p | $0.2312/s @720p | **yes** (baseline) |
| Veo 3.1 | `google/veo-3.1` | `image_input` (raw base64) | 4 / 6 / 8 s | generated (on = 2x price) | 720p / 1080p | $0.20/s, $0.40/s with audio | yes (1080p) |
| Veo 3.1 Fast | `google/veo-3.1-fast` | `image_input` | 4 / 6 / 8 s | generated | 720p–4k | $0.08/s @720p | no (Veo 3.1 tested instead) |
| MiniMax H3 | `minimax/h3` | `content[]` with a `first_frame` image | 4–15 s | — | 768P / 2K | $0.08/s | **failed**: all 4 jobs 7003 "User Input Error" (not billed) |
| Hailuo 2.3 | `minimax/hailuo-2.3` | `first_frame_image` | 6 / 10 s | — | 768P / 1080P | $0.28 per 6 s @768P | yes (replaced H3) |
| Runway Gen-4.5 | `runwayml/gen-4.5` | `image_input` (URL / data URI) | 2–10 s | — | 1280:720 etc. | $0.12/s | yes |
| Vidu Q3 Pro | `vidu/q3-pro` | `start_image` (+ `end_image`) | 1–16 s | generated (default on) | 540p–1080p | $0.125/s @720p | yes (audio off) |
| Wan 2.7 i2v | `alibaba/wan-2.7-i2v` | `image` | 2–15 s | — | 720P / 1080P | $0.10/s | not tested (see the end) |
| Pixverse v6, LTX-2.5 Fast, Grok Imagine Video | — | yes | — | — | — | $0.045–0.09/s | not tested (Grok is unsupported on the relay: ZDR needs an upload URL) |
| **Kling** | — | — | — | — | — | — | **not in the catalog**: Cloudflare's model catalog has no Kling model, so the relay can't run it |

## Results

Cost of the bake-off: **$22.90** for 24 takes (list price, from `docs/spend_ledger.jsonl`; the four H3 failures were not billed).

| model | takes | cost | anatomy | physics | choreography logic | likeness / costume | verdict |
|---|---|---|---|---|---|---|---|
| **Seedance 2.5** | roll t71/72 (+ t81–84), kick t71/72 | $5.55 (4 takes) + $5.55 round 2 (4 roll takes) | two separate bodies through the roll in t72, t81, t84; no extra limbs | weight on the base partner's hands and feet; landings bend the knees | does what the prompt says, in order, on the beats; kick t71/t72 are textbook knee checks | faces and hair hold until the landing, then **violet's trouser tabs turn orange (~4.7 s) and the hairstyles swap (~5.2 s)** in every roll take | **winner**: usable up to ~4.65 s of the roll, the whole kick |
| Veo 3.1 | roll t73/74, kick t73/74 | $4.80 | t74: a duplicate violet appears; t73: a ghost figure behind them | good weight, fast | ~1 s early on every cue; t74 kick: both kick at once (symmetric) | t74 roller turns orange; t73 kick: a bow/sword appears in orange's hand; reframes to a frontal salute | runner-up on image quality, unreliable on people count and props |
| Hailuo 2.3 | roll t75/76, kick t75/76 | $1.12 | t75: the partners merge into one; t76: tangled, mirror-image headstands | — | the wrong copy kicks (orange) in both kick takes; no block | background figures vanish, camera pushes in | **fail** |
| Runway Gen-4.5 | roll t77/78, kick t77/78 | $2.88 | t78: legs tangle at the peak | landing in a heap (t77) | both kick takes turn symmetric (both knees up, then orange kicks back) | background figures change count and pose at 1 s; bands go brown | fail for fights |
| Vidu Q3 Pro | roll t79/80, kick t79/80 | $3.00 | t80: violet's head merges into orange's hair; kick t79: legs pass through each other | t79 is a convincing front walkover with a real landing | kick t80 is a correct knee check + punch/block | violet's trousers go orange mid-flip and green/blue after; orange posts / flickers in the background; t80's ponytail stretches like a rope | close third: better physics than Veo, worse colours than Seedance |

### Contact sheets, take by take (times are clip seconds)
**(a) roll**
- **Seedance t71**: orange folds forward (0.7), violet rolls slowly over her back (2.5–5.2, inverted ~1.5 s); output came back 1470×630
  (21:9) despite `aspect_ratio` 16:9; after landing the copies swap places and violet's hair turns into a ponytail.
- **Seedance t72 (pick)**: orange bridges on her hands (0.7–1.8), violet steps in (2.2), handstand over the back, vertical 3.75–4.17,
  legs swing down 4.4–4.9, lands on the left 4.9–5.1, both freeze in a horse stance from 5.4. Clean and separate to ~4.68; from ~4.7 small
  orange tabs on violet's trousers, from ~5.2 the hair swaps (orange gets two buns). Background: two figures render as dark lumps from ~2.9.
- **Veo t73**: orange on all fours, violet cartwheels over (2.0–3.5), peak ~2.6; a translucent ghost figure 2.8–3.3; orange gets up and both
  turn to camera for a fist-palm salute; background figures crouch like frogs.
- **Veo t74**: cartwheel over a crawling partner from 2.0; at 2.8 a third, violet-banded figure stands at the right while the roller turns
  orange; ends in a frontal salute with teal bands on the left copy.
- **Hailuo t75**: from 2.0 the two partners merge into one body; one copy cartwheels alone and walks off; camera pushes in; background empty.
- **Hailuo t76**: the bodies tangle low (2.8–4.2), then two inverted figures mirror each other in headstands to the end.
- **Runway t77**: the four crouching background figures become a standing line of six at 1.0; a forward roll over orange's back (2.5–4.5);
  violet lands sitting in the water; both stand up awkwardly; faces drift.
- **Runway t78**: orange goes to a bridge, violet cartwheels over (2.0–4.0); legs merge at 3.3–3.8; violet exits left, orange's bands go brown.
- **Vidu t79**: orange bends at the waist, violet does a front walkover across her back (3.3–4.8, peak on the 4.3 mark), lands 4.8–5.2 —
  the best motion outside Seedance — but violet's trousers carry orange tabs mid-flip (3.9–4.8) and green/blue bands after; orange posts in
  the background from 1.7.
- **Vidu t80**: sideways roll (2.5–4.5); at the peak violet's head merges into orange's hair; after landing orange's ponytail stretches
  horizontally to violet's hand; violet's bands turn blue.
- **Seedance t81–84 (round 2)**: t81 clean roll, then the copies swap back into the opening guard; t82 recolours violet on landing; t83 a low
  all-fours base, a tangled landing, orange trousers on violet; **t84** the cleanest landing (straddle roll, feet down ~5.0) but orange tabs on
  violet from ~4.75 and a hair swap from ~5.2. The colour sentence did not help: Seedance recolours the roller after the inversion every time.

**(b) kick vs block**
- **Seedance t71**: violet's side kick (1.3) meets orange's lifted knee and guard (1.5–2.8, held ~1.5 s, a little static), orange's counter
  punch (3.4–4.0), violet's forearm block, freeze; in the final bow stances the two front legs overlap.
- **Seedance t72 (pick)**: violet chambers (1.2), front kick lands on orange's lifted knee and downward forearm (contact ~1.67, held to ~2.5),
  orange steps in with a bow-stance punch (3.42) and violet blocks it with her forearm, frozen from 3.67. Two clean bodies throughout; the
  RARE EARTH back print reads on violet.
- **Veo t73**: kick + knee check ~0.8 (1 s early), counter punch 2.3; from 3.0 a thin bow/sword appears in orange's hand.
- **Veo t74**: both kick at once at 0.7 (symmetric), the background drops from four figures to two, then mirrored punches.
- **Hailuo t75**: orange kicks (the wrong copy); violet counter-kicks into her; legs tangle 3.0–4.2.
- **Hailuo t76**: orange kicks, violet neither blocks nor counters; they reset.
- **Runway t77**: violet's roundhouse 0.7–1.5; then both lift knees together; mirrored palms; background figures shuffle.
- **Runway t78**: violet kicks, then orange kicks back (symmetric); legs overlap 3.0–5.3; both turn to camera.
- **Vidu t79**: low side kick + knee check (2.0–2.5), but the legs pass through each other at 2.9–3.2; punch/block with crossed arms.
- **Vidu t80**: roundhouse checked by a lifted knee (2.0–2.5), then punch + forearm block; a small orange object flickers in the background.

## What this means for the film
- No model gets a full partner acrobatic move clean from start to finish. Every model that gets the move right breaks identity or colour
  afterwards. So we cut: only the clean stretch of the best take is ever on screen.
- Seedance follows choreography written as cause and effect ("X does NOT kick: she lifts her knee and parries"), and its beat-locked timing
  from the reference audio is worth more than Veo's sharper pixels.
- **In the EDL** (`engine/show/main.js`, drop block; checkpoint 20 in `docs/RESUME.md`):
  - the default drop is **v4** (the v5a fight choreography);
  - the roll is `keyed()` into 91.1–93.1: t72 clip 1.29 → 4.65, real speed to the peak (3.9 on 92.3), ×0.86 to the 93.1 cut, on violet's
    legs swinging down;
  - the kick exchange replaces v4's mirrored palm-to-palm clash on 97.1–98.3: t72 clip 1.24 → 3.84 at real speed, contact on 97.2, the punch
    on 98.2, then back to v4's dr_duilian on its own clock;
  - the v5 group set (with the fall get-up) only behind `?drop=v5`.
- **Previews** (`review/previews/wushu_bakeoff/`, index entries in `review/previews/index.json`): every take raw at real speed with the song at
  its slot, and `v4_drop_roll_t72_kick_t72.mp4`, a rough cut of the new default drop (93–95 is a black card: dr_duilian_mid t1 lives only on
  the box).
- Not tested: Wan 2.7 i2v (cheap, $0.10/s), Veo 3.1 Fast, Pixverse v6, LTX-2.5. Kling isn't available on the relay. If the roll needs a full
  clean landing later, the next experiment is Seedance with `last_frame_image` set to a still of the landed liangxiang pose (it fixes the end
  state, which is where every take drifts).
