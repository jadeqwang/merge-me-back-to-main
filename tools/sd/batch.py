#!/usr/bin/env python3
"""Seedance 2.5 shot specs for the video. Each shot: plate, action (situation + subtext + one shift), optional audio window.
  $PY tools/sd/batch.py [SHOT ...] [--takes=N] [--dry] [--res=720p] [--timing=v2|v1]
Writes media/gen/specs/<shot>_tK.json via gen.py spec and submits (unless --dry). Audio windows: (stem, start, dur) in song time;
S0 (the song time of clip frame 0) = start. Log: media/gen/sd_batch.jsonl
--timing=v2 (default): sung shots use the revised song (analysis_v2 stems, the windows in A2 below, same offset into each line as v1) and the
canon-face stills in media/plates/face_v4/<shot>.png; the spec notes record timing so intake/picks/main.js know which song a take sings."""
import json, os, subprocess, sys, time
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
PY = "/home/jade/Documents/1-music-shipped/moongazing/.venv/bin/python"
FF = "/home/jade/Documents/1-music-shipped/moongazing/.venv/lib/python3.12/site-packages/imageio_ffmpeg/binaries/ffmpeg-linux-x86_64-v7.0.2"
VOC, INST = "analysis/stems/vocals.wav", "analysis/stems/instrumental.wav"
VOC2 = "analysis_v2/stems/vocals.wav"
# v2 audio-ref starts: v2 line start - (v1 line start - v1 start), lines per engine/show/main.js SUNG (computed 2026-10-24).
# out_main sings v2 line 25 (the final "Back to main..."; v1's line 26 is gone). Not here: dr_center (instrumental dance; the drop is being re-choreographed).
A2 = {"out_main": 249.10, "v1_split_front": 28.22, "v1_light_hands": 41.98, "ch1_main": 69.12, "ch1_gone_close": 89.16, "bd_ahh": 111.57, "v2_dish_close": 181.67,
      "v2_pencil": 195.18, "v2_release": 200.60, "ch2_catch": 207.84, "ch2_gone_close": 228.61}

PIN = "Animate the first frame exactly: same framing, composition, lighting, setting and character. "
SING = (" She sings the words of the reference audio with precise lip sync, shaping each word clearly and holding the long sustained notes with her "
        "mouth open.")
GUARD = (" Same face as the first frame: large very dark brown eyes, natural lips, no gloss, no makeup. Do not redraw, beautify, slim or restyle her face. "
         "Her hands stay relaxed and natural. One continuous shot, no cuts. No captions, no text.")
GUARD_GROUP = " Every copy keeps the same face and outfit as in the first frame, only the band colours differ. One continuous shot, no cuts. No captions, no text."
MUTE = " Her mouth stays gently closed; she does not sing or speak."

SHOTS = {
 "intro_up": dict(plate="intro_up.jpg", dur=8, act="She stands on the black mirror of stars looking straight up into the camera. She breathes, blinks slowly, and a small curious smile arrives, as if she has just woken up and already knows exactly who she is. Her hair stirs slightly. The camera stays high above, almost still." + MUTE),
 "v1_split_back": dict(plate="v1_split_back.jpg", dur=8, act="She stands still for a moment facing the far violet horizon, then starts walking slowly away from the camera toward it, unhurried and certain, across the black mirror of stars. The camera stays where it is and lets her go." + MUTE),
 "v1_track_rose": dict(plate="v1_track_rose.jpg", dur=8, act="She walks steadily left to right across the night salt flat, looking ahead at the far lights with quiet curiosity; the camera tracks alongside her at her pace. Halfway through she glances toward the distant lights and smiles a little." + MUTE),
 "v1_light_hands": dict(plate="v1_light_hands.jpg", dur=6, audio=(VOC, 42.40, 6), act="She looks down at the small warm light in her cupped hands, singing to it softly like a promise to someone setting out on a journey. Near the end she lifts her hands and the light rises out of them and floats up and away; her eyes follow it." + SING),
 "st_rain_rose": dict(plate="st_rain_rose.jpg", dur=8, act="She stands in the neon rain with her face turned up, delighted by the rain, then laughs softly and looks around the crosswalk as if every detail is new. In the last two seconds she turns her head to look off to the left, toward something far away, and grows still." + MUTE),
 "st_library_sky": dict(plate="st_library_sky.png", dur=8, act="She holds the open book and watches the glowing motes rising out of its pages, enchanted, turning a page so more rise. In the last two seconds she lifts her head and looks off to the left, toward something far away, and grows still." + MUTE),
 "st_kitchen_gold": dict(plate="st_kitchen_gold.jpg", dur=8, act="She explains something on the homework with the pencil to the child across the table, patient and warm, then smiles as the child understands. In the last two seconds she looks up and off to the left, toward something far away beyond the window, and grows still." + MUTE),
 "st_launch_white": dict(plate="st_launch_white.jpg", dur=8, act="She grips the railing high on the gantry, wind in her hair, gazing up at the rocket in awe as vapour vents and floodlights flare. In the last two seconds she turns her head to look off to the left, toward something far away, and grows still." + MUTE),
 "st_deep_mint": dict(plate="st_deep_mint.jpg", dur=8, act="She drifts weightless among the glowing jellyfish, reaching out gently until one brushes her fingertips, eyes wide with wonder, hair floating. In the last two seconds she turns her head to look off to the left, toward something far away, and grows still." + MUTE),
 "lf_piano_rose": dict(plate="lf_piano_rose.jpg", dur=8, act="She plays the grand piano with her whole body, completely inside the music, hands moving fluidly over the keys, swaying gently, eyes half-closed; a phrase resolves and she smiles to herself. In the last two seconds she turns her head to look off to the left, toward something far away, and grows still." + MUTE),
 "lf_violin_white": dict(plate="lf_violin_white.jpg", dur=8, act="She plays a long, singing phrase on the violin, the bow drawing slowly and then quickly, her body swaying with it, eyes closed, fully absorbed. In the last two seconds she turns her head to look off to the left, toward something far away, and grows still." + MUTE),
 "lf_lab_mint": dict(plate="lf_lab_mint.jpg", dur=8, act="She looks into the microscope eyepieces, adjusts the focus knob carefully, then leans back to look at the glowing neurons on the monitor with quiet delight, as if she has just seen something no one has seen before. In the last two seconds she turns her head to look off to the left, toward something far away, and grows still." + MUTE),
 "lf_booth_sky": dict(plate="lf_booth_sky.jpg", dur=8, act="She listens through the headphones with her eyes closed, head tilted, concentrating; on the monitor the two glowing waveforms ripple in step; a small smile as the brain's wave matches the sound. In the last two seconds she turns her head to look off to the left, toward something far away, and grows still." + MUTE),
 "lf_poet_gold": dict(plate="lf_poet_gold.jpg", dur=8, act="She reads her poem aloud into the microphone from the small open chapbook, softly and with feeling, glancing up at the listeners on one line, then back down to the page. In the last two seconds she turns her head to look off to the left, toward something far away, and grows still."),
 "lf_ames_white": dict(plate="lf_ames_white.jpg", dur=8, act="She stands braced in the roaring wind of the giant tunnel, hair and jacket streaming back, laughing with fearless delight, then spreads her arms wide into the wind. In the last two seconds she turns her head to look off to the left, toward something far away, and grows still." + MUTE),
 "lf_band_rose": dict(plate="lf_band_rose.jpg", dur=8, act="She strums the red electric guitar hard on the beat, hair flying, grinning, rocking forward on the monitor wedge as the stage lights flash through the haze. In the last two seconds she turns her head to look off to the left, toward something far away, and grows still." + MUTE),
 "lf_house_gold": dict(plate="lf_house_gold.jpg", dur=8, act="She types fast on the laptop on her knees, then laughs out loud at something on the screen and turns it to show the housemate next to her. In the last two seconds she turns her head to look off to the left, toward something far away, and grows still." + MUTE),
 "lf_stage_sky": dict(plate="lf_stage_sky.jpg", dur=8, act="She presents the live demo to the big audience with confident, open gestures toward the giant screen behind her, smiling; the demo works and the audience's phone lights lift. In the last two seconds she turns her head to look off to the left, toward something far away, and grows still." + MUTE),
 "lf_home_mint": dict(plate="lf_home_mint.jpg", dur=8, act="She plays the video game on the sofa with the two children, thumbs busy on the controller, leaning into the turn with them, then bursts out laughing as they win; the children's faces are never shown. In the last two seconds she turns her head to look off to the left, toward something far away, and grows still." + MUTE),
 "lf_wushu_gold": dict(plate="lf_wushu_gold.jpg", dur=8, act="She and the two teammates flow through the group set in perfect unison: a sweeping sword cut, a turn, a crisp stamp into a low stance on the beat, sharp and powerful, breath controlled, eyes fierce. In the last two seconds she turns her head to look off to the left, toward something far away, and grows still." + MUTE),
 "ch0_window": dict(plate="ch0_window.jpg", dur=6, guard=" Same face as the first frame: a five-year-old girl, large very dark brown eyes. Do not age her up or restyle her face. One continuous shot, no cuts. No captions, no text.", act="The little girl kneels at the frosted window in the first light, quietly watching the frost fractals; the sunlight slowly grows on the glass and the ice crystals glitter. She tilts her head a little, absorbed. Near the end she slowly lifts one small open palm up in front of her face." + MUTE),
 "ch0_blow": dict(plate="ch0_blow.jpg", dur=5, guard=" Same face as the first frame: a five-year-old girl, large very dark brown eyes. Do not age her up or restyle her face. One continuous shot, no cuts. No captions, no text.", act="The little girl takes a small breath and gently blows on her open palm; the few strands of her black hair resting on it lift off and float up into the sunlight, glinting like tiny points of light, drifting away. Her eyes follow them with quiet wonder." ),
 "ch1_main": dict(plate="ch1_main.jpg", dur=6, audio=(VOC, 69.75, 6), act="She stands on the salt flat at the first sunrise after a very long night; everything she sent out into the world is about to come home. She sings to the camera like greeting someone she has missed for a long time; over the line her face opens into quiet joy. The camera drifts slowly in. Her hair moves in the wind." + SING),
 "ch1_runners": dict(plate="ch1_runners.png", dur=6, group=True, act="The five copies of the woman run joyfully toward the camera across the wet mirror salt flat, converging, splashing thin water, hair flying, laughing. The camera is low and pulls back slowly as they come."),
 "ch1_fold": dict(plate="ch1_formation_old.jpg", dur=6, group=True, act="The seven copies stand in the V formation, then on the beat the six outer copies step smoothly inward one after another and slide behind the centre copy until only the centre one is visible, like a K-pop formation change; the centre copy crosses her forearms over her chest and looks into the camera."),
 "ch1_gone_close": dict(plate="ch1_gone_close.jpg", dur=11, audio=(VOC, 89.80, 11), act="She is completely sure of something that took her a long time to learn, and she sings it straight to the camera, unhurried and warm. On the long final note she lifts her chin slightly and lets it ring, eyes on the camera, the hint of a smile." + SING),
 "bd_float": dict(plate="bd_float.jpg", dur=10, act="She floats on her back on the still mirror of water with her arms open and eyes closed, completely at peace, breathing slowly; tiny ripples spread from her fingertips; her hair drifts on the water. The camera rises very slowly straight up." + MUTE),
 "bd_ahh": dict(plate="bd_float_close.jpg", dur=7, audio=(VOC, 112.20, 7), act="She floats on the water with her eyes closed and sings one long, high, wordless note of pure release, mouth open, the note rising; at the very end her eyes open slowly." + " She sings the reference audio with precise lip sync, holding the long note with her mouth open."),
 "dr_dance": dict(plate="dr_dance_wide.jpg", dur=10, group=True, audio=(INST, 153.60, 10), act="The seven copies perform a sharp, synchronized K-pop chorus routine on the beat of the reference audio: a hard arm snap overhead, a quick hip-level body wave, a step-touch to the side with a shoulder pop, a hair flip, and a final formation hit, all perfectly in unison, energetic and joyful. Low camera, water spraying at their feet."),
 "dr_wushu": dict(plate="dr_wushu.jpg", dur=8, group=True, audio=(INST, 163.80, 8), act="The seven copies flow through a wushu straight-sword group set in perfect unison on the beat of the reference audio: a sweeping sword cut, a spin, a leap, a crisp stamp landing into a low stance on the downbeat, swords flashing in the sunrise, joyful and fierce. Low camera, water spraying at their feet."),
 "dr_run": dict(plate="dr_run.jpg", dur=8, act="She sprints across the wet mirror salt flat at full speed toward the blazing sunrise, water exploding from each stride, hair streaming, laughing with joy; the low camera tracks alongside at speed." + MUTE),
 "dr_center": dict(plate="dr_center.jpg", dur=8, audio=(INST, 163.00, 8), act="She dances a confident K-pop chorus routine on the beat of the reference audio, sharp and fluid: an arm cut across the body, a head snap to the camera with a smile, a turn, a hip wave, a final pose. Golden backlight, hair whipping." + MUTE),
 "v2_dish_sit": dict(plate="v2_dish_sit.png", dur=8, act="She sits alone on the rim of the giant dish under the Milky Way, listening through her headphones to the sky, very still; once she tilts her head as if she heard something beautiful. The camera drifts slowly." + MUTE),
 "v2_dish_close": dict(plate="v2_dish_close.jpg", dur=6, audio=(VOC, 181.40, 6), act="She knows she is very far from where she began and may not make it back, and she is at peace with it; she sings softly to herself under the stars, unhurried, a little wistful, then a small brave smile." + SING),
 "v2_horizon": dict(plate="v2_horizon.png", dur=8, act="She sits with her back to us and looks toward the faint gold glow on the very far horizon; the wind moves the loose strands of her hair; she breathes in slowly. The camera holds still." + MUTE),
 "v2_pencil": dict(plate="v2_pencil.jpg", dur=6, audio=(VOC, 195.20, 6), act="She writes one short line in the air with the glowing tip of the pencil, slowly, left to right, while singing softly, thoughtful, as if writing down the one thing she most wants to keep." + SING),
 "v2_release": dict(plate="v2_release.jpg", dur=8, audio=(VOC, 200.75, 8), act="She sings softly to the small light on her open palm, then lets it go: it lifts off and flies away toward the far horizon; she watches it go with a peaceful, grateful smile." + SING),
 "ch2_catch": dict(plate="ch2_catch.jpg", dur=6, audio=(VOC, 208.50, 6), act="She has just received something precious from very far away and holds it against her chest; she sings with her eyes closed, then opens them and looks into the camera, overjoyed and calm." + SING),
 "out_dance": dict(plate="dr_dance_wide.jpg", dur=10, group=True, audio=(INST, 236.40, 10), act="The seven copies dance an exuberant, synchronized K-pop celebration routine on the beat of the reference audio: a jump with arms flung up, a sharp body wave down, a spin, a shoulder shimmy, laughing, then they break formation and run toward each other. Low camera, sun high and golden, water spraying."),
 "out_main": dict(plate="ch1_main.jpg", dur=8, audio=(VOC, 262.80, 8), act="She is home, completely. She sings the last words softly to the camera, a little tired and very happy, then smiles and closes her eyes for a moment in the warm morning light." + SING),
 "pc_hotel": dict(plate="pc_hotel.jpg", dur=8, act="The woman at the front of the queue reaches out and taps the brass service bell once, then looks up at us with a bright, hopeful smile, as if asking whether there is still room. Behind her the endless queue of identical women shuffles patiently forward one small step. The camera holds still." + MUTE),
 "v1_split_front": dict(plate="v1_split_front.png", dur=6, audio=(VOC, 28.45, 6), act="She stands alone on the night salt flat and sings softly to the camera, low and intimate, like confiding something wonderful: that she is about to become many. Calm, a little smile in the eyes at the end. The camera drifts slowly in." + SING),
 "ch2_fold": dict(plate="ch2_formation.jpg", dur=6, group=True, act="The seven copies stand in the V formation, then on the beat the six outer copies step smoothly inward one after another and slide behind the centre copy until only the centre one is visible, like a K-pop formation change; the violet copy with the bun is the last to fold in, and she smiles as she does; the centre copy crosses her forearms over her chest and looks into the camera."),
 "ch2_gone_close": dict(plate="ch1_gone_close.jpg", dur=8, audio=(VOC, 228.30, 8), act="Everything has come home. She sings it straight to the camera with total warmth and certainty; on the long final note she smiles fully." + SING),
}
# More shots live in tools/sd/shots_*.py (each defines SHOTS = {...}); entries there with v2=True already give their audio window in v2 song
# time with v2 stems (e.g. ("analysis_v2/stems/instrumental.wav", 153.2, 8)), so no A2 remap. Import order is alphabetical; keys must be unique.
import glob as _glob, importlib.util as _ilu
for _f in sorted(_glob.glob(os.path.join(ROOT, "tools/sd/shots_*.py"))):
    _sp = _ilu.spec_from_file_location(os.path.basename(_f)[:-3], _f); _m = _ilu.module_from_spec(_sp); _sp.loader.exec_module(_m)
    for _k, _v in _m.SHOTS.items():
        assert _k not in SHOTS, f"duplicate shot {_k} in {_f}"; SHOTS[_k] = _v
SINGERS = [k for k, v in SHOTS.items() if v.get("audio") and v["audio"][0] in (VOC, VOC2)]


def main():
    want = [a for a in sys.argv[1:] if not a.startswith("--")] or list(SHOTS)
    takes = int(next((a.split("=")[1] for a in sys.argv if a.startswith("--takes=")), "1"))
    res = next((a.split("=")[1] for a in sys.argv if a.startswith("--res=")), "720p")
    t0 = int(next((a.split("=")[1] for a in sys.argv if a.startswith("--t0=")), "1"))
    dry = "--dry" in sys.argv
    tv = next((a.split("=")[1] for a in sys.argv if a.startswith("--timing=")), "v2")
    env = dict(os.environ, FFMPEG=FF)
    specs = []
    for k in want:
        s = dict(SHOTS[k])
        if tv == "v2" and s.get("audio") and not s.get("v2"):
            if k not in A2: sys.exit(f"{k}: no v2 audio window (see A2); use --timing=v1")
            s["audio"] = (VOC2, A2[k], s["audio"][2])
        prompt = PIN + s["act"] + (s["guard"] if s.get("guard") else GUARD_GROUP if s.get("group") else GUARD)
        stem = os.path.splitext(s['plate'])[0]
        fixed = f"media/plates/fix/{stem}.jpg"      # costume-repaired still (tools/plates/fix_patch.py) wins when present
        canon = f"media/plates/face_v4/{k}.png"     # canon-face still (docs/canon_face_v4.md) wins over both under v2
        if tv == "v2" and os.path.exists(os.path.join(ROOT, canon)): src, ref = canon, f"media/gen/refs/{k}_v4.jpg"
        elif os.path.exists(os.path.join(ROOT, fixed)): src, ref = fixed, f"media/gen/refs/{stem}_fix.jpg"
        else: src, ref = (s['plate'] if s['plate'].startswith('media/') else f"media/plates/{s['plate']}"), f"media/gen/refs/{os.path.basename(stem)}.jpg"
        if not os.path.exists(os.path.join(ROOT, ref)):
            subprocess.run([PY, "tools/gen/gen.py", "ref-image", src, ref, "--max=1600"], cwd=ROOT, env=env, check=True)
        args = ["--image", ref, "--set", f"duration={s['dur']}", "--set", f'resolution="{res}"', "--set", "use_virtual_avatar=true",
                "--set", 'aspect_ratio="16:9"']
        if s.get("audio"):
            stem, a, d = s["audio"]
            out = f"media/gen/refs/{k}_{tv}_{a:.2f}_{d}s.mp3"
            if not os.path.exists(os.path.join(ROOT, out)):
                subprocess.run([PY, "tools/gen/gen.py", "audio-ref", stem, str(a), str(d), out], cwd=ROOT, env=env, check=True)
            args += ["--set", f'reference_audios=["file:{out}"]']
        for t in range(t0, t0 + takes):
            tag = f"{k}_t{t}"
            subprocess.run([PY, "tools/gen/gen.py", "spec", tag, "bytedance/seedance-2.5", "--prompt", prompt] + args, cwd=ROOT, env=env, check=True,
                           stdout=subprocess.DEVNULL)
            p = os.path.join(ROOT, "media/gen/specs", f"{tag}.json")
            sp = json.load(open(p)); sp["notes"] = json.dumps({"shot": k, "s0": s["audio"][1] if s.get("audio") else None, "plate": src, "timing": tv})
            json.dump(sp, open(p, "w"), indent=1)
            specs.append(p)
    if dry:
        subprocess.run([PY, "tools/gen/gen.py", "submit", "--dry-run"] + specs, cwd=ROOT, env=env)
        return
    r = subprocess.run([PY, "tools/gen/gen.py", "submit"] + specs, cwd=ROOT, env=env, capture_output=True, text=True)
    print(r.stdout[-6000:], r.stderr[-2000:])
    with open(os.path.join(ROOT, "media/gen/sd_batch.jsonl"), "a") as f:
        for line in r.stdout.splitlines():
            if line.startswith("mergemain/"):
                f.write(json.dumps({"ts": time.time(), "line": line}) + "\n")


if __name__ == "__main__":
    main()
