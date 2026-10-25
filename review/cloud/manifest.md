# review/cloud manifest (v4, 2026-10-24)

Film time = song time (v2, `analysis_v2/timing.json`); the film adds 14.5 s of post-credits after 282.516 s.
S0 = song time of the take's frame 0 as used by the show (picks s0, already minus lag); lag: clip time = song time - S0_audio + lag.
Still = the first frame sent to Seedance (`stills/`), with the plate it was made from. Face: face_v4 = the locked canon (docs/canon_face_v4.md).
Shots showing Jade's kids are listed but never committed. Full edit list: `edl_v4.json`.

| time | t (s) | shot | picked take | still (plate) | S0 | lag | face | role |
|---|---|---|---|---|---|---|---|---|
| 0:32 | 32 | v1_split_front | v1_split_front_t11_be8b364663 | stills/v1_split_front_t11_be8b364663.jpg  (plate: media/plates/face_v4/v1_split_front.png) | 27.012 | 1.208 | face_v4 | lattice |
| 0:44 | 44 | v1_light_hands | v1_light_hands_t12_7418e105bc | stills/v1_light_hands_t12_7418e105bc.jpg  (plate: media/plates/face_v4/v1_light_hands.png) | 41.313 | 0.667 | face_v4 | lattice |
| 1:07 | 67 | intro_up | intro_up_t5_dbec8cd48a | stills/intro_up_t5_dbec8cd48a.jpg  (plate: intro_up.jpg) | 0 | 0 | pre-v4 (older face) | forktree |
| 1:11 | 71 | ch1_main | ch1_main_t11_647f537e3a | stills/ch1_main_t11_647f537e3a.jpg  (plate: media/plates/face_v4/ch1_main.png) | 68.82 | 0.3 | face_v4 | lattice |
| 1:24 | 84 | ch1_fold_palms | ch1_fold_palms_t11_2d7d5c7f74 | stills/ch1_fold_palms_t11_2d7d5c7f74.jpg  (plate: media/plates/face_v4/ch1_formation.png) | 83.15 | 0 | face_v4 | lattice |
| 1:46 | 106 | bd_float | bd_float_t1_1d7694f532 | stills/bd_float_t1_1d7694f532.jpg  (plate: bd_float.jpg) | None | 0 | pre-v4 (older face) | panels: full-frame back |
| 1:46 | 106 | lf_piano_rose | lf_piano_rose_t1_47cd4fb6de | stills/lf_piano_rose_t1_47cd4fb6de.jpg  (plate: lf_piano_rose.jpg) | 99.965 | 0 | pre-v4 (older face) | panels: pane |
| 1:46 | 106 | lf_wushu_gold | lf_wushu_gold_t1_4d8ba664f2 | stills/lf_wushu_gold_t1_4d8ba664f2.jpg  (plate: lf_wushu_gold.jpg) | 99.265 | 0 | pre-v4 (older face) | panels: pane |
| 1:46 | 106 | lf_lab_mint | lf_lab_mint_t1_193d5a1944 | stills/lf_lab_mint_t1_193d5a1944.jpg  (plate: lf_lab_mint.jpg) | 98.565 | 0 | pre-v4 (older face) | panels: pane |
| 1:46 | 106 | lf_poet_gold | lf_poet_gold_t1_074524df98 | stills/lf_poet_gold_t1_074524df98.jpg  (plate: lf_poet_gold.jpg) | 97.865 | 0 | pre-v4 (older face) | panels: pane |
| 1:46 | 106 | lf_ames_white | lf_ames_white_t1_3748f7bbe8 | stills/lf_ames_white_t1_3748f7bbe8.jpg  (plate: lf_ames_white.jpg) | 97.165 | 0 | pre-v4 (older face) | panels: pane |
| 1:46 | 106 | lf_band_rose | lf_band_rose_t1_924e262209 | stills/lf_band_rose_t1_924e262209.jpg  (plate: lf_band_rose.jpg) | 96.465 | 0 | pre-v4 (older face) | panels: pane |
| 1:46 | 106 | lf_stage_sky | lf_stage_sky_t1_5393480502 | stills/lf_stage_sky_t1_5393480502.jpg  (plate: lf_stage_sky.jpg) | 95.765 | 0 | pre-v4 (older face) | panels: pane |
| 1:46 | 106 | lf_home_mint | lf_home_mint_t1_e194828541 | (omitted: shows her kids) |  |  |  | panels: pane |
| 1:58 | 118 | bd_ahh | bd_ahh_t12_d2cff0c504 | stills/bd_ahh_t12_d2cff0c504.jpg  (plate: media/plates/face_v4/bd_ahh.png) | 111.945 | -0.375 | face_v4 | lattice |
| 3:07 | 187 | v2_dish_close | v2_dish_close_t11_d6fceda232 | stills/v2_dish_close_t11_d6fceda232.jpg  (plate: media/plates/face_v4/v2_dish_close.png) | 181.67 | 0 | face_v4 | lattice |
| 3:09 | 189 | v2_horizon | v2_horizon_t5_97da4dc230 | stills/v2_horizon_t5_97da4dc230.jpg  (plate: v2_horizon.png) | 187.385 | 0 | pre-v4 (older face) | lattice |
| 3:30 | 210 | ch2_catch | ch2_catch_t11_03c5dd87e5 | stills/ch2_catch_t11_03c5dd87e5.jpg  (plate: media/plates/face_v4/ch2_catch.png) | 207.548 | 0.292 | face_v4 | lattice |
| 3:33 | 213 | ch2_catch | ch2_catch_t11_03c5dd87e5 | stills/ch2_catch_t11_03c5dd87e5.jpg  (plate: media/plates/face_v4/ch2_catch.png) | 207.548 | 0.292 | face_v4 | lattice |
| 3:42 | 222 | (dronetree) | - | drone tree: procedural, no plate |  |  |  | dronetree |
| 3:43 fold | 223.5 | ch2_fold_palms | ch2_fold_palms_t12_2cc0102b23 | stills/ch2_fold_palms_t12_2cc0102b23.jpg  (plate: media/plates/face_v4/ch2_formation.png) | 222.13 | 0 | face_v4 | lattice |
| 3:54 | 234 | ch2_gone_close | ch2_gone_close_t12_b30af2db05 | stills/ch2_gone_close_t12_b30af2db05.jpg  (plate: media/plates/face_v4/ch2_gone_close.png) | 228.49 | 0.12 | face_v4 | lattice |
| 3:58 orchestra | 238 | out_orch | out_orch_t2_a06a77a8ce | stills/out_orch_t2_a06a77a8ce.jpg  (plate: media/plates/out_orch.png) | 236.64 | 0 | face_v4 | lattice/paint |
| 4:05 orchestra close | 245 | out_orch_close | out_orch_close_t1_88bac16b5e | stills/out_orch_close_t1_88bac16b5e.jpg  (plate: media/plates/out_orch_close.png) | 243.6 | 0 | face_v4 | lattice/paint |
| 4:12 | 252 | out_main | out_main_t12_d9d33a9749 | stills/out_main_t12_d9d33a9749.jpg  (plate: media/plates/face_v4/out_main.png) | 249.35 | -0.25 | face_v4 | lattice |
| 4:16-4:17 | 256.5 | (card) | - | git log / end card: drawn by the engine, no plate |  |  |  | card |
| post-credits | 285 | pc_kneel | pc_kneel_t1_5ddeaba121 | stills/pc_kneel_t1_5ddeaba121.jpg  (plate: media/plates/pc_kneel.png) | 282.216 | 0 | face_v4 | lattice/paint |
| post-credits | 292 | pc_beam | pc_beam_t1_0a8e53006b | stills/pc_beam_t1_0a8e53006b.jpg  (plate: media/plates/pc_beam.png) | 288.316 | 0 | face_v4 | lattice/paint |

Notes
- 1:07 is the forktree bookend (`intro_up_t5`, Jade seen from above while the tree forks), a real take, NOT a still fallback; its face predates v4.
- 1:46 is the breakdown panels: the full-frame back is `bd_float_t1` (pre-v4 face); the panes are her life clips (the home one omitted).
- 4:16-4:17 is the git-log card (engine-drawn).
- picks/: work/picks.json + docs/picks_manual.json + docs/lags.json. sync/: .sync.json/.labial.json of the picked singing takes.
- refs/: canon v4 (canon_v4__*), older r6/r7 refs, and every face_v4 plate. audio/: the revised song and its vocal stem (Jade approved public).
