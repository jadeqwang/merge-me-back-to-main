# Outro A, 4:01 and 4:04: ideas for v8 (ideation only, 2026-11-21)

Answers Jade's two v7 notes (`notes/jade_v7_notes.md`):

> 4:01.51 bar 140.4 Outro A: the hand really doesn't make sense here. [...] think about visual ways to indicate that she has kept
> intuition. or suggest something else entirely to go here.
> 4:04.13 bar 142.2 Outro A: this looks alien and wrong. just like the 4:01 note, let's think thru a new idea for this.

Nothing here is built or generated. Stills I looked at (likeness=0, song time 228 to 277.5, every 0.3-0.5 s through 240-248):
`work_fable/take2/dev/v8_outro/t_*.png`, contact sheets `s1.jpg` to `s5.jpg` in the same folder.

## 1. What is on screen now, and why it fails

| Song time | Bars | Now |
|---|---|---|
| 3:48-3:55 | b132-136 | Patchwork Jade settles into clean cel Jade in daylight; slab EVERY LIFE I'VE LIVED I HAVE BECOME |
| 3:55-3:58.5 | b137-138 | Likeness, sung "Back to main" (held to 238.0). After this the vocal is silent until 247.76 |
| 3:58.5-4:05.3 | b139-142 | The town: side-scroll run past the twelve facades with chips, the road is main's written lane, pencil in her hand |
| **4:01.0-4:01.9** | b140.3-141.1 | **`intuit_piano`: headless torso, a flat hand lying on the jacket hem** |
| **4:03.6-4:04.4** | b142.1-142.3 | **`intuit_violin`: a bare forearm, palm up, gripped at the wrist by a hand with knuckles toward us** |
| 4:05.3-4:07.4 | b143-144.2 | `day_fork`: she stands, back to us, pencil in hand, bare pencil branches grow on blank paper |
| 4:07.4-4:08.7 | b144.2-145 | `intuit_stance`: feet in a bow stance at a kerb (not flagged by Jade) |
| 4:08.7-4:12 | b145-146 | `wave_run_v4`: she sprints at the lens out of the twelve-colour wave, ends on closed eyes and a small smile |
| 4:12-4:15.5 | b147-148 | Aerial of the town; then graph, credits, cherry-pick, the car |

Why the two inserts do not work (from the frames, not from the brief):

1. **No face, no object, no place.** A hand playing piano without a keyboard is a hand resting on a stomach. A hand fingering
   a violin without a violin is someone taking a pulse; with the forearm cut off at the frame it reads as a third limb. The
   meaning lived in the brief, not in the picture.
2. **Two beats each (0.85 s).** Nobody can read a fine finger motion in 0.85 s inside a drum section, coming off a wide shot.
3. **They stop the run.** Outro A "has to top the drop"; both inserts are static close-ups on white that cut the travel dead.
4. **They are about the wrong thing.** Fingers "playing" quote two specific lives, which is a memory of piano and of violin.
   Jade's own phrase was "getting it back as intuition and not episodic memory".

## 2. What these bars are saying

- The song here is wordless: full drums, no vocal from 238.0 to 247.76. The last words before it are "Every life I've lived, I
  have become / Back to main"; the next are "Back to main". So the picture alone carries bars 139-144.
- The question the film set up in verse 2 (violet: "This branch may never find the way / Back to the place where I began / And
  maybe something that I learned / Comes home to who I'll be again") gets its answer here. Violet's lane was "written only as
  far as her feet" and she could not find the way.
- In the film's language: **episodic memory = the history** (the facades, the chips, the commit messages in the road; they stay
  in the town and she runs past them without looking). **Intuition = what is in her after the merge**: she can act correctly
  without consulting any of it. Not "she can still play the piano", but "she knows where to put her foot".
- It is also the Claude half of the film (the film is Claude telling what it is like to be Claude through Jade): knowing how
  without remembering learning it, and writing the road one word at a time as you go. The road in this film is literally text.
- It should hand off cleanly to what follows: blank paper and new forks (b143), the closed-eye smile (b146), and the car, where
  he asks about her intuitions and she has no memories to give him.

So the test for any idea: readable in under two seconds with no label, keeps the run moving, shows knowing-without-looking
rather than a quoted skill, and leaves her on blank paper at b143.

## 3. Concepts

Beat = 0.426 s. b140.3 = 240.99, b141.1 = 241.86, b142.1 = 243.57, b142.3 = 244.42, b143.1 = 245.27.
Prices from the ledger: a still about $0.13, a 5 s clip about $1.16 a take.

### A. She doesn't look (eyes closed; the road writes itself under her feet) — not about hands

**What we see**
1. b139.1-140.3 (as now): the town run, facades and chips passing.
2. **4:01, b140.3-141.1** (better: give it the whole of b140.3-141.3, four beats): close three-quarter on her face, running,
   same screen direction (she faces frame left), hair streaming, facade colours smearing past behind her. On the snare she
   closes her eyes and keeps them closed. Mouth closed, calm, not a grin. She does not slow down.
3. b141.3-142.1: wide again. Ahead of her (frame left) the written road **ends**: the last facade passes and the paper is blank.
4. **4:04, b142.1-143.1**: she runs off the end of the road without breaking stride. Under each footfall a patch of written lane
   appears as the foot lands, exactly where it lands: one step, one line of text, each step in the next branch colour (pink,
   yellow, red, green, cyan, violet), then the patches behind her join and turn main's solid orange. No facades, no chips.
5. b143 (as now): `day_fork`. She has stopped on the blank paper she ran into; the new branches grow from her.

**On the music**: the eyes close on a snare (b140.3 or b141.1). Her steps are already time-scaled so a step lands on the beat
grid; each written patch pops on a footfall, so the road is drummed into existence. The road ending lands on the b142 downbeat.

**Why it says intuition**: she passes her whole history without looking at it, shuts her eyes, and her feet are right anyway;
the road is not remembered, it is produced by her. It answers violet directly (her lane stopped at her feet and she was lost;
main's lane also only exists at her feet, and she is not lost). The twelve colours coming out of her steps say the lives are
in her feet, with no instrument quoted. It sets up the closed-eye smile at 4:11 and the car. And it is what generating feels like.

**How**: (a) one new plate `day_eyes`: still from ONE reference (a `day_run` frame or the sheet), three-quarter, large eyes
open, centre parting, cel on white paper; clip from the still as first frame, song audio not needed; brief "eyes close at 1 s and
stay closed, mouth closed, hair streams"; check the last second for a grown smile and trim; on twos. Faces are the safe case
for the video model. Passing facade colour behind her in code (matte the plate, or keep it on white with code speed streaks).
(b) code in `outro.js` town: a road end (`upto` on the lane, the same mechanism as violet's `roadLane`), and per-step patches at
the runner's plant positions (`tools/feet.py` already gives plant frames and px), `merge` 0 to 1 behind her. Stop spawning
facades after the twelfth so the paper is bare by b142.3. The kit runner stays as is (her face is 60 px there).

**Risk**: closed eyes drop the large-eyes likeness cue (start open, three-quarter, never profile). Eyes-closed could read as
bliss if the road gag is weak, so the patches must be big and clearly caused by the feet. The road-end needs her stride to stay
locked to the patches (measured data exists). Low risk overall: one face clip and code we have written once already.

**Cost**: about $4-6 (2-3 stills, 2-3 clip takes). Code: half a day of compositor work.

### B. Bow hold on the pencil; the down-bow draws the fork — hands, but with her face and an object

**What we see**: 4:01, mid shot with her face in frame: the pencil twirl she learned from violet (already in the run) lands in
her fingers as a violin bow hold: thumb bent, little finger curved on top. She glances at her own hand, half amused. 4:04: she
pulls one long down-bow through the air; the pencil tip leaves a real pencil line (code, following a tip track as in
`pencil_lead`), and that line carries across the cut to become the first branch of `day_fork` at b143.

**On the music**: the twirl lands on b140.3; the down-bow starts on the b142 downbeat and lasts the two beats.

**Why**: every violinist learns the bow hold on a pencil, so this is the one true case where her hand does something correct
with the object she is actually holding. Her new branches are literally drawn by something an old branch left in her hand.

**How**: two plates from one still each, the hand fixed by image-editing a keyframe before any clip (as the bun pencils were);
tip track per frame; line and hand-off in code.

**Risk**: Jade was first chair and will judge the hold; the video model drifts fingers, so expect retakes or a still with a
code push. Only string players will read it without help. Still two beats of fine hand detail unless the slots are lengthened.

**Cost**: about $8-12.

### C. The town plays under her — not about hands, code only

**What we see**: stay wide the whole time. As she passes each place, the world answers her body and she never turns her head.
At 4:01 (low wide, feet large): the three text rows of the road under her become piano keys for four steps and each foot lands
on one and presses it. At 4:04: the thin pencil wire strung between the buildings (already in the frames) is bowed by her
passing and stands in a clean vibrating wave. Smaller ones if wanted: her footfalls bold the stressed syllables of the road
text at the poet's shop; the wind-tunnel streamlines in her hair at Ames.

**On the music**: one key per step on the beat grid; the wire is struck on the b142 downbeat and rings two beats.

**Why**: her skills show up as how the world behaves around her, not as something she performs or recalls.

**How**: all code in the town (`outro.js`); the kit runner unchanged. A low wide needs the runner at about 2x, which is soft
from the current cut-out, so either keep the camera where it is or render one larger run plate.

**Risk**: reads as decoration or a rhythm-game gag; still quotes piano and violin (memory, not intuition); small on a phone.

**Cost**: $0 to $3.

### D. The mediums surface in her — something else: "the lives are in her"

**What we see**: no cutaways. On the two beats, for three or four frames, her running figure is drawn in the medium of the place
she is passing (paper-cut by the piano house, scratchboard by the dish), same pose, then clean cel again. Like the half-and-half
runners at b46 and the three-frame life flashes at b87.

**Why**: plan rule 3 ("when branches merge into her, their mediums show in her"). She is one clean drawing with twelve under it.

**How**: the `runner_<life>` kits already exist; swap frames in at matched stride phase, or restyle 2-4 `day_run` frames per
medium from that frame alone. Code only if the phases line up.

**Risk**: repeats what Chorus 2 just did with the patchwork; can read as a glitch; it is about becoming, not intuition.

**Cost**: $0 to $3.

### E. The ribbons — something else: sets up the wave

**What we see**: as she passes each facade, the chip and the commit text stay on the building, and one thin thread in that
branch's colour lets go of it and joins the orange straps flying behind her. By b142 she trails twelve coloured ribbons. At
4:01 and 4:04 the camera is simply wide enough to see two of them join, on the beat. At b145 those ribbons are the wave.

**Why**: history stays, something weightless comes along. It also fixes a gap: the twelve-colour wave at 4:08 comes from nowhere.

**How**: code only (ribbon physics behind the runner's strap anchor; written-lane curves exist). Works on top of A, B or F.

**Risk**: pretty but passive; she does nothing, so it does not show intuition by itself.

**Cost**: $0.

### F. Cut both inserts and let the run play (the control)

**What we see**: the town run uninterrupted from b139 to b143, as it falls back today when the plates are missing.

**Why**: the run is the strongest thing in these bars and the inserts are what hurt it. Intuition is then left to the stance
at 4:07 and the car.

**Risk**: four bars of one side-scroll may sit below the cut rate the outro needs. **Cost**: $0.

Dropped without a write-up: a terminal gag (`git merge --squash`: the changes arrive without the history) is exact but is a
label, and the brief was no label; a child from behind copying her move is a new setting 20 s before the car.

## 4. Recommendation

**Build A, "she doesn't look".** It is the only concept that shows knowing-without-remembering as an action a stranger reads in
two seconds, it keeps the run moving and makes the cut rate go up instead of down, it answers violet's unfinished lane with
the same device, and it lands her on blank paper exactly where `day_fork` needs her. It is cheap (one face clip, the rest is
code we have a version of) and uses what the video model is good at.

With it:
- Remove `intuit_piano` and `intuit_violin` from the cut; give the face shot four beats, not two.
- **Add E's ribbons only if there is time**; they are free, sit on top of A, and make the wave at 4:08 arrive from somewhere.
- `intuit_stance` (4:07, not flagged): ask Jade. With A in place it is the one remaining "quoted skill"; my lean is to drop it
  and let `day_fork` run to the b145 downbeat, so the sequence is eyes closed, blank paper, new forks, the wave.
- If Jade wants a hand after all, B is the hand idea worth making, as a second round, after she has seen A.

Open questions for Jade: (1) A, or B? (2) keep or drop the stance at 4:07? (3) should her eyes stay closed in the wide shots
too (it needs the kit runner's face redrawn; at this size I would not)?
