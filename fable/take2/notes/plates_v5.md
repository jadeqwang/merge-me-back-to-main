# Plates for the master (v5) (plates agent, 2026-11-14)

Brief: `notes/master_direction.md` section A (Jade on v4, `notes/jade_v4_notes.md`: "kids faces should have skin tone"). Specs:
`gen/stills.json` (`home_v3`, `home_v3_turn`), `gen/gen_clips.py` (`home_v3`, same prompt as `home_v2` plus one sentence on the
children's skin). Review images in `work_fable/take2/dev/v4_plates/home_v3_*`.

## Resume state

DONE. `home_v3` accepted (t1) and intaken at `work_fable/take2/plates/home_v3/`. Nothing queued.

## Spend

Start $548.46, close **$550.02** (whole project, `tools/gen/spend.py`). This item: **$1.56** (4 stills about $0.134 each, 1 clip
$1.156). Cap constant unchanged (600, not hit).

## `home_v3`: the children's visible skin

Fault in `home_v2`: the two children (from behind) had ears, neck, cheek edge and arms in the room's blue (warm-skin pixel count in
the children's region x 0-620, y 230-720 at 1280x720: 300-560 per frame, which is only lamp-beam strokes).

Stills (one reference each, edits, skin of the children only, never photo-referenced):
- `home_v3_a1/a2` = edit of `home_v2_a1` (the start). Both passed: the children's ears, backs of necks, the edge of the cheek and
  their arms and hands are warm and lamp-lit; still seen from behind, same poses, hair and clothes; no eyes or faces. The boy shows a
  slightly larger lost-profile cheek edge than before (no features). Her figure unchanged. Chose **a1**.
- `home_v3_turn_a1/a2` = edit of `home_turn_v2_a1` (the turn frame). Children as above in both. a1 changed her face slightly (a
  broader smile): not used. Chose **a2** (her v2 turn face kept).
- Mean absolute difference to the source (of 255): children 10-12, her 7-8, rest 6-8 (re-render texture, no shift).

Clip t1 (first `home_v3_a1`, last `home_v3_turn_a2`, the `home_v2` prompt plus "their ears, necks, arms and hands keep their
natural warm skin tone ... never blue"): **ACCEPTED**. Measured on every frame (`scratchpad skin.py`, warm skin = R>170, G>120,
B>80, R>B+30):

| region | home_v2 t2 | home_v3 t1 |
|---|---|---|
| children (x 0-620, y 230-720) | 300-560 | **5671-6382** (never drops) |
| her face (x 840-1000, y 60-260) | 3055-5286 | 2853-5157 |
| her hands (x 560-900, y 230-500) | 3461-4040 | 3148-3839 |
| head-turn motion peak | 2.83 s | **2.83 s** |

Strip `dev/v4_plates/home_v3_t1.jpg` (every 0.25 s to 4.75) and crops at 0.5, 2.5, 3.5, 4.96 s
(`home_v3_t1_crops.jpg`): children from behind all through, never turn, warm skin to the last frame; her face warm in profile, the
film's face after the turn; nothing new in the last second.

Other plates with the children: none. Checked `det_home_v2` (her hand by the bulb), `runner_home` (her alone), `facade_home`
(house with bikes), `facade_home_v2` (empty living room); specs in `stills.json`/`orch_stills.json` mentioning children are only
the `home*` ones. The fold window and the b37 grid use the life plate, so `home_v3` covers them.

## Wiring

| plate id | replaces | clip range | timed events | framing / notes |
|---|---|---|---|---|
| `home_v3` | `home_v2` everywhere (parenthood life plate, b37 grid turn, fold window, flashes) | as `home_v2` | **turn_t 2.85** (motion peak 2.83, as v2); look settled about 3.4; holds to 5.0 | same framing as `home_v2`; `focus [0.66, 0.3]`; children's skin warm in every frame |
