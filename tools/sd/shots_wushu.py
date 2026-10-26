"""Drop v5.1 (Jade 2026-10-25: "The first wushu group set can be the pair-wise fight set, but the next one should amp it up and be at least as
good as the one I won a medal for"). Rebuilt from her team's real 2004 collegiate group set (docs/wushu_v5_design.md sections 9-10,
docs/wushu_groupset_notes.md). Bar map (bar.beat; one bar = 1.739 s):
  89-92  duilian, three pairs = the v4 dr_duilian plate's six copies (orange vs violet in front, rose vs sky in the middle, mint vs gold at the
         sides): the clash on the drop, then the front pair's sweep (91.1), flying kick (92.1) and mirrored freeze (92.3).
  93-94  group set by SIX branch copies in one line (no orange): unison burst into bow stance + punch (93.1), pubu (93.3), arm-overhead pose held.
  95     her jian solo (dr_jian_t2, existing), 1 bar; hides the cut.
  96-98.2 THE GROUP FALL: two driving steps (96.1), dive (96.4), all six hit the water flat on 97.1, bar 97 held still, rise as one on 98.1.
  98.3-99 the halves trade a phrase (warm 98.3, cool 99.1), then the cross pairs attack and block (99.3).
  100    the six in the V drop into an arms-out horse stance (100.1); MAIN (orange) steps forward into the empty point; all seven give the baoquan
         salute on the "ooh" (100.3), which match-cuts into the fold's V of seven at bar 101.
Every take is made against the drop instrumental with ONE BAR of pre-roll: audio window = one bar before its cut, so the cut uses clip 1.739 s on
(EDL at(shot, 1); keyed() for the fall and the salute). Second marks in the prompts are clip times. The instrumental is a flat four-on-the-floor
after the drop (bar 89 is the only big hit, and the "ooh" is in the vocal stem, not in the reference audio), so cues are second marks on a beat.
Lanes/hair for the group-set plates (Jade's decision 2: a mix of high ponytails and space buns): orange = main, canon face, high ponytail; rose,
sky = two space buns; mint, gold = high ponytails; white, violet = two space buns. Line left to right = the fold V minus its point: white, mint,
rose | sky, gold, violet (warm, cool, warm | cool, warm, cool; cross pairs white-mint, rose-sky, gold-violet). The duilian keeps dr_duilian's
hair (orange, mint, sky high ponytails; rose, gold one high bun), so dr_dl_close cuts on from dr_dl_wide without a change; violet has two space
buns in both (v5.2 hair edits, matching the group set).
Plates: STILLS below. python3 tools/sd/stills.py ID -> GPT Image 2.5 (tools/plates/gpt_plate.py, 2 candidates) -> stills.py ID --pick=a|b (16:9
PNG in media/plates/drop/) -> stills.py ID_patch (one nano-banana-pro sleeve-patch edit, every lane colour pinned, saved back over the PNG)."""
I2 = "analysis_v2/stems/instrumental.wav"
MUTE_G = " Their mouths stay closed; nobody sings or speaks."
SIX_DL = " Exactly six copies, three pairs, stay in frame for the whole shot; nobody leaves, merges, splits or disappears."
SIX = (" Exactly six copies stay in frame for the whole shot, in the same order along the line (there is no orange copy); nobody leaves, merges, "
       "splits or disappears.")
SEVEN = (" Exactly seven copies stay in frame for the whole shot (the six in the V and the orange copy); nobody leaves, merges, splits or "
         "disappears.")
SAFE = " Every strike is controlled and stops just short; nothing lands and nobody is hurt; they are partners showing a rehearsed set."
SHOTS = {
 # ---- DUILIAN (pair-wise fight set), bars 89-92, the six copies of the v4 dr_duilian plate
 "dr_dl_wide": dict(plate="media/plates/drop/dr_duilian.png", dur=6, group=True, v2=True, audio=(I2, 151.428, 6),   # B(88); cut 89 = clip 1.739, to 91
   act="Wushu duilian, a rehearsed sparring set performed as a show: three pairs of copies face off on the wet mirror salt flat, the orange copy against the violet copy in front, the rose copy against the sky copy in the middle behind them, the mint copy against the gold copy at the two sides. For the first moment every pair holds its guard, coiled and still. On the big hit of the reference audio, the drop, about 1.7 seconds in, all three pairs explode into a fast exchange with one strike on every beat: a lunging bow-stance punch met by a rising forearm block, a palm strike parried and countered, a low snap kick checked with a raised knee, then about 4.3 seconds in a high spinning kick that the partner ducks under. The front pair is the clearest; the pairs behind trade the same rhythm. Sharp, fast and powerful, focused faces, hair whipping, water spraying from every step. Low camera pushing slowly in between the two front fighters." + SAFE + SIX_DL + MUTE_G),
 "dr_dl_close": dict(plate="media/plates/drop/dr_dl_close.png", dur=6, group=True, v2=True, audio=(I2, 154.906, 6),  # B(90); cut 91 = clip 1.739, to 93
   act="The orange copy and the violet copy finish their sparring set with a sweep and a flying kick. For the first moment they circle each other in guard. About 1.7 seconds in, exactly on a beat of the reference audio, the orange copy drops into a deep low stance and sweeps her straight leg in a full circle along the water, throwing an arc of spray; the violet copy jumps straight up and tucks her knees over the sweep, lands, and springs straight into a flying front kick, her right foot snapping up head-high and slapped by her right hand at the top of the jump about 3.5 seconds in, aimed just past the orange copy, who leans back under it and blocks with both forearms. About 4.3 seconds in, as the violet copy lands, both spring apart into mirrored bow stances facing each other, fists up, and freeze, then grin at each other. Behind them, small and soft-focus, the other two pairs keep sparring in the same rhythm: exactly four small figures in the background, the same four as in the first frame, and nobody else appears. Low side-on camera tracking with them, water flying." + SAFE + " Exactly six copies stay in frame for the whole shot: the two fighters in front, the only ones in focus, and the two small pairs behind; nobody leaves, merges or disappears." + MUTE_G),
 # ---- GROUP SET (barehand changquan), bars 93-100, by six branch copies; MAIN (orange) joins only for the salute. Keys keep the draft names:
 # dr_gs_tornado = the group fall, dr_gs_ring = the halves trading + the cross pairs. Plates: dr_gs_line6 (ranks, fall, pairs), dr_gs_v6 (salute).
 "dr_gs_ranks": dict(plate="media/plates/drop/dr_gs_line6.png", dur=6, group=True, v2=True, audio=(I2, 158.384, 6),  # B(92); cut 93 = clip 1.739, to 95
   act="A wushu team's barehand changquan group set. Six copies stand in one line facing the camera, evenly spaced, feet together, fists chambered at the hips, absolutely still, eyes forward. About 1.7 seconds in, exactly on a beat of the reference audio, all six burst out together into a deep bow stance with a straight punch, in the same frame; about 2.6 seconds in they all drop into a very low drop stance, one leg stretched straight out along the water, the arm sweeping low over it; about 3.5 seconds in they all rise back into the bow stance and whip the rear arm up overhead into a sharp pose, heads snapping to the camera, and hold it dead still to the end. Crisp, powerful, exactly in unison, like one body. Low frontal camera, slow push in." + SIX + MUTE_G),
 "dr_gs_tornado": dict(plate="media/plates/drop/dr_gs_line6.png", dur=7, group=True, v2=True, audio=(I2, 163.601, 7),  # B(95); cut 96 = clip 1.739; hit 97.1 = 3.478; rise 98.1 = 5.218; to 98.3 = 6.09
   act="The team's signature moment: the group fall. Six copies stand in one line facing the camera at attention, then raise their fists into guard. About 1.7 seconds in, all six take two quick driving steps toward the camera together; about 3 seconds in they all launch forward off one foot and dive, bodies straight and level; about 3.5 seconds in, exactly on a beat of the reference audio, all six land flat on the water at the same instant in a controlled breakfall, palms and forearms slapping down, one single sheet of spray, and then lie completely still, face down, side by side, nobody moving at all. About 5.2 seconds in, all six push up together and spring back to their feet as one, standing in guard again by about 6 seconds, and hold still to the end. Low wide frontal camera, centred, holding still on the fall." + SIX + " The fall is a rehearsed, controlled breakfall; nobody is hurt." + MUTE_G),
 "dr_gs_ring": dict(plate="media/plates/drop/dr_gs_line6.png", dur=6, group=True, v2=True, audio=(I2, 167.949, 6),  # bb(97, 2); cut 98.3 = clip 1.739, to 100.1 = 4.35
   act="The team's call and response. Six copies stand in one line facing the camera, raise their fists into guard and hold still. They are two halves, alternating along the line: the first, third and fifth from the left (white, rose and gold) and the second, fourth and sixth (mint, sky and violet). About 1.7 seconds in, exactly on a beat of the reference audio, the white, rose and gold copies strike a sharp phrase together, a bow-stance punch and a snap kick, while the other three hold dead still; about 2.6 seconds in the mint, sky and violet copies answer with the same phrase while the first three freeze. About 3.5 seconds in, each copy turns to her neighbour, white with mint, rose with sky, gold with violet, and the three pairs trade blows: a lunging punch met by a rising forearm block, then a low sweep that the partner jumps over; about 4.4 seconds in all three pairs freeze in mirrored bow stances facing each other. Low three-quarter camera tracking slowly along the line." + SIX + SAFE + MUTE_G),
 "dr_gs_salute": dict(plate="media/plates/drop/dr_gs_v6.png", dur=5, group=True, v2=True, audio=(I2, 170.558, 5),  # B(99); cut 100 = clip 1.739; salute 100.3 = 2.61; to 101 = 3.48
   act="The close of the group set. Six copies stand in a V pointing at the camera with its point left empty, and the main copy in ORANGE (high ponytail, orange bands and headphones) stands just behind the empty point, between the rose and sky copies. The six sweep both arms out and, about 1.7 seconds in, exactly on a beat of the reference audio, drop together into a deep horse stance with both arms stretched straight out to the sides, level, and hold it still. Right after, the orange copy takes two quick steps forward through the gap into the empty point nearest the camera. About 2.6 seconds in, all seven rise together, bring their feet together and give the wushu salute: right fist pressed into the open left palm in front of the chest, arms rounded, chins up, proud small smiles at the camera, and they hold it perfectly still to the end. Low frontal camera at waist height, symmetrical and still." + SEVEN + MUTE_G),
}
# v5.2 (Jade 2026-10-25: "Match: two space buns"): violet keeps the group set's two space buns in the duilian too. Edited copies of both plates
# (STILLS dr_duilian_buns / dr_dl_close_buns: only violet's hair changes); the v4 dr_duilian shot keeps the original plate.
SHOTS["dr_dl_wide"]["plate"] = "media/plates/drop/dr_duilian_v5.png"
SHOTS["dr_dl_close"]["plate"] = "media/plates/drop/dr_dl_close_v5.png"   # t57+: the act names the four background figures (t51-t56 grew 5-6)

# ---- Stills (tools/sd/stills.py ID writes media/plates/v5_prompts/ID.txt and prints the command; nothing here spends). Same world and light as
# the v4 drop plates (dr_set, dr_duilian: low sun over the wet mirror flat, peach-gold sky, spray); canon face (docs/canon_face_v4.md) for every copy.
_STYLE = ("High-end real-time 3D render with the fidelity of a AAA game cinematic or a virtual K-pop idol music video made in Unreal Engine 5: "
          "stylized 3D character, strand-rendered hair, soft subsurface skin, physically based fabric, ray-traced global illumination, filmic. ")
_COST = (" Every copy wears the costume of the turnaround reference: a white cropped racer jacket with ONE band across the chest and one around "
         "each upper arm, only ONE small pale-blue dot on the left chest, a black high-neck crop top, navy wide cargo pants with straps, chunky white "
         "sneakers and headphones around the neck; her jacket bands, cargo straps and headphone cups are all her own lane colour. On her LEFT upper "
         "arm each copy wears the round white embroidered patch with a thin black ring and the bold black text '1420' above 'MHz', exactly as in "
         "the patch close-up reference; no patch on the right arm.")
_FACE = (" Every copy has the face of the face reference: the same eyes, brows and proportions, very dark brown eyes with a natural double-eyelid "
         "crease, tall forehead uncovered, natural skin, no makeup, fierce focus.")
_TAIL = " The only lettering anywhere is '1420 MHz' on each round white sleeve patch. No other text, letters or logos."
_CANON = "media/style/canon_v4/canon_face.png"
_BODY = ["media/style/r7/turn_gpt_patch.png", "media/style/r7/patch_34.png"]
_PATCH = ("Edit the first image. Change ONLY the round patches on the women's LEFT upper sleeves (on the coloured arm band): make each one exactly "
          "like the patch in the reference images, a round white embroidered patch with a thin black ring and the bold black text '1420' above "
          "'MHz', crisp and legible, following the curve and lighting of the sleeve. Apply it to every copy whose left sleeve is visible; if it is "
          "hidden or missing where a left sleeve is visible, add it there; never put one on a right sleeve. ")
_BUNS = ("Edit the first image. Change ONLY the hair of the {who}, the fighter with VIOLET jacket bands, violet cargo straps and violet "
         "headphones: instead of one high bun, her black hair is now in TWO SPACE BUNS, two round buns high on top of her head, one on each side "
         "of a centre parting, with a few loose strands framing her face, exactly like the hairstyle in the second reference image. Keep her face, "
         "eyes, expression, head angle, pose, headphones, jacket and sleeve patch exactly the same. Do not change any other copy's hair: {others}. "
         "Keep every copy's colours exactly as in the first image: ORANGE for the main copy, VIOLET for her partner, and ROSE PINK, SKY BLUE, MINT "
         "GREEN and GOLDEN YELLOW for the copies behind them; every branch's jacket bands, cargo straps and headphone cups stay her own colour, never "
         "orange. Everyone's hair stays BLACK: the lane colours are only on jackets, straps and headphones, never on hair. Keep every round "
         "white '1420 MHz' patch exactly as it is, where it is.")
_OTHERS = ("the ORANGE fighter keeps her high ponytail; behind them ROSE PINK and GOLDEN YELLOW keep one high bun, SKY BLUE and MINT GREEN keep "
           "their high ponytails")
_BUNREF = ["media/style/v5/violet_space_buns.png"]   # violet's head from the picked dr_gs_line6 (review/takes/stills/violet_space_buns.png)
_KEEP = (" Keep every other detail of the first image exactly the same: framing, poses, faces, hair, lighting, colours, water, sky and grain. Do "
         "not add any other text.")
STILLS = {
 # bars 91-92: the duilian's front pair a moment after dr_duilian (same screen sides: orange left facing right, violet right facing left)
 "dr_dl_close": dict(tool="gpt", out="media/plates/drop/dr_dl_close", refs=["media/plates/drop/dr_duilian.png", _CANON] + _BODY,
   prompt=_STYLE + "Full sunrise on the wet mirror salt flat, the same world, light, outfits and fighters as the first reference image, a moment "
          "later in the same sparring set: a low, side-on, medium-wide action shot of the front pair squaring off about two metres apart, both "
          "full-body with their sneakers in the water and clear space above their heads and below their feet. On the left the main copy, facing "
          "right: ORANGE jacket bands, orange cargo straps and orange headphones, black hair in a high ponytail whipping in the wind. On the "
          "right her sparring partner, facing left: VIOLET bands, violet straps and violet headphones, black hair in one high bun on top of her "
          "head, as in the first reference image. Both crouch in a low bow-stance guard, lead hand open, rear fist chambered at the hip, eyes "
          "locked, a hint of a grin. Behind them, small and soft-focus in the distance, the other two pairs spar on the water: ROSE PINK (one "
          "high bun) against SKY BLUE (high ponytail), and MINT GREEN (high ponytail) against GOLDEN YELLOW (one high bun); six copies in all. "
          "The sun is a blazing disc low over the horizon between the two fighters, lens flare, fine spray at their feet, long reflections. "
          "Dynamic AAA game-cinematic framing." + _COST + _FACE + _TAIL),
 "dr_dl_close_patch": dict(tool="patch", src="media/plates/drop/dr_dl_close.png",
   prompt=_PATCH + "Keep every copy's colours exactly as in the first image: the fighter on the left is ORANGE and the fighter on the right is "
          "VIOLET (violet bands, straps and headphones, never orange); behind them ROSE PINK against SKY BLUE and MINT GREEN against GOLDEN "
          "YELLOW, each in her own colour, never orange." + _KEEP),
 # v5.2: violet's two space buns in the duilian plates (one nano-banana-pro edit each, pick by eye)
 "dr_duilian_buns": dict(tool="edit", src="media/plates/drop/dr_duilian.png", to="media/plates/drop/dr_duilian_v5.png", refs=_BUNREF,
   prompt=_BUNS.format(who="woman on the RIGHT in front, facing left", others=_OTHERS) + _KEEP.replace("faces, hair,", "faces, every other copy's hair,")),
 "dr_dl_close_buns": dict(tool="edit", src="media/plates/drop/dr_dl_close.png", to="media/plates/drop/dr_dl_close_v5.png", refs=_BUNREF,
   prompt=_BUNS.format(who="woman on the RIGHT, facing left", others=_OTHERS) + _KEEP.replace("faces, hair,", "faces, every other copy's hair,")),
 # bars 93-99: ranks, the fall, the halves and pairs all start from this line (the fold's V minus its point, flattened into a line)
 "dr_gs_line6": dict(tool="gpt", out="media/plates/drop/dr_gs_line6", refs=["media/plates/drop/dr_set.png", _CANON] + _BODY,
   prompt=_STYLE + "Full sunrise on the wet mirror salt flat, the same world, light and outfits as the first reference image: a wushu team of six "
          "copies of the woman at the start of their barehand changquan group set, standing in ONE straight line across the frame, facing the "
          "camera, evenly spaced about one and a half arm's lengths apart, in the middle distance, with a wide stretch of open, glassy water "
          "between them and the camera. From left to right: WHITE (two space buns), MINT GREEN (high ponytail), ROSE PINK (two space buns), SKY "
          "BLUE (two space buns), GOLDEN YELLOW (high ponytail), VIOLET (two space buns); the warm and cool colours alternate along the line. "
          "All six stand at attention, feet together, fists chambered at the hips, backs straight, chins up; everyone full-body with sneakers "
          "and reflections visible, nobody hidden or overlapping, with clear space above their heads and below their feet. There is no orange "
          "copy. Low wide frontal camera at waist height, symmetrical; the sun a blazing disc low over the horizon in the centre of the frame, "
          "in the gap between the rose and sky copies, lens flare, long reflections in the water." + _COST + _FACE + _TAIL),
 "dr_gs_line6_patch": dict(tool="patch", src="media/plates/drop/dr_gs_line6.png",
   prompt=_PATCH + "Keep every copy's colours exactly as in the first image: from left to right WHITE, MINT GREEN, ROSE PINK, SKY BLUE, GOLDEN "
          "YELLOW, VIOLET; each copy's jacket bands, cargo straps and headphone cups stay her own colour, never orange." + _KEEP),
 # bar 100: the six in the fold's V (ch1_formation order) with the point empty; orange waits just behind it, in frame so she keeps the canon face
 # (Seedance can't give a copy that walks in from off-frame a face it hasn't seen), and steps forward into the point for the salute
 "dr_gs_v6": dict(tool="gpt", out="media/plates/drop/dr_gs_v6",
   refs=["media/plates/drop/dr_set.png", "media/plates/face_v4/ch1_formation.png", _CANON] + _BODY,
   prompt=_STYLE + "Full sunrise on the wet mirror salt flat, the same world, light and outfits as the first reference image, framed like the "
          "V-formation in the second reference image: the close of a wushu team's group set. Six copies of the woman stand in a V pointing at "
          "the camera with its point left empty. From left to right: WHITE (back left, two space buns), MINT GREEN (high ponytail), ROSE PINK "
          "(front left, two space buns), then the empty point nearest the camera in the centre, then SKY BLUE (front right, two space buns), "
          "GOLDEN YELLOW (high ponytail), VIOLET (back right, two space buns): the same places as in the V-formation reference. The main copy in "
          "ORANGE (orange bands, straps and headphones, black hair in a high ponytail) stands centred just behind the empty point, between the "
          "rose and sky copies and one step further back, fully visible, ready to step forward into the point. All seven stand at attention, "
          "feet together, fists chambered at the hips, chins up, calm and proud; everyone full-body with sneakers and reflections visible, "
          "nobody hidden or overlapping, with clear space above their heads and below their feet. Low frontal camera at waist height, "
          "symmetrical, the same height and spacing as the V-formation reference; the sun a blazing disc on the horizon directly behind the "
          "empty point, lens flare, long reflections." + _COST + _FACE + _TAIL),
 "dr_gs_v6_patch": dict(tool="patch", src="media/plates/drop/dr_gs_v6.png",
   prompt=_PATCH + "Keep every copy's colours exactly as in the first image: from left to right WHITE, MINT GREEN, ROSE PINK, the main copy in "
          "ORANGE in the middle, SKY BLUE, GOLDEN YELLOW, VIOLET; only the middle copy is orange, and every other copy's jacket bands, cargo "
          "straps and headphone cups stay her own colour, never orange." + _KEEP),
}

# ---- v5.3 THE PARTNER ROLL (Jade 2026-10-26: "an actually impressive looking wushu move from the group set, like rolling over your sparring
# partner's back"). Lands on the duilian close, bars 91-92 (docs/wushu_v5_design.md section 11): the peak of the roll on 92.3 (bass E -> F#,
# the strongest beat-3 onset in the drop and the airborne bar of the first rising phrase), the landing on 92.4, the liangxiang freeze into the
# cut on 93.1. Duilian vocabulary: the attacker lunges into gongbu with a straight punch (chongquan); the defender ducks forward, bent flat at
# the waist (a "table"); the attacker sets her shoulders across the flat back and rolls sideways over it (the back roll, beigun), legs swinging
# over in a high arc, lands on her feet on the far side in gongbu; both snap into liangxiang. Same 6 s window as dr_dl_close (B(90); cut 91 =
# clip 1.739; peak 92.3 = 4.348; land 92.4 = 4.783; cut 93 = 5.218). Two versions:
#   dr_dl_roll       the close two-shot, orange and violet side-on, from a pulled-back copy of dr_dl_close_v5 (headroom for the roll's arc)
#   dr_dl_ripple     the three pairs in a diagonal echelon, rolling one after another (canon on half bars): back pair mint/gold peaks 91.3 (2.61),
#                    middle rose/sky 92.1 (3.48), front orange/violet 92.3 (4.35); all freeze in liangxiang by 92.4.
# Variant prompts (_b) drop the sweep for a punch exchange, so Seedance gets one readable acrobatic beat (pick by frames).
ANAT = " The two partners are always two separate people with two arms and two legs each; bodies never merge or pass through each other."
_ROLL = ("the violet copy sets her shoulders across the orange copy's flat back and rolls sideways over it, legs swinging up and over in a high "
         "arc; the peak, her body level above the back and legs high, about 4.3 seconds in, exactly on a beat; about 4.8 seconds in she lands on "
         "her feet on the far side in a low bow stance and both snap into a liangxiang pose, the orange copy straightening to face her, fists up, "
         "heads snapping to the camera, held dead still to the end.")
_CLOSE_BG = (" Behind them, small and soft-focus, the same four background figures keep sparring; nobody else appears. Low side-on camera at "
             "waist height, holding still, water flying." + SAFE + ANAT + " Exactly six copies stay in frame the whole shot." + MUTE_G)
SHOTS.update({
 "dr_dl_roll": dict(plate="media/plates/drop/dr_dl_roll.png", dur=6, group=True, v2=True, audio=(I2, 154.906, 6),  # B(90); cut 91 = 1.739; peak 92.3 = 4.348
   act="Wushu duilian finale, a rehearsed partner set: the orange copy on the left facing right, the violet copy (two space buns) on the right "
       "facing left, in guard. About 1.7 seconds in, exactly on a beat of the reference audio, the orange copy drops low and sweeps her leg along "
       "the water; the violet copy hops over it. About 2.6 seconds in the violet copy lunges into a bow stance with a straight punch; the orange "
       "copy ducks forward under it, bent at the waist, her back flat and level like a table. About 3.6 seconds in "
       + _ROLL + _CLOSE_BG),
 "dr_dl_roll_b": dict(plate="media/plates/drop/dr_dl_roll.png", dur=6, group=True, v2=True, audio=(I2, 154.906, 6),
   act="Wushu duilian finale, a rehearsed partner set: the orange copy on the left facing right, the violet copy (two space buns) on the right "
       "facing left, coiled in guard. About 1.7 seconds in, exactly on a beat of the reference audio, they trade two fast strikes, a punch met "
       "by a rising forearm block each way. About 3.4 seconds in the violet copy lunges into a deep bow stance with a straight punch; the orange "
       "copy ducks forward under it, bent at the waist, her back flat and level like a table, and at once " + _ROLL + _CLOSE_BG),
 "dr_dl_ripple": dict(plate="media/plates/drop/dr_dl_ripple.png", dur=6, group=True, v2=True, audio=(I2, 154.906, 6),  # peaks 2.61 / 3.48 / 4.35
   act="Wushu duilian performed as a show by three pairs of copies standing in a diagonal line of pairs on the wet mirror salt flat, each pair "
       "side-on to the camera: the mint copy against the gold copy furthest back, the rose copy against the sky copy in the middle, the orange "
       "copy against the violet copy nearest the camera. The three pairs do the same rehearsed move one after another, like a ripple, from the "
       "back pair to the front pair, each half a bar later than the one before: in each pair the second fighter lunges with a straight punch, her "
       "partner ducks forward bending flat at the waist, and the puncher rolls sideways across her partner's flat back, legs swinging up and over "
       "in a high arc, and lands on her feet on the far side in a low bow stance. The back pair (the gold copy rolling over the mint copy) peaks "
       "about 2.6 seconds in, the middle pair (the sky copy rolling over the rose copy) about 3.5 seconds in, and the front pair (the violet copy "
       "rolling over the orange copy) about 4.3 seconds in, each peak exactly on a beat of the reference audio. About 4.8 seconds in all three "
       "pairs snap into the same liangxiang pose and freeze, held dead still to the end. Wide, low camera, holding still, water spraying from "
       "every landing." + SAFE + " In every pair the two partners are always two separate people, each with exactly two arms and two legs; "
       "bodies never merge or pass through each other." + SIX_DL + MUTE_G),
})
SHOTS["dr_dl_ripple_b"] = dict(SHOTS["dr_dl_ripple"], act=SHOTS["dr_dl_ripple"]["act"].replace(
    "Wide, low camera, holding still", "Wide, low camera, slowly pushing in toward the front pair"))
STILLS.update({
 # the close plate pulled back so the roll's arc (legs over the partner's back) stays in frame; the fighters and four behind unchanged
 "dr_dl_roll": dict(tool="edit", src="media/plates/drop/dr_dl_close_v5.png", to="media/plates/drop/dr_dl_roll.png", refs=[_CANON, _BUNREF[0]],
   prompt="Edit the first image: pull the camera back. Show the SAME scene from slightly further away, so the two fighters in front are smaller, "
          "each about two thirds of the frame height, full-body from their space buns and ponytail to their sneakers, with clear open sky above "
          "their heads and a strip of wet mirror water below their feet. Keep them exactly the same: the same two women, faces, eyes, expressions, "
          "poses, hair (ORANGE fighter on the left in a high ponytail; VIOLET fighter on the right in two space buns, like the second reference), "
          "jackets, sleeve patches and colours; keep the four small soft-focus figures sparring behind them (ROSE PINK, SKY BLUE, MINT GREEN, "
          "GOLDEN YELLOW), and the sun low between the two fighters. Extend the salt flat, sky and reflections naturally into the new space at the "
          "edges. Everyone's hair stays BLACK: the lane colours are only on jackets, straps and headphones. Do not add any text or people."),
 # the three duilian pairs in a diagonal echelon, each side-on, so a canon reads back to front
 "dr_dl_ripple": dict(tool="gpt", out="media/plates/drop/dr_dl_ripple",
   refs=["media/plates/drop/dr_duilian_v5.png", _CANON] + _BODY + _BUNREF,
   prompt=_STYLE + "Full sunrise on the wet mirror salt flat, the same world, light, outfits, hair and six fighters as the first reference image, "
          "a moment later in the same wushu sparring set, seen wider: the three pairs stand in a DIAGONAL LINE OF PAIRS receding from the right "
          "foreground to the left background, each pair SIDE-ON to the camera, the two partners about one and a half metres apart, squaring off "
          "in a low bow-stance guard, lead hand open, rear fist chambered. Nearest the camera, lower right, large: ORANGE (high ponytail) on the "
          "left facing right against VIOLET (two space buns, as in the last reference image) on the right facing left. In the middle distance, "
          "centre: ROSE PINK (one high bun) on the left against SKY BLUE (high ponytail) on the right. Furthest back, upper left, small: MINT "
          "GREEN (high ponytail) on the left against GOLDEN YELLOW (one high bun) on the right. Six copies in all, every one full-body with "
          "sneakers and reflections visible, nobody overlapping another, with plenty of open sky above every head and space around each pair. "
          "Everyone's hair is BLACK; the lane colours are only on jackets, straps and headphones. Keep all six inside the middle band of the "
          "frame, top to bottom, so a 16:9 crop keeps everyone whole. Low wide camera at waist height; the sun a blazing disc low on the horizon "
          "behind the middle pair, lens flare, long reflections, fine spray at their feet." + _COST + _FACE + _TAIL),
 "dr_dl_ripple_patch": dict(tool="patch", src="media/plates/drop/dr_dl_ripple.png",
   prompt=_PATCH + "Keep every copy's colours exactly as in the first image: the front pair ORANGE (left) against VIOLET (right), the middle pair "
          "ROSE PINK against SKY BLUE, the back pair MINT GREEN against GOLDEN YELLOW; each branch's jacket bands, cargo straps and headphone "
          "cups stay her own colour, never orange except the front-left fighter." + _KEEP),
})
# Round 2 (t65+), after t61-64: every close take did the roll ~1 s early (the sweep at ~0.85 s) and sprang back into the plate's guard by ~4.95 s;
# t64 (variant b) merged the two bodies in the roll. The ripple takes recoloured the lanes from frame 0 (violet -> green, orange -> yellow; the act
# named six colours) or didn't start from the still (t62, t63), and the canon didn't hold. Revised: 1.5 s of guard first, a NEW freeze pose (not
# the opening guard), only the front pair's colours named in the ripple ("every copy keeps her own colours from the first frame"), and a
# simpler back-to-front pass.
_FREEZE = ("about 4.8 seconds in she lands on her feet beside her partner, and both snap into a liangxiang pose, a NEW pose that is not the "
           "opening guard: the violet copy low in a bow stance with her rear arm flung up behind her in a hooked hand, the orange copy turned to "
           "face her in a low crouching guard, heads snapping to the camera, held dead still to the end.")
SHOTS["dr_dl_roll"] = dict(SHOTS["dr_dl_roll"],
   act="Wushu duilian finale, a rehearsed partner set: the orange copy on the left facing right, the violet copy (two space buns) on the right "
       "facing left. For the first 1.5 seconds they only circle slowly in guard. About 1.7 seconds in, exactly on a beat of the reference audio, "
       "the orange copy drops low and sweeps her leg along the water; the violet copy hops over it. About 2.6 seconds in the violet copy lunges "
       "into a bow stance with a straight punch; the orange copy ducks forward under it, bent at the waist, her back flat and level like a table. "
       "About 3.6 seconds in the violet copy sets her shoulders across the orange copy's flat back and rolls sideways over it, legs swinging up "
       "and over in a high arc; the peak, her body level above the back and legs high, about 4.3 seconds in, exactly on a beat; " + _FREEZE
       + _CLOSE_BG)
SHOTS["dr_dl_ripple"] = dict(SHOTS["dr_dl_ripple"],
   act="Wushu duilian performed as a show by the three pairs of the first frame, standing in a diagonal line of pairs on the wet mirror salt "
       "flat, each pair side-on to the camera; every copy keeps her own colours exactly as in the first frame (the big pair in front: ORANGE on "
       "the left, VIOLET on the right). For the first 1.5 seconds all three pairs hold their guard. Then one move passes from pair to pair like a "
       "ripple, from the small pair at the back to the big pair in front, each pair about one second after the pair behind it: one partner "
       "lunges with a punch, the other ducks forward bent flat at the waist, and the puncher rolls sideways across her partner's flat back, legs "
       "swinging up and over in a high arc, and lands on her feet. The back pair rolls about 2.6 seconds in, the middle pair about 3.5 seconds "
       "in, the front pair (the violet copy rolling over the orange copy) about 4.3 seconds in, each exactly on a beat of the reference audio. "
       "About 4.8 seconds in all three pairs snap into a NEW pose, not the opening guard: the roller low in a bow stance with her rear arm flung "
       "up behind her, her partner crouched facing her; held dead still to the end. Wide, low camera, holding still." + SAFE
       + " In every pair the two partners are always two separate people with two arms and two legs each; bodies never merge." + SIX_DL + MUTE_G)
# Video-model bake-off (2026-10-26, docs/video_model_bakeoff.md): the same first frame and one shared prompt (tools/sd/bakeoff.py writes the
# specs, review/takes/specs/dr_dl_{roll,kick}_t71-84.json) on Seedance 2.5, Veo 3.1, Hailuo 2.3, Runway Gen-4.5 and Vidu Q3 Pro. Seedance won
# both tests. Picks: dr_dl_roll_t72 (keyed into v4's 91-93, clip 1.29-4.65 only) and dr_dl_kick_t72 (v4's 97.1-98.3). The kick shot:
# a kick met by a block made for kicks (orange's lifted knee + downward forearm), then her counter punch met by violet's forearm block.
import bakeoff as _bk  # noqa: E402
SHOTS["dr_dl_kick"] = dict(plate="media/plates/drop/dr_dl_roll.png", dur=6, group=True, v2=True, audio=(I2, 165.34, 6),  # B(96); 97.1 = clip 1.739; the EDL keys contact (1.67) on 97.2
   act=_bk.ACT["kick"].format(t1="1.7 seconds in", t2="3.5 seconds in", t3="4.6 seconds in") + _bk.BODY)
