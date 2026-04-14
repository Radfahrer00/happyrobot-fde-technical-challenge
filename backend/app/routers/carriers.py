from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.auth import verify_api_key
from app.services.fmcsa import verify_carrier

router = APIRouter(prefix="/carriers", tags=["carriers"])


class VerifyRequest(BaseModel):
    mc_number: str


class VerifyResponse(BaseModel):
    eligible: bool
    carrier_name: str | None
    authority_type: str | None
    reason: str | None


@router.post("/verify", response_model=VerifyResponse)
async def verify(
    body: VerifyRequest,
    _: str = Depends(verify_api_key),
) -> VerifyResponse:
    result = await verify_carrier(body.mc_number)
    return VerifyResponse(**result)
