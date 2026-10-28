# v6 previews: "written in text" (cloud renders, 720p, with the song)

Rendered in a cloud container (Chromium + SwiftShader, no GPU, no media/) from `engine/show/v6.js`. See `docs/treatment_v6.md`.
Each file is under 100 MB.

**Graphics-only sections** (no footage in them, so these are close to final):
| file | song time | what to look at |
|---|---|---|
| `v6_intro_frost_0-28.mp4` | 0–28.2 | frost growing as the tree: the counter 1 → 1,024 on bars 1–12, MERGE on the bar-9 hit (14.04). The girl at the window is a labelled card (her takes live on the box) |
| `v6_build_gitlog_125-154.mp4` | 124.8–153.8 | `git log --graph` racing on the beat (2, 4, 8, 16 rows per beat), a commit pane per kick, the riser zooming out into tiled logs, the collapse into one point on the drop |
| `v6_ch2_frost_bloom_214-229.mp4` | 214.5–229 | her light crossing the night to the frost window, the bloom on the 222.73 hit (all ten doublings in five beats) |
| `v6_switch_233-258.mp4` | 233–258.5 | **the switch** at 236.64: text → raw cell by cell from her face out, held, text returns from the edges in at 255.9–257.5. The raw image here is a GENERATED stand-in (`out_main_t61`), shown only to demonstrate the transition; Jade's H1 replaces it |
| `v6_outro_graph_endcard_257-282.mp4` | 256.8–282.5 | the git graph of every life (a life per beat), violet cherry-picked last, the lanes sliding home; the end card on 264.47 with credits as commits |

**The whole animatic** (`v6_animatic_part1_0-75.mp4` … `part4_225-282.mp4`): every footage slot carries its shot ID label (bottom-left).
`stand-in <take>` = an existing generated take standing in for Jade's footage (keyed by difference from its background, since generated
takes don't have her dark backdrop); `no footage yet` = a card with the shot ID and the action. The drop's figures are stand-ins for
the traced 2004 set (`?drop=real` on the box).
