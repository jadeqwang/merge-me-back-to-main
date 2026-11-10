"""Dependency-light BVH reader + forward kinematics (numpy only).

    from bvh import load
    clip = load("135_01.bvh")            # CMU defaults: metres, Y-up, T-pose frame dropped
    clip.names, clip.parents             # joint names, parent index (-1 for the root)
    pos = clip.positions()               # (F, J, 3) global joint positions, metres, Y-up
    rot = clip.rotations()               # (F, J, 3, 3) global joint rotation matrices
    clip.fps, clip.duration, clip.n_frames

Conventions
- BVH channel order is honoured per joint: channels "Zrotation Yrotation Xrotation"
  compose as R = Rz @ Ry @ Rx (column vectors, child = parent @ local).
- End Sites become extra joints named "<parent>_end" with identity local rotation
  (pass end_sites=False to drop them).
- scale: BVH units -> metres. The CMU (cgspeed/Hahne) BVH files keep the CMU ASF
  length unit: inches multiplied by 0.45. CMU's own info page gives the conversion
  "scale=(1.0/0.45)*2.54/100.0" = 0.056444 m per unit; that is CMU_SCALE below.
  Checked two ways: (1) hip acceleration while airborne comes out at 9.4-10 m/s^2;
  (2) hip joints stand 0.9-1.0 m above the floor. The joint skeleton itself is short
  above the hips (the Head end site is not the crown): head-top stands at 1.35-1.52 m
  for the subjects used here. Retarget by leg length, not by head height.
- The cgspeed conversion inserts a synthetic T-pose as frame 0 and stamps every
  file as 120 fps. drop_tpose=True (default) removes that frame. Some CMU trials
  were really captured at 60 fps (see cmu_index.csv, column fps); pass fps=60 for
  those or use catalog.load_cmu(), which looks the rate up.

This module only parses text; it never executes anything from the file.
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field

import numpy as np

CMU_SCALE = 2.54 / 100.0 / 0.45  # 0.0564444 m per CMU BVH unit


@dataclass
class Clip:
    names: list
    parents: np.ndarray          # (J,) int, -1 for root
    offsets: np.ndarray          # (J, 3) metres (already scaled)
    channels: list               # per joint: list of channel names ([] for end sites)
    chan_start: np.ndarray       # (J,) index of first channel in the motion row
    motion: np.ndarray           # (F, C) raw channel values (positions unscaled, degrees)
    frame_time: float            # seconds per frame actually used
    scale: float
    path: str = ""
    file_frame_time: float = 0.0  # as written in the file
    _cache: dict = field(default_factory=dict, repr=False)

    @property
    def n_frames(self):
        return self.motion.shape[0]

    @property
    def n_joints(self):
        return len(self.names)

    @property
    def fps(self):
        return 1.0 / self.frame_time

    @property
    def duration(self):
        return self.n_frames * self.frame_time

    def index(self, name):
        return self.names.index(name)

    def children(self, j):
        return [i for i, p in enumerate(self.parents) if p == j]

    def bones(self):
        """(child, parent) index pairs with non-zero length (drawable segments)."""
        return [(j, int(p)) for j, p in enumerate(self.parents)
                if p >= 0 and np.linalg.norm(self.offsets[j]) > 1e-9]

    # ---- forward kinematics -------------------------------------------------
    def local(self, frames=None):
        """Local rotations (F, J, 3, 3) and local translations (F, J, 3) in metres."""
        m = self.motion if frames is None else self.motion[frames]
        F, J = m.shape[0], self.n_joints
        R = np.broadcast_to(np.eye(3), (F, J, 3, 3)).copy()
        T = np.broadcast_to(self.offsets, (F, J, 3)).copy()
        for j in range(J):
            ch = self.channels[j]
            if not ch:
                continue
            c0 = self.chan_start[j]
            Rj = None
            tr = np.zeros((F, 3))
            has_tr = False
            for k, name in enumerate(ch):
                v = m[:, c0 + k]
                axis = "XYZ".index(name[0].upper())
                if name[1:].lower() == "position":
                    tr[:, axis] = v * self.scale
                    has_tr = True
                else:
                    Ra = _axis_rot(axis, np.radians(v))
                    Rj = Ra if Rj is None else Rj @ Ra
            if Rj is not None:
                R[:, j] = Rj
            if has_tr:
                # Position channels give the joint's translation outright (the Blender /
                # MotionBuilder reading): the OFFSET is only the rest position. CMU roots have
                # OFFSET 0 so either reading agrees; ACCAD roots do not.
                T[:, j] = tr
        return R, T

    def fk(self, frames=None):
        """Global positions (F, J, 3) metres and global rotations (F, J, 3, 3)."""
        if frames is None and "fk" in self._cache:
            return self._cache["fk"]
        R, T = self.local(frames)
        F, J = R.shape[:2]
        G = np.empty_like(R)
        P = np.empty((F, J, 3))
        for j in range(J):
            p = self.parents[j]
            if p < 0:
                G[:, j] = R[:, j]
                P[:, j] = T[:, j]
            else:
                G[:, j] = G[:, p] @ R[:, j]
                P[:, j] = P[:, p] + np.einsum("fab,fb->fa", G[:, p], T[:, j])
        if frames is None:
            self._cache["fk"] = (P, G)
        return P, G

    def positions(self, frames=None):
        return self.fk(frames)[0]

    def rotations(self, frames=None):
        return self.fk(frames)[1]

    def height(self):
        """Standing height estimate in metres from bone lengths (pose independent):
        foot sole -> hip (leg chain) + hip -> head top (spine chain), + 0 for flesh."""
        def chain(end):
            L, j = 0.0, self.index(end)
            while self.parents[j] >= 0:
                L += float(np.linalg.norm(self.offsets[j]))
                j = int(self.parents[j])
            return L
        names = set(self.names)
        foot = next((n for n in ("LeftFoot", "lfoot", "LeftAnkle") if n in names), None)
        head = next((n for n in ("Head_end", "Head", "head") if n in names), None)
        if foot is None or head is None:
            return float("nan")
        return chain(foot) + chain(head)


def _axis_rot(axis, a):
    c, s = np.cos(a), np.sin(a)
    R = np.zeros(a.shape + (3, 3))
    if axis == 0:
        R[..., 0, 0] = 1
        R[..., 1, 1] = c; R[..., 1, 2] = -s
        R[..., 2, 1] = s; R[..., 2, 2] = c
    elif axis == 1:
        R[..., 1, 1] = 1
        R[..., 0, 0] = c; R[..., 0, 2] = s
        R[..., 2, 0] = -s; R[..., 2, 2] = c
    else:
        R[..., 2, 2] = 1
        R[..., 0, 0] = c; R[..., 0, 1] = -s
        R[..., 1, 0] = s; R[..., 1, 1] = c
    return R


_TOKEN = re.compile(r"[{}]|[^\s{}]+")


def load(path, scale=CMU_SCALE, fps=None, drop_tpose=True, end_sites=True):
    """Parse a BVH file.

    scale       BVH length units -> metres (CMU_SCALE by default; use 0.01 for cm files).
    fps         override the file's frame rate (CMU: some trials are really 60 fps).
    drop_tpose  drop frame 0 (the synthetic T-pose the cgspeed CMU conversion adds).
    """
    with open(path, "r", errors="replace") as f:
        text = f.read()
    mpos = re.search(r"^\s*MOTION\s*$", text, flags=re.M)
    if not mpos:
        raise ValueError(f"{path}: no MOTION section")
    head, body = text[:mpos.start()], text[mpos.end():]

    names, parents, offsets, channels = [], [], [], []
    stack, tok = [], _TOKEN.findall(head)
    i, pending = 0, None
    while i < len(tok):
        t = tok[i]
        if t in ("ROOT", "JOINT"):
            pending = ("joint", tok[i + 1]); i += 2
        elif t == "End":                      # "End Site"
            pending = ("end", None); i += 2
        elif t == "{":
            kind, nm = pending
            par = stack[-1] if stack else -1
            if kind == "end":
                nm = f"{names[par]}_end"
            names.append(nm); parents.append(par)
            offsets.append([0.0, 0.0, 0.0]); channels.append([])
            stack.append(len(names) - 1); i += 1
        elif t == "}":
            stack.pop(); i += 1
        elif t == "OFFSET":
            offsets[stack[-1]] = [float(tok[i + 1]), float(tok[i + 2]), float(tok[i + 3])]; i += 4
        elif t == "CHANNELS":
            n = int(tok[i + 1])
            channels[stack[-1]] = tok[i + 2:i + 2 + n]; i += 2 + n
        else:
            i += 1                           # HIERARCHY and anything unknown

    m = re.search(r"Frames:\s*(\d+)\s*Frame Time:\s*([0-9.eE+-]+)", body)
    if not m:
        raise ValueError(f"{path}: bad MOTION header")
    n_frames, file_ft = int(m.group(1)), float(m.group(2))
    n_chan = sum(len(c) for c in channels)
    data = np.array(body[m.end():].split(), dtype=np.float64)
    if n_chan == 0 or data.size < n_chan:
        raise ValueError(f"{path}: no motion data")
    data = data[: (data.size // n_chan) * n_chan].reshape(-1, n_chan)
    if data.shape[0] != n_frames:
        n_frames = data.shape[0]             # trust the data over the header

    chan_start = np.cumsum([0] + [len(c) for c in channels])[:-1]
    names_a, parents_a = list(names), np.array(parents, dtype=int)
    offsets_a = np.array(offsets, dtype=np.float64) * scale

    if not end_sites:
        keep = [j for j, n in enumerate(names_a) if channels[j] or parents_a[j] < 0]
        remap = {old: new for new, old in enumerate(keep)}
        names_a = [names_a[j] for j in keep]
        offsets_a = offsets_a[keep]
        chan_start = chan_start[keep]
        channels = [channels[j] for j in keep]
        parents_a = np.array([remap.get(int(parents_a[j]), -1) for j in keep], dtype=int)

    if drop_tpose and data.shape[0] > 1:
        data = data[1:]
    ft = (1.0 / fps) if fps else file_ft
    return Clip(names=names_a, parents=parents_a, offsets=offsets_a, channels=channels,
                chan_start=np.asarray(chan_start), motion=data, frame_time=ft,
                scale=scale, path=str(path), file_frame_time=file_ft)


if __name__ == "__main__":
    import sys
    c = load(sys.argv[1])
    P, G = c.fk()
    print(f"{c.path}: {c.n_frames} frames @ {c.fps:.1f} fps = {c.duration:.2f} s, "
          f"{c.n_joints} joints, height {c.height():.3f} m")
    for j, (n, p) in enumerate(zip(c.names, c.parents)):
        print(f"{j:2d} {n:22s} parent={c.names[p] if p >= 0 else '-':18s} "
              f"len={np.linalg.norm(c.offsets[j]):.3f} m")
    print("y range (m):", P[..., 1].min().round(3), P[..., 1].max().round(3))
    print("det(R) range:", np.linalg.det(G).min().round(6), np.linalg.det(G).max().round(6))
