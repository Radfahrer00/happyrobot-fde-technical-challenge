from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from app.auth import verify_api_key
from app.services.load_matcher import get_load_by_id

router = APIRouter(prefix="/negotiations", tags=["negotiations"])

FLOOR_PCT = 0.85  # minimum acceptable rate as % of loadboard_rate
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

    floor = round(loadboard_rate * FLOOR_PCT, 2)
    offered = body.offered_rate
    round_num = max(1, min(body.round_number, MAX_ROUNDS))

    if offered >= floor:
        return EvaluateResponse(
            decision="accept",
            counter_rate=None,
            message=f"We can work with that. Rate of ${offered:,.0f} is accepted.",
        )

    if round_num >= MAX_ROUNDS:
        return EvaluateResponse(
            decision="reject",
            counter_rate=None,
            message=(
                f"Unfortunately we're unable to go below ${floor:,.0f} on this load. "
                "We've reached the end of our negotiation. Thank you for your time."
            ),
        )

    # Counter at midpoint, rounded to nearest $25
    raw_counter = (offered + loadboard_rate) / 2
    counter = round(raw_counter / 25) * 25
    counter = max(counter, floor)

    return EvaluateResponse(
        decision="counter",
        counter_rate=counter,
        message=(
            f"Our best counter is ${counter:,.0f}. "
            f"The loadboard rate is ${loadboard_rate:,.0f} and we need to stay close to that."
        ),
    )
