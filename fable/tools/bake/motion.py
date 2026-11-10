"""fable motion library: retarget mocap to the canonical 21-joint figure, edit it, write tracks.

Everything is numpy/scipy. A Motion is (root position, world rotation matrices) at a fixed fps;
joint positions always come from forward kinematics with FIXED canonical bone lengths, so limbs
never stretch. All editing ops are pure: they return a new Motion.

Convention (fable/SPEC.md section 5), stated once more because the figure module must agree:
    p_world = joint_pos + R_joint @ p_local          (R_joint = matrix of the stored quaternion)
    local +Y = along the bone, from the joint to its child (end joints: continues the limb)
    local +Z = the character's front at rest; for footL/R and toeL/R it is the TOP of the foot
    local +X = Y x Z  (for the spine chain that is the character's left)
    she faces +Z, her left is +X, Y is up, metres.

Typical use:
    import motion as M
    m = M.load_clip('cmu:88_06')                 # retargeted, 60 fps, feet on the ground, facing +Z
    m = M.time_warp(m, [(0, 0), (1.23, 0.87), (3.8, 2.6)])
    M.write_track(m, 'butterfly')
"""
from __future__ import annotations

import copy
import csv
import json
import math
import sys
from dataclasses import dataclass, field
from pathlib import Path

import numpy as np
from scipy.interpolate import CubicSpline, PchipInterpolator
from scipy.signal import butter, filtfilt, find_peaks
from scipy.spatial.transform import Rotation as Rot, RotationSpline

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
TRACKS = ROOT / "work_fable" / "tracks"
MOCAP = ROOT / "work_fable" / "mocap"
sys.path.insert(0, str(HERE.parent / "mocap"))
import bvh  # noqa: E402  (text parser only)

FPS = 60.0

# ----------------------------------------------------------------------------- skeleton
JOINTS = ["hips", "spine", "chest", "neck", "head",
          "clavL", "upArmL", "foreArmL", "handL",
          "clavR", "upArmR", "foreArmR", "handR",
          "thighL", "shinL", "footL", "toeL",
          "thighR", "shinR", "footR", "toeR"]
NJ = len(JOINTS)
J = {n: i for i, n in enumerate(JOINTS)}
_PARENT_NAME = {"hips": None, "spine": "hips", "chest": "spine", "neck": "chest", "head": "neck",
                "clavL": "chest", "upArmL": "clavL", "foreArmL": "upArmL", "handL": "foreArmL",
                "clavR": "chest", "upArmR": "clavR", "foreArmR": "upArmR", "handR": "foreArmR",
                "thighL": "hips", "shinL": "thighL", "footL": "shinL", "toeL": "footL",
                "thighR": "hips", "shinR": "thighR", "footR": "shinR", "toeR": "footR"}
PARENT = np.array([-1 if _PARENT_NAME[n] is None else J[_PARENT_NAME[n]] for n in JOINTS])

# Bone length = distance from the joint to its child along local +Y (end joints: to the tip).
# 1.65 m, long legs (hip joint at 0.93 m), 7.3 heads.
LEN = {"hips": 0.09, "spine": 0.13, "chest": 0.19, "neck": 0.09, "head": 0.15,
       "clav": 0.135, "upArm": 0.27, "foreArm": 0.235, "hand": 0.17,
       "thigh": 0.435, "shin": 0.41, "foot": 0.135, "toe": 0.07}
ANKLE_H = 0.085          # ankle joint above the sole when the foot is flat
BALL_H = 0.025           # toe joint (ball of the foot) above the sole
FOOT_PITCH = math.asin((ANKLE_H - BALL_H) / LEN["foot"])   # the flat foot's bone points this far down
CLAV_SLOPE = math.radians(12.0)
HIPS_H = ANKLE_H + LEN["shin"] + LEN["thigh"] + 0.075       # 1.005 m standing


def bone_len(name):
    return LEN[name.rstrip("LR")] if name[-1] in "LR" else LEN[name]


def _offsets():
    """Joint position in its parent's local frame."""
    off = np.zeros((NJ, 3))
    for n in JOINTS:
        p = _PARENT_NAME[n]
        if p is not None:
            off[J[n]] = (0.0, bone_len(p), 0.0)
    off[J["clavL"]] = (+0.023, 0.117, 0.0)
    off[J["clavR"]] = (-0.023, 0.117, 0.0)
    off[J["thighL"]] = (+0.085, -0.075, 0.0)
    off[J["thighR"]] = (-0.085, -0.075, 0.0)
    return off


OFFSET = _offsets()
LR_PAIRS = [(J[a], J[a[:-1] + "R"]) for a in JOINTS if a.endswith("L")]
CHILDREN = [[c for c in range(NJ) if PARENT[c] == j] for j in range(NJ)]


def descendants(j):
    out, stack = [], [j]
    while stack:
        k = stack.pop()
        out.append(k)
        stack.extend(CHILDREN[k])
    return out


# ----------------------------------------------------------------------------- small maths
def unit(v, axis=-1, eps=1e-12):
    v = np.asarray(v, dtype=np.float64)
    return v / np.maximum(np.linalg.norm(v, axis=axis, keepdims=True), eps)


def frame_from_yz(y, z):
    """Right-handed frame with +Y = y and +Z as close to z as possible. (...,3) -> (...,3,3)."""
    y = unit(y)
    z = np.asarray(z, dtype=np.float64)
    z = unit(z - np.sum(z * y, -1, keepdims=True) * y)
    x = np.cross(y, z)
    return np.stack([x, y, z], axis=-1)


def rot_y(a):
    a = np.asarray(a, dtype=np.float64)
    c, s = np.cos(a), np.sin(a)
    R = np.zeros(a.shape + (3, 3))
    R[..., 0, 0] = c; R[..., 0, 2] = s
    R[..., 1, 1] = 1
    R[..., 2, 0] = -s; R[..., 2, 2] = c
    return R


def rot_between(u, v):
    """Minimal rotation taking unit vectors u to v. (...,3) -> (...,3,3)."""
    u, v = unit(u), unit(v)
    ax = np.cross(u, v)
    c = np.sum(u * v, -1)
    K = np.zeros(ax.shape[:-1] + (3, 3))
    K[..., 0, 1] = -ax[..., 2]; K[..., 0, 2] = ax[..., 1]
    K[..., 1, 0] = ax[..., 2]; K[..., 1, 2] = -ax[..., 0]
    K[..., 2, 0] = -ax[..., 1]; K[..., 2, 1] = ax[..., 0]
    k = 1.0 / np.maximum(1.0 + c, 1e-9)
    R = np.eye(3) + K + (K @ K) * k[..., None, None]
    flip = c < -0.999999          # antiparallel: turn pi about any perpendicular axis
    if np.any(flip):
        uu = u[flip]
        perp = unit(np.cross(uu, np.where(np.abs(uu[..., :1]) < 0.9, [1.0, 0, 0], [0, 1.0, 0])))
        R[flip] = 2 * perp[..., :, None] * perp[..., None, :] - np.eye(3)
    return R


def rotvec(Rm):
    s = Rm.shape[:-2]
    return Rot.from_matrix(Rm.reshape(-1, 3, 3)).as_rotvec().reshape(s + (3,))


def expmap(r):
    s = r.shape[:-1]
    return Rot.from_rotvec(r.reshape(-1, 3)).as_matrix().reshape(s + (3, 3))


def T_(M):
    return np.swapaxes(M, -1, -2)


def smoothstep(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * (3 - 2 * x)


def smootherstep(x):
    x = np.clip(x, 0.0, 1.0)
    return x * x * x * (x * (6 * x - 15) + 10)


def yaw_of(Rm):
    """Heading (rad, 0 = facing +Z, positive toward +X) of frames (...,3,3) from their +Z axis."""
    f = Rm[..., :, 2]
    return np.arctan2(f[..., 0], f[..., 2])


def quat_continuous(Rm):
    """(F,3,3) -> (F,4) xyzw unit quaternions without sign flips."""
    q = Rot.from_matrix(Rm).as_quat()
    d = np.sum(q[1:] * q[:-1], axis=1)
    sign = np.concatenate([[1.0], np.cumprod(np.where(d < 0, -1.0, 1.0))])
    return q * sign[:, None]


# ----------------------------------------------------------------------------- Motion
@dataclass
class Motion:
    root: np.ndarray                     # (F,3) hips joint position
    R: np.ndarray                        # (F,21,3,3) world rotations
    fps: float = FPS
    events: list = field(default_factory=list)   # [{'t': seconds, 'name': str}]
    loop: bool = False
    meta: dict = field(default_factory=dict)

    @property
    def frames(self):
        return self.root.shape[0]

    @property
    def duration(self):
        """Seconds covered: a loop spans frames/fps, an open clip (frames-1)/fps."""
        return self.frames / self.fps if self.loop else (self.frames - 1) / self.fps

    @property
    def times(self):
        return np.arange(self.frames) / self.fps

    def copy(self):
        return Motion(self.root.copy(), self.R.copy(), self.fps, copy.deepcopy(self.events),
                      self.loop, copy.deepcopy(self.meta))

    def fk(self):
        return fk(self.root, self.R)

    def ev(self, name=None):
        return [e["t"] for e in self.events if name is None or e["name"] == name]

    def add_event(self, t, name):
        m = self.copy()
        m.events.append({"t": float(t), "name": name})
        m.events.sort(key=lambda e: e["t"])
        return m


def fk(root, R):
    F = R.shape[0]
    P = np.empty((F, NJ, 3))
    P[:, 0] = root
    for j in range(1, NJ):
        p = PARENT[j]
        P[:, j] = P[:, p] + R[:, p] @ OFFSET[j]
    return P


def to_local(R):
    L = R.copy()
    for j in range(1, NJ):
        L[:, j] = T_(R[:, PARENT[j]]) @ R[:, j]
    return L


def from_local(L):
    R = L.copy()
    for j in range(1, NJ):
        R[:, j] = R[:, PARENT[j]] @ L[:, j]
    return R


def rest_pose():
    """One-frame A-pose (arms 35 deg from the body), standing at the origin, facing +Z."""
    R = np.tile(np.eye(3), (1, NJ, 1, 1))
    a = math.radians(35.0)
    for s, sg in (("L", 1.0), ("R", -1.0)):
        R[0, J["clav" + s]] = frame_from_yz([sg * math.cos(CLAV_SLOPE), math.sin(CLAV_SLOPE), 0], [0, 0, 1])
        arm = frame_from_yz([sg * math.sin(a), -math.cos(a), 0], [0, 0, 1])
        for n in ("upArm", "foreArm", "hand"):
            R[0, J[n + s]] = arm
        leg = frame_from_yz([0, -1, 0], [0, 0, 1])
        R[0, J["thigh" + s]] = leg
        R[0, J["shin" + s]] = leg
        R[0, J["foot" + s]] = frame_from_yz([0, -math.sin(FOOT_PITCH), math.cos(FOOT_PITCH)], [0, 1, 0])
        R[0, J["toe" + s]] = frame_from_yz([0, 0, 1], [0, 1, 0])
    return Motion(np.array([[0.0, HIPS_H, 0.0]]), R)


# ----------------------------------------------------------------------------- sampling / time
def sample(m, t, wrap=None):
    """Motion sampled at arbitrary times t (seconds, array) with cubic rotation/position splines.
    wrap=True treats m as a seamless loop (m.meta['travel'] = root translation per cycle, if any)."""
    t = np.atleast_1d(np.asarray(t, dtype=np.float64))
    wrap = m.loop if wrap is None else wrap
    F = m.frames
    if F == 1:
        return Motion(np.repeat(m.root, len(t), 0), np.repeat(m.R, len(t), 0), m.fps)
    if wrap:
        period = F / m.fps
        travel = np.asarray(m.meta.get("travel", (0.0, 0.0, 0.0)), dtype=np.float64)
        pad = 3
        idx = np.arange(-pad, F + pad + 1)
        src_t = idx / m.fps
        root = m.root[idx % F] + np.floor(idx / F)[:, None] * travel
        Rs = m.R[idx % F]
        n = np.floor(t / period)
        tq = t - n * period
        extra = n[:, None] * travel
    else:
        src_t = m.times
        root, Rs = m.root, m.R
        tq = np.clip(t, src_t[0], src_t[-1])
        extra = 0.0
    out_root = CubicSpline(src_t, root, axis=0)(tq) + extra
    out_R = np.empty((len(t), NJ, 3, 3))
    for j in range(NJ):
        out_R[:, j] = RotationSpline(src_t, Rot.from_matrix(Rs[:, j]))(tq).as_matrix()
    return Motion(out_root, out_R, m.fps)


def resample(m, fps=FPS):
    if abs(fps - m.fps) < 1e-9:
        return m.copy()
    n = int(round(m.duration * fps)) + (0 if m.loop else 1)
    out = sample(m, np.arange(n) / fps)
    return Motion(out.root, out.R, fps, copy.deepcopy(m.events), m.loop, copy.deepcopy(m.meta))


def trim(m, t0=0.0, t1=None):
    """Keep [t0, t1] (seconds). Events inside are kept and shifted."""
    t1 = m.duration if t1 is None else min(t1, m.duration)
    n = int(round((t1 - t0) * m.fps)) + 1
    out = sample(m, t0 + np.arange(n) / m.fps, wrap=False)
    ev = [{"t": e["t"] - t0, "name": e["name"]} for e in m.events if t0 - 1e-6 <= e["t"] <= t1 + 1e-6]
    return Motion(out.root, out.R, m.fps, ev, False, copy.deepcopy(m.meta))


def time_warp(m, anchors, fps=None):
    """Retime with anchor pairs (source_time, output_time): monotone smooth (PCHIP) map, so an
    accent in the source can be pinned to a beat. Output starts at the first anchor's output_time
    (taken as t=0 of the result) and ends at the last. Events are carried through the map."""
    fps = fps or m.fps
    a = sorted(anchors, key=lambda p: p[1])
    src = np.array([p[0] for p in a], dtype=np.float64)
    out = np.array([p[1] for p in a], dtype=np.float64)
    if np.any(np.diff(src) <= 0) or np.any(np.diff(out) <= 0):
        raise ValueError("time_warp anchors must be strictly increasing in both columns")
    out0 = out[0]
    f = PchipInterpolator(out - out0, src)
    n = int(round((out[-1] - out0) * fps)) + 1
    to = np.arange(n) / fps
    res = sample(m, f(to), wrap=False)
    dense = np.linspace(0, out[-1] - out0, 4001)
    ev = [{"t": float(np.interp(e["t"], f(dense), dense)), "name": e["name"]}
          for e in m.events if src[0] - 1e-6 <= e["t"] <= src[-1] + 1e-6]
    meta = copy.deepcopy(m.meta)
    return Motion(res.root, res.R, fps, ev, False, meta)


def speed_ramp(m, keys, fps=None):
    """Retime by playback rate. keys = [(source_time, rate), ...] (rate 1 = original, 0.5 = slow
    motion), linearly interpolated in source time, held outside the keys."""
    fps = fps or m.fps
    ks = sorted(keys)
    st = np.linspace(0, m.duration, max(2, int(m.duration * 240) + 1))
    rate = np.interp(st, [k[0] for k in ks], [k[1] for k in ks])
    ot = np.concatenate([[0.0], np.cumsum(np.diff(st) / np.maximum(0.5 * (rate[1:] + rate[:-1]), 1e-3))])
    step = max(1, len(st) // 400)
    idx = np.unique(np.concatenate([np.arange(0, len(st), step), [len(st) - 1]]))
    return time_warp(m, list(zip(st[idx], ot[idx])), fps)


def hold(m, seconds, at_end=True):
    """Extend with a held last (or first) pose. Use only under an additive idle; never ship a frozen frame."""
    n = int(round(seconds * m.fps))
    out = m.copy()
    if at_end:
        out.root = np.concatenate([m.root, np.repeat(m.root[-1:], n, 0)])
        out.R = np.concatenate([m.R, np.repeat(m.R[-1:], n, 0)])
    else:
        out.root = np.concatenate([np.repeat(m.root[:1], n, 0), m.root])
        out.R = np.concatenate([np.repeat(m.R[:1], n, 0), m.R])
        out.events = [{"t": e["t"] + n / m.fps, "name": e["name"]} for e in m.events]
    return out


# ----------------------------------------------------------------------------- rigid placement
def transform(m, yaw=0.0, offset=(0.0, 0.0, 0.0), pivot=(0.0, 0.0, 0.0)):
    """Rotate the whole motion about the vertical through pivot, then translate."""
    Q = rot_y(yaw)
    pivot = np.asarray(pivot, dtype=np.float64)
    out = m.copy()
    out.root = (m.root - pivot) @ Q.T + pivot + np.asarray(offset, dtype=np.float64)
    out.R = Q @ m.R
    if "travel" in out.meta:
        out.meta["travel"] = list(Q @ np.asarray(out.meta["travel"], dtype=np.float64))
    return out


def heading(m, frame=0, window=3):
    """Robust facing yaw around a frame: mean of hips and chest front over a few frames."""
    a = max(0, frame - window) if frame >= 0 else m.frames + frame - window
    b = (frame + window + 1) if frame >= 0 else m.frames + frame + 1
    f = m.R[a:b, J["hips"], :, 2] + m.R[a:b, J["chest"], :, 2]
    f = f.sum(0)
    return math.atan2(f[0], f[2])


def place(m, frame=0, yaw=0.0, at=(0.0, 0.0)):
    """Rigidly move the motion so that at `frame` she stands at ground point `at` facing `yaw`."""
    h = heading(m, frame)
    p = m.root[frame]
    out = transform(m, yaw - h, pivot=(p[0], 0, p[2]))
    out.root[:, 0] += at[0] - p[0]
    out.root[:, 2] += at[1] - p[2]
    return out


def mirror(m):
    """Left-right mirror (across the YZ plane)."""
    S = np.diag([-1.0, 1.0, 1.0])
    out = m.copy()
    out.root = m.root * [-1.0, 1.0, 1.0]
    R = S @ m.R @ S
    for a, b in LR_PAIRS:
        R[:, [a, b]] = R[:, [b, a]]
    out.R = R

    def sw(n):
        return n[:-1] + ("R" if n.endswith("L") else "L") if n[-1:] in "LR" and len(n) > 1 else n
    out.events = [{"t": e["t"], "name": sw(e["name"])} for e in m.events]
    if "travel" in out.meta:
        out.meta["travel"] = list(np.asarray(out.meta["travel"]) * [-1.0, 1.0, 1.0])
    return out


# ----------------------------------------------------------------------------- feet and ground
def _heel_local(back=0.05):
    """Heel sole point (on the ground, `back` m behind the ankle when the foot is flat) in foot-local axes."""
    y = np.array([0.0, -math.sin(FOOT_PITCH), math.cos(FOOT_PITCH)])
    z = np.array([0.0, math.cos(FOOT_PITCH), math.sin(FOOT_PITCH)])
    w = np.array([0.0, -ANKLE_H, -back])
    return np.array([0.0, float(w @ y), float(w @ z)])


HEEL_LOCAL = _heel_local()
BALL_LOCAL = np.array([0.0, 0.0, -BALL_H])
TIP_LOCAL = np.array([0.0, LEN["toe"], -BALL_H])


def sole_points(m, P=None):
    """World positions of heel / ball / toe-tip sole points, per side: dict side -> (F,3,3)."""
    P = m.fk() if P is None else P
    out = {}
    for s in "LR":
        f, t = J["foot" + s], J["toe" + s]
        heel = P[:, f] + m.R[:, f] @ HEEL_LOCAL
        ball = P[:, t] + m.R[:, t] @ np.array([0.0, 0.0, -BALL_H])
        tip = P[:, t] + m.R[:, t] @ np.array([0.0, LEN["toe"], -BALL_H])
        out[s] = np.stack([heel, ball, tip], axis=1)
    return out


def sole_height(m, P=None):
    """(F,2) lowest sole point per foot (L, R)."""
    sp = sole_points(m, P)
    return np.stack([sp["L"][..., 1].min(1), sp["R"][..., 1].min(1)], axis=1)


def point_contacts(m, h=0.05, v=0.45, min_frames=4, P=None):
    """dict side -> (F,2) bool: heel and ball of that foot resting on the ground (low and still)."""
    sp = sole_points(m, P)
    out = {}
    for s in "LR":
        c = np.zeros((m.frames, 2), dtype=bool)
        for k in range(2):
            p = sp[s][:, k]
            vel = np.linalg.norm(np.gradient(p, 1.0 / m.fps, axis=0), axis=1) if m.frames > 1 else np.zeros(m.frames)
            c[:, k] = _open(_close((p[:, 1] < h) & (vel < v), 2), min_frames)
        out[s] = c
    return out


def contacts(m, h=0.05, v=0.45, min_frames=4):
    """(F,2) bool foot contact (L,R): heel or ball resting on the ground."""
    pc = point_contacts(m, h, v, min_frames)
    return np.stack([_close(pc["L"].any(1), 2), _close(pc["R"].any(1), 2)], axis=1)


def _runs(mask):
    d = np.diff(np.concatenate([[0], mask.astype(int), [0]]))
    return list(zip(np.where(d == 1)[0], np.where(d == -1)[0]))   # [start, end)


def _open(mask, n):
    out = np.zeros_like(mask)
    for a, b in _runs(mask):
        if b - a >= n:
            out[a:b] = True
    return out


def _close(mask, n):
    out = mask.copy()
    for a, b in _runs(~mask):
        if b - a <= n and a > 0 and b < len(mask):
            out[a:b] = True
    return out


def two_bone(H, K, T, a, b, pole=None):
    """Mid-joint position for a two-bone chain from H reaching T (lengths a, b), bending toward the
    current mid joint K (or an explicit pole direction). Returns (K_new, T_reachable)."""
    d = T - H
    dist = np.linalg.norm(d, axis=-1, keepdims=True)
    dc = np.clip(dist, abs(a - b) + 1e-4, a + b - 1e-4)
    n = d / np.maximum(dist, 1e-9)
    Te = H + n * dc
    x = (a * a - b * b + dc * dc) / (2 * dc)
    h = np.sqrt(np.maximum(a * a - x * x, 0.0))
    pv = (K - H) if pole is None else np.broadcast_to(np.asarray(pole, dtype=np.float64), H.shape)
    pv = pv - np.sum(pv * n, -1, keepdims=True) * n
    bad = np.linalg.norm(pv, axis=-1) < 1e-6
    if np.any(bad):
        alt = np.cross(n, [1.0, 0.0, 0.0])
        pv = np.where(bad[..., None], alt, pv)
    return H + n * x + unit(pv) * h, Te


def _limb_ik(m, top, mid, end, target, weight=None, pole=None, keep_end=True, bend_axis=None):
    """Re-pose the two bones top->mid->end so that joint `end` sits at target (F,3). weight (F,)
    blends from the current end position. The end joint (and its children) keep their world
    orientation when keep_end. bend_axis = +1/-1: the mid joint leans toward +Z/-Z of the top bone's
    frame (knees forward, elbows back); it takes over from the current mid-joint position when the
    limb is nearly straight, where that position says nothing reliable (prevents knee flips)."""
    P = m.fk()
    H, K, E = P[:, top], P[:, mid], P[:, end]
    T = np.asarray(target, dtype=np.float64)
    if weight is not None:
        T = E + (T - E) * np.asarray(weight, dtype=np.float64)[:, None]
    a, b = bone_len(JOINTS[top]), bone_len(JOINTS[mid])
    if pole is None and bend_axis is not None:
        n = unit(E - H)
        pv = (K - H) - np.sum((K - H) * n, -1, keepdims=True) * n          # where the mid joint is now
        ax = bend_axis * m.R[:, top, :, 2]
        ax = unit(ax - np.sum(ax * n, -1, keepdims=True) * n)
        need = smoothstep(np.linalg.norm(T - E, axis=-1) / 0.004)[:, None]  # no correction -> no change
        pole = pv + 0.03 * need * ax
    Kn, Te = two_bone(H, K, T, a, b, pole)
    out = m.copy()
    Q1 = rot_between(K - H, Kn - H)
    Q2 = rot_between(E - K, Te - Kn)
    out.R[:, top] = Q1 @ m.R[:, top]
    out.R[:, mid] = Q2 @ m.R[:, mid]
    if not keep_end:
        for j in descendants(end):
            out.R[:, j] = Q2 @ m.R[:, j]
    return out


def leg_ik(m, side, target, weight=None):
    """Move an ankle to target (F,3) with the hip fixed; foot keeps its world orientation."""
    return _limb_ik(m, J["thigh" + side], J["shin" + side], J["foot" + side], target, weight, bend_axis=+1.0)


def arm_ik(m, side, target, weight=None, pole=None, hand_R=None):
    """Overlay: move a wrist to target (F,3 world) with blend weight (F,) in [0,1]. pole = world
    direction the elbow should lean to (default: where it already is). hand_R (F,3,3) optionally
    sets the hand's world orientation, blended by the same weight."""
    out = _limb_ik(m, J["upArm" + side], J["foreArm" + side], J["hand" + side], target, weight, pole,
                   keep_end=(hand_R is not None), bend_axis=-1.0)
    if hand_R is not None:
        h = J["hand" + side]
        w = np.ones(m.frames) if weight is None else np.asarray(weight, dtype=np.float64)
        d = rotvec(hand_R @ T_(m.R[:, h]))
        out.R[:, h] = expmap(d * w[:, None]) @ m.R[:, h]
    return out


def floor_level(m):
    """Ground height implied by the clip: where the ankles rest (3rd percentile) minus the ankle height."""
    P = m.fk()
    a = np.minimum(P[:, J["footL"], 1], P[:, J["footR"], 1])
    return float(np.percentile(a, 3.0)) - ANKLE_H


def level_floor(m, min_span=2.5, min_drop=0.015):
    """Some captures have a tilted floor calibration (a walk that climbs 8 cm in 8 m). Fit a line to
    the height of planted ankles along the main travel direction and shear it out. No-op when the
    clip does not travel far enough to tell, or when the tilt is negligible."""
    P = m.fk()
    if m.frames < 30:
        return m.copy()
    xs, ys = [], []
    xz = P[:, 0][:, [0, 2]]
    c = xz.mean(0)
    u, sv, vt = np.linalg.svd(xz - c, full_matrices=False)
    axis = vt[0]
    for s in "LR":
        a = P[:, J["foot" + s]]
        vel = np.linalg.norm(np.gradient(a[:, [0, 2]], 1.0 / m.fps, axis=0), axis=1)
        sel = vel < 0.25
        xs.append((a[sel][:, [0, 2]] - c) @ axis)
        ys.append(a[sel, 1])
    x, y = np.concatenate(xs), np.concatenate(ys)
    if len(x) < 20 or x.max() - x.min() < min_span:
        return m.copy()
    w = np.ones_like(x)
    for _ in range(8):                      # robust: planted-but-raised heels sit above the line
        A = np.stack([x, np.ones_like(x)], 1) * w[:, None]
        k, b = np.linalg.lstsq(A, y * w, rcond=None)[0]
        r = y - (k * x + b)
        w = np.where(r > 0.012, 0.05, np.where(r < -0.03, 0.2, 1.0))
    if abs(k) * (x.max() - x.min()) < min_drop:
        return m.copy()
    out = m.copy()
    out.root[:, 1] -= k * ((xz - c) @ axis)
    out.meta["floor_tilt_m_per_m"] = round(float(k), 4)
    return out


def _rot_x(a):
    a = np.asarray(a, dtype=np.float64)
    c, s = np.cos(a), np.sin(a)
    R = np.zeros(a.shape + (3, 3))
    R[..., 0, 0] = 1
    R[..., 1, 1] = c; R[..., 1, 2] = -s
    R[..., 2, 1] = s; R[..., 2, 2] = c
    return R


def _least_turn(height_fn, cand):
    """Per frame: the candidate angle of smallest magnitude for which height_fn(angle) >= 0, else the
    one with the greatest height. height_fn(cand (K,)) -> (F,K)."""
    hgt = height_fn(cand)
    okm = hgt >= -5e-4
    cost = np.where(okm, np.abs(cand)[None, :], 1e3 - hgt)
    k = np.argmin(cost, axis=1)
    return cand[k]


def plant_feet(m, max_deg=45.0):
    """Let the ground push the feet: where a heel or a ball would be under the floor, pitch the foot
    about the ankle by the least angle that frees it (so a mocap ankle that reads a few degrees off
    ends up flat when planted, while heel strikes and toe-offs are left alone); then bend the toes up
    where their tips still dig in."""
    out = m.copy()
    if m.frames > 5:
        k = np.array([0.25, 0.5, 0.25])
    cand = np.radians(np.arange(-max_deg, max_deg + 0.01, 0.5))
    Rx = _rot_x(cand)                                           # (K,3,3)
    for s in "LR":
        f, t = J["foot" + s], J["toe" + s]
        P = out.fk()
        Rf, Rt = out.R[:, f], out.R[:, t]
        rel = T_(Rf) @ Rt                                       # toe relative to foot
        ball_l = np.array([0.0, LEN["foot"], 0.0])[None] + np.einsum("fab,b->fa", rel, BALL_LOCAL)

        def hf(c, Rf=Rf, P=P, f=f, ball_l=ball_l):
            # world y of heel and ball for each candidate pitch (rotation about the foot's own X)
            yrow = Rf[:, 1, :]                                  # (F,3) world-y row of R
            hl = np.einsum("kab,b->ka", Rx, HEEL_LOCAL)         # (K,3)
            bl = np.einsum("kab,fb->fka", Rx, ball_l)           # (F,K,3)
            hy = P[:, f, 1, None] + yrow @ hl.T
            by = P[:, f, 1, None] + np.einsum("fa,fka->fk", yrow, bl)
            return np.minimum(hy, by)
        th = _least_turn(hf, cand)
        if m.frames > 5:
            th = np.convolve(np.pad(th, 1, mode="edge"), k, mode="valid")
        Q = Rf @ _rot_x(th) @ T_(Rf)
        out.R[:, f] = Q @ Rf
        out.R[:, t] = Q @ Rt
        # toes
        P = out.fk()
        Rt = out.R[:, t]
        candt = np.radians(np.arange(-20.0, 75.01, 0.5))
        Rxt = _rot_x(candt)

        def ht(c, Rt=Rt, P=P, t=t):
            tl = np.einsum("kab,b->ka", Rxt, TIP_LOCAL)
            return P[:, t, 1, None] + Rt[:, 1, :] @ tl.T
        ph = _least_turn(ht, candt)
        if m.frames > 5:
            ph = np.convolve(np.pad(ph, 1, mode="edge"), k, mode="valid")
        out.R[:, t] = Rt @ _rot_x(ph)
    return out


def ground_clamp(m, floor=None, lift=True):
    """Put the clip on y=0: shift everything so the ankles rest at ankle height (floor=None: estimated,
    see floor_level), let the ground pitch the planted feet flat (plant_feet), then lift any ankle
    whose sole still dips below the ground with leg IK."""
    out = m.copy()
    if floor is None:
        floor = floor_level(out)
    out.root[:, 1] -= floor
    if not lift:
        return out
    out = plant_feet(out)
    for _ in range(2):
        P = out.fk()
        sh = sole_height(out, P)
        for k, s in enumerate("LR"):
            pen = np.maximum(-sh[:, k], 0.0)
            if pen.max() > 1e-4:
                tgt = P[:, J["foot" + s]] + np.stack([0 * pen, pen, 0 * pen], 1)
                out = leg_ik(out, s, tgt)
    # a hip too low for the leg to shorten further: raise the root
    sh = sole_height(out)
    worst = np.maximum(-sh.min(1), 0.0)
    if worst.max() > 2e-3:
        out.root[:, 1] += worst
    return out


def foot_lock(m, h=0.05, v=0.45, ramp=0.1):
    """Remove foot skate. While a heel or a ball rests on the ground, that sole point is pinned to
    its mean ground position (so heel-strike -> flat -> toe-off still rolls), the correction is
    eased in and out over `ramp` seconds, and the leg is re-solved by IK (foot orientation kept)."""
    out = m.copy()
    P = m.fk()
    sp = sole_points(m, P)
    pc = point_contacts(m, h, v, P=P)
    nr = max(1, int(round(ramp * m.fps)))
    F = m.frames
    for s in "LR":
        num = np.zeros((F, 3))
        den = np.zeros(F)
        for k in range(2):
            p = sp[s][:, k]
            for st, en in _runs(pc[s][:, k]):
                pin = p[st:en].mean(0)
                lo, hi = max(0, st - nr), min(F, en + nr)
                w = np.zeros(F)
                d = np.zeros((F, 3))
                w[st:en] = 1.0
                d[st:en] = pin - p[st:en]
                w[lo:st] = smoothstep((np.arange(lo, st) - (st - nr) + 1) / (nr + 1))
                d[lo:st] = pin - p[st]
                w[en:hi] = smoothstep(1.0 - (np.arange(en, hi) - en + 1) / (nr + 1))
                d[en:hi] = pin - p[en - 1]
                d[:, 1] = 0.0
                num += d * w[:, None]
                den += w
        if den.max() > 0:
            corr = num / np.maximum(den, 1.0)[:, None]
            out = leg_ik(out, s, P[:, J["foot" + s]] + corr)
    return out


def flatten_feet(m, max_deg=25.0):
    """Stance calibration: mocap ankles rarely read 'flat' exactly when the foot is flat. Find the
    frames where each foot clearly rests (ankle at its low level and still), measure how far its sole
    is from level there, and take that constant offset out of the foot (and toe) rotation."""
    out = m.copy()
    P = m.fk()
    up = np.array([0.0, 1.0, 0.0])
    for s in "LR":
        f, t = J["foot" + s], J["toe" + s]
        a = P[:, f]
        if m.frames < 8:
            continue
        vel = np.linalg.norm(np.gradient(a, 1.0 / m.fps, axis=0), axis=1)
        low = np.percentile(a[:, 1], 5.0)
        sel = (a[:, 1] < low + 0.015) & (vel < 0.25)
        if sel.sum() < 8:
            continue
        for j, u0 in ((f, np.array([0.0, -math.sin(FOOT_PITCH), math.cos(FOOT_PITCH)])), (t, np.array([0.0, 0.0, 1.0]))):
            ul = unit(np.einsum("fba,b->fa", m.R[sel, j], up).mean(0))
            ang = math.degrees(math.acos(float(np.clip(ul @ u0, -1, 1))))
            if ang > max_deg:
                continue
            Q = rot_between(u0, ul)
            out.R[:, j] = m.R[:, j] @ Q
            out.meta.setdefault("foot_cal_deg", {})[JOINTS[j]] = round(ang, 2)
    return out


# ----------------------------------------------------------------------------- joining
def _decay(x0, v0, t, halflife):
    """Critically damped decay of an offset x0 with initial velocity v0 (Holden's spring)."""
    y = 2.0 * math.log(2.0) / max(halflife, 1e-4)
    j1 = v0 + x0 * y
    return np.exp(-y * t)[:, None] * (x0[None] + j1[None] * t[:, None])


def concat(a, b, halflife=0.12, align=True, lock=True, at=None):
    """a then b. b is rigidly aligned (ground position + heading of the hips) to a's last frame
    (align=True), and the remaining pose/velocity mismatch is inertialised: it decays over a few
    half-lives inside b, so there is no overlap and no pop. lock=True re-pins the feet around the
    join. `at` = time in a to cut it (default: its end). b's first frame coincides with a's last."""
    if at is not None:
        a = trim(a, 0.0, at)
    if abs(a.fps - b.fps) > 1e-9:
        b = resample(b, a.fps)
    if align:
        b = place(b, 0, heading(a, -1), (a.root[-1, 0], a.root[-1, 2]))
    fps = a.fps
    La, Lb = to_local(a.R[-2:]) if a.frames > 1 else to_local(np.repeat(a.R[-1:], 2, 0)), to_local(b.R)
    t = b.times
    x0 = rotvec(La[-1] @ T_(Lb[0]))
    va = rotvec(La[-1] @ T_(La[-2])) * fps
    vb = rotvec(Lb[min(1, b.frames - 1)] @ T_(Lb[0])) * fps
    v0 = np.clip(va - vb, -12.0, 12.0)
    L = Lb.copy()
    for j in range(NJ):
        L[:, j] = expmap(_decay(x0[j], v0[j], t, halflife)) @ Lb[:, j]
    Rb = from_local(L)
    r0 = a.root[-1] - b.root[0]
    rva = (a.root[-1] - a.root[-2]) * fps if a.frames > 1 else np.zeros(3)
    rvb = (b.root[min(1, b.frames - 1)] - b.root[0]) * fps
    rootb = b.root + _decay(r0, rva - rvb, t, halflife)
    out = Motion(np.concatenate([a.root, rootb[1:]]), np.concatenate([a.R, Rb[1:]]), fps,
                 copy.deepcopy(a.events) + [{"t": e["t"] + a.duration, "name": e["name"]} for e in b.events],
                 False, copy.deepcopy(a.meta))
    out.events.sort(key=lambda e: e["t"])
    if lock:
        n0 = max(0, a.frames - int(0.5 * fps))
        n1 = min(out.frames, a.frames + int(8 * halflife * fps) + 2)
        seg = Motion(out.root[n0:n1], out.R[n0:n1], fps)
        seg = ground_clamp(foot_lock(seg), floor=0.0)
        w = np.ones(n1 - n0)
        k = min(8, (n1 - n0) // 3)
        if k > 0:
            w[:k] = smoothstep(np.arange(k) / k)
            w[-k:] = smoothstep(1 - (np.arange(k) + 1) / k)
        out = _blend_into(out, seg, n0, w)
    return out


def _blend_into(m, seg, n0, w):
    """Replace frames [n0, n0+len) of m by seg, weighted per frame."""
    out = m.copy()
    n1 = n0 + seg.frames
    out.root[n0:n1] = m.root[n0:n1] + (seg.root - m.root[n0:n1]) * w[:, None]
    d = rotvec(seg.R @ T_(m.R[n0:n1]))
    out.R[n0:n1] = expmap(d * w[:, None, None]) @ m.R[n0:n1]
    return out


def sequence(parts, halflife=0.12):
    out = parts[0]
    for p in parts[1:]:
        out = concat(out, p, halflife)
    return out


# ----------------------------------------------------------------------------- overlays
def rotate_subtree(m, joint, Q):
    """Premultiply joint and its descendants by world rotations Q (F,3,3)."""
    out = m.copy()
    j = J[joint] if isinstance(joint, str) else joint
    for k in descendants(j):
        out.R[:, k] = Q @ m.R[:, k]
    return out


def twist_pelvis(m, yaw, keep_feet=True):
    """Overlay: turn the whole body about the vertical through the hips by yaw (F,) radians while the
    feet stay where they are (legs re-solved, feet keep their orientation) - the lower half of a
    look-over-the-shoulder, or a wind-up."""
    yaw = np.broadcast_to(np.asarray(yaw, dtype=np.float64), (m.frames,))
    P = m.fk()
    out = m.copy()
    out.R = rot_y(yaw)[:, None] @ m.R
    if keep_feet:
        for s in "LR":
            for n in ("foot", "toe"):
                out.R[:, J[n + s]] = m.R[:, J[n + s]]
            out = leg_ik(out, s, P[:, J["foot" + s]])
    return out


def look_at(m, target, weight, share=(("chest", 0.22), ("neck", 0.28), ("head", 0.50)), max_deg=110.0):
    """Overlay: turn chest/neck/head so the face points at target ((3,) or (F,3) world) by weight
    (F,) in [0,1]. The turn is shared down the chain and clamped."""
    out = m.copy()
    tgt = np.broadcast_to(np.asarray(target, dtype=np.float64), (m.frames, 3))
    w = np.broadcast_to(np.asarray(weight, dtype=np.float64), (m.frames,))
    done = 0.0
    for name, frac in share:
        P = out.fk()
        h = J["head"]
        want = unit(tgt - P[:, h])
        have = out.R[:, h, :, 2]
        r = rotvec(rot_between(have, want))
        ang = np.linalg.norm(r, axis=1, keepdims=True)
        r = r * np.minimum(1.0, math.radians(max_deg) / np.maximum(ang, 1e-9))
        f = frac / max(1e-9, 1.0 - done)          # fraction of what is still left
        out = rotate_subtree(out, name, expmap(r * (w * min(1.0, f))[:, None]))
        done += frac
    return out


def additive(m, joint, rv):
    """Add a rotation (rotation vector in the joint's own local axes, (F,3) or (3,)) to a joint and
    everything below it."""
    j = J[joint] if isinstance(joint, str) else joint
    rv = np.broadcast_to(np.asarray(rv, dtype=np.float64), (m.frames, 3))
    Rj = m.R[:, j]
    Q = Rj @ expmap(rv) @ T_(Rj)
    return rotate_subtree(m, j, Q)


def shift_root(m, offset, keep_feet=True, con=None):
    """Move the hips by offset (F,3). keep_feet: feet in contact stay where they were (leg IK)."""
    out = m.copy()
    P = m.fk()
    out.root = m.root + offset
    if keep_feet:
        con = contacts(m) if con is None else con
        for k, s in enumerate("LR"):
            w = _feather(con[:, k].astype(float), int(0.1 * m.fps))
            tgt = P[:, J["foot" + s]] + offset * (1.0 - w[:, None])
            out = leg_ik(out, s, tgt)
    return out


def _feather(w, n):
    if n < 1:
        return w
    k = np.hanning(2 * n + 1)
    k /= k.sum()
    return np.clip(np.convolve(np.pad(w, n, mode="edge"), k, mode="valid"), 0, 1)


def breathe(m, period=3.6, depth=1.0, phase=0.0, sway=0.012, sway_period=7.3, seed=1):
    """Additive life: breathing (chest pitch, shoulders rise) and a slow weight sway of the hips
    with the planted feet kept still. Periods can be chosen to divide a loop's length."""
    t = m.times
    b = 0.5 - 0.5 * np.cos(2 * np.pi * (t / period + phase))       # 0..1 inhale
    out = additive(m, "chest", np.stack([-math.radians(1.6) * depth * b, 0 * b, 0 * b], 1))
    out = additive(out, "spine", np.stack([-math.radians(0.7) * depth * b, 0 * b, 0 * b], 1))
    out = additive(out, "head", np.stack([math.radians(1.2) * depth * b, 0 * b, 0 * b], 1))
    for s, sg in (("L", 1.0), ("R", -1.0)):
        out = additive(out, "clav" + s, np.stack([0 * b, 0 * b, sg * math.radians(2.2) * depth * b], 1))
    if sway > 0:
        rng = np.random.default_rng(seed)
        ph = rng.uniform(0, 2 * np.pi, 4)
        sx = sway * (np.sin(2 * np.pi * t / sway_period + ph[0]) + 0.4 * np.sin(4 * np.pi * t / sway_period + ph[1]))
        sz = 0.5 * sway * (np.sin(2 * np.pi * t / sway_period * 2 + ph[2]) + 0.5 * np.sin(2 * np.pi * t / sway_period + ph[3]))
        off = np.stack([sx, -0.15 * np.abs(sx), sz], 1)
        # express the sway in her own heading frame
        off = np.einsum("fab,fb->fa", rot_y(yaw_of(out.R[:, 0])), off)
        out = shift_root(out, off, keep_feet=True)
    return out


def smooth(m, cutoff_hz=12.0):
    """Zero-phase low-pass on the root path and on every joint's quaternion (jitter removal)."""
    if m.frames < 16:
        return m.copy()
    b, a = butter(2, min(0.99, cutoff_hz / (0.5 * m.fps)))
    out = m.copy()
    out.root = filtfilt(b, a, m.root, axis=0)
    for j in range(NJ):
        q = filtfilt(b, a, quat_continuous(m.R[:, j]), axis=0)
        out.R[:, j] = Rot.from_quat(unit(q)).as_matrix()
    return out


# ----------------------------------------------------------------------------- cycles / paths
def _pose_features(m):
    """Root-relative, heading-free pose + velocity features, (F, D)."""
    P = m.fk()
    Q = rot_y(-yaw_of(m.R[:, 0]))
    rel = np.einsum("fab,fjb->fja", Q, P - P[:, :1])
    rel[:, 0, 1] = P[:, 0, 1]          # keep hips height
    vel = np.gradient(rel, 1.0 / m.fps, axis=0) * 0.08
    return np.concatenate([rel.reshape(m.frames, -1), vel.reshape(m.frames, -1)], axis=1)


def find_cycle(m, min_period=0.5, max_period=1.6, t_from=0.0, t_to=None):
    """Best (t0, t1) such that the pose and its velocity at t1 repeat those at t0 (one full gait
    cycle = two steps). Returns (t0, t1, cost)."""
    f = _pose_features(m)
    a, b = int(t_from * m.fps), m.frames if t_to is None else int(t_to * m.fps)
    lo, hi = int(min_period * m.fps), int(max_period * m.fps)
    best = (None, None, 1e18)
    for i in range(a, b - lo):
        j = np.arange(i + lo, min(b, i + hi + 1))
        if len(j) == 0:
            continue
        d = np.linalg.norm(f[j] - f[i], axis=1)
        k = int(np.argmin(d))
        if d[k] < best[2]:
            best = (i / m.fps, j[k] / m.fps, float(d[k]))
    return best


def make_cycle(m, t0, t1, blend=0.2, in_place=True, frames=None, align_travel=True):
    """A seamless loop from [t0, t1) of a locomotion clip. The pose mismatch at the wrap is spread
    over `blend` seconds at both ends. The cycle is turned to travel along +Z; in_place=True removes
    the mean forward travel (kept in meta['stride'] metres per cycle), else meta['travel'] carries it.
    frames = resample the cycle to exactly this many frames (changes its period).
    align_travel=False keeps the clip's own orientation (use for standing loops: idle, sway)."""
    seg = trim(m, t0, t1)                      # includes the frame at t1 (== wrap twin of t0)
    F = seg.frames - 1
    fps = seg.fps
    trav = seg.root[-1] - seg.root[0]
    yaw_trav = math.atan2(trav[0], trav[2]) if align_travel else 0.0
    seg = transform(seg, -yaw_trav, pivot=(seg.root[0, 0], 0, seg.root[0, 2]))
    seg.root[:, 0] -= seg.root[0, 0]
    seg.root[:, 2] -= seg.root[0, 2]
    trav = seg.root[-1] - seg.root[0]
    stride = float(math.hypot(trav[0], trav[2]))
    # remove mean travel -> in-place root, then close the loop
    u = np.arange(F + 1) / F
    root = seg.root - u[:, None] * np.array([trav[0], 0.0, trav[2]])
    L = to_local(seg.R)
    dR = rotvec(L[0] @ T_(L[-1]))               # takes the end pose to the start pose
    dP = root[0] - root[-1]
    nb = max(1, min(int(blend * fps), F // 2))
    w = np.zeros(F + 1)
    w[-nb - 1:] = 0.5 * smoothstep(np.arange(nb + 1) / nb)            # end: 0 -> +0.5 d
    w[:nb + 1] -= 0.5 * smoothstep(1 - np.arange(nb + 1) / nb)        # start: -0.5 d -> 0
    for j in range(NJ):
        L[:, j] = expmap(dR[j][None] * w[:, None]) @ L[:, j]
    root = root + dP[None] * w[:, None]
    R = from_local(L)
    out = Motion(root[:F], R[:F], fps, [e for e in seg.events if e["t"] < F / fps - 1e-6], True, copy.deepcopy(m.meta))
    out.meta["stride"] = stride
    out.meta["period"] = F / fps
    out.meta["speed"] = stride / (F / fps)
    if not in_place:
        out.root = out.root + (np.arange(F) / F)[:, None] * np.array([0.0, 0.0, stride])
        out.meta["travel"] = [0.0, 0.0, stride]
    if frames is not None and frames != F:
        s = sample(out, np.arange(frames) / frames * (F / fps), wrap=True)
        k = (F / fps) / (frames / fps)
        out = Motion(s.root, s.R, fps, [{"t": e["t"] / k, "name": e["name"]} for e in out.events], True, out.meta)
        out.meta["period"] = frames / fps
        out.meta["speed"] = stride / (frames / fps)
    return out


def roll(cycle, t):
    """Cyclic shift of a loop so that time t becomes its t=0 (e.g. start the gait on a left footfall)."""
    k = int(round(t * cycle.fps)) % cycle.frames
    out = cycle.copy()
    period = cycle.frames / cycle.fps
    trav = np.asarray(cycle.meta.get("travel", (0, 0, 0)), dtype=np.float64)
    out.root = np.concatenate([cycle.root[k:], cycle.root[:k] + trav])
    out.root[:, [0, 2]] -= out.root[0, [0, 2]] * (1.0 if np.any(trav) else 0.0)
    out.R = np.concatenate([cycle.R[k:], cycle.R[:k]])
    out.events = sorted([{"t": (e["t"] - k / cycle.fps) % period, "name": e["name"]} for e in cycle.events],
                        key=lambda e: e["t"])
    return out


def relock_loop(cycle):
    """Foot-lock and ground a standing loop without breaking its seam (works on three tiled copies)."""
    F = cycle.frames
    big = tile(cycle, 3)
    big.loop = False
    big = ground_clamp(foot_lock(big), floor=0.0)
    out = cycle.copy()
    out.root, out.R = big.root[F:2 * F].copy(), big.R[F:2 * F].copy()
    return out


def drive(cycle, duration, speed=None, path=None, fps=None, phase0=0.0):
    """Run an in-place cycle along the ground. speed: m/s, scalar or (N,) array over the output
    frames (default: the cycle's natural speed). path: None = straight along +Z from the origin, or
    an (M,2) polyline of ground points (x,z) followed at constant arc speed, heading = tangent.
    Playback rate is stride-matched (phase advances by distance / stride), so feet do not skate."""
    fps = fps or cycle.fps
    n = int(round(duration * fps)) + 1
    t = np.arange(n) / fps
    stride, period = cycle.meta["stride"], cycle.meta["period"]
    v = np.broadcast_to(np.asarray(cycle.meta["speed"] if speed is None else speed, dtype=np.float64), (n,))
    s = np.concatenate([[0.0], np.cumsum(0.5 * (v[1:] + v[:-1]) / fps)])
    ph = phase0 + s / stride
    pose = sample(cycle, ph * period, wrap=True)
    if path is None:
        xz = np.stack([np.zeros(n), s], 1)
        yaw = np.zeros(n)
    else:
        path = np.asarray(path, dtype=np.float64)
        seg = np.linalg.norm(np.diff(path, axis=0), axis=1)
        al = np.concatenate([[0.0], np.cumsum(seg)])
        cs = CubicSpline(al, path, axis=0)
        sc = np.clip(s, 0, al[-1])
        xz = cs(sc)
        d = cs(sc, 1)
        yaw = np.unwrap(np.arctan2(d[:, 0], d[:, 1]))
    Q = rot_y(yaw)
    local = pose.root.copy()
    root = np.einsum("fab,fb->fa", Q, local)
    root[:, 0] += xz[:, 0]
    root[:, 2] += xz[:, 1]
    R = Q[:, None] @ pose.R
    ev = []
    k0, k1 = int(math.floor(ph[0])), int(math.ceil(ph[-1]))
    for e in cycle.events:
        for k in range(k0 - 1, k1 + 1):
            p = k + e["t"] / period
            if ph[0] <= p <= ph[-1]:
                ev.append({"t": float(np.interp(p, ph, t)), "name": e["name"]})
    ev.sort(key=lambda e: e["t"])
    return Motion(root, R, fps, ev, False, copy.deepcopy(cycle.meta))


def tile(cycle, n):
    """Repeat a loop n times (stays a loop)."""
    out = cycle.copy()
    period = cycle.frames / cycle.fps
    trav = np.asarray(cycle.meta.get("travel", (0, 0, 0)), dtype=np.float64)
    out.root = np.concatenate([cycle.root + k * trav for k in range(n)])
    out.R = np.concatenate([cycle.R] * n)
    out.events = [{"t": e["t"] + k * period, "name": e["name"]} for k in range(n) for e in cycle.events]
    if "travel" in out.meta:
        out.meta["travel"] = list(trav * n)
    return out


# ----------------------------------------------------------------------------- events
def detect_events(m, footfalls=True, jumps=True, kicks=True, strikes=False):
    """Named markers: footL/footR (contact starts), takeoff / jump_apex / land (both feet off the
    ground), kickL/kickR (a foot's highest point above hip-ish height while upright), strikeL/strikeR
    (hand speed peaks relative to the chest)."""
    P = m.fk()
    fps = m.fps
    ev = []
    con = contacts(m)
    sh = sole_height(m, P)
    if footfalls:
        for k, s in enumerate("LR"):
            for st, _ in _runs(con[:, k]):
                if st > 0:
                    ev.append({"t": st / fps, "name": "foot" + s})
    air = _open((sh.min(1) > 0.05) & ~con.any(1), max(4, int(0.1 * fps)))
    if jumps:
        for st, en in _runs(air):
            if st == 0 or en >= m.frames:
                continue
            ap = st + int(np.argmax(P[st:en, 0, 1]))
            if (en - st) / fps < 0.2 and P[ap, 0, 1] < HIPS_H + 0.12:
                continue                      # a running stride's flight phase, not a jump
            ev += [{"t": st / fps, "name": "takeoff"}, {"t": ap / fps, "name": "jump_apex"},
                   {"t": en / fps, "name": "land"}]
    upright = m.R[:, J["hips"], 1, 1] > 0.3
    if kicks:
        for s in "LR":
            hgt = P[:, J["foot" + s], 1]
            ext = np.linalg.norm(P[:, J["foot" + s]] - P[:, J["thigh" + s]], axis=1)
            pk, _ = find_peaks(hgt, height=0.62, prominence=0.25, distance=int(0.3 * fps))
            for p in pk:
                if upright[p] and ext[p] > 0.72 * (LEN["thigh"] + LEN["shin"]):
                    ev.append({"t": p / fps, "name": "kick" + s})
    if strikes:
        for s in "LR":
            rel = P[:, J["hand" + s]] - P[:, J["chest"]]
            sp = np.linalg.norm(np.gradient(rel, 1 / fps, axis=0), axis=1)
            pk, _ = find_peaks(sp, height=4.5, prominence=2.0, distance=int(0.25 * fps))
            ev += [{"t": p / fps, "name": "strike" + s} for p in pk]
    ev.sort(key=lambda e: e["t"])
    return ev


def with_events(m, **kw):
    out = m.copy()
    keep = [e for e in m.events if not any(e["name"].startswith(p) for p in
                                           ("foot", "takeoff", "jump_apex", "land", "kick", "strike"))]
    out.events = sorted(keep + detect_events(m, **kw), key=lambda e: e["t"])
    return out


# ----------------------------------------------------------------------------- retarget
# canonical joint -> (source joint giving the rotation, source joint giving the bone direction in the
# reference pose). None for the direction = use the canonical axis for that joint (see _ref_frames).
_ARM = {"clav": ("{S}Shoulder", None), "upArm": ("{S}Arm", "{S}ForeArm"),
        "foreArm": ("{S}ForeArm", "{S}Hand"), "thigh": ("{S}UpLeg", "{S}Leg"),
        "shin": ("{S}Leg", "{S}Foot"), "foot": ("{S}Foot", "{S}ToeBase"), "toe": ("{S}ToeBase", None)}
SOURCES = {
    "cmu": {
        "scale": bvh.CMU_SCALE, "drop_tpose": True, "ref": "tpose",
        "spine": {"hips": "Hips", "spine": "Spine", "chest": "Spine1", "neck": "Neck1", "head": "Head"},
        "hand_child": "{S}HandIndex1",
    },
    "accad_f1": {
        "scale": 0.01, "drop_tpose": False, "ref": "tpose",
        "spine": {"hips": "Hips", "spine": "Spine", "chest": "Spine1", "neck": "Neck", "head": "Head"},
        "hand_child": "{S}Hand_end",
    },
    "accad_m2": {
        "scale": 0.01, "drop_tpose": False, "ref": ("accad_Male2_bvh/Male2_A1_Stand.bvh", 0),
        "spine": {"hips": "Hips", "spine": "Spine", "chest": "Spine1", "neck": "Neck", "head": "Head"},
        "hand_child": "{S}Hand_end",
    },
    "accad_m1": {
        "scale": 0.01, "drop_tpose": False, "ref": "tpose",
        "spine": {"hips": "Hips", "spine": "Spine", "chest": "Spine1", "neck": "Neck", "head": "Head"},
        "hand_child": "{S}Hand_end",
    },
}
_SIDE = {"L": "Left", "R": "Right"}


def source_map(kind):
    """canonical joint name -> (rotation source joint, direction child joint or None)."""
    cfg = SOURCES[kind]
    mp = {k: (v, None) for k, v in cfg["spine"].items()}
    for s in "LR":
        for k, (a, b) in _ARM.items():
            mp[k + s] = (a.format(S=_SIDE[s]), b.format(S=_SIDE[s]) if b else None)
        mp["hand" + s] = (f"{_SIDE[s]}Hand", cfg["hand_child"].format(S=_SIDE[s]))
    return mp


def _ref_frames(names, Pref, front, mp):
    """Canonical world frames (21,3,3) for the source's reference pose (positions Pref)."""
    idx = {n: i for i, n in enumerate(names)}
    up = np.array([0.0, 1.0, 0.0])
    f = unit(np.asarray(front, dtype=np.float64) * [1, 0, 1])
    left = np.cross(up, f)
    body = np.stack([left, up, f], axis=1)
    out = np.empty((NJ, 3, 3))
    for n in JOINTS:
        src, child = mp[n]
        base, side = (n[:-1], n[-1]) if n[-1] in "LR" else (n, "")
        sg = 1.0 if side == "L" else -1.0
        if side == "":
            out[J[n]] = body
        elif base == "clav":
            out[J[n]] = frame_from_yz(sg * math.cos(CLAV_SLOPE) * left + math.sin(CLAV_SLOPE) * up, f)
        elif base in ("foot", "toe"):
            a, b = (src, child) if base == "foot" else (mp["foot" + side][0], src)
            h = unit((Pref[idx[b]] - Pref[idx[a]]) * [1, 0, 1])
            y = math.cos(FOOT_PITCH) * h - math.sin(FOOT_PITCH) * up if base == "foot" else h
            out[J[n]] = frame_from_yz(y, up)
        else:
            out[J[n]] = frame_from_yz(Pref[idx[child]] - Pref[idx[src]], f)
    return out


_CAL_CACHE = {}


def _calibration(kind, clip):
    """Per canonical joint: C with R_canon(t) = G_src(t) @ C, and the source leg length (m)."""
    key = (kind, tuple(np.round(clip.offsets[1:].ravel(), 3)))
    if key in _CAL_CACHE:
        return _CAL_CACHE[key]
    cfg = SOURCES[kind]
    mp = source_map(kind)
    names = clip.names
    idx = {n: i for i, n in enumerate(names)}
    if cfg["ref"] == "tpose":
        Pref = np.zeros((len(names), 3))
        for j in range(len(names)):
            p = clip.parents[j]
            Pref[j] = (Pref[p] if p >= 0 else 0.0) + clip.offsets[j]
        Gref = np.tile(np.eye(3), (len(names), 1, 1))
        front = [0.0, 0.0, 1.0]
    else:
        path, fr = cfg["ref"]
        rc = bvh.load(str(MOCAP / path), scale=cfg["scale"], drop_tpose=False)
        if not np.allclose(rc.offsets[1:], clip.offsets[1:], atol=2e-3):
            print(f"  note: {Path(clip.path).name}: skeleton differs from the {kind} reference clip", file=sys.stderr)
        P, G = rc.fk(frames=[fr])
        Pref, Gref = P[0], G[0]
        ridx = {n: i for i, n in enumerate(rc.names)}
        lat = Pref[ridx["LeftUpLeg"]] - Pref[ridx["RightUpLeg"]] + Pref[ridx["LeftArm"]] - Pref[ridx["RightArm"]]
        front = np.cross(unit(lat * [1, 0, 1]), [0.0, 1.0, 0.0])
        idx = ridx
    Rref = _ref_frames(list(idx.keys()), Pref, front, mp)
    C = np.stack([Gref[idx[mp[n][0]]].T @ Rref[J[n]] for n in JOINTS])
    leg = float(np.linalg.norm(clip.offsets[clip.index("LeftLeg")]) + np.linalg.norm(clip.offsets[clip.index("LeftFoot")])
                + np.linalg.norm(clip.offsets[clip.index("RightLeg")]) + np.linalg.norm(clip.offsets[clip.index("RightFoot")])) / 2
    _CAL_CACHE[key] = (C, leg)
    return C, leg


def retarget(clip, kind, fps=FPS, face=True, ground=True, lock=True, jitter_hz=None):
    """bvh.Clip -> Motion on the canonical skeleton at `fps`.
    Rotations are transferred joint by joint through a reference-pose calibration; positions are
    re-solved from the canonical bone lengths. The root path is scaled by the leg-length ratio.
    face: turn/translate so she starts at the origin facing +Z. ground: feet onto y=0 (+IK lift).
    lock: pin planted feet (removes the skate that the change of proportions introduces)."""
    C, leg = _calibration(kind, clip)
    mp = source_map(kind)
    P, G = clip.fk()
    s = (LEN["thigh"] + LEN["shin"]) / leg
    src = [clip.index(mp[n][0]) for n in JOINTS]
    R = np.einsum("fjab,jbc->fjac", G[:, src], C)
    root = P[:, clip.index(mp["hips"][0])] * s
    m = Motion(root, R, clip.fps, [], False, {"source": Path(clip.path).stem, "kind": kind, "scale": s})
    if abs(clip.fps - fps) > 1e-6:
        m = resample(m, fps)
    if jitter_hz:
        m = smooth(m, jitter_hz)
    if ground:
        m = ground_clamp(level_floor(m), lift=False)
    if lock:
        m = foot_lock(m)
    if ground:
        m = ground_clamp(m, floor=0.0)
    if face:
        m = place(m, 0, 0.0, (0.0, 0.0))
    return m


_CMU_FPS = None


def _cmu_fps(cid):
    global _CMU_FPS
    if _CMU_FPS is None:
        with open(MOCAP / "cmu_index.csv") as f:
            _CMU_FPS = {r["id"]: (float(r["fps"]), r["path"]) for r in csv.DictReader(f)}
    return _CMU_FPS[cid]


def find_bvh(spec):
    """'cmu:88_06' | 'accad:Male2_Form_1' | a path  ->  (path, kind, true fps or None)."""
    if spec.startswith("cmu:"):
        cid = spec[4:]
        fps, _ = _cmu_fps(cid)
        subj = cid.split("_")[0]
        return MOCAP / "cmu_bvh_una" / "repo" / "data" / f"{int(subj):03d}" / f"{cid}.bvh", "cmu", fps
    if spec.startswith("accad:"):
        name = spec[6:]
        actor = name.split("_")[0]
        kind = {"Male2": "accad_m2", "Female1": "accad_f1", "Male1": "accad_m1"}[actor]
        return MOCAP / f"accad_{actor}_bvh" / f"{name}.bvh", kind, None
    raise ValueError(f"unknown clip spec {spec!r}")


def load_clip(spec, **kw):
    """Load + retarget a source clip by spec ('cmu:135_02', 'accad:Female1_C03_Run')."""
    path, kind, fps = find_bvh(spec)
    cfg = SOURCES[kind]
    clip = bvh.load(str(path), scale=cfg["scale"], fps=fps, drop_tpose=cfg["drop_tpose"])
    return retarget(clip, kind, **kw)


# ----------------------------------------------------------------------------- track files
def bone_lengths():
    out = {}
    for n in JOINTS:
        out[n] = bone_len(n)
    return out


def skeleton_dict():
    rp = rest_pose()
    P = rp.fk()[0]
    return {
        "convention": "p_world = joint_pos + R(q) @ p_local; local +Y along the bone to the child "
                      "(end joints continue the limb), +Z = character front at rest (feet/toes: top "
                      "of the foot), +X = Y x Z; she faces +Z, left = +X, Y up, metres; quat = xyzw.",
        "joints": JOINTS,
        "parents": [int(p) for p in PARENT],
        "boneLengths": bone_lengths(),
        "offsets": {n: [round(float(v), 5) for v in OFFSET[J[n]]] for n in JOINTS},
        "height": 1.65,
        "ankleHeight": ANKLE_H, "ballHeight": BALL_H,
        "restPose": {"note": "A-pose, arms 35 deg from the body, standing at the origin",
                     "pos": [[round(float(v), 5) for v in p] for p in P],
                     "quat": [[round(float(v), 6) for v in Rot.from_matrix(rp.R[0, j]).as_quat()] for j in range(NJ)]},
    }


def write_track(m, name, loop=None, out_dir=None):
    """Write <name>.bin (float32, frames x 147: 21 x (pos xyz, quat xyzw)) and <name>.json."""
    if abs(m.fps - FPS) > 1e-9:
        m = resample(m, FPS)
    out_dir = Path(out_dir or TRACKS)
    out_dir.mkdir(parents=True, exist_ok=True)
    P = m.fk()
    data = np.empty((m.frames, NJ, 7), dtype=np.float32)
    data[:, :, :3] = P
    for j in range(NJ):
        data[:, j, 3:] = quat_continuous(m.R[:, j])
    data.reshape(m.frames, NJ * 7).tofile(out_dir / f"{name}.bin")
    loop = m.loop if loop is None else loop
    js = {"fps": 60, "frames": int(m.frames), "joints": JOINTS, "boneLengths": bone_lengths(),
          "events": [{"t": round(float(e["t"]), 4), "name": e["name"]} for e in sorted(m.events, key=lambda e: e["t"])],
          "loop": bool(loop),
          "stride": 147, "duration": round(m.frames / 60.0 if loop else (m.frames - 1) / 60.0, 4),
          "offsets": {n: [round(float(v), 5) for v in OFFSET[J[n]]] for n in JOINTS},
          "meta": {k: (v if not isinstance(v, np.ndarray) else v.tolist()) for k, v in m.meta.items()}}
    (out_dir / f"{name}.json").write_text(json.dumps(js, indent=1))
    return out_dir / f"{name}.bin"


def load_track(name, out_dir=None):
    out_dir = Path(out_dir or TRACKS)
    js = json.loads((out_dir / f"{name}.json").read_text())
    d = np.fromfile(out_dir / f"{name}.bin", dtype=np.float32).reshape(js["frames"], NJ, 7).astype(np.float64)
    R = Rot.from_quat(d[:, :, 3:].reshape(-1, 4)).as_matrix().reshape(js["frames"], NJ, 3, 3)
    m = Motion(d[:, 0, :3].copy(), R, float(js["fps"]), js.get("events", []), js.get("loop", False), js.get("meta", {}))
    m.meta["_stored_pos"] = d[:, :, :3]
    return m


def write_skeleton_json():
    p = HERE / "skeleton.json"
    p.write_text(json.dumps(skeleton_dict(), indent=1))
    return p


if __name__ == "__main__":
    print(write_skeleton_json())
