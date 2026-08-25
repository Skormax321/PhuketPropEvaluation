#!/usr/bin/env python3
"""Clean FazWaz WebScraper CSVs into output/{market}_{off_plan,ready}.csv."""

from __future__ import annotations

import argparse
import csv
import os
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PARENT = ROOT.parent
OUT_DIR = ROOT / "output"

FX_RATE = 32.41
AREA_MIN = 20.0
AREA_MAX = 900.0
BEDROOMS_MAX = 4
THB_SQM_MIN = 20_000.0
THB_SQM_MAX = 500_000.0
ALLOWED_TYPES = frozenset({"Condo", "Apartment", "Penthouse"})
BARE_DISTRICTS = frozenset({"Pattaya", "Phuket"})
BAD_PROJECTS = frozenset({"", "not-set", "n/a", "-"})

MARKETS = ("phuket", "pattaya")

DEFAULT_RAW: dict[str, dict[str, list[Path]]] = {
    "phuket": {
        "off_plan": [PARENT / "Off-plan July 2026.csv"],
        "ready": [PARENT / "Ready July 2026.csv"],
    },
    "pattaya": {
        "off_plan": [
            PARENT / "Pattaya-offplan-1.csv",
            PARENT / "Pattaya-offplan-2.csv",
        ],
        "ready": [PARENT / "Pattaya-ready.csv"],
    },
}

OUT_COLUMNS = (
    "district",
    "price_usd",
    "price_usd_sqm",
    "area_sqm",
    "bedrooms",
    "project",
)

PRICE_RE = re.compile(r"฿\s*([\d,]+(?:\.\d+)?)")
SQM_PRICE_RE = re.compile(r"฿\s*([\d,]+(?:\.\d+)?)\s*/\s*SqM", re.I)
AREA_RE = re.compile(r"([\d,]+(?:\.\d+)?)\s*SqM", re.I)
BEDROOM_RE = re.compile(r"(?i)(\d+)\s*Bedroom")
STUDIO_RE = re.compile(r"(?i)\bstudio\b")
TYPE_RE = re.compile(
    r"(?i)(?:Studio|\d+\s*Bedroom[s]?)?\s*"
    r"(Condo|Apartment|Penthouse|House|Villa|Townhouse|Land|Hotel)\b"
)
UNIT_ID_RE = re.compile(r"-u(\d+)(?:\?|$)")


def parse_thb(text: str | None) -> float | None:
    if not text:
        return None
    m = PRICE_RE.search(text)
    return float(m.group(1).replace(",", "")) if m else None


def parse_thb_sqm(text: str | None) -> float | None:
    if not text:
        return None
    m = SQM_PRICE_RE.search(text)
    return float(m.group(1).replace(",", "")) if m else None


def parse_area(text: str | None) -> float | None:
    if not text:
        return None
    m = AREA_RE.search(text)
    return float(m.group(1).replace(",", "")) if m else None


def parse_bedrooms(title: str | None) -> int | None:
    if not title:
        return None
    if STUDIO_RE.search(title):
        return 0
    m = BEDROOM_RE.search(title)
    return int(m.group(1)) if m else None


def parse_prop_type(title: str | None) -> str | None:
    if not title:
        return None
    m = TYPE_RE.search(title)
    return m.group(1).title() if m else None


def parse_unit_id(row: dict[str, str]) -> str | None:
    href = row.get("unit-info__description-title href") or ""
    m = UNIT_ID_RE.search(href)
    return m.group(1) if m else None


def clean_row(row: dict[str, str]) -> tuple[dict | None, str | None]:
    """Return (record, drop_reason). drop_reason is None if kept."""
    district = (row.get("location-unit") or "").strip()
    project = (row.get("unit-name") or "").strip()
    title = row.get("unit-info__description-title") or ""

    thb = parse_thb(row.get("price-tag"))
    thb_sqm = parse_thb_sqm(row.get("dynamic-tooltip"))
    area = parse_area(row.get("dynamic-tooltip 2"))
    bedrooms = parse_bedrooms(title)
    prop_type = parse_prop_type(title)

    if not district or thb is None or area is None or bedrooms is None:
        return None, "parse"
    if thb_sqm is None:
        thb_sqm = thb / area if area > 0 else None
    if thb_sqm is None:
        return None, "parse"

    if area < AREA_MIN or area > AREA_MAX:
        return None, "area"
    if bedrooms < 0 or bedrooms > BEDROOMS_MAX:
        return None, "bedrooms"
    if thb_sqm < THB_SQM_MIN or thb_sqm > THB_SQM_MAX:
        return None, "thb_sqm"
    if project.lower() in BAD_PROJECTS:
        return None, "project"
    if district in BARE_DISTRICTS:
        return None, "district"
    if prop_type not in ALLOWED_TYPES:
        return None, "type"

    price_usd = int(round(thb / FX_RATE))
    price_usd_sqm = int(round(thb_sqm / FX_RATE))
    if price_usd <= 0:
        return None, "price"

    return {
        "district": district,
        "price_usd": price_usd,
        "price_usd_sqm": price_usd_sqm,
        "area_sqm": area,
        "bedrooms": bedrooms,
        "project": project,
        "_unit_id": parse_unit_id(row),
    }, None


def load_raw_rows(paths: list[Path]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for path in paths:
        if not path.is_file():
            raise FileNotFoundError(f"Raw CSV not found: {path}")
        with path.open(newline="", encoding="utf-8") as f:
            rows.extend(csv.DictReader(f))
    return rows


def clean_segment(paths: list[Path]) -> tuple[list[dict], dict[str, int]]:
    stats = {
        "raw": 0,
        "kept": 0,
        "drop_parse": 0,
        "drop_area": 0,
        "drop_bedrooms": 0,
        "drop_thb_sqm": 0,
        "drop_project": 0,
        "drop_district": 0,
        "drop_type": 0,
        "drop_price": 0,
        "drop_dup_href": 0,
    }
    kept: list[dict] = []
    seen_ids: set[str] = set()

    for row in load_raw_rows(paths):
        stats["raw"] += 1
        unit_id = parse_unit_id(row)
        if unit_id and unit_id in seen_ids:
            stats["drop_dup_href"] += 1
            continue

        rec, reason = clean_row(row)
        if reason:
            stats[f"drop_{reason}"] = stats.get(f"drop_{reason}", 0) + 1
            continue
        assert rec is not None
        if unit_id:
            seen_ids.add(unit_id)
        # strip internal field before output
        out = {k: v for k, v in rec.items() if not k.startswith("_")}
        kept.append(out)
        stats["kept"] += 1

    return kept, stats


def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUT_COLUMNS, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            writer.writerow({col: row.get(col, "") for col in OUT_COLUMNS})


def print_stats(label: str, stats: dict[str, int], paths: list[Path]) -> None:
    drops = ", ".join(
        f"{k}={stats[k]}"
        for k in (
            "drop_parse",
            "drop_area",
            "drop_bedrooms",
            "drop_thb_sqm",
            "drop_project",
            "drop_district",
            "drop_type",
            "drop_dup_href",
        )
        if stats.get(k)
    )
    src = " + ".join(str(p.name) for p in paths)
    print(f"{label}: kept {stats['kept']}/{stats['raw']}" + (f" ({drops})" if drops else "") + f" ← {src}")


def clean_market(market: str) -> None:
    cfg = DEFAULT_RAW[market]
    off_paths = [Path(p) for p in os.environ.get(f"RAW_{market.upper()}_OFF", "").split(os.pathsep) if p] or cfg["off_plan"]
    ready_paths = [Path(p) for p in os.environ.get(f"RAW_{market.upper()}_READY", "").split(os.pathsep) if p] or cfg["ready"]

    # Support single-file env overrides used previously
    if market == "phuket":
        if os.environ.get("RAW_OFF"):
            off_paths = [Path(os.environ["RAW_OFF"])]
        if os.environ.get("RAW_READY"):
            ready_paths = [Path(os.environ["RAW_READY"])]

    off_rows, off_stats = clean_segment(off_paths)
    ready_rows, ready_stats = clean_segment(ready_paths)

    write_csv(OUT_DIR / f"{market}_off_plan.csv", off_rows)
    write_csv(OUT_DIR / f"{market}_ready.csv", ready_rows)

    print_stats(f"{market} off_plan", off_stats, off_paths)
    print_stats(f"{market} ready", ready_stats, ready_paths)
    print(f"Wrote → {OUT_DIR}/{market}_off_plan.csv, {market}_ready.csv (FX={FX_RATE})")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--market",
        choices=[*MARKETS, "all"],
        default=os.environ.get("MARKET", "all"),
        help="Market to clean (default: all)",
    )
    args = parser.parse_args()
    markets = MARKETS if args.market == "all" else (args.market,)
    for market in markets:
        clean_market(market)


if __name__ == "__main__":
    try:
        main()
    except FileNotFoundError as e:
        print(e, file=sys.stderr)
        sys.exit(1)
