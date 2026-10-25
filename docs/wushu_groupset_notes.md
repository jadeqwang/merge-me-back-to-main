# Jade's real group set: notes for tools/sd/shots_wushu.py (2026-10-25)

Source: her team's competition video (2004 Wushu Collegiates, group set, 3rd place, 8.54), studied on the box from YouTube at 320×240/15 fps.
**Analysis only**: no frames are committed, nothing from the video goes to any model, and her teammates are not named or depicted. The
low resolution shows structure, formations and move families clearly, but not hand shapes or exact counts, so the counts below are approximate.

## The facts that change the plan
- **Six performers, not seven.** Our `dr_set` uses 7 copies; the real set is 6. `dr_duilian` (6 copies, 3 pairs) already matches.
- **Two colours, three and three:** three in **black** and three in **red** uniforms, alternating along the line. Half-vs-half is built into
  the set itself: the colour groups trade phrases (call and response) and pair up across colours for the partner exchanges. In our world,
  give 3 copies one lane family and 3 the other, alternating, rather than 7 different lanes.
- **No music** is audible (crowd and room noise only). The set is self-timed: fast phrases, sudden freezes, long holds. Cutting it to our
  138 BPM drop is our choice, not the original's.
- **Its signature is the floor work:** twice, all six fall to the mat together and lie flat for several seconds, then rise as one. The
  crowd's loudest reaction (0:49) is the first fall.

## Structure (video time → what happens)
| time | section | moves / formation |
|---|---|---|
| 0:00–0:07 | entrance | they walk on from the back of the carpet, line up, salute (fist-in-palm, *baoquan*) |
| 0:08–0:14 | walk to the opening spots | jog into a staggered line across the carpet, colours alternating |
| 0:15–0:18 | ready | all six stand at attention, still: a long, tense hold |
| 0:18–0:27 | first unison phrase | in place, together: bow stance with a straight punch (*gongbu chongquan*), a drop into a deep crouching stance (*pubu*) with one leg extended and the arm sweeping low, back up into bow stance; arms whip overhead into poses |
| 0:27–0:41 | travelling phrases | the line moves across the carpet: stepping punches, turns, a jump; a second drop stance; brief two-row formation |
| 0:42–0:46 | kicks | front snap kicks and slap kicks across the line, staggered by colour |
| **0:47–0:55** | **fall 1** | all six fall forward to the mat together (dive/breakfall) and **lie flat**, completely still for ~6 s |
| 0:55–0:58 | rise | they push up in sequence, crouch, and spring back to standing |
| 0:58–1:12 | colour call-and-response | the red trio performs a phrase while black holds, then black answers; low stances, punches, kicks |
| 1:12–1:30 | partner exchanges | red and black pair up across colours: attack and block, one ducks or drops under a sweep or kick, the partner follows through; positions swap; crouching evasions |
| **1:38–1:45** | **fall 2** | another group fall: the pairs go down together, roll, and lie flat |
| 1:45–1:48 | rise | they come up into a line facing front |
| 1:48–1:54 | arms-wide hold | all six stand in a line facing the judges, arms extended straight out to the sides, then into stance: a clean group freeze |
| 1:54–2:00 | last unison phrase | deep horse and bow stances with punches, in sync; the final pose |
| 2:00–2:06 | close | they stand, salute, and walk off |

## Slot fills for a group-set shot (adapt to shots_wushu.py's slots)
- **copies:** 6 (3 + 3, alternating colour groups), in one line across the frame, then pairs across colours.
- **opening:** a still line at attention, then the salute (fist in palm), held for a beat.
- **unison phrase:** bow stance + straight punch → drop into the deep crouching stance (leg extended, arm sweeping low) → back up to bow stance → arms whip overhead into a pose. Sharp stops between moves.
- **kicks:** front snap kicks / slap kicks, staggered (one colour, then the other).
- **signature beat:** all six fall forward to the ground together and lie flat, perfectly still, then rise as one. This is the moment from the real set to keep.
- **half-vs-half:** colour groups trade phrases (one trio moves while the other holds), then cross-colour pairs attack and block, one ducking under a sweep while the partner follows through.
- **ending:** a line facing camera, arms straight out to the sides, then a deep stance, then the salute.
- **don'ts:** no weapons in the group set (it's barehand), no music-video dance moves, no contact landing. Her solo sword (jian) is a separate event.
