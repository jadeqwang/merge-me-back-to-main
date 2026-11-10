"""M3: motion fixes asked for by the sequence directors (notes: fable/notes/M3_motionfix.md).

fork_go_L / fork_go_R   standing (idle) -> the fork's side step -> walking away, ONE track
drop_join               the thousand: hold the coil through the hero's solo butterfly, then join `drop`
run_from_stand          standing -> run, ends on a run_loop phase
run_to_stand            run_loop phase 0 -> brake -> stand
"""
from __future__ import annotations

import functools
import math

import numpy as np

import choreo_lib as C
import motion as M
import recipes_util as U

RECIPES = {}
J = M.J


def recipe(name):
    def deco(fn):
        RECIPES[name] = fn
        return fn
    return deco


def _ext(m, dur):
    """Open clip padded with its last frame to `dur` seconds."""
    n = int(round(dur * m.fps)) + 1
    if m.frames >= n:
        return M.trim(m, 0.0, dur)
    out = m.copy()
    k = n - m.frames
    out.root = np.concatenate([m.root, np.repeat(m.root[-1:], k, 0)])
    out.R = np.concatenate([m.R, np.repeat(m.R[-1:], k, 0)])
    return out


def _hold_start_feet(m, fade=0.22):
    """Each foot stays exactly where (and how) it stands in frame 0 until it first leaves the ground;
    the difference to the clip's own path is then given back during that first swing. Used where a
    clip is inertialised from another pose: the feet must not creep while the pose offset decays."""
    P = m.fk()
    out = m.copy()
    t = m.times
    for s in "LR":
        f, tj = J["foot" + s], J["toe" + s]
        q = P[:, f]
        sp = np.linalg.norm(np.gradient(q[:, [0, 2]], 1.0 / m.fps, axis=0), axis=1)
        up = np.where((q[:, 1] > q[0, 1] + 0.025) | (sp > 0.45))[0]
        k = int(up[0]) if len(up) else m.frames - 1
        u = M.smoothstep((t - t[k]) / fade)
        tgt = q.copy()
        tgt[:k] = q[0]
        tgt[k:] = q[k:] + (q[0] - q[k])[None] * (1.0 - u[k:, None])
        for j in (f, tj):
            Rj = m.R[:, j].copy()
            Q = M.rotvec(Rj[0] @ Rj[k].T)
            Rj[:k] = Rj[0]
            Rj[k:] = M.expmap(Q[None] * (1.0 - u[k:, None])) @ Rj[k:]
            out.R[:, j] = Rj
        out = M.leg_ik(out, s, tgt)
    return out


# ----------------------------------------------------------------------------- fork_go
IDLE_T = 2.604          # seq 01 leaves `idle` (time = song t) for the fork at b3 - 1.0 = 2.604: frame 0 is that pose
FORK_GO_DUR = 12.0


def _fork_go(side):
    """From the idle pose: the fork's decisive side step (leading foot planted at t = 1.0, exactly as
    fork_L / fork_R), and instead of closing the feet and settling, the trailing foot swings through
    into the first stride of walk_loop: she walks away along +Z at the loop's own speed. From
    meta.walk_from on, the pose is walk_loop at  loop time = meta.walk_phase_t + (t - meta.walk_from)."""
    sg = 1.0 if side == "L" else -1.0
    lead = side
    step = U.fork_L()
    if side == "R":
        step = M.mirror(step)
    step = M.place(step, 0, 0.0, (0.0, 0.0))
    A = _ext(step, FORK_GO_DUR)
    cy = U._walk()
    per, v = cy.meta["period"], cy.meta["speed"]
    ph0 = cy.ev("foot" + lead)[0] / per                   # the loop's phase at the leading foot's strike
    tb0 = 1.0
    B = M.drive(cy, FORK_GO_DUR, phase0=ph0 - tb0 / per)
    # put the walk's leading foot where the side step planted it
    k1, kb = int(1.1 * 60), int((tb0 + 0.12) * 60)
    la = A.fk()[k1, J["foot" + lead]]
    lb = B.fk()[kb, J["foot" + lead]]
    B.root[:, 0] += la[0] - lb[0]
    B.root[:, 2] += la[2] - lb[2]
    t = A.times
    w = M.smootherstep((t - 0.98) / 0.62)                  # body: side step -> walk
    wf = M.smootherstep((t - 1.04) / 0.42)                 # feet (world space): the trailing foot leaves for the first stride
    m = C.blend(A, B, w, wf=wf, lift=0.12, lift_max=0.07)
    # start exactly on the idle pose (inertialised into the step's anticipation)
    idle = U._idle()
    pre = M.sample(idle, IDLE_T + (np.arange(3) - 2) / 60.0, wrap=True)
    pre.loop, pre.events, pre.meta = False, [], {}
    m = M.trim(M.concat(pre, m, halflife=0.11, align=False, lock=False), 2.0 / 60.0, None)   # idle's own place and heading: no pop at pos = idle's pos
    m = M.ground_clamp(M.foot_lock(_hold_start_feet(m)), floor=0.0)
    x_end = float(np.mean(B.root[int(4 * 60):, 0]))
    walk_from = 1.75
    z_from = float(B.root[int(round(walk_from * 60)), 2])
    path = [[round(float(x), 3), round(float(z), 3)] for x, z in m.root[::60][:, [0, 2]]]
    m = M.with_events(m, jumps=False, kicks=False)
    meta = {"source": "fork_%s (ACCAD Female1 B22 SideStep) -> walk_loop (ACCAD Female1 B03 Walk1)" % side,
            "idle_t": IDLE_T, "step_t": 1.0, "step_x": round(x_end, 4), "walk_from": walk_from,
            "walk_phase_t": round(float(((ph0 + (walk_from - tb0) / per) % 1.0) * per), 4),
            "walk_z0": round(z_from, 4), "speed": round(float(v), 4), "root_path_xz_per_second": path,
            "note": "t >= walk_from: hips x = step_x (+- sway), z = walk_z0 + speed * (t - walk_from); pose = walk_loop at walk_phase_t + (t - walk_from)"}
    m.meta = {}
    return U.finish(m, None, [(1.0, "step"), (walk_from, "walk")], **meta)


@recipe("fork_go_L")
def fork_go_L():
    """A fork, left half, that walks away: idle pose -> side step to her left (planted at t=1.0) -> walking along +Z. 12 s."""
    return _fork_go("L")


@recipe("fork_go_R")
def fork_go_R():
    """A fork, right half, that walks away (same idle start pose, mirrored step, same walk_loop). 12 s."""
    return _fork_go("R")


# ----------------------------------------------------------------------------- run_from_stand / run_to_stand
def _idle_at(times, at=(0.0, 0.0)):
    """The idle loop sampled at `times` (wrapped), as an open clip standing on `at`."""
    m = M.sample(U._idle(), np.asarray(times, dtype=np.float64), wrap=True)
    m.loop, m.events, m.meta = False, [], {}
    m.root[:, 0] += at[0]
    m.root[:, 2] += at[1]
    return m


def _from_stand(cy, spec, t_a, k_foot, t_foot, dur, fade):
    """Standing (idle at time 0) -> the capture's start (trimmed from t_a, its k_foot-th footfall warped
    to track time t_foot) -> the in-place cycle `cy` driven along +Z at its own speed, entered on that
    footfall (body cross-fade over `fade` = (t0, t1), feet in world space)."""
    src = M.with_events(M.load_clip(spec), jumps=False, kicks=False)
    ff = [e for e in src.events if e["name"].startswith("foot")][k_foot]
    side = ff["name"][-1]
    seg = M.place(M.trim(src, t_a, None), 0, 0.0, (0.0, 0.0))
    seg = M.time_warp(seg, [(0.0, 0.0), (ff["t"] - t_a, t_foot), (seg.duration, t_foot + (seg.duration - (ff["t"] - t_a)))])
    # the capture's direction of travel at the end = +Z
    kf = int(round(t_foot * 60))
    d = seg.root[-1] - seg.root[max(0, kf - 20)]
    seg = M.transform(seg, -math.atan2(d[0], d[2]))
    A = _ext(seg, dur)
    per = cy.meta["period"]
    ph_foot = cy.ev("foot" + side)[0] / per
    B = M.drive(cy, dur, phase0=ph_foot - t_foot / per)
    k = int(round(0.5 * (fade[0] + fade[1]) * 60))                # the two meet hips on hips in the middle of the fade
    B.root[:, 0] += A.root[k, 0] - B.root[k, 0]
    B.root[:, 2] += A.root[k, 2] - B.root[k, 2]
    t = A.times
    w = M.smootherstep((t - fade[0]) / (fade[1] - fade[0]))
    wf = M.smootherstep((t - (fade[0] + 0.04)) / max(fade[1] - fade[0] - 0.10, 0.1))
    m = C.blend(A, B, w, wf=wf, lift=0.0)
    # the side drift of the capture is taken out while she accelerates: the run is on x = 0
    xe = float(np.mean(B.root[int(fade[1] * 60):, 0]))
    m.root[:, 0] -= xe * M.smoothstep(t / fade[1])
    pre = _idle_at((np.arange(3) - 2) / 60.0)
    m = M.trim(M.concat(pre, m, halflife=0.12, align=False, lock=False), 2.0 / 60.0, None)
    m = M.ground_clamp(M.foot_lock(_hold_start_feet(m)), floor=0.0)
    m = M.with_events(m, jumps=False, kicks=False)
    t_run = fade[1] + 0.05
    kr = int(round(t_run * 60))
    z_run = float(B.root[kr, 2])
    return m, {"source": spec.split(":")[1], "run_from": round(t_run, 4),
               "loop_phase_t": round(float(((ph_foot + (t_run - t_foot) / per) % 1.0) * per), 4),
               "loop_phase": round(float((ph_foot + (t_run - t_foot) / per) % 1.0), 4),
               "run_z0": round(z_run, 4), "speed": round(float(cy.meta["speed"]), 4),
               "travel_m": round(z_run, 3),
               "root_z_every_quarter_s": [round(float(z), 3) for z in m.root[::15, 2]]}


def _to_stand(cy, spec, t_a, mirror, t_stop, dur, settle=1.1):
    """The in-place cycle `cy` at phase 0 (frame 0, moving along +Z at its own speed) -> the capture's
    brake (trimmed from a footfall at t_a; mirrored if that footfall is the right foot's) -> at rest at
    t_stop -> settles into the idle pose facing +Z."""
    src = M.with_events(M.load_clip(spec), jumps=False, kicks=False)
    stop = M.trim(src, t_a, None)
    if mirror:
        stop = M.mirror(stop)
    stop = M.place(stop, 0, 0.0, (0.0, 0.0))
    d = stop.root[12] - stop.root[0]
    stop = M.transform(stop, -math.atan2(d[0], d[2]))            # it starts travelling along +Z
    per = cy.meta["period"]
    pre = M.drive(cy, 2.0 / 60.0, phase0=-(2.0 / 60.0) / per)    # 3 frames ending on phase 0
    pre.root[:, 2] -= pre.root[-1, 2]
    pre.root[:, 0] -= pre.root[-1, 0]
    a = M.trim(M.concat(pre, stop, halflife=0.13), 2.0 / 60.0, None)
    a.events = []
    ts = U.stop_time(a, 0.4)
    a = _ext(a, ts + 3.0)
    a = M.time_warp(a, [(0.0, 0.0), (0.22, 0.22), (ts, t_stop), (a.duration, t_stop + (a.duration - ts))])
    a = _ext(a, dur)
    # she stops straight ahead of where she was running: the capture's sideways drift is sheared out along the way
    kq = int(round((t_stop + 0.3) * 60))
    a.root[:, 0] -= a.root[kq, 0] * np.clip(a.root[:, 2] / max(a.root[kq, 2], 1e-6), 0.0, 1.0)
    a = M.ground_clamp(M.foot_lock(a), floor=0.0)
    # settle: the last steps of the capture melt into the idle stance, facing +Z, over the place she stopped
    ks = int(round((t_stop + 0.25) * 60))
    P = a.fk()
    mid = 0.5 * (P[ks, J["footL"]] + P[ks, J["footR"]])
    i0 = U._idle()
    Pi = i0.fk()[0]
    imid = 0.5 * (Pi[J["footL"]] + Pi[J["footR"]])
    at = (float(mid[0] - imid[0]), float(mid[2] - imid[2]))
    t = a.times
    B = _idle_at(t - t_stop, at)
    w = M.smootherstep((t - (t_stop - 0.05)) / settle)
    m = C.blend(a, B, w, lift=0.35, lift_max=0.06)
    m = M.ground_clamp(m, floor=0.0)
    m = M.with_events(m, jumps=False, kicks=False)
    idle_from = t_stop - 0.05 + settle
    return m, {"source": spec.split(":")[1] + (" (mirrored)" if mirror else ""), "stop_t": t_stop, "idle_from": round(idle_from, 4), "idle_t0": t_stop,
               "stand_xz": [round(at[0], 4), round(at[1], 4)], "travel_m": round(at[1], 3), "speed_in": round(float(cy.meta["speed"]), 4),
               "root_z_every_quarter_s": [round(float(z), 3) for z in m.root[::15, 2][:13]]}


@recipe("run_from_stand")
def run_from_stand():
    """Standing (idle pose) -> run: accelerates over 1.5 s (ACCAD Male2 C1 StandToRun) into run_loop, along +Z. 3 s; pure run_loop from meta.run_from."""
    m, meta = _from_stand(U._run(), "accad:Male2_C1_StandToRun", 1.80, 2, 1.36, 3.0, (1.05, 1.45))
    m.meta = {}
    return U.finish(m, None, [(meta["run_from"], "run")], **meta)


@recipe("run_to_stand")
def run_to_stand():
    """run_loop phase 0 -> brakes and stops in 1.2 s (ACCAD Male2 C2 RunToStand) -> settles into the idle stance, facing +Z. 4 s."""
    m, meta = _to_stand(U._run(), "accad:Male2_C2_RunToStand", 0.28, True, 1.2, 4.0)
    m.meta = {}
    return U.finish(m, None, [(1.2, "stop"), (meta["idle_from"], "idle")], **meta)
