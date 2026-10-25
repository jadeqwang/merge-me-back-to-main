# Merge: drop re-choreography (wushu duilian, then a medal-grade group set)

Jade's note (2026-10-25): *"improve wushu group set choreography. The first wushu group set can be the pair-wise fight set, but the next one
should amp it up and be at least as good as the one I won a medal for."*

**The plan in one line.** Bars 89–92 are a **duilian** (pair-wise fight set). Bars 93–100 are a **barehand changquan group set** that changes
formation four times (staggered ranks → wedge → top-down ring → wedge). Its unison jumps land on the phrase downbeats, it has two canons
(ripples), and it ends with the **baoquan salute held on the "ooh"**, which match-cuts on the V formation into the existing fold at bar 101
(unchanged). Her **jian solo** stays as a one-bar insert at bar 95, where it hides a formation change. This needs 6 new Seedance shots and 4 new
plates: **≈ $18.70** with two takes each, or **≈ $21.50** with a third take of the two riskiest shots. Nothing was generated or spent.

Files in this scratch dir: `wushu/shots_wushu.py` (drop-in `tools/sd/shots_wushu.py`), `wushu/edl/edl_drop.diff` (applies cleanly to both
HEAD and the current working tree), and `wushu/frames/` (contact sheets I made for diagnosis; never commit them).

---

## 0. Jade's competition video (link from Jade, in the session chat): not reachable from this container

- The egress proxy refuses `www.youtube.com`, `i.ytimg.com` and `noembed.com` with **403 (policy)**. WebFetch can't resolve youtube.com.
  A web search for the video ID finds nothing. I didn't retry or work around the block.
- **So nothing below is taken from her routine.** The design comes from the competition rules and conventions in section 2.
  Each take has a **swap slot** (table below). A box/Remote-Control session or Jade can fill the slots from the video. Analysis only:
  never commit the video or its frames, and never send them to a model, because it shows her real teammates.
- What to log from the video, with timestamps:
  1. the opening formation and how the team enters;
  2. every formation change and how it travels (run in arcs, cross through, or tumble);
  3. each jump or aerial (which skill, unison or canon, which stance it lands in);
  4. any canon or ripple and its direction;
  5. the floor work (splits, kip-up, wulong jiaozhu);
  6. the held tableau and its levels;
  7. the closing salute;
  8. the team size (CWT group sets are 6 people) and any shouts.

| take | swap slot (replace with her team's equivalent) |
|---|---|
| dr_gs_ranks | opening formation + first unison hit + first canon |
| dr_gs_tornado | the team's signature unison jump and its landing stance |
| dr_gs_ring | the second formation + the travelling canon (or her team's floor/aerial sequence) |
| dr_gs_salute | their closing tableau (levels) + salute |

---

## 1. Diagnosis of the current drop (v4 film 150–225 s, raw takes from origin/main review/cloud/takes)

The EDL currently cuts every 2 bars: `[89 dr_set 0] [91 dr_set 2] [93 dr_duilian_mid 2] [95 dr_jian 0] [97 dr_duilian 1] [99 dr_duilian 3]
[101 fold] [103 forktree]`. One bar = 1.739 s.

| bars (song s) | take, clip s | what the Jades do (frames viewed) | problem |
|---|---|---|---|
| 89–90 (153.17–156.65) | dr_set_t1 0.0–3.5 | Seven Jades in **one flat line facing camera**. Bow-stance punch → mabu double punch (0–1.5). They stand up (2.0), then **front kicks at 2.5–3.5: mixed legs and heights**; some kick left, some right, two hardly kick. | The only kick is out of unison. The formation never changes. The MAIN slam covers bar 89. |
| 91–92 (156.65–160.12) | dr_set_t1 3.5–7.0 | A turn (4.0), then a **unison tuck jump** (4.5) landing in mabu at 5.0 (= 158.17, **0.22 s before** the bar-92 downbeat). After that, horse-stance punches in place. | The best moment misses the downbeat. A tuck jump isn't a wushu skill. **From 5.0 to 9.5 s the take just holds mabu.** |
| 93–94 (160.12–163.60) | dr_duilian_t1 3.5–7.0 | Copies scattered in depth: hops, one big side kick, a roll. It ends with **two copies standing, arms down, grinning at camera**. | You can't read the pairs and there's no strike/defence rhythm. It ends idle. |
| 95–96 (163.60–167.08) | dr_jian_t2 0.0–3.5 | Solo jian: she steps down from a balance, lunge thrust, low bow, sword wraps overhead. Fluid. | It's good, but a lone, slower figure in the middle of the drop dips the energy. The raw take holds a one-leg balance from 5.0 to 8.0 s (unused). |
| 97–98 (167.08–170.56) | dr_duilian_t2 1.7–5.2 | The pairs stay **locked in mirrored side bow stances with crossed wrists for about 1.5 bars**, then break into a scramble at 4.5. | Static. The "exchange" never happens. Crossed wrists is a pose, not a technique. |
| 99–100 (170.56–174.04) | dr_duilian_t2 5.2–8.7 | A messy kick flurry. At 6.0 **a ghost copy walks in and vanishes (6→5)**. Five copies line up holding a **two-handed "X" gesture, not the baoquan** (fist in palm). | 5 copies, not 7. Wrong salute. **Two orange copies**, and the centre copy is mint, so main isn't centred. About 1 bar static. |
| 101–102 | ch1_fold (reach) | V of seven steps in behind the centre copy. | Keep. Note the V's lane order for the match cut. |

Patterns across the takes:
1. Seedance fills the back half of a long take with a held pose: dr_set holds mabu (5–9.5 s) and dr_jian holds a balance (5–8 s). The old
   dr_wushu did the same, holding a horse stance after about 3 s.
2. One prompt that lists a whole routine gets a generic average of it.
3. Whenever formations change inside a take, copies get lost.
4. The order is set → duilian → solo → duilian. Jade asked for duilian first, then a bigger group set.

**Fixes built into the redesign:**
- Short takes (5–6 s) with a 1-bar pre-roll, so only the first ~2 bars of motion are used.
- One action phrase per take, with second marks for the hits.
- "Exactly seven copies stay in frame…".
- Formation changes happen on cuts, not inside takes.
- The exact salute is spelled out.
- Lane colours are pinned per position.

---

## 2. Research notes (short)

- **Group set (jiti, 集体项目):**
  - IWUF requires at least 6 athletes and runs 3–4 min.
  - **Collegiate Wushu Tournament (CWT):** all **6 team members**, 1–3 min, timed *"from the team's first coordinated movement until the final
    salute"*. The group-set score counts double in the team competition.
  - Ending on the salute is the real format.
- **Judging:** there is no difficulty (C) panel for jiti. The 10 points split into **quality of movements (5)**, which is deductions for stance,
  balance, extra steps and falls, and **overall performance (5)**, which covers *power, coordination, rhythm, choreography, style, music*. A
  routine inspector checks choreography, structure and layout.
  In practice the deciding factors are:
  - **unison** (整齐划一: every stamp, landing and head snap in one frame);
  - **formation design and transitions** (队形变化: many, clear, novel);
  - **layering** (层次: low/mid/high levels in a tableau);
  - **contrast** (动静 still/explosive, 快慢 fast/slow, 刚柔 hard/soft);
  - **spirit** (精神: eyes, shouts, liangxiang 亮相 snaps).
- **Formations that read well:** line; two staggered ranks (品字/梅花); wedge or arrowhead (人字/雁阵); diagonal; circle (圆阵, facing in or out);
  cross; burst and converge (聚散). Teams change formation by running in arcs, crossing through gaps, or travelling with aerials.
- **Timing devices:**
  - **Canon or ripple** (依次/波浪): the same move passes down the line a half-beat apart.
  - **Mirror** (对称): left and right halves move in reverse.
  - **The unison hit**: everyone lands a jump in the same frame. This is the money shot.
- **Changquan vocabulary:**
  - Stances: gongbu (bow), mabu (horse), pubu (drop), xubu (empty), xiebu (rest).
  - Hand forms: fist, palm, hook.
  - Kicks: snap kick (tantui), slap kicks, crescent kick.
  - Jumps: **tengkong feijiao** (jump front slap kick), **xuanfeng jiao** (tornado; 360° → land in **mabu** is the standard combination, ≤ 4
    run-up steps; the rules deduct when the slapped foot is below shoulder height), **tengkong bailian** (lotus), **xuanzi** (butterfly;
    deduction when the torso is ≥ 45°), **cekongfan** (aerial).
  - Floor and balance: diecha (jump into split), kip-up, **tixi** knee-raise balance, **zhenjiao** stamp, plus fajing shouts.
- **Duilian (对练):** 2–3 performers in a choreographed fight, 40 s–2 min, judged on *realistic attack and defence, strict coordination, timing
  and distance, compact structure*. Typical material: strike → block → counter chains on the rhythm, sweeps that the partner jumps, flying
  kicks that the partner ducks or rolls under, throws and breakfalls, and a mirrored freeze or salute at the end.
- **How duilian differs from the group set:** duilian is a *fight* between partners whose timing is call-and-response. A group set is a
  *display*: unison and canon in formation, facing the judges, with no opponent.

Sources:
- [CWT 2019 rules](http://collegiatewushu.org/tournament/rules/2019collegiaterules.pdf)
- [16th CWT rules](http://collegiatewushu.org/tournament/rules/16thcollegiaterules.pdf)
- [IWUF Taolu rules 2019 excerpt](https://iwuf.org/wp-content/uploads/2020/03/IWUF-Wushu-Taolu-Competition-Rules-Judging-Methods-Excerpt-2019.pdf)
- [IWUF Taolu rules 2024](https://www.iwuf.org/xhimg/soft/240912/WUSHU-TAOLU-COMPETITION-RULES-AND-JUDGING-METHODS-2024.pdf)
- [IWUF judges course 2023](https://www.iwuf.org/wp-content/uploads/2023/04/TAOLU-RULES-EN-CN-1.pdf)
- [IWUF Taolu overview](https://iwuf.org/en/sport-wushu/competitive-wushu/taolu/)
- [JIAYO rules tables 2019](https://www.jiayo.com/wp-content/uploads/2020/02/JIAYO_Wushu_Taolu_Competition_Rules_Tables_2019.pdf)
- [IWA tornado/butterfly tutorial](https://internationalwushuacademy.com/2019/02/21/wushu-tutorial-wushunandu-technique-%E6%97%8B%E5%AD%90%E8%BD%AC%E4%BD%93-xuan-zi-zhuan-ti-%E6%97%8B%E9%A3%8E%E8%84%9A-xuanfeng-jiao/)

The PDFs themselves are blocked by the proxy, so these notes rest on search-result extracts plus general knowledge.

---

## 3. Music map of the drop (analysis_v2 + my band/chroma analysis of review/cloud/audio/Merge_320k.mp3)

- 138 BPM; one bar = 1.739 s; one beat = 0.435 s. Four-on-the-floor kick on every beat, snare on 2 and 4. Energy is flat (≈ −14 dB) from 89 to
  103, so the **harmony gives the shape**.
- Bars 89–100 are **three rising 4-bar phrases**. The bass climbs **B → C# → D → E (→ F# on beat 3 of the 4th bar)**, then falls back to B on
  the next phrase downbeat (bar self-similarity 0.98–0.99 between 89/93/97, 90/94/98 and 91/95/99).
- Bar 100 lifts to **G/A on beat 3**, and **the wordless "ooh" enters at 173.08** (bar 100 beat 2.8). Bar 101 is a new **A** chord (the fold),
  103–104 is **E**, and a 16th-note snare fill runs into Verse 2 at 180.99.
- **The climb tells the choreography what to do:** bar 1 low, bar 2 mid, bar 3 high, bar 4 airborne, landing on the next phrase downbeat.
  Bar 101 belongs to the fold, so the big group landing goes on **97**. The **"ooh" entry is the hold** (there is no musical stop before 104).

| bar | t (s) | harmony | beat 3 / 4 | role in the new drop |
|---|---|---|---|---|
| 89 | 153.167 | B (DROP IMPACT, 4.4× median) | 154.036 / 154.471 | duilian: three pairs explode (MAIN slam) |
| 90 | 154.906 | C# | 155.776 / 156.210 | a strike on every beat; high kick ducked ~90.3 |
| 91 | 156.645 | D | 157.514 / 157.949 | close pair: sweep (91.1), jump over (91.2) |
| 92 | 158.384 | E → F# on b3 | 159.253 / 159.688 | flying kick at its peak on 92.1; mirrored freeze on 92.3 |
| 93 | 160.123 | **B (phrase landing)** | 160.993 / 161.427 | group set: **unison stamp into mabu + double punch**; ripple from 93.3 |
| 94 | 161.862 | B/C# | 162.731 / 163.166 | ripple completes; level line of knee-raise balances |
| 95 | 163.601 | D | 164.471 / 164.905 | **jian solo** (1 bar): step down into the lunge thrust |
| 96 | 165.340 | E → F# on b3 | 166.209 / **166.644** | wedge run-up; **unison take-off on beat 4** |
| 97 | **167.079** | **B (phrase landing)** | 167.949 / 168.383 | **all seven land the tornado kick in mabu: THE hit**; hold; head snap 97.3 |
| 98 | 168.819 | C# | 169.688 / 170.123 | top-down ring: butterfly-kick wave clockwise |
| 99 | 170.558 | D | **171.428** / 171.862 | **pubu "flower" on 99.3**, held |
| 100 | 172.297 | E → G/A on b3; **"ooh" 173.08** | **173.166** / 173.601 | land the tableau on 100.1; **baoquan salute on 100.3, held** |
| 101 | 174.036 | A | | fold (unchanged), ALL BRANCHES MERGED |
| 103–104 | 177.514 | E; 16th fill 179.68 | | forktree (unchanged); its colour wheel rhymes with the ring |

---

## 4. New structure (bars 89–100; fold and forktree unchanged)

Lanes and hair are **fixed across all plates**:

| lane | hair |
|---|---|
| orange (main, canon face) | high ponytail |
| rose, sky | two space buns |
| mint, gold | high ponytails |
| white, violet | two space buns |

In the wedge this alternates buns/ponytail across the line, and it matches Jade's decision 2 ("mix of high ponytails and space buns").

```
DUILIAN 89–92 (existing dr_duilian still)       RANKS 93–94                         WEDGE 96–97, 100 (= the fold V, L→R)
      mint ⟷ gold     rose ⟷ sky               white  mint  gold  violet  (back)      white                    violet
                                                   rose  ORANGE  sky       (front)         mint            gold
        ORANGE  ⟷  violet  (front pair)                                                         rose    sky
                [cam]                                     [cam]                                   ORANGE
                                                                                                   [cam]
RING 98–99 (camera straight down; clockwise from 12 = the bar-103 colour wheel)
              gold
      violet         mint
    white              sky
         ORANGE    rose
```

| cut (bars) | take | choreography, by count | formation / camera |
|---|---|---|---|
| **89–90** | `dr_dl_wide` (new take, existing still) | Guard held through the pre-roll. **89.1 (drop):** three pairs explode: lunging bow-stance punch vs rising forearm block. Then one strike per beat: palm strike parried and countered, snap kick checked with a knee, **high spinning kick ducked (~90.3)**. | pairs in depth; low camera pushing in between the front pair; MAIN slam over 89 |
| **91–92** | `dr_dl_close` (new) | **91.1** orange's low front sweep through the water; **91.2** violet jumps it (tuck); **92.1** violet's **tengkong feijiao** at its peak, orange leans back and blocks; **92.3** both spring into mirrored gongbu, freeze (liangxiang), grin. | side-on two-shot, tracking |
| **93–94** | `dr_gs_ranks` (new) | **93.1 unison zhenjiao stamp → deep mabu + double punch** (flash). **93.3–94.2 canon:** a knee-raise palm-flash (tixi liangzhang) ripples left → right every half-beat. **94.2–4** all seven hold the balance, level. | two staggered ranks, 3 + 4; low frontal push-in |
| **95** | `dr_jian_t2` 0–1.74 (existing) | Her jian solo: steps down from the balance into the lunge thrust. **Hides ranks → wedge.** | solo, sun right |
| **96–97** | `dr_gs_tornado` (new) | 96.1–3 two turning run-up steps, arms swing up; **96.4 unison take-off: xuanfeng jiao 360°** (slap above the head); **97.1 all seven land in mabu with a stamp, seven water columns** (flash); hold one beat; **97.3** heads snap to camera. | wedge (arrowhead at camera); low, tilt up, hard stop |
| **98–99** | `dr_gs_ring` (new) | **98.1 canon: butterfly kicks (xuanzi) go once around the ring clockwise**, starting at orange, one every half-beat; **99.3 all drop into pubu**, legs radiating outward like petals; hold. | ring facing out, **camera straight down**, rotating clockwise |
| **100** | `dr_gs_salute` (new) | (pre-roll: unison tengkong feijiao) **100.1** land the closing tableau at **three heights**: point in pubu, flanking pair in mabu, back four in knee-raise balance. **100.3 (on the "ooh")** rise, feet together, **baoquan salute** (right fist into left palm, arms rounded), held. | wedge = the fold's V → **match cut** at 101 |
| 101–102 | fold (unchanged) | | |

Against the medal bar, the routine has:
- **4 formations in 8 bars**, plus the pairs;
- **2 canons** (a line ripple and a ring wave);
- **3 unison hits** (the 93 stamp, the 97 tornado landing, the 100 tableau);
- **3 jump skills** (feijiao, xuanfeng jiao, xuanzi);
- **levels** (the pubu flower; a low/mid/high tableau);
- **a held pose + salute**, ending the set the way the CWT clock does.

That is denser than a real 1–3 min set because each phrase is its highlight reel.

---

## 5. Seedance shots (drop-in `tools/sd/shots_wushu.py`; full file at `wushu/shots_wushu.py`)

Every take is made against the drop instrumental, with its **audio window starting one bar before its cut** (EDL `at(shot, 1)` / `pin`). The
model gets a bar to start moving, and we use clip ≈ 1.74 s onward. batch.py adds `PIN` in front and `GUARD_GROUP` after each prompt. Checked:
the keys don't collide with batch.py/shots_*.py.

```python
I2 = "analysis_v2/stems/instrumental.wav"
MUTE_G = " Their mouths stay closed; nobody sings or speaks."
SEVEN = " Exactly seven copies stay in frame for the whole shot; nobody leaves, merges, splits or disappears."
SAFE = " Every strike is controlled and stops just short; nothing lands and nobody is hurt; they are partners showing a rehearsed set."
SHOTS = {
 "dr_dl_wide": dict(plate="media/plates/drop/dr_duilian.png", dur=6, group=True, v2=True, audio=(I2, 151.428, 6),   # B(88); cut at 89 = clip 1.739
   act="Wushu duilian, a rehearsed sparring set performed as a show, pair against pair across the wet mirror salt flat: the orange copy and the violet copy in front, the other pairs behind them. For the first moment every pair holds its guard, coiled and still. On the big hit of the reference audio, about 1.7 seconds in, every pair explodes into a fast exchange with one strike on every beat: a lunging bow-stance punch met by a rising forearm block, a palm strike parried and countered, a low snap kick checked with a raised knee, then a high spinning kick that the partner ducks under. The front pair is the clearest; the pairs behind trade the same rhythm. Sharp, fast and powerful, focused faces, hair whipping, water spraying from every step. Low camera pushing slowly in between the two front fighters." + SAFE + " Every copy stays in frame for the whole shot; nobody leaves, merges or disappears." + MUTE_G),
 "dr_dl_close": dict(plate="media/plates/drop/dr_dl_close.png", dur=6, group=True, v2=True, audio=(I2, 154.906, 6),  # B(90); cut at 91
   act="The orange copy and the violet copy finish their sparring set with a sweep and a flying kick. For the first moment they circle each other in guard. On the hit of the reference audio, about 1.7 seconds in, the orange copy drops into a deep low stance and sweeps her straight leg in a full circle along the water, throwing an arc of spray; the violet copy jumps straight up and tucks her knees over the sweep, lands, and springs straight into a flying front kick, her right foot snapping up head-high and slapped by her right hand at the top of the jump about 3.5 seconds in, aimed just past the orange copy, who leans back under it and blocks with both forearms. As the violet copy lands, both spring apart into mirrored bow stances facing each other, fists up, and freeze, then grin at each other. Low side-on camera tracking with them, water flying." + SAFE + " The two in front stay the only fighters in focus; the pairs behind stay small and soft." + MUTE_G),
 "dr_gs_ranks": dict(plate="media/plates/drop/dr_gs_ranks.png", dur=6, group=True, v2=True, audio=(I2, 158.384, 6),  # B(92); cut at 93
   act="A wushu team's barehand changquan group set at nationals. The seven copies stand in two staggered ranks, feet together and fists chambered at the hips, absolutely still, eyes on the camera. On the big hit of the reference audio, about 1.7 seconds in, all seven stamp at the same instant and drop into a deep horse stance with a double punch straight forward, seven bursts of water in the same frame. Then a ripple runs across the team from the copy on the far left to the copy on the far right, one copy every half beat: each in turn springs up onto her left leg, right knee high, right palm flashed open above her head, head snapping to the camera, until all seven hold the same knee-raise pose together, perfectly still and level. Crisp, powerful, exactly in unison. Low frontal camera, slow push in." + SEVEN + MUTE_G),
 "dr_gs_tornado": dict(plate="media/plates/drop/dr_gs_wedge.png", dur=6, group=True, v2=True, audio=(I2, 163.601, 6),  # B(95); cut at 96, landing = bar 97
   act="The seven copies, in a wedge pointing at the camera with the orange copy at the point, land one synchronized tornado kick together on the big hit. For the first moment they bounce lightly in guard. About 1.7 seconds in, all seven take two quick turning run-up steps and swing both arms up; about 3 seconds in they all leap at the same instant and spin a full turn in the air, the right leg sweeping up in a crescent kick slapped by the left hand above head height; about 3.5 seconds in, exactly on the hit of the reference audio, all seven land together in a deep horse stance with a hard stamp, fists chambered, seven columns of water exploding. They hold the landing dead still for a beat, then snap their heads to the camera together. Competition grade, perfectly in unison. Low wide camera, centred, tilting up with the jump and stopping hard on the landing." + SEVEN + MUTE_G),
 "dr_gs_ring": dict(plate="media/plates/drop/dr_gs_ring.png", dur=6, group=True, v2=True, audio=(I2, 167.079, 6),  # B(97); cut at 98
   act="Seen from straight above, the seven copies stand in a circle on the mirror water, evenly spaced and facing outward. About 1.7 seconds in, a wave of butterfly kicks travels around the circle: starting with the orange copy and going clockwise, one copy every half beat launches a butterfly kick, body flat and horizontal, arms and legs scissoring through a spinning jump, and lands, so the spin travels once around the ring like a turning wheel. About 4.3 seconds in, all seven drop together into a low drop stance facing outward, one leg stretched straight out along the water away from the centre, like the petals of a flower opening, and hold perfectly still. Camera straight overhead, rotating slowly clockwise and rising." + SEVEN + MUTE_G),
 "dr_gs_salute": dict(plate="media/plates/drop/dr_gs_wedge.png", dur=5, group=True, v2=True, audio=(I2, 170.558, 5),  # B(99); cut at 100
   act="The seven copies, in a wedge pointing at the camera with the orange copy at the point, close their group set. All seven leap together into a flying front kick, right foot slapped head-high at the top, and land about 1.7 seconds in, on the hit of the reference audio, in the closing pose at three heights like a staircase: the orange copy at the point low in a deep drop stance, the two beside her in a horse stance, the four behind standing tall on one leg in a knee-raise balance. They hold it still. About 2.6 seconds in, as the long sustained choir note begins in the reference audio, all seven rise together, bring their feet together and give the wushu salute: right fist pressed into the open left palm in front of the chest, arms rounded, chins up, proud small smiles at the camera, and hold it perfectly still to the end." + SEVEN + MUTE_G),
}
```

| shot | start still | dur | used clip (s) | pick for |
|---|---|---|---|---|
| dr_dl_wide | **existing** `media/plates/drop/dr_duilian.png` (patch-fixed; same first frame as dr_duilian_t1/t2) | 6 s | 1.74–5.22 | the exchange starts on the drop; strikes on beats; nobody vanishes |
| dr_dl_close | new plate `dr_dl_close` | 6 s | 1.74–5.22 | sweep + jump read cleanly; kick peak near 3.5 s |
| dr_gs_ranks | new plate `dr_gs_ranks` | 6 s | 1.74–5.22 | unison stamp frame (log its clip time for `pin`); the ripple travels in order |
| dr_gs_tornado | new plate `dr_gs_wedge` | 6 s | 1.74–5.22 | **all 7 land in one frame** (log it); ≥ 360° spin; mabu landing |
| dr_gs_ring | new plate `dr_gs_ring` | 6 s | 1.74–5.22 | wave reads as rotation; pubu flower; 7 bodies |
| dr_gs_salute | new plate `dr_gs_wedge` | 5 s | 1.74–3.48 | tableau landing ≈ 1.74; **right fist in left palm**; 7 in the V |

Fallbacks if a shot fails:
- **Ring:** cut 98–99 to a second tornado take (`at('dr_gs_tornado', 3)`) or to dr_set_t1's unison tuck jump (`at('dr_set', 2)` at bar 98).
- **Salute:** the old 5-copy line, `at('dr_duilian', 4)` at bar 100 (known flaws).
- **Ranks:** dr_set_t1's opening (`at('dr_set', 0)` at 93).
- If the canon prompts come out as all-at-once, the alternative skill is "aerial cartwheels (cekongfan) one after another".

---

## 6. Plates (4 new, made the way the existing drop plates were)

Use GPT Image 2.5 via `tools/plates/gpt_plate.py OUT_STEM PROMPT_FILE --refs=… --n=2`, crop 1536×1024 → 1536×864, pick one, copy it to
`media/plates/drop/<id>.png`. Then run `tools/plates/fix_patch.py` and **pin each lane colour in NOTES**, because repairs drift to orange.

Refs (3): `media/plates/drop/dr_set.png` (world, costume, hair mix), `media/style/r6/canon_face_front.png`, and
`media/style/r7/turn_gpt_patch.png`. For dr_gs_wedge, use `media/plates/face_v4/ch1_formation.png` in place of the canon face, to get the V
geometry and lane order.

Prompt = gen_plates STYLE line + the prompt + tail (plates.json style):

```json
[
 {
  "id": "dr_dl_close",
  "prompt": "Full sunrise on the wet mirror salt flat, the same world, light and outfits as the reference group plate: a low, side-on, medium-wide action shot of two copies of the woman squaring off in a wushu sparring set, about two metres apart, both full-body with their sneakers in the water. On the left the main copy: ORANGE jacket bands, orange cargo straps and orange headphones, black hair in a high ponytail whipping in the wind. On the right her sparring partner: VIOLET bands, violet straps and violet headphones, black hair in two space buns. Both crouch in a low bow-stance guard, lead hand open, rear fist chambered at the hip, eyes locked, fierce, a hint of a grin. Behind them, small and soft-focus, two more pairs spar on the water (rose pink against sky blue, mint green against golden yellow). The sun is a blazing disc on the horizon between the two fighters, lens flare, fine spray at their feet, long reflections. Dynamic AAA game-cinematic framing.",
  "no_canon_text": true,
  "tail": "Same face and outfit for both as the reference; each wears the round white 1420 MHz patch on her LEFT upper sleeve. No other text."
 },
 {
  "id": "dr_gs_ranks",
  "prompt": "Full sunrise on the wet mirror salt flat: a wushu team of seven copies of the woman at the start of their barehand changquan group set, standing in two staggered ranks facing the camera. Front rank of three: the main copy in the centre (ORANGE bands, straps and headphones, high ponytail), ROSE PINK on her left and SKY BLUE on her right (both with two space buns). Back rank of four, each standing in a gap behind the front rank, from left to right: WHITE (two space buns), MINT GREEN (high ponytail), GOLDEN YELLOW (high ponytail), VIOLET (two space buns). All seven stand with feet together, fists chambered at the hips, backs straight, chins up, the same fierce focus; everyone full-body with sneakers and reflections visible, nobody hidden behind anyone. Each copy's jacket bands, cargo straps and headphone cups are her own colour. Low wide frontal camera; the sun a blazing disc on the horizon behind the centre copy, lens flare, long reflections in the water.",
  "no_canon_text": true,
  "tail": "Same face and outfit for all of them as the reference; every copy has the round white 1420 MHz patch on her LEFT sleeve. No other text."
 },
 {
  "id": "dr_gs_wedge",
  "prompt": "Full sunrise on the wet mirror salt flat: seven copies of the woman in a tight wedge, an arrowhead pointing at the camera, in the middle of their wushu group set. The main copy at the point nearest the camera (ORANGE bands, straps and headphones, high ponytail); then pairs fanning back on each side: ROSE PINK on the left and SKY BLUE on the right (two space buns), MINT GREEN on the left and GOLDEN YELLOW on the right (high ponytails), WHITE at the back left and VIOLET at the back right (two space buns). Left to right across the frame: white, mint, rose, orange, sky, gold, violet, the same order as the V-formation reference. All seven crouch in the same ready guard, weight low, fists up, poised to spring, hair whipping in the wind; everyone full-body and clearly separated. Low wide-angle camera, the sun a blazing disc on the horizon just above the point copy's shoulder, lens flare, spray at their feet.",
  "no_canon_text": true,
  "tail": "Same face and outfit for all of them as the reference; every copy has the round white 1420 MHz patch on her LEFT sleeve. No other text."
 },
 {
  "id": "dr_gs_ring",
  "prompt": "Seen from straight above, a top-down drone shot at full sunrise: seven copies of the woman stand evenly spaced in a circle about six metres across on the wet mirror salt flat, all facing outward, feet together, fists chambered at the hips. Clockwise from the top of the frame: GOLDEN YELLOW, MINT GREEN, SKY BLUE, ROSE PINK, ORANGE (the main copy, at the bottom of the frame), WHITE, VIOLET, like a colour wheel. From above, the coloured bands across their shoulders and their coloured headphones read clearly, and the tops of their heads show the mix: high ponytails (gold, mint, orange) and two space buns (sky, rose, white, violet). The mirror water reflects a pink-and-gold sky; low sunlight rakes in from the bottom edge and every copy casts a long parallel shadow up the frame; the circle fills the centre of the frame with clear water all around it.",
  "no_canon_text": true,
  "tail": "Same outfit for all of them as the reference. No other text."
 }
]
```

---

## 7. EDL change (`engine/show/main.js`, drop block; full patch at `wushu/edl/edl_drop.diff`; `node` syntax check OK)

Before applying it, add the picks: `docs/picks_manual.json` needs `"dr_dl_wide"`, `"dr_dl_close"`, `"dr_gs_ranks"`, `"dr_gs_tornado"`,
`"dr_gs_ring"`, `"dr_gs_salute"` → `<take>` (then run picks.py). Without them, `pk()` falls back to a non-existent `still_*` plate. After
intake, replace the planned `clipT` in each `pin()` with the measured stamp/landing frame (the same idea as the lip-sync lags; keep it within
±0.15 s of the plan).

```diff
@@ drop block @@
     if (t < D0 + .9) { const f = Math.exp(-(t - D0) * 5); g.fillStyle = `rgba(255,250,240,${f})`; g.fillRect(0, 0, 1920, 1080); }
+    for (const [hb, k] of [[93, .3], [97, .5]]) { const a = t - B(hb);   // the group set's unison landings (phrase downbeats): a smaller white hit
+      if (a >= 0 && a < .6) { g.fillStyle = `rgba(255,250,240,${k * Math.exp(-a * 7)})`; g.fillRect(0, 0, 1920, 1080); } }
   };
-  // Jade 2026-10-24: wushu, not K-pop. Her collegiate team's changquan group set (bar 89), a half-vs-half duilian exchange, her jian solo
-  // (bar 95), the duilian closing into the salute line, then the fold. The wushu takes were made against this drop's own instrumental
-  // (tools/sd/shots_drop.py, v2 windows), so a cut's clip time = its bar offset from the take's window: whole-bar shifts stay on the beat.
+  // Jade 2026-10-25: duilian first, then a group set "at least as good as the one I won a medal for". The drop is three rising 4-bar phrases
+  // (bass B-C#-D-E/F#), so each phrase climbs to a jump that lands on the next phrase downbeat (93, 97; 101 is the fold). Duilian 89-92
+  // (three pairs clash on the drop; the front pair's sweep / flying kick / mirrored freeze), group set 93-100: staggered ranks stamp into mabu +
+  // knee-raise ripple (93), her jian solo hides the change to the wedge (95), unison tornado kick landing on 97, top-down ring with a
+  // butterfly-kick wave and the pubu flower (98), closing tableau + baoquan salute on the "ooh" (100 beat 3), match cut on the V into the fold.
+  // Takes: tools/sd/shots_wushu.py, made against this drop's instrumental with one bar of pre-roll (window = cut bar - 1, so at(shot, 1)).
   const BAR = B(90) - B(89), at = (shot, bars) => ({ plate: pk(shot, 0).plate, s0: (b0) => B(b0) - bars * BAR });
-  const cuts = [  // [bar, plate, s0(b0) = song time of the clip's frame 0, sun x,y]
-    [89, at('dr_set', 0), [700, 230]], [91, at('dr_set', 2), [700, 230]], [93, at('dr_duilian_mid', 2), [960, 160]],
-    [95, at('dr_jian', 0), [1500, 470]], [97, at('dr_duilian', 1), [960, 160]], [99, at('dr_duilian', 3), [960, 160]],
+  // pin(shot, clipT, bar): the take's key frame (its stamp / landing at clip time clipT, read off the intake strip) lands on bar `bar`'s downbeat
+  const pin = (shot, clipT, bar) => ({ plate: pk(shot, 0).plate, s0: () => B(bar) - clipT });
+  const cuts = [  // [bar, plate, s0(b0) = song time of the clip's frame 0, sun x,y]; each cut runs to the next cut's bar
+    [89, at('dr_dl_wide', 1), [960, 160]],                 // duilian: three pairs clash on the drop impact
+    [91, at('dr_dl_close', 1), [960, 330]],                // duilian close: sweep, leap, flying kick (92.1), mirrored freeze
+    [93, pin('dr_gs_ranks', BAR, 93), [960, 330]],         // group set: unison stamp into mabu, knee-raise ripple L→R
+    [95, at('dr_jian', 0), [1500, 470]],                   // her jian solo, 1 bar (hides ranks → wedge)
+    [96, pin('dr_gs_tornado', 2 * BAR, 97), [1040, 330]],  // wedge: run-up, unison tornado kick, lands on the bar-97 downbeat
+    [98, at('dr_gs_ring', 1), [960, 1180]],                // top-down ring: butterfly-kick wave, pubu flower on 99.3 (sun below frame)
+    [100, pin('dr_gs_salute', BAR, 100), [1040, 330]],     // wedge: land the tableau on 100, baoquan on the "ooh" (100 beat 3)
     [101, { plate: pk(`ch1_fold_${FOLD}`, 0).plate, s0: (b0) => B(b0) - .2 }, [960, 430]]];
+  const FOLD_I = cuts.length - 1;
   cuts.forEach(([b0, { plate, s0 }, sun], i) => {
-    const t0 = B(b0), t1 = B(b0 + 2);
+    const t0 = B(b0), t1 = B(i < FOLD_I ? cuts[i + 1][0] : b0 + 2);
 ...
-        if (i === 6) ty.ledHook([{ w: 'ALL', start: B(101) }, …
+        if (i === FOLD_I) ty.ledHook([{ w: 'ALL', start: B(101) }, …
```

The sun x,y values for the new plates are placeholders. Re-place them on the picked stills, as was done for the current cuts. The fold cut
(bar 101, `s0 = B(101) − .2`), the MAIN slam, ALL BRANCHES MERGED and the forktree are untouched.

---

## 8. Cost and run order (box / Remote Control; the cloud can't intake or render)

| item | unit | qty | est. |
|---|---|---|---|
| plates, GPT Image 2.5 (2 candidates each) | ≈ $0.25 | 4 × 2 | $2.01 |
| sleeve-patch fix, nano-banana-pro | ≈ $0.134 | 4 | $0.54 |
| Seedance 2.5 720p, 2 takes each: 5 × 6 s + 1 × 5 s = 35 s per set | $0.2312/s | 70 s | $16.18 |
| **base total** | | | **≈ $18.72** |
| optional 3rd take of dr_gs_tornado + dr_gs_ring | $0.2312/s | 12 s | $2.77 |
| **with extras** | | | **≈ $21.49** |

Spend is now $284 per `tools/gen/spend.py` in this checkout (CLOUD_HANDOFF says ≈ $300). After this it would be about $306–322 of the $600 cap.

Run order:
1. Generate the 4 plates, fix the patches, pick.
2. Copy `wushu/shots_wushu.py` → `tools/sd/shots_wushu.py`.
3. Run `$PY tools/sd/batch.py dr_dl_wide dr_dl_close dr_gs_ranks dr_gs_tornado dr_gs_ring dr_gs_salute --takes=2 --dry`, then submit. Optional:
   `dr_gs_tornado dr_gs_ring --takes=1 --t0=3`.
4. `gen.py wait` → `intake.py` (one at a time) → picks_manual.json → `picks.py`.
5. Log each take's stamp/landing clip time into `pin()`, apply the EDL diff, and render 150–182 s.
6. Commit and push the ledger, and add a "needs intake/render" note to RESUME.md if the takes were made in the cloud.

Unrelated nit seen on the way: the life-montage plate `lf_wushu_gold` shows a **sword group set with teammates**, which contradicts decision 4
(the group set is barehand; jian is her solo event). Re-caption it as her jian solo at the competition, or regenerate it without the teammates.

---

## 9. From her routine (box session, 2026-10-25): slot fills, timestamps, bar map

Source: her team's 2004 Collegiates group set (3rd place, 8.54), watched on the box at YouTube's best quality for this video, **320×240 at
15 fps**. Analysis only: the video and its frames stay in the box's ignored `work/`, nothing went to any model, and her teammates aren't
named or depicted. Structure, formations and move families are clear. Exact counts and hand shapes are not, so treat counts as approximate.

**Jade's decisions (2026-10-25), now built into `tools/sd/shots_wushu.py`:** six branch copies perform the set. The warm half is rose, gold
and white; the cool half is sky, mint and violet. They alternate along the line the way the real black/red halves did, trade phrases, then
pair across for the exchanges. **Main (orange) is not in the set.** She steps in only for the closing salute, completing the V of seven that
cuts into the fold. The group fall stays as the signature.
- **Line order, left to right:** white, mint, rose | sky, gold, violet. That's the fold's V without its point, so the salute shot needs no
  re-ordering. It alternates warm, cool, warm | cool, warm, cool.
- **Cross pairs:** white–mint, rose–sky, gold–violet (each a warm/cool pair, neighbours in the line).
- **Hair** (unchanged lanes): buns, ponytail, buns | buns, ponytail, buns.
- **New plates needed:** `dr_gs_line6` (the six standing in that line, facing camera) and `dr_gs_v6` (the six in the V, point empty).
  `dr_gs_ranks`, `dr_gs_tornado` and `dr_gs_ring` all start from `dr_gs_line6`. The key `dr_gs_tornado` now carries **the group fall**, not
  a tornado kick (rename it if you like), and `dr_gs_ring` now carries **the halves trading and the cross pairs**, not a ring.

### What the real set does (video time)
| time | what happens | formation / travel |
|---|---|---|
| 0:00–0:07 | walk on from the back of the carpet; line up; salute | single line at the back |
| 0:08–0:14 | jog into the opening spots | spread into one wide staggered line, colours alternating |
| 0:15.0–0:16.8 | **still at attention**, a long tense hold | one line facing the judges, six, black/red alternating |
| 0:16.8–0:17.6 | **first unison hit**: burst out of attention | in place |
| 0:17.6–0:18.0 | bow stance + straight punch, unison | in place |
| 0:18.4–0:18.6 | drop into a deep **pubu**, arm sweeping low | in place |
| 0:19.0–0:20.0 | back up into bow stance, rear arm whipped overhead (liangxiang), held ~1 s | in place |
| 0:20.4–0:21.6 | turning steps, travelling | the line drifts across the carpet |
| 0:22.0–0:22.4 | **jump kicks, staggered** (one after another, not unison) | moving |
| 0:23–0:27.6 | bow stances, arms whip overhead into poses; more travel | briefly two rows |
| 0:29.0–0:29.4 | leaping jump, again staggered | moving |
| 0:30.0–0:32.6 | bow stance into a **unison pubu line** (0:31.0–0:31.6 all six low), then rise | one line |
| 0:40–0:41 | knee-raise balances | line |
| 0:42.2–0:44.6 | **kicks by half**: black do front kicks (0:42.2–0:42.6), red answer (0:43–0:44), slap kicks (0:44.6) | line, staggered by colour |
| **0:47.2–0:47.8** | **group fall 1**: all six dive forward and hit the mat together | line |
| **0:48–0:54** | **lie flat and completely still, ~6 s** | |
| 0:55–0:58 | push up and rise, crouch, spring to standing | |
| 0:58–1:12 | **halves trade phrases**: red trio performs while black holds, then black answers | the halves separate (red in front, black behind) |
| 1:12–1:30 | **cross-colour pairs**: attack and block; takedowns to the floor (~1:13–1:15); sweeps and rolls (~1:24, ~1:29); the partner ducks under kicks | three pairs spread across the carpet |
| **1:39.4–1:40.4** | **group fall 2**: the pairs go down together | pairs |
| **1:40.4–1:44** | lie still on the floor, ~4 s | |
| 1:44–1:46.4 | rise, regroup | |
| 1:46.4–1:47.4 | step into a line facing the judges | one line |
| 1:47.4–1:50.6 | **arms straight out to the sides, held ~3 s** | line |
| 1:51.4–1:52.8 | drop together into a deep horse stance, arms spread | line |
| 1:53–1:58.4 | bow stance → pubu (~1:54.2) → bow stance; final pose held ~2 s (1:56.6–1:58.4) | line |
| 1:58.6–2:00 | rise, feet together, **salute** | line |
| 2:00–2:06 | walk off | |

- **Team size:** 6.
- **Shouts:** none clearly audible at this quality. Room noise only, no music. The crowd's loudest moments are **0:49** (right after fall 1)
  and **~2:00** (the salute).
- **Signature unison jump:** **there isn't one.** Every jump and jump kick in the set is staggered, one after another (0:22, 0:29, 0:44). The
  unison peaks are the stances (0:17.6 punch, 0:31 pubu line, 1:51.6 horse stance) and **the two group falls**. So the fall replaces the
  tornado landing as the big unison hit on bar 97.
- **Closing tableau:** a **level** line, not a staircase of heights: arms out to the sides → deep horse stance → final pose → salute.

### Bar map (one bar = 1.739 s, B(93) = 160.123; clip time = song time − the take's audio window start)
| bar.beat | song s | take (clip s) | move (from the real set) |
|---|---|---|---|
| 93.1 | 160.12 | dr_gs_ranks (1.74) | unison burst into bow stance + straight punch (0:17.6) |
| 93.3 | 160.99 | ranks (2.61) | all six drop into pubu, arm sweeping low (0:18.4) |
| 94.1 | 161.86 | ranks (3.48) | rise to bow stance, arm whipped overhead, head snap; **hold** to 95 (0:19–0:20) |
| 95 | 163.60 | dr_jian_t2 (existing) | her jian solo (her real solo event); hides the cut to the fall plate |
| 96.1 | 165.34 | dr_gs_tornado = fall (1.74) | two driving steps forward |
| 96.4 | 166.64 | fall (3.04) | launch forward into the dive |
| **97.1** | **167.08** | fall (3.48) | **all six hit the water flat together: THE hit** (0:47.6) |
| **97.1–97.4** | 167.08–168.82 | fall (3.48–5.2) | **the held still bar**: they lie flat, motionless (0:48–0:54 compressed into one bar; the drop's kick keeps going underneath) |
| 98.1 | 168.82 | fall (5.22) → cut | they push up and spring to their feet as one (0:55) |
| 98.1 | 168.82 | dr_gs_ring = halves + pairs (1.74) | warm half strikes (bow punch + snap kick) while cool holds (0:58–1:05) |
| 98.3 | 169.69 | pairs (2.61) | cool half answers, warm freezes (1:05–1:12) |
| 99.1 | 170.56 | pairs (3.48) | the three cross pairs exchange: punch vs rising block, a low sweep jumped over (1:12–1:30) |
| 99.3 | 171.43 | pairs (4.35) | the pairs freeze in mirrored bow stances |
| 100.1 | 172.30 | dr_gs_salute (1.74) | the six (V, point empty) drop into deep horse stance, **arms straight out to the sides** (1:47–1:52) |
| 100.3 / "ooh" | 173.08–173.17 | salute (2.52–2.61) | **main (orange) walks in to the point**; all seven rise, feet together, **baoquan salute**, held (2:00) |
| 101.1 | 174.04 | fold (unchanged) | match cut on the V of seven |

**Where the fall sits, and why there:** bar 96.4 → 97.1 is the end of the second rising phrase (bass E → F#), landing on the B phrase
downbeat. That's the spot this design already gave its biggest unison hit, so the whole team hitting the floor lands on the strongest
downbeat available. Bar 97 itself becomes the **held still bar**, the drop's equivalent of the real set's ~6 s of lying still. It's the
only full stop in bars 93–100, so it reads as the stop. The rise on 98.1 starts the third phrase.

**Change from the draft:** the second canon (the ring wave) and the levels tableau are gone, because the real set has neither. In their
place are the real set's call-and-response between the halves, the cross-colour pairs, and a level closing line. Still in: 3 unison hits
(93 punch, 97 fall, 100 horse stance), the held bar, the salute, and the match cut. The draft's fallbacks in section 5 still apply, with one
exception: if the fall take loses copies, use the old `at('dr_set', 2)` tuck-jump landing at bar 96 and keep 97 as a still frame of it.
