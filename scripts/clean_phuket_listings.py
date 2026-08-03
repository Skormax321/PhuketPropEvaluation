#!/usr/bin/env python3
"""Clean FazWaz WebScraper CSVs into output/phuket_{off_plan,ready}.csv."""

from __future__ import annotations

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

DEFAULT_RAW_OFF = PARENT / "Off-plan July 2026.csv"
DEFAULT_RAW_READY = PARENT / "Ready July 2026.csv"

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


def parse_thb(text: str | None) -> float | None:
    if not text:
        return None
    m = PRICE_RE.search(text)
    if not m:
        return None
    return float(m.group(1).replace(",", ""))


def parse_thb_sqm(text: str | None) -> float | None:
    if not text:
        return None
    m = SQM_PRICE_RE.search(text)
    if not m:
        return None
    return float(m.group(1).replace(",", ""))


def parse_area(text: str | None) -> float | None:
    if not text:
        return None
    m = AREA_RE.search(text)
    if not m:
        return None
    return float(m.group(1).replace(",", ""))


def parse_bedrooms(title: str | None) -> int | None:
    if not title:
        return None
    if STUDIO_RE.search(title):
        return 0
    m = BEDROOM_RE.search(title)
    if not m:
        return None
    return int(m.group(1))


def clean_row(row: dict[str, str]) -> dict | None:
    district = (row.get("location-unit") or "").strip()
    project = (row.get("unit-name") or "").strip()
    title = row.get("unit-info__description-title") or ""

    thb = parse_thb(row.get("price-tag"))
    thb_sqm = parse_thb_sqm(row.get("dynamic-tooltip"))
    area = parse_area(row.get("dynamic-tooltip 2"))
    bedrooms = parse_bedrooms(title)

    if not district or thb is None or area is None or bedrooms is None:
        return None
    if thb_sqm is None:
        thb_sqm = thb / area if area > 0 else None
    if thb_sqm is None:
        return None

    price_usd = int(round(thb / FX_RATE))
    price_usd_sqm = int(round(thb_sqm / FX_RATE))

    if price_usd <= 0 or area <= 0 or bedrooms < 0:
        return None
    if area < AREA_MIN or area > AREA_MAX:
        return None

    rec: dict = {
        "district": district,
        "price_usd": price_usd,
        "price_usd_sqm": price_usd_sqm,
        "area_sqm": area,
        "bedrooms": bedrooms,
    }
    if project:
        rec["project"] = project
    return rec


def load_and_clean(path: Path) -> tuple[list[dict], dict[str, int]]:
    if not path.is_file():
        raise FileNotFoundError(f"Raw CSV not found: {path}")

    kept: list[dict] = []
    stats = {
        "raw": 0,
        "kept": 0,
        "drop_parse": 0,
        "drop_area": 0,
        "drop_other": 0,
    }

    with path.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            stats["raw"] += 1
            district = (row.get("location-unit") or "").strip()
            thb = parse_thb(row.get("price-tag"))
            area = parse_area(row.get("dynamic-tooltip 2"))
            bedrooms = parse_bedrooms(row.get("unit-info__description-title"))

            if not district or thb is None or area is None or bedrooms is None:
                stats["drop_parse"] += 1
                continue
            if area < AREA_MIN or area > AREA_MAX:
                stats["drop_area"] += 1
                continue

            rec = clean_row(row)
            if rec is None:
                stats["drop_other"] += 1
                continue
            kept.append(rec)
            stats["kept"] += 1

    return kept, stats


def write_csv(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=OUT_COLUMNS, extrasaction="ignore")
        writer.writeheader()
        for row in rows:
            out = {col: row.get(col, "") for col in OUT_COLUMNS}
            writer.writerow(out)


def main() -> None:
    raw_off = Path(os.environ.get("RAW_OFF", DEFAULT_RAW_OFF))
    raw_ready = Path(os.environ.get("RAW_READY", DEFAULT_RAW_READY))

    off_rows, off_stats = load_and_clean(raw_off)
    ready_rows, ready_stats = load_and_clean(raw_ready)

    write_csv(OUT_DIR / "phuket_off_plan.csv", off_rows)
    write_csv(OUT_DIR / "phuket_ready.csv", ready_rows)

    print(
        f"off_plan: kept {off_stats['kept']}/{off_stats['raw']} "
        f"(drop_parse={off_stats['drop_parse']}, drop_area={off_stats['drop_area']}, "
        f"drop_other={off_stats['drop_other']}) ← {raw_off}"
    )
    print(
        f"ready:    kept {ready_stats['kept']}/{ready_stats['raw']} "
        f"(drop_parse={ready_stats['drop_parse']}, drop_area={ready_stats['drop_area']}, "
        f"drop_other={ready_stats['drop_other']}) ← {raw_ready}"
    )
    print(f"Wrote → {OUT_DIR}/phuket_off_plan.csv, phuket_ready.csv (FX={FX_RATE})")


if __name__ == "__main__":
    try:
        main()
    except FileNotFoundError as e:
        print(e, file=sys.stderr)
        sys.exit(1)
