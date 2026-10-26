# The sync drop: the compulsory long fist, in unison (2026-10-26)

Jade, after the fight-choreography bake-off (`docs/video_model_bakeoff.md`: every model breaks two-body partner moves): "another idea: the
entire group does standard long fist, in sync. surely they have sufficient training data for that?", then "maybe we do the compulsory set?"

**The idea:** no body contact. Generate ONE clean solo Jade doing short passages of the compulsory changquan routine, and let the ENGINE
replicate her into the group: the six branch lanes are copies of the same take, in the real set's formations, each tinted in her lane colour.
Unison is exact by construction. Small per-copy time offsets (`dt`) make canon ripples where the music invites one. `?drop=sync`
(`engine/show/main.js`, drop block); takes from `tools/sd/shots_wushu_sync.py`.

## 1. Which compulsory set (research, with confidence)

Text sources only: YouTube is blocked here, and from this container WebFetch reached none of the pages, so the move names below come from
search-result extracts.

| set | when | standard in 2004? |
|---|---|---|
| **1st International Compulsory Changquan** (第一套国际武术竞赛套路 长拳) | made for the 1990 Asian Games; World Championships from 1991 | older; many US clubs still taught it |
| **2nd International Compulsory Changquan** (第二套国际武术竞赛套路 长拳) | IWUF commissioned it from the Chinese Wushu Association in Nov 1999 (one source says 2001) | **yes**: the 2004 Pan American Wushu Championships used "only the second compulsory routines" (Wikipedia, 2004 Pan Am article). Compulsories were dropped at Worlds in 2005 |
| 3rd set (第三套) | 2011–2013 (the IWUF's current Changquan.pdf). **Not** ~2003 | no |
| 初级长拳第三路 (elementary changquan no. 3) | a beginner/club routine | possible for club training, not competition |

**Pick: the 2nd International Compulsory Changquan. Confirmed by Jade (2026-10-26, review page: "2nd").** That rests on the 2004 international usage. No source
says what the 2004 Collegiates (8th CWT, Feb 21 2004, hosted by Stanford) required of group sets. **Flag for Jade: which compulsory did
you learn, the 1st or the 2nd set?** If it was the 1st set, the phrases need new move names; the engine plan stays the same.

### The 2nd set's opening, as listed (moves 1–14 medium-high confidence; 15–20 medium; 21–28 low-medium)
Source: a reposted 《武苑文摘》 "武术套路比赛动作名称" list (blog.sina.com.cn/s/blog_156ae3de10102vzfb.html and
blog.sina.com.cn/s/blog_4a3daacb0100ycsh.html, quoted the same way twice). Section breaks (段) aren't marked; a Bilibili course splits it in four.

| # | move | pinyin | English | used |
|---|---|---|---|---|
| 1 | 预备势 | yùbèi shì | ready stance | pre-roll of ws_open |
| 2 | 并步十字掌 | bìngbù shízì zhǎng | feet together, cross palms | **89.1** (the drop's impact) |
| 3 | 抡臂仆步拍掌 | lūn bì pūbù pāi zhǎng | arm circles, drop stance, slap palm | 89.3 circles, **90.1** pubu slap |
| 4 | 震脚砸拳 | zhènjiǎo zá quán | stamp, pound fist | 90.3, held |
| 5 | 腾空外摆莲 | téngkōng wàibǎi lián | jump outside-lotus kick | run-up 91, **take-off 92.3** (bass F#), slap 92.4 |
| 6 | 弓步盘肘 | gōngbù pán zhǒu | bow stance, coiling elbow | **lands on the 93 cut**, elbow on 93.1 |
| 7 | 弹腿压拳 | tántuǐ yā quán | snap kick, pressing fist | 93.3 |
| 8 | 单拍脚 | dān pāijiǎo | single slap kick | 94.1 |
| 9 | 垫步提膝横拳 | diànbù tíxī héng quán | shuffle, knee raise, horizontal punch | 94.3 shuffle, **95.1 balance**, held |
| 10 | 击步腾空飞脚 | jībù téngkōng fēijiǎo | hop step, flying front kick | hop 95.3, **take-off 96.1**, slap ~96.2, land 96.3 |
| 11 | 旋风脚劈叉 | xuànfēng jiǎo pǐchà | whirlwind kick into the splits | take-off 96.4, **splits on 97.1 (THE hit)**, bar 97 held still |
| 12 | 震脚砸拳 | zhènjiǎo zá quán | stamp, pound fist | rise 98.1, stamp 98.3 |
| 13 | 跳盖步冲拳 | tiào gàibù chōng quán | jumping cover step, punch | 99.1 (the cut) |
| 14 | 单拍脚 | dān pāijiǎo | single slap kick | 99.1 |
| 15–28 | 侧踹腿推掌 … 震脚砸拳 | | | **skipped** (12 bars hold 14 moves) |
| — | 收势 + 抱拳礼 | shōushì, bàoquán lǐ | closing posture, fist-palm salute | 99.3 close, **100.1 attention, 100.3 salute on the "ooh"** |

Sources disagree on one point: a Sohu piece puts one aerial per section (飞脚, 外摆莲, 旋风脚 into horse stance, 侧空翻), and a Zhihu answer
says there are versions with moves 9–11 in a different order. We follow the blog list. Runner-up (1st set): no reliable move list was
found. Baidu's "规定拳" 第一段 is the youth compulsory (少年规定拳), not the international 1st set.

## 2. Bar map (138 BPM, one bar 1.739 s; analysis_v2)
The drop is three rising 4-bar phrases (89–92, 93–96, 97–100): the bass climbs B → C# → D → E (→ F# on 92.3 / 96.3), so bar 4 is
airborne and lands on the next phrase downbeat (93.1, 97.1). The "ooh" enters at 173.08 (100.3), the salute's hold.

| cut (bar.beat) | take (6 s; 7 s for ws_xuanfeng; one bar pre-roll) | moves | formation | dt |
|---|---|---|---|---|
| 89 → 91 | ws_open (window B(88)) | 1–4 | two staggered rows | unison (the impact) |
| 91 → 93 | ws_lotus (B(90)) | 5, landing into 6 on the cut | one line | unison |
| 93 → 95 | ws_kicks (B(92)) | 6–9 | wedge, point empty | unison on 93.1, then a 1/8-beat ripple left → right from 93.25 |
| 95 → 96.3 | ws_feijiao (B(94)) | 9–10 | wedge | unison |
| 96.3 → 99 | ws_xuanfeng (bb(95,3)) | 11–13 | ring | unison into the splits (97.1); a 1/4-beat ripple around the ring on the rise (98) |
| 99 → 101 | ws_close (B(98)) | 14, closing posture, salute | the fold's V, point empty; **main (orange, untinted) steps into the point on 100.1** | unison salute on 100.3 |
| 101 | ch1_fold (unchanged) | | the V of seven, match cut | |

Formations are on the ground plane (`place([x, s])`: x is her centre on screen; a copy scaled `s` stands `s × .163` below the horizon, so a
copy further back is smaller and higher). The lanes, left to right: white, mint, rose | sky, gold, violet (warm and cool alternate). Each copy is tinted
`laneAmt .32` over the solo's orange bands; every copy has the solo's high ponytail (the group set's buns are not reproduced here).

## 3. Stills
- `ws_solo_front` (GPT Image, candidate b of 2): canon face v4, high ponytail, main's costume, the 1420 MHz patch on her LEFT upper arm,
  facing the camera at attention, the sun at the right. She filled ~80% of the frame height, so:
- **`ws_solo`** (the first frame of every take): a nano-banana "pull the camera back" edit. She fills ~45% of the height, centred; the sky
  above her (~21%) leaves room for the jumps; the horizon is level; her full reflection is below.
- **`ws_bg`**: the same frame with her removed (one edit), so the engine's world never shows the solo plate's figure hole. A 10 s locked
  take of it (`ws_bg_t51`) is the drop's world, fitted across 89–101.
- `ws_solo_34` (a 3/4 view, LEFT arm and patch toward the camera): made, but not used. The takes need one consistent start pose.

## 4. Takes and picks (Seedance 2.5; Vidu Q3 Pro on the two hardest phrases)
Every take was checked frame by frame: 6 fps sheets of the whole take, 12–24 fps full-res crops of every jump and landing, horizon and sun
trackers for camera drift, the feet line for size drift, the patch side, and planted-foot sliding. Tags: t51–53 round 1, t54–55 Vidu, t56–58
feijiao round 2, t59/t60 re-submits of relay failures, t61–65 round 3, t66–68 round 4. Takes and specs: `review/takes/ws_*`.

What the models did (all rounds):
- **Every take has one body, two arms and two legs, the patch on her LEFT arm, and the ponytail.** Nothing merges or detaches: a solo phrase
  is far easier for the model than the partner work in the bake-off.
- **Every jump floats.** Air time was 0.76–1.35 s, against a real 0.4–0.7 s, from both models, until round 3 asked for "about half a second
  in the air" (feijiao t61: 0.62 s). The EDL undoes the rest: `SYNC_KEY` keys take-off → landing at ×1.7–1.8, so the air reads real.
- **The timing drifts 0.3–0.9 s** from the second marks. `SYNC_KEY` keys each picked take on its measured beats (stretches ×1.0–1.35, plus
  the airborne keys above).
- **The camera:** "LOCKED OFF on a tripod" put a tripod in the empty set (`ws_bg_t51`). Vidu panned or zoomed in 3 of its 4 takes, and Seedance
  tilted in lotus t51/t52. Round 3 asks for "one continuous wide shot from a fixed position", and every round-3 camera then held (sun ±1 px).
- **The two hardest skills barely exist in the model's vocabulary.** For the jump outside-lotus kick (腾空外摆莲) it gave jumping front kicks
  and front crescents for three rounds; round 4 ("an upright jump, spins one full turn like a top … the leg swings from her LEFT … out to her
  RIGHT, like a fan opening outward") got it once (t68). For the whirlwind kick (旋风脚) it gives a knee jump facing the camera or an
  aerial flip, and lands in a straddle split, not the front splits (劈叉).
- **Vidu Q3 Pro** lost to Seedance on both hard phrases: lotus t54 is a tuck jump into a kneel, and t55 and xuanfeng t54/t55 move the camera.

| phrase | pick | keys (bar ← clip s) | notes |
|---|---|---|---|
| ws_open | **t84** (round 6, after Jade's note) `e475eb61aa` | 90 ← 3.83 (pubu), 90.75 ← 5.21 (fist into palm) | side-on, straight arms wheeling in vertical circles beside her body, one rising as the other falls, 1.3–3.6 (the cut opens mid-wheel on 89.1); pubu with the right arm held up (no slap); right arm back-up-over, feet together, pound on 90.4. Was t51 (a jumping-jack fling) |
| ws_lotus | **t68** (round 4) `26b3c2dd8d` | 92.5 ← 3.65 (take-off), 92.94 ← 5.00 (first foot down) | the real move: off both feet, one full upright turn (back to camera 3.75), the straight right leg sweeps OUTWARD left → across her face (peak 4.55) → right; no clear slap (palms at the chest); 1.35 s of air keyed ×1.76 → 0.77 s; lands on the take-off spot in a deep bow stance, elbow across. Alt: round-3 t61 (front-crescent, no turn) |
| ws_kicks | **t51** `c42416635a` | 93 ← 1.12 (strike), 94 ← 3.46 (slap kick top) | the strike reads as a forearm punch, not a coiling elbow; a ×1.35 squeeze over her frozen hold; the balance has T-arms |
| ws_feijiao | **t61** (round 3) `a5d7a031d8` | 95 ← 1.15 (punch), 96 ← 3.98 (take-off) | a real 0.62 s flying kick; the foot reaches head height (4.33–4.46) with no instep slap; lands 4.60/4.85. Alt t58 |
| ws_xuanfeng | **t72** (round 5, after Jade's note) `fc342602d4` | 96.62 ← 2.18 (take-off), 97 ← 3.35 (splits), 98.5 ← 6.0 (fist into palm) | an upright jump turning left ~270° (back to camera 3.1–3.25; off the left foot, no slap; 1.17 s of air keyed ×1.77); lands in FRONT-BACK splits side-on, left leg forward, arms out with standing palms, still 3.6–5.2 (bar 97); rises, right arm over, pound ~6.0 (no stamp, feet apart). Was t51 (scissor knee jump into a straddle split) |
| ws_close | **t53** `a2e5719f59` | 99.125 ← 1.68 (slap kick top), 100.5 ← 4.76 (fist meets palm) | RIGHT fist into LEFT palm, correct; the frame goes fully still from 5.08 (her figure is drawn over the moving ws_bg, so it reads as a hold) |
| ws_bg | **t61** `b590c5c067` | fitted 89 → 101 (×0.46, blended) | the empty set, a fixed camera, nothing in it |

Spend on this: **$56.25** at list prices (44 billed items: 3 GPT Image stills, 2 nano-banana edits, 39 video takes; 8 relay failures unbilled).

## 5. Engine, validation, default
- `engine/show/main.js` drop block: `SYNC_SHOTS`, `FORM`, `SYNC_CUTS`, `SYNC_PLAN`, `SYNC_KEY`, `syncCut()`. Each cut is a lattice shot with
  `figOff` (the plate's own figure is not drawn), six `copies` (`place([x, s])`, a lane tint of .32, and `dt` ripple functions), `bg` (the
  world from `ws_bg_t61`, fitted 89 → 101), and the take on `keyed()` with its `SYNC_KEY`. `engine/src/scenes/lattice.js` adds `bg` and a
  time-varying copy `dt`; a `dt` copy now follows the shot's keyed clip. `tools/edl_check.mjs` counts the bg clock and the `dt` copies on
  the keyed clip.
- **Default:** the sync drop is the DEFAULT once all seven `ws_*` takes are picked (`docs/picks_manual.json` lists them; the box's
  `picks.py` writes them after intake). Until then the default stays v4. `?drop=v4 | v5 | real` keep the other drops, and `?drop=real` without
  its plates plays the default.
- **Validation** (`node --check`, then `node tools/edl_check.mjs`): with the cloud picks for default, `drop=sync`, `drop=real`, `drop=v4`
  and `drop=v5`; with a scratch picks.json holding the seven real picks (real lengths) for the same five queries; with `--fake=ws_*` for
  default, `drop=sync` and `drop=real`; and with `--fake=real` alone and with the sync picks. All 18 runs: 0 exceptions, 0 bad args, 0 gaps,
  0 held clocks. With the sync picks the default plays the six sync cuts (89, 91, 93, 95, 96.3, 99) and `drop=v4` plays none. With the
  cloud picks the default is unchanged. `--rates`: the slowest ripple copy runs at 0.46× only while bar 97's splits hold still, so no copy
  runs backwards.
- **Previews** (`review/previews/wushu_sync/`, 7 index entries): each picked take raw at real speed from its audio window, with the full mix
  (0.2–0.4 MB each), and `sync_drop_formation_MOCK.mp4` (1.9 MB): **a mock, not a render**. `tools/preview_sync_mock.py` composites the picks
  six times with a mediapipe matte, the lane tints, the keys, the ripples and main stepping in, over the empty-set take. The glyph look is only
  on the box.

## 6. Open, for Jade
1. ~~Which compulsory set?~~ **The 2nd** (Jade, 2026-10-26).
2. Three moves are close, not exact. The whirlwind kick is a knee jump into a straddle split, not a 360° into the front splits (every
   prompt that asked for the turn got an aerial flip). The lotus and the flying kick have no hand-to-foot slap. A re-take round can go after
   them ("small hop, pivot one full turn on the spot, feet below the hips the whole time"), or the sync drop can live with them, since six
   copies in unison sell it.
3. Every copy wears the solo's high ponytail. The group set's space buns aren't reproduced: one take makes all six.
4. The lane tint is .32 over orange bands. On the box, check that the branch lanes read as their own colours (raise `laneAmt` if they still
   look orange).

## 7. Jade's review (2026-10-26) and round 5
Verdict, verbatim: **"this is the one. but: the technique on the wheely arm is incorrect. can that be corrected? (is the model building off of
memory or from searched references?)"** (paused at film t=168), and **"I landed in front-back splits, not side."** (t=171.5). Decisions
recorded on her page: compulsory set = **2nd**; her final-line position = **3 from the left** (`engine/show/real_ws.js` `ME = 3`, so in
`?drop=real` main is drawn from performer 3).

**Where the notes point.** By `SYNC_KEY`, t=168 is clip 3.75 of `ws_xuanfeng_t51`, the held splits, so she paused just after the
whirlwind take-off (96.3–97). Both notes are about that phrase. The opening's 抡臂 (move 3) is wrong too, so both phrases are re-taken.

**What the picks did wrong (from their frames):**
- `ws_xuanfeng_t51`: no whirlwind kick at all. Facing the camera, she jumps straight up with one knee and then the other (a scissor jump, clip
  1.6–2.4). Her arms flail at shoulder height instead of sweeping down and around to drive a turn. There is no turn and no slap. She lands
  2.63 in a **side (straddle) split**, facing the camera, arms out in a T with the palms up. Rising (4.8–5.8), the arms fling out and cross:
  no vertical wheel of the right arm before the 砸拳.
- `ws_open_t51` (moves 2–4): feet together, she crosses her arms, throws one arm up, then flings both out to the sides, like a jumping jack
  (clip 2.6–3.3). That is not a wheel: no vertical circle beside the body, no opposite-phase arms, no body turn into the pubu.

**The correct technique** (text sources only: no reachable page gave the 2nd set's own 动作说明, so these are the standard changquan
descriptions from textbooks and teaching articles):
- **抡臂 (lūn bì):** each STRAIGHT arm draws a vertical circle (立圆) beside the body, in the plane of the side of the body. The arm passes
  close to the ear going up and close to the hip going down (两臂贴着耳侧和胯侧绕动). The two arms move one after the other, half a circle
  apart, with the torso turning. The two textbook errors are circles that aren't vertical and no body turn. Sources:
  wushupeixunban.com/p_66778.html, blog.sina.com.cn/s/blog_9c3f62aa01011hlg.html, blog.sina.com.cn/s/blog_4e73293201014wb2.html.
  In 抡臂仆步拍掌, the last arm comes over the top and the palm slaps down beside the straight leg of the drop stance.
- **旋风脚 (xuànfēng jiǎo):**
  - Run-up: the left foot steps left, the left palm pushes forward and the right arm swings back. The right foot steps in, toes turned in.
  - Take-off: off the RIGHT foot, turning to the LEFT. The left leg swings up and back to the left. "两臂向下、向左后上方抡摆": both arms
    sweep down, then up and back to the left. That arm sweep drives the turn.
  - Slap: the LEFT palm meets the right sole in front of the face at about 270° of turn ("左手在面前迎击右脚掌"), and the 360° is completed
    before landing. The body stays upright.
  - Sources: blog.sina.com.cn/s/blog_bfbc24ed0101khwu.html, m.fx361.com/news/2009/0716/4152139.html, wushupeixunban.com/p_129468.html,
    tyxk.scnu.edu.cn (a PDF), flashmavi.com/learn/wushu-whirlwind-kick.
- **劈叉 / 竖叉 (front-back splits):** "两腿一齐前后分开落地，成竖叉". The LEFT leg is in front, back of the leg down, toes up; the RIGHT leg
  is behind. The torso is upright over the front leg, and both palms are out to the sides as standing palms (the 三路长拳 description; the
  arm position for the 2nd set is unconfirmed). Sources: zh.wikipedia 劈叉, baike 三路长拳, baike 竖叉.
- **震脚砸拳:** "右手向右后、向上抡起下砸，以拳背砸击左掌心作响，同时右腿屈膝提起，下跺震脚成并步半蹲". The right arm wheels back, up and
  over. The back of the fist hits the left palm (palm up in front of the belly) on the same instant as the right foot's stamp, ending feet
  together in a half squat. Sources: blog.sina.com.cn/s/blog_9ba571900101g1cx.html, sohu.com/a/130234986_540391.

**Round 5 prompts** (`tools/sd/shots_wushu_sync.py`, t71–74 of `ws_open` and `ws_xuanfeng`) write each of those as a body path with second
marks: which foot, which direction, where each arm goes, which hand meets which foot, and which leg ends forward. A shorter guard keeps
them under the 2000-character cap. The drop's hits stay: the splits land on 97.1 and the salute on 100.3.

**Jade's question: memory or searched references?** Memory. The video model works only from its training data plus our text prompt and the
first frame; it looks nothing up. Move names like 抡臂 or 旋风脚 steer it only loosely (four rounds of "whirlwind kick" gave knee jumps and
flips). What steers it is the body path in plain words, which is what round 5 does, or a **motion reference**: Seedance 2.5 takes
`reference_videos` (up to 3, as data URIs; the relay accepts `file:` refs), and the `?drop=real` work already writes such specs
(`dr_real_ref_<seg>`). A clip of the correct technique would help most for the whirlwind kick. Possible sources:
- **Best: Jade herself.** A few seconds of her own 抡臂 or whirlwind kick, filmed on a phone, front-on. She may send real footage of herself
  to models.
- The 2nd set's official teaching film (Bilibili BV1gk4y167R9, "第二套国际武术竞赛套路教学片", with full-routine and detailed-teaching parts;
  a Youku playlist by ly2003yl has the same). These are third-party footage: use them only if Jade is fine with sending them to a model, and
  never commit them.
- Not her team's competition video: never send that to a model.

**Round 5 (t71–74) and round 6 (t81–84), checked against the written technique:**
- **Open:** round 5's wheels were straight and in opposite phase, but crossed in front of her while she faced the camera. Round 6 had her
  turn side-on first: in all four takes the arms now circle in vertical planes beside her body. **Pick t84**: wheels 1.3–3.6, side-on, and
  a feet-together finish with the pound at 5.21. Left: her shoulders open a little at the horizontal phase, and no take slaps the palm
  beside the straight leg in the pubu (she holds the arm up instead).
- **Whirlwind:** round 5 got the two big points in one take. **t72** has an upright airborne turn (~270° to the left) and FRONT-BACK splits,
  side-on with the left leg forward. Round 6 split them apart: t81 does the splits with no jump, t83 jumps into a side split, t84 flips. So
  t72 stays. Left: it takes off from the left foot, the left palm never claps the sole, and the pound has no stamp with the feet together.
- What would close those gaps is a motion reference (below), not more wording: after six rounds the model follows the body path for
  big shapes (the plane of the arms, which leg goes forward) but not for small timed contacts (a palm meeting a sole).

Spend after round 6: this work **$80.30** in all (the rounds 5–6 re-takes $24.05; ledger total $609.89 / $1,000).
