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

**Pick: the 2nd International Compulsory Changquan, confidence medium (~60–65%).** That rests on the 2004 international usage. No source
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
