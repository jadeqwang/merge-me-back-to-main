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
    m = M.despike(M.trim(m, 0.0, 14.4), joints=("foreArmL", "foreArmR", "handL", "handR"))
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
def _violet_sit(m, dur, t_seated, debug=False):
    """The sit that ends the violet take, authored from the last frame of `m` (standing, feet stay where
    they are): a breath, squats with the arms forward, right hand to the ground beside the hip, lowers
    the seat onto the ground (on it at t_seated - 0.55), brings both arms round the knees, lifts the
    chin to the sky, and stays: breath and a slow drift. Returns `dur` seconds; frame 0 = m's last."""
    P1 = m.fk()[-1]
    h1 = float(M.heading(m, -1))
    Q1 = M.rot_y(h1)
    o1 = np.array([m.root[-1, 0], 0.0, m.root[-1, 2]])
    W = lambda p: o1 + Q1 @ np.asarray(p, dtype=np.float64)         # body space at the stand -> world
    D = lambda d: Q1 @ np.asarray(d, dtype=np.float64)
    feet, fz = {}, 0.0
    for s in "LR":
        a, d = P1[J["foot" + s]], m.R[-1, J["toe" + s]][:, 1]
        feet[s] = ((a[0], a[2]), math.degrees(math.atan2(d[0], d[2])))
        fz += 0.5 * float((Q1.T @ (a - o1))[2])
    y0 = float(m.root[-1, 1])
    seat_y = lambda pitch: 0.075 * math.cos(math.radians(pitch)) + 0.075 + 0.004      # thigh joints rest on the ground

    def body(y, dz, pitch, spine, heel=0.0, dx=0.0, syaw=0.0):
        p = M.Poser()
        p.hips(pos=W([dx, y, fz + dz]), yaw=math.degrees(h1), pitch=pitch)
        p.spine(pitch=spine, yaw=syaw)
        for s in "LR":
            p.foot(s, feet[s][0], yaw=feet[s][1], space="world", heel=heel)
        return p

    def knee(p, s):
        return p.P()[J["shin" + s]]

    def arm(p, s, wrist, fingers, palm, pole):
        p.arm(s, wrist, "world", pole=D(pole), pole_space="world", fingers=D(fingers), palm=D(palm), dir_space="world")
        return p

    def wrap(p, amt=1.0):
        """Arms round the knees: elbows outside the knees, forearms across the shins, each hand lying
        on the other forearm (right in front). amt < 1 = on the way there (hands wider, higher)."""
        kL, kR = knee(p, "L"), knee(p, "R")
        aL, aR = p.P()[J["footL"]], p.P()[J["footR"]]
        mid = 0.5 * (kL + kR) * 0.52 + 0.5 * (aL + aR) * 0.48          # a point on the shins, a little below the middle
        fwd = D([0, 0, 1.0])
        left = D([1.0, 0, 0])
        open_ = 1.0 - amt
        wl = mid + fwd * (0.105 - 0.03 * open_) - left * (0.015 - 0.20 * open_) + np.array([0, 0.015 + 0.10 * open_, 0])
        wr = mid + fwd * (0.140 - 0.03 * open_) + left * (0.045 - 0.22 * open_) + np.array([0, 0.045 + 0.10 * open_, 0])
        arm(p, "L", wl, (-1.0, -0.22, 0.10 + 0.5 * open_), (0.1, 0.1, -1.0), (1.0, -0.45, 0.25))
        arm(p, "R", wr, (1.0, -0.25, 0.05 + 0.5 * open_), (-0.1, 0.1, -1.0), (-1.0, -0.45, 0.25))
        return p

    k0 = M.Poser(m, m.frames - 1)
    # a breath out: the shoulders drop, the eyes come down to the ground in front of her
    k1 = body(y0 - 0.012, -0.012, 3.0, 5.0)
    for s in "LR":
        k1.arm_fk(s, raise_=9.0, fwd=10.0, elbow=14.0)
    k1.look(target=W([0.05, 0.0, fz + 2.2]), space="world")
    # squat: hips back, chest forward, arms forward for balance
    k2 = body(0.62, -0.20, 34.0, 16.0)
    for s in "LR":
        k2.arm_fk(s, raise_=42.0, fwd=74.0, elbow=38.0)
    k2.look(target=W([0.0, 0.0, fz + 1.3]), space="world")
    # deep squat on the balls of the feet; the right hand goes down for the ground, the left rests on the knee
    k3 = body(0.345, -0.345, 20.0, 24.0, heel=0.03, dx=-0.015, syaw=-9.0)
    hz = fz - 0.47
    ground_hand = W([-0.305, 0.045, hz - 0.085])
    arm(k3, "R", ground_hand + np.array([0, 0.17, 0]) + D([0.02, 0, 0.10]), (-0.45, -0.55, 0.45), (0.2, -1.0, -0.2), (-0.9, 0.1, -0.7))
    arm(k3, "L", knee(k3, "L") + D([0.035, 0, 0.05]) + np.array([0, 0.085, 0]), (-0.35, -0.3, 1.0), (0, -1.0, 0.2), (1.0, -0.6, 0.0))
    k3.look(target=W([-0.1, 0.0, fz + 1.0]), space="world")
    # the seat touches down, weight on the right hand
    k4 = body(seat_y(-9.0) + 0.012, -0.47, -9.0, 20.0, dx=-0.012, syaw=-7.0)
    arm(k4, "R", ground_hand, (-0.55, 0.0, 0.55), (0, -1.0, 0), (-0.8, 0.1, -0.8))
    arm(k4, "L", knee(k4, "L") + D([0.04, 0, 0.06]) + np.array([0, 0.07, 0]), (-0.5, -0.35, 1.0), (0, -1.0, 0.3), (1.0, -0.6, 0.0))
    k4.look(target=W([0.0, 0.25, fz + 1.6]), space="world")
    # seated; the right hand leaves the ground and both arms come round the knees
    k5 = wrap(body(seat_y(-13.0), -0.47, -13.0, 30.0, syaw=-2.0), 0.35)
    k5.look(target=W([0.0, 0.55, fz + 2.5]), space="world")
    k6 = wrap(body(seat_y(-15.0), -0.47, -15.0, 35.0), 1.0)
    k6.look(direction=D([-0.08, 0.22, 1.0]), space="world")       # the head is already coming up as the arms close
    # the chin lifts: up at the sky, a little to her right; the chest opens with it
    sky = D([-0.20, 0.62, 1.0])
    k7 = wrap(body(seat_y(-17.0), -0.47, -17.0, 31.0), 1.0)
    k7.look(direction=sky, space="world", max_deg=60.0)
    k8 = wrap(body(seat_y(-17.0), -0.47, -17.0, 32.5), 1.0)       # the sigh: she settles a little, the eyes stay up
    k8.look(direction=sky, space="world", max_deg=60.0)
    k9 = wrap(body(seat_y(-17.5), -0.47, -17.5, 32.0), 1.0)
    k9.look(direction=D([-0.16, 0.66, 1.0]), space="world", max_deg=60.0)
    ts = t_seated
    keys = [(0.0, k0), (0.55, k1, "io"), (1.30, k2, "io"), (1.95, k3, "io"), (ts - 0.55, k4, "io"), (ts + 0.12, k5, "io"),
            (ts + 0.78, k6, "io"), (ts + 1.4, k7, "io"), (ts + 2.6, k8, "io"), (dur + 0.5, k9, "io")]
    if debug:
        return keys
    s = M.keyframes(keys, overlap=0.05, soften=5.0)
    s = M.plant_hands(s)
    t = s.times
    alive = M.ramp(t, ts - 0.2, ts + 1.2)
    b = 0.5 - 0.5 * np.cos(2 * np.pi * (t - ts) / 4.3)              # slow breaths; the wrapped arms ride on them
    z = 0 * b
    s = M.additive(s, "chest", np.stack([-math.radians(2.6) * alive * b, z, z], 1))
    s = M.additive(s, "spine", np.stack([-math.radians(1.3) * alive * b, z, z], 1))
    s = M.additive(s, "head", np.stack([math.radians(1.6) * alive * b, z, z], 1))
    for sd, sg in (("L", 1.0), ("R", -1.0)):
        s = M.additive(s, "clav" + sd, np.stack([z, z, sg * math.radians(2.6) * alive * b], 1))
    s = M.drift(s, ["neck", "head"], deg=2.2, period=7.0, seed=11, weight=alive)
    s = M.drift(s, ["spine"], deg=0.9, period=9.0, seed=5, axes=(0.4, 1.0, 1.0), weight=alive)
    return M.trim(s, 0.0, dur)


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
    m = M.despike(M.trim(m, 0.0, t_sit), joints=("foreArmL", "foreArmR", "handL", "handR"))
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

    # --- 203.7-206.9: lowers herself to the ground with control, knees up, arms round the knees, chin
    #     lifting to the sky; then still but breathing (authored: M3, fable/notes/M3_motionfix.md)
    m = M.concat(m, _violet_sit(m, 30.0 - t_sit, T(206.9) - t_sit), halflife=0.25, align=False, lock=False)
    m = M.trim(m, 0.0, 30.0)
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
    keys = [(0.0, p0), (1.0, k1, "in"), (1.78, k2, "lin"), (acc + 0.045, k3, "out"), (acc + 1.1, k4, "io"),
            (5.7, k5, "io"), (7.75, k6, "io"), (8.45, k7, "out"), (9.0, k8, "io")]
    m = M.keyframes(keys, overlap=0.06, soften=5.0)
    m = M.drift(m, ["upArmL", "upArmR"], deg=2.5, period=4.0, seed=3, weight=M.ramp(m.times, 2.4, 3.2, 7.0, 8.2))
    m = M.drift(m, ["thighL", "thighR", "shinL", "shinR"], deg=2.5, period=3.4, seed=4, axes=(1, 0, 0.3),
                weight=M.ramp(m.times, 1.6, 2.6, 6.8, 7.9))
    m = M.breathe(m, period=3.0, depth=1.2, sway=0.0)
    m = M.ground_clamp(m, floor=0.0)
    return finish(m, S0, [(acc, "accent"), (7.75, "touch"), (8.45, "landed")], water=[0.45, 1.3])   # P1: the hair starts in float's fan on the surface and the water lets go as she is drawn up


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
    m = M.time_warp(seg, [(0.0, 0.0), (0.45, 0.40), (1.05, 0.967), (seg.duration, 2.05)])
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


# ----------------------------------------------------------------------------- free (the outro, in daylight)
def turn_in_place(m, t0, t1, ang, lift=0.05):
    """Overlay on a standing motion: she turns by `ang` radians (+ = to her left) about the vertical
    through her hips between t0 and t1, stepping round with two small steps (inside foot first)."""
    t = m.times
    P = m.fk()
    k0 = int(t0 * m.fps)
    piv = np.array([m.root[k0, 0], 0.0, m.root[k0, 2]])
    u = M.smoothstep((t - t0) / (t1 - t0))
    Q = M.rot_y(ang * u)
    out = m.copy()
    out.root = piv + np.einsum("fab,fb->fa", Q, m.root - piv)
    out.R = Q[:, None] @ m.R
    tm = 0.5 * (t0 + t1)
    order = ("L", "R") if ang > 0 else ("R", "L")
    for side, (a, b) in zip(order, ((t0, tm + 0.04), (tm - 0.04, t1))):
        uf = M.smoothstep((t - a) / (b - a))
        Qf = M.rot_y(ang * uf)
        f, tj = J["foot" + side], J["toe" + side]
        tgt = piv + np.einsum("fab,fb->fa", Qf, P[:, f] - piv)
        tgt[:, 1] += lift * np.sin(np.pi * uf)
        out.R[:, f] = Qf @ m.R[:, f]
        out.R[:, tj] = Qf @ m.R[:, tj]
        out = M.leg_ik(out, side, tgt)
    return out


def _pin_feet_like(m, a, b, span, fade=0.25, near=0.03):
    """After m = concat(a, b): for `span` seconds after the join, a foot that is planted in clip b stays
    planted in m. concat's inertialisation carries the pose and root difference of the join into b,
    which drags b's support foot over the ground; here, once that foot has come down to b's height, it
    is held where it is (following only b's own heel-to-toe roll) to the end of b's contact, and the
    difference is given back over `fade` seconds of the swing that follows."""
    n0 = a.frames - 1
    n1 = min(m.frames, n0 + int(span * m.fps))
    bb = M.place(b, 0, M.heading(a, -1), (a.root[-1, 0], a.root[-1, 2]))
    Pb = bb.fk()
    con = M.contacts(bb)
    out = m
    for k, sd in enumerate("LR"):
        j = J["foot" + sd]
        Pm = out.fk()[:, j]
        corr = np.zeros((m.frames, 3))
        for st, en in M._runs(con[:n1 - n0, k]):
            ok = np.where(np.abs(Pm[n0 + st:n0 + en, 1] - Pb[st:en, j, 1]) < near)[0]
            if len(ok) == 0:
                continue
            k0 = st + int(ok[0])
            if en - k0 < 3:
                continue
            tgt = Pm[n0 + k0] + (Pb[k0:en, j] - Pb[k0, j])
            corr[n0 + k0:n0 + en] = tgt - Pm[n0 + k0:n0 + en]
            nf = int(fade * m.fps)
            e1 = min(m.frames, n0 + en + nf)
            u = M.smoothstep((np.arange(n0 + en, e1) - (n0 + en) + 1) / (nf + 1))
            corr[n0 + en:e1] = corr[n0 + en - 1][None] * (1.0 - u[:, None])
        corr[:, 1] = 0.0
        if np.abs(corr).max() > 1e-4:
            out = M.leg_ik(out, sd, Pm + corr)
    return out


@recipe("free")
def free():
    """The outro in daylight (song_t0 = 236.648, b137): skipping, a turn with her arms flung wide, a
    leap (apex 243.6, b141), a jump for joy, a cartwheel, she stops and turns to face east on the second
    'Back to main' (249.44), a large pencil flourish, and walks on. 21 s. East = +Z of the track's end:
    the whole take is turned so that she ends walking along +Z."""
    S0 = 236.648
    BARS = lambda n, b=1.0: bar(n, b) - S0
    joy = M.with_events(_clip("cmu:142_09"), kicks=False)
    # b137-138: skipping (the first jump's apex on b138.1)
    a = M.time_warp(M.trim(joy, 1.15, 4.35), [(0.0, 0.0), (2.38 - 1.15, BARS(138)), (3.2, BARS(139))])
    # b139: a full turn, arms flung wide
    wh = _clip("cmu:55_01")
    b = M.trim(wh, 0.9, 2.9)
    m = M.concat(a, b, halflife=0.22)
    m = _pin_feet_like(m, a, b, 0.9)          # M3: the whirl's support foot was dragged 0.35 m by the join (240.3-240.6)
    # b140: the run-up; b141.1 the leap
    lp = M.with_events(_clip("cmu:49_04"), kicks=False)
    t_ap = lp.ev("jump_apex")[0]
    t_join = BARS(141) - t_ap
    m = M.concat(m, lp, halflife=0.2, at=t_join)
    # b141-142: a jump for joy (apex on b142.1)
    t0j = 11.25
    seg = M.trim(joy, t0j, 14.2)
    t_cut = min(m.duration, BARS(142) - (12.88 - t0j))
    m = M.concat(m, seg, halflife=0.22, at=t_cut)
    # b143: the cartwheel, hands on the ground on the downbeat
    cw = M.with_events(_clip("accad:Female1_D6_CartWheel"), kicks=False)
    c = M.trim(cw, 0.75, 4.75)
    inv = float(np.argmin(c.fk()[:, J["head"], 1])) / 60.0      # upside down: the head at its lowest
    t_cut = min(m.duration, BARS(143) - inv)
    m = M.concat(m, c, halflife=0.22, at=t_cut)
    t_stand = BARS(143) + (4.0 - 0.75 - inv)                  # on her feet again, settling
    m = M.concat(m, idle_seg(12.0, 2.0), halflife=0.35, at=min(m.duration, t_stand + 0.25))
    m = M.trim(m, 0.0, BARS(147) + 0.0)
    # 249.44: she stops and turns to face east. Turn the whole take so east is +Z and the turn is ~100 deg
    t_turn = 249.44 - S0
    k = int((t_turn - 0.1) * 60)
    h = M.heading(m, k)
    ang = math.radians(100.0)
    m = M.transform(m, yaw=-h - ang, pivot=(m.root[k, 0], 0.0, m.root[k, 2]))
    m = turn_in_place(m, t_turn, t_turn + 1.15, ang)
    t = m.times
    P = m.fk()
    m = M.look_at(m, P[:, J["head"]] + np.array([0.0, 0.3, 8.0]), M.ramp(t, t_turn - 0.25, t_turn + 0.35, t_turn + 1.3, t_turn + 2.0), max_deg=80.0)
    # b145-146: the pencil flourish: violet's writing gesture, once, large
    f0, f1 = BARS(145), BARS(146)
    k = int(f0 * 60)
    org = np.array([m.root[k, 0], 0.0, m.root[k, 2]])
    W = lambda p: org + np.asarray(p, dtype=np.float64)
    Pf = m.fk()
    keys = [(f0 - 0.75, tuple(Pf[int((f0 - 0.75) * 60), J["handR"]])), (f0 - 0.2, W([0.30, 1.02, 0.34])), (f0, W([0.36, 1.08, 0.36])),
            (f0 + 0.55, W([0.16, 1.62, 0.44])), (f0 + 1.05, W([-0.22, 1.74, 0.36])), (f1, W([-0.58, 1.52, 0.16])),
            (f1 + 0.22, W([-0.62, 1.60, 0.10])), (f1 + 0.9, W([-0.42, 1.2, 0.12])), (f1 + 1.6, tuple(Pf[int((f1 + 1.6) * 60), J["handR"]]))]
    wR = M.ramp(t, f0 - 0.75, f0 - 0.25, f1 + 0.7, f1 + 1.6)
    fing = [(f0 - 0.75, (0, -1, 0.2)), (f0, (0.3, 0.2, 1)), (f0 + 0.8, (0, 0.8, 0.6)), (f1, (-0.8, 0.5, 0.3)), (f1 + 1.6, (0, -1, 0.2))]
    palm = [(f0 - 0.75, (1, 0, 0)), (f0, (0.8, -0.5, 0)), (f0 + 0.8, (0.3, -0.3, 1)), (f1, (0, -0.5, 1)), (f1 + 1.6, (1, 0, 0))]
    pole = [(f0 - 0.75, (-0.5, -1, -0.3)), (f0 + 0.8, (-1, -0.3, -0.2)), (f1, (-0.3, -1, -0.4)), (f1 + 1.6, (-0.5, -1, -0.3))]
    yw = PchipInterpolator([f0 - 0.6, f0, f1, f1 + 1.4], np.radians([0, 22.0, -30.0, 0.0]))(np.clip(t, f0 - 0.6, f1 + 1.4))
    m = spine_turn(m, yaw=yw, pitch=-math.radians(8.0) * M.ramp(t, f0, f0 + 0.9, f1, f1 + 1.0))
    up = 0.03 * M.ramp(t, f0 + 0.1, f0 + 0.8, f1, f1 + 0.6)
    sx = PchipInterpolator([f0 - 0.6, f0, f1, f1 + 1.4], [0, 0.06, -0.09, 0.0])(np.clip(t, f0 - 0.6, f1 + 1.4))
    m = M.shift_root(m, np.stack([sx, up, 0 * sx], 1), keep_feet=True)
    m, tg = hand_path(m, "R", keys, wR, fingers=fing, palm=palm, pole=pole)
    m = M.additive(m, "upArmL", np.stack([0 * t, 0 * t, -math.radians(28.0) * M.ramp(t, f0, f0 + 0.8, f1, f1 + 1.0)], 1))   # the other arm opens
    m = M.look_at(m, tg, 0.8 * M.ramp(t, f0 - 0.2, f0 + 0.3, f1 + 0.2, f1 + 0.9), max_deg=70.0)
    m = M.ground_clamp(m, floor=0.0)
    # b147-148: walks on, east
    wk = M.drive(_walk(), 3.6)
    wk = M.ground_clamp(M.foot_lock(wk), floor=0.0)
    m = M.concat(m, wk, halflife=0.3)
    m = M.trim(m, 0.0, 21.0)
    m = M.despike(M.plant_hands(m), joints=("upArmL", "upArmR", "foreArmL", "foreArmR", "handL", "handR"))
    ev = [(BARS(138), "skip_apex"), (BARS(139), "whirl"), (BARS(141), "leap_apex"), (BARS(142), "joy_apex"),
          (BARS(143), "cartwheel"), (t_turn, "turn_east"), (f0, "flourish_start"), (f1, "flourish_end"), (BARS(147), "walk")]
    return finish(m, S0, ev, east="+Z at the end")


# ----------------------------------------------------------------------------- the lives
# 7 s each: 4.5 s of the activity, then the SAME look-back over the right shoulder (starts 4.5,
# reaches its hold at 5.4, held to the end) so that a cut between lives lands on one shared move.
LIFE_T, LOOK_T0, LOOK_T1 = 7.0, 4.5, 5.4


def _still(p, dur=LIFE_T):
    n = int(round(dur * 60)) + 1
    return M.Motion(np.repeat(p.root[None], n, 0), np.repeat(p.R[None], n, 0))


def _act(t):
    """Activity envelope: full until just before the look-back, then the hands come to rest."""
    return 1.0 - 0.85 * M.ramp(t, LOOK_T0 - 0.25, LOOK_T0 + 0.35)


def _life(m, seated=False, twist=28.0, **meta):
    m = M.trim(m, 0.0, LIFE_T)
    m = lookback(m, LOOK_T0, LOOK_T1, seated=seated, twist=twist, arm=False)
    if seated:
        m = M.rest_on_ground(m)
    m = M.ground_clamp(m, floor=0.0)
    return finish(m, None, [(LOOK_T0, "look_start"), (LOOK_T1, "look")], **meta)


def _hands(m, keysL=None, keysR=None, wL=None, wR=None, **kw):
    for s, keys, w in (("L", keysL, wL), ("R", keysR, wR)):
        if keys is None:
            continue
        if callable(keys):
            tgt = keys(m.times)
            hr = None
            if kw.get("fingers" + s) is not None:
                hr = np.stack([M.hand_frame(s, kw["fingers" + s], kw["palm" + s])] * m.frames)
            pole = kw.get("pole" + s)
            m = M.arm_ik(m, s, tgt, np.ones(m.frames) if w is None else w, pole=None if pole is None else np.asarray(pole, float)[None], hand_R=hr)
        else:
            m, _ = hand_path(m, s, keys, np.ones(m.frames) if w is None else w, fingers=kw.get("fingers" + s), palm=kw.get("palm" + s), pole=kw.get("pole" + s))
    return m


def _seat_pose(bench=0.47):
    """Seated on a bench: thighs level, feet flat."""
    p = M.Poser()
    p.hips(pos=(0.0, bench + 0.085, 0.0))
    for s, sg in (("L", 1.0), ("R", -1.0)):
        p.foot(s, (sg * 0.13, 0.44), yaw=sg * 6.0, space="world", knee=(sg * 0.15, 0.3, 1.0))
    return p


@recipe("life_piano")
def life_piano():
    """jade/piano: seated at the keys (bench 0.47 m), playing, the body swaying with it. Upper body from
    CMU 80_70 (a piano mime) on an authored seat; then the shared look-back."""
    p = _seat_pose()
    p.spine(pitch=7.0)
    low = _still(p)
    src = _clip("cmu:80_70")
    up = M.trim(src, 9.0, 9.0 + LIFE_T)
    m = M.graft_upper(low, up, joints=("spine",), hips=0.5)
    t = m.times
    # make sure the hands are at the keyboard (0.74 m, 0.38 m in front), whatever the mime's height was
    P = m.fk()
    for s in "LR":
        h = P[:, J["hand" + s]].copy()
        h[:, 1] = 0.76 + (h[:, 1] - h[:, 1].mean()) * 0.8
        h[:, 2] = 0.36 + (h[:, 2] - h[:, 2].mean()) * 0.6
        fr = M.hand_frame(s, (0.0, -0.25, 1.0), (0.0, -1.0, -0.2))
        m = M.arm_ik(m, s, h, 0.9 * np.ones(m.frames), hand_R=np.stack([fr] * m.frames))
    sway = math.radians(3.5) * np.sin(2 * np.pi * t / (2 * BAR)) * _act(t)
    m = spine_turn(m, roll=sway, pitch=math.radians(3.0) * np.sin(2 * np.pi * t / BAR + 1.0) * _act(t))
    return _life(m, seated=True, twist=24.0, prop="bench 0.47 m; keys at y 0.74, z 0.38", source="80_70")


@recipe("life_violin")
def life_violin():
    """jade/violin: standing, bowing (CMU 80_36, a violin mime); then the shared look-back."""
    src = _clip("cmu:80_36")
    m = M.place(M.trim(src, 8.4, 8.4 + LIFE_T), 0, 0.0, (0.0, 0.0))
    m = B._calm_head(m, 0.6)
    return _life(m, twist=22.0, source="80_36")


@recipe("life_wetlab")
def life_wetlab():
    """jade/wet-lab: standing at the bench: a tube held steady in the left hand, the right pipetting
    into it, careful; a reach to the rack; then the shared look-back."""
    m = idle_seg(LIFE_T, 1.0)
    t = m.times
    a = _act(t)
    m = spine_turn(m, pitch=math.radians(9.0) * np.ones(m.frames))
    tube = np.array([0.09, 1.13, 0.30])
    kL = lambda tt: np.tile(tube, (len(tt), 1)) + 0.004 * np.stack([np.sin(1.3 * tt), np.sin(2.1 * tt + 1), np.sin(1.7 * tt + 2)], 1)
    press = lambda c, w=0.16: np.exp(-0.5 * ((t - c) / w) ** 2)
    dy = -0.045 * (press(1.0) + press(1.75) + press(4.05)) * 1.0
    kR = [(0.0, (-0.02, 1.27, 0.31)), (2.15, (-0.02, 1.27, 0.31)), (2.75, (-0.34, 1.06, 0.40)), (2.95, (-0.34, 1.01, 0.40)),
          (3.2, (-0.34, 1.08, 0.40)), (3.75, (-0.02, 1.27, 0.31)), (LIFE_T, (-0.02, 1.27, 0.31))]
    m = _hands(m, keysL=kL, fingersL=(-0.3, 0.7, 0.6), palmL=(-1, 0, 0.3), poleL=(0.6, -1, -0.2))
    m, tg = hand_path(m, "R", kR, np.ones(m.frames), fingers=(0.2, -0.8, 0.4), palm=(1, 0, 0), pole=np.array([-0.8, -0.6, -0.2])[None])
    P = m.fk()
    m = M.arm_ik(m, "R", P[:, J["handR"]] + np.stack([0 * dy, dy, 0 * dy], 1), hand_R=m.R[:, J["handR"]].copy())
    m = M.look_at(m, np.tile(tube + [0, 0.04, 0], (m.frames, 1)) * (1 - M.ramp(t, 2.3, 2.7, 3.3, 3.7))[:, None]
                  + np.array([-0.34, 1.0, 0.4]) * M.ramp(t, 2.3, 2.7, 3.3, 3.7)[:, None], 0.9 * a, max_deg=60.0)
    return _life(m, prop="bench top about y 0.95; tube at (0.09, 1.13, 0.30); rack at (-0.34, 1.0, 0.40)")


def _cross_legged():
    p = M.Poser()
    p.hips(pos=(0.0, 0.105, 0.0), pitch=-4.0)
    p.spine(pitch=24.0)
    p.head(pitch=14.0)
    p.leg("L", (-0.10, 0.07, 0.33), "world", knee=(1.0, 0.25, 0.55), knee_space="world", toes=(-0.9, -0.1, 0.35), top=(0.2, 0.6, 0.8), dir_space="world")
    p.leg("R", (0.13, 0.065, 0.42), "world", knee=(-1.0, 0.25, 0.55), knee_space="world", toes=(0.9, -0.1, 0.35), top=(-0.2, 0.6, 0.8), dir_space="world")
    return p.unpin("legs")


@recipe("life_poet")
def life_poet():
    """jade/poet: cross-legged on the ground, a notebook on her left knee, writing; she stops, looks
    up for the word, writes again; then the shared look-back."""
    p = _cross_legged()
    m = _still(p)
    t = m.times
    a = _act(t)
    P = m.fk()
    knee = P[0, J["shinL"]]
    book = knee + np.array([-0.07, 0.07, 0.03])
    kL = lambda tt: np.tile(book + [0.05, 0.02, -0.03], (len(tt), 1)) + 0.003 * np.stack([np.sin(0.9 * tt), np.sin(1.4 * tt), 0 * tt], 1)
    m = _hands(m, keysL=kL, fingersL=(-0.6, 0.0, 0.8), palmL=(0, -1, 0), poleL=(1, -0.3, -0.3))
    think = M.ramp(t, 1.9, 2.3, 3.0, 3.4)
    line = ((t * 0.55) % 1.0)                                  # a line of writing every 1.8 s
    wx = book[0] + 0.05 - 0.11 * line
    wig = 0.011 * np.sin(2 * np.pi * 4.2 * t) * a * (1 - think)
    wr = np.stack([wx, book[1] + 0.035 + wig + 0.07 * think, book[2] + 0.02 + 0.5 * wig + 0.03 * think], 1)
    wr = wr * a[:, None] + wr[int(LOOK_T0 * 60)] * (1 - a[:, None])
    m = M.arm_ik(m, "R", wr, pole=np.array([-0.9, -0.5, -0.2])[None],
                 hand_R=np.stack([M.hand_frame("R", (0.5, -0.5, 0.7), (0.7, -0.6, -0.2))] * m.frames))
    m = M.drift(m, ["spine"], deg=1.5, period=6.0, seed=2)
    m = M.breathe(m, period=3.8, depth=1.0, sway=0.0)
    up = think
    m = M.additive(m, "neck", np.stack([-math.radians(14.0) * up, math.radians(8.0) * up, 0 * up], 1))
    m = M.additive(m, "head", np.stack([-math.radians(24.0) * up, math.radians(12.0) * up, 0 * up], 1))
    return _life(m, seated=True, twist=24.0, prop="notebook on the left knee at (%.2f, %.2f, %.2f)" % tuple(book))


@recipe("life_nasa")
def life_nasa():
    """jade/nasa-ames: braced in the wind of the tunnel (it blows from +Z): leaning in, one forearm up
    shielding her eyes, the other arm back for balance, buffeted; a gust, a half step; then the look-back."""
    p = M.Poser()
    p.hips(pos=(0.0, 0.925, 0.02), pitch=13.0)
    p.foot("L", (0.11, 0.24), yaw=8.0, space="world")
    p.foot("R", (-0.13, -0.26), yaw=-32.0, space="world")
    p.spine(pitch=7.0)
    p.head(pitch=6.0)
    p.arm_fk("L", raise_=42.0, fwd=-30.0, elbow=18.0)
    p.arm("R", (0.03, 1.565, 0.335), "world", pole=(-1.0, 0.25, 0.25), pole_space="world", fingers=(1, 0.25, 0.15), palm=(0.0, -0.3, 1), dir_space="world")
    m = _still(p)
    t = m.times
    a = _act(t)
    g = M.ramp(t, 1.7, 2.0, 2.2, 2.9)                           # the gust shoves her back, she leans in again
    P = m.fk()
    m = M.shift_root(m, np.stack([0 * t, -0.01 * g, -0.07 * g + 0.03 * M.ramp(t, 2.9, 3.6)], 1), keep_feet=True,
                     con=np.ones((m.frames, 2), dtype=bool))
    m = spine_turn(m, pitch=-math.radians(8.0) * g + math.radians(5.0) * M.ramp(t, 2.6, 3.4) * a)
    m = M.drift(m, ["spine", "chest"], deg=1.8, period=1.3, seed=21, weight=a)
    m = M.drift(m, ["upArmL", "foreArmL"], deg=5.0, period=1.1, seed=22, weight=a)
    m = M.drift(m, ["upArmR"], deg=2.0, period=1.5, seed=23, weight=a)
    m = M.drift(m, ["head"], deg=2.0, period=1.7, seed=24, weight=a)
    return _life(m, twist=20.0, wind="from +Z, strong", sim={"wind": [0.5, 1.0, -26.0], "gust": 0.55})   # P1: the figure's sim reads meta.sim (hair, straps and hems stream downwind)


@recipe("life_band")
def life_band():
    """jade/robot-ninja-apocalypse: strumming a guitar, stepping to it (quarter notes at 138 BPM),
    head nodding; then the shared look-back."""
    m = idle_seg(LIFE_T, 9.0)
    t = m.times
    a = _act(t)
    ph = 2 * np.pi * t / BEAT
    bounce = -0.022 * (0.5 - 0.5 * np.cos(ph)) * a
    sway = 0.055 * np.sin(ph / 2.0) * a
    m = M.shift_root(m, np.stack([sway, bounce - 0.02, 0 * t], 1), keep_feet=True, con=np.ones((m.frames, 2), dtype=bool))
    m = spine_turn(m, pitch=-math.radians(5.0) + math.radians(3.0) * np.cos(ph) * a, roll=math.radians(3.0) * np.sin(ph / 2.0) * a,
                   yaw=math.radians(10.0) * np.ones(m.frames))
    neck = np.array([0.43, 1.19, 0.17])
    kL = lambda tt: np.tile(neck, (len(tt), 1)) + np.stack([0.03 * np.sin(2 * np.pi * tt / (2 * BAR)), 0.012 * np.sin(2 * np.pi * tt / BAR), 0 * tt], 1)
    strum = np.sin(ph) * a                                      # down on the beat, up between
    kR = lambda tt: np.stack([-0.07 + 0.015 * strum, 0.99 - 0.075 * strum, 0.235 + 0.01 * np.cos(ph)], 1)
    m = _hands(m, keysL=kL, keysR=kR, fingersL=(0.2, 0.9, 0.3), palmL=(-0.3, 0.2, -1), poleL=(0.5, -1, 0.1),
               fingersR=(0.75, -0.6, 0.2), palmR=(0.1, 0.2, -1), poleR=(-1, -0.2, -0.3))
    nod = math.radians(6.0) * (0.5 - 0.5 * np.cos(ph)) * a
    m = M.additive(m, "head", np.stack([nod, 0 * nod, 0 * nod], 1))
    return _life(m, prop="guitar: neck hand at (0.43, 1.19, 0.17), strumming hand near (-0.07, 0.99, 0.235)", bpm=138)


@recipe("life_wushu")
def life_wushu():
    """jade/wushu: ready, bow stance with a straight punch (gongbu chongquan), drop into the low
    crouching stance (pubu) with the arm sweeping along the extended leg, rise; then the look-back."""
    def fists(p, L=None, R=None):
        for s, sg, tgt in (("L", 1.0, L), ("R", -1.0, R)):
            if tgt is None:                                     # chambered at the hip
                p.arm(s, (sg * 0.21, 1.0, -0.02), "body", pole=(sg * 0.2, -0.2, -1.0), fingers=(0, 0.1, 1), palm=(0, 1, 0))
            else:
                p.arm(s, tgt[0], "world", pole=tgt[1], pole_space="world", fingers=tgt[2], palm=tgt[3], dir_space="world")
        return p
    ready = M.Poser()
    ready.foot("L", (0.06, 0.0), space="world").foot("R", (-0.06, 0.0), space="world")
    fists(ready)
    gong = M.Poser()                                            # bow stance to her front-left, punch with the right
    gong.hips(pos=(0.10, 0.74, 0.16), yaw=18.0, pitch=6.0)
    gong.foot("L", (0.24, 0.62), yaw=20.0, space="world").foot("R", (-0.10, -0.42), yaw=-40.0, space="world")
    gong.spine(yaw=22.0)
    fists(gong, R=((0.14, 1.19, 0.80), (-0.3, -1, 0), (0.25, 0, 1), (1, 0, 0)))
    gong.look(direction=(0.25, 0.0, 1.0), space="world")
    pu = M.Poser()                                              # pubu: sits on the right leg, the left leg long to the side
    pu.hips(pos=(-0.22, 0.36, -0.02), yaw=30.0, pitch=22.0, roll=-8.0)
    pu.foot("R", (-0.30, -0.02), yaw=-55.0, space="world", knee=(-0.9, 0.3, 0.5))
    pu.foot("L", (0.70, 0.10), yaw=-10.0, space="world")
    pu.spine(pitch=10.0, yaw=20.0)
    fists(pu, L=((0.52, 0.30, 0.20), (0.2, 0.3, -1), (1, -0.2, 0.2), (0, -1, 0)),
          R=((-0.52, 1.02, -0.30), (-0.3, -1, -0.2), (-0.8, 0.5, -0.3), (0, -0.4, -1)))
    pu.look(direction=(1.0, -0.25, 0.25), space="world")
    up = M.Poser()                                              # rises into a bow stance toward the extended leg
    up.hips(pos=(0.30, 0.76, 0.04), yaw=62.0, pitch=5.0)
    up.foot("R", (-0.30, -0.02), yaw=10.0, space="world").foot("L", (0.70, 0.10), yaw=70.0, space="world")
    fists(up, L=((0.98, 1.22, 0.12), (0.2, -1, -0.3), (1, 0.1, 0.1), (0, 0, -1)))
    up.look(direction=(1.0, 0.0, 0.15), space="world")
    keys = [(0.0, ready), (0.45, ready), (0.92, gong, "out3"), (1.75, gong), (2.3, pu, "io"), (3.1, pu),
            (3.62, up, "out"), (LIFE_T, up)]
    m = M.keyframes(keys, overlap=0.02, soften=10.0)
    m = M.breathe(m, period=2.9, depth=1.0, sway=0.0)
    return _life(m, twist=18.0, events_note="punch 0.92, pubu 2.3, rise 3.62")


@recipe("life_stage")
def life_stage():
    """jade/sandstorm: on stage, the live demo worked: both fists go up with a little jump, a second
    pump, hands open to the room; then the shared look-back."""
    st = idle_seg(0.5, 2.0)
    base = M.Poser(st, 0)

    def pose(dy=0.0, raise_=14.0, elbow=12.0, fwd=4.0, spine=0.0, head=0.0, air=False, toes=0.0):
        p = base.copy()
        Pk = p.P()
        p.hips(dy=dy, legs=True)
        p.spine(pitch=spine)
        p.head(pitch=head)
        for s in "LR":
            p.arm_fk(s, raise_=raise_, fwd=fwd, elbow=elbow)
            if air:
                p.bend("foot" + s, pitch=toes)
            else:
                p.leg(s, Pk[J["foot" + s]], "world")
                p.R[J["foot" + s]], p.R[J["toe" + s]] = base.R[J["foot" + s]], base.R[J["toe" + s]]
        return p.unpin("legs") if air else p
    keys = [(0.0, pose()), (0.55, pose()), (0.85, pose(dy=-0.13, raise_=24.0, elbow=70.0, spine=10.0, head=4.0), "io"),
            (1.08, pose(dy=0.03, raise_=150.0, elbow=38.0, fwd=10.0, spine=-8.0, head=-12.0), "in"),
            (1.26, pose(dy=0.16, raise_=158.0, elbow=30.0, fwd=6.0, spine=-10.0, head=-16.0, air=True, toes=-34.0), "out"),
            (1.45, pose(dy=0.02, raise_=152.0, elbow=44.0, fwd=8.0, spine=-6.0, head=-10.0), "in"),
            (1.62, pose(dy=-0.09, raise_=140.0, elbow=62.0, fwd=10.0, spine=2.0, head=-4.0), "out"),
            (2.0, pose(dy=0.0, raise_=154.0, elbow=28.0, fwd=6.0, spine=-7.0, head=-12.0), "io"),
            (2.35, pose(dy=-0.03, raise_=132.0, elbow=80.0, fwd=14.0, spine=0.0, head=-4.0), "io"),
            (2.62, pose(dy=0.01, raise_=156.0, elbow=24.0, fwd=6.0, spine=-8.0, head=-12.0), "out"),
            (3.3, pose(dy=0.0, raise_=150.0, elbow=30.0, fwd=6.0, spine=-6.0, head=-8.0)),
            (4.3, pose(dy=0.0, raise_=62.0, elbow=30.0, fwd=30.0, spine=-2.0, head=0.0)),
            (LIFE_T, pose(dy=0.0, raise_=46.0, elbow=34.0, fwd=32.0))]
    m = M.keyframes(keys, overlap=0.05, soften=9.0)
    m = M.breathe(m, period=2.4, depth=1.4, sway=0.004)
    return _life(m, events_note="jump apex 1.26, second pump 2.62")


@recipe("life_home")
def life_home():
    """jade/home: sitting on the ground at night, leaning back on one hand, pointing up at the sky and
    tracing a circle with her arm (the planets go round); then the shared look-back."""
    seat = _seated_src()
    m = M.trim(M.concat(seat, seat, halflife=0.6, lock=False), 0.0, LIFE_T)
    t = m.times
    a = _act(t)
    m = spine_turn(m, pitch=-math.radians(15.0) * np.ones(m.frames))
    P = m.fk()
    hp = P[0, J["hips"]]
    kL = lambda tt: np.tile(hp + np.array([0.33, -hp[1] + 0.035, -0.30]), (len(tt), 1))
    m = _hands(m, keysL=kL, fingersL=(0.5, 0.0, -0.85), palmL=(0, -1, 0), poleL=(0.6, 0.2, -1.0))
    P = m.fk()
    sh = P[:, J["upArmR"]]
    ang = 2 * np.pi * (t - 0.9) / 2.5
    rise = M.ramp(t, 0.25, 0.9)
    axis = M.unit(np.array([-0.18, 0.80, 0.56]))                # where the sky is
    e1 = M.unit(np.cross(axis, [0, 1, 0]))
    e2 = np.cross(axis, e1)
    cone = math.radians(17.0) * (0.25 + 0.75 * M.ramp(t, 0.9, 1.6)) * (0.35 + 0.65 * a)
    d = (axis[None] * np.cos(cone)[:, None] + (e1[None] * np.cos(ang)[:, None] + e2[None] * np.sin(ang)[:, None]) * np.sin(cone)[:, None])
    wr = sh + d * 0.49
    hr = np.stack([M.hand_frame("R", d[i], np.cross(d[i], [1.0, 0, 0])) for i in range(m.frames)])
    m = M.arm_ik(m, "R", wr, rise, pole=np.array([-1.0, -0.6, 0.0])[None], hand_R=hr)
    m = M.look_at(m, sh + d * 6.0, 0.85 * rise, share=(("neck", 0.4), ("head", 0.6)), max_deg=60.0)
    return _life(m, seated=True, twist=22.0, sky_dir=[-0.18, 0.80, 0.56], note="one circle every 2.5 s from t=0.9")
