"""Per-clip measurements and automatically detected beats for CMU-skeleton BVH clips.

analyse(clip) -> dict with numbers (duration, travel, jump height, glitch count ...)
and "events": a list of (t_seconds, kind, detail) found from the joint positions:

  jump      both feet (and hands) off the floor; detail = hip rise above standing (m)
  inverted  head below hips (cartwheel / flip / handstand); detail says hands on floor or aerial
  kick      an ankle higher than 0.8 x standing hip height while upright (kick, arabesque, knee lift)
  turn      >= 330 degrees of hip yaw inside 2.5 s (spin / pirouette / turn on the spot)
  low       hips below 45 % of standing height for >= 0.4 s (sit / kneel / crouch / lie on the floor)
  arms_up   both wrists above the head top for >= 0.25 s
  arms_wide wrists further apart than 88 % of arm span, near shoulder height, for >= 0.25 s
  lookback  head facing more than 60 degrees away from hip facing for >= 0.25 s

Everything is in metres / seconds, Y-up, using the clip's (corrected) frame rate.
"""
from __future__ import annotations

import numpy as np

BODY = ["Hips", "LeftUpLeg", "LeftLeg", "LeftFoot", "RightUpLeg", "RightLeg", "RightFoot",
        "LowerBack", "Spine", "Spine1", "Neck", "Neck1", "Head",
        "LeftArm", "LeftForeArm", "RightArm", "RightForeArm"]


def _runs(mask, min_len):
    """Yield (start, end_exclusive) for runs of True at least min_len long."""
    m = np.concatenate([[0], mask.astype(np.int8), [0]])
    d = np.diff(m)
    for s, e in zip(np.flatnonzero(d == 1), np.flatnonzero(d == -1)):
        if e - s >= min_len:
            yield int(s), int(e)


def facing_yaw(G_hips):
    """Unwrapped yaw (radians) of the hips' forward (+Z in the T-pose) axis about Y."""
    f = G_hips[:, :, 2]
    return np.unwrap(np.arctan2(f[:, 0], f[:, 2]))


def analyse(clip):
    P, G = clip.fk()
    F, fps = clip.n_frames, clip.fps
    ix = {n: i for i, n in enumerate(clip.names)}
    need = ["Hips", "Head", "LeftFoot", "RightFoot", "LeftToeBase", "RightToeBase",
            "LeftHand", "RightHand", "LeftArm", "RightArm", "LeftLeg", "LeftUpLeg"]
    if any(n not in ix for n in need):
        return {"ok": False, "why": "not a CMU skeleton"}
    L = lambda n: float(np.linalg.norm(clip.offsets[ix[n]]))
    hips, head = P[:, ix["Hips"]], P[:, ix["Head"]]
    head_top = P[:, ix.get("Head_end", ix["Head"])]
    la, ra = P[:, ix["LeftFoot"]], P[:, ix["RightFoot"]]
    lt, rt = P[:, ix["LeftToeBase"]], P[:, ix["RightToeBase"]]
    lw, rw = P[:, ix["LeftHand"]], P[:, ix["RightHand"]]
    ls, rs = P[:, ix["LeftArm"]], P[:, ix["RightArm"]]

    # standing hip height above the floor: thigh + shin + ~8 cm ankle, minus nothing
    stand = L("LeftLeg") + L("LeftFoot") + abs(clip.offsets[ix["LeftUpLeg"], 1]) + 0.08
    arm_span = (np.linalg.norm(clip.offsets[ix["LeftArm"]] - clip.offsets[ix["RightArm"]])
                + 2 * (L("LeftForeArm") + L("LeftHand")))
    feet_min = np.minimum.reduce([la[:, 1], ra[:, 1], lt[:, 1], rt[:, 1]])
    floor = float(np.percentile(feet_min, 2))
    floor = floor if abs(floor) < 0.15 else 0.0          # CMU floor is y=0; tolerate small offsets
    hands_min = np.minimum(lw[:, 1], rw[:, 1]) - floor

    ev = []
    t = lambda f: round(float(f) / fps, 2)
    inverted = head[:, 1] < hips[:, 1] - 0.10
    upright = head[:, 1] > hips[:, 1] + 0.25

    # jumps: every foot joint clear of the floor and hands not supporting
    air = (feet_min - floor > 0.10) & (hands_min > 0.25) & (hips[:, 1] - floor > 0.35 * stand)
    jump_best = 0.0
    for s, e in _runs(air, max(2, int(0.10 * fps))):
        k = s + int(np.argmax(hips[s:e, 1]))
        rise = float(hips[k, 1] - floor - stand)
        clear = float((feet_min[s:e] - floor).max())
        if (e - s) / fps > 1.2:                      # "airborne" for >1.2 s = standing on a prop
            continue
        jump_best = max(jump_best, clear)
        ev.append((t(k), "jump", f"air {(e - s) / fps:.2f}s feet {clear:.2f}m hips {rise:+.2f}m"))

    for s, e in _runs(inverted, max(2, int(0.08 * fps))):
        k = s + int(np.argmin(head[s:e, 1] - hips[s:e, 1]))
        on_hands = hands_min[s:e].min() < 0.20
        ev.append((t(k), "inverted", ("hands on floor" if on_hands else "aerial") + f" {(e - s) / fps:.2f}s"))

    foot_h = np.maximum(la[:, 1], ra[:, 1]) - floor
    hi = (foot_h > 0.80 * stand) & upright
    kick_best = 0.0
    for s, e in _runs(hi, max(2, int(0.04 * fps))):
        k = s + int(np.argmax(foot_h[s:e]))
        side = "L" if la[k, 1] > ra[k, 1] else "R"
        kick_best = max(kick_best, float(foot_h[k]))
        ev.append((t(k), "kick", f"{side} foot {foot_h[k]:.2f}m ({foot_h[k] / stand:.1f}x hip)"))

    yaw = facing_yaw(G[:, ix["Hips"]])
    w = max(2, int(2.5 * fps))
    turns, k = 0, 0
    while k < F - 1:
        e = min(F - 1, k + w)
        seg = yaw[k:e + 1] - yaw[k]
        hit = np.flatnonzero(np.abs(seg) >= np.radians(330))
        if hit.size and upright[k:e + 1].mean() > 0.8:
            j = k + int(hit[0])
            ev.append((t((k + j) / 2), "turn", f"{'left' if seg[hit[0]] > 0 else 'right'} 360 in {(j - k) / fps:.2f}s"))
            turns += 1
            k = j
        else:
            k += max(1, int(0.1 * fps))
    low = (hips[:, 1] - floor) < 0.45 * stand
    low_time = 0.0
    for s, e in _runs(low, max(2, int(0.4 * fps))):
        low_time += (e - s) / fps
        lying = float(np.median(head[s:e, 1] - floor)) < 0.45
        ev.append((t(s), "low", f"{'lying' if lying else 'sit/kneel/crouch'} until {t(e)}s (hips min {float((hips[s:e, 1] - floor).min()):.2f}m)"))
    up = (lw[:, 1] > head_top[:, 1]) & (rw[:, 1] > head_top[:, 1]) & upright
    for s, e in _runs(up, max(2, int(0.25 * fps))):
        ev.append((t(s), "arms_up", f"until {t(e)}s"))
    sh_y = 0.5 * (ls[:, 1] + rs[:, 1])
    wide = ((np.linalg.norm(lw - rw, axis=1) > 0.88 * arm_span)
            & (np.abs(lw[:, 1] - sh_y) < 0.25) & (np.abs(rw[:, 1] - sh_y) < 0.25) & upright)
    for s, e in _runs(wide, max(2, int(0.25 * fps))):
        ev.append((t(s), "arms_wide", f"until {t(e)}s"))
    hyaw = np.arctan2(G[:, ix["Head"], 0, 2], G[:, ix["Head"], 2, 2])
    rel = np.degrees(np.angle(np.exp(1j * (hyaw - yaw))))
    for s, e in _runs((np.abs(rel) > 60) & upright, max(2, int(0.25 * fps))):
        k = s + int(np.argmax(np.abs(rel[s:e])))
        ev.append((t(k), "lookback", f"head {rel[k]:+.0f} deg vs hips, {(e - s) / fps:.2f}s"))
    ev.sort()

    # ---- quality -------------------------------------------------------------
    R, _ = clip.local()
    body = [ix[n] for n in BODY if n in ix]
    Rb = R[:, body]
    rel_R = np.einsum("fjba,fjbc->fjac", Rb[:-1], Rb[1:])
    ang = np.degrees(np.arccos(np.clip((np.trace(rel_R, axis1=-2, axis2=-1) - 1) / 2, -1, 1)))
    glitch_thresh = 6000.0 / fps                     # > 6000 deg/s in one frame is not human
    glitch_frames = int((ang.max(axis=1) > glitch_thresh).sum()) if F > 1 else 0
    # jitter: RMS of the part of the wrist/ankle acceleration that flips sign every frame
    ends = P[:, [ix["LeftHand"], ix["RightHand"], ix["LeftFoot"], ix["RightFoot"], ix["Head"]]]
    jitter_mm = 0.0
    if F > 4:
        d2 = ends[2:] - 2 * ends[1:-1] + ends[:-2]
        hf = 0.5 * (d2[1:] - d2[:-1])                # alternating component per frame
        jitter_mm = float(np.sqrt((hf ** 2).sum(-1).mean()) * 1000 * (fps / 120.0) ** 2)
    # frozen limbs: a hip/knee/shoulder/elbow whose rotation never changes was not captured
    frozen = [n for n in ("LeftUpLeg", "LeftLeg", "RightUpLeg", "RightLeg", "LeftArm", "LeftForeArm",
                          "RightArm", "RightForeArm")
              if n in ix and F > 10 and float(np.abs(R[:, ix[n]] - R[0, ix[n]]).max()) < 1e-6]
    vel = np.linalg.norm(np.diff(P[:, body], axis=0), axis=-1) * fps if F > 1 else np.zeros((1, 1))
    step = np.linalg.norm(np.diff(hips[:, [0, 2]], axis=0), axis=1) if F > 1 else np.zeros(1)
    wrist_speed = (np.linalg.norm(np.diff(np.stack([lw, rw], 1), axis=0), axis=-1) * fps).max() if F > 1 else 0.0
    return {
        "ok": True, "frames": F, "fps": round(fps, 2), "duration": round(F / fps, 2),
        "stand_hip": round(stand, 3), "skel_height": round(clip.height(), 3), "floor": round(floor, 3),
        "travel": round(float(step.sum()), 2),
        "net": round(float(np.linalg.norm(hips[-1, [0, 2]] - hips[0, [0, 2]])), 2),
        "speed_mean": round(float(step.sum() / max(F / fps, 1e-6)), 2),
        "energy": round(float(vel.mean()), 2),
        "total_turn_deg": round(float(np.degrees(np.abs(np.diff(yaw)).sum())), 0),
        "net_turn_deg": round(float(np.degrees(yaw[-1] - yaw[0])), 0),
        "hip_min": round(float((hips[:, 1] - floor).min()), 2),
        "hip_max": round(float((hips[:, 1] - floor).max()), 2),
        "jump_best": round(jump_best, 2), "kick_best": round(kick_best, 2),
        "low_time": round(low_time, 2), "n_turns": turns,
        "inverted_time": round(float(inverted.sum() / fps), 2),
        "wrist_speed_max": round(float(wrist_speed), 1),
        "glitch_frames": glitch_frames, "jitter_mm": round(jitter_mm, 2),
        "foot_below_floor": round(float(min(0.0, feet_min.min())), 3),
        "frozen_joints": frozen,
        "events": ev,
    }


def summarise_events(ev, limit=10):
    """Compact string: 'kick 3.2 5.1 | jump 7.5 | turn 9.0'."""
    by = {}
    for tt, kind, _ in ev:
        by.setdefault(kind, []).append(tt)
    out = []
    for kind in ("jump", "inverted", "kick", "turn", "low", "arms_up", "arms_wide", "lookback"):
        if kind in by:
            ts = by[kind]
            s = " ".join(f"{x:g}" for x in ts[:limit]) + (f" (+{len(ts) - limit})" if len(ts) > limit else "")
            out.append(f"{kind} {s}")
    return " | ".join(out)


if __name__ == "__main__":
    import os
    import sys
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))  # needed under python -I
    import bvh
    fps = float(sys.argv[2]) if len(sys.argv) > 2 else None
    m = analyse(bvh.load(sys.argv[1], fps=fps))
    for k, v in m.items():
        if k != "events":
            print(f"{k:18s} {v}")
    for e in m.get("events", []):
        print("  %7.2fs  %-9s %s" % e)
