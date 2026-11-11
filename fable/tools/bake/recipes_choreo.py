"""Build + drop choreography (fable/CHOREO.md section B): tracks `build`, `drop`, `fall_only`,
`salute_only`, `butterfly_only`.

One performer, changquan-flavoured: authored stances (gongbu, mabu, pubu, salute, the group
fall) joined with a strike profile, plus mocap for the acrobatics and the high kicks
(CMU 88_06 butterfly, CMU 90_05 jump double kick, CMU 135_11 / 135_07 kicks, ACCAD Male2 spinning
back kick). Everything is laid on song time with choreo_lib.Timeline; see fable/notes/M2_choreo.md.

Stage: +Z downstage (frontal camera), +X her left when she faces +Z. Origin = her spot in the
formation (copies stand 2.2 m apart).
"""
from __future__ import annotations

import math

import numpy as np

import choreo_lib as C
import motion as M
from choreo_lib import bt, make_pose

RECIPES = {}


def recipe(name):
    def deco(fn):
        RECIPES[name] = fn
        return fn
    return deco


# ----------------------------------------------------------------------------- pose vocabulary
# Every stance is built in its own local frame (facing local +Z, centred on the origin) and then
# placed with S(pose, facing, at). mir() swaps left and right.
def S(p, facing=0.0, at=(0.0, 0.0)):
    return M.transform(p, math.radians(facing), (at[0], 0.0, at[1]))


def mir(p):
    return M.mirror(p)


def fist_waist(sg):          # chambered fist at the waist (bao quan at the hip), elbow back
    return {"rel": (sg * 0.20, -0.17, 0.0), "elbow": (sg * 0.15, -0.1, -1.0)}


def stand(arms="waist", look=(0, 0, 1), y=M.HIPS_H - 0.004, feet=0.085, spine=(0, 0, 0)):
    """Feet together, tall. arms: waist (fists chambered) | down | wide | up | salute."""
    kw = {}
    if arms == "down":
        kw = {}
    elif arms == "waist":
        kw = dict(armL=fist_waist(1), armR=fist_waist(-1))
    elif arms == "wide":
        kw = dict(armL={"dir": (1, 0.0, 0.0), "elbow": (0, -0.2, -1), "hand": (1, 0.0, 0)},
                  armR={"dir": (-1, 0.0, 0.0), "elbow": (0, -0.2, -1), "hand": (-1, 0.0, 0)})
    elif arms in ("open", "open2"):
        # r4 (drop b100.1): arms wide as a wushu shape, not a T: a little above the shoulders and a little behind them, elbows unlocked, the wrists set so
        # the palms stand (fingers up and out), chest lifted. "open2" is where the hold drifts to through the bar: higher, the palms turning up.
        u, e, hy = (0.13, 0.975, 0.75) if arms == "open" else (0.24, 0.965, 0.5)
        kw = dict(armL={"dir": (1, u, -0.07), "elbow": (0, -1, -0.45), "ext": e, "hand": (0.8, hy, 0.05), "palm": (0.4, -0.1, 1)},
                  armR={"dir": (-1, u, -0.07), "elbow": (0, -1, -0.45), "ext": e, "hand": (-0.8, hy, 0.05), "palm": (-0.4, -0.1, 1)},
                  shrug=(1.5, 1.5))
    elif arms == "up":       # both arms thrown overhead in a V
        kw = dict(armL={"dir": (0.42, 1.0, 0.05), "elbow": (1, 0, -0.3)},
                  armR={"dir": (-0.42, 1.0, 0.05), "elbow": (-1, 0, -0.3)})
    elif arms == "salute":   # bao quan li: right fist into the left palm at chest height, elbows out and level
        # P1: wrists at the chest joint's height (were +0.085: on the real figure the open hand covered her chin from the front)
        kw = dict(armL={"rel": (-0.035, 0.0, 0.30), "elbow": (1, 0.05, 0.05), "hand": (-0.25, 1.0, 0.0), "palm": (-1, 0, 0)},
                  armR={"rel": (-0.115, 0.0, 0.30), "elbow": (-1, 0.05, 0.05), "hand": (1, 0.0, 0.0)},
                  shrug=(3.0, 3.0))
    return make_pose(hips=(0, y, 0), footL=(feet, 0.0, 6.0), footR=(-feet, 0.0, -6.0), look=look, spine=spine, **kw)


def gongbu(punch=None, twist=None, depth=0.67, armL=None, armR=None, look=(0, 0, 1), lean=4.0, hips_z=0.04):
    """Left bow stance facing local +Z (left foot forward). punch = 'R' | 'L' | None (straight punch
    along +Z, other fist chambered) | 'palms' (double palm push)."""
    tw = 0.0
    if punch == "R":
        armR = {"dir": (0.04, 0.0, 1.0), "elbow": (-0.3, -1, 0), "ext": 0.99}
        armL = fist_waist(1)
        tw = 38.0
    elif punch == "L":
        armL = {"dir": (-0.04, 0.0, 1.0), "elbow": (0.3, -1, 0), "ext": 0.99}
        armR = fist_waist(-1)
        tw = -30.0
    elif punch == "palms":
        armL = {"dir": (0.10, 0.02, 1.0), "elbow": (0.4, -1, 0), "ext": 0.97, "hand": (0.0, 1.0, 0.25), "palm": (0, 0, 1)}
        armR = {"dir": (-0.10, 0.02, 1.0), "elbow": (-0.4, -1, 0), "ext": 0.97, "hand": (0.0, 1.0, 0.25), "palm": (0, 0, 1)}
    if twist is not None:
        tw = twist
    return make_pose(hips=(0.0, depth, hips_z), spine=(lean, 0.0, tw), look=look,
                     footL=(0.13, 0.50, -4.0), footR=(-0.15, -0.60, -42.0),
                     kneeL=(0.05, 0, 1.0), kneeR=(-0.6, 0, 0.6), armL=armL, armR=armR)


def mabu(armL=None, armR=None, look=(0, 0, 1), depth=0.655, twist=0.0, lean=3.0, width=0.50, roll=0.0, x=0.0):
    """Horse stance facing local +Z."""
    return make_pose(hips=(x, depth, 0.0), spine=(lean, roll, twist), look=look,
                     footL=(width, 0.0, 12.0), footR=(-width, 0.0, -12.0),
                     kneeL=(0.45, 0, 1.0), kneeR=(-0.45, 0, 1.0),
                     armL=fist_waist(1) if armL is None else armL, armR=fist_waist(-1) if armR is None else armR)


def pubu(armL=None, armR=None, look=(1, -0.25, 0.15)):
    """Drop stance: sitting on the right leg, left leg fully extended along local +X, torso low
    over the bent knee, left palm threading along the extended leg, right arm long behind."""
    if armL is None:
        armL = {"to": (0.50, 0.20, 0.14), "elbow": (0, 1, 0.4), "hand": (1, -0.05, 0)}
    if armR is None:
        armR = {"dir": (-0.75, 0.60, -0.25), "elbow": (0, -0.3, -1), "ext": 0.98}
    return make_pose(hips=(-0.20, 0.335, -0.03), yaw=18.0, pitch=10.0, spine=(26.0, 14.0, 20.0), look=look,
                     footL=(0.665, 0.02, -8.0), footR=(-0.36, 0.03, -52.0),
                     kneeL=(0.2, 1.0, 0.25), kneeR=(-0.75, 0.3, 0.9), armL=armL, armR=armR)


def crouch(hand="R", depth=0.40, look=(0, -0.25, 1)):
    """Deep landing crouch, feet apart, one hand to the ground in front, the other arm back."""
    hl = {"to": (0.10, 0.05, 0.46), "elbow": (0.6, 0.2, -0.3), "hand": (0, -1, 0.4)}
    bk = {"dir": (0.35, 0.25, -1.0), "elbow": (0.3, 0.5, -1), "ext": 0.97}
    p = make_pose(hips=(0.0, depth, -0.10), pitch=22.0, spine=(34.0, 0, 0), look=look,
                  footL=(0.27, 0.06, 14.0), footR={"x": -0.25, "z": -0.22, "yaw": -18.0, "heel": 32.0},
                  kneeL=(0.5, 0, 1.0), kneeR=(-0.45, 0, 1.0), armL=bk, armR=mir_arm(hl))
    return p if hand == "R" else mir(p)


def mir_arm(a):
    out = {}
    for k, v in a.items():
        out[k] = (-v[0], v[1], v[2]) if isinstance(v, tuple) else v
    return out


def kick_front(phase, height=1.02, arms=None, fwd=0.0):
    """Front snap kick with the RIGHT leg along local +Z, standing on the left. phase: 'chamber' | 'ext'."""
    armL = fist_waist(1) if arms is None else arms[0]
    armR = fist_waist(-1) if arms is None else arms[1]
    if phase == "chamber":
        fr = {"ankle": (-0.09, 0.55, 0.26 + fwd), "toe": (0, -0.75, 0.65), "top": (0, 0.65, 0.75)}
        return make_pose(hips=(0.03, 0.965, 0.0 + fwd), spine=(-3.0, 0, 0), footL=(0.07, 0.0 + fwd, 14.0),
                         footR=fr, kneeR=(0, 0.3, 1), armL=armL, armR=armR)
    fr = {"ankle": (-0.09, height, 0.80 + fwd), "toe": (0, 0.42, 0.9), "top": (0, 0.9, -0.42)}
    return make_pose(hips=(0.03, 0.975, 0.02 + fwd), pitch=-7.0, spine=(4.0, 0, 0), footL=(0.07, 0.0 + fwd, 14.0),
                     footR=fr, kneeR=(0, 1, 0.2), armL=armL, armR=armR)


def slap_kick(phase):
    """Dan pai jiao: right leg swings straight up in front, right hand slaps the instep at head height."""
    armL = {"dir": (0.9, 0.35, -0.25), "elbow": (0, -0.4, -1), "ext": 0.97}
    if phase == "ext":
        fr = {"ankle": (-0.07, 1.52, 0.52), "toe": (0, 0.85, 0.5), "top": (0, 0.5, -0.85)}
        armR = {"to": (-0.10, 1.60, 0.50), "elbow": (-1, 0.2, 0.0), "hand": (0, -0.2, 1)}
        return make_pose(hips=(0.03, 0.99, 0.04), pitch=-6.0, spine=(6.0, 0, 0), footL={"x": 0.07, "z": 0.0, "yaw": 16.0, "heel": 10.0},
                         footR=fr, kneeR=(0, 1, 0.3), armL=armL, armR=armR, look=(0, 0.1, 1))
    armR = {"dir": (-0.25, 1.0, 0.05), "elbow": (-1, 0, -0.2)}      # hand already raised
    return make_pose(hips=(0.02, 0.97, 0.0), footL=(0.07, 0.0, 16.0), footR={"x": -0.12, "z": -0.42, "yaw": -20.0, "heel": 40.0},
                     kneeR=(-0.2, 0, 1), armL=armL, armR=armR)


def prone(spread=30.0, y=0.105):
    """Flat on the front along local +Z from the feet (near the origin) to the head: legs together,
    arms forward and out by `spread` degrees, palms down, face to the ground."""
    a = math.radians(spread)
    armL = {"dir": (math.sin(a), 1.0 * math.cos(a), 0.04), "elbow": (1, 0, -0.2), "ext": 0.985, "palm": (0, 0, 1)}
    armR = {"dir": (-math.sin(a), 1.0 * math.cos(a), 0.04), "elbow": (-1, 0, -0.2), "ext": 0.985, "palm": (0, 0, 1)}
    fl = {"ankle": (0.075, M.HIPS_H - 0.075 - C.LEG_REACH + 0.002, -0.012), "toe": (0.10, -1.0, 0.18), "top": (0, 0.18, 1.0)}
    fr = {"ankle": (-0.075, M.HIPS_H - 0.075 - C.LEG_REACH + 0.002, -0.012), "toe": (-0.10, -1.0, 0.18), "top": (0, 0.18, 1.0)}
    p = make_pose(hips=(0, M.HIPS_H, 0), footL=fl, footR=fr, kneeL=(0, 0, 1), kneeR=(0, 0, 1), armL=armL, armR=armR,
                  spine=(-3.0, 0, 0), look=(0.0, 0.25, 1.0))
    return C.tilt(p, pitch=90.0, root=(0.0, y, 0.93))


def plank(y=None):
    """Top of a push-up: body straight at a slant, arms straight under the shoulders, toes tucked."""
    armL = {"cdir": (0.10, -0.06, 1.0), "elbow": (1, -0.5, 0), "ext": 0.985, "hand": (0.0, 0.35, 1.0), "palm": (0, -1, 0.3)}
    armR = mir_arm(armL)
    fl = {"ankle": (0.08, M.HIPS_H - 0.075 - C.LEG_REACH + 0.002, 0.0), "toe": (0, -0.25, 1.0), "top": (0, 1.0, 0.25), "toes": (0, 0.55, 0.85)}
    fr = {"ankle": (-0.08, M.HIPS_H - 0.075 - C.LEG_REACH + 0.002, 0.0), "toe": (0, -0.25, 1.0), "top": (0, 1.0, 0.25), "toes": (0, 0.55, 0.85)}
    p = make_pose(hips=(0, M.HIPS_H, 0), footL=fl, footR=fr, kneeL=(0, 0, 1), kneeR=(0, 0, 1), armL=armL, armR=armR, look=(0, -0.2, 1.0))
    p = C.tilt(p, pitch=68.0, root=(0.0, 0.5, 0.86))
    p.root[0, 1] += 0.012 - C.lowest(p)
    return p


def squat(depth=0.37, hands=True):
    """Tight crouch on both feet, hands on the ground in front (the gather before the spring)."""
    if hands:
        armL = {"to": (0.20, 0.045, 0.40), "elbow": (0.8, 0.2, -0.2), "hand": (0, -1, 0.5)}
        armR = mir_arm(armL)
    else:
        armL, armR = fist_waist(1), fist_waist(-1)
    return make_pose(hips=(0.0, depth, -0.13), pitch=30.0, spine=(30.0, 0, 0), look=(0, -0.1, 1),
                     footL={"x": 0.13, "z": 0.0, "yaw": 10.0, "heel": 18.0}, footR={"x": -0.13, "z": 0.0, "yaw": -10.0, "heel": 18.0},
                     kneeL=(0.35, 0, 1.0), kneeR=(-0.35, 0, 1.0), armL=armL, armR=armR)


def pose_sheet():
    """All vocabulary poses side by side (debug)."""
    ps = [stand(), stand("wide"), stand("up"), stand("salute"), gongbu("R"), gongbu("L"), gongbu("palms"),
          mabu(), pubu(), crouch(), kick_front("chamber"), kick_front("ext"), slap_kick("prep"), slap_kick("ext"),
          prone(), plank(), squat()]
    return M.Motion(np.concatenate([p.root for p in ps]), np.concatenate([p.R for p in ps]))


# ----------------------------------------------------------------------------- mocap inserts
_CLIPS = {}


def clip(spec):
    if spec not in _CLIPS:
        _CLIPS[spec] = M.with_events(M.load_clip(spec), strikes=False)
    return _CLIPS[spec].copy()


def window(spec, t_a, t_b, t_key, at=(0.0, 0.0), point="mid", yaw=None, aim=None, t_place=None):
    """Clip [t_a, t_b] of a source, rigidly placed (see choreo_lib.put) using the pose at source
    time t_place (default t_key). Returns (motion, key time inside the window)."""
    src = clip(spec)
    m = M.trim(src, t_a, min(t_b, src.duration))
    tp = (t_key if t_place is None else t_place) - t_a
    m = C.put(m, tp, at=at, yaw=yaw, point=point, aim=aim)
    return m, t_key - t_a


def ankle(p, side):
    P = p.fk()
    a = P[0, M.J["foot" + side]]
    return (float(a[0]), float(a[2]))


def on_foot(p, side, xz):
    """Translate pose p so that its `side` ankle is over ground point xz."""
    a = ankle(p, side)
    return M.transform(p, 0.0, (xz[0] - a[0], 0.0, xz[1] - a[1]))


def strike(tl, prep, hit, t, prep_dur=0.30, hit_dur=0.15, name=None, recoil=0.02, ease="snap", **kw):
    """Chamber (arrives as the strike starts), then the strike arriving exactly on t."""
    if prep is not None:
        tl.to(prep, t - hit_dur, prep_dur, "soft", **kw)
    tl.to(hit, t, hit_dur, ease, name=name, recoil=recoil, **kw)


# Butterfly (CMU 88_06): loaded wind-up 0.78 s, takeoff 1.03, apex 1.23, land 1.48, lowest 1.72.
BF_SPEC, BF_T0, BF_LOAD, BF_APEX, BF_LOW = "cmu:88_06", 0.30, 0.78, 1.23, 1.72


def butterfly_clip():
    """The butterfly placed so that its loaded wind-up stands on the origin (mid-feet) and she
    LANDS facing +Z. Returns (motion, apex time in it, landing centre D = mid-feet at her lowest)."""
    src = clip(BF_SPEC)
    m = M.trim(src, BF_T0, 3.0)
    f_low, f_load = int(round((BF_LOW - BF_T0) * 60)), int(round((BF_LOAD - BF_T0) * 60))
    m = M.transform(m, -M.heading(m, f_low))
    m = C.put(m, BF_LOAD - BF_T0, at=(0.0, 0.0), point="mid")
    P = m.fk()
    d = 0.5 * (P[f_low, M.J["footL"]] + P[f_low, M.J["footR"]])
    return m, BF_APEX - BF_T0, (float(d[0]), float(d[2]))


def coil_pose():
    """The loaded wind-up of the butterfly: the build ends in it, the drop starts in it."""
    m, k, d = butterfly_clip()
    return C.pose_of(m, int(round((BF_LOAD - BF_T0) * 60)))


# ----------------------------------------------------------------------------- BUILD (bars 73-88)
def mid_feet(p, f=0):
    P = p.fk()
    c = 0.5 * (P[f, M.J["footL"]] + P[f, M.J["footR"]])
    return (float(c[0]), float(c[2]))


def _kick(tl, spec, t_a, t_in, t_apex, t_b, t_song, kick_side, aim_deg=0.0, blend=0.28, at=None, flip=False, name=None):
    """Lay a mocap kick so that its apex (source time t_apex) lands on t_song, pointing along stage
    yaw aim_deg. It starts where she stands when the fade-in begins (or at `at`), so the fade only
    turns her. flip mirrors the source left-right (kick_side is the leg AFTER mirroring)."""
    src = clip(spec)
    if flip:
        src = M.mirror(src)
    m = M.trim(src, t_a, min(t_b, src.duration))
    k = t_apex - t_a
    m = C.put(m, k, aim=("hips", "foot" + kick_side, aim_deg))
    t_first = t_song - k
    t_fade = t_first + (t_in - t_a)
    here = mid_feet(tl.pose_at(t_fade - blend)) if at is None else at
    m = C.put(m, t_in - t_a, at=here, point="mid")
    tl.clip(m, t_first, t_fade, blend_in=blend)
    if name:
        tl.mark(t_song, name)


@recipe("build")
def build():
    """Bars 73-88 (27.83 s): basics on the beat, four high kicks, the top-down fan and spin, two
    turning punches, the slow sink into the coil. song_t0 = bar 73."""
    t0, t1 = bt(73), bt(89)
    tl = C.Timeline(t0, t1, crouch("R"))
    X = 90.0          # facing stage +X
    # b73.3 step-punch: rise out of the landing into a left bow stance toward +X, right straight punch
    g1 = (0.22, 0.0)
    strike(tl, S(gongbu(twist=-22.0, depth=0.74, look=(0, 0, 1)), X, g1), S(gongbu("R"), X, g1), bt(73, 3),
           prep_dur=0.34, name="punch")
    # b74.1 block: horse stance to the front, left forearm block over the head, eyes right
    mb = (0.12, 0.0)
    jia = {"rel": (0.10, 0.50, 0.20), "elbow": (1, 0.25, 0.1), "hand": (-1, 0.25, 0)}
    tl.to(S(mabu(armL=jia, look=(-1, 0, 0.15)), 0.0, mb), bt(74, 1), 0.22, "snap", name="block", recoil=0.02)
    # b74.3 punch: right fist straight out to the right
    side_r = {"dir": (-1, 0.0, 0.03), "elbow": (0, -1, -0.2), "ext": 0.99}
    tl.to(S(mabu(armL=fist_waist(1), armR=side_r, look=(-1, 0, 0.05), twist=-8.0), 0.0, mb), bt(74, 3), 0.15, "snap",
          name="punch", recoil=0.02)
    # b75.1 turn + low block: right bow stance toward -X, right arm sweeps down over the knee
    g2 = (-0.10, 0.0)
    low = {"dir": (0.14, -0.74, 0.62), "elbow": (1, 0, -0.3), "ext": 0.985}
    tl.to(S(mir(gongbu(twist=-14.0, armL=low, armR=fist_waist(-1))), -X, g2), bt(75, 1), 0.24, "snap", name="low_block", recoil=0.02)
    # b75.3 punch: left straight punch
    tl.to(S(mir(gongbu("R")), -X, g2), bt(75, 3), 0.15, "snap", name="punch", recoil=0.02)
    # b76.1 front snap kick with the rear (left) leg toward -X, standing on the right
    sup = ankle(S(mir(gongbu("R")), -X, g2), "R")
    kc = on_foot(S(mir(kick_front("chamber")), -X), "R", sup)
    ke = on_foot(S(mir(kick_front("ext")), -X), "R", sup)
    tl.to(kc, bt(76, 1) - 0.15, 0.30, "soft")
    tl.to(ke, bt(76, 1), 0.15, "snap", name="front_kick", free="L")
    tl.to(kc, bt(76, 1) + 0.17, 0.17, "out", free="L")
    # b76.3 plant: feet together at the centre, fists at the waist, facing front
    tl.to(stand(), bt(76, 3), 0.36, "snap", name="plant")

    # b77-80 high kicks toward +Z (profile for a side camera)
    # (front, back, front, back: the body keeps one facing, the kicks alternate, the drift cancels)
    _kick(tl, "cmu:135_11", 4.00, 4.42, 5.07, 5.95, bt(77), "R", 0.0, blend=0.40, at=(0.0, -0.55), name="side_kick")
    _kick(tl, "cmu:135_07", 2.80, 3.12, 3.68, 4.75, bt(78), "R", 180.0, flip=True, name="roundhouse")
    _kick(tl, "cmu:135_11", 12.10, 12.47, 13.15, 14.00, bt(79), "L", 0.0, name="side_kick")
    _kick(tl, "accad:Male2_G4_SpinningBackKick", 0.02, 0.36, 1.20, 2.25, bt(80), "L", 180.0, name="spin_back_kick")
    tl.to(stand(), bt(80, 4) + 0.22, 0.50, "smooth")

    # b81 the fan: palms shoot forward together, then open flat out to the sides
    fwd = {"dir": (0.05, 0.0, 1.0), "elbow": (0.6, -1, 0), "ext": 0.985}
    tl.to(make_pose(hips=(0, M.HIPS_H - 0.03, 0.02), footL=(0.085, 0, 6), footR=(-0.085, 0, -6), spine=(6, 0, 0),
                    armL=fwd, armR=mir_arm(fwd)), bt(81, 1), 0.17, "snap", name="fan_front", recoil=0.02)
    tl.to(stand("wide", spine=(-4, 0, 0)), bt(81, 3), 0.62, "smooth", name="fan_open")
    # b82 a full turn on the left foot, arms out, the right foot tucked to the knee
    def spin(deg, arms="wide", y=0.975):
        fr = {"ankle": (-0.10, 0.36, 0.10), "toe": (0, -0.9, 0.3), "top": (0, 0.3, 0.9)}
        kw = dict(armL={"dir": (1, 0.03, 0.0), "elbow": (0, -0.2, -1)}, armR={"dir": (-1, 0.03, 0.0), "elbow": (0, -0.2, -1)})
        if arms == "cross":
            kw = dict(armL={"rel": (-0.10, 0.02, 0.22), "elbow": (1, -0.6, 0.1)}, armR={"rel": (0.10, 0.06, 0.25), "elbow": (-1, -0.6, 0.1)})
        p = make_pose(hips=(0.0, y, 0.0), footL={"x": 0.0, "z": 0.0, "yaw": 0.0, "heel": 22.0}, footR=fr, kneeR=(-0.9, 0, 0.5), **kw)
        return S(p, deg)
    q = (bt(82, 4) - bt(82, 1)) / 4
    tl.to(spin(0.0), bt(82, 1), 0.36, "soft")
    for i in range(1, 5):
        tl.to(spin(-90.0 * i, "wide" if i < 4 else "cross", 0.975 if i < 4 else 0.94), bt(82, 1) + q * i, q,
              "lin" if 1 < i < 4 else ("in" if i == 1 else "out"), name="spin" if i == 2 else None)
    # b83.1 wide horse stance, both palms thrown out
    out_l = {"dir": (1, 0.0, 0.06), "elbow": (0, -1, -0.2), "ext": 0.985, "hand": (0.35, 1, 0), "palm": (1, 0, 0)}
    tl.to(mabu(armL=out_l, armR=mir_arm(out_l), width=0.56, depth=0.63), bt(83, 1), 0.2, "snap", name="mabu_open", recoil=0.02)
    # b84 draw in
    tl.to(mabu(width=0.56, depth=0.66), bt(84, 1), 0.5, "smooth")
    tl.to(stand(), bt(84, 3), 0.6, "smooth", name="draw_in")
    # b85 two stepping punches: left bow stance toward +X, then turn into the right bow stance toward -X
    g3 = (0.05, 0.0)
    strike(tl, S(gongbu(twist=-22.0, depth=0.72), X, g3), S(gongbu("R"), X, g3), bt(85, 1), prep_dur=0.30, name="punch")
    strike(tl, S(mir(gongbu(twist=-22.0, depth=0.72)), -X, g3), S(mir(gongbu("R")), -X, g3), bt(85, 3), prep_dur=0.30, name="punch")
    # b86-88 the gather: a high open horse stance on the diagonal, sinking for two bars, arms drawing in,
    # head lowering; then she winds into the loaded pose of the butterfly and is still.
    coil = coil_pose()
    cf = math.degrees(M.heading(coil, 0))            # coil heading (about -49 deg)
    hi = {"dir": (0.9, 0.42, 0.25), "elbow": (0, -1, -0.3), "ext": 0.97, "hand": (0.6, 0.8, 0)}
    tl.to(S(mabu(armL=hi, armR=mir_arm(hi), depth=0.80, width=0.40, lean=0.0, look=(0, 0.15, 1)), cf - 12.0, (0.0, 0.0)),
          bt(86, 3), 0.95, "smooth", name="gather")
    dr = {"rel": (0.30, -0.10, 0.16), "elbow": (1, -0.3, -0.5)}
    tl.to(S(mabu(armL=dr, armR=mir_arm(dr), depth=0.70, width=0.40, lean=8.0, look=(0, -0.15, 1)), cf - 12.0, (0.0, 0.0)),
          bt(87, 3), 1.70, "soft")
    tl.to(S(mabu(depth=0.62, width=0.40, lean=14.0, look=(0, -0.45, 1)), cf - 12.0, (0.0, 0.0)), bt(88, 1) + 0.1, 0.95, "soft", name="sink")
    tl.to(coil, bt(88, 3), 0.62, "smooth", name="coil")
    m = tl.result()
    m.meta.update({"center": [0.0, 0.0], "end_pose": "coil (= drop frame 0)"})
    return m


# ----------------------------------------------------------------------------- DROP (bars 89-104)
def reach(pitch=0.0, root=None, spread=12.0, toe=(0.0, 0.37, 0.91)):
    """Straight body, legs straight, feet pointed, arms reaching past the head (the dive);
    pitch tips it forward about the hips."""
    a = math.radians(spread)
    armL = {"dir": (math.sin(a), math.cos(a), 0.30), "elbow": (1, 0, -0.3), "ext": 0.95, "palm": (0, 0, 1)}
    armR = mir_arm(armL)
    ay = M.HIPS_H - 0.075 - C.LEG_REACH + 0.002
    top = (0.0, toe[2], -toe[1])        # toe = foot direction BEFORE the tilt (dorsiflexed: the balls stay on the ground)
    fl = {"ankle": (0.08, ay, 0.0), "toe": toe, "top": top}
    fr = {"ankle": (-0.08, ay, 0.0), "toe": toe, "top": top}
    p = make_pose(hips=(0, M.HIPS_H, 0), footL=fl, footR=fr, kneeL=(0, 0, 1), kneeR=(0, 0, 1), armL=armL, armR=armR, look=(0, 0.3, 1.0))
    return C.tilt(p, pitch=pitch, root=root) if pitch else p


def _fall(tl, t, c=(0.0, 0.0)):
    """The group fall: from standing at c, a straight-bodied dive along +Z, flat ON t, dead still."""
    cx, cz = c
    up = M.transform(make_pose(hips=(0, M.HIPS_H + 0.035, 0.03), footL={"x": 0.085, "z": 0, "yaw": 6, "heel": 24.0},
                               footR={"x": -0.085, "z": 0, "yaw": -6, "heel": 24.0},
                               armL={"dir": (0.25, 0.25, 1.0), "elbow": (1, -0.5, 0), "ext": 0.9},
                               armR={"dir": (-0.25, 0.25, 1.0), "elbow": (-1, -0.5, 0), "ext": 0.9}, look=(0, 0.1, 1)),
                     0.0, (cx, 0, cz))
    dive = M.transform(reach(46.0, (0.0, 0.715, 0.635)), 0.0, (cx, 0, cz))
    flat = M.transform(prone(), 0.0, (cx, 0, cz))
    tl.to(up, t - 0.50, 0.20, "soft", name="fall_start")           # the breath in: up on the toes, arms float forward
    tl.to(dive, t - 0.16, 0.34, "in", lift=0.0)
    tl.to(flat, t, 0.16, "lin", name="fall", lift=0.0)
    tl.still(t, t + C.BAR - 0.26)                    # completely still through the bar
    return flat


def _rise(tl, t_push, t_crouch, t_up, c=(0.0, 0.0)):
    cx, cz = c
    pl = M.transform(plank(), 0.0, (cx, 0, cz))
    sq = M.transform(squat(), 0.0, (cx, 0, cz))
    tall = M.transform(make_pose(hips=(0, M.HIPS_H + 0.045, 0), footL={"x": 0.085, "z": 0, "yaw": 6, "heel": 30.0},
                                 footR={"x": -0.085, "z": 0, "yaw": -6, "heel": 30.0}, spine=(-4.0, 0, 0),
                                 armL={"cdir": (0.22, -1.0, -0.22), "ext": 0.985, "elbow": (0.3, 0, -1)},
                                 armR={"cdir": (-0.22, -1.0, -0.22), "ext": 0.985, "elbow": (-0.3, 0, -1)}, look=(0, 0.12, 1)),
                       0.0, (cx, 0, cz))
    tl.to(pl, t_push, 0.24, "snap", name="push_up", lift=0.0)
    tl.to(sq, t_crouch, 0.42, "smooth", name="crouch", lift=0.25, lift_max=0.06, hop=0.16)
    tl.to(tall, t_up, 0.20, "snap", name="rise")
    tl.to(M.transform(stand("down"), 0.0, (cx, 0, cz)), t_up + 0.30, 0.26, "soft")


@recipe("drop")
def drop():
    """Bars 89-104 (song_t0 = bar 89 - 1.5 s): butterfly apex on the drop, the unison phrase of her
    real set, travelling phrases, THE GROUP FALL on bar 97, rise as one, arms wide, last phrase,
    jump double kick, salute. Performed around meta.center (where the butterfly lands)."""
    return _drop()


@recipe("drop_join")
def drop_join():
    """`drop` for the thousand while the hero's butterfly is a solo (M3): same clock, same place. Holds
    the coil (breathing) to b89.3 (154.04), sinks (anticipation, 0.24 s), leaps the butterfly's travel
    (1.5 m, 0.48 s) into the bow-stance chamber and punches on b90.1 with `drop`; from 154.758 on it
    IS `drop`, frame for frame."""
    return _drop(join=True)


def _drop(join=False):
    bf, k_apex, D = butterfly_clip()
    t0, t1 = bt(89) - 1.5, bt(105)
    X = 90.0
    coil = coil_pose()
    cf = math.degrees(M.heading(coil, 0))
    # identical to the end of `build`, so the show can switch tracks anywhere in 151.67-152.70
    tl = C.Timeline(t0, t1, S(mabu(depth=0.62, width=0.40, lean=14.0, look=(0, -0.45, 1)), cf - 12.0, (0.0, 0.0)))
    tl.to(coil, bt(88, 3), 0.62, "smooth", name="coil")

    def Sd(p, facing=0.0, at=(0.0, 0.0)):
        return S(p, facing, (D[0] + at[0], D[1] + at[1]))

    g = (0.30, 0.0)
    chamber, punch = Sd(gongbu(twist=-22.0, depth=0.74), X, g), Sd(gongbu("R"), X, g)
    if not join:
        t_first = bt(89) - k_apex
        t_load = t_first + (BF_LOAD - BF_T0)
        tl.clip(bf, t_first, t_load + 0.10, blend_in=0.10)        # out of stillness: she catches the clip up in 6 frames
        tl.mark(bt(89), "butterfly_apex")
        # she sticks the landing: low, one hand to the ground, head up, still (b89.3)
        tl.to(Sd(crouch("R", look=(0, 0.0, 1)), 0.0, (0.03, 0.03)), bt(89, 3), 0.24, "soft", name="land_low", lift=0.0)
        # b90.1 bow stance + straight punch toward +X
        strike(tl, chamber, punch, bt(90, 1), prep_dur=0.34, name="gongbu_punch")
    else:
        # the thousand: the coil is held (breath) through the hero's solo; on b89.3 they sink and load
        # (anticipation), leap the butterfly's travel into the chamber, and the punch is `drop`'s own
        t_go, t_ch = bt(89, 3), bt(90, 1) - 0.15
        way = M.unit(np.array([chamber.root[0, 0] - coil.root[0, 0], 0.0, chamber.root[0, 2] - coil.root[0, 2]]))
        Pc = coil.fk()[0]
        load = coil.copy()
        load.root = coil.root - 0.09 * way[None] + np.array([[0.0, -0.085, 0.0]])
        for sd in "LR":
            load = M.leg_ik(load, sd, Pc[None, M.J["foot" + sd]])
        load = M.additive(M.additive(load, "spine", np.radians([[7.0, 0, 0]])), "chest", np.radians([[7.0, 0, 0]]))
        tl.to(load, t_go + 0.24, 0.24, "soft", name="join_load", lift=0.0)
        tl.to(chamber, t_ch, t_ch - (t_go + 0.24), "soft", name="join_leap", hop=0.13, lift=0.3, lift_max=0.20, feet_lead=0.14)
        tl.to(punch, bt(90, 1), 0.15, "snap", name="gongbu_punch", recoil=0.02)
    # b90.3 pubu: the front leg stays, she drops onto the back leg, left palm threads down the leg
    pb = Sd(pubu(), 0.0, (0.0, 0.0))
    fl = ankle(Sd(gongbu("R"), X, g), "L")
    pb = on_foot(pb, "L", (fl[0] + 0.06, fl[1]))
    tl.to(pb, bt(90, 3), 0.30, "hit", name="pubu")
    # b91.1 back up into the bow stance: right palm pushes, left arm hooks long behind
    push = {"dir": (0.05, 0.02, 1.0), "elbow": (-0.4, -1, 0), "ext": 0.985, "hand": (0, 1, 0.25), "palm": (0, 0, 1)}
    hook = {"dir": (0.10, 0.22, -1.0), "elbow": (0.5, -1, 0), "ext": 0.985}
    tl.to(Sd(gongbu(twist=30.0, armL=hook, armR=push), X, g), bt(91, 1), 0.28, "snap", name="gongbu_push", recoil=0.02)
    # b91.3 feet together, both arms whip overhead, head snaps left
    st = Sd(stand("up", look=(1, 0.12, 0.35)), 0.0, (0.82, -0.10))
    tl.to(st, bt(91, 3), 0.30, "snap", name="arms_overhead", recoil=0.015, lift_max=0.10)
    # b92 turn to -X, slap kick on b92.3
    supL = ankle(st, "L")
    sp = on_foot(S(slap_kick("prep"), -X), "L", supL)
    se = on_foot(S(slap_kick("ext"), -X), "L", supL)
    tl.to(sp, bt(92, 2) + 0.02, 0.42, "smooth", name="turn")
    tl.to(se, bt(92, 3), 0.30, "snap", name="slap_kick", free="R")
    # b93.1 the kicking leg lands forward into the right bow stance toward -X, left punch
    g1 = on_foot(S(mir(gongbu("R")), -X), "L", supL)
    g1p = on_foot(S(mir(gongbu(twist=-22.0, depth=0.74)), -X), "L", supL)
    strike(tl, g1p, g1, bt(93, 1), prep_dur=0.40, name="step_punch")
    # b93.3 step through into the left bow stance toward -X, right punch
    supR = ankle(g1, "R")
    g2 = on_foot(S(gongbu("R"), -X), "R", supR)
    g2p = on_foot(S(gongbu(twist=-22.0, depth=0.76), -X), "R", supR)
    strike(tl, g2p, g2, bt(93, 3), prep_dur=0.42, name="step_punch", lift_max=0.12)
    # b94.1 turning jump (apex on the downbeat); b94.3 second drop stance, left leg toward +X
    xl = -0.80                                           # where the extended left foot will be (stage x from centre)
    pb2 = on_foot(Sd(pubu(), 0.0, (0.0, 0.0)), "L", (D[0] + xl, D[1] + 0.0))
    hi2 = on_foot(Sd(mabu(depth=0.80, width=0.52, armL={"dir": (1, 0.25, 0.1), "elbow": (0, -1, -0.2)},
                          armR={"dir": (-1, 0.25, 0.1), "elbow": (0, -1, -0.2)}, x=-0.02), 0.0), "L", ankle(pb2, "L"))
    hx = 0.5 * (M.fk(g2.root, g2.R)[0, 0, 0] + M.fk(hi2.root, hi2.R)[0, 0, 0])
    air = make_pose(hips=(0, 1.27, 0), footL={"ankle": (0.16, 0.70, 0.06), "toe": (0, -0.9, 0.4), "top": (0, 0.4, 0.9)},
                    footR={"ankle": (-0.16, 0.74, -0.04), "toe": (0, -0.9, 0.4), "top": (0, 0.4, 0.9)},
                    kneeL=(0.4, 0, 1), kneeR=(-0.4, 0, 1), spine=(4, 0, 12),
                    armL={"dir": (0.75, 0.75, 0.0), "elbow": (0, -1, -0.3)}, armR={"dir": (-0.75, 0.75, 0.0), "elbow": (0, -1, -0.3)})
    air = S(air, -45.0, (hx, D[1]))
    load = C.mix(g2, on_foot(S(gongbu(twist=0.0, depth=0.60, armL=fist_waist(1), armR=fist_waist(-1)), -X), "R", supR), 1.0)
    ta = bt(94, 1)
    tl.to(load, ta - 0.25, 0.22, "soft")
    tl.to(air, ta, 0.27, "launch", name="jump", lift=0.0, free="LR")
    tl.to(hi2, ta + 0.25, 0.25, "in", lift=0.0)
    tl.to(pb2, bt(94, 3), 0.28, "hit", name="pubu")
    # b95.1, b95.3, b96.1 three front snap kicks travelling toward +X (R, L, R)
    stride = 0.45
    s1 = ankle(pb2, "L")
    seq = [("R", "L", s1), ("L", "R", (s1[0] + stride, s1[1])), ("R", "L", (s1[0] + 2 * stride, s1[1]))]
    for i, (kick_leg, sup_leg, spot) in enumerate(seq):
        t = (bt(95, 1), bt(95, 3), bt(96, 1))[i]
        base_c, base_e = kick_front("chamber"), kick_front("ext", height=1.05)
        if kick_leg == "L":
            base_c, base_e = mir(base_c), mir(base_e)
        kc = on_foot(S(base_c, X), sup_leg, spot)
        ke = on_foot(S(base_e, X), sup_leg, spot)
        tl.to(kc, t - 0.15, 0.40 if i == 0 else 0.34, "soft", lift_max=0.10)
        tl.to(ke, t, 0.15, "snap", name="snap_kick", free=kick_leg)
        tl.to(kc, t + 0.16, 0.16, "out", free=kick_leg)
        # the kicking foot steps down ahead; the weight follows
        nxt = (spot[0] + stride, spot[1])
        kwf = {"foot" + kick_leg: (nxt[0] - spot[0], 0.0, 0.0), "foot" + sup_leg: (0.0, 0.0, 0.0)}
        step = make_pose(hips=((nxt[0] - spot[0]) * 0.55, M.HIPS_H - 0.03, 0.0), yaw=X, armL=fist_waist(1), armR=fist_waist(-1),
                         footL={"x": kwf["footL"][0], "z": 0.085, "yaw": X + 4}, footR={"x": kwf["footR"][0], "z": -0.085, "yaw": X - 4},
                         look=(1, 0, 0))
        step = on_foot(step, sup_leg, spot)
        tl.to(step, t + 0.42, 0.24, "soft")
    # b96.3 set: feet together at the centre, front
    c = D
    tl.to(Sd(stand()), bt(96, 3), 0.34, "snap", name="set")
    # b97.1 THE FALL, held through the bar; b98.1 push up, b98.3 crouch, b99.1 spring up; b100.1 arms wide
    _fall(tl, bt(97), c)
    _rise(tl, bt(98, 1), bt(98, 3), bt(99, 1), c)
    tl.to(Sd(stand("open", spine=(-5, 0, 0), look=(0, 0.16, 1))), bt(100), 0.17, "snap", name="arms_wide", recoil=0.015)
    tl.to(Sd(stand("open2", spine=(-8, 0, 0), look=(0, 0.30, 1))), bt(100, 3.7), 1.05, "soft")          # r4: the hold lives: it keeps opening and lifting until the next phrase takes it
    # b101.1 / b101.3 / b102.1 horse stance punches: right to the side, left to the side, right to the front
    sr = {"dir": (-1, 0.0, 0.03), "elbow": (0, -1, -0.2), "ext": 0.99}
    sl = {"dir": (1, 0.0, 0.03), "elbow": (0, -1, -0.2), "ext": 0.99}
    fr = {"dir": (0.06, 0.0, 1.0), "elbow": (-0.3, -1, 0), "ext": 0.99}
    mo = (-0.50, 0.0)        # the horse stance sits half a metre to her right, so that the jump brings her back
    strike(tl, Sd(mabu(look=(-1, 0, 0.1)), 0.0, mo), Sd(mabu(armR=sr, look=(-1, 0, 0.05), twist=-8.0), 0.0, mo), bt(101, 1),
           prep_dur=0.45, name="mabu_punch")
    tl.to(Sd(mabu(armL=sl, look=(1, 0, 0.05), twist=8.0), 0.0, mo), bt(101, 3), 0.15, "snap", name="mabu_punch", recoil=0.02)
    tl.to(Sd(mabu(armR=fr, look=(0, 0, 1), twist=32.0), 0.0, mo), bt(102, 1), 0.15, "snap", name="mabu_punch", recoil=0.02)
    # b102.3 right bow stance toward -X, double palm push
    mL = ankle(Sd(mabu(), 0.0, mo), "L")
    gp = on_foot(S(mir(gongbu("palms")), -X), "L", mL)
    chamber = {"rel": (0.17, -0.10, 0.10), "elbow": (0.4, -0.2, -1), "hand": (0, 0.6, 1)}
    gpp = on_foot(S(mir(gongbu(twist=0.0, depth=0.72, armL=chamber, armR=mir_arm(chamber))), -X), "L", mL)
    strike(tl, gpp, gp, bt(102, 3), prep_dur=0.28, name="double_palm")
    # b103.1 jump double kick (CMU 90_05), the high left kick ON the downbeat; she travels toward +X
    src = clip("cmu:90_05")
    JA, JIN, JK, JLOW, JB = 1.55, 1.85, 2.42, 2.80, 3.30
    jm = M.trim(src, JA, JB)
    P = jm.fk()
    f_in, f_low = int(round((JIN - JA) * 60)), int(round((JLOW - JA) * 60))
    d = P[f_low, 0] - P[f_in, 0]
    jm = M.transform(jm, math.radians(90.0) - math.atan2(d[0], d[2]))
    t_first = bt(103) - (JK - JA)
    t_fade = t_first + (JIN - JA)
    jm = C.put(jm, JIN - JA, at=mid_feet(tl.pose_at(t_fade - 0.2)), point="mid")
    tl.clip(jm, t_first, t_fade, blend_in=0.20)
    tl.mark(bt(103), "jump_kick")
    # b103.3 final low pose: drop stance on the landing (right) foot, left leg long toward +X
    jl = C.pose_of(jm, f_low)
    fin = on_foot(S(pubu(look=(0.3, 0.0, 1.0))), "R", ankle(jl, "R"))
    tl.to(fin, bt(103, 3), 0.30, "hit", name="final_low")
    # b104.1 stand and salute (bao quan li), held to the end
    tl.to(Sd(stand()), bt(104) - 0.15, 0.40, "smooth", lift_max=0.08)
    tl.to(Sd(stand("salute")), bt(104), 0.15, "snap", name="salute", recoil=0.01)
    m = tl.result()
    m.meta.update({"center": [round(D[0], 3), round(D[1], 3)], "start_pose": "coil (= build's last pose)",
                   "handoff": "identical to `build` on 151.67-152.70 s"})
    m.meta.update(BEST_YAW)
    if join:
        m.meta.update({"join": "holds the coil to 154.04 (b89.3), loads, leaps to the chamber; identical to `drop` from 154.758 (track t %.3f)" % (bt(90, 1) - 0.15 - t0),
                       "same_as_drop_from": round(bt(90, 1) - 0.15 - t0, 4)})
    return m


# P1 (judged on the real figure against the sun, fable/notes/P1_qa.md): the yaw that makes the butterfly the best silhouette.
# Degrees, added to the yaw at which her track +Z faces the camera: fig.yaw = yaw_facing_camera + best_yaw * pi / 180
# (camera looking east at the sun: fig.yaw = -pi/2 + best_yaw). At 165 she performs TOWARD the sun, her back to the lens:
# the legs open as a V before the apex (153.02-153.10), the apex is a clean horizontal body inside the sun disc.
BEST_YAW = {"best_yaw": 165.0, "best_yaw_alt": 0.0, "salute_yaw": 60.0,   # the salute is hidden from behind (hair, body): show it 3/4 front (60 or 300) or frontal
            "best_yaw_note": "deg from facing the camera; 165 = performs toward the sun (camera behind her); alt 0 = facing the lens (wider V at 153.05, weaker apex frame)"}


# ----------------------------------------------------------------------------- short reusable tracks
@recipe("fall_only")
def fall_only():
    """The group fall alone, at the origin: set (1 s), dive, flat ON bar 97.1, still through the bar,
    push up (98.1), crouch (98.3), spring up (99.1), stand. song_t0 = bar 97 - 1.5 s."""
    t0, t1 = bt(97) - 1.5, bt(100)
    tl = C.Timeline(t0, t1, stand())
    _fall(tl, bt(97))
    _rise(tl, bt(98, 1), bt(98, 3), bt(99, 1))
    tl.to(stand("down"), bt(99, 3), 0.3, "soft")
    return tl.result()


@recipe("salute_only")
def salute_only():
    """Standing, fists at the waist; bao quan salute at t = 1.0 s, held (4 s in all)."""
    tl = C.Timeline(0.0, 4.0, stand())
    tl.to(stand("salute"), 1.0, 0.15, "snap", name="salute", recoil=0.01)
    m = tl.result()
    m.meta.pop("song_t0", None)
    m.meta.pop("accents", None)
    return m


@recipe("butterfly_only")
def butterfly_only():
    """Coil (held 1 s), butterfly kick with the apex at t = 1.5 s, stuck low landing, stand.
    Starts on the origin, lands on meta.center."""
    bf, k_apex, D = butterfly_clip()
    tl = C.Timeline(0.0, 4.2, coil_pose())
    t_first = 1.5 - k_apex
    tl.clip(bf, t_first, t_first + (BF_LOAD - BF_T0) + 0.10, blend_in=0.10)
    tl.mark(1.5, "butterfly_apex")
    tl.to(S(crouch("R", look=(0, 0.0, 1)), 0.0, (D[0] + 0.03, D[1] + 0.03)), 1.5 + 2 * C.BEAT, 0.24, "soft", name="land_low", lift=0.0)
    tl.to(S(stand(), 0.0, D), 3.6, 0.55, "smooth")
    m = tl.result()
    m.meta.pop("song_t0", None)
    m.meta.pop("accents", None)
    m.meta["center"] = [round(D[0], 3), round(D[1], 3)]
    m.meta.update(BEST_YAW)
    return m
