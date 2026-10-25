# v5a review videos (2026-10-25)

**Where the video is:** here, in this folder. The box can't upload to Google Drive (no rclone remote, no Drive folder, no Google account
in GNOME Online Accounts), so there is no `merge_v5a_1080p.mp4` on Drive. Instead, the whole film (4:57, 720p) is in four parts, each under
GitHub's 100 MB limit:
- `merge_v5a_part1_0-75.mp4` · intro, verse 1, life montage, pre-chorus grid, 1:07 origin, 1:15 tree
- `merge_v5a_part2_75-150.mp4` · fold 1, chorus 1, breakdown, build
- `merge_v5a_part3_150-225.mp4` · the drop (still the v4 wushu), verse 2, chorus 2, fold 2
- `merge_v5a_part4_225-297.mp4` · 3:56 cut, orchestra (stand-ins), home, living graph, end card, post-credits

**What it is:** branch `claude/wonderful-mccarthy-f90kll` at `54bf08e` (the frozen-frame + fork-tree fixes), default params, rendered on the box.
`tools/sd/picks.py` was rerun (new lags: 0:32 0.62, 0:44 −0.15, 1:11 0.40, 3:54 0.30), and so was `tools/mix.py` (`out/mix_v5.wav`). `tools/edl_check.mjs` reports `held-clocks 0`.
**No new takes:** nothing was generated, and spend is unchanged. So the v5 shots still use their stand-ins: the orchestra uses reframed v4 takes, the drop
is the v4 drop (v5 switches on once all six wushu takes are picked), 3:30 and 4:12 use the interim trims, and 1:07 and 1:46 keep the old face.
The full-quality master stays on the box: `out/review/v5a/merge_v5a_720.mp4` (2 GB).

## What to eyeball (run sheet §1.1 and §4)
| film time | part | look at |
|---|---|---|
| 0:29–0:33 | 1 | the L1 fork copies now run a moment behind her, as an echo of the line |
| 0:42.1 | 1 | the cut moved to `v1_light_hands`'s first frame; L2 runs on to it at 0.92x |
| 0:54–1:05 | 1 | the pre-chorus grid: the slow head turn (~0.23x through the fold); pane faces as glyphs |
| 1:07 | 1 | the origin Jade plays (breath, blink, smile), slow push-in; fork-tree copies are now glyphs (is the face readable?) |
| 1:14.7 | 1 | the cut into the tree, on `ch1_main`'s last frame |
| 1:15–1:19 | 2 | the tree's four copy clocks, now spaced to fit the take |
| 1:40–1:52 | 2 | breakdown panes (~0.68x) and the `bd_float` back (~0.84x); the 1:51.9 cut into `bd_ahh` |
| 2:05–2:31 | 2 | the 16-pane build wall, each take slowed to span its pane (0.25–0.47x) |
| 2:57 | 3 | the drop's fork tree as glyphs |
| 3:00.8 | 3 | **new 2-beat insert:** the wide of her alone at the dish, then the close-up from 3:01.67 |
| 3:30 | 3 | the interim trim: the cut lands on "main", eyes closed, and the hook carries over the tree |
| 3:48 | 4 | fold 2 at 0.9x (no held last frame) |
| 3:56.3 | 4 | the cut into the orchestra, on `ch2_gone_close`'s last frame; the stand-in eases in |
| 3:57–4:12 | 4 | orchestra timing and cuts (stand-ins; the violet composer arrives with the new takes) |
| 4:12–4:24 | 4 | the home shot ends before the grin, then the living graph: are the 14 lives readable? violet merges last |
| 4:42–4:57 | 4 | post-credits: violet sends the light, the window girl in slow motion, the touch, the shape growing, one chime cascade |

Lip-sync by ear: 0:32 (lag 0.62), 0:44 (−0.15; the take holds 0.7 s of silence before "Each"), 1:11 (0.40), 3:54 (0.30, interim).
A/B renders (`?figlook=led` for the old LED copies at 1:04–1:20, `?orch=v4`) aren't included; ask and the box will render them.
