#!/usr/bin/env python3
"""Write work/picks.json: shot -> prepped plate dir (/work/plates/<take>). Manual overrides in docs/picks_manual.json win;
otherwise the first prepped take (t1 before t2) is used. Also records s0 per shot from the spec notes."""
import glob, json, os
ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
man = json.load(open(os.path.join(ROOT, "docs/picks_manual.json"))) if os.path.exists(os.path.join(ROOT, "docs/picks_manual.json")) else {}
out = {}
for d in sorted(glob.glob(os.path.join(ROOT, "work/plates/*/meta.json"))):
    base = os.path.basename(os.path.dirname(d)); tag = base.rsplit("_", 1)[0]
    if "_t" not in tag or base.startswith("still_"): continue
    shot = tag.rsplit("_t", 1)[0]
    sp = json.load(open(os.path.join(ROOT, "media/gen/specs", tag + ".json"))) if os.path.exists(os.path.join(ROOT, "media/gen/specs", tag + ".json")) else {}
    nt = json.loads(sp.get("notes") or "{}"); s0 = nt.get("s0")
    sj = os.path.join(ROOT, "work/takes", base + ".sync.json")
    corr = (json.load(open(sj)).get("corr") or 0) if os.path.exists(sj) else 0
    v2 = nt.get("timing") == "v2"
    if shot not in out or (v2 and out[shot].get("timing") != "v2") or ((v2 or out[shot].get("timing") != "v2") and corr > out[shot].get("_corr", 0) + .05):
        out[shot] = {"plate": f"/work/plates/{base}", "s0": s0, "take": base, "_corr": corr, "timing": nt.get("timing", "v1")}
for shot, base in man.items():
    if isinstance(base, dict): out[shot] = {**out.get(shot, {}), **base}
    else:
        tag = base.rsplit("_", 1)[0]
        sp = json.load(open(os.path.join(ROOT, "media/gen/specs", tag + ".json")))
        nt = json.loads(sp.get("notes") or "{}")
        out[shot] = {"plate": f"/work/plates/{base}", "s0": nt.get("s0"), "take": base, "timing": nt.get("timing", "v1")}
# lag: clip time = song time - S0 + lag  ->  effective s0 = S0 - lag. Source: docs/lags.json {take: lag} (chosen) else measured sync.json
lags = json.load(open(os.path.join(ROOT, "docs/lags.json"))) if os.path.exists(os.path.join(ROOT, "docs/lags.json")) else {}
for shot, v in out.items():
    tk = v.get("take", "")
    sj = os.path.join(ROOT, "work/takes", tk + ".sync.json")
    lag = lags.get(tk)
    if lag is None and os.path.exists(sj):
        m = json.load(open(sj)); lag = m.get("best_lag_s") if (m.get("corr") or 0) > .3 and abs(m.get("best_lag_s") or 9) < .8 else 0
    v["lag"] = lag or 0
    if v.get("s0") is not None: v["s0"] = round(v["s0"] - v["lag"], 4)
import importlib.util
spec = importlib.util.spec_from_file_location("batch", os.path.join(ROOT, "tools/sd/batch.py")); bm = importlib.util.module_from_spec(spec); spec.loader.exec_module(bm)
for shot, sd in bm.SHOTS.items():
    if shot not in out:
        pid = os.path.splitext(sd["plate"])[0]
        out[shot] = {"plate": f"/work/plates/still_{pid}", "s0": sd["audio"][1] if sd.get("audio") else None, "take": f"still_{pid}"}
json.dump(out, open(os.path.join(ROOT, "work/picks.json"), "w"), indent=1)
print(json.dumps(out, indent=1))
