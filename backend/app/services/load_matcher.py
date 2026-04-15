"""Load search and matching logic against the static loads dataset."""

import json
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path

DATA_FILE = Path(__file__).parent.parent / "data" / "loads.json"

# Lat/lng for every city that appears in loads.json
CITY_COORDS: dict[str, tuple[float, float]] = {
    "Chicago, IL": (41.8827, -87.6233),
    "Dallas, TX": (32.7767, -96.7970),
    "Atlanta, GA": (33.7490, -84.3880),
    "Los Angeles, CA": (34.0522, -118.2437),
    "Houston, TX": (29.7604, -95.3698),
    "Miami, FL": (25.7617, -80.1918),
    "Seattle, WA": (47.6062, -122.3321),
    "Denver, CO": (39.7392, -104.9903),
    "New York, NY": (40.7128, -74.0060),
    "Nashville, TN": (36.1627, -86.7816),
    "Phoenix, AZ": (33.4484, -112.0740),
    "Minneapolis, MN": (44.9778, -93.2650),
    "Memphis, TN": (35.1495, -90.0490),
    "Charlotte, NC": (35.2271, -80.8431),
    "Philadelphia, PA": (39.9526, -75.1652),
    "Boston, MA": (42.3601, -71.0589),
    "Kansas City, MO": (39.0997, -94.5786),
    "St. Louis, MO": (38.6270, -90.1994),
    "Indianapolis, IN": (39.7684, -86.1581),
    "Columbus, OH": (39.9612, -82.9988),
    "Detroit, MI": (42.3314, -83.0458),
    "Louisville, KY": (38.2527, -85.7585),
    "Cincinnati, OH": (39.1031, -84.5120),
    "Salt Lake City, UT": (40.7608, -111.8910),
    "Portland, OR": (45.5051, -122.6750),
    "San Francisco, CA": (37.7749, -122.4194),
    "San Diego, CA": (32.7157, -117.1611),
}


@lru_cache(maxsize=1)
def _load_data() -> list[dict]:
    with open(DATA_FILE) as f:
        return json.load(f)


def _city_matches(field: str, query: str) -> bool:
    """Case-insensitive substring match on city portion of 'City, ST'."""
    return query.strip().lower() in field.lower()


def get_load_by_id(load_id: str) -> dict | None:
    for load in _load_data():
        if load["load_id"] == load_id:
            return load
    return None


def search_loads(
    origin: str | None = None,
    destination: str | None = None,
    equipment_type: str | None = None,
    limit: int = 3,
) -> list[dict]:
    """Return up to `limit` loads matching the given filters.

    Sorts by proximity of pickup_datetime to now so the most imminent
    loads surface first.
    """
    loads = _load_data()
    now = datetime.now(timezone.utc)
    results = []

    for load in loads:
        if origin and not _city_matches(load["origin"], origin):
            continue
        if destination and not _city_matches(load["destination"], destination):
            continue
        if equipment_type and equipment_type.strip().lower() not in load[
            "equipment_type"
        ].lower():
            continue
        # Skip loads with past pickup dates
        try:
            pickup = datetime.fromisoformat(load["pickup_datetime"])
            if pickup.tzinfo is None:
                pickup = pickup.replace(tzinfo=timezone.utc)
            if pickup < now:
                continue
        except (ValueError, KeyError):
            pass
        results.append(load)


    def pickup_delta(load: dict) -> float:
        try:
            pickup = datetime.fromisoformat(load["pickup_datetime"])
            if pickup.tzinfo is None:
                pickup = pickup.replace(tzinfo=timezone.utc)
            return abs((pickup - now).total_seconds())
        except (ValueError, KeyError):
            return float("inf")

    results.sort(key=pickup_delta)
    return results[:limit]
