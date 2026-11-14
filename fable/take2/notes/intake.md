# Intake notes

Submitted 15 specs (est $1.156 each, ~$17.34) via gen.py submit. Job ids:

- mergemain/t2_main_face_t1-325e0cc364
- mergemain/t2_main_split_t1-cab6829fde
- mergemain/t2_cross_wushu_t1-57329d8e58
- mergemain/t2_cross_ames_t1-27f9095ea5
- mergemain/t2_cross_hackerhouses_t1-8769a423ce
- mergemain/t2_cross_violet_t1-fc4f3d979d
- mergemain/t2_main_light_t1-d2811f67ca
- mergemain/t2_main_release_t1-e8ab9b9da6
- mergemain/t2_hero_feet_t1-c40520f954
- mergemain/t2_fold_reach_t1-a56f20499d
- mergemain/t2_fold_chest_t1-7fb36fedbf
- mergemain/t2_look_back_t1-5da3ba5715
- mergemain/t2_main_back_wide_t1-87ea58fdfe
- mergemain/t2_runner_main_t1-bad7e3baf2
- mergemain/t2_like_sing1_c-f558055cee

## Results (2026-11-13)
All 15 jobs done on first submit, est $1.156 each (about $17.34 total), no retakes, no requeue. Clips in media/gen/t2_<id>_t1_<jobhash>.mp4 (like clip: t2_like_sing1_c_f558055cee.mp4).
Plates: work_fable/take2/plates/<id>/ (121 frames each, REAL file); strips work_fable/take2/strips/<id>.jpg; made with fable/take2/tools/intake.sh <id> <clip>.
like_c: plate (frames + meta only, as like_b), strip work_fable/take2/strips/like_c.jpg; lag variants in review/fable_take2/step0/likeness_local/like_c_lag{-80,+0,+80,+160}.mp4
(picture unchanged; audio = window of "inputs/Merge (keychange down).wav" starting 233.6 - lag/1000 s, so lag +N = audio N ms later; checked by cross-correlation against the existing like_b variants' convention: -80/+80/+160 vs lag0 measured -80/+80/+160 ms, lag0 = source window offset 0).
Existing like_a/like_b variants (named like_b_lag0 etc.) have the same convention.

## Mishap
My first intake loop globbed media/gen/t2_*_t1_*.mp4 and re-ran intake on older plates hero_paper, patch_resolve, runner_pencil, runner_pixel, cross_wetlab (and added REAL + strips). Restored: hero_paper from t2_hero_paper_t2_17ee110519, runner_pencil from t2_runner_pencil_t2_05031855e3 (the clips their meta/kit test used); patch_resolve, runner_pixel, cross_wetlab have only t1 clips so were rebuilt from those. REAL files removed from those five (they had none). Frames were re-extracted with the proof intake.sh settings (-q:v 2), possibly not byte-identical to before.

## Gait (fable/take2/tools/gait.py)
Motion-energy autocorrelation on the figure band, 36-frame windows. Measures step period (foot to foot, stride = 2x). Control: pf_hero_t1 (the old stutter clip) is flagged in windows 37-90 (period 7 -> 14 / lost) - the method sees the known repeat.
runner_main: step 9-10 frames throughout, no window off. hero_feet, cross_*: with lag range 4-8 the signal locks to a 4/6-frame flicker (probably clip is on twos / effects), so MINLAG=9 was used: step 10 in all windows from frame 1. Peak lost late in cross_ames (windows from 73), cross_hackerhouses (from 61), where the figure shrinks/fades; cross_wushu autocorr falls (0.4) in the last windows; not a period change.

## Runner kit, ten mediums (2026-11-13, no new submits)
Collected t2_runner_{piano,wushu,wetlab,phd,poet,ames,band,chezjj,home,violet}_t1 -> media/gen/t2_runner_<k>_t1_<hash>.mp4 (hashes 54e46bd48f 33cf9aeb5a d51813d223 da088b8e7a a4f566084d 9f36b901fa 1bc2b2465d d10e30b4c1 7b696678db 4036835266). Intake as plate runner_<k> (121 frames each, strips work_fable/take2/strips/runner_<k>.jpg), explicit ids only. Mattes (matte.py) in work_fable/take2/kit/runner_<k>/ (121 rgba frames + check.jpg), about 3 min each. Overview: work_fable/take2/strips/runner_kit_overview.jpg (frames 1/40/80/120, 320x180).
Gait (MINLAG=9) median step period in frames: piano 16 (windows 1-60 read 9, 31-120 read 16-17: period doubles mid-clip), wushu 16 (no peak 1-36, 79-114), wetlab 9, phd 16 (no peak 1-36), poet 16, ames 16 (no peak 37-102), band 16 (no peak 13-78), chezjj 14, home 17 (no peak 1-36; 31-66 reads 9), violet 10 (no peak 67-102). 16-17 vs 9-10 is probably stride vs step (2x), not a gait change; the piano switch 9 -> 16 is the one to look at.
Matte bbox (x0,y0,x1,y1) frames 1/60/120, 1280x720: see report; mattes touch the bottom row in all 121 frames for wushu, phd, poet, ames, band (the clips are cropped close-ups, feet out of frame); never touch left/right edges; piano, wetlab, chezjj, home, violet do not touch any edge.
