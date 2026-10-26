"""v5b EXPERIMENTS (Jade's v5a notes, 2026-10-26: "not to commit, just as an experiment"). Never the default pick: these keys are new shots that
the EDL does not read; to try one in the film, point the real shot at its take by hand (docs/picks_manual.json) and flip it back after.
  v1_split_front_violet  0:28  violet's face on main (main's hair, orange lanes, patch unchanged)
  ch1_gone_close_34      1:30  main, canon face v4, three-quarter view
  ch1_gone_close_34v     1:30  violet's face, three-quarter view (main's hair and orange lanes: only the face changes)
Violet's face = the 1420 MHz dish close-up, `media/plates/face_v4/v2_dish_close.png` ("sitting on the dish looks most like me", Jade 2026-10-24,
docs/canon_face_v4.md). Refs: `media/style/v5b/violet_ref.jpg` (= review/cloud/refs/canon_v4__violet_test__violet_ref.jpg, a head crop of that
same plate) and `media/style/v5b/violet_dish_face.jpg` (a tighter crop of it). Stills go to media/plates/face_v4/<key>.png (batch.py's face= slot).
Audio windows are the real shots' v2 windows (A2 in batch.py)."""
import importlib.util, os
_sp = importlib.util.spec_from_file_location("shots_v5", os.path.join(os.path.dirname(__file__), "shots_v5.py")); _v5 = importlib.util.module_from_spec(_sp)
_sp.loader.exec_module(_v5)
VOC2 = "analysis_v2/stems/vocals.wav"
HOPE, LIPS, NO_GRIN, SING2 = _v5.HOPE, _v5.LIPS, _v5.NO_GRIN, _v5.SING2
_VIOLET = ["media/style/v5b/violet_ref.jpg", "media/style/v5b/violet_dish_face.jpg"]
_CANON = ["media/style/canon_v4/canon_face.png", "media/style/canon_v4/canon_face_crop.jpg"]
_KEEP = ("Keep her hair exactly as it is (half-up, half-down: thin braids from each temple back to the crown, the rest long, loosely wavy and "
         "black), the white cropped jacket with ORANGE sleeve bands and orange collar trim, the ORANGE headphones around her neck, the round "
         "white 1420 MHz patch on her LEFT upper arm (the arm on the right of the image), the black crop top, the light, the background and "
         "the framing. Every band and the headphones stay orange. Do not add any other text.")
_34 = ("Turn her head and shoulders into a three-quarter view: she turns toward the left of the image (her own right) by about 35 degrees, so "
       "we see the left side of her face more and her left shoulder with the 1420 MHz patch is nearer the camera; her eyes look slightly past "
       "the camera to the left, calm and thoughtful, mouth closed and relaxed, no smile. ")
STILLS = {
 "v1_split_front_violet": dict(tool="canonprop", src="media/gen/refs/v1_split_front_v4.jpg", out="media/plates/face_v4/cand/v1_split_front_violet",
   refs=_VIOLET, args="--mode=face --pad=2.2 --n=2", to="media/plates/face_v4/v1_split_front_violet.png",
   prompt="Edit the first image, a crop around a woman's face. Give her the face of the woman in the other reference images: the same face "
          "shape, eyes, eyelids, brows, nose, lips and proportions (her softer, slightly narrower oval face, gentle dark brown eyes with a natural "
          "double-eyelid crease), with natural skin and no makeup. It is the same person's face, not a new one. Keep the head pose, the gaze to "
          "the camera, the calm closed-mouth expression with a faint warmth, the cool violet night light on her face, and " + _KEEP[5:]),
 "ch1_gone_close_34": dict(tool="gpt", out="media/plates/face_v4/cand/ch1_gone_close_34", to="media/plates/face_v4/ch1_gone_close_34.png",
   refs=["media/plates/face_v4/ch1_gone_close.png"] + _CANON + ["media/style/r7/turn_gpt_patch.png"],
   # v2 wording (2026-10-26): candidates a/b slimmed her face toward violet's; the canon is rounder and fuller with larger, rounder eyes
   prompt="Edit the first image. " + _34 + "Same woman with exactly the face of the first image and of reference images 2 and 3, only turned: "
          "keep her round, full, soft face shape with wide cheeks and a rounded chin (do NOT slim the face, narrow the jaw or sharpen the chin), "
          "her large, round, friendly eyes at the exact size of the references with very dark brown irises and a natural double-eyelid crease, "
          "her full nose and lips; tall forehead uncovered, no bangs; natural skin, no makeup. " + _KEEP +
          " Same pink sunrise sky and salt flat. Photorealistic 3D animated film still, the same render style as the first image."),
 "ch1_gone_close_34v": dict(tool="gpt", out="media/plates/face_v4/cand/ch1_gone_close_34v", to="media/plates/face_v4/ch1_gone_close_34v.png",
   refs=["media/plates/face_v4/ch1_gone_close.png"] + _VIOLET + ["media/style/r7/turn_gpt_patch.png"],
   prompt="Edit the first image. " + _34 + "Give her the face of the woman in reference images 2 and 3: the same face shape, eyes, eyelids, "
          "brows, nose, lips and proportions (her softer, slightly narrower oval face, gentle dark brown eyes with a natural double-eyelid crease), "
          "natural skin, no makeup; but NOT her bun, pencils or violet colours: " + _KEEP + " Same pink sunrise sky and salt flat. Photorealistic 3D "
          "animated film still, the same render style as the first image."),
}
_GC = ("She sings something it took her whole lives to learn: that nothing she has lived can be lost, because every branch of her merges back "
       "home. Unhurried and certain, with the depth of someone who has just said something true about impermanence and about living on. She "
       "stays in the three-quarter view, her eyes just past the camera; on the long final 'undone' she keeps singing with her mouth open for the "
       "whole six-second note, lifts her chin slightly and lets it ring, her eyes shining." + HOPE +
       LIPS("undone", " 'Nothing' starts on n with the lips apart; 'come' closes on the m.") + NO_GRIN + SING2)
SHOTS = {
 "v1_split_front_violet": dict(plate="v1_split_front.png", face="v1_split_front_violet", dur=6, v2=True, audio=(VOC2, 28.22, 6),
   act="She stands alone on the night salt flat and sings softly to the camera, low and intimate, like confiding something wonderful: that she is "
       "about to become many. The camera drifts slowly in." + HOPE + LIPS("ways", " 'myself' closes on the m; 'ways' starts rounded.") + NO_GRIN + SING2),
 "ch1_gone_close_34": dict(plate="ch1_gone_close.jpg", face="ch1_gone_close_34", dur=11, v2=True, audio=(VOC2, 89.16, 11), act=_GC),
 "ch1_gone_close_34v": dict(plate="ch1_gone_close.jpg", face="ch1_gone_close_34v", dur=11, v2=True, audio=(VOC2, 89.16, 11), act=_GC),
}

# Post-credits sender (Jade's v5a note at 4:44, relayed 2026-10-26: "use the clip where she's sending off the light ... so she's not just a still
# image"). The EDL now plays v2_release_t12 clip 0.6-5.2 there, but that is a sung take (lips move) with the patch on her RIGHT arm. pc_send_v =
# the same action, silent, from the v2_release still with the patch moved to her LEFT upper arm (the arm she holds out). Same dish setting as
# v2_release, so it cuts like the take it replaces. No audio ref. Once picked, engine/show/main.js's post-credits sender (~lines 1082-1099) should
# switch to it (not edited here).
# The nano-banana edit below came back unchanged once, then the relay errored (2047) and timed out, so the still that was used is a LOCAL edit
# (OpenCV, free): the patch ellipse on her right sleeve inpainted away, the same patch pixels placed foreshortened (x.64, y.86, x.94 light) on the
# violet band of her outstretched left arm at (810, 472) of the 1920x1072 still. Result: review/takes/stills/pc_send_v.png.
STILLS["pc_send_v"] = dict(tool="edit", src="media/plates/face_v4/v2_release.png", to="media/plates/face_v4/pc_send_v.png",
   refs=["media/style/r7/turn_gpt_patch.png", "media/style/r7/patch_34.png"],
   # try 2 (first try returned the image unchanged): image positions spelled out
   prompt="Edit the first image. There is a round white '1420 MHz' patch on the upper sleeve of the arm that hangs down on the LEFT side of the "
          "image (about 27% from the left edge, 46% from the top). ERASE that patch completely: that sleeve becomes plain white fabric with only its "
          "violet band. Then ADD the same patch on the other arm, the one stretched out toward the light on the right: on its upper arm near the "
          "shoulder (about 45% from the left edge, 42% from the top), facing the camera. Do both changes. Details: remove it from the sleeve on the LEFT of the image (her right arm), leaving a "
          "plain white sleeve with its violet band, and put it on her LEFT upper arm, the arm she holds out toward the light (on the RIGHT of the image), "
          "on the upper sleeve just above the violet band, exactly like the patch in the reference images: a round white embroidered patch with a thin "
          "black ring and the bold black text '1420' above 'MHz', following the curve and the cool night light of the sleeve. Her mouth is gently "
          "closed. Keep everything else exactly the same: framing, pose, open palm, the glowing violet-white light above it, face, hair bun with the "
          "pencils, VIOLET headphones, VIOLET jacket bands and pant straps (never orange), the dish, the stars and the gold horizon glow. Do not add "
          "any other text.")
SHOTS["pc_send_v"] = dict(plate="v2_release.jpg", face="pc_send_v", dur=6,
   act="She stands alone at the edge of the great dish under the stars, the small light resting just above her open palm. She lets it go: it "
       "drifts slowly up and away to the right toward the far horizon, and her hand lowers slowly to her side. Her eyes follow the light the "
       "whole time, a quiet, hopeful look. Her mouth stays gently closed; she does not sing or speak. The camera stays still."
       " The round 1420 MHz patch stays on her left upper arm; her bands, straps and headphones stay violet.")

# ---- "main in violet's look" (Jade, review page 2026-10-26): "violet's face is actually better, but sometimes, the edits leave weird hair traces
# where she has partial bang artifacts. maybe we keep violet's messy bun hair intact" / "what if we gave her violet's default hair here, but she's in
# the orange jacket?" So NO face swap: each still is violet's own face and messy bun (with her two pencils, i.e. her hair left intact), wearing
# MAIN's costume (orange lanes, patch on the LEFT upper arm, RARE EARTH + pale-blue circle on the back, no band behind it), posed and framed like
# the shot's existing still (refs[0]). GPT Image 2.5 (gpt_plate.py), 2 candidates, 16:9 crop after. ch1_main_vl's still also serves out_main_vl
# (the two shots shared ch1_main.png before too). v1_split_front_vl + ch1_gone_close_vl34 are candidates for the film; ch1_main_vl,
# ch2_gone_close_vl and out_main_vl are a TEST ("experiment: violet look test") so Jade can decide whether main takes this look everywhere.
_VL_REFS = ["media/style/v5b/violet_ref.jpg", "media/style/v5b/violet_dish_face.jpg", "media/style/r7/turn_gpt_patch.png"]
def _vl(extra=""):
    return ("Edit the first image. Replace the woman with the woman in reference images 2 and 3, unchanged: her exact face (face shape, eyes, "
            "eyelids, brows, nose, lips, proportions) and her exact hair: black hair pulled up into a messy bun at the back of her head with her two "
            "pencils through it, a few loose strands by her ears; her forehead is clear, with NO bangs or fringe and no stray hair across the "
            "forehead or temples. Natural skin, no makeup. She wears MAIN's costume as in reference 4 and the first image: white cropped jacket with "
            "ORANGE sleeve bands and orange collar trim, ORANGE headphones around her neck, black crop top, dark cargo pants with orange straps, and "
            "the round white 1420 MHz patch on her LEFT upper arm only; no violet anywhere on her clothes or headphones. " + extra +
            "Keep the first image's pose, framing, camera distance, lighting, background and render style exactly. Do not add any other text.")
STILLS.update({
 "v1_split_front_vl": dict(tool="gpt", out="media/plates/face_v4/cand/v1_split_front_vl", to="media/plates/face_v4/v1_split_front_vl.png",
   refs=["media/gen/refs/v1_split_front_v4.jpg"] + _VL_REFS, prompt=_vl("She stands full length on the night salt flat, facing the camera, calm. ")),
 "ch1_gone_close_vl34": dict(tool="gpt", out="media/plates/face_v4/cand/ch1_gone_close_vl34", to="media/plates/face_v4/ch1_gone_close_vl34.png",
   refs=["media/plates/face_v4/ch1_gone_close_34v.png"] + _VL_REFS,
   prompt=_vl("She is in a three-quarter view, turned toward the left of the image, her eyes just past the camera, mouth closed and relaxed, "
              "placed a little right of centre in the frame, at sunrise on the salt flat. ")),
 "ch1_main_vl": dict(tool="gpt", out="media/plates/face_v4/cand/ch1_main_vl", to="media/plates/face_v4/ch1_main_vl.png",
   refs=["media/gen/refs/ch1_main_v4.jpg"] + _VL_REFS, prompt=_vl("She stands on the salt flat at sunrise facing the camera, mouth closed, calm. ")),
 "ch2_gone_close_vl": dict(tool="gpt", out="media/plates/face_v4/cand/ch2_gone_close_vl", to="media/plates/face_v4/ch2_gone_close_vl.png",
   refs=["media/plates/face_v4/ch2_gone_close.png"] + _VL_REFS, prompt=_vl("Close shot facing the camera at sunrise, mouth closed, calm. ")),
})
_LOCK = " The camera is locked: it does not move, push in, zoom or reframe."
SHOTS.update({
 "v1_split_front_vl": dict(plate="v1_split_front.png", face="v1_split_front_vl", dur=6, v2=True, audio=(VOC2, 28.22, 6),
   act="She stands alone on the night salt flat and sings softly to the camera, low and intimate, like confiding something wonderful: that she is "
       "about to become many." + _LOCK + HOPE + LIPS("ways", " 'myself' closes on the m.") + NO_GRIN + SING2),
 "ch1_gone_close_vl34": dict(plate="ch1_gone_close.jpg", face="ch1_gone_close_vl34", dur=11, v2=True, audio=(VOC2, 89.16, 11), act=_GC),
 "ch1_main_vl": dict(plate="ch1_main.jpg", face="ch1_main_vl", dur=7, v2=True, audio=(VOC2, 69.12, 7), act=_v5.RETAKES["ch1_main"]["act"]),
 "ch2_gone_close_vl": dict(plate="ch1_gone_close.jpg", face="ch2_gone_close_vl", dur=8, v2=True, audio=(VOC2, 228.61, 8), act=_v5.RETAKES["ch2_gone_close"]["act"]),
 "out_main_vl": dict(plate="ch1_main.jpg", face="ch1_main_vl", dur=8, v2=True, audio=(VOC2, 249.10, 8), act=_v5.RETAKES["out_main"]["act"]),
})
