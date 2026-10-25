#!/usr/bin/env python3
"""Local page comparing the likeness pass: original plate · each face-pass attempt · Jade's selfie. Open out/review/likeness.html via file://.
  .venv/bin/python tools/plates/likeness_page.py"""
import glob, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "out/review/likeness.html")
rel = lambda p: os.path.relpath(os.path.join(ROOT, p), os.path.dirname(OUT))


def find(d, stem):
    for e in (".png", ".jpg"):
        if os.path.exists(os.path.join(ROOT, d, stem + e)): return os.path.join(d, stem + e)


LABEL = {"intro_up": "0:00 intro, looking up", "v1_split_front": "0:28 I split myself", "v1_light_hands": "0:42 Each one a light",
         "ch1_main": "1:10 Merge me back to main", "ch1_gone_close": "1:30 Nothing that I lived (+ the hair you liked)", "dr_center": "2:47 drop, dance close-up",
         "v2_dish_close": "3:01 This branch (violet, bun)", "v2_pencil": "3:15 writing with the pencil", "ch2_catch": "3:28 Merge me (the catch)"}
stems = [k for k in LABEL if find("media/plates/face", k)]
tries = sorted(d for d in glob.glob(os.path.join(ROOT, "media/plates/face/try*")) if os.path.isdir(d))
rows = []
for s in stems:
    orig = find("media/plates/fix", s) or find("media/plates", s)
    cols = [("original", orig)] + [(os.path.basename(t), find(os.path.relpath(t, ROOT), s)) for t in tries] + [("current", find("media/plates/face", s))]
    cells = "".join(f'<figure><a href="{rel(p)}" target="_blank"><img src="{rel(p)}" loading="lazy"></a><figcaption>{n}</figcaption></figure>'
                    for n, p in cols if p)
    rows.append(f"<section><h2>{s}</h2><div class='row'>{cells}<figure><img src='{rel('media/style/selfie_face.jpg')}'><figcaption>your selfie (reference)</figcaption></figure></div></section>")
cur = "".join(f'<figure><a href="{rel(find("media/plates/face", k))}" target="_blank"><img src="{rel(find("media/plates/face", k))}"></a><figcaption><b>{LABEL[k]}</b> · {k}</figcaption></figure>' for k in stems)
html = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Merge — likeness pass</title><style>
body {{ margin:0; background:#05060D; color:#FFF1DC; font:14px/1.4 ui-monospace, Menlo, monospace; }}
main {{ padding:16px; }} h1 {{ font:800 20px system-ui, sans-serif; }} h2 {{ font:600 15px system-ui, sans-serif; color:#FF7A1A; margin:18px 0 6px; }}
.row {{ display:grid; grid-template-columns:repeat(auto-fit,minmax(280px,1fr)); gap:10px; }}
figure {{ margin:0; }} img {{ width:100%; display:block; border-radius:4px; background:#111; }} figcaption {{ color:#8a8796; font-size:12px; padding:4px 0; }}
</style></head><body><main><h1>Likeness pass</h1>
<section><h2>NEWEST — canon v4 face propagated to every face shot (media/plates/face_v4/). Each row: canon · current still · MY PICK (= face_v4/&lt;shot&gt;.png) · alternates. Top: whole faces, below: eye crops from the SAME files</h2>
<p style="color:#8a8796">Main-Jade shots also get the canon half-up hair (braids temple→crown, forehead uncovered, long waves); the violet branch keeps its bun + pencils. 1:30 / 3:28-gone use the canon image itself. Floating shot (1:58) shown rotated upright.</p>
<p style="color:#8a8796">All nine winners, full frame:</p><a href="v4_winners.jpg" target="_blank"><img src="v4_winners.jpg" style="max-width:1600px"></a>
{''.join(f"<h2>{t}</h2><a href='v4_{k}.jpg' target='_blank'><img src='v4_{k}.jpg' style='max-width:{w}px'></a>" for k, t, w in [
    ("ch1_main", "1:10 Merge me back to main — ch1_main", 2000), ("v1_split_front", "0:28 I split myself — v1_split_front", 2000),
    ("v1_light_hands", "0:42 Each one a light — v1_light_hands", 2000), ("bd_ahh", "1:58 floating, eyes closed — bd_ahh (plate bd_float_close)", 2000),
    ("ch2_catch", "3:28 the catch — ch2_catch", 1600), ("dr_center", "drop, dance close-up — dr_center", 2000),
    ("v2_dish_close", "3:01 This branch (violet, bun) — v2_dish_close", 2000), ("v2_pencil", "3:15 the pencil (violet) — v2_pencil", 2000),
    ("v2_release", "violet release — v2_release", 2000), ("gone_close", "1:30 + 3:28 gone close-ups — the canon itself (ch1_gone_close = ch2_gone_close)", 1200)])}</section>
<section><h2>NEWEST — clean no-glasses versions (made from the clean glasses faces, glasses removed): 1 · 2 · 3 · 4</h2>
<a href="ng_faces.jpg" target="_blank"><img src="ng_faces.jpg" style="max-width:1700px"></a></section>
<section><h2>Bang fragments and the temple lock removed (use 3 · 4 — glasses) (forehead + temples rebuilt; brows, eyes, glasses untouched). No glasses: 1 · 2 — glasses: 3 · 4</h2>
<a href="W_faces.jpg" target="_blank"><img src="W_faces.jpg" style="max-width:1700px"></a>
<p style="color:#8a8796">Contrast-boosted forehead check (exaggerates any leftover shading): <a href="fh_fix5.jpg" target="_blank" style="color:#FF7A1A">fh_fix5.jpg</a></p></section>
<section><h2>Temples cleaned (fragments still visible), your brow shape kept exactly (all pass the symmetry check). No glasses: A · B — glasses: C · D</h2>
<a href="F_pick.jpg" target="_blank"><img src="F_pick.jpg" style="max-width:1700px"></a></section>
<section><h2>Brow ends reshaped to YOUR outline (traced from your photo 15, aligned by the eye corners): tails taper to a thin point past the eye corner, soft feathered heads. Top-left: your photo · guide · then candidates</h2>
<a href="browfix.jpg" target="_blank"><img src="browfix.jpg" style="max-width:1680px"></a>
<p style="color:#8a8796">Whole faces: G1 a · G1 b · no-glasses a · no-glasses c</p><a href="browfix_faces.jpg" target="_blank"><img src="browfix_faces.jpg" style="max-width:1632px"></a></section>
<section><h2>Glasses version fixed (no smudges; brows completed under the old strands; half-up hair + taller forehead): G1 · G2 · G3 · G4</h2>
<a href="G_faces.jpg" target="_blank"><img src="G_faces.jpg" style="max-width:1632px"></a></section>
<section><h2>No-glasses — strands removed and the hidden parts of the brows completed. Top: n3 (previous) · a · b · c (all with half-up hair + taller forehead). Below: brows — original with strands · n3 · a · b · c</h2>
<a href="rv_sheet.jpg" target="_blank"><img src="rv_sheet.jpg" style="max-width:1400px"></a></section>
<section><h2>Brows fixed (your approved brows kept; only hairline + hair from the edit). half-up · + taller forehead · glasses · glasses + taller forehead. Below: eyes/brows vs the approved brows (left)</h2>
<a href="hair3_sheet.jpg" target="_blank"><img src="hair3_sheet.jpg" style="max-width:1400px"></a></section>
<section><h2>Half-up, half-down hair (brows wrong in these) (black, braids from the temples to the crown, forehead uncovered; hairstyle-only reference, its face masked). Top: reference · half-up · forehead taller +0.20 · +0.35 (× eye spacing). Bottom: same with glasses</h2>
<a href="hair_sheet.jpg" target="_blank"><img src="hair_sheet.jpg" style="max-width:1400px"></a></section>
<section><h2>Measured proportions pass (nose length, nose/mouth width, face width, lower lip matched to your photos), plus glasses and resting-expression variants</h2>
<a href="prop_variants.jpg" target="_blank"><img src="prop_variants.jpg" style="max-width:1600px"></a></section>
<section><h2>Brows raised but NOT thickened (whole face + eye crops from the SAME files): a1 · a2 · d1 · d2</h2>
<a href="r5_bl0_sheet.jpg" target="_blank"><img src="r5_bl0_sheet.jpg" style="max-width:1600px"></a>
<p style="color:#8a8796">Same, with a very slight thickening (a third of before):</p><a href="r5_bl1_sheet.jpg" target="_blank"><img src="r5_bl1_sheet.jpg" style="max-width:1600px"></a></section>
<section><h2>Previous — a and d with a soft warm-brown gradient (NOTE: eye crops here are before the brow lift; whole faces after) at the outer corner. Top row: a (before) · a1 · a2. Bottom row: d (before) · d1 · d2</h2>
<a href="r5_shadow.jpg" target="_blank"><img src="r5_shadow.jpg" style="max-width:1680px"></a>
<p style="color:#8a8796">Whole faces (a1 · a2 · d1 · d2) with the brow lift:</p><a href="r5_shadow_faces.jpg" target="_blank"><img src="r5_shadow_faces.jpg" style="max-width:1600px"></a></section>
<section><h2>Your own crease line (top-left, from your clicks) as the guide. Then a · b · c · d, and the previous best (n70_b) bottom-right for comparison</h2>
<a href="r5_eyes.jpg" target="_blank"><img src="r5_eyes.jpg" style="max-width:1120px"></a>
<p style="color:#8a8796">Whole faces (a · b · c · d) with the brow lift, jaw/chin untouched:</p><a href="r5_faces.jpg" target="_blank"><img src="r5_faces.jpg" style="max-width:1600px"></a></section>
<section><h2>Picker (done) — where does your crease actually sit? Same eye, guide line at five heights (1 = lowest … 5 = highest; the last guide I used was above 5)</h2>
<a href="crease_pick.jpg" target="_blank"><img src="crease_pick.jpg" style="max-width:1300px"></a></section>
<section><h2>Round 3. Top: smooth brow lift (no warp ripples; eyes/lids/jaw/chin pixel-exact; forehead kept): left = eyelids only · middle = a + lift · right = b + lift (brows now 0.34–0.35 above the eyes, your photos 0.35–0.41)</h2>
<a href="r3_bl.jpg" target="_blank"><img src="r3_bl.jpg" style="max-width:1400px"></a>
<p style="color:#8a8796">Eyelids this round — crease highest at the inner end (guide, top right), outer end kept where you said it's right. a/b at ⅗ iris, then ⅞:</p>
<a href="r3_eyes_page.jpg" target="_blank"><img src="r3_eyes_page.jpg" style="max-width:1120px"></a></section>
<section><h2>Round 2: band widest at the inner end narrowing to the outer corner (≈⅓–½ iris, your photos ≈⅓), warp confined to the upper face (jaw/chin untouched). Left: before · middle: ⅓-iris band · right: ½-iris band</h2>
<a href="r2_sheet.jpg" target="_blank"><img src="r2_sheet.jpg" style="max-width:1368px"></a></section>
<section><h2>Round 1 (1) — taller eyelid band: crease painted at a measured height (3×/4×/5× the original band), then made natural by GPT Image keeping its height. Top-left: before · then 4× a, 4× b, 5× a, 5× b</h2>
<a href="nat_eyes_page.jpg" target="_blank"><img src="nat_eyes_page.jpg" style="max-width:1120px"></a></section>
<section><h2>NEWEST (2) — forehead-preserving warp on "4× a": brows raised, hairline raised with them (forehead kept tall), chin untouched. Left: before any of this · middle: 4× a · right: 4× a + warp</h2>
<a href="nat_liq.jpg" target="_blank"><img src="nat_liq.jpg" style="max-width:1440px"></a></section>
<section><h2>Previous — measured proportions: brows raised + thickened, lower face lengthened by a landmark "liquify" warp (no repaint). Left: before · middle: gentle · right: full (hits your photos' face length; brows 0.34 vs your 0.35–0.41)</h2>
<a href="liq.jpg" target="_blank"><img src="liq.jpg" style="max-width:1440px"></a></section>
<section><h2>Your 1:30 face with ONLY the lid band raised, via GPT Image + your selfies; no beautifying. a · c · d (all symmetry-checked)</h2>
<a href="gpt2_gc.jpg" target="_blank"><img src="gpt2_gc.jpg" style="max-width:1728px"></a></section>
<section><h2>WHOLE FACES — the approved 1:10 and 1:30 faces next to the 3:28 GPT candidates (click for full size)</h2>
<a href="gpt_faces.jpg" target="_blank"><img src="gpt_faces.jpg" style="max-width:1440px"></a></section>
<section><h2>Refining your GPT Image pick (3:28): a touch smaller, no pink lid shadow, a thicker lid band. Top: ch1_main_a · GPT bake-off original. Then a · b · c</h2>
<a href="gpt_eyes.jpg" target="_blank"><img src="gpt_eyes.jpg" style="max-width:1120px"></a>
<p style="color:#8a8796">Also: four Seedream 5 Pro refinements (no liner), for comparison:</p><a href="sd5_eyes.jpg" target="_blank"><img src="sd5_eyes.jpg" style="max-width:1120px"></a></section>
<section><h2>Model bake-off on 3:28 (same task: match ch1_main_a's eyes). Top: ch1_main_a · current 3:28 (catch_d1). Then GPT Image 2.5 · Nano Banana 2.1 · FLUX.2 max · Seedream 5 Pro</h2>
<a href="bake_eyes.jpg" target="_blank"><img src="bake_eyes.jpg" style="max-width:1120px"></a>
<p style="color:#8a8796">Whole faces, same order (ch1_main_a, current, GPT, Nano Banana 2.1, FLUX, Seedream):</p><a href="bake_faces.jpg" target="_blank"><img src="bake_faces.jpg" style="max-width:1400px"></a></section>
<section><h2>Previous — 3:28 with the lid space restored. Top: your 1:30 pick. Rows: catch a / catch d → real-eyes-only (1, 2) → guided by your 1:30 pick (1g, 2g, right two)</h2>
<a href="cand12_catch_page.jpg" target="_blank"><img src="cand12_catch_page.jpg" style="max-width:1400px"></a></section>
<section><h2>Previous — 3:28 the catch, eyes matched to your 1:30 pick (a). Top row: 1:30 a (reference) · current 3:28. Then a · b · c · d — all measure the same eye size as the reference (iris 0.24–0.25 vs 0.25)</h2>
<a href="cand11_catch.jpg" target="_blank"><img src="cand11_catch.jpg" style="max-width:1120px"></a></section>
<section><h2>1:30 "protagonist eyes" (you picked a — now current) (auto-checked: rounder opening, lid peak centred over the iris, no wing). Top row: ch1_main_a (reference) · current. Then a–f</h2>
<a href="cand10_gc.jpg" target="_blank"><img src="cand10_gc.jpg" style="max-width:1120px"></a>
<p style="color:#8a8796">Whole faces of the three with no wing (c · d · f):</p><a href="cand10_faces.jpg" target="_blank"><img src="cand10_faces.jpg" style="max-width:1152px"></a></section>
<section><h2>Previous — 1:30 with ch1_main_a's eye shape + lid band ≈ 1/3 iris diameter (wider at the inner end). Top: ch1_main_a (shape you liked) · ch1_gone_close_b (lid thickness you liked). Then a · b · c</h2>
<a href="cand9_gc.jpg" target="_blank"><img src="cand9_gc.jpg" style="max-width:1120px"></a>
<p style="color:#8a8796">Measurement overlay (iris circle = ruler, green = lashes→crease): <a href="../test/eyem_photos.jpg" target="_blank" style="color:#FF7A1A">your photos</a></p></section>
<section><h2>Previous round — eyelid candidates (crease never meets the lashes; wider + fainter at the inner end, narrower + subtly darker lid toward the outer end). Each row: current · a · b</h2>
{''.join(f"<figure><a href='cand8_{k}.jpg' target='_blank'><img src='cand8_{k}.jpg'></a><figcaption>{LABEL[k]}</figcaption></figure>" for k in ['ch1_gone_close','v1_split_front','ch1_main','ch2_catch','dr_center','intro_up','v2_dish_close','v2_pencil'])}</section>
<section><h2>Photo test: your selfie → 3D style directly (left = photo, right = result). Top: re-staged into the scene (drifts generic). Bottom: style-only (keeps you, barely stylized)</h2>
<div class="row"><figure><img src="../test/photo_test2.jpg"></figure><figure><img src="../test/photo_style.jpg"></figure></div></section>
<section><h2>CURRENT VERSIONS — these are the ones to judge (click for full size)</h2><div class="row">{cur}</div></section>
<h2 style="margin-top:40px;color:#8a8796">History, per shot: original (v2) → attempts → current (last in each row)</h2>
<p style="color:#8a8796">original = the plate in v2 · try1 = first selfie prompt (eyes shrank, smile flat) · try2 = keep large eyes + expression · try3_eyelids = before the first eyelid-only test · try3 = before the eyelids + brows pass · try4 = brow fixes · try5 = before the natural-crease pass · try6/try7 + cand/ = this round · <b>current</b> = corrected crease, eyes centred (symmetry-checked), 1:30 with the hair you liked (no fringe edge), 0:28 with curtain bangs</p>
<section><h2>eyes, before (left) → after (right) the corrected pass: more lid at the inner corner (no crease there), crease emerging mid-lid, most visible and tapering at the outer corner</h2><a href="likeness_eyes_before_after.jpg" target="_blank"><img src="likeness_eyes_before_after.jpg" style="max-width:960px"></a></section>
{''.join(rows)}</main></body></html>"""
open(OUT, "w").write(html)
print(OUT)
