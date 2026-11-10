"""CMU mocap index, shortlist groups, per-clip metrics and CATALOG.md.

    python -I catalog.py index     # work_fable/mocap/cmu_index.csv  (every BVH: id, description, fps, duration)
    python -I catalog.py metrics   # work_fable/mocap/cmu_metrics.json (metrics.analyse for every clip; ~2 min)
    python -I catalog.py write     # work_fable/mocap/CATALOG.md + cmu_shortlist.csv

Sources merged for the index
- cgspeed (B. Hahne) text index shipped with the BVH conversion: id + description.
- A saved copy of mocap.cs.cmu.edu/search.php: the site's description and, importantly,
  the true capture frame rate (the BVH files all claim 120 fps; 326 trials are 60 fps).
- The BVH files themselves: frame count.
"""
from __future__ import annotations

import csv
import html
import json
import os
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))                    # needed under python -I
ROOT = HERE.parents[2]
MOCAP = ROOT / "work_fable" / "mocap"
DATA = MOCAP / "cmu_bvh_una" / "repo" / "data"
CG_INDEX = MOCAP / "cmu_bvh_una" / "repo" / "cmu-mocap-index-text.txt"
SITE = MOCAP / "site_pages" / "search.html"
INDEX_CSV = MOCAP / "cmu_index.csv"
METRICS_JSON = MOCAP / "cmu_metrics.json"

JUNK = re.compile(r"motorcycle|t-?pose|range ?of ?motion|calibration|lost marker|bad amc|dont match|no movie|"
                  r"^static pose|standing still|^\d+_\d+\.amc$", re.I)

# (group, subtag, regex on description, subjects or None, exclude-regex or None)
RULES = [
    # ---- (a) martial arts ------------------------------------------------------
    ("a", "karate kata", r"bassai|empi|heian", [135], None),
    ("a", "karate kick", r"front kick|mawashi|yokogeri", [135], None),
    ("a", "karate punch/block", r"gedanbarai|oiduki|syutouuke", [135], None),
    ("a", "kick/punch/block drill", r"kick|block|punch|lunge|spin_reach", [144], None),
    ("a", "tai chi", r"tai chi", None, None),
    ("a", "sword", r"sword", None, None),
    ("a", "boxing", r"\bboxing\b", None, None),
    ("a", "punch/strike", r"punch|strike|attack|guard pose|ready stance|chopping,|fists up", None, None),
    ("a", "kick", r"\bkick", None, r"soccer|kickflip|handstandkicks"),
    ("a", "weapon mime", r"bow and arrow|shooting a gun|pulling a gun|superhero", None, None),
    # ---- (b) acrobatics --------------------------------------------------------
    ("b", "cartwheel", r"cartwheel", None, None),
    ("b", "flip/handspring", r"flip|hand ?spring|summersult|somersault|handstand|stand on one hand|upside down", None, None),
    ("b", "breakdance", r"breakdance|helicopter|fancyfootwork|uprightsequence|sequnce|sequencegood|sequesnce|twistsfall|wide leg roll|monkey", [85, 90], None),
    ("b", "jump kick/spin", r"jump with kick|spin kick|jump kick|jumptwist|jump twist|jumping twist", None, None),
    ("b", "spin/twirl", r"spin|twirl|whirl|pirouette|whip", None, r"spin_reach"),
    ("b", "jump turn", r"jump ?turn|hop turn|hop and turn|\b(90|180|270|360)\b", [75, 83, 91, 105], None),
    ("b", "jump/leap/hop", r"\bjump|leap|\bhop|hopscotch|jete", None, r"jumping jacks"),
    ("b", "roll/dive/fall", r"\broll|dive|fall\b|slip|stumble", None, r"rosie|rosey"),
    ("b", "balance", r"balanc|ball mount|ball walk|balance beam", None, None),
    ("b", "acrobatics misc", r".", [87, 88, 89], None),
    # ---- (c) dance -------------------------------------------------------------
    ("c", "modern/ballet", r"dance|arabesque|pirouette|jete", [5, 49], None),
    ("c", "salsa (partnered)", r"salsa", None, None),
    ("c", "charleston/lindy", r"charleston|lindy", None, None),
    ("c", "indian dance", r".", [94], None),
    ("c", "MJ-styled", r".", [131], None),
    ("c", "dance misc", r"danc|moonwalk|macarena|lambada|the twist|dance, twist|curtsey", None, r"salsa|charleston"),
    ("c", "yoga", r"yoga|sun salutation", None, None),
    # ---- (d) locomotion + acting -----------------------------------------------
    ("d", "run/jog", r"\brun|jog|sprint", None, None),
    ("d", "walk", r"walk|stride|march|pacing|wander|navigate|sneak|creep|limp|\bstep|forward$|figure8|digital8|turn\b|mummy8", None, None),
    ("d", "walk", r".", [107, 108, 122, 106], None),
    ("d", "sidestep", r"side ?step|sideway|side to side|sidetoside", None, None),
    ("d", "turn/pivot", r"turn|figure ?8|figure eight|digital ?8|pivot|zigzag|veer|circle", None, r"jump|hop"),
    ("d", "look around/back", r"look|peep|search|peek", None, None),
    ("d", "sit", r"\bsit|stool|chair", None, r"picks up high stool|pounds high stool|hands on high stool"),
    ("d", "ground: lie/get up/crawl/kneel", r"\blay|laying|\blie\b|get(ting)? ?up|crawl|kneel|on ground|squat|crouch|roll over", None, None),
    ("d", "reach/pick up/bend", r"reach|pick(ing)? ?(box )?up|bend|scoop|\blift", None, None),
    ("d", "throw/catch", r"throw|toss|pitch|catch|frisbee|football", None, None),
    ("d", "wave/signal", r"wave|waving|hello|direct traffic|signal|high.?five|low.?five", None, None),
    ("d", "bow/curtsey", r"\bbow\b|curtsey", None, None),
    ("d", "carry/push/pull", r"carry|suitcase|drag|push|pull|\d lbs?\b|heavy", None, r"pull ?over|push ?ups|pulling a (gun|nail)"),
    ("d", "point/direct", r"point|giving directions|teaching", None, None),
    ("d", "write/draw/paint", r"writ|chalkboard|paint|draw", None, None),
    ("d", "instrument", r"violin|piano|drum|guitar|conduct", None, None),
    ("d", "typing/phone", r"typing|laptop|palm pilot|dialing", None, None),
    # ---- (e) emotional ---------------------------------------------------------
    ("e", "comfort/shelter/touch", r"comfort|shelter|hold hands|holding a baby|shoulder rub|pulls up|link arms", None, None),
    ("e", "emotion acted", r"happy|\bsad|cry|scared|upset|laugh|\bcold\b|freezing|mope|depress|\bshy|\bjoy|elated|anger|angry|quarrel|arguing|frustrat", None, None),
    ("e", "arms wide/outstretched", r"arms out|outstretched|airplane|arms held high|arching arms|expressive arms|pterosaur|bird|hummingbird", None, None),
    ("e", "folding in / stillness", r"fold|curl inwards|static dance pose|thinker|wait|idle|standing$", None, None),
    ("e", "gesture", r"shrug|peek|yawn|cast spell|conduct|genie|ghost|story|conversation|shake hands|shaking hands|hand ?shake|bow\b|curtsey|wave hello", None, None),
    ("e", "styled walk", r"graceful|lavish|sexy|zombie|mummy|drunk|hurt|wounded|stealth|jaunt|childish|elderly|relaxed|rushed|cool|macho|clumsy|singing in the rain", None, None),
]
RULES = [(g, t, re.compile(rx, re.I), s, re.compile(x, re.I) if x else None) for g, t, rx, s, x in RULES]
GROUP_NAMES = {"a": "martial arts", "b": "acrobatics", "c": "dance", "d": "locomotion + acting", "e": "emotional"}


def classify(row):
    """-> list of (group, subtag) for a row of the index (may be empty)."""
    desc = row["description"]
    if JUNK.search(desc):
        return []
    subj, out, seen = int(row["subject"]), [], set()
    for g, tag, rx, subs, ex in RULES:
        if subs is not None and subj not in subs:
            continue
        if not rx.search(desc) or (ex and ex.search(desc)):
            continue
        if (g, tag) not in seen:
            seen.add((g, tag)); out.append((g, tag))
    return out


# ---------------------------------------------------------------------------------
def _bvh_frames(path):
    with open(path, "rb") as f:
        head = f.read(16384).decode("ascii", "replace")
    m = re.search(r"Frames:\s*(\d+)\s*Frame Time:\s*([0-9.eE+-]+)", head)
    return (int(m.group(1)), float(m.group(2))) if m else (0, 0.0)


def build_index():
    cg, titles = {}, {}
    cur = None
    for line in open(CG_INDEX, errors="replace"):
        line = line.rstrip()
        m = re.match(r"Subject #(\d+)\s*\((.*)\)\s*$", line)
        if m:
            cur = int(m.group(1)); titles[cur] = m.group(2).strip(); continue
        m = re.match(r"(\d+)_(\d+)\s+(.*)", line)
        if m and cur is not None:
            cg[(int(m.group(1)), int(m.group(2)))] = re.sub(r"\s+", " ", m.group(3)).strip()
    site = {}
    if SITE.exists():
        t = open(SITE, errors="replace").read()
        for s in re.split(r"Subject #", t)[1:]:
            m = re.match(r"(\d+)\s*\((.*?)\)\s*<A", s, flags=re.S)
            if not m:
                continue
            sid = int(m.group(1)); titles.setdefault(sid, html.unescape(m.group(2)).strip())
            for r in re.finditer(r"<TR[^>]*><TD></TD><TD>(\d+)</TD><TD>(.*?)</TD>.*?<TD>(\d*)</TD><TD><A HREF=\"badtrial", s, flags=re.S):
                site[(sid, int(r.group(1)))] = (re.sub(r"\s+", " ", html.unescape(r.group(2))).strip(), r.group(3))
    rows = []
    files = {}
    for p in sorted(DATA.glob("*/*.bvh")):
        m = re.match(r"(\d+)_(\d+)\.bvh$", p.name)
        if m:
            files[(int(m.group(1)), int(m.group(2)))] = p
    for key in sorted(set(cg) | set(site) | set(files)):
        sdesc, sfps = site.get(key, ("", ""))
        desc = cg.get(key, "")
        if not desc or desc.lower() == "unknown":
            desc = sdesc or (f"({titles.get(key[0], '')})" if titles.get(key[0]) else "Unknown")
        if desc.lower() in ("unknown", "clean", "cleaned") and titles.get(key[0]):
            desc = f"{desc} ({titles[key[0]]})"
        p = files.get(key)
        frames, ft = _bvh_frames(p) if p else (0, 0.0)
        frames = max(frames - 1, 0)                 # minus the cgspeed T-pose frame
        fps = int(sfps) if sfps else 120
        rows.append({
            "id": f"{key[0]:02d}_{key[1]:02d}", "subject": key[0], "trial": key[1],
            "subject_title": titles.get(key[0], ""), "description": desc, "site_description": sdesc,
            "fps": fps, "fps_source": "cmu site" if sfps else "assumed (not listed on site)",
            "frames": frames, "duration_s": round(frames / fps, 2) if frames else "",
            "path": str(p) if p else "",
        })
    with open(INDEX_CSV, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows[0].keys()))
        w.writeheader(); w.writerows(rows)
    have = sum(1 for r in rows if r["path"])
    print(f"{INDEX_CSV}: {len(rows)} trials, {have} with BVH, {sum(1 for r in rows if r['fps'] == 60)} at 60 fps, "
          f"{len(set(r['subject'] for r in rows))} subjects")


def read_index(path=None):
    with open(path or INDEX_CSV, newline="") as f:
        return {r["id"]: r for r in csv.DictReader(f)}


def load_cmu(clip_id, index=None, **kw):
    """bvh.Clip for a CMU id such as '135_07', with the true frame rate."""
    import bvh
    row = (index or read_index())[clip_id]
    return bvh.load(row["path"], fps=float(row["fps"]), **kw)


def _one(row):
    import bvh
    import metrics
    try:
        m = metrics.analyse(bvh.load(row["path"], fps=float(row["fps"])))
    except Exception as e:                           # noqa: BLE001 - a broken file must not stop the scan
        m = {"ok": False, "why": f"{type(e).__name__}: {e}"}
    return row["id"], m


def run_metrics():
    from multiprocessing import Pool
    rows = [r for r in read_index().values() if r["path"]]
    with Pool(min(16, os.cpu_count() or 4)) as pool:
        out = dict(pool.imap_unordered(_one, rows, chunksize=8))
    with open(METRICS_JSON, "w") as f:
        json.dump(out, f)
    bad = [k for k, v in out.items() if not v.get("ok")]
    print(f"{METRICS_JSON}: {len(out)} clips, {len(bad)} failed {bad[:10]}")


def quality(m):
    if not m or not m.get("ok"):
        return "?"
    g, j = m["glitch_frames"], m["jitter_mm"]
    if m.get("frozen_joints"):
        return "frozen:" + "+".join(m["frozen_joints"])
    if g > 0.02 * m["frames"] or j > 12:
        return "bad"
    if g > 3 or j > 5:
        return "check"
    return "clean"


SOURCES_MD = """
## Sources and licences (checked 2026-11-09/10)

Usable in a published / commercial video:
- CMU Graphics Lab Motion Capture Database, http://mocap.cs.cmu.edu/ - home page: "This dataset of motions is free for
  all uses." and "You may include this data in commercially-sold products, but you may not resell this data directly,
  even in converted form."; FAQ: "The motion capture data may be copied, modified, or redistributed without permission."
  Requested credit: "The data used in this project was obtained from mocap.cs.cmu.edu. The database was created with
  funding from NSF EIA-0196217." BVH conversion by B. Hahne (cgspeed), READMEFIRST.txt: "I (Bruce) place no additional
  restrictions on the use of this particular BVH conversion."
- ACCAD / The Ohio State University Open Motion Project, https://accad.osu.edu/research/motion-lab/mocap-system-and-data -
  "Open Motion Project by ACCAD/The Ohio State University is licensed under a Creative Commons Attribution 3.0 Unported
  License." Attribution required.
- 100STYLE (not downloaded; stylised locomotion only), https://www.ianxmason.com/100style/ - CC BY 4.0, credit required.
- Truebones free pack, Rokoko free pack, Mixamo: royalty-free for commercial video per their pages (sign-up needed; not
  downloaded; Mixamo's official FAQ could not be fetched, wording taken from an Adobe community FAQ post).

NOT usable (non-commercial / research only): SFU Motion Capture Database (includes its wushu kicks), Motorica Dance
Dataset, AIST++ / AIST Dance DB, Bandai-Namco-Research-Motiondataset (CC BY-NC 4.0), Ubisoft LAFAN1 (CC BY-NC-ND 4.0),
AMASS, Human3.6M, Motion-X, HKMALA-Motion (Hong Kong kung fu archive). Unclear, treat as no: HDM05 (CC BY-SA 3.0
reported, page not fetchable), UMONS-TAICHI (conflicting CC BY-NC-SA / CC BY statements), MADS, KIT, KungFuAthleteBot.
"""


def _accad_section():
    import bvh
    L = ["## ACCAD (Ohio State) BVH sets - CC BY 3.0\n",
         "Units are centimetres: load with `bvh.load(path, scale=0.01, drop_tpose=False)`. Most BVH files are 30 fps "
         "(the C3D originals on the ACCAD page are 120 Hz). Joint names are a subset of the CMU names. "
         "Male2 is the martial-arts performer (Form_1, Extended_1-3, D* ready/bow/victory, E* punches/blocks/dodges, "
         "G* kicks); Female1 has runs, turns, crouch/lie, skipping, a cartwheel. A few filmstrips: `previews_accad/`.\n",
         "| set | clip | dur s | fps | path |", "|---|---|---|---|---|"]
    for d in sorted(MOCAP.glob("accad_*_bvh")):
        for p in sorted(d.rglob("*.bvh")):
            try:
                c = bvh.load(str(p), scale=0.01, drop_tpose=False)
                L.append(f"| {d.name[6:-4]} | {p.stem} | {c.duration:.2f} | {c.fps:g} | `{p.relative_to(ROOT)}` |")
            except Exception as e:                   # noqa: BLE001
                L.append(f"| {d.name[6:-4]} | {p.stem} | ? | ? | unreadable: {type(e).__name__} |")
    L.append("")
    return L if len(L) > 5 else []


def write_catalog():
    import metrics
    index = read_index()
    mets = json.load(open(METRICS_JSON)) if METRICS_JSON.exists() else {}
    picks_path = MOCAP / "picks.json"
    picks = json.load(open(picks_path)) if picks_path.exists() else {}
    short = []
    for cid, r in index.items():
        tags = classify(r)
        if tags and r["path"]:
            short.append((cid, r, tags))
    groups = {g: [] for g in GROUP_NAMES}
    for cid, r, tags in short:
        for g in sorted(set(t[0] for t in tags)):
            groups[g].append((cid, r, ", ".join(t[1] for t in tags if t[0] == g)))

    L = []
    L.append("# CMU mocap shortlist for the merge video\n")
    L.append("Generated by `fable/tools/mocap/catalog.py write` - do not edit by hand "
             "(hand notes live in `work_fable/mocap/picks.json`).\n")
    L.append(f"- Data: `{DATA.relative_to(ROOT)}/<subject 3 digits>/<id>.bvh` (cgspeed / B. Hahne BVH conversion of the "
             "CMU Graphics Lab Motion Capture Database, via github.com/una-dinosauria/cmu-mocap).")
    L.append(f"- Full index of all {len(index)} trials: `{INDEX_CSV.relative_to(ROOT)}`; "
             f"per-clip metrics and beat times: `{METRICS_JSON.relative_to(ROOT)}`.")
    L.append("- `dur s` uses the TRUE capture rate in the `fps` column (from the CMU site). Every BVH file says 120 fps; "
             "for the 60 fps trials that is wrong, so pass fps=60 (catalog.load_cmu does).")
    L.append("- `q`: automatic data-quality flag from joint-rotation discontinuities and frame-to-frame jitter "
             "(clean / check / bad). It says nothing about whether the motion is interesting.")
    L.append("- `beats`: automatically detected times in seconds (see `fable/tools/mocap/metrics.py`): jump, inverted "
             "(head below hips), kick (ankle above 0.8 x hip height), turn (360 on the spot), low (sit/kneel/lie), "
             "arms_up, arms_wide, lookback.")
    L.append("- `q` = `frozen:<joints>` means those joints never rotate in the file (not captured); e.g. the right leg in "
             "much of subject 79. Use the rest of the body only.")
    L.append("- Duplicate subjects (identical data under two numbers): 117 = 85, 121 = 90, 105 = 91, 103 = 93, 102 = 78. "
             "Subjects 73 and 84 have no descriptions anywhere.")
    L.append("- Lengths: BVH units x 0.056444 = metres (CMU's own factor; free-fall in the data gives g = 9.4-10 m/s^2). "
             "`stand_hip` in the metrics file is each performer's standing hip height for retargeting by leg length.")
    L.append("- Two-person trials (subjects 18-23, 33-34, 60-61 partner work) are one performer of a pair.\n")
    L.append(f"Shortlisted: {len(short)} of {sum(1 for r in index.values() if r['path'])} clips; "
             + ", ".join(f"({g}) {GROUP_NAMES[g]} {len(v)}" for g, v in groups.items()) + ".\n")

    if picks:
        L.append("## Looked at (filmstrips in `previews/`)\n")
        L.append("| id | verdict | what happens | dur s | fps |")
        L.append("|---|---|---|---|---|")
        for cid, p in picks.items():
            r = index.get(cid, {})
            L.append(f"| {cid} | {p.get('verdict', '')} | {p.get('note', '')} | {r.get('duration_s', '')} | {r.get('fps', '')} |")
        L.append("")

    rows_csv = []
    for g, name in GROUP_NAMES.items():
        L.append(f"## ({g}) {name} - {len(groups[g])} clips\n")
        L.append("| id | sub-group | description | dur s | fps | travel m | q | beats |")
        L.append("|---|---|---|---|---|---|---|---|")
        for cid, r, tag in sorted(groups[g], key=lambda x: (x[2].split(",")[0], int(x[1]["subject"]), int(x[1]["trial"]))):
            m = mets.get(cid, {})
            beats = metrics.summarise_events(m.get("events", []), limit=8) if m.get("ok") else ""
            desc = r["description"].replace("|", "/")
            L.append(f"| {cid} | {tag} | {desc} | {r['duration_s']} | {r['fps']} | {m.get('travel', '')} | {quality(m)} | {beats} |")
            rows_csv.append({"group": g, "group_name": name, "subgroup": tag, "id": cid, "subject": r["subject"],
                             "trial": r["trial"], "description": r["description"], "duration_s": r["duration_s"],
                             "fps": r["fps"], "frames": r["frames"], "travel_m": m.get("travel", ""),
                             "quality": quality(m), "glitch_frames": m.get("glitch_frames", ""),
                             "jitter_mm": m.get("jitter_mm", ""), "beats": beats, "path": r["path"]})
        L.append("")
    L += _accad_section()
    L += SOURCES_MD.strip("\n").split("\n")
    out = MOCAP / "CATALOG.md"
    out.write_text("\n".join(L) + "\n")
    with open(MOCAP / "cmu_shortlist.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(rows_csv[0].keys()))
        w.writeheader(); w.writerows(rows_csv)
    print(f"{out}: {len(short)} clips shortlisted;", {g: len(v) for g, v in groups.items()})


if __name__ == "__main__":
    cmd = sys.argv[1] if len(sys.argv) > 1 else ""
    {"index": build_index, "metrics": run_metrics, "write": write_catalog}.get(cmd, lambda: print(__doc__))()
