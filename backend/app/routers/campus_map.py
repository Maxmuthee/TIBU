"""Campus Navigator — USIU-Africa building locations and OpenStreetMap routing.

Building coordinates come from `app/resources/campus_locations.json`, which is
sourced from OpenStreetMap (Overpass API, campus boundary way 321620567) and
refreshable via `scripts/fetch_campus_osm.py`.

Walking directions are proxied to OpenRouteService (foot-walking profile, which
routes along real OSM footpaths). The API key stays server-side.
"""

import json
from pathlib import Path

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.config import get_settings

router = APIRouter()
settings = get_settings()

# ---------------------------------------------------------------------------
# Canonical location data (OpenStreetMap-derived, curated names/categories)
# ---------------------------------------------------------------------------
_DATA_FILE = Path(__file__).resolve().parents[1] / "resources" / "campus_locations.json"


def _load_locations() -> list[dict]:
    data = json.loads(_DATA_FILE.read_text(encoding="utf-8"))
    return data["locations"]


CAMPUS_LOCATIONS: list[dict] = _load_locations()

ORS_DIRECTIONS_URL = "https://api.openrouteservice.org/v2/directions/foot-walking/geojson"


class LocationQuery(BaseModel):
    destination: str


class RouteQuery(BaseModel):
    # [lng, lat] pairs — GeoJSON / OpenRouteService coordinate order.
    start: list[float]
    end: list[float]


@router.get("/locations")
async def list_locations():
    """List all known campus locations."""
    return {"locations": CAMPUS_LOCATIONS}


@router.post("/find")
async def find_location(query: LocationQuery):
    """Search for a campus location by name, department, category, or code."""
    search = query.destination.lower().strip()
    matches = []

    for loc in CAMPUS_LOCATIONS:
        searchable = " ".join([
            loc.get("name", ""),
            loc.get("description", ""),
            loc.get("building_code", ""),
            loc.get("category", ""),
            " ".join(loc.get("departments", [])),
        ]).lower()

        if search in searchable:
            matches.append(loc)

    if matches:
        return {"found": True, "locations": matches}

    return {
        "found": False,
        "message": (
            f"No location found for '{query.destination}'. Try a building name, "
            "department, or category like 'library', 'administration', or 'Computer Science'."
        ),
    }


@router.post("/route")
async def route(query: RouteQuery):
    """Walking route between two points along real OSM campus paths.

    Proxies OpenRouteService so the API key is never exposed to the browser.
    Returns a GeoJSON LineString plus distance (m) and duration (s). Falls back
    to a straight line if the key is missing or the service is unreachable, so
    the map still shows a usable direction.
    """
    if len(query.start) != 2 or len(query.end) != 2:
        raise HTTPException(status_code=422, detail="start and end must be [lng, lat] pairs")

    def straight_line(reason: str) -> dict:
        (slng, slat), (elng, elat) = query.start, query.end
        dx = (elat - slat) * 111_000
        dy = (elng - slng) * 111_000
        dist = (dx * dx + dy * dy) ** 0.5
        return {
            "ok": False,
            "fallback": reason,
            "geometry": {"type": "LineString", "coordinates": [query.start, query.end]},
            "distance": round(dist),
            "duration": round(dist / 1.4),  # ~1.4 m/s walking
        }

    api_key = getattr(settings, "openrouteservice_api_key", "")
    if not api_key:
        return straight_line("no_api_key")

    try:
        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                ORS_DIRECTIONS_URL,
                headers={"Authorization": api_key, "Content-Type": "application/json"},
                json={"coordinates": [query.start, query.end]},
            )
            resp.raise_for_status()
            data = resp.json()
        feature = data["features"][0]
        summary = feature["properties"]["summary"]
        return {
            "ok": True,
            "geometry": feature["geometry"],
            "distance": round(summary.get("distance", 0)),
            "duration": round(summary.get("duration", 0)),
        }
    except Exception:  # noqa: BLE001 — degrade gracefully to a straight line
        return straight_line("routing_unavailable")
