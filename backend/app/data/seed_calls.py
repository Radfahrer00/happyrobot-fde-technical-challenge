"""Generate realistic historical call records for dashboard demo purposes.

Demo storyline: the AI agent is performing well — high booking rate (~58%),
predominantly positive carrier sentiment, efficient negotiations mostly closing
in 1 round. This tells a compelling story for the Acme Logistics sales demo.
"""

import random
import uuid
from datetime import datetime, timedelta, timezone

from app.models import CallRecord

CARRIER_NAMES = [
    "Swift Transportation", "Werner Enterprises", "JB Hunt Transport",
    "Schneider National", "Knight-Swift", "Old Dominion Freight",
    "Yellow Corporation", "Saia Inc", "XPO Logistics", "Estes Express",
    "AAA Cooper Transportation", "Southeastern Freight Lines",
    "Heartland Express", "Marten Transport", "USA Truck",
    "Covenant Transport", "Universal Truckload Services", "Prime Inc",
    "Melton Truck Lines", "Groendyke Transport", "TransAm Trucking",
    "Crete Carrier Corporation", "CR England", "Roehl Transport",
    "Hirschbach Motor Lines", "US Xpress", "Boyd Bros Transportation",
    "PS Logistics", "PAM Transport", "KLLM Transport Services",
]

MC_NUMBERS = [f"{random.randint(100000, 999999)}" for _ in range(30)]

LOAD_IDS = [f"L{str(i).zfill(3)}" for i in range(1, 51)]

# Demo-optimized outcome distribution: ~58% booked, low failure rates
OUTCOMES = [
    "booking_confirmed",    # ×12
    "booking_confirmed",
    "booking_confirmed",
    "booking_confirmed",
    "booking_confirmed",
    "booking_confirmed",
    "booking_confirmed",
    "booking_confirmed",
    "booking_confirmed",
    "booking_confirmed",
    "booking_confirmed",
    "booking_confirmed",
    "call_transferred",     # ×3  — agent correctly escalates complex cases
    "call_transferred",
    "call_transferred",
    "negotiation_failed",   # ×2  — rare, carrier asked well below floor
    "negotiation_failed",
    "carrier_ineligible",   # ×1  — FMCSA filtering working as expected
    "no_suitable_loads",    # ×1  — honest no-match
    "other",                # ×1
]

# Demo-optimized sentiment: majority positive, minimal frustration
SENTIMENTS = [
    "positive", "positive", "positive", "positive", "positive",  # ×5
    "positive", "positive", "positive",                           # ×3 → 8 total
    "neutral", "neutral", "neutral",                              # ×3
    "confused",                                                   # ×1
    "frustrated",                                                 # ×1
    "other",                                                      # ×1
]

LOADBOARD_RATES = [
    400, 550, 650, 650, 680, 700, 700, 750, 750, 750,
    800, 850, 900, 900, 950, 950, 1000, 1100, 1200, 1250,
    1300, 1300, 1450, 1600, 1650, 1700, 1750, 1800, 1850, 1950,
    2100, 2100, 2200, 2450, 2900, 3400,
]


def generate_seed_records(count: int = 150) -> list[CallRecord]:
    rng = random.Random(42)
    now = datetime.now(timezone.utc)
    records = []

    for i in range(count):
        days_ago = rng.uniform(0, 30)
        ts = now - timedelta(days=days_ago, hours=rng.uniform(0, 10))

        outcome = rng.choice(OUTCOMES)
        sentiment = rng.choice(SENTIMENTS)

        # Sentiment strongly correlates with outcome for realism
        if outcome == "booking_confirmed":
            sentiment = rng.choice(["positive", "positive", "positive", "positive", "neutral"])
        elif outcome == "call_transferred":
            sentiment = rng.choice(["positive", "positive", "neutral"])
        elif outcome == "carrier_ineligible":
            sentiment = rng.choice(["neutral", "frustrated", "confused"])
        elif outcome == "negotiation_failed":
            sentiment = rng.choice(["frustrated", "frustrated", "neutral"])
        elif outcome == "no_suitable_loads":
            sentiment = rng.choice(["neutral", "confused", "positive"])

        loadboard_rate = float(rng.choice(LOADBOARD_RATES))
        load_id = rng.choice(LOAD_IDS) if outcome not in ("carrier_ineligible", "other") else None

        agreed_rate = None
        negotiation_rounds = 0

        if outcome == "booking_confirmed":
            # Most deals close in 0-1 rounds, near loadboard rate (good broker margin)
            negotiation_rounds = rng.choice([0, 0, 0, 1, 1, 1, 2])
            floor = loadboard_rate * 0.85
            if negotiation_rounds == 0:
                # Carrier accepted at or close to board rate
                agreed_rate = round(rng.uniform(loadboard_rate * 0.95, loadboard_rate) / 25) * 25
            elif negotiation_rounds == 1:
                agreed_rate = round(rng.uniform(loadboard_rate * 0.90, loadboard_rate) / 25) * 25
            else:
                agreed_rate = round(rng.uniform(floor, loadboard_rate * 0.93) / 25) * 25
            agreed_rate = max(agreed_rate, floor)

        elif outcome == "negotiation_failed":
            negotiation_rounds = rng.choice([2, 3, 3])

        elif outcome == "call_transferred":
            # Transferred after agreeing — at or very near board rate
            negotiation_rounds = rng.choice([0, 1])
            agreed_rate = round(rng.uniform(loadboard_rate * 0.95, loadboard_rate) / 25) * 25

        carrier_idx = i % len(CARRIER_NAMES)
        mc_idx = i % len(MC_NUMBERS)

        records.append(
            CallRecord(
                call_id=str(uuid.uuid4()),
                timestamp=ts,
                mc_number=MC_NUMBERS[mc_idx],
                carrier_name=CARRIER_NAMES[carrier_idx],
                load_id=load_id,
                agreed_rate=agreed_rate,
                loadboard_rate=loadboard_rate if outcome != "carrier_ineligible" else None,
                outcome=outcome,
                sentiment=sentiment,
                negotiation_rounds=negotiation_rounds,
            )
        )

    return records
