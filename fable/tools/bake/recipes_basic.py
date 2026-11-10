"""Phase-1 tracks: the basic vocabulary. Each recipe returns a Motion; bake.py writes it.

A recipe is just a function registered with @recipe("name"): load source clips with
M.load_clip(spec), edit with the ops in motion.py, return the Motion (set .loop / .events / .meta).
"""
from __future__ import annotations

import math

import numpy as np

import motion as M

RECIPES = {}


def recipe(name):
    def deco(fn):
        RECIPES[name] = fn
        return fn
    return deco


def _gait_loop(spec, lo, hi, blend=0.18):
    """Best seamless in-place gait cycle from a locomotion clip, starting on a left footfall."""
    src = M.with_events(M.load_clip(spec), jumps=False, kicks=False)
    t0, t1, cost = M.find_cycle(src, lo, hi)
    cy = M.make_cycle(src, t0, t1, blend=blend, in_place=True)
    fl = cy.ev("footL")
    if fl:
        cy = M.roll(cy, fl[0])
    cy.meta.update({"cycle_cost": round(cost, 4), "cycle_src": [round(t0, 3), round(t1, 3)],
                    "note": "in place; engine moves the root at meta.speed (m/s) x playback rate along +Z"})
    return cy


@recipe("walk_loop")
def walk_loop():
    return _gait_loop("accad:Female1_B03_Walk1", 0.9, 1.5)


@recipe("run_loop")
def run_loop():
    return _gait_loop("cmu:09_09", 0.6, 1.0, blend=0.12)


@recipe("sprint_loop")
def sprint_loop():
    return _gait_loop("accad:Female1_C03_Run", 0.55, 0.95, blend=0.12)


@recipe("run_fwd")
def run_fwd():
    """8 s of run_loop driven straight along +Z with root motion (feet locked): a root-motion example."""
    m = M.drive(run_loop(), 8.0)
    return M.ground_clamp(M.foot_lock(m), floor=0.0)


@recipe("walk_fwd")
def walk_fwd():
    m = M.drive(walk_loop(), 8.0)
    return M.ground_clamp(M.foot_lock(m), floor=0.0)


def _idle_base():
    """20.00 s standing loop from ACCAD Female1 'Look' (quiet stance, small head and weight shifts)."""
    src = M.load_clip("accad:Female1_A04_Look")
    t0, t1, cost = M.find_cycle(src, 19.5, 20.8)
    cy = M.make_cycle(src, t0, t1, blend=1.2, in_place=True, frames=1200, align_travel=False)
    cy = M.place(cy, 0, 0.0, (0.0, 0.0))
    cy.meta["cycle_cost"] = round(cost, 4)
    return _calm_head(cy, 0.4)


def _calm_head(m, keep=0.4):
    """The source actress keeps glancing about; scale neck/head motion toward its mean so she is calm."""
    L = M.to_local(m.R)
    for n in ("neck", "head"):
        j = M.J[n]
        mean = M.Rot.from_matrix(L[:, j]).mean().as_matrix()
        d = M.rotvec(L[:, j] @ mean.T)
        L[:, j] = M.expmap(d * keep) @ mean
    out = m.copy()
    out.R = M.from_local(L)
    return out


@recipe("idle")
def idle():
    cy = _idle_base()
    cy = M.breathe(cy, period=4.0, depth=1.0, sway=0.006, sway_period=10.0, seed=3)   # 5 breaths / loop
    cy = M.relock_loop(cy)
    cy.loop = True
    cy.events = []
    return cy


@recipe("lookback")
def lookback():
    """Standing; she turns head, shoulders and a little hip to look behind over her right shoulder,
    holds ~1.5 s, turns forward again. 5.5 s. Events: look (turn reaches its hold), look_end."""
    base = M.trim(M.tile(idle(), 2), 3.0, 8.5)
    base.loop = False
    t = base.times
    t_go, t_hold, t_back, t_end = 0.7, 1.75, 3.25, 4.45
    w = M.smootherstep((t - t_go) / (t_hold - t_go)) * (1.0 - M.smootherstep((t - t_back) / (t_end - t_back)))
    # the hips lead slightly, the head arrives last and leaves first
    w_hip = M.smootherstep((t - t_go + 0.10) / (t_hold - t_go)) * (1.0 - M.smootherstep((t - t_back - 0.15) / (t_end - t_back)))
    m = M.twist_pelvis(base, -math.radians(28.0) * w_hip)
    P = m.fk()
    yaw_t = -math.radians(152.0)                         # behind her, over the right shoulder
    tgt = P[:, M.J["head"]] + np.array([math.sin(yaw_t) * 6.0, -0.15, math.cos(yaw_t) * 6.0])
    m = M.look_at(m, tgt, w, max_deg=118.0)
    # weight goes to the back (right) foot and the far arm swings out a little
    hip_shift = np.stack([-0.035 * w_hip, -0.012 * w_hip, -0.02 * w_hip], 1)
    m = M.shift_root(m, hip_shift, keep_feet=True)
    m = M.additive(m, "upArmL", np.stack([0 * w, 0 * w, -math.radians(7.0) * w], 1))
    m = M.ground_clamp(m, floor=0.0)
    m.events = [{"t": t_hold, "name": "look"}, {"t": t_back, "name": "look_end"}]
    return m


@recipe("walk_lookback")
def walk_lookback():
    """Walking along +Z; she looks back over her right shoulder for ~1.5 s without stopping. 6 s."""
    m = M.drive(walk_loop(), 6.0)
    t = m.times
    w = M.smootherstep((t - 1.6) / 0.8) * (1.0 - M.smootherstep((t - 3.9) / 0.9))
    P = m.fk()
    yaw_t = -math.radians(150.0)
    tgt = P[:, M.J["head"]] + np.array([math.sin(yaw_t) * 6.0, -0.1, math.cos(yaw_t) * 6.0])
    m = M.look_at(m, tgt, w, share=(("spine", 0.10), ("chest", 0.22), ("neck", 0.26), ("head", 0.42)), max_deg=125.0)
    m = M.ground_clamp(M.foot_lock(m), floor=0.0)
    m.events = [e for e in m.events] + [{"t": 2.4, "name": "look"}, {"t": 3.9, "name": "look_end"}]
    m.events.sort(key=lambda e: e["t"])
    return m


@recipe("turn_around")
def turn_around():
    """Run in, plant, turn 180, run back out (ACCAD Female1 RunTurnAround, whole clip)."""
    m = M.with_events(M.load_clip("accad:Female1_C17_RunTurnAround"), kicks=False)
    P = m.fk()
    yaw = np.unwrap(M.yaw_of(m.R[:, 0]))
    k = int(np.argmin(np.abs(yaw - (yaw[0] + np.sign(yaw[-1] - yaw[0]) * math.pi / 2))))
    return m.add_event(k / m.fps, "turn")


@recipe("walk_turn")
def walk_turn():
    """Walk, turn 180 on the spot, walk back (ACCAD Female1 WalkTurnAround180, 3 s either side of the turn)."""
    src = M.with_events(M.load_clip("accad:Female1_B15_WalkTurnAround180"), jumps=False, kicks=False)
    yaw = np.unwrap(M.yaw_of(src.R[:, 0]))
    k = int(np.argmin(np.abs(yaw - (yaw[0] + np.sign(yaw[-1] - yaw[0]) * math.pi / 2))))
    tk = k / src.fps
    m = M.trim(src, max(0.0, tk - 3.0), min(src.duration, tk + 3.0))
    m = M.place(m, 0, 0.0, (0.0, 0.0))
    return m.add_event(tk - max(0.0, tk - 3.0), "turn")


@recipe("butterfly")
def butterfly():
    """CMU 88_06: approach, wind-up, butterfly kick (xuanzi-like horizontal spin jump), landing, settle."""
    m = M.with_events(M.load_clip("cmu:88_06"), kicks=False)
    return m


@recipe("sidekick")
def sidekick():
    """One high side kick with chamber and recoil (CMU 135_11, second kick, right leg, apex ~1.35 m)."""
    src = M.with_events(M.load_clip("cmu:135_11"))
    tk = [e["t"] for e in src.events if e["name"] == "kickR"][1]
    m = M.trim(src, tk - 1.2, tk + 1.15)
    m = M.place(m, 0, 0.0, (0.0, 0.0))
    m.events = [e for e in m.events if e["name"].startswith(("kick", "foot"))]
    return m


@recipe("form_test")
def form_test():
    """ACCAD Male2 Form_1 whole (18.5 s): retarget torture test - stances, punches, three kicks, a jump kick."""
    return M.with_events(M.load_clip("accad:Male2_Form_1"), strikes=True)
