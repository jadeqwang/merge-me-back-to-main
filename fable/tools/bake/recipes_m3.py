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
