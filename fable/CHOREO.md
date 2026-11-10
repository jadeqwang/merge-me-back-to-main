# Performances (tracks) for the Fable cut

Bar n starts at `0.126 + (n-1) * 1.73913` s; a beat is 0.43478 s. "b89.3" = bar 89, beat 3. All tracks 60 fps, canonical skeleton,
baked by recipes in `fable/tools/bake/recipes_*.py` (library: `motion.py`, notes: `fable/notes/F2_motion.md`).
A performance track that is tied to song time carries `meta.song_t0` (song time of its frame 0) so the show plays it with
`time = t - song_t0`. Accents must land within one frame of the stated song times. Every track starts and ends in a pose that
blends cleanly with `idle` (standing) unless stated. Root motion is included; the show places the track's origin and heading.

Sources: CMU (`cmu:SS_TT`), ACCAD (`accad:Name`); where no capture exists, author key poses (FK/IK) and spline them, then layer
breathing and small weight shifts so nothing looks keyframed. No finger data: hands are rigid.

## A. Utility (owner: M1, `recipes_util.py`)

| track | what | pins |
|---|---|---|
| `fork_L`, `fork_R` | from standing: tiny anticipation, one decisive side step (0.9 m) left / right, settle, look ahead. Two coincident instances playing L and R are "a fork". 2.5 s; the step lands at t=1.0 | step lands on the beat chosen by the show |
| `fork_walk_L/R` | walking forward, veer 25 degrees left / right over 2 s without breaking stride | - |
| `release` | standing: cups both hands at the chest, lifts and opens them forward and up (the light leaves on the accent), eyes follow it, arms lower. 7 s, accent at t=2.5 | V1 "light" 43.33 |
| `sprint_stop_look` | sprint 3 s, brake to a stop over ~1.2 s, stands, breath, turns head and shoulders to look back over the right shoulder, holds to the end. 14 s | stop complete 89.80 (hit), look-back begins 91.8 ("I"), hold through 99.9. `song_t0` = 85.6 |
| `float` | lying on her back on the surface (hips at y=0.10), arms a little out from the sides, legs loose, slow drift and breath; 30 s, no pops. `meta.water: true` | 97.5-118 |
| `rise` | from `float`'s pose: sits up and is lifted to standing, feet leaving the water (root to y=+0.5 by the accent), chest opens, arms sweep out and up wide on the accent, head back; then slowly settles down to the ground, arms lowering, standing by the end. 9 s | accent 118.387 (b69, F#5 leap); feet on the ground by 124.9; `song_t0` = 116.0 |
| `land` | drops from y=1.2 into a deep landing crouch (one hand to the ground) on the accent, holds two beats, rises into a ready stance by +4 beats. 4 s | impact 125.343 (b73) |
| `catch` | standing facing the camera side: something arrives at the chest: both hands receive it, half step back with the impact, head bows over it (hold 4 beats), then head lifts and arms open slowly wide, palms forward, held. 16 s | impact 222.735 (b129); head lifts 229.6 ("life"); arms fully open 232.71 ("become"); `song_t0` = 220.0 |
| `violet` | the lone branch, verse 2, one continuous take: runs (181.0-188.3), slows to a walk and stops (by 190.6, "I"), looks to her left toward the far glow and holds (190.8-194.2), right hand reaches up to the bun and draws a pencil (195.5-196.3), writes one line in the air at chest height, left to right, about 0.9 m (196.4-200.9; the high held "THAT" 197.12-198.11 is one long stroke), opens the hand and lets it go on 201.865 (b117, drums out), watches it leave, then lowers herself to sit on the ground, knees up, arms round the knees, looking up (seated by 206.9), and is still. 30 s | as stated; `song_t0` = 180.995 |
| `lives` (one track per life, 7 s each: 4.5 s of the activity, then the SAME look-back over the right shoulder starting at t=4.5, identical timing in all of them) | `life_piano` seated on a bench height 0.47, playing, body swaying; `life_violin` standing, bowing; `life_wetlab` standing at a bench, pipetting motion, careful; `life_poet` sitting cross-legged on the ground writing in a notebook on her knee; `life_nasa` standing braced, leaning into a strong wind, one arm up shielding the eyes; `life_band` strumming a guitar, stepping to it; `life_wushu` bow-stance punch, drop to a low stance, rise; `life_stage` on stage, both fists up "it worked", a little jump; `life_home` sitting on the ground, pointing up at the sky and tracing a circle with her arm (teaching the planets) | look-back begins exactly t=4.5 |
| `free` | daylight, joy: skipping, a turn with arms flung wide, a leap, whirling, a cartwheel, a pencil-flourish (the violet writing gesture, done large, once), ending in a walk. 21 s; a move change on every bar line, accents on downbeats | `song_t0` = 236.648 (b137); leap apex 243.6 (b141); second "Back to main" 249.44: she stops and turns to face east |
| `sit_idle` | seated knees-up, breathing, tiny head movement; loop 12 s | - |

## B. Build and drop (owner: M2, `recipes_choreo.py`). One performer; the show copies her 1,024 times with offsets

Vocabulary is changquan-flavoured (Jade's real group set, `docs/wushu_groupset_notes.md`): sharp stops, deep stances, long lines,
then stillness. Karate/ACCAD captures supply the dynamics; author the stances that do not exist (pubu, gongbu, mabu, bao quan).

`build` : `song_t0` = 125.343 (b73), 27.83 s, ends in the coiled low stance.
- b73-76 (frontal camera): ready stance after the landing. One clean technique per beat pair: step-punch on b73.3, block b74.1, punch b74.3, turn + low block b75.1, punch b75.3, front kick b76.1, plant b76.3. Crisp stops (ease out fast, hold).
- b77-80 (side camera, canon): high kicks: side kick apex b77.1, roundhouse apex b78.1, side kick b79.1, spinning back kick apex b80.1; recover between.
- b81-84 (top-down camera): moves that read from above: arms sweep wide in a full circle (b81), a 360 spin with arms out (b82), step into a wide horse stance with both arms thrown out (b83.1), draw in (b84).
- b85: two stepping punches (beats 1, 3).
- b86-88 (bass out, snare build): slow: sinks into a low horse stance over three bars, arms drawing in to the hips, head lowering; coil; perfectly still on b88.4.

`drop` : `song_t0` = 153.169 - 1.5 (starts 1.5 s before b89 with the run-up), ends with the salute held.
- b89.1 (153.169): butterfly kick APEX exactly on the downbeat (`cmu:88_06`), landing low on b89.2-3, hold.
- b90-92: the unison phrase from her real set: bow stance + straight punch (gongbu chongquan) b90.1; drop into pubu (deep crouch, one leg extended, arm sweeping low) b90.3; back up to bow stance b91.1; both arms whip overhead into a pose b91.3, hold; b92: turn, slap kick apex b92.3.
- b93-96: travelling: stepping punches b93.1, b93.3; jump b94.1; second drop stance b94.3; front snap kicks apex b95.1, b95.3, b96.1; set b96.3.
- **b97.1 (167.082): the group fall.** Forward dive / breakfall, flat on the ground ON the downbeat, completely still through bar 97 (arms out a little so the body is a clear shape from above).
- b98.1-b99.4: rise as one: push up, crouch (b98.3), spring to standing (b99.1), settle.
- b100.1 (172.300): arms straight out to the sides, standing tall, held through the bar (the "ooh" enters 173.08).
- b101-102: last unison phrase: horse stance punches on b101.1, b101.3, b102.1; bow stance double palm b102.3.
- b103.1 (177.517): jump spin kick apex (`cmu:90_05` or the tornado from `accad:Male2_Form_1` at 12.4 s); lands into the final low pose on b103.3; stands b104.
- b104.1 (179.256): bao quan salute (right fist into left palm at chest height, elbows out, eyes forward), held perfectly to 180.995.

Deliver also `fall_only`, `salute_only`, `butterfly_only` as separate short tracks for reuse.
