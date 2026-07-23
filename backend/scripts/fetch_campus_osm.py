"""Fetch USIU-Africa campus features from OpenStreetMap (Overpass API).

Two uses:
  1. `--verify`  — compare the coordinates in app/resources/campus_locations.json
                   against live OSM (by osm_id) and print any drift.
  2. `--dump`    — dump every named feature inside the campus boundary so new
                   buildings can be added to the curated JSON by hand.

The curated JSON keeps nice display names / categories / descriptions; OSM is
the source of truth for the *coordinates* only. Run this after mapathons or
when the campus footprint changes.

    python scripts/fetch_campus_osm.py --verify
    python scripts/fetch_campus_osm.py --dump
"""

import argparse
import json
import sys
from pathlib import Path

import httpx

# USIU-Africa campus boundary (amenity=university) in OpenStreetMap.
CAMPUS_WAY_ID = 321620567
DATA_FILE = Path(__file__).resolve().parents[1] / "app" / "resources" / "campus_locations.json"

# Public mirrors — tried in order; the main server is often busy.
ENDPOINTS = [
    "https://overpass.kumi.systems/api/interpreter",
    "https://overpass-api.de/api/interpreter",
]

# Named buildings, amenities, leisure and gates inside the campus area.
QUERY = f"""
[out:json][timeout:120];
way({CAMPUS_WAY_ID});map_to_area->.campus;
(
  way["building"](area.campus);
  way["amenity"](area.campus);
  node["amenity"](area.campus);
  way["leisure"](area.campus);
  node["barrier"](area.campus);
);
out center tags;
"""


def fetch() -> list[dict]:
    last_err = None
    for url in ENDPOINTS:
        try:
            # GET with a urlencoded `data` param — Overpass mirrors accept this
            # more reliably than a POST form body. A User-Agent is required by
            # some mirrors (overpass-api.de returns 406 without one).
            r = httpx.get(
                url,
                params={"data": QUERY.strip()},
                headers={"User-Agent": "TIBU-CampusNavigator/1.0 (USIU-Africa)"},
                timeout=150,
            )
            r.raise_for_status()
            return r.json()["elements"]
        except Exception as e:  # noqa: BLE001 — try the next mirror
            last_err = e
            print(f"  ! {url} failed: {e}", file=sys.stderr)
    raise SystemExit(f"All Overpass mirrors failed. Last error: {last_err}")


def coords(el: dict) -> tuple[float, float] | None:
    c = el.get("center") or {"lat": el.get("lat"), "lon": el.get("lon")}
    if c.get("lat") is None or c.get("lon") is None:
        return None
    return c["lat"], c["lon"]


def verify(elements: list[dict]) -> None:
    by_id = {f"{e['type']}/{e['id']}": e for e in elements}
    data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    drift = 0
    for loc in data["locations"]:
        osm_id = loc.get("osm_id")
        el = by_id.get(osm_id) if osm_id else None
        if not el:
            print(f"  ? {loc['name']:<40} osm_id {osm_id!r} not found in campus")
            continue
        c = coords(el)
        if not c:
            continue
        dlat = abs(c[0] - loc["lat"])
        dlng = abs(c[1] - loc["lng"])
        meters = ((dlat * 111_000) ** 2 + (dlng * 111_000) ** 2) ** 0.5
        if meters > 5:  # more than ~5 m off
            drift += 1
            print(f"  ~ {loc['name']:<40} {meters:5.0f} m off  "
                  f"json=({loc['lat']:.7f},{loc['lng']:.7f}) osm=({c[0]:.7f},{c[1]:.7f})")
    print(f"\nDone. {drift} location(s) drifted more than 5 m from OSM.")


def dump(elements: list[dict]) -> None:
    named = [e for e in elements if e.get("tags", {}).get("name")]
    named.sort(key=lambda e: e["tags"]["name"].lower())
    for e in named:
        t = e["tags"]
        c = coords(e)
        ll = f"{c[0]:.7f},{c[1]:.7f}" if c else "NO-CENTER"
        kind = t.get("building") or t.get("amenity") or t.get("leisure") or t.get("barrier") or ""
        print(f"{e['type']}/{e['id']:<12} {ll}  [{kind}]  {t['name']}")
    print(f"\n{len(named)} named feature(s) inside the campus boundary.")


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--verify", action="store_true", help="check curated JSON coords against OSM")
    ap.add_argument("--dump", action="store_true", help="list all named campus features")
    args = ap.parse_args()
    if not (args.verify or args.dump):
        ap.error("choose --verify or --dump")

    print(f"Fetching campus features from Overpass (boundary way {CAMPUS_WAY_ID})...")
    elements = fetch()
    print(f"Got {len(elements)} elements.\n")

    if args.dump:
        dump(elements)
    if args.verify:
        verify(elements)


if __name__ == "__main__":
    main()
