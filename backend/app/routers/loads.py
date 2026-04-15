from datetime import datetime, timezone

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import verify_api_key
from app.database import get_db
from app.models import CallRecord
from app.services.load_matcher import search_loads, _load_data, CITY_COORDS

router = APIRouter(prefix="/loads", tags=["loads"])


class Load(BaseModel):
    load_id: str
    origin: str
    destination: str
    pickup_datetime: str
    delivery_datetime: str
    equipment_type: str
    loadboard_rate: float
    notes: str
    weight: int
    commodity_type: str
    num_of_pieces: int
    miles: int
    dimensions: str


class LoadWithCoords(Load):
    origin_lat: float | None = None
    origin_lng: float | None = None
    dest_lat: float | None = None
    dest_lng: float | None = None


@router.get("/all", response_model=list[LoadWithCoords])
def get_all_loads(_: str = Depends(verify_api_key)) -> list[LoadWithCoords]:
    """Return all loads with lat/lng coordinates attached for map rendering."""
    result = []
    for load in _load_data():
        origin_coords = CITY_COORDS.get(load["origin"])
        dest_coords = CITY_COORDS.get(load["destination"])
        result.append(LoadWithCoords(
            **load,
            origin_lat=origin_coords[0] if origin_coords else None,
            origin_lng=origin_coords[1] if origin_coords else None,
            dest_lat=dest_coords[0] if dest_coords else None,
            dest_lng=dest_coords[1] if dest_coords else None,
        ))
    return result


@router.get("/aging")
def get_aging_loads(
    limit: int = Query(default=25, ge=1, le=100),
    db: Session = Depends(get_db),
    _: str = Depends(verify_api_key),
) -> list[dict]:
    """Return unbooked loads sorted by nearest pickup date (most urgent first)."""
    booked_ids = {
        r.load_id
        for r in db.query(CallRecord).filter(CallRecord.outcome == "booking_confirmed").all()
        if r.load_id
    }

    now = datetime.now(timezone.utc)
    aging = []

    for load in _load_data():
        if load["load_id"] in booked_ids:
            continue
        try:
            pickup = datetime.fromisoformat(load["pickup_datetime"])
            if pickup.tzinfo is None:
                pickup = pickup.replace(tzinfo=timezone.utc)
        except (ValueError, AttributeError):
            continue

        days_until = (pickup - now).days
        aging.append({
            "load_id": load["load_id"],
            "origin": load["origin"],
            "destination": load["destination"],
            "equipment_type": load["equipment_type"],
            "loadboard_rate": load["loadboard_rate"],
            "pickup_datetime": load["pickup_datetime"],
            "days_until_pickup": days_until,
        })

    aging.sort(key=lambda x: x["days_until_pickup"])
    return aging[:limit]


class LoadSearchResponse(BaseModel):
    data: list[Load]


@router.get("/search", response_model=LoadSearchResponse)
def search(
    origin: str | None = Query(default=None),
    destination: str | None = Query(default=None),
    equipment_type: str | None = Query(default=None),
    _: str = Depends(verify_api_key),
) -> LoadSearchResponse:
    results = search_loads(origin=origin, destination=destination, equipment_type=equipment_type)
    return LoadSearchResponse(data=[Load(**r) for r in results])
