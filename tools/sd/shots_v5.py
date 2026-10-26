"""v5 re-takes (Jade's v4 review, 2026-10-25). Loaded by tools/sd/batch.py: RETAKES replace an existing shot's spec under the same key (so the
face_v4 still, picks, lags and the EDL keep working); SHOTS adds prompt variants. Generate with a NEW --t0 (the box is at t12; use --t0=13 and
up) so tags never collide; each take's spec JSON keeps the prompt it was made with. All sung windows are v2 (A2 in batch.py, or v2=True here).
Eyes: every guard uses batch.py's EYES wording (keep the still's eye size/shape; the v4 "large very dark brown eyes" made redrawn eyes bigger).
Diagnosis + measurements: docs/V5_BOX_RUNSHEET.md (lip-sync / smiles from raw-take landmarks; eyes from the take frames).
  3:30 ch2_catch      8 s (no frozen tail), eyes closed and contemplative to the end; ch2_catch_b = the slow eye-close variant
  3:54 ch2_gone_close 8 s, calm and certain, no grin on the held "-come"
  4:12 out_main       8 s, at peace, mouth open on the held "main", slow eye close, no grin
  1:11 ch1_main       7 s (no frozen tail), calm and serious, lips close on the m/b, held last note, slow eye close
  1:58 bd_ahh         eyes stay closed for the whole note, no push-in (the still has closed eyes; Seedance invented wide amber eyes)
  1:07 intro_up, 1:46 bd_float: same prompts, new canon-face stills (STILLS below -> media/plates/face_v4/<shot>.png)
  3:09 v2_horizon: same prompt, still edited (no violet band across the jacket back, patch on the left sleeve only; STILLS below)"""
VOC = "analysis/stems/vocals.wav"          # v1 stem name: batch.py maps these windows onto the v2 song (A2) under --timing=v2
VOC2 = "analysis_v2/stems/vocals.wav"
SING = (" She sings the words of the reference audio with precise lip sync, shaping each word clearly and holding the long sustained notes with her "
        "mouth open.")
NO_GRIN = " She does not smile broadly, grin or show her teeth."
# v5b (2026-10-26, Jade's v5a notes): one direction for every sung shot. Optimistic and hopeful with depth, as if she has just said something
# profound; no shallow or advertising smile, no teeth grin, not somber or blank. Mouth shapes follow the sung words exactly; the last word is held
# open to the end of the note; nothing is mouthed after it. The v5 (t51-t53) prompts are kept in their spec JSONs under review/takes/specs/.
HOPE = (" Her expression is quietly radiant and hopeful, eyes alive and bright, as if she has just understood something profound about time and "
        "about coming home; serene depth, sincere, not performing. At the very end at most a faint, soft, closed-mouth warmth. She never grins, "
        "never smiles with teeth, and is never somber or blank.")
def LIPS(last, extra=""):
    return (" Her lips follow the sung words exactly, syllable by syllable: lips press fully together on every m, b and p, open wide on open vowels, "
            "round on o and oo." + extra + f" On the last word, '{last}', she holds her mouth open on the vowel for the whole length of the note, until "
            "the sound ends. After that her mouth closes gently and stays closed: no more words, no extra mouthing.")
SING2 = " She sings exactly the words of the reference audio, in time with it, and nothing else."
RETAKES = {
 # 3:30 "Merge me back to main" (line 20). 8 s from A2 207.84 covers the whole shot (207.55 -> 214.70 with the lag) and the "Every" at 214.97.
 "ch2_catch": dict(plate="ch2_catch.jpg", dur=8, audio=(VOC, 208.50, 8),
   act="She has just received something precious from very far away and holds it against her chest. She sings with her eyes closed, inward and "
       "contemplative, as if listening to everything it carried home; her face stays calm and serious, lips soft. On the long final note she keeps "
       "her mouth open and sings until the sound fades, then lowers her chin slightly and keeps her eyes closed, still and thoughtful." + NO_GRIN + SING),
 # 3:54 "Every life I've lived, I have become" (line 23; 'become' is held 232.7-235.7), then the soft "Back to" pickup of line 24 just before the cut
 # (236.53). v5a: t12 ran a word late and grinned on the held note; t52/t53 grinned.
 "ch2_gone_close": dict(plate="ch1_gone_close.jpg", dur=8, audio=(VOC, 228.30, 8),
   act="Everything she ever sent out has come home, and she sings it straight to the camera, quiet and certain, as if she has just understood "
       "what it means to have lived every one of those lives. She keeps her eyes on the camera; on the long held 'become' she lifts her chin a "
       "little and her eyes shine." + HOPE + LIPS("become", " 'Every' starts with the lips together for the v; 'lived' and 'life' show the tongue on "
       "the l; 'become' closes on the b and on the m.") + NO_GRIN + SING2),
 # 4:12 the final "Back to main" (line 25; 'main' is held 250.3-255.9). v5a: t12 mouthed an extra word after 'main', then grinned.
 "out_main": dict(plate="ch1_main.jpg", dur=8, audio=(VOC, 262.80, 8),
   # t64+: t61/t62 closed and reopened the mouth inside the held 'main' (read as extra words), so the held vowel is spelled out
   act="She is home, completely, at sunrise. She sings the last three words softly to the camera, 'Back to main', and holds the long final "
       "note, at peace and full of quiet hope for everything still ahead. 'main' is ONE syllable held for about five seconds: her lips press "
       "together for the m, then her mouth opens once into a soft, relaxed open vowel and STAYS open in that same shape, without closing, "
       "re-shaping or forming any other word, even where the note swells and wavers; only as the sound fades at the very end does her mouth "
       "slowly close. Near the end of the note her eyes close slowly." + HOPE +
       LIPS("main", " 'Back' starts with the lips pressed together.") + SING2),   # prompt limit 2000 chars: HOPE already rules out the grin
 # 1:11 "Merge me back to main" (line 7): 'Merge' is ONE long held word (69.42-71.79), then "me back to" quickly, then 'main' held to 75.0.
 # v5a: t11 mouthed the whole phrase during 'Merge' and ended in a soft-drink-ad smile.
 "ch1_main": dict(plate="ch1_main.jpg", dur=7, audio=(VOC, 69.75, 7),
   act="She stands on the salt flat at the first sunrise after a very long night; everything she sent out into the world is about to come home. "
       "She sings to the camera, earnest and full of hope for the future, eyes alive. 'Merge' is one long held word: her lips press together for "
       "the M, then her mouth opens and STAYS open on the long 'er' for more than two seconds, without closing; then 'me back to' comes quickly "
       "(lips together on m, together on b), then 'main' (lips together on the m, then open) held open until the sound fades. The camera drifts "
       "slowly in. Her hair moves in the wind." + HOPE + LIPS("main") + NO_GRIN + SING2),
 # 1:30 "Nothing that I lived can come undone" (line 10): 'undone' is held for six seconds (93.6-99.9) and the shot runs to 99.97.
 # v5a: t12 closed her mouth two seconds before the note ended and finished on a shallow, pleased smile.
 "ch1_gone_close": dict(plate="ch1_gone_close.jpg", dur=11, audio=(VOC, 89.80, 11),
   act="She sings straight to the camera something it took her whole lives to learn: that nothing she has lived can be lost, because every "
       "branch of her merges back home. Unhurried and certain, with the depth of someone who has just said something true about impermanence "
       "and about living on. On the long final 'undone' she keeps singing with her mouth open for the whole six-second note, lifts her chin "
       "slightly and lets it ring, eyes on the camera, shining." + HOPE + LIPS("undone", " 'Nothing' starts on n with the lips apart; 'come' closes "
       "on the m.") + NO_GRIN + SING2),
 # 0:42 "Each one a light I sent ahead" (line 3); v5a: lips out of sync, and the take smiles with teeth while singing to the light.
 "v1_light_hands": dict(plate="v1_light_hands.jpg", dur=6, audio=(VOC, 42.40, 6),
   act="She looks down at the small warm light in her cupped hands and sings to it softly, like a promise to someone setting out on a long "
       "journey. On 'ahead' she lifts her hands and the light rises out of them and floats up and away; her eyes follow it, hopeful." + HOPE +
       LIPS("ahead", " 'one' is rounded.") + NO_GRIN + SING2),
 # 1:58 the "Ahh" (line 13), upside-down in frame (the EDL rolls it by pi). Option (a) of the eye diagnosis: the still has closed eyes, so they stay
 # closed (option (b), a canon eyes-open last frame via Seedance last_frame_image, needs a batch.py change; not queued).
 "bd_ahh": dict(plate="bd_float_close.jpg", dur=7, audio=(VOC, 112.20, 7),
   act="She floats on the water with her eyes closed and sings one long, high, wordless note of pure release, mouth open, the note rising; her eyes "
       "stay closed for the whole note, her face serene. The camera stays still at this distance; it does not move in."
       " She sings the reference audio with precise lip sync, holding the long note with her mouth open."),
}
SHOTS = {
 # 3:30 variant B (a second prompt for the same shot; same canon still). Pick either take for ch2_catch in docs/picks_manual.json.
 "ch2_catch_b": dict(plate="ch2_catch.jpg", face="ch2_catch", dur=8, v2=True, audio=(VOC2, 207.84, 8),
   act="She has just received something precious from very far away and holds it against her chest. She sings with her eyes closed, inward and "
       "contemplative; on 'back to' her eyes half-open and look down at her hands; on the long final note she slowly closes them again and keeps "
       "singing with her mouth open until the sound fades, still and thoughtful, her face calm and serious, lips soft." + NO_GRIN + SING),
}
# Stills (tools/sd/stills.py ID writes media/plates/v5_prompts/ID.txt and prints the command; nothing here spends). Canon refs = docs/canon_face_v4.md.
_CANON = ["media/style/canon_v4/canon_face.png", "media/style/canon_v4/canon_face_crop.jpg", "media/style/canon_v4/canon_eyes_crop.jpg"]
_FACE = ("the same face, eyes, brows and proportions as the reference images (keep the exact eye size and shape, very dark brown irises, natural "
         "double-eyelid crease; tall forehead fully uncovered, no bangs); natural skin, no makeup, no eyeliner")
STILLS = {
 # 1:07 (and every forktree use): the first-round doll face -> canon v4, half-up hair. Box: --box = a 3:2 window (x0,y0,H in source px) holding her
 # head and all of her hair; add --rot180 if her head is upside down in the frame. Copy the pick to media/plates/face_v4/intro_up.png.
 "intro_up": dict(tool="canonprop", src="media/plates/fix/intro_up.jpg", out="media/plates/face_v4/cand/intro_up_v5", refs=_CANON, args="--mode=rect --box=X0,Y0,H --n=3",
   to="media/plates/face_v4/intro_up.png",
   prompt="Edit the first image, a crop of a bird's-eye view: the woman stands on a black mirror of stars and looks straight up into the camera. "
          "Give her " + _FACE + ". Her hair is half-up, half-down: thin braids from each temple back to the crown, the rest long, loosely wavy and "
          "black around her shoulders. Keep her pose looking straight up into the camera, mouth closed, calm and curious, the cool starlight on her "
          "face, the jacket, the framing and everything outside her head exactly the same. Do not add any text."),
 # 1:46 breakdown back plate (bd_float, top-down, eyes closed, hair spread on the water); copy the pick to media/plates/face_v4/bd_float.png
 "bd_float": dict(tool="canonprop", src="media/plates/fix/bd_float.jpg", out="media/plates/face_v4/cand/bd_float_v5", refs=_CANON, args="--mode=rect --box=X0,Y0,H --n=3",
   to="media/plates/face_v4/bd_float.png",
   prompt="Edit the first image, a top-down view: the woman floats on her back on still water with her eyes closed and her long black hair spread "
          "out on the water. Give her " + _FACE + "; her eyes stay closed, the double-eyelid crease visible on the closed lids. Add thin braids from "
          "each temple back to the crown and keep the rest of her hair spread out on the water exactly as it is. Keep the peaceful expression, the "
          "water, the ripples, the light and everything else the same. Do not add any text."),
 # 3:07/3:09 v2_horizon: the patch-fix edit drew a violet band straight across the jacket back (and a patch on both sleeves). nano-banana-pro, ONE call.
 "v2_horizon_v5": dict(tool="fix", src="media/plates/fix/v2_horizon.jpg", name="v2_horizon_v5src", to="media/plates/fix/v2_horizon.jpg",
   then="rm -f media/gen/refs/v2_horizon_fix.jpg   # batch.py would otherwise reuse the old cached first frame",
   prompt="Edit the first image. Change ONLY the back of the woman's white jacket. Remove the horizontal violet stripe that runs straight across her "
          "back behind the lower part of the big pale-blue circle; in its place continue the plain white jacket fabric with the same folds, lighting "
          "and grain. The back must look like the back view in the turnaround reference: plain white, one big pale-blue circle on the upper back, "
          "the words RARE EARTH in black below it, and coloured bands ONLY on the sleeves (one band around each upper arm, ending at the sleeve "
          "seam). Keep the sleeve bands exactly as they are and VIOLET, never orange; keep the violet collar, violet pant straps and violet "
          "headphones. The round 1420 MHz patch belongs only on her LEFT upper arm (the arm on the left of the image): keep it, and remove the "
          "patch from the other sleeve, leaving a plain white sleeve with its violet band. Keep everything else exactly the same: framing, pose, "
          "hands, hair bun with the two pencils, the dish, the stars, the gold horizon glow, colours and grain. Do not add any other text."),
}
