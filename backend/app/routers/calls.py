import uuid
from collections import defaultdict
from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.auth import verify_api_key
from app.database import get_db
from app.models import CallRecord
from app.services.load_matcher import get_load_by_id, CITY_COORDS

router = APIRouter(prefix="/calls", tags=["calls"])

VALID_OUTCOMES = {
    "booking_confirmed",
    "negotiation_failed",
    "carrier_ineligible",
    "no_suitable_loads",
    "call_transferred",
    "other",
}
VALID_SENTIMENTS = {"positive", "neutral", "frustrated", "confused", "other"}


class LogCallRequest(BaseModel):
    call_id: str | None = None
    mc_number: str
    carrier_name: str | None = None
    load_id: str | None = None
    agreed_rate: float | None = None
    loadboard_rate: float | None = None
    outcome: str
    sentiment: str
    negotiation_rounds: int = 0
    timestamp: datetime | None = None


class LogCallResponse(BaseModel):
    call_id: str
    status: str


@router.post("/log", response_model=LogCallResponse)
def log_call(
    body: LogCallRequest,
    db: Session = Depends(get_db),
    _: str = Depends(verify_api_key),
) -> LogCallResponse:
    outcome = body.outcome.lower().strip()
    sentiment = body.sentiment.lower().strip()

    if outcome not in VALID_OUTCOMES:
        outcome = "other"
    if sentiment not in VALID_SENTIMENTS:
        sentiment = "other"

    call_id = body.call_id or str(uuid.uuid4())
    ts = body.timestamp or datetime.now(timezone.utc)

    record = CallRecord(
        call_id=call_id,
        timestamp=ts,
        mc_number=body.mc_number,
        carrier_name=body.carrier_name,
        load_id=body.load_id,
        agreed_rate=body.agreed_rate,
        loadboard_rate=body.loadboard_rate,
        outcome=outcome,
        sentiment=sentiment,
        negotiation_rounds=body.negotiation_rounds,
    )
    db.add(record)
    db.commit()

    return LogCallResponse(call_id=call_id, status="logged")


@router.get("/metrics")
def get_metrics(
    days: int = Query(default=30, ge=1, le=365),
    db: Session = Depends(get_db),
    _: str = Depends(verify_api_key),
) -> dict:
    since = datetime.now(timezone.utc) - timedelta(days=days)
    records: list[CallRecord] = (
        db.query(CallRecord).filter(CallRecord.timestamp >= since).all()
    )

    total = len(records)
    booked = [r for r in records if r.outcome == "booking_confirmed"]

    outcome_breakdown: dict[str, int] = defaultdict(int)
    sentiment_breakdown: dict[str, int] = defaultdict(int)
    for r in records:
        outcome_breakdown[r.outcome] += 1
        sentiment_breakdown[r.sentiment] += 1

    agreed_rates = [r.agreed_rate for r in booked if r.agreed_rate]
    loadboard_rates = [r.loadboard_rate for r in booked if r.loadboard_rate]
    rate_deltas = [
        (r.agreed_rate - r.loadboard_rate) / r.loadboard_rate * 100
        for r in booked
        if r.agreed_rate and r.loadboard_rate
    ]
    neg_rounds = [r.negotiation_rounds for r in records if r.negotiation_rounds > 0]

    # Calls per day for sparkline / time series
    calls_by_date: dict[str, int] = defaultdict(int)
    for r in records:
        day = r.timestamp.strftime("%Y-%m-%d") if r.timestamp else "unknown"
        calls_by_date[day] += 1

    calls_over_time = sorted(
        [{"date": d, "count": c} for d, c in calls_by_date.items()],
        key=lambda x: x["date"],
    )

    # Recent calls (last 20) for the table
    recent = sorted(records, key=lambda r: r.timestamp or datetime.min, reverse=True)[:20]
    recent_calls = [
        {
            "call_id": r.call_id,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
            "mc_number": r.mc_number,
            "carrier_name": r.carrier_name,
            "load_id": r.load_id,
            "agreed_rate": r.agreed_rate,
            "loadboard_rate": r.loadboard_rate,
            "outcome": r.outcome,
            "sentiment": r.sentiment,
            "negotiation_rounds": r.negotiation_rounds,
        }
        for r in recent
    ]

    # Negotiation funnel: calls that entered negotiation (booked or failed)
    neg_calls = [r for r in records if r.outcome in ("booking_confirmed", "negotiation_failed")]
    funnel_buckets: dict[str, dict[str, int]] = {
        "Round 1": {"booked": 0, "failed": 0},
        "Round 2": {"booked": 0, "failed": 0},
        "Round 3+": {"booked": 0, "failed": 0},
    }
    for r in neg_calls:
        if r.negotiation_rounds == 0:
            bucket = "Round 1"
        elif r.negotiation_rounds == 1:
            bucket = "Round 2"
        else:
            bucket = "Round 3+"
        key = "booked" if r.outcome == "booking_confirmed" else "failed"
        funnel_buckets[bucket][key] += 1

    negotiation_funnel = [
        {"label": label, "booked": v["booked"], "failed": v["failed"]}
        for label, v in funnel_buckets.items()
    ]

    return {
        "total_calls": total,
        "booked_count": len(booked),
        "booking_rate": round(len(booked) / total * 100, 1) if total else 0,
        "avg_agreed_rate": round(sum(agreed_rates) / len(agreed_rates), 2) if agreed_rates else None,
        "avg_loadboard_rate": round(sum(loadboard_rates) / len(loadboard_rates), 2) if loadboard_rates else None,
        "avg_rate_delta_pct": round(sum(rate_deltas) / len(rate_deltas), 2) if rate_deltas else None,
        "outcome_breakdown": dict(outcome_breakdown),
        "sentiment_breakdown": dict(sentiment_breakdown),
        "avg_negotiation_rounds": round(sum(neg_rounds) / len(neg_rounds), 1) if neg_rounds else 0,
        "calls_over_time": calls_over_time,
        "recent_calls": recent_calls,
        "negotiation_funnel": negotiation_funnel,
    }


@router.get("/geo")
def get_geo_stats(
    db: Session = Depends(get_db),
    _: str = Depends(verify_api_key),
) -> list[dict]:
    """Per-city demand: how many loads originate/terminate there and how many were booked."""
    records: list[CallRecord] = db.query(CallRecord).all()

    city_stats: dict[str, dict] = {}

    for record in records:
        if not record.load_id:
            continue
        load = get_load_by_id(record.load_id)
        if not load:
            continue
        for city_key in ("origin", "destination"):
            city = load[city_key]
            coords = CITY_COORDS.get(city)
            if not coords:
                continue
            if city not in city_stats:
                city_stats[city] = {
                    "city": city,
                    "lat": coords[0],
                    "lng": coords[1],
                    "total_loads": 0,
                    "booked": 0,
                }
            city_stats[city]["total_loads"] += 1
            if record.outcome == "booking_confirmed":
                city_stats[city]["booked"] += 1

    return sorted(city_stats.values(), key=lambda x: x["total_loads"], reverse=True)


@router.get("/list")
def list_calls(
    page: int = Query(default=1, ge=1),
    page_size: int = Query(default=20, ge=1, le=100),
    db: Session = Depends(get_db),
    _: str = Depends(verify_api_key),
) -> dict:
    offset = (page - 1) * page_size
    total = db.query(CallRecord).count()
    records = (
        db.query(CallRecord)
        .order_by(CallRecord.timestamp.desc())
        .offset(offset)
        .limit(page_size)
        .all()
    )

    return {
        "total": total,
        "page": page,
        "page_size": page_size,
        "items": [
            {
                "call_id": r.call_id,
                "timestamp": r.timestamp.isoformat() if r.timestamp else None,
                "mc_number": r.mc_number,
                "carrier_name": r.carrier_name,
                "load_id": r.load_id,
                "agreed_rate": r.agreed_rate,
                "loadboard_rate": r.loadboard_rate,
                "outcome": r.outcome,
                "sentiment": r.sentiment,
                "negotiation_rounds": r.negotiation_rounds,
            }
            for r in records
        ],
    }
