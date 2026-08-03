#!/usr/bin/env python3
"""Export slim listing JSON for the web benchmark calculator."""

from __future__ import annotations

import csv
import json
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "data"


def _to_float(value: str | None) -> float | None:
    if value is None:
        return None
    text = str(value).strip()
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def load_segment(path: Path) -> list[dict]:
    records: list[dict] = []
    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            price = _to_float(row.get("price_usd"))
            area = _to_float(row.get("area_sqm"))
            bedrooms = _to_float(row.get("bedrooms"))
            if price is None or area is None or bedrooms is None:
                continue
            if price <= 0 or area <= 0:
                continue

            price_sqm = _to_float(row.get("price_usd_sqm"))
            if price_sqm is None:
                price_sqm = price / area

            project = (row.get("project") or "").strip()
            rec: dict = {
                "district": str(row.get("district") or ""),
                "price_usd": int(round(price)),
                "price_usd_sqm": int(round(price_sqm)),
                "area_sqm": float(area),
                "bedrooms": int(bedrooms),
            }
            if project:
                rec["project"] = project
            records.append(rec)
    return records


def district_meta(off_plan: list[dict], ready: list[dict]) -> list[dict]:
    counts: Counter[str] = Counter()
    for row in off_plan + ready:
        counts[row["district"]] += 1
    return [{"district": d, "count": c} for d, c in counts.most_common()]


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
