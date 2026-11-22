# Film v8: direction (from `jade_v7_notes.md`)

Decisions on v7: car box right; 3:30 look-up alive, keep; pencils fixed; next = v8 with her notes.
Stills at her timestamps: `work_fable/take2/dev/v8/` (sheet.jpg).

| Note | What we saw | What it becomes | Owner |
|---|---|---|---|
| 0:16.78 b10.2 purple line disjointed | Tree branches are scribbly multicolour hatched strokes; the purple line at right is a clean thin smooth curve, a different medium | Draw the whole tree in code, frame by frame (branches grow, every branch incl. purple in one stroke style); no generated footage under it | compositor |
| 1:34.84 b55.2 glyph art | (experiment) | Dense composed-glyph renderer: glyphs as paint strokes, any script/font/orientation, coarse-to-fine; stills first | glyph agent (priority) |
| 2:15.93 b79.1 glyph animation | (experiment) | Orchestra / wushu mocap rendered as glyph art, coherent glyphs that stick to bodies | glyph agent |
| 3:01.65 b105.3 drawing misaligned from book | vb01: the gold drawing overlay overhangs the book's left page edge | Re-track the page (corner/homography per frame) and clip the drawing to the page | compositor |
| 3:03.39 b106.4 3 pencils | vb01 plate: pencil in hand + two in bun | Bun edit to one pencil (as `gen/bun_pencil_v7.py`); audit every Verse 2 plate with a pencil in hand | plates |
| 3:42.16 b129.2 glyph art | (experiment) | Glyph agent makes stills of this shot too | glyph agent |
| 4:01.51 b140.4 hand doesn't make sense | | Fable ideation on "she has kept intuition" or a new idea: `outro_ideas_v8.md`; recommendation to Jade, then build | fable → plates/compositor |
| 4:04.13 b142.2 looks alien and wrong | | Same | same |
| 4:30.46 b157.4 car and yellow lines wrong | Road + yellow dashes run diagonally up-left through the side window; reads as wrong orientation | Build car interior + road in three.js; camera starts over her shoulder looking out the windshield (road correct, lines receding to centre), then pans round to the driver's eyes (the "you" of the box) looking at her. Keep the JRPG box. | car agent → compositor wires |
