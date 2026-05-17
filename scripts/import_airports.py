#!/usr/bin/env python3
import csv
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]

REGION_FILES = [
    {
        "path": "Fly Washington Passport Program (RT)- Northwest Region.csv",
        "region_id": "northwest",
        "region_label": "Northwest",
        "id_base": 1000,
        "type": "airport",
    },
    {
        "path": "Fly Washington Passport Program (RT)- Olympic Region.csv",
        "region_id": "olympic",
        "region_label": "Olympic",
        "id_base": 2000,
        "type": "airport",
    },
    {
        "path": "Fly Washington Passport Program (RT)- Southwest Region.csv",
        "region_id": "southwest",
        "region_label": "Southwest",
        "id_base": 3000,
        "type": "airport",
    },
    {
        "path": "Fly Washington Passport Program (RT)- Eastern Region.csv",
        "region_id": "eastern",
        "region_label": "Eastern",
        "id_base": 4000,
        "type": "airport",
    },
    {
        "path": "Fly Washington Passport Program (RT)- North Central.csv",
        "region_id": "north-central",
        "region_label": "North Central",
        "id_base": 5000,
        "type": "airport",
    },
    {
        "path": "Fly Washington Passport Program (RT)- South Central.csv",
        "region_id": "south-central",
        "region_label": "South Central",
        "id_base": 6000,
        "type": "airport",
    },
    {
        "path": "Fly Washington Passport Program (RT)- Seaplane Bases.csv",
        "region_id": "seaplane-bases",
        "region_label": "Seaplane Base",
        "id_base": 7000,
        "type": "seaplane_base",
    },
]

POINT_RE = re.compile(r"POINT\s*\(\s*([-0-9.]+)\s+([-0-9.]+)\s*\)")
PAREN_CODE_RE = re.compile(r"\(([A-Z0-9]{2,5})\)\s*$")
TRAILING_CODE_RE = re.compile(r"\s+([A-Z0-9]{2,5})\s*$")


def main():
    airports = []
    for config in REGION_FILES:
        records = read_region(config)
        for index, record in enumerate(records, start=1):
            airports.append(to_airport(record, config, config["id_base"] + index))

    output = ROOT / "data" / "airports.json"
    output.write_text(json.dumps(airports, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Wrote {len(airports)} airports to {output.relative_to(ROOT)}")


def read_region(config):
    path = ROOT / config["path"]
    rows = list(csv.reader(path.read_text(encoding="utf-8-sig").splitlines()))
    records = []
    current = None

    for row in rows[1:]:
        if not row or not any(cell.strip() for cell in row):
            continue

        if row[0].startswith("POINT"):
            if current:
                records.append(parse_record_rows(current, config))
            current = [row]
        elif current:
            current.append(row)

    if current:
        records.append(parse_record_rows(current, config))

    return records


def parse_record_rows(rows, config):
    start_row = rows[0]
    longitude, latitude = parse_point(start_row[0])
    data_parts = start_row[2:]
    for continuation in rows[1:]:
        data_parts.extend(continuation)

    lat_index = find_coordinate_index(data_parts, latitude, longitude)
    address_parts = data_parts[:lat_index]
    stamp_parts = data_parts[lat_index + 2 :]

    return {
        "display_name": clean_text(start_row[1]),
        "address": join_parts(address_parts),
        "latitude": latitude,
        "longitude": longitude,
        "stamp_parts": clean_continuation(stamp_parts, config["region_label"]),
    }


def parse_point(value):
    match = POINT_RE.search(value)
    if not match:
        raise ValueError(f"Could not parse WKT point: {value}")
    return float(match.group(1)), float(match.group(2))


def find_coordinate_index(row, latitude, longitude):
    for index in range(0, len(row) - 1):
        first = parse_float(row[index])
        second = parse_float(row[index + 1])
        if first is None or second is None:
            continue
        if abs(first - latitude) < 0.0001 and abs(second - longitude) < 0.0001:
            return index
    raise ValueError(f"Could not find lat/lon columns in row: {row}")


def to_airport(record, config, airport_id):
    display_name = record["display_name"]
    faa_id = extract_faa_id(display_name)
    name = extract_name(display_name, faa_id)

    return {
        "id": airport_id,
        "faaId": faa_id,
        "name": name,
        "displayName": display_name,
        "type": config["type"],
        "regionId": config["region_id"],
        "address": record["address"],
        "latitude": record["latitude"],
        "longitude": record["longitude"],
        "stampLocation": join_parts(record["stamp_parts"]) or "To be added.",
        "status": "active",
        "effectiveFrom": "2026-05-16",
        "effectiveTo": None,
        "aliases": [],
        "links": [],
        "notes": "",
    }


def extract_faa_id(display_name):
    paren_match = PAREN_CODE_RE.search(display_name)
    if paren_match:
        return paren_match.group(1)

    trailing_match = TRAILING_CODE_RE.search(display_name)
    if trailing_match:
        return trailing_match.group(1)

    return None


def extract_name(display_name, faa_id):
    if not faa_id:
        return display_name

    paren_suffix = f" ({faa_id})"
    if display_name.endswith(paren_suffix):
        return display_name[: -len(paren_suffix)].strip()

    return TRAILING_CODE_RE.sub("", display_name).strip()


def clean_continuation(parts, region_label):
    cleaned = []
    region_values = {
        region_label.lower(),
        f"{region_label.lower()} region",
        "seaplane bases",
    }

    for part in parts:
        value = clean_text(part)
        if not value:
            continue
        if value.lower().strip() in region_values:
            continue
        cleaned.append(value)
    return cleaned


def join_parts(parts):
    return clean_text(" ".join(part for part in parts if clean_text(part))) or None


def clean_text(value):
    return re.sub(r"\s+", " ", str(value).replace("\xa0", " ")).strip()


def parse_float(value):
    try:
        return float(clean_text(value))
    except ValueError:
        return None


if __name__ == "__main__":
    main()
