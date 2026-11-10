"""Utility performances (fable/CHOREO.md section A). Workstream M1; notes in fable/notes/M1_util.md.

Capture supplies the dynamics wherever a clip exists (runs, the stop, the sit-down, sitting, skips,
leaps); the specific gestures are layered with IK (M.arm_ik, M.look_at ...) or authored with
M.Poser + M.keyframes, then given breath and drift so nothing reads as keyframed.
Song-timed tracks carry meta.song_t0 (song time of frame 0); the show plays time = t - song_t0.
"""
from __future__ import annotations

import functools
import math

import numpy as np
from scipy.interpolate import PchipInterpolator

import motion as M
import recipes_basic as B

RECIPES = {}
J = M.J
BEAT = 60.0 / 138.0
BAR = 4 * BEAT


def bar(n, beat=1.0):
    """Song time of bar n, beat b (1-based)."""
    return 0.126 + (n - 1) * BAR + (beat - 1.0) * BEAT


def recipe(name):
    def deco(fn):
        RECIPES[name] = fn
        return fn
    return deco


# ----------------------------------------------------------------------------- shared pieces
@functools.lru_cache(maxsize=None)
def _idle():
    return B.idle()


@functools.lru_cache(maxsize=None)
def _sprint():
    return B.sprint_loop()


@functools.lru_cache(maxsize=None)
def _run():
    return B.run_loop()


@functools.lru_cache(maxsize=None)
def _walk():
    return B.walk_loop()


@functools.lru_cache(maxsize=None)
def _clip(spec):
    return M.load_clip(spec)


def idle_seg(dur, t0=3.0):
    """`dur` seconds of the idle loop as an open clip, standing at the origin facing +Z."""
    cy = _idle()
    m = M.trim(M.tile(cy, int(math.ceil((t0 + dur) / 20.0)) + 1), t0, t0 + dur)
    m.loop, m.events, m.meta = False, [], {}
    return M.place(m, 0, 0.0, (0.0, 0.0))


def hand_path(m, side, keys, weight, fingers=None, palm=None, pole=None):
    """Arm IK overlay along a smooth path. keys = [(t, (x, y, z) world)...] (PCHIP per axis);
    weight (F,). fingers/palm: constant world directions or [(t, dir)...] key lists."""
    t = m.times
    kt = np.array([k[0] for k in keys])
    kp = np.array([k[1] for k in keys], dtype=np.float64)
    tgt = PchipInterpolator(kt, kp, axis=0)(np.clip(t, kt[0], kt[-1]))

    def dirs(v):
        if v is None:
            return None
        if isinstance(v, list):
            vt = np.array([k[0] for k in v])
            vv = np.array([M.unit(np.asarray(k[1], dtype=np.float64)) for k in v])
            return M.unit(PchipInterpolator(vt, vv, axis=0)(np.clip(t, vt[0], vt[-1])))
        return np.broadcast_to(M.unit(np.asarray(v, dtype=np.float64)), (m.frames, 3))
    f, pl = dirs(fingers), dirs(palm)
    if isinstance(pole, list):
        pole = dirs(pole)
    hr = None
    if f is not None:
        hr = np.stack([M.hand_frame(side, f[i], pl[i]) for i in range(m.frames)])
    return M.arm_ik(m, side, tgt, weight, pole=pole, hand_R=hr), tgt


def spine_turn(m, yaw=None, pitch=None, roll=None):
    """Additive torso rotation (radians, (F,)), shared between spine and chest."""
    z = np.zeros(m.frames)
    rv = np.stack([z if pitch is None else pitch, z if yaw is None else yaw, z if roll is None else roll], 1)
    out = M.additive(m, "spine", 0.45 * rv)
    return M.additive(out, "chest", 0.55 * rv)


def lookback(m, t_go, t_hold, t_back=None, t_end=None, twist=28.0, yaw=-152.0, seated=False, arm=True):
    """The shared look-back over the right shoulder (same shape as recipes_basic.lookback). Holds to
    the end of the clip when t_back is None."""
    t = m.times
    if t_back is None:
        w = M.smootherstep((t - t_go) / (t_hold - t_go))
        w_hip = M.smootherstep((t - t_go + 0.10) / (t_hold - t_go))
    else:
        w = M.ramp(t, t_go, t_hold, t_back, t_end)
        w_hip = M.ramp(t, t_go - 0.10, t_hold - 0.10, t_back + 0.15, t_end + 0.15)
    k = min(m.frames - 1, int(t_go * m.fps))
    h0 = M.heading(m, k)
    out = m
    if seated:
        out = spine_turn(out, yaw=-math.radians(twist * 1.2) * w_hip)
    else:
        out = M.twist_pelvis(out, -math.radians(twist) * w_hip)
    P = out.fk()
    a = h0 + math.radians(yaw)
    tgt = P[:, J["head"]] + np.array([math.sin(a) * 6.0, -0.15, math.cos(a) * 6.0])
    out = M.look_at(out, tgt, w, max_deg=118.0)
    if not seated:
        Q = M.rot_y(h0)
        shift = np.stack([-0.035 * w_hip, -0.012 * w_hip, -0.02 * w_hip], 1) @ Q.T
        out = M.shift_root(out, shift, keep_feet=True)
        if arm:
            out = M.additive(out, "upArmL", np.stack([0 * w, 0 * w, -math.radians(7.0) * w], 1))
        out = M.ground_clamp(out, floor=0.0)
    return out


def stop_time(m, t_from, v=0.22):
    """First time after t_from at which the hips' ground speed has dropped below v for good."""
    sp = np.linalg.norm(np.gradient(m.root[:, [0, 2]], 1.0 / m.fps, axis=0), axis=1)
    k0 = int(t_from * m.fps)
    k = k0
    for i in range(m.frames - 1, k0, -1):
        if sp[i] > v:
            k = i + 1
            break
    return k / m.fps


def run_to_stand(cycle, speed, t_stop, tail=3.0):
    """Run (in-place cycle driven along +Z at `speed`, scalar or callable of t) and brake to a stand
    with ACCAD Female1 RunToStand; the hips come to rest exactly at t_stop. Returns (motion, t_cut)."""
    c02 = M.with_events(_clip("accad:Female1_C02_RunToStand"), jumps=False, kicks=False)
    tR = c02.ev("footR")[0]
    stop = M.trim(c02, tR, min(c02.duration, tR + 1.9 + tail))
    nat = stop_time(stop, 0.5)
    n = int((t_stop + 1.0) * 60) + 1
    tt = np.arange(n) / 60.0
    v = speed(tt) if callable(speed) else speed
    run = M.drive(cycle, t_stop + 1.0, speed=v)
    # cut the run where its pose (limbs, local) best matches the first frame of the stop clip
    Ls = M.to_local(stop.R[:1])[0]
    Lr = M.to_local(run.R)
    k0, k1 = int((t_stop - nat - 0.45) * 60), int((t_stop - nat + 0.45) * 60)
    limbs = [J[n + s] for n in ("thigh", "shin", "upArm", "foreArm") for s in "LR"]
    cost = [sum(np.linalg.norm(M.rotvec(Lr[k, j] @ Ls[j].T)) for j in limbs) for k in range(k0, k1)]
    cut = (k0 + int(np.argmin(cost))) / 60.0
    a = M.concat(M.trim(run, 0.0, cut), stop, halflife=0.14)
    ts = stop_time(a, cut + 0.4)
    a = M.time_warp(a, [(0.0, 0.0), (cut - 0.3, cut - 0.3 + 0.5 * (t_stop - ts)), (ts, t_stop), (a.duration, a.duration + (t_stop - ts))])
    return a, cut


def finish(m, song_t0=None, events=(), **meta):
    m.events = [e for e in m.events if e["name"].startswith("foot")] + [{"t": float(t), "name": n} for t, n in events]
    m.events.sort(key=lambda e: e["t"])
    if song_t0 is not None:
        m.meta["song_t0"] = round(float(song_t0), 4)
    m.meta.update(meta)
    m.loop = False
    return m


# ----------------------------------------------------------------------------- sprint_stop_look
@recipe("sprint_stop_look")
def sprint_stop_look():
    """Chorus 1 'Nothing that I lived...': sprint, brake to a stand on the 89.80 hit, catch her breath,
    then turn to look back over the right shoulder from 91.8 and hold. song_t0 = 85.6."""
    S0 = 85.6
    t_stop = 89.80 - S0
    a, cut = run_to_stand(_sprint(), 4.93, t_stop)
    m = M.concat(a, idle_seg(16.0), halflife=0.35, at=min(a.duration, t_stop + 1.6))
    m = M.trim(m, 0.0, 14.4)
    t = m.times
    # out of breath: big fast breaths that calm down
    env = M.ramp(t, t_stop - 0.2, t_stop + 0.5, t_stop + 3.0, t_stop + 8.0)
    b = 0.5 - 0.5 * np.cos(2 * np.pi * (t - t_stop) / 1.35)
    m = M.additive(m, "chest", np.stack([-math.radians(5.0) * env * b, 0 * b, 0 * b], 1))
    m = M.additive(m, "spine", np.stack([math.radians(6.0) * env * (1 - 0.35 * b), 0 * b, 0 * b], 1))   # hunched, then straightens
    m = M.additive(m, "head", np.stack([math.radians(8.0) * env * (1 - 0.5 * b), 0 * b, 0 * b], 1))
    for s, sg in (("L", 1.0), ("R", -1.0)):
        m = M.additive(m, "clav" + s, np.stack([0 * b, 0 * b, sg * math.radians(5.0) * env * b], 1))
    t_go = 91.8 - S0
    m = lookback(m, t_go, t_go + 1.15)
    return finish(m, S0, [(t_stop, "stop"), (t_go, "look_start"), (t_go + 1.15, "look")])


# ----------------------------------------------------------------------------- seated (capture)
@functools.lru_cache(maxsize=None)
def _seated_src():
    """CMU 82_05 'sitting on ground relaxing': knees up, arms round the knees. Calm section, head calmed."""
    src = _clip("cmu:82_05")
    m = M.trim(src, 0.6, 6.6)
    m = B._calm_head(m, 0.35)
    return M.place(m, 0, 0.0, (0.0, 0.0))


@functools.lru_cache(maxsize=None)
def _sit_down_src():
    """CMU 114_16: from standing, squats and sits down on the ground (2.6 s -> ~5.3 s)."""
    src = _clip("cmu:114_16")
    return M.place(M.trim(src, 2.55, 5.4), 0, 0.0, (0.0, 0.0))


@recipe("sit_idle")
def sit_idle():
    """Seated on the ground, knees up, arms round the knees, breathing, tiny head movement. 12 s loop."""
    src = M.trim(_clip("cmu:82_05"), 0.3, 12.9)
    t0, t1, cost = M.find_cycle(src, 11.5, 12.4)
    cy = M.make_cycle(src, t0, t1, blend=1.5, in_place=True, frames=720, align_travel=False)
    cy = M.place(cy, 0, 0.0, (0.0, 0.0))
    cy = B._calm_head(cy, 0.4)
    cy = M.breathe(cy, period=4.0, depth=1.0, sway=0.0)
    cy.loop, cy.events = True, []
    cy.meta = {"source": "82_05", "cycle_cost": round(cost, 4), "seated": True}
    return cy


# ----------------------------------------------------------------------------- violet
@recipe("violet")
def violet():
    """The lone branch, verse 2, one take (song_t0 = 180.995): runs, slows and stops, looks to her left
    at the far glow, draws a pencil from her bun, writes one line in the air, lets it go on 201.865,
    watches it leave, sits down on the ground and is still. 30 s. Her left (+X) is where the glow is."""
    S0 = 180.995
    T = lambda s: s - S0                                      # song time -> track time
    t_stop = T(190.6)
    a, cut = run_to_stand(_sprint(), lambda t: np.interp(t, [0, 5.0, 8.0], [4.5, 4.25, 3.9]), t_stop)
    t_sit = 22.75                                             # the squat begins
    m = M.concat(a, idle_seg(20.0, 5.0), halflife=0.35, at=min(a.duration, t_stop + 1.5))
    m = M.trim(m, 0.0, t_sit)
    k_st = int((t_stop + 0.6) * 60)
    h0 = M.heading(m, k_st)
    Q = M.rot_y(h0)
    org = np.array([m.root[k_st, 0], 0.0, m.root[k_st, 2]])
    W = lambda p: org + Q @ np.asarray(p, dtype=np.float64)   # body space (at the stop) -> world
    D = lambda d: Q @ np.asarray(d, dtype=np.float64)
    t = m.times

    # --- 190.8-194.2: looks to her left, toward the far glow; the body follows a little
    w_look = M.ramp(t, T(190.75), T(191.75), T(194.2), T(195.3))
    m = M.twist_pelvis(m, math.radians(20.0) * M.ramp(t, T(190.65), T(191.7), T(194.3), T(195.4)))
    P = m.fk()
    m = M.look_at(m, P[:, J["head"]] + D([6.0, 0.55, 1.2]), w_look, max_deg=95.0)

    # --- torso turn and weight shift for the writing and the release
    ky = [T(195.3), T(196.35), T(200.9), T(201.4), T(201.865), T(203.0), t_sit - 0.1]
    yaw = PchipInterpolator(ky, np.radians([0, 20.0, -24.0, -4.0, 30.0, 26.0, 0.0]))(np.clip(t, ky[0], ky[-1]))
    yaw *= M.ramp(t, T(195.3), T(196.2))
    m = spine_turn(m, yaw=yaw)
    sx = PchipInterpolator(ky, [0, 0.06, -0.08, -0.02, 0.05, 0.04, 0.0])(np.clip(t, ky[0], ky[-1])) * M.ramp(t, T(195.3), T(196.2))
    m = M.shift_root(m, np.stack([sx, -0.25 * np.abs(sx), 0 * sx], 1) @ Q.T, keep_feet=True)

    # --- right hand: to the bun, draws the pencil, writes the line, gathers it, lets it go
    Ph = m.fk()
    kb = int(T(196.05) * 60)
    bun = Ph[kb, J["head"]] + m.R[kb, J["head"]] @ np.array([-0.05, 0.13, -0.09])
    rest = Ph[int(T(195.5) * 60), J["handR"]]
    t_w0, t_w1 = T(196.4), T(200.9)
    wk = [(T(195.5), rest), (T(195.76), W([-0.27, 1.27, 0.27])), (T(195.98), bun), (T(196.14), bun + np.array([0, 0.02, 0])),
          (T(196.27), W([-0.13, 1.60, 0.24])), (t_w0, W([0.30, 1.25, 0.385]))]      # round the shoulder, never through it
    # the line: her left to her right, ~0.85 m; the held "THAT" (197.12-198.11) is one long stroke
    seg = [(t_w0, 0.30), (T(197.12), 0.14), (T(198.11), -0.22), (t_w1, -0.50)]
    xs = PchipInterpolator([s[0] for s in seg], [s[1] for s in seg])
    for tt in np.arange(t_w0 + 0.06, t_w1 + 1e-6, 0.06):
        x = float(xs(tt))
        long_stroke = T(197.12) <= tt <= T(198.11)
        ph = 2 * np.pi * 3.3 * (tt - t_w0)
        wig = 0.0 if long_stroke else 0.034 * math.sin(ph) * (0.6 + 0.4 * math.sin(0.7 * ph + 1.0))
        lift = 0.035 * math.sin(np.pi * (tt - T(197.12)) / 0.99) if long_stroke else 0.0
        z = 0.42 - 0.25 * (x + 0.08) ** 2                       # a shallow arc round the body
        wk.append((tt, W([x, 1.25 + wig + lift, z])))
    wk += [(T(201.35), W([-0.06, 1.14, 0.30])), (T(201.60), W([-0.04, 1.09, 0.29])),     # gathers, dips
           (T(201.865), W([0.12, 1.34, 0.50])), (T(202.7), W([0.16, 1.40, 0.52])),      # lets it go: an offering
           (T(203.6), W([0.02, 1.20, 0.36])), (t_sit, Ph[-1, J["handR"]])]
    wR = M.ramp(t, T(195.5), T(195.95), T(203.0), t_sit - 0.05)
    fing = [(T(195.5), D([0, -1, 0.2])), (T(195.98), D([0.3, 0.7, -0.6])), (t_w0, D([0.1, 0.35, 1])),
            (t_w1, D([-0.1, 0.35, 1])), (T(201.5), D([0.2, 0.1, 1])), (T(201.865), D([0.3, 0.35, 0.9])),
            (T(203.6), D([0, -0.3, 1])), (t_sit, D([0, -1, 0.2]))]
    palm = [(T(195.5), D([1, 0, 0])), (T(195.98), D([0.2, -0.3, 1])), (t_w0, D([1, -0.4, 0])),
            (t_w1, D([1, -0.4, 0])), (T(201.5), D([0, 1, 0])), (T(201.865), D([0, 0.95, -0.3])),
            (T(203.6), D([0.6, 0.6, 0])), (t_sit, D([1, 0, 0]))]
    pole = [(T(195.5), D([-0.5, -1.0, -0.3])), (T(195.75), D([-1.0, -0.2, -0.3])), (T(195.98), D([-1.0, 0.45, -0.25])),
            (T(196.14), D([-1.0, 0.45, -0.25])), (t_w0, D([-0.8, -0.7, -0.2])), (T(197.0), D([-0.6, -1.0, -0.3])),
            (t_sit, D([-0.6, -1.0, -0.2]))]
    m, tgtR = hand_path(m, "R", wk, wR, fingers=fing, palm=palm, pole=pole)
    # --- left hand joins to lift the line away
    restL = Ph[int(T(200.9) * 60), J["handL"]]
    lk = [(T(200.9), restL), (T(201.35), W([0.14, 1.13, 0.30])), (T(201.60), W([0.15, 1.08, 0.29])),
          (T(201.865), W([0.40, 1.36, 0.42])), (T(202.7), W([0.45, 1.42, 0.44])),
          (T(203.6), W([0.22, 1.18, 0.3])), (t_sit, Ph[-1, J["handL"]])]
    wL = M.ramp(t, T(200.9), T(201.3), T(203.0), t_sit - 0.05)
    fl = [(T(200.9), D([0, -1, 0.2])), (T(201.5), D([-0.2, 0.1, 1])), (T(201.865), D([0.4, 0.35, 0.85])), (t_sit, D([0, -1, 0.2]))]
    pl = [(T(200.9), D([-1, 0, 0])), (T(201.5), D([0, 1, 0])), (T(201.865), D([0, 0.95, -0.3])), (t_sit, D([-1, 0, 0]))]
    m, _ = hand_path(m, "L", lk, wL, fingers=fl, palm=pl, pole=D([0.6, -1.0, -0.3])[None])
    # --- eyes: on the pencil tip while writing, then after the light as it leaves, up and to her left
    w_eye = M.ramp(t, T(196.2), T(196.7), T(201.3), T(201.7))
    m = M.look_at(m, tgtR + D([0, 0.02, 0.05]), 0.85 * w_eye, max_deg=70.0)
    P = m.fk()
    u = np.clip((t - T(201.865)) / 2.2, 0, 1)
    away = P[:, J["head"]] + D([1.0, 0.25, 1.0]) + np.outer(u, D([7.0, 2.6, 1.0]))
    m = M.look_at(m, away, M.ramp(t, T(201.7), T(202.1), T(203.6), t_sit + 0.3), max_deg=95.0)
    m = M.ground_clamp(m, floor=0.0)

    # --- 203.7-206.9: lowers herself to the ground (capture), knees up, arms round the knees; still
    sit = _sit_down_src()
    m = M.concat(m, sit, halflife=0.30, lock=True)
    t_down = m.duration
    seat = M.concat(_seated_src(), M.trim(_seated_src(), 0.0, 5.9), halflife=0.6, lock=False)
    m = M.concat(m, seat, halflife=0.42, lock=False, at=t_down - 0.25)
    m = M.trim(m, 0.0, 30.0)
    t = m.times
    # she looks up, and stays that way
    up = M.ramp(t, T(206.2), T(207.6))
    m = M.additive(m, "neck", np.stack([-math.radians(12.0) * up, 0 * up, 0 * up], 1))
    m = M.additive(m, "head", np.stack([-math.radians(22.0) * up, 0 * up, 0 * up], 1))
    m = M.additive(m, "chest", np.stack([-math.radians(5.0) * up, 0 * up, 0 * up], 1))
    m = M.ground_clamp(M.rest_on_ground(m), floor=0.0)
    ev = [(t_stop, "stop"), (T(190.8), "look"), (T(195.98), "pencil"), (t_w0, "write_start"),
          (T(197.12), "stroke"), (t_w1, "write_end"), (T(201.865), "release"), (t_sit, "sit_start"), (T(206.9), "seated")]
    return finish(m, S0, ev, glow_side="+X (her left)", line_from=[0.30, 1.25, 0.385], line_to=[-0.50, 1.25, 0.376])


# ----------------------------------------------------------------------------- float / rise
def _float_pose():
    """Supine on the surface: head toward -Z, feet toward +Z, face up; hips at y = 0.10."""
    p = M.Poser()
    p.hips(pos=(0.0, 0.10, 0.0), pitch=-90.0)
    p.spine(pitch=-5.0)                 # chest lifted by the air in it
    p.head(pitch=-6.0)
    for s, sg in (("L", 1.0), ("R", -1.0)):
        p.arm_fk(s, raise_=38.0, fwd=1.0, elbow=9.0)
        p.hand(s, p.R[J["foreArm" + s]][:, 1], (0, 1, 0), space="world")       # palms up
        p.bend("thigh" + s, pitch=12.0, roll=sg * 9.0)
        p.bend("shin" + s, pitch=-11.0)
        p.bend("foot" + s, pitch=-24.0)
    p.unpin("legs")
    return p


@recipe("float")
def float_():
    """Breakdown: lying on her back on the mirror water, weightless: slow limb drift, breath, a gentle bob.
    30 s, song_t0 = 97.513. meta.water = true (the figure fans the hair on the surface)."""
    p = _float_pose()
    n = 30 * 60 + 1
    m = M.Motion(np.repeat(p.root[None], n, 0), np.repeat(p.R[None], n, 0))
    m = M.drift(m, ["upArmL", "upArmR"], deg=5.5, period=9.5, seed=11)
    m = M.drift(m, ["foreArmL", "foreArmR"], deg=5.0, period=7.0, seed=12, axes=(1, 0.3, 0.3))
    m = M.drift(m, ["handL", "handR"], deg=6.0, period=5.5, seed=13)
    m = M.drift(m, ["thighL", "thighR"], deg=3.2, period=11.0, seed=14)
    m = M.drift(m, ["shinL", "shinR"], deg=4.0, period=8.0, seed=15, axes=(1, 0, 0))
    m = M.drift(m, ["footL", "footR"], deg=5.0, period=6.5, seed=16, axes=(1, 0.4, 0))
    m = M.drift(m, ["spine"], deg=1.6, period=12.0, seed=17)
    m = M.drift(m, ["neck", "head"], deg=2.2, period=10.0, seed=18)
    m = M.breathe(m, period=4.6, depth=1.5, sway=0.0)
    t = m.times
    rng = np.random.default_rng(5)
    ph = rng.uniform(0, 2 * np.pi, 6)
    m.root[:, 1] += 0.012 * np.sin(2 * np.pi * t / 4.6 + ph[0]) + 0.006 * np.sin(2 * np.pi * t / 7.9 + ph[1])
    m.root[:, 0] += 0.03 * np.sin(2 * np.pi * t / 17.0 + ph[2])
    m.root[:, 2] += 0.04 * np.sin(2 * np.pi * t / 23.0 + ph[3])
    roll = math.radians(2.0) * np.sin(2 * np.pi * t / 9.0 + ph[4])
    yaw = math.radians(4.0) * np.sin(2 * np.pi * t / 26.0 + ph[5])
    Qz = M._rot_z(roll)
    m.R = (M.rot_y(yaw) @ Qz)[:, None] @ m.R
    return finish(m, 97.513, [], water=True, note="supine; head toward -Z, feet toward +Z at t=0")


@recipe("rise")
def rise():
    """The download (b69, the F#5 leap at 118.387): from the float she is drawn up by the chest, feet
    leaving the water, arms sweeping out and up wide on the accent, head back; then she settles down
    to stand. 9 s, song_t0 = 116.0. Frame 0 is the float track's pose at 116.0."""
    S0 = 116.0
    acc = 118.387 - S0
    fl = float_()
    k = int(round((S0 - 97.513) * 60))
    p0 = M.Poser(fl, k).unpin("legs")
    x0, z0 = p0.root[0], p0.root[2]

    def air(y, pitch, spine, head, raise_, fwd, elbow, thL, knL, thR, knR, toes=-38.0, palm=(0, 0.3, 1), dz=0.0):
        p = M.Poser()
        p.hips(pos=(x0, y, z0 + dz), pitch=pitch)
        p.spine(pitch=spine)
        p.head(pitch=head)
        for s in "LR":
            p.arm_fk(s, raise_=raise_, fwd=fwd, elbow=elbow)
            p.hand(s, p.R[J["foreArm" + s]][:, 1], p.dir_world(palm), space="world")
        for s, th, kn in (("L", thL, knL), ("R", thR, knR)):
            p.bend("thigh" + s, pitch=th, roll=(4.0 if s == "L" else -4.0))
            p.bend("shin" + s, pitch=kn)
            p.bend("foot" + s, pitch=toes)
        return p.unpin("legs")

    # drawn up by the sternum: the chest leads, the head and arms trail, the legs hang
    k1 = air(0.30, -52.0, -12.0, -16.0, 26.0, -32.0, 18.0, 40.0, -22.0, 34.0, -16.0, toes=-30.0, dz=0.03)
    k2 = air(0.98, -10.0, -8.0, 2.0, 30.0, -22.0, 22.0, 14.0, -34.0, 6.0, -18.0)
    k3 = air(1.505, 2.0, -17.0, -24.0, 124.0, -12.0, 8.0, 17.0, -40.0, -5.0, -7.0)          # the accent
    k4 = air(1.565, 1.0, -19.0, -27.0, 131.0, -14.0, 6.0, 14.0, -34.0, -6.0, -8.0)
    k5 = air(1.40, 0.0, -7.0, -6.0, 96.0, -2.0, 10.0, 7.0, -16.0, -2.0, -8.0, palm=(0, -0.3, 1))
    k6 = air(1.085, 0.0, -2.0, 0.0, 52.0, 4.0, 14.0, 4.0, -9.0, 1.0, -6.0, toes=-30.0, palm=(0, -1, 0.3))
    st = idle_seg(1.0)
    k8 = M.Poser(st, 0)
    k8.root[0] += x0 - st.root[0, 0]
    k8.root[2] += z0 - st.root[0, 2]
    k7 = k8.copy()
    k7.hips(dy=-0.03)
    for s, sg in (("L", 1.0), ("R", -1.0)):
        k7.arm_fk(s, raise_=30.0, fwd=6.0, elbow=14.0)
        Pk = k8.P()
        k7.leg(s, Pk[J["foot" + s]], "world")
        k7.R[J["foot" + s]], k7.R[J["toe" + s]] = k8.R[J["foot" + s]], k8.R[J["toe" + s]]
    keys = [(0.0, p0), (1.0, k1, "in"), (1.75, k2, "lin"), (acc, k3, "out"), (acc + 1.1, k4, "io"),
            (5.7, k5, "io"), (7.75, k6, "io"), (8.45, k7, "out"), (9.0, k8, "io")]
    m = M.keyframes(keys, overlap=0.06, soften=5.0)
    m = M.drift(m, ["upArmL", "upArmR"], deg=2.5, period=4.0, seed=3, weight=M.ramp(m.times, 2.4, 3.2, 7.0, 8.2))
    m = M.drift(m, ["thighL", "thighR", "shinL", "shinR"], deg=2.5, period=3.4, seed=4, axes=(1, 0, 0.3),
                weight=M.ramp(m.times, 1.6, 2.6, 6.8, 7.9))
    m = M.breathe(m, period=3.0, depth=1.2, sway=0.0)
    m = M.ground_clamp(m, floor=0.0)
    return finish(m, S0, [(acc, "accent"), (7.75, "touch"), (8.45, "landed")], water=True)


# ----------------------------------------------------------------------------- release / catch
def _sym(keys, sg):
    return [(t, (sg * p[0], p[1], p[2])) for t, p in keys]


@recipe("release")
def release():
    """Verse 1 'Each one a light I sent ahead': cups both hands at the chest, lifts and opens them
    forward and up (the light leaves on the accent, t = 2.5), her eyes follow it, the arms lower. 7 s."""
    m = idle_seg(7.0, 4.0)
    t = m.times
    acc = 2.5
    P = m.fk()
    w = M.ramp(t, 0.45, 1.15, 4.5, 5.9)
    keys = [(0.45, (0.20, 0.90, 0.02)), (1.35, (0.055, 1.20, 0.22)), (2.02, (0.055, 1.205, 0.22)),
            (2.27, (0.06, 1.15, 0.21)), (acc, (0.20, 1.49, 0.50)), (3.4, (0.25, 1.56, 0.54)),
            (5.0, (0.24, 1.05, 0.20)), (5.9, (0.22, 0.90, 0.03))]
    for s, sg in (("L", 1.0), ("R", -1.0)):
        fing = [(0.45, (0, -1, 0.2)), (1.35, (-0.55 * sg, 0.0, 1)), (2.27, (-0.5 * sg, 0.0, 1)),
                (acc, (0.15 * sg, 0.45, 1)), (3.4, (0.2 * sg, 0.55, 1)), (5.9, (0, -1, 0.2))]
        palm = [(0.45, (-sg, 0, 0)), (1.35, (-0.25 * sg, 1, 0)), (2.27, (-0.3 * sg, 1, 0)),
                (acc, (0.1 * sg, 1, -0.5)), (3.4, (0.2 * sg, 1, -0.6)), (5.9, (-sg, 0, 0))]
        k = _sym(keys, sg)
        k[0] = (0.45, tuple(P[int(0.45 * 60), J["hand" + s]]))
        k[-1] = (5.9, tuple(P[int(5.9 * 60), J["hand" + s]]))
        m, _ = hand_path(m, s, k, w, fingers=fing, palm=palm, pole=[(0.45, (0.5 * sg, -1, -0.3)), (acc, (0.8 * sg, -1, 0.0)), (5.9, (0.5 * sg, -1, -0.3))])
    # the body: a small gathering dip, then up onto the balls of the feet as the light leaves
    dip = -0.028 * M.ramp(t, 1.95, 2.27, 2.3, acc) + 0.016 * M.ramp(t, 2.3, acc + 0.1, 3.3, 4.6)
    fwd = 0.045 * M.ramp(t, 2.25, acc + 0.15, 3.6, 5.0)
    m = M.shift_root(m, np.stack([0 * t, dip, fwd], 1), keep_feet=True)
    arch = -math.radians(7.0) * M.ramp(t, 2.25, acc + 0.1, 3.6, 5.2) + math.radians(5.0) * M.ramp(t, 0.8, 1.5, 2.1, acc)
    m = spine_turn(m, pitch=arch)
    # eyes: down at what she holds, then after it
    P = m.fk()
    hands = 0.5 * (P[:, J["handL"]] + P[:, J["handR"]]) + np.array([0, 0.05, 0.06])
    u = M.smoothstep((t - acc) / 2.4)
    far = P[:, J["head"]] + np.array([0.0, 0.25, 1.0]) + np.outer(u, [0.0, 2.6, 9.0])
    wf = M.smootherstep((t - (acc - 0.12)) / 0.45)
    tgt = hands * (1 - wf[:, None]) + far * wf[:, None]
    m = M.look_at(m, tgt, M.ramp(t, 0.7, 1.4, 4.9, 6.2), share=(("neck", 0.4), ("head", 0.6)), max_deg=60.0)
    m = M.ground_clamp(m, floor=0.0)
    return finish(m, None, [(1.35, "cupped"), (acc, "release")])


@recipe("catch")
def catch():
    """Chorus 2 'Fold me in again': the light arrives at her chest on the 222.735 hit: both hands
    receive it, half a step back with the impact, her head bows over it; at 229.6 the head lifts and
    the arms open slowly wide, palms forward (fully open 232.71), held. 16 s, song_t0 = 220.0.
    It arrives from +Z (she faces it)."""
    S0 = 220.0
    hit, lift, open_ = 222.735 - S0, 229.6 - S0, 232.71 - S0
    m = idle_seg(16.0, 6.0)
    t = m.times
    P0 = m.fk()
    # half a step back (right foot) with the impact
    m = M.step_foot(m, "R", hit + 0.02, hit + 0.42, (-0.03, -0.30), lift=0.06, hips=0.55)
    keys = [(1.85, None), (hit - 0.17, (0.11, 1.25, 0.31)), (hit, (0.05, 1.255, 0.125)),
            (hit + 0.5, (0.045, 1.235, 0.135)), (lift, (0.045, 1.24, 0.135)), (lift + 1.0, (0.24, 1.27, 0.33)),
            (lift + 2.1, (0.55, 1.31, 0.22)), (open_, (0.66, 1.29, 0.02)), (16.0, (0.67, 1.30, 0.0))]
    step = -0.165 * M.smoothstep((t - hit) / 0.45)             # the hips went back with the step
    for s, sg in (("L", 1.0), ("R", -1.0)):
        k = _sym(keys[1:], sg)
        k = [(1.85, tuple(P0[int(1.85 * 60), J["hand" + s]]))] + k
        kk = [(tt, (p[0], p[1], p[2] + float(np.interp(tt, t, step)) * (1.0 if tt > hit else 0.0))) for tt, p in k]
        fing = [(1.85, (0, -1, 0.2)), (hit - 0.17, (-0.2 * sg, 0.55, 0.8)), (hit, (-0.75 * sg, 0.65, 0.05)),
                (lift, (-0.75 * sg, 0.65, 0.05)), (lift + 1.0, (0.2 * sg, 0.3, 1)), (open_, (sg, 0.12, 0.25)), (16.0, (sg, 0.12, 0.25))]
        palm = [(1.85, (-sg, 0, 0)), (hit - 0.17, (-0.55 * sg, -0.1, 0.8)), (hit - 0.08, (-sg, 0.0, 0.1)), (hit, (-0.25 * sg, 0, -1)), (lift, (-0.25 * sg, 0, -1)),
                (lift + 1.0, (-0.6 * sg, 0.5, 0.5)), (open_, (0, 0.15, 1)), (16.0, (0, 0.15, 1))]
        pole = [(1.85, (0.5 * sg, -1, -0.3)), (hit, (0.9 * sg, -0.8, 0.0)), (lift, (0.9 * sg, -0.8, 0.0)),
                (open_, (0.2 * sg, -1, -0.6)), (16.0, (0.2 * sg, -1, -0.6))]
        m, _ = hand_path(m, s, kk, M.ramp(t, 1.85, hit - 0.2), fingers=fing, palm=palm, pole=pole)
    # the torso: knocked back a little, then curls over what it holds; opens at the end
    kt = [0.0, hit - 0.05, hit + 0.10, hit + 0.75, lift, lift + 1.6, open_, 16.0]
    sp = PchipInterpolator(kt, np.radians([0, 0, -8.0, 13.0, 14.0, 2.0, -9.0, -9.0]))(t)
    m = spine_turn(m, pitch=sp)
    hd = PchipInterpolator(kt, np.radians([0, 0, -4.0, 26.0, 28.0, 2.0, -7.0, -6.0]))(t)
    m = M.additive(m, "neck", np.stack([0.4 * hd, 0 * hd, 0 * hd], 1))
    m = M.additive(m, "head", np.stack([0.6 * hd, 0 * hd, 0 * hd], 1))
    dip = -0.03 * M.ramp(t, hit, hit + 0.18, hit + 0.3, hit + 1.2) + 0.012 * M.ramp(t, lift + 0.8, open_)
    m = M.shift_root(m, np.stack([0 * t, dip, 0.03 * M.ramp(t, lift + 0.5, open_)], 1), keep_feet=True)
    m = M.drift(m, ["upArmL", "upArmR"], deg=1.6, period=5.0, seed=7, weight=M.ramp(t, open_ - 0.5, open_ + 0.6))
    m = M.ground_clamp(m, floor=0.0)
    return finish(m, S0, [(hit, "impact"), (lift, "head_lifts"), (open_, "open")], arrives_from="+Z")


# ----------------------------------------------------------------------------- forks
@recipe("fork_L")
def fork_L():
    """A fork, left half: from standing, a breath of anticipation, one decisive side step to her left
    (0.9 m; the leading foot lands at t = 1.0), the other foot closes, she settles looking ahead. 2.5 s.
    (ACCAD Female1 SideStepLeft, first step.) Play fork_L and fork_R on two coincident instances."""
    src = M.with_events(_clip("accad:Female1_B22_SideStepLeft"), jumps=False, kicks=False)
    t_land = src.ev("footL")[0]
    seg = M.trim(src, t_land - 1.05, t_land + 1.25)
    seg = M.place(seg, 0, 0.0, (0.0, 0.0))
    seg = B._calm_head(seg, 0.3)
    dx = seg.root[-1, 0] - seg.root[0, 0]
    f = 0.9 / dx
    seg.root[:, 0] = seg.root[0, 0] + (seg.root[:, 0] - seg.root[0, 0]) * f
    seg.root[:, 2] = seg.root[0, 2] + (seg.root[:, 2] - seg.root[0, 2]) * 0.3      # no drift forward/back
    seg = M.ground_clamp(M.foot_lock(seg), floor=0.0)
    m = M.time_warp(seg, [(0.0, 0.0), (0.45, 0.42), (1.05, 1.0), (seg.duration, 2.05)])
    st = idle_seg(1.0)
    m = M.concat(m, st, halflife=0.22)
    m = M.trim(m, 0.0, 2.5)
    m = B._calm_head(m, 0.5)
    m.meta = {"source": "Female1_B22_SideStepLeft", "step_m": 0.9, "scaled": round(float(f), 3)}
    return finish(m, None, [(1.0, "step")])


@recipe("fork_R")
def fork_R():
    """A fork, right half: the mirror of fork_L."""
    m = M.mirror(fork_L())
    return finish(m, None, [(1.0, "step")])


def _veer(sign):
    cy = _walk()
    v = cy.meta["speed"]
    pts = [(0.0, 0.0)]
    n = 60
    lead, arc_t, out = 1.0 * v, 2.0 * v, 1.2 * v
    for i in range(1, 9):
        pts.append((0.0, lead * i / 8))
    th = math.radians(25.0)
    x, z = 0.0, lead
    for i in range(1, n + 1):
        a = th * M.smoothstep(np.array(i / n))
        ds = arc_t / n
        x += sign * math.sin(float(a)) * ds
        z += math.cos(float(a)) * ds
        pts.append((x, z))
    for i in range(1, 9):
        pts.append((x + sign * math.sin(th) * out * i / 8, z + math.cos(th) * out * i / 8))
    m = M.drive(cy, 4.2, path=np.array(pts))
    m = M.ground_clamp(M.foot_lock(m), floor=0.0)
    return finish(m, None, [(1.0, "veer_start"), (3.0, "veer_end")], veer_deg=25.0 * sign)


@recipe("fork_walk_L")
def fork_walk_L():
    """Walking forward, veers 25 degrees to her left over 2 s (t = 1 to 3) without breaking stride. 4.2 s."""
    return _veer(+1.0)


@recipe("fork_walk_R")
def fork_walk_R():
    """Walking forward, veers 25 degrees to her right over 2 s (t = 1 to 3). 4.2 s."""
    return _veer(-1.0)


# ----------------------------------------------------------------------------- land
@recipe("land")
def land():
    """b73 (125.343, the biggest impact): she drops 1.2 m and lands in a deep three-point crouch on the
    accent (t = 0.495), holds two beats, lifts her head, rises into a ready stance by +4 beats. 4 s.
    song_t0 = 125.343 - 0.495."""
    acc = math.sqrt(2 * 1.2 / 9.81)                      # 0.495 s of free fall
    feet = {"L": ((0.23, 0.15), 14.0), "R": ((-0.22, -0.13), -22.0)}

    def base(y, pitch, heelR=0.0, heelL=0.0, dz=0.0):
        p = M.Poser()
        p.hips(pos=(0.0, y, dz), pitch=pitch)
        for s in "LR":
            p.foot(s, feet[s][0], yaw=feet[s][1], space="world", heel=(heelL if s == "L" else heelR))
        return p

    k0 = M.Poser()                                         # in the air, at the top
    k0.hips(pos=(0.0, 0.965 + 1.2, 0.0), pitch=6.0)
    k0.spine(pitch=6.0)
    for s, sg in (("L", 1.0), ("R", -1.0)):
        k0.arm_fk(s, raise_=118.0, fwd=18.0, elbow=28.0)
        k0.bend("thigh" + s, pitch=30.0 if s == "L" else 14.0, roll=sg * 8.0)
        k0.bend("shin" + s, pitch=-46.0 if s == "L" else -24.0)
        k0.bend("foot" + s, pitch=-22.0)
    k0.unpin("legs")
    k1 = base(0.965, 6.0, heelR=0.05, heelL=0.04)        # touch-down, legs long
    k1.spine(pitch=8.0)
    for s in "LR":
        k1.arm_fk(s, raise_=100.0, fwd=10.0, elbow=22.0)

    def crouch(y=0.40, head=14.0, hand_y=0.085, spine=16.0):
        p = base(y, 36.0, heelR=0.075, dz=-0.03)
        p.spine(pitch=spine, yaw=-8.0)
        p.head(pitch=head)
        p.arm("R", (-0.16, hand_y, 0.44), "world", pole=(-1.0, 0.2, -0.2), pole_space="world",
              fingers=(0.1, -0.35, 1), palm=(0, -1, 0), dir_space="world")
        p.arm_fk("L", raise_=72.0, fwd=-58.0, elbow=14.0)
        return p
    k2 = crouch()
    k3 = crouch(y=0.425, head=10.0, spine=14.0)
    k4 = crouch(y=0.44, head=-30.0, spine=10.0)           # the head comes up first
    k5 = base(0.90, 4.0, dz=0.0)                            # ready: feet where they landed, fists at the hips
    k5.spine(pitch=-3.0)
    for s, sg in (("L", 1.0), ("R", -1.0)):
        k5.arm(s, (sg * 0.215, 1.02, -0.03), "world", pole=(sg * 0.25, -0.3, -1.0), pole_space="world",
               fingers=(0, 0.15, 1), palm=(0, 1, 0), dir_space="world")
    k6 = k5.copy()
    k6.hips(dy=0.012)
    keys = [(0.0, k0), (acc, k1, "in"), (acc + 0.21, k2, "out3"), (acc + 0.87, k3, "io"),
            (acc + 1.15, k4, "io"), (acc + 1.739, k5, "io"), (4.0, k6, "io")]
    m = M.keyframes(keys, overlap=0.04, soften=9.0)
    m = M.breathe(m, period=2.6, depth=1.3, sway=0.0)
    m = M.ground_clamp(m, floor=0.0)
    return finish(m, 125.343 - acc, [(acc, "impact"), (acc + 1.15, "head_up"), (acc + 1.739, "ready")])
