"""Choreography helpers on top of motion.py (M2 workstream; motion.py itself is not edited here).

Three things motion.py does not have:

1. make_pose(...)   a full-body key pose from a semantic description (pelvis, spine, feet on the
                    ground or in the air, arms by reach, head by look), solved by IK into clean
                    joint frames (no residual twist), on the canonical skeleton.
2. blend(A, B, w)   cross-fade between two moving (or static) sources with the FEET handled in
                    world space: a foot that is in the same place in both stays pinned, a foot
                    that has to move makes a small step (lift arc) instead of sliding.
3. Timeline         lays key poses and (time-warped, placed) mocap clips on SONG time; every
                    accent arrives on its stated time; strikes use a 'snap' velocity profile
                    (accelerate, stop in ~3 frames, then dead still).

Stage frame: +Z is downstage (toward a frontal camera), +X is the performer's left when she
faces +Z, Y up. Angles in degrees in the pose description. yaw > 0 turns toward +X.
"""
from __future__ import annotations

import math

import numpy as np

import motion as M

J = M.J
BEAT = 60.0 / 138.0
BAR = 4 * BEAT
BAR1 = 0.126
UP = np.array([0.0, 1.0, 0.0])
ARM_REACH = M.LEN["upArm"] + M.LEN["foreArm"]
LEG_REACH = M.LEN["thigh"] + M.LEN["shin"]


def bt(bar, beat=1.0):
    """Song time (s) of bar.beat (beat may be fractional: 3.5 = the 'and' of 3)."""
    return BAR1 + (bar - 1) * BAR + (beat - 1) * BEAT


# ----------------------------------------------------------------------------- small maths
def _rx(deg):
    a = math.radians(deg); c, s = math.cos(a), math.sin(a)
    return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def _ry(deg):
    a = math.radians(deg); c, s = math.cos(a), math.sin(a)
    return np.array([[c, 0, s], [0, 1, 0], [-s, 0, c]])


def _rz(deg):
    a = math.radians(deg); c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]])


def frame_xy(x, y):
    """Frame with +Y = y exactly and +X as close to x as possible; columns X, Y, Z."""
    y = M.unit(np.asarray(y, float))
    x = np.asarray(x, float)
    x = M.unit(x - (x @ y) * y)
    return np.stack([x, y, np.cross(x, y)], axis=-1)


def frame_zy(z, y):
    """Frame with +Z = z exactly and +Y as close to y as possible."""
    z = M.unit(np.asarray(z, float))
    y = np.asarray(y, float)
    y = M.unit(y - (y @ z) * z)
    return np.stack([np.cross(y, z), y, z], axis=-1)


def _slerp(Ra, Rb, w):
    """Ra -> Rb by weight w (broadcast over leading dims; w may slightly exceed [0,1])."""
    d = M.rotvec(Rb @ M.T_(Ra))
    return M.expmap(d * np.asarray(w, float)[..., None]) @ Ra


_REST = M.rest_pose()
_REST_LOCAL = M.to_local(_REST.R)[0]


# ----------------------------------------------------------------------------- pose builder
def _solve_limb(H, T, a, b, pole, sign):
    """Two-bone chain from H to T. Returns (mid, end, R_top, R_mid). `pole`: direction the mid
    joint leans to. sign=+1 legs, -1 arms (which way local X is the hinge; see module notes)."""
    d = T - H
    dist = np.linalg.norm(d)
    dc = float(np.clip(dist, abs(a - b) + 1e-3, a + b - 1e-4))
    n = d / max(dist, 1e-9)
    x = (a * a - b * b + dc * dc) / (2 * dc)
    h = math.sqrt(max(a * a - x * x, 0.0))
    p = np.asarray(pole, float)
    p = p - (p @ n) * n
    if np.linalg.norm(p) < 1e-6:
        p = np.cross(n, [1.0, 0, 0])
        if np.linalg.norm(p) < 1e-6:
            p = np.cross(n, [0, 0, 1.0])
    p = M.unit(p)
    K = H + n * x + p * h
    E = H + n * dc
    hinge = sign * M.unit(np.cross(n, p))        # legs: local X = n x p ; arms: local X = p x n
    return K, E, frame_xy(hinge, K - H), frame_xy(hinge, E - K)


def make_pose(hips=(0.0, M.HIPS_H, 0.0), yaw=0.0, pitch=0.0, roll=0.0,
              spine=(0.0, 0.0, 0.0), look=None, head=(0.0, 0.0),
              footL=(0.11, 0.0, 8.0), footR=(-0.11, 0.0, -8.0), kneeL=None, kneeR=None,
              armL=None, armR=None, shrug=(0.0, 0.0), facing=0.0, at=(0.0, 0.0)):
    """One-frame Motion.

    hips: (x, y, z) of the hips joint. yaw/pitch/roll of the pelvis (pitch > 0 bows forward,
    roll > 0 leans to her left). spine = (forward, side, twist) total degrees shared over spine
    and chest (twist > 0 turns the shoulders to her left). look: stage direction of the face
    (default: chest front turned by head=(yaw, pitch)).
    foot: (x, z, yaw) = flat on the ground with the ANKLE over (x, z), toes pointing yaw; or a
    dict: {x, z, yaw, heel: deg (heel raised, pivot on the ball)} | {ankle: (x,y,z), toe: dir of
    the foot bone, top: direction of the top of the foot} for a foot in the air.
    knee: direction the knee points (default: along the toes, a little forward).
    arm: dict with one of  to=(x,y,z) wrist (stage) | dir=(x,y,z)+ext (stage, from the shoulder) |
    rel=(x,y,z) wrist in the CHEST frame from the chest joint | cdir=(x,y,z)+ext (chest frame);
    elbow = pole direction (same frame as the target), hand = finger direction (default: along
    the forearm), palm = palm normal hint. None = hanging relaxed.
    facing/at: finally the whole pose is turned by `facing` deg about the origin and moved to `at`.
    """
    R = np.tile(np.eye(3), (M.NJ, 1, 1))
    Pj = np.zeros((M.NJ, 3))
    hp = np.asarray(hips, float)
    Rh = _ry(yaw) @ _rx(pitch) @ _rz(-roll)
    R[J["hips"]] = Rh
    fw, sd, tw = spine
    Rs = Rh @ (_ry(tw * 0.4) @ _rx(fw * 0.4) @ _rz(-sd * 0.4))
    Rc = Rs @ (_ry(tw * 0.6) @ _rx(fw * 0.6) @ _rz(-sd * 0.6))
    R[J["spine"]], R[J["chest"]] = Rs, Rc
    Pj[J["hips"]] = hp
    Pj[J["spine"]] = hp + Rh @ M.OFFSET[J["spine"]]
    Pj[J["chest"]] = Pj[J["spine"]] + Rs @ M.OFFSET[J["chest"]]
    Pj[J["neck"]] = Pj[J["chest"]] + Rc @ M.OFFSET[J["neck"]]
    # head
    if look is None:
        Rhd = Rc @ _ry(head[0]) @ _rx(head[1])
    else:
        Rhd = frame_zy(look, Rc[:, 1] + 1.5 * UP)
    Rn = _slerp(Rc, Rhd, 0.45)
    R[J["neck"]], R[J["head"]] = Rn, Rhd
    Pj[J["head"]] = Pj[J["neck"]] + Rn @ M.OFFSET[J["head"]]
    # legs
    for s, sg, foot, knee in (("L", 1.0, footL, kneeL), ("R", -1.0, footR, kneeR)):
        th, sh, ft, toe = J["thigh" + s], J["shin" + s], J["foot" + s], J["toe" + s]
        H = hp + Rh @ M.OFFSET[th]
        if isinstance(foot, dict) and "ankle" in foot:
            A = np.asarray(foot["ankle"], float)
            td = M.unit(np.asarray(foot.get("toe", (0, -0.3, 1.0)), float))
            Rf = M.frame_from_yz(td, foot.get("top", (0, 1.0, 0.3)))
            Rt = M.frame_from_yz(M.unit(np.asarray(foot.get("toes", td), float)), Rf[:, 2])
            kdef = (Rh[:, 2] + 0.3 * td) if knee is None else knee
        else:
            if isinstance(foot, dict):
                fx, fz, fyaw, heel = foot["x"], foot["z"], foot.get("yaw", 0.0), foot.get("heel", 0.0)
            else:
                fx, fz, fyaw = foot
                heel = 0.0
            Q = _ry(fyaw)
            Rf0 = Q @ M.frame_from_yz([0, -math.sin(M.FOOT_PITCH), math.cos(M.FOOT_PITCH)], [0, 1, 0])
            Rt = Q @ M.frame_from_yz([0, 0, 1], [0, 1, 0])
            A0 = np.array([fx, M.ANKLE_H, fz])
            ball = A0 + Rf0 @ np.array([0, M.LEN["foot"], 0])
            Rf = Q @ _rx(heel) @ M.T_(Q) @ Rf0          # heel up: pitch about the foot's own X at the ball
            A = ball - Rf @ np.array([0, M.LEN["foot"], 0])
            kdef = (Q @ np.array([0, 0, 1.0]) + 0.25 * Rh[:, 2]) if knee is None else knee
        K, E, Rth, Rsh = _solve_limb(H, A, M.LEN["thigh"], M.LEN["shin"], kdef, +1.0)
        R[th], R[sh], R[ft], R[toe] = Rth, Rsh, Rf, Rt
        Pj[th] = H
    # arms
    for s, sg, arm, k in (("L", 1.0, armL, 0), ("R", -1.0, armR, 1)):
        cl, ua, fa, hd = J["clav" + s], J["upArm" + s], J["foreArm" + s], J["hand" + s]
        Rcl = Rc @ _REST_LOCAL[cl] @ _rz(sg * shrug[k])
        R[cl] = Rcl
        C = Pj[J["chest"]] + Rc @ M.OFFSET[cl]
        S = C + Rcl @ M.OFFSET[ua]
        if arm is None:
            arm = {"cdir": (sg * 0.16, -1.0, 0.10), "ext": 0.985, "elbow": (sg * 0.3, 0, -1.0)}
        ext = arm.get("ext", 0.985)
        if "to" in arm:
            W = np.asarray(arm["to"], float); fr = np.eye(3)
        elif "dir" in arm:
            W = S + M.unit(np.asarray(arm["dir"], float)) * ext * ARM_REACH; fr = np.eye(3)
        elif "rel" in arm:
            W = Pj[J["chest"]] + Rc @ np.asarray(arm["rel"], float); fr = Rc
        else:
            W = S + Rc @ M.unit(np.asarray(arm["cdir"], float)) * ext * ARM_REACH; fr = Rc
        pole = fr @ np.asarray(arm.get("elbow", (sg * 0.5, -0.6, -0.6)), float)
        Ke, We, Rua, Rfa = _solve_limb(S, W, M.LEN["upArm"], M.LEN["foreArm"], pole, -1.0)
        R[ua], R[fa] = Rua, Rfa
        if "hand" in arm:
            hdir = fr @ M.unit(np.asarray(arm["hand"], float))
        else:
            hdir = Rfa[:, 1]
        if "palm" in arm:      # palm normal: local +X for the left hand, -X for the right
            pn = fr @ M.unit(np.asarray(arm["palm"], float))
            R[hd] = frame_xy(sg * pn, hdir)
        else:
            R[hd] = frame_xy(Rfa[:, 0], hdir)
    m = M.Motion(hp[None].copy(), R[None].copy())
    if facing or at[0] or at[1]:
        m = M.transform(m, math.radians(facing), (at[0], 0.0, at[1]))
    return m


def tilt(p, pitch=0.0, roll=0.0, yaw=0.0, root=None):
    """Rigidly rotate a one-frame pose about its hips (stage axes), optionally set the hips position."""
    Q = _ry(yaw) @ _rx(pitch) @ _rz(-roll)
    out = p.copy()
    out.R = Q @ p.R
    if root is not None:
        out.root = np.asarray(root, float)[None].copy()
    return out


def lowest(p):
    """Lowest point of a pose: joints, hand tips, toe tips, sole points."""
    P = p.fk()
    ys = [P[..., 1].min()]
    for s in "LR":
        for n in ("hand", "toe"):
            j = J[n + s]
            ys.append((P[:, j] + p.R[:, j] @ np.array([0, M.bone_len(n + s), 0]))[:, 1].min())
    return float(min(ys))


def rep(p, n):
    """A one-frame pose held for n frames."""
    return M.Motion(np.repeat(p.root[:1], n, 0), np.repeat(p.R[:1], n, 0), p.fps)


def mix(a, b, w, **kw):
    """One-frame pose between two poses (feet interpolated on the ground, legs re-solved)."""
    return blend(a, b, np.array([float(w)]), **kw)


def pose_of(m, frame):
    return M.Motion(m.root[frame:frame + 1].copy(), m.R[frame:frame + 1].copy(), m.fps)


# ----------------------------------------------------------------------------- blending
def blend(A, B, w, wf=None, lift=0.4, lift_max=0.14, legs=True, free=""):
    """A -> B by per-frame weight w. Root lerp, joint slerp in parent space; feet are driven in
    world space (ankle targets blend A -> B by wf, default w clipped to [0,1], with a lift arc
    proportional to how far the ankle travels over the ground), legs re-solved by IK.
    free: sides ("L", "R", "LR") whose leg is NOT re-solved: it swings by joint rotation (kicks, jumps)."""
    w = np.asarray(w, float)
    F = A.frames
    wc = np.clip(w, 0.0, 1.0)
    wf = wc if wf is None else np.clip(np.asarray(wf, float), 0.0, 1.0)
    out = A.copy()
    out.root = A.root + (B.root - A.root) * wc[:, None]
    LA, LB = M.to_local(A.R), M.to_local(B.R)
    L = np.empty_like(LA)
    for j in range(M.NJ):
        wj = wc if j == 0 else w
        L[:, j] = _slerp(LA[:, j], LB[:, j], wj)
    out.R = M.from_local(L)
    if not legs:
        return out
    PA, PB = A.fk(), B.fk()
    for s in "LR":
        if s in free:
            continue
        th, sh, ft, toe = J["thigh" + s], J["shin" + s], J["foot" + s], J["toe" + s]
        a, b = PA[:, ft], PB[:, ft]
        tgt = a + (b - a) * wf[:, None]
        d = np.linalg.norm((b - a)[:, [0, 2]], axis=1)
        hgt = np.minimum(lift_max, lift * d)
        tgt[:, 1] += hgt * np.sin(np.pi * wf) ** 2
        out.R[:, ft] = _slerp(A.R[:, ft], B.R[:, ft], wf)
        out.R[:, toe] = _slerp(A.R[:, toe], B.R[:, toe], wf)
        out = M._limb_ik(out, th, sh, ft, tgt, bend_axis=+1.0)
    return out


def snap(u, stop=0.3, p=1.6):
    """Strike profile on u in [0,1]: speed builds (~u^p), peaks late, dies in the last `stop`
    fraction. Returns position 0..1."""
    u = np.clip(np.asarray(u, float), 0.0, 1.0)
    g = np.linspace(0.0, 1.0, 513)
    up = 1.0 - stop
    v = np.where(g < up, (g / max(up, 1e-6)) ** p, 0.5 * (1 + np.cos(np.pi * (g - up) / max(stop, 1e-6))))
    c = np.concatenate([[0.0], np.cumsum(0.5 * (v[1:] + v[:-1]))])
    return np.interp(u, g, c / c[-1])


EASES = {
    "snap": lambda u, n: snap(u, stop=min(0.45, 3.0 / max(n, 4))),
    "hit": lambda u, n: snap(u, stop=min(0.45, 2.5 / max(n, 4)), p=2.2),
    "smooth": lambda u, n: M.smootherstep(u),
    "soft": lambda u, n: M.smoothstep(u),
    "out": lambda u, n: 1.0 - (1.0 - np.clip(u, 0, 1)) ** 2.2,          # fast start, soft landing
    "in": lambda u, n: np.clip(u, 0, 1) ** 2.0,
    "launch": lambda u, n: 1.0 - (1.0 - np.clip(u, 0, 1) ** 1.4) ** 2.0,            # a take-off: quick but not instant
    "lin": lambda u, n: np.clip(u, 0, 1),
}


class Timeline:
    """Frames on song time. Start with a pose; then add, in time order, key poses (`to`) and
    clips (`clip`). Between entries the current source simply continues (a pose stays, a clip
    plays on to its end and stays), so every cross-fade is from moving material."""

    def __init__(self, t0, t1, start_pose, fps=M.FPS):
        self.t0, self.fps = t0, fps
        self.n = int(round((t1 - t0) * fps)) + 1
        self.m = rep(start_pose, self.n)
        self.events = []
        self.keys = []          # (song time, label) of arrivals, for the notes
        self.stills = []        # (t_a, t_b) song-time windows with no breathing at all

    def times(self):
        return self.t0 + np.arange(self.n) / self.fps

    def mark(self, t, name):
        self.events.append({"t": float(t - self.t0), "name": name, "song": round(float(t), 3)})

    def to(self, pose, t, dur, ease="snap", name=None, recoil=0.0, wf=None, lift=0.4, lift_max=0.14, feet_lead=0.0, free="", hop=0.0):
        """Arrive in `pose` exactly at song time t, having started dur seconds earlier.
        recoil: tiny elastic overshoot of the joints for ~4 frames after arrival (0.02 typical).
        feet_lead: the feet finish this fraction of the move early (they land before the strike).
        free: legs that swing by joint rotation instead of IK. hop: extra hips height (m) mid-move."""
        ts = self.times()
        f0 = max(0, int(math.floor((t - dur - self.t0) * self.fps)))
        u = (ts[f0:] - (t - dur)) / max(dur, 1e-6)
        nfr = max(1, int(round(dur * self.fps)))
        w = EASES[ease](u, nfr)
        w = np.where(u >= 1.0, 1.0, w)
        if recoil:
            tau = (ts[f0:] - t) * self.fps
            T = 5.0
            w = w + np.where((tau > 0) & (tau < T), recoil * np.sin(np.pi * tau / T), 0.0)
        if feet_lead:
            uf = np.clip(u / (1.0 - feet_lead), 0, 1)
            wfa = M.smootherstep(uf)
        else:
            wfa = None if wf is None else wf
        f1 = min(self.n, int(math.ceil((t - self.t0) * self.fps)) + 8)
        A = M.Motion(self.m.root[f0:f1], self.m.R[f0:f1], self.fps)
        B = rep(pose, f1 - f0)
        ww = w[:f1 - f0]
        if hop:
            A = A.copy()
            B = B.copy()
            bump = hop * np.sin(np.pi * np.clip(ww, 0, 1)) ** 2
            A.root[:, 1] += bump
            B.root[:, 1] += bump
        out = blend(A, B, ww, wf=None if wfa is None else wfa[:f1 - f0], lift=lift, lift_max=lift_max, free=free)
        self.m.root[f0:f1], self.m.R[f0:f1] = out.root, out.R
        if f1 < self.n:
            self.m.root[f1:], self.m.R[f1:] = pose.root[0], pose.R[0]
        if name:
            self.mark(t, name)
        self.keys.append((t, name or ""))
        return self

    def clip(self, c, t_first, t_in, blend_in=0.2, ease="smooth", name=None, lift=0.4, lift_max=0.14):
        """Play clip c (a Motion already placed in the stage and retimed) with its frame 0 at song
        time t_first; it is faded in over [t_in - blend_in, t_in] (so c should include pre-roll
        before t_in) and stays in charge afterwards (its last frame is held)."""
        ts = self.times()
        f0 = max(0, int(math.floor((t_in - blend_in - self.t0) * self.fps)))
        loc = np.clip(ts[f0:] - t_first, 0.0, c.duration)
        Bm = M.sample(c, loc, wrap=False)
        u = (ts[f0:] - (t_in - blend_in)) / max(blend_in, 1e-6)
        w = EASES[ease](u, int(blend_in * self.fps))
        w = np.where(u >= 1.0, 1.0, w)
        f1 = min(self.n, int(math.ceil((t_in - self.t0) * self.fps)) + 2)
        A = M.Motion(self.m.root[f0:f1], self.m.R[f0:f1], self.fps)
        B = M.Motion(Bm.root[:f1 - f0], Bm.R[:f1 - f0], self.fps)
        out = blend(A, B, w[:f1 - f0], lift=lift, lift_max=lift_max)
        self.m.root[f0:f1], self.m.R[f0:f1] = out.root, out.R
        self.m.root[f1:], self.m.R[f1:] = Bm.root[f1 - f0:], Bm.R[f1 - f0:]
        for e in c.events:
            tt = t_first + e["t"]
            if tt >= t_in - 1e-6 and not e["name"].startswith("foot"):
                self.mark(tt, e["name"])
        if name:
            self.mark(t_in, name)
        return self

    def still(self, t_a, t_b):
        """No breathing between song times t_a and t_b (a dead-still hold)."""
        self.stills.append((t_a, t_b))
        return self

    def pose_at(self, t):
        f = int(round((t - self.t0) * self.fps))
        return pose_of(self.m, min(max(f, 0), self.n - 1))

    def result(self, breath=0.6, clamp=True):
        m = self.m.copy()
        if breath:      # breathing is a function of SONG time, so overlapping tracks agree
            mb = M.breathe(m, period=3.2, depth=breath, sway=0.0, phase=(self.t0 % 3.2) / 3.2)
            if self.stills:
                ts = self.times()
                w = np.ones(self.n)
                for a, b in self.stills:
                    w = np.minimum(w, 1.0 - M.smoothstep((ts - (a - 0.15)) / 0.15) * (1.0 - M.smoothstep((ts - b) / 0.15)))
                mb = blend(m, mb, w, legs=False)
            m = mb
        if clamp:
            m = lift_feet(m)
        m.events = sorted(self.events, key=lambda e: e["t"])
        m.meta["song_t0"] = round(self.t0, 4)
        m.meta["accents"] = [{"name": e["name"], "song": e["song"], "bar": round((e["song"] - BAR1) / BAR + 1, 3)}
                             for e in m.events]
        return m


def lift_feet(m, iters=2):
    """Nothing below the ground: soles are lifted by leg IK; if hips/hands dip (floor work) the
    whole frame is raised."""
    out = m
    for _ in range(iters):
        P = out.fk()
        sh = M.sole_height(out, P)
        for k, s in enumerate("LR"):
            pen = np.maximum(-sh[:, k], 0.0)
            if pen.max() > 1e-4:
                tgt = P[:, J["foot" + s]] + np.stack([0 * pen, pen, 0 * pen], 1)
                out = M.leg_ik(out, s, tgt)
    sh = M.sole_height(out)
    worst = np.maximum(-sh.min(1), 0.0)
    if worst.max() > 1e-3:
        out = out.copy()
        out.root[:, 1] += worst
    return out


# ----------------------------------------------------------------------------- clips
def retime(m, anchors):
    """Time-warp a clip by (source time, song time) anchors. Returns (motion, song time of its frame 0)."""
    a = sorted(anchors, key=lambda p: p[1])
    return M.time_warp(m, a), a[0][1]


def put(m, t, at=(0.0, 0.0), yaw=None, point="hips", aim=None):
    """Rigidly place clip m so that at clip time t the `point` (hips | footL | footR | mid = between
    the ankles) is over stage point `at`. yaw (deg): heading of the hips at that time; or aim =
    (joint_from, joint_to, deg): the horizontal direction between two joints at time t is turned to deg."""
    f = int(round(t * m.fps))
    out = m
    P = out.fk()
    if aim is not None:
        a, b, deg = aim
        d = P[f, J[b]] - P[f, J[a]]
        cur = math.atan2(d[0], d[2])
        out = M.transform(out, math.radians(deg) - cur)
    elif yaw is not None:
        out = M.transform(out, math.radians(yaw) - M.heading(out, f))
    P = out.fk()
    if point == "hips":
        p = P[f, 0]
    elif point == "mid":
        p = 0.5 * (P[f, J["footL"]] + P[f, J["footR"]])
    else:
        p = P[f, J[point]]
    out = out.copy()
    out.root[:, 0] += at[0] - p[0]
    out.root[:, 2] += at[1] - p[2]
    return out


# ----------------------------------------------------------------------------- quick looks
def show(m, name, n=16, az=30.0, el=8.0, t_from=None, t_to=None, mp4=False, song_t0=None, views=(30.0,)):
    """Write a scratch track _c_<name> and its filmstrip (and optional beat-flash movies)."""
    import preview_track as PV
    nm = "_c_" + name
    M.write_track(m, nm)
    outs = [PV.filmstrip(nm, n=n, az=az, el=el, t_from=t_from, t_to=t_to)]
    if mp4:
        for v in views:
            outs.append(PV.movie(nm, song_t0=song_t0, t_from=t_from, t_to=t_to, az=v,
                                 out=PV.OUT / f"{nm}_az{int(v)}.mp4"))
    return outs
