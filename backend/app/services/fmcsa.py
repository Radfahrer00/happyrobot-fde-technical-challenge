"""FMCSA carrier verification service.

Docs: https://mobile.fmcsa.dot.gov/developer/apidoc.page
Endpoint: GET /qc/services/carriers/docket-number/{mc}?webKey={key}
"""

import httpx

from app.auth import settings

FMCSA_BASE = "https://mobile.fmcsa.dot.gov/qc/services/carriers"


async def verify_carrier(mc_number: str) -> dict:
    """Return eligibility info for a carrier by MC number.

    Returns a dict with keys:
        eligible (bool), carrier_name (str|None), authority_type (str|None), reason (str|None)
    """
    if not settings.fmcsa_api_key:
        # Fallback for local dev without a real key — treat as eligible
        return {
            "eligible": True,
            "carrier_name": f"Carrier MC-{mc_number}",
            "authority_type": "Common",
            "reason": None,
        }

    url = f"{FMCSA_BASE}/docket-number/{mc_number}"
    params = {"webKey": settings.fmcsa_api_key}

    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(url, params=params)

    if response.status_code == 404:
        return {
            "eligible": False,
            "carrier_name": None,
            "authority_type": None,
            "reason": "MC number not found in FMCSA registry",
        }

    response.raise_for_status()
    data = response.json()

    content = data.get("content", [])
    if not content:
        return {
            "eligible": False,
            "carrier_name": None,
            "authority_type": None,
            "reason": "No carrier record found for this MC number",
        }

    carrier = content[0].get("carrier", {})
    allowed = carrier.get("allowedToOperate", "N")
    carrier_name = carrier.get("legalName") or carrier.get("dbaName")
    authority_type = carrier.get("carrierOperation", {}).get("carrierOperationDesc")

    # Check active out-of-service orders
    oos_driver = carrier.get("oosDate")
    oos_vehicle = carrier.get("oosVehicleDate")
    has_oos = bool(oos_driver or oos_vehicle)

    if allowed != "Y":
        return {
            "eligible": False,
            "carrier_name": carrier_name,
            "authority_type": authority_type,
            "reason": "Carrier is not authorized to operate",
        }

    if has_oos:
        return {
            "eligible": False,
            "carrier_name": carrier_name,
            "authority_type": authority_type,
            "reason": "Carrier has active out-of-service orders",
        }

    return {
        "eligible": True,
        "carrier_name": carrier_name,
        "authority_type": authority_type,
        "reason": None,
    }
