"""Drop ?drop=sync (Jade 2026-10-26: "the entire group does standard long fist, in sync. surely they have sufficient training data for that?" and
"maybe we do the compulsory set?"). No body contact: ONE solo Jade (main's look, canon face v4, high ponytail) performs passages of the compulsory
changquan routine (docs/wushu_sync_longfist.md), one short phrase per take, and the ENGINE draws her six times in the group-set formations,
recoloured per lane, with per-copy time offsets for canon ripples (engine/show/main.js drop block, ?drop=sync). Unison is exact by construction.
Stills: a locked, level, full-body frame on the drop's salt flat with generous headroom (the jumps) and footroom, so a copy can be scaled and
placed anywhere in the formation. Every take: the drop instrumental with ONE BAR of pre-roll (the cut uses clip 1.739 s on, as shots_wushu.py),
second marks in the prompt are clip times on a beat."""
import os as _os, sys as _sys
_sys.path.insert(0, _os.path.dirname(_os.path.abspath(__file__)))
from shots_wushu import _STYLE, _COST, _FACE, _TAIL, _CANON, _BODY, I2  # noqa: E402

_SOLO = (" She is alone: exactly one woman in the whole frame, nobody else anywhere, no background figures.")
_FRAME = (" Camera: a locked-off tripod shot at waist height, perfectly level, the horizon dead straight and horizontal across the frame a little "
          "below the middle. She stands in the centre of the frame and fills only about HALF of the frame height: wide open sky above her head "
          "(at least a quarter of the frame, room for a high jump) and a broad strip of wet mirror water below her sneakers (about a fifth of "
          "the frame), with her full reflection. Plenty of empty space to her left and right.")
_LOOK = (" She is the main copy: ORANGE jacket bands, orange cargo straps and orange headphones around her neck; her long black hair is tied in "
         "ONE HIGH PONYTAIL at the crown (a wushu performer's hair, off her face), no bangs over the eyes.")
STILLS = {
 "ws_solo_front": dict(tool="gpt", out="media/plates/drop/ws_solo_front", refs=["media/plates/drop/dr_dl_roll.png", _CANON] + _BODY,
   prompt=_STYLE + "Sunrise on the wet mirror salt flat, the same world and light as the first reference image (peach-gold sky, soft clouds, the "
          "sun a blazing disc low on the horizon at the RIGHT edge of the frame, well clear of her, long reflections). A wushu changquan "
          "performer at the start of her routine: she stands facing the camera squarely, at attention in the ready posture, feet together, "
          "both fists chambered at her hips, back straight, chin up, eyes forward, calm and fierce." + _LOOK + _SOLO + _FRAME + _COST + _FACE
          + _TAIL),
 "ws_solo_34": dict(tool="gpt", out="media/plates/drop/ws_solo_34", refs=["media/plates/drop/dr_dl_roll.png", _CANON] + _BODY,
   prompt=_STYLE + "Sunrise on the wet mirror salt flat, the same world and light as the first reference image (peach-gold sky, soft clouds, the "
          "sun a blazing disc low on the horizon at the RIGHT edge of the frame, well clear of her, long reflections). A wushu changquan "
          "performer at the start of her routine, seen in a THREE-QUARTER view: her body turned about 45 degrees to the camera's left, so we see "
          "her front and her LEFT side, her LEFT upper arm with its round white '1420 MHz' patch toward the camera; her head turned to look at "
          "the camera. She stands at attention in the ready posture, feet together, both fists chambered at her hips, back straight, chin up, "
          "calm and fierce." + _LOOK + _SOLO + _FRAME + _COST + _FACE + _TAIL),
}
STILLS["ws_solo_front_patch"] = dict(tool="patch", src="media/plates/drop/ws_solo_front.png",
   prompt=("Edit the first image. Change ONLY the round patch on the woman's LEFT upper sleeve (on the orange arm band): make it exactly like "
           "the patch in the reference images, a round white embroidered patch with a thin black ring and the bold black text '1420' above "
           "'MHz', crisp and legible, following the curve and lighting of the sleeve; never put one on her right sleeve. Keep every other detail "
           "of the first image exactly the same: framing, pose, face, hair, lighting, colours, water, sky and grain. Do not add any other text."))
# the picked front candidate (b) filled ~80% of the frame height: no room for the jumps. Pulled back (one nano-banana edit, as dr_dl_roll), then
# an empty copy of the same frame for the engine's world (lattice bg: the solo plate's figure hole never shows).
STILLS["ws_solo"] = dict(tool="edit", src="media/plates/drop/ws_solo_front.png", to="media/plates/drop/ws_solo.png", refs=[_CANON],
   prompt=("Edit the first image: pull the camera back. Show the SAME scene from further away, with the camera at the same height and perfectly "
           "level, so the woman is much smaller: she fills only about HALF of the frame height, standing in the exact centre, with a wide band of "
           "open sky above her head (about a quarter of the frame) and a broad strip of wet mirror water below her sneakers with her full "
           "reflection (about a fifth of the frame). Keep her exactly the same: the same face, eyes, expression, high ponytail, pose (feet "
           "together, fists at her hips), jacket, orange bands, headphones and the round white '1420 MHz' patch on her LEFT upper arm. Keep the "
           "horizon dead straight and horizontal, the sun low on the horizon at the right, the clouds and the light. Extend the salt flat, sky "
           "and reflections naturally into the new space. Nobody else appears. Do not add any text."))
STILLS["ws_bg"] = dict(tool="edit", src="media/plates/drop/ws_solo_bgsrc.png", to="media/plates/drop/ws_bg.png", refs=[],
   prompt=("Edit the first image: remove the woman and her reflection completely, leaving the empty wet mirror salt flat exactly as it would "
           "look without her: continue the horizon, sky, clouds, water ripples and reflections seamlessly through the place where she stood. "
           "Keep every other pixel the same: framing, horizon, sun, light, colours and grain. Nobody appears. Do not add any text."))
# ---- the phrases: the 2nd International Compulsory Changquan (第二套国际武术竞赛套路 长拳), moves 1-14 in order, then the closing posture and
# salute (moves 15-28 skipped); docs/wushu_sync_longfist.md. Bars: B(b) = 153.167 + (b - 89) * 1.739; second marks are clip times on a beat.
# One bar of pre-roll in every take: from the still she settles into the phrase's opening pose and holds it until the first mark.
_B = lambda b: 153.167 + (b - 89) * 240 / 138
_SOLO_GUARD = (" One performer only, the same woman from start to end: two arms, two legs, one head; no limb appears, vanishes, doubles or "
               "detaches; nobody else ever appears. Real weight and momentum: knees bend on every landing, the planted foot never slides, "
               "sneakers stay on the water between steps. She stays inside the centre of the frame, travelling at most a step or two. The camera "
               "is LOCKED OFF on a tripod: no pan, no zoom, no push, no reframing, the horizon stays level. Her mouth stays closed. Same face "
               "and eyes as the first frame; she keeps her high ponytail, her orange bands and the round white '1420 MHz' patch on her LEFT "
               "upper arm. One continuous shot at real speed, no slow motion, no cuts. No captions, no text.")
_HEAD = "A solo wushu changquan performer shows the second international compulsory long-fist routine, crisp, fast and powerful, then sharp stops. "
_P = lambda dur, a0, act: dict(plate="media/plates/drop/ws_solo.png", dur=dur, v2=True, audio=(I2, round(a0, 3), dur), guard=_SOLO_GUARD,
                               act=_HEAD + act + " Each named move lands exactly on a beat of the reference audio.")
SHOTS = {
 # 89-90 (cut 89 -> 91, clip 1.739-5.217): moves 1-4. The drop's impact on 89.1.
 "ws_open": _P(6, _B(88), "She stands at attention, feet together, fists at her hips (yubei shi, the ready stance), completely still. About 1.7 "
   "seconds in, on the big hit, she snaps both open palms across in front of her chest, feet together (bingbu shizi zhang, cross palms). About "
   "2.6 seconds in she swings both straight arms in one big vertical circle (lun bi). About 3.5 seconds in she drops into a deep drop stance "
   "(pubu), one leg straight along the water, and slaps her palm down beside the straight leg (pubu pai zhang). About 4.3 seconds in she rises "
   "onto both feet, stamps one foot (zhenjiao) and pounds her right fist down into her open left palm in a half squat (za quan), and holds that "
   "pose dead still to the end."),
 # 91-92 (cut 91 -> 93.1, clip 1.739-5.217): move 5, the jump outside-lotus kick, take-off on 92.3 (bass F#), landing ON the 93.1 cut, into move 6.
 "ws_lotus": _P(6, _B(90), "She starts in a half squat, fist pounded into her palm, and holds still. About 1.7 seconds in she rises and steps "
   "forward with a big arm swing, then two quick running steps in a small curve. About 4.3 seconds in she jumps straight up off both feet, "
   "turning in the air (tengkong waibai lian, jump outside-lotus kick): at the top of the jump, about 4.7 seconds in, her straight right leg "
   "sweeps outward across in front of her face and both hands slap the top of the foot. About 5.2 seconds in she lands on both feet, knees "
   "bent, straight into a deep bow stance with a horizontal coiling elbow strike (gongbu pan zhou), and holds it."),
 # 93-94 (cut 93 -> 95): moves 6-9.
 "ws_kicks": _P(6, _B(92), "She steps into a deep bow stance, front knee bent over the toes, back leg straight, and holds still. About 1.7 "
   "seconds in she whips a horizontal coiling elbow strike across her chest (gongbu pan zhou). About 2.6 seconds in she snaps a low front kick "
   "with her toes pointed while one fist presses down (tantui ya quan). About 3.5 seconds in she steps through and swings a straight leg up to "
   "head height, slapping the instep with the same-side hand (dan paijiao, single slap kick). About 4.3 seconds in she lands and shuffles "
   "forward one small step. About 5.2 seconds in she stands on one straight leg with the other knee raised high above her hip and throws a "
   "horizontal punch to the side (dianbu tixi heng quan), and holds that balance dead still to the end."),
 # 95-96.3 (cut 95 -> 96.3): moves 9-10, the hop-step flying front kick, slap on 96.2.
 "ws_feijiao": _P(6, _B(94), "She rises onto one straight leg with the other knee raised high and a horizontal punch to the side (tixi heng quan), "
   "and holds the balance perfectly still. About 1.7 seconds in the punch snaps out sharply, still balanced. About 2.6 seconds in she steps "
   "down and takes a hop-step run-up (jibu), two quick steps. About 3.5 seconds in she springs off her left foot into a flying front kick "
   "(jibu tengkong feijiao): her right foot snaps straight up to head height and her right hand slaps the instep at the top of the jump, about "
   "3.9 seconds in, the other knee tucked. About 4.3 seconds in she lands on both feet, knees bent, and holds still."),
 # 96.3-99.1 (cut 96.3 -> 99.1, clip 1.739-6.087): move 11 whirlwind kick into the splits, landing on 97.1 (THE hit), bar 97 held still (the stop),
 # then moves 12-13 on the rise.
 "ws_xuanfeng": _P(7, _B(95) + 2 * 60 / 138, "She takes two quick running steps in a curve, arms swinging. About 2.2 seconds in she takes off and "
   "spins a full turn in the air (xuanfeng jiao, whirlwind kick): her straight right leg sweeps inward across and her left hand slaps the sole "
   "at the top of the spin. About 2.6 seconds in she lands straight down into full front splits on the water (pi cha), front leg straight "
   "ahead, back leg straight behind, arms flung out, and holds the splits completely still, not moving at all, until about 4.3 seconds in. "
   "Then she rises to her feet, and about 5.2 seconds in she stamps one foot and pounds her right fist into her left palm (zhenjiao za quan). "
   "About 6.1 seconds in she makes a small jump and lands with her legs crossed in a cover step, throwing a straight punch (tiao gaibu chong "
   "quan), and holds it."),
 # 99-100 (cut 99.1 -> 101): move 14, then the closing posture and the baoquan salute on the "ooh" (100.3).
 "ws_close": _P(6, _B(98), "She settles into a cover step, legs crossed, one straight punch held out, still. About 1.7 seconds in she swings a "
   "straight leg up to head height and slaps the instep with her hand (dan paijiao, single slap kick). About 2.6 seconds in she lands, brings "
   "her feet together and lowers her arms in a wide circle (shoushi, the closing posture). About 3.5 seconds in she stands at attention, feet "
   "together, fists at her hips, perfectly still. About 4.3 seconds in she gives the wushu salute: right fist pressed into the open left palm "
   "in front of her chest, arms rounded, chin up, a proud small smile at the camera, and holds it perfectly still to the end."),
 # the engine's world for every sync cut (lattice bg): the empty set, no figure hole
 "ws_bg": dict(plate="media/plates/drop/ws_bg.png", dur=10, guard=(" The camera is LOCKED OFF on a tripod: no pan, no zoom, no push, the horizon "
   "stays level and fixed. Nobody appears. One continuous shot, no cuts. No captions, no text."),
   act="The empty wet mirror salt flat at sunrise, exactly as in the first frame: the water barely ripples and shimmers, the reflections "
   "breathe, the clouds drift very slowly. Nothing else happens."),
}
