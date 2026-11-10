"""Checks on retargeted motion and on written tracks.

    validate.py                      # retarget a fixed set of source clips and check them
    validate.py --tracks [NAME ...]  # check tracks on disk (all if no names)

Checks: bone lengths constant to 1 mm; feet (sole points) never more than 1 cm below the ground;
unit quaternions without sign flips; joint positions rebuilt from (hips position + orientations +
offsets) equal the stored positions; no NaN; per-frame joint speed sanity (teleport frames).
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import motion as M  # noqa: E402

CLIPS = ["cmu:88_06", "cmu:135_02", "cmu:12_04", "cmu:49_08", "cmu:05_17", "cmu:09_01",
         "accad:Male2_Form_1", "accad:Male2_G1_SidekickLeadingLeft", "accad:Female1_C03_Run",
         "accad:Female1_B03_Walk1", "accad:Female1_A04_Look"]


def check_arrays(pos, quat, events=(), name="", loop=False, fps=60.0):
    """pos (F,21,3), quat (F,21,4 xyzw). Returns (ok, lines)."""
    lines, ok = [], True
    F = pos.shape[0]

    def rep(label, value, limit, fmt="{:.4f}"):
        nonlocal ok
        good = value <= limit
        ok &= bool(good)
        lines.append(f"   {'ok ' if good else 'BAD'} {label}: {fmt.format(value)} (limit {fmt.format(limit)})")
    if not (np.isfinite(pos).all() and np.isfinite(quat).all()):
        return False, ["   BAD non-finite values"]
    # bone lengths
    worst = 0.0
    for j in range(1, M.NJ):
        p = M.PARENT[j]
        d = np.linalg.norm(pos[:, j] - pos[:, p], axis=1)
        worst = max(worst, float(np.abs(d - np.linalg.norm(M.OFFSET[j])).max()))
    rep("bone length error (m)", worst, 1e-3)
    # quaternions
    rep("quat |norm-1|", float(np.abs(np.linalg.norm(quat, axis=2) - 1).max()), 1e-4, "{:.2e}")
    dots = np.sum(quat[1:] * quat[:-1], axis=2)
    rep("quat sign flips", float((dots < 0).sum()), 0, "{:.0f}")
    lines.append(f"       largest per-frame rotation: {np.degrees(2 * np.arccos(np.clip(np.abs(dots), 0, 1))).max() if F > 1 else 0:.1f} deg")
    # FK consistency
    from scipy.spatial.transform import Rotation as Rot
    R = Rot.from_quat(quat.reshape(-1, 4)).as_matrix().reshape(F, M.NJ, 3, 3)
    P = M.fk(pos[:, 0], R)
    rep("FK rebuild error (m)", float(np.abs(P - pos).max()), 1e-3)
    # ground
    m = M.Motion(pos[:, 0].copy(), R, fps)
    sh = M.sole_height(m, pos)
    rep("deepest sole point below ground (m)", float(max(0.0, -sh.min())), 0.01)
    lines.append(f"       sole height 3rd pct {np.percentile(sh.min(1), 3):+.3f} m, lowest joint {pos[..., 1].min():+.3f} m")
    # teleports
    if F > 2:
        sp = np.linalg.norm(np.diff(pos, axis=0), axis=2) * fps
        rep("max joint speed (m/s)", float(sp.max()), 40.0, "{:.1f}")
        if loop:
            wrap = np.linalg.norm(pos[0] - pos[-1], axis=1).max() * fps
            lines.append(f"       loop wrap step: {wrap:.2f} m/s equivalent (median in-clip step {np.median(sp.max(1)):.2f})")
    ev = [e for e in events if not (0 <= e["t"] <= F / fps + 1e-6)]
    rep("events outside the clip", float(len(ev)), 0, "{:.0f}")
    return ok, lines


def check_motion(m, name=""):
    P = m.fk()
    q = np.stack([M.quat_continuous(m.R[:, j]) for j in range(M.NJ)], axis=1)
    return check_arrays(P, q, m.events, name, m.loop, m.fps)


def check_track(name):
    js = json.loads((M.TRACKS / f"{name}.json").read_text())
    d = np.fromfile(M.TRACKS / f"{name}.bin", dtype=np.float32)
    assert d.size == js["frames"] * 147, f"{name}: size {d.size} != frames*147"
    d = d.reshape(js["frames"], M.NJ, 7).astype(np.float64)
    assert js["fps"] == 60 and js["joints"] == M.JOINTS
    return check_arrays(d[:, :, :3], d[:, :, 3:], js.get("events", []), name, js.get("loop", False))


if __name__ == "__main__":
    allok = True
    if len(sys.argv) > 1 and sys.argv[1] == "--tracks":
        names = [a for a in sys.argv[2:] if not a.startswith("-")] or sorted(p.stem for p in M.TRACKS.glob("*.json") if not p.stem.startswith("_"))
        for n in names:
            ok, lines = check_track(n)
            allok &= ok
            js = json.loads((M.TRACKS / f"{n}.json").read_text())
            print(f"{'PASS' if ok else 'FAIL'} track {n}: {js['frames']} frames, {js['duration']} s, loop={js['loop']}")
            if not ok or "-v" in sys.argv:
                print("\n".join(lines))
    else:
        for spec in CLIPS:
            m = M.load_clip(spec)
            ok, lines = check_motion(m, spec)
            allok &= ok
            print(f"{'PASS' if ok else 'FAIL'} {spec}: {m.frames} frames, {m.duration:.2f} s, scale {m.meta['scale']:.3f}, foot cal {m.meta.get('foot_cal_deg', {})}")
            print("\n".join(lines))
    print("ALL PASS" if allok else "SOME FAILED")
    sys.exit(0 if allok else 1)
