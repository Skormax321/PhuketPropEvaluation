#!/usr/bin/env python3
"""Export slim listing JSON for the web benchmark calculator."""

from __future__ import annotations

import json
from collections import Counter
from pathlib import Path

import pandas as pd

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "web" / "public" / "data"

COLUMNS = ("district", "price_usd", "price_usd_sqm", "area_sqm", "bedrooms")


def load_segment(path: Path) -> list[dict]:
    df = pd.read_csv(path)
    for col in COLUMNS[1:]:
        df[col] = pd.to_numeric(df[col], errors="coerce")
    df = df.dropna(subset=["price_usd", "area_sqm", "bedrooms"])
    df = df[df["price_usd"] > 0]
    df = df[df["area_sqm"] > 0]
    if "price_usd_sqm" not in df.columns or df["price_usd_sqm"].isna().all():
        df["price_usd_sqm"] = (df["price_usd"] / df["area_sqm"]).round(0)
    else:
        df["price_usd_sqm"] = df["price_usd_sqm"].fillna(df["price_usd"] / df["area_sqm"]).round(0)
    records = []
    for _, row in df.iterrows():
        project_raw = row.get("project")
        project = str(project_raw).strip() if pd.notna(project_raw) else ""
        rec: dict = {
            "district": str(row["district"]),
            "price_usd": int(round(row["price_usd"])),
            "price_usd_sqm": int(round(row["price_usd_sqm"])),
            "area_sqm": float(row["area_sqm"]),
            "bedrooms": int(row["bedrooms"]),
        }
        if project:
            rec["project"] = project
        records.append(rec)
    return records


def district_meta(off_plan: list[dict], ready: list[dict]) -> list[dict]:
    counts: Counter[str] = Counter()
    for row in off_plan + ready:
        counts[row["district"]] += 1
    return [
        {"district": d, "count": c}
        for d, c in counts.most_common()
    ]


def projects_index(off_plan: list[dict], ready: list[dict]) -> list[dict]:
    counts: Counter[tuple[str, str, str]] = Counter()
    for segment, rows in (("off_plan", off_plan), ("ready", ready)):
        for row in rows:
            project = row.get("project")
            if project:
                counts[(segment, row["district"], project)] += 1
    return [
        {"segment": seg, "district": dist, "project": proj, "count": c}
        for (seg, dist, proj), c in sorted(counts.items(), key=lambda x: -x[1])
    ]


def main() -> None:
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    off_plan = load_segment(ROOT / "output" / "phuket_off_plan.csv")
    ready = load_segment(ROOT / "output" / "phuket_ready.csv")
    districts = district_meta(off_plan, ready)
    projects = projects_index(off_plan, ready)

    (OUT_DIR / "off_plan.json").write_text(
        json.dumps(off_plan, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    (OUT_DIR / "ready.json").write_text(
        json.dumps(ready, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    (OUT_DIR / "districts.json").write_text(
        json.dumps(districts, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    (OUT_DIR / "projects_index.json").write_text(
        json.dumps(projects, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    print(
        f"Wrote {len(off_plan)} off-plan, {len(ready)} ready, "
        f"{len(districts)} districts, {len(projects)} projects → {OUT_DIR}"
    )


if __name__ == "__main__":
    main()
