from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth import verify_api_key
from app.services.load_matcher import get_load_by_id

router = APIRouter(prefix="/negotiations", tags=["negotiations"])

CEILING_PCT = 1.15  # maximum Acme will pay above loadboard_rate (hard reject beyond this)
MAX_ROUNDS = 3


class EvaluateRequest(BaseModel):
    load_id: str
    offered_rate: float
    round_number: int  # 1-3


class EvaluateResponse(BaseModel):
    decision: str  # "accept" | "counter" | "reject"
    counter_rate: float | None
    message: str


def _get_loadboard_rate(load_id: str) -> float | None:
    load = get_load_by_id(load_id)
    return float(load["loadboard_rate"]) if load else None


@router.post("/evaluate", response_model=EvaluateResponse)
def evaluate_offer(
    body: EvaluateRequest,
    _: str = Depends(verify_api_key),
) -> EvaluateResponse:
    loadboard_rate = _get_loadboard_rate(body.load_id)
    if loadboard_rate is None:
        raise HTTPException(status_code=404, detail=f"Load {body.load_id} not found")

    ceiling = round(loadboard_rate * CEILING_PCT, 2)
    offered = body.offered_rate
    round_num = max(1, min(body.round_number, MAX_ROUNDS))

    # Carrier accepted at or below our loadboard rate — great deal
    if offered <= loadboard_rate:
        return EvaluateResponse(
            decision="accept",
            counter_rate=None,
            message=f"We can work with that. Rate of ${offered:,.0f} is accepted.",
        )

    # Carrier is asking way too much — reject immediately
    if offered > ceiling:
        return EvaluateResponse(
            decision="reject",
            counter_rate=None,
            message=(
                f"Unfortunately we can't go above ${loadboard_rate:,.0f} on this load. "
                "We're too far apart to make this work. Thank you for your time."
            ),
        )

    # Rounds exhausted — reject
    if round_num >= MAX_ROUNDS:
        return EvaluateResponse(
            decision="reject",
            counter_rate=None,
            message=(
                f"We've reached the end of our negotiation. "
                f"Our best offer remains ${loadboard_rate:,.0f}. Thank you for your time."
            ),
        )

    # Counter at midpoint between loadboard rate and carrier's ask, rounded to nearest $25
    raw_counter = (offered + loadboard_rate) / 2
    counter = round(raw_counter / 25) * 25
    counter = min(counter, ceiling)

    return EvaluateResponse(
        decision="counter",
        counter_rate=counter,
        message=(
            f"We can come up to ${counter:,.0f} — that's our best offer on this load."
        ),
    )
