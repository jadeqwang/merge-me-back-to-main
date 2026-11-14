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
